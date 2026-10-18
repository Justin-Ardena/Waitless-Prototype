/**
 * WaitLess Prototype - Core Domain & Calculation Logic
 *
 * Provides:
 * - Route geometry, polyline length, and spatial interpolation
 * - Vehicle operational status and seat availability diagnostics
 * - Real-time ETA estimations with simulated traffic delays
 * - Fare calculations (regular and statutory discounted rates)
 */

/**
 * Finds a route by ID within state.
 * @param {Object} state - Application state
 * @param {string} routeId - Unique route identifier
 * @returns {Object|undefined} Route object
 */
function getRouteById(state, routeId) {
  return state.routes.find((route) => route.id === routeId);
}
const rt = getRouteById; // Backward-compatible alias

/**
 * Calculates total polyline length across route coordinate points.
 * @param {Object} route - Route definition with `pts` [[x, y], ...]
 * @returns {number} Geometric length
 */
function calculateRouteLength(route) {
  if (!route || !Array.isArray(route.pts) || route.pts.length < 2) return 0;
  return route.pts.slice(1).reduce((total, currentPoint, index) => {
    const prevPoint = route.pts[index];
    return total + Math.hypot(currentPoint[0] - prevPoint[0], currentPoint[1] - prevPoint[1]);
  }, 0);
}
const plen = calculateRouteLength; // Backward-compatible alias

/**
 * Calculates [x, y] coordinates at normalized progress `p` (0.0 to 1.0) along a route.
 * @param {Object} route - Route object containing `pts`
 * @param {number} progress - Normalized progression between 0 and 1
 * @returns {[number, number]|null} [x, y] coordinate tuple
 */
function getPositionOnRoute(route, progress) {
  if (!route || !Array.isArray(route.pts) || route.pts.length < 2) return null;
  const totalLength = calculateRouteLength(route);
  if (totalLength === 0) return route.pts[0];

  const clampedProgress = Math.max(0, Math.min(1, progress));
  let targetDistance = clampedProgress * totalLength;

  for (let i = 1; i < route.pts.length; i++) {
    const startPt = route.pts[i - 1];
    const endPt = route.pts[i];
    const segmentLength = Math.hypot(endPt[0] - startPt[0], endPt[1] - startPt[1]);

    if (targetDistance <= segmentLength || i === route.pts.length - 1) {
      const segmentRatio = segmentLength > 0 ? Math.min(1, targetDistance / segmentLength) : 0;
      return [
        startPt[0] + (endPt[0] - startPt[0]) * segmentRatio,
        startPt[1] + (endPt[1] - startPt[1]) * segmentRatio,
      ];
    }
    targetDistance -= segmentLength;
  }
  return route.pts[0];
}
const pos = getPositionOnRoute; // Backward-compatible alias

// Reference travel speed constant for simulated transit
const SIMULATED_SPEED = 6;
const SPEED = SIMULATED_SPEED; // Backward-compatible alias

/**
 * Evaluates vehicle state freshness, seat availability, and status styling.
 * @param {Object} vehicle - Vehicle object
 * @returns {Object} Diagnostics: { stale, seat, label, col, seatCol }
 */
function getVehicleStatusInfo(vehicle) {
  const isStale = getCurrentTimestamp() - vehicle.lastAt > 8000;
  const seatStatus =
    vehicle.avail === null
      ? 'Unknown'
      : vehicle.avail === 0
      ? 'Full'
      : vehicle.avail <= 8
      ? 'Limited Seats'
      : 'Seats Available';

  const label = isStale ? 'Stale Data' : vehicle.status;

  // Status badge colors: ok (green), pr (blue), er (red), gr (gray)
  const col = isStale
    ? 'gr'
    : vehicle.status === 'Out of Service'
    ? 'er'
    : vehicle.status === 'At Terminal'
    ? 'pr'
    : 'ok';

  // Seat status badge colors: ok (green), wa (yellow/amber), er (red), gr (gray)
  const seatCol =
    seatStatus === 'Unknown'
      ? 'gr'
      : seatStatus === 'Full'
      ? 'er'
      : seatStatus === 'Limited Seats'
      ? 'wa'
      : 'ok';

  return {
    stale: isStale,
    seat: seatStatus,
    label,
    col,
    seatCol,
  };
}
const info = getVehicleStatusInfo; // Backward-compatible alias

// Delay multiplier factors for traffic congestion
const TRAFFIC_FACTORS = {
  Heavy: 2.0,
  Moderate: 1.4,
  Light: 1.0,
};
const TF = TRAFFIC_FACTORS; // Backward-compatible alias

/**
 * Determines the traffic delay factor along a designated route.
 * @param {Object} state - Application state
 * @param {string} routeId - Target route ID
 * @returns {{ lv: string|null, f: number }} Severity level and delay multiplier factor
 */
