#!/usr/bin/env bash
set -ex

for filename in *.MP4; do
  ffmpeg -i "$filename" -map_metadata 0 -map_chapters 0 -c:v libx265 -preset slow -x265-params lossless=1 "x265_$filename"
done