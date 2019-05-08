import Infrastructure from './endpoints/infrastructure.js';
import Workstations from './endpoints/workstations.js';
import Components from './endpoints/components.js';
import Language from './endpoints/language.js';
import Weather from './endpoints/weather.js';
import Token from './endpoints/token.js';
import News from './endpoints/news.js';
import User from './endpoints/user.js';

export default class Api {
  /**
   * The core api for displayables.
   * @param {string} apiUri the root api url.
   * @param {string} localToken The token if already authenticated.
   */
  constructor(apiUri, localToken) {
    this.apiUri = apiUri;

    window.addEventListener('authentication-failed', Api.failedAuthentication);
    window.addEventListener('authentication', Api.authenticated);
    window.addEventListener('refresh', Api.authenticated);

    if (localToken) {
      localStorage.setItem('token', localToken);
    }

    this.infrastructure = new Infrastructure(this.apiUri, 'infrastructure');
    this.components = new Components(this.apiUri, 'components');
    this.languages = new Language(this.apiUri, 'languages');
    this.workstations = new Workstations(this.apiUri, '');
    this.weather = new Weather(this.apiUri, 'weather');
    this.user = new User(this.apiUri, 'users');
    this.news = new News(this.apiUri, 'news');
    this.token = new Token(this.apiUri, '');
  }

  /**
   * Updates the token stored in the instance and storage.
   * @param {event} event The custom event fired to have the token on the details.
   */
  static authenticated(event) {
    localStorage.token = event.detail.headers.get('Authorization').substring('bearer '.length);
  }

  /**
   * If the authentication fails, clear the current token.
   * @param {event} event The event fired on a failed authentication.
   */
  static failedAuthentication() {
    localStorage.removeItem('token');
  }
}
