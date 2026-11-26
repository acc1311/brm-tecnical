/* BRM TECNICAL — js/main.js
   Render din data.js + personalizator live + flux de comandă complet.
   Foto reală a fiecărui produs + previzualizare text la cerere.
   Email prin Gmail / Yahoo / Outlook în browser (nu cere program instalat).
   FormSubmit: prima comandă trimisă cere activarea pe adresa din CFG.email (verifică și Spam). */
(function () {
  'use strict';

  /* ===================== CONFIG ===================== */
  var CFG = {
    email: 'brm_tecnical@yahoo.com',
    whatsapp: '',          // ex: '40712345678' (fără +, fără spații). Gol = butonul nu apare.
    sendOnline: true,      // trimitere directă pe email prin FormSubmit (gratuit, fără cont)
    courier: 25,
    gift: 25
  };
  /* ================================================== */

  var LS_ORDERS = 'brm_orders';
  var LS_CUSTOMER = 'brm_customer';

  /* ===================== CORE ===================== */
  var CORE = {
    sizes: [
      { v: 30, label: 'Ø 30 cm', mul: 0.85 },
      { v: 40, label: 'Ø 40 cm', mul: 1.00 },
      { v: 50, label: 'Ø 50 cm', mul: 1.25 },
      { v: 60, label: 'Ø 60 cm', mul: 1.50 }
    ],
    colors: [
      { v: 'negru', label: 'Negru', hex: '#1C1814' },
      { v: 'rosu', label: 'Roșu', hex: '#8F2E1B' },
      { v: 'auriu', label: 'Auriu', hex: '#8A6A2C' }
    ],
    norm: function (s) {
      return String(s == null ? '' : s).toLowerCase()
        .replace(/[ăâ]/g, 'a').replace(/î/g, 'i')
        .replace(/[șş]/g, 's').replace(/[țţ]/g, 't');
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
    sizeBy: function (v) {
      for (var i = 0; i < CORE.sizes.length; i++) if (CORE.sizes[i].v === +v) return CORE.sizes[i];
      return CORE.sizes[1];
    },
    colorBy: function (v) {
      for (var i = 0; i < CORE.colors.length; i++) if (CORE.colors[i].v === v) return CORE.colors[i];
      return CORE.colors[0];
    },
    money: function (n) {
      return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' lei';
    },
    price: function (o) {
      var sz = CORE.sizeBy(o.size);
      var mat = CORE.matAdd(o.material);
      var unit = (o.base || 0) * sz.mul + mat + (o.gift ? CFG.gift : 0);
      var pieces = unit * (o.qty || 1);
      var ship = o.delivery === 'curier' ? CFG.courier : 0;
      return { mul: sz.mul, mat: mat, unit: Math.round(unit), pieces: Math.round(pieces), ship: ship, total: Math.round(pieces + ship) };
    },
    phoneOk: function (v) { var d = String(v || '').replace(/[^0-9]/g, ''); return d.length >= 9 && d.length <= 15; },
    mailOk: function (v) { return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(String(v || '').trim()); },
    code: function () {
      var a = Date.now().toString(36).slice(-4);
      var b = Math.floor(Math.random() * 1679616).toString(36);
      while (b.length < 4) b = '0' + b;
      return ('BRM-' + a + b).toUpperCase();
    },
    deliveryLabel: function (v) { return v === 'curier' ? 'Curier (oriunde în România)' : 'Ridicare din atelier, Târgu Neamț'; },
    buildText: function (o, p) {
      var L = ['Bună!', '', 'COMANDĂ: ' + o.title];
      if (o.code) L.push('Cod: ' + o.code);
      L.push('• Material: ' + o.material);
      L.push('• Dimensiune: ' + CORE.sizeBy(o.size).label);
      L.push('• Culoare: ' + CORE.colorBy(o.color).label);
      L.push('• Bucăți: ' + o.qty);
      if (o.personalizable) {
        L.push('• Nume pe banner: ' + (o.pname || '—'));
        L.push('• Text curbat jos: ' + (o.pcurve || '—'));
      }
      L.push('• Livrare: ' + CORE.deliveryLabel(o.delivery));
      L.push('• Ambalaj cadou: ' + (o.gift ? 'Da' : 'Nu'));
      L.push('• Estimare preț: ' + CORE.money(p.total));
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
    mailto: function (subject, body) {
      return 'mailto:' + CFG.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    },
    webmail: function (kind, subject, body) {
      var to = encodeURIComponent(CFG.email), su = encodeURIComponent(subject), bo = encodeURIComponent(body);
      if (kind === 'gmail') return 'https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=' + to + '&su=' + su + '&body=' + bo;
      if (kind === 'yahoo') return 'https://compose.mail.yahoo.com/?to=' + to + '&subj=' + su + '&subject=' + su + '&body=' + bo;
      if (kind === 'outlook') return 'https://outlook.live.com/mail/0/deeplink/compose?to=' + to + '&subject=' + su + '&body=' + bo;
      return CORE.mailto(subject, body);
    },
    parseMailto: function (href) {
      var out = { subject: '', body: '', product: '', price: 0 };
      var q = String(href || '').split('?')[1] || '';
      var p = {};
      q.split('&').forEach(function (kv) {
        var i = kv.indexOf('=');
        if (i > 0) {
          try { p[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1).replace(/\+/g, ' ')); }
          catch (e) { p[kv.slice(0, i)] = kv.slice(i + 1); }
        }
      });
      out.subject = p.subject || '';
      out.body = p.body || '';
      out.product = out.subject.replace(/^Comand[aă]:\s*/i, '').trim();
      var m = out.body.match(/Pre[țt]\s*afi[șs]at:\s*([0-9]+)/i);
      if (m) out.price = +m[1];
      return out;
    }
  };

  /* ===================== DATE ===================== */
  function loadData() {
    var base = window.BRM_DEFAULT || { settings: {}, products: [] };
    try {
      var raw = localStorage.getItem('brm_data');
      if (raw) {
        var ov = JSON.parse(raw);
        if (ov && ov.settings && ov.products) {
          return { settings: Object.assign({}, base.settings, ov.settings), products: ov.products };
        }
      }
    } catch (e) { }
    return { settings: base.settings || {}, products: base.products || [] };
  }

  var DATA = loadData();
  var S = DATA.settings;
  var MAIL = S.email || CFG.email;
  CFG.email = MAIL;
  var products = DATA.products || [];

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function html(id, v) { var el = $(id); if (el && v != null) el.innerHTML = v; }
  function text(id, v) { var el = $(id); if (el && v != null) el.textContent = v; }
  function attr(id, a, v) { var el = $(id); if (el && v != null) el.setAttribute(a, v); }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function read(k, d) { try { var r = localStorage.getItem(k); return r ? JSON.parse(r) : d; } catch (e) { return d; } }

  var MATERIALS = (Array.isArray(S.materials) && S.materials.length ? S.materials : [
    { name: 'Oțel Carbon', color: '#3A3F44' }, { name: 'Inox', color: '#C9CED3' },
    { name: 'Aluminiu', color: '#DFE3E6' }, { name: 'Alamă', color: '#C9A227' },
    { name: 'Cupru', color: '#B87333' }, { name: 'Tablă Galvanizată', color: '#8A9AA5' }
  ]);

  var SRC = {
    negru: 'images/coronita-model.png',
    rosu: 'images/coronita-model-rosu.png',
    auriu: 'images/coronita-model-auriu.png'
  };

  /* ===================== STILURI ===================== */
  var CSS = '' +
  ':root{--bm-ink:#1B1F23;--bm-steel:#3A3F44;--bm-graphite:#2E3438;--bm-red:#8F2E1B;--bm-red2:#6F2314;' +
    '--bm-gold:#B89470;--bm-brass:#C9A227;--bm-copper:#B87333;--bm-ivory:#FBF8F2;--bm-sand:#F4EEE4;' +
    '--bm-line:#E6DAC4;--bm-line2:#D9C7A3;--bm-ok:#1F7A4D;--bm-warn:#B45309;--bm-info:#1D4ED8;--bm-danger:#9B1C1C;}' +
  'html{scrollbar-color:var(--bm-gold) var(--bm-sand);scrollbar-width:thin}' +
  '::-webkit-scrollbar{width:11px;height:11px}' +
  '::-webkit-scrollbar-track{background:var(--bm-sand)}' +
  '::-webkit-scrollbar-thumb{background:linear-gradient(180deg,var(--bm-gold),var(--bm-copper));border:2px solid var(--bm-sand);border-radius:9px}' +
  '::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,var(--bm-brass),var(--bm-red))}' +
  'section[id],main[id]{scroll-margin-top:96px}' +
  '#bmProgress{position:fixed;top:0;left:0;height:3px;width:0;z-index:2147482000;' +
    'background:linear-gradient(90deg,var(--bm-brass),var(--bm-red),var(--bm-copper));box-shadow:0 0 12px rgba(184,115,51,.6);transition:width .12s linear}' +
  '.head.is-stuck{box-shadow:0 10px 30px rgba(40,22,6,.14)}' +
  '.nav a.is-active{color:var(--bm-red)}' +
  '.nav a.is-active::after{content:"";display:block;height:2px;margin-top:3px;background:linear-gradient(90deg,var(--bm-brass),var(--bm-red))}' +
  '[data-bm-reveal]{opacity:0;transform:translateY(20px);transition:opacity .75s cubic-bezier(.2,.7,.2,1),transform .75s cubic-bezier(.2,.7,.2,1)}' +
  '[data-bm-reveal].bm-in{opacity:1;transform:none}' +
  '[hidden]{display:none!important}' +
  '#bmPill{position:fixed;right:18px;bottom:18px;z-index:2147481000;display:none;align-items:center;gap:9px;' +
    'font-family:Jost,sans-serif;font-size:14px;font-weight:600;color:var(--bm-ivory);cursor:pointer;' +
    'background:linear-gradient(135deg,var(--bm-steel),var(--bm-ink));border:1px solid rgba(201,162,39,.45);' +
    'padding:12px 17px;border-radius:999px;box-shadow:0 16px 34px rgba(27,31,35,.35)}' +
  '#bmPill.on{display:flex}' +
  '#bmPill:hover{border-color:var(--bm-brass);transform:translateY(-1px)}' +
  '#bmPill b{background:var(--bm-brass);color:var(--bm-ink);border-radius:999px;padding:1px 8px;font-size:12.5px}' +
  '.bm-scrim{position:fixed;inset:0;z-index:2147482500;background:radial-gradient(120% 90% at 50% 0%,rgba(60,34,12,.55),rgba(15,12,9,.78));' +
    'backdrop-filter:blur(4px);opacity:0;transition:opacity .28s ease}' +
  '.bm-scrim.on{opacity:1}' +
  '.bm-dialog{position:fixed;z-index:2147482600;left:50%;top:50%;transform:translate(-50%,-46%) scale(.97);opacity:0;' +
    'width:min(1040px,96vw);max-height:92vh;display:flex;flex-direction:column;overflow:hidden;' +
    'background:linear-gradient(180deg,#FFFDF9,var(--bm-ivory) 40%,var(--bm-sand));' +
    'border:1px solid var(--bm-line2);border-radius:16px;box-shadow:0 40px 100px rgba(28,16,6,.5);' +
    'font-family:Jost,sans-serif;color:var(--bm-graphite);transition:opacity .3s ease,transform .34s cubic-bezier(.2,.8,.2,1)}' +
  '.bm-dialog.on{opacity:1;transform:translate(-50%,-50%) scale(1)}' +
  '.bm-dialog *{box-sizing:border-box}' +
  '.bm-head{display:flex;align-items:center;gap:16px;padding:14px 18px;border-bottom:1px solid var(--bm-line);' +
    'background:linear-gradient(90deg,rgba(244,238,228,.95),rgba(251,248,242,.95));flex:0 0 auto}' +
  '.bm-mark{font-family:"Saira Stencil One",Jost,sans-serif;font-size:17px;letter-spacing:.06em;color:var(--bm-ivory);' +
    'background:linear-gradient(135deg,var(--bm-steel),var(--bm-ink));padding:4px 10px 3px;border-radius:5px}' +
  '.bm-brandtxt{font-size:11.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--bm-steel);font-weight:600}' +
  '.bm-tabs{display:flex;gap:6px;margin-left:auto}' +
  '.bm-tab{font-family:Jost,sans-serif;font-size:13.5px;font-weight:600;color:var(--bm-steel);background:#fff;' +
    'border:1px solid var(--bm-line2);border-radius:999px;padding:8px 14px;cursor:pointer;transition:.18s}' +
  '.bm-tab:hover{border-color:var(--bm-red);color:var(--bm-red)}' +
  '.bm-tab.is-on{background:linear-gradient(135deg,var(--bm-steel),var(--bm-ink));color:var(--bm-ivory);border-color:transparent}' +
  '.bm-tab span{opacity:.75;font-size:12px}' +
  '.bm-close{background:none;border:0;font-size:27px;line-height:1;color:var(--bm-steel);cursor:pointer;padding:2px 8px;border-radius:8px}' +
  '.bm-close:hover{color:var(--bm-red);background:rgba(143,46,27,.08)}' +
  '.bm-body{overflow:auto;padding:20px 18px;flex:1 1 auto;overscroll-behavior:contain}' +
  '.bm-view{display:none}.bm-view.is-on{display:block;animation:bmIn .35s cubic-bezier(.2,.8,.2,1)}' +
  '@keyframes bmIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}' +
  '.bm-grid{display:grid;grid-template-columns:330px 1fr;gap:22px;align-items:start}' +
  '.bm-side{position:sticky;top:0}' +
  '.bm-stage{position:relative;width:100%;aspect-ratio:1/1;border-radius:14px;overflow:hidden;' +
    'background:radial-gradient(80% 70% at 50% 25%,#FFF9EC,#EFE6D6 60%,#DCCEB6);border:1px solid var(--bm-line2)}' +
  '.bm-stage img{width:100%;height:100%;object-fit:contain;padding:8px;filter:drop-shadow(4px 12px 16px rgba(40,22,6,.28))}' +
  '.bm-stage::after{content:"";position:absolute;inset:0;pointer-events:none;' +
    'background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.45) 48%,transparent 60%);' +
    'transform:translateX(-120%);animation:bmSheen 7s ease-in-out infinite}' +
  '@keyframes bmSheen{0%,74%{transform:translateX(-120%)}90%,100%{transform:translateX(120%)}}' +
  '.bm-pv{position:absolute;right:10px;top:10px;z-index:2;font-family:Jost,sans-serif;font-size:12px;font-weight:600;' +
    'background:rgba(27,31,35,.85);color:var(--bm-ivory);border:1px solid rgba(201,162,39,.5);border-radius:999px;padding:7px 12px;cursor:pointer;transition:.16s}' +
  '.bm-pv:hover{background:var(--bm-red);border-color:var(--bm-red)}' +
  '.bm-banner{position:absolute;top:51%;left:14%;right:14%;transform:translateY(-50%);text-align:center;' +
    'color:#FBF8F2;font-family:"Saira Stencil One",Jost,sans-serif;letter-spacing:.04em;line-height:1.3;' +
    'white-space:nowrap;overflow:hidden;text-shadow:0 2px 7px rgba(0,0,0,.6);pointer-events:none}' +
  '.bm-curve{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}' +
  '.bm-curve text{font-family:"Saira Stencil One",Jost,sans-serif;letter-spacing:.06em;fill:var(--bm-ivory);' +
    'paint-order:stroke;stroke:rgba(0,0,0,.45);stroke-width:8px;stroke-linejoin:round}' +
  '.bm-metal{position:absolute;left:10px;bottom:10px;display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600;' +
    'background:rgba(27,31,35,.82);color:var(--bm-ivory);padding:5px 10px;border-radius:999px}' +
  '.bm-metal i{width:10px;height:10px;border-radius:50%;display:block;box-shadow:0 0 0 1px rgba(255,255,255,.45)}' +
  '.bm-summary{margin-top:14px;background:#fff;border:1px solid var(--bm-line);border-radius:12px;padding:14px}' +
  '.bm-summary h3{font-family:"Cormorant Garamond",serif;font-size:22px;font-weight:600;margin:0 0 4px;line-height:1.2}' +
  '.bm-badge{font-size:12px;color:var(--bm-warn);font-weight:600;margin:0 0 10px}' +
  '.bm-lines{list-style:none;margin:0 0 10px;padding:0;font-size:13.5px;color:var(--bm-steel)}' +
  '.bm-lines li{display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px dashed var(--bm-line)}' +
  '.bm-lines li:last-child{border-bottom:0}' +
  '.bm-total{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:10px;' +
    'background:linear-gradient(135deg,rgba(201,162,39,.16),rgba(184,115,51,.16));border:1px solid var(--bm-line2)}' +
  '.bm-total span{font-size:11.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--bm-steel);font-weight:600}' +
  '.bm-total strong{font-size:25px;font-family:"Cormorant Garamond",serif;color:var(--bm-red)}' +
  '.bm-fine{font-size:11.5px;color:var(--bm-steel);line-height:1.5;margin:9px 0 0}' +
  '.bm-block{background:#fff;border:1px solid var(--bm-line);border-radius:12px;padding:16px;margin-bottom:14px}' +
  '.bm-block h4{margin:0 0 12px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--bm-copper);font-weight:700}' +
  '.bm-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}' +
  '.bm-row.one{grid-template-columns:1fr}' +
  '.bm-fld{display:flex;flex-direction:column;gap:6px;min-width:0}' +
  '.bm-fld>span{font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:var(--bm-steel);font-weight:600}' +
  '.bm-dialog input,.bm-dialog select,.bm-dialog textarea{width:100%;font-family:Jost,sans-serif;font-size:15px;color:var(--bm-graphite);' +
    'background:#FFFDF9;border:1px solid var(--bm-line2);border-radius:7px;padding:11px 12px;outline:none;transition:.18s}' +
  '.bm-dialog input:focus,.bm-dialog select:focus,.bm-dialog textarea:focus{border-color:var(--bm-red);box-shadow:0 0 0 3px rgba(143,46,27,.13)}' +
  '.bm-dialog textarea{resize:vertical;min-height:84px}' +
  '.bm-dialog input[aria-invalid="true"]{border-color:var(--bm-danger);box-shadow:0 0 0 3px rgba(155,28,28,.12)}' +
  '.bm-err{font-size:12px;color:var(--bm-danger)}' +
  '.bm-chips{display:flex;gap:8px;flex-wrap:wrap}' +
  '.bm-chip{display:flex;align-items:center;gap:7px;font-family:Jost,sans-serif;font-size:13.5px;font-weight:600;color:var(--bm-steel);' +
    'background:#fff;border:1px solid var(--bm-line2);border-radius:999px;padding:9px 13px;cursor:pointer;transition:.16s}' +
  '.bm-chip i{width:13px;height:13px;border-radius:50%;display:block;box-shadow:0 0 0 1px rgba(0,0,0,.18)}' +
  '.bm-chip:hover{border-color:var(--bm-copper)}' +
  '.bm-chip.is-on{background:linear-gradient(135deg,var(--bm-steel),var(--bm-ink));color:var(--bm-ivory);border-color:transparent;transform:translateY(-1px)}' +
  '.bm-step{display:flex;align-items:center;border:1px solid var(--bm-line2);border-radius:7px;overflow:hidden;background:#FFFDF9}' +
  '.bm-step button{width:44px;height:44px;border:0;background:var(--bm-sand);color:var(--bm-graphite);font-size:20px;cursor:pointer;transition:.15s}' +
  '.bm-step button:hover{background:var(--bm-red);color:#fff}' +
  '.bm-step input{border:0;border-radius:0;text-align:center;background:transparent;-moz-appearance:textfield}' +
  '.bm-step input::-webkit-outer-spin-button,.bm-step input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}' +
  '.bm-seg{display:flex;border:1px solid var(--bm-line2);border-radius:7px;overflow:hidden}' +
  '.bm-seg button{flex:1;border:0;background:#FFFDF9;font-family:Jost,sans-serif;font-size:13.5px;font-weight:600;color:var(--bm-steel);padding:11px 8px;cursor:pointer;transition:.16s}' +
  '.bm-seg button.is-on{background:linear-gradient(135deg,var(--bm-copper),var(--bm-red));color:#FFF6EC}' +
  '.bm-toggle{display:flex;align-items:center;gap:10px;font-size:14px;color:var(--bm-graphite);cursor:pointer;align-self:end;padding-bottom:11px}' +
  '.bm-toggle input{width:20px;height:20px;accent-color:var(--bm-red);cursor:pointer}' +
  '.bm-hint{font-size:12.5px;color:var(--bm-steel);line-height:1.5;margin:0}' +
  '.bm-foot{flex:0 0 auto;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:14px 18px;' +
    'border-top:1px solid var(--bm-line);background:linear-gradient(90deg,rgba(244,238,228,.98),rgba(251,248,242,.98))}' +
  '.bm-btn{font-family:Jost,sans-serif;font-size:14.5px;font-weight:600;border-radius:8px;padding:13px 20px;cursor:pointer;' +
    'border:1px solid transparent;text-decoration:none;display:inline-flex;align-items:center;gap:8px;transition:.18s;line-height:1}' +
  '.bm-send{background:linear-gradient(135deg,var(--bm-red),var(--bm-red2));color:#FFF3E8;box-shadow:0 10px 24px rgba(143,46,27,.3)}' +
  '.bm-send:hover{transform:translateY(-1px);box-shadow:0 14px 30px rgba(143,46,27,.38)}' +
  '.bm-send:disabled{opacity:.65;cursor:progress;transform:none}' +
  '.bm-wa{background:linear-gradient(135deg,#1F7A4D,#155F3B);color:#fff}' +
  '.bm-ghost{background:#fff;color:var(--bm-graphite);border-color:var(--bm-line2)}' +
  '.bm-ghost:hover{border-color:var(--bm-red);color:var(--bm-red)}' +
  '.bm-status{font-size:13px;margin-left:auto;max-width:44%;text-align:right;line-height:1.4}' +
  '.bm-status.ok{color:var(--bm-ok)}.bm-status.err{color:var(--bm-danger)}.bm-status.warn{color:var(--bm-warn)}' +
  '.bm-mailmenu{position:absolute;right:18px;bottom:80px;z-index:6;width:min(330px,92vw);background:#fff;' +
    'border:1px solid var(--bm-line2);border-radius:12px;box-shadow:0 26px 60px rgba(28,16,6,.38);padding:10px;display:none}' +
  '.bm-mailmenu.on{display:block;animation:bmIn .22s cubic-bezier(.2,.8,.2,1)}' +
  '.bm-mailmenu h6{margin:2px 6px 8px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--bm-steel)}' +
  '.bm-mailmenu a{display:flex;align-items:center;gap:11px;padding:11px 12px;border-radius:9px;text-decoration:none;' +
    'color:var(--bm-graphite);font-size:14.5px;font-weight:600;transition:.15s}' +
  '.bm-mailmenu a:hover{background:var(--bm-sand);color:var(--bm-red)}' +
  '.bm-mailmenu a i{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;' +
    'font-style:normal;font-size:13px;font-weight:700;color:#fff;flex:0 0 auto}' +
  '.bm-mailmenu p{margin:8px 6px 2px;font-size:11.5px;color:var(--bm-steel);line-height:1.45}' +
  '.bm-hlist{display:flex;flex-direction:column;gap:12px}' +
  '.bm-ocard{background:#fff;border:1px solid var(--bm-line);border-radius:12px;padding:14px;display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center}' +
  '.bm-ocard h5{margin:0 0 4px;font-family:"Cormorant Garamond",serif;font-size:19px;font-weight:600}' +
  '.bm-ocard p{margin:0;font-size:12.5px;color:var(--bm-steel)}' +
  '.bm-tag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 9px;border-radius:999px;margin-left:8px}' +
  '.bm-tag.sent{background:rgba(31,122,77,.14);color:var(--bm-ok)}' +
  '.bm-tag.pending{background:rgba(180,83,9,.15);color:var(--bm-warn)}' +
  '.bm-oact{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}' +
  '.bm-mini{font-family:Jost,sans-serif;font-size:12.5px;font-weight:600;background:#fff;border:1px solid var(--bm-line2);' +
    'border-radius:6px;padding:8px 11px;cursor:pointer;color:var(--bm-graphite);transition:.15s;text-decoration:none;display:inline-block}' +
  '.bm-mini:hover{border-color:var(--bm-red);color:var(--bm-red)}' +
  '.bm-mini.del:hover{background:var(--bm-danger);color:#fff;border-color:var(--bm-danger)}' +
  '.bm-empty{text-align:center;padding:34px 16px;color:var(--bm-steel)}' +
  '.bm-empty strong{display:block;font-family:"Cormorant Garamond",serif;font-size:22px;color:var(--bm-graphite);margin-bottom:6px}' +
  '.bm-done{max-width:620px;margin:6px auto;text-align:center;padding:8px 4px}' +
  '.bm-check{width:82px;height:82px;margin:0 auto 14px;display:block}' +
  '.bm-check circle{fill:none;stroke:var(--bm-ok);stroke-width:4;opacity:.35}' +
  '.bm-check path{fill:none;stroke:var(--bm-ok);stroke-width:6;stroke-linecap:round;stroke-linejoin:round;' +
    'stroke-dasharray:60;stroke-dashoffset:60;animation:bmDraw .6s .12s cubic-bezier(.2,.8,.2,1) forwards}' +
  '@keyframes bmDraw{to{stroke-dashoffset:0}}' +
  '.bm-done h3{font-family:"Cormorant Garamond",serif;font-size:30px;margin:0 0 8px;font-weight:600}' +
  '.bm-done .bm-code{display:inline-block;font-family:"Saira Stencil One",Jost,sans-serif;font-size:19px;letter-spacing:.08em;' +
    'background:linear-gradient(135deg,var(--bm-steel),var(--bm-ink));color:var(--bm-brass);padding:8px 16px;border-radius:8px;margin:6px 0 12px}' +
  '.bm-done p{font-size:14.5px;color:var(--bm-steel);line-height:1.6;margin:0 auto 10px;max-width:520px}' +
  '.bm-recap{text-align:left;background:#fff;border:1px solid var(--bm-line);border-radius:12px;padding:14px;margin:14px 0;font-size:13.5px;white-space:pre-wrap;color:var(--bm-graphite);max-height:210px;overflow:auto}' +
  '#bmToast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(14px);z-index:2147483000;' +
    'display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,var(--bm-steel),var(--bm-ink));color:var(--bm-ivory);' +
    'font-family:Jost,sans-serif;font-size:14px;padding:13px 18px;border-radius:10px;border:1px solid rgba(201,162,39,.4);' +
    'box-shadow:0 20px 44px rgba(0,0,0,.4);opacity:0;pointer-events:none;transition:.26s;max-width:92vw}' +
  '#bmToast.on{opacity:1;transform:translateX(-50%);pointer-events:auto}' +
  'body.bm-modal-open #bmToast{bottom:auto;top:16px}' +
  '#bmToast button{background:var(--bm-brass);color:var(--bm-ink);border:0;border-radius:6px;padding:7px 12px;font-weight:700;cursor:pointer;font-family:Jost,sans-serif}' +
  '@media(max-width:900px){.bm-grid{grid-template-columns:1fr}.bm-side{position:static}.bm-stage{max-width:330px;margin:0 auto}}' +
  '@media(max-width:640px){.bm-dialog{left:0;top:0;transform:translateY(24px);width:100vw;height:100dvh;max-height:100dvh;border-radius:0;border:0}' +
    '.bm-dialog.on{transform:none}.bm-head{padding:12px 14px;gap:10px}.bm-brandtxt{display:none}' +
    '.bm-body{padding:14px 14px 4px}.bm-row{grid-template-columns:1fr}' +
    '.bm-foot{padding:12px 14px calc(12px + env(safe-area-inset-bottom));gap:8px}' +
    '.bm-btn{flex:1 1 46%;justify-content:center;padding:13px 12px}' +
    '.bm-status{flex:1 1 100%;max-width:100%;text-align:left;margin-left:0}' +
    '.bm-mailmenu{right:8px;left:8px;width:auto;bottom:120px}' +
    '.bm-ocard{grid-template-columns:1fr}.bm-oact{justify-content:flex-start}' +
    '#bmPill{right:12px;bottom:12px;padding:11px 15px}}' +
  '@media(prefers-reduced-motion:reduce){*{animation-duration:.001s!important;transition-duration:.001s!important}.bm-stage::after{display:none}}';

  var styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ===================== RENDER SITE ===================== */
  text('year', String(new Date().getFullYear()));
  ['headMail', 'contactMail', 'footMail', 'footMail2'].forEach(function (id) {
    var el = $(id);
    if (el) { el.textContent = MAIL; el.setAttribute('href', 'mailto:' + MAIL); }
  });
  if (S.band) html('bandText', esc(S.band).replace('{email}', '<a href="mailto:' + esc(MAIL) + '">' + esc(MAIL) + '</a>'));
  html('heroEyebrow', esc(S.heroEyebrow || ''));
  html('heroTitle', esc(S.heroTitleA || '') + '<br><em>' + esc(S.heroTitleB || '') + '</em>');
  text('heroLead', S.heroLead || '');
  text('priceFrom', S.priceFrom || '');
  text('priceNote', S.priceNote || '');
  text('previewCaption', S.previewCaption || '');
  html('customTitle', esc(S.customTitleA || '') + '<em>' + esc(S.customTitleB || '') + '</em>');
  text('customNote', S.customNote || '');
  text('customNameLabel', S.customNameLabel || 'Numele (pe banner)');
  text('customBottomLabel', S.customBottomLabel || 'Mesajul de jos (curbat)');
  text('customLegal', S.customLegal || '');
  html('aboutEyebrow', esc(S.aboutEyebrow || ''));
  html('aboutTitle', esc(S.aboutTitleA || '') + '<br><em>' + esc(S.aboutTitleB || '') + '</em>');
  text('aboutP1', S.aboutP1 || '');
  text('aboutP2', S.aboutP2 || '');
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
  text('formNameLabel', S.formNameLabel || 'Numele tău');
  text('formEmailLabel', S.formEmailLabel || 'Email');
  text('formModelLabel', S.formModelLabel || 'Ce vrei să comanzi?');
  text('formMsgLabel', S.formMsgLabel || 'Mesajul tău');
  text('formBtn', S.formBtn || 'Trimite comanda →');
  text('formLegal', S.formLegal || '');
  if (S.contactImg) { attr('contactImg', 'src', S.contactImg); attr('contactImg', 'alt', S.contactImgAlt || ''); }
  html('finalTitle', esc(S.finalTitleA || '') + '<em>' + esc(S.finalTitleB || '') + '</em>');
  text('finalText', S.finalText || '');
  text('finalBtn', S.finalBtn || 'Personalizează piesa');
  html('footerTagline', S.footerTagline || '');
  var cfName = $('cfName'); if (cfName && S.formNamePlaceholder) cfName.placeholder = S.formNamePlaceholder;
  var cfEmail = $('cfEmail'); if (cfEmail && S.formEmailPlaceholder) cfEmail.placeholder = S.formEmailPlaceholder;
  var cfMsg = $('cfMsg'); if (cfMsg && S.formMsgPlaceholder) cfMsg.placeholder = S.formMsgPlaceholder;
  if (S.city) text('footCity', S.city);
  if (S.county) text('footCounty', S.county.charAt(0).toUpperCase() + S.county.slice(1) + (S.country ? ', ' + S.country : ''));
  text('contactAddr', [S.city, S.county, S.country].filter(Boolean).join(', '));
  text('contactProg', S.program || '');

  var trustIn = $('trustIn');
  if (trustIn && Array.isArray(S.trust)) {
    trustIn.innerHTML = S.trust.map(function (t) {
      return '<div class="tr"><span class="tr-ic">' + esc(t.ic) + '</span><strong>' + esc(t.title) + '</strong><p>' + esc(t.text) + '</p></div>';
    }).join('');
  }
  var mats = $('mats');
  if (mats) {
    mats.innerHTML = MATERIALS.map(function (m) {
      return '<div class="mat"><span class="mat-dot" style="background:' + esc(m.color) + '"></span><h3>' + esc(m.name) + '</h3><p>' + esc(m.desc || '') + '</p></div>';
    }).join('');
  }
  var stepsEl = $('steps');
  if (stepsEl && Array.isArray(S.steps)) {
    stepsEl.innerHTML = S.steps.map(function (st) {
      return '<div class="step"><span class="n">' + esc(st.n) + '</span><h3>' + esc(st.title) + '</h3><p>' + esc(st.text) + '</p></div>';
    }).join('');
  }
  var faqList = $('faqList');
  if (faqList && Array.isArray(S.faq)) {
    faqList.innerHTML = S.faq.map(function (f) {
      return '<details><summary>' + esc(f.q) + '<span class="plus">+</span></summary><p>' + esc(f.a) + '</p></details>';
    }).join('');
  }

  function productById(id) {
    for (var i = 0; i < products.length; i++) if (products[i].id === id) return products[i];
    return null;
  }
  function productByName(n) {
    var k = CORE.norm(n);
    for (var i = 0; i < products.length; i++) if (CORE.norm(products[i].name) === k) return products[i];
    return null;
  }
  function isPers(p) { return !!(p && String(p.cat || '').indexOf('personalizate') >= 0); }
  function orderMailto(p) {
    var body = 'Bună!\n\nCOMANDĂ:\n• Piesă: ' + p.name + '\n• Preț afișat: ' + p.price + ' lei\n\nDatele mele:\n• Nume: \n• Telefon: \n\nMulțumesc!';
    return CORE.mailto((S.orderSubjectPrefix || 'Comandă:') + ' ' + p.name, body);
  }

  var track = $('marqueeTrack');
  if (track && products.length) {
    track.innerHTML = products.slice(0, 14).map(function (p) {
      return '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy">';
    }).join('');
    track.innerHTML += track.innerHTML;
  }

  var grid = $('grid');
  if (grid) {
    grid.innerHTML = products.map(function (p) {
      var badgeCls = String(p.cat || '').indexOf('personalizate') !== -1 ? 'badge badge-custom' : 'badge';
      return '<article class="card" data-cat="' + esc(p.cat || '') + '">' +
        '<span class="' + badgeCls + '">' + esc(p.badge || '') + '</span>' +
        '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy">' +
        '<div class="card-b"><h3>' + esc(p.name) + '</h3>' +
        '<p class="card-p">' + esc(p.price) + ' lei</p>' +
        '<a class="card-a" href="' + orderMailto(p) + '" data-order="' + esc(p.id) + '">Comandă →</a></div></article>';
    }).join('');
  }

  var filters = $('filters');
  if (filters && Array.isArray(S.filters)) {
    var counts = {};
    products.forEach(function (p) {
      String(p.cat || '').split(/\s+/).forEach(function (c) { if (c) counts[c] = (counts[c] || 0) + 1; });
    });
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

  /* ---------- personalizator live (pagina) ---------- */
  var pv = $('preview'), img = $('previewImg'), inName = $('inName'), inBottom = $('inBottom');
  var pvBanner = $('pvBanner'), pvCurveText = $('pvCurveText'), orderBtn = $('orderCustom');
  var pageColor = 'negru';

  if (inName && S.customNameDefault) inName.value = S.customNameDefault;
  if (inBottom && S.customBottomDefault) inBottom.value = S.customBottomDefault;
  if (orderBtn) orderBtn.setAttribute('data-order', 'custom');

  function fit(el, txt, max) {
    var t = String(txt || '').trim();
    if (!el) return;
    if (!t) { el.style.visibility = 'hidden'; return; }
    el.style.visibility = 'visible';
    el.textContent = t.toUpperCase();
    el.style.fontSize = '';
    var size = parseFloat(getComputedStyle(el).fontSize) || 20, guard = 0;
    while (el.scrollWidth > el.clientWidth && size > max && guard < 60) { size -= 1; el.style.fontSize = size + 'px'; guard++; }
  }
  function fitCurve(txt) {
    if (!pvCurveText) return;
    var t = String(txt || '').trim().toUpperCase();
    var tp = pvCurveText.querySelector('textPath');
    if (!tp) return;
    if (!t) { pvCurveText.style.visibility = 'hidden'; return; }
    pvCurveText.style.visibility = 'visible';
    tp.textContent = t;
    var size = 46, guard = 0;
    pvCurveText.style.fontSize = size + 'px';
    while (t.length * 0.58 * size > 420 && size > 16 && guard < 40) { size -= 2; pvCurveText.style.fontSize = size + 'px'; guard++; }
  }
  function customMailto() {
    var body = 'Bună!\n\nCOMANDĂ:\n• Piesă: Ornament personalizat (coroniță cu nume)\n' +
      '• Material: de ales\n• Culoare: ' + pageColor + '\n' +
      '• Text pe banner: ' + ((inName && inName.value) || '—') + '\n' +
      '• Text curbat jos: ' + ((inBottom && inBottom.value) || '—') + '\n\nDatele mele:\n• Nume: \n• Telefon: \n\nMulțumesc!';
    return CORE.mailto((S.orderSubjectPrefix || 'Comandă:') + ' Ornament personalizat', body);
  }
  function updateCustom() {
    if (!pv) return;
    fit(pvBanner, inName && inName.value, 18);
    fitCurve(inBottom && inBottom.value);
    if (orderBtn) orderBtn.href = customMailto();
  }
  if (inName) inName.addEventListener('input', updateCustom);
  if (inBottom) inBottom.addEventListener('input', updateCustom);
  Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (chip) {
    chip.addEventListener('click', function () {
      Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (c) {
        c.classList.remove('is-on'); c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('is-on'); chip.setAttribute('aria-pressed', 'true');
      pageColor = chip.getAttribute('data-color') || 'negru';
      if (pv) pv.setAttribute('data-color', pageColor);
      if (img) {
        var next = SRC[pageColor] || SRC.negru, pre = new Image();
        img.style.opacity = '0.35';
        pre.onload = function () { img.src = next; img.style.opacity = '1'; };
        pre.onerror = function () { img.style.opacity = '1'; };
        pre.src = next;
      }
      updateCustom();
    });
  });
  updateCustom();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateCustom);
  window.addEventListener('resize', updateCustom);

  /* ---------- meniu mobil ---------- */
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

  /* ===================== PROGRES / NAV / REVEAL ===================== */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var prog = document.createElement('div'); prog.id = 'bmProgress'; document.body.appendChild(prog);
  var head = document.querySelector('.head');
  var ticking = false;
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
      var secObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      navLinks.forEach(function (a) {
        var t = document.getElementById(a.getAttribute('href').slice(1));
        if (t) secObs.observe(t);
      });
    }
    if (!reduce) {
      var revealEls = [].slice.call(document.querySelectorAll('.sec, .atelier, .trust, .final'));
      revealEls.forEach(function (el) { el.setAttribute('data-bm-reveal', ''); });
      var revObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('bm-in'); revObs.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
      revealEls.forEach(function (el) { revObs.observe(el); });
      setTimeout(function () { revealEls.forEach(function (el) { el.classList.add('bm-in'); }); }, 2600);
    }
  }

  /* ===================== TOAST ===================== */
  var toastEl = document.createElement('div'); toastEl.id = 'bmToast'; document.body.appendChild(toastEl);
  var toastTimer = null;
  function toast(msg, actionLabel, action) {
    toastEl.innerHTML = '<span>' + esc(msg) + '</span>';
    if (actionLabel && action) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = actionLabel;
      b.addEventListener('click', function () { action(); hideToast(); });
      toastEl.appendChild(b);
    }
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, actionLabel ? 7000 : 3400);
  }
  function hideToast() { toastEl.classList.remove('on'); }

  /* ===================== DIALOG ===================== */
  var scrim = document.createElement('div'); scrim.className = 'bm-scrim'; scrim.hidden = true;
  document.body.appendChild(scrim);

  var dlg = document.createElement('div');
  dlg.className = 'bm-dialog'; dlg.hidden = true;
  dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-labelledby', 'bmTitle');
  dlg.innerHTML =
    '<header class="bm-head">' +
      '<span class="bm-mark">BRM</span><span class="bm-brandtxt">Tecnical · comandă</span>' +
      '<nav class="bm-tabs">' +
        '<button type="button" class="bm-tab is-on" data-act="view" data-v="order">Comandă</button>' +
        '<button type="button" class="bm-tab" data-act="view" data-v="hist">Comenzile mele <span id="bmHistCount">0</span></button>' +
      '</nav>' +
      '<button type="button" class="bm-close" data-act="close" aria-label="Închide">&times;</button>' +
    '</header>' +
    '<div class="bm-body" id="bmBody">' +
      '<section class="bm-view is-on" id="bmViewOrder">' +
        '<div class="bm-grid">' +
          '<aside class="bm-side">' +
            '<div class="bm-stage" id="bmStage">' +
              '<img id="bmImg" alt="Fotografie piesă">' +
              '<button type="button" class="bm-pv" id="bmPvBtn" data-act="pv">Previzualizare text</button>' +
              '<span class="bm-banner" id="bmBanner"></span>' +
              '<svg class="bm-curve" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
                '<defs><path id="bmCurvePath" d="M 320,700 Q 500,860 680,700" fill="none"></path></defs>' +
                '<text id="bmCurveText" font-size="46"><textPath href="#bmCurvePath" startOffset="50%" text-anchor="middle"></textPath></text>' +
              '</svg>' +
              '<span class="bm-metal" id="bmMetalTag"><i></i><span></span></span>' +
            '</div>' +
            '<div class="bm-summary">' +
              '<h3 id="bmTitle">Comandă</h3>' +
              '<p class="bm-badge" id="bmBadge"></p>' +
              '<ul class="bm-lines" id="bmLines"></ul>' +
              '<div class="bm-total"><span>Estimare</span><strong id="bmTotal">0 lei</strong></div>' +
              '<p class="bm-fine">Prețul final îl confirmăm după proiect. Nu plătești acum — întâi vezi desenul.</p>' +
            '</div>' +
          '</aside>' +
          '<div class="bm-main">' +
            '<div class="bm-block">' +
              '<h4>1 · Piesa</h4>' +
              '<div class="bm-row">' +
                '<label class="bm-fld"><span>Material</span><select id="bmMaterial"></select></label>' +
                '<label class="bm-fld"><span>Dimensiune</span><select id="bmSize"></select></label>' +
              '</div>' +
              '<div class="bm-row">' +
                '<div class="bm-fld"><span>Culoare</span><div class="bm-chips" id="bmColors"></div></div>' +
                '<div class="bm-fld"><span>Bucăți</span><div class="bm-step">' +
                  '<button type="button" data-act="qty" data-v="-1" aria-label="Mai puține">−</button>' +
                  '<input id="bmQty" type="number" min="1" max="20" value="1" aria-label="Bucăți">' +
                  '<button type="button" data-act="qty" data-v="1" aria-label="Mai multe">+</button>' +
                '</div></div>' +
              '</div>' +
              '<div class="bm-row" id="bmPersRow">' +
                '<label class="bm-fld"><span>Nume pe banner</span><input id="bmName" type="text" maxlength="26" autocomplete="off"></label>' +
                '<label class="bm-fld"><span>Text curbat jos</span><input id="bmCurve" type="text" maxlength="34" autocomplete="off"></label>' +
              '</div>' +
              '<div class="bm-row">' +
                '<div class="bm-fld"><span>Livrare</span><div class="bm-seg" id="bmDelivery">' +
                  '<button type="button" class="is-on" data-act="del" data-v="curier">Curier</button>' +
                  '<button type="button" data-act="del" data-v="atelier">Ridic din atelier</button>' +
                '</div></div>' +
                '<label class="bm-toggle"><input type="checkbox" id="bmGift"><span>Ambalaj cadou (+' + CFG.gift + ' lei)</span></label>' +
              '</div>' +
              '<p class="bm-hint" id="bmPersHint"></p>' +
            '</div>' +
            '<div class="bm-block">' +
              '<h4>2 · Datele tale</h4>' +
              '<div class="bm-row">' +
                '<label class="bm-fld"><span>Nume și prenume *</span><input id="bmCName" type="text" autocomplete="name"><span class="bm-err" id="bmEName"></span></label>' +
                '<label class="bm-fld"><span>Telefon *</span><input id="bmCPhone" type="tel" autocomplete="tel" placeholder="07xx xxx xxx"><span class="bm-err" id="bmEPhone"></span></label>' +
              '</div>' +
              '<div class="bm-row">' +
                '<label class="bm-fld"><span>Email</span><input id="bmCMail" type="email" autocomplete="email" placeholder="pentru proiect și factură"><span class="bm-err" id="bmEMail"></span></label>' +
                '<label class="bm-fld"><span>Termen dorit</span><input id="bmCDate" type="date"></label>' +
              '</div>' +
              '<div class="bm-row one">' +
                '<label class="bm-fld"><span>Oraș / adresă livrare *</span><input id="bmCAddr" type="text" autocomplete="street-address" placeholder="oraș, stradă, număr, județ"><span class="bm-err" id="bmEAddr"></span></label>' +
              '</div>' +
              '<div class="bm-row one">' +
                '<label class="bm-fld"><span>Mesaj pentru atelier</span><textarea id="bmCMsg" rows="3" placeholder="text dorit, dimensiuni speciale, logo, întrebări…"></textarea></label>' +
              '</div>' +
              '<p class="bm-hint">Răspundem în 24 de ore cu proiectul. Datele tale sunt folosite doar pentru această comandă.</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section class="bm-view" id="bmViewHist"><div class="bm-hlist" id="bmHistList"></div></section>' +
      '<section class="bm-view" id="bmViewDone">' +
        '<div class="bm-done">' +
          '<svg class="bm-check" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44"></circle><path d="M28 52 L44 68 L74 34"></path></svg>' +
          '<h3 id="bmDoneTitle">Comanda a plecat!</h3>' +
          '<div class="bm-code" id="bmDoneCode">BRM-0000</div>' +
          '<p id="bmDoneText"></p>' +
          '<div class="bm-recap" id="bmDoneRecap"></div>' +
        '</div>' +
      '</section>' +
    '</div>' +
    '<div class="bm-mailmenu" id="bmMailMenu">' +
      '<h6>Deschide mesajul în</h6>' +
      '<a id="bmGmail" target="_blank" rel="noopener"><i style="background:#D93025">G</i>Gmail (în browser)</a>' +
      '<a id="bmYahoo" target="_blank" rel="noopener"><i style="background:#6001D2">Y</i>Yahoo Mail (în browser)</a>' +
      '<a id="bmOutlook" target="_blank" rel="noopener"><i style="background:#0F6CBD">O</i>Outlook / Hotmail (în browser)</a>' +
      '<a id="bmLocal"><i style="background:#3A3F44">✉</i>Aplicația de email de pe PC</a>' +
      '<p>Mesajul e deja scris. Trebuie doar să apeși „Trimite” în fila care se deschide.</p>' +
    '</div>' +
    '<footer class="bm-foot" id="bmFoot"></footer>';
  document.body.appendChild(dlg);

  var pill = document.createElement('button');
  pill.id = 'bmPill'; pill.type = 'button';
  pill.innerHTML = '<span>🧾 Comenzile mele</span><b id="bmPillCount">0</b>';
  pill.addEventListener('click', function () { openDialog(null, 'hist'); });
  document.body.appendChild(pill);

  var imgFail = false;
  var bmi = $('bmImg');
  if (bmi) bmi.addEventListener('error', function () {
    if (!imgFail) { imgFail = true; bmi.setAttribute('src', SRC.negru); }
  });
  if (bmi) bmi.addEventListener('load', function () { imgFail = false; });

  /* ---------- stare ---------- */
  var O = null, view = 'order', lastFocus = null, sending = false, deleted = null, mailCtx = null;

  function orders() { return read(LS_ORDERS, []) || []; }
  function setOrders(a) { store(LS_ORDERS, a); refreshCounts(); }
  function refreshCounts() {
    var n = orders().length;
    var c = $('bmHistCount'); if (c) c.textContent = String(n);
    var pc = $('bmPillCount'); if (pc) pc.textContent = String(n);
    pill.classList.toggle('on', n > 0 && dlg.hidden);
  }

  function blankOrder(p, custom) {
    var cust = read(LS_CUSTOMER, {}) || {};
    var pers = custom || isPers(p);
    return {
      pid: custom ? 'custom' : (p ? p.id : ''),
      title: custom ? 'Ornament personalizat (coroniță cu nume)' : (p ? p.name : 'Mesaj / piesă la comandă'),
      badge: custom ? 'Personalizat · 5–7 zile' : (p ? (p.badge || '') : 'Proiect la cerere · 5–7 zile'),
      base: custom ? 249 : (p ? (+p.price || 0) : 199),
      photo: custom ? SRC[pageColor] : (p && p.img ? p.img : SRC.negru),
      personalizable: !!pers,
      preview: !!custom,
      material: MATERIALS[0].name,
      size: 40, color: custom ? pageColor : 'negru', qty: 1,
      gift: false, delivery: 'curier',
      pname: custom ? ((inName && inName.value) || 'NUMELE TĂU') : (S.customNameDefault || 'NUMELE TĂU'),
      pcurve: custom ? ((inBottom && inBottom.value) || 'SĂRBĂTORI FERICITE') : (S.customBottomDefault || 'SĂRBĂTORI FERICITE'),
      cust: { nume: cust.nume || '', tel: cust.tel || '', mail: cust.mail || '', adr: cust.adr || '', termen: '', msg: '' },
      code: ''
    };
  }

  function fillSelects() {
    var ms = $('bmMaterial');
    if (ms) ms.innerHTML = MATERIALS.map(function (m) {
      var add = CORE.matAdd(m.name);
      return '<option value="' + esc(m.name) + '">' + esc(m.name) + (add ? ' (+' + add + ' lei)' : ' (inclus)') + '</option>';
    }).join('');
    var ss = $('bmSize');
    if (ss) ss.innerHTML = CORE.sizes.map(function (s) {
      return '<option value="' + s.v + '">' + s.label + (s.mul !== 1 ? ' · ×' + s.mul.toFixed(2) : ' · standard') + '</option>';
    }).join('');
    var cs = $('bmColors');
    if (cs) cs.innerHTML = CORE.colors.map(function (c) {
      return '<button type="button" class="bm-chip" data-act="color" data-v="' + c.v + '"><i style="background:' + c.hex + '"></i>' + esc(c.label) + '</button>';
    }).join('');
  }
  fillSelects();

  function fitDialogPreview() {
    if (!O) return;
    var stage = $('bmStage'), banner = $('bmBanner'), ct = $('bmCurveText');
    if (!stage) return;
    var live = O.personalizable && O.preview;
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
      var tp = ct.querySelector('textPath'), t = String(O.pcurve || '').trim().toUpperCase();
      if (!live || !t) ct.style.visibility = 'hidden';
      else {
        ct.style.visibility = 'visible';
        if (tp) tp.textContent = t;
        var s2 = 46, g2 = 0;
        ct.style.fontSize = s2 + 'px';
        while (t.length * 0.58 * s2 > 420 && s2 > 16 && g2 < 40) { s2 -= 2; ct.style.fontSize = s2 + 'px'; g2++; }
      }
    }
  }

  function recalc() {
    if (!O) return;
    var p = CORE.price(O);
    var lines = [['Piesă × ' + O.qty, CORE.money(O.base * CORE.sizeBy(O.size).mul * O.qty)]];
    if (p.mat) lines.push([O.material, '+' + CORE.money(p.mat * O.qty)]);
    if (O.gift) lines.push(['Ambalaj cadou', '+' + CORE.money(CFG.gift * O.qty)]);
    lines.push(['Livrare', O.delivery === 'curier' ? '+' + CORE.money(CFG.courier) : 'ridicare atelier']);
    var ul = $('bmLines');
    if (ul) ul.innerHTML = lines.map(function (l) { return '<li><span>' + esc(l[0]) + '</span><b>' + esc(l[1]) + '</b></li>'; }).join('');
    var tot = $('bmTotal'); if (tot) tot.textContent = CORE.money(p.total);
    var ttl = $('bmTitle'); if (ttl) ttl.textContent = O.title;
    var bdg = $('bmBadge'); if (bdg) bdg.textContent = O.badge || '';

    var mt = $('bmMetalTag');
    if (mt) {
      var mat = null;
      for (var i = 0; i < MATERIALS.length; i++) if (MATERIALS[i].name === O.material) mat = MATERIALS[i];
      var dot = mt.querySelector('i'), lbl = mt.querySelector('span');
      if (dot) dot.style.background = (mat && mat.color) || '#3A3F44';
      if (lbl) lbl.textContent = O.material + ' · ' + CORE.sizeBy(O.size).label;
    }

    var live = O.personalizable && O.preview;
    var im = $('bmImg');
    if (im) {
      var src = live ? (SRC[O.color] || SRC.negru) : (O.photo || SRC.negru);
      if (im.getAttribute('src') !== src) { imgFail = false; im.setAttribute('src', src); }
      im.setAttribute('alt', O.title);
    }
    var pvb = $('bmPvBtn');
    if (pvb) { pvb.hidden = !O.personalizable; pvb.textContent = O.preview ? 'Foto modelului' : 'Previzualizare text'; }

    var pr = $('bmPersRow'); if (pr) pr.style.display = O.personalizable ? '' : 'none';
    var ph = $('bmPersHint');
    if (ph) ph.textContent = O.personalizable
      ? 'Scriem textul împreună înainte să tăiem. Apasă „Previzualizare text” ca să vezi numele pe coroniță.'
      : 'Model din colecție. Vrei un nume sau un logo pe el? Scrie-ne în mesaj și îți spunem ce se poate.';

    Array.prototype.forEach.call(dlg.querySelectorAll('#bmColors .bm-chip'), function (c) {
      c.classList.toggle('is-on', c.getAttribute('data-v') === O.color);
    });
    Array.prototype.forEach.call(dlg.querySelectorAll('#bmDelivery button'), function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-v') === O.delivery);
    });
    fitDialogPreview();
    updateLinks();
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
  function orderText() { readCustomer(); return CORE.buildText(O, CORE.price(O)); }

  function updateLinks() {
    if (!O || view !== 'order') return;
    var txt = orderText();
    var wa = $('bmWaLink');
    if (wa) wa.href = 'https://wa.me/' + String(CFG.whatsapp).replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent(txt);
    if (mailCtx === 'current') fillMailMenu((S.orderSubjectPrefix || 'Comandă:') + ' ' + O.title, txt);
  }

  function fillMailMenu(subject, body) {
    var g = $('bmGmail'), y = $('bmYahoo'), o = $('bmOutlook'), l = $('bmLocal');
    if (g) g.href = CORE.webmail('gmail', subject, body);
    if (y) y.href = CORE.webmail('yahoo', subject, body);
    if (o) o.href = CORE.webmail('outlook', subject, body);
    if (l) l.href = CORE.mailto(subject, body);
  }
  function openMailMenu(subject, body, ctx) {
    mailCtx = ctx || 'fixed';
    fillMailMenu(subject, body);
    var m = $('bmMailMenu'); if (m) m.classList.add('on');
  }
  function closeMailMenu() { var m = $('bmMailMenu'); if (m) m.classList.remove('on'); mailCtx = null; }

  function setStatus(msg, kind) {
    var s = $('bmStatus');
    if (!s) return;
    s.textContent = msg || '';
    s.className = 'bm-status' + (kind ? ' ' + kind : '');
  }

  function renderFoot() {
    var f = $('bmFoot');
    if (!f) return;
    if (view === 'order') {
      f.innerHTML =
        '<button type="button" class="bm-btn bm-send" data-act="send" id="bmSend">Trimite comanda →</button>' +
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
    view = v;
    closeMailMenu();
    ['order', 'hist', 'done'].forEach(function (k) {
      var el = $('bmView' + k.charAt(0).toUpperCase() + k.slice(1));
      if (el) el.classList.toggle('is-on', k === v);
    });
    Array.prototype.forEach.call(dlg.querySelectorAll('.bm-tab'), function (t) {
      t.classList.toggle('is-on', t.getAttribute('data-v') === v);
    });
    if (v === 'hist') renderHistory();
    renderFoot();
    var body = $('bmBody'); if (body) body.scrollTop = 0;
  }

  function validate() {
    readCustomer();
    var ok = true;
    function mark(inputId, errId, bad, msg) {
      var i = $(inputId), e = $(errId);
      if (i) i.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (e) e.textContent = bad ? msg : '';
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (j) {
        if (j && (j.success === 'true' || j.success === true)) return j;
        throw new Error((j && j.message) || 'serviciul de trimitere nu a confirmat');
      });
  }

  function saveOrder(rec) {
    var a = orders();
    a.unshift(rec);
    if (a.length > 40) a.length = 40;
    setOrders(a);
  }

  function doSend() {
    if (sending || !O) return;
    if (!validate()) return;
    if (!CFG.sendOnline) { setStatus('Trimiterea online e oprită. Folosește WhatsApp sau email.', 'warn'); return; }
    sending = true;
    var btn = $('bmSend');
    if (btn) { btn.disabled = true; btn.textContent = 'Se trimite…'; }
    setStatus('Trimitem comanda la atelier…', '');
    var p = CORE.price(O), code = CORE.code();
    O.code = code;
    var txt = CORE.buildText(O, p);
    sendRequest({
      _subject: 'Comandă ' + code + ' · ' + O.title,
      _template: 'table', _captcha: 'false',
      Cod: code, Piesa: O.title, Material: O.material,
      Dimensiune: CORE.sizeBy(O.size).label,
      Culoare: CORE.colorBy(O.color).label,
      Bucati: String(O.qty),
      Personalizare: O.personalizable ? (O.pname + ' / ' + O.pcurve) : '-',
      Livrare: CORE.deliveryLabel(O.delivery),
      Ambalaj: O.gift ? 'Da' : 'Nu',
      Estimare: CORE.money(p.total),
      Nume: O.cust.nume, Telefon: O.cust.tel, Email: O.cust.mail || '-',
      Adresa: O.cust.adr || '-', Termen: O.cust.termen || '-', Mesaj: O.cust.msg || '-',
      Comanda_text: txt, _honey: ''
    }).then(function () {
      saveOrder({ code: code, ts: Date.now(), title: O.title, total: p.total, status: 'trimisa', text: txt });
      showDone(code, txt, true);
    }).catch(function (e) {
      saveOrder({ code: code, ts: Date.now(), title: O.title, total: p.total, status: 'netrimisa', text: txt });
      sending = false;
      if (btn) { btn.disabled = false; btn.textContent = 'Reîncearcă trimiterea →'; }
      setStatus('Nu am putut trimite automat (' + e.message + '). Comanda e salvată — trimite-o pe email sau WhatsApp.', 'err');
      toast('Comanda ' + code + ' e salvată local. Poți retrimite oricând.', 'Vezi', function () { setView('hist'); });
    });
  }

  function showDone(code, txt, sent) {
    sending = false;
    var t = $('bmDoneTitle'), c = $('bmDoneCode'), d = $('bmDoneText'), r = $('bmDoneRecap');
    if (t) t.textContent = sent ? 'Comanda a plecat!' : 'Comandă înregistrată';
    if (c) c.textContent = code;
    if (d) d.textContent = sent
      ? 'Am primit-o la atelier. Îți trimitem proiectul în 24 de ore, apoi confirmi și abia atunci plătești. Păstrează codul pentru orice întrebare.'
      : 'Comanda e salvată în acest browser. Trimite-o pe email sau WhatsApp ca să ajungă la atelier.';
    if (r) r.textContent = txt;
    window.__bmLastDone = txt;
    window.__bmLastCode = code;
    setView('done');
    refreshCounts();
  }

  function renderHistory() {
    var list = $('bmHistList');
    if (!list) return;
    var a = orders();
    if (!a.length) {
      list.innerHTML = '<div class="bm-empty"><strong>Nicio comandă încă</strong>Alege o piesă din colecție și apasă „Comandă”. Tot ce trimiți apare aici, cu cod și status.</div>';
      return;
    }
    list.innerHTML = a.map(function (o, i) {
      var dt = new Date(o.ts);
      var when = dt.toLocaleDateString('ro-RO') + ' · ' + dt.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
      return '<article class="bm-ocard"><div>' +
        '<h5>' + esc(o.title) + '<span class="bm-tag ' + (o.status === 'trimisa' ? 'sent' : 'pending') + '">' +
        (o.status === 'trimisa' ? 'trimisă' : 'netrimisă') + '</span></h5>' +
        '<p>' + esc(o.code) + ' · ' + esc(when) + ' · ' + esc(CORE.money(o.total)) + '</p></div>' +
        '<div class="bm-oact">' +
        (o.status !== 'trimisa' ? '<button type="button" class="bm-mini" data-act="resend" data-i="' + i + '">Retrimite</button>' : '') +
        '<button type="button" class="bm-mini" data-act="ocopy" data-i="' + i + '">Copiază</button>' +
        (CFG.whatsapp ? '<a class="bm-mini" target="_blank" rel="noopener" href="https://wa.me/' + String(CFG.whatsapp).replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent(o.text) + '">WhatsApp</a>' : '') +
        '<button type="button" class="bm-mini" data-act="oemail" data-i="' + i + '">Email ▾</button>' +
        '<button type="button" class="bm-mini del" data-act="odel" data-i="' + i + '">Șterge</button>' +
        '</div></article>';
    }).join('');
  }

  function copyText(txt, okMsg) {
    function fb() {
      var ta = document.createElement('textarea');
      ta.value = txt; ta.style.position = 'fixed'; ta.style.top = '-1000px';
      document.body.appendChild(ta); ta.focus(); ta.select();
      var done = false;
      try { done = document.execCommand('copy'); } catch (e) { done = false; }
      ta.remove();
      toast(done ? okMsg : 'Selectează textul din recapitulare și copiază-l manual.');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () { toast(okMsg); }, fb);
    } else fb();
  }

  function openDialog(source, startView) {
    lastFocus = document.activeElement;
    if (source && source.type === 'product') O = blankOrder(source.product, false);
    else if (source && source.type === 'custom') O = blankOrder(null, true);
    else if (source && source.type === 'contact') {
      var p = productByName(source.model || '');
      O = blankOrder(p, false);
      if (!p && source.model) { O.title = source.model; O.badge = 'Proiect la cerere'; }
      O.cust.nume = source.nume || O.cust.nume;
      O.cust.mail = source.mail || O.cust.mail;
      O.cust.msg = source.msg || '';
    } else if (!O) O = blankOrder(products[0] || null, false);

    fillSelects();
    var ms = $('bmMaterial'); if (ms) ms.value = O.material;
    var ss = $('bmSize'); if (ss) ss.value = String(O.size);
    var q = $('bmQty'); if (q) q.value = String(O.qty);
    var nm = $('bmName'); if (nm) nm.value = O.pname;
    var cv = $('bmCurve'); if (cv) cv.value = O.pcurve;
    var gf = $('bmGift'); if (gf) gf.checked = !!O.gift;
    var cn = $('bmCName'); if (cn) cn.value = O.cust.nume;
    var cp = $('bmCPhone'); if (cp) cp.value = O.cust.tel;
    var cm = $('bmCMail'); if (cm) cm.value = O.cust.mail;
    var ca = $('bmCAddr'); if (ca) ca.value = O.cust.adr;
    var cd = $('bmCDate'); if (cd) { cd.value = O.cust.termen || ''; cd.min = new Date().toISOString().slice(0, 10); }
    var cg = $('bmCMsg'); if (cg) cg.value = O.cust.msg;
    ['bmEName', 'bmEPhone', 'bmEMail', 'bmEAddr'].forEach(function (id) { var e = $(id); if (e) e.textContent = ''; });
    ['bmCName', 'bmCPhone', 'bmCMail', 'bmCAddr'].forEach(function (id) { var e = $(id); if (e) e.setAttribute('aria-invalid', 'false'); });

    scrim.hidden = false; dlg.hidden = false;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('bm-modal-open');
    pill.classList.remove('on');
    requestAnimationFrame(function () { scrim.classList.add('on'); dlg.classList.add('on'); });
    setView(startView || 'order');
    recalc();
    refreshCounts();
    setTimeout(function () {
      var f = startView === 'hist' ? dlg.querySelector('.bm-close') : $('bmCName');
      if (f) f.focus();
      fitDialogPreview();
    }, 90);
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
    var f = dlg.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    var list = [].slice.call(f).filter(function (el) { return !el.disabled && el.offsetParent !== null; });
    if (!list.length) return;
    var first = list[0], last = list[list.length - 1];
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
    if (e.target.id === 'bmMaterial') { O.material = e.target.value; recalc(); }
    if (e.target.id === 'bmSize') { O.size = +e.target.value; recalc(); }
    if (e.target.id === 'bmGift') { O.gift = e.target.checked; recalc(); }
  });

  dlg.addEventListener('click', function (e) {
    var inMenu = e.target.closest && e.target.closest('#bmMailMenu');
    if (inMenu) {
      if (e.target.closest('a')) { setTimeout(closeMailMenu, 120); toast('S-a deschis un tab nou cu mesajul gata scris.'); }
      return;
    }
    var t = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!t) { closeMailMenu(); return; }
    var act = t.getAttribute('data-act');
    var val = t.getAttribute('data-v');
    var idx = parseInt(t.getAttribute('data-i'), 10);

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
    else if (act === 'copy') { copyText(orderText(), 'Comanda e copiată. Trimite-o pe email sau WhatsApp.'); }
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
        _subject: 'Comandă ' + o2.code + ' (retrimisă) · ' + o2.title,
        _template: 'table', _captcha: 'false',
        Cod: o2.code, Piesa: o2.title, Estimare: CORE.money(o2.total), Comanda_text: o2.text, _honey: ''
      }).then(function () {
        var a2 = orders();
        for (var i2 = 0; i2 < a2.length; i2++) if (a2[i2].code === o2.code) a2[i2].status = 'trimisa';
        setOrders(a2); renderHistory();
        toast('Comanda ' + o2.code + ' a fost trimisă.');
      }).catch(function (err) {
        t.disabled = false; t.textContent = 'Retrimite';
        toast('Tot nu se poate trimite (' + err.message + '). Folosește Email ▾ sau WhatsApp.');
      });
    }
  });

  /* ===================== INTERCEPTARE ===================== */
  document.addEventListener('click', function (e) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var el = e.target;
    if (!el || !el.closest) return;
    if (el.closest('.bm-dialog') || el.closest('#bmPill') || el.closest('#bmToast')) return;
    var link = el.closest('a[data-order], a[href^="mailto:"]');
    if (!link) return;
    e.preventDefault();
    e.stopPropagation();
    var key = link.getAttribute('data-order');
    if (key === 'custom') { openDialog({ type: 'custom' }); return; }
    if (key) {
      var p = productById(key);
      if (p) { openDialog({ type: 'product', product: p }); return; }
    }
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
    e.preventDefault();
    e.stopPropagation();
    openDialog({
      type: 'contact',
      model: cfModel ? cfModel.value : '',
      nume: $('cfName') ? $('cfName').value : '',
      mail: $('cfEmail') ? $('cfEmail').value : '',
      msg: $('cfMsg') ? $('cfMsg').value : ''
    });
  }, true);

  refreshCounts();
})();
