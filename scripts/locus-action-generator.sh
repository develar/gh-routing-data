#!/usr/bin/env bash

BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

relativeFile=$1
fileName=$(basename $1)
fileSize=$2

sed -e 's~${file}~'"$relativeFile"'~g' -e 's~${name}~'"$fileName"'~g' -e 's~${size}~'"$fileSize"'~g' < "$BASEDIR/locusAction.xml"