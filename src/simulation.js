/**
 * WaitLess Prototype - Simulation Engine
 *
 * Simulates:
 * - GPS/LoRaWAN heartbeat telemetry pings from fleet vehicles
 * - Bidirectional vehicle movement along assigned route polylines
 * - Automatic terminal turnaround at route boundaries
 * - Geofenced proximity detection and push notifications for passenger alerts
 */

/**
 * Computes one discrete simulation tick update.
 * @param {Object} currentState - Current state from store
 * @returns {Object} Updated state
 */
function stepSimulation(currentState) {
  const timestamp = getCurrentTimestamp();
  const toasts = [...currentState.toasts];

  // 1. Update vehicle positions and simulated telemetry pings
  const updatedVehicles = currentState.vehicles.map((vehicle) => {
    const updated = { ...vehicle };

    // When simulated LoRaWAN link is active and vehicle is unmuted, refresh
    // the timestamp for ALL vehicles (not just On Route) so that vehicles
    // loaded from localStorage don't stay permanently stale.
    if (currentState.link && !vehicle.mute) {
      updated.lastAt = timestamp;

      // Vehicles currently 'On Route' advance incrementally along their path
      if (vehicle.status === 'On Route') {
        const stepDelta = vehicle.dir * 0.02;
        updated.p = vehicle.p + stepDelta;

        // Bounce back and reverse direction at route endpoints
        if (updated.p >= 1) {
          updated.p = 1;
          updated.dir = -1;
        } else if (updated.p <= 0) {
          updated.p = 0;
          updated.dir = 1;
        }
      }
    }
    return updated;
  });

  // 2. Check passenger alert watches for approaching vehicles
  const updatedWatches = currentState.watch.map((watch) => {
    const targetVehicle = updatedVehicles.find((v) => v.id === watch.vid);
    const vehicleInfo = targetVehicle ? getVehicleStatusInfo(targetVehicle) : null;

    // Trigger alert if vehicle is active, has fresh telemetry, and is within 8% route proximity
    const isApproaching =
      !watch.fired &&
      targetVehicle &&
      vehicleInfo &&
      !vehicleInfo.stale &&
      Math.abs(targetVehicle.p - watch.p) < 0.08;

    if (isApproaching) {
      toasts.unshift({
        id: `n_${timestamp}_${watch.vid}`,
        msg: `${targetVehicle.unit} is approaching ${watch.pn}.`,
      });
      return { ...watch, fired: true };
    }
    return watch;
  });

  return {
    ...currentState,
    vehicles: updatedVehicles,
    watch: updatedWatches,
    toasts: toasts.slice(0, 4), // Retain latest 4 notifications
  };
}

/**
 * Starts the recurring simulation loop.
 * Skips processing if simulation is paused or if running in second-screen display-only mode.
 */
function startSimulationEngine() {
  const SIMULATION_INTERVAL_MS = 1500;

  return setInterval(() => {
    // Only execute simulation on primary views when active
    if (!storeState.sim || window.location.hash === '#map') {
      return;
    }

    updateStoreState((currentState) => stepSimulation(currentState));
  }, SIMULATION_INTERVAL_MS);
}

// Start simulation engine immediately
const simulationTimerId = startSimulationEngine();

window.WaitLessSimulation = {
  stepSimulation,
  startSimulationEngine,
  timerId: simulationTimerId,
};
