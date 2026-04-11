# Custom JSON Script Agent Prompt (Comprehensive)

Use this prompt when you want an LLM to generate JSON scripts for arbitrary exercise-video routines (movement, coaching cues, overlays, camera cues, and effects) that validate against this repository's schema.

## Copy/Paste Prompt for LLMs

You are an expert JSON routine generator.

Your task: Generate exactly one JSON object that validates against `schema/routine-1.1.0.schema.json` (schema version constant is `1.2.1`).

Hard requirements:
1. Return only valid JSON.
2. Do not wrap output in markdown.
3. Do not include commentary.
4. Include all required fields.
5. Use only allowed enum values.
6. Respect `additionalProperties: false` anywhere it appears.
7. Ensure timing values are integers in milliseconds.
8. Keep IDs unique across all items.

This output is intended to be pasted into ChatGPT or another LLM to generate schema-valid JSON scripts for arbitrary exercise videos.

## Required Top-Level Fields
- `schemaVersion`: must be `"1.2.1"`
- `type`: must be `"routine"`
- `id`: non-empty string
- `title`: non-empty string
- `bodyModel`: `"human-2d-v1"` or `"human-3d-v1"`
- `items`: array, at least 1 item

Optional top-level fields:
- `description`: string
- `renderHints.dimension`: `"2d"` or `"3d"`
- `metadata`: object

## Supported Routine Item Kinds
A top-level `items[]` entry can be one of:
- `exercise` (with nested `steps[]` movement steps)
- `rest`
- `movementStep`
- `dialogueCue`
- `textCue`
- `countdownCue`
- `overlaySprite`
- `overlayPolygon`
- `videoFilterCue`
- `cameraCue`

## Pose / Rotation Rules
In `movementStep.pose.jointRotations`, each joint value must be one of:

1) Euler object
```json
{ "x": 10, "y": 0, "z": -5, "order": "XYZ", "unit": "deg" }
```
- Required: `x`, `y`, `z`
- Optional `order`: `XYZ`, `XZY`, `YXZ`, `YZX`, `ZXY`, `ZYX`
- Optional `unit`: `rad` or `deg`

2) Quaternion array
```json
[0, 0, 0, 1]
```
- Exactly 4 numbers in `[x, y, z, w]`

## Timing Rules
For any cue with `timing`:
```json
"timing": { "startMs": 0, "durationMs": 1500 }
```
- `startMs`: integer >= 0
- `durationMs`: integer >= 0

Use coherent timelines:
- Keep `durationMs` long enough for readable text/dialogue.
- Avoid impossible countdown setup (`intervalMs` too large for duration).
- Keep simultaneous cues intentional (e.g., text + countdown overlap is OK).

## Natural Motion Constraints (`movementStep`)
When generating `movementStep` sequences, prioritize physically plausible transitions instead of pose-to-pose teleporting.

Use transition metadata on `movementStep` (all optional) to make non-linear human-like motion explicit while staying backward compatible:
- `blend`: how this step blends from the previous step.
  - Allowed enums: `interpolate` (default/current behavior), `hold`, `additive`
- `easing`: transition curve into this step.
  - Allowed enums: `linear` (default/current behavior), `easeIn`, `easeOut`, `easeInOut`
- `transitionMs`: integer milliseconds for blend/easing window into this step.
  - If omitted, interpolation should follow existing behavior.

- **Limit per-step joint delta magnitude.**
  - Avoid very large angle jumps for the same joint in a single step.
  - Heuristic: if a major joint (hips, knees, ankles, shoulders, elbows, spine) changes by roughly **>30–45°** between adjacent steps, split into additional steps.
- **Require minimum step durations for large pose transitions.**
  - Heuristic: for large whole-body or lower-body transitions, use at least **300–600ms** for the transition window.
  - Avoid compressing major posture changes into ultra-short (<200ms) single steps.
- **Require intermediate transition frames for explosive moves** (for example: burpee, jump squat, skater).
  - Insert explicit transition frames showing loading, takeoff, contact, and stabilization as applicable.
  - Heuristic: for large lower-body angle changes (hip/knee/ankle), insert **1–2 transition `movementStep` items**, each around **200–400ms**.
