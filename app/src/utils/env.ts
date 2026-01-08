/**
 * Retrieves an environment variable and safely converts it to a boolean.
 * @param {string | undefined} key The value of the environment variable.
 * @param {boolean} [force_true_if_undefined=false] If true, returns true when the key is undefined.
 * @returns {boolean} The boolean representation of the environment variable.
 */
function getEnvBoolean(key: string | undefined, force_true_if_undefined = false): boolean {
  if (key === undefined) {
    return force_true_if_undefined;
  }
  return key.toLowerCase() === 'true';
}

export {
  getEnvBoolean,
};
