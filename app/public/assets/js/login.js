import * as utilities from './utilities.js';
import LanguageController from './languageController.js';
import showSnack from './snackbar.js';

// short hand notation to stop repetitive verbose code to stay the same thing over and over again
// when interacting within the dom. Used to simplify code reading and code style + improve usage.
const $ = document.querySelector.bind(document);

const login = {
  /**
   * The language controller for the page.
   */
  lang: null
};

/**
 * Removes the error message from the screen if its being displayed once the user starts
 * entering input into the page again.
 */
function removeErrorMessage() {
  const errorLogin = $('#login-error');
  const errorRegister = $('#register-error');

  if (errorLogin.style.display !== 'none') {
    errorLogin.style.display = 'none';
  }

  if (errorRegister.style.display !== 'none') {
    errorRegister.style.display = 'none';
  }
}

/**
 * Shows the loading div that is currently under the header two of the page.
 */
function showLoading(hidingElementId) {
  $('.loading-bounce').classList.remove('hidden');

  if (hidingElementId != null) {
    $(`#${hidingElementId}`).style.display = 'none';
  }
}

/**
 * Hides the loading div that is currently under the header two of the page.
 */
function hideLoading(shownElementId) {
  $('.loading-bounce').classList.add('hidden');

  if (shownElementId != null) {
    $(`#${shownElementId}`).style.display = null;
  }
}

/**
 * Displays a error message on the login form.
 * @param error The error that was caused.
 */
function showLoginError(error) {
  if (error.description || error.message) {
    const errorDisplay = $('#login-error');
    errorDisplay.firstElementChild.textContent = error.description || error.message;
    errorDisplay.style.display = 'block';
  }

  hideLoading('login-form');
}

/**
 * Displays a error message on the register form.
 * @param error The error that was caused.
 */
function showRegisterError(error) {
  const errorDisplay = $('#register-error');

  errorDisplay.firstElementChild.textContent = error.description || error.message;
  errorDisplay.style.background = null;
  errorDisplay.style.display = 'block';
  errorDisplay.style.color = null;
  hideLoading('register-form');
}

/**
 * Shows a success message on the register form for the user.
 * @param message The message being displayed.
 */
function showRegisterSuccess(message) {
  const errorDisplay = $('#register-error');

  errorDisplay.firstElementChild.textContent = message;
  errorDisplay.style.background = 'var(--green)';
  errorDisplay.style.color = '#3c763d';
  errorDisplay.style.display = 'block';

  hideLoading('register-form');
}

/**
 * Signs the user out of the login page.
 * @param event The lick event fired on the "Not User" section.
 */
function signOutUser(event) {
  event.preventDefault();

  const loggedInDiv = $('#logged-in');
  const userSection = loggedInDiv.firstElementChild;

  userSection.innerHTML = login.lang.data.login.loggedOut;

  setTimeout(() => loggedInDiv.remove(), 2000);

  utilities.logoutUser(event, false);
}

/**
 * Fired when the user is already logged into the site, this will allow the user to click
 * that they are not the logged in user and remove the current authentication token for that user.
 */
function alreadyLoggedIn() {
  setTimeout(() => {
    const loggedInDiv = $('#logged-in');
    const userSection = loggedInDiv.firstElementChild.lastElementChild;
    const langGeneral = login.lang.data.general;

    userSection.textContent = `${langGeneral.not} ${utilities.parseJwt(localStorage.signedToken).name}`;
    loggedInDiv.classList.remove('hidden');

    userSection.addEventListener('click', signOutUser);
  }, 250);
}

/**
 * Attempts to authenticate the user when the login button is clicked, if the authentication is successful then the
 * user will be navigated back to the home page. Otherwise a error message will be displayed about why the user
 * could not be authenticated.
 * @param event The event that was fired on the user clicking login.
 * @returns {Promise<void>}
 */
