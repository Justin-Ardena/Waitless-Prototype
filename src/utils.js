/**
 * WaitLess Prototype - Utilities & Shared Helpers
 *
 * Provides core React shortcuts, time formatting, storage keys,
 * coordinate math, and modern vector SVG icons.
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

/**
 * Vector SVG Icon Factory Helpers (Clean, modern Lucide/Feather style icons)
 */
const createSvgIcon = (svgPath, viewBox = '0 0 24 24', defaultSize = 16) => {
  return ({ size = defaultSize, className = '', color = 'currentColor', style = {} } = {}) =>
    h(
      'svg',
      {
        viewBox,
        width: size,
        height: size,
        fill: 'none',
        stroke: color,
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        className: `svg-icon ${className}`.trim(),
        style: { verticalAlign: 'middle', flexShrink: 0, ...style },
        'aria-hidden': 'true',
      },
      typeof svgPath === 'string'
        ? h('path', { d: svgPath })
        : Array.isArray(svgPath)
        ? svgPath.map((p, i) =>
            typeof p === 'string'
              ? h('path', { key: i, d: p })
              : h(p.tag || 'path', { key: i, ...p })
          )
        : svgPath
    );
};

const Icons = {
  Bus: createSvgIcon([
    { tag: 'rect', x: 3, y: 3, width: 18, height: 16, rx: 3 },
    { tag: 'path', d: 'M3 11h18' },
    { tag: 'circle', cx: 7, cy: 15, r: 1 },
    { tag: 'circle', cx: 17, cy: 15, r: 1 },
    { tag: 'path', d: 'M5 19v2' },
    { tag: 'path', d: 'M19 19v2' },
  ]),
  MapPin: createSvgIcon([
    { tag: 'path', d: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z' },
    { tag: 'circle', cx: 12, cy: 10, r: 3 },
  ]),
  Search: createSvgIcon([
    { tag: 'circle', cx: 11, cy: 11, r: 8 },
    { tag: 'path', d: 'm21 21-4.35-4.35' },
  ]),
  Bell: createSvgIcon([
    { tag: 'path', d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' },
    { tag: 'path', d: 'M13.73 21a2 2 0 0 1-3.46 0' },
  ]),
  Clock: createSvgIcon([
    { tag: 'circle', cx: 12, cy: 12, r: 10 },
    { tag: 'polyline', points: '12 6 12 12 16 14' },
  ]),
  Users: createSvgIcon([
    { tag: 'path', d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' },
    { tag: 'circle', cx: 9, cy: 7, r: 4 },
    { tag: 'path', d: 'M22 21v-2a4 4 0 0 0-3-3.87' },
    { tag: 'path', d: 'M16 3.13a4 4 0 0 1 0 7.75' },
  ]),
  Signal: createSvgIcon([
    { tag: 'path', d: 'M2 20h.01' },
    { tag: 'path', d: 'M7 20v-4' },
    { tag: 'path', d: 'M12 20v-8' },
    { tag: 'path', d: 'M17 20V8' },
    { tag: 'path', d: 'M22 20V4' },
  ]),
  AlertTriangle: createSvgIcon([
    {
      tag: 'path',
      d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z',
    },
    { tag: 'line', x1: 12, y1: 9, x2: 12, y2: 13 },
    { tag: 'line', x1: 12, y1: 17, x2: 12.01, y2: 17 },
  ]),
  Layers: createSvgIcon([
    { tag: 'polygon', points: '12 2 2 7 12 12 22 7 12 2' },
    { tag: 'polyline', points: '2 17 12 22 22 17' },
    { tag: 'polyline', points: '2 12 12 17 22 12' },
  ]),
  Check: createSvgIcon([{ tag: 'polyline', points: '20 6 9 17 4 12' }]),
  Monitor: createSvgIcon([
    { tag: 'rect', x: 2, y: 3, width: 20, height: 14, rx: 2 },
    { tag: 'line', x1: 8, y1: 21, x2: 16, y2: 21 },
    { tag: 'line', x1: 12, y1: 17, x2: 12, y2: 21 },
  ]),
  Smartphone: createSvgIcon([
    { tag: 'rect', x: 5, y: 2, width: 14, height: 20, rx: 3 },
    { tag: 'line', x1: 12, y1: 18, x2: 12.01, y2: 18 },
  ]),
  Play: createSvgIcon([{ tag: 'polygon', points: '5 3 19 12 5 21 5 3' }]),
  Pause: createSvgIcon([
    { tag: 'rect', x: 6, y: 4, width: 4, height: 16 },
    { tag: 'rect', x: 14, y: 4, width: 4, height: 16 },
  ]),
  Refresh: createSvgIcon([
    {
      tag: 'path',
      d: 'M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67',
    },
  ]),
  Trash: createSvgIcon([
    { tag: 'polyline', points: '3 6 5 6 21 6' },
    {
      tag: 'path',
      d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
    },
  ]),
  Sliders: createSvgIcon([
    { tag: 'line', x1: 4, y1: 21, x2: 4, y2: 14 },
    { tag: 'line', x1: 4, y1: 10, x2: 4, y2: 3 },
    { tag: 'line', x1: 12, y1: 21, x2: 12, y2: 12 },
    { tag: 'line', x1: 12, y1: 8, x2: 12, y2: 3 },
    { tag: 'line', x1: 20, y1: 21, x2: 20, y2: 16 },
    { tag: 'line', x1: 20, y1: 12, x2: 20, y2: 3 },
    { tag: 'line', x1: 1, y1: 14, x2: 7, y2: 14 },
    { tag: 'line', x1: 9, y1: 8, x2: 15, y2: 8 },
    { tag: 'line', x1: 17, y1: 16, x2: 23, y2: 16 },
  ]),
};

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
  Icons,
};
