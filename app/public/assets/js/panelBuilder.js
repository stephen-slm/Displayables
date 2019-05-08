import * as utilities from './utilities.js';

export default class PanelBuilder {
  /**
   * Constructor for a new panel, the panel can be used to dynamically create dialog panels used to
   * ask the user for information in a standard and easy to use builder format. the header of the
   * document. If the header title is passed, it will be created  in the constructor.
   * @param {string} headerTitle The header title.
   */
  constructor(headerTitle) {
    if (utilities.isNil(document) || utilities.isNil(document.body)) {
      throw new Error('You cannot use panel builder without a existing document');
    }

    this.title = headerTitle;
    this.showing = false;
    this.components = [];

    this.tabIndex = 1;

    this.createBasePanel();

    if (!utilities.isNil(this.title)) {
      this.addHeader(this.title);
    }
  }

  /**
   * Adds the header to the panel.
   * @param {string} title The title in the header.
   */
  addHeader(title) {
    this.header = PanelBuilder.createElementWithClasses('div', 'panel-header');
    const headerBody = PanelBuilder.createElementWithClasses('h6', 'panel-header-body');

    this.header.appendChild(headerBody);
    headerBody.textContent = title;

    this.panel.appendChild(this.header);

    return this;
  }

  /**
   * Adds the core body to the panel.
   * @param {string} description The optional description to be added.
   */
  addBody(description) {
    this.body = PanelBuilder.createElementWithClasses('div', 'panel-body');
    this.panel.appendChild(this.body);

    if (!utilities.isNil(description)) {
      this.addDescription(description, 'body');
    }

    return this;
  }

  /**
   * Adds a footer section used for right align content.
   */
  addFooter() {
    this.footer = PanelBuilder.createElementWithClasses('div', 'panel-footer');
    this.panel.appendChild(this.footer);

    return this;
  }

  /**
   * Adds a description section to the panel.
   * @param {string} text The text to reference the description.
   * @param {string} location The location to add the description.
   */
  addDescription(text, location = 'body') {
    const description = PanelBuilder.createElementWithClasses('p', 'panel-body-description');
    description.textContent = text;

    this[location].appendChild(description);
    return this;
  }

  /**
   * Adds a input field to the panel.
   * @param {string} name The name to reference the input field.
   * @param {string} description The description of the input.
   * @param {string} placeholder The place holder text.
   * @param {boolean} required If the input is required or not.
   * @param {string} location The location to add the input field.
   */
  addInput(name, description, placeholder, required = false, location = 'body') {
    const container = PanelBuilder.createElementWithClasses('div', 'panel-item-container');
    const input = PanelBuilder.createElementWithClasses('input', 'panel-input');

    const descriptionText = PanelBuilder.createElementWithClasses('p', 'panel-body-description');
    descriptionText.textContent = description;

    input.id = `panel-input-${name}`;
    input.placeholder = placeholder;

    container.appendChild(descriptionText);
    container.appendChild(input);

    // add the required content if marked todo so.
    if (required) PanelBuilder.addRequiredContent(container);

    this.addTabIndex(input);

    this[location].appendChild(container);
    this.components.push({ required, type: 'input', component: name, object: input });

    return this;
  }

  /**
   * Adds a input field as a number selector with a min and a max value.
   * @param {string} name The name to reference the input field.
   * @param {string} description The description of the input.
   * @param {*} min The min value of the input.
   * @param {*} max The max value of the input.
   * @param {string} placeholder The place holder text.
   * @param {boolean} required If the input is required or not.
   * @param {string} location The location to add the input field.
   */
  addInputCounter(name, description, min = 1, max = 10, placeholder, required = false, location = 'body') {
    const selection = new Array(max);

    for (let index = min; index < max; index += 1) {
      selection[index] = index + 1;
    }

    return this.addDropdown(name, description, selection, placeholder, required, location);
  }

