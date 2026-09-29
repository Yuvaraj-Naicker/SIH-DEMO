import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { ArrowDown } from 'lucide-react';

export interface ScrollExpandProps {
  /** Optional source URL of media (image or video). If omitted, component acts as block expansion wrapper */
  src?: string;
  alt?: string;
  poster?: string;
  title?: React.ReactNode | string;
  scrollHint?: string;
  useWindowScroll?: boolean;
  mediaZoom?: number;
  startWidth?: number;
  endWidth?: number;
  startHeight?: number;
  startRadius?: number;
  endRadius?: number;
  startScale?: number;
  endScale?: number;
  scrollDistance?: number;
  overlayScrim?: number;
  mediaType?: 'image' | 'video' | 'auto';
  contained?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ScrollExpand: React.FC<ScrollExpandProps> = ({
  src,
  alt = 'Showcase block',
  poster,
  title,
  scrollHint = 'Scroll',
  useWindowScroll = true,
  mediaZoom = 1.35,
  startWidth = 84,
  endWidth = 100,
  startHeight = 62,
  startRadius = 28,
  endRadius = 16,
  startScale = 0.94,
  endScale = 1.0,
  scrollDistance = 1.25,
  overlayScrim = 0.45,
  mediaType = 'auto',
  contained = false,
  children,
  className = '',
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMediaVideo, setIsMediaVideo] = useState<boolean>(false);
  const [isContained, setIsContained] = useState<boolean>(
    contained || Boolean(style?.height) || !useWindowScroll
  );

  // If no media src is provided, behave as a smooth scroll-expand block wrapper
  // Animates the frame expanding to full width and soft corners as it is scrolled into view
  if (!src) {
    const { scrollYProgress } = useScroll({
      target: containerRef,
      offset: ['start 96%', 'center 48%'],
    });

    const smoothProgress = useSpring(scrollYProgress, {
      stiffness: 140,
      damping: 24,
      restDelta: 0.001,
    });

    const widthStr = useTransform(smoothProgress, [0, 1], [`${startWidth}%`, `${endWidth}%`]);
    const borderRadius = useTransform(smoothProgress, [0, 1], [startRadius, endRadius]);
    const scale = useTransform(smoothProgress, [0, 1], [startScale, endScale]);
    const opacity = useTransform(smoothProgress, [0, 0.3, 1], [0.88, 0.98, 1]);

    return (
      <div
        ref={containerRef}
        style={style}
        className={`w-full flex justify-center py-2 sm:py-3 ${className}`}
      >
        <motion.div
          style={{
            width: widthStr,
            borderRadius,
            scale,
            opacity,
          }}
          className="w-full origin-center transition-all duration-75 overflow-hidden"
        >
          {children}
        </motion.div>
      </div>
    );
  }

  // Media handling when src is present
  useEffect(() => {
    if (mediaType === 'video') {
      setIsMediaVideo(true);
      return;
    }
    if (mediaType === 'image') {
      setIsMediaVideo(false);
      return;
    }
    if (src) {
      const cleanSrc = src.split('?')[0].toLowerCase();
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
      setIsMediaVideo(videoExtensions.some((ext) => cleanSrc.endsWith(ext)));
    }
  }, [src, mediaType]);

  useEffect(() => {
    if (contained || Boolean(style?.height) || !useWindowScroll) {
      setIsContained(true);
      return;
    }
    if (containerRef.current?.parentElement) {
      const parentStyleHeight = containerRef.current.parentElement.style.height;
      if (parentStyleHeight && parentStyleHeight !== 'auto') {
        setIsContained(true);
      }
    }
  }, [contained, style, useWindowScroll]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: isContained
      ? ['start 90%', 'center center']
      : ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 24,
    restDelta: 0.001,
  });

  const widthStr = useTransform(smoothProgress, [0, 0.7], [`${startWidth}%`, `${endWidth}%`]);
  const heightStr = useTransform(smoothProgress, [0, 0.7], [`${startHeight}%`, '100%']);
  const borderRadius = useTransform(smoothProgress, [0, 0.7], [startRadius, endRadius]);
  const mediaScale = useTransform(smoothProgress, [0, 0.7], [mediaZoom, 1]);

