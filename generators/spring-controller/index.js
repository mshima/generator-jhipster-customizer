const chalk = require('chalk');
const debug = require('debug')('customizer:spring-controller');

const jhipsterEnv = require('../../lib/environment');

module.exports = class extends jhipsterEnv.generator('spring-controller', {root: true}) {
  constructor(args, options) {
    debug('Initializing spring-controller blueprint');
    super(args, options);

    if (!this.configOptions) {
      this.error(`This is a JHipster blueprint and should be used only like ${chalk.yellow('jhipster --blueprint customizer')}`);
    }
  }

  emptyFunc() {}
};
