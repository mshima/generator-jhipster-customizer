const _ = require('lodash');
const path = require('path');
const glob = require('glob');

const debug = require('debug')('customizer:environment');

const improver = require('./improver');
const Patcher = require('./patcher');

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

  _.defaults(options, {localOnly: true, applyPatcher: true, defaultInherit: false});

  let paths = improverPaths;
  if (options.improverPaths) {
    // Additional paths
    paths = Array.isArray(options.improverPaths) ? [...options.improverPaths, ...paths] : [options.improverPaths, ...paths];
  }

  debug('\nLoading improver at %o', paths);
  // Create the class.
  const extended = improver(generator, {path: paths, version: jhipsterVersion});

  debug('Options %o', options);
  // Additional features, maybe we should move some of them to files.
  const GeneratorExtender = class GeneratorExtender extends extended {
    constructor(args, options_) {
      super(args, options_);

      this.constants = constants;

      // Store jhipster info and prototypes to inherit from.
      this.jhipsterInfo = this.jhipsterInfo || {
        version: jhipsterVersion,
        packagePath
      };

      debug('Done info');

      // Default implementation for patcher.
      if (options.applyPatcher) {
        const patcher = new Patcher(this);

        const applyPatcher = function () {
          if (options.localOnly) {
            this.constants = constants;
            Object.assign(this, this.options.configOptions);
            Object.assign(this, this.config.getAll());

            patcher.patch([
              {rootPath: path.resolve(`customizer/${generatorName}`)},
              {pattern: path.resolve(`customizer/*/${generatorName}/**/*.js`), rootPath: path.resolve('customizer')}
            ]);
          } else if (options.patcherPath && (options_.fromCustomizer || options_.ignoreLocal)) {
            patcher.patch(options.patcherPath);
          } else if (options.patcherPath && !options_.fromCustomizer) {
            Object.assign(this, constants);
            Object.assign(this, this.options.configOptions);
            Object.assign(this, this.config.getAll());

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
  };

  return GeneratorExtender;
};

module.exports = {createJHipsterGenerator};
