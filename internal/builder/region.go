package builder

import (
	"bufio"
	"github.com/develar/app-builder/pkg/util"
	"github.com/develar/errors"
	"go.uber.org/zap"
	"os"
	"path/filepath"
	"strings"
)

type RegionInfo struct {
	File string
	Name string

	FileSizeInMb int

	requiredMemoryInMb int
}

func (t *Builder) readRegions(regionFile string) ([]*RegionInfo, error) {
	file, err := os.Open(regionFile)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	defer util.Close(file)

	scanner := bufio.NewScanner(file)
	var regions []*RegionInfo
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

			fileName := names[0]
			if strings.HasSuffix(fileName, "-latest") {
				fileName += ".osm"
			}
			fileName += ".pbf"

			regions = append(regions, &RegionInfo{
				File: filepath.Join(t.MapDir, fileName),
				Name: name,
			})
		}
	}

	if !t.IsBuild {
		return regions, nil
	}

	err = util.MapAsync(len(regions), func(taskIndex int) (i func() error, e error) {
		region := regions[taskIndex]
		return func() error {
			fileInfo, err := os.Stat(region.File)
			if err != nil {
				if os.IsNotExist(err) {
					t.Logger.Warn("file not found, skip region", zap.String("region", region.Name), zap.String("file", region.File))
					return nil
				}
				return errors.WithStack(err)
			}

			fileSizeInMb := int(fileInfo.Size() / (1024 * 1024))
			region.FileSizeInMb = fileSizeInMb

			// empirical coefficient
			var empiricalCoefficient float64
			if fileSizeInMb < 256 {
				// thailand 167 MB requires more than 2 GB
				empiricalCoefficient = 13
			} else if fileSizeInMb < 512 {
				empiricalCoefficient = 11
			} else if fileSizeInMb < 1024 {
				// brazil
				empiricalCoefficient = 8.5
			} else if fileSizeInMb < 2048 {
				// south-america-latest.osm.pbf 1497
				empiricalCoefficient = 6.6
			} else {
				empiricalCoefficient = 7
			}

			// e.g. us-pacific requires > 1 GB
			region.requiredMemoryInMb = max(int(float64(fileSizeInMb)*empiricalCoefficient), 2048)
			return nil
		}, nil
	})
	if err != nil {
		return nil, errors.WithStack(err)
	}

	var result []*RegionInfo
	for _, region := range regions {
		if region.FileSizeInMb > 0 {
			result = append(result, region)
		}
	}
	return result, nil
}
