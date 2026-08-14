/* ============ Policy page: table of contents + scrollspy ============ */
/* Loaded from layout/theme.liquid (deferred, after theme.js).
   Populates the empty <ol id="policy-toc"> from the h2 headings inside
   [data-policy-body], assigns anchor ids, and highlights the active
   section while scrolling (IntersectionObserver). */
(function () {
    "use strict";

    var body = document.querySelector("[data-policy-body]");
    var toc = document.getElementById("policy-toc");
    if (!body || !toc) return;

    var headings = body.querySelectorAll("h2");
    if (!headings.length) {
        var card = toc.closest(".policy__toc-card") || toc.closest(".policy__toc");
        if (card) card.style.display = "none";
        return;
    }

    var links = [];
    var frag = document.createDocumentFragment();

    headings.forEach(function (h, i) {
        if (!h.id) h.id = "policy-section-" + (i + 1);

        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = "#" + h.id;
        a.className = "policy__toc-link";
        a.setAttribute("data-target", h.id);
        a.textContent = h.textContent;
        li.appendChild(a);
        frag.appendChild(li);
        links.push(a);
    });

    toc.appendChild(frag);

    // No scrollspy when reduced motion or no IntersectionObserver support.
    if (!window.VOB || window.VOB.reducedMotion || !("IntersectionObserver" in window)) {
        return;
    }

    var spy = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                links.forEach(function (link) {
                    link.classList.toggle(
                        "is-active",
                        link.getAttribute("data-target") === entry.target.id,
                    );
                });
            });
        },
        { rootMargin: "-20% 0px -70% 0px" },
    );

    headings.forEach(function (h) {
        spy.observe(h);
    });
})();
