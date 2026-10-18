/**
 * WaitLess Prototype - Modern Schematic SVG Map View
 *
 * Renders a state-of-the-art vector transit map featuring:
 * - Clean city blocks, green park spaces, and water corridors
 * - Radiant transit routes with traffic-aware glow effects
 * - Modern vehicle capsule markers with direction indicators and live telemetry beacons
 * - Heatmaps for passenger density and road traffic slowdowns
 * - Commuter location pins with animated radar wave pulses
 * - Modern diagnostic inspection tooltip cards
 */

// District landmarks on schematic map
const DISTRICT_LABELS = [
  ['Jaro', 70, 10],
  ['Mandurriao', 30, 27],
  ['City Proper', 84, 12],
  ['SM City', 86, 52],
  ['Molo', 52, 52],
  ['Hibao-an', 86, 31],
  ['Calumpang', 12, 60],
  ['Airport Rd', 50, 31],
  ['Tagbak', 8, 55],
];

/**
 * Main Schematic Map Component
 */
function MapView({
  routes,
  vs: vehicles,
  sel: selectedVehicleId,
  onSel: onSelectVehicle,
  hot: demandHotspots = [],
  showV: showVehicles = true,
  traf: showTraffic = false,
  comm: showCommuters = false,
  me: userLocation = null,
  onMap: onMapClick = null,
  vb: viewBox = [0, 0, 100, 70],
}) {
  const state = useStoreState();
  const gradientPrefix = 'heatgrad_' + useId().replace(/:/g, '') + '_';

  // State for hovered or pinned vehicle tooltip
  const [hoveredVehicleId, setHoveredVehicleId] = useState(null);
  const [pinnedVehicleId, setPinnedVehicleId] = useState(null);

  /**
   * Resolves route traffic color: Emerald (Light), Amber (Moderate), Rose (Heavy)
   */
  const getRouteTrafficColor = (routeId) => {
    const routeTraffic = state.traffic
      .filter((t) => t.routeId === routeId)
      .map((t) => t.level);

    if (routeTraffic.includes('Heavy')) return '#ef4444';
    if (routeTraffic.includes('Moderate')) return '#f59e0b';
    if (routeTraffic.length && !routeTraffic.includes('Unknown')) return '#10b981';
    return '#3b82f6';
  };

  /**
   * Handles map canvas clicks to reposition user location pin
   */
  const handleSvgClick = (event) => {
    if (!onMapClick) return;
    if (event.target.closest && event.target.closest('.vc')) return; // Ignore clicks on vehicle markers

    const svgElement = event.currentTarget;
    const point = svgElement.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const transformed = point.matrixTransform(svgElement.getScreenCTM().inverse());
    onMapClick(transformed.x, transformed.y);
  };

  // Refs for positioning the HTML tooltip card
  const svgRef = useRef(null);

  const activeVehicleId = hoveredVehicleId || pinnedVehicleId;
  const inspectedVehicle = vehicles.find((v) => v.id === activeVehicleId);

  return h(
    'div',
    { style: { position: 'relative', lineHeight: 0 } },
    h(
    'svg',
    {
      ref: svgRef,
      className: 'm',
      style: onMapClick ? { cursor: 'crosshair' } : undefined,
      onClick: handleSvgClick,
      preserveAspectRatio: 'xMidYMid meet',
      viewBox: viewBox.join(' '),
      role: 'img',
      'aria-label': 'Simulated route map with demand heatmap (offline schematic)',
    },

    // 1. Defs: Heatmap radial gradients
    h(
      'defs',
      null,
      // Radial Heatmap Gradients
      [
        ['High', '#ef4444'],
        ['Moderate', '#f59e0b'],
        ['Low', '#10b981'],
      ].map(([level, color]) =>
        h(
          'radialGradient',
          { key: level, id: gradientPrefix + level },
          h('stop', { offset: '0%', stopColor: color, stopOpacity: 0.85 }),
          h('stop', { offset: '50%', stopColor: color, stopOpacity: 0.35 }),
          h('stop', { offset: '100%', stopColor: color, stopOpacity: 0 })
        )
      )
    ),

    // 2. Base canvas background
    h('rect', { x: -500, y: -500, width: 1000, height: 1000, fill: '#f8fafc' }),

    // 3. City blocks grid (soft slate tiles)
    Array.from({ length: 378 }, (_, i) => {
      const col = (i % 21) - 6;
      const row = Math.floor(i / 21) - 6;
      const x = col * 12.5 + 3;
      const y = row * 13.5 + 2;

      // Cull blocks outside current viewBox
      const isOutOfBounds =
        x + 9 < viewBox[0] ||
        x > viewBox[0] + viewBox[2] ||
        y + 9.5 < viewBox[1] ||
        y > viewBox[1] + viewBox[3];

      if (isOutOfBounds) return null;

      return h('rect', {
        key: `block_${i}`,
        x,
        y,
        width: 9,
        height: 9.5,
        rx: 2,
        fill: '#f1f5f9',
      });
    }),

    // 4. City park/plaza green landmark
    h('rect', { x: 59, y: 19, width: 16, height: 11, rx: 3, fill: '#ecfdf5' }),
    h('rect', { x: 60, y: 20, width: 14, height: 9, rx: 2, fill: '#d1fae5' }),

    // 5. River and arterial water corridors
    h('path', {
      d: 'M-300 78 L0 62 C20 52,35 60,55 50 S85 52,100 40 L400 20',
      fill: 'none',
      stroke: '#bae6fd',
      strokeWidth: 5,
      strokeLinecap: 'round',
    }),
    h('path', {
      d: 'M-200 14 L300 54',
      stroke: '#e2e8f0',
      strokeWidth: 2,
      strokeLinecap: 'round',
    }),
    h('path', {
      d: 'M-5 -350 L105 420',
      stroke: '#e2e8f0',
      strokeWidth: 2,
      strokeLinecap: 'round',
    }),

    // 6. District landmark labels
    DISTRICT_LABELS.map(([label, x, y]) =>
      h(
        'text',
        {
          key: label,
          x,
          y,
          fontSize: 2.2,
          fontWeight: 600,
          fill: '#64748b',
          textAnchor: 'middle',
          letterSpacing: 0.1,
        },
        label
      )
    ),

    // 7. Passenger demand heatmaps
    demandHotspots.map((hotspot) => {
      const route = routes.find((r) => r.id === hotspot.routeId);
      const coords = route && getPositionOnRoute(route, hotspot.p);
      if (!coords) return null;

      const radius = 5 + Math.min(hotspot.count, 40) / 5;

      return h(
        'circle',
        {
          key: hotspot.id,
          cx: coords[0],
          cy: coords[1],
          r: radius,
          fill: `url(#${gradientPrefix}${hotspot.level})`,
        },
        h(
          'title',
          null,
          `${hotspot.loc}: ${hotspot.level} demand, ${hotspot.count} waiting (simulated)`
        )
      );
    }),

    // 8. Traffic congestion heatmaps
    showTraffic &&
      state.traffic.flatMap((trafficReport) => {
        const route = routes.find((r) => r.id === trafficReport.routeId);
        if (!route || trafficReport.level === 'Unknown') return [];

        const defaultProgMap = {
          'Airport Road': 0.55,
          'Molo Crossing': 0.5,
          'Diversion Road': 0.3,
        };
        const centerProgress = trafficReport.p ?? (defaultProgMap[trafficReport.road] ?? 0.5);

        const levelKeyMap = { Heavy: 'High', Moderate: 'Moderate', Light: 'Low' };
        const gradientLevel = levelKeyMap[trafficReport.level] || 'Low';

        const radiusMap = { Heavy: 8, Moderate: 6, Light: 4.5 };
        const radius = radiusMap[trafficReport.level] || 5;

        // Spread circles along congested stretch
        return [-0.12, 0, 0.12].map((offset) => {
          const sampleProgress = Math.max(0, Math.min(1, centerProgress + offset));
          const coords = getPositionOnRoute(route, sampleProgress);
          if (!coords) return null;

          return h(
            'circle',
            {
              key: `${trafficReport.id}_${offset}`,
              cx: coords[0],
              cy: coords[1],
              r: radius,
              fill: `url(#${gradientPrefix}${gradientLevel})`,
            },
            h(
              'title',
              null,
              `${trafficReport.road}: ${trafficReport.level} traffic (simulated)`
            )
          );
        });
      }),

    // 9. Active Route Polylines and Designated Stops
    routes
      .filter((route) => route.active)
      .map((route) => {
        const pointsString = route.pts.map((p) => p.join(',')).join(' ');
        const trafficColor = getRouteTrafficColor(route.id);

        return h(
          'g',
          { key: route.id },
          // Soft ambient glow under route
          h('polyline', {
            points: pointsString,
            fill: 'none',
            stroke: trafficColor,
            strokeWidth: 4.2,
            strokeLinejoin: 'round',
            strokeLinecap: 'round',
            opacity: 0.18,
          }),
          // Outer crisp road casing
          h('polyline', {
            points: pointsString,
            fill: 'none',
            stroke: '#ffffff',
            strokeWidth: 2.8,
            strokeLinejoin: 'round',
          }),
          // Inner colored route polyline
          h('polyline', {
            points: pointsString,
            fill: 'none',
            stroke: trafficColor,
            strokeWidth: 1.5,
            strokeLinejoin: 'round',
            strokeLinecap: 'round',
          }),
          // Route stops / pickup points
          route.pick.map((stop, index) => {
            const coords = getPositionOnRoute(route, stop.p);
            if (!coords) return null;
            const isTerminal = index === 0 || index === route.pick.length - 1;

            return h(
              'g',
              { key: index },
              isTerminal &&
                h('circle', {
                  cx: coords[0],
                  cy: coords[1],
                  r: 2.4,
                  fill: '#ffffff',
                  stroke: trafficColor,
                  strokeWidth: 0.6,
                }),
              h('circle', {
                cx: coords[0],
                cy: coords[1],
                r: isTerminal ? 1.4 : 1.1,
                fill: isTerminal ? trafficColor : '#ffffff',
                stroke: isTerminal ? '#ffffff' : '#0f172a',
                strokeWidth: 0.5,
              }),
              h('title', null, stop.n)
            );
          }),
          // Route badge at starting terminal
          h(
            'g',
            null,
            h('rect', {
              x: route.pts[0][0] - 1,
              y: route.pts[0][1] - 5.5,
              width: route.name.length * 1.6 + 4,
              height: 3.4,
              rx: 1.2,
              fill: '#ffffff',
              stroke: '#e2e8f0',
              strokeWidth: 0.3,
            }),
            h(
              'text',
              {
                x: route.pts[0][0] + 1,
                y: route.pts[0][1] - 3.1,
                fontSize: 2.1,
                fontWeight: 800,
                fill: '#0f172a',
              },
              route.name
            )
          )
        );
      }),

    // 10. Commuter dots on the road
    showCommuters &&
      state.demand.flatMap((demandItem) => {
        const route = routes.find((r) => r.id === demandItem.routeId);
        const coords = route && getPositionOnRoute(route, demandItem.p);
        if (!coords) return [];

        const dotCount = Math.min(10, Math.round(demandItem.count / 4));
        return Array.from({ length: dotCount }, (_, i) => {
          const angle = i * 2.4;
          const distance = 1.6 + (i % 3) * 1.1;
          return h(
            'circle',
            {
              key: `${demandItem.id}_c_${i}`,
              cx: coords[0] + Math.cos(angle) * distance,
              cy: coords[1] + Math.sin(angle) * distance,
              r: 0.85,
              fill: '#2563eb',
              stroke: '#ffffff',
              strokeWidth: 0.3,
            },
            h('title', null, `Commuter waiting near ${demandItem.loc} (simulated)`)
          );
        });
      }),

    // 11. Approaching vehicle alert watch rings
    showCommuters &&
      state.watch.map((watchItem, index) => {
        const vehicle = state.vehicles.find((v) => v.id === watchItem.vid);
        const route = routes.find((r) => r.id === vehicle?.routeId);
        const coords = route && getPositionOnRoute(route, watchItem.p);
        if (!coords) return null;

        return h(
          'g',
          { key: `watch_${index}` },
          h(
            'circle',
            {
              cx: coords[0] + 1,
              cy: coords[1] - 2.2,
              r: 2.4,
              fill: 'none',
              stroke: '#2563eb',
              strokeWidth: 0.5,
              strokeDasharray: '1 0.8',
            },
            h('animateTransform', {
              attributeName: 'transform',
              type: 'rotate',
              from: `0 ${coords[0] + 1} ${coords[1] - 2.2}`,
              to: `360 ${coords[0] + 1} ${coords[1] - 2.2}`,
              dur: '6s',
              repeatCount: 'indefinite',
            })
          ),
          h('circle', {
            cx: coords[0] + 1,
            cy: coords[1] - 2.2,
            r: 1.1,
            fill: '#2563eb',
            stroke: '#ffffff',
            strokeWidth: 0.3,
          }),
          h('title', null, `App user with an alert at ${watchItem.pn} (simulated)`)
        );
      }),

    // 12. "You are here" Commuter Location Pin (Modern Pulsing Beacon)
    userLocation &&
      h(
        'g',
        { key: 'user_location' },
        h(
          'circle',
          {
            cx: userLocation[0],
            cy: userLocation[1],
            r: 3.5,
            fill: '#2563eb',
            opacity: 0.2,
          },
          h('animate', {
            attributeName: 'r',
            values: '2.5;5.5;2.5',
            dur: '2s',
            repeatCount: 'indefinite',
          }),
          h('animate', {
            attributeName: 'opacity',
            values: '0.4;0.05;0.4',
            dur: '2s',
            repeatCount: 'indefinite',
          })
        ),
        h('path', {
          d: `M${userLocation[0]} ${userLocation[1]} c-2.6-3.2-3.4-4.6-3.4-6.1a3.4 3.4 0 1 1 6.8 0c0 1.5-.8 2.9-3.4 6.1z`,
          fill: '#2563eb',
          stroke: '#ffffff',
          strokeWidth: 0.7,
        }),
        h('circle', {
          cx: userLocation[0],
          cy: userLocation[1] - 6.1,
          r: 1.3,
          fill: '#ffffff',
        }),
        // Modern Pill Label
        h('rect', {
          x: userLocation[0] - 3.8,
          y: userLocation[1] + 2,
          width: 7.6,
          height: 3.2,
          rx: 1.6,
          fill: '#1e3a8a',
        }),
        h(
          'text',
          {
            x: userLocation[0],
            y: userLocation[1] + 4.2,
            fontSize: 2,
            fontWeight: 800,
            fill: '#ffffff',
            textAnchor: 'middle',
          },
          'YOU'
        ),
        h('title', null, 'You are here (simulated)')
      ),

    // 13. Active Vehicle Markers (Modern Rounded Capsule with Beacon)
    showVehicles &&
      vehicles.map((vehicle) => {
        const route = routes.find((r) => r.id === vehicle.routeId);
        const coords = getPositionOnRoute(route, vehicle.p);
        if (!coords) return null;

        const info = getVehicleStatusInfo(vehicle);
        const statusColors = {
          gr: '#64748b',
          er: '#ef4444',
          pr: '#2563eb',
          ok: '#10b981',
        };
        const fillColor = statusColors[info.col] || '#10b981';
        const isSelected = selectedVehicleId === vehicle.id;

        return h(
          'g',
          {
            key: vehicle.id,
            className: 'vc',
            onMouseEnter: () => setHoveredVehicleId(vehicle.id),
            onMouseLeave: () => setHoveredVehicleId(null),
            onClick: () => {
              setPinnedVehicleId((prev) => (prev === vehicle.id ? null : vehicle.id));
              if (onSelectVehicle) onSelectVehicle(vehicle.id);
            },
          },
          // Selected vehicle halo glow
          isSelected &&
            h('circle', {
              cx: coords[0],
              cy: coords[1],
              r: 3.8,
              fill: 'none',
              stroke: '#2563eb',
              strokeWidth: 0.6,
              opacity: 0.8,
            }),
          // Vehicle capsule body (no SVG filter — causes rendering dropout on small viewBox)
          h('rect', {
            x: coords[0] - 2.6,
            y: coords[1] - 1.8,
            width: 5.2,
            height: 3.6,
            rx: 1.8,
            fill: fillColor,
            stroke: isSelected ? '#0f172a' : '#ffffff',
            strokeWidth: isSelected ? 0.8 : 0.6,
          }),
          // Unit ID digits
          h(
            'text',
            {
              x: coords[0],
              y: coords[1] + 0.8,
              fontSize: 1.8,
              fill: '#ffffff',
              textAnchor: 'middle',
              fontWeight: 800,
              letterSpacing: 0.1,
            },
            vehicle.unit.slice(-3)
          ),
          h('title', null, vehicle.unit)
        );
      }),

    // 14. (Tooltip rendered as HTML overlay below, outside the SVG)
  ), // end <svg>

  // 14. HTML Vehicle Diagnostic Tooltip — floats over the map as a real card
  // Uses the .c card class so it always has a white background like all other cards.
  (() => {
    if (!inspectedVehicle) return null;
    const route = routes.find((r) => r.id === inspectedVehicle.routeId);
    if (!route) return null;

    const info = getVehicleStatusInfo(inspectedVehicle);

    // Status badge color map
    const statusColorHex = { gr: '#64748b', er: '#ef4444', pr: '#2563eb', ok: '#10b981' };
    const statusColor = statusColorHex[info.col] || '#10b981';
    const seatColorHex = { gr: '#64748b', er: '#ef4444', wa: '#f59e0b', ok: '#10b981' };
    const seatColor = seatColorHex[info.seatCol] || '#10b981';

    // Find next stop based on direction of travel
    const nextStop = route.pick
      .filter((stop) =>
        inspectedVehicle.dir > 0
          ? stop.p >= inspectedVehicle.p
          : stop.p <= inspectedVehicle.p
      )
      .sort((a, b) => Math.abs(a.p - inspectedVehicle.p) - Math.abs(b.p - inspectedVehicle.p))[0]
      || route.pick[route.pick.length - 1];

    const eta = nextStop && calculateEta(state, inspectedVehicle, nextStop);
    const etaText = eta
      ? `ETA to ${nextStop.n}: ${formatMinutes(eta.adj)}` +
        (eta.lv && eta.f > 1
          ? ` (+${formatMinutes(eta.adj - eta.base)} ${eta.lv.toLowerCase()} traffic)`
          : '')
      : 'ETA unavailable';

    const seatText = inspectedVehicle.avail == null
      ? 'Seats unknown'
      : `${inspectedVehicle.avail} of ${inspectedVehicle.total} seats free`;

    return h(
      'div',
      {
        key: 'html-tooltip',
        style: {
          position: 'absolute',
          bottom: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(320px, calc(100% - 24px))',
          background: '#ffffff',
          border: '1px solid #bfdbfe',
          borderRadius: 12,
          boxShadow: '0 4px 24px rgba(15,23,42,0.13), 0 1px 4px rgba(15,23,42,0.07)',
          padding: '12px 14px',
          pointerEvents: 'none',
          zIndex: 10,
          lineHeight: '1.4',
        },
      },
      // Header: unit name + status badge
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 } },
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: 6 } },
          h('b', { style: { fontSize: 14, color: '#0f172a' } }, inspectedVehicle.unit),
          h(
            'span',
            {
              style: {
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 999,
                background: statusColor + '1a',
                color: statusColor,
                border: `1px solid ${statusColor}44`,
              },
            },
            info.label
          )
        ),
        h(
          'span',
          {
            style: {
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 999,
              background: seatColor + '1a',
              color: seatColor,
              border: `1px solid ${seatColor}44`,
            },
          },
          info.seat
        )
      ),
      // Route name
      h(
        'div',
        { style: { fontSize: 11.5, color: '#475569', marginBottom: 4 } },
        `${route.name} · ${seatText}`
      ),
      // ETA
      h(
        'div',
        { style: { fontSize: 12, color: '#1e40af', fontWeight: 600, marginBottom: 4 } },
        etaText
      ),
      // Last update
      h(
        'div',
        { style: { fontSize: 11, color: '#94a3b8' } },
        `Updated ${formatTimeAgo(inspectedVehicle.lastAt)} · Simulated LoRaWAN`
      )
    );
  })()
  ); // end outer wrapper div
}

/**
 * Modern Map Color Key & Legend Bar
 */
function Legend() {
  return h(
    'div',
    { className: 'lg' },
    h(
      'span',
      { style: { display: 'inline-flex', alignItems: 'center' } },
      h('i', { style: { background: '#10b981' } }),
      'Light'
    ),
    h(
      'span',
      { style: { display: 'inline-flex', alignItems: 'center' } },
      h('i', { style: { background: '#f59e0b' } }),
      'Moderate'
    ),
    h(
      'span',
      { style: { display: 'inline-flex', alignItems: 'center' } },
      h('i', { style: { background: '#ef4444' } }),
      'Heavy'
    ),
    h('span', null, 'Demand ', h('span', { className: 'heat' })),
    h(
      'span',
      { style: { color: 'var(--tx-muted)', marginLeft: 'auto' } },
      '● Green: On route · Blue: Terminal · Red: Out · Gray: Stale'
    )
  );
}

window.WaitLessComponents = {
  ...(window.WaitLessComponents || {}),
  MapView,
  Legend,
};
