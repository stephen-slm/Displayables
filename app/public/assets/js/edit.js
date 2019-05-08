/* eslint-disable no-use-before-define */
import * as utilities from './utilities.js';
import PanelBuilder from './panelBuilder.js';
import LanguageController from './languageController.js';
import showSnack from './snackbar.js';

// short hand notation to stop repetitive verbose code to stay the same thing over and over again
// when interacting within the dom. Used to simplify code reading and code style + improve usage.
const $ = document.querySelector.bind(document);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

/**
 * Tracking information for the currently editing workstation, changes will edit this workstation to
 * allow for easy saving.
 */
const editing = {
  /**
   * The current workstation that is being edited.
   */
  workstation: null,
  /**
   * The language controller for the page.
   */
  lang: null
};

/**
 * Sets up the displaying text for the page, binding all the correct language values to the correct
 * div. supporting all languages currently setup at /api/v1.0/language/codes
 */
function updateDisplayingTextLanguage() {
  const nav = editing.lang.data.navigation;
  $('#public-home-button').lastElementChild.textContent = nav.home;
  $('#public-manage-button').lastElementChild.textContent = nav.management;
  $('#public-logout-button').lastElementChild.textContent = nav.logout;

  $('#public-home-top-button').lastElementChild.textContent = nav.home;
  $('#public-manage-top-button').lastElementChild.textContent = nav.management;
  $('#public-logout-top-button').lastElementChild.textContent = nav.logout;

  const lang = editing.lang.data.general;
  const { edit } = editing.lang.data;

  const buttons = $$('.view-workstation-button');

  buttons[0].firstElementChild.textContent = `${edit.private}:`;
  buttons[1].firstElementChild.pseudoStyle('before', 'content', `"${lang.yes} ${lang.no}"`);
  buttons[1].firstElementChild.pseudoStyle('before', 'word-spacing', `${lang.yes.length >= 3 ? 36 : 46}px`);
  buttons[2].firstElementChild.textContent = edit.view;

  $('#save-workstation-button').firstElementChild.textContent = edit.save;
  $('.core-title .nav-text').firstElementChild.textContent = `${edit.editing}:`;
}

/**
 * Sets up the navigation for the page.
 */
function setupNavigation() {
  $('.nav-dropdown').addEventListener('click', utilities.expandTopNavigation);

  // logout buttons
  $('#public-logout-top-button').addEventListener('click', utilities.logoutUser);
  $('#public-logout-button').addEventListener('click', utilities.logoutUser);
}

/**
 * Updates the title of the page.
 * @param {string} name the name to update it with.
 */
function updateDisplayName(name) {
  const title = $('.core-title .nav-text');
  title.lastElementChild.value = name;
}

/**
 * Updates the server overlay to include the workstation name,
 * @param {string} name the name of the workstation.
 */
function updateServerOverlay(name) {
  const serverOverlay = $('.server-overlay');

  if (!utilities.isNil(serverOverlay)) {
    serverOverlay.firstElementChild.textContent += ` (${editing.lang.data.edit.edit.toLowerCase()}): ${name}`;
  }
}

/**
 * Updates the count for a single option, can be called when you want to update a single option and
 * not all of them again.
 * @param {object} option The option being updated.
 */
function updateOptionChipCount(option) {
  const optionChip = $(`#option-${option.name}`);

  if (!utilities.isNil(optionChip)) {
    const { configuration } = editing.workstation;
    const amount = configuration.filter((x) => x.name === option.name).length;
    optionChip.lastElementChild.textContent = `x${amount}`;
  }
}

/**
 * Sets all the display information that require the username.
 * @param username The username to be displayed,
 */
function setDisplayNameInformation(username, workstationName) {
  const displayName = utilities.capitalize(username);

  const nameDisplays = $('.core-side-navigation-top');
  nameDisplays.firstElementChild.textContent = `${editing.lang.data.general.welcome} ${displayName}!`;
  nameDisplays.lastElementChild.textContent = `${editing.lang.data.edit.editing}: ${workstationName}`;
}

