import Endpoint from '../endpoint.js';

export default class User extends Endpoint {
  /**
   * Creates a new instance of the User class.
   * @param {string} apiUri The root url of the endpoint being called.
   * @param {string} path Any additional appended path (e.g /users)
   */
  constructor(apiUri, path) {
    super(apiUri, path);
  }

  /**
   * Gets the users basic information.
   */
  async getUserInformation() {
    const options = Endpoint.buildOptions(this.apiUrl, `${this.path}/self`, 'get', {});

    return Endpoint.apiCall(options);
  }
}
