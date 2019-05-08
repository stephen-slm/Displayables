const { Router } = require('express');

const authenticationController = require('../controllers/authentication.controller');
const databaseController = require('../controllers/database.controller');
const userController = require('../controllers/user.controller');

// A single route that will handle the validation of the single user and sending back basic
// information for the given user. Will never respond with information that is not about the current
// authenticated user.
const selfRouter = Router();

selfRouter.get('/', [authenticationController.checkAuthenticationToken], userController.sendBasicUserInfo);

// A single route to handle the creation of a new user. Validation of all the details provided by
// the given user, making sure that they do not already exist (also that they are not using
// restricted usernames).
const createRouter = Router();

createRouter.post(
  '/',
  [
    authenticationController.markAsLocalProvider,
    authenticationController.validateAuthenticationDetails,
    databaseController.validateUsernameDoesNotExist,
    userController.validateUsernameRestrictions
  ],
  userController.createNewUser
);

module.exports = {
  userSelfRoute: selfRouter,
  userCreateRoute: createRouter
};
