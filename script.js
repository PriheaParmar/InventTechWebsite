const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let scrollTicking = false;
let lastSubmittedName = "";
let pendingFormSubmission = false;

function isNearViewport(element, buffer = 180) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  return rect.bottom >= -buffer && rect.top <= viewportHeight + buffer;
}

function queueScrollAnimations() {
  if (scrollTicking) return;

  scrollTicking = true;
  requestAnimationFrame(() => {
    updateProgressBar();

    if (isNearViewport(statsStrip, 160)) updateStripCards();
    if (isNearViewport(featureScrollArea, 260)) updateFeatureOnScroll();
    if (isNearViewport(industriesFallWrap, 220)) updateIndustriesFall();
    if (isNearViewport(aboutStage, 220)) updateAboutCharacterScroll();
    if (isNearViewport(feedbackScrollArea, 260)) updateFeedbackScroll();

    scrollTicking = false;
  });
}

window.addEventListener("scroll", queueScrollAnimations, { passive: true });
window.addEventListener("resize", () => {
  requestAnimationFrame(() => {
    updateProgressBar();
    updateStripCards();
    updateFeatureOnScroll();
    updateIndustriesFall();
    updateAboutCharacterScroll();
    updateFeedbackScroll();
  });
}, { passive: true });

/* year */
const yearElement = $("#year");
if (yearElement) {
  yearElement.textContent = String(new Date().getFullYear());
}

/* splash */
const SPLASH_DURATION = 1600;

window.addEventListener("load", () => {
  const splash = $("#introLoader");
  if (!splash) {
    document.body.classList.remove("preload");
    return;
  }

  let removed = false;

  const removeSplash = () => {
    if (removed) return;
    removed = true;
    splash.remove();
    document.body.classList.remove("preload");
  };

  setTimeout(() => {
    document.body.classList.remove("preload");
    splash.classList.add("is-exiting");
    splash.addEventListener("animationend", removeSplash, { once: true });
    setTimeout(removeSplash, 1200);
  }, SPLASH_DURATION);

  setTimeout(removeSplash, SPLASH_DURATION + 1800);
});

/* theme */
const themeToggle = $("#themeToggle");
const root = document.documentElement;

function getPreferredTheme() {
  try {
    const savedTheme = localStorage.getItem("inventtech-theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  } catch (error) {
    console.warn("Theme storage unavailable:", error);
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);

  if (themeToggle) {
    const isLight = theme === "light";
    themeToggle.setAttribute("aria-pressed", String(isLight));
    themeToggle.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
  }
}

applyTheme(getPreferredTheme());

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const current = root.getAttribute("data-theme") || "dark";
    const next = current === "light" ? "dark" : "light";
    applyTheme(next);

    try {
      localStorage.setItem("inventtech-theme", next);
    } catch (error) {
      console.warn("Could not save theme preference:", error);
    }
  });
}

/* nav */
const navToggle = $("#navToggle");
const navPanel = $("#navPanel");

function setNavState(open) {
  if (!navToggle || !navPanel) return;
  navPanel.classList.toggle("is-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
}

if (navToggle && navPanel) {
  navToggle.addEventListener("click", () => {
    setNavState(!navPanel.classList.contains("is-open"));
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) return;

    if (!navPanel.contains(target) && !navToggle.contains(target)) {
      setNavState(false);
    }
  });

  $$(".nav__link", navPanel).forEach((link) => {
    link.addEventListener("click", () => setNavState(false));
  });
}

/* smooth scroll */
$$('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    if (!href || href === "#") return;

    const target = $(href);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start"
    });

    history.replaceState(null, "", href);
  });
});

/* progress */
const progressBar = $("#progressBar");

function updateProgressBar() {
  if (!progressBar) return;
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const progress = max > 0 ? (doc.scrollTop / max) * 100 : 0;
  progressBar.style.width = `${progress}%`;
}

updateProgressBar();

/* reveal */
const revealItems = $$(".reveal");

if (prefersReducedMotion) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

/* scrollspy */
const navSectionPairs = $$(".nav__link")
  .map((link) => {
    const href = link.getAttribute("href");
    if (!href || !href.startsWith("#")) return null;
    const section = $(href);
    if (!section) return null;
    return { link, section };
  })
  .filter(Boolean);

if ("IntersectionObserver" in window && navSectionPairs.length) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visibleEntry) return;

      navSectionPairs.forEach(({ link, section }) => {
        link.classList.toggle("is-active", section === visibleEntry.target);
      });
    },
    {
      rootMargin: "-30% 0px -45% 0px",
      threshold: [0.1, 0.2, 0.35, 0.5]
    }
  );

  navSectionPairs.forEach(({ section }) => sectionObserver.observe(section));
}

