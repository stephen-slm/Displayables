// short hand notation to stop repetitive verbose code to stay the same thing over and over again
// when interacting within the dom. Used to simplify code reading and code style + improve usage.
const $ = document.querySelector.bind(document);

/**
 * Checks to see if a value is null or undefined.
 * @param {any} value The value to be checked.
 */
function isNil(value) {
  return value == null;
}

/**
 * Validates that the required parameters are gathered, otherwise builds up a error message to be
 * displayed.
 * @param {object} parameters A object of the parameters gathered.
 * @param {array} requiredArray The parameters that are required.
 * @param {LanguageController} lang The language controller for translation.
 */
function validateUrlParameters(parameters, requiredArray, lang) {
  const missing = [];

  requiredArray.forEach((parameter) => {
    if (isNil(parameters[parameter]) || parameters[parameter] === '') missing.push(parameter);
  });

  if (missing.length === 0) return { valid: true };
  let message = lang.data.workstation.missingParams;

  message += `${
    missing.length > 1 ? lang.data.workstation.sAre : ` ${lang.data.workstation.is}`
  } ${lang.data.workstation.missing.replace('{{ params }}', missing.join(', '))}`;

  return { error: new Error(message), valid: false };
}

/**
 * Gathers all the required parameters from the url that are asked for by the array.
 * @param {array} parameters The array of parameters looking to be gathered.
 * @param {LanguageController} lang The language controller for translation.
 */
function getUrlParameters(requiredArray, lang) {
  const urlSearchParameters = new URL(window.location.href).searchParams;
  const parameters = {};

  requiredArray.forEach((parameter) => {
    parameters[parameter] = urlSearchParameters.get(parameter) || null;
  });

  // validate that all the parameters are not empty.
  const validate = validateUrlParameters(parameters, requiredArray, lang);
  return { parameters, error: validate.error };
}

/**
 * Parses a JWT token to get its payload out.
 * @param {string} token The token that is being parsed.
 */
function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace('-', '+').replace('_', '/');
  return JSON.parse(window.atob(base64));
}

/**
 * Removes any existing full screen loading screen with the id of loading.
 */
function removeFullScreenLoading() {
  const loadingRoot = $('#loading-root');
  const loading = $('#loading');

  if (!isNil(loadingRoot)) {
    while (loadingRoot.hasChildNodes()) {
      loadingRoot.childNodes[0].remove();
    }

    loadingRoot.classList.add('loading-spinner-back');
  }

  if (!isNil(loading)) {
    loading.style.height = 'auto';
    setTimeout(() => loading.remove(), 1000);
  }
}

/**
 * Expands the top navigation of the home page.
 * @param event the event fired from the click.
 */
function expandTopNavigation(event) {
  event.preventDefault();

  const topNav = $('.nav-dropdown-content');
  const topNavDisplay = topNav.style.visibility;

  if (isNil(topNavDisplay) || topNavDisplay === '' || topNavDisplay === 'hidden') {
    // topNav.style.display = 'block';
    topNav.style.visibility = 'visible';
    topNav.style.opacity = '1';
    topNav.style.maxHeight = '500px';
  } else {
    // topNav.style.display = 'none';
    topNav.style.visibility = 'hidden';
    topNav.style.opacity = '0';
    topNav.style.maxHeight = '0';
  }
}

/**
 * Used to display a error message that cannot be used on the page, requires calling complete.
 * @param {error} error The error that occurred.
 * @param {LanguageController} lang The language controller for translation.
 * @param {function} callback a function used to complete the display.
 */
function displayImmutableErrorDisplay(error, lang, callback) {
  const message = error.description || error.message;
  const title = error.error || '';

  const template = document.createElement('div');
  template.classList.add('immutable-error');

  template.innerHTML = `
  <div class="immutable-error-wrapper">
    <div>
      <i class="fas fa-exclamation-triangle fa-4x"></i>
      <h2>${title} Error!</h2>
      <div class="immutable-error-message">${message}</div>
      <div class="immutable-error-go">${lang.data ? lang.data.general.go : 'Go'} <a href="/">${
    lang.data ? lang.data.navigation.home : 'Home'
  }</a>.</div>
    </div>
  </div>`;

  callback({
    template,
    show: () => {
      document.body.appendChild(template);
    }
  });
}

/**
 *
 * Used to display a general message that can be removed (appended as a child to a div).
 * @param {error} message The message that is going to be displayed.
 * @param {string} location the class or id that will be appended the message.
 * @param {boolean} id if its a id or not.
 * @param {*} callback
 */
