// Create a unique, global symbol name
// -----------------------------------

const FOO_KEY = Symbol.for('generator-jhipster-customizer');

// Define the singleton API
// ------------------------

const singleton = {};

Object.defineProperty(singleton, 'instance', {
  get() {
    return global[FOO_KEY];
  },
  set(value) {
    // Check if the global object has this symbol
    // add it if it does not have the symbol, yet
    // ------------------------------------------

    const globalSymbols = Object.getOwnPropertySymbols(global);
    const hasFoo = globalSymbols.includes(FOO_KEY);

    if (!hasFoo) {
      global[FOO_KEY] = value;
    }

    return global[FOO_KEY];
  }
});

// Ensure the API is never changed
// -------------------------------

Object.freeze(singleton);

// Export the singleton API only
// -----------------------------

module.exports = singleton;
