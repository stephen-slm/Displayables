const dotenv = require('dotenv');

dotenv.config();

const Connection = require('../app/services/Connection.service');

const UserRepository = require('../app/repository/user.repository');
const ComponentRepository = require('../app/repository/component.repository');
const ProviderRepository = require('../app/repository/provider.repository');
const WorkstationRepository = require('../app/repository/workstation.repository');

const logger = require('../app/libs/logger');
const { config } = require('../setup/config');

/**
 * Creates the provider table, used to reference where the user was created or how they are being
 * created. e.g via google or local.
 */
async function createProviderTable() {
  return new Promise((resolve, reject) => {
    Connection.schema
      .createTable('provider', (table) => {
        table.increments('provider_id').primary();
        table.string('provider_name').notNullable();
        table.dateTime(`created_datetime`).notNullable();
        table.dateTime(`modified_datetime`).notNullable();
      })
      .then(() => resolve())
      .catch((error) => reject(error));
  });
}

/**
 * Creates the users table in the database that will be used to
 * authenticate users who want to login to maintain the application.
 */
async function createUserTable() {
  return new Promise((resolve, reject) => {
    Connection.schema
      .createTable('user', (table) => {
        table.increments('user_id').primary();
        table
          .string('user_username')
          .notNullable()
          .unique();
        table.integer('user_provider_id').notNullable();
        table.string('user_name').notNullable();
        table.string('user_password').notNullable();
        table.string('user_salt').notNullable();
        table.dateTime(`created_datetime`).notNullable();
        table.dateTime(`modified_datetime`).notNullable();
        table.foreign('user_provider_id').references('provider.provider_id');
      })
      .then(() => resolve())
      .catch((error) => reject(error));
  });
}

/**
 * Creates the workstation table that will be used to store the configuration
 * around the placement and ordering of the workstation displays.
 */
async function createWorkstationTable() {
  return new Promise((resolve, reject) => {
    Connection.schema
      .createTable('workstation', (table) => {
        table.increments('workstation_id').primary();
        table.integer('workstation_user_id').notNullable();
        table.string('workstation_display').notNullable();
        table.boolean('workstation_visible').notNullable();
        table.json('workstation_configuration').notNullable();
        table.dateTime(`created_datetime`).notNullable();
        table.dateTime(`modified_datetime`).notNullable();
        table.foreign('workstation_user_id').references('user.user_id');
      })
      .then(() => resolve())
      .catch((error) => reject(error));
  });
}

async function createComponentTables() {
  return new Promise((resolve, reject) => {
    Connection.schema
      .createTable('component', (table) => {
        table.increments('component_id').primary();
        table
          .string('component_name')
          .notNullable()
          .unique();
        table.dateTime(`created_datetime`).notNullable();
        table.dateTime(`modified_datetime`).notNullable();
      })
      .then(() => {
        return Connection.schema.createTable('component_configuration', (table) => {
          table.increments('component_configuration_id').primary();
          table.string('component_configuration_name').notNullable();
          table.boolean('component_configuration_optional').notNullable();
          table.dateTime(`created_datetime`).notNullable();
          table.dateTime(`modified_datetime`).notNullable();
        });
      })
      .then(() => {
        return Connection.schema.createTable('component_has_configuration', (table) => {
          table.increments('component_has_configuration_id').primary();
          table.integer('component_id').notNullable();
          table.integer('component_configuration_id').notNullable();
          table.dateTime(`created_datetime`).notNullable();
          table.dateTime(`modified_datetime`).notNullable();
          table.foreign('component_id').references('component.component_id');
          table
            .foreign('component_configuration_id')
            .references('component_configuration.component_configuration_id');
        });
      })
      .then(() => resolve())
      .catch((error) => reject(error));
  });
}

/**
 * Sets up the database to be used for the application before the first startup, this
 * will go and create the database, the required tables and the required users to get
 * started with the application.
 */
async function SetupDatabase() {
  try {
    logger.info(`Initializing database ${config.DATABASE.DB}.`);

    if (!(await Connection.schema.hasTable('provider'))) {
      logger.info(`Creating table: provider`);
      await createProviderTable();

      logger.info('Adding default providers: local, google, facebook, github');
      ProviderRepository.createProviders('local', 'google', 'facebook', 'github');
    }

    if (!(await Connection.schema.hasTable('user'))) {
      logger.info(`Creating table: user`);
      await createUserTable();

      logger.info('Creating default example account, username="example", password="example"');

      await UserRepository.createUser('example', 'example', 'example');
    }

    if (!(await Connection.schema.hasTable('workstation'))) {
      logger.info(`Creating table: workstation`);
      const id = await UserRepository.userExistsById(1);
      await createWorkstationTable();

      logger.info(`Creating table: component, component_configuration, component_has_configuration`);
      await createComponentTables();

      // news
      await ComponentRepository.createComponentConfiguration('country', false);
      await ComponentRepository.createComponentConfiguration('category', true);
      await ComponentRepository.createComponent('news', ['country', 'category']);

      // weather
      await ComponentRepository.createComponentConfiguration('city', false);
      await ComponentRepository.createComponentConfiguration('code', true);
      await ComponentRepository.createComponent('weather', ['city', 'code']);

      // countdown
      await ComponentRepository.createComponentConfiguration('start_time', true);
      await ComponentRepository.createComponentConfiguration('start_date', true);
      await ComponentRepository.createComponentConfiguration('title', false);
      await ComponentRepository.createComponentConfiguration('end_date', false);
      await ComponentRepository.createComponentConfiguration('end_time', false);
      await ComponentRepository.createComponent('countdown', [
        'start_date',
        'start_time',
        'end_date',
        'end_time',
        'title'
      ]);

      // location
      await ComponentRepository.createComponentConfiguration('map', false);
      await ComponentRepository.createComponentConfiguration('show_pointer', false);
      await ComponentRepository.createComponentConfiguration('zoom', false);
      await ComponentRepository.createComponent('location', ['map', 'zoom', 'show_pointer']);

      // Video
      await ComponentRepository.createComponentConfiguration('video_src', false);
      await ComponentRepository.createComponentConfiguration('video_loop', true);
      await ComponentRepository.createComponentConfiguration('video_sound', true);
      await ComponentRepository.createComponent('video', ['video_src', 'video_loop', 'video_sound']);

      // Image
      await ComponentRepository.createComponentConfiguration('image_src', false);
      await ComponentRepository.createComponent('image', ['image_src']);

      logger.info(`Creating default workstation for user ${id}`);
      await WorkstationRepository.createDefaultWorkstationForUser(id);
    }

    logger.info(`Completed setup of DatabaseService.`);

    Connection.destroy();
  } catch (error) {
    Connection.destroy();
    throw error;
  }
}

module.exports = SetupDatabase;
