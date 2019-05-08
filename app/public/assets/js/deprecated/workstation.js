/**
 * IMPORTANT:
 *
 * This guy exists because in the newer versions of the workstation platform it will be using the
 * dynamic importing, this dynamic importing is under a optinal flag or not yet fully supported in
 * some browers. If its not supported then they will be redirected to a older version of the site.
 */

import * as utilities from '../utilities.js';
import LanguageController from '../languageController.js';

const workstationBase = {
  /**
   * If the user is a authenticated user or not, just used for minor messaging.
   */
  authenticated: false,
  /**
   * The current workstation that was gathered based on the parameters.
   */
  workstation: null,
  /**
   * The parameters that were gathered from the url in start up
   */
  parameters: null,
  /**
   * The language controller for the page.
   */
  lang: null,

  /**
   * The create update loop is a list of methods that will be called every 2 minutes that would
   * perform a update of selected content.
   */
  createUpdateLoop: [],

  /**
   * The create update loop will contain methods that want to access persisting data, this will be
   * stored here.
   */
  createUpdateLoopData: {}
};

/**
 * Starts calling all methods within the create update loop.
 * @param {number} timeInterval The timeout interval to be used.
 */
function startCreateUpdateLoop(timeInterval) {
  setInterval(async () => {
    workstationBase.createUpdateLoop.forEach(async (func) => {
      await func();
    });
  }, timeInterval);
}

/**
 * goes through all the workstations, checking to see if a workstation could be expanded left or
 * right to fill partners if they are empty. Leaving no empty spots of the workstation if possible.
 * (if a row is missing a element, then it will remain empty).
 */
function expandWorkstationsIfPossible(configurations) {
  for (let index = 0; index < configurations.length; index += 1) {
    const configuration = configurations[index];
    const { position } = configuration;

    if (position % 2 === 0 || position === 0) {
      const partnerElement = configurations.filter((x) => x.position === position + 1);
      if (partnerElement.length === 0) configuration.position = `${position}${position + 1}`;
    } else {
      const partnerElement = configurations.filter((x) => x.position === position - 1);
      if (partnerElement.length === 0) configuration.position = `${position - 1}${position}`;
    }
  }
}

/**
 * Adds a google map location to a provided div with the className
 * @param {string | number} latitude The latitude of the location being shown.
 * @param {string | number} longitude the longitude of the location being shown.
 * @param {string | number} zoom the amount of zoom on the map.
 * @param {string} className The class name of the div displaying the data.
 */
function loadGoogleMapsWithLocation(className, latitude, longitude, zoom, showPointer) {
  const name = className.startsWith('.') ? className : `.${className}`;
  const location = document.querySelector(name);

  // load the given map onto the page.
  const map = new google.maps.Map(location, {
    center: new google.maps.LatLng(latitude, longitude),
    zoom: parseFloat(zoom),
    disableDefaultUI: true
  });

  // if the configuration marks that they want to show the pointer then we should load the pointer
  // into the map. This is will be the same point in which the center will locate it into.
  if (showPointer) {
    new google.maps.Marker({
      position: new google.maps.LatLng(latitude, longitude),
      map
    });
  }
}

/**
 * Gets the raw data for a given city and country, will ignore the code if its null.
 * @param {string} city The city to gather the news for.
 * @param {string} countryCode The given country code to gather the weather for.
 */
async function getWeatherData(city, countryCode) {
  if (utilities.isNil(countryCode)) {
    return window.api.weather.byCity(city);
  }

  return window.api.weather.byCityAndCode(city, countryCode);
}

/**
 * Binds the raw news data within the corrisponding div.
 * @param {string} className The class name to set the content by.
 */
function setWeatherContent(className) {
  const name = className.startsWith('.') ? className : `.${className}`;
  const location = document.querySelector(name);

  const data = workstationBase.createUpdateLoopData[`${className}-weather`];

  const temperature = location.querySelector('.weather-temperature');
  const place = location.querySelector('.weather-location');
  const image = location.querySelector('.weather-icon');
  const extra = location.querySelector('.weather-extra');

  image.innerHTML = utilities.getWeatherIconForType(data.weather[0].icon);

  place.textContent = `${data.name}, ${data.sys.country}`;
  temperature.innerHTML = `${data.main.temp}`;

  if (!utilities.isNil(data.wind)) {
    extra.lastElementChild.textContent = `${data.wind.speed}`;
  }

  if (!utilities.isNil(data.rain)) {
    const content = utilities.isNil(data.rain['3h']) ? data.rain['3h'] : data.rain['1h'];
    extra.lastElementChild.textContent = `${content || 0}`;
  }
}

