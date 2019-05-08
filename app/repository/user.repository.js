const security = require('../libs/security');
const Connection = require('../services/Connection.service');

const ProviderRepository = require('../repository/provider.repository');
const BaseRepository = require('./Base.repository');

module.exports = class UserRepository extends BaseRepository {
  /**
   * Checks to see if a user exists by a username.
   * @param {string} username The username to check exists
   */
  static async userExistsByUsername(username) {
    const result = await UserRepository.itemExists('user', 'user_id', 'user_username', username);
    if (result) return result.exists;
    return false;
  }

  /**
   * Checks to see a user exists by a id.
   * @param {number} id The id of the user to check.
   */
  static async userExistsById(id) {
    const result = await UserRepository.itemExists('user', 'user_id', 'user_id', id);
    if (result) return result.exists;
    throw new Error(`User does not exist by id ${id}`);
  }

  /**
   * Gets the required information for the user to authenticate.
   * @param {any} id The id of the user who wants to authenticate.
   */
  static async getUserLoginDetailsById(id) {
    return Connection('user')
      .select(
        'user_id as id',
        'user_username as username',
        'user_name as name',
        'user_salt as salt',
        'user_password as password',
        'provider.provider_name as provider'
      )
      .where({ user_id: id })
      .join('provider', 'provider.provider_id', 'user_provider_id')
      .first();
  }

  /**
   * Inserts a new user into the database.
   * @param {string} username The username of the user.
   * @param {string} name The name of the user.
   * @param {string} password The password of the user (this will be secured).
   */
  static async createUser(username, name, password) {
    const securedDetails = security.saltAndHash(password);

    const user = await Connection('user').insert({
      user_username: username,
      user_name: name,
      user_password: securedDetails.password,
      user_provider_id: await ProviderRepository.getProviderIdByName('local'),
      user_salt: securedDetails.salt,
      created_datetime: new Date(),
      modified_datetime: new Date()
    });

    return user[0];
  }

  /**
   * Creates a reference user that is used outside of the local service. e.g google.
   * @param {string} username The username of the user.
   * @param {string} name The name of the user.
   */
  static async createReferenceUser(username, name, providerName) {
    const user = await Connection('user').insert({
      user_username: username,
      user_name: name,
      user_password: '',
      user_salt: '',
      user_provider_id: await ProviderRepository.getProviderIdByName(providerName),
      created_datetime: new Date(),
      modified_datetime: new Date()
    });

    return user[0];
  }

  /**
   * Updates the provided users password in the database.
   * @param {any} id The id of the user being updated.
   * @param {string} password The new password being secured and saved.
   */
  static async updateUserPassword(id, password) {
    const securedDetails = security.saltAndHash(password);

    return Connection('user')
      .update({
        user_password: securedDetails.password,
        user_salt: securedDetails.salt,
        modified_datetime: new Date()
      })
      .where({ user_id: id });
  }
};
