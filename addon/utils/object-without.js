const { keys } = Object;

/**
 * Merges all sources together, excluding keys in excludedKeys.
 *
 * @param  {Array[String]}    excludedKeys
 * @param  {...Object}        sources
 *
 * @return {Object}
 */
export default function objectWithout(excludedKeys, ...sources) {
  return sources.reduce((acc, source) => {
    keys(source)
      .filter((key) => excludedKeys.indexOf(key) === -1 || !source.hasOwnProperty(key))
      .forEach((key) => acc[key] = source[key]);
    return acc;
  }, {});
}
