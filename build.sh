#!/usr/bin/env bash
set -ex

# Do not use `osmium merge` to merge OSM maps for graphhopper, it leads to incorrect routing data.

[ -z "$MAP_DIR" ] && echo "Need to set env MAP_DIR (where to store map files)" && exit 1;

BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

export JAVA_OPTS="-Xmx15g -Xms10g -XX:+UseG1GC"

build()
{
  NAME=$1
  RESULT_NAME=$2

  cd ~/graphhopper-master
  if [[ -z "${SKIP_BUILD}" ]]; then
    rm -rf "$NAME.osm-gh"
    rm -rf "$RESULT_NAME.osm-gh"
    node "$BASEDIR/scripts/compute-config.js" "$MAP_DIR/$NAME.osm.pbf"
    ./graphhopper.sh -a import -i "$MAP_DIR/$NAME.osm.pbf" -c "/tmp/gh-config.yml"
    if [ "$NAME" != "$RESULT_NAME" ]; then
      mv "$MAP_DIR/$NAME.osm-gh" "$MAP_DIR/$RESULT_NAME.osm-gh"
    fi
  fi
  "$BASEDIR/scripts/compress-and-upload.sh" "$RESULT_NAME" &
}


#build "africa-latest" "africa"
#build "al-ba-bg-hr-hu-xk-mk-md-me-ro-rs-sk-si" "al-ba-bg-hr-hu-xk-mk-md-me-ro-rs-sk-si"
#build "alps-latest" "alps"
#build "australia-latest" "australia"
#build "austria-latest" "austria"
build "switzerland-latest" "switzerland"
build "ireland-and-northern-ireland-latest" "ireland-and-northern-ireland"
build "iceland-latest" "iceland"

#build "bayern-at-cz" "bayern-at-cz"
#build "belgium-latest" "belgium"
#build "canada-latest" "canada"
#build "czech-republic-latest" "czech-republic"
#build "dach-latest" "de-at-ch"
#build "denmark-latest" "denmark"
#build "estonia-latvia-lithuania" "estonia-latvia-lithuania"
#build "finland-norway-sweden" "finland-norway-sweden"
#build "finland-latest" "finland"
#build "france-latest" "france"
#build "great-britain-latest" "great-britain"
#build "greece-latest" "greece"
#build "italy-latest" "italy"
#build "netherlands-latest" "netherlands"
#build "new-zealand-latest" "new-zealand"
#build "poland-latest" "poland"
#build "portugal-spain" "portugal-spain"
#build "russia-latest" "russia"
#build "south-america-latest" "south-america"
#build "ukraine-latest" "ukraine"
#build "us-midwest-latest" "us-midwest"
#build "us-northeast-latest" "us-northeast"
#build "us-pacific-latest" "us-pacific"
#build "us-south-latest" "us-south"
#build "us-west-latest" "us-west"

# https://stackoverflow.com/questions/14254118/waiting-for-background-processes-to-finish-before-exiting-script
wait