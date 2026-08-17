/* ============================================================
   Native contact form — AJAX submission to the Shopify
   /contact endpoint (the native Form API). No app required.
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  var form = document.querySelector('[data-contact-form]');
  if (!form) return;

  var submitBtn = form.querySelector('[data-contact-submit]');
  var status = form.querySelector('[data-contact-status]');
  var originalLabel = submitBtn ? submitBtn.textContent.trim() : '';

  function setStatus(text, tone) {
    if (!status) return;
    status.textContent = text;
    status.classList.remove('cform__status--success', 'cform__status--error');
    if (tone === 'success') status.classList.add('cform__status--success');
    if (tone === 'error') status.classList.add('cform__status--error');
  }

  form.addEventListener('submit', async function (e) {
    // Native HTML5 validation runs before the submit event; if the form is
    // invalid the browser already stopped the submit.
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Shopify bot protection ("human checker") injects an invisible hCaptcha
    // widget into the form; the captcha token lives in a hidden
    // `h-captcha-response` / `g-recaptcha-response` field that Shopify's own
    // script fills in ASYNCHRONOUSLY when the form is submitted. If we hijack
    // the submit with our own AJAX POST here, that token is still empty →
    // Shopify silently rejects the submission (treats it as spam) and the form
    // is never actually sent (while the code below would show a fake success).
    // So when bot protection is present, back off and let Shopify's handler
    // run the challenge and submit the form natively WITH the token.
    var captchaField = form.querySelector(
      '[name="h-captcha-response"], [name="g-recaptcha-response"]'
    );
    if (captchaField) {
      setStatus('Checking your security verification…', null);
      return; // do NOT preventDefault — let Shopify submit it
    }

    e.preventDefault();

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
    }
    setStatus('Sending your message…', null);

    try {
      var res = await fetch(form.getAttribute('action') || '/contact', {
        method: 'POST',
        headers: {
          'Accept': 'text/html',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: new FormData(form),
        credentials: 'same-origin'
      });

      var html = await res.text();
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var sent = doc.querySelector('[data-contact-success]');
      var errors = doc.querySelector('[data-contact-errors]');

      if (sent) {
        form.reset();
        setStatus('Thanks for reaching out — we will be in touch soon.', 'success');
      } else if (errors) {
        var first = errors.querySelector('li');
        setStatus(first ? first.textContent.trim() : 'Please review your details and try again.', 'error');
      } else if (res.status === 403) {
        setStatus('Our security check could not be verified. Please try again.', 'error');
      } else {
        // No success marker in the response = the submission was NOT confirmed.
        // Never claim success.
        setStatus('Something went wrong — the message was not sent. Please try again, or email us directly.', 'error');
      }
    } catch (err) {
      setStatus('Network error — please check your connection and try again.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      }
    }
  });
});
