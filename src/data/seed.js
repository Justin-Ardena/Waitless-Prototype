/**
 * WaitLess Prototype - Seed Data
 *
 * Provides initial demonstration datasets for:
 * - Modernized Jeepney routes with schematic coordinates & pickup stops
 * - Fleet vehicles with statuses, seat capacity, and GPS progress
 * - Passenger demand hotspots along routes
 * - Traffic congestion levels & incident reports
 * - Passenger Assistance Officer (PAO) field observations
 * - Operational system alerts
 */

/**
 * Creates and returns fresh seed data for the application.
 * @returns {Object} Complete initial state object
 */
function createInitialSeedData() {
  const timestamp = now();

  // Route definitions with map geometry (pts) and designated stops (pick)
  const routes = [
    {
      id: 'r1',
      name: 'Tagbak',
      from: 'Tagbak Terminal',
      to: 'City Proper',
      pts: [
        [8, 58],
        [24, 48],
        [42, 42],
        [62, 30],
        [90, 16],
      ],
      pick: formatPickupPoints([
        ['Tagbak Terminal', 0],
        ['Jaro Plaza', 0.5],
        ['City Proper', 1],
      ]),
      active: true,
    },
    {
      id: 'r2',
      name: 'Fundidor',
      from: 'Fundidor Terminal',
      to: 'SM City',
      pts: [
        [10, 15],
        [30, 22],
        [48, 36],
        [70, 46],
        [92, 56],
      ],
      pick: formatPickupPoints([
        ['Fundidor Terminal', 0],
        ['Mandurriao Stop', 0.45],
        ['SM City pickup', 1],
      ]),
      active: true,
    },
    {
      id: 'r3',
      name: 'Mandurriao–Hibao-an',
      from: 'Mandurriao',
      to: 'Hibao-an',
      pts: [
        [14, 35],
        [34, 32],
        [52, 34],
        [72, 26],
        [88, 34],
      ],
      pick: formatPickupPoints([
        ['Mandurriao', 0],
        ['Airport Road', 0.55],
        ['Hibao-an', 1],
      ]),
      active: true,
    },
    {
      id: 'r4',
      name: 'Calumpang',
      from: 'Calumpang Terminal',
      to: 'Jaro',
      pts: [
        [20, 64],
        [36, 56],
        [56, 56],
        [74, 50],
        [86, 42],
      ],
      pick: formatPickupPoints([
        ['Calumpang Terminal', 0],
        ['Molo Crossing', 0.5],
        ['Jaro', 1],
      ]),
      active: true,
    },
  ];

  // Initial fleet vehicle status and available seat distribution
  const initialStatuses = [
    'On Route',
    'On Route',
    'At Terminal',
    'On Route',
    'Out of Service',
    'On Route',
    'On Route',
    'At Terminal',
    'On Route',
    'On Route',
  ];

  const availableSeats = [8, 2, 20, 0, null, 14, 5, 25, null, 11];

  const vehicles = initialStatuses.map((status, index) => {
    const isOdd = index % 2 === 1;
    const avail = availableSeats[index];
    return {
      id: `v${index + 1}`,
      unit: `JP-${101 + index}`,
      desc: 'Modernized Jeepney',
      routeId: routes[index % 4].id,
      status: status,
      p: (index * 0.17) % 1, // Normalized position along route (0 to 1)
      dir: isOdd ? -1 : 1, // Traversal direction (1 = forward, -1 = reverse)
      lastAt: timestamp,
      avail: avail,
      total: 33,
      seatSrc:
        avail === null
          ? 'Unknown'
          : isOdd
          ? 'Manually reported'
          : 'Simulated',
      mute: false,
    };
  });

  // Simulated passenger demand at various key stops
  const demand = [
    {
      id: 'd1',
      loc: 'Mandurriao',
      lat: 0,
      routeId: 'r2',
      count: 34,
      level: 'High',
      at: timestamp - 600000,
      src: 'Simulated',
      p: 0.45,
    },
    {
      id: 'd2',
      loc: 'SM City pickup',
      routeId: 'r2',
      count: 18,
      level: 'Moderate',
      at: timestamp - 900000,
      src: 'Simulated',
      p: 1,
    },
    {
      id: 'd3',
      loc: 'Jaro',
      routeId: 'r4',
      count: 9,
      level: 'Low',
      at: timestamp - 1200000,
      src: 'Simulated',
      p: 1,
    },
    {
      id: 'd4',
      loc: 'Jaro Plaza',
      routeId: 'r1',
      count: 26,
      level: 'High',
      at: timestamp - 300000,
      src: 'Simulated',
      p: 0.5,
    },
    {
      id: 'd5',
      loc: 'Tagbak Terminal',
      routeId: 'r1',
      count: 8,
      level: 'Low',
      at: timestamp - 1500000,
      src: 'Simulated',
      p: 0,
    },
    {
      id: 'd6',
      loc: 'Airport Road',
      routeId: 'r3',
      count: 15,
      level: 'Moderate',
      at: timestamp - 400000,
      src: 'Simulated',
      p: 0.55,
    },
    {
      id: 'd7',
      loc: 'Hibao-an',
      routeId: 'r3',
      count: 7,
      level: 'Low',
      at: timestamp - 1100000,
      src: 'Simulated',
      p: 1,
    },
    {
      id: 'd8',
      loc: 'Molo Crossing',
      routeId: 'r4',
      count: 20,
      level: 'Moderate',
      at: timestamp - 500000,
      src: 'Simulated',
      p: 0.5,
    },
  ];

  // Road traffic conditions across the network
  const traffic = [
    {
      id: 't1',
      road: 'Airport Road',
      routeId: 'r3',
      level: 'Moderate',
      inc: 'None',
      at: timestamp - 400000,
      src: 'Simulated',
    },
    {
      id: 't2',
      road: 'Molo Crossing',
      routeId: 'r4',
      level: 'Heavy',
      inc: 'Road works',
      at: timestamp - 200000,
      src: 'Simulated',
    },
    {
      id: 't3',
      road: 'Diversion Road',
      routeId: 'r1',
      level: 'Light',
      inc: 'None',
      at: timestamp - 800000,
      src: 'Simulated',
    },
    {
      id: 't4',
      road: 'Mandurriao Rd',
      routeId: 'r2',
      level: 'Heavy',
      inc: 'None',
      at: timestamp - 300000,
      src: 'Simulated',
      p: 0.4,
    },
    {
      id: 't5',
      road: 'SM Access Road',
      routeId: 'r2',
      level: 'Heavy',
      inc: 'None',
      at: timestamp - 200000,
      src: 'Simulated',
      p: 0.8,
    },
    {
      id: 't6',
      road: 'Hibao-an Road',
      routeId: 'r3',
      level: 'Light',
      inc: 'None',
      at: timestamp - 600000,
      src: 'Simulated',
      p: 0.2,
    },
    {
      id: 't7',
      road: 'Calumpang Road',
      routeId: 'r4',
      level: 'Moderate',
      inc: 'None',
      at: timestamp - 500000,
      src: 'Simulated',
      p: 0.85,
    },
    {
      id: 't8',
      road: 'Tagbak Road',
      routeId: 'r1',
      level: 'Light',
      inc: 'None',
      at: timestamp - 700000,
      src: 'Simulated',
      p: 0.75,
    },
    {
      id: 't9',
      road: 'Jaro Link Road',
      routeId: 'r1',
      level: 'Unknown',
      inc: 'None',
      at: timestamp - 3000000,
      src: 'Unavailable',
      p: 0.1,
    },
  ];

  // PAO field observations
  const obs = [
    {
      id: 'o1',
      type: 'Passenger Congestion',
      loc: 'Jaro Plaza',
      sev: 'High',
      desc: 'Long queue at the pickup point.',
      at: timestamp - 300000,
    },
    {
      id: 'o2',
      type: 'Road Incident',
      loc: 'Molo Crossing',
      sev: 'Moderate',
      desc: 'Minor collision, one lane blocked.',
      at: timestamp - 900000,
    },
  ];

  // Operational fleet alerts
  const alerts = [
    {
      id: 'a1',
      type: 'Breakdown',
      vehicleId: 'v5',
      msg: 'JP-105 reported a breakdown.',
      sev: 'High',
      at: timestamp - 700000,
      status: 'Open',
    },
    {
      id: 'a2',
      type: 'High Demand',
      msg: 'High passenger demand at Mandurriao.',
      sev: 'High',
      at: timestamp - 600000,
      status: 'Open',
    },
    {
      id: 'a3',
      type: 'Service Interruption',
      msg: 'Heavy traffic delaying Calumpang route.',
      sev: 'Moderate',
      at: timestamp - 200000,
      status: 'Open',
    },
  ];

  return {
    v: 2, // Schema version
    routes,
    vehicles,
    sim: true, // Simulation loop active
    link: true, // LoRaWAN simulated connectivity
    mode: 'all', // Display view mode
    watch: [], // Passenger alert watches: Array<{ vid, p, pn, fired }>
    toasts: [], // In-app notification queue
    demand,
    traffic,
    obs,
    alerts,
  };
}

// Global alias for compatibility
const seed = createInitialSeedData;

window.WaitLessData = {
  createInitialSeedData,
  seed,
};
