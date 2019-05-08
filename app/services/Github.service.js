const RestService = require('./Rest.service');

class GithubService extends RestService {
  /**
   * Gets the basic information for the current authenticated user for github.
   * @param {string} token The authentication token used within the authentication with github.
   */
  static async getMe(token) {
    try {
      const response = await GithubService.get(`${this.base}/user?access_token=${token}`, {
        'User-Agent': 'Displayables'
      });

      // facebook will have a error object if a error occurs.
      if (response.documentation_url && response.message) return Promise.reject(response.message);

      return { id: response.id, displayName: response.name };
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate the access token with github to make sure that the token is fully valid.
   * @param {string} token The current accesss_token used by the user for authentication.
   */
  static async checkAuthenticationToken(token) {
    try {
      const { clientId, secret } = GithubService;

      const prefix = `https://${clientId}:${secret}@api.github.com`;

      const response = await GithubService.get(`${prefix}/applications/${clientId}/tokens/${token}`, {
        'User-Agent': 'Displayables'
      });

      // facebook will have a error object if a error occurs.
      if (response.documentation_url && response.message) return Promise.reject(response.message);

      return { id: response.user.id };
    } catch (error) {
      return null;
    }
  }

  /**
   * GitHub redirects back to your site with a temporary code in a code parameter as well as the
   * state you provided in the previous step in a state parameter.Exchange this code for an access
   * token.
   * @param {string} token The code token used to get a access token.
   */
  static async getAccessToken(token) {
    try {
      const { clientId, secret } = GithubService;

      const redirectUrl = 'http://localhost:8080/login';
      const query = `code=${token}&client_id=${clientId}&client_secret=${secret}&redirect_uri=${redirectUrl}`;

      const response = await GithubService.post(`https://github.com/login/oauth/access_token?${query}`, {
        'User-Agent': 'Displayables',
        Accept: 'application/json'
      });

      // facebook will have a error object if a error occurs.
      if (response.documentation_url && response.message) return Promise.reject(response.message);

      return response.access_token;
    } catch (error) {
      return null;
    }
  }
}

GithubService.secret = process.env.GITHUB_CLIENT_SECRET;
GithubService.clientId = process.env.GITHUB_CLIENT_ID;
GithubService.base = 'https://api.github.com';

module.exports = GithubService;
