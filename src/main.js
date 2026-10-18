/**
 * WaitLess Prototype - Application Entry Point
 *
 * Bootstraps the root React application and handles hash-based routing:
 * - '#map': Standalone Cooperative Fleet Map (ideal for second-screen / multi-monitor setups)
 * - Default: Full Multi-View Application Shell (Commuter, Cooperative, PAO)
 */

function RootRouter() {
  const [routeHash, setRouteHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setRouteHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return h(routeHash === '#map' ? CoopMapScreen : App);
}

// Mount React Root
const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(h(RootRouter));
}
