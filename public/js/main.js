// Mobile menu toggle and footer year. No dependencies.
(function () {
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }
  var y = document.getElementById('year');
  if (y) { y.textContent = new Date().getFullYear(); }
})();

// Contact form: send without leaving the page
(function () {
  var form = document.querySelector('.form');
  if (!form) { return; }
  var status = form.querySelector('.form-status');
  var btn = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    btn.disabled = true;
    status.textContent = 'Sending...';
    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      if (res.ok) {
        form.reset();
        status.textContent = 'Thank you. We have received your enquiry.';
      } else {
        status.textContent = 'Sorry, the message could not be sent. Please call or WhatsApp us instead.';
      }
    }).catch(function () {
      status.textContent = 'Network problem. Please check your connection or call us.';
    }).then(function () { btn.disabled = false; });
  });
})();