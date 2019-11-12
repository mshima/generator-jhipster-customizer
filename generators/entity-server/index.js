const chalk = require('chalk');
const debug = require('debug')('customizer:entity:server');

const jhipsterEnv = require('../../lib/jhipster-environment');

module.exports = class extends jhipsterEnv.generator('entity-server') {
    constructor(args, opts) {
        debug(`Initializing entity-server blueprint: ${opts.context.name}`);
        super(args, opts);

        if (!this.configOptions) {
            this.error(`This is a JHipster blueprint and should be used only like ${chalk.yellow('jhipster --blueprint customizer')}`);
        }
    }

    get writing() {
        return { ...super._writing(), applyPatcher: this.applyPatcher };
    }
};
