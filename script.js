(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  root.classList.add("js");

  // ES modules and GLB fetches are blocked when index.html is opened as file://.
  // Keep a lightweight animated galaxy visible for direct-file previews.
  if (window.location.protocol === "file:") {
    document.querySelector("#galaxy-background")?.classList.add("load-failed");
  }

  const storage = {
    get(key) {
      try { return localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch { /* Storage may be unavailable. */ }
    }
  };

  // Coordinated page and 3D color palettes
  const themeButton = document.querySelector("#theme-toggle");
  const themeMenu = document.querySelector("#theme-menu");
  const themeOptions = [...document.querySelectorAll("[data-theme-option]")];
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const validThemes = ["dark", "light", "plum", "forest", "cobalt", "charcoal"];
  const themeNames = {
    dark: "Ocean night",
    light: "Ivory day",
    plum: "Plum dusk",
    forest: "Forest copper",
    cobalt: "Cobalt coral",
    charcoal: "Charcoal lime"
  };
  const savedTheme = storage.get("tnibir-theme");
  const preferredTheme = (validThemes.includes(savedTheme) && savedTheme) ||
    (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

  function applyTheme(theme) {
    const selectedTheme = validThemes.includes(theme) ? theme : "dark";
    root.dataset.theme = selectedTheme;
    themeButton?.setAttribute("aria-label", `Choose color theme. Current: ${themeNames[selectedTheme]}`);
    themeOptions.forEach(option => option.setAttribute("aria-checked", String(option.dataset.themeOption === selectedTheme)));
    if (themeMeta) themeMeta.content = getComputedStyle(root).getPropertyValue("--ink").trim();
    window.dispatchEvent(new CustomEvent("portfolio-theme-change", { detail: { theme: selectedTheme } }));
  }

  applyTheme(preferredTheme);
  function closeThemeMenu(returnFocus = false) {
    if (!themeMenu || !themeButton) return;
    themeMenu.hidden = true;
    themeButton.setAttribute("aria-expanded", "false");
    if (returnFocus) themeButton.focus();
  }
  themeButton?.addEventListener("click", () => {
    if (!themeMenu) return;
    const opening = themeMenu.hidden;
    themeMenu.hidden = !opening;
    themeButton.setAttribute("aria-expanded", String(opening));
    if (opening) themeOptions.find(option => option.getAttribute("aria-checked") === "true")?.focus();
  });
  themeOptions.forEach(option => option.addEventListener("click", () => {
    const selectedTheme = option.dataset.themeOption;
    applyTheme(selectedTheme);
    storage.set("tnibir-theme", selectedTheme);
    closeThemeMenu(true);
  }));
  document.addEventListener("click", event => {
    if (!event.target.closest(".theme-picker")) closeThemeMenu();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && themeMenu && !themeMenu.hidden) closeThemeMenu(true);
  });

  // Motion preference and a visible pause control
  const motionButton = document.querySelector("#motion-toggle");
  const systemReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const savedMotion = storage.get("tnibir-motion");
  const motionPaused = savedMotion === "paused" || (savedMotion === null && systemReduced);

  function applyMotion(paused) {
    body.classList.toggle("motion-paused", paused);
    motionButton?.setAttribute("aria-pressed", String(paused));
    const label = paused ? "Resume decorative motion" : "Pause decorative motion";
    motionButton?.setAttribute("title", label);
    const srLabel = motionButton?.querySelector(".sr-only");
    if (srLabel) srLabel.textContent = label;
  }

  applyMotion(motionPaused);
  motionButton?.addEventListener("click", () => {
    const paused = !body.classList.contains("motion-paused");
    applyMotion(paused);
    storage.set("tnibir-motion", paused ? "paused" : "active");
  });

  // Mobile navigation
  const menuButton = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector("#nav-links");

  function closeMenu() {
    menuButton?.setAttribute("aria-expanded", "false");
    navLinks?.classList.remove("is-open");
  }

  menuButton?.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    navLinks?.classList.toggle("is-open", open);
  });
  navLinks?.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeMenu(); });

  // Scroll progress, header state, active section and subtle ambient movement
  const header = document.querySelector(".site-header");
  const progress = document.querySelector(".scroll-progress span");
  const ambientOne = document.querySelector(".ambient-one");
  const ambientTwo = document.querySelector(".ambient-two");
  let scrollTicking = false;

  function updateScrollUI() {
    const scrollTop = window.scrollY;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (progress) progress.style.width = `${Math.min(100, (scrollTop / maxScroll) * 100)}%`;
    header?.classList.toggle("is-scrolled", scrollTop > 24);

    if (!body.classList.contains("motion-paused") && !systemReduced && window.innerWidth > 780) {
      if (ambientOne) ambientOne.style.transform = `translate3d(0, ${scrollTop * .035}px, 0)`;
      if (ambientTwo) ambientTwo.style.transform = `translate3d(0, ${scrollTop * -.025}px, 0)`;
    }
    scrollTicking = false;
  }

  window.addEventListener("scroll", () => {
    if (!scrollTicking) {
      requestAnimationFrame(updateScrollUI);
      scrollTicking = true;
    }
  }, { passive: true });
  updateScrollUI();

  // Reveal sections as they enter the viewport
  const revealItems = [...document.querySelectorAll(".reveal")];
  if ("IntersectionObserver" in window && !systemReduced) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .09, rootMargin: "0px 0px -45px" });
    revealItems.forEach(item => revealObserver.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add("is-visible"));
  }

  // Active navigation state
  const sectionLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const sections = sectionLinks
    .map(link => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach(link => {
          const isCurrent = link.getAttribute("href") === `#${entry.target.id}`;
          link.classList.toggle("is-active", isCurrent);
          if (isCurrent) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      });
    }, { threshold: .18, rootMargin: "-24% 0px -60%" });
    sections.forEach(section => sectionObserver.observe(section));
  }

  // Count-up proof points, while preserving the final values for reduced motion
  const counters = [...document.querySelectorAll("[data-count]")];
  function animateCounter(element) {
    if (element.dataset.counted === "true") return;
    element.dataset.counted = "true";
    const target = Number(element.dataset.count);
    const suffix = element.dataset.suffix || "";
    if (systemReduced || body.classList.contains("motion-paused")) {
      element.textContent = `${target}${suffix}`;
      return;
    }
    const duration = 1100;
    const start = performance.now();
    const draw = now => {
      const fraction = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - fraction, 3);
      element.textContent = `${Math.round(target * eased)}${suffix}`;
      if (fraction < 1) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .6 });
    counters.forEach(counter => counterObserver.observe(counter));
  } else {
    counters.forEach(animateCounter);
  }

  // Interactive evidence chain
  const labData = {
    frame: {
      number: "01 / 06",
      title: "Frame the decision",
      copy: "Translate programme intent into theories of change, logical frameworks, learning questions and indicators that teams can actually use.",
      tags: ["Theory of change", "Logframes", "KPI design", "Evaluation questions"],
      lens: "Programme logic",
      note: "Clear questions reduce noise downstream.",
      node: 0
    },
    collect: {
      number: "02 / 06",
      title: "Collect with purpose",
      copy: "Design proportionate quantitative and qualitative tools, sampling plans and digital workflows around the questions—not around the platform.",
      tags: ["KoboToolbox", "Sampling", "Mixed methods", "Field protocols"],
      lens: "Fit-for-purpose data",
      note: "Every field should earn its place.",
      node: 1
    },
    assure: {
      number: "03 / 06",
      title: "Protect data quality",
      copy: "Build validation, review, documentation and feedback into the flow so teams can trust the evidence and address issues early.",
      tags: ["DQA", "Validation", "Data flows", "Documentation"],
      lens: "Confidence & traceability",
      note: "Quality is a process, not a final cleaning step.",
      node: 2
    },
    analyze: {
      number: "04 / 06",
      title: "Find the signal",
      copy: "Combine statistical, spatial and qualitative analysis with programme context to explain patterns, differences and uncertainty.",
      tags: ["R", "Python", "GIS", "Mixed-method synthesis"],
      lens: "Analytical signal",
      note: "Context turns a result into an insight.",
      node: 2
    },
    communicate: {
      number: "05 / 06",
      title: "Make evidence usable",
      copy: "Turn analysis into dashboards, maps, briefs and reports designed for the specific choices stakeholders need to make.",
      tags: ["Power BI", "R Shiny", "Policy briefs", "Data storytelling"],
      lens: "Decision-ready story",
      note: "Clarity helps evidence travel.",
      node: 3
    },
    learn: {
      number: "06 / 06",
      title: "Close the learning loop",
      copy: "Facilitate reflection, document adaptation and feed what teams learn back into programme design, measurement and delivery.",
      tags: ["Learning reviews", "Outcome harvesting", "Adaptation", "Knowledge sharing"],
      lens: "Action & adaptation",
      note: "Evidence matters when it changes the next move.",
      node: 4
    }
  };

  const labButtons = [...document.querySelectorAll(".lab-step")];
  const labPanel = document.querySelector("#lab-panel");
  function selectLab(key, focus = false) {
    const data = labData[key];
    if (!data || !labPanel) return;
    labButtons.forEach(button => {
      const selected = button.dataset.lab === key;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected && focus) button.focus();
    });
    labPanel.querySelector(".lab-number").textContent = data.number;
    labPanel.querySelector(".lab-copy h3").textContent = data.title;
    labPanel.querySelector(".lab-copy > p:not(.lab-number)").textContent = data.copy;
    labPanel.querySelector(".tag-list").innerHTML = data.tags.map(tag => `<li>${tag}</li>`).join("");
    labPanel.querySelector(".viz-readout strong").textContent = data.lens;
    labPanel.querySelector(".viz-readout small").textContent = data.note;
    labPanel.querySelectorAll(".viz-node").forEach((node, index) => node.classList.toggle("active", index === data.node));
  }

  labButtons.forEach((button, index) => {
    button.addEventListener("click", () => selectLab(button.dataset.lab));
    button.addEventListener("keydown", event => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % labButtons.length;
      if (event.key === "ArrowLeft") nextIndex = (index - 1 + labButtons.length) % labButtons.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = labButtons.length - 1;
      selectLab(labButtons[nextIndex].dataset.lab, true);
    });
  });

  // Project filters
  const filters = [...document.querySelectorAll(".filter")];
  const projects = [...document.querySelectorAll(".project-card")];
  filters.forEach(filter => filter.addEventListener("click", () => {
    const selected = filter.dataset.filter;
    filters.forEach(button => {
      const active = button === filter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    projects.forEach(project => {
      const categories = (project.dataset.category || "").split(" ");
      const show = selected === "all" || categories.includes(selected);
      project.classList.toggle("is-hidden", !show);
    });
  }));

  // Accessible native case-note dialogs
  document.querySelectorAll(".open-case").forEach(button => {
    button.addEventListener("click", () => {
      const dialog = document.getElementById(button.dataset.dialog);
      if (dialog?.showModal) dialog.showModal();
    });
  });
  document.querySelectorAll(".case-dialog").forEach(dialog => {
    dialog.querySelector(".dialog-close")?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => {
      const rect = dialog.getBoundingClientRect();
      const inside = event.clientX >= rect.left && event.clientX <= rect.right &&
        event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!inside) dialog.close();
    });
  });

  const year = document.querySelector("#current-year");
  if (year) year.textContent = new Date().getFullYear();
})();
