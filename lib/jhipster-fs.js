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

  getEntity(name) {
    const storage = this.baseGenerator.createStorage(`.jhipster/${name}.json`);
    return new JHipsterEntity(createStorageProxy(storage), this.baseGenerator, this.config);
  }
}