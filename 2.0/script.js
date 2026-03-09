const $ = (q, r = document) => r.querySelector(q);
const $$ = (q, r = document) => Array.from(r.querySelectorAll(q));
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// Footer year
const yearEl = $("#year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// Startup splash
const SPLASH_MS = 1800; // change this value to reduce or increase stay time

window.addEventListener("load", () => {
  const splash = document.getElementById("introLoader");
  const yearEl = document.getElementById("year");

  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  if (!splash) {
    document.body.classList.remove("preload");
    return;
  }

  let removed = false;

  const removeSplash = () => {
    if (removed) return;
    removed = true;

    if (splash && splash.isConnected) splash.remove();
    document.body.classList.remove("preload");
  };

  setTimeout(() => {
    // remove preload first so exit animation can play properly
    document.body.classList.remove("preload");

    requestAnimationFrame(() => {
      splash.classList.add("hide");
      splash.addEventListener("animationend", removeSplash, { once: true });

      // fallback
      setTimeout(removeSplash, 1400);
    });
  }, SPLASH_MS);

  // final safety fallback
  setTimeout(removeSplash, SPLASH_MS + 2200);
});
// Mobile nav
const navToggle = $("#navToggle");
const navPanel = $("#navPanel");

function setNav(open) {
  if (!navPanel || !navToggle) return;
  navPanel.classList.toggle("is-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
}

if (navToggle && navPanel) {
  navToggle.addEventListener("click", () => {
    setNav(!navPanel.classList.contains("is-open"));
  });

  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Node)) return;

    const clickedInsidePanel = navPanel.contains(target);
    const clickedToggle = navToggle.contains(target);

    if (!clickedInsidePanel && !clickedToggle) {
      setNav(false);
    }
  });

  $$(".nav__link", navPanel).forEach((a) => {
    a.addEventListener("click", () => setNav(false));
  });
}

// Smooth scroll
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (!id || id === "#") return;

    const el = $(id);
    if (!el) return;

    e.preventDefault();
    el.scrollIntoView({
      behavior: prefersReduced ? "auto" : "smooth",
      block: "start"
    });

    history.pushState(null, "", id);
  });
});

// Progress bar
const progressBar = $("#progressBar");
if (progressBar) {
  const updateProgress = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? (h.scrollTop / max) * 100 : 0;
    progressBar.style.width = `${p}%`;
  };

  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
}

// Reveal animation
const revealEls = $$(".reveal");

if (prefersReduced) {
  revealEls.forEach((el) => el.classList.add("is-visible"));
} else if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14 }
  );

  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

// Ripple effect
function ripple(e) {
  const btn = e.currentTarget;
  if (!(btn instanceof HTMLElement)) return;

  const rect = btn.getBoundingClientRect();
  const ink = document.createElement("span");
  ink.className = "ripple__ink";
  ink.style.left = `${e.clientX - rect.left}px`;
  ink.style.top = `${e.clientY - rect.top}px`;
  btn.appendChild(ink);
  ink.addEventListener("animationend", () => ink.remove());
}

$$(".ripple").forEach((b) => b.addEventListener("click", ripple));

// Background parallax
let mx = 0;
let my = 0;
let tx = 0;
let ty = 0;

function onMove(e) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  mx = (e.clientX / w - 0.5) * 2;
  my = (e.clientY / h - 0.5) * 2;
}

if (!prefersReduced) {
  window.addEventListener("mousemove", onMove, { passive: true });

  const animateBg = () => {
    tx += (mx - tx) * 0.06;
    ty += (my - ty) * 0.06;
    document.documentElement.style.setProperty("--mx", tx.toFixed(3));
    document.documentElement.style.setProperty("--my", ty.toFixed(3));
    requestAnimationFrame(animateBg);
  };

  animateBg();
}

// Spotlight follow
function attachSpotlight(el) {
  let raf = 0;

  const move = (e) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      el.style.setProperty("--sx", `${x}%`);
      el.style.setProperty("--sy", `${y}%`);
    });
  };

  el.addEventListener("pointermove", move, { passive: true });
}