- **Encourage anticipation/contact/recovery micro-steps.**
  - Add brief anticipation (pre-load), contact (landing/plant), and recovery (re-balance) micro-steps where motion would otherwise look abrupt.
  - Typical micro-step range: about **120–300ms** depending on movement speed.

Practical pattern for explosive actions:
1. Anticipation/pre-load step (short, controlled).
2. Main propulsion or direction-change step.
3. Contact/landing step.
4. Recovery/stabilization step.

Keep these constraints consistent with schema validity requirements (integers in ms, valid joint rotation encoding, and no extra properties).

## Camera Script Syntax (`cameraCue`)
A `cameraCue` item controls framing over a timed interval:

```json
{
  "kind": "cameraCue",
  "id": "cam-1",
  "timing": { "startMs": 0, "durationMs": 4000 },
  "directives": [
    { "type": "position", "position": { "x": 0, "y": 1.5, "z": 3.2 }, "easing": "easeOut" },
    { "type": "lookAt", "target": { "x": 0, "y": 1.0, "z": 0 }, "easing": "easeInOut" }
  ]
}
```

`cameraCue` requirements:
- Required fields: `kind`, `id`, `timing`, `directives`
- `kind` must be exactly `"cameraCue"`
- `directives` must contain at least 1 directive object
- `timing.startMs` / `timing.durationMs` must be integer milliseconds

Allowed `easing` values on directives:
- `linear`
- `easeIn`
- `easeOut`
- `easeInOut`

### Supported Camera Directive Types

1) `lookAt`
```json
{ "type": "lookAt", "target": { "x": 0, "y": 1, "z": 0 }, "easing": "linear" }
```
- Required: `type`, `target`
- `target` is a 3D vector `{x,y,z}`

2) `position`
```json
{ "type": "position", "position": { "x": 0, "y": 1.4, "z": 3.5 }, "easing": "easeOut" }
```
- Required: `type`, `position`
- `position` is a 3D vector `{x,y,z}`

3) `yaw/pitch/roll`
```json
{ "type": "yaw/pitch/roll", "yawRad": 0.3, "pitchRad": -0.1, "rollRad": 0.0, "easing": "easeInOut" }
```
- Required: `type`, `yawRad`, `pitchRad`, `rollRad`
- Angles are numeric radians

4) `orbit`
```json
{ "type": "orbit", "center": { "x": 0, "y": 1, "z": 0 }, "radius": 3, "azimuthRad": 1.2, "elevationRad": 0.2, "easing": "linear" }
```
- Required: `type`, `center`, `radius`, `azimuthRad`, `elevationRad`
- `center` is a 3D vector `{x,y,z}`

5) `dolly`
```json
{ "type": "dolly", "distance": -0.6, "easing": "easeIn" }
```
- Required: `type`, `distance`
- `distance` is numeric; positive/negative meaning is renderer-defined

6) `panTo`
```json
{ "type": "panTo", "target": { "x": 0.4, "y": 1.2, "z": 0.1 }, "easing": "easeOut" }
```
- Required: `type`, `target`
- `target` is a 3D vector `{x,y,z}`

7) `fov`
```json
{ "type": "fov", "fovDeg": 45, "easing": "easeInOut" }
```
- Required: `type`, `fovDeg`
- `fovDeg` is numeric degrees

### Camera Syntax Pitfalls to Avoid
- Using `"yawPitchRoll"` instead of exact `"yaw/pitch/roll"`.
- Omitting required fields for a directive type (for example, missing `center` on `orbit`).
- Using unknown directive properties where `additionalProperties: false` applies.
- Passing string numbers (like `"45"`) instead of numeric values for camera fields.
- Creating empty `directives: []` arrays (must contain at least one directive).
- Encoding camera intent inside `textCue.text` (for example, `CAM: push in`, `CAMERA LEFT`, `zoom now`) instead of using explicit `cameraCue` directives.

