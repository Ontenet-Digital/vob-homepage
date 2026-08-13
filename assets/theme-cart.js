/* ============ Cart drawer (slide-out) + cart badge ============ */
/* Loaded from layout/theme.liquid (deferred, after theme-filters.js).
   The drawer is server-rendered (sections/cart-drawer.liquid) and re-fetched
   through the Sections Rendering API after every cart change. All handlers are
   delegated on document so re-rendered markup stays wired without rebinding. */
(function () {
    "use strict";

    var CART_SECTIONS_URL = "/?sections=cart-drawer";

    var state = {
        drawer: null,
        toggle: null,
        bound: false,
    };

    /* ---- Element lookup (cached, refreshed when detached) ---- */
    function currentDrawer() {
        if (!state.drawer || !document.body.contains(state.drawer)) {
            state.drawer = document.querySelector("[data-cart-drawer]");
        }
        return state.drawer;
    }
    function currentToggle() {
        if (!state.toggle || !document.body.contains(state.toggle)) {
            state.toggle = document.querySelector("[data-cart-toggle]");
        }
        return state.toggle;
    }

    /* ---- Open / close ---- */
    function lenis() {
        return window.VOB && window.VOB.lenis ? window.VOB.lenis : null;
    }
    function lock() {
        document.body.classList.add("drawer-locked");
        // Pause Lenis smooth scroll so the background doesn't move while open.
        var l = lenis();
        if (l && l.stop) l.stop();
    }
    function unlock() {
        document.body.classList.remove("drawer-locked");
        var l = lenis();
        if (l && l.start) l.start();
    }
    function open() {
        var drawer = currentDrawer();
        if (!drawer) return;
        drawer.classList.add("is-open");
        drawer.setAttribute("aria-hidden", "false");
        var toggle = currentToggle();
        if (toggle) toggle.setAttribute("aria-expanded", "true");
        lock();
        var panel = drawer.querySelector(".cdrawer__panel");
        if (panel) {
            var first = panel.querySelector(
                ".cdrawer__close, button, a, input",
            );
            if (first && first.focus) first.focus();
        }
    }
    function close() {
        var drawer = currentDrawer();
        if (drawer) {
            drawer.classList.remove("is-open");
            drawer.setAttribute("aria-hidden", "true");
        }
        var toggle = currentToggle();
        if (toggle) toggle.setAttribute("aria-expanded", "false");
        unlock();
        if (toggle && toggle.focus) toggle.focus();
    }
    function toggle() {
        var drawer = currentDrawer();
        if (drawer && drawer.classList.contains("is-open")) close();
        else open();
    }

    function closest(el, sel) {
        return el && el.closest ? el.closest(sel) : null;
    }

    /* ---- Cart data ops ---- */
    function setLineLoading(id, on) {
        var item = document.querySelector('[data-line-item="' + id + '"]');
        if (!item) return;
        item.classList.toggle("is-loading", on);
        item.querySelectorAll("button, input").forEach(function (el) {
            el.disabled = on;
        });
    }

    function changeLine(id, qty) {
        setLineLoading(id, true);
        var body = new FormData();
        body.append("id", id);
        body.append("quantity", String(qty));
        return fetch("/cart/change.js", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "X-Requested-With": "XMLHttpRequest",
            },
            body: body,
        })
            .then(function (r) {
                return r.ok
                    ? r.json()
                    : Promise.reject(new Error("change failed"));
            })
            .then(function () {
                setLineLoading(id, false);
                refreshCart();
            })
            .catch(function () {
                setLineLoading(id, false);
            });
    }

    /* ---- Quick add (best-seller card / collection pages) ---- */
    function setAddBtnState(btn, state, addedLabel) {
        if (!btn) return;
        if (!btn.__label && btn.textContent) btn.__label = btn.textContent;
        if (state === "loading") {
            btn.classList.add("is-loading");
            btn.disabled = true;
        } else if (state === "added") {
            btn.classList.remove("is-loading");
            btn.disabled = false;
            btn.textContent = addedLabel || "Added ✓";
        } else {
            btn.classList.remove("is-loading");
            btn.disabled = false;
            if (btn.__label) btn.textContent = btn.__label;
        }
    }

    function quickAdd(form) {
        var btn = form.querySelector('button[type="submit"]');
        setAddBtnState(btn, "loading");
        fetch("/cart/add.js", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "X-Requested-With": "XMLHttpRequest",
            },
            body: new FormData(form),
        })
            .then(function (r) {
                return r.json().then(function (j) {
                    return { ok: r.ok, body: j };
                });
            })
            .then(function (res) {
                if (!res.ok) {
                    throw new Error(
                        (res.body && res.body.description) ||
                            "Sorry, this item could not be added.",
                    );
                }
                setAddBtnState(btn, "added");
                document.dispatchEvent(
                    new CustomEvent("cart:refresh", { bubbles: true }),
                );
                setTimeout(function () {
                    setAddBtnState(btn, "idle");
                }, 2200);
            })
            .catch(function () {
                setAddBtnState(btn, "idle");
            });
    }

    /* ---- Tabs (Cart / Recently viewed) + recently-viewed strip ---- */
    var RECENT_KEY = "vob:recently-viewed:v1";
    var RECENT_LIMIT = 4;

    function esc(str) {
        return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            }[c];
        });
    }

    function rvCardHTML(it, addLabel, soldLabel) {
        var available = it.available !== false;
        var thumb = it.image
            ? '<img src="' +
              esc(it.image) +
              '" alt="' +
              esc(it.image_alt || it.title) +
              '" loading="lazy">'
            : '<span class="cdrawer__rv-thumb-ph"></span>';
        var price =
            '<span class="cdrawer__rv-price">' +
            (it.compare ? "<s>" + esc(it.compare) + "</s> " : "") +
            esc(it.price || "") +
            "</span>";
        var addBtn = available
            ? '<button type="button" class="cdrawer__rv-add" data-rv-add="' +
              esc(it.url) +
              '">' +
              esc(addLabel) +
              "</button>"
            : '<button type="button" class="cdrawer__rv-add is-disabled" disabled aria-disabled="true">' +
              esc(soldLabel) +
              "</button>";
        return (
            '<div class="cdrawer__rv-item">' +
            '<a class="cdrawer__rv-link" href="' +
            esc(it.url) +
            '">' +
            '<span class="cdrawer__rv-thumb">' +
            thumb +
            "</span>" +
            '<span class="cdrawer__rv-info">' +
            '<span class="cdrawer__rv-title">' +
            esc(it.title) +
            "</span>" +
            price +
            "</span>" +
            "</a>" +
            addBtn +
            "</div>"
        );
    }

    function cartItemUrls() {
        var urls = {};
        document
            .querySelectorAll(".cdrawer__item .cdrawer__name")
            .forEach(function (a) {
                // Cart links include a ?variant= query; stored recently-viewed
                // URLs don't, so strip query/hash to compare cleanly.
                var href = (a.getAttribute("href") || "").split("?")[0];
                href = href.split("#")[0];
                if (href) urls[href] = true;
            });
        return urls;
    }

    function renderCartRecent() {
        var panel = document.querySelector("[data-cart-recent]");
        if (!panel) return;
        var title =
            panel.getAttribute("data-recent-title") || "Recently viewed";
        var empty =
            panel.getAttribute("data-recent-empty") ||
            "Recently viewed products will appear here.";
        var addLabel = panel.getAttribute("data-rv-add-label") || "Add to cart";
        var soldLabel = panel.getAttribute("data-rv-sold-label") || "Sold out";
        var list = [];
        try {
            list = JSON.parse(window.localStorage.getItem(RECENT_KEY)) || [];
        } catch (e) {
            list = [];
        }
        if (!Array.isArray(list)) list = [];
        var inCart = cartItemUrls();
        var shown = list
            .filter(function (it) {
                return it && it.url && !inCart[it.url];
            })
            .slice(0, RECENT_LIMIT);
        if (!shown.length) {
            panel.innerHTML =
                '<div class="cdrawer__recent"><p class="cdrawer__rv-none">' +
                esc(empty) +
                "</p></div>";
            return;
        }
        panel.innerHTML =
            '<div class="cdrawer__recent">' +
            '<h4 class="cdrawer__recent-head">' +
            esc(title) +
            "</h4>" +
            '<div class="cdrawer__rv">' +
            shown
                .map(function (it) {
                    return rvCardHTML(it, addLabel, soldLabel);
                })
                .join("") +
            "</div></div>";
    }

    function rvAdd(btn) {
        var url = btn.getAttribute("data-rv-add") || "";
        if (!url) return;
        setAddBtnState(btn, "loading");
        fetch(url + ".js", { headers: { Accept: "application/json" } })
            .then(function (r) {
                return r.ok
                    ? r.json()
                    : Promise.reject(new Error("product load failed"));
            })
            .then(function (product) {
                var variants = (product && product.variants) || [];
                var v =
                    variants.filter(function (x) {
                        return x.available;
                    })[0] || variants[0];
                if (!v) {
                    throw new Error("This product is unavailable.");
                }
                var body = new FormData();
                body.append("id", v.id);
                body.append("quantity", "1");
                return fetch("/cart/add.js", {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                    body: body,
                });
            })
            .then(function (r) {
                return r.json().then(function (j) {
                    return { ok: r.ok, body: j };
                });
            })
            .then(function (res) {
                if (!res.ok) {
                    throw new Error(
                        (res.body && res.body.description) ||
                            "Sorry, this item could not be added.",
                    );
                }
                setAddBtnState(btn, "added");
                document.dispatchEvent(
                    new CustomEvent("cart:refresh", { bubbles: true }),
                );
                setTimeout(function () {
                    setAddBtnState(btn, "idle");
                }, 2200);
            })
            .catch(function () {
                setAddBtnState(btn, "idle");
            });
    }

    function setTab(name) {
        document.querySelectorAll("[data-cart-tab]").forEach(function (t) {
            var on = t.getAttribute("data-cart-tab") === name;
            t.classList.toggle("is-active", on);
            t.setAttribute("aria-selected", on ? "true" : "false");
        });
        document.querySelectorAll("[data-cart-panel]").forEach(function (p) {
            p.classList.toggle(
                "is-active",
                p.getAttribute("data-cart-panel") === name,
            );
        });
    }
    function resetTabs() {
        setTab("cart");
        renderCartRecent();
    }

    function refreshCart(opts) {
        opts = opts || {};
        fetch(CART_SECTIONS_URL, { headers: { Accept: "application/json" } })
            .then(function (r) {
                return r.ok ? r.json() : null;
            })
            .then(function (data) {
                if (!data || !data["cart-drawer"]) return;
                var container = document.getElementById("cart-drawer");
                if (!container) return;
                var wasOpen = container.classList.contains("is-open");
                var activeTabEl = container.querySelector(
                    "[data-cart-tab].is-active",
                );
                var activeTab = activeTabEl
                    ? activeTabEl.getAttribute("data-cart-tab")
                    : "cart";
                var tmp = document.createElement("div");
                tmp.innerHTML = data["cart-drawer"];
                var next = tmp.querySelector("[data-cart-drawer]");
                if (!next) return;
                container.replaceWith(next);
                // Re-render may have removed/added the toggle (theme editor only);
                // stale refs are dropped by currentDrawer()/currentToggle().
                state.drawer = next;
                if (wasOpen || opts.open) {
                    next.classList.add("is-open");
                    next.setAttribute("aria-hidden", "false");
                    var toggle = currentToggle();
                    if (toggle) toggle.setAttribute("aria-expanded", "true");
                    lock();
                }
                updateCount();
                // Preserve the active tab when the drawer is open (e.g. adding
                // from the Recently-viewed list); default to Cart when opening
                // fresh from an add-to-cart elsewhere.
                setTab(wasOpen ? activeTab : "cart");
                renderCartRecent();
            })
            .catch(function () {});
    }

    /* ---- Badge count ---- */
    function updateCount() {
        fetch("/cart.js", { headers: { Accept: "application/json" } })
            .then(function (r) {
                return r.ok ? r.json() : null;
            })
            .then(function (cart) {
                if (!cart) return;
                var count = cart.item_count || 0;
                document
                    .querySelectorAll("[data-cart-count]")
                    .forEach(function (el) {
                        el.textContent = count;
                        if (count > 0) el.removeAttribute("hidden");
                        else el.setAttribute("hidden", "");
                    });
            })
            .catch(function () {});
    }

    /* ---- Delegated events ---- */
    document.addEventListener("click", function (e) {
        var el;

        el = closest(e.target, "[data-cart-tab]");
        if (el) {
            e.preventDefault();
            var tabName = el.getAttribute("data-cart-tab");
            setTab(tabName);
            if (tabName === "recent") renderCartRecent();
            return;
        }

        el = closest(e.target, "[data-rv-add]");
        if (el) {
            e.preventDefault();
            rvAdd(el);
            return;
        }

        el = closest(e.target, "[data-cart-toggle]");
        if (el) {
            e.preventDefault();
            toggle();
            return;
        }

        el = closest(e.target, "[data-cart-drawer-close]");
        if (el) {
            close();
            return;
        }

        el = closest(e.target, "[data-qty-change]");
        if (el) {
            e.preventDefault();
            var id = el.getAttribute("data-id");
            var qty = parseInt(el.getAttribute("data-qty"), 10) || 0;
            changeLine(id, qty);
            return;
        }

        el = closest(e.target, "[data-remove]");
        if (el) {
            e.preventDefault();
            changeLine(el.getAttribute("data-id"), 0);
        }
    });

    var inputTimers = {};
    document.addEventListener("change", function (e) {
        var inp = closest(e.target, "[data-qty-input]");
        if (!inp) return;
        var id = inp.getAttribute("data-id");
        var qty = parseInt(inp.value, 10);
        if (isNaN(qty) || qty < 0) qty = 1;
        clearTimeout(inputTimers[id]);
        inputTimers[id] = setTimeout(function () {
            changeLine(id, qty);
        }, 500);
    });

    document.addEventListener("submit", function (e) {
        var form = closest(e.target, ".bs-card__form");
        if (!form) return;
        e.preventDefault();
        quickAdd(form);
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" || e.key === "Esc") close();
    });

    /* ---- Global cart events (dispatched by add-to-cart handlers) ----
       Every add-to-cart dispatches `cart:refresh`; refresh the drawer AND open it. */
    document.addEventListener("cart:refresh", function () {
        refreshCart({ open: true });
    });
    document.addEventListener("cart:open", function () {
        refreshCart({ open: true });
    });

    /* ---- Cart PAGE (full /cart page): live qty stepper + remove ---- */
    var CART_PAGE_SECTIONS_URL = "/?sections=main-cart";
    var cartPageBusy = false;

    function refreshCartPage() {
        fetch(CART_PAGE_SECTIONS_URL, {
            headers: { Accept: "application/json" },
        })
            .then(function (r) {
                return r.ok ? r.json() : null;
            })
            .then(function (data) {
                cartPageBusy = false;
                if (!data || !data["main-cart"]) return;
                var main = document.getElementById("top");
                if (!main) return;
                var tmp = document.createElement("div");
                tmp.innerHTML = data["main-cart"];
                var next = tmp.querySelector(".page-shell");
                var current = main.querySelector(".page-shell");
                if (!next || !current) return;
                current.replaceWith(next);
                updateCount();
            })
            .catch(function () {
                cartPageBusy = false;
            });
    }

    function setPageLineLoading(id, on) {
        var item = document.querySelector('[data-cart-page-line="' + id + '"]');
        if (!item) return;
        item.classList.toggle("is-loading", on);
        item.querySelectorAll("button").forEach(function (el) {
            el.disabled = on;
        });
    }

    function pageChangeLine(id, qty) {
        if (cartPageBusy || !id) return;
        cartPageBusy = true;
        setPageLineLoading(id, true);
        var body = new FormData();
        body.append("id", id);
        body.append("quantity", String(qty));
        return fetch("/cart/change.js", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "X-Requested-With": "XMLHttpRequest",
            },
            body: body,
        })
            .then(function (r) {
                return r.ok
                    ? r.json()
                    : Promise.reject(new Error("change failed"));
            })
            .then(function () {
                setPageLineLoading(id, false);
                refreshCartPage();
            })
            .catch(function () {
                setPageLineLoading(id, false);
                cartPageBusy = false;
            });
    }

    document.addEventListener("click", function (e) {
        var qtyBtn = closest(e.target, "[data-cart-page-qty]");
        if (qtyBtn) {
            e.preventDefault();
            pageChangeLine(
                qtyBtn.getAttribute("data-id"),
                qtyBtn.getAttribute("data-qty"),
            );
            return;
        }
        var remove = closest(e.target, "[data-cart-page-remove]");
        if (remove) {
            e.preventDefault();
            pageChangeLine(remove.getAttribute("data-key"), "0");
        }
    });

    /* ---- Boot ---- */
    function boot() {
        // Delegated handlers are bound once at module scope; populate the
        // (hidden) recently-viewed panel so it's ready when its tab is opened.
        renderCartRecent();
    }
    if (document.readyState !== "loading") boot();
    else document.addEventListener("DOMContentLoaded", boot);

    document.addEventListener("shopify:section:load", function (e) {
        if (e.target.matches && e.target.matches("[data-cart-drawer]")) {
            state.drawer = e.target;
            resetTabs();
        }
    });
})();
