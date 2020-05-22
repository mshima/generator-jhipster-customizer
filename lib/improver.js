/* eslint-disable unicorn/no-fn-reference-in-iterator */
const semver = require('semver');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const debug = require('debug')('customizer:improver');
const requireDirAll = require('require-dir-all');

const DEFAULT_PATH = path.resolve('improver');

function getCallback(version, [moduleName, module]) {
  debug(`Adding ${moduleName} override`);
  let callback;
  if (_.isFunction(module)) {
    callback = module;
  } else {
    if (module.version && version) {
      if (!semver.satisfies(version, module.version)) {
        debug(`Override ${moduleName} ignored, version ${version} not compatible with ${module.version}`);
        return undefined;
      }
    }

    callback = module.extend;
  }

  return callback;
}

function parseModules(version, modules) {
  return Object.entries(modules)
    .map(getCallback.bind(undefined, version))
    .filter(cb => cb !== undefined);
}

module.exports = function (Superclass, options = {path: DEFAULT_PATH}) {
  if (!options) {
    options = {path: [path.resolve('improver/')]};
  } else if (_.isString(options)) {
    const path = options;
    options = {path: [path]};
  } else if (!options.path) {
    options.path = [path.resolve('improver/')];
  } else if (_.isString(options.path)) {
    options = {path: [options.path]};
  }

  const paths = _.uniq(options.path).filter(path => fs.existsSync(path));
  if (paths.length === 0) {
    return Superclass;
  }

  const modules = requireDirAll(paths, options.requireAllOptions);
  let cbs;
  if (Array.isArray(modules)) {
    if (!modules.flatMap) {
      // Node < 11
      modules.flatMap = cb => {
        return modules.map(cb).reduce((a, b) => a.concat(b), []);
      };
    }

    cbs = modules.flatMap(parseModules.bind(undefined, options.version));
  } else {
    cbs = parseModules(options.version, modules);
  }

  cbs.forEach(cb => {
    Superclass = cb(Superclass);
  });
  return Superclass;
};
