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
	"strings"
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

	commonConfigFile, err := createCommonConfigFile()
	if err != nil {
		return errors.WithStack(err)
	}

	defer func() {
		err := os.Remove(commonConfigFile)
		if err != nil {
			t.Logger.Error("cannot remove file", zap.String("file", commonConfigFile), zap.Error(err))
		}
	}()

	//pool, _ := ants.NewPool(len(buckets[0].regions))
	//defer func() {
	//  err := pool.Release()
	//  if err != nil {
	//    t.logger.Error("cannot release pool", zap.Error(err))
	//  }
	//}()

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

		//for _, region := range bucket.regions {
		//  pool.Submit(func() {
		//    err := t.buildRegion(region, bucket, commonConfigFile)
		//    if err != nil {
		//      t.logger
		//    }
		//  })
		//}

		err = util.MapAsync(len(bucket.regions), func(taskIndex int) (i func() error, e error) {
			return func() error {
				return t.buildRegion(bucket.regions[taskIndex], bucket, commonConfigFile)
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
	return "-Dgraphhopper." + name + "=" + value
}

func (t *Builder) buildRegion(region *RegionInfo, bucket *Bucket, commonConfigFile string) error {
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
	//command := exec.CommandContext(t.executeContext, "/Volumes/data/importer",
	command := exec.CommandContext(t.ExecuteContext, getJavaExecutablePath(),
		"-Xms1g", "-Xmx"+xMax,
		//"-XX:+UnlockExperimentalVMOptions",
		//"-XX:+UseShenandoahGC",
		ghProperty("datareader.file", region.File),
		ghProperty("graph.location", graphDir),

		ghProperty("graph.elevation.cache_dir", t.ElevationCacheDir),
		ghProperty("graph.elevation.provider", "multi"),

		ghProperty("graph.flag_encoders", strings.Join(t.Vehicles, ",")),
		ghProperty("graph.bytes_for_flags", "8"),
		ghProperty("prepare.ch.threads", chThreadCount),
		ghProperty("prepare.ch.weightings", "fastest"),

		// configure the memory access, use RAM_STORE for well-equipped servers (default and recommended)
		ghProperty("graph.dataaccess", "RAM_STORE"),
		// Sort the graph after import to make requests roughly ~10% faster. Note that this requires significantly more RAM on import.
		ghProperty("graph.do_sort", "true"),

		"-jar", t.GraphhopperWebJar,
		"import", commonConfigFile,
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
