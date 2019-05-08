const { env } = require('process');
const dotenv = require('dotenv');

dotenv.config();

const LanguageService = require('./app/services/Language.service');
const { networkIpAddress } = require('./app/libs/utilities');
const Server = require('./app/services/Server.service');
const projectConfiguration = require('./package.json');
const logger = require('./app/libs/logger');
const { config } = require('./setup/config');

// We do need to initialize the language service prior to it being used, otherwise it will result in
// no language data being ready for sending to the client.
LanguageService.initialize();

const port = Number(env.PORT) || config.PORT_APP || 8080;
const applicationServer = new Server();

/**
 * Called when a error occurring within the http server.
 * @param {Error} error The error that occurred.
 */
const handleServerError = (error) => {
  logger.error(error);
};

/**
 * Called when the server starts properly listening, knowing we are fully operational.
 */
const handleListening = () => {
  logger.info(`initialized ${projectConfiguration.name}, version=v${projectConfiguration.version}`);
  logger.info(`http://localhost:${port}/ | http://${networkIpAddress}:${port}/ | process ${process.pid}`);
};

/**
 * Entry point, if parameters are used, then take up a parameters placement and shift the spread
 * operation right one, keeping the array still.
 * @param  {...any} params The parameters.
 */
const main = async () => {
  const server = await applicationServer.Start();

  server.listen(port);

  server.on('error', handleServerError);
  server.on('listening', handleListening);
};

main(...process.argv);
