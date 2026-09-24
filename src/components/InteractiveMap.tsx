import React, { useState, useMemo, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Radio,
  Wifi,
  Waves,
  Eye,
  Activity,
  Maximize2,
  Minimize2,
  Info,
  Navigation as NavIcon,
} from 'lucide-react';
import { LocationConfig, MonitoredArea, SensorNode } from '../types';

interface InteractiveMapProps {
  location: LocationConfig;
  selectedAreaId?: string;
  onSelectArea?: (areaId: string) => void;
  selectedNodeId?: string;
  onSelectNode: (node: SensorNode) => void;
  compact?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  location,
  selectedAreaId,
  onSelectArea,
  selectedNodeId,
  onSelectNode,
  compact = false,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Layer toggles
  const [showInternalRanges, setShowInternalRanges] = useState(true);
  const [showLeafRanges, setShowLeafRanges] = useState(true);
  const [showHoppingLinks, setShowHoppingLinks] = useState(true);
  const [showInternalNodes, setShowInternalNodes] = useState(true);
  const [showLeafNodes, setShowLeafNodes] = useState(true);
  const [showWaterways, setShowWaterways] = useState(true);

  // Compute map bounds from all nodes and center
  const bounds = useMemo(() => {
    let minLat = 999, maxLat = -999, minLng = 999, maxLng = -999;
    location.monitoredAreas.forEach((area) => {
      area.nodes.forEach((node) => {
        if (node.lat < minLat) minLat = node.lat;
        if (node.lat > maxLat) maxLat = node.lat;
        if (node.lng < minLng) minLng = node.lng;
        if (node.lng > maxLng) maxLng = node.lng;
      });
    });
    // Add margin
    const latMargin = (maxLat - minLat) * 0.15 || 0.05;
    const lngMargin = (maxLng - minLng) * 0.15 || 0.05;
    return {
      minLat: minLat - latMargin,
      maxLat: maxLat + latMargin,
      minLng: minLng - lngMargin,
      maxLng: maxLng + lngMargin,
    };
  }, [location]);

  // Coordinate projector
  const project = useMemo(() => {
    const width = 900;
    const height = compact ? 420 : 620;
    return (lat: number, lng: number) => {
      const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * width;
      const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * height;
      return { x, y };
    };
  }, [bounds, compact]);

  const mapWidth = 900;
  const mapHeight = compact ? 420 : 620;

  // Filtered areas or single focused area
  const activeAreas = useMemo(() => {
    if (!selectedAreaId || selectedAreaId === 'all') {
      return location.monitoredAreas;
    }
    return location.monitoredAreas.filter((a) => a.id === selectedAreaId);
  }, [location, selectedAreaId]);

  // Calculate ~1km pixel radius based on latitude distance in this projection
  const kmPixelRadius = useMemo(() => {
    const p1 = project(location.centerLat, location.centerLng);
    const p2 = project(location.centerLat + 0.009, location.centerLng); // ~1km in lat
    return Math.max(26, Math.abs(p2.y - p1.y));
  }, [location, project]);