function getRouteTrafficFactor(state, routeId) {
  const trafficLevels = state.traffic
    .filter((t) => t.routeId === routeId)
    .map((t) => t.level);

  let worstLevel = null;
  if (trafficLevels.includes('Heavy')) worstLevel = 'Heavy';
  else if (trafficLevels.includes('Moderate')) worstLevel = 'Moderate';
  else if (trafficLevels.includes('Light')) worstLevel = 'Light';

  return {
    lv: worstLevel,
    f: worstLevel ? TRAFFIC_FACTORS[worstLevel] : 1.0,
  };
}
const tfac = getRouteTrafficFactor; // Backward-compatible alias

/**
 * Calculates raw and traffic-adjusted ETA between vehicle and designated pickup stop.
 * @param {Object} state - Application state
 * @param {Object} vehicle - Vehicle object
 * @param {Object} pickupPoint - Target pickup stop { n, p }
 * @returns {Object|null} ETA metrics { base, adj, lv, f } or null if unavailable
 */
function calculateEta(state, vehicle, pickupPoint) {
  const route = getRouteById(state, vehicle.routeId);
  const vehicleInfo = getVehicleStatusInfo(vehicle);

  if (
    !route ||
    !pickupPoint ||
    vehicleInfo.stale ||
    vehicle.status === 'Out of Service' ||
    vehicle.p == null
  ) {
    return null;
  }

  // Calculate base minutes based on route distance and simulated speed
  const baseMinutes =
    (Math.abs(pickupPoint.p - vehicle.p) * calculateRouteLength(route)) /
    SIMULATED_SPEED /
    6;

  const trafficInfo = getRouteTrafficFactor(state, route.id);
  const adjustedMinutes = baseMinutes * trafficInfo.f;

  return {
    base: baseMinutes,
    adj: adjustedMinutes,
    lv: trafficInfo.lv,
    f: trafficInfo.f,
  };
}
const etaInfo = calculateEta; // Backward-compatible alias

/**
 * Formats minutes into human-readable text (e.g. '<1 min', '8 min').
 * @param {number} minutes
 * @returns {string}
 */
const formatMinutes = (minutes) => {
  if (minutes < 1) return '<1 min';
  return `${Math.round(minutes)} min`;
};
const fm = formatMinutes; // Backward-compatible alias

/**
 * Generates an informative ETA explanation string including traffic impact.
 * @param {Object} state - Application state
 * @param {Object} vehicle - Vehicle object
 * @param {Object} pickupPoint - Target pickup stop
 * @returns {string} Detailed ETA message
 */
function getEtaDescription(state, vehicle, pickupPoint) {
  const result = calculateEta(state, vehicle, pickupPoint);
  if (!result) return 'ETA unavailable';

  let explanation = '';
  if (result.lv && result.f > 1) {
    const delay = result.adj - result.base;
    explanation = ` — due to ${result.lv.toLowerCase()} traffic congestion (+${formatMinutes(delay)}; ${formatMinutes(result.base)} without traffic)`;
  } else if (result.lv) {
    explanation = ' — light traffic, no delay';
  } else {
    explanation = ' — no traffic report';
  }

  return `Simulated ETA: ${formatMinutes(result.adj)}${explanation}`;
}
const eta = getEtaDescription; // Backward-compatible alias

// Default fare parameters (Philippine Modernized Jeepney base standard)
const DEFAULT_FARE_CONFIG = {
  base: 15, // Base fare in PHP
  km: 4, // Distance covered by base fare in km
  per: 2.5, // Rate per succeeding kilometer in PHP
  disc: 20, // Statutory discount percentage (Student, Senior, PWD)
};
const FD = DEFAULT_FARE_CONFIG; // Backward-compatible alias

/**
 * Calculates regular and discounted passenger fares between two points along a route.
 * @param {Object} state - Application state
 * @param {Object} route - Route definition
 * @param {number} startProgress - Origin progress (0 to 1)
 * @param {number} endProgress - Destination progress (0 to 1)
 * @returns {{ km: number, reg: number, dis: number }} Distance and calculated fares in PHP
 */
function calculateFare(state, route, startProgress, endProgress) {
  const config = state.fare || DEFAULT_FARE_CONFIG;
  const distanceKm = Math.abs(endProgress - startProgress) * calculateRouteLength(route) * 0.1;
  const rawFare = config.base + Math.max(0, distanceKm - config.km) * config.per;

  return {
    km: distanceKm,
    reg: Math.round(rawFare),
    dis: Math.round(rawFare * (1 - config.disc / 100)),
  };
}
const fareFor = calculateFare; // Backward-compatible alias

window.WaitLessLogic = {
  getRouteById,
  rt,
  calculateRouteLength,
  plen,
  getPositionOnRoute,
  pos,
  getVehicleStatusInfo,
  info,
  getRouteTrafficFactor,
  tfac,
  calculateEta,
  etaInfo,
  formatMinutes,
  fm,
  getEtaDescription,
  eta,
  calculateFare,
  fareFor,
  DEFAULT_FARE_CONFIG,
  FD,
  TRAFFIC_FACTORS,
  TF,
};
