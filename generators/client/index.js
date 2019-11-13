const chalk = require('chalk');
const debug = require('debug')('customizer:client');

const jhipsterEnv = require('../../lib/environment');

module.exports = class extends jhipsterEnv.generator('client', { root: true }) {
    constructor(args, opts) {
        debug('Initializing client blueprint');
        super(args, opts);

        if (!this.configOptions) {
            this.error(`This is a JHipster blueprint and should be used only like ${chalk.yellow('jhipster --blueprint customizer')}`);
        }
    }

    emptyFunc() {}
};
