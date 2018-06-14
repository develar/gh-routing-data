#!/usr/bin/env bash
set -ex

[ -z "$MAP_DIR" ] && echo "Need to set env MAP_DIR (where to store map files)" && exit 1;

BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$MAP_DIR"
osmconvert ~/Downloads/europe-latest.osm.pbf -o=europe.o5m
unlink ~/Downloads/europe-latest.osm.pbf

# https://blog.jochentopf.com/2017-02-06-expedicious-and-exact-extracts-with-osmium.html
osmium extract --overwrite --config="$BASEDIR/poly/extracts.json" --strategy=smart --option=types=multipolygon,route europe.o5m