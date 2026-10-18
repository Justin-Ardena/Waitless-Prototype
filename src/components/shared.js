/**
 * WaitLess Prototype - Modern Shared UI Components
 *
 * Implements:
 * - Status & Severity Badges with border rings
 * - Visual transit trip timeline planner with From/To route connectors
 * - Vehicle fleet cards with visual seat occupancy meters
 * - Real-time ETA prediction cards with congestion chips
 * - Cooperative fare guide & matrix configuration editor
 * - Floating glassmorphic map layers toggle
 * - Smooth draggable bottom sheet with touch snap points
 */

/**
 * Status or Severity Badge
 */
function Badge({ c: colorClass, children, icon = null }) {
  return h(
    'span',
    { className: `b ${colorClass}` },
    icon && h(icon, { size: 12 }),
    children
  );
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
    h(
      'h3',
      null,
      h('span', null, 'ETA with Traffic Congestion'),
      h('span', { className: 'tag' }, 'SIMULATED')
    ),
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
        {
          key: route.id,
          style: {
            marginBottom: 10,
            padding: '10px 12px',
            background: 'var(--surface-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          },
        },
        h(
          'div',
          { className: 'row', style: { justifyContent: 'space-between' } },
          h('b', { style: { fontSize: 13, color: 'var(--tx-primary)' } }, route.name),
          traffic.lv &&
            h(Badge, { c: getLevelColorClass(traffic.lv) }, `${traffic.lv} traffic`)
        ),
        h(
          'div',
          { className: 'mu', style: { marginTop: 4 } },
          nextVehicleArrival
            ? `Next unit ${nextVehicleArrival.v.unit} arrives at ${targetStop.n} in ${formatMinutes(
                nextVehicleArrival.e.adj
              )}. ${
                nextVehicleArrival.e.f > 1
                  ? `Due to ${traffic.lv.toLowerCase()} traffic congestion, this adds +${formatMinutes(
                      nextVehicleArrival.e.adj - nextVehicleArrival.e.base
                    )} (${formatMinutes(nextVehicleArrival.e.base)} in normal flow).`
                  : 'No traffic delay reported on this stretch.'
              }`
            : 'ETA unavailable: no operating vehicle currently reporting fresh telemetry.'
        )
      );
    }),
    h(
      'div',
      { className: 'mu' },
      'Estimates use simulated traffic and vehicle telemetry, not live predictions.'
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
    h(
      'h3',
      null,
      h('span', null, `Fare Guide · ${route.name}`),
      h('span', { className: 'tag' }, `${fullRouteFare.km.toFixed(1)} km`)
    ),
    h(
      'div',
      {
        className: 'row',
        style: {
          marginBottom: 12,
          padding: '10px 12px',
          background: 'var(--surface-subtle)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
        },
      },
      h(
        'div',
        { style: { flex: 1 } },
        h('div', { style: { fontSize: 11, color: 'var(--tx-muted)' } }, 'Regular Fare'),
        h('b', { style: { fontSize: 16, color: 'var(--brand-700)' } }, `₱${fullRouteFare.reg}`)
      ),
      h(
        'div',
        { style: { flex: 1 } },
        h('div', { style: { fontSize: 11, color: 'var(--tx-muted)' } }, 'Student / Senior / PWD'),
        h('b', { style: { fontSize: 16, color: 'var(--ok-tx)' } }, `₱${fullRouteFare.dis}`)
      )
    ),
    h(
      'div',
      { style: { display: 'grid', gap: 6 } },
      route.pick.slice(1).map((stop, index) => {
        const segmentFare = calculateFare(state, route, route.pick[0].p, stop.p);
        return h(
          'div',
          {
            key: index,
            className: 'row mu',
            style: {
              padding: '6px 8px',
              borderBottom: '1px solid var(--border-subtle)',
            },
          },
          h(
            'span',
            { style: { flex: 1, color: 'var(--tx-primary)' } },
            `${route.pick[0].n} → ${stop.n} `,
            h('small', { style: { color: 'var(--tx-muted)' } }, `(${segmentFare.km.toFixed(1)} km)`)
          ),
          h('b', { style: { color: 'var(--brand-900)' } }, `₱${segmentFare.reg}`),
          h('span', { style: { color: 'var(--ok-tx)', fontWeight: 600 } }, `/ ₱${segmentFare.dis}`)
        );
      })
    ),
    h(
      'div',
      { className: 'mu', style: { marginTop: 10 } },
      `LTFRB Rate Formula: ₱${fareConfig.base} base (first ${fareConfig.km} km) + ₱${fareConfig.per}/km, ${fareConfig.disc}% statutory discount. Demonstration rates.`
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
    ['base', 'Base Fare (₱)'],
    ['km', 'Base Distance (km)'],
    ['per', 'Per Succeeding km (₱)'],
    ['disc', 'Statutory Discount (%)'],
  ];

  return h(
    'div',
    { className: 'c' },
    h(
      'h3',
      null,
      h('span', null, 'Cooperative Fare Matrix Settings'),
      h('span', { className: 'tag' }, 'PUVMP')
    ),
    h(
      'div',
      {
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 10,
          marginBottom: 12,
        },
      },
      fields.map(([key, label]) =>
        h(
          'label',
          {
            key,
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              fontSize: 11.5,
              fontWeight: 600,
              color: 'var(--tx-secondary)',
            },
          },
          label,
          h('input', {
            type: 'number',
            min: 0,
            step: 'any',
            value: currentFare[key],
            onChange: (e) => updateSetting(key, e.target.value),
            'aria-label': label,
            style: { width: '100%', padding: '7px 10px' },
          })
        )
      )
    ),
    h(
      'div',
      { style: { display: 'grid', gap: 4 } },
      state.routes
        .filter((route) => route.active)
        .map((route) => {
          const fullFare = calculateFare(state, route, 0, 1);
          return h(
            'div',
            { key: route.id, className: 'mu' },
            `• ${route.name}: ₱${fullFare.reg} regular, ₱${fullFare.dis} discounted (${fullFare.km.toFixed(1)} km)`
          );
        })
    ),
    h(
      'div',
      { className: 'mu', style: { marginTop: 8 } },
      'Adjusted fare parameters synchronize instantly across all Commuter apps. Demo rates.'
    )
  );
}

