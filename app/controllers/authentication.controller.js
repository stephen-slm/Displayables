const _ = require('lodash');

const httpCodes = require('../constants/httpCodes');
const userConstants = require('../constants/user');
const { PROVIDERS } = require('../constants/user');
const { config } = require('../../setup/config');
const ApiError = require('../errors/apiError');
const security = require('../libs/security');

const LanguageService = require('../services/Language.service');
const UserRepository = require('../repository/user.repository');

const FacebookController = require('./facebook.controller');
const GithubController = require('./github.controller');
const GoogleController = require('./google.controller');

module.exports = class AuthenticationController {
  /**
   * Validates that the details provided are a valid type, format and content. If all true then next
   * will be called otherwise a bad request would be sent to the server.
   * @argument {string} body.username The users username to be validate.
   * @argument {string} body.password  The old password of the user to validate.
   */
  static validateAuthenticationDetails(req, res, next) {
    try {
      const { username, password } = req.body;
      const provider = req.query.provider || req.headers.provider;

      // this is authenticating for the local provider only, if its not local then its probably
      // external and we don't care about checking non-existing credentials.
      if (!_.isNil(provider) && provider !== PROVIDERS.LOCAL) return next();

      // make sure the usernames are lowercase at the start.
      req.body.username = username.toLowerCase();

      if (_.isNil(username) || _.isNil(password)) {
        const description = LanguageService.get(req, 'user.login_details_required');
        return res.status(httpCodes.UNAUTHORIZED).json({ error: 'Authentication', description });
      }

      if (
        username.length < userConstants.USERNAME_MIN_LENGTH ||
        username.length > userConstants.USERNAME_MAX_LENGTH
      ) {
        const description = LanguageService.get(req, 'user.invalid_username_length_all');
        return res.status(httpCodes.UNAUTHORIZED).json({ serror: 'Authentication', description });
      }

      if (
        password.length < userConstants.PASSWORD_MIN_LENGTH ||
        password.length > userConstants.PASSWORD_MAX_LENGTH
      ) {
        const description = LanguageService.get(req, 'user.invalid_password_length_all');
        return res.status(httpCodes.UNAUTHORIZED).json({ error: 'Authentication', description });
      }

      return next();
    } catch (error) {
      const message = LanguageService.get(req, 'error.failed_user_authenticate');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Details', message));
    }
  }

  /**
   * Processing with the authentication with google, this will include the registering process if
   * the user does not exist on the platform yet. This is because registering and logging in is the
   * same thing when authenticating with google.
   */
  static async authenticateWithGoogle(req, res, next) {
    await GoogleController.checkAuthenticationToken(req, res, async (error) => {
      if (error instanceof Error) throw error;
      await GoogleController.finalizeGoogleAuthentication(req, res, next);
    });
  }

  /**
   * Processing with the authentication with facebook, this will include the registering process if
   * the user does not exist on the platform yet. This is because registering and logging in is the
   * same thing when authenticating with facebook.
   */
  static async authenticateWithFacebook(req, res, next) {
    await FacebookController.checkAuthenticationToken(req, res, async (error) => {
      if (error instanceof Error) throw error;
      await FacebookController.finalizeFacebookAuthentication(req, res, next);
    });
  }

  /**
   * Processing with the authentication with github, this will include the registering process if
   * the user does not exist on the platform yet. This is because registering and logging in is the
   * same thing when authenticating with facebook.
   */
  static async authenticateWithGithub(req, res, next) {
    await GithubController.checkAuthenticationToken(req, res, async (error) => {
      if (error instanceof Error) throw error;
      await GithubController.finalizeGithubAuthentication(req, res, next);
    });
  }

  /**
   * Attempts to authenticate the user with the local system, this will be using a username and
   * password / validating it against the users stored password and salt. Validation will create a
   * token.
   * @param {string} req.username The username of the user.
   * @param {string} req.password The password of the user.
   */
  static async authenticateWithLocal(req, res) {
    const { id, password } = req.body;

    const localContent = await UserRepository.getUserLoginDetailsById(id);
    const { username, provider, name } = localContent;

    // compare and validate that the password being authenticated with matches the one currently
    // being stored by the user. Using the stored salt and hash.
    if (!security.comparePasswords(password, localContent.salt, localContent.password)) {
      const description = LanguageService.get(req, 'user.incorrect_password');
      return res.status(httpCodes.UNAUTHORIZED).json({ error: 'Authentication', description });
    }

    // sign the token with the users details.
    const token = security.signAuthenticationToken(username, name, id, config.SECRET);
    const message = LanguageService.get(req, 'user.authenticated').replace('<n>', username);

    // set the authorization header and respond to the user.
    res.set('Authorization', `bearer ${token}`);
    return res.json({ message, username, id, provider, name });
  }

  /**
   * Authenticates the user against there current provider, by default it being local.
   * Authentication allows for the user to use the core functionality of the system without limits.
   * @param {string} req.params.provider The provider who we will be authenticating against.
   */
  static async authenticateLoggingInUser(req, res, next) {
    try {
      const provider = req.query.provider || req.headers.provider;

      switch (provider) {
        case PROVIDERS.LOCAL:
          // Authenticate against the local system using a username and password. (both are required).
          return await AuthenticationController.authenticateWithLocal(req, res, next);
        case PROVIDERS.GOOGLE:
          // Authenticate the user against google, this just means validation of the token that was
          // given to the user when they authenticated within the browser.
          return await AuthenticationController.authenticateWithGoogle(req, res, next);
        case PROVIDERS.FACEBOOK:
          // Validate the authentication token with google using there graph api. Using the
          // authentication token that was given by the user that authenticated within the browser.
          return await AuthenticationController.authenticateWithFacebook(req, res, next);
        case PROVIDERS.GITHUB:
          // Validate the authentication token with github. . Using the authentication token that
          // was given by the user that authenticated within the browser.
          return await AuthenticationController.authenticateWithGithub(req, res, next);
        default:
          // By default if the user has not provided the authentication method fall back to
          // authenticating with the local system.
          return await AuthenticationController.authenticateWithLocal(req, res, next);
      }
    } catch (error) {
      // if a error occurred during the authentication that was unknown, then let the user know that
      // a internal server error ocurred. Killing the whole request process and leaving the user
      // unauthenticated.
      const message = LanguageService.get(req, 'error.failed_user_authenticate');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Token', message));
    }
  }

  /**
   * Simple method for setting the provider to local for server related validation when the request
   * has to be marked as a local provider at point of entry. e.g when registering.
   * @param {string} req.query.provider The query parameter for the provider.
   * @param {string} req.header.provider The header value for the provider.
   */
  static markAsLocalProvider(req, res, next) {
    req.query.provider = 'local';
    req.header.provider = 'local';

    next();
  }

  /**
   * Attempt to validate the current password of the user trying to update there password.
   * @param {string} req.username The username of the user.
   * @param {string} req.password The password of the user.
   */
  static async validateUpdatingUserLoginDetails(req, res, next) {
    try {
      const { oldPassword, id } = req.body;
      const loginDetails = await UserRepository.getUserLoginDetailsById(id);

      if (!security.comparePasswords(oldPassword, loginDetails.salt, loginDetails.password)) {
        return res
          .status(httpCodes.UNAUTHORIZED)
          .json({ error: 'Password', description: LanguageService.get(req, 'user.incorrect_password') });
      }

      return next();
    } catch (error) {
      const message = LanguageService.get(req, 'error.failed_user_authenticate');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Password', message));
    }
  }

  /**
   * Checks to see if the requesting local user has a valid token to continue.
   * @param {string} req.header.token The token to be validated.
   */
  static async checkAuthenticationTokenLocal(req, res, next) {
    const token = req.header('Authorization').substring('bearer '.length);

    if (_.isNil(token) || !_.isString(token)) {
      const description = LanguageService.get(req, 'error.invalid_token');
      return res.status(httpCodes.UNAUTHORIZED).json({ error: 'Token', description });
    }

    // validate that the token is still valid within the specified time limit and the token is
    // correctly validated against the secret used to create it.
    const { error, decoded } = security.validateAuthenticationToken(token, config.SECRET);

    if (!_.isNil(error)) {
      const description = security.getPrettyTokenErrorMessage(error, req);
      return res.status(httpCodes.UNAUTHORIZED).json({ error: 'Token', description });
    }

    // mark as authorized.
    req.body.decoded = decoded;

    return next();
  }

  /**
   * Checks the authentication token for a given user with the provided provider, defaulting to the
   * local provider if no provider is given. Validating that they are authorized.
   * @param {*} req.query.provider? The provider to check authorization with.
   */
  static async checkAuthenticationToken(req, res, next) {
    try {
      const provider = req.query.provider || req.headers.provider;

      // check against the difference services (local or social) to check to see if the existing
      // authentication token is a valid token or not. This action would take place before
      // performing a change or update of any workstation.
      switch (provider) {
        case PROVIDERS.LOCAL:
          return await AuthenticationController.checkAuthenticationTokenLocal(req, res, next);
        case PROVIDERS.GOOGLE:
          return await GoogleController.checkAuthenticationToken(req, res, next);
        case PROVIDERS.FACEBOOK:
          return await FacebookController.checkAuthenticationToken(req, res, next);
        case PROVIDERS.GITHUB:
          return await GithubController.checkAuthenticationToken(req, res, next);
        default:
          return await AuthenticationController.checkAuthenticationTokenLocal(req, res, next);
      }
    } catch (error) {
      const message = LanguageService.get(req, 'error.failed_token_validation');
      return next(new ApiError(req, res, error, 401, 'Token', message));
    }
  }

  /**
   * Validates the token and sends back a new refreshed token.
   * @param {string} req.header.token The token to be validated before refreshing.
   */
  static async refreshLocalAuthentication(req, res) {
    const token = req.header('Authorization').substring('bearer '.length);

    // validate that the authentication token actually exists, if they don't exist then we need to
    // reject the attempt to get a refreshes token with a unauthorized request.
    if (_.isNil(token) || !_.isString(token)) {
      const description = LanguageService.get(req, 'error.invalid_token');
      return res.status(httpCodes.UNAUTHORIZED).json({ error: 'Token', description });
    }

    // attempt to decode the existing token that the user sent, error will be null if any only if
    // the token was decoded and validated correctly with the secret. If the token is validated then
    // the decoded object will contain all the required information to process the refresh.
    const { error, decoded } = security.validateAuthenticationToken(token, config.SECRET);

    if (!_.isNil(error)) {
      const description = security.getPrettyTokenErrorMessage(error, req);
      return res.status(httpCodes.UNAUTHORIZED).json({ error: 'Token', description });
    }

    // create and resign the new token for the given user, extending the length of validation for
    // the users session (as long as they use this for the new requests)
    const { username, id, name } = decoded;
    const refreshToken = security.signAuthenticationToken(username, name, id, config.SECRET);

    // set the new token.
    res.set('Authorization', `bearer ${refreshToken}`);

    const message = LanguageService.get(req, 'user.token_refresh').replace('<n>', username);
    return res.json({ message, username, id });
  }

  /**
   * Refreshing the authentication token for google, this is handled by the underlining middleware
   * but we are just going to check that its a valid token and respond back to the user with a okay.
   */
  static async refreshGoogleAuthentication(req, res) {
    GoogleController.refreshAuthenticationToken(req, res, (error) => {
      if (error instanceof Error) throw error;
      res.status(httpCodes.OK).json();
    });
  }

  /**
   * Refreshing the authentication token for facebook, this is handled by the facebook graph api,
   * using the client id and the application secret for refreshing the token.
   */
  static async refreshFacebookAuthentication(req, res) {
    FacebookController.refreshAuthenticationToken(req, res, (error) => {
      if (error instanceof Error) throw error;
      res.status(httpCodes.OK).json();
    });
  }

  /**
   * Refreshing the authentication token for github.
   */
  static async refreshGithubAuthentication(req, res) {
    GithubController.refreshAuthenticationToken(req, res, (error) => {
      if (error instanceof Error) throw error;
      res.status(httpCodes.OK).json();
    });
  }

  /**
   * Refreshes the authentication token for the given user for the given authentication method, this
   * will default to attempting to refresh the authentication as a local user if no provider is
   * given.
   */
  static async refreshAuthenticationToken(req, res, next) {
    try {
      const provider = req.query.provider || req.headers.provider;

      switch (provider) {
        case PROVIDERS.LOCAL:
          // refresh against the local system using a username and password. (both are required).
          return await AuthenticationController.refreshLocalAuthentication(req, res, next);
        case PROVIDERS.GOOGLE:
          // Refresh the user against google, this just means validation of the token that was
          // given to the user when they authenticated within the browser.
          return await AuthenticationController.refreshGoogleAuthentication(req, res, next);
        case PROVIDERS.FACEBOOK:
          // Refresh the user against facebook, using the graph api with the client id and secret.
          return await AuthenticationController.refreshFacebookAuthentication(req, res, next);
        case PROVIDERS.GITHUB:
          // Refresh the user against github.
          return await AuthenticationController.refreshGithubAuthentication(req, res, next);
        default:
          // By default if the user has not provided the authentication method fall back to
          // refreshing with the local system.
          return await AuthenticationController.refreshLocalAuthentication(req, res, next);
      }
    } catch (error) {
      const message = LanguageService.get(req, 'error.failed_token_validation');
      return next(new ApiError(req, res, error, 401, 'Token', message));
    }
  }
};
