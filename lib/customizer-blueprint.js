const Env = require('yeoman-environment');

const jEnv = require('./jhipster-environment');

function extend(Superclass, generator) {
    return class GeneratorExtender extends Superclass {
        constructor(args, opts) {
            super(args, opts);

            if (opts.customizers) {
                opts.customizers.forEach(customizer => {
                    const lookupPath = Env.lookupGenerator(`jhipster-${customizer}:${generator}`);
                    if (lookupPath !== undefined) {
                        // eslint-disable-next-line global-require,import/no-dynamic-require
                        jEnv.parents[generator] = require(lookupPath);
                    }
                });
            }
        }
    };
}

module.exports = {
    extend
};
