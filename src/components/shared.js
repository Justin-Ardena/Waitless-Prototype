/**
 * WaitLess Prototype - Shared UI Components
 *
 * Provides reusable components:
 * - Badges and Severity color mappers
 * - ETA cards with traffic congestion impact analysis
 * - Fare guide and cooperative fare matrix settings editor
 * - Trip planner with stop selection and nearest-stop pin locator
 * - Vehicle information cards with live status badges
 * - Map layers toggle button
 * - Draggable bottom sheet with touch/pointer snapping
 * - Drag-to-scroll carousel gesture handlers
 */

/**
 * Status or Severity Badge
 */
function Badge({ c: colorClass, children }) {
  return h('span', { className: `b ${colorClass}` }, children);
}
const B = Badge; // Backward-compatible alias

/**
 * Maps traffic or demand severity levels to badge color codes.
 * @param {string} level - 'High', 'Moderate', 'Light', etc.
 * @returns {string} Color class: 'er' | 'wa' | 'ok' | 'gr'
 */
function getLevelColorClass(level) {
  const map = {
    High: 'er',
    Heavy: 'er',
    Moderate: 'wa',
    Light: 'ok',
    Low: 'ok',
  };
  return map[level] || 'gr';
}
const lvC = getLevelColorClass; // Backward-compatible alias

/**
 * ETA summary card displaying arrival estimations and congestion delays
 */
function EtaCard({ rid = 'all' }) {
  const state = useStoreState();
  const routes = state.routes.filter(
    (route) => route.active && (rid === 'all' || route.id === rid)
  );

  return h(
    'div',
    { className: 'c' },
    h('h3', null, 'ETA with traffic congestion (simulated)'),
    routes.map((route) => {
      const targetStop = route.pick[Math.min(1, route.pick.length - 1)];

      // Find vehicle with lowest adjusted ETA to target stop
      const nextVehicleArrival = state.vehicles
        .filter((v) => v.routeId === route.id)
        .map((v) => ({ v, e: calculateEta(state, v, targetStop) }))
        .filter((item) => item.e)
        .sort((a, b) => a.e.adj - b.e.adj)[0];

      const traffic = getRouteTrafficFactor(state, route.id);

      return h(
        'div',
        { key: route.id, style: { marginBottom: 6 } },
        h(
          'div',
          { className: 'row' },
          h('b', null, route.name),
          traffic.lv &&
            h(Badge, { c: getLevelColorClass(traffic.lv) }, `${traffic.lv} traffic`)
        ),
        h(
          'div',
          { className: 'mu' },
          nextVehicleArrival
            ? `Next unit ${nextVehicleArrival.v.unit} reaches ${targetStop.n} in ${formatMinutes(
                nextVehicleArrival.e.adj
              )}. ${
                nextVehicleArrival.e.f > 1
                  ? `Due to ${traffic.lv.toLowerCase()} traffic congestion, this adds ${formatMinutes(
                      nextVehicleArrival.e.adj - nextVehicleArrival.e.base
                    )} (${formatMinutes(nextVehicleArrival.e.base)} without traffic).`
                  : 'No traffic delay reported.'
              }`
            : 'ETA unavailable: no vehicle with fresh location data.'
        )
      );
    }),
    h(
      'div',
      { className: 'mu' },
      'Estimates use simulated traffic and vehicle data, not live predictions.'
    )
  );
}

/**
 * Route fare breakdown card
 */
function FareCard({ r: route }) {
  const state = useStoreState();
  const fareConfig = state.fare || DEFAULT_FARE_CONFIG;
  const fullRouteFare = calculateFare(state, route, 0, 1);

  return h(
    'div',
    { className: 'c' },
    h('h3', null, `Fare guide: ${route.name}`),
    h(
      'div',
      { className: 'row' },
      h(Badge, { c: 'pr' }, `Full route ₱${fullRouteFare.reg}`),
      h(Badge, { c: 'ok' }, `Student/Senior/PWD ₱${fullRouteFare.dis}`),
      h('span', { className: 'mu' }, `${fullRouteFare.km.toFixed(1)} km`)
    ),
    route.pick.slice(1).map((stop, index) => {
      const segmentFare = calculateFare(state, route, route.pick[0].p, stop.p);
      return h(
        'div',
        { key: index, className: 'row mu' },
        h(
          'span',
          { style: { flex: 1 } },
          `${route.pick[0].n} → ${stop.n} (${segmentFare.km.toFixed(1)} km)`
        ),
        h('b', null, `₱${segmentFare.reg} / ₱${segmentFare.dis}`)
      );
    }),
    h(
      'div',
      { className: 'mu' },
      `Sample fares: ₱${fareConfig.base} for the first ${fareConfig.km} km + ₱${fareConfig.per}/km, ${fareConfig.disc}% discount. Not official rates.`
    )
  );
}

