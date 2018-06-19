.PHONY: deps site build coverage compute-geojson extract-maps toc site check-env

deps:
	brew install python node osmium-tool minio/stable/mc
	pip3 install mkdocs-material mkdocs pymdown-extensions --upgrade

build:
	./build.sh

coverage:
	aria2c --max-connection-per-server=2 --max-concurrent-downloads=2 --input-file=coverage/urls.txt --dir=coverage/input --conditional-get --allow-overwrite
	node ./scripts/poly-to-geojson.js

extract-maps: check-env
	osmium extract --overwrite --config=configs/extracts.json --strategy=smart --directory=$MAP_DIR ~/Downloads/europe-latest.osm.pbf

toc:
	node ./scripts/build-toc.js

site: toc
	mkdocs build
	netlifyctl deploy --publish-directory site --yes

check-env:
	@: $(if ${MAP_DIR},,$(error Need to set env MAP_DIR (where to store map files)))