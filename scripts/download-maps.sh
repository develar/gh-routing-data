#!/usr/bin/env bash
set -ex

[ -z "$MAP_DIR" ] && echo "Need to set env MAP_DIR (directory of map files)" && exit 1;
projectDir="$( cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd )"

aria2c --max-connection-per-server=2 --max-concurrent-downloads=2 --input-file="$projectDir/configs/map-urls.txt" --dir="$MAP_DIR" --conditional-get --allow-overwrite