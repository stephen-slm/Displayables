const _ = require('lodash');

const httpCodes = require('../constants/httpCodes');
const WeatherApi = require('../services/Weather.service');
const ApiError = require('../errors/apiError');

const LanguageService = require('../services/Language.service');

module.exports = class WeatherController {
  /**
   * Gathers the weather for a city based on city name parameters.
   * @param {string} city The city to gather the weather from.
   */
  static async weatherByName(req, res, next) {
    try {
      const { city } = req.params;

      if (_.isNil(city)) {
        return res
          .statusCode(httpCodes.BAD_REQUEST)
          .json({ error: 'weather', description: LanguageService.get(req, 'weather.no_city_name') });
      }

      const cityWeather = await WeatherApi.GetByCityName(city);
      return res.json(cityWeather);
    } catch (error) {
      const message = LanguageService(req, 'error.something_wrong');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, '"Weather', message));
    }
  }

  /**
   * Gathers the weather for a city based on city and code parameters.
   * @param {string} city The city to gather the weather in.
   * @param {string} code The code of the country to gather the weather in.
   */
  static async weatherByNameAndCode(req, res, next) {
    try {
      const { city, country } = req.params;

      if (_.isNil(city) || _.isNil(country)) {
        return res.statusCode(httpCodes.BAD_REQUEST).json({
          description: LanguageService.get(req, 'weather.no_city_no_code'),
          error: 'weather'
        });
      }

      const cityWeather = await WeatherApi.GetByCityNameAndCode(city, country);
      return res.json(cityWeather);
    } catch (error) {
      const message = LanguageService(req, 'error.something_wrong');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'weather', message));
    }
  }
};