/* ripple */
function createRipple(event) {
  const button = event.currentTarget;
  if (!(button instanceof HTMLElement)) return;

  const rect = button.getBoundingClientRect();
  const ink = document.createElement("span");
  ink.className = "ripple__ink";
  ink.style.left = `${event.clientX - rect.left}px`;
  ink.style.top = `${event.clientY - rect.top}px`;

  button.appendChild(ink);
  ink.addEventListener("animationend", () => ink.remove());
}

$$(".ripple").forEach((button) => button.addEventListener("click", createRipple));

/* background motion */
let mouseX = 0;
let mouseY = 0;
let smoothX = 0;
let smoothY = 0;

function handlePointerMove(event) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  mouseX = (event.clientX / width - 0.5) * 2;
  mouseY = (event.clientY / height - 0.5) * 2;
}

if (!prefersReducedMotion) {
  window.addEventListener("mousemove", handlePointerMove, { passive: true });

  const animateBackground = () => {
    smoothX += (mouseX - smoothX) * 0.06;
    smoothY += (mouseY - smoothY) * 0.06;

    document.documentElement.style.setProperty("--mx", smoothX.toFixed(3));
    document.documentElement.style.setProperty("--my", smoothY.toFixed(3));

    requestAnimationFrame(animateBackground);
  };

  animateBackground();
}

/* spotlight */
function attachSpotlight(element) {
  let raf = 0;
  let rect = null;

  const updateRect = () => {
    rect = element.getBoundingClientRect();
  };

  const move = (event) => {
    if (!rect) updateRect();

    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      element.style.setProperty("--sx", `${x}%`);
      element.style.setProperty("--sy", `${y}%`);
    });
  };

  const enter = () => updateRect();

  const leave = () => {
    element.style.setProperty("--sx", "50%");
    element.style.setProperty("--sy", "50%");
  };

  element.addEventListener("pointerenter", enter, { passive: true });
  element.addEventListener("pointermove", move, { passive: true });
  element.addEventListener("pointerleave", leave, { passive: true });
  window.addEventListener("resize", updateRect);
}

if (!prefersReducedMotion) {
  const spotlightTargets = [
    ...$$(".feature-panel.spotlight"),
    ...$$("#aboutLogoBox.spotlight"),
    ...$$(".cta__card.spotlight"),
    ...$$(".contact.spotlight")
  ];

  spotlightTargets.forEach(attachSpotlight);
}

/* magnetic */
function attachMagnetic(element, strength = 0.12) {
  let raf = 0;
  let rect = null;

  const updateRect = () => {
    rect = element.getBoundingClientRect();
  };

  const onMove = (event) => {
    if (!rect) updateRect();

    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (event.clientX - centerX) * strength;
      const deltaY = (event.clientY - centerY) * strength;

      element.style.setProperty("--bx", `${deltaX.toFixed(2)}px`);
      element.style.setProperty("--by", `${deltaY.toFixed(2)}px`);
    });
  };

  const onEnter = () => updateRect();

  const reset = () => {
    element.style.setProperty("--bx", "0px");
    element.style.setProperty("--by", "0px");
  };

  element.addEventListener("pointerenter", onEnter, { passive: true });
  element.addEventListener("pointermove", onMove, { passive: true });
  element.addEventListener("pointerleave", reset, { passive: true });
  window.addEventListener("resize", updateRect);
}

if (!prefersReducedMotion) {
  $$(".magnetic").forEach((element) => attachMagnetic(element, element.classList.contains("btn") ? 0.1 : 0.08));
}

/* tilt */
if (!prefersReducedMotion) {
  $$(".tilt").forEach((card) => {
    let raf = 0;

    const onMove = (event) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;

        const rotateY = (px - 0.5) * 10;
        const rotateX = (0.5 - py) * 8;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
      });
    };

    const onLeave = () => {
      card.style.transform = "";
    };

    card.addEventListener("pointermove", onMove, { passive: true });
    card.addEventListener("pointerleave", onLeave);
  });
}

