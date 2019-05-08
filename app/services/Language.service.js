const fs = require('fs');
const path = require('path');
const _ = require('lodash');

module.exports = class LanguageService {
  /**
   * initialize the language server, pull in all the supporting language codes, and the load all the
   * languages data into memory for it to be easily accessed later on when the users start
   * requesting.
   */
  static initialize() {
    this.defaultCode = 'en';
    this.languageRoot = path.join(__dirname, '../language');
    this.codes = JSON.parse(fs.readFileSync(path.join(this.languageRoot, 'codes.json')));

    this.codes.forEach((code) => {
      this[code.code] = JSON.parse(fs.readFileSync(path.join(this.languageRoot, `server-${code.name}.json`)));
    });
  }

  /**
   * Gathers the language version of a given key. Based on the language code given.
   * @param {request} request The language request.
   * @param {string} key The key which will be gathered.
   */
  static get(request, key) {
    if (_.isNil(this.defaultCode)) LanguageService.initialize();

    let message = this[request.headers.lang || this.defaultCode];

    key.split('.').forEach((keyVal) => {
      message = message[keyVal];
    });

    return message;
  }

  /**
   * Gets the request language code that was sent by the user.
   * @param {request} request The request object that was sent by the user.
   */
  static getCodeFromRequest(request) {
    return request.headers.lang || this.defaultCode;
  }

  /**
   * Gets the codes that are currently supported.
   */
  static getCodes() {
    if (_.isNil(this.defaultCode)) LanguageService.initialize();
    return this.codes;
  }
};
