/**
 * WaitLess Prototype - Application Shell & Demo Controller
 *
 * Implements:
 * - Multi-view layout switcher (All Views, Commuter, Cooperative, PAO)
 * - Device frames toggle (realistic mobile and desktop chassis vs clean grid)
 * - Interactive scenario demo controls (traffic delays, breakdown, link outage, demand surge)
 * - Global header with system telemetry indicator
 */

// Display view configurations: [key, label, activeViewsList]
const DISPLAY_MODES = [
  ['all', 'All Views', ['c', 'o', 'p']],
  ['c', 'Commuter Only', ['c']],
  ['o', 'Cooperative Only', ['o']],
  ['p', 'PAO Only', ['p']],
  ['co', 'Commuter + Cooperative', ['c', 'o']],
  ['cp', 'Commuter + PAO', ['c', 'p']],
  ['op', 'Cooperative + PAO', ['o', 'p']],
];
const MODES = DISPLAY_MODES; // Backward-compatible alias

const VIEW_TITLES = {
  c: 'Commuter App',
  o: 'Cooperative Dashboard',
  p: 'PAO Mobile Dashboard',
};
const TITLE = VIEW_TITLES; // Backward-compatible alias

const VIEW_COMPONENTS = {
  c: Commuter,
  o: Coop,
  p: PAO,
};
const COMP = VIEW_COMPONENTS; // Backward-compatible alias

/**
 * Interactive Demo Simulation Controls
 */
function DemoControls() {
  const state = useStoreState();

  const renderActionButton = (label, actionFn) =>
    h('button', { onClick: () => updateStoreState(actionFn) }, label);

  return h(
    'div',
    { className: 'c', style: { margin: '0 12px' } },
    h(
      'div',
      { className: 'row' },
      h('b', null, 'Demo controls'),

      // 1. Pause / Resume movement
      renderActionButton(
        state.sim ? 'Pause movement' : 'Start movement',
        (prev) => ({ ...prev, sim: !prev.sim })
      ),

      // 2. Trigger Vehicle Breakdown
      renderActionButton('Vehicle out of service', (prev) => {
        const operatingVehicle = prev.vehicles.find(
          (v) => v.status === 'On Route'
        );
        if (!operatingVehicle) return prev;

        return {
          ...prev,
          vehicles: prev.vehicles.map((v) =>
            v.id === operatingVehicle.id
              ? { ...v, status: 'Out of Service' }
              : v
          ),
          alerts: [
            {
              id: 'a' + getCurrentTimestamp(),
              type: 'Out of Service',
              vehicleId: operatingVehicle.id,
              msg: `${operatingVehicle.unit} is Out of Service.`,
              sev: 'High',
              at: getCurrentTimestamp(),
              status: 'Open',
            },
            ...prev.alerts,
          ],
        };
      }),

      // 3. Trigger Passenger Demand Surge
      renderActionButton('Raise demand', (prev) => ({
        ...prev,
        demand: prev.demand.map((d, index) =>
          index === 1
            ? { ...d, count: d.count + 20, level: 'High', at: getCurrentTimestamp() }
            : d
        ),
        alerts: [
          {
            id: 'a' + getCurrentTimestamp(),
            type: 'High Demand',
            msg: 'High passenger demand at SM City pickup.',
            sev: 'High',
            at: getCurrentTimestamp(),
            status: 'Open',
          },
          ...prev.alerts,
        ],
      })),

      // 4. Trigger Heavy Traffic Congestion
      renderActionButton('Heavy traffic', (prev) => ({
        ...prev,
        traffic: prev.traffic.map((t, index) =>
          index === 0
            ? { ...t, level: 'Heavy', at: getCurrentTimestamp(), src: 'Simulated' }
            : t
        ),
      })),

      // 5. Trigger Limited Seats
      renderActionButton('Limited seats', (prev) => {
        const operatingVehicle = prev.vehicles.find(
          (v) => v.status === 'On Route'
        );
        if (!operatingVehicle) return prev;

        return {
          ...prev,
          vehicles: prev.vehicles.map((v) =>
            v.id === operatingVehicle.id
              ? { ...v, avail: 3, seatSrc: 'Simulated' }
              : v
          ),
        };
      }),

      // 6. Simulate LoRaWAN Signal Cut / Restore
      renderActionButton(
        state.link ? 'Cut LoRaWAN link' : 'Restore link',
        (prev) => ({ ...prev, link: !prev.link })
      ),

      // 7. Inject PAO Sample Observation
      renderActionButton('PAO sample report', (prev) => ({
        ...prev,
        obs: [
          {
            id: 'o' + getCurrentTimestamp(),
            type: 'Jeepney Shortage',
            loc: 'Mandurriao',
            sev: 'High',
            desc: 'Few units arriving, long wait.',
            at: getCurrentTimestamp(),
          },
          ...prev.obs,
        ],
      })),

      // 8. Reset to Default Seed Data
      renderActionButton('Reset demo data', (prev) =>
        confirm('Reset all demo data?') ? createInitialSeedData() : prev
      ),

      // 9. Clear Local Storage
      h(
        'button',
        {
          className: 'x',
          onClick: () => {
            if (confirm('Clear local data and start fresh?')) {
              try {
                localStorage.removeItem(STORAGE_KEY);
              } catch (e) {}
              storeState = createInitialSeedData();
              S = storeState;
              saveStoreState();
              subscribers.forEach((c) => c());
            }
          },
        },
        'Clear local data'
      )
    ),
    h(
      'div',
      { className: 'mu' },
      'Simulated flow: GPS device → LoRaWAN → gateway → network server → WaitLess → interfaces. No hardware is connected, data is not verified live information, and it is stored only in this browser.'
    )
  );
}
const Demo = DemoControls; // Backward-compatible alias

