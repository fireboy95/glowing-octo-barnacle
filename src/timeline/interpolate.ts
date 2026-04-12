import { type NormalizedPose3D, type QuaternionRotation3D } from '../renderer/normalizePose3d';

export type EasingFunction = (t: number) => number;

const DOT_TIE_EPSILON = 1e-8;
const LINEAR_FALLBACK_EPSILON = 1e-6;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

function normalizeQuaternion([x, y, z, w]: QuaternionRotation3D): QuaternionRotation3D {
  const length = Math.hypot(x, y, z, w);

  if (!Number.isFinite(length) || length === 0) {
    return [0, 0, 0, 1];
  }

  return [x / length, y / length, z / length, w / length];
}

function dotQuaternion([ax, ay, az, aw]: QuaternionRotation3D, [bx, by, bz, bw]: QuaternionRotation3D): number {
  return ax * bx + ay * by + az * bz + aw * bw;
}

function negateQuaternion([x, y, z, w]: QuaternionRotation3D): QuaternionRotation3D {
  return [-x, -y, -z, -w];
}

function shouldNegateForTie(quaternion: QuaternionRotation3D): boolean {
  for (const component of quaternion) {
    if (component < 0) {
      return true;
    }

    if (component > 0) {
      return false;
    }
  }

  return false;
}

function lerpQuaternion(from: QuaternionRotation3D, to: QuaternionRotation3D, t: number): QuaternionRotation3D {
  return normalizeQuaternion([
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
    from[2] + (to[2] - from[2]) * t,
    from[3] + (to[3] - from[3]) * t,
  ]);
}

/**
 * Spherical interpolation with shortest-path correction and deterministic tie handling.
 */
export function slerpQuaternion(from: QuaternionRotation3D, to: QuaternionRotation3D, t: number): QuaternionRotation3D {
  const q0 = normalizeQuaternion(from);
  let q1 = normalizeQuaternion(to);

  let dot = dotQuaternion(q0, q1);

  // Enforce shortest-path interpolation by keeping quaternions in the same hemisphere.
  if (dot < 0 || (Math.abs(dot) <= DOT_TIE_EPSILON && shouldNegateForTie(q1))) {
    q1 = negateQuaternion(q1);
    dot = -dot;
  }

  // For tiny angular difference (including antipodal sign ties after hemisphere selection),
  // use normalized lerp for deterministic and numerically stable results.
  if (dot > 1 - LINEAR_FALLBACK_EPSILON) {
    return lerpQuaternion(q0, q1, t);
  }

  const theta = Math.acos(Math.min(1, Math.max(-1, dot)));
  const sinTheta = Math.sin(theta);

  if (Math.abs(sinTheta) <= LINEAR_FALLBACK_EPSILON) {
    return lerpQuaternion(q0, q1, t);
  }

  const weight0 = Math.sin((1 - t) * theta) / sinTheta;
  const weight1 = Math.sin(t * theta) / sinTheta;

  return normalizeQuaternion([
    q0[0] * weight0 + q1[0] * weight1,
    q0[1] * weight0 + q1[1] * weight1,
    q0[2] * weight0 + q1[2] * weight1,
    q0[3] * weight0 + q1[3] * weight1,
  ]);
}

export function interpolateNormalizedTimelinePose(
  from: NormalizedPose3D,
  to: NormalizedPose3D,
  alpha: number,
  easing: EasingFunction = (value) => value,
): NormalizedPose3D {
  const fromPose = (from ?? {}) as Partial<NormalizedPose3D>;
  const toPose = (to ?? {}) as Partial<NormalizedPose3D>;
  const fromJointRotations = fromPose.jointRotations ?? {};
  const toJointRotations = toPose.jointRotations ?? {};
  const bodyModel = fromPose.bodyModel ?? toPose.bodyModel;

  if (!bodyModel) {
    return {
      bodyModel: 'human-3d-v1',
      jointRotations: {},
    };
  }

  const easedT = clamp01(easing(clamp01(alpha)));

  if (easedT <= 0) {
    return {
      bodyModel,
      jointRotations: { ...fromJointRotations },
    };
  }

  if (easedT >= 1) {
    return {
      bodyModel,
      jointRotations: { ...toJointRotations },
    };
  }

  const jointNames = new Set<string>([
    ...Object.keys(fromJointRotations),
    ...Object.keys(toJointRotations),
  ]);

  const jointRotations: NormalizedPose3D['jointRotations'] = {};

  for (const jointName of jointNames) {
    const fromJoint = fromJointRotations[jointName] ?? [0, 0, 0, 1];
    const toJoint = toJointRotations[jointName] ?? fromJoint;

    jointRotations[jointName] = slerpQuaternion(fromJoint, toJoint, easedT);
  }

  return {
    bodyModel,
    jointRotations,
  };
}
