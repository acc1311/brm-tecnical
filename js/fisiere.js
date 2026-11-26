/* BRM TECNICAL — atașare fișiere la comandă (DXF/SVG/PDF/poze)
   Se încarcă DUPĂ js/main.js. Comanda cu fișier pleacă prin formular multipart
   către FormSubmit, cu întoarcere automată pe site. */
(function () {
  'use strict';

  var LIMIT_TOTAL = 8 * 1024 * 1024;   // 8 MB total
  var LIMIT_FILES = 3;
  var EXT = ['.dxf', '.dwg', '.svg', '.ai', '.eps', '.pdf', '.png', '.jpg', '.jpeg', '.webp'];
  var ACCEPT = '.dxf,.dwg,.svg,.ai,.eps,.pdf,.png,.jpg,.jpeg,.webp,image/*,application/pdf';

  function read(k, d) { try { var r = localStorage.getItem(k); return r ? JSON.parse(r) : d; } catch (e) { return d; } }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function $(id) { return document.getElementById(id); }
  function val(id) { var e = $(id); return e ? String(e.value || '').trim() : ''; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function size(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  }
  function email() {
    var ov = read('brm_data', null);
    if (ov && ov.settings && ov.settings.email) return ov.settings.email;
    if (window.BRM_DEFAULT && window.BRM_DEFAULT.settings && window.BRM_DEFAULT.settings.email) return window.BRM_DEFAULT.settings.email;
    return 'brm_tecnical@yahoo.com';
  }
  function code() {
    var a = Date.now().toString(36).slice(-4), b = Math.floor(Math.random() * 1679616).toString(36);
    while (b.length < 4) b = '0' + b;
    return ('BRM-' + a + b).toUpperCase();
  }
  function toast(msg) {
    var t = $('bmToast');
    if (!t) return;
    t.innerHTML = '<span>' + esc(msg) + '</span>';
    t.classList.add('on');
    setTimeout(function () { t.classList.remove('on'); }, 5200);
  }

  /* ---------- întoarcere pe site după trimitere ---------- */
  var m = /[?&]comanda=([A-Za-z0-9-]+)/.exec(location.search);
  if (m) {
    var cod = m[1].toUpperCase(), a = read('brm_orders', []) || [], hit = false;
    for (var i = 0; i < a.length; i++) if (a[i].code === cod) { a[i].status = 'trimisa'; hit = true; }
    if (hit) store('brm_orders', a);
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { }
    setTimeout(function () {
      var pill = $('bmPill');
      if (pill) pill.click();
      toast(hit ? 'Comanda ' + cod + ' a fost trimisă cu fișierele atașate.' : 'Comanda ' + cod + ' a fost trimisă.');
    }, 700);
  }

  /* ---------- interfață ---------- */
  var host = document.querySelector('#bmViewOrder .bm-main');
  if (!host) return;

  var st = document.createElement('style');
  st.textContent = '' +
  '.bm-drop{border:2px dashed var(--bm-line2,#D9C7A3);border-radius:12px;padding:20px 16px;text-align:center;cursor:pointer;' +
    'background:linear-gradient(180deg,#FFFDF9,#F7F1E5);transition:.18s;font-family:Jost,sans-serif}' +
  '.bm-drop:hover,.bm-drop:focus{border-color:#B87333;background:#FFF8EA;outline:none}' +
  '.bm-drop.is-over{border-color:#8F2E1B;background:#FDEFE7;transform:scale(1.01)}' +
  '.bm-drop strong{display:block;font-size:15px;color:#2E3438;margin-bottom:5px}' +
  '.bm-drop span{display:block;font-size:12.5px;color:#5A6268;line-height:1.5}' +
  '.bm-files{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-direction:column;gap:8px}' +
  '.bm-files li{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #E6DAC4;border-radius:9px;padding:10px 12px;font-family:Jost,sans-serif;font-size:13.5px}' +
  '.bm-files .bm-fi{width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;background:linear-gradient(135deg,#3A3F44,#1B1F23);flex:0 0 auto}' +
  '.bm-files .bm-fn{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#2E3438;font-weight:600}' +
  '.bm-files .bm-fs{color:#5A6268;font-size:12px}' +
  '.bm-files button{background:#fff;border:1px solid #D9C7A3;border-radius:6px;padding:6px 10px;font-size:12px;font-weight:600;cursor:pointer;color:#8F2E1B;font-family:Jost,sans-serif}' +
  '.bm-files button:hover{background:#8F2E1B;color:#fff;border-color:#8F2E1B}' +
  '.bm-ftotal{font-size:12px;color:#5A6268;margin:8px 0 0;font-family:Jost,sans-serif}';
  document.head.appendChild(st);

  var block = document.createElement('div');
  block.className = 'bm-block';
  block.innerHTML =
    '<h4>3 · Fișierul tău (opțional)</h4>' +
    '<div class="bm-drop" id="bmDrop" tabindex="0" role="button" aria-label="Încarcă fișier pentru comandă">' +
      '<strong>Trage fișierul aici sau apasă să alegi</strong>' +
      '<span>DXF · DWG · SVG · AI · EPS · PDF · PNG · JPG — maxim ' + LIMIT_FILES + ' fișiere, ' + size(LIMIT_TOTAL) + ' total</span>' +
    '</div>' +
    '<input type="file" id="bmFileInput" multiple accept="' + ACCEPT + '" hidden>' +
    '<ul class="bm-files" id="bmFileList"></ul>' +
    '<p class="bm-ftotal" id="bmFileTotal"></p>' +
    '<p class="bm-err" id="bmFileErr"></p>' +
    '<p class="bm-hint" id="bmFileNote">Ai un desen sau un logo? Atașează-l și tăiem după el. Dacă nu ai fișier, îți facem noi proiectul.</p>';
  host.appendChild(block);

  var FILES = [];
  var drop = $('bmDrop'), input = $('bmFileInput');

  function err(msg) { var e = $('bmFileErr'); if (e) e.textContent = msg || ''; }
  function total() { var s = 0; FILES.forEach(function (f) { s += f.size; }); return s; }

  function render() {
    var ul = $('bmFileList');
    ul.innerHTML = FILES.map(function (f, i) {
      var ext = (f.name.split('.').pop() || '?').toUpperCase().slice(0, 4);
      return '<li><span class="bm-fi">' + esc(ext) + '</span>' +
        '<span class="bm-fn">' + esc(f.name) + '</span>' +
        '<span class="bm-fs">' + size(f.size) + '</span>' +
        '<button type="button" data-rm="' + i + '">Scoate</button></li>';
    }).join('');
    $('bmFileTotal').textContent = FILES.length ? (FILES.length + ' fișier(e) · ' + size(total()) + ' din ' + size(LIMIT_TOTAL)) : '';
    $('bmFileNote').textContent = FILES.length
      ? 'Fișierele pleacă doar prin butonul „Trimite comanda”. Pe email sau WhatsApp le atașezi manual.'
      : 'Ai un desen sau un logo? Atașează-l și tăiem după el. Dacă nu ai fișier, îți facem noi proiectul.';
    var btn = $('bmSend');
    if (btn && !btn.disabled) btn.textContent = FILES.length ? 'Trimite comanda cu fișier →' : 'Trimite comanda →';
  }

  function add(list) {
    err('');
    var rejected = [];
    Array.prototype.forEach.call(list || [], function (f) {
      var low = f.name.toLowerCase(), ok = false;
      EXT.forEach(function (e) { if (low.slice(-e.length) === e) ok = true; });
      if (!ok) { rejected.push(f.name + ' — format neacceptat'); return; }
      if (FILES.length >= LIMIT_FILES) { rejected.push(f.name + ' — maxim ' + LIMIT_FILES + ' fișiere'); return; }
      if (total() + f.size > LIMIT_TOTAL) { rejected.push(f.name + ' — depășește ' + size(LIMIT_TOTAL)); return; }
      var dup = false;
      FILES.forEach(function (x) { if (x.name === f.name && x.size === f.size) dup = true; });
      if (!dup) FILES.push(f);
    });
    if (rejected.length) err(rejected.join(' · '));
    render();
  }

  drop.addEventListener('click', function () { input.click(); });
  drop.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });
  ['dragenter', 'dragover'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); drop.classList.add('is-over'); });
  });
  ['dragleave', 'dragend'].forEach(function (ev) {
    drop.addEventListener(ev, function () { drop.classList.remove('is-over'); });
  });
  drop.addEventListener('drop', function (e) {
    e.preventDefault(); e.stopPropagation();
    drop.classList.remove('is-over');
    if (e.dataTransfer && e.dataTransfer.files) add(e.dataTransfer.files);
  });
  input.addEventListener('change', function () { add(input.files); input.value = ''; });
  $('bmFileList').addEventListener('click', function (e) {
    var b = e.target.closest('[data-rm]');
    if (!b) return;
    FILES.splice(parseInt(b.getAttribute('data-rm'), 10), 1);
    err(''); render();
  });

  /* ---------- date comandă din dialog ---------- */
  function selText(id) { var e = $(id); return e && e.selectedIndex >= 0 ? e.options[e.selectedIndex].text : ''; }
  function visible(id) { var e = $(id); return !!e && e.style.display !== 'none'; }
  function delivery() {
    var b = document.querySelector('#bmDelivery button.is-on');
    return b ? b.getAttribute('data-v') : 'curier';
  }
  function colorName() {
    var b = document.querySelector('#bmColors .bm-chip.is-on');
    return b ? b.textContent.trim() : 'Negru';
  }
  function shapeName() {
    if (!visible('bmShapeRow')) return 'Model din colecție';
    var e = $('bmShape');
    return e && e.selectedIndex >= 0 ? e.options[e.selectedIndex].text : 'Piesă personalizată';
  }

  function collect() {
    var d = {
      title: ($('bmTitle') || {}).textContent || 'Comandă',
      total: ($('bmTotal') || {}).textContent || '',
      tip: shapeName(),
      material: val('bmMaterial'),
      dim: selText('bmSize'),
      culoare: colorName(),
      bucati: val('bmQty') || '1',
      nume: val('bmCName'), tel: val('bmCPhone'), mail: val('bmCMail'),
      adr: val('bmCAddr'), termen: val('bmCDate'), msg: val('bmCMsg'),
      livrare: delivery() === 'curier' ? 'Curier (oriunde în România)' : 'Ridicare din atelier, Târgu Neamț',
      ambalaj: $('bmGift') && $('bmGift').checked ? 'Da' : 'Nu',
      pers: visible('bmPersRow') ? (val('bmName') + ' / ' + val('bmCurve')) : '-'
    };
    return d;
  }

  function text(d, cod, names) {
    var L = ['Bună!', '', 'COMANDĂ: ' + d.title, 'Cod: ' + cod];
    L.push('• Tip piesă: ' + d.tip);
    L.push('• Material: ' + d.material);
    L.push('• Dimensiune: ' + d.dim);
    L.push('• Culoare: ' + d.culoare);
    L.push('• Bucăți: ' + d.bucati);
    L.push('• Personalizare: ' + d.pers);
    L.push('• Livrare: ' + d.livrare);
    L.push('• Ambalaj cadou: ' + d.ambalaj);
    L.push('• Estimare preț: ' + d.total);
    L.push('• Fișiere atașate: ' + names.join(', '));
    L.push('', 'Datele mele:');
    L.push('• Nume: ' + d.nume);
    L.push('• Telefon: ' + d.tel);
    L.push('• Email: ' + d.mail);
    L.push('• Oraș / adresă livrare: ' + d.adr);
    L.push('• Termen dorit: ' + d.termen);
    if (d.msg) L.push('', 'Mesaj: ' + d.msg);
    L.push('', 'Mulțumesc!');
    return L.join('\n');
  }

  function mark(id, errId, bad, msg) {
    var e = $(id), r = $(errId);
    if (e) e.setAttribute('aria-invalid', bad ? 'true' : 'false');
    if (r) r.textContent = bad ? msg : '';
    return !bad;
  }
  function valid(d) {
    var ok = true;
    ok = mark('bmCName', 'bmEName', d.nume.length < 2, 'Scrie numele tău.') && ok;
    ok = mark('bmCPhone', 'bmEPhone', d.tel.replace(/[^0-9]/g, '').length < 9, 'Telefon valid, ca să te sunăm.') && ok;
    ok = mark('bmCMail', 'bmEMail', !!d.mail && !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(d.mail), 'Email incomplet.') && ok;
    ok = mark('bmCAddr', 'bmEAddr', delivery() === 'curier' && d.adr.length < 5, 'Adresa de livrare (oraș, stradă, județ).') && ok;
    if (!ok) {
      var bad = document.querySelector('.bm-dialog [aria-invalid="true"]');
      if (bad) { bad.focus(); bad.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      var s = $('bmStatus');
      if (s) { s.textContent = 'Mai lipsesc câteva date.'; s.className = 'bm-status err'; }
    }
    return ok;
  }

  /* ---------- trimitere cu atașament ---------- */
  function sendWithFiles() {
    var d = collect();
    if (!valid(d)) return;
    var btn = $('bmSend');
    var cod = code(), names = FILES.map(function (f) { return f.name + ' (' + size(f.size) + ')'; });
    var txt = text(d, cod, names);

    var carrier;
    try {
      var dt = new DataTransfer();
      FILES.forEach(function (f) { dt.items.add(f); });
      carrier = document.createElement('input');
      carrier.type = 'file'; carrier.name = 'attachment'; carrier.multiple = true;
      carrier.files = dt.files;
    } catch (e) {
      err('Browserul nu permite atașarea automată. Trimite comanda fără fișier și atașează-l manual pe email.');
      return;
    }

    var a = read('brm_orders', []) || [];
    a.unshift({ code: cod, ts: Date.now(), title: d.title, total: parseFloat(String(d.total).replace(/[^0-9.]/g, '')) || 0, status: 'netrimisa', text: txt });
    if (a.length > 40) a.length = 40;
    store('brm_orders', a);
    store('brm_pending', { code: cod, ts: Date.now(), files: names });

    var form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://formsubmit.co/' + encodeURIComponent(email());
    form.enctype = 'multipart/form-data';
    form.acceptCharset = 'UTF-8';
    form.style.display = 'none';
    function hid(n, v) {
      var i = document.createElement('input');
      i.type = 'hidden'; i.name = n; i.value = v == null ? '' : String(v);
      form.appendChild(i);
    }
    hid('_subject', 'Comandă ' + cod + ' · ' + d.title + ' (cu fișier)');
    hid('_template', 'table');
    hid('_captcha', 'false');
    hid('_honey', '');
    hid('_next', location.origin + location.pathname + '?comanda=' + cod);
    hid('Cod', cod); hid('Piesa', d.title); hid('Tip', d.tip);
    hid('Material', d.material); hid('Dimensiune', d.dim); hid('Culoare', d.culoare);
    hid('Bucati', d.bucati); hid('Personalizare', d.pers);
    hid('Livrare', d.livrare); hid('Ambalaj', d.ambalaj); hid('Estimare', d.total);
    hid('Nume', d.nume); hid('Telefon', d.tel); hid('Email', d.mail || '-');
    hid('Adresa', d.adr || '-'); hid('Termen', d.termen || '-'); hid('Mesaj', d.msg || '-');
    hid('Fisiere', names.join(', '));
    hid('Comanda_text', txt);
    form.appendChild(carrier);
    document.body.appendChild(form);

    if (btn) { btn.disabled = true; btn.textContent = 'Se trimite cu fișier…'; }
    var s = $('bmStatus');
    if (s) { s.textContent = 'Se urcă fișierul și se trimite comanda. Te întorci automat pe site.'; s.className = 'bm-status'; }
    form.submit();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#bmSend');
    if (!b || !FILES.length) return;
    e.preventDefault();
    e.stopPropagation();
    sendWithFiles();
  }, true);

  render();
})();
