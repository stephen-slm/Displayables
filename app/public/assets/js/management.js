/* eslint-disable no-use-before-define */
import * as utilities from './utilities.js';
import LanguageController from './languageController.js';
import showSnack from './snackbar.js';

// short hand notation to stop repetitive verbose code to stay the same thing over and over again
// when interacting within the dom. Used to simplify code reading and code style + improve usage.
const $ = document.querySelector.bind(document);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

/**
 * Management state is used to validate the current page state the page is currently running in
 * when performing actions, a example would be reflecting the navigation to show what page state is
 * currently in use.
 */
const management = {
  state: {
    /**
     * If the page state is currently logging out.
     */
    LOGOUT: -1,
    /**
     * Unknown page state, will end up resulting back to the standard page.
     */
    UNKNOWN: 0,
    /**
     * All the current public workstations (globally);
     */
    ALL_PUBLIC: 1,
    /**
     * The page which only ever shows your current public layouts.
     */
    ALL_MY_PUBLIC: 2,
    /**
     * The support page layout of the application.
     */
    SUPPORT: 3,
    /**
     * The standard layout of the application, viewing all your workstations.
     */
    STANDARD: 4
  },
  /**
   * The language controller for the page.
   */
  lang: null
};

/**
 * Shows the error message on the home page, updating the display.
 * @param error The error message that was caused.
 */
function showHomeErrorMessage(error) {
  showSnack(error.description || error.message);
}

/**
 * Sets up the displaying text for the page, binding all the correct language values to the correct
 * div. supporting all languages currently setup at /api/v1.0/language/codes
 */
function updateDisplayingTextLanguage() {
  const nav = management.lang.data.navigation;
  $('#public-home-button').lastElementChild.textContent = nav.home;
  $('#public-layouts-button').lastElementChild.textContent = nav.allPublicLayouts;
  $('#all-my-layouts-button').lastElementChild.textContent = nav.allMyLayouts;
  $('#my-public-layouts-button').lastElementChild.textContent = nav.myPublicLayouts;
  $('#support-button').lastElementChild.textContent = nav.support;
  $('#logout-button').lastElementChild.textContent = nav.logout;

  $('#home-top-button').lastElementChild.textContent = nav.home;
  $('#public-layouts-top-button').lastElementChild.textContent = nav.allPublicLayouts;
  $('#all-my-layouts-top-button').lastElementChild.textContent = nav.allMyLayouts;
  $('#my-public-layouts-top-button').lastElementChild.textContent = nav.myPublicLayouts;
  $('#support-top-button').lastElementChild.textContent = nav.support;
  $('#logout-top-button').lastElementChild.textContent = nav.logout;

  const manage = management.lang.data.management;

  // top section
  const header = $('.core-header');

  header.firstElementChild.lastElementChild.firstElementChild.textContent = manage.numPublic;
  header.children[1].lastElementChild.firstElementChild.textContent = manage.numMyLayouts;
  header.lastElementChild.lastElementChild.firstElementChild.textContent = manage.numMyPublic;

  // templates
  const workstationTemplate = $('#workstation-info').content;
  workstationTemplate.firstElementChild.lastElementChild.textContent = manage.viewEditWorkstation;

  const supportTemplate = $('#workstation-support').content.firstElementChild;
  supportTemplate.firstElementChild.firstElementChild.textContent = manage.supportMessage;
  supportTemplate.firstElementChild.lastElementChild.textContent = manage.submitTicket;

  supportTemplate.querySelector('#support-title').placeholder = manage.supportTitle;
  supportTemplate.querySelector('#support-email').placeholder = manage.supportEmail;
  supportTemplate.querySelector('#support-body').placeholder = manage.supportBody;
}

/**
 * Resets the working area, any changes made to the style should be reset here for when switching the context.
 */
function resetWorkingArea() {
  const workingArea = $('#workstation-content');
  workingArea.innerHTML = '';
  workingArea.style = {};
}

/**
 * Submits the support ticket to a google form with pre-filled information.
 * @param event The event fired on the click.
 */
