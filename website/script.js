"use strict";

/* =========================================================
   FLAGS
========================================================= */
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* =========================================================
   BOOT SEQUENCE (after splash)
========================================================= */
window.__BOOT_READY = false;

function startBootSequence() {
  const b = document.body;

  if (reducedMotion) {
    b.classList.remove("boot-hold");
    b.classList.add("boot-bg", "boot-nav");
    window.__BOOT_READY = true;
    return;
  }

  b.classList.add("boot-seq", "boot-hold");

  // 1) BG
  setTimeout(() => b.classList.add("boot-bg"), 60);

  // 2) NAV
  setTimeout(() => b.classList.add("boot-nav"), 320);

  // 3) CONTENT + allow canvases
  setTimeout(() => {
    b.classList.remove("boot-hold");
    window.__BOOT_READY = true;
  }, 620);

  setTimeout(() => b.classList.remove("boot-seq"), 1200);
}

/* =========================================================
   SPLASH + FOOTER YEAR
========================================================= */
const SPLASH_MS = 1400;

window.addEventListener("load", () => {
  const splash = document.getElementById("splash");

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  if (!splash) {
    document.body.classList.remove("splash-open");
    startBootSequence();
    return;
  }

  const removeSplash = () => {
    if (splash && splash.isConnected) splash.remove();
    document.body.classList.remove("splash-open");
    startBootSequence();
  };

  setTimeout(() => {
    splash.classList.add("hide");
    splash.addEventListener("animationend", removeSplash, { once: true });
    setTimeout(removeSplash, 1200);
  }, SPLASH_MS);

  setTimeout(removeSplash, SPLASH_MS + 2500);
});

/* =========================================================
   HEADER SHRINK ON SCROLL
========================================================= */
(() => {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 20);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

/* =========================================================
   NAV CTA SWITCH: White on Hero -> Mix after Hero
========================================================= */
(() => {
  const hero = document.getElementById("home");
  if (!hero) return;

  if (!("IntersectionObserver" in window)) {
    window.addEventListener("scroll", () => {
      document.body.classList.toggle("nav-cta-mix", window.scrollY > window.innerHeight * 0.55);
    }, { passive: true });
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      document.body.classList.toggle("nav-cta-mix", !e.isIntersecting);
    },
    { threshold: 0.35 }
  );

  io.observe(hero);
})();

/* =========================================================
   MOBILE MENU
========================================================= */
(() => {
  const btn = document.getElementById("menuBtn");
  const close = document.getElementById("menuClose");
  const overlay = document.getElementById("mobileMenu");
  if (!btn || !close || !overlay) return;

  const openMenu = () => {
    document.body.classList.add("menu-open");
    btn.setAttribute("aria-expanded", "true");
    overlay.setAttribute("aria-hidden", "false");
  };

  const closeMenu = () => {
    document.body.classList.remove("menu-open");
    btn.setAttribute("aria-expanded", "false");
    overlay.setAttribute("aria-hidden", "true");
  };

  btn.addEventListener("click", openMenu);
  close.addEventListener("click", closeMenu);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeMenu();
  });

  overlay.querySelectorAll("a[href^='#']").forEach(a => a.addEventListener("click", closeMenu));

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("menu-open")) closeMenu();
  });
})();

/* =========================================================
   NAV DROPDOWN aria-expanded
========================================================= */
(() => {
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
})();

