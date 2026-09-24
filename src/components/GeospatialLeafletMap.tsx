import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Radio,
  Wifi,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  Maximize2,
  Minimize2,
  MapPin,
  Sun,
  Moon,
  Shield,
  Flame,
  ArrowRight,
  ArrowUpRight,
  Info,
  X,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';
import { LocationConfig, SensorNode, MonitoredArea, LocationId } from '../types';
import { LOCATIONS } from '../data/locations';
import { useTheme } from '../context/ThemeContext';

interface GeospatialLeafletMapProps {
  location: LocationConfig;
  onSelectNode: (node: SensorNode) => void;
  onSelectLocation?: (locationId: LocationId) => void;
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Zone Classification Definitions
// ---------------------------------------------------------------------------
export type ZoneType = 'critical' | 'risk' | 'normal';

export interface ZoneMeta {
  type: ZoneType;
  label: string;
  badgeTitle: string;
  color: string;
  fillColor: string;
  borderClass: string;
  textClass: string;
  bgClass: string;
  badgeIcon: string;
  description: string;
}

export function getZoneMeta(area: MonitoredArea): ZoneMeta {
  if (area.currentRisk === 'Critical') {
    return {
      type: 'critical',
      label: 'Critical Zone',
      badgeTitle: 'CRITICAL ZONE',
      color: '#ef4444',
      fillColor: '#dc2626',
      borderClass: 'border-red-500',
      textClass: 'text-red-400',
      bgClass: 'bg-red-950/90 text-red-200 border-red-500',
      badgeIcon: '🚨',
      description: 'Danger threshold breached · Flash inundation evacuation alert',
    };
  }
  if (area.currentRisk === 'High' || area.currentRisk === 'Moderate') {
    return {
      type: 'risk',
      label: 'Risk Zone',
      badgeTitle: 'RISK ZONE',
      color: '#f59e0b',
      fillColor: '#d97706',
      borderClass: 'border-amber-500',
      textClass: 'text-amber-400',
      bgClass: 'bg-amber-950/90 text-amber-200 border-amber-500',
      badgeIcon: '⚠️',
      description: 'Elevated hydrometric readings · Active inundation vigilance',
    };
  }
  return {
    type: 'normal',
    label: 'Normal Zone',
    badgeTitle: 'NORMAL ZONE',
    color: '#10b981',
    fillColor: '#059669',
    borderClass: 'border-emerald-500',
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-950/90 text-emerald-200 border-emerald-500',
    badgeIcon: '✅',
    description: 'Safe baseline readings · Telemetry nominal',
  };
}

// ---------------------------------------------------------------------------
// Hopping Method Configurations
// ---------------------------------------------------------------------------
export type HoppingMethodId = 'adaptive-mesh' | 'direct-star' | 'emergency-flood';

export interface HoppingMethodConfig {
  id: HoppingMethodId;
  name: string;
  shortLabel: string;
  protocol: string;
  frequency: string;
  spreadingFactor: string;
  txPower: string;
  hopDescription: string;
  expectedLatencyMs: number;
  pdrPercent: number;
  sensitivityDbm: number;
  badgeTone: 'cyan' | 'emerald' | 'amber';
}

export const HOPPING_METHODS: Record<HoppingMethodId, HoppingMethodConfig> = {
  'adaptive-mesh': {
    id: 'adaptive-mesh',
    name: 'Adaptive Multi-Hop Mesh (RPL / ETX)',
    shortLabel: 'Multi-Hop Mesh',
    protocol: 'LoRaWAN Mesh (RFC 6550 RPL + ETX Metric)',
    frequency: '865.0 - 867.0 MHz (India IN865 Band)',
    spreadingFactor: 'SF7 (Probe Hop) ➔ SF9 (Gateway Relay)',
    txPower: '14 dBm (25 mW EIRP Compliant)',
    hopDescription: 'Leaf Node ➔ Local Gateway Router ➔ Cluster Coordinator ➔ 4G/Cloud Edge',
    expectedLatencyMs: 340,
    pdrPercent: 99.8,
    sensitivityDbm: -131,
    badgeTone: 'cyan',
  },
  'direct-star': {
    id: 'direct-star',
    name: 'Direct Star-Hop (Point-to-Point)',
    shortLabel: 'Direct Star-Hop',
    protocol: 'LoRaWAN Class A Point-to-Point Uplink',
    frequency: '865.2 MHz Fixed Carrier',
    spreadingFactor: 'SF7 / 125 kHz Fast Uplink',
    txPower: '14 dBm Standard Power',
    hopDescription: 'Leaf Node ➔ Direct Sector Gateway (Single Hop ACK)',
    expectedLatencyMs: 110,
    pdrPercent: 98.6,
    sensitivityDbm: -126,
    badgeTone: 'emerald',
  },
  'emergency-flood': {
    id: 'emergency-flood',
    name: 'Emergency Flood-Hop (High Penetration SF10)',
    shortLabel: 'Emergency Flood-Hop',
    protocol: 'Dynamic Multi-Path Flooding & Rain Attenuation Boost',
    frequency: '866.5 MHz Emergency Channel',
    spreadingFactor: 'SF10 / 125 kHz High Coding Rate (CR 4/8)',
    txPower: '18 dBm (+4dB Monsoon Torrent Penetration)',
    hopDescription: 'Multi-path redundant relay cutting through extreme cloud bursts & foliage',
    expectedLatencyMs: 650,
    pdrPercent: 99.9,
    sensitivityDbm: -137,
    badgeTone: 'amber',
  },
};

// ---------------------------------------------------------------------------
// Helper: Construct Realistic Catchment Zone Polygon Enclosing Area Nodes
// ---------------------------------------------------------------------------
function getAreaZonePolygon(area: MonitoredArea): [number, number][] {
  const cLat = area.centerLat;
  const cLng = area.centerLng;

  // Geographic boundary clamping to guarantee polygon vertices stay strictly on land
  const clampCoord = (lat: number, lng: number): [number, number] => {
    let latClamped = lat;
    let lngClamped = lng;
    // Puducherry bounds (Sea to East)
    if (latClamped >= 11.80 && latClamped <= 12.08 && lngClamped > 79.835) lngClamped = 79.832;
    // Chennai bounds (Sea to East)
    if (latClamped >= 12.80 && latClamped <= 13.25 && lngClamped > 80.272) lngClamped = 80.264;
    // Mumbai bounds (Sea to West)
    if (latClamped >= 18.85 && latClamped <= 19.35 && lngClamped < 72.825) lngClamped = 72.831;
    // Kerala bounds (Sea to West)
    if (latClamped >= 8.30 && latClamped <= 12.60 && lngClamped < 76.220) lngClamped = 76.260;
    return [Number(latClamped.toFixed(5)), Number(lngClamped.toFixed(5))];
  };

  // Organic 8-point catchment polygon envelope
  const offsets: [number, number][] = [
    [0.0084, 0.0000],   // North
    [0.0062, 0.0065],   // North-East
    [0.0000, 0.0082],   // East
    [-0.0062, 0.0068],  // South-East
    [-0.0084, 0.0000],  // South
    [-0.0065, -0.0064], // South-West
    [0.0000, -0.0082],  // West
    [0.0064, -0.0062],  // North-West
  ];

  return offsets.map(([dLat, dLng]) => clampCoord(cLat + dLat, cLng + dLng));
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export const GeospatialLeafletMap: React.FC<GeospatialLeafletMapProps> = ({
  location,
  onSelectNode,
  onSelectLocation,
  compact = false,
}) => {
  const { isDarkMode } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const animationIntervalRef = useRef<number | null>(null);

  // States
  const [showLiveNetwork, setShowLiveNetwork] = useState(true);
  const [showCoverageCircles, setShowCoverageCircles] = useState(true); // Enabled: All internal + leaf node circles overlapping
  const [showZones, setShowZones] = useState(true);
  const [touchedZoneAreaId, setTouchedZoneAreaId] = useState<string | null>(null);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<'none' | 'all' | ZoneType>('none'); // Off by default: show on touch or filter selection
  const [selectedAreaForInspection, setSelectedAreaForInspection] = useState<MonitoredArea | null>(null);
  const [showHoppingPanel, setShowHoppingPanel] = useState<boolean>(false); // Only show when user touches leaf node or clicks simulator button

  // Hopping Method Selection
  const [activeHoppingMethodId, setActiveHoppingMethodId] = useState<HoppingMethodId>('adaptive-mesh');
  const [showHoppingSpecModal, setShowHoppingSpecModal] = useState(false);

  // Map tile style: 'auto' (follows theme), 'streets' (OpenStreetMap), 'dark' (CartoDB Dark)
  const [mapStyleOverride, setMapStyleOverride] = useState<'auto' | 'streets' | 'dark'>('auto');
  const [selectedLeafNodeId, setSelectedLeafNodeId] = useState<string>('');
  const [transmissionStatus, setTransmissionStatus] = useState<string>(
    'READY - Select Leaf Node and Hopping Method, then click Transmit to view live multi-hop propagation.'
  );
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [currentHopStep, setCurrentHopStep] = useState<number>(0);

  // Resolve effective tile style
  const effectiveTileStyle =
    mapStyleOverride === 'auto'
      ? isDarkMode
        ? 'dark'
        : 'streets'
      : mapStyleOverride;

  const currentHoppingMethod = HOPPING_METHODS[activeHoppingMethodId];

  // All nodes from current location
  const allNodes = location.monitoredAreas.flatMap((a) => a.nodes);
  const leafNodes = allNodes.filter((n) => n.type === 'leaf');
  const internalNodes = allNodes.filter((n) => n.type === 'internal');

  // Currently selected leaf node for transmission
  const activeLeafNode =
    leafNodes.find((n) => n.id === selectedLeafNodeId) || leafNodes[0];

  // The local internal gateway node it hops to
  const targetInternalNode = activeLeafNode
    ? internalNodes.find(
        (n) => n.code === activeLeafNode.nextHopNodeId || n.id === activeLeafNode.nextHopNodeId
      ) ||
      internalNodes.find((n) => n.areaId === activeLeafNode.areaId) ||
      internalNodes[0]
    : null;

  // The backbone coordinator internal node (for multi-hop mesh Hop 2)
  const clusterHubNode =
    internalNodes.find((n) => n.id !== targetInternalNode?.id && (n.hopsToGateway === 0 || n.code === 'IN-01')) ||
    internalNodes[0];

  // Filtered areas based on Zone Filter
  const filteredAreas = location.monitoredAreas.filter((area) => {
    if (selectedZoneFilter === 'all') return true;
    const meta = getZoneMeta(area);
    return meta.type === selectedZoneFilter;
  });

  // Zone counts
  const criticalCount = location.monitoredAreas.filter((a) => getZoneMeta(a).type === 'critical').length;
  const riskCount = location.monitoredAreas.filter((a) => getZoneMeta(a).type === 'risk').length;
  const normalCount = location.monitoredAreas.filter((a) => getZoneMeta(a).type === 'normal').length;

  // Set default selected leaf node on mount or location change
  useEffect(() => {
    if (leafNodes.length > 0 && !leafNodes.some((n) => n.id === selectedLeafNodeId)) {
      setSelectedLeafNodeId(leafNodes[0].id);
    }
  }, [location.id, leafNodes]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [location.centerLat, location.centerLng],
        zoom: location.defaultZoom || 13,
        zoomControl: true,
        attributionControl: false,
      });

      mapInstanceRef.current = map;
      layerGroupRef.current = L.layerGroup().addTo(map);
    } else {
      mapInstanceRef.current.setView(
        [location.centerLat, location.centerLng],
        location.defaultZoom || 13,
        { animate: true }
      );
    }
  }, [location.id, location.defaultZoom, location.centerLat, location.centerLng]);

  // Update map tile layer when effectiveTileStyle changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    if (effectiveTileStyle === 'dark') {
      const darkLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 19,
          subdomains: 'abcd',
        }
      );
      darkLayer.addTo(map);
      tileLayerRef.current = darkLayer;
    } else {
      const streetLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      });
      streetLayer.addTo(map);
      tileLayerRef.current = streetLayer;
    }
  }, [effectiveTileStyle]);

  // Helper: Haversine distance in meters between two lat/lng points
  const getDistanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // ---------------------------------------------------------------------------
  // Render Map Elements (Zones, Coverage Circles, Hopping Links, Node Markers)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    const isLightMap = effectiveTileStyle === 'streets';

    // -------------------------------------------------------------------------
    // 1. RENDER CRITICAL ZONE, RISK ZONE & NORMAL ZONE POLYGONS + BADGES
    // CONDITIONAL SHADING: ONLY SHOW VIBRANT SHADING WHEN TOUCHED / SELECTED
    // -------------------------------------------------------------------------
    if (showZones) {
      location.monitoredAreas.forEach((area) => {
        const meta = getZoneMeta(area);
        const isAreaSelected =
          selectedAreaForInspection?.id === area.id || touchedZoneAreaId === area.id;
        const isFilterActive = selectedZoneFilter !== 'none';
        const isFilterMatch =
          isFilterActive && (selectedZoneFilter === 'all' || meta.type === selectedZoneFilter);

        // Zone shading only appears when touched, inspected, or actively selected in filter
        const shouldShowShading = isAreaSelected || isFilterMatch;

        const polygonCoords = getAreaZonePolygon(area);

        // Visual styles: If not touched, keep zero fill opacity to avoid clutter
        const strokeColor = shouldShowShading
          ? meta.color
          : isLightMap
          ? '#94a3b8'
          : '#475569';
        const fillColor = meta.fillColor;
        const fillOpacity = shouldShowShading
          ? isAreaSelected
            ? 0.38
            : meta.type === 'critical'
            ? isLightMap ? 0.24 : 0.28
            : meta.type === 'risk'
            ? isLightMap ? 0.18 : 0.20
            : isLightMap ? 0.12 : 0.14
          : 0; // ZERO FILL OPACITY UNLESS TOUCHED!

        const weight = shouldShowShading ? (isAreaSelected ? 3.5 : 2.5) : 1.2;
        const dashArray = shouldShowShading
          ? meta.type === 'critical'
            ? '6, 5'
            : meta.type === 'risk'
            ? '8, 6'
            : undefined
          : '4, 4';

        // Create polygon
        const zonePolygon = L.polygon(polygonCoords, {
          color: strokeColor,
          fillColor: fillColor,
          fillOpacity: fillOpacity,
          weight: weight,
          dashArray: dashArray,
        }).addTo(layerGroup);

        // Interactive tooltip on hover
        zonePolygon.bindTooltip(
          `<div class="text-xs font-sans p-1">
            <div class="flex items-center gap-1.5 font-bold mb-1" style="color: ${meta.color};">
              <span>${meta.badgeIcon}</span>
              <span class="tracking-wider uppercase text-[11px] font-mono">${meta.badgeTitle}</span>
            </div>
            <div class="font-bold text-white text-xs">${area.name}</div>
            <div class="text-[11px] text-slate-300 mt-1">
              Water Level: <b>${area.maxWaterLevelM}m</b> (Danger: ${area.waterLevelThresholdM}m)
            </div>
            <div class="text-[10px] text-slate-400 mt-0.5">${meta.description}</div>
            <div class="text-[9px] text-cyan-400 font-mono mt-1">Touch/Click zone to highlight & view boundary</div>
          </div>`,
          { direction: 'top', className: 'bg-slate-950/95 text-slate-100 border border-slate-700 rounded shadow-xl px-2 py-1' }
        );

        zonePolygon.on('click', () => {
          setTouchedZoneAreaId(area.id);
          setSelectedAreaForInspection(area);
        });

        // ONLY render floating center badge when zone is touched or actively filtered
        if (shouldShowShading) {
          const badgeHtml = `
            <div class="group cursor-pointer select-none transition-transform hover:scale-105" title="${area.name}">
              <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg border backdrop-blur-md ${
                meta.type === 'critical'
                  ? 'bg-red-950/95 text-red-200 border-red-500 shadow-red-500/40 ring-2 ring-red-400/40 animate-pulse'
                  : meta.type === 'risk'
                  ? 'bg-amber-950/95 text-amber-200 border-amber-500 shadow-amber-500/20'
                  : 'bg-emerald-950/95 text-emerald-200 border-emerald-500 shadow-emerald-500/20'
              }">
                <span class="text-xs">${meta.badgeIcon}</span>
                <span class="text-[9px] font-black font-mono tracking-wider uppercase whitespace-nowrap">${meta.badgeTitle}</span>
              </div>
              <div class="mt-0.5 text-center">
                <span class="text-[8px] font-medium font-sans px-1.5 py-0.2 rounded bg-slate-950/80 text-slate-200 border border-slate-800/80 whitespace-nowrap shadow-xs">
                  ${area.name.split('&')[0]?.split('—')[0]?.trim()?.slice(0, 16)}
                </span>
              </div>
            </div>
          `;

          const zoneBadgeIcon = L.divIcon({
            className: 'zone-floating-badge',
            html: badgeHtml,
            iconSize: [120, 36],
            iconAnchor: [60, 18],
          });

          const zoneBadgeMarker = L.marker([area.centerLat, area.centerLng], {
            icon: zoneBadgeIcon,
            zIndexOffset: 100,
          }).addTo(layerGroup);

          zoneBadgeMarker.on('click', () => {
            setTouchedZoneAreaId(area.id);
            setSelectedAreaForInspection(area);
          });
        }
      });
    }

    // -------------------------------------------------------------------------
    // 2. RENDER OVERLAPPING COVERAGE CIRCLES (ALL INTERNAL + LEAF NODES)
    // -------------------------------------------------------------------------
    if (showCoverageCircles) {
      allNodes.forEach((node) => {
        const isInternal = node.type === 'internal';
        const isSelected = activeLeafNode?.id === node.id || targetInternalNode?.id === node.id;

        // Calculate distance to nearest neighboring node to ensure circles overlap seamlessly
        let nearestDist = Infinity;
        for (const other of allNodes) {
          if (other.id === node.id) continue;
          const d = getDistanceMeters(node.lat, node.lng, other.lat, other.lng);
          if (d < nearestDist) {
            nearestDist = d;
          }
        }

        // To guarantee adjacent nodes visibly overlap, set radius to comfortably exceed
        // half the distance to adjacent neighbors (75%-95% factor or default base range)
        const overlapFactor = isInternal ? 0.95 : 0.75;
        const minOverlapRadiusMeters = nearestDist < Infinity ? Math.round(nearestDist * overlapFactor) : 1800;
        const baseRadiusMeters = (node.coverageRadiusKm || (isInternal ? 2.5 : 1.75)) * 1000;
        const radiusMeters = Math.max(baseRadiusMeters, minOverlapRadiusMeters, 1500);

        const circleColor = isSelected
          ? '#00f0ff'
          : isInternal
          ? isLightMap
            ? '#0284c7'
            : '#38bdf8'
          : isLightMap
          ? '#0d9488'
          : '#2dd4bf';

        const circleFill = isInternal
          ? isLightMap ? '#0284c7' : '#0ea5e9'
          : isLightMap ? '#0d9488' : '#14b8a6';

        const circle = L.circle([node.lat, node.lng], {
          radius: radiusMeters,
          color: circleColor,
          fillColor: circleFill,
          fillOpacity: isSelected
            ? isLightMap ? 0.20 : 0.16
            : isLightMap
            ? (isInternal ? 0.08 : 0.06)
            : (isInternal ? 0.07 : 0.05),
          weight: isSelected ? 2.6 : isInternal ? 1.6 : 1.2,
          dashArray: isSelected ? undefined : isInternal ? '6, 5' : '4, 4',
        }).addTo(layerGroup);

        circle.bindTooltip(
          `<div class="text-xs font-sans font-medium">
            <span class="font-bold font-mono ${isInternal ? 'text-sky-400' : 'text-teal-400'}">${node.code}</span>
            — ${isInternal ? 'Central Gateway Hub' : 'Field Sensor Probe'}: <b>${(radiusMeters / 1000).toFixed(2)} km</b>
            <div class="text-[10px] text-slate-400 mt-0.5">LoRaWAN 865MHz Overlapping Sector (${node.type.toUpperCase()})</div>
          </div>`,
          { direction: 'top', className: 'bg-slate-950/95 text-slate-100 border border-slate-700 rounded shadow-lg px-2 py-1' }
        );

        circle.on('click', () => {
          if (node.type === 'leaf') {
            setSelectedLeafNodeId(node.id);
            setShowHoppingPanel(true);
          }
          onSelectNode(node);
        });
      });
    }

    // -------------------------------------------------------------------------
    // 3. RENDER HOPPING TRANSMISSION LINES (Leaf ➔ Gateway ➔ Backbone Hub)
    // -------------------------------------------------------------------------
    if (showLiveNetwork) {
      const allNodesMap = new Map<string, SensorNode>();
      allNodes.forEach((n) => {
        allNodesMap.set(n.id, n);
        allNodesMap.set(n.code, n);
      });

      allNodes.forEach((node) => {
        if (!node.nextHopNodeId) return;
        const target = allNodesMap.get(node.nextHopNodeId);
        if (!target) return;

        const isInternalBackbone = node.type === 'internal' && target.type === 'internal';
        const isSelectedHop1 =
          activeLeafNode &&
          targetInternalNode &&
          node.id === activeLeafNode.id &&
          target.id === targetInternalNode.id;

        const isSelectedHop2 =
          activeHoppingMethodId !== 'direct-star' &&
          targetInternalNode &&
          clusterHubNode &&
          node.id === targetInternalNode.id &&
          target.id === clusterHubNode.id;

        const isHighlighted = isSelectedHop1 || isSelectedHop2;

        L.polyline(
          [
            [node.lat, node.lng],
            [target.lat, target.lng],
          ],
          {
            color: isSelectedHop1
              ? '#00f0ff'
              : isSelectedHop2
              ? '#38bdf8'
              : isInternalBackbone
              ? isLightMap
                ? '#0284c7'
                : '#38bdf8'
              : isLightMap
              ? '#64748b'
              : '#475569',
            weight: isHighlighted ? 3.6 : isInternalBackbone ? 2.4 : 1.6,
            dashArray: isHighlighted ? '5, 4' : isInternalBackbone ? '6, 5' : '3, 3',
            opacity: isHighlighted ? 1 : isInternalBackbone ? 0.85 : 0.70,
          }
        ).addTo(layerGroup);
      });
    }

    // -------------------------------------------------------------------------
    // 4. RENDER NODE MARKERS (Internal Gateway Routers & Leaf Probes)
    // -------------------------------------------------------------------------
    allNodes.forEach((node) => {
      const isInternal = node.type === 'internal';
      const isSelected = activeLeafNode?.id === node.id || targetInternalNode?.id === node.id;
      const isHub = node.id === clusterHubNode?.id;

      let iconHtml = '';

      if (isInternal) {
        // Internal Node: Square navy box with "IN" inside, cyan border
        iconHtml = `
          <div class="relative group cursor-pointer">
            <div class="w-8 h-8 rounded-md ${
              isSelected
                ? 'bg-sky-950 ring-3 ring-cyan-400 shadow-xl shadow-cyan-500/50'
                : 'bg-slate-950 border-2 border-sky-400 shadow-lg'
            } flex flex-col items-center justify-center text-white transition-all transform hover:scale-115">
              <span class="text-[11px] font-black font-mono tracking-tight text-cyan-300">IN</span>
            </div>
            <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.2 rounded bg-slate-950/95 text-sky-200 text-[8px] font-mono border border-slate-700 shadow-xs">
              ${node.code} ${isHub ? '★ HUB' : ''}
            </div>
          </div>
        `;
      } else {
        // Leaf Node: Circular badge with "LN" inside, color reflects sensor state
        const isElevated =
          node.readings.rainfallMmH > 15 ||
          (node.readings.waterLevelM && node.readings.waterLevelM > 2.0);
        const borderColor = isElevated ? '#f59e0b' : '#22c55e';
        const bgColor = isElevated ? '#451a03' : '#022c22';
        const textColor = isElevated ? '#fbbf24' : '#4ade80';

        iconHtml = `
          <div class="relative group cursor-pointer">
            <div class="w-6 h-6 rounded-full flex items-center justify-center ${
              isSelected ? 'ring-3 ring-cyan-300 shadow-lg shadow-teal-400/60' : 'shadow-md'
            } transition-all transform hover:scale-125" style="background-color: ${bgColor}; border: 2.2px solid ${borderColor};">
              <span class="text-[8px] font-black font-mono" style="color: ${textColor};">LN</span>
            </div>
            <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap px-1 py-0.2 rounded bg-slate-950/95 text-teal-200 text-[8px] font-mono border border-slate-700 shadow-xs">
              ${node.code}
            </div>
          </div>
        `;
      }

      const customIcon = L.divIcon({
        className: 'custom-node-marker',
        html: iconHtml,
        iconSize: isInternal ? [32, 32] : [24, 24],
        iconAnchor: isInternal ? [16, 16] : [12, 12],
      });

      const marker = L.marker([node.lat, node.lng], { icon: customIcon }).addTo(layerGroup);

      marker.on('click', () => {
        if (node.type === 'leaf') {
          setSelectedLeafNodeId(node.id);
          setShowHoppingPanel(true);
        }
        onSelectNode(node);
      });
    });
  }, [
    location.id,
    showZones,
    touchedZoneAreaId,
    selectedZoneFilter,
    selectedAreaForInspection,
    showLiveNetwork,
    showCoverageCircles,
    selectedLeafNodeId,
    activeHoppingMethodId,
    effectiveTileStyle,
    isDarkMode,
  ]);

  // ---------------------------------------------------------------------------
  // Transmit Data: Step-by-Step Multi-Hop Simulation Along the Physical Links
  // ---------------------------------------------------------------------------
  const handleTransmitData = () => {
    if (!activeLeafNode || !targetInternalNode || !mapInstanceRef.current) return;
    setIsTransmitting(true);
    setCurrentHopStep(1);

    const map = mapInstanceRef.current;
    const method = currentHoppingMethod;

    // Pulse marker for animated packet
    const pulseIcon = L.divIcon({
      className: 'packet-pulse-marker',
      html: `
        <div class="w-4 h-4 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400 animate-ping"></div>
        <div class="w-3 h-3 rounded-full bg-white border-2 border-cyan-300 absolute top-0.5 left-0.5"></div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    // Phase 1: Hop 1 from Leaf Node ➔ Local Gateway Router
    const startPoint = L.latLng(activeLeafNode.lat, activeLeafNode.lng);
    const endPointHop1 = L.latLng(targetInternalNode.lat, targetInternalNode.lng);
    const packetMarker = L.marker(startPoint, { icon: pulseIcon }).addTo(map);

    setTransmissionStatus(
      `[HOP 1 IN PROGRESS] ${method.shortLabel}: Leaf ${activeLeafNode.code} transmitting 32B payload (${method.spreadingFactor.split('➔')[0].trim()}, 865MHz) to Gateway Router ${targetInternalNode.code}...`
    );

    let step = 0;
    const stepsHop1 = 28;
    const intervalMs = 28;

    if (animationIntervalRef.current) {
      window.clearInterval(animationIntervalRef.current);
    }

    animationIntervalRef.current = window.setInterval(() => {
      step += 1;
      const ratio = step / stepsHop1;

      const currentLat = startPoint.lat + (endPointHop1.lat - startPoint.lat) * ratio;
      const currentLng = startPoint.lng + (endPointHop1.lng - startPoint.lng) * ratio;
      packetMarker.setLatLng([currentLat, currentLng]);

      if (step >= stepsHop1) {
        if (animationIntervalRef.current) {
          window.clearInterval(animationIntervalRef.current);
          animationIntervalRef.current = null;
        }

        // If Direct Star-Hop, we finish at Hop 1!
        if (activeHoppingMethodId === 'direct-star' || !clusterHubNode || clusterHubNode.id === targetInternalNode.id) {
          map.removeLayer(packetMarker);
          setIsTransmitting(false);
          setCurrentHopStep(0);
          setTransmissionStatus(
            `SUCCESS [DIRECT STAR-HOP COMPLETE]: Single-hop ACK from Gateway ${targetInternalNode.code}. Latency: 110ms, RSSI: ${activeLeafNode.rssiDbm} dBm, PDR: ${method.pdrPercent}%. Readings: Rain ${activeLeafNode.readings.rainfallMmH} mm/h, Stage ${activeLeafNode.readings.waterLevelM || 1.2}m.`
          );
        } else {
          // Phase 2: Hop 2 from Local Gateway ➔ Cluster Backbone Hub Router
          setCurrentHopStep(2);
          setTransmissionStatus(
            `[HOP 1 VERIFIED ➔ HOP 2 IN PROGRESS] Relay Gateway ${targetInternalNode.code} forwarding packet across mesh corridor to Hub ${clusterHubNode.code}...`
          );

          let step2 = 0;
          const stepsHop2 = 28;
          const hop2Start = endPointHop1;
          const hop2End = L.latLng(clusterHubNode.lat, clusterHubNode.lng);

          animationIntervalRef.current = window.setInterval(() => {
            step2 += 1;
            const ratio2 = step2 / stepsHop2;
            const lat2 = hop2Start.lat + (hop2End.lat - hop2Start.lat) * ratio2;
            const lng2 = hop2Start.lng + (hop2End.lng - hop2Start.lng) * ratio2;
            packetMarker.setLatLng([lat2, lng2]);

            if (step2 >= stepsHop2) {
              if (animationIntervalRef.current) {
                window.clearInterval(animationIntervalRef.current);
                animationIntervalRef.current = null;
              }
              map.removeLayer(packetMarker);
              setIsTransmitting(false);
              setCurrentHopStep(0);
              setTransmissionStatus(
                `SUCCESS [MULTI-HOP END-TO-END VERIFIED]: 2 Hops traversed (${activeLeafNode.code} ➔ ${targetInternalNode.code} ➔ ${clusterHubNode.code} ➔ 4G Cloud). Total Latency: ${method.expectedLatencyMs}ms, PDR: ${method.pdrPercent}%, RSSI: ${activeLeafNode.rssiDbm} dBm, CRC: OK (0x9AF4).`
              );
            }
          }, intervalMs);
        }
      }
    }, intervalMs);
  };

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden border shadow-xl transition-colors ${
        isDarkMode
          ? 'border-slate-800 bg-slate-950 text-white'
          : 'border-slate-300 bg-slate-100 text-slate-900 shadow-slate-300/50'
      }`}
    >
      {/* ========================================================================= */}
      {/* MAP HEADER OVERLAY BAR                                                    */}
      {/* ========================================================================= */}
      <div
        className={`px-4 sm:px-5 py-3 border-b flex flex-col xl:flex-row xl:items-center justify-between gap-3 z-10 relative backdrop-blur-md transition-colors ${
          isDarkMode
            ? 'bg-slate-950/95 border-slate-800/80 text-white'
            : 'bg-white/95 border-slate-300/80 text-slate-900 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
              <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>
                {location.name} Geospatial Catchment & LoRa Map
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isDarkMode
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                    : 'bg-teal-50 text-teal-800 border-teal-300 font-semibold'
                }`}
              >
                IN865 Band
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Interactive demarcations for Critical, Risk, and Normal Zones + multi-hop packet propagation.
            </p>
          </div>
        </div>

        {/* State Switcher & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* State Switcher Pills */}
          <div
            className={`flex items-center p-1 rounded-lg border ${
              isDarkMode
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-slate-100 border-slate-300'
            }`}
          >
            <span
              className={`text-[10px] font-bold px-2 uppercase tracking-wider hidden sm:inline ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              State:
            </span>
            {Object.values(LOCATIONS).map((loc) => {
              const isSelected = loc.id === location.id;
              return (
                <button
                  key={loc.id}
                  onClick={() => onSelectLocation && onSelectLocation(loc.id)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    isSelected
                      ? isDarkMode
                        ? 'bg-cyan-600 text-white shadow-xs font-bold'
                        : 'bg-teal-700 text-white shadow-xs font-bold'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200'
                  }`}
                >
                  {loc.name}
                </button>
              );
            })}
          </div>

          {/* Map Tile Style Toggle */}
          <button
            onClick={() => {
              setMapStyleOverride((prev) => {
                if (prev === 'auto') return isDarkMode ? 'streets' : 'dark';
                if (prev === 'streets') return 'dark';
                return 'streets';
              });
            }}
            className={`px-3 py-1.5 rounded text-xs font-semibold tracking-wider flex items-center gap-1.5 transition-all border ${
              effectiveTileStyle === 'streets'
                ? isDarkMode
                  ? 'bg-amber-950/80 text-amber-300 border-amber-600 shadow-xs'
                  : 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs font-bold'
                : isDarkMode
                ? 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            }`}
            title="Toggle between OpenStreetMap Streets and Dark CartoDB Tiles"
          >
            {effectiveTileStyle === 'streets' ? (
              <>
                <Sun className={`w-3.5 h-3.5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                <span>STREET MAP</span>
              </>
            ) : (
              <>
                <Moon className={`w-3.5 h-3.5 ${isDarkMode ? 'text-cyan-400' : 'text-slate-700'}`} />
                <span>DARK MAP</span>
              </>
            )}
          </button>

          {/* Hopping Method Quick-Spec Trigger */}
          <button
            onClick={() => setShowHoppingSpecModal(!showHoppingSpecModal)}
            className={`px-3 py-1.5 rounded text-xs font-semibold tracking-wider flex items-center gap-1.5 transition-all border ${
              showHoppingSpecModal
                ? isDarkMode
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500 ring-2 ring-cyan-500/30'
                  : 'bg-teal-100 text-teal-950 border-teal-600 ring-2 ring-teal-500/20'
                : isDarkMode
                ? 'bg-slate-900 text-cyan-400 border-slate-800 hover:border-cyan-700'
                : 'bg-white text-teal-800 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>HOPPING METHOD</span>
          </button>

          {/* Reset Map View */}
          <button
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.setView(
                  [location.centerLat, location.centerLng],
                  location.defaultZoom || 13,
                  { animate: true }
                );
              }
            }}
            className={`px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
              isDarkMode
                ? 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850 hover:text-white'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            RESET
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECONDARY TOOLBAR: ZONE FILTERING & LAYER TOGGLES                          */}
      {/* ========================================================================= */}
      <div
        className={`px-4 sm:px-5 py-2 border-b flex flex-wrap items-center justify-between gap-3 text-xs z-10 relative transition-colors ${
          isDarkMode
            ? 'bg-slate-900/90 border-slate-800/80 text-slate-300'
            : 'bg-slate-50/95 border-slate-300/80 text-slate-800'
        }`}
      >
        {/* Zone Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-[10px] uppercase tracking-wider opacity-60 mr-1 flex items-center gap-1">
            <Layers className="w-3 h-3" />
            <span>Zones on Map:</span>
          </span>

          <button
            onClick={() => setSelectedZoneFilter('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border ${
              selectedZoneFilter === 'all'
                ? isDarkMode
                  ? 'bg-slate-800 text-white border-slate-600 shadow-xs'
                  : 'bg-slate-800 text-white border-slate-900 shadow-xs'
                : isDarkMode
                ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
            }`}
          >
            All Zones ({location.monitoredAreas.length})
          </button>

          <button
            onClick={() => setSelectedZoneFilter('critical')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all border ${
              selectedZoneFilter === 'critical'
                ? 'bg-red-600 text-white border-red-700 shadow-xs'
                : isDarkMode
                ? 'bg-red-950/40 text-red-300 border-red-900/60 hover:bg-red-950/80'
                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
            }`}
          >
            <span>🚨 Critical Zone</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-red-950 text-red-200 border border-red-800">
              {criticalCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedZoneFilter('risk')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all border ${
              selectedZoneFilter === 'risk'
                ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                : isDarkMode
                ? 'bg-amber-950/40 text-amber-300 border-amber-900/60 hover:bg-amber-950/80'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span>⚠️ Risk Zone</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-950 text-amber-200 border border-amber-800">
              {riskCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedZoneFilter('normal')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all border ${
              selectedZoneFilter === 'normal'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                : isDarkMode
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/60 hover:bg-emerald-950/80'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span>✅ Normal Zone</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-950 text-emerald-200 border border-emerald-800">
              {normalCount}
            </span>
          </button>

          {/* Clear Shading button if zone is touched or filtered */}
          {(touchedZoneAreaId !== null || selectedZoneFilter !== 'none' || selectedAreaForInspection !== null) && (
            <button
              onClick={() => {
                setTouchedZoneAreaId(null);
                setSelectedZoneFilter('none');
                setSelectedAreaForInspection(null);
              }}
              className="px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all border bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
              title="Clear Active Zone Shading"
            >
              <X className="w-3 h-3" />
              <span>Clear Shading</span>
            </button>
          )}
        </div>

        {/* Feature Toggles & Simulator Open Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHoppingPanel(!showHoppingPanel)}
            className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all border ${
              showHoppingPanel
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-xs'
                : isDarkMode
                ? 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
            }`}
            title="Toggle LoRa Hopping Transmission Panel"
          >
            <Radio className="w-3 h-3 text-cyan-400" />
            <span>{showHoppingPanel ? 'Hide Hopping Simulator' : 'LoRa Simulator'}</span>
          </button>

          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-medium">
            <input
              type="checkbox"
              checked={showCoverageCircles}
              onChange={(e) => setShowCoverageCircles(e.target.checked)}
              className="rounded text-cyan-600 focus:ring-0"
            />
            <span>Coverage Circles</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-medium">
            <input
              type="checkbox"
              checked={showLiveNetwork}
              onChange={(e) => setShowLiveNetwork(e.target.checked)}
              className="rounded text-cyan-600 focus:ring-0"
            />
            <span>Hopping Links</span>
          </label>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTUAL LEAFLET MAP CONTAINER                                              */}
      {/* ========================================================================= */}
      <div
        ref={mapContainerRef}
        className={`w-full ${compact ? 'h-[460px]' : 'h-[680px]'} z-0 select-none`}
      />

      {/* ========================================================================= */}
      {/* FLOATING HOPPING METHOD & TRANSMISSION CONTROLLER (TOP-RIGHT)             */}
      {/* SHOWN ONLY WHEN USER TOUCHES A LEAF NODE OR CLICKS SIMULATOR BUTTON       */}
      {/* ========================================================================= */}
      {showHoppingPanel && (
        <div
          className={`absolute top-26 right-4 z-20 w-80 sm:w-92 backdrop-blur-md rounded-xl border p-3.5 sm:p-4 shadow-2xl transition-colors ${
            isDarkMode
              ? 'bg-slate-950/95 border-slate-800 text-white'
              : 'bg-white/95 border-slate-300 text-slate-900 shadow-slate-400/30'
          }`}
        >
          <div
            className={`flex items-center justify-between mb-2.5 border-b pb-2 ${
              isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h4
                className={`font-bold text-xs uppercase tracking-wider ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                LoRa Hopping Transmission
              </h4>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Active Method Badge */}
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                  currentHoppingMethod.badgeTone === 'cyan'
                    ? isDarkMode ? 'bg-cyan-950 text-cyan-300 border-cyan-800' : 'bg-teal-50 text-teal-800 border-teal-300'
                    : currentHoppingMethod.badgeTone === 'emerald'
                    ? isDarkMode ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : isDarkMode ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                {currentHoppingMethod.shortLabel}
              </span>

              {/* Close Button to hide panel */}
              <button
                onClick={() => setShowHoppingPanel(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close Hopping Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

        {/* Hopping Method Selector */}
        <div className="mb-2.5">
          <label
            className={`text-[9px] font-bold uppercase tracking-wider block mb-1 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            HOPPING METHOD / ROUTING PROTOCOL
          </label>
          <select
            value={activeHoppingMethodId}
            onChange={(e) => setActiveHoppingMethodId(e.target.value as HoppingMethodId)}
            className={`w-full text-xs font-semibold rounded-lg border py-1.5 px-2 focus:outline-hidden ${
              isDarkMode
                ? 'bg-slate-900 text-cyan-300 border-slate-700 focus:border-cyan-500'
                : 'bg-white text-slate-900 border-slate-300 focus:border-teal-600 shadow-xs'
            }`}
          >
            <option value="adaptive-mesh">Adaptive Multi-Hop Mesh (RPL / ETX)</option>
            <option value="direct-star">Direct Star-Hop (Direct-to-Gateway)</option>
            <option value="emergency-flood">Emergency Flood-Hop (High Penetration SF10)</option>
          </select>
          <div className="text-[10px] opacity-70 mt-1 flex items-center justify-between font-mono">
            <span>{currentHoppingMethod.spreadingFactor}</span>
            <span>PDR: {currentHoppingMethod.pdrPercent}%</span>
          </div>
        </div>

        {/* Source Probe & Hop Nodes */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Source Leaf Node Box */}
          <div
            className={`rounded-lg p-2 border ${
              isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span
              className={`text-[9px] font-bold uppercase tracking-wider block mb-0.5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              HOP 0: SOURCE
            </span>
            <select
              value={selectedLeafNodeId}
              onChange={(e) => setSelectedLeafNodeId(e.target.value)}
              className={`w-full text-xs font-bold rounded border py-1 px-1 focus:outline-hidden ${
                isDarkMode
                  ? 'bg-slate-950 text-cyan-300 border-slate-700 focus:border-cyan-500'
                  : 'bg-white text-slate-900 border-slate-300 focus:border-teal-600 shadow-xs'
              }`}
            >
              {leafNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.code} ({n.name.split('—')[1]?.trim()?.split('(')[0]?.slice(0, 10) || 'Sensor'})
                </option>
              ))}
            </select>
          </div>

          {/* Target Hop 1 Gateway Router */}
          <div
            className={`rounded-lg p-2 border ${
              isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span
              className={`text-[9px] font-bold uppercase tracking-wider block mb-0.5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              HOP 1: GATEWAY
            </span>
            <div
              className={`text-xs font-bold truncate ${
                isDarkMode ? 'text-sky-300' : 'text-sky-800'
              }`}
            >
              {targetInternalNode ? targetInternalNode.code : 'IN-01'} Router
            </div>
            <div className="text-[10px] truncate opacity-70 font-mono">
              {activeHoppingMethodId === 'direct-star' ? 'Final Recipient' : `➔ Relays to ${clusterHubNode?.code || 'IN-01'}`}
            </div>
          </div>
        </div>

        {/* Hop Sequence Visual Pipeline */}
        <div
          className={`mb-3 p-2 rounded-lg border text-[10px] font-mono flex items-center justify-between ${
            isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1">
            <span
              className={`px-1.5 py-0.5 rounded font-bold ${
                isTransmitting && currentHopStep === 1
                  ? 'bg-cyan-500 text-slate-950 animate-pulse'
                  : 'bg-slate-800 text-cyan-300'
              }`}
            >
              {activeLeafNode?.code || 'LN'}
            </span>
            <span className="opacity-50">➔</span>
            <span
              className={`px-1.5 py-0.5 rounded font-bold ${
                isTransmitting && currentHopStep === 2
                  ? 'bg-sky-500 text-slate-950 animate-pulse'
                  : 'bg-slate-800 text-sky-300'
              }`}
            >
              {targetInternalNode?.code || 'IN'}
            </span>
            {activeHoppingMethodId !== 'direct-star' && (
              <>
                <span className="opacity-50">➔</span>
                <span className="px-1.5 py-0.5 rounded font-bold bg-slate-800 text-indigo-300">
                  {clusterHubNode?.code || 'HUB'}
                </span>
              </>
            )}
            <span className="opacity-50">➔</span>
            <span className="px-1.5 py-0.5 rounded font-bold bg-slate-800 text-emerald-300">
              CLOUD
            </span>
          </div>
          <span className="font-sans text-[9px] opacity-75 font-semibold">
            {activeHoppingMethodId === 'direct-star' ? '1 Hop' : '2 Hops'}
          </span>
        </div>

        {/* Action Button: TRANSMIT DATA WITH HOPPING */}
        <button
          onClick={handleTransmitData}
          disabled={isTransmitting}
          className={`w-full py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            isTransmitting
              ? isDarkMode
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-700 cursor-not-allowed'
                : 'bg-teal-100 text-teal-700 border border-teal-300 cursor-not-allowed'
              : isDarkMode
              ? 'bg-cyan-900/90 hover:bg-cyan-800 text-cyan-100 border border-cyan-500 hover:border-cyan-400 shadow-md shadow-cyan-950/50'
              : 'bg-teal-700 hover:bg-teal-800 text-white border border-teal-800 shadow-md shadow-teal-900/20'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isTransmitting ? 'Propagating Packet Hops...' : 'Transmit With Hopping Method'}</span>
        </button>

        {/* Live Status text */}
        <div
          className={`mt-2 text-[10px] leading-relaxed font-mono p-2 rounded border ${
            isDarkMode
              ? 'bg-slate-900/60 text-slate-300 border-slate-800/80'
              : 'bg-slate-50 text-slate-700 border-slate-200'
          }`}
        >
          <strong className={isDarkMode ? 'text-cyan-400' : 'text-teal-700'}>
            STATUS:{' '}
          </strong>
          <span>{transmissionStatus}</span>
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* SELECTED ZONE DETAILS MODAL / CARD OVERLAY (CENTER/LEFT)                  */}
      {/* ========================================================================= */}
      {selectedAreaForInspection && (
        <div
          className={`absolute top-26 left-4 z-20 w-80 sm:w-88 rounded-xl border p-4 shadow-2xl backdrop-blur-md transition-all ${
            isDarkMode
              ? 'bg-slate-950/95 border-slate-800 text-white'
              : 'bg-white/95 border-slate-300 text-slate-900 shadow-slate-400/30'
          }`}
        >
          {(() => {
            const meta = getZoneMeta(selectedAreaForInspection);
            const levelExceeded =
              selectedAreaForInspection.maxWaterLevelM >=
              selectedAreaForInspection.waterLevelThresholdM;

            return (
              <>
                <div className="flex items-center justify-between mb-3 border-b border-current/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{meta.badgeIcon}</span>
                    <div>
                      <span
                        className={`text-[9px] font-black font-mono tracking-wider uppercase px-2 py-0.5 rounded border ${meta.bgClass}`}
                      >
                        {meta.badgeTitle}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAreaForInspection(null)}
                    className="p-1 rounded-md hover:bg-current/10 opacity-70 hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-sm font-bold tracking-tight mb-1">
                  {selectedAreaForInspection.name}
                </h3>
                <p className="text-xs opacity-70 mb-3 leading-relaxed">
                  {selectedAreaForInspection.description}
                </p>

                {/* Threat & Metrics Card */}
                <div
                  className={`p-2.5 rounded-lg border text-xs space-y-2 mb-3 ${
                    meta.type === 'critical'
                      ? 'bg-red-950/40 border-red-800/60'
                      : meta.type === 'risk'
                      ? 'bg-amber-950/40 border-amber-800/60'
                      : 'bg-emerald-950/40 border-emerald-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="opacity-75">Primary Hazard:</span>
                    <span className="font-semibold text-right max-w-[170px] truncate">
                      {selectedAreaForInspection.primaryThreat}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="opacity-75">Water Stage:</span>
                    <span
                      className={`font-mono font-bold ${
                        levelExceeded ? 'text-red-400' : meta.textClass
                      }`}
                    >
                      {selectedAreaForInspection.maxWaterLevelM}m / Danger:{' '}
                      {selectedAreaForInspection.waterLevelThresholdM}m
                    </span>
                  </div>

                  {/* Stage Progress Bar */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        meta.type === 'critical'
                          ? 'bg-red-500'
                          : meta.type === 'risk'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (selectedAreaForInspection.maxWaterLevelM /
                            selectedAreaForInspection.waterLevelThresholdM) *
                            100
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="opacity-75">24h Rainfall Accumulation:</span>
                    <span className="font-mono font-bold">
                      {selectedAreaForInspection.averageRainfall24hMm} mm
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="opacity-75">Assigned Nodes:</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {selectedAreaForInspection.nodes.length} LoRa Stations
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.setView(
                          [
                            selectedAreaForInspection.centerLat,
                            selectedAreaForInspection.centerLng,
                          ],
                          14,
                          { animate: true }
                        );
                      }
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${
                      isDarkMode
                        ? 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-slate-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    }`}
                  >
                    Focus Catchment
                  </button>

                  <button
                    onClick={() => {
                      const firstLeaf = selectedAreaForInspection.nodes.find(
                        (n) => n.type === 'leaf'
                      );
                      if (firstLeaf) {
                        setSelectedLeafNodeId(firstLeaf.id);
                        onSelectNode(firstLeaf);
                      }
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                      isDarkMode
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        : 'bg-teal-700 hover:bg-teal-800 text-white'
                    }`}
                  >
                    Inspect Probes
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* HOPPING METHOD ARCHITECTURE SPEC MODAL                                    */}
      {/* ========================================================================= */}
      {showHoppingSpecModal && (
        <div
          className={`absolute top-26 left-4 sm:left-14 z-30 w-84 sm:w-96 rounded-xl border p-4 shadow-2xl backdrop-blur-md transition-all ${
            isDarkMode
              ? 'bg-slate-950/95 border-slate-800 text-white'
              : 'bg-white/95 border-slate-300 text-slate-900 shadow-slate-400/30'
          }`}
        >
          <div className="flex items-center justify-between mb-3 border-b border-current/10 pb-2">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-sm">LoRa Hopping Architecture</h3>
            </div>
            <button
              onClick={() => setShowHoppingSpecModal(false)}
              className="p-1 rounded-md hover:bg-current/10 opacity-70 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs opacity-75 mb-3 leading-relaxed">
            In our hydrometric sensor network, field leaf probes (LN) do not require costly cellular SIMs. Instead, they hop their readings across an intelligent LoRaWAN mesh to internal gateway routers (IN), which aggregate and uplink packets to the cloud backbone.
          </p>

          <div className="space-y-2 mb-4 text-xs font-mono">
            <div
              className={`p-2 rounded border ${
                activeHoppingMethodId === 'adaptive-mesh'
                  ? isDarkMode ? 'bg-cyan-950/40 border-cyan-700' : 'bg-teal-50 border-teal-300'
                  : isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <div className="font-bold flex items-center justify-between">
                <span>1. Adaptive Multi-Hop Mesh (RPL)</span>
                <span className="text-[10px] text-cyan-400">RECOMMENDED</span>
              </div>
              <div className="text-[11px] opacity-75 font-sans mt-0.5">
                Dynamic routing based on Expected Transmission Count (ETX). Hops around obstacles and terrain.
              </div>
            </div>

            <div
              className={`p-2 rounded border ${
                activeHoppingMethodId === 'direct-star'
                  ? isDarkMode ? 'bg-emerald-950/40 border-emerald-700' : 'bg-emerald-50 border-emerald-300'
                  : isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <div className="font-bold flex items-center justify-between">
                <span>2. Direct Star-Hop</span>
                <span className="text-[10px] text-emerald-400">LOW LATENCY (110ms)</span>
              </div>
              <div className="text-[11px] opacity-75 font-sans mt-0.5">
                Single-hop link directly from probe to gateway sector antenna.
              </div>
            </div>

            <div
              className={`p-2 rounded border ${
                activeHoppingMethodId === 'emergency-flood'
                  ? isDarkMode ? 'bg-amber-950/40 border-amber-700' : 'bg-amber-50 border-amber-300'
                  : isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <div className="font-bold flex items-center justify-between">
                <span>3. Emergency Flood-Hop</span>
                <span className="text-[10px] text-amber-400">HIGH RAIN PENETRATION</span>
              </div>
              <div className="text-[11px] opacity-75 font-sans mt-0.5">
                SF10 modulation (+18dBm) cutting through torrential cloudbursts and deep tree canopies.
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono opacity-60 border-t border-current/10 pt-2 flex items-center justify-between">
            <span>Band: India 865-867 MHz</span>
            <span>Link Budget: 148 dB</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAP LEGEND OVERLAY (BOTTOM-LEFT)                                          */}
      {/* ========================================================================= */}
      <div
        className={`absolute bottom-4 left-4 z-20 backdrop-blur-md rounded-xl border p-3 text-[10px] font-mono space-y-1.5 shadow-xl transition-colors max-w-[280px] sm:max-w-none ${
          isDarkMode
            ? 'bg-slate-950/95 border-slate-800 text-slate-300'
            : 'bg-white/95 border-slate-300 text-slate-700 shadow-slate-300/40'
        }`}
      >
        <div className="font-bold uppercase tracking-wider text-[9px] opacity-60 border-b border-current/10 pb-1 flex items-center justify-between">
          <span>Geospatial Map Legend</span>
          <span className="text-cyan-400 font-normal">Active View</span>
        </div>

        {/* Zone Demarcations */}
        <div className="grid grid-cols-3 gap-2 pb-1 border-b border-current/10">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-red-500 border border-red-300 inline-block animate-pulse" />
            <span className="text-red-400 font-bold">Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 border border-amber-300 inline-block" />
            <span className="text-amber-400 font-bold">Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 border border-emerald-300 inline-block" />
            <span className="text-emerald-400 font-bold">Normal</span>
          </div>
        </div>

        {/* Node & Link Indicators */}
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-xs border-2 inline-block ${
              isDarkMode ? 'bg-slate-900 border-sky-400' : 'bg-sky-50 border-sky-600'
            }`}
          />
          <span>Internal Gateway Router (IN)</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full border-2 inline-block ${
              isDarkMode ? 'bg-emerald-950 border-emerald-400' : 'bg-emerald-50 border-emerald-600'
            }`}
          />
          <span>Field Sensor Probe (LN)</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-4 h-0.5 border-t-2 border-dashed inline-block ${
              isDarkMode ? 'border-cyan-400' : 'border-teal-600'
            }`}
          />
          <span>LoRa Mesh Hopping Route</span>
        </div>
      </div>
    </div>
  );
};
