const _ = require('lodash');

const httpCodes = require('../constants/httpCodes');
const ApiError = require('../errors/apiError');
const { PROVIDERS } = require('../constants/user');

const UserRepository = require('../repository/user.repository');
const LanguageService = require('../services/Language.service');

module.exports = class DatabaseController {
  /**
   * Checks with the database to see if the username already exists and calls next.
   * @param {string} body.username The username of the user being validated they not exist.
   */
  static async validateUsernameDoesExist(req, res, next) {
    try {
      const { username } = req.body;
      const { provider } = req.query;
      // this is authenticating for the local provider only, if its not local then its probably
      // external and we don't care about checking non-existing credentials.
      if (!_.isNil(provider) && provider !== PROVIDERS.LOCAL) return next();

      if (_.isNil(username)) {
        const description = LanguageService.get(req, 'user.username_required');
        return res.status(httpCodes.BAD_REQUEST).json({ error: 'Username', description });
      }

      // determine if the user actually exists.
      const exists = await UserRepository.userExistsByUsername(username);

      if (!exists) {
        const description = LanguageService.get(req, 'user.username_does_not_exist');

        return res.status(httpCodes.BAD_REQUEST).json({
          description: description.replace('<n>', username),
          error: 'Username'
        });
      }

      req.body.id = exists;
      return next();
    } catch (error) {
      const message = LanguageService.get(req, 'something_wrong');
      return next(new ApiError(req, res, error, 500, 'username', message));
    }
  }

  /**
   * Checks with the database to see if the username does not exists and calls next.
   * @param {string} body.username The username of the user being validated they do not exist.
   */
  static async validateUsernameDoesNotExist(req, res, next) {
    try {
      const { username } = req.body;

      if (_.isNil(username)) {
        return res
          .status(httpCodes.BAD_REQUEST)
          .json({ error: 'Username', description: LanguageService.get(req, 'user.username_required') });
      }

      const exists = await UserRepository.userExistsByUsername(username);

      if (exists) {
        const description = LanguageService.get(req, 'user.username_already_exists');
        return res.status(httpCodes.BAD_REQUEST).json({
          description: description.replace('<n>', username),
          error: 'Username'
        });
      }

      return next();
    } catch (error) {
      const message = LanguageService.get(req, 'error.something_wrong');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'username', message));
    }
  }

  /**
   * Updates the users password by id with the req.body password and id.
   * @param {string} body.username The username of the user who's password is getting updated.
   * @param {string} body.password The new password of the user.
   * @param {number} body.id The id set on the body from validating the username exists.
   */
  static async updateUserPassword(req, res, next) {
    try {
      const { password, id } = req.body;
      await UserRepository.updateUserPassword(id, password);
      return res.json({});
    } catch (error) {
      const message = LanguageService.get(req, 'user.failed_password_update');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'password', message));
    }
  }
};
