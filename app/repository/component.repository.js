const _ = require('lodash');

const asynchronousUtils = require('../libs/asynchronous');
const BaseRepository = require('./Base.repository');
const Connection = require('../services/Connection.service');

module.exports = class ComponentRepository extends BaseRepository {
  /**
   * Creates a new component in the database that will be used to validate
   * that the workstation configuration is correct.
   * @param {string} name The name of the component.
   * @param {array} options A array of component configurations names.
   */
  static async createComponent(name, options) {
    const componentId = await Connection('component').insert({
      component_name: name,
      created_datetime: new Date(),
      modified_datetime: new Date()
    });

    await asynchronousUtils.asyncForEach(options, async (option) => {
      const componentConfigurationId = await this.getComponentConfigurationIdByName(option);

      await Connection('component_has_configuration').insert({
        component_id: componentId[0],
        component_configuration_id: componentConfigurationId,
        created_datetime: new Date(),
        modified_datetime: new Date()
      });
    });

    return Promise.resolve();
  }

  /**
   * Creates a new component configuration that can be used in the configuring of components.
   * @param {string} name The name of the configuration.
   * @param {boolean} optional If its optional or not.
   */
  static async createComponentConfiguration(name, optional) {
    const componentConfig = await Connection('component_configuration').insert({
      component_configuration_name: name,
      component_configuration_optional: optional,
      created_datetime: new Date(),
      modified_datetime: new Date()
    });

    return componentConfig[0];
  }

  /**
   * Gets the id of the component by the name.
   * @param name The name of the component to get the name by.
   */
  static async getComponentConfigurationIdByName(name) {
    const componentConfiguration = await Connection('component_configuration')
      .select('component_configuration_id as id')
      .where('component_configuration_name', name)
      .first();

    return componentConfiguration.id;
  }

  static async getAllComponentsAndDetails() {
    const componentsArray = _.map(await Connection('component').select('component_name'), (item) => {
      return {
        name: item.component_name,
        configuration: [],
        optional: []
      };
    });

    const componentsDetails = await Connection('component_has_configuration')
      .select(
        'component.component_name as component',
        'configuration.component_configuration_name as name',
        'configuration.component_configuration_optional as optional'
      )
      .join('component as component', 'component_has_configuration.component_id', 'component.component_id')
      .join(
        'component_configuration as configuration',
        'component_has_configuration.component_configuration_id',
        'configuration.component_configuration_id'
      );

    _.forEach(componentsDetails, (details) => {
      const index = _.findIndex(componentsArray, (item) => item.name === details.component);

      if (!_.isNil(index)) {
        componentsArray[index].configuration.push(details.name);
        if (details.optional) componentsArray[index].optional.push(details.name);
      }
    });

    return componentsArray;
  }
};