/**
 * Takes in a workstation configuration and adds it to the current page.
 * @param {object} configuration The workstation configuration.
 * @param {boolean} newItem If the configuration is a new item (dirty);
 */
function addWorkstationConfigToEditPage(configuration, newItem = false) {
  updateOptionChipCount(configuration);

  const classPosition = `pos-${configuration.position}`;

  const container = $('.workstation-positions-container');
  const missingContainer = $(`.${classPosition}`);

  if (missingContainer) missingContainer.remove();

  const configurationTemplate = $(`#template-card`);
  const configurationEl = configurationTemplate.cloneNode(true).content.firstElementChild;

  const contentTitle = configurationEl.querySelector('.card-title');
  contentTitle.textContent = editing.lang.data.components[configuration.name].name;

  const contentText = configurationEl.querySelector('.card-text');
  contentText.textContent = editing.lang.data.components[configuration.name].description;

  const generalLang = editing.lang.data.general;
  const buttons = configurationEl.querySelectorAll('.card-button');

  buttons[0].addEventListener('click', editComponent.bind(this, configuration, configuration.position));
  buttons[1].addEventListener('click', removeWorkstationConfiguration);
  buttons[1].addEventListener('click', () => {
    window.onbeforeunload = () => generalLang.onbeforeunload;
  });

  configurationEl.classList.add(classPosition);
  configurationEl.classList.add('positions');
  configurationEl.dataset.id = configuration.position;
  configurationEl.dataset.option = configuration.name;

  container.appendChild(configurationEl);

  // sometimes the method is called via a foreach, which means the new item could result in being a
  // index, we can avoid this my making sure its a type of boolean.
  if (typeof newItem === typeof true && newItem) {
    window.onbeforeunload = () => generalLang.onbeforeunload;
  }
}

/**
 * Creates a new configuration object that can be pushed onto a configuration array.
 * @param {object} option The option object that has the name, options and optional requirements.
 */
function createConfigurationOptionObject(option, position) {
  const configuration = { name: option.name, configuration: {}, position: Number(position) };

  option.configuration.forEach((configVal) => {
    configuration.configuration[configVal] = configVal;
  });

  return configuration;
}

/**
 * Adjusts the workstation private visibility based on the check status change of the switch.
 * @param {Event} event The event that was fired from a click of the check button.
 */
async function setWorkstationPrivateState(event) {
  try {
    await window.api.workstations.updateVisibility(editing.workstation.id, !event.target.checked);
    editing.workstation.visible = !event.target.checked;

    const { edit } = editing.lang.data;
    const message = `${edit.setVisible} ${!event.target.checked ? edit.public : edit.private}`;
    showSnack(message);
  } catch (error) {
    showSnack(error.description || error.message);
  }
}

/**
 * Saves the current workstation if the station is dirty or forced.
 */
async function saveCurrentWorkstation() {
  try {
    const { workstation } = editing;
    const { id, display, visible } = workstation;

    await window.api.workstations.updateById(id, workstation.configuration, display, visible);
    window.onbeforeunload = null;

    showSnack(`${editing.lang.data.success.savedWorkstation} ${display}`);
  } catch (error) {
    showSnack(error.description || error.message);
  }
}

/**
 * Gets the option icon for a given draggable option.
 * @param {string} optionName The name of the option.
 */
function getIconForOption(optionName) {
  switch (optionName) {
    case 'news':
      return 'fas fa-newspaper';
    case 'weather':
      return 'fas fa-sun';
    case 'countdown':
      return 'fas fa-sort-numeric-down';
    case 'location':
      return 'fas fa-location-arrow';
    case 'video':
      return 'fas fa-video';
    case 'image':
      return 'far fa-images';
    case 'save':
      return 'fas fa-save';
    default:
      return 'fas fa-ghost';
  }
}

/**
 * Adds the missing add button for components if required.
 */
