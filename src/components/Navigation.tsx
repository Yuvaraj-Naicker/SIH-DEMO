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
  Cpu,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import GooeyNav from './GooeyNav';

export type NavTabId =
  | 'overview'
  | 'monitoring'
  | 'risk'
  | 'maps'
  | 'topology'
  | 'alerts'
  | 'analytics'
  | 'history'
  | 'pcb';

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
    { id: 'pcb' as NavTabId, label: 'PCB', icon: Cpu },
  ];

  const activeIndex = Math.max(0, tabs.findIndex((t) => t.id === activeTab));

  return (
    <nav
      className={`border-b sticky top-16 z-40 transition-colors shadow-xs ${
        isDarkMode
          ? 'bg-black/95 border-neutral-800/80 text-white'
          : 'bg-white/95 border-slate-200/90 text-slate-800'
      }`}
    >
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        <GooeyNav
          items={tabs}
          activeIndex={activeIndex}
          onTabChange={(_idx, item) => onTabChange(item.id as NavTabId)}
          isDarkMode={isDarkMode}
        />
      </div>
    </nav>
  );
};
