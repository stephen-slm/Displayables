const ifs = require('os').networkInterfaces();

/**
 * Gets all relevant network ip addresses from the interface cards.
 */
const networkIpAddress = Object.keys(ifs)
  .map((x) => ifs[x].filter((e) => e.family === 'IPv4' && !e.internal)[0])
  .filter((x) => x)[0].address;

module.exports = {
  networkIpAddress
};
