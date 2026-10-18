/**
 * WaitLess Prototype - Modern Commuter Application View
 *
 * Implements:
 * - Commuter onboarding & seamless demo login
 * - High-end animated welcome splash screen with Modernized Jeepney graphic
 * - Route search, interactive schematic route map, and layer controls
 * - Draggable bottom sheet with Trip Planner, Live Jeepneys list, Fare guide, and approaching-vehicle alerts
 */

/**
 * Animated Welcome Splash Screen with Modernized Jeepney
 */
function SplashWelcome(name, onSkip) {
  return h(
    'div',
    { className: 'sp2', role: 'status', 'aria-live': 'polite' },
    h('i', { className: 'blob b1' }),
    h('i', { className: 'blob b2' }),
    h(
      'div',
      { className: 'sp2c' },
      h('div', { className: 'sp2logo' }, 'W'),
      h('div', { className: 'sp2hi' }, 'Welcome aboard,'),
      h('div', { className: 'sp2nm' }, name),
      h(
        'div',
        { className: 'sp2msg' },
        h('span', null, 'Finding optimal routes…'),
        h('span', null, 'Checking nearby modernized jeepneys…'),
        h('span', null, 'Loading live traffic conditions…')
      ),
      h('div', { className: 'lbar' }, h('i'))
    ),
    h(
      'div',
      { className: 'road' },
      h(
        'div',
        { className: 'bus' },
        h(
          'svg',
          { viewBox: '0 0 68 34', width: 68, 'aria-hidden': 'true' },
          // Jeepney Chassis
          h('rect', { x: 2, y: 5, width: 62, height: 20, rx: 6, fill: '#2563eb' }),
          // Roof Cap
          h('path', { d: 'M4 5 Q34 2 62 5', stroke: '#38bdf8', strokeWidth: 1.5, fill: 'none' }),
          // Windows
          h('rect', { x: 8, y: 9, width: 12, height: 8, rx: 2, fill: '#e0f2fe' }),
          h('rect', { x: 23, y: 9, width: 13, height: 8, rx: 2, fill: '#e0f2fe' }),
          h('rect', { x: 39, y: 9, width: 14, height: 8, rx: 2, fill: '#e0f2fe' }),
          // Racing Stripe
          h('rect', { x: 2, y: 19, width: 62, height: 3, fill: '#1d4ed8' }),
          // Headlight
          h('circle', { cx: 62, cy: 17, r: 2, fill: '#fef08a' }),
          // Wheels
          h('circle', { cx: 16, cy: 26, r: 5.5, fill: '#0f172a' }),
          h('circle', { cx: 16, cy: 26, r: 2.5, fill: '#94a3b8' }),
          h('circle', { cx: 50, cy: 26, r: 5.5, fill: '#0f172a' }),
          h('circle', { cx: 50, cy: 26, r: 2.5, fill: '#94a3b8' })
        )
      )
    ),
    h(
      'button',
      { className: 'sp2skip', onClick: onSkip },
      'Skip animation'
    )
  );
}
const SplashNew = SplashWelcome; // Backward-compatible alias

/**
 * Commuter Container (handles auth state and splash transitions)
 */
