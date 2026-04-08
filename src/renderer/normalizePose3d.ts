import { type BodyModelId, DEFAULT_BODY_MODEL_ID, getBodyModel } from '../bodyModels/human-3d-v1';

export type EulerOrder = 'XYZ' | 'XZY' | 'YXZ' | 'YZX' | 'ZXY' | 'ZYX';

export interface EulerRotation3D {
  x: number;
  y: number;
  z: number;
  order?: EulerOrder;
  unit?: 'deg' | 'rad';
}

export type QuaternionRotation3D = [number, number, number, number];

export type JointRotationInput3D = QuaternionRotation3D | EulerRotation3D;

export interface Pose3DInput {
  jointRotations: Record<string, JointRotationInput3D>;
}

export interface NormalizedPose3D {
  bodyModel: BodyModelId;
  /** Canonical joint map where every model joint is present and represented as [x,y,z,w]. */
  jointRotations: Record<string, QuaternionRotation3D>;
}

export interface NormalizePose3DOptions {
  bodyModel?: BodyModelId;
  defaultEulerOrder?: EulerOrder;
}

const DEG_TO_RAD = Math.PI / 180;
const IDENTITY_QUATERNION: QuaternionRotation3D = [0, 0, 0, 1];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isQuaternionRotation3D(value: unknown): value is QuaternionRotation3D {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    isFiniteNumber(value[0]) &&
    isFiniteNumber(value[1]) &&
    isFiniteNumber(value[2]) &&
    isFiniteNumber(value[3])
  );
}

function isEulerRotation3D(value: unknown): value is EulerRotation3D {
  return (
    typeof value === 'object' &&
    value !== null &&
    isFiniteNumber((value as EulerRotation3D).x) &&
    isFiniteNumber((value as EulerRotation3D).y) &&
    isFiniteNumber((value as EulerRotation3D).z)
  );
}

function normalizeQuaternion([x, y, z, w]: QuaternionRotation3D): QuaternionRotation3D {
  const length = Math.hypot(x, y, z, w);
  if (length === 0 || !Number.isFinite(length)) {
    return [...IDENTITY_QUATERNION];
  }

  return [x / length, y / length, z / length, w / length];
}

function multiplyQuaternion(
  [ax, ay, az, aw]: QuaternionRotation3D,
  [bx, by, bz, bw]: QuaternionRotation3D,
): QuaternionRotation3D {
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

function axisAngleToQuaternion(axis: 'x' | 'y' | 'z', angleRad: number): QuaternionRotation3D {
  const half = angleRad / 2;
  const sinHalf = Math.sin(half);
  const cosHalf = Math.cos(half);

  if (axis === 'x') {
    return [sinHalf, 0, 0, cosHalf];
  }

  if (axis === 'y') {
    return [0, sinHalf, 0, cosHalf];
  }

  return [0, 0, sinHalf, cosHalf];
}

/**
 * Converts Euler input to quaternion honoring the declared order.
 */
export function eulerToQuaternion(rotation: EulerRotation3D, defaultOrder: EulerOrder = 'XYZ'): QuaternionRotation3D {
  const order = rotation.order ?? defaultOrder;
  const unit = rotation.unit ?? 'rad';
  const factor = unit === 'deg' ? DEG_TO_RAD : 1;

  const byAxis: Record<'X' | 'Y' | 'Z', number> = {
    X: rotation.x * factor,
    Y: rotation.y * factor,
    Z: rotation.z * factor,
  };

  let quaternion: QuaternionRotation3D = [...IDENTITY_QUATERNION];

  for (const axis of order) {
    const axisQuaternion = axisAngleToQuaternion(axis.toLowerCase() as 'x' | 'y' | 'z', byAxis[axis as 'X' | 'Y' | 'Z']);
    quaternion = multiplyQuaternion(quaternion, axisQuaternion);
  }

  return normalizeQuaternion(quaternion);
}

function neutralJointQuaternion(
  neutralRotationDeg: { x: number; y: number; z: number },
  defaultOrder: EulerOrder,
): QuaternionRotation3D {
  return eulerToQuaternion(
    {
      x: neutralRotationDeg.x,
      y: neutralRotationDeg.y,
      z: neutralRotationDeg.z,
      unit: 'deg',
      order: defaultOrder,
    },
    defaultOrder,
  );
}

export function normalizePose3d(input: Pose3DInput, options: NormalizePose3DOptions = {}): NormalizedPose3D {
  const bodyModelId = options.bodyModel ?? DEFAULT_BODY_MODEL_ID;
  const defaultOrder = options.defaultEulerOrder ?? 'XYZ';
  const bodyModel = getBodyModel(bodyModelId);
  const normalizedJointRotations: Record<string, QuaternionRotation3D> = {};

  for (const joint of bodyModel.joints) {
    const rawRotation = input.jointRotations[joint.name];

    if (isQuaternionRotation3D(rawRotation)) {
      normalizedJointRotations[joint.name] = normalizeQuaternion(rawRotation);
      continue;
    }

    if (isEulerRotation3D(rawRotation)) {
      normalizedJointRotations[joint.name] = eulerToQuaternion(rawRotation, defaultOrder);
      continue;
    }

    normalizedJointRotations[joint.name] = neutralJointQuaternion(joint.neutralRotationDeg, defaultOrder);
  }

  return {
    bodyModel: bodyModelId,
    jointRotations: normalizedJointRotations,
  };
}
