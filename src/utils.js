/**
 * WaitLess Prototype - Utilities & Shared Helpers
 *
 * Provides core React shortcuts, time formatting, storage keys,
 * and data transformation helpers used across the entire application.
 */

// React shortcuts
const h = React.createElement;
const {
  useState,
  useSyncExternalStore,
  useEffect,
  useRef,
  useId,
} = React;

// Local storage key for persistent demo state
const STORAGE_KEY = 'waitless-demo-v1';
const K = STORAGE_KEY; // Backward-compatible alias

/**
 * Returns current timestamp in milliseconds.
 * @returns {number}
 */
const getCurrentTimestamp = () => Date.now();
const now = getCurrentTimestamp; // Backward-compatible alias

/**
 * Formats a timestamp into human-readable relative time (e.g., '12s ago', '3m ago').
 * @param {number} timestamp - Epoch timestamp in milliseconds
 * @returns {string}
 */
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Never';
  const elapsedSeconds = Math.round((getCurrentTimestamp() - timestamp) / 1000);
  if (elapsedSeconds < 60) {
    return `${Math.max(0, elapsedSeconds)}s ago`;
  }
  const elapsedMinutes = Math.round(elapsedSeconds / 60);
  return `${elapsedMinutes}m ago`;
};
const ago = formatTimeAgo; // Backward-compatible alias

/**
 * Converts route pickup point tuples [name, progress] into structured objects { n, p }.
 * @param {Array<[string, number]>} pointTuples - Array of [stopName, progressRatio]
 * @returns {Array<{ n: string, p: number }>}
 */
const formatPickupPoints = (pointTuples) => {
  return pointTuples.map(([name, progress]) => ({
    n: name,
    p: progress,
  }));
};
const PK = formatPickupPoints; // Backward-compatible alias

// Attach to global scope for classic script access
window.WaitLessUtils = {
  h,
  STORAGE_KEY,
  K,
  getCurrentTimestamp,
  now,
  formatTimeAgo,
  ago,
  formatPickupPoints,
  PK,
};
