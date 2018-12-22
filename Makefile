.PHONY: deps site build coverage compute-geojson extract-maps toc site check-env

deps:
	brew install aria2 osmium-tool node minio/stable/minio
	# required only to build site
	brew install python
	pip3 install mkdocs-material mkdocs pymdown-extensions --upgrade

download: check-env
	aria2c --file-allocation=none --max-connection-per-server=2 --max-concurrent-downloads=2 --input-file=configs/map-urls.txt --dir="${MAP_DIR}" --conditional-get --allow-overwrite

compile-builder:
	go build -ldflags='-s -w' -o tools/builder ./cmd

# Java is required, download from https://www.oracle.com/technetwork/java/javase/downloads/jdk11-downloads-5066655.html as archive (not as installation media (e.g. dmg) to not pollute your OS),
# unpack to some dir and prepend all commands with JAVA_HOME=<path/to/java/home> (or simply export JAVA_HOME env in current terminal window)
# e.g.: export JAVA_HOME=~/Downloads/jdk-11.0.1.jdk/Contents/Home
build: compile-builder
	./tools/builder --remove-osm

build-only: compile-builder
	./tools/builder --no-upload

upload-only: compile-builder
	SKIP_ZIP=true ./tools/builder --no-build

upload-only-locus-files: compile-builder
	SKIP_ZIP=true SKIP_FILE_UPLOAD=true ./tools/builder --no-build

coverage:
	aria2c --max-connection-per-server=2 --max-concurrent-downloads=2 --input-file=coverage/urls.txt --dir=coverage/input --conditional-get --allow-overwrite
	node ./scripts/poly-to-geojson.js

extract-maps: check-env
	aria2c --file-allocation=none --max-connection-per-server=2 --dir="${MAP_DIR}" --conditional-get --allow-overwrite http://download.geofabrik.de/europe-latest.osm.pbf
	osmium extract --overwrite --config=coverage/extracts.json --strategy=smart --directory="${MAP_DIR}" "${MAP_DIR}/europe-latest.osm.pbf"

toc:
	node ./scripts/build-toc.js

site: toc
	mkdocs build --clean
	netlifyctl deploy --publish-directory site --yes

check-env:
	@: $(if ${MAP_DIR},,$(error Need to set env MAP_DIR (where to store map files)))

size:
	find "${MAP_DIR}" -type f -name '*.zip' -exec du -ch {} + | grep total$

# brew install golangci/tap/golangci-lint && brew upgrade golangci/tap/golangci-lint
lint:
	golangci-lint run

update-deps:
	go get -u
	go mod tidy