function Commuter() {
  const state = useStoreState();
  const [nameInput, setNameInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSplash, setShowSplash] = useState(false);

  const handleLogin = (userName) => {
    if (userName) {
      setShowSplash(true);
      setTimeout(() => setShowSplash(false), 2600);
    }
    updateStoreState((prev) => ({ ...prev, cuser: userName }));
  };

  // 1. Show animated splash screen on fresh login
  if (state.cuser && showSplash) {
    return SplashWelcome(state.cuser, () => setShowSplash(false));
  }

  // 2. If logged in, render user header and main commuter application
  if (state.cuser) {
    return h(
      React.Fragment,
      null,
      h(
        'div',
        { className: 'in', style: { paddingBottom: 0 } },
        h(
          'div',
          {
            className: 'c row',
            style: {
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface)',
            },
          },
          h(
            'span',
            { style: { flex: 1, display: 'flex', alignItems: 'center', gap: 6 } },
            h(Icons.Users, { size: 16, color: 'var(--brand-600)' }),
            'Hi, ',
            h('b', { style: { color: 'var(--brand-900)' } }, state.cuser)
          ),
          h(
            'button',
            {
              onClick: () => handleLogin(null),
              style: {
                padding: '4px 10px',
                fontSize: 11.5,
                borderRadius: 'var(--radius-full)',
                color: 'var(--tx-muted)',
              },
            },
            'Log out'
          )
        )
      ),
      h(CommuterApp)
    );
  }

  // 3. Login / Onboarding screen
  return h(
    'div',
    { className: 'in', style: { textAlign: 'center', paddingTop: 28 } },
    // Glowing Emblem
    h(
      'div',
      {
        className: 'logo',
        style: {
          width: 72,
          height: 72,
          fontSize: 36,
          borderRadius: 22,
          margin: '0 auto 12px',
          boxShadow: '0 12px 30px rgba(37, 99, 235, 0.35)',
        },
      },
      'W'
    ),
    h(
      'h1',
      {
        style: {
          margin: '0 0 4px',
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: 'var(--brand-900)',
        },
      },
      'WaitLess'
    ),
    h(
      'div',
      { className: 'mu', style: { fontSize: 13.5, marginBottom: 16 } },
      'Your Ride, Closer Than You Think.'
    ),
    // Login Card
    h(
      'div',
      { className: 'c', style: { textAlign: 'left', padding: '18px 20px' } },
      h(
        'h3',
        { style: { fontSize: 15, marginBottom: 12 } },
        'Log in to continue'
      ),
      h('input', {
        placeholder: 'Enter your name',
        value: nameInput,
        'aria-label': 'Your name',
        style: { width: '100%', padding: '10px 14px', fontSize: 14 },
        onChange: (e) => setNameInput(e.target.value),
        onKeyDown: (e) => {
          if (e.key === 'Enter') document.getElementById('wl-login')?.click();
        },
      }),
      errorMessage &&
        h(
          'div',
          {
            style: {
              color: 'var(--er-primary)',
              fontSize: 12,
              marginTop: 6,
              fontWeight: 600,
            },
          },
          errorMessage
        ),
      h(
        'button',
        {
          id: 'wl-login',
          className: 'p',
          style: { width: '100%', marginTop: 12, padding: '10px' },
          onClick: () => {
            if (nameInput.trim().length < 2) {
              return setErrorMessage('Enter your name (at least 2 characters).');
            }
            setErrorMessage('');
            handleLogin(nameInput.trim());
          },
        },
        'Continue to App'
      ),
      h(
        'button',
        {
          style: {
            width: '100%',
            marginTop: 8,
            padding: '9px',
            background: 'var(--surface-subtle)',
          },
          onClick: () => handleLogin('Guest Passenger'),
        },
        'Explore as Guest'
      )
    ),
    // Highlights pills
    h(
      'div',
      { className: 'row', style: { justifyContent: 'center', marginTop: 8 } },
      h(Badge, { c: 'pr', icon: Icons.MapPin }, 'Find routes'),
      h(Badge, { c: 'pr', icon: Icons.Clock }, 'Traffic ETAs'),
      h(Badge, { c: 'pr', icon: Icons.Bus }, 'Seat info'),
      h(Badge, { c: 'pr', icon: Icons.Bell }, 'Approaching alerts')
    ),
    h(
      'div',
      { className: 'mu', style: { marginTop: 10, fontSize: 11.5 } },
      'Demo environment: No password or signup required. Simulated transit data is saved locally in this browser.'
    )
  );
}

/**
 * Main Commuter Interactive Experience
 */
