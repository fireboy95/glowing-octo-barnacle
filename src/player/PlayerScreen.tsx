import React from 'react';
import { getBodyModel, type BodyModelId } from '../bodyModels/human-3d-v1';
import { CameraController, type CameraPreset } from '../renderer3d/CameraController';
import { type TimelinePlaybackState, resolvePlaybackFrame } from '../renderer3d/PlaybackBridge';
import { SkeletonScene, type Vector3 } from '../renderer3d/SkeletonScene';
import { PlayerOverlayRenderer, resolveOverlayState, type PlayerOverlayState } from './overlays';

export interface PlayerScreenProps {
  bodyModel: BodyModelId;
  timeline: TimelinePlaybackState;
  jointPositions: Record<string, Vector3>;
  cameraPreset?: CameraPreset;
  renderLegacyBody?: () => React.ReactNode;
  overlayState?: PlayerOverlayState;
}

export function PlayerScreen({
  bodyModel,
  timeline,
  jointPositions,
  cameraPreset = 'front',
  renderLegacyBody,
  overlayState,
}: PlayerScreenProps): React.ReactElement {
  const playbackFrame = React.useMemo(() => resolvePlaybackFrame(timeline), [timeline]);
  const resolvedOverlayState = React.useMemo(
    () => overlayState ?? resolveOverlayState(playbackFrame.activeCues),
    [overlayState, playbackFrame.activeCues],
  );
  const is3dBodyModel = bodyModel === 'human-3d-v1';
  const themeClassName = resolvedOverlayState?.theme?.classTokens.join(' ') ?? '';

  React.useEffect(() => {
    if (!resolvedOverlayState?.theme?.applyCanvasPostProcess) {
      return;
    }

    const canvas = document.querySelector('.player-skeleton-scene canvas');
    if (canvas instanceof HTMLCanvasElement) {
      resolvedOverlayState.theme.applyCanvasPostProcess(canvas);
    }
  }, [resolvedOverlayState?.theme]);

  return (
    <section
      style={{ position: 'relative' }}
      className={themeClassName}
      data-active-pose={playbackFrame.pose ? 'ready' : 'empty'}
      data-overlay-theme={resolvedOverlayState?.theme?.id ?? 'none'}
      data-overlay-noise={resolvedOverlayState?.theme?.noiseIntensity ?? 0}
      data-overlay-scanline={resolvedOverlayState?.theme?.scanlineIntensity ?? 0}
      data-overlay-pixelation={resolvedOverlayState?.theme?.pixelationScale ?? 1}
    >
      <div data-layer="scene">
        {is3dBodyModel ? (
          <>
            <CameraController
              preset={cameraPreset}
              playbackTimeMs={timeline.currentTimeMs}
              cameraCue={playbackFrame.cameraState}
              nextCameraCue={playbackFrame.nextCameraState}
            />
            <SkeletonScene
              jointPositions={jointPositions}
              jointParentByName={getBodyModel(bodyModel).jointParentByName}
              className="player-skeleton-scene"
            />
          </>
        ) : (
          renderLegacyBody?.()
        )}
      </div>

      <div
        data-layer="overlay"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      >
        <PlayerOverlayRenderer overlayState={resolvedOverlayState} />
      </div>
    </section>
  );
}
