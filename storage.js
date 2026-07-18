const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('./config');

const STATE_FILE = path.join(DATA_DIR, 'vessel-state.json');
const EVENTS_FILE = path.join(DATA_DIR, 'crossings.jsonl');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Стан кожного судна (остання позиція, тип, час останнього зарахованого проходу)
// Зберігається, щоб не втрачати контекст при перезапуску скрипта
function loadState() {
  ensureDataDir();
  if (!fs.existsSync(STATE_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (e) {
    console.error('Не вдалось прочитати vessel-state.json, стартуємо з чистого:', e.message);
    return {};
  }
}

let saveTimeout = null;
function saveState(state) {
  ensureDataDir();
  // Дебаунс: не пишемо на диск на кожне окреме AIS-повідомлення
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state));
  }, 2000);
}

// Кожен зафіксований прохід дописується окремим рядком у JSONL-файл
// (append-only — просто і надійно, не потребує бази даних)
function appendCrossingEvent(event) {
  ensureDataDir();
  fs.appendFileSync(EVENTS_FILE, JSON.stringify(event) + '\n');
}

function readAllEvents() {
  ensureDataDir();
  if (!fs.existsSync(EVENTS_FILE)) return [];
  return fs
    .readFileSync(EVENTS_FILE, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

module.exports = { loadState, saveState, appendCrossingEvent, readAllEvents };
