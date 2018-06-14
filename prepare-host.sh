#!/usr/bin/env bash
sudo add-apt-repository ppa:webupd8team/java

sudo apt-get update -qq
sudo apt-get upgrade -qq

GH_VERSION=0.11.0-pre1

sudo apt-get install -qq aria2 maven oracle-java8-installer unzip ca-certificates-java
aria2c -x8 http://download.geofabrik.de/europe/dach-latest.osm.pbf

curl -L https://github.com/graphhopper/graphhopper/archive/$GH_VERSION.tar.gz | tar xvz
cd graphhopper-$GH_VERSION

export JAVA_OPTS="-server -Xconcurrentio -Xmx31g -Xms16g"

cat <<EOT >> config.yml
graphhopper:
  ##### Vehicles #####
  graph.flag_encoders: bike2,racingbike,mtb,hike
  graph.bytes_for_flags: 8

  ##### Elevation #####
  graph.elevation.provider: cgiar
  graph.elevation.dataaccess: RAM_STORE

  #### Speed, hybrid and flexible mode ####
  # ,shortest
  prepare.ch.weightings: fastest
  prepare.ch.threads: 4

  # avoid being stuck in a (oneway) subnetwork, see https://discuss.graphhopper.com/t/93
  prepare.min_network_size: 200
  prepare.min_one_way_network_size: 200

  ##### Routing #####
  routing.non_ch.max_waypoint_distance: 1000000

  ##### Storage #####

  # configure the memory access, use RAM_STORE for well equipped servers (default and recommended)
  graph.dataaccess: RAM_STORE
  # Sort the graph after import to make requests roughly ~10% faster. Note that this requires significantly more RAM on import.
  #graph.do_sort: true
EOT

./graphhopper.sh -a import -i ../dach-latest.osm.pbf