const path = require('path');
const fse = require('fs-extra');
const assert = require('yeoman-assert');
const helpers = require('yeoman-test');

const generatorsPath = require('../lib/jhipster-environment').generatorsPath;

describe('Subgenerator entity-client of customizer JHipster blueprint', () => {
    describe('Sample test', () => {
        before(done => {
            helpers
                .run(`${generatorsPath}/entity`)
                .inTmpDir(dir => {
                    fse.copySync(path.join(__dirname, '../test/templates/ngx-blueprint'), dir);
                })
                .withOptions({
                    'from-cli': true,
                    skipInstall: true,
                    blueprint: 'customizer',
                    skipChecks: true
                })
                .withGenerators([
                    [
                        require('../generators/entity-client'), // eslint-disable-line global-require
                        'jhipster-customizer:entity-client',
                        path.join(__dirname, '../generators/entity-client/index.js')
                    ]
                ])
                .withArguments(['foo'])
                .withPrompts({
                    fieldAdd: false,
                    relationshipAdd: false,
                    dto: 'no',
                    service: 'no',
                    pagination: 'infinite-scroll'
                })
                .on('end', done);
        });

        it('it works', () => {
            // Adds your tests here
            assert.textEqual('Write your own tests!', 'Write your own tests!');
        });
    });
});
