/* NLG Comex — comportamento do site (idiomas, formulário, mapa, globo, animações). */
(function () {
"use strict";

/* ===== Configuração (dados da empresa) ===== */
// URL do NLG Tracking. Vazio = o botão leva ao contato e mostra um aviso.
const TRACKING_URL = "";
// WhatsApp comercial, só dígitos com DDI+DDD (ex.: "5513999999999"). Vazio = botão oculto.
const WA_NUMBER = "";
const CONTACT_EMAIL = "contato@nlgcomex.com.br";

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
};

/* ===== Idiomas ===== */
const DICT = { en: (window.I18N || {}).en || {}, es: (window.I18N || {}).es || {}, pt: {} };
const DYN_PT = {
  "err.req": "Preencha este campo.", "err.email": "Informe um e-mail válido, por exemplo nome@empresa.com.",
  "err.sel": "Selecione uma opção.", "ok.copied": "Copiado!", "f.sending": "Abrindo seu e-mail…", "a11y.pause": "Pausar animações", "a11y.play": "Retomar animações", "wd.sp": "Santos, SP", "bl.read": "Ler artigo completo",
  "meta.desc": $("#metaDesc").getAttribute("content")
};
Object.assign(DICT.pt, DYN_PT);
$$("[data-i18n]").forEach(el => { DICT.pt[el.dataset.i18n] = el.textContent; });
$$("[data-i18n-html]").forEach(el => { DICT.pt[el.dataset.i18nHtml] = el.innerHTML; });
$$("[data-i18n-ph]").forEach(el => { DICT.pt[el.dataset.i18nPh] = el.getAttribute("placeholder"); });
$$("[data-i18n-aria]").forEach(el => { DICT.pt[el.dataset.i18nAria] = el.getAttribute("aria-label"); });

let lang = "pt";
const t = k => (DICT[lang] && DICT[lang][k]) || DICT.pt[k] || "";

function setLang(l) {
  if (!DICT[l]) l = "pt";
  lang = l;
  $$("[data-i18n]").forEach(el => { const v = t(el.dataset.i18n); if (v) el.textContent = v; });
  $$("[data-i18n-html]").forEach(el => { const v = t(el.dataset.i18nHtml); if (v) el.innerHTML = v; });
  $$("[data-i18n-ph]").forEach(el => { const v = t(el.dataset.i18nPh); if (v) el.setAttribute("placeholder", v); });
  $$("[data-i18n-aria]").forEach(el => { const v = t(el.dataset.i18nAria); if (v) el.setAttribute("aria-label", v); });
  $("#metaDesc").setAttribute("content", t("meta.desc"));
  document.documentElement.lang = { pt: "pt-BR", en: "en", es: "es" }[l];
  $$(".lang button").forEach(b => {
    const on = b.dataset.lang === l;
    b.classList.toggle("active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  renderBlog();
  drawMap();
  { const mb = $("#motionBtn"); if (mb) mb.setAttribute("aria-label", t(mb.getAttribute("aria-pressed") === "true" ? "a11y.play" : "a11y.pause")); }
  // limpa mensagens de erro (estão no idioma anterior)
  $$(".field.invalid").forEach(f => f.classList.remove("invalid"));
  $$(".err").forEach(e => { e.textContent = ""; });
  store.set("nlg-lang", l);
}
$$(".lang button").forEach(b => b.addEventListener("click", () => setLang(b.dataset.lang)));

/* ===== Blog (cards gerados a partir de articles.js) ===== */
function renderBlog() {
  const grid = $("#blogGrid");
  if (!grid || !window.ARTICLES) return;
  grid.innerHTML = window.ARTICLES.slice(0, 3).map(a => {
    const d = a[lang] || a.pt, href = "blog/" + a.slug + ".html";
    return '<article class="post reveal in"><div class="svc-art"><img src="' + a.img + '" alt="" loading="lazy" decoding="async" width="900" height="506"></div>' +
      '<div class="post-body"><span class="cat">' + d.c + '</span><h3><a href="' + href + '">' + d.t + '</a></h3><p>' + d.e +
      '</p><a class="svc-link" href="' + href + '">' + t("bl.read") + '</a></div></article>';
  }).join("");
}

/* ===== Navegação ===== */
const header = $("header"), menu = $("#menu"), burger = $("#burger");
function onScroll() {
  header.classList.toggle("scrolled", window.scrollY > 40);
  const h = document.documentElement.scrollHeight - innerHeight;
  $("#progress").style.width = (h > 0 ? scrollY / h * 100 : 0) + "%";
}
addEventListener("scroll", onScroll, { passive: true }); onScroll();
function setMenu(open) {
  menu.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", String(open));
}
burger.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
$$("#menu a").forEach(a => a.addEventListener("click", () => setMenu(false)));
addEventListener("keydown", e => { if (e.key === "Escape" && menu.classList.contains("open")) { setMenu(false); burger.focus(); } });

/* ===== Tracking / WhatsApp (só com dados reais) ===== */
const trackBtn = $("#trackBtn");
if (TRACKING_URL) {
  trackBtn.href = TRACKING_URL; trackBtn.target = "_blank"; trackBtn.rel = "noopener";
} else {
  $("#trackNote").hidden = false;
}
if (WA_NUMBER) {
  $("#waBtn").href = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent("Olá! Gostaria de falar com a equipe da NLG Comex.");
  $("#waBox").hidden = false;
}

/* ===== Atalhos que pré-preenchem o formulário ===== */
$$("[data-svc],[data-op]").forEach(a => a.addEventListener("click", () => {
  if (a.dataset.svc) $("#f-svc").value = a.dataset.svc;
  if (a.dataset.op) $("#f-op").value = a.dataset.op;
}));

/* ===== Formulário de cotação (abre o e-mail do usuário) ===== */
const form = $("#contactForm");
const SVC_PT = { maritimo: "Frete marítimo", aereo: "Frete aéreo", agenciamento: "Agenciamento de cargas", desembaraco: "Desembaraço aduaneiro", importacao: "Suporte à importação", exportacao: "Suporte à exportação", orientacao: "Preciso de orientação" };
const OP_PT = { importacao: "Importação", exportacao: "Exportação" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function fieldError(input, key) {
  const f = input.closest(".field"), e = $("#" + input.getAttribute("aria-describedby"));
  f.classList.toggle("invalid", !!key);
  input.setAttribute("aria-invalid", key ? "true" : "false");
  if (e) e.textContent = key ? t(key) : "";
}
function validate() {
  let first = null;
  const check = (id, key) => { const i = $(id); const bad = key(i.value.trim()); fieldError(i, bad); if (bad && !first) first = i; };
  check("#f-svc", v => v ? "" : "err.sel");
  check("#f-name", v => v ? "" : "err.req");
  check("#f-company", v => v ? "" : "err.req");
  check("#f-email", v => !v ? "err.req" : (EMAIL_RE.test(v) ? "" : "err.email"));
  return first;
}
$$("input[required],select[required]", form).forEach(i => i.addEventListener("blur", () => { if (i.value || i.closest(".field").classList.contains("invalid")) validate(); }));

form.addEventListener("submit", e => {
  e.preventDefault();
  const bad = validate();
  if (bad) { bad.focus(); return; }
  const v = id => $(id).value.trim();
  const op = [
    "Serviço de interesse: " + SVC_PT[v("#f-svc")],
    v("#f-op") ? "Tipo de operação: " + OP_PT[v("#f-op")] : "",
    v("#f-goods") ? "Mercadoria: " + v("#f-goods") : "",
    v("#f-from") ? "Origem: " + v("#f-from") : "",
    v("#f-to") ? "Destino: " + v("#f-to") : ""
  ].filter(Boolean);
  const me = [
    "Nome: " + v("#f-name"),
    "Empresa: " + v("#f-company"),
    "E-mail: " + v("#f-email"),
    v("#f-phone") ? "WhatsApp/Telefone: " + v("#f-phone") : ""
  ].filter(Boolean);
  const NL = "\n";
  const lines = op.join(NL) + NL + NL + me.join(NL) + (v("#f-msg") ? NL + NL + v("#f-msg") : "");
  const subject = "Cotação pelo site - " + v("#f-company");
  $("#mailCopy").value = "Assunto: " + subject + "\n\n" + lines;
  const st = $("#formStatus"); st.hidden = false; st.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  const sb = $("#submitBtn"), sbTxt = sb.textContent; sb.disabled = true; sb.textContent = t("f.sending");
  setTimeout(() => { sb.disabled = false; sb.textContent = sbTxt; }, 3000);
  window.location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines);
});
$("#copyBtn").addEventListener("click", () => {
  const ta = $("#mailCopy"), b = $("#copyBtn"), old = b.textContent;
  const done = () => { b.textContent = t("ok.copied"); setTimeout(() => { b.textContent = old; }, 1800); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(done, () => { ta.select(); });
  else { ta.select(); try { document.execCommand("copy"); done(); } catch (e) {} }
});

/* ===== Revelar ao rolar (sem JS ou com movimento reduzido, tudo já aparece) ===== */
if ("IntersectionObserver" in window && !reduce) {
  const sel = ".svc,.post,.steps li,.diffs li,.journey,.quick,.net,.faq details,.strip-item,.mv div,.hq,.contact-form,.info > *";
  const rio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); } }), { threshold: .12, rootMargin: "0px 0px -40px 0px" });
  $$(sel).forEach(el => {
    if (el.classList.contains("in")) return;
    el.classList.add("reveal");
    el.style.setProperty("--d", (Array.from(el.parentNode.children).indexOf(el) % 4) * 0.08 + "s");
    rio.observe(el);
  });
}

