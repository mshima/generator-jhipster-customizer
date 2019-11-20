const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const repo = require('github-download-parts');

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

            this.customizerConfig = this._getStorage('generator-jhipster-customizer');
            if (!opts.configOptions.doneDownloadCustomizer && (this.options.customizers || this.customizerConfig.get('customizers'))) {
                let customizers = this.customizerConfig.get('customizers') || [];
                customizers = customizers.concat(this.options.customizers.split(','));
                customizers = this._.uniq(customizers);
                this.log.info(`${customizers}`);
                customizers.forEach(customizer => {
                    if (generatorNames.includes(customizer)) {
                        this.error(`Customizer ${customizer} conflicts with generator name`);
                    }
                    this.log.info(`Loading customizer ${customizer}`);
                    const targetDir = `customizer/${customizer}`;
                    if (!this.options.forceDownloadCustomizers && fs.existsSync(path.resolve(targetDir))) {
                        this.log.info(`Customizer ${customizer} found at ${targetDir}`);
                        return;
                    }
                    fse.ensureDirSync(path.resolve('customizer'));
                    const done = this.async();
                    repo('mshima/customizer-repository', targetDir, customizer)
                        .then(() => {
                            this.log.info(`Customizer ${customizer} downloaded, you may need to reinitialize the generatorion process.`);
                            done();
                        })
                        .catch(error => {
                            this.log.error(`Error downloading ${customizer}, ${error}`);
                            done();
                        });
                });
                this.customizerConfig.set('customizers', customizers);
                opts.configOptions.doneDownloadCustomizer = true;
            }
        }
    };
}

module.exports = {
    extend
};