/**
 * Gets the news based on the provided country and category.
 * @param {string} country The country code of the news location.
 * @param {string | null} category The category of the news location.
 */
async function getNewsData(country, category) {
  if (utilities.isNil(category)) {
    return window.api.news.topCountry(country);
  }

  return window.api.news.topCountryCategory(country, category);
}

/**
 * Binds the article data to the class object (news only).
 * @param {string} className The class name to set the content by.
 * @param {object} article The news article.
 */
function setNewsContent(className, article) {
  const name = className.startsWith('.') ? className : `.${className}`;
  const location = document.querySelector(name);

  if (utilities.isNil(article.content)) article.content = article.description;
  if (utilities.isNil(article.content)) article.content = '';

  article.content = article.content.substring(0, 260);

  location.querySelector('.news-title').textContent = article.title;
  location.querySelector('.news-content').firstElementChild.textContent = `${article.content}`;
  location.querySelector('.news-content').lastElementChild.textContent = `Author: ${article.author}, ${
    article.source.name
  }`;

  location.querySelector('.news-image').firstElementChild.src = article.urlToImage;
}

/**
 * Put a message into the page letting the user know the news failed to load.
 * @param {string} className The class name of the message that will be put about missing news.
 * @param {string} country The country code of the news location.
 * @param {string | null} category The category of the news location.
 */
function setNewsContentMissing(className, country, category) {
  const name = className.startsWith('.') ? className : `.${className}`;
  const location = document.querySelector(name);

  location.classList.add('news-error');
  Array.from(location.children).forEach((node) => node.remove());

  const errorContainer = document.createElement('div');
  const message = document.createElement('div');
  const news = document.createElement('div');

  message.textContent = workstationBase.lang.data.errors.loadNews;
  news.textContent = `Country: ${country}${utilities.isNil(category) ? '' : `, category: ${category}`}`;

  errorContainer.appendChild(message);
  errorContainer.appendChild(news);

  location.appendChild(errorContainer);
}

/** *******************************************
 * VIDEO
 ******************************************* */

/**
 * Sets the content of the video object.
 * @param {string} className The class name to set the content by.
 * @param {string} videoSrc The source of the video.
 * @param {boolean} videoLoop If the video should loop or not.
 * @param {boolean} videoSound If the video should have sound or not.`
 */
function setVideoContent(className, videoSrc, videoLoop, videoSound) {
  const name = className.startsWith('.') ? className : `.${className}`;
  const location = document.querySelector(name);

  const video = location.querySelector('video');
  const loop = Boolean(videoLoop);
  const sound = Boolean(videoSound);

  if (!sound && !isNaN(sound)) {
    video.setAttribute('oncanplay', 'this.muted=true');
    video.setAttribute('muted', !sound);
  }

  if (loop && !isNaN(loop)) {
    video.setAttribute('loop', loop);
  }

  video.setAttribute('autoplay', true);

  const sourceElement = document.createElement('source');
  sourceElement.type = `video/${videoSrc.split('.').pop()}` || 'video/mp4';
  sourceElement.src = videoSrc;

  video.appendChild(sourceElement);

  sourceElement.addEventListener('error', (event) => {
    event.preventDefault();

    location.firstElementChild.remove();

    const message = document.createElement('span');
    message.textContent = workstationBase.lang.data.errors.loadVideoSrc;

    location.appendChild(message);
  });

  // due to the future implementations of the video controls, some browsers will not automatically
  // play the video. This means we are going to fight with the browser to try and play this video.
  // At the current point in time we can just delay the playing.
  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play
  setTimeout(() => video.play(), 1000);
}

/**
 * Loads the video into the page.
 * @param {string} className The class name to set the content by.
 * @param {string} videoSrc The source of the video.
 * @param {boolean} videoLoop If the video should loop or not.
 * @param {boolean} videoSound If the video should have sound or not.`
 */
