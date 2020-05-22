const chalk = require('chalk');
const debug = require('debug')('customizer:entity');

const jhipsterEnv = require('../../lib/environment');

module.exports = class extends jhipsterEnv.generator('entity', {root: true}) {
  constructor(args, options) {
    debug(`Initializing entity blueprint: ${args[0]}`);
    super(args, options);

    if (!this.configOptions) {
      this.error(`This is a JHipster blueprint and should be used only like ${chalk.yellow('jhipster --blueprint customizer')}`);
    }
  }

  emptyFunc() {}
};