/**
 * Visual Journey Trip Planner with Vertical Timeline Connectors
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
    h(
      'h3',
      null,
      h('span', null, 'Plan Your Journey'),
      h(
        'button',
        {
          onClick: selectNearestStop,
          style: {
            padding: '4px 10px',
            fontSize: 11.5,
            borderRadius: 'var(--radius-full)',
            background: 'var(--brand-50)',
            color: 'var(--brand-700)',
            border: '1px solid var(--brand-200)',
          },
        },
        '📍 Use my pin'
      )
    ),

    // Visual Vertical Transit Stop Selectors
    h(
      'div',
      {
        style: {
          display: 'grid',
          gap: 10,
          background: 'var(--surface-subtle)',
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          position: 'relative',
        },
      },
      // Origin Stop Selector Row
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 10 } },
        h('span', {
          style: {
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'var(--ok-primary)',
            boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)',
            flexShrink: 0,
          },
        }),
        h(
          'select',
          {
            value: safeOriginIdx,
            onChange: (e) => setOriginIndex(+e.target.value),
            'aria-label': 'From',
            style: { flex: 1, padding: '7px 10px', fontWeight: 600 },
          },
          route.pick.map((stop, idx) =>
            h('option', { key: idx, value: idx }, `From: ${stop.n}`)
          )
        )
      ),

      // Destination Stop Selector Row
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 10 } },
        h('span', {
          style: {
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'var(--brand-600)',
            boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.2)',
            flexShrink: 0,
          },
        }),
        h(
          'select',
          {
            value: safeDestIdx,
            onChange: (e) => setDestIndex(+e.target.value),
            'aria-label': 'To',
            style: { flex: 1, padding: '7px 10px', fontWeight: 600 },
          },
          route.pick.map((stop, idx) =>
            h('option', { key: idx, value: idx }, `To: ${stop.n}`)
          )
        )
      )
    ),

    safeOriginIdx === safeDestIdx
      ? h(
          'div',
          { className: 'mu', style: { marginTop: 8 } },
          'Choose a different destination to calculate estimated travel time and fare.'
        )
      : h(
          'div',
          { style: { marginTop: 12, display: 'grid', gap: 8 } },
          // Fare & Distance Pills
          h(
            'div',
            { className: 'row' },
            h(Badge, { c: 'pr' }, `₱${fare.reg} Regular`),
            h(Badge, { c: 'ok' }, `₱${fare.dis} Student/Senior/PWD`),
            h(
              'span',
              { className: 'mu', style: { fontWeight: 600 } },
              `${fare.km.toFixed(1)} km distance`
            )
          ),

          // Next Vehicle Wait Time
          h(
            'div',
            {
              style: {
                padding: '8px 12px',
                background: 'var(--surface-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              },
            },
            h('span', { style: { color: 'var(--tx-muted)' } }, 'Wait for next unit: '),
            h(
              'b',
              { style: { color: 'var(--brand-700)' } },
              bestVehicle ? formatMinutes(bestVehicle.e.adj) : 'unavailable'
            ),
            bestVehicle &&
              h(
                'span',
                { className: 'mu', style: { marginLeft: 4 } },
                `(${bestVehicle.v.unit}${bestVehicle.e.f > 1 ? ', slowed by traffic' : ''})`
              )
          ),

          // Ride Duration
          h(
            'div',
            {
              style: {
                padding: '8px 12px',
                background: 'var(--surface-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              },
            },
            h('span', { style: { color: 'var(--tx-muted)' } }, 'Ride travel time: '),
            h('b', null, formatMinutes(trafficRideMinutes)),
            h(
              'div',
              { className: 'mu', style: { marginTop: 2 } },
              worstLevel && trafficMultiplier > 1
                ? `Due to ${worstLevel.toLowerCase()} traffic between ${originStop.n} and ${destStop.n} (+${formatMinutes(
                    trafficRideMinutes - baseRideMinutes
                  )}; ${formatMinutes(baseRideMinutes)} in normal conditions)`
                : worstLevel
                ? 'Light traffic, on schedule'
                : 'No delays reported on this corridor'
            )
          ),

          // Total Journey Estimate
          bestVehicle &&
            h(
              'div',
              {
                style: {
                  padding: '10px 14px',
                  background: 'var(--brand-50)',
                  border: '1px solid var(--brand-200)',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  color: 'var(--brand-900)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                },
              },
              h('span', null, 'Total Estimated Journey Time:'),
              h(
                'span',
                { style: { fontSize: 16, color: 'var(--brand-700)' } },
                formatMinutes(bestVehicle.e.adj + trafficRideMinutes)
              )
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
    {
      className: 'mu',
      style: {
        margin: '6px 0',
        padding: '6px 10px',
        background: 'var(--surface-subtle)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-subtle)',
      },
    },
    h(
      'b',
      { style: { color: 'var(--brand-700)' } },
      `Commuters on WaitLess: ${totalCommuters}`
    ),
    ` (simulated): ${waitingCommuters} waiting near demand hotspots, ${state.watch.length} with an active approaching alert.`
  );
}

/**
 * Modern Vehicle Status Card with Visual Seat Occupancy Meter
 */