/* ===== Dados do mapa-múndi (pontos de terra em land.js) ===== */
const D = Math.PI / 180, RAW = window.NLG_LAND || "", land = [];
for (let i = 0; i + 6 <= RAW.length; i += 6) land.push([parseInt(RAW.substr(i, 3), 36) / 10 - 180, parseInt(RAW.substr(i + 3, 3), 36) / 10 - 90]);
const HOME = [-46.33, -23.96]; // Santos
const HUB_KEYS = ["wd.r1", "wd.r2", "wd.r3", "wd.r5", "wd.r6", "wd.r7"];
const HUBS = [[121.47, 31.23], [4.48, 51.92], [-80.19, 25.76], [55.27, 25.2], [3.38, 6.52], [151.2, -33.87]]; // um ponto por região, ilustrativo

/* ===== Mapa conceitual ===== */
function drawMap() {
  const cv = $("#mapCanvas"), svg = $("#mapSvg"); if (!cv || !svg) return;
  const ctx = cv.getContext("2d"), CW = cv.width, CH = cv.height;
  const X = lo => (lo + 180) / 360, Y = la => (85 - la) / 145;
  ctx.clearRect(0, 0, CW, CH);
  ctx.fillStyle = "rgba(150,205,225,.5)";
  const s = CW / 1000 * 1.9;
  land.forEach(p => { if (p[1] < -58 || p[1] > 82) return; ctx.fillRect(X(p[0]) * CW - s / 2, Y(p[1]) * CH - s / 2, s, s); });
  const px = p => [X(p[0]) * 1000, Y(p[1]) * 420], h = px(HOME);
  let out = "";
  HUBS.forEach(d => {
    const q = px(d), dist = Math.hypot(q[0] - h[0], q[1] - h[1]), cy = Math.min(h[1], q[1]) - dist * .28, cx = (h[0] + q[0]) / 2;
    out += '<path class="arc" d="M' + h[0].toFixed(1) + ' ' + h[1].toFixed(1) + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + '"/>';
  });
  HUBS.forEach((d, k) => { const q = px(d); out += '<circle class="hub-ring" cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="5"/><circle class="hub" cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="3.6"/><text class="map-label" x="' + q[0].toFixed(1) + '" y="' + (q[1] - 11).toFixed(1) + '">' + t(HUB_KEYS[k]) + '</text>'; });
  out += '<circle class="hub-home-ring" cx="' + h[0].toFixed(1) + '" cy="' + h[1].toFixed(1) + '" r="6"/><circle class="hub-home" cx="' + h[0].toFixed(1) + '" cy="' + h[1].toFixed(1) + '" r="5.5"/><text class="map-label home" x="' + h[0].toFixed(1) + '" y="' + (h[1] + 22).toFixed(1) + '">' + t("wd.sp") + '</text>';
  svg.innerHTML = out;
}

