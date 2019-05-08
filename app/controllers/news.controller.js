const _ = require('lodash');

const httpCodes = require('../constants/httpCodes');
const ApiError = require('../errors/apiError');

const LanguageService = require('../services/Language.service');
const NewsService = require('../services/News.service');

module.exports = class NewsController {
  /**
   * Gathers the top news for the passed country.
   * @param {string} country The country to gather the top news from.
   */
  static async topNewsByCountryCode(req, res, next) {
    try {
      const { country } = req.params;
      const langCode = LanguageService.getCodeFromRequest(req);

      if (_.isNil(country)) {
        const description = LanguageService.get(req, 'news.no_country_code', langCode);
        return res.status(httpCodes.BAD_REQUEST).json({ error: 'news', description });
      }

      const countryTopNews = await NewsService.getTopNewsByCountryCode(country, langCode);
      return res.json({ ...countryTopNews });
    } catch (error) {
      const message = LanguageService.get(req, 'error.something_wrong');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'news', message));
    }
  }

  /**
   * Gathers the top news for a country by a filter based on the request params.
   * @param {string} country The country to gather the top news from.
   * @param {string} category The category to filter by.
   */
  static async topNewsByCountryCodeAndCategory(req, res, next) {
    try {
      const { country, category } = req.params;
      const langCode = LanguageService.getCodeFromRequest(req);

      if (_.isNil(country) || _.isNil(category)) {
        const description = LanguageService.get(req, 'news.no_country_code_or_category', langCode);
        return res.status(httpCodes.BAD_REQUEST).json({ error: 'news', description });
      }

      const countryTopNews = await NewsService.getTopNewsByCountryCodeAndCategory(
        country,
        category,
        langCode
      );

      return res.json({ ...countryTopNews });
    } catch (error) {
      const message = LanguageService.get(req, 'error.something_wrong');
      return next(new ApiError(req, req, error, httpCodes.INTERNAL_SERVER_ERROR, 'news', message));
    }
  }
};
