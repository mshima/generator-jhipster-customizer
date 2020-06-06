/* eslint-disable default-param-last,max-params */
const _ = require('lodash');
const path = require('path');
const glob = require('glob');

const debug = require('debug')('customizer:environment');

const improver = require('./improver');
const Patcher = require('./patcher');
const createStorageProxy = require('./utils').createStorageProxy;
const JHipsterFs = require('./jhipster-fs');

const localImproverDir = path.resolve('improver/');
const packageImproverDir = path.resolve(__dirname, '../improver');
const customizerPath = path.resolve('customizer');

const improverPaths = [localImproverDir, packageImproverDir, `${customizerPath}/improver`, ...glob.sync(`${customizerPath}/*/improver/`)];

const createJHipsterGenerator = (generatorName, env, options = {}) => {
  const generator = env.requireGenerator(`jhipster:${generatorName}`);
  const packagePath = env.getPackagePath('jhipster:app');
  const generatorsPath = `${packagePath}/generators`;
  // eslint-disable-next-line import/no-dynamic-require,global-require
  const jhipsterVersion = require(`${packagePath}/package.json`).version;
  // eslint-disable-next-line import/no-dynamic-require,global-require
  const constants = require(`${generatorsPath}/generator-constants`);

  _.defaults(options, {localOnly: options.patcherPath === undefined, applyPatcher: true});

  let paths = improverPaths;
  if (options.improverPaths) {
    // Additional paths
    paths = Array.isArray(options.improverPaths) ? [...options.improverPaths, ...paths] : [options.improverPaths, ...paths];
  }

  debug('\nLoading improver at %o', paths);
  // Create the class.
  const extended = improver(generator, env, {path: paths, version: jhipsterVersion});

  debug('Options %o', options);
  // Additional features, maybe we should move some of them to files.
  return class JHipsterCustomizer extends extended {
    constructor(args, options_) {
      super(args, {
        customPriorities: [
          {
            priorityName: 'patching',
            queueName: 'patching',
            before: 'conflicts'
          }
        ],
        ...options_
      });

      this.constants = constants;

      // Store jhipster info and prototypes to inherit from.
      this.jhipsterInfo = this.jhipsterInfo || {
        version: jhipsterVersion,
        packagePath,
        originalPrototype: generator.prototype
      };

      debug('Done info');

      this.jhipsterConfig = this.jhipsterConfig || this._getStorage('generator-jhipster');
      this.storage = createStorageProxy(this.jhipsterConfig);

      this.blueprintConfig = this.blueprintConfig || this._getStorage();
      this.blueprintStorage = createStorageProxy(this.blueprintConfig);

      this.jhipsterFs = new JHipsterFs(this);

      if (generatorName.startsWith('entity')) {
        this.entityName = this._.upperFirst(args[0]) || this.name;
        this.entity = this.jhipsterFs.getEntity(this.entityName);
      }

      // Default implementation for patcher.
      if (options.applyPatcher) {
        const patcher = new Patcher(this);

        const applyPatcher = function () {
          if (options.localOnly) {
            this.constants = constants;

            patcher.patch([
              {rootPath: path.resolve(`customizer/${generatorName}`)},
              {pattern: path.resolve(`customizer/*/${generatorName}/**/*.js`), rootPath: path.resolve('customizer')}
            ]);
          } else if (options.patcherPath && (options_.fromCustomizer || options_.ignoreLocal)) {
            patcher.patch(options.patcherPath);
          } else if (options.patcherPath && !options_.fromCustomizer) {
            patcher.patch([
              options.patcherPath,
              {rootPath: path.resolve(`customizer/${generatorName}`)},
              {pattern: path.resolve(`customizer/*/${generatorName}/**/*.js`), rootPath: path.resolve('customizer')}
            ]);
          } else {
            patcher.patch();
          }
        };

        // Queue a method that will queue the applyPatcher function
        // This will make the applyPatcher to run last at writing phase.
        this.queueTask({
          method: applyPatcher,
          taskName: 'applyPatcher',
          queueName: 'patching'
        });
      }

      debug('Queued applyPatcher');
    }

    /**
     * Utility function to copy and process templates.
     *
     * @param {string} source - source
     * @param {string} destination - destination
     * @param {*} generator - reference to the generator
     * @param {*} options - options object
     * @param {*} context - context
     */
    patcherTemplate(source, destination, _generator, options = {}, _context, copyOptions) {
      // Not necessery with yeoman-generator > 4.10.1
      const customDestination = this.destinationPath(destination);
      if (!customDestination) {
        this.debug(`File ${destination} ignored`);
        return;
      }

      this.renderTemplate(source, customDestination, this._templateData(), options, copyOptions);
    }

    _templateData(...args) {
      if (this.entity && !this.entity.definitions.name) {
        // Make sure name exists
        this.entity.definitions.name = this.entityName;
      }

      return {
        ...super._templateData(...args),
        constants,
        storage: this.storage,
        blueprintStorage: this.blueprintStorage,
        generator: this,
        entity: this.entity
      };
    }
  };
};

module.exports = {createJHipsterGenerator};
