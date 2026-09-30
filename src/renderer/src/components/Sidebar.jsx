import React from 'react';

const Sidebar = ({ activePage, onNavigate, connectionStatus, currentData, alarmMuted, alarmSeverity, onToggleMute }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="4" rx="1.5" />
        <rect x="14" y="10" width="7" height="11" rx="1.5" />
        <rect x="3" y="13" width="7" height="8" rx="1.5" />
      </svg>
    )},
    { id: 'charts', label: 'Analytics', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M3 20h18" /><path d="M5 16l4-5 4 3 6-8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )},
    { id: 'history', label: 'History', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    )},
    { id: 'settings', label: 'Settings', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" />
      </svg>
    )},
  ];

  const doseRate = currentData?.doseRate || 0;

  let doseColor = '#22c55e';
  let neonClass = 'neon-green';
  if (doseRate >= 100) { doseColor = '#991b1b'; neonClass = 'neon-red'; }
  else if (doseRate >= 10) { doseColor = '#ef4444'; neonClass = 'neon-red'; }
  else if (doseRate >= 2) { doseColor = '#f97316'; neonClass = 'neon-orange'; }
  else if (doseRate >= 0.5) { doseColor = '#eab308'; neonClass = 'neon-yellow'; }

  const isConnected = connectionStatus?.connected;

  const alarmColors = {
    '-1': '#64748b',
    '0': '#22c55e',
    '1': '#eab308',
    '2': '#f97316',
    '3': '#ef4444',
    '4': '#dc2626'
  };

  const alarmLabels = {
    '-1': 'Inactive',
    '0': 'Normal',
    '1': 'Warning',
    '2': 'Caution',
    '3': 'Alert',
    '4': 'CRITICAL'
  };

  const alarmColor = alarmColors[String(alarmSeverity)] || '#64748b';
  const alarmLabel = alarmLabels[String(alarmSeverity)] || 'Inactive';

  return (
    <aside className="w-16 lg:w-60 h-full flex flex-col relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(8, 15, 30, 0.98) 100%)',
        borderRight: '1px solid rgba(100, 116, 139, 0.12)'
      }}>

      {/* Ambient gradient blob */}
      <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3), transparent 70%)' }} />

      {/* Logo */}
      <div className="relative p-4 lg:p-5 border-b border-slate-700/40">
        <div className="hidden lg:flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(16,185,129,0.2))',
                border: '1px solid rgba(59,130,246,0.3)'
              }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5" style={{ color: '#60a5fa' }}>
                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                <path d="M12 2a10 10 0 0 1 0 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M12 2a10 10 0 0 0-5 8.66" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M12 2a10 10 0 0 0 5 8.66" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            {isConnected && (
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2"
                style={{ borderColor: 'rgba(8,15,30,0.98)' }}>
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ring-pulse" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white leading-tight tracking-tight">ARGM</h1>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium tracking-wider uppercase">Radiation Monitor</p>
          </div>
        </div>
        <div className="lg:hidden flex justify-center">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(16,185,129,0.2))',
              border: '1px solid rgba(59,130,246,0.3)'
            }}>
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" style={{ color: '#60a5fa' }}>
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              <path d="M12 2a10 10 0 0 1 0 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 2a10 10 0 0 0-5 8.66" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 2a10 10 0 0 0 5 8.66" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Dose Rate Display */}
      <div className="px-4 lg:px-5 py-4 border-b border-slate-700/40">
        <div className="hidden lg:block">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-medium">Live Dose Rate</p>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-3xl font-black font-mono tracking-tight ${neonClass}`}
              style={{ color: doseColor }}>
              {doseRate < 1 ? doseRate.toFixed(3) : doseRate.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 font-medium">µSv/h</span>
          </div>
          <div className="mt-2 h-1 rounded-full overflow-hidden bg-slate-800">
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min((doseRate / 10) * 100, 100)}%`,
                background: `linear-gradient(90deg, ${doseColor}80, ${doseColor})`,
                boxShadow: `0 0 12px ${doseColor}60`
              }} />
          </div>
        </div>
        <div className="lg:hidden text-center">
          <span className={`text-lg font-black font-mono ${neonClass}`} style={{ color: doseColor }}>
            {doseRate < 1 ? doseRate.toFixed(3) : doseRate.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Alarm Status + Mute */}
      <div className="px-4 lg:px-5 py-3 border-b border-slate-700/40">
        <div className="hidden lg:block">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Alarm</p>
            <button
              onClick={onToggleMute}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                alarmSeverity >= 2 && !alarmMuted
                  ? 'animate-glow-pulse'
                  : ''
              }`}
              style={{
                background: alarmMuted
                  ? 'rgba(100, 116, 139, 0.1)'
                  : `${alarmColor}15`,
                border: `1px solid ${alarmMuted ? 'rgba(100,116,139,0.15)' : `${alarmColor}25`}`,
                color: alarmMuted ? '#64748b' : alarmColor
              }}>
              {/* Sound icon */}
              {alarmMuted ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" strokeLinecap="round" />
                </svg>
              )}
              {alarmMuted ? 'MUTED' : alarmLabel}
            </button>
          </div>
          {/* Mini severity bar */}
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="flex-1 h-1 rounded-full transition-all duration-500"
                style={{
                  background: alarmSeverity >= i ? alarmColors[String(Math.max(alarmSeverity, 1))] : 'rgba(51,65,85,0.3)',
                  boxShadow: alarmSeverity >= i && alarmSeverity >= 2 ? `0 0 6px ${alarmColor}40` : 'none'
                }} />
            ))}
          </div>
        </div>
        {/* Mobile */}
        <div className="lg:hidden flex justify-center">
          <button onClick={onToggleMute} className="p-2 rounded-lg transition-all"
            style={{
              background: alarmMuted ? 'rgba(100,116,139,0.1)' : `${alarmColor}15`,
              border: `1px solid ${alarmMuted ? 'rgba(100,116,139,0.15)' : `${alarmColor}25`}`,
              color: alarmMuted ? '#64748b' : alarmColor
            }}>
            {alarmMuted ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M11 5L6 9H2v6h4l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M11 5L6 9H2v6h4l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="px-4 lg:px-5 py-3 border-b border-slate-700/40">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
            {isConnected && (
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ring-pulse" />
            )}
          </div>
          <span className="text-[11px] text-slate-400 hidden lg:inline font-medium">
            {isConnected ? connectionStatus.port : 'No connection'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2.5 lg:p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group relative ${
                isActive
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
              style={isActive ? {
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))',
                border: '1px solid rgba(59,130,246,0.2)'
              } : { border: '1px solid transparent' }}>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{ background: 'linear-gradient(180deg, #3b82f6, #8b5cf6)' }} />
              )}
              <span className={`shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                {item.icon}
              </span>
              <span className="hidden lg:inline text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Version */}
      <div className="p-4 lg:p-5 border-t border-slate-700/30">
        <div className="hidden lg:block text-center">
          <p className="text-[10px] text-slate-600 font-medium tracking-wider">ARGM v1.0.0</p>
          <p className="text-[9px] text-slate-700 mt-0.5">Advanced Radiation Gamma Monitor</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
