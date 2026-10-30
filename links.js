/* Página /links/: vídeo de fundo com botão de pausar (pausa também com economia de dados). */
(function () {
  "use strict";
  var v = document.getElementById("linksVideo"), b = document.getElementById("motionBtn");
  var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
  if (!v || !b) return;
  var playing = !(navigator.connection && navigator.connection.saveData);
  function go() { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function apply() {
    document.documentElement.classList.toggle("hero-paused", !playing);
    b.setAttribute("aria-pressed", String(!playing));
    b.setAttribute("aria-label", playing ? "Pausar animação" : "Retomar animação");
    if (playing) go(); else v.pause();
  }
  b.addEventListener("click", function () { playing = !playing; apply(); });
  apply();
})();
