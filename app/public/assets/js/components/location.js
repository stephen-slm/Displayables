// short hand notation to stop repetitive verbose code to stay the same thing over and over again
// when interacting within the dom. Used to simplify code reading and code style + improve usage.
const $ = document.querySelector.bind(document);

/**
 * Adds a google map location to a provided div with the className
 * @param {string | number} latitude The latitude of the location being shown.
 * @param {string | number} longitude the longitude of the location being shown.
 * @param {string | number} zoom the amount of zoom on the map.
 * @param {string} className The class name of the div displaying the data.
 */
export function loadGoogleMap(className, latitude, longitude, zoom, showPointer) {
  const name = className.startsWith('.') ? className : `.${className}`;
  const location = $(name);

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
 * Loads a google map onto the page within the related long and latitude. Using the provided zoom
 * level to focus on the center point.
 * @param {string} position The position on the page that the map will be loaded.
 * @param {object} configuration The configuration related object for maps.
 */
export function start(position, configuration) {
  const { map, zoom, show_pointer: showPointer } = configuration;
  this.loadGoogleMap(position, map.latitude, map.longitude, zoom, showPointer);
}

export default {
  start,
  loadGoogleMap
};
