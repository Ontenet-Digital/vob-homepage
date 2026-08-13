/* ============ Custom sort dropdown (replaces the native select) ============ */
/* Loaded from layout/theme.liquid (deferred, after theme.js). */
(function () {
    "use strict";

    function initSort(root) {
        var scope = root || document;
        scope.querySelectorAll("[data-sort-control]").forEach(function (ctl) {
            if (ctl.dataset.sortInit) return;
            ctl.dataset.sortInit = "1";

            var trigger = ctl.querySelector("[data-sort-trigger]");
            var menu = ctl.querySelector("[data-sort-menu]");
            var current = ctl.querySelector("[data-sort-current]");
            var input = ctl.querySelector("[data-sort-input]");
            if (!trigger || !menu || !current || !input) return;

            var options = Array.prototype.slice.call(
                menu.querySelectorAll("[data-sort-option]"),
            );
            var activeIndex = 0;
            var EDGE = 12;

            /* Keep the menu inside the viewport so it is never clipped on
                   small screens (no horizontal cutoff) and never forces a
                   scrollbar. The menu is position:absolute relative to the
                   control, so offsets below are relative to the control box. */
            function positionMenu() {
                var ctlRect = ctl.getBoundingClientRect();
                var tr = trigger.getBoundingClientRect();
                var mw = menu.offsetWidth || tr.width;
                var mh = menu.offsetHeight;
                // clientWidth/Height exclude the scrollbar, so clamping to
                // these guarantees the menu never causes page overflow.
                var vw = document.documentElement.clientWidth;
                var vh = document.documentElement.clientHeight;
                var vTop = 0;
                // Inside a scrollable drawer body (e.g. the mobile filter
                // bottom sheet) clamp vertically to that visible region so
                // the menu is never clipped by its overflow.
                var scroller = ctl.closest(".plist__drawer-body");
                if (scroller) {
                    var sr = scroller.getBoundingClientRect();
                    vTop = Math.max(sr.top, 0);
                    vh = Math.min(sr.bottom, vh);
                }

                var x = 0;
                var maxX = vw - EDGE - ctlRect.left - mw;
                if (ctlRect.left + mw > vw - EDGE) x = maxX;
                if (x < EDGE - ctlRect.left) x = EDGE - ctlRect.left;
                menu.style.left = x + "px";

                // Vertical: keep the menu inside [regionTop, regionBottom].
                // Open below the trigger when the full list fits; otherwise
                // flip it ABOVE the select button so it is never cut off at
                // the bottom of the sheet. If there isn't room to sit fully
                // above the trigger, pin the list to the top of the visible
                // region (it overlays the trigger) so the whole list stays
                // visible. Only if the list is taller than the entire region
                // is the height capped so it scrolls internally.
                var regionTop = vTop + EDGE;
                var regionBottom = vh - EDGE;
                var gap = 8;
                var below = tr.bottom - ctlRect.top + gap;
                var above = tr.top - ctlRect.top - mh - gap;
                var top;
                if (ctlRect.top + below + mh <= regionBottom) {
                    // Fits below the trigger → normal dropdown.
                    top = below;
                } else {
                    // Cut off at the bottom → render above the select button.
                    top = above;
                    if (ctlRect.top + top < regionTop) {
                        // Not enough room above the trigger; pin to the top of
                        // the visible region so nothing is clipped.
                        top = regionTop - ctlRect.top;
                    }
                }
                menu.style.top = top + "px";
                if (ctlRect.top + top + mh > regionBottom) {
                    var maxH = regionBottom - (ctlRect.top + top);
                    menu.style.maxHeight = Math.max(maxH, 40) + "px";
                    menu.style.overflowY = "auto";
                } else {
                    menu.style.maxHeight = "";
                    menu.style.overflowY = "";
                }
            }

            function selectedIndex() {
                var idx = options.findIndex(function (o) {
                    return o.getAttribute("aria-selected") === "true";
                });
                return idx < 0 ? 0 : idx;
            }

            /* While the sort menu is open inside the filter drawer, lock the
               drawer body's scroll so the gesture scrolls the MENU — not the
               whole sheet (avoids the nested-scroll "drawer scrollbar" bug). */
            function drawerHost() {
                return ctl.closest(".plist__drawer");
            }
            function lockDrawerBody() {
                var d = drawerHost();
                if (d) d.classList.add("plist__drawer--sort-open");
            }
            function unlockDrawerBody() {
                var d = drawerHost();
                if (d) d.classList.remove("plist__drawer--sort-open");
            }

            function setActive(i) {
                activeIndex = Math.max(0, Math.min(options.length - 1, i));
                options.forEach(function (o, idx) {
                    o.classList.toggle("is-highlighted", idx === activeIndex);
                });
                if (options[activeIndex]) {
                    trigger.setAttribute(
                        "aria-activedescendant",
                        options[activeIndex].id,
                    );
                }
            }

            function close() {
                ctl.classList.remove("is-open");
                trigger.setAttribute("aria-expanded", "false");
                unlockDrawerBody();
                document.removeEventListener("click", onDocClick);
            }

            function openMenu() {
                setActive(selectedIndex());
                positionMenu();
                ctl.classList.add("is-open");
                trigger.setAttribute("aria-expanded", "true");
                lockDrawerBody();
                setTimeout(function () {
                    document.addEventListener("click", onDocClick);
                }, 0);
            }

            function choose(i) {
                var opt = options[i];
                if (!opt) return;
                var value = opt.getAttribute("data-sort-option") || "";
                current.textContent = opt.textContent;
                options.forEach(function (o) {
                    o.setAttribute(
                        "aria-selected",
                        o === opt ? "true" : "false",
                    );
                });
                input.value = value;
                if (value === "") input.removeAttribute("name");
                else input.setAttribute("name", "sort_by");
                close();
                var form = ctl.closest("[data-collection-filters]");
                if (form) form.submit();
            }

            function onDocClick(e) {
                if (!ctl.contains(e.target)) close();
            }

            trigger.addEventListener("click", function () {
                if (ctl.classList.contains("is-open")) close();
                else openMenu();
            });
            trigger.addEventListener("keydown", function (e) {
                if (ctl.classList.contains("is-open")) {
                    if (e.key === "Escape" || e.key === "Esc") {
                        close();
                        trigger.focus();
                        e.preventDefault();
                    } else if (e.key === "ArrowDown") {
                        setActive(activeIndex + 1);
                        e.preventDefault();
                    } else if (e.key === "ArrowUp") {
                        setActive(activeIndex - 1);
                        e.preventDefault();
                    } else if (e.key === "Home") {
                        setActive(0);
                        e.preventDefault();
                    } else if (e.key === "End") {
                        setActive(options.length - 1);
                        e.preventDefault();
                    } else if (e.key === "Enter" || e.key === " ") {
                        choose(activeIndex);
                        e.preventDefault();
                    }
                } else if (
                    e.key === "ArrowDown" ||
                    e.key === "Enter" ||
                    e.key === " "
                ) {
                    openMenu();
                    e.preventDefault();
                }
            });
            options.forEach(function (o, idx) {
                o.addEventListener("mousedown", function (e) {
                    e.preventDefault();
                });
                o.addEventListener("click", function () {
                    choose(idx);
                });
            });
            menu.addEventListener("keydown", function (e) {
                if (e.key === "Escape" || e.key === "Esc") {
                    close();
                    trigger.focus();
                    e.preventDefault();
                }
            });

            function onReposition() {
                if (ctl.classList.contains("is-open")) positionMenu();
            }
            window.addEventListener("resize", onReposition);
            document.addEventListener("scroll", onReposition, true);
        });
    }

    initSort();
    document.addEventListener("shopify:section:load", function (e) {
        initSort(e.target);
    });
})();