function VCard({ v: vehicle, pk: pickupPoint, sel: isSelected, onSel: onSelect }) {
  const state = useStoreState();
  const info = getVehicleStatusInfo(vehicle);
  const route = getRouteById(state, vehicle.routeId);

  // Seat occupancy calculations
  const totalSeats = vehicle.total || 33;
  const availSeats = vehicle.avail;
  const occupiedSeats = availSeats == null ? null : Math.max(0, totalSeats - availSeats);
  const occupancyRatio = availSeats == null ? 0 : Math.min(1, occupiedSeats / totalSeats);

  const occupancyColor =
    availSeats === 0
      ? 'var(--er-primary)'
      : availSeats != null && availSeats <= 8
      ? 'var(--wa-primary)'
      : 'var(--ok-primary)';

  return h(
    'div',
    {
      className: `c ${isSelected ? 'sel' : ''}`,
      onClick: () => onSelect && onSelect(vehicle.id),
      style: { cursor: 'pointer', transition: 'all 0.15s ease' },
    },
    // Top Row: Unit, Status Badge, Seat Badge
    h(
      'div',
      { className: 'row', style: { justifyContent: 'space-between' } },
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 6 } },
        h('b', { style: { fontSize: 14.5, color: 'var(--tx-primary)' } }, vehicle.unit),
        h(Badge, { c: info.col }, info.label)
      ),
      h(Badge, { c: info.seatCol }, info.seat)
    ),

    // Visual Seat Occupancy Progress Bar
    availSeats != null &&
      h(
        'div',
        { style: { marginTop: 8 } },
        h(
          'div',
          {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--tx-muted)',
              marginBottom: 4,
            },
          },
          h('span', null, `${availSeats} of ${totalSeats} seats available`),
          h('span', null, `${Math.round(occupancyRatio * 100)}% full`)
        ),
        h(
          'div',
          {
            style: {
              height: 5,
              borderRadius: 'var(--radius-full)',
              background: '#e2e8f0',
              overflow: 'hidden',
            },
          },
          h('i', {
            style: {
              display: 'block',
              height: '100%',
              width: `${occupancyRatio * 100}%`,
              borderRadius: 'var(--radius-full)',
              background: occupancyColor,
              transition: 'width 0.3s ease',
            },
          })
        )
      ),

    // Route & Telemetry Metadata
    h(
      'div',
      { className: 'mu', style: { marginTop: 6 } },
      `${route ? route.name : 'Unassigned'} · Updated ${formatTimeAgo(vehicle.lastAt)} · ${
        state.link && !vehicle.mute ? 'Live GPS' : 'Last known ping'
      }`
    ),

    // Approaching ETA
    pickupPoint &&
      h(
        'div',
        {
          style: {
            marginTop: 6,
            fontWeight: 700,
            color: 'var(--brand-700)',
            fontSize: 12.5,
          },
        },
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
    { style: { position: 'absolute', top: 12, right: 12, zIndex: 15 } },
    h(
      'button',
      {
        'aria-label': 'Map layers',
        'aria-expanded': isOpen,
        onClick: () => setIsOpen(!isOpen),
        style: {
          borderRadius: 'var(--radius-full)',
          padding: '8px 14px',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-subtle)',
          fontWeight: 700,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          color: 'var(--tx-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginLeft: 'auto',
        },
      },
      h(Icons.Layers, { size: 14 }),
      'Layers'
    ),
    isOpen &&
      h(
        'div',
        {
          className: 'c',
          style: {
            marginTop: 8,
            width: 240,
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-subtle)',
          },
        },
        items.map(([key, label]) =>
          h(
            'label',
            { key, className: 'row', style: { padding: '4px 0', cursor: 'pointer' } },
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

  // Snap position candidates (collapsed: 14%, default: 42%, expanded: 82%)
  const SNAP_POINTS = [0.14, 0.42, 0.82];

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
          transition: isDragging ? 'none' : 'height 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
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
            if (e.key === 'ArrowUp') setSnapRatio(Math.min(0.82, snapRatio + 0.2));
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
