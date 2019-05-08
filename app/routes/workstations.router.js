const { Router } = require('express');

const authenticationController = require('../controllers/authentication.controller');
const workstationController = require('../controllers/workstation.controller');

// The core workstation router which is focused around the current authenticated user. No other user
// but the current authenticated user will be able to get a respond from these routes. All the
// routes are only related to there account. (including updating, deleting and creating
// workstations)
const workstationRouter = Router();

workstationRouter.get(
  '/workstations',
  [authenticationController.checkAuthenticationToken],
  workstationController.getWorkstationsByUserId
);

workstationRouter.get(
  '/workstations/:workstationId',
  [authenticationController.checkAuthenticationToken, workstationController.validateWorkstationExistsById],
  workstationController.getWorkstationById
);

workstationRouter.patch(
  '/workstations/:workstationId',
  [
    authenticationController.checkAuthenticationToken,
    workstationController.validateWorkstationExistsById,
    workstationController.validateWorkstationDetails,
    workstationController.validateDisplayName
  ],
  workstationController.updateWorkstationById
);

workstationRouter.delete(
  '/workstations/:workstationId',
  [authenticationController.checkAuthenticationToken, workstationController.validateWorkstationExistsById],
  workstationController.deleteWorkstationById
);

workstationRouter.get(
  '/workstations/:workstationId/visible',
  [authenticationController.checkAuthenticationToken, workstationController.validateWorkstationExistsById],
  workstationController.getWorkstationVisibleById
);

workstationRouter.patch(
  '/workstations/:workstationId/visible',
  [authenticationController.checkAuthenticationToken, workstationController.validateWorkstationExistsById],
  workstationController.updateWorkstationVisibleById
);

workstationRouter.post(
  '/workstations/',
  [
    authenticationController.checkAuthenticationToken,
    workstationController.validateRoomForWorkstation,
    workstationController.validateWorkstationDetails,
    workstationController.validateDisplayName
  ],
  workstationController.createNewWorkstation
);

// The global workstations router will handle routing for all workstations, not just a single user,
// this will be for gathering all public workstations, gathering the global workstation restrictions
// and getting a single workstation for a single user (if that workstation is a public workstation).
const globalWorkstationRouter = Router();

// Get the workstation restrictions, these are the global limits which are applied to all users. If
// they try to do more than the restrictions then they will be rejected. This route is offered so ui
// elements can perform better user experience by applying these limit to input fields.
globalWorkstationRouter.get('/workstations/restrictions', workstationController.getWorkstationRestrictions);

// Get all the public workstations, which can allow users to search through and find the public
// workstations they are interested in looking at. No authentication for public workstations.
globalWorkstationRouter.get('/workstations', workstationController.getAllPublicWorkstations);

const publicWorkstationsRouter = Router();

// Get a public workstation for a single given user, used for when a user would want to link
// directly to a single workstation that is public. Sharing it with other users of the system.
publicWorkstationsRouter.get(
  '/:username/workstations/:workstationId',
  [
    workstationController.validateWorkstationExistsByUser,
    workstationController.validateWorkstationPublicByUser,
    workstationController.getWorkstationByUserIfPublic,
    authenticationController.checkAuthenticationToken,
    workstationController.validateWorkstationExistsById
  ],
  workstationController.getWorkstationById
);

module.exports = {
  workstationRoute: workstationRouter,
  globalWorkstationRoute: globalWorkstationRouter,
  publicWorkstationsRoute: publicWorkstationsRouter
};
