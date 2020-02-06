.PHONY: deps site build coverage compute-geojson extract-maps toc site check-env

deps:
	brew install aria2 osmium-tool node minio/stable/mc
	# required only to build site
	brew install python
	pip3 install mkdocs-material mkdocs pymdown-extensions markdown-include --upgrade

download: check-env
	aria2c --file-allocation=none --max-connection-per-server=2 --max-concurrent-downloads=2 --input-file=configs/map-urls.txt --dir="${MAP_DIR}" --conditional-get --allow-overwrite

compile-importer:
	go build -ldflags='-s -w' -o tools/importer ./cmd/import

# env BUILD_WORKER_COUNT must set to 1 if elevation data is not yet downloaded, because graphhopper cannot download it in parallel

# Java is required, download from https://github.com/AdoptOpenJDK/openjdk13-binaries/releases/download/jdk-13.0.1%2B9/OpenJDK13U-jre_x64_mac_hotspot_13.0.1_9.tar.gz as archive (not as installation media (e.g. dmg) to not pollute your OS),
# unpack (do not use Archive Utility (otherwise will be marked as untrusted)) to some dir and prepend all commands with JAVA_HOME=<path/to/java/home> (or simply export JAVA_HOME env in current terminal window)
# e.g.: export JAVA_HOME=~/jdk-13.0.2+8-jre/Contents/Home
build: compile-importer
	BUILD_WORKER_COUNT=1 ./tools/importer --remove-osm

build-only: compile-importer
	BUILD_WORKER_COUNT=1 ./tools/importer --no-upload --graphhopper ./out/gh-importer.jar
	# ./tools/importer --no-upload --remove-osm

upload-only: compile-importer
	SKIP_ZIP=true ./tools/importer --no-build

upload-only-locus-files: compile-importer
	SKIP_ZIP=true SKIP_FILE_UPLOAD=true ./tools/importer --no-build

coverage:
	aria2c --max-connection-per-server=1 --max-concurrent-downloads=2 --input-file=configs/map-poly-urls.txt --dir=coverage/input --conditional-get --allow-overwrite
	node ./scripts/poly-to-geojson.js

# to reduce download time, some maps (e.g. france) extracted even if maybe downloaded as
extract-maps: check-env
	osmium extract --overwrite --config=coverage/extracts.json --strategy=smart --directory="${MAP_DIR}" "${MAP_DIR}/europe-latest.osm.pbf"

toc:
	go run ./cmd/toc/main.go
	./tools/toc --locus-dir=docs/locus

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

# mc mirror gh/gh-logs /Volumes/data/gh-logs
stats:
	go run ./cmd/s3logs/main.go
	goaccess ~/gh-logs.txt --log-format COMBINED -o ~/report.html --ignore-crawlers -e 95.91.255.108 --geoip-database ~/Downloads/GeoLite2-City_20200121/GeoLite2-City.mmdb
