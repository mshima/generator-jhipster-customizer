const file = context => `${context.SERVER_MAIN_SRC_DIR}${context.packageFolder}/domain/User.java`;

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
