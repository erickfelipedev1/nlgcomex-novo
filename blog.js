/* Páginas do blog: troca de idioma e re-renderização do artigo/lista a partir de articles.js. */
(function () {
"use strict";
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const EXTRA = {
  pt: { "bl.back": "← Voltar ao blog", "bl.home": "← Voltar ao site", "bl.cta.t": "Quer conversar sobre a sua operação?", "bl.title2": "Conteúdo para planejar melhor sua operação internacional", "bl.read": "Ler artigo completo", "nav.blog": "Blog", "hd.quote": "Solicitar cotação", "ab.cta": "Falar com nossa equipe", "ft.privacy": "Política de Privacidade", "ft.rights": "Todos os direitos reservados.", "bl.t1": "Acompanhe conteúdos sobre frete marítimo, frete aéreo, agenciamento de cargas, desembaraço aduaneiro, importação e exportação." },
  en: { "bl.back": "← Back to the blog", "bl.home": "← Back to the site", "bl.cta.t": "Want to talk about your operation?", "bl.title2": "Content to better plan your international operation" },
  es: { "bl.back": "← Volver al blog", "bl.home": "← Volver al sitio", "bl.cta.t": "¿Quiere conversar sobre su operación?", "bl.title2": "Contenido para planificar mejor su operación internacional" }
};
const I = window.I18N || { en: {}, es: {} };
const dict = l => Object.assign({}, EXTRA.pt, I[l] || {}, EXTRA[l] || {});
const slug = document.body.dataset.slug;
const grid = $("#blogGrid");
let lang = "pt";

function render() {
  const d = dict(lang), arts = window.ARTICLES || [];
  $$("[data-i18n]").forEach(el => { if (d[el.dataset.i18n]) el.textContent = d[el.dataset.i18n]; });
  document.documentElement.lang = { pt: "pt-BR", en: "en", es: "es" }[lang];
  $$(".lang button").forEach(b => { const on = b.dataset.lang === lang; b.classList.toggle("active", on); b.setAttribute("aria-pressed", String(on)); });
  const a = arts.find(x => x.slug === slug);
  if (a) {
    const c = a[lang] || a.pt;
    $("#aCat").textContent = c.c; $("#aTitle").textContent = c.t;
    let html = "", ul = "";
    c.b.forEach(p => {
      if (p.indexOf("- ") === 0) ul += "<li>" + p.slice(2) + "</li>";
      else { if (ul) { html += '<ul class="ticks">' + ul + "</ul>"; ul = ""; } html += "<p>" + p + "</p>"; }
    });
    if (ul) html += '<ul class="ticks">' + ul + "</ul>";
    $("#aBody").innerHTML = html;
    document.title = c.t + " | NLG";
  }
  if (grid) {
    grid.innerHTML = arts.map(x => { const c = x[lang] || x.pt, href = x.slug + ".html";
      return '<article class="post"><div class="svc-art"><img src="../' + x.img + '" alt="" loading="lazy" decoding="async" width="900" height="506"></div><div class="post-body"><span class="cat">' + c.c + '</span><h3><a href="' + href + '">' + c.t + '</a></h3><p>' + c.e + '</p><a class="svc-link" href="' + href + '">' + d["bl.read"] + "</a></div></article>"; }).join("");
  }
}
$$(".lang button").forEach(b => b.addEventListener("click", () => { lang = b.dataset.lang; try { localStorage.setItem("nlg-lang", lang); } catch (e) {} render(); }));
try { const s = localStorage.getItem("nlg-lang"); if (s === "en" || s === "es") lang = s; } catch (e) {}
if (lang !== "pt") render();
$("#year").textContent = new Date().getFullYear();
})();