function loadVideo(className, videoSrc, videoLoop, videoSound) {
  const dataLocation = `${className}-video`;

  workstationBase.createUpdateLoopData[dataLocation] = {
    videoSrc,
    videoLoop,
    videoSound
  };

  if (!utilities.isNil(videoSrc)) {
    setVideoContent(className, videoSrc, videoLoop, videoSound);
  }
}

/** *******************************************
 * COUNTDOWN
 ******************************************* */

/**
 * marks the countdown as ended, updating the ui to reflect the changes that have been made. This
 * will be displaying the title, a message stating the coutndown has ended and when it ended at.
 * @param {string} className the class name to direct the location of the countdown.
 */
function setCountdownEnded(className) {
  const location = `${className}-countdown`;
  const { endDate, endTime, title, started } = workstationBase.createUpdateLoopData[location];

  // mark it as ended.
  workstationBase.createUpdateLoopData[location].ended = true;

  // make sure to clear the interval no matter what. (stopping any continue iteration of the countdown)
  clearInterval(workstationBase.createUpdateLoopData[location].remainingTimer);

  // there is no reason to mark the countdown as ended if its already ended or not even started yet.
  if (!started) return;

  // get the actual div location of the countdown, we can then use this to set the required end
  // countdown information.
  const name = className.startsWith('.') ? className : `.${className}`;
  const countdownObject = document.querySelector(name);

  const endDateTime = new Date(`${endDate} ${endTime}`);

  countdownObject.children[0].textContent = title;
  countdownObject.children[0].style.margin = 'auto 0 0 0';

  countdownObject.children[1].textContent = `The countdown has finished, it finished at:`;
  countdownObject.children[1].classList.toggle('countdown-middle-ended');
  countdownObject.children[1].classList.toggle('countdown-ended');
  countdownObject.children[1].style.margin = 'auto';

  countdownObject.children[2].textContent = endDateTime.toLocaleString();
  countdownObject.children[2].classList.toggle('countdown-ended');
  countdownObject.children[2].style.margin = '0 0 auto 0';
}

/**
 * On Every tick updates the ui to reflect the remaining days, hours, minutes and seconds. At any
 * time if the countdown completes it will call into the set countdown end method, no longer
 * updating the ui to reflect the time left.
 * @param {string} className the class name to direct the location of the countdown.
 */
function setCountdownRemainingTime(className) {
  const location = `${className}-countdown`;

  const { startDate, startTime, endDate, endTime, started, ended } = workstationBase.createUpdateLoopData[
    location
  ];

  // if this manages to get called and we have not actually started yet then just finish early. Or
  // if the countdown has already ended we don't want the chance of breaking it by attempting to
  // reset content that probably no longer exists.
  if (!started || ended) return;

  // get the actual div location of the countdown, we can update the remaining time.
  const name = className.startsWith('.') ? className : `.${className}`;
  const countdownObject = document.querySelector(name);

  // used to check to see if we have passed our end time, we can use this to see if we have finished
  // / display that the countdown has completed or not.
  const startDateTime = new Date(`${startDate} ${startTime}`);
  const endDateTime = new Date(`${endDate} ${endTime}`);

  // the start date has passed and we can now setup the actual countdown to the expected date time.
  if (startDateTime.getTime() < Date.now() && endDateTime.getTime() < Date.now()) {
    workstationBase.createUpdateLoopData[location].ended = true;
    setCountdownEnded(className);
  } else {
    const currentDate = new Date();
    const difference = endDateTime.getTime() - currentDate.getTime();

    const seconds = 1000;
    const minutes = seconds * 60;
    const hours = minutes * 60;
    const days = hours * 24;

    const daysLeft = Math.floor(difference / days);
    const hoursLeft = Math.floor((difference % days) / hours);
    const minutesLeft = Math.floor((difference % hours) / minutes);
    const secondsLeft = Math.floor((difference % minutes) / seconds);

    countdownObject.children[1].innerHTML = `
    <div><div class="countdown-number">${daysLeft}</div>days</div></div>
    <div><div class="countdown-number">${hoursLeft}</div>hours</div></div>
    <div><div class="countdown-number">${minutesLeft}</div>minutes</div></div>
    <div><div class="countdown-number">${secondsLeft}</div>seconds</div></div>
    `;
  }
}

