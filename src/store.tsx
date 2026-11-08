import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  AIRPORTS, Airport, Cabin, DAYS, Flight, TAX_RATE, airport, generateFlights, seatExtra, seatRow,
} from './data';

export type Trip = 'oneway' | 'round';
export type Search = { from: Airport; to: Airport; dayIdx: number; retIdx: number; trip: Trip; pax: number; cabin: Cabin };
export type Passenger = { first: string; last: string; email: string; phone: string };
export type Booking = {
  id: string; pnr: string; flight: Flight; date: Date; ret?: Flight; retDate?: Date; cabin: Cabin;
  seats: string[]; pax: Passenger[]; total: number; gate: string; terminal: string; boards: number;
};

type Store = {
  search: Search;
  setSearch: (p: Partial<Search>) => void;
  flight: Flight | null;
  setFlight: (f: Flight | null) => void;
  retFlight: Flight | null;
  setRetFlight: (f: Flight | null) => void;
  seats: string[];
  setSeats: (s: string[]) => void;
  passengers: Passenger[];
  setPassengers: (p: Passenger[]) => void;
  bookings: Booking[];
  book: () => Booking;
  tab: number;
  setTab: (n: number) => void;
  pricing: () => { fare: number; taxes: number; seatsTotal: number; total: number };
};

const Ctx = createContext<Store>(null as unknown as Store);
export const useStore = () => useContext(Ctx);

const rand = (chars: string, n: number) =>
  Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

function seedTrip(): Booking {
  const from = airport('ABV');
  const to = airport('LOS');
  const date = DAYS[5];
  const flight = generateFlights(from, to, date, 'Economy')[2];
  return {
    id: 'seed', pnr: 'MRD4QX', flight, date, cabin: 'Economy', seats: ['14A'],
    pax: [{ first: 'Ada', last: 'Okafor', email: 'ada@example.com', phone: '08012345678' }],
    total: Math.round(flight.price * (1 + TAX_RATE)), gate: 'B7', terminal: '1', boards: flight.depart - 40,
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [search, setS] = useState<Search>({
    from: AIRPORTS[0], to: airport('LHR'), dayIdx: 3, retIdx: 9, trip: 'round', pax: 1, cabin: 'Economy',
  });
  const [flight, setFlight] = useState<Flight | null>(null);
  const [retFlight, setRetFlight] = useState<Flight | null>(null);
  const [seats, setSeats] = useState<string[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [bookings, setBookings] = useState<Booking[]>(() => [seedTrip()]);
  const [tab, setTab] = useState(0);

  const setSearch = useCallback((p: Partial<Search>) => {
    setS((s) => {
      const n = { ...s, ...p };
      if (n.retIdx < n.dayIdx) n.retIdx = Math.min(DAYS.length - 1, n.dayIdx + 3);
      return n;
    });
  }, []);

  const pricing = useCallback(() => {
    if (!flight) return { fare: 0, taxes: 0, seatsTotal: 0, total: 0 };
    const legs = flight.price + (search.trip === 'round' && retFlight ? retFlight.price : 0);
    const fare = legs * search.pax;
    const taxes = Math.round(fare * TAX_RATE);
    const seatsTotal = seats.reduce((n, s) => n + seatExtra(seatRow(s)), 0);
    return { fare, taxes, seatsTotal, total: fare + taxes + seatsTotal };
  }, [flight, retFlight, search.trip, search.pax, seats]);

  const book = useCallback((): Booking => {
    const f = flight!;
    const b: Booking = {
      id: rand('abcdef0123456789', 8),
      pnr: rand('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6),
      flight: f, date: DAYS[search.dayIdx],
      ret: search.trip === 'round' && retFlight ? retFlight : undefined,
      retDate: search.trip === 'round' && retFlight ? DAYS[search.retIdx] : undefined,
      cabin: search.cabin, seats, pax: passengers,
      total: pricing().total,
      gate: rand('ABCD', 1) + (1 + Math.floor(Math.random() * 18)),
      terminal: String(1 + Math.floor(Math.random() * 3)),
      boards: f.depart - 40,
    };
    setBookings((x) => [b, ...x]);
    return b;
  }, [flight, retFlight, search, seats, passengers, pricing]);

  const value = useMemo(
    () => ({ search, setSearch, flight, setFlight, retFlight, setRetFlight, seats, setSeats, passengers, setPassengers, bookings, book, tab, setTab, pricing }),
    [search, setSearch, flight, retFlight, seats, passengers, bookings, book, tab, pricing],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
