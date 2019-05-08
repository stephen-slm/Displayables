const _ = require('lodash');

const workConstants = require('../constants/workstation');
const httpCodes = require('../constants/httpCodes');
const ApiError = require('../errors/apiError');

const UserRepository = require('../repository/user.repository');
const WorkstationRepository = require('../repository/workstation.repository');
const ComponentRepository = require('../repository/component.repository');

const LanguageService = require('../services/Language.service');

module.exports = class WorkstationController {
  /**
   * Checks and marks the request if the workstation being asked for is a public workstation or not,
   * it will require the workstation id and the username of the user who owns the workstation.
   * @param req.params.id The id of the workstation being requested.
   * @param req.params.user The username of the workstation being requested owner.
   */
  static async validateWorkstationPublicByUser(req, res, next) {
    try {
      const { workstationId, username } = req.params;

      if (_.isNil(workstationId) || _.isNil(username)) {
        return res.status(httpCodes.BAD_REQUEST).json({
          error: 'workstation',
          description: LanguageService.get(req, 'workstation.workstation_gather_public_page')
        });
      }

      const publics = await WorkstationRepository.getIsPublicWorkstationByUsername(username, workstationId);
      req.body.public = publics;

      return next();
    } catch (error) {
      const message = LanguageService.get(req, 'error.something_wrong');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Workstation', message));
    }
  }

  /**
   * Checks that the requested workstation id exists to be gathered by username.
   * @param req.params.id The id of the workstation being requested.
   * @param req.params.user The username of the workstation being requested owner.
   */
  static async validateWorkstationExistsByUser(req, res, next) {
    try {
      const { workstationId, username } = req.params;

      if (_.isNil(workstationId) || _.isNil(username)) {
        return res.status(httpCodes.BAD_REQUEST).json({
          error: 'workstation',
          description: LanguageService.get(req, 'workstation.workstation_gather_public_page')
        });
      }

      const userExists = await UserRepository.userExistsByUsername(username);
      const exists = await WorkstationRepository.workstationExistsByUser(username, workstationId);

      if (!userExists) {
        const description = LanguageService.get(req, 'user.username_does_not_exist');

        return res
          .status(httpCodes.BAD_REQUEST)
          .json({ error: 'User', description: description.replace('<n>', username) });
      }

      if (!exists) {
        const errorMessage = LanguageService.get(req, 'workstation.workstation_does_not_exist')
          .replace('<n>', username)
          .replace('{{ id }}', workstationId);

        return res.status(httpCodes.BAD_REQUEST).json({ error: 'Workstation', description: errorMessage });
      }

      return next();
    } catch (error) {
      const message = LanguageService.get(req, 'error.something_wrong');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Workstation', message));
    }
  }

  /**
   * Checks that the requested workstation id exists to be gathered.
   * @param req.body.decoded.id The id if the user to gather the workstation by.
   * @param req.params.id The id of the workstation being requested.
   */
  static async validateWorkstationExistsById(req, res, next) {
    try {
      const { workstationId } = req.params;
      const { id: userId, username } = req.body.decoded;

      if (_.isNil(workstationId)) {
        return res.status(httpCodes.BAD_REQUEST).json({
          error: 'Workstation',
          description: LanguageService.get(req, 'workstation.id_required')
        });
      }

      const exists = await WorkstationRepository.workstationExistsById(userId, workstationId);

      if (!exists) {
        const errorMessage = LanguageService.get(req, 'workstation.workstation_does_not_exist')
          .replace('<n>', username)
          .replace('{{ id }}', workstationId);

        return res.status(httpCodes.FORBIDDEN).json({ error: 'Workstation', description: errorMessage });
      }

      return next();
    } catch (error) {
      const message = LanguageService.get(req, 'error.something_wrong');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Workstation', message));
    }
  }

  /**
   * Gathers and sends the workstations for the requesting user.
   * @param req.params.id The id of the workstation being requested.
   * @param req.body.decoded.id The id if the user to gather the workstation by.
   */
  static async getWorkstationsByUserId(req, res, next) {
    try {
      const { id: userId } = req.body.decoded;
      let workstationsResult = null;

      if (req.query.statistics && req.query.statistics === 'true') {
        return await WorkstationController.getWorkstationsInformation(req, res, next);
      }

      if (req.query.public) {
        workstationsResult = await WorkstationRepository.getPublicWorkstationsByUserId(userId);
      } else {
        workstationsResult = await WorkstationRepository.getWorkstationsByUserId(userId);
      }

      const workstations = _.map(workstationsResult, (workstation) => {
        workstation.configuration = JSON.parse(workstation.configuration);
        return workstation;
      });

      return res.json(workstations);
    } catch (error) {
      const message = LanguageService.get(req, 'error.something_wrong');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Workstation', message));
    }
  }

  /**
   * Gets the workstation if its public otherwise continues.
   */
  static async getWorkstationByUserIfPublic(req, res, next) {
    try {
      const { workstationId, username } = req.params;
      const { public: workstationPublic } = req.body;

      let fields = null;
      if (!_.isNil(req.query.fields) && req.query.fields.trim().length !== 0) {
        fields = req.query.fields.split(',');
      }

      if (workstationPublic) {
        const workstation = await WorkstationRepository.getWorkstationByUsername(
          username,
          workstationId,
          fields
        );

        if (!_.isNil(workstation.configuration)) {
          workstation.configuration = JSON.parse(workstation.configuration);
        }

        return res.json(workstation);
      }

      return next();
    } catch (error) {
      const message = LanguageService.get(req, 'error.something_wrong');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Workstation', message));
    }
  }

  /**
   * Gets all the public workstations, not dependent on the user id. But globally.
   */
  static async getAllPublicWorkstations(req, res, next) {
    try {
      const workstationsResult = await WorkstationRepository.getAllPublicWorkstations();
      const workstations = _.map(workstationsResult, (workstation) => {
        workstation.configuration = JSON.parse(workstation.configuration);
        return workstation;
      });

      return res.json(workstations);
    } catch (error) {
      const message = LanguageService.get(req, 'error.something_wrong');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Workstation', message));
    }
  }

  /**
   * Gathers and sends the workstation for the requesting user.
   * @param req.body.decoded.id The id if the user to gather the workstation by.
   * @param req.params.id The id of the workstation being requested.
   */
  static async getWorkstationById(req, res, next) {
    try {
      const { workstationId } = req.params;
      const { id: userId } = req.body.decoded;

      let fields = null;

      if (!_.isNil(req.query.fields) && req.query.fields.trim().length !== 0) {
        fields = req.query.fields.split(',');
      }

      const workstation = await WorkstationRepository.getWorkstationById(userId, workstationId, fields);

      if (!_.isNil(workstation.configuration)) {
        workstation.configuration = JSON.parse(workstation.configuration);
      }

      return res.json({ ...workstation });
    } catch (error) {
      const message = LanguageService.get(req, 'error.something_wrong');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Workstation', message));
    }
  }

  /**
   * Gathers and sends the workstation visibility for the requesting user.
   * @param req.body.decoded.id The id if the user to gather the workstation by.
   * @param req.params.id The id of the workstation being requested.
   */
  static async getWorkstationVisibleById(req, res, next) {
    try {
      const { workstationId } = req.params;
      const { id: userId } = req.body.decoded;

      const visible = await WorkstationRepository.getWorkstationVisibleById(userId, workstationId);
      return res.json(visible);
    } catch (error) {
      const message = LanguageService.get(req, 'error.something_wrong');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Workstation', message));
    }
  }

  /**
   * updates the workstation visibility for the requesting user.
   * @param req.body.decoded.id The id if the user to gather the workstation by.
   * @param req.params.id The id of the workstation being requested.
   */
  static async updateWorkstationVisibleById(req, res, next) {
    try {
      const { workstationId } = req.params;
      const { id: userId } = req.body.decoded;
      const { visible } = req.body;

      if (!_.isBoolean(visible)) {
        return res.status(httpCodes.BAD_REQUEST).json({
          message: LanguageService.get(req, 'workstation.visibility_required'),
          error: 'Workstation'
        });
      }

      await WorkstationRepository.updateWorkstationVisibleById(userId, workstationId, visible);

      return res.status(httpCodes.OK).send();
    } catch (error) {
      const message = LanguageService.get(req, 'error.something_wrong');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Workstation', message));
    }
  }

  /**
   * Validates that the position of the workstation is correct.
   * @param workstation The workstation being validated.
   * @returns {boolean} If the workstation position is valid.
   */
  static validateWorkstationPosition(workstation) {
    if (!_.isNumber(workstation.position)) {
      return false;
    }

    const { WORKSTATION_MAX_SIZE } = workConstants.RESTRICTIONS;

    return !(workstation.position < 0 || workstation.position >= WORKSTATION_MAX_SIZE);
  }

  /**
   * Validates that the workstation configuration is correct and does not miss any required
   * information.
   * @param station The workstation being validated.
   * @param requiredSettings The settings required by the station.
   * @returns {object} Object with valid status and error message if needed.
   */
  static validateWorkstationConfiguration(station, requiredSettings, req) {
    const validation = { valid: true, message: null };

    if (_.isNil(station.configuration)) {
      const message = LanguageService.get(req, 'workstation.workstation_configuration_missing')
        .replace('{{ name }}', station.name)
        .replace('{{ position }}', station.position);

      validation.message = message;
      validation.valid = false;
      return validation;
    }

    const missing = _.filter(requiredSettings.configuration, (item) => _.isNil(station.configuration[item]));
    const missingOptional = _.filter(requiredSettings.optional, (item) =>
      _.isNil(station.configuration[item])
    );

    if (_.isEqual(missing, missingOptional)) {
      return validation;
    }

    const missingOptions = _.map(missing, (item) => {
      if (missingOptional.includes(item)) item = `(optional) ${item}`;
      return item;
    });

    const message = LanguageService.get(req, 'workstation.workstation_configuration_items_missing')
      .replace('{{ name }}', station.name)
      .replace('{{ missing }}', missingOptions.join(', '));

    validation.valid = false;
    validation.message = message;

    return validation;
  }

  /**
   * Validates that the creating workstation meets the requirements.
   * @param req.body.workstation The content of the workstation being created.
   */
  static async validateWorkstationDetails(req, res, next) {
    try {
      const lang = LanguageService.get(req, 'workstation');
      const { display, visible } = req.body;
      let { configuration } = req.body;

      if (_.isNil(configuration) || !_.isArray(configuration) || configuration.length <= 0) {
        const description = lang.workstation_configuration_required;
        return res.status(httpCodes.BAD_REQUEST).json({ error: 'Workstation', description });
      }

      if (_.isNil(display) || !_.isString(display)) {
        const description = lang.workstation_display_required;
        return res.status(httpCodes.BAD_REQUEST).json({ error: 'Workstation', description });
      }

      if (_.isNil(visible) || !_.isBoolean(visible)) {
        const description = lang.workstation_visible_required;
        return res.status(httpCodes.BAD_REQUEST).json({ error: 'Workstation', description });
      }

      if (configuration.length > workConstants.RESTRICTIONS.workstation_max_size) {
        const description = lang.invalid_workstation_length;
        return res.status(httpCodes.BAD_REQUEST).json({ error: 'Workstation', description });
      }

      const components = await ComponentRepository.getAllComponentsAndDetails();
      const failedMessage = { error: 'station', description: '' };
      let failed = false;

      configuration = _.compact(configuration);

      _.forEach(configuration, (config, index) => {
        if (_.filter(components, (component) => component.name === config.name).length === 0) {
          const list = _.map(components, 'name');
          failedMessage.description = lang.invalid_station_name.replace('{{ list }}', list.join(', '));
          failed = true;
          return failed;
        }

        if (!WorkstationController.validateWorkstationPosition(config)) {
          failedMessage.description = lang.invalid_station_position;
          failed = true;
          return failed;
        }

        // filter out everything that is not allowed in the list, then go validate that the
        // requirements exist, we do this to protect against the chance unwanted data being forced
        // into the DatabaseService. This could lead to scripts being executed on clients machines that
        // shouldn't be (due to how pubic workstations work).

        const stationRestrictions = _.find(components, (component) => component.name === config.name);
        configuration[index].configuration = _.pick(config.configuration, stationRestrictions.configuration);

        const validConfiguration = WorkstationController.validateWorkstationConfiguration(
          config,
          stationRestrictions,
          req
        );

        if (!validConfiguration.valid) {
          failedMessage.description = validConfiguration.message;
          failed = true;
          return failed;
        }

        return failed;
      });

      if (failed) {
        return res.status(httpCodes.BAD_REQUEST).json(failedMessage);
      }

      req.body.configuration = configuration;

      return next();
    } catch (error) {
      const message = LanguageService.get(req, 'error.something_wrong');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Workstation', message));
    }
  }

  /**
   * Validates that the workstations can be created as a user cannot have more than 6 workstations. It
   * will continue if we have enough room for the creation otherwise let the user know it cannot be
   * created.
   */
  static async validateRoomForWorkstation(req, res, next) {
    try {
      const { id: userId } = req.body.decoded;
      const { WORKSTATION_MAX_TOTAL } = workConstants.RESTRICTIONS;

      const amountOfWorkstations = await WorkstationRepository.getTotalAmountOfWorkstations(userId);

      if (amountOfWorkstations.total >= WORKSTATION_MAX_TOTAL) {
        return res.status(httpCodes.BAD_REQUEST).json({
          description: LanguageService.get(req, 'workstation.max_workstation_reached'),
          error: 'workstation'
        });
      }

      return next();
    } catch (error) {
      const message = LanguageService.get(req, 'error.something_wrong');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Workstation', message));
    }
  }

  /**
   * Validates that the workstation display is not used twice for a selected user.
   * @param {string} req.body.display The display name of the workstation.
   * @param {number} req.body.decoded.userId The id of the user.
   * @param {string} req.params.workstationId The id of the workstation being requested (optional).
   */
  static async validateDisplayName(req, res, next) {
    try {
      const { display } = req.body;
      const { id: userId } = req.body.decoded;
      const { workstationId } = req.params;

      const nameInUse = await WorkstationRepository.workstationExistsWithDisplayName(userId, display);

      if (nameInUse && !_.isNil(workstationId) && Number(workstationId) !== nameInUse) {
        const description = LanguageService.get(req, 'workstation.workstation_display_already_used');
        return res.status(httpCodes.BAD_REQUEST).json({ error: 'workstation', description });
      }

      if (nameInUse && _.isNil(workstationId)) {
        const description = LanguageService.get(req, 'workstation.workstation_display_already_used');
        return res.status(httpCodes.BAD_REQUEST).json({ error: 'workstation', description });
      }

      return next();
    } catch (error) {
      const message = LanguageService.get(req, 'error.something_wrong');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Workstation', message));
    }
  }

  /**
   * Creates a new workstation for the user.
   * @param req.body.decoded.id The id if the user to gather the workstation by.
   * @param req.body.workstation The content of the workstation being created.
   */
  static async createNewWorkstation(req, res, next) {
    try {
      const { configuration, display, visible } = req.body;
      const { id: userId } = req.body.decoded;

      const created = await WorkstationRepository.createWorkstationById(
        userId,
        display,
        visible,
        configuration
      );

      return res.json({ workstation: created[0] });
    } catch (error) {
      const message = LanguageService.get(req, 'error.something_wrong');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Workstation', message));
    }
  }

  /**
   * Updates a workstation by the user id (including a validated workstation)
   * @param req.body.decoded.id The id if the user to gather the workstation by.
   * @param req.body.workstation The content of the workstation being created.
   */
  static async updateWorkstationById(req, res, next) {
    try {
      const { configuration, display, visible } = req.body;
      const { id: userId } = req.body.decoded;
      const { workstationId } = req.params;

      await WorkstationRepository.updateWorkstationByUserId(
        userId,
        workstationId,
        display,
        visible,
        configuration
      );

      res.send({
        message: LanguageService.get(req, 'workstation.workstation_updated'),
        workstation: workstationId
      });
    } catch (error) {
      const message = LanguageService.get(req, 'error.something_wrong');
      next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Workstation', message));
    }
  }

  /**
   * Deletes a users workstation by the id, requires the user id.
   * @param {string} req.body.decoded.id The user id of the user who owns the workstation.
   * @param {string} req.params.id The workstation id that will be deleted.
   */
  static async deleteWorkstationById(req, res, next) {
    try {
      const { id: userId } = req.body.decoded;
      const { workstationId } = req.params;

      await WorkstationRepository.deleteWorkstationById(userId, workstationId);
      return res.json({ deleted: parseInt(workstationId, 10) });
    } catch (error) {
      const message = LanguageService.get(req, 'error.something_wrong');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Workstation', message));
    }
  }

  /**
   * Sends the workstation restrictions to the provided authenticated user, this can be used to
   * validate creation of work stations, the required configuration options etc.
   */
  static async getWorkstationRestrictions(req, res, next) {
    try {
      const components = await ComponentRepository.getAllComponentsAndDetails();

      return res.json(
        Object.assign(workConstants.RESTRICTIONS, {
          WORKSTATION_COMPONENTS: components
        })
      );
    } catch (error) {
      const message = LanguageService.get(req, 'error.something_wrong');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Workstation', message));
    }
  }

  /**
   * Returns some information about current workstations, including the number of public workstations,
   * there total workstations and public workstations.
   * @param {number} req.body.decoded The user id of the authenticated user.
   */
  static async getWorkstationsInformation(req, res, next) {
    try {
      const { id: userId } = req.body.decoded;

      const totalPublicLayouts = await WorkstationRepository.getTotalPublicWorkstations();
      const totalWorkstations = await WorkstationRepository.getTotalAmountOfWorkstations(userId);

      return res.json({
        user: totalWorkstations,
        global: {
          public: totalPublicLayouts
        }
      });
    } catch (error) {
      const message = LanguageService.get(req, 'error.something_wrong');
      return next(new ApiError(req, res, error, httpCodes.INTERNAL_SERVER_ERROR, 'Workstation', message));
    }
  }
};
