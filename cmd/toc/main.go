package main

import (
  "bufio"
  "bytes"
  "encoding/json"
  "errors"
  "flag"
  "github.com/dustin/go-humanize"
  "github.com/minio/minio-go/v6"
  "github.com/zalando/go-keyring"
  "io"
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

const serverUrl = "https://s3.eu-central-1.wasabisys.com"
const bucketName = "gh-routing-data"

func main() {
  endpoint := flag.String("url", "s3.eu-central-1.wasabisys.com", "The S3 URL.")
  locusDir := flag.String("locus-dir", "", "The directory of Locus metadata files.")

  flag.Parse()

  accessKey := os.Getenv("ACCESS_KEY")
  secretKey := os.Getenv("SECRET_KEY")
  if accessKey == "" && secretKey == "" {
    secret, err := keyring.Get("wasabi", "reader")
    if err != nil {
      log.Fatal(err)
    }

    pair := strings.SplitN(secret, ":", 2)
    accessKey = pair[0]
    secretKey = pair[1]
  }

  minioClient, err := minio.New(*endpoint, accessKey, secretKey /* isSecure = */, true)
  if err != nil {
    log.Fatalln(err)
  }

  doneChannel := make(chan struct{})
  // indicate to our routine to exit cleanly upon return
  defer close(doneChannel)

  var stringBuilder strings.Builder

  graphHopperVersionToRegions := []*GraphHopperVersionToRegions{{
    GraphHopperVersion: "1.0-pre20",
    rootDir:            "2020-02-03",
  }}

  for _, group := range graphHopperVersionToRegions {
    err = collectRegionsAndWriteLocusMetadataForGraphhopperVersion(group, minioClient, doneChannel, err, locusDir, stringBuilder)
    if err != nil {
      log.Fatal(err)
    }
  }

  data, err := json.MarshalIndent(graphHopperVersionToRegions, "", "  ")
  if err != nil {
    log.Fatal(err)
  }

  err = ioutil.WriteFile(filepath.Join(*locusDir, "info.json"), data, 0644)
  if err != nil {
    log.Fatal(err)
  }

  items := make([]TemplateData, 0)
  for _, group := range regionGroups {
    groups := make([]VersionToGroups, 0)
    for _, item := range graphHopperVersionToRegions {
      if item.isHidden {
        continue
      }

      regions := make([]*Region, 0)
      for _, region := range item.Regions {
        if region.Group == group {
          regions = append(regions, region)
        }
      }

      groups = append(groups, VersionToGroups{*item, regions})
    }
    items = append(items, TemplateData{group, groups})
  }

  err = writeToC(data, items)
  if err != nil {
    log.Fatal(err)
  }
}

func writeToC(data []byte, items []TemplateData) error {
  startMarker := []byte("<!-- do not edit. start of generated block -->")
  endMarker := []byte("<!-- end of generated block -->")

  outFile, err := os.OpenFile("./docs/index.md", os.O_RDWR, 0)
  if err != nil {
    return err
  }

  //noinspection GoUnhandledErrorResult
  defer outFile.Close()

  data, err = ioutil.ReadAll(outFile)
  if err != nil {
    return err
  }

  start := bytes.Index(data, startMarker)
  _, err = outFile.Seek(int64(start+len(startMarker)), io.SeekStart)
  if err != nil {
    return err
  }

  end := bytes.Index(data, endMarker)

  writer := bufio.NewWriter(outFile)
  _, _ = writer.WriteString("\n")

  err = createTableTemplate().Execute(writer, items)
  if err != nil {
    return err
  }

  _, _ = writer.Write(data[end:])
  err = writer.Flush()
  if err != nil {
    return err
  }

  currentPosition, err := outFile.Seek(0, io.SeekCurrent)
  if err != nil {
    return err
  }

  if int(currentPosition) < len(data) {
    err = outFile.Truncate(currentPosition)
    if err != nil {
      return err
    }
  }

  return nil
}

type TemplateData struct {
  GroupName       string
  VersionToGroups []VersionToGroups
}

type VersionToGroups struct {
  Info    GraphHopperVersionToRegions
  Regions []*Region
}

func collectRegionsAndWriteLocusMetadataForGraphhopperVersion(group *GraphHopperVersionToRegions, minioClient *minio.Client, doneChannel chan struct{}, err error, locusDir *string, stringBuilder strings.Builder) error {
  regions, err := collectRegions(bucketName, group.rootDir, minioClient, doneChannel, err)
  if err != nil {
    return err
  }

  err = writeLocusMetadata(regions, filepath.Join(*locusDir, group.rootDir), &stringBuilder, group)
  if err != nil {
    return err
  }

  group.Regions = regions
  return nil
}

func writeLocusMetadata(regions []*Region, outputDir string, stringBuilder *strings.Builder, group *GraphHopperVersionToRegions) error {
  err := os.MkdirAll(outputDir, os.ModePerm)
  if err != nil {
    return err
  }

  for _, region := range regions {
    stringBuilder.Reset()

    stringBuilder.WriteString("<locusActions>")
    for _, part := range region.Parts {
      stringBuilder.WriteString("\n  <download>")

      stringBuilder.WriteString("\n    <source>")
      stringBuilder.WriteString(region.DirUrl)
      stringBuilder.WriteRune('/')
      stringBuilder.WriteString(part.FileName)
      stringBuilder.WriteString("</source>")

      stringBuilder.WriteString("\n    <dest>/mapsVector/")
      stringBuilder.WriteString(region.Name)
      stringBuilder.WriteString("</dest>")
      stringBuilder.WriteString("\n    <after>extract|deleteSource</after>")

      stringBuilder.WriteString("\n  </download>")
    }
    stringBuilder.WriteString("\n</locusActions>")

    fileName := region.Name + ".locus.xml"
    region.LocusUrl = path.Join(group.rootDir, fileName)
    data := []byte(stringBuilder.String())

    err = writeIfNotModified(outputDir, fileName, data)
    if err != nil {
      return err
    }
  }
  return nil
}

func writeIfNotModified(outputDir string, fileName string, data []byte) error {
  file, err := os.OpenFile(filepath.Join(outputDir, fileName), os.O_RDWR|os.O_CREATE, 0666)
  if err != nil {
    return err
  }

  //noinspection GoUnhandledErrorResult
  defer file.Close()

  fileInfo, err := file.Stat()
  if err != nil {
    return err
  }

  if fileInfo.Size() == int64(len(data)) {
    oldData, err := ioutil.ReadAll(file)
    if err != nil {
      return err
    }

    if bytes.Compare(data, oldData) == 0 {
      return nil
    }
  }

  n, err := file.Write(data)
  if err == nil && n < len(data) {
    err = io.ErrShortWrite
  }

  if err1 := file.Close(); err == nil {
    err = err1
  }

  return err
}

func collectRegions(bucket string, dir string, minioClient *minio.Client, doneChannel chan struct{}, err error) ([]*Region, error) {
  var regions []*Region

  partRegexp := regexp.MustCompile("^([a-z-]+)(-part([\\d{1}]))?\\.")

  objectPrefix := dir
  if objectPrefix != "" {
    objectPrefix += "/"
  }

  objectCh := minioClient.ListObjectsV2(bucket, objectPrefix /* isRecursive = */, false, doneChannel)
  for object := range objectCh {
    if object.Err != nil {
      return nil, object.Err
    }

    if !strings.HasSuffix(object.Key, ".osm-gh.zip") {
      continue
    }

    fileName := path.Base(object.Key)
    parsedName := partRegexp.FindStringSubmatch(fileName)
    if parsedName == nil || len(parsedName) < 2 {
      return nil, errors.New("cannot match " + fileName)
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
      FileName: fileName,
      Index:    partIndex,
      Size:     object.Size,
    }

    dirUrl := serverUrl + "/" + path.Join(bucket, dir)

    if region == nil {
      region = &Region{
        Name:   regionName,
        Title:  getRegionTitle(regionName),
        Group:  getRegionScopeName(regionName),
        DirUrl: dirUrl,
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
    region.TotalSizeHuman = humanize.Bytes(uint64(region.TotalSize))

    if len(region.Parts) == 0 {
      continue
    }

    sort.Slice(region.Parts, func(i, j int) bool {
      return region.Parts[i].Index < region.Parts[j].Index
    })
  }

  // sort regions
  sort.Slice(regions, func(i, j int) bool {
    a := regions[i]
    if a.Name == `al-ba-bg-hr-hu-xk-mk-md-me-ro-rs-sk-si` {
      return false
    }

    b := regions[j]
    if b.Name == `al-ba-bg-hr-hu-xk-mk-md-me-ro-rs-sk-si` {
      return true
    }
    return a.Title < b.Title
  })

  return regions, nil
}
