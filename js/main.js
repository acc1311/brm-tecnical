/* BRM TECNICAL — interacțiuni site */
(function () {
  'use strict';

  var MAIL = 'brm_tecnical@yahoo.com';

  /* ---------- anul curent în footer ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- countdown până pe 15 decembrie ---------- */
  (function () {
    var el = document.getElementById('countdownDays');
    if (!el) return;
    function calc() {
      var now = new Date();
      var year = now.getFullYear();
      var target = new Date(year, 11, 15, 23, 59, 59); // 15 decembrie
      if (now > target) target = new Date(year + 1, 11, 15, 23, 59, 59);
      var days = Math.ceil((target - now) / 86400000);
      el.textContent = days;
    }
    calc();
    setInterval(calc, 60 * 60 * 1000);
  })();

  /* ---------- meniu mobil ---------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- personalizator live ---------- */
  var pv = document.getElementById('preview');
  var img = document.getElementById('previewImg');
  var inTop = document.getElementById('inTop');
  var inName = document.getElementById('inName');
  var inBottom = document.getElementById('inBottom');
  var pvTop = document.getElementById('pvTop');
  var pvBanner = document.getElementById('pvBanner');
  var pvBottom = document.getElementById('pvBottom');
  var orderBtn = document.getElementById('orderCustom');

  var SRC = {
    negru: 'images/coronita-model.png',
    rosu: 'images/coronita-model-rosu.png',
    auriu: 'images/coronita-model-auriu.png'
  };
  var color = 'negru';

  function fit(el, text, max) {
    var t = (text || '').trim();
    if (!t) { el.style.visibility = 'hidden'; return; }
    el.style.visibility = 'visible';
    el.textContent = t.toUpperCase();
    // micșorează fontul dacă textul e prea lung pentru lățimea coroniței
    var base = parseFloat(getComputedStyle(el).fontSize);
    el.style.fontSize = '';
    var size = parseFloat(getComputedStyle(el).fontSize);
    var guard = 0;
    while (el.scrollWidth > el.clientWidth && size > max && guard < 40) {
      size -= 1;
      el.style.fontSize = size + 'px';
      guard++;
    }
    if (base && size === base) el.style.fontSize = '';
  }

  function update() {
    if (!pv) return;
    fit(pvTop, inTop.value, 11);
    fit(pvBanner, inName.value, 18);
    fit(pvBottom, inBottom.value, 9);

    if (orderBtn) {
      var subject = 'Comandă ornament personalizat: ' + (inName.value || 'nume');
      var body =
        'Bună!\n\nVreau acest ornament personalizat:\n\n' +
        'Deasupra: ' + (inTop.value || '—') + '\n' +
        'Nume: ' + (inName.value || '—') + '\n' +
        'Mesaj: ' + (inBottom.value || '—') + '\n' +
        'Culoare: ' + color + '\n\n' +
        'Numele meu: \nTelefon: \n\nMulțumesc!';
      orderBtn.href =
        'mailto:' + MAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
    }
  }

  if (inTop) inTop.addEventListener('input', update);
  if (inName) inName.addEventListener('input', update);
  if (inBottom) inBottom.addEventListener('input', update);

  Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (chip) {
    chip.addEventListener('click', function () {
      Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (c) {
        c.classList.remove('is-on');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('is-on');
      chip.setAttribute('aria-pressed', 'true');
      color = chip.getAttribute('data-color') || 'negru';
      if (pv) pv.setAttribute('data-color', color);
      if (img) {
        img.style.opacity = '0.35';
        var next = SRC[color] || SRC.negru;
        var pre = new Image();
        pre.onload = function () {
          img.src = next;
          img.style.opacity = '1';
        };
        pre.src = next;
      }
  update();

  // reîncadrează textele după ce se încarcă fontul sau la redimensionare
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
  window.addEventListener('resize', update);
    });
  });

  update();

  /* ---------- filtre colecție ---------- */
  var fbtns = document.querySelectorAll('.fbtn');
  var cards = document.querySelectorAll('#grid .card');
  Array.prototype.forEach.call(fbtns, function (btn) {
    btn.addEventListener('click', function () {
      Array.prototype.forEach.call(fbtns, function (b) { b.classList.remove('is-on'); });
      btn.classList.add('is-on');
      var f = btn.getAttribute('data-f');
      Array.prototype.forEach.call(cards, function (card) {
        var cats = (card.getAttribute('data-cat') || '').split(/\s+/);
        var show = f === 'toate' || cats.indexOf(f) !== -1;
        card.classList.toggle('is-hidden', !show);
      });
    });
  });

  /* ---------- marquee: dublează conținutul pentru buclă infinită ---------- */
  var track = document.getElementById('marqueeTrack');
  if (track) {
    track.innerHTML += track.innerHTML;
  }

  /* ---------- formular contact → mailto ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('cfName').value.trim();
      var email = document.getElementById('cfEmail').value.trim();
      var model = document.getElementById('cfModel').value;
      var msg = document.getElementById('cfMsg').value.trim();
      var subject = 'Comandă: ' + model;
      var body =
        'Nume: ' + name + '\n' +
        'Email: ' + email + '\n' +
        'Model: ' + model + '\n\n' +
        msg + '\n';
      window.location.href =
        'mailto:' + MAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
    });
  }
})();
