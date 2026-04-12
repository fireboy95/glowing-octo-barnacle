import { buildRendererFrame } from './renderer';
import { resolveActiveCameraCue, resolveNextCameraCue, type CameraCue, type OverlayCue } from './renderer3d/PlaybackBridge';
import { interpolateNormalizedTimelinePose } from './timeline';
import Ajv2020 from 'ajv/dist/2020';
import routineSchema from '../schema/routine-1.1.0.schema.json';
import {
  validateRoutineAfterSchema,
  type CombinedValidationResult,
  type AjvLikeValidateFunction,
} from './validation/domainValidation3d';

const SAMPLE_INPUT = {
  schemaVersion: '1.2.1',
  type: 'routine',
  id: 'trainer-kitchen-sink-001',
  title: 'Trainer Kitchen Sink Demo',
  description:
    'Schema-rich demo routine combining trainer exercise steps with dialogue/text/countdown/overlay/filter/camera cues.',
  bodyModel: 'human-3d-v1',
  renderHints: {
    dimension: '3d',
  },
  items: [
    {
      kind: 'exercise',
      id: 'block-warmup',
      title: 'Warmup Combo',
      description: 'Alternating trainer-style warmup poses with smooth transitions.',
      repeat: 2,
      metadata: {
        objective: 'Raise temperature and mobility',
      },
      steps: [
        {
          kind: 'movementStep',
          id: 'warmup-neutral',
          title: 'Neutral Athletic Stance',
          durationMs: 800,
          easing: 'easeInOut',
          transitionMs: 220,
          blend: 'interpolate',
          metadata: { cue: 'brace-core' },
          pose: {
            jointRotations: {
              pelvis: { x: 0, y: 0, z: 0, unit: 'deg', order: 'XYZ' },
              spineUpper: { x: 6, y: 0, z: 0, unit: 'deg', order: 'XYZ' },
              shoulderL: { x: 18, y: -10, z: 6, unit: 'deg', order: 'XYZ' },
              shoulderR: { x: 18, y: 10, z: -6, unit: 'deg', order: 'XYZ' },
              elbowL: { x: 28, y: 0, z: 0, unit: 'deg', order: 'XYZ' },
              elbowR: { x: 28, y: 0, z: 0, unit: 'deg', order: 'XYZ' },
              hipL: [0, 0, 0, 1],
              hipR: [0, 0, 0, 1],
              kneeL: [0, 0, 0, 1],
              kneeR: [0, 0, 0, 1],
            },
          },
        },
        {
          kind: 'movementStep',
          id: 'warmup-squat-load',
          title: 'Squat Load',
          durationMs: 720,
          easing: 'easeOut',
          transitionMs: 200,
          blend: 'interpolate',
          pose: {
            jointRotations: {
              pelvis: { x: -8, y: 0, z: 0, unit: 'deg', order: 'XYZ' },
              spineUpper: { x: 14, y: 0, z: 0, unit: 'deg', order: 'XYZ' },
              shoulderL: { x: 24, y: -8, z: 8, unit: 'deg', order: 'XYZ' },
              shoulderR: { x: 24, y: 8, z: -8, unit: 'deg', order: 'XYZ' },
              elbowL: { x: 44, y: 0, z: 0, unit: 'deg', order: 'XYZ' },
              elbowR: { x: 44, y: 0, z: 0, unit: 'deg', order: 'XYZ' },
              hipL: { x: -24, y: 0, z: 0, unit: 'deg', order: 'XYZ' },
              hipR: { x: -24, y: 0, z: 0, unit: 'deg', order: 'XYZ' },
              kneeL: { x: 32, y: 0, z: 0, unit: 'deg', order: 'XYZ' },
              kneeR: { x: 32, y: 0, z: 0, unit: 'deg', order: 'XYZ' },
            },
          },
        },
        {
          kind: 'movementStep',
          id: 'warmup-drive-left',
          title: 'Left Knee Drive',
          durationMs: 560,
          easing: 'easeIn',
          transitionMs: 180,
          blend: 'interpolate',
          pose: {
            jointRotations: {
              pelvis: { x: -2, y: -5, z: 0, unit: 'deg', order: 'XYZ' },
              spineUpper: { x: 12, y: -6, z: 0, unit: 'deg', order: 'XYZ' },
              shoulderL: { x: 16, y: -24, z: 10, unit: 'deg', order: 'XYZ' },
              shoulderR: { x: 28, y: 14, z: -10, unit: 'deg', order: 'XYZ' },
              elbowL: { x: 58, y: 0, z: 0, unit: 'deg', order: 'XYZ' },
              elbowR: { x: 40, y: 0, z: 0, unit: 'deg', order: 'XYZ' },
              hipL: { x: 18, y: 0, z: 0, unit: 'deg', order: 'XYZ' },
              kneeL: { x: -36, y: 0, z: 0, unit: 'deg', order: 'XYZ' },
              hipR: { x: -10, y: 0, z: 0, unit: 'deg', order: 'XYZ' },
              kneeR: { x: 22, y: 0, z: 0, unit: 'deg', order: 'XYZ' },
            },
          },
        },
      ],
    },
    {
      kind: 'dialogueCue',
      id: 'coach-brace',
      speaker: 'Coach',
      text: 'Stay tall through your chest and drive through the floor.',
      audioRef: 'coach/warmup-01.ogg',
      timing: { startMs: 250, durationMs: 2300 },
      metadata: { importance: 'high' },
    },
    {
      kind: 'textCue',
      id: 'on-screen-set',
      text: 'Block A • Warmup',
      placement: { x: '50%', y: '10%' },
      styleToken: 'headline',
      animationIn: { name: 'fadeInUp', durationMs: 260 },
      animationOut: { name: 'fadeOut', durationMs: 220 },
      timing: { startMs: 0, durationMs: 1800 },
      metadata: { emphasis: 'section-title' },
    },
    {
      kind: 'countdownCue',
      id: 'set-countdown',
      startValue: 5,
      intervalMs: 1000,
      label: 'Get ready',
      styleToken: 'countdown',
      timing: { startMs: 300, durationMs: 5000 },
      metadata: { audible: true },
    },
    {
      kind: 'overlaySprite',
      id: 'logo-watermark',
      asset: 'assets/ui/trainer-badge.svg',
      anchor: { x: '88%', y: '12%' },
      scale: 0.82,
      opacity: 0.92,
      zIndex: 9,
      timing: { startMs: 0, durationMs: 4200 },
      metadata: { role: 'watermark' },
    },
    {
      kind: 'overlayPolygon',
      id: 'heart-rate-zone',
      points: [
        { x: '8%', y: '78%' },
        { x: '36%', y: '78%' },
        { x: '36%', y: '92%' },
        { x: '8%', y: '92%' },
      ],
      fill: 'rgba(10, 90, 150, 0.26)',
      stroke: '#7fd3ff',
      opacity: 0.8,
      zIndex: 6,
      timing: { startMs: 400, durationMs: 3600 },
      metadata: { role: 'hud' },
    },
    {
      kind: 'videoFilterCue',
      id: 'filter-energy',
      filterId: 'film-grain',
      preset: 'film-grain',
      intensity: 0.45,
      blendMode: 'overlay',
      transitionInMs: 260,
      transitionOutMs: 280,
      timing: { startMs: 0, durationMs: 4200 },
      metadata: { phase: 'warmup' },
    },
    {
      kind: 'cameraCue',
      id: 'camera-sweep',
      timing: { startMs: 200, durationMs: 3000 },
      directives: [
        { type: 'orbit', angleRad: 0.45, radius: 3.3, height: 1.25, target: { x: 0, y: 0.2, z: 0 }, easing: 'easeInOut' },
        { type: 'fov', fovDeg: 52, easing: 'easeOut' },
      ],
      metadata: { intent: 'show-form' },
    },
    {
      kind: 'rest',
      id: 'transition-rest',
      title: 'Reset and breathe',
      durationMs: 900,
      metadata: { heartRateTarget: 'zone-2' },
    },
    {
      kind: 'movementStep',
      id: 'cooldown-neutral',
      title: 'Cooldown Neutral',
      durationMs: 1200,
      easing: 'easeInOut',
      transitionMs: 260,
      blend: 'interpolate',
      pose: {
        jointRotations: {
          pelvis: { x: 0, y: 0, z: 0, unit: 'deg', order: 'XYZ' },
          spineUpper: { x: 4, y: 0, z: 0, unit: 'deg', order: 'XYZ' },
          shoulderL: { x: 8, y: -4, z: 0, unit: 'deg', order: 'XYZ' },
          shoulderR: { x: 8, y: 4, z: 0, unit: 'deg', order: 'XYZ' },
          elbowL: { x: 16, y: 0, z: 0, unit: 'deg', order: 'XYZ' },
          elbowR: { x: 16, y: 0, z: 0, unit: 'deg', order: 'XYZ' },
          hipL: [0, 0, 0, 1],
          hipR: [0, 0, 0, 1],
        },
      },
      metadata: { phase: 'cooldown' },
    },
  ],
};