  // Handle Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleReset = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Coastal / River water bodies decorative vectors matching realistic geography
  const waterBodyPaths = useMemo(() => {
    if (location.id === 'mumbai') {
      return (
        <g opacity="0.35" className="pointer-events-none">
          {/* Arabian Sea coastline & Thane Creek */}
          <path
            d="M 40,0 Q 80,180 110,320 T 140,580 L 0,620 L 0,0 Z"
            fill="#0284c7"
            opacity="0.18"
          />
          {/* Mithi River Path */}
          <path
            d="M 640,160 Q 560,250 490,320 T 360,420 T 260,450"
            fill="none"
            stroke="#0284c7"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.6"
          />
          <text x="520" y="270" fill="#0369a1" fontSize="10" fontWeight="600" className="select-none">
            Mithi River Estuary
          </text>
          <text x="50" y="320" fill="#0284c7" fontSize="12" fontWeight="700" letterSpacing="2" className="select-none">
            ARABIAN SEA
          </text>
        </g>
      );
    }
    if (location.id === 'kerala') {
      return (
        <g opacity="0.35" className="pointer-events-none">
          {/* Western coastline */}
          <path
            d="M 70,0 Q 110,240 160,450 T 220,620 L 0,620 L 0,0 Z"
            fill="#0284c7"
            opacity="0.2"
          />
          {/* Periyar River Course */}
          <path
            d="M 720,240 Q 580,280 430,330 T 240,360"
            fill="none"
            stroke="#0284c7"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Vembanad Lake Polders */}
          <ellipse cx="320" cy="460" rx="48" ry="18" fill="#0284c7" opacity="0.3" />
          <text x="60" y="300" fill="#0284c7" fontSize="12" fontWeight="700" letterSpacing="2" className="select-none">
            ARABIAN SEA
          </text>
          <text x="490" y="300" fill="#0369a1" fontSize="10" fontWeight="600" className="select-none">
            Periyar River Drainage
          </text>
          <text x="300" y="490" fill="#0369a1" fontSize="10" fontWeight="600" className="select-none">
            Vembanad Backwaters
          </text>
        </g>
      );
    }
    if (location.id === 'chennai') {
      return (
        <g opacity="0.35" className="pointer-events-none">
          {/* Bay of Bengal Eastern Coastline */}
          <path
            d="M 760,0 Q 720,200 680,380 T 640,620 L 900,620 L 900,0 Z"
            fill="#0284c7"
            opacity="0.2"
          />
          {/* Adyar River */}
          <path
            d="M 280,380 Q 420,390 560,410 T 690,430"
            fill="none"
            stroke="#0284c7"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Cooum River */}
          <path
            d="M 290,240 Q 440,250 580,260 T 710,270"
            fill="none"
            stroke="#0284c7"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.5"
          />
          <text x="730" y="320" fill="#0284c7" fontSize="12" fontWeight="700" letterSpacing="2" className="select-none">
            BAY OF BENGAL
          </text>
          <text x="430" y="430" fill="#0369a1" fontSize="10" fontWeight="600" className="select-none">
            Adyar River Estuary
          </text>
          <text x="450" y="250" fill="#0369a1" fontSize="10" fontWeight="600" className="select-none">
            Cooum River
          </text>
        </g>
      );
    }
    return (
      <g opacity="0.35" className="pointer-events-none">
        <path d="M 760,0 L 730,620 L 900,620 L 900,0 Z" fill="#0284c7" opacity="0.2" />
        <text x="740" y="300" fill="#0284c7" fontSize="11" fontWeight="700" letterSpacing="2">
          BAY OF BENGAL
        </text>
      </g>
    );
  }, [location.id]);

  return (
    <div className="relative bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shadow-sm select-none">
      {/* Top Map Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Region & Area Indicator */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-md border border-slate-700/80 text-xs text-slate-200 shadow-md">
          <NavIcon className="w-3.5 h-3.5 text-teal-400" />
          <span className="font-semibold text-white">{location.name}</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">
            {selectedAreaId && selectedAreaId !== 'all'
              ? location.monitoredAreas.find((a) => a.id === selectedAreaId)?.name || 'Selected Zone'
              : `All ${location.monitoredAreas.length} Monitored Zones`}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-teal-950 text-teal-300 border border-teal-800">
            {activeAreas.reduce((acc, a) => acc + a.nodes.length, 0)} Nodes Active
          </span>
        </div>

        {/* Layer Toggles & Zoom Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-md border border-slate-700/80 shadow-md">
          {/* Zoom controls */}
          <button
            onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Reset Map View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <span className="w-px h-4 bg-slate-700 mx-1" />

          {/* Layer toggles */}
          <button
            onClick={() => setShowInternalRanges(!showInternalRanges)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              showInternalRanges
                ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle 1km Coverage Ranges for Internal Gateway Nodes"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>Internal Ranges</span>
          </button>

          <button
            onClick={() => setShowLeafRanges(!showLeafRanges)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              showLeafRanges
                ? 'bg-teal-950/80 text-teal-300 border border-teal-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle 1km Coverage Ranges for Field Leaf Nodes"
          >
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span>Leaf Ranges</span>
          </button>

          <button
            onClick={() => setShowHoppingLinks(!showHoppingLinks)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              showHoppingLinks
                ? 'bg-amber-950/80 text-amber-300 border border-amber-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Mesh Hopping Transmission Vectors"
          >
            <Activity className="w-3 h-3 text-amber-400" />
            <span>Hopping Links</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div
        className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="w-full h-auto block bg-slate-950 transition-transform duration-75"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
          }}
        >
          <defs>
            {/* Mesh Link Arrow Marker */}
            <marker
              id="hop-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
            </marker>

            {/* Pattern for geographic coordinate grid */}
            <pattern id="grid" width="45" height="45" patternUnits="userSpaceOnUse">
              <path d="M 45 0 L 0 0 0 45" fill="none" stroke="#1e293b" strokeWidth="0.75" />
            </pattern>

            {/* Radial gradients for overlapping 1km range circles */}
            <radialGradient id="internalRangeGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.28" />
              <stop offset="70%" stopColor="#6366f1" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#4338ca" stopOpacity="0.02" />
            </radialGradient>

            <radialGradient id="leafRangeGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
              <stop offset="70%" stopColor="#0d9488" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#0f766e" stopOpacity="0.02" />
            </radialGradient>
          </defs>

          {/* Coordinate grid background */}
          <rect width={mapWidth} height={mapHeight} fill="url(#grid)" />

          {/* Realistic geographic waterbodies & coastlines */}
          {showWaterways && waterBodyPaths}

          {/* Area boundary envelopes */}
          {activeAreas.map((area) => {
            const center = project(area.centerLat, area.centerLng);
            const isSelectedArea = selectedAreaId === area.id;

            return (
              <g key={`area-env-${area.id}`}>
                {/* Subtle boundary perimeter showing the monitored cluster */}
                <ellipse
                  cx={center.x}
                  cy={center.y}
                  rx={kmPixelRadius * 2.1}
                  ry={kmPixelRadius * 1.9}
                  fill={isSelectedArea ? '#0f172a' : '#020617'}
                  fillOpacity="0.5"
                  stroke={
                    area.currentRisk === 'Critical'
                      ? '#ef4444'
                      : area.currentRisk === 'High'
                      ? '#f59e0b'
                      : '#14b8a6'
                  }
                  strokeWidth={isSelectedArea ? '2' : '1'}
                  strokeDasharray="4 4"
                  opacity={isSelectedArea ? '0.9' : '0.4'}
                />

                {/* Area Label */}
                <text
                  x={center.x}
                  y={center.y - kmPixelRadius * 1.95}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="11"
                  fontWeight="600"
                  letterSpacing="0.5"
                  className="select-none"
                >
                  {area.name}
                </text>
              </g>
            );
          })}

          {/* 1 KM COVERAGE RANGES (OVERLAPPING VISUALIZATION AS REQUIRED) */}
          {/* Layer 1: Leaf Node Ranges */}
          {showLeafRanges &&
            activeAreas.map((area) =>
              area.nodes
                .filter((n) => n.type === 'leaf')
                .map((node) => {
                  const pt = project(node.lat, node.lng);
                  const isSelected = selectedNodeId === node.id;
                  const radius = kmPixelRadius * 0.95; // ~1km range

                  return (
                    <g key={`leaf-range-${node.id}`}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={radius}
                        fill="url(#leafRangeGrad)"
                        stroke="#14b8a6"
                        strokeWidth={isSelected ? '1.5' : '1'}
                        strokeOpacity="0.45"
                        strokeDasharray="3 3"
                      />
                    </g>
                  );
                })
            )}

          {/* Layer 2: Internal Node Ranges */}
          {showInternalRanges &&
            activeAreas.map((area) =>
              area.nodes
                .filter((n) => n.type === 'internal')
                .map((node) => {
                  const pt = project(node.lat, node.lng);
                  const isSelected = selectedNodeId === node.id;
                  const radius = kmPixelRadius * 1.1; // ~1.1km range

                  return (
                    <g key={`internal-range-${node.id}`}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={radius}
                        fill="url(#internalRangeGrad)"
                        stroke="#818cf8"
                        strokeWidth={isSelected ? '1.75' : '1.25'}
                        strokeOpacity="0.55"
                      />
                    </g>
                  );
                })
            )}

          {/* HOPPING METHOD TRANSMISSION VECTORS */}
          {showHoppingLinks &&
            activeAreas.map((area) => {
              const nodeMap = new Map<string, SensorNode>(area.nodes.map((n) => [n.id, n]));
              return (
                <g key={`hops-${area.id}`}>
                  {area.nodes.map((node) => {
                    if (!node.nextHopNodeId) return null;
                    const targetNode = nodeMap.get(node.nextHopNodeId);
                    if (!targetNode) return null;

                    const p1 = project(node.lat, node.lng);
                    const p2 = project(targetNode.lat, targetNode.lng);

                    return (
                      <g key={`link-${node.id}-${targetNode.id}`}>
                        {/* Transmission Link Line */}
                        <line
                          x1={p1.x}
                          y1={p1.y}
                          x2={p2.x}
                          y2={p2.y}
                          stroke={node.type === 'leaf' ? '#14b8a6' : '#6366f1'}
                          strokeWidth="1.5"
                          strokeDasharray="4 3"
                          strokeOpacity="0.75"
                        />
                        {/* Dynamic packet pulse traveling on link */}
                        <circle r="2.5" fill="#f59e0b">
                          <animateMotion
                            path={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
                            dur="2.4s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      </g>
                    );
                  })}
                </g>
              );
            })}

          {/* PHYSICAL SENSOR NODES VISUAL MARKERS (DISTINCT INTERNAL vs LEAF) */}
          {activeAreas.map((area) => (
            <g key={`nodes-${area.id}`}>
              {area.nodes.map((node) => {
                if (node.type === 'internal' && !showInternalNodes) return null;
                if (node.type === 'leaf' && !showLeafNodes) return null;

                const pt = project(node.lat, node.lng);
                const isSelected = selectedNodeId === node.id;
                const isInternal = node.type === 'internal';

                return (
                  <g
                    key={node.id}
                    id={`map-node-${node.id}`}
                    transform={`translate(${pt.x}, ${pt.y})`}
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectNode(node);
                      if (onSelectArea && area.id !== selectedAreaId) {
                        onSelectArea(area.id);
                      }
                    }}
                  >
                    {/* Hover Pulse Ring */}
                    {isSelected && (
                      <circle
                        r="16"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        className="animate-ping"
                        opacity="0.7"
                      />
                    )}

                    {/* Node Visual Shape:
                        Internal Node = Rounded Square / Hex with Gateway Symbol
                        Leaf Node = Circular Probe Marker with Sensor Symbol */}
                    {isInternal ? (
                      // Internal Node: Gateway Router
                      <g>
                        <rect
                          x="-10"
                          y="-10"
                          width="20"
                          height="20"
                          rx="4"
                          fill={isSelected ? '#4338ca' : '#1e1b4b'}
                          stroke={isSelected ? '#f59e0b' : '#818cf8'}
                          strokeWidth="2"
                        />
                        {/* Gateway Core */}
                        <circle cx="0" cy="0" r="3.5" fill="#a5b4fc" />
                        <circle cx="0" cy="0" r="7" fill="none" stroke="#818cf8" strokeWidth="0.8" opacity="0.6" />
                      </g>
                    ) : (
                      // Leaf Node: Field Sensor Probe
                      <g>
                        <circle
                          r="7"
                          fill={isSelected ? '#0f766e' : '#042f2e'}
                          stroke={isSelected ? '#f59e0b' : '#2dd4bf'}
                          strokeWidth="1.8"
                        />
                        <circle cx="0" cy="0" r="2.5" fill="#2dd4bf" />
                      </g>
                    )}

                    {/* Node Label (Code) */}
                    <text
                      x="0"
                      y={isInternal ? 18 : 15}
                      textAnchor="middle"
                      fill={isSelected ? '#fbbf24' : isInternal ? '#c7d2fe' : '#99f6e4'}
                      fontSize="9"
                      fontWeight="bold"
                      className="select-none font-mono drop-shadow-sm"
                    >
                      {node.code}
                    </text>
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
      </div>

      {/* Map Legend Overlay (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-md border border-slate-700/80 text-[11px] text-slate-300 shadow-lg pointer-events-auto flex flex-col gap-1.5 max-w-xs">
        <div className="font-semibold text-white flex items-center justify-between">
          <span>Sensor Network Legend</span>
          <span className="text-[10px] text-slate-400 font-mono">~1km / node</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-indigo-950 border border-indigo-400 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            </span>
            <span className="text-slate-200">Internal Node (Router)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-teal-950 border border-teal-400 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            </span>
            <span className="text-slate-200">Leaf Node (Sensor)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-indigo-500/50 border border-indigo-400/80" />
            <span className="text-slate-400">Internal 1km Range</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-teal-500/50 border border-teal-400/80" />
            <span className="text-slate-400">Leaf 1km Range</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 pt-0.5 border-t border-slate-800 flex items-center gap-1">
          <Activity className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Hopping: Leaf hops to nearest Internal node with overlapping coverage</span>
        </div>
      </div>
    </div>
  );
};
