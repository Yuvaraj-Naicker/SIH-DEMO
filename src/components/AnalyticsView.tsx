import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  CloudRain,
  Droplets,
  ShieldAlert,
  Radio,
  Calendar,
  Layers,
  ArrowDownRight,
} from 'lucide-react';
import { LocationConfig } from '../types';
import { useTheme } from '../context/ThemeContext';
import BorderGlow from './BorderGlow';

interface AnalyticsViewProps {
  location: LocationConfig;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ location }) => {
  const { isDarkMode } = useTheme();
  const [timeframe, setTimeframe] = useState<'6h' | '24h' | '7d' | '30d'>('24h');
  const { analyticsData } = location;

  // Max rainfall value for scale
  const maxRain = Math.max(
    ...analyticsData.rainfallTimeline.map((r) => Math.max(r.mm, r.baseline)),
    40
  );

  // Max water level value for scale
  const maxWater = Math.max(
    ...analyticsData.waterLevelTimeline.map((w) => Math.max(w.level, w.dangerMark)),
    10
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Analytics Header */}
      <BorderGlow
        edgeSensitivity={30}
        glowColor="40 80 80"
        backgroundColor={isDarkMode ? '#120F17' : '#ffffff'}
        borderRadius={24}
        glowRadius={40}
        glowIntensity={1.0}
        coneSpread={25}
        animated={false}
        colors={['#c084fc', '#f472b6', '#38bdf8']}
        className="w-full"
      >
        <div
          className={`rounded-xl border p-5 transition-all ${
            isDarkMode
              ? 'bg-slate-900/80 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900 shadow-xs'
          }`}
        >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className={`w-4 h-4 ${isDarkMode ? 'text-cyan-400' : 'text-teal-700'}`} />
              <h2 className="text-base font-bold">
                Hydrometeorological Analytics — {location.name}
              </h2>
            </div>
            <p className="text-xs opacity-70 mt-1 max-w-3xl">
              Temporal correlation of precipitation rates, watershed discharge hydrographs, hazard scores, and mesh telemetry delivery ratios.
            </p>
          </div>

          {/* Timeframe Selector */}
          <div
            className={`flex rounded-lg border overflow-hidden text-xs ${
              isDarkMode ? 'border-slate-700' : 'border-slate-300'
            }`}
          >
            {(['6h', '24h', '7d', '30d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 font-medium transition-colors border-r last:border-r-0 ${
                  timeframe === tf
                    ? isDarkMode
                      ? 'bg-cyan-950 text-cyan-300 font-bold'
                      : 'bg-slate-900 text-white'
                    : isDarkMode
                    ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>
    </BorderGlow>

    {/* Primary Visual Charts Grid */}
    <BorderGlow
      edgeSensitivity={30}
      glowColor="40 80 80"
      backgroundColor={isDarkMode ? '#120F17' : '#ffffff'}
      borderRadius={24}
      glowRadius={40}
      glowIntensity={1.0}
      coneSpread={25}
      animated={false}
      colors={['#c084fc', '#f472b6', '#38bdf8']}
      className="w-full"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-4">
        {/* Chart 1: Rainfall vs Baseline Precipitation */}
        <div
          className={`rounded-xl border p-5 transition-all ${
            isDarkMode
              ? 'bg-slate-900/80 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-4 border-b border-current/10 pb-3">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <CloudRain className={`w-4 h-4 ${isDarkMode ? 'text-cyan-400' : 'text-teal-700'}`} />
                <span>Precipitation Timeline & Baseline</span>
              </h3>
              <p className="text-xs opacity-60">Measured in mm per hourly observation window</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-xs bg-cyan-500 inline-block" />
                <span className="opacity-70">Observed Rain</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-amber-400 inline-block border-t border-dashed border-amber-400" />
                <span className="opacity-70">Monsoon Norm</span>
              </div>
            </div>
          </div>

          {/* Bar / Column Chart */}
          <div className="h-60 flex items-end gap-2 sm:gap-3 pt-6 px-2 border-b border-current/20">
            {analyticsData.rainfallTimeline.map((item, index) => {
              const heightPct = Math.min(100, Math.round((item.mm / maxRain) * 100));
              const baselinePct = Math.min(100, Math.round((item.baseline / maxRain) * 100));

              return (
                <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div
                    className={`absolute -top-10 scale-0 group-hover:scale-100 transition-transform rounded px-2 py-1 text-[10px] font-mono shadow-md z-10 whitespace-nowrap pointer-events-none border ${
                      isDarkMode ? 'bg-slate-950 text-cyan-300 border-slate-700' : 'bg-slate-900 text-white'
                    }`}
                  >
                    {item.time}: {item.mm} mm (Norm: {item.baseline}mm)
                  </div>

                  {/* Baseline indicator tick */}
                  <div
                    className="absolute w-full border-t-2 border-amber-400 border-dashed z-0 opacity-60"
                    style={{ bottom: `${baselinePct}%` }}
                  />

                  {/* Main bar */}
                  <div
                    className="w-full rounded-t-sm transition-all duration-300 relative z-10 bg-cyan-500 group-hover:bg-cyan-400 shadow-sm"
                    style={{ height: `${Math.max(4, heightPct)}%` }}
                  />
                  <span className="text-[10px] opacity-60 font-mono mt-2 truncate w-full text-center">
                    {item.time}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs opacity-60 mt-3 pt-1">
            <span>Minimum: 0.0 mm</span>
            <span className={`font-mono font-bold ${isDarkMode ? 'text-cyan-400' : 'text-teal-700'}`}>
              Peak: {maxRain} mm/h
            </span>
          </div>
        </div>

        {/* Chart 2: Water Stage Level vs Critical Danger Mark */}
        <div
          className={`rounded-xl border p-5 transition-all ${
            isDarkMode
              ? 'bg-slate-900/80 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-4 border-b border-current/10 pb-3">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-blue-400" />
                <span>Water Discharge Stage & Danger Threshold</span>
              </h3>
              <p className="text-xs opacity-60">Catchment river stage elevation in meters</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-xs bg-blue-500 inline-block" />
                <span className="opacity-70">Stage (m)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-red-500 inline-block border-t border-red-500" />
                <span className="text-red-400 font-medium">Danger Mark</span>
              </div>
            </div>
          </div>

          {/* Water Stage Line Chart simulation */}
          <div className="h-60 flex items-end gap-2 sm:gap-3 pt-6 px-2 border-b border-current/20 relative">
            {/* Danger mark line across chart */}
            {analyticsData.waterLevelTimeline.length > 0 && (
              <div
                className="absolute left-0 right-0 border-t-2 border-red-500 border-dashed z-0 flex items-center justify-end pr-2 pointer-events-none"
                style={{
                  bottom: `${Math.round(
                    (analyticsData.waterLevelTimeline[0].dangerMark / maxWater) * 100
                  )}%`,
                }}
              >
                <span className="text-[9px] font-bold font-mono text-red-400 bg-red-950/80 px-1 rounded border border-red-800">
                  DANGER: {analyticsData.waterLevelTimeline[0].dangerMark}m
                </span>
              </div>
            )}

            {analyticsData.waterLevelTimeline.map((item, index) => {
              const heightPct = Math.min(100, Math.round((item.level / maxWater) * 100));
              const isOverDanger = item.level >= item.dangerMark;

              return (
                <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  <div
                    className={`absolute -top-10 scale-0 group-hover:scale-100 transition-transform rounded px-2 py-1 text-[10px] font-mono shadow-md z-10 whitespace-nowrap pointer-events-none border ${
                      isDarkMode ? 'bg-slate-950 text-blue-300 border-slate-700' : 'bg-slate-900 text-white'
                    }`}
                  >
                    {item.time}: {item.level} m (Danger: {item.dangerMark}m)
                  </div>

                  <div
                    className={`w-full rounded-t-sm transition-all duration-300 relative z-10 ${
                      isOverDanger ? 'bg-red-500 shadow-red-500/30' : 'bg-blue-500 group-hover:bg-blue-400'
                    }`}
                    style={{ height: `${Math.max(6, heightPct)}%` }}
                  />
                  <span className="text-[10px] opacity-60 font-mono mt-2 truncate w-full text-center">
                    {item.time}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs opacity-60 mt-3 pt-1">
            <span>Hydrometric datum: MSL</span>
            <span className="font-mono font-bold text-blue-400">Peak Stage: {maxWater} m</span>
          </div>
        </div>
      </div>
    </BorderGlow>

    {/* Network Performance & Composite Score Summary Strip */}
    <BorderGlow
      edgeSensitivity={30}
      glowColor="40 80 80"
      backgroundColor={isDarkMode ? '#120F17' : '#ffffff'}
      borderRadius={24}
      glowRadius={40}
      glowIntensity={1.0}
      coneSpread={25}
      animated={false}
      colors={['#c084fc', '#f472b6', '#38bdf8']}
      className="w-full"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        <div
          className={`rounded-xl border p-4 transition-all ${
            isDarkMode
              ? 'bg-slate-900/80 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs opacity-60 mb-2">
            <span className="font-semibold">Mesh Delivery Reliability</span>
            <Radio className={`w-4 h-4 ${isDarkMode ? 'text-cyan-400' : 'text-teal-700'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono ${isDarkMode ? 'text-cyan-400' : 'text-teal-700'}`}>
            {analyticsData.packetDeliveryRatioPercent}%
          </div>
          <p className="text-xs opacity-70 mt-1">
            48 nodes forwarding telemetry across {location.name} terrain with 0 dropped frames.
          </p>
        </div>

        <div
          className={`rounded-xl border p-4 transition-all ${
            isDarkMode
              ? 'bg-slate-900/80 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs opacity-60 mb-2">
            <span className="font-semibold">System Uptime</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {analyticsData.networkUptimePercent}%
          </div>
          <p className="text-xs opacity-70 mt-1">
            Operational solar LiFePO4 batteries buffering continuous power throughout rain spells.
          </p>
        </div>

        <div
          className={`rounded-xl border p-4 transition-all ${
            isDarkMode
              ? 'bg-slate-900/80 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs opacity-60 mb-2">
            <span className="font-semibold">Mean Telemetry Latency</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono">
            {analyticsData.meanLatencyMs}{' '}
            <span className="text-sm font-normal opacity-60">ms</span>
          </div>
          <p className="text-xs opacity-70 mt-1">
            Single-hop leaf transmission to router hub taking 38–48ms on IN865 band.
          </p>
        </div>
      </div>
    </BorderGlow>
    </div>
  );
};