/**
 * Interactive fare settings configuration editor for cooperatives
 */
function FareSettings() {
  const state = useStoreState();
  const currentFare = state.fare || DEFAULT_FARE_CONFIG;

  const updateSetting = (key, value) => {
    updateStoreState((prev) => ({
      ...prev,
      fare: {
        ...(prev.fare || DEFAULT_FARE_CONFIG),
        [key]: Math.max(0, Number.isFinite(+value) ? +value : 0),
      },
    }));
  };

  const fields = [
    ['base', 'Base ₱'],
    ['km', 'Base km'],
    ['per', '₱ per km'],
    ['disc', 'Discount %'],
  ];

  return h(
    'div',
    { className: 'c' },
    h('h3', null, 'Fare settings (sample)'),
    h(
      'div',
      { className: 'row' },
      fields.map(([key, label]) =>
        h(
          'label',
          { key, className: 'mu' },
          `${label} `,
          h('input', {
            type: 'number',
            min: 0,
            step: 'any',
            style: { width: 64 },
            value: currentFare[key],
            onChange: (e) => updateSetting(key, e.target.value),
            'aria-label': label,
          })
        )
      )
    ),
    state.routes
      .filter((route) => route.active)
      .map((route) => {
        const fullFare = calculateFare(state, route, 0, 1);
        return h(
          'div',
          { key: route.id, className: 'mu' },
          `${route.name}: ₱${fullFare.reg} regular, ₱${fullFare.dis} discounted (${fullFare.km.toFixed(1)} km)`
        );
      }),
    h(
      'div',
      { className: 'mu' },
      'Fares update in the Commuter app. Demo values, not LTFRB-approved rates.'
    )
  );
}

/**
 * Trip Planner: origin/destination picker, ETA, and fare estimate
 */
