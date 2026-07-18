require('dotenv').config();
const express = require('express');
const { readAllEvents } = require('./storage');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/api/events', (req, res) => {
  const events = readAllEvents().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  res.json(events.slice(0, 200)); // останні 200 подій
});

app.get('/api/stats', (req, res) => {
  const events = readAllEvents();
  const byCategory = {};
  const totals = { east: 0, west: 0 };

  for (const e of events) {
    const cat = e.category || 'Unknown';
    if (!byCategory[cat]) byCategory[cat] = { east: 0, west: 0 };
    byCategory[cat][e.direction]++;
    totals[e.direction]++;
  }

  res.json({
    totalEvents: events.length,
    totals,
    byCategory,
    lastUpdated: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущено: http://localhost:${PORT}`);
});
