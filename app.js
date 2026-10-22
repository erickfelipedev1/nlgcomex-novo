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
  "err.sel": "Selecione uma opção.", "ok.copied": "Copiado!", "bl.read": "Ler artigo completo",
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
  grid.innerHTML = window.ARTICLES.map(a => {
    const d = a[lang] || a.pt, href = "blog/" + a.slug + ".html";
    return '<article class="post reveal in"><div class="svc-art"><svg viewBox="0 0 320 160" aria-hidden="true"><use href="#' + a.ill + '"/></svg></div>' +
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
  window.location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines);
});
$("#copyBtn").addEventListener("click", () => {
  const ta = $("#mailCopy"), b = $("#copyBtn"), old = b.textContent;
  const done = () => { b.textContent = t("ok.copied"); setTimeout(() => { b.textContent = old; }, 1800); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(done, () => { ta.select(); });
  else { ta.select(); try { document.execCommand("copy"); done(); } catch (e) {} }
});

/* ===== Indicador numérico: o HTML já traz o valor real; a animação é só um bônus ===== */
function countUp(el) {
  const to = +el.dataset.to; if (!to || reduce) return;
  const t0 = performance.now(), dur = 1400;
  (function step(now) {
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step); else el.textContent = to;
  })(t0);
}
if ("IntersectionObserver" in window) {
  const cio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } }), { threshold: .6 });
  $$(".count").forEach(el => cio.observe(el));
}

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
const HUBS = [[121.47, 31.23], [4.48, 51.92], [-80.19, 25.76], [55.27, 25.2], [3.38, 6.52], [151.2, -33.87]]; // um ponto por região, ilustrativo

/* ===== Mapa conceitual ===== */
function drawMap() {
  const cv = $("#mapCanvas"), svg = $("#mapSvg"); if (!cv || !svg) return;
  const ctx = cv.getContext("2d"), CW = cv.width, CH = cv.height;
  const X = lo => (lo + 180) / 360, Y = la => (85 - la) / 145;
  ctx.clearRect(0, 0, CW, CH);
  ctx.fillStyle = "rgba(160,200,255,.5)";
  const s = CW / 1000 * 1.9;
  land.forEach(p => { if (p[1] < -58 || p[1] > 82) return; ctx.fillRect(X(p[0]) * CW - s / 2, Y(p[1]) * CH - s / 2, s, s); });
  const px = p => [X(p[0]) * 1000, Y(p[1]) * 420], h = px(HOME);
  let out = "";
  HUBS.forEach(d => {
    const q = px(d), dist = Math.hypot(q[0] - h[0], q[1] - h[1]), cy = Math.min(h[1], q[1]) - dist * .28, cx = (h[0] + q[0]) / 2;
    out += '<path class="arc" d="M' + h[0].toFixed(1) + ' ' + h[1].toFixed(1) + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + '"/>';
  });
  HUBS.forEach(d => { const q = px(d); out += '<circle class="hub-ring" cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="5"/><circle class="hub" cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="3.6"/>'; });
  out += '<circle class="hub-home-ring" cx="' + h[0].toFixed(1) + '" cy="' + h[1].toFixed(1) + '" r="6"/><circle class="hub-home" cx="' + h[0].toFixed(1) + '" cy="' + h[1].toFixed(1) + '" r="5.5"/>';
  svg.innerHTML = out;
}

