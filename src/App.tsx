import React, { useState, useEffect } from 'react';
import { LocationId, LocationConfig, SensorNode } from './types';
import { LOCATIONS } from './data/locations';
import { Header } from './components/Header';
import { NavTabId } from './components/Navigation';
import { OverviewView } from './components/OverviewView';
import { LiveMonitoringView } from './components/LiveMonitoringView';
import { RiskIntelligenceView } from './components/RiskIntelligenceView';
import { GeospatialMapView } from './components/GeospatialMapView';
import { NetworkTopologyView } from './components/NetworkTopologyView';
import { AlertsView } from './components/AlertsView';
import { AnalyticsView } from './components/AnalyticsView';
import { HistoricalDataView } from './components/HistoricalDataView';
import { NodeInspectorModal } from './components/NodeInspectorModal';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function DashboardContent() {
  const { isDarkMode } = useTheme();

  // State
  const [currentLocationId, setCurrentLocationId] = useState<LocationId>('mumbai');
  const [activeTab, setActiveTab] = useState<NavTabId>('overview');
  const [selectedNode, setSelectedNode] = useState<SensorNode | null>(null);
  const [locationsData, setLocationsData] = useState<Record<string, LocationConfig>>(LOCATIONS);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  const currentLocation = locationsData[currentLocationId] || locationsData.mumbai;

  // Unacknowledged alerts count
  const unacknowledgedAlertsCount = currentLocation.activeAlerts.filter(
    (a) => !a.acknowledged
  ).length;

  // Live simulation tick to create subtle realistic fluctuations in telemetry
  useEffect(() => {
    if (!isSimulating) return;

    const timer = setInterval(() => {
      setLocationsData((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((locKey) => {
          const loc = next[locKey];
          // Micro variance in live rainfall and water level
          const rainDelta = (Math.random() - 0.5) * 0.4;
          const waterDelta = (Math.random() - 0.5) * 0.02;

          const updatedRain = Math.max(0, Number((loc.liveMetrics.rainfallRateMmH + rainDelta).toFixed(1)));
          const updatedWater = Math.max(0.1, Number((loc.liveMetrics.peakWaterLevelM + waterDelta).toFixed(2)));

          // Update node ping counters and readings
          const updatedAreas = loc.monitoredAreas.map((area) => ({
            ...area,
            nodes: area.nodes.map((n) => ({
              ...n,
              lastPingSecAgo: (n.lastPingSecAgo % 30) + 1,
              readings: {
                ...n.readings,
                rainfallMmH: Math.max(0, Number((n.readings.rainfallMmH + (Math.random() - 0.5) * 0.3).toFixed(1))),
                waterLevelM:
                  n.readings.waterLevelM !== undefined
                    ? Math.max(0.1, Number((n.readings.waterLevelM + (Math.random() - 0.5) * 0.01).toFixed(2)))
                    : undefined,
              },
            })),
          }));

          next[locKey] = {
            ...loc,
            liveMetrics: {
              ...loc.liveMetrics,
              rainfallRateMmH: updatedRain,
              peakWaterLevelM: updatedWater,
            },
            monitoredAreas: updatedAreas,
          };
        });
        return next;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [isSimulating]);

  // Acknowledge alert handler
  const handleAcknowledgeAlert = (alertId: string) => {
    setLocationsData((prev) => {
      const loc = prev[currentLocationId];
      if (!loc) return prev;
      const updatedAlerts = loc.activeAlerts.map((a) =>
        a.id === alertId ? { ...a, acknowledged: true } : a
      );
      return {
        ...prev,
        [currentLocationId]: {
          ...loc,
          activeAlerts: updatedAlerts,
        },
      };
    });
  };

  // Find area for selected node
  const selectedNodeArea = selectedNode
    ? currentLocation.monitoredAreas.find((a) => a.id === selectedNode.areaId)
    : undefined;

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 antialiased ${
        isDarkMode
          ? 'bg-[#070c18] text-slate-100'
          : 'bg-gradient-to-b from-[#dbe5f0] via-[#e2e8f1] to-[#dce5f0] text-slate-900'
      }`}
    >
      {/* Unified Navigation Header matching User's Template Screenshot */}
      <Header
        currentLocation={currentLocation}
        onSelectLocation={(id) => setCurrentLocationId(id)}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        unacknowledgedAlertsCount={unacknowledgedAlertsCount}
        isSimulating={isSimulating}
        onToggleSimulate={() => setIsSimulating(!isSimulating)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewView
            location={currentLocation}
            onNavigate={(tab) => setActiveTab(tab)}
            onSelectNode={(node) => setSelectedNode(node)}
            onSelectLocation={(id) => setCurrentLocationId(id)}
          />
        )}

        {activeTab === 'monitoring' && (
          <LiveMonitoringView
            location={currentLocation}
            onSelectNode={(node) => setSelectedNode(node)}
          />
        )}

        {activeTab === 'risk' && (
          <RiskIntelligenceView location={currentLocation} />
        )}

        {activeTab === 'maps' && (
          <GeospatialMapView
            location={currentLocation}
            onSelectNode={(node) => setSelectedNode(node)}
            onSelectLocation={(id) => setCurrentLocationId(id)}
          />
        )}

        {activeTab === 'topology' && (
          <NetworkTopologyView
            location={currentLocation}
            onSelectNode={(node) => setSelectedNode(node)}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsView
            location={currentLocation}
            onAcknowledgeAlert={handleAcknowledgeAlert}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView location={currentLocation} />
        )}

        {activeTab === 'history' && (
          <HistoricalDataView location={currentLocation} />
        )}
      </main>

      {/* Technical Node Inspector Modal (Opens on node click anywhere) */}
      <NodeInspectorModal
        node={selectedNode}
        area={selectedNodeArea}
        onClose={() => setSelectedNode(null)}
      />

      {/* Professional Status Bar Footer */}
      <footer
        className={`border-t py-3 text-xs transition-colors ${
          isDarkMode
            ? 'bg-slate-950/80 border-slate-900 text-slate-400'
            : 'bg-white border-slate-200 text-slate-600 shadow-xs'
        }`}
      >
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className={`font-semibold ${isDarkMode ? 'text-cyan-400' : 'text-teal-700'}`}>TerraWatch Environmental Mesh</span>
            <span>•</span>
            <span>LoRaWAN IN865 Multi-Hop Scheme</span>
            <span>•</span>
            <span className="text-emerald-500 font-bold">
              {currentLocation.monitoredAreas.reduce((acc, a) => acc + a.nodes.length, 0)}/
              {currentLocation.monitoredAreas.reduce((acc, a) => acc + a.nodes.length, 0)} Nodes Active
            </span>
          </div>
          <div className="font-mono text-[11px] opacity-75">
            Region: {currentLocation.name}, {currentLocation.stateOrUt} (IST)
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DashboardContent />
    </ThemeProvider>
  );
}
