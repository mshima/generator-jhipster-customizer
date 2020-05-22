const path = require('path');
const fse = require('fs-extra');
const assert = require('yeoman-assert');
const helpers = require('yeoman-test');

describe('Subgenerator entity-i18n of customizer JHipster blueprint', () => {
  describe('Sample test', () => {
    before(function () {
      this.timeout(15000);
      return helpers
        .create('jhipster:entity')
        .withLookups([{npmPaths: path.join(__dirname, '..', 'node_modules')}])
        .inTmpDir(dir => {
          fse.copySync(path.join(__dirname, '../test/templates/ngx-blueprint'), dir);
        })
        .withOptions({
          'from-cli': true,
          skipInstall: true,
          blueprints: 'customizer',
          skipChecks: true
        })
        .withGenerators([
          [
            require('../generators/entity-i18n'), // eslint-disable-line global-require
            'jhipster-customizer:entity-i18n',
            path.join(__dirname, '../generators/entity-i18n/index.js')
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
        .run();
    });

    it('it works', () => {
      // Adds your tests here
      assert.textEqual('Write your own tests!', 'Write your own tests!');
    });
  });
});