function TripPlan({
  r: route,
  pi: originIndex,
  setPi: setOriginIndex,
  to: destIndex,
  setTo: setDestIndex,
}) {
  const state = useStoreState();
  const stopCount = route.pick.length;
  const safeOriginIdx = Math.min(originIndex, stopCount - 1);
  const safeDestIdx = Math.min(destIndex, stopCount - 1);
  const originStop = route.pick[safeOriginIdx];
  const destStop = route.pick[safeDestIdx];

  // Resolve traffic delay along the trip stretch
  const getTrafficProgress = (t) =>
    t.p ??
    ({
      'Airport Road': 0.55,
      'Molo Crossing': 0.5,
      'Diversion Road': 0.3,
    }[t.road] ?? 0.5);

  const minProgress = Math.min(originStop.p, destStop.p);
  const maxProgress = Math.max(originStop.p, destStop.p);

  const stretchTrafficLevels = state.traffic
    .filter(
      (t) =>
        t.routeId === route.id &&
        t.level !== 'Unknown' &&
        getTrafficProgress(t) >= minProgress - 0.05 &&
        getTrafficProgress(t) <= maxProgress + 0.05
    )
    .map((t) => t.level);

  const worstLevel = stretchTrafficLevels.includes('Heavy')
    ? 'Heavy'
    : stretchTrafficLevels.includes('Moderate')
    ? 'Moderate'
    : stretchTrafficLevels.length
    ? 'Light'
    : null;

  const trafficMultiplier = worstLevel ? TRAFFIC_FACTORS[worstLevel] : 1.0;

  // Compute fares and ride times
  const fare = calculateFare(state, route, originStop.p, destStop.p);
  const baseRideMinutes = fare.km * 2.4;
  const trafficRideMinutes = baseRideMinutes * trafficMultiplier;

  // Best next vehicle approaching the origin stop
  const bestVehicle = state.vehicles
    .filter((v) => v.routeId === route.id)
    .map((v) => ({ v, e: calculateEta(state, v, originStop) }))
    .filter((item) => item.e)
    .sort((a, b) => a.e.adj - b.e.adj)[0];

  // Nearest stop finder using user's location pin
  const userPin = state.cloc || [22, 40];
  const selectNearestStop = () => {
    let nearestIndex = 0;
    let shortestDistance = Infinity;

    route.pick.forEach((stop, idx) => {
      const coords = getPositionOnRoute(route, stop.p);
      if (!coords) return;
      const dist = Math.hypot(coords[0] - userPin[0], coords[1] - userPin[1]);
      if (dist < shortestDistance) {
        shortestDistance = dist;
        nearestIndex = idx;
      }
    });
    setOriginIndex(nearestIndex);
  };

  return h(
    'div',
    { className: 'c' },
    h('h3', null, 'Plan your trip'),
    h(
      'div',
      { className: 'row' },
      h(
        'select',
        {
          value: safeOriginIdx,
          onChange: (e) => setOriginIndex(+e.target.value),
          'aria-label': 'From',
        },
        route.pick.map((stop, idx) =>
          h('option', { key: idx, value: idx }, `From: ${stop.n}`)
        )
      ),
      h(
        'select',
        {
          value: safeDestIdx,
          onChange: (e) => setDestIndex(+e.target.value),
          'aria-label': 'To',
        },
        route.pick.map((stop, idx) =>
          h('option', { key: idx, value: idx }, `To: ${stop.n}`)
        )
      ),
      h('button', { onClick: selectNearestStop }, 'Use my pin')
    ),

    safeOriginIdx === safeDestIdx
      ? h(
          'div',
          { className: 'mu', style: { marginTop: 6 } },
          'Choose a different destination to see the fare and travel time.'
        )
      : h(
          'div',
          { style: { marginTop: 8, display: 'grid', gap: 4 } },
          h(
            'div',
            { className: 'row' },
            h(Badge, { c: 'pr' }, `Fare ₱${fare.reg}`),
            h(Badge, { c: 'ok' }, `Student/Senior/PWD ₱${fare.dis}`),
            h('span', { className: 'mu' }, `${fare.km.toFixed(1)} km`)
          ),
          h(
            'div',
            null,
            'Wait for next unit: ',
            h('b', null, bestVehicle ? formatMinutes(bestVehicle.e.adj) : 'unavailable'),
            bestVehicle &&
              h(
                'span',
                { className: 'mu' },
                ` (${bestVehicle.v.unit}${bestVehicle.e.f > 1 ? ', slowed by traffic' : ''})`
              )
          ),
          h(
            'div',
            null,
            'Ride time: ',
            h('b', null, formatMinutes(trafficRideMinutes)),
            h(
              'span',
              { className: 'mu' },
              worstLevel && trafficMultiplier > 1
                ? ` — due to ${worstLevel.toLowerCase()} traffic congestion between ${originStop.n} and ${destStop.n} (+${formatMinutes(
                    trafficRideMinutes - baseRideMinutes
                  )}; ${formatMinutes(baseRideMinutes)} without traffic)`
                : worstLevel
                ? ' — light traffic, no delay'
                : ' — no traffic report on this stretch'
            )
          ),
          bestVehicle &&
            h(
              'div',
              { style: { fontWeight: 700, color: '#1d4ed8' } },
              `Estimated total: ${formatMinutes(bestVehicle.e.adj + trafficRideMinutes)}`
            ),
          h(
            'div',
            { className: 'mu' },
            'Simulated fare and times; not official or live predictions.'
          )
        )
  );
}

/**
 * Commuter community counter note
 */
function CommNote() {
  const state = useStoreState();
  const waitingCommuters = state.demand.reduce(
    (acc, d) => acc + Math.min(10, Math.round(d.count / 4)),
    0
  );
  const totalCommuters = waitingCommuters + state.watch.length;

  return h(
    'div',
    { className: 'mu', style: { margin: '6px 0' } },
    h(
      'b',
      { style: { color: '#1d4ed8' } },
      `Commuters on the app: ${totalCommuters}`
    ),
    ` (simulated, anonymous): ${waitingCommuters} waiting near demand hotspots, ${state.watch.length} with an active approaching alert. Blue dots are commuters; ringed dots have an alert set.`
  );
}

