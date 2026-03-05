// -----------------------------
// Mobile nav toggle
// -----------------------------
const navToggle = document.getElementById("navToggle");
const nav = document.getElementById("nav");

navToggle?.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(open));
});
nav?.querySelectorAll("a").forEach(a => {
  a.addEventListener("click", () => {
    if (nav.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      navToggle?.setAttribute("aria-expanded", "false");
    }
  });
});

// Footer year
document.getElementById("year").textContent = String(new Date().getFullYear());

// -----------------------------
// Cookie banner
// -----------------------------
const cookie = document.getElementById("cookie");
const cookieAccept = document.getElementById("cookieAccept");
const cookieDecline = document.getElementById("cookieDecline");

const cookieKey = "cookie_consent_v1";
const existing = localStorage.getItem(cookieKey);
if (existing) cookie.style.display = "none";

function hideCookie(value) {
  localStorage.setItem(cookieKey, value);
  cookie.style.display = "none";
}
cookieAccept?.addEventListener("click", () => hideCookie("accepted"));
cookieDecline?.addEventListener("click", () => hideCookie("declined"));

// -----------------------------
// 2s Loader -> then reveal page
// -----------------------------
const loader = document.getElementById("loader");

function startPage() {
  document.body.classList.add("page-ready");
  loader?.classList.add("is-hidden");
}

window.addEventListener("load", () => {
  // Always show loader at least 2 seconds
  setTimeout(startPage, 2000);
});

// -----------------------------
// Reveal-on-scroll for ALL elements with .reveal
// Use data-delay="0.10" etc on HTML
// -----------------------------
const revealEls = Array.from(document.querySelectorAll(".reveal"));

revealEls.forEach(el => {
  const delay = el.getAttribute("data-delay");
  if (delay) el.style.setProperty("--delay", `${delay}s`);
});

const revealIO = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    revealIO.unobserve(entry.target);
  });
}, { threshold: 0.15 });

revealEls.forEach(el => revealIO.observe(el));
// -----------------------------
// Pinned stats with scroll-steps
// -----------------------------
const statsStage = document.getElementById("statsStage");
const statsPin = document.getElementById("statsPin");
const statsHint = document.getElementById("statsHint");
const statBoxes = statsStage ? Array.from(statsStage.querySelectorAll(".stat--seq")) : [];

let statsActive = false;
let statsDone = false;
let step = 0;
let lastStepTime = 0;

function getHeaderHeight(){
  const header = document.querySelector(".header");
  return header ? Math.round(header.getBoundingClientRect().height) : 72;
}

function setPinTop(){
  const top = getHeaderHeight() + 10;
  document.documentElement.style.setProperty("--pinTop", `${top}px`);
}

function lockScroll(){
  document.body.classList.add("scroll-locked");
}

function unlockScroll(){
  document.body.classList.remove("scroll-locked");
}

function animateCount(el) {
  const targetRaw = el.getAttribute("data-count") || "0";
  const suffix = el.getAttribute("data-suffix") || "";
  const target = Number(targetRaw);
  const isFloat = targetRaw.includes(".");
  const duration = 850;
  const start = performance.now();

  const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

  function frame(t) {
    const p = Math.min(1, (t - start) / duration);
    const value = target * easeOutCubic(p);
    el.textContent = (isFloat ? value.toFixed(1) : Math.round(value)) + suffix;
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function revealTo(k){
  // k = how many items should be visible
  for (let i = 0; i < statBoxes.length; i++){
    const box = statBoxes[i];
    if (i < k && !box.classList.contains("is-in")){
      box.classList.add("is-in");
      const v = box.querySelector(".stat__value");
      if (v) animateCount(v);
    }
    if (i >= k && box.classList.contains("is-in")){
      box.classList.remove("is-in");
      const v = box.querySelector(".stat__value");
      if (v) v.textContent = "0";
    }
  }
}

function activateStats(){
  if (!statsStage || statsDone || statsActive) return;

  setPinTop();

  // align nicely before pinning
  const y = statsStage.getBoundingClientRect().top + window.pageYOffset - (getHeaderHeight() + 12);
  window.scrollTo({ top: y, behavior: "smooth" });

  // small delay so scroll finishes before lock
  setTimeout(() => {
    statsActive = true;
    step = 0;
    revealTo(0);

    statsStage.classList.add("is-active");
    lockScroll();

    addTrapListeners();
  }, 250);
}

function completeStats(){
  statsDone = true;
  deactivateStats();

  // Now move to next section automatically (as you asked)
  const next = document.getElementById("features");
  if (next){
    setTimeout(() => next.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }
}

function deactivateStats(){
  if (!statsActive) return;

  statsActive = false;
  statsStage.classList.remove("is-active");
  unlockScroll();

  removeTrapListeners();
}

function nextStep(dir){
  const now = Date.now();
  if (now - lastStepTime < 380) return; // debounce
  lastStepTime = now;

  // dir = +1 (down) or -1 (up)
  const max = statBoxes.length;

  // If user scrolls UP at step 0, exit pin (go back)
  if (dir < 0 && step === 0){
    deactivateStats();
    window.scrollBy({ top: -160, behavior: "smooth" });
    return;
  }

  step = Math.max(0, Math.min(max, step + dir));
  revealTo(step);

  // when all are visible -> unlock and go next section
  if (step === max){
    setTimeout(completeStats, 220);
  }
}

// ---- TRAP INPUT (wheel / touch / keys) ----
let touchStartY = 0;

function onWheel(e){
  if (!statsActive) return;
  e.preventDefault();
  if (e.deltaY > 8) nextStep(+1);
  else if (e.deltaY < -8) nextStep(-1);
}

function onKeyDown(e){
  if (!statsActive) return;

  const keysDown = ["ArrowDown", "PageDown", " ", "Enter"];
  const keysUp = ["ArrowUp", "PageUp"];

  if (keysDown.includes(e.key)){
    e.preventDefault();
    nextStep(+1);
  }
  if (keysUp.includes(e.key)){
    e.preventDefault();
    nextStep(-1);
  }
}

function onTouchStart(e){
  if (!statsActive) return;
  touchStartY = e.touches[0].clientY;
}

function onTouchMove(e){
  if (!statsActive) return;
  e.preventDefault();

  const y = e.touches[0].clientY;
  const dy = touchStartY - y;

  if (dy > 18){
    touchStartY = y;
    nextStep(+1);
  } else if (dy < -18){
    touchStartY = y;
    nextStep(-1);
  }
}

function addTrapListeners(){
  // IMPORTANT: passive:false so preventDefault works
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("touchstart", onTouchStart, { passive: false });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("resize", setPinTop);
}

function removeTrapListeners(){
  window.removeEventListener("wheel", onWheel);
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("touchstart", onTouchStart);
  window.removeEventListener("touchmove", onTouchMove);
  window.removeEventListener("resize", setPinTop);
}

// Activate when stats enters view
if (statsStage){
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !statsDone){
        activateStats();
      }
    });
  }, { threshold: 0.65 });

  io.observe(statsStage);
}