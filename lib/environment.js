/* eslint-disable default-param-last */
const _ = require('lodash');
const path = require('path');
const glob = require('glob');

const debug = require('debug')('customizer:environment');

const improver = require('./improver');
const Patcher = require('./patcher');
const createConfigOptions = require('./utils').createConfigOptions;

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
      super(args, options_);

      this.constants = constants;

      // Store jhipster info and prototypes to inherit from.
      this.jhipsterInfo = this.jhipsterInfo || {
        version: jhipsterVersion,
        packagePath,
        originalPrototype: generator.prototype
      };

      debug('Done info');

      this.storage = createConfigOptions(this.jhipsterConfig);

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

      const templateData = this._templateData() || {};
      Object.assign(templateData, {storage: this.storage, generator: this.generator});

      this.renderTemplate(source, customDestination, templateData, options, copyOptions);
    }
  };
};

module.exports = {createJHipsterGenerator};
