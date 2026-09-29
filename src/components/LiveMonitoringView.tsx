import React, { useState } from 'react';
import {
  Activity,
  CloudRain,
  Droplets,
  Wind,
  Mountain,
  Thermometer,
  Gauge,
  Compass,
  Radio,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { LocationConfig, MonitoredArea, SensorNode } from '../types';
import { useTheme } from '../context/ThemeContext';
import BorderGlow from './BorderGlow';

interface LiveMonitoringViewProps {
  location: LocationConfig;
  onSelectNode: (node: SensorNode) => void;
}

export const LiveMonitoringView: React.FC<LiveMonitoringViewProps> = ({
  location,
  onSelectNode,
}) => {
  const { isDarkMode } = useTheme();
  const [selectedAreaId, setSelectedAreaId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'internal' | 'leaf'>('all');

  const filteredAreas = location.monitoredAreas.filter((area) => {
    if (selectedAreaId !== 'all' && area.id !== selectedAreaId) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesArea = area.name.toLowerCase().includes(term) || area.zoneType.toLowerCase().includes(term);
      const matchesNode = area.nodes.some(
        (n) => n.name.toLowerCase().includes(term) || n.code.toLowerCase().includes(term)
      );
      if (!matchesArea && !matchesNode) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
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
              <Activity className={`w-4 h-4 ${isDarkMode ? 'text-cyan-400' : 'text-teal-700'}`} />
              <h2 className="text-base font-bold">
                Live Environmental Telemetry & Stations — {location.name}
              </h2>
            </div>
            <p className="text-xs opacity-70 mt-1 max-w-3xl">
              High-frequency sensor telemetry stream across {location.name} monitoring stations. Data feeds update every 4-10 seconds via multi-hop LoRaWAN mesh gateways.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div
              className={`flex items-center gap-2 font-mono px-3 py-1.5 rounded-lg border ${
                isDarkMode
                  ? 'bg-slate-950 text-cyan-300 border-slate-800'
                  : 'bg-slate-50 text-teal-800 border-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>48 Sensor Probes Online</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-4 pt-4 border-t border-current/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-semibold opacity-75">Filter Zone:</label>
            <select
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className={`px-2.5 py-1.5 rounded-md border text-xs font-medium focus:ring-1 focus:ring-cyan-500 ${
                isDarkMode
                  ? 'bg-slate-950 text-white border-slate-700'
                  : 'bg-white text-slate-800 border-slate-300 shadow-2xs'
              }`}
            >
              <option value="all">All Zones ({location.monitoredAreas.length})</option>
              {location.monitoredAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name} ({area.currentRisk})
                </option>
              ))}
            </select>

            <label className="text-xs font-semibold opacity-75 ml-2">Node Type:</label>
            <div
              className={`flex rounded-md border overflow-hidden text-xs ${
                isDarkMode ? 'border-slate-700' : 'border-slate-300'
              }`}
            >
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 font-medium transition-colors ${
                  filterType === 'all'
                    ? isDarkMode
                      ? 'bg-cyan-950 text-cyan-300'
                      : 'bg-slate-850 text-white'
                    : isDarkMode
                    ? 'bg-slate-900 text-slate-400'
                    : 'bg-white text-slate-700'
                }`}
              >
                All (8/zone)
              </button>
              <button
                onClick={() => setFilterType('internal')}
                className={`px-2.5 py-1 font-medium transition-colors border-l ${
                  filterType === 'internal'
                    ? 'bg-indigo-700 text-white'
                    : isDarkMode
                    ? 'bg-slate-900 text-slate-400 border-slate-700'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                Internal Hubs (4)
              </button>
              <button
                onClick={() => setFilterType('leaf')}
                className={`px-2.5 py-1 font-medium transition-colors border-l ${
                  filterType === 'leaf'
                    ? 'bg-teal-700 text-white'
                    : isDarkMode
                    ? 'bg-slate-900 text-slate-400 border-slate-700'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                Leaf Probes (4)
              </button>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 opacity-40 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search station, code, or area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 rounded-md border text-xs focus:outline-hidden focus:ring-1 focus:ring-cyan-500 ${
                isDarkMode
                  ? 'bg-slate-950 text-white border-slate-700 placeholder-slate-500'
                  : 'bg-white text-slate-800 border-slate-300 placeholder-slate-400'
              }`}
            />
          </div>
        </div>
      </div>
    </BorderGlow>

    {/* Monitored Area Stations */}
    <div className="space-y-6">
      {filteredAreas.map((area) => {
        const areaNodes = area.nodes.filter((n) => {
          if (filterType !== 'all' && n.type !== filterType) return false;
          if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return n.name.toLowerCase().includes(term) || n.code.toLowerCase().includes(term);
          }
          return true;
        });

        return (
          <BorderGlow
            key={area.id}
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
              className={`rounded-xl border overflow-hidden transition-all ${
                isDarkMode
                  ? 'bg-slate-900/80 border-slate-800 text-white'
                  : 'bg-white border-slate-200 text-slate-900 shadow-xs'
              }`}
            >
              {/* Zone Header */}
              <div
                className={`px-5 py-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  isDarkMode
                    ? 'bg-slate-950/70 border-slate-800'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3
                      className={`text-xl sm:text-2xl font-black tracking-tight ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {area.name}
                    </h3>
                    <span
                      className={`text-xs font-black uppercase px-3 py-1 rounded-full border shadow-xs tracking-wider ${
                        area.currentRisk === 'Critical'
                          ? isDarkMode
                            ? 'bg-red-950 text-red-300 border-red-500 shadow-red-500/20'
                            : 'bg-red-100 text-red-800 border-red-300 shadow-red-100'
                          : area.currentRisk === 'High'
                          ? isDarkMode
                            ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-amber-500/20'
                            : 'bg-amber-100 text-amber-900 border-amber-300 shadow-amber-100'
                          : isDarkMode
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-emerald-500/20'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-emerald-100'
                      }`}
                    >
                      {area.currentRisk} Risk
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                    <span
                      className={`font-semibold px-2 py-0.5 rounded-md ${
                        isDarkMode
                          ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/60'
                          : 'bg-teal-50 text-teal-800 border border-teal-200'
                      }`}
                    >
                      {area.zoneType}
                    </span>
                    <span className="opacity-70 text-xs hidden sm:inline">
                      • {area.description}
                    </span>
                  </div>
                </div>

                {/* Key Hydrometric Vitals at a Glance */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono shrink-0 mt-2 sm:mt-0">
                  <div
                    className={`px-3 py-1.5 rounded-lg border ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-800 text-slate-200'
                        : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                    }`}
                  >
                    <span className="opacity-60 font-sans block text-[10px]">24H RAINFALL</span>
                    <span className="font-bold text-sm text-cyan-400">{area.averageRainfall24hMm} mm</span>
                  </div>

                  <div
                    className={`px-3 py-1.5 rounded-lg border ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-800 text-slate-200'
                        : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="opacity-60 font-sans block text-[10px]">WATER STAGE</span>
                      <span className="text-[10px] text-red-400">Limit: {area.waterLevelThresholdM}m</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`font-bold text-sm ${
                          area.maxWaterLevelM >= area.waterLevelThresholdM
                            ? 'text-red-400'
                            : area.maxWaterLevelM >= area.waterLevelThresholdM * 0.85
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {area.maxWaterLevelM} m
                      </span>
                      <span className="opacity-40 text-xs">/ {area.waterLevelThresholdM}m</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clean, Streamlined Node Telemetry Cards */}
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-semibold uppercase tracking-wider text-[11px] opacity-60">
                    Active Sensor Stations ({areaNodes.length})
                  </span>
                  <span className="text-[11px] opacity-50 font-mono">
                    Click any station for diagnostic inspector
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {areaNodes.map((node) => {
                    const isInternal = node.type === 'internal';
                    const hasHighWater = node.readings.waterLevelM && node.readings.waterLevelM >= 2.0;
                    const hasHighRain = node.readings.rainfallMmH > 15;

                    return (
                      <div
                        key={node.id}
                        onClick={() => onSelectNode(node)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isDarkMode
                            ? 'bg-slate-950/70 border-slate-800 hover:border-cyan-500/80 hover:bg-slate-900/90'
                            : 'bg-white border-slate-200 hover:border-teal-600 hover:shadow-sm'
                        }`}
                      >
                        <div>
                          {/* Card Top: Code & Station Type */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2.5 h-2.5 rounded-full ${
                                  isInternal ? 'bg-sky-400' : 'bg-teal-400'
                                }`}
                              />
                              <span className="font-black font-mono text-sm tracking-tight">
                                {node.code}
                              </span>
                              <span
                                className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${
                                  isInternal
                                    ? 'bg-sky-950 text-sky-300 border border-sky-800'
                                    : 'bg-teal-950 text-teal-300 border border-teal-800'
                                }`}
                              >
                                {isInternal ? 'Gateway Router' : 'Sensor Probe'}
                              </span>
                            </div>

                            <span className="text-[10px] opacity-50 font-mono">
                              {node.lastPingSecAgo}s ago
                            </span>
                          </div>

                          <h5 className="font-semibold text-xs truncate mb-2 opacity-90">
                            {node.name}
                          </h5>

                          {/* Primary Reading Displayed Prominently */}
                          <div
                            className={`p-2.5 rounded-lg border my-2 ${
                              isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="opacity-70 text-[11px]">Primary Telemetry:</span>
                              <span
                                className={`font-mono font-bold text-sm ${
                                  hasHighWater || hasHighRain
                                    ? 'text-amber-400'
                                    : isDarkMode ? 'text-cyan-300' : 'text-teal-800'
                                }`}
                              >
                                {node.readings.waterLevelM !== undefined
                                  ? `${node.readings.waterLevelM} m Water`
                                  : node.readings.soilMoisturePercent !== undefined
                                  ? `${node.readings.soilMoisturePercent}% Soil`
                                  : `${node.readings.rainfallMmH} mm/h Rain`}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] opacity-65 mt-1 font-mono">
                              <span>Rain: {node.readings.rainfallMmH} mm/h</span>
                              <span>Temp: {node.readings.ambientTempC}°C</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Bottom: Battery & Action */}
                        <div className="pt-2 border-t border-current/10 flex items-center justify-between text-[11px]">
                          <span className="text-emerald-400 font-mono font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {node.batteryPercent}% ({node.solarVoltageV}V)
                          </span>
                          <span
                            className={`font-bold flex items-center gap-0.5 ${
                              isDarkMode ? 'text-cyan-400' : 'text-teal-700'
                            }`}
                          >
                            Inspect <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </BorderGlow>
        );
      })}
      </div>
    </div>
  );
};
