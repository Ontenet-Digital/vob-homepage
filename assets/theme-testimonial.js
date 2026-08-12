/* ============ Client testimonial: YouTube reels ============ */
/* Loaded from layout/theme.liquid (deferred, after theme.js).
   Videos load only on click; titles are fetched lazily. */
(function () {
    "use strict";

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
                facade.setAttribute("aria-label", "Play video: " + data.title);
            })
            .catch(function () {});
    }

    function initTitles(root) {
        var nodes = (root || document).querySelectorAll("[data-yt-autotitle]");
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