function addMissingIfRequired() {
  const required = getMissingWorkstations();

  for (let index = 0; index < required.length; index += 1) {
    addWorkstationMissingToEditPage(required[index]);
  }
}

/**
 * Adds a option to the option panel for editing a workstation.
 * @param {object} optionToAdd the option configuration to be added.
 */
function addOptionChip(optionToAdd, index, draggable = true) {
  const workstationConfiguration = editing.workstation.configuration;
  const option = document.createElement('div');

  option.classList.add('chip');
  option.classList.add('elevation-one');

  option.draggable = draggable;
  option.dataset.id = index;
  option.id = `option-${optionToAdd.name}`;

  if (draggable) {
    option.addEventListener('dragstart', highlightDroppableZonesForOptions);
    option.addEventListener('dragend', removeHighlightedDroppableZonesForOptions);
  }

  option.addEventListener('click', AddComponentFromChipClick);

  const icon = document.createElement('i');
  const iconClasses = getIconForOption(optionToAdd.name).split(' ');
  iconClasses.forEach((item) => icon.classList.add(item));

  const count = document.createElement('div');
  const amount = workstationConfiguration.filter((x) => x.name === optionToAdd.name).length;
  count.textContent = `x${amount}`;

  const content = document.createElement('span');
  content.textContent = utilities.capitalize(editing.lang.data.components[optionToAdd.name].name);

  option.appendChild(icon);
  option.appendChild(content);
  option.appendChild(count);

  $('.core-header').firstElementChild.firstElementChild.appendChild(option);
  return option;
}

/**
 * Updates the current workstations display name when the input changes, this also causes the page
 * to message the user if they attempt to redirect before saving. Warning them that they might loose
 * there changes.
 *
 * @param {event} event The on name change event.
 */
function updateCurrentWorkstationDisplay(event) {
  editing.workstation.display = event.target.value.trim();
  window.onbeforeunload = () => editing.lang.data.general.onbeforeunload;
}

/**
 * Gets a workstation by its id and builds up the edit page to make changes to the workstation.
 * @param {*} username The username of the user.
 * @param {*} name The display name of the user.
 * @param {*} workstationId the id of the workstation being edited.
 */
async function buildEditPage(username, name, workstationId) {
  updateDisplayingTextLanguage();
  setupNavigation();

  const workstation = await window.api.workstations.getById(workstationId);
  const restrictions = await window.api.workstations.restrictions();

  updateDisplayName(workstation.display);
  updateServerOverlay(workstation.display);

  setDisplayNameInformation(name, workstation.display);

  // resize the configuration size if and only if it goes over the max limit of the given
  // workstations this is required otherwise it could lead to unwanted side effects of what is being
  // loaded onto the page.
  if (workstation.configuration.length > restrictions.WORKSTATION_MAX_SIZE) {
    workstation.configuration.length = restrictions.WORKSTATION_MAX_SIZE;
  }

  workstation.configuration.forEach(addWorkstationConfigToEditPage);

  editing.workstation = workstation;
  editing.components = restrictions.WORKSTATION_COMPONENTS;

  editing.components.forEach(addOptionChip);

  const buttons = $$('.view-workstation-button');

  // if the user was to click the view button, navigate them directly to the workstation page.
  const workstationPath = `${window.location.origin}/workstation?username=${username}&id=${workstationId}`;
  buttons[2].addEventListener('click', () => window.open(workstationPath, '_self'));

  // update the private switcher so the user can switch the visible state of the workstation to the
  // public user from within the edit page and not just on the home page.
  if (!workstation.visible) $('.toggle').click();
  buttons[1].addEventListener('click', setWorkstationPrivateState);

  // setup the on text change input for the workstation text, so when the text changes we will be
  // able update the local model and clicking save will update everything.
  $('#edit-title-button').addEventListener('input', updateCurrentWorkstationDisplay);

  // cause a save on click of the save button.
  $('#save-workstation-button').addEventListener('click', saveCurrentWorkstation);

  addMissingIfRequired();
  utilities.removeFullScreenLoading();
}

