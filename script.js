const root = document.documentElement;
const doc = document.documentElement;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
const saveDataEnabled = Boolean(connection && connection.saveData);
const deviceMemory = Number(navigator.deviceMemory || 0);
const hardwareConcurrency = Number(navigator.hardwareConcurrency || 0);
const isLowPowerDevice =
  saveDataEnabled ||
  (deviceMemory > 0 && deviceMemory <= 4) ||
  (hardwareConcurrency > 0 && hardwareConcurrency <= 4);

const enableHeavyEffects = !prefersReducedMotion && hasFinePointer && !isLowPowerDevice;

root.setAttribute("data-performance", enableHeavyEffects ? "full" : "lite");

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

let viewportHeight = window.innerHeight || doc.clientHeight;
let viewportWidth = window.innerWidth || doc.clientWidth;
let scrollTicking = false;
let resizeTicking = false;
let lastSubmittedName = "";
let pendingFormSubmission = false;

function refreshViewportMetrics() {
  viewportHeight = window.innerHeight || doc.clientHeight;
  viewportWidth = window.innerWidth || doc.clientWidth;
}

function isNearViewport(element, buffer = 180) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return rect.bottom >= -buffer && rect.top <= viewportHeight + buffer;
}

function runFrameUpdates() {
  updateProgressBar();
  updateActiveNavLink();

  if (resizeTicking) {
    updateFeedbackMetrics();
    renderMobileFeatureCards();

    if (viewportWidth > 760) {
      document.body.style.overflow = "";
      setNavState(false);
    }
  }

  if (isNearViewport(statsStrip, 160)) updateStripCards();
  if (isNearViewport(featureScrollArea, 260)) updateFeatureOnScroll();
  if (isNearViewport(industriesFallWrap, 220)) updateIndustriesFall();
  if (isNearViewport(aboutStage, 220)) updateAboutCharacterScroll();
  if (isNearViewport(feedbackScrollArea, 260)) updateFeedbackScroll();

  scrollTicking = false;
  resizeTicking = false;
}

function queueScrollAnimations() {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(runFrameUpdates);
}

function queueResizeWork() {
  refreshViewportMetrics();

  if (resizeTicking) return;
  resizeTicking = true;
  requestAnimationFrame(runFrameUpdates);
}

window.addEventListener("scroll", queueScrollAnimations, { passive: true });
window.addEventListener("resize", queueResizeWork, { passive: true });

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

  if (viewportWidth <= 760) {
    document.body.style.overflow = open ? "hidden" : "";
  }
}

/* progress */
const progressBar = $("#progressBar");

