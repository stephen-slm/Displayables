const logger = require('../app/libs/logger');
const databaseSetup = require('./database');

/**
 * Entry point, if parameters are used, then take up a parameters placement and shift the spread
 * operation right one, keeping the array still.
 * @param  {...any} params The parameters.
 */
const main = () => {
  databaseSetup().catch((error) => logger.error(error));
};

main(...process.argv);
