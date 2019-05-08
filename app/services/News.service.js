const RestService = require('./Rest.service');

class NewsService extends RestService {
  /**
   * Gather the top headline news for the country code.
   * @param {string} code The country code to gather by.
   * @param {string} languageCode The language code to get the news within.
   */
  static async getTopNewsByCountryCode(code, languageCode = 'en') {
    return NewsService.get(
      `${this.base}/top-headlines?country=${code}&language=${languageCode}&apiKey=${this.apiKey}`
    );
  }

  /**
   * Gathers the top news by country code and the category as the filter.
   * @param {string} code The country code to gather by.
   * @param {string} category The category to filter by.
   * @param {string} languageCode The language code to get the news within.
   */
  static async getTopNewsByCountryCodeAndCategory(code, category, languageCode = 'en') {
    return NewsService.get(
      `${this.base}/top-headlines?country=${code}&category=${category}&language=${languageCode}&apiKey=${
        this.apiKey
      }`
    );
  }

  /**
   * Gets the weather of city by a zip code.
   * @param {string} zipCode The zip-code of the city.
   * @param {string} countryCode The country code of the country.
   * @param {string} languageCode The language code to get the news within.
   */
  static async GetByZipCode(zipCode, countryCode, languageCode = 'en') {
    return NewsService.get(
      `${this.base}?units=metric&zip=${zipCode},${countryCode}&language=${languageCode}&appid=${this.apiKey}`
    );
  }
}

NewsService.apiKey = process.env.NEWS_TOKEN;
NewsService.base = 'https://newsapi.org/v2';

module.exports = NewsService;
