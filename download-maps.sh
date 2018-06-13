#!/usr/bin/env bash
set -ex

[ -z "$MAP_DIR" ] && echo "Need to set env MAP_DIR (where to store map files)" && exit 1;

BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

aria2c --input-file="$BASEDIR/map-urls.txt" --dir="$MAP_DIR" --conditional-get true