/**
 * Sets the remaining countdown for the given user on the screen, calculating the remaining days,
 * hours, minutes and seconds. This will also call into ending the countdown if it finishes.
 * @param {string} className the class name to direct the location of the countdown.
 */
function setCountdownStarted(className) {
  const location = `${className}-countdown`;
  const { ended, title } = workstationBase.createUpdateLoopData[location];

  // mark it as started.
  workstationBase.createUpdateLoopData[location].started = true;

  // there is no reason for us to call into displaying information about the workstation countdown
  // starting yet if the countdown has already started, this could be called into when the
  // function is sitting at the end of a event listener after the countdown has started during a
  // session in which it was not started yet.
  if (ended) return;

  // get the actual div location of the countdown, we can update the title.
  const name = className.startsWith('.') ? className : `.${className}`;
  const countdownObject = document.querySelector(name);

  // update the title and clear the bottom line as we will just be counting down constantly and
  // there is no need for the bottom line at the moment.
  countdownObject.children[0].textContent = title;
  countdownObject.children[2].textContent = '';

  // making sure to set our timeout to be a couple of seconds, in this time out checker is where we
  // will be checking to see if the time has passed or not. In which we will use to set that the
  // coutndown has ended.
  workstationBase.createUpdateLoopData[location].remainingTimer = setInterval(
    setCountdownRemainingTime.bind(this, className),
    1000
  );

  // make sure to set the countdown remaining now before the first second, this will make for a
  // cleaner affect for the user, not having to see the instant jump from nothing to countdown.
  setCountdownRemainingTime(className);
}

/**
 * Checks to see if the countdown has started, if so call into the starting method and end the
 * looping of this method. This is called into and set as a interval when the countdown is added to
 * the page but has not started yet. Checking until it has started and starting the countdown.
 * @param {string} className the class name to direct the location of the countdown.
 */
function checkCountdownStarted(className) {
  const location = `${className}-countdown`;

  const { startDate, startTime, endDate, endTime } = workstationBase.createUpdateLoopData[location];

  const startDateTime = new Date(`${startDate} ${startTime}`);
  const endDateTime = new Date(`${endDate} ${endTime}`);

  // check to see if the countdown has started and begin the countdown. Making sure to clear the
  // existing countdown interval which is being used to check to see if it has started.
  if (startDateTime.getTime() < Date.now() && endDateTime.getTime() > Date.now()) {
    clearInterval(workstationBase.createUpdateLoopData[location].startingTimer);
    setCountdownStarted(className);
  }
}

/**
 * Sets the current countdown that is at the provided class name as not started, letting the user
 * know about it not starting and when it will be starting at.
 * @param {string} className the class name to direct the location of the countdown.
 */
function setCountdownNotStarted(className) {
  const location = `${className}-countdown`;
  const { startDate, startTime, started, ended, title } = workstationBase.createUpdateLoopData[location];

  // there is no reason for us to call into displaying information about the workstation countdown
  // not starting yet if the countdown has already started, this could be called into when the
  // function is sitting at the end of a event listener after the countdown has started during a
  // session in which it was not started yet.
  if (started || ended) return;

  // get the actual div location of the countdown, we can then use this to set the required start
  // countdown information.
  const name = className.startsWith('.') ? className : `.${className}`;
  const countdownObject = document.querySelector(name);

  const startDateTime = new Date(`${startDate} ${startTime}`);

  countdownObject.children[0].textContent = title;
  countdownObject.children[0].style.margin = 'auto 0 0 0';

  countdownObject.children[1].textContent = `The countdown has not started, it starts at:`;
  countdownObject.children[1].classList.toggle('countdown-middle-ended');
  countdownObject.children[1].classList.toggle('countdown-ended');
  countdownObject.children[1].style.margin = 'auto';

  countdownObject.children[2].textContent = startDateTime.toLocaleString();
  countdownObject.children[2].classList.toggle('countdown-ended');
  countdownObject.children[2].style.margin = '0 0 auto 0';

  // setup the checker to start the countdown ui for the user if the countdown starts at anypoint
  // during the time the application is running. Five seconds check as there is no point checking
  // every second as this is overkill. Generally countdowns are a large time span, a overlap of up
  // to 5 seconds before it starts is no real worry.
  workstationBase.createUpdateLoopData[location].startingTimer = setInterval(
    checkCountdownStarted.bind(this, className),
    5000
  );
}

