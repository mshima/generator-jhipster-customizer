const file = context =>
  `${context.constants.SERVER_MAIN_SRC_DIR}${context.storage.packageFolder}/domain/${context.entity.entityClass}.java`;

const tmpls = [
  {
    condition: context => {
      if (context.storage.prodDatabaseType === 'mysql' || context.storage.prodDatabaseType === 'mariadb') {
        return false;
      }

      return !context.generator.relationships.filter(relationship => relationship.useJPADerivedIdentifier).length > 0;
    },
    type: 'replaceContent',
    target: /"sequenceGenerator"/g,
    tmpl: context => `"${context.entity.entityInstance}SequenceGenerator"`
  }
];

module.exports = {
  file,
  tmpls
};
