const chalk = require('chalk');
const debug = require('debug')('customizer:languages');

const jhipsterEnv = require('../../lib/environment');

module.exports = class extends jhipsterEnv.generator('languages', {root: true}) {
  constructor(args, options) {
    debug('Initializing languages blueprint');
    super(args, options);

    if (!this.configOptions) {
      this.error(`This is a JHipster blueprint and should be used only like ${chalk.yellow('jhipster --blueprint customizer')}`);
    }
  }

  emptyFunc() {}
};
