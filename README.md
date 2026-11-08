# Meridian — flight booking (Expo SDK 58, React Native 0.88)

Instrument navy and brass on pale sky, after an antique desk globe. Full flow on local sample data (no server):
Splash, search (one way or round trip), results (outbound then return), flight detail, seats, travellers, payment, boarding pass, trips.

## Run
```bash
npm install
npx expo start
```
If the store version of Expo Go doesn't open SDK 58 projects yet, use a development build:
```bash
npx expo run:ios      # macOS + Xcode
npx expo run:android  # Android Studio / device
```

## Where things live
- `src/theme.ts` — colors, type scale, radii, **motion tokens** (change these to retheme or re-time everything)
- `src/globeData.ts` — generated dotted world map (Natural Earth 110m land, orthographic projection)
- `src/data.ts` — airports, deterministic flight generator, seat maps
- `src/store.tsx` — all app state (search, selection, bookings)
- `src/nav/Navigator.tsx` — custom depth-stack navigator (previous screen scales back as the next rises)
- `src/ui/*` — Globe (orbit + logo), Arc (route + plane), SlideToPay, Field, Sheet, Pass (3D tilt), Roll (odometer), Tap
- `src/screens/*` — one file per screen

## Swapping in a real backend later
Replace `generateFlights` / `takenSeats` in `src/data.ts` and `book()` in `src/store.tsx` with API calls; screens only read from the store.

Test card: tap "Use test card" on the payment screen. Sample traveller: "Fill sample details".
