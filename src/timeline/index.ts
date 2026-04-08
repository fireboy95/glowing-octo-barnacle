import {
  type NormalizePose3DOptions,
  type NormalizedPose3D,
  type Pose3DInput,
  normalizePose3d,
} from '../renderer/normalizePose3d';

export { type EasingFunction, interpolateNormalizedTimelinePose, slerpQuaternion } from './interpolate';

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
