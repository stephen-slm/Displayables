// short hand notation to stop repetitive verbose code to stay the same thing over and over again
// when interacting within the dom. Used to simplify code reading and code style + improve usage.
const $ = document.querySelector.bind(document);

/**
 * Binds the image source to the class object.
 * @param {string} className The class name to set the content by.
 */
function setImageContent(className) {
  const name = className.startsWith('.') ? className : `.${className}`;
  const location = $(name);

  const data = this.instance[`${className}-image`];
  const image = new Image();

  image.src = data.imageSource;
  image.alt = data.imageAlt || 'Image';

  location.appendChild(image);

  image.addEventListener('error', (event) => {
    event.preventDefault();

    location.firstElementChild.remove();

    const message = document.createElement('span');
    message.textContent = this.language.errors.loadImgSrc;

    location.appendChild(message);
  });
}

/**
 * Loads a fresh div containing the image into the page.
 * @param {string} className The class name of the containing div.
 * @param {string} imageSource The image source that will be loaded.
 * @param {string} imageAlt The image alt display name.
 */
function start(className, config) {
  const { image_src: imageSource, image_alt: imageAlt } = config;
  const dataLocation = `${className}-image`;

  this.instance[dataLocation] = { imageSource, imageAlt };
  if (!this._.isNil(imageSource)) this.setImageContent(className);
}

export default {
  start,
  setImageContent
};
