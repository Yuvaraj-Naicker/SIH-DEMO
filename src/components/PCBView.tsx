import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  Cpu,
  Radio,
  Activity,
  Layers,
  RotateCw,
  Camera,
  Maximize2,
  Sliders,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  RefreshCw,
  Eye,
  Zap,
  Volume2,
  BatteryCharging,
  Usb,
  Microchip,
  Wifi,
  ShieldCheck,
  Power,
  GitBranch,
  Search,
  ExternalLink,
} from 'lucide-react';
import { LocationConfig } from '../types';
import { useTheme } from '../context/ThemeContext';
import BorderGlow from './BorderGlow';
import {
  ROOT_BOARD_SPEC,
  ROOT_NODE_COMPONENTS,
  ROOT_SYSTEM_BLOCKS,
  PCBComponentMeta,
  SystemBlock,
} from '../data/pcbData';

interface PCBViewProps {
  location: LocationConfig;
}

export const PCBView: React.FC<PCBViewProps> = ({ location }) => {
  const { isDarkMode } = useTheme();
  const mountRef = useRef<HTMLDivElement>(null);

  // Active States
  const [selectedComp, setSelectedComp] = useState<PCBComponentMeta>(ROOT_NODE_COMPONENTS[0]);
  const [hoveredComp, setHoveredComp] = useState<PCBComponentMeta | null>(null);
  const [activeLayer, setActiveLayer] = useState<'all' | 'components' | 'traces' | 'silkscreen'>('all');
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [boardColor, setBoardColor] = useState<'green' | 'dark' | 'blue' | 'purple'>('green');
  const [showWireframe, setShowWireframe] = useState<boolean>(false);
  const [customGlbLoaded, setCustomGlbLoaded] = useState<boolean>(false);
  const [customGlbName, setCustomGlbName] = useState<string>('');
  const [viewPreset, setViewPreset] = useState<'iso' | 'top' | 'mcu' | 'bg95' | 'lora' | 'power' | 'ports'>('iso');
  const [activeTabMode, setActiveTabMode] = useState<'3d' | 'schematic' | 'datapath' | 'specs'>('3d');
  const [bomFilter, setBomFilter] = useState<'all' | 'mcu' | 'rf' | 'power' | 'connector' | 'passive' | 'indicator'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const componentsGroupRef = useRef<THREE.Group | null>(null);
  const boardMeshRef = useRef<THREE.Mesh | null>(null);
  const tracesGroupRef = useRef<THREE.Group | null>(null);
  const silkscreenGroupRef = useRef<THREE.Group | null>(null);
  const ledMeshesRef = useRef<THREE.Mesh[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Board colors palette
  const boardColors = useMemo(() => ({
    green: { base: 0x0c331e, specular: 0x1d663e, edge: 0x061c10, name: 'KiCad Green' },
    dark: { base: 0x11161d, specular: 0x223040, edge: 0x0a0d12, name: 'Matte Stealth' },
    blue: { base: 0x092b47, specular: 0x155184, edge: 0x051624, name: 'Cobalt Blue' },
    purple: { base: 0x241138, specular: 0x482170, edge: 0x140621, name: 'OSH Purple' },
  }), []);

  // Board dimensions in 3D units (scale 1 unit = 10mm -> 13.75 x 7.75 x 0.16)
  const B_WIDTH = 13.75;
  const B_DEPTH = 7.75;
  const B_HEIGHT = 0.16;

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 580;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(5.5, 9.5, 9.5);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.15;
    controls.minDistance = 3.5;
    controls.maxDistance = 22.0;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff7e6, 2.4);
    mainLight.position.set(7, 14, 8);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.bias = -0.0005;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x7dd3fc, 1.2);
    fillLight.position.set(-8, 9, -6);
    scene.add(fillLight);

    const highlightLight = new THREE.PointLight(0x38bdf8, 2.0, 20);
    highlightLight.position.set(0, 5, 0);
    scene.add(highlightLight);

    // 6. Build Procedural Root Node Board Geometry
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    // 6.1 Substrate FR-4 Board (137.5 x 77.5 mm)
    const cornerRadius = 0.35;
    const boardShape = new THREE.Shape();
    const bx = -B_WIDTH / 2;
    const bz = -B_DEPTH / 2;
    boardShape.moveTo(bx + cornerRadius, bz);
    boardShape.lineTo(bx + B_WIDTH - cornerRadius, bz);
    boardShape.quadraticCurveTo(bx + B_WIDTH, bz, bx + B_WIDTH, bz + cornerRadius);
    boardShape.lineTo(bx + B_WIDTH, bz + B_DEPTH - cornerRadius);
    boardShape.quadraticCurveTo(bx + B_WIDTH, bz + B_DEPTH, bx + B_WIDTH - cornerRadius, bz + B_DEPTH);
    boardShape.lineTo(bx + cornerRadius, bz + B_DEPTH);
    boardShape.quadraticCurveTo(bx, bz + B_DEPTH, bx, bz + B_DEPTH - cornerRadius);
    boardShape.lineTo(bx, bz + cornerRadius);
    boardShape.quadraticCurveTo(bx, bz, bx + cornerRadius, bz);

    // 4 Corner M3 Mounting Holes
    const holeRadius = 0.16;
    const holeMarginX = 0.55;
    const holeMarginZ = 0.55;
    const holeCoords: [number, number][] = [
      [-B_WIDTH / 2 + holeMarginX, -B_DEPTH / 2 + holeMarginZ],
      [B_WIDTH / 2 - holeMarginX, -B_DEPTH / 2 + holeMarginZ],
      [B_WIDTH / 2 - holeMarginX, B_DEPTH / 2 - holeMarginZ],
      [-B_WIDTH / 2 + holeMarginX, B_DEPTH / 2 - holeMarginZ],
    ];

    holeCoords.forEach(([hx, hz]) => {
      const holePath = new THREE.Path();
      holePath.absarc(hx, hz, holeRadius, 0, Math.PI * 2, true);
      boardShape.holes.push(holePath);
    });

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: B_HEIGHT,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    };

    const boardGeom = new THREE.ExtrudeGeometry(boardShape, extrudeSettings);
    boardGeom.rotateX(Math.PI / 2);

    const currentPalette = boardColors[boardColor];
    const boardMat = new THREE.MeshStandardMaterial({
      color: currentPalette.base,
      roughness: 0.42,
      metalness: 0.15,
    });
    const boardMesh = new THREE.Mesh(boardGeom, boardMat);
    boardMesh.receiveShadow = true;
    boardMesh.castShadow = true;
    boardGroup.add(boardMesh);
    boardMeshRef.current = boardMesh;

    // Corner Gold Annular Rings
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.95,
      roughness: 0.25,
    });
    holeCoords.forEach(([hx, hz]) => {
      const ringGeom = new THREE.RingGeometry(holeRadius, holeRadius + 0.14, 32);
      ringGeom.rotateX(-Math.PI / 2);
      const ringMesh = new THREE.Mesh(ringGeom, goldMat);
      ringMesh.position.set(hx, 0.083, hz);
      boardGroup.add(ringMesh);
    });

    // 6.2 Copper Traces & Solder Pads Group
    const tracesGroup = new THREE.Group();
    boardGroup.add(tracesGroup);
    tracesGroupRef.current = tracesGroup;

    const traceMaterial = new THREE.MeshStandardMaterial({
      color: 0x228448,
      roughness: 0.35,
      metalness: 0.35,
    });
    const solderMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8e1e8,
      metalness: 0.85,
      roughness: 0.28,
    });

    // Realistic Traces matching the actual board layout in image.png
    const rootTracePaths = [
      // USB-C to CH340K (U9)
      [[-5.6, -0.6], [-4.8, -0.6], [-4.2, -0.5]],
      [[-5.6, -0.45], [-4.9, -0.45], [-4.2, -0.45]],
      // CH340K to ESP32-S3 (U1) UART bus
      [[-3.4, -0.5], [-2.5, -0.5], [-1.8, -0.4]],
      [[-3.4, -0.3], [-2.5, -0.3], [-1.8, -0.2]],
      // Auto-reset Q1/Q2 lines to ESP32 EN & IO0
      [[-3.8, -1.6], [-2.8, -1.6], [-1.8, -1.2]],
      [[-3.8, -1.4], [-2.6, -1.4], [-1.8, -1.0]],
      // SW1 to EN & SW2 to IO0
      [[-0.1, -1.8], [-0.5, -1.8], [-0.9, -1.8], [-1.2, -1.4]],
      [[1.8, -2.1], [1.0, -2.1], [0.0, -1.2], [-0.8, -0.6]],
      // ESP32 to SX1276 LoRa (SPI bus)
      [[-0.5, -0.8], [0.8, -0.8], [1.8, -1.0], [2.6, -1.0]],
      [[-0.5, -0.6], [0.8, -0.6], [1.8, -0.8], [2.6, -0.8]],
      [[-0.5, -0.4], [0.8, -0.4], [1.8, -0.6], [2.6, -0.6]],
      // SX1276 ANT to RF1 (50-ohm RF trace)
      [[3.6, -1.8], [3.6, -2.4], [3.4, -2.8]],
      // ESP32 to Level Shifter TXS0102
      [[-0.5, 0.2], [0.0, 0.2], [0.1, 0.2]],
      // TXS0102 to Quectel BG95-M3
      [[0.5, 0.2], [0.8, 0.3], [1.0, 0.4]],
      // BG95-M3 to RF2 (Cellular antenna feed)
      [[0.6, 1.4], [0.2, 1.9], [-0.4, 2.6]],
      // BG95-M3 to SIM1 (SIM clock, data, rst, vdd)
      [[2.2, 0.8], [2.7, 0.8], [3.0, 1.0]],
      [[2.2, 1.0], [2.7, 1.0], [3.0, 1.2]],
      [[2.2, 1.2], [2.7, 1.2], [3.0, 1.4]],
      // Battery P1 to Charger CN3065 & Protection U8
      [[-4.0, 1.5], [-4.7, 1.5], [-5.0, 1.4]],
      [[-3.8, 1.2], [-3.4, 0.8], [-3.2, 0.7]],
      // Charger to D1 Diode & Regulator U2 (AMS1117-3.3)
      [[-2.8, 1.2], [-2.6, 1.4], [-2.3, 1.5]],
      [[-2.3, 1.5], [-1.0, 1.5], [0.5, -2.0], [1.5, -2.6]],
      // 3300uF Bulk Cap directly to BG95-M3 VBAT pins
      [[0.2, 1.4], [0.4, 1.2], [0.8, 1.0]],
      // J1 Sensor Header to ESP32 I2C
      [[-4.4, -1.8], [-3.2, -1.8], [-2.2, -1.2]],
      [[-4.4, -1.6], [-3.2, -1.6], [-2.2, -1.0]],
      // Buzzer Driver Q4 / R13 to BUZZER1
      [[-4.8, 1.9], [-4.8, 2.1], [-5.0, 2.2]],
    ];

    rootTracePaths.forEach((pts) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const dx = p2[0] - p1[0];
        const dz = p2[1] - p1[1];
        const len = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dz, dx);

        const trackGeom = new THREE.PlaneGeometry(len, 0.05);
        trackGeom.rotateX(-Math.PI / 2);
        trackGeom.rotateY(-angle);
        const trackMesh = new THREE.Mesh(trackGeom, traceMaterial);
        trackMesh.position.set((p1[0] + p2[0]) / 2, 0.0815, (p1[1] + p2[1]) / 2);
        tracesGroup.add(trackMesh);
      }
    });

    // 6.3 3D Populated Components Group
    const componentsGroup = new THREE.Group();
    boardGroup.add(componentsGroup);
    componentsGroupRef.current = componentsGroup;

    // Reusable Materials
    const icBlackMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8, metalness: 0.1 });
    const silverShieldMat = new THREE.MeshStandardMaterial({ color: 0xd8dee9, roughness: 0.25, metalness: 0.92 });
    const goldPcbAntennaMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.2, metalness: 0.95 });
    const brassConnectorMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.9 });
    const pcbCapCanMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.35, metalness: 0.65 });
    const whitePlasticMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.7, metalness: 0.05 });
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.8 });

    // Render Each Component
    ROOT_NODE_COMPONENTS.forEach((comp) => {
      const compPivot = new THREE.Group();
      compPivot.position.set(comp.pos[0], 0.08 + comp.size[1] / 2, comp.pos[2]);
      compPivot.name = comp.id;

      // Base footprint copper / gold pad
      const padW = comp.size[0] + 0.15;
      const padD = comp.size[2] + 0.15;
      const padGeom = new THREE.PlaneGeometry(padW, padD);
      padGeom.rotateX(-Math.PI / 2);
      const padMesh = new THREE.Mesh(padGeom, goldMat);
      padMesh.position.set(comp.pos[0], 0.081, comp.pos[2]);
      tracesGroup.add(padMesh);

      // Customized geometry per component type
      if (comp.id === 'esp32-mcu') {
        // ESP32-S3 module with metal RF shield & serpentine trace antenna
        const shieldBox = new THREE.BoxGeometry(comp.size[0], comp.size[1], comp.size[2] * 0.7);
        const shieldMesh = new THREE.Mesh(shieldBox, silverShieldMat);
        shieldMesh.position.set(0, 0, 0.15);
        shieldMesh.castShadow = true;
        compPivot.add(shieldMesh);

        // Antenna PCB Area
        const antPcb = new THREE.BoxGeometry(comp.size[0], comp.size[1] * 0.5, comp.size[2] * 0.3);
        const antPcbMat = new THREE.MeshStandardMaterial({ color: 0x11161d, roughness: 0.6 });
        const antPcbMesh = new THREE.Mesh(antPcb, antPcbMat);
        antPcbMesh.position.set(0, -comp.size[1] * 0.25, -comp.size[2] * 0.35);
        compPivot.add(antPcbMesh);

        // Gold PCB Antenna Traces (Inverted-F)
        const traceGeom = new THREE.BoxGeometry(comp.size[0] * 0.8, 0.02, 0.08);
        const traceM = new THREE.Mesh(traceGeom, goldPcbAntennaMat);
        traceM.position.set(0, 0.01, -comp.size[2] * 0.35);
        compPivot.add(traceM);

        // ESP32 text logo plate
        const logoPlate = new THREE.PlaneGeometry(1.6, 0.7);
        logoPlate.rotateX(-Math.PI / 2);
        const logoMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
        const logoM = new THREE.Mesh(logoPlate, logoMat);
        logoM.position.set(0, comp.size[1] / 2 + 0.005, 0.15);
        compPivot.add(logoM);
      } else if (comp.id === 'bg95-modem') {
        // Quectel BG95-M3 large square metal LGA shield
        const geom = new THREE.BoxGeometry(comp.size[0], comp.size[1], comp.size[2]);
        const mesh = new THREE.Mesh(geom, silverShieldMat);
        mesh.castShadow = true;
        compPivot.add(mesh);

        // Engraved center logo
        const qPlate = new THREE.PlaneGeometry(comp.size[0] * 0.7, comp.size[2] * 0.7);
        qPlate.rotateX(-Math.PI / 2);
        const qMat = new THREE.MeshBasicMaterial({ color: 0x64748b });
        const qMesh = new THREE.Mesh(qPlate, qMat);
        qMesh.position.set(0, comp.size[1] / 2 + 0.003, 0);
        compPivot.add(qMesh);
      } else if (comp.id === 'sx1276-lora') {
        // SX1276 LoRa module
        const geom = new THREE.BoxGeometry(comp.size[0], comp.size[1], comp.size[2]);
        const mesh = new THREE.Mesh(geom, silverShieldMat);
        mesh.castShadow = true;
        compPivot.add(mesh);

        // Crystal on top
        const xtal = new THREE.BoxGeometry(0.5, 0.06, 0.35);
        const xtalMesh = new THREE.Mesh(xtal, darkMetalMat);
        xtalMesh.position.set(0.4, comp.size[1] / 2 + 0.03, -0.4);
        compPivot.add(xtalMesh);
      } else if (comp.category === 'connector' && comp.id.startsWith('rf')) {
        // Gold SMA Threaded Connectors
        const barrelGeom = new THREE.CylinderGeometry(0.35, 0.35, comp.size[1] * 1.5, 24);
        const barrelMesh = new THREE.Mesh(barrelGeom, brassConnectorMat);
        barrelMesh.castShadow = true;
        compPivot.add(barrelMesh);

        // Center Pin
        const centerPin = new THREE.CylinderGeometry(0.06, 0.06, comp.size[1] * 1.8, 12);
        const pinMesh = new THREE.Mesh(centerPin, goldMat);
        compPivot.add(pinMesh);

        // Base Flange
        const flange = new THREE.BoxGeometry(comp.size[0], 0.08, comp.size[2]);
        const flangeMesh = new THREE.Mesh(flange, brassConnectorMat);
        flangeMesh.position.set(0, -comp.size[1] / 2, 0);
        compPivot.add(flangeMesh);
      } else if (comp.id === 'sim-socket') {
        // SIM Card Slot
        const simHousing = new THREE.BoxGeometry(comp.size[0], comp.size[1], comp.size[2]);
        const simMesh = new THREE.Mesh(simHousing, silverShieldMat);
        simMesh.castShadow = true;
        compPivot.add(simMesh);

        // Slot cutout entrance
        const slot = new THREE.BoxGeometry(comp.size[0] * 0.9, 0.04, 0.1);
        const slotMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
        const slotMesh = new THREE.Mesh(slot, slotMat);
        slotMesh.position.set(0, 0, comp.size[2] / 2 + 0.01);
        compPivot.add(slotMesh);
      } else if (comp.id === 'usb-c-receptacle') {
        // USB-C Receptacle
        const bodyGeom = new THREE.BoxGeometry(comp.size[0], comp.size[1], comp.size[2]);
        const bodyMesh = new THREE.Mesh(bodyGeom, silverShieldMat);
        bodyMesh.castShadow = true;
        compPivot.add(bodyMesh);

        // Opening
        const hole = new THREE.BoxGeometry(0.1, comp.size[1] * 0.6, comp.size[2] * 0.7);
        const holeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const holeMesh = new THREE.Mesh(hole, holeMat);
        holeMesh.position.set(-comp.size[0] / 2 - 0.01, 0, 0);
        compPivot.add(holeMesh);
      } else if (comp.id === 'p1-battery-conn') {
        // JST-PH 2-Pin Connector
        const connGeom = new THREE.BoxGeometry(comp.size[0], comp.size[1], comp.size[2]);
        const connMesh = new THREE.Mesh(connGeom, whitePlasticMat);
        connMesh.castShadow = true;
        compPivot.add(connMesh);

        // 2 Gold Contact Pins
        [-0.25, 0.25].forEach((px) => {
          const p = new THREE.BoxGeometry(0.08, comp.size[1] * 1.3, 0.08);
          const pm = new THREE.Mesh(p, goldMat);
          pm.position.set(px, comp.size[1] * 0.3, 0);
          compPivot.add(pm);
        });
      } else if (comp.id === 'bulk-cap') {
        // 3300 uF Electrolytic Can Capacitor
        const capCyl = new THREE.CylinderGeometry(comp.size[0] / 2, comp.size[0] / 2, comp.size[1], 24);
        const capMesh = new THREE.Mesh(capCyl, pcbCapCanMat);
        capMesh.castShadow = true;
        compPivot.add(capMesh);

        // Silver stripe (negative polarity)
        const stripeGeom = new THREE.CylinderGeometry(comp.size[0] / 2 + 0.005, comp.size[0] / 2 + 0.005, comp.size[1], 8, 1, false, 0, Math.PI / 4);
        const stripeMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
        const stripeMesh = new THREE.Mesh(stripeGeom, stripeMat);
        compPivot.add(stripeMesh);
      } else if (comp.id === 'buzzer-siren') {
        // Piezo Buzzer
        const bGeom = new THREE.CylinderGeometry(comp.size[0] / 2, comp.size[0] / 2, comp.size[1], 28);
        const bMesh = new THREE.Mesh(bGeom, icBlackMat);
        bMesh.castShadow = true;
        compPivot.add(bMesh);

        // Resonant hole in center
        const hole = new THREE.CylinderGeometry(0.12, 0.12, 0.02, 16);
        const hMat = new THREE.MeshBasicMaterial({ color: 0x020202 });
        const hMesh = new THREE.Mesh(hole, hMat);
        hMesh.position.set(0, comp.size[1] / 2 + 0.01, 0);
        compPivot.add(hMesh);
      } else if (comp.id === 'j1-sensor-port') {
        // 4-Pin Header
        const base = new THREE.BoxGeometry(comp.size[0], comp.size[1] * 0.4, comp.size[2]);
        const baseM = new THREE.Mesh(base, icBlackMat);
        compPivot.add(baseM);

        for (let i = 0; i < 4; i++) {
          const pz = (i - 1.5) * 0.35;
          const pinG = new THREE.BoxGeometry(0.06, comp.size[1] * 1.6, 0.06);
          const pinM = new THREE.Mesh(pinG, goldMat);
          pinM.position.set(0, comp.size[1] * 0.4, pz);
          compPivot.add(pinM);
        }
      } else if (comp.id === 'status-leds') {
        // Tri-color LEDs
        const colors = [0x10b981, 0x38bdf8, 0xef4444];
        ledMeshesRef.current = [];
        colors.forEach((col, idx) => {
          const lGeom = new THREE.BoxGeometry(0.2, 0.08, 0.14);
          const lMat = new THREE.MeshStandardMaterial({
            color: col,
            emissive: col,
            emissiveIntensity: 0.9,
            roughness: 0.2,
          });
          const lMesh = new THREE.Mesh(lGeom, lMat);
          lMesh.position.set((idx - 1) * 0.28, 0, 0);
          compPivot.add(lMesh);
          ledMeshesRef.current.push(lMesh);
        });
      } else if (comp.id.startsWith('sw')) {
        // Tactile button
        const btnBase = new THREE.BoxGeometry(comp.size[0], comp.size[1] * 0.6, comp.size[2]);
        const btnM = new THREE.Mesh(btnBase, silverShieldMat);
        compPivot.add(btnM);

        const actuator = new THREE.CylinderGeometry(0.12, 0.12, comp.size[1] * 0.6, 16);
        const actMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
        const actM = new THREE.Mesh(actuator, actMat);
        actM.position.set(0, comp.size[1] * 0.4, 0);
        compPivot.add(actM);
      } else {
        // Default IC / Transistor / SOT-223 / SOT-23 / Diode
        const geom = new THREE.BoxGeometry(comp.size[0], comp.size[1], comp.size[2]);
        const mesh = new THREE.Mesh(geom, icBlackMat);
        mesh.castShadow = true;
        compPivot.add(mesh);

        // Terminal metallic leads
        [-comp.size[0] / 2, comp.size[0] / 2].forEach((cx) => {
          const lead = new THREE.BoxGeometry(0.08, comp.size[1] * 1.02, comp.size[2] * 0.9);
          const leadM = new THREE.Mesh(lead, solderMaterial);
          leadM.position.set(cx, 0, 0);
          compPivot.add(leadM);
        });
      }

      componentsGroup.add(compPivot);
    });

    // 6.4 Silkscreen Layer (Canvas Texture with exact board labels)
    const silkscreenGroup = new THREE.Group();
    boardGroup.add(silkscreenGroup);
    silkscreenGroupRef.current = silkscreenGroup;

    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1156; // 137.5 / 77.5 ratio
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 3;

      // Board border margin
      ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

      // Header Texts
      ctx.font = 'bold 38px monospace';
      ctx.fillText('ENVORA GATEWAY - ROOT NODE v2.4', 60, 90);
      ctx.font = 'bold 22px monospace';
      ctx.fillText('BOARD SIZE: 137.5 x 77.5 mm | LORA 865MHz + NB-IoT LTE-M + USB-SERIAL', 60, 130);

      // Coordinate converter from 3D coords to canvas
      const wToC = (wx: number, wz: number): [number, number] => {
        const u = (wx + B_WIDTH / 2) / B_WIDTH;
        const v = (wz + B_DEPTH / 2) / B_DEPTH;
        return [u * canvas.width, v * canvas.height];
      };

      // Draw bounding box and label for each component
      ROOT_NODE_COMPONENTS.forEach((c) => {
        const [cx, cy] = wToC(c.pos[0], c.pos[2]);
        const cw = (c.size[0] / B_WIDTH) * canvas.width + 16;
        const ch = (c.size[2] / B_DEPTH) * canvas.height + 16;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.strokeRect(cx - cw / 2, cy - ch / 2, cw, ch);
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(c.designator, cx - cw / 2 + 6, cy - ch / 2 - 8);
      });

      // Special labels
      const [loraX, loraY] = wToC(3.2, -1.2);
      ctx.fillText('LORA SX1276 (865MHz)', loraX - 110, loraY + 70);

      const [cellX, cellY] = wToC(1.2, 0.6);
      ctx.fillText('QUECTEL BG95-M3 (NB-IoT/LTE)', cellX - 150, cellY + 80);

      const [mcuX, mcuY] = wToC(-1.8, -0.6);
      ctx.fillText('ESP32-S3 (EDGE AI)', mcuX - 90, mcuY + 80);

      const [p1X, p1Y] = wToC(-4.2, 1.5);
      ctx.fillText('18650 BATT IN (+/-)', p1X - 80, p1Y + 45);

      const [j1X, j1Y] = wToC(-4.6, -2.0);
      ctx.fillText('J1 I2C SENSOR', j1X - 60, j1Y - 20);
    }

    const silkTexture = new THREE.CanvasTexture(canvas);
    silkTexture.anisotropy = 8;
    const silkMat = new THREE.MeshBasicMaterial({
      map: silkTexture,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    const silkGeom = new THREE.PlaneGeometry(B_WIDTH, B_DEPTH);
    silkGeom.rotateX(-Math.PI / 2);
    const silkMesh = new THREE.Mesh(silkGeom, silkMat);
    silkMesh.position.set(0, 0.082, 0);
    silkscreenGroup.add(silkMesh);

    // 7. Raycasting for Component Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(componentsGroup.children, true);

      if (intersects.length > 0) {
        let rootObj: THREE.Object3D | null = intersects[0].object;
        while (rootObj && rootObj.parent && rootObj.parent !== componentsGroup) {
          rootObj = rootObj.parent;
        }
        if (rootObj && rootObj.name) {
          const match = ROOT_NODE_COMPONENTS.find((c) => c.id === rootObj?.name);
          if (match) {
            setHoveredComp(match);
            container.style.cursor = 'pointer';
            return;
          }
        }
      }
      setHoveredComp(null);
      container.style.cursor = 'grab';
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(componentsGroup.children, true);

      if (intersects.length > 0) {
        let rootObj: THREE.Object3D | null = intersects[0].object;
        while (rootObj && rootObj.parent && rootObj.parent !== componentsGroup) {
          rootObj = rootObj.parent;
        }
        if (rootObj && rootObj.name) {
          const match = ROOT_NODE_COMPONENTS.find((c) => c.id === rootObj?.name);
          if (match) {
            setSelectedComp(match);
          }
        }
      }
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('click', onClick);

    // 8. Render Animation Loop
    let clock = 0;
    const animate = () => {
      clock += 0.016;

      // Pulse diagnostic LEDs
      if (ledMeshesRef.current.length > 0) {
        const pulse = Math.sin(clock * 6);
        ledMeshesRef.current.forEach((led, i) => {
          const mat = led.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.5 + (0.5 * Math.sin(clock * 4 + i * 2));
        });
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    // 9. Resize Handling
    const onResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight || 580;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('click', onClick);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
    };
  }, []);

  // Sync Board Color
  useEffect(() => {
    if (boardMeshRef.current) {
      const palette = boardColors[boardColor];
      const mat = boardMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.color.setHex(palette.base);
      mat.wireframe = showWireframe;
      mat.needsUpdate = true;
    }
  }, [boardColor, showWireframe, boardColors]);

  // Sync Auto Rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 2.0;
    }
  }, [autoRotate]);

  // Sync Layers
  useEffect(() => {
    if (componentsGroupRef.current) {
      componentsGroupRef.current.visible = activeLayer === 'all' || activeLayer === 'components';
    }
    if (tracesGroupRef.current) {
      tracesGroupRef.current.visible = activeLayer === 'all' || activeLayer === 'traces';
    }
    if (silkscreenGroupRef.current) {
      silkscreenGroupRef.current.visible = activeLayer === 'all' || activeLayer === 'silkscreen';
    }
  }, [activeLayer]);

  // Preset Navigation
  const applyViewPreset = (preset: typeof viewPreset) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    setViewPreset(preset);

    switch (preset) {
      case 'iso':
        camera.position.set(6.0, 9.0, 9.0);
        controls.target.set(0, 0, 0);
        break;
      case 'top':
        camera.position.set(0, 14.0, 0.01);
        controls.target.set(0, 0, 0);
        break;
      case 'mcu':
        camera.position.set(-1.8, 4.5, 2.5);
        controls.target.set(-1.8, 0.16, -0.6);
        setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'esp32-mcu')!);
        break;
      case 'bg95':
        camera.position.set(1.2, 4.5, 3.5);
        controls.target.set(1.2, 0.18, 0.6);
        setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'bg95-modem')!);
        break;
      case 'lora':
        camera.position.set(3.2, 4.0, 1.5);
        controls.target.set(3.2, 0.16, -1.2);
        setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'sx1276-lora')!);
        break;
      case 'power':
        camera.position.set(-3.5, 4.5, 4.0);
        controls.target.set(-3.2, 0.1, 1.0);
        setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'cn3065-charger')!);
        break;
      case 'ports':
        camera.position.set(-5.5, 3.5, 1.0);
        controls.target.set(-5.6, 0.18, -0.6);
        setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'usb-c-receptacle')!);
        break;
    }
  };

  // Upload Custom GLB file
  const handleGlbFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sceneRef.current) return;

    setCustomGlbName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const arrayBuffer = evt.target?.result;
      if (!arrayBuffer || !sceneRef.current) return;

      const loader = new GLTFLoader();
      loader.parse(
        arrayBuffer as ArrayBuffer,
        '',
        (gltf) => {
          if (componentsGroupRef.current) componentsGroupRef.current.visible = false;
          if (tracesGroupRef.current) tracesGroupRef.current.visible = false;
          if (silkscreenGroupRef.current) silkscreenGroupRef.current.visible = false;
          if (boardMeshRef.current) boardMeshRef.current.visible = false;

          gltf.scene.scale.set(30, 30, 30);
          sceneRef.current?.add(gltf.scene);
          setCustomGlbLoaded(true);
        },
        (error) => {
          console.error('Error parsing GLB file:', error);
        }
      );
    };
    reader.readAsArrayBuffer(file);
  };

  const filteredComponents = useMemo(() => {
    return ROOT_NODE_COMPONENTS.filter((comp) => {
      const matchesCategory = bomFilter === 'all' || comp.category === bomFilter;
      const matchesSearch =
        comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.designator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [bomFilter, searchQuery]);

  return (
    <div className="pcb-section space-y-6 pb-16 text-black">
      {/* ========================================================================= */}
      {/* 1. ROOT NODE HERO BANNER                                                  */}
      {/* ========================================================================= */}
      <BorderGlow
        edgeSensitivity={30}
        glowColor="40 80 80"
        backgroundColor="#ffffff"
        borderRadius={24}
        glowRadius={40}
        glowIntensity={1.0}
        coneSpread={25}
        animated={false}
        colors={['#06b6d4', '#10b981', '#3b82f6']}
        className="w-full"
      >
        <div className="rounded-2xl border p-6 transition-all bg-white border-slate-200 text-black shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-cyan-100 border border-cyan-300 text-cyan-800">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-black">
                      Root Node: The Gateway Board
                    </h1>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 text-black font-bold border border-emerald-300">
                      Rev 2.4 Production
                    </span>
                  </div>
                  <p className="text-xs text-black font-semibold mt-0.5">
                    Deployed at <span className="text-black font-black underline decoration-cyan-500 decoration-2">{location.name}</span> Monitoring Basin • Autonomous Telemetry & Edge AI
                  </p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-black max-w-4xl leading-relaxed font-medium">
                One root node covers an entire monitored area. It listens to the LoRa leaf nodes, runs edge AI on what they report, and pushes alerts and readings to the dashboard over NB-IoT. Powered by an 18650 rechargeable battery with solar harvesting.
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="p-1 rounded-xl border border-slate-300 bg-slate-100 flex items-center gap-1 shadow-xs">
                <button
                  onClick={() => setActiveTabMode('3d')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTabMode === '3d'
                      ? 'bg-black text-white shadow-md'
                      : 'text-black hover:bg-slate-200'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>3D Digital Twin</span>
                </button>

                <button
                  onClick={() => setActiveTabMode('schematic')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTabMode === 'schematic'
                      ? 'bg-black text-white shadow-md'
                      : 'text-black hover:bg-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>KiCad 2D Layout</span>
                </button>

                <button
                  onClick={() => setActiveTabMode('datapath')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTabMode === 'datapath'
                      ? 'bg-black text-white shadow-md'
                      : 'text-black hover:bg-slate-200'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Architecture & Data Path</span>
                </button>

                <button
                  onClick={() => setActiveTabMode('specs')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTabMode === 'specs'
                      ? 'bg-black text-white shadow-md'
                      : 'text-black hover:bg-slate-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>BOM & Hardware</span>
                </button>
              </div>

              {/* Upload GLB */}
              <label
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all bg-white hover:bg-slate-100 text-black shadow-xs"
                title="Load your own .glb from KiCad"
              >
                <Upload className="w-3.5 h-3.5 text-black" />
                <span className="text-black font-bold">{customGlbLoaded ? customGlbName : 'Import KiCad .GLB'}</span>
                <input
                  type="file"
                  accept=".glb,.gltf"
                  onChange={handleGlbFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Quick Specifications Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-5 pt-4 border-t border-slate-200 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-black block text-[10px] uppercase font-mono font-bold">Board Dimensions</span>
              <span className="font-black text-black text-sm">{ROOT_BOARD_SPEC.dimensions}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-black block text-[10px] uppercase font-mono font-bold">Board Thickness</span>
              <span className="font-black text-black text-sm">{ROOT_BOARD_SPEC.thickness}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-black block text-[10px] uppercase font-mono font-bold">Radios (3 Co-Located)</span>
              <span className="font-black text-black text-sm">LoRa, NB-IoT, USB-UART</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-black block text-[10px] uppercase font-mono font-bold">Power & Battery</span>
              <span className="font-black text-black text-sm">18650 Li-Ion + Solar In</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-black block text-[10px] uppercase font-mono font-bold">Core Processor</span>
              <span className="font-black text-black text-sm">ESP32-S3 Dual-Core</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-black block text-[10px] uppercase font-mono font-bold">Cellular Modem</span>
              <span className="font-black text-black text-sm">Quectel BG95-M3</span>
            </div>
          </div>
        </div>
      </BorderGlow>

      {/* ========================================================================= */}
      {/* 2. TAB 1: INTERACTIVE 3D DIGITAL TWIN                                      */}
      {/* ========================================================================= */}
      {activeTabMode === '3d' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main 3D Viewport Column (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <BorderGlow
              edgeSensitivity={30}
              glowColor="40 80 80"
              backgroundColor="#ffffff"
              borderRadius={24}
              glowRadius={40}
              glowIntensity={1.0}
              coneSpread={25}
              animated={false}
              colors={['#06b6d4', '#10b981', '#3b82f6']}
              className="w-full"
            >
              <div className="relative rounded-2xl border border-slate-200 overflow-hidden transition-all bg-slate-900 text-black shadow-xl">
                {/* 3D Canvas */}
                <div
                  ref={mountRef}
                  className="w-full h-[520px] sm:h-[620px] cursor-grab active:cursor-grabbing select-none"
                />

                {/* Top Controls Overlay */}
                <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                  {/* Camera Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-300 pointer-events-auto shadow-lg text-black">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-black font-black px-2 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-black" />
                      <span className="text-black font-black">Focus:</span>
                    </span>
                    <button
                      onClick={() => applyViewPreset('iso')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        viewPreset === 'iso' ? 'bg-black text-white' : 'text-black hover:bg-slate-100'
                      }`}
                    >
                      3D Iso
                    </button>
                    <button
                      onClick={() => applyViewPreset('top')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        viewPreset === 'top' ? 'bg-black text-white' : 'text-black hover:bg-slate-100'
                      }`}
                    >
                      Top-Down
                    </button>
                    <button
                      onClick={() => applyViewPreset('mcu')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        viewPreset === 'mcu' ? 'bg-black text-white' : 'text-black hover:bg-slate-100'
                      }`}
                    >
                      ESP32-S3 (U1)
                    </button>
                    <button
                      onClick={() => applyViewPreset('bg95')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        viewPreset === 'bg95' ? 'bg-black text-white' : 'text-black hover:bg-slate-100'
                      }`}
                    >
                      BG95-M3 (U5)
                    </button>
                    <button
                      onClick={() => applyViewPreset('lora')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        viewPreset === 'lora' ? 'bg-black text-white' : 'text-black hover:bg-slate-100'
                      }`}
                    >
                      SX1276 (U4)
                    </button>
                    <button
                      onClick={() => applyViewPreset('power')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        viewPreset === 'power' ? 'bg-black text-white' : 'text-black hover:bg-slate-100'
                      }`}
                    >
                      Battery / Power
                    </button>
                  </div>

                  {/* Solder Mask Color Selection & Wireframe */}
                  <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-300 pointer-events-auto shadow-lg text-black">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-black font-black px-1">PCB Solder Mask:</span>
                    <button
                      onClick={() => setBoardColor('green')}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${
                        boardColor === 'green' ? 'scale-110 border-black ring-2 ring-emerald-500/50' : 'border-transparent opacity-70'
                      }`}
                      style={{ backgroundColor: '#0c331e' }}
                      title="KiCad Forest Green (Default)"
                    />
                    <button
                      onClick={() => setBoardColor('dark')}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${
                        boardColor === 'dark' ? 'scale-110 border-black ring-2 ring-slate-500/50' : 'border-transparent opacity-70'
                      }`}
                      style={{ backgroundColor: '#11161d' }}
                      title="Matte Stealth Dark"
                    />
                    <button
                      onClick={() => setBoardColor('blue')}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${
                        boardColor === 'blue' ? 'scale-110 border-black ring-2 ring-blue-500/50' : 'border-transparent opacity-70'
                      }`}
                      style={{ backgroundColor: '#092b47' }}
                      title="Royal Blue"
                    />
                    <button
                      onClick={() => setBoardColor('purple')}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${
                        boardColor === 'purple' ? 'scale-110 border-black ring-2 ring-purple-500/50' : 'border-transparent opacity-70'
                      }`}
                      style={{ backgroundColor: '#241138' }}
                      title="OSH Park Purple"
                    />

                    <div className="h-4 w-[1px] bg-slate-300 mx-1" />

                    <button
                      onClick={() => setAutoRotate(!autoRotate)}
                      className={`p-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition-colors cursor-pointer ${
                        autoRotate ? 'bg-cyan-100 text-black border border-cyan-400' : 'text-black hover:bg-slate-100'
                      }`}
                      title="Toggle Auto-Rotation"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin text-black' : 'text-black'}`} />
                      <span className="hidden sm:inline text-black">Rotate</span>
                    </button>

                    <button
                      onClick={() => setShowWireframe(!showWireframe)}
                      className={`p-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition-colors cursor-pointer ${
                        showWireframe ? 'bg-cyan-100 text-black border border-cyan-400' : 'text-black hover:bg-slate-100'
                      }`}
                      title="Toggle Wireframe CAD Mode"
                    >
                      <Eye className="w-3.5 h-3.5 text-black" />
                    </button>
                  </div>
                </div>

                {/* Bottom HUD: Layer Filter Bar & Interactive Tooltip */}
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
                  {/* Layer Filters */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-white/95 backdrop-blur-md border border-slate-300 pointer-events-auto shadow-lg text-xs text-black">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-black font-black px-2 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-black" />
                      <span className="text-black">Layers:</span>
                    </span>
                    {(['all', 'components', 'traces', 'silkscreen'] as const).map((layer) => (
                      <button
                        key={layer}
                        onClick={() => setActiveLayer(layer)}
                        className={`px-2.5 py-1 rounded-lg font-black capitalize transition-colors cursor-pointer ${
                          activeLayer === layer
                            ? 'bg-black text-white'
                            : 'text-black hover:bg-slate-100'
                        }`}
                      >
                        {layer}
                      </button>
                    ))}
                  </div>

                  {/* Hover or Instructions indicator */}
                  {hoveredComp ? (
                    <div className="p-2 px-3.5 rounded-xl bg-white/95 border border-cyan-500 text-black backdrop-blur-md shadow-xl text-xs flex items-center gap-2 pointer-events-auto font-black animate-pulse">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                      <span className="font-mono font-black text-black">{hoveredComp.designator}:</span>
                      <span className="text-black font-bold">{hoveredComp.name}</span>
                      <span className="font-mono text-[10px] bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded text-black font-black">
                        Click to Inspect
                      </span>
                    </div>
                  ) : (
                    <div className="hidden sm:flex items-center gap-2 p-2 px-3 rounded-xl bg-white/90 border border-slate-300 text-[11px] font-mono text-black font-black shadow-md">
                      <span className="text-black">Click any component on the board to view full schematics</span>
                    </div>
                  )}
                </div>
              </div>
            </BorderGlow>
          </div>

          {/* Right Column (4 cols): Detailed Selected Component Inspector */}
          <div className="lg:col-span-4 space-y-4">
            <BorderGlow
              edgeSensitivity={30}
              glowColor="40 80 80"
              backgroundColor="#ffffff"
              borderRadius={24}
              glowRadius={40}
              glowIntensity={1.0}
              coneSpread={25}
              animated={false}
              colors={['#06b6d4', '#10b981', '#3b82f6']}
              className="w-full"
            >
              <div className="rounded-2xl border p-5 transition-all bg-white border-slate-200 text-black shadow-sm">
                {/* Component Inspector Header */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4 mb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-cyan-300 text-black bg-cyan-50 font-black">
                      Component Inspector
                    </span>
                    <h2 className="text-lg font-black mt-2 flex items-center gap-2 text-black">
                      <span className="text-black font-mono font-black">{selectedComp.designator}</span>
                      <span className="text-black font-bold">—</span>
                      <span className="text-sm font-black text-black">{selectedComp.name}</span>
                    </h2>
                    <span className="text-[11px] font-mono text-black font-bold mt-0.5 block">
                      Footprint: {selectedComp.package}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-300 bg-slate-50 shrink-0 text-black shadow-2xs">
                    {selectedComp.category === 'mcu' && <Cpu className="w-5 h-5 text-cyan-800" />}
                    {selectedComp.category === 'rf' && <Radio className="w-5 h-5 text-sky-800" />}
                    {selectedComp.category === 'sensor' && <Zap className="w-5 h-5 text-amber-800" />}
                    {selectedComp.category === 'power' && <BatteryCharging className="w-5 h-5 text-emerald-800" />}
                    {selectedComp.category === 'connector' && <Usb className="w-5 h-5 text-indigo-800" />}
                    {selectedComp.category === 'indicator' && <Volume2 className="w-5 h-5 text-red-800" />}
                    {selectedComp.category === 'passive' && <Microchip className="w-5 h-5 text-teal-800" />}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-xs text-black leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium">
                    {selectedComp.description}
                  </div>

                  {/* Technical Specifications Table */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-black" />
                      <span className="text-black">Electrical Parameters</span>
                    </h3>
                    <div className="rounded-xl border border-slate-200 divide-y divide-slate-200 overflow-hidden text-xs bg-slate-50">
                      {Object.entries(selectedComp.specs).map(([specKey, specVal]) => (
                        <div key={specKey} className="px-3 py-2 flex items-center justify-between gap-2">
                          <span className="text-black font-bold">{specKey}:</span>
                          <span className="font-mono font-black text-right text-black">{specVal}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Connected Netlist Signals */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="text-black">Associated PCB Nets ({selectedComp.nets.length})</span>
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedComp.nets.map((net) => (
                        <span
                          key={net}
                          className="text-[10px] font-mono px-2 py-1 rounded-md border font-black text-black bg-slate-100 border-slate-300"
                        >
                          {net}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Quick Component Selector list */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-black text-black block mb-1">
                      Quick Pick Component:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                      {ROOT_NODE_COMPONENTS.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedComp(c)}
                          className={`px-2 py-1.5 rounded-lg text-left text-xs font-mono transition-all border cursor-pointer ${
                            selectedComp.id === c.id
                              ? 'bg-black text-white border-black font-black shadow-sm'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-black'
                          }`}
                        >
                          <span className={`font-black ${selectedComp.id === c.id ? 'text-white' : 'text-black'}`}>{c.designator}</span>{' '}
                          <span className={`text-[10px] block truncate font-bold ${selectedComp.id === c.id ? 'text-slate-200' : 'text-black'}`}>{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </BorderGlow>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB 2: KICAD 2D CAD LAYOUT (Interactive Vector Representation)          */}
      {/* ========================================================================= */}
      {activeTabMode === 'schematic' && (
        <BorderGlow
          edgeSensitivity={30}
          glowColor="40 80 80"
          backgroundColor="#ffffff"
          borderRadius={24}
          glowRadius={40}
          glowIntensity={1.0}
          coneSpread={25}
          animated={false}
          colors={['#06b6d4', '#10b981', '#3b82f6']}
          className="w-full"
        >
          <div className="rounded-2xl border p-6 transition-all bg-white border-slate-200 text-black shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-black flex items-center gap-2 text-black">
                  <Layers className="w-5 h-5 text-black" />
                  <span>Root Node KiCad Top-Layer SMT Gerber & Placement</span>
                </h2>
                <p className="text-xs text-black font-semibold mt-1">
                  137.5 × 77.5 mm Board Form Factor • 1.6 mm FR-4 Double-Sided Routing with 50Ω Controlled Impedance Traces
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-3 py-1 bg-emerald-100 text-black border border-emerald-300 rounded-lg font-black">
                  Active Selected: <strong className="text-black font-black">{selectedComp.designator} ({selectedComp.name})</strong>
                </span>
              </div>
            </div>

            {/* Interactive SVG replicating the exact uploaded KiCad Layout image.png with Black Typography */}
            <div className="bg-[#0b1f15] border border-emerald-900/70 rounded-xl p-4 sm:p-8 flex items-center justify-center overflow-x-auto shadow-2xl relative">
              <svg
                viewBox="0 0 1375 775"
                className="w-full max-w-5xl h-auto"
                style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.7))' }}
              >
                {/* PCB Outline */}
                <rect x="10" y="10" width="1355" height="755" rx="20" fill="#0d2518" stroke="#1b4d31" strokeWidth="4" />

                {/* Corner Mounting Holes M3 with annular copper rings */}
                <g fill="none" stroke="#d4af37" strokeWidth="5">
                  <circle cx="50" cy="50" r="28" />
                  <circle cx="1325" cy="50" r="28" />
                  <circle cx="1325" cy="725" r="28" />
                  <circle cx="50" cy="725" r="28" />
                </g>
                <g fill="#050d08">
                  <circle cx="50" cy="50" r="16" />
                  <circle cx="1325" cy="50" r="16" />
                  <circle cx="1325" cy="725" r="16" />
                  <circle cx="50" cy="725" r="16" />
                </g>

                {/* Ground plane decorative copper zones & thermal relief */}
                <path d="M 60 60 L 1315 60 L 1315 715 L 60 715 Z" fill="none" stroke="#123d24" strokeWidth="2" strokeDasharray="6 6" />

                {/* COPPER TRACES (drawn as matching image.png) */}
                <g stroke="#2bb563" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.85">
                  {/* USB-C to CH340K traces */}
                  <path d="M 80 180 L 170 180 L 220 220 L 290 220" />
                  <path d="M 80 200 L 160 200 L 210 240 L 290 240" />

                  {/* CH340K to ESP32 UART */}
                  <path d="M 370 240 L 460 240 L 510 280 L 580 280" />
                  <path d="M 370 260 L 450 260 L 500 300 L 580 300" />

                  {/* Auto reset lines */}
                  <path d="M 370 200 L 420 150 L 480 150" />
                  <path d="M 520 150 L 580 150 L 610 180" />

                  {/* Top route to SW1 & Q1 */}
                  <path d="M 490 80 L 670 80 L 670 170" />
                  <path d="M 690 120 L 710 120 L 710 200" />

                  {/* U4 (SX1276) SPI Bus from ESP32 */}
                  <path d="M 750 320 L 890 320 L 930 260 L 1050 260" />
                  <path d="M 750 340 L 880 340 L 920 280 L 1050 280" />
                  <path d="M 750 360 L 870 360 L 910 300 L 1050 300" />
                  <path d="M 750 380 L 860 380 L 900 320 L 1050 320" />

                  {/* SX1276 ANT to RF1 (50-Ohm Controlled Track) */}
                  <path d="M 1210 240 L 1240 240 L 1240 130 L 1210 100" stroke="#facc15" strokeWidth="8" />

                  {/* ESP32 to Level Shifter (TXS0102) & BG95-M3 */}
                  <path d="M 720 480 L 720 540 L 760 540" />
                  <path d="M 740 480 L 740 560 L 760 560" />
                  <path d="M 830 540 L 870 540 L 900 520 L 940 520" />
                  <path d="M 830 560 L 870 560 L 900 540 L 940 540" />

                  {/* BG95-M3 to RF2 Antenna (Cellular 50-Ohm Microstrip) */}
                  <path d="M 940 600 L 780 600 L 720 670" stroke="#facc15" strokeWidth="8" />

                  {/* BG95-M3 to SIM1 */}
                  <path d="M 1080 500 L 1150 500" />
                  <path d="M 1080 520 L 1150 520" />
                  <path d="M 1080 540 L 1150 540" />
                  <path d="M 1080 560 L 1150 560" />

                  {/* P1 Battery to CN3065, DW01A, D1 */}
                  <path d="M 330 520 L 260 520 L 220 560" stroke="#f97316" strokeWidth="6" />
                  <path d="M 280 520 L 280 430 L 350 430" stroke="#f97316" strokeWidth="6" />
                  <path d="M 390 520 L 460 520 L 460 580" stroke="#f97316" strokeWidth="6" />

                  {/* J1 Sensor Port to ESP32 */}
                  <path d="M 220 330 L 320 330 L 370 380 L 580 380" />
                  <path d="M 220 350 L 310 350 L 360 400 L 580 400" />

                  {/* BUZZER1 to Q4 */}
                  <path d="M 150 450 L 200 450 L 230 480" />
                </g>

                {/* ================= COMPONENT FOOTPRINTS ================= */}
                {/* U1: ESP32-S3-WROOM-1 Module */}
                <g
                  className="cursor-pointer transition-all hover:opacity-80"
                  onClick={() => setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'esp32-mcu')!)}
                >
                  <rect
                    x="580"
                    y="220"
                    width="190"
                    height="270"
                    rx="8"
                    fill={selectedComp.id === 'esp32-mcu' ? '#cbd5e1' : '#f1f5f9'}
                    stroke={selectedComp.id === 'esp32-mcu' ? '#0284c7' : '#000000'}
                    strokeWidth={selectedComp.id === 'esp32-mcu' ? '4' : '2'}
                  />
                  {/* Antenna PCB area on top */}
                  <rect x="585" y="225" width="180" height="60" rx="4" fill="#e2e8f0" stroke="#eab308" strokeWidth="1.5" />
                  <path d="M 600 240 L 750 240 M 600 255 L 750 255 M 630 240 L 630 270 M 700 240 L 700 270" stroke="#000000" strokeWidth="2.5" />
                  {/* Metal Shield Can */}
                  <rect x="590" y="295" width="170" height="185" rx="6" fill="#ffffff" stroke="#000000" strokeWidth="2" />
                  <text x="675" y="380" fill="#000000" fontSize="18" fontWeight="900" textAnchor="middle" fontFamily="monospace">ESP32-S3</text>
                  <text x="675" y="405" fill="#000000" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">WROOM-1-N8 (8MB)</text>
                  <text x="675" y="425" fill="#000000" fontSize="11" fontWeight="900" textAnchor="middle" fontFamily="monospace">EDGE AI CORE</text>
                </g>

                {/* U5: Quectel BG95-M3 Cellular Modem */}
                <g
                  className="cursor-pointer transition-all hover:opacity-80"
                  onClick={() => setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'bg95-modem')!)}
                >
                  <rect
                    x="940"
                    y="430"
                    width="180"
                    height="200"
                    rx="6"
                    fill={selectedComp.id === 'bg95-modem' ? '#fde68a' : '#f8fafc'}
                    stroke={selectedComp.id === 'bg95-modem' ? '#d97706' : '#000000'}
                    strokeWidth={selectedComp.id === 'bg95-modem' ? '4' : '2'}
                  />
                  {/* LGA Pins border simulation */}
                  <g fill="#d4af37">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((p) => (
                      <React.Fragment key={p}>
                        <rect x={950 + p * 13} y="422" width="8" height="14" rx="1" />
                        <rect x={950 + p * 13} y="624" width="8" height="14" rx="1" />
                      </React.Fragment>
                    ))}
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((p) => (
                      <React.Fragment key={p}>
                        <rect x="932" y={440 + p * 14} width="14" height="8" rx="1" />
                        <rect x="1114" y={440 + p * 14} width="14" height="8" rx="1" />
                      </React.Fragment>
                    ))}
                  </g>
                  {/* Central Thermal Pad Matrix (visible in image) */}
                  <g fill="#d4af37" opacity="0.9">
                    {[0, 1, 2, 3].map((r) =>
                      [0, 1, 2, 3].map((c) => (
                        <circle key={`${r}-${c}`} cx={995 + c * 22} cy={500 + r * 20} r="5" />
                      ))
                    )}
                  </g>
                  <rect x="965" y="475" width="130" height="110" rx="4" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
                  <text x="1030" y="525" fill="#000000" fontSize="16" fontWeight="900" textAnchor="middle" fontFamily="monospace">QUECTEL</text>
                  <text x="1030" y="550" fill="#000000" fontSize="14" fontWeight="900" textAnchor="middle" fontFamily="monospace">BG95-M3</text>
                  <text x="1030" y="570" fill="#000000" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">LTE-M / NB-IoT</text>
                </g>

                {/* U4: SX1276 LoRa Transceiver */}
                <g
                  className="cursor-pointer transition-all hover:opacity-80"
                  onClick={() => setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'sx1276-lora')!)}
                >
                  <rect
                    x="1050"
                    y="210"
                    width="150"
                    height="150"
                    rx="6"
                    fill={selectedComp.id === 'sx1276-lora' ? '#a7f3d0' : '#f8fafc'}
                    stroke={selectedComp.id === 'sx1276-lora' ? '#059669' : '#000000'}
                    strokeWidth={selectedComp.id === 'sx1276-lora' ? '4' : '2'}
                  />
                  {/* Gold pads */}
                  <g fill="#d4af37">
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                      <React.Fragment key={i}>
                        <rect x="1040" y={225 + i * 18} width="16" height="10" rx="2" />
                        <rect x="1194" y={225 + i * 18} width="16" height="10" rx="2" />
                      </React.Fragment>
                    ))}
                  </g>
                  {/* ANT Text & Pad */}
                  <rect x="1185" y="215" width="20" height="20" fill="#d4af37" />
                  <text x="1175" y="230" fill="#000000" fontSize="11" fontWeight="900" textAnchor="end">ANT</text>
                  <rect x="1080" y="240" width="85" height="90" rx="4" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
                  <text x="1125" y="280" fill="#000000" fontSize="16" fontWeight="900" textAnchor="middle" fontFamily="monospace">SX1276</text>
                  <text x="1125" y="305" fill="#000000" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">865MHz LoRa</text>
                </g>

                {/* RF1: LoRa Antenna SMA */}
                <g
                  className="cursor-pointer"
                  onClick={() => setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'rf1-connector')!)}
                >
                  <rect x="1170" y="35" width="70" height="70" rx="4" fill="#f8fafc" stroke="#d4af37" strokeWidth="2.5" />
                  <circle cx="1205" cy="70" r="22" fill="#d4af37" />
                  <circle cx="1205" cy="70" r="10" fill="#020617" />
                  <circle cx="1205" cy="70" r="4" fill="#eab308" />
                  <text x="1155" y="75" fill="#000000" fontSize="12" fontWeight="900" textAnchor="end">RF1</text>
                </g>

                {/* RF2: Cellular Antenna SMA */}
                <g
                  className="cursor-pointer"
                  onClick={() => setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'rf2-connector')!)}
                >
                  <rect x="685" y="665" width="70" height="70" rx="4" fill="#f8fafc" stroke="#d4af37" strokeWidth="2.5" />
                  <circle cx="720" cy="700" r="22" fill="#d4af37" />
                  <circle cx="720" cy="700" r="10" fill="#020617" />
                  <circle cx="720" cy="700" r="4" fill="#eab308" />
                  <text x="720" y="655" fill="#000000" fontSize="12" fontWeight="900" textAnchor="middle">RF2</text>
                </g>

                {/* RF3: Auxiliary/GNSS Antenna SMA */}
                <g
                  className="cursor-pointer"
                  onClick={() => setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'rf3-connector')!)}
                >
                  <rect x="1245" y="580" width="70" height="70" rx="4" fill="#f8fafc" stroke="#d4af37" strokeWidth="2.5" />
                  <circle cx="1280" cy="615" r="22" fill="#d4af37" />
                  <circle cx="1280" cy="615" r="10" fill="#020617" />
                  <circle cx="1280" cy="615" r="4" fill="#eab308" />
                  <text x="1330" y="620" fill="#000000" fontSize="12" fontWeight="900">RF3</text>
                </g>

                {/* SIM1: Micro-SIM Socket */}
                <g
                  className="cursor-pointer"
                  onClick={() => setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'sim-socket')!)}
                >
                  <rect x="1145" y="470" width="140" height="150" rx="4" fill="#f8fafc" stroke="#f43f5e" strokeWidth="2" />
                  <path d="M 1150 475 L 1265 475 L 1280 490 L 1280 615 L 1150 615 Z" fill="#e2e8f0" stroke="#000000" />
                  <text x="1215" y="550" fill="#000000" fontSize="14" fontWeight="900" textAnchor="middle">SIM1</text>
                  <g fill="#d4af37">
                    <rect x="1155" y="460" width="12" height="14" rx="1" />
                    <rect x="1185" y="460" width="12" height="14" rx="1" />
                    <rect x="1215" y="460" width="12" height="14" rx="1" />
                    <rect x="1245" y="460" width="12" height="14" rx="1" />
                  </g>
                </g>

                {/* USB-C Receptacle */}
                <g
                  className="cursor-pointer"
                  onClick={() => setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'usb-c-receptacle')!)}
                >
                  <rect x="20" y="160" width="70" height="100" rx="8" fill="#e2e8f0" stroke="#000000" strokeWidth="2" />
                  <rect x="15" y="185" width="20" height="50" rx="3" fill="#000000" />
                  <text x="50" y="215" fill="#000000" fontSize="12" fontWeight="900" transform="rotate(-90 50 215)" textAnchor="middle">USB-C</text>
                </g>

                {/* U9: CH340K USB to UART Bridge */}
                <g
                  className="cursor-pointer"
                  onClick={() => setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'ch340k-bridge')!)}
                >
                  <rect x="290" y="200" width="90" height="80" rx="3" fill="#f8fafc" stroke="#000000" strokeWidth="2" />
                  <text x="335" y="245" fill="#000000" fontSize="14" fontWeight="900" textAnchor="middle">CH340K</text>
                  <text x="335" y="265" fill="#000000" fontSize="11" fontWeight="bold" textAnchor="middle">U9</text>
                  <g fill="#d4af37">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <React.Fragment key={i}>
                        <rect x="278" y={208 + i * 14} width="14" height="6" rx="1" />
                        <rect x="378" y={208 + i * 14} width="14" height="6" rx="1" />
                      </React.Fragment>
                    ))}
                  </g>
                </g>

                {/* Q1, Q2: S8050 Auto-Reset Transistors */}
                <g
                  className="cursor-pointer"
                  onClick={() => setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'autoreset-circuit')!)}
                >
                  <rect x="680" y="150" width="40" height="30" rx="2" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
                  <text x="700" y="142" fill="#000000" fontSize="11" fontWeight="bold" textAnchor="middle">Q1</text>
                  <rect x="1100" y="160" width="40" height="30" rx="2" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
                  <text x="1120" y="152" fill="#000000" fontSize="11" fontWeight="bold" textAnchor="middle">Q2</text>
                </g>

                {/* SW1: Reset Button */}
                <g
                  className="cursor-pointer"
                  onClick={() => setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'sw1-switch')!)}
                >
                  <rect x="660" y="200" width="45" height="50" rx="4" fill="#ffffff" stroke="#f43f5e" strokeWidth="2" />
                  <circle cx="682" cy="225" r="14" fill="#e11d48" />
                  <text x="635" y="230" fill="#000000" fontSize="13" fontWeight="900">SW1</text>
                </g>

                {/* SW2: Boot Button */}
                <g
                  className="cursor-pointer"
                  onClick={() => setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'sw2-switch')!)}
                >
                  <rect x="990" y="130" width="45" height="50" rx="4" fill="#ffffff" stroke="#f59e0b" strokeWidth="2" />
                  <circle cx="1012" cy="155" r="14" fill="#d97706" />
                  <text x="965" y="160" fill="#000000" fontSize="13" fontWeight="900">SW2</text>
                </g>

                {/* P1: 2-Pin Battery Terminal (18650) with large through holes */}
                <g
                  className="cursor-pointer"
                  onClick={() => setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'p1-battery-conn')!)}
                >
                  <rect x="180" y="530" width="160" height="150" rx="8" fill="#ffffff" stroke="#000000" strokeWidth="3" />
                  <circle cx="230" cy="605" r="22" fill="#f8fafc" stroke="#d4af37" strokeWidth="5" />
                  <circle cx="290" cy="605" r="22" fill="#f8fafc" stroke="#d4af37" strokeWidth="5" />
                  <text x="260" y="560" fill="#000000" fontSize="18" fontWeight="900" textAnchor="middle">P1 (BATTERY)</text>
                  <text x="230" y="660" fill="#000000" fontSize="20" fontWeight="900" textAnchor="middle">+</text>
                  <text x="290" y="660" fill="#000000" fontSize="24" fontWeight="900" textAnchor="middle">-</text>
                </g>

                {/* C_BULK: 3300uF Capacitor */}
                <g
                  className="cursor-pointer"
                  onClick={() => setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'bulk-cap')!)}
                >
                  <circle cx="850" cy="620" r="45" fill="#bfdbfe" stroke="#000000" strokeWidth="3" />
                  <rect x="805" y="605" width="20" height="30" fill="#ffffff" stroke="#000000" />
                  <text x="850" y="625" fill="#000000" fontSize="14" fontWeight="900" textAnchor="middle">3300µF</text>
                  <text x="850" y="685" fill="#000000" fontSize="12" fontWeight="bold" textAnchor="middle">LOW-ESR</text>
                </g>

                {/* U3: CN3065 Charger IC */}
                <g
                  className="cursor-pointer"
                  onClick={() => setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'cn3065-charger')!)}
                >
                  <rect x="360" y="390" width="60" height="60" rx="3" fill="#ffffff" stroke="#eab308" strokeWidth="2" />
                  <text x="390" y="425" fill="#000000" fontSize="12" fontWeight="900" textAnchor="middle">CN3065</text>
                  <g fill="#d4af37">
                    {[0, 1, 2, 3].map((i) => (
                      <React.Fragment key={i}>
                        <rect x="352" y={397 + i * 14} width="10" height="5" />
                        <rect x="418" y={397 + i * 14} width="10" height="5" />
                      </React.Fragment>
                    ))}
                  </g>
                </g>

                {/* U8: DW01A + FS8205A Battery Protection */}
                <g
                  className="cursor-pointer"
                  onClick={() => setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'dw01a-protection')!)}
                >
                  <rect x="120" y="570" width="45" height="50" rx="3" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
                  <text x="142" y="600" fill="#000000" fontSize="11" fontWeight="900" textAnchor="middle">DW01A</text>
                </g>

                {/* D1: 1N5819 Schottky Diode */}
                <g
                  className="cursor-pointer"
                  onClick={() => setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'd1-schottky')!)}
                >
                  <rect x="380" y="550" width="70" height="35" rx="3" fill="#ffffff" stroke="#fb923c" strokeWidth="2" />
                  <rect x="390" y="552" width="8" height="31" fill="#000000" />
                  <text x="425" y="572" fill="#000000" fontSize="12" fontWeight="900">D1</text>
                </g>

                {/* U2: AMS1117-3.3 Regulator */}
                <g
                  className="cursor-pointer"
                  onClick={() => setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'ams1117-ldo')!)}
                >
                  <rect x="1000" y="45" width="80" height="60" rx="3" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
                  <rect x="1020" y="37" width="40" height="12" fill="#d4af37" />
                  <text x="1040" y="80" fill="#000000" fontSize="12" fontWeight="900" textAnchor="middle">AMS1117</text>
                </g>

                {/* J1: 4-Pin I2C Sensor Port */}
                <g
                  className="cursor-pointer"
                  onClick={() => setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'j1-sensor-port')!)}
                >
                  <rect x="235" y="275" width="40" height="140" rx="6" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
                  <text x="210" y="340" fill="#000000" fontSize="15" fontWeight="900">J1</text>
                  {[0, 1, 2, 3].map((i) => (
                    <circle key={i} cx="255" cy={300 + i * 30} r="10" fill="#f8fafc" stroke="#d4af37" strokeWidth="4" />
                  ))}
                  <text x="255" y="265" fill="#000000" fontSize="11" fontWeight="bold" textAnchor="middle">I2C BUS</text>
                </g>

                {/* Status LEDs (LED1, LED2, LED3) */}
                <g
                  className="cursor-pointer"
                  onClick={() => setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'status-leds')!)}
                >
                  <rect x="1060" y="160" width="22" height="12" rx="2" fill="#10b981" stroke="#d4af37" />
                  <text x="1071" y="152" fill="#000000" fontSize="10" fontWeight="bold" textAnchor="middle">LED1</text>
                  <rect x="490" y="400" width="22" height="12" rx="2" fill="#38bdf8" stroke="#d4af37" />
                  <text x="501" y="392" fill="#000000" fontSize="10" fontWeight="bold" textAnchor="middle">LED2</text>
                  <rect x="245" y="240" width="22" height="12" rx="2" fill="#ef4444" stroke="#d4af37" />
                  <text x="256" y="232" fill="#000000" fontSize="10" fontWeight="bold" textAnchor="middle">LED3</text>
                </g>

                {/* BUZZER1: Piezo Siren */}
                <g
                  className="cursor-pointer"
                  onClick={() => setSelectedComp(ROOT_NODE_COMPONENTS.find((c) => c.id === 'buzzer-siren')!)}
                >
                  <circle cx="100" cy="460" r="40" fill="#ffffff" stroke="#ec4899" strokeWidth="2.5" />
                  <circle cx="100" cy="460" r="10" fill="#020617" />
                  <text x="100" y="520" fill="#000000" fontSize="13" fontWeight="900" textAnchor="middle">BUZZER1</text>
                </g>
              </svg>
            </div>
          </div>
        </BorderGlow>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB 3: SYSTEM ARCHITECTURE & DATA PATH                                 */}
      {/* ========================================================================= */}
      {activeTabMode === 'datapath' && (
        <div className="space-y-6">
          <BorderGlow
            edgeSensitivity={30}
            glowColor="40 80 80"
            backgroundColor="#ffffff"
            borderRadius={24}
            glowRadius={40}
            glowIntensity={1.0}
            coneSpread={25}
            animated={false}
            colors={['#06b6d4', '#10b981', '#3b82f6']}
            className="w-full"
          >
            <div className="rounded-2xl border p-6 transition-all bg-white border-slate-200 text-black shadow-sm">
              <h2 className="text-lg font-black flex items-center gap-2 mb-2 text-black">
                <GitBranch className="w-5 h-5 text-black" />
                <span>End-to-End Field Telemetry & Power Architecture</span>
              </h2>
              <p className="text-xs text-black font-semibold mb-6">
                How the Root Node Gateway captures, processes, protects, and routes real-time sensor streams from river banks to emergency operators.
              </p>

              {/* Data Pipeline Steps */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 relative shadow-2xs">
                  <div className="absolute top-2 right-2 text-xs font-mono font-black text-black">STAGE 01</div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 mb-3">
                    <Radio className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-sm text-black mb-1">LoRa Mesh Ingestion</h3>
                  <p className="text-xs text-black font-medium leading-relaxed mb-3">
                    Distributed leaf nodes transmit encrypted hydro-sensor packets via Semtech <strong>SX1276</strong> on 865 MHz.
                  </p>
                  <div className="text-[11px] font-mono text-black font-bold bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
                    Input: RF1 (SMA) ➔ SPI @ 3.3V
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 relative shadow-2xs">
                  <div className="absolute top-2 right-2 text-xs font-mono font-black text-black">STAGE 02</div>
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-800 mb-3">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-sm text-black mb-1">ESP32-S3 Edge AI</h3>
                  <p className="text-xs text-black font-medium leading-relaxed mb-3">
                    Dual-core Xtensa MCU decodes telemetry, validates checksums, and executes on-device flood threshold machine learning.
                  </p>
                  <div className="text-[11px] font-mono text-black font-bold bg-cyan-50 border border-cyan-200 px-2 py-1 rounded">
                    Core: 240MHz • 8MB Flash • TinyML
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 relative shadow-2xs">
                  <div className="absolute top-2 right-2 text-xs font-mono font-black text-black">STAGE 03</div>
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 border border-indigo-300 flex items-center justify-center text-indigo-800 mb-3">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-sm text-black mb-1">Signal Isolation & Level Shift</h3>
                  <p className="text-xs text-black font-medium leading-relaxed mb-3">
                    <strong>TXS0102</strong> converts MCU 3.3V UART signals down to 1.8V for safe high-speed communication with the cellular modem.
                  </p>
                  <div className="text-[11px] font-mono text-black font-bold bg-indigo-50 border border-indigo-200 px-2 py-1 rounded">
                    Bus: UART 1.8V ⬌ 3.3V Dual-Rail
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 relative shadow-2xs">
                  <div className="absolute top-2 right-2 text-xs font-mono font-black text-black">STAGE 04</div>
                  <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 mb-3">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-sm text-black mb-1">NB-IoT Cloud Uplink</h3>
                  <p className="text-xs text-black font-medium leading-relaxed mb-3">
                    Quectel <strong>BG95-M3</strong> powers up with a 3300µF surge reservoir, dispatching telemetry packets via MQTT/HTTPS over SIM1.
                  </p>
                  <div className="text-[11px] font-mono text-black font-bold bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                    Output: RF2 (SMA) ➔ Cloud Dashboard
                  </div>
                </div>
              </div>

              {/* Subsystem Architecture Grid */}
              <h3 className="text-sm font-black uppercase tracking-wider text-black mb-3">
                Functional Subsystem Directory
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ROOT_SYSTEM_BLOCKS.map((block) => (
                  <div
                    key={block.title}
                    className="p-4 rounded-xl border border-slate-300 bg-slate-50 shadow-2xs text-black"
                  >
                    <div className="font-black text-sm text-black mb-0.5">{block.title}</div>
                    <div className="text-[11px] font-mono font-bold text-black opacity-80 mb-2">{block.subtitle}</div>
                    <p className="text-xs text-black font-medium leading-relaxed mb-3">{block.purpose}</p>
                    <div className="flex flex-wrap gap-1">
                      {block.components.map((comp) => (
                        <span
                          key={comp}
                          className="text-[10px] font-mono px-2 py-0.5 bg-white rounded border border-slate-300 text-black font-bold"
                        >
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </BorderGlow>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 4: BILL OF MATERIALS (BOM) & SPECIFICATIONS                        */}
      {/* ========================================================================= */}
      {activeTabMode === 'specs' && (
        <BorderGlow
          edgeSensitivity={30}
          glowColor="40 80 80"
          backgroundColor="#ffffff"
          borderRadius={24}
          glowRadius={40}
          glowIntensity={1.0}
          coneSpread={25}
          animated={false}
          colors={['#06b6d4', '#10b981', '#3b82f6']}
          className="w-full"
        >
          <div className="rounded-2xl border p-6 transition-all bg-white border-slate-200 text-black shadow-sm">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-base font-black flex items-center gap-2 text-black">
                  <Sliders className="w-4 h-4 text-black" />
                  <span>Root Node Bill of Materials (BOM)</span>
                </h2>
                <p className="text-xs text-black font-semibold mt-0.5">
                  Complete component ledger for the 137.5 × 77.5 mm gateway hardware.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-black" />
                  <input
                    type="text"
                    placeholder="Search part, net, package..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-black placeholder-slate-500 font-bold focus:outline-none focus:border-black"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-300 text-xs">
                  {(['all', 'mcu', 'rf', 'power', 'connector', 'indicator', 'passive'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setBomFilter(cat)}
                      className={`px-2.5 py-1 rounded capitalize font-bold transition-colors cursor-pointer ${
                        bomFilter === cat
                          ? 'bg-black text-white'
                          : 'text-black hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono text-black">
                <thead className="border-b border-slate-300 font-black uppercase text-[10px] bg-slate-100 text-black">
                  <tr>
                    <th className="px-4 py-3 text-black">Designator</th>
                    <th className="px-4 py-3 text-black">Part Name</th>
                    <th className="px-4 py-3 text-black">Category</th>
                    <th className="px-4 py-3 text-black">Package / Footprint</th>
                    <th className="px-4 py-3 text-black">Key Function</th>
                    <th className="px-4 py-3 text-right text-black">3D Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredComponents.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setSelectedComp(item);
                        setActiveTabMode('3d');
                      }}
                      className="cursor-pointer transition-colors hover:bg-slate-100"
                    >
                      <td className="px-4 py-3.5 font-black text-black">
                        {item.designator}
                      </td>
                      <td className="px-4 py-3.5 font-sans font-bold text-black">
                        {item.name}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[10px] font-sans font-black px-2 py-0.5 rounded-full border bg-slate-100 text-black border-slate-300">
                          {item.category.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-black font-semibold">
                        {item.package}
                      </td>
                      <td className="px-4 py-3.5 text-black font-sans font-medium max-w-sm truncate">
                        {item.description}
                      </td>
                      <td className="px-4 py-3.5 text-right font-sans">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedComp(item);
                            setActiveTabMode('3d');
                          }}
                          className="px-2.5 py-1 rounded bg-black text-white text-xs font-bold inline-flex items-center gap-1 hover:bg-slate-800"
                        >
                          <span>Locate</span>
                          <span>&rarr;</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </BorderGlow>
      )}
    </div>
  );
};

export default PCBView;
