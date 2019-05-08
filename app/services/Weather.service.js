const RestService = require('./Rest.service');

class WeatherService extends RestService {
  /**
   * Gets a city's weather by a name.
   * @param {string} name The name of the city.
   * @param {string} code The code of the city.
   */
  static async GetByCityNameAndCode(name, code) {
    return WeatherService.get(`${this.base}?units=metric&q=${name},${code}&appid=${this.apiKey}`);
  }

  /**
   * Gets a city's weather by a name.
   * @param {string} name The name of the city.
   */
  static async GetByCityName(name) {
    return WeatherService.get(`${this.base}?units=metric&q=${name}&appid=${this.apiKey}`);
  }

  /**
   * Gets a city's weather by a id.
   * @param {string} id The id of the city.
   */
  static async GetByCityId(id) {
    return WeatherService.get(`${this.base}?units=metric&id=${id}&appid=${this.apiKey}`);
  }

  /**
   * Gets the weather of the city by a lat or long.
   * @param {string} lat The latitude of the city.
   * @param {string} long The longitude of the city.
   */
  static async GetByGeoCoordinates(lat, long) {
    return WeatherService.get(`${this.base}?units=metric&lat=${lat}&lon=${long}&appid=${this.apiKey}`);
  }

  /**
   * Gets the weather of city by a zip code.
   * @param {string} zipCode The zip-code of the city.
   * @param {string} countryCode The country code of the country.
   */
  static async GetByZipCode(zipCode, countryCode) {
    return WeatherService.get(`${this.base}?units=metric&zip=${zipCode},${countryCode}&appid=${this.apiKey}`);
  }
}

WeatherService.apiKey = process.env.WEATHER_TOKEN;
WeatherService.base = 'https://api.openweathermap.org/data/2.5/weather';

module.exports = WeatherService;
