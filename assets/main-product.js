(function () {
    "use strict";

    function readJSON(el) {
        if (!el) return null;
        try {
            return JSON.parse(el.textContent);
        } catch (e) {
            return null;
        }
    }

    function initSection(root) {
        if (!root || root.__pdpInit) return;
        root.__pdpInit = true;

        /* ----- Gallery ----- */
        var slides = Array.prototype.slice.call(
            root.querySelectorAll("[data-pdp-slide]"),
        );
        var thumbs = Array.prototype.slice.call(
            root.querySelectorAll("[data-pdp-thumb]"),
        );
        var curEl = root.querySelector("[data-pdp-current]");
        var imgPrev = root.querySelector("[data-pdp-img-prev]");
        var imgNext = root.querySelector("[data-pdp-img-next]");
        var gi = 0;

        function showSlide(n) {
            if (!slides.length) return;
            n = (n + slides.length) % slides.length;
            slides.forEach(function (sl, i) {
                sl.classList.toggle("is-active", i === n);
            });
            thumbs.forEach(function (t, i) {
                t.classList.toggle("is-active", i === n);
                t.setAttribute("aria-current", i === n ? "true" : "false");
            });
            if (curEl) curEl.textContent = n + 1;
            gi = n;
            var active = thumbs[n];
            if (active && active.scrollIntoView) {
                active.scrollIntoView({
                    block: "nearest",
                    inline: "center",
                    behavior: "smooth",
                });
            }
        }

        thumbs.forEach(function (t) {
            t.addEventListener("click", function () {
                showSlide(parseInt(t.getAttribute("data-pdp-thumb"), 10));
            });
        });
        if (imgPrev)
            imgPrev.addEventListener("click", function () {
                showSlide(gi - 1);
            });
        if (imgNext)
            imgNext.addEventListener("click", function () {
                showSlide(gi + 1);
            });

        /* Swipe the stage on touch */
        var stage = root.querySelector("[data-pdp-stage]");
        if (stage && slides.length > 1) {
            var sx = null,
                sy = null;
            stage.addEventListener(
                "touchstart",
                function (e) {
                    sx = e.touches[0].clientX;
                    sy = e.touches[0].clientY;
                },
                { passive: true },
            );
            stage.addEventListener(
                "touchend",
                function (e) {
                    if (sx === null) return;
                    var dx = e.changedTouches[0].clientX - sx;
                    var dy = e.changedTouches[0].clientY - sy;
                    if (
                        Math.abs(dx) > 45 &&
                        Math.abs(dx) > Math.abs(dy) * 1.4
                    ) {
                        showSlide(dx < 0 ? gi + 1 : gi - 1);
                    }
                    sx = null;
                    sy = null;
                },
                { passive: true },
            );
        }

        /* ----- Quantity stepper ----- */
        var qtyInput = root.querySelector("[data-pdp-qty-input]");
        root.querySelectorAll("[data-pdp-qty]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                if (!qtyInput) return;
                var v =
                    (parseInt(qtyInput.value, 10) || 1) +
                    parseInt(btn.getAttribute("data-pdp-qty"), 10);
                if (v < 1) v = 1;
                qtyInput.value = v;
            });
        });

        /* ----- Variant select ----- */
        var select = root.querySelector("[data-pdp-variant]");
        var variants = readJSON(root.querySelector("[data-pdp-variant-json]"));
        var priceEl = root.querySelector("[data-pdp-price]");
        var addBtn = root.querySelector("[data-pdp-add]");
        var availText = root.querySelector("[data-pdp-avail-text]");
        var availDot = root.querySelector("[data-pdp-avail] .pdp__dot");
        var skuRow = root.querySelector("[data-pdp-sku-row]");
        var skuEl = root.querySelector("[data-pdp-sku]");
        var useHistory = root.getAttribute("data-history") !== "false";

        if (select && variants) {
            select.addEventListener("change", function () {
                var v = findVariant(variants, select.value);
                if (!v) return;
                if (priceEl) priceEl.innerHTML = priceHTML(v);
                if (addBtn) {
                    var lbl = addBtn.querySelector(".pdp__add-label");
                    addBtn.classList.remove("is-added");
                    if (v.available) {
                        addBtn.disabled = false;
                        if (lbl)
                            lbl.textContent =
                                addBtn.getAttribute("data-add-label") ||
                                "Add to cart";
                    } else {
                        addBtn.disabled = true;
                        if (lbl)
                            lbl.textContent =
                                addBtn.getAttribute("data-soldout-label") ||
                                "Sold out";
                    }
                }
                if (availText)
                    availText.textContent = v.available
                        ? availText.getAttribute("data-in") || "In stock"
                        : availText.getAttribute("data-out") || "Sold out";
                if (availDot) availDot.classList.toggle("is-out", !v.available);
                if (skuEl) {
                    skuEl.textContent = v.sku || "";
                    if (skuRow) skuRow.hidden = !v.sku;
                }
                var badgeEl = root.querySelector("[data-pdp-badge]");
                if (badgeEl) {
                    if (v.compare_raw && v.compare_raw > v.price_raw) {
                        var bpct = Math.round(
                            ((v.compare_raw - v.price_raw) * 100) /
                                v.compare_raw,
                        );
                        badgeEl.textContent =
                            (badgeEl.getAttribute("data-word") || "Save") +
                            " " +
                            bpct +
                            "%";
                        badgeEl.hidden = false;
                    } else {
                        badgeEl.hidden = true;
                    }
                }
                if (v.media && typeof showSlide === "function")
                    showSlide(v.media - 1);
                if (
                    useHistory &&
                    window.history &&
                    window.history.replaceState
                ) {
                    var u = new URL(window.location.href);
                    u.searchParams.set("variant", v.id);
                    window.history.replaceState({}, "", u.toString());
                }
            });
        }

        /* ----- Share ----- */
        root.querySelectorAll("[data-pdp-share]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                share(btn.getAttribute("data-pdp-share"), root, btn);
            });
        });

        /* ----- Add to cart ----- */
        var form = root.querySelector(".pdp__form");
        if (form) form.addEventListener("submit", onAddSubmit);
    }

    function findVariant(variants, id) {
        for (var i = 0; i < variants.length; i++) {
            if (String(variants[i].id) === String(id)) return variants[i];
        }
        return null;
    }

    function priceHTML(v) {
        var html = "";
        if (v.compare_raw && v.compare_raw > v.price_raw) {
            html += '<s class="pdp__price-compare">' + v.compare + "</s>";
        }
        html += '<span class="pdp__price-current">' + v.price + "</span>";
        if (v.compare_raw && v.compare_raw > v.price_raw) {
            var pct = Math.round(
                ((v.compare_raw - v.price_raw) * 100) / v.compare_raw,
            );
            html += '<span class="pdp__price-save">Save ' + pct + "%</span>";
        }
        return html;
    }

    function onAddSubmit(e) {
        var form = e.currentTarget;
        var root = form.closest("[data-pdp]");
        if (!root) return;
        e.preventDefault();

        var addUrl = root.getAttribute("data-cart-add-url") || "/cart/add";
        if (!/\.js(\?|$)/.test(addUrl)) addUrl += ".js";

        var btn = form.querySelector("[data-pdp-add]");
        var msg = root.querySelector("[data-pdp-error]");
        if (msg) {
            msg.hidden = true;
            msg.textContent = "";
        }
        setState(btn, "loading");

        fetch(addUrl, {
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
                if (!res.ok)
                    throw new Error(
                        (res.body && res.body.description) ||
                            "Sorry, this item could not be added.",
                    );
                setState(btn, "added");
                updateCartCount(root);
                document.dispatchEvent(
                    new CustomEvent("cart:refresh", { bubbles: true }),
                );
                setTimeout(function () {
                    setState(btn, "idle");
                }, 2200);
            })
            .catch(function (err) {
                setState(btn, "idle");
                if (msg) {
                    msg.hidden = false;
                    msg.textContent = err.message;
                }
            });
    }

    function setState(btn, state) {
        if (!btn) return;
        var lbl = btn.querySelector(".pdp__add-label");
        if (!btn.__label && lbl) btn.__label = lbl.textContent;
        btn.classList.remove("is-loading", "is-added");
        if (state === "loading") {
            btn.classList.add("is-loading");
            btn.disabled = true;
        } else if (state === "added") {
            btn.classList.add("is-added");
            btn.disabled = false;
            if (lbl)
                lbl.textContent =
                    btn.getAttribute("data-added-label") || "Added";
        } else {
            btn.disabled = false;
            if (lbl && btn.__label) lbl.textContent = btn.__label;
        }
    }

    function updateCartCount(root) {
        fetch((root.getAttribute("data-cart-url") || "/cart") + ".js", {
            headers: { Accept: "application/json" },
        })
            .then(function (r) {
                return r.ok ? r.json() : null;
            })
            .then(function (cart) {
                if (!cart) return;
                document
                    .querySelectorAll("[data-cart-count]")
                    .forEach(function (el) {
                        el.textContent = cart.item_count;
                    });
            })
            .catch(function () {});
    }

    function share(network, root, btn) {
        var url = root.getAttribute("data-product-url");
        if (url && url.indexOf("http") !== 0)
            url = window.location.origin + url;
        if (!url) url = window.location.href;
        var title = document.title;
        var img = "";
        var active = root.querySelector(".pdp__slide.is-active img");
        if (active) img = active.currentSrc || active.src;

        if (network === "copy") {
            copyLink(url, btn);
            return;
        }
        var map = {
            facebook:
                "https://www.facebook.com/sharer/sharer.php?u=" +
                encodeURIComponent(url),
            x:
                "https://twitter.com/intent/tweet?url=" +
                encodeURIComponent(url) +
                "&text=" +
                encodeURIComponent(title),
            pinterest:
                "https://pinterest.com/pin/create/button/?url=" +
                encodeURIComponent(url) +
                "&media=" +
                encodeURIComponent(img) +
                "&description=" +
                encodeURIComponent(title),
            whatsapp:
                "https://api.whatsapp.com/send?text=" +
                encodeURIComponent(title + " " + url),
        };
        var u = map[network];
        if (u)
            window.open(
                u,
                "_blank",
                "noopener,noreferrer,width=620,height=560",
            );
    }

    function copyLink(url, btn) {
        function done() {
            if (!btn) return;
            btn.classList.add("is-copied");
            setTimeout(function () {
                btn.classList.remove("is-copied");
            }, 1600);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(done).catch(fallback);
        } else {
            fallback();
        }
        function fallback() {
            var t = document.createElement("textarea");
            t.value = url;
            t.setAttribute("readonly", "");
            t.style.position = "absolute";
            t.style.left = "-9999px";
            document.body.appendChild(t);
            t.select();
            try {
                document.execCommand("copy");
                done();
            } catch (e) {}
            document.body.removeChild(t);
        }
    }

    function boot() {
        document.querySelectorAll("[data-pdp]").forEach(initSection);
    }
    if (document.readyState !== "loading") boot();
    else document.addEventListener("DOMContentLoaded", boot);

    document.addEventListener("shopify:section:load", function (e) {
        var el = e.target.querySelector
            ? e.target.querySelector("[data-pdp]")
            : null;
        if (e.target.matches && e.target.matches("[data-pdp]")) el = e.target;
        if (el) {
            el.__pdpInit = false;
            initSection(el);
        }
    });
})();
