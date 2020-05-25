/**
 * Handler for configOptions
 */
function configOptionsHandler() {
  return {
    /**
     * Getter.
     * Gets the option from storage and fallback to temporary option.
     */
    get(storage, property) {
      return storage.get(property);
    },

    /**
     * Setter.
     * If the option exists on the storage, then update it.
     * Otherwise set the temporary value.
     */
    set(storage, property, value) {
      storage.set(property, value);
      return true;
    },

    ownKeys(storage) {
      return Reflect.ownKeys(storage._store);
    },

    has(target, prop) {
      return target.get(prop) !== undefined;
    },

    getOwnPropertyDescriptor(target, key) {
      return {
        get: () => this.get(target, key),
        enumerable: true,
        configurable: true
      };
    }
  };
}

/**
 * Creates a configOptions instance.
 * Workarounds a synchronization problem between configOptions and storage.
 * @param {Storage} storage - Storage that stores the config.
 * @return {Object} proxy that synchonizes configOptions and storage.
 */
function createConfigOptions(storage) {
  return new Proxy(storage, configOptionsHandler());
}

module.exports = {
  createConfigOptions
};
