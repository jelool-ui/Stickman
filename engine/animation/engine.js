// Moteur d'animation : échantillonne les animations, enchaîne les clips avec un fondu de pose,
// gère déplacements, demi-tours, clignements des yeux et synchronisation des gestes avec les dialogues.
import { CLIPS } from './clips.js';
import { completePose, POSE_KEYS } from '../characters/skeleton.js';
import { ease, lerp, clamp, hashString, noise1 } from '../math.js';

const BLEND_TIME = 0.25;

export function lerpPose(a, b, t) {
  const out = {};
  for (const k of POSE_KEYS) out[k] = lerp(a[k], b[k], t);
  return out;
}

/** Pose d'une animation à l'instant local `time` (secondes depuis le début du clip). */
export function samplePose(clipId, time, seed = 0) {
  const clip = CLIPS[clipId] || CLIPS.idle;
  let p = time / clip.period;
  p = clip.loop ? p - Math.floor(p) : clamp(p, 0, 1);
  const keys = clip.keys;
  let i = 0;
  while (i < keys.length - 2 && p > keys[i + 1].t) i++;
  const a = keys[i], b = keys[i + 1] || a;
  const span = b.t - a.t || 1;
  const local = clamp((p - a.t) / span, 0, 1);
  const pose = lerpPose(completePose(a.pose), completePose(b.pose), (ease[b.easing] || ease.inOut)(local));
  // Une animation non cyclique terminée (chute, surprise…) continue de « respirer ».
  if (clip.life || (!clip.loop && time >= clip.period)) addLife(pose, time, seed);
  return pose;
}

/** Respiration et micro-mouvements : un personnage n'est jamais totalement figé. */
export function addLife(pose, time, seed = 0) {
  const breath = Math.sin((time / 3.2) * Math.PI * 2 + seed);
  pose.torso += breath * 1.2;
  pose.squash *= 1 + breath * 0.008;
  pose.head += noise1(time * 0.6, seed) * 3;
  pose.armL += noise1(time * 0.5, seed + 7) * 2.5;
  pose.armR += noise1(time * 0.5, seed + 13) * 2.5;
  return pose;
}

/** Clignement des yeux déterministe (0 = ouverts, 1 = fermés). */
export function blinkAt(time, seed = 0) {
  const period = 3.1 + (seed % 9) * 0.17;
  const phase = (time + (seed % 5) * 0.37) % period;
  const d = 0.14;
  return phase < d ? 1 - Math.abs(phase / d - 0.5) * 2 : 0;
}

/** Ouverture de bouche pendant la parole (0..1). */
export function mouthAt(time, seed = 0) {
  const v = Math.abs(Math.sin(time * Math.PI * 4.3 + seed)) * 0.7 + (noise1(time * 9, seed) + 1) * 0.15;
  return clamp(v, 0, 1);
}

function isSpeaking(actor, t) {
  return (actor.speaking || []).some((w) => t >= w.start && t < w.end);
}

/**
 * Calcule l'état d'un acteur à l'instant t (secondes depuis le début de la scène).
 * actor = { character_id, x, facing, expression, track: [{ animation, start, duration }], speaking: [{ start, end }] }
 */
export function actorStateAt(actor, t) {
  const seed = hashString(actor.character_id || 'x') % 1000;
  const track = actor.track?.length ? actor.track : [{ animation: 'idle', start: 0, duration: Infinity }];
  let x = actor.x ?? 0;
  let facing = actor.facing ?? 1;
  let current = 0;
  const startStates = [];
  // Parcourt les clips pour connaître position et orientation au début de chacun.
  for (let i = 0; i < track.length; i++) {
    const c = track[i];
    const clip = CLIPS[c.animation] || CLIPS.idle;
    startStates.push({ x, facing });
    if (t >= c.start) current = i;
    const dur = Number.isFinite(c.duration) ? c.duration : 0;
    if (clip.speed && !clip.enter && !clip.exit) x += facing * clip.speed * dur;
    if (clip.exit) x += facing * (c.travel ?? clip.travel);
    if (clip.turn) facing = -facing;
  }
  const c = track[current];
  const clip = CLIPS[c.animation] || CLIPS.idle;
  const local = Math.max(0, t - c.start);
  const dur = Number.isFinite(c.duration) ? c.duration : Infinity;
  const progress = Number.isFinite(dur) && dur > 0 ? clamp(local / dur, 0, 1) : 0;
  ({ x, facing } = startStates[current]);

  const speaking = isSpeaking(actor, t);
  // Synchronisation gestes/dialogue : un personnage au repos qui parle fait des gestes.
  const animId = speaking && c.animation === 'idle' ? 'talk' : c.animation;
  let pose = samplePose(animId, local, seed);

  if (clip.speed && !clip.enter && !clip.exit) x += facing * clip.speed * Math.min(local, Number.isFinite(dur) ? dur : local);
  const travel = c.travel ?? clip.travel;
  if (clip.enter) x = startStates[current].x - facing * travel * (1 - progress);
  if (clip.exit) x = startStates[current].x + facing * travel * progress;
  if (clip.turn) facing = facing * Math.cos(Math.PI * clamp(local / clip.period, 0, 1));

  // Fondu de pose avec le clip précédent.
  if (current > 0 && local < BLEND_TIME) {
    const prev = track[current - 1];
    const prevPose = samplePose(prev.animation, Math.max(0, c.start - prev.start), seed);
    pose = lerpPose(prevPose, pose, ease.inOut(local / BLEND_TIME));
  }

  const expression = (CLIPS[animId] || clip).expression || actor.expression || null;
  const mouthOpen = speaking || (CLIPS[animId] || clip).speaking ? mouthAt(t, seed) : 0;
  return { x, facing, pose, expression, mouthOpen, blink: blinkAt(t, seed), animation: animId };
}
