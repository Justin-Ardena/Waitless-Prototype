/**
 * WaitLess Prototype - Cooperative Dashboard View
 *
 * Implements:
 * - Fleet operations overview & KPI counters
 * - Live vehicle tracking and interactive route map
 * - Vehicle fleet management table (status, route assignment, seats, breakdown trigger)
 * - Route management (create, rename, activate/deactivate)
 * - Passenger demand hotspots & automated dispatch advisories
 * - Fare settings configuration
 * - Operational alerts management (acknowledge/resolve workflow)
 * - PAO field incident reports feed
 * - Multi-monitor split screen support (dual-screen mode & popout window)
 */

/**
 * Split Screen & Multi-Monitor Controls
 */
function CoSplit() {
  const state = useStoreState();
  const [statusMessage, setStatusMessage] = useState('');
  const currentMode = state.cosplit || 'combined';
  const secondScreenUrl = window.location.href.split('#')[0] + '#map';

  const openSecondWindow = () => {
    updateStoreState((prev) => ({ ...prev, cosplit: 'info' }));
    let popoutWindow = null;
    try {
      popoutWindow = window.open(
        secondScreenUrl,
        'waitless-map',
        'width=1280,height=800'
      );
    } catch (e) {}

    setStatusMessage(
      popoutWindow
        ? 'Map opened in a new window. Drag it onto your second screen.'
        : `The pop-up was blocked. Open this link on your second screen: ${secondScreenUrl}`
    );
  };

  return h(
    'div',
    { className: 'c' },
    h(
      'div',
      { className: 'row' },
      h('b', { style: { flex: 1, minWidth: 110 } }, 'Screen layout'),
      h(
        'div',
        { className: 'seg', style: { width: 'auto' } },
        [
          ['combined', 'Combined'],
          ['info', 'Info only'],
          ['map', 'Map only'],
        ].map(([modeKey, label]) =>
          h(
            'button',
            {
              key: modeKey,
              className: currentMode === modeKey ? 'p' : '',
              onClick: () =>
                updateStoreState((prev) => ({ ...prev, cosplit: modeKey })),
            },
            label
          )
        )
      ),
      h(
        'button',
        {
          className: state.second ? 'p' : '',
          onClick: () =>
            updateStoreState((prev) => ({ ...prev, second: !prev.second })),
        },
        state.second ? 'Second screen: On' : 'Add second screen'
      )
    ),
    statusMessage &&
      h(
        'div',
        { className: 'mu', style: { marginTop: 6, overflowWrap: 'anywhere' } },
        statusMessage
      ),
    h(
      'div',
      { className: 'mu', style: { marginTop: 4 } },
      'Split screen: the information stays on this computer screen and the map appears on a second computer screen beside or below it. Both screens share this browser’s demo data and stay in sync.'
    )
  );
}

/**
 * Embedded Second Screen Device Frame
 */
function SecondScreen() {
  const state = useStoreState();
  const hasDeviceFrames = state.phone !== false;

  return h(
    'div',
    { className: hasDeviceFrames ? 'devm dev2' : 'dev2' },
    h(
      'section',
      {
        className: `panel ${hasDeviceFrames ? 'mon' : ''}`,
        'aria-label': 'Second screen',
      },
      h(
        'h2',
        null,
        h('span', { className: 'ico' }, '🖥️'),
        h('span', null, 'Second Screen', h('small', null, 'Fleet map display')),
        h(
          'button',
          {
            style: { marginLeft: 'auto' },
            onClick: () =>
              updateStoreState((prev) => ({ ...prev, second: false })),
          },
          'Close'
        )
      ),
      h(CoopMapScreen, { embed: true })
    )
  );
}

/**
 * Dedicated Fleet Map Display (Used for standalone #map popout or embedded second screen)
 */
