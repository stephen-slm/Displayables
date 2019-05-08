const endOfLine = require('os').EOL;

module.exports = class ApiError extends Error {
  /**
   * A generic handler for all api errors.
   * @param request The api request.
   * @param response The api response.
   * @param {Error} error The error to be processed from the api.
   * @param {number} code The error code that will be send to the user.
   * @param {string} header The header of the generic message.
   * @param {string} description The error message in full that the user will get.
   */
  constructor(request, response, error, code, header, description) {
    super(error.message);

    this.response = response;
    this.request = request;
    this.code = code;
    this.header = header;
    this.description = description;

    // extend the stack of the error message so that when its logged that error will be more readable.
    this.stack += `${endOfLine}\tDescription: ${this.description}${endOfLine}\t${error.stack}`;
  }

  /**
   * Send a formatted response that is better structured for the user
   */
  sendJsonResponse() {
    this.response.status(this.code).json({
      description: this.description,
      error: this.header
    });
  }
};
