/**
 * WaitLess Prototype - Schematic SVG Map View
 *
 * Renders an interactive vector map showing:
 * - City grid blocks, landmarks, and arterial corridors
 * - Modernized Jeepney routes and designated pickup points
 * - Active vehicle locations with operational status badges
 * - Heatmaps for passenger demand and road traffic congestion
 * - Commuters waiting at stops and active alert indicators
 * - Interactive commuter pin placement and vehicle inspection tooltip
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
   * Resolves route traffic color: Green (Light), Yellow (Moderate), Red (Heavy)
   */
  const getRouteTrafficColor = (routeId) => {
    const routeTraffic = state.traffic
      .filter((t) => t.routeId === routeId)
      .map((t) => t.level);

    if (routeTraffic.includes('Heavy')) return '#dc2626';
    if (routeTraffic.includes('Moderate')) return '#f59e0b';
    if (routeTraffic.length && !routeTraffic.includes('Unknown')) return '#16a34a';
    return '#2563eb';
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

  const activeVehicleId = hoveredVehicleId || pinnedVehicleId;
  const inspectedVehicle = vehicles.find((v) => v.id === activeVehicleId);

  return h(
    'svg',
    {
      className: 'm',
      style: onMapClick ? { cursor: 'crosshair' } : undefined,
      onClick: handleSvgClick,
      preserveAspectRatio: 'xMidYMid meet',
      viewBox: viewBox.join(' '),
      role: 'img',
      'aria-label': 'Simulated route map with demand heatmap (offline schematic)',
    },

    // 1. Defs: Heatmap radial gradients for High, Moderate, and Low
    h(
      'defs',
      null,
      [
        ['High', '#ef4444'],
        ['Moderate', '#f59e0b'],
        ['Low', '#22c55e'],
      ].map(([level, color]) =>
        h(
          'radialGradient',
          { key: level, id: gradientPrefix + level },
          h('stop', { offset: '0%', stopColor: color, stopOpacity: 0.9 }),
          h('stop', { offset: '55%', stopColor: color, stopOpacity: 0.4 }),
          h('stop', { offset: '100%', stopColor: color, stopOpacity: 0 })
        )
      )
    ),

    // 2. Base canvas background
    h('rect', { x: -500, y: -500, width: 1000, height: 1000, fill: '#ffffff' }),

    // 3. City block grid
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
        rx: 1.2,
        fill: '#eef4fd',
      });
    }),

    // 4. City center plaza landmark
    h('rect', { x: 60, y: 20, width: 14, height: 9, rx: 2, fill: '#e2edfb' }),

    // 5. River and arterial highway paths
    h('path', {
      d: 'M-300 78 L0 62 C20 52,35 60,55 50 S85 52,100 40 L400 20',
      fill: 'none',
      stroke: '#cfe4f7',
      strokeWidth: 4.5,
      strokeLinecap: 'round',
    }),
    h('path', { d: 'M-200 14 L300 54', stroke: '#d6e4f8', strokeWidth: 1.8 }),
    h('path', { d: 'M-5 -350 L105 420', stroke: '#d6e4f8', strokeWidth: 1.8 }),

    // 6. District landmark labels
    DISTRICT_LABELS.map(([label, x, y]) =>
      h(
        'text',
        {
          key: label,
          x,
          y,
          fontSize: 2.1,
          fill: '#64748b',
          textAnchor: 'middle',
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
        h('title', null, `${hotspot.loc}: ${hotspot.level} demand, ${hotspot.count} waiting (simulated)`)
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

        // Render multi-point spread along congested stretch
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
            h('title', null, `${trafficReport.road}: ${trafficReport.level} traffic (simulated)`)
          );
        });
      }),

    // 9. Active Route Polylines and Designated Stops
    routes
      .filter((route) => route.active)
      .map((route) => {
        const pointsString = route.pts.map((p) => p.join(',')).join(' ');

        return h(
          'g',
          { key: route.id },
          // Outer white road casing
          h('polyline', {
            points: pointsString,
            fill: 'none',
            stroke: '#ffffff',
            strokeWidth: 2.6,
            strokeLinejoin: 'round',
          }),
          // Inner colored route polyline with traffic indication
          h('polyline', {
            points: pointsString,
            fill: 'none',
            stroke: getRouteTrafficColor(route.id),
            strokeWidth: 1.3,
            strokeLinejoin: 'round',
            strokeLinecap: 'round',
          }),
          // Route stops / pickup points
          route.pick.map((stop, index) => {
            const coords = getPositionOnRoute(route, stop.p);
            if (!coords) return null;
            const isIntermediate = index % 2 === 1;

            return h(
              'circle',
              {
                key: index,
                cx: coords[0],
                cy: coords[1],
                r: isIntermediate ? 1.0 : 1.7,
                fill: isIntermediate ? '#ffffff' : '#0f1b33',
                stroke: '#0f1b33',
                strokeWidth: 0.4,
              },
              h('title', null, stop.n)
            );
          }),
          // Route label at starting terminal
          h(
            'text',
            {
              x: route.pts[0][0],
              y: route.pts[0][1] - 3,
              fontSize: 2.5,
              fontWeight: 700,
              fill: '#0f1b33',
            },
            route.name
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
          h('circle', {
            cx: coords[0] + 1,
            cy: coords[1] - 2.2,
            r: 2,
            fill: 'none',
            stroke: '#2563eb',
            strokeWidth: 0.5,
          }),
          h('circle', {
            cx: coords[0] + 1,
            cy: coords[1] - 2.2,
            r: 1,
            fill: '#2563eb',
            stroke: '#ffffff',
            strokeWidth: 0.3,
          }),
          h('title', null, `App user with an alert at ${watchItem.pn} (simulated)`)
        );
      }),

    // 12. "You are here" Commuter Location Pin
    userLocation &&
      h(
        'g',
        { key: 'user_location' },
        h(
          'circle',
          {
            cx: userLocation[0],
            cy: userLocation[1],
            r: 3,
            fill: '#2563eb',
            opacity: 0.2,
          },
          h('animate', {
            attributeName: 'r',
            values: '2.5;5;2.5',
            dur: '2s',
            repeatCount: 'indefinite',
          })
        ),
        h('path', {
          d: `M${userLocation[0]} ${userLocation[1]} c-2.6-3.2-3.4-4.6-3.4-6.1a3.4 3.4 0 1 1 6.8 0c0 1.5-.8 2.9-3.4 6.1z`,
          fill: '#2563eb',
          stroke: '#ffffff',
          strokeWidth: 0.5,
        }),
        h('circle', {
          cx: userLocation[0],
          cy: userLocation[1] - 6.1,
          r: 1.3,
          fill: '#ffffff',
        }),
        h(
          'text',
          {
            x: userLocation[0],
            y: userLocation[1] + 3.6,
            fontSize: 2.3,
            fontWeight: 700,
            fill: '#1e3a8a',
            textAnchor: 'middle',
          },
          'You'
        ),
        h('title', null, 'You are here (simulated)')
      ),

    // 13. Active Vehicle Markers
    showVehicles &&
      vehicles.map((vehicle) => {
        const route = routes.find((r) => r.id === vehicle.routeId);
        const coords = getPositionOnRoute(route, vehicle.p);
        if (!coords) return null;

        const info = getVehicleStatusInfo(vehicle);
        const statusColors = {
          gr: '#6b7280',
          er: '#dc2626',
          pr: '#2563eb',
          ok: '#16a34a',
        };
        const fillColor = statusColors[info.col] || '#16a34a';
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
          h('rect', {
            x: coords[0] - 2.3,
            y: coords[1] - 1.5,
            width: 4.6,
            height: 3,
            rx: 1,
            fill: fillColor,
            stroke: isSelected ? '#0f1b33' : '#ffffff',
            strokeWidth: isSelected ? 0.6 : 0.4,
          }),
          h(
            'text',
            {
              x: coords[0],
              y: coords[1] + 0.7,
              fontSize: 1.7,
              fill: '#ffffff',
              textAnchor: 'middle',
              fontWeight: 700,
            },
            vehicle.unit.slice(-3)
          ),
          h('title', null, vehicle.unit)
        );
      }),

    // 14. Hover / Click Tooltip Overlay
    (() => {
      if (!inspectedVehicle) return null;
      const route = routes.find((r) => r.id === inspectedVehicle.routeId);
      const coords = getPositionOnRoute(route, inspectedVehicle.p);
      if (!coords) return null;

      const info = getVehicleStatusInfo(inspectedVehicle);

      // Find next stop according to traversal direction
      const nextStop =
        route &&
        (route.pick
          .filter((stop) =>
            inspectedVehicle.dir > 0
              ? stop.p >= inspectedVehicle.p
              : stop.p <= inspectedVehicle.p
          )
          .sort(
            (a, b) =>
              Math.abs(a.p - inspectedVehicle.p) - Math.abs(b.p - inspectedVehicle.p)
          )[0] || route.pick[route.pick.length - 1]);

      const eta = nextStop && calculateEta(state, inspectedVehicle, nextStop);

      const lines = [
        `${inspectedVehicle.unit} · ${route ? route.name : ''}`,
        `${info.label} · ${info.seat}`,
        inspectedVehicle.avail == null
          ? 'Seats unknown'
          : `${inspectedVehicle.avail} of ${inspectedVehicle.total} seats free`,
        ...(eta
          ? [
              `Simulated ETA to ${nextStop.n}: ${formatMinutes(eta.adj)}`,
              eta.lv && eta.f > 1
                ? `+${formatMinutes(eta.adj - eta.base)} due to ${eta.lv.toLowerCase()} traffic congestion`
                : eta.lv
                ? 'Light traffic, no delay'
                : 'No traffic report',
            ]
          : ['ETA unavailable']),
        `Updated ${formatTimeAgo(inspectedVehicle.lastAt)}`,
        'Source: simulated GPS',
      ];

      const tooltipWidth = 52;
      const tooltipHeight = lines.length * 3 + 2;

      // Ensure tooltip stays nicely positioned inside visible viewBox boundaries
      const tooltipX = Math.max(
        viewBox[0] + 1,
        Math.min(viewBox[0] + viewBox[2] - tooltipWidth - 1, coords[0] - tooltipWidth / 2)
      );
      const tooltipY =
        coords[1] - tooltipHeight - 3 < viewBox[1] + 1
          ? coords[1] + 3
          : coords[1] - tooltipHeight - 3;

      return h(
        'g',
        { style: { pointerEvents: 'none' } },
        h('rect', {
          x: tooltipX,
          y: tooltipY,
          width: tooltipWidth,
          height: tooltipHeight,
          rx: 1.5,
          fill: '#ffffff',
          stroke: '#2563eb',
          strokeWidth: 0.4,
        }),
        lines.map((lineText, idx) =>
          h(
            'text',
            {
              key: idx,
              x: tooltipX + 2,
              y: tooltipY + 3.6 + idx * 3,
              fontSize: 2.1,
              fontWeight: idx === 0 ? 700 : 400,
              fill: '#0f1b33',
            },
            lineText
          )
        )
      );
    })()
  );
}

/**
 * Map Color Key & Legend Bar
 */
function Legend() {
  return h(
    'div',
    { className: 'lg' },
    h('span', null, h('i', { style: { background: '#16a34a' } }), 'Light'),
    h('span', null, h('i', { style: { background: '#f59e0b' } }), 'Moderate'),
    h('span', null, h('i', { style: { background: '#dc2626' } }), 'Heavy traffic'),
    h('span', null, 'Demand ', h('span', { className: 'heat' })),
    h('span', null, 'Vehicle: green on route, blue terminal, red out, gray stale'),
    h('span', null, 'Schematic map · simulated data')
  );
}

window.WaitLessComponents = {
  ...(window.WaitLessComponents || {}),
  MapView,
  Legend,
};
