#!/usr/bin/env bash
set -ex

WAIT_TIME=10

until aria2c --enable-mmap=true --max-connection-per-server=2 --dir="${MAP_DIR}" --conditional-get --allow-overwrite http://download.geofabrik.de/europe-latest.osm.pbf; do
  echo Downloading disrupted, retrying in $WAIT_TIME seconds...
  sleep $WAIT_TIME
done

osmium extract --overwrite --config=coverage/extracts.json --strategy=smart --directory="${MAP_DIR}" "${MAP_DIR}/europe-latest.osm.pbf" &

#until aria2c --enable-mmap=true --max-connection-per-server=2 --max-concurrent-downloads=2 --input-file=configs/map-urls.txt --dir="${MAP_DIR}" --conditional-get --allow-overwrite; do
#  echo Downloading disrupted, retrying in $WAIT_TIME seconds...
#  sleep $WAIT_TIME
#done

wait