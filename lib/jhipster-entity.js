const _ = require('lodash');
const pluralize = require('pluralize');
const Field = require('./jhipster-field');

module.exports = class Entity {
  /**
   * Entity definitions wrapper for calculating extra info.
   *
   * @param {Object} definitions - Field definition.
   * @param {Object} baseGenerator - JHipster base generator instance.
   */
  constructor(definitions, baseGenerator, config) {
    this.baseGenerator = baseGenerator;
    this.definitions = definitions;
    this.config = config;
  }

  get name() {
    return this.definitions.name;
  }

  get entityNameCapitalized() {
    return _.upperFirst(this.name);
  }

  get entityClass() {
    return this.entityNameCapitalized;
  }

  get entityInstance() {
    return _.lowerFirst(this.name);
  }

  get entityInstancePlural() {
    return pluralize(this.entityInstance);
  }

  get entityTableName() {
    return this.definitions.entityTableName || this.baseGenerator.getTableName(this.name);
  }

  get changelogDate() {
    return this.definitions.changelogDate;
  }

  get javadoc() {
    return this.definitions.javadoc;
  }

  get remarks() {
    return this.baseGenerator.formatAsLiquibaseRemarks(this.javadoc, true);
  }

  get fieldsContainOwnerManyToMany() {
    return this.definitions.relationships.find(rel => rel.relationshipType === 'many-to-many' && rel.ownerSide);
  }

  get fieldsContainOwnerOneToOne() {
    return this.definitions.relationships.find(rel => rel.relationshipType === 'one-to-one' && rel.ownerSide);
  }

  get fieldsContainNoOwnerOneToOne() {
    return this.definitions.relationships.find(rel => rel.relationshipType === 'one-to-one' && !rel.ownerSide);
  }

  get fieldsContainManyToMany() {
    return this.definitions.relationships.find(rel => rel.relationshipType === 'many-to-many');
  }

  get fieldsContainOneToMany() {
    return this.definitions.relationships.find(rel => rel.relationshipType === 'one-to-many');
  }

  get fieldsContainManyToOne() {
    return this.definitions.relationships.find(rel => rel.relationshipType === 'many-to-one');
  }

  get relationships() {
    const Relationship = require('./jhipster-relationship');
    return this.definitions.relationships.map(rel => new Relationship(rel, this.baseGenerator, this.config));
  }

  get fields() {
    return this.definitions.fields.map(field => new Field(field, this.baseGenerator, this.config));
  }
};