/**
 * When a option drag is started, we need to highlight the zones that the drag and drop can land.
 * @param {event} event The event fired on drag start of a option.
 */
function highlightDroppableZonesForOptions(event) {
  $$('.core-content-missing-edit').forEach((child) => {
    child.style.border = '1px dashed var(--blue)';
    child.style.background = 'var(--opacityblue)';
  });

  event.dataTransfer.setData('text/plain', event.target.dataset.id.toString());
  event.dropEffect = 'move';
}

/**
 * Whe the option is released, no matter what happened, remove the highlighted points.
 */
function removeHighlightedDroppableZonesForOptions() {
  $$('.core-content-missing-edit').forEach((child) => {
    child.style.border = null;
    child.style.background = null;
  });
}

/**
 * Handles the add click, gets all the values for a given component (making sure they are validated).
 * @param {PanelBuilder} panelBuilder The build for the given panel which the add button was clicked.
 * @param {boolean} prefixedPosition If we have prefixed the position or not (required for gathering the position properly).
 * @param {function} callback The fallback with the values.
 */
function handleBuilderAddClick(panelBuilder, prefixedPosition, callback) {
  const values = panelBuilder.getAllValues();

  // return early if values is null or undefined (this means validation failed).
  if (utilities.isNil(values)) return;

  if (!prefixedPosition || (prefixedPosition && !isNaN(Number(values.position)))) {
    callback(values);
  }

  panelBuilder.hide();
}

/**
 * const optionConfiguration = createConfigurationOptionObject(result, result.position);
 * @param {boolean} includeMissing If it should count the missing place holders as missing.
 */
function getMissingWorkstations(includeMissing = false) {
  const container = $('.workstation-positions-container');
  const required = [0, 1, 2, 3, 4, 5];

  for (let index = 0; index < container.childElementCount; index += 1) {
    const element = container.children[index];
    const className = element.classList[2][element.classList[2].length - 1];

    if (required.includes(Number(className)) && !(includeMissing && element.classList.contains('missing'))) {
      required.splice(required.indexOf(Number(className)), 1);
    }
  }

  return required;
}

/**
 * Sets the panel location properties as the current long and lat location so the user does not need
 * to enter that position.
 * @param {object} builder The panel builder that triggered the set.
 */
function setPanelCurrentLocation(builder) {
  if (utilities.isNil(navigator.geolocation)) {
    const message = editing.lang.data.errors.geolocation;
    const missingGeoError = new Error(message);

    showSnack(missingGeoError.description || missingGeoError.message);
    builder.hide();
  } else {
    navigator.geolocation.getCurrentPosition((position) => {
      builder.setMapValue('map', position.coords);
      builder.setInput('zoom', 10);
    });
  }
}

/**
 * Gets the base core panel builder for a selected component.
 * @param {string} component The component name that the data is being gathered for.
 * @param {boolean} prefixMissing If we are prefixing with a select position field.
 * @param {function} callback The callback function on clicking "add".
 */
