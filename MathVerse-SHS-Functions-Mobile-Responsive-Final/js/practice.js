/* ==========================================================================
   MATHVERSE — practice.js
   Handles practice.html: hint/solution toggles (shared via main? no —
   handled generically in this file), answer checking, immediate feedback.
   ========================================================================== */
(function(){
  "use strict";

  /* Generic hint / solution show-hide (practice page uses same pattern as lesson) */
  document.querySelectorAll("[data-toggle-target]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var target = document.getElementById(btn.getAttribute("data-toggle-target"));
      if(!target) return;
      target.classList.toggle("show");
    });
  });

  function normalize(str){
    return str
      .toLowerCase()
      .replace(/\s+/g,"")
      .replace(/gh₵|ghc|gh¢|₵/g,"")
      .replace(/×/g,"*");
  }

  /* Checker for radio/select style questions (data-correct attr on the form) */
  function checkChoice(formId, correctValue, feedbackId){
    var form = document.getElementById(formId);
    if(!form) return;
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var selected = form.querySelector('input[type="radio"]:checked');
      var fb = document.getElementById(feedbackId);
      if(!selected){
        if(fb){ fb.textContent = "Please choose an option first."; fb.className = "feedback-msg show incorrect"; }
        return;
      }
      var isCorrect = selected.value === correctValue;
      form.querySelectorAll("label").forEach(function(l){ l.classList.remove("correct-ans","wrong-ans"); });
      form.querySelectorAll('input[type="radio"]').forEach(function(input){
        var label = input.closest("label");
        if(input.value === correctValue) label.classList.add("correct-ans");
        else if(input.checked) label.classList.add("wrong-ans");
      });
      if(fb){
        fb.textContent = isCorrect ? "Correct! Well done." : "Not quite — check the worked solution below.";
        fb.className = "feedback-msg show " + (isCorrect ? "correct" : "incorrect");
      }
    });
  }

  /* Checker for typed text-answer questions (accepts a few equivalent formats) */
  function checkText(formId, acceptableAnswers, feedbackId){
    var form = document.getElementById(formId);
    if(!form) return;
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var input = form.querySelector(".short-answer");
      var fb = document.getElementById(feedbackId);
      var given = normalize(input.value || "");
      var isCorrect = acceptableAnswers.some(function(ans){ return normalize(ans) === given; });
      if(fb){
        fb.textContent = isCorrect
          ? "Correct! Well done."
          : "Not quite. Compare your working with the worked solution below, then try again.";
        fb.className = "feedback-msg show " + (isCorrect ? "correct" : "incorrect");
      }
    });
  }

  checkChoice("practiceQ1Form", "linear", "practiceQ1Feedback");
  checkChoice("practiceQ2Form", "nonlinear", "practiceQ2Feedback");
  checkText("practiceQ3Form", ["13", "f(5)=13"], "practiceQ3Feedback");
  checkText("practiceQ4Form", ["x=3", "3"], "practiceQ4Feedback");
  checkText("practiceQ5Form", ["x=4,y=3", "(4,3)", "x=4y=3", "4,3"], "practiceQ5Feedback");
  checkText("practiceQ6Form", ["c=5x+10", "c=5x + 10"], "practiceQ6Feedback");

})();
