/* =============================
   InventTech script.js (CLEAN)
   - Splash (with failsafes)
   - Header shrink on scroll
   - Scroll reveal
   - Navbar aria helpers
   - Local dark scatter (optimized, no lag)
============================= */

"use strict";

/* -----------------------------
   Splash (failsafe)
----------------------------- */
const SPLASH_MS = 1400;

window.addEventListener("load", () => {
  const splash = document.getElementById("splash");

  // footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // if splash missing, unlock scroll
  if (!splash) {
    document.body.classList.remove("splash-open");
    return;
  }

  const removeSplash = () => {
    if (splash && splash.isConnected) splash.remove();
    document.body.classList.remove("splash-open");
  };

  setTimeout(() => {
    splash.classList.add("hide");

    // normal path
    splash.addEventListener("animationend", removeSplash, { once: true });

    // fallback if animationend doesn't fire
    setTimeout(removeSplash, 1200);
  }, SPLASH_MS);

  // absolute failsafe
  setTimeout(removeSplash, SPLASH_MS + 2500);
});

/* -----------------------------
   Header scroll animation
----------------------------- */
const header = document.querySelector(".site-header");
const onHeaderScroll = () => {
  if (!header) return;
  header.classList.toggle("scrolled", window.scrollY > 20);
};
onHeaderScroll();
window.addEventListener("scroll", onHeaderScroll, { passive: true });

/* -----------------------------
   Scroll reveal animations
----------------------------- */
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reducedMotion) {
  if ("IntersectionObserver" in window) {
    const revealIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            revealIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );

    document.querySelectorAll(".reveal").forEach((el) => {
      const delay = el.getAttribute("data-delay");
      if (delay) el.style.transitionDelay = `${delay}ms`;
      revealIO.observe(el);
    });
  } else {
    // fallback: no IO support
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in-view"));
  }
} else {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in-view"));
}

/* -----------------------------
   Navbar aria-expanded helper
----------------------------- */
document.querySelectorAll(".nav-item.has-sub").forEach((item) => {
  const link = item.querySelector(".nav-link");
  if (!link) return;

  const setExpanded = (v) => link.setAttribute("aria-expanded", v ? "true" : "false");

  item.addEventListener("mouseenter", () => setExpanded(true));
  item.addEventListener("mouseleave", () => setExpanded(false));
  item.addEventListener("focusin", () => setExpanded(true));
  item.addEventListener("focusout", (e) => {
    if (!item.contains(e.relatedTarget)) setExpanded(false);
  });
});

