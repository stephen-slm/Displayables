import * as utilities from './utilities.js';
import LanguageController from './languageController.js';

// short hand notation to stop repetitive verbose code to stay the same thing over and over again
// when interacting within the dom. Used to simplify code reading and code style + improve usage.
const $ = document.querySelector.bind(document);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const home = {
  lang: null
};

/**
 * Sets up the displaying text for the page, binding all the correct language values to the correct
 * div. supporting all languages currently setup at /api/v1.0/language/codes
 */
async function updateDisplayingTextLanguage() {
  home.lang = new LanguageController(window.api);
  await home.lang.initialize();

  const homeLang = home.lang.data.home;
  const homeLogin = home.lang.data.login;
  const homeEdit = home.lang.data.edit;

  $('.left-top span').textContent = homeLang.wow;

  $('.item.left h2').textContent = homeLang.information_now;
  $('.left-text').textContent = homeLang.description;

  $('#example-button').textContent = homeLang.view_example;
  $('#register-button').textContent = homeLogin.register;

  const firstHeader = $$('.left-subheader')[0];
  const secondHeader = $$('.left-subheader')[1];

  // view welcome back message.
  firstHeader.firstElementChild.textContent = homeLang.alreadyUsing;
  firstHeader.lastElementChild.textContent = homeLogin.login;

  // setup viewing public workstations pages.
  const subHeader = `${homeEdit.view} ${homeEdit.public} ${homeEdit.workstation}s?`;
  secondHeader.firstElementChild.textContent = subHeader;
  secondHeader.lastElementChild.textContent = homeEdit.public;
}

/**
 * Navigates to the example workstation page for the users on the homepage.
 * @param {event} event the event fired on the click.
 */
function viewExample(event) {
  event.preventDefault();
  window.location.href = `${window.location.origin}/workstation?username=example&id=1`;
}

/**
 * Pushes the user to the registering screen.
 * @param {event} event The event fired on click of register.
 */
function viewRegister(event) {
  event.preventDefault();
  window.location.href = `${window.location.origin}/login?register=true`;
}

/**
 * If the user is already logged in, we will adjust the displaying sub-header welcome text to welcome
 * the user back and ask if they want to go to the management page.
 */
async function alreadyLoggedIn() {
  setTimeout(async () => {
    const subheader = $('.left-subheader');

    const userInfo = await window.api.user.getUserInformation();
    const displayName = utilities.capitalize(userInfo.name);

    const welcome = home.lang.data.general.welcomeBack;
    const { management } = home.lang.data.navigation;
    const { goTo } = home.lang.data.general;

    subheader.innerHTML = `${welcome} ${displayName}! ${goTo} <a href='/management'>${management}</a>?`;
  }, 250);
}

async function init() {
  $('#example-button').addEventListener('click', viewExample);
  $('#register-button').addEventListener('click', viewRegister);

  await updateDisplayingTextLanguage();

  setTimeout(() => {
    $$('.row').forEach((row) => {
      row.style.opacity = '1';
    });
  }, 100);

  setTimeout(() => {
    $$('.left').forEach((row) => {
      row.style.opacity = '1';
    });
  }, 400);

  setTimeout(() => {
    $$('.right').forEach((row) => {
      row.style.opacity = '1';
    });
  }, 700);
}

window.addEventListener('load', init);
window.addEventListener('authentication-ready', alreadyLoggedIn);
