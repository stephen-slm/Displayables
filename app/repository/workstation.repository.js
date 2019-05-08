const _ = require('lodash');

const workConstants = require('../constants/workstation');

const BaseRepository = require('./Base.repository');
const Connection = require('../services/Connection.service');

module.exports = class WorkstationRepository extends BaseRepository {
  /**
   * Inserts a new workstation for a user.
   * @param {number} userId The id of the user who's workstation it is.
   * @param {string} displayName The display name being shown for the workstation.
   * @param {boolean} visible If it should be publicly displayed or not.
   * @param {array<object>} configuration The workstation being imported.
   */
  static async createWorkstationById(userId, displayName, visible, configuration) {
    configuration.splice(workConstants.RESTRICTIONS.WORKSTATION_MAX_SIZE, configuration.length - 1);

    return Connection('workstation').insert({
      workstation_user_id: userId,
      workstation_display: displayName,
      workstation_visible: visible,
      created_datetime: new Date(),
      modified_datetime: new Date(),
      workstation_configuration: JSON.stringify(configuration)
    });
  }

  /**
   * Returns true of false to determine if the workstation owned by the user is public or not
   * @param {string} username the username of the user who owns the workstation.
   * @param {number} workstationId the id of the workstation related to the user.
   */
  static async getIsPublicWorkstationByUsername(username, workstationId) {
    const userId = await Connection('user')
      .select('user_id')
      .where('user_username', username)
      .first();

    if (_.isNil(userId)) return false;

    const exists = await Connection('workstation')
      .select('workstation_visible')
      .where({
        workstation_id: workstationId,
        workstation_user_id: userId.user_id
      })
      .first();

    if (exists && exists.workstation_visible === 1) return true;
    return false;
  }

  /**
   * Updates a workstation by user-id and workstation id.
   * @param {number} userId The id of the user.
   * @param {number} workstationId The users workstation id.
   * @param {string} display The display name of the workstation.
   * @param {boolean} visible If the workstation should be visible to the public.
   * @param {array<object>} workstation The updated workstation.
   */
  static async updateWorkstationByUserId(userId, workstationId, display, visible, workstation) {
    workstation.splice(workConstants.RESTRICTIONS.WORKSTATION_MAX_SIZE, workstation.length - 1);

    return Connection('workstation')
      .update({
        workstation_configuration: JSON.stringify(workstation),
        workstation_display: display,
        workstation_visible: visible,
        modified_datetime: new Date()
      })
      .where({
        workstation_user_id: userId,
        workstation_id: workstationId
      });
  }

  /**
   * Deletes a workstation.
   * @param {string} userId The user who owns the workstation being deleted.
   * @param {string} workstationId The workstation id that is being deleted.
   */
  static async deleteWorkstationById(userId, workstationId) {
    return Connection('workstation')
      .where({
        workstation_user_id: userId,
        workstation_id: workstationId
      })
      .delete();
  }

  /**
   * Validates that the workstation exists by the id and user-id.
   * @param {number} workstationId The workstation id.
   * @param {number} userId The id of the user who owns the workstation.
   */
  static async workstationExistsById(userId, workstationId) {
    const exists = await Connection('workstation')
      .select('workstation_id')
      .where({
        workstation_id: workstationId,
        workstation_user_id: userId
      })
      .first();

    if (exists) return exists.workstation_id;
    return false;
  }

  /**
   * Validates that the workstation exists by the id and username.
   * @param {string} username The username of the user who owns the workstation.
   * @param {number} workstationId The workstation id.
   */
  static async workstationExistsByUser(username, workstationId) {
    const userId = await Connection('user')
      .select('user_id')
      .where('user_username', username)
      .first();

    if (_.isNil(userId)) return false;

    const exists = await Connection('workstation')
      .select('workstation_id')
      .where({
        workstation_id: workstationId,
        workstation_user_id: userId.user_id
      })
      .first();

    if (exists) return exists.workstation_id;
    return false;
  }

  /**
   * Checks to see if a workstation exists with the display name.
   * @param userId The user id who owns the workstation.
   * @param displayName The display name of the workstation.
   * @return {Promise<*>}
   */
  static async workstationExistsWithDisplayName(userId, displayName) {
    const exists = await Connection('workstation')
      .select('workstation_id')
      .where({
        workstation_user_id: userId
      })
      .andWhereRaw(`Lower(workstation_display) = ?`, displayName.toLowerCase())
      .first();

    if (exists) return exists.workstation_id;
    return false;
  }

  /**
   * Gathers all the workstations for the user-id.
   * @param {number} userId The user id to gather the workstations by.
   */
  static async getWorkstationsByUserId(userId) {
    return Connection('workstation')
      .select(
        'workstation_id as id',
        'workstation_configuration as configuration',
        'workstation_display as display',
        'workstation_visible as visible',
        'modified_datetime as modified',
        'created_datetime as created'
      )
      .where({
        workstation_user_id: userId
      });
  }

  /**
   * Gets all the public workstations for a given user by the users id.
   * @param userId The id of the user to gather the workstations.
   */
  static async getPublicWorkstationsByUserId(userId) {
    return Connection('workstation')
      .select(
        'workstation_id as id',
        'workstation_configuration as configuration',
        'workstation_display as display',
        'workstation_visible as visible',
        'modified_datetime as modified',
        'created_datetime as created'
      )
      .where({
        workstation_user_id: userId,
        visible: 1
      });
  }

  /**
   * Gets all the public workstations not dependent on the user id.
   */
  static async getAllPublicWorkstations() {
    return Connection('workstation')
      .select(
        'workstation.workstation_id as id',
        'workstation.workstation_configuration as configuration',
        'workstation.workstation_display as display',
        'workstation.workstation_visible as visible',
        'user.user_username as username',
        'user.user_name as name',
        'workstation.modified_datetime as modified',
        'workstation.created_datetime as created'
      )
      .join('user as user', 'workstation.workstation_user_id', 'user.user_id')
      .where({
        visible: 1
      });
  }

  /**
   * Gets a workstation by the workstation id and the user id.
   * @param {number} workstationId The workstation id.
   * @param {number} userId The id of the user who owns the workstation.
   */
  static async getWorkstationById(userId, workstationId, fields) {
    if (!_.isNil(fields) && _.isArray(fields)) {
      return this.getWorkstationWithFieldsById(userId, workstationId, fields);
    }

    return Connection('workstation')
      .select(
        'workstation_id as id',
        'workstation_configuration as configuration',
        'workstation_display as display',
        'workstation.workstation_visible as visible',
        'modified_datetime as modified',
        'created_datetime as created'
      )
      .where({
        workstation_id: workstationId,
        workstation_user_id: userId
      })
      .first();
  }

  /**
   * Gathers a list of fields for a selected workstation.
   * @param {number} userId The user id to gather the fields by.
   * @param {number} workstationId The workstation id to be gathering.
   * @param {array} fields The array of fields to gather.
   */
  static async getWorkstationWithFieldsById(userId, workstationId, fields) {
    fields.forEach((element, index) => {
      if (element === 'modified' || element === 'created') {
        fields[index] = `${element}_datetime as ${element}`;
      } else {
        fields[index] = `workstation_${element} as ${element}`;
      }
    });

    return Connection('workstation')
      .select(...fields)
      .where({
        workstation_id: workstationId,
        workstation_user_id: userId
      })
      .first();
  }

  /**
   * Gets a workstations visibility.
   * @param {string} userId The user id of the workstation.
   * @param {string} workstationId The workstation id.
   */
  static async getWorkstationVisibleById(userId, workstationId) {
    const visible = await this.getWorkstationWithFieldsById(userId, workstationId, ['visible']);
    visible.visible = Boolean(visible.visible);
    return visible;
  }

  /**
   * updates a workstations visibility.
   * @param {string} userId The user id of the workstation.
   * @param {string} workstationId The workstation id.
   * @param {boolean} visible The workstation visible.
   */
  static async updateWorkstationVisibleById(userId, workstationId, visible) {
    return Connection('workstation')
      .update({
        workstation_visible: visible,
        modified_datetime: new Date()
      })
      .where({
        workstation_id: workstationId,
        workstation_user_id: userId
      });
  }

  /**
   * Gets a workstation by the username of the owner.
   * @param {string} username the username of the owner.
   * @param {id} workstationId the workstation id.
   * @param {array} fields The array of fields to gather.
   */
  static async getWorkstationByUsername(username, workstationId, fields) {
    const userId = await Connection('user')
      .select('user_id')
      .where('user_username', username)
      .first();

    if (!_.isNil(fields)) {
      return this.getWorkstationWithFieldsById(userId.user_id, workstationId, fields);
    }

    return Connection('workstation')
      .select(
        'workstation_id as id',
        'workstation_configuration as configuration',
        'workstation_display as display',
        'modified_datetime as modified',
        'created_datetime as created'
      )
      .where({
        workstation_id: workstationId,
        workstation_user_id: userId.user_id
      })
      .first();
  }

  /**
   * Gets the total amount of workstations for a given user by the users id.
   * @param userId The user id to gather the total by.
   * @returns {Promise<object>}
   */
  static async getTotalAmountOfWorkstations(userId) {
    const totalPublic = await Connection('workstation')
      .count('workstation_id as count')
      .where({
        workstation_user_id: userId,
        workstation_visible: 1
      })
      .first();

    const totalPrivate = await Connection('workstation')
      .count('workstation_id as count')
      .where({
        workstation_user_id: userId,
        workstation_visible: 0
      })
      .first();

    return {
      total: totalPrivate.count + totalPublic.count,
      private: totalPrivate.count,
      public: totalPublic.count
    };
  }

  /**
   * Gets the total amount of public workstations for all users.
   * @returns {Promise<number>} number of public workstations.
   * */
  static async getTotalPublicWorkstations() {
    const total = await Connection('workstation')
      .count('workstation_id as count')
      .where({
        workstation_visible: 1
      })
      .first();

    return total.count;
  }

  /**
   * Creates a default workstation for the provided user id.
   * @param userId the user to create the workstation for.
   * @return {Promise<*>}
   */
  static async createDefaultWorkstationForUser(userId) {
    return this.createWorkstationById(userId, 'Default', true, workConstants.WORKSTATION_DEFAULT);
  }
};
