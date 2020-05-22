const path = require('path');
const fse = require('fs-extra');
const assert = require('yeoman-assert');
const helpers = require('yeoman-test');

const generatorsPath = require('../lib/environment').generatorsPath;

describe('Subgenerator spring-service of customizer JHipster blueprint', () => {
  describe('Sample test', () => {
    before(function () {
      this.timeout(15000);
      helpers
        .create('jhipster:spring-service')
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
            require('../generators/spring-service'), // eslint-disable-line global-require
            'jhipster-customizer:spring-service',
            path.join(__dirname, '../generators/spring-service/index.js')
          ]
        ])
        .withArguments(['foo'])
        .withPrompts({
          useInterface: false
        })
        .run();
    });

    it('it works', () => {
      // Adds your tests here
      assert.textEqual('Write your own tests!', 'Write your own tests!');
    });
  });
});