function getPanelBuilderForComponent(component, prefixMissing, isEditing, callback) {
  const componentLang = editing.lang.data.components[component];
  const configLang = componentLang.configurations;
  const editLang = editing.lang.data.edit;

  const missing = getMissingWorkstations(true);

  const panelBuilder = new PanelBuilder(componentLang.name).addBody(componentLang.description).addFooter();

  if (prefixMissing) {
    const starter = missing.length === 0 ? editLang.noFree : null;

    missing.forEach((element, index) => {
      missing[index] = element + 1;
    });

    const positionLang = editing.lang.data.components.position;
    panelBuilder.addDropdown('position', positionLang.description, missing, starter, true, 'body');
  }

  switch (component) {
    case 'news':
      const cats = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];

      panelBuilder
        .addInput('country', configLang.country.description, 'GB', true)
        .addDropdown('category', configLang.category.description, cats);
      break;
    case 'weather':
      panelBuilder
        .addInput('city', configLang.city.description, 'Portsmouth', true)
        .addInput('code', configLang.code.description, 'GB');
      break;
    case 'countdown':
      panelBuilder
        .addInput('title', configLang.title.description, configLang.title.name, true)
        .addDateInput('start_date', configLang.start_date.description, null, null, true)
        .addTimeInput('start_time', configLang.start_time.description, true)
        .addDateInput('end_date', configLang.end_date.description, null, null, true)
        .addTimeInput('end_time', configLang.end_time.description, true);
      break;
    case 'location':
      panelBuilder
        .addMapInput('map', configLang.map.description, -1.068907, 50.810424)
        .addInputCounter('zoom', configLang.zoom.description, 1, 18, 10, true)
        .addCheck('show_pointer', configLang.show_pointer.name, configLang.show_pointer.description)
        .addButton(configLang.current_location, setPanelCurrentLocation.bind(this, panelBuilder));
      break;
    case 'video':
      panelBuilder
        .addInput('video_src', configLang.videoSource.description, 'www.example.com/video.mp4', true)
        .addCheck('video_loop', configLang.videoLoop.name, configLang.videoLoop.description)
        .addCheck('video_sound', configLang.videoSound.name, configLang.videoSound.description);
      break;
    case 'image':
      panelBuilder.addInput('image_src', configLang.imageSrc.description, 'www.example.com/cat.png', true);
      break;
    default:
  }

  // add the final cancel and add button to the page.
  panelBuilder.addCancelButton(editLang.cancel);

  if (missing.length !== 0 || isEditing) {
    panelBuilder.addButton(
      editLang.add,
      handleBuilderAddClick.bind(this, panelBuilder, prefixMissing, callback)
    );
  }

  return panelBuilder;
}

/**
 * Edits a given configuration that has already been placed on the board.
 * @param {object} component The component being edited.
 */
function editComponent(component) {
  const panelBuilder = getPanelBuilderForComponent(component.name, false, true, (result) => {
    const current = editing.workstation.configuration.find((e) => e.position === component.position);

    // take the newly updated configuration and update the component that will be saved to disk +
    // displayed. We only need to map to the existing configuration as this is the one that will be
    // referenced when updating / displaying. We don't need to recreate the object.
    Object.keys(result).forEach((key) => {
      if (key !== 'position') current.configuration[key] = result[key];
    });

    // replace the existing configuration on the page with the newly updated one. Its not
    // "technically" a new item but we need to mark it as a new item otherwise we will allow the user
    // to refresh the page without warning them that they might loose content. (requires a save).
    addWorkstationConfigToEditPage(current, true);
  });

  // take the existing configuration and replace all configurations on the panel builder with the
  // configuration values (these should map one to one, while the panel build will handle different
  // types (e.g boolean, dropdown))
  Object.keys(component.configuration).forEach((key) => {
    panelBuilder.setInput(key, component.configuration[key]);
  });

  // show the panel builder to allow the user to edit the existing component configuration.
  panelBuilder.show();
}

/**
 * Asks the user with a generated panel for the required information.
 * @param {string} component The component being gathered.
 * @param {boolean} selectPosition Should we ask for the position
 * @param {function} callback call back with the results of the input.
 */
function addComponentToPageWithConfigurations(component, selectPosition, callback) {
  const panelBuilder = getPanelBuilderForComponent(component.name, selectPosition, false, callback);
  panelBuilder.show();
}

/**
 * Asks the user for the required component information, and adds the information to the page.
 * @param {event} event The event fired on the click.
 */
function AddComponentFromChipClick(event) {
  let componentId = event.target.dataset.id;

  if (utilities.isNil(componentId)) {
    componentId = event.target.parentElement.dataset.id;
  }

  const component = editing.components[componentId];

  addComponentToPageWithConfigurations(component, true, (result) => {
    const optionConfiguration = createConfigurationOptionObject(component, result.position - 1);

    delete result.position;
    optionConfiguration.configuration = Object.assign(optionConfiguration.configuration, result);
    editing.workstation.configuration.push(optionConfiguration);

    addWorkstationConfigToEditPage(optionConfiguration, true);
    updateOptionChipCount(optionConfiguration);
  });
}

