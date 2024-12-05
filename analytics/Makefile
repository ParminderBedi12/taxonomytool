REPO_ROOT_DIR=$(shell git rev-parse --show-toplevel)

.PHONY: all clean test watch

node_modules = node_modules
lib = lib
pkg = package.json
src_files := $(wildcard src/*.ts) $(wildcard src/*.tsx)

all: clean lib       ## Builds clean production build and docs

lib: $(node_modules) $(src_files) ## Build the library
	@yarn run build

node_modules: $(pkg) ## Build/pull external dependencies
	@yarn install && \
	touch $(node_modules)  # in case package.json changed with no effect

test:
	@yarn run test

watch: $(node_modules) $(src_files) ## Build the library
	@yarn watch

clean:              ## Remove external dependencies and generated files
	@echo 'Removing $(node_modules)/... $(lib)/...'
	@rm -rf $(node_modules) $(lib) $(docs_dir)
