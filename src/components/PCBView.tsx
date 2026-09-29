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
} from 'lucide-react';
import { LocationConfig } from '../types';
import { useTheme } from '../context/ThemeContext';
import BorderGlow from './BorderGlow';

interface PCBViewProps {
  location: LocationConfig;
}

export interface PCBComponentMeta {
  id: string;
  name: string;
  designator: string;
  category: 'mcu' | 'rf' | 'sensor' | 'power' | 'connector' | 'passive' | 'indicator';
  package: string;
  description: string;
  specs: { [key: string]: string };
  nets: string[];
  pos: [number, number, number];
  size: [number, number, number];
}

const PCB_COMPONENTS: PCBComponentMeta[] = [
  {
    id: 'u9-mcu',
    name: 'Dual-Core Low-Power Microcontroller',
    designator: 'U9',
    category: 'mcu',
    package: 'QFN-56 (7x7mm)',
    description: 'High-performance 32-bit dual-core processor executing FreeRTOS, edge hydrograph crest forecasting algorithms, and sub-GHz mesh routing protocols.',
    specs: {
      'Clock Frequency': '133 MHz Dual-Core',
      'Operating Voltage': '3.3V DC (1.8V Core)',
      'SRAM': '264 KB On-Chip',
      'Flash Memory': '16 MB QSPI External',
      'Deep Sleep Power': '18 uA Hibernate Mode',
      'Hardware Interfaces': 'SPI, I2C x2, UART x2, 12-bit ADC',
    },
    nets: ['3V3_MCU', 'GND', 'LORA_SCK', 'LORA_MISO', 'LORA_MOSI', 'I2C0_SDA', 'I2C0_SCL', 'ADC_BATT'],
    pos: [-1.4, 0.12, -0.6],
    size: [1.2, 0.14, 1.2],
  },
  {
    id: 'u5-lora',
    name: 'Sub-GHz IN865 LoRa Transceiver Module',
    designator: 'U5',
    category: 'rf',
    package: 'LCC-16 Shielded (16x16mm)',
    description: 'Semtech SX1262-based long-range RF module tuned for India IN865-867 MHz WPC de-licensed band. Provides up to 15km line-of-sight and 1.5km dense foliage penetration.',
    specs: {
      'RF Band': '865 – 867 MHz (IN865)',
      'TX Power': '+22 dBm max (Configured for +14 dBm)',
      'Sensitivity': '-148 dBm @ SF12 / 125 kHz',
      'Spreading Factor': 'SF7 to SF12 (Adaptive)',
      'Current Consumption': '4.6 mA RX, 118 mA @ +22 dBm TX',
      'RF Front-End': 'Integrated Balun + U.FL IPEX & Pad',
    },
    nets: ['LORA_NSS', 'LORA_BUSY', 'LORA_DIO1', 'LORA_RESET', 'RF_ANT', 'GND_SHIELD', '3V3_RF'],
    pos: [0.6, 0.16, -0.6],
    size: [1.5, 0.22, 1.5],
  },
  {
    id: 'u6-sensor',
    name: 'Precision Barometric & Hydrometric Multisensor',
    designator: 'U6',
    category: 'sensor',
    package: 'LGA-8 (2.5x2.5mm)',
    description: 'Calibrated environmental sensor providing atmospheric pressure, rapid barometric drop detection for cyclone prediction, and temperature/humidity compensation.',
    specs: {
      'Pressure Range': '300 – 1100 hPa (+-0.12 hPa)',
      'Relative Humidity': '0 – 100% (+-1.5% RH)',
      'Temperature Range': '-40 to +85 C (+-0.5 C)',
      'Pressure RMS Noise': '0.2 Pa (equiv. to 1.7 cm altitude)',
      'Interface': 'I2C Fast-Mode Plus (1 MHz)',
      'Supply Current': '3.4 uA @ 1 Hz sampling',
    },
    nets: ['3V3_SENS', 'I2C0_SDA', 'I2C0_SCL', 'GND'],
    pos: [1.9, 0.08, -0.6],
    size: [0.6, 0.08, 0.6],
  },
  {
    id: 'u7-shifter',
    name: 'Bi-directional I2C Level Translator & ESD Guard',
    designator: 'U7',
    category: 'passive',
    package: 'SOT-23-6',
    description: 'High-speed level shifting interface between 3.3V core MCU and external 5V/3.3V digital probe sensors with +-15kV IEC ESD discharge protection.',
    specs: {
      'Channel Count': '2-Bit Open-Drain',
      'Data Rate': 'Up to 24 Mbps Push-Pull / 2 Mbps OD',
      'ESD Rating': '+-15 kV Air Discharge',
      'Operating Voltage': '1.65V to 5.5V dual-rail',
    },
    nets: ['VCCA_3V3', 'VCCB_5V', 'SDA_A', 'SDA_B', 'SCL_A', 'SCL_B'],
    pos: [1.1, 0.07, -0.05],
    size: [0.4, 0.08, 0.25],
  },
  {
    id: 'u1-flash',
    name: '16MB Low-Power QSPI NOR Data Logger',
    designator: 'U1',
    category: 'mcu',
    package: 'SOIC-8 (150mil)',
    description: 'Non-volatile industrial storage for local circular-buffer telemetry logging during prolonged communication blackouts or mesh partitioning.',
    specs: {
      'Density': '128 Mbit (16 Megabytes)',
      'Endurance': '100,000 Program/Erase Cycles',
      'Retention': '20 Years @ 85 C',
      'Bus Interface': 'Dual/Quad SPI @ 104 MHz',
    },
    nets: ['QSPI_CLK', 'QSPI_CS', 'QSPI_IO0', 'QSPI_IO1', 'QSPI_IO2', 'QSPI_IO3', '3V3_MEM'],
    pos: [-3.0, 0.1, -0.6],
    size: [0.9, 0.12, 0.8],
  },
  {
    id: 'ldo1-regulator',
    name: 'Ultra-Low Quiescent 3.3V LDO Regulator',
    designator: 'LDO1',
    category: 'power',
    package: 'SOT-23-5',
    description: 'Automotive-grade low-dropout regulator providing clean 3.3V rail from solar capacitor / LiFePO4 battery with under 1.2uA no-load quiescent current.',
    specs: {
      'Output Voltage': '3.3V Fixed (+-1.0%)',
      'Max Output Current': '500 mA Peak',
      'Dropout Voltage': '130 mV @ 300 mA',
      'Quiescent Current': '1.1 uA Typical',
      'PSRR': '70 dB @ 1 kHz',
    },
    nets: ['VBAT_IN', 'VOUT_3V3', 'EN_REG', 'GND'],
    pos: [2.8, 0.08, 0.2],
    size: [0.4, 0.08, 0.3],
  },
  {
    id: 'd1-diode',
    name: 'Reverse Polarity Schottky Barrier Diode',
    designator: 'D1',
    category: 'power',
    package: 'SOD-123',
    description: 'High-surge protection Schottky diode safeguarding the power ingress circuit against accidental solar cell / battery reverse connection.',
    specs: {
      'Forward Voltage': '0.34V @ 1.0A',
      'Reverse Standoff': '40V DC',
      'Peak Surge Current': '5.5A (8.3ms pulse)',
    },
    nets: ['SOLAR_RAW', 'SOLAR_PROT'],
    pos: [1.8, 0.08, 0.05],
    size: [0.55, 0.1, 0.28],
  },
  {
    id: 'q1-crystal',
    name: 'Precision 32.000 MHz Crystal Oscillator',
    designator: 'Q1',
    category: 'passive',
    package: 'SMD-4 (3.2x2.5mm)',
    description: 'Hermetically sealed quartz resonator providing precision clock timing for SX1262 LoRa packet synchronization and frequency calibration.',
    specs: {
      'Frequency': '32.000000 MHz',
      'Frequency Tolerance': '+-10 ppm @ 25 C',
      'Temp Stability': '+-15 ppm (-40 to +85 C)',
      'Load Capacitance': '10 pF',
    },
    nets: ['OSC_IN', 'OSC_OUT', 'GND_CRYSTAL'],
    pos: [0.4, 0.07, 0.05],
    size: [0.55, 0.08, 0.4],
  },
  {
    id: 'sw1-reset',
    name: 'Hardware System Reset Tactile Switch',
    designator: 'SW1',
    category: 'connector',
    package: 'SMD-4 Tactile (4x3mm)',
    description: 'Hermetically sealed tactile micro-switch with hardware debouncing circuitry for field manual rebooting.',
    specs: {
      'Operating Force': '160 gf',
      'Electrical Life': '100,000 Operations',
      'Contact Rating': '50 mA @ 12V DC',
    },
    nets: ['MCU_RESET_N', 'GND'],
    pos: [-0.6, 0.1, 0.05],
    size: [0.55, 0.12, 0.4],
  },
  {
    id: 'sw2-boot',
    name: 'Firmware Flash / Boot Mode Switch',
    designator: 'SW2',
    category: 'connector',
    package: 'SMD-4 Tactile (4x3mm)',
    description: 'Secondary user interface switch to force bootloader flashing mode or toggle local mesh diagnostic ping mode in the field.',
    specs: {
      'Operating Force': '160 gf',
      'Function': 'Dual-State / Mode Select',
    },
    nets: ['MCU_BOOT_SEL', 'GND'],
    pos: [-3.4, 0.1, 0.0],
    size: [0.55, 0.12, 0.4],
  },
  {
    id: 'led-group',
    name: 'Telemetry & Status Indicator LED Triad',
    designator: 'LED1 / LED2 / LED3',
    category: 'indicator',
    package: 'SMD-0805 Triad',
    description: 'Visual diagnostic indicators showing Power Rail (Emerald), LoRa Packet Hop Transmission (Electric Cyan), and Early Warning Threat Level (Amber/Red).',
    specs: {
      'LED1 (Green)': '3.3V Power Rail Active',
      'LED2 (Cyan)': 'LoRa Mesh RX/TX Heartbeat',
      'LED3 (Amber/Red)': 'Critical Threat Threshold Tripped',
      'Drive Method': 'Direct PWM Constant-Current @ 2.5mA',
    },
    nets: ['LED_PWR', 'LED_RADIO', 'LED_ALERT', 'GND'],
    pos: [2.4, 0.07, 0.05],
    size: [0.8, 0.06, 0.3],
  },
  {
    id: 'usb-c1',
    name: 'USB Type-C 16-Pin Diagnostics & Ingress Receptacle',
    designator: 'USB-C1',
    category: 'connector',
    package: '16-Pin Mid-Mount Shielded',
    description: 'Industrial USB-C port for rapid high-speed firmware update, calibrated sensor baseline offset configuration, and internal battery charging.',
    specs: {
      'Standard': 'USB 2.0 High-Speed (480 Mbps)',
      'Durability': '10,000 Mating Cycles',
      'Shielding': 'Stainless steel outer shell with 4 grounding retention tabs',
      'ESD Protection': 'TVS Diode Array on D+/D- and CC lines',
    },
    nets: ['VBUS_5V', 'USB_DP', 'USB_DM', 'USB_CC1', 'USB_CC2', 'GND_SHIELD'],
    pos: [3.3, 0.16, -0.65],
    size: [0.95, 0.26, 0.85],
  },
  {
    id: 'buzzer1',
    name: 'Piezoelectric Early Warning Flood Siren',
    designator: 'BUZZER1',
    category: 'indicator',
    package: 'SMD Round (9x9mm)',
    description: 'High-output resonant acoustic transducer triggered automatically when water stage exceeds river danger mark to alert surrounding local residents.',
    specs: {
      'Sound Pressure Level': '85 dB(A) @ 10 cm / 2.7 kHz',
      'Resonant Frequency': '2,730 Hz +-500 Hz',
      'Operating Voltage': '2.5V to 4.5V Square Wave',
      'Current Draw': '28 mA during siren cycle',
    },
    nets: ['BUZZER_PWM+', 'BUZZER_DRIVE-'],
    pos: [3.2, 0.22, 1.0],
    size: [0.95, 0.38, 0.95],
  },
  {
    id: 'j1-header',
    name: '4-Pin Diagnostic SWD / Debug Connector',
    designator: 'J1',
    category: 'connector',
    package: '1x4 Pin Header (2.54mm pitch)',
    description: 'Through-hole gold-plated header for direct ARM Serial Wire Debug (SWD), hardware breakpoint tracing, and auxiliary serial telemetry output.',
    specs: {
      'Pitch': '2.54 mm (0.1 in)',
      'Pinout': '3V3 | SWDIO | SWCLK | GND',
      'Gold Plating': '15 uin ENIG',
    },
    nets: ['3V3', 'SWDIO', 'SWCLK', 'GND'],
    pos: [-3.3, 0.2, 0.65],
    size: [0.35, 0.35, 1.1],
  },
  {
    id: 'j2-sensors',
    name: '6-Pin Multi-Sensor Environmental Terminal',
    designator: 'J2',
    category: 'connector',
    package: '1x6 Pin Terminal (2.54mm pitch)',
    description: 'Primary sensor connector accepting Hydrostatic Pressure Depth Transmitter (4-20mA), Ultrasonic Water Level Probe, Tipping Bucket Rain Sensor, and Soil Moisture.',
    specs: {
      'Pitch': '2.54 mm Pitch Gold Contacts',
      'Pin 1': '5V Boosted Sensor Rail',
      'Pin 2': 'Analog 4-20mA Depth Ingress',
      'Pin 3': 'Pulse Interrupt (Rain Gauge)',
      'Pin 4': 'I2C SDA (Digital Probes)',
      'Pin 5': 'I2C SCL',
      'Pin 6': 'Analog Soil Sensor / Return',
    },
    nets: ['SENS_5V', 'ADC_WATER_STAGE', 'PULSE_RAIN', 'I2C_SDA_EXT', 'I2C_SCL_EXT', 'GND'],
    pos: [-1.4, 0.2, 1.15],
    size: [1.8, 0.35, 0.55],
  },
  {
    id: 'j3-power',
    name: 'High-Current Battery & Solar Cell Ingress Terminal',
    designator: 'J3',
    category: 'power',
    package: '2-Pin Polarized Screw Terminal (5.08mm)',
    description: 'Heavy copper screw-down terminals with clearly printed silkscreen polarity (+ / -) for 3.2V LiFePO4 battery buffer pack and 6V 5W monocrystalline solar panel.',
    specs: {
      'Terminal Rating': '10 A / 250 V AC/DC',
      'Wire Gauge': '14 – 26 AWG solid/stranded',
      'Clamping': 'Zinc-plated copper cage clamp',
    },
    nets: ['BATT_PLUS', 'BATT_MINUS'],
    pos: [3.2, 0.22, 0.4],
    size: [0.95, 0.38, 0.6],
  },
];

