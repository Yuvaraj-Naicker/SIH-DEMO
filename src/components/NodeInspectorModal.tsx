import React from 'react';
import {
  X,
  Radio,
  Wifi,
  Battery,
  Sun,
  Activity,
  Droplets,
  CloudRain,
  Thermometer,
  Gauge,
  Mountain,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { SensorNode, MonitoredArea } from '../types';
import { useTheme } from '../context/ThemeContext';

interface NodeInspectorModalProps {
  node: SensorNode | null;
  area?: MonitoredArea;
  onClose: () => void;
}

export const NodeInspectorModal: React.FC<NodeInspectorModalProps> = ({
  node,
  area,
  onClose,
}) => {
  const { isDarkMode } = useTheme();
  if (!node) return null;

  const isInternal = node.type === 'internal';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        className={`rounded-2xl shadow-2xl border max-w-lg w-full overflow-hidden transition-all ${
          isDarkMode
            ? 'bg-slate-900 border-slate-700 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        role="dialog"
      >
        {/* Modal Header */}
        <div
          className={`px-5 py-4 flex items-center justify-between border-b ${
            isDarkMode
              ? 'bg-slate-950 border-slate-800'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                isInternal
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                  : 'bg-teal-950 text-teal-300 border border-teal-700'
              }`}
            >
              {isInternal ? 'INT' : 'LEAF'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-white">{node.code}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  {isInternal ? 'Gateway Router (Mesh Core)' : 'Field Sensor Probe (Edge)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{node.name}</p>
            </div>
          </div>
          <button
            id="close-node-inspector"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* Status & Area Strip */}
          <div
            className={`flex items-center justify-between p-2.5 rounded-lg border ${
              isDarkMode
                ? 'bg-slate-950/70 border-slate-800'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div>
              <span className="opacity-60 font-medium">Monitored Zone: </span>
              <span className="font-bold">{area?.name || node.areaId}</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Operational (Ping {node.lastPingSecAgo}s ago)</span>
            </div>
          </div>

          {/* Hardware & Mesh Link Telemetry */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div
              className={`p-2.5 rounded-lg border ${
                isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs opacity-60 mb-1">
                <Battery className="w-3.5 h-3.5 text-emerald-400" />
                <span>Battery</span>
              </div>
              <div className="text-base font-bold font-mono">{node.batteryPercent}%</div>
              <div className="text-[10px] opacity-60">LiFePO4 Reserve</div>
            </div>

            <div
              className={`p-2.5 rounded-lg border ${
                isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs opacity-60 mb-1">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Solar PV</span>
              </div>
              <div className="text-base font-bold font-mono">{node.solarVoltageV} V</div>
              <div className="text-[10px] opacity-60">Harvester Float</div>
            </div>

            <div
              className={`p-2.5 rounded-lg border ${
                isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs opacity-60 mb-1">
                <Wifi className="w-3.5 h-3.5 text-indigo-400" />
                <span>Signal RSSI</span>
              </div>
              <div className="text-base font-bold font-mono text-cyan-400">{node.rssiDbm} dBm</div>
              <div className="text-[10px] text-emerald-400 font-medium">Strong Link</div>
            </div>

            <div
              className={`p-2.5 rounded-lg border ${
                isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs opacity-60 mb-1">
                <Activity className="w-3.5 h-3.5 opacity-60" />
                <span>Loss Rate</span>
              </div>
              <div className="text-base font-bold font-mono">{node.packetLossPercent}%</div>
              <div className="text-[10px] opacity-60">LoRaWAN SF7</div>
            </div>
          </div>

          {/* Hopping Route */}
          <div
            className={`p-3 rounded-lg border ${
              isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="font-semibold mb-2 flex items-center justify-between opacity-80">
              <span>Mesh Hopping Architecture</span>
              <span className="text-[10px] opacity-60 font-mono">Range ~{node.coverageRadiusKm} km</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <div
                className={`px-2 py-1 rounded border font-semibold ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                {node.code}
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              {node.nextHopNodeId ? (
                <div className="px-2 py-1 rounded bg-indigo-950 border border-indigo-700 text-indigo-200 font-semibold">
                  {node.nextHopNodeId}
                </div>
              ) : (
                <div className="px-2 py-1 rounded bg-emerald-950 border border-emerald-700 text-emerald-200 font-semibold">
                  Direct 4G Gateway Backhaul
                </div>
              )}
              {node.nextHopNodeId && (
                <>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  <div
                    className={`px-2 py-1 rounded border ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-slate-300'
                        : 'bg-slate-200 border-slate-300 text-slate-700'
                    }`}
                  >
                    Central Cloud Collector
                  </div>
                </>
              )}
            </div>
            <p className="text-[11px] opacity-60 mt-2">
              Hops to gateway: <span className="font-semibold opacity-100">{node.hopsToGateway}</span>. Overlapping circle range intersects adjacent nodes.
            </p>
          </div>

          {/* Environmental Sensor Telemetry Readings */}
          <div>
            <h4 className="font-semibold mb-2 uppercase tracking-wider opacity-80">
              Live Sensor Readings
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div
                className={`p-2.5 rounded-lg border flex items-center justify-between ${
                  isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-cyan-400" />
                  <span className="opacity-75">Rainfall Rate</span>
                </div>
                <span className="font-mono font-bold">
                  {node.readings.rainfallMmH} mm/h
                </span>
              </div>

              {node.readings.waterLevelM !== undefined && (
                <div
                  className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    <span className="opacity-75">Water Stage</span>
                  </div>
                  <span className="font-mono font-bold">
                    {node.readings.waterLevelM} m
                  </span>
                </div>
              )}

              {node.readings.soilMoisturePercent !== undefined && (
                <div
                  className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Mountain className="w-4 h-4 text-amber-400" />
                    <span className="opacity-75">Soil Saturation</span>
                  </div>
                  <span className="font-mono font-bold">
                    {node.readings.soilMoisturePercent}%
                  </span>
                </div>
              )}

              <div
                className={`p-2.5 rounded-lg border flex items-center justify-between ${
                  isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-orange-400" />
                  <span className="opacity-75">Ambient Temp</span>
                </div>
                <span className="font-mono font-bold">
                  {node.readings.ambientTempC} °C
                </span>
              </div>

              <div
                className={`p-2.5 rounded-lg border flex items-center justify-between ${
                  isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-teal-400" />
                  <span className="opacity-75">Relative Humidity</span>
                </div>
                <span className="font-mono font-bold">
                  {node.readings.humidityPercent}%
                </span>
              </div>

              {node.readings.windSpeedKmh !== undefined && (
                <div
                  className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-indigo-400" />
                    <span className="opacity-75">Wind Velocity</span>
                  </div>
                  <span className="font-mono font-bold">
                    {node.readings.windSpeedKmh} km/h
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-end ${
            isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-colors shadow-xs"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
