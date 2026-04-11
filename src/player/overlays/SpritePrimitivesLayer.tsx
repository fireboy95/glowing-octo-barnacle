import React from 'react';
import type { SpritePrimitive } from './types';

interface SpritePrimitivesLayerProps {
  sprites: SpritePrimitive[];
}

export function SpritePrimitivesLayer({ sprites }: SpritePrimitivesLayerProps): React.ReactElement | null {
  if (sprites.length === 0) {
    return null;
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {sprites.map((sprite, index) => {
        const scale = sprite.scale ?? 1;
        const rotation = sprite.rotationDeg ?? 0;
        return (
          <img
            key={`${sprite.src}-${index}`}
            src={sprite.src}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: `${sprite.x}%`,
              top: `${sprite.y}%`,
              width: `${sprite.width}px`,
              height: `${sprite.height}px`,
              transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
              transformOrigin: 'center',
              opacity: sprite.opacity ?? 1,
            }}
          />
        );
      })}
    </div>
  );
}
