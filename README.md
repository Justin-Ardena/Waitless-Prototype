# WaitLess Demo

Modernized Jeepney Passenger Information and Monitoring System (prototype).
All data is simulated and stored in this browser's localStorage (key `waitless-demo-v1`).

## Run
Open `index.html` in a browser (internet needed for React CDN). Or serve the folder: `npx serve .` or `python3 -m http.server`.

## Structure
```
src/utils.js  - Helpers: React shortcut, storage key, time formatting
src/data/seed.js  - Sample demonstration dataset (routes, vehicles, demand, traffic, alerts)
src/store.js  - Shared store: localStorage persistence + subscription (useS/set)
src/logic.js  - Route geometry, vehicle status, ETA with traffic, fares
src/simulation.js  - Simulated GPS/LoRaWAN movement and approaching-vehicle alerts
src/components/MapView.js  - Schematic SVG map: heatmaps, commuters, vehicles, tooltip
src/components/shared.js  - Shared UI: badges, layers button, draggable bottom sheet, cards, trip planner
src/views/commuter.js  - Commuter app: login, welcome splash, map + bottom sheet
src/views/cooperative.js  - Cooperative dashboard
src/views/pao.js  - PAO field monitor
src/app.js  - Display Views selector, demo controls, app shell
src/main.js  - Entry point
css/styles.css  - all styling (white + blue theme, phone/monitor frames, responsive rules)
index.html      - loads scripts in dependency order
```

Scripts are classic (non-module) files that share globals, so the load order in index.html matters.
