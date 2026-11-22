// Squelette articulé et cinématique directe.
//
// Convention d'angle (degrés) : 0 = vers le bas, +90 = vers la droite de l'écran, 180 = vers le haut.
// Les personnages sont dessinés « tournés vers la droite » ; facing = -1 les retourne en miroir.
// Une pose contient :
//   torso  : inclinaison du buste vers l'avant (degrés)
//   head   : inclinaison de la tête
//   armL, elbowL, armR, elbowR : bras (épaule = angle absolu, coude = relatif au bras)
//   legL, kneeL, legR, kneeR   : jambes (hanche = angle absolu, genou = relatif à la cuisse)
//   y      : décollage du sol (négatif = en l'air)
//   rot    : rotation du corps entier autour de la hanche (chute…)
//   squash : écrasement vertical (1 = normal)
import { DEG } from '../math.js';

export const BASE_HEIGHT = 230;

export const PROPORTIONS = {
  torso: 0.36, neck: 0.035, headR: 0.148, upperArm: 0.17, forearm: 0.16, thigh: 0.21, shin: 0.21, shoulderDrop: 0.045,
};

export const POSE_KEYS = ['torso', 'head', 'armL', 'elbowL', 'armR', 'elbowR', 'legL', 'kneeL', 'legR', 'kneeR', 'y', 'rot', 'squash'];

export const STAND = Object.freeze({
  torso: 0, head: 0, armL: -28, elbowL: 14, armR: 28, elbowR: -14,
  legL: -12, kneeL: 5, legR: 12, kneeR: -5, y: 0, rot: 0, squash: 1,
});

export function completePose(p = {}) {
  const out = {};
  for (const k of POSE_KEYS) out[k] = Number.isFinite(p[k]) ? p[k] : STAND[k];
  return out;
}

const dir = (a) => [Math.sin(a * DEG), Math.cos(a * DEG)];
const add = (p, a, len) => { const [dx, dy] = dir(a); return [p[0] + dx * len, p[1] + dy * len]; };

/**
 * Calcule la position de chaque articulation. Les pieds (ou le point le plus bas) sont posés sur y = 0
 * puis décalés de pose.y. Coordonnées relatives au point d'ancrage au sol du personnage.
 */
export function solveSkeleton(poseIn, height = BASE_HEIGHT) {
  const pose = completePose(poseIn);
  const P = PROPORTIONS;
  const L = (k) => P[k] * height;
  const hip = [0, 0];
  const torsoAngle = 180 - pose.torso;
  const neck = add(hip, torsoAngle, L('torso') * pose.squash);
  const shoulder = add(hip, torsoAngle, (L('torso') - L('shoulderDrop')) * pose.squash);
  const headAngle = torsoAngle - pose.head;
  const headCenter = add(neck, headAngle, L('neck') + L('headR'));
  const elbowL = add(shoulder, pose.armL, L('upperArm'));
  const handL = add(elbowL, pose.armL + pose.elbowL, L('forearm'));
  const elbowR = add(shoulder, pose.armR, L('upperArm'));
  const handR = add(elbowR, pose.armR + pose.elbowR, L('forearm'));
  const kneeL = add(hip, pose.legL, L('thigh'));
  const footL = add(kneeL, pose.legL + pose.kneeL, L('shin'));
  const kneeR = add(hip, pose.legR, L('thigh'));
  const footR = add(kneeR, pose.legR + pose.kneeR, L('shin'));

  let joints = { hip, neck, shoulder, headCenter, elbowL, handL, elbowR, handR, kneeL, footL, kneeR, footR };

  if (pose.rot) {
    const c = Math.cos(pose.rot * DEG), s = Math.sin(pose.rot * DEG);
    joints = Object.fromEntries(Object.entries(joints).map(([k, [x, y]]) => [k, [x * c - y * s, x * s + y * c]]));
  }

  // Pose au sol : le point le plus bas (pieds, mains ou bas de la tête) touche y = 0.
  const headR = L('headR');
  let lowest = -Infinity;
  for (const [k, [, y]] of Object.entries(joints)) {
    const yy = k === 'headCenter' ? y + headR : y;
    if (yy > lowest) lowest = yy;
  }
  const dy = -lowest + pose.y;
  for (const k of Object.keys(joints)) joints[k] = [joints[k][0], joints[k][1] + dy];

  // Rotation de la tête pour le dessin (SVG rotate, sens horaire) : inclinaison du buste + de la tête + du corps.
  return { joints, headR, headRotation: pose.torso + pose.head + pose.rot, pose };
}
