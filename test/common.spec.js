const path = require('path');
const assert = require('yeoman-assert');
const helpers = require('yeoman-test');

const generatorsPath = require('../lib/environment').generatorsPath;

describe('Subgenerator common of customizer JHipster blueprint', () => {
    describe('Sample test', () => {
        before(done => {
            helpers
                .run(`${generatorsPath}/common`)
                .withOptions({
                    'from-cli': true,
                    skipInstall: true,
                    blueprint: 'customizer',
                    skipChecks: true
                })
                .withGenerators([
                    [
                        require('../generators/common'), // eslint-disable-line global-require
                        'jhipster-customizer:common',
                        path.join(__dirname, '../generators/common/index.js')
                    ]
                ])
                .withPrompts({
                    baseName: 'sampleMysql',
                    packageName: 'com.mycompany.myapp',
                    applicationType: 'monolith',
                    databaseType: 'sql',
                    devDatabaseType: 'h2Disk',
                    prodDatabaseType: 'mysql',
                    cacheProvider: 'ehcache',
                    authenticationType: 'session',
                    enableTranslation: true,
                    nativeLanguage: 'en',
                    languages: ['fr', 'de'],
                    buildTool: 'maven',
                    rememberMeKey: '2bb60a80889aa6e6767e9ccd8714982681152aa5'
                })
                .on('end', done);
        });

        it('it works', () => {
            // Adds your tests here
            assert.textEqual('Write your own tests!', 'Write your own tests!');
        });
    });
});