if (!prefersReduced) {
  $$(".btn").forEach(attachSpotlight);
  $$(".spotlight").forEach(attachSpotlight);
}

// Magnetic buttons
function attachMagnetic(el, strength = 0.14) {
  let raf = 0;

  const onMoveMagnetic = (e) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      el.style.setProperty("--bx", `${dx.toFixed(2)}px`);
      el.style.setProperty("--by", `${dy.toFixed(2)}px`);
    });
  };

  const reset = () => {
    el.style.setProperty("--bx", "0px");
    el.style.setProperty("--by", "0px");
  };

  el.addEventListener("pointermove", onMoveMagnetic, { passive: true });
  el.addEventListener("pointerleave", reset);
}

if (!prefersReduced) {
  $$(".magnetic").forEach((el) => attachMagnetic(el));
}

// Counter animation
function animateCount(el) {
  const target = Number(el.dataset.count || "0");
  const suffix = el.dataset.suffix || "";
  const duration = 900;
  const start = performance.now();

  const tick = (t) => {
    const p = Math.min(1, (t - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    const value = Math.round(target * eased);
    el.textContent = `${value}${suffix}`;

    if (p < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

const countEls = $$(".count");

if (prefersReduced) {
  countEls.forEach((el) => {
    el.textContent = `${el.dataset.count || "0"}${el.dataset.suffix || ""}`;
  });
} else if ("IntersectionObserver" in window) {
  const countObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (el.dataset.done === "1") return;
        el.dataset.done = "1";
        animateCount(el);
        observer.unobserve(el);
      });
    },
    { threshold: 0.55 }
  );

  countEls.forEach((el) => countObserver.observe(el));
}

// Pricing toggle
const billingSwitch = $("#billingSwitch");
const amounts = $$(".priceAmount");
const pers = $$(".per");

function setBilling(yearly) {
  if (!billingSwitch) return;

  billingSwitch.classList.toggle("is-on", yearly);
  billingSwitch.setAttribute("aria-checked", String(yearly));

  amounts.forEach((el) => {
    const value = yearly ? el.dataset.yearly : el.dataset.monthly;
    if (value) el.textContent = value;
  });

  pers.forEach((el) => {
    el.textContent = yearly ? "/yr" : "/mo";
  });
}

if (billingSwitch) {
  billingSwitch.addEventListener("click", () => {
    const yearly = !billingSwitch.classList.contains("is-on");
    setBilling(yearly);
  });
}

// Tilt
if (!prefersReduced) {
  $$(".tilt").forEach((card) => {
    let raf = 0;

    const onMoveCard = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;

        const ry = (px - 0.5) * 10;
        const rx = (0.5 - py) * 8;

        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
      });
    };

    const onLeave = () => {
      card.style.transform = "";
    };

    card.addEventListener("pointermove", onMoveCard, { passive: true });
    card.addEventListener("pointerleave", onLeave);
  });
}

// Contact form demo handler
const contactForm = $("#contactForm");
const formMsg = $("#formMsg");

if (contactForm && formMsg) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = new FormData(contactForm);
    const name = String(data.get("name") || "").trim();

    formMsg.textContent = name
      ? `Thanks, ${name}! Your demo request has been received.`
      : "Thanks! Your demo request has been received.";

    contactForm.reset();
  });
}

// Stats strip animation
const statsStrip = $("#statsStrip");
const stripCards = $$(".strip__card");

function updateStripCardsOnScroll() {
  if (!statsStrip || !stripCards.length) return;

  const rect = statsStrip.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;

  const start = vh * 0.88;
  const end = vh * 0.18;

  const rawProgress = (start - rect.top) / (start - end);
  const progress = Math.max(0, Math.min(1, rawProgress));

  stripCards.forEach((card, index) => {
    const stepStart = index * 0.22;
    const stepEnd = stepStart + 0.12;

    if (progress >= stepEnd) {
      card.classList.add("is-visible");
    } else if (progress < stepStart) {
      card.classList.remove("is-visible");
    }
  });
}

