import React, { useEffect, useRef, useState } from 'react';
import { renderFrame, computeTimeline } from '../../engine/scenes/compose.js';

/**
 * Lecteur d'aperçu : dessine le storyboard image par image avec le même moteur que le rendu vidéo.
 * L'aperçu est calculé en résolution réduite pour rester fluide sur smartphone.
 */
export default function Player({ storyboard, characters, style = 'classic', width = 270, autoPlay = false, loop = true, fps = 24 }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [time, setTime] = useState(0);
  const { duration } = computeTimeline(storyboard);
  const height = Math.round((width * 16) / 9);
  const start = useRef(0);

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = renderFrame(storyboard, characters, time, { width: 540, height: 960, style })
      .replace('<svg ', `<svg style="width:100%;height:100%;display:block" `);
  }, [storyboard, characters, time, style]);

  useEffect(() => {
    if (!playing) return undefined;
    let raf;
    let lastDraw = 0;
    start.current = performance.now() - time * 1000;
    const tick = (now) => {
      let t = (now - start.current) / 1000;
      if (t >= duration) {
        if (!loop) { setPlaying(false); setTime(duration); return; }
        start.current = now; t = 0;
      }
      if (now - lastDraw >= 1000 / fps) { lastDraw = now; setTime(t); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, duration, loop, fps]);

  return (
    <div className="player">
      <div className="player-screen" style={{ width, height }} ref={ref} />
      <div className="player-controls">
        <button className="btn" onClick={() => { if (time >= duration) setTime(0); setPlaying((p) => !p); }}>{playing ? '⏸' : '▶️'}</button>
        <input type="range" min={0} max={duration} step={0.05} value={Math.min(time, duration)}
          onChange={(e) => { setPlaying(false); setTime(Number(e.target.value)); }} aria-label="Position" />
        <span className="muted small">{time.toFixed(1)} / {duration.toFixed(1)} s</span>
      </div>
    </div>
  );
}
