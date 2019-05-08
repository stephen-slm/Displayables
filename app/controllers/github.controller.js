const _ = require('lodash');

const { PROVIDERS } = require('../constants/user');
const httpCodes = require('../constants/httpCodes');
const ApiError = require('../errors/apiError');

const UserRepository = require('../repository/user.repository');
const WorkstationRepository = require('../repository/workstation.repository');

const LanguageService = require('../services/Language.service');
const GithubService = require('../services/Github.service');

module.exports = class GithubController {
  /**
   * Refreshing the Github authentication token via using the client id and the client secret.
   * Using this information we can communicate with the Github graph api to get a new
   * authentication token for the current user.
   * Reference: https://developers.Github.com/docs/Github-login/access-tokens/refreshing/
   */
  static async refreshAuthenticationToken(req, res) {
    // if the req.user has not been set then the token was not authenticated with Github. Let the
    // user know that the token was invalid and that the request is unauthorized.
    const token = req.header('Authorization').substring('bearer '.length);
    req.user = await GithubService.getMe(token);

    if (_.isNil(req.user)) {
      const description = LanguageService.get(req, 'error.invalid_token');
      return res.status(httpCodes.UNAUTHORIZED).json({ error: 'Token', description });
    }

    const userId = await UserRepository.userExistsByUsername(req.user.id);

    // set the new token.
    res.set('Authorization', `bearer ${token}`);

    const message = LanguageService.get(req, 'user.token_refresh').replace('<n>', req.user.displayName);
    return res.json({ message, username: req.user.id, id: userId });
  }

  /**
   * Checks the authentication token with the Github endpoint, making sure that the user who is
   * using the token is using a properly authenticated token.
   */
  static async checkAuthenticationToken(req, res, next) {
    try {
      // we need to check with Github that the token is valid, we are going to do this by
      // performing a request on the /me graph api response.
      let token = req.header('Authorization').substring('bearer '.length);

      if (token.length === 20) {
        token = await GithubService.getAccessToken(token);
        req.headers.authorization = `bearer ${token}`;
      }

      req.user = await GithubService.checkAuthenticationToken(token);

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
        req.user = await GithubService.getMe(token);
        const { id, displayName } = req.user;

        userId = await UserRepository.createReferenceUser(id, displayName, PROVIDERS.GITHUB);
        await WorkstationRepository.createDefaultWorkstationForUser(userId);
      }

      const localContent = await UserRepository.getUserLoginDetailsById(userId);
      req.body.decoded = Object.assign({}, req.user, {
        id: localContent.id,
        provider: localContent.provider,
        username: localContent.username,
        name: localContent.name
      });

      return next();
    } catch (error) {
      const message = LanguageService.get(req, 'error.failed_user_authenticate');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Token', message));
    }
  }

  /**
   * Complete the authentication process with github, gathering the users details (or adding it),
   * Making sure to extract and update the authorization token.
   */
  static async finalizeGithubAuthentication(req, res, next) {
    try {
      const { id: githubId } = req.user;
      const localId = await UserRepository.userExistsByUsername(githubId);

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
