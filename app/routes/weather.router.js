const { Router } = require('express');
const weatherController = require('../controllers/weather.controller');

// The weather router provides communication with the external new provider. Allowing to get the
// current weather for a given city with also the given country.
const weatherRouter = Router();

weatherRouter.get('/:city', weatherController.weatherByName);
weatherRouter.get('/:city/:country', weatherController.weatherByNameAndCode);

module.exports = weatherRouter;