  /**
   * Adds a check box to the panel.
   * @param {string} name The name to reference the check box.
   * @param {string} title The title to be displayed along side the check box.
   * @param {string} description The title to explain the check box.
   */
  addCheck(name, title, description, location = 'body') {
    const container = PanelBuilder.createElementWithClasses('div', 'panel-item-container');
    const descriptionText = PanelBuilder.createElementWithClasses('p', 'panel-body-description');

    descriptionText.textContent = description;

    const labelContainer = PanelBuilder.createElementWithClasses('label', 'panel-label');
    const input = PanelBuilder.createElementWithClasses('input', 'panel-label-input');
    const span = PanelBuilder.createElementWithClasses('span', 'panel-label-span');

    labelContainer.textContent = title;

    input.id = `panel-checkbox-${name}`;
    input.type = 'checkbox';

    labelContainer.appendChild(input);
    labelContainer.appendChild(span);

    container.appendChild(descriptionText);
    container.appendChild(labelContainer);

    this.addTabIndex(span);

    span.addEventListener('keyup', (event) => {
      if (event.keyCode === 32) input.click();
    });

    this[location].appendChild(container);
    this.components.push({ required: false, type: 'checkbox', component: name, object: input });

    return this;
  }

  /**
   * Adds a drop down selector the panel.
   * @param {string} name The name to reference the drop down.
   * @param {string} title The title to sit above the drop down.
   * @param {array} values Array of values to store in the drop down.
   * @param {string} any Start value (if set, value added at top of drop-down.)
   * @param {boolean} required If the input is required or not.
   * @param {string} location The location to place the drop down.
   */
  addDropdown(name, title, values, starter = 'none', required = false, location = 'body') {
    const container = PanelBuilder.createElementWithClasses('div', 'panel-item-container');
    const dropDownContainer = PanelBuilder.createElementWithClasses('div', 'panel-dropdown');
    const select = document.createElement('select');

    const descriptionText = PanelBuilder.createElementWithClasses('p', 'panel-body-description');
    descriptionText.textContent = title;

    select.id = `panel-select-${name}`;

    if (!utilities.isNil(starter)) {
      values = [starter].concat(values);
    }

    values.forEach((element) => {
      const option = document.createElement('option');
      option.value = `${element}`;
      option.textContent = `${element}`;

      select.appendChild(option);
    });

    dropDownContainer.appendChild(descriptionText);
    dropDownContainer.appendChild(select);

    container.appendChild(dropDownContainer);

    // add the required content if marked todo so.
    if (required) PanelBuilder.addRequiredContent(container);

    this.addTabIndex(select);

    this[location].appendChild(container);
    this.components.push({
      required,
      type: 'select',
      component: name,
      object: select
    });

    return this;
  }

  /**
   * Adds a new map input.
   * @param {string} name The name used a reference for the  map.
   * @param {string} upperText The header text describing the map.
   * @param {string} long The longitude of the maps current location.
   * @param {string} lat The latitude of the maps current location.
   * @param {string} location The location to add the date time.
   */