async function submitSupportTicket(event) {
  try {
    event.preventDefault();
    event.stopPropagation();

    const serverVersion = await window.api.infrastructure.version();

    const titleText = $('#support-title');
    const emailText = $('#support-email');
    const bodyText = $('#support-body');

    if (titleText.value === '' || bodyText.value === '' || emailText.value === '') {
      throw new Error(management.lang.data.management.supportNonEmpty);
    }

    const username = `entry.637563266=${utilities.parseJwt(localStorage.signedToken).name}`;
    const browser = `entry.1783974158=${window.navigator.userAgent}`;
    const version = `entry.1470507183=${serverVersion.version}`;
    const os = `entry.245553370=${window.navigator.platform}`;
    const email = `entry.1947894845=${emailText.value}`;
    const title = `entry.843493855=${titleText.value}`;
    const body = `entry.664859078=${bodyText.value}`;

    const form = 'https://docs.google.com/forms/d/e/1FAIpQLSeaaldKlr2aqJYqdDbO4u-v5jrwpWGtKDwiZp9Wywwhlz3rIA';
    const link = `${form}/viewform?usp=pp_url&${title}&${email}&${body}&${username}&${os}&${browser}&${version}`;

    titleText.value = '';
    bodyText.value = '';
    emailText.value = '';

    window.open(link, '_self');

    showSnack(management.lang.data.management.supportReply);
  } catch (error) {
    showSnack(error.description || error.message);
  }
}

/**
 * Loads the support screen into the page, allowing users to submit support related issues that can later be checked
 * up by the administrator and reviewed later on.
 */
function loadSupportScreen() {
  const workingArea = $('#workstation-content');
  workingArea.style.boxShadow =
    '0px 1px 3px 0px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.12)';
  workingArea.style.transition = 'all 0s ease 0s, opacity 400ms ease 0s, transform 400ms ease 0s';
  workingArea.style.gridTemplateColumns = 'auto';
  workingArea.style.background = 'white';
  workingArea.style.minHeight = '350px';
  workingArea.style.display = 'none';
  workingArea.style.opacity = '0';

  const supportTemplate = $('#workstation-support').content.cloneNode(true);
  workingArea.appendChild(supportTemplate);

  setTimeout(() => {
    workingArea.style.display = null;
  }, 300);

  setTimeout(() => {
    workingArea.style.opacity = '1';
  }, 400);

  $('#support-submit').addEventListener('click', submitSupportTicket);
  $('#workstation-support-form').addEventListener('submit', submitSupportTicket);
}

/**
 * Sets all the display information that require the username.
 * @param username The username to be displayed,
 */
function setDisplayNameInformation(username) {
  const displayName = localStorage.provider !== 'local' ? utilities.capitalize(username) : username;

  const nameDisplays = $('.core-side-navigation-top');
  const { welcome } = management.lang.data.general;

  nameDisplays.firstElementChild.textContent = `${welcome} ${displayName}!`;
  nameDisplays.lastElementChild.textContent = `(${localStorage.provider}) ${displayName}`;
}

/**
 * A simple context switch that will trigger the context switches by firing the click events on the
 * actual navigation, triggering a full context switch.
 * @param {management.state} context the context being switched too.
 */
function switchContextSimple(context, closeTopNavigation = false) {
  if (closeTopNavigation) {
    utilities.expandTopNavigation(new Event('click'));
  }

  switch (context) {
    case management.state.ALL_PUBLIC:
      $('#public-layouts-button').dispatchEvent(new Event('click'));
      break;
    case management.state.STANDARD:
      $('#all-my-layouts-button').dispatchEvent(new Event('click'));
      break;
    case management.state.ALL_MY_PUBLIC:
      $('#my-public-layouts-button').dispatchEvent(new Event('click'));
      break;
    case management.state.SUPPORT:
      $('#support-button').dispatchEvent(new Event('click'));
      break;
    case management.state.LOGOUT:
      $('#logout-button').dispatchEvent(new Event('click'));
      break;
    default:
      $('#all-my-layouts-button').dispatchEvent(new Event('click'));
  }
}

/**
 * Adds a single message to the workstations section of the home page. This can be used for a message related to
 * no workstations existing.
 * @param message The message that will be displayed.
 */