/* ===== Globo do hero (canvas, pausa fora da tela) ===== */
function initGlobe() {
  const cv = $("#globe"); if (!cv) return;
  const ctx = cv.getContext("2d"), hero = cv.parentElement;
  const toV = (lo, la) => [Math.cos(la * D) * Math.sin(lo * D), Math.sin(la * D), Math.cos(la * D) * Math.cos(lo * D)];
  const arcs = HUBS.map((d, k) => {
    const a = toV(HOME[0], HOME[1]), b = toV(d[0], d[1]), dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2], om = Math.acos(Math.min(1, Math.max(-1, dot))), N = 60, pts = [];
    for (let i = 0; i <= N; i++) { const u = i / N, s1 = Math.sin((1 - u) * om) / Math.sin(om), s2 = Math.sin(u * om) / Math.sin(om), hh = 1 + Math.sin(Math.PI * u) * om * .16; pts.push([(a[0] * s1 + b[0] * s2) * hh, (a[1] * s1 + b[1] * s2) * hh, (a[2] * s1 + b[2] * s2) * hh]); }
    return { pts, off: k / HUBS.length, dur: 3.4 + (k % 3) * .6 };
  });
  let R, cx, cy, dpr, rot = -HOME[0] * D + .5, tilt = -.35, W = 0, H = 0;
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2); W = hero.clientWidth; H = hero.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const wide = W > 980;
    R = wide ? Math.min(W * .3, H * .46, 400) : Math.min(W * .62, H * .42, 320);
    cx = wide ? W * .74 : W * .5; cy = wide ? H * .46 : H * .62;
    if (reduce) frame(0);
  }
  const P = v => { const c = Math.cos(rot), s = Math.sin(rot); const x = v[0] * c + v[2] * s, z = -v[0] * s + v[2] * c, y = v[1], ct = Math.cos(tilt), st = Math.sin(tilt); return [cx + R * x, cy - R * (y * ct - z * st), y * st + z * ct]; };
  function frame(now) {
    const tt = now / 1000;
    if (!reduce) rot += .0016;
    ctx.clearRect(0, 0, W, H);
    let g = ctx.createRadialGradient(cx, cy, R * .9, cx, cy, R * 1.35); g.addColorStop(0, "rgba(70,140,255,.25)"); g.addColorStop(1, "rgba(70,140,255,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.35, 0, 7); ctx.fill();
    g = ctx.createRadialGradient(cx - R * .35, cy - R * .4, R * .1, cx, cy, R); g.addColorStop(0, "rgba(40,90,170,.5)"); g.addColorStop(1, "rgba(8,24,52,.7)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(120,180,255,.3)"; ctx.lineWidth = 1.2; ctx.stroke();
    const c = Math.cos(rot), s = Math.sin(rot), ct = Math.cos(tilt), st = Math.sin(tilt);
    for (let i = 0; i < land.length; i++) {
      const lo = land[i][0] * D, la = land[i][1] * D, cl = Math.cos(la), v0 = cl * Math.sin(lo), v1 = Math.sin(la), v2 = cl * Math.cos(lo);
      const x = v0 * c + v2 * s, z = -v0 * s + v2 * c, y2 = v1 * ct - z * st, z2 = v1 * st + z * ct; if (z2 <= 0) continue;
      const sz = .8 + z2 * 1.5; ctx.fillStyle = "rgba(190,220,255," + (.16 + z2 * .6) + ")"; ctx.fillRect(cx + R * x - sz / 2, cy - R * y2 - sz / 2, sz, sz);
    }
    ctx.lineCap = "round";
    arcs.forEach(a => {
      const pp = a.pts.map(P), head = (((tt / a.dur) + a.off) % 1 + 1) % 1, tail = .28, n = pp.length - 1;
      ctx.strokeStyle = "rgba(242,140,40,.2)"; ctx.lineWidth = 1; ctx.beginPath(); let on = false;
      pp.forEach(p => { if (p[2] > -.05) { on ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); on = true; } else on = false; }); ctx.stroke();
      if (reduce) return;
      for (let i = 1; i <= n; i++) { const u = i / n; if (u > head || u < head - tail) continue; const p0 = pp[i - 1], p1 = pp[i]; if (p0[2] < -.05 || p1[2] < -.05) continue; const al = (u - (head - tail)) / tail; ctx.strokeStyle = "rgba(255," + (150 + al * 60 | 0) + ",60," + al + ")"; ctx.lineWidth = 1 + al * 2; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); }
    });
    if (!reduce && visible) requestAnimationFrame(frame); else running = false;
  }
  let visible = true, running = false;
  const start = () => { if (!running && !reduce) { running = true; requestAnimationFrame(frame); } };
  if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }).observe(hero);
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(size, 200); });
  size(); start();
}

/* ===== Início ===== */
$("#year").textContent = new Date().getFullYear();
const saved = store.get("nlg-lang");
if (saved === "en" || saved === "es") setLang(saved); else renderBlog();
drawMap();
initGlobe();
})();
