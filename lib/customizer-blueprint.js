const chalk = require('chalk');
const debug = require('debug')('customizer:base');
const Env = require('yeoman-environment');

const jEnv = require('./environment');

function extend(Superclass, generatorName, originalPrototypes) {
    return class GeneratorExtender extends Superclass {
        constructor(args, opts) {
            super(args, opts);

            let generator;
            if (opts.customizerBlueprints) {
                const customizerBlueprints = opts.customizerBlueprints.split(',');
                customizerBlueprints.forEach(blueprint => {
                    const lookupPath = Env.lookupGenerator(`jhipster-${blueprint}:${generatorName}`);
                    debug(`Found jhipster-${blueprint}:${generatorName} at ${lookupPath}`);
                    if (lookupPath !== undefined) {
                        // eslint-disable-next-line global-require,import/no-dynamic-require
                        const required = require(lookupPath);
                        // This generator should be next to be extended from.
                        jEnv.parents[generatorName] = required;
                        generator = { blueprint, Generator: required, path: lookupPath };
                    }
                });
            }

            if (!generator) {
                // If a customizer is not used, then we are a full functional jhipster blueprint
                this.inheritPriorities(originalPrototypes);
            } else {
                this.info(
                    `Using customizer blueprint ${chalk.yellow(generator.blueprint)} for ${chalk.yellow(generatorName)} subgenerator`
                );
                debug(`Using customizer blueprint ${chalk.yellow(generator.blueprint)} for ${chalk.yellow(generatorName)} subgenerator`);
                this.composeWith(generator, { ...opts, fromCustomizer: true });
            }
        }
    };
}

module.exports = {
    extend
};
