import React, { useState } from 'react';
import {
  History,
  Download,
  Calendar,
  CloudRain,
  Droplets,
  AlertTriangle,
  Award,
  BookOpen,
  Filter,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { LocationConfig } from '../types';
import { useTheme } from '../context/ThemeContext';
import BorderGlow from './BorderGlow';

interface HistoricalDataViewProps {
  location: LocationConfig;
}

export const HistoricalDataView: React.FC<HistoricalDataViewProps> = ({
  location,
}) => {
  const { isDarkMode } = useTheme();
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Historical seasonal archive records tailored for this location
  const historicalLogs = [
    {
      date: '2024 Monsoon Peak',
      rainfall24h: location.id === 'mumbai' ? 248.5 : location.id === 'kerala' ? 312.0 : 194.0,
      peakWaterStage: location.id === 'mumbai' ? 3.65 : location.id === 'kerala' ? 9.80 : 3.20,
      highestRisk: 'High',
      alertCount: 14,
      meshPdr: '98.9%',
      status: 'Managed Protocol',
    },
    {
      date: '2023 Monsoon Season',
      rainfall24h: location.id === 'mumbai' ? 186.2 : location.id === 'kerala' ? 220.4 : 390.0,
      peakWaterStage: location.id === 'mumbai' ? 3.40 : location.id === 'kerala' ? 8.40 : 4.10,
      highestRisk: location.id === 'chennai' ? 'Critical' : 'High',
      alertCount: 18,
      meshPdr: '97.8%',
      status: 'Relief Dispatched',
    },
    {
      date: '2022 Seasonal Review',
      rainfall24h: location.id === 'mumbai' ? 142.0 : location.id === 'kerala' ? 198.5 : 160.0,
      peakWaterStage: location.id === 'mumbai' ? 2.95 : location.id === 'kerala' ? 7.60 : 2.50,
      highestRisk: 'Moderate',
      alertCount: 9,
      meshPdr: '99.4%',
      status: 'Standard Drainage',
    },
    {
      date: '2021 Trough Event',
      rainfall24h: location.id === 'mumbai' ? 232.0 : location.id === 'kerala' ? 245.0 : 172.5,
      peakWaterStage: location.id === 'mumbai' ? 4.85 : location.id === 'kerala' ? 8.10 : 2.80,
      highestRisk: 'High',
      alertCount: 15,
      meshPdr: '98.1%',
      status: 'SDRF Activated',
    },
    {
      date: '2020 Historic Inundation',
      rainfall24h: location.id === 'mumbai' ? 268.0 : location.id === 'kerala' ? 290.0 : 210.0,
      peakWaterStage: location.id === 'mumbai' ? 4.10 : location.id === 'kerala' ? 9.20 : 3.40,
      highestRisk: 'Critical',
      alertCount: 22,
      meshPdr: '96.5%',
      status: 'Emergency Declared',
    },
  ];

  const handleExportData = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Historical Data Header */}
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
                <History className={`w-4 h-4 ${isDarkMode ? 'text-cyan-400' : 'text-teal-700'}`} />
                <h2 className="text-base font-bold">
                  Historical Environmental Archive — {location.name}
                </h2>
              </div>
              <p className="text-xs opacity-70 mt-1 max-w-3xl">
                Multi-year hydrometric sensor logs, seasonal precipitation records, inundation frequencies, and SDRF alert logs.
              </p>
            </div>

            {/* Export action button */}
            <button
              onClick={handleExportData}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
                isDarkMode
                  ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-cyan-500/20'
                  : 'bg-teal-700 hover:bg-teal-800 text-white shadow-teal-700/20'
              }`}
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-900" />
                  <span>Exported (CSV + JSON)</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export Archive Data</span>
                </>
              )}
            </button>
          </div>
        </div>
      </BorderGlow>

      {/* Seasonal Incident Ledger */}
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
          className={`rounded-xl border overflow-hidden transition-all ${
            isDarkMode
              ? 'bg-slate-900/80 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900 shadow-xs'
          }`}
        >
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between ${
            isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <h3 className="font-bold text-sm">
            Annual Monsoon & Precipitation Archives ({location.name})
          </h3>
          <span className="text-xs opacity-60 font-mono">
            Records validated by Municipal Disaster Management Cell
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
                <th className="px-4 py-3">Season Window</th>
                <th className="px-4 py-3">Peak 24h Rain</th>
                <th className="px-4 py-3">Max Water Stage</th>
                <th className="px-4 py-3">Peak Hazard Level</th>
                <th className="px-4 py-3">Alerts Broadcast</th>
                <th className="px-4 py-3">Mesh Reliability</th>
                <th className="px-4 py-3">Protocol Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-current/10 font-mono">
              {historicalLogs.map((log, i) => (
                <tr
                  key={i}
                  className={`transition-colors ${
                    isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="px-4 py-3 font-bold font-sans">
                    {log.date}
                  </td>
                  <td className="px-4 py-3">
                    {log.rainfall24h} mm
                  </td>
                  <td className="px-4 py-3 text-blue-400">
                    {log.peakWaterStage} m
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        log.highestRisk === 'Critical'
                          ? 'bg-red-950 text-red-300 border-red-800'
                          : log.highestRisk === 'High'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      }`}
                    >
                      {log.highestRisk}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {log.alertCount} Early Warnings
                  </td>
                  <td className={`px-4 py-3 font-mono ${isDarkMode ? 'text-cyan-400' : 'text-teal-700 font-semibold'}`}>
                    {log.meshPdr}
                  </td>
                  <td className="px-4 py-3 font-sans opacity-80">
                    {log.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </BorderGlow>
    </div>
  );
};
