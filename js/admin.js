/* BRM TECNICAL — panou admin: texte, produse, forme atelier (prețuri + dimensiuni),
   publicare online pe GitHub. */
(function () {
  'use strict';

  var LS_DATA = 'brm_data';
  var LS_HASH = 'brm_admin_hash';

  function $(id) { return document.getElementById(id); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function lei(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' lei'; }

  function hash(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return 'h' + h.toString(16);
  }
  function ensureDefaultHash() {
    if (!localStorage.getItem(LS_HASH)) localStorage.setItem(LS_HASH, hash('brm2026'));
  }
  function toast(msg) {
    var t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, 2600);
  }

  /* ---------- date ---------- */
  function baseData() {
    return clone(window.BRM_DEFAULT || { settings: {}, products: [] });
  }
  function loadData() {
    try {
      var raw = localStorage.getItem(LS_DATA);
      if (raw) {
        var d = JSON.parse(raw);
        if (d && d.settings && d.products) {
          var b = baseData();
          return { settings: Object.assign({}, b.settings, d.settings), products: d.products };
        }
      }
    } catch (e) { }
    return baseData();
  }
  function saveData(d) {
    try {
      localStorage.setItem(LS_DATA, JSON.stringify(d));
      return true;
    } catch (e) {
      alert('Nu am putut salva: spațiul de stocare al browserului e plin (probabil din cauza pozelor încărcate). Publică online sau șterge câteva poze.');
      return false;
    }
  }
  var DATA = loadData();

  /* ---------- login ---------- */
  function showApp() {
    $('loginView').hidden = true;
    $('appView').hidden = false;
    fillSettings();
    renderProducts();
    renderShapes();
    updatePreviewPane();
    showLastPublish();
  }
  function showLogin() {
    $('loginView').hidden = false;
    $('appView').hidden = true;
  }

  ensureDefaultHash();
  if (sessionStorage.getItem('brm_admin_ok') === '1') showApp();
  else showLogin();

  $('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = $('loginPass').value;
    if (hash(v) === localStorage.getItem(LS_HASH)) {
      sessionStorage.setItem('brm_admin_ok', '1');
      $('loginErr').hidden = true;
      showApp();
    } else {
      $('loginErr').hidden = false;
    }
  });

  $('btnLogout').addEventListener('click', function () {
    sessionStorage.removeItem('brm_admin_ok');
    showLogin();
  });

  $('btnChangePass').addEventListener('click', function () {
    var np = $('newPass').value;
    if (!np || np.length < 4) { alert('Parola nouă trebuie să aibă minim 4 caractere.'); return; }
    localStorage.setItem(LS_HASH, hash(np));
    $('newPass').value = '';
    toast('Parola a fost schimbată.');
  });

  /* ---------- tabs ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (tab) {
    tab.addEventListener('click', function () {
      Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) { t.classList.remove('is-on'); });
      Array.prototype.forEach.call(document.querySelectorAll('.pane'), function (p) { p.classList.remove('is-on'); });
      tab.classList.add('is-on');
      var pane = $('pane-' + tab.getAttribute('data-tab'));
      if (pane) pane.classList.add('is-on');
      if (tab.getAttribute('data-tab') === 'preview') updatePreviewPane();
      if (tab.getAttribute('data-tab') === 'shapes') renderShapes();
    });
  });

  /* ---------- setări ---------- */
  var FIELDS = [
    'email', 'city', 'county', 'country', 'program', 'priceFrom', 'band',
    'heroLead', 'previewCaption', 'customNameDefault', 'customBottomDefault',
    'orderSubjectPrefix'
  ];

  function fillSettings() {
    FIELDS.forEach(function (f) {
      var el = $('s_' + f);
      if (el) el.value = DATA.settings[f] != null ? DATA.settings[f] : '';
    });
  }
  function collectSettings() {
    FIELDS.forEach(function (f) {
      var el = $('s_' + f);
      if (el) DATA.settings[f] = el.value;
    });
  }

  $('btnSaveSettings').addEventListener('click', function () {
    collectSettings();
    if (saveData(DATA)) toast('Setările salvate local. Apasă „Publică online” ca să apară pentru toți.');
    updatePreviewPane();
  });

  $('btnResetSettings').addEventListener('click', function () {
    if (!confirm('Resetezi toate textele la valorile din data.js implicit? Produsele rămân.')) return;
    var b = baseData();
    DATA.settings = b.settings;
    fillSettings();
    ensureShapes();
    saveData(DATA);
    renderShapes();
    toast('Texte resetate.');
  });

  /* ---------- produse ---------- */
  var CATS = [
    ['personalizate', 'Personalizate'], ['craciun', 'Crăciun'], ['paste', 'Paște'],
    ['primavara', 'Primăvară & mămici'], ['evenimente', 'Evenimente'],
    ['italia', 'Ediții italiene']
  ];

  function renderProducts() {
    var list = $('prodList');
    $('prodCount').textContent = '(' + DATA.products.length + ' produse)';
    list.innerHTML = DATA.products.map(function (p, i) {
      var catOpts = CATS.map(function (c) {
        var selected = (p.cat || '').split(/\s+/).indexOf(c[0]) !== -1 ? ' selected' : '';
        return '<option value="' + c[0] + '"' + selected + '>' + c[1] + '</option>';
      }).join('');
      var imgSrc = (p.img || '').indexOf('data:') === 0 ? p.img : (p.img || '');
      return '<div class="prod" data-i="' + i + '">' +
        '<img class="prod-thumb" src="' + esc(imgSrc) + '" alt="" onerror="this.style.opacity=.3">' +
        '<div class="prod-fields">' +
        '<label class="fld wide"><span>Nume</span><input data-k="name" value="' + esc(p.name) + '"></label>' +
        '<label class="fld"><span>Preț (lei)</span><input data-k="price" type="number" min="0" value="' + esc(p.price) + '"></label>' +
        '<label class="fld"><span>Categorie principală</span><select data-k="cat0">' + catOpts + '</select></label>' +
        '<label class="fld"><span>Badge (etichetă)</span><input data-k="badge" value="' + esc(p.badge || '') + '"></label>' +
        '<label class="fld wide"><span>Cale imagine (sau upload mai jos)</span><input data-k="img" value="' + esc((p.img || '').indexOf('data:') === 0 ? '(poză încărcată în browser)' : (p.img || '')) + '"' + ((p.img || '').indexOf('data:') === 0 ? ' readonly' : '') + '></label>' +
        '<div class="prod-tools">' +
        '<label class="mini file-btn">📷 Încarcă poză<input type="file" accept="image/*" data-act="upload" hidden></label>' +
        '<button class="mini" data-act="dup">Dublează</button>' +
        '<span class="spacer"></span>' +
        '<button class="mini del" data-act="del">Șterge</button>' +
        '</div>' +
        '<p class="cat-hint">Categorii (spațiate, ex. „craciun italia”): <input data-k="cat" value="' + esc(p.cat || '') + '" style="border:1px solid var(--line2);border-radius:4px;padding:4px 8px;font-size:13px"></p>' +
        '</div></div>';
    }).join('');
  }

  function readProductFields(card) {
    var i = +card.getAttribute('data-i');
    var p = DATA.products[i];
    if (!p) return;
    card.querySelectorAll('[data-k]').forEach(function (el) {
      var k = el.getAttribute('data-k');
      if (k === 'price') p.price = +el.value || 0;
      else if (k === 'cat0') {
        p.cat = [el.value].concat(
          (p.cat || '').split(/\s+/).filter(function (c) {
            if (!c || c === el.value) return false;
            return !CATS.some(function (x) { return x[0] === c; });
          })
        ).filter(Boolean).join(' ');
      }
      else if (k === 'img') {
        if (el.value.indexOf('(poză') !== 0 && el.value !== p.img) p.img = el.value;
      }
      else p[k] = el.value;
    });
  }
  function collectAllProducts() {
    Array.prototype.forEach.call(document.querySelectorAll('.prod'), readProductFields);
  }

  $('prodList').addEventListener('change', function (e) {
    var card = e.target.closest('.prod');
    if (!card) return;
    var act = e.target.getAttribute && e.target.getAttribute('data-act');
    if (act === 'upload') { handleUpload(e.target, card); return; }
    readProductFields(card);
    saveData(DATA);
  });

  $('prodList').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var act = btn.getAttribute('data-act');
    var card = btn.closest('.prod');
    var i = +card.getAttribute('data-i');
    if (act === 'del') {
      if (!confirm('Ștergi „' + DATA.products[i].name + '"?')) return;
      DATA.products.splice(i, 1);
      saveData(DATA);
      renderProducts();
      toast('Produs șters.');
    } else if (act === 'dup') {
      collectAllProducts();
      var copy = clone(DATA.products[i]);
      copy.id = 'p' + Date.now().toString(36);
      copy.name = copy.name + ' (copie)';
      DATA.products.splice(i + 1, 0, copy);
      saveData(DATA);
      renderProducts();
      toast('Produs dublat.');
    }
  });

  function handleUpload(input, card) {
    var file = input.files && input.files[0];
    if (!file) return;
    var i = +card.getAttribute('data-i');
    var reader = new FileReader();
    reader.onload = function (ev) {
      var im = new Image();
      im.onload = function () {
        var max = 1000;
        var scale = Math.min(1, max / Math.max(im.width, im.height));
        var cv = document.createElement('canvas');
        cv.width = Math.round(im.width * scale);
        cv.height = Math.round(im.height * scale);
        cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
        DATA.products[i].img = cv.toDataURL('image/jpeg', 0.85);
        if (saveData(DATA)) {
          renderProducts();
          toast('Poză încărcată. La „Publică online” urcă automat în images/.');
        }
      };
      im.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  $('btnAddProd').addEventListener('click', function () {
    collectAllProducts();
    DATA.products.push({
      id: 'p' + Date.now().toString(36),
      name: 'Produs nou', price: 169, cat: 'personalizate',
      badge: 'În stoc · 3–5 zile', img: 'images/coronita-model.jpg'
    });
    saveData(DATA);
    renderProducts();
    toast('Produs adăugat. Editează câmpurile, apoi Publică online.');
  });

  $('btnSaveProd').addEventListener('click', function () {
    collectAllProducts();
    if (saveData(DATA)) toast('Produsele salvate local.');
  });

  /* ==========================================================
     ATELIER — forme, prețuri de bază și dimensiuni
     ========================================================== */
  var SHAPE_DEF = [
    { id: 'coronita', label: 'Coroniță', ic: '◍', base: 149, sizes: [
      { v: 30, label: 'Ø 30 cm', mul: 0.85 }, { v: 40, label: 'Ø 40 cm', mul: 1 },
      { v: 50, label: 'Ø 50 cm', mul: 1.25 }, { v: 60, label: 'Ø 60 cm', mul: 1.5 }] },
    { id: 'tablou', label: 'Tablou', ic: '▭', base: 89, sizes: [
      { v: 30, label: '30 × 20 cm', mul: 0.85 }, { v: 40, label: '40 × 27 cm', mul: 1 },
      { v: 50, label: '50 × 33 cm', mul: 1.3 }, { v: 60, label: '60 × 40 cm', mul: 1.6 }] },
    { id: 'placuta', label: 'Plăcuță firmă', ic: '▬', base: 69, sizes: [
      { v: 20, label: '20 × 10 cm', mul: 0.8 }, { v: 30, label: '30 × 15 cm', mul: 1 },
      { v: 40, label: '40 × 20 cm', mul: 1.35 }, { v: 60, label: '60 × 30 cm', mul: 1.9 }] },
    { id: 'brad', label: 'Brad', ic: '▲', base: 79, sizes: [
      { v: 30, label: '30 cm înălțime', mul: 0.85 }, { v: 40, label: '40 cm înălțime', mul: 1 },
      { v: 50, label: '50 cm înălțime', mul: 1.25 }, { v: 60, label: '60 cm înălțime', mul: 1.5 }] },
    { id: 'stea', label: 'Stea', ic: '★', base: 49, sizes: [
      { v: 25, label: 'Ø 25 cm', mul: 0.85 }, { v: 35, label: 'Ø 35 cm', mul: 1 },
      { v: 45, label: 'Ø 45 cm', mul: 1.3 }, { v: 60, label: 'Ø 60 cm', mul: 1.7 }] },
    { id: 'inima', label: 'Inimă', ic: '♥', base: 49, sizes: [
      { v: 25, label: '25 cm', mul: 0.85 }, { v: 35, label: '35 cm', mul: 1 },
      { v: 45, label: '45 cm', mul: 1.3 }, { v: 60, label: '60 cm', mul: 1.7 }] },
    { id: 'cerc', label: 'Monogramă', ic: '◯', base: 59, sizes: [
      { v: 25, label: 'Ø 25 cm', mul: 0.85 }, { v: 35, label: 'Ø 35 cm', mul: 1 },
      { v: 45, label: 'Ø 45 cm', mul: 1.3 }, { v: 60, label: 'Ø 60 cm', mul: 1.7 }] },
    { id: 'casa', label: 'Semn de casă', ic: '⌂', base: 99, sizes: [
      { v: 40, label: '40 × 25 cm', mul: 0.9 }, { v: 50, label: '50 × 31 cm', mul: 1 },
      { v: 60, label: '60 × 37 cm', mul: 1.25 }, { v: 80, label: '80 × 50 cm', mul: 1.7 }] }
  ];
  function shapeDef(id) {
    for (var i = 0; i < SHAPE_DEF.length; i++) if (SHAPE_DEF[i].id === id) return SHAPE_DEF[i];
    return SHAPE_DEF[0];
  }
  function minMul(sizes) {
    var m = sizes[0] ? sizes[0].mul : 1;
    sizes.forEach(function (s) { if (s.mul < m) m = s.mul; });
    return m;
  }
  function normSizes(arr, fallback) {
    var out = [], seen = {};
    (Array.isArray(arr) ? arr : []).forEach(function (s, i) {
      if (!s) return;
      var v = +s.v, mul = +s.mul, label = String(s.label == null ? '' : s.label).trim();
      if (!isFinite(v) || v <= 0) v = i + 1;
      if (!isFinite(mul) || mul <= 0) mul = 1;
      if (!label) label = v + ' cm';
      if (seen[v]) return;
      seen[v] = 1;
      out.push({ v: v, label: label, mul: Math.round(mul * 100) / 100 });
    });
    return out.length ? out.slice(0, 8) : clone(fallback);
  }
  function ensureShapes() {
    if (!DATA.settings.shapes || typeof DATA.settings.shapes !== 'object') DATA.settings.shapes = {};
    SHAPE_DEF.forEach(function (d) {
      var c = DATA.settings.shapes[d.id];
      if (!c || typeof c !== 'object') c = clone(d);
      var base = +c.base;
      if (!isFinite(base) || base <= 0) base = d.base;
      DATA.settings.shapes[d.id] = { base: base, sizes: normSizes(c.sizes, d.sizes) };
    });
    if (DATA.settings.courier == null || !isFinite(+DATA.settings.courier)) DATA.settings.courier = 25;
    if (DATA.settings.gift == null || !isFinite(+DATA.settings.gift)) DATA.settings.gift = 25;
    DATA.settings.courier = +DATA.settings.courier;
    DATA.settings.gift = +DATA.settings.gift;
  }

  function renderShapes() {
    ensureShapes();
    var host = $('shapeList');
    if (!host) return;
    var c = $('s_courier'), g = $('s_gift');
    if (c) c.value = DATA.settings.courier;
    if (g) g.value = DATA.settings.gift;

    host.innerHTML = SHAPE_DEF.map(function (d) {
      var s = DATA.settings.shapes[d.id];
      var rows = s.sizes.map(function (z, i) {
        return '<tr data-i="' + i + '">' +
          '<td><input class="sh-in" data-k="v" type="number" min="1" step="1" value="' + esc(z.v) + '" aria-label="Valoare cm"></td>' +
          '<td><input class="sh-in" data-k="label" type="text" value="' + esc(z.label) + '" aria-label="Etichetă"></td>' +
          '<td><input class="sh-in" data-k="mul" type="number" min="0.05" step="0.05" value="' + esc(z.mul) + '" aria-label="Multiplicator"></td>' +
          '<td class="sh-calc">' + lei(s.base * z.mul) + '</td>' +
          '<td><button type="button" class="mini del" data-sact="delsize" data-i="' + i + '"' + (s.sizes.length < 2 ? ' disabled' : '') + '>Șterge</button></td>' +
          '</tr>';
      }).join('');
      return '<section class="shape-card" data-sh="' + d.id + '">' +
        '<header class="shape-head"><h3><span>' + d.ic + '</span>' + esc(d.label) + '</h3>' +
        '<span class="shape-from">de la <b>' + lei(s.base * minMul(s.sizes)) + '</b></span>' +
        '<button type="button" class="mini" data-sact="reset">Reset implicit</button></header>' +
        '<label class="fld sh-base"><span>Preț de bază (lei, la ×1)</span>' +
        '<input class="sh-in" data-k="base" type="number" min="1" step="1" value="' + esc(s.base) + '"></label>' +
        '<table class="sh-table"><thead><tr><th>Valoare (cm)</th><th>Etichetă afișată</th><th>Multiplicator</th><th>Preț</th><th></th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table>' +
        '<div class="row"><button type="button" class="mini" data-sact="addsize">+ Dimensiune</button>' +
        '<span class="hint">Valoarea trebuie să fie unică. Multiplicatorul înmulțește prețul de bază.</span></div>' +
        '</section>';
    }).join('');
  }

  function refreshShapeCard(card, cfg) {
    var b = card.querySelector('.shape-from b');
    if (b) b.textContent = lei(cfg.base * minMul(cfg.sizes));
    Array.prototype.forEach.call(card.querySelectorAll('tbody tr'), function (tr, i) {
      var z = cfg.sizes[i], td = tr.querySelector('.sh-calc');
      if (z && td) td.textContent = lei(cfg.base * z.mul);
    });
  }

  var shapeList = $('shapeList');
  if (shapeList) {
    shapeList.addEventListener('input', function (e) {
      var card = e.target.closest('.shape-card');
      if (!card) return;
      var cfg = DATA.settings.shapes[card.getAttribute('data-sh')];
      if (!cfg) return;
      var k = e.target.getAttribute('data-k');
      if (k === 'base') {
        cfg.base = Math.max(0, +e.target.value || 0);
      } else {
        var tr = e.target.closest('tr');
        if (!tr) return;
        var z = cfg.sizes[+tr.getAttribute('data-i')];
        if (!z) return;
        if (k === 'v') z.v = Math.max(1, +e.target.value || 1);
        else if (k === 'mul') z.mul = Math.max(0.05, +e.target.value || 1);
        else if (k === 'label') z.label = e.target.value;
      }
      saveData(DATA);
      refreshShapeCard(card, cfg);
    });

    shapeList.addEventListener('change', function (e) {
      var card = e.target.closest('.shape-card');
      if (!card) return;
      var id = card.getAttribute('data-sh'), cfg = DATA.settings.shapes[id];
      if (!cfg) return;
      var before = cfg.sizes.length;
      cfg.sizes = normSizes(cfg.sizes, shapeDef(id).sizes);
      saveData(DATA);
      if (cfg.sizes.length !== before) { renderShapes(); toast('Am eliminat valorile duplicate.'); }
      else refreshShapeCard(card, cfg);
    });

    shapeList.addEventListener('click', function (e) {
      var b = e.target.closest('[data-sact]');
      if (!b) return;
      var card = b.closest('.shape-card'), id = card.getAttribute('data-sh');
      var cfg = DATA.settings.shapes[id];
      var act = b.getAttribute('data-sact');
      if (act === 'addsize') {
        if (cfg.sizes.length >= 8) { toast('Maxim 8 dimensiuni per formă.'); return; }
        var last = cfg.sizes[cfg.sizes.length - 1] || { v: 40, mul: 1 };
        var nv = last.v + 10, k = 1;
        while (cfg.sizes.some(function (z) { return z.v === nv; }) && k < 40) { nv += 10; k++; }
        cfg.sizes.push({ v: nv, label: nv + ' cm', mul: Math.round((last.mul + 0.25) * 100) / 100 });
        saveData(DATA); renderShapes(); toast('Dimensiune adăugată.');
      } else if (act === 'delsize') {
        if (cfg.sizes.length < 2) return;
        cfg.sizes.splice(+b.getAttribute('data-i'), 1);
        saveData(DATA); renderShapes(); toast('Dimensiune ștearsă.');
      } else if (act === 'reset') {
        if (!confirm('Readuci „' + shapeDef(id).label + '” la prețurile și dimensiunile implicite?')) return;
        DATA.settings.shapes[id] = clone(shapeDef(id));
        saveData(DATA); renderShapes(); toast('Formă resetată.');
      }
    });
  }

  ['s_courier', 's_gift'].forEach(function (id) {
    var el = $(id);
    if (!el) return;
    el.addEventListener('input', function () {
      DATA.settings[id === 's_courier' ? 'courier' : 'gift'] = Math.max(0, +el.value || 0);
      saveData(DATA);
    });
  });

  var btnSaveShapes = $('btnSaveShapes');
  if (btnSaveShapes) btnSaveShapes.addEventListener('click', function () {
    ensureShapes();
    if (saveData(DATA)) { renderShapes(); toast('Atelierul e salvat local. Apasă „Publică online”.'); }
  });

  var btnResetShapes = $('btnResetShapes');
  if (btnResetShapes) btnResetShapes.addEventListener('click', function () {
    if (!confirm('Readuci toate formele la prețurile și dimensiunile implicite?')) return;
    DATA.settings.shapes = {};
    ensureShapes();
    saveData(DATA);
    renderShapes();
    toast('Toate formele au fost resetate.');
  });

  /* ==========================================================
     PUBLICARE ONLINE PE GITHUB
     ========================================================== */
  var GH = { user: 'acc1311', repo: 'brm-tecnical', branch: 'main' };
  var LS_TOKEN = 'brm_gh_token';
  var LS_PUB = 'brm_last_publish';

  function ghToken(ask) {
    var t = localStorage.getItem(LS_TOKEN);
    if (!t && ask) {
      t = prompt('Lipește token-ul GitHub (fine-grained, Contents: Read and write):');
      if (t) { t = t.trim(); localStorage.setItem(LS_TOKEN, t); }
    }
    return t;
  }
  function b64(bytes) {
    var s = '', step = 0x8000;
    for (var i = 0; i < bytes.length; i += step) s += String.fromCharCode.apply(null, bytes.subarray(i, i + step));
    return btoa(s);
  }
  function b64text(str) { return b64(new TextEncoder().encode(str)); }

  function ghApi(path, method, body) {
    return fetch('https://api.github.com/repos/' + GH.user + '/' + GH.repo + '/contents/' + path, {
      method: method || 'GET',
      headers: {
        'Authorization': 'Bearer ' + ghToken(true),
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      if (r.status === 404) return null;
      if (!r.ok) return r.text().then(function (t) { throw new Error(r.status + ' ' + t); });
      return r.json();
    });
  }
  function ghPut(path, contentBase64, message, retry) {
    return ghApi(path + '?ref=' + GH.branch).then(function (cur) {
      var body = { message: message, content: contentBase64, branch: GH.branch };
      if (cur && cur.sha) body.sha = cur.sha;
      return ghApi(path, 'PUT', body).catch(function (e) {
        if (!retry && /^(409|422)/.test(e.message)) return ghPut(path, contentBase64, message, true);
        throw e;
      });
    });
  }
  function setPubState(on) {
    ['btnPublish', 'btnPublish2'].forEach(function (id) {
      var b = $(id);
      if (!b) return;
      b.disabled = on;
      b.style.opacity = on ? '.6' : '';
      b.textContent = on ? '⏳ Se publică…' : '☁ Publică online';
    });
  }
  function showLastPublish() {
    var el = $('pubStatus');
    if (!el) return;
    var t = localStorage.getItem(LS_PUB);
    el.textContent = t ? ('Ultima publicare: ' + t) : 'Nicio publicare online încă.';
  }

  function publishOnline() {
    collectSettings();
    collectAllProducts();
    ensureShapes();
    saveData(DATA);
    if (!ghToken(true)) { toast('Fără token nu pot publica.'); return; }
    setPubState(true);
    toast('Se publică pe GitHub…');

    var jobs = Promise.resolve();
    DATA.products.forEach(function (p) {
      if ((p.img || '').indexOf('data:') === 0) {
        jobs = jobs.then(function () {
          var name = 'images/p-' + (p.id || Date.now().toString(36)) + '.jpg';
          var raw = atob(p.img.split(',')[1]);
          var bytes = new Uint8Array(raw.length);
          for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
          return ghPut(name, b64(bytes), 'Admin: poza ' + name).then(function () { p.img = name; });
        });
      }
    });

    jobs.then(function () {
      var content = '/* BRM TECNICAL — publicat din admin (' + new Date().toISOString() + ') */\n' +
        'window.BRM_DEFAULT = ' + JSON.stringify(DATA, null, 2) + ';\n';
      return ghPut('data.js', b64text(content), 'Admin: actualizare continut');
    }).then(function () {
      saveData(DATA);
      renderProducts();
      renderShapes();
      localStorage.setItem(LS_PUB, new Date().toLocaleString('ro-RO'));
      showLastPublish();
      toast('Publicat! Site-ul se actualizează în ~1 minut.');
    }).catch(function (e) {
      if (/^401/.test(e.message)) {
        localStorage.removeItem(LS_TOKEN);
        alert('Token invalid sau expirat. Apasă „🔑 Token GitHub” și pune unul nou.');
      } else if (/^403|^404/.test(e.message)) {
        alert('Acces refuzat. Verifică token-ul: fine-grained, repo „brm-tecnical”, Contents: Read and write.\n\n' + e.message);
      } else {
        alert('Eroare la publicare: ' + e.message);
      }
    }).then(function () { setPubState(false); });
  }

  ['btnPublish', 'btnPublish2'].forEach(function (id) {
    var b = $(id);
    if (b) b.addEventListener('click', publishOnline);
  });

  var btnTok = $('btnToken');
  if (btnTok) btnTok.addEventListener('click', function () {
    var t = prompt('Token GitHub nou (lasă gol ca să ștergi token-ul salvat):', '');
    if (t === null) return;
    if (t.trim()) localStorage.setItem(LS_TOKEN, t.trim()); else localStorage.removeItem(LS_TOKEN);
    toast('Token actualizat.');
  });

  /* ---------- export / import ---------- */
  $('btnExport').addEventListener('click', function () {
    collectSettings();
    collectAllProducts();
    ensureShapes();
    saveData(DATA);
    var content = '/* BRM TECNICAL — exportat din admin (' + new Date().toISOString().slice(0, 10) + ') */\n' +
      'window.BRM_DEFAULT = ' + JSON.stringify(DATA, null, 2) + ';\n';
    var blob = new Blob([content], { type: 'application/javascript' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'data.js';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
    toast('data.js descărcat (backup).');
  });

  $('importFile').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var txt = String(r.result);
        var m = txt.match(/window\.BRM_DEFAULT\s*=\s*([\s\S]+?);?\s*$/);
        var obj = JSON.parse(m ? m[1] : txt);
        if (!obj.settings || !obj.products) throw new Error('format');
        DATA = obj;
        ensureShapes();
        saveData(DATA);
        fillSettings();
        renderProducts();
        renderShapes();
        updatePreviewPane();
        toast('Importat cu succes.');
      } catch (err) {
        alert('Fișier invalid. Așteptam un data.js exportat din acest panou.');
      }
    };
    r.readAsText(f);
    e.target.value = '';
  });

  $('btnWipe').addEventListener('click', function () {
    if (!confirm('Ștergi toate modificările locale? Site-ul revine la data.js din repo.')) return;
    localStorage.removeItem(LS_DATA);
    DATA = loadData();
    ensureShapes();
    fillSettings();
    renderProducts();
    renderShapes();
    updatePreviewPane();
    toast('Modificări locale șterse.');
  });

  /* ---------- preview ---------- */
  function updatePreviewPane() {
    var name = DATA.settings.customNameDefault || 'NUMELE TĂU';
    var bottom = DATA.settings.customBottomDefault || 'SĂRBĂTORI FERICITE';
    var b = $('pvBanner');
    if (b) b.textContent = String(name).toUpperCase();
    var tp = $('pvCurveText') && $('pvCurveText').querySelector('textPath');
    if (tp) tp.textContent = String(bottom).toUpperCase();
  }

  ensureShapes();
})();
