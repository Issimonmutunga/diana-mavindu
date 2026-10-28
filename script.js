(() => {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Theme toggle (remembered per browser) ----
  try {
    const saved = localStorage.getItem("theme");
    if (saved) root.dataset.theme = saved;
  } catch (_) {}
  document.querySelector(".theme").addEventListener("click", () => {
    const dark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (_) {}
  });

  document.getElementById("year").textContent = new Date().getFullYear();

  // ---- Nav border + active section ----
  const nav = document.querySelector(".nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const links = [...document.querySelectorAll(".nav__links a")];
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("section[id]").forEach((s) => spy.observe(s));

  // ---- Reveal on scroll ----
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal").forEach((el, i) => {
    el.style.transitionDelay = el.closest(".hero") ? `${i * 90}ms` : "0ms";
    io.observe(el);
  });

  // ---- Gompertz survival curve ----
  // S(x) = exp(-B (c^x - 1) / ln c), roughly calibrated to a modern life table.
  const B = 0.00004, c = 1.1;
  const S = (x) => Math.exp((-B * (Math.pow(c, x) - 1)) / Math.log(c));
  const X0 = 40, X1 = 400, Y0 = 260, Y1 = 40; // plot box
  const px = (x) => X0 + (x / 100) * (X1 - X0);
  const py = (s) => Y0 - s * (Y0 - Y1);

  const pts = [];
  for (let x = 0; x <= 100; x += 0.5) pts.push([px(x), py(S(x))]);
  const d = "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L");

  const curve = document.getElementById("survCurve");
  const area = document.getElementById("survArea");
  const dot = document.getElementById("survDot");
  const readout = document.getElementById("survReadout");
  const plot = document.querySelector(".plot");
  const svg = document.querySelector(".plot__svg");

  curve.setAttribute("d", d);
  area.setAttribute("d", `${d} L${X1} ${Y0} L${X0} ${Y0} Z`);

  const setAge = (x) => {
    x = Math.max(0, Math.min(100, x));
    const s = S(x);
    dot.setAttribute("cx", px(x));
    dot.setAttribute("cy", py(s));
    readout.textContent = `x = ${x.toFixed(0).padStart(3, " ")}   S(x) = ${s.toFixed(3)}`;
  };

  if (!reduced) {
    const len = curve.getTotalLength();
    curve.style.strokeDasharray = len;
    curve.style.strokeDashoffset = len;
    curve.getBoundingClientRect();
    curve.style.transition = "stroke-dashoffset 2.2s cubic-bezier(.65,0,.35,1) .3s";
    requestAnimationFrame(() => { curve.style.strokeDashoffset = 0; });
  }
  setTimeout(() => { plot.classList.add("is-drawn"); setAge(65); }, reduced ? 0 : 1800);

  const toAge = (evt) => {
    const r = svg.getBoundingClientRect();
    const vx = ((evt.clientX - r.left) / r.width) * 420;
    return ((vx - X0) / (X1 - X0)) * 100;
  };
  svg.addEventListener("pointermove", (e) => setAge(toAge(e)));
  svg.addEventListener("pointerleave", () => setAge(65));
})();
