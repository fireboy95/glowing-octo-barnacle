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
  const phase = timeSeconds * 2.2;
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
  ctx.fillText('Animated 3D skeleton preview', 16, 28);
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

  if (!(inputElement instanceof HTMLTextAreaElement)) {
    throw new Error('Input element #renderer-input was not found.');
  }

  if (!(runButton instanceof HTMLButtonElement) || !(resetButton instanceof HTMLButtonElement)) {
    throw new Error('Expected action buttons were not found.');
  }

  inputElement.value = formatJson(SAMPLE_INPUT);

  runButton.addEventListener('click', runRenderer);
  resetButton.addEventListener('click', () => {
    inputElement.value = formatJson(SAMPLE_INPUT);
    runRenderer();
  });

  runRenderer();
  startRendererAnimation();
}

mountApp();
