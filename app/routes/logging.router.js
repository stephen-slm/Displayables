const { Router } = require('express');
const loggingController = require('../controllers/logging.controller');

// The logging router will handle the logging of all requests that hit the API, tagging the request
// with a unique id that can be used to track the request throughout the system. This will also log
// all routing and requests to disk (for future reference).
const loggingRouter = Router();

loggingRouter.use(loggingController.logRequestStart);

module.exports = loggingRouter;
