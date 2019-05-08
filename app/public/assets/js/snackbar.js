// short hand notation to stop repetitive verbose code to stay the same thing over and over again
// when interacting within the dom. Used to simplify code reading and code style + improve usage.
const $ = document.querySelector.bind(document);

const defaultOptions = {
  timeout: 5000,
  classes: ['snackbar-active']
};

/**
 * returns the current active container for the snacks, otherwise null if the snackbar container
 * does not exist.
 */
function getSnackbarContainer() {
  return $('#snackbar-container');
}

/**
 * Creates a snackbar container if one does not already exist.
 */
function createSnackbarContainer() {
  let container = getSnackbarContainer();
  if (container != null) return container;

  container = document.createElement('div');
  container.id = 'snackbar-container';

  document.body.appendChild(container);
  return container;
}

/**
 * Fills the snackbar div with the content required to have a valid snackbar.
 * @param {HTMLElement} snackbarElement The element that will be filled with the content.
 * @param {string} message The message that will be displayed.
 * @param {string} action The side action that will be displayed if set.
 * @param {Function} handler The handler used if a action is given.
 */
function fillSnackbar(snackbarElement, message, action, handler) {
  // push in the base html of the snack, this is just a message unless the action is set, then we
  // set a inner span which will be used for the action click section.
  snackbarElement.innerHTML = `<span>${message}</span>${
    action == null ? '' : ` <a class="snackbar-action">${action}</a>`
  }`;

  if (handler && $('.snackbar-action')) {
    // if the handler is set and we have the action span in place, then add the event listener.
    snackbarElement.querySelector('.snackbar-action').addEventListener('click', action);
  }

  // add the current class which is the active class, this allows to me pass in custom classes if i
  // need to later down the line. Otherwise defaults to the snack-active class.
  snackbarElement.classList.add('snackbar');
}

/**
 * Hides the snackbar element by adjusting css to transfer it out of the page.
 * @param {HTTPElement} snackbarElement The snackbar element
 * @param {object} options The options to use for the snackbar.
 */
function hideSnackbar(snackbarElement, options) {
  snackbarElement.classList.remove(options.class);

  setTimeout(() => {
    snackbarElement.style.transform = null;
    snackbarElement.style.opacity = '0';
  }, 150);
}

/**
 * Shows the snackbar element by adjusting the css to transfer it into the page.
 * @param {HTMLElement} snackbarElement The snackbar element to show.
 * @param {object} options The options to use for the snackbar.
 */
function showSnackbar(snackbarElement, options) {
  snackbarElement.classList.add(options.classes);

  setTimeout(() => {
    snackbarElement.style.transform = 'none';
  }, 150);

  setTimeout(() => {
    snackbarElement.style.opacity = '1';
  }, 200);
}

/**
 * Shows a given snack bar based on the message, action, handler function and additional options.
 * @param {string} message The message that is going to be shown on the bar.
 * @param {string} action The action so be shown. Can be null.
 * @param {function} handler The function click handler if the action is set.
 * @param {object} options The json object containing the options.
 */
export default function showSnack(message, action, handler = null, options = null) {
  const state = options == null ? defaultOptions : options;
  const container = getSnackbarContainer() || createSnackbarContainer();
  let snackbar = document.createElement('div');

  if (container.childElementCount > 0) {
    snackbar = container.insertBefore(snackbar, container.firstElementChild);
  } else {
    snackbar = container.appendChild(snackbar);
  }

  fillSnackbar(snackbar, message, action, handler);

  showSnackbar(snackbar, state);
  // sets the base css to bring in the snackbar.

  // setup the time outs to hide the snackbar and then follow up by removing it.
  setTimeout(hideSnackbar.bind(null, snackbar, state), state.timeout);
  setTimeout(() => snackbar.remove(), state.timeout + 400);
}
