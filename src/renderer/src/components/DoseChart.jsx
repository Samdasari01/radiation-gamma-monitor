import React, { useRef, useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
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
      <p className="text-[11px] text-slate-400 mb-1">{payload[0]?.payload?.time}</p>
      <p className="text-sm font-bold font-mono text-emerald-400">
        {payload[0]?.value?.toFixed(4)} µSv/h
      </p>
    </div>
  );
};

const DoseChart = ({ readings }) => {
  const chartData = readings
    .slice(-200)
    .map((r, i) => ({
      index: i,
      doseRate: r.doseRate || 0,
      time: r.timestamp
        ? new Date(r.timestamp).toLocaleTimeString()
        : ''
    }));

  const maxDose = Math.max(...chartData.map(d => d.doseRate), 0.5);

  return (
    <div className="w-full h-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="doseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
              <stop offset="50%" stopColor="#22c55e" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#86efac" />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.3)" />

          <XAxis
            dataKey="index"
            stroke="transparent"
            fontSize={9}
            tickLine={false}
            tick={{ fill: '#475569' }}
            tickFormatter={(val) => {
              const item = chartData[val];
              return item?.time?.split(':').slice(0, 2).join(':') || '';
            }}
            interval="preserveStartEnd"
          />

          <YAxis
            stroke="transparent"
            fontSize={9}
            tickLine={false}
            tick={{ fill: '#475569' }}
            axisLine={false}
            domain={[0, maxDose * 1.3]}
          />

          <Tooltip content={<CustomTooltip />} />

          <ReferenceArea y1={0} y2={0.5} fill="rgba(34, 197, 94, 0.03)" />
          <ReferenceArea y1={0.5} y2={2.0} fill="rgba(234, 179, 8, 0.03)" />
          <ReferenceArea y1={2.0} y2={10.0} fill="rgba(249, 115, 22, 0.03)" />

          <ReferenceLine y={0.5} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.4} />
          <ReferenceLine y={2.0} stroke="#eab308" strokeDasharray="4 4" strokeOpacity={0.4} />
          <ReferenceLine y={10.0} stroke="#f97316" strokeDasharray="4 4" strokeOpacity={0.4} />

          <Area
            type="monotone"
            dataKey="doseRate"
            stroke="url(#lineGradient)"
            strokeWidth={2}
            fill="url(#doseGradient)"
            dot={false}
            activeDot={{
              r: 5,
              fill: '#22c55e',
              stroke: 'rgba(34, 197, 94, 0.3)',
              strokeWidth: 6,
              style: { filter: 'drop-shadow(0 0 8px rgba(34,197,94,0.5))' }
            }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DoseChart;