/* count */
function animateCount(element) {
  const target = Number(element.dataset.count || "0");
  const suffix = element.dataset.suffix || "";
  const duration = 900;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);

    element.textContent = `${value}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

const counterItems = $$(".count");

if (prefersReducedMotion) {
  counterItems.forEach((item) => {
    item.textContent = `${item.dataset.count || "0"}${item.dataset.suffix || ""}`;
  });
} else if ("IntersectionObserver" in window) {
  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        if (element.dataset.done === "1") return;

        element.dataset.done = "1";
        animateCount(element);
        observer.unobserve(element);
      });
    },
    { threshold: 0.55 }
  );

  counterItems.forEach((item) => counterObserver.observe(item));
}

/* contact form */
const contactForm = $("#contactForm");
const formMessage = $("#formMsg");
const popup = $("#popup");
const sound = $("#tingSound");
const emailField = $("#contactEmail") || (contactForm ? $('input[name="email"]', contactForm) : null);
const hiddenFrame = document.querySelector('iframe[name="hidden_iframe"]');

const STRICT_EMAIL_REGEX = /^(?!.*\.\.)([A-Za-z0-9._%+-]+)@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/;

function showPopupMessage() {
  if (!popup) return;
  popup.classList.add("show");
  setTimeout(() => popup.classList.remove("show"), 3200);
}

function playSuccessSound() {
  if (!sound) return;
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function validateEmailField() {
  if (!emailField) return true;

  const value = emailField.value.trim();
  emailField.value = value;
  emailField.setCustomValidity("");

  if (!value) return true;

  const isValid = STRICT_EMAIL_REGEX.test(value);
  if (!isValid) {
    emailField.setCustomValidity("Please enter a valid email address like name@company.com");
    return false;
  }

  return true;
}

if (emailField) {
  emailField.addEventListener("input", () => {
    emailField.setCustomValidity("");
    formMessage && (formMessage.textContent = "");
  });

  emailField.addEventListener("blur", () => {
    if (!validateEmailField()) {
      emailField.reportValidity();
    }
  });
}

if (contactForm && formMessage) {
  const submitButton = $('button[type="submit"]', contactForm);

  hiddenFrame?.addEventListener("load", () => {
    if (!pendingFormSubmission) return;

    pendingFormSubmission = false;
    if (submitButton) submitButton.disabled = false;

    formMessage.textContent = lastSubmittedName
      ? `Thanks, ${lastSubmittedName}! Your demo request has been received.`
      : "Thanks! Your demo request has been received.";

    showPopupMessage();
    playSuccessSound();
    contactForm.reset();
    if (emailField) emailField.setCustomValidity("");
  });

  contactForm.addEventListener("submit", (event) => {
    if (emailField) emailField.setCustomValidity("");

    const emailIsValid = validateEmailField();
    const formIsValid = contactForm.checkValidity();

    if (!formIsValid || !emailIsValid) {
      event.preventDefault();
      contactForm.reportValidity();
      formMessage.textContent = "Please fix the highlighted fields before submitting.";
      return;
    }

    event.preventDefault();

    const formData = new FormData(contactForm);
    lastSubmittedName = String(formData.get("name") || "").trim();
    formMessage.textContent = "Sending your request...";
    pendingFormSubmission = true;

    if (submitButton) submitButton.disabled = true;

    HTMLFormElement.prototype.submit.call(contactForm);
  });
}

/* strip cards */
const statsStrip = $("#statsStrip");
const stripCards = $$(".strip__card");

function updateStripCards() {
  if (!statsStrip || !stripCards.length) return;

  const rect = statsStrip.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const start = viewportHeight * 0.88;
  const end = viewportHeight * 0.18;
  const rawProgress = (start - rect.top) / (start - end);
  const progress = Math.max(0, Math.min(1, rawProgress));

  stripCards.forEach((card, index) => {
    const stepStart = index * 0.22;
    const stepEnd = stepStart + 0.12;
    if (progress >= stepEnd) card.classList.add("is-visible");
    else if (progress < stepStart) card.classList.remove("is-visible");
  });
}

if (statsStrip && stripCards.length) {
  if (prefersReducedMotion) {
    stripCards.forEach((card) => card.classList.add("is-visible"));
  } else {
    updateStripCards();
  }
}

/* feature showcase */
const featureData = [
  {
    num: "01",
    label: "Inventory",
    title: "Smart Inventory Tracking",
    desc: "Track stock levels in real time across locations with alerts, reorder points, and movement visibility.",
    image: "https://plus.unsplash.com/premium_photo-1682147873962-b65d2f1b9d28?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Inventory preview"
  },
  {
    num: "02",
    label: "Warehouses",
    title: "Multi-Warehouse Management",
    desc: "Manage transfers, dispatches, and branch-level stock from one dashboard.",
    image: "https://plus.unsplash.com/premium_photo-1663091967607-2e15b89f4d6e?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Warehouse preview"
  },
  {
    num: "03",
    label: "Reports",
    title: "Real-time Dashboard & Reports",
    desc: "Get analytics, approvals, summaries, and reporting in one live dashboard.",
    image: "https://plus.unsplash.com/premium_photo-1661764570116-b1b0a2da783c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Reports preview"
  },
  {
    num: "04",
    label: "Sales",
    title: "Sales & Purchase Management",
    desc: "Handle purchase orders, invoicing, approvals, and payment tracking in one workflow.",
    image: "https://images.unsplash.com/photo-1642543348745-03b1219733d9?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Sales preview"
  },
  {
    num: "05",
    label: "CRM",
    title: "CRM & Customer Tracking",
    desc: "Follow up with customers and manage records from one clean workspace.",
    image: "https://plus.unsplash.com/premium_photo-1661515854369-6e14c3a030dc?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "CRM preview"
  },
  {
    num: "06",
    label: "Billing",
    title: "Barcode & Billing Integration",
    desc: "Scan barcodes, update inventory, and generate invoices faster.",
    image: "https://images.unsplash.com/photo-1735825764478-674bb8df9d4a?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Billing preview"
  }
];

const featureScrollArea = $("#featureScrollArea");
const featurePanel = $("#featurePanel");
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

const featureSteps = $$(".feature-step");

function updateFeatureOnScroll() {
  if (!featureScrollArea || !featureSteps.length || window.innerWidth <= 980) return;

  let activeIndex = 0;
  const triggerPoint = window.innerHeight * 0.45;

  featureSteps.forEach((step, index) => {
    const rect = step.getBoundingClientRect();
    if (rect.top <= triggerPoint) {
      activeIndex = index;
    }
  });

  if (activeIndex >= featureData.length) {
    activeIndex = featureData.length - 1;
  }

  animateFeatureChange(activeIndex);
}

if (featureScrollArea && featurePanel) {
  setFeatureContent(0);
  updateFeatureOnScroll();
}

/* industries */
const industriesFallWrap = $("#industriesFall");
const industryCards = $$(".industry-fall");

function updateIndustriesFall() {
  if (!industriesFallWrap || !industryCards.length) return;

  if (prefersReducedMotion) {
    industryCards.forEach((card) => {
      card.style.opacity = "1";
      card.style.transform = "translateY(0) scale(1) rotateX(0deg) rotateZ(0deg)";
    });
    return;
  }

  const rect = industriesFallWrap.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const start = viewportHeight * 0.92;
  const end = viewportHeight * 0.16;
  const rawProgress = (start - rect.top) / (start - end);
  const progress = Math.max(0, Math.min(1, rawProgress));

  industryCards.forEach((card, index) => {
    const stepStart = index * 0.12;
    const stepEnd = stepStart + 0.18;

    let local = (progress - stepStart) / (stepEnd - stepStart);
    local = Math.max(0, Math.min(1, local));

    const y = -240 + 240 * local;
    const scale = 0.9 + 0.1 * local;
    const rotateX = 18 - 18 * local;
    const rotateZ = -5 + 5 * local;
    const opacity = local;

    card.style.opacity = opacity.toFixed(3);
    card.style.transform = `translateY(${y}px) scale(${scale}) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg)`;
  });
}

if (industriesFallWrap && industryCards.length) {
  updateIndustriesFall();
}

/* about character */
const aboutStage = $("#aboutStage");
const aboutLogoBox = $("#aboutLogoBox");
const aboutLineEls = $$(".about-character__line");

aboutLineEls.forEach((line) => {
  if (!line.textContent.trim() && line.dataset.text) {
    line.textContent = line.dataset.text;
  }
});

function updateAboutCharacterScroll() {
  if (!aboutStage || !aboutLineEls.length) return;
  if (window.innerWidth < 768) return;

  const rect = aboutStage.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

  const sectionStart = viewportHeight * 0.82;
  const sectionEnd = viewportHeight * 0.18;
  const raw = (sectionStart - rect.top) / (sectionStart - sectionEnd);
  const progress = Math.max(0, Math.min(1, raw));

  const linesCount = aboutLineEls.length;
  const segment = 1 / linesCount;

  aboutLineEls.forEach((line, index) => {
    const lineStart = index * segment;
    const lineEnd = lineStart + segment * 1.2;
    const localRaw = (progress - lineStart) / (lineEnd - lineStart);
    const localProgress = Math.max(0, Math.min(1, localRaw));

    line.style.setProperty("--ticker-progress", localProgress.toFixed(3));

    if (localProgress > 0.45) line.classList.add("is-active");
    else line.classList.remove("is-active");
  });

  if (aboutLogoBox && !prefersReducedMotion) {
    const moveY = -18 * progress;
    const scale = 1 + progress * 0.02;
    aboutLogoBox.style.transform = `translate3d(0, ${moveY}px, 0) scale(${scale})`;
  }
}

if (aboutStage && aboutLineEls.length) {
  updateAboutCharacterScroll();
}

/* pricing reveal */
const pricingCards = $$(".pricing-reveal");

if (pricingCards.length) {
  if (prefersReducedMotion) {
    pricingCards.forEach((card) => card.classList.add("is-visible"));
  } else if ("IntersectionObserver" in window) {
    const pricingObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry, index) => {
          if (!entry.isIntersecting) return;
          setTimeout(() => {
            entry.target.classList.add("is-visible");
          }, index * 100);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2 }
    );

    pricingCards.forEach((card) => pricingObserver.observe(card));
  } else {
    pricingCards.forEach((card) => card.classList.add("is-visible"));
  }
}

if (!prefersReducedMotion) {
  $$(".pricing-clean__card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      card.style.setProperty("--px", `${x}px`);
      card.style.setProperty("--py", `${y}px`);
    });
  });
}

/* feedback */
const feedbackScrollArea = $("#feedbackScrollArea");
const feedbackTrack = $("#feedbackTrack");
const feedbackPrev = $("#feedbackPrev");
const feedbackNext = $("#feedbackNext");

let feedbackManualOffset = 0;

function getFeedbackMaxTranslate() {
  if (!feedbackTrack || !feedbackTrack.parentElement) return 0;
  const viewport = feedbackTrack.parentElement;
  return Math.max(0, feedbackTrack.scrollWidth - viewport.clientWidth);
}

function applyFeedbackTransform(autoProgress = null) {
  if (!feedbackTrack || !feedbackTrack.parentElement) return;

  const viewport = feedbackTrack.parentElement;
  const maxTranslate = Math.max(0, feedbackTrack.scrollWidth - viewport.clientWidth);

  if (window.innerWidth <= 980) {
    feedbackTrack.style.transform = "none";
    return;
  }

  const progress = autoProgress === null ? 0 : autoProgress;
  const autoOffset = maxTranslate * progress;
  const finalOffset = Math.max(0, Math.min(maxTranslate, autoOffset + feedbackManualOffset));

  feedbackTrack.style.transform = `translate3d(-${finalOffset}px, 0, 0)`;

  if (feedbackPrev) feedbackPrev.disabled = finalOffset <= 2;
  if (feedbackNext) feedbackNext.disabled = finalOffset >= maxTranslate - 2;
}

function updateFeedbackScroll() {
  if (!feedbackScrollArea || !feedbackTrack || window.innerWidth <= 980) {
    if (feedbackTrack) feedbackTrack.style.transform = "none";
    return;
  }

  const totalScroll = feedbackScrollArea.offsetHeight - window.innerHeight;
  if (totalScroll <= 0) {
    applyFeedbackTransform(0);
    return;
  }

  const rect = feedbackScrollArea.getBoundingClientRect();
  const current = Math.min(Math.max(-rect.top, 0), totalScroll);
  const progress = current / totalScroll;

  applyFeedbackTransform(progress);
}

function moveFeedback(direction) {
  if (!feedbackTrack || !feedbackTrack.parentElement) return;

  const step = 360;
  const maxTranslate = getFeedbackMaxTranslate();

  if (window.innerWidth <= 980) {
    feedbackTrack.parentElement.scrollBy({
      left: direction * step,
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });
    return;
  }

  feedbackManualOffset += direction * step;
  feedbackManualOffset = Math.max(-maxTranslate, Math.min(maxTranslate, feedbackManualOffset));
  updateFeedbackScroll();
}

if (feedbackPrev) {
  feedbackPrev.addEventListener("click", () => moveFeedback(-1));
}

if (feedbackNext) {
  feedbackNext.addEventListener("click", () => moveFeedback(1));
}

if (feedbackScrollArea && feedbackTrack) {
  updateFeedbackScroll();

  window.addEventListener("resize", () => {
    const maxTranslate = getFeedbackMaxTranslate();
    feedbackManualOffset = Math.max(-maxTranslate, Math.min(maxTranslate, feedbackManualOffset));
    updateFeedbackScroll();
  });
}

/* faq */
const faqButtons = $$(".faq-q");

faqButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    if (!item) return;

    const isOpen = item.classList.contains("is-open");

    $$(".faq-item").forEach((faqItem) => {
      faqItem.classList.remove("is-open");
      const trigger = $(".faq-q", faqItem);
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    });

    if (!isOpen) {
      item.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
    }
  });
});

/* initial run */
queueScrollAnimations();