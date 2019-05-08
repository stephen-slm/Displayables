import Endpoint from '../endpoint.js';

export default class Infrastructure extends Endpoint {
  /**
   * Creates a new instance of the infrastructure class.
   * @param {string} apiUri The root url of the endpoint being called.
   * @param {string} path Any additional appended path (e.g /users)
   */
  constructor(apiUri, path) {
    super(apiUri, path);
  }

  /**
   * Performs a hello request to the endpoint to confirm that the service is up and running.
   */
  async hello() {
    const options = Endpoint.buildOptions(this.apiUrl, `${this.path}/hello`, 'get', {});
    return Endpoint.apiCall(options);
  }

  /**
   * Gathers server and client version information like author, license and version.
   */
  async version() {
    const options = Endpoint.buildOptions(this.apiUrl, `${this.path}/version`, 'get', {});
    return Endpoint.apiCall(options);
  }
}
