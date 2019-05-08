module.exports = class MissingController {
  /**
   *
   * Handles routes that have been requested that dont exist.
   */
  static handleMissing(request, response) {
    return response.status(404).send();
  }
};