### Camera Intent Validation Guideline
- Treat camera-language in `textCue` as invalid unless there is a corresponding `cameraCue` item with one or more `directives` that implement that intent in the same timeline window.
- If camera movement is intended, express the movement in `cameraCue.directives` (not in caption text).

Before (invalid caption-only camera note):
```json
{
  "kind": "textCue",
  "id": "cam-note-1",
  "text": "CAM: push in to athlete face",
  "timing": { "startMs": 4000, "durationMs": 2000 }
}
```

After (valid camera implementation with `position` + `lookAt` + easing):
```json
{
  "kind": "cameraCue",
  "id": "cam-push-face-1",
  "timing": { "startMs": 4000, "durationMs": 2000 },
  "directives": [
    {
      "type": "position",
      "position": { "x": 0.1, "y": 1.55, "z": 2.1 },
      "easing": "easeInOut"
    },
    {
      "type": "lookAt",
      "target": { "x": 0.0, "y": 1.45, "z": 0.0 },
      "easing": "easeOut"
    }
  ]
}
```

## Common Validation Failures to Avoid
- Wrong `schemaVersion` (must be `"1.2.1"`).
- Missing required fields on top-level or item-level objects.
- Returning an array instead of a single object.
- Non-integer timing values.
- Unknown properties where `additionalProperties: false`.
- Quaternion length != 4.
- Invalid Euler `order`/`unit`.
- Invalid `placement`/`anchor` coordinate formats.
- Invalid enum values for presets, easing, blend modes, etc.
- Camera move intent present only in `textCue.text` without a matching `cameraCue` + `directives`.

## Composition Guidance for Arbitrary Exercise Videos
To generate rich, flexible routines:
1. Start with one or more `exercise` or `movementStep` items for the physical sequence.
2. Layer coaching with `dialogueCue` and motivational labels via `textCue`.
3. Add pacing with `countdownCue` and optional `rest` phases.
4. Add visual context via `overlaySprite` / `overlayPolygon`.
5. Apply stylistic or thematic effects with `videoFilterCue`.
6. Drive framing with `cameraCue.directives` (`lookAt`, `position`, `yaw/pitch/roll`, `orbit`, `dolly`, `panTo`, `fov`).
7. Keep IDs stable and meaningful for downstream editing.

## Complete Valid Example Script
```json
{
  "schemaVersion": "1.2.1",
  "type": "routine",
  "id": "arbitrary-video-demo-001",
  "title": "HIIT Demo With Coaching, Overlays, and Camera Moves",
  "description": "Comprehensive routine demonstrating multiple supported item kinds.",
  "bodyModel": "human-3d-v1",
  "renderHints": { "dimension": "3d" },
  "items": [
    {
      "kind": "movementStep",
      "id": "warmup-stance",
      "title": "Warm-up stance",
      "durationMs": 1500,
      "blend": "interpolate",
      "easing": "easeInOut",
      "transitionMs": 300,
      "pose": {
        "jointRotations": {
          "pelvis": { "x": 0, "y": 0, "z": 0, "unit": "deg", "order": "XYZ" },
          "shoulderL": { "x": 10, "y": -8, "z": 0, "unit": "deg", "order": "XYZ" },
          "shoulderR": { "x": 10, "y": 8, "z": 0, "unit": "deg", "order": "XYZ" },
          "hipL": [0, 0, 0, 1],
          "hipR": [0, 0, 0, 1]
        }
      }
    },
    {
      "kind": "dialogueCue",
      "id": "coach-intro",
      "speaker": "Coach",
      "text": "Start light, then build intensity.",
      "timing": { "startMs": 0, "durationMs": 2200 }
    },
    {
      "kind": "textCue",
      "id": "round-label",
      "text": "Round 1 • 30s On",
      "placement": { "x": "50%", "y": "10%" },
      "styleToken": "headline",
      "timing": { "startMs": 0, "durationMs": 2500 }
    },
    {
      "kind": "countdownCue",
      "id": "count-in",
      "startValue": 3,
      "intervalMs": 1000,
      "styleToken": "countdown",
      "timing": { "startMs": 0, "durationMs": 3000 }
    },
    {
      "kind": "overlaySprite",
      "id": "badge",
      "asset": "assets/ui/fire-badge.png",
      "anchor": { "x": "88%", "y": "14%" },
      "scale": 1,
      "opacity": 0.9,
      "zIndex": 5,
      "timing": { "startMs": 1200, "durationMs": 2800 }
    },
    {
      "kind": "overlayPolygon",
      "id": "lower-third-bg",
      "points": [
        { "x": "5%", "y": "82%" },
        { "x": "60%", "y": "82%" },
        { "x": "58%", "y": "96%" }
      ],
      "fill": "#111827",
      "opacity": 0.65,
      "zIndex": 2,
      "timing": { "startMs": 0, "durationMs": 4000 }
    },
    {
      "kind": "videoFilterCue",
      "id": "style-pass",
      "filterId": "warm-contrast",
      "preset": "film-grain",
      "intensity": 0.4,
      "blendMode": "overlay",
      "transitionInMs": 400,
      "transitionOutMs": 400,
      "timing": { "startMs": 500, "durationMs": 4500 }
    },
    {
      "kind": "cameraCue",
      "id": "camera-open",
      "timing": { "startMs": 0, "durationMs": 5000 },
      "directives": [
        { "type": "position", "position": { "x": 0, "y": 1.4, "z": 3.5 }, "easing": "easeOut" },
        { "type": "lookAt", "target": { "x": 0, "y": 1.0, "z": 0 }, "easing": "easeInOut" }
      ]
    },
    {
      "kind": "rest",
      "id": "short-reset",
      "title": "Breath Reset",
      "durationMs": 2000
    }
  ]
}
```

