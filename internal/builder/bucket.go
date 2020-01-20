package builder

import (
	"github.com/davecgh/go-spew/spew"
	"github.com/deanishe/go-env"
	"github.com/develar/errors"
	"golang.org/x/tools/container/intsets"
	"runtime"
	"sort"
)

type Bucket struct {
	regions       []*RegionInfo
	chThreadCount int
}

// pack into processing buckets to consume as mush machine resources as possible to build graphhopper data as faster as possible
func (t *Builder) computeBuckets(regions []*RegionInfo) ([]*Bucket, error) {
	// sort from small to large (any error will be discovered faster)
	sort.Slice(regions, func(i, j int) bool {
		return regions[i].FileSizeInMb < regions[j].FileSizeInMb
	})

	// distribute - take the largest region and find the nearest applicable (available memory) regions

	var buckets []*Bucket

	totalThreadCount := runtime.NumCPU()
	maxRegionsPerBucket := env.GetInt("BUILD_WORKER_COUNT", max(totalThreadCount-2, 1))
	recommendedThreadCount := min(len(t.Vehicles), totalThreadCount)

	var processedRegions intsets.Sparse

	// take in account only available memory, ignore CPU requirement for now
	totalMemoryInMb := int(t.TotalMemory / (1024 * 1024))

	for indexOfLargestRegion := len(regions) - 1; indexOfLargestRegion >= 0; indexOfLargestRegion-- {
		var currentBucket *Bucket
		availableMemoryInMb := totalMemoryInMb

		if processedRegions.Has(indexOfLargestRegion) {
			continue
		}

		region := regions[indexOfLargestRegion]
		processedRegions.Insert(indexOfLargestRegion)

		if availableMemoryInMb < region.requiredMemoryInMb {
			return nil, errors.New("File " + region.File + " is too big (todo: can be handled using reduced number of threads, not implemented)")
		}

		currentBucket = &Bucket{
			chThreadCount: recommendedThreadCount,
		}
		currentBucket.regions = append(currentBucket.regions, region)
		availableMemoryInMb = totalMemoryInMb - region.requiredMemoryInMb
		buckets = append(buckets, currentBucket)

		// https://stackoverflow.com/questions/19197836/algorithm-to-evenly-distribute-values-into-containers
		// find the nearest applicable (available memory) regions
		for indexOfSmallestRegion := 0; indexOfSmallestRegion < indexOfLargestRegion; indexOfSmallestRegion++ {
			if processedRegions.Has(indexOfSmallestRegion) {
				continue
			}

			region = regions[indexOfSmallestRegion]

			if len(currentBucket.regions) >= maxRegionsPerBucket || availableMemoryInMb < region.requiredMemoryInMb {
				// regions sorted from the smallest to the largest, so, any other next region is larger than current, so, stop search
				break
			}

			currentBucket.regions = append(currentBucket.regions, region)
			availableMemoryInMb -= region.requiredMemoryInMb
			processedRegions.Insert(indexOfSmallestRegion)
		}
	}

	// sort from small to large (any error will be discovered faster)
	sort.Slice(buckets, func(i, j int) bool {
		return len(buckets[i].regions) > len(buckets[j].regions)
	})

	spew.Dump(buckets)
	return buckets, nil
}
