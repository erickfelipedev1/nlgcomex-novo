/* Páginas internas: menu móvel e ano do rodapé. */
(function () {
  "use strict";
  var b = document.getElementById("burger"), m = document.getElementById("menu");
  function close() { m.classList.remove("open"); b.setAttribute("aria-expanded", "false"); }
  if (b && m) {
    b.addEventListener("click", function () {
      var o = !m.classList.contains("open");
      m.classList.toggle("open", o);
      b.setAttribute("aria-expanded", String(o));
    });
    m.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && m.classList.contains("open")) { close(); b.focus(); } });
  }
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
