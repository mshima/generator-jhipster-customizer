const path = require('path');
const assert = require('yeoman-assert');
const helpers = require('yeoman-test');
const fse = require('fs-extra');

const getFilesForOptions = require('./jhipster_utils/utils').getFilesForOptions;
const expectedFiles = require('./jhipster_utils/expected-files');

describe('JHipster generator', () => {
  describe('With patch', () => {
    let env;
    before(function () {
      this.timeout(20000);
      return helpers
        .create('jhipster:app')
        .withLookups([{npmPaths: path.join(__dirname, '..', 'node_modules')}, {packagePaths: path.join(__dirname, '..')}])
        .withEnvironment(ctxEnv => {
          env = ctxEnv;
        })
        .inTmpDir(dir => {
          const commonDir = path.join(dir, 'customizer/common/common');
          fse.ensureDirSync(commonDir);
          fse.writeFileSync(
            path.join(commonDir, 'package.json.js'),
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

          const serverDir = path.join(dir, 'customizer/user-jpa-identity');
          fse.ensureDirSync(serverDir);
          fse.copySync(path.join(__dirname, '../test/templates/user-jpa-identity'), serverDir);
        })
        .withOptions({
          'from-cli': true,
          skipInstall: true,
          skipChecks: true,
          jhiPrefix: 'test',
          blueprints: 'customizer'
        })
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
          prodDatabaseType: 'postgresql',
          enableTranslation: true,
          nativeLanguage: 'en',
          languages: ['fr'],
          buildTool: 'maven',
          rememberMeKey: '5c37379956bd1242f5636c8cb322c2966ad81277',
          skipClient: false,
          skipUserManagement: false,
          serverSideOptions: []
        })
        .run();
    });

    it('creates expected default files for angularX', () => {
      assert.file(expectedFiles.common);
      assert.file(expectedFiles.server);
      assert.file(expectedFiles.userManagementServer);
      assert.file(expectedFiles.jwtServer);
      assert.file(expectedFiles.maven);
      assert.file(expectedFiles.dockerServices);
      assert.file(expectedFiles.postgresql);
      assert.file(expectedFiles.hibernateTimeZoneConfig);

      const packagePath = env.getPackagePath('jhipster:app');
      // eslint-disable-next-line import/no-dynamic-require,global-require
      const angularFiles = require(`${packagePath}/generators/client/files-angular`).files;

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
    it('contains identity', () => {
      assert.fileContent('src/main/java/com/mycompany/myapp/domain/User.java', /GenerationType.IDENTITY/);
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
      // TabWidth = 2 (see generators/common/templates/.prettierrc.ejs)
      assert.fileContent('webpack/webpack.dev.js', / {2}devtool:/);
      assert.fileContent('tsconfig.json', / {2}"compilerOptions":/);
    });
  });
});