function updateProgressBar() {
  if (!progressBar) return;
  const max = doc.scrollHeight - doc.clientHeight;
  const progress = max > 0 ? (doc.scrollTop / max) * 100 : 0;
  progressBar.style.transform = `scaleX(${progress / 100})`;
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
const allNavSectionPairs = $$(".nav__link")
  .map((link) => {
    const href = link.getAttribute("href");
    if (!href || !href.startsWith("#")) return null;
    const section = $(href);
    if (!section) return null;
    return { link, section, href };
  })
  .filter(Boolean);

const homeNavPair = allNavSectionPairs.find((pair) => pair.href === "#top") || null;
const navSectionPairs = allNavSectionPairs.filter((pair) => pair.href !== "#top");

function updateActiveNavLink() {
  const allLinks = allNavSectionPairs.map(({ link }) => link);
  if (!allLinks.length) return;

  const siteHeader = $(".site-header");
  const headerOffset = (siteHeader?.offsetHeight || 84) + 20;
  const probeLine = Math.max(headerOffset + 8, viewportHeight * 0.22);
  const scrollTop = window.scrollY || window.pageYOffset || doc.scrollTop || 0;
  const firstTrackedSection = navSectionPairs[0]?.section || null;
  const firstTrackedTop = firstTrackedSection ? firstTrackedSection.offsetTop : Infinity;

  let activeLink = homeNavPair?.link || allLinks[0];
  let bestMatch = null;
  let fallbackMatch = null;
  let fallbackTop = -Infinity;

  for (const pair of navSectionPairs) {
    const rect = pair.section.getBoundingClientRect();

    if (rect.top <= probeLine && rect.bottom > probeLine) {
      bestMatch = pair;
      break;
    }

    if (rect.top <= probeLine && rect.top > fallbackTop) {
      fallbackMatch = pair;
      fallbackTop = rect.top;
    }
  }

  if (bestMatch) {
    activeLink = bestMatch.link;
  } else if (scrollTop + headerOffset >= firstTrackedTop - 80 && fallbackMatch) {
    activeLink = fallbackMatch.link;
  } else if (scrollTop + headerOffset >= firstTrackedTop - 80 && navSectionPairs.length) {
    activeLink = navSectionPairs[0].link;
  }

  allLinks.forEach((link) => {
    link.classList.toggle("is-active", link === activeLink);
  });
}

/* delegated clicks + ripple */
function createRipple(event, button) {
  if (!(button instanceof HTMLElement)) return;

  const rect = button.getBoundingClientRect();
  const ink = document.createElement("span");
  ink.className = "ripple__ink";
  ink.style.left = `${event.clientX - rect.left}px`;
  ink.style.top = `${event.clientY - rect.top}px`;

  button.appendChild(ink);
  ink.addEventListener("animationend", () => ink.remove(), { once: true });
}

function smoothScrollToHash(hash) {
  if (!hash || hash === "#") return false;
  const target = $(hash);
  if (!target) return false;

  target.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start"
  });

  if (window.location.hash !== hash) {
    history.replaceState(null, "", hash);
  }

  return true;
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const navToggleButton = target.closest("#navToggle");
  if (navToggleButton) {
    setNavState(!navPanel?.classList.contains("is-open"));
    return;
  }

  const faqButton = target.closest(".faq-q");
  if (faqButton instanceof HTMLButtonElement) {
    const item = faqButton.closest(".faq-item");
    if (!item) return;

    const isOpen = item.classList.contains("is-open");

    $$(".faq-item").forEach((faqItem) => {
      faqItem.classList.remove("is-open");
      const trigger = $(".faq-q", faqItem);
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    });

    if (!isOpen) {
      item.classList.add("is-open");
      faqButton.setAttribute("aria-expanded", "true");
    }

    return;
  }

  const anchor = target.closest('a[href^="#"]');
  if (anchor instanceof HTMLAnchorElement) {
    const href = anchor.getAttribute("href");

    if (href && href !== "#" && smoothScrollToHash(href)) {
      event.preventDefault();

      if (navPanel?.contains(anchor)) {
        setNavState(false);
      }
    }
  }

  const rippleButton = target.closest(".ripple");
  if (rippleButton && event instanceof MouseEvent) {
    createRipple(event, rippleButton);
  }

  if (navPanel && navToggle && !navPanel.contains(target) && !navToggle.contains(target)) {
    setNavState(false);
  }
});

/* background motion */
let mouseX = 0;
let mouseY = 0;
let smoothX = 0;
let smoothY = 0;
let backgroundFrame = 0;
let pageVisible = !document.hidden;

function commitBackgroundPosition() {
  root.style.setProperty("--mx", smoothX.toFixed(3));
  root.style.setProperty("--my", smoothY.toFixed(3));
}

function animateBackground() {
  backgroundFrame = 0;

  smoothX += (mouseX - smoothX) * 0.08;
  smoothY += (mouseY - smoothY) * 0.08;

  commitBackgroundPosition();

  if (!pageVisible) return;

  if (Math.abs(mouseX - smoothX) > 0.001 || Math.abs(mouseY - smoothY) > 0.001) {
    backgroundFrame = requestAnimationFrame(animateBackground);
  }
}

function queueBackgroundFrame() {
  if (!pageVisible || backgroundFrame) return;
  backgroundFrame = requestAnimationFrame(animateBackground);
}

