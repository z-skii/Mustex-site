/* MUSTEX marketing site — small vanilla JS, no dependencies. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var supportsIO = "IntersectionObserver" in window;

  /* ---------- ignore mobile Safari's toolbar-driven resize noise ----------
     iOS Safari fires "resize" as the address bar collapses/expands during
     scroll — that's a HEIGHT change, not a real layout change. Anything
     reacting to resize should only fire on an actual width change (or a
     real orientation flip), never on every toolbar animation frame. */
  var lastStableWidth = window.innerWidth;
  function onRealResize(fn) {
    window.addEventListener("resize", function () {
      var w = window.innerWidth;
      if (w === lastStableWidth) return;
      lastStableWidth = w;
      fn();
    });
  }

  /* ---------- real screenshot slots ----------
     Each .screen-img points at assets/screens/<name>.png.
     If the file exists, it covers the CSS mockup.
     If it 404s, remove the img so the mockup shows. */
  document.querySelectorAll(".screen-img").forEach(function (img) {
    function drop() { img.remove(); }
    if (img.complete && img.naturalWidth === 0) drop();
    else img.addEventListener("error", drop);
  });

  /* ---------- nav ---------- */

  var nav = document.getElementById("nav");
  var navToggle = document.getElementById("navToggle");
  var navMenu = document.getElementById("navMenu");

  function onScroll() {
    nav.classList.toggle("scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function closeMenu() {
    navMenu.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
  }
  navToggle.addEventListener("click", function () {
    var open = navMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  navMenu.addEventListener("click", function (e) {
    if (e.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && navMenu.classList.contains("open")) {
      closeMenu();
      navToggle.focus();
    }
  });

  /* ---------- score count-up (supports decimals, e.g. 5.4) ---------- */

  function countUp(el) {
    var raw = el.getAttribute("data-count");
    var target = parseFloat(raw);
    if (isNaN(target)) return;
    var decimals = raw.indexOf(".") > -1 ? 1 : 0;
    var dur = 900;
    var start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (eased * target).toFixed(decimals);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- reveal on scroll (+ trigger count-ups inside) ---------- */

  var revealEls = document.querySelectorAll("[data-reveal]");
  function activate(el) {
    el.classList.add("in");
    if (!reduceMotion) {
      el.querySelectorAll("[data-count]").forEach(countUp);
      if (el.hasAttribute("data-count")) countUp(el);
    }
  }
  if (reduceMotion || !supportsIO) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          activate(entry.target);
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  }

  /* ---------- the core: one full-screen sequence, six chapters ---------- */

  var coreStage = document.getElementById("coreStage");
  var coreChapters = document.querySelectorAll("[data-chapter-trigger]");
  var coreNum = document.getElementById("coreNum");
  var coreLabel = document.getElementById("coreLabel");
  var coreLine = document.getElementById("coreLine");
  var coreOrb = document.getElementById("coreOrb");
  var coreVerdictPanel = document.getElementById("coreVerdictPanel");
  var verdictCounted = false;
  var currentCoreChapter = 0;

  var CHAPTER_NAMES = { 1: "The Chat", 2: "Reading it", 3: "The Signals", 4: "The Verdict", 5: "What to Send", 6: "Share it" };
  var CHAPTER_LINES = {
    1: "STOP REREADING<br>THE CHAT.",
    2: "WE READ<br>THE DYNAMIC.",
    3: "EVERY SIGNAL<br>HAS RECEIPTS.",
    4: "NOW YOU KNOW<br>WHAT IT MEANS.",
    5: "NOW YOU KNOW<br>WHAT TO SEND.",
    6: "SEND THE READ<br>TO THE GROUP CHAT."
  };
  var ORB_STATES = { 1: "dormant", 2: "pulsing", 3: "orbiting", 4: "reacting", 5: "reacting", 6: "collapsed" };
  var SIG_MARK = { ask: "marked", vague: "marked-bad", deflect: "marked-bad" };
  var CORE_MARKS = ["marked", "marked-good", "marked-bad"];

  function setCoreChapter(n) {
    if (!coreStage || n === currentCoreChapter) return;
    currentCoreChapter = n;
    coreStage.setAttribute("data-chapter", n);
    if (coreNum) coreNum.textContent = n < 10 ? "0" + n : String(n);
    if (coreLabel) coreLabel.textContent = CHAPTER_NAMES[n] || "";
    if (coreOrb) coreOrb.setAttribute("data-state", ORB_STATES[n] || "dormant");

    coreChapters.forEach(function (c) {
      c.classList.toggle("active", c.getAttribute("data-chapter-trigger") === String(n));
    });

    document.querySelectorAll("#cpChat .bubble[data-sig]").forEach(function (b) {
      var mark = SIG_MARK[b.getAttribute("data-sig")];
      CORE_MARKS.forEach(function (m) { b.classList.remove(m); });
      if (n === 3 && mark) b.classList.add(mark);
    });

    var chatLayer = document.getElementById("cpChat");
    var sendLayer = document.getElementById("cpSend");
    var shareLayer = document.getElementById("cpShare");
    if (chatLayer) chatLayer.classList.toggle("active", n <= 4);
    if (sendLayer) sendLayer.classList.toggle("active", n === 5);
    if (shareLayer) shareLayer.classList.toggle("active", n === 6);

    if (coreVerdictPanel) coreVerdictPanel.classList.toggle("active", n === 4);
    var replyPanel = document.getElementById("coreReplyPanel");
    if (replyPanel) replyPanel.classList.toggle("active", n === 5);
    var shareScene = document.getElementById("coreShareScene");
    if (shareScene) shareScene.classList.toggle("active", n === 6);

    if (coreLine) {
      var next = CHAPTER_LINES[n] || "";
      function swapIn() {
        coreLine.innerHTML = next;
        if (!reduceMotion) requestAnimationFrame(function () { coreLine.classList.remove("swap"); });
      }
      if (reduceMotion) swapIn();
      else { coreLine.classList.add("swap"); setTimeout(swapIn, 200); }
    }

    if (n === 4 && !verdictCounted && !reduceMotion) {
      verdictCounted = true;
      var s = coreVerdictPanel && coreVerdictPanel.querySelector("[data-count]");
      if (s) countUp(s);
    }
  }

  if (coreStage && coreChapters.length) {
    /* Deterministic "closest trigger to viewport center" on scroll,
       rAF-throttled, instead of IntersectionObserver + a debounce.
       Two problems with the previous approach: (1) rootMargin
       percentages are resolved against the CURRENT visual viewport —
       on iOS Safari that viewport's height changes as the address bar
       collapses/expands mid-scroll, which could flip the observer
       between chapters with no further scrolling; (2) the debounce
       added to coalesce that "cancel and replace with whichever fires
       last" — which silently drops any chapter that gets superseded
       within the debounce window during a fast scroll (the reported
       "skips from 2 to 4"). This recomputes fresh from actual
       getBoundingClientRect()s every animation frame (one read, no
       interleaved writes, so no layout thrash) and always applies
       whichever chapter is genuinely centered right now — nothing to
       drop, nothing that depends on a stale cached viewport size. */
    var coreTriggerEls = Array.prototype.slice.call(coreChapters);
    var coreScrollTicking = false;
    var lastAppliedCoreChapter = null;
    function updateCoreChapterFromScroll() {
      coreScrollTicking = false;
      var viewportCenter = window.innerHeight / 2;
      var closestEl = null;
      var closestDist = Infinity;
      var currentDist = Infinity;
      for (var i = 0; i < coreTriggerEls.length; i++) {
        var el = coreTriggerEls[i];
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) continue; // nowhere near the viewport
        var dist = Math.abs((r.top + r.height / 2) - viewportCenter);
        if (parseInt(el.getAttribute("data-chapter-trigger"), 10) === lastAppliedCoreChapter) {
          currentDist = dist;
        }
        if (dist < closestDist) {
          closestDist = dist;
          closestEl = el;
        }
      }
      if (!closestEl) return;
      var candidate = parseInt(closestEl.getAttribute("data-chapter-trigger"), 10);
      /* Hysteresis: a chapter's own panel opening/closing briefly changes
         the sticky box's own height (grid-rows/opacity transitions on
         .core-panel), which nudges every trigger below it up or down by
         that same amount for the ~0.4s the transition runs. Right at a
         boundary that can make the "closest" trigger flicker between two
         neighbors with no real scrolling. Only switch away from the
         current chapter when the new one is clearly closer, not on a
         near-tie — real scrolling quickly exceeds this margin anyway. */
      if (lastAppliedCoreChapter !== null && candidate !== lastAppliedCoreChapter &&
          currentDist !== Infinity && closestDist > currentDist - 24) {
        return;
      }
      lastAppliedCoreChapter = candidate;
      setCoreChapter(candidate);
    }
    function onCoreScroll() {
      if (!coreScrollTicking) {
        coreScrollTicking = true;
        requestAnimationFrame(updateCoreChapterFromScroll);
      }
    }
    window.addEventListener("scroll", onCoreScroll, { passive: true });
    updateCoreChapterFromScroll();
  }

  /* ---------- receipts: annotations highlight bubbles ---------- */

  var annotations = document.querySelectorAll("[data-annotation]");
  var MARKS = ["marked", "marked-good", "marked-bad"];

  function clearMarks() {
    document.querySelectorAll("#evPhone .bubble").forEach(function (b) {
      MARKS.forEach(function (m) { b.classList.remove(m); });
    });
  }
  function applyAnnotation(el) {
    clearMarks();
    var target = el.getAttribute("data-target");
    var mark = el.getAttribute("data-mark") || "marked";
    document
      .querySelectorAll('#evPhone .bubble[data-ev="' + target + '"]')
      .forEach(function (b) { b.classList.add(mark); });
    annotations.forEach(function (a) { a.classList.toggle("active", a === el); });
  }

  if (annotations.length && supportsIO && !reduceMotion) {
    var evIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) applyAnnotation(entry.target);
      });
    }, { rootMargin: "-40% 0px -40% 0px", threshold: 0 });
    annotations.forEach(function (a) { evIO.observe(a); });
  } else {
    annotations.forEach(function (a) { a.classList.add("active"); });
    if (annotations[0]) applyAnnotation(annotations[0]);
  }

  /* ---------- share card assembly ---------- */

  var shareCard = document.getElementById("shareCard");
  if (shareCard) {
    if (reduceMotion || !supportsIO) {
      shareCard.classList.add("assembled");
    } else {
      var shareIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            shareCard.classList.add("assembled");
            shareCard.querySelectorAll("[data-count]").forEach(countUp);
            shareIO.disconnect();
          }
        });
      }, { threshold: 0.4 });
      shareIO.observe(shareCard);
    }
  }

  /* ---------- copy to clipboard (real success/failure, mobile Safari fallback) ---------- */

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(
        function () { return true; },
        function () { return execCommandCopy(text); }
      );
    }
    return Promise.resolve(execCommandCopy(text));
  }

  function execCommandCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      var range = document.createRange();
      range.selectNodeContents(ta);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      ta.setSelectionRange(0, text.length);
      var ok = document.execCommand("copy");
      sel.removeAllRanges();
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-text") || "";
      var original = btn.textContent;
      copyText(text).then(function (ok) {
        btn.classList.add(ok ? "copied" : "copy-failed");
        btn.textContent = ok ? "Copied" : "Press ⌘/Ctrl+C";
        setTimeout(function () {
          btn.classList.remove("copied", "copy-failed");
          btn.textContent = original;
        }, 1600);
      });
    });
  });

  /* ---------- What to Send: mode switcher ----------
     One implementation shared by every ".mode-switcher" instance on the
     page (the cinematic mini panel AND the full standalone section) so
     there is exactly one place this logic can break. Each instance keeps
     its own state (active button + displayed reply) entirely in its own
     DOM subtree — nothing outside a switcher's own click handlers ever
     touches its .mode-btn/.mode-reply-text, so unrelated re-renders
     (chapter changes, resize, IntersectionObserver) can never reset it. */

  document.querySelectorAll(".mode-switcher").forEach(function (switcher) {
    var buttons = switcher.querySelectorAll(".mode-btn");
    var replyText = switcher.querySelector(".mode-reply-text");
    var copyBtn = switcher.querySelector(".mode-copy-btn");
    if (!buttons.length || !replyText) return;

    function selectMode(btn) {
      var next = replyText.getAttribute("data-reply-" + btn.getAttribute("data-mode"));
      if (next == null) return;

      buttons.forEach(function (b) {
        var isActive = b === btn;
        b.classList.toggle("active", isActive);
        b.setAttribute("aria-pressed", String(isActive));
      });

      function swapIn() {
        replyText.textContent = next;
        if (reduceMotion) return;
        requestAnimationFrame(function () { replyText.classList.remove("swap"); });
      }
      if (reduceMotion) {
        swapIn();
      } else {
        replyText.classList.add("swap");
        setTimeout(swapIn, 220);
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.classList.contains("active")) return;
        selectMode(btn);
      });
    });

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var text = replyText.textContent.trim();
        var original = copyBtn.textContent;
        copyText(text).then(function (ok) {
          copyBtn.classList.add(ok ? "copied" : "copy-failed");
          copyBtn.textContent = ok ? "Copied" : "Press ⌘/Ctrl+C";
          setTimeout(function () {
            copyBtn.classList.remove("copied", "copy-failed");
            copyBtn.textContent = original;
          }, 1600);
        });
      });
    }
  });

  /* ---------- FAQ accordion ---------- */

  document.querySelectorAll(".acc-btn").forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      panel.style.maxHeight = open ? "0px" : panel.scrollHeight + "px";
    });
  });
  onRealResize(function () {
    document.querySelectorAll('.acc-btn[aria-expanded="true"]').forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      panel.style.maxHeight = panel.scrollHeight + "px";
    });
  });
})();
