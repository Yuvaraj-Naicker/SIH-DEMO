import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  CheckCircle2,
  AlertOctagon,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { LocationConfig, RiskCategory } from '../types';
import { useTheme } from '../context/ThemeContext';

interface RiskIntelligenceViewProps {
  location: LocationConfig;
}

export const RiskIntelligenceView: React.FC<RiskIntelligenceViewProps> = ({
  location,
}) => {
  const { isDarkMode } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<RiskCategory>(
    location.riskCategories[0]
  );

  const getTrendIcon = (trend: 'rising' | 'steady' | 'falling') => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="w-3.5 h-3.5 text-red-500" />;
      case 'falling':
        return <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Minus className="w-3.5 h-3.5 opacity-50" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'Critical':
        return isDarkMode
          ? 'bg-red-950 text-red-300 border-red-800'
          : 'bg-red-100 text-red-800 border-red-200';
      case 'High':
        return isDarkMode
          ? 'bg-amber-950 text-amber-300 border-amber-800'
          : 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Moderate':
        return isDarkMode
          ? 'bg-blue-950 text-blue-300 border-blue-800'
          : 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return isDarkMode
          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
          : 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Overview Banner */}
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
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-bold">
                Environmental Risk Intelligence — {location.name}
              </h2>
            </div>
            <p className="text-xs opacity-70 mt-1 max-w-3xl">
              Composite multi-variable hazard indices calculated from hydrometeorological sensor feeds, topographic models, tidal tables, and watershed saturation rates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`px-3.5 py-2 rounded-lg border text-right ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-800 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <div className="text-[11px] opacity-60 font-medium">Composite Hazard Index</div>
              <div className="flex items-baseline justify-end gap-1.5 font-mono">
                <span className="text-xl font-bold">
                  {location.liveMetrics.compositeRiskIndex}
                </span>
                <span className="text-xs opacity-60">/100</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ml-1 ${getLevelBadge(location.liveMetrics.compositeRiskLevel)}`}>
                  {location.liveMetrics.compositeRiskLevel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Risk Matrix & Detailed Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (5 cols): Risk Categories List */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 px-1">
            Hazard Domains ({location.riskCategories.length})
          </h3>

          <div className="space-y-2">
            {location.riskCategories.map((cat) => {
              const isSelected = selectedCategory.id === cat.id;

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? isDarkMode
                        ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500'
                        : 'bg-white border-teal-600 shadow-xs ring-1 ring-teal-600'
                      : isDarkMode
                      ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-sm">{cat.name}</h4>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getLevelBadge(cat.level)}`}>
                        {cat.level}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div
                    className={`w-full rounded-full h-2 overflow-hidden mb-2 ${
                      isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                    }`}
                  >
                    <div
                      className={`h-full rounded-full ${
                        cat.level === 'Critical'
                          ? 'bg-red-500'
                          : cat.level === 'High'
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs opacity-70">
                    <span className="font-mono">
                      Score: <strong className="opacity-100">{cat.score}/100</strong>
                    </span>
                    <div className="flex items-center gap-1">
                      <span>Trend:</span>
                      {getTrendIcon(cat.trend)}
                      <span className="capitalize font-medium opacity-90">{cat.trend}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (7 cols): Selected Hazard Detail & Operational Thresholds */}
        <div className="lg:col-span-7 space-y-4">
          <div
            className={`rounded-xl border p-5 transition-all ${
              isDarkMode
                ? 'bg-slate-900/80 border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-3 border-b border-current/10 pb-4 mb-4">
              <div>
                <span className="text-[11px] font-mono uppercase opacity-50">
                  Domain Intelligence
                </span>
                <h3 className="text-base font-bold mt-0.5">
                  {selectedCategory.name}
                </h3>
                <p className="text-xs opacity-70 mt-1 leading-relaxed">
                  {selectedCategory.summary}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className={`text-xs font-bold px-2.5 py-1 rounded border ${getLevelBadge(selectedCategory.level)}`}>
                  {selectedCategory.level} Risk
                </span>
                <div className="text-xs font-mono opacity-60 mt-1">
                  Score: {selectedCategory.score}/100
                </div>
              </div>
            </div>

            {/* Contributing telemetry factors */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 opacity-80">
                  <Activity className={`w-3.5 h-3.5 ${isDarkMode ? 'text-cyan-400' : 'text-teal-700'}`} />
                  <span>Real-Time Contributing Factors</span>
                </h4>
                <div className="space-y-2">
                  {selectedCategory.keyFactors.map((factor, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-2.5 text-xs p-2.5 rounded-lg border ${
                        isDarkMode
                          ? 'bg-slate-950/60 border-slate-800 text-slate-200'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 ${
                          isDarkMode
                            ? 'bg-slate-800 text-cyan-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning Threshold Specification */}
              <div
                className={`p-3.5 rounded-lg border text-xs ${
                  isDarkMode
                    ? 'bg-amber-950/30 border-amber-800 text-amber-200'
                    : 'bg-amber-50/70 border-amber-200 text-amber-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  <AlertOctagon className="w-4 h-4 text-amber-400" />
                  <span>Automated Warning Dispatch Threshold</span>
                </div>
                <p className="leading-relaxed font-mono opacity-90">
                  {selectedCategory.warningThreshold}
                </p>
              </div>

              {/* Monitored Areas Affected */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-80">
                  Zone Vulnerability Index
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {location.monitoredAreas.map((area) => (
                    <div
                      key={area.id}
                      className={`p-2.5 rounded-lg border flex items-center justify-between ${
                        isDarkMode
                          ? 'bg-slate-950/60 border-slate-800'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{area.name}</div>
                        <div className="text-[10px] opacity-60 font-mono">
                          Rain: {area.averageRainfall24hMm}mm | Water: {area.maxWaterLevelM}m
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          area.currentRisk === 'Critical'
                            ? 'bg-red-950 text-red-300 border-red-800'
                            : area.currentRisk === 'High'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}
                      >
                        {area.currentRisk}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
