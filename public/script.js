(function () {
  "use strict";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* ---------------- HEADER SHRINK ON SCROLL ---------------- */
  const header = $("#siteHeader");
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 40) {
        header.style.padding = "10px 0";
        header.style.background = "rgba(4,6,11,0.72)";
        header.style.borderColor = "rgba(140,180,200,0.14)";
        header.style.backdropFilter = "blur(16px)";
      } else {
        header.style.padding = "18px 0";
        header.style.background = "transparent";
        header.style.borderColor = "transparent";
        header.style.backdropFilter = "none";
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------------- CURSOR GLOW ---------------- */
  const glow = $("#cursor-glow");
  if (glow && window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("mousemove", (e) => {
      glow.style.opacity = "1";
      glow.style.left = e.clientX + "px";
      glow.style.top = e.clientY + "px";
    });
    window.addEventListener("mouseleave", () => (glow.style.opacity = "0"));
  }

  /* ---------------- HERO GLOW PARALLAX ---------------- */
  const heroGlow = $("#heroGlow");
  if (heroGlow) {
    window.addEventListener("mousemove", (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 40;
      const y = (e.clientY / window.innerHeight - 0.5) * 40;
      heroGlow.style.transform = `translate(${x}px, ${y}px)`;
    });
  }

  /* ---------------- STAT COUNTERS ---------------- */
  function countUp(el, target, duration) {
    if (!el) return;
    const start = performance.now();
    const from = 0;
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (target - from) * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  countUp($("#statMarkets"), 480, 1600);
  countUp($("#statNodes"), 62, 1600);
  countUp($("#mapNodes"), 62, 1800);

  /* ---------------- TICKER ---------------- */
  const tickerTrack = $("#tickerTrack");
  if (tickerTrack) {
    const items = [
      ["BTC/USD", "+2.4%", true],
      ["ETH/USD", "+1.8%", true],
      ["EUR/USD", "-0.12%", false],
      ["GBP/USD", "+0.31%", true],
      ["XAU/USD", "+0.6%", true],
      ["SOL/USD", "-3.1%", false],
      ["USD/JPY", "+0.18%", true],
      ["AUD/USD", "-0.22%", false],
    ];
    const build = () =>
      items
        .map(
          ([label, delta, up]) =>
            `<span style="display:inline-flex;align-items:center;gap:8px;font-family:var(--font-mono);font-size:0.78rem;color:#8ea0b5;">
              <b style="color:#eef3f8;font-weight:600;">${label}</b>
              <span style="color:${up ? "#22e8d4" : "#e8836b"};">${delta}</span>
            </span>`
        )
        .join("");
    tickerTrack.innerHTML = build() + build();
  }

  /* ---------------- SCROLL REVEAL ---------------- */
  const revealEls = $$(".reveal, .reveal-stagger");
  if (revealEls.length) {
    revealEls.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(24px)";
      el.style.willChange = "opacity, transform";
      el.style.transition = "opacity 0.8s cubic-bezier(0.16,0.84,0.44,1), transform 0.8s cubic-bezier(0.16,0.84,0.44,1)";
      el.style.visibility = "visible";
    });
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.style.opacity = "1";
              entry.target.style.transform = "translateY(0)";
              entry.target.style.willChange = "auto";
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      revealEls.forEach((el) => io.observe(el));
    } else {
      revealEls.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
        el.style.willChange = "auto";
      });
    }
  }

  /* ---------------- PLATFORM TABS ---------------- */
  const tabButtons = $$(".tab-button");
  // data-tab values ("analytics","automation","globaldata","security") map to
  // the actual content-block ids in the markup ("analytics","automation","global","security").
  const tabIdMap = {
    analytics: "analytics",
    automation: "automation",
    globaldata: "global",
    security: "security",
  };
  if (tabButtons.length) {
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-tab");
        const targetId = tabIdMap[key] || key;

        tabButtons.forEach((b) => {
          b.classList.remove("text-[#22e8d4]", "bg-[#22e8d4]/[0.09]", "border-[rgba(34,232,212,0.25)]");
          b.classList.add("text-[#8ea0b5]", "bg-transparent", "border-transparent");
        });
        btn.classList.remove("text-[#8ea0b5]", "bg-transparent", "border-transparent");
        btn.classList.add("text-[#22e8d4]", "bg-[#22e8d4]/[0.09]", "border-[rgba(34,232,212,0.25)]");

        Object.values(tabIdMap).forEach((id) => {
          const panel = document.getElementById(id);
          if (panel) panel.classList.add("hidden");
        });
        const activePanel = document.getElementById(targetId);
        if (activePanel) activePanel.classList.remove("hidden");
      });
    });
  }

  /* ---------------- FAQ ACCORDION ---------------- */
  const faqItems = $$(".faq-item");
  faqItems.forEach((item) => {
    const trigger = $(".flex.items-center.justify-between", item);
    if (!trigger) return;
    trigger.addEventListener("click", () => {
      const wasOpen = item.classList.contains("open");
      faqItems.forEach((i) => i.classList.remove("open"));
      const panel = $("div.overflow-hidden", item);
      faqItems.forEach((i) => {
        const p = $("div.overflow-hidden", i);
        if (p) p.style.maxHeight = "0px";
        const dot = $(".relative.flex-shrink-0", i);
        if (dot) {
          dot.classList.remove("border-[#22e8d4]", "bg-[#22e8d4]/[0.14]");
          dot.classList.add("border-[rgba(140,180,200,0.14)]");
        }
      });
      if (!wasOpen) {
        item.classList.add("open");
        if (panel) panel.style.maxHeight = panel.scrollHeight + "px";
        const dot = $(".relative.flex-shrink-0", item);
        if (dot) {
          dot.classList.add("border-[#22e8d4]", "bg-[#22e8d4]/[0.14]");
          dot.classList.remove("border-[rgba(140,180,200,0.14)]");
        }
      }
    });
  });
  // Open the first FAQ item (matches "open: true" on the first entry)
  if (faqItems[0]) {
    const panel = $("div.overflow-hidden", faqItems[0]);
    if (panel) requestAnimationFrame(() => (panel.style.maxHeight = panel.scrollHeight + "px"));
  }

  /* ---------------- BACKGROUND PARTICLES ---------------- */
  (function particlesBg() {
    const canvas = $("#particles");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w, h, particles;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    function init() {
      resize();
      const count = Math.min(70, Math.floor((w * h) / 22000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.5,
      }));
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(34,232,212,0.55)";
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(frame);
    }
    init();
    window.addEventListener("resize", resize);
    requestAnimationFrame(frame);
  })();

  /* ---------------- PRICE CHART ---------------- */
  (function priceChart() {
    const canvas = $("#priceChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }

    // Illustrative demo series only
    const points = [];
    let base = 100;
    for (let i = 0; i < 60; i++) {
      base += (Math.random() - 0.42) * 4;
      points.push(base);
    }

    function draw() {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const min = Math.min(...points);
      const max = Math.max(...points);
      const pad = 10;
      const stepX = w / (points.length - 1);
      const toY = (v) => pad + (1 - (v - min) / (max - min || 1)) * (h - pad * 2);

      // gradient fill under the line
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "rgba(34,232,212,0.28)");
      grad.addColorStop(1, "rgba(34,232,212,0)");

      ctx.beginPath();
      points.forEach((v, i) => {
        const x = i * stepX;
        const y = toY(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      points.forEach((v, i) => {
        const x = i * stepX;
        const y = toY(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = "#22e8d4";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(34,232,212,0.6)";
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // grid lines
      ctx.strokeStyle = "rgba(140,180,200,0.08)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const y = (h / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }

    function tick() {
      points.shift();
      let last = points[points.length - 1];
      points.push(last + (Math.random() - 0.45) * 4);
      draw();
    }

    resize();
    draw();
    window.addEventListener("resize", () => {
      resize();
      draw();
    });
    setInterval(tick, 1800);
  })();

  /* ---------------- WORLD DATA MAP ---------------- */
  (function worldMap() {
    const canvas = $("#world-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const nodes = Array.from({ length: 22 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.7 + 0.15,
      pulse: Math.random() * Math.PI * 2,
    }));
    const routes = Array.from({ length: 14 }, () => ({
      a: Math.floor(Math.random() * nodes.length),
      b: Math.floor(Math.random() * nodes.length),
      progress: Math.random(),
    }));

    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }

    function draw() {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      // faint grid to suggest a map
      ctx.strokeStyle = "rgba(140,180,200,0.06)";
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // routes
      routes.forEach((r) => {
        const a = nodes[r.a];
        const b = nodes[r.b];
        if (!a || !b) return;
        const ax = a.x * w, ay = a.y * h;
        const bx = b.x * w, by = b.y * h;
        const mx = (ax + bx) / 2;
        const my = Math.min(ay, by) - 40;

        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo(mx, my, bx, by);
        ctx.strokeStyle = "rgba(203,164,99,0.18)";
        ctx.lineWidth = 1;
        ctx.stroke();

        r.progress = (r.progress + 0.0025) % 1;
        const t = r.progress;
        const px = (1 - t) * (1 - t) * ax + 2 * (1 - t) * t * mx + t * t * bx;
        const py = (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * my + t * t * by;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#cba463";
        ctx.fill();
      });

      // nodes
      nodes.forEach((n) => {
        n.pulse += 0.02;
        const x = n.x * w, y = n.y * h;
        const r = 3 + Math.sin(n.pulse) * 1.2;
        ctx.beginPath();
        ctx.arc(x, y, r + 5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(34,232,212,0.08)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = "#22e8d4";
        ctx.fill();
      });

      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(draw);
  })();

  /* ---------------- CTA PARTICLES ---------------- */
  (function ctaParticles() {
    const canvas = $("#ctaParticles");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w, h, particles;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      w = canvas.width = rect.width;
      h = canvas.height = rect.height;
    }
    function init() {
      resize();
      particles = Array.from({ length: 40 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vy: -(Math.random() * 0.4 + 0.1),
        r: Math.random() * 1.4 + 0.4,
        o: Math.random() * 0.5 + 0.2,
      }));
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.y += p.vy;
        if (p.y < 0) p.y = h;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34,232,212,${p.o})`;
        ctx.fill();
      });
      requestAnimationFrame(frame);
    }
    init();
    window.addEventListener("resize", resize);
    requestAnimationFrame(frame);
  })();
})();