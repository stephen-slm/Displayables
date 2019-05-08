const uuidv4 = require('uuid/v4');
const logger = require('../libs/logger');
const httpCodes = require('../constants/httpCodes');

const LanguageService = require('../services/Language.service');

module.exports = class LoggingController {
  /**
   * Logs all request starts.
   */
  static logRequestStart(req, res, next) {
    const sender = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    req.logInfo = { token: uuidv4().split('-')[0], time: Date.now() };

    // set default header lang if not set.
    const [languageCode] = req.acceptsLanguages();
    const codeExists = LanguageService.getCodes().filter((x) => x.code === languageCode);

    if (codeExists.length <= 0) {
      req.headers.lang = LanguageService.defaultCode;
    } else {
      req.headers.lang = languageCode;
    }

    logger.info(`${req.logInfo.token} Started ${req.method} ${req.originalUrl} for ${sender}`);
    res.on('finish', LoggingController.logRequestEnd.bind(this, req, res));
    return next();
  }

  /**
   * Logs all request ends.
   */
  static logRequestEnd(req, res) {
    const { statusCode, _contentLength } = res;
    const { token, time } = req.logInfo;

    const message = `${token} Completed ${statusCode} ${_contentLength} in ${Date.now() - time}ms`;

    if (statusCode === httpCodes.OK || statusCode === httpCodes.NOT_MODIFIED) {
      logger.info(message);
    } else if (statusCode === httpCodes.INTERNAL_SERVER_ERROR) {
      logger.error(message);
    } else {
      logger.warn(message);
    }
  }
};
