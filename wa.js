/* Botão flutuante de WhatsApp (canto inferior direito, todas as páginas).
   Preencha o número com DDI+DDD, só dígitos (ex.: "5513999999999"). Vazio = botão oculto. */
window.NLG_WA_NUMBER = "";
(function () {
  "use strict";
  var n = window.NLG_WA_NUMBER;
  if (!n) return;
  var a = document.createElement("a");
  a.className = "wa-fab";
  a.href = "https://wa.me/" + n + "?text=" + encodeURIComponent("Olá! Gostaria de falar com a equipe da NLG Comex.");
  a.target = "_blank"; a.rel = "noopener";
  a.setAttribute("aria-label", "Falar com a NLG pelo WhatsApp");
  a.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="#fff" d="M16.04 4C9.4 4 4 9.37 4 15.97c0 2.1.55 4.15 1.6 5.96L4 28l6.23-1.63a12.1 12.1 0 0 0 5.8 1.48h.01c6.64 0 12.04-5.37 12.04-11.97C28.08 9.37 22.68 4 16.04 4zm0 21.8h-.01a10.07 10.07 0 0 1-5.13-1.4l-.37-.22-3.7.97.99-3.6-.24-.37a9.9 9.9 0 0 1-1.52-5.2c0-5.46 4.47-9.9 9.99-9.9 2.67 0 5.18 1.04 7.06 2.9a9.8 9.8 0 0 1 2.93 7c0 5.46-4.48 9.9-9.99 9.9zm5.48-7.42c-.3-.15-1.78-.87-2.05-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.95 1.17-.18.2-.35.22-.65.07-.3-.15-1.27-.46-2.42-1.47-.9-.79-1.5-1.77-1.67-2.07-.18-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.68-1.62-.92-2.22-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.52.07-.8.37-.27.3-1.04 1.01-1.04 2.47s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.22 1.36.19 1.87.12.57-.09 1.78-.72 2.03-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"/></svg>';
  document.body.appendChild(a);
})();
