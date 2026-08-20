/* MUSTEX marketing site — small vanilla JS, no dependencies. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var supportsIO = "IntersectionObserver" in window;

  /* ---------- nav: scrolled state + mobile menu ---------- */

  var nav = document.getElementById("nav");
  var navToggle = document.getElementById("navToggle");
  var navMenu = document.getElementById("navMenu");

  function onScroll() {
    if (window.scrollY > 12) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
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

  /* ---------- reveal on scroll ---------- */

  var revealEls = document.querySelectorAll("[data-reveal]");
  if (reduceMotion || !supportsIO) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  }

  /* ---------- how it works: sticky phone state ---------- */

  var howPhone = document.getElementById("howPhone");
  var stepTriggers = document.querySelectorAll("[data-step-trigger]");
  if (howPhone && stepTriggers.length && supportsIO) {
    var stepIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var n = entry.target.getAttribute("data-step-trigger");
          howPhone.setAttribute("data-step", n);
          stepTriggers.forEach(function (s) {
            s.classList.toggle("active", s === entry.target);
          });
        }
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    stepTriggers.forEach(function (s) { stepIO.observe(s); });
  } else {
    // No IO: show the final result state and mark all steps.
    if (howPhone) howPhone.setAttribute("data-step", "3");
    stepTriggers.forEach(function (s) { s.classList.add("active"); });
  }

  /* ---------- evidence: annotations highlight bubbles ---------- */

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
    annotations.forEach(function (a) {
      a.classList.toggle("active", a === el);
    });
  }

  if (annotations.length && supportsIO && !reduceMotion) {
    var evIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) applyAnnotation(entry.target);
      });
    }, { rootMargin: "-40% 0px -40% 0px", threshold: 0 });
    annotations.forEach(function (a) { evIO.observe(a); });
  } else {
    // Static fallback: show all annotation cards, highlight the first target.
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
            shareIO.disconnect();
          }
        });
      }, { threshold: 0.4 });
      shareIO.observe(shareCard);
    }
  }

  /* ---------- copy buttons ---------- */

  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.closest(".reply").querySelector("p").textContent.replace(/^"|"$/g, "");
      function done() {
        btn.classList.add("copied");
        btn.textContent = "Copied";
        setTimeout(function () {
          btn.classList.remove("copied");
          btn.textContent = "Copy";
        }, 1600);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        done();
      }
    });
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
  // Keep open panels correct if the viewport resizes.
  window.addEventListener("resize", function () {
    document.querySelectorAll('.acc-btn[aria-expanded="true"]').forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      panel.style.maxHeight = panel.scrollHeight + "px";
    });
  });
})();
