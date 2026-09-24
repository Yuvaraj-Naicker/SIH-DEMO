import React from 'react';
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  Map,
  Network,
  Bell,
  BarChart3,
  History,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type NavTabId =
  | 'overview'
  | 'monitoring'
  | 'risk'
  | 'maps'
  | 'topology'
  | 'alerts'
  | 'analytics'
  | 'history';

interface NavigationProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  unacknowledgedAlertsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  unacknowledgedAlertsCount,
}) => {
  const { isDarkMode } = useTheme();

  const tabs = [
    { id: 'overview' as NavTabId, label: 'Overview', icon: LayoutDashboard },
    { id: 'monitoring' as NavTabId, label: 'Live Monitoring', icon: Activity },
    { id: 'risk' as NavTabId, label: 'Risk Intelligence', icon: AlertTriangle },
    { id: 'maps' as NavTabId, label: 'Geospatial Maps', icon: Map },
    { id: 'topology' as NavTabId, label: 'Network Topology', icon: Network },
    { id: 'alerts' as NavTabId, label: 'Alerts', icon: Bell, badge: unacknowledgedAlertsCount },
    { id: 'analytics' as NavTabId, label: 'Analytics', icon: BarChart3 },
    { id: 'history' as NavTabId, label: 'Historical Data', icon: History },
  ];

  return (
    <nav
      className={`border-b sticky top-16 z-40 transition-colors shadow-xs ${
        isDarkMode
          ? 'bg-slate-950/95 border-slate-800/80 text-white'
          : 'bg-white/95 border-slate-200/90 text-slate-800'
      }`}
    >
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2 overflow-x-auto py-1.5 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm sm:text-[15px] font-semibold whitespace-nowrap transition-all relative ${
                  isActive
                    ? isDarkMode
                      ? 'bg-slate-900 text-cyan-300 shadow-inner'
                      : 'bg-teal-50 text-teal-950 border border-teal-200/80 shadow-xs font-bold'
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
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-red-600 text-white'
                        : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <span
                    className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-t ${
                      isDarkMode ? 'bg-cyan-400' : 'bg-teal-700'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
