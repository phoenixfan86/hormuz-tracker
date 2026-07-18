module.exports = {
  // Ключ AISstream.io — отримати безкоштовно на https://aisstream.io/authenticate
  AISSTREAM_API_KEY: process.env.AISSTREAM_API_KEY || 'YOUR_API_KEY_HERE',

  // Bounding box навколо Ормузької протоки: [[minLat, minLon], [maxLat, maxLon]]
  // Трохи ширший за саму протоку, щоб ловити судна на підході
  BOUNDING_BOX: [[26.2, 56.12], [27.6, 56.44]],

  // Умовний меридіан — лінія, перетин якої і рахуємо (довгота)
  CROSSING_LONGITUDE: 56.23,

  // Діапазон широт, у якому перетин цієї довготи вважається проходом протоки
  // (щоб не рахувати судна, що перетинають той самий меридіан десь далеко в морі)
  CROSSING_LAT_RANGE: [26.2, 27.2],

  // Гістерезис у градусах довготи — захист від "тремтіння" GPS-сигналу біля лінії
  HYSTERESIS: 0.02,

  // Через скільки годин той самий MMSI можна знову зарахувати як новий прохід
  DEDUPLICATION_WINDOW_HOURS: 6,

  DATA_DIR: './data',
};
