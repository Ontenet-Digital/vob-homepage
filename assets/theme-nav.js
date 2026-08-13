/* ============ Mobile menu drawer (bottom sheet) + staggered links ============ */
/* Loaded from layout/theme.liquid (deferred, after theme.js).
   On mobile (<=980px) the nav links live in a bottom-sheet drawer that rises
   from the bottom; each link staggers in from the left. On desktop this is a
   no-op (the links remain the inline top-level nav). */
(function () {
    "use strict";

    var toggle = document.querySelector(".nav__toggle");
    var drawer = document.querySelector("[data-nav-drawer]");
    var backdrop = document.querySelector("[data-nav-backdrop]");
    if (!toggle || !drawer) return;

    var MOBILE_QUERY = window.matchMedia("(max-width: 980px)");
    var STAGGER_START = 300; // ms before the first link begins its reveal
    var STAGGER_STEP = 60; // ms between each subsequent link

    function lenis() {
        return window.VOB && window.VOB.lenis ? window.VOB.lenis : null;
    }
    function lock() {
        document.body.classList.add("drawer-locked");
        var l = lenis();
        if (l && l.stop) l.stop();
    }
    function unlock() {
        document.body.classList.remove("drawer-locked");
        var l = lenis();
        if (l && l.start) l.start();
    }

    /* Set per-link stagger delays before the open transition runs. Skipped
       under prefers-reduced-motion so the links appear instantly. */
    function setStagger() {
        if (window.VOB && window.VOB.reducedMotion) return;
        drawer
            .querySelectorAll(".nav__drawer-links a")
            .forEach(function (a, i) {
                a.style.setProperty(
                    "--stagger",
                    STAGGER_START + i * STAGGER_STEP + "ms",
                );
            });
    }

    function open() {
        if (drawer.classList.contains("open")) return;
        setStagger();
        drawer.classList.add("open");
        if (backdrop) backdrop.classList.add("open");
        toggle.setAttribute("aria-expanded", "true");
        lock();
        var first = drawer.querySelector(".nav__drawer-close, a");
        if (first && first.focus) first.focus();
    }
    function close() {
        if (!drawer.classList.contains("open")) return;
        drawer.classList.remove("open");
        if (backdrop) backdrop.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        unlock();
        if (toggle && toggle.focus) toggle.focus();
    }

    toggle.addEventListener("click", function () {
        if (drawer.classList.contains("open")) close();
        else open();
    });
    drawer.querySelectorAll("[data-nav-close]").forEach(function (el) {
        el.addEventListener("click", close);
    });
    if (backdrop) backdrop.addEventListener("click", close);
    drawer.querySelectorAll(".nav__drawer-links a").forEach(function (a) {
        a.addEventListener("click", close);
    });
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" || e.key === "Esc") close();
    });

    /* Reset if the viewport grows back to desktop while the menu is open. */
    if (MOBILE_QUERY.addEventListener) {
        MOBILE_QUERY.addEventListener("change", function (e) {
            if (!e.matches && drawer.classList.contains("open")) close();
        });
    }
})();