if (statsStrip && stripCards.length) {
  if (prefersReduced) {
    stripCards.forEach((card) => card.classList.add("is-visible"));
  } else {
    updateStripCardsOnScroll();
    window.addEventListener("scroll", updateStripCardsOnScroll, { passive: true });
    window.addEventListener("resize", updateStripCardsOnScroll);
  }
}

// Feature showcase
const featureData = [
  {
    num: "01",
    label: "Inventory",
    title: "Smart Inventory Tracking",
    desc: "Track stock levels in real time across locations with alerts, reorder points, and movement visibility.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1600&auto=format&fit=crop",
    alt: "Inventory preview"
  },
  {
    num: "02",
    label: "Warehouses",
    title: "Multi-Warehouse Management",
    desc: "Manage transfers, dispatches, and branch-level stock from one dashboard.",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1600&auto=format&fit=crop",
    alt: "Warehouse preview"
  },
  {
    num: "03",
    label: "Reports",
    title: "Real-time Dashboard & Reports",
    desc: "Get analytics, approvals, summaries, and reporting in one live dashboard.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1600&auto=format&fit=crop",
    alt: "Reports preview"
  },
  {
    num: "04",
    label: "Sales",
    title: "Sales & Purchase Management",
    desc: "Handle purchase orders, invoicing, approvals, and payment tracking in one workflow.",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1600&auto=format&fit=crop",
    alt: "Sales preview"
  },
  {
    num: "05",
    label: "CRM",
    title: "CRM & Customer Tracking",
    desc: "Follow up with customers and manage records from one clean workspace.",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1600&auto=format&fit=crop",
    alt: "CRM preview"
  },
  {
    num: "06",
    label: "Billing",
    title: "Barcode & Billing Integration",
    desc: "Scan barcodes, update inventory, and generate invoices faster.",
    image: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=1600&auto=format&fit=crop",
    alt: "Billing preview"
  }
];

const featureScrollArea = $("#featureScrollArea");
const featurePanel = $(".feature-panel");
const featureCurrent = $("#featureCurrent");
const featureNum = $("#featureNum");
const featureLabel = $("#featureLabel");
const featureTitle = $("#featureTitle");
const featureDesc = $("#featureDesc");
const featureImage = $("#featureImage");

let activeFeatureIndex = 0;
let featureAnimating = false;

function setFeatureContent(index) {
  const item = featureData[index];
  if (!item) return;

  if (featureCurrent) featureCurrent.textContent = item.num;
  if (featureNum) featureNum.textContent = item.num;
  if (featureLabel) featureLabel.textContent = item.label;
  if (featureTitle) featureTitle.textContent = item.title;
  if (featureDesc) featureDesc.textContent = item.desc;
  if (featureImage) {
    featureImage.src = item.image;
    featureImage.alt = item.alt;
  }
}

function animateFeatureChange(index) {
  if (!featurePanel || featureAnimating || index === activeFeatureIndex) return;

  featureAnimating = true;
  featurePanel.classList.remove("is-entering");
  featurePanel.classList.add("is-changing");

  setTimeout(() => {
    setFeatureContent(index);
    activeFeatureIndex = index;

    featurePanel.classList.remove("is-changing");
    featurePanel.classList.add("is-entering");

    setTimeout(() => {
      featurePanel.classList.remove("is-entering");
      featureAnimating = false;
    }, 700);
  }, 220);
}

function updateFeatureOnScroll() {
  if (!featureScrollArea || window.innerWidth <= 980) return;

  const rect = featureScrollArea.getBoundingClientRect();
  const totalScroll = featureScrollArea.offsetHeight - window.innerHeight;
  if (totalScroll <= 0) return;

  const current = Math.min(Math.max(-rect.top, 0), totalScroll);
  const segment = totalScroll / featureData.length;

  let index = Math.floor(current / segment);
  if (index >= featureData.length) index = featureData.length - 1;

  animateFeatureChange(index);
}

