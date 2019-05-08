const _ = require('lodash');

const LanguageService = require('../services/Language.service');
const httpCodes = require('../constants/httpCodes');
const userConstants = require('../constants/user');
const ApiError = require('../errors/apiError');

module.exports = class PasswordController {
  /**
   * Validates that the requested old and new password for updating meets the requirements.
   * @param {string} body.password The new users password.
   * @param {string} body.oldPassword The current password of the user.
   */
  static validatePasswordUpdateDetails(req, res, next) {
    try {
      const { password, oldPassword } = req.body;

      if (_.isNil(password) || _.isNil(oldPassword)) {
        return res
          .status(httpCodes.BAD_REQUEST)
          .json({ error: 'Password', description: userConstants.USER_UPDATE_PASSWORD_REQUIRED });
      }

      if (
        password.length < userConstants.PASSWORD_MIN_LENGTH ||
        password.length > userConstants.PASSWORD_MAX_LENGTH ||
        oldPassword.length < userConstants.PASSWORD_MIN_LENGTH ||
        password.length > userConstants.PASSWORD_MAX_LENGTH
      ) {
        const description = LanguageService.get(req, 'user.invalid_password_length_all');
        return res.status(httpCodes.BAD_REQUEST).json({ error: 'Invalid Credentials', description });
      }

      return next();
    } catch (error) {
      const message = LanguageService.get(req, 'user.failed_password_update');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'password', message));
    }
  }
};
