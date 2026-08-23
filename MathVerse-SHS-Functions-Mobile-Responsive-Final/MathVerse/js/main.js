/* ==========================================================================
   MATHVERSE — main.js
   Site-wide chrome: sidebar/hamburger, header controls, dark mode,
   eye comfort, font size, GMT clock, calendar modal, back-to-top.
   Loaded on every page.
   ========================================================================== */
(function(){
  "use strict";

  /* ---------- Site loader: only actually plays on the first page of a
     session (the inline script in <head> hides it instantly on every page
     after that, before this file even runs). Shows for ~2s then fades. ---------- */
  var siteLoader = document.getElementById("siteLoader");
  if(siteLoader && siteLoader.style.display !== "none"){
    var prefersReducedMotionLoader = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function hideSiteLoader(){
      siteLoader.classList.add("hide");
      document.body.classList.remove("is-loading");
      setTimeout(function(){
        if(siteLoader.parentNode) siteLoader.parentNode.removeChild(siteLoader);
      }, 550);
    }
    if(prefersReducedMotionLoader){
      hideSiteLoader();
    }else{
      setTimeout(hideSiteLoader, 2000);
    }
  }else if(siteLoader){
    document.body.classList.remove("is-loading");
  }

  /* ---------- Mobile sidebar / hamburger ---------- */
  var sidebar = document.getElementById("sidebar");
  var hamburger = document.getElementById("hamburgerBtn");
  var sidebarClose = document.getElementById("sidebarClose");
  var overlay = document.getElementById("sidebarOverlay");

  function openSidebar(){
    if(!sidebar) return;
    sidebar.classList.add("open");
    if(overlay) overlay.classList.add("show");
    if(hamburger) hamburger.setAttribute("aria-expanded","true");
  }
  function closeSidebar(){
    if(!sidebar) return;
    sidebar.classList.remove("open");
    if(overlay) overlay.classList.remove("show");
    if(hamburger) hamburger.setAttribute("aria-expanded","false");
  }
  if(hamburger){
    hamburger.addEventListener("click", function(){
      sidebar.classList.contains("open") ? closeSidebar() : openSidebar();
    });
  }
  if(sidebarClose) sidebarClose.addEventListener("click", closeSidebar);
  if(overlay) overlay.addEventListener("click", closeSidebar);
  document.addEventListener("keydown", function(e){
    if(e.key === "Escape") closeSidebar();
  });

  /* ---------- Dark mode ---------- */
  var darkBtn = document.getElementById("darkModeBtn");
  function applyDark(on){
    document.body.classList.toggle("dark-mode", on);
    if(darkBtn) darkBtn.classList.toggle("active-toggle", on);
    localStorage.setItem("mv-dark", on ? "1" : "0");
  }
  applyDark(localStorage.getItem("mv-dark") === "1");
  if(darkBtn){
    darkBtn.addEventListener("click", function(){
      applyDark(!document.body.classList.contains("dark-mode"));
    });
  }

  /* ---------- Eye comfort mode ---------- */
  var eyeBtn = document.getElementById("eyeComfortBtn");
  function applyEye(on){
    document.body.classList.toggle("eye-comfort", on);
    if(eyeBtn) eyeBtn.classList.toggle("active-toggle", on);
    localStorage.setItem("mv-eye", on ? "1" : "0");
  }
  applyEye(localStorage.getItem("mv-eye") === "1");
  if(eyeBtn){
    eyeBtn.addEventListener("click", function(){
      applyEye(!document.body.classList.contains("eye-comfort"));
    });
  }

  /* ---------- Font size (A- / A+) ---------- */
  var fontMinusBtn = document.getElementById("fontMinusBtn");
  var fontPlusBtn = document.getElementById("fontPlusBtn");
  var MIN_SCALE = 0.85, MAX_SCALE = 1.3, STEP = 0.05;
  function applyFontScale(scale){
    scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
    document.documentElement.style.setProperty("--lesson-font-scale", scale.toFixed(2));
    localStorage.setItem("mv-font-scale", scale.toFixed(2));
    return scale;
  }
  var storedScale = parseFloat(localStorage.getItem("mv-font-scale")) || 1;
  applyFontScale(storedScale);
  if(fontMinusBtn) fontMinusBtn.addEventListener("click", function(){
    storedScale = applyFontScale(storedScale - STEP);
  });
  if(fontPlusBtn) fontPlusBtn.addEventListener("click", function(){
    storedScale = applyFontScale(storedScale + STEP);
  });

  /* ---------- GMT clock ---------- */
  var clockEl = document.getElementById("gmtClock");
  function tickClock(){
    if(!clockEl) return;
    var now = new Date();
    var h = String(now.getUTCHours()).padStart(2,"0");
    var m = String(now.getUTCMinutes()).padStart(2,"0");
    var s = String(now.getUTCSeconds()).padStart(2,"0");
    clockEl.textContent = h + ":" + m + ":" + s + " GMT";
  }
  if(clockEl){ tickClock(); setInterval(tickClock, 1000); }

  /* ---------- Calendar modal ---------- */
  var calBtn = document.getElementById("calendarBtn");
  var calModal = document.getElementById("calendarModal");
  var calClose = document.getElementById("calendarClose");
  var calDateEl = document.getElementById("calendarDate");
  var calDayEl = document.getElementById("calendarDay");

  function openCalendar(){
    if(!calModal) return;
    var now = new Date();
    var opts = { weekday:"long", year:"numeric", month:"long", day:"numeric" };
    if(calDateEl) calDateEl.textContent = now.toLocaleDateString(undefined, opts);
    if(calDayEl) calDayEl.textContent = "Today";
    calModal.classList.add("show");
  }
  function closeCalendar(){ if(calModal) calModal.classList.remove("show"); }
  if(calBtn) calBtn.addEventListener("click", openCalendar);
  if(calClose) calClose.addEventListener("click", closeCalendar);
  if(calModal){
    calModal.addEventListener("click", function(e){
      if(e.target === calModal) closeCalendar();
    });
  }
  document.addEventListener("keydown", function(e){
    if(e.key === "Escape") closeCalendar();
  });

  /* ---------- Back to top ---------- */
  var backBtn = document.getElementById("backToTop");
  if(backBtn){
    window.addEventListener("scroll", function(){
      backBtn.classList.toggle("show", window.scrollY > 420);
    });
    backBtn.addEventListener("click", function(){
      window.scrollTo({ top:0, behavior:"smooth" });
    });
  }

  /* ---------- Scroll-reveal animation for sections/cards ---------- */
  var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealTargets = document.querySelectorAll(".page-content > section:not(.hero)");
  if(!prefersReducedMotion && revealTargets.length && "IntersectionObserver" in window){
    revealTargets.forEach(function(el){ el.classList.add("reveal"); });
    var revealObserver = new IntersectionObserver(function(entries, obs){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add("in-view");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealTargets.forEach(function(el){ revealObserver.observe(el); });
  }

  /* ---------- Animated stat counters (elements with data-count-to) ---------- */
  var counters = document.querySelectorAll("[data-count-to]");
  function animateCounter(el){
    var target = parseInt(el.getAttribute("data-count-to"), 10) || 0;
    if(prefersReducedMotion){ el.textContent = target; return; }
    var start = performance.now();
    var duration = 900;
    function step(now){
      var progress = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if(progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if(counters.length){
    if("IntersectionObserver" in window){
      var counterObserver = new IntersectionObserver(function(entries, obs){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            animateCounter(entry.target);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      counters.forEach(function(el){ counterObserver.observe(el); });
    }else{
      counters.forEach(animateCounter);
    }
  }

  /* ---------- Header search on non-Lesson pages: redirect to Lessons ---------- */
  var headerSearch = document.getElementById("lessonSearch");
  var onLessonPage = /(^|\/)lesson\.html$/.test(window.location.pathname);
  if(headerSearch && !onLessonPage){
    headerSearch.setAttribute("placeholder", "Search lessons\u2026 (press Enter)");
    headerSearch.addEventListener("keydown", function(e){
      if(e.key === "Enter"){
        var q = headerSearch.value.trim();
        window.location.href = "lesson.html" + (q ? ("?q=" + encodeURIComponent(q)) : "");
      }
    });
  }

})();
