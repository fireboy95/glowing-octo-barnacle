import {
  type TimelineKeyframe,
  createTimelineKeyframe,
  interpolateNormalizedTimelinePose,
} from '../timeline';
import type { NormalizePose3DOptions, Pose3DInput } from '../renderer/normalizePose3d';

export interface PlaybackTimeWindow {
  timeMs: number;
  endTimeMs?: number;
}

export interface CameraCue extends PlaybackTimeWindow {
  type: 'pan' | 'angle' | 'rotation' | 'movement';
  payload?: Record<string, unknown>;
}

export interface TextCue extends PlaybackTimeWindow {
  type: 'dialogue' | 'text' | 'countdown';
  payload?: Record<string, unknown>;
}

export interface OverlayCue extends PlaybackTimeWindow {
  type: 'polygon' | 'sprite' | 'theme';
  payload?: Record<string, unknown>;
}

export type PlaybackCue = CameraCue | TextCue | OverlayCue;

export interface PlaybackFrame {
  pose: TimelineKeyframe['pose'] | null;
  cameraState: CameraCue | null;
  activeCues: PlaybackCue[];
}

export interface TimelineStateInput {
  currentTimeMs: number;
  isPlaying: boolean;
  keyframes: Array<{ timeMs: number; pose: Pose3DInput }>;
  cameraCues?: CameraCue[];
  textCues?: TextCue[];
  overlayCues?: OverlayCue[];
}

export interface TimelinePlaybackState {
  currentTimeMs: number;
  isPlaying: boolean;
  keyframes: TimelineKeyframe[];
  cameraCues: CameraCue[];
  textCues: TextCue[];
  overlayCues: OverlayCue[];
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
    cameraCues: sortTrackEntries(input.cameraCues ?? []),
    textCues: sortTrackEntries(input.textCues ?? []),
    overlayCues: sortTrackEntries(input.overlayCues ?? []),
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

export function resolvePlaybackFrame(state: TimelinePlaybackState): PlaybackFrame {
  const currentTimeMs = state.currentTimeMs;
  const pose = resolvePlaybackPose(state);
  const cameraState = resolveActiveCameraCue(state.cameraCues, currentTimeMs);
  const activeCues = resolveActiveCues(state, currentTimeMs);

  return {
    pose,
    cameraState,
    activeCues,
  };
}

function resolveActiveCameraCue(cameraCues: CameraCue[], currentTimeMs: number): CameraCue | null {
  for (let index = cameraCues.length - 1; index >= 0; index -= 1) {
    const cue = cameraCues[index];
    if (isCueActive(cue, currentTimeMs)) {
      return cue;
    }
  }

  return null;
}

function resolveActiveCues(state: TimelinePlaybackState, currentTimeMs: number): PlaybackCue[] {
  const merged = [
    ...state.cameraCues.map((cue, index) => ({ cue, index, trackOrder: 0 })),
    ...state.textCues.map((cue, index) => ({ cue, index, trackOrder: 1 })),
    ...state.overlayCues.map((cue, index) => ({ cue, index, trackOrder: 2 })),
  ];

  return merged
    .filter(({ cue }) => isCueActive(cue, currentTimeMs))
    .sort((a, b) => {
      if (a.cue.timeMs !== b.cue.timeMs) {
        return a.cue.timeMs - b.cue.timeMs;
      }

      if (a.trackOrder !== b.trackOrder) {
        return a.trackOrder - b.trackOrder;
      }

      return a.index - b.index;
    })
    .map(({ cue }) => cue);
}

function isCueActive(cue: PlaybackTimeWindow, currentTimeMs: number): boolean {
  const end = cue.endTimeMs ?? cue.timeMs;
  return currentTimeMs >= cue.timeMs && currentTimeMs <= end;
}

function sortTrackEntries<T extends PlaybackTimeWindow>(entries: T[]): T[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      if (a.entry.timeMs !== b.entry.timeMs) {
        return a.entry.timeMs - b.entry.timeMs;
      }

      const aEnd = a.entry.endTimeMs ?? a.entry.timeMs;
      const bEnd = b.entry.endTimeMs ?? b.entry.timeMs;
      if (aEnd !== bEnd) {
        return aEnd - bEnd;
      }

      return a.index - b.index;
    })
    .map(({ entry }) => entry);
}