/* =========================================================
   SMOOTH SCROLL FOR HASH LINKS
========================================================= */
(() => {
  if (reducedMotion) return;

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
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
   BG DRIFT (fast transform only)
========================================================= */
(() => {
  if (reducedMotion) return;
  const bg = document.querySelector(".bg");
  if (!bg) return;

  let lastY = window.scrollY;
  let tx = 0, ty = 0;
  let x = 0, y = 0;
  let running = false;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function loop() {
    x += (tx - x) * 0.08;
    y += (ty - y) * 0.08;

    bg.style.setProperty("--sx", x.toFixed(2));
    bg.style.setProperty("--sy", y.toFixed(2));

    const still = Math.abs(tx - x) + Math.abs(ty - y) > 0.15;
    if (still) requestAnimationFrame(loop);
    else running = false;
  }

  window.addEventListener("scroll", () => {
    const sy = window.scrollY;
    const d = sy - lastY;
    lastY = sy;

    tx = clamp(Math.sin(sy * 0.002) * 18, -18, 18);
    ty = clamp(ty + (-d * 0.12), -26, 26);

    if (!running) { running = true; requestAnimationFrame(loop); }
  }, { passive: true });

  if (!running) { running = true; requestAnimationFrame(loop); }
})();

/* =========================================================
   NEON STATES
========================================================= */
(() => {
  if (reducedMotion) return;

  const pricing = document.getElementById("pricing");
  if (!pricing) return;

  const body = document.body;
  let inPricing = false;

  const updateAway = () => {
    if (inPricing) return;
    const vh = Math.max(1, window.innerHeight);
    const shouldHide = window.scrollY > vh * 0.85;
    body.classList.toggle("neon-away", shouldHide);
  };

  const enterPricing = () => {
    body.classList.remove("neon-away");
    body.classList.add("neon-pricing-prep");

    requestAnimationFrame(() => {
      body.classList.add("neon-pricing");
      body.classList.remove("neon-pricing-prep");
    });
  };

  const exitPricing = () => {
    body.classList.remove("neon-pricing");
    body.classList.remove("neon-pricing-prep");
    updateAway();
  };

  const io = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      if (!e) return;

      if (e.isIntersecting) {
        if (!inPricing) { inPricing = true; enterPricing(); }
      } else {
        if (inPricing) { inPricing = false; exitPricing(); }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -35% 0px" }
  );

  io.observe(pricing);

  window.addEventListener("scroll", updateAway, { passive: true });
  window.addEventListener("resize", updateAway, { passive: true });
  updateAway();
})();

/* =========================================================
   STAGGER HELPERS
========================================================= */
(() => {
  const groups = document.querySelectorAll("[data-stagger]");
  groups.forEach((g) => {
    const step = Number(g.getAttribute("data-stagger")) || 80;
    const kids = Array.from(g.children).filter((el) => !el.classList.contains("anchor"));
    kids.forEach((el, i) => {
      if (!el.classList.contains("reveal")) el.classList.add("reveal", "reveal-up");
      const existing = el.getAttribute("data-delay");
      if (!existing) el.setAttribute("data-delay", String(i * step));
    });
  });
})();

/* =========================================================
   SCROLL REVEAL (ENTER + EXIT)
========================================================= */
(() => {
  const els = Array.from(document.querySelectorAll(".reveal"));

  if (reducedMotion || !("IntersectionObserver" in window)) {
    els.forEach((el) => {
      const delay = el.getAttribute("data-delay");
      if (delay) el.style.transitionDelay = `${delay}ms`;
      el.classList.add("in-view");
      el.classList.remove("out-view");
    });
    return;
  }

  els.forEach((el) => {
    const delay = el.getAttribute("data-delay");
    if (delay) el.style.transitionDelay = `${delay}ms`;
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        const el = e.target;
        if (e.isIntersecting) {
          el.classList.add("in-view");
          el.classList.remove("out-view");
        } else {
          if (el.classList.contains("in-view")) {
            el.classList.remove("in-view");
            el.classList.add("out-view");
          }
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -12% 0px" }
  );

  els.forEach((el) => io.observe(el));
})();

/* =========================================================
   WORD-BY-WORD DARKEN ON SCROLL
========================================================= */
(() => {
  if (reducedMotion) return;

  const targets = Array.from(document.querySelectorAll("[data-wordreveal]"));
  if (!targets.length) return;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const items = targets.map((el) => {
    const text = (el.textContent || "").trim();
    const words = text.split(/\s+/).filter(Boolean);

    el.textContent = "";
    el.classList.add("wordreveal");

    const spans = words.map((w) => {
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
      const start = vh * 0.70;
      const end = vh * 0.25;

      const p = clamp((start - r.top) / (start - end), 0, 1);
      const n = it.spans.length;
      const onCount = Math.floor(p * n);

      for (let i = 0; i < n; i++) it.spans[i].classList.toggle("on", i < onCount);
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

/* =========================================================
   FEATURES STORY: active step + counter
========================================================= */
(() => {
  const root = document.querySelector("#features.features-story");
  if (!root) return;

  const steps = Array.from(root.querySelectorAll(".step"));
  const counterEl = document.getElementById("featureCounter");

  if (!("IntersectionObserver" in window) || steps.length === 0) {
    steps[0]?.classList.add("active");
    if (counterEl) counterEl.textContent = "01";
    return;
  }

  const setActive = (id) => {
    steps.forEach(s => s.classList.toggle("active", s.id === id));
    const active = steps.find(s => s.id === id);
    const n = active?.querySelector(".step-num")?.textContent?.trim();
    if (counterEl && n) counterEl.textContent = n;
  };

  const io = new IntersectionObserver(
    (entries) => {
      let best = null;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
      }
      if (best?.target?.id) setActive(best.target.id);
    },
    { threshold: [0.35, 0.55, 0.75] }
  );

  steps.forEach(s => io.observe(s));
  setActive(steps[0].id);
})();

/* =========================================================
   DEMO FORM (frontend success only)
========================================================= */
(() => {
  const form = document.querySelector(".demo-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (form.classList.contains("sent")) return;
    form.classList.add("sent");
    const btn = form.querySelector(".demo-submit");
    if (btn) btn.textContent = "Request Received";
  });
})();

/* =========================================================
   HERO LOCAL SCATTER (COLORFUL BRAND)
========================================================= */
(() => {
  const wrap = document.getElementById("artScatter");
  if (!wrap) return;
  if (reducedMotion) return;

  const canvas = wrap.querySelector(".scatter-local");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });

  const PALETTE = [
    [255, 0, 200],
    [255, 140, 0],
    [0, 120, 255],
    [255, 120, 220],
    [120, 200, 255],
    [255, 210, 120],
  ];

  const isMobile = window.matchMedia("(max-width: 900px)").matches;
  const COUNT = isMobile ? 240 : 420;

  const FOCUS_X = 0.52;
  const FOCUS_Y = 0.36;
  const SPREAD_X = 0.50;
  const SPREAD_Y = 0.32;

  const BASE_SPRING = 0.0048;
  const FRICTION = 0.90;

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
        alpha = rand(0.06, 0.16);
      } else if (kind === "shard") {
        size = rand(2.0, 9.5) * z;
        alpha = rand(0.08, 0.22);
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

  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    const delta = y - lastY;
    lastY = y;
    scrollImpulse = Math.max(-120, Math.min(120, delta));
  }, { passive: true });

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

  let lastFrame = 0;
  const FPS = 32;
  const FRAME_MS = 1000 / FPS;

  function drawParticle(p, energy) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);

    ctx.globalAlpha = p.alpha + energy * 0.07;
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
    if (!window.__BOOT_READY) return;
    if (t - lastFrame < FRAME_MS) return;
    lastFrame = t;

    ctx.clearRect(0, 0, W, H);

    ctx.globalCompositeOperation = "lighter";

    const cx = W * FOCUS_X;
    const cy = H * FOCUS_Y;
    const energy = Math.min(1, Math.abs(scrollImpulse) / 90);
    const expand = scrollImpulse * 0.00009;

    for (const p of particles) {
      p.vx += (p.ax - p.x) * p.spring;
      p.vy += (p.ay - p.y) * p.spring;

      const n1 = Math.sin(t * 0.0012 + p.phase);
      const n2 = Math.cos(t * 0.0016 + p.phase * 1.7);
      p.vx += n1 * 0.004 * p.z;
      p.vy += n2 * 0.0016 * p.z;

      const dx = p.x - cx, dy = p.y - cy;
      p.vx += dx * expand * p.z;
      p.vy += dy * expand * p.z;

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

      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.spin;

      drawParticle(p, energy);
    }

    ctx.globalCompositeOperation = "source-over";
    scrollImpulse *= 0.86;
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(tick);
})();

/* =========================================================
   FOOTER SCATTER (COLORFUL + HIGH RISE)
========================================================= */
(() => {
  if (reducedMotion) return;

  const footer = document.getElementById("footer");
  const canvas = document.getElementById("footerScatter");
  if (!footer || !canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });

  const PALETTE = [
    [255, 0, 200],
    [255, 140, 0],
    [0, 120, 255],
    [255, 120, 220],
    [120, 200, 255],
    [255, 210, 120],
  ];

  let W = 0, H = 0, DPR = 1;
  let active = false;

  const particles = [];
  const MAX = 600;

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  function resize() {
    DPR = Math.min(1.7, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, Math.floor(rect.width));
    H = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function spawnLineWave() {
    const spacing = 18;
    const count = Math.max(20, Math.floor(W / spacing));
    const step = W / count;

    for (let i = 0; i < count; i++) {
      if (particles.length >= MAX) break;

      const [r, g, b] = pick(PALETTE);
      const kind = pick(["dust", "dust", "dust", "shard", "shard", "blob"]);
      const shape = pick(["circle", "square", "tri", "line"]);

      const z = rand(0.6, 1.25);

      let size, alpha;
      if (kind === "dust") { size = rand(0.9, 3.0) * z; alpha = rand(0.10, 0.26); }
      else if (kind === "shard") { size = rand(2.2, 9.0) * z; alpha = rand(0.12, 0.30); }
      else { size = rand(5.0, 16.0) * z; alpha = rand(0.08, 0.18); }

      const x = i * step + rand(-step * 0.35, step * 0.35);
      const y = H + rand(0, 16);

      // MUCH higher rise
      const yLimit = H * rand(0.03, 0.12);

      particles.push({
        x, y,
        vx: rand(-0.10, 0.10) * z,
        vy: -rand(0.40, 1.10) * z,
        r, g, b,
        size,
        a: alpha,
        kind,
        shape,
        z,
        yLimit,
        rot: rand(0, Math.PI * 2),
        spin: rand(-0.06, 0.06) * z,
        phase: rand(0, Math.PI * 2),
      });
    }
  }

  function drawParticle(p, t) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);

    const n1 = Math.sin(t * 0.0011 + p.phase) * 0.25 * p.z;
    const n2 = Math.cos(t * 0.0015 + p.phase * 1.6) * 0.18 * p.z;

    ctx.globalAlpha = p.a;
    ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},1)`;

    if (p.kind === "shard" && p.shape === "line") {
      const w = p.size * 2.2;
      const h = Math.max(1.0, p.size * 0.18);
      ctx.fillRect(-w / 2 + n1, -h / 2 + n2, w, h);
    } else if (p.shape === "circle") {
      ctx.beginPath();
      ctx.arc(n1, n2, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === "square") {
      ctx.fillRect(-p.size + n1, -p.size + n2, p.size * 2, p.size * 2);
    } else {
      ctx.beginPath();
      ctx.moveTo(0 + n1, -p.size * 1.2 + n2);
      ctx.lineTo(p.size * 1.15 + n1, p.size * 1.15 + n2);
      ctx.lineTo(-p.size * 1.15 + n1, p.size * 1.15 + n2);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  let last = 0;
  function tick(t) {
    requestAnimationFrame(tick);
    if (!active) return;
    if (!window.__BOOT_READY) return;
    if (t - last < 20) return;
    last = t;

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";

    if (particles.length < MAX && Math.random() < 0.28) spawnLineWave();

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      p.x += p.vx + Math.sin(t * 0.001 + p.phase) * 0.10 * p.z;
      p.y += p.vy;

      // slow a bit as it rises
      p.vy *= 0.995;
      p.rot += p.spin;

      // fade
      if (p.y <= p.yLimit) p.a -= 0.020;
      else p.a -= 0.0032;

      if (p.a <= 0 || p.y < -60 || p.x < -80 || p.x > W + 80) {
        particles.splice(i, 1);
        continue;
      }

      drawParticle(p, t);
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  const io = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      if (!e) return;

      if (e.isIntersecting) {
        document.body.classList.add("footer-scatter-on");
        active = true;
        resize();
        particles.length = 0;
        spawnLineWave();
        spawnLineWave();
      } else {
        document.body.classList.remove("footer-scatter-on");
        active = false;
        particles.length = 0;
        ctx.clearRect(0, 0, W, H);
      }
    },
    { threshold: 0.20 }
  );

  io.observe(footer);
  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(tick);
})();