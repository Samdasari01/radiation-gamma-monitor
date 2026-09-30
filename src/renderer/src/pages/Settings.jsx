import React, { useState, useEffect } from 'react';

const Settings = ({ settings, onSettingsChange, connectionStatus, onConnect, onDisconnect }) => {
  const [form, setForm] = useState(settings);
  const [ports, setPorts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    setForm(settings);
    loadPorts();
  }, [settings]);

  const loadPorts = async () => {
    if (!window.electronAPI?.serial) return;
    const availablePorts = await window.electronAPI.serial.getPorts();
    setPorts(availablePorts);
  };

  const handleConnect = async () => {
    if (!form.serialPort) return;
    setConnecting(true);
    try {
      if (connectionStatus?.connected) {
        if (onDisconnect) await onDisconnect();
      } else {
        if (onConnect) await onConnect(form.serialPort, form.baudRate || '115200');
      }
    } catch (err) {
      console.error('Connection error:', err);
    }
    setConnecting(false);
  };

  const handleSave = async () => {
    if (!window.electronAPI?.settings) return;
    setSaving(true);
    await window.electronAPI.settings.save(form);
    onSettingsChange(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const Toggle = ({ value, onChange }) => (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
        value ? 'bg-blue-600' : 'bg-slate-600'
      }`}
    >
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-lg transition-transform duration-200 ${
        value ? 'translate-x-[22px]' : 'translate-x-0.5'
      }`} />
    </button>
  );

  const Section = ({ title, icon, children }) => (
    <div className="glass-card p-5 mb-4 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-700/30">
        <span className="text-base">{icon}</span>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );

  const Field = ({ label, description, children }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 gap-2">
      <div className="min-w-0">
        <label className="text-sm text-slate-300 font-medium">{label}</label>
        {description && (
          <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      <div className="w-full sm:w-52 shrink-0">{children}</div>
    </div>
  );

  const Select = ({ value, onChange, children }) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-slate-700/50 text-white rounded-xl px-3 py-2.5 text-sm border border-slate-600/50 focus:border-blue-500/50 focus:outline-none transition-colors"
    >
      {children}
    </select>
  );

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-fade-in-up">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Settings</h2>
            <p className="text-xs text-slate-500 mt-0.5">Configure your monitoring system</p>
          </div>
          {saved && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.15)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" className="w-4 h-4">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm text-emerald-400 font-medium">Saved!</span>
            </div>
          )}
        </div>

        {/* Serial Connection */}
        <Section title="Serial Connection" icon="&#128225;">
          <Field label="COM Port" description="Select your ESP32/ESP8266 port">
            <Select value={form.serialPort || ''} onChange={v => handleChange('serialPort', v)}>
              <option value="">Select Port</option>
              {ports.map(port => (
                <option key={port.path} value={port.path}>
                  {port.path} ({port.manufacturer || 'Unknown'})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Baud Rate" description="Communication speed">
            <Select value={form.baudRate || '115200'} onChange={v => handleChange('baudRate', v)}>
              {[9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600].map(rate => (
                <option key={rate} value={String(rate)}>{rate}</option>
              ))}
            </Select>
          </Field>

          <Field label="Auto-Connect" description="Connect on app startup">
            <Toggle value={!!form.autoConnect} onChange={v => handleChange('autoConnect', v)} />
          </Field>

          <div className="flex gap-2 mt-4 pt-3 border-t border-slate-700/30">
            <button
              onClick={loadPorts}
              className="px-4 py-2.5 bg-slate-700/50 text-slate-300 rounded-xl text-sm hover:bg-slate-600/50 transition-all border border-slate-600/30"
            >
              Refresh Ports
            </button>
            <button
              onClick={handleConnect}
              disabled={!form.serialPort || connecting}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 ${
                connectionStatus?.connected
                  ? 'bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25'
              }`}
            >
              {connecting ? 'Connecting...' : connectionStatus?.connected
                ? `Disconnect (${connectionStatus.port})`
                : 'Connect'}
            </button>
          </div>
        </Section>

        {/* IAEA Thresholds */}
        <Section title="IAEA Thresholds" icon="&#9888;">
          <Field label="Normal" description="< This value = Green">
            <input type="number" step="0.1" value={form.doseNormal || 0.5}
              onChange={e => handleChange('doseNormal', parseFloat(e.target.value))}
              className="w-full bg-slate-700/50 text-emerald-400 rounded-xl px-3 py-2.5 text-sm border border-slate-600/50 focus:border-emerald-500/50 focus:outline-none font-mono" />
          </Field>
          <Field label="Elevated" description="Yellow zone threshold">
            <input type="number" step="0.1" value={form.doseElevated || 2.0}
              onChange={e => handleChange('doseElevated', parseFloat(e.target.value))}
              className="w-full bg-slate-700/50 text-yellow-400 rounded-xl px-3 py-2.5 text-sm border border-slate-600/50 focus:border-yellow-500/50 focus:outline-none font-mono" />
          </Field>
          <Field label="Caution" description="Orange zone threshold">
            <input type="number" step="0.1" value={form.doseCaution || 10.0}
              onChange={e => handleChange('doseCaution', parseFloat(e.target.value))}
              className="w-full bg-slate-700/50 text-orange-400 rounded-xl px-3 py-2.5 text-sm border border-slate-600/50 focus:border-orange-500/50 focus:outline-none font-mono" />
          </Field>
          <Field label="Warning" description="Red zone threshold">
            <input type="number" step="1" value={form.doseWarning || 100.0}
              onChange={e => handleChange('doseWarning', parseFloat(e.target.value))}
              className="w-full bg-slate-700/50 text-red-400 rounded-xl px-3 py-2.5 text-sm border border-slate-600/50 focus:border-red-500/50 focus:outline-none font-mono" />
          </Field>
        </Section>

        {/* Data Logging */}
        <Section title="Data Logging" icon="&#128190;">
          <Field label="Auto-Log" description="Automatically save readings to database">
            <Toggle value={!!form.autoLogEnabled} onChange={v => handleChange('autoLogEnabled', v)} />
          </Field>
          <Field label="Log Interval" description="How often to save readings">
            <Select value={form.logInterval || 1000} onChange={v => handleChange('logInterval', parseInt(v))}>
              <option value={500}>500ms</option>
              <option value={1000}>1 second</option>
              <option value={2000}>2 seconds</option>
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
              <option value={30000}>30 seconds</option>
            </Select>
          </Field>
        </Section>

        {/* Map */}
        <Section title="Map Settings" icon="&#127758;">
          <Field label="Show Trail" description="Display path on map">
            <Toggle value={!!form.showTrail} onChange={v => handleChange('showTrail', v)} />
          </Field>
          <Field label="Default Zoom">
            <div className="w-full">
              <input type="range" min="5" max="20" value={form.mapZoom || 15}
                onChange={e => handleChange('mapZoom', parseInt(e.target.value))}
                className="w-full accent-blue-500" />
              <span className="text-[11px] text-slate-500 mt-1 block">Zoom: {form.mapZoom || 15}</span>
            </div>
          </Field>
        </Section>

        {/* Units */}
        <Section title="Display Units" icon="&#128200;">
          <Field label="Temperature Unit">
            <Select value={form.temperatureUnit || 'C'} onChange={v => handleChange('temperatureUnit', v)}>
              <option value="C">Celsius</option>
              <option value="F">Fahrenheit</option>
            </Select>
          </Field>
          <Field label="Dose Rate Unit">
            <Select value={form.doseUnit || 'microSv'} onChange={v => handleChange('doseUnit', v)}>
              <option value="microSv">µSv/h</option>
              <option value="milliSv">mSv/h</option>
              <option value="mR">mR/h</option>
            </Select>
          </Field>
        </Section>

        {/* Alerts */}
        <Section title="Alerts" icon="&#128680;">
          <Field label="Alerts Enabled" description="Audio/visual alerts when threshold exceeded">
            <Toggle value={!!form.alertEnabled} onChange={v => handleChange('alertEnabled', v)} />
          </Field>
          <Field label="Alert Threshold" description="Trigger alarm above this (µSv/h)">
            <input type="number" step="0.1" value={form.alertThreshold || 10.0}
              onChange={e => handleChange('alertThreshold', parseFloat(e.target.value))}
              className="w-full bg-slate-700/50 text-red-400 rounded-xl px-3 py-2.5 text-sm border border-slate-600/50 focus:border-red-500/50 focus:outline-none font-mono" />
          </Field>
        </Section>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 mb-10 animate-fade-in-up">
          <button onClick={() => setForm(settings)}
            className="px-6 py-2.5 bg-slate-700/50 text-slate-300 rounded-xl text-sm hover:bg-slate-600/50 transition-all border border-slate-600/30">
            Reset
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
