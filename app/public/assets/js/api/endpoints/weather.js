import Endpoint from '../endpoint.js';

export default class Weather extends Endpoint {
  /**
   * Creates a new instance o the Weather class.
   * @param {string} apiUri The root url of the endpoint being called.
   * @param {string} path Any additional appended path (e.g /users)
   */
  constructor(apiUri, path) {
    super(apiUri, path);
  }

  /**
   * Gather the weather for a city.
   * @param {string} city The city to gather the weather in.
   */
  async byCity(city) {
    const options = Endpoint.buildOptions(this.apiUrl, `${this.path}/${city}`, 'get', {});
    return Endpoint.apiCall(options);
  }

  /**
   * Gather the weather for a city in a set country.
   * @param {string} city The city to gather the weather in.
   * @param {string} code The country code to fix the country in.
   */
  async byCityAndCode(city, code) {
    const options = Endpoint.buildOptions(this.apiUrl, `${this.path}/${city}/${code}`, 'get', {});
    return Endpoint.apiCall(options);
  }
}
