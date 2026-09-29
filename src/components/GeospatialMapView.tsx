import React from 'react';
import {
  Radio,
  Wifi,
  Activity,
  AlertTriangle,
  Shield,
  Layers,
  ArrowRight,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { LocationConfig, SensorNode, LocationId } from '../types';
import { GeospatialLeafletMap, getZoneMeta } from './GeospatialLeafletMap';
import { useTheme } from '../context/ThemeContext';
import BorderGlow from './BorderGlow';

interface GeospatialMapViewProps {
  location: LocationConfig;
  onSelectNode: (node: SensorNode) => void;
  onSelectLocation?: (locationId: LocationId) => void;
  onToggleNodeStatus?: (nodeId: string) => void;
}

export const GeospatialMapView: React.FC<GeospatialMapViewProps> = ({
  location,
  onSelectNode,
  onSelectLocation,
  onToggleNodeStatus,
}) => {
  const { isDarkMode } = useTheme();

  const criticalAreas = location.monitoredAreas.filter((a) => getZoneMeta(a).type === 'critical');
  const riskAreas = location.monitoredAreas.filter((a) => getZoneMeta(a).type === 'risk');
  const normalAreas = location.monitoredAreas.filter((a) => getZoneMeta(a).type === 'normal');

  return (
    <div className="space-y-6 pb-12">
      {/* Main Interactive Map Component with Hopping Method & Critical/Risk/Normal Zones */}
      <BorderGlow
        edgeSensitivity={30}
        glowColor="0 125 115"
        backgroundColor={isDarkMode ? 'rgba(0,0,0,0.85)' : '#ffffff'}
        borderRadius={24}
        glowRadius={40}
        glowIntensity={1.0}
        coneSpread={25}
        animated={false}
        colors={['#007D73', '#0d9488', '#2dd4bf']}
        className="w-full"
      >
        <GeospatialLeafletMap
          location={location}
          onSelectNode={onSelectNode}
          onSelectLocation={onSelectLocation}
          onToggleNodeStatus={onToggleNodeStatus}
          compact={false}
        />
      </BorderGlow>

      {/* Geospatial Classification and Hopping Intelligence Cards */}
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
        {/* Card 1: Critical, Risk & Normal Zone Demarcation */}
        <div
          className={`rounded-xl p-5 border transition-all ${
            isDarkMode
              ? 'bg-slate-900/80 border-slate-800 text-white'
              : 'bg-white border-slate-300/80 text-slate-900 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h4
              className={`font-bold text-xs flex items-center gap-2 uppercase tracking-wider ${
                isDarkMode ? 'text-red-400' : 'text-red-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Zone Classification Matrix</span>
            </h4>
            <span className="text-[10px] font-mono opacity-60">3-Tier Demarcation</span>
          </div>

          <div className="space-y-2 mt-3 text-xs">
            <div className="flex items-start gap-2 p-2 rounded-lg bg-red-950/20 border border-red-900/40">
              <span className="text-sm shrink-0">🚨</span>
              <div>
                <div className="font-bold text-red-400 text-[11px] flex items-center gap-1">
                  <span>Critical Zone ({criticalAreas.length})</span>
                </div>
                <p className="text-[10px] opacity-80 mt-0.5">
                  Water level breached danger threshold or active channel overflow. Rapid 30s beaconing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-950/20 border border-amber-900/40">
              <span className="text-sm shrink-0">⚠️</span>
              <div>
                <div className="font-bold text-amber-400 text-[11px] flex items-center gap-1">
                  <span>Risk Zone ({riskAreas.length})</span>
                </div>
                <p className="text-[10px] opacity-80 mt-0.5">
                  Water level within 75–95% of danger line or rainfall rate &gt;15 mm/h. Elevated vigilance.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
              <span className="text-sm shrink-0">✅</span>
              <div>
                <div className="font-bold text-emerald-400 text-[11px] flex items-center gap-1">
                  <span>Normal Zone ({normalAreas.length})</span>
                </div>
                <p className="text-[10px] opacity-80 mt-0.5">
                  Hydrometric levels nominal. Standard low-power 10-minute packet heartbeat.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Mesh Hopping Scheme & Protocols */}
        <div
          className={`rounded-xl p-5 border transition-all ${
            isDarkMode
              ? 'bg-slate-900/80 border-slate-800 text-white'
              : 'bg-white border-slate-300/80 text-slate-900 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h4
              className={`font-bold text-xs flex items-center gap-2 uppercase tracking-wider ${
                isDarkMode ? 'text-cyan-400' : 'text-teal-700'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Multi-Hop Transmission Method</span>
            </h4>
            <span className="text-[10px] font-mono text-cyan-400">RPL / ETX Mesh</span>
          </div>

          <p className="text-xs opacity-75 leading-relaxed mb-3">
            Field leaf probes (LN) do not connect directly to the internet. Instead, telemetry hops across a self-organizing mesh to the nearest internal gateway router (IN), which aggregates and multi-hops the data to the cluster hub before cloud uplink.
          </p>

          <div
            className={`p-2.5 rounded-lg border text-[11px] font-mono space-y-1.5 ${
              isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="opacity-70">Hop 1 (Field Probe ➔ Gateway):</span>
              <span className="font-bold text-cyan-400">LoRa 865MHz SF7</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="opacity-70">Hop 2 (Gateway ➔ Backbone Hub):</span>
              <span className="font-bold text-sky-400">Mesh SF9 (Relay)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="opacity-70">Hop 3 (Backbone Hub ➔ Cloud):</span>
              <span className="font-bold text-emerald-400">Dual 4G/NB-IoT</span>
            </div>
          </div>
        </div>

        {/* Card 3: Regional Frequency Allocation & Monsoon Resilience */}
        <div
          className={`rounded-xl p-5 border transition-all ${
            isDarkMode
              ? 'bg-slate-900/80 border-slate-800 text-white'
              : 'bg-white border-slate-300/80 text-slate-900 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h4
              className={`font-bold text-xs flex items-center gap-2 uppercase tracking-wider ${
                isDarkMode ? 'text-emerald-400' : 'text-emerald-700'
              }`}
            >
              <Wifi className="w-4 h-4" />
              <span>India IN865 Sub-GHz Specs</span>
            </h4>
            <span className="text-[10px] font-mono text-emerald-400">865–867 MHz</span>
          </div>

          <p className="text-xs opacity-75 leading-relaxed mb-3">
            Operating in the India WPC de-licensed 865–867 MHz band. Sub-gigahertz waves provide superior diffraction around urban bridges, railway embankments, and heavy monsoon downpours.
          </p>

          <div
            className={`p-2.5 rounded-lg border text-[11px] font-mono space-y-1.5 ${
              isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="opacity-70">TX Output Power:</span>
              <span className="font-bold">14 dBm (25 mW EIRP)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="opacity-70">Rain Attenuation Margin:</span>
              <span className="font-bold text-amber-400">+18 dBm Flood SF10</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="opacity-70">Autonomous Power:</span>
              <span className="font-bold text-emerald-400">Solar + LiFePO4</span>
            </div>
          </div>
        </div>
      </div>
    </BorderGlow>
  </div>
  );
};
