import React, { useEffect, useState, useRef } from 'react';
import { getDoseColor, getDoseLabel, getDoseLevel } from '../utils/iaeaScale';

const ArcGauge = ({ value, max, color, label, unit, icon, delay = 0, decimals = 2 }) => {
  const [animated, setAnimated] = useState(0);
  const animRef = useRef(null);

  useEffect(() => {
    const start = animated;
    const end = Math.min(value / max, 1);
    const duration = 800;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimated(start + (end - start) * eased);
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [value, max]);

  const circumference = Math.PI * 42;
  const strokeDashoffset = circumference * (1 - animated);
  const percentage = (value / max) * 100;

  return (
    <div className="glass-card p-5 animate-fade-in-up group hover:scale-[1.02] transition-transform duration-300 flex flex-col h-full"
      style={{ animationDelay: `${delay}s` }}>

      {/* Header row: icon + label */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base opacity-60">{icon}</span>
        <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">{label}</p>
      </div>

      {/* Arc gauge centered */}
      <div className="flex-1 flex items-center justify-center relative min-h-[60px]">
        <svg width="100" height="60" viewBox="0 0 100 60">
          <path d="M 8 55 A 42 42 0 0 1 92 55" fill="none" stroke="rgba(51, 65, 85, 0.4)" strokeWidth="6" strokeLinecap="round" />
          <path d="M 8 55 A 42 42 0 0 1 92 55" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            style={{ filter: `drop-shadow(0 0 8px ${color}80)`, transition: 'stroke 0.5s ease' }} />
          {animated > 0.01 && (
            <circle cx={8 + 84 * animated} cy={55 - Math.sin(Math.PI * animated) * 42} r="4" fill={color}
              style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
          )}
        </svg>
      </div>

      {/* Value + unit */}
      <div className="mt-2">
        <p className="text-2xl font-black font-mono tracking-tight leading-none" style={{ color }}>
          {typeof value === 'number' ? value.toFixed(decimals) : '0.00'}
        </p>
        <p className="text-[11px] text-slate-500 mt-1 font-medium">{unit}</p>
      </div>
    </div>
  );
};

const LiveGauges = ({ data, settings }) => {
  const doseRate = data?.doseRate || 0;
  const cpm = data?.cpm || 0;
  const temperature = data?.temperature || 0;
  const humidity = data?.humidity || 0;
  const satellites = data?.satellites || 0;

  const doseLevel = getDoseLevel(doseRate);
  const doseColor = getDoseColor(doseRate);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 items-stretch">
      {/* Dose Rate card */}
      <div className="col-span-2 lg:col-span-1 glass-card glow-border p-5 animate-fade-in-up relative overflow-hidden flex flex-col h-full">
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 pointer-events-none"
          style={{ background: `radial-gradient(circle, ${doseColor}, transparent 70%)` }} />

        <div className="relative flex flex-col h-full">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0"
              style={{ background: `${doseColor}15` }}>
              <span style={{ color: doseColor }}>&#9762;</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Dose Rate</p>
              <p className="text-[10px] font-medium" style={{ color: doseColor }}>{doseLevel.label}</p>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <p className="text-4xl font-black font-mono tracking-tight leading-none"
              style={{ color: doseColor }}>
              {doseRate.toFixed(4)}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 font-medium mb-2">µSv/h</p>
            <div className="h-1.5 rounded-full overflow-hidden bg-slate-800/80">
              <div className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.min(doseRate * 10, 100)}%`,
                  background: `linear-gradient(90deg, ${doseColor}60, ${doseColor})`,
                  boxShadow: `0 0 16px ${doseColor}40`
                }} />
            </div>
          </div>
        </div>
      </div>

      {/* CPM */}
      <ArcGauge value={cpm} max={1000} color="#8b5cf6" label="CPM" unit="Counts/min"
        icon="&#128200;" delay={0.05} decimals={0} />

      {/* Temperature */}
      <ArcGauge value={Math.abs(temperature)} max={60} color="#f59e0b" label="Temperature"
        unit={settings?.temperatureUnit === 'F' ? '°F' : '°C'}
        icon="&#127777;" delay={0.1} decimals={1} />

      {/* Humidity */}
      <ArcGauge value={humidity} max={100} color="#3b82f6" label="Humidity" unit="%RH"
        icon="&#128167;" delay={0.15} decimals={1} />

      {/* Satellites */}
      <ArcGauge value={satellites} max={12} color="#10b981" label="Satellites" unit="GPS Fix"
        icon="&#128225;" delay={0.2} decimals={0} />
    </div>
  );
};

export default LiveGauges;
