const packageJson = require('../../package');
const httpCodes = require('../constants/httpCodes');

const LanguageService = require('../services/Language.service');

module.exports = class InfrastructureController {
  /**
   * The hello endpoint for validating the service is up.
   */
  static hello(req, res) {
    return res.json({ message: LanguageService.get(req, 'general.hello') });
  }

  /**
   * Gets the current running version of the application to be sent back to the client. The version
   * will be pulled from the current package.json file for sending back, so make sure to keep the
   * package version up to date to allow valid version validation for a customer.
   */
  static version(req, res) {
    const { name, version, author, license } = packageJson;

    return res.json({ name, version, author, license });
  }

  /**
   * Lets the user know that the endpoint being used is not valid/unavailable.
   */
  static unavailable(req, res) {
    const description = LanguageService.get(req, 'unavailable_service');
    return res.status(httpCodes.SERVICE_UNAVAILABLE).json({ error: 'Unavailable Service', description });
  }
};
