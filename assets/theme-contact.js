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
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

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
      } else if (res.ok) {
        form.reset();
        setStatus('Thanks for reaching out — we will be in touch soon.', 'success');
      } else if (res.status === 403) {
        setStatus('Our security check could not be verified. Please try again.', 'error');
      } else {
        setStatus('Something went wrong. Please try again, or email us directly.', 'error');
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
