import React from 'react';
import { CountdownWidget } from './CountdownWidget';
import { PolygonPrimitivesLayer } from './PolygonPrimitivesLayer';
import { SpritePrimitivesLayer } from './SpritePrimitivesLayer';
import { TextBannerOverlay } from './TextBannerOverlay';
import { TrainerDialogueBubble } from './TrainerDialogueBubble';
import type { PlayerOverlayState } from './types';

export interface PlayerOverlayRendererProps {
  overlayState?: PlayerOverlayState;
}

export function PlayerOverlayRenderer({ overlayState }: PlayerOverlayRendererProps): React.ReactElement | null {
  if (!overlayState) {
    return null;
  }

  return (
    <>
      <PolygonPrimitivesLayer polygons={overlayState.polygons} />
      <SpritePrimitivesLayer sprites={overlayState.sprites} />
      <TextBannerOverlay banners={overlayState.textBanners} theme={overlayState.theme} />
      {overlayState.countdown ? <CountdownWidget countdown={overlayState.countdown} theme={overlayState.theme} /> : null}
      {overlayState.dialogue ? <TrainerDialogueBubble dialogue={overlayState.dialogue} theme={overlayState.theme} /> : null}
    </>
  );
}
