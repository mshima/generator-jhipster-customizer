const file = context => `${context.constants.SERVER_MAIN_SRC_DIR}${context.storage.packageFolder}/domain/User.java`;

const tmpls = [
  {
    type: 'replaceContent',
    target: /"sequenceGenerator"/g,
    tmpl: '"userSequenceGenerator"'
  }
];

module.exports = {
  file,
  tmpls
};