function addSimpleMessageToPage(message) {
  const workstationContent = $('#workstation-content');
  workstationContent.textContent = message;

  workstationContent.style.transition = 'all 0s ease 0s, opacity 400ms ease 0s, transform 400ms ease 0s';
  workstationContent.style.gridTemplateColumns = 'auto';
  workstationContent.style.display = 'none';
  workstationContent.style.opacity = '0';

  setTimeout(() => {
    workstationContent.style.display = null;
  }, 300);

  setTimeout(() => {
    workstationContent.style.opacity = '1';
  }, 400);
}

/**
 * Loads all the public workstations for all users into the work space.
 * updates the view message and the display name to be relevant to the owner of the workstation.
 */
async function loadAllPublicWorkstations() {
  try {
    const workstations = await window.api.workstations.getAllPublic();

    if (workstations.length <= 0) {
      addSimpleMessageToPage(management.lang.data.management.noPublic);
    }

    workstations.forEach((workstation, index) => {
      const addedStation = addWorkstationToPage(workstation, index);
      const workstationNameSel = addedStation.querySelector('.core-text');

      const buttons = addedStation.querySelectorAll('button');
      const bottomButton = buttons[buttons.length - 1];
      const topButton = buttons[0];

      buttons.forEach((button) => {
        button.removeEventListener('click', openWorkstationFromClick);
        button.removeEventListener('click', switchWorkstationVisibleClick);
      });

      topButton.style.cursor = 'default';
      topButton.firstElementChild.style.color = 'var(--gray)';

      bottomButton.addEventListener('click', (event) =>
        openWorkstationFromClick(event, workstation.username)
      );

      const editLang = management.lang.data.edit;

      workstationNameSel.textContent = `${workstation.name}'s - ${workstation.display}`;
      addedStation.lastElementChild.textContent = `${editLang.view} ${workstation.name.split(' ')[0]}'s ${
        editLang.workstation
      }`;

      // remove the delete button to stop the attempts to delete others workstations.
      addedStation.firstElementChild.firstElementChild.remove();
    });
  } catch (error) {
    showHomeErrorMessage(error);
  }
}

/**
 * Updates the displaying numeric information related around global and public workstations.
 * @param {object} numericInformation The object containing the user and global workstations information.
 */
function addWorkstationNumericInformationToPage(numericInformation) {
  const headerChildren = $$('.core-header-content');

  const globalPublic = headerChildren[0].querySelector('.core-text.core-number');
  const myTotal = headerChildren[1].querySelector('.core-text.core-number');
  const myPublic = headerChildren[2].querySelector('.core-text.core-number');
  const headerTotal = $('.core-sub-title-text');

  const totalLayoutsString = management.lang.data.management.totalLayouts;

  headerTotal.textContent = totalLayoutsString.replace('{{ number }}', numericInformation.user.total);
  globalPublic.textContent = numericInformation.global.public;
  myTotal.textContent = numericInformation.user.total;
  myPublic.textContent = numericInformation.user.public;
}

/**
 * Loads the numeric information of the user into the page about there workstations and the global workstations.
 */
async function loadWorkstationNumericInformation() {
  try {
    const numericInformation = await window.api.workstations.stats();
    addWorkstationNumericInformationToPage(numericInformation);
  } catch (error) {
    showHomeErrorMessage(error);
  }
}

/**
 * Opens the workstation, if name is set we are viewing, otherwise edit.
 * @param {event} event The click event fired.
 * @param {name} name
 */
function openWorkstationFromClick(event, name) {
  const { id } = event.target.parentElement.dataset;
  let link = `${window.location.origin}/workstation`;

  if (utilities.isNil(name)) {
    link += `/edit?id=${id}`;
  } else {
    link += `?id=${id}&username=${name}`;
  }

  window.open(link, '_self');
}

/**
 * Adds the workstation element if required.
 */
async function addAddWorkstationElementIfRequired() {
  const restrictions = await window.api.workstations.restrictions();
  const index = $('#workstation-content').childElementCount;
  const missingEl = $('.core-content-missing');

  if (index < restrictions.WORKSTATION_MAX_TOTAL && utilities.isNil(missingEl)) {
    const missingTemplate = $('#workstation-info-missing').content.cloneNode(true);
    $('#workstation-content').appendChild(missingTemplate);

    $('.core-content-missing').addEventListener('click', createNewWorkstationFromClick);
  }
}

