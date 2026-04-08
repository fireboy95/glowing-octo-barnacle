export type BodyModelId = 'human-3d-v1';

export type Axis = 'x' | 'y' | 'z';

export interface JointConstraint {
  axis: Axis;
  minDeg: number;
  maxDeg: number;
}

export interface JointDefinition {
  name: string;
  parent: string | null;
  neutralRotationDeg: Record<Axis, number>;
  constraints: JointConstraint[];
}

export interface ProportionPreset {
  name: string;
  description?: string;
  scaleByJoint: Record<string, number>;
}

export interface BodyModel {
  id: BodyModelId;
  version: 1;
  dimension: '3d';
  joints: readonly JointDefinition[];
  jointParentByName: Readonly<Record<string, string | null>>;
  jointByName: Readonly<Record<string, JointDefinition>>;
  proportionPresets: readonly ProportionPreset[];
}

const JOINTS: readonly JointDefinition[] = [
  {
    name: 'pelvis',
    parent: null,
    neutralRotationDeg: { x: 0, y: 0, z: 0 },
    constraints: [
      { axis: 'x', minDeg: -15, maxDeg: 15 },
      { axis: 'y', minDeg: -25, maxDeg: 25 },
      { axis: 'z', minDeg: -10, maxDeg: 10 },
    ],
  },
  {
    name: 'spineLower',
    parent: 'pelvis',
    neutralRotationDeg: { x: 0, y: 0, z: 0 },
    constraints: [
      { axis: 'x', minDeg: -20, maxDeg: 35 },
      { axis: 'y', minDeg: -25, maxDeg: 25 },
      { axis: 'z', minDeg: -20, maxDeg: 20 },
    ],
  },
  {
    name: 'spineUpper',
    parent: 'spineLower',
    neutralRotationDeg: { x: 0, y: 0, z: 0 },
    constraints: [
      { axis: 'x', minDeg: -25, maxDeg: 40 },
      { axis: 'y', minDeg: -30, maxDeg: 30 },
      { axis: 'z', minDeg: -25, maxDeg: 25 },
    ],
  },
  {
    name: 'neck',
    parent: 'spineUpper',
    neutralRotationDeg: { x: 0, y: 0, z: 0 },
    constraints: [
      { axis: 'x', minDeg: -40, maxDeg: 50 },
      { axis: 'y', minDeg: -60, maxDeg: 60 },
      { axis: 'z', minDeg: -45, maxDeg: 45 },
    ],
  },
  {
    name: 'head',
    parent: 'neck',
    neutralRotationDeg: { x: 0, y: 0, z: 0 },
    constraints: [
      { axis: 'x', minDeg: -35, maxDeg: 35 },
      { axis: 'y', minDeg: -55, maxDeg: 55 },
      { axis: 'z', minDeg: -35, maxDeg: 35 },
    ],
  },
  {
    name: 'clavicleL',
    parent: 'spineUpper',
    neutralRotationDeg: { x: 0, y: 0, z: 0 },
    constraints: [
      { axis: 'x', minDeg: -15, maxDeg: 30 },
      { axis: 'y', minDeg: -25, maxDeg: 35 },
      { axis: 'z', minDeg: -20, maxDeg: 30 },
    ],
  },
  {
    name: 'shoulderL',
    parent: 'clavicleL',
    neutralRotationDeg: { x: 0, y: 0, z: 0 },
    constraints: [
      { axis: 'x', minDeg: -120, maxDeg: 180 },
      { axis: 'y', minDeg: -95, maxDeg: 95 },
      { axis: 'z', minDeg: -95, maxDeg: 95 },
    ],
  },
  {
    name: 'elbowL',
    parent: 'shoulderL',
    neutralRotationDeg: { x: 0, y: 0, z: 0 },
    constraints: [
      { axis: 'x', minDeg: 0, maxDeg: 145 },
      { axis: 'y', minDeg: -10, maxDeg: 10 },
      { axis: 'z', minDeg: -5, maxDeg: 5 },
    ],
  },
  {
    name: 'wristL',
    parent: 'elbowL',
    neutralRotationDeg: { x: 0, y: 0, z: 0 },
    constraints: [
      { axis: 'x', minDeg: -75, maxDeg: 80 },
      { axis: 'y', minDeg: -30, maxDeg: 30 },
      { axis: 'z', minDeg: -45, maxDeg: 45 },
    ],
  },
  {
    name: 'clavicleR',
    parent: 'spineUpper',
    neutralRotationDeg: { x: 0, y: 0, z: 0 },
    constraints: [
      { axis: 'x', minDeg: -15, maxDeg: 30 },
      { axis: 'y', minDeg: -35, maxDeg: 25 },
      { axis: 'z', minDeg: -30, maxDeg: 20 },
    ],
  },
  {
    name: 'shoulderR',
    parent: 'clavicleR',
    neutralRotationDeg: { x: 0, y: 0, z: 0 },
    constraints: [
      { axis: 'x', minDeg: -120, maxDeg: 180 },
      { axis: 'y', minDeg: -95, maxDeg: 95 },
      { axis: 'z', minDeg: -95, maxDeg: 95 },
    ],
  },
  {
    name: 'elbowR',
    parent: 'shoulderR',
    neutralRotationDeg: { x: 0, y: 0, z: 0 },
    constraints: [
      { axis: 'x', minDeg: 0, maxDeg: 145 },
      { axis: 'y', minDeg: -10, maxDeg: 10 },
      { axis: 'z', minDeg: -5, maxDeg: 5 },
    ],
  },
  {
    name: 'wristR',
    parent: 'elbowR',
    neutralRotationDeg: { x: 0, y: 0, z: 0 },
    constraints: [
      { axis: 'x', minDeg: -75, maxDeg: 80 },
      { axis: 'y', minDeg: -30, maxDeg: 30 },
      { axis: 'z', minDeg: -45, maxDeg: 45 },
    ],
  },
  {
    name: 'hipL',
    parent: 'pelvis',
    neutralRotationDeg: { x: 0, y: 0, z: 0 },
    constraints: [
      { axis: 'x', minDeg: -35, maxDeg: 120 },
      { axis: 'y', minDeg: -45, maxDeg: 45 },
      { axis: 'z', minDeg: -40, maxDeg: 40 },
    ],
  },
  {
    name: 'kneeL',
    parent: 'hipL',
    neutralRotationDeg: { x: 0, y: 0, z: 0 },
    constraints: [
      { axis: 'x', minDeg: 0, maxDeg: 155 },
      { axis: 'y', minDeg: -8, maxDeg: 8 },
      { axis: 'z', minDeg: -8, maxDeg: 8 },
    ],
  },
  {
    name: 'ankleL',
    parent: 'kneeL',
    neutralRotationDeg: { x: 0, y: 0, z: 0 },
    constraints: [
      { axis: 'x', minDeg: -35, maxDeg: 45 },
      { axis: 'y', minDeg: -25, maxDeg: 25 },
      { axis: 'z', minDeg: -20, maxDeg: 20 },
    ],
  },
  {
    name: 'hipR',
    parent: 'pelvis',
    neutralRotationDeg: { x: 0, y: 0, z: 0 },
    constraints: [
      { axis: 'x', minDeg: -35, maxDeg: 120 },
      { axis: 'y', minDeg: -45, maxDeg: 45 },
      { axis: 'z', minDeg: -40, maxDeg: 40 },
    ],
  },
  {
    name: 'kneeR',
    parent: 'hipR',
    neutralRotationDeg: { x: 0, y: 0, z: 0 },
    constraints: [
      { axis: 'x', minDeg: 0, maxDeg: 155 },
      { axis: 'y', minDeg: -8, maxDeg: 8 },
      { axis: 'z', minDeg: -8, maxDeg: 8 },
    ],
  },
  {
    name: 'ankleR',
    parent: 'kneeR',
    neutralRotationDeg: { x: 0, y: 0, z: 0 },
    constraints: [
      { axis: 'x', minDeg: -35, maxDeg: 45 },
      { axis: 'y', minDeg: -25, maxDeg: 25 },
      { axis: 'z', minDeg: -20, maxDeg: 20 },
    ],
  },
];

