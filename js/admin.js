/* BRM TECNICAL — panou admin (static, localStorage + publicare online pe GitHub) */
(function () {
  'use strict';

  var LS_DATA = 'brm_data';
  var LS_HASH = 'brm_admin_hash';

  function $(id) { return document.getElementById(id); }

  /* ---------- hash parolă (djb2 hex, suficient pentru panou static) ---------- */
  function hash(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return 'h' + h.toString(16);
  }
  function ensureDefaultHash() {
    if (!localStorage.getItem(LS_HASH)) {
      localStorage.setItem(LS_HASH, hash('brm2026'));
    }
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
    return JSON.parse(JSON.stringify(window.BRM_DEFAULT || { settings: {}, products: [] }));
  }
  function loadData() {
    try {
      var raw = localStorage.getItem(LS_DATA);
      if (raw) {
        var d = JSON.parse(raw);
        if (d && d.settings && d.products) {
          var b = baseData();
          return {
            settings: Object.assign({}, b.settings, d.settings),
            products: d.products
          };
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
    saveData(DATA);
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

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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
    if (act === 'upload') {
      handleUpload(e.target, card);
      return;
    }
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
      var copy = JSON.parse(JSON.stringify(DATA.products[i]));
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
        var w = im.width, h = im.height;
        var scale = Math.min(1, max / Math.max(w, h));
        var cw = Math.round(w * scale), ch = Math.round(h * scale);
        var cv = document.createElement('canvas');
        cv.width = cw; cv.height = ch;
        cv.getContext('2d').drawImage(im, 0, 0, cw, ch);
        var dataUrl = cv.toDataURL('image/jpeg', 0.85);
        DATA.products[i].img = dataUrl;
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
      name: 'Produs nou',
      price: 169,
      cat: 'personalizate',
      badge: 'În stoc · 3–5 zile',
      img: 'images/coronita-model.jpg'
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
     PUBLICARE ONLINE PE GITHUB (gratuit, fără re-upload manual)
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
    for (var i = 0; i < bytes.length; i += step) {
      s += String.fromCharCode.apply(null, bytes.subarray(i, i + step));
    }
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
    var b = $('btnPublish');
    if (!b) return;
    b.disabled = on;
    b.style.opacity = on ? '.6' : '';
    b.textContent = on ? '⏳ Se publică…' : '☁ Publică online';
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
    saveData(DATA);
    if (!ghToken(true)) { toast('Fără token nu pot publica.'); return; }
    setPubState(true);
    toast('Se publică pe GitHub…');

    /* 1) pozele încărcate în browser (data:...) devin fișiere reale în images/ */
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

    /* 2) data.js — un singur fișier modificat, GitHub Pages republică singur */
    jobs.then(function () {
      var content = '/* BRM TECNICAL — publicat din admin (' + new Date().toISOString() + ') */\n' +
        'window.BRM_DEFAULT = ' + JSON.stringify(DATA, null, 2) + ';\n';
      return ghPut('data.js', b64text(content), 'Admin: actualizare continut');
    }).then(function () {
      saveData(DATA);
      renderProducts();
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

  var btnPub = $('btnPublish');
  if (btnPub) btnPub.addEventListener('click', publishOnline);

  var btnTok = $('btnToken');
  if (btnTok) btnTok.addEventListener('click', function () {
    var t = prompt('Token GitHub nou (lasă gol ca să ștergi token-ul salvat):', '');
    if (t === null) return;
    if (t.trim()) localStorage.setItem(LS_TOKEN, t.trim()); else localStorage.removeItem(LS_TOKEN);
    toast('Token actualizat.');
  });

  /* ---------- export / import data.js (backup manual) ---------- */
  $('btnExport').addEventListener('click', function () {
    collectSettings();
    collectAllProducts();
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
        saveData(DATA);
        fillSettings();
        renderProducts();
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
    fillSettings();
    renderProducts();
    updatePreviewPane();
    toast('Modificări locale șterse.');
  });

  /* ---------- preview pane ---------- */
  function updatePreviewPane() {
    var name = DATA.settings.customNameDefault || 'NUMELE TĂU';
    var bottom = DATA.settings.customBottomDefault || 'SĂRBĂTORI FERICITE';
    var b = $('pvBanner');
    if (b) b.textContent = String(name).toUpperCase();
    var tp = $('pvCurveText') && $('pvCurveText').querySelector('textPath');
    if (tp) tp.textContent = String(bottom).toUpperCase();
  }
})();
