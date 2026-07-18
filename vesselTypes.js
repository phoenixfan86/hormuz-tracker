// AIS ship type code -> людська категорія
// Довідник кодів: https://api.vtexplorer.com/docs/ref-aistypes.html
function getShipCategory(typeCode) {
  if (typeCode == null) return 'Unknown';
  const t = Number(typeCode);

  if (t >= 60 && t <= 69) return 'Passenger';
  if (t >= 70 && t <= 79) return 'Cargo';
  if (t >= 80 && t <= 89) return 'Tanker';
  if (t >= 30 && t <= 32) return 'Fishing';
  if (t === 36 || t === 37) return 'Sailing / Pleasure craft';
  if (t >= 40 && t <= 49) return 'High-speed craft';
  if (t >= 50 && t <= 59) return 'Special craft (tug, pilot, SAR...)';
  if (t >= 1 && t <= 19) return 'Reserved';

  return 'Other';
}

module.exports = { getShipCategory };