async function authenticateUser(event) {
  try {
    event.preventDefault();
    showLoading('login-form');

    const usernameEl = $('#login-username');
    const passwordEl = $('#login-password');

    const username = usernameEl.value;
    const password = passwordEl.value;

    passwordEl.value = '';

    if (utilities.isNil(username) || password === '') {
      const error = login.lang.data.errors.emptyUsernameAndPasswordLogin;
      showLoginError(new Error(error));
    } else {
      await window.api.token.authenticate(username, password);

      localStorage.provider = 'local';
      localStorage.signedToken = localStorage.token;

      window.location.href = `${window.location.origin}/management`;
    }
  } catch (error) {
    showLoginError(error);
  }
}

/**
 * Attempting to authenticate with facebook through the facebook SDK, if the login completes
 * properly we will validate this with the server and then continue through to the management page.
 */
async function authenticateFacebookUser(code) {
  try {
    localStorage.token = code;
    localStorage.signedToken = code;
    await window.api.token.authenticate(null, null, 'facebook');
    localStorage.provider = 'facebook';

    window.location.href = `${window.location.origin}/management`;
  } catch (error) {
    showLoginError(error);
  }
}

/**
 * After authenticating with google and getting the authentication token, we then must go validate
 * this on the server. To make sure the token is valid.
 * @param {object} googleUser The google user object.
 */
async function authenticateGoogleUser(googleUser) {
  try {
    // we have to make sure to set the token before the authentication has taken place on the
    // server, this is because we use ths token for validation.
    const token = googleUser.getAuthResponse().id_token;
    localStorage.token = token;
    localStorage.signedToken = token;

    await window.api.token.authenticate(null, null, 'google');
    localStorage.provider = 'google';

    window.location.href = `${window.location.origin}/management`;
  } catch (error) {
    showLoginError(error);
  }
}

/**
 * Handles the authentication with github via the redirection authentication after getting a code back from the query.
 * @param {string} code The code sent during the redirection authentication.
 */
async function authenticateWithGithub(code) {
  try {
    localStorage.token = code;
    localStorage.signedToken = code;
    await window.api.token.authenticate(null, null, 'github');
    localStorage.provider = 'github';

    window.location.href = `${window.location.origin}/management`;
  } catch (error) {
    showLoginError(error);
  }
}

/**
 * Sets up the google authentication click handler / provider for the login page.
 */
function setupGoogleProviderAuthentication() {
  const clientId = document.head.querySelector('[name=google-signin-client_id]').content;

  const auth2 = gapi.auth2.init({
    client_id: clientId,
    ux_mode: 'redirect',
    redirect_uri: 'http://localhost:8080/login'
  });

  const element = $('#login-form-button-google');

  if (!utilities.isNil(element)) {
    auth2.attachClickHandler(element, {}, authenticateGoogleUser, showLoginError);

    // because we don't control the main handler (the google sdk does) we need to add another event
    // listener that will listen for the first click, this allows us to know google was used when we
    // have the redirect coming back, allowing us to properly complete the authentication from a
    // redirect.
    element.addEventListener('click', () => {
      localStorage.lastProviderAttempted = 'google';
    });
  }
}

/**
 * Sets up the Facebook SDK with the clientID and setup the click handler for the login button. SDK
 * will be using the current most recent SDK version as of: 06:06 PM 24/02/2019
 */
async function setupFacebookProviderAuthentication() {
  const clientId = document.head.querySelector('[name=facebook-signin-client_id]').content;
  const redirectUrl = 'http://localhost:8080/login';

  const facebookRedirectLoginHandler = (event) => {
    event.preventDefault();

    localStorage.lastProviderAttempted = 'facebook';
    window.location.href = `https://www.facebook.com/v3.2/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUrl}&response_type=token`;
  };

  const element = $('#login-form-button-facebook');

  // only if the element exists, set the login click handler for github.
  if (!utilities.isNil(element)) {
    element.addEventListener('click', facebookRedirectLoginHandler);
  }
}

/**
 * Sets up the Github redirection handler and click to properly authenticate with github via
 * redirection login.
 */

