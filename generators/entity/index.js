const chalk = require('chalk');
const debug = require('debug')('customizer:entity');

const jhipsterEnv = require('../../lib/jhipster-environment');

module.exports = class extends jhipsterEnv.generator('entity', { localOnly: true }) {
    constructor(args, opts) {
        debug(`Initializing entity blueprint: ${args[0]}`);
        super(args, opts);

        if (!this.configOptions) {
            this.error(`This is a JHipster blueprint and should be used only like ${chalk.yellow('jhipster --blueprint customizer')}`);
        }
    }

    get writing() {
        return { ...super._writing(), applyPatcher: this.applyPatcher };
    }
};