import React, { useState, useRef, useEffect } from 'react';
import {
  Radio,
  Bell,
  MapPin,
  ChevronDown,
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
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Cpu,
} from 'lucide-react';
import { LocationConfig, LocationId } from '../types';
import { LOCATIONS } from '../data/locations';
import { NavTabId } from './Navigation';
import { useTheme } from '../context/ThemeContext';
import GooeyNav from './GooeyNav';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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
    { id: 'pcb' as NavTabId, label: 'PCB', icon: Cpu },
  ];

  const checkScroll = () => {
    if (navRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  useEffect(() => {
    const activeEl = document.getElementById(`nav-tab-${activeTab}`);
    if (activeEl && navRef.current) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
    setTimeout(checkScroll, 200);
  }, [activeTab]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (navRef.current) {
      const scrollAmount = 260;
      navRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 250);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (navRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      navRef.current.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  const activeTabObj = tabs.find((t) => t.id === activeTab) || tabs[0];
  const ActiveTabIcon = activeTabObj.icon;

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors shadow-sm ${
        isDarkMode
          ? 'bg-black/95 text-white border-neutral-800/80 backdrop-blur-md'
          : 'bg-white text-slate-900 border-slate-200 backdrop-blur-md'
      }`}
    >
      {/* ========================================================================= */}
      {/* ROW 1: BRAND IDENTITY, REGION SELECTOR & TOP-RIGHT STATUS / CTAs          */}
      {/* ========================================================================= */}
      <div className="max-w-[1700px] mx-auto px-3 sm:px-5">
        <div className="flex items-center justify-between h-15 gap-3">
          {/* LEFT: Brand Logo + ENVORA Title + Location Selector */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Pulsing signal icon */}
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                isDarkMode
                  ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-700 shadow-sm shadow-cyan-500/20'
                  : 'bg-teal-700 text-white shadow-xs'
              }`}
              onClick={() => onTabChange('overview')}
              title="ENVORA Home"
            >
              <Radio className="w-5 h-5 animate-pulse" />
            </div>

            {/* Brand Title: ENVORA */}
            <div
              onClick={() => onTabChange('overview')}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <span
                className={`font-black text-lg sm:text-xl tracking-wider uppercase ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                ENVORA
              </span>
            </div>

            {/* Location Switcher Pill */}
            <div className="relative">
              <button
                id="header-location-pill"
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-900 hover:bg-slate-850 text-cyan-300 border-slate-700 hover:border-cyan-500'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                <MapPin className="w-3 h-3 text-cyan-500" />
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
                      Select Region
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
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
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

          {/* RIGHT: Quick Alerts, GIS Button, Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Alert Counter Pill - Direct click opens Alerts */}
            <button
              id="header-alerts-counter-pill"
              onClick={() => onTabChange('alerts')}
              title={`${unacknowledgedAlertsCount} unacknowledged alerts`}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold border transition-colors cursor-pointer ${
                unacknowledgedAlertsCount > 0
                  ? isDarkMode
                    ? 'bg-red-950/80 text-red-300 border-red-800 hover:bg-red-900/80'
                    : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span>{String(unacknowledgedAlertsCount).padStart(2, '0')}</span>
            </button>

            {/* GIS Map Direct CTA Button */}
            <button
              id="header-gis-map-btn"
              onClick={() => onTabChange('maps')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${
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
              className={`p-1.5 sm:p-2 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
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
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: DEDICATED DASHBOARD NAVIGATION ROW (ALL OPTIONS ALWAYS VISIBLE)    */}
      {/* ========================================================================= */}
      <div
        className={`border-t transition-colors ${
          isDarkMode
            ? 'bg-black/80 border-neutral-800/80'
            : 'bg-slate-50/80 border-slate-200/80'
        }`}
      >
        <div className="max-w-[1700px] mx-auto px-2 sm:px-5 relative flex items-center">
          {/* Left Arrow button for smooth scrolling on smaller screens */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className={`hidden sm:flex items-center justify-center absolute left-1 sm:left-2 z-20 w-7 h-7 rounded-full border shadow-md transition-all cursor-pointer ${
                isDarkMode
                  ? 'bg-slate-900 text-[#2dd4bf] border-[#007D73] hover:bg-[#007D73]/20'
                  : 'bg-white text-[#007D73] border-[#007D73]/50 hover:bg-[#007D73]/10'
              }`}
              title="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Full Dashboard Navigation Tabs Container with GooeyNav Effect */}
          <div className="flex-1 overflow-hidden">
            <GooeyNav
              items={tabs}
              activeIndex={tabs.findIndex((t) => t.id === activeTab) >= 0 ? tabs.findIndex((t) => t.id === activeTab) : 0}
              onTabChange={(_index, item) => onTabChange(item.id as NavTabId)}
              onScroll={checkScroll}
              onWheel={handleWheel}
              scrollRef={navRef}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Right Arrow button for smooth scrolling on smaller screens */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className={`hidden sm:flex items-center justify-center absolute right-1 sm:right-2 z-20 w-7 h-7 rounded-full border shadow-md transition-all cursor-pointer ${
                isDarkMode
                  ? 'bg-slate-900 text-[#2dd4bf] border-[#007D73] hover:bg-[#007D73]/20'
                  : 'bg-white text-[#007D73] border-[#007D73]/50 hover:bg-[#007D73]/10'
              }`}
              title="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Mobile Quick Dropdown Jump Menu for instant 1-tap view switching on very small screens */}
          <div className="sm:hidden pl-1 border-l border-current/10 relative">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-1.5 rounded-md border text-xs font-bold flex items-center gap-1 ${
                isDarkMode
                  ? 'bg-slate-900 text-[#2dd4bf] border-[#007D73]/60'
                  : 'bg-white text-[#007D73] border-[#007D73]/40'
              }`}
              title="All views menu"
            >
              <ActiveTabIcon className="w-3.5 h-3.5" />
              <ChevronDown className="w-3 h-3" />
            </button>

            {isMobileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <div
                  className={`absolute right-0 mt-2 w-56 rounded-xl border shadow-2xl py-1.5 z-50 ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-700 text-white'
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider opacity-60 border-b border-current/10">
                    Jump to Dashboard View
                  </div>
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          onTabChange(tab.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                          isActive
                            ? isDarkMode
                              ? 'bg-[#007D73]/30 text-[#2dd4bf] font-bold border-l-2 border-[#007D73]'
                              : 'bg-[#007D73]/15 text-[#00695f] font-bold border-l-2 border-[#007D73]'
                            : 'hover:bg-slate-800/40 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </div>
                        {tab.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-600 text-white">
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

