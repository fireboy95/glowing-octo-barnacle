import type { OverlayCue, TextCue } from '../../renderer3d/PlaybackBridge';

export interface OverlayThemeContract {
  id: string;
  classTokens: string[];
  palette: {
    background: string;
    foreground: string;
    accent: string;
    warning: string;
  };
  fontStack: string;
  noiseIntensity: number;
  scanlineIntensity: number;
  pixelationScale: number;
  applyCanvasPostProcess?: (canvas: HTMLCanvasElement) => void;
}

export interface DialogueOverlay {
  text: string;
  speaker?: string;
  caption?: string;
}

export interface CountdownOverlay {
  value: number;
  label?: string;
}

export interface TextBannerOverlay {
  text: string;
  variant?: 'default' | 'warning' | 'success';
}

export interface PolygonPoint {
  x: number;
  y: number;
}

export interface PolygonPrimitive {
  points: PolygonPoint[];
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  opacity?: number;
}

export interface SpritePrimitive {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotationDeg?: number;
  opacity?: number;
  scale?: number;
}

export interface PlayerOverlayState {
  dialogue?: DialogueOverlay;
  countdown?: CountdownOverlay;
  textBanners: TextBannerOverlay[];
  polygons: PolygonPrimitive[];
  sprites: SpritePrimitive[];
  theme?: OverlayThemeContract;
  activeCues: Array<TextCue | OverlayCue>;
}