/**
 * Loads all the countdown information into the given class name position, sets up the ticks which
 * will be used to countdown the time and trigger events based on when the countdown has started
 * which will be used to determine if the next stage of the workstation has started or the countdown
 * has ended.
 * @param {string} className The class name to set the content by.
 * @param {string} title The title of the given date time.
 * @param {string} startDate The start date of the given countdown (don't start until this time).
 * @param {string} startTime The start time of the given countdown (don't start until this time).
 * @param {string} endDate The ending date of the countdown.
 * @param {string} endTime The end time of the given countdown.
 */
function setCountdownContent(className, title, startDate, startTime, endDate, endTime) {
  const location = `${className}-countdown`;

  // first lets build up how the actual date time object will look like based on the information
  // that we have been given, we can then use this to determine if we are counting down to the start
  // of the countdown or starting the countdown.
  const startDateTime = new Date(`${startDate} ${startTime}`);
  const endDateTime = new Date(`${endDate} ${endTime}`);

  // if we have not started the countdown yet then we are going to want to display to the user that
  // they have not started the countdown yet and it will start at the start time provided.
  if (startDateTime.getTime() > Date.now()) {
    workstationBase.createUpdateLoopData[location].started = false;
    setCountdownNotStarted(className);
  }

  // we have passed the actual start time and we have completed the countdown, this means that we
  // can tell the user that the countdown has now completed by displaying information about the
  // title that the user gave.
  if (startDateTime.getTime() < Date.now() && endDateTime.getTime() > Date.now()) {
    workstationBase.createUpdateLoopData[location].started = true;
    setCountdownStarted(className);
  }

  // the start date has passed and we can now setup the actual countdown to the expected date time.
  if (startDateTime.getTime() < Date.now() && endDateTime.getTime() < Date.now()) {
    workstationBase.createUpdateLoopData[location].started = true;
    workstationBase.createUpdateLoopData[location].ended = true;
    setCountdownEnded(className);
  }
}

/**
 * Loads all the countdown information into workstation memory and start the process of setting all
 * the data into the page.
 * @param {string} className The class name to set the content by.
 * @param {string} title The title of the given date time.
 * @param {string} startDate The start date of the given countdown (don't start until this time).
 * @param {string} startTime The start time of the given countdown (don't start until this time).
 * @param {string} endDate The ending date of the countdown.
 * @param {string} endTime The end time of the given countdown.
 */
function loadCountdown(className, title, startDate, startTime, endDate, endTime) {
  const countdownLocation = `${className}-countdown`;

  workstationBase.createUpdateLoopData[countdownLocation] = {
    title,
    startDate,
    startTime,
    endDate,
    endTime,
    started: false,
    ended: false
  };

  setCountdownContent(className, title, startDate, startTime, endDate, endTime);
}

/** *******************************************
 * IMAGE
 ******************************************* */

/**
 * Binds the image source to the class object.
 * @param {string} className The class name to set the content by.
 */
function setImageContent(className) {
  const name = className.startsWith('.') ? className : `.${className}`;
  const location = document.querySelector(name);

  const data = workstationBase.createUpdateLoopData[`${className}-image`];
  const image = new Image();

  image.src = data.imageSource;
  image.alt = data.imageAlt || 'Image';

  location.appendChild(image);

  image.addEventListener('error', (event) => {
    event.preventDefault();

    location.firstElementChild.remove();

    const message = document.createElement('span');
    message.textContent = workstationBase.lang.data.errors.loadImgSrc;

    location.appendChild(message);
  });
}

/**
 * Loads a fresh div containing the image into the page.
 * @param {string} className The class name of the containing div.
 * @param {string} imageSource The image source that will be loaded.
 * @param {string} imageAlt The image alt dislay name.
 */
function loadImage(className, imageSource, imageAlt) {
  const dataLocation = `${className}-image`;

  workstationBase.createUpdateLoopData[dataLocation] = { imageSource, imageAlt };
  if (!utilities.isNil(imageSource)) setImageContent(className);
}

