package main

import (
	"bufio"
	"context"
	"github.com/davecgh/go-spew/spew"
	"github.com/develar/app-builder/pkg/util"
	"github.com/develar/errors"
	"github.com/develar/go-fs-util"
	"github.com/logrusorgru/aurora"
	"github.com/panjf2000/ants"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"sync"
)

type Builder struct {
	graphhopperWebJar string

	mapDir            string
	elevationCacheDir string
	vehicles          []string

	// print errors in the end as total summary
	errors []string

	totalMemory int64

	executeContext context.Context

	isBuild             bool
	isUpload            bool
	isRemoveOsmOnImport bool

	uploadPool      *ants.PoolWithFunc
	uploadWaitGroup sync.WaitGroup
}

func (t *Builder) Init() error {
	if t.isUpload {
		err := t.initUploadPool()
		if err != nil {
			return err
		}
	}

	return nil
}

func getNodeJsScriptDir() string {
	if util.IsEnvTrue("USE_CWD_AS_NODE_SCRIPT_HOME") {
		return "scripts"
	}

	executableFile, err := os.Executable()
	if err != nil {
		log.Fatal(err)
	}
	return filepath.Join(filepath.Dir(executableFile), "..", "scripts")
}

func (t *Builder) appendError(message string) {
	log.Println(aurora.Red(message))
	t.errors = append(t.errors, message)
}

func (t *Builder) build(regionFile string) error {
	regions, err := t.readRegions(regionFile)
	if err != nil {
		return err
	}

	if t.isBuild {
		err = t.buildGraphData(regions)
		if err != nil {
			return err
		}
	} else {
		for _, region := range regions {
			err = t.upload(region.Name)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func (t *Builder) buildGraphData(regions []RegionInfo) error {
	buckets, err := t.computeBuckets(regions)
	if err != nil {
		return err
	}

	commonConfigFile, err := createCommonConfigFile()
	if err != nil {
		return errors.WithStack(err)
	}

	defer func() {
		err := os.Remove(commonConfigFile)
		if err != nil {
			log.Print(err)
		}
	}()

	for _, bucket := range buckets {
		if bucket.threadCount <= 0 {
			return errors.New("bucket threadCount must be greater than 0")
		}

		var regionNames strings.Builder
		regionNames.WriteString("Import ")
		for index, region := range bucket.regions {
			if index > 0 {
				regionNames.WriteString(", ")
			}
			regionNames.WriteString(region.Name)
		}

		log.Println(regionNames.String())

		err = util.MapAsync(len(bucket.regions), func(taskIndex int) (i func() error, e error) {
			return func() error {
				return t.buildRegion(bucket.regions[taskIndex], *bucket, commonConfigFile)
			}, nil
		})
		if err != nil {
			return err
		}
	}

	return nil
}

func (t *Builder) buildRegion(region RegionInfo, bucket Bucket, commonConfigFile string) error {
	graphDir := filepath.Join(filepath.Dir(region.File), region.Name+".osm-gh")
	err := fsutil.EnsureEmptyDir(graphDir)
	if err != nil {
		return err
	}

	//noinspection SpellCheckingInspection
	command := exec.CommandContext(t.executeContext, getJavaExecutablePath(),
		"-Xms1g", "-Xmx"+strconv.FormatInt(t.totalMemory, 10),
		"-Dgraphhopper.datareader.file="+region.File,
		"-Dgraphhopper.graph.location="+graphDir,
		"-Dgraphhopper.graph.elevation.cache_dir="+t.elevationCacheDir,
		"-Dgraphhopper.graph.elevation.provider=multi",

		"-Dgraphhopper.graph.flag_encoders="+strings.Join(t.vehicles, ","),
		"-Dgraphhopper.graph.bytes_for_flags=8",
		"-Dgraphhopper.prepare.ch.threads="+strconv.Itoa(bucket.threadCount),
		"-Dgraphhopper.prepare.ch.weightings=fastest",

		// configure the memory access, use RAM_STORE for well equipped servers (default and recommended)
		"-Dgraphhopper.graph.dataaccess=RAM_STORE",
		// Sort the graph after import to make requests roughly ~10% faster. Note that this requires significantly more RAM on import.
		"-Dgraphhopper.graph.do_sort=true",

		"-jar", t.graphhopperWebJar,
		"import", commonConfigFile)

	err = outputWithPrefix(command, region.Name)
	if err != nil {
		return err
	}

	err = command.Run()
	if err != nil {
		return errors.WithStack(err)
	}

	t.addFileToUploadQueue(region.Name)

	logPrefix := region.Name + " | "
	log.Println(aurora.Green(logPrefix + "imported").Bold())
	if t.isRemoveOsmOnImport {
		log.Println(logPrefix + "remove " + region.File + " to save disk space")
		err = os.Remove(region.File)
		if err != nil {
			return errors.WithStack(err)
		}
	}
	return nil
}

// pack into processing buckets to consume as mush machine resources as possible to build graphhopper data as faster as possible
func (t *Builder) computeBuckets(regions []RegionInfo) ([]*Bucket, error) {
	// sort from small to large (any error will be discovered faster)
	sort.Slice(regions, func(i, j int) bool {
		return regions[i].FileSize < regions[j].FileSize
	})

	var buckets []*Bucket

	totalThreadCount := runtime.NumCPU()
	recommendedThreadCount := int64(min(len(t.vehicles), totalThreadCount))

	currentBucket := &Bucket{
		threadCount: int(recommendedThreadCount),
	}
	buckets = append(buckets, currentBucket)

	// take in account only available memory, ignore CPU requirement for now
	availableMemory := t.totalMemory
	for _, region := range regions {
		requiredMemory := recommendedThreadCount * region.FileSize
		if availableMemory > requiredMemory {
		} else {
			if len(currentBucket.regions) == 0 {
				return nil, errors.New("File is too big (todo: can be handled using reduced number of threads, not implemented)")
			}

			// current bucket not suitable because memory not enough - create a new one
			currentBucket = &Bucket{
				threadCount: int(recommendedThreadCount),
			}
			availableMemory = t.totalMemory
			buckets = append(buckets, currentBucket)
		}

		currentBucket.regions = append(currentBucket.regions, region)
		availableMemory -= requiredMemory
	}

	spew.Dump(buckets)
	return buckets, nil
}

func (t *Builder) readRegions(regionFile string) ([]RegionInfo, error) {
	file, err := os.Open(regionFile)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	defer util.Close(file)

	scanner := bufio.NewScanner(file)
	var regions []RegionInfo
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if len(line) != 0 && line[0] != '#' {
			names := strings.SplitN(line, " ", 2)
			var name string
			if len(names) == 2 {
				name = names[1]
			} else {
				name = strings.TrimSuffix(names[0], "-latest")
			}

			regions = append(regions, RegionInfo{
				File: filepath.Join(t.mapDir, names[0]+".osm.pbf"),
				Name: name,
			})
		}
	}

	err = util.MapAsync(len(regions), func(taskIndex int) (i func() error, e error) {
		return func() error {
			fileInfo, err := os.Stat(regions[taskIndex].File)
			if err != nil {
				return nil
			}

			regions[taskIndex].FileSize = fileInfo.Size()
			return nil
		}, nil
	})
	if err != nil {
		return nil, errors.WithStack(err)
	}

	return regions, nil
}

type RegionInfo struct {
	File string
	Name string

	FileSize int64
}

type Bucket struct {
	regions     []RegionInfo
	threadCount int
}
