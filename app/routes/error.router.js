const { Router } = require('express');
const errorController = require('../controllers/error.controller');

const errorRouter = Router();

errorRouter.use(errorController.handleError);

module.exports = errorRouter;
