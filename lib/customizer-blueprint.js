const chalk = require('chalk');
const debug = require('debug')('customizer:base');
const Env = require('yeoman-environment');

const jEnv = require('./environment');

function extend(Superclass, generatorName, originalPrototypes) {
    return class GeneratorExtender extends Superclass {
        constructor(args, opts) {
            super(args, opts);

            let generator;
            if (opts.customizers) {
                const customizers = opts.customizers.split(',');
                customizers.forEach(customizer => {
                    const lookupPath = Env.lookupGenerator(`jhipster-${customizer}:${generatorName}`);
                    debug(`Found jhipster-${customizer}:${generatorName} at ${lookupPath}`);
                    if (lookupPath !== undefined) {
                        // eslint-disable-next-line global-require,import/no-dynamic-require
                        const required = require(lookupPath);
                        // This generator should be next to be extended from.
                        jEnv.parents[generatorName] = required;
                        generator = { customizer, Generator: required, path: lookupPath };
                    }
                });
            }

            if (!generator) {
                // If a customizer is not used, then we are a full functional jhipster blueprint
                this.inheritPriorities(originalPrototypes);
            } else {
                this.info(`Using customizer ${chalk.yellow(generator.customizer)} for ${chalk.yellow(generatorName)} subgenerator`);
                debug(`Using customizer ${chalk.yellow(generator.customizer)} for ${chalk.yellow(generatorName)} subgenerator`);
                this.composeWith(generator, opts);
            }
        }
    };
}

module.exports = {
    extend
};
