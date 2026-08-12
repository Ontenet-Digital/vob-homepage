/* ============ Video sections: banner loop + hover play ============ */
/* Loaded from layout/theme.liquid (deferred, after theme.js). */
(function () {
    "use strict";

    /* ---- Video banner: looping background video ---- */
    var videos = document.querySelectorAll("[data-vb-video]");
    if (!videos.length) return;
    if (window.VOB.reducedMotion) {
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
(function () {
    "use strict";

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
})();
