import React from 'react';
import MapView from '../components/MapView';
import LiveGauges from '../components/LiveGauges';
import DoseChart from '../components/DoseChart';

const Dashboard = ({ currentData, readings, settings }) => {
  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-y-auto">
      {/* Status bar */}
      <div className="flex items-center justify-between shrink-0 animate-fade-in-up">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time radiation monitoring</p>
        </div>
        {currentData?.timestamp && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.15)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-emerald-400 font-medium font-mono">
              LIVE {new Date(currentData.timestamp).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {/* Gauges */}
      <div className="shrink-0">
        <LiveGauges data={currentData} settings={settings} />
      </div>

      {/* Map + Chart */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0" style={{ minHeight: '400px' }}>
        {/* Map */}
        <div className="lg:col-span-2 glass-card overflow-hidden flex flex-col animate-fade-in-up stagger-2">
          <div className="px-4 py-3 border-b border-slate-700/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <h3 className="text-sm font-semibold text-white">Live Map</h3>
            </div>
            {currentData?.latitude && (
              <span className="text-[10px] text-slate-500 font-mono">
                {currentData.latitude.toFixed(4)}, {currentData.longitude?.toFixed(4)}
              </span>
            )}
          </div>
          <div className="flex-1 min-h-[300px]">
            <MapView
              currentReading={currentData}
              markers={readings}
              showTrail={settings?.showTrail}
              trailColor={settings?.trailColor}
              zoom={settings?.mapZoom || 15}
            />
          </div>
        </div>

        {/* Chart */}
        <div className="glass-card overflow-hidden flex flex-col animate-fade-in-up stagger-3">
          <div className="px-4 py-3 border-b border-slate-700/30 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Dose Rate</h3>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Last 200 readings</p>
          </div>
          <div className="p-2 flex-1 min-h-[300px]">
            <DoseChart readings={readings} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
