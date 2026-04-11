import React from 'react';
import type { CameraCue } from './PlaybackBridge';
import type { Vector3 } from './SkeletonScene';

export type CameraPreset = 'front' | 'side' | 'top' | 'orbit';
export type CameraEasing = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

export interface CameraState {
  position: Vector3;
  target: Vector3;
  up: Vector3;
  fovDeg: number;
}

export interface CameraDirectiveBase {
  easing?: CameraEasing;
}

export interface CameraLookAtDirective extends CameraDirectiveBase {
  type: 'lookAt';
  target: Vector3;
}

export interface CameraPositionDirective extends CameraDirectiveBase {
  type: 'position';
  position: Vector3;
}

export interface CameraYawPitchRollDirective extends CameraDirectiveBase {
  type: 'yaw/pitch/roll';
  yawRad: number;
  pitchRad: number;
  rollRad: number;
}

export interface CameraOrbitDirective extends CameraDirectiveBase {
  type: 'orbit';
  angleRad: number;
  radius?: number;
  height?: number;
  target?: Vector3;
}

export interface CameraDollyDirective extends CameraDirectiveBase {
  type: 'dolly';
  amount: number;
}

export interface CameraPanToDirective extends CameraDirectiveBase {
  type: 'panTo';
  target: Vector3;
}

export interface CameraFovDirective extends CameraDirectiveBase {
  type: 'fov';
  fovDeg: number;
}

export type CameraDirective =
  | CameraLookAtDirective
  | CameraPositionDirective
  | CameraYawPitchRollDirective
  | CameraOrbitDirective
  | CameraDollyDirective
  | CameraPanToDirective
  | CameraFovDirective;

export interface CameraControllerProps {
  preset: CameraPreset;
  orbitAngleRad?: number;
  orbitRadius?: number;
  target?: Vector3;
  playbackTimeMs?: number;
  cameraCue?: CameraCue | null;
  nextCameraCue?: CameraCue | null;
  onCameraState?: (state: CameraState) => void;
}

interface CameraResolutionOptions extends Pick<CameraControllerProps, 'orbitAngleRad' | 'orbitRadius' | 'target'> {
  playbackTimeMs?: number;
  cameraCue?: CameraCue | null;
  nextCameraCue?: CameraCue | null;
}

const DEFAULT_TARGET: Vector3 = { x: 0, y: 1, z: 0 };
const DEFAULT_UP: Vector3 = { x: 0, y: 1, z: 0 };
const DEFAULT_FOV_DEG = 50;

export function lerpPosition(from: Vector3, to: Vector3, alpha: number): Vector3 {
  return {
    x: from.x + (to.x - from.x) * alpha,
    y: from.y + (to.y - from.y) * alpha,
    z: from.z + (to.z - from.z) * alpha,
  };
}

