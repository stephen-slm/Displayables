import * as utilities from './utilities.js';
import LanguageController from './languageController.js';

// short hand notation to stop repetitive verbose code to stay the same thing over and over again
// when interacting within the dom. Used to simplify code reading and code style + improve usage.
const $ = document.querySelector.bind(document);

const workstationBase = {
  // The Modular components that have been loaded into the page at run time. Each component when
  // created will be pushed here with a unique related id of it position on the page as a reference
  // point to access it.
  components: {},
  // If the user is a authenticated user or not, just used for minor messaging.
  authenticated: false,
  // The current workstation that was gathered based on the parameters.
  workstation: null,
  // The parameters that were gathered from the url in start up
  parameters: null,
  // The language controller for the page.
  lang: null,
  // The create update loop is a list of methods that will be called every 2 minutes that would
  // perform a update of selected content.
  updateLoop: [],
  // The create update loop will contain methods that want to access persisting data, this will be
  // stored here.
  updateLoopData: {}
};

/**
 * Loads a given script from a given path, this will append a .js appendix if no extension is set at
 * the time of calling.
 *
 * @param {string} path The complete path to the file from the root of the web server.
 * @returns A module of the related source.
 */
async function dynamicallyLoadScript(path) {
  return (await import(`${path}${path.endsWith('.js') ? '' : '.js'}`)).default;
}

/**
 * Starts calling all methods within the create update loop.
 * @param {number} timeInterval The timeout interval to be used.
 */
function startCreateUpdateLoop(timeInterval) {
  setInterval(async () => {
    workstationBase.updateLoop.forEach(async (func) => {
      await func();
    });
  }, timeInterval);
}

/**
 * goes through all the workstations, checking to see if a workstation could be expanded left or
 * right to fill partners if they are empty. Leaving no empty spots of the workstation if possible.
 * (if a row is missing a element, then it will remain empty).
 */
function expandWorkstationsIfPossible(configurations) {
  for (let index = 0; index < configurations.length; index += 1) {
    const configuration = configurations[index];
    const { position } = configuration;

    if (position % 2 === 0 || position === 0) {
      const partnerElement = configurations.filter((x) => x.position === position + 1);
      if (partnerElement.length === 0) configuration.position = `${position}${position + 1}`;
    } else {
      const partnerElement = configurations.filter((x) => x.position === position - 1);
      if (partnerElement.length === 0) configuration.position = `${position - 1}${position}`;
    }
  }
}

async function checkWorkstationConfigurationValidation(parameters) {
  const { username, id } = parameters;
  const { modified } = workstationBase.updateLoopData;

  const workstationModified = await window.api.workstations.getModifiedDateTimeByUsernameAndId(username, id);

  // check if we need to refresh the whole configuration page as the underlining configuration has
  // changed.
  if (modified < workstationModified.modified) {
    window.location.reload(true);
  }
}

/**
 * Displays a error message to the user that cannot be closed (navigate away)
 * @param {error} error The error message that will be displayed.
 */
function displayWorkstationError(error) {
  if (error.status == null) error.status = 400;

  const lang = workstationBase.lang.data;

  switch (error.status) {
    case 401:
    case 403:
      error.error = 'Ownership';
      error.description = lang.errors.ownership;
      break;
    default:
  }

  utilities.displayImmutableErrorDisplay(error, workstationBase.lang, (content) => {
    if (!workstationBase.authenticated) {
      content.template.querySelector('.immutable-error-go').innerHTML += ` ${
        lang.general.or
      } <a href="/login">${lang.login.login}</a>?`;
    }

    content.show();
  });
}

/**
 * Updates the server overlay with the workstation display name and the user name of the current
 * workstation, must make sure that the workstation is gathered (with the parameters user + id)
 */
function updateServerOverlay(display, username) {
  const serverOverlay = $('.server-overlay');

  if (!utilities.isNil(serverOverlay)) {
    serverOverlay.firstElementChild.textContent += `: ${display} - ${username}`;
  }
}

/**
 * Takes in a workstation configuration and adds it to the current page. This includes the loading
 * of the related component module.
 *
 * @param {object} configuration
 */
async function addWorkstationConfigurationToPage(configuration) {
  const classPosition = `pos-${configuration.position}`;
  const container = $('.workstation-positions-container');

  const configurationTemplate = $(`#template-${configuration.name}`);
  const configurationEl = configurationTemplate.cloneNode(true).content.firstElementChild;

  configurationEl.classList.add(classPosition);
  configurationEl.classList.add('positions');
  configurationEl.classList.add(configuration.name);

  // make sure to add the workstation configuration to the panel before we attempt to actually act
  // on the configuration.
  container.appendChild(configurationEl);
  const { configuration: config } = configuration;

  // reference points to its stored name and the expected stored location of the module file that
  // will be ported to get the service up and running.j
  const referenceName = `${configuration.name}-${classPosition}`;
  const path = `/assets/js/components/${configuration.name}`;

  // Binding related information to all modules allows them to stay simple and without requiring the
  // importing of any other related information, they all gain the same amount of data. This data
  // includes the language translations, related data, its name, utilities and the global api
  // controller.
  workstationBase.components[referenceName] = Object.assign(await dynamicallyLoadScript(path), {
    instance: workstationBase.updateLoopData,
    language: workstationBase.lang.data,
    name: configuration.name,
    api: window.api,
    _: utilities
  });

  const componentRef = workstationBase.components[referenceName];

  // if module has a refresh method setup and written then we want to push this on the update loop,
  // this loop will then trigger the refresh on the component based around a fixed timer.
  if (!utilities.isNil(workstationBase.components[referenceName].refresh)) {
    const refresh = componentRef.refresh.bind(componentRef, classPosition, config);
    workstationBase.updateLoop.push(refresh);
  }

  // trigger the start process of the component that we just loaded, this is a default point of
  // entry which all support, this process will configure and setup any related information that is
  // required to get it up and running.
  await componentRef.start(classPosition, config);
}

