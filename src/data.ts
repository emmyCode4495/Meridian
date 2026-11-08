export type Cabin = 'Economy' | 'Premium' | 'Business';
export type Airport = {
  code: string;
  city: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  hue: [string, string];
};

const H: [string, string][] = [
  ['#DCEAF6', '#A9C9E4'],
  ['#E3EEDC', '#B5D2A9'],
  ['#F4E8CC', '#E2C98C'],
  ['#E0E3F5', '#B3BBE6'],
  ['#F3E0E6', '#DBAFC1'],
  ['#D9EEEA', '#9FD0C6'],
];

const raw: [string, string, string, string, number, number][] = [
  ['ABV', 'Abuja', 'Nnamdi Azikiwe Intl', 'Nigeria', 9.0068, 7.2632],
  ['LOS', 'Lagos', 'Murtala Muhammed Intl', 'Nigeria', 6.5774, 3.3212],
  ['PHC', 'Port Harcourt', 'Port Harcourt Intl', 'Nigeria', 5.0155, 6.9496],
  ['KAN', 'Kano', 'Mallam Aminu Kano Intl', 'Nigeria', 12.0476, 8.5246],
  ['ENU', 'Enugu', 'Akanu Ibiam Intl', 'Nigeria', 6.4743, 7.5619],
  ['ACC', 'Accra', 'Kotoka Intl', 'Ghana', 5.6052, -0.1668],
  ['NBO', 'Nairobi', 'Jomo Kenyatta Intl', 'Kenya', -1.3192, 36.9278],
  ['JNB', 'Johannesburg', 'O.R. Tambo Intl', 'South Africa', -26.1392, 28.246],
  ['CAI', 'Cairo', 'Cairo Intl', 'Egypt', 30.1219, 31.4056],
  ['DXB', 'Dubai', 'Dubai Intl', 'UAE', 25.2532, 55.3657],
  ['IST', 'Istanbul', 'Istanbul Airport', 'Türkiye', 41.2753, 28.7519],
  ['LHR', 'London', 'Heathrow', 'United Kingdom', 51.47, -0.4543],
  ['CDG', 'Paris', 'Charles de Gaulle', 'France', 49.0097, 2.5479],
  ['AMS', 'Amsterdam', 'Schiphol', 'Netherlands', 52.3105, 4.7683],
  ['JFK', 'New York', 'John F. Kennedy Intl', 'United States', 40.6413, -73.7781],
  ['YYZ', 'Toronto', 'Pearson Intl', 'Canada', 43.6777, -79.6248],
  ['SIN', 'Singapore', 'Changi', 'Singapore', 1.3644, 103.9915],
];

export const AIRPORTS: Airport[] = raw.map(([code, city, name, country, lat, lon], i) => ({
  code, city, name, country, lat, lon, hue: H[i % H.length],
}));
export const airport = (code: string) => AIRPORTS.find((a) => a.code === code) ?? AIRPORTS[0];

export const AIRLINES = [
  { code: 'AX', name: 'Aero Meridian', color: '#C28E2B' },
  { code: 'NB', name: 'Niger Bird', color: '#1F8A70' },
  { code: 'SK', name: 'Skyline Atlas', color: '#4C73C9' },
  { code: 'EV', name: 'Everest Air', color: '#D2822E' },
  { code: 'HL', name: 'Halo Jet', color: '#B25A83' },
];

// ---- helpers ----------------------------------------------------------
export function distanceKm(a: Airport, b: Airport) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function seeded(seedStr: string) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const weekday = (d: Date) => WD[d.getDay()];
export const monthShort = (d: Date) => MO[d.getMonth()];
export const fmtDate = (d: Date) => `${WD[d.getDay()]} ${d.getDate()} ${MO[d.getMonth()]}`;
const pad = (n: number) => String(n).padStart(2, '0');
export const fmtTime = (min: number) => `${pad(Math.floor((min % 1440) / 60))}:${pad(min % 60)}`;
export const fmtDur = (min: number) => `${Math.floor(min / 60)}h ${pad(min % 60)}m`;
export const money = (n: number) => '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const today = new Date();
today.setHours(0, 0, 0, 0);
export const DAYS: Date[] = Array.from({ length: 21 }, (_, i) => {
  const d = new Date(today);
  d.setDate(d.getDate() + i + 1);
  return d;
});

