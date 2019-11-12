const chalk = require('chalk');
const debug = require('debug')('customizer:common');

const jhipsterEnv = require('../../lib/jhipster-environment');

module.exports = class extends jhipsterEnv.generator('common') {
    constructor(args, opts) {
        debug('Initializing common blueprint');
        super(args, opts);

        if (!this.configOptions) {
            this.error(`This is a JHipster blueprint and should be used only like ${chalk.yellow('jhipster --blueprint customizer')}`);
        }
    }

    get writing() {
        return { ...super._writing(), applyPatcher: this.applyPatcher };
    }
};
