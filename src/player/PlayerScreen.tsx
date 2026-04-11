import React from 'react';
import { getBodyModel, type BodyModelId } from '../bodyModels/human-3d-v1';
import { CameraController, type CameraPreset } from '../renderer3d/CameraController';
import { type TimelinePlaybackState, resolvePlaybackFrame } from '../renderer3d/PlaybackBridge';
import { SkeletonScene, type Vector3 } from '../renderer3d/SkeletonScene';

export interface PlayerScreenProps {
  bodyModel: BodyModelId;
  timeline: TimelinePlaybackState;
  jointPositions: Record<string, Vector3>;
  cameraPreset?: CameraPreset;
  renderLegacyBody?: () => React.ReactNode;
  renderCueOverlay?: () => React.ReactNode;
  renderTimerOverlay?: () => React.ReactNode;
}

export function PlayerScreen({
  bodyModel,
  timeline,
  jointPositions,
  cameraPreset = 'front',
  renderLegacyBody,
  renderCueOverlay,
  renderTimerOverlay,
}: PlayerScreenProps): React.ReactElement {
  const playbackFrame = React.useMemo(() => resolvePlaybackFrame(timeline), [timeline]);
  const is3dBodyModel = bodyModel === 'human-3d-v1';

  return (
    <section
      style={{ position: 'relative' }}
      data-active-pose={playbackFrame.pose ? 'ready' : 'empty'}
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
        {renderCueOverlay?.()}
        {renderTimerOverlay?.()}
      </div>
    </section>
  );
}
