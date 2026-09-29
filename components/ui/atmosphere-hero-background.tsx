"use client";

import React, { useState, useRef, useEffect } from "react";
import { CloudShader } from "./cloud-shader";
import { RainAtmosphere } from "./rain-atmosphere";
import { ThunderstormAtmosphere, ThunderstormRef } from "./thunderstorm-atmosphere";
import { HeatDizzyAtmosphere } from "./heat-dizzy-atmosphere";
import { LocationConfig, LocationId } from "@/src/types";
import {
  CloudSun,
  CloudRain,
  Zap,
  Flame,
  Sliders,
  RefreshCw,
  Film,
  Sparkles,
  Play,
  Pause,
  Upload,
  Layers,
  Eye,
  Check,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AtmosphereMode = "clouds" | "rain" | "thunderstorm" | "heat" | "dizzy";
export type BackgroundRenderType = "video" | "hybrid" | "shader";

export interface VideoBackgroundItem {
  id: string;
  name: string;
  filename: string;
  url: string;
  locationId: LocationId;
  description: string;
  tag: string;
  category: AtmosphereMode;
}

// 5 Dedicated Atmospheric Videos matching user uploads
export const ATMOSPHERE_VIDEOS: VideoBackgroundItem[] = [
  {
    id: "mumbai-rain",
    name: "Mumbai Monsoon Rain",
    filename: "188021-881528788_medium.mp4",
    url: "/videos/mumbai-rain.mp4",
    locationId: "mumbai",
    description: "Torrential downpour, rainfall streaks & splashing water surface",
    tag: "Monsoon Downpour",
    category: "rain",
  },
  {
    id: "kerala-thunderstorm",
    name: "Kerala Western Ghats Storm",
    filename: "11025478-hd_1920_1080_24fps.mp4",
    url: "/videos/kerala-thunderstorm.mp4",
    locationId: "kerala",
    description: "Violent electrical tempest with branching lightning and dark squall clouds",
    tag: "Thunderstorm & Lightning",
    category: "thunderstorm",
  },
  {
    id: "chennai-heat",
    name: "Chennai Solar Heatwave",
    filename: "17311357-uhd_3840_2160_30fps.mp4",
    url: "/videos/chennai-heat.mp4",
    locationId: "chennai",
    description: "Blazing tropical solar corona, extreme UV radiation and blistering sun",
    tag: "Blazing Heatwave",
    category: "heat",
  },
  {
    id: "puducherry-clouds",
    name: "Puducherry Coastal Clouds",
    filename: "17499303-uhd_2560_1440_30fps.mp4",
    url: "/videos/puducherry-clouds.mp4",
    locationId: "puducherry",
    description: "Cinematic drifting coastal cumulus and gentle oceanic sky currents",
    tag: "Coastal Clouds",
    category: "clouds",
  },
  {
    id: "dizzy-mirage",
    name: "Chennai Dizzy Mirage",
    filename: "13725274_2048_1080_30fps.mp4",
    url: "/videos/dizzy-mirage.mp4",
    locationId: "chennai",
    description: "Hypnotic thermal shimmer, tarmac mirage refraction & atmospheric dizzy waves",
    tag: "Dizzy Mirage",
    category: "dizzy",
  },
];

// Default atmospheric weather matching for each city
export const CITY_DEFAULT_ATMOSPHERE: Record<LocationId, AtmosphereMode> = {
  puducherry: "clouds",
  mumbai: "rain",
  kerala: "thunderstorm",
  chennai: "heat",
};

// Default video mapping for each city
export const CITY_DEFAULT_VIDEO: Record<LocationId, string> = {
  puducherry: "puducherry-clouds",
  mumbai: "mumbai-rain",
  kerala: "kerala-thunderstorm",
  chennai: "chennai-heat",
};

export interface AtmosphereHeroBackgroundProps {
  location: LocationConfig;
  isDarkMode: boolean;
  className?: string;
}

export const AtmosphereHeroBackground: React.FC<AtmosphereHeroBackgroundProps> = ({
  location,
  isDarkMode,
  className,
}) => {
  // Rendering mode: video (default), hybrid (video + shader overlay), or shader only
  const [renderMode, setRenderMode] = useState<BackgroundRenderType>("video");
  
  // Selected video ID (defaults to active location's video)
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  
  // Custom user-provided video URL if uploaded
  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null);
  const [customVideoName, setCustomVideoName] = useState<string>("");
  
  // User override for atmosphere category (or null to follow city)
  const [userOverrideMode, setUserOverrideMode] = useState<AtmosphereMode | null>(null);
  
  // Video playback controls
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [videoSpeed, setVideoSpeed] = useState<number>(1.0);
  const [videoOpacity, setVideoOpacity] = useState<number>(0.85);
  const [hasVideoError, setHasVideoError] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [lightningFlash, setLightningFlash] = useState<boolean>(false);

  // Tunable shader parameters for hybrid or shader mode
  const [dizzinessLevel, setDizzinessLevel] = useState<number>(1.2);
  const [rainIntensity, setRainIntensity] = useState<"light" | "moderate" | "heavy" | "torrential">("heavy");
  const [lightningFreq, setLightningFreq] = useState<"low" | "medium" | "high">("medium");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stormRef = useRef<ThunderstormRef | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Determine active atmosphere mode
  const activeMode: AtmosphereMode =
    userOverrideMode !== null
      ? userOverrideMode
      : CITY_DEFAULT_ATMOSPHERE[location.id] || "clouds";

  // Determine active video object
  const activeVideo: VideoBackgroundItem = React.useMemo(() => {
    if (selectedVideoId) {
      const found = ATMOSPHERE_VIDEOS.find((v) => v.id === selectedVideoId);
      if (found) return found;
    }
    const cityVidId = CITY_DEFAULT_VIDEO[location.id] || "puducherry-clouds";
    return ATMOSPHERE_VIDEOS.find((v) => v.id === cityVidId) || ATMOSPHERE_VIDEOS[0];
  }, [selectedVideoId, location.id]);

  // Update playback speed when changed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = videoSpeed;
    }
  }, [videoSpeed]);

  // Handle play/pause toggle
  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Trigger manual lightning strike
  const handleStrikeLightning = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Visual flash screen strobe
    setLightningFlash(true);
    setTimeout(() => setLightningFlash(false), 240);
    
    // Also trigger procedural lightning if shader is mounted
    if (stormRef.current) {
      stormRef.current.strike();
    }
  };

  // Handle custom file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    setCustomVideoUrl(blobUrl);
    setCustomVideoName(file.name);
    setRenderMode("video");
    setHasVideoError(false);
  };

  // Current video source URL
  const currentVideoSrc = customVideoUrl || activeVideo.url;

  return (
    <div className={cn("absolute inset-0 z-0 overflow-hidden pointer-events-none select-none", className)}>
      {/* ========================================================================= */}
      {/* 1. CINEMATIC VIDEO BACKGROUND LAYER (Rendered in 'video' or 'hybrid' modes) */}
      {/* ========================================================================= */}
      {(renderMode === "video" || renderMode === "hybrid") && !hasVideoError && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            ref={videoRef}
            key={currentVideoSrc}
            src={currentVideoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onError={() => {
              console.warn("Video failed to play, switching to shader mode");
              setHasVideoError(true);
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full h-full object-cover transition-opacity duration-700"
            style={{ opacity: videoOpacity }}
          />

          {/* Contrast & Legibility Gradients ensuring text is 100% sharp and readable */}
          <div
            className={cn(
              "absolute inset-0 pointer-events-none transition-all duration-500",
              isDarkMode
                ? "bg-gradient-to-b from-slate-950/75 via-slate-950/45 to-slate-950/85"
                : "bg-gradient-to-b from-white/70 via-white/40 to-white/80"
            )}
          />

          {/* Vignette effect frame for cinema-grade focus */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.6)]" />

          {/* Heat distortion shimmer overlay when heat or dizzy video is active */}
          {(activeMode === "heat" || activeMode === "dizzy" || activeVideo.category === "heat" || activeVideo.category === "dizzy") && (
            <div
              className="absolute inset-0 pointer-events-none opacity-40 mix-blend-color-dodge animate-pulse"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 25%, rgba(251, 191, 36, 0.35) 0%, rgba(245, 158, 11, 0.15) 50%, transparent 85%)",
              }}
            />
          )}

          {/* Instant Lightning Flash Overlay */}
          {lightningFlash && (
            <div className="absolute inset-0 bg-white/75 z-20 pointer-events-none animate-ping duration-150" />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PROCEDURAL CANVAS / SHADER LAYER (Rendered in 'shader' or 'hybrid' modes)*/}
      {/* ========================================================================= */}
      {(renderMode === "shader" || renderMode === "hybrid" || hasVideoError) && (
        <div
          className={cn(
            "absolute inset-0 z-1 pointer-events-none",
            renderMode === "hybrid" ? "opacity-60 mix-blend-screen" : "opacity-100"
          )}
        >
          {/* A. CLOUDS SHADER (Puducherry) */}
          {activeMode === "clouds" && (
            <div className="absolute inset-0">
              <CloudShader
                className="w-full h-full min-h-[460px]"
                speed={0.5}
                count={5}
                cloudColor="#ffffff"
                skyTopColor={isDarkMode ? "#0d3257" : "#1d60a5"}
                skyBottomColor={isDarkMode ? "#1e4873" : "#6baae2"}
              />
            </div>
          )}

          {/* B. MONSOON RAIN (Mumbai) */}
          {activeMode === "rain" && (
            <RainAtmosphere
              className="w-full h-full min-h-[460px]"
              isDarkMode={isDarkMode}
              intensity={rainIntensity}
              windSpeedKmh={location.liveMetrics.windSpeedKmh || 32}
              showRipples={true}
              showSplashes={true}
            />
          )}

          {/* C. THUNDERSTORM & LIGHTNING (Kerala) */}
          {activeMode === "thunderstorm" && (
            <ThunderstormAtmosphere
              ref={stormRef}
              className="w-full h-full min-h-[460px]"
              isDarkMode={isDarkMode}
              lightningFrequency={lightningFreq}
              windSpeedKmh={location.liveMetrics.windSpeedKmh || 42}
            />
          )}

          {/* D. HEAT & DIZZY MIRAGE (Chennai) */}
          {(activeMode === "heat" || activeMode === "dizzy") && (
            <HeatDizzyAtmosphere
              className="w-full h-full min-h-[460px]"
              isDarkMode={isDarkMode}
              dizziness={dizzinessLevel}
              temperatureC={location.liveMetrics.ambientTempC || 38.5}
              showEmbers={true}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ATMOSPHERIC INTERACTIVE CONTROLLER TOOLBAR (Top Right of Hero)          */}
      {/* ========================================================================= */}
      <div className="absolute top-3 right-3 z-30 pointer-events-auto flex items-center gap-2 flex-wrap justify-end">
        {/* Instant Lightning Strike Action Button (Available in thunderstorm video/weather) */}
        {(activeMode === "thunderstorm" || activeVideo.id === "kerala-thunderstorm") && (
          <button
            type="button"
            onClick={handleStrikeLightning}
            className={cn(
              "px-2.5 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer",
              isDarkMode
                ? "bg-purple-900/90 hover:bg-purple-800 text-purple-200 border border-purple-500/50 shadow-purple-950/50"
                : "bg-purple-600 hover:bg-purple-700 text-white border border-purple-700 shadow-purple-200"
            )}
            title="Trigger instant lightning bolt flash"
          >
            <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300 animate-pulse" />
            <span className="hidden sm:inline">Strike Lightning!</span>
          </button>
        )}

        {/* Video Play/Pause toggle when video mode is on */}
        {renderMode !== "shader" && !hasVideoError && (
          <button
            type="button"
            onClick={togglePlay}
            className={cn(
              "p-1.5 rounded-xl border shadow-md backdrop-blur-md flex items-center transition-all cursor-pointer",
              isDarkMode
                ? "bg-slate-950/80 border-slate-700 text-slate-200 hover:bg-slate-800"
                : "bg-white/90 border-slate-200 text-slate-800 hover:bg-slate-100"
            )}
            title={isPlaying ? "Pause video background" : "Play video background"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-cyan-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        )}

        {/* Main Background Switcher Capsule */}
        <div
          className={cn(
            "p-1 rounded-2xl border shadow-lg backdrop-blur-md flex items-center gap-1 transition-all",
            isDarkMode
              ? "bg-slate-950/90 border-slate-700/80 text-slate-200"
              : "bg-white/95 border-slate-200 text-slate-800"
          )}
        >
          {/* Mode Indicator: Video / Hybrid / Shader */}
          <div className="flex items-center gap-0.5 px-1 bg-current/5 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => {
                setRenderMode("video");
                setHasVideoError(false);
              }}
              className={cn(
                "px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer",
                renderMode === "video"
                  ? "bg-cyan-500 text-slate-950 shadow-xs"
                  : "opacity-60 hover:opacity-100"
              )}
              title="Full HD Video Background Mode (Pexels / Pixabay Source)"
            >
              <Film className="w-3 h-3" />
              <span>Video</span>
            </button>

            <button
              type="button"
              onClick={() => setRenderMode("hybrid")}
              className={cn(
                "px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer",
                renderMode === "hybrid"
                  ? "bg-purple-500 text-white shadow-xs"
                  : "opacity-60 hover:opacity-100"
              )}
              title="Hybrid Mode: Video + Live Procedural Canvas FX overlay"
            >
              <Layers className="w-3 h-3" />
              <span>Hybrid</span>
            </button>

            <button
              type="button"
              onClick={() => setRenderMode("shader")}
              className={cn(
                "px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer",
                renderMode === "shader"
                  ? "bg-amber-500 text-slate-950 shadow-xs"
                  : "opacity-60 hover:opacity-100"
              )}
              title="Procedural Canvas & WebGL Shader Mode"
            >
              <Sparkles className="w-3 h-3" />
              <span>Shader</span>
            </button>
          </div>

          <div className="h-4 w-px bg-current/20 mx-0.5" />

          {/* Quick Atmosphere Preset Selectors */}
          {/* Puducherry / Clouds */}
          <button
            type="button"
            onClick={() => {
              setUserOverrideMode("clouds");
              setSelectedVideoId("puducherry-clouds");
              setCustomVideoUrl(null);
            }}
            className={cn(
              "px-2 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
              (selectedVideoId === "puducherry-clouds" || (!selectedVideoId && activeMode === "clouds"))
                ? isDarkMode
                  ? "bg-cyan-500/25 text-cyan-300 border border-cyan-400/50"
                  : "bg-teal-700 text-white"
                : "opacity-70 hover:opacity-100 hover:bg-current/10"
            )}
            title="Clouds (Puducherry: 17499303)"
          >
            <CloudSun className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline text-[11px]">Clouds</span>
          </button>

          {/* Mumbai / Rain */}
          <button
            type="button"
            onClick={() => {
              setUserOverrideMode("rain");
              setSelectedVideoId("mumbai-rain");
              setCustomVideoUrl(null);
            }}
            className={cn(
              "px-2 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
              (selectedVideoId === "mumbai-rain" || (!selectedVideoId && activeMode === "rain"))
                ? isDarkMode
                  ? "bg-blue-500/25 text-blue-300 border border-blue-400/50"
                  : "bg-blue-700 text-white"
                : "opacity-70 hover:opacity-100 hover:bg-current/10"
            )}
            title="Monsoon Rain (Mumbai: 188021)"
          >
            <CloudRain className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden lg:inline text-[11px]">Rain</span>
          </button>

          {/* Kerala / Thunderstorm */}
          <button
            type="button"
            onClick={() => {
              setUserOverrideMode("thunderstorm");
              setSelectedVideoId("kerala-thunderstorm");
              setCustomVideoUrl(null);
            }}
            className={cn(
              "px-2 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
              (selectedVideoId === "kerala-thunderstorm" || (!selectedVideoId && activeMode === "thunderstorm"))
                ? isDarkMode
                  ? "bg-purple-500/25 text-purple-300 border border-purple-400/50"
                  : "bg-purple-700 text-white"
                : "opacity-70 hover:opacity-100 hover:bg-current/10"
            )}
            title="Thunderstorm (Kerala: 11025478)"
          >
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden lg:inline text-[11px]">Storm</span>
          </button>

          {/* Chennai / Heat */}
          <button
            type="button"
            onClick={() => {
              setUserOverrideMode("heat");
              setSelectedVideoId("chennai-heat");
              setCustomVideoUrl(null);
            }}
            className={cn(
              "px-2 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
              (selectedVideoId === "chennai-heat" || (!selectedVideoId && activeMode === "heat"))
                ? isDarkMode
                  ? "bg-amber-500/25 text-amber-300 border border-amber-400/50"
                  : "bg-amber-600 text-white"
                : "opacity-70 hover:opacity-100 hover:bg-current/10"
            )}
            title="Blazing Heat (Chennai: 17311357)"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline text-[11px]">Heat</span>
          </button>

          {/* Reset to city default */}
          {(userOverrideMode !== null || selectedVideoId !== null || customVideoUrl !== null) && (
            <button
              type="button"
              onClick={() => {
                setUserOverrideMode(null);
                setSelectedVideoId(null);
                setCustomVideoUrl(null);
              }}
              className={cn(
                "p-1.5 rounded-lg text-[10px] font-mono flex items-center transition-all cursor-pointer opacity-70 hover:opacity-100 hover:bg-current/10"
              )}
              title="Reset to City Preset"
            >
              <RefreshCw className="w-3 h-3 text-cyan-400" />
            </button>
          )}

          {/* Settings & Tuning Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowControls(!showControls)}
            className={cn(
              "p-1.5 rounded-lg text-[10px] font-mono flex items-center transition-all cursor-pointer",
              showControls
                ? isDarkMode
                  ? "bg-cyan-900/60 text-cyan-300"
                  : "bg-teal-100 text-teal-800"
                : "opacity-70 hover:opacity-100 hover:bg-current/10"
            )}
            title="Video & Atmospheric Parameter Controls"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. EXPANDABLE VIDEO & ATMOSPHERE PARAMETER TUNING DRAWER                   */}
      {/* ========================================================================= */}
      {showControls && (
        <div
          className={cn(
            "absolute top-16 right-3 z-30 pointer-events-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-xl w-80 sm:w-96 transition-all max-h-[85vh] overflow-y-auto space-y-4",
            isDarkMode
              ? "bg-slate-950/95 border-slate-700 text-slate-100"
              : "bg-white/95 border-slate-200 text-slate-900"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-current/10">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold font-mono uppercase tracking-wide">
                Atmospheric Video Engine
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/20 text-cyan-400 uppercase font-bold">
              {renderMode}
            </span>
          </div>

          {/* 5-Video Tray Switcher */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono font-bold">Uploaded Background Videos (5)</span>
              <span className="text-[10px] opacity-60 font-mono">Pexels / Pixabay</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {ATMOSPHERE_VIDEOS.map((vid) => {
                const isSelected = selectedVideoId === vid.id || (!selectedVideoId && activeVideo.id === vid.id && !customVideoUrl);
                return (
                  <button
                    key={vid.id}
                    type="button"
                    onClick={() => {
                      setSelectedVideoId(vid.id);
                      setUserOverrideMode(vid.category);
                      setCustomVideoUrl(null);
                      setRenderMode("video");
                      setHasVideoError(false);
                    }}
                    className={cn(
                      "p-2 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between gap-2",
                      isSelected
                        ? isDarkMode
                          ? "bg-cyan-950/60 border-cyan-400 text-cyan-200 shadow-sm"
                          : "bg-teal-50 border-teal-600 text-teal-950 shadow-sm"
                        : "border-current/10 hover:bg-current/5 opacity-80"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate">{vid.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono uppercase bg-current/10 text-cyan-400">
                          {vid.tag}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono opacity-65 truncate mt-0.5">
                        {vid.filename}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Video Uploader */}
          <div className="p-2.5 rounded-xl border border-dashed border-current/20 bg-current/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                Custom Video Source
              </span>
              {customVideoUrl && (
                <button
                  type="button"
                  onClick={() => setCustomVideoUrl(null)}
                  className="text-[10px] font-mono text-rose-400 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {customVideoUrl ? (
              <div className="text-[11px] font-mono text-emerald-400 truncate">
                Active: {customVideoName || "Custom Blob Video"}
              </div>
            ) : (
              <p className="text-[10px] opacity-70 leading-tight">
                Upload your own MP4 video to set as the live background for {location.name}.
              </p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-1 text-xs font-mono rounded-lg border border-current/20 hover:bg-current/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3 h-3" />
              <span>Choose MP4 File...</span>
            </button>
          </div>

          {/* Video Controls: Opacity & Speed */}
          {renderMode !== "shader" && (
            <div className="space-y-3 pt-2 border-t border-current/10">
              <div>
                <div className="flex justify-between mb-1 font-mono text-[11px]">
                  <span>Video Layer Opacity</span>
                  <span className="font-bold text-cyan-400">{(videoOpacity * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={videoOpacity}
                  onChange={(e) => setVideoOpacity(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1 font-mono text-[11px]">
                  <span>Playback Speed</span>
                  <span className="font-bold text-cyan-400">{videoSpeed}x</span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {[0.5, 0.75, 1.0, 1.25, 1.5].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setVideoSpeed(spd)}
                      className={cn(
                        "py-1 text-[10px] font-mono rounded transition-all cursor-pointer border",
                        videoSpeed === spd
                          ? "bg-cyan-500 text-slate-950 font-bold border-cyan-400"
                          : "border-current/10 hover:bg-current/10 opacity-70"
                      )}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Shader & FX Tuning Parameters */}
          {(renderMode === "shader" || renderMode === "hybrid") && (
            <div className="space-y-3 pt-2 border-t border-current/10">
              <div className="text-xs font-mono font-bold text-amber-400">
                Procedural Overlay Tuning ({activeMode})
              </div>

              {(activeMode === "heat" || activeMode === "dizzy") && (
                <div>
                  <div className="flex justify-between mb-1 font-mono text-[11px]">
                    <span>Mirage Dizziness Intensity</span>
                    <span className="font-bold text-amber-400">{(dizzinessLevel * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="2.2"
                    step="0.1"
                    value={dizzinessLevel}
                    onChange={(e) => setDizzinessLevel(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              )}

              {activeMode === "rain" && (
                <div>
                  <div className="font-mono text-[11px] mb-1">Downpour Intensity</div>
                  <div className="grid grid-cols-4 gap-1">
                    {(["light", "moderate", "heavy", "torrential"] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setRainIntensity(lvl)}
                        className={cn(
                          "py-1 text-[10px] font-mono rounded capitalize transition-all cursor-pointer border",
                          rainIntensity === lvl
                            ? "bg-blue-600 text-white border-blue-500 font-bold"
                            : "border-current/10 hover:bg-current/10 opacity-70"
                        )}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeMode === "thunderstorm" && (
                <div>
                  <div className="font-mono text-[11px] mb-1">Lightning Frequency</div>
                  <div className="grid grid-cols-3 gap-1">
                    {(["low", "medium", "high"] as const).map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setLightningFreq(freq)}
                        className={cn(
                          "py-1 text-[10px] font-mono rounded capitalize transition-all cursor-pointer border",
                          lightningFreq === freq
                            ? "bg-purple-600 text-white border-purple-500 font-bold"
                            : "border-current/10 hover:bg-current/10 opacity-70"
                        )}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reset All Button */}
          <button
            type="button"
            onClick={() => {
              setRenderMode("video");
              setSelectedVideoId(null);
              setCustomVideoUrl(null);
              setUserOverrideMode(null);
              setVideoOpacity(0.85);
              setVideoSpeed(1.0);
              setDizzinessLevel(1.2);
              setRainIntensity("heavy");
              setLightningFreq("medium");
            }}
            className="w-full py-1.5 rounded-xl border border-current/15 hover:bg-current/10 text-xs font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer opacity-75 hover:opacity-100"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Atmospheric Defaults</span>
          </button>
        </div>
      )}
    </div>
  );
};
