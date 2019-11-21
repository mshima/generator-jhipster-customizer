const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const fetchRepoDir = require('fetch-repo-dir');
const dircompare = require('dir-compare');
const debug = require('debug')('customizer:download');

const generatorNames = [
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
];

function extend(Superclass) {
    return class GeneratorExtender extends Superclass {
        constructor(args, opts) {
            super(args, opts);

            this.customizerConfig = this.customizerConfig || this._getStorage('generator-jhipster-customizer');
            if (!opts.configOptions.doneDownloadCustomizer && (this.options.customizers || this.customizerConfig.get('customizers'))) {
                let customizers = this.customizerConfig.get('customizers') || [];
                customizers = customizers.concat(this.options.customizers.split(','));
                customizers = this._.uniq(customizers);
                this.log.info(`${customizers}`);
                fse.ensureDirSync(path.resolve('customizer'));
                customizers.forEach(customizer => {
                    if (generatorNames.includes(customizer)) {
                        this.error(`Customizer ${customizer} conflicts with generator name`);
                    }
                    this.log.info(`Loading customizer ${customizer}`);
                    const targetDir = `customizer/${customizer}`;
                    if (!this.options.forceDownloadCustomizers && fs.existsSync(path.resolve(targetDir))) {
                        debug(`Customizer ${customizer} found at ${targetDir}`);
                        return;
                    }
                    this.queueMethod(this._downloadCustomizers.bind(this, customizer, targetDir), 'downloadCustomizers', 'initializing');
                });
                this.customizerConfig.set('customizers', customizers);
                opts.configOptions.doneDownloadCustomizer = true;
            }
        }

        async _downloadCustomizers(dir, targetDir) {
            const self = this;
            try {
                let same = true;
                const src = dir.includes(':') ? dir : `mshima/customizer-repository/${dir}`;
                await fetchRepoDir(
                    { src, dir: targetDir },
                    {
                        replace: true,
                        onCopyStart(src, dest) {
                            const res = dircompare.compareSync(src, dest, { compareContent: true });
                            same = res.same;
                            if (!same) {
                                self.log.info(`Customizer ${dir} downloaded, you may need to reinitialize the generatorion process.`);
                                fse.mkdirpSync('backup-customizer');
                                // Move old file to tmp dir.
                                fs.renameSync(dest, `${src}-old`);
                                fse.mkdirpSync(dest);

                                self.queueMethod(
                                    function() {
                                        this.error('One or more customizer has been updated, please run again');
                                    },
                                    'finishedDownload',
                                    'initializing'
                                );
                            } else {
                                self.log.info(`Customizer ${dir} downloaded, didn't changed`);
                            }
                        }
                    }
                );
            } catch (error) {
                this.error(`Error downloading ${dir}, ${error}`);
            }
        }
    };
}

module.exports = {
    extend
};
