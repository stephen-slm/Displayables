const httpCodes = require('../constants/httpCodes');
const ApiError = require('../errors/apiError');

const UserRepository = require('../repository/user.repository');
const WorkstationRepository = require('../repository/workstation.repository');
const LanguageService = require('../services/Language.service');

module.exports = class UserController {
  /**
   * Creates a new user in the UserRepository.
   * @param {string} req.body.username The username of the user being created.
   * @param {string} req.body.password The password of the user being created.
   */
  static async createNewUser(req, res, next) {
    try {
      const { username, password } = req.body;

      const id = await UserRepository.createUser(username, username, password);
      await WorkstationRepository.createDefaultWorkstationForUser(id);

      return res.send({ username });
    } catch (error) {
      const message = LanguageService.get(req, 'user.failed_user_creation').replace('<n>', req.body.username);
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Creation', message));
    }
  }

  /**
   * Validates that the username is allowed and does not contain invalid usernames.}
   */
  static async validateUsernameRestrictions(req, res, next) {
    try {
      const { username } = req.body;

      const invalidNames = ['admin', 'administrator', 'example'];
      let invalidUsername = false;

      invalidNames.forEach((name) => {
        if (username.toLowerCase().includes(name)) invalidUsername = true;
      });

      if (invalidUsername) {
        const description = LanguageService.get(req, 'user.invalid_username_admin');
        return res.status(httpCodes.BAD_REQUEST).json({
          error: 'username',
          description
        });
      }

      return next();
    } catch (error) {
      const message = LanguageService.get(req, 'user.failed_validation').replace('<n>', req.body.username);
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Username', message));
    }
  }

  /**
   * Sends the basic user information to the client.
   */
  static async sendBasicUserInfo(req, res, next) {
    try {
      return res.json({
        id: req.body.decoded.id,
        name: req.body.decoded.name,
        username: req.body.decoded.username,
        provider: req.body.decoded.provider
      });
    } catch (error) {
      const message = LanguageService.get(req, 'error.something_wrong');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'info', message));
    }
  }
};
