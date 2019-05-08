const { Router } = require('express');

const languageController = require('../controllers/language.controller');

// the language router will respond with basic information about the current supported language
// codes that the server and client is using. Additionally if the user provides a code then we will
// respond with all the translations for the given code for the platform.
const languageRouter = Router();

languageRouter.get('/codes', languageController.getLanguageOptions);
languageRouter.get('/codes/:code', languageController.getLanguageByCode);

module.exports = languageRouter;
