/* ============ Mobile nav toggle ============ */
/* Loaded from layout/theme.liquid (deferred, after theme.js). */
(function () {
    "use strict";

    var toggle = document.querySelector(".nav__toggle");
    var links = document.querySelector(".nav__links");
    if (!toggle || !links) return;
    toggle.addEventListener("click", function () {
        var isOpen = links.classList.toggle("open");
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
            links.classList.remove("open");
            toggle.setAttribute("aria-expanded", "false");
        });
    });
})();
