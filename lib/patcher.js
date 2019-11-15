const _ = require('lodash');
const chalk = require('chalk');
const path = require('path');
const glob = require('glob');
const semver = require('semver');
const debug = require('debug')('customizer:patcher');
const trace = require('debug')('trace:customizer:patcher');

const defaultOptions = {
    autoLoadPath: 'patcher',
    defaultLoadPath: 'partials'
};

const verify = function(generator, obj) {
    if (obj === undefined) {
        return false;
    }

    if (obj.disabled) {
        debug('Template disabled');
        return false;
    }

    if (obj.condition !== undefined && ((typeof obj.condition === 'function' && !obj.condition(generator)) || !obj.condition)) {
        debug(`Disabled by condition ${obj.condition}`);
        return false;
    }

    const jhipsterVersion = generator.jhipsterInfo.version;
    if (obj.version && !semver.satisfies(jhipsterVersion, obj.version)) {
        debug(`Patch not compatible with version ${jhipsterVersion} (${obj.version})`);
        return false;
    }
    return true;
};

module.exports = class Patcher {
    constructor(generator, options = {}) {
        if (!generator || !generator.error) {
            debug('generator parameter is not a generator');
            throw new Error('generator parameter is not a generator');
        }
        this.generator = generator;
        this.options = { ...defaultOptions, ...options };

        const ignorePatchErrors = generator.options.ignorePatchErrors || generator.options['ignore-patch-errors'];
        if (ignorePatchErrors !== undefined) this.options.ignorePatchErrors = ignorePatchErrors;
    }

    patch(options = {}) {
        this.ignorePatchErrors = [];
        if (this.generator.options['ignore-patch-errors']) {
            this.ignorePatchErrors = this.generator.options['ignore-patch-errors'].split(',');
        }

        this.disableFeatures = [];
        if (this.generator.options['disable-tenant-features']) {
            this.disableFeatures = this.generator.options['disable-tenant-features'].split(',');
        }
        debug('Disabled features:');
        debug(this.disableFeatures);

        let parsed = [];
        if (Array.isArray(options)) {
            options.forEach(opts => {
                parsed = parsed.concat(this.lookForPatches(opts));
            });
        } else {
            parsed = this.lookForPatches(options);
        }
        parsed = _.uniqBy(parsed, 'origin');
        debug('Found patches:');
        debug(parsed);

        let success = this.writeFiles(parsed);
        success = this.processPartialTemplates(parsed) && success;
        if (!success) {
            this.dumpFiles();
            this.generator.error('Error applying templates');
        }
    }

    lookForPatches(options) {
        if (typeof options === 'string') {
            options = { rootPath: options };
        }
        // _sourceRoot is templates path from yo-generator
        // Alternative is resolved that point to generator file
        if (options.rootPath) {
            this.generator.info(`Loading patches from ${options.rootPath}`);
        } else {
            options.rootPath = path.resolve(this.generator._sourceRoot, `../${this.options.autoLoadPath}`);
        }

        options.pattern = options.pattern || `${options.rootPath}/**/*.js`;
        debug('Looking for patches at: %s', options.pattern);
        return this.filter(glob.sync(options.pattern), options.rootPath);
    }

    dumpFiles() {
        this.generator.log('============= Files queued to be written ==========');
        this.generator.fs.store.each((file, index) => {
            this.generator.log(file.path);
        });
        this.generator.log('=============                            ==========');
    }

    writeFiles(parsed) {
        const generator = this.generator;
        this.load(parsed, true).forEach(fileTemplate => {
            // parse the templates and write files to the appropriate locations
            if (fileTemplate.files === undefined) {
                generator.error(`Template file should have format: { file: { feature: [ ...patches ] } } (${fileTemplate.origin})`);
            }
            this.disableFeatures.forEach(disabledFeature => {
                if (fileTemplate.files[disabledFeature] !== undefined) {
                    debug(`======== Template with feature ${disabledFeature} disabled (${fileTemplate.origin})`);
                    delete fileTemplate.files[disabledFeature];
                }
            });
            generator.writeFilesToDisk(fileTemplate.files, generator, false);
        });
        return true;
    }

    processPartialTemplates(parsed) {
        const generator = this.generator;

        let allSuccess = true;
        this.load(parsed, false).forEach(templates => {
            if (!verify(generator, templates)) {
                return;
            }
            let files = typeof templates.file === 'function' ? templates.file(generator) : templates.file;
            if (!Array.isArray(files)) {
                files = [files];
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
                        } catch (e) {
                            trace(`File ${file} not found`);
                        }
                    }

                    let success;
                    if (item.type === 'replaceContent') {
                        success = generator.replaceContent(file, target, tmpl, item.regex);
                    } else if (item.type === 'rewriteFile') {
                        success = generator.rewriteFile(file, target, tmpl);
                    }
                    let successLog = `${success}`;
                    if (!success) successLog = chalk.red(`${success}`);

                    debug(`======== Template finished type: ${item.type}, success: ${successLog}`);
                    if (success === false || item.debug) {
                        try {
                            const body = generator.fs.read(file);
                            trace(`Target: ${target}`);
                            trace(body);
                            let debugCb = generator.log.error;
                            if (debug.enabled) {
                                debugCb = debug;
                            }
                            debugCb(`Template: ${templates.filename}`);
                            debugCb(`Target: ${target}`);
                            debugCb('Match:');
                            debugCb(body.match(target));
                            debugCb('Body:');
                            debugCb(body);
                        } catch (e) {
                            generator.log.error(`File ${file} not found`);
                            debug(`File ${file} not found`);
                        }
                    }

                    const ignorePatchErrors =
                        item.ignorePatchErrors || this.options.ignorePatchErrors || this.ignorePatchErrors.includes(templates.filename);
                    if (!ignorePatchErrors && success === false) allSuccess = false;
                });
            });
        });
        return allSuccess;
    }

    filter(templates, rootPath) {
        const jhipsterVersion = this.generator.jhipsterInfo.version;
        const parsed = templates.map(file => {
            const parse = path.parse(file);
            // Rebuild file name without extension
            const template = path.format({ ...parse, ext: undefined, base: undefined });

            const relativePath = path.relative(rootPath, template);

            const parseRelative = path.parse(relativePath);
            const filename = parseRelative.base;
            let feature = '';
            if (parseRelative.dir) {
                feature = parseRelative.dir.split(path.sep, 1)[0];
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

            const ret = { origin: template, feature, filename, isFile: false };
            if (sfilename === 'files') {
                ret.isFile = true;
            }
            return ret;
        });
        return parsed.filter(p => p);
    }

    load(parsed, isFile) {
        function loadTemplate(parsed) {
            // eslint-disable-next-line global-require,import/no-dynamic-require
            const loadedTemplate = require(parsed.origin);
            Object.assign(loadedTemplate, parsed);

            debug(`======== Success loading template ${parsed.feature} ${parsed.filename}`);
            return loadedTemplate;
        }
        return parsed.filter(p => p.isFile === isFile).map(loadTemplate);
    }
};