/**
 * Main Application Shell Component
 */
function App() {
  const state = useStoreState();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentMode =
    DISPLAY_MODES.find((m) => m[0] === state.mode) || DISPLAY_MODES[0];
  const visibleViews = currentMode[2];
  const hasDeviceFrames = state.phone !== false;

  return h(
    'div',
    null,
    // Header Bar
    h(
      'header',
      null,
      h('span', { className: 'logo' }, 'W'),
      h(
        'div',
        { className: 'brand' },
        h('b', null, 'WaitLess'),
        h('small', null, 'Modernized Jeepney Info System')
      ),
      h('span', { className: 'tag d' }, 'DEMO MODE'),
      h('span', { className: 'tag' }, 'LOCAL DATA'),
      h(
        'span',
        { className: 'tag' },
        state.link ? 'Simulated link: connected' : 'Simulated link: down'
      ),
      h('span', { className: 'sp' }),

      // Device frame toggle
      h(
        'button',
        {
          onClick: () =>
            updateStoreState((prev) => ({ ...prev, phone: prev.phone === false })),
        },
        `Device frames: ${hasDeviceFrames ? 'On' : 'Off'}`
      ),

      // Reset layout button
      h(
        'button',
        {
          onClick: () =>
            updateStoreState((prev) => ({ ...prev, mode: 'all' })),
        },
        'Reset Layout'
      ),

      // Display Views Dropdown Selector
      h(
        'div',
        { className: 'dd' },
        h(
          'button',
          {
            'aria-haspopup': 'menu',
            'aria-expanded': isDropdownOpen,
            onClick: () => setIsDropdownOpen(!isDropdownOpen),
            onKeyDown: (e) => e.key === 'Escape' && setIsDropdownOpen(false),
          },
          'Display Views ▾'
        ),
        isDropdownOpen &&
          h(
            'div',
            { className: 'menu', role: 'menu' },
            DISPLAY_MODES.map(([modeKey, label]) =>
              h(
                'button',
                {
                  key: modeKey,
                  role: 'menuitem',
                  onClick: () => {
                    updateStoreState((prev) => ({ ...prev, mode: modeKey }));
                    setIsDropdownOpen(false);
                  },
                },
                `${modeKey === state.mode ? '✓ ' : '   '}${label}`
              )
            )
          )
      )
    ),

    // Subtitle Banner
    h(
      'div',
      { className: 'mu', style: { padding: '6px 14px' } },
      `Your Ride, Closer Than You Think. · Showing: ${currentMode[1]} · Simulated data stored in this browser only.`
    ),

    // Scenario Demo Controls Panel
    h(DemoControls),

    // Multi-View Main Viewport Grid
    h(
      'div',
      {
        className: `grid ${hasDeviceFrames ? 'fr' : ''}`,
        style: hasDeviceFrames
          ? {}
          : {
              gridTemplateColumns: `repeat(auto-fit, minmax(${
                visibleViews.length > 2 ? '320px' : '360px'
              }, 1fr))`,
            },
      },
      ['c', 'o', 'p'].map((viewKey) => {
        const Component = VIEW_COMPONENTS[viewKey];
        const isVisible = visibleViews.includes(viewKey);

        const frameClass = hasDeviceFrames
          ? viewKey === 'o'
            ? ' mon'
            : ' ph'
          : '';
        const wrapperClass = hasDeviceFrames && viewKey === 'o' ? 'devm' : '';

        return h(
          'div',
          {
            key: viewKey,
            className: wrapperClass,
            style: { display: isVisible ? 'block' : 'none' },
          },
          h(
            'section',
            {
              key: viewKey,
              className: `panel${frameClass}`,
              style: { display: isVisible ? 'block' : 'none' },
              'aria-label': VIEW_TITLES[viewKey],
            },
            h(
              'h2',
              null,
              h('span', { className: 'ico' }, { c: '📱', o: '🖥️', p: '📍' }[viewKey]),
              h(
                'span',
                null,
                VIEW_TITLES[viewKey],
                h(
                  'small',
                  null,
                  {
                    c: 'For passengers',
                    o: 'Fleet operations',
                    p: 'Field monitoring',
                  }[viewKey]
                )
              ),
              h('span', { className: 'tag live' }, 'SIMULATED')
            ),
            h(Component)
          )
        );
      }),
      // Embedded second screen display if enabled
      state.second && visibleViews.includes('o') && h(SecondScreen)
    )
  );
}

window.WaitLessApp = {
  DISPLAY_MODES,
  MODES,
  VIEW_TITLES,
  TITLE,
  VIEW_COMPONENTS,
  COMP,
  DemoControls,
  Demo,
  App,
};
