# WaitLess Prototype

**Modernized Jeepney Passenger Information and Fleet Monitoring System**

> [!NOTE]
> **AI-Assisted Build**: This prototype was built and architected through AI-assisted pair-programming using Google DeepMind's Antigravity AI coding assistant. The AI assisted across domain logic engineering, spatial SVG map geometry, reactive state store design, responsive design system styling, and modular codebase restructuring.

---

## What is this Prototype?

**WaitLess** is an interactive, zero-build concept prototype designed for the **Public Utility Vehicle Modernization Program (PUVMP)** in the Philippines. It demonstrates an interconnected public transit ecosystem that bridges the gap between **commuters**, **transport cooperatives**, and **on-ground Passenger Assistance Officers (PAOs)**.

In Philippine public transit, passengers often endure unpredictable waiting times, unknown seat availability, and unannounced route congestion. At the same time, transport cooperatives often lack unified telemetry tools to monitor vehicle operations, and field officers have no digitized way to report localized road bottlenecks.

WaitLess simulates a real-time IoT and telemetry data pipeline connecting three key operational personas:

```
[Modernized Jeepney GPS] ──(LoRaWAN / Cellular)──► [IoT Gateway & Server] ──► [WaitLess Core Engine]
                                                                                     │
                       ┌─────────────────────────────────────────────────────────────┼─────────────────────────────────────────┐
                       ▼                                                             ▼                                         ▼
         📱 Commuter Mobile App                                      🖥️ Cooperative Dashboard                    📍 PAO Field Monitor
   • Traffic-adjusted arrival ETAs                             • Real-time fleet health & dispatch         • Stop congestion & queue meters
   • Live seat availability (Full/Limited)                     • Passenger demand heatmaps                 • Road condition & incident logs
   • LTFRB-compliant fare calculator                           • Multi-screen monitor displays             • Instant escalation to HQ
   • Proximity approaching alerts                              • Dynamic fare matrix settings
```

### Simulated Telemetry Pipeline
All data in this demonstration is client-side simulated and persistently saved in the browser's `localStorage` (`waitless-demo-v1`):
- **GPS Movement**: Vehicles dynamically traverse defined coordinate polylines, turnaround at terminals, and emit status pings.
- **LoRaWAN Link Simulation**: Users can toggle or sever the simulated wireless telemetry link from demo controls to observe fallback behavior (e.g. stale data detection).
- **Interactive Scenarios**: Built-in triggers allow simulating vehicle breakdowns, heavy traffic jams, sudden passenger demand surges, and seat capacity shortages.

---

## User Interfaces & Personas

| View | Target User | Key Capabilities |
| :--- | :--- | :--- |
| **Commuter App** | Daily Passengers | Animated welcoming onboarding, route search, schematic route map, draggable bottom sheet, trip planner with nearest-stop pin locator, LTFRB fare matrix (regular & discounted), and approaching vehicle notifications. |
| **Cooperative Dashboard** | Fleet Operators & Dispatchers | Executive KPI tiles (active, at terminal, out of service, stale data), live fleet table, route management, demand heatmap analysis, operational alert acknowledgments, and dual-screen second monitor mode (`#map`). |
| **PAO Mobile Terminal** | Ground Transit Officers | Handheld field monitoring console, queue density meters, traffic incident tracker, and direct observation submission that escalates alerts to dispatchers. |

---

## Quick Start

- **Direct Launch**: Double-click `index.html` directly in any modern web browser (internet connection required for the React CDN).
- **Local HTTP Server**:
  ```bash
  # Node.js
  npx serve .
  # or Python
  python -m http.server 3000
  ```

---

## Architectural Structure

The codebase is organized into clear architectural layers:

