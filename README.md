# generator-jhipster-customizer
[![NPM version](https://img.shields.io/npm/v/generator-jhipster-customizer.svg)](https://npmjs.org/package/generator-jhipster-customizer)
[![Node.js CI](https://github.com/mshima/generator-jhipster-customizer/workflows/Node.js%20CI/badge.svg)](https://github.com/mshima/generator-jhipster-customizer/actions?query=workflow%3A%22Node.js+CI%22)
[![Dependency Status][daviddm-image]][daviddm-url]
> JHipster blueprint, Easily customize jhipster project and create blueprints.

# Introduction

Apply customizations to multiples jhipster projects.
Can be used to create blueprints based on patches.

This is a [JHipster](https://www.jhipster.tech/) blueprint, that is meant to be used in a JHipster application.

# Prerequisites

As this is a [JHipster](https://www.jhipster.tech/) blueprint, we expect you have JHipster and its related tools already installed:

- [Installing JHipster](https://www.jhipster.tech/installation/)

# Installation

To install this blueprint:

```bash
npm install -g generator-jhipster-customizer
```

# Usage

## To use this blueprint, run the below command

```bash
jhipster --blueprints customizer
```

This will look for patches located at the `customizer` folder with the name: `customizer/${generator_name}/**/*.js` and `customizer/${feature_name}/${generator_name}/**/*.js`.
Features with name of the generator can conflict.

## Creating a patch

There are some examples at examples folder.

# License

Apache-2.0 © [Marcelo Shima](https://github.com/mshima)


[daviddm-image]: https://david-dm.org/mshima/generator-jhipster-customizer.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/mshima/generator-jhipster-customizer
