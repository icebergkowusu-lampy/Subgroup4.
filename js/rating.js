/* ==========================================================================
   MATHVERSE — rating.js
   Star rating widget on the dedicated Rating page. The rating and comment
   are submitted for real (POST to FormSubmit, which emails the team) — no
   local storage involved, nothing is saved on this site. After FormSubmit
   redirects back here with ?sent=1, we show a thank-you message instead
   of the form.
   ========================================================================== */
(function(){
  "use strict";

  var starRow = document.getElementById("starRating");
  var form = document.getElementById("ratingForm");
  var formCard = document.getElementById("ratingFormCard");
  var thanks = document.getElementById("ratingThanks");

  // Handle the post-submit redirect first: if we're back with ?sent=1,
  // just show the thank-you card and skip wiring up the form at all.
  try{
    var params = new URLSearchParams(window.location.search);
    if(params.get("sent") === "1"){
      if(formCard) formCard.classList.add("hidden");
      if(thanks) thanks.classList.remove("hidden");
      if(thanks) thanks.scrollIntoView({ behavior:"smooth", block:"center" });
      return;
    }
  }catch(e){ /* URLSearchParams unsupported — fall through to normal form */ }

  if(!starRow || !form) return;

  var stars = Array.prototype.slice.call(starRow.querySelectorAll(".star"));
  var statusEl = document.getElementById("ratingStatus");
  var hiddenInput = document.getElementById("ratingValue");
  var errorEl = document.getElementById("ratingFormError");
  var currentRating = 0;

  function paintStars(upTo, mode){
    stars.forEach(function(star){
      var value = parseInt(star.getAttribute("data-value"), 10);
      star.classList.remove("filled", "preview");
      if(value <= upTo) star.classList.add(mode === "preview" ? "preview" : "filled");
      star.setAttribute("aria-checked", (mode !== "preview" && value === currentRating) ? "true" : "false");
    });
  }

  function statusFor(rating){
    var labels = { 1:"Poor", 2:"Fair", 3:"Good", 4:"Very good", 5:"Excellent" };
    return "Your rating: " + rating + " / 5 (" + labels[rating] + ")";
  }

  stars.forEach(function(star){
    var value = parseInt(star.getAttribute("data-value"), 10);

    star.addEventListener("mouseenter", function(){ paintStars(value, "preview"); });
    star.addEventListener("mouseleave", function(){ paintStars(currentRating, "filled"); });
    star.addEventListener("focus", function(){ paintStars(value, "preview"); });
    star.addEventListener("blur", function(){ paintStars(currentRating, "filled"); });

    star.addEventListener("click", function(){
      currentRating = value;
      paintStars(currentRating, "filled");
      star.classList.add("pop");
      setTimeout(function(){ star.classList.remove("pop"); }, 340);
      if(statusEl) statusEl.textContent = statusFor(currentRating);
      if(hiddenInput) hiddenInput.value = String(currentRating);
      if(errorEl) errorEl.classList.remove("show");
    });

    star.addEventListener("keydown", function(e){
      var idx = stars.indexOf(star);
      if(e.key === "ArrowRight" && idx < stars.length - 1){
        e.preventDefault();
        stars[idx + 1].focus();
      }else if(e.key === "ArrowLeft" && idx > 0){
        e.preventDefault();
        stars[idx - 1].focus();
      }
    });
  });

  form.addEventListener("submit", function(e){
    if(currentRating === 0){
      e.preventDefault();
      if(errorEl){
        errorEl.textContent = "Please tap a star to choose a rating before sending.";
        errorEl.className = "feedback-msg show incorrect";
      }
    }
    // Otherwise let the form submit normally to FormSubmit — no fetch/AJAX,
    // so it works reliably even when the site is opened as a local file.
  });

})();
