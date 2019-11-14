const _ = require('lodash');
const Env = require('yeoman-environment');
const yoGenerator = require('yeoman-generator');
const path = require('path');
const chalk = require('chalk');

const debug = require('debug')('customizer:environment');

const singleton = require('./singleton');
const improver = require('./improver');
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
const localImproverDir = path.resolve('improver/');
const packageImproverDir = path.resolve(__dirname, '../improver');
const improverPaths = [packageImproverDir];

if (localImproverDir !== packageImproverDir) {
    improverPaths.push(localImproverDir);
}

// Ensure a prototype method is a candidate run by default
const methodIsValid = function(name) {
    return name.charAt(0) !== '_' && name !== 'constructor';
};

// Last cached classes.
// Used for multiple customizers (a customizer must extend the last one).
const cachedParents = {};

const createGenerator = function(generator, options = {}) {
    if (typeof options === 'boolean') {
        options = { defaultInherit: options };
    }
    if (options.root) {
        _.defaults(options, { localOnly: true, applyPatcher: true, defaultInherit: false });
    }
    const defaultInherit = options.defaultInherit;

    // Get last loaded customizer
    const cachedParent = cachedParents[generator];
    let parent;
    let paths;
    if (options.root || !cachedParents[generator]) {
        // If root, then use paths from this module.
        paths = improverPaths;
        if (options.improverPaths) {
            // Additional paths
            paths = Array.isArray(options.improverPaths) ? [...options.improverPaths, ...paths] : [options.improverPaths, ...paths];
        }
        // Load jhipster generator
        // eslint-disable-next-line global-require,import/no-dynamic-require
        parent = require(`${generatorsPath}/${generator}`);
    } else {
        // Use only additional paths. Bugfixes from this module should already been loaded on cached parent.
        paths = Array.isArray(options.improverPaths) ? options.improverPaths : [options.improverPaths];
        // Use the cachedParent as parent
        parent = cachedParent;
    }
    debug('\nLoading improver at %o', paths);
    // Create the class.
    let extended = improver(parent, { path: paths, version: jhipsterVersion });
    if (options.root) {
        // If root (this module), load the customizer-blueprint patch.
        // eslint-disable-next-line global-require,import/no-dynamic-require
        extended = require('./customizer-blueprint').extend(extended, generator, [parent.prototype]);
    }

    // Additional features, maybe we should move some of them to files.
    const GeneratorExtender = class GeneratorExtender extends extended {
        constructor(args, opts) {
            super(args, { ...opts, fromBlueprint: true });

            this.constants = constants;

            // Store jhipster info and prototypes to inherit from.
            if (this.jhipsterInfo) {
                this.jhipsterInfo.originalPrototypes.push(parent.prototype);
            } else {
                this.jhipsterInfo = {
                    version: jhipsterVersion,
                    packagePath,
                    originalPrototypes: [parent.prototype]
                };
            }

            // Load inherited phases. Used for a clean blueprint implementation.
            if (defaultInherit !== undefined) {
                if (defaultInherit) this.inheritPriorities();
            } else if (opts.inherit === undefined || opts.inherit) {
                this.inheritPriorities();
            }

            // Default implementation for patcher.
            if (options.applyPatcher) {
                const patcher = new Patcher(this);

                const applyPatcher = function() {
                    if (options.localOnly) {
                        patcher.patch([
                            { rootPath: path.resolve(`customizer/${generator}`) },
                            { pattern: path.resolve(`customizer/*/${generator}/**/*.js`), rootPath: path.resolve('customizer') }
                        ]);
                    } else if (options.patcherPath && (opts.fromCustomizer || opts.ignoreLocal)) {
                        patcher.patch(options.patcherPath);
                    } else if (options.patcherPath && !opts.fromCustomizer) {
                        patcher.patch([
                            options.patcherPath,
                            { rootPath: path.resolve(`customizer/${generator}`) },
                            { pattern: path.resolve(`customizer/*/${generator}/**/*.js`), rootPath: path.resolve('customizer') }
                        ]);
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

        // This will queue phases, that doesn't exists on the class, from prototypes like as a declared phase.
        inheritPriorities(prototypes = this.jhipsterInfo.originalPrototypes, opts = {}) {
            const self = this;
            let queueNames = opts.queueNames || this.env.runLoop.queueNames;
            queueNames = opts.force
                ? queueNames
                : queueNames.filter(queue => Object.getOwnPropertyDescriptor(Object.getPrototypeOf(self), queue) === undefined);

            debug('Missing phases:');
            debug(queueNames);
            prototypes.reverse().forEach(prototype => {
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
            });
        }

        // A new implementation of queueMethod.
        // https://github.com/yeoman/generator/pull/1135
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

    // Update queueMethod, run and _getStorage methods, not needed when jhipster upgrade yeoman-generator to 4.2.0.
    GeneratorExtender.prototype.queueMethod = yoGenerator.prototype.queueMethod;
    GeneratorExtender.prototype.run = yoGenerator.prototype.run;
    GeneratorExtender.prototype._getStorage = yoGenerator.prototype._getStorage;
    return GeneratorExtender;
};

// Create a singleton https://derickbailey.com/2016/03/09/creating-a-true-singleton-in-node-js-with-es6-symbols/
// For a multi-module dependency.
let singletonValue = singleton.singleton;
const cachedGenerator = function(generator, options = {}) {
    if (!singletonValue) {
        singletonValue = {
            packagePath,
            generatorsPath,
            utils,
            constants,
            generator: cachedGenerator,
            createGenerator,
            jhipsterVersion,
            parents: cachedParents
        };
        if (options.root) {
            singleton.singleton = singletonValue;
        }
    }
    return singletonValue.createGenerator(generator, options);
};

module.exports = singletonValue || {
    packagePath,
    generatorsPath,
    utils,
    constants,
    generator: cachedGenerator,
    createGenerator,
    jhipsterVersion,
    parents: cachedParents
};
