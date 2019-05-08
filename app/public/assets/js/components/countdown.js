// short hand notation to stop repetitive verbose code to stay the same thing over and over again
// when interacting within the dom. Used to simplify code reading and code style + improve usage.
const $ = document.querySelector.bind(document);

/**
 * marks the countdown as ended, updating the ui to reflect the changes that have been made. This
 * will be displaying the title, a message stating the countdown has ended and when it ended at.
 * @param {string} className the class name to direct the location of the countdown.
 */
export function setCountdownEnded(className) {
  const location = `${className}-countdown`;
  const { endDate, endTime, title, started } = this.instance[location];

  // mark it as ended.
  this.instance[location].ended = true;

  // make sure to clear the interval no matter what. (stopping any continue iteration of the countdown)
  clearInterval(this.instance[location].remainingTimer);

  // there is no reason to mark the countdown as ended if its already ended or not even started yet.
  if (!started) return;

  // get the actual div location of the countdown, we can then use this to set the required end
  // countdown information.
  const name = className.startsWith('.') ? className : `.${className}`;
  const countdownObject = $(name);

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
export function setCountdownRemainingTime(className) {
  const location = `${className}-countdown`;

  const { startDate, startTime, endDate, endTime, started, ended } = this.instance[location];

  // if this manages to get called and we have not actually started yet then just finish early. Or
  // if the countdown has already ended we don't want the chance of breaking it by attempting to
  // reset content that probably no longer exists.
  if (!started || ended) return;

  // get the actual div location of the countdown, we can update the remaining time.
  const name = className.startsWith('.') ? className : `.${className}`;
  const countdownObject = $(name);

  // used to check to see if we have passed our end time, we can use this to see if we have finished
  // / display that the countdown has completed or not.
  const startDateTime = new Date(`${startDate} ${startTime}`);
  const endDateTime = new Date(`${endDate} ${endTime}`);

  // the start date has passed and we can now setup the actual countdown to the expected date time.
  if (startDateTime.getTime() < Date.now() && endDateTime.getTime() < Date.now()) {
    this.instance[location].ended = true;
    this.setCountdownEnded(className);
  } else {
    const currentDate = new Date();
    const difference = endDateTime.getTime() - currentDate.getTime();

    const seconds = 1000;
    const minutes = seconds * 60;
    const hours = minutes * 60;
    const days = hours * 24;

    // determine the time left for each major displaying section of the countdown.
    const daysLeft = Math.floor(difference / days);
    const hoursLeft = Math.floor((difference % days) / hours);
    const minutesLeft = Math.floor((difference % hours) / minutes);
    const secondsLeft = Math.floor((difference % minutes) / seconds);

    // using inner html here is cleaner and easier to use than constantly creating nested div
    // content with settings classes and text Content. Which would result in so much over
    // complicating processes.
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
export function setCountdownStarted(className) {
  const location = `${className}-countdown`;
  const { ended, title } = this.instance[location];

  // mark it as started.
  this.instance[location].started = true;

  // there is no reason for us to call into displaying information about the workstation countdown
  // starting yet if the countdown has already started, this could be called into when the
  // export function is sitting at the end of a event listener after the countdown has started during a
  // session in which it was not started yet.
  if (ended) return;

  // get the actual div location of the countdown, we can update the title.
  const name = className.startsWith('.') ? className : `.${className}`;
  const countdownObject = $(name);

  // update the title and clear the bottom line as we will just be counting down constantly and
  // there is no need for the bottom line at the moment.
  countdownObject.children[0].textContent = title;
  countdownObject.children[2].textContent = '';

  // making sure to set our timeout to be a couple of seconds, in this time out checker is where we
  // will be checking to see if the time has passed or not. In which we will use to set that the
  // countdown has ended.
  this.instance[location].remainingTimer = setInterval(setCountdownRemainingTime.bind(this, className), 1000);

  // make sure to set the countdown remaining now before the first second, this will make for a
  // cleaner affect for the user, not having to see the instant jump from nothing to countdown.
  this.setCountdownRemainingTime(className);
}

/**
 * Checks to see if the countdown has started, if so call into the starting method and end the
 * looping of this method. This is called into and set as a interval when the countdown is added to
 * the page but has not started yet. Checking until it has started and starting the countdown.
 * @param {string} className the class name to direct the location of the countdown.
 */
function checkCountdownStarted(className) {
  const location = `${className}-countdown`;

  const { startDate, startTime, endDate, endTime } = this.instance[location];

  const startDateTime = new Date(`${startDate} ${startTime}`);
  const endDateTime = new Date(`${endDate} ${endTime}`);

  // check to see if the countdown has started and begin the countdown. Making sure to clear the
  // existing countdown interval which is being used to check to see if it has started.
  if (startDateTime.getTime() < Date.now() && endDateTime.getTime() > Date.now()) {
    clearInterval(this.instance[location].startingTimer);
    this.setCountdownStarted(className);
  }
}

/**
 * Sets the current countdown that is at the provided class name as not started, letting the user
 * know about it not starting and when it will be starting at.
 * @param {string} className the class name to direct the location of the countdown.
 */
function setCountdownNotStarted(className) {
  const location = `${className}-countdown`;
  const { startDate, startTime, started, ended, title } = this.instance[location];

  // there is no reason for us to call into displaying information about the workstation countdown
  // not starting yet if the countdown has already started, this could be called into when the
  // export function is sitting at the end of a event listener after the countdown has started during a
  // session in which it was not started yet.
  if (started || ended) return;

  // get the actual div location of the countdown, we can then use this to set the required start
  // countdown information.
  const name = className.startsWith('.') ? className : `.${className}`;
  const countdownObject = $(name);

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
  this.instance[location].startingTimer = setInterval(checkCountdownStarted.bind(this, className), 5000);
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
    this.instance[location].started = false;
    this.setCountdownNotStarted(className);
  }

  // we have passed the actual start time and we have completed the countdown, this means that we
  // can tell the user that the countdown has now completed by displaying information about the
  // title that the user gave.
  if (startDateTime.getTime() < Date.now() && endDateTime.getTime() > Date.now()) {
    this.instance[location].started = true;
    this.setCountdownStarted(className);
  }

  // the start date has passed and we can now setup the actual countdown to the expected date time.
  if (startDateTime.getTime() < Date.now() && endDateTime.getTime() < Date.now()) {
    this.instance[location].started = true;
    this.instance[location].ended = true;
    this.setCountdownEnded(className);
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
function start(className, config) {
  const { start_date: startDate, start_time: startTime, end_date: endDate, end_time: endTime } = config;
  const countdownLocation = `${className}-countdown`;

  this.instance[countdownLocation] = {
    title: config.title,
    startDate,
    startTime,
    endDate,
    endTime,
    started: false,
    ended: false
  };

  this.setCountdownContent(className, config.title, startDate, startTime, endDate, endTime);
}

export default {
  start,
  setCountdownContent,
  setCountdownNotStarted,
  setCountdownStarted,
  setCountdownRemainingTime,
  setCountdownEnded
};
