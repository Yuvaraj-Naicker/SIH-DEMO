import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Radio,
  CloudRain,
  Droplets,
  ShieldAlert,
  MapPin,
  TrendingUp,
  Activity,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Zap,
  HelpCircle,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Layers,
} from 'lucide-react';
import { LocationConfig, SensorNode, LocationId } from '../types';
import { NavTabId } from './Navigation';
import { GeospatialLeafletMap } from './GeospatialLeafletMap';
import { useTheme } from '../context/ThemeContext';
import { LOCATIONS } from '../data/locations';

interface OverviewViewProps {
  location: LocationConfig;
  onNavigate: (tab: NavTabId) => void;
  onSelectNode: (node: SensorNode) => void;
  onSelectLocation?: (locationId: LocationId) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  location,
  onNavigate,
  onSelectNode,
  onSelectLocation,
}) => {
  const { isDarkMode } = useTheme();
  const { liveMetrics, activeStatusBadge } = location;
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does the TerraWatch LoRaWAN mesh network transmit telemetry if cellular towers fail during a cyclone?',
      a: 'Every TerraWatch monitored area operates with 1 internal gateway node and 4 distributed leaf sensor probes transmitting on sub-GHz LoRa radio frequencies (IN865 band). Rather than relying on commercial 4G/5G mobile towers or grid power, each node runs on high-efficiency solar-capacitor hardware and forms an autonomous peer-to-peer ad-hoc mesh. Data packets hop across internal gateway nodes directly to municipal emergency command centers or satellite uplinks, guaranteeing continuous telemetry even through severe power blackouts and fiber breaks.',
    },
    {
      q: 'What physical environmental parameters are monitored by the leaf and internal nodes?',
      a: 'Leaf sensor nodes (LN) feature multi-sensor probes including non-contact ultrasonic water level gauges, tipping-bucket precipitation meters, subsurface soil piezometric moisture probes, and tidal surge sensors. Internal gateway nodes (IN) monitor barometric pressure, ambient temperature, relative humidity, and battery voltage health while coordinating encrypted packet routing across the mesh.',
    },
    {
      q: 'How does TerraWatch eliminate false alarms and compute composite risk intelligence?',
      a: 'TerraWatch synthesizes real-time physical telemetry with high-resolution Digital Elevation Models (DEM), astronomical tide benchmarks, radar precipitation forecasts, and drainage capacity curves. Instead of reacting to isolated sensor anomalies, the consensus validation engine cross-analyzes data from adjacent leaf probes and verifies rate-of-rise acceleration before elevating warning levels from Normal to Advisory, High, or Critical.',
    },
    {
      q: 'How do municipal authorities and NDRF disaster response teams receive automated emergency alerts?',
      a: 'When water stages, rainfall rates, or soil saturation levels surpass calibrated danger thresholds, TerraWatch automatically triggers Common Alerting Protocol (CAP) dispatches. Notifications are routed immediately to State Emergency Operations Centers (SEOC), District Collectorates, and NDRF relief teams via dedicated APIs, automated SMS broadcasts, geo-fenced siren triggers, and standardized emergency SOP action checklists.',
    },
    {
      q: 'Can TerraWatch be easily deployed in other flood-prone cities and coastal regions across India?',
      a: 'Yes. TerraWatch’s modular architecture supports rapid deployment across diverse geographic terrains—from urban stormwater bowls like Mumbai and Chennai, to high-gradient hill slopes in Kerala and historic coastal heritage grids like Puducherry. Calibration requires only loading the regional elevation topography, tidal benchmarks, and local hydrological drainage maps into the mesh coordinator.',
    },
  ];

  return (
    <div className="tw-overview-shell">
      {/* ========================================================================= */}
      {/* REGION QUICK SWITCHER STRIP (PUDUCHERRY, MUMBAI, KERALA, CHENNAI)          */}
      {/* ========================================================================= */}
      <div
        className={`tw-overview-region rounded-2xl p-3 sm:p-4 border transition-all ${
          isDarkMode
            ? 'bg-slate-900/80 border-slate-800'
            : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className={`w-4 h-4 ${isDarkMode ? 'text-cyan-400' : 'text-teal-700'}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Select Monitored Region:
            </span>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            {Object.values(LOCATIONS).map((loc) => {
              const isSelected = loc.id === location.id;
              const isCrit = loc.liveMetrics.compositeRiskLevel === 'Critical';
              const isHigh = loc.liveMetrics.compositeRiskLevel === 'High';

              return (
                <button
                  key={loc.id}
                  onClick={() => onSelectLocation && onSelectLocation(loc.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between sm:justify-start gap-2 transition-all border ${
                    isSelected
                      ? isDarkMode
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-sm shadow-cyan-500/20'
                        : 'bg-teal-700 text-white border-teal-800 shadow-sm'
                      : isDarkMode
                      ? 'bg-slate-950/70 hover:bg-slate-850 text-slate-300 border-slate-800'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  <span>{loc.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-black ${
                      isCrit
                        ? 'bg-red-500 text-white'
                        : isHigh
                        ? 'bg-amber-500 text-slate-950'
                        : isDarkMode
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {loc.liveMetrics.compositeRiskLevel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="tw-overview-stage">

      {/* ========================================================================= */}
      {/* HERO SECTION - EXACTLY MATCHING USER'S SCREENSHOT 2026-09-15 101402.png    */}
      {/* ========================================================================= */}
      <section className="tw-overview-snap tw-overview-hero relative pt-4 pb-6 text-center flex flex-col items-center">
        {/* Subtle decorative radial glow in dark mode */}
        {isDarkMode && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-500/10 blur-[120px] pointer-events-none -z-10" />
        )}

        {/* Feature badge chip */}
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6 transition-all ${
            isDarkMode
              ? 'bg-slate-900/90 text-slate-300 border border-slate-700/80 shadow-md shadow-cyan-950/20'
              : 'bg-teal-50 text-teal-900 border border-teal-200 shadow-xs'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${isDarkMode ? 'text-cyan-400' : 'text-teal-700'}`} />
          <span>Introducing real-time environmental mesh intelligence</span>
        </div>

        {/* Big Bold Headline matching Screenshot */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
          <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>
            Protect {location.name}
          </span>
          <br />
          <span
            className={`bg-gradient-to-r ${
              isDarkMode
                ? 'from-cyan-400 via-teal-300 to-emerald-400'
                : 'from-teal-800 via-cyan-800 to-blue-800'
            } bg-clip-text text-transparent`}
          >
            10x faster with AI
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p
          className={`mt-5 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed ${
            isDarkMode ? 'text-slate-300' : 'text-slate-700'
          }`}
        >
          Your environmental intelligence partner senses, predicts, and dispatches warnings instantly. Detect flood crests in minutes, not hours.
        </p>

        {/* Hero Call to Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <button
            id="hero-start-free-btn"
            onClick={() => onNavigate('maps')}
            className={`px-6 py-3 rounded-lg font-bold text-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-md ${
              isDarkMode
                ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-cyan-500/25'
                : 'bg-teal-700 hover:bg-teal-800 text-white shadow-teal-800/25'
            }`}
          >
            Start for free
          </button>

          <button
            id="hero-live-telemetry-btn"
            onClick={() => onNavigate('monitoring')}
            className={`px-6 py-3 rounded-lg font-bold text-sm border transition-all flex items-center gap-2 ${
              isDarkMode
                ? 'bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-xs'
            }`}
          >
            <Radio className={`w-4 h-4 ${isDarkMode ? 'text-cyan-400' : 'text-teal-700'}`} />
            <span>Live Telemetry</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* WHAT IS TERRAWATCH                                                         */}
      {/* ========================================================================= */}
      <section className="tw-overview-snap tw-overview-about">
        <div
          className={`rounded-2xl p-8 sm:p-10 lg:p-12 border transition-all ${
            isDarkMode
              ? 'bg-slate-900/70 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}
        >
          <div className="w-full space-y-4">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-3 rounded-xl ${
                  isDarkMode
                    ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                    : 'bg-teal-100 text-teal-800'
                }`}
              >
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span
                  className={`text-sm sm:text-base font-bold uppercase tracking-wider block ${
                    isDarkMode ? 'text-cyan-400' : 'text-teal-700'
                  }`}
                >
                  Platform Overview & Architecture
                </span>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                  What is TerraWatch?
                </h3>
              </div>
            </div>

            <p
              className={`text-base sm:text-base lg:text-lg leading-relaxed ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              <strong>TerraWatch</strong> is an autonomous, disaster-hardened environmental telemetry and hydrological risk intelligence platform engineered specifically for flood-vulnerable coastal, deltaic, and riverine regions across India — including <strong>Puducherry</strong>, <strong>Mumbai</strong>, <strong>Kerala</strong>, and <strong>Chennai</strong>.
            </p>

            <p
              className={`text-base sm:text-base lg:text-lg leading-relaxed ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              Configured with a decentralized <strong>LoRaWAN mesh network</strong> (1 Central Gateway Hub and 4 Field Sensor Leaf Probes per zone), TerraWatch operates completely independent of commercial telecommunications or grid power. Solar-capacitor nodes continuously track river stage levels, rainfall intensity, soil pore water saturation, and tidal backflows to detect flood crests hours before overflow occurs.
            </p>

            <div className="pt-4 flex flex-wrap gap-3 text-sm sm:text-base font-mono">
              <span
                className={`px-4 py-2 rounded-lg border font-semibold ${
                  isDarkMode
                    ? 'bg-slate-950 text-cyan-300 border-slate-800'
                    : 'bg-slate-100 text-teal-800 border-slate-300'
                }`}
              >
                Zero-Internet Mesh
              </span>
              <span
                className={`px-4 py-2 rounded-lg border font-semibold ${
                  isDarkMode
                    ? 'bg-slate-950 text-emerald-300 border-slate-800'
                    : 'bg-slate-100 text-emerald-800 border-slate-300'
                }`}
              >
                Autonomous Solar + Battery
              </span>
              <span
                className={`px-4 py-2 rounded-lg border font-semibold ${
                  isDarkMode
                    ? 'bg-slate-950 text-amber-300 border-slate-800'
                    : 'bg-slate-100 text-amber-800 border-slate-300'
                }`}
              >
                Sub-GHz IN865 Band
              </span>
              <span
                className={`px-4 py-2 rounded-lg border font-semibold ${
                  isDarkMode
                    ? 'bg-slate-950 text-indigo-300 border-slate-800'
                    : 'bg-slate-100 text-indigo-800 border-slate-300'
                }`}
              >
                Multi-Hop RPL/ETX Routing
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PLATFORM USES & KEY CAPABILITIES                                         */}
      {/* ========================================================================= */}
      <section className="tw-overview-snap tw-overview-platform">
        <div
          className={`w-full rounded-2xl p-8 sm:p-10 lg:p-12 border transition-all ${
            isDarkMode
              ? 'bg-slate-900/70 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  isDarkMode
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span
                  className={`text-sm sm:text-base font-bold uppercase tracking-wider block ${
                    isDarkMode ? 'text-emerald-400' : 'text-emerald-700'
                  }`}
                >
                  Core Operational Value
                </span>
                <h4 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                  Platform Uses & Key Capabilities
                </h4>
              </div>
            </div>
            <span className="text-sm sm:text-base font-mono opacity-60">
              4 Mission-Critical Deployment Scenarios
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Capability 1 */}
            <div
              className={`p-6 rounded-xl border flex flex-col justify-between transition-all ${
                isDarkMode
                  ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-cyan-500/50'
                  : 'bg-slate-50 border-slate-200 text-slate-800 shadow-2xs hover:border-slate-400'
              }`}
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                    <CloudRain className="w-5 h-5" />
                  </div>
                  <h5 className={`font-bold text-base sm:text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    1. 4.5-Hour Flood Warning
                  </h5>
                </div>
                <p className="text-sm sm:text-base lg:text-lg leading-relaxed opacity-80">
                  Calculates catchment crest forecasts 4.5 hours in advance, giving municipal corporations and police crucial lead time to deploy dewatering pumps and evacuate basements.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-current/10 text-xs sm:text-sm font-mono text-cyan-400">
                Predictive Hydrograph Lead Time
              </div>
            </div>

            {/* Capability 2 */}
            <div
              className={`p-6 rounded-xl border flex flex-col justify-between transition-all ${
                isDarkMode
                  ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-teal-500/50'
                  : 'bg-slate-50 border-slate-200 text-slate-800 shadow-2xs hover:border-slate-400'
              }`}
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 shrink-0">
                    <Radio className="w-5 h-5" />
                  </div>
                  <h5 className={`font-bold text-base sm:text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    2. Cyclone & Outage Resilience
                  </h5>
                </div>
                <p className="text-sm sm:text-base lg:text-lg leading-relaxed opacity-80">
                  Operates autonomously over sub-GHz LoRa radio packets. Maintains 100% telemetry uptime even when severe cyclones flatten telecom towers and trigger citywide blackouts.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-current/10 text-xs sm:text-sm font-mono text-teal-400">
                100% Off-Grid Mesh Continuity
              </div>
            </div>

            {/* Capability 3 */}
            <div
              className={`p-6 rounded-xl border flex flex-col justify-between transition-all ${
                isDarkMode
                  ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-amber-500/50'
                  : 'bg-slate-50 border-slate-200 text-slate-800 shadow-2xs hover:border-slate-400'
              }`}
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h5 className={`font-bold text-base sm:text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    3. Automated CAP Dispatch
                  </h5>
                </div>
                <p className="text-sm sm:text-base lg:text-lg leading-relaxed opacity-80">
                  Triggers automated Common Alerting Protocol (CAP) notifications to District Emergency Operations Centers (DEOC), NDRF rescue teams, and public sirens instantly.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-current/10 text-xs sm:text-sm font-mono text-amber-400">
                Zero-Latency Emergency Relays
              </div>
            </div>

            {/* Capability 4 */}
            <div
              className={`p-6 rounded-xl border flex flex-col justify-between transition-all ${
                isDarkMode
                  ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-blue-500/50'
                  : 'bg-slate-50 border-slate-200 text-slate-800 shadow-2xs hover:border-slate-400'
              }`}
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <h5 className={`font-bold text-base sm:text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    4. Urban Waterlogging Defense
                  </h5>
                </div>
                <p className="text-sm sm:text-base lg:text-lg leading-relaxed opacity-80">
                  Monitors severe transit depression bottlenecks (Hindmata in Mumbai, Velachery in Chennai, Aluva/Periyar in Kerala, and Grand Canal in Puducherry).
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-current/10 text-xs sm:text-sm font-mono text-blue-400">
                Hyperlocal Inundation Mapping
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* GEOSPATIAL MAP (INTERACTIVE LORAWAN MESH MAP WITH TRANSMISSION)            */}
      {/* ========================================================================= */}
      <div className="tw-overview-snap tw-overview-map space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <MapPin className={`w-4 h-4 ${isDarkMode ? 'text-cyan-400' : 'text-teal-700'}`} />
            <h3
              className={`font-bold text-sm uppercase tracking-wider ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Geospatial Mesh Coverage Map — {location.name}
            </h3>
          </div>
          <button
            onClick={() => onNavigate('maps')}
            className={`text-xs font-semibold flex items-center gap-1 transition-colors ${
              isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-teal-700 hover:text-teal-900'
            }`}
          >
            <span>Full Map Screen</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Leaflet Map with packet transmission */}
        <GeospatialLeafletMap
          location={location}
          onSelectNode={onSelectNode}
          onSelectLocation={onSelectLocation}
          compact={true}
        />
      </div>

      {/* ========================================================================= */}
      {/* FREQUENTLY ASKED QUESTIONS (FAQ) SECTION                                  */}
      {/* ========================================================================= */}
      <section
        className={`tw-overview-snap tw-overview-faq rounded-2xl p-8 sm:p-10 lg:p-12 border transition-all ${
          isDarkMode
            ? 'bg-slate-900/60 border-slate-800 text-white'
            : 'bg-slate-50 border-slate-200 text-slate-900 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className={`w-5 h-5 ${isDarkMode ? 'text-cyan-400' : 'text-teal-700'}`} />
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">Frequently Asked Questions</h3>
        </div>
        <p className={`text-base sm:text-lg lg:text-xl mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Essential information about TerraWatch LoRa mesh telemetry, zero-internet offline reliability, and early warning dispatch.
        </p>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-xl border transition-all overflow-hidden ${
                  isDarkMode
                    ? isOpen
                      ? 'bg-slate-900/90 border-cyan-800/80 shadow-md'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    : isOpen
                    ? 'bg-white border-teal-300 shadow-xs'
                    : 'bg-white/80 border-slate-200 hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm"
                >
                  <span className={isOpen ? (isDarkMode ? 'text-cyan-300' : 'text-teal-900 font-bold') : ''}>
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? `rotate-180 ${isDarkMode ? 'text-cyan-400' : 'text-teal-700'}`
                        : 'opacity-50'
                    }`}
                  />
                </button>

                {isOpen && (
                  <div
                    className={`px-4 pb-4 pt-1 text-xs leading-relaxed border-t ${
                      isDarkMode
                        ? 'border-slate-800 text-slate-300'
                        : 'border-slate-100 text-slate-600'
                    }`}
                  >
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      </div>
    </div>
  );
};
