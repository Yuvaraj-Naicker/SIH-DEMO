"use client";

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ThunderstormAtmosphereProps {
  className?: string;
  isDarkMode?: boolean;
  lightningFrequency?: "low" | "medium" | "high";
  windSpeedKmh?: number;
  triggerLightningNow?: number; // pass incrementing counter to force strike
  onLightningStrike?: () => void;
}

export interface ThunderstormRef {
  strike: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface LightningSegment {
  p1: Point;
  p2: Point;
  width: number;
  opacity: number;
  isBranch: boolean;
}

interface Raindrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
}

export const ThunderstormAtmosphere = forwardRef<ThunderstormRef, ThunderstormAtmosphereProps>(
  (
    {
      className,
      isDarkMode = true,
      lightningFrequency = "medium",
      windSpeedKmh = 42,
      triggerLightningNow,
      onLightningStrike,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const triggerRef = useRef<(() => void) | null>(null);

    useImperativeHandle(ref, () => ({
      strike: () => {
        if (triggerRef.current) triggerRef.current();
      },
    }));

    useEffect(() => {
      if (triggerLightningNow !== undefined && triggerRef.current) {
        triggerRef.current();
      }
    }, [triggerLightningNow]);

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

      // Tempest rain drops
      const dropCount = Math.floor((width * height) / 3800);
      const drops: Raindrop[] = [];
      const windTilt = (windSpeedKmh / 40) * 14;

      for (let i = 0; i < dropCount; i++) {
        drops.push({
          x: Math.random() * (width + Math.abs(windTilt) * 2) - Math.abs(windTilt),
          y: Math.random() * height,
          length: 18 + Math.random() * 22,
          speed: 18 + Math.random() * 10,
          opacity: 0.3 + Math.random() * 0.4,
        });
      }

      // Lightning state
      let activeSegments: LightningSegment[] = [];
      let flashIntensity = 0; // 0 to 1
      let flashDecay = 0.08;

      // Recursive lightning tree generator
      const generateLightning = (startX: number, startY: number, endX: number, endY: number) => {
        const segments: LightningSegment[] = [];

        const buildBranch = (p1: Point, p2: Point, depth: number, width: number, isBranch: boolean) => {
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 18 || depth <= 0) {
            segments.push({ p1, p2, width, opacity: 1, isBranch });
            return;
          }

          // Random midpoint displacement perpendicular to direction
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          const perpAngle = Math.atan2(dy, dx) + Math.PI / 2;
          const maxDisplace = dist * 0.22;
          const displace = (Math.random() - 0.5) * maxDisplace;

          const displacedPoint: Point = {
            x: midX + Math.cos(perpAngle) * displace,
            y: midY + Math.sin(perpAngle) * displace,
          };

          buildBranch(p1, displacedPoint, depth - 1, width, isBranch);
          buildBranch(displacedPoint, p2, depth - 1, width, isBranch);

          // Forking sub-branches
          if (!isBranch && Math.random() < 0.45 && depth > 2) {
            const branchAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.2;
            const branchDist = dist * (0.35 + Math.random() * 0.35);
            const branchEnd: Point = {
              x: displacedPoint.x + Math.cos(branchAngle) * branchDist,
              y: displacedPoint.y + Math.sin(branchAngle) * branchDist,
            };
            buildBranch(displacedPoint, branchEnd, depth - 2, Math.max(1, width * 0.55), true);
          }
        };

        buildBranch({ x: startX, y: startY }, { x: endX, y: endY }, 6, 3.2, false);
        return segments;
      };

      const fireLightning = () => {
        const startX = width * (0.2 + Math.random() * 0.6);
        const startY = 0;
        const endX = startX + (Math.random() - 0.5) * width * 0.35;
        const endY = height * (0.75 + Math.random() * 0.25);

        activeSegments = generateLightning(startX, startY, endX, endY);
        flashIntensity = 1.0;
        flashDecay = 0.05 + Math.random() * 0.04;

        if (onLightningStrike) {
          onLightningStrike();
        }
      };

      triggerRef.current = fireLightning;

      // Auto lightning interval
      const intervalMap = {
        low: 8000,
        medium: 4800,
        high: 2800,
      };
      let nextLightningTime = performance.now() + 1800;

      let lastTime = performance.now();

      const render = (time: number) => {
        const delta = Math.min(32, time - lastTime) / 16.666;
        lastTime = time;

        // Auto trigger check
        if (time >= nextLightningTime) {
          fireLightning();
          const baseInterval = intervalMap[lightningFrequency];
          nextLightningTime = time + baseInterval * (0.7 + Math.random() * 0.6);
        }

        ctx.clearRect(0, 0, width, height);

        // Sky background gradient with flash illumination
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        if (isDarkMode) {
          if (flashIntensity > 0.05) {
            // Illuminated tempest sky
            skyGrad.addColorStop(0, `rgba(90, 85, 140, ${0.4 + flashIntensity * 0.6})`);
            skyGrad.addColorStop(0.5, `rgba(50, 45, 95, ${0.5 + flashIntensity * 0.5})`);
            skyGrad.addColorStop(1, `rgba(20, 20, 45, ${0.7 + flashIntensity * 0.3})`);
          } else {
            skyGrad.addColorStop(0, "#080614"); // deep stormy midnight
            skyGrad.addColorStop(0.4, "#100d24"); // storm purple
            skyGrad.addColorStop(1, "#18142e"); // dark tempest horizon
          }
        } else {
          if (flashIntensity > 0.05) {
            skyGrad.addColorStop(0, `rgba(180, 185, 235, ${0.6 + flashIntensity * 0.4})`);
            skyGrad.addColorStop(0.5, `rgba(140, 145, 190, ${0.7 + flashIntensity * 0.3})`);
            skyGrad.addColorStop(1, `rgba(120, 130, 175, 1)`);
          } else {
            skyGrad.addColorStop(0, "#48435c"); // dark bruised overcast
            skyGrad.addColorStop(0.5, "#68617d"); // ominous squall
            skyGrad.addColorStop(1, "#8e86a4");
          }
        }

        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);

        // Ambient flash strobe burst
        if (flashIntensity > 0.02) {
          const flashGlow = ctx.createRadialGradient(
            width * 0.5,
            height * 0.2,
            10,
            width * 0.5,
            height * 0.2,
            Math.max(width, height)
          );
          flashGlow.addColorStop(
            0,
            isDarkMode
              ? `rgba(215, 225, 255, ${flashIntensity * 0.45})`
              : `rgba(255, 255, 255, ${flashIntensity * 0.55})`
          );
          flashGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.fillStyle = flashGlow;
          ctx.fillRect(0, 0, width, height);
        }

        // Draw Lightning Segments
        if (activeSegments.length > 0 && flashIntensity > 0.02) {
          ctx.save();
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          // Outer blue-violet aura glow
          ctx.shadowColor = isDarkMode ? "rgba(180, 200, 255, 0.95)" : "rgba(200, 210, 255, 0.9)";
          ctx.shadowBlur = 18;

          activeSegments.forEach((seg) => {
            ctx.beginPath();
            ctx.moveTo(seg.p1.x, seg.p1.y);
            ctx.lineTo(seg.p2.x, seg.p2.y);

            // Core electric white strike
            ctx.strokeStyle = `rgba(255, 255, 255, ${flashIntensity})`;
            ctx.lineWidth = seg.width * (0.8 + flashIntensity * 0.4);
            ctx.stroke();

            // Inner cyan-indigo lightning filament
            ctx.strokeStyle = `rgba(160, 210, 255, ${flashIntensity * 0.8})`;
            ctx.lineWidth = Math.max(1, seg.width * 0.4);
            ctx.stroke();
          });

          ctx.restore();
        }

        // Decay flash
        if (flashIntensity > 0) {
          flashIntensity = Math.max(0, flashIntensity - flashDecay * delta);
          if (flashIntensity <= 0) {
            activeSegments = [];
          }
        }

        // Render Torrential Rain Drops
        ctx.lineWidth = 1.4;
        for (let i = 0; i < drops.length; i++) {
          const d = drops[i];

          d.x += windTilt * (d.speed / 18) * delta;
          d.y += d.speed * delta;

          if (d.y >= height) {
            d.y = -d.length - Math.random() * 20;
            d.x = Math.random() * (width + Math.abs(windTilt) * 2) - Math.abs(windTilt);
          }

          const tailX = d.x - windTilt * (d.length / 18);
          const tailY = d.y - d.length;

          ctx.strokeStyle =
            flashIntensity > 0.2
              ? `rgba(225, 235, 255, ${d.opacity * 1.2})`
              : isDarkMode
              ? `rgba(165, 175, 215, ${d.opacity * 0.7})`
              : `rgba(240, 245, 255, ${d.opacity * 0.85})`;

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
    }, [isDarkMode, lightningFrequency, windSpeedKmh, onLightningStrike]);

    return (
      <div className={cn("relative w-full h-full overflow-hidden pointer-events-none", className)}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
        {/* Atmosphere Vignette */}
        <div
          className={cn(
            "absolute inset-0 pointer-events-none transition-colors duration-300",
            isDarkMode
              ? "bg-gradient-to-b from-slate-950/45 via-slate-950/20 to-slate-950/65"
              : "bg-gradient-to-b from-slate-900/35 via-slate-900/10 to-slate-900/45"
          )}
        />
      </div>
    );
  }
);

ThunderstormAtmosphere.displayName = "ThunderstormAtmosphere";
