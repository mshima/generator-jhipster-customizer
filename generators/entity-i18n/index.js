const chalk = require('chalk');
const debug = require('debug')('customizer:entity:i18n');

const jhipsterEnv = require('../../lib/jhipster-environment');

module.exports = class extends jhipsterEnv.generator('entity-i18n', { root: true }) {
    constructor(args, opts) {
        debug(`Initializing entity-i18n blueprint: ${opts.context.name}`);
        super(args, opts);

        if (!this.configOptions) {
            this.error(`This is a JHipster blueprint and should be used only like ${chalk.yellow('jhipster --blueprint customizer')}`);
        }
    }

    emptyFunc() {}
};
