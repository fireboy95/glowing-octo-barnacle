import React from 'react';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface JointMarker {
  jointName: string;
  position: Vector3;
  radius: number;
}

export interface BoneCapsule {
  fromJoint: string;
  toJoint: string;
  start: Vector3;
  end: Vector3;
  center: Vector3;
  length: number;
  radius: number;
}

export interface SkeletonPrimitiveSet {
  jointMarkers: JointMarker[];
  boneCapsules: BoneCapsule[];
}

export interface SkeletonSceneProps {
  jointPositions: Record<string, Vector3>;
  jointParentByName: Readonly<Record<string, string | null>>;
  markerRadius?: number;
  boneRadius?: number;
  className?: string;
  children?: React.ReactNode;
}

function midpoint(a: Vector3, b: Vector3): Vector3 {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
  };
}

function distance(a: Vector3, b: Vector3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function buildSkeletonPrimitives({
  jointPositions,
  jointParentByName,
  markerRadius = 0.025,
  boneRadius = 0.012,
}: Omit<SkeletonSceneProps, 'className' | 'children'>): SkeletonPrimitiveSet {
  const jointMarkers: JointMarker[] = Object.entries(jointPositions).map(([jointName, position]) => ({
    jointName,
    position,
    radius: markerRadius,
  }));

  const boneCapsules: BoneCapsule[] = [];

  for (const [jointName, parentName] of Object.entries(jointParentByName)) {
    if (!parentName) {
      continue;
    }

    const start = jointPositions[parentName];
    const end = jointPositions[jointName];

    if (!start || !end) {
      continue;
    }

    boneCapsules.push({
      fromJoint: parentName,
      toJoint: jointName,
      start,
      end,
      center: midpoint(start, end),
      length: distance(start, end),
      radius: boneRadius,
    });
  }

  return {
    jointMarkers,
    boneCapsules,
  };
}

/**
 * Render-shell component for 3D skeleton content.
 *
 * This component intentionally stays renderer-agnostic so it can be composed
 * with React Three Fiber, Babylon, or a custom WebGL renderer.
 */
export function SkeletonScene(props: SkeletonSceneProps): React.ReactElement {
  const primitiveSet = React.useMemo(
    () =>
      buildSkeletonPrimitives({
        jointPositions: props.jointPositions,
        jointParentByName: props.jointParentByName,
        markerRadius: props.markerRadius,
        boneRadius: props.boneRadius,
      }),
    [props.jointPositions, props.jointParentByName, props.markerRadius, props.boneRadius],
  );

  return (
    <div className={props.className} data-renderer="skeleton-3d" data-bone-count={primitiveSet.boneCapsules.length}>
      {props.children}
    </div>
  );
}
