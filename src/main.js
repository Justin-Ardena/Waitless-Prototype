// Entry point

ReactDOM.createRoot(document.getElementById('root')).render(h(location.hash==='#map'?CoopMapScreen:App));
