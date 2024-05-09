
# NAME
[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

### A library for compiling TypeScript into JavaScript using SWC.
Compiler reads from tsconfig.json.

<br />

## Table of Contents
- [ Installation ](#install)
- [ Usage ](#usage)

<br />

<a name="install"></a>
## Install

```console
pnpm install
```

<br />

<a name="usage"></a>
## Usage

### ./tsconfig.json:

```jsonc
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "include": ["src/**/*"],
  "exclude": ["dist", ".build", "node_modules"],
  "compilerOptions": {
    "rootDir": "./src" /* Specify the root folder within your source files. */,
    "outDir": "./dist" /* Specify an output folder for all emitted files. */,
  }
}
```

### Emit declaration files:

```console
pnpm tsswc --dts
```

### Compile only:

```console
pnpm tsswc
```
