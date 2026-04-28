import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Buffer } from 'buffer';

window.Buffer = window.Buffer || Buffer;
import App from './App';
import './styles/app.css';

function SplashScreen() {
  return (
    <div className="app-splash">
      <div className="app-splash__content">
        <img
          src="../../../resources/Postgres Manager Logo with Elephant Icon.png"
          alt="Postgres Manager"
          className="app-splash__logo"
        />
        <h1 className="app-splash__title">Postgres Manager</h1>
        <p className="app-splash__subtitle">Loading your workspace...</p>
      </div>
    </div>
  );
}

function Root() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