function setupGithubProviderAuthentication() {
  const clientId = document.head.querySelector('[name=github-signin-client_id]').content;
  const redirectUrl = 'http://localhost:8080/login';

  const githubRedirectLoginHandler = (event) => {
    event.preventDefault();

    localStorage.lastProviderAttempted = 'github';
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&type=user_agent&redirect_uri=${redirectUrl}`;
  };

  const element = $('#login-form-button-github');

  // only if the element exists, set the login click handler for github.
  if (!utilities.isNil(element)) {
    element.addEventListener('click', githubRedirectLoginHandler);
  }
}

/**
 * handles the redirection authentication for the last provided provider that was clicked for
 * authentication, otherwise continue as normal to the login page.
 */
async function handleRedirectionAuthentication() {
  const lastProviderAttempted = localStorage.lastProviderAttempted || '';
  const urlParams = new URLSearchParams(window.location.search);

  // remove the last provider before attempting, this will stop any issues that could occurs if any
  // of these handlers got stuck while attempting to validate authentication with a external
  // provider.
  localStorage.removeItem('lastProviderAttempted');

  // all cases will have to remove the full screen loading themselves, this is because we are never
  // really sure when its ready to remove the screen unless a authentication fails or could not go
  // through or nothing happened. Because we don't know if they are authenticated yet we don't want
  // the user thinking otherwise, so hiding the screen until then is important.
  switch (lastProviderAttempted.toLowerCase()) {
    case 'google':
      showSnack(`${login.lang.data.login.checkingReauth} Google`);
      // Google will do all the query adjustment directly themselves when the redirection comes in,
      // so we just need to validate for the google SDK to be completed loaded and then validate
      // that the user is signed in. (then we can authenticate as normal)
      gapi.load('auth2', async () => {
        gapi.auth2.getAuthInstance().isSignedIn.listen(async () => {
          const authResponse = gapi.auth2.getAuthInstance();

          if (!utilities.isNil(authResponse) && authResponse.isSignedIn.get()) {
            await authenticateGoogleUser(authResponse.currentUser.get());
          }

          utilities.removeFullScreenLoading();
        });
      });

      // this is because the google api could lock up and hold up when no user correctly
      // authenticated. So if its still not redirected the authentication token after 2 seconds then
      // we are just going to shift this full screen away, it probably failed.
      setTimeout(utilities.removeFullScreenLoading, 2000);
      break;
    case 'github':
      showSnack(`${login.lang.data.login.checkingReauth} Github`);
      // github authentication is simple, they will only return the oauth code which we can then use
      // to validate with the github server.
      await authenticateWithGithub(urlParams.get('code'));
      utilities.removeFullScreenLoading();
      break;
    case 'facebook':
      showSnack(`${login.lang.data.login.checkingReauth} Facebook`);

      const hash = new URLSearchParams(window.location.hash.substring(1));
      authenticateFacebookUser(hash.get('access_token'));
      utilities.removeFullScreenLoading();
      break;
    default:
      utilities.removeFullScreenLoading();
  }
}

/**
 * Shows the register form once the switch text has been clicked (hides login form).
 * @param event The on click event fired.
 */
function showRegisterForm(event) {
  event.preventDefault();

  const langLogin = login.lang.data.login;

  $('.login-header h2').textContent = langLogin.registerPage;

  $('#register-form').style.display = 'flex';
  $('#login-form').style.display = 'none';

  const context = $('#switch-context').firstElementChild.lastElementChild;
  context.removeEventListener('click', showRegisterForm);
  // eslint-disable-next-line no-use-before-define
  context.addEventListener('click', showLoginForm);
  context.textContent = langLogin.login;
}

/**
 * Shows the login form once the switch text has been clicked (hides register form).
 * @param event The on click event fired.
 */
function showLoginForm(event) {
  event.preventDefault();

  const langLogin = login.lang.data.login;

  $('.login-header h2').textContent = langLogin.loginPage;
  $('#register-form').style.display = 'none';
  $('#login-form').style.display = 'flex';

  const context = $('#switch-context').firstElementChild.lastElementChild;

  context.removeEventListener('click', showLoginForm);
  context.addEventListener('click', showRegisterForm);
  context.textContent = langLogin.register;
}

/**
 * Sets up the displaying text for the page, binding all the correct language values to the correct
 * div. supporting all languages currently setup at /api/v1.0/language/codes
 */
function updateDisplayingTextLanguage() {
  const langLogin = login.lang.data.login;
  const langGeneral = login.lang.data.general;
  const langNavigation = login.lang.data.navigation;

  // login
  $('#login-username').placeholder = langLogin.enterUsername;
  $('#login-password').placeholder = langLogin.enterPassword;

  const logins = document.querySelectorAll('.input-button.button-ripple');
  logins[0].textContent = langLogin.login;
  logins[2].textContent = `${langLogin.login} ${langGeneral.with} Google`;
  logins[3].textContent = `(dev) ${langLogin.login} ${langGeneral.with} Facebook`;
  logins[4].textContent = `${langLogin.login} ${langGeneral.with} Github`;

  // register
  $('#register-username').placeholder = langLogin.enterUsername;
  $('#register-password').placeholder = langLogin.enterPassword;
  $('#register-password-confirm').placeholder = langLogin.confirmPassword;
  $('#register-form-button').textContent = langLogin.register;

  // base
  const base = $('#switch-context');
  base.firstElementChild.firstElementChild.textContent = `${langGeneral.hi}! ${langLogin.doYou} `;
  base.firstElementChild.lastElementChild.textContent = langLogin.login;
  base.lastElementChild.firstElementChild.textContent = langGeneral.go;
  base.lastElementChild.lastElementChild.textContent = langNavigation.home;

  // top
  const top = $('#logged-in');
  top.firstElementChild.firstElementChild.textContent = `${langGeneral.welcomeBack}! `;
}

/**
 * Attempts to register the user with the form.
 * @param event The submit fired from the event.
 * @return {Promise<void>}
 */
async function registerUser(event) {
  try {
    event.preventDefault();
    showLoading('register-form');

    const langError = login.lang.data.errors;
    const langSuccess = login.lang.data.success;

    const usernameEl = $('#register-username');
    const passwordEl = $('#register-password');
    const passwordConfirmEl = $('#register-password-confirm');

    const username = usernameEl.value;
    const password = passwordEl.value;
    const passwordConfirm = passwordConfirmEl.value;

    passwordEl.value = '';
    passwordConfirmEl.value = '';

    if (username === '' || password === '' || passwordConfirm === '') {
      const errorMessage = langError.emptyUsernameAndPassword;
      return showRegisterError(new Error(errorMessage));
    }

    if (password !== passwordConfirm) {
      return showRegisterError(new Error(langError.nonMatchingPasswords));
    }

    await window.api.token.create(username, password);
    return showRegisterSuccess(langSuccess.userCreated.replace('{{ user }}', username));
  } catch (error) {
    return showRegisterError(error);
  }
}

/**
 * Sets up the login form with the required event listeners so that the user can authenticate correctly.
 */
async function setupLoginForm() {
  $('#login-username').addEventListener('input', removeErrorMessage);
  $('#login-password').addEventListener('input', removeErrorMessage);

  $('#register-username').addEventListener('input', removeErrorMessage);
  $('#register-password').addEventListener('input', removeErrorMessage);
  $('#register-password-confirm').addEventListener('input', removeErrorMessage);

  $('#login-form').addEventListener('submit', authenticateUser);
  $('#register-form').addEventListener('submit', registerUser);

  window.addEventListener('authentication-ready', alreadyLoggedIn);
  const register = new URL(window.location.href).searchParams.get('register');

  updateDisplayingTextLanguage();

  if (register != null && register.toLowerCase() === 'true') {
    showRegisterForm(new Event('setup'));
  } else {
    showLoginForm(new Event('setup'));
  }

  gapi.load('auth2', setupGoogleProviderAuthentication);
  await setupFacebookProviderAuthentication();
  setupGithubProviderAuthentication();
}

async function init() {
  try {
    login.lang = new LanguageController(window.api);
    await login.lang.initialize();

    await setupLoginForm();
    await handleRedirectionAuthentication();
  } catch (error) {
    utilities.displayImmutableErrorDisplay(error, login.lang, (content) => content.show());
  }
}

window.addEventListener('load', init);
