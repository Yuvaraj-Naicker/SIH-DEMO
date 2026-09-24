import React, { useState } from 'react';
import {
  Shield,
  Radio,
  Bell,
  MapPin,
  ChevronDown,
  Clock,
  Activity,
  AlertTriangle,
  Map,
  Network,
  LayoutDashboard,
  BarChart3,
  History,
  Sun,
  Moon,
  ArrowRight,
  Wifi,
} from 'lucide-react';
import { LocationConfig, LocationId } from '../types';
import { LOCATIONS } from '../data/locations';
import { NavTabId } from './Navigation';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  currentLocation: LocationConfig;
  onSelectLocation: (id: LocationId) => void;
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  unacknowledgedAlertsCount: number;
  isSimulating: boolean;
  onToggleSimulate: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLocation,
  onSelectLocation,
  activeTab,
  onTabChange,
  unacknowledgedAlertsCount,
  isSimulating,
  onToggleSimulate,
}) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const tabs = [
    { id: 'overview' as NavTabId, label: 'Overview', icon: LayoutDashboard },
    { id: 'monitoring' as NavTabId, label: 'Live Monitoring', icon: Activity },
    {
      id: 'risk' as NavTabId,
      label: 'Risk Intelligence',
      icon: AlertTriangle,
      tag: currentLocation.liveMetrics.compositeRiskLevel,
    },
    { id: 'maps' as NavTabId, label: 'Geospatial Map', icon: Map },
    { id: 'topology' as NavTabId, label: 'Network Topology', icon: Network },
    {
      id: 'alerts' as NavTabId,
      label: 'Alerts',
      icon: Bell,
      badge: unacknowledgedAlertsCount > 0 ? String(unacknowledgedAlertsCount).padStart(2, '0') : undefined,
    },
    { id: 'analytics' as NavTabId, label: 'Analytics', icon: BarChart3 },
    { id: 'history' as NavTabId, label: 'Historical Data', icon: History },
  ];

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors shadow-md ${
        isDarkMode
          ? 'bg-slate-950/95 text-white border-slate-800/80 backdrop-blur-md'
          : 'bg-white text-slate-900 border-slate-200 backdrop-blur-md'
      }`}
    >
      <div className="max-w-[1700px] mx-auto px-3 sm:px-5">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* ========================================================================= */}
          {/* LEFT: BRAND LOGO + LOCATION SELECTOR                                      */}
          {/* ========================================================================= */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Pulsing signal icon */}
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                isDarkMode
                  ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-700 shadow-sm shadow-cyan-500/20'
                  : 'bg-teal-700 text-white shadow-xs'
              }`}
              onClick={() => onTabChange('overview')}
            >
              <Radio className="w-5 h-5 animate-pulse" />
            </div>

            {/* Brand Title */}
            <span
              onClick={() => onTabChange('overview')}
              className={`font-black text-base sm:text-lg tracking-wider uppercase cursor-pointer ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              TerraWatch
            </span>

            {/* Location Switcher Pill */}
            <div className="relative">
              <button
                id="header-location-pill"
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider transition-all border ${
                  isDarkMode
                    ? 'bg-slate-900 hover:bg-slate-850 text-cyan-300 border-slate-700 hover:border-cyan-500'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                <span>{currentLocation.name}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {/* Location Dropdown menu */}
              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div
                    className={`absolute left-0 mt-2 w-64 rounded-xl border shadow-2xl py-1.5 z-50 ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider opacity-60 border-b border-current/10">
                      Select Location
                    </div>
                    {Object.values(LOCATIONS).map((loc) => {
                      const isSelected = loc.id === currentLocation.id;
                      return (
                        <button
                          key={loc.id}
                          id={`select-loc-${loc.id}`}
                          onClick={() => {
                            onSelectLocation(loc.id as LocationId);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                            isSelected
                              ? isDarkMode
                                ? 'bg-cyan-950/80 text-cyan-300 font-bold'
                                : 'bg-teal-50 text-teal-900 font-bold'
                              : 'hover:bg-slate-800/40 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <div>
                            <span className="font-bold">{loc.name}</span>
                            <span className="text-[10px] opacity-60 ml-1">
                              ({loc.stateOrUt})
                            </span>
                          </div>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              loc.liveMetrics.compositeRiskLevel === 'Critical'
                                ? 'bg-red-900/60 text-red-300'
                                : loc.liveMetrics.compositeRiskLevel === 'High'
                                ? 'bg-amber-900/60 text-amber-300'
                                : 'bg-emerald-900/60 text-emerald-300'
                            }`}
                          >
                            {loc.liveMetrics.compositeRiskLevel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CENTER: NAVIGATION TABS WITH PROMINENT FONT SIZE                          */}
          {/* ========================================================================= */}
          <nav className="hidden xl:flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm lg:text-[15px] font-semibold whitespace-nowrap transition-all relative ${
                    isActive
                      ? isDarkMode
                        ? 'bg-slate-900 text-cyan-300 shadow-inner'
                        : 'bg-teal-50 text-teal-950 border border-teal-200/70 shadow-xs font-bold'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/90'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? isDarkMode
                          ? 'text-cyan-400'
                          : 'text-teal-700'
                        : isDarkMode
                        ? 'text-slate-400'
                        : 'text-slate-500'
                    }`}
                  />
                  <span>{tab.label}</span>

                  {/* High tag for Risk Intelligence */}
                  {tab.tag && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isDarkMode
                          ? 'bg-amber-950 text-amber-300 border border-amber-700'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {tab.tag}
                    </span>
                  )}

                  {/* Red badge for Alerts */}
                  {tab.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white shadow-xs">
                      {tab.badge}
                    </span>
                  )}

                  {/* Active cyan / teal bottom accent line */}
                  {isActive && (
                    <span
                      className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${
                        isDarkMode ? 'bg-cyan-400' : 'bg-teal-700'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* ========================================================================= */}
          {/* RIGHT: LIVE TELEMETRY STATUS PILLS, GIS MAP BUTTON, DARK MODE TOGGLE      */}
          {/* ========================================================================= */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Status Pill (98% wifi, 3s ping) */}
            <div
              className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-mono border ${
                isDarkMode
                  ? 'bg-slate-900 text-slate-300 border-slate-800'
                  : 'bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              <div className={`flex items-center gap-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                <Wifi className="w-3.5 h-3.5" />
                <span className="font-bold">98%</span>
              </div>
              <span className="opacity-40">•</span>
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDarkMode ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
                <span className="opacity-80">3s</span>
              </div>
            </div>

            {/* Alert Counter Pill */}
            <button
              onClick={() => onTabChange('alerts')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold border transition-colors ${
                unacknowledgedAlertsCount > 0
                  ? isDarkMode
                    ? 'bg-red-950/80 text-red-300 border-red-800 hover:bg-red-900/80'
                    : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                  : 'opacity-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span>{String(unacknowledgedAlertsCount).padStart(2, '0')}</span>
            </button>

            {/* GIS Map Direct CTA Button matching Screenshot */}
            <button
              id="header-gis-map-btn"
              onClick={() => onTabChange('maps')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${
                isDarkMode
                  ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm'
              }`}
            >
              <span>GIS Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Dark Mode / Light Mode Toggle Button */}
            <button
              id="theme-toggle-btn"
              type="button"
              onClick={toggleTheme}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
                isDarkMode
                  ? 'bg-slate-900 hover:bg-slate-850 text-amber-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-amber-600 border-slate-300 shadow-xs'
              }`}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Secondary Mobile/Tablet Navigation Bar */}
        <div className="xl:hidden flex items-center gap-1.5 overflow-x-auto scrollbar-none py-2 border-t border-current/10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? isDarkMode
                      ? 'bg-cyan-950 text-cyan-300'
                      : 'bg-teal-100 text-teal-950 font-bold border border-teal-200'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.tag && (
                  <span
                    className={`px-1 text-[9px] rounded font-bold ${
                      isDarkMode
                        ? 'bg-amber-950 text-amber-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {tab.tag}
                  </span>
                )}
                {tab.badge && (
                  <span className="px-1 text-[9px] bg-red-600 text-white rounded font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
