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

  if [[ -z "${SKIP_BUILD}" ]]; then
    rm -rf "$MAP_DIR/$NAME.osm-gh"
    rm -rf "$MAP_DIR/$RESULT_NAME.osm-gh"
    node "$BASEDIR/scripts/compute-config.js" "$MAP_DIR/$NAME.osm.pbf"
    cd ~/graphhopper-0.11.0
    # graphhopper-0.11.0 incorrectly force use default config.yml
    cp /tmp/gh-config.yml ./config.yml
    ./graphhopper.sh --action import --input "$MAP_DIR/$NAME.osm.pbf" --config "/tmp/gh-config.yml"
    if [ "$NAME" != "$RESULT_NAME" ]; then
      rm -rf "$MAP_DIR/$RESULT_NAME.osm-gh"
      mv "$MAP_DIR/$NAME.osm-gh" "$MAP_DIR/$RESULT_NAME.osm-gh"
    fi
    node "$BASEDIR/scripts/locus-action-generator.js" "$RESULT_NAME" &
  else
    # do not in parallel (no sense because build is skipped)
    node "$BASEDIR/scripts/locus-action-generator.js" "$RESULT_NAME"
  fi
}

#build "africa-latest" "africa"
#build "al-ba-bg-hr-hu-xk-mk-md-me-ro-rs-sk-si" "al-ba-bg-hr-hu-xk-mk-md-me-ro-rs-sk-si"
#build "alps-latest" "alps"
#build "australia-latest" "australia"
#build "austria-latest" "austria"
#
#build "bayern-at-cz" "bayern-at-cz"
#build "belgium-latest" "belgium"
#build "brazil-latest" "brazil"
#
#build "canada-latest" "canada"
#build "central-america-latest" "central-america"
#build "czech-republic-latest" "czech-republic"
#
#build "dach-latest" "de-at-ch"
#build "denmark-latest" "denmark"
#
#build "estonia-latvia-lithuania" "estonia-latvia-lithuania"
#
build "finland-norway-sweden" "finland-norway-sweden"
#build "finland-latest" "finland"
#build "france-latest" "france"
#
#build "great-britain-latest" "great-britain"
#build "greece-latest" "greece"
#
#build "ireland-and-northern-ireland-latest" "ireland-and-northern-ireland"
#build "iceland-latest" "iceland"
#build "italy-latest" "italy"
#
#build "netherlands-latest" "netherlands"
#build "new-zealand-latest" "new-zealand"
#
#build "poland-latest" "poland"
#build "portugal-spain" "portugal-spain"
#
#build "RU" "russia"
#
#build "south-america-latest" "south-america"
#build "switzerland-latest" "switzerland"
#
#build "UA" "ukraine"
#build "us-midwest-latest" "us-midwest"
#build "us-northeast-latest" "us-northeast"
#build "us-pacific-latest" "us-pacific"
#build "us-south-latest" "us-south"
#build "us-west-latest" "us-west"
#
#build "japan-latest" "japan"
#build "india-latest" "india"
#build "china-latest" "china"
#build "indonesia-latest" "indonesia"
#build "thailand-latest" "thailand"
#build "turkey-latest" "turkey"

# https://stackoverflow.com/questions/14254118/waiting-for-background-processes-to-finish-before-exiting-script
wait