/**
 * Deletes a workstation based on the click of the delete button.
 * @param event The event that is fired on click.
 * @param id The id that will be removed.
 */
async function deleteWorkstationFromClick(event) {
  try {
    event.preventDefault();

    const workstation = event.target.parentElement.parentElement.parentElement;
    const apiId = workstation.dataset.id;

    await window.api.workstations.delete(Number(apiId));

    event.target.removeEventListener('click', deleteWorkstationFromClick);
    workstation.style.opacity = '0';

    const display = workstation.querySelector('.core-text').textContent;
    const message = `${management.lang.data.success.deleteWorkstation} ${display}`;
    showSnack(message);

    setTimeout(async () => {
      workstation.remove();
      await addAddWorkstationElementIfRequired();
    }, 400);

    await loadWorkstationNumericInformation();
  } catch (error) {
    showHomeErrorMessage(error);
  }
}

/**
 * Switches the public state of the workstation.
 * @param {event} event The even fired on click.
 */
async function switchWorkstationVisibleClick(event) {
  try {
    event.preventDefault();

    let workstation = event.target.parentElement.parentElement;
    let icon = event.target.firstElementChild;

    if (utilities.isNil(workstation.dataset.id)) {
      workstation = workstation.parentElement;
      icon = event.target;
    }

    const apiId = Number(workstation.dataset.id);
    const visible = await window.api.workstations.getVisibility(apiId);

    await window.api.workstations.updateVisibility(apiId, !visible);
    await loadWorkstationNumericInformation();

    if (visible) {
      icon.classList.replace('fa-unlock', 'fa-lock');
      icon.style.color = 'var(--orange)';
    } else {
      icon.classList.replace('fa-lock', 'fa-unlock');
      icon.style.color = 'var(--greendark)';
    }
  } catch (error) {
    showHomeErrorMessage(error);
  }
}

/**
 * Adds the workstation into the display by copying a existing template
 * @param  {object} workstation The workstation to be used.
 * @param {number} delay The time display per add.
 * @param {bool} shouldRemoveDeleteButton If we should remove the delete button from the workstation.
 * @return {HTMLElement} The element that was created.
 */
function addWorkstationToPage(workstation, delay, shouldRemoveDeleteButton = false) {
  const template = $('#workstation-info');

  const station = template.content.cloneNode(true);
  const stationEl = station.firstElementChild;

  const iconArea = stationEl.querySelector('.top-link-logo i');
  const deleteArea = stationEl.querySelector('.fa-trash');
  const viewButton = stationEl.querySelector('.bottom-link');
  const textAreas = stationEl.querySelectorAll('.middle-link-col-text-going');
  const displayDate = new Date(workstation.created).toLocaleString([], { hour12: true });

  stationEl.querySelector('.core-text').textContent = workstation.display;
  stationEl.querySelector('.core-created').textContent = displayDate;

  stationEl.dataset.id = workstation.id;
  stationEl.classList.add('core-content-child-fadein');
  stationEl.id = `workstation-${workstation.id}`;

  const managementLang = management.lang.data.management;

  textAreas[0].textContent = `${workstation.configuration.length} ${managementLang.componentsUsed}`;
  textAreas[1].textContent = `${6 - workstation.configuration.length} ${managementLang.slotsPending}`;

  if (workstation.visible) {
    iconArea.style.color = 'var(--greendark)';
    iconArea.className = 'fas fa-unlock fa-2x';
  } else {
    iconArea.style.color = 'var(--orange)';
    iconArea.className = 'fas fa-lock fa-2x';
  }

  iconArea.parentElement.addEventListener('click', switchWorkstationVisibleClick);
  deleteArea.addEventListener('click', deleteWorkstationFromClick);
  viewButton.addEventListener('click', openWorkstationFromClick);

  if (6 - workstation.configuration.length === 0) textAreas[1].style.color = 'var(--greendark)';

  const addNewStationEl = $('.core-content-missing');

  if (addNewStationEl != null) {
    $('#workstation-content').insertBefore(station, addNewStationEl);
  } else {
    $('#workstation-content').appendChild(station);
  }

  // The delete button is best not to be shown on pages that is not directly related to only your
  // workstations, so all public and all my public workstations should generally not have a delete
  // button to not lead to confusion with the user.
  if (shouldRemoveDeleteButton) {
    stationEl.firstElementChild.firstElementChild.remove();
  }

  setTimeout(() => {
    stationEl.style.transform = 'translateX(0px) translateY(0px) translateZ(0px)';
    stationEl.style.opacity = '1';
  }, 200 * (delay + 1));

  return stationEl;
}