/** *******************************************
 * WEATHER
 ******************************************* */

/**
 * Binds the raw news data within the corrisponding div.
 * @param {string} className The class name to set the content by.
 * @param {string} city The city name that the weather failed with.
 * @param {string} code The country code the weather failed with.
 * @param {string} errorMessage The error that occured during the process.
 */
function setWeatherError(className, city, code, errorMessage) {
  const name = className.startsWith('.') ? className : `.${className}`;
  const container = document.querySelector(name);

  // the content div that will contain the display message and error if one was passed.
  const error = document.createElement('div');
  error.classList.add('weather-error');

  // appneding the display message after getting the translation.
  const content = document.createElement('div');
  const displayMessage = workstationBase.lang.data.errors.loadWeather;
  content.textContent = `${displayMessage} (${city}, ${code})`;
  error.appendChild(content);

  // if and only if the error message was passed, create another div containing this error message.
  // This cannot be translated as its coming from a external site. Which does not allow for giving
  // it language codes for translation.
  if (!utilities.isNil(errorMessage)) {
    const errorDiv = document.createElement('div');
    errorDiv.classList.add('weather-error');
    errorDiv.textContent = errorMessage;

    error.appendChild(errorDiv);
  }

  // the quickest way to remove all the template divs from the weather container is to set the inner
  // HTML to empty. which means we casn then just insert our error container div which will be the
  // only div within the weather section of the dom.
  container.classList.add('weather-container-error');
  container.innerHTML = '';
  container.appendChild(error);
}

/**
 * Loads the current weather into the web page.
 * @param {string} className The clas name containing the weather div.
 * @param {string} city The city name that the weather will be gathering for.
 * @param {string} code The country code the weather will be gathering for.
 */
async function loadWeather(className, city, code) {
  const dataLocation = `${className}-weather`;

  const data = await getWeatherData(city, code);
  workstationBase.createUpdateLoopData[dataLocation] = data;

  // our request was completed properly but a error was returned from the external site, generally
  // returned with a error message on the data object.
  if (Number(data.cod) !== 200) {
    return setWeatherError(className, city, code, data.message);
  }

  // we failed to actually perfrom the request properly, we don't have a displaying error message.
  // But if no error message is given, no error message div will be created.
  if (data.status !== 200) {
    return setWeatherError(className, city, code);
  }

  // no errors which means we are confident that our data object contains all the required
  // information to start displaying the correct weather information in the given section of the
  // grid.
  return setWeatherContent(className);
}

/**
 * Updates the exiting news column with updated content (if the content has changed);
 * @param {string} className The clas name containing the weather div.
 * @param {string} city The city name that the weather will be gathering for.
 * @param {string} code The country code the weather will be gathering for.
 */
async function refreshWeather(className, city, code) {
  const dataLocation = `${className}-weather`;

  const updatedData = await getWeatherData(city, code);
  const oldData = workstationBase.createUpdateLoopData[dataLocation];

  // validate that the calculation time of the new data is actually newer before attempting to
  // update any of the content.
  if (!utilities.isNil(updatedData.dt) && !utilities.isNil(oldData.dt) && updatedData.dt !== oldData.dt) {
    workstationBase.createUpdateLoopData[dataLocation] = updatedData;
    setWeatherContent(className);
  }
}

/** *******************************************
 * NEWS
 ******************************************* */

/**
 * Loads a fresh div containing all the related news information.
 * @param {string} className The class name containing the div.
 * @param {string} country The country code of the news location.
 * @param {string | null} category The category of the news location.
 */
async function loadNews(className, country, category) {
  const dataLocation = `${className}-news`;

  workstationBase.createUpdateLoopData[dataLocation] = await getNewsData(country, category);
  workstationBase.createUpdateLoopData[dataLocation].selectedIndex = 0;

  if (!utilities.isNil(workstationBase.createUpdateLoopData[dataLocation].articles)) {
    const { selectedIndex } = workstationBase.createUpdateLoopData[dataLocation];
    const article = workstationBase.createUpdateLoopData[dataLocation].articles[selectedIndex];

    if (!utilities.isNil(article)) setNewsContent(className, article);
    else setNewsContentMissing(className, country, category);
  }
}