/* ===== Mapa da sede: zoom animado do planeta (zoom mínimo) até a rua, com mapa do OpenStreetMap (Leaflet) ===== */
function initHq() {
  const art = $(".hq-art"), box = $("#hqLeaf"), fr = $(".hq-fallback"), hud = $("#hqHud");
  if (!art || !box) return;
  const LAT = -23.93309, LON = -46.32408;                     // Praça Antonio Telles, Centro, Santos/SP
  const LEAF = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/";
  let started = false;
  const fallback = () => { box.hidden = true; if (hud) hud.hidden = true; if (fr) { fr.hidden = false; fr.setAttribute("src", fr.dataset.src); } };

  function build() {
    const L = window.L; if (!L) return fallback();
    const z0 = Math.max(0.6, Math.log2(box.clientWidth / 256));  // mundo inteiro cabendo na largura = zoom mínimo
    const map = L.map(box, { zoomControl: false, zoomSnap: 0, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false,
      dragging: false, touchZoom: false, tap: false, worldCopyJump: true, attributionControl: true }).setView([18, -22], z0);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, keepBuffer: 4,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(map);
    L.marker([LAT, LON], { icon: L.divIcon({ className: "hq-pin", html: "<span></span>", iconSize: [18, 18] }), interactive: false, keyboard: false }).addTo(map);
    const show = () => { if (hud) hud.textContent = "Zoom " + map.getZoom().toFixed(1); };
    map.on("zoom", show); show();
    window.__hqMap = map;
    const fly = () => {
      if (started) return; started = true;
      // zoom em ritmo uniforme, com partida e chegada suaves (o flyTo do Leaflet é rápido no começo)
      const z0 = map.getZoom(), c0 = map.getCenter(), Z1 = 17, DUR = 9500, tt = performance.now();
      const ease = u => 0.5 - 0.5 * Math.cos(Math.PI * u);              // easeInOutSine
      (function step(now) {
        const u = Math.min((now - tt) / DUR, 1), z = z0 + (Z1 - z0) * ease(u);
        const f = (1 - Math.pow(2, z0 - z)) / (1 - Math.pow(2, z0 - Z1));  // mantém o alvo estável na tela durante o zoom
        map.setView([c0.lat + (LAT - c0.lat) * f, c0.lng + (LON - c0.lng) * f], z, { animate: false });
        if (u < 1) requestAnimationFrame(step);
        else { if (!L.Browser.mobile) map.dragging.enable(); L.control.zoom({ position: "bottomright" }).addTo(map); }
      })(tt);
    };
    if ("IntersectionObserver" in window) new IntersectionObserver(([en], ob) => { if (en.isIntersecting) { fly(); ob.disconnect(); } }, { threshold: 0.6 }).observe(art);
    else fly();
  }

  function load() {
    if (window.L) return build();
    const css = document.createElement("link"); css.rel = "stylesheet"; css.href = LEAF + "leaflet.min.css"; document.head.appendChild(css);
    const sc = document.createElement("script"); sc.src = LEAF + "leaflet.min.js"; sc.onload = build; sc.onerror = fallback; document.head.appendChild(sc);
  }
  // só baixa a biblioteca e os tiles quando o cartão está perto da tela
  if ("IntersectionObserver" in window) new IntersectionObserver(([en], ob) => { if (en.isIntersecting) { ob.disconnect(); load(); } }, { rootMargin: "500px" }).observe(art);
  else load();
}