if (featureScrollArea && featurePanel) {
  setFeatureContent(0);
  window.addEventListener("scroll", updateFeatureOnScroll, { passive: true });
  window.addEventListener("resize", updateFeatureOnScroll);
}

// Industries animation
const industriesFallWrap = $("#industriesFall");
const industryCards = $$(".industry-fall");

function updateIndustriesFallProgress() {
  if (!industriesFallWrap || !industryCards.length) return;

  if (prefersReduced) {
    industryCards.forEach((card) => {
      card.style.opacity = "1";
      card.style.transform = "translateY(0) scale(1) rotateX(0deg) rotateZ(0deg)";
    });
    return;
  }

  const rect = industriesFallWrap.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;

  const start = vh * 0.92;
  const end = vh * 0.16;
  const rawProgress = (start - rect.top) / (start - end);
  const progress = Math.max(0, Math.min(1, rawProgress));

  industryCards.forEach((card, index) => {
    const stepStart = index * 0.12;
    const stepEnd = stepStart + 0.18;

    let local = (progress - stepStart) / (stepEnd - stepStart);
    local = Math.max(0, Math.min(1, local));

    const y = -240 + 240 * local;
    const scale = 0.9 + 0.1 * local;
    const rx = 18 - 18 * local;
    const rz = -5 + 5 * local;
    const opacity = local;

    card.style.opacity = opacity.toFixed(3);
    card.style.transform = `translateY(${y}px) scale(${scale}) rotateX(${rx}deg) rotateZ(${rz}deg)`;
  });
}

if (industriesFallWrap && industryCards.length) {
  updateIndustriesFallProgress();
  window.addEventListener("scroll", updateIndustriesFallProgress, { passive: true });
  window.addEventListener("resize", updateIndustriesFallProgress);
}

// Pricing scroll cards
const pricingSection = $("#pricing");
const pricingCards = $$("#pricing .plan");

function updatePricingScrollCards() {
  if (!pricingSection || !pricingCards.length) return;

  if (prefersReduced) {
    pricingCards.forEach((card) => {
      card.classList.add("is-visible");
      card.style.opacity = "1";
      card.style.transform = "translateY(0) scale(1)";
    });
    return;
  }

  const rect = pricingSection.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;

  const start = vh * 0.9;
  const end = vh * 0.18;
  const rawProgress = (start - rect.top) / (start - end);
  const progress = Math.max(0, Math.min(1, rawProgress));

  pricingCards.forEach((card, index) => {
    const stepStart = index * 0.18;
    const stepEnd = stepStart + 0.24;

    let local = (progress - stepStart) / (stepEnd - stepStart);
    local = Math.max(0, Math.min(1, local));

    const y = 50 - 50 * local;
    const scale = 0.96 + 0.04 * local;
    const opacity = local;

    card.style.opacity = opacity.toFixed(3);
    card.style.transform = `translateY(${y}px) scale(${scale})`;

    if (local >= 0.98) {
      card.classList.add("is-visible");
    } else {
      card.classList.remove("is-visible");
    }
  });
}

if (pricingSection && pricingCards.length) {
  updatePricingScrollCards();
  window.addEventListener("scroll", updatePricingScrollCards, { passive: true });
  window.addEventListener("resize", updatePricingScrollCards);
}