function CommuterApp() {
  const state = useStoreState();

  const [selectedRouteId, setSelectedRouteId] = useState(state.routes[0]?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [originStopIndex, setOriginStopIndex] = useState(0);
  const [destStopIndex, setDestStopIndex] = useState(99);
  const [activeTab, setActiveTab] = useState('trip');
  const [snapRatio, setSnapRatio] = useState(0.42);
  const [isDragging, setIsDragging] = useState(false);
  const [viewBox, setViewBox] = useState([0, 0, 100, 70]);

  // Map layer visibility toggles
  const [layerVisibility, setLayerVisibility] = useState({
    tf: true, // Traffic heatmap
    dm: true, // Demand heatmap
    cm: true, // Commuter dots
  });

  const containerRef = useRef(null);
  const dragContextRef = useRef(null);
  const mapElementRef = useRef(null);

  // ResizeObserver for dynamic SVG aspect ratio adjustments
  useEffect(() => {
    const mapElement = mapElementRef.current;
    if (!mapElement || typeof ResizeObserver === 'undefined') return;

    const handleResize = () => {
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

    handleResize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(mapElement);
    return () => observer.disconnect();
  }, []);

  // Filter routes
  const activeRoutes = state.routes.filter((r) => r.active);
  const matchingRoutes = activeRoutes.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const foundRoute = getRouteById(state, selectedRouteId);
  const activeRoute = foundRoute && foundRoute.active ? foundRoute : activeRoutes[0];

  if (!activeRoute) {
    return h(
      'div',
      { className: 'in' },
      h(
        'div',
        { className: 'c mu' },
        'No active routes. Ask the cooperative to activate one.'
      )
    );
  }

  const routeVehicles = state.vehicles.filter((v) => v.routeId === activeRoute.id);
  const selectedStop =
    activeRoute.pick[Math.min(originStopIndex, activeRoute.pick.length - 1)];
  const userPin = state.cloc || [22, 40];

  // Best next vehicle arrival
  const bestVehicleArrival = routeVehicles
    .map((v) => ({ v, e: calculateEta(state, v, selectedStop) }))
    .filter((item) => item.e)
    .sort((a, b) => a.e.adj - b.e.adj)[0];

  const renderTabChip = (key, label, icon) =>
    h(
      'button',
      {
        key,
        className: activeTab === key ? 'p' : '',
        onClick: () => setActiveTab(key),
      },
      icon && h(icon, { size: 13 }),
      label
    );

  const SNAP_POINTS = [0.14, 0.42, 0.82];

  return h(
    'div',
    { ref: containerRef, className: 'am' },

    // 1. Interactive Map Container
    h(
      'div',
      { ref: mapElementRef, className: 'amap' },
      h(LayersBtn, {
        L: layerVisibility,
        setL: setLayerVisibility,
        items: [
          ['dm', 'Demand heatmap'],
          ['tf', 'Traffic heatmap'],
          ['cm', 'Commuters on the road'],
        ],
      }),
      h(MapView, {
        routes: [activeRoute],
        vs: routeVehicles,
        sel: selectedVehicleId,
        onSel: (id) => {
          setSelectedVehicleId(id);
          setActiveTab('vehicles');
          setSnapRatio(0.42);
        },
        hot: layerVisibility.dm
          ? state.demand.filter((d) => d.routeId === activeRoute.id)
          : [],
        traf: layerVisibility.tf,
        comm: layerVisibility.cm,
        vb: viewBox,
        me: userPin,
        onMap: (x, y) =>
          updateStoreState((prev) => ({
            ...prev,
            cloc: [Math.max(3, Math.min(97, x)), Math.max(8, Math.min(67, y))],
          })),
      })
    ),

    // 2. Top Floating Search Bar & Route Carousel
    h(
      'div',
      { className: 'atop' },
      h(
        'div',
        { style: { position: 'relative', display: 'flex', alignItems: 'center' } },
        h(Icons.Search, {
          size: 15,
          color: 'var(--tx-muted)',
          style: { position: 'absolute', left: 14, pointerEvents: 'none' },
        }),
        h('input', {
          placeholder: 'Search jeepney routes…',
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          'aria-label': 'Search routes',
          style: { width: '100%', paddingLeft: 38 },
        })
      ),
      h(
        'div',
        { className: 'chips', ...dragScroll },
        matchingRoutes.length
          ? matchingRoutes.map((route) =>
              h(
                'button',
                {
                  key: route.id,
                  className: route.id === activeRoute.id ? 'p' : '',
                  onClick: () => {
                    setSelectedRouteId(route.id);
                    setOriginStopIndex(0);
                    setDestStopIndex(99);
                    setSelectedVehicleId(null);
                  },
                },
                route.name
              )
            )
          : h('span', { className: 'mu' }, 'No routes match.')
      )
    ),

    // 3. In-App Approaching Vehicle Toast Banner
    state.toasts.length > 0 &&
      h(
        'div',
        { className: 'atoast' },
        state.toasts.slice(0, 1).map((toast) =>
          h(
            'div',
            { key: toast.id, className: 'toast' },
            h(Icons.Bell, { size: 16 }),
            h('span', { style: { flex: 1, fontWeight: 600 } }, toast.msg),
            h(
              'button',
              {
                onClick: () =>
                  updateStoreState((prev) => ({
                    ...prev,
                    toasts: prev.toasts.filter((t) => t.id !== toast.id),
                  })),
              },
              'Dismiss'
            )
          )
        )
      ),

    // 4. Draggable Bottom Sheet
    h(
      'div',
      {
        className: 'sheet',
        style: {
          height: `${snapRatio * 100}%`,
          transition: isDragging ? 'none' : 'height 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        },
      },
      // Grab Handle
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
            setSnapRatio(
              Math.max(0.12, Math.min(0.85, drag.startRatio + deltaY / containerHeight))
            );
          },
          onPointerUp: () => {
            const drag = dragContextRef.current;
            dragContextRef.current = null;
            setIsDragging(false);
            if (!drag) return;

            if (!drag.moved) {
              const curIdx = SNAP_POINTS.findIndex(
                (p) => Math.abs(p - drag.startRatio) < 0.05
              );
              setSnapRatio(SNAP_POINTS[(curIdx + 1) % SNAP_POINTS.length]);
              return;
            }

            const closest = SNAP_POINTS.reduce((prev, p) =>
              Math.abs(p - snapRatio) < Math.abs(prev - snapRatio) ? p : prev
            );
            setSnapRatio(closest);
          },
        },
        h('i')
      ),

      // Sheet Body
      h(
        'div',
        { className: 'sbody' },
        // Route Header
        h(
          'div',
          { className: 'row', style: { justifyContent: 'space-between', alignItems: 'flex-start' } },
          h(
            'div',
            null,
            h('b', { style: { fontSize: 18, color: 'var(--tx-primary)' } }, activeRoute.name),
            h(
              'div',
              { className: 'mu', style: { marginTop: 2 } },
              `${routeVehicles.length} operating units · ${
                bestVehicleArrival
                  ? `Next arrival in ${formatMinutes(bestVehicleArrival.e.adj)}`
                  : 'ETA unavailable'
              }`
            )
          ),
          h(Badge, { c: 'pr' }, 'LIVE TRACKING')
        ),

        // Navigation Tabs: Trip | Jeepneys | Fares
        h(
          'div',
          { className: 'seg' },
          renderTabChip('trip', 'Trip Planner', Icons.MapPin),
          renderTabChip('vehicles', 'Jeepneys', Icons.Bus),
          renderTabChip('fares', 'Fare Guide', Icons.Clock)
        ),

        // Tab Content: Trip
        activeTab === 'trip' &&
          h(
            React.Fragment,
            null,
            h(TripPlan, {
              r: activeRoute,
              pi: originStopIndex,
              setPi: setOriginStopIndex,
              to: destStopIndex,
              setTo: setDestStopIndex,
            }),
            h(
              'div',
              {
                className: 'c mu',
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                },
              },
              h('span', null, 'Tap anywhere on the map to relocate your pin.'),
              h(
                'button',
                {
                  onClick: () =>
                    updateStoreState((prev) => ({ ...prev, cloc: null })),
                  style: {
                    padding: '3px 8px',
                    fontSize: 11,
                    borderRadius: 'var(--radius-full)',
                  },
                },
                'Reset Pin'
              )
            )
          ),

        // Tab Content: Live Jeepneys List & Alert Setup
        activeTab === 'vehicles' &&
          h(
            React.Fragment,
            null,
            h(
              'div',
              { className: 'c' },
              h(
                'div',
                { className: 'row', style: { justifyContent: 'space-between' } },
                h(
                  'select',
                  {
                    value: Math.min(originStopIndex, activeRoute.pick.length - 1),
                    onChange: (e) => setOriginStopIndex(+e.target.value),
                    'aria-label': 'Pickup point',
                    style: { flex: 1 },
                  },
                  activeRoute.pick.map((stop, idx) =>
                    h('option', { key: idx, value: idx }, `At stop: ${stop.n}`)
                  )
                ),
                h(
                  'button',
                  {
                    className: 'p',
                    onClick: () => {
                      const targetUnit =
                        (selectedVehicleId &&
                          routeVehicles.find((x) => x.id === selectedVehicleId)) ||
                        routeVehicles[0];
                      if (!targetUnit) return;

                      updateStoreState((prev) => ({
                        ...prev,
                        watch: [
                          ...prev.watch.filter(
                            (w) =>
                              !(w.vid === targetUnit.id && w.p === selectedStop.p)
                          ),
                          {
                            vid: targetUnit.id,
                            p: selectedStop.p,
                            pn: selectedStop.n,
                            fired: false,
                          },
                        ],
                      }));
                    },
                  },
                  h(Icons.Bell, { size: 13 }),
                  'Set Alert'
                )
              ),
              state.watch.map((watchItem, idx) => {
                const targetVehicle = state.vehicles.find((v) => v.id === watchItem.vid);
                return h(
                  'div',
                  {
                    key: idx,
                    className: 'row mu',
                    style: {
                      marginTop: 8,
                      padding: '6px 10px',
                      background: 'var(--surface-subtle)',
                      borderRadius: 'var(--radius-sm)',
                    },
                  },
                  h(
                    'span',
                    { style: { flex: 1, color: 'var(--tx-primary)', fontWeight: 600 } },
                    `🔔 Alert: ${targetVehicle?.unit || 'Unit'} → ${watchItem.pn}${
                      watchItem.fired ? ' (Triggered)' : ' (Waiting proximity)'
                    }`
                  ),
                  h(
                    'button',
                    {
                      className: 'x',
                      style: { padding: '2px 8px', fontSize: 11 },
                      onClick: () =>
                        updateStoreState((prev) => ({
                          ...prev,
                          watch: prev.watch.filter((_, j) => j !== idx),
                        })),
                    },
                    'Remove'
                  )
                );
              })
            ),
            routeVehicles.length
              ? routeVehicles.map((vehicle) =>
                  h(VCard, {
                    key: vehicle.id,
                    v: vehicle,
                    pk: selectedStop,
                    sel: selectedVehicleId === vehicle.id,
                    onSel: setSelectedVehicleId,
                  })
                )
              : h(
                  'div',
                  { className: 'c mu' },
                  'No vehicles are currently assigned to this route.'
                )
          ),

        // Tab Content: Fares
        activeTab === 'fares' && h(FareCard, { r: activeRoute }),

        // Tab Content: Map Layers
        activeTab === 'map' &&
          h(
            'div',
            { className: 'c' },
            [
              ['dm', 'Demand heatmap'],
              ['tf', 'Traffic heatmap'],
              ['cm', 'Commuters on the road'],
            ].map(([key, label]) =>
              h(
                'label',
                { key, className: 'row', style: { padding: '6px 0', cursor: 'pointer' } },
                h('input', {
                  type: 'checkbox',
                  checked: layerVisibility[key],
                  onChange: (e) =>
                    setLayerVisibility({
                      ...layerVisibility,
                      [key]: e.target.checked,
                    }),
                }),
                label
              )
            ),
            h(Legend)
          )
      )
    )
  );
}

window.WaitLessViews = {
  ...(window.WaitLessViews || {}),
  SplashWelcome,
  SplashNew,
  Commuter,
  CommuterApp,
};
