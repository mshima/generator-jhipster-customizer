# generator-jhipster-customizer
[![NPM version][npm-image]][npm-url] [![Dependency Status][daviddm-image]][daviddm-url]
> JHipster blueprint, Easily customize jhipster project and create blueprints.

# Introduction

Easiest way to customize jhipster applications or to create blueprints.
This blueprint will look for patches at the customizer folder on the root of your project.

This is a [JHipster](https://www.jhipster.tech/) blueprint, that is meant to be used in a JHipster application.

# Prerequisites

As this is a [JHipster](https://www.jhipster.tech/) blueprint, we expect you have JHipster and its related tools already installed:

- [Installing JHipster](https://www.jhipster.tech/installation/)

# Usage

## To use this blueprint, run the below command

```bash
jhipster --blueprints customizer
```

This will look for patches located at the `customizer` folder with the name: `customizer/${generator_name}/**/*.js` and `customizer/${feature_name}/${generator_name}/**/*.js`.
Features with name of the generator can conflict.

## Running a patch from https://github.com/mshima/customizer-repository

```bash
jhipster --blueprints customizer --customizers one_sequence_per_entity,fix_reproducibility
```

This will copy `one_sequence_per_entity` and `fix_reproducibility` folders from the repository to customizer folder if they don't already exist.

## Creating a patch

This is a recent project, a good howto or template is missing, use one of existing patches at the [repository](https://github.com/mshima/customizer-repository) as template.

```bash
jhipster --blueprint customizer --customizers one_sequence_per_entity,fix_reproducibility
```

And use `customizer/{one_sequence_per_entity|fix_reproducibility}/*` as templates.

# License

Apache-2.0 © [Marcelo Shima](https://github.com/mshima)


[npm-image]: https://img.shields.io/npm/v/generator-jhipster-customizer.svg
[npm-url]: https://npmjs.org/package/generator-jhipster-customizer
[daviddm-image]: https://david-dm.org/mshima/generator-jhipster-customizer.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/mshima/generator-jhipster-customizer
