import Api from './api/index.js';
import * as utilities from './utilities.js';
import LanguageController from './languageController.js';

// short hand notation to stop repetitive verbose code to stay the same thing over and over again
// when interacting within the dom. Used to simplify code reading and code style + improve usage.
const $ = document.querySelector.bind(document);

const masterInstance = {
  /**
   * The loop that will be used to validate that the connection to the server is maintained, this is
   * going to be a interval that will be attempted to communicate with the server on a fixed
   * interval. If the communication was to drop for any given reason, the loop timeout will be reset
   * to 10 seconds, then 20, 30, and 60 until the communication has been completed adn reset back to
   * the default minute interval.
   */
  infrastructureLoop: null,
  /**
   * The time used in the infrastructure loop to maintain a connection to the server.
   */
  infrastructureLoopIntervalTime: 1000 * 60,
  /**
   * If the infrastructure interval has error's trying to keep a connection with the server.
   */
  infrastructureLoopErrored: false,
  /**
   * Once authentication has taken place, the refresh loop will act on a 90 minute interval loop to
   * maintain a authenticated token used to make requests to the user as the current authenticated
   * user.
   */
  refreshLoop: null,
  /**
   * The time used in the infrastructure loop to maintain a connection to the server.
   */
  refreshLoopIntervalTime: 1000 * 60 * 90
};

/**
 * Navigates to the login page based on the root of the origin of the site.
 */
function navigateToLoginPage() {
  window.location.href = `${window.location.origin}/login`;
}

/**
 * THe user has clicked the language swap and wants to change the language. If the user clicks the
 * same selected language then dont trigger a swap.
 * @param {event} event The click event fired on the click of the language.
 */
function swapLanguage(event) {
  let languageElement = event.target;

  if (utilities.isNil(languageElement.dataset.id)) {
    languageElement = event.target.parentElement;
  }

  const languageCode = languageElement.dataset.id;
  const languageSelector = $('.topnav-language');

  if (utilities.isNil(languageCode) || languageCode === localStorage.languageCode) return;

  localStorage.languageCode = languageCode;
  languageSelector.prepend(languageElement);

  // Due to generated changes, refreshing the page is the preferred way of adjustment.
  window.dispatchEvent(new CustomEvent('language-change', { detail: languageCode }));
  window.location.reload();
}

/**
 * Setting up clicking will cause a language swap based on the country code.
 */
function setupLanguageSwap() {
  const language = new LanguageController({});
  const currentLanguage = language.getCode();

  const languageSelector = $('.topnav-language');
  if (utilities.isNil(languageSelector) || utilities.isNil(currentLanguage)) return;

  let shiftingElement = null;

  for (let index = 0; index < languageSelector.childElementCount; index += 1) {
    const element = languageSelector.children[index];

    element.addEventListener('click', swapLanguage);

    if (currentLanguage === element.dataset.id) shiftingElement = element;
  }

  languageSelector.prepend(shiftingElement);
  languageSelector.style.visibility = 'visible';

  setTimeout(() => {
    languageSelector.style.opacity = '1';
  }, 400);
}

/**
 * Inserts a server overlay on the page so that the active user knows the current version.
 */
async function insertServerOverlay() {
  // not on the workstation page.
  if (window.location.pathname.includes('workstation')) return;

  const infraVersion = await window.api.infrastructure.version();
  const name = utilities.capitalize(infraVersion.name);

  const serverDiv = document.createElement('div');

  serverDiv.classList.add('server-overlay');
  serverDiv.innerHTML = `<div>${name}</div><div>v${infraVersion.version}</div>`;

  document.body.appendChild(serverDiv);
}

/**
 * Displays the disconnected message to the user.
 * @param error The error that occurred during the disconnection.
 */
function displayDisconnectedMessage() {
  const connectionStatus = $('.connection-status');

  if (utilities.isNil(connectionStatus)) {
    const connectionStatusDiv = document.createElement('div');
    connectionStatusDiv.classList.add('connection-status');

    connectionStatusDiv.innerHTML = `
    <div class="connection-banner">
        <span class="fa-stack">
            <i class="fas fa-wifi fa-stack-1x"></i>
            <i class="fas fa-slash fa-stack-1x"></i>
        </span>
        <span>Disconnected from the server.</span>
    </div>`;

    // bump language and mobile nav down.
    const topNavigation = $('.topnav-language');
    const navDropdown = $('.nav-dropdown');

    if (!utilities.isNil(topNavigation)) topNavigation.style.top = '45px';
    if (!utilities.isNil(navDropdown)) navDropdown.style.top = '60px';

    document.body.insertBefore(connectionStatusDiv, document.body.firstElementChild);
  }
}

/**
 * Removes the disconnected message from the display if it exists.
 * @param infraMessage The hello message returned by the server.
 */
function removeDisconnectedMessage(infraMessage) {
  const connectionStatus = $('.connection-status');

  if (connectionStatus != null && infraMessage.message.startsWith('hello')) {
    const connectionDisplays = connectionStatus.querySelectorAll('.connection-banner span');

    connectionStatus.style.background = 'var(--greendark)';
    connectionDisplays[1].textContent = 'Reconnected to the server.';
    connectionDisplays[0].lastElementChild.remove();

    setTimeout(() => {
      connectionStatus.style.background = 'none';
    }, 2800);

    setTimeout(() => {
      connectionStatus.remove();

      // bump language and mobile nav back into position.
      $('.topnav-language').style.top = null;
      $('.nav-dropdown').style.top = null;
    }, 3000);
  }
}

