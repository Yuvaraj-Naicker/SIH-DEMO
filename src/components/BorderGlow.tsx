import React, { useRef, useState, useCallback } from 'react';

export interface BorderGlowProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  edgeSensitivity?: number;
  glowColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  glowRadius?: number;
  glowIntensity?: number;
  coneSpread?: number;
  animated?: boolean;
  colors?: string[];
}

export const BorderGlow: React.FC<BorderGlowProps> = ({
  children,
  className = '',
  edgeSensitivity = 30,
  glowColor = '40 80 80',
  backgroundColor = '#120F17',
  borderRadius = 28,
  glowRadius = 40,
  glowIntensity = 1.0,
  coneSpread = 25,
  animated = false,
  colors = ['#c084fc', '#f472b6', '#38bdf8'],
  style,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0, angle: 0, proximity: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const w = rect.width;
      const h = rect.height;

      // Distance from pointer to nearest edge
      const distToEdge = Math.min(x, w - x, y, h - y);

      // Sensitivity: full intensity when within edgeSensitivity, fading smoothly towards the center
      const sensitivity = Math.max(10, edgeSensitivity);
      let proximity = 1;
      if (distToEdge > sensitivity) {
        proximity = Math.max(0.15, 1 - (distToEdge - sensitivity) / (sensitivity * 2.5));
      }

      // Angle from center
      const centerX = w / 2;
      const centerY = h / 2;
      const rad = Math.atan2(y - centerY, x - centerX);
      const angle = (rad * (180 / Math.PI) + 360) % 360;

      setCursor({ x, y, angle, proximity });
      setIsActive(true);
    },
    [edgeSensitivity]
  );

  const handleMouseLeave = useCallback(() => {
    setIsActive(false);
  }, []);

  const c0 = colors[0] || '#c084fc';
  const c1 = colors[1] || '#f472b6';
  const c2 = colors[2] || '#38bdf8';

  const spreadDeg = Math.max(20, coneSpread * 3.6);
  const halfSpread = spreadDeg / 2;

  // Background gradient for border beam / glow
  const conicGradient = `conic-gradient(from ${cursor.angle - halfSpread}deg at 50% 50%, transparent 0deg, ${c0} ${spreadDeg * 0.25}deg, ${c1} ${spreadDeg * 0.5}deg, ${c2} ${spreadDeg * 0.75}deg, transparent ${spreadDeg}deg)`;
  const radialGlow = `radial-gradient(${glowRadius * 3}px circle at ${cursor.x}px ${cursor.y}px, ${c0} 0%, ${c1} 35%, ${c2} 70%, transparent 85%)`;

  const effectiveOpacity = isActive ? Math.min(1, cursor.proximity * glowIntensity) : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={handleMouseLeave}
      className={`relative group ${className}`}
      style={{
        borderRadius: `${borderRadius}px`,
        ...style,
      }}
      {...props}
    >
      {/* Outer ambient glow halo */}
      <div
        className="pointer-events-none absolute -inset-2 transition-opacity duration-300 z-0"
        style={{
          borderRadius: `${borderRadius + 8}px`,
          background: isActive ? radialGlow : undefined,
          opacity: effectiveOpacity * 0.75,
          filter: `blur(${glowRadius}px)`,
        }}
        aria-hidden="true"
      />

      {/* Illuminated 2px border rim */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-200"
        style={{
          borderRadius: `${borderRadius}px`,
          padding: '2px',
          background: animated
            ? `conic-gradient(from 0deg, ${c0}, ${c1}, ${c2}, ${c0})`
            : isActive
            ? `${conicGradient}, ${radialGlow}`
            : 'rgba(255, 255, 255, 0.08)',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          opacity: isActive ? Math.max(0.5, effectiveOpacity) : 0.2,
          animation: animated ? 'borderGlowRotate 8s linear infinite' : undefined,
        }}
        aria-hidden="true"
      />

      {/* Internal Card Background & Content Container */}
      <div
        className="relative z-10 w-full h-full overflow-hidden"
        style={{
          borderRadius: `${borderRadius}px`,
          backgroundColor: backgroundColor !== undefined ? backgroundColor : '#120F17',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default BorderGlow;
