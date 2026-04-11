import React from 'react';
import type { PolygonPrimitive } from './types';

interface PolygonPrimitivesLayerProps {
  polygons: PolygonPrimitive[];
}

export function PolygonPrimitivesLayer({ polygons }: PolygonPrimitivesLayerProps): React.ReactElement | null {
  if (polygons.length === 0) {
    return null;
  }

  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
      {polygons.map((polygon, index) => (
        <polygon
          key={index}
          points={polygon.points.map((point) => `${point.x},${point.y}`).join(' ')}
          stroke={polygon.stroke ?? '#ffffff'}
          fill={polygon.fill ?? 'transparent'}
          strokeWidth={polygon.strokeWidth ?? 1}
          opacity={polygon.opacity ?? 1}
        />
      ))}
    </svg>
  );
}
