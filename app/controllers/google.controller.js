const _ = require('lodash');

const { PROVIDERS } = require('../constants/user');
const httpCodes = require('../constants/httpCodes');
const ApiError = require('../errors/apiError');

const UserRepository = require('../repository/user.repository');
const WorkstationRepository = require('../repository/workstation.repository');
const LanguageService = require('../services/Language.service');

module.exports = class GoogleController {
  static async refreshAuthenticationToken(req, res, next) {
    // if the req.user has not been set then the token was not authenticated with google. Let the
    // user know that the token was invalid and that the request is unauthorized.
    if (_.isNil(req.user)) {
      const description = LanguageService.get(req, 'error.invalid_token');
      return res.status(httpCodes.UNAUTHORIZED).json({ error: 'Token', description });
    }

    // nothing we can do to refresh the token as this is handled in the underlining google
    // middleware.
    return next();
  }

  /**
   * The google authentication middleware will take a token if it exists and attempt to validate it
   * with google. If the authentication goes through then the req.user will be set by the middleware
   * with the extracted objects. This will check that this user properly exists before continuing.
   */
  static async checkAuthenticationToken(req, res, next) {
    try {
      // if the req.user has not been set then the token was not authenticated with google. Let the
      // user know that the token was invalid and that the request is unauthorized.
      if (_.isNil(req.user)) {
        const description = LanguageService.get(req, 'error.invalid_token');
        return res.status(httpCodes.UNAUTHORIZED).json({ error: 'Token', description });
      }

      // get the local id for the authenticating google user.
      let userId = await UserRepository.userExistsByUsername(req.user.id);

      // If the user account has not been created yet then the user Id will not exist, we can
      // processed with attempting to create the account since they are authenticating the system
      // via google (no real way of signing up directly).
      if (_.isNil(userId) || !userId) {
        const { id, displayName } = req.user;
        userId = await UserRepository.createReferenceUser(id, displayName, PROVIDERS.GOOGLE);
        await WorkstationRepository.createDefaultWorkstationForUser(userId);
      }

      const localContent = await UserRepository.getUserLoginDetailsById(userId);

      req.body.decoded = Object.assign({}, req.user, {
        id: localContent.id,
        provider: localContent.provider,
        username: req.user.id,
        name: req.user.displayName
      });

      return next();
    } catch (error) {
      const message = LanguageService.get(req, 'error.failed_user_authenticate');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Token', message));
    }
  }

  /**
   * Completing the last stage of authenticating with google by building up the response headers,
   * gathering all the related information for a selected user and sends it back to the user.
   */
  static async finalizeGoogleAuthentication(req, res, next) {
    try {
      const { id: googleUserId } = req.user;
      const localId = await UserRepository.userExistsByUsername(googleUserId);

      // regather all the information from the database, ensuring we are using the correct information
      // when creating the response to the user.
      const { username, id, provider, name } = await UserRepository.getUserLoginDetailsById(localId);

      // set the token back as the header so the client can do refreshes.
      let token = req.header('Authorization').substring('bearer '.length);

      // append the bearer tag if required.
      if (!token.startsWith('bearer')) token = `bearer ${token}`;
      res.set('Authorization', token);

      // create the response message, using the name as the username instead.
      const message = LanguageService.get(req, 'user.authenticated').replace('<n>', name);
      return res.json({ message, username, id, provider, name });
    } catch (error) {
      const { displayName } = req.user;
      const message = LanguageService.get(req, 'user.failed_user_creation').replace('<n>', displayName);
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Creation', message));
    }
  }
};
