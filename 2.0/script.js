// helpers
const $ = (q, r = document) => r.querySelector(q);
const $$ = (q, r = document) => Array.from(r.querySelectorAll(q));

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// year
$("#year").textContent = new Date().getFullYear();

// page load
window.addEventListener("load", () => {
  document.body.classList.remove("preload");
  document.body.classList.add("loaded");
});

// mobile nav
const navToggle = $("#navToggle");
const navPanel = $("#navPanel");

function setNav(open) {
  navPanel.classList.toggle("is-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

navToggle?.addEventListener("click", () => {
  const isOpen = navPanel.classList.contains("is-open");
  setNav(!isOpen);
});

document.addEventListener("click", (e) => {
  if (!navPanel.contains(e.target) && !navToggle.contains(e.target)) setNav(false);
});

$$(".nav__link").forEach((a) => a.addEventListener("click", () => setNav(false)));

// smooth scroll (for older browsers if needed)
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (!id || id === "#") return;
    const el = $(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.pushState(null, "", id);
  });
});

// active link on scroll
const links = $$(".nav__link");
const sections = links.map((a) => $(a.getAttribute("href"))).filter(Boolean);

function setActive(id) {
  links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`));
}

window.addEventListener(
  "scroll",
  () => {
    const y = window.scrollY + 130;
    let current = "top";
    for (const sec of sections) if (sec.offsetTop <= y) current = sec.id;
    setActive(current);
  },
  { passive: true }
);

// reveal on scroll
const revealEls = $$(".reveal");
if (!prefersReducedMotion) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    },
    { threshold: 0.14 }
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

// ripple
function ripple(e) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const ink = document.createElement("span");
  ink.className = "ripple__ink";
  ink.style.left = `${e.clientX - rect.left}px`;
  ink.style.top = `${e.clientY - rect.top}px`;
  btn.appendChild(ink);
  ink.addEventListener("animationend", () => ink.remove());
}
$$(".ripple").forEach((b) => b.addEventListener("click", ripple));

// parallax blobs (very light, performant)
let mx = 0,
  my = 0,
  tx = 0,
  ty = 0;

function onMove(e) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  mx = (e.clientX / w - 0.5) * 2; // -1..1
  my = (e.clientY / h - 0.5) * 2;
}

if (!prefersReducedMotion) {
  window.addEventListener("mousemove", onMove, { passive: true });

  const animate = () => {
    tx += (mx - tx) * 0.06;
    ty += (my - ty) * 0.06;
    document.documentElement.style.setProperty("--mx", tx.toFixed(3));
    document.documentElement.style.setProperty("--my", ty.toFixed(3));
    requestAnimationFrame(animate);
  };
  animate();
}

// tilt cards
const tiltCards = $$(".tilt");
if (!prefersReducedMotion) {
  tiltCards.forEach((card) => {
    let raf = 0;

    const onEnter = () => {
      card.style.willChange = "transform";
    };

    const onLeave = () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
      card.style.setProperty("--tx", "0px");
      card.style.setProperty("--ty", "0px");
      card.style.willChange = "auto";
    };

    const onMoveCard = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width; // 0..1
        const py = (e.clientY - r.top) / r.height;

        const ry = (px - 0.5) * 10; // rotateY
        const rx = (0.5 - py) * 8;  // rotateX
        const tx = (px - 0.5) * 6;  // translate
        const ty = (py - 0.5) * 6;

        card.style.setProperty("--rx", `${rx}deg`);
        card.style.setProperty("--ry", `${ry}deg`);
        card.style.setProperty("--tx", `${tx}px`);
        card.style.setProperty("--ty", `${ty}px`);
      });
    };

    card.addEventListener("mouseenter", onEnter);
    card.addEventListener("mouseleave", onLeave);
    card.addEventListener("mousemove", onMoveCard, { passive: true });
  });
}