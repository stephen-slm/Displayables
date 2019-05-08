const logger = require('../libs/logger');
const httpCodes = require('../constants/httpCodes');

const LanguageService = require('../services/Language.service');

module.exports = class ErrorController {
  /**
   * Middleware that will catch all express routing and error calls, logging them and passing them
   * onto the next error. This is called with app. Use in the main index.js file.
   * @param {error} error The error occurred during the routing process.
   */
  // next is required for express to handle the processing.
  // eslint-disable-next-line no-unused-vars
  static handleError(error, req, res, next) {
    logger.error(error.stack);

    if (error && error.sendJsonResponse) {
      return error.sendJsonResponse();
    }

    return res.status(httpCodes.INTERNAL_SERVER_ERROR).json({
      error: LanguageService.get(req, 'error.something_wrong'),
      description: error.message
    });
  }
};
