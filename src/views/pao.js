/**
 * WaitLess Prototype - Passenger Assistance Officer (PAO) View
 *
 * Implements:
 * - Mobile field interface for ground officers
 * - Route filtering and situational overview
 * - Passenger demand hotspot monitoring with visual density meters
 * - Real-time traffic condition and incident monitoring
 * - Instant field incident reporting with automatic alert escalation
 */

function PAO() {
  const state = useStoreState();

  const [selectedRouteId, setSelectedRouteId] = useState('all');
  const [activeTab, setActiveTab] = useState('over');
  const [trafficSeverityFilter, setTrafficSeverityFilter] = useState('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  // New observation form state
  const [reportForm, setReportForm] = useState({
    type: 'Passenger Congestion',
    loc: '',
    sev: 'Moderate',
    desc: '',
  });
  const [formErrorMessage, setFormErrorMessage] = useState('');
  const [formSuccessMessage, setFormSuccessMessage] = useState('');

  // Map layer visibility toggles
  const [layerVisibility, setLayerVisibility] = useState({
    dm: true,
    tf: true,
    cm: true,
    vh: true,
  });

  const activeRoutes = state.routes.filter((r) => r.active);
  const selectedRoute =
    selectedRouteId === 'all' ? null : getRouteById(state, selectedRouteId);
  const displayedRoutes = selectedRoute ? [selectedRoute] : activeRoutes;

  // Extract unique stop locations for the incident location dropdown
  const uniqueLocations = [
    ...new Set(state.routes.flatMap((r) => r.pick.map((stop) => stop.n))),
  ];

  const matchesRouteFilter = (item) =>
    !selectedRoute || item.routeId === selectedRoute.id;

  const filteredDemand = state.demand
    .filter(matchesRouteFilter)
    .sort((a, b) => b.count - a.count);

  const allFilteredTraffic = state.traffic.filter(matchesRouteFilter);
  const displayedTraffic = allFilteredTraffic.filter(
    (t) =>
      trafficSeverityFilter === 'all' || t.level === trafficSeverityFilter
  );

  const operatingVehicles = state.vehicles.filter(
    (v) =>
      (!selectedRoute || v.routeId === selectedRoute.id) &&
      v.status === 'On Route' &&
      !getVehicleStatusInfo(v).stale
  );

  const topDemandSpot = filteredDemand[0];
  const heavyTrafficRoad = allFilteredTraffic.find((t) => t.level === 'Heavy');
  const incidentCount = allFilteredTraffic.filter((t) => t.inc !== 'None').length;
  const inspectedVehicle =
    selectedVehicleId && state.vehicles.find((v) => v.id === selectedVehicleId);

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

  // Demand density progress bar
  const renderDemandBar = (count) =>
    h(
      'div',
      {
        style: {
          height: 6,
          borderRadius: 9,
          background: '#e2ebf8',
          marginTop: 4,
        },
      },
      h('i', {
        style: {
          display: 'block',
          height: '100%',
          width: `${Math.min(100, count * 2.5)}%`,
          borderRadius: 9,
          background:
            count >= 25 ? '#dc2626' : count >= 12 ? '#f59e0b' : '#22c55e',
        },
      })
    );

  const handleSaveObservation = () => {
    if (!reportForm.loc) {
      return setFormErrorMessage('Choose a location.');
    }
    if (reportForm.desc.trim().length < 5) {
      return setFormErrorMessage('Add a description of at least 5 characters.');
    }
    setFormErrorMessage('');

    const timestamp = getCurrentTimestamp();
    const newObservation = {
      id: 'o' + timestamp,
      type: reportForm.type,
      loc: reportForm.loc,
      sev: reportForm.sev,
      desc: reportForm.desc.trim(),
      at: timestamp,
    };

    updateStoreState((prev) => {
      const nextAlerts =
        reportForm.sev === 'High'
          ? [
              {
                id: 'a' + timestamp,
                type: 'PAO Report',
                msg: `PAO: ${reportForm.type} at ${reportForm.loc}.`,
                sev: 'High',
                at: timestamp,
                status: 'Open',
              },
              ...prev.alerts,
            ]
          : prev.alerts;

      return {
        ...prev,
        obs: [newObservation, ...prev.obs],
        alerts: nextAlerts,
      };
    });

    setReportForm({ ...reportForm, desc: '' });
    setFormSuccessMessage(
      'Observation saved. It now appears under Recent observations and in the Cooperative view.'
    );
  };

  return h(
    MapSheet,
    {
      mapFn: (viewBox) =>
        h(
          React.Fragment,
          null,
          h(LayersBtn, {
            L: layerVisibility,
            setL: setLayerVisibility,
            items: [
              ['dm', 'Demand heatmap'],
              ['tf', 'Traffic heatmap'],
              ['cm', 'Commuters on the road'],
              ['vh', 'Vehicles'],
            ],
          }),
          h(MapView, {
            routes: displayedRoutes,
            vs: operatingVehicles,
            sel: selectedVehicleId,
            onSel: setSelectedVehicleId,
            hot: layerVisibility.dm ? filteredDemand : [],
            traf: layerVisibility.tf,
            comm: layerVisibility.cm,
            showV: layerVisibility.vh,
            vb: viewBox,
          })
        ),
      top: h(
        'div',
        { className: 'chips', ...dragScroll },
        h(
          'button',
          {
            className: selectedRouteId === 'all' ? 'p' : '',
            onClick: () => setSelectedRouteId('all'),
          },
          'All routes'
        ),
        activeRoutes.map((route) =>
          h(
            'button',
            {
              key: route.id,
              className: selectedRouteId === route.id ? 'p' : '',
              onClick: () => setSelectedRouteId(route.id),
            },
            route.name
          )
        )
      ),
    },

    // Header
    h(
      'div',
      null,
      h('b', { style: { fontSize: 17 } }, 'PAO field monitor'),
      h(
        'div',
        { className: 'mu' },
        `${selectedRoute ? selectedRoute.name : 'All routes'} · ${new Date().toLocaleString(
          [],
          {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }
        )} · simulated data`
      )
    ),

    // Navigation Tabs
    h(
      'div',
      { className: 'seg' },
      renderTabChip('over', 'Overview'),
      renderTabChip('dem', 'Demand'),
      renderTabChip('tra', 'Traffic'),
      renderTabChip('rep', 'Report')
    ),

    // Vehicle Inspection Card
    inspectedVehicle &&
      h(VCard, { v: inspectedVehicle, onSel: () => setSelectedVehicleId(null) }),

    // Tab 1: Overview
    activeTab === 'over' &&
      h(
        React.Fragment,
        null,
        h(
          'div',
          { className: 'kp' },
          [
            ['Hotspots', filteredDemand.length],
            ['Incidents', incidentCount],
            ['Units operating', operatingVehicles.length],
            [
              'Heavy roads',
              allFilteredTraffic.filter((t) => t.level === 'Heavy').length,
            ],
          ].map(([label, count]) =>
            h('div', { key: label }, h('b', null, count), label)
          )
        ),
        h(
          'div',
          { className: 'c' },
          h('h3', null, 'Situation summary'),
          h(
            'div',
            null,
            (topDemandSpot
              ? `${topDemandSpot.level} simulated demand at ${topDemandSpot.loc} (${topDemandSpot.count} waiting). `
              : 'No demand reports. ') +
              (heavyTrafficRoad
                ? `Heavy traffic on ${heavyTrafficRoad.road}. `
                : 'No heavy traffic reported. ') +
              `${operatingVehicles.length} unit(s) operating with fresh data.`
          ),
          h(CommNote)
        ),
        h(EtaCard, { rid: selectedRouteId }),
        h(
          'div',
          { className: 'c' },
          h('h3', null, 'Recent observations'),
          state.obs.length
            ? state.obs.slice(0, 5).map((obs) =>
                h(
                  'div',
                  { key: obs.id, style: { marginBottom: 6 } },
                  h(
                    'div',
                    { className: 'row' },
                    h(Badge, { c: getLevelColorClass(obs.sev) }, obs.sev),
                    h('b', null, obs.type)
                  ),
                  h(
                    'div',
                    { className: 'mu' },
                    `${obs.loc} · ${formatTimeAgo(obs.at)} · Manually reported`
                  ),
                  h('div', null, obs.desc)
                )
              )
            : h('div', { className: 'mu' }, 'No observations yet.')
        )
      ),

    // Tab 2: Demand Hotspots
    activeTab === 'dem' &&
      h(
        React.Fragment,
        null,
        filteredDemand.length
          ? filteredDemand.map((spot) => {
              const nearbyOperatingUnits = state.vehicles.filter(
                (v) =>
                  v.routeId === spot.routeId &&
                  v.status === 'On Route' &&
                  !getVehicleStatusInfo(v).stale
              ).length;

              return h(
                'div',
                { key: spot.id, className: 'c' },
                h(
                  'div',
                  { className: 'row' },
                  h(Badge, { c: getLevelColorClass(spot.level) }, spot.level),
                  h('b', { style: { flex: 1 } }, spot.loc),
                  h('span', null, `${spot.count} waiting`)
                ),
                renderDemandBar(spot.count),
                h(
                  'div',
                  { className: 'mu', style: { marginTop: 4 } },
                  `${getRouteById(state, spot.routeId)?.name || '—'} · ${nearbyOperatingUnits} unit(s) on route · ${formatTimeAgo(
                    spot.at
                  )} · ${spot.src}`
                )
              );
            })
          : h('div', { className: 'c mu' }, 'No hotspots for this selection.')
      ),

    // Tab 3: Road Traffic
    activeTab === 'tra' &&
      h(
        React.Fragment,
        null,
        h(
          'select',
          {
            value: trafficSeverityFilter,
            onChange: (e) => setTrafficSeverityFilter(e.target.value),
            'aria-label': 'Severity',
          },
          ['all', 'Light', 'Moderate', 'Heavy', 'Unknown'].map((level) =>
            h(
              'option',
              { key: level, value: level },
              level === 'all' ? 'All levels' : level
            )
          )
        ),
        displayedTraffic.length
          ? displayedTraffic.map((traffic) =>
              h(
                'div',
                { key: traffic.id, className: 'c' },
                h(
                  'div',
                  { className: 'row' },
                  h(Badge, { c: getLevelColorClass(traffic.level) }, traffic.level),
                  h('b', null, traffic.road)
                ),
                h(
                  'div',
                  { className: 'mu' },
                  `${getRouteById(state, traffic.routeId)?.name || ''} · Incident: ${
                    traffic.inc
                  } · ${formatTimeAgo(traffic.at)} · ${traffic.src}`
                )
              )
            )
          : h('div', { className: 'c mu' }, 'No traffic reports match.')
      ),

    // Tab 4: Report Observation
    activeTab === 'rep' &&
      h(
        'div',
        { className: 'c' },
        h('h3', null, 'Report an observation'),
        h(
          'div',
          { className: 'row' },
          h(
            'select',
            {
              value: reportForm.type,
              onChange: (e) =>
                setReportForm({ ...reportForm, type: e.target.value }),
              'aria-label': 'Type',
            },
            [
              'Passenger Congestion',
              'Traffic Congestion',
              'Road Incident',
              'Jeepney Shortage',
              'Other',
            ].map((type) => h('option', { key: type }, type))
          ),
          h(
            'select',
            {
              value: reportForm.loc,
              onChange: (e) =>
                setReportForm({ ...reportForm, loc: e.target.value }),
              'aria-label': 'Location',
            },
            h('option', { value: '' }, 'Select location'),
            uniqueLocations.map((loc) => h('option', { key: loc }, loc))
          ),
          h(
            'select',
            {
              value: reportForm.sev,
              onChange: (e) =>
                setReportForm({ ...reportForm, sev: e.target.value }),
              'aria-label': 'Severity',
            },
            ['Low', 'Moderate', 'High'].map((sev) =>
              h('option', { key: sev }, sev)
            )
          )
        ),
        h('textarea', {
          rows: 3,
          style: { width: '100%', margin: '6px 0' },
          placeholder: 'Short description',
          value: reportForm.desc,
          onChange: (e) =>
            setReportForm({ ...reportForm, desc: e.target.value }),
        }),
        h('button', { className: 'p', onClick: handleSaveObservation }, 'Save observation'),
        formErrorMessage &&
          h('div', { style: { color: 'var(--er)' } }, formErrorMessage),
        formSuccessMessage &&
          !formErrorMessage &&
          h('div', { style: { color: 'var(--ok)' } }, formSuccessMessage)
      ),

    // Tab 5: Map Layers
    activeTab === 'lay' &&
      h(
        'div',
        { className: 'c' },
        [
          ['dm', 'Demand heatmap'],
          ['tf', 'Traffic heatmap'],
          ['cm', 'Commuters on the road'],
          ['vh', 'Vehicles'],
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
  );
}

window.WaitLessViews = {
  ...(window.WaitLessViews || {}),
  PAO,
};
