# monorepo JS projects

This directory contains JS projects as workspaces under one Yarn package.

### Adding a new JS project

Follow the steps below:
- [ ] Add the new project root as a directory under the `projects`
- [ ] Add it to the `workspaces` section of the `package.json` in this directory, e.g. `projects/<new project name>`
  ```yaml
  - save_cache:
      key: npm-{{ .Branch }}-{{ .Revision }}
      paths:
        - ./js/node_modules
        # ...
        - ./js/projects/<new project name>

  ```
- [ ] Add a `build` script to the new project `package.json`. The root project runs `yarn build` for each child workspace
- [ ] For any dependencies which should absolutely **not** be hoisted to the root or shared with other workspaces in the project, add them to the root `package.json` in this directory. See docs on [nohoist](https://yarnpkg.com/blog/2018/02/15/nohoist/)
- [ ] **IMPORTANT**: Make sure your project **avoids circular dependencies**. Otherwise, you can import it by including the name in its `package.json` as a dependency in any other project in this workspace.

