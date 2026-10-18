/**
 * WaitLess Prototype - Modern Application Shell & Demo Controller
 *
 * Implements:
 * - High-end header with live telemetry heartbeat indicator
 * - Simulation Scenario Cockpit with one-tap preset triggers
 * - Multi-view layout switcher (All Views, Commuter, Cooperative, PAO)
 * - Device frames toggle (Apple-grade iPhone & Studio Display chassis vs clean grid)
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
 * Modern Simulation Scenario Cockpit
 */
function DemoControls() {
  const state = useStoreState();

  const renderActionButton = (label, icon, actionFn, isDanger = false) =>
    h(
      'button',
      {
        className: isDanger ? 'x' : '',
        onClick: () => updateStoreState(actionFn),
      },
      icon && h(icon, { size: 12 }),
      label
    );

  return h(
    'div',
    { className: 'demo-cockpit' },
    h(
      'div',
      { className: 'demo-cockpit-header' },
      h(
        'div',
        { className: 'demo-cockpit-title' },
        h(Icons.Sliders, { size: 15, color: 'var(--brand-600)' }),
        'Simulation Cockpit'
      ),
      h(
        'span',
        { className: 'tag' },
        `GPS Pings: ${state.sim ? '1.5s Active' : 'Paused'}`
      ),
      h(
        'span',
        { className: 'tag', style: { marginLeft: 'auto' } },
        state.link ? '📡 LoRaWAN: Online' : '📡 LoRaWAN: Disconnected'
      )
    ),

    // Quick Scenario Triggers
    h(
      'div',
      { className: 'demo-cockpit-pills' },
      // 1. Play / Pause
      renderActionButton(
        state.sim ? 'Pause Fleet Movement' : 'Resume Movement',
        state.sim ? Icons.Pause : Icons.Play,
        (prev) => ({ ...prev, sim: !prev.sim })
      ),

      // 2. Trigger Breakdown
      renderActionButton(
        'Simulate Unit Breakdown',
        Icons.AlertTriangle,
        (prev) => {
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
                msg: `${operatingVehicle.unit} reported an unscheduled mechanical breakdown.`,
                sev: 'High',
                at: getCurrentTimestamp(),
                status: 'Open',
              },
              ...prev.alerts,
            ],
          };
        }
      ),

      // 3. Demand Surge
      renderActionButton(
        'Trigger Passenger Demand Surge',
        Icons.Users,
        (prev) => ({
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
              msg: 'Critical passenger crowd surge at SM City pickup terminal.',
              sev: 'High',
              at: getCurrentTimestamp(),
              status: 'Open',
            },
            ...prev.alerts,
          ],
        })
      ),

      // 4. Heavy Traffic Jam
      renderActionButton(
        'Inject Heavy Traffic Delay',
        Icons.Clock,
        (prev) => ({
          ...prev,
          traffic: prev.traffic.map((t, index) =>
            index === 0
              ? { ...t, level: 'Heavy', at: getCurrentTimestamp(), src: 'Simulated' }
              : t
          ),
        })
      ),

      // 5. Limited Seats Capacity
      renderActionButton(
        'Simulate Low Seat Capacity',
        Icons.Bus,
        (prev) => {
          const operatingVehicle = prev.vehicles.find(
            (v) => v.status === 'On Route'
          );
          if (!operatingVehicle) return prev;

          return {
            ...prev,
            vehicles: prev.vehicles.map((v) =>
              v.id === operatingVehicle.id
                ? { ...v, avail: 2, seatSrc: 'Simulated' }
                : v
            ),
          };
        }
      ),

      // 6. Signal Link Disruption
      renderActionButton(
        state.link ? 'Disconnect LoRaWAN Link' : 'Restore LoRaWAN Link',
        Icons.Signal,
        (prev) => ({ ...prev, link: !prev.link })
      ),

      // 7. Inject PAO Sample Observation
      renderActionButton(
        'Inject PAO Field Observation',
        Icons.MapPin,
        (prev) => ({
          ...prev,
          obs: [
            {
              id: 'o' + getCurrentTimestamp(),
              type: 'Jeepney Shortage',
              loc: 'Mandurriao',
              sev: 'High',
              desc: 'Severe bottleneck at station, passenger queue exceeding terminal capacity.',
              at: getCurrentTimestamp(),
            },
            ...prev.obs,
          ],
        })
      ),

      // 8. Reset to Default Seed Data
      renderActionButton(
        'Reset Demo Data',
        Icons.Refresh,
        (prev) =>
          confirm('Reset all demo fleet, route, and traffic data?')
            ? createInitialSeedData()
            : prev
      ),

      // 9. Clear Local Storage
      h(
        'button',
        {
          className: 'x',
          onClick: () => {
            if (confirm('Clear local browser storage and reinitialize prototype?')) {
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
        h(Icons.Trash, { size: 12 }),
        'Clear Storage'
      )
    ),

    h(
      'div',
      { className: 'mu' },
      'Simulated IoT Telemetry Flow: Modernized Jeepney On-Board GPS Tracker → LoRaWAN / 4G Cellular → Gateway → WaitLess Core Server → Client Apps. All data is simulated client-side and saved in browser storage.'
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
    // Modern Frosted Header
    h(
      'header',
      null,
      h('span', { className: 'logo' }, 'W'),
      h(
        'div',
        { className: 'brand' },
        h('b', null, 'WaitLess'),
        h('small', null, 'Modernized Jeepney Telemetry & Passenger Info')
      ),
      h('span', { className: 'tag d' }, 'PROTOTYPE DEMO'),
      h(
        'span',
        { className: 'tag' },
        state.link ? '📡 LoRaWAN: Active' : '📡 LoRaWAN: Down'
      ),
      h('span', { className: 'sp' }),

      // Device frame toggle button
      h(
        'button',
        {
          onClick: () =>
            updateStoreState((prev) => ({ ...prev, phone: prev.phone === false })),
          style: {
            borderRadius: 'var(--radius-full)',
            padding: '7px 14px',
            fontSize: 12,
            fontWeight: 600,
          },
        },
        hasDeviceFrames
          ? h(Icons.Smartphone, { size: 14 })
          : h(Icons.Monitor, { size: 14 }),
        `Device Mockups: ${hasDeviceFrames ? 'On' : 'Flat Grid'}`
      ),

      // Reset layout button
      h(
        'button',
        {
          onClick: () =>
            updateStoreState((prev) => ({ ...prev, mode: 'all' })),
          style: {
            borderRadius: 'var(--radius-full)',
            padding: '7px 14px',
            fontSize: 12,
            fontWeight: 600,
          },
        },
        'Reset Views'
      ),

      // Display Views Dropdown Selector
      h(
        'div',
        { className: 'dd' },
        h(
          'button',
          {
            className: 'p',
            'aria-haspopup': 'menu',
            'aria-expanded': isDropdownOpen,
            onClick: () => setIsDropdownOpen(!isDropdownOpen),
            onKeyDown: (e) => e.key === 'Escape' && setIsDropdownOpen(false),
            style: { borderRadius: 'var(--radius-full)', padding: '7px 16px' },
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
                modeKey === state.mode ? `✓ ${label}` : `   ${label}`
              )
            )
          )
      )
    ),

    // Subtitle Context Banner
    h(
      'div',
      { className: 'context-banner' },
      h(
        'span',
        null,
        'Your Ride, Closer Than You Think. · Displaying: ',
        h('b', { style: { color: 'var(--brand-700)' } }, currentMode[1]),
        ' · Telemetry and passenger state persisted in localStorage.'
      )
    ),

    // Simulation Scenario Controls Panel
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
                visibleViews.length > 2 ? '340px' : '400px'
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

        const iconComponent =
          viewKey === 'c'
            ? Icons.Smartphone
            : viewKey === 'o'
            ? Icons.Monitor
            : Icons.MapPin;

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
              h('span', { className: 'ico' }, h(iconComponent, { size: 16 })),
              h(
                'span',
                null,
                VIEW_TITLES[viewKey],
                h(
                  'small',
                  null,
                  {
                    c: 'Commuter Mobile Passenger App',
                    o: 'Cooperative Operations Center',
                    p: 'PAO Field Terminal Monitor',
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
