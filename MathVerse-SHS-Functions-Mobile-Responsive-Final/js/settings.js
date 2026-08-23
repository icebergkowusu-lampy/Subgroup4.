/* ==========================================================================
   MATHVERSE — settings.js
   Settings page controls. Reads/writes the same localStorage keys that
   main.js (header controls) uses, so both stay in sync.
   ========================================================================== */
(function(){
  "use strict";

  /* ---------- Dark mode ---------- */
  var darkToggle = document.getElementById("settingsDarkToggle");
  function syncDarkButton(){
    var on = document.body.classList.contains("dark-mode");
    if(darkToggle){
      darkToggle.textContent = on ? "On" : "Off";
      darkToggle.setAttribute("aria-pressed", on ? "true" : "false");
      darkToggle.classList.toggle("active-toggle", on);
    }
  }
  if(darkToggle){
    syncDarkButton();
    darkToggle.addEventListener("click", function(){
      var on = !document.body.classList.contains("dark-mode");
      document.body.classList.toggle("dark-mode", on);
      localStorage.setItem("mv-dark", on ? "1" : "0");
      syncDarkButton();
    });
  }

  /* ---------- Eye comfort ---------- */
  var eyeToggle = document.getElementById("settingsEyeToggle");
  function syncEyeButton(){
    var on = document.body.classList.contains("eye-comfort");
    if(eyeToggle){
      eyeToggle.textContent = on ? "On" : "Off";
      eyeToggle.setAttribute("aria-pressed", on ? "true" : "false");
      eyeToggle.classList.toggle("active-toggle", on);
    }
  }
  if(eyeToggle){
    syncEyeButton();
    eyeToggle.addEventListener("click", function(){
      var on = !document.body.classList.contains("eye-comfort");
      document.body.classList.toggle("eye-comfort", on);
      localStorage.setItem("mv-eye", on ? "1" : "0");
      syncEyeButton();
    });
  }

  /* ---------- Font size slider (percent, mapped to the same --lesson-font-scale) ---------- */
  var fontSlider = document.getElementById("settingsFontSlider");
  var fontValueEl = document.getElementById("settingsFontValue");
  function currentScalePercent(){
    var scale = parseFloat(localStorage.getItem("mv-font-scale")) || 1;
    return Math.round(scale * 100);
  }
  function applyScalePercent(percent){
    var scale = percent / 100;
    document.documentElement.style.setProperty("--lesson-font-scale", scale.toFixed(2));
    localStorage.setItem("mv-font-scale", scale.toFixed(2));
    if(fontValueEl) fontValueEl.textContent = percent + "%";
    if(fontSlider) fontSlider.value = percent;
  }
  if(fontSlider){
    applyScalePercent(currentScalePercent());
    fontSlider.addEventListener("input", function(){
      applyScalePercent(parseInt(fontSlider.value, 10));
    });
    var minusBtn = document.getElementById("settingsFontMinus");
    var plusBtn = document.getElementById("settingsFontPlus");
    if(minusBtn) minusBtn.addEventListener("click", function(){
      applyScalePercent(Math.max(85, currentScalePercent() - 5));
    });
    if(plusBtn) plusBtn.addEventListener("click", function(){
      applyScalePercent(Math.min(130, currentScalePercent() + 5));
    });
  }

  /* ---------- Saved progress summary ---------- */
  var summaryEl = document.getElementById("progressSummary");
  function renderSummary(){
    if(!summaryEl) return;
    var items = [];

    try{
      var success = JSON.parse(localStorage.getItem("mv-success-criteria") || "{}");
      var checked = Object.values(success).filter(Boolean).length;
      items.push('<span class="pill">Success criteria ticked: ' + checked + '</span>');
    }catch(e){}

    try{
      var assessment = JSON.parse(localStorage.getItem("mv-assessment-result") || "null");
      items.push('<span class="pill">Last assessment score: ' + (assessment ? (assessment.score + "/" + assessment.total + " (" + assessment.percent + "%)") : "not attempted") + '</span>');
    }catch(e){}

    summaryEl.innerHTML = items.join("");
  }
  renderSummary();

  /* ---------- Clear saved progress ---------- */
  var clearBtn = document.getElementById("clearProgressBtn");
  var statusEl = document.getElementById("settingsStatus");
  if(clearBtn){
    clearBtn.addEventListener("click", function(){
      localStorage.removeItem("mv-success-criteria");
      localStorage.removeItem("mv-assessment-result");
      renderSummary();
      if(statusEl){
        statusEl.textContent = "Saved progress cleared. Success criteria and assessment results have been reset.";
        statusEl.className = "feedback-msg show correct";
      }
    });
  }

  /* ---------- Reset display settings ---------- */
  var resetBtn = document.getElementById("resetDisplayBtn");
  if(resetBtn){
    resetBtn.addEventListener("click", function(){
      document.body.classList.remove("dark-mode","eye-comfort");
      localStorage.setItem("mv-dark","0");
      localStorage.setItem("mv-eye","0");
      applyScalePercent(100);
      syncDarkButton();
      syncEyeButton();
      if(statusEl){
        statusEl.textContent = "Display settings reset to default.";
        statusEl.className = "feedback-msg show correct";
      }
    });
  }

})();
