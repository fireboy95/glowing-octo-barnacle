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

function runRenderer(): void {
  const inputElement = document.getElementById('renderer-input');

  if (!(inputElement instanceof HTMLTextAreaElement)) {
    throw new Error('Input element #renderer-input was not found.');
  }

  try {
    const parsedInput = JSON.parse(inputElement.value);
    const result = buildRendererFrame(parsedInput);
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
}

mountApp();
