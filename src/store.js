/**
 * WaitLess Prototype - State Management Store
 *
 * Provides a lightweight reactive state store backed by browser localStorage
 * with cross-tab/multi-window synchronization and React subscription integration.
 */

/**
 * Initializes state from localStorage or falls back to seed data.
 * @returns {Object} Application state
 */
function initializeStoreState() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData) {
      const parsed = JSON.parse(rawData);
      if (
        parsed &&
        parsed.v === 2 &&
        Array.isArray(parsed.vehicles) &&
        Array.isArray(parsed.routes)
      ) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('WaitLess: Failed to read from localStorage, using seed data.', error);
  }
  return createInitialSeedData();
}

// Current store state singleton
let storeState = initializeStoreState();
let S = storeState; // Backward-compatible alias (kept in sync)

// Set of active external store subscribers
const subscribers = new Set();
const subs = subscribers; // Backward-compatible alias

/**
 * Persists the current state to localStorage.
 */
function saveStoreState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storeState));
  } catch (error) {
    console.warn('WaitLess: Failed to save to localStorage.', error);
  }
}
const save = saveStoreState; // Backward-compatible alias

/**
 * Updates application state using a modifier function and notifies all subscribers.
 * @param {Function} updater - (prevState) => nextState
 */
function updateStoreState(updater) {
  storeState = updater({ ...storeState });
  S = storeState; // Keep alias synchronized
  saveStoreState();
  subscribers.forEach((callback) => callback());
}
const set = updateStoreState; // Backward-compatible alias

/**
 * React hook to subscribe to the global store state.
 * @returns {Object} Current application state
 */
function useStoreState() {
  return useSyncExternalStore(
    (callback) => {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
    () => storeState
  );
}
const useS = useStoreState; // Backward-compatible alias

/**
 * Synchronizes store state across multiple browser windows and tabs
 * (e.g., when the Cooperative fleet map is opened in a second monitor).
 */
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) {
    try {
      if (event.newValue) {
        storeState = JSON.parse(event.newValue);
        S = storeState;
        subscribers.forEach((callback) => callback());
      }
    } catch (error) {
      console.warn('WaitLess: Failed to sync storage event.', error);
    }
  }
});

// Store Action Helpers for clean operations
const StoreActions = {
  reset() {
    updateStoreState(() => createInitialSeedData());
  },
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    storeState = createInitialSeedData();
    S = storeState;
    saveStoreState();
    subscribers.forEach((c) => c());
  },
  updateVehicle(id, patch) {
    updateStoreState((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    }));
  },
  addAlert(alertData) {
    const newAlert = {
      id: 'a' + getCurrentTimestamp(),
      at: getCurrentTimestamp(),
      status: 'Open',
      sev: 'High',
      ...alertData,
    };
    updateStoreState((prev) => ({
      ...prev,
      alerts: [newAlert, ...prev.alerts],
    }));
  },
  toggleSimulation() {
    updateStoreState((prev) => ({ ...prev, sim: !prev.sim }));
  },
  toggleLink() {
    updateStoreState((prev) => ({ ...prev, link: !prev.link }));
  },
};

window.WaitLessStore = {
  getState: () => storeState,
  setState: updateStoreState,
  useStore: useStoreState,
  actions: StoreActions,
  subscribers,
  save: saveStoreState,
};