// ---- flights ----------------------------------------------------------
export type Flight = {
  id: string;
  airline: (typeof AIRLINES)[number];
  number: string;
  from: Airport;
  to: Airport;
  depart: number;
  arrive: number;
  duration: number;
  stops: number;
  via?: Airport;
  layover?: number;
  price: number; // per traveller
  aircraft: string;
  tags: ('Best' | 'Cheapest' | 'Fastest')[];
};

export const CABIN_MULT: Record<Cabin, number> = { Economy: 1, Premium: 1.9, Business: 3.4 };
export const CABIN_BAGS: Record<Cabin, string> = { Economy: '1 × 23 kg', Premium: '2 × 23 kg', Business: '2 × 32 kg' };
const AIRCRAFT = ['Airbus A350-900', 'Boeing 787-9', 'Airbus A330-300', 'Boeing 737 MAX 8', 'Embraer E195-E2'];

export function generateFlights(from: Airport, to: Airport, date: Date, cabin: Cabin): Flight[] {
  const rng = seeded(`${from.code}-${to.code}-${date.toDateString()}`);
  const dist = distanceKm(from, to);
  const hubs = ['DXB', 'IST', 'AMS', 'CDG'].filter((c) => c !== from.code && c !== to.code);
  const list: Flight[] = [];
  for (let i = 0; i < 7; i++) {
    const airline = AIRLINES[Math.floor(rng() * AIRLINES.length)];
    const oneStop = dist > 5500 && rng() < 0.45;
    const via = oneStop ? airport(hubs[Math.floor(rng() * hubs.length)]) : undefined;
    const layover = oneStop ? 80 + Math.floor(rng() * 120) : undefined;
    let duration = Math.round(35 + (dist / 820) * 60 + (dist > 3000 ? 20 : 0));
    if (oneStop && layover) duration += layover + 55;
    const depart = 5 * 60 + Math.floor((rng() * 17 * 60) / 5) * 5;
    const base = (70 + dist * 0.065) * (0.85 + rng() * 0.5) * (oneStop ? 0.82 : 1);
    list.push({
      id: `${airline.code}${100 + Math.floor(rng() * 800)}-${i}`,
      airline,
      number: `${airline.code} ${100 + Math.floor(rng() * 800)}`,
      from, to, depart,
      arrive: depart + duration + (to.lon - from.lon) * 4 * 0, // local-time offsets omitted for the demo
      duration,
      stops: oneStop ? 1 : 0,
      via, layover,
      price: Math.round(base * CABIN_MULT[cabin]),
      aircraft: AIRCRAFT[Math.floor(rng() * AIRCRAFT.length)],
      tags: [],
    });
  }
  list.sort((a, b) => a.depart - b.depart);
  const cheapest = list.reduce((m, f) => (f.price < m.price ? f : m));
  const fastest = list.reduce((m, f) => (f.duration < m.duration ? f : m));
  const score = (f: Flight) => f.price / cheapest.price + f.duration / fastest.duration;
  const best = list.reduce((m, f) => (score(f) < score(m) ? f : m));
  cheapest.tags.push('Cheapest');
  fastest.tags.push('Fastest');
  if (!best.tags.length) best.tags.push('Best');
  return list;
}

// ---- seats ------------------------------------------------------------
export const SEAT_COLS = ['A', 'B', 'C', 'D', 'E', 'F'];
export const SEAT_ROWS = 26;
export const EXIT_ROWS = [12, 13];
export const seatExtra = (row: number) => (row <= 5 ? 24 : EXIT_ROWS.includes(row) ? 14 : 0);

export function takenSeats(flightId: string): Set<string> {
  const rng = seeded('seats-' + flightId);
  const s = new Set<string>();
  for (let r = 1; r <= SEAT_ROWS; r++)
    for (const c of SEAT_COLS) if (rng() < 0.34) s.add(`${r}${c}`);
  return s;
}
export const seatRow = (seat: string) => parseInt(seat, 10);

export const TAX_RATE = 0.12;
