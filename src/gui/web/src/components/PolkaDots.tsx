import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface Dot {
  x: number;
  y: number;
  size: number;
  opacity: number;
  // Animation properties for liquid flow
  floatX: number;
  floatY: number;
  duration: number;
  delay: number;
  pulseDuration: number;
  pulseDelay: number;
}

export function PolkaDots() {
  const { state } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dots, setDots] = useState<Dot[]>([]);

  // Slides where polka dots should be visible
  const visibleSlides = ['welcome', 'signin', 'onboarding', 'drop', 'complete'];
  const isVisible = visibleSlides.includes(state.currentSlide);

  useEffect(() => {
    const config = {
      count: 20,
      minSize: 60,
      maxSize: 400,
      minOpacity: 0.03,
      maxOpacity: 0.07,
      centerX: 50,
      centerY: 50,
      minRadius: 25,
      maxRadius: 55,
      padding: 10,
      // Animation config - parallax style (glacial, ambient drift)
      // Smaller dots (far) = extremely slow, larger dots (close) = slightly faster
      farDuration: 240,    // Small dots: 4 minutes per cycle
      closeDuration: 120,  // Large dots: 2 minutes per cycle
      farFloatDistance: 5,    // Small dots drift barely at all
      closeFloatDistance: 18, // Large dots drift gently
    };

    const placedDots: Dot[] = [];

    const checkOverlap = (x: number, y: number, size: number): boolean => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const newX = (x / 100) * viewportWidth;
      const newY = (y / 100) * viewportHeight;
      const newRadius = size / 2;

      for (const dot of placedDots) {
        const existingX = (dot.x / 100) * viewportWidth;
        const existingY = (dot.y / 100) * viewportHeight;
        const existingRadius = dot.size / 2;

        const distance = Math.sqrt(
          Math.pow(newX - existingX, 2) + Math.pow(newY - existingY, 2)
        );

        const minDistance = newRadius + existingRadius + config.padding;

        if (distance < minDistance) {
          return true;
        }
      }
      return false;
    };

    // Generate random float direction (positive or negative)
    const randomSign = () => (Math.random() > 0.5 ? 1 : -1);

    let attempts = 0;
    const maxAttempts = 500;

    while (placedDots.length < config.count && attempts < maxAttempts) {
      attempts++;

      const angle = Math.random() * Math.PI * 2;
      const radius = config.minRadius + Math.random() * (config.maxRadius - config.minRadius);
      const x = config.centerX + Math.cos(angle) * radius;
      const y = config.centerY + Math.sin(angle) * radius;

      const size = config.minSize + Math.random() * (config.maxSize - config.minSize);

      if (checkOverlap(x, y, size)) {
        continue;
      }

      const opacity = config.minOpacity + Math.random() * (config.maxOpacity - config.minOpacity);

      // Parallax: sizeRatio 0 = small (far), 1 = large (close)
      const sizeRatio = (size - config.minSize) / (config.maxSize - config.minSize);
      
      // Duration: small dots = slow (high duration), large dots = faster (lower duration)
      // Interpolate from farDuration to closeDuration based on size
      const baseDuration = config.farDuration - sizeRatio * (config.farDuration - config.closeDuration);
      const duration = baseDuration + (Math.random() - 0.5) * 15; // Add some variance

      // Float distance: small dots drift less, large dots drift more (parallax)
      const baseFloatDistance = config.farFloatDistance + sizeRatio * (config.closeFloatDistance - config.farFloatDistance);
      const floatX = (baseFloatDistance + Math.random() * baseFloatDistance * 0.3) * randomSign();
      const floatY = (baseFloatDistance + Math.random() * baseFloatDistance * 0.3) * randomSign();

      // Stagger animation starts for organic feel
      const delay = Math.random() * -duration; // Negative delay starts animation mid-cycle

      // Pulse animation (very subtle, slow breathing)
      const pulseDuration = 15 + Math.random() * 20;
      const pulseDelay = Math.random() * -pulseDuration;

      placedDots.push({
        x,
        y,
        size,
        opacity,
        floatX,
        floatY,
        duration,
        delay,
        pulseDuration,
        pulseDelay,
      });
    }

    setDots(placedDots);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        'polka-dots',
        isVisible && 'visible'
      )}
    >
      {dots.map((dot, index) => (
        <div
          key={index}
          className="polka-dot bg-foreground"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: `${dot.size}px`,
            height: `${dot.size}px`,
            opacity: dot.opacity,
            // CSS custom properties for individual animation
            '--float-x': `${dot.floatX}px`,
            '--float-y': `${dot.floatY}px`,
            '--duration': `${dot.duration}s`,
            '--delay': `${dot.delay}s`,
            '--pulse-duration': `${dot.pulseDuration}s`,
            '--pulse-delay': `${dot.pulseDelay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

