import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
  AreaChart, Area, ReferenceArea
} from 'recharts';
import { getAllLevels } from '../utils/iaeaScale';

const Charts = ({ readings, currentData }) => {
  const [timeRange, setTimeRange] = useState('5m');
  const [chartType, setChartType] = useState('area');

  const getTimeRangeData = () => {
    const now = Date.now();
    let cutoff;
    switch (timeRange) {
      case '1m': cutoff = now - 60 * 1000; break;
      case '5m': cutoff = now - 5 * 60 * 1000; break;
      case '15m': cutoff = now - 15 * 60 * 1000; break;
      case '1h': cutoff = now - 60 * 60 * 1000; break;
      case 'all': default: cutoff = 0;
    }
    return readings.filter(r => {
      if (!r.timestamp) return true;
      return new Date(r.timestamp).getTime() >= cutoff;
    });
  };

  const filteredData = getTimeRangeData().map((r, i) => ({
    index: i,
    doseRate: r.doseRate || 0,
    cpm: r.cpm || 0,
    temperature: r.temperature || 0,
    humidity: r.humidity || 0,
    time: r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : ''
  }));

  const maxDose = Math.max(...filteredData.map(d => d.doseRate), 0.5);
  const levels = getAllLevels();

  const ChartTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(100, 116, 139, 0.2)',
        borderRadius: '12px',
        padding: '10px 14px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
      }}>
        <p className="text-[10px] text-slate-500 mb-1.5">{payload[0]?.payload?.time}</p>
        {payload.map((entry, idx) => (
          <p key={idx} className="text-xs font-mono font-bold" style={{ color: entry.color }}>
            {entry.value?.toFixed(4)} <span className="font-normal text-slate-500">{entry.name}</span>
          </p>
        ))}
      </div>
    );
  };

  const timeButtons = [
    { val: '1m', label: '1m' },
    { val: '5m', label: '5m' },
    { val: '15m', label: '15m' },
    { val: '1h', label: '1h' },
    { val: 'all', label: 'All' },
  ];

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 animate-fade-in-up">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">Dose rate trends and environmental data</p>
        </div>
        <div className="flex gap-2">
          {/* Time range pills */}
          <div className="flex rounded-xl overflow-hidden border border-slate-700/40">
            {timeButtons.map(btn => (
              <button key={btn.val}
                onClick={() => setTimeRange(btn.val)}
                className={`px-3 py-1.5 text-xs font-semibold transition-all ${
                  timeRange === btn.val
                    ? 'bg-blue-600/80 text-white'
                    : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}>
                {btn.label}
              </button>
            ))}
          </div>
          {/* Chart type toggle */}
          <div className="flex rounded-xl overflow-hidden border border-slate-700/40">
            <button onClick={() => setChartType('area')}
              className={`px-3 py-1.5 text-xs font-semibold transition-all ${
                chartType === 'area' ? 'bg-purple-600/80 text-white' : 'bg-slate-800/50 text-slate-400 hover:text-white'
              }`}>
              Area
            </button>
            <button onClick={() => setChartType('line')}
              className={`px-3 py-1.5 text-xs font-semibold transition-all ${
                chartType === 'line' ? 'bg-purple-600/80 text-white' : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}>
              Line
            </button>
          </div>
        </div>
      </div>

      {/* Dose Rate Chart */}
      <div className="flex-1 glass-card p-4 min-h-[300px] animate-fade-in-up stagger-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Dose Rate</h3>
          <span className="text-[10px] text-slate-500 font-mono ml-auto">µSv/h</span>
        </div>
        <div style={{ height: 'calc(100% - 30px)' }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={filteredData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="chartDoseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.2)" />
                <XAxis dataKey="index" stroke="transparent" fontSize={9} tick={{ fill: '#475569' }} tickLine={false}
                  tickFormatter={v => filteredData[v]?.time?.split(':').slice(0,2).join(':') || ''} interval="preserveStartEnd" />
                <YAxis stroke="transparent" fontSize={9} tick={{ fill: '#475569' }} tickLine={false} axisLine={false} domain={[0, maxDose * 1.3]} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceArea y1={0} y2={0.5} fill="rgba(34,197,94,0.02)" />
                <ReferenceArea y1={0.5} y2={2} fill="rgba(234,179,8,0.02)" />
                <ReferenceLine y={0.5} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.3} />
                <ReferenceLine y={2} stroke="#eab308" strokeDasharray="4 4" strokeOpacity={0.3} />
                <ReferenceLine y={10} stroke="#f97316" strokeDasharray="4 4" strokeOpacity={0.3} />
                <Area type="monotone" dataKey="doseRate" stroke="#22c55e" fill="url(#chartDoseGrad)" strokeWidth={2} dot={false} name="Dose" />
              </AreaChart>
            ) : (
              <LineChart data={filteredData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.2)" />
                <XAxis dataKey="index" stroke="transparent" fontSize={9} tick={{ fill: '#475569' }} tickLine={false}
                  tickFormatter={v => filteredData[v]?.time?.split(':').slice(0,2).join(':') || ''} interval="preserveStartEnd" />
                <YAxis stroke="transparent" fontSize={9} tick={{ fill: '#475569' }} tickLine={false} axisLine={false} domain={[0, maxDose * 1.3]} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={0.5} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.3} />
                <ReferenceLine y={2} stroke="#eab308" strokeDasharray="4 4" strokeOpacity={0.3} />
                <ReferenceLine y={10} stroke="#f97316" strokeDasharray="4 4" strokeOpacity={0.3} />
                <Line type="monotone" dataKey="doseRate" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: '#22c55e', strokeWidth: 4 }} isAnimationActive={false} name="Dose" />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Temp + Humidity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0" style={{ height: '220px' }}>
        <div className="glass-card p-4 animate-fade-in-up stagger-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <h3 className="text-sm font-semibold text-white">Temperature</h3>
            <span className="text-[10px] text-slate-500 font-mono ml-auto">°C</span>
          </div>
          <div style={{ height: 'calc(100% - 30px)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.2)" />
                <XAxis dataKey="index" stroke="transparent" fontSize={9} tick={{ fill: '#475569' }} tickLine={false}
                  tickFormatter={v => filteredData[v]?.time?.split(':').slice(0,2).join(':') || ''} interval="preserveStartEnd" />
                <YAxis stroke="transparent" fontSize={9} tick={{ fill: '#475569' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="temperature" stroke="#f59e0b" fill="url(#tempGrad)" strokeWidth={2} dot={false} name="Temp" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-4 animate-fade-in-up stagger-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <h3 className="text-sm font-semibold text-white">Humidity</h3>
            <span className="text-[10px] text-slate-500 font-mono ml-auto">%RH</span>
          </div>
          <div style={{ height: 'calc(100% - 30px)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.2)" />
                <XAxis dataKey="index" stroke="transparent" fontSize={9} tick={{ fill: '#475569' }} tickLine={false}
                  tickFormatter={v => filteredData[v]?.time?.split(':').slice(0,2).join(':') || ''} interval="preserveStartEnd" />
                <YAxis stroke="transparent" fontSize={9} tick={{ fill: '#475569' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="humidity" stroke="#3b82f6" fill="url(#humGrad)" strokeWidth={2} dot={false} name="Humidity" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* IAEA Legend */}
      <div className="glass-card p-4 shrink-0 animate-fade-in-up stagger-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <h3 className="text-sm font-semibold text-white">IAEA Radiation Scale</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {levels.map((level, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: `${level.color}08`, border: `1px solid ${level.color}15` }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: level.color, boxShadow: `0 0 6px ${level.color}40` }} />
              <span className="text-xs text-slate-300 font-medium">{level.label}</span>
              <span className="text-[10px] text-slate-500">{level.displayRange}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Charts;
