const https = require('https');

module.exports = class RestService {
  /**
   * perform a get request.
   * @param {string} url The url on the request.
   * @param {array} headers a key value pair of the headers. (optional)
   */
  static async get(url, headers) {
    return RestService.request(url, 'get', headers);
  }

  /**
   * perform a post request.
   * @param {string} url The url on the request.
   * @param {array} headers a key value pair of the headers. (optional)
   */
  static async post(url, headers) {
    return RestService.request(url, 'post', headers);
  }

  /**
   * perform a patch request.
   * @param {string} url The url on the request.
   * @param {array} headers a key value pair of the headers. (optional)
   */
  static async patch(url, headers) {
    return RestService.request(url, 'patch', headers);
  }

  /**
   * perform a delete request.
   * @param {string} url The url on the request.
   * @param {array} headers a key value pair of the headers. (optional)
   */
  static async delete(url, headers) {
    return RestService.request(url, 'delete', headers);
  }

  /**
   * Makes a generic request.
   * @param {string} url The url to be requested.
   * @param {string} method The method of the request.
   * @param {array} headers a key value pair of the headers. (optional)
   */
  static async request(url, method, headers) {
    const parsedUrl = new URL(url);

    if (parsedUrl.username) {
      headers.Authorization = `Basic ${Buffer.from(
        `${parsedUrl.username}${parsedUrl.password ? `:${parsedUrl.password}` : ''}`
      ).toString('base64')}`;
    }

    const options = {
      method: method.toUpperCase(),
      host: parsedUrl.host,
      path: `${parsedUrl.pathname}${parsedUrl.search}`.trim(),
      port: parsedUrl.protocol === 'https:' ? 443 : 80,
      headers
    };

    return new Promise((resolve, reject) => {
      const request = https
        .request(options, (response) => {
          let data = '';

          // build up the data on competition
          response.on('data', (chunk) => {
            data += chunk;
          });

          // resolve the completed request.
          response.on('end', () => resolve(JSON.parse(data)));
        })
        .on('error', (error) => reject(error));

      request.end();
    });
  }
};
