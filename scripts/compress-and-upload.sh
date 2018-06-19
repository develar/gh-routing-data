#!/usr/bin/env bash
set -ex

[ -z "$MAP_DIR" ] && echo "Need to set env MAP_DIR (where to store map files)" && exit 1;

BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$MAP_DIR"

DATE=`date +%F`
RESULT_NAME=$1
zipFile="$RESULT_NAME.osm-gh.zip"

# 7za very slow - compression ratio doesn't worth spent time (2m52.212s vs 11m16.306s)
if [[ -z "${SKIP_ZIP}" ]]; then
  rm -f "$zipFile"
  zip -r -9 "$zipFile" "$RESULT_NAME.osm-gh"
  aws s3 cp "$zipFile" "s3://gh-routing-data/$DATE/$zipFile" --acl public-read --content-type application/zip
fi

"$BASEDIR/locus-action-generator.sh" "$DATE/$zipFile" | mc pipe "gh-data/gh-data/$DATE/$RESULT_NAME.locus.xml"