// About text: scroll reveal + per-letter spotlight hover
(() => {
  const aboutLines = Array.from(document.querySelectorAll(".about-line"));
  if (!aboutLines.length) return;

  function splitLetters(el) {
    const text = el.textContent || "";
    el.setAttribute("aria-label", text.trim());
    el.textContent = "";

    [...text].forEach((char, index) => {
      if (char === " ") {
        const space = document.createElement("span");
        space.className = "about-space";
        space.innerHTML = "&nbsp;";
        space.setAttribute("aria-hidden", "true");
        space.style.setProperty("--i", index);
        el.appendChild(space);
        return;
      }

      const span = document.createElement("span");
      span.className = "about-letter";
      span.textContent = char;
      span.setAttribute("aria-hidden", "true");
      span.style.setProperty("--i", index);
      el.appendChild(span);
    });
  }

  function clearHot(line) {
    line.querySelectorAll(".about-letter.is-hot, .about-letter.is-near").forEach((el) => {
      el.classList.remove("is-hot", "is-near");
    });
  }

  aboutLines.forEach(splitLetters);

  if (prefersReduced) {
    aboutLines.forEach((line) => line.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    },
    {
      threshold: 0.22,
      rootMargin: "0px 0px -10% 0px"
    }
  );

  aboutLines.forEach((line) => {
    io.observe(line);

    line.addEventListener("pointerover", (e) => {
      const letter = e.target.closest(".about-letter");
      if (!letter || !line.contains(letter)) return;

      clearHot(line);
      letter.classList.add("is-hot");

      let prev = letter.previousElementSibling;
      while (prev && !prev.classList.contains("about-letter")) {
        prev = prev.previousElementSibling;
      }

      let next = letter.nextElementSibling;
      while (next && !next.classList.contains("about-letter")) {
        next = next.nextElementSibling;
      }

      if (prev) prev.classList.add("is-near");
      if (next) next.classList.add("is-near");
    });

    line.addEventListener("pointerleave", () => {
      clearHot(line);
    });
  });
})();

// FAQ scroll cards
const faqCards = $$(".faq-item");

function updateFaqCardsOnScroll() {
  if (!faqCards.length) return;

  if (prefersReduced) {
    faqCards.forEach((card) => {
      card.classList.add("is-visible");
      card.style.opacity = "1";
      card.style.transform = "translateY(0) scale(1)";
    });
    return;
  }

  const vh = window.innerHeight || document.documentElement.clientHeight;

  faqCards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    const start = vh * 0.95;
    const end = vh * 0.4;

    let progress = (start - rect.top) / (start - end);
    progress = Math.max(0, Math.min(1, progress));

    const opacity = 0.2 + progress * 0.8;
    const y = 60 - progress * 60;
    const scale = 0.96 + progress * 0.04;

    card.style.opacity = opacity.toFixed(3);
    card.style.transform = `translateY(${y.toFixed(1)}px) scale(${scale.toFixed(3)})`;

    if (progress > 0.92) {
      card.classList.add("is-visible");
    } else {
      card.classList.remove("is-visible");
    }
  });
}

if (faqCards.length) {
  updateFaqCardsOnScroll();
  window.addEventListener("scroll", updateFaqCardsOnScroll, { passive: true });
  window.addEventListener("resize", updateFaqCardsOnScroll);
}

// FAQ accordion
const faqButtons = $$(".faq-q");

faqButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".faq-item");
    if (!item) return;

    const isOpen = item.classList.contains("is-open");

    faqCards.forEach((card) => {
      card.classList.remove("is-open");
      const q = $(".faq-q", card);
      if (q) q.setAttribute("aria-expanded", "false");
    });

    if (!isOpen) {
      item.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
    }
  });
});

const feedbackScrollArea = $("#feedbackScrollArea");
const feedbackTrack = $("#feedbackTrack");

function updateFeedbackScroll() {
  if (!feedbackScrollArea || !feedbackTrack || window.innerWidth <= 980) return;

  const totalScroll = feedbackScrollArea.offsetHeight - window.innerHeight;
  if (totalScroll <= 0) return;

  const rect = feedbackScrollArea.getBoundingClientRect();
  const current = Math.min(Math.max(-rect.top, 0), totalScroll);
  const progress = current / totalScroll;

  const viewport = feedbackTrack.parentElement;
  const maxTranslate = Math.max(0, feedbackTrack.scrollWidth - viewport.clientWidth);

  feedbackTrack.style.transform = `translate3d(-${maxTranslate * progress}px, 0, 0)`;
}

if (feedbackScrollArea && feedbackTrack) {
  updateFeedbackScroll();
  window.addEventListener("scroll", updateFeedbackScroll, { passive: true });
  window.addEventListener("resize", updateFeedbackScroll);
}