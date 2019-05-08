export default class LanguageController {
  /**
   * Used to gather, hold and manage the language information for the page, including gathering all
   * the related properties for a given language.
   * @param {api} api The api controller for gathering the languages information.
   */
  constructor(api) {
    if (api == null) {
      throw new Error('passed api cannot be null to use the language controller');
    }

    this.code = localStorage.languageCode;
    this.defaultCode = 'en';
    this.api = api;
    this.ready = false;
  }

  /**
   * Setup the language controller so that all the language information for the given page is loaded
   * into memory. validating that the local language code is valid (if not set to default)
   */
  async initialize() {
    if (this.ready) return;

    this.code = await this.validateCode(localStorage.languageCode);
    localStorage.languageCode = this.code;

    this.data = await this.api.languages.getLanguageByCode(this.code);
    this.ready = true;
  }

  /**
   * Gets a language by its code.
   * @param {string} code The code to set with.
   */
  async setCode(code) {
    this.code = this.validateCode(code);
    localStorage.languageCode = this.code;

    this.language = await this.api.languages.getLanguageByCode(this.code);
  }

  /**
   * Returns a default language code if the current one is not valid.
   * @param {string} code The language code.
   */
  async validateCode(code) {
    const codes = await this.api.languages.getLanguageCodes();

    if (codes.filter((x) => x.code === code).length !== 1) {
      return this.defaultCode;
    }

    return code;
  }

  /**
   * Gets the current language code for the page.
   */
  getCode() {
    return this.code;
  }
}
