import {
  type TimelineKeyframe,
  createTimelineKeyframe,
  interpolateNormalizedTimelinePose,
} from '../timeline';
import type { NormalizePose3DOptions, Pose3DInput } from '../renderer/normalizePose3d';

export interface TimelineStateInput {
  currentTimeMs: number;
  isPlaying: boolean;
  keyframes: Array<{ timeMs: number; pose: Pose3DInput }>;
}

export interface TimelinePlaybackState {
  currentTimeMs: number;
  isPlaying: boolean;
  keyframes: TimelineKeyframe[];
}

export function createPlaybackBridgeState(
  input: TimelineStateInput,
  options: NormalizePose3DOptions = {},
): TimelinePlaybackState {
  return {
    currentTimeMs: input.currentTimeMs,
    isPlaying: input.isPlaying,
    keyframes: input.keyframes
      .map((frame) => createTimelineKeyframe(frame, options))
      .sort((a, b) => a.timeMs - b.timeMs),
  };
}

export function resolvePlaybackPose(state: TimelinePlaybackState): TimelineKeyframe['pose'] | null {
  if (state.keyframes.length === 0) {
    return null;
  }

  if (state.keyframes.length === 1 || state.currentTimeMs <= state.keyframes[0].timeMs) {
    return state.keyframes[0].pose;
  }

  const last = state.keyframes[state.keyframes.length - 1];
  if (state.currentTimeMs >= last.timeMs) {
    return last.pose;
  }

  for (let index = 0; index < state.keyframes.length - 1; index += 1) {
    const from = state.keyframes[index];
    const to = state.keyframes[index + 1];

    if (state.currentTimeMs < from.timeMs || state.currentTimeMs > to.timeMs) {
      continue;
    }

    const range = to.timeMs - from.timeMs;
    if (range <= 0) {
      return to.pose;
    }

    const alpha = (state.currentTimeMs - from.timeMs) / range;
    return interpolateNormalizedTimelinePose(from.pose, to.pose, alpha);
  }

  return last.pose;
}