/**
 * Vehicle Status Card
 */
function VCard({ v: vehicle, pk: pickupPoint, sel: isSelected, onSel: onSelect }) {
  const state = useStoreState();
  const info = getVehicleStatusInfo(vehicle);
  const route = getRouteById(state, vehicle.routeId);

  return h(
    'div',
    {
      className: `c ${isSelected ? 'sel' : ''}`,
      onClick: () => onSelect && onSelect(vehicle.id),
    },
    h(
      'div',
      { className: 'row' },
      h('b', null, vehicle.unit),
      h(Badge, { c: info.col }, info.label),
      h(Badge, { c: info.seatCol }, info.seat)
    ),
    h(
      'div',
      { className: 'mu' },
      `${route ? route.name : 'Unassigned'} · ${
        vehicle.avail == null
          ? 'Seats unknown'
          : `${vehicle.avail} of ${vehicle.total} seats available`
      } (${vehicle.seatSrc})`
    ),
    h(
      'div',
      { className: 'mu' },
      `Last update ${formatTimeAgo(vehicle.lastAt)} · Source: ${
        state.link && !vehicle.mute ? 'Simulated GPS' : 'Last known (no signal)'
      }`
    ),
    pickupPoint &&
      h(
        'div',
        { style: { fontWeight: 600, color: '#1d4ed8' } },
        getEtaDescription(state, vehicle, pickupPoint)
      )
  );
}

/**
 * Smooth drag-to-scroll gesture bindings for horizontal chip bars
 */
const dragScroll = {
  onWheel: (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  },
  onMouseDown: (e) => {
    const el = e.currentTarget;
    el._drag = { x: e.clientX, left: el.scrollLeft, moved: false };
  },
  onMouseMove: (e) => {
    const el = e.currentTarget;
    const d = el._drag;
    if (!d || e.buttons !== 1) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) d.moved = true;
    el.scrollLeft = d.left - dx;
  },
  onMouseUp: (e) => {
    const el = e.currentTarget;
    const d = el._drag;
    el._drag = null;
    if (d && d.moved) el._blockClickUntil = Date.now();
  },
  onMouseLeave: (e) => {
    e.currentTarget._drag = null;
  },
  onClickCapture: (e) => {
    const el = e.currentTarget;
    if (el._blockClickUntil && Date.now() - el._blockClickUntil < 250) {
      e.stopPropagation();
      e.preventDefault();
    }
  },
};
const dragX = dragScroll; // Backward-compatible alias

/**
 * Floating Map Layers Toggle Button & Dropdown
 */
function LayersBtn({ L: layers, setL: setLayers, items }) {
  const [isOpen, setIsOpen] = useState(false);

  return h(
    'div',
    { style: { position: 'absolute', top: 10, right: 10, zIndex: 7 } },
    h(
      'button',
      {
        'aria-label': 'Map layers',
        'aria-expanded': isOpen,
        onClick: () => setIsOpen(!isOpen),
        style: {
          borderRadius: 12,
          padding: '8px 12px',
          boxShadow: '0 4px 12px rgba(15,27,51,.22)',
          border: 0,
          fontWeight: 700,
          display: 'block',
          marginLeft: 'auto',
        },
      },
      '⧉ Layers'
    ),
    isOpen &&
      h(
        'div',
        {
          className: 'c',
          style: {
            marginTop: 6,
            width: 220,
            boxShadow: '0 8px 24px rgba(15,27,51,.24)',
          },
        },
        items.map(([key, label]) =>
          h(
            'label',
            { key, className: 'row' },
            h('input', {
              type: 'checkbox',
              checked: layers[key],
              onChange: (e) =>
                setLayers({ ...layers, [key]: e.target.checked }),
            }),
            label
          )
        ),
        h(Legend)
      )
  );
}

/**
 * Draggable Bottom Sheet Layout with Map Background
 */