function displayMutableGeneralDisplay(message, location, id, callback) {
  const template = document.createElement('div');
  template.className = 'input-text-success input-text-failed-shake';
  template.style.display = 'block';

  const removeCross = document.createElement('div');
  removeCross.className = 'top-message-delete';

  const innerIcon = document.createElement('i');
  innerIcon.className = 'fas fa-times fa-lg';

  const content = document.createElement('div');
  content.textContent = message;

  removeCross.appendChild(innerIcon);
  template.appendChild(removeCross);
  template.appendChild(content);

  removeCross.addEventListener('click', (event) => {
    event.target.parentElement.parentElement.remove();
  });

  const position = $(`${id ? '#' : '.'}${location}`);

  callback({
    template,
    show: () => {
      position.prepend(template);
    }
  });

  setTimeout(() => {
    template.style.opacity = '0';
    setTimeout(() => template.remove(), 1500);
  }, 5000);
}

/**
 * Used to display a error message that can be removed (appended as a child to a div).
 * @param {error} error The error that is going to be displayed.
 * @param {string} location the class or id that will be appended the error.
 * @param {boolean} id if its a id or not.
 */
function displayMutableErrorDisplay(error, location, id = false, callback) {
  const message = error.description || error.message;

  displayMutableGeneralDisplay(message, location, id, (content) => {
    content.template.classList.add('input-text-failed');
    callback({ content, show: content.show });
  });
}

/**
 * Removes the authentication token for the current logged in user and sends them back to the login
 * page as if they just arrived to the site (not logged in).
 * @param event The event fired on click.
 * @param redirect If we should redirect home or not.
 */
function logoutUser(event, redirect = true) {
  event.preventDefault();

  if (localStorage.provider === 'google' && !isNil(gapi.auth2.getAuthInstance())) {
    gapi.auth2.getAuthInstance().disconnect();
  }

  // when the user signs out we must make sure to clean up all related authentication keys, status
  // and provider so that its a clean authentication, if this step is not done then the user will
  // have a bad login and result with unwanted side effects.
  localStorage.removeItem('token');
  localStorage.removeItem('signedToken');
  localStorage.removeItem('managementState');
  localStorage.removeItem('provider');
  localStorage.removeItem('lastProviderAttempt');

  // redirect to the home page if specified.
  if (redirect) window.location.href = `${window.location.origin}/`;
}

/**
 * Converts the first character of `string` to upper case and the remaining
 * to lower case.
 * @param {*} string The string to uppercase.
 */
function capitalize(string) {
  const lower = string.toLowerCase();
  return `${lower.split('')[0].toUpperCase()}${lower.substring(1, lower.length)}`;
}

/**
 * Gets the weather icon for a given type code.
 * @param {string} typeCode The type code of the weather.
 */
function getWeatherIconForType(typeCode) {
  switch (typeCode) {
    case '01d':
      return '&#xf00d;';
    case '02d':
      return '&#xf002;';
    case '03d':
    case '03n':
      return '&#xf041;';
    case '04d':
    case '04n':
      return '&#xf013;';
    case '09d':
    case '09n':
      return '&#xf019;';
    case '10d':
      return '&#xf006;';
    case '11d':
    case '11n':
      return '&#xf005;';
    case '13d':
    case '13n':
      return '&#xf00a;';
    case '50d':
    case '50n':
      return '&#xf0b6;';
    case '01n':
      return '&#xf02e;';
    case '02n':
      return '&#xf086;';
    case '10n':
      return '&#xf029;';
    default:
      return '&#xf041;';
  }
}

/**
 * Sets a given pseudo style value for a given element.
 * @param {string} tag The pseudo tag that will be used for reference.
 * @param {string} prop The css property that will be replaced.
 * @param {string} value The value of the updated property.
 */
function setPseudoStyle(tag, prop, value) {
  const head = document.head || document.getElementsByTagName('head')[0];
  const sheet = $('#pseudoStyle') || document.createElement('style');

  const className = `pseudoStyle${new Date().getTime()}`;
  sheet.id = 'pseudoStyle';

  this.classList.add(className);
  sheet.innerHTML += ` .${className}:${tag}{${prop}:${value}}`;

  head.appendChild(sheet);
}

HTMLElement.prototype.pseudoStyle = setPseudoStyle;

export {
  capitalize,
  displayImmutableErrorDisplay,
  displayMutableErrorDisplay,
  displayMutableGeneralDisplay,
  expandTopNavigation,
  getUrlParameters,
  getWeatherIconForType,
  isNil,
  logoutUser,
  parseJwt,
  removeFullScreenLoading,
  validateUrlParameters
};