function CoopMapScreen({ embed }) {
  const state = useStoreState();
  const [routeFilter, setRouteFilter] = useState('all');
  const [layerVisibility, setLayerVisibility] = useState({
    dm: true,
    tf: true,
    cm: true,
  });
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [viewBox, setViewBox] = useState([0, 0, 100, 70]);

  const mapElementRef = useRef(null);

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

  const filteredRoutes = state.routes.filter(
    (r) => r.active && (routeFilter === 'all' || r.id === routeFilter)
  );
  const filteredVehicles = state.vehicles.filter(
    (v) => routeFilter === 'all' || v.routeId === routeFilter
  );
  const selectedVehicle =
    selectedVehicleId && state.vehicles.find((v) => v.id === selectedVehicleId);

  return h(
    'div',
    {
      style: {
        height: embed ? 'calc(100% - 54px)' : '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
      },
    },
    // Top Bar
    h(
      'div',
      {
        className: 'row',
        style: {
          padding: '10px 14px',
          borderBottom: '1px solid var(--bd)',
          background: 'linear-gradient(180deg, #ffffff, #f8fbff)',
        },
      },
      h('span', { className: 'logo' }, 'W'),
      h('b', null, 'WaitLess · Fleet map (second screen)'),
      h(
        Badge,
        { c: state.link ? 'ok' : 'er' },
        state.link ? 'Simulated link connected' : 'Simulated link down'
      ),
      h('span', { className: 'sp' }),
      h(
        'select',
        {
          value: routeFilter,
          onChange: (e) => setRouteFilter(e.target.value),
          'aria-label': 'Route',
        },
        h('option', { value: 'all' }, 'All routes'),
        state.routes.map((r) => h('option', { key: r.id, value: r.id }, r.name))
      ),
      [
        ['dm', 'Demand heatmap'],
        ['tf', 'Traffic heatmap'],
        ['cm', 'Commuters'],
      ].map(([key, label]) =>
        h(
          'label',
          { key, className: 'row' },
          h('input', {
            type: 'checkbox',
            checked: layerVisibility[key],
            onChange: (e) =>
              setLayerVisibility({ ...layerVisibility, [key]: e.target.checked }),
          }),
          label
        )
      )
    ),

    // Map Area
    h(
      'div',
      {
        ref: mapElementRef,
        className: 'amap',
        style: { flex: 1, minHeight: 0 },
      },
      h(MapView, {
        routes: filteredRoutes,
        vs: filteredVehicles,
        sel: selectedVehicleId,
        onSel: setSelectedVehicleId,
        hot: layerVisibility.dm ? state.demand : [],
        traf: layerVisibility.tf,
        comm: layerVisibility.cm,
        vb: viewBox,
      })
    ),

    // Footer Info
    h(
      'div',
      { style: { padding: '8px 14px', borderTop: '1px solid var(--bd)' } },
      selectedVehicle &&
        h(VCard, { v: selectedVehicle, onSel: () => setSelectedVehicleId(null) }),
      h(Legend),
      h(
        'div',
        { className: 'mu' },
        `${filteredVehicles.length} units shown. Changes made on the main screen appear here automatically. Simulated data.`
      )
    )
  );
}

/**
 * Cooperative Operations Management Dashboard
 */
