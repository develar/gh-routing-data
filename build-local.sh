#!/usr/bin/env bash
set -ex

# Do not use `osmium merge` to merge OSM maps for graphhopper, it leads to incorrect routing data.

[ -z "$MAP_DIR" ] && echo "Need to set env MAP_DIR (where to store map files)" && exit 1;

# brew install p7zip

BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

export JAVA_OPTS="-Xmx14g -Xms10g -XX:+UseG1GC"

build()
{
  NAME=$1
  RESULT_NAME=$2

  cd ~/graphhopper-master
  if [[ -z "${SKIP_BUILD}" ]]; then
    rm -rf "$NAME.osm-gh"
    rm -rf "$RESULT_NAME.osm-gh"
    ./graphhopper.sh -a import -i "$MAP_DIR/$NAME.osm.pbf" -c "$BASEDIR/config-local.yml"
    mv "$MAP_DIR/$NAME.osm-gh" "$MAP_DIR/$RESULT_NAME.osm-gh"
  fi
  "$BASEDIR/scripts/compress-and-upload.sh" "$RESULT_NAME" &
}

#build "dach-latest" "de-at-ch"
#build "italy-latest" "italy"

#build "us-midwest-latest" "us-midwest"
#build "us-northeast-latest" "us-northeast"
#build "us-pacific-latest" "us-pacific"
#build "us-south-latest" "us-south"
#build "us-west-latest" "us-west"

build "canada-latest" "canada"
build "czech-republic-latest" "czech-republic"
build "australia-latest" "australia"
build "france-latest" "france"

# https://stackoverflow.com/questions/14254118/waiting-for-background-processes-to-finish-before-exiting-script
wait