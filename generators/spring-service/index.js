const chalk = require('chalk');
const debug = require('debug')('customizer:spring-service');

const jhipsterEnv = require('../../lib/jhipster-environment');

module.exports = class extends jhipsterEnv.generator('spring-service', { root: true }) {
    constructor(args, opts) {
        debug('Initializing spring-service blueprint');
        super(args, opts);

        if (!this.configOptions) {
            this.error(`This is a JHipster blueprint and should be used only like ${chalk.yellow('jhipster --blueprint customizer')}`);
        }
    }

    emptyFunc() {}
};