/* ===== Vídeo do hero: toca sem som em laço; botão de pausar; pausa fora da tela e com economia de dados ===== */
(function () {
  const hv = $("#heroVideo"), mb = $("#motionBtn"); if (!hv || !mb) return;
  const root = document.documentElement;
  let playing = !(navigator.connection && navigator.connection.saveData);
  const go = () => { const p = hv.play(); if (p && p.catch) p.catch(() => {}); };
  function apply() {
    root.classList.toggle("hero-paused", !playing);
    mb.setAttribute("aria-pressed", String(!playing));
    mb.setAttribute("aria-label", t(playing ? "a11y.pause" : "a11y.play"));
    if (playing) go(); else hv.pause();
  }
  mb.addEventListener("click", () => { playing = !playing; apply(); });
  if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { if (!playing) return; if (e.isIntersecting) go(); else hv.pause(); }).observe(hv);
  apply();
})();

/* Recarregar a página sempre volta ao topo (sem restaurar a rolagem anterior) */
try {
  const nav = performance.getEntriesByType("navigation")[0];
  if (nav && nav.type === "reload") { window.scrollTo(0, 0); addEventListener("load", () => window.scrollTo(0, 0)); }
} catch (e) {}

/* ===== Início ===== */
$("#year").textContent = new Date().getFullYear();
const saved = store.get("nlg-lang");
if (saved === "en" || saved === "es") setLang(saved); else renderBlog();
drawMap();
initHq();

/* ===== Intro cinematográfica: toca a cada carregamento. Mapa de pontos com rotas que se desenham,
   luzes viajando, logo revelado por varredura e saída em "mergulho" para dentro do site. ===== */
