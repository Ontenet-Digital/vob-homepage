/* ============ Vision of the Bible — theme core ============ */
/* This file is intentionally small: per-feature behaviour now lives in
   theme-nav.js, theme-reveal.js, theme-about.js, theme-video.js,
   theme-testimonial.js, theme-filters.js and theme-sort.js, all loaded
   from layout/theme.liquid (deferred, in this order). */
(function () {
    "use strict";

    /* Shared helpers for the feature scripts. */
    window.VOB = {
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches,
        lenis: null,
    };

    window.VOB.lenis = new Lenis({
        autoRaf: true,
        autoToggle: true,
        anchors: true,
        allowNestedScroll: true,
        naiveDimensions: true,
        stopInertiaOnNavigate: true,
    });
})();
