import Endpoint from '../endpoint.js';

export default class Workstations extends Endpoint {
  /**
   * Creates a new instance o the Workstations class.
   * @param {string} apiUri The root url of the endpoint being called.
   * @param {string} path Any additional appended path (e.g /users)
   */
  constructor(apiUri, path) {
    super(apiUri, path);

    this.userPath = `${this.path}users/self/workstations`;
    this.globalPath = `${this.path}users/public/workstations`;
  }

  /**
   * Gets all the workstations for the user.
   */
  async getAll() {
    const options = Endpoint.buildOptions(this.apiUrl, `${this.userPath}/`, 'get', {});
    return Endpoint.apiCall(options);
  }

  /**
   * Gets all the public workstations for the authenticated user.
   */
  async getAllUserPublic() {
    const options = Endpoint.buildOptions(this.apiUrl, `${this.userPath}/?public=true`, 'get', {});
    return Endpoint.apiCall(options);
  }

  /**
   * Gather a workstation by id.
   * @param {number} id The id of the workstation to gather.
   */
  async getById(id) {
    const options = Endpoint.buildOptions(this.apiUrl, `${this.userPath}/${id}`, 'get', {});
    return Endpoint.apiCall(options);
  }

  /**
   * Gets a workstations visibility.
   * @param {string} workstationId The workstation id.
   */
  async getVisibility(id) {
    const options = Endpoint.buildOptions(this.apiUrl, `${this.userPath}/${id}/visible`, 'get', {});
    const visible = await Endpoint.apiCall(options);
    return visible.visible;
  }

  /**
   * updates a workstations visibility.
   * @param {string} workstationId The workstation id.
   */
  async updateVisibility(id, visible) {
    const options = Endpoint.buildOptions(this.apiUrl, `${this.userPath}/${id}/visible`, 'patch', {
      visible
    });
    return Endpoint.apiCall(options);
  }

  /**
   * Updates (replaces) the workstation by id.
   * @param {number} id The id of the workstation to update.
   * @param {object} workstation The workstation array being updated
   * @param {string} display The display name being shown for the workstation.
   * @param {boolean} visible If it should be publicly displayed or not.
   */
  async updateById(id, configuration, display, visible) {
    const options = Endpoint.buildOptions(this.apiUrl, `${this.userPath}/${id}`, 'patch', {
      display,
      configuration,
      visible: Boolean(visible)
    });
    return Endpoint.apiCall(options);
  }

  /**
   * Creates a new workstation.
   * @param {object} configuration The configuration array.
   * @param {string} display The display name of the configuration.
   * @param {boolean} visible If it should be publicly displayed or not.
   */
  async create(configuration, display, visible) {
    const options = Endpoint.buildOptions(this.apiUrl, `${this.userPath}/`, 'post', {
      display,
      configuration,
      visible: Boolean(visible)
    });
    return Endpoint.apiCall(options);
  }

  /**
   * Deletes a workstation
   * @param {number} id The id of the workstation being deleted.
   */
  async delete(id) {
    const options = Endpoint.buildOptions(this.apiUrl, `${this.userPath}/${id}`, 'delete', {});
    return Endpoint.apiCall(options);
  }

  /**
   * Gets all the information about general numeric information about the users workstations and the global workstations.
   * This will include the global public workstations, users workstations (public and private count)
   * @returns {Promise<object>}
   */
  async stats() {
    const options = Endpoint.buildOptions(this.apiUrl, `${this.userPath}?statistics=true`, 'get', {});
    return Endpoint.apiCall(options);
  }

  /**
   * Gets all the public workstations for every user.
   */
  async getAllPublic() {
    const options = Endpoint.buildOptions(this.apiUrl, `${this.globalPath}/`, 'get', {});
    return Endpoint.apiCall(options);
  }

  /**
   * Used to gather a workstation that if public will be returned, but if not public and the
   * authenticated user the workstation will be returned otherwise forbidden.
   * @param {string} username the username of the user.
   * @param {number} id the id of the workstation.
   */
  async getByUsernameAndId(username, id) {
    const path = `${this.path}users/${username}/workstations/${id}`;
    const options = Endpoint.buildOptions(this.apiUrl, path, 'get', {});
    return Endpoint.apiCall(options);
  }

  /**
   * Gets just the modified status of a single public workstation.
   * @param {string} username The username of the owner of the workstation.
   * @param {string} id the id of the workstation.
   */
  async getModifiedDateTimeByUsernameAndId(username, id) {
    const paths = `${this.path}users/${username}/workstations/${id}?fields=modified`;
    return Endpoint.apiCall(Endpoint.buildOptions(this.apiUrl, paths, 'get', {}));
  }

  /**
   * Gathers all the restrictions that are required to create workstations.
   */
  async restrictions() {
    const options = Endpoint.buildOptions(this.apiUrl, `${this.globalPath}/restrictions`, 'get', {});
    return Endpoint.apiCall(options);
  }
}
