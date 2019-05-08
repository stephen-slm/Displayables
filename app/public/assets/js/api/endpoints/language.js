import Endpoint from '../endpoint.js';

export default class Languages extends Endpoint {
  /**
   * Creates a new instance of the language class.
   * @param {string} apiUri The root url of the endpoint being called.
   * @param {string} path Any additional appended path (e.g /users)
   */
  constructor(apiUri, path) {
    super(apiUri, path);
  }

  /**
   * Performs a hello request to the endpoint to confirm that the service is up and running.
   */
  async getLanguageByCode(code) {
    const options = Endpoint.buildOptions(this.apiUrl, `${this.path}/codes/${code}`, 'get', {});
    return Endpoint.apiCall(options);
  }

  /**
   * Get all the codes and language that are currently supported.
   */
  async getLanguageCodes() {
    const options = Endpoint.buildOptions(this.apiUrl, `${this.path}/codes`, 'get', {});
    return Endpoint.apiCall(options);
  }
}
