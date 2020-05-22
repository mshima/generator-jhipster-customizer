const chalk = require('chalk');
const debug = require('debug')('customizer:entity:i18n');

const jhipsterEnv = require('../../lib/environment');

module.exports = class extends jhipsterEnv.generator('entity-i18n', {root: true}) {
  constructor(args, options) {
    debug(`Initializing entity-i18n blueprint: ${options.context.name}`);
    super(args, options);

    if (!this.configOptions) {
      this.error(`This is a JHipster blueprint and should be used only like ${chalk.yellow('jhipster --blueprint customizer')}`);
    }
  }

  emptyFunc() {}
};
