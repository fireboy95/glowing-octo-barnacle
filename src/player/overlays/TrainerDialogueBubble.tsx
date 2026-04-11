import React from 'react';
import type { DialogueOverlay, OverlayThemeContract } from './types';

interface TrainerDialogueBubbleProps {
  dialogue: DialogueOverlay;
  theme?: OverlayThemeContract;
}

export function TrainerDialogueBubble({ dialogue, theme }: TrainerDialogueBubbleProps): React.ReactElement {
  return (
    <div
      style={{
        position: 'absolute',
        left: 20,
        bottom: 20,
        maxWidth: 360,
        padding: '10px 12px',
        borderRadius: 12,
        background: theme?.palette.background ?? 'rgba(15, 15, 15, 0.82)',
        border: `1px solid ${theme?.palette.accent ?? 'rgba(58, 191, 248, 0.65)'}`,
        color: theme?.palette.foreground ?? '#fff',
        fontFamily: theme?.fontStack,
      }}
    >
      {dialogue.speaker ? <strong>{dialogue.speaker}</strong> : null}
      <div>{dialogue.text}</div>
      {dialogue.caption ? <small>{dialogue.caption}</small> : null}
    </div>
  );
}
