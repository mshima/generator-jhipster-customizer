const chalk = require('chalk');
const debug = require('debug')('customizer:common');

const jhipsterEnv = require('../../lib/environment');

module.exports = class extends jhipsterEnv.generator('common', {root: true}) {
  constructor(args, options) {
    debug('Initializing common blueprint');
    super(args, options);

    if (!this.configOptions) {
      this.error(`This is a JHipster blueprint and should be used only like ${chalk.yellow('jhipster --blueprint customizer')}`);
    }
  }

  emptyFunc() {}
};
