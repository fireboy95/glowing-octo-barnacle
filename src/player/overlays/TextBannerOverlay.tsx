import React from 'react';
import type { OverlayThemeContract, TextBannerOverlay as TextBanner } from './types';

interface TextBannerOverlayProps {
  banners: TextBanner[];
  theme?: OverlayThemeContract;
}

function resolveColor(theme: OverlayThemeContract | undefined, variant: TextBanner['variant']): string {
  if (variant === 'warning') {
    return theme?.palette.warning ?? '#ff6b6b';
  }

  if (variant === 'success') {
    return theme?.palette.accent ?? '#22c55e';
  }

  return theme?.palette.foreground ?? '#ffffff';
}

export function TextBannerOverlay({ banners, theme }: TextBannerOverlayProps): React.ReactElement | null {
  if (banners.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 14,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'grid',
        gap: 8,
        justifyItems: 'center',
      }}
    >
      {banners.map((banner, index) => (
        <div
          key={`${banner.text}-${index}`}
          style={{
            padding: '4px 12px',
            borderRadius: 999,
            border: `1px solid ${resolveColor(theme, banner.variant)}`,
            color: resolveColor(theme, banner.variant),
            background: 'rgba(0, 0, 0, 0.35)',
            fontFamily: theme?.fontStack,
          }}
        >
          {banner.text}
        </div>
      ))}
    </div>
  );
}
