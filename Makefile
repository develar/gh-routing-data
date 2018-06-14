.PHONY: deps site

deps:
	brew install python node
	pip3 install --upgrade pip setuptools wheel
	pip3 install mkdocs-material mkdocs awscli pymdown-extensions --upgrade

build:
	./build-local.sh

toc:
	node ./scripts/build-info.js

site: toc
	mkdocs build
	netlifyctl deploy --publish-directory site --yes