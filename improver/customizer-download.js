const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const fetchRepoDir = require('fetch-repo-dir');
const dircompare = require('dir-compare');
const debug = require('debug')('customizer:download');

const generatorNames = new Set([
  'client',
  'common',
  'entity',
  'entity-client',
  'entity-i18n',
  'entity-server',
  'languages',
  'server',
  'spring-controller',
  'spring-service'
]);

const verifyName = function (generator, name) {
  if (generatorNames.has(name)) {
    generator.error(`Customizer ${name} conflicts with generator name`);
  }
};

const verifyDest = function (generator, feature, src, dest) {
  verifyName(generator, feature);
  const destExists = fs.existsSync(dest);
  const same = destExists && dircompare.compareSync(src, dest, {compareContent: true}).same;

  if (same) {
    generator.log.info(`Customizer ${feature} downloaded, didn't changed`);
  } else {
    generator.log.info(`Customizer ${feature} downloaded, you may need to reinitialize the generatorion process.`);
    // Move old file to tmp dir.
    if (destExists) {
      fs.renameSync(dest, `${src}-old`);
    }

    fse.mkdirpSync(dest);

    generator.queueMethod(
      function () {
        this.error('One or more customizer has been updated, please run again');
      },
      'finishedDownload',
      'initializing'
    );
  }

  return same;
};

function extend(Superclass) {
  return class GeneratorExtender extends Superclass {
    constructor(args, options) {
      super(args, options);

      debug('Starting customizer download');
      const customizerConfig = this._getStorage('generator-jhipster-customizer');
      if (!options.configOptions.doneDownloadCustomizer && (this.options.customizers || customizerConfig.get('customizers'))) {
        debug('Starting customizer download %o', this.options.customizers);
        let customizers = customizerConfig.get('customizers') || [];
        debug('Starting customizer download %o', customizers);
        if (this.options.customizers) {
          const split = this.options.customizers.split('::');
          split.forEach(name => {
            const split2 = name.split(',');
            const url = this._.first(split2);
            if (url.includes(':')) {
              split2.shift();
              const found = customizers.find(c1 => c1.url === url);
              if (found) {
                found.customizers = this._.uniq(found.customizers.concat(split2));
              } else {
                customizers.push({url, customizers: split2});
              }
            } else {
              customizers = customizers.concat(split2);
            }
          });
        }

        customizers = this._.uniq(customizers);
        this.log.info(`${customizers}`);
        fse.ensureDirSync(path.resolve('customizer'));

        customizerConfig.set('customizers', customizers);

        const baseCustomizers = customizers.filter(c1 => typeof c1 !== 'object');
        const eachCustomizer = customizers.filter(c1 => typeof c1 === 'object');
        eachCustomizer.unshift({customizers: baseCustomizers});

        debug('%o', eachCustomizer);
        eachCustomizer.forEach(customizer => {
          this.log.info('Loading customizer %o', customizer);
          const missing = customizer.customizers.filter(feature => {
            const targetDir = `customizer/${feature}`;
            if (!this.options.forceDownloadCustomizers && fs.existsSync(path.resolve(targetDir))) {
              debug(`Customizer ${feature} found at ${targetDir}`);
              return false;
            }

            return true;
          });
          if (!missing || missing.length === 0) {
            return;
          }

          debug('Loading missing customizer %o', missing);
          this.queueMethod(this._downloadCustomizers.bind(this, customizer, missing), 'downloadCustomizers', 'initializing');
        });
        options.configOptions.doneDownloadCustomizer = true;
      }

      debug('Done customizer download');
    }

    async _downloadCustomizers(customizer, customizers) {
      const self = this;
      const first = customizers.shift();
      const src = customizer.url ? `${customizer.url}/${first}` : `mshima/customizer-repository/${first}`;
      try {
        let same = true;
        await fetchRepoDir(
          {src, dir: `customizer/${first}`},
          {
            replace: true,
            onCopyStart(src, dest) {
              same = same && verifyDest(self, first, src, dest);

              const srcDirname = path.dirname(src);
              const destDirname = path.dirname(dest);
              customizers.forEach(feature => {
                const isSame = verifyDest(self, feature, `${srcDirname}/${feature}`, `${destDirname}/${feature}`);
                fse.copySync(`${srcDirname}/${feature}`, `${destDirname}/${feature}`);
                same = same && isSame;
              });
            }
          }
        );
      } catch (error) {
        this.error(`Error downloading ${src}, ${error}`);
      }
    }
  };
}

module.exports = {
  extend
};
