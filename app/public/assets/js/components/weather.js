/**
 * Gets the raw data for a given city and country, will ignore the code if its null.
 * @param {string} city The city to gather the news for.
 * @param {string} countryCode The given country code to gather the weather for.
 */
async function getWeatherData(city, countryCode) {
  if (this._.isNil(countryCode)) {
    return this.api.weather.byCity(city);
  }

  return this.api.weather.byCityAndCode(city, countryCode);
}

/**
 * Binds the raw news data within the corresponding div.
 * @param {string} className The class name to set the content by.
 */
function setWeatherContent(className) {
  const name = className.startsWith('.') ? className : `.${className}`;
  const location = document.querySelector(name);

  const data = this.instance[`${className}-weather`];

  const temperature = location.querySelector('.weather-temperature');
  const place = location.querySelector('.weather-location');
  const image = location.querySelector('.weather-icon');
  const extra = location.querySelector('.weather-extra');

  image.innerHTML = this._.getWeatherIconForType(data.weather[0].icon);

  place.textContent = `${data.name}, ${data.sys.country}`;
  temperature.innerHTML = `${data.main.temp}`;

  if (!this._.isNil(data.wind)) {
    extra.lastElementChild.textContent = `${data.wind.speed}`;
  }

  if (!this._.isNil(data.rain)) {
    const content = this._.isNil(data.rain['3h']) ? data.rain['3h'] : data.rain['1h'];
    extra.lastElementChild.textContent = `${content || 0}`;
  }
}

/**
 * Binds the raw news data within the corresponding div.
 * @param {string} className The class name to set the content by.
 * @param {string} city The city name that the weather failed with.
 * @param {string} code The country code the weather failed with.
 * @param {string} errorMessage The error that occurred during the process.
 */
function setWeatherError(className, city, code, errorMessage) {
  const name = className.startsWith('.') ? className : `.${className}`;
  const container = document.querySelector(name);

  // the content div that will contain the display message and error if one was passed.
  const error = document.createElement('div');
  error.classList.add('weather-error');

  // appending the display message after getting the translation.
  const content = document.createElement('div');
  const displayMessage = this.language.errors.loadWeather;
  content.textContent = `${displayMessage} (${city}, ${code})`;
  error.appendChild(content);

  // if and only if the error message was passed, create another div containing this error message.
  // This cannot be translated as its coming from a external site. Which does not allow for giving
  // it language codes for translation.
  if (!this._.isNil(errorMessage)) {
    const errorDiv = document.createElement('div');
    errorDiv.classList.add('weather-error');
    errorDiv.textContent = errorMessage;

    error.appendChild(errorDiv);
  }

  // the quickest way to remove all the template divs from the weather container is to set the inner
  // HTML to empty. which means we can then just insert our error container div which will be the
  // only div within the weather section of the dom.
  container.classList.add('weather-container-error');
  container.innerHTML = '';
  container.appendChild(error);
}

/**
 * Updates the exiting news column with updated content (if the content has changed);
 * @param {string} className The class name containing the weather div.
 * @param {string} city The city name that the weather will be gathering for.
 * @param {string} code The country code the weather will be gathering for.
 */
async function refresh(className, config) {
  const { city, code } = config;
  const dataLocation = `${className}-weather`;

  const updatedData = await this.getWeatherData(city, code);
  const oldData = this.instance[dataLocation];

  // validate that the calculation time of the new data is actually newer before attempting to
  // update any of the content.
  if (!this._.isNil(updatedData.dt) && !this._.isNil(oldData.dt) && updatedData.dt !== oldData.dt) {
    this.instance[dataLocation] = updatedData;
    this.setWeatherContent(className);
  }
}

/**
 * Loads the current weather into the web page.
 * @param {string} className The class name containing the weather div.
 * @param {string} city The city name that the weather will be gathering for.
 * @param {string} code The country code the weather will be gathering for.
 */
async function start(className, config) {
  const { city, code } = config;
  const dataLocation = `${className}-weather`;

  const data = await this.getWeatherData(city, code);
  this.instance[dataLocation] = data;

  // our request was completed properly but a error was returned from the external site, generally
  // returned with a error message on the data object.
  if (Number(data.cod) !== 200) {
    return this.setWeatherError(className, city, code, data.message);
  }

  // we failed to actually perform the request properly, we don't have a displaying error message.
  // But if no error message is given, no error message div will be created.
  if (data.status !== 200) {
    return this.setWeatherError(className, city, code);
  }

  // no errors which means we are confident that our data object contains all the required
  // information to start displaying the correct weather information in the given section of the
  // grid.
  return this.setWeatherContent(className);
}

export default {
  start,
  refresh,
  setWeatherError,
  setWeatherContent,
  getWeatherData
};
