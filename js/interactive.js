/* ==========================================================================
   MATHVERSE — interactive.js
   Custom canvas function grapher for interactive.html: f(x) = x^2 + c
   ========================================================================== */
(function(){
  "use strict";

  var canvas = document.getElementById("quadGraph");
  var slider = document.getElementById("quadSlider");
  var valueEl = document.getElementById("quadValue");
  var eqEl = document.getElementById("quadEquation");
  if(!canvas) return;

  function sizeCanvas(){
    var parentWidth = canvas.parentElement.clientWidth;
    var targetWidth = Math.min(520, Math.max(260, parentWidth - 24));
    canvas.width = targetWidth;
    canvas.height = Math.round(targetWidth * 0.62);
  }

  function drawGrid(ctx, w, h, scale){
    ctx.clearRect(0,0,w,h);
    var cx = w/2, cy = h * 0.72;
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

  function render(cOverride){
    var ctx = canvas.getContext("2d");
    var w = canvas.width, h = canvas.height;
    var scale = 26;
    var c = (typeof cOverride === "number") ? cOverride : parseInt(slider.value, 10);
    var axes = drawGrid(ctx, w, h, scale);

    ctx.strokeStyle = "#06B6D4";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    var first = true;
    for(var px = 0; px <= w; px += 2){
      var xUnits = (px - axes.cx) / scale;
      var yUnits = xUnits*xUnits + c;
      var py = axes.cy - yUnits*scale;
      if(py < -40 || py > h + 40){ first = true; continue; }
      if(first){ ctx.moveTo(px, py); first = false; } else { ctx.lineTo(px, py); }
    }
    ctx.stroke();

    if(valueEl) valueEl.textContent = Math.round(c);
    if(eqEl) eqEl.textContent = "f(x) = x\u00B2 + " + Math.round(c);
  }

  var prefersReducedMotionInteractive = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var quadCurrentC = parseInt(slider.value, 10);
  var quadAnimFrame = null;
  function tweenQuadTo(target){
    if(prefersReducedMotionInteractive){ quadCurrentC = target; render(target); return; }
    if(quadAnimFrame) cancelAnimationFrame(quadAnimFrame);
    var from = quadCurrentC, to = target, start = performance.now(), duration = 260;
    function step(now){
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 2);
      render(from + (to - from) * eased);
      if(t < 1){
        quadAnimFrame = requestAnimationFrame(step);
      }else{
        quadCurrentC = to;
        quadAnimFrame = null;
      }
    }
    quadAnimFrame = requestAnimationFrame(step);
  }

  sizeCanvas();
  render();
  slider.addEventListener("input", function(){
    tweenQuadTo(parseInt(slider.value, 10));
  });
  window.addEventListener("resize", function(){ sizeCanvas(); render(quadCurrentC); });

})();
