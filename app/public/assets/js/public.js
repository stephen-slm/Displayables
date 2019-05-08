import Api from './api/index.js';
import * as utilities from './utilities.js';
import LanguageController from './languageController.js';

// short hand notation to stop repetitive verbose code to stay the same thing over and over again
// when interacting within the dom. Used to simplify code reading and code style + improve usage.
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const $ = document.querySelector.bind(document);

const publicBase = {
  language: null
};

/**
 * Adds a single message to the workstations section of the home page. This can be used for a
 * message related to no workstations existing.
 * @param message The message that will be displayed.
 */
function addSimpleMessageToPage(message) {
  const content = $('#workstation-content');
  content.textContent = message;

  content.style.transition = 'all 0s ease 0s, opacity 400ms ease 0s, transform 400ms ease 0s';
  content.style.gridTemplateColumns = 'auto';
  content.style.display = 'none';
  content.style.opacity = '0';

  setTimeout(() => {
    content.style.display = null;
  }, 300);

  setTimeout(() => {
    content.style.opacity = '1';
  }, 400);
}

/**
 * Filters a list of workstations based on the input of the given field.
 * @param {event} event The event fired from input
 */
function filterWorkstationsList(event) {
  const textValue = event.target.value.trim().toLowerCase();

  // filtering all displayed public workstations, gathering the related title for that workstation
  // and determined if a trimmed lowercase input value is within the trimmed lowercase workstation
  // title. If so show otherwise hide it.
  //
  // If in case the input text is blank or whitespace then we just show it.
  $$('.core-content-child').forEach((workstation) => {
    const workstationTitle = workstation.firstElementChild.children[1].textContent;
    const cleanTitle = workstationTitle.trim().toLowerCase();

    if (cleanTitle.includes(textValue) || textValue === '') {
      workstation.style.display = null;
    } else {
      workstation.style.display = 'none';
    }
  });
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
  const textAreas = stationEl.querySelectorAll('.middle-link-col-text-going');
  const displayDate = new Date(workstation.created).toLocaleString([], { hour12: true });

  stationEl.querySelector('.core-text').textContent = workstation.display;
  stationEl.querySelector('.core-created').textContent = displayDate;

  stationEl.dataset.id = workstation.id;
  stationEl.classList.add('core-content-child-fadein');
  stationEl.id = `workstation-${workstation.id}`;

  const managementLang = publicBase.language.data.management;

  textAreas[0].textContent = `${workstation.configuration.length} ${managementLang.componentsUsed}`;
  textAreas[1].textContent = `${6 - workstation.configuration.length} ${managementLang.slotsPending}`;

  if (workstation.visible) {
    iconArea.style.color = 'var(--greendark)';
    iconArea.className = 'fas fa-unlock fa-2x';
  } else {
    iconArea.style.color = 'var(--orange)';
    iconArea.className = 'fas fa-lock fa-2x';
  }

  if (6 - workstation.configuration.length === 0) textAreas[1].style.color = 'var(--greendark)';

  const addNewStationEl = document.querySelector('.core-content-missing');

  if (utilities.isNil(addNewStationEl)) {
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
 * Loads all the public workstations for all users into the work space.
 * updates the view message and the display name to be relevant to the owner of the workstation.
 */
async function loadAllPublicWorkstations() {
  const workstations = await window.api.workstations.getAllPublic();

  // if there are no public workstations then we can just display related message about there not
  // existing any public workstations at all.
  if (workstations.length <= 0) addSimpleMessageToPage(publicBase.language.data.management.noPublic);

  workstations.forEach((workstation, index) => {
    const addedStation = addWorkstationToPage(workstation, index);
    const workstationNameSel = addedStation.querySelector('.core-text');

    const buttons = addedStation.querySelectorAll('button');
    const bottomButton = buttons[buttons.length - 1];
    const topButton = buttons[0];

    topButton.style.cursor = 'default';
    topButton.firstElementChild.style.color = 'var(--gray)';

    bottomButton.addEventListener('click', (event) => openWorkstationFromClick(event, workstation.username));

    const editLang = publicBase.language.data.edit;

    workstationNameSel.textContent = `${workstation.name}'s - ${workstation.display}`;
    addedStation.lastElementChild.textContent = `${editLang.view} ${workstation.name.split(' ')[0]}'s ${
      editLang.workstation
    }`;

    // remove the delete button to stop the attempts to delete others workstations.
    addedStation.firstElementChild.firstElementChild.remove();
  });
}

async function init() {
  try {
    const endpoints = new Api(`${window.location.origin}/api/v1.0`, localStorage.token);

    // setup the local language controller that will be used to translate display related
    // information on the page.
    publicBase.language = new LanguageController(endpoints);
    await publicBase.language.initialize();

    // load all the current public workstations that are related to any public users workstations.
    await loadAllPublicWorkstations();

    // setup the filtering process for the input field on the given public workstations
    $('.core-filter').addEventListener('input', filterWorkstationsList);

    // when all is completed and no errors occurred then remove the current loading screen. If a
    // error does occurs this will be caught and display this on the current page.
    utilities.removeFullScreenLoading();
  } catch (error) {
    utilities.displayImmutableErrorDisplay(error, publicBase.language, (content) => {
      content.show();
    });
  }
}

window.addEventListener('load', init);
