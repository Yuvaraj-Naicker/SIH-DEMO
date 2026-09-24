import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  Shield,
  Search,
  Filter,
  Send,
  Radio,
  Clock,
  Building2,
  Check,
} from 'lucide-react';
import { LocationConfig, OperationalAlert, AlertSeverity } from '../types';
import { useTheme } from '../context/ThemeContext';

interface AlertsViewProps {
  location: LocationConfig;
  onAcknowledgeAlert: (alertId: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  location,
  onAcknowledgeAlert,
}) => {
  const { isDarkMode } = useTheme();
  const [severityFilter, setSeverityFilter] = useState<'all' | AlertSeverity>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAlerts = location.activeAlerts.filter((alert) => {
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        alert.headline.toLowerCase().includes(term) ||
        alert.areaName.toLowerCase().includes(term) ||
        alert.description.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
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
              <Bell className="w-4 h-4 text-red-500" />
              <h2 className="text-base font-bold">
                Operational Early Warning Alerts — {location.name}
              </h2>
            </div>
            <p className="text-xs opacity-70 mt-1 max-w-3xl">
              Real-time threshold incident broadcasts dispatched to Municipal Disaster Management Cells, State Disaster Response Forces, and public warning networks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-800 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <span className="opacity-60">Active Incidents: </span>
              <strong className={`font-bold ${isDarkMode ? 'text-cyan-400' : 'text-teal-700'}`}>{location.activeAlerts.length}</strong>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mt-4 pt-4 border-t border-current/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold opacity-70 mr-1">Severity:</span>
            <button
              onClick={() => setSeverityFilter('all')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                severityFilter === 'all'
                  ? isDarkMode
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'bg-slate-900 text-white'
                  : isDarkMode
                  ? 'bg-slate-950 text-slate-400 border border-slate-800'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All ({location.activeAlerts.length})
            </button>
            <button
              onClick={() => setSeverityFilter('critical')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                severityFilter === 'critical'
                  ? 'bg-red-700 text-white'
                  : isDarkMode
                  ? 'bg-red-950/40 text-red-300 border border-red-900'
                  : 'bg-red-50 text-red-800 hover:bg-red-100'
              }`}
            >
              Critical (
              {location.activeAlerts.filter((a) => a.severity === 'critical').length}
              )
            </button>
            <button
              onClick={() => setSeverityFilter('warning')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                severityFilter === 'warning'
                  ? 'bg-amber-600 text-white'
                  : isDarkMode
                  ? 'bg-amber-950/40 text-amber-300 border border-amber-900'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Warning (
              {location.activeAlerts.filter((a) => a.severity === 'warning').length}
              )
            </button>
            <button
              onClick={() => setSeverityFilter('advisory')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                severityFilter === 'advisory'
                  ? 'bg-blue-600 text-white'
                  : isDarkMode
                  ? 'bg-blue-950/40 text-blue-300 border border-blue-900'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
              }`}
            >
              Advisory (
              {location.activeAlerts.filter((a) => a.severity === 'advisory').length}
              )
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 opacity-40 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search alert headlines or zones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 rounded-md border text-xs focus:ring-1 focus:ring-cyan-500 ${
                isDarkMode
                  ? 'bg-slate-950 text-white border-slate-700 placeholder-slate-500'
                  : 'bg-white text-slate-800 border-slate-300 placeholder-slate-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div
            className={`rounded-xl border p-8 text-center text-xs opacity-60 ${
              isDarkMode
                ? 'bg-slate-900/60 border-slate-800'
                : 'bg-white border-slate-200'
            }`}
          >
            No active alerts matching the selected filter criteria.
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl border overflow-hidden transition-all ${
                isDarkMode
                  ? alert.severity === 'critical'
                    ? 'bg-slate-900/90 border-red-800 text-white'
                    : alert.severity === 'warning'
                    ? 'bg-slate-900/90 border-amber-800 text-white'
                    : 'bg-slate-900/90 border-slate-800 text-white'
                  : alert.severity === 'critical'
                  ? 'bg-white border-red-300 text-slate-900 shadow-xs'
                  : alert.severity === 'warning'
                  ? 'bg-white border-amber-300 text-slate-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-900 shadow-xs'
              }`}
            >
              {/* Alert Header Bar */}
              <div
                className={`px-5 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  isDarkMode
                    ? alert.severity === 'critical'
                      ? 'bg-red-950/60 border-red-900 text-red-200'
                      : alert.severity === 'warning'
                      ? 'bg-amber-950/60 border-amber-900 text-amber-200'
                      : 'bg-slate-950 border-slate-800 text-slate-200'
                    : alert.severity === 'critical'
                    ? 'bg-red-50/70 border-red-200 text-red-950'
                    : alert.severity === 'warning'
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      alert.severity === 'critical'
                        ? 'bg-red-600 text-white border-red-700'
                        : alert.severity === 'warning'
                        ? 'bg-amber-600 text-white border-amber-700'
                        : 'bg-slate-700 text-white border-slate-800'
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <span className="font-semibold text-xs">
                    {alert.areaName}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono opacity-80">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 opacity-60" />
                    <span>{alert.timestamp}</span>
                  </div>
                  {alert.acknowledged ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-sans font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Acknowledged
                    </span>
                  ) : (
                    <span className="text-amber-400 font-sans font-medium">
                      Pending Action
                    </span>
                  )}
                </div>
              </div>

              {/* Alert Body */}
              <div className="p-5 space-y-3">
                <h3 className="font-bold text-sm">
                  {alert.headline}
                </h3>
                <p className="text-xs opacity-80 leading-relaxed">
                  {alert.description}
                </p>

                {/* Recommended Operational Action (SOP) */}
                <div
                  className={`p-3 rounded-lg border text-xs space-y-1 ${
                    isDarkMode
                      ? 'bg-slate-950/70 border-slate-800'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div
                    className={`font-bold flex items-center gap-1.5 ${
                      isDarkMode ? 'text-cyan-400' : 'text-teal-700'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Standard Operating Protocol (SOP):</span>
                  </div>
                  <p className="opacity-80 leading-relaxed">
                    {alert.recommendedAction}
                  </p>
                </div>

                {/* Sensor Source & Dispatch Recipients */}
                <div className="pt-2 border-t border-current/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs opacity-80">
                  <div className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 opacity-60" />
                    <span className="truncate max-w-[280px]">
                      Source: {alert.sensorSource}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] opacity-60">Dispatched to:</span>
                    <div className="flex flex-wrap gap-1">
                      {alert.dispatchedTo.map((dept, i) => (
                        <span
                          key={i}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            isDarkMode
                              ? 'bg-slate-800 text-slate-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {dept}
                        </span>
                      ))}
                    </div>

                    {!alert.acknowledged && (
                      <button
                        onClick={() => onAcknowledgeAlert(alert.id)}
                        className="ml-2 px-3 py-1 rounded-md bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
                      >
                        <Check className="w-3 h-3" />
                        <span>Acknowledge</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
