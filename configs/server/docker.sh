#!/usr/bin/env bash

docker run --rm -ti -v ${PWD}:/project -v ${MAP_DIR}:/maps -w=/project --env AWS_ACCESS_KEY_ID="$(lpass show --username $SW_S3_CREDENTIALS_ID)" --env MAP_DIR=/maps --env AWS_SECRET_ACCESS_KEY="$(lpass show --password $SW_S3_CREDENTIALS_ID)" --env AWS_CONFIG_FILE=/project/configs/scaleway-s3-config mikesir87/aws-cli /bin/sh
