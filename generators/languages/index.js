const chalk = require('chalk');
const logBuilder = require('debug');

const generator = 'languages';
const debug = logBuilder(`customizer:${generator}`);

const jhipsterEnv = require('../../lib/environment');

module.exports = {
  createGenerator: env => {
    return class extends jhipsterEnv.createJHipsterGenerator(generator, env) {
      constructor(args, options) {
        debug(`Initializing ${generator} blueprint`);
        super(args, options);

        if (!this.configOptions) {
          this.error(`This is a JHipster blueprint and should be used only like ${chalk.yellow('jhipster --blueprint customizer')}`);
        }

        this.sbsBlueprint = true;
      }

      emptyFunc() {}
    };
  }
};
