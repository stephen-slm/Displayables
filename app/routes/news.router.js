const { Router } = require('express');

const newsController = require('../controllers/news.controller');

// The news router provides communication with the external new provider. Allowing to get the
// current top news for a given country with also the given category. Requesting the root will just
// provide the basic information about what categories are possible.
const newsRouter = Router();

newsRouter.get('/:country', newsController.topNewsByCountryCode);
newsRouter.get('/:country/:category', newsController.topNewsByCountryCodeAndCategory);

module.exports = newsRouter;
