const file = context => `${context.constants.SERVER_MAIN_SRC_DIR}${context.storage.packageFolder}/domain/User.java`;

const tmpls = [
  {
    type: 'replaceContent',
    target: /@Id(\n\s*)@GeneratedValue\(strategy = GenerationType.SEQUENCE, generator = "sequenceGenerator"\)\n\s*@SequenceGenerator\(name = "sequenceGenerator"\)/,
    tmpl: '@Id$1GenerationType.IDENTITY'
  }
];

module.exports = {
  file,
  tmpls
};
