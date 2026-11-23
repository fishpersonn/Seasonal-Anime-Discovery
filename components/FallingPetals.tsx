import React, { useMemo } from 'react';

const SYMBOLS = ['❄', '✿', '❀', '✦', '❅', '♡'];

// Decorative falling snow / sakura petals. Pure CSS animation (see index.html).
const FallingPetals: React.FC<{ count?: number }> = ({ count = 22 }) => {
  const petals = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        symbol: SYMBOLS[i % SYMBOLS.length],
        left: Math.random() * 100,
        size: 10 + Math.random() * 14,
        duration: 12 + Math.random() * 14,
        delay: -Math.random() * 20,
        drift: (Math.random() - 0.5) * 120,
        pink: i % 2 === 0,
      })),
    [count]
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
      {petals.map(p => (
        <span
          key={p.id}
          className="petal"
          style={
            {
              left: `${p.left}%`,
              fontSize: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              color: p.pink ? '#ffb3d9' : '#bfe7ff',
              '--drift': `${p.drift}px`,
            } as React.CSSProperties
          }
        >
          {p.symbol}
        </span>
      ))}
    </div>
  );
};

export default FallingPetals;
