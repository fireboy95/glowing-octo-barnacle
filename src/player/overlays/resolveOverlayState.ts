import type { OverlayCue, PlaybackCue, TextCue } from '../../renderer3d/PlaybackBridge';
import { resolveOverlayTheme } from './theme';
import type {
  CountdownOverlay,
  DialogueOverlay,
  PlayerOverlayState,
  PolygonPrimitive,
  SpritePrimitive,
  TextBannerOverlay,
} from './types';

function getString(payload: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = payload?.[key];
  return typeof value === 'string' ? value : undefined;
}

function getNumber(payload: Record<string, unknown> | undefined, key: string): number | undefined {
  const value = payload?.[key];
  return typeof value === 'number' ? value : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
}

function parseDialogueCue(cue: TextCue): DialogueOverlay | undefined {
  const text = getString(cue.payload, 'text');
  if (!text) {
    return undefined;
  }

  return {
    text,
    speaker: getString(cue.payload, 'speaker'),
    caption: getString(cue.payload, 'caption'),
  };
}

function parseCountdownCue(cue: TextCue): CountdownOverlay | undefined {
  const value = getNumber(cue.payload, 'value');
  if (value === undefined) {
    return undefined;
  }

  return {
    value,
    label: getString(cue.payload, 'label'),
  };
}

function parseTextBannerCue(cue: TextCue): TextBannerOverlay | undefined {
  const text = getString(cue.payload, 'text');
  if (!text) {
    return undefined;
  }

  const variant = getString(cue.payload, 'variant');
  return {
    text,
    variant: variant === 'warning' || variant === 'success' ? variant : 'default',
  };
}

function parsePolygonCue(cue: OverlayCue): PolygonPrimitive | undefined {
  const pointsRaw = cue.payload?.points;
  if (!Array.isArray(pointsRaw)) {
    return undefined;
  }

  const points = pointsRaw
    .map((point) => asRecord(point))
    .filter((point): point is Record<string, unknown> => Boolean(point))
    .map((point) => ({
      x: typeof point.x === 'number' ? point.x : NaN,
      y: typeof point.y === 'number' ? point.y : NaN,
    }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

  if (points.length < 3) {
    return undefined;
  }

  return {
    points,
    stroke: getString(cue.payload, 'stroke'),
    fill: getString(cue.payload, 'fill'),
    strokeWidth: getNumber(cue.payload, 'strokeWidth'),
    opacity: getNumber(cue.payload, 'opacity'),
  };
}

function parseSpriteCue(cue: OverlayCue): SpritePrimitive | undefined {
  const src = getString(cue.payload, 'src');
  const x = getNumber(cue.payload, 'x');
  const y = getNumber(cue.payload, 'y');
  const width = getNumber(cue.payload, 'width');
  const height = getNumber(cue.payload, 'height');

  if (!src || x === undefined || y === undefined || width === undefined || height === undefined) {
    return undefined;
  }

  return {
    src,
    x,
    y,
    width,
    height,
    rotationDeg: getNumber(cue.payload, 'rotationDeg'),
    opacity: getNumber(cue.payload, 'opacity'),
    scale: getNumber(cue.payload, 'scale'),
  };
}

export function resolveOverlayState(cues: PlaybackCue[]): PlayerOverlayState | undefined {
  const activeCues = cues.filter((cue): cue is TextCue | OverlayCue => {
    return 'type' in cue && (cue.type !== undefined) && (cue.type !== null);
  });

  if (activeCues.length === 0) {
    return undefined;
  }

  let dialogue: DialogueOverlay | undefined;
  let countdown: CountdownOverlay | undefined;
  const textBanners: TextBannerOverlay[] = [];
  const polygons: PolygonPrimitive[] = [];
  const sprites: SpritePrimitive[] = [];
  let themeId: string | undefined;

  for (const cue of activeCues) {
    if (cue.type === 'dialogue') {
      dialogue = parseDialogueCue(cue);
      continue;
    }

    if (cue.type === 'countdown') {
      countdown = parseCountdownCue(cue);
      continue;
    }

    if (cue.type === 'text') {
      const banner = parseTextBannerCue(cue);
      if (banner) {
        textBanners.push(banner);
      }
      continue;
    }

    if (cue.type === 'polygon') {
      const polygon = parsePolygonCue(cue);
      if (polygon) {
        polygons.push(polygon);
      }
      continue;
    }

    if (cue.type === 'sprite') {
      const sprite = parseSpriteCue(cue);
      if (sprite) {
        sprites.push(sprite);
      }
      continue;
    }

    if (cue.type === 'theme') {
      themeId = getString(cue.payload, 'themeId') ?? getString(cue.payload, 'id');
    }
  }

  return {
    dialogue,
    countdown,
    textBanners,
    polygons,
    sprites,
    theme: resolveOverlayTheme(themeId),
    activeCues,
  };
}
