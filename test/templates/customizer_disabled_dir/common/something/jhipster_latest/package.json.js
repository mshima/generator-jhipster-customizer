const file = () => 'package.json';

const tmpls = [
  {
    type: 'replaceContent',
    target: /("generator-jhipster": )"[\\w.]*"/,
    tmpl: '$1"latest"'
  }
];

module.exports = {
  file,
  tmpls
};
