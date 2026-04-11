import React from 'react';
import type { CountdownOverlay, OverlayThemeContract } from './types';

interface CountdownWidgetProps {
  countdown: CountdownOverlay;
  theme?: OverlayThemeContract;
}

export function CountdownWidget({ countdown, theme }: CountdownWidgetProps): React.ReactElement {
  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        right: 20,
        minWidth: 90,
        textAlign: 'center',
        padding: '8px 10px',
        borderRadius: 10,
        border: `1px solid ${theme?.palette.accent ?? '#3abff8'}`,
        background: 'rgba(0, 0, 0, 0.5)',
        color: theme?.palette.foreground ?? '#fff',
        fontFamily: theme?.fontStack,
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{countdown.value}</div>
      {countdown.label ? <small>{countdown.label}</small> : null}
    </div>
  );
}
