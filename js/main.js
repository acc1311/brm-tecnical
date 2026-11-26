/* BRM TECNICAL — interacțiuni site (randare din data.js) */
(function () {
  'use strict';

  /* ---------- date: data.js + override localStorage (admin) ---------- */
  function loadData() {
    var base = window.BRM_DEFAULT || { settings: {}, products: [] };
    try {
      var raw = localStorage.getItem('brm_data');
      if (raw) {
        var ov = JSON.parse(raw);
        if (ov && ov.settings && ov.products) {
          return {
            settings: Object.assign({}, base.settings, ov.settings),
            products: ov.products
          };
        }
      }
    } catch (e) { /* ignore */ }
    return { settings: base.settings || {}, products: base.products || [] };
  }

  var DATA = loadData();
  var S = DATA.settings;
  var MAIL = S.email || 'brm_tecnical@yahoo.com';

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function html(id, v) { var el = $(id); if (el && v != null) el.innerHTML = v; }
  function text(id, v) { var el = $(id); if (el && v != null) el.textContent = v; }
  function attr(id, a, v) { var el = $(id); if (el && v != null) el.setAttribute(a, v); }

  /* ---------- anul curent ---------- */
  text('year', String(new Date().getFullYear()));

  /* ---------- email peste tot ---------- */
  ['headMail', 'contactMail', 'footMail', 'footMail2'].forEach(function (id) {
    var el = $(id);
    if (el) { el.textContent = MAIL; el.setAttribute('href', 'mailto:' + MAIL); }
  });

  /* ---------- setări text ---------- */
  if (S.band) {
    html('bandText', esc(S.band).replace('{email}',
      '<a href="mailto:' + esc(MAIL) + '">' + esc(MAIL) + '</a>'));
  }
  html('heroEyebrow', esc(S.heroEyebrow || ''));
  html('heroTitle', (esc(S.heroTitleA || '') + '<br><em>' + esc(S.heroTitleB || '') + '</em>'));
  text('heroLead', S.heroLead || '');
  text('priceFrom', S.priceFrom || '');
  text('priceNote', S.priceNote || '');
  text('previewCaption', S.previewCaption || '');
  html('customTitle', (esc(S.customTitleA || '') + '<em>' + esc(S.customTitleB || '') + '</em>'));
  text('customNote', S.customNote || '');
  text('customNameLabel', S.customNameLabel || 'Numele (pe banner)');
  text('customBottomLabel', S.customBottomLabel || 'Mesajul de jos (curbat)');
  text('customLegal', S.customLegal || '');
  html('aboutEyebrow', esc(S.aboutEyebrow || ''));
  html('aboutTitle', (esc(S.aboutTitleA || '') + '<br><em>' + esc(S.aboutTitleB || '') + '</em>'));
  text('aboutP1', S.aboutP1 || '');
  text('aboutP2', S.aboutP2 || '');
  if (S.aboutImg) { attr('aboutImg', 'src', S.aboutImg); attr('aboutImg', 'alt', S.aboutImgAlt || ''); }
  html('materialsEyebrow', esc(S.materialsEyebrow || ''));
  html('materialsTitle', (esc(S.materialsTitleA || '') + '<em>' + esc(S.materialsTitleB || '') + '</em>'));
  text('materialsSub', S.materialsSub || '');
  html('collectionEyebrow', esc(S.collectionEyebrow || ''));
  html('collectionTitle', (esc(S.collectionTitleA || '') + '<em>' + esc(S.collectionTitleB || '') + '</em>'));
  text('collectionSub', S.collectionSub || '');
  html('stepsEyebrow', esc(S.stepsEyebrow || ''));
  html('stepsTitle', (esc(S.stepsTitleA || '') + '<em>' + esc(S.stepsTitleB || '') + '</em>'));
  html('faqEyebrow', esc(S.faqEyebrow || ''));
  html('faqTitle', (esc(S.faqTitleA || '') + '<em>' + esc(S.faqTitleB || '') + '</em>'));
  html('contactEyebrow', esc(S.contactEyebrow || ''));
  html('contactTitle', (esc(S.contactTitleA || '') + '<em>' + esc(S.contactTitleB || '') + '</em>'));
  text('contactLead', S.contactLead || '');
  text('formNameLabel', S.formNameLabel || 'Numele tău');
  text('formEmailLabel', S.formEmailLabel || 'Email');
  text('formModelLabel', S.formModelLabel || 'Ce vrei să comanzi?');
  text('formMsgLabel', S.formMsgLabel || 'Mesajul tău');
  text('formBtn', S.formBtn || 'Trimite comanda pe email →');
  text('formLegal', S.formLegal || '');
  if (S.contactImg) { attr('contactImg', 'src', S.contactImg); attr('contactImg', 'alt', S.contactImgAlt || ''); }
  html('finalTitle', (esc(S.finalTitleA || '') + '<em>' + esc(S.finalTitleB || '') + '</em>'));
  text('finalText', S.finalText || '');
  text('finalBtn', S.finalBtn || 'Personalizează piesa');
  html('footerTagline', S.footerTagline || '');
  var cfName = $('cfName'); if (cfName && S.formNamePlaceholder) cfName.placeholder = S.formNamePlaceholder;
  var cfEmail = $('cfEmail'); if (cfEmail && S.formEmailPlaceholder) cfEmail.placeholder = S.formEmailPlaceholder;
  var cfMsg = $('cfMsg'); if (cfMsg && S.formMsgPlaceholder) cfMsg.placeholder = S.formMsgPlaceholder;
  if (S.city) text('footCity', S.city);
  if (S.county) text('footCounty', (S.county.charAt(0).toUpperCase() + S.county.slice(1)) + (S.country ? ', ' + S.country : ''));
  text('contactAddr', [S.city, S.county, S.country].filter(Boolean).join(', '));
  text('contactProg', S.program || '');

  /* ---------- încredere ---------- */
  var trustIn = $('trustIn');
  if (trustIn && Array.isArray(S.trust)) {
    trustIn.innerHTML = S.trust.map(function (t) {
      return '<div class="tr"><span class="tr-ic">' + esc(t.ic) + '</span><strong>' +
        esc(t.title) + '</strong><p>' + esc(t.text) + '</p></div>';
    }).join('');
  }

  /* ---------- materiale ---------- */
  var mats = $('mats');
  if (mats && Array.isArray(S.materials)) {
    mats.innerHTML = S.materials.map(function (m) {
      return '<div class="mat"><span class="mat-dot" style="background:' + esc(m.color) + '"></span>' +
        '<h3>' + esc(m.name) + '</h3><p>' + esc(m.desc) + '</p></div>';
    }).join('');
  }

  /* ---------- pași ---------- */
  var stepsEl = $('steps');
  if (stepsEl && Array.isArray(S.steps)) {
    stepsEl.innerHTML = S.steps.map(function (st) {
      return '<div class="step"><span class="n">' + esc(st.n) + '</span><h3>' +
        esc(st.title) + '</h3><p>' + esc(st.text) + '</p></div>';
    }).join('');
  }

  /* ---------- FAQ ---------- */
  var faqList = $('faqList');
  if (faqList && Array.isArray(S.faq)) {
    faqList.innerHTML = S.faq.map(function (f) {
      return '<details><summary>' + esc(f.q) + '<span class="plus">+</span></summary><p>' +
        esc(f.a) + '</p></details>';
    }).join('');
  }

  /* ---------- email detaliat pentru comenzi ---------- */
  function orderMailto(opts) {
    var lines = [];
    lines.push('Bună!');
    lines.push('');
    lines.push('COMANDĂ:');
    if (opts.product) {
      lines.push('• Piesă: ' + opts.product);
      if (opts.price) lines.push('• Preț afișat: ' + opts.price + ' lei');
    }
    if (opts.material) lines.push('• Material (ales): ' + opts.material);
    if (opts.color) lines.push('• Culoare: ' + opts.color);
    if (opts.banner) lines.push('• Text pe banner (nume): ' + opts.banner);
    if (opts.curve) lines.push('• Text curbat (jos): ' + opts.curve);
    if (opts.extra) lines.push('• Detalii: ' + opts.extra);
    lines.push('');
    lines.push('Datele mele:');
    lines.push('• Nume: ');
    lines.push('• Telefon: ');
    lines.push('• Oraș / adresă livrare: ');
    lines.push('• Termen dorit: ');
    lines.push('');
    lines.push('Mulțumesc!');
    var subject = (S.orderSubjectPrefix || 'Comandă:') + ' ' + (opts.product || 'piesă personalizată');
    return 'mailto:' + MAIL + '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(lines.join('\n'));
  }

  /* ---------- produse: marquee + grid + filtre + select contact ---------- */
  var products = DATA.products || [];

  var track = $('marqueeTrack');
  if (track) {
    track.innerHTML = products.slice(0, 14).map(function (p) {
      return '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy">';
    }).join('');
    track.innerHTML += track.innerHTML; /* buclă infinită */
  }

  var grid = $('grid');
  if (grid) {
    grid.innerHTML = products.map(function (p) {
      var badgeCls = (p.cat || '').indexOf('personalizate') !== -1 ? 'badge badge-custom' : 'badge';
      var cat = esc(p.cat || '');
      var href = orderMailto({ product: p.name, price: p.price });
      return '<article class="card" data-cat="' + cat + '">' +
        '<span class="' + badgeCls + '">' + esc(p.badge || '') + '</span>' +
        '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy">' +
        '<div class="card-b"><h3>' + esc(p.name) + '</h3>' +
        '<p class="card-p">' + esc(p.price) + ' lei</p>' +
        '<a class="card-a" href="' + href + '">Comandă →</a></div></article>';
    }).join('');
  }

  var filters = $('filters');
  if (filters && Array.isArray(S.filters)) {
    var counts = {};
    products.forEach(function (p) {
      (p.cat || '').split(/\s+/).forEach(function (c) {
        if (c) counts[c] = (counts[c] || 0) + 1;
      });
    });
    filters.innerHTML = S.filters.map(function (f, i) {
      var n = f.id === 'toate' ? products.length : (counts[f.id] || 0);
      var on = i === 0 ? ' is-on' : '';
      return '<button class="fbtn' + on + '" data-f="' + esc(f.id) + '">' + esc(f.label) +
        (n ? ' <span>' + n + '</span>' : '') + '</button>';
    }).join('');

    var fbtns = filters.querySelectorAll('.fbtn');
    Array.prototype.forEach.call(fbtns, function (btn) {
      btn.addEventListener('click', function () {
        Array.prototype.forEach.call(fbtns, function (b) { b.classList.remove('is-on'); });
        btn.classList.add('is-on');
        var f = btn.getAttribute('data-f');
        Array.prototype.forEach.call(document.querySelectorAll('#grid .card'), function (card) {
          var cats = (card.getAttribute('data-cat') || '').split(/\s+/);
          var show = f === 'toate' || cats.indexOf(f) !== -1;
          card.classList.toggle('is-hidden', !show);
        });
      });
    });
  }

  /* select „Ce vrei să comanzi?" */
  var cfModel = $('cfModel');
  if (cfModel && products.length) {
    var opts = products.slice(0, 12).map(function (p) {
      return '<option>' + esc(p.name) + '</option>';
    });
    opts.push('<option>Alt model (scriu mai jos)</option>');
    cfModel.innerHTML = opts.join('');
  }

  /* ---------- personalizator live ---------- */
  var pv = $('preview');
  var img = $('previewImg');
  var inName = $('inName');
  var inBottom = $('inBottom');
  var pvBanner = $('pvBanner');
  var pvCurveText = $('pvCurveText');
  var orderBtn = $('orderCustom');

  var SRC = {
    negru: 'images/coronita-model.png',
    rosu: 'images/coronita-model-rosu.png',
    auriu: 'images/coronita-model-auriu.png'
  };
  var color = 'negru';

  if (inName && S.customNameDefault) inName.value = S.customNameDefault;
  if (inBottom && S.customBottomDefault) inBottom.value = S.customBottomDefault;

  function fit(el, text, max) {
    var t = (text || '').trim();
    if (!el) return;
    if (!t) { el.style.visibility = 'hidden'; return; }
    el.style.visibility = 'visible';
    el.textContent = t.toUpperCase();
    el.style.fontSize = '';
    var size = parseFloat(getComputedStyle(el).fontSize);
    var guard = 0;
    while (el.scrollWidth > el.clientWidth && size > max && guard < 40) {
      size -= 1;
      el.style.fontSize = size + 'px';
      guard++;
    }
  }

  function fitCurve(txt) {
    if (!pvCurveText) return;
    var t = (txt || '').trim().toUpperCase();
    var tp = pvCurveText.querySelector('textPath');
    if (!tp) return;
    if (!t) { pvCurveText.style.visibility = 'hidden'; return; }
    pvCurveText.style.visibility = 'visible';
    tp.textContent = t;
    pvCurveText.style.fontSize = '';
    var size = 46; /* viewBox units */
    pvCurveText.style.fontSize = size + 'px';
    var guard = 0;
    /* aproximare: lungime text ≈ n * 0.58 * fontSize; arc ≈ 420 unități */
    while (t.length * 0.58 * size > 420 && size > 16 && guard < 40) {
      size -= 2;
      pvCurveText.style.fontSize = size + 'px';
      guard++;
    }
  }

  function update() {
    if (!pv) return;
    fit(pvBanner, inName && inName.value, 18);
    fitCurve(inBottom && inBottom.value);

    if (orderBtn) {
      orderBtn.href = orderMailto({
        product: 'Ornament personalizat (coroniță cu nume)',
        material: 'de ales: oțel / inox / aluminiu / alamă / cupru / tablă zincată',
        color: color,
        banner: (inName && inName.value) || '—',
        curve: (inBottom && inBottom.value) || '—',
        extra: 'Previzualizare pe site (banner + text curbat jos)'
      });
    }
  }

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
    });
  });

  update();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
  window.addEventListener('resize', update);

  /* ---------- meniu mobil ---------- */
  var burger = $('burger');
  var nav = $('nav');
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

  /* ---------- formular contact → mailto detaliat ---------- */
  var form = $('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('cfName').value.trim();
      var email = $('cfEmail').value.trim();
      var model = $('cfModel').value;
      var msg = $('cfMsg').value.trim();
      var subject = (S.orderSubjectPrefix || 'Comandă:') + ' ' + model;
      var body =
        'Datele mele:\n' +
        '• Nume: ' + name + '\n' +
        '• Email: ' + email + '\n' +
        '• Telefon: \n' +
        '• Oraș / adresă livrare: \n' +
        '• Termen dorit: \n\n' +
        'COMANDĂ:\n' +
        '• Piesă: ' + model + '\n\n' +
        'Mesaj:\n' + msg + '\n';
      window.location.href =
        'mailto:' + MAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
    });
  }
})();
