const RestService = require('./Rest.service');

class FacebookService extends RestService {
  /**
   * Performs the me request on the facebook graph api.
   * @param {string} token The facebook access token
   * @param {array} fields The fields that want to be gathered, this is optional.
   */
  static async getMe(token, fields = null) {
    try {
      const response = await FacebookService.get(
        `${this.base}/me?access_token=${token}${fields ? `&fields=${fields.join(',')}` : ''}`
      );

      // facebook will have a error object if a error occurs.
      if (response.error) return Promise.reject(response.error);

      return { id: response.id, displayName: response.name };
    } catch (error) {
      return null;
    }
  }
}

FacebookService.secret = process.env.FACEBOOK_CLIENT_SECRET;
FacebookService.clientId = process.env.FACEBOOK_CLIENT_ID;
FacebookService.base = 'https://graph.facebook.com/v3.2';

module.exports = FacebookService;
