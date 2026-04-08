import {
  type NormalizePose3DOptions,
  type NormalizedPose3D,
  type Pose3DInput,
  normalizePose3d,
} from '../renderer/normalizePose3d';

export interface TimelineKeyframeInput {
  timeMs: number;
  pose: Pose3DInput;
}

export interface TimelineKeyframe {
  timeMs: number;
  pose: NormalizedPose3D;
}

/**
 * Timeline entrypoint. Converts incoming pose data into canonical normalized format
 * for quaternion-safe interpolation.
 */
export function createTimelineKeyframe(
  input: TimelineKeyframeInput,
  options: NormalizePose3DOptions = {},
): TimelineKeyframe {
  return {
    timeMs: input.timeMs,
    pose: normalizePose3d(input.pose, options),
  };
}

/**
 * Timeline interpolation should only accept normalized poses.
 */
export function interpolateNormalizedTimelinePose(from: NormalizedPose3D, to: NormalizedPose3D, alpha: number): NormalizedPose3D {
  if (alpha <= 0) {
    return from;
  }

  if (alpha >= 1) {
    return to;
  }

  return alpha < 0.5 ? from : to;
}
