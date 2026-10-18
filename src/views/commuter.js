/**
 * WaitLess Prototype - Commuter Application View
 *
 * Implements:
 * - Commuter onboarding & demo login
 * - Animated welcome splash screen with Modernized Jeepney graphic
 * - Route search, interactive schematic route map, and layer controls
 * - Draggable bottom sheet with Trip Planner, Live Jeepneys list, Fare guide, and approaching-vehicle alerts
 */

/**
 * Animated Welcome Splash Screen
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
      h('div', { className: 'sp2hi' }, 'Welcome,'),
      h('div', { className: 'sp2nm' }, name),
      h(
        'div',
        { className: 'sp2msg' },
        h('span', null, 'Finding your routes…'),
        h('span', null, 'Checking nearby jeepneys…'),
        h('span', null, 'Loading traffic heatmap…')
      ),
      h('div', { className: 'lbar', style: { width: 220 } }, h('i'))
    ),
    h(
      'div',
      { className: 'road' },
      h(
        'div',
        { className: 'bus' },
        h(
          'svg',
          { viewBox: '0 0 64 32', width: 64, 'aria-hidden': 'true' },
          h('rect', { x: 2, y: 6, width: 58, height: 18, rx: 6, fill: '#2563eb' }),
          h('rect', { x: 8, y: 10, width: 12, height: 7, rx: 2, fill: '#dbeafe' }),
          h('rect', { x: 24, y: 10, width: 12, height: 7, rx: 2, fill: '#dbeafe' }),
          h('rect', { x: 40, y: 10, width: 14, height: 7, rx: 2, fill: '#dbeafe' }),
          h('rect', { x: 2, y: 18, width: 58, height: 3, fill: '#1d4ed8' }),
          h('circle', { cx: 16, cy: 25, r: 5, fill: '#0f1b33' }),
          h('circle', { cx: 48, cy: 25, r: 5, fill: '#0f1b33' })
        )
      )
    ),
    h('button', { className: 'sp2skip', onClick: onSkip }, 'Skip')
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
          { className: 'c row' },
          h('span', { style: { flex: 1 } }, 'Hi, ', h('b', null, state.cuser)),
          h('button', { onClick: () => handleLogin(null) }, 'Log out')
        )
      ),
      h(CommuterApp)
    );
  }

  // 3. Login / Onboarding screen
  return h(
    'div',
    { className: 'in', style: { textAlign: 'center', paddingTop: 30 } },
    h(
      'div',
      {
        className: 'logo',
        style: {
          width: 68,
          height: 68,
          fontSize: 32,
          borderRadius: 20,
          margin: '0 auto',
        },
      },
      'W'
    ),
    h(
      'h1',
      { style: { margin: '4px 0 0', fontSize: 26, color: '#1e3a8a' } },
      'WaitLess'
    ),
    h(
      'div',
      { className: 'mu', style: { fontSize: 14 } },
      'Your Ride, Closer Than You Think.'
    ),
    h(
      'div',
      { className: 'c', style: { textAlign: 'left', marginTop: 10 } },
      h('h3', null, 'Log in to continue'),
      h('input', {
        placeholder: 'Your name',
        value: nameInput,
        'aria-label': 'Your name',
        style: { width: '100%' },
        onChange: (e) => setNameInput(e.target.value),
        onKeyDown: (e) => {
          if (e.key === 'Enter') document.getElementById('wl-login')?.click();
        },
      }),
      errorMessage &&
        h('div', { style: { color: 'var(--er)', marginTop: 4 } }, errorMessage),
      h(
        'button',
        {
          id: 'wl-login',
          className: 'p',
          style: { width: '100%', marginTop: 8, padding: '9px' },
          onClick: () => {
            if (nameInput.trim().length < 2) {
              return setErrorMessage('Enter your name (at least 2 characters).');
            }
            setErrorMessage('');
            handleLogin(nameInput.trim());
          },
        },
        'Log in'
      ),
      h(
        'button',
        {
          style: { width: '100%', marginTop: 6, padding: '9px' },
          onClick: () => handleLogin('Guest'),
        },
        'Continue as guest'
      )
    ),
    h(
      'div',
      { className: 'row', style: { justifyContent: 'center' } },
      h(Badge, { c: 'pr' }, 'Find routes'),
      h(Badge, { c: 'pr' }, 'Simulated ETA'),
      h(Badge, { c: 'pr' }, 'Seat info'),
      h(Badge, { c: 'pr' }, 'Traffic heatmap')
    ),
    h(
      'div',
      { className: 'mu' },
      'Demo login: no password or account needed. All data is simulated and stored only in this browser.'
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

  const renderTabChip = (key, label) =>
    h(
      'button',
      {
        key,
        className: activeTab === key ? 'p' : '',
        onClick: () => setActiveTab(key),
      },
      label
    );

  const SNAP_POINTS = [0.14, 0.42, 0.8];

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

    // 2. Top Route Search Bar & Route Carousel
    h(
      'div',
      { className: 'atop' },
      h('input', {
        placeholder: 'Search routes',
        value: searchQuery,
        onChange: (e) => setSearchQuery(e.target.value),
        'aria-label': 'Search routes',
      }),
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
            { key: toast.id, className: 'toast row' },
            h('span', { style: { flex: 1 } }, `🔔 ${toast.msg}`),
            h(
              'button',
              {
                onClick: () =>
                  updateStoreState((prev) => ({
                    ...prev,
                    toasts: prev.toasts.filter((t) => t.id !== toast.id),
                  })),
              },
              'OK'
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
          transition: isDragging ? 'none' : 'height .25s ease',
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
        h(
          'div',
          { className: 'row', style: { justifyContent: 'space-between' } },
          h(
            'div',
            null,
            h('b', { style: { fontSize: 17 } }, activeRoute.name),
            h(
              'div',
              { className: 'mu' },
              `${routeVehicles.length} units · ${
                bestVehicleArrival
                  ? `Next unit in ${formatMinutes(bestVehicleArrival.e.adj)}`
                  : 'ETA unavailable'
              }`
            )
          ),
          h(Badge, { c: 'pr' }, 'Simulated')
        ),

        // Navigation Tabs: Trip | Jeepneys | Fares
        h(
          'div',
          { className: 'seg' },
          renderTabChip('trip', 'Trip'),
          renderTabChip('vehicles', 'Jeepneys'),
          renderTabChip('fares', 'Fares')
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
              { className: 'c mu' },
              'Tap the map to move your pin. ',
              h(
                'button',
                {
                  onClick: () =>
                    updateStoreState((prev) => ({ ...prev, cloc: null })),
                },
                'Reset pin'
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
                { className: 'row' },
                h(
                  'select',
                  {
                    value: Math.min(originStopIndex, activeRoute.pick.length - 1),
                    onChange: (e) => setOriginStopIndex(+e.target.value),
                    'aria-label': 'Pickup point',
                  },
                  activeRoute.pick.map((stop, idx) =>
                    h('option', { key: idx, value: idx }, stop.n)
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
                  'Alert me when near'
                )
              ),
              state.watch.map((watchItem, idx) => {
                const targetVehicle = state.vehicles.find((v) => v.id === watchItem.vid);
                return h(
                  'div',
                  { key: idx, className: 'row mu' },
                  `Alert: ${targetVehicle?.unit || 'Unit'} → ${watchItem.pn}${
                    watchItem.fired ? ' (sent)' : ' (waiting)'
                  }`,
                  h(
                    'button',
                    {
                      className: 'x',
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
                  'No vehicles are assigned to this route yet.'
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
                { key, className: 'row' },
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
