package main

import (
	"encoding/json"
	"errors"
	"flag"
	"github.com/minio/minio-go/v6"
	"io/ioutil"
	"log"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

const serverUrl = "https://s3.eu-central-1.wasabisys.com/gh-routing-data"
const bucketName = "gh-routing-data"

func main() {
	endpoint := flag.String("url", "s3.eu-central-1.wasabisys.com", "The S3 URL.")
	locusDir := flag.String("locus-dir", "", "The directory of Locus metadata files.")

	flag.Parse()

	minioClient, err := minio.New(*endpoint, os.Getenv("ACCESS_KEY"), os.Getenv("SECRET_KEY") /* isSecure = */, true)
	if err != nil {
		log.Fatalln(err)
	}

	doneChannel := make(chan struct{})
	// indicate to our routine to exit cleanly upon return
	defer close(doneChannel)

	regions, err := collectRegions(minioClient, doneChannel, err)
	if err != nil {
		log.Fatal(err)
	}

	var stringBuilder strings.Builder

	err = os.MkdirAll(*locusDir, os.ModePerm)
	if err != nil {
		log.Fatal(err)
	}

	for _, region := range regions {
		stringBuilder.Reset()

		stringBuilder.WriteString("<locusActions>")
		for _, part := range region.Parts {
			stringBuilder.WriteString("\n  <download>")

			stringBuilder.WriteString("\n    <source>")
			stringBuilder.WriteString(serverUrl)
			if !strings.HasSuffix(serverUrl, "/") && !strings.HasPrefix(part.FileName, "/") {
				stringBuilder.WriteRune('/')
			}
			stringBuilder.WriteString(part.FileName)
			stringBuilder.WriteString("</source>")

			stringBuilder.WriteString("\n    <dest>/mapsVector/")
			stringBuilder.WriteString(region.Name)
			stringBuilder.WriteString("</dest>")
			stringBuilder.WriteString("\n    <after>extract|deleteSource</after>")

			stringBuilder.WriteString("\n  </download>")
		}
		stringBuilder.WriteString("\n</locusActions>")

		err = ioutil.WriteFile(filepath.Join(*locusDir, region.Name+".locus.xml"), []byte(stringBuilder.String()), 0644)
		if err != nil {
			log.Fatal(err)
		}
	}

	data, err := json.MarshalIndent(regions, "", "  ")
	if err != nil {
		log.Fatal(err)
	}

	// .Dir - locusDir contains date as last part
	err = ioutil.WriteFile(filepath.Join(filepath.Dir(*locusDir), "info.json"), data, 0644)
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("%s", data)
}

func collectRegions(minioClient *minio.Client, doneChannel chan struct{}, err error) ([]*Region, error) {
	var regions []*Region

	partRegexp := regexp.MustCompile("^([a-z-]+)(-part([\\d{1}]))?\\.")

	objectCh := minioClient.ListObjectsV2(bucketName, "" /* isRecursive = */, false, doneChannel)
	for object := range objectCh {
		if object.Err != nil {
			return nil, object.Err
		}

		if !strings.HasSuffix(object.Key, ".osm-gh.zip") {
			continue
		}

		parsedName := partRegexp.FindStringSubmatch(object.Key)
		if parsedName == nil || len(parsedName) < 2 {
			return nil, errors.New("cannot match " + object.Key)
		}

		regionName := parsedName[1]

		var region *Region
		partIndex := 0
		if len(parsedName) > 2 && len(parsedName[3]) != 0 {
			for _, existingRegion := range regions {
				if existingRegion.Name == regionName {
					region = existingRegion
					break
				}
			}

			partIndex, err = strconv.Atoi(parsedName[3])
			if err != nil {
				return nil, err
			}
		}

		partInfo := PartInfo{
			FileName: path.Base(object.Key),
			Index:    partIndex,
			Size:     object.Size,
		}

		if region == nil {
			region = &Region{
				Name:   regionName,
				DirUrl: serverUrl,
				Parts:  []PartInfo{partInfo},
			}

			regions = append(regions, region)
		} else {
			region.Parts = append(region.Parts, partInfo)
		}

		region.TotalSize += object.Size
	}

	// sort parts
	for _, region := range regions {
		if len(region.Parts) == 0 {
			continue
		}

		sort.Slice(region.Parts, func(i, j int) bool {
			return region.Parts[i].Index < region.Parts[j].Index
		})
	}

	// sort regions
	sort.Slice(regions, func(i, j int) bool {
		return regions[i].Name < regions[j].Name
	})

	return regions, nil
}

type Region struct {
	Name      string `json:"name"`
	TotalSize int64  `json:"totalSize"`

	DirUrl string `json:"dirUrl"`

	Parts []PartInfo `json:"parts"`
}

type PartInfo struct {
	FileName string `json:"fileName"`
	Index    int    `json:"index"`
	Size     int64  `json:"size"`
}
