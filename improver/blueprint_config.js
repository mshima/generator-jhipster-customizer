/*
 * =======================
 * Init patches
 * Issue: https://github.com/jhipster/generator-jhipster/issues/10663
 * PR: https://github.com/jhipster/generator-jhipster/pull/10664
 */
function extend(Superclass) {
  return class GeneratorExtender extends Superclass {
    constructor(args, options) {
      super(args, {...options, fromBlueprint: true}); // FromBlueprint variable is important

      // Patch incorporated at jhipster > 6.6.0
      if (!this.blueprintConfig) {
        this.fromBlueprint =
          options.fromBlueprint !== undefined ? options.fromBlueprint : this.rootGeneratorName() !== 'generator-jhipster';
        if (this.fromBlueprint) {
          this.blueprintConfig = this.config;
          this.config = this._getStorage('generator-jhipster');
        }
      }
    }
  };
}

module.exports = {
  version: '<=6.6.0',
  extend
};
