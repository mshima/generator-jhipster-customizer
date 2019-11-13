const path = require('path');
const assert = require('yeoman-assert');
const helpers = require('yeoman-test');
const fse = require('fs-extra');

const generatorsPath = require('../lib/jhipster-environment').generatorsPath;

const getFilesForOptions = require('./jhipster_utils/utils').getFilesForOptions;
const expectedFiles = require('./jhipster_utils/expected-files');

// eslint-disable-next-line import/no-dynamic-require
const angularFiles = require(`${generatorsPath}/client/files-angular`).files;

describe('JHipster generator', () => {
    describe('With patch', () => {
        before(done => {
            helpers
                .run(`${generatorsPath}/app`)
                .inTmpDir(dir => {
                    const fakeBlueprintModuleDir = path.join(dir, 'customizer/common/common');
                    fse.ensureDirSync(fakeBlueprintModuleDir);
                    fse.writeFileSync(
                        path.join(fakeBlueprintModuleDir, 'package.js'),
                        `
const file = context => 'package.json';

const tmpls = [
    {
        type: 'replaceContent',
        target: /("generator-jhipster": )"[\\w.]*"/,
        tmpl: '$1"latest"'
    }
];

module.exports = {
    file,
    tmpls
};
`
                    );
                })
                .withOptions({
                    'from-cli': true,
                    skipInstall: true,
                    skipChecks: true,
                    jhiPrefix: 'test',
                    blueprints: 'patcher'
                })
                .withGenerators([
                    [
                        require('../generators/client/index.js'), // eslint-disable-line global-require
                        'jhipster-patcher:client',
                        path.join(__dirname, '../generators/client/index.js')
                    ],
                    [
                        require('../generators/common/index.js'), // eslint-disable-line global-require
                        'jhipster-patcher:common',
                        path.join(__dirname, '../generators/common/index.js')
                    ],
                    [
                        require('../generators/entity/index.js'), // eslint-disable-line global-require
                        'jhipster-patcher:entity',
                        path.join(__dirname, '../generators/entity/index.js')
                    ],
                    [
                        require('../generators/entity-client/index.js'), // eslint-disable-line global-require
                        'jhipster-patcher:entity-client',
                        path.join(__dirname, '../generators/entity-client/index.js')
                    ],
                    [
                        require('../generators/entity-i18n/index.js'), // eslint-disable-line global-require
                        'jhipster-patcher:entity-i18n',
                        path.join(__dirname, '../generators/entity-i18n/index.js')
                    ],
                    [
                        require('../generators/entity-server/index.js'), // eslint-disable-line global-require
                        'jhipster-patcher:entity-server',
                        path.join(__dirname, '../generators/entity-server/index.js')
                    ],
                    [
                        require('../generators/languages/index.js'), // eslint-disable-line global-require
                        'jhipster-patcher:languages',
                        path.join(__dirname, '../generators/languages/index.js')
                    ],
                    [
                        require('../generators/server/index.js'), // eslint-disable-line global-require
                        'jhipster-patcher:server',
                        path.join(__dirname, '../generators/server/index.js')
                    ],
                    [
                        require('../generators/spring-controller/index.js'), // eslint-disable-line global-require
                        'jhipster-patcher:spring-controller',
                        path.join(__dirname, '../generators/spring-controller/index.js')
                    ],
                    [
                        require('../generators/spring-service/index.js'), // eslint-disable-line global-require
                        'jhipster-patcher:spring-service',
                        path.join(__dirname, '../generators/spring-service/index.js')
                    ]
                ])
                .withPrompts({
                    baseName: 'jhipster',
                    clientFramework: 'angularX',
                    packageName: 'com.mycompany.myapp',
                    packageFolder: 'com/mycompany/myapp',
                    serviceDiscoveryType: false,
                    authenticationType: 'jwt',
                    cacheProvider: 'ehcache',
                    enableHibernateCache: true,
                    databaseType: 'sql',
                    devDatabaseType: 'h2Memory',
                    prodDatabaseType: 'mysql',
                    enableTranslation: true,
                    nativeLanguage: 'en',
                    languages: ['fr'],
                    buildTool: 'maven',
                    rememberMeKey: '5c37379956bd1242f5636c8cb322c2966ad81277',
                    skipClient: false,
                    skipUserManagement: false,
                    serverSideOptions: []
                })
                .on('end', done);
        });

        it('creates expected default files for angularX', () => {
            assert.file(expectedFiles.common);
            assert.file(expectedFiles.server);
            assert.file(expectedFiles.userManagementServer);
            assert.file(expectedFiles.jwtServer);
            assert.file(expectedFiles.maven);
            assert.file(expectedFiles.dockerServices);
            assert.file(expectedFiles.mysql);
            assert.file(expectedFiles.hibernateTimeZoneConfig);
            assert.file(
                getFilesForOptions(angularFiles, {
                    enableTranslation: true,
                    serviceDiscoveryType: false,
                    authenticationType: 'jwt',
                    testFrameworks: []
                })
            );
        });
        it('contains patch difference', () => {
            assert.fileContent('package.json', /"generator-jhipster": "latest"/);
        });
        it('contains clientFramework with angularX value', () => {
            assert.fileContent('.yo-rc.json', /"clientFramework": "angularX"/);
        });
        it('contains correct custom prefix when specified', () => {
            assert.fileContent('angular.json', /"prefix": "test"/);
        });
        it('generates a README with no undefined value', () => {
            assert.noFileContent('README.md', /undefined/);
        });
        it('uses correct prettier formatting', () => {
            // tabWidth = 2 (see generators/common/templates/.prettierrc.ejs)
            assert.fileContent('webpack/webpack.dev.js', / {2}devtool:/);
            assert.fileContent('tsconfig.json', / {2}"compilerOptions":/);
        });
    });
});
