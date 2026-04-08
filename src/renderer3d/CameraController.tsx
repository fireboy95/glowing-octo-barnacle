import React from 'react';
import type { Vector3 } from './SkeletonScene';

export type CameraPreset = 'front' | 'side' | 'top' | 'orbit';

export interface CameraState {
  position: Vector3;
  target: Vector3;
  up: Vector3;
}

export interface CameraControllerProps {
  preset: CameraPreset;
  orbitAngleRad?: number;
  orbitRadius?: number;
  target?: Vector3;
  onCameraState?: (state: CameraState) => void;
}

const DEFAULT_TARGET: Vector3 = { x: 0, y: 1, z: 0 };
const DEFAULT_UP: Vector3 = { x: 0, y: 1, z: 0 };

export function resolveCameraState(
  preset: CameraPreset,
  options: Pick<CameraControllerProps, 'orbitAngleRad' | 'orbitRadius' | 'target'> = {},
): CameraState {
  const target = options.target ?? DEFAULT_TARGET;

  if (preset === 'front') {
    return { position: { x: 0, y: 1.2, z: 3 }, target, up: DEFAULT_UP };
  }

  if (preset === 'side') {
    return { position: { x: 3, y: 1.2, z: 0 }, target, up: DEFAULT_UP };
  }

  if (preset === 'top') {
    return { position: { x: 0, y: 4, z: 0.001 }, target, up: { x: 0, y: 0, z: -1 } };
  }

  const orbitAngle = options.orbitAngleRad ?? 0;
  const orbitRadius = options.orbitRadius ?? 3;
  return {
    position: {
      x: Math.cos(orbitAngle) * orbitRadius,
      y: 1.2,
      z: Math.sin(orbitAngle) * orbitRadius,
    },
    target,
    up: DEFAULT_UP,
  };
}

/**
 * Headless camera controller that emits camera updates for the active preset.
 */
export function CameraController(props: CameraControllerProps): null {
  const cameraState = React.useMemo(
    () =>
      resolveCameraState(props.preset, {
        orbitAngleRad: props.orbitAngleRad,
        orbitRadius: props.orbitRadius,
        target: props.target,
      }),
    [props.preset, props.orbitAngleRad, props.orbitRadius, props.target],
  );

  React.useEffect(() => {
    props.onCameraState?.(cameraState);
  }, [cameraState, props]);

  return null;
}
