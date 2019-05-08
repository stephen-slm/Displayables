const { env } = require('process');

const DIALECT = 'sqlite';

const LOCAL_CONFIGURATION = {
  DB: env.DB || './displayables-db.sqlite'
};

const PRODUCTION_CONFIGURATION = {
  DB: env.DB || './displayables-db-production.sqlite'
};

const config = {
  DATABASE: env.NODE_ENV === 'PRODUCTION' ? PRODUCTION_CONFIGURATION : LOCAL_CONFIGURATION,
  PORT_APP: 8080,
  SECRET: 'qK2+EFtRsRObp7dkjRo2l9NFdTYJYEewxMEJXDjuQ4hnk+h0jFpfqGLy'
};

module.exports = {
  DIALECT,
  config
};
