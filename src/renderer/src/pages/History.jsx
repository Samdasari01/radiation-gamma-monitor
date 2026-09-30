import React, { useState, useEffect } from 'react';
import { getDoseColor, getDoseLabel } from '../utils/iaeaScale';

const History = () => {
  const [readings, setReadings] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    minDose: '',
    maxDose: '',
    limit: 100
  });

  useEffect(() => {
    loadReadings();
  }, []);

  const loadReadings = async () => {
    if (!window.electronAPI?.database) return;
    const query = {};
    if (filters.startDate) query.startDate = filters.startDate;
    if (filters.endDate) query.endDate = filters.endDate;
    if (filters.minDose) query.minDose = parseFloat(filters.minDose);
    if (filters.maxDose) query.maxDose = parseFloat(filters.maxDose);
    query.limit = filters.limit || 100;
    const data = await window.electronAPI.database.getReadings(query);
    setReadings(data);
  };

  const exportCSV = async () => {
    if (!window.electronAPI?.database) return;
    const csv = await window.electronAPI.database.exportCSV(filters);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `radiation-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-fade-in-up">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Data History</h2>
            <p className="text-xs text-slate-500 mt-0.5">Browse and export collected readings</p>
          </div>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#34d399'
            }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 mb-4 animate-fade-in-up stagger-1">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1.5">Start Date</label>
              <input type="datetime-local" value={filters.startDate}
                onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full bg-slate-700/40 text-white rounded-xl px-3 py-2 text-sm border border-slate-600/40 focus:border-blue-500/50 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1.5">End Date</label>
              <input type="datetime-local" value={filters.endDate}
                onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full bg-slate-700/40 text-white rounded-xl px-3 py-2 text-sm border border-slate-600/40 focus:border-blue-500/50 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1.5">Min Dose</label>
              <input type="number" value={filters.minDose} placeholder="µSv/h"
                onChange={e => setFilters(prev => ({ ...prev, minDose: e.target.value }))}
                className="w-full bg-slate-700/40 text-white rounded-xl px-3 py-2 text-sm border border-slate-600/40 focus:border-blue-500/50 focus:outline-none transition-colors font-mono" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1.5">Max Dose</label>
              <input type="number" value={filters.maxDose} placeholder="µSv/h"
                onChange={e => setFilters(prev => ({ ...prev, maxDose: e.target.value }))}
                className="w-full bg-slate-700/40 text-white rounded-xl px-3 py-2 text-sm border border-slate-600/40 focus:border-blue-500/50 focus:outline-none transition-colors font-mono" />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={loadReadings}
                className="flex-1 px-4 py-2 bg-blue-600/80 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-all">
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden animate-fade-in-up stagger-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/30">
                  <th className="text-left p-3 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Timestamp</th>
                  <th className="text-left p-3 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Dose Rate</th>
                  <th className="text-left p-3 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Level</th>
                  <th className="text-left p-3 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Temp</th>
                  <th className="text-left p-3 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Humidity</th>
                  <th className="text-left p-3 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Lat</th>
                  <th className="text-left p-3 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Lon</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((reading, i) => (
                  <tr key={i} className="border-b border-slate-700/20 hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 text-slate-400 font-mono text-xs">
                      {new Date(reading.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-mono font-bold" style={{ color: getDoseColor(reading.dose_rate) }}>
                      {reading.dose_rate?.toFixed(4)}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-lg text-[10px] font-semibold"
                        style={{
                          backgroundColor: `${getDoseColor(reading.dose_rate)}12`,
                          color: getDoseColor(reading.dose_rate),
                          border: `1px solid ${getDoseColor(reading.dose_rate)}20`
                        }}>
                        {getDoseLabel(reading.dose_rate)}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-xs">{reading.temperature?.toFixed(1)}°</td>
                    <td className="p-3 text-slate-400 font-mono text-xs">{reading.humidity?.toFixed(1)}%</td>
                    <td className="p-3 text-slate-500 font-mono text-xs">{reading.latitude?.toFixed(6) || '-'}</td>
                    <td className="p-3 text-slate-500 font-mono text-xs">{reading.longitude?.toFixed(6) || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {readings.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" className="w-6 h-6">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm text-slate-500">No readings found</p>
              <p className="text-xs text-slate-600 mt-1">Connect to ESP and start collecting data</p>
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-600 mt-3 font-medium">
          Showing {readings.length} readings
        </p>
      </div>
    </div>
  );
};

export default History;
