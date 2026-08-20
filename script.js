/* MUSTEX marketing site — small vanilla JS, no dependencies. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var supportsIO = "IntersectionObserver" in window;

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

  /* ---------- cinematic: one phone, six chapters ---------- */

  var cineStage = document.getElementById("cineStage");
  var cineChapters = document.querySelectorAll("[data-chapter-trigger]");
  var cineNum = document.getElementById("cineNum");
  var cineLabel = document.getElementById("cineLabel");
  var cpVerdict = document.getElementById("cpVerdict");
  var verdictCounted = false;

  var CHAPTER_NAMES = {
    1: "The Chat",
    2: "Analysis",
    3: "Signals",
    4: "The Read",
    5: "What to Send",
    6: "Share"
  };
  var SIG_MARK = { ask: "marked", vague: "marked-bad", deflect: "marked-bad" };
  var CINE_MARKS = ["marked", "marked-good", "marked-bad"];

  function setCineChapter(n) {
    if (!cineStage) return;
    cineStage.setAttribute("data-chapter", n);
    if (cineNum) cineNum.textContent = n < 10 ? "0" + n : String(n);
    if (cineLabel) cineLabel.textContent = CHAPTER_NAMES[n] || "";

    cineChapters.forEach(function (c) {
      c.classList.toggle("active", c.getAttribute("data-chapter-trigger") === String(n));
    });

    document.querySelectorAll("#cpChat .bubble[data-sig]").forEach(function (b) {
      var mark = SIG_MARK[b.getAttribute("data-sig")];
      CINE_MARKS.forEach(function (m) { b.classList.remove(m); });
      if (n === 3 && mark) b.classList.add(mark);
    });

    var chatLayer = document.getElementById("cpChat");
    var sendLayer = document.getElementById("cpSend");
    var shareLayer = document.getElementById("cpShare");
    if (chatLayer) chatLayer.classList.toggle("active", n <= 3);
    if (cpVerdict) cpVerdict.classList.toggle("active", n === 4);
    if (sendLayer) sendLayer.classList.toggle("active", n === 5);
    if (shareLayer) shareLayer.classList.toggle("active", n === 6);

    if (n === 4 && !verdictCounted && !reduceMotion) {
      verdictCounted = true;
      var s = cpVerdict && cpVerdict.querySelector("[data-count]");
      if (s) countUp(s);
    }
  }

  if (cineStage && cineChapters.length && supportsIO) {
    var cineIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setCineChapter(parseInt(entry.target.getAttribute("data-chapter-trigger"), 10));
        }
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    cineChapters.forEach(function (c) { cineIO.observe(c); });
  } else if (cineStage) {
    setCineChapter(6);
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

  document.querySelectorAll("[data-copy-live]").forEach(function (btn) {
    var target = document.getElementById(btn.getAttribute("data-copy-live"));
    if (!target) return;
    btn.addEventListener("click", function () {
      var text = target.textContent.trim();
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

  /* ---------- What to Send: mode switcher ---------- */

  var sendModes = document.querySelectorAll(".send-mode");
  var sendReplyText = document.getElementById("sendReplyText");
  if (sendModes.length && sendReplyText) {
    sendModes.forEach(function (mode) {
      mode.addEventListener("click", function () {
        if (mode.classList.contains("active")) return;
        var next = sendReplyText.getAttribute("data-reply-" + mode.getAttribute("data-mode"));
        if (!next) return;

        sendModes.forEach(function (m) {
          m.classList.toggle("active", m === mode);
          m.setAttribute("aria-pressed", String(m === mode));
        });

        function swapIn() {
          sendReplyText.textContent = next;
          if (reduceMotion) return;
          requestAnimationFrame(function () { sendReplyText.classList.remove("swap"); });
        }
        if (reduceMotion) {
          swapIn();
        } else {
          sendReplyText.classList.add("swap");
          setTimeout(swapIn, 220);
        }
      });
    });
  }

  /* ---------- FAQ accordion ---------- */

  document.querySelectorAll(".acc-btn").forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      panel.style.maxHeight = open ? "0px" : panel.scrollHeight + "px";
    });
  });
  window.addEventListener("resize", function () {
    document.querySelectorAll('.acc-btn[aria-expanded="true"]').forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      panel.style.maxHeight = panel.scrollHeight + "px";
    });
  });
})();