(function () {
  const root = document.documentElement, el = $("#intro");
  if (!el) return;
  if (!root.classList.contains("intro-on")) { el.remove(); root.classList.add("hero-play"); return; }

  // frase da marca separada em letras, para entrar em cascata
  const tag = $(".intro-tag");
  if (tag) {
    const txt = tag.textContent; tag.setAttribute("aria-label", txt); tag.textContent = "";
    Array.from(txt).forEach((ch, i) => {
      const sp = document.createElement("span"); sp.setAttribute("aria-hidden", "true");
      sp.style.setProperty("--i", i); sp.textContent = ch === " " ? "\u00a0" : ch; tag.appendChild(sp);
    });
  }

  let done = false, alive = true;
  document.body.style.overflow = "hidden";
  const finish = () => {
    if (done) return; done = true;
    el.classList.add("out");
    root.classList.add("hero-play");
    setTimeout(() => {
      alive = false;
      root.classList.remove("intro-on");
      document.body.style.overflow = "";
      el.remove();
    }, 800);
  };
  $("#introSkip").addEventListener("click", finish);
  addEventListener("keydown", e => { if (e.key === "Escape") finish(); });
  $("#introSkip").focus({ preventScroll: true });
  setTimeout(finish, 2500);

  // ----- canvas: mapa de pontos + rotas animadas a partir de Santos -----
  const cv = $("#introCanvas"); if (!cv || !land.length) return;
  const ctx = cv.getContext("2d");
  const dpr = Math.min(devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  function fit() { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  fit(); addEventListener("resize", fit);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = u => 1 - Math.pow(1 - u, 3);
  const t0 = performance.now();

  function frame(now) {
    if (!alive) return;
    const t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    // câmera: o mapa desliza para a direita enquanto faz um zoom lento
    const zoom = (W < 700 ? 1.9 : 1.25) * (0.92 + t * 0.07);
    const sc = W * zoom / 360;
    const c0 = -48 + t * 5, cy0 = 6;
    const X = lo => W / 2 + (lo - c0) * sc, Y = la => H / 2 - (la - cy0) * sc;
    const fadeIn = clamp(t / 0.5, 0, 1);

    // terra
    ctx.fillStyle = "rgba(255,255,255," + (0.5 * fadeIn) + ")";
    const z = Math.max(1.4, sc * 0.2);
    for (let i = 0; i < land.length; i++) {
      const x = X(land[i][0]); if (x < -4 || x > W + 4) continue;
      const y = Y(land[i][1]); if (y < -4 || y > H + 4) continue;
      ctx.fillRect(x, y, z, z);
    }

    // rotas
    const hx = X(HOME[0]), hy = Y(HOME[1]);
    ctx.lineCap = "round";
    HUBS.forEach((d, k) => {
      const ex = X(d[0]), ey = Y(d[1]);
      const dist = Math.hypot(ex - hx, ey - hy), cx = (hx + ex) / 2, cyy = Math.min(hy, ey) - dist * 0.3;
      const start = 0.15 + k * 0.1, p = clamp((t - start) / 1.0, 0, 1), pe = ease(p);
      if (p <= 0) return;
      const pt = u => { const v = 1 - u; return [v * v * hx + 2 * v * u * cx + u * u * ex, v * v * hy + 2 * v * u * cyy + u * u * ey]; };
      // traço já desenhado
      ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 1.3; ctx.beginPath();
      const steps = 46; ctx.moveTo(hx, hy);
      for (let i = 1; i <= steps * pe; i++) { const q = pt(i / steps); ctx.lineTo(q[0], q[1]); }
      ctx.stroke();
      // cabeça luminosa (viaja; depois de chegar, continua percorrendo a rota em laço)
      const hu = p < 1 ? pe : ((t - start - 1.0) * 0.55) % 1;
      const hd = pt(hu);
      ctx.save(); ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 14; ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(hd[0], hd[1], 2.6, 0, 7); ctx.fill(); ctx.restore();
      if (p >= 1 || hu > 0.12) { // rastro curto atrás da cabeça
        ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i <= 8; i++) { const q = pt(Math.max(0, hu - 0.12) + (0.12 * i) / 8); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }
        ctx.stroke();
      }
      // chegada: ponto e anel que se expande
      if (p >= 1) {
        const r = clamp((t - start - 1.0) / 0.7, 0, 1);
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ex, ey, 3.4, 0, 7); ctx.fill();
        if (r < 1) { ctx.strokeStyle = "rgba(255,255,255," + (1 - r) + ")"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ex, ey, 4 + r * 22, 0, 7); ctx.stroke(); }
      }
    });
    // origem pulsando
    const pulse = (t * 1.4) % 1;
    ctx.strokeStyle = "rgba(255,255,255," + (1 - pulse) * 0.9 + ")"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(hx, hy, 6 + pulse * 30, 0, 7); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(hx, hy, 5.5, 0, 7); ctx.fill();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

})();
