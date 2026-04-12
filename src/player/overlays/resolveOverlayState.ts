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

function parseUnitValueAsPercent(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.endsWith('%')) {
    const numericValue = Number.parseFloat(trimmed.slice(0, -1));
    return Number.isFinite(numericValue) ? numericValue : undefined;
  }

  if (trimmed.endsWith('px')) {
    const numericValue = Number.parseFloat(trimmed.slice(0, -2));
    return Number.isFinite(numericValue) ? numericValue : undefined;
  }

  const numericValue = Number.parseFloat(trimmed);
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function resolveAnchorKeyword(anchor: string): { x: number; y: number } | undefined {
  const keywordMap: Record<string, { x: number; y: number }> = {
    'top-left': { x: 0, y: 0 },
    'top-center': { x: 50, y: 0 },
    'top-right': { x: 100, y: 0 },
    'center-left': { x: 0, y: 50 },
    center: { x: 50, y: 50 },
    'center-right': { x: 100, y: 50 },
    'bottom-left': { x: 0, y: 100 },
    'bottom-center': { x: 50, y: 100 },
    'bottom-right': { x: 100, y: 100 },
  };
  return keywordMap[anchor];
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
      x: parseUnitValueAsPercent(point.x) ?? NaN,
      y: parseUnitValueAsPercent(point.y) ?? NaN,
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
    zIndex: getNumber(cue.payload, 'zIndex'),
  };
}

function parseSpriteCue(cue: OverlayCue): SpritePrimitive | undefined {
  const src = getString(cue.payload, 'src') ?? getString(cue.payload, 'asset');
  const xFromPayload = getNumber(cue.payload, 'x');
  const yFromPayload = getNumber(cue.payload, 'y');
  const width = getNumber(cue.payload, 'width');
  const height = getNumber(cue.payload, 'height');
  const anchor = cue.payload?.anchor;
  const anchorRecord = asRecord(anchor);
  const anchorKeyword = typeof anchor === 'string' ? resolveAnchorKeyword(anchor) : undefined;
  const xFromAnchor =
    anchorKeyword?.x ?? (anchorRecord ? parseUnitValueAsPercent(anchorRecord.x) : undefined);
  const yFromAnchor =
    anchorKeyword?.y ?? (anchorRecord ? parseUnitValueAsPercent(anchorRecord.y) : undefined);
  const x = xFromPayload ?? xFromAnchor ?? 50;
  const y = yFromPayload ?? yFromAnchor ?? 50;

  if (!src) {
    return undefined;
  }

  return {
    src,
    x,
    y,
    width: width ?? 160,
    height: height ?? 160,
    rotationDeg: getNumber(cue.payload, 'rotationDeg'),
    opacity: getNumber(cue.payload, 'opacity'),
    scale: getNumber(cue.payload, 'scale'),
    zIndex: getNumber(cue.payload, 'zIndex'),
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
      themeId =
        getString(cue.payload, 'themeId') ??
        getString(cue.payload, 'preset') ??
        getString(cue.payload, 'filterId') ??
        getString(cue.payload, 'id');
    }
  }

  return {
    dialogue,
    countdown,
    textBanners,
    polygons: polygons.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)),
    sprites: sprites.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)),
    theme: resolveOverlayTheme(themeId),
    activeCues,
  };
}
