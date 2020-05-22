const _ = require('lodash');
const Env = require('yeoman-environment');
const yoGenerator = require('yeoman-generator');
const path = require('path');
const chalk = require('chalk');
const glob = require('glob');
const semver = require('semver');

const debug = require('debug')('customizer:environment');

const improver = require('./improver');
const Patcher = require('./patcher');

const lookupPath = Env.lookupGenerator('jhipster:app', {packagePath: true});
const packagePath = path.parse(lookupPath).name === 'generators' ? path.dirname(lookupPath) : lookupPath;
const generatorsPath = `${packagePath}/generators`;
// eslint-disable-next-line no-console
console.log(`\nFound jhispter at ${chalk.yellow(`${generatorsPath}`)}\n`);
// eslint-disable-next-line import/no-dynamic-require
const utils = require(`${generatorsPath}/utils`);
// eslint-disable-next-line import/no-dynamic-require
const constants = require(`${generatorsPath}/generator-constants`);
// eslint-disable-next-line import/no-dynamic-require
const jhipsterVersion = require(`${packagePath}/package.json`).version;

// eslint-disable-next-line no-console
console.log(`\nExtending peer generator-jhipster version ${chalk.yellow(`${jhipsterVersion}`)} at ${chalk.yellow(`${packagePath}`)}\n`);
const localImproverDir = path.resolve('improver/');
const packageImproverDir = path.resolve(__dirname, '../improver');
const customizerPath = path.resolve('customizer');

const improverPaths = [localImproverDir, packageImproverDir, `${customizerPath}/improver`, ...glob.sync(`${customizerPath}/*/improver/`)];

const createGenerator = function (generator, options = {}) {
  if (typeof options === 'boolean') {
    options = {defaultInherit: options};
  }

  if (options.root) {
    _.defaults(options, {localOnly: true, applyPatcher: true, defaultInherit: false});
  }

  let parent = options.parent;
  let paths;
  if (options.root) {
    // If root, then use paths from this module.
    paths = improverPaths;
    if (options.improverPaths) {
      // Additional paths
      paths = Array.isArray(options.improverPaths) ? [...options.improverPaths, ...paths] : [options.improverPaths, ...paths];
    }

    // Load jhipster generator
    // eslint-disable-next-line global-require,import/no-dynamic-require
    parent = parent || require(`${generatorsPath}/${generator}`);
  } else {
    // Use only additional paths. Bugfixes from this module should already been loaded on cached parent.
    paths = Array.isArray(options.improverPaths) ? options.improverPaths : [options.improverPaths];
  }

  debug('\nLoading improver at %o', paths);
  // Create the class.
  let extended = improver(parent, {path: paths, version: jhipsterVersion});
  if (options.root) {
    // If root (this module), load the customizer-blueprint patch.
    // eslint-disable-next-line global-require
    extended = require('./customizer-blueprint').extend(extended, generator, [parent.prototype]);
  }

  debug('Options %o', options);
  // Additional features, maybe we should move some of them to files.
  const GeneratorExtender = class GeneratorExtender extends extended {
    constructor(args, options_) {
      super(args, {...options_, fromBlueprint: true});

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

      debug('Done info');

      // Load inherited phases. Used for a clean blueprint implementation.
      if (options.defaultInherit !== undefined) {
        if (options.defaultInherit) this.inheritPriorities();
      } else if (options_.inherit === undefined || options_.inherit) {
        this.inheritPriorities();
      }

      debug('Done inheritPriorities');

      // Default implementation for patcher.
      if (options.applyPatcher) {
        const patcher = new Patcher(this);

        const applyPatcher = function () {
          if (options.localOnly) {
            this.constants = constants;
            Object.assign(this, this.options.configOptions);
            Object.assign(this, this.config.getAll());

            patcher.patch([
              {rootPath: path.resolve(`customizer/${generator}`)},
              {pattern: path.resolve(`customizer/*/${generator}/**/*.js`), rootPath: path.resolve('customizer')}
            ]);
          } else if (options.patcherPath && (options_.fromCustomizer || options_.ignoreLocal)) {
            patcher.patch(options.patcherPath);
          } else if (options.patcherPath && !options_.fromCustomizer) {
            Object.assign(this, constants);
            Object.assign(this, this.options.configOptions);
            Object.assign(this, this.config.getAll());

            patcher.patch([
              options.patcherPath,
              {rootPath: path.resolve(`customizer/${generator}`)},
              {pattern: path.resolve(`customizer/*/${generator}/**/*.js`), rootPath: path.resolve('customizer')}
            ]);
          } else {
            patcher.patch();
          }
        };

        // Queue a method that will queue the applyPatcher function
        // This will make the applyPatcher to run last at writing phase.
        this.queueMethod(
          function () {
            this.queueMethod(applyPatcher, 'applyPatcher', 'writing');
          },
          'queueApplyPatcher',
          'writing'
        );
      }

      debug('Done applyPatcher');
    }

    /**
     * This will queue phases, that doesn't exists on the class, from prototypes.
     * @param {Object} opts - Options.
     * @param {boolean} opts.force - Queue the phase even if the generator implements it
     */
    inheritPriorities(prototypes = this.jhipsterInfo.originalPrototypes, options_ = {}) {
      const self = this;
      let queueNames = options_.queueNames || this.env.runLoop.queueNames;
      queueNames = options_.force
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
              self.queueMethod(property.get.call(self), queue);
              return false;
            }

            self.queueMethod(property.value, queue, queue);
            return false;
          }

          return true;
        });
      });
    }
  };

  if (semver.lt(jhipsterVersion, '6.6.1')) {
    // Update queueMethod, run and _getStorage methods, not needed when jhipster upgrade yeoman-generator to 4.4.0.
    GeneratorExtender.prototype.queueMethod = yoGenerator.prototype.queueMethod;
    GeneratorExtender.prototype.run = yoGenerator.prototype.run;
    GeneratorExtender.prototype._getStorage = yoGenerator.prototype._getStorage;
  }

  return GeneratorExtender;
};

module.exports = {
  packagePath,
  generatorsPath,
  utils,
  constants,
  generator: (generator, options = {}) => createGenerator(generator, options),
  createGenerator,
  jhipsterVersion
};
