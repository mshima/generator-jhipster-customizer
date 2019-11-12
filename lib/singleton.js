// create a unique, global symbol name
// -----------------------------------

const FOO_KEY = Symbol.for('generator-jhipster-customizer');

// define the singleton API
// ------------------------

const singleton = {};

Object.defineProperty(singleton, 'instance', {
    get() {
        return global[FOO_KEY];
    },
    set(value) {
        // check if the global object has this symbol
        // add it if it does not have the symbol, yet
        // ------------------------------------------

        const globalSymbols = Object.getOwnPropertySymbols(global);
        const hasFoo = globalSymbols.indexOf(FOO_KEY) > -1;

        if (!hasFoo) {
            global[FOO_KEY] = value;
        }
        return global[FOO_KEY];
    }
});

// ensure the API is never changed
// -------------------------------

Object.freeze(singleton);

// export the singleton API only
// -----------------------------

module.exports = singleton;