/**
 * Validates the parameters by gathering the workstation, otherwise errors.
 * @param {*} parameters The user and id from the url.
 */
async function buildAndDisplayWorkstation(parameters) {
  const workstation = await window.api.workstations.getByUsernameAndId(parameters.username, parameters.id);
  const restrictions = await window.api.workstations.restrictions();

  // Making sure to remove any workstation components that are outside the bounds of the
  // restrictions, this should never happen as its server validated before going into the database
  // but if a workstation does end up with more components, they will not be loaded
  if (workstation.configuration.length > restrictions.WORKSTATION_MAX_SIZE) {
    workstation.configuration.length = restrictions.WORKSTATION_MAX_SIZE;
  }

  // now set the related workstation, as this is a reference point for future updates.
  workstationBase.workstation = workstation;

  // when a workstation is not completely full, attempt to expand all related workstations to fill
  // there related partner spaces. Making sure that the display is using all space possible.
  expandWorkstationsIfPossible(workstation.configuration);

  // now go and dynamically load the components onto the screen.
  workstation.configuration.forEach(async (config, index) => {
    await addWorkstationConfigurationToPage(config, index);
  });

  // All though components will be the main users of the create update loop, we can push the
  // modifier checker, in which will validate that the workstation has not changed on the sever. If
  // it has changed then we will go and regather the new configuration and update the page.
  workstationBase.updateLoopData.modified = workstation.modified;
  workstationBase.updateLoop.push(checkWorkstationConfigurationValidation.bind(this, parameters));

  // update the server overlay displaying the related server version and information.
  updateServerOverlay(workstation.display, utilities.capitalize(parameters.username));
}

/**
 * Marks the current workstation as authenticated, this is used as a reference to display related
 * information when the workstation fails to load for any reason, letting the user go to management
 * or to the home/login page. This is here just to help with UI components.
 */
function markAsAuthenticated() {
  workstationBase.authenticated = true;
}

/**
 *  As soon as the API is ready we can create the language controller for displaying related
 *  information on the page. This uses the api controller for getting the related language
 *  information so its required for it to be ready first.
 */
function setupLanguageController() {
  workstationBase.lang = new LanguageController(window.api);
  workstationBase.lang.initialize().catch(displayWorkstationError);
}

/**
 * Attempts to gather the workstation by the user id and username provided.
 * 1. if public workstation will be returned.
 * 2. if not public but authenticated owner, workstation will be returned.
 * 3. if not public and not authenticated or authenticated as not owner, no workstation returned.
 */
async function initWorkstation() {
  try {
    // first gather and validate that we got some useful parameters from the URL, these parameters
    // are what are required to gather and get the related workstation, otherwise throw and display
    // this related error message.
    const parameters = utilities.getUrlParameters(['id', 'username'], workstationBase.lang);
    if (parameters.error) throw parameters.error;

    // set the parameters if they are fully valid, just incase we need to regather them later on.
    workstationBase.parameters = parameters.parameters;

    // lets go and build and display all the components, dynamically loading all the related modules
    // to keep the speed high, not loading in all the related components.
    await buildAndDisplayWorkstation(workstationBase.parameters);

    // start the update process, this will call into all related refresh methods on the modules if
    // they exist, if they don't exist on the module then they will not be called. A example of this
    // would be keeping the news relevant and up to date after iterating through all related news.
    startCreateUpdateLoop(1000 * 10);

    // go and remove the loading screen now as everything should be good to go.
    utilities.removeFullScreenLoading();
  } catch (error) {
    displayWorkstationError(error);
  }
}

// Due to the process that we do support that there exists public workstations we will allow for the
// creation process to start with authenticated or not authenticated. If the workstation is private
// and the user is not authenticated then the init process will throw a error and close down the
// process.
window.addEventListener('authentication-ready', initWorkstation);
window.addEventListener('authentication-failed', initWorkstation);

// As soon as the API is ready we can create the language controller for displaying related
// information on the page. This uses the api controller for getting the related language
// information so its required for it to be ready first.
window.addEventListener('api-ready', setupLanguageController);

// If we are authenticated then just mark that we are, just helps with creation of uni components on
// the page for later on, if and only if a error occurs.
window.addEventListener('authentication-ready', markAsAuthenticated);
