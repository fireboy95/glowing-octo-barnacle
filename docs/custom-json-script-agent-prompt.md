# Custom JSON Script Agent Prompt

## Purpose and constraints
Use this prompt to instruct an AI assistant to generate **schema-valid JSON routine scripts** for this app.

The generated output must:
- Validate against `schema/routine-1.1.0.schema.json` (where `schemaVersion` is `"1.2.1"`).
- Be a **single JSON object** (not an array, not markdown).
- Include only fields allowed by the schema.
- Use millisecond timing values as integers.

Use this instruction verbatim in your AI prompt:

> Return only valid JSON. Do not wrap in markdown. Do not include commentary.

This is intended to be pasted into **ChatGPT or another LLM to generate schema-valid JSON scripts**.

## Required schema fields
Top-level required fields:
- `schemaVersion` (must be `"1.2.1"`)
- `type` (must be `"routine"`)
- `id` (non-empty string)
- `title` (non-empty string)
- `bodyModel` (`"human-2d-v1"` or `"human-3d-v1"`)
- `items` (array, min length 1)

## Supported rotation formats
Each `pose.jointRotations.<jointName>` must be either Euler or quaternion.

### Euler format
```json
{ "x": 10, "y": 0, "z": -5, "order": "XYZ", "unit": "deg" }
```
- Required: `x`, `y`, `z` (numbers)
- Optional `order`: `XYZ`, `XZY`, `YXZ`, `YZX`, `ZXY`, `ZYX`
- Optional `unit`: `rad` or `deg`

### Quaternion format
```json
[0, 0, 0, 1]
```
- Exactly 4 numbers in `[x, y, z, w]` order

## Timing structure and common mistakes
For timed cue items:

```json
"timing": { "startMs": 0, "durationMs": 1500 }
```

Rules:
- `startMs`: integer >= 0
- `durationMs`: integer >= 0

Common mistakes to avoid:
- Wrong `schemaVersion` (must be `"1.2.1"`)
- Missing required top-level fields
- Returning an array instead of a single object
- Non-integer timing values
- Extra unsupported fields where `additionalProperties: false`
- Quaternion with fewer/more than 4 numbers
- Invalid Euler `order` or `unit`
- Wrapping JSON output in markdown/code fences

## Complete valid example script
```json
{
  "schemaVersion": "1.2.1",
  "type": "routine",
  "id": "demo-full-body-001",
  "title": "Demo Full Body Sequence",
  "description": "Simple routine demonstrating movement, dialogue, text, and countdown cues.",
  "bodyModel": "human-3d-v1",
  "renderHints": {
    "dimension": "3d"
  },
  "items": [
    {
      "kind": "movementStep",
      "id": "step-neutral",
      "title": "Neutral stance",
      "durationMs": 1200,
      "pose": {
        "jointRotations": {
          "pelvis": { "x": 0, "y": 0, "z": 0, "unit": "deg", "order": "XYZ" },
          "shoulderL": { "x": 12, "y": -8, "z": 0, "unit": "deg", "order": "XYZ" },
          "shoulderR": { "x": 12, "y": 8, "z": 0, "unit": "deg", "order": "XYZ" },
          "hipL": [0, 0, 0, 1],
          "hipR": [0, 0, 0, 1]
        }
      }
    },
    {
      "kind": "dialogueCue",
      "id": "coach-1",
      "speaker": "Coach",
      "text": "Brace your core and keep breathing.",
      "timing": { "startMs": 0, "durationMs": 1800 }
    },
    {
      "kind": "textCue",
      "id": "banner-1",
      "text": "Round 1",
      "placement": { "x": "50%", "y": "12%" },
      "styleToken": "headline",
      "timing": { "startMs": 0, "durationMs": 1400 }
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
      "kind": "rest",
      "id": "rest-short",
      "title": "Reset",
      "durationMs": 2000
    }
  ]
}
```
