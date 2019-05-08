const knex = require('knex');
const { config, DIALECT } = require('../../setup/config');

const connection = knex({
  client: DIALECT,
  connection: {
    filename: config.DATABASE.DB
  },
  useNullAsDefault: true
});

module.exports = connection;