  const hintOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0]);
  const hintTranslateY = useTransform(smoothProgress, [0, 0.15], [0, 8]);

  const titleOpacity = useTransform(smoothProgress, [0, 0.35], [1, 0]);
  const titleScale = useTransform(smoothProgress, [0, 0.35], [1, 0.94]);

  const childrenOpacity = useTransform(smoothProgress, [0.35, 0.7], [0, 1]);
  const childrenTranslateY = useTransform(smoothProgress, [0.35, 0.7], [20, 0]);

  const scrimOpacity = useTransform(smoothProgress, [0.2, 0.65], [0.15, overlayScrim]);

  if (isContained) {
    return (
      <div
        ref={containerRef}
        style={style}
        className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden ${className}`}
      >
        <motion.div
          style={{
            width: widthStr,
            height: heightStr,
            borderRadius,
          }}
          className="relative max-w-7xl mx-auto overflow-hidden shadow-2xl border border-white/20 bg-slate-950/80 flex items-center justify-center transition-shadow duration-300"
        >
          <motion.div
            style={{ scale: mediaScale }}
            className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden pointer-events-none select-none"
          >
            {isMediaVideo ? (
              <video
                src={src}
                poster={poster}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={src}
                alt={alt}
                className="w-full h-full object-cover"
                loading="eager"
              />
            )}
          </motion.div>

          <motion.div
            style={{ opacity: scrimOpacity }}
            className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none"
          />

          {title && (
            <motion.div
              style={{ opacity: titleOpacity, scale: titleScale }}
              className="absolute z-10 text-center px-4 pointer-events-none select-none"
            >
              {typeof title === 'string' ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/75 text-white font-semibold text-sm sm:text-base border border-white/20 backdrop-blur-md shadow-xl">
                  <span>{title}</span>
                </div>
              ) : (
                title
              )}
            </motion.div>
          )}

          {children && (
            <motion.div
              style={{
                opacity: childrenOpacity,
                translateY: childrenTranslateY,
              }}
              className="relative z-20 w-full h-full flex flex-col items-center justify-center p-6 text-center text-white"
            >
              {children}
            </motion.div>
          )}
        </motion.div>

        {scrollHint && (
          <motion.div
            style={{ opacity: hintOpacity, translateY: hintTranslateY }}
            className="absolute bottom-4 flex flex-col items-center gap-1 text-xs font-mono tracking-wider uppercase text-slate-300 pointer-events-none select-none"
          >
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900/70 backdrop-blur-xs border border-white/10">
              {scrollHint}
            </span>
            <ArrowDown className="w-3.5 h-3.5 text-[#007D73] animate-bounce" />
          </motion.div>
        )}
      </div>
    );
  }

  const trackHeight = `${Math.max(130, Math.round(scrollDistance * 140))}vh`;

  return (
    <div
      ref={containerRef}
      style={{ minHeight: trackHeight, ...style }}
      className={`relative w-full ${className}`}
    >
      <div className="sticky top-24 sm:top-28 h-[74vh] sm:h-[80vh] max-h-[820px] w-full flex flex-col items-center justify-center px-3 sm:px-6 overflow-hidden">
        <motion.div
          style={{
            width: widthStr,
            height: heightStr,
            borderRadius,
          }}
          className="relative max-w-7xl mx-auto overflow-hidden shadow-2xl border border-white/20 bg-slate-950/90 flex items-center justify-center transition-shadow duration-300"
        >
          <motion.div
            style={{ scale: mediaScale }}
            className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden pointer-events-none select-none"
          >
            {isMediaVideo ? (
              <video
                src={src}
                poster={poster}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={src}
                alt={alt}
                className="w-full h-full object-cover"
                loading="eager"
              />
            )}
          </motion.div>

          <motion.div
            style={{ opacity: scrimOpacity }}
            className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-slate-950/20 pointer-events-none"
          />

          {title && (
            <motion.div
              style={{ opacity: titleOpacity, scale: titleScale }}
              className="absolute z-10 text-center px-4 pointer-events-none select-none"
            >
              {typeof title === 'string' ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/75 text-white font-semibold text-sm sm:text-base border border-white/20 backdrop-blur-md shadow-xl">
                  <span>{title}</span>
                </div>
              ) : (
                title
              )}
            </motion.div>
          )}

          {children && (
            <motion.div
              style={{
                opacity: childrenOpacity,
                translateY: childrenTranslateY,
              }}
              className="relative z-20 w-full h-full flex flex-col items-center justify-center p-6 sm:p-12 text-center text-white"
            >
              {children}
            </motion.div>
          )}
        </motion.div>

        {scrollHint && (
          <motion.div
            style={{ opacity: hintOpacity, translateY: hintTranslateY }}
            className="mt-4 flex flex-col items-center gap-1.5 text-xs font-mono font-medium tracking-widest uppercase text-slate-300 drop-shadow-md pointer-events-none select-none"
          >
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900/70 backdrop-blur-xs border border-white/10">
              {scrollHint}
            </span>
            <ArrowDown className="w-3.5 h-3.5 text-[#007D73] animate-bounce" />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ScrollExpand;