const CUSTOM_JSON_SCRIPT_AGENT_PROMPT = `# Custom JSON Script Agent Prompt

## Purpose and constraints
You are generating a JSON routine script that must validate against \`schema/routine-1.1.0.schema.json\` (schemaVersion is \`1.2.1\`).
Output must be one JSON object only (no markdown, no comments, no explanation text).
Do not include fields not defined by the schema.
Use realistic timing values in milliseconds.

Use this output instruction exactly:
"Return only valid JSON. Do not wrap in markdown. Do not include commentary."

This prompt is intended to be pasted into ChatGPT or another LLM to generate schema-valid JSON scripts.

## Required top-level schema fields
- \`schemaVersion\`: must be \`"1.2.1"\`
- \`type\`: must be \`"routine"\`
- \`id\`: non-empty string
- \`title\`: non-empty string
- \`bodyModel\`: \`"human-2d-v1"\` or \`"human-3d-v1"\`
- \`items\`: array with at least 1 item

## Supported joint rotation formats
Each entry in \`pose.jointRotations\` supports one of:

1) Euler object
\`\`\`json
{ "x": 10, "y": 0, "z": -5, "order": "XYZ", "unit": "deg" }
\`\`\`
- \`x\`, \`y\`, \`z\` are numbers and required.
- \`order\` optional, one of XYZ/XZY/YXZ/YZX/ZXY/ZYX.
- \`unit\` optional, \`"rad"\` or \`"deg"\`.

2) Quaternion array
\`\`\`json
[0, 0, 0, 1]
\`\`\`
- Exactly four numbers: \`[x, y, z, w]\`.

## Timing structure
Timed cue items use:
\`\`\`json
"timing": { "startMs": 0, "durationMs": 1500 }
\`\`\`
- \`startMs\`: integer >= 0
- \`durationMs\`: integer >= 0

## Runtime behavior notes (important)
- \`cameraCue.directives\`: runtime applies \`lookAt\`, \`panTo\`, \`position\`, \`yaw/pitch/roll\`, \`orbit\`, \`dolly\`, and \`fov\`.
- Camera directive \`easing\` is preserved and used for interpolation; include it when you want non-linear transitions.
- \`orbit.target\` is supported and preserved.
- \`textCue.placement\`, \`textCue.styleToken\`, \`textCue.animationIn\`, and \`textCue.animationOut\` are preserved in cue payload for downstream consumers.
- Overlay \`anchor\` and point coordinates support numeric values or \`positionUnitValue\` strings such as \`"64px"\` and \`"25%"\`.

## Common mistakes to avoid
- Wrong \`schemaVersion\` (must be \`"1.2.1"\`).
- Missing required top-level fields.
- Returning an array instead of a single object.
- Using non-integer timing values.
- Adding unknown properties (schema uses \`additionalProperties: false\` in many objects).
- Invalid quaternion length (must be 4).
- Invalid Euler \`order\` or \`unit\`.
- Wrapping JSON in markdown fences.

## Complete valid example script
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
}`;

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface Segment {
  from: string;
  to: string;
}

interface CameraState {
  position: Vec3;
  target: Vec3;
  up: Vec3;
  fovDeg: number;
}