export const PCBView: React.FC<PCBViewProps> = ({ location }) => {
  const { isDarkMode } = useTheme();
  const mountRef = useRef<HTMLDivElement>(null);

  // States
  const [selectedComp, setSelectedComp] = useState<PCBComponentMeta>(PCB_COMPONENTS[0]);
  const [hoveredComp, setHoveredComp] = useState<PCBComponentMeta | null>(null);
  const [activeLayer, setActiveLayer] = useState<'all' | 'components' | 'traces' | 'silkscreen'>('all');
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [boardColor, setBoardColor] = useState<'green' | 'dark' | 'blue' | 'black'>('green');
  const [showWireframe, setShowWireframe] = useState<boolean>(false);
  const [customGlbLoaded, setCustomGlbLoaded] = useState<boolean>(false);
  const [customGlbName, setCustomGlbName] = useState<string>('');
  const [viewPreset, setViewPreset] = useState<'iso' | 'top' | 'mcu' | 'rf' | 'ports'>('iso');
  const [activeTabMode, setActiveTabMode] = useState<'3d' | 'schematic' | 'specs'>('3d');

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const componentsGroupRef = useRef<THREE.Group | null>(null);
  const boardMeshRef = useRef<THREE.Mesh | null>(null);
  const tracesGroupRef = useRef<THREE.Group | null>(null);
  const silkscreenGroupRef = useRef<THREE.Group | null>(null);
  const ledMeshRef = useRef<THREE.Mesh | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Board colors palette
  const boardColors = useMemo(() => ({
    green: { base: 0x0e3b26, specular: 0x1f5f3e, edge: 0x071e13 },
    dark: { base: 0x11161d, specular: 0x223040, edge: 0x0a0d12 },
    blue: { base: 0x092b47, specular: 0x155184, edge: 0x051624 },
    black: { base: 0x0a0a0a, specular: 0x202020, edge: 0x050505 },
  }), []);

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
    camera.position.set(0, 7.5, 7.2);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.15; // Allow slight underside view
    controls.minDistance = 2.5;
    controls.maxDistance = 16.0;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 5. Lighting Setup for Realistic PCB Materials
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff8ee, 2.2);
    mainLight.position.set(5, 12, 6);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.bias = -0.0005;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x88ccff, 1.1);
    fillLight.position.set(-6, 8, -5);
    scene.add(fillLight);

    const topRimLight = new THREE.PointLight(0x00e5ff, 1.5, 15);
    topRimLight.position.set(0, 4, 0);
    scene.add(topRimLight);

    // 6. Build Procedural Realistic PCB Geometry
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    // 6.1 Substrate FR-4 Board
    const boardWidth = 8.4;
    const boardHeight = 0.16;
    const boardDepth = 4.8;
    const cornerRadius = 0.3;

    const boardShape = new THREE.Shape();
    const x = -boardWidth / 2;
    const z = -boardDepth / 2;
    boardShape.moveTo(x + cornerRadius, z);
    boardShape.lineTo(x + boardWidth - cornerRadius, z);
    boardShape.quadraticCurveTo(x + boardWidth, z, x + boardWidth, z + cornerRadius);
    boardShape.lineTo(x + boardWidth, z + boardDepth - cornerRadius);
    boardShape.quadraticCurveTo(x + boardWidth, z + boardDepth, x + boardWidth - cornerRadius, z + boardDepth);
    boardShape.lineTo(x + cornerRadius, z + boardDepth);
    boardShape.quadraticCurveTo(x, z + boardDepth, x, z + boardDepth - cornerRadius);
    boardShape.lineTo(x, z + cornerRadius);
    boardShape.quadraticCurveTo(x, z, x + cornerRadius, z);

    // 4 Corner mounting holes
    const holeRadius = 0.16;
    const holeOffsets = [
      [-boardWidth / 2 + 0.45, -boardDepth / 2 + 0.45],
      [boardWidth / 2 - 0.45, -boardDepth / 2 + 0.45],
      [boardWidth / 2 - 0.45, boardDepth / 2 - 0.45],
      [-boardWidth / 2 + 0.45, boardDepth / 2 - 0.45],
    ];
    holeOffsets.forEach(([hx, hz]) => {
      const holePath = new THREE.Path();
      holePath.absarc(hx, hz, holeRadius, 0, Math.PI * 2, true);
      boardShape.holes.push(holePath);
    });

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: boardHeight,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    };

    const boardGeom = new THREE.ExtrudeGeometry(boardShape, extrudeSettings);
    boardGeom.rotateX(Math.PI / 2); // Lay flat on X-Z plane

    const currentPalette = boardColors[boardColor];
    const boardMat = new THREE.MeshStandardMaterial({
      color: currentPalette.base,
      roughness: 0.45,
      metalness: 0.12,
    });
    const boardMesh = new THREE.Mesh(boardGeom, boardMat);
    boardMesh.receiveShadow = true;
    boardMesh.castShadow = true;
    boardGroup.add(boardMesh);
    boardMeshRef.current = boardMesh;

    // Corner Gold Annular Rings for mounting holes
    holeOffsets.forEach(([hx, hz]) => {
      const ringGeom = new THREE.RingGeometry(holeRadius, holeRadius + 0.12, 32);
      ringGeom.rotateX(-Math.PI / 2);
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.95,
        roughness: 0.25,
      });
      const ringMesh = new THREE.Mesh(ringGeom, goldMat);
      ringMesh.position.set(hx, 0.082, hz);
      boardGroup.add(ringMesh);
    });

    // 6.2 Copper Traces & Solder Pads Group
    const tracesGroup = new THREE.Group();
    boardGroup.add(tracesGroup);
    tracesGroupRef.current = tracesGroup;

    // Realistic Copper Routing Tracks
    const traceMaterial = new THREE.MeshStandardMaterial({
      color: 0x1b7348,
      roughness: 0.35,
      metalness: 0.3,
    });
    const goldPadMaterial = new THREE.MeshStandardMaterial({
      color: 0xe6b843,
      metalness: 0.96,
      roughness: 0.22,
    });
    const silverSolderMaterial = new THREE.MeshStandardMaterial({
      color: 0xc8d2dc,
      metalness: 0.88,
      roughness: 0.3,
    });

    // Generate routed track paths between components
    const trackPaths = [
      // MCU (U9) to LoRa (U5) bus
      [[-0.8, -0.6], [-0.3, -0.6], [0.0, -0.6]],
      [[-0.8, -0.75], [-0.2, -0.75], [-0.1, -0.9], [0.3, -0.9], [0.3, -0.8]],
      [[-0.8, -0.45], [-0.3, -0.45], [-0.1, -0.3], [0.3, -0.3]],
      // MCU to Sensors (U6, U7)
      [[-0.8, -0.3], [0.5, -0.3], [1.1, -0.05]],
      [[1.1, 0.05], [1.8, 0.05], [1.9, -0.4]],
      // Power rails
      [[3.2, 0.4], [2.8, 0.2], [1.8, 0.05], [-0.8, 0.0]],
      [[-1.4, 0.2], [-1.4, 0.8]],
      // USB-C data tracks
      [[3.3, -0.6], [2.2, -0.6], [1.5, -0.4], [-0.8, -0.2]],
      // Buzzer drive track
      [[-0.8, 0.3], [0.2, 0.3], [1.6, 0.5], [3.2, 0.9]],
      // Crystal oscillator tracks
      [[-0.8, -0.1], [0.2, -0.1], [0.4, 0.0]],
    ];

    trackPaths.forEach((pts) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const dx = p2[0] - p1[0];
        const dz = p2[1] - p1[1];
        const len = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dz, dx);

        const trackGeom = new THREE.PlaneGeometry(len, 0.045);
        trackGeom.rotateX(-Math.PI / 2);
        trackGeom.rotateY(-angle);
        const trackMesh = new THREE.Mesh(trackGeom, traceMaterial);
        trackMesh.position.set((p1[0] + p2[0]) / 2, 0.081, (p1[1] + p2[1]) / 2);
        tracesGroup.add(trackMesh);
      }
    });

    // Gold ENIG SMD footprint pads across the board
    PCB_COMPONENTS.forEach((comp) => {
      // Base footprint outline
      const padWidth = comp.size[0] + 0.12;
      const padDepth = comp.size[2] + 0.12;
      const padGeom = new THREE.PlaneGeometry(padWidth, padDepth);
      padGeom.rotateX(-Math.PI / 2);
      const padMesh = new THREE.Mesh(padGeom, goldPadMaterial);
      padMesh.position.set(comp.pos[0], 0.0815, comp.pos[2]);
      tracesGroup.add(padMesh);

      // Solder fillet pins for QFN/SOIC/LCC
      if (comp.category === 'mcu' || comp.category === 'rf') {
        const pinCount = comp.category === 'mcu' ? 12 : 6;
        for (let p = 0; p < pinCount; p++) {
          const t = (p / (pinCount - 1) - 0.5) * comp.size[0];
          [-comp.size[2] / 2 - 0.08, comp.size[2] / 2 + 0.08].forEach((pz) => {
            const pinGeom = new THREE.BoxGeometry(0.06, 0.03, 0.14);
            const pinMesh = new THREE.Mesh(pinGeom, goldPadMaterial);
            pinMesh.position.set(comp.pos[0] + t, 0.085, comp.pos[2] + pz);
            tracesGroup.add(pinMesh);
          });
        }
      }
    });

    // 6.3 3D Populated Components Group
    const componentsGroup = new THREE.Group();
    boardGroup.add(componentsGroup);
    componentsGroupRef.current = componentsGroup;

    // Component materials
    const icMoldedBodyMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.75,
      metalness: 0.1,
    });
    const shieldCanMat = new THREE.MeshStandardMaterial({
      color: 0xbfdbfe,
      roughness: 0.18,
      metalness: 0.94,
    });
    const ceramicCapMat = new THREE.MeshStandardMaterial({
      color: 0xa87d55, // Tan capacitor dielectric
      roughness: 0.5,
      metalness: 0.05,
    });
    const resistorMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.6,
      metalness: 0.15,
    });
    const connectorPlasticMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.8,
      metalness: 0.05,
    });
    const metalBracketMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      roughness: 0.25,
      metalness: 0.85,
    });

    PCB_COMPONENTS.forEach((comp) => {
      const compPivot = new THREE.Group();
      compPivot.position.set(comp.pos[0], 0.08 + comp.size[1] / 2, comp.pos[2]);
      compPivot.name = comp.id;

      if (comp.id === 'u9-mcu') {
        // MCU: Molded IC package with bevel + laser marking center
        const mcuGeom = new THREE.BoxGeometry(comp.size[0], comp.size[1], comp.size[2]);
        const mcuMesh = new THREE.Mesh(mcuGeom, icMoldedBodyMat);
        mcuMesh.castShadow = true;
        compPivot.add(mcuMesh);

        // Pin 1 Index Dot
        const dotGeom = new THREE.CircleGeometry(0.06, 16);
        dotGeom.rotateX(-Math.PI / 2);
        const dotMat = new THREE.MeshBasicMaterial({ color: 0x71717a });
        const dotMesh = new THREE.Mesh(dotGeom, dotMat);
        dotMesh.position.set(-comp.size[0] / 2 + 0.14, comp.size[1] / 2 + 0.005, -comp.size[2] / 2 + 0.14);
        compPivot.add(dotMesh);

        // Central thermal copper vias array
        for (let vx = -0.2; vx <= 0.2; vx += 0.2) {
          for (let vz = -0.2; vz <= 0.2; vz += 0.2) {
            const viaGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.01, 12);
            const viaMesh = new THREE.Mesh(viaGeom, goldPadMaterial);
            viaMesh.position.set(vx, comp.size[1] / 2 + 0.002, vz);
            compPivot.add(viaMesh);
          }
        }
      } else if (comp.id === 'u5-lora') {
        // LoRa Module: Nickel metal RF shield can
        const canGeom = new THREE.BoxGeometry(comp.size[0], comp.size[1], comp.size[2]);
        const canMesh = new THREE.Mesh(canGeom, shieldCanMat);
        canMesh.castShadow = true;
        compPivot.add(canMesh);

        // Engraved Logo Plate
        const plateGeom = new THREE.PlaneGeometry(comp.size[0] * 0.75, comp.size[2] * 0.75);
        plateGeom.rotateX(-Math.PI / 2);
        const plateMat = new THREE.MeshStandardMaterial({
          color: 0x93c5fd,
          metalness: 0.9,
          roughness: 0.35,
        });
        const plateMesh = new THREE.Mesh(plateGeom, plateMat);
        plateMesh.position.set(0, comp.size[1] / 2 + 0.004, 0);
        compPivot.add(plateMesh);
      } else if (comp.id === 'buzzer1') {
        // Piezo Siren: Round acoustic cylinder with sound cavity
        const buzzerGeom = new THREE.CylinderGeometry(comp.size[0] / 2, comp.size[0] / 2, comp.size[1], 32);
        const buzzerMesh = new THREE.Mesh(buzzerGeom, icMoldedBodyMat);
        buzzerMesh.castShadow = true;
        compPivot.add(buzzerMesh);

        // Sound hole in center
        const holeGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.02, 16);
        const holeMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
        const holeMesh = new THREE.Mesh(holeGeom, holeMat);
        holeMesh.position.set(0, comp.size[1] / 2 + 0.005, 0);
        compPivot.add(holeMesh);
      } else if (comp.id === 'usb-c1') {
        // USB-C connector: Metal jacket with hollow tongue
        const usbGeom = new THREE.BoxGeometry(comp.size[0], comp.size[1], comp.size[2]);
        const usbMesh = new THREE.Mesh(usbGeom, metalBracketMat);
        usbMesh.castShadow = true;
        compPivot.add(usbMesh);

        // Receptacle tongue entry
        const entryGeom = new THREE.BoxGeometry(comp.size[0] * 0.85, comp.size[1] * 0.5, 0.1);
        const entryMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const entryMesh = new THREE.Mesh(entryGeom, entryMat);
        entryMesh.position.set(0, 0, comp.size[2] / 2 + 0.01);
        compPivot.add(entryMesh);
      } else if (comp.category === 'connector') {
        // Header blocks: Base plastic insulator + protruding gold pins
        const headerBaseGeom = new THREE.BoxGeometry(comp.size[0], comp.size[1] * 0.6, comp.size[2]);
        const headerBaseMesh = new THREE.Mesh(headerBaseGeom, connectorPlasticMat);
        headerBaseMesh.castShadow = true;
        compPivot.add(headerBaseMesh);

        // Individual gold pins
        const pinCount = comp.id === 'j1-header' ? 4 : comp.id === 'j2-sensors' ? 6 : 2;
        for (let i = 0; i < pinCount; i++) {
          const t = (i / (pinCount - 1) - 0.5) * (comp.size[0] - 0.3);
          const pinGeom = new THREE.BoxGeometry(0.06, comp.size[1] * 1.5, 0.06);
          const pinMesh = new THREE.Mesh(pinGeom, goldPadMaterial);
          pinMesh.position.set(t, comp.size[1] * 0.4, 0);
          pinMesh.castShadow = true;
          compPivot.add(pinMesh);
        }
      } else if (comp.id === 'led-group') {
        // Indicator LEDs (3x colored chips)
        const ledColors = [0x10b981, 0x00e5ff, 0xf59e0b];
        ledColors.forEach((colorHex, idx) => {
          const ledGeom = new THREE.BoxGeometry(0.18, 0.08, 0.12);
          const ledMat = new THREE.MeshStandardMaterial({
            color: colorHex,
            emissive: colorHex,
            emissiveIntensity: 0.9,
            roughness: 0.2,
          });
          const ledMesh = new THREE.Mesh(ledGeom, ledMat);
          ledMesh.position.set((idx - 1) * 0.26, 0, 0);
          compPivot.add(ledMesh);
          if (idx === 1) ledMeshRef.current = ledMesh;
        });
      } else {
        // Default SMD package: IC / Diode / Resistor / Crystal
        const geom = new THREE.BoxGeometry(comp.size[0], comp.size[1], comp.size[2]);
        const mat = comp.category === 'passive' ? ceramicCapMat : icMoldedBodyMat;
        const mesh = new THREE.Mesh(geom, mat);
        mesh.castShadow = true;
        compPivot.add(mesh);

        // Silver solder termination caps on sides
        [-comp.size[0] / 2, comp.size[0] / 2].forEach((cx) => {
          const capGeom = new THREE.BoxGeometry(0.08, comp.size[1] * 1.02, comp.size[2] * 1.02);
          const capMesh = new THREE.Mesh(capGeom, silverSolderMaterial);
          capMesh.position.set(cx, 0, 0);
          compPivot.add(capMesh);
        });
      }

      componentsGroup.add(compPivot);
    });

    // Populate remaining distributed 0805 & 0603 SMD Passives (R1-R15, C1-C20)
    const passivePoints: [number, number, 'res' | 'cap'][] = [
      [-1.8, -0.15, 'cap'], [-1.4, -0.15, 'res'], [-1.0, -0.15, 'cap'],
      [-2.4, -0.05, 'res'], [-2.0, 0.2, 'cap'], [-1.6, 0.45, 'res'],
      [0.0, -0.35, 'cap'], [0.2, -0.35, 'res'], [0.4, -0.35, 'cap'],
      [0.8, -0.15, 'cap'], [1.4, 0.35, 'res'], [1.6, 0.35, 'cap'],
      [2.0, 0.35, 'cap'], [2.3, 0.35, 'res'], [2.6, 0.35, 'cap'],
      [0.1, 0.45, 'cap'], [0.6, 0.45, 'res'], [1.1, 0.45, 'cap'],
      [1.7, 0.7, 'cap'], [2.1, 0.7, 'res'], [2.5, 0.7, 'cap'],
      [-0.2, 0.7, 'res'], [0.4, 0.85, 'cap'], [1.0, 0.85, 'res'],
    ];

    passivePoints.forEach(([px, pz, type]) => {
      const pGeom = new THREE.BoxGeometry(0.2, 0.08, 0.12);
      const pMat = type === 'cap' ? ceramicCapMat : resistorMat;
      const pMesh = new THREE.Mesh(pGeom, pMat);
      pMesh.position.set(px, 0.08 + 0.04, pz);
      componentsGroup.add(pMesh);

      // Silver terminal caps
      [-0.1, 0.1].forEach((cx) => {
        const cGeom = new THREE.BoxGeometry(0.04, 0.085, 0.125);
        const cMesh = new THREE.Mesh(cGeom, silverSolderMaterial);
        cMesh.position.set(px + cx, 0.08 + 0.04, pz);
        componentsGroup.add(cMesh);
      });
    });

    // 6.4 Silkscreen Layer Text & Markings
    const silkscreenGroup = new THREE.Group();
    boardGroup.add(silkscreenGroup);
    silkscreenGroupRef.current = silkscreenGroup;

    // Canvas texture for crisp white silkscreen annotations & component tags
    const silkCanvas = document.createElement('canvas');
    silkCanvas.width = 2048;
    silkCanvas.height = 1152;
    const ctx = silkCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, silkCanvas.width, silkCanvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;

      // Outer safety boundary margin
      ctx.strokeRect(30, 30, silkCanvas.width - 60, silkCanvas.height - 60);

      // Board branding
      ctx.font = 'bold 36px monospace';
      ctx.fillText('ENVORA SENSOR NODE MESH v2.4 [IN865]', 60, 90);
      ctx.font = 'bold 26px monospace';
      ctx.fillText('DESIGNED FOR MONSOON & FLOOD RESILIENCE', 60, 130);
      ctx.fillText('TOP LAYER - ENIG GOLD PLATED', silkCanvas.width - 520, 90);

      // Component reference markings
      const drawSilkBox = (cx: number, cy: number, w: number, h: number, text: string) => {
        ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(text, cx - w / 2 + 10, cy - h / 2 - 12);
      };

      // Convert 3D world coord to 2D canvas coord
      const worldToCanvas = (wx: number, wz: number): [number, number] => {
        const u = (wx + boardWidth / 2) / boardWidth;
        const v = (wz + boardDepth / 2) / boardDepth;
        return [u * silkCanvas.width, v * silkCanvas.height];
      };

      PCB_COMPONENTS.forEach((c) => {
        const [cx, cy] = worldToCanvas(c.pos[0], c.pos[2]);
        const cw = (c.size[0] / boardWidth) * silkCanvas.width + 24;
        const ch = (c.size[2] / boardDepth) * silkCanvas.height + 24;
        drawSilkBox(cx, cy, cw, ch, c.designator);
      });

      // Polarity signs for buzzer & battery terminal
      const [buzzerX, buzzerY] = worldToCanvas(3.2, 1.0);
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('+', buzzerX - 80, buzzerY + 12);
      ctx.fillText('-', buzzerX + 60, buzzerY + 12);

      const [batX, batY] = worldToCanvas(3.2, 0.4);
      ctx.fillText('+  LiFePO4  -', batX - 80, batY + 60);

      // Antenna text
      const [antX, antY] = worldToCanvas(0.6, -0.6);
      ctx.fillText('ANT 865MHz', antX - 90, antY - 140);
    }

    const silkTexture = new THREE.CanvasTexture(silkCanvas);
    silkTexture.anisotropy = 8;
    const silkMat = new THREE.MeshBasicMaterial({
      map: silkTexture,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    const silkGeom = new THREE.PlaneGeometry(boardWidth, boardDepth);
    silkGeom.rotateX(-Math.PI / 2);
    const silkMesh = new THREE.Mesh(silkGeom, silkMat);
    silkMesh.position.set(0, 0.0825, 0);
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
          const match = PCB_COMPONENTS.find((c) => c.id === rootObj?.name);
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
          const match = PCB_COMPONENTS.find((c) => c.id === rootObj?.name);
          if (match) {
            setSelectedComp(match);
          }
        }
      }
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('click', onClick);

    // 8. Animation Loop
    let clock = 0;
    const animate = () => {
      clock += 0.016;

      // Pulse LoRa LED
      if (ledMeshRef.current) {
        const pulse = 0.5 + 0.5 * Math.sin(clock * 5);
        (ledMeshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + pulse * 1.2;
      }

      // Auto rotation
      if (controlsRef.current && controlsRef.current.autoRotate) {
        controlsRef.current.update();
      } else if (controlsRef.current) {
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    // 9. Resize Listener
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

  // Update Board Color dynamically
  useEffect(() => {
    if (boardMeshRef.current) {
      const palette = boardColors[boardColor];
      const mat = boardMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.color.setHex(palette.base);
      mat.wireframe = showWireframe;
      mat.needsUpdate = true;
    }
  }, [boardColor, showWireframe, boardColors]);

  // Update Auto-Rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 2.0;
    }
  }, [autoRotate]);

  // Update Layer Visibility
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

  // Camera Presets
  const applyViewPreset = (preset: 'iso' | 'top' | 'mcu' | 'rf' | 'ports') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    setViewPreset(preset);

    if (preset === 'top') {
      camera.position.set(0, 9.5, 0.01);
      controls.target.set(0, 0, 0);
    } else if (preset === 'iso') {
      camera.position.set(4.5, 6.2, 5.8);
      controls.target.set(0, 0, 0);
    } else if (preset === 'mcu') {
      camera.position.set(-1.4, 3.2, 1.2);
      controls.target.set(-1.4, 0.1, -0.6);
      const comp = PCB_COMPONENTS.find((c) => c.id === 'u9-mcu');
      if (comp) setSelectedComp(comp);
    } else if (preset === 'rf') {
      camera.position.set(0.6, 3.2, 1.2);
      controls.target.set(0.6, 0.1, -0.6);
      const comp = PCB_COMPONENTS.find((c) => c.id === 'u5-lora');
      if (comp) setSelectedComp(comp);
    } else if (preset === 'ports') {
      camera.position.set(0, 3.6, 4.0);
      controls.target.set(0, 0.1, 0.8);
      const comp = PCB_COMPONENTS.find((c) => c.id === 'j2-sensors');
      if (comp) setSelectedComp(comp);
    }
  };

  // Handle direct custom GLB upload from user's machine
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
          // Hide procedural components to show user's exact GLB
          if (componentsGroupRef.current) componentsGroupRef.current.visible = false;
          if (tracesGroupRef.current) tracesGroupRef.current.visible = false;
          if (silkscreenGroupRef.current) silkscreenGroupRef.current.visible = false;
          if (boardMeshRef.current) boardMeshRef.current.visible = false;

          gltf.scene.scale.set(40, 40, 40); // Standard scale adaptation for PCB models
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

  return (
    <div className="space-y-6 pb-16">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BANNER (BorderGlow)                                         */}
      {/* ========================================================================= */}
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
          className={`rounded-2xl border p-6 transition-all ${
            isDarkMode
              ? 'bg-slate-900/80 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900 shadow-xs'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2.5 rounded-xl border ${
                    isDarkMode
                      ? 'bg-cyan-950/70 border-cyan-800 text-cyan-400'
                      : 'bg-teal-50 border-teal-200 text-teal-800'
                  }`}
                >
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                    <span>ENVORA Field Node Hardware & 3D PCB Architecture</span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                      Rev 2.4 Production
                    </span>
                  </h1>
                  <p className="text-xs opacity-75 mt-0.5 max-w-3xl">
                    Solar-harvesting environmental telemetry motherboard deployed across {location.name}. Features hardware edge AI, dual-core MCU, Semtech IN865 LoRa mesh radio, and multi-sensor hydrostatic depth probe interfaces.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick action buttons & View mode tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={`p-1 rounded-xl border flex items-center gap-1 ${
                  isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <button
                  onClick={() => setActiveTabMode('3d')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTabMode === '3d'
                      ? isDarkMode
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'bg-teal-700 text-white shadow-xs'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Interactive 3D PCB</span>
                </button>

                <button
                  onClick={() => setActiveTabMode('schematic')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTabMode === 'schematic'
                      ? isDarkMode
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'bg-teal-700 text-white shadow-xs'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Engineering Layout & Photos</span>
                </button>

                <button
                  onClick={() => setActiveTabMode('specs')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTabMode === 'specs'
                      ? isDarkMode
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'bg-teal-700 text-white shadow-xs'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Hardware BOM & Netlist</span>
                </button>
              </div>

              {/* Upload custom GLB button */}
              <label
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  isDarkMode
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-xs'
                }`}
                title="Drop your own exported .glb from KiCad / Altium"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>{customGlbLoaded ? `Loaded: ${customGlbName}` : 'Load Custom .GLB'}</span>
                <input
                  type="file"
                  accept=".glb,.gltf"
                  onChange={handleGlbFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </BorderGlow>

      {/* ========================================================================= */}
      {/* 2. MAIN INTERACTIVE 3D PCB CANVAS VIEW                                    */}
      {/* ========================================================================= */}
      {activeTabMode === '3d' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main 3D Viewport Column (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
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
                className={`relative rounded-2xl border overflow-hidden transition-all ${
                  isDarkMode
                    ? 'bg-slate-950/90 border-slate-800 text-white shadow-2xl'
                    : 'bg-slate-900 border-slate-200 text-white shadow-xl'
                }`}
              >
                {/* 3D Canvas Mount Point */}
                <div
                  ref={mountRef}
                  className="w-full h-[520px] sm:h-[620px] cursor-grab active:cursor-grabbing select-none"
                />

                {/* Interactive HUD Overlay Toolbar on top of 3D Canvas */}
                <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                  {/* Preset Camera Viewpoints */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 pointer-events-auto shadow-lg">
                    <span className="text-[10px] font-mono uppercase tracking-wider opacity-60 px-2 flex items-center gap-1">
                      <Camera className="w-3 h-3 text-cyan-400" />
                      <span>Camera:</span>
                    </span>
                    <button
                      onClick={() => applyViewPreset('iso')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        viewPreset === 'iso' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      3D Iso
                    </button>
                    <button
                      onClick={() => applyViewPreset('top')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        viewPreset === 'top' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Top-Down
                    </button>
                    <button
                      onClick={() => applyViewPreset('mcu')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        viewPreset === 'mcu' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      MCU Core (U9)
                    </button>
                    <button
                      onClick={() => applyViewPreset('rf')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        viewPreset === 'rf' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      LoRa RF (U5)
                    </button>
                    <button
                      onClick={() => applyViewPreset('ports')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        viewPreset === 'ports' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Sensors & I/O
                    </button>
                  </div>

                  {/* Solder Mask Color Selection & Auto-Rotate */}
                  <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 pointer-events-auto shadow-lg">
                    <span className="text-[10px] font-mono uppercase tracking-wider opacity-60 px-1">Mask:</span>
                    <button
                      onClick={() => setBoardColor('green')}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${
                        boardColor === 'green' ? 'scale-110 border-white' : 'border-transparent opacity-70'
                      }`}
                      style={{ backgroundColor: '#0e3b26' }}
                      title="Emerald Green Mask (Default)"
                    />
                    <button
                      onClick={() => setBoardColor('dark')}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${
                        boardColor === 'dark' ? 'scale-110 border-white' : 'border-transparent opacity-70'
                      }`}
                      style={{ backgroundColor: '#11161d' }}
                      title="Matte Dark Navy Mask"
                    />
                    <button
                      onClick={() => setBoardColor('blue')}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${
                        boardColor === 'blue' ? 'scale-110 border-white' : 'border-transparent opacity-70'
                      }`}
                      style={{ backgroundColor: '#092b47' }}
                      title="Royal Blue Mask"
                    />
                    <button
                      onClick={() => setBoardColor('black')}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${
                        boardColor === 'black' ? 'scale-110 border-white' : 'border-transparent opacity-70'
                      }`}
                      style={{ backgroundColor: '#09090b' }}
                      title="Matte Stealth Black"
                    />

                    <div className="h-4 w-[1px] bg-slate-800 mx-1" />

                    <button
                      onClick={() => setAutoRotate(!autoRotate)}
                      className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                        autoRotate ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Toggle Continuous Turntable Auto-Rotate"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Rotate</span>
                    </button>

                    <button
                      onClick={() => setShowWireframe(!showWireframe)}
                      className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                        showWireframe ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Toggle Wireframe Mesh"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bottom HUD: Layer Filter Bar & Hover Information */}
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
                  {/* Layer Filters */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 pointer-events-auto shadow-lg text-xs">
                    <span className="text-[10px] font-mono uppercase tracking-wider opacity-60 px-2 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-cyan-400" />
                      <span>Layers:</span>
                    </span>
                    {(['all', 'components', 'traces', 'silkscreen'] as const).map((layer) => (
                      <button
                        key={layer}
                        onClick={() => setActiveLayer(layer)}
                        className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-colors cursor-pointer ${
                          activeLayer === layer
                            ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {layer}
                      </button>
                    ))}
                  </div>

                  {/* Hover component pill */}
                  {hoveredComp && (
                    <div className="p-2 px-3.5 rounded-xl bg-cyan-950/90 border border-cyan-500/60 text-cyan-200 backdrop-blur-md shadow-xl text-xs flex items-center gap-2 pointer-events-auto animate-pulse">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-mono font-bold">{hoveredComp.designator}:</span>
                      <span>{hoveredComp.name}</span>
                      <span className="opacity-60 font-mono text-[10px] border border-cyan-800 px-1 rounded">
                        Click to Inspect
                      </span>
                    </div>
                  )}

                  {!hoveredComp && (
                    <div className="hidden sm:flex items-center gap-2 p-2 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono opacity-70">
                      <span>Click any component to inspect pinout & netlist</span>
                    </div>
                  )}
                </div>
              </div>
            </BorderGlow>

            {/* Quick interactive board spec indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div
                className={`p-3.5 rounded-xl border text-xs ${
                  isDarkMode ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between opacity-60 mb-1">
                  <span>Substrate & Layers</span>
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-base font-bold font-mono">4-Layer FR-4 (1.6mm)</div>
                <div className="text-[10px] opacity-60 mt-0.5">Top / GND / PWR / Bottom</div>
              </div>

              <div
                className={`p-3.5 rounded-xl border text-xs ${
                  isDarkMode ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between opacity-60 mb-1">
                  <span>Surface Finish</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-base font-bold font-mono">ENIG Gold (RoHS)</div>
                <div className="text-[10px] opacity-60 mt-0.5">Electroless Nickel Immersion</div>
              </div>

              <div
                className={`p-3.5 rounded-xl border text-xs ${
                  isDarkMode ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between opacity-60 mb-1">
                  <span>RF Frequency</span>
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-base font-bold font-mono text-emerald-400">865 – 867 MHz</div>
                <div className="text-[10px] opacity-60 mt-0.5">India WPC De-licensed Band</div>
              </div>

              <div
                className={`p-3.5 rounded-xl border text-xs ${
                  isDarkMode ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between opacity-60 mb-1">
                  <span>Power Buffer</span>
                  <BatteryCharging className="w-3.5 h-3.5 text-teal-400" />
                </div>
                <div className="text-base font-bold font-mono">Solar + LiFePO4</div>
                <div className="text-[10px] opacity-60 mt-0.5">3.2V 3200mAh + 6V Solar</div>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Detailed Selected Component Inspector */}
          <div className="lg:col-span-4 space-y-4">
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
                className={`rounded-2xl border p-5 transition-all ${
                  isDarkMode
                    ? 'bg-slate-900/80 border-slate-800 text-white'
                    : 'bg-white border-slate-200 text-slate-900 shadow-xs'
                }`}
              >
                {/* Component Inspector Header */}
                <div className="flex items-start justify-between gap-3 border-b border-current/10 pb-4 mb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-cyan-500/40 text-cyan-400 bg-cyan-950/40">
                      Component Inspector
                    </span>
                    <h2 className="text-lg font-black mt-2 flex items-center gap-2">
                      <span className="text-cyan-400 font-mono">{selectedComp.designator}</span>
                      <span>—</span>
                      <span className="text-sm">{selectedComp.name}</span>
                    </h2>
                    <span className="text-[11px] font-mono opacity-60 mt-0.5 block">
                      Footprint: {selectedComp.package}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl border border-current/10 shrink-0">
                    {selectedComp.category === 'mcu' && <Cpu className="w-5 h-5 text-cyan-400" />}
                    {selectedComp.category === 'rf' && <Radio className="w-5 h-5 text-sky-400" />}
                    {selectedComp.category === 'sensor' && <Zap className="w-5 h-5 text-amber-400" />}
                    {selectedComp.category === 'power' && <BatteryCharging className="w-5 h-5 text-emerald-400" />}
                    {selectedComp.category === 'connector' && <Usb className="w-5 h-5 text-indigo-400" />}
                    {selectedComp.category === 'indicator' && <Volume2 className="w-5 h-5 text-red-400" />}
                    {selectedComp.category === 'passive' && <Microchip className="w-5 h-5 text-teal-400" />}
                  </div>
                </div>

                <p className="text-xs opacity-80 leading-relaxed mb-4">
                  {selectedComp.description}
                </p>

                {/* Technical Specifications Table */}
                <div className="space-y-3 mb-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Technical Ratings</span>
                  </h3>
                  <div
                    className={`rounded-xl border divide-y divide-current/10 overflow-hidden text-xs ${
                      isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {Object.entries(selectedComp.specs).map(([specKey, specVal]) => (
                      <div key={specKey} className="px-3.5 py-2 flex items-center justify-between gap-2">
                        <span className="opacity-70 font-medium">{specKey}:</span>
                        <span className="font-mono font-bold text-right">{specVal}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connected Netlist Signals */}
                <div className="space-y-2 mb-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Connected Signal Nets ({selectedComp.nets.length})</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedComp.nets.map((net) => (
                      <span
                        key={net}
                        className={`text-[10px] font-mono px-2 py-1 rounded-md border font-semibold ${
                          net.includes('3V3') || net.includes('5V') || net.includes('VBAT')
                            ? isDarkMode
                              ? 'bg-red-950/40 text-red-300 border-red-800'
                              : 'bg-red-50 text-red-800 border-red-200'
                            : net.includes('GND')
                            ? isDarkMode
                              ? 'bg-slate-800 text-slate-300 border-slate-700'
                              : 'bg-slate-200 text-slate-700 border-slate-300'
                            : isDarkMode
                            ? 'bg-cyan-950/50 text-cyan-300 border-cyan-800'
                            : 'bg-teal-50 text-teal-800 border-teal-200'
                        }`}
                      >
                        {net}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quick Component Selector list */}
                <div className="space-y-2 pt-2 border-t border-current/10">
                  <span className="text-[11px] font-semibold opacity-70 block mb-1">
                    Select Another Component:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {PCB_COMPONENTS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedComp(c)}
                        className={`px-2.5 py-1.5 rounded-lg text-left text-xs font-mono transition-all border cursor-pointer ${
                          selectedComp.id === c.id
                            ? isDarkMode
                              ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold'
                              : 'bg-teal-50 text-teal-900 border-teal-600 font-bold'
                            : isDarkMode
                            ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <span className="font-bold">{c.designator}</span>{' '}
                        <span className="opacity-70 text-[10px] block truncate">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </BorderGlow>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ENGINEERING LAYOUT & HIGH-RES PCB REFERENCE PHOTOS TAB                 */}
      {/* ========================================================================= */}
      {activeTabMode === 'schematic' && (
        <div className="space-y-6">
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
              className={`rounded-2xl border p-6 transition-all ${
                isDarkMode
                  ? 'bg-slate-900/80 border-slate-800 text-white'
                  : 'bg-white border-slate-200 text-slate-900 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-4 border-b border-current/10 pb-3">
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Reference PCB Engineering Design & Footprints</span>
                  </h2>
                  <p className="text-xs opacity-70 mt-0.5">
                    Original KiCad 10 / OpenCASCADE 3D render outputs demonstrating footprint alignment and surface mount assembly.
                  </p>
                </div>
              </div>

              {/* Two Column Grid displaying User's Uploaded Reference Views */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* View 1: Top-down Footprint & Silkscreen Layout */}
                <div
                  className={`rounded-xl border overflow-hidden ${
                    isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="px-4 py-2.5 border-b border-current/10 flex items-center justify-between text-xs font-mono">
                    <span className="font-bold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                      <span>Top Layer Solder Mask & Silkscreen (ENIG)</span>
                    </span>
                    <span className="opacity-60 text-[10px]">Top-Down Orthographic</span>
                  </div>
                  <div className="p-4 bg-slate-950 flex items-center justify-center min-h-[340px]">
                    <div className="relative group max-w-full">
                      {/* SVG Canvas Reconstruction of the User's uploaded Image 1 */}
                      <svg
                        viewBox="0 0 880 480"
                        className="w-full h-auto rounded-lg shadow-2xl border border-emerald-950/60"
                        style={{ background: '#0e3321' }}
                      >
                        {/* Board perimeter */}
                        <rect x="15" y="15" width="850" height="450" rx="12" fill="#0b281a" stroke="#165b3b" strokeWidth="3" />

                        {/* Copper Traces (green lines) */}
                        <path d="M 120 180 L 190 280 L 260 280 L 320 220" stroke="#1c6b45" strokeWidth="2.5" fill="none" />
                        <path d="M 280 180 L 390 180 L 460 210" stroke="#1c6b45" strokeWidth="2.5" fill="none" />
                        <path d="M 520 200 L 610 200 L 640 180" stroke="#1c6b45" strokeWidth="2.5" fill="none" />
                        <path d="M 520 250 L 590 320 L 740 320" stroke="#1c6b45" strokeWidth="2.5" fill="none" />
                        <path d="M 720 370 L 780 370" stroke="#1c6b45" strokeWidth="3.5" fill="none" />
                        <path d="M 780 90 L 830 90 L 830 180" stroke="#1c6b45" strokeWidth="2.5" fill="none" />

                        {/* U1 Flash */}
                        <rect x="70" y="80" width="100" height="120" rx="4" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 3" />
                        <text x="120" y="145" fill="#ffffff" fontSize="14" textAnchor="middle" fontWeight="bold">U1</text>
                        {/* Gold Pads for U1 */}
                        {[-45, -30, -15, 0, 15, 30, 45].map((off, i) => (
                          <g key={i}>
                            <rect x="60" y={140 + off} width="16" height="8" rx="2" fill="#e5b842" />
                            <rect x="164" y={140 + off} width="16" height="8" rx="2" fill="#e5b842" />
                          </g>
                        ))}

                        {/* U9 MCU */}
                        <rect x="250" y="70" width="130" height="130" rx="6" fill="none" stroke="#ffffff" strokeWidth="2" />
                        <text x="315" y="60" fill="#ffffff" fontSize="14" textAnchor="middle" fontWeight="bold">U9</text>
                        {/* Thermal Pad */}
                        <rect x="285" y="105" width="60" height="60" rx="2" fill="#e5b842" opacity="0.9" />
                        {/* Pins on 4 sides */}
                        {[-40, -20, 0, 20, 40].map((off, i) => (
                          <g key={i}>
                            <rect x={315 + off - 6} y="55" width="12" height="14" rx="2" fill="#e5b842" />
                            <rect x={315 + off - 6} y="201" width="12" height="14" rx="2" fill="#e5b842" />
                            <rect x="235" y={135 + off - 6} width="14" height="12" rx="2" fill="#e5b842" />
                            <rect x="381" y={135 + off - 6} width="14" height="12" rx="2" fill="#e5b842" />
                          </g>
                        ))}

                        {/* U5 LoRa Module */}
                        <rect x="450" y="75" width="120" height="120" rx="4" fill="none" stroke="#ffffff" strokeWidth="2" />
                        <text x="510" y="60" fill="#ffffff" fontSize="14" textAnchor="middle" fontWeight="bold">U5</text>
                        <text x="470" y="95" fill="#ffffff" fontSize="10" fontWeight="bold">ANT</text>
                        <rect x="470" y="100" width="80" height="80" fill="none" stroke="#e5b842" strokeWidth="2.5" />
                        {[-40, -15, 15, 40].map((off, i) => (
                          <g key={i}>
                            <rect x="435" y={135 + off - 7} width="14" height="14" rx="2" fill="#e5b842" />
                            <rect x="571" y={135 + off - 7} width="14" height="14" rx="2" fill="#e5b842" />
                          </g>
                        ))}

                        {/* U6 Sensor */}
                        <rect x="620" y="80" width="60" height="60" rx="4" fill="none" stroke="#ffffff" strokeWidth="2" />
                        <text x="650" y="65" fill="#ffffff" fontSize="12" textAnchor="middle" fontWeight="bold">U6</text>
                        <circle cx="635" cy="95" r="5" fill="#e5b842" />
                        <circle cx="650" cy="95" r="5" fill="#e5b842" />
                        <circle cx="665" cy="95" r="5" fill="#e5b842" />
                        <circle cx="635" cy="125" r="5" fill="#e5b842" />
                        <circle cx="650" cy="125" r="5" fill="#e5b842" />
                        <circle cx="665" cy="125" r="5" fill="#e5b842" />

                        {/* USB-C1 on top right */}
                        <rect x="780" y="55" width="65" height="75" rx="6" fill="none" stroke="#ffffff" strokeWidth="2" />
                        <text x="850" y="100" fill="#ffffff" fontSize="11" transform="rotate(90 850 100)" fontWeight="bold">USB-C1</text>
                        <rect x="790" y="115" width="45" height="10" rx="2" fill="#e5b842" />

                        {/* Q1 Crystal */}
                        <rect x="450" y="240" width="55" height="35" rx="3" fill="none" stroke="#ffffff" strokeWidth="1.5" />
                        <text x="477" y="235" fill="#ffffff" fontSize="11" textAnchor="middle" fontWeight="bold">Q1</text>
                        <rect x="445" y="247" width="10" height="20" rx="2" fill="#e5b842" />
                        <rect x="495" y="247" width="10" height="20" rx="2" fill="#e5b842" />

                        {/* D1 Diode */}
                        <rect x="635" y="230" width="45" height="25" rx="2" fill="none" stroke="#ffffff" strokeWidth="1.5" />
                        <text x="657" y="222" fill="#ffffff" fontSize="11" textAnchor="middle" fontWeight="bold">D1</text>
                        <rect x="630" y="234" width="8" height="17" fill="#e5b842" />
                        <rect x="672" y="234" width="8" height="17" fill="#e5b842" />
                        <line x1="640" y1="230" x2="640" y2="255" stroke="#ffffff" strokeWidth="2" />

                        {/* LDO1 */}
                        <text x="760" y="160" fill="#ffffff" fontSize="11" fontWeight="bold">LDO1</text>
                        <rect x="750" y="170" width="30" height="25" rx="2" fill="#18181b" stroke="#e5b842" />

                        {/* Tactile Buttons SW1 & SW2 */}
                        <rect x="35" y="250" width="45" height="35" rx="3" fill="none" stroke="#ffffff" strokeWidth="2" />
                        <text x="57" y="240" fill="#ffffff" fontSize="11" textAnchor="middle" fontWeight="bold">SW2</text>
                        <rect x="345" y="275" width="45" height="35" rx="3" fill="none" stroke="#ffffff" strokeWidth="2" />
                        <text x="367" y="265" fill="#ffffff" fontSize="11" textAnchor="middle" fontWeight="bold">SW1</text>

                        {/* J1 4-Pin Header (Left) */}
                        <rect x="50" y="315" width="30" height="100" rx="4" fill="none" stroke="#ffffff" strokeWidth="2" />
                        <circle cx="65" cy="335" r="7" fill="none" stroke="#e5b842" strokeWidth="3" />
                        <circle cx="65" cy="360" r="7" fill="none" stroke="#e5b842" strokeWidth="3" />
                        <circle cx="65" cy="385" r="7" fill="none" stroke="#e5b842" strokeWidth="3" />
                        <circle cx="65" cy="410" r="7" fill="none" stroke="#e5b842" strokeWidth="3" />
                        <text x="40" y="370" fill="#ffffff" fontSize="12" fontWeight="bold">J1</text>

                        {/* J2 6-Pin Sensor Terminal Header (Bottom) */}
                        <rect x="195" y="380" width="200" height="60" rx="6" fill="none" stroke="#ffffff" strokeWidth="2.5" />
                        <text x="295" y="460" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="bold">J2 (Environmental Probes)</text>
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <circle key={i} cx={225 + i * 28} cy={410} r="8" fill="#0b281a" stroke="#e5b842" strokeWidth="4" />
                        ))}

                        {/* J3 Power Terminals */}
                        <rect x="760" y="325" width="55" height="65" rx="4" fill="none" stroke="#ffffff" strokeWidth="2" />
                        <circle cx="787" cy="345" r="8" fill="#0b281a" stroke="#e5b842" strokeWidth="3.5" />
                        <rect x="770" y="365" width="35" height="20" fill="none" stroke="#ffffff" strokeWidth="1" />
                        <line x1="775" y1="375" x2="800" y2="375" stroke="#ffffff" strokeWidth="1.5" />
                        <line x1="777" y1="370" x2="797" y2="380" stroke="#ffffff" strokeWidth="1" />

                        {/* BUZZER1 */}
                        <rect x="760" y="405" width="70" height="50" rx="4" fill="none" stroke="#ffffff" strokeWidth="2" />
                        <rect x="765" y="415" width="18" height="18" rx="2" fill="#e5b842" />
                        <rect x="805" y="415" width="18" height="18" rx="2" fill="#e5b842" />
                        <text x="845" y="435" fill="#ffffff" fontSize="11" transform="rotate(90 845 435)" fontWeight="bold">BUZZER1</text>
                        <text x="774" y="448" fill="#ffffff" fontSize="14" fontWeight="bold">+</text>
                        <text x="812" y="446" fill="#ffffff" fontSize="14" fontWeight="bold">-</text>

                        {/* LEDs */}
                        <text x="705" y="215" fill="#ffffff" fontSize="10" fontWeight="bold">LED1</text>
                        <rect x="698" y="225" width="22" height="12" rx="2" fill="#10b981" stroke="#e5b842" />
                        <text x="745" y="245" fill="#ffffff" fontSize="10" fontWeight="bold">LED2</text>
                        <rect x="738" y="255" width="22" height="12" rx="2" fill="#00e5ff" stroke="#e5b842" />
                        <text x="775" y="180" fill="#ffffff" fontSize="10" fontWeight="bold">LED3</text>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* View 2: Isometric 3D Assembly Preview */}
                <div
                  className={`rounded-xl border overflow-hidden ${
                    isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="px-4 py-2.5 border-b border-current/10 flex items-center justify-between text-xs font-mono">
                    <span className="font-bold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                      <span>3D SMT Component Placement (Populated View)</span>
                    </span>
                    <span className="opacity-60 text-[10px]">35° Angled Perspective</span>
                  </div>
                  <div className="p-6 bg-slate-950 flex flex-col items-center justify-center min-h-[340px] text-center">
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 max-w-md w-full text-left space-y-3">
                      <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                        <Microchip className="w-4 h-4" />
                        <span>SMD Component Assembly Details</span>
                      </div>
                      <p className="text-xs opacity-75 leading-relaxed">
                        The board uses a single-sided surface-mount assembly process to maximize manufacturing yield and reduce thermal distortion during reflow.
                      </p>
                      <div className="space-y-1.5 font-mono text-[11px] opacity-90">
                        <div className="flex justify-between border-b border-slate-800 pb-1">
                          <span className="opacity-60">Board Dimensions:</span>
                          <span className="font-bold">110.0 x 60.0 x 1.6 mm</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-1">
                          <span className="opacity-60">Min Trace / Space:</span>
                          <span className="font-bold">0.15mm (6 mil) / 0.15mm</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-1">
                          <span className="opacity-60">Min Via Drill:</span>
                          <span className="font-bold">0.3 mm / 0.6 mm Annular Ring</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-1">
                          <span className="opacity-60">Conformal Coating:</span>
                          <span className="font-bold text-emerald-400">Silicone IP67 Spray</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="opacity-60">Operating Temp:</span>
                          <span className="font-bold text-amber-400">-40°C to +85°C Industrial</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTabMode('3d')}
                        className="w-full py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Switch to Interactive 3D Model</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </BorderGlow>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BILL OF MATERIALS (BOM) & NETLIST SPECIFICATIONS TAB                   */}
      {/* ========================================================================= */}
      {activeTabMode === 'specs' && (
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
            className={`rounded-2xl border p-6 transition-all ${
              isDarkMode
                ? 'bg-slate-900/80 border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-4 border-b border-current/10 pb-3">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Hardware Bill of Materials (BOM) & Component Index</span>
                </h2>
                <p className="text-xs opacity-70 mt-0.5">
                  Complete component ledger with manufacturer parts, footprint packages, and functional subsystem assignments.
                </p>
              </div>
              <span className="text-xs font-mono opacity-60 font-semibold">
                Total Parts: 16 Line Items
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead
                  className={`border-b font-semibold uppercase text-[10px] ${
                    isDarkMode ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <tr>
                    <th className="px-4 py-2.5">Designator</th>
                    <th className="px-4 py-2.5">Part / Description</th>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5">Package</th>
                    <th className="px-4 py-2.5">Key Characteristic</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-current/10">
                  {PCB_COMPONENTS.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setSelectedComp(item);
                        setActiveTabMode('3d');
                      }}
                      className={`cursor-pointer transition-colors ${
                        isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-4 py-3 font-bold text-cyan-400">
                        {item.designator}
                      </td>
                      <td className="px-4 py-3 font-sans font-medium text-slate-200">
                        {item.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full border ${
                            item.category === 'mcu'
                              ? 'bg-purple-950/60 text-purple-300 border-purple-800'
                              : item.category === 'rf'
                              ? 'bg-sky-950/60 text-sky-300 border-sky-800'
                              : item.category === 'sensor'
                              ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                              : item.category === 'power'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {item.category.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 opacity-80">
                        {item.package}
                      </td>
                      <td className="px-4 py-3 opacity-70 font-sans truncate max-w-xs">
                        {item.description}
                      </td>
                      <td className="px-4 py-3 text-right font-sans">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedComp(item);
                            setActiveTabMode('3d');
                          }}
                          className={`font-semibold text-xs ${
                            isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-teal-700 hover:text-teal-900'
                          }`}
                        >
                          View in 3D &rarr;
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