/**
 * Updates a existing div containing all the related news information.
 * @param {string} className The class name containing the div.
 * @param {string} country The country code of the news location.
 * @param {string | null} category The category of the news location.
 */
async function refreshNews(className, country, category) {
  const dataLocation = `${className}-news`;

  let news = workstationBase.createUpdateLoopData[dataLocation];
  let selectedIndex = news.selectedIndex + 1;

  // only refresh the news content if we have actually ran out of news articals to be rotating
  // through, otherwise just move onto the next news artical.
  if (utilities.isNil(news) || selectedIndex >= news.articles.length) {
    workstationBase.createUpdateLoopData[dataLocation] = await getNewsData(country, category);
    workstationBase.createUpdateLoopData[dataLocation].selectedIndex = 0;

    news = workstationBase.createUpdateLoopData[dataLocation];
    selectedIndex = 0;
  }

  if (!utilities.isNil(news.articles)) {
    const article = news.articles[selectedIndex];
    setNewsContent(className, article);

    // make sure to update the index if the value has changed.
    workstationBase.createUpdateLoopData[dataLocation].selectedIndex += 1;
  }
}

/** *******************************************
 * NEWS END
 ******************************************* */

async function checkWorkstationConfigurationValidation(parameters) {
  const { username, id } = parameters;
  const { modified } = workstationBase.createUpdateLoopData;

  const workstationModified = await window.api.workstations.getModifiedDateTimeByUsernameAndId(username, id);

  // check if we need to refresh the whole configuration page as the underlining configuration has
  // changed.
  if (modified < workstationModified.modified) {
    window.location.reload(true);
  }
}

/**
 * Displays a error message to the user that cannot be closed (navigate away)
 * @param {error} error The error message that will be displayed.
 */
function displayWorkstationError(error) {
  if (error.status == null) error.status = 400;

  const lang = workstationBase.lang.data;

  switch (error.status) {
    case 401:
    case 403:
      error.error = 'Ownership';
      error.description = lang.errors.ownership;
      break;
    default:
  }

  utilities.displayImmutableErrorDisplay(error, workstationBase.lang, (content) => {
    if (!workstationBase.authenticated) {
      content.template.querySelector('.immutable-error-go').innerHTML += ` ${
        lang.general.or
      } <a href="/login">${lang.login.login}</a>?`;
    }

    content.show();
  });
}

/**
 * Updates the server overlay with the workstation display name and the user name of the current
 * workstation, must make sure that the workstation is gathered (with the parameters user + id)
 */
function updateServerOverlay(display, username) {
  const serverOverlay = document.querySelector('.server-overlay');

  if (!utilities.isNil(serverOverlay)) {
    serverOverlay.firstElementChild.textContent += `: ${display} - ${username}`;
  }
}

/**
 * Takes in a workstation configuration and adds it to the current page.
 * @param {object} configuration
 */
async function addWorkstationConfigurationToPage(configuration) {
  const classPosition = `pos-${configuration.position}`;
  const container = document.querySelector('.workstation-positions-container');

  const configurationTemplate = document.getElementById(`template-${configuration.name}`);
  const configurationEl = configurationTemplate.cloneNode(true).content.firstElementChild;

  configurationEl.classList.add(classPosition);
  configurationEl.classList.add('positions');
  configurationEl.classList.add(configuration.name);

  // make sure to add the workstation configuration to the panel before we attempt to actually act
  // on the configuration.
  container.appendChild(configurationEl);
  const { configuration: config } = configuration;

  switch (configuration.name) {
    case 'location':
      const { map, zoom, show_pointer: showPointer } = config;
      loadGoogleMapsWithLocation(classPosition, map.latitude, map.longitude, zoom, showPointer);
      break;
    case 'news':
      const { country, category } = config;
      await loadNews(classPosition, country, category);
      workstationBase.createUpdateLoop.push(refreshNews.bind(this, classPosition, country, category));
      break;
    case 'weather':
      const { city, code } = config;
      await loadWeather(classPosition, city, code);
      workstationBase.createUpdateLoop.push(refreshWeather.bind(this, classPosition, city, code));
      break;
    case 'image':
      const { image_src: imageSource, image_alt: imageAlt } = config;
      loadImage(classPosition, imageSource, imageAlt);
      break;
    case 'video':
      const { video_src: videoSrc, video_loop: videoLoop, video_sound: videoSound } = config;
      loadVideo(classPosition, videoSrc, videoLoop, videoSound);
      break;
    case 'countdown':
      const { start_date: startDate, start_time: startTime, end_date: endDate, end_time: endTime } = config;
      loadCountdown(classPosition, config.title, startDate, startTime, endDate, endTime);
      break;
    default:
  }
}

