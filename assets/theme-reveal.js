/* ============ Scroll reveals ============ */
/* Loaded from layout/theme.liquid (deferred, after theme.js). */
(function () {
    "use strict";

    var els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    if (window.VOB.reducedMotion || !("IntersectionObserver" in window)) {
        els.forEach(function (el) {
            el.classList.add("in");
        });
        return;
    }
    // threshold 0: reveal as soon as any part of the element enters the viewport.
    // A fixed threshold like 0.12 can never be met for very tall elements
    // (e.g. the policy body, ~33k px), leaving them stuck at opacity 0.
    var io = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    e.target.classList.add("in");
                    io.unobserve(e.target);
                }
            });
        },
        { threshold: 0, rootMargin: "0px 0px -6% 0px" },
    );
    els.forEach(function (el) {
        io.observe(el);
    });
})();
