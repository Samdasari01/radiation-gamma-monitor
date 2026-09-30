import React, { useState, useEffect, useRef, useCallback } from 'react';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Charts from './pages/Charts';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';
import alarmSystem from './utils/alarmSystem';
import { getDoseSeverity } from './utils/iaeaScale';

const api = window.electronAPI;

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [currentData, setCurrentData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false, port: null
  });
  const [readings, setReadings] = useState([]);
  const [settings, setSettings] = useState({});
  const [alarmMuted, setAlarmMuted] = useState(false);
  const [alarmSeverity, setAlarmSeverity] = useState(-1);
  const [flashActive, setFlashActive] = useState(false);
  const alarmInitRef = useRef(false);

  useEffect(() => {
    if (!api) return;
    api.settings.get().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    if (!api) return;

    const handleData = (data) => {
      setCurrentData(data);
      setReadings(prev => [...prev.slice(-500), data]);
    };

    const handleStatus = (status) => {
      setConnectionStatus(status);
    };

    api.serial.onData(handleData);
    api.serial.onConnectionChange(handleStatus);

    return () => {};
  }, []);

  useEffect(() => {
    if (!api || !settings.serialPort) return;
    if (settings.autoConnect && !connectionStatus.connected) {
      api.serial.connect(settings.serialPort, settings.baudRate || '115200').catch(() => {});
    }
  }, [settings]);

  useEffect(() => {
    if (!api || !currentData || !settings.autoLogEnabled) return;

    const interval = setInterval(() => {
      api.database.insertReading({
        ...currentData,
        sessionId: currentData.sessionId || null
      });
    }, settings.logInterval || 1000);

    return () => clearInterval(interval);
  }, [currentData, settings]);

  // Initialize alarm system on first user interaction
  const initAlarm = useCallback(() => {
    if (alarmInitRef.current) return;
    alarmInitRef.current = true;
    alarmSystem.init();
    alarmSystem.onSeverityChange = (sev) => {
      setAlarmSeverity(sev);
    };
    alarmSystem.onMuteChange = (muted) => {
      setAlarmMuted(muted);
    };
  }, []);

  // Monitor dose rate and update alarm
  useEffect(() => {
    if (!alarmInitRef.current || !settings.alertEnabled) {
      if (alarmSystem.currentSeverity > 0) {
        alarmSystem.updateSeverity(0);
      }
      return;
    }

    const doseRate = currentData?.doseRate || 0;
    const thresholds = {
      normal: settings.doseNormal || 0.5,
      elevated: settings.doseElevated || 2.0,
      caution: settings.doseCaution || 10.0,
      warning: settings.doseWarning || 100.0
    };

    // Also check the dedicated alert threshold
    const alertThreshold = settings.alertThreshold || 10.0;

    let severity;
    if (doseRate >= thresholds.warning || doseRate >= alertThreshold * 5) {
      severity = 4; // Critical siren
    } else if (doseRate >= thresholds.caution || doseRate >= alertThreshold * 2) {
      severity = 3; // Wailing alarm
    } else if (doseRate >= thresholds.elevated || doseRate >= alertThreshold) {
      severity = 2; // Urgent beep
    } else if (doseRate >= thresholds.normal) {
      severity = 1; // Warning beep
    } else {
      severity = 0; // Normal - silent
    }

    alarmSystem.updateSeverity(severity);

    // Flash effect for severity >= 2
    if (severity >= 2) {
      setFlashActive(true);
      setTimeout(() => setFlashActive(false), 300);
    }
  }, [currentData, settings]);

  const handleToggleMute = useCallback(() => {
    if (!alarmInitRef.current) {
      initAlarm();
    }
    alarmSystem.toggleMute();
  }, [initAlarm]);

  const handleConnect = async (port, baudRate) => {
    if (!api) return;
    initAlarm();
    await api.serial.connect(port, baudRate);
  };

  const handleDisconnect = async () => {
    if (!api) return;
    await api.serial.disconnect();
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard currentData={currentData} readings={readings} settings={settings} />;
      case 'history':
        return <History />;
      case 'charts':
        return <Charts readings={readings} currentData={currentData} />;
      case 'settings':
        return (
          <Settings
            settings={settings}
            onSettingsChange={setSettings}
            connectionStatus={connectionStatus}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        );
      default:
        return <Dashboard currentData={currentData} readings={readings} settings={settings} />;
    }
  };

  return (
    <div className="flex h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0f1a 0%, #0c1222 50%, #0d1117 100%)' }}>

      {/* Alarm visual flash overlay */}
      {flashActive && alarmSeverity >= 3 && (
        <div className="absolute inset-0 z-50 pointer-events-none"
          style={{
            background: alarmSeverity >= 4
              ? 'radial-gradient(ellipse at center, rgba(239,68,68,0.15), transparent 70%)'
              : 'radial-gradient(ellipse at center, rgba(249,115,22,0.1), transparent 70%)',
            animation: 'flash 0.3s ease-out'
          }} />
      )}

      {/* Background ambient effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.02]"
          style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)' }} />
      </div>

      {/* Sidebar */}
      <div className="relative z-10 shrink-0">
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          connectionStatus={connectionStatus}
          currentData={currentData}
          alarmMuted={alarmMuted}
          alarmSeverity={alarmSeverity}
          onToggleMute={handleToggleMute}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-hidden relative z-10">
        {renderPage()}
      </main>

      <style>{`
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default App;