/* =========================================================
   LOCAL SCATTER ZONE (DARK / FREE scatter, optimized)
   - draws ONLY while scrolling / interacting
   - caps DPR
   - no blur filters
   - lower particle count on mobile
========================================================= */
(() => {
  const wrap = document.getElementById("artScatter");
  if (!wrap) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = wrap.querySelector(".scatter-local");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });

  // Dark monochrome palette
  const PALETTE = [
    [8, 8, 12],
    [18, 18, 26],
    [40, 40, 52],
    [70, 70, 88],
    [110, 110, 130],
  ];

  const isMobile = window.matchMedia("(max-width: 900px)").matches;
  const COUNT = isMobile ? 240 : 420;

  // scatter placement (move these if you want)
  const FOCUS_X = 0.60;
  const FOCUS_Y = 0.55;
  const SPREAD_X = 0.44;
  const SPREAD_Y = 0.40;

  // physics
  const BASE_SPRING = 0.0055;
  const FRICTION = 0.90;
  const GRAVITY = 0.012;

  let DPR = 1, W = 0, H = 0;
  let active = true;

  const particles = [];

  let lastY = window.scrollY;
  let scrollImpulse = 0;

  // animate only when needed
  let ticking = false;
  let idleTimer = null;

  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function gauss() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  function start() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(tick);
    }
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      ticking = false;
    }, 140);
  }

  function resize() {
    // cap DPR for smoothness
    DPR = Math.min(1.5, window.devicePixelRatio || 1);

    const rect = wrap.getBoundingClientRect();
    W = Math.max(1, Math.floor(rect.width));
    H = Math.max(1, Math.floor(rect.height));

    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    if (particles.length === 0) initParticles();
  }

  function initParticles() {
    const cx = W * FOCUS_X;
    const cy = H * FOCUS_Y;

    // several random seed points -> irregular scatter
    const seeds = Array.from({ length: 5 }, () => ({
      x: cx + rand(-W * 0.18, W * 0.18),
      y: cy + rand(-H * 0.18, H * 0.18),
      sx: rand(W * 0.06, W * 0.24),
      sy: rand(H * 0.06, H * 0.24),
    }));

    for (let i = 0; i < COUNT; i++) {
      const [r, g, b] = pick(PALETTE);

      const z = rand(0.5, 1.2);
      const kind = pick(["dust", "dust", "dust", "shard", "shard", "blob"]);
      const shape = pick(["circle", "square", "tri", "line"]);

      let ax, ay;

      // 70% seeded gaussian scatter, 30% random fill
      if (Math.random() < 0.7) {
        const s = pick(seeds);
        ax = s.x + gauss() * s.sx * SPREAD_X + gauss() * W * 0.02;
        ay = s.y + gauss() * s.sy * SPREAD_Y + gauss() * H * 0.02;
      } else {
        ax = rand(W * 0.05, W * 0.95);
        ay = rand(H * 0.05, H * 0.95);
      }

      ax = clamp(ax, 0, W);
      ay = clamp(ay, 0, H);

      let size, alpha;
      if (kind === "dust") {
        size = rand(0.8, 3.0) * z;
        alpha = rand(0.08, 0.22);
      } else if (kind === "shard") {
        size = rand(2.0, 9.0) * z;
        alpha = rand(0.12, 0.32);
      } else {
        size = rand(5.0, 16.0) * z;
        alpha = rand(0.05, 0.14);
      }

      const spring = (Math.random() < 0.25) ? 0 : BASE_SPRING * rand(0.7, 1.4);

      particles.push({
        ax, ay,
        x: ax + rand(-14, 14),
        y: ay + rand(-14, 14),
        vx: rand(-0.25, 0.25),
        vy: rand(-0.25, 0.25),
        z,
        kind,
        shape,
        size,
        alpha,
        spring,
        rot: rand(0, Math.PI * 2),
        spin: rand(-0.09, 0.09),
        r, g, b,
      });
    }
  }

  // only animate when zone visible
  if ("IntersectionObserver" in window) {
    const scatterIO = new IntersectionObserver(
      (entries) => entries.forEach((e) => (active = e.isIntersecting)),
      { threshold: 0.08 }
    );
    scatterIO.observe(wrap);
  }

  function onScroll() {
    const y = window.scrollY;
    const delta = y - lastY;
    lastY = y;
    scrollImpulse = Math.max(-120, Math.min(120, delta));
    start();
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  // make interaction feel alive without constant 60fps
  let pointerInside = false;
  wrap.addEventListener("pointerenter", () => {
    pointerInside = true;
    start();
  });
  wrap.addEventListener("pointerleave", () => {
    pointerInside = false;
  });

  const mouse = { x: -9999, y: -9999 };
  window.addEventListener(
    "pointermove",
    (e) => {
      if (!pointerInside) return;
      const r = wrap.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      start(); // animate briefly when moving mouse inside
    },
    { passive: true }
  );

  function drawParticle(p, energy) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);

    ctx.globalAlpha = p.alpha + energy * 0.06;
    ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},1)`;

    if (p.kind === "shard" && p.shape === "line") {
      const w = p.size * 2.2;
      const h = Math.max(1.2, p.size * 0.18);
      ctx.fillRect(-w / 2, -h / 2, w, h);
    } else if (p.shape === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === "square") {
      ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 1.2);
      ctx.lineTo(p.size * 1.15, p.size * 1.15);
      ctx.lineTo(-p.size * 1.15, p.size * 1.15);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  function tick() {
    if (!ticking || !active) return;

    ctx.clearRect(0, 0, W, H);

    const cx = W * FOCUS_X;
    const cy = H * FOCUS_Y;
    const energy = Math.min(1, Math.abs(scrollImpulse) / 90);
    const wind = -scrollImpulse * 0.018;

    for (const p of particles) {
      p.vx += (p.ax - p.x) * p.spring;
      p.vy += (p.ay - p.y) * p.spring;

      p.vy += wind * p.z;

      const dx = p.x - cx, dy = p.y - cy;
      p.vx += (-dy) * 0.00004 * scrollImpulse * p.z;
      p.vy += ( dx) * 0.00004 * scrollImpulse * p.z;

      // pointer disturbance (only meaningful when pointer inside)
      if (pointerInside) {
        const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
        const d2 = mdx * mdx + mdy * mdy;
        const R = 130;
        if (d2 < R * R) {
          const d = Math.max(18, Math.sqrt(d2));
          const push = (1 - d / R) * 0.45 * p.z;
          p.vx += (mdx / d) * push;
          p.vy += (mdy / d) * push;
        }
      }

      p.vx *= FRICTION;
      p.vy *= FRICTION;
      p.vy += GRAVITY * (0.6 + p.z);

      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.spin;

      drawParticle(p, energy);
    }

    scrollImpulse *= 0.86;
    requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener("resize", resize);

  // draw once (cheap)
  ticking = true;
  requestAnimationFrame(() => {
    tick();
    ticking = false;
  });
})();