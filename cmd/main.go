package main

import (
	"github.com/alecthomas/kingpin"
	"github.com/davecgh/go-spew/spew"
	"github.com/develar/app-builder/pkg/util"
	"github.com/logrusorgru/aurora"
	"github.com/pbnjay/memory"
	"log"
	"os"
	"path/filepath"
	"strings"
)

// do not use `osmium merge` to merge OSM maps for graphhopper, it leads to incorrect routing data.
func main() {
	var app = kingpin.New("gh-data-builder", "gh-data-builder").Version("0.0.1")

	isBuild := app.Flag("build", "Whether to convert OSM to graphhopper data").Default("true").Bool()
	isUpload := app.Flag("upload", "Whether to upload result").Default("true").Bool()
	isRemoveOsmOnImport := app.Flag("remove-osm", "Whether to automatically remove input OSM file").Default("false").Bool()

	mapDir := app.Flag("map-dir", "The path to map files").Required().Envar("MAP_DIR").String()
	elevationCacheDir := app.Flag("elevation-dir", "The path to elevation cache").Envar("ELEVATION_DIR").String()
	graphhopperWebJar := app.Flag("graphhopper", "The path to graphhopper-web JAR").String()

	_ = kingpin.MustParse(app.Parse(os.Args[1:]))

	spew.Config.DisablePointerAddresses = true
	spew.Config.Indent = "  "
	spew.Config.DisableMethods = true
	spew.Config.DisableCapacities = true

	executeContext, cancelExecute := util.CreateContext()

	builder := Builder{
		mapDir:            *mapDir,
		elevationCacheDir: *elevationCacheDir,
		vehicles:          []string{"bike2", "mtb", "racingbike", "hike", "car"},

		totalMemory:    int64(memory.TotalMemory()) - (1024 * 1024 * 1024 /* leave at least 1 GB for system */),
		executeContext: executeContext,

		isBuild:             *isBuild,
		isUpload:            *isUpload,
		isRemoveOsmOnImport: *isRemoveOsmOnImport,

		graphhopperWebJar: *graphhopperWebJar,
	}

	if len(builder.elevationCacheDir) == 0 {
		builder.elevationCacheDir = filepath.Join(*mapDir, "..", "elevation")
	}

	// https://search.maven.org/search?q=a:graphhopper-web
	// https://search.maven.org/remotecontent?filepath=com/graphhopper/graphhopper-web/0.12.0-pre2/graphhopper-web-0.12.0-pre2.jar
	if builder.graphhopperWebJar == "" {
		builder.graphhopperWebJar = filepath.Join(builder.mapDir, "..", "graphhopper-web-0.12.0-pre2.jar")
	}

	err := doBuild(builder)
	if len(builder.errors) != 0 {
		log.Println(aurora.Red("Errors:\n\n" + strings.Join(builder.errors, "\n")))
	}
	if err != nil {
		cancelExecute()
		log.Fatalf("%+v\n", err)
	}
}

func doBuild(builder Builder) error {
	err := builder.Init()
	if err != nil {
		return err
	}

	err = builder.build(filepath.Join("./configs/regions.yaml"))
	if err != nil {
		return err
	}

	err = builder.WaitAndCloseUploadPool()
	if err != nil {
		return err
	}
	return nil
}
