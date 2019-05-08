const { Router } = require('express');

const authenticationController = require('../controllers/authentication.controller');
const databaseController = require('../controllers/database.controller');

// The router that will be handling all the users who are authenticating, this is the same for users
// who are authenticating with external systems and not directly with the platform. If they are not
// authenticating with the local platform, they will have to provide the provider tag (otherwise it
// will default to the local platform).
const authenticationRouter = Router();

authenticationRouter.post(
  '/',
  [authenticationController.validateAuthenticationDetails, databaseController.validateUsernameDoesExist],
  authenticationController.authenticateLoggingInUser
);

// The router that will handle all related information for a refreshing user, this is someone who is
// looking to refresh there current authentication token. They are already authenticated and using
// the system. (generally this is going to happen in the background to make sure there token does
// not time out and auto log them out)
const refreshRouter = Router();

refreshRouter.post('/', authenticationController.refreshAuthenticationToken);

module.exports = {
  authenticationRoute: authenticationRouter,
  refreshRoute: refreshRouter
};
