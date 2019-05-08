const { Router } = require('express');

const infrastructureController = require('../controllers/infrastructure.controller');

// The infrastructure router will handle background requests for information that is related about
// the actual system. This will include a hello route (letting the user know that the server is up
// and running) and a version route (that will return the current server version and basic
// information).
const infrastructureRouter = Router();

infrastructureRouter.get('/hello', infrastructureController.hello);
infrastructureRouter.get('/version', infrastructureController.version);

module.exports = infrastructureRouter;