  addMapInput(name, upperText, lng, lat, location = 'body') {
    const container = PanelBuilder.createElementWithClasses('div', 'panel-item-container');
    const description = PanelBuilder.createElementWithClasses('p', 'panel-body-description');
    const mapContainer = PanelBuilder.createElementWithClasses('div', 'panel-map');
    const mapDiv = document.createElement('div');

    description.textContent = upperText;

    const googleMap = new google.maps.Map(mapDiv, {
      center: { lat, lng },
      disableDefaultUI: true,
      zoom: 10
    });

    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: googleMap,
      draggable: true
    });

    mapContainer.appendChild(mapDiv);

    container.appendChild(description);
    container.appendChild(mapContainer);

    this.addTabIndex(mapContainer);

    this[location].appendChild(container);
    this.components.push({ type: 'map', component: name, object: mapContainer, map: googleMap, marker });

    return this;
  }

  /**
   * Adds a new date time object to the panel.
   * @param {string} name The name used a reference for the date time.
   * @param {string} upperText The header text describing the date time.
   * @param {string} min The min date time limit of the date time being added.
   * @param {string} max The max date time for the date time being added.
   * @param {boolean} required If the input is required or not.
   * @param {string} location The location to add the date time.
   */
  addDateInput(name, upperText, min = null, max = null, required = false, location = 'body') {
    const container = PanelBuilder.createElementWithClasses('div', 'panel-item-container');
    const description = PanelBuilder.createElementWithClasses('p', 'panel-body-description');
    const dateTimeInput = PanelBuilder.createElementWithClasses('input', 'panel-input');

    description.textContent = upperText;

    dateTimeInput.name = name;
    dateTimeInput.id = `panel-date-${name}`;
    dateTimeInput.type = 'date';

    if (utilities.isNil(min)) {
      min = new Date();
    }

    if (utilities.isNil(max)) {
      max = new Date();
      max.setYear(max.getFullYear() + 100);
    }

    const [minDate] = min.toISOString().split('T');
    const [maxDate] = max.toISOString().split('T');

    dateTimeInput.value = minDate;
    dateTimeInput.min = minDate;
    dateTimeInput.max = maxDate;

    container.appendChild(description);
    container.appendChild(dateTimeInput);

    // add the required content if marked todo so.
    if (required) PanelBuilder.addRequiredContent(container);

    this.addTabIndex(dateTimeInput);

    this[location].appendChild(container);
    this.components.push({
      required,
      type: 'date',
      component: name,
      object: dateTimeInput
    });

    return this;
  }

  /**
   * Adds a new time object to the panel.
   * @param {string} name The name used a reference for the time.
   * @param {string} upperText The header text describing the time.
   * @param {boolean} required If the input is required or not.
   * @param {string} location The location to add the time.
   */
  addTimeInput(name, upperText, required = false, location = 'body') {
    const container = PanelBuilder.createElementWithClasses('div', 'panel-item-container');
    const description = PanelBuilder.createElementWithClasses('p', 'panel-body-description');
    const timeInput = PanelBuilder.createElementWithClasses('input', 'panel-input');

    description.textContent = upperText;

    timeInput.name = name;
    timeInput.id = `panel-time-${name}`;
    timeInput.type = 'time';

    const currentTime = new Date();
    timeInput.value = `${currentTime.getHours()}:${currentTime.getMinutes()}`;

    container.appendChild(description);
    container.appendChild(timeInput);

    // add the required content if marked todo so.
    if (required) PanelBuilder.addRequiredContent(container);

    this.addTabIndex(timeInput);

    this[location].appendChild(container);
    this.components.push({
      required,
      type: 'time',
      component: name,
      object: timeInput
    });

    return this;
  }

  /**
   * Adds a new button to the panel.
   * @param {string} title The title being displayed on the button.
   * @param {function} clickHandler The click handler
   * @param {string} location The location to place the button.
   */
  addButton(title, clickHandler, location = 'footer') {
    const button = PanelBuilder.createElementWithClasses('button', 'panel-button');

    button.textContent = title;
    button.addEventListener('click', clickHandler.bind(this));

    this.addTabIndex(button);
    this[location].appendChild(button);

    return this;
  }

  /**
   * Adds a cancel button to close the panel
   * @param {string} location The location to store the cancel button.
   */
  addCancelButton(name = ' Cancel', location = 'footer') {
    return this.addButton(name, this.hide.bind(this), location);
  }

  /**
   * s the panel.
   */
  show() {
    document.body.appendChild(this.wrapper);

    setTimeout(() => {
      this.panel.parentElement.style.opacity = '1';
      this.wrapper.firstElementChild.style.opacity = '1';
    }, 50);

    this.panel.selectedIndex = '1';
    this.panel.focus();

    this.components[0].object.focus();
    this.components[0].object.click();

    this.showing = true;
    return this;
  }

  /**
   * Hides the panel.
   */
  hide() {
    this.panel.parentElement.style.opacity = '0';
    this.wrapper.firstElementChild.style.opacity = '0';

    setTimeout(() => {
      this.wrapper.remove();
    }, 250);

    this.showing = false;
    return this;
  }

  /**
   * Gets the input value from a input field.
   * @param {string} name The input value being gathered.
   * @param {any} defaultValue Default value if not exists.
   */
  getInput(name, defaultValue = null) {
    return this.getValue(name, 'input', true, 'value', defaultValue);
  }

  /**
   * Sets a input value for a input field being displayed.
   * @param {string} name The input value being gathered.
   * @param {string} value The value being set into the input.
   */
  setInput(name, value) {
    switch (typeof value) {
      case 'boolean':
        this.setValue(name, 'checkbox', true, 'checked', value);
        break;
      default:
        this.setValue(name, 'input', true, 'value', value);
        this.setValue(name, 'select', true, 'value', value);
        this.setValue(name, 'date', true, 'value', value);
        this.setValue(name, 'time', true, 'value', value);
        this.setValue(name, 'map', true, 'value', value);
    }
  }

  /**
   * Gets the date value.
   * @param {string} name The name of the date object being gathered.
   * @param {any} defaultValue The default value.
   */
  getDate(name, defaultValue = null) {
    return this.getValue(name, 'date', true, 'value', defaultValue);
  }

  /**
   * Gets the time value.
   * @param {string} name The name of the time object being gathered.
   * @param {any} defaultValue The default value.
   */
  getTime(name, defaultValue = null) {
    return this.getValue(name, 'time', true, 'value', defaultValue);
  }

  /**
   * Gets a checkbox value.
   * @param {string} name The name of the check box being gathered.
   * @param {any} defaultValue The default value.
   */
  getChecked(name, defaultValue = null) {
    return this.getValue(name, 'checkbox', true, 'checked', defaultValue);
  }

  /**
   * Gets a drop-down value.
   *
   * @param {string} name The name of the drop-down being gathered.
   * @param {any} defaultValue The default value.
   */
  getDropdown(name, defaultValue = null) {
    const value = this.getValue(name, 'select', true, 'value', defaultValue);
    return value === 'none' ? defaultValue : value;
  }

  /**
   * Gets the value for the google map. (long and lat)
   *
   * @param {string} name The component name.
   * @memberof PanelBuilder
   */
  getMap(name, defaultValue = null) {
    // gather the related component that contains the map and marker.
    const googleMap = this.components.filter((e) => e.component === name)[0];

    // if we could not find the map then just early return before doing any actions that could have
    // unwanted side effects.
    if (utilities.isNil(googleMap)) return defaultValue;
    const { marker } = googleMap;

    // determine the center position of the map and return this location.
    const position = marker.getPosition();
    return { latitude: position.lat(), longitude: position.lng() };
  }

  /**
   * Gets all the values stored within the panel based on the names given and types.
   */
  getAllValues() {
    const result = {};

    // return null if we did not validate any inputs.
    if (!this.validateRequiredInputs()) return null;

    this.components.forEach((element) => {
      switch (element.type) {
        default:
        case 'input':
          result[element.component] = this.getInput(element.component);
          break;
        case 'checkbox':
          result[element.component] = this.getChecked(element.component);
          break;
        case 'select':
          result[element.component] = this.getDropdown(element.component);
          break;
        case 'date':
          result[element.component] = this.getDate(element.component);
          break;
        case 'time':
          result[element.component] = this.getTime(element.component);
          break;
        case 'map':
          result[element.component] = this.getMap(element.component);
          break;
      }
    });

    return result;
  }

  /**
   * Validates that all the required input fields are filed with some form of information, otherwise
   * marks the field as red for requiring input.
   */
  validateRequiredInputs() {
    const failedValidation = [];

    this.components.forEach((element) => {
      if (element.required && element.type === 'input') {
        const value = this.getInput(element.component);
        if (utilities.isNil(value) || value === '') failedValidation.push(element.object);
      }

      if (element.required && element.type === 'date') {
        const value = this.getDate(element.component);
        if (utilities.isNil(value) || value === '') failedValidation.push(element.object);
      }

      if (element.required && element.type === 'time') {
        const value = this.getTime(element.component);
        if (utilities.isNil(value) || value === '') failedValidation.push(element.object);
      }

      if (element.required && element.type === 'select') {
        const value = this.getDropdown(element.component);
        if (utilities.isNil(value) || value === '' || value === 'none') failedValidation.push(element.object);
      }
    });

    if (failedValidation.length === 0) return true;

    failedValidation.forEach((element, index) => {
      failedValidation[index].style.background = 'var(--error)';
    });

    return false;
  }

  /**
   * Gets the value based on the specified properties, used when gathering key value information
   * from a element object if it exists.
   * @param {string} name The property being gathered.
   * @param {string} type The type of the element, id being used.
   * @param {string} id Th id of the element
   * @param {string} property The property name being gathered.
   * @param {any} defaultValue Default value if it does not exist.
   */
  getValue(name, type, id, property, defaultValue = null) {
    const element = this.panel.querySelector(`${id ? '#' : '.'}panel-${type}-${name}`);
    if (utilities.isNil(element)) return defaultValue;

    const value = element[property];
    if (utilities.isNil(value) || value === '') return defaultValue;

    return value;
  }

  /**
   * Sets the value based on the specified property.
   * @param {string} name The property being gathered.
   * @param {string} type The type of the element, id being used.
   * @param {string} id Th id of the element
   * @param {string} property The property name being gathered.
   * @param {*} value The value being set.
   */
  setValue(name, type, id, property, value) {
    if (type === 'map') this.setMapValue(type, value);

    const element = this.panel.querySelector(`${id ? '#' : '.'}panel-${type}-${name}`);
    if (utilities.isNil(element)) return;
    element[property] = value;
  }

  /**
   * Sets the long and latitude for the google map and sets the marker to be the current location
   * that was stored. the value is expected to contain the long and latitude.
   *
   * @param {string} type The component name that the map is being stored by.
   * @param {object} value the long and lat value that is being stored.
   * @memberof PanelBuilder
   */
  setMapValue(type, value) {
    // return early if we don't have a long and latitude to be used.
    if (utilities.isNil(value.latitude) || utilities.isNil(value.longitude)) return;

    // gather the related component that contains the map and marker.
    const googleMap = this.components.filter((e) => e.component === type)[0];

    // if we could not find the map then just early return before doing any actions that could have
    // unwanted side effects.
    if (utilities.isNil(googleMap)) return;
    const { map, marker } = googleMap;

    const latLong = new google.maps.LatLng(parseFloat(value.latitude), parseFloat(value.longitude));

    // update the marker to have the point while also setting the center position of the map to
    // focus on our long and latitude.
    marker.setPosition(latLong);
    map.setCenter(latLong);
  }

  /**
   * Adds a required mark for the content container being added, e.g input.
   * @param {element} container The core wrapping container of the elements.
   */
  static addRequiredContent(container) {
    const requiredSpan = PanelBuilder.createElementWithClasses('span', 'required');
    requiredSpan.textContent = '*';
    container.appendChild(requiredSpan);
  }

  /**
   * Creates the base panel.
   */
  createBasePanel() {
    const wrapper = PanelBuilder.createElementWithClasses('div', 'base-wrapper');
    const wrapperDiv = PanelBuilder.createElementWithClasses('div', 'base-wrapper-div');
    const wrapperDivTwo = PanelBuilder.createElementWithClasses('div', 'base-wrapper-div-two');
    const panel = PanelBuilder.createElementWithClasses('div', 'base-panel');

    wrapper.appendChild(wrapperDiv);
    wrapper.appendChild(wrapperDivTwo);
    wrapperDivTwo.appendChild(panel);

    wrapper.addEventListener('click', this.hide.bind(this));
    panel.addEventListener('click', (event) => event.stopPropagation());

    this.panel = panel;
    this.wrapper = wrapper;

    return this;
  }

  /**
   * Creates a new element with the classes
   * @param {string} element The element that is being created
   * @param  {...any} classes The list of classes being added.
   */
  static createElementWithClasses(element, ...classes) {
    const component = document.createElement(element);

    classes.forEach((item) => {
      if (!utilities.isNil(item)) component.classList.add(item);
    });

    return component;
  }

  addTabIndex(element) {
    element.tabIndex = this.tabIndex;

    this.tabIndex += 1;
  }
}
