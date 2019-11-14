const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const repo = require('github-download-parts');

function extend(Superclass) {
    return class GeneratorExtender extends Superclass {
        constructor(args, opts) {
            super(args, opts);

            if (this.options.customizers && !opts.configOptions.doneDownloadCustomizer) {
                let customizers = this.options.customizers.split(',');
                customizers = this._.uniq(customizers);
                customizers.forEach(customizer => {
                    this.log.info(`Loading customizer ${customizer}`);
                    const targetDir = `customizer/${customizer}`;
                    if (fs.existsSync(path.resolve(targetDir))) {
                        this.log.info(`Customizer ${customizer} found at ${targetDir}`);
                        return;
                    }
                    fse.ensureDirSync(path.resolve('customizer'));
                    const done = this.async();
                    repo('mshima/customizer-repository', targetDir, customizer)
                        .then(() => {
                            this.log.info(`Customizer ${customizer} downloaded`);
                            done();
                        })
                        .catch(error => {
                            this.log.error(`Error downloading ${customizer}, ${error}`);
                            done();
                        });
                });
                opts.configOptions.doneDownloadCustomizer = true;
            }
        }
    };
}

module.exports = {
    extend
};