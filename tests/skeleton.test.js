import { describe, it, expect } from 'vitest';
import { solveSkeleton, PROPORTIONS, BASE_HEIGHT, STAND } from '../engine/characters/skeleton.js';
import { seededRandom } from '../engine/math.js';

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

describe('squelette articulé', () => {
  it('conserve la longueur des os quelle que soit la pose', () => {
    const rnd = seededRandom('bones');
    for (let i = 0; i < 200; i++) {
      const pose = Object.fromEntries(['torso', 'head', 'armL', 'elbowL', 'armR', 'elbowR', 'legL', 'kneeL', 'legR', 'kneeR', 'rot']
        .map((k) => [k, (rnd() - 0.5) * 360]));
      const { joints: j } = solveSkeleton(pose);
      expect(dist(j.shoulder, j.elbowL)).toBeCloseTo(PROPORTIONS.upperArm * BASE_HEIGHT, 6);
      expect(dist(j.elbowR, j.handR)).toBeCloseTo(PROPORTIONS.forearm * BASE_HEIGHT, 6);
      expect(dist(j.hip, j.kneeL)).toBeCloseTo(PROPORTIONS.thigh * BASE_HEIGHT, 6);
      expect(dist(j.kneeR, j.footR)).toBeCloseTo(PROPORTIONS.shin * BASE_HEIGHT, 6);
      expect(dist(j.hip, j.neck)).toBeCloseTo(PROPORTIONS.torso * BASE_HEIGHT, 6);
    }
  });
  it('pose les pieds au sol et décolle avec y négatif', () => {
    const { joints: j } = solveSkeleton(STAND);
    expect(Math.max(j.footL[1], j.footR[1])).toBeCloseTo(0, 6);
    expect(j.headCenter[1]).toBeLessThan(-150);
    const air = solveSkeleton({ ...STAND, y: -50 }).joints;
    expect(Math.max(air.footL[1], air.footR[1])).toBeCloseTo(-50, 6);
  });
  it('un corps tourné de 90° est allongé au sol', () => {
    const { joints: j, headR } = solveSkeleton({ ...STAND, rot: -90 });
    const ys = Object.values(j).map((p) => p[1]);
    expect(Math.max(...ys, j.headCenter[1] + headR)).toBeCloseTo(0, 6);
    expect(Math.abs(j.headCenter[0] - j.footL[0])).toBeGreaterThan(150);
  });
});
