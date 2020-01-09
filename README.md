### Installation

Prerequisites: [Node.js](https://nodejs.org/en/) (>=6.x, 8.x preferred), npm version 3+ and [Git](https://git-scm.com/).

``` bash
$ npm install -g masoneast-cli
```

### Usage

``` bash
$ masoneast init <project-name>
```

Example:

``` bash
$ masoneast init my-project
```

if you want use `clone`, you can:

``` bash
$ masoneast init my-project -c
or
$ masoneast init my-project --clone
```

If you have templates locally, you can use them offline to create projects

``` bash
$ masoneast init my-project --offline
```