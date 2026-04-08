import { getBodyModel } from '../bodyModels/human-3d-v1';

export type DomainErrorCode =
  | 'DUPLICATE_ID'
  | 'UNRESOLVED_REF'
  | 'UNRESOLVED_FROM_POSE'
  | 'UNRESOLVED_TO_POSE'
  | 'INVALID_QUATERNION_LENGTH'
  | 'INVALID_JOINT_NAME'
  | 'ROTATION_OUT_OF_RANGE'
  | 'IMPOSSIBLE_TRANSITION';

export interface DomainValidationError {
  code: DomainErrorCode;
  message: string;
  path: string;
  details?: Record<string, unknown>;
}

export interface DomainValidationOptions {
  quaternionTolerance?: number;
  normalizeQuaternions?: boolean;
  clampEulerToConstraints?: boolean;
}

export interface AjvLikeError {
  message?: string;
  instancePath?: string;
  keyword?: string;
}

export interface AjvLikeValidateFunction {
  (input: unknown): boolean;
  errors?: AjvLikeError[] | null;
}

export interface CombinedValidationResult {
  valid: boolean;
  schemaErrors: Array<{ message: string; path: string; keyword?: string }>;
  domainErrors: DomainValidationError[];
}

type JsonObject = Record<string, unknown>;

const DEG_PER_RAD = 180 / Math.PI;

function escapePointer(value: string): string {
  return value.replaceAll('~', '~0').replaceAll('/', '~1');
}

function joinPointer(base: string, token: string | number): string {
  return `${base}/${escapePointer(String(token))}`;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isQuaternion(value: unknown): value is [number, number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((component) => typeof component === 'number' && Number.isFinite(component))
  );
}

