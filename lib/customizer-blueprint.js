const chalk = require('chalk');
const debug = require('debug')('customizer:base');
const Env = require('yeoman-environment');

const jEnv = require('./environment');

// Options is not passed to languages generator.
// Keep it cached from first found.
let customizerBlueprints;

function extend(Superclass, generatorName, originalPrototypes) {
    return class GeneratorExtender extends Superclass {
        constructor(args, opts) {
            super(args, opts);

            debug('Loading customizerBlueprints');
            const generators = [];
            const customizerConfig = this._getStorage('generator-jhipster-customizer');
            let compatibleGenerator;
            if (!customizerBlueprints) {
                customizerBlueprints = customizerConfig.get('customizerBlueprints') || [];
                if (opts.customizerBlueprints) {
                    customizerBlueprints = customizerBlueprints.concat(opts.customizerBlueprints.split(','));
                }
            }
            customizerBlueprints = this._.uniq(customizerBlueprints).filter(blueprint => blueprint);
            customizerConfig.set('customizerBlueprints', customizerBlueprints);

            debug('Loading customizerBlueprints %o', customizerBlueprints);

            if (customizerBlueprints && customizerBlueprints.length > 0) {
                debug('Looking %o', customizerBlueprints);
                customizerBlueprints.forEach(blueprint => {
                    let customizerCompatible = true;
                    if (blueprint.startsWith('@')) {
                        blueprint = blueprint.substring(1);
                        customizerCompatible = false;
                    }
                    debug(`Looking jhipster-${blueprint}:${generatorName}`);
                    const lookupPath = Env.lookupGenerator(`jhipster-${blueprint}:${generatorName}`);
                    if (lookupPath !== undefined) {
                        debug(`Found jhipster-${blueprint}:${generatorName} at ${lookupPath}`);
                        // eslint-disable-next-line global-require,import/no-dynamic-require
                        const required = require(lookupPath);
                        if (customizerCompatible) {
                            // This generator should be next to be extended from.
                            jEnv.parents[generatorName] = required;
                            compatibleGenerator = { blueprint, Generator: required, path: lookupPath };
                        } else {
                            const generator = jEnv.generator(generatorName, { parent: required });
                            generators.push({ blueprint, Generator: generator, path: lookupPath });
                        }
                    }
                });
                debug('Done looking');
            }

            const info = debug.enabled ? debug : this.info;
            if (!compatibleGenerator) {
                debug('We are a full functional jhipster blueprint');
                this.inheritPriorities(originalPrototypes);
            } else {
                debug('Composing');
                info(
                    `Using customizer blueprint ${chalk.yellow(compatibleGenerator.blueprint)} for ${chalk.yellow(
                        generatorName
                    )} subgenerator`
                );
                this.composeWith(compatibleGenerator, { ...opts, fromCustomizer: true });
            }

            if (generators.length > 0) {
                generators.forEach(generator => {
                    info(`Using customizer blueprint ${chalk.yellow(generator.blueprint)} for ${chalk.yellow(generatorName)} subgenerator`);
                    this.composeWith(generator, { ...opts, fromCustomizer: true });
                });
            }
        }
    };
}

module.exports = {
    extend
};