type CameraDirective =
  | { type: 'lookAt' | 'panTo'; target: Vec3; easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' }
  | { type: 'position'; position: Vec3; easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' }
  | { type: 'yaw/pitch/roll'; yawRad: number; pitchRad: number; rollRad: number; easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' }
  | { type: 'orbit'; angleRad: number; radius?: number; height?: number; target?: Vec3; easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' }
  | { type: 'dolly'; amount: number; easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' }
  | { type: 'fov'; fovDeg: number; easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' };

interface ProjectedPoint {
  x: number;
  y: number;
  depth: number;
}

interface AnimationRoutine {
  id: string;
  label: string;
  description: string;
  speedMultiplier: number;
  transform: (joints: Record<string, Vec3>, phase: number, cycle: number) => void;
}

const BASE_JOINTS: Record<string, Vec3> = {
  pelvis: { x: 0, y: 0, z: 0 },
  spineLower: { x: 0, y: 0.24, z: 0 },
  spineUpper: { x: 0, y: 0.52, z: 0 },
  neck: { x: 0, y: 0.74, z: 0 },
  head: { x: 0, y: 0.9, z: 0 },
  clavicleL: { x: -0.16, y: 0.58, z: 0 },
  shoulderL: { x: -0.28, y: 0.56, z: 0 },
  elbowL: { x: -0.46, y: 0.42, z: 0 },
  wristL: { x: -0.58, y: 0.28, z: 0 },
  clavicleR: { x: 0.16, y: 0.58, z: 0 },
  shoulderR: { x: 0.28, y: 0.56, z: 0 },
  elbowR: { x: 0.46, y: 0.42, z: 0 },
  wristR: { x: 0.58, y: 0.28, z: 0 },
  hipL: { x: -0.12, y: -0.06, z: 0 },
  kneeL: { x: -0.14, y: -0.46, z: 0 },
  ankleL: { x: -0.14, y: -0.88, z: 0.04 },
  hipR: { x: 0.12, y: -0.06, z: 0 },
  kneeR: { x: 0.14, y: -0.46, z: 0 },
  ankleR: { x: 0.14, y: -0.88, z: 0.04 },
};

const SEGMENTS: Segment[] = [
  { from: 'pelvis', to: 'spineLower' },
  { from: 'spineLower', to: 'spineUpper' },
  { from: 'spineUpper', to: 'neck' },
  { from: 'neck', to: 'head' },
  { from: 'spineUpper', to: 'clavicleL' },
  { from: 'clavicleL', to: 'shoulderL' },
  { from: 'shoulderL', to: 'elbowL' },
  { from: 'elbowL', to: 'wristL' },
  { from: 'spineUpper', to: 'clavicleR' },
  { from: 'clavicleR', to: 'shoulderR' },
  { from: 'shoulderR', to: 'elbowR' },
  { from: 'elbowR', to: 'wristR' },
  { from: 'pelvis', to: 'hipL' },
  { from: 'hipL', to: 'kneeL' },
  { from: 'kneeL', to: 'ankleL' },
  { from: 'pelvis', to: 'hipR' },
  { from: 'hipR', to: 'kneeR' },
  { from: 'kneeR', to: 'ankleR' },
];

const BODY_RADIUS_BY_JOINT: Record<string, number> = {
  pelvis: 0.16,
  spineLower: 0.18,
  spineUpper: 0.2,
  neck: 0.09,
  head: 0.13,
  clavicleL: 0.09,
  shoulderL: 0.11,
  elbowL: 0.09,
  wristL: 0.07,
  clavicleR: 0.09,
  shoulderR: 0.11,
  elbowR: 0.09,
  wristR: 0.07,
  hipL: 0.12,
  kneeL: 0.1,
  ankleL: 0.08,
  hipR: 0.12,
  kneeR: 0.1,
  ankleR: 0.08,
};

let currentNormalizedPose = buildRendererFrame(SAMPLE_INPUT).pose;
type NormalizedPose = ReturnType<typeof buildRendererFrame>['pose'];
interface ScriptPreviewFrame {
  pose: NormalizedPose;
  durationMs: number;
}

interface ScriptPreviewTextCue {
  type: 'dialogue' | 'text' | 'countdown';
  startMs: number;
  endMs: number;
  text: string;
  payload?: Record<string, unknown>;
  startValue?: number;
  intervalMs?: number;
}

interface ScriptPreviewCameraCue {
  cue: CameraCue;
}

interface ScriptPreviewOverlayCue {
  cue: OverlayCue;
}

let scriptPreviewFrames: ScriptPreviewFrame[] = [{ pose: currentNormalizedPose, durationMs: 1500 }];
let scriptPreviewTextCues: ScriptPreviewTextCue[] = [];
let scriptPreviewCameraCues: ScriptPreviewCameraCue[] = [];
let scriptPreviewOverlayCues: ScriptPreviewOverlayCue[] = [];
let scriptPreviewTotalDurationMs = 1500;
let currentAnimationSeconds = 0;
let animationHandle: number | null = null;
let animationStart = 0;
let selectedRoutineId = 'reverse-lunge-knee-drive';
const routineAjv = new Ajv2020({ allErrors: true, strict: false });
const validateRoutineSchema = routineAjv.compile(routineSchema) as AjvLikeValidateFunction;

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function buildAppMarkup(): string {
  return `
    <main class="app-shell">
      <h1>Renderer Input Runner</h1>
      <p class="app-intro">
        Provide a JSON script and execute it. Routine schema reference:
        <code>schema/routine-1.1.0.schema.json</code> (file contents currently expect
        <code>schemaVersion: "1.2.1"</code>).
      </p>

      <section class="input-panel">
        <h2>Script Input</h2>
        <label for="renderer-input">JSON Script</label>
        <textarea id="renderer-input" rows="7" spellcheck="false"></textarea>

        <div class="actions">
          <button id="run-renderer" type="button">Execute Script</button>
          <button id="reset-sample" type="button">Reset sample</button>
          <button id="copy-agent-docs" type="button">Copy Agent Prompt</button>
          <span id="copy-status" role="status" aria-live="polite"></span>
        </div>
      </section>

      <section class="animation-controls">
        <h2>Exercise animation routines</h2>
        <p>Select an example routine to preview different workout-style motions.</p>
        <label for="animation-routine">Routine</label>
        <select id="animation-routine"></select>
        <p id="animation-routine-description" class="routine-description" aria-live="polite"></p>
      </section>

      <section class="workspace">
        <section class="viewer-section">
          <h2>Workspace</h2>
          <canvas id="renderer-canvas" width="900" height="420" aria-label="3D skeleton renderer preview"></canvas>
        </section>

        <section class="workspace-output">
          <h3>Output</h3>
          <pre id="renderer-output" aria-live="polite"></pre>
        </section>
      </section>
    </main>
  `;
}

function setOutput(text: string): void {
  const output = document.getElementById('renderer-output');

  if (!output) {
    throw new Error('Output element #renderer-output was not found.');
  }

  output.textContent = text;
}

function normalizeQuaternionLength(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

const EXERCISE_ROUTINES: AnimationRoutine[] = [
  {
    id: 'jumping-jacks',
    label: 'Jumping Jacks',
    description: 'Full-body cardio with synchronized arm raises and split-step leg movement.',
    speedMultiplier: 1.25,
    transform: (joints, phase) => {
      const jackOpen = (Math.sin(phase) + 1) * 0.5;
      const rebound = Math.sin(phase * 2) ** 2;

      joints.pelvis.y += rebound * 0.08;
      joints.head.y += rebound * 0.05;

      joints.elbowL.y += jackOpen * 0.28;
      joints.wristL.y += jackOpen * 0.5;
      joints.elbowR.y += jackOpen * 0.28;
      joints.wristR.y += jackOpen * 0.5;

      joints.wristL.x -= jackOpen * 0.2;
      joints.wristR.x += jackOpen * 0.2;
      joints.elbowL.x -= jackOpen * 0.08;
      joints.elbowR.x += jackOpen * 0.08;

      joints.kneeL.x -= jackOpen * 0.18;
      joints.ankleL.x -= jackOpen * 0.3;
      joints.kneeR.x += jackOpen * 0.18;
      joints.ankleR.x += jackOpen * 0.3;

      joints.kneeL.y += rebound * 0.06;
      joints.kneeR.y += rebound * 0.06;
      joints.ankleL.y += rebound * 0.03;
      joints.ankleR.y += rebound * 0.03;
    },
  },
  {
    id: 'bodyweight-squats',
    label: 'Bodyweight Squats',
    description: 'Controlled squat pattern with hip hinge and arm counterbalance.',
    speedMultiplier: 0.9,
    transform: (joints, phase) => {
      const squatDepth = Math.max(0, (Math.sin(phase) + 1) * 0.5);
      const hinge = squatDepth * 0.16;

      joints.pelvis.y -= squatDepth * 0.28;
      joints.spineLower.z += hinge;
      joints.spineUpper.z += hinge * 1.25;
      joints.head.z += hinge * 1.35;

      joints.kneeL.y += squatDepth * 0.22;
      joints.ankleL.y += squatDepth * 0.08;
      joints.kneeR.y += squatDepth * 0.22;
      joints.ankleR.y += squatDepth * 0.08;

      joints.kneeL.z += squatDepth * 0.18;
      joints.kneeR.z += squatDepth * 0.18;

      joints.wristL.y += squatDepth * 0.06;
      joints.wristR.y += squatDepth * 0.06;
      joints.wristL.z -= squatDepth * 0.2;
      joints.wristR.z -= squatDepth * 0.2;
    },
  },
  {
    id: 'high-knees',
    label: 'High Knees',
    description: 'Alternating high-knee run with opposing arm drive for tempo work.',
    speedMultiplier: 2,
    transform: (joints, phase) => {
      const leftDrive = Math.max(0, Math.sin(phase));
      const rightDrive = Math.max(0, Math.sin(phase + Math.PI));
      const bounce = Math.abs(Math.sin(phase));

      joints.pelvis.y += bounce * 0.06;
      joints.head.y += bounce * 0.03;

      joints.kneeL.y += leftDrive * 0.36;
      joints.ankleL.y += leftDrive * 0.24;
      joints.kneeL.z += leftDrive * 0.23;

      joints.kneeR.y += rightDrive * 0.36;
      joints.ankleR.y += rightDrive * 0.24;
      joints.kneeR.z += rightDrive * 0.23;

      joints.elbowL.y += rightDrive * 0.2;
      joints.wristL.y += rightDrive * 0.28;
      joints.elbowR.y += leftDrive * 0.2;
      joints.wristR.y += leftDrive * 0.28;
    },
  },
  {
    id: 'lateral-lunges',
    label: 'Lateral Lunges',
    description: 'Side-to-side lunge flow that shifts weight and mobility across both hips.',
    speedMultiplier: 0.85,
    transform: (joints, phase) => {
      const sideShift = Math.sin(phase) * 0.23;
      const weightDrop = Math.abs(Math.sin(phase)) * 0.14;
      const leftLoaded = sideShift < 0;

      joints.pelvis.x += sideShift;
      joints.pelvis.y -= weightDrop;
      joints.spineUpper.x += sideShift * 0.4;

      joints.kneeL.y += leftLoaded ? weightDrop * 0.2 : weightDrop * 0.75;
      joints.kneeR.y += leftLoaded ? weightDrop * 0.75 : weightDrop * 0.2;

      joints.kneeL.x += sideShift * 0.5;
      joints.ankleL.x += sideShift * 0.7;
      joints.kneeR.x += sideShift * 0.5;
      joints.ankleR.x += sideShift * 0.7;

      joints.wristL.x -= sideShift * 0.45;
      joints.wristR.x -= sideShift * 0.45;
    },
  },
  {
    id: 'reverse-lunge-knee-drive',
    label: 'Reverse Lunge + Knee Drive',
    description:
      'Athletic reverse lunge that transitions into a controlled knee drive, similar to trainer balance drills.',
    speedMultiplier: 1,
    transform: (joints, phase, cycle) => {
      const leftLead = cycle;
      const rightLead = -cycle;
      const leftDepth = Math.max(0, leftLead);
      const rightDepth = Math.max(0, rightLead);
      const leftDrive = Math.max(0, -leftLead);
      const rightDrive = Math.max(0, -rightLead);
      const torsoCounter = Math.sin(phase) * 0.07;

      joints.pelvis.y -= (leftDepth + rightDepth) * 0.16;
      joints.pelvis.x += (rightDepth - leftDepth) * 0.08;
      joints.spineUpper.z += (leftDepth + rightDepth) * 0.1;
      joints.spineUpper.x += torsoCounter;

      joints.kneeL.y += leftDepth * 0.2 + leftDrive * 0.28;
      joints.ankleL.y += leftDepth * 0.06 + leftDrive * 0.14;
      joints.kneeL.z += leftDepth * 0.12 + leftDrive * 0.2;

      joints.kneeR.y += rightDepth * 0.2 + rightDrive * 0.28;
      joints.ankleR.y += rightDepth * 0.06 + rightDrive * 0.14;
      joints.kneeR.z += rightDepth * 0.12 + rightDrive * 0.2;

      joints.elbowL.y += rightDepth * 0.14 + leftDrive * 0.18;
      joints.wristL.y += rightDepth * 0.2 + leftDrive * 0.25;
      joints.elbowR.y += leftDepth * 0.14 + rightDrive * 0.18;
      joints.wristR.y += leftDepth * 0.2 + rightDrive * 0.25;
    },
  },
  {
    id: 'mountain-climbers',
    label: 'Mountain Climbers',
    description: 'Plank-position knee drives with alternating leg action and stable shoulder loading.',
    speedMultiplier: 1.8,
    transform: (joints, phase, cycle) => {
      const leftDrive = cycle;
      const rightDrive = -cycle;
      const leftTuck = Math.max(0, leftDrive);
      const rightTuck = Math.max(0, rightDrive);
      const baseLean = 0.22;
      const plankBounce = Math.abs(Math.sin(phase)) * 0.04;

      joints.pelvis.y -= 0.22 - plankBounce;
      joints.pelvis.z += baseLean;
      joints.spineLower.z += baseLean * 0.7;
      joints.spineUpper.z += baseLean;
      joints.head.z += baseLean * 1.05;

      joints.kneeL.y += leftTuck * 0.34;
      joints.ankleL.y += leftTuck * 0.22;
      joints.kneeL.z += leftTuck * 0.3;
      joints.ankleL.z += leftTuck * 0.16;

      joints.kneeR.y += rightTuck * 0.34;
      joints.ankleR.y += rightTuck * 0.22;
      joints.kneeR.z += rightTuck * 0.3;
      joints.ankleR.z += rightTuck * 0.16;

      joints.shoulderL.y -= plankBounce * 0.6;
      joints.shoulderR.y -= plankBounce * 0.6;
      joints.wristL.y -= plankBounce * 0.4;
      joints.wristR.y -= plankBounce * 0.4;
    },
  },
  {
    id: 'skater-hops',
    label: 'Skater Hops',
    description: 'Lateral power hops with opposite-leg trail and athletic arm swing for rhythm and control.',
    speedMultiplier: 1.25,
    transform: (joints, phase) => {
      const travel = Math.sin(phase) * 0.28;
      const landing = Math.abs(Math.sin(phase));
      const leftLoaded = travel < 0;
      const trailOffset = leftLoaded ? 0.18 : -0.18;

      joints.pelvis.x += travel;
      joints.pelvis.y -= landing * 0.1;
      joints.spineUpper.x += travel * 0.45;
      joints.head.x += travel * 0.28;

      joints.kneeL.y += leftLoaded ? landing * 0.22 : landing * 0.08;
      joints.kneeR.y += leftLoaded ? landing * 0.08 : landing * 0.22;
      joints.ankleL.x += leftLoaded ? -0.03 : trailOffset;
      joints.ankleR.x += leftLoaded ? trailOffset : 0.03;

      joints.kneeL.z += leftLoaded ? landing * 0.18 : landing * 0.06;
      joints.kneeR.z += leftLoaded ? landing * 0.06 : landing * 0.18;

      joints.elbowL.x -= travel * 0.55;
      joints.wristL.x -= travel * 0.72;
      joints.elbowR.x -= travel * 0.55;
      joints.wristR.x -= travel * 0.72;
      joints.wristL.y += landing * 0.14;
      joints.wristR.y += landing * 0.14;
    },
  },
  {
    id: 'shadow-boxing',
    label: 'Shadow Boxing Combo',
    description: 'Alternating jab-cross style strikes with trunk rotation and relaxed bounce between punches.',
    speedMultiplier: 1.7,
    transform: (joints, phase, cycle) => {
      const pulse = cycle;
      const counterPulse = -cycle;
      const leftPunch = Math.max(0, pulse);
      const rightPunch = Math.max(0, counterPulse);
      const bounce = Math.abs(Math.sin(phase)) * 0.05;
      const trunkTwist = (rightPunch - leftPunch) * 0.14;

      joints.pelvis.y += bounce;
      joints.spineUpper.x += trunkTwist;
      joints.head.x += trunkTwist * 0.45;

      joints.elbowL.x -= leftPunch * 0.24;
      joints.wristL.x -= leftPunch * 0.36;
      joints.elbowL.z += leftPunch * 0.14;
      joints.wristL.z += leftPunch * 0.22;
      joints.wristL.y += leftPunch * 0.14;

      joints.elbowR.x += rightPunch * 0.24;
      joints.wristR.x += rightPunch * 0.36;
      joints.elbowR.z += rightPunch * 0.14;
      joints.wristR.z += rightPunch * 0.22;
      joints.wristR.y += rightPunch * 0.14;

      joints.kneeL.y += bounce * 0.38;
      joints.kneeR.y += bounce * 0.38;
      joints.ankleL.y += bounce * 0.24;
      joints.ankleR.y += bounce * 0.24;
    },
  },
  {
    id: 'script-preview',
    label: 'Script Preview',
    description:
      'Plays movementStep poses and timed cues (dialogue/text/countdown/camera) from your executed JSON script.',
    speedMultiplier: 0.45,
    transform: (joints, phase) => {
      const getActiveScriptPreviewPose = (): NormalizedPose => {
        const fallbackPose = currentNormalizedPose;
        if (scriptPreviewFrames.length === 0) {
          return fallbackPose;
        }

        if (scriptPreviewFrames.length === 1) {
          return scriptPreviewFrames[0]?.pose ?? fallbackPose;
        }

        const totalDurationMs = scriptPreviewFrames.reduce((total, frame) => total + frame.durationMs, 0);
        const loopMs = (currentAnimationSeconds * 1000) % Math.max(1, totalDurationMs);
        let cursorMs = 0;
        for (let index = 0; index < scriptPreviewFrames.length; index += 1) {
          const frame = scriptPreviewFrames[index];
          const frameStartMs = cursorMs;
          const frameEndMs = frameStartMs + frame.durationMs;
          if (loopMs < frameEndMs) {
            const nextFrame = scriptPreviewFrames[(index + 1) % scriptPreviewFrames.length];
            const alpha = frame.durationMs > 0 ? (loopMs - frameStartMs) / frame.durationMs : 1;
            const easedAlpha = clamp(alpha, 0, 1);

            if (!nextFrame || nextFrame === frame || easedAlpha <= 0) {
              return frame.pose ?? fallbackPose;
            }

            if (!frame.pose || !nextFrame.pose) {
              return frame.pose ?? nextFrame.pose ?? fallbackPose;
            }

            return interpolateNormalizedTimelinePose(frame.pose, nextFrame.pose, easedAlpha);
          }

          cursorMs = frameEndMs;
        }

        return scriptPreviewFrames[scriptPreviewFrames.length - 1]?.pose ?? fallbackPose;
      };

      const activePose = getActiveScriptPreviewPose();
      const getJoint = (jointName: string): [number, number, number, number] => {
        const rotation = activePose?.jointRotations?.[jointName];
        if (!rotation) {
          return [0, 0, 0, 1];
        }

        return rotation;
      };

      const [shoulderLX, shoulderLY] = getJoint('shoulderL');
      const [shoulderRX, shoulderRY] = getJoint('shoulderR');
      const [elbowLX] = getJoint('elbowL');
      const [elbowRX] = getJoint('elbowR');
      const [hipLX, hipLY] = getJoint('hipL');
      const [hipRX, hipRY] = getJoint('hipR');
      const [kneeLX] = getJoint('kneeL');
      const [kneeRX] = getJoint('kneeR');

      const idle = Math.sin(phase * 0.55);

      joints.pelvis.y += idle * 0.02;
      joints.head.y += idle * 0.018;

      joints.elbowL.y += -shoulderLX * 0.32 - elbowLX * 0.24;
      joints.wristL.y += -shoulderLX * 0.52 - elbowLX * 0.4;
      joints.elbowR.y += -shoulderRX * 0.32 - elbowRX * 0.24;
      joints.wristR.y += -shoulderRX * 0.52 - elbowRX * 0.4;

      joints.elbowL.x += shoulderLY * 0.22;
      joints.wristL.x += shoulderLY * 0.36;
      joints.elbowR.x += shoulderRY * 0.22;
      joints.wristR.x += shoulderRY * 0.36;

      joints.kneeL.y += -hipLX * 0.2 - kneeLX * 0.18;
      joints.ankleL.y += -hipLX * 0.15 - kneeLX * 0.2;
      joints.kneeR.y += -hipRX * 0.2 - kneeRX * 0.18;
      joints.ankleR.y += -hipRX * 0.15 - kneeRX * 0.2;

      joints.kneeL.x += hipLY * 0.22;
      joints.ankleL.x += hipLY * 0.3;
      joints.kneeR.x += hipRY * 0.22;
      joints.ankleR.x += hipRY * 0.3;
    },
  },
];

function getSelectedRoutine(): AnimationRoutine {
  return EXERCISE_ROUTINES.find((routine) => routine.id === selectedRoutineId) ?? EXERCISE_ROUTINES[0];
}

function projectPoint(point: Vec3, width: number, height: number, fovDeg: number): ProjectedPoint {
  const zOffset = Math.max(0.01, point.z);
  const focalLength = (height * 0.5) / Math.tan((fovDeg * Math.PI) / 360);
  const perspective = focalLength / zOffset;
  return {
    x: width / 2 + point.x * perspective,
    y: height / 2 - point.y * perspective,
    depth: zOffset,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getBoneLightness(depth: number): number {
  const normalizedDepth = clamp((depth - 2.25) / 1.9, 0, 1);
  return 74 - normalizedDepth * 38;
}

function toHsl(hue: number, saturation: number, lightness: number, alpha = 1): string {
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
}

function projectThickness(thickness: number, depth: number): number {
  return clamp((thickness * 320) / Math.max(0.01, depth), 2, 90);
}

interface AnimatedFrame {
  joints: Record<string, Vec3>;
  fovDeg: number;
}

function normalizeVector3(vector: Vec3): Vec3 {
  const length = Math.hypot(vector.x, vector.y, vector.z);
  if (length <= 1e-6) {
    return { x: 0, y: 0, z: 1 };
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  };
}

function crossProduct(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function dotProduct(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function applyCameraDirectives(base: CameraState, directives: CameraDirective[]): CameraState {
  return directives.reduce<CameraState>((state, directive) => {
    if (directive.type === 'lookAt' || directive.type === 'panTo') {
      return { ...state, target: directive.target };
    }

    if (directive.type === 'position') {
      return { ...state, position: directive.position };
    }

    if (directive.type === 'yaw/pitch/roll') {
      const cosPitch = Math.cos(directive.pitchRad);
      return {
        ...state,
        target: {
          x: state.position.x + Math.sin(directive.yawRad) * cosPitch,
          y: state.position.y + Math.sin(directive.pitchRad),
          z: state.position.z + Math.cos(directive.yawRad) * cosPitch,
        },
      };
    }

    if (directive.type === 'orbit') {
      const orbitTarget = directive.target ?? state.target;
      const radius = directive.radius ?? 3;
      return {
        ...state,
        position: {
          x: orbitTarget.x + Math.cos(directive.angleRad) * radius,
          y: directive.height ?? state.position.y,
          z: orbitTarget.z + Math.sin(directive.angleRad) * radius,
        },
        target: orbitTarget,
      };
    }

    if (directive.type === 'dolly') {
      const toward = {
        x: state.target.x - state.position.x,
        y: state.target.y - state.position.y,
        z: state.target.z - state.position.z,
      };
      const length = Math.max(0.01, Math.hypot(toward.x, toward.y, toward.z));
      const scale = (length + directive.amount) / length;
      return {
        ...state,
        position: {
          x: state.target.x - toward.x * scale,
          y: state.target.y - toward.y * scale,
          z: state.target.z - toward.z * scale,
        },
      };
    }

    if (directive.type === 'fov') {
      return { ...state, fovDeg: directive.fovDeg };
    }

    return state;
  }, base);
}

function lerpNumber(from: number, to: number, alpha: number): number {
  return from + (to - from) * alpha;
}

function resolveCameraStateAtLoopMs(loopMs: number): CameraState {
  const cues = scriptPreviewCameraCues.map((entry) => entry.cue);
  const base: CameraState = {
    position: { x: 0, y: 1.2, z: 3 },
    target: { x: 0, y: 1, z: 0 },
    up: { x: 0, y: 1, z: 0 },
    fovDeg: 50,
  };
  const activeCameraCue = resolveActiveCameraCue(cues, loopMs);
  if (!activeCameraCue) {
    return base;
  }

  const from = applyCameraDirectives(base, activeCameraCue.directives as CameraDirective[]);
  const next = resolveNextCameraCue(cues, loopMs);
  if (!next || next.timeMs <= activeCameraCue.timeMs) {
    return from;
  }

  const alpha = clamp((loopMs - activeCameraCue.timeMs) / (next.timeMs - activeCameraCue.timeMs), 0, 1);
  const to = applyCameraDirectives(base, next.directives as CameraDirective[]);

  return {
    position: {
      x: lerpNumber(from.position.x, to.position.x, alpha),
      y: lerpNumber(from.position.y, to.position.y, alpha),
      z: lerpNumber(from.position.z, to.position.z, alpha),
    },
    target: {
      x: lerpNumber(from.target.x, to.target.x, alpha),
      y: lerpNumber(from.target.y, to.target.y, alpha),
      z: lerpNumber(from.target.z, to.target.z, alpha),
    },
    up: from.up,
    fovDeg: lerpNumber(from.fovDeg, to.fovDeg, alpha),
  };
}

function buildAnimatedSkeleton(timeSeconds: number): AnimatedFrame {
  currentAnimationSeconds = timeSeconds;
  const routine = getSelectedRoutine();
  const phase = timeSeconds * 2.2 * routine.speedMultiplier;
  const cycle = Math.sin(phase);
  const leftArmInfluence = normalizeQuaternionLength(currentNormalizedPose.jointRotations.shoulderL?.[0] ?? 0);
  const rightArmInfluence = normalizeQuaternionLength(currentNormalizedPose.jointRotations.shoulderR?.[0] ?? 0);
  const leftElbowInfluence = normalizeQuaternionLength(currentNormalizedPose.jointRotations.elbowL?.[0] ?? 0);
  const rightElbowInfluence = normalizeQuaternionLength(currentNormalizedPose.jointRotations.elbowR?.[0] ?? 0);

  const joints: Record<string, Vec3> = {};

  for (const [joint, base] of Object.entries(BASE_JOINTS)) {
    joints[joint] = { ...base };
  }

  joints.pelvis.y += Math.sin(phase) * 0.03;
  joints.head.y += Math.sin(phase + 0.4) * 0.025;

  joints.elbowL.y += -0.1 * leftArmInfluence + Math.sin(phase) * 0.08;
  joints.wristL.y += -0.2 * leftElbowInfluence + Math.sin(phase + 0.6) * 0.1;
  joints.elbowR.y += -0.1 * rightArmInfluence + Math.sin(phase + Math.PI) * 0.08;
  joints.wristR.y += -0.2 * rightElbowInfluence + Math.sin(phase + Math.PI + 0.6) * 0.1;

  joints.kneeL.y += Math.sin(phase + Math.PI) * 0.06;
  joints.ankleL.y += Math.sin(phase + Math.PI) * 0.06;
  joints.kneeR.y += Math.sin(phase) * 0.06;
  joints.ankleR.y += Math.sin(phase) * 0.06;

  joints.elbowL.z += Math.cos(phase) * 0.08;
  joints.wristL.z += Math.cos(phase + 0.7) * 0.08;
  joints.elbowR.z += Math.cos(phase + Math.PI) * 0.08;
  joints.wristR.z += Math.cos(phase + Math.PI + 0.7) * 0.08;

  routine.transform(joints, phase, cycle);

  const loopMs = (timeSeconds * 1000) % Math.max(1, scriptPreviewTotalDurationMs);
  const cameraState = resolveCameraStateAtLoopMs(loopMs);
  const forward = normalizeVector3({
    x: cameraState.target.x - cameraState.position.x,
    y: cameraState.target.y - cameraState.position.y,
    z: cameraState.target.z - cameraState.position.z,
  });
  let right = normalizeVector3(crossProduct(forward, cameraState.up));
  if (Math.hypot(right.x, right.y, right.z) <= 1e-6) {
    right = { x: 1, y: 0, z: 0 };
  }
  const up = normalizeVector3(crossProduct(right, forward));

  for (const [joint, position] of Object.entries(joints)) {
    const relative = {
      x: position.x - cameraState.position.x,
      y: position.y - cameraState.position.y,
      z: position.z - cameraState.position.z,
    };
    joints[joint] = {
      x: dotProduct(relative, right),
      y: dotProduct(relative, up),
      z: dotProduct(relative, forward),
    };
  }

  return { joints, fovDeg: cameraState.fovDeg };
}

function drawRendererFrame(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, timeMs: number): void {
  const width = canvas.width;
  const height = canvas.height;
  const t = (timeMs - animationStart) / 1000;
  const animatedFrame = buildAnimatedSkeleton(t);
  const joints = animatedFrame.joints;
  const scriptLoopMs = (t * 1000) % Math.max(1, scriptPreviewTotalDurationMs);
  const routine = getSelectedRoutine();

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(120, 170, 255, 0.22)');
  gradient.addColorStop(1, 'rgba(120, 170, 255, 0.02)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const projectedJoints: Record<string, ProjectedPoint> = {};
  for (const [joint, position] of Object.entries(joints)) {
    projectedJoints[joint] = projectPoint(position, width, height, animatedFrame.fovDeg);
  }

  const groundY = height * 0.86;
  const pelvisProjection = projectedJoints.pelvis;
  if (pelvisProjection) {
    const shadowWidth = 180 + clamp((pelvisProjection.depth - 2.4) * 75, -30, 120);
    const shadowHeight = 38 + clamp((pelvisProjection.depth - 2.4) * 20, -8, 35);
    const shadowGradient = ctx.createRadialGradient(
      pelvisProjection.x,
      groundY,
      12,
      pelvisProjection.x,
      groundY,
      shadowWidth * 0.48,
    );
    shadowGradient.addColorStop(0, 'rgba(8, 16, 32, 0.48)');
    shadowGradient.addColorStop(1, 'rgba(8, 16, 32, 0)');
    ctx.fillStyle = shadowGradient;
    ctx.beginPath();
    ctx.ellipse(pelvisProjection.x, groundY, shadowWidth, shadowHeight, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const sortedSegments = [...SEGMENTS].sort((a, b) => projectedJoints[b.to].depth - projectedJoints[a.to].depth);

  const torsoPoints = ['clavicleL', 'shoulderL', 'hipL', 'pelvis', 'hipR', 'shoulderR', 'clavicleR']
    .map((joint) => projectedJoints[joint])
    .filter((point): point is ProjectedPoint => Boolean(point));

  if (torsoPoints.length >= 4) {
    const averageTorsoDepth = torsoPoints.reduce((sum, point) => sum + point.depth, 0) / torsoPoints.length;
    const torsoGradient = ctx.createLinearGradient(0, Math.min(...torsoPoints.map((point) => point.y)), 0, Math.max(...torsoPoints.map((point) => point.y)));
    const torsoLightness = getBoneLightness(averageTorsoDepth);
    torsoGradient.addColorStop(0, toHsl(27, 55, torsoLightness + 7, 0.6));
    torsoGradient.addColorStop(1, toHsl(21, 50, torsoLightness - 8, 0.52));
    ctx.fillStyle = torsoGradient;
    ctx.beginPath();
    ctx.moveTo(torsoPoints[0].x, torsoPoints[0].y);
    for (let index = 1; index < torsoPoints.length; index += 1) {
      ctx.lineTo(torsoPoints[index].x, torsoPoints[index].y);
    }
    ctx.closePath();
    ctx.fill();
  }

  for (const segment of sortedSegments) {
    const start = projectedJoints[segment.from];
    const end = projectedJoints[segment.to];

    if (!start || !end) {
      continue;
    }

    const averageDepth = (start.depth + end.depth) / 2;
    const startThickness = projectThickness(BODY_RADIUS_BY_JOINT[segment.from] ?? 0.1, start.depth);
    const endThickness = projectThickness(BODY_RADIUS_BY_JOINT[segment.to] ?? 0.09, end.depth);
    const bodyThickness = (startThickness + endThickness) / 2;
    const skinLightness = getBoneLightness(averageDepth);
    const limbGradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
    limbGradient.addColorStop(0, toHsl(24, 58, skinLightness + 8, 0.7));
    limbGradient.addColorStop(0.55, toHsl(20, 52, skinLightness, 0.72));
    limbGradient.addColorStop(1, toHsl(17, 48, skinLightness - 6, 0.68));

    ctx.strokeStyle = 'rgba(44, 24, 12, 0.22)';
    ctx.lineWidth = bodyThickness * 1.12;
    ctx.beginPath();
    ctx.moveTo(start.x + 1.5, start.y + 1.5);
    ctx.lineTo(end.x + 1.5, end.y + 1.5);
    ctx.stroke();

    ctx.strokeStyle = limbGradient;
    ctx.lineWidth = bodyThickness;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  const headProjection = projectedJoints.head;
  if (headProjection) {
    const headRadius = projectThickness(BODY_RADIUS_BY_JOINT.head, headProjection.depth);
    const headGradient = ctx.createRadialGradient(
      headProjection.x - headRadius * 0.35,
      headProjection.y - headRadius * 0.4,
      headRadius * 0.3,
      headProjection.x,
      headProjection.y,
      headRadius,
    );
    const headLightness = getBoneLightness(headProjection.depth);
    headGradient.addColorStop(0, toHsl(28, 55, headLightness + 14, 0.78));
    headGradient.addColorStop(1, toHsl(19, 46, headLightness - 6, 0.74));
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.ellipse(headProjection.x, headProjection.y, headRadius * 0.85, headRadius, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.lineCap = 'round';
  for (const segment of sortedSegments) {
    const start = projectedJoints[segment.from];
    const end = projectedJoints[segment.to];

    if (!start || !end) {
      continue;
    }

    const averageDepth = (start.depth + end.depth) / 2;
    const normalizedDepth = clamp((averageDepth - 2.2) / 2.1, 0, 1);
    const lineWidth = Math.max(2.2, 16 - averageDepth * 2.6);
    const glowWidth = lineWidth * 1.8;
    const startLightness = getBoneLightness(start.depth);
    const endLightness = getBoneLightness(end.depth);
    const boneGradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
    boneGradient.addColorStop(0, toHsl(204, 88, startLightness, 0.96));
    boneGradient.addColorStop(0.5, toHsl(196, 100, (startLightness + endLightness) / 2 + 5, 0.98));
    boneGradient.addColorStop(1, toHsl(204, 90, endLightness, 0.96));

    ctx.strokeStyle = `rgba(122, 226, 255, ${0.2 - normalizedDepth * 0.08})`;
    ctx.lineWidth = glowWidth;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    ctx.strokeStyle = boneGradient;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  for (const point of Object.values(projectedJoints)) {
    const radius = Math.max(2.2, 11 - point.depth * 2);
    const coreRadius = radius * 0.56;

    const haloGradient = ctx.createRadialGradient(point.x, point.y, coreRadius * 0.2, point.x, point.y, radius);
    haloGradient.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
    haloGradient.addColorStop(0.7, 'rgba(170, 238, 255, 0.9)');
    haloGradient.addColorStop(1, 'rgba(120, 208, 255, 0.22)');

    ctx.fillStyle = haloGradient;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
    ctx.beginPath();
    ctx.arc(point.x - radius * 0.2, point.y - radius * 0.2, coreRadius * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#d5e8ff';
  ctx.font = '14px Inter, system-ui, sans-serif';
  ctx.fillText(`Routine: ${routine.label}`, 16, 28);
  ctx.font = '12px Inter, system-ui, sans-serif';
  ctx.fillStyle = 'rgba(213, 232, 255, 0.8)';
  ctx.fillText(routine.description, 16, 48);

  if (selectedRoutineId === 'script-preview') {
    drawScriptPreviewCues(ctx, width, height, scriptLoopMs);
  }
}

function drawScriptPreviewCues(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  loopMs: number,
): void {
  const activeCues = scriptPreviewTextCues.filter((cue) => loopMs >= cue.startMs && loopMs <= cue.endMs);
  if (activeCues.length === 0) {
    return;
  }

  let topOffset = 72;
  for (const cue of activeCues) {
    const cueText =
      cue.type === 'countdown' && cue.startValue !== undefined && cue.intervalMs
        ? `${Math.max(0, cue.startValue - Math.floor((loopMs - cue.startMs) / cue.intervalMs))}`
        : cue.text;
    const fontSize = cue.type === 'countdown' ? 34 : cue.type === 'text' ? 28 : 20;
    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(5, 16, 35, 0.62)';
    const paddingX = 14;
    const paddingY = 8;
    const widthEstimate = ctx.measureText(cueText).width + paddingX * 2;
    const rectX = width / 2 - widthEstimate / 2;
    const rectY = topOffset - 2;
    const rectHeight = fontSize + paddingY * 2;
    ctx.fillRect(rectX, rectY, widthEstimate, rectHeight);
    ctx.fillStyle = '#e6f5ff';
    ctx.fillText(cueText, width / 2, topOffset + paddingY * 0.5);
    topOffset += rectHeight + 8;
  }
  ctx.textAlign = 'start';
}

function updateRoutineDescription(): void {
  const descriptionElement = document.getElementById('animation-routine-description');
  const routine = getSelectedRoutine();

  if (!(descriptionElement instanceof HTMLParagraphElement)) {
    return;
  }

  descriptionElement.textContent = routine.description;
}

function startRendererAnimation(): void {
  const canvas = document.getElementById('renderer-canvas');

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('Renderer canvas #renderer-canvas was not found.');
  }

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not acquire a 2D drawing context for #renderer-canvas.');
  }

  if (animationHandle !== null) {
    cancelAnimationFrame(animationHandle);
    animationHandle = null;
  }

  animationStart = performance.now();

  const draw = (timestamp: number): void => {
    drawRendererFrame(canvas, context, timestamp);
    animationHandle = requestAnimationFrame(draw);
  };

  animationHandle = requestAnimationFrame(draw);
}

function extractFirstJsonObject(input: string): { value: string; trailing: string } | null {
  const source = input.trim();

  if (!source.startsWith('{')) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (character === '\\') {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }

      continue;
    }

    if (character === '"') {
      inString = true;
      continue;
    }

    if (character === '{') {
      depth += 1;
      continue;
    }

    if (character === '}') {
      depth -= 1;

      if (depth === 0) {
        return {
          value: source.slice(0, index + 1),
          trailing: source.slice(index + 1).trim(),
        };
      }
    }
  }

  return null;
}

function parseRendererInput(input: string): { parsedInput: unknown; warning?: string } {
  try {
    return { parsedInput: JSON.parse(input) };
  } catch (error: unknown) {
    if (!(error instanceof SyntaxError)) {
      throw error;
    }

    const extracted = extractFirstJsonObject(input);
    if (!extracted || extracted.trailing.length === 0) {
      throw error;
    }

    return {
      parsedInput: JSON.parse(extracted.value),
      warning:
        'Detected multiple JSON objects in the script input. Only the first object was executed. ' +
        'Remove extra objects and run again to avoid ambiguity.',
    };
  }
}

function formatRoutineValidationFailure(validation: CombinedValidationResult): string {
  const lines: string[] = ['Invalid JSON script:'];
  const formatPath = (path: string): string => (path.length > 0 ? path : '(root)');

  for (const schemaError of validation.schemaErrors) {
    lines.push(`- Schema ${formatPath(schemaError.path)}: ${schemaError.message}`);
  }

  for (const domainError of validation.domainErrors) {
    lines.push(`- Domain ${formatPath(domainError.path)}: ${domainError.message}`);
  }

  lines.push(
    'Hint: validate your script against schema/routine-1.1.0.schema.json (file contents expect schemaVersion "1.2.1").',
  );
  return lines.join('\n');
}

function asObjectRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : undefined;
}

function resolveUnsupportedRuntimeWarnings(parsedInput: unknown): string[] {
  const unsupportedKinds = new Set<string>();
  const unsupportedKeysByKind = new Map<string, Set<string>>();
  const unsupportedKeyAllowList: Record<string, Set<string>> = {
    movementStep: new Set(['blend', 'easing', 'transitionMs', 'metadata']),
    exercise: new Set(['repeat', 'metadata']),
    rest: new Set(['metadata']),
    dialogueCue: new Set(['audioRef', 'metadata']),
    textCue: new Set(['placement', 'styleToken', 'animationIn', 'animationOut', 'metadata']),
    countdownCue: new Set(['styleToken', 'metadata']),
    overlaySprite: new Set(['metadata']),
    overlayPolygon: new Set(['metadata']),
    videoFilterCue: new Set(['intensity', 'blendMode', 'transitionInMs', 'transitionOutMs', 'metadata']),
    cameraCue: new Set(['metadata']),
  };

  const registerUnsupportedKey = (kind: string, key: string): void => {
    if (!unsupportedKeysByKind.has(kind)) {
      unsupportedKeysByKind.set(kind, new Set<string>());
    }
    unsupportedKeysByKind.get(kind)?.add(key);
  };

  const visit = (item: unknown): void => {
    const record = asObjectRecord(item);
    if (!record) {
      return;
    }
    const kind = typeof record.kind === 'string' ? record.kind : undefined;
    if (!kind) {
      return;
    }

    if (!(kind in unsupportedKeyAllowList) && kind !== 'movementStep' && kind !== 'exercise' && kind !== 'rest') {
      unsupportedKinds.add(kind);
      return;
    }

    const unsupportedKeys = unsupportedKeyAllowList[kind];
    if (unsupportedKeys) {
      for (const key of Object.keys(record)) {
        if (unsupportedKeys.has(key)) {
          registerUnsupportedKey(kind, key);
        }
      }
    }

    if (kind === 'exercise') {
      const steps = record.steps;
      if (Array.isArray(steps)) {
        for (const step of steps) {
          visit(step);
        }
      }
      return;
    }
  };

  const root = asObjectRecord(parsedInput);
  const items = root?.items;
  if (Array.isArray(items)) {
    for (const item of items) {
      visit(item);
    }
  }

  const lines: string[] = [];
  if (unsupportedKinds.size > 0) {
    lines.push(`Unsupported routine kinds (ignored): ${Array.from(unsupportedKinds).sort().join(', ')}`);
  }
  for (const [kind, keys] of Array.from(unsupportedKeysByKind.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`Unsupported ${kind} keys (currently no-op): ${Array.from(keys).sort().join(', ')}`);
  }
  return lines;
}

function runRenderer(): void {
  const inputElement = document.getElementById('renderer-input');

  if (!(inputElement instanceof HTMLTextAreaElement)) {
    throw new Error('Input element #renderer-input was not found.');
  }

  try {
    const { parsedInput, warning } = parseRendererInput(inputElement.value);
    const isObjectInput =
      typeof parsedInput === 'object' && parsedInput !== null && !Array.isArray(parsedInput);
    const isAdHocPoseInput = isObjectInput && 'pose' in parsedInput;

    if (!isAdHocPoseInput) {
      const validation = validateRoutineAfterSchema(parsedInput, validateRoutineSchema);
      if (!validation.valid) {
        setOutput(formatRoutineValidationFailure(validation));
        return;
      }
    }
    const frameInput = resolveRendererFrameInput(parsedInput);

    const result = buildRendererFrame(frameInput);
    currentNormalizedPose = result.pose;
    scriptPreviewFrames = resolveScriptPreviewFrames(parsedInput, currentNormalizedPose);
    const scriptPreviewCues = resolveScriptPreviewCues(parsedInput);
    scriptPreviewTextCues = scriptPreviewCues.textCues;
    scriptPreviewCameraCues = scriptPreviewCues.cameraCues;
    scriptPreviewOverlayCues = scriptPreviewCues.overlayCues;
    scriptPreviewTotalDurationMs = scriptPreviewCues.totalDurationMs;
    selectedRoutineId = 'script-preview';
    const routineSelect = document.getElementById('animation-routine');
    if (routineSelect instanceof HTMLSelectElement) {
      routineSelect.value = selectedRoutineId;
    }
    updateRoutineDescription();
    const warnings = [...(warning ? [warning] : []), ...resolveUnsupportedRuntimeWarnings(parsedInput)];
    const warningPrefix =
      warnings.length > 0 ? `Warnings:\n${warnings.map((line) => `- ${line}`).join('\n')}\n\n` : '';
    setOutput(`${warningPrefix}${formatJson(result)}`);
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      setOutput(
        `Invalid JSON script: ${error.message}\n` +
          'Hint: validate your script against schema/routine-1.1.0.schema.json ' +
          '(file contents expect schemaVersion "1.2.1").',
      );
      return;
    }

    const message = error instanceof Error ? error.message : 'Unknown error while running renderer.';
    setOutput(
      `Error: ${message}\n` +
        'Hint: validate your script against schema/routine-1.1.0.schema.json ' +
        '(file contents expect schemaVersion "1.2.1").',
    );
  }
}

function resolveRendererFrameInput(parsedInput: unknown): { pose: unknown } {
  const resolvePoseFromRoutineItem = (item: unknown): unknown | null => {
    if (typeof item !== 'object' || item === null) {
      return null;
    }

    const candidate = item as { kind?: unknown; pose?: unknown; steps?: unknown };

    if (candidate.kind === 'movementStep' && 'pose' in candidate) {
      return candidate.pose;
    }

    if (candidate.kind === 'exercise' && Array.isArray(candidate.steps)) {
      for (const step of candidate.steps) {
        const nestedPose = resolvePoseFromRoutineItem(step);
        if (nestedPose !== null) {
          return nestedPose;
        }
      }
    }

    return null;
  };

  if (typeof parsedInput === 'object' && parsedInput !== null && !Array.isArray(parsedInput)) {
    if ('pose' in parsedInput) {
      return { pose: (parsedInput as { pose: unknown }).pose };
    }

    if ('items' in parsedInput && Array.isArray((parsedInput as { items?: unknown }).items)) {
      for (const item of (parsedInput as { items: unknown[] }).items) {
        const pose = resolvePoseFromRoutineItem(item);
        if (pose !== null) {
          return { pose };
        }
      }
    }
  }

  throw new Error(
    'Input must be either a renderer frame object with `pose` or a routine script containing at least one `movementStep` pose (top-level or inside an `exercise` item).',
  );
}

function resolveScriptPreviewFrames(parsedInput: unknown, fallbackPose: NormalizedPose): ScriptPreviewFrame[] {
  const frames: ScriptPreviewFrame[] = [];
  const addFrame = (pose: unknown, durationMs?: unknown): void => {
    const normalizedDurationMs =
      typeof durationMs === 'number' && Number.isFinite(durationMs) && durationMs > 0
        ? Math.round(durationMs)
        : 1500;
    try {
      const normalized = buildRendererFrame({ pose }).pose;
      frames.push({ pose: normalized, durationMs: normalizedDurationMs });
    } catch {
      // Ignore malformed movementStep poses; runRenderer still validates the primary pose input.
    }
  };

  const visitItem = (item: unknown): void => {
    if (typeof item !== 'object' || item === null) {
      return;
    }

    const candidate = item as { kind?: unknown; pose?: unknown; durationMs?: unknown; steps?: unknown };
    if (candidate.kind === 'movementStep' && 'pose' in candidate) {
      addFrame(candidate.pose, candidate.durationMs);
      return;
    }

    if (candidate.kind === 'exercise' && Array.isArray(candidate.steps)) {
      for (const step of candidate.steps) {
        visitItem(step);
      }
    }
  };

  if (typeof parsedInput === 'object' && parsedInput !== null && !Array.isArray(parsedInput)) {
    if ('items' in parsedInput && Array.isArray((parsedInput as { items?: unknown }).items)) {
      for (const item of (parsedInput as { items: unknown[] }).items) {
        visitItem(item);
      }
    } else if ('pose' in parsedInput) {
      addFrame((parsedInput as { pose: unknown }).pose, 1500);
    }
  }

  if (frames.length === 0) {
    frames.push({ pose: fallbackPose, durationMs: 1500 });
  }

  return frames;
}

function resolveScriptPreviewCues(parsedInput: unknown): {
  textCues: ScriptPreviewTextCue[];
  cameraCues: ScriptPreviewCameraCue[];
  overlayCues: ScriptPreviewOverlayCue[];
  totalDurationMs: number;
} {
  const textCues: ScriptPreviewTextCue[] = [];
  const cameraCues: ScriptPreviewCameraCue[] = [];
  const overlayCues: ScriptPreviewOverlayCue[] = [];
  let cursorMs = 0;

  const getTimingWindow = (item: { timing?: unknown }): { startMs: number; durationMs: number } | null => {
    if (typeof item.timing !== 'object' || item.timing === null) {
      return null;
    }
    const timing = item.timing as { startMs?: unknown; durationMs?: unknown };
    if (typeof timing.startMs !== 'number' || typeof timing.durationMs !== 'number') {
      return null;
    }
    return {
      startMs: Math.max(0, Math.round(timing.startMs)),
      durationMs: Math.max(0, Math.round(timing.durationMs)),
    };
  };

  const visitItem = (item: unknown): void => {
    if (typeof item !== 'object' || item === null) {
      return;
    }
    const candidate = item as {
      kind?: unknown;
      durationMs?: unknown;
      items?: unknown;
      steps?: unknown;
      timing?: unknown;
      text?: unknown;
      speaker?: unknown;
      audioRef?: unknown;
      placement?: unknown;
      styleToken?: unknown;
      animationIn?: unknown;
      animationOut?: unknown;
      startValue?: unknown;
      label?: unknown;
      intervalMs?: unknown;
      directives?: unknown;
      points?: unknown;
      fill?: unknown;
      stroke?: unknown;
      opacity?: unknown;
      zIndex?: unknown;
      asset?: unknown;
      anchor?: unknown;
      scale?: unknown;
      filterId?: unknown;
      preset?: unknown;
      intensity?: unknown;
      transitionInMs?: unknown;
      transitionOutMs?: unknown;
    };

    if (candidate.kind === 'movementStep' || candidate.kind === 'rest') {
      if (typeof candidate.durationMs === 'number' && candidate.durationMs > 0) {
        cursorMs += Math.round(candidate.durationMs);
      }
      return;
    }

    if (candidate.kind === 'exercise' && Array.isArray(candidate.steps)) {
      for (const step of candidate.steps) {
        visitItem(step);
      }
      return;
    }

    const timing = getTimingWindow(candidate);
    if (!timing) {
      return;
    }
    const startMs = cursorMs + timing.startMs;
    const endMs = startMs + timing.durationMs;

    if (candidate.kind === 'dialogueCue' && typeof candidate.text === 'string') {
      const speaker = typeof candidate.speaker === 'string' ? `${candidate.speaker}: ` : '';
      textCues.push({
        type: 'dialogue',
        startMs,
        endMs,
        text: `${speaker}${candidate.text}`,
        payload: {
          text: candidate.text,
          speaker: typeof candidate.speaker === 'string' ? candidate.speaker : undefined,
          audioRef: typeof candidate.audioRef === 'string' ? candidate.audioRef : undefined,
        },
      });
      return;
    }

    if (candidate.kind === 'textCue' && typeof candidate.text === 'string') {
      textCues.push({
        type: 'text',
        startMs,
        endMs,
        text: candidate.text,
        payload: {
          text: candidate.text,
          placement: asObjectRecord(candidate.placement) ?? candidate.placement,
          styleToken: typeof candidate.styleToken === 'string' ? candidate.styleToken : undefined,
          animationIn: asObjectRecord(candidate.animationIn),
          animationOut: asObjectRecord(candidate.animationOut),
        },
      });
      return;
    }

    if (
      candidate.kind === 'countdownCue' &&
      typeof candidate.startValue === 'number' &&
      typeof candidate.intervalMs === 'number' &&
      candidate.intervalMs > 0
    ) {
      textCues.push({
        type: 'countdown',
        startMs,
        endMs,
        text: '',
        startValue: Math.round(candidate.startValue),
        intervalMs: Math.round(candidate.intervalMs),
        payload: {
          value: Math.round(candidate.startValue),
          label: typeof candidate.label === 'string' ? candidate.label : undefined,
          styleToken: typeof candidate.styleToken === 'string' ? candidate.styleToken : undefined,
        },
      });
      return;
    }

    if (candidate.kind === 'overlayPolygon' && Array.isArray(candidate.points)) {
      const points = candidate.points
        .map((point) => {
          if (typeof point !== 'object' || point === null) {
            return null;
          }
          const candidatePoint = point as { x?: unknown; y?: unknown };
          return {
            x: candidatePoint.x,
            y: candidatePoint.y,
          };
        })
        .filter((point): point is { x: unknown; y: unknown } => point !== null);
      if (points.length >= 3) {
        overlayCues.push({
          cue: {
            type: 'polygon',
            timeMs: startMs,
            endTimeMs: endMs,
            payload: {
              points,
              fill: typeof candidate.fill === 'string' ? candidate.fill : undefined,
              stroke: typeof candidate.stroke === 'string' ? candidate.stroke : undefined,
              opacity: typeof candidate.opacity === 'number' ? candidate.opacity : undefined,
              zIndex: typeof candidate.zIndex === 'number' ? Math.round(candidate.zIndex) : undefined,
            },
          },
        });
      }
      return;
    }

    if (candidate.kind === 'overlaySprite' && typeof candidate.asset === 'string') {
      overlayCues.push({
        cue: {
          type: 'sprite',
          timeMs: startMs,
          endTimeMs: endMs,
          payload: {
            asset: candidate.asset,
            anchor: candidate.anchor,
            scale: typeof candidate.scale === 'number' ? candidate.scale : undefined,
            opacity: typeof candidate.opacity === 'number' ? candidate.opacity : undefined,
            zIndex: typeof candidate.zIndex === 'number' ? Math.round(candidate.zIndex) : undefined,
          },
        },
      });
      return;
    }

    if (candidate.kind === 'videoFilterCue' && typeof candidate.filterId === 'string') {
      overlayCues.push({
        cue: {
          type: 'theme',
          timeMs: startMs,
          endTimeMs: endMs,
          payload: {
            filterId: candidate.filterId,
            preset: typeof candidate.preset === 'string' ? candidate.preset : undefined,
            intensity: typeof candidate.intensity === 'number' ? candidate.intensity : undefined,
            transitionInMs: typeof candidate.transitionInMs === 'number' ? candidate.transitionInMs : undefined,
            transitionOutMs: typeof candidate.transitionOutMs === 'number' ? candidate.transitionOutMs : undefined,
            themeId: typeof candidate.preset === 'string' ? candidate.preset : candidate.filterId,
          },
        },
      });
      return;
    }

    if (candidate.kind === 'cameraCue' && Array.isArray(candidate.directives)) {
      const directives: CameraDirective[] = [];
      for (const directive of candidate.directives) {
        if (typeof directive !== 'object' || directive === null) {
          continue;
        }
        const entry = directive as {
          type?: unknown;
          yaw?: unknown;
          pitch?: unknown;
          yawRad?: unknown;
          pitchRad?: unknown;
          rollRad?: unknown;
          angleRad?: unknown;
          radius?: unknown;
          height?: unknown;
          target?: unknown;
          amount?: unknown;
          position?: unknown;
          fov?: unknown;
          fovDeg?: unknown;
          easing?: unknown;
        };
        const easing =
          entry.easing === 'linear' || entry.easing === 'easeIn' || entry.easing === 'easeOut' || entry.easing === 'easeInOut'
            ? entry.easing
            : undefined;

        if (
          entry.type === 'yaw/pitch/roll' &&
          typeof entry.yawRad === 'number' &&
          typeof entry.pitchRad === 'number' &&
          typeof entry.rollRad === 'number'
        ) {
          directives.push({
            type: 'yaw/pitch/roll',
            yawRad: entry.yawRad,
            pitchRad: entry.pitchRad,
            rollRad: entry.rollRad,
            easing,
          });
        } else if (entry.type === 'yawPitchRoll') {
          // Backward compatibility for legacy cue scripts that authored degrees.
          if (typeof entry.yaw === 'number' && typeof entry.pitch === 'number') {
            directives.push({
              type: 'yaw/pitch/roll',
              yawRad: (entry.yaw * Math.PI) / 180,
              pitchRad: (entry.pitch * Math.PI) / 180,
              rollRad: 0,
              easing,
            });
          }
        } else if (entry.type === 'orbit' && typeof entry.angleRad === 'number') {
          const target = asObjectRecord(entry.target);
          directives.push({
            type: 'orbit',
            angleRad: entry.angleRad,
            radius: typeof entry.radius === 'number' ? entry.radius : undefined,
            height: typeof entry.height === 'number' ? entry.height : undefined,
            target:
              target && typeof target.x === 'number' && typeof target.y === 'number' && typeof target.z === 'number'
                ? { x: target.x, y: target.y, z: target.z }
                : undefined,
            easing,
          });
        } else if (entry.type === 'dolly' && typeof entry.amount === 'number') {
          directives.push({ type: 'dolly', amount: entry.amount, easing });
        } else if (
          entry.type === 'position' &&
          typeof entry.position === 'object' &&
          entry.position !== null &&
          'x' in entry.position &&
          'y' in entry.position &&
          'z' in entry.position
        ) {
          const position = entry.position as { x: unknown; y: unknown; z: unknown };
          if (typeof position.x === 'number' && typeof position.y === 'number' && typeof position.z === 'number') {
            directives.push({
              type: 'position',
              position: { x: position.x, y: position.y, z: position.z },
              easing,
            });
          }
        } else if (
          (entry.type === 'lookAt' || entry.type === 'panTo') &&
          typeof entry.target === 'object' &&
          entry.target !== null &&
          'x' in entry.target &&
          'y' in entry.target &&
          'z' in entry.target
        ) {
          const target = entry.target as { x: unknown; y: unknown; z: unknown };
          if (typeof target.x === 'number' && typeof target.y === 'number' && typeof target.z === 'number') {
            directives.push({
              type: entry.type,
              target: { x: target.x, y: target.y, z: target.z },
              easing,
            });
          }
        } else if (entry.type === 'fov') {
          if (typeof entry.fovDeg === 'number') {
            directives.push({ type: 'fov', fovDeg: entry.fovDeg, easing });
          } else if (typeof entry.fov === 'number') {
            // Backward compatibility for legacy cue scripts.
            directives.push({ type: 'fov', fovDeg: entry.fov, easing });
          }
        }
      }

      if (directives.length > 0) {
        cameraCues.push({
          cue: {
            timeMs: startMs,
            endTimeMs: endMs,
            directives,
          },
        });
      }
    }
  };

  if (typeof parsedInput === 'object' && parsedInput !== null && !Array.isArray(parsedInput)) {
    const candidate = parsedInput as { items?: unknown };
    if (Array.isArray(candidate.items)) {
      for (const item of candidate.items) {
        visitItem(item);
      }
    }
  }

  const maxCueEndMs = [
    ...textCues.map((cue) => cue.endMs),
    ...cameraCues.map((cue) => cue.cue.endTimeMs ?? cue.cue.timeMs),
    ...overlayCues.map((cue) => cue.cue.endTimeMs ?? cue.cue.timeMs),
  ].reduce((max, current) => Math.max(max, current), 0);
  return { textCues, cameraCues, overlayCues, totalDurationMs: Math.max(cursorMs, maxCueEndMs, 1500) };
}

function mountApp(): void {
  const root = document.getElementById('app');

  if (!root) {
    throw new Error('Root element #app was not found.');
  }

  root.innerHTML = buildAppMarkup();

  const inputElement = document.getElementById('renderer-input');
  const runButton = document.getElementById('run-renderer');
  const resetButton = document.getElementById('reset-sample');
  const copyAgentDocsButton = document.getElementById('copy-agent-docs');
  const copyStatus = document.getElementById('copy-status');
  const routineSelect = document.getElementById('animation-routine');

  if (!(inputElement instanceof HTMLTextAreaElement)) {
    throw new Error('Input element #renderer-input was not found.');
  }

  if (!(runButton instanceof HTMLButtonElement) || !(resetButton instanceof HTMLButtonElement)) {
    throw new Error('Expected action buttons were not found.');
  }
  if (!(copyAgentDocsButton instanceof HTMLButtonElement)) {
    throw new Error('Copy button #copy-agent-docs was not found.');
  }
  if (!(copyStatus instanceof HTMLSpanElement)) {
    throw new Error('Copy status #copy-status was not found.');
  }
  if (!(routineSelect instanceof HTMLSelectElement)) {
    throw new Error('Animation routine selector #animation-routine was not found.');
  }

  for (const routine of EXERCISE_ROUTINES) {
    const option = document.createElement('option');
    option.value = routine.id;
    option.textContent = routine.label;
    routineSelect.append(option);
  }
  routineSelect.value = selectedRoutineId;

  inputElement.value = formatJson(SAMPLE_INPUT);

  runButton.addEventListener('click', runRenderer);
  resetButton.addEventListener('click', () => {
    inputElement.value = formatJson(SAMPLE_INPUT);
    runRenderer();
  });
  copyAgentDocsButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(CUSTOM_JSON_SCRIPT_AGENT_PROMPT);
      copyStatus.textContent =
        'Copied. Paste into ChatGPT or another LLM to generate schema-valid JSON scripts.';
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Clipboard access failed.';
      copyStatus.textContent = `Copy failed: ${message}`;
    }
  });
  routineSelect.addEventListener('change', () => {
    selectedRoutineId = routineSelect.value;
    updateRoutineDescription();
  });

  runRenderer();
  updateRoutineDescription();
  startRendererAnimation();
}

mountApp();
