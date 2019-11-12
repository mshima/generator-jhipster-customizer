const _ = require('lodash');
const Env = require('yeoman-environment');
const yoGenerator = require('yeoman-generator');
const path = require('path');
const chalk = require('chalk');

const debug = require('debug')('jhipster-environment');

const bugfixer = require('./bugfixer');
const Patcher = require('./patcher');

const lookupPath = Env.lookupGenerator('jhipster:app', { packagePath: true });
const packagePath = path.parse(lookupPath).name === 'generators' ? path.dirname(lookupPath) : lookupPath;
const generatorsPath = `${packagePath}/generators`;
console.log(`\nFound jhispter at ${chalk.yellow(`${generatorsPath}`)}\n`);
// eslint-disable-next-line import/no-dynamic-require
const utils = require(`${generatorsPath}/utils`);
// eslint-disable-next-line import/no-dynamic-require
const constants = require(`${generatorsPath}/generator-constants`);
// eslint-disable-next-line import/no-dynamic-require
const jhipsterVersion = require(`${packagePath}/package.json`).version;

console.log(`\nExtending peer generator-jhipster version ${chalk.yellow(`${jhipsterVersion}`)} at ${chalk.yellow(`${packagePath}`)}\n`);
const localBugfixerDir = path.resolve('bugfixer/');
const packageBugfixerDir = path.resolve(__dirname, '../bugfixer');
const bugfixerPaths = [packageBugfixerDir];

if (localBugfixerDir !== packageBugfixerDir) {
    bugfixerPaths.push(localBugfixerDir);
}

// Ensure a prototype method is a candidate run by default
const methodIsValid = function(name) {
    return name.charAt(0) !== '_' && name !== 'constructor';
};

const generator = function(generator, options = {}) {
    const defaultInherit = typeof options === 'boolean' ? options : options.defaultInherit;
    // eslint-disable-next-line global-require,import/no-dynamic-require
    const original = require(`${generatorsPath}/${generator}`);
    let paths = bugfixerPaths;
    if (options.bugfixerPaths) {
        paths = Array.isArray(options.bugfixerPaths) ? [...options.bugfixerPaths, ...paths] : [options.bugfixerPaths, ...paths];
    }
    console.log('\nLoading bugfixer at %o', paths);
    const GeneratorExtender = class GeneratorExtender extends bugfixer(original, { path: paths, version: jhipsterVersion }) {
        constructor(args, opts) {
            super(args, { ...opts, fromBlueprint: true });

            this.jhipsterInfo = {
                version: jhipsterVersion,
                packagePath,
                originalPrototype: original.prototype
            };

            if (defaultInherit !== undefined) {
                if (defaultInherit) this.inheritPriorities();
            } else if (opts.inherit === undefined || opts.inherit) {
                this.inheritPriorities();
            }

            if (options.applyPatcher) {
                const patcher = new Patcher(this);

                const applyPatcher = function() {
                    if (options.localOnly) {
                        const resolvedPath = path.resolve(`customizer/${generator}`);
                        console.log('\nLoading patcher at %o', resolvedPath);
                        patcher.patch(resolvedPath);
                    } else if (options.patcherPath) {
                        patcher.patch(options.patcherPath);
                    } else {
                        patcher.patch();
                    }
                };

                // Queue a method that will queue the applyPatcher function
                // This will make the applyPatcher to run last at writing phase.
                this.queueMethodOverrided(
                    function() {
                        this.queueMethodOverrided(applyPatcher, 'applyPatcher', 'writing');
                    },
                    'queueApplyPatcher',
                    'writing'
                );
            }
        }

        inheritPriorities(prototype = this.jhipsterInfo.originalPrototype, opts = {}) {
            const self = this;
            let queueNames = opts.queueNames || this.env.runLoop.queueNames;
            queueNames = opts.force
                ? queueNames
                : queueNames.filter(queue => Object.getOwnPropertyDescriptor(Object.getPrototypeOf(self), queue) === undefined);

            debug(queueNames);
            queueNames = queueNames.filter(queue => {
                const property = Object.getOwnPropertyDescriptor(prototype, queue);
                if (property) {
                    debug(`Queueing phase ${queue}`);
                    if (property.get) {
                        self.queueMethodOverrided(property.get.call(self), queue);
                        return false;
                    }
                    self.queueMethodOverrided(property.value, queue, queue);
                    return false;
                }
                return true;
            });
        }

        /**
         * Schedule methods on a run queue.
         *
         * @param {Function|Object} method: Method to be scheduled or object with function properties.
         * @param {String} [methodName]: Name of the method to be scheduled.
         * @param {String} [queueName]: Name of the queue to be scheduled on.
         * @param {String} [reject]: Reject callback.
         */
        queueMethodOverrided(method, methodName, queueName, reject = () => {}) {
            if (typeof queueName === 'function') {
                reject = queueName;
                queueName = 'default';
            } else {
                queueName = queueName || 'default';
            }

            if (!_.isFunction(method)) {
                if (typeof methodName === 'function') {
                    reject = methodName;
                    methodName = undefined;
                }

                queueName = methodName || queueName;
                // Run each queue items
                _.each(method, (newMethod, newMethodName) => {
                    if (!_.isFunction(newMethod) || !methodIsValid(newMethodName)) return;

                    this.queueMethod(newMethod, newMethodName, queueName, reject);
                });
                return;
            }
            this.queueMethod(method, methodName, queueName, reject);
        }
    };
    // Update queueMethod, run and _getStorage methods.
    GeneratorExtender.prototype.queueMethod = yoGenerator.prototype.queueMethod;
    GeneratorExtender.prototype.run = yoGenerator.prototype.run;
    GeneratorExtender.prototype._getStorage = yoGenerator.prototype._getStorage;
    return GeneratorExtender;
};

module.exports = { packagePath, generatorsPath, utils, constants, generator, jhipsterVersion };
