#!/usr/bin/env bash
set -ex

# brew install p7zip

BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

MAP_DIR=~/Downloads
DATE=`date +%F`

export JAVA_OPTS="-Xmx14g -Xms10g -XX:+UseG1GC"
cd ~/graphhopper-master

build()
{
  NAME=$1
  RESULT_NAME=$2

  ./graphhopper.sh -a import -i "$MAP_DIR/$NAME.osm.pbf" -c "$BASEDIR/config-local.yml"

  cd "$MAP_DIR"
  ZIP_FILE="$RESULT_NAME.osm-gh.zip"
  mv "$NAME.osm-gh" "$RESULT_NAME.osm-gh"

  rm -f "$ZIP_FILE"
  7za a -tzip "$ZIP_FILE" -mx9 "$RESULT_NAME.osm-gh"
  # zip -r -9 "$ZIP_FILE" "$RESULT_NAME.osm-gh"
  aws s3 cp "$ZIP_FILE" "s3://gh-routing-data/$DATE/$ZIP_FILE" --acl public-read --content-type application/zip
}

build "dach-latest" "de-at-ch"
build "italy-latest" "italy"