const path = require('path');
const _ = require('lodash');
const fs = require('fs');

const supportedCodes = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../language', 'codes.json')).toString()
);

module.exports = class LanguageController {
  static getLanguageByCode(req, res) {
    // determine if the requested code is actually supported, if the code does not exist then throw
    // a error message related to no language code being supported. On the client it should default
    // back to the default if it fails.
    const language = _.find(supportedCodes, (code) => code.code === req.params.code);

    if (_.isNil(language)) {
      return res.status(400).json({
        error: 'Language',
        description: `The language code does not exist by the provided code: ${req.params.code}`
      });
    }

    // build up the path to the language being requested.
    const directory = path.join(__dirname, '../language', `${language.name}.json`);

    const file = fs.readFileSync(directory);
    return res.status(200).send(JSON.parse(file.toString()));
  }

  /**
   * Sends all the currently supported codes.
   */
  static getLanguageOptions(req, res) {
    res.json(supportedCodes);
  }
};
