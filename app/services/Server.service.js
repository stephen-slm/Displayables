const GoogleAuth = require('simple-google-openid');
const Ratelimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const http = require('http');

const errorController = require('../controllers/error.controller');
const filesRouter = require('../routes/files.router');
const Connection = require('./Connection.service');
const logger = require('../libs/logger');
const { Routes } = require('../routes');

module.exports = class ServerService {
  constructor() {
    // the running express server.
    this.app = express();

    // the running http server.
    this.server = http.createServer(this.app);
  }

  /**
   * Make the connection to the server based on the singleton connection object from the connection
   * database. We then attempt to sync the connection with the database models.
   */
  static async ConnectToDatabase() {
    try {
      await Connection.raw('select 1+1 as answer');
    } catch (error) {
      logger.error(`Failed to connect to database, ${error}`);
    }
  }

  /**
   * Starts the server up and running, configuring express and the router, after connecting the
   * database.
   */
  async Start() {
    await ServerService.ConnectToDatabase();
    this.ExpressConfiguration();
    this.ConfigurationRouter();
    return this.server;
  }

  /**
   * Setup the express configurations, setting up the body parser. logging and cors. Sets a base
   * limit of 1mb of data for the adding / inserting of json body content.
   */
  ExpressConfiguration() {
    this.app.use(GoogleAuth(process.env.GOOGLE_ID));
    this.app.use(new Ratelimit({ max: 100, windowMs: 1000 }));
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json({ limit: '1mb' }));
    this.app.use(cors());
  }

  /**
   * Configure and add all the routes to express, making sure that they are on the correct endpoints
   * paths, middleware and handler. This also includes the endpoint version.
   */
  ConfigurationRouter() {
    const router = express.Router();

    // build up a router containing all the routes and information for the request, making sure that
    // we apply the path and the version.
    Routes.forEach((route) => {
      router.use(`/v${route.version}${route.path}`, route.handler);
    });

    // bind the router of all the routes and finally the missing handle, which will catch all routes
    // missed. Just allows for quick responses and makes the server feel like its not hanging.
    this.app.use('/api', router);
    this.app.use('/', filesRouter);

    // catch all errors
    this.app.use(errorController.handleError);
  }
};
