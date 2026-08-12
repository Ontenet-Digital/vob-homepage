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
                    encodeURIComponent(
                        "https://www.youtube.com/watch?v=" + id,
                    ),
            )
                .then(function (res) {
                    return res.ok ? res.json() : null;
                })
                .then(function (data) {
                    if (!data || !data.title) return;
                    el.textContent = data.title;
                    var card = el.parentNode;
                    var facade =
                        card && card.querySelector("[data-yt-facade]");
                    if (!facade) return;
                    facade.setAttribute("data-yt-label", data.title);
                    facade.setAttribute("aria-label", "Play video: " + data.title);
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
})();
