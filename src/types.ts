export type LocationId = 'mumbai' | 'kerala' | 'chennai' | 'puducherry';

export type NodeType = 'internal' | 'leaf';

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';

export type AlertSeverity = 'critical' | 'warning' | 'advisory';

export interface SensorNode {
  id: string;
  code: string;
  name: string;
  type: NodeType;
  areaId: string;
  lat: number;
  lng: number;
  elevationM: number;
  coverageRadiusKm: number; // ~1.0 km
  hardwareModel: string;
  sensorTypes: string[];
  batteryPercent: number;
  solarVoltageV: number;
  rssiDbm: number; // e.g. -72 dBm
  packetLossPercent: number;
  lastPingSecAgo: number;
  hopsToGateway: number;
  nextHopNodeId?: string; // Node it transmits / hops to
  status: 'online' | 'degraded' | 'offline';
  readings: {
    rainfallMmH: number;
    waterLevelM?: number;
    soilMoisturePercent?: number;
    ambientTempC: number;
    humidityPercent: number;
    windSpeedKmh?: number;
  };
}

export interface MonitoredArea {
  id: string;
  name: string;
  zoneType: string;
  description: string;
  centerLat: number;
  centerLng: number;
  currentRisk: RiskLevel;
  primaryThreat: string;
  nodes: SensorNode[]; // Exactly 1 Internal Node + 4 Leaf Nodes = 5 nodes per area with overlapping mesh coverage
  internalCoverageRadiusKm: number;
  leafCoverageRadiusKm: number;
  averageRainfall24hMm: number;
  maxWaterLevelM: number;
  waterLevelThresholdM: number;
  soilMoisturePercent?: number;
}

export interface RiskCategory {
  id: string;
  name: string;
  score: number; // 0 - 100
  level: RiskLevel;
  trend: 'rising' | 'steady' | 'falling';
  summary: string;
  keyFactors: string[];
  warningThreshold: string;
}

export interface OperationalAlert {
  id: string;
  timestamp: string;
  severity: AlertSeverity;
  areaName: string;
  headline: string;
  description: string;
  recommendedAction: string;
  sensorSource: string;
  acknowledged: boolean;
  dispatchedTo: string[];
}

export interface LocationConfig {
  id: LocationId;
  name: string;
  stateOrUt: string;
  shortDescription: string;
  tagline: string;
  centerLat: number;
  centerLng: number;
  defaultZoom: number;
  activeStatusBadge: {
    level: string;
    label: string;
    color: 'emerald' | 'amber' | 'red';
  };
  keyFocusAreas: string[];
  environmentalSummary: string;
  monitoredAreas: MonitoredArea[];
  riskCategories: RiskCategory[];
  activeAlerts: OperationalAlert[];
  liveMetrics: {
    rainfallRateMmH: number;
    rainfall24hMm: number;
    peakWaterLevelM: number;
    waterDangerMarkM: number;
    ambientTempC: number;
    relativeHumidityPercent: number;
    soilMoisturePercent?: number;
    windSpeedKmh: number;
    windDirection: string;
    barometricPressureHpa: number;
    coastalTideM?: number;
    compositeRiskIndex: number; // 0 - 100
    compositeRiskLevel: RiskLevel;
  };
  analyticsData: {
    rainfallTimeline: { time: string; mm: number; baseline: number }[];
    waterLevelTimeline: { time: string; level: number; dangerMark: number }[];
    riskTrend: { time: string; score: number }[];
    alertsByZone: { zone: string; count: number }[];
    networkUptimePercent: number;
    packetDeliveryRatioPercent: number;
  };
  historicalBenchmarks: {
    id: string;
    eventName: string;
    date: string;
    peakRainfall24hMm: number;
    peakWaterLevelM: number;
    impactSummary: string;
    keyLearnings: string;
  }[];
}
