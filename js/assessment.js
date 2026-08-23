/* ==========================================================================
   MATHVERSE — assessment.js
   Assessment of Learning: exactly 10 questions, auto-marked, scored,
   with try again + downloadable summary + localStorage persistence.
   ========================================================================== */
(function(){
  "use strict";

  var form = document.getElementById("assessmentForm");
  if(!form) return;

  var TOTAL_QUESTIONS = 10;
  var STORAGE_KEY = "mv-assessment-result";

  var ANSWER_KEY = {
    q1: { type:"mcq", correct:"B" },
    q2: { type:"mcq", correct:"B" },
    q3: { type:"text", correct:["11","f(4)=11"] },
    q4: { type:"mcq", correct:"B" },
    q5: { type:"mcq", correct:"B" },
    q6: { type:"text", correct:["x=3","3"] },
    q7: { type:"text", correct:["x=4,y=3","(4,3)","x=4y=3","4,3"] },
    q8: { type:"mcq", correct:"true" },
    q9: { type:"mcq", correct:"B" },
    q10:{ type:"text", correct:["c=5x+10","c=5x + 10"] }
  };

  var submitBtn = document.getElementById("assessmentSubmitBtn");
  var scorePanel = document.getElementById("scorePanel");
  var scoreValueEl = document.getElementById("scoreValue");
  var scorePercentEl = document.getElementById("scorePercent");
  var scoreSummaryEl = document.getElementById("scoreSummary");
  var tryAgainBtn = document.getElementById("tryAgainBtn");
  var downloadBtn = document.getElementById("downloadSummaryBtn");
  var blockMsg = document.getElementById("assessmentBlockMsg");

  function normalize(str){
    return String(str).toLowerCase().replace(/\s+/g,"");
  }

  function allAnswered(){
    for(var i=1;i<=TOTAL_QUESTIONS;i++){
      var name = "q"+i;
      var key = ANSWER_KEY[name];
      if(key.type === "mcq"){
        if(!form.querySelector('input[name="'+name+'"]:checked')) return false;
      }else{
        var input = form.querySelector('[data-qname="'+name+'"]');
        if(!input || !input.value.trim()) return false;
      }
    }
    return true;
  }

  function updateSubmitState(){
    var ready = allAnswered();
    submitBtn.disabled = !ready;
    if(blockMsg) blockMsg.classList.toggle("hidden", ready);
  }
  form.addEventListener("change", updateSubmitState);
  form.addEventListener("input", updateSubmitState);
  updateSubmitState();

  function markQuestion(name, key){
    var result = { name:name, correct:false };
    if(key.type === "mcq"){
      var selected = form.querySelector('input[name="'+name+'"]:checked');
      result.given = selected ? selected.value : "";
      result.correct = selected && normalize(selected.value) === normalize(key.correct);
      form.querySelectorAll('input[name="'+name+'"]').forEach(function(input){
        var label = input.closest("label");
        label.classList.remove("correct-ans","wrong-ans");
        if(normalize(input.value) === normalize(key.correct)) label.classList.add("correct-ans");
        else if(input.checked) label.classList.add("wrong-ans");
      });
    }else{
      var field = form.querySelector('[data-qname="'+name+'"]');
      result.given = field ? field.value.trim() : "";
      result.correct = key.correct.some(function(ans){ return normalize(ans) === normalize(result.given); });
      var fb = document.getElementById(name+"-textfb");
      if(fb){
        fb.textContent = result.correct ? "Correct." : "Incorrect — correct answer: " + key.correct[0];
        fb.className = "feedback-msg show " + (result.correct ? "correct" : "incorrect");
      }
    }
    return result;
  }

  function renderSummary(results, score, learnerName){
    var lines = ["MathVerse — Assessment of Learning Summary", ""];
    lines.push("Learner: " + (learnerName || "Not provided"));
    lines.push("Date: " + new Date().toLocaleString());
    lines.push("Score: " + score + " / " + TOTAL_QUESTIONS + " (" + Math.round((score/TOTAL_QUESTIONS)*100) + "%)");
    lines.push("");
    results.forEach(function(r, idx){
      lines.push((idx+1) + ". " + r.name.toUpperCase() + " — " + (r.correct ? "Correct" : "Incorrect") + (r.given ? " (your answer: " + r.given + ")" : ""));
    });
    return lines.join("\n");
  }

  form.addEventListener("submit", function(e){
    e.preventDefault();
    if(!allAnswered()){ updateSubmitState(); return; }

    var results = [];
    var score = 0;
    Object.keys(ANSWER_KEY).forEach(function(name){
      var r = markQuestion(name, ANSWER_KEY[name]);
      if(r.correct) score++;
      results.push(r);
    });

    var learnerName = (document.getElementById("learnerName") || {}).value || "";
    var percent = Math.round((score / TOTAL_QUESTIONS) * 100);

    if(scoreValueEl) scoreValueEl.textContent = score + " / " + TOTAL_QUESTIONS;
    if(scorePercentEl) scorePercentEl.textContent = percent + "%";
    if(scoreSummaryEl){
      scoreSummaryEl.textContent = percent >= 80
        ? "Excellent! You have a strong grasp of linear and non-linear functions."
        : percent >= 50
          ? "Good effort. Review the questions marked incorrect and try again."
          : "Keep practising — revisit the lesson and practice pages before trying again.";
    }
    if(scorePanel) scorePanel.classList.remove("hidden");
    submitBtn.classList.add("hidden");

    var record = { score:score, total:TOTAL_QUESTIONS, percent:percent, name:learnerName, date:new Date().toISOString(), results:results };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));

    if(downloadBtn){
      downloadBtn.onclick = function(){
        var blob = new Blob([renderSummary(results, score, learnerName)], { type:"text/plain" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "MathVerse-Assessment-Summary.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };
    }

    scorePanel.scrollIntoView({ behavior:"smooth", block:"center" });
  });

  if(tryAgainBtn){
    tryAgainBtn.addEventListener("click", function(){
      form.reset();
      form.querySelectorAll("label").forEach(function(l){ l.classList.remove("correct-ans","wrong-ans"); });
      form.querySelectorAll(".feedback-msg").forEach(function(fb){ fb.classList.remove("show"); });
      scorePanel.classList.add("hidden");
      submitBtn.classList.remove("hidden");
      updateSubmitState();
      form.scrollIntoView({ behavior:"smooth", block:"start" });
    });
  }

  /* Restore a previous result banner, if present */
  (function restorePrevious(){
    var saved = localStorage.getItem(STORAGE_KEY);
    var prevBanner = document.getElementById("previousResultBanner");
    if(saved && prevBanner){
      try{
        var record = JSON.parse(saved);
        prevBanner.textContent = "Previous attempt: " + record.score + "/" + record.total +
          " (" + record.percent + "%) on " + new Date(record.date).toLocaleDateString();
        prevBanner.classList.remove("hidden");
      }catch(e){}
    }
  })();

})();
