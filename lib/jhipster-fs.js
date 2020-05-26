const createStorageProxy = require('./utils').createStorageProxy;
const JHipsterEntity = require('./jhipster-entity');

module.exports = class JHipsterConfig {
  /**
   * @param {Object} baseGenerator - JHipster base generator instance.
   */
  constructor(baseGenerator) {
    this.baseGenerator = baseGenerator;
    this.fs = this.baseGenerator.fs;
    this.config = createStorageProxy(baseGenerator.config);
  }

  getEntityConfig(name) {
    return this.baseGenerator.createStorage(`.jhipster/${name}.json`);
  }

  getEntity(name) {
    return new JHipsterEntity(createStorageProxy(this.getEntityConfig(name)), this.baseGenerator, this.config);
  }
};