export function interpolateAngle(fromRad: number, toRad: number, alpha: number): number {
  const fullTurn = Math.PI * 2;
  const shortestSigned = ((toRad - fromRad + Math.PI) % fullTurn) - Math.PI;
  return fromRad + shortestSigned * alpha;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function applyEasing(alpha: number, easing: CameraEasing): number {
  const x = clamp01(alpha);
  if (easing === 'easeIn') {
    return x * x;
  }

  if (easing === 'easeOut') {
    return 1 - (1 - x) * (1 - x);
  }

  if (easing === 'easeInOut') {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  }

  return x;
}

function buildPresetCameraState(
  preset: CameraPreset,
  options: Pick<CameraControllerProps, 'orbitAngleRad' | 'orbitRadius' | 'target'>,
): CameraState {
  const target = options.target ?? DEFAULT_TARGET;

  if (preset === 'front') {
    return { position: { x: 0, y: 1.2, z: 3 }, target, up: DEFAULT_UP, fovDeg: DEFAULT_FOV_DEG };
  }

  if (preset === 'side') {
    return { position: { x: 3, y: 1.2, z: 0 }, target, up: DEFAULT_UP, fovDeg: DEFAULT_FOV_DEG };
  }

  if (preset === 'top') {
    return { position: { x: 0, y: 4, z: 0.001 }, target, up: { x: 0, y: 0, z: -1 }, fovDeg: DEFAULT_FOV_DEG };
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
    fovDeg: DEFAULT_FOV_DEG,
  };
}

function deriveForwardFromAngles(yawRad: number, pitchRad: number): Vector3 {
  const cosPitch = Math.cos(pitchRad);
  return {
    x: Math.sin(yawRad) * cosPitch,
    y: Math.sin(pitchRad),
    z: Math.cos(yawRad) * cosPitch,
  };
}

function deriveUpFromRoll(rollRad: number): Vector3 {
  return {
    x: Math.sin(rollRad),
    y: Math.cos(rollRad),
    z: 0,
  };
}

export function applyCameraDirective(base: CameraState, directive: CameraDirective): CameraState {
  if (directive.type === 'lookAt' || directive.type === 'panTo') {
    return {
      ...base,
      target: directive.target,
    };
  }

  if (directive.type === 'position') {
    return {
      ...base,
      position: directive.position,
    };
  }

  if (directive.type === 'yaw/pitch/roll') {
    const forward = deriveForwardFromAngles(directive.yawRad, directive.pitchRad);
    return {
      position: base.position,
      target: {
        x: base.position.x + forward.x,
        y: base.position.y + forward.y,
        z: base.position.z + forward.z,
      },
      up: deriveUpFromRoll(directive.rollRad),
      fovDeg: base.fovDeg,
    };
  }

  if (directive.type === 'orbit') {
    const orbitTarget = directive.target ?? base.target;
    const radius = directive.radius ?? 3;
    const height = directive.height ?? base.position.y;
    return {
      position: {
        x: orbitTarget.x + Math.cos(directive.angleRad) * radius,
        y: height,
        z: orbitTarget.z + Math.sin(directive.angleRad) * radius,
      },
      target: orbitTarget,
      up: base.up,
      fovDeg: base.fovDeg,
    };
  }

  if (directive.type === 'fov') {
    return {
      ...base,
      fovDeg: directive.fovDeg,
    };
  }

  const toTarget = {
    x: base.target.x - base.position.x,
    y: base.target.y - base.position.y,
    z: base.target.z - base.position.z,
  };
  const length = Math.hypot(toTarget.x, toTarget.y, toTarget.z) || 1;
  const nextLength = Math.max(0.01, length + directive.amount);
  const scale = nextLength / length;
  return {
    ...base,
    position: {
      x: base.target.x - toTarget.x * scale,
      y: base.target.y - toTarget.y * scale,
      z: base.target.z - toTarget.z * scale,
    },
  };
}

function interpolateCameraStates(from: CameraState, to: CameraState, alpha: number): CameraState {
  return {
    position: lerpPosition(from.position, to.position, alpha),
    target: lerpPosition(from.target, to.target, alpha),
    up: {
      x: interpolateAngle(from.up.x, to.up.x, alpha),
      y: interpolateAngle(from.up.y, to.up.y, alpha),
      z: interpolateAngle(from.up.z, to.up.z, alpha),
    },
    fovDeg: from.fovDeg + (to.fovDeg - from.fovDeg) * alpha,
  };
}

function resolveCueCameraState(base: CameraState, cue: CameraCue): CameraState {
  return cue.directives.reduce((state, directive) => applyCameraDirective(state, directive), base);
}

export function resolveCameraState(preset: CameraPreset, options: CameraResolutionOptions = {}): CameraState {
  const base = buildPresetCameraState(preset, options);
  const cue = options.cameraCue;
  if (!cue) {
    return base;
  }

  const fromState = resolveCueCameraState(base, cue);
  const nextCue = options.nextCameraCue;
  const playbackTimeMs = options.playbackTimeMs;

  if (!nextCue || playbackTimeMs === undefined || nextCue.timeMs <= cue.timeMs) {
    return fromState;
  }

  const rawAlpha = (playbackTimeMs - cue.timeMs) / (nextCue.timeMs - cue.timeMs);
  const easing = nextCue.directives.find((directive) => directive.easing)?.easing ?? 'linear';
  const easedAlpha = applyEasing(rawAlpha, easing);
  const toState = resolveCueCameraState(base, nextCue);

  return interpolateCameraStates(fromState, toState, easedAlpha);
}

/**
 * Headless camera controller that emits camera updates for preset/cue camera state.
 */
export function CameraController(props: CameraControllerProps): null {
  const cameraState = React.useMemo(
    () =>
      resolveCameraState(props.preset, {
        orbitAngleRad: props.orbitAngleRad,
        orbitRadius: props.orbitRadius,
        target: props.target,
        playbackTimeMs: props.playbackTimeMs,
        cameraCue: props.cameraCue,
        nextCameraCue: props.nextCameraCue,
      }),
    [
      props.preset,
      props.orbitAngleRad,
      props.orbitRadius,
      props.target,
      props.playbackTimeMs,
      props.cameraCue,
      props.nextCameraCue,
    ],
  );

  React.useEffect(() => {
    props.onCameraState?.(cameraState);
  }, [cameraState, props.onCameraState]);

  return null;
}
