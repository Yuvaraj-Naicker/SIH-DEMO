import React, { useRef, useEffect, useState, useImperativeHandle } from 'react';
import './GooeyNav.css';

export interface GooeyNavItem {
  id?: string;
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tag?: string;
  badge?: number;
}

export interface GooeyNavProps {
  items: GooeyNavItem[];
  animationTime?: number;
  particleCount?: number;
  particleDistances?: [number, number];
  particleR?: number;
  timeVariance?: number;
  colors?: number[];
  initialActiveIndex?: number;
  activeIndex?: number;
  onTabChange?: (index: number, item: GooeyNavItem) => void;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  onWheel?: (e: React.WheelEvent<HTMLDivElement>) => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
  isDarkMode?: boolean;
}

export const GooeyNav: React.FC<GooeyNavProps> = ({
  items,
  animationTime = 600,
  particleCount = 15,
  particleDistances = [90, 10],
  particleR = 100,
  timeVariance = 300,
  colors = [1, 2, 3, 1, 2, 3, 1, 4],
  initialActiveIndex = 0,
  activeIndex: controlledActiveIndex,
  onTabChange,
  onScroll,
  onWheel,
  scrollRef,
  className = '',
  isDarkMode = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const filterRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  // Link scrollRef if provided
  useEffect(() => {
    if (scrollRef && containerRef.current) {
      (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = containerRef.current;
    }
  }, [scrollRef]);

  const [internalActiveIndex, setInternalActiveIndex] = useState(initialActiveIndex);
  const activeIndex = controlledActiveIndex !== undefined ? controlledActiveIndex : internalActiveIndex;

  const noise = (n = 1) => n / 2 - Math.random() * n;

  const getXY = (distance: number, pointIndex: number, totalPoints: number): [number, number] => {
    const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
    return [distance * Math.cos(angle), distance * Math.sin(angle)];
  };

  const createParticle = (i: number, t: number, d: [number, number] | number[], r: number) => {
    const rotate = noise(r / 10);
    return {
      start: getXY(d[0], particleCount - i, particleCount),
      end: getXY(d[1] + noise(7), particleCount - i, particleCount),
      time: t,
      scale: 1 + noise(0.2),
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10,
    };
  };

  const makeParticles = (element: HTMLElement) => {
    const d = particleDistances;
    const r = particleR;
    const bubbleTime = animationTime * 2 + timeVariance;
    element.style.setProperty('--time', `${bubbleTime}ms`);

    for (let i = 0; i < particleCount; i++) {
      const t = animationTime * 2 + noise(timeVariance * 2);
      const p = createParticle(i, t, d, r);
      element.classList.remove('active');

      setTimeout(() => {
        const particle = document.createElement('span');
        const point = document.createElement('span');
        particle.classList.add('particle');
        particle.style.setProperty('--start-x', `${p.start[0]}px`);
        particle.style.setProperty('--start-y', `${p.start[1]}px`);
        particle.style.setProperty('--end-x', `${p.end[0]}px`);
        particle.style.setProperty('--end-y', `${p.end[1]}px`);
        particle.style.setProperty('--time', `${p.time}ms`);
        particle.style.setProperty('--scale', `${p.scale}`);
        particle.style.setProperty('--color', `var(--color-${p.color}, #c084fc)`);
        particle.style.setProperty('--rotate', `${p.rotate}deg`);

        point.classList.add('point');
        particle.appendChild(point);
        element.appendChild(particle);
        requestAnimationFrame(() => {
          element.classList.add('active');
        });
        setTimeout(() => {
          try {
            if (particle.parentElement === element) {
              element.removeChild(particle);
            }
          } catch {
            // Do nothing
          }
        }, t);
      }, 30);
    }
  };

  const updateEffectPosition = (element: HTMLElement) => {
    if (!containerRef.current || !filterRef.current || !textRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const pos = element.getBoundingClientRect();

    const styles = {
      left: `${pos.x - containerRect.x + containerRef.current.scrollLeft}px`,
      top: `${pos.y - containerRect.y}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`,
    };
    Object.assign(filterRef.current.style, styles);
    Object.assign(textRef.current.style, styles);
    textRef.current.innerText = element.innerText;
  };

  const handleClick = (e: React.MouseEvent<HTMLElement>, index: number) => {
    const target = e.currentTarget;
    const liEl = (target.tagName.toLowerCase() === 'li' ? target : target.closest('li')) as HTMLElement | null;
    if (!liEl) return;

    if (controlledActiveIndex === undefined) {
      setInternalActiveIndex(index);
    }

    if (onTabChange) {
      onTabChange(index, items[index]);
    }

    updateEffectPosition(liEl);

    if (filterRef.current) {
      const particles = filterRef.current.querySelectorAll('.particle');
      particles.forEach((p) => {
        try {
          filterRef.current?.removeChild(p);
        } catch {
          // Do nothing
        }
      });
    }

    if (textRef.current) {
      textRef.current.classList.remove('active');
      void textRef.current.offsetWidth;
      textRef.current.classList.add('active');
    }

    if (filterRef.current) {
      makeParticles(filterRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const liEl = (e.currentTarget.parentElement || e.currentTarget) as HTMLElement;
      if (liEl) {
        handleClick({ currentTarget: liEl } as unknown as React.MouseEvent<HTMLElement>, index);
      }
    }
  };

  // Sync position on activeIndex or resize
  useEffect(() => {
    if (!navRef.current || !containerRef.current) return;
    const activeLi = navRef.current.querySelectorAll('li')[activeIndex] as HTMLElement | undefined;
    if (activeLi) {
      updateEffectPosition(activeLi);
      textRef.current?.classList.add('active');
    }

    const resizeObserver = new ResizeObserver(() => {
      const currentActiveLi = navRef.current?.querySelectorAll('li')[activeIndex] as HTMLElement | undefined;
      if (currentActiveLi) {
        updateEffectPosition(currentActiveLi);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [activeIndex]);

  // Keep effect in sync when container is scrolled horizontally
  const handleScrollEvent = (e: React.UIEvent<HTMLDivElement>) => {
    if (navRef.current) {
      const activeLi = navRef.current.querySelectorAll('li')[activeIndex] as HTMLElement | undefined;
      if (activeLi) {
        updateEffectPosition(activeLi);
      }
    }
    if (onScroll) {
      onScroll(e);
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScrollEvent}
      onWheel={onWheel}
      className={`gooey-nav-container overflow-x-auto nav-scroll-container py-1 px-1 scroll-smooth ${className}`}
    >
      <nav aria-label="Dashboard navigation">
        <ul ref={navRef}>
          {items.map((item, index) => {
            const isActive = activeIndex === index;
            const Icon = item.icon;

            return (
              <li
                key={item.id || index}
                className={isActive ? 'active' : ''}
                onClick={(e) => handleClick(e, index)}
              >
                <button
                  type="button"
                  id={item.id ? `nav-tab-${item.id}` : undefined}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick(e, index);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className={`transition-all select-none border cursor-pointer ${
                    isActive
                      ? isDarkMode
                        ? 'bg-[#007D73]/25 text-[#2dd4bf] border-[#007D73] shadow-md shadow-[#007D73]/30 font-bold'
                        : 'bg-[#007D73]/15 text-[#00695f] border-[#007D73]/80 shadow-xs font-bold'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-900/60 border-transparent'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-white/80 border-transparent'
                  }`}
                >
                  {Icon && (
                    <Icon
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-colors ${
                        isActive
                          ? isDarkMode
                            ? 'text-[#2dd4bf] animate-pulse'
                            : 'text-[#007D73]'
                          : isDarkMode
                          ? 'text-slate-400'
                          : 'text-slate-500'
                      }`}
                    />
                  )}
                  <span>{item.label}</span>

                  {item.tag && (
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        item.tag === 'Critical'
                          ? 'bg-red-500 text-white'
                          : item.tag === 'High'
                          ? isDarkMode
                            ? 'bg-amber-950 text-amber-300 border border-amber-700'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                          : isDarkMode
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {item.tag}
                    </span>
                  )}

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-600 text-white shadow-xs">
                      {item.badge}
                    </span>
                  )}

                  {/* Active bottom accent line */}
                  {isActive && (
                    <span
                      className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${
                        isDarkMode
                          ? 'bg-gradient-to-r from-[#007D73] via-[#14b8a6] to-[#5eead4] shadow-sm shadow-[#007D73]/50'
                          : 'bg-gradient-to-r from-[#007D73] to-[#0d9488]'
                      }`}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <span className="effect filter" ref={filterRef} />
      <span className="effect text" ref={textRef} />
    </div>
  );
};

export default GooeyNav;
