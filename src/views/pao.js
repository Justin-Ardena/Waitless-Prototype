/**
 * WaitLess Prototype - Modern Passenger Assistance Officer (PAO) View
 *
 * Implements:
 * - Handheld mobile field interface for ground officers
 * - Route filtering and live situational overview
 * - Passenger queue density monitoring with visual progress meters
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

  // Unique stop locations for the incident location dropdown
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

  // Demand density progress bar
  const renderDemandBar = (count) => {
    const ratio = Math.min(1, count / 40);
    const color =
      count >= 25
        ? 'var(--er-primary)'
        : count >= 15
        ? 'var(--wa-primary)'
        : 'var(--ok-primary)';

    return h(
      'div',
      {
        style: {
          height: 6,
          borderRadius: 'var(--radius-full)',
          background: '#e2e8f0',
          marginTop: 6,
          overflow: 'hidden',
        },
      },
      h('i', {
        style: {
          display: 'block',
          height: '100%',
          width: `${ratio * 100}%`,
          borderRadius: 'var(--radius-full)',
          background: color,
          transition: 'width 0.3s ease',
        },
      })
    );
  };

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
      'Observation submitted. Escalated to Cooperative Operations Center.'
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
          'All Routes'
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

    // Header Title
    h(
      'div',
      { className: 'row', style: { justifyContent: 'space-between', alignItems: 'flex-start' } },
      h(
        'div',
        null,
        h('b', { style: { fontSize: 17, color: 'var(--tx-primary)' } }, 'PAO Field Monitor'),
        h(
          'div',
          { className: 'mu' },
          `${selectedRoute ? selectedRoute.name : 'All network corridors'} · ${new Date().toLocaleTimeString(
            [],
            { hour: '2-digit', minute: '2-digit' }
          )}`
        )
      ),
      h(Badge, { c: 'pr' }, 'FIELD TERMINAL')
    ),

    // Navigation Tabs
    h(
      'div',
      { className: 'seg' },
      renderTabChip('over', 'Overview', Icons.Sliders),
      renderTabChip('dem', 'Queues', Icons.Users),
      renderTabChip('tra', 'Traffic', Icons.AlertTriangle),
      renderTabChip('rep', 'Report', Icons.MapPin)
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
            ['Hotspots', filteredDemand.length, Icons.Users],
            ['Incidents', incidentCount, Icons.AlertTriangle],
            ['Operating', operatingVehicles.length, Icons.Bus],
            [
              'Congested',
              allFilteredTraffic.filter((t) => t.level === 'Heavy').length,
              Icons.Clock,
            ],
          ].map(([label, count, icon]) =>
            h(
              'div',
              { key: label },
              h(
                'div',
                { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                h('b', null, count),
                icon && h(icon, { size: 15, color: 'var(--brand-500)' })
              ),
              h('span', null, label)
            )
          )
        ),
        h(
          'div',
          { className: 'c' },
          h('h3', null, 'Terminal Situation Summary'),
          h(
            'div',
            { style: { fontSize: 13, lineHeight: 1.5, color: 'var(--tx-primary)' } },
            (topDemandSpot
              ? `${topDemandSpot.level} passenger demand queue at ${topDemandSpot.loc} with approx. ${topDemandSpot.count} waiting. `
              : 'No crowd congestion hotspots detected. ') +
              (heavyTrafficRoad
                ? `Heavy road traffic along ${heavyTrafficRoad.road}. `
                : 'No severe road slowdowns reported. ') +
              `${operatingVehicles.length} vehicle unit(s) reporting live on this corridor.`
          ),
          h(CommNote)
        ),
        h(EtaCard, { rid: selectedRouteId }),
        h(
          'div',
          { className: 'c' },
          h('h3', null, 'Recent Ground Observations'),
          state.obs.length
            ? state.obs.slice(0, 5).map((obs) =>
                h(
                  'div',
                  {
                    key: obs.id,
                    style: {
                      marginBottom: 8,
                      padding: '8px 10px',
                      background: 'var(--surface-subtle)',
                      borderRadius: 'var(--radius-sm)',
                    },
                  },
                  h(
                    'div',
                    { className: 'row', style: { justifyContent: 'space-between' } },
                    h('b', { style: { color: 'var(--tx-primary)' } }, obs.type),
                    h(Badge, { c: getLevelColorClass(obs.sev) }, obs.sev)
                  ),
                  h(
                    'div',
                    { className: 'mu', style: { margin: '2px 0 4px' } },
                    `${obs.loc} · ${formatTimeAgo(obs.at)} · Field Officer`
                  ),
                  h('div', { style: { fontSize: 12.5 } }, obs.desc)
                )
              )
            : h('div', { className: 'mu' }, 'No field observations submitted yet.')
        )
      ),

    // Tab 2: Passenger Queues & Demand Hotspots
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
                  h('b', { style: { flex: 1, color: 'var(--tx-primary)' } }, spot.loc),
                  h('span', { style: { fontWeight: 700, color: 'var(--brand-700)' } }, `${spot.count} waiting`)
                ),
                renderDemandBar(spot.count),
                h(
                  'div',
                  { className: 'mu', style: { marginTop: 6 } },
                  `${getRouteById(state, spot.routeId)?.name || '—'} · ${nearbyOperatingUnits} unit(s) on route · Updated ${formatTimeAgo(
                    spot.at
                  )}`
                )
              );
            })
          : h('div', { className: 'c mu' }, 'No queue hotspots for this selection.')
      ),

    // Tab 3: Traffic Conditions
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
            style: { fontWeight: 600 },
          },
          ['all', 'Light', 'Moderate', 'Heavy', 'Unknown'].map((level) =>
            h(
              'option',
              { key: level, value: level },
              level === 'all' ? 'All Severity Levels' : `${level} Traffic`
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
                  { className: 'row', style: { justifyContent: 'space-between' } },
                  h('b', { style: { color: 'var(--tx-primary)' } }, traffic.road),
                  h(Badge, { c: getLevelColorClass(traffic.level) }, traffic.level)
                ),
                h(
                  'div',
                  { className: 'mu', style: { marginTop: 4 } },
                  `${getRouteById(state, traffic.routeId)?.name || ''} · Incident: ${
                    traffic.inc
                  } · Updated ${formatTimeAgo(traffic.at)}`
                )
              )
            )
          : h('div', { className: 'c mu' }, 'No traffic slowdowns match.')
      ),

    // Tab 4: Report Incident Form
    activeTab === 'rep' &&
      h(
        'div',
        { className: 'c' },
        h('h3', null, 'Report Field Incident'),
        h(
          'div',
          { style: { display: 'grid', gap: 10 } },
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
                style: { flex: 1 },
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
                style: { flex: 1 },
              },
              h('option', { value: '' }, 'Select Location'),
              uniqueLocations.map((loc) => h('option', { key: loc }, loc))
            ),
            h(
              'select',
              {
                value: reportForm.sev,
                onChange: (e) =>
                  setReportForm({ ...reportForm, sev: e.target.value }),
                'aria-label': 'Severity',
                style: { width: 110 },
              },
              ['Low', 'Moderate', 'High'].map((sev) =>
                h('option', { key: sev }, `${sev} Severity`)
              )
            )
          ),
          h('textarea', {
            rows: 3,
            style: { width: '100%', padding: '10px 12px' },
            placeholder: 'Provide concise details about the crowd congestion, road blockage, or unit delay…',
            value: reportForm.desc,
            onChange: (e) =>
              setReportForm({ ...reportForm, desc: e.target.value }),
          }),
          h(
            'button',
            {
              className: 'p',
              style: { padding: '10px 14px' },
              onClick: handleSaveObservation,
            },
            'Submit Field Report'
          ),
          formErrorMessage &&
            h(
              'div',
              { style: { color: 'var(--er-primary)', fontWeight: 600, fontSize: 12 } },
              formErrorMessage
            ),
          formSuccessMessage &&
            !formErrorMessage &&
            h(
              'div',
              { style: { color: 'var(--ok-tx)', fontWeight: 600, fontSize: 12 } },
              formSuccessMessage
            )
        )
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
  );
}

window.WaitLessViews = {
  ...(window.WaitLessViews || {}),
  PAO,
};