/**
 * Remove the workstation add element if required.
 */
async function removeAddWorkstationElementIfRequired() {
  const restrictions = await window.api.workstations.restrictions();

  const index = $('#workstation-content').childElementCount;
  const missingEl = $('.core-content-missing');

  if (index >= restrictions.WORKSTATION_MAX_TOTAL && missingEl != null) {
    $('.core-content-missing').remove();
  }
}

/**
 * Creates a new workstation with the provided information, using a empty workstation configuration.
 * @param {array} configuration The configuration of the workstation.
 * @param {string} display The display name of the workstation.
 * @param {boolean} visible If the workstation is public.
 */
async function createNewWorkstation(configuration, display, visible) {
  try {
    const { workstation: id } = await window.api.workstations.create(configuration, display, visible);
    const workstation = await window.api.workstations.getById(id);

    await removeAddWorkstationElementIfRequired();

    showSnack(`${management.lang.data.success.createdWorkstation} ${workstation.display}`);

    addWorkstationToPage(workstation, 1);
    await loadWorkstationNumericInformation();
  } catch (error) {
    showHomeErrorMessage(error);
  }
}

/**
 * Creates a new workstation based on a click of the add new workstation button.
 * @param event The event fired on the click.
 */
async function createNewWorkstationFromClick(event) {
  try {
    event.preventDefault();

    await createNewWorkstation(
      [{ name: 'weather', configuration: { city: 'London', code: 'gb' }, position: 1 }],
      `workstation-${Math.floor((1 + Math.random()) * 10000)
        .toString(16)
        .substring(1)}`,
      false
    );
  } catch (error) {
    showHomeErrorMessage(error);
  }
}

/**
 * Loads the workstation previous into the application for the user to see
 * basic information about there stations and options to go into it more.
 * @return {Promise<void>}
 */
async function loadAllMyWorkstations() {
  try {
    const workstations = await window.api.workstations.getAll();
    workstations.forEach((value, index) => addWorkstationToPage(value, index, false));
    await addAddWorkstationElementIfRequired();
  } catch (error) {
    showHomeErrorMessage(error);
  }
}

/**
 * Switches the users context of the home page between all the possible workstation stages. e.g switching between
 * viewing your personal workstations, to all public workstations or just your own personal public workstations.
 * @param event The event fired from the click.
 * @param context The context to switch too.
 * @param closeTopNavigation If we should close the top navigation
 */
