package builder

import (
	"context"
	"github.com/develar/app-builder/pkg/util"
	"github.com/develar/errors"
	"github.com/develar/go-fs-util"
	"github.com/panjf2000/ants"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"log"
	"math"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"sync"
)

type Builder struct {
	GraphhopperWebJar string

	MapDir            string
	ElevationCacheDir string
	Vehicles          []string

	// print errors in the end as total summary
	Errors []string

	TotalMemory int64

	ExecuteContext context.Context

	IsBuild             bool
	IsUpload            bool
	IsRemoveOsmOnImport bool

	uploadPool      *ants.PoolWithFunc
	uploadWaitGroup sync.WaitGroup

	Logger *zap.Logger
}

func (t *Builder) Init() error {
	if t.IsUpload {
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
	t.Errors = append(t.Errors, message)
}

func (t *Builder) Build(regionFile string) error {
	regions, err := t.readRegions(regionFile)
	if err != nil {
		return err
	}

	if t.IsBuild {
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

func (t *Builder) buildGraphData(regions []*RegionInfo) error {
	buckets, err := t.computeBuckets(regions)
	if err != nil {
		return err
	}

	for _, bucket := range buckets {
		if bucket.chThreadCount <= 0 {
			return errors.New("bucket chThreadCount " + strconv.Itoa(bucket.chThreadCount) + " must be greater than 0")
		}

		t.Logger.Info("import bucket", zap.Array("regions", zapcore.ArrayMarshalerFunc(func(encoder zapcore.ArrayEncoder) error {
			for _, region := range bucket.regions {
				encoder.AppendString(region.Name)
			}
			return nil
		})))

		err = util.MapAsync(len(bucket.regions), func(taskIndex int) (i func() error, e error) {
			return func() error {
				return t.buildRegion(bucket.regions[taskIndex], bucket)
			}, nil
		})
		if err != nil {
			return err
		}
	}

	return nil
}

func ghProperty(name string, value string) string {
	//noinspection SpellCheckingInspection
	return "-D" + name + "=" + value
}

func (t *Builder) buildRegion(region *RegionInfo, bucket *Bucket) error {
	graphDir := filepath.Join(filepath.Dir(region.File), region.Name+".osm-gh")
	err := fsutil.EnsureEmptyDir(graphDir)
	if err != nil {
		return err
	}

	if region.requiredMemoryInMb <= 0 {
		return errors.New(region.Name + " file size (mb) is invalid: " + strconv.Itoa(region.requiredMemoryInMb))
	}

	xMax := strconv.Itoa(int(math.Ceil(float64(region.requiredMemoryInMb)/1024))) + "g"
	chThreadCount := strconv.Itoa(bucket.chThreadCount)
	logger := t.Logger.With(zap.String("region", region.Name))
	logger.Info("import region", zap.String("Xmx", xMax), zap.String("prepare.ch.threads", chThreadCount))
	command := exec.CommandContext(t.ExecuteContext, getJavaExecutablePath(),
		"-Xms1g",
		"-Xmx"+xMax,
		"-XX:+UnlockExperimentalVMOptions",
		"-XX:+UseShenandoahGC",
		ghProperty("datareader.file", region.File),
		ghProperty("graph.location", graphDir),

		ghProperty("graph.elevation.cache_dir", t.ElevationCacheDir),

		ghProperty("prepare.ch.threads", chThreadCount),

		"-jar", t.GraphhopperWebJar,
	)

	logFilePath := filepath.Join(filepath.Dir(region.File), region.Name+".log")
	logFile, err := os.Create(logFilePath)
	if err != nil {
		return errors.WithStack(err)
	}
	defer util.Close(logFile)

	command.Stdout = logFile
	command.Stderr = logFile

	err = command.Run()
	if err != nil {
		logger.Error("cannot build", zap.String("log", logFilePath), zap.Error(err))
		return err
	}

	t.addFileToUploadQueue(region.Name)

	logger.Info("imported")
	if t.IsRemoveOsmOnImport {
		logger.Info("remove OSM file to save disk space", zap.String("file", region.File))
		err = os.Remove(region.File)
		if err != nil {
			return errors.WithStack(err)
		}
	}
	return nil
}
