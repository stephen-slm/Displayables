export default class Endpoint {
  /**
   * Creates a endpoint interface to be implemented.
   * @param {string} apiUri The root url of the endpoint being called.
   * @param {string} path Any additional appended path (e.g /users)
   */
  constructor(apiUri, path) {
    this.apiUrl = apiUri;
    this.path = path;
  }

  /**
   * Build up a request that will be sent to the server.
   * @param {string} apiUrl The url to be sent too.
   * @param {string} path The additional path.
   * @param {string} method The method to be used.
   * @param {object} body The body to be sent.
   */
  static buildOptions(apiUrl, path, method, body) {
    Endpoint.validateRequestContent({ apiUrl, path, method, body });

    return {
      apiUrl,
      path,
      method: method.toUpperCase(),
      body
    };
  }

  /**
   * Fires a custom event.
   * @param {string} name The name of the custom event.
   * @param {json} content The content to be set on the events details.
   */
  static fireEvent(name, content) {
    window.dispatchEvent(
      new CustomEvent(name, {
        detail: content
      })
    );
  }

  /**
   * All options must be specified before making a call
   * @param {object} options The options for the request.
   */
  static validateRequestContent(options) {
    ['method', 'apiUrl', 'path', 'body'].forEach((option) => {
      if (!options[option]) {
        throw new Error(`${option} has to be specified`);
      }
    });
  }

  /**
   * Gets the body content based on the method, (returned stringify for json server expectation)
   * @param {string} method The method of the request.
   * @param {object} body The body to be sent.
   */
  static getBodyContent(method, body) {
    if (body == null || Object.keys(body).length === 0) return undefined;
    return ['get', 'head'].includes(method.toLowerCase()) ? undefined : JSON.stringify(body);
  }

  /**
   * Gathers the error from the response for the user, when the response was not a 200.
   * @param {object} response The response from the request.
   */
  static async getErrorMessageFromResponse(response) {
    try {
      const { status } = response;

      const text = await response.text();
      const json = text == null || text === '' ? {} : JSON.parse(text);

      return Object.assign({ headers: response.headers, status }, json);
    } catch (error) {
      return { error: 'unknown', description: response.statusText, status };
    }
  }

  /**
   * Performs the api call with the fetch operator based on the options.
   * @param {object} options The options for the request.
   */
  static async apiCall(options) {
    const response = await fetch(`${options.apiUrl}/${options.path}`, {
      method: options.method,
      body: Endpoint.getBodyContent(options.method, options.body),
      headers: {
        Authorization: `bearer ${localStorage.token}`,
        provider: localStorage.provider,
        'Accept-Language': localStorage.languageCode,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = { headers: {}, status: response.status };
      const text = await response.text();

      data.headers = response.headers;

      if (text == null || text === '') return data;
      return Object.assign(JSON.parse(text), data);
    }

    throw await Endpoint.getErrorMessageFromResponse(response);
  }
}
