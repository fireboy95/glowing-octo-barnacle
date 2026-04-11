import type { OverlayThemeContract } from './types';

export const DEFAULT_OVERLAY_THEME: OverlayThemeContract = {
  id: 'default',
  classTokens: [],
  palette: {
    background: '#00000000',
    foreground: '#ffffff',
    accent: '#3abff8',
    warning: '#ff6b6b',
  },
  fontStack: "'Inter', 'Segoe UI', sans-serif",
  noiseIntensity: 0,
  scanlineIntensity: 0,
  pixelationScale: 1,
};

const THEME_LIBRARY: Record<string, OverlayThemeContract> = {
  'retro-90s-crt': {
    id: 'retro-90s-crt',
    classTokens: ['overlay-theme', 'overlay-theme-retro-90s-crt'],
    palette: {
      background: '#05110a',
      foreground: '#d7ffd9',
      accent: '#59ff83',
      warning: '#ff7f7f',
    },
    fontStack: "'Press Start 2P', 'Courier New', monospace",
    noiseIntensity: 0.28,
    scanlineIntensity: 0.34,
    pixelationScale: 1.5,
    applyCanvasPostProcess: (canvas) => {
      canvas.style.filter = 'contrast(1.08) saturate(1.05)';
    },
  },
};

export function resolveOverlayTheme(themeId?: string): OverlayThemeContract | undefined {
  if (!themeId) {
    return undefined;
  }

  return THEME_LIBRARY[themeId];
}
