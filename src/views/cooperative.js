/**
 * WaitLess Prototype - Modern Cooperative Dashboard View
 *
 * Implements:
 * - Fleet operations command center with executive KPI tiles
 * - Real-time vehicle telemetry fleet table with visual seat occupancy meters
 * - Interactive fleet map with layer toggles
 * - Route management (create, rename, activate/deactivate)
 * - Passenger demand hotspots & automated dispatch advisories
 * - Fare settings configuration
 * - Operational alerts management (acknowledge/resolve workflow)
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
      { className: 'row', style: { justifyContent: 'space-between' } },
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 8 } },
        h(Icons.Monitor, { size: 16, color: 'var(--brand-600)' }),
        h('b', { style: { minWidth: 100, fontSize: 13 } }, 'Screen Layout')
      ),
      h(
        'div',
        { className: 'seg', style: { width: 'auto' } },
        [
          ['combined', 'Combined'],
          ['info', 'Info Only'],
          ['map', 'Map Only'],
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
          style: { borderRadius: 'var(--radius-full)' },
        },
        state.second ? 'Second Screen: On' : '+ Pop Out Second Screen'
      )
    ),
    statusMessage &&
      h(
        'div',
        { className: 'mu', style: { marginTop: 8, overflowWrap: 'anywhere' } },
        statusMessage
      ),
    h(
      'div',
      { className: 'mu', style: { marginTop: 6 } },
      'Dual monitor display: The fleet data table stays on your main screen while the full map displays on a second monitor. Both screens stay in real-time sync.'
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
        h('span', { className: 'ico' }, h(Icons.Monitor, { size: 16 })),
        h('span', null, 'Second Monitor', h('small', null, 'Dedicated fleet map display')),
        h(
          'button',
          {
            style: { marginLeft: 'auto', borderRadius: 'var(--radius-full)', padding: '4px 10px' },
            onClick: () =>
              updateStoreState((prev) => ({ ...prev, second: false })),
          },
          'Close Screen'
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
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'linear-gradient(180deg, #ffffff, #f8fbff)',
        },
      },
      h('span', { className: 'logo', style: { width: 32, height: 32, fontSize: 16 } }, 'W'),
      h('b', { style: { fontSize: 15, color: 'var(--brand-900)' } }, 'WaitLess · Fleet Telemetry Display'),
      h(
        Badge,
        { c: state.link ? 'ok' : 'er' },
        state.link ? 'LoRaWAN Connected' : 'Link Offline'
      ),
      h('span', { className: 'sp' }),
      h(
        'select',
        {
          value: routeFilter,
          onChange: (e) => setRouteFilter(e.target.value),
          'aria-label': 'Route',
          style: { padding: '5px 10px' },
        },
        h('option', { value: 'all' }, 'All Routes'),
        state.routes.map((r) => h('option', { key: r.id, value: r.id }, r.name))
      ),
      [
        ['dm', 'Demand Heatmap'],
        ['tf', 'Traffic Heatmap'],
        ['cm', 'Commuters'],
      ].map(([key, label]) =>
        h(
          'label',
          { key, className: 'row', style: { fontSize: 12, cursor: 'pointer' } },
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
      { style: { padding: '10px 18px', borderTop: '1px solid var(--border-subtle)' } },
      selectedVehicle &&
        h(VCard, { v: selectedVehicle, onSel: () => setSelectedVehicleId(null) }),
      h(Legend),
      h(
        'div',
        { className: 'mu', style: { marginTop: 4 } },
        `${filteredVehicles.length} operating units active on this screen. Real-time synchronized.`
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

    // 1. Fleet Executive KPI Tiles
    h(
      'div',
      { className: 'kp' },
      [
        ['Total Fleet', state.vehicles.length, Icons.Bus],
        [
          'On Route',
          countVehicles(
            (o) => !o.info.stale && o.vehicle.status === 'On Route'
          ),
          Icons.Play,
        ],
        [
          'At Terminal',
          countVehicles(
            (o) => !o.info.stale && o.vehicle.status === 'At Terminal'
          ),
          Icons.Clock,
        ],
        [
          'Out of Service',
          countVehicles((o) => o.vehicle.status === 'Out of Service'),
          Icons.AlertTriangle,
        ],
        [
          'Limited Seats',
          countVehicles((o) => o.info.seat === 'Limited Seats'),
          Icons.Users,
        ],
        ['Stale Ping', countVehicles((o) => o.info.stale), Icons.Signal],
      ].map(([label, count, icon]) =>
        h(
          'div',
          { key: label },
          h(
            'div',
            { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            h('b', null, count),
            icon && h(icon, { size: 16, color: 'var(--brand-500)' })
          ),
          h('span', null, label)
        )
      )
    ),

    // 2. Interactive Fleet Map & Filters
    h(
      'div',
      { className: 'c' },
      h(
        'div',
        { className: 'row', style: { justifyContent: 'space-between', marginBottom: 10 } },
        h(
          'div',
          { className: 'row' },
          h(
            'select',
            {
              value: routeFilter,
              onChange: (e) => setRouteFilter(e.target.value),
              'aria-label': 'Route filter',
              style: { fontWeight: 600 },
            },
            h('option', { value: 'all' }, 'All Routes'),
            state.routes.map((r) => h('option', { key: r.id, value: r.id }, r.name))
          ),
          h(
            'select',
            {
              value: statusFilter,
              onChange: (e) => setStatusFilter(e.target.value),
              'aria-label': 'Status filter',
              style: { fontWeight: 600 },
            },
            ['all', 'On Route', 'At Terminal', 'Out of Service', 'stale'].map((status) =>
              h(
                'option',
                { key: status, value: status },
                status === 'all'
                  ? 'All Statuses'
                  : status === 'stale'
                  ? 'Stale Telemetry'
                  : status
              )
            )
          )
        ),
        h(
          'div',
          { className: 'row' },
          h(
            'label',
            { style: { fontSize: 11.5, cursor: 'pointer' } },
            h('input', {
              type: 'checkbox',
              checked: showTraffic,
              onChange: (e) => setShowTraffic(e.target.checked),
            }),
            ' Traffic'
          ),
          h(
            'label',
            { style: { fontSize: 11.5, cursor: 'pointer' } },
            h('input', {
              type: 'checkbox',
              checked: showCommuters,
              onChange: (e) => setShowCommuters(e.target.checked),
            }),
            ' Commuters'
          ),
          h(
            'label',
            { style: { fontSize: 11.5, cursor: 'pointer' } },
            h('input', {
              type: 'checkbox',
              checked: showDemand,
              onChange: (e) => setShowDemand(e.target.checked),
            }),
            ' Demand'
          )
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
          { style: { marginTop: 8 } },
          h(VCard, { v: inspectedVehicle, onSel: () => {} })
        )
    ),

    // 3. Vehicles Fleet Management Table with Visual Seat Bars
    h(
      'div',
      { className: 'c', style: { overflowX: 'auto' } },
      h(
        'div',
        { className: 'row', style: { justifyContent: 'space-between', marginBottom: 8 } },
        h(
          'h3',
          { style: { margin: 0 } },
          h('span', null, 'Fleet Unit Management'),
          h('span', { className: 'tag' }, `${filteredVehicles.length} Units`)
        ),
        h(
          'button',
          {
            className: 'p',
            style: { padding: '5px 12px', fontSize: 12 },
            onClick: () =>
              updateStoreState((prev) => ({
                ...prev,
                vehicles: [
                  ...prev.vehicles,
                  {
                    id: 'v' + getCurrentTimestamp(),
                    unit: 'JP-' + (100 + prev.vehicles.length + 1),
                    desc: 'Modernized Jeepney',
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
          '+ Add Unit'
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
            ['Unit', 'Route Assignment', 'Operational Status', 'Seat Occupancy', 'Last GPS Ping', 'Actions'].map((headerText) =>
              h('th', { key: headerText }, headerText)
            )
          )
        ),
        h(
          'tbody',
          null,
          filteredVehicles.map((vehicle) => {
            const vInfo = getVehicleStatusInfo(vehicle);
            const avail = vehicle.avail;
            const total = vehicle.total || 33;
            const occRatio = avail == null ? 0 : Math.max(0, total - avail) / total;

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
                    style: { fontWeight: 700, color: 'var(--brand-700)' },
                    onClick: (e) => {
                      e.preventDefault();
                      setSelectedVehicleId(vehicle.id);
                    },
                  },
                  vehicle.unit
                ),
                h('div', { style: { marginTop: 2 } }, h(Badge, { c: vInfo.col }, vInfo.label))
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
                    style: { padding: '4px 6px', fontSize: 11.5 },
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
                    style: { padding: '4px 6px', fontSize: 11.5 },
                  },
                  ['On Route', 'At Terminal', 'Out of Service'].map((status) =>
                    h('option', { key: status }, status)
                  )
                )
              ),
              // Seat Occupancy Meter & Input
              h(
                'td',
                null,
                h(
                  'div',
                  { style: { display: 'flex', alignItems: 'center', gap: 6 } },
                  h('input', {
                    type: 'number',
                    min: 0,
                    max: vehicle.total,
                    style: { width: 52, padding: '3px 6px', fontSize: 11.5 },
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
                  h('span', { style: { color: 'var(--tx-muted)', fontSize: 11 } }, `/${total}`)
                ),
                // Mini Visual Seat Bar
                avail != null &&
                  h(
                    'div',
                    {
                      style: {
                        height: 4,
                        width: 70,
                        background: '#e2e8f0',
                        borderRadius: 99,
                        marginTop: 4,
                        overflow: 'hidden',
                      },
                    },
                    h('i', {
                      style: {
                        display: 'block',
                        height: '100%',
                        width: `${occRatio * 100}%`,
                        background:
                          avail === 0
                            ? 'var(--er-primary)'
                            : avail <= 8
                            ? 'var(--wa-primary)'
                            : 'var(--ok-primary)',
                      },
                    })
                  )
              ),
              // Last Telemetry Timestamp
              h('td', { style: { color: 'var(--tx-muted)' } }, formatTimeAgo(vehicle.lastAt)),
              // Action Buttons
              h(
                'td',
                null,
                h(
                  'button',
                  {
                    style: {
                      padding: '3px 8px',
                      fontSize: 11,
                      color: 'var(--er-primary)',
                      background: 'var(--er-bg)',
                      border: '1px solid var(--er-border)',
                      borderRadius: 'var(--radius-sm)',
                    },
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
                    style: { padding: '3px 8px', fontSize: 11, borderRadius: 'var(--radius-sm)' },
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
      h(
        'h3',
        null,
        h('span', null, 'Route Network Manager'),
        h('span', { className: 'tag' }, `${state.routes.length} Routes`)
      ),
      h(
        'div',
        { style: { display: 'grid', gap: 8 } },
        state.routes.map((route) => {
          const assignedUnitCount = state.vehicles.filter(
            (v) => v.routeId === route.id
          ).length;

          return h(
            'div',
            {
              key: route.id,
              className: 'row',
              style: {
                padding: '8px 12px',
                background: 'var(--surface-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              },
            },
            h(
              'span',
              { style: { flex: 1, fontWeight: 600, color: 'var(--tx-primary)' } },
              `${route.name}: ${route.from} → ${route.to} `,
              h('span', { style: { color: 'var(--tx-muted)', fontWeight: 400, fontSize: 11.5 } }, `(${assignedUnitCount} units assigned)`)
            ),
            h(
              'button',
              {
                style: { padding: '3px 9px', fontSize: 11 },
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
                style: { padding: '3px 9px', fontSize: 11 },
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
        })
      ),
      // Add Route Input Form
      h(
        'div',
        { className: 'row', style: { marginTop: 10 } },
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
            style: { width: 130, padding: '6px 10px' },
          })
        ),
        h(
          'button',
          {
            className: 'p',
            style: { padding: '6px 12px' },
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
          'Add Route'
        )
      ),
      routeErrorMessage &&
        h('div', { style: { color: 'var(--er-primary)', marginTop: 4 } }, routeErrorMessage)
    ),

    // 5. Demand Hotspots & Automated Dispatch Suggestions
    h(
      'div',
      { className: 'c' },
      h(
        'h3',
        null,
        h('span', null, 'Passenger Demand Hotspots'),
        h('span', { className: 'tag' }, 'SIMULATED IOT')
      ),
      h(
        'div',
        { style: { display: 'grid', gap: 6 } },
        state.demand.map((hotspot) => {
          const route = getRouteById(state, hotspot.routeId);
          return h(
            'div',
            { key: hotspot.id, className: 'row', style: { padding: '4px 0' } },
            h(Badge, { c: getLevelColorClass(hotspot.level) }, hotspot.level),
            h(
              'span',
              { style: { flex: 1, color: 'var(--tx-primary)', fontWeight: 600 } },
              `${hotspot.loc} `
            ),
            h('span', { style: { color: 'var(--brand-700)', fontWeight: 700 } }, `${hotspot.count} waiting`),
            h(
              'span',
              { className: 'mu' },
              `· ${route?.name || '—'} · ${formatTimeAgo(hotspot.at)}`
            )
          );
        })
      ),
      highDemandHotspots.length
        ? h(
            'div',
            {
              className: 'mu',
              style: {
                marginTop: 8,
                padding: '8px 12px',
                background: 'var(--wa-bg)',
                color: 'var(--wa-tx)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--wa-border)',
                fontWeight: 600,
              },
            },
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

                return `• Consider dispatching units near ${hotspot.loc}: ${activeUnits} on route, ${terminalUnits} waiting at terminal.`;
              })
              .join(' ')
          )
        : h('div', { className: 'mu', style: { marginTop: 6 } }, 'No high-demand congestion areas reported.')
    ),

    // 6. Fare Matrix Configuration
    h(FareSettings),

    // 7. Route ETA Predictions
    h(EtaCard),

    // 8. Operational Alerts & Acknowledgment Workflow
    h(
      'div',
      { className: 'c' },
      h(
        'h3',
        null,
        h('span', null, 'Operational Fleet Alerts'),
        h('span', { className: 'tag' }, `${state.alerts.length} Alerts`)
      ),
      state.alerts.length
        ? h(
            'div',
            { style: { display: 'grid', gap: 8 } },
            state.alerts.map((alertItem) =>
              h(
                'div',
                {
                  key: alertItem.id,
                  className: 'row',
                  style: {
                    padding: '8px 12px',
                    background: 'var(--surface-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  },
                },
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
                  { style: { flex: 1, fontWeight: 600, color: 'var(--tx-primary)' } },
                  `${alertItem.msg} `,
                  h('small', { style: { color: 'var(--tx-muted)', fontWeight: 400 } }, `(${formatTimeAgo(alertItem.at)})`)
                ),
                alertItem.status === 'Open' &&
                  h(
                    'button',
                    {
                      style: { padding: '3px 9px', fontSize: 11 },
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
                      style: { padding: '3px 9px', fontSize: 11 },
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
          )
        : h('div', { className: 'mu' }, 'No active alerts. The fleet is operating smoothly.')
    ),

    // 9. PAO Field Reports Feed
    h(
      'div',
      { className: 'c' },
      h(
        'h3',
        null,
        h('span', null, 'PAO Ground Officer Reports'),
        h('span', { className: 'tag' }, 'FIELD DISPATCH')
      ),
      state.obs.slice(0, 4).map((observation) =>
        h(
          'div',
          {
            key: observation.id,
            className: 'mu',
            style: {
              padding: '6px 0',
              borderBottom: '1px solid var(--border-subtle)',
              color: 'var(--tx-secondary)',
            },
          },
          `• ${observation.type} at ${observation.loc} (${observation.sev}) · Reported ${formatTimeAgo(
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
