#!/usr/bin/env bash
set -ex

# Do not use `osmium merge` to merge OSM maps for graphhopper, it leads to incorrect routing data.

[ -z "$MAP_DIR" ] && echo "Need to set env MAP_DIR (where to store map files)" && exit 1;

BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

export JAVA_OPTS="-Xmx15g -Xms10g -XX:+UseG1GC"

build()
{
  NAME=$1
  RESULT_NAME=$1

  cd ~/graphhopper-master
  if [[ -z "${SKIP_BUILD}" ]]; then
    rm -rf "$NAME.osm-gh"
    ./graphhopper.sh -a import -i "$MAP_DIR/$NAME.osm.pbf" -c "$BASEDIR/config.yml"
  fi
  "$BASEDIR/scripts/compress-and-upload.sh" "$RESULT_NAME" &
}

build "europe-region1"

# https://stackoverflow.com/questions/14254118/waiting-for-background-processes-to-finish-before-exiting-script
wait