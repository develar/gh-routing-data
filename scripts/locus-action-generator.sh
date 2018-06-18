#!/usr/bin/env bash

BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

relativeFile=$1
fileName=$(basename $1)

sed -e 's~${file}~'"$relativeFile"'~g' -e 's~${name}~'"$fileName"'~g' < "$BASEDIR/locusAction.xml"