const PROPORTION_PRESETS: readonly ProportionPreset[] = [
  {
    name: 'default-adult',
    description: 'Balanced proportions for an average adult humanoid.',
    scaleByJoint: {
      pelvis: 1,
      spineLower: 1,
      spineUpper: 1,
      neck: 1,
      head: 1,
      clavicleL: 1,
      shoulderL: 1,
      elbowL: 1,
      wristL: 1,
      clavicleR: 1,
      shoulderR: 1,
      elbowR: 1,
      wristR: 1,
      hipL: 1,
      kneeL: 1,
      ankleL: 1,
      hipR: 1,
      kneeR: 1,
      ankleR: 1,
    },
  },
  {
    name: 'long-limbs',
    description: 'Stylized preset with proportionally longer arms and legs.',
    scaleByJoint: {
      pelvis: 1,
      spineLower: 1,
      spineUpper: 1,
      neck: 1,
      head: 0.95,
      clavicleL: 1.05,
      shoulderL: 1.1,
      elbowL: 1.08,
      wristL: 1,
      clavicleR: 1.05,
      shoulderR: 1.1,
      elbowR: 1.08,
      wristR: 1,
      hipL: 1.1,
      kneeL: 1.08,
      ankleL: 1,
      hipR: 1.1,
      kneeR: 1.08,
      ankleR: 1,
    },
  },
];

const HUMAN_3D_V1: BodyModel = (() => {
  const jointParentByName = Object.fromEntries(
    JOINTS.map((joint) => [joint.name, joint.parent]),
  ) as Record<string, string | null>;

  const jointByName = Object.fromEntries(
    JOINTS.map((joint) => [joint.name, joint]),
  ) as Record<string, JointDefinition>;

  return {
    id: 'human-3d-v1',
    version: 1,
    dimension: '3d',
    joints: JOINTS,
    jointParentByName,
    jointByName,
    proportionPresets: PROPORTION_PRESETS,
  };
})();

const BODY_MODELS: Record<BodyModelId, BodyModel> = {
  'human-3d-v1': HUMAN_3D_V1,
};

/**
 * Typed body-model registry entrypoint intended for validators and renderer normalization.
 */
export function getBodyModel(modelId: BodyModelId): BodyModel {
  return BODY_MODELS[modelId];
}

export const DEFAULT_BODY_MODEL_ID: BodyModelId = 'human-3d-v1';
