/* BRM TECNICAL — js/main.js (complet)
   Atelier 8 piese + previzualizare live + comandă cu fișiere + email/WhatsApp.
   Prețuri mici pe piese, adaos de material proporțional cu mărimea piesei.
   Opțional din data.js: settings.shapePrices {coronita:149, tablou:89, ...},
   settings.courier, settings.gift. */
(function () {
  'use strict';

  var CFG = {
    email: 'brm_tecnical@yahoo.com',
    whatsapp: '',      // ex: '40712345678' — gol = butonul nu apare
    sendOnline: true,
    courier: 25,
    gift: 25,
    maxFiles: 3,
    maxTotal: 8 * 1024 * 1024
  };
  var ACCEPT = '.dxf,.dwg,.svg,.ai,.eps,.pdf,.png,.jpg,.jpeg,.webp,image/*,application/pdf';
  var EXT = ['.dxf', '.dwg', '.svg', '.ai', '.eps', '.pdf', '.png', '.jpg', '.jpeg', '.webp'];
  var ARC = 'M 250,690 Q 500,905 750,690';
  var LS_ORDERS = 'brm_orders', LS_CUSTOMER = 'brm_customer';
  var NS = 'http://www.w3.org/2000/svg';

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fsize(n) {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return Math.round(n / 1024) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  }
  function svgText(s, x, y, size, maxW, fill, ls) {
    var t = String(s || '').toUpperCase().trim();
    if (!t) return '';
    var a = ' x="' + x + '" y="' + y + '" font-size="' + size + '" fill="' + fill + '" text-anchor="middle"' +
      ' font-family="Saira Stencil One, Jost, sans-serif" letter-spacing="' + (ls == null ? 2 : ls) + '"';
    if (t.length * 0.58 * size > maxW) a += ' textLength="' + maxW + '" lengthAdjust="spacingAndGlyphs"';
    return '<text' + a + '>' + esc(t) + '</text>';
  }
  function fitCurveExact(t, p, maxSize) {
    if (!t || !p) return;
    var tp = t.querySelector('textPath');
    var str = tp ? String(tp.textContent || '') : '';
    if (!str.trim()) { t.style.visibility = 'hidden'; return; }
    t.style.visibility = 'visible';
    var max = 0;
    try { max = p.getTotalLength(); } catch (e) { max = 0; }
    if (!max) max = 560;
    var svg = t.ownerSVGElement;
    if (!svg) return;
    var cs = getComputedStyle(t);
    var meas = document.createElementNS(NS, 'text');
    meas.setAttribute('font-family', cs.fontFamily || 'Saira Stencil One, Jost, sans-serif');
    meas.setAttribute('letter-spacing', cs.letterSpacing || '0');
    meas.setAttribute('visibility', 'hidden');
    meas.textContent = str;
    svg.appendChild(meas);
    var size = maxSize || 46, len = 0, guard = 0;
    function mm() {
      meas.setAttribute('font-size', String(size));
      try { len = meas.getComputedTextLength(); } catch (e) { len = 0; }
    }
    mm();
    if (!len) {
      len = str.length * 0.62 * size;
      while (len > max - 12 && size > 12 && guard < 90) { size -= 1; len = str.length * 0.62 * size; guard++; }
    } else {
      while (len > max - 12 && size > 12 && guard < 90) { size -= 1; mm(); guard++; }
    }
    t.style.fontSize = size + 'px';
    if (meas.parentNode) meas.parentNode.removeChild(meas);
  }

  /* ===================== FORME + PREȚURI ===================== */
  var SHAPES = [
    { id: 'coronita', label: 'Coroniță', ic: '◍', base: 149, photo: true,
      t1: { label: 'Nume pe banner', def: 'NUMELE TĂU', max: 26 },
      t2: { label: 'Text curbat jos', def: 'SĂRBĂTORI FERICITE', max: 34 },
      sizes: [{ v: 30, label: 'Ø 30 cm', mul: 0.85 }, { v: 40, label: 'Ø 40 cm', mul: 1 },
              { v: 50, label: 'Ø 50 cm', mul: 1.25 }, { v: 60, label: 'Ø 60 cm', mul: 1.5 }] },
    { id: 'tablou', label: 'Tablou', ic: '▭', base: 89,
      t1: { label: 'Nume / text principal', def: 'FAMILIA POPESCU', max: 24 },
      t2: { label: 'Text secundar', def: 'TÂRGU NEAMȚ · 2026', max: 30 },
      sizes: [{ v: 30, label: '30 × 20 cm', mul: 0.85 }, { v: 40, label: '40 × 27 cm', mul: 1 },
              { v: 50, label: '50 × 33 cm', mul: 1.3 }, { v: 60, label: '60 × 40 cm', mul: 1.6 }],
      draw: function (o, p, u) {
        return '<rect x="110" y="250" width="780" height="500" rx="20" fill="url(#' + u + 'g)"/>' +
          '<rect x="142" y="282" width="716" height="436" rx="12" fill="none" stroke="' + p.text + '" stroke-opacity=".35" stroke-width="4"/>' +
          '<circle cx="185" cy="305" r="13" fill="' + p.dark + '"/><circle cx="815" cy="305" r="13" fill="' + p.dark + '"/>' +
          svgText(o.pname, 500, 520, 108, 620, p.text, 3) + svgText(o.pcurve, 500, 625, 44, 560, p.text, 6);
      } },
    { id: 'placuta', label: 'Plăcuță firmă', ic: '▬', base: 69,
      t1: { label: 'Nume firmă', def: 'BRM TECNICAL', max: 22 },
      t2: { label: 'Subtitlu', def: 'ATELIER · TÂRGU NEAMȚ', max: 32 },
      sizes: [{ v: 20, label: '20 × 10 cm', mul: 0.8 }, { v: 30, label: '30 × 15 cm', mul: 1 },
              { v: 40, label: '40 × 20 cm', mul: 1.35 }, { v: 60, label: '60 × 30 cm', mul: 1.9 }],
      draw: function (o, p, u) {
        return '<rect x="80" y="360" width="840" height="280" rx="28" fill="url(#' + u + 'g)"/>' +
          '<circle cx="132" cy="412" r="15" fill="' + p.dark + '"/><circle cx="868" cy="412" r="15" fill="' + p.dark + '"/>' +
          '<circle cx="132" cy="588" r="15" fill="' + p.dark + '"/><circle cx="868" cy="588" r="15" fill="' + p.dark + '"/>' +
          svgText(o.pname, 500, 492, 86, 620, p.text, 3) + svgText(o.pcurve, 500, 566, 36, 600, p.text, 7);
      } },
    { id: 'brad', label: 'Brad', ic: '▲', base: 79,
      t1: { label: 'Nume pe banner', def: 'CRĂCIUN FERICIT', max: 22 },
      t2: { label: 'Text jos', def: 'FAMILIA POPESCU', max: 26 },
      sizes: [{ v: 30, label: '30 cm înălțime', mul: 0.85 }, { v: 40, label: '40 cm înălțime', mul: 1 },
              { v: 50, label: '50 cm înălțime', mul: 1.25 }, { v: 60, label: '60 cm înălțime', mul: 1.5 }],
      draw: function (o, p, u) {
        var g = 'url(#' + u + 'g)';
        return '<polygon points="500,110 521,168 583,168 533,205 552,262 500,228 448,262 467,205 417,168 479,168" fill="' + g + '"/>' +
          '<path d="M500,195 L645,420 L355,420 Z" fill="' + g + '"/>' +
          '<path d="M500,330 L705,570 L295,570 Z" fill="' + g + '"/>' +
          '<path d="M500,470 L775,730 L225,730 Z" fill="' + g + '"/>' +
          '<rect x="455" y="730" width="90" height="88" rx="6" fill="' + g + '"/>' +
          '<rect x="245" y="600" width="510" height="94" rx="10" fill="' + g + '" stroke="' + p.text + '" stroke-opacity=".3" stroke-width="3"/>' +
          svgText(o.pname, 500, 664, 56, 450, p.text, 2) +
          '<rect x="225" y="845" width="550" height="72" rx="9" fill="' + g + '"/>' +
          svgText(o.pcurve, 500, 894, 40, 480, p.text, 5);
      } },
    { id: 'stea', label: 'Stea', ic: '★', base: 49,
      t1: { label: 'Nume', def: 'LA MULȚI ANI', max: 18 },
      t2: { label: 'Text secundar', def: '2026', max: 20 },
      sizes: [{ v: 25, label: 'Ø 25 cm', mul: 0.85 }, { v: 35, label: 'Ø 35 cm', mul: 1 },
              { v: 45, label: 'Ø 45 cm', mul: 1.3 }, { v: 60, label: 'Ø 60 cm', mul: 1.7 }],
      draw: function (o, p, u) {
        return '<polygon points="500,120 600,362 861,383 662,553 723,807 500,670 277,807 338,553 139,383 400,362" fill="url(#' + u + 'g)"/>' +
          svgText(o.pname, 500, 495, 70, 300, p.text, 1) + svgText(o.pcurve, 500, 560, 32, 250, p.text, 4);
      } },
    { id: 'inima', label: 'Inimă', ic: '♥', base: 49,
      t1: { label: 'Nume', def: 'ANA & MATEI', max: 20 },
      t2: { label: 'Text secundar', def: '14 FEBRUARIE 2026', max: 24 },
      sizes: [{ v: 25, label: '25 cm', mul: 0.85 }, { v: 35, label: '35 cm', mul: 1 },
              { v: 45, label: '45 cm', mul: 1.3 }, { v: 60, label: '60 cm', mul: 1.7 }],
      draw: function (o, p, u) {
        return '<path d="M500,840 C250,655 145,520 145,400 C145,298 228,238 320,238 C400,238 462,290 500,352 ' +
          'C538,290 600,238 680,238 C772,238 855,298 855,400 C855,520 750,655 500,840 Z" fill="url(#' + u + 'g)"/>' +
          svgText(o.pname, 500, 470, 84, 440, p.text, 2) + svgText(o.pcurve, 500, 545, 34, 360, p.text, 5);
      } },
    { id: 'cerc', label: 'Monogramă', ic: '◯', base: 59,
      t1: { label: 'Inițiale (1–3 litere)', def: 'BM', max: 3 },
      t2: { label: 'Nume pe arc', def: 'FAMILIA POPESCU', max: 26 },
      sizes: [{ v: 25, label: 'Ø 25 cm', mul: 0.85 }, { v: 35, label: 'Ø 35 cm', mul: 1 },
              { v: 45, label: 'Ø 45 cm', mul: 1.3 }, { v: 60, label: 'Ø 60 cm', mul: 1.7 }],
      draw: function (o, p, u) {
        var arc = String(o.pcurve || '').toUpperCase().trim();
        return '<circle cx="500" cy="500" r="330" fill="url(#' + u + 'g)"/>' +
          '<circle cx="500" cy="500" r="292" fill="none" stroke="' + p.text + '" stroke-opacity=".32" stroke-width="4"/>' +
          svgText(o.pname, 500, 500, 190, 400, p.text, 6) +
          (arc ? '<text font-size="46" fill="' + p.text + '" font-family="Saira Stencil One, Jost, sans-serif" letter-spacing="4">' +
            '<textPath href="#' + u + 'arc" startOffset="50%" text-anchor="middle">' + esc(arc) + '</textPath></text>' : '');
      } },
    { id: 'casa', label: 'Semn de casă', ic: '⌂', base: 99,
      t1: { label: 'Nume familie', def: 'FAMILIA POPESCU', max: 22 },
      t2: { label: 'Text secundar', def: 'EST. 2026', max: 24 },
      sizes: [{ v: 40, label: '40 × 25 cm', mul: 0.9 }, { v: 50, label: '50 × 31 cm', mul: 1 },
              { v: 60, label: '60 × 37 cm', mul: 1.25 }, { v: 80, label: '80 × 50 cm', mul: 1.7 }],
      draw: function (o, p, u) {
        var g = 'url(#' + u + 'g)';
        return '<rect x="690" y="235" width="72" height="130" fill="' + g + '"/>' +
          '<path d="M500,150 L905,470 L95,470 Z" fill="' + g + '"/>' +
          '<rect x="180" y="466" width="640" height="336" rx="12" fill="' + g + '"/>' +
          svgText(o.pname, 500, 600, 82, 520, p.text, 2) + svgText(o.pcurve, 500, 682, 36, 470, p.text, 6);
      } }
  ];
  function shapeById(id) { for (var i = 0; i < SHAPES.length; i++) if (SHAPES[i].id === id) return SHAPES[i]; return SHAPES[0]; }
  function paintFor(c) {
    if (c === 'rosu') return { base: '#8F2E1B', light: '#B84A2E', dark: '#5C1C0F', text: '#FFF3E8' };
    if (c === 'auriu') return { base: '#C9A227', light: '#EBD37E', dark: '#8A6A2C', text: '#2A2118' };
    return { base: '#2A2E31', light: '#4C5359', dark: '#131618', text: '#FBF8F2' };
  }
  function shapeSVG(id, o, uid) {
    var sh = shapeById(id);
    if (!sh.draw) return '';
    var p = paintFor(o.color);
    return '<svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet" class="at-svgel">' +
      '<defs><linearGradient id="' + uid + 'g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + p.light + '"/><stop offset=".5" stop-color="' + p.base + '"/>' +
      '<stop offset="1" stop-color="' + p.dark + '"/></linearGradient>' +
      '<path id="' + uid + 'arc" d="M 250,600 Q 500,845 750,600" fill="none"/></defs>' + sh.draw(o, p, uid) + '</svg>';
  }

  /* ===================== CORE ===================== */
  var CORE = {
    sizes: SHAPES[0].sizes,
    colors: [{ v: 'negru', label: 'Negru', hex: '#1C1814' }, { v: 'rosu', label: 'Roșu', hex: '#8F2E1B' }, { v: 'auriu', label: 'Auriu', hex: '#8A6A2C' }],
    norm: function (s) {
      return String(s == null ? '' : s).toLowerCase().replace(/[ăâ]/g, 'a').replace(/î/g, 'i').replace(/[șş]/g, 's').replace(/[țţ]/g, 't');
    },
    matAdd: function (name) {
      var s = CORE.norm(name);
      if (s.indexOf('inox') >= 0) return 40;
      if (s.indexOf('aluminiu') >= 0) return 25;
      if (s.indexOf('alama') >= 0) return 70;
      if (s.indexOf('cupru') >= 0) return 90;
      if (s.indexOf('galvaniz') >= 0 || s.indexOf('zincat') >= 0) return 15;
      return 0;
    },
    matAddFor: function (base, mul, name) {
      var f = Math.max(0.3, ((base || 0) / 149) * (mul || 1));
      return Math.round(CORE.matAdd(name) * f);
    },
    minMul: function (sizes) { var m = 1; sizes.forEach(function (s) { if (s.mul < m) m = s.mul; }); return m; },
    from: function (base, sizes) { return Math.round(base * CORE.minMul(sizes)); },
    sizesFor: function (o) {
      if (o.shape) return shapeById(o.shape).sizes;
      var n = CORE.norm(o.title);
      if (n.indexOf('brad') >= 0) return shapeById('brad').sizes;
      if (n.indexOf('tablou') >= 0) return shapeById('tablou').sizes;
      if (n.indexOf('placuta') >= 0 || n.indexOf('placa') >= 0 || n.indexOf('logo') >= 0) return shapeById('placuta').sizes;
      return CORE.sizes;
    },
    sizeBy: function (o, v) {
      var l = CORE.sizesFor(o);
      for (var i = 0; i < l.length; i++) if (l[i].v === +v) return l[i];
      return l[Math.min(1, l.length - 1)];
    },
    colorBy: function (v) { for (var i = 0; i < CORE.colors.length; i++) if (CORE.colors[i].v === v) return CORE.colors[i]; return CORE.colors[0]; },
    money: function (n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' lei'; },
    price: function (o) {
      var sz = CORE.sizeBy(o, o.size);
      var mat = CORE.matAddFor(o.base, sz.mul, o.material);
      var unit = (o.base || 0) * sz.mul + mat + (o.gift ? CFG.gift : 0);
      var pieces = unit * (o.qty || 1), ship = o.delivery === 'curier' ? CFG.courier : 0;
      return { mul: sz.mul, mat: mat, unit: Math.round(unit), pieces: Math.round(pieces), ship: ship, total: Math.round(pieces + ship) };
    },
    phoneOk: function (v) { var d = String(v || '').replace(/[^0-9]/g, ''); return d.length >= 9 && d.length <= 15; },
    mailOk: function (v) { return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(String(v || '').trim()); },
    code: function () {
      var a = Date.now().toString(36).slice(-4), b = Math.floor(Math.random() * 1679616).toString(36);
      while (b.length < 4) b = '0' + b;
      return ('BRM-' + a + b).toUpperCase();
    },
    deliveryLabel: function (v) { return v === 'curier' ? 'Curier (oriunde în România)' : 'Ridicare din atelier, Târgu Neamț'; },
    buildText: function (o, p) {
      var L = ['Bună!', '', 'COMANDĂ: ' + o.title];
      if (o.code) L.push('Cod: ' + o.code);
      if (o.shape) L.push('• Tip piesă: ' + shapeById(o.shape).label);
      L.push('• Material: ' + o.material);
      L.push('• Dimensiune: ' + CORE.sizeBy(o, o.size).label);
      L.push('• Culoare: ' + CORE.colorBy(o.color).label);
      L.push('• Bucăți: ' + o.qty);
      if (o.personalizable) {
        var sh = shapeById(o.shape || 'coronita');
        L.push('• ' + sh.t1.label + ': ' + (o.pname || '—'));
        L.push('• ' + sh.t2.label + ': ' + (o.pcurve || '—'));
      }
      L.push('• Livrare: ' + CORE.deliveryLabel(o.delivery));
      L.push('• Ambalaj cadou: ' + (o.gift ? 'Da' : 'Nu'));
      L.push('• Estimare preț: ' + CORE.money(p.total));
      if (o.files && o.files.length) L.push('• Fișiere atașate: ' + o.files.join(', '));
      L.push('', 'Datele mele:');
      L.push('• Nume: ' + (o.cust.nume || ''));
      L.push('• Telefon: ' + (o.cust.tel || ''));
      L.push('• Email: ' + (o.cust.mail || ''));
      L.push('• Oraș / adresă livrare: ' + (o.cust.adr || ''));
      L.push('• Termen dorit: ' + (o.cust.termen || ''));
      if (o.cust.msg) L.push('', 'Mesaj: ' + o.cust.msg);
      L.push('', 'Mulțumesc!');
      return L.join('\n');
    },
    mailto: function (s, b) { return 'mailto:' + CFG.email + '?subject=' + encodeURIComponent(s) + '&body=' + encodeURIComponent(b); },
    webmail: function (k, s, b) {
      var to = encodeURIComponent(CFG.email), su = encodeURIComponent(s), bo = encodeURIComponent(b);
      if (k === 'gmail') return 'https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=' + to + '&su=' + su + '&body=' + bo;
      if (k === 'yahoo') return 'https://compose.mail.yahoo.com/?to=' + to + '&subj=' + su + '&subject=' + su + '&body=' + bo;
      if (k === 'outlook') return 'https://outlook.live.com/mail/0/deeplink/compose?to=' + to + '&subject=' + su + '&body=' + bo;
      return CORE.mailto(s, b);
    },
    parseMailto: function (href) {
      var out = { subject: '', body: '', product: '' }, q = String(href || '').split('?')[1] || '', p = {};
      q.split('&').forEach(function (kv) {
        var i = kv.indexOf('=');
        if (i > 0) { try { p[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1).replace(/\+/g, ' ')); } catch (e) { } }
      });
      out.subject = p.subject || ''; out.body = p.body || '';
      out.product = out.subject.replace(/^Comand[aă]:\s*/i, '').trim();
      return out;
    }
  };

  /* ===================== DATE ===================== */
  function loadData() {
    var base = window.BRM_DEFAULT || { settings: {}, products: [] };
    try {
      var raw = localStorage.getItem('brm_data');
      if (raw) { var ov = JSON.parse(raw); if (ov && ov.settings && ov.products) return { settings: Object.assign({}, base.settings, ov.settings), products: ov.products }; }
    } catch (e) { }
    return { settings: base.settings || {}, products: base.products || [] };
  }
  var DATA = loadData(), S = DATA.settings, MAIL = S.email || CFG.email;
  CFG.email = MAIL;
  if (S.courier != null && !isNaN(+S.courier)) CFG.courier = +S.courier;
  if (S.gift != null && !isNaN(+S.gift)) CFG.gift = +S.gift;
  if (S.shapePrices) SHAPES.forEach(function (s) {
    var v = S.shapePrices[s.id];
    if (v != null && !isNaN(+v) && +v > 0) s.base = +v;
  });
  var products = DATA.products || [];
  function $(id) { return document.getElementById(id); }
  function html(id, v) { var e = $(id); if (e && v != null) e.innerHTML = v; }
  function text(id, v) { var e = $(id); if (e && v != null) e.textContent = v; }
  function attr(id, a, v) { var e = $(id); if (e && v != null) e.setAttribute(a, v); }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function read(k, d) { try { var r = localStorage.getItem(k); return r ? JSON.parse(r) : d; } catch (e) { return d; } }

  var MATERIALS = (Array.isArray(S.materials) && S.materials.length ? S.materials : [
    { name: 'Oțel Carbon', color: '#3A3F44' }, { name: 'Inox', color: '#C9CED3' }, { name: 'Aluminiu', color: '#DFE3E6' },
    { name: 'Alamă', color: '#C9A227' }, { name: 'Cupru', color: '#B87333' }, { name: 'Tablă Galvanizată', color: '#8A9AA5' }]);
  var SRC = { negru: 'images/coronita-model.png', rosu: 'images/coronita-model-rosu.png', auriu: 'images/coronita-model-auriu.png' };

  /* ===================== STILURI ===================== */
  var CSS = '' +
  ':root{--bm-ink:#1B1F23;--bm-steel:#3A3F44;--bm-graphite:#2E3438;--bm-red:#8F2E1B;--bm-red2:#6F2314;--bm-gold:#B89470;--bm-brass:#C9A227;--bm-copper:#B87333;--bm-ivory:#FBF8F2;--bm-sand:#F4EEE4;--bm-line:#E6DAC4;--bm-line2:#D9C7A3;--bm-ok:#1F7A4D;--bm-warn:#B45309;--bm-danger:#9B1C1C}' +
  'html{scrollbar-color:var(--bm-gold) var(--bm-sand);scrollbar-width:thin}' +
  '::-webkit-scrollbar{width:11px;height:11px}::-webkit-scrollbar-track{background:var(--bm-sand)}' +
  '::-webkit-scrollbar-thumb{background:linear-gradient(180deg,var(--bm-gold),var(--bm-copper));border:2px solid var(--bm-sand);border-radius:9px}' +
  '::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,var(--bm-brass),var(--bm-red))}' +
  'section[id],main[id]{scroll-margin-top:96px}' +
  '#bmProgress{position:fixed;top:0;left:0;height:3px;width:0;z-index:2147482000;background:linear-gradient(90deg,var(--bm-brass),var(--bm-red),var(--bm-copper));transition:width .12s linear}' +
  '.head.is-stuck{box-shadow:0 10px 30px rgba(40,22,6,.14)}' +
  '.nav a.is-active{color:var(--bm-red)}' +
  '[data-bm-reveal]{opacity:0;transform:translateY(20px);transition:opacity .75s cubic-bezier(.2,.7,.2,1),transform .75s cubic-bezier(.2,.7,.2,1)}' +
  '[data-bm-reveal].bm-in{opacity:1;transform:none}[hidden]{display:none!important}' +
  '.customizer{display:grid!important;grid-template-columns:minmax(260px,400px) 1fr;gap:26px;align-items:start}' +
  '.at-stage{position:relative;width:100%;aspect-ratio:1/1;border-radius:14px;overflow:hidden;border:1px solid var(--bm-line2);background:radial-gradient(80% 70% at 50% 25%,#FFF9EC,#EFE6D6 60%,#DCCEB6)}' +
  '.at-stage img.at-photo{width:100%;height:100%;object-fit:contain;padding:8px;filter:drop-shadow(4px 12px 16px rgba(40,22,6,.28))}' +
  '.at-svgbox{position:absolute;inset:0;display:none}.at-svgbox.on{display:block}' +
  '.at-svgel{width:100%;height:100%;filter:drop-shadow(4px 12px 14px rgba(40,22,6,.3))}' +
  '.at-banner{position:absolute;top:51%;left:14%;right:14%;transform:translateY(-50%);text-align:center;color:#FBF8F2;font-family:"Saira Stencil One",Jost,sans-serif;letter-spacing:.04em;line-height:1.3;white-space:nowrap;overflow:hidden;text-shadow:0 2px 7px rgba(0,0,0,.6);pointer-events:none}' +
  '.at-curve{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}' +
  '.at-curve text{font-family:"Saira Stencil One",Jost,sans-serif;letter-spacing:.06em;fill:var(--bm-ivory);paint-order:stroke;stroke:rgba(0,0,0,.45);stroke-width:8px;stroke-linejoin:round}' +
  '.at-tag{position:absolute;left:10px;bottom:10px;font-size:12px;font-weight:600;background:rgba(27,31,35,.82);color:var(--bm-ivory);padding:5px 11px;border-radius:999px;font-family:Jost,sans-serif}' +
  '.at-controls{font-family:Jost,sans-serif;color:var(--bm-graphite);min-width:0}' +
  '.at-title{font-family:"Cormorant Garamond",serif;font-size:30px;font-weight:600;margin:0 0 6px;line-height:1.15}' +
  '.at-title em{font-style:italic;color:var(--bm-red)}' +
  '.at-note{font-size:14px;color:var(--bm-steel);margin:0 0 14px;line-height:1.5}' +
  '.at-types{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}' +
  '.at-type{display:flex;align-items:center;gap:7px;font-family:Jost,sans-serif;font-size:13.5px;font-weight:600;color:var(--bm-steel);background:#fff;border:1px solid var(--bm-line2);border-radius:999px;padding:9px 14px;cursor:pointer;transition:.16s}' +
  '.at-type span{font-size:15px;line-height:1}' +
  '.at-type b{font-weight:600;font-size:12px;color:var(--bm-copper)}' +
  '.at-type:hover{border-color:var(--bm-copper);transform:translateY(-1px)}' +
  '.at-type.is-on{background:linear-gradient(135deg,var(--bm-steel),var(--bm-ink));color:var(--bm-ivory);border-color:transparent;box-shadow:0 8px 20px rgba(27,31,35,.25)}' +
  '.at-type.is-on b{color:var(--bm-brass)}' +
  '.at-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}' +
  '.at-fld{display:flex;flex-direction:column;gap:6px;min-width:0}' +
  '.at-fld>span{font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:var(--bm-steel);font-weight:600}' +
  '.at-controls input,.at-controls select{width:100%;font-family:Jost,sans-serif;font-size:15px;color:var(--bm-graphite);background:#FFFDF9;border:1px solid var(--bm-line2);border-radius:7px;padding:11px 12px;outline:none;box-sizing:border-box}' +
  '.at-controls input:focus,.at-controls select:focus{border-color:var(--bm-red);box-shadow:0 0 0 3px rgba(143,46,27,.13)}' +
  '.at-colors{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}' +
  '.at-color{display:flex;align-items:center;gap:7px;font-family:Jost,sans-serif;font-size:13.5px;font-weight:600;color:var(--bm-steel);background:#fff;border:1px solid var(--bm-line2);border-radius:999px;padding:9px 13px;cursor:pointer}' +
  '.at-color i{width:13px;height:13px;border-radius:50%;display:block;box-shadow:0 0 0 1px rgba(0,0,0,.18)}' +
  '.at-color.is-on{background:linear-gradient(135deg,var(--bm-steel),var(--bm-ink));color:var(--bm-ivory);border-color:transparent}' +
  '.at-price{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:11px 14px;border-radius:10px;margin-bottom:12px;background:linear-gradient(135deg,rgba(201,162,39,.16),rgba(184,115,51,.16));border:1px solid var(--bm-line2)}' +
  '.at-price span{font-size:11.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--bm-steel);font-weight:600}' +
  '.at-price strong{font-size:26px;font-family:"Cormorant Garamond",serif;color:var(--bm-red)}' +
  '.at-cta{width:100%;font-family:Jost,sans-serif;font-size:16px;font-weight:600;color:#FFF3E8;border:0;border-radius:8px;padding:15px 20px;cursor:pointer;background:linear-gradient(135deg,var(--bm-red),var(--bm-red2));box-shadow:0 12px 26px rgba(143,46,27,.3);transition:.18s}' +
  '.at-cta:hover{transform:translateY(-1px)}' +
  '.at-legal{font-size:12px;color:var(--bm-steel);margin:10px 0 0;line-height:1.5}' +
  '#bmPill{position:fixed;right:18px;bottom:18px;z-index:2147481000;display:none;align-items:center;gap:9px;font-family:Jost,sans-serif;font-size:14px;font-weight:600;color:var(--bm-ivory);cursor:pointer;background:linear-gradient(135deg,var(--bm-steel),var(--bm-ink));border:1px solid rgba(201,162,39,.45);padding:12px 17px;border-radius:999px;box-shadow:0 16px 34px rgba(27,31,35,.35)}' +
  '#bmPill.on{display:flex}#bmPill b{background:var(--bm-brass);color:var(--bm-ink);border-radius:999px;padding:1px 8px;font-size:12.5px}' +
  '.bm-scrim{position:fixed;inset:0;z-index:2147482500;background:radial-gradient(120% 90% at 50% 0%,rgba(60,34,12,.55),rgba(15,12,9,.78));backdrop-filter:blur(4px);opacity:0;transition:opacity .28s}' +
  '.bm-scrim.on{opacity:1}' +
  '.bm-dialog{position:fixed;z-index:2147482600;left:50%;top:50%;transform:translate(-50%,-46%) scale(.97);opacity:0;width:min(1040px,96vw);max-height:92vh;display:flex;flex-direction:column;overflow:hidden;background:linear-gradient(180deg,#FFFDF9,var(--bm-ivory) 40%,var(--bm-sand));border:1px solid var(--bm-line2);border-radius:16px;box-shadow:0 40px 100px rgba(28,16,6,.5);font-family:Jost,sans-serif;color:var(--bm-graphite);transition:opacity .3s,transform .34s cubic-bezier(.2,.8,.2,1)}' +
  '.bm-dialog.on{opacity:1;transform:translate(-50%,-50%) scale(1)}' +
  '.bm-dialog *{box-sizing:border-box}' +
  '.bm-head{display:flex;align-items:center;gap:16px;padding:14px 18px;border-bottom:1px solid var(--bm-line);background:linear-gradient(90deg,rgba(244,238,228,.95),rgba(251,248,242,.95));flex:0 0 auto}' +
  '.bm-mark{font-family:"Saira Stencil One",Jost,sans-serif;font-size:17px;color:var(--bm-ivory);background:linear-gradient(135deg,var(--bm-steel),var(--bm-ink));padding:4px 10px 3px;border-radius:5px}' +
  '.bm-brandtxt{font-size:11.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--bm-steel);font-weight:600}' +
  '.bm-tabs{display:flex;gap:6px;margin-left:auto}' +
  '.bm-tab{font-family:Jost,sans-serif;font-size:13.5px;font-weight:600;color:var(--bm-steel);background:#fff;border:1px solid var(--bm-line2);border-radius:999px;padding:8px 14px;cursor:pointer}' +
  '.bm-tab.is-on{background:linear-gradient(135deg,var(--bm-steel),var(--bm-ink));color:var(--bm-ivory);border-color:transparent}' +
  '.bm-tab span{opacity:.75;font-size:12px}' +
  '.bm-close{background:none;border:0;font-size:27px;line-height:1;color:var(--bm-steel);cursor:pointer;padding:2px 8px;border-radius:8px}' +
  '.bm-close:hover{color:var(--bm-red);background:rgba(143,46,27,.08)}' +
  '.bm-body{overflow:auto;padding:20px 18px;flex:1 1 auto;overscroll-behavior:contain}' +
  '.bm-view{display:none}.bm-view.is-on{display:block;animation:bmIn .35s cubic-bezier(.2,.8,.2,1)}' +
  '@keyframes bmIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}' +
  '.bm-grid{display:grid;grid-template-columns:330px 1fr;gap:22px;align-items:start}' +
  '.bm-side{position:sticky;top:0}' +
  '.bm-stage{position:relative;width:100%;aspect-ratio:1/1;border-radius:14px;overflow:hidden;background:radial-gradient(80% 70% at 50% 25%,#FFF9EC,#EFE6D6 60%,#DCCEB6);border:1px solid var(--bm-line2)}' +
  '.bm-stage img{width:100%;height:100%;object-fit:contain;padding:8px;filter:drop-shadow(4px 12px 16px rgba(40,22,6,.28))}' +
  '.bm-svgbox{position:absolute;inset:0;display:none}.bm-svgbox.on{display:block}' +
  '.bm-pv{position:absolute;right:10px;top:10px;z-index:2;font-family:Jost,sans-serif;font-size:12px;font-weight:600;background:rgba(27,31,35,.85);color:var(--bm-ivory);border:1px solid rgba(201,162,39,.5);border-radius:999px;padding:7px 12px;cursor:pointer}' +
  '.bm-pv:hover{background:var(--bm-red)}' +
  '.bm-banner{position:absolute;top:51%;left:14%;right:14%;transform:translateY(-50%);text-align:center;color:#FBF8F2;font-family:"Saira Stencil One",Jost,sans-serif;letter-spacing:.04em;line-height:1.3;white-space:nowrap;overflow:hidden;text-shadow:0 2px 7px rgba(0,0,0,.6);pointer-events:none}' +
  '.bm-curve{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}' +
  '.bm-curve text{font-family:"Saira Stencil One",Jost,sans-serif;letter-spacing:.06em;fill:var(--bm-ivory);paint-order:stroke;stroke:rgba(0,0,0,.45);stroke-width:8px;stroke-linejoin:round}' +
  '.bm-metal{position:absolute;left:10px;bottom:10px;display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600;background:rgba(27,31,35,.82);color:var(--bm-ivory);padding:5px 10px;border-radius:999px}' +
  '.bm-metal i{width:10px;height:10px;border-radius:50%;display:block}' +
  '.bm-summary{margin-top:14px;background:#fff;border:1px solid var(--bm-line);border-radius:12px;padding:14px}' +
  '.bm-summary h3{font-family:"Cormorant Garamond",serif;font-size:22px;font-weight:600;margin:0 0 4px;line-height:1.2}' +
  '.bm-badge{font-size:12px;color:var(--bm-warn);font-weight:600;margin:0 0 10px}' +
  '.bm-lines{list-style:none;margin:0 0 10px;padding:0;font-size:13.5px;color:var(--bm-steel)}' +
  '.bm-lines li{display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px dashed var(--bm-line)}' +
  '.bm-lines li:last-child{border-bottom:0}' +
  '.bm-total{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:10px;background:linear-gradient(135deg,rgba(201,162,39,.16),rgba(184,115,51,.16));border:1px solid var(--bm-line2)}' +
  '.bm-total span{font-size:11.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--bm-steel);font-weight:600}' +
  '.bm-total strong{font-size:25px;font-family:"Cormorant Garamond",serif;color:var(--bm-red)}' +
  '.bm-fine{font-size:11.5px;color:var(--bm-steel);line-height:1.5;margin:9px 0 0}' +
  '.bm-block{background:#fff;border:1px solid var(--bm-line);border-radius:12px;padding:16px;margin-bottom:14px}' +
  '.bm-block h4{margin:0 0 12px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--bm-copper);font-weight:700}' +
  '.bm-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}' +
  '.bm-row.one{grid-template-columns:1fr}' +
  '.bm-fld{display:flex;flex-direction:column;gap:6px;min-width:0}' +
  '.bm-fld>span{font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:var(--bm-steel);font-weight:600}' +
  '.bm-dialog input,.bm-dialog select,.bm-dialog textarea{width:100%;font-family:Jost,sans-serif;font-size:15px;color:var(--bm-graphite);background:#FFFDF9;border:1px solid var(--bm-line2);border-radius:7px;padding:11px 12px;outline:none;transition:.18s}' +
  '.bm-dialog input:focus,.bm-dialog select:focus,.bm-dialog textarea:focus{border-color:var(--bm-red);box-shadow:0 0 0 3px rgba(143,46,27,.13)}' +
  '.bm-dialog textarea{resize:vertical;min-height:84px}' +
  '.bm-dialog input[aria-invalid="true"]{border-color:var(--bm-danger);box-shadow:0 0 0 3px rgba(155,28,28,.12)}' +
  '.bm-err{font-size:12px;color:var(--bm-danger);margin:8px 0 0}' +
  '.bm-chips{display:flex;gap:8px;flex-wrap:wrap}' +
  '.bm-chip{display:flex;align-items:center;gap:7px;font-family:Jost,sans-serif;font-size:13.5px;font-weight:600;color:var(--bm-steel);background:#fff;border:1px solid var(--bm-line2);border-radius:999px;padding:9px 13px;cursor:pointer}' +
  '.bm-chip i{width:13px;height:13px;border-radius:50%;display:block;box-shadow:0 0 0 1px rgba(0,0,0,.18)}' +
  '.bm-chip.is-on{background:linear-gradient(135deg,var(--bm-steel),var(--bm-ink));color:var(--bm-ivory);border-color:transparent}' +
  '.bm-step{display:flex;align-items:center;border:1px solid var(--bm-line2);border-radius:7px;overflow:hidden;background:#FFFDF9}' +
  '.bm-step button{width:44px;height:44px;border:0;background:var(--bm-sand);color:var(--bm-graphite);font-size:20px;cursor:pointer}' +
  '.bm-step button:hover{background:var(--bm-red);color:#fff}' +
  '.bm-step input{border:0;border-radius:0;text-align:center;background:transparent;-moz-appearance:textfield}' +
  '.bm-step input::-webkit-outer-spin-button,.bm-step input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}' +
  '.bm-seg{display:flex;border:1px solid var(--bm-line2);border-radius:7px;overflow:hidden}' +
  '.bm-seg button{flex:1;border:0;background:#FFFDF9;font-family:Jost,sans-serif;font-size:13.5px;font-weight:600;color:var(--bm-steel);padding:11px 8px;cursor:pointer}' +
  '.bm-seg button.is-on{background:linear-gradient(135deg,var(--bm-copper),var(--bm-red));color:#FFF6EC}' +
  '.bm-toggle{display:flex;align-items:center;gap:10px;font-size:14px;cursor:pointer;align-self:end;padding-bottom:11px}' +
  '.bm-toggle input{width:20px;height:20px;accent-color:var(--bm-red)}' +
  '.bm-hint{font-size:12.5px;color:var(--bm-steel);line-height:1.5;margin:0}' +
  '.bm-drop{border:2px dashed var(--bm-line2);border-radius:12px;padding:20px 16px;text-align:center;cursor:pointer;background:linear-gradient(180deg,#FFFDF9,#F7F1E5);transition:.18s}' +
  '.bm-drop:hover,.bm-drop:focus{border-color:var(--bm-copper);background:#FFF8EA;outline:none}' +
  '.bm-drop.is-over{border-color:var(--bm-red);background:#FDEFE7}' +
  '.bm-drop strong{display:block;font-size:15px;color:var(--bm-graphite);margin-bottom:5px}' +
  '.bm-drop span{display:block;font-size:12.5px;color:var(--bm-steel);line-height:1.5}' +
  '.bm-files{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-direction:column;gap:8px}' +
  '.bm-files li{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--bm-line);border-radius:9px;padding:10px 12px;font-size:13.5px}' +
  '.bm-files .bm-fi{width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;background:linear-gradient(135deg,var(--bm-steel),var(--bm-ink));flex:0 0 auto}' +
  '.bm-files .bm-fn{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}' +
  '.bm-files .bm-fs{color:var(--bm-steel);font-size:12px}' +
  '.bm-files button{background:#fff;border:1px solid var(--bm-line2);border-radius:6px;padding:6px 10px;font-size:12px;font-weight:600;cursor:pointer;color:var(--bm-red);font-family:Jost,sans-serif}' +
  '.bm-files button:hover{background:var(--bm-red);color:#fff}' +
  '.bm-ftotal{font-size:12px;color:var(--bm-steel);margin:8px 0 0}' +
  '.bm-foot{flex:0 0 auto;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:14px 18px;border-top:1px solid var(--bm-line);background:linear-gradient(90deg,rgba(244,238,228,.98),rgba(251,248,242,.98))}' +
  '.bm-btn{font-family:Jost,sans-serif;font-size:14.5px;font-weight:600;border-radius:8px;padding:13px 20px;cursor:pointer;border:1px solid transparent;text-decoration:none;display:inline-flex;align-items:center;gap:8px;transition:.18s;line-height:1}' +
  '.bm-send{background:linear-gradient(135deg,var(--bm-red),var(--bm-red2));color:#FFF3E8;box-shadow:0 10px 24px rgba(143,46,27,.3)}' +
  '.bm-send:hover{transform:translateY(-1px)}' +
  '.bm-send:disabled{opacity:.65;cursor:progress;transform:none}' +
  '.bm-wa{background:linear-gradient(135deg,#1F7A4D,#155F3B);color:#fff}' +
  '.bm-ghost{background:#fff;color:var(--bm-graphite);border-color:var(--bm-line2)}' +
  '.bm-ghost:hover{border-color:var(--bm-red);color:var(--bm-red)}' +
  '.bm-status{font-size:13px;margin-left:auto;max-width:44%;text-align:right;line-height:1.4}' +
  '.bm-status.ok{color:var(--bm-ok)}.bm-status.err{color:var(--bm-danger)}.bm-status.warn{color:var(--bm-warn)}' +
  '.bm-mailmenu{position:absolute;right:18px;bottom:80px;z-index:6;width:min(330px,92vw);background:#fff;border:1px solid var(--bm-line2);border-radius:12px;box-shadow:0 26px 60px rgba(28,16,6,.38);padding:10px;display:none}' +
  '.bm-mailmenu.on{display:block;animation:bmIn .22s}' +
  '.bm-mailmenu h6{margin:2px 6px 8px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--bm-steel)}' +
  '.bm-mailmenu a{display:flex;align-items:center;gap:11px;padding:11px 12px;border-radius:9px;text-decoration:none;color:var(--bm-graphite);font-size:14.5px;font-weight:600}' +
  '.bm-mailmenu a:hover{background:var(--bm-sand);color:var(--bm-red)}' +
  '.bm-mailmenu a i{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:13px;font-weight:700;color:#fff;flex:0 0 auto}' +
  '.bm-mailmenu p{margin:8px 6px 2px;font-size:11.5px;color:var(--bm-steel);line-height:1.45}' +
  '.bm-hlist{display:flex;flex-direction:column;gap:12px}' +
  '.bm-ocard{background:#fff;border:1px solid var(--bm-line);border-radius:12px;padding:14px;display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center}' +
  '.bm-ocard h5{margin:0 0 4px;font-family:"Cormorant Garamond",serif;font-size:19px;font-weight:600}' +
  '.bm-ocard p{margin:0;font-size:12.5px;color:var(--bm-steel)}' +
  '.bm-tag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 9px;border-radius:999px;margin-left:8px}' +
  '.bm-tag.sent{background:rgba(31,122,77,.14);color:var(--bm-ok)}' +
  '.bm-tag.pending{background:rgba(180,83,9,.15);color:var(--bm-warn)}' +
  '.bm-oact{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}' +
  '.bm-mini{font-family:Jost,sans-serif;font-size:12.5px;font-weight:600;background:#fff;border:1px solid var(--bm-line2);border-radius:6px;padding:8px 11px;cursor:pointer;color:var(--bm-graphite);text-decoration:none;display:inline-block}' +
  '.bm-mini:hover{border-color:var(--bm-red);color:var(--bm-red)}' +
  '.bm-mini.del:hover{background:var(--bm-danger);color:#fff;border-color:var(--bm-danger)}' +
  '.bm-empty{text-align:center;padding:34px 16px;color:var(--bm-steel)}' +
  '.bm-empty strong{display:block;font-family:"Cormorant Garamond",serif;font-size:22px;color:var(--bm-graphite);margin-bottom:6px}' +
  '.bm-done{max-width:620px;margin:6px auto;text-align:center;padding:8px 4px}' +
  '.bm-check{width:82px;height:82px;margin:0 auto 14px;display:block}' +
  '.bm-check circle{fill:none;stroke:var(--bm-ok);stroke-width:4;opacity:.35}' +
  '.bm-check path{fill:none;stroke:var(--bm-ok);stroke-width:6;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:60;stroke-dashoffset:60;animation:bmDraw .6s .12s cubic-bezier(.2,.8,.2,1) forwards}' +
  '@keyframes bmDraw{to{stroke-dashoffset:0}}' +
  '.bm-done h3{font-family:"Cormorant Garamond",serif;font-size:30px;margin:0 0 8px;font-weight:600}' +
  '.bm-done .bm-code{display:inline-block;font-family:"Saira Stencil One",Jost,sans-serif;font-size:19px;background:linear-gradient(135deg,var(--bm-steel),var(--bm-ink));color:var(--bm-brass);padding:8px 16px;border-radius:8px;margin:6px 0 12px}' +
  '.bm-done p{font-size:14.5px;color:var(--bm-steel);line-height:1.6;margin:0 auto 10px;max-width:520px}' +
  '.bm-recap{text-align:left;background:#fff;border:1px solid var(--bm-line);border-radius:12px;padding:14px;margin:14px 0;font-size:13.5px;white-space:pre-wrap;max-height:210px;overflow:auto}' +
  '#bmToast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(14px);z-index:2147483000;display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,var(--bm-steel),var(--bm-ink));color:var(--bm-ivory);font-family:Jost,sans-serif;font-size:14px;padding:13px 18px;border-radius:10px;border:1px solid rgba(201,162,39,.4);box-shadow:0 20px 44px rgba(0,0,0,.4);opacity:0;pointer-events:none;transition:.26s;max-width:92vw}' +
  '#bmToast.on{opacity:1;transform:translateX(-50%);pointer-events:auto}' +
  'body.bm-modal-open #bmToast{bottom:auto;top:16px}' +
  '#bmToast button{background:var(--bm-brass);color:var(--bm-ink);border:0;border-radius:6px;padding:7px 12px;font-weight:700;cursor:pointer;font-family:Jost,sans-serif}' +
  '@media(max-width:900px){.customizer{grid-template-columns:1fr!important}.at-stage{max-width:340px;margin:0 auto}.bm-grid{grid-template-columns:1fr}.bm-side{position:static}.bm-stage{max-width:330px;margin:0 auto}}' +
  '@media(max-width:640px){.at-row{grid-template-columns:1fr}.at-title{font-size:26px}' +
    '.bm-dialog{left:0;top:0;transform:translateY(24px);width:100vw;height:100dvh;max-height:100dvh;border-radius:0;border:0}.bm-dialog.on{transform:none}' +
    '.bm-head{padding:12px 14px;gap:10px}.bm-brandtxt{display:none}.bm-body{padding:14px 14px 4px}.bm-row{grid-template-columns:1fr}' +
    '.bm-foot{padding:12px 14px calc(12px + env(safe-area-inset-bottom));gap:8px}.bm-btn{flex:1 1 46%;justify-content:center;padding:13px 12px}' +
    '.bm-status{flex:1 1 100%;max-width:100%;text-align:left;margin-left:0}.bm-mailmenu{right:8px;left:8px;width:auto;bottom:120px}' +
    '.bm-ocard{grid-template-columns:1fr}.bm-oact{justify-content:flex-start}#bmPill{right:12px;bottom:12px}}' +
  '@media(prefers-reduced-motion:reduce){*{animation-duration:.001s!important;transition-duration:.001s!important}}';
  var styleEl = document.createElement('style'); styleEl.textContent = CSS; document.head.appendChild(styleEl);

  /* ===================== RENDER SITE ===================== */
  text('year', String(new Date().getFullYear()));
  ['headMail', 'contactMail', 'footMail', 'footMail2'].forEach(function (id) {
    var e = $(id); if (e) { e.textContent = MAIL; e.setAttribute('href', 'mailto:' + MAIL); }
  });
  if (S.band) html('bandText', esc(S.band).replace('{email}', '<a href="mailto:' + esc(MAIL) + '">' + esc(MAIL) + '</a>'));
  html('heroEyebrow', esc(S.heroEyebrow || ''));
  html('heroTitle', esc(S.heroTitleA || '') + '<br><em>' + esc(S.heroTitleB || '') + '</em>');
  text('heroLead', S.heroLead || ''); text('priceFrom', S.priceFrom || ''); text('priceNote', S.priceNote || '');
  html('aboutEyebrow', esc(S.aboutEyebrow || ''));
  html('aboutTitle', esc(S.aboutTitleA || '') + '<br><em>' + esc(S.aboutTitleB || '') + '</em>');
  text('aboutP1', S.aboutP1 || ''); text('aboutP2', S.aboutP2 || '');
  if (S.aboutImg) { attr('aboutImg', 'src', S.aboutImg); attr('aboutImg', 'alt', S.aboutImgAlt || ''); }
  html('materialsEyebrow', esc(S.materialsEyebrow || ''));
  html('materialsTitle', esc(S.materialsTitleA || '') + '<em>' + esc(S.materialsTitleB || '') + '</em>');
  text('materialsSub', S.materialsSub || '');
  html('collectionEyebrow', esc(S.collectionEyebrow || ''));
  html('collectionTitle', esc(S.collectionTitleA || '') + '<em>' + esc(S.collectionTitleB || '') + '</em>');
  text('collectionSub', S.collectionSub || '');
  html('stepsEyebrow', esc(S.stepsEyebrow || ''));
  html('stepsTitle', esc(S.stepsTitleA || '') + '<em>' + esc(S.stepsTitleB || '') + '</em>');
  html('faqEyebrow', esc(S.faqEyebrow || ''));
  html('faqTitle', esc(S.faqTitleA || '') + '<em>' + esc(S.faqTitleB || '') + '</em>');
  html('contactEyebrow', esc(S.contactEyebrow || ''));
  html('contactTitle', esc(S.contactTitleA || '') + '<em>' + esc(S.contactTitleB || '') + '</em>');
  text('contactLead', S.contactLead || '');
  text('formNameLabel', S.formNameLabel || 'Numele tău'); text('formEmailLabel', S.formEmailLabel || 'Email');
  text('formModelLabel', S.formModelLabel || 'Ce vrei să comanzi?'); text('formMsgLabel', S.formMsgLabel || 'Mesajul tău');
  text('formBtn', S.formBtn || 'Trimite comanda →'); text('formLegal', S.formLegal || '');
  if (S.contactImg) { attr('contactImg', 'src', S.contactImg); attr('contactImg', 'alt', S.contactImgAlt || ''); }
  html('finalTitle', esc(S.finalTitleA || '') + '<em>' + esc(S.finalTitleB || '') + '</em>');
  text('finalText', S.finalText || ''); text('finalBtn', S.finalBtn || 'Personalizează piesa');
  html('footerTagline', S.footerTagline || '');
  var cfName = $('cfName'); if (cfName && S.formNamePlaceholder) cfName.placeholder = S.formNamePlaceholder;
  var cfEmail = $('cfEmail'); if (cfEmail && S.formEmailPlaceholder) cfEmail.placeholder = S.formEmailPlaceholder;
  var cfMsg = $('cfMsg'); if (cfMsg && S.formMsgPlaceholder) cfMsg.placeholder = S.formMsgPlaceholder;
  if (S.city) text('footCity', S.city);
  if (S.county) text('footCounty', S.county.charAt(0).toUpperCase() + S.county.slice(1) + (S.country ? ', ' + S.country : ''));
  text('contactAddr', [S.city, S.county, S.country].filter(Boolean).join(', '));
  text('contactProg', S.program || '');
  var trustIn = $('trustIn');
  if (trustIn && Array.isArray(S.trust)) trustIn.innerHTML = S.trust.map(function (t) {
    return '<div class="tr"><span class="tr-ic">' + esc(t.ic) + '</span><strong>' + esc(t.title) + '</strong><p>' + esc(t.text) + '</p></div>';
  }).join('');
  var mats = $('mats');
  if (mats) mats.innerHTML = MATERIALS.map(function (m) {
    return '<div class="mat"><span class="mat-dot" style="background:' + esc(m.color) + '"></span><h3>' + esc(m.name) + '</h3><p>' + esc(m.desc || '') + '</p></div>';
  }).join('');
  var stepsEl = $('steps');
  if (stepsEl && Array.isArray(S.steps)) stepsEl.innerHTML = S.steps.map(function (st) {
    return '<div class="step"><span class="n">' + esc(st.n) + '</span><h3>' + esc(st.title) + '</h3><p>' + esc(st.text) + '</p></div>';
  }).join('');
  var faqList = $('faqList');
  if (faqList && Array.isArray(S.faq)) faqList.innerHTML = S.faq.map(function (f) {
    return '<details><summary>' + esc(f.q) + '<span class="plus">+</span></summary><p>' + esc(f.a) + '</p></details>';
  }).join('');
  function productById(id) { for (var i = 0; i < products.length; i++) if (products[i].id === id) return products[i]; return null; }
  function productByName(n) { var k = CORE.norm(n); for (var i = 0; i < products.length; i++) if (CORE.norm(products[i].name) === k) return products[i]; return null; }
  function isPers(p) { return !!(p && String(p.cat || '').indexOf('personalizate') >= 0); }
  function orderMailto(p) {
    return CORE.mailto((S.orderSubjectPrefix || 'Comandă:') + ' ' + p.name,
      'Bună!\n\nCOMANDĂ:\n• Piesă: ' + p.name + '\n• Preț afișat: ' + p.price + ' lei\n\nDatele mele:\n• Nume: \n• Telefon: \n\nMulțumesc!');
  }
  var track = $('marqueeTrack');
  if (track && products.length) {
    track.innerHTML = products.slice(0, 14).map(function (p) { return '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy">'; }).join('');
    track.innerHTML += track.innerHTML;
  }
  var grid = $('grid');
  if (grid) grid.innerHTML = products.map(function (p) {
    var bc = String(p.cat || '').indexOf('personalizate') !== -1 ? 'badge badge-custom' : 'badge';
    return '<article class="card" data-cat="' + esc(p.cat || '') + '"><span class="' + bc + '">' + esc(p.badge || '') + '</span>' +
      '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy">' +
      '<div class="card-b"><h3>' + esc(p.name) + '</h3><p class="card-p">' + esc(p.price) + ' lei</p>' +
      '<a class="card-a" href="' + orderMailto(p) + '" data-order="' + esc(p.id) + '">Comandă →</a></div></article>';
  }).join('');
  var filters = $('filters');
  if (filters && Array.isArray(S.filters)) {
    var counts = {};
    products.forEach(function (p) { String(p.cat || '').split(/\s+/).forEach(function (c) { if (c) counts[c] = (counts[c] || 0) + 1; }); });
    filters.innerHTML = S.filters.map(function (f, i) {
      var n = f.id === 'toate' ? products.length : (counts[f.id] || 0);
      return '<button class="fbtn' + (i === 0 ? ' is-on' : '') + '" data-f="' + esc(f.id) + '">' + esc(f.label) + (n ? ' <span>' + n + '</span>' : '') + '</button>';
    }).join('');
    var fbtns = filters.querySelectorAll('.fbtn');
    Array.prototype.forEach.call(fbtns, function (btn) {
      btn.addEventListener('click', function () {
        Array.prototype.forEach.call(fbtns, function (b) { b.classList.remove('is-on'); });
        btn.classList.add('is-on');
        var f = btn.getAttribute('data-f');
        Array.prototype.forEach.call(document.querySelectorAll('#grid .card'), function (card) {
          var cats = String(card.getAttribute('data-cat') || '').split(/\s+/);
          card.classList.toggle('is-hidden', !(f === 'toate' || cats.indexOf(f) !== -1));
        });
      });
    });
  }
  var cfModel = $('cfModel');
  if (cfModel && products.length) {
    var opts = products.slice(0, 12).map(function (p) { return '<option>' + esc(p.name) + '</option>'; });
    opts.push('<option>Alt model (scriu mai jos)</option>');
    cfModel.innerHTML = opts.join('');
  }

  /* ===================== ATELIER ===================== */
  var P = { shape: 'coronita', t1: '', t2: '', material: MATERIALS[0].name, color: 'negru', size: 40 };
  var atMatKey = '';
  var cust = document.querySelector('.customizer');
  if (cust) {
    cust.innerHTML =
      '<div class="at-stage" id="atStage">' +
        '<img class="at-photo" id="atPhoto" alt="Previzualizare piesă personalizată">' +
        '<div class="at-svgbox" id="atSvg"></div>' +
        '<span class="at-banner" id="atBanner"></span>' +
        '<svg class="at-curve" id="atCurveSvg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
          '<defs><path id="atArc" d="' + ARC + '" fill="none"></path></defs>' +
          '<text id="atCurve" font-size="46"><textPath href="#atArc" startOffset="50%" text-anchor="middle"></textPath></text>' +
        '</svg><span class="at-tag" id="atTag"></span></div>' +
      '<div class="at-controls">' +
        '<h2 class="at-title" id="atTitle"></h2>' +
        '<p class="at-note" id="atNote">Alege piesa, scrie textul și vezi cum arată înainte să tăiem. Îți trimitem proiectul, apoi confirmi.</p>' +
        '<div class="at-types" id="atTypes"></div>' +
        '<div class="at-row">' +
          '<label class="at-fld"><span id="atL1">Nume</span><input id="atT1" type="text" autocomplete="off"></label>' +
          '<label class="at-fld"><span id="atL2">Text secundar</span><input id="atT2" type="text" autocomplete="off"></label>' +
        '</div>' +
        '<div class="at-row">' +
          '<label class="at-fld"><span>Material</span><select id="atMat"></select></label>' +
          '<label class="at-fld"><span>Dimensiune</span><select id="atSize"></select></label>' +
        '</div>' +
        '<div class="at-colors" id="atColors"></div>' +
        '<div class="at-price"><span>Estimare</span><strong id="atPrice">0 lei</strong></div>' +
        '<button type="button" class="at-cta" id="atOrder">Comandă piesa →</button>' +
        '<p class="at-legal">Nu plătești acum. Prețul final îl confirmăm după proiect, în funcție de material și dimensiune.</p>' +
      '</div>';
    var tb = S.customTitleB && S.customTitleB !== 'ornamentul' ? S.customTitleB : 'piesa';
    html('atTitle', esc(S.customTitleA || 'Fă-ți ') + '<em>' + esc(tb) + '</em>');
    if (S.customNote) text('atNote', S.customNote);
    $('atTypes').innerHTML = SHAPES.map(function (s) {
      return '<button type="button" class="at-type" data-sh="' + s.id + '"><span>' + s.ic + '</span>' + esc(s.label) +
        ' <b>' + CORE.from(s.base, s.sizes) + ' lei</b></button>';
    }).join('');
    $('atColors').innerHTML = CORE.colors.map(function (c) {
      return '<button type="button" class="at-color" data-c="' + c.v + '"><i style="background:' + c.hex + '"></i>' + esc(c.label) + '</button>';
    }).join('');

    function atSizes() {
      var sh = shapeById(P.shape);
      $('atSize').innerHTML = sh.sizes.map(function (s) {
        return '<option value="' + s.v + '">' + s.label + ' · ' + CORE.money(sh.base * s.mul) + '</option>';
      }).join('');
      var found = false;
      sh.sizes.forEach(function (s) { if (s.v === P.size) found = true; });
      if (!found) P.size = sh.sizes[Math.min(1, sh.sizes.length - 1)].v;
      $('atSize').value = String(P.size);
      atMats();
    }
    function atMats() {
      var sh = shapeById(P.shape), sz = null;
      sh.sizes.forEach(function (s) { if (s.v === P.size) sz = s; });
      if (!sz) sz = sh.sizes[0];
      var key = sh.base + '|' + sz.mul;
      if (key === atMatKey) return;
      atMatKey = key;
      $('atMat').innerHTML = MATERIALS.map(function (m) {
        var add = CORE.matAddFor(sh.base, sz.mul, m.name);
        return '<option value="' + esc(m.name) + '">' + esc(m.name) + (add ? ' (+' + add + ' lei)' : ' (inclus)') + '</option>';
      }).join('');
      $('atMat').value = P.material;
    }
    function atLabels() {
      var sh = shapeById(P.shape);
      text('atL1', sh.t1.label); text('atL2', sh.t2.label);
      var a = $('atT1'), b = $('atT2');
      a.maxLength = sh.t1.max; b.maxLength = sh.t2.max;
      a.value = P.t1; b.value = P.t2;
      a.placeholder = sh.t1.def; b.placeholder = sh.t2.def;
    }
    function atRender() {
      var sh = shapeById(P.shape);
      var o = { pname: P.t1 || sh.t1.def, pcurve: P.t2 || sh.t2.def, color: P.color };
      var photo = $('atPhoto'), box = $('atSvg'), banner = $('atBanner'), curve = $('atCurve'), csvg = $('atCurveSvg');
      if (sh.photo) {
        box.classList.remove('on'); box.innerHTML = '';
        photo.hidden = false;
        var src = SRC[P.color] || SRC.negru;
        if (photo.getAttribute('src') !== src) photo.setAttribute('src', src);
        var w = $('atStage').clientWidth || 320;
        var t = String(o.pname).toUpperCase();
        banner.style.visibility = t ? 'visible' : 'hidden';
        banner.textContent = t;
        var size = Math.max(11, w * 0.072), guard = 0;
        banner.style.fontSize = size + 'px';
        while (banner.scrollWidth > banner.clientWidth && size > 9 && guard < 60) { size -= 1; banner.style.fontSize = size + 'px'; guard++; }
        var tp = curve.querySelector('textPath');
        if (tp) tp.textContent = String(o.pcurve).toUpperCase();
        csvg.style.visibility = 'visible';
        fitCurveExact(curve, $('atArc'), 46);
      } else {
        photo.hidden = true; banner.style.visibility = 'hidden'; csvg.style.visibility = 'hidden';
        box.classList.add('on'); box.innerHTML = shapeSVG(P.shape, o, 'at');
      }
      var sz = null;
      sh.sizes.forEach(function (s) { if (s.v === P.size) sz = s; });
      if (!sz) sz = sh.sizes[0];
      atMats();
      text('atPrice', CORE.money(sh.base * sz.mul + CORE.matAddFor(sh.base, sz.mul, P.material)));
      text('atTag', sh.label + ' · ' + sz.label + ' · ' + P.material);
      Array.prototype.forEach.call(document.querySelectorAll('.at-type'), function (b) { b.classList.toggle('is-on', b.getAttribute('data-sh') === P.shape); });
      Array.prototype.forEach.call(document.querySelectorAll('.at-color'), function (b) { b.classList.toggle('is-on', b.getAttribute('data-c') === P.color); });
    }
    function atSelect(id) {
      P.shape = id;
      var sh = shapeById(id);
      P.t1 = sh.t1.def; P.t2 = sh.t2.def;
      atSizes(); atLabels(); atRender();
    }
    $('atTypes').addEventListener('click', function (e) { var b = e.target.closest('[data-sh]'); if (b) atSelect(b.getAttribute('data-sh')); });
    $('atColors').addEventListener('click', function (e) { var b = e.target.closest('[data-c]'); if (b) { P.color = b.getAttribute('data-c'); atRender(); } });
    $('atT1').addEventListener('input', function () { P.t1 = this.value; atRender(); });
    $('atT2').addEventListener('input', function () { P.t2 = this.value; atRender(); });
    $('atMat').addEventListener('change', function () { P.material = this.value; atRender(); });
    $('atSize').addEventListener('change', function () { P.size = +this.value; atSizes(); atRender(); });
    $('atOrder').addEventListener('click', function () {
      openDialog({ type: 'custom', cfg: { shape: P.shape, t1: P.t1, t2: P.t2, material: P.material, color: P.color, size: P.size } });
    });
    atSelect('coronita');
    window.addEventListener('resize', atRender);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(atRender);
    setTimeout(atRender, 400);
    setTimeout(atRender, 1200);
  }

  var burger = $('burger'), nav = $('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* ===================== PROGRES / REVEAL ===================== */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var prog = document.createElement('div'); prog.id = 'bmProgress'; document.body.appendChild(prog);
  var head = document.querySelector('.head'), ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.width = (h > 0 ? Math.min(100, (window.pageYOffset / h) * 100) : 0) + '%';
      if (head) head.classList.toggle('is-stuck', window.pageYOffset > 8);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if ('IntersectionObserver' in window) {
    var navLinks = nav ? [].slice.call(nav.querySelectorAll('a[href^="#"]')) : [];
    if (navLinks.length) {
      var secObs = new IntersectionObserver(function (en) {
        en.forEach(function (x) {
          if (!x.isIntersecting) return;
          navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + x.target.id); });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      navLinks.forEach(function (a) { var t = document.getElementById(a.getAttribute('href').slice(1)); if (t) secObs.observe(t); });
    }
    if (!reduce) {
      var rev = [].slice.call(document.querySelectorAll('.sec, .atelier, .trust, .final'));
      rev.forEach(function (e) { e.setAttribute('data-bm-reveal', ''); });
      var ro = new IntersectionObserver(function (en) {
        en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('bm-in'); ro.unobserve(x.target); } });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
      rev.forEach(function (e) { ro.observe(e); });
      setTimeout(function () { rev.forEach(function (e) { e.classList.add('bm-in'); }); }, 2600);
    }
  }

  /* ===================== TOAST ===================== */
  var toastEl = document.createElement('div'); toastEl.id = 'bmToast'; document.body.appendChild(toastEl);
  var toastTimer = null;
  function toast(msg, label, action) {
    toastEl.innerHTML = '<span>' + esc(msg) + '</span>';
    if (label && action) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = label;
      b.addEventListener('click', function () { action(); hideToast(); });
      toastEl.appendChild(b);
    }
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, label ? 7000 : 3400);
  }
  function hideToast() { toastEl.classList.remove('on'); }

  /* ===================== DIALOG ===================== */
  var scrim = document.createElement('div'); scrim.className = 'bm-scrim'; scrim.hidden = true; document.body.appendChild(scrim);
  var dlg = document.createElement('div');
  dlg.className = 'bm-dialog'; dlg.hidden = true;
  dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true');
  dlg.innerHTML =
    '<header class="bm-head"><span class="bm-mark">BRM</span><span class="bm-brandtxt">Tecnical · comandă</span>' +
      '<nav class="bm-tabs">' +
        '<button type="button" class="bm-tab is-on" data-act="view" data-v="order">Comandă</button>' +
        '<button type="button" class="bm-tab" data-act="view" data-v="hist">Comenzile mele <span id="bmHistCount">0</span></button>' +
      '</nav><button type="button" class="bm-close" data-act="close" aria-label="Închide">&times;</button></header>' +
    '<div class="bm-body" id="bmBody">' +
      '<section class="bm-view is-on" id="bmViewOrder"><div class="bm-grid">' +
        '<aside class="bm-side"><div class="bm-stage" id="bmStage">' +
          '<img id="bmImg" alt="Fotografie piesă"><div class="bm-svgbox" id="bmSvg"></div>' +
          '<button type="button" class="bm-pv" id="bmPvBtn" data-act="pv">Previzualizare text</button>' +
          '<span class="bm-banner" id="bmBanner"></span>' +
          '<svg class="bm-curve" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
            '<defs><path id="bmCurvePath" d="' + ARC + '" fill="none"></path></defs>' +
            '<text id="bmCurveText" font-size="46"><textPath href="#bmCurvePath" startOffset="50%" text-anchor="middle"></textPath></text>' +
          '</svg><span class="bm-metal" id="bmMetalTag"><i></i><span></span></span></div>' +
          '<div class="bm-summary"><h3 id="bmTitle">Comandă</h3><p class="bm-badge" id="bmBadge"></p>' +
            '<ul class="bm-lines" id="bmLines"></ul>' +
            '<div class="bm-total"><span>Estimare</span><strong id="bmTotal">0 lei</strong></div>' +
            '<p class="bm-fine">Prețul final îl confirmăm după proiect. Nu plătești acum — întâi vezi desenul.</p></div></aside>' +
        '<div class="bm-main">' +
          '<div class="bm-block"><h4>1 · Piesa</h4>' +
            '<div class="bm-row one" id="bmShapeRow"><label class="bm-fld"><span>Tip piesă</span><select id="bmShape"></select></label></div>' +
            '<div class="bm-row">' +
              '<label class="bm-fld"><span>Material</span><select id="bmMaterial"></select></label>' +
              '<label class="bm-fld"><span>Dimensiune</span><select id="bmSize"></select></label></div>' +
            '<div class="bm-row">' +
              '<div class="bm-fld"><span>Culoare</span><div class="bm-chips" id="bmColors"></div></div>' +
              '<div class="bm-fld"><span>Bucăți</span><div class="bm-step">' +
                '<button type="button" data-act="qty" data-v="-1">−</button>' +
                '<input id="bmQty" type="number" min="1" max="20" value="1">' +
                '<button type="button" data-act="qty" data-v="1">+</button></div></div></div>' +
            '<div class="bm-row" id="bmPersRow">' +
              '<label class="bm-fld"><span id="bmL1">Nume pe banner</span><input id="bmName" type="text" maxlength="26" autocomplete="off"></label>' +
              '<label class="bm-fld"><span id="bmL2">Text curbat jos</span><input id="bmCurve" type="text" maxlength="34" autocomplete="off"></label></div>' +
            '<div class="bm-row"><div class="bm-fld"><span>Livrare</span><div class="bm-seg" id="bmDelivery">' +
              '<button type="button" class="is-on" data-act="del" data-v="curier">Curier</button>' +
              '<button type="button" data-act="del" data-v="atelier">Ridic din atelier</button></div></div>' +
              '<label class="bm-toggle"><input type="checkbox" id="bmGift"><span>Ambalaj cadou (+' + CFG.gift + ' lei)</span></label></div>' +
            '<p class="bm-hint" id="bmPersHint"></p></div>' +
          '<div class="bm-block"><h4>2 · Datele tale</h4>' +
            '<div class="bm-row">' +
              '<label class="bm-fld"><span>Nume și prenume *</span><input id="bmCName" type="text" autocomplete="name"><span class="bm-err" id="bmEName"></span></label>' +
              '<label class="bm-fld"><span>Telefon *</span><input id="bmCPhone" type="tel" autocomplete="tel" placeholder="07xx xxx xxx"><span class="bm-err" id="bmEPhone"></span></label></div>' +
            '<div class="bm-row">' +
              '<label class="bm-fld"><span>Email</span><input id="bmCMail" type="email" autocomplete="email" placeholder="pentru proiect și factură"><span class="bm-err" id="bmEMail"></span></label>' +
              '<label class="bm-fld"><span>Termen dorit</span><input id="bmCDate" type="date"></label></div>' +
            '<div class="bm-row one"><label class="bm-fld"><span>Oraș / adresă livrare *</span>' +
              '<input id="bmCAddr" type="text" autocomplete="street-address" placeholder="oraș, stradă, număr, județ"><span class="bm-err" id="bmEAddr"></span></label></div>' +
            '<div class="bm-row one"><label class="bm-fld"><span>Mesaj pentru atelier</span>' +
              '<textarea id="bmCMsg" rows="3" placeholder="text dorit, dimensiuni speciale, logo, întrebări…"></textarea></label></div>' +
            '<p class="bm-hint">Răspundem în 24 de ore cu proiectul.</p></div>' +
          '<div class="bm-block"><h4>3 · Fișierul tău (opțional)</h4>' +
            '<div class="bm-drop" id="bmDrop" tabindex="0" role="button">' +
              '<strong>Trage fișierul aici sau apasă să alegi</strong>' +
              '<span>DXF · DWG · SVG · AI · EPS · PDF · PNG · JPG — maxim ' + CFG.maxFiles + ' fișiere, ' + fsize(CFG.maxTotal) + ' total</span></div>' +
            '<input type="file" id="bmFileInput" multiple accept="' + ACCEPT + '" hidden>' +
            '<ul class="bm-files" id="bmFileList"></ul><p class="bm-ftotal" id="bmFileTotal"></p>' +
            '<p class="bm-err" id="bmFileErr"></p><p class="bm-hint" id="bmFileNote"></p></div>' +
        '</div></div></section>' +
      '<section class="bm-view" id="bmViewHist"><div class="bm-hlist" id="bmHistList"></div></section>' +
      '<section class="bm-view" id="bmViewDone"><div class="bm-done">' +
        '<svg class="bm-check" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44"></circle><path d="M28 52 L44 68 L74 34"></path></svg>' +
        '<h3 id="bmDoneTitle">Comanda a plecat!</h3><div class="bm-code" id="bmDoneCode">BRM-0000</div>' +
        '<p id="bmDoneText"></p><div class="bm-recap" id="bmDoneRecap"></div></div></section>' +
    '</div>' +
    '<div class="bm-mailmenu" id="bmMailMenu"><h6>Deschide mesajul în</h6>' +
      '<a id="bmGmail" target="_blank" rel="noopener"><i style="background:#D93025">G</i>Gmail (în browser)</a>' +
      '<a id="bmYahoo" target="_blank" rel="noopener"><i style="background:#6001D2">Y</i>Yahoo Mail (în browser)</a>' +
      '<a id="bmOutlook" target="_blank" rel="noopener"><i style="background:#0F6CBD">O</i>Outlook / Hotmail (în browser)</a>' +
      '<a id="bmLocal"><i style="background:#3A3F44">✉</i>Aplicația de email de pe PC</a>' +
      '<p>Mesajul e deja scris. Trebuie doar să apeși „Trimite” în fila care se deschide.</p></div>' +
    '<footer class="bm-foot" id="bmFoot"></footer>';
  document.body.appendChild(dlg);

  var pill = document.createElement('button');
  pill.id = 'bmPill'; pill.type = 'button';
  pill.innerHTML = '<span>🧾 Comenzile mele</span><b id="bmPillCount">0</b>';
  pill.addEventListener('click', function () { openDialog(null, 'hist'); });
  document.body.appendChild(pill);

  var imgFail = false, bmi = $('bmImg');
  if (bmi) {
    bmi.addEventListener('error', function () { if (!imgFail) { imgFail = true; bmi.setAttribute('src', SRC.negru); } });
    bmi.addEventListener('load', function () { imgFail = false; });
  }

  var O = null, view = 'order', lastFocus = null, sending = false, deleted = null, mailCtx = null, FILES = [], lastMatKey = '';

  function orders() { return read(LS_ORDERS, []) || []; }
  function setOrders(a) { store(LS_ORDERS, a); refreshCounts(); }
  function refreshCounts() {
    var n = orders().length;
    var c = $('bmHistCount'); if (c) c.textContent = String(n);
    var pc = $('bmPillCount'); if (pc) pc.textContent = String(n);
    pill.classList.toggle('on', n > 0 && dlg.hidden);
  }
  function blankOrder(p, cfg) {
    var c = read(LS_CUSTOMER, {}) || {}, sh = cfg ? shapeById(cfg.shape) : null;
    return {
      pid: cfg ? 'custom' : (p ? p.id : ''),
      shape: cfg ? sh.id : null,
      title: cfg ? (sh.label + ' personalizat') : (p ? p.name : 'Mesaj / piesă la comandă'),
      badge: cfg ? 'Personalizat · 5–7 zile' : (p ? (p.badge || '') : 'Proiect la cerere · 5–7 zile'),
      base: cfg ? sh.base : (p ? (+p.price || 0) : 99),
      photo: cfg ? (SRC[cfg.color] || SRC.negru) : (p && p.img ? p.img : SRC.negru),
      personalizable: cfg ? true : isPers(p),
      preview: !!cfg,
      material: cfg ? cfg.material : MATERIALS[0].name,
      size: cfg ? cfg.size : 40,
      color: cfg ? cfg.color : 'negru',
      qty: 1, gift: false, delivery: 'curier',
      pname: cfg ? (cfg.t1 || sh.t1.def) : (S.customNameDefault || 'NUMELE TĂU'),
      pcurve: cfg ? (cfg.t2 || sh.t2.def) : (S.customBottomDefault || 'SĂRBĂTORI FERICITE'),
      cust: { nume: c.nume || '', tel: c.tel || '', mail: c.mail || '', adr: c.adr || '', termen: '', msg: '' },
      code: '', files: []
    };
  }
  function fillMaterials(base, mul) {
    var el = $('bmMaterial'); if (!el) return;
    var cur = O ? O.material : MATERIALS[0].name;
    el.innerHTML = MATERIALS.map(function (m) {
      var add = CORE.matAddFor(base, mul, m.name);
      return '<option value="' + esc(m.name) + '">' + esc(m.name) + (add ? ' (+' + add + ' lei)' : ' (inclus)') + '</option>';
    }).join('');
    el.value = cur;
  }
  function syncMaterials() {
    if (!O) return;
    var sz = CORE.sizeBy(O, O.size), key = O.base + '|' + sz.mul;
    if (key === lastMatKey) return;
    lastMatKey = key;
    fillMaterials(O.base, sz.mul);
  }
  function fillStatic() {
    $('bmColors').innerHTML = CORE.colors.map(function (c) {
      return '<button type="button" class="bm-chip" data-act="color" data-v="' + c.v + '"><i style="background:' + c.hex + '"></i>' + esc(c.label) + '</button>';
    }).join('');
    $('bmShape').innerHTML = SHAPES.map(function (s) {
      return '<option value="' + s.id + '">' + s.ic + '  ' + esc(s.label) + ' · de la ' + CORE.from(s.base, s.sizes) + ' lei</option>';
    }).join('');
    lastMatKey = '';
    syncMaterials();
  }
  fillStatic();
  function fillSizes() {
    if (!O) return;
    var l = CORE.sizesFor(O), ss = $('bmSize'), found = false;
    ss.innerHTML = l.map(function (s) {
      return '<option value="' + s.v + '">' + s.label + ' · ' + CORE.money(O.base * s.mul) + '</option>';
    }).join('');
    l.forEach(function (s) { if (s.v === O.size) found = true; });
    if (!found) O.size = l[Math.min(1, l.length - 1)].v;
    ss.value = String(O.size);
    syncMaterials();
  }
  function fillLabels() {
    if (!O) return;
    var sh = shapeById(O.shape || 'coronita');
    text('bmL1', sh.t1.label); text('bmL2', sh.t2.label);
    var a = $('bmName'), b = $('bmCurve');
    if (a) { a.maxLength = sh.t1.max; a.placeholder = sh.t1.def; }
    if (b) { b.maxLength = sh.t2.max; b.placeholder = sh.t2.def; }
  }
  function fitDialogPreview() {
    if (!O) return;
    var stage = $('bmStage'), banner = $('bmBanner'), ct = $('bmCurveText');
    if (!stage) return;
    var live = O.personalizable && O.preview && (!O.shape || O.shape === 'coronita');
    var w = stage.clientWidth || 300;
    if (banner) {
      if (!live || !String(O.pname || '').trim()) banner.style.visibility = 'hidden';
      else {
        banner.style.visibility = 'visible';
        banner.textContent = String(O.pname).toUpperCase();
        var size = Math.max(11, w * 0.072), guard = 0;
        banner.style.fontSize = size + 'px';
        while (banner.scrollWidth > banner.clientWidth && size > 9 && guard < 60) { size -= 1; banner.style.fontSize = size + 'px'; guard++; }
      }
    }
    if (ct) {
      var tp = ct.querySelector('textPath');
      if (tp) tp.textContent = live ? String(O.pcurve || '').toUpperCase() : '';
      if (!live) ct.style.visibility = 'hidden';
      else fitCurveExact(ct, $('bmCurvePath'), 46);
    }
  }
  function recalc() {
    if (!O) return;
    syncMaterials();
    var p = CORE.price(O);
    var lines = [['Piesă × ' + O.qty, CORE.money(O.base * CORE.sizeBy(O, O.size).mul * O.qty)]];
    if (p.mat) lines.push([O.material, '+' + CORE.money(p.mat * O.qty)]);
    if (O.gift) lines.push(['Ambalaj cadou', '+' + CORE.money(CFG.gift * O.qty)]);
    lines.push(['Livrare', O.delivery === 'curier' ? '+' + CORE.money(CFG.courier) : 'ridicare atelier']);
    if (FILES.length) lines.push(['Fișiere', FILES.length + ' atașate']);
    var ul = $('bmLines');
    if (ul) ul.innerHTML = lines.map(function (l) { return '<li><span>' + esc(l[0]) + '</span><b>' + esc(l[1]) + '</b></li>'; }).join('');
    text('bmTotal', CORE.money(p.total)); text('bmTitle', O.title); text('bmBadge', O.badge || '');
    var mt = $('bmMetalTag');
    if (mt) {
      var mat = null;
      for (var i = 0; i < MATERIALS.length; i++) if (MATERIALS[i].name === O.material) mat = MATERIALS[i];
      var dot = mt.querySelector('i'), lbl = mt.querySelector('span');
      if (dot) dot.style.background = (mat && mat.color) || '#3A3F44';
      if (lbl) lbl.textContent = O.material + ' · ' + CORE.sizeBy(O, O.size).label;
    }
    var isSvg = !!(O.shape && O.shape !== 'coronita'), box = $('bmSvg'), im = $('bmImg'), pvb = $('bmPvBtn');
    if (isSvg) {
      if (im) im.hidden = true;
      if (box) { box.classList.add('on'); box.innerHTML = shapeSVG(O.shape, O, 'bm'); }
      if (pvb) pvb.hidden = true;
    } else {
      if (box) { box.classList.remove('on'); box.innerHTML = ''; }
      if (im) {
        im.hidden = false;
        var src = (O.personalizable && O.preview) ? (SRC[O.color] || SRC.negru) : (O.photo || SRC.negru);
        if (im.getAttribute('src') !== src) { imgFail = false; im.setAttribute('src', src); }
        im.setAttribute('alt', O.title);
      }
      if (pvb) { pvb.hidden = !O.personalizable; pvb.textContent = O.preview ? 'Foto modelului' : 'Previzualizare text'; }
    }
    var sr = $('bmShapeRow'); if (sr) sr.style.display = O.pid === 'custom' ? '' : 'none';
    var sp = $('bmShape'); if (sp && O.shape) sp.value = O.shape;
    var pr = $('bmPersRow'); if (pr) pr.style.display = O.personalizable ? '' : 'none';
    text('bmPersHint', O.personalizable ? 'Scriem textul împreună înainte să tăiem. Previzualizarea se actualizează live.'
      : 'Model din colecție. Vrei un nume sau un logo? Scrie-ne în mesaj sau atașează fișierul mai jos.');
    Array.prototype.forEach.call(dlg.querySelectorAll('#bmColors .bm-chip'), function (c) { c.classList.toggle('is-on', c.getAttribute('data-v') === O.color); });
    Array.prototype.forEach.call(dlg.querySelectorAll('#bmDelivery button'), function (b) { b.classList.toggle('is-on', b.getAttribute('data-v') === O.delivery); });
    fitDialogPreview(); updateLinks();
  }
  function readCustomer() {
    if (!O) return;
    O.cust.nume = (($('bmCName') || {}).value || '').trim();
    O.cust.tel = (($('bmCPhone') || {}).value || '').trim();
    O.cust.mail = (($('bmCMail') || {}).value || '').trim();
    O.cust.adr = (($('bmCAddr') || {}).value || '').trim();
    O.cust.termen = ($('bmCDate') || {}).value || '';
    O.cust.msg = ($('bmCMsg') || {}).value || '';
    store(LS_CUSTOMER, { nume: O.cust.nume, tel: O.cust.tel, mail: O.cust.mail, adr: O.cust.adr });
  }
  function fileNames() { return FILES.map(function (f) { return f.name + ' (' + fsize(f.size) + ')'; }); }
  function orderText() { readCustomer(); O.files = fileNames(); return CORE.buildText(O, CORE.price(O)); }
  function updateLinks() {
    if (!O || view !== 'order') return;
    var txt = orderText(), wa = $('bmWaLink');
    if (wa) wa.href = 'https://wa.me/' + String(CFG.whatsapp).replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent(txt);
    if (mailCtx === 'current') fillMailMenu((S.orderSubjectPrefix || 'Comandă:') + ' ' + O.title, txt);
  }
  function fillMailMenu(s, b) {
    var g = $('bmGmail'), y = $('bmYahoo'), o = $('bmOutlook'), l = $('bmLocal');
    if (g) g.href = CORE.webmail('gmail', s, b);
    if (y) y.href = CORE.webmail('yahoo', s, b);
    if (o) o.href = CORE.webmail('outlook', s, b);
    if (l) l.href = CORE.mailto(s, b);
  }
  function openMailMenu(s, b, ctx) { mailCtx = ctx || 'fixed'; fillMailMenu(s, b); var m = $('bmMailMenu'); if (m) m.classList.add('on'); }
  function closeMailMenu() { var m = $('bmMailMenu'); if (m) m.classList.remove('on'); mailCtx = null; }
  function setStatus(msg, kind) { var s = $('bmStatus'); if (s) { s.textContent = msg || ''; s.className = 'bm-status' + (kind ? ' ' + kind : ''); } }
  function renderFoot() {
    var f = $('bmFoot'); if (!f) return;
    if (view === 'order') {
      f.innerHTML = '<button type="button" class="bm-btn bm-send" data-act="send" id="bmSend">' +
        (FILES.length ? 'Trimite comanda cu fișier →' : 'Trimite comanda →') + '</button>' +
        (CFG.whatsapp ? '<a class="bm-btn bm-wa" id="bmWaLink" target="_blank" rel="noopener">WhatsApp</a>' : '') +
        '<button type="button" class="bm-btn bm-ghost" data-act="email">Trimite pe email ▾</button>' +
        '<button type="button" class="bm-btn bm-ghost" data-act="copy">Copiază textul</button>' +
        '<span class="bm-status" id="bmStatus"></span>';
      if (!CFG.sendOnline) { var b = $('bmSend'); if (b) b.hidden = true; }
      updateLinks();
    } else if (view === 'hist') {
      f.innerHTML = '<button type="button" class="bm-btn bm-ghost" data-act="view" data-v="order">← Înapoi la comandă</button>' +
        '<button type="button" class="bm-btn bm-ghost" data-act="close">Închide</button>' +
        '<span class="bm-status" id="bmStatus">Comenzile sunt păstrate în acest browser.</span>';
    } else {
      f.innerHTML = '<button type="button" class="bm-btn bm-send" data-act="view" data-v="hist">Vezi comenzile mele</button>' +
        '<button type="button" class="bm-btn bm-ghost" data-act="emaildone">Trimite pe email ▾</button>' +
        '<button type="button" class="bm-btn bm-ghost" data-act="copydone">Copiază confirmarea</button>' +
        '<button type="button" class="bm-btn bm-ghost" data-act="close">Închide</button>' +
        '<span class="bm-status ok" id="bmStatus"></span>';
    }
  }
  function setView(v) {
    view = v; closeMailMenu();
    ['order', 'hist', 'done'].forEach(function (k) {
      var e = $('bmView' + k.charAt(0).toUpperCase() + k.slice(1));
      if (e) e.classList.toggle('is-on', k === v);
    });
    Array.prototype.forEach.call(dlg.querySelectorAll('.bm-tab'), function (t) { t.classList.toggle('is-on', t.getAttribute('data-v') === v); });
    if (v === 'hist') renderHistory();
    renderFoot();
    var b = $('bmBody'); if (b) b.scrollTop = 0;
    setTimeout(fitDialogPreview, 120);
    setTimeout(fitDialogPreview, 420);
  }
  function validate() {
    readCustomer();
    var ok = true;
    function mark(i, e, bad, msg) {
      var el = $(i), er = $(e);
      if (el) el.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (er) er.textContent = bad ? msg : '';
      if (bad) ok = false;
    }
    mark('bmCName', 'bmEName', O.cust.nume.length < 2, 'Scrie numele tău.');
    mark('bmCPhone', 'bmEPhone', !CORE.phoneOk(O.cust.tel), 'Telefon valid, ca să te sunăm.');
    mark('bmCMail', 'bmEMail', !!O.cust.mail && !CORE.mailOk(O.cust.mail), 'Email incomplet.');
    mark('bmCAddr', 'bmEAddr', O.delivery === 'curier' && O.cust.adr.length < 5, 'Adresa de livrare (oraș, stradă, județ).');
    if (!ok) {
      var bad = dlg.querySelector('[aria-invalid="true"]');
      if (bad) { bad.focus(); bad.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); }
      setStatus('Mai lipsesc câteva date.', 'err');
    }
    return ok;
  }
  function sendRequest(payload) {
    return fetch('https://formsubmit.co/ajax/' + encodeURIComponent(CFG.email), {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload)
    }).then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (j) {
        if (j && (j.success === 'true' || j.success === true)) return j;
        throw new Error((j && j.message) || 'serviciul de trimitere nu a confirmat');
      });
  }
  function saveOrder(rec) { var a = orders(); a.unshift(rec); if (a.length > 40) a.length = 40; setOrders(a); }
  function payloadBase(code, p, txt) {
    return {
      _subject: 'Comandă ' + code + ' · ' + O.title, _template: 'table', _captcha: 'false', _honey: '',
      Cod: code, Piesa: O.title, Tip: O.shape ? shapeById(O.shape).label : 'Model din colecție',
      Material: O.material, Dimensiune: CORE.sizeBy(O, O.size).label, Culoare: CORE.colorBy(O.color).label,
      Bucati: String(O.qty), Personalizare: O.personalizable ? (O.pname + ' / ' + O.pcurve) : '-',
      Livrare: CORE.deliveryLabel(O.delivery), Ambalaj: O.gift ? 'Da' : 'Nu', Estimare: CORE.money(p.total),
      Nume: O.cust.nume, Telefon: O.cust.tel, Email: O.cust.mail || '-', Adresa: O.cust.adr || '-',
      Termen: O.cust.termen || '-', Mesaj: O.cust.msg || '-', Comanda_text: txt
    };
  }
  function doSend() {
    if (sending || !O) return;
    if (!validate()) return;
    if (FILES.length) { sendWithFiles(); return; }
    if (!CFG.sendOnline) { setStatus('Trimiterea online e oprită. Folosește email sau WhatsApp.', 'warn'); return; }
    sending = true;
    var btn = $('bmSend');
    if (btn) { btn.disabled = true; btn.textContent = 'Se trimite…'; }
    setStatus('Trimitem comanda la atelier…', '');
    var p = CORE.price(O), code = CORE.code();
    O.code = code;
    var txt = CORE.buildText(O, p);
    sendRequest(payloadBase(code, p, txt)).then(function () {
      saveOrder({ code: code, ts: Date.now(), title: O.title, total: p.total, status: 'trimisa', text: txt });
      showDone(code, txt, true);
    }).catch(function (e) {
      saveOrder({ code: code, ts: Date.now(), title: O.title, total: p.total, status: 'netrimisa', text: txt });
      sending = false;
      if (btn) { btn.disabled = false; btn.textContent = 'Reîncearcă trimiterea →'; }
      setStatus('Nu am putut trimite automat (' + e.message + '). Comanda e salvată — trimite-o pe email sau WhatsApp.', 'err');
      toast('Comanda ' + code + ' e salvată local.', 'Vezi', function () { setView('hist'); });
    });
  }
  function sendWithFiles() {
    var p = CORE.price(O), code = CORE.code();
    O.code = code; O.files = fileNames();
    var txt = CORE.buildText(O, p), data = payloadBase(code, p, txt);
    data._subject = 'Comandă ' + code + ' · ' + O.title + ' (cu fișier)';
    data.Fisiere = O.files.join(', ');
    var carrier;
    try {
      var dt = new DataTransfer();
      FILES.forEach(function (f) { dt.items.add(f); });
      carrier = document.createElement('input');
      carrier.type = 'file'; carrier.name = 'attachment'; carrier.multiple = true;
      carrier.files = dt.files;
    } catch (e) {
      setStatus('Browserul nu permite atașarea automată. Scoate fișierele și trimite comanda, apoi atașează-le pe email.', 'err');
      return;
    }
    saveOrder({ code: code, ts: Date.now(), title: O.title, total: p.total, status: 'netrimisa', text: txt });
    var form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://formsubmit.co/' + encodeURIComponent(CFG.email);
    form.enctype = 'multipart/form-data';
    form.acceptCharset = 'UTF-8';
    form.style.display = 'none';
    Object.keys(data).forEach(function (k) {
      var i = document.createElement('input');
      i.type = 'hidden'; i.name = k; i.value = data[k] == null ? '' : String(data[k]);
      form.appendChild(i);
    });
    var nx = document.createElement('input');
    nx.type = 'hidden'; nx.name = '_next';
    nx.value = location.origin + location.pathname + '?comanda=' + code;
    form.appendChild(nx);
    form.appendChild(carrier);
    document.body.appendChild(form);
    var btn = $('bmSend');
    if (btn) { btn.disabled = true; btn.textContent = 'Se trimite cu fișier…'; }
    setStatus('Se urcă fișierul și se trimite comanda. Te întorci automat pe site.', '');
    form.submit();
  }
  function showDone(code, txt, sent) {
    sending = false;
    text('bmDoneTitle', sent ? 'Comanda a plecat!' : 'Comandă înregistrată');
    text('bmDoneCode', code);
    text('bmDoneText', sent ? 'Am primit-o la atelier. Îți trimitem proiectul în 24 de ore, apoi confirmi și abia atunci plătești. Păstrează codul pentru orice întrebare.'
      : 'Comanda e salvată în acest browser. Trimite-o pe email sau WhatsApp ca să ajungă la atelier.');
    var r = $('bmDoneRecap'); if (r) r.textContent = txt;
    window.__bmLastDone = txt; window.__bmLastCode = code;
    FILES = []; renderFiles();
    setView('done'); refreshCounts();
  }
  function renderHistory() {
    var list = $('bmHistList'); if (!list) return;
    var a = orders();
    if (!a.length) {
      list.innerHTML = '<div class="bm-empty"><strong>Nicio comandă încă</strong>Alege o piesă din atelier sau din colecție și apasă „Comandă”. Tot ce trimiți apare aici, cu cod și status.</div>';
      return;
    }
    list.innerHTML = a.map(function (o, i) {
      var dt = new Date(o.ts);
      var when = dt.toLocaleDateString('ro-RO') + ' · ' + dt.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
      return '<article class="bm-ocard"><div><h5>' + esc(o.title) + '<span class="bm-tag ' + (o.status === 'trimisa' ? 'sent' : 'pending') + '">' +
        (o.status === 'trimisa' ? 'trimisă' : 'netrimisă') + '</span></h5>' +
        '<p>' + esc(o.code) + ' · ' + esc(when) + ' · ' + esc(CORE.money(o.total)) + '</p></div><div class="bm-oact">' +
        (o.status !== 'trimisa' ? '<button type="button" class="bm-mini" data-act="resend" data-i="' + i + '">Retrimite</button>' : '') +
        '<button type="button" class="bm-mini" data-act="ocopy" data-i="' + i + '">Copiază</button>' +
        (CFG.whatsapp ? '<a class="bm-mini" target="_blank" rel="noopener" href="https://wa.me/' + String(CFG.whatsapp).replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent(o.text) + '">WhatsApp</a>' : '') +
        '<button type="button" class="bm-mini" data-act="oemail" data-i="' + i + '">Email ▾</button>' +
        '<button type="button" class="bm-mini del" data-act="odel" data-i="' + i + '">Șterge</button></div></article>';
    }).join('');
  }
  function copyText(txt, okMsg) {
    function fb() {
      var ta = document.createElement('textarea');
      ta.value = txt; ta.style.position = 'fixed'; ta.style.top = '-1000px';
      document.body.appendChild(ta); ta.focus(); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      toast(ok ? okMsg : 'Selectează textul din recapitulare și copiază-l manual.');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { toast(okMsg); }, fb);
    else fb();
  }

  /* ---------- fișiere ---------- */
  var drop = $('bmDrop'), fileInput = $('bmFileInput');
  function fileErr(m) { var e = $('bmFileErr'); if (e) e.textContent = m || ''; }
  function fileTotal() { var s = 0; FILES.forEach(function (f) { s += f.size; }); return s; }
  function renderFiles() {
    var ul = $('bmFileList'); if (!ul) return;
    ul.innerHTML = FILES.map(function (f, i) {
      var ext = (f.name.split('.').pop() || '?').toUpperCase().slice(0, 4);
      return '<li><span class="bm-fi">' + esc(ext) + '</span><span class="bm-fn">' + esc(f.name) + '</span>' +
        '<span class="bm-fs">' + fsize(f.size) + '</span><button type="button" data-rm="' + i + '">Scoate</button></li>';
    }).join('');
    text('bmFileTotal', FILES.length ? (FILES.length + ' fișier(e) · ' + fsize(fileTotal()) + ' din ' + fsize(CFG.maxTotal)) : '');
    text('bmFileNote', FILES.length ? 'Fișierele pleacă doar prin butonul „Trimite comanda”. Pe email sau WhatsApp le atașezi manual.'
      : 'Ai un desen sau un logo? Atașează-l și tăiem după el. Dacă nu ai fișier, îți facem noi proiectul.');
    var b = $('bmSend');
    if (b && !b.disabled) b.textContent = FILES.length ? 'Trimite comanda cu fișier →' : 'Trimite comanda →';
  }
  function addFiles(list) {
    fileErr('');
    var rej = [];
    Array.prototype.forEach.call(list || [], function (f) {
      var low = f.name.toLowerCase(), ok = false;
      EXT.forEach(function (e) { if (low.slice(-e.length) === e) ok = true; });
      if (!ok) { rej.push(f.name + ' — format neacceptat'); return; }
      if (FILES.length >= CFG.maxFiles) { rej.push(f.name + ' — maxim ' + CFG.maxFiles + ' fișiere'); return; }
      if (fileTotal() + f.size > CFG.maxTotal) { rej.push(f.name + ' — depășește ' + fsize(CFG.maxTotal)); return; }
      var dup = false;
      FILES.forEach(function (x) { if (x.name === f.name && x.size === f.size) dup = true; });
      if (!dup) FILES.push(f);
    });
    if (rej.length) fileErr(rej.join(' · '));
    renderFiles(); recalc();
  }
  if (drop && fileInput) {
    drop.addEventListener('click', function () { fileInput.click(); });
    drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
    ['dragenter', 'dragover'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); drop.classList.add('is-over'); });
    });
    ['dragleave', 'dragend'].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.remove('is-over'); }); });
    drop.addEventListener('drop', function (e) {
      e.preventDefault(); e.stopPropagation(); drop.classList.remove('is-over');
      if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', function () { addFiles(fileInput.files); fileInput.value = ''; });
    $('bmFileList').addEventListener('click', function (e) {
      var b = e.target.closest('[data-rm]'); if (!b) return;
      FILES.splice(parseInt(b.getAttribute('data-rm'), 10), 1);
      fileErr(''); renderFiles(); recalc();
    });
    renderFiles();
  }

  /* ---------- deschidere / închidere ---------- */
  function openDialog(source, startView) {
    lastFocus = document.activeElement;
    if (source && source.type === 'product') O = blankOrder(source.product, null);
    else if (source && source.type === 'custom') O = blankOrder(null, source.cfg);
    else if (source && source.type === 'contact') {
      var p = productByName(source.model || '');
      O = blankOrder(p, null);
      if (!p && source.model) { O.title = source.model; O.badge = 'Proiect la cerere'; }
      O.cust.nume = source.nume || O.cust.nume;
      O.cust.mail = source.mail || O.cust.mail;
      O.cust.msg = source.msg || '';
    } else if (!O) O = blankOrder(products[0] || null, null);
    lastMatKey = '';
    fillStatic(); fillSizes(); fillLabels();
    $('bmMaterial').value = O.material;
    $('bmQty').value = String(O.qty);
    $('bmName').value = O.pname;
    $('bmCurve').value = O.pcurve;
    $('bmGift').checked = !!O.gift;
    $('bmCName').value = O.cust.nume;
    $('bmCPhone').value = O.cust.tel;
    $('bmCMail').value = O.cust.mail;
    $('bmCAddr').value = O.cust.adr;
    var cd = $('bmCDate'); if (cd) { cd.value = O.cust.termen || ''; cd.min = new Date().toISOString().slice(0, 10); }
    $('bmCMsg').value = O.cust.msg;
    ['bmEName', 'bmEPhone', 'bmEMail', 'bmEAddr'].forEach(function (id) { var e = $(id); if (e) e.textContent = ''; });
    ['bmCName', 'bmCPhone', 'bmCMail', 'bmCAddr'].forEach(function (id) { var e = $(id); if (e) e.setAttribute('aria-invalid', 'false'); });
    renderFiles();
    scrim.hidden = false; dlg.hidden = false;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('bm-modal-open');
    pill.classList.remove('on');
    requestAnimationFrame(function () { scrim.classList.add('on'); dlg.classList.add('on'); });
    setView(startView || 'order');
    recalc(); refreshCounts();
    setTimeout(function () {
      var f = startView === 'hist' ? dlg.querySelector('.bm-close') : $('bmCName');
      if (f) f.focus();
      fitDialogPreview();
    }, 120);
  }
  function closeDialog() {
    closeMailMenu();
    scrim.classList.remove('on'); dlg.classList.remove('on');
    document.body.style.overflow = '';
    document.body.classList.remove('bm-modal-open');
    setTimeout(function () { scrim.hidden = true; dlg.hidden = true; refreshCounts(); }, reduce ? 0 : 260);
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) { } }
  }
  scrim.addEventListener('click', closeDialog);
  document.addEventListener('keydown', function (e) {
    if (dlg.hidden) return;
    if (e.key === 'Escape') {
      var m = $('bmMailMenu');
      if (m && m.classList.contains('on')) { closeMailMenu(); return; }
      closeDialog(); return;
    }
    if (e.key !== 'Tab') return;
    var l = [].slice.call(dlg.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(function (x) { return !x.disabled && x.offsetParent !== null; });
    if (!l.length) return;
    var first = l[0], last = l[l.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  window.addEventListener('resize', function () { if (!dlg.hidden) fitDialogPreview(); });

  dlg.addEventListener('input', function (e) {
    if (!O) return;
    var id = e.target.id;
    if (id === 'bmName') { O.pname = e.target.value; recalc(); }
    else if (id === 'bmCurve') { O.pcurve = e.target.value; recalc(); }
    else if (id === 'bmQty') {
      var v = parseInt(e.target.value, 10);
      O.qty = isNaN(v) ? 1 : Math.min(20, Math.max(1, v));
      e.target.value = String(O.qty); recalc();
    } else if (id === 'bmGift') { O.gift = e.target.checked; recalc(); }
    else if (id === 'bmMaterial') { O.material = e.target.value; recalc(); }
    else if (id === 'bmSize') { O.size = +e.target.value; recalc(); }
    else { readCustomer(); updateLinks(); }
  });
  dlg.addEventListener('change', function (e) {
    if (!O) return;
    if (e.target.id === 'bmShape') {
      var sh = shapeById(e.target.value);
      O.shape = sh.id; O.base = sh.base; O.title = sh.label + ' personalizat';
      O.pname = sh.t1.def; O.pcurve = sh.t2.def;
      $('bmName').value = O.pname; $('bmCurve').value = O.pcurve;
      fillSizes(); fillLabels(); recalc();
    }
    if (e.target.id === 'bmMaterial') { O.material = e.target.value; recalc(); }
    if (e.target.id === 'bmSize') { O.size = +e.target.value; recalc(); }
    if (e.target.id === 'bmGift') { O.gift = e.target.checked; recalc(); }
  });
  dlg.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('#bmMailMenu')) {
      if (e.target.closest('a')) { setTimeout(closeMailMenu, 120); toast('S-a deschis un tab nou cu mesajul gata scris.'); }
      return;
    }
    var t = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!t) { closeMailMenu(); return; }
    var act = t.getAttribute('data-act'), val = t.getAttribute('data-v'), idx = parseInt(t.getAttribute('data-i'), 10);
    if (act !== 'email' && act !== 'emaildone' && act !== 'oemail') closeMailMenu();
    if (act === 'close') { e.preventDefault(); closeDialog(); }
    else if (act === 'view') { e.preventDefault(); setView(val); }
    else if (act === 'pv') { O.preview = !O.preview; recalc(); }
    else if (act === 'color') { O.color = val; if (O.pid === 'custom') O.photo = SRC[val] || SRC.negru; recalc(); }
    else if (act === 'del') {
      O.delivery = val; recalc();
      var i = $('bmCAddr'), er = $('bmEAddr');
      if (val === 'atelier' && i && er) { i.setAttribute('aria-invalid', 'false'); er.textContent = ''; }
    }
    else if (act === 'qty') {
      O.qty = Math.min(20, Math.max(1, O.qty + (+val)));
      var q = $('bmQty'); if (q) q.value = String(O.qty);
      recalc();
    }
    else if (act === 'send') { doSend(); }
    else if (act === 'copy') { copyText(orderText(), 'Comanda e copiată.'); }
    else if (act === 'copydone') { copyText(window.__bmLastDone || '', 'Confirmarea e copiată.'); }
    else if (act === 'email') { openMailMenu((S.orderSubjectPrefix || 'Comandă:') + ' ' + O.title, orderText(), 'current'); }
    else if (act === 'emaildone') { openMailMenu('Comandă ' + (window.__bmLastCode || ''), window.__bmLastDone || '', 'fixed'); }
    else if (act === 'oemail') { var oe = orders()[idx]; if (oe) openMailMenu('Comandă ' + oe.code, oe.text, 'fixed'); }
    else if (act === 'ocopy') { var o1 = orders()[idx]; if (o1) copyText(o1.text, 'Comanda ' + o1.code + ' e copiată.'); }
    else if (act === 'odel') {
      var a = orders(), rem = a[idx];
      if (!rem) return;
      deleted = { rec: rem, i: idx };
      a.splice(idx, 1); setOrders(a); renderHistory();
      toast('Comanda ' + rem.code + ' a fost ștearsă.', 'Anulează', function () {
        if (!deleted) return;
        var b = orders(); b.splice(Math.min(deleted.i, b.length), 0, deleted.rec);
        setOrders(b); deleted = null; renderHistory();
      });
    }
    else if (act === 'resend') {
      var o2 = orders()[idx];
      if (!o2) return;
      t.disabled = true; t.textContent = 'Se trimite…';
      sendRequest({
        _subject: 'Comandă ' + o2.code + ' (retrimisă) · ' + o2.title, _template: 'table', _captcha: 'false',
        Cod: o2.code, Piesa: o2.title, Estimare: CORE.money(o2.total), Comanda_text: o2.text, _honey: ''
      }).then(function () {
        var a2 = orders();
        for (var i2 = 0; i2 < a2.length; i2++) if (a2[i2].code === o2.code) a2[i2].status = 'trimisa';
        setOrders(a2); renderHistory(); toast('Comanda ' + o2.code + ' a fost trimisă.');
      }).catch(function (err) {
        t.disabled = false; t.textContent = 'Retrimite';
        toast('Nu se poate trimite (' + err.message + '). Folosește Email ▾.');
      });
    }
  });

  /* ===================== INTERCEPTARE ===================== */
  document.addEventListener('click', function (e) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var el = e.target;
    if (!el || !el.closest) return;
    if (el.closest('.bm-dialog') || el.closest('#bmPill') || el.closest('#bmToast') || el.closest('.customizer')) return;
    var link = el.closest('a[data-order], a[href^="mailto:"]');
    if (!link) return;
    e.preventDefault(); e.stopPropagation();
    var key = link.getAttribute('data-order');
    if (key === 'custom') { openDialog({ type: 'custom', cfg: { shape: P.shape, t1: P.t1, t2: P.t2, material: P.material, color: P.color, size: P.size } }); return; }
    if (key) { var p = productById(key); if (p) { openDialog({ type: 'product', product: p }); return; } }
    var href = link.getAttribute('href') || '';
    if (href.indexOf('mailto:') === 0) {
      var d = CORE.parseMailto(href);
      if (d.product) {
        var pp = productByName(d.product);
        if (pp) { openDialog({ type: 'product', product: pp }); return; }
        openDialog({ type: 'contact', model: d.product }); return;
      }
      openDialog({ type: 'contact', model: '' });
    }
  }, true);
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || f.id !== 'contactForm') return;
    e.preventDefault(); e.stopPropagation();
    openDialog({
      type: 'contact', model: cfModel ? cfModel.value : '',
      nume: $('cfName') ? $('cfName').value : '',
      mail: $('cfEmail') ? $('cfEmail').value : '',
      msg: $('cfMsg') ? $('cfMsg').value : ''
    });
  }, true);

  /* ---------- întoarcere după trimiterea cu fișier ---------- */
  (function () {
    var m = /[?&]comanda=([A-Za-z0-9-]+)/.exec(location.search);
    if (!m) return;
    var cod = m[1].toUpperCase(), a = orders(), hit = false;
    for (var i = 0; i < a.length; i++) if (a[i].code === cod) { a[i].status = 'trimisa'; hit = true; }
    if (hit) setOrders(a);
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { }
    setTimeout(function () {
      openDialog(null, 'hist');
      toast('Comanda ' + cod + ' a fost trimisă cu fișierele atașate.');
    }, 700);
  })();

  refreshCounts();
  setInterval(function () { if (!dlg.hidden) fitDialogPreview(); }, 1500);
})();
