/* Página de contato: validação e envio por e-mail (mesma lógica do formulário da home). */
(function () {
  "use strict";
  var CONTACT_EMAIL = "contato@nlgcomex.com.br";
  var SVC = { maritimo: "Frete marítimo", aereo: "Frete aéreo", agenciamento: "Agenciamento de cargas", desembaraco: "Desembaraço aduaneiro", importacao: "Suporte à importação", exportacao: "Suporte à exportação", armazem: "Armazém de cargas", rodoviario: "Transporte rodoviário", orientacao: "Preciso de orientação" };
  var OP = { importacao: "Importação", exportacao: "Exportação" };
  var MSG = { req: "Preencha este campo.", email: "Informe um e-mail válido, por exemplo nome@empresa.com.", sel: "Selecione uma opção." };
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var $ = function (s) { return document.querySelector(s); };
  var form = $("#contactForm"); if (!form) return;

  var q = new URLSearchParams(location.search).get("servico");
  if (q && SVC[q]) $("#f-svc").value = q;

  function setErr(input, key) {
    var f = input.closest(".field"), e = $("#" + input.getAttribute("aria-describedby"));
    f.classList.toggle("invalid", !!key);
    input.setAttribute("aria-invalid", key ? "true" : "false");
    if (e) e.textContent = key ? MSG[key] : "";
  }
  function validate() {
    var first = null;
    function chk(id, fn) { var i = $(id), bad = fn(i.value.trim()); setErr(i, bad); if (bad && !first) first = i; }
    chk("#f-svc", function (v) { return v ? "" : "sel"; });
    chk("#f-name", function (v) { return v ? "" : "req"; });
    chk("#f-company", function (v) { return v ? "" : "req"; });
    chk("#f-op", function (v) { return v ? "" : "sel"; });
    ["#f-goods", "#f-from", "#f-to", "#f-phone", "#f-msg"].forEach(function (id) { chk(id, function (v) { return v ? "" : "req"; }); });
    chk("#f-email", function (v) { return !v ? "req" : (EMAIL_RE.test(v) ? "" : "email"); });
    return first;
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var bad = validate(); if (bad) { bad.focus(); return; }
    var v = function (id) { return $(id).value.trim(); }, NL = "\n";
    var op = ["Serviço de interesse: " + SVC[v("#f-svc")],
      v("#f-op") ? "Tipo de operação: " + OP[v("#f-op")] : "", v("#f-goods") ? "Mercadoria: " + v("#f-goods") : "",
      v("#f-from") ? "Origem: " + v("#f-from") : "", v("#f-to") ? "Destino: " + v("#f-to") : ""].filter(Boolean);
    var me = ["Nome: " + v("#f-name"), "Empresa: " + v("#f-company"), "E-mail: " + v("#f-email"), v("#f-phone") ? "WhatsApp/Telefone: " + v("#f-phone") : ""].filter(Boolean);
    var body = op.join(NL) + NL + NL + me.join(NL) + (v("#f-msg") ? NL + NL + v("#f-msg") : "");
    var subject = "Cotação pelo site - " + v("#f-company");
    $("#mailCopy").value = "Assunto: " + subject + NL + NL + body;
    var st = $("#formStatus"); st.hidden = false;
    var sb = $("#submitBtn"), txt = sb.textContent; sb.disabled = true; sb.textContent = "Abrindo seu e-mail…";
    setTimeout(function () { sb.disabled = false; sb.textContent = txt; }, 3000);
    window.location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  });
  $("#copyBtn").addEventListener("click", function () {
    var ta = $("#mailCopy"), b = $("#copyBtn"), old = b.textContent;
    function done() { b.textContent = "Copiado!"; setTimeout(function () { b.textContent = old; }, 1800); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(done, function () { ta.select(); });
    else { ta.select(); try { document.execCommand("copy"); done(); } catch (e) {} }
  });
})();
