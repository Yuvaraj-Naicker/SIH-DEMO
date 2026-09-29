import React, { useState, useEffect } from 'react';
import { LocationConfig, LocationId } from '../types';

interface FullPageAtmosphereVideoProps {
  location: LocationConfig;
  isDarkMode: boolean;
}

const PRIMARY_VIDEOS: Record<LocationId, string> = {
  puducherry: '/videos/puducherry-clouds.mp4',
  mumbai: '/videos/mumbai-rain.mp4',
  kerala: '/videos/kerala-thunderstorm.mp4',
  chennai: '/videos/chennai-heat.mp4',
};

const FALLBACK_VIDEOS: Record<LocationId, string> = {
  puducherry: '/videos/17499303-uhd_2560_1440_30fps.mp4',
  mumbai: '/videos/188021-881528788_medium.mp4',
  kerala: '/videos/11025478-hd_1920_1080_24fps.mp4',
  chennai: '/videos/17311357-uhd_3840_2160_30fps.mp4',
};

export const FullPageAtmosphereVideo: React.FC<FullPageAtmosphereVideoProps> = ({
  location,
  isDarkMode,
}) => {
  const locId = (location?.id as LocationId) || 'puducherry';
  const primarySrc = PRIMARY_VIDEOS[locId] || PRIMARY_VIDEOS.puducherry;
  const fallbackSrc = FALLBACK_VIDEOS[locId] || FALLBACK_VIDEOS.puducherry;

  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [locId]);

  const activeSrc = hasError ? fallbackSrc : primarySrc;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 w-full h-full -z-20 overflow-hidden pointer-events-none select-none"
    >
      {/* Full-Page Background Video */}
      <video
        key={activeSrc}
        src={activeSrc}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onError={() => {
          if (!hasError) {
            setHasError(true);
          }
        }}
        className="w-full h-full object-cover transition-opacity duration-700"
      />

      {/* Crystal Clear Ambient Layer — True black tint in dark mode */}
      <div
        className={`absolute inset-0 transition-colors duration-500 pointer-events-none ${
          isDarkMode
            ? 'bg-black/40'
            : 'bg-white/15'
        }`}
      />
    </div>
  );
};
