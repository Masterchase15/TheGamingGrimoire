import { useEffect, useRef } from 'react';

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Runs `frame(t)` on rAF only while the canvas is on screen and motion is allowed.
function useCanvasLoop(ref, setup) {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = setup(canvas, ctx);
    let raf = 0;
    let visible = true;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, width * dpr);
      canvas.height = Math.max(1, height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      state.resize?.(width, height);
    };
    resize();
    const loop = (t) => {
      state.frame(t);
      if (visible && !prefersReducedMotion()) raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(loop);
    });
    io.observe(canvas);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    state.frame(0);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, [ref, setup]);
}

const setupEmbers = (canvas, ctx) => {
  let w = 0;
  let h = 0;
  let particles = [];
  const spawn = (fresh) => ({
    x: Math.random() * w,
    y: fresh ? Math.random() * h : h + 10,
    r: Math.random() * 1.8 + 0.4,
    vy: Math.random() * 0.45 + 0.15,
    vx: (Math.random() - 0.5) * 0.25,
    life: Math.random() * 0.6 + 0.4,
    hue: Math.random() < 0.7 ? 45 : 14,
    phase: Math.random() * Math.PI * 2,
  });
  return {
    resize(width, height) {
      w = width;
      h = height;
      const count = Math.round(Math.min(90, (w * h) / 14000));
      particles = Array.from({ length: count }, () => spawn(true));
    },
    frame(t) {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.y -= p.vy;
        p.x += p.vx + Math.sin(t / 1400 + p.phase) * 0.15;
        if (p.y < -10) Object.assign(p, spawn(false));
        const alpha = Math.max(0, Math.min(1, p.y / h)) * p.life;
        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue}, 100%, 62%, ${alpha})`;
        ctx.shadowColor = `hsla(${p.hue}, 100%, 55%, ${alpha})`;
        ctx.shadowBlur = 8;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };
};

/** Drifting ember particles (a nod to dungeonsanddragons.com). Static under reduced motion. */
export function Embers({ className = 'hero-embers' }) {
  const ref = useRef(null);
  useCanvasLoop(ref, setupEmbers);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

// Small value-noise implementation for the LED matrix.
function makeNoise() {
  const perm = Array.from({ length: 512 }, () => Math.random());
  const hash = (x, y) => perm[(((x * 73856093) ^ (y * 19349663)) >>> 0) % 512];
  const smooth = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = smooth(x - xi);
    const yf = smooth(y - yi);
    const top = hash(xi, yi) * (1 - xf) + hash(xi + 1, yi) * xf;
    const bottom = hash(xi, yi + 1) * (1 - xf) + hash(xi + 1, yi + 1) * xf;
    return top * (1 - yf) + bottom * yf;
  };
}

const CELLS = 12;
const setupMatrix = (canvas, ctx) => {
  const noise = makeNoise();
  let size = 0;
  return {
    resize(width) {
      size = width;
    },
    frame(t) {
      const gap = size * 0.012;
      const cell = (size - gap * (CELLS - 1)) / CELLS;
      ctx.clearRect(0, 0, size, size);
      for (let y = 0; y < CELLS; y++) {
        for (let x = 0; x < CELLS; x++) {
          const v = noise(x * 0.28 + t / 2400, y * 0.28 - t / 3100);
          const lit = v > 0.62 ? 1 : v > 0.5 ? 0.45 : 0.08;
          ctx.fillStyle = lit === 1 ? '#ffd23f' : lit > 0.4 ? 'rgba(255, 210, 63, 0.38)' : 'rgba(255, 255, 255, 0.06)';
          ctx.fillRect(x * (cell + gap), y * (cell + gap), cell, cell);
        }
      }
    },
  };
};

/** 12×12 LED grid lit by noise (a nod to vybe.art). */
export function PixelMatrix() {
  const ref = useRef(null);
  useCanvasLoop(ref, setupMatrix);
  return <canvas ref={ref} className="matrix" aria-hidden="true" />;
}
