const {
  workstationRoute,
  globalWorkstationRoute,
  publicWorkstationsRoute
} = require('./workstations.router');

const { authenticationRoute, refreshRoute } = require('./authentication.router');
const { userSelfRoute, userCreateRoute } = require('./user.router');
const infrastructureRoute = require('./infrastructure.router');
const languagesRoute = require('./language.router');
const loggingRoute = require('./logging.router');
const weatherRoute = require('./weather.router');
const errorRoute = require('./error.router');
const newsRoute = require('./news.router');

/**
 * /register
 *
 * /login
 * /login?provider=google
 *
 * /login/refresh
 * /login/refresh?provider=google
 *
 * /users/self
 * /users/self/workstations
 * /users/self/workstations?statistics=true
 * /users/self/workstations/:workstationId
 * /users/self/workstations/:workstationId?fields=visible
 *
 *
 * /users/public/workstations
 *
 * /users/:username/workstations/:id
 *
 * /weather/:city
 * /weather/:city/:country
 *
 * /news/
 * /news/:country
 * /news/:country/:category
 *
 * /languages/
 * /languages/:languageCode/
 */

exports.Routes = [
  {
    handler: loggingRoute,
    version: '1.0',
    path: '/'
  },
  {
    handler: errorRoute,
    version: '1.0',
    path: '/'
  },
  {
    handler: userCreateRoute,
    version: '1.0',
    path: '/register'
  },
  {
    handler: authenticationRoute,
    version: '1.0',
    path: '/login'
  },
  {
    handler: refreshRoute,
    version: '1.0',
    path: '/login/refresh'
  },
  {
    handler: userSelfRoute,
    version: '1.0',
    path: '/users/self'
  },
  {
    handler: workstationRoute,
    version: '1.0',
    path: '/users/self'
  },
  {
    handler: globalWorkstationRoute,
    version: '1.0',
    path: '/users/public'
  },
  {
    handler: publicWorkstationsRoute,
    version: '1.0',
    path: '/users'
  },
  {
    handler: weatherRoute,
    version: '1.0',
    path: '/weather'
  },
  {
    handler: newsRoute,
    version: '1.0',
    path: '/news'
  },
  {
    handler: languagesRoute,
    version: '1.0',
    path: '/languages'
  },
  {
    handler: infrastructureRoute,
    version: '1.0',
    path: '/infrastructure'
  }
];