## Full JSON Schema (verbatim)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schema/routine-1.2.1.schema.json",
  "title": "Routine Schema v1.2.1",
  "description": "Schema for structured movement/exercise routines with 3D pose support.",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schemaVersion",
    "type",
    "id",
    "title",
    "bodyModel",
    "items"
  ],
  "properties": {
    "schemaVersion": {
      "type": "string",
      "const": "1.2.1"
    },
    "type": {
      "type": "string",
      "const": "routine"
    },
    "id": {
      "type": "string",
      "minLength": 1
    },
    "title": {
      "type": "string",
      "minLength": 1
    },
    "description": {
      "type": "string"
    },
    "bodyModel": {
      "type": "string",
      "enum": [
        "human-2d-v1",
        "human-3d-v1"
      ]
    },
    "renderHints": {
      "$ref": "#/$defs/renderHints"
    },
    "items": {
      "type": "array",
      "minItems": 1,
      "items": {
        "$ref": "#/$defs/routineItem"
      }
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "$defs": {
    "renderHints": {
      "type": "object",
      "additionalProperties": true,
      "properties": {
        "dimension": {
          "type": "string",
          "enum": [
            "2d",
            "3d"
          ]
        }
      }
    },
    "quaternion": {
      "type": "array",
      "description": "Quaternion as [x, y, z, w].",
      "minItems": 4,
      "maxItems": 4,
      "items": {
        "type": "number"
      }
    },
    "euler": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "x",
        "y",
        "z"
      ],
      "properties": {
        "x": {
          "type": "number"
        },
        "y": {
          "type": "number"
        },
        "z": {
          "type": "number"
        },
        "order": {
          "type": "string",
          "enum": [
            "XYZ",
            "XZY",
            "YXZ",
            "YZX",
            "ZXY",
            "ZYX"
          ],
          "default": "XYZ"
        },
        "unit": {
          "type": "string",
          "enum": [
            "rad",
            "deg"
          ],
          "default": "rad"
        }
      }
    },
    "jointRotation": {
      "oneOf": [
        {
          "$ref": "#/$defs/quaternion"
        },
        {
          "$ref": "#/$defs/euler"
        }
      ]
    },
    "styleToken": {
      "type": "string",
      "minLength": 1,
      "description": "Named visual style token resolved by the client theme system."
    },
    "timing": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "startMs",
        "durationMs"
      ],
      "properties": {
        "startMs": {
          "type": "integer",
          "minimum": 0
        },
        "durationMs": {
          "type": "integer",
          "minimum": 0
        }
      }
    },
    "positionUnitValue": {
      "description": "Position value in px or percentage units.",
      "oneOf": [
        {
          "type": "number"
        },
        {
          "type": "string",
          "pattern": "^-?\\\\d+(?:\\\\.\\\\d+)?(?:px|%)$"
        }
      ]
    },
    "vector3": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "x",
        "y",
        "z"
      ],
      "properties": {
        "x": {
          "type": "number"
        },
        "y": {
          "type": "number"
        },
        "z": {
          "type": "number"
        }
      }
    },
    "cameraEasing": {
      "type": "string",
      "enum": [
        "linear",
        "easeIn",
        "easeOut",
        "easeInOut"
      ]
    },
    "cameraDirectiveLookAt": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "type",
        "target"
      ],
      "properties": {
        "type": {
          "const": "lookAt"
        },
        "target": {
          "$ref": "#/$defs/vector3"
        },
        "easing": {
          "$ref": "#/$defs/cameraEasing"
        }
      }
    },
    "cameraDirectivePosition": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "type",
        "position"
      ],
      "properties": {
        "type": {
          "const": "position"
        },
        "position": {
          "$ref": "#/$defs/vector3"
        },
        "easing": {
          "$ref": "#/$defs/cameraEasing"
        }
      }
    },
    "cameraDirectiveYawPitchRoll": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "type",
        "yawRad",
        "pitchRad",
        "rollRad"
      ],
      "properties": {
        "type": {
          "const": "yaw/pitch/roll"
        },
        "yawRad": {
          "type": "number"
        },
        "pitchRad": {
          "type": "number"
        },
        "rollRad": {
          "type": "number"
        },
        "easing": {
          "$ref": "#/$defs/cameraEasing"
        }
      }
    },
    "cameraDirectiveOrbit": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "type",
        "angleRad"
      ],
      "properties": {
        "type": {
          "const": "orbit"
        },
        "angleRad": {
          "type": "number"
        },
        "radius": {
          "type": "number",
          "exclusiveMinimum": 0
        },
        "height": {
          "type": "number"
        },
        "target": {
          "$ref": "#/$defs/vector3"
        },
        "easing": {
          "$ref": "#/$defs/cameraEasing"
        }
      }
    },
    "cameraDirectiveDolly": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "type",
        "amount"
      ],
      "properties": {
        "type": {
          "const": "dolly"
        },
        "amount": {
          "type": "number"
        },
        "easing": {
          "$ref": "#/$defs/cameraEasing"
        }
      }
    },
    "cameraDirectivePanTo": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "type",
        "target"
      ],
      "properties": {
        "type": {
          "const": "panTo"
        },
        "target": {
          "$ref": "#/$defs/vector3"
        },
        "easing": {
          "$ref": "#/$defs/cameraEasing"
        }
      }
    },
    "cameraDirectiveFov": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "type",
        "fovDeg"
      ],
      "properties": {
        "type": {
          "const": "fov"
        },
        "fovDeg": {
          "type": "number",
          "exclusiveMinimum": 0,
          "exclusiveMaximum": 180
        },
        "easing": {
          "$ref": "#/$defs/cameraEasing"
        }
      }
    },
    "cameraDirective": {
      "oneOf": [
        {
          "$ref": "#/$defs/cameraDirectiveLookAt"
        },
        {
          "$ref": "#/$defs/cameraDirectivePosition"
        },
        {
          "$ref": "#/$defs/cameraDirectiveYawPitchRoll"
        },
        {
          "$ref": "#/$defs/cameraDirectiveOrbit"
        },
        {
          "$ref": "#/$defs/cameraDirectiveDolly"
        },
        {
          "$ref": "#/$defs/cameraDirectivePanTo"
        },
        {
          "$ref": "#/$defs/cameraDirectiveFov"
        }
      ]
    },
    "anchorKeyword": {
      "type": "string",
      "enum": [
        "top-left",
        "top-center",
        "top-right",
        "center-left",
        "center",
        "center-right",
        "bottom-left",
        "bottom-center",
        "bottom-right"
      ]
    },
    "anchor": {
      "description": "Anchor position as a keyword or coordinate pair.",
      "oneOf": [
        {
          "$ref": "#/$defs/anchorKeyword"
        },
        {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "x",
            "y"
          ],
          "properties": {
            "x": {
              "$ref": "#/$defs/positionUnitValue"
            },
            "y": {
              "$ref": "#/$defs/positionUnitValue"
            }
          }
        }
      ]
    },
    "animationCue": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "name"
      ],
      "properties": {
        "name": {
          "type": "string",
          "minLength": 1
        },
        "durationMs": {
          "type": "integer",
          "minimum": 0
        }
      }
    },
    "pose": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "jointRotations"
      ],
      "properties": {
        "jointRotations": {
          "type": "object",
          "description": "Map of joint names to rotations represented as quaternion or Euler angles.",
          "minProperties": 1,
          "additionalProperties": {
            "$ref": "#/$defs/jointRotation"
          }
        }
      }
    },
    "movementStep": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "kind",
        "id",
        "title",
        "pose"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "movementStep"
        },
        "id": {
          "type": "string",
          "minLength": 1
        },
        "title": {
          "type": "string",
          "minLength": 1
        },
        "description": {
          "type": "string"
        },
        "durationMs": {
          "type": "integer",
          "minimum": 0
        },
        "blend": {
          "type": "string",
          "enum": ["interpolate", "hold", "additive"]
        },
        "easing": {
          "type": "string",
          "enum": ["linear", "easeIn", "easeOut", "easeInOut"]
        },
        "transitionMs": {
          "type": "integer",
          "minimum": 0
        },
        "pose": {
          "$ref": "#/$defs/pose"
        },
        "metadata": {
          "type": "object",
          "additionalProperties": true
        }
      }
    },
    "exercise": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "kind",
        "id",
        "title",
        "steps"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "exercise"
        },
        "id": {
          "type": "string",
          "minLength": 1
        },
        "title": {
          "type": "string",
          "minLength": 1
        },
        "description": {
          "type": "string"
        },
        "repeat": {
          "type": "integer",
          "minimum": 1,
          "default": 1
        },
        "steps": {
          "type": "array",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/movementStep"
          }
        },
        "metadata": {
          "type": "object",
          "additionalProperties": true
        }
      }
    },
    "rest": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "kind",
        "id",
        "durationMs"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "rest"
        },
        "id": {
          "type": "string",
          "minLength": 1
        },
        "title": {
          "type": "string"
        },
        "durationMs": {
          "type": "integer",
          "minimum": 0
        },
        "metadata": {
          "type": "object",
          "additionalProperties": true
        }
      }
    },
    "dialogueCue": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "kind",
        "id",
        "speaker",
        "text",
        "timing"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "dialogueCue"
        },
        "id": {
          "type": "string",
          "minLength": 1
        },
        "speaker": {
          "type": "string",
          "minLength": 1
        },
        "text": {
          "type": "string",
          "minLength": 1
        },
        "audioRef": {
          "type": "string",
          "minLength": 1
        },
        "timing": {
          "$ref": "#/$defs/timing"
        },
        "metadata": {
          "type": "object",
          "additionalProperties": true
        }
      }
    },
    "textCue": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "kind",
        "id",
        "text",
        "placement",
        "styleToken",
        "timing"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "textCue"
        },
        "id": {
          "type": "string",
          "minLength": 1
        },
        "text": {
          "type": "string",
          "minLength": 1
        },
        "placement": {
          "$ref": "#/$defs/anchor"
        },
        "styleToken": {
          "$ref": "#/$defs/styleToken"
        },
        "animationIn": {
          "$ref": "#/$defs/animationCue"
        },
        "animationOut": {
          "$ref": "#/$defs/animationCue"
        },
        "timing": {
          "$ref": "#/$defs/timing"
        },
        "metadata": {
          "type": "object",
          "additionalProperties": true
        }
      }
    },
    "countdownCue": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "kind",
        "id",
        "startValue",
        "intervalMs",
        "styleToken",
        "timing"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "countdownCue"
        },
        "id": {
          "type": "string",
          "minLength": 1
        },
        "startValue": {
          "type": "integer",
          "minimum": 0
        },
        "intervalMs": {
          "type": "integer",
          "minimum": 1
        },
        "label": {
          "type": "string"
        },
        "styleToken": {
          "$ref": "#/$defs/styleToken"
        },
        "timing": {
          "$ref": "#/$defs/timing"
        },
        "metadata": {
          "type": "object",
          "additionalProperties": true
        }
      }
    },
    "overlaySprite": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "kind",
        "id",
        "asset",
        "anchor",
        "timing"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "overlaySprite"
        },
        "id": {
          "type": "string",
          "minLength": 1
        },
        "asset": {
          "type": "string",
          "minLength": 1
        },
        "anchor": {
          "$ref": "#/$defs/anchor"
        },
        "scale": {
          "type": "number",
          "exclusiveMinimum": 0
        },
        "opacity": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        "zIndex": {
          "type": "integer"
        },
        "timing": {
          "$ref": "#/$defs/timing"
        },
        "metadata": {
          "type": "object",
          "additionalProperties": true
        }
      }
    },
    "overlayPolygon": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "kind",
        "id",
        "points",
        "timing"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "overlayPolygon"
        },
        "id": {
          "type": "string",
          "minLength": 1
        },
        "points": {
          "type": "array",
          "minItems": 3,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "x",
              "y"
            ],
            "properties": {
              "x": {
                "$ref": "#/$defs/positionUnitValue"
              },
              "y": {
                "$ref": "#/$defs/positionUnitValue"
              }
            }
          }
        },
        "fill": {
          "type": "string"
        },
        "stroke": {
          "type": "string"
        },
        "opacity": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        "zIndex": {
          "type": "integer"
        },
        "timing": {
          "$ref": "#/$defs/timing"
        },
        "metadata": {
          "type": "object",
          "additionalProperties": true
        }
      }
    },
    "videoFilterCue": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "kind",
        "id",
        "filterId"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "videoFilterCue"
        },
        "id": {
          "type": "string",
          "minLength": 1
        },
        "filterId": {
          "type": "string",
          "minLength": 1,
          "description": "Video filter identifier (e.g. retro-90s-crt)."
        },
        "preset": {
          "type": "string",
          "enum": [
            "retro-90s-crt",
            "vhs-tracking",
            "arcade-scanlines",
            "8bit-pixelate",
            "film-grain",
            "none"
          ]
        },
        "intensity": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        "blendMode": {
          "type": "string",
          "enum": [
            "replace",
            "overlay",
            "screen",
            "multiply"
          ],
          "default": "replace"
        },
        "transitionInMs": {
          "type": "integer",
          "minimum": 0
        },
        "transitionOutMs": {
          "type": "integer",
          "minimum": 0
        },
        "timing": {
          "$ref": "#/$defs/timing"
        },
        "metadata": {
          "type": "object",
          "additionalProperties": true
        }
      }
    },
    "cameraCue": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "kind",
        "id",
        "timing",
        "directives"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "cameraCue"
        },
        "id": {
          "type": "string",
          "minLength": 1
        },
        "timing": {
          "$ref": "#/$defs/timing"
        },
        "directives": {
          "type": "array",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/cameraDirective"
          }
        },
        "metadata": {
          "type": "object",
          "additionalProperties": true
        }
      }
    },
    "routineItem": {
      "description": "A single item in the routine flow.",
      "oneOf": [
        {
          "$ref": "#/$defs/exercise"
        },
        {
          "$ref": "#/$defs/rest"
        },
        {
          "$ref": "#/$defs/movementStep"
        },
        {
          "$ref": "#/$defs/dialogueCue"
        },
        {
          "$ref": "#/$defs/textCue"
        },
        {
          "$ref": "#/$defs/countdownCue"
        },
        {
          "$ref": "#/$defs/overlaySprite"
        },
        {
          "$ref": "#/$defs/overlayPolygon"
        },
        {
          "$ref": "#/$defs/videoFilterCue"
        },
        {
          "$ref": "#/$defs/cameraCue"
        }
      ]
    }
  }
}
```
