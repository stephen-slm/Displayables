const asynchronousUtils = require('../libs/asynchronous');
const BaseRepository = require('./Base.repository');
const Connection = require('../services/Connection.service');

module.exports = class ProviderRepository extends BaseRepository {
  /**
   * Gets the providers id by the name.
   * @param {string} name The name of the provider.
   */
  static async getProviderIdByName(name) {
    const exists = await ProviderRepository.itemExists('provider', 'provider_id', 'provider_name', name);
    if (exists) return exists.exists;

    throw new Error(`No provider exists by the name ${name}`);
  }

  /**
   * Adds a new provider to the database.
   * @param {string} provider The provider being inserted.
   */
  static async createProvider(provider) {
    return Connection('provider').insert({
      provider_name: provider,
      created_datetime: new Date(),
      modified_datetime: new Date()
    });
  }

  /**
   * Adds a range of providers to the service.
   * @param  {...any} providers The providers to be added.
   */
  static async createProviders(...providers) {
    asynchronousUtils.asyncForEach(providers, async (provider) => {
      await this.createProvider(provider);
    });
  }
};
