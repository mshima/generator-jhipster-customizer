const _ = require('lodash');
const chalk = require('chalk');
const path = require('path');
const glob = require('glob');
const semver = require('semver');
const debug = require('debug')('customizer:patcher');
const trace = require('debug')('trace:customizer:patcher');

const NeedleFile = require('./needle-file');

const defaultOptions = {
  autoLoadPath: 'patcher',
  defaultLoadPath: 'partials'
};

/**
 * Verify patch if:
 * - not undefined
 * - not disabled
 * - dir is not disabled
 * - condition applies
 * - version compatibility
 */
const verify = function (generator, object) {
  if (object === undefined) {
    return false;
  }

  if (object.disabled) {
    debug('Template disabled');
    return false;
  }

  if (object.dir !== undefined) {
    const notVerified = object.dir.find(dir => {
      return !verify(generator, dir);
    });
    if (notVerified) {
      debug(`Disabled by dir condition ${notVerified.dirname}`);
      return false;
    }
  }

  if (object.condition !== undefined && ((typeof object.condition === 'function' && !object.condition(generator)) || !object.condition)) {
    debug(`Disabled by condition ${object.condition}`);
    return false;
  }

  const jhipsterVersion = generator.jhipsterInfo.version;
  if (object.version && !semver.satisfies(jhipsterVersion, object.version)) {
    debug(`Patch not compatible with version ${jhipsterVersion} (${object.version})`);
    return false;
  }

  return true;
};

/**
 * Load (require) template and add parsed options to it
 */
function loadTemplate(parsed) {
  // eslint-disable-next-line global-require,import/no-dynamic-require
  const loadedTemplate = require(parsed.origin);
  Object.assign(loadedTemplate, parsed);

  debug(`======== Success loading template ${parsed.feature} ${parsed.filename}`);
  return loadedTemplate;
}

