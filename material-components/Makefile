REPO_ROOT_DIR=$(shell git rev-parse --show-toplevel)

include $(REPO_ROOT_DIR)/tools/MakefileHelp.mk

.PHONY: lib-clean test clean

node_modules = node_modules
docs_dir = docs
lib = lib
pkg = package.json
src_files := $(wildcard src/*.ts) $(wildcard src/*.tsx)

all:                 ## Builds clean production build and docs
	@$(MAKE) lib-clean docs

docs: $(src_files)   ## Build static documentation files
	@yarn doc

lib: $(node_modules) $(src_files) ## Build the library
	@yarn run build

lib-clean:           ## Clean and then build
	@$(MAKE) clean node_modules lib

node_modules: $(pkg) ## Build/pull external dependencies
	@yarn install && \
	touch $(node_modules)  # in case package.json changed with no effect

test:
	@yarn run test

watch: $(node_modules) $(src_files) ## Build the library
	@yarn watch 

clean:              ## Remove external dependencies and generated files
	@echo 'Removing $(node_modules)/... $(lib)/... $(docs_dir)/...'
	@rm -rf $(node_modules) $(lib) $(docs_dir)

