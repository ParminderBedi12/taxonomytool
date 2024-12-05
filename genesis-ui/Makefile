REPO_ROOT_DIR=$(shell git rev-parse --show-toplevel)

.PHONY: build build-clean lint run source-map-explore test clean

node_modules = node_modules
out = build
pkg = package.json
src_files := $(wildcard src/**/*)

build: $(node_modules) $(src_files) ## Build the project sources only, drop into build dir
	@rm -f .env.production.local && \
	yarn run build

build-clean:        ## Clean and then build
	@$(MAKE) clean build

node_modules: $(pkg) ## Build/pull external dependencies
	yarn install && \
	touch $(node_modules)  # in case package.json changed with no effect

lint:               ## Runs eslint on the src directory
	yarn run lint

run: $(node_modules) ## Run build with auto-reload
	yarn run start

run-prod-local: $(node_modules) ## Serve files locally using local env vars
	@cp .env.local .env.production.local && \
	yarn run build	&& \
	firebase serve -p 3000

test:
	yarn run test

clean:              ## Remove external dependencies and generated files
	@echo 'Removing $(node_modules)/... $(out)/...'
	@rm -rf $(node_modules) $(out)
