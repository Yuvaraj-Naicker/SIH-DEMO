"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface RainAtmosphereProps {
  className?: string;
  intensity?: "light" | "moderate" | "heavy" | "torrential";
  windSpeedKmh?: number;
  windDirection?: string;
  showRipples?: boolean;
  showSplashes?: boolean;
  isDarkMode?: boolean;
}

interface Raindrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  layer: number; // 0 = background (fine/slow), 1 = mid, 2 = foreground (fast/thick)
  opacity: number;
}

interface Splash {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  maxLife: number;
  color: string;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  speed: number;
}

export const RainAtmosphere: React.FC<RainAtmosphereProps> = ({
  className,
  intensity = "heavy",
  windSpeedKmh = 32,
  showRipples = true,
  showSplashes = true,
  isDarkMode = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 480);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener("resize", handleResize);

    // Drop count based on intensity
    const counts = {
      light: Math.floor((width * height) / 14000),
      moderate: Math.floor((width * height) / 7500),
      heavy: Math.floor((width * height) / 4200),
      torrential: Math.floor((width * height) / 2600),
    };
    const maxDrops = Math.min(650, Math.max(90, counts[intensity]));

    // Wind angle calculation (slant in px per frame)
    const windTilt = Math.min(18, Math.max(-18, (windSpeedKmh / 50) * 12));

    // Initialize drops
    const drops: Raindrop[] = [];
    for (let i = 0; i < maxDrops; i++) {
      const layer = Math.random() < 0.25 ? 0 : Math.random() < 0.7 ? 1 : 2;
      const speed = layer === 0 ? 9 + Math.random() * 4 : layer === 1 ? 15 + Math.random() * 6 : 22 + Math.random() * 8;
      const length = layer === 0 ? 8 + Math.random() * 8 : layer === 1 ? 16 + Math.random() * 14 : 26 + Math.random() * 18;
      const opacity = layer === 0 ? 0.2 + Math.random() * 0.15 : layer === 1 ? 0.35 + Math.random() * 0.25 : 0.5 + Math.random() * 0.3;

      drops.push({
        x: Math.random() * (width + Math.abs(windTilt) * 2) - Math.abs(windTilt),
        y: Math.random() * height,
        length,
        speed,
        layer,
        opacity,
      });
    }

    const splashes: Splash[] = [];
    const ripples: Ripple[] = [];

    // Rolling fog mist clouds
    const mistClouds = [
      { x: 0, y: height * 0.35, r: 160, speed: 0.22 },
      { x: width * 0.5, y: height * 0.2, r: 220, speed: 0.18 },
      { x: width * 0.8, y: height * 0.5, r: 180, speed: 0.26 },
    ];

    let lastTime = performance.now();

    const render = (time: number) => {
      const delta = Math.min(32, time - lastTime) / 16.666;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Atmospheric Sky Base Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (isDarkMode) {
        skyGrad.addColorStop(0, "#08111e"); // deep stormy night
        skyGrad.addColorStop(0.4, "#0f2038"); // heavy monsoon indigo
        skyGrad.addColorStop(1, "#182c44"); // wet ground horizon
      } else {
        skyGrad.addColorStop(0, "#8da5ba"); // overcast monsoon grey-blue
        skyGrad.addColorStop(0.5, "#a8c0d4"); // humid rain veil
        skyGrad.addColorStop(1, "#c5d7e5"); // pale wet horizon
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Drifting mist layers
      mistClouds.forEach((c) => {
        c.x += c.speed * delta;
        if (c.x - c.r > width) c.x = -c.r;

        const mistGrad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
        const mistColor = isDarkMode ? "rgba(120, 160, 205, 0.04)" : "rgba(255, 255, 255, 0.12)";
        mistGrad.addColorStop(0, mistColor);
        mistGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = mistGrad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Ground water puddle shimmer layer at bottom
      const groundGrad = ctx.createLinearGradient(0, height - 80, 0, height);
      groundGrad.addColorStop(0, isDarkMode ? "rgba(10, 25, 45, 0)" : "rgba(200, 220, 240, 0)");
      groundGrad.addColorStop(1, isDarkMode ? "rgba(14, 34, 60, 0.45)" : "rgba(180, 205, 230, 0.5)");
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, height - 80, width, 80);

      // Render & Update Ripples
      if (showRipples) {
        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i];
          r.radius += r.speed * delta;
          r.opacity -= 0.015 * delta;

          if (r.opacity <= 0 || r.radius >= r.maxRadius) {
            ripples.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.beginPath();
          ctx.ellipse(r.x, r.y, r.radius, r.radius * 0.35, 0, 0, Math.PI * 2);
          ctx.strokeStyle = isDarkMode
            ? `rgba(140, 200, 255, ${r.opacity * 0.45})`
            : `rgba(255, 255, 255, ${r.opacity * 0.7})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }
      }

      // Render & Update Splashes
      if (showSplashes) {
        for (let i = splashes.length - 1; i >= 0; i--) {
          const s = splashes[i];
          s.x += s.vx * delta;
          s.y += s.vy * delta;
          s.vy += 0.35 * delta; // gravity
          s.life -= 1 * delta;

          if (s.life <= 0) {
            splashes.splice(i, 1);
            continue;
          }

          const splashAlpha = Math.max(0, s.life / s.maxLife);
          ctx.fillStyle = isDarkMode
            ? `rgba(160, 220, 255, ${splashAlpha * 0.6})`
            : `rgba(255, 255, 255, ${splashAlpha * 0.8})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Render & Update Raindrops
      ctx.lineWidth = 1.2;
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];

        d.x += windTilt * (d.speed / 16) * delta;
        d.y += d.speed * delta;

        // Ground collision & splash spawn
        const groundThreshold = height - (Math.random() * 40);
        if (d.y >= groundThreshold) {
          // Spawn splash & ripple
          if (showSplashes && d.layer >= 1 && splashes.length < 50 && Math.random() < 0.4) {
            const splashCount = d.layer === 2 ? 3 : 2;
            for (let s = 0; s < splashCount; s++) {
              splashes.push({
                x: d.x,
                y: height - 12 - Math.random() * 8,
                vx: (Math.random() - 0.5) * 2.8 + windTilt * 0.1,
                vy: -1.8 - Math.random() * 2.2,
                radius: 0.8 + Math.random() * 0.8,
                life: 14 + Math.random() * 8,
                maxLife: 22,
                color: isDarkMode ? "#a5d8ff" : "#ffffff",
              });
            }
          }

          if (showRipples && d.layer >= 1 && ripples.length < 25 && Math.random() < 0.25) {
            ripples.push({
              x: d.x,
              y: height - 10 - Math.random() * 16,
              radius: 2,
              maxRadius: 18 + Math.random() * 16,
              opacity: 0.65,
              speed: 0.5 + Math.random() * 0.4,
            });
          }

          // Reset drop to top
          d.y = -d.length - Math.random() * 40;
          d.x = Math.random() * (width + Math.abs(windTilt) * 2) - Math.abs(windTilt);
        }

        // Draw drop streak
        const tailX = d.x - windTilt * (d.length / 16);
        const tailY = d.y - d.length;

        ctx.strokeStyle = isDarkMode
          ? `rgba(180, 220, 255, ${d.opacity})`
          : `rgba(235, 245, 255, ${d.opacity * 0.9})`;
        ctx.lineWidth = d.layer === 0 ? 0.8 : d.layer === 1 ? 1.3 : 1.8;

        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [intensity, windSpeedKmh, showRipples, showSplashes, isDarkMode]);

  return (
    <div className={cn("relative w-full h-full overflow-hidden pointer-events-none", className)}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      {/* Soft gradient veil for text legibility */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition-colors duration-300",
          isDarkMode
            ? "bg-gradient-to-b from-slate-950/40 via-slate-950/15 to-slate-950/60"
            : "bg-gradient-to-b from-white/40 via-white/10 to-white/50"
        )}
      />
    </div>
  );
};
