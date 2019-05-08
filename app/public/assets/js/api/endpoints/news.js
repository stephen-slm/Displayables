import Endpoint from '../endpoint.js';

export default class News extends Endpoint {
  /**
   * Creates a new instance of the news class.
   * @param {string} apiUri The root url of the endpoint being called.
   * @param {string} path Any additional appended path (e.g /users)
   */
  constructor(apiUri, path) {
    super(apiUri, path);
  }

  /**
   * Gathers the top news for the country provided.
   * @param {string} country The country which the news is getting gathered for.
   */
  async topCountry(country) {
    const options = Endpoint.buildOptions(this.apiUrl, `${this.path}/${country}`, 'get', {});
    return Endpoint.apiCall(options);
  }

  /**
   * Gathers the top news for the country and category provided.
   * @param {string} country The country which the news is getting gathered for.
   * @param {string} category The category of news to gather.
   */
  async topCountryCategory(country, category) {
    const options = Endpoint.buildOptions(this.apiUrl, `${this.path}/${country}/${category}`, 'get', {});
    return Endpoint.apiCall(options);
  }
}
