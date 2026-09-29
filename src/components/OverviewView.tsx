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
  Sun,
  Flame,
  Wind,
} from 'lucide-react';
import { LocationConfig, SensorNode, LocationId } from '../types';
import { NavTabId } from './Navigation';
import { useTheme } from '../context/ThemeContext';
import { LOCATIONS } from '../data/locations';
import ScrollExpand from './ScrollExpand';
import SpotlightCard from './SpotlightCard';
import BorderGlow from './BorderGlow';
import TextType from './TextType';

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
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const allNodes = location.monitoredAreas.flatMap((a) => a.nodes);
  const dryNodesCount = allNodes.filter((n) => (n.readings.rainfallMmH || 0) < 1.0).length;

  const faqs = [
    {
      q: 'How does ENVORA work without internet or cellular network?',
      a: 'ENVORA’s leaf sensor nodes communicate over a sub-GHz LoRaWAN mesh (IN865 band), hopping data node-to-node until it reaches the Central Gateway Hub. Only the hub needs an NB-IoT connection to sync with the cloud dashboard — the sensing and alerting layer runs entirely offline.',
    },
    {
      q: 'What happens during a cyclone when telecom towers go down?',
      a: 'Because ENVORA doesn’t depend on commercial telecom infrastructure, the LoRa mesh keeps operating even when cell towers and grid power fail. Nodes run on solar-charged capacitor power, maintaining telemetry uptime through extended outages.',
    },
    {
      q: 'How much advance warning does ENVORA provide before a flood?',
      a: 'Using real-time river stage, rainfall intensity, and soil saturation data, ENVORA’s predictive hydrograph model can forecast catchment crest levels up to 4.5 hours in advance.',
    },
    {
      q: 'What hazards can ENVORA detect besides floods?',
      a: 'Beyond flood and cyclone monitoring, ENVORA tracks tidal backflow, urban waterlogging at known transit bottlenecks, early wildfire indicators via thermal sensing, and air quality/pollution levels.',
    },
    {
      q: 'How are alerts sent to emergency responders?',
      a: 'ENVORA automatically triggers Common Alerting Protocol (CAP) notifications, routed directly to District Emergency Operations Centers (DEOC), NDRF rescue teams, and public siren systems — no manual intervention needed.',
    },
    {
      q: 'How long do the sensor nodes last without maintenance?',
      a: 'Each leaf node is solar-powered with capacitor-based energy storage, designed for continuous unattended operation. (Add your actual battery/solar runtime spec here once tested.)',
    },
    {
      q: 'Which regions does ENVORA currently cover?',
      a: 'ENVORA is deployed and configurable across flood-vulnerable coastal, deltaic, and riverine regions — currently including Mumbai, Kerala, Chennai, and Puducherry, with the mesh architecture designed to extend to new regions.',
    },
    {
      q: 'Is ENVORA a hardware product, a software platform, or both?',
      a: 'ENVORA is a full-stack system: solar-powered LoRa hardware nodes in the field, a gateway running edge AI, and a cloud dashboard for real-time monitoring, mapping, and alert dispatch.',
    },
  ];

  return (
    <div className="tw-overview-shell">
      <div className="space-y-8 sm:space-y-10 pb-12">

        {/* ========================================================================= */}
        {/* HERO SECTION                                                              */}
        {/* ========================================================================= */}
        <BorderGlow
          edgeSensitivity={30}
          glowColor="0 125 115"
          backgroundColor={isDarkMode ? 'transparent' : 'rgba(255, 255, 255, 0.15)'}
          borderRadius={28}
          glowRadius={44}
          glowIntensity={1.0}
          coneSpread={25}
          animated={false}
          colors={['#007D73', '#0d9488', '#2dd4bf']}
          className="w-full backdrop-blur-sm"
        >
          <section
            className={`relative isolate pt-8 sm:pt-10 pb-10 sm:pb-12 px-4 sm:px-8 text-center flex flex-col items-center rounded-3xl overflow-hidden border transition-all ${
            location.id === 'mumbai'
              ? isDarkMode
                ? 'border-blue-500/30 bg-transparent'
                : 'border-blue-400/40 bg-white/10 shadow-xl'
              : location.id === 'kerala'
              ? isDarkMode
                ? 'border-purple-500/30 bg-transparent'
                : 'border-purple-400/40 bg-white/10 shadow-xl'
              : location.id === 'chennai'
              ? isDarkMode
                ? 'border-amber-500/30 bg-transparent'
                : 'border-amber-400/40 bg-white/10 shadow-xl'
              : isDarkMode
              ? 'border-teal-500/30 bg-transparent'
              : 'border-teal-400/40 bg-white/10 shadow-xl'
          }`}
        >
          {/* Hero Interactive Content Layer */}
          <div className="relative z-10 flex flex-col items-center w-full">
            {/* Eyebrow badge */}
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6 transition-all backdrop-blur-md ${
                isDarkMode
                  ? 'bg-black/80 text-slate-200 border border-[#007D73]/60 shadow-md shadow-[#007D73]/15'
                  : 'bg-white/40 text-[#00695f] border border-[#007D73]/50 shadow-xs'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#007D73]" />
              <span>Introducing real-time environmental intelligence</span>
            </div>

            {/* Headline with TextType Typing Animation */}
            <TextType
              as="h1"
              text={[
                "Detect Floods\n4.5 Hours Before They Hit",
                "Detect Forest Fires\nBefore They Spread",
                "Detect Air Pollution Spikes\nBefore They Harm",
                "Stay Connected Through Cyclones\nEven With Towers Down",
              ]}
              typingSpeed={45}
              deletingSpeed={25}
              pauseDuration={2400}
              loop={true}
              cursorCharacter="|"
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-tight text-center"
              cursorClassName="font-light select-none text-[#007D73]"
              renderContent={(text) => {
                if (text.includes('\n')) {
                  const [line1, ...rest] = text.split('\n');
                  return (
                    <>
                      <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>{line1}</span>
                      <br />
                      <span
                        className={`bg-gradient-to-r ${
                          isDarkMode
                            ? 'from-[#007D73] via-[#14b8a6] to-[#5eead4]'
                            : 'from-[#00695f] via-[#007D73] to-[#047857]'
                        } bg-clip-text text-transparent`}
                      >
                        {rest.join('\n')}
                      </span>
                    </>
                  );
                }
                return <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>{text}</span>;
              }}
            />

            {/* Subhead */}
            <p
              className={`mt-5 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              ENVORA senses, predicts, and dispatches hazard warnings instantly — across floods, fires, and pollution — with zero dependence on internet or grid power.
            </p>

            {/* Buttons: View Live Dashboard (primary) · Live Telemetry (secondary) · 3D PCB */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <button
                id="hero-view-dashboard-btn"
                onClick={() => onNavigate('monitoring')}
                className="px-6 py-3 rounded-lg font-bold text-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-md cursor-pointer flex items-center gap-2 bg-[#007D73] hover:bg-[#00695f] text-white shadow-[#007D73]/30"
              >
                <Activity className="w-4 h-4" />
                <span>View Live Dashboard</span>
              </button>

              <button
                id="hero-live-telemetry-btn"
                onClick={() => onNavigate('monitoring')}
                className={`px-6 py-3 rounded-lg font-bold text-sm border transition-all flex items-center gap-2 cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-900/60 hover:bg-slate-800/80 text-white border-slate-700/80'
                    : 'bg-white/70 hover:bg-white text-slate-800 border-slate-300/80 shadow-xs'
                }`}
              >
                <Radio className={`w-4 h-4 ${isDarkMode ? 'text-[#2dd4bf]' : 'text-[#007D73]'}`} />
                <span>Live Telemetry</span>
              </button>

              <button
                id="hero-view-pcb-btn"
                onClick={() => onNavigate('pcb')}
                className={`px-6 py-3 rounded-lg font-bold text-sm border transition-all flex items-center gap-2 cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-900/60 hover:bg-slate-800/80 text-[#5eead4] border-[#007D73]/70 shadow-md shadow-[#007D73]/20'
                    : 'bg-white/70 hover:bg-white text-[#00695f] border-[#007D73]/60 shadow-xs'
                }`}
              >
                <Cpu className="w-4 h-4 text-[#007D73]" />
                <span>3D PCB Hardware</span>
              </button>
            </div>

            {/* Animated Computer Mouse Scroll Indicator with #007D73 */}
            <div className="mt-9 flex flex-col items-center gap-2 pointer-events-none select-none">
              <div
                className={`w-6 h-10 rounded-full border-2 flex justify-center pt-2 transition-all ${
                  isDarkMode
                    ? 'border-[#007D73] shadow-md shadow-[#007D73]/40'
                    : 'border-[#007D73] shadow-sm shadow-[#007D73]/30'
                }`}
              >
                <span
                  className="w-1.5 h-2.5 rounded-full bg-[#007D73] animate-bounce"
                  style={{ animationDuration: '1.4s' }}
                />
              </div>
              <span
                className={`text-[11px] font-mono tracking-widest uppercase font-bold flex items-center gap-1 ${
                  isDarkMode ? 'text-[#2dd4bf]' : 'text-[#007D73]'
                }`}
              >
                <span>Scroll to Explore</span>
                <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
              </span>
            </div>
          </div>
        </section>
      </BorderGlow>

      {/* ========================================================================= */}
      {/* PLATFORM OVERVIEW & ARCHITECTURE                                          */}
      {/* ========================================================================= */}
      <ScrollExpand>
        <BorderGlow
          edgeSensitivity={30}
          glowColor="0 125 115"
          backgroundColor={isDarkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.85)'}
          borderRadius={28}
          glowRadius={40}
          glowIntensity={1.0}
          coneSpread={25}
          animated={false}
          colors={['#007D73', '#0d9488', '#2dd4bf']}
          className="w-full backdrop-blur-md"
        >
          <SpotlightCard className="custom-spotlight-card rounded-2xl w-full" spotlightColor="rgba(0, 125, 115, 0.22)">
            <section className="w-full">
              <div
                className={`rounded-2xl p-8 sm:p-10 lg:p-12 border transition-all ${
                  isDarkMode
                    ? 'bg-slate-900/70 border-slate-800 text-white'
                    : 'bg-white/80 border-slate-200 text-slate-900 shadow-sm'
                }`}
              >
              <div className="w-full space-y-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-3 rounded-xl border ${
                      isDarkMode
                        ? 'bg-[#007D73]/20 text-[#2dd4bf] border-[#007D73]/50'
                        : 'bg-[#007D73]/10 text-[#007D73] border-[#007D73]/30'
                    }`}
                  >
                    <Cpu className="w-5 h-5 text-[#007D73]" />
                  </div>
                  <div>
                    <span
                      className={`text-sm sm:text-base font-bold uppercase tracking-wider block ${
                        isDarkMode ? 'text-[#2dd4bf]' : 'text-[#007D73]'
                      }`}
                    >
                      PLATFORM OVERVIEW & ARCHITECTURE
                    </span>
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                      What is ENVORA?
                    </h3>
                  </div>
                </div>

                <p
                  className={`text-base sm:text-base lg:text-lg leading-relaxed ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  ENVORA ( ENVironmental Observation, Response & Analytics) is an autonomous, disaster-hardened environmental intelligence platform engineered for flood-vulnerable coastal, deltaic, and riverine regions across India — including Puducherry, Mumbai, Kerala, and Chennai.
                </p>

                <p
                  className={`text-base sm:text-base lg:text-lg leading-relaxed ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Built on a decentralized LoRaWAN mesh network — one Central Gateway Hub and multiple Field Sensor Leaf nodes per zone — ENVORA operates completely independent of commercial telecom or grid power. Solar-powered leaf nodes continuously track river stage, rainfall intensity, soil saturation, tidal backflow, air quality, and fire risk indicators, hopping data hub-ward before hazards escalate.
                </p>

                {/* Hypertext Tag Chips */}
                <div className="pt-4 flex flex-wrap gap-3 text-sm sm:text-base font-mono">
                  <a
                    href="#zero-internet-mesh"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('topology');
                    }}
                    title="Inspect Zero-Internet LoRaWAN Mesh Topology"
                    className={`group px-4 py-2 rounded-lg border font-semibold inline-flex items-center gap-2 transition-all cursor-pointer underline decoration-cyan-400/40 hover:decoration-cyan-400 hover:-translate-y-0.5 shadow-xs ${
                      isDarkMode
                        ? 'bg-slate-950 text-cyan-300 border-slate-800 hover:border-cyan-500 hover:bg-slate-900'
                        : 'bg-slate-100 text-teal-800 border-slate-300 hover:border-teal-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Zero-Internet Mesh</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </a>

                  <a
                    href="#autonomous-solar-battery"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('monitoring');
                    }}
                    title="View Autonomous Solar & Battery Telemetry"
                    className={`group px-4 py-2 rounded-lg border font-semibold inline-flex items-center gap-2 transition-all cursor-pointer underline decoration-emerald-400/40 hover:decoration-emerald-400 hover:-translate-y-0.5 shadow-xs ${
                      isDarkMode
                        ? 'bg-slate-950 text-emerald-300 border-slate-800 hover:border-emerald-500 hover:bg-slate-900'
                        : 'bg-slate-100 text-emerald-800 border-slate-300 hover:border-emerald-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Autonomous Solar + Battery</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </a>

                  <a
                    href="#sub-ghz-in865-band"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('topology');
                    }}
                    title="Explore Sub-GHz IN865 Band Radio Specifications"
                    className={`group px-4 py-2 rounded-lg border font-semibold inline-flex items-center gap-2 transition-all cursor-pointer underline decoration-amber-400/40 hover:decoration-amber-400 hover:-translate-y-0.5 shadow-xs ${
                      isDarkMode
                        ? 'bg-slate-950 text-amber-300 border-slate-800 hover:border-amber-500 hover:bg-slate-900'
                        : 'bg-slate-100 text-amber-800 border-slate-300 hover:border-amber-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Sub-GHz IN865 Band</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </a>

                  <a
                    href="#multi-hop-routing"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('topology');
                    }}
                    title="Inspect Multi-Hop RPL/ETX Routing Scheme"
                    className={`group px-4 py-2 rounded-lg border font-semibold inline-flex items-center gap-2 transition-all cursor-pointer underline decoration-indigo-400/40 hover:decoration-indigo-400 hover:-translate-y-0.5 shadow-xs ${
                      isDarkMode
                        ? 'bg-slate-950 text-indigo-300 border-slate-800 hover:border-indigo-500 hover:bg-slate-900'
                        : 'bg-slate-100 text-indigo-800 border-slate-300 hover:border-indigo-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Multi-Hop RPL/ETX Routing</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </a>

                  <a
                    href="#edge-ai-gateway"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('risk');
                    }}
                    title="Review Edge AI at Gateway Inference Engine"
                    className={`group px-4 py-2 rounded-lg border font-semibold inline-flex items-center gap-2 transition-all cursor-pointer underline decoration-purple-400/40 hover:decoration-purple-400 hover:-translate-y-0.5 shadow-xs ${
                      isDarkMode
                        ? 'bg-slate-950 text-purple-300 border-slate-800 hover:border-purple-500 hover:bg-slate-900'
                        : 'bg-slate-100 text-purple-800 border-slate-300 hover:border-purple-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Edge AI at Gateway</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>
              </div>
            </div>
          </section>
        </SpotlightCard>
      </BorderGlow>
    </ScrollExpand>

    {/* ========================================================================= */}
    {/* CORE OPERATIONAL VALUE / PLATFORM USES & KEY CAPABILITIES                 */}
    {/* ========================================================================= */}
    <ScrollExpand>
      <BorderGlow
        edgeSensitivity={30}
        glowColor="0 125 115"
        backgroundColor={isDarkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.85)'}
        borderRadius={28}
        glowRadius={40}
        glowIntensity={1.0}
        coneSpread={25}
        animated={false}
        colors={['#007D73', '#0d9488', '#2dd4bf']}
        className="w-full backdrop-blur-md"
      >
        <SpotlightCard className="custom-spotlight-card rounded-2xl w-full" spotlightColor="rgba(0, 125, 115, 0.22)">
          <section className="w-full">
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
                        CORE OPERATIONAL VALUE
                      </span>
                      <h4 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                        Platform Uses & Key Capabilities
                      </h4>
                    </div>
                  </div>
                  <span className="text-sm sm:text-base font-mono opacity-80 font-semibold">
                    5 Mission-Critical Deployment Scenarios
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                  {/* 1. 4.5-Hour Flood Warning */}
                  <SpotlightCard className="custom-spotlight-card rounded-xl h-full" spotlightColor="rgba(0, 229, 255, 0.2)">
                    <div
                      className={`p-6 rounded-xl border flex flex-col justify-between h-full transition-all ${
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
                            4.5-Hour Flood Warning
                          </h5>
                        </div>
                        <p className="text-sm leading-relaxed opacity-80">
                          Calculates catchment crest forecasts 4.5 hours in advance, giving municipal corporations and police crucial lead time to deploy dewatering pumps and evacuate basements.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-current/10">
                        <a
                          href="#predictive-hydrograph"
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigate('monitoring');
                          }}
                          className="text-xs font-mono text-cyan-400 hover:underline inline-flex items-center gap-1 cursor-pointer font-semibold"
                        >
                          <span>Predictive Hydrograph Lead Time</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </SpotlightCard>

                  {/* 2. Cyclone & Outage Resilience */}
                  <SpotlightCard className="custom-spotlight-card rounded-xl h-full" spotlightColor="rgba(0, 229, 255, 0.2)">
                    <div
                      className={`p-6 rounded-xl border flex flex-col justify-between h-full transition-all ${
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
                            Cyclone & Outage Resilience
                          </h5>
                        </div>
                        <p className="text-sm leading-relaxed opacity-80">
                          Operates autonomously over sub-GHz LoRa radio packets. Maintains 100% telemetry uptime even when severe cyclones flatten telecom towers and trigger citywide blackouts.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-current/10">
                        <a
                          href="#offgrid-mesh"
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigate('topology');
                          }}
                          className="text-xs font-mono text-teal-400 hover:underline inline-flex items-center gap-1 cursor-pointer font-semibold"
                        >
                          <span>100% Off-Grid Mesh Continuity</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </SpotlightCard>

                  {/* 3. Wildfire & Air Quality Monitoring */}
                  <SpotlightCard className="custom-spotlight-card rounded-xl h-full" spotlightColor="rgba(0, 229, 255, 0.2)">
                    <div
                      className={`p-6 rounded-xl border flex flex-col justify-between h-full transition-all ${
                        isDarkMode
                          ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-orange-500/50'
                          : 'bg-slate-50 border-slate-200 text-slate-800 shadow-2xs hover:border-slate-400'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 shrink-0">
                            <Flame className="w-5 h-5" />
                          </div>
                          <h5 className={`font-bold text-base sm:text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            Wildfire & Air Quality Monitoring
                          </h5>
                        </div>
                        <p className="text-sm leading-relaxed opacity-80">
                          Detects early thermal anomalies and rising particulate/gas concentrations at the sensor level, flagging fire risk zones and pollution spikes before they become visible hazards.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-current/10">
                        <a
                          href="#early-hazard-detection"
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigate('risk');
                          }}
                          className="text-xs font-mono text-orange-400 hover:underline inline-flex items-center gap-1 cursor-pointer font-semibold"
                        >
                          <span>Early Hazard Detection</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </SpotlightCard>

                  {/* 4. Automated CAP Dispatch */}
                  <SpotlightCard className="custom-spotlight-card rounded-xl h-full" spotlightColor="rgba(0, 229, 255, 0.2)">
                    <div
                      className={`p-6 rounded-xl border flex flex-col justify-between h-full transition-all ${
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
                            Automated CAP Dispatch
                          </h5>
                        </div>
                        <p className="text-sm leading-relaxed opacity-80">
                          Triggers automated Common Alerting Protocol (CAP) notifications to District Emergency Operations Centers (DEOC), NDRF rescue teams, and public sirens instantly.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-current/10">
                        <a
                          href="#cap-dispatch"
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigate('alerts');
                          }}
                          className="text-xs font-mono text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer font-semibold"
                        >
                          <span>Zero-Latency Emergency Relays</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </SpotlightCard>

                  {/* 5. Urban Waterlogging Defense */}
                  <SpotlightCard className="custom-spotlight-card rounded-xl h-full" spotlightColor="rgba(0, 229, 255, 0.2)">
                    <div
                      className={`p-6 rounded-xl border flex flex-col justify-between h-full transition-all ${
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
                            Urban Waterlogging Defense
                          </h5>
                        </div>
                        <p className="text-sm leading-relaxed opacity-80">
                          Monitors severe transit depression bottlenecks (Hindmata in Mumbai, Velachery in Chennai, Aluva/Periyar in Kerala, and Grand Canal in Puducherry).
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-current/10">
                        <a
                          href="#waterlogging-defense"
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigate('maps');
                          }}
                          className="text-xs font-mono text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer font-semibold"
                        >
                          <span>Hyperlocal Inundation Mapping</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </SpotlightCard>
                </div>
              </div>
            </section>
          </SpotlightCard>
        </BorderGlow>
      </ScrollExpand>

      {/* ========================================================================= */}
      {/* FREQUENTLY ASKED QUESTIONS (FAQ) SECTION                                  */}
      {/* ========================================================================= */}
      <ScrollExpand>
        <BorderGlow
          edgeSensitivity={30}
          glowColor="0 125 115"
          backgroundColor={isDarkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.85)'}
          borderRadius={28}
          glowRadius={40}
          glowIntensity={1.0}
          coneSpread={25}
          animated={false}
          colors={['#007D73', '#0d9488', '#2dd4bf']}
          className="w-full backdrop-blur-md"
        >
          <SpotlightCard className="custom-spotlight-card rounded-2xl w-full" spotlightColor="rgba(0, 125, 115, 0.22)">
            <section
              className={`w-full rounded-2xl p-8 sm:p-10 lg:p-12 border transition-all ${
                isDarkMode
                  ? 'bg-slate-900/60 border-slate-800 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-900 shadow-xs'
              }`}
            >
              <div className="mb-6">
                <span
                  className={`text-xs sm:text-sm font-bold uppercase tracking-wider block mb-1 ${
                    isDarkMode ? 'text-cyan-400' : 'text-teal-700'
                  }`}
                >
                  FREQUENTLY ASKED QUESTIONS
                </span>
                <div className="flex items-center gap-2.5 mb-2">
                  <HelpCircle className={`w-6 h-6 ${isDarkMode ? 'text-cyan-400' : 'text-teal-700'}`} />
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
                    Frequently Asked Questions
                  </h3>
                </div>
                <p className={`text-base sm:text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Essential information about ENVORA's LoRa mesh telemetry, offline reliability, and early warning system
                </p>
              </div>

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
                        className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-semibold text-sm sm:text-base cursor-pointer"
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
                          className={`px-5 pb-5 pt-2 text-sm leading-relaxed border-t ${
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
          </SpotlightCard>
        </BorderGlow>
      </ScrollExpand>

      </div>
    </div>
  );
};

export default OverviewView;