/**
 * Validates that the connection is maintained between the server and the client, otherwise lets the
 * user knows and attempted to reconnect back to the client on a interactive interval with a staging
 * interval.
 * @returns {Promise<number>} The new interval id.
 */
async function validateInfrastructureConnection() {
  try {
    const infraHello = await window.api.infrastructure.hello();
    removeDisconnectedMessage(infraHello);

    if (masterInstance.infrastructureLoopErrored || utilities.isNil(masterInstance.infrastructureLoop)) {
      masterInstance.infrastructureLoopIntervalTime = 1000 * 60;
      masterInstance.infrastructureLoopErrored = false;

      clearInterval(masterInstance.infrastructureLoop);
      masterInstance.infrastructureLoop = setInterval(
        validateInfrastructureConnection,
        masterInstance.infrastructureLoopIntervalTime
      );
    }
  } catch (error) {
    clearInterval(masterInstance.infrastructureLoop);
    displayDisconnectedMessage(error);

    let secondsInterval = masterInstance.infrastructureLoopIntervalTime / 1000;

    if (!masterInstance.infrastructureLoopErrored) {
      masterInstance.infrastructureLoopErrored = true;
      secondsInterval = 5;
    } else if (secondsInterval < 80) {
      secondsInterval *= 2;
    }

    masterInstance.infrastructureLoopIntervalTime = 1000 * secondsInterval;
    masterInstance.infrastructureLoop = setInterval(
      validateInfrastructureConnection,
      masterInstance.infrastructureLoopIntervalTime
    );
  }
}

/**
 * gets the current google authenticated users token from the google object and validates with the
 * server that the current authenticated token is still a valid token with google.
 */
async function validateLoggedInUserGoogle() {
  const clientId = document.head.querySelector('[name=google-signin-client_id]').content;

  await gapi.auth2.init({ client_id: clientId });

  const authInstance = gapi.auth2.getAuthInstance();
  const token = authInstance.currentUser.get().getAuthResponse().id_token;
  localStorage.token = token;

  await window.api.token.refresh('google');
  return token;
}

/**
 * Refreshes the users authentication token otherwise navigates back to the login page
 * if the status code returned is a 401 (unauthorized)
 */
async function refreshAuthenticatedUsersToken() {
  try {
    await window.api.token.refresh();
  } catch (error) {
    if (error.status === 401) navigateToLoginPage();
  }
}

/**
 * Validates that if the user is required to be authenticated  and they are not authenticated then
 * navigate them to the login page, otherwise start.
 * @return {Promise<boolean | string>}
 */
async function validateLoggedInUser() {
  try {
    let refreshToken = null;

    if (localStorage.provider === 'google') {
      refreshToken = await validateLoggedInUserGoogle();
    }

    if (localStorage.provider === 'local') {
      refreshToken = await window.api.token.refresh();
    }

    // create a new custom event that the core api and authenticated platforms will be listening
    // too, making sure that the user on the site is still authorized and not to redirect them away.
    const refreshEvent = new CustomEvent('authentication-ready', { detail: refreshToken });
    window.dispatchEvent(refreshEvent);
  } catch (error) {
    if (
      (error.status === 401 || utilities.isNil(error.status)) &&
      window.location.pathname !== '/' &&
      window.location.pathname !== '/login' &&
      window.location.pathname !== '/public' &&
      !window.location.pathname.includes('workstation')
    ) {
      navigateToLoginPage();
    }

    // The user is no longer authenticated and to let the rest of the application know. This will
    // generally lead to the current user being redirected away to the login or home page, as they
    // are no longer authenticated.
    const failedAuthEvent = new CustomEvent('authentication-failed', { detail: error });
    window.dispatchEvent(failedAuthEvent);
  }
}

/**
 * Creates the fresh loop for keeping the user authenticated every ten minutes.
 * When triggered the client will attempt to call down to the refresh token endpoint.
 */
function createAuthenticationRefreshLoop() {
  masterInstance.refreshLoop = setInterval(
    refreshAuthenticatedUsersToken,
    masterInstance.refreshLoopIntervalTime
  );
}

/**
 * This is used to handle special case error messages that could result in the user not having the
 * best expierences. This mainly at the momment focuses around dynamic importaing.
 * @param {error} error A error message that occured globally.
 */
async function onGlobalErrorMessage(error) {
  const errorMessage = error.message.replace(' ', '').toLowerCase();

  // the workstation page is using a special kind of method (dynamic import) to improve loading of the scripts, some
  // browsers do not suport this so we should redirect the user to the supported page. We would
  // recommend them to change the settings of firefox but this is not the best solution.
  if (errorMessage.includes('syntaxerror') && location.pathname === '/workstation') {
    location.href = `${window.location.origin}/old/workstation${window.location.search}`;
  }
}

/**
 * Build up the master api interface and let the rest of the platform know that the api is now ready
 * to use. Additionally setup the language swapping ability that is provided per page.
 */
async function init() {
  window.dispatchEvent(new CustomEvent('api-ready'));
  setupLanguageSwap();
}

window.api = new Api(`${window.location.origin}/api/v1.0`, localStorage.token);

window.addEventListener('load', init);
window.addEventListener('api-ready', validateInfrastructureConnection);
window.addEventListener('api-ready', validateLoggedInUser);
window.addEventListener('api-ready', insertServerOverlay);
window.addEventListener('authentication-ready', createAuthenticationRefreshLoop);
window.addEventListener('error', onGlobalErrorMessage);
document.addEventListener('touchstart', () => null);