function MapSheet({ mapFn, top, children }) {
  const [snapRatio, setSnapRatio] = useState(0.42);
  const [isDragging, setIsDragging] = useState(false);
  const [viewBox, setViewBox] = useState([0, 0, 100, 70]);

  const containerRef = useRef(null);
  const dragContextRef = useRef(null);
  const mapElementRef = useRef(null);

  // ResizeObserver to automatically adjust SVG viewBox aspect ratio
  useEffect(() => {
    const mapElement = mapElementRef.current;
    if (!mapElement || typeof ResizeObserver === 'undefined') return;

    const updateViewBox = () => {
      const width = mapElement.clientWidth;
      const height = mapElement.clientHeight;
      if (!width || !height) return;

      const aspect = width / height;
      const targetW = aspect >= 100 / 70 ? 70 * aspect : 100;
      const targetH = aspect >= 100 / 70 ? 70 : 100 / aspect;

      setViewBox((current) => {
        if (
          Math.abs(current[2] - targetW) < 0.5 &&
          Math.abs(current[3] - targetH) < 0.5
        ) {
          return current;
        }
        return [50 - targetW / 2, 35 - targetH / 2, targetW, targetH];
      });
    };

    updateViewBox();
    const observer = new ResizeObserver(updateViewBox);
    observer.observe(mapElement);
    return () => observer.disconnect();
  }, []);

  // Snap position candidates (collapsed: 14%, default: 42%, expanded: 80%)
  const SNAP_POINTS = [0.14, 0.42, 0.8];

  return h(
    'div',
    { ref: containerRef, className: 'am' },
    h('div', { ref: mapElementRef, className: 'amap' }, mapFn(viewBox)),
    top && h('div', { className: 'atop' }, top),
    h(
      'div',
      {
        className: 'sheet',
        style: {
          height: `${snapRatio * 100}%`,
          transition: isDragging ? 'none' : 'height .25s ease',
        },
      },
      // Draggable grab bar handle
      h(
        'div',
        {
          className: 'grab',
          role: 'slider',
          tabIndex: 0,
          'aria-label': 'Drag to resize panel',
          'aria-valuenow': Math.round(snapRatio * 100),
          onKeyDown: (e) => {
            if (e.key === 'ArrowUp') setSnapRatio(Math.min(0.8, snapRatio + 0.2));
            if (e.key === 'ArrowDown') setSnapRatio(Math.max(0.14, snapRatio - 0.2));
          },
          onPointerDown: (e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            dragContextRef.current = {
              startY: e.clientY,
              startRatio: snapRatio,
              moved: false,
            };
            setIsDragging(true);
          },
          onPointerMove: (e) => {
            const drag = dragContextRef.current;
            if (!drag) return;
            if (Math.abs(drag.startY - e.clientY) > 4) drag.moved = true;

            const deltaY = drag.startY - e.clientY;
            const containerHeight = containerRef.current.clientHeight;
            const newRatio = drag.startRatio + deltaY / containerHeight;
            setSnapRatio(Math.max(0.12, Math.min(0.85, newRatio)));
          },
          onPointerUp: () => {
            const drag = dragContextRef.current;
            dragContextRef.current = null;
            setIsDragging(false);
            if (!drag) return;

            // If tapped without dragging, cycle to next snap point
            if (!drag.moved) {
              const currentIndex = SNAP_POINTS.findIndex(
                (p) => Math.abs(p - drag.startRatio) < 0.05
              );
              setSnapRatio(SNAP_POINTS[(currentIndex + 1) % SNAP_POINTS.length]);
              return;
            }

            // Snap to closest point
            const nearestSnap = SNAP_POINTS.reduce((closest, point) =>
              Math.abs(point - snapRatio) < Math.abs(closest - snapRatio)
                ? point
                : closest
            );
            setSnapRatio(nearestSnap);
          },
        },
        h('i')
      ),
      // Scrollable sheet content body
      h('div', { className: 'sbody' }, ...React.Children.toArray(children))
    )
  );
}

window.WaitLessShared = {
  Badge,
  B,
  getLevelColorClass,
  lvC,
  EtaCard,
  FareCard,
  FareSettings,
  TripPlan,
  CommNote,
  VCard,
  dragScroll,
  dragX,
  LayersBtn,
  MapSheet,
};