/**
 * Fires a event when the option is being dragged over a missing component.
 * @param {event} event The event fired on dragover.
 */
function draggingOverMissingComponent(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

/**
 * Fires a event when the option is being dropped onto a missing component. Asks the user for all
 * the required component information before adding it to the screen into its correct position.
 * @param {event} event The event fired on drop.
 */
function droppedOnMissingComponent(event) {
  event.preventDefault();
  const dataSetId = event.target.dataset.id || event.target.parentElement.dataset.id;
  const option = editing.components[event.dataTransfer.getData('text/plain')];
  const optionConfiguration = createConfigurationOptionObject(option, dataSetId);
  addComponentToPageWithConfigurations(option, false, (result) => {
    optionConfiguration.configuration = Object.assign(optionConfiguration.configuration, result);
    editing.workstation.configuration.push(optionConfiguration);
    addWorkstationConfigToEditPage(optionConfiguration, true);
    updateOptionChipCount(optionConfiguration);
  });
}

/**
 * Adds a missing component into the panel (allows dragging and dropping new components into it)
 * @param {string} position the position that its being placed into.
 */
function addWorkstationMissingToEditPage(position) {
  const classPosition = `pos-${position}`;

  const container = $('.workstation-positions-container');

  const configurationTemplate = $(`#template-missing`);
  const configurationEl = configurationTemplate.cloneNode(true).content.firstElementChild;

  const contentTitle = configurationEl.querySelector('.card-title');
  contentTitle.textContent = editing.lang.data.components.missing.name;

  const contentText = configurationEl.querySelector('.card-text');
  contentText.textContent = editing.lang.data.components.missing.description;

  configurationEl.classList.add(classPosition);
  configurationEl.classList.add('positions');
  configurationEl.classList.add('missing');

  configurationEl.dataset.id = position;
  configurationEl.droppable = true;

  configurationEl.addEventListener('drop', droppedOnMissingComponent);
  configurationEl.addEventListener('dragover', draggingOverMissingComponent);

  container.appendChild(configurationEl);
}

/**
 * Remove the workstation configuration on click (based on the click target) from the dit page.
 * @param {event} event Event fired on click of remove cross.
 */
function removeWorkstationConfiguration(event) {
  event.stopPropagation();

  let configurationToRemove = event.target.parentElement;

  if (utilities.isNil(configurationToRemove.dataset.id)) {
    configurationToRemove = event.target.parentElement.parentElement;
  }

  const position = Number(configurationToRemove.dataset.id);

  if (!utilities.isNil(configurationToRemove)) {
    const workingConfiguration = editing.workstation.configuration;
    const index = workingConfiguration.findIndex((x) => x.position === position);

    if (index >= 0) {
      editing.workstation.configuration.splice(index, 1);
      configurationToRemove.remove();

      updateOptionChipCount({ name: configurationToRemove.dataset.option });
      addWorkstationMissingToEditPage(position);
    }
  }
}

/**
 * Displays a immutable error on the page.
 * @param {error} error The error being displayed
 */
function displayEditError(error) {
  utilities.displayImmutableErrorDisplay(error, editing.lang, (content) => content.show());
}

/**
 * initialize everything required to edit a provided workstation.
 */
async function initEditWorkstation() {
  try {
    editing.lang = new LanguageController(window.api);
    await editing.lang.initialize();

    const { parameters, error } = utilities.getUrlParameters(['id'], editing.lang);
    if (error) throw error;

    const userInfo = await window.api.user.getUserInformation();

    await buildEditPage(userInfo.username, userInfo.name, parameters.id);
  } catch (error) {
    displayEditError(error);
  }
}

window.addEventListener('authentication-ready', initEditWorkstation);
