const file = context =>
  `${context.constants.SERVER_MAIN_RES_DIR}config/liquibase/changelog/${context.entity.changelogDate}_added_entity_${context.entity.entityClass}.xml`;

const tmpls = [
  {
    condition: context => {
      if (context.storage.prodDatabaseType === 'mysql' || context.storage.prodDatabaseType === 'mariadb') {
        return false;
      }

      return !context.generator.relationships.filter(relationship => relationship.useJPADerivedIdentifier).length > 0;
    },
    type: 'rewriteFile',
    target: 'jhipster-needle-liquibase-add-changeset',
    tmpl: context => `<changeSet id="${context.entity.changelogDate}-1-sequence" author="jhipster">
        <createSequence sequenceName="${context.generator._.snakeCase(
          context.entity.entityClass
        )}_sequence_generator" startValue="1050" incrementBy="\${incrementBy}"/>
    </changeSet>
`
  }
];

module.exports = {
  file,
  tmpls
};
