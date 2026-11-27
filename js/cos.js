/* BRM TECNICAL — js/cos.js : coș de cumpărături + comandă multi-produs.
   Se încarcă DUPĂ js/main.js. Comanda pleacă pe email (FormSubmit) și,
   dacă e configurat în admin (Setări → URL Comenzi), și în Google Sheets. */
(function () {
  'use strict';
  var LS_CART = 'brm_cart', LS_ORDERS = 'brm_orders', LS_CUSTOMER = 'brm_customer';
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function money(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' lei'; }
  function readLS(k, d) { try { var r = localStorage.getItem(k); return r ? JSON.parse(r) : d; } catch (e) { return d; } }
  function writeLS(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function settings() {
    var s = (window.BRM_DEFAULT && window.BRM_DEFAULT.settings) || {};
    var ov = readLS('brm_data', null);
    if (ov && ov.settings) s = Object.assign({}, s, ov.settings);
    return s;
  }
  var S = settings();
  var EMAIL = S.email || 'brm_tecnical@yahoo.com';
  var SHEET_URL = String(S.ordersUrl || '').trim();
  var COURIER = (S.courier != null && isFinite(+S.courier)) ? +S.courier : 25;
  function products() { return (window.BRM_DEFAULT && window.BRM_DEFAULT.products) || []; }
  function findP(id) { var a = products(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  var CART = readLS(LS_CART, []) || [];
  var delivery = 'curier';

  var css = '' +
  '#cosBtn{position:fixed;left:18px;bottom:18px;z-index:2147481000;display:flex;align-items:center;gap:9px;font-family:Jost,sans-serif;font-size:14px;font-weight:600;color:#FBF8F2;cursor:pointer;background:linear-gradient(135deg,#8F2E1B,#6F2314);border:1px solid rgba(201,162,39,.5);padding:12px 17px;border-radius:999px;box-shadow:0 16px 34px rgba(27,31,35,.35)}' +
  '#cosBtn b{background:#C9A227;color:#1B1F23;border-radius:999px;padding:1px 8px;font-size:12.5px}' +
  '#cosBtn:hover{transform:translateY(-1px)}' +
  '.cos-add{margin-top:8px;width:100%;font-family:Jost,sans-serif;font-size:13px;font-weight:600;color:#2E3438;background:#fff;border:1px solid #D9C7A3;border-radius:6px;padding:8px 10px;cursor:pointer;transition:.15s}' +
  '.cos-add:hover{border-color:#8F2E1B;color:#8F2E1B}' +
  '.cos-add.in{background:#1F7A4D;border-color:#1F7A4D;color:#fff}' +
  '#cosOv{position:fixed;inset:0;background:rgba(15,12,9,.55);z-index:2147482400;opacity:0;pointer-events:none;transition:.25s}' +
  '#cosOv.on{opacity:1;pointer-events:auto}' +
  '#cosDrawer{position:fixed;top:0;right:0;bottom:0;width:min(430px,100vw);background:linear-gradient(180deg,#FFFDF9,#FBF8F2);z-index:2147482500;transform:translateX(102%);transition:transform .3s cubic-bezier(.2,.8,.2,1);display:flex;flex-direction:column;font-family:Jost,sans-serif;color:#2E3438;box-shadow:-20px 0 60px rgba(0,0,0,.3)}' +
  '#cosDrawer.on{transform:none}' +
  '#cosDrawer *{box-sizing:border-box}' +
  '.cos-head{display:flex;align-items:center;gap:10px;padding:16px 18px;border-bottom:1px solid #E6DAC4}' +
  '.cos-head h3{margin:0;font-family:"Cormorant Garamond",serif;font-size:24px;font-weight:600;flex:1}' +
  '.cos-x{background:none;border:0;font-size:26px;line-height:1;color:#3A3F44;cursor:pointer;padding:2px 8px;border-radius:8px}' +
  '.cos-x:hover{color:#8F2E1B}' +
  '.cos-body{flex:1;overflow:auto;padding:16px 18px}' +
  '.cos-item{display:grid;grid-template-columns:64px 1fr auto;gap:12px;align-items:center;background:#fff;border:1px solid #E6DAC4;border-radius:10px;padding:10px;margin-bottom:10px}' +
  '.cos-item img{width:64px;height:64px;object-fit:contain;background:#F7F1E5;border-radius:8px;padding:4px}' +
  '.cos-item h5{margin:0 0 4px;font-size:14.5px;font-weight:600;line-height:1.3}' +
  '.cos-item p{margin:0;font-size:13px;color:#5A6268}' +
  '.cos-q{display:flex;align-items:center;gap:6px;justify-content:flex-end}' +
  '.cos-q button{width:28px;height:28px;border:1px solid #D9C7A3;background:#fff;border-radius:6px;cursor:pointer;font-size:15px;line-height:1}' +
  '.cos-q button:hover{border-color:#8F2E1B;color:#8F2E1B}' +
  '.cos-q span{min-width:22px;text-align:center;font-weight:600}' +
  '.cos-rm{background:none;border:0;color:#9B1C1C;font-size:12px;cursor:pointer;padding:4px 0;text-decoration:underline}' +
  '.cos-total{display:flex;justify-content:space-between;align-items:baseline;padding:12px 14px;background:linear-gradient(135deg,rgba(201,162,39,.16),rgba(184,115,51,.16));border:1px solid #D9C7A3;border-radius:10px;margin:6px 0 14px}' +
  '.cos-total span{font-size:11.5px;letter-spacing:.16em;text-transform:uppercase;color:#3A3F44;font-weight:600}' +
  '.cos-total strong{font-size:24px;font-family:"Cormorant Garamond",serif;color:#8F2E1B}' +
  '.cos-fld{display:flex;flex-direction:column;gap:5px;margin-bottom:10px}' +
  '.cos-fld>span{font-size:10.5px;letter-spacing:.13em;text-transform:uppercase;color:#3A3F44;font-weight:600}' +
  '#cosDrawer input,#cosDrawer select,#cosDrawer textarea{width:100%;font-family:Jost,sans-serif;font-size:14.5px;color:#2E3438;background:#FFFDF9;border:1px solid #D9C7A3;border-radius:7px;padding:10px 11px;outline:none}' +
  '#cosDrawer input:focus,#cosDrawer textarea:focus{border-color:#8F2E1B;box-shadow:0 0 0 3px rgba(143,46,27,.12)}' +
  '.cos-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
  '.cos-seg{display:flex;border:1px solid #D9C7A3;border-radius:7px;overflow:hidden}' +
  '.cos-seg button{flex:1;border:0;background:#FFFDF9;font-family:Jost,sans-serif;font-size:13px;font-weight:600;color:#3A3F44;padding:10px 6px;cursor:pointer}' +
  '.cos-seg button.on{background:linear-gradient(135deg,#B87333,#8F2E1B);color:#FFF6EC}' +
  '.cos-send{width:100%;font-family:Jost,sans-serif;font-size:15.5px;font-weight:600;color:#FFF3E8;border:0;border-radius:8px;padding:14px;cursor:pointer;background:linear-gradient(135deg,#8F2E1B,#6F2314);box-shadow:0 10px 24px rgba(143,46,27,.3)}' +
  '.cos-send:disabled{opacity:.6;cursor:progress}' +
  '.cos-err{font-size:12px;color:#9B1C1C;margin:6px 0 0}' +
  '.cos-ok{text-align:center;padding:30px 10px}' +
  '.cos-ok h4{font-family:"Cormorant Garamond",serif;font-size:26px;margin:0 0 8px}' +
  '.cos-ok .c{display:inline-block;font-family:"Saira Stencil One",Jost,sans-serif;background:#2E3438;color:#C9A227;padding:7px 14px;border-radius:8px;margin:6px 0 12px}' +
  '.cos-empty{text-align:center;color:#5A6268;padding:40px 10px;font-size:14.5px}' +
  '@media(max-width:520px){#cosBtn{left:12px;bottom:12px;padding:11px 15px}}' +
  '@media print{#cosBtn,#cosDrawer,#cosOv{display:none!important}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var btn = document.createElement('button'); btn.id = 'cosBtn'; btn.type = 'button';
  btn.innerHTML = '<span>🛒 Coș</span><b id="cosCount">0</b>';
  document.body.appendChild(btn);
  var ov = document.createElement('div'); ov.id = 'cosOv'; document.body.appendChild(ov);
  var dr = document.createElement('aside'); dr.id = 'cosDrawer'; dr.setAttribute('aria-label', 'Coș de cumpărături');
  dr.innerHTML = '<div class="cos-head"><h3>Coșul tău</h3><button type="button" class="cos-x" id="cosClose" aria-label="Închide">×</button></div><div class="cos-body" id="cosBody"></div>';
  document.body.appendChild(dr);

  function cartCount() { var n = 0; CART.forEach(function (i) { n += i.qty; }); return n; }
  function cartTotal() { var t = 0; CART.forEach(function (i) { var p = findP(i.id); if (p) t += p.price * i.qty; }); return t; }
  function renderBadge() { var c = $('cosCount'); if (c) c.textContent = String(cartCount()); }
  function saveCart() { writeLS(LS_CART, CART); renderBadge(); }

  function addItem(id) {
    if (!findP(id)) return;
    var ex = null; CART.forEach(function (i) { if (i.id === id) ex = i; });
    if (ex) ex.qty = Math.min(20, ex.qty + 1); else CART.push({ id: id, qty: 1 });
    saveCart(); openDrawer(); renderDrawer();
  }
  function setQty(id, d) {
    CART.forEach(function (i) { if (i.id === id) i.qty = Math.min(20, Math.max(1, i.qty + d)); });
    saveCart(); renderDrawer();
  }
  function removeItem(id) { CART = CART.filter(function (i) { return i.id !== id; }); saveCart(); renderDrawer(); }
  function openDrawer() { dr.classList.add('on'); ov.classList.add('on'); renderDrawer(); }
  function closeDrawer() { dr.classList.remove('on'); ov.classList.remove('on'); }
  btn.addEventListener('click', openDrawer);
  ov.addEventListener('click', closeDrawer);

  function decorate() {
    Array.prototype.forEach.call(document.querySelectorAll('#grid .card'), function (card) {
      if (card.querySelector('.cos-add')) return;
      var a = card.querySelector('a[data-order]'), b = card.querySelector('.card-b');
      if (!a || !b) return;
      var nb = document.createElement('button');
      nb.type = 'button'; nb.className = 'cos-add'; nb.textContent = '+ Adaugă în coș';
      nb.setAttribute('data-cos', a.getAttribute('data-order'));
      b.appendChild(nb);
    });
    syncAddButtons();
  }
  function syncAddButtons() {
    Array.prototype.forEach.call(document.querySelectorAll('.cos-add'), function (b) {
      var id = b.getAttribute('data-cos');
      var inCart = CART.some(function (i) { return i.id === id; });
      b.classList.toggle('in', inCart);
      b.textContent = inCart ? '✓ În coș' : '+ Adaugă în coș';
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-cos]') : null;
    if (b) addItem(b.getAttribute('data-cos'));
  });
  var gridEl = $('grid');
  if (gridEl && 'MutationObserver' in window) new MutationObserver(function () { decorate(); }).observe(gridEl, { childList: true, subtree: true });
  setInterval(decorate, 2000);
  decorate();

  var checkoutMode = false, lastOrder = null;
  function renderDrawer() {
    var body = $('cosBody'); if (!body) return;
    if (lastOrder) { body.innerHTML = doneHtml(lastOrder); lastOrder = null; return; }
    if (!CART.length) {
      body.innerHTML = '<div class="cos-empty"><strong style="display:block;font-family:\'Cormorant Garamond\',serif;font-size:22px;color:#2E3438;margin-bottom:6px">Coșul e gol</strong>Adaugă piese din colecție cu „+ Adaugă în coș”.</div>';
      return;
    }
    body.innerHTML = cartHtml() + (checkoutMode ? formHtml() : '');
  }
  function cartHtml() {
    var rows = CART.map(function (i) {
      var p = findP(i.id); if (!p) return '';
      return '<div class="cos-item"><img src="' + esc(p.img) + '" alt="">' +
        '<div><h5>' + esc(p.name) + '</h5><p>' + esc(p.price) + ' lei / buc</p>' +
        '<button type="button" class="cos-rm" data-crm="' + esc(i.id) + '">Scoate</button></div>' +
        '<div><div class="cos-q"><button type="button" data-cq="-1" data-cid="' + esc(i.id) + '">−</button><span>' + i.qty + '</span><button type="button" data-cq="1" data-cid="' + esc(i.id) + '">+</button></div>' +
        '<p style="margin:6px 0 0;font-weight:600;text-align:right">' + money(p.price * i.qty) + '</p></div></div>';
    }).join('');
    var ship = delivery === 'curier' ? COURIER : 0;
    return rows +
      '<div class="cos-total"><span>Total + livrare</span><strong>' + money(cartTotal() + ship) + '</strong></div>' +
      (checkoutMode ? '' : '<button type="button" class="cos-send" id="cosToCheckout">Finalizează comanda →</button>');
  }
  function formHtml() {
    var c = readLS(LS_CUSTOMER, {}) || {};
    return '<div id="cosForm">' +
      '<div class="cos-row2"><label class="cos-fld"><span>Nume și prenume *</span><input id="coNume" value="' + esc(c.nume || '') + '"></label>' +
      '<label class="cos-fld"><span>Telefon *</span><input id="coTel" value="' + esc(c.tel || '') + '"></label></div>' +
      '<label class="cos-fld"><span>Email</span><input id="coMail" type="email" value="' + esc(c.mail || '') + '"></label>' +
      '<label class="cos-fld"><span>Oraș / adresă livrare *</span><input id="coAdr" value="' + esc(c.adr || '') + '"></label>' +
      '<div class="cos-row2"><label class="cos-fld"><span>Termen dorit</span><input id="coTermen" type="date"></label>' +
      '<div class="cos-fld"><span>Livrare</span><div class="cos-seg" id="coDeliv"><button type="button" class="' + (delivery === 'curier' ? 'on' : '') + '" data-d="curier">Curier +' + COURIER + ' lei</button><button type="button" class="' + (delivery === 'atelier' ? 'on' : '') + '" data-d="atelier">Ridic din atelier</button></div></div></div>' +
      '<label class="cos-fld"><span>Mesaj (opțional)</span><textarea id="coMsg" rows="2"></textarea></label>' +
      '<p class="cos-err" id="coErr"></p>' +
      '<button type="button" class="cos-send" id="cosSend" style="margin-top:10px">Trimite comanda →</button>' +
      '<button type="button" class="cos-rm" id="cosBack" style="display:block;margin:10px auto 0">← Înapoi la coș</button></div>';
  }
  function doneHtml(o) {
    return '<div class="cos-ok"><h4>Comanda a plecat!</h4><div class="c">' + esc(o.code) + '</div>' +
      '<p style="font-size:14px;color:#5A6268;line-height:1.55">Am primit ' + o.items + ' produs(e). Îți trimitem confirmarea în 24 de ore la ' + (o.mail ? esc(o.mail) : esc(o.tel)) + '. Păstrează codul.</p>' +
      '<button type="button" class="cos-send" id="cosDoneClose" style="margin-top:16px">Închide</button></div>';
  }

  dr.addEventListener('click', function (e) {
    if (e.target.id === 'cosClose') { closeDrawer(); return; }
    var t = e.target.closest ? e.target.closest('button') : null;
    if (!t) return;
    if (t.id === 'cosToCheckout') { checkoutMode = true; renderDrawer(); return; }
    if (t.id === 'cosBack') { checkoutMode = false; renderDrawer(); return; }
    if (t.id === 'cosDoneClose') { checkoutMode = false; closeDrawer(); return; }
    if (t.id === 'cosSend') { sendOrder(); return; }
    var cq = t.getAttribute('data-cq'); if (cq) { setQty(t.getAttribute('data-cid'), +cq); return; }
    var cr = t.getAttribute('data-crm'); if (cr) { removeItem(cr); return; }
    var d = t.getAttribute('data-d');
    if (d) {
      delivery = d;
      Array.prototype.forEach.call(document.querySelectorAll('#coDeliv button'), function (b) { b.classList.toggle('on', b.getAttribute('data-d') === delivery); });
      renderDrawer();
    }
  });

  function code() {
    var a = Date.now().toString(36).slice(-4), b = Math.floor(Math.random() * 1679616).toString(36);
    while (b.length < 4) b = '0' + b;
    return ('BRM-' + a + b).toUpperCase();
  }
  function sendOrder() {
    var nume = (($('coNume') || {}).value || '').trim(), tel = (($('coTel') || {}).value || '').trim(),
      mail = (($('coMail') || {}).value || '').trim(), adr = (($('coAdr') || {}).value || '').trim(),
      termen = (($('coTermen') || {}).value || ''), msg = (($('coMsg') || {}).value || '';
    msg = msg.trim();
    var err = $('coErr');
    function bad(m) { if (err) err.textContent = m; }
    if (nume.length < 2) { bad('Scrie numele tău.'); return; }
    if (tel.replace(/[^0-9]/g, '').length < 9) { bad('Telefon valid, ca să te sunăm.'); return; }
    if (mail && !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(mail)) { bad('Email incomplet.'); return; }
    if (delivery === 'curier' && adr.length < 5) { bad('Adresa de livrare (oraș, stradă, județ).'); return; }
    bad('');
    writeLS(LS_CUSTOMER, { nume: nume, tel: tel, mail: mail, adr: adr });
    var cod = code();
    var lines = CART.map(function (i) { var p = findP(i.id); return p ? (i.qty + ' × ' + p.name + ' (' + p.price + ' lei)') : ''; }).filter(Boolean);
    var total = cartTotal() + (delivery === 'curier' ? COURIER : 0);
    var L = ['Bună!', '', 'COMANDĂ COȘ: ' + cod, '• Produse:'];
    lines.forEach(function (x) { L.push('   - ' + x); });
    L.push('• Livrare: ' + (delivery === 'curier' ? 'Curier (+' + COURIER + ' lei)' : 'Ridicare din atelier, Târgu Neamț'));
    L.push('• Total estimat: ' + money(total), '', 'Datele mele:');
    L.push('• Nume: ' + nume, '• Telefon: ' + tel, '• Email: ' + mail, '• Oraș / adresă: ' + adr, '• Termen dorit: ' + termen);
    if (msg) L.push('', 'Mesaj: ' + msg);
    L.push('', 'Mulțumesc!');
    var text = L.join('\n');
    var bs = $('cosSend'); if (bs) { bs.disabled = true; bs.textContent = 'Se trimite…'; }
    fetch('https://formsubmit.co/ajax/' + encodeURIComponent(EMAIL), {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ _subject: 'Comandă coș ' + cod, _template: 'table', _captcha: 'false', _honey: '', Cod: cod, Produse: lines.join('; '), Total: money(total), Livrare: delivery, Nume: nume, Telefon: tel, Email: mail || '-', Adresa: adr || '-', Termen: termen || '-', Mesaj: msg || '-', Comanda_text: text })
    }).catch(function () { }).then(function () {
      if (SHEET_URL) {
        return fetch(SHEET_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ cod: cod, nume: nume, telefon: tel, email: mail, adresa: adr, termen: termen, piese: lines.join('; '), total: total, livrare: delivery, detalii: text }) }).catch(function () { });
      }
    }).then(function () {
      var a = readLS(LS_ORDERS, []) || [];
      a.unshift({ code: cod, ts: Date.now(), title: 'Coș (' + cartCount() + ' produse)', total: total, status: 'trimisa', text: text });
      if (a.length > 40) a.length = 40;
      writeLS(LS_ORDERS, a);
      lastOrder = { code: cod, items: cartCount(), mail: mail, tel: tel };
      CART = []; saveCart(); checkoutMode = false;
      syncAddButtons(); renderDrawer();
    });
  }
  renderBadge();
})();