"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface HeatDizzyAtmosphereProps {
  className?: string;
  isDarkMode?: boolean;
  /** Intensity of the dizzy mirage wave distortion (0.2 to 2.0) */
  dizziness?: number;
  /** Ambient temperature representation (e.g. 38°C to 45°C) */
  temperatureC?: number;
  showEmbers?: boolean;
}

interface HeatEmber {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  driftX: number;
  driftPhase: number;
  opacity: number;
  color: string;
}

interface ThermalWave {
  y: number;
  speed: number;
  amplitude: number;
  wavelength: number;
  phase: number;
  opacity: number;
}

export const HeatDizzyAtmosphere: React.FC<HeatDizzyAtmosphereProps> = ({
  className,
  isDarkMode = true,
  dizziness = 1.0,
  temperatureC = 41.5,
  showEmbers = true,
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

    // Heat embers/dust motes floating upward on convective updrafts
    const emberCount = Math.floor((width * height) / 10000);
    const embers: HeatEmber[] = [];
    const emberColors = isDarkMode
      ? ["rgba(255, 175, 55, ", "rgba(255, 120, 30, ", "rgba(255, 210, 100, ", "rgba(255, 80, 40, "]
      : ["rgba(255, 190, 80, ", "rgba(255, 140, 50, ", "rgba(255, 225, 130, ", "rgba(240, 110, 40, "];

    for (let i = 0; i < emberCount; i++) {
      embers.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 1.0 + Math.random() * 2.2,
        speedY: 0.6 + Math.random() * 1.2,
        driftX: (Math.random() - 0.5) * 0.8,
        driftPhase: Math.random() * Math.PI * 2,
        opacity: 0.2 + Math.random() * 0.55,
        color: emberColors[Math.floor(Math.random() * emberColors.length)],
      });
    }

    // Thermal mirage wave bands
    const waveBands: ThermalWave[] = [
      { y: height * 0.85, speed: 0.035, amplitude: 14 * dizziness, wavelength: 120, phase: 0, opacity: 0.18 },
      { y: height * 0.70, speed: 0.045, amplitude: 18 * dizziness, wavelength: 160, phase: 1.5, opacity: 0.14 },
      { y: height * 0.55, speed: 0.030, amplitude: 12 * dizziness, wavelength: 190, phase: 3.0, opacity: 0.10 },
      { y: height * 0.40, speed: 0.025, amplitude: 10 * dizziness, wavelength: 220, phase: 4.5, opacity: 0.08 },
    ];

    let lastTime = performance.now();
    let globalTimer = 0;

    const render = (time: number) => {
      const delta = Math.min(32, time - lastTime) / 16.666;
      lastTime = time;
      globalTimer += 0.02 * delta;

      ctx.clearRect(0, 0, width, height);

      // Blazing Heat Atmospheric Sky Base
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (isDarkMode) {
        skyGrad.addColorStop(0, "#230f04"); // scorching dark umber
        skyGrad.addColorStop(0.35, "#3d1806"); // hot amber twilight
        skyGrad.addColorStop(0.7, "#5c2409"); // glowing terracotta
        skyGrad.addColorStop(1, "#361304"); // baked ground horizon
      } else {
        skyGrad.addColorStop(0, "#ffcf99"); // bright sweltering peach
        skyGrad.addColorStop(0.4, "#ffe2b8"); // sun-baked mirage haze
        skyGrad.addColorStop(0.8, "#ffd8aa"); // radiant horizon
        skyGrad.addColorStop(1, "#f5c38c");
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Blazing Sun Corona with Dizzy Pulsation
      const sunCenterX = width * 0.68;
      const sunCenterY = height * 0.15;
      const sunPulse = 1.0 + Math.sin(globalTimer * 1.8) * 0.08 * dizziness;
      const sunRadius = Math.min(width, height) * 0.35 * sunPulse;

      const sunGlow = ctx.createRadialGradient(
        sunCenterX,
        sunCenterY,
        0,
        sunCenterX,
        sunCenterY,
        sunRadius
      );
      if (isDarkMode) {
        sunGlow.addColorStop(0, "rgba(255, 220, 130, 0.75)");
        sunGlow.addColorStop(0.25, "rgba(255, 140, 40, 0.45)");
        sunGlow.addColorStop(0.65, "rgba(220, 70, 15, 0.18)");
        sunGlow.addColorStop(1, "rgba(180, 40, 10, 0)");
      } else {
        sunGlow.addColorStop(0, "rgba(255, 255, 235, 0.9)");
        sunGlow.addColorStop(0.2, "rgba(255, 215, 120, 0.55)");
        sunGlow.addColorStop(0.6, "rgba(255, 175, 75, 0.22)");
        sunGlow.addColorStop(1, "rgba(255, 150, 50, 0)");
      }

      ctx.fillStyle = sunGlow;
      ctx.fillRect(0, 0, width, height);

      // Dizzy Pulsating Sun Rays (swirling thermal mirage rays)
      ctx.save();
      ctx.translate(sunCenterX, sunCenterY);
      ctx.rotate(globalTimer * 0.12 * dizziness);
      const rayCount = 12;
      for (let r = 0; r < rayCount; r++) {
        const angle = (r * Math.PI * 2) / rayCount;
        ctx.rotate(angle);
        const rayGrad = ctx.createLinearGradient(0, 0, sunRadius * 1.4, 0);
        const rayAlpha = (0.07 + Math.sin(globalTimer * 2 + r) * 0.03) * dizziness;
        rayGrad.addColorStop(
          0,
          isDarkMode ? `rgba(255, 190, 80, ${rayAlpha * 1.5})` : `rgba(255, 240, 160, ${rayAlpha * 1.6})`
        );
        rayGrad.addColorStop(1, "rgba(255, 200, 100, 0)");

        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(sunRadius * 1.4, -6);
        ctx.lineTo(sunRadius * 1.4, 6);
        ctx.lineTo(0, 18);
        ctx.closePath();
        ctx.fill();
        ctx.rotate(-angle);
      }
      ctx.restore();

      // Dizzy Heat Mirage Distortion Wave Shimmer (horizontal undulating sine ribbons)
      waveBands.forEach((wave, idx) => {
        wave.phase += wave.speed * delta;
        ctx.save();
        ctx.beginPath();

        // Top line of mirage ribbon
        ctx.moveTo(0, wave.y);
        for (let x = 0; x <= width; x += 15) {
          const waveY =
            wave.y +
            Math.sin((x / wave.wavelength) + wave.phase) * wave.amplitude +
            Math.cos((x / (wave.wavelength * 0.6)) + wave.phase * 1.4) * (wave.amplitude * 0.4);
          ctx.lineTo(x, waveY);
        }

        // Bottom connection
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        const mirageGrad = ctx.createLinearGradient(0, wave.y - wave.amplitude, 0, height);
        const waveCol = isDarkMode ? "255, 140, 50" : "255, 220, 150";
        mirageGrad.addColorStop(0, `rgba(${waveCol}, ${wave.opacity * 1.3})`);
        mirageGrad.addColorStop(0.5, `rgba(${waveCol}, ${wave.opacity * 0.5})`);
        mirageGrad.addColorStop(1, `rgba(${waveCol}, 0)`);

        ctx.fillStyle = mirageGrad;
        ctx.fill();
        ctx.restore();
      });

      // Hypnotic / Dizzy expanding thermal heat ripples near the bottom ground
      const groundPulse = (globalTimer * 1.5) % 1;
      const rippleY = height * 0.88;
      for (let ring = 0; ring < 3; ring++) {
        const ringProgress = ((groundPulse + ring / 3) % 1);
        const ringRadiusX = width * 0.45 * ringProgress;
        const ringRadiusY = 24 * ringProgress;
        const ringAlpha = (1 - ringProgress) * 0.22 * dizziness;

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(width * 0.5, rippleY, ringRadiusX, ringRadiusY, 0, 0, Math.PI * 2);
        ctx.strokeStyle = isDarkMode
          ? `rgba(255, 180, 80, ${ringAlpha})`
          : `rgba(255, 230, 160, ${ringAlpha * 1.5})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      }

      // Rising Thermal Updraft Embers / Shimmering Dust
      if (showEmbers) {
        embers.forEach((ember) => {
          ember.y -= ember.speedY * delta;
          ember.driftPhase += 0.03 * delta;
          ember.x += (Math.sin(ember.driftPhase) * 0.9 + ember.driftX) * delta;

          // Reset when reaching top
          if (ember.y < -10) {
            ember.y = height + 10;
            ember.x = Math.random() * width;
          }

          // Shimmer flicker
          const flicker = 0.7 + Math.sin(ember.driftPhase * 2.5) * 0.3;
          ctx.beginPath();
          ctx.arc(ember.x, ember.y, ember.radius, 0, Math.PI * 2);
          ctx.fillStyle = `${ember.color}${ember.opacity * flicker})`;
          ctx.shadowColor = isDarkMode ? "#ffaa33" : "#ffeedd";
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isDarkMode, dizziness, temperatureC, showEmbers]);

  return (
    <div className={cn("relative w-full h-full overflow-hidden pointer-events-none", className)}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      {/* Warm atmospheric veil */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition-colors duration-300",
          isDarkMode
            ? "bg-gradient-to-b from-slate-950/35 via-slate-950/15 to-slate-950/50"
            : "bg-gradient-to-b from-white/35 via-white/10 to-white/45"
        )}
      />
    </div>
  );
};
