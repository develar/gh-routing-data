.PHONY: deps site build coverage compute-geojson extract-maps toc site check-env

deps:
	brew install aria2 osmium-tool node rsync
	# required only to build site
	brew install python
	pip3 install mkdocs-material mkdocs pymdown-extensions --upgrade

download: check-env
	aria2c --file-allocation=none --max-connection-per-server=2 --dir="${MAP_DIR}" --conditional-get --allow-overwrite 'https://repo1.maven.org/maven2/com/graphhopper/graphhopper-web/1.0-pre17/graphhopper-web-1.0-pre17.jar'
	aria2c --file-allocation=none --max-connection-per-server=2 --max-concurrent-downloads=2 --input-file=configs/map-urls.txt --dir="${MAP_DIR}" --conditional-get --allow-overwrite

compile-builder:
	go build -ldflags='-s -w' -o tools/builder ./cmd

# env BUILD_WORKER_COUNT must set to 1 if elevation data is not yet downloaded, because graphhopper cannot download it in parallel

# Java is required, download from https://github.com/AdoptOpenJDK/openjdk13-binaries/releases/download/jdk-13.0.1%2B9/OpenJDK13U-jre_x64_mac_hotspot_13.0.1_9.tar.gz as archive (not as installation media (e.g. dmg) to not pollute your OS),
# unpack (do not use Archive Utility (otherwise will be marked as untrusted)) to some dir and prepend all commands with JAVA_HOME=<path/to/java/home> (or simply export JAVA_HOME env in current terminal window)
# e.g.: export JAVA_HOME=~/Downloads/jdk-13.0.1+9-jre/Contents/Home
build: compile-builder
	BUILD_WORKER_COUNT=1 ./tools/builder --remove-osm

build-only: compile-builder
	BUILD_WORKER_COUNT=1 ./tools/builder --no-upload
	# ./tools/builder --no-upload --remove-osm

upload-only: compile-builder
	SKIP_ZIP=true ./tools/builder --no-build

upload-only-locus-files: compile-builder
	SKIP_ZIP=true SKIP_FILE_UPLOAD=true ./tools/builder --no-build

coverage:
	aria2c --max-connection-per-server=2 --max-concurrent-downloads=2 --input-file=configs/map-poly-urls.txt --dir=coverage/input --conditional-get --allow-overwrite
	node ./scripts/poly-to-geojson.js

extract-maps: check-env
	osmium extract --overwrite --config=coverage/extracts.json --strategy=smart --directory="${MAP_DIR}" "${MAP_DIR}/europe-latest.osm.pbf"

toc:
	node ./scripts/build-toc.js

site: toc
	mkdocs build --clean

publish-site: site
	netlifyctl deploy --publish-directory site --yes

check-env:
	@: $(if ${MAP_DIR},,$(error Need to set env MAP_DIR (where to store map files)))

size:
	find "${MAP_DIR}" -type f -name '*.zip' -exec du -ch {} + | grep total$

# brew install golangci/tap/golangci-lint && brew upgrade golangci/tap/golangci-lint
lint:
	golangci-lint run

dev-site:
	# chrome://flags/#allow-insecure-localhost to tell Chrome to ignore cert warnings on localhost
	caddy -root site -quic -port 8080 -host localhost "ext .html" "log stdout" "tls self_signed" "bind 127.0.0.1"

update-deps:
	go get -u ./...
	go mod tidy