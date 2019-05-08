import Endpoint from '../endpoint.js';

export default class Token extends Endpoint {
  /**
   * Creates a new instance o the Token class.
   * @param {string} apiUri The root url of the endpoint being called.
   * @param {string} path Any additional appended path (e.g /users)
   */
  constructor(apiUri, path) {
    super(apiUri, path);
  }

  /**
   * Creates a new user.
   * @param {string} username The username of the new user.
   * @param {string} password The password of the new user.
   */
  async create(username, password) {
    const options = Endpoint.buildOptions(this.apiUrl, `${this.path}register`, 'post', {
      username,
      password
    });

    return Endpoint.apiCall(options);
  }

  /**
   * Authenticate was the provided username and password.
   * @param {string} username The username to authenticate with.
   * @param {string} password The password to authenticate with.
   */
  async authenticate(username, password, provider = 'local') {
    const path = `${this.path}login?provider=${provider}`;
    const options = Endpoint.buildOptions(this.apiUrl, path, 'post', {
      username,
      password
    });

    const authentication = await Endpoint.apiCall(options);
    Endpoint.fireEvent('authentication', authentication);

    return authentication;
  }

  /**
   * Attempt to refresh the authentication token.
   */
  async refresh(provider = 'local') {
    const path = `${this.path}login/refresh?provider=${provider}`;
    const options = Endpoint.buildOptions(this.apiUrl, path, 'post', {});

    const refresh = await Endpoint.apiCall(options);
    Endpoint.fireEvent('authentication-refresh', refresh);

    return refresh;
  }
}