function quaternionLength(quaternion: [number, number, number, number]): number {
  return Math.hypot(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toDegrees(value: number, unit: 'deg' | 'rad' | undefined): number {
  if (unit === 'deg') {
    return value;
  }

  return value * DEG_PER_RAD;
}

function walk(value: unknown, path: string, visit: (value: unknown, path: string) => void): void {
  visit(value, path);

  if (Array.isArray(value)) {
    value.forEach((next, index) => {
      walk(next, joinPointer(path, index), visit);
    });
    return;
  }

  if (!isObject(value)) {
    return;
  }

  for (const [key, next] of Object.entries(value)) {
    walk(next, joinPointer(path, key), visit);
  }
}

function collectEntityIds(root: unknown): {
  ids: Set<string>;
  idPaths: Map<string, string>;
  duplicateErrors: DomainValidationError[];
} {
  const ids = new Set<string>();
  const idPaths = new Map<string, string>();
  const duplicateErrors: DomainValidationError[] = [];

  walk(root, '', (node, path) => {
    if (!isObject(node)) {
      return;
    }

    if (typeof node.id !== 'string' || node.id.length === 0) {
      return;
    }

    const idPath = joinPointer(path, 'id');

    if (ids.has(node.id)) {
      duplicateErrors.push({
        code: 'DUPLICATE_ID',
        message: `Duplicate id '${node.id}' found.`,
        path: idPath,
        details: {
          id: node.id,
          firstPath: idPaths.get(node.id),
        },
      });
      return;
    }

    ids.add(node.id);
    idPaths.set(node.id, idPath);
  });

  return { ids, idPaths, duplicateErrors };
}

function collectPoseDefinitions(root: unknown): Set<string> {
  const poses = new Set<string>();

  walk(root, '', (node) => {
    if (!isObject(node)) {
      return;
    }

    if (node.kind !== 'movementStep') {
      return;
    }

    if (typeof node.id === 'string' && node.id.length > 0) {
      poses.add(node.id);
    }
  });

  return poses;
}

function validateReferences(root: unknown, ids: Set<string>, poses: Set<string>): DomainValidationError[] {
  const errors: DomainValidationError[] = [];

  walk(root, '', (node, path) => {
    if (!isObject(node)) {
      return;
    }

    if (typeof node.ref === 'string' && !ids.has(node.ref)) {
      errors.push({
        code: 'UNRESOLVED_REF',
        message: `ref '${node.ref}' does not resolve to any known id.`,
        path: joinPointer(path, 'ref'),
        details: { ref: node.ref },
      });
    }

    if (typeof node.fromPose === 'string' && !poses.has(node.fromPose)) {
      errors.push({
        code: 'UNRESOLVED_FROM_POSE',
        message: `fromPose '${node.fromPose}' does not resolve to any movementStep id.`,
        path: joinPointer(path, 'fromPose'),
        details: { fromPose: node.fromPose },
      });
    }

    if (typeof node.toPose === 'string' && !poses.has(node.toPose)) {
      errors.push({
        code: 'UNRESOLVED_TO_POSE',
        message: `toPose '${node.toPose}' does not resolve to any movementStep id.`,
        path: joinPointer(path, 'toPose'),
        details: { toPose: node.toPose },
      });
    }

    if (
      typeof node.fromPose === 'string' &&
      typeof node.toPose === 'string' &&
      poses.has(node.fromPose) &&
      poses.has(node.toPose) &&
      node.fromPose === node.toPose
    ) {
      errors.push({
        code: 'IMPOSSIBLE_TRANSITION',
        message: 'fromPose and toPose cannot reference the same pose.',
        path,
        details: {
          fromPose: node.fromPose,
          toPose: node.toPose,
        },
      });
    }
  });

  return errors;
}

function validateJointRotations(root: unknown, options: Required<DomainValidationOptions>): DomainValidationError[] {
  const errors: DomainValidationError[] = [];
  const bodyModel = getBodyModel('human-3d-v1');

  walk(root, '', (node, path) => {
    if (!isObject(node) || !isObject(node.jointRotations)) {
      return;
    }

    for (const [jointName, jointRotation] of Object.entries(node.jointRotations)) {
      const jointPath = joinPointer(joinPointer(path, 'jointRotations'), jointName);
      const jointDef = bodyModel.jointByName[jointName];

      if (!jointDef) {
        errors.push({
          code: 'INVALID_JOINT_NAME',
          message: `Unknown joint '${jointName}' for body model human-3d-v1.`,
          path: jointPath,
          details: { jointName },
        });
        continue;
      }

      if (isQuaternion(jointRotation)) {
        const length = quaternionLength(jointRotation);

        if (Math.abs(1 - length) > options.quaternionTolerance) {
          if (options.normalizeQuaternions && length > 0) {
            jointRotation[0] /= length;
            jointRotation[1] /= length;
            jointRotation[2] /= length;
            jointRotation[3] /= length;
          } else {
            errors.push({
              code: 'INVALID_QUATERNION_LENGTH',
              message: `Quaternion length (${length.toFixed(6)}) is outside tolerance for unit quaternion.`,
              path: jointPath,
              details: {
                length,
                tolerance: options.quaternionTolerance,
              },
            });
          }
        }

        continue;
      }

      if (!isObject(jointRotation)) {
        continue;
      }

      const unit = jointRotation.unit === 'deg' || jointRotation.unit === 'rad' ? jointRotation.unit : undefined;

      for (const constraint of jointDef.constraints) {
        const axisPath = joinPointer(jointPath, constraint.axis);
        const raw = jointRotation[constraint.axis];

        if (typeof raw !== 'number' || !Number.isFinite(raw)) {
          continue;
        }

        const valueDeg = toDegrees(raw, unit);

        if (valueDeg < constraint.minDeg || valueDeg > constraint.maxDeg) {
          if (options.clampEulerToConstraints) {
            const clampedDeg = clamp(valueDeg, constraint.minDeg, constraint.maxDeg);
            jointRotation[constraint.axis] =
              unit === 'deg' ? clampedDeg : clampedDeg / DEG_PER_RAD;
          } else {
            errors.push({
              code: 'ROTATION_OUT_OF_RANGE',
              message: `Joint '${jointName}' axis '${constraint.axis}' is out of range for human-3d-v1.`,
              path: axisPath,
              details: {
                joint: jointName,
                axis: constraint.axis,
                actualDeg: valueDeg,
                minDeg: constraint.minDeg,
                maxDeg: constraint.maxDeg,
              },
            });
          }
        }
      }
    }
  });

  return errors;
}

export function validateDomain3d(
  routine: unknown,
  options: DomainValidationOptions = {},
): DomainValidationError[] {
  const resolvedOptions: Required<DomainValidationOptions> = {
    quaternionTolerance: options.quaternionTolerance ?? 1e-3,
    normalizeQuaternions: options.normalizeQuaternions ?? true,
    clampEulerToConstraints: options.clampEulerToConstraints ?? false,
  };

  const { ids, duplicateErrors } = collectEntityIds(routine);
  const poseDefinitions = collectPoseDefinitions(routine);

  return [
    ...duplicateErrors,
    ...validateReferences(routine, ids, poseDefinitions),
    ...validateJointRotations(routine, resolvedOptions),
  ];
}

/**
 * Runs AJV schema validation first, then 3d domain checks.
 */
export function validateRoutineAfterSchema(
  routine: unknown,
  schemaValidate: AjvLikeValidateFunction,
  options: DomainValidationOptions = {},
): CombinedValidationResult {
  const schemaValid = schemaValidate(routine);
  const schemaErrors = schemaValid
    ? []
    : (schemaValidate.errors ?? []).map((error) => ({
        message: error.message ?? 'Schema validation error',
        path: error.instancePath ?? '',
        keyword: error.keyword,
      }));

  if (!schemaValid) {
    return {
      valid: false,
      schemaErrors,
      domainErrors: [],
    };
  }

  const domainErrors = validateDomain3d(routine, options);

  return {
    valid: domainErrors.length === 0,
    schemaErrors,
    domainErrors,
  };
}
