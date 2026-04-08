import {
  type NormalizePose3DOptions,
  type NormalizedPose3D,
  type Pose3DInput,
  normalizePose3d,
} from './normalizePose3d';

export interface RendererFrameInput {
  pose: Pose3DInput;
}

export interface RendererFrame {
  pose: NormalizedPose3D;
}

/**
 * Renderer entrypoint. It always returns a normalized pose so downstream rendering
 * and interpolation never consume mixed rotation representations.
 */
export function buildRendererFrame(
  input: RendererFrameInput,
  options: NormalizePose3DOptions = {},
): RendererFrame {
  return {
    pose: normalizePose3d(input.pose, options),
  };
}

/**
 * Explicit narrow entrypoint for renderer internals that require already normalized data.
 */
export function renderNormalizedPose(pose: NormalizedPose3D): NormalizedPose3D {
  return pose;
}
