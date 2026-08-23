/* ==========================================================================
   MATHVERSE — contact.js
   The contact form submits for real (POST to FormSubmit, which emails the
   team) — no local storage involved. After FormSubmit redirects back here
   with ?sent=1, we hide the form and show a thank-you message instead.
   ========================================================================== */
(function(){
  "use strict";

  var form = document.getElementById("contactForm");
  var thanks = document.getElementById("contactThanks");
  if(!form && !thanks) return;

  try{
    var params = new URLSearchParams(window.location.search);
    if(params.get("sent") === "1"){
      if(form) form.classList.add("hidden");
      if(thanks) thanks.classList.remove("hidden");
      if(thanks) thanks.scrollIntoView({ behavior:"smooth", block:"center" });
    }
  }catch(e){ /* URLSearchParams unsupported — form still works normally */ }

})();
