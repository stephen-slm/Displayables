const Connection = require('../services/Connection.service');

module.exports = class BaseRepository {
  /**
   * Checks to see if a item exists in the database.
   * @param {string} table The table to check for the item.
   * @param {string} index the value being gathered.
   * @param {string} column The columns to use to check the value
   * @param {string} value The value to check if it exists.
   */
  static async itemExists(table, index, column, value) {
    return Connection(table)
      .select(`${index} AS exists`)
      .where(column, value)
      .first();
  }
};
