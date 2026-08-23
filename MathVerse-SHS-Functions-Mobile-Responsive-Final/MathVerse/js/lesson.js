/* ==========================================================================
   MATHVERSE — lesson.js
   Behaviour specific to lesson.html: search filter, success criteria,
   hint/solution toggles, custom canvas graphs, activity checking,
   exit question, learner reflection.
   ========================================================================== */
(function(){
  "use strict";

  /* ---------- Search filter across lesson sections ---------- */
  var searchInput = document.getElementById("lessonSearch");
  var sections = Array.prototype.slice.call(document.querySelectorAll(".section[data-searchable]"));
  var noResultsMsg = document.getElementById("noSearchResults");

  function runSearch(){
    var q = (searchInput.value || "").trim().toLowerCase();
    var visibleCount = 0;
    sections.forEach(function(sec){
      if(q === ""){
        sec.classList.remove("hidden");
        visibleCount++;
        return;
      }
      var text = sec.textContent.toLowerCase();
      var match = text.indexOf(q) !== -1;
      sec.classList.toggle("hidden", !match);
      if(match){
        visibleCount++;
        // Force-reveal: a search match may sit below the fold and never have
        // scrolled into view yet, which would leave it at opacity 0 from the
        // scroll-reveal animation. Search results must always be visible.
        sec.classList.add("in-view");
      }
    });
    if(noResultsMsg) noResultsMsg.classList.toggle("hidden", visibleCount !== 0 || q === "");
  }
  if(searchInput){
    searchInput.addEventListener("input", runSearch);
  }

  /* Pre-fill and run the search if arriving via ?q= from another page's header search */
  try{
    var urlParams = new URLSearchParams(window.location.search);
    var incomingQuery = urlParams.get("q");
    if(incomingQuery && searchInput){
      searchInput.value = incomingQuery;
      runSearch();
      searchInput.scrollIntoView({ behavior:"smooth", block:"start" });
    }
  }catch(e){ /* URLSearchParams unsupported — ignore */ }

  /* ---------- Hint / Solution toggles (generic, works on any page) ---------- */
  document.querySelectorAll("[data-toggle-target]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var target = document.getElementById(btn.getAttribute("data-toggle-target"));
      if(!target) return;
      var showing = target.classList.toggle("show");
      btn.setAttribute("aria-expanded", showing ? "true" : "false");
      if(btn.dataset.labelShown && btn.dataset.labelHidden){
        btn.textContent = showing ? btn.dataset.labelShown : btn.dataset.labelHidden;
      }
    });
  });

  /* ---------- Success criteria checkboxes (localStorage) ---------- */
  var successBoxes = document.querySelectorAll(".success-check");
  var STORAGE_KEY_SUCCESS = "mv-success-criteria";
  function loadSuccess(){
    try{
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY_SUCCESS) || "{}");
      successBoxes.forEach(function(box){
        if(saved[box.id]){
          box.checked = true;
          box.closest(".check-item").classList.add("done");
        }
      });
    }catch(e){ /* ignore */ }
  }
  function saveSuccess(){
    var state = {};
    successBoxes.forEach(function(box){ state[box.id] = box.checked; });
    localStorage.setItem(STORAGE_KEY_SUCCESS, JSON.stringify(state));
  }
  successBoxes.forEach(function(box){
    box.addEventListener("change", function(){
      box.closest(".check-item").classList.toggle("done", box.checked);
      saveSuccess();
    });
  });
  loadSuccess();

  /* ==========================================================================
     CANVAS GRAPH 1 — y = mx + 1, gradient slider
     ========================================================================== */
  var graphCanvas = document.getElementById("gradientGraph");
  var gradientSlider = document.getElementById("gradientSlider");
  var gradientValueEl = document.getElementById("gradientValue");
  var gradientEqEl = document.getElementById("gradientEquation");

  function drawAxes(ctx, w, h, scale, originYFraction){
    ctx.clearRect(0,0,w,h);
    var cx = w/2, cy = h * (typeof originYFraction === "number" ? originYFraction : 0.5);
    ctx.strokeStyle = "rgba(120,120,160,0.25)";
    ctx.lineWidth = 1;
    for(var gx = cx % scale; gx < w; gx += scale){
      ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,h); ctx.stroke();
    }
    for(var gy = cy % scale; gy < h; gy += scale){
      ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(w,gy); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(80,70,150,0.75)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0,cy); ctx.lineTo(w,cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,0); ctx.lineTo(cx,h); ctx.stroke();
    return { cx: cx, cy: cy };
  }

  function drawLine(ctx, cx, cy, scale, m, c, color, progress){
    var p = (typeof progress === "number") ? Math.max(0, Math.min(1, progress)) : 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    var xStartUnits = -cx/scale, xEndUnits = (ctx.canvas.width-cx)/scale;
    // grow the line outward from the y-axis (x=0) in both directions as p goes 0 -> 1
    var xStart = xStartUnits * p, xEnd = xEndUnits * p;
    var y1 = m*xStart + c, y2 = m*xEnd + c;
    ctx.moveTo(cx + xStart*scale, cy - y1*scale);
    ctx.lineTo(cx + xEnd*scale, cy - y2*scale);
    ctx.stroke();
  }

  function renderGradientGraph(mOverride){
    if(!graphCanvas) return;
    var ctx = graphCanvas.getContext("2d");
    var w = graphCanvas.width, h = graphCanvas.height;
    var scale = 26;
    var m = (typeof mOverride === "number") ? mOverride : parseFloat(gradientSlider.value);
    var axes = drawAxes(ctx, w, h, scale);
    drawLine(ctx, axes.cx, axes.cy, scale, m, 1, "#4F46E5");
    if(gradientValueEl) gradientValueEl.textContent = Math.round(m);
    if(gradientEqEl) gradientEqEl.textContent = "y = " + (Math.round(m*10)/10) + "x + 1";
  }

  var prefersReducedMotionLesson = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Smoothly tween the gradient line from its old value to the new slider value */
  var gradientCurrentM = gradientSlider ? parseFloat(gradientSlider.value) : 1;
  var gradientAnimFrame = null;
  function tweenGradientTo(target){
    if(prefersReducedMotionLesson){ gradientCurrentM = target; renderGradientGraph(target); return; }
    if(gradientAnimFrame) cancelAnimationFrame(gradientAnimFrame);
    var from = gradientCurrentM, to = target, start = performance.now(), duration = 260;
    function step(now){
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 2);
      var value = from + (to - from) * eased;
      renderGradientGraph(value);
      if(t < 1){
        gradientAnimFrame = requestAnimationFrame(step);
      }else{
        gradientCurrentM = to;
        gradientAnimFrame = null;
      }
    }
    gradientAnimFrame = requestAnimationFrame(step);
  }

  function sizeCanvasToContainer(canvas){
    if(!canvas) return;
    var parentWidth = canvas.parentElement.clientWidth;
    var targetWidth = Math.min(520, Math.max(260, parentWidth - 24));
    canvas.width = targetWidth;
    canvas.height = Math.round(targetWidth * 0.62);
  }

  if(graphCanvas){
    sizeCanvasToContainer(graphCanvas);
    renderGradientGraph();
    gradientSlider.addEventListener("input", function(){
      tweenGradientTo(parseFloat(gradientSlider.value));
    });
    window.addEventListener("resize", function(){
      sizeCanvasToContainer(graphCanvas);
      renderGradientGraph(gradientCurrentM);
    });
  }

  /* ==========================================================================
     CANVAS GRAPH 2 — simultaneous equations y = 2x+1 and y = x+4
     ========================================================================== */
  var simCanvas = document.getElementById("simultaneousGraph");
  function renderSimGraph(progress){
    if(!simCanvas) return;
    var ctx = simCanvas.getContext("2d");
    var w = simCanvas.width, h = simCanvas.height;
    var scale = 20;
    var p = (typeof progress === "number") ? progress : 1;
    var axes = drawAxes(ctx, w, h, scale, 0.84);

    // draw each line growing outward from the y-axis, in step with progress
    drawLine(ctx, axes.cx, axes.cy, scale, 2, 1, "#06B6D4", p);
    drawLine(ctx, axes.cx, axes.cy, scale, 1, 4, "#F59E0B", p);

    // intersection of y=2x+1 and y=x+4 -> x=3, y=7
    var ix = 3, iy = 7;
    var px = axes.cx + ix*scale, py = axes.cy - iy*scale;
    var pointProgress = Math.max(0, Math.min(1, (p - 0.7) / 0.3));
    if(pointProgress > 0 && px >= 0 && px <= w && py >= 0 && py <= h){
      var r = 5 * (pointProgress < 1 ? Math.min(1.4, pointProgress * 1.6) : 1);
      ctx.fillStyle = "#EF4444";
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2); ctx.fill();
    }
  }
  function animateSimGraph(){
    if(prefersReducedMotionLesson){ renderSimGraph(1); return; }
    var start = performance.now(), duration = 750;
    function step(now){
      var t = Math.min(1, (now - start) / duration);
      renderSimGraph(t);
      if(t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var simToggleBtn = document.getElementById("simGraphToggle");
  var simLoopInterval = null;
  var simPaused = false;

  function startSimLoop(){
    if(simLoopInterval || prefersReducedMotionLesson) return;
    simLoopInterval = setInterval(function(){
      if(!simPaused) animateSimGraph();
    }, 3000);
  }
  function stopSimLoop(){
    if(simLoopInterval){ clearInterval(simLoopInterval); simLoopInterval = null; }
  }

  if(simToggleBtn){
    if(prefersReducedMotionLesson){
      simToggleBtn.closest("div").style.display = "none";
    }else{
      simToggleBtn.addEventListener("click", function(){
        simPaused = !simPaused;
        if(simPaused){
          stopSimLoop();
          renderSimGraph(1); // snap to the completed graph so it's not left mid-draw
          simToggleBtn.textContent = "\u25B6 Play animation";
          simToggleBtn.setAttribute("aria-pressed", "true");
        }else{
          animateSimGraph();
          startSimLoop();
          simToggleBtn.textContent = "\u23F8 Pause animation";
          simToggleBtn.setAttribute("aria-pressed", "false");
        }
      });
    }
  }

  if(simCanvas){
    sizeCanvasToContainer(simCanvas);
    var simObserver = ("IntersectionObserver" in window) ? new IntersectionObserver(function(entries, obs){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          animateSimGraph();
          startSimLoop();
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 }) : null;
    if(simObserver){ simObserver.observe(simCanvas); } else { renderSimGraph(1); }
    window.addEventListener("resize", function(){
      sizeCanvasToContainer(simCanvas);
      renderSimGraph(simPaused ? 1 : 1);
    });
  }

  /* ==========================================================================
     CURRICULUM ACTIVITY 1 — classification check
     ========================================================================== */
  var activity1Form = document.getElementById("activity1Form");
  var activity1Answers = { a1q1:"linear", a1q2:"nonlinear", a1q3:"linear", a1q4:"nonlinear" };
  var activity1Feedback = document.getElementById("activity1Feedback");
  if(activity1Form){
    activity1Form.addEventListener("submit", function(e){
      e.preventDefault();
      var correctCount = 0, total = 0;
      Object.keys(activity1Answers).forEach(function(name){
        total++;
        var selected = activity1Form.querySelector('input[name="' + name + '"]:checked');
        var row = document.getElementById(name + "-row");
        if(selected && selected.value === activity1Answers[name]){
          correctCount++;
          if(row) row.style.borderLeft = "4px solid #10B981";
        }else if(row){
          row.style.borderLeft = "4px solid #EF4444";
        }
      });
      if(activity1Feedback){
        activity1Feedback.textContent = "You classified " + correctCount + " out of " + total + " correctly. " +
          (correctCount === total ? "Excellent work — all correct!" : "Review the equations marked in red and check the degree of each term.");
        activity1Feedback.className = "feedback-msg show " + (correctCount === total ? "correct" : "incorrect");
      }
    });
  }

  /* ---------- Exit question (Assessment for Learning) ---------- */
  var exitForm = document.getElementById("exitQuestionForm");
  var exitFeedback = document.getElementById("exitQuestionFeedback");
  if(exitForm){
    exitForm.addEventListener("submit", function(e){
      e.preventDefault();
      var answer = document.getElementById("exitAnswer").value.trim();
      if(exitFeedback){
        if(answer.length < 5){
          exitFeedback.textContent = "Please write a fuller explanation — mention the degree of x in x² + y = 5.";
          exitFeedback.className = "feedback-msg show incorrect";
        }else{
          exitFeedback.textContent = "Thank you — recorded. Model answer: x² + y = 5 is non-linear because x is raised to the power 2, giving a curved graph rather than a straight line.";
          exitFeedback.className = "feedback-msg show correct";
        }
      }
    });
  }

  /* ==========================================================================
     LEARNER REFLECTION — submitted for real (POST to FormSubmit, which
     emails the team) — nothing is saved on this site. After FormSubmit
     redirects back here with ?sent=1, show a thank-you message instead
     of the form.
     ========================================================================== */
  var reflectionForm = document.getElementById("reflectionForm");
  var reflectionFormCard = document.getElementById("reflectionFormCard");
  var reflectionThanks = document.getElementById("reflectionThanks");
  var reflectionFields = ["reflect1","reflect2","reflect3"];
  var reflectionError = document.getElementById("reflectionFormError");

  try{
    var reflectionParams = new URLSearchParams(window.location.search);
    if(reflectionParams.get("sent") === "1"){
      if(reflectionFormCard) reflectionFormCard.classList.add("hidden");
      if(reflectionThanks){
        reflectionThanks.classList.remove("hidden");
        reflectionThanks.scrollIntoView({ behavior:"smooth", block:"center" });
      }
    }
  }catch(e){ /* URLSearchParams unsupported — form still works normally */ }

  if(reflectionForm){
    reflectionForm.addEventListener("submit", function(e){
      var hasContent = reflectionFields.some(function(id){
        var el = document.getElementById(id);
        return el && el.value.trim().length > 0;
      });
      if(!hasContent){
        e.preventDefault();
        if(reflectionError){
          reflectionError.textContent = "Please fill in at least one reflection question before sending.";
          reflectionError.className = "feedback-msg show incorrect";
        }
      }
    });
  }

})();
