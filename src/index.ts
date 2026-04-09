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

function projectPoint(point: Vec3, width: number, height: number): { x: number; y: number; depth: number } {
  const zOffset = point.z + 3;
  const perspective = 280 / zOffset;
  return {
    x: width / 2 + point.x * perspective,
    y: height / 2 - point.y * perspective,
    depth: zOffset,
  };
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

  const projectedJoints: Record<string, { x: number; y: number; depth: number }> = {};
  for (const [joint, position] of Object.entries(joints)) {
    projectedJoints[joint] = projectPoint(position, width, height);
  }

  const sortedSegments = [...SEGMENTS].sort((a, b) => projectedJoints[b.to].depth - projectedJoints[a.to].depth);

  ctx.lineCap = 'round';
  for (const segment of sortedSegments) {
    const start = projectedJoints[segment.from];
    const end = projectedJoints[segment.to];

    if (!start || !end) {
      continue;
    }

    const averageDepth = (start.depth + end.depth) / 2;
    const lineWidth = Math.max(2, 14 - averageDepth * 2.5);
    ctx.strokeStyle = 'rgba(140, 207, 255, 0.88)';
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  for (const point of Object.values(projectedJoints)) {
    const radius = Math.max(2, 10 - point.depth * 1.9);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
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
