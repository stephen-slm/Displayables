const WORKSTATION_MAX_SIZE = 6;
const WORKSTATION_MAX_TOTAL = 9;

const WORKSTATION_DEFAULT = [
  {
    name: 'location',
    configuration: { map: { latitude: 50.7993, longitude: -1.0978 }, zoom: 10, show_pointer: false },
    position: 0
  },
  {
    name: 'image',
    configuration: {
      image_src: 'https://i.imgur.com/HvQnwm1.png'
    },
    position: 1
  },
  { name: 'news', configuration: { country: 'gb', category: 'technology' }, position: 5 },
  {
    name: 'video',
    configuration: {
      video_src: 'https://www.quirksmode.org/html5/videos/big_buck_bunny.webm',
      video_loop: true,
      video_sound: false
    },
    position: 3
  },
  { name: 'weather', configuration: { city: 'Portsmouth', code: 'gb' }, position: 2 },
  {
    name: 'countdown',
    configuration: {
      start_date: '2019-04-13',
      start_time: '12:24',
      end_date: '2019-12-31',
      end_time: '23:59',
      title: 'New Year! 🎉'
    },
    position: 4
  }
];

module.exports = {
  RESTRICTIONS: {
    WORKSTATION_MAX_SIZE,
    WORKSTATION_MAX_TOTAL
  },
  WORKSTATION_DEFAULT
};
