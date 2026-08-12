/* ============ About rotating verse ============ */
/* Loaded from layout/theme.liquid (deferred, after theme.js). */
(function () {
    "use strict";

    var el = document.getElementById("about-rotator");
    if (!el) return;
    var lines;
    try {
        lines = JSON.parse(el.getAttribute("data-lines") || "[]");
    } catch (err) {
        lines = [];
    }
    lines = lines.filter(function (s) {
        return s && s.trim();
    });
    if (lines.length < 2) return;
    var i = 0;
    setInterval(function () {
        el.style.opacity = 0;
        setTimeout(function () {
            i = (i + 1) % lines.length;
            el.textContent = lines[i];
            el.style.opacity = 1;
        }, 500);
    }, 3800);
})();
