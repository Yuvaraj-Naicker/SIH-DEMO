import React, { useState } from 'react';
import {
  Network,
  Radio,
  Wifi,
  Battery,
  Sun,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Server,
  Cpu,
  Layers,
} from 'lucide-react';
import { LocationConfig, MonitoredArea, SensorNode } from '../types';
import { useTheme } from '../context/ThemeContext';
import BorderGlow from './BorderGlow';

interface NetworkTopologyViewProps {
  location: LocationConfig;
  onSelectNode: (node: SensorNode) => void;
}

export const NetworkTopologyView: React.FC<NetworkTopologyViewProps> = ({
  location,
  onSelectNode,
}) => {
  const { isDarkMode } = useTheme();
  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    location.monitoredAreas[0]?.id || ''
  );

  const currentArea =
    location.monitoredAreas.find((a) => a.id === selectedAreaId) ||
    location.monitoredAreas[0];

  const internalNodes = currentArea ? currentArea.nodes.filter((n) => n.type === 'internal') : [];
  const leafNodes = currentArea ? currentArea.nodes.filter((n) => n.type === 'leaf') : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Topology Header */}
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
                <Network className={`w-4 h-4 ${isDarkMode ? 'text-cyan-400' : 'text-teal-700'}`} />
                <h2 className="text-base font-bold">
                  Sensor Network Topology — {location.name}
                </h2>
              </div>
              <p className="text-xs opacity-70 mt-1 max-w-3xl">
                LoRaWAN 865-867 MHz multi-hop mesh structure per monitored area. Displays 1 Central Internal Gateway Router (IN) and 4 Field Sensor Leaf Nodes (LN) with overlapping ~1km range radii and hopping routing tables.
              </p>
            </div>

            {/* Area Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold opacity-75">Select Zone Topology:</span>
              <select
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
                className={`px-3 py-1.5 rounded-md border text-xs font-semibold focus:ring-1 focus:ring-cyan-500 ${
                  isDarkMode
                    ? 'bg-slate-950 text-white border-slate-700'
                    : 'bg-white text-slate-800 border-slate-300 shadow-2xs'
                }`}
              >
                {location.monitoredAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name} ({area.nodes.length} Nodes)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </BorderGlow>

      {/* Network Health Metrics Strip */}
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3">
          <div
            className={`rounded-xl border p-3.5 transition-all ${
              isDarkMode
                ? 'bg-slate-900/80 border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs opacity-60 mb-1">
              <span>Area Topology Structure</span>
              <Server className={`w-4 h-4 ${isDarkMode ? 'text-cyan-400' : 'text-teal-700'}`} />
            </div>
            <div className="text-lg font-bold font-mono">
              {internalNodes.length} Internal + {leafNodes.length} Leaf
            </div>
            <div className="text-[11px] opacity-60 mt-1">
              {currentArea.nodes.length} Dedicated Nodes / Zone
            </div>
          </div>

          <div
            className={`rounded-xl border p-3.5 transition-all ${
              isDarkMode
                ? 'bg-slate-900/80 border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs opacity-60 mb-1">
              <span>Packet Delivery (PDR)</span>
              <Activity className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-lg font-bold text-teal-400 font-mono">
              {location.analyticsData.packetDeliveryRatioPercent}%
            </div>
            <div className="text-[11px] opacity-60 mt-1">LoRa SF7 Adaptive Rate</div>
          </div>

          <div
            className={`rounded-xl border p-3.5 transition-all ${
              isDarkMode
                ? 'bg-slate-900/80 border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs opacity-60 mb-1">
              <span>Coverage Radius / Node</span>
              <Radio className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg font-bold font-mono">
              ~1.0 km Overlapping
            </div>
            <div className="text-[11px] opacity-60 mt-1">Zero Blindspots Assured</div>
          </div>

          <div
            className={`rounded-xl border p-3.5 transition-all ${
              isDarkMode
                ? 'bg-slate-900/80 border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs opacity-60 mb-1">
              <span>Gateway Backhaul</span>
              <Wifi className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono">
              Active 4G / NB-IoT
            </div>
            <div className="text-[11px] opacity-60 mt-1">Direct Cloud Ingress</div>
          </div>
        </div>
      </BorderGlow>

      {/* Visual Mesh Architecture Diagram */}
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
        <div className="flex items-center justify-between mb-4 border-b border-current/10 pb-3">
          <div>
            <h3 className="font-bold text-sm">
              Mesh Routing Diagram — {currentArea.name}
            </h3>
            <p className="text-xs opacity-60">
              Visual representation of field leaf nodes hopping to internal gateway routers, forwarding to Central Cloud
            </p>
          </div>
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded border ${
              isDarkMode
                ? 'bg-slate-950 text-cyan-300 border-slate-800'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            Zone Center: {currentArea.centerLat}° N, {currentArea.centerLng}° E
          </span>
        </div>

        {/* Diagram SVG */}
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 overflow-x-auto">
          <svg viewBox="0 0 850 380" className="w-full min-w-[700px] h-auto block select-none">
            <defs>
              <pattern id="topogrid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" />
              </pattern>
            </defs>

            <rect width="850" height="380" fill="url(#topogrid)" />

            {/* Central Cloud / Emergency Desk Node (Right) */}
            <g transform="translate(740, 190)">
              <rect x="-45" y="-30" width="90" height="60" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              <text x="0" y="-8" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">
                CLOUD UPLINK
              </text>
              <text x="0" y="8" fill="#94a3b8" fontSize="8" textAnchor="middle">
                Dual 4G / Fiber
              </text>
              <text x="0" y="20" fill="#34d399" fontSize="8" fontWeight="bold" textAnchor="middle">
                Online (100%)
              </text>
            </g>

            {/* Internal Gateway Router to Cloud Uplink */}
            <line x1="495" y1="190" x2="695" y2="190" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="5 3" />

            {/* 4 Leaf Nodes hopping to Central Internal Gateway Router (450, 190) */}
            <line x1="160" y1="70" x2="415" y2="190" stroke="#14b8a6" strokeWidth="1.8" strokeDasharray="4 3" />
            <line x1="160" y1="150" x2="415" y2="190" stroke="#14b8a6" strokeWidth="1.8" strokeDasharray="4 3" />
            <line x1="160" y1="230" x2="415" y2="190" stroke="#14b8a6" strokeWidth="1.8" strokeDasharray="4 3" />
            <line x1="160" y1="310" x2="415" y2="190" stroke="#14b8a6" strokeWidth="1.8" strokeDasharray="4 3" />

            {/* Render 4 Leaf Nodes on left */}
            {leafNodes.map((leaf, idx) => {
              const y = 70 + idx * 80;
              return (
                <g
                  key={leaf.id}
                  transform={`translate(130, ${y})`}
                  className="cursor-pointer group"
                  onClick={() => onSelectNode(leaf)}
                >
                  <circle r="22" fill="#042f2e" stroke="#2dd4bf" strokeWidth="2" />
                  <circle cx="0" cy="0" r="8" fill="#14b8a6" />
                  <text x="0" y="3" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                    L0{idx + 1}
                  </text>
                  <text x="-35" y="4" fill="#99f6e4" fontSize="10" fontWeight="bold" textAnchor="end">
                    {leaf.code}
                  </text>
                  <text x="-35" y="16" fill="#64748b" fontSize="8" textAnchor="end">
                    RSSI {leaf.rssiDbm} dBm
                  </text>
                </g>
              );
            })}

            {/* Render 1 Internal Gateway Router in center (y=190) */}
            {internalNodes.map((intNode) => {
              return (
                <g
                  key={intNode.id}
                  transform="translate(450, 190)"
                  className="cursor-pointer group"
                  onClick={() => onSelectNode(intNode)}
                >
                  <rect
                    x="-34"
                    y="-26"
                    width="68"
                    height="52"
                    rx="8"
                    fill="#1e1b4b"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                  />
                  <text x="0" y="-8" fill="#fbbf24" fontSize="11" fontWeight="bold" textAnchor="middle">
                    {intNode.code}
                  </text>
                  <text x="0" y="6" fill="#94a3b8" fontSize="8" textAnchor="middle">
                    Internal Gateway
                  </text>
                  <text x="0" y="18" fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="middle">
                    Mesh Coordinator
                  </text>
                  <text x="45" y="0" fill="#a5b4fc" fontSize="9" fontWeight="medium" textAnchor="start">
                    {intNode.batteryPercent}% Bat
                  </text>
                </g>
              );
            })}

            {/* Hopping flow tags */}
            <text x="240" y="40" fill="#2dd4bf" fontSize="9" fontWeight="bold" letterSpacing="1">
              HOPPING LAYER 1: 4 FIELD LEAF NODES (LN) → 1 GATEWAY ROUTER (IN)
            </text>
            <text x="540" y="170" fill="#38bdf8" fontSize="9" fontWeight="bold" letterSpacing="1">
              HOPPING LAYER 2: GATEWAY → CLOUD UPLINK
            </text>
          </svg>
        </div>
      </div>

      {/* Node Hardware Specifications Table */}
      <div
        className={`rounded-xl border overflow-hidden transition-all ${
          isDarkMode
            ? 'bg-slate-900/80 border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-xs'
        }`}
      >
        <div
          className={`px-5 py-3 border-b flex items-center justify-between ${
            isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <h3 className="font-bold text-sm">
            Node Topology Hardware & Link Ledger ({currentArea.name})
          </h3>
          <span className="text-xs opacity-60">
            Click any row to inspect full telemetry & sensor calibration
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className={`border-b font-semibold uppercase text-[10px] ${
                isDarkMode
                  ? 'bg-slate-950/90 text-slate-400 border-slate-800'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
            >
              <tr>
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Role Type</th>
                <th className="px-4 py-2.5">Hardware Model</th>
                <th className="px-4 py-2.5">Next Hop Path</th>
                <th className="px-4 py-2.5">Signal RSSI</th>
                <th className="px-4 py-2.5">Loss Rate</th>
                <th className="px-4 py-2.5">Power Supply</th>
                <th className="px-4 py-2.5">Coverage</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-current/10 font-mono">
              {currentArea.nodes.map((node) => {
                const isInternal = node.type === 'internal';

                return (
                  <tr
                    key={node.id}
                    onClick={() => onSelectNode(node)}
                    className={`cursor-pointer transition-colors ${
                      isDarkMode
                        ? 'hover:bg-slate-800/50'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-4 py-2.5 font-bold">
                      {node.code}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded border ${
                          isInternal
                            ? isDarkMode
                              ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : isDarkMode
                            ? 'bg-teal-950 text-teal-300 border-teal-800'
                            : 'bg-teal-50 text-teal-800 border-teal-200'
                        }`}
                      >
                        {isInternal ? 'Internal Router' : 'Leaf Sensor'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-sans opacity-80">
                      {node.hardwareModel}
                    </td>
                    <td className="px-4 py-2.5 opacity-90">
                      {node.nextHopNodeId || 'Direct 4G Uplink'}
                    </td>
                    <td className="px-4 py-2.5 text-emerald-400">
                      {node.rssiDbm} dBm
                    </td>
                    <td className="px-4 py-2.5 opacity-70">
                      {node.packetLossPercent}%
                    </td>
                    <td className="px-4 py-2.5 opacity-80">
                      {node.batteryPercent}% ({node.solarVoltageV}V)
                    </td>
                    <td className="px-4 py-2.5 opacity-70 font-sans">
                      ~{node.coverageRadiusKm} km
                    </td>
                    <td className="px-4 py-2.5 text-right font-sans">
                      <button
                        onClick={() => onSelectNode(node)}
                        className={`font-semibold text-xs transition-colors ${
                          isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-teal-700 hover:text-teal-900'
                        }`}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </BorderGlow>
  </div>
  );
};