function handlePointerMove(event) {
  mouseX = (event.clientX / viewportWidth - 0.5) * 2;
  mouseY = (event.clientY / viewportHeight - 0.5) * 2;
  queueBackgroundFrame();
}

if (enableHeavyEffects) {
  window.addEventListener("mousemove", handlePointerMove, { passive: true });

  document.addEventListener("visibilitychange", () => {
    pageVisible = !document.hidden;

    if (!pageVisible && backgroundFrame) {
      cancelAnimationFrame(backgroundFrame);
      backgroundFrame = 0;
      return;
    }

    queueBackgroundFrame();
  });

  commitBackgroundPosition();
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

  element.addEventListener("pointerenter", updateRect, { passive: true });
  element.addEventListener("pointermove", move, { passive: true });
  element.addEventListener("pointerleave", () => {
    rect = null;
    element.style.setProperty("--sx", "50%");
    element.style.setProperty("--sy", "50%");
  }, { passive: true });
}

if (enableHeavyEffects) {
  const spotlightTargets = [
    ...$$(".feature-panel.spotlight"),
    ...$$("#aboutLogoBox.spotlight"),
    ...$$(".cta__card.spotlight"),
    ...$$(".contact.spotlight"),
    ...$$(".footer.footer-contrast.spotlight")
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

  element.addEventListener("pointerenter", updateRect, { passive: true });
  element.addEventListener("pointermove", onMove, { passive: true });
  element.addEventListener("pointerleave", () => {
    rect = null;
    element.style.setProperty("--bx", "0px");
    element.style.setProperty("--by", "0px");
  }, { passive: true });
}

if (enableHeavyEffects) {
  $$(".magnetic").forEach((element) => attachMagnetic(element, element.classList.contains("btn") ? 0.1 : 0.08));
}

/* tilt */
if (enableHeavyEffects) {
  $$(".tilt").forEach((card) => {
    let raf = 0;
    let rect = null;

    const updateRect = () => {
      rect = card.getBoundingClientRect();
    };

    const onMove = (event) => {
      if (!rect) updateRect();

      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        const rotateY = (px - 0.5) * 10;
        const rotateX = (0.5 - py) * 8;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
      });
    };

    card.addEventListener("pointerenter", updateRect, { passive: true });
    card.addEventListener("pointermove", onMove, { passive: true });
    card.addEventListener("pointerleave", () => {
      rect = null;
      card.style.transform = "";
    });
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
  const sectionViewportHeight = viewportHeight;
  const start = sectionViewportHeight * 0.88;
  const end = sectionViewportHeight * 0.18;
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
    image: "photos/inventory.webp",
    alt: "Inventory preview"
  },
  {
    num: "02",
    label: "Warehouses",
    title: "Multi-Warehouse Management",
    desc: "Manage transfers, dispatches, and branch-level stock from one dashboard.",
    image: "photos/warehouse.webp",
    alt: "Warehouse preview"
  },
  {
    num: "03",
    label: "Reports",
    title: "Real-time Dashboard & Reports",
    desc: "Get analytics, approvals, summaries, and reporting in one live dashboard.",
    image: "photos/dashboard.webp",
    alt: "Reports preview"
  },
  {
    num: "04",
    label: "Sales",
    title: "Sales & Purchase Management",
    desc: "Handle purchase orders, invoicing, approvals, and payment tracking in one workflow.",
    image: "photos/sales.webp",
    alt: "Sales preview"
  },
  {
    num: "05",
    label: "CRM",
    title: "CRM & Customer Tracking",
    desc: "Follow up with customers and manage records from one clean workspace.",
    image: "photos/customer.webp",
    alt: "CRM preview"
  },
  {
    num: "06",
    label: "Billing",
    title: "Barcode & Billing Integration",
    desc: "Scan barcodes, update inventory, and generate invoices faster.",
    image: "photos/billing.webp",
    alt: "Billing preview"
  }
];
function renderMobileFeatureCards() {
  const featureScrollRoot = $("#featureScrollArea");
  if (!featureScrollRoot || viewportWidth > 980) return;

  let mobileGrid = $(".feature-mobile-grid", featureScrollRoot);
  if (mobileGrid) return;

  mobileGrid = document.createElement("div");
  mobileGrid.className = "feature-mobile-grid";

  mobileGrid.innerHTML = featureData.map((item) => `
    <article class="feature-mobile-card spotlight">
      <div class="feature-mobile-card__media">
        <img
          src="${item.image}"
          alt="${item.alt}"
          loading="lazy"
          decoding="async"
          width="1170"
          height="780"
        >
      </div>
      <div class="feature-mobile-card__body">
        <div class="feature-mobile-card__meta">
          <span class="feature-mobile-card__num">${item.num}</span>
          <span class="feature-mobile-card__label">${item.label}</span>
        </div>
        <h3 class="feature-mobile-card__title">${item.title}</h3>
        <p class="feature-mobile-card__desc">${item.desc}</p>
      </div>
    </article>
  `).join("");

  featureScrollRoot.appendChild(mobileGrid);

  if (enableHeavyEffects) {
    $$(".spotlight", mobileGrid).forEach(attachSpotlight);
  }
}

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
let featureChangeStartTimer = 0;
let featureChangeEndTimer = 0;