/**
 * Validates the parameters by gathering the workstation, otherwise errors.
 * @param {*} parameters The user and id from the url.
 */
async function buildAndDisplayWorkstation(parameters) {
  const workstation = await window.api.workstations.getByUsernameAndId(parameters.username, parameters.id);
  const restrictions = await window.api.workstations.restrictions();

  // Remove everything that is greater than the max size of a workstation, incase for any reason it
  // made it through.
  if (workstation.configuration.length > restrictions.WORKSTATION_MAX_SIZE) {
    workstation.configuration.length = restrictions.WORKSTATION_MAX_SIZE;
  }

  workstationBase.workstation = workstation;

  // adds the configurations to the page.
  expandWorkstationsIfPossible(workstation.configuration);
  workstation.configuration.forEach(async (config, index) => {
    await addWorkstationConfigurationToPage(config, index);
  });

  workstationBase.createUpdateLoopData.modified = workstation.modified;
  workstationBase.createUpdateLoop.push(checkWorkstationConfigurationValidation.bind(this, parameters));

  updateServerOverlay(workstation.display, utilities.capitalize(parameters.username));
}

/**
 * Marks the current workstation as authenticated, this is used as a reference to display related
 * information when the workstation fails to load for any reason, letting the user go to management
 * or to the home/login page. This is here just to help with UI components.
 */
function markAsAuthenticated() {
  workstationBase.authenticated = true;
}

/**
 *  As soon as the API is ready we can create the language controller for displaying related
 *  information on the page. This uses the api controller for getting the related language
 *  information so its required for it to be ready first.
 */
function setupLanguageController() {
  workstationBase.lang = new LanguageController(window.api);
  workstationBase.lang.initialize().catch(displayWorkstationError);
}

/**
 * Attempts to gather the workstation by the user id and username provided.
 * 1. if public workstation will be returned.
 * 2. if not public but authenticated owner, workstation will be returned.
 * 3. if not public and not authenticated or authenticated as not owner, no workstation returned.
 */
async function initWorkstation() {
  try {
    // first gather and validate that we got some useful parameters from the URL, these parameters
    // are what are required to gather and get the related workstation, otherwise throw and display
    // this related error message.
    const parameters = utilities.getUrlParameters(['id', 'username'], workstationBase.lang);
    if (parameters.error) throw parameters.error;

    // set the parameters if they are fully valid, just incase we need to regather them later on.
    workstationBase.parameters = parameters.parameters;

    // lets go and build and display all the components, dynamically loading all the related modules
    // to keep the speed high, not loading in all the related components.
    await buildAndDisplayWorkstation(workstationBase.parameters);

    // start the update process, this will call into all related refresh methods on the modules if
    // they exist, if they don't exist on the module then they will not be called. A example of this
    // would be keeping the news relevant and up to date after iterating through all related news.
    startCreateUpdateLoop(1000 * 10);

    // go and remove the loading screen now as everything should be good to go.
    utilities.removeFullScreenLoading();
  } catch (error) {
    displayWorkstationError(error);
  }
}

// Due to the process that we do support that there exists public workstations we will allow for the
// creation process to start with authenticated or not authenticated. If the workstation is private
// and the user is not authenticated then the init process will throw a error and close down the
// process.
window.addEventListener('authentication-ready', initWorkstation);
window.addEventListener('authentication-failed', initWorkstation);

// As soon as the API is ready we can create the language controller for displaying related
// information on the page. This uses the api controller for getting the related language
// information so its required for it to be ready first.
window.addEventListener('api-ready', setupLanguageController);

// If we are authenticated then just mark that we are, just helps with creation of uni components on
// the page for later on, if and only if a error occurs.
window.addEventListener('authentication-ready', markAsAuthenticated);
