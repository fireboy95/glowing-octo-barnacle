import { buildRendererFrame } from './renderer';

const SAMPLE_INPUT = {
  pose: {
    jointRotations: {
      pelvis: { x: 0, y: 0, z: 0, unit: 'deg' },
      shoulderL: { x: 20, y: -10, z: 0, unit: 'deg' },
      elbowL: { x: 45, y: 0, z: 0, unit: 'deg' },
      shoulderR: { x: 10, y: 5, z: 0, unit: 'deg' },
      elbowR: { x: 30, y: 0, z: 0, unit: 'deg' },
      hipL: [0, 0, 0, 1],
      hipR: [0, 0, 0, 1],
    },
  },
};

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface Segment {
  from: string;
  to: string;
}

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
let animationHandle: number | null = null;
let animationStart = 0;
let selectedRoutineId = 'jumping-jacks';

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function buildAppMarkup(): string {
  return `
    <main>
      <h1>Renderer Input Runner</h1>
      <p>Provide a JSON payload that matches <code>RendererFrameInput</code> and run normalization.</p>

      <label for="renderer-input">Renderer input JSON</label>
      <textarea id="renderer-input" rows="18" spellcheck="false"></textarea>

      <div class="actions">
        <button id="run-renderer" type="button">Run renderer</button>
        <button id="reset-sample" type="button">Reset sample</button>
      </div>

      <section class="animation-controls">
        <h2>Exercise animation routines</h2>
        <p>Select an example routine to preview different workout-style motions.</p>
        <label for="animation-routine">Routine</label>
        <select id="animation-routine"></select>
        <p id="animation-routine-description" class="routine-description" aria-live="polite"></p>
      </section>

      <section class="viewer-section">
        <h2>3D animated renderer preview</h2>
        <canvas id="renderer-canvas" width="900" height="420" aria-label="3D skeleton renderer preview"></canvas>
      </section>

      <section>
        <h2>Output</h2>
        <pre id="renderer-output" aria-live="polite"></pre>
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
    transform: (joints, phase, cycle) => {
      const armLift = Math.max(0, Math.sin(phase));
      const legSpread = Math.max(0, Math.sin(phase));
      const rebound = Math.abs(Math.sin(phase * 0.5));

      joints.pelvis.y += rebound * 0.08;
      joints.head.y += rebound * 0.05;

      joints.elbowL.y += armLift * 0.25;
      joints.wristL.y += armLift * 0.42;
      joints.elbowR.y += armLift * 0.25;
      joints.wristR.y += armLift * 0.42;

      joints.wristL.x -= armLift * 0.18;
      joints.wristR.x += armLift * 0.18;

      joints.kneeL.x -= legSpread * 0.13;
      joints.ankleL.x -= legSpread * 0.2;
      joints.kneeR.x += legSpread * 0.13;
      joints.ankleR.x += legSpread * 0.2;

      joints.kneeL.y += cycle > 0 ? 0.04 : -0.04;
      joints.kneeR.y += cycle > 0 ? -0.04 : 0.04;
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
];

function getSelectedRoutine(): AnimationRoutine {
  return EXERCISE_ROUTINES.find((routine) => routine.id === selectedRoutineId) ?? EXERCISE_ROUTINES[0];
}

function rotateAroundY(point: Vec3, angle: number): Vec3 {
  return {
    x: point.x * Math.cos(angle) - point.z * Math.sin(angle),
    y: point.y,
    z: point.x * Math.sin(angle) + point.z * Math.cos(angle),
  };
}

function projectPoint(point: Vec3, width: number, height: number): ProjectedPoint {
  const zOffset = point.z + 3;
  const perspective = 280 / zOffset;
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
  return clamp((thickness * 280) / depth, 2, 90);
}

function buildAnimatedSkeleton(timeSeconds: number): Record<string, Vec3> {
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

  const orbitAngle = timeSeconds * 0.5;
  for (const [joint, position] of Object.entries(joints)) {
    joints[joint] = rotateAroundY(position, orbitAngle);
  }

  return joints;
}

function drawRendererFrame(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, timeMs: number): void {
  const width = canvas.width;
  const height = canvas.height;
  const t = (timeMs - animationStart) / 1000;
  const joints = buildAnimatedSkeleton(t);
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
    projectedJoints[joint] = projectPoint(position, width, height);
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

function runRenderer(): void {
  const inputElement = document.getElementById('renderer-input');

  if (!(inputElement instanceof HTMLTextAreaElement)) {
    throw new Error('Input element #renderer-input was not found.');
  }

  try {
    const parsedInput = JSON.parse(inputElement.value);
    const result = buildRendererFrame(parsedInput);
    currentNormalizedPose = result.pose;
    setOutput(formatJson(result));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error while running renderer.';
    setOutput(`Error: ${message}`);
  }
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
  const routineSelect = document.getElementById('animation-routine');

  if (!(inputElement instanceof HTMLTextAreaElement)) {
    throw new Error('Input element #renderer-input was not found.');
  }

  if (!(runButton instanceof HTMLButtonElement) || !(resetButton instanceof HTMLButtonElement)) {
    throw new Error('Expected action buttons were not found.');
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
  routineSelect.addEventListener('change', () => {
    selectedRoutineId = routineSelect.value;
    updateRoutineDescription();
  });

  runRenderer();
  updateRoutineDescription();
  startRendererAnimation();
}

mountApp();