function setFeatureContent(index) {
  const item = featureData[index];
  if (!item) return;

  if (featureCurrent) featureCurrent.textContent = item.num;
  if (featureNum) featureNum.textContent = item.num;
  if (featureLabel) featureLabel.textContent = item.label;
  if (featureTitle) featureTitle.textContent = item.title;
  if (featureDesc) featureDesc.textContent = item.desc;

  if (featureImage) {
    if (featureImage.getAttribute("src") !== item.image) {
      featureImage.src = item.image;
    }
    featureImage.alt = item.alt;
  }
}

function animateFeatureChange(index) {
  if (!featurePanel || index === activeFeatureIndex) return;

  if (featureChangeStartTimer) clearTimeout(featureChangeStartTimer);
  if (featureChangeEndTimer) clearTimeout(featureChangeEndTimer);

  const wasAnimating = featureAnimating;
  featureAnimating = true;
  featurePanel.classList.remove("is-entering");
  featurePanel.classList.add("is-changing");

  featureChangeStartTimer = window.setTimeout(() => {
    setFeatureContent(index);
    activeFeatureIndex = index;
    featurePanel.classList.remove("is-changing");
    featurePanel.classList.add("is-entering");

    featureChangeEndTimer = window.setTimeout(() => {
      featurePanel.classList.remove("is-entering");
      featureAnimating = false;
    }, 460);
  }, wasAnimating ? 100 : 160);
}

const featureSteps = $$(".feature-step");

