// short hand notation to stop repetitive verbose code to stay the same thing over and over again
// when interacting within the dom. Used to simplify code reading and code style + improve usage.
const $ = document.querySelector.bind(document);

/**
 * Sets the content of the video object.
 * @param {string} className The class name to set the content by.
 * @param {string} videoSrc The source of the video.
 * @param {boolean} videoLoop If the video should loop or not.
 * @param {boolean} videoSound If the video should have sound or not.`
 */
function setVideoContent(className, videoSrc, videoLoop, videoSound) {
  const name = className.startsWith('.') ? className : `.${className}`;
  const location = $(name);

  const video = location.querySelector('video');
  const loop = Boolean(videoLoop);
  const sound = Boolean(videoSound);

  // If the user has selected to not use sound go and set it as muted and force the muting of the
  // video as soon as the video can play. This is a bit of a work around as the muted attribute no
  // longer works in newer browsers.
  if (!sound && !isNaN(sound)) {
    video.setAttribute('oncanplay', 'this.muted=true');
    video.setAttribute('muted', !sound);
  }

  // If the user selected to loop the video endlessly then set the loop attribute to true, beware
  // this is a little annoying if there is both sound and looping.
  if (loop && !isNaN(loop)) {
    video.setAttribute('loop', loop);
  }

  // auto play because 🤷‍, this will break in future browser versions and we would have to locate a
  // way of playing the video as soon as possible. We will probably end up fighting with the
  // browser.
  video.setAttribute('autoplay', true);

  const sourceElement = document.createElement('source');
  sourceElement.type = `video/${videoSrc.split('.').pop()}` || 'video/mp4';
  sourceElement.src = videoSrc;

  video.appendChild(sourceElement);

  // due to the future implementations of the video controls, some browsers will not automatically
  // play the video. This means we are going to fight with the browser to try and play this video.
  // At the current point in time we can just delay the playing.
  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play
  setTimeout(() => video.play(), 1000);

  // if for whatever reason we could not load the video on the page this will go and strip out all
  // the video content and just display the translated error message about it not being able to
  // load. generally the event did not have any related error messages.
  sourceElement.addEventListener('error', (event) => {
    event.preventDefault();

    location.firstElementChild.remove();

    const message = document.createElement('span');
    message.textContent = this.language.errors.loadVideoSrc;

    location.appendChild(message);
  });
}

/**
 * Loads the video into the page.
 * @param {string} className The class name to set the content by.
 * @param {string} videoSrc The source of the video.
 * @param {boolean} videoLoop If the video should loop or not.
 * @param {boolean} videoSound If the video should have sound or not.`
 */
function start(className, config) {
  const { video_src: videoSrc, video_loop: videoLoop, video_sound: videoSound } = config;
  const dataLocation = `${className}-video`;

  this.instance[dataLocation] = {
    videoSrc,
    videoLoop,
    videoSound
  };

  if (!this._.isNil(videoSrc)) {
    this.setVideoContent(className, videoSrc, videoLoop, videoSound);
  }
}

export default {
  start,
  setVideoContent
};
