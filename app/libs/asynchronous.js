/**
 * A fully functional async foreach that will wait for each completed promise.
 * @param {array} array The array of async awaitable methods.
 * @param {function} callback The callback of the awaitable functions.
 */
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    await callback(array[index], index, array);
  }
}

module.exports = {
  asyncForEach
};