function updateFeatureOnScroll() {
  if (!featureScrollArea || !featureSteps.length || viewportWidth <= 980) return;

  let activeIndex = 0;
  const triggerPoint = viewportHeight * 0.45;

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

  if (viewportWidth <= 760 || prefersReducedMotion) {
    industryCards.forEach((card) => {
      card.style.opacity = "1";
      card.style.transform = "none";
    });
    return;
  }
  if (prefersReducedMotion) {
    industryCards.forEach((card) => {
      card.style.opacity = "1";
      card.style.transform = "translateY(0) scale(1) rotateX(0deg) rotateZ(0deg)";
    });
    return;
  }

  const rect = industriesFallWrap.getBoundingClientRect();
  const sectionViewportHeight = viewportHeight;
  const start = sectionViewportHeight * 0.92;
  const end = sectionViewportHeight * 0.16;
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

  if (viewportWidth < 768 || prefersReducedMotion) {
    aboutLineEls.forEach((line) => {
      line.style.setProperty("--ticker-progress", "1");
      line.classList.add("is-active");
    });

    if (aboutLogoBox) {
      aboutLogoBox.style.transform = "none";
    }
    return;
  }
  const rect = aboutStage.getBoundingClientRect();
  const sectionViewportHeight = viewportHeight;

  const sectionStart = sectionViewportHeight * 0.82;
  const sectionEnd = sectionViewportHeight * 0.18;
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

  if (aboutLogoBox && enableHeavyEffects) {
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
    let pricingRevealIndex = 0;

    const pricingObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const delay = pricingRevealIndex * 90;
          pricingRevealIndex += 1;

          window.setTimeout(() => {
            entry.target.classList.add("is-visible");
          }, delay);

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

if (enableHeavyEffects) {
  $$(".pricing-clean__card").forEach((card) => {
    let rect = null;

    const updateRect = () => {
      rect = card.getBoundingClientRect();
    };

    card.addEventListener("pointerenter", updateRect, { passive: true });
    card.addEventListener("pointermove", (event) => {
      if (!rect) updateRect();

      card.style.setProperty("--px", `${event.clientX - rect.left}px`);
      card.style.setProperty("--py", `${event.clientY - rect.top}px`);
    }, { passive: true });

    card.addEventListener("pointerleave", () => {
      rect = null;
    }, { passive: true });
  });
}

/* feedback */
const feedbackScrollArea = $("#feedbackScrollArea");
const feedbackTrack = $("#feedbackTrack");
const feedbackPrev = $("#feedbackPrev");
const feedbackNext = $("#feedbackNext");

let feedbackManualOffset = 0;
let feedbackMaxTranslate = 0;

function updateFeedbackMetrics() {
  if (!feedbackTrack || !feedbackTrack.parentElement) {
    feedbackMaxTranslate = 0;
    return;
  }

  const viewport = feedbackTrack.parentElement;
  feedbackMaxTranslate = Math.max(0, feedbackTrack.scrollWidth - viewport.clientWidth);
  feedbackManualOffset = Math.max(-feedbackMaxTranslate, Math.min(feedbackMaxTranslate, feedbackManualOffset));
}

function applyFeedbackTransform(autoProgress = 0) {
  if (!feedbackTrack) return;

  if (viewportWidth <= 980) {
    feedbackTrack.style.transform = "none";
    return;
  }

  const autoOffset = feedbackMaxTranslate * autoProgress;
  const finalOffset = Math.max(0, Math.min(feedbackMaxTranslate, autoOffset + feedbackManualOffset));

  feedbackTrack.style.transform = `translate3d(-${finalOffset}px, 0, 0)`;

  if (feedbackPrev) feedbackPrev.disabled = finalOffset <= 2;
  if (feedbackNext) feedbackNext.disabled = finalOffset >= feedbackMaxTranslate - 2;
}

function updateFeedbackScroll() {
  if (!feedbackScrollArea || !feedbackTrack || viewportWidth <= 980) {
    if (feedbackTrack) feedbackTrack.style.transform = "none";
    return;
  }

  const totalScroll = feedbackScrollArea.offsetHeight - viewportHeight;
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

  if (viewportWidth <= 980) {
    feedbackTrack.parentElement.scrollBy({
      left: direction * step,
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });
    return;
  }

  feedbackManualOffset += direction * step;
  feedbackManualOffset = Math.max(-feedbackMaxTranslate, Math.min(feedbackMaxTranslate, feedbackManualOffset));
  updateFeedbackScroll();
}

if (feedbackPrev) {
  feedbackPrev.addEventListener("click", () => moveFeedback(-1));
}

if (feedbackNext) {
  feedbackNext.addEventListener("click", () => moveFeedback(1));
}

if (feedbackScrollArea && feedbackTrack) {
  updateFeedbackMetrics();
  updateFeedbackScroll();
}

/* faq */

/* initial run */
queueScrollAnimations();
queueResizeWork();
window.addEventListener("load", updateActiveNavLink, { once: true });
F