function Coop() {
  const state = useStoreState();

  const [routeFilter, setRouteFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showCommuters, setShowCommuters] = useState(true);
  const [showDemand, setShowDemand] = useState(true);

  // New route creation state
  const [newRoute, setNewRoute] = useState({ name: '', from: '', to: '' });
  const [routeErrorMessage, setRouteErrorMessage] = useState('');

  // Diagnostic calculations for fleet overview KPIs
  const vehicleDiagnostics = state.vehicles.map((v) => ({
    vehicle: v,
    info: getVehicleStatusInfo(v),
  }));

  const countVehicles = (predicate) =>
    vehicleDiagnostics.filter(predicate).length;

  const filteredVehicles = state.vehicles.filter((v) => {
    const matchesRoute = routeFilter === 'all' || v.routeId === routeFilter;
    const vInfo = getVehicleStatusInfo(v);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'stale' ? vInfo.stale : vInfo.label === statusFilter);
    return matchesRoute && matchesStatus;
  });

  const updateVehicleData = (vehicleId, patch) => {
    updateStoreState((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((v) =>
        v.id === vehicleId ? { ...v, ...patch } : v
      ),
    }));
  };

  const triggerAlert = (alertData) => {
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
  };

  const inspectedVehicle = state.vehicles.find((v) => v.id === selectedVehicleId);
  const highDemandHotspots = state.demand.filter((d) => d.level === 'High');

  // Compute container class for split screen mode
  const splitClass =
    state.cosplit === 'info' || state.second
      ? ' nomap'
      : state.cosplit === 'map'
      ? ' maponly'
      : '';

  return h(
    'div',
    { className: `in coop${splitClass}` },

    // 1. Fleet KPI Summary Cards
    h(
      'div',
      { className: 'kp' },
      [
        ['Total units', state.vehicles.length],
        [
          'On Route',
          countVehicles(
            (o) => !o.info.stale && o.vehicle.status === 'On Route'
          ),
        ],
        [
          'At Terminal',
          countVehicles(
            (o) => !o.info.stale && o.vehicle.status === 'At Terminal'
          ),
        ],
        [
          'Out of Service',
          countVehicles((o) => o.vehicle.status === 'Out of Service'),
        ],
        [
          'Limited Seats',
          countVehicles((o) => o.info.seat === 'Limited Seats'),
        ],
        ['Stale/missing', countVehicles((o) => o.info.stale)],
      ].map(([label, count]) =>
        h('div', { key: label }, h('b', null, count), label)
      )
    ),

    // 2. Map & Filter Controls
    h(
      'div',
      { className: 'c' },
      h(
        'div',
        { className: 'row' },
        h(
          'select',
          {
            value: routeFilter,
            onChange: (e) => setRouteFilter(e.target.value),
            'aria-label': 'Route filter',
          },
          h('option', { value: 'all' }, 'All routes'),
          state.routes.map((r) => h('option', { key: r.id, value: r.id }, r.name))
        ),
        h(
          'select',
          {
            value: statusFilter,
            onChange: (e) => setStatusFilter(e.target.value),
            'aria-label': 'Status filter',
          },
          ['all', 'On Route', 'At Terminal', 'Out of Service', 'stale'].map((status) =>
            h(
              'option',
              { key: status, value: status },
              status === 'all'
                ? 'All status'
                : status === 'stale'
                ? 'Stale data'
                : status
            )
          )
        )
      ),
      h(
        'div',
        { className: 'row', style: { margin: '6px 0' } },
        h(
          'label',
          null,
          h('input', {
            type: 'checkbox',
            checked: showTraffic,
            onChange: (e) => setShowTraffic(e.target.checked),
          }),
          ' Traffic heatmap'
        ),
        h(
          'label',
          null,
          h('input', {
            type: 'checkbox',
            checked: showCommuters,
            onChange: (e) => setShowCommuters(e.target.checked),
          }),
          ' Commuters on the road'
        ),
        h(
          'label',
          null,
          h('input', {
            type: 'checkbox',
            checked: showDemand,
            onChange: (e) => setShowDemand(e.target.checked),
          }),
          ' Demand heatmap'
        )
      ),
      h(MapView, {
        routes:
          routeFilter === 'all'
            ? state.routes
            : state.routes.filter((r) => r.id === routeFilter),
        vs: filteredVehicles,
        sel: selectedVehicleId,
        onSel: setSelectedVehicleId,
        hot: showDemand ? state.demand : [],
        traf: showTraffic,
        comm: showCommuters,
      }),
      h(CommNote),
      h(Legend),
      inspectedVehicle &&
        h(
          'div',
          { style: { marginTop: 6 } },
          h(VCard, { v: inspectedVehicle, onSel: () => {} })
        )
    ),

    // 3. Vehicles Fleet Management Table
    h(
      'div',
      { className: 'c', style: { overflowX: 'auto' } },
      h(
        'div',
        { className: 'row' },
        h('h3', { style: { flex: 1 } }, 'Vehicles'),
        h(
          'button',
          {
            onClick: () =>
              updateStoreState((prev) => ({
                ...prev,
                vehicles: [
                  ...prev.vehicles,
                  {
                    id: 'v' + getCurrentTimestamp(),
                    unit: 'JP-' + (100 + prev.vehicles.length + 1),
                    desc: 'Sample vehicle',
                    routeId: prev.routes[0].id,
                    status: 'At Terminal',
                    p: 0,
                    dir: 1,
                    lastAt: getCurrentTimestamp(),
                    avail: 33,
                    total: 33,
                    seatSrc: 'Manually reported',
                    mute: false,
                  },
                ],
              })),
          },
          'Add sample vehicle'
        )
      ),
      h(
        'table',
        null,
        h(
          'thead',
          null,
          h(
            'tr',
            null,
            ['Unit', 'Route', 'Status', 'Seats', 'Updated', ''].map((headerText) =>
              h('th', { key: headerText }, headerText)
            )
          )
        ),
        h(
          'tbody',
          null,
          filteredVehicles.map((vehicle) => {
            const vInfo = getVehicleStatusInfo(vehicle);

            return h(
              'tr',
              { key: vehicle.id },
              // Unit Link & Status Badge
              h(
                'td',
                null,
                h(
                  'a',
                  {
                    href: '#',
                    onClick: (e) => {
                      e.preventDefault();
                      setSelectedVehicleId(vehicle.id);
                    },
                  },
                  vehicle.unit
                ),
                h('div', null, h(Badge, { c: vInfo.col }, vInfo.label))
              ),
              // Route Dropdown
              h(
                'td',
                null,
                h(
                  'select',
                  {
                    value: vehicle.routeId,
                    onChange: (e) =>
                      updateVehicleData(vehicle.id, { routeId: e.target.value }),
                    'aria-label': `Route for ${vehicle.unit}`,
                  },
                  state.routes.map((r) =>
                    h('option', { key: r.id, value: r.id }, r.name)
                  )
                )
              ),
              // Status Dropdown
              h(
                'td',
                null,
                h(
                  'select',
                  {
                    value: vehicle.status,
                    onChange: (e) => {
                      updateVehicleData(vehicle.id, { status: e.target.value });
                      if (e.target.value === 'Out of Service') {
                        triggerAlert({
                          type: 'Out of Service',
                          vehicleId: vehicle.id,
                          msg: `${vehicle.unit} marked Out of Service.`,
                        });
                      }
                    },
                    'aria-label': `Status for ${vehicle.unit}`,
                  },
                  ['On Route', 'At Terminal', 'Out of Service'].map((status) =>
                    h('option', { key: status }, status)
                  )
                )
              ),
              // Available Seats Input
              h(
                'td',
                null,
                h('input', {
                  type: 'number',
                  min: 0,
                  max: vehicle.total,
                  style: { width: 56 },
                  placeholder: '?',
                  value: vehicle.avail ?? '',
                  onChange: (e) =>
                    updateVehicleData(vehicle.id, {
                      avail:
                        e.target.value === ''
                          ? null
                          : Math.max(
                              0,
                              Math.min(vehicle.total, +e.target.value)
                            ),
                      seatSrc:
                        e.target.value === ''
                          ? 'Unknown'
                          : 'Manually reported',
                    }),
                  'aria-label': `Seats for ${vehicle.unit}`,
                }),
                `/${vehicle.total}`
              ),
              // Last Telemetry Timestamp
              h('td', null, formatTimeAgo(vehicle.lastAt)),
              // Action Buttons
              h(
                'td',
                null,
                h(
                  'button',
                  {
                    onClick: () => {
                      updateVehicleData(vehicle.id, { status: 'Out of Service' });
                      triggerAlert({
                        type: 'Breakdown',
                        vehicleId: vehicle.id,
                        msg: `${vehicle.unit} reported a breakdown.`,
                      });
                    },
                  },
                  'Breakdown'
                ),
                ' ',
                h(
                  'button',
                  {
                    className: 'x',
                    onClick: () => {
                      if (confirm(`Delete ${vehicle.unit}?`)) {
                        updateStoreState((prev) => ({
                          ...prev,
                          vehicles: prev.vehicles.filter((y) => y.id !== vehicle.id),
                        }));
                      }
                    },
                  },
                  'Delete'
                )
              )
            );
          })
        )
      )
    ),

    // 4. Routes Management Section
    h(
      'div',
      { className: 'c' },
      h('h3', null, 'Routes'),
      state.routes.map((route) => {
        const assignedUnitCount = state.vehicles.filter(
          (v) => v.routeId === route.id
        ).length;

        return h(
          'div',
          { key: route.id, className: 'row' },
          h(
            'span',
            { style: { flex: 1 } },
            `${route.name}: ${route.from} → ${route.to} (${assignedUnitCount} units)`
          ),
          h(
            'button',
            {
              onClick: () => {
                const newName = prompt('Route name', route.name);
                if (newName && newName.trim()) {
                  updateStoreState((prev) => ({
                    ...prev,
                    routes: prev.routes.map((r) =>
                      r.id === route.id ? { ...r, name: newName.trim() } : r
                    ),
                  }));
                }
              },
            },
            'Rename'
          ),
          h(
            'button',
            {
              onClick: () =>
                updateStoreState((prev) => ({
                  ...prev,
                  routes: prev.routes.map((r) =>
                    r.id === route.id ? { ...r, active: !r.active } : r
                  ),
                })),
            },
            route.active ? 'Deactivate' : 'Activate'
          )
        );
      }),
      // Add Route Input Form
      h(
        'div',
        { className: 'row', style: { marginTop: 6 } },
        ['name', 'from', 'to'].map((fieldKey) =>
          h('input', {
            key: fieldKey,
            placeholder:
              fieldKey === 'name'
                ? 'New route name'
                : fieldKey === 'from'
                ? 'Origin terminal'
                : 'Destination',
            value: newRoute[fieldKey],
            onChange: (e) =>
              setNewRoute({ ...newRoute, [fieldKey]: e.target.value }),
            style: { width: 130 },
          })
        ),
        h(
          'button',
          {
            className: 'p',
            onClick: () => {
              if (
                !newRoute.name.trim() ||
                !newRoute.from.trim() ||
                !newRoute.to.trim()
              ) {
                return setRouteErrorMessage('Enter a name, origin and destination.');
              }
              setRouteErrorMessage('');
              const randomY = 10 + Math.random() * 45;

              updateStoreState((prev) => ({
                ...prev,
                routes: [
                  ...prev.routes,
                  {
                    id: 'r' + getCurrentTimestamp(),
                    name: newRoute.name.trim(),
                    from: newRoute.from.trim(),
                    to: newRoute.to.trim(),
                    pts: [
                      [10, randomY],
                      [50, randomY + 8],
                      [90, randomY],
                    ],
                    pick: formatPickupPoints([
                      [newRoute.from.trim(), 0],
                      [newRoute.to.trim(), 1],
                    ]),
                    active: true,
                  },
                ],
              }));
              setNewRoute({ name: '', from: '', to: '' });
            },
          },
          'Add route'
        )
      ),
      routeErrorMessage &&
        h('div', { style: { color: 'var(--er)' } }, routeErrorMessage)
    ),

    // 5. Demand Hotspots & Dispatch Suggestions
    h(
      'div',
      { className: 'c' },
      h('h3', null, 'Demand hotspots (simulated)'),
      state.demand.map((hotspot) => {
        const route = getRouteById(state, hotspot.routeId);
        return h(
          'div',
          { key: hotspot.id, className: 'row' },
          h(Badge, { c: getLevelColorClass(hotspot.level) }, hotspot.level),
          `${hotspot.loc} · ${hotspot.count} waiting · ${
            route?.name || '—'
          } · ${formatTimeAgo(hotspot.at)} · ${hotspot.src}`
        );
      }),
      highDemandHotspots.length
        ? h(
            'div',
            { className: 'mu', style: { marginTop: 6 } },
            highDemandHotspots
              .map((hotspot) => {
                const activeUnits = state.vehicles.filter(
                  (v) =>
                    v.routeId === hotspot.routeId &&
                    v.status === 'On Route' &&
                    !getVehicleStatusInfo(v).stale
                ).length;
                const terminalUnits = state.vehicles.filter(
                  (v) =>
                    v.routeId === hotspot.routeId && v.status === 'At Terminal'
                ).length;

                return `Consider reviewing vehicle availability near ${hotspot.loc}: ${activeUnits} operating, ${terminalUnits} at terminal.`;
              })
              .join(' ')
          )
        : h('div', { className: 'mu' }, 'No high-demand areas reported.')
    ),

    // 6. Fare Matrix Configuration
    h(FareSettings),

    // 7. Route ETA Predictions
    h(EtaCard),

    // 8. Operational Alerts & Acknowledgment Workflow
    h(
      'div',
      { className: 'c' },
      h('h3', null, 'Operational alerts'),
      state.alerts.length
        ? state.alerts.map((alertItem) =>
            h(
              'div',
              { key: alertItem.id, className: 'row' },
              h(
                Badge,
                {
                  c:
                    alertItem.status === 'Open'
                      ? getLevelColorClass(alertItem.sev)
                      : 'ok',
                },
                alertItem.status
              ),
              h(
                'span',
                { style: { flex: 1 } },
                `${alertItem.msg} · ${formatTimeAgo(alertItem.at)}`
              ),
              alertItem.status === 'Open' &&
                h(
                  'button',
                  {
                    onClick: () =>
                      updateStoreState((prev) => ({
                        ...prev,
                        alerts: prev.alerts.map((a) =>
                          a.id === alertItem.id
                            ? { ...a, status: 'Acknowledged' }
                            : a
                        ),
                      })),
                  },
                  'Acknowledge'
                ),
              alertItem.status !== 'Resolved' &&
                h(
                  'button',
                  {
                    onClick: () =>
                      updateStoreState((prev) => ({
                        ...prev,
                        alerts: prev.alerts.map((a) =>
                          a.id === alertItem.id
                            ? { ...a, status: 'Resolved' }
                            : a
                        ),
                      })),
                  },
                  'Resolve'
                )
            )
          )
        : h('div', { className: 'mu' }, 'No alerts. The fleet is quiet.')
    ),

    // 9. PAO Field Reports Feed
    h(
      'div',
      { className: 'c' },
      h('h3', null, 'PAO field reports'),
      state.obs.slice(0, 4).map((observation) =>
        h(
          'div',
          { key: observation.id, className: 'mu' },
          `${observation.type} at ${observation.loc} (${observation.sev}) · ${formatTimeAgo(
            observation.at
          )}`
        )
      )
    ),

    // 10. Split Screen Controls
    h(CoSplit)
  );
}

window.WaitLessViews = {
  ...(window.WaitLessViews || {}),
  CoSplit,
  SecondScreen,
  CoopMapScreen,
  Coop,
};