module.exports = class Patcher {
  constructor(generator, options = {}) {
    if (!generator || !generator.error) {
      debug('generator parameter is not a generator');
      throw new Error('generator parameter is not a generator');
    }

    this.generator = generator;
    this.options = {...defaultOptions, ...options};

    if (typeof generator.options.ignorePatchErrors === 'boolean') {
      this.options.ignorePatchErrors = generator.options.ignorePatchErrors;
    } else if (typeof generator.options['ignore-patch-errors'] === 'boolean') {
      this.options.ignorePatchErrors = generator.options['ignore-patch-errors'];
    }

    this.ignorePatchErrors = [];
    const ignorePatchErrors = this.generator.options['ignore-patch-errors'];
    if (ignorePatchErrors) {
      if (typeof ignorePatchErrors !== 'boolean') {
        this.ignorePatchErrors = ignorePatchErrors.split(',');
      }
    }

    this.disableFeatures = [];
    const disableFeatures = this.generator.options['disable-tenant-features'];
    if (disableFeatures && typeof disableFeatures !== 'boolean') {
      this.disableFeatures = disableFeatures.split(',');
    }
  }

  /**
   * Apply patches
   */
  patch(options = {}) {
    debug('Disabled features:');
    debug(this.disableFeatures);

    let allParsed = [];
    if (Array.isArray(options)) {
      options.forEach(options_ => {
        allParsed = allParsed.concat(this.lookForPatches(options_));
      });
    } else {
      allParsed = this.lookForPatches(options);
    }

    allParsed = _.uniqBy(allParsed, 'origin');
    debug('Found patches:');
    debug(allParsed);

    this.applyDirs(allParsed);
    let success = this.writeFiles(allParsed);
    success = this.processPartialTemplates(allParsed) && success;
    if (!success) {
      this.dumpFiles();
      this.generator.error('Error applying templates');
    }
  }

  /**
   * Loof for patches
   */
  lookForPatches(options) {
    if (typeof options === 'string') {
      options = {rootPath: options};
    }

    // _sourceRoot is templates path from yo-generator
    // Alternative is resolved that point to generator file
    if (options.rootPath) {
      debug(`Loading patches from ${options.rootPath}`);
    } else {
      options.rootPath = path.resolve(this.generator._sourceRoot, `../${this.options.autoLoadPath}`);
    }

    options.pattern = options.pattern || `${options.rootPath}/**/*.js`;
    debug('Looking for patches at: %s', options.pattern);
    return this.filter(glob.sync(options.pattern), options.rootPath);
  }

  /**
   * Print existing files on mem-fs for debugging.
   */
  dumpFiles() {
    this.generator.log('============= Files queued to be written ==========');
    this.generator.fs.store.each(file => {
      this.generator.log(file.path);
    });
    this.generator.log('=============                            ==========');
  }

  /**
   * Set dirs to the patches and files.
   */
  applyDirs(allParsed) {
    allParsed
      .filter(p => p.type === 'dir')
      .map(loadTemplate)
      .forEach(dir => {
        allParsed.forEach(parsed => {
          if (parsed.type === 'dir') {
            return;
          }

          if (parsed.origin.startsWith(dir.dirname)) {
            parsed.dir = parsed.dir || [];
            parsed.dir.push(dir);
          }
        });
      });
    return true;
  }

  /**
   * Write files from files.*.js
   */
  writeFiles(allParsed) {
    const generator = this.generator;
    allParsed
      .filter(p => p.type === 'files')
      .map(loadTemplate)
      .forEach(fileTemplate => {
        if (!verify(generator, fileTemplate)) {
          return;
        }

        // Parse the templates and write files to the appropriate locations
        if (fileTemplate.files === undefined) {
          generator.error(`Template file should have format: { file: { feature: [ ...patches ] } } (${fileTemplate.origin})`);
        }

        this.disableFeatures.forEach(disabledFeature => {
          if (fileTemplate.files[disabledFeature] !== undefined) {
            debug(`======== Template with feature ${disabledFeature} disabled (${fileTemplate.origin})`);
            delete fileTemplate.files[disabledFeature];
          }
        });
        generator.writeFilesToDisk(fileTemplate.files, generator, false, fileTemplate.prefix);
      });
    return true;
  }

  /**
   * Process patches
   */
  processPartialTemplates(parsed) {
    const generator = this.generator;

    let allSuccess = true;
    parsed
      .filter(p => p.type === 'patch')
      .map(loadTemplate)
      .forEach(templates => {
        if (!verify(generator, templates)) {
          return;
        }

        let files = typeof templates.file === 'function' ? templates.file(generator) : templates.file;
        if (!Array.isArray(files)) {
          files = [files];
        }

        if (templates.tmpls === undefined) {
          generator.error(`Template file should have format: { tmpls: ... } (${templates.origin})`);
        }

        templates.tmpls.forEach((item, index) => {
          if (!verify(generator, item)) {
            return;
          }

          const target = typeof item.target === 'function' ? item.target(generator) : item.target;
          const tmpl = typeof item.tmpl === 'function' ? item.tmpl(generator) : item.tmpl;

          files.forEach(file => {
            debug(`======== Applying template ${templates.origin}[${index}] on ${file}`);

            if (item.debug) {
              try {
                const body = generator.fs.read(file);
                trace(`Target: ${target}`);
                trace(body);
                trace('Match:');
                trace(body.match(target));
              } catch (_) {
                trace(`File ${file} not found`);
              }
            }

            let success;
            const needleFile = new NeedleFile(file, generator.fs);
            if (item.type === 'replaceContent') {
              success = needleFile.replaceContent(target, tmpl, item.regex);
            } else if (item.type === 'rewriteFile') {
              success = needleFile.addContent(target, tmpl, item.skipTest);
            } else {
              success = false;
            }

            let successLog = `${success}`;
            if (!success) successLog = chalk.red(`${success}`);

            debug(`======== Template finished type: ${item.type}, success: ${successLog}`);
            if (success === false || item.debug) {
              try {
                const body = needleFile.read();
                trace(`Target: ${target}`);
                trace(body);
                let debugCb = message => generator.log.error(message);
                if (debug.enabled) {
                  debugCb = debug;
                }

                debugCb(`File: ${templates.filename}`);
                debugCb(`Target: ${target}`);
                debugCb('Match:');
                debugCb(body.match(target));
                debugCb('Body:');
                debugCb(body);
              } catch (_) {
                generator.log.error(`Customizer error: file ${file} not found`);
                debug(`Customizer error: file ${file} not found`);
              }
            }

            if (success === false) {
              const ignorePatchErrors =
                item.ignorePatchErrors || this.options.ignorePatchErrors || this.ignorePatchErrors.includes(templates.filename);
              if (ignorePatchErrors) {
                generator.log.error('Error ignored');
              } else {
                allSuccess = false;
              }
            }
          });
        });
      });
    return allSuccess;
  }

  /**
   * Filter files:
   * - by type: files, patch and dir
   * - disabled features (dir names)
   * - compatible version by name
   */
  filter(templates, rootPath) {
    const jhipsterVersion = this.generator.jhipsterInfo.version;
    const parsed = templates.map(file => {
      const parse = path.parse(file);
      // Rebuild file name without js extension
      const template = path.format({...parse, ext: undefined, base: undefined});

      const relativePath = path.relative(rootPath, template);

      const parseRelative = path.parse(relativePath);
      const filename = parseRelative.base;
      let feature = '';
      if (parseRelative.dir) {
        feature = _.last(parseRelative.dir.split(path.sep));
      }

      if (this.disableFeatures.includes(feature)) {
        debug(`======== Template with feature ${feature} disabled (${file})`);
        return undefined;
      }

      let sfilename = filename;
      const splitFileName = filename.split('.v', 2);
      if (splitFileName.length > 1) {
        if (!jhipsterVersion.startsWith(splitFileName[1])) {
          debug(`Template ${feature} ${filename} not compatible with jhipster ${jhipsterVersion}`);
          return undefined;
        }

        sfilename = splitFileName[0];
      }

      const returnValue = {origin: template, feature, filename, type: 'patch'};
      if (sfilename === 'files') {
        returnValue.type = 'files';
      } else if (sfilename === 'index') {
        returnValue.type = 'dir';
        returnValue.dirname = `${path.dirname(file)}${path.sep}`;
      }

      return returnValue;
    });
    return parsed.filter(p => p);
  }
};
