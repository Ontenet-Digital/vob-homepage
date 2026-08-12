/* ============ Vision of the Bible — theme scripts ============ */
(function () {
    "use strict";

    new Lenis({
        autoRaf: true,
        autoToggle: true,
        anchors: true,
        allowNestedScroll: true,
        naiveDimensions: true,
        stopInertiaOnNavigate: true,
    });

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---- Mobile nav toggle ---- */
    (function () {
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

    /* ---- Scroll reveals ---- */
    (function () {
        var els = document.querySelectorAll(".reveal");
        if (!els.length) return;
        if (reduce || !("IntersectionObserver" in window)) {
            els.forEach(function (el) {
                el.classList.add("in");
            });
            return;
        }
        var io = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) {
                        e.target.classList.add("in");
                        io.unobserve(e.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
        );
        els.forEach(function (el) {
            io.observe(el);
        });
    })();

    /* ---- About rotating verse ---- */
    (function () {
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

    /* ---- Video banner: looping background video ---- */
    (function () {
        var videos = document.querySelectorAll("[data-vb-video]");
        if (!videos.length) return;
        if (reduce) {
            videos.forEach(function (video) {
                video.removeAttribute("autoplay");
                video.pause();
            });
            return;
        }
        if (!("IntersectionObserver" in window)) return;
        /* Keep the loop off the CPU while the banner is scrolled past */
        var io = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) {
                        var p = e.target.play();
                        if (p && typeof p.catch === "function")
                            p.catch(function () {});
                    } else {
                        e.target.pause();
                    }
                });
            },
            { threshold: 0.1 },
        );
        videos.forEach(function (video) {
            io.observe(video);
        });
    })();

    /* ---- Video section: play on hover, pause on leave ---- */
    document.querySelectorAll("[data-hover-video]").forEach(function (video) {
        var item = video.closest(".vsec__item") || video;
        var play = function () {
            var p = video.play();
            if (p && typeof p.catch === "function") p.catch(function () {});
            item.classList.add("is-playing");
        };
        var pause = function () {
            video.pause();
            item.classList.remove("is-playing");
        };
        item.addEventListener("mouseenter", play);
        item.addEventListener("mouseleave", pause);
        item.addEventListener("focusin", play);
        item.addEventListener("focusout", pause);
        /* Touch: tap toggles play/pause */
        item.addEventListener("click", function () {
            if (video.paused) play();
            else pause();
        });
    });

    /* ---- Client testimonial: YouTube reels, loaded only on click ---- */
    (function () {
        var EMBED = "https://www.youtube-nocookie.com/embed/";

        /* oar2 holds the full-height vertical frame but isn't generated for every
           video, so step through the remaining sizes when one 404s. Resource errors
           don't bubble — capture them at the document instead. */
        document.addEventListener(
            "error",
            function (e) {
                var img = e.target;
                if (
                    !img ||
                    img.tagName !== "IMG" ||
                    !img.hasAttribute("data-yt-fallbacks")
                )
                    return;
                var list = img
                    .getAttribute("data-yt-fallbacks")
                    .split(",")
                    .filter(Boolean);
                var next = list.shift();
                img.setAttribute("data-yt-fallbacks", list.join(","));
                if (next) img.src = next;
                else img.removeAttribute("data-yt-fallbacks");
            },
            true,
        );

        document.addEventListener("click", function (e) {
            var facade = e.target.closest
                ? e.target.closest("[data-yt-facade]")
                : null;
            if (!facade) return;
            var id = facade.getAttribute("data-yt-id");
            var media = facade.parentNode;
            if (!id || !media) return;

            var iframe = document.createElement("iframe");
            iframe.className = "testi__iframe";
            iframe.src =
                EMBED +
                encodeURIComponent(id) +
                "?autoplay=1&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=" +
                encodeURIComponent(id);
            iframe.title =
                facade.getAttribute("data-yt-label") || "Testimonial video";
            iframe.allow =
                "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
            iframe.setAttribute("allowfullscreen", "");
            media.innerHTML = "";
            media.appendChild(iframe);
        });

        /* Cards left without a title borrow the video's own YouTube title */
        function fetchTitle(el) {
            var id = el.getAttribute("data-yt-autotitle");
            el.removeAttribute("data-yt-autotitle");
            if (!id) return;
            fetch(
                "https://www.youtube.com/oembed?format=json&url=" +
                    encodeURIComponent("https://www.youtube.com/watch?v=" + id),
            )
                .then(function (res) {
                    return res.ok ? res.json() : null;
                })
                .then(function (data) {
                    if (!data || !data.title) return;
                    el.textContent = data.title;
                    var card = el.parentNode;
                    var facade = card && card.querySelector("[data-yt-facade]");
                    if (!facade) return;
                    facade.setAttribute("data-yt-label", data.title);
                    facade.setAttribute(
                        "aria-label",
                        "Play video: " + data.title,
                    );
                })
                .catch(function () {});
        }

        function initTitles(root) {
            var nodes = (root || document).querySelectorAll(
                "[data-yt-autotitle]",
            );
            if (!nodes.length || !window.fetch) return;
            if (!("IntersectionObserver" in window)) {
                nodes.forEach(fetchTitle);
                return;
            }
            var io = new IntersectionObserver(
                function (entries) {
                    entries.forEach(function (entry) {
                        if (!entry.isIntersecting) return;
                        io.unobserve(entry.target);
                        fetchTitle(entry.target);
                    });
                },
                { rootMargin: "300px 0px" },
            );
            nodes.forEach(function (el) {
                io.observe(el);
            });
        }

        initTitles();
        document.addEventListener("shopify:section:load", function (e) {
            initTitles(e.target);
        });
    })();

    /* ---- Collection filter drawer ---- */
    (function () {
        function initDrawer(root) {
            var scope = root || document;
            scope
                .querySelectorAll("[data-filter-drawer]")
                .forEach(function (drawer) {
                    if (drawer.dataset.drawerInit) return;
                    drawer.dataset.drawerInit = "1";

                    var toggle = scope.querySelector("[data-filters-toggle]");
                    var panel = drawer.querySelector(".plist__drawer-panel");
                    var closeEls = drawer.querySelectorAll(
                        "[data-filters-close]",
                    );

                    var open = function () {
                        drawer.classList.add("is-open");
                        drawer.setAttribute("aria-hidden", "false");
                        if (toggle)
                            toggle.setAttribute("aria-expanded", "true");
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
                        if (toggle)
                            toggle.setAttribute("aria-expanded", "false");
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

    /* ---- Custom sort dropdown (replaces the native select) ---- */
    (function () {
        function initSort(root) {
            var scope = root || document;
            scope
                .querySelectorAll("[data-sort-control]")
                .forEach(function (ctl) {
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

                        var x = 0;
                        var maxX = vw - EDGE - ctlRect.left - mw;
                        if (ctlRect.left + mw > vw - EDGE) x = maxX;
                        if (x < EDGE - ctlRect.left) x = EDGE - ctlRect.left;
                        menu.style.left = x + "px";

                        var top = tr.bottom - ctlRect.top + 8;
                        var bottom = ctlRect.top + top + mh;
                        if (bottom > vh - EDGE) {
                            var up = tr.top - ctlRect.top - mh - 8;
                            top =
                                up < EDGE - ctlRect.top
                                    ? vh - EDGE - mh - ctlRect.top
                                    : up;
                        }
                        if (top < EDGE - ctlRect.top) top = EDGE - ctlRect.top;
                        menu.style.top = top + "px";
                    }

                    function selectedIndex() {
                        var idx = options.findIndex(function (o) {
                            return o.getAttribute("aria-selected") === "true";
                        });
                        return idx < 0 ? 0 : idx;
                    }

                    function setActive(i) {
                        activeIndex = Math.max(
                            0,
                            Math.min(options.length - 1, i),
                        );
                        options.forEach(function (o, idx) {
                            o.classList.toggle(
                                "is-highlighted",
                                idx === activeIndex,
                            );
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
                        document.removeEventListener("click", onDocClick);
                    }

                    function openMenu() {
                        setActive(selectedIndex());
                        positionMenu();
                        ctl.classList.add("is-open");
                        trigger.setAttribute("aria-expanded", "true");
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

    /* ---- Collection page: sort + price filter form ---- */
    (function () {
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
})();
