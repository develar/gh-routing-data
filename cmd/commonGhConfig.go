package main

import (
	"github.com/develar/app-builder/pkg/util"
	"github.com/develar/errors"
	"io"
	"io/ioutil"
	"strings"
)

func createCommonConfigFile() (string, error) {
	configFile, err := ioutil.TempFile("", "*.yaml")
	if err != nil {
		return "", errors.WithStack(err)
	}

	defer util.Close(configFile)

	err = writeGhCommonConfig(configFile)
	if err != nil {
		util.Close(configFile)
		return "", errors.WithStack(err)
	}

	configFilePath := configFile.Name()

	err = configFile.Close()
	if err != nil {
		return "", errors.WithStack(err)
	}

	return configFilePath, nil
}

func writeGhCommonConfig(writer io.Writer) error {
	_, err := writer.Write([]byte(strings.Replace(`graphhopper:
  # avoid being stuck in a (oneway) subnetwork, see https://discuss.graphhopper.com/t/93
  prepare.min_network_size: 200
  prepare.min_one_way_network_size: 200

  # You can limit the max distance between two consecutive waypoints of flexible routing requests to be less or equal
  # the given distance in meter. Default is set to 1000km.
  routing.non_ch.max_waypoint_distance: 1000000
	`, "\t", "  ", -1)))
	if err != nil {
		return errors.WithStack(err)
	}
	return nil
}
