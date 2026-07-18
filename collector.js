require('dotenv').config();
const WebSocket = require('ws');
const config = require('./config');
const { getShipCategory } = require('./vesselTypes');
const { loadState, saveState, appendCrossingEvent } = require('./storage');

// vesselState: { [mmsi]: { lastLat, lastLon, shipType, name, lastCrossingAt } }
const vesselState = loadState();

// TEMP DEBUG: раз на хвилину показувати, скільки позицій реально прийшло
let positionCount = 0;
setInterval(() => {
  console.log(`📡 Отримано позицій за останню хвилину: ${positionCount}`);
  positionCount = 0;
}, 60000);

function withinCrossingLatRange(lat) {
  const [minLat, maxLat] = config.CROSSING_LAT_RANGE;
  return lat >= minLat && lat <= maxLat;
}

// Повертає 'east', 'west' або null, якщо перетину не було
function detectCrossing(prevLon, newLon, lat) {
  const line = config.CROSSING_LONGITUDE;
  const h = config.HYSTERESIS;

  if (!withinCrossingLatRange(lat)) return null;

  // Зі заходу на схід — вихід із протоки в бік Індійського океану
  if (prevLon < line - h && newLon >= line + h) return 'east';
  // Зі сходу на захід — вхід у протоку/Перську затоку
  if (prevLon > line + h && newLon <= line - h) return 'west';

  return null;
}

function canRecordCrossing(vessel) {
  if (!vessel.lastCrossingAt) return true;
  const hoursSince = (Date.now() - vessel.lastCrossingAt) / 3_600_000;
  return hoursSince >= config.DEDUPLICATION_WINDOW_HOURS;
}

function connect() {
  const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');

  ws.on('open', () => {
    console.log('Підключено до AISstream, підписуюсь на регіон протоки...');
    const subscriptionMessage = {
      Apikey: config.AISSTREAM_API_KEY,
      BoundingBoxes: [config.BOUNDING_BOX],
      FilterMessageTypes: ['PositionReport', 'ShipStaticData'],
    };
    console.log('Відправляю підписку:', JSON.stringify(subscriptionMessage));
    ws.send(JSON.stringify(subscriptionMessage));
  });

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    // TEMP DEBUG: подивитись, що реально приходить від сервера
    if (msg.error || !msg.MessageType) {
      console.log('⚠️  Службове повідомлення від AISstream:', JSON.stringify(msg));
    }

    const mmsi = msg?.MetaData?.MMSI;
    if (!mmsi) return;

    if (!vesselState[mmsi]) {
      vesselState[mmsi] = {
        lastLat: null,
        lastLon: null,
        shipType: null,
        name: msg?.MetaData?.ShipName?.trim() || null,
        lastCrossingAt: null,
      };
    }
    const vessel = vesselState[mmsi];

    // Статичні дані судна (тип, назва) приходять окремим типом повідомлення
    if (msg.MessageType === 'ShipStaticData') {
      const data = msg.Message?.ShipStaticData;
      if (data) {
        vessel.shipType = data.Type;
        if (data.Name) vessel.name = data.Name.trim();
      }
      saveState(vesselState);
      return;
    }

    if (msg.MessageType === 'PositionReport') {
      const pos = msg.Message?.PositionReport;
      if (!pos) return;

      positionCount++;
      const newLat = pos.Latitude;
      const newLon = pos.Longitude;

      if (vessel.lastLon != null && canRecordCrossing(vessel)) {
        const direction = detectCrossing(vessel.lastLon, newLon, newLat);
        if (direction) {
          const event = {
            mmsi,
            name: vessel.name,
            shipType: vessel.shipType,
            category: getShipCategory(vessel.shipType),
            direction, // 'east' (вихід) або 'west' (вхід)
            timestamp: new Date().toISOString(),
            lat: newLat,
            lon: newLon,
          };
          appendCrossingEvent(event);
          vessel.lastCrossingAt = Date.now();
          console.log(`⛴  Перетин: ${event.name || mmsi} [${event.category}] → ${direction}`);
        }
      }

      vessel.lastLat = newLat;
      vessel.lastLon = newLon;
      saveState(vesselState);
    }
  });

  ws.on('close', () => {
    console.log("З'єднання розірвано, перепідключення через 5с...");
    setTimeout(connect, 5000);
  });

  ws.on('error', (err) => {
    console.error('WebSocket помилка:', err.message);
  });
}

if (config.AISSTREAM_API_KEY === 'YOUR_API_KEY_HERE') {
  console.error('⚠️  Встав свій AISSTREAM_API_KEY у .env перед запуском (див. README.md)');
  process.exit(1);
}

connect();