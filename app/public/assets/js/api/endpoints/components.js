import Endpoint from '../endpoint.js';

export default class Components extends Endpoint {
  /**
   * Creates a new instance of the components class.
   * @param {string} apiUri The root url of the endpoint being called.
   * @param {string} path Any additional appended path (e.g /users)
   */
  constructor(apiUri, path) {
    super(apiUri, path);
  }

  /**
   * Gets and sends the current components list to the requesting user.
   */
  async getAll() {
    const options = Endpoint.buildOptions(this.apiUrl, `${this.path}/`, 'get', {});
    return Endpoint.apiCall(options);
  }
}
