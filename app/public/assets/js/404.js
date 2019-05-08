import Api from './api/index.js';
import * as utilities from './utilities.js';
import LanguageController from './languageController.js';

// short hand notation to stop repetitive verbose code to stay the same thing over and over again
// when interacting within the dom. Used to simplify code reading and code style + improve usage.
const $ = document.querySelector.bind(document);

async function init() {
  const endpoints = new Api(`${window.location.origin}/api/v1.0`, localStorage.token);
  $('#missing-path').textContent = window.location.href;

  const language = new LanguageController(endpoints);
  await language.initialize();

  $('h2').textContent = language.data.pageNotFound.notFound;
  $('p').textContent = language.data.pageNotFound.missing;
  $('div span').textContent = language.data.general.go;
  $('div a').textContent = language.data.navigation.home;

  utilities.removeFullScreenLoading();
}

window.addEventListener('load', init);