async function switchContext(event, context, closeTopNavigation = false) {
  event.preventDefault();

  const selectedClassName = 'core-side-navigation-child-selected';
  const selectedClass = `.${selectedClassName}`;

  if (
    !event.target.classList.contains(selectedClassName) &&
    !event.target.parentElement.classList.contains(selectedClassName)
  ) {
    document.querySelectorAll(selectedClass).forEach((sel) => sel.classList.remove(selectedClassName));
    localStorage.setItem('managementState', context);

    resetWorkingArea();

    if (closeTopNavigation) {
      utilities.expandTopNavigation(new Event('click'));
    }

    const navigationLang = management.lang.data.navigation;

    switch (context) {
      case management.state.ALL_PUBLIC:
        $('#public-layouts-button').classList.add(selectedClassName);
        $('#public-layouts-top-button').classList.add(selectedClassName);
        $('.core-title').firstElementChild.textContent = navigationLang.allPublicLayouts;
        await loadAllPublicWorkstations();
        break;
      case management.state.STANDARD:
        $('#all-my-layouts-button').classList.add(selectedClassName);
        $('#all-my-layouts-top-button').classList.add(selectedClassName);
        $('.core-title').firstElementChild.textContent = navigationLang.allMyLayouts;
        await loadAllMyWorkstations();
        break;
      case management.state.ALL_MY_PUBLIC:
        $('#my-public-layouts-button').classList.add(selectedClassName);
        $('#my-public-layouts-top-button').classList.add(selectedClassName);
        $('.core-title').firstElementChild.textContent = navigationLang.myPublicLayouts;
        await loadAllMyPublicWorkstations();
        break;
      case management.state.SUPPORT:
        $('#support-button').classList.add(selectedClassName);
        $('#support-top-button').classList.add(selectedClassName);
        $('.core-title').firstElementChild.textContent = navigationLang.support;
        loadSupportScreen();
        break;
      case management.state.LOGOUT:
        $('.core-title').firstElementChild.textContent = navigationLang.logout;
        $('#logout-button').classList.add(selectedClassName);
        $('#logout-top-button').classList.add(selectedClassName);
        localStorage.setItem('management.state', management.state.STANDARD);
        break;
      default:
    }
  }
}

/**
 * sets up the navigation for context switching on the home page, adjusting the displayed components
 * and titles.
 */
function setupTopNavigationBinding() {
  $('.nav-dropdown').addEventListener('click', utilities.expandTopNavigation);

  $('#public-layouts-top-button').addEventListener('click', (event) =>
    switchContext(event, management.state.ALL_PUBLIC, true)
  );

  $('#all-my-layouts-top-button').addEventListener('click', (event) =>
    switchContext(event, management.state.STANDARD, true)
  );

  $('#my-public-layouts-top-button').addEventListener('click', (event) =>
    switchContext(event, management.state.ALL_MY_PUBLIC, true)
  );

  $('#support-top-button').addEventListener('click', (event) =>
    switchContext(event, management.state.SUPPORT, true)
  );

  $('#logout-top-button').addEventListener('click', utilities.logoutUser);
}

/**
 * sets up the navigation for context switching on the home page, adjusting the displayed components and titles.
 */
function setupSideNavigationBinding() {
  $('#public-layouts-button').addEventListener('click', (event) =>
    switchContext(event, management.state.ALL_PUBLIC)
  );

  $('#all-my-layouts-button').addEventListener('click', (event) =>
    switchContext(event, management.state.STANDARD)
  );

  $('#my-public-layouts-button').addEventListener('click', (event) =>
    switchContext(event, management.state.ALL_MY_PUBLIC)
  );

  $('#support-button').addEventListener('click', (event) => switchContext(event, management.state.SUPPORT));

  $('#logout-button').addEventListener('click', utilities.logoutUser);
}

/**
 * Setups both the top and side navigation for mobile / desktop
 */
function setupNavigation() {
  setupTopNavigationBinding();
  setupSideNavigationBinding();
}

/**
 * Loads all the public workstations for the authenticated user into the work space.
 */
async function loadAllMyPublicWorkstations() {
  try {
    const workstations = await window.api.workstations.getAllUserPublic();

    if (workstations.length <= 0) {
      addSimpleMessageToPage(management.lang.data.management.noMyPublic);
    }

    workstations.forEach((workstation, index) => addWorkstationToPage(workstation, index, true));
  } catch (error) {
    showHomeErrorMessage(error);
  }
}

/**
 * Initializes the home page with the authentication event which is
 * required to use the homepage.
 */
async function initAuthenticatedWorkstation() {
  try {
    management.lang = new LanguageController(window.api);
    await management.lang.initialize();

    updateDisplayingTextLanguage();

    await loadWorkstationNumericInformation();

    const userInfo = await window.api.user.getUserInformation();
    setDisplayNameInformation(userInfo.name);

    setupNavigation();
    switchContextSimple(Number(localStorage.managementState));

    utilities.removeFullScreenLoading();
  } catch (error) {
    utilities.displayImmutableErrorDisplay(error, management.lang, (content) => content.show());
  }
}

window.addEventListener('authentication-ready', initAuthenticatedWorkstation);
