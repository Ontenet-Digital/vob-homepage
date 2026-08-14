/*!
 * theme-fill.js — circular-fill hover for the reusable
 * `btn--sweep-animation` class (see theme.css).
 *
 * The white fill sweeps UP on both hover entry AND hover exit:
 *   - Entry is pure CSS: `:hover`/`:focus-visible` runs `btn-sweep-in`
 *     (from BELOW the element up to covering it) — white comes from the bottom.
 *   - Exit: this file adds `.is-fill-out` on mouseleave/focusout, which runs
 *     `btn-sweep-out` (from covering UP past the top) — the element's own
 *     background is revealed from the bottom. The class is dropped on
 *     `animationend` so the fill returns to its hidden-above resting state
 *     without re-animating.
 *
 * Delegated listeners only — works for server-rendered AND client-rendered
 * elements with the class. No-op when reduced motion is on (CSS handles the
 * instant swap).
 */
(function () {
    "use strict";

    var SEL = ".btn--sweep-animation";
    var OUT = "btn-sweep-out";

    function btnFrom(node) {
        return node && node.closest ? node.closest(SEL) : null;
    }

    function startExit(btn) {
        btn.classList.add("is-fill-out");
        btn.addEventListener("animationend", function onEnd(ev) {
            if (ev.animationName === OUT) {
                btn.classList.remove("is-fill-out");
                btn.removeEventListener("animationend", onEnd);
            }
        });
    }

    document.addEventListener("mouseover", function (e) {
        var btn = btnFrom(e.target);
        if (!btn || btn.disabled) return;
        if (btn.contains(e.relatedTarget)) return; // entered from a child
        // Entry is driven by CSS :hover (btn-sweep-in). Clear any pending exit
        // class so a re-hover starts cleanly.
        btn.classList.remove("is-fill-out");
    });

    document.addEventListener("mouseout", function (e) {
        var btn = btnFrom(e.target);
        if (!btn) return;
        if (btn.contains(e.relatedTarget)) return; // moved onto a child
        startExit(btn);
    });

    document.addEventListener("focusin", function (e) {
        var btn = btnFrom(e.target);
        if (btn) btn.classList.remove("is-fill-out");
    });

    document.addEventListener("focusout", function (e) {
        var btn = btnFrom(e.target);
        if (btn) startExit(btn);
    });
})();