```
Waitless Prototype/
├── index.html                   # HTML entry point, font links, and classic script loader
├── css/
│   └── styles.css               # Consolidated design system, tokens, device frames, and responsive styles
└── src/
    ├── utils.js                 # React shortcuts, time formatting, coordinate math, and storage keys
    ├── data/
    │   └── seed.js              # Initial seed datasets (routes, fleet, demand hotspots, traffic, alerts)
    ├── store.js                 # Centralized reactive store with localStorage persistence & pub/sub
    ├── logic.js                 # Route geometry, spatial interpolation, ETAs with traffic, and fare calculations
    ├── simulation.js            # Simulated GPS/LoRaWAN telemetry, terminal turnarounds, and proximity alerts
    ├── components/
    │   ├── MapView.js           # Interactive schematic SVG map with heatmaps, markers, and tooltip cards
    │   └── shared.js            # Reusable UI components (DraggableSheet, Badge, TripPlanner, Cards, LayersBtn)
    ├── views/
    │   ├── commuter.js          # Commuter passenger app (onboarding splash, trip planner, live vehicles, alerts)
    │   ├── cooperative.js       # Cooperative fleet operations dashboard (KPIs, fleet table, route management)
    │   └── pao.js               # Passenger Assistance Officer (PAO) field monitoring & incident reporting
    ├── app.js                   # Application shell, view mode switcher, device mockup toggles, and demo controls
    └── main.js                  # Root router mounting logic with dynamic hash-based navigation (#map)
```

---

## Key Modules & Responsibilities

### 1. State & Persistence (`src/store.js`, `src/data/seed.js`)
- **Reactive Store**: Uses `useSyncExternalStore` for flicker-free React re-renders.
- **Cross-Tab / Multi-Monitor Sync**: Automatically synchronizes state changes across browser windows via the `storage` event (enabling dual-screen `#map` operation).
- **Action Helpers**: Encapsulates common state mutations (`updateVehicle`, `addAlert`, `toggleSimulation`, `toggleLink`, etc.).

### 2. Domain & Calculation Logic (`src/logic.js`)
- **Spatial Interpolation (`getPositionOnRoute`)**: Computes exact `[x, y]` coordinates along multi-segment route polylines given progress `0.0 <= p <= 1.0`.
- **Traffic-Adjusted ETA (`calculateEta`)**: Evaluates geometric distance, reference speed, and real-time congestion multipliers (`Light`, `Moderate`, `Heavy`).
- **Statutory Fare Matrix (`calculateFare`)**: Calculates standard fares (base fare + distance rate) and mandatory 20% statutory discounts for Students, Seniors, and PWDs.

### 3. Simulation Engine (`src/simulation.js`)
- Simulates bidirectional vehicle movement along routes with automatic terminal turnarounds.
- Periodically updates telemetry heartbeat timestamps when the simulated LoRaWAN link is active.
- Evaluates geofenced proximity to passenger watch targets and dispatches in-app notification toasts.

### 4. Interactive Schematic Map (`src/components/MapView.js`)
- Vector SVG rendering of city blocks, landmarks, rivers, and transit corridors.
- Multi-layer visualization:
  - Passenger demand heatmaps with radial gradients
  - Road traffic congestion overlays
  - Active vehicle markers with operational status colors
  - Commuter dots and geofenced alert rings
  - Interactive "You are here" commuter pin with radar animation
  - Detailed hover and click vehicle diagnostic inspection cards

### 5. Multi-Persona User Interfaces
- **Commuter App (`src/views/commuter.js`)**: Passenger journey planner, animated splash screen with Modernized Jeepney graphic, live seat availability, route stops selector, and approaching-vehicle alerts.
- **Cooperative Dashboard (`src/views/cooperative.js`)**: Fleet operations center featuring operational KPI metric tiles, real-time vehicle management table, route management, fare matrix configuration, dispatch suggestions, and dual-screen split view support.
- **PAO Field Monitor (`src/views/pao.js`)**: Mobile field console for ground officers to track passenger queue density with progress meters, road congestion levels, and quick incident reporting that broadcasts alerts to headquarters.

---

## Code Quality & Conventions

- **Clean Naming**: Every function, constant, and parameter uses descriptive names (`getRouteById`, `calculateFare`, `formatTimeAgo`, `calculateEta`, etc.).
- **Backward-Compatible Aliases**: Classic shorthand aliases (`h`, `S`, `set`, `useS`, `rt`, `pos`, `info`, `plen`, `TF`, `FD`, `B`, `lvC`, etc.) are preserved for full compatibility.
- **Zero Build Requirement**: Runs directly in the browser via classic scripts without requiring Babel, Webpack, or npm install steps.
- **Namespaced Globals**: Modules export clean interfaces to window namespaces (`WaitLessUtils`, `WaitLessData`, `WaitLessStore`, `WaitLessLogic`, `WaitLessSimulation`, `WaitLessComponents`, `WaitLessShared`, `WaitLessViews`, `WaitLessApp`).
