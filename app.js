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

/* ===== Mapa da sede: recorte do Brasil com Santos marcado ===== */
function drawHq() {
  const cv = $("#hqMap"); if (!cv) return;
  const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
  const L0 = -85, L1 = -15, A0 = 5, A1 = -36; // recorte (lon, lat)
  const x = lo => (lo - L0) / (L1 - L0) * W, y = la => (la - A0) / (A1 - A0) * H;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "rgba(150,205,225,.6)";
  land.forEach(p => { if (p[0] < L0 || p[0] > L1 || p[1] > A0 || p[1] < A1) return; ctx.fillRect(x(p[0]) - 2, y(p[1]) - 2, 4, 4); });
  const sx = x(HOME[0]), sy = y(HOME[1]);
  ctx.strokeStyle = "rgba(94,188,212,.6)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy, 20, 0, 7); ctx.stroke();
  ctx.fillStyle = "#5ebcd4"; ctx.beginPath(); ctx.arc(sx, sy, 9, 0, 7); ctx.fill();
}

/* ===== Intro cinematográfica: toca a cada carregamento, com botão de pular ===== */
(function () {
  const root = document.documentElement, el = $("#intro");
  if (!el) return;
  if (!root.classList.contains("intro-on")) { el.remove(); root.classList.add("hero-play"); return; }
  let done = false;
  document.body.style.overflow = "hidden";
  const finish = () => {
    if (done) return; done = true;
    el.classList.add("out");
    root.classList.add("hero-play");
    setTimeout(() => {
      root.classList.remove("intro-on");
      document.body.style.overflow = "";
      el.remove();
    }, 800);
  };
  $("#introSkip").addEventListener("click", finish);
  addEventListener("keydown", e => { if (e.key === "Escape") finish(); });
  $("#introSkip").focus({ preventScroll: true });
  setTimeout(finish, 1500);
})();

/* ===== Início ===== */
$("#year").textContent = new Date().getFullYear();
const saved = store.get("nlg-lang");
if (saved === "en" || saved === "es") setLang(saved); else renderBlog();
drawMap();
drawHq();
})();
