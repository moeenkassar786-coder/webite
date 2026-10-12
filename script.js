// MOEEN PORTFOLIO — interactions, theme switch, mobile menu, and cursor particles
(() => {
  const root = document.documentElement;
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const menuToggle = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");
  const year = document.getElementById("year");
  const glow = document.querySelector(".cursor-glow");
  const canvas = document.getElementById("particle-canvas");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

  // Current year in the footer.
  if (year) year.textContent = new Date().getFullYear();

  // Theme: save the visitor's preference locally in their own browser.
  const savedTheme = localStorage.getItem("moeen-theme");
  if (savedTheme === "light" || savedTheme === "dark") {
    root.dataset.theme = savedTheme;
  }
  updateThemeIcon();

  function updateThemeIcon() {
    const isLight = root.dataset.theme === "light";
    themeIcon.textContent = isLight ? "☾" : "☼";
    themeToggle.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", isLight ? "#f5f7fb" : "#0b0d12");
  }

  themeToggle.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
    localStorage.setItem("moeen-theme", root.dataset.theme);
    updateThemeIcon();
  });

  // Mobile navigation.
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
    });
  });

  // Reveal sections as they enter the viewport.
  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("visible"));
  }

  // Highlight the current navigation section.
  const sections = document.querySelectorAll("main section[id]");
  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.querySelectorAll('a[href^="#"]').forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    }, { rootMargin: "-35% 0px -55% 0px" });
    sections.forEach((section) => sectionObserver.observe(section));
  }

  // Cursor spotlight follows a mouse or stylus pointer on devices that support hover.
  if (glow && !coarsePointer && !reduceMotion) {
    window.addEventListener("pointermove", (event) => {
      glow.style.left = `${event.clientX}px`;
      glow.style.top = `${event.clientY}px`;
    }, { passive: true });
  }

  // Lightweight particle trail. On touch screens it appears only while a finger moves.
  if (!canvas || reduceMotion) return;
  const context = canvas.getContext("2d");
  if (!context) return;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let lastSpawn = 0;
  const maxParticles = coarsePointer ? 24 : 42;

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.7);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas, { passive: true });

  function spawnParticle(x, y, force = false) {
    const now = performance.now();
    if (!force && now - lastSpawn < (coarsePointer ? 45 : 24)) return;
    lastSpawn = now;
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      life: 1.25,
      size: Math.random() * 2.2 + 1,
      hue: Math.random() > 0.5 ? 260 : 185
    });
    if (particles.length > maxParticles) particles.splice(0, particles.length - maxParticles);
  }

  window.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch" || event.pointerType === "pen" || !coarsePointer) {
      spawnParticle(event.clientX, event.clientY);
    }
  }, { passive: true });

  window.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch" || event.pointerType === "pen") {
      spawnParticle(event.clientX, event.clientY, true);
    }
  }, { passive: true });

  function drawParticles() {
    context.clearRect(0, 0, width, height);
    particles = particles.filter((particle) => particle.life > 0.04);
    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life *= 0.982;
      const alpha = Math.max(0, Math.min(1, particle.life * 0.72));
      context.beginPath();
      context.fillStyle = `hsla(${particle.hue}, 95%, 72%, ${alpha})`;
      context.shadowBlur = 16;
      context.shadowColor = `hsla(${particle.hue}, 95%, 68%, ${alpha})`;
      context.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
      context.fill();
    });
    context.shadowBlur = 0;
    requestAnimationFrame(drawParticles);
  }
  drawParticles();

  // Subtle project-card tilt on mouse devices only; never interfere with touch scrolling.
  if (!coarsePointer && !reduceMotion) {
    document.querySelectorAll(".project-card").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `translateY(-4px) perspective(900px) rotateX(${(-y * 2).toFixed(2)}deg) rotateY(${(x * 2).toFixed(2)}deg)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }
})();

/* Search and filter the project library */
(() => { const search=document.getElementById("project-search"),grid=document.getElementById("projects-grid"),empty=document.getElementById("projects-empty"),count=document.getElementById("project-count"); if(!search||!grid)return; let cards=Array.from(grid.querySelectorAll(".project-card"));const filters=Array.from(document.querySelectorAll(".project-filter"));let activeFilter="all";function updateProjects(){cards=Array.from(grid.querySelectorAll(".project-card"));const query=search.value.trim().toLowerCase();let visible=0;cards.forEach(card=>{const searchable=(card.dataset.search||card.innerText).toLowerCase();const show=(!query||searchable.includes(query))&&(activeFilter==="all"||card.dataset.status===activeFilter);card.hidden=!show;if(show)visible++});if(empty)empty.hidden=visible!==0;if(count)count.textContent=`${visible} ${visible===1?"PROJECT":"PROJECTS"}`}search.addEventListener("input",updateProjects);filters.forEach(button=>button.addEventListener("click",()=>{activeFilter=button.dataset.filter||"all";filters.forEach(item=>{const active=item===button;item.classList.toggle("active",active);item.setAttribute("aria-pressed",String(active))});updateProjects()}));updateProjects()})();


/* Add project files from the computer (local preview; not a server upload). */
(() => {
  const button = document.getElementById("add-project-button");
  const picker = document.getElementById("project-file-input");
  const grid = document.getElementById("projects-grid");
  const search = document.getElementById("project-search");
  const count = document.getElementById("project-count");
  if (!button || !picker || !grid) return;

  button.addEventListener("click", () => picker.click());
  picker.addEventListener("change", () => {
    const files = Array.from(picker.files || []);
    if (!files.length) return;

    const titleGuess = files.length === 1
      ? files[0].name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ")
      : `New Project (${files.length} files)`;
    const card = document.createElement("article");
    card.className = "project-card reveal visible user-added-project";
    card.dataset.status = "built";
    card.dataset.search = `${titleGuess} ${files.map(file => file.name).join(" ")}`.toLowerCase();

    const preview = document.createElement("div");
    preview.className = "project-preview preview-portfolio";
    const previewTitle = document.createElement("div");
    previewTitle.className = "mini-title";
    previewTitle.textContent = titleGuess;
    preview.appendChild(previewTitle);
    const tag = document.createElement("span");
    tag.className = "preview-tag";
    tag.textContent = `${files.length} LOCAL FILE${files.length === 1 ? "" : "S"}`;
    preview.appendChild(tag);

    const info = document.createElement("div");
    info.className = "project-info";
    const meta = document.createElement("div");
    meta.className = "project-meta";
    const metaLabel = document.createElement("span");
    metaLabel.textContent = "YOUR PROJECT";
    const metaNo = document.createElement("span");
    metaNo.textContent = "NEW";
    meta.append(metaLabel, metaNo);
    const heading = document.createElement("h3");
    heading.textContent = titleGuess;
    const desc = document.createElement("p");
    desc.textContent = `Added from your computer: ${files.length} file${files.length === 1 ? "" : "s"}.`;
    const tags = document.createElement("div");
    tags.className = "tag-list";
    files.slice(0, 5).forEach(file => {
      const chip = document.createElement("span");
      chip.textContent = file.name;
      tags.appendChild(chip);
    });
    const links = document.createElement("div");
    links.className = "added-project-files";
    files.forEach(file => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(file);
      link.download = file.name;
      link.textContent = `↓ ${file.name}`;
      link.title = `Download ${file.name}`;
      links.appendChild(link);
    });
    info.append(meta, heading, desc, tags, links);
    card.append(preview, info);
    grid.appendChild(card);

    if (search) search.dispatchEvent(new Event("input", { bubbles: true }));
    else if (count) count.textContent = `${grid.querySelectorAll(".project-card:not([hidden])").length} PROJECTS`;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    picker.value = "";
  });
})();
