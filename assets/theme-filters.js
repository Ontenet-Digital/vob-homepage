/* ============ Collection filter drawer + toolbar ============ */
/* Loaded from layout/theme.liquid (deferred, after theme.js).
   Custom sort dropdown lives in theme-sort.js. */
(function () {
    "use strict";

    /* ---- Collection filter drawer ---- */
    function initDrawer(root) {
        var scope = root || document;
        scope
            .querySelectorAll("[data-filter-drawer]")
            .forEach(function (drawer) {
                if (drawer.dataset.drawerInit) return;
                drawer.dataset.drawerInit = "1";

                var toggle = scope.querySelector("[data-filters-toggle]");
                var panel = drawer.querySelector(".plist__drawer-panel");
                var closeEls = drawer.querySelectorAll("[data-filters-close]");

                var open = function () {
                    drawer.classList.add("is-open");
                    drawer.setAttribute("aria-hidden", "false");
                    if (toggle) toggle.setAttribute("aria-expanded", "true");
                    document.body.classList.add("drawer-locked");
                    if (panel) {
                        var first = panel.querySelector(
                            "input, select, button",
                        );
                        if (first && first.focus) first.focus();
                    }
                };
                var close = function () {
                    drawer.classList.remove("is-open");
                    drawer.setAttribute("aria-hidden", "true");
                    if (toggle) toggle.setAttribute("aria-expanded", "false");
                    document.body.classList.remove("drawer-locked");
                    if (toggle && toggle.focus) toggle.focus();
                };

                if (toggle) {
                    toggle.addEventListener("click", function () {
                        if (drawer.classList.contains("is-open")) close();
                        else open();
                    });
                }
                closeEls.forEach(function (el) {
                    el.addEventListener("click", close);
                });
                document.addEventListener("keydown", function (e) {
                    if (e.key === "Escape" || e.key === "Esc") close();
                });
            });
    }

    initDrawer();
    document.addEventListener("shopify:section:load", function (e) {
        initDrawer(e.target);
    });
})();

/* ---- Collection page: sort + price filter form ---- */
(function () {
    "use strict";

    function initToolbar(root) {
        var scope = root || document;
        scope
            .querySelectorAll("[data-collection-filters]")
            .forEach(function (form) {
                if (form.dataset.collectionInit) return;
                form.dataset.collectionInit = "1";

                form.addEventListener("submit", function () {
                    var min = form.querySelector('[name*="price.gte"]');
                    var max = form.querySelector('[name*="price.lte"]');
                    if (min && max && min.value && max.value) {
                        if (parseFloat(min.value) > parseFloat(max.value)) {
                            var tmp = min.value;
                            min.value = max.value;
                            max.value = tmp;
                        }
                    }
                });
            });
    }

    initToolbar();
    document.addEventListener("shopify:section:load", function (e) {
        initToolbar(e.target);
    });
})();
