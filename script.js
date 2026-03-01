"use strict";

// splash duration
const SPLASH_MS = 1400;

window.addEventListener("load", () => {
  const splash = document.getElementById("splash");

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

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
    splash.addEventListener("animationend", removeSplash, { once: true });
    setTimeout(removeSplash, 1200);
  }, SPLASH_MS);

  setTimeout(removeSplash, SPLASH_MS + 2500);
});

// header scroll animation
const header = document.querySelector(".site-header");
const onHeaderScroll = () => {
  if (!header) return;
  header.classList.toggle("scrolled", window.scrollY > 20);
};
onHeaderScroll();
window.addEventListener("scroll", onHeaderScroll, { passive: true });

// scroll reveal
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reducedMotion && "IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
  );

  document.querySelectorAll(".reveal").forEach((el) => {
    const delay = el.getAttribute("data-delay");
    if (delay) el.style.transitionDelay = `${delay}ms`;
    io.observe(el);
  });
} else {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in-view"));
}

// navbar aria helper
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
   LOCAL SCATTER (dark, free shape)
   - no vertical movement
   - looks like coming from box top area
========================================================= */
(() => {
  const wrap = document.getElementById("artScatter");
  if (!wrap) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = wrap.querySelector(".scatter-local");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });

  const PALETTE = [
    [8, 8, 12],
    [18, 18, 26],
    [40, 40, 52],
    [70, 70, 88],
    [110, 110, 130],
  ];

  const isMobile = window.matchMedia("(max-width: 900px)").matches;
  const COUNT = isMobile ? 220 : 380;

  // ✅ Focus area near the TOP opening of box
  const FOCUS_X = 0.52;
  const FOCUS_Y = 0.36;   // higher = nearer top
  const SPREAD_X = 0.50;
  const SPREAD_Y = 0.32;  // tighter vertically so it feels like coming out

  const BASE_SPRING = 0.0048;
  const FRICTION = 0.90;
  const GRAVITY = 0.0;    // ✅ no up/down drift

  let DPR = 1, W = 0, H = 0;
  let active = true;

  const particles = [];
  let lastY = window.scrollY;
  let scrollImpulse = 0;

  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function gauss() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  function resize() {
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

    const seeds = Array.from({ length: 6 }, () => ({
      x: cx + rand(-W * 0.18, W * 0.18),
      y: cy + rand(-H * 0.10, H * 0.16),
      sx: rand(W * 0.06, W * 0.26),
      sy: rand(H * 0.04, H * 0.18),
    }));

    for (let i = 0; i < COUNT; i++) {
      const [r, g, b] = pick(PALETTE);

      const z = rand(0.55, 1.25);
      const kind = pick(["dust", "dust", "dust", "shard", "shard", "blob"]);
      const shape = pick(["circle", "square", "tri", "line"]);

      let ax, ay;

      if (Math.random() < 0.75) {
        const s = pick(seeds);
        ax = s.x + gauss() * s.sx * SPREAD_X;
        ay = s.y + gauss() * s.sy * SPREAD_Y;
      } else {
        ax = rand(W * 0.10, W * 0.90);
        ay = rand(H * 0.10, H * 0.90);
      }

      ax = clamp(ax, 0, W);
      ay = clamp(ay, 0, H);

      let size, alpha;
      if (kind === "dust") {
        size = rand(0.8, 3.2) * z;
        alpha = rand(0.07, 0.20);
      } else if (kind === "shard") {
        size = rand(2.0, 9.5) * z;
        alpha = rand(0.10, 0.30);
      } else {
        size = rand(5.0, 16.0) * z;
        alpha = rand(0.05, 0.14);
      }

      const spring = (Math.random() < 0.22) ? 0 : BASE_SPRING * rand(0.7, 1.4);

      particles.push({
        ax, ay,
        x: ax + rand(-14, 14),
        y: ay + rand(-14, 14),
        vx: rand(-0.22, 0.22),
        vy: rand(-0.22, 0.22),
        z,
        kind,
        shape,
        size,
        alpha,
        spring,
        rot: rand(0, Math.PI * 2),
        spin: rand(-0.07, 0.07),
        phase: rand(0, Math.PI * 2),
        r, g, b,
      });
    }
  }

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
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  // pointer disturb inside box
  let pointerInside = false;
  const mouse = { x: -9999, y: -9999 };

  wrap.addEventListener("pointerenter", () => (pointerInside = true));
  wrap.addEventListener("pointerleave", () => (pointerInside = false));

  window.addEventListener("pointermove", (e) => {
    if (!pointerInside) return;
    const r = wrap.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  }, { passive: true });

  // throttled FPS
  let lastFrame = 0;
  const FPS = 32;
  const FRAME_MS = 1000 / FPS;

  function drawParticle(p, energy) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);

    ctx.globalAlpha = p.alpha + energy * 0.06;
    ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},1)`;

    if (p.kind === "shard" && p.shape === "line") {
      const w = p.size * 2.2;
      const h = Math.max(1.1, p.size * 0.18);
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

  function tick(t) {
    requestAnimationFrame(tick);
    if (!active) return;
    if (t - lastFrame < FRAME_MS) return;
    lastFrame = t;

    ctx.clearRect(0, 0, W, H);

    const cx = W * FOCUS_X;
    const cy = H * FOCUS_Y;

    const energy = Math.min(1, Math.abs(scrollImpulse) / 90);

    // scroll expand/contract (no up/down)
    const expand = scrollImpulse * 0.00009;

    for (const p of particles) {
      p.vx += (p.ax - p.x) * p.spring;
      p.vy += (p.ay - p.y) * p.spring;

      // shimmer (very tiny vertical so it won't look like bobbing)
      const n1 = Math.sin(t * 0.0012 + p.phase);
      const n2 = Math.cos(t * 0.0016 + p.phase * 1.7);
      p.vx += n1 * 0.004 * p.z;
      p.vy += n2 * 0.0016 * p.z;

      // expand/contract from focus (feels like burst area)
      const dx = p.x - cx, dy = p.y - cy;
      p.vx += dx * expand * p.z;
      p.vy += dy * expand * p.z;

      // pointer disturb
      if (pointerInside) {
        const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
        const d2 = mdx * mdx + mdy * mdy;
        const R = 130;
        if (d2 < R * R) {
          const d = Math.max(18, Math.sqrt(d2));
          const push = (1 - d / R) * 0.40 * p.z;
          p.vx += (mdx / d) * push;
          p.vy += (mdy / d) * push;
        }
      }

      p.vx *= FRICTION;
      p.vy *= FRICTION;
      p.vy += GRAVITY;

      p.x += p.vx;
      p.y += p.vy;

      p.rot += p.spin;

      drawParticle(p, energy);
    }

    scrollImpulse *= 0.86;
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(tick);
})();


/* =========================
   SCROLL-REACTIVE NEON (smooth, low-lag)
   - Updates CSS vars --sx/--sy
   - Runs ONLY while scrolling
========================= */
(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  const bg = document.querySelector(".bg");
  if (!bg) return;

  let lastY = window.scrollY;
  let targetX = 0, targetY = 0;
  let x = 0, y = 0;
  let running = false;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function loop() {
    // ease
    x += (targetX - x) * 0.10;
    y += (targetY - y) * 0.10;

    // decay targets so it settles
    targetX *= 0.90;
    targetY *= 0.88;

    bg.style.setProperty("--sx", x.toFixed(2));
    bg.style.setProperty("--sy", y.toFixed(2));

    const stillMoving =
      Math.abs(x) > 0.08 || Math.abs(y) > 0.08 ||
      Math.abs(targetX) > 0.08 || Math.abs(targetY) > 0.08;

    if (stillMoving) requestAnimationFrame(loop);
    else running = false;
  }

  window.addEventListener("scroll", () => {
    const sy = window.scrollY;
    const delta = sy - lastY;
    lastY = sy;

    // push neon opposite to scroll a bit (feels reactive)
    targetY = clamp(targetY + (-delta * 0.18), -55, 55);

    // tiny side drift (smooth, not random ugly)
    targetX = clamp(Math.sin(sy * 0.002) * 24, -24, 24);

    if (!running) {
      running = true;
      requestAnimationFrame(loop);
    }
  }, { passive: true });
})();

/* Smooth scroll for navbar links (nice + consistent) */
(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;

      const el = document.querySelector(id);
      if (!el) return;

      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
})();

/* =========================================================
   WORD-BY-WORD DARKEN ON SCROLL (smooth, lightweight)
========================================================= */
(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  const targets = Array.from(document.querySelectorAll("[data-wordreveal]"));
  if (!targets.length) return;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Split text into word spans once
  const items = targets.map(el => {
    const text = (el.textContent || "").trim();
    const words = text.split(/\s+/).filter(Boolean);

    el.textContent = "";
    el.classList.add("wordreveal");

    const spans = words.map(w => {
      const s = document.createElement("span");
      s.className = "w";
      s.textContent = w;
      el.appendChild(s);
      return s;
    });

    return { el, spans };
  });

  let ticking = false;

  function update() {
    ticking = false;

    const vh = window.innerHeight;

    for (const it of items) {
      const r = it.el.getBoundingClientRect();

      // Start when headline is near center, finish when it passes
      const start = vh * 0.70; // begin darkening
      const end   = vh * 0.25; // fully dark by here

      // progress 0..1
      const p = clamp((start - r.top) / (start - end), 0, 1);

      const n = it.spans.length;
      const onCount = Math.floor(p * n);

      for (let i = 0; i < n; i++) {
        it.spans[i].classList.toggle("on", i < onCount);
      }
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();