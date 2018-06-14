#!/usr/bin/env bash
set -ex

[ -z "$MAP_DIR" ] && echo "Need to set env MAP_DIR (where to store map files)" && exit 1;

BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

aria2c --max-connection-per-server=2 --max-concurrent-downloads=4 --input-file="$BASEDIR/map-urls.txt" --dir="$MAP_DIR" --conditional-get=true --allow-overwrite=true

# https://ftp5.gwdg.de/pub/misc/openstreetmap/download.geofabrik.de/europe-latest.osm.pbf