# generator-jhipster-customizer
[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]
> JHipster blueprint, Easily customize jhipster project and create blueprints.

# Introduction

Easiest way to customize jhipster applications or to create blueprints.
This blueprint will look for patches at the the customizer folder on the root of your project.

This is a [JHipster](https://www.jhipster.tech/) blueprint, that is meant to be used in a JHipster application.

# Prerequisites

As this is a [JHipster](https://www.jhipster.tech/) blueprint, we expect you have JHipster and its related tools already installed:

- [Installing JHipster](https://www.jhipster.tech/installation/)

# Installation

## With NPM

To install this blueprint:

```bash
npm install -g generator-jhipster-customizer
```

To update this blueprint:

```bash
npm update -g generator-jhipster-customizer
```

## With Yarn

To install this blueprint:

```bash
yarn global add generator-jhipster-customizer
```

To update this blueprint:

```bash
yarn global upgrade generator-jhipster-customizer
```

# Usage

## To use this blueprint, run the below command

```bash
jhipster --blueprint customizer
```

This will look for patches located at the `customizer` folder with the name: `customizer/${generator_name}/**/*.js` and `customizer/${feature_name}/${generator_name}/**/*.js`.
Features with name of the generator can conflict.

## Running a patch from https://github.com/mshima/customizer-repository

```bash
jhipster --blueprint customizer --customizers one_sequence_per_entity,template
```

This will copy `one_sequence_per_entity` and `template` folders from the repository to customizer folder if they don't already exist.

## Creating a patch

```bash
jhipster --blueprint customizer --customizers template
```

And use `customizer/template/*` as templates.

# License

Apache-2.0 © [Marcelo Shima](https://github.com/mshima)


[npm-image]: https://img.shields.io/npm/v/generator-jhipster-customizer.svg
[npm-url]: https://npmjs.org/package/generator-jhipster-customizer
[travis-image]: https://travis-ci.org/mshima/generator-jhipster-customizer.svg?branch=master
[travis-url]: https://travis-ci.org/mshima/generator-jhipster-customizer
[daviddm-image]: https://david-dm.org/mshima/generator-jhipster-customizer.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/mshima/generator-jhipster-customizer
