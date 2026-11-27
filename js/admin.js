<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin – BRM TECNICAL</title>
<link rel="icon" type="image/png" href="images/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Jost:wght@400;500;600&family=Saira+Stencil+One&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/admin.css">
<style>
.shape-card{background:#fff;border:1px solid var(--line,#E6DAC4);border-radius:12px;padding:16px;margin-bottom:16px}
.shape-head{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:12px}
.shape-head h3{font-family:'Cormorant Garamond',serif;font-size:23px;font-weight:600;margin:0;display:flex;align-items:center;gap:9px}
.shape-head h3 span{font-size:18px;color:#B87333}
.shape-from{font-size:13px;color:#5A6268;background:#F4EEE4;border:1px solid #E6DAC4;border-radius:999px;padding:5px 12px}
.shape-from b{color:#8F2E1B}
.shape-head .mini{margin-left:auto}
.sh-base{max-width:340px;margin-bottom:14px}
.sh-table{width:100%;border-collapse:collapse;margin-bottom:12px}
.sh-table th{font-size:10.5px;letter-spacing:.13em;text-transform:uppercase;color:#8A6A2C;text-align:left;padding:0 8px 7px;font-weight:600}
.sh-table td{padding:4px 8px 4px 0;vertical-align:middle}
.sh-table td:last-child{padding-right:0;text-align:right;width:1%}
.sh-in{width:100%;font-family:'Jost',sans-serif;font-size:14.5px;color:#2E3438;background:#FFFDF9;
  border:1px solid #D9C7A3;border-radius:6px;padding:9px 11px;outline:none;box-sizing:border-box}
.sh-in:focus{border-color:#8F2E1B;box-shadow:0 0 0 3px rgba(143,46,27,.12)}
.sh-calc{font-size:14px;font-weight:600;color:#8F2E1B;white-space:nowrap}
.sh-table .mini[disabled]{opacity:.4;cursor:not-allowed}
.shape-card .row{align-items:center}
.shape-card .hint{margin:0;flex:1 1 240px}
@media(max-width:760px){
  .sh-table thead{display:none}
  .sh-table tr{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:10px 0;border-bottom:1px dashed #E6DAC4}
  .sh-table td{padding:0}
  .sh-table td:last-child{grid-column:span 2;text-align:left;width:auto}
}
</style>
</head>
<body>

<!-- LOGIN -->
<div class="login" id="loginView">
  <div class="login-card">
    <div class="logo"><span class="logo-mark">BRM</span><span class="logo-txt">TECNICAL · admin</span></div>
    <h1>Panou de administrare</h1>
    <p class="muted">Introdu parola pentru a edita textele, prețurile, produsele și piesele din atelier.</p>
    <form id="loginForm">
      <label class="fld">
        <span>Parolă</span>
        <input type="password" id="loginPass" autocomplete="current-password" required>
      </label>
      <button class="btn" type="submit">Intră</button>
      <p class="err" id="loginErr" hidden>Parolă greșită.</p>
    </form>
    <p class="hint">Parola implicită: <code>brm2026</code> (schimb-o din tab-ul Setări).</p>
    <a class="back" href="index.html">← înapoi la site</a>
  </div>
</div>

<!-- PANOU -->
<div class="app" id="appView" hidden>
  <header class="top">
    <div class="logo"><span class="logo-mark">BRM</span><span class="logo-txt">TECNICAL · admin</span></div>
    <nav class="tabs" id="tabs">
      <button class="tab is-on" data-tab="settings">Setări</button>
      <button class="tab" data-tab="products">Produse &amp; prețuri</button>
      <button class="tab" data-tab="shapes">Atelier · forme</button>
      <button class="tab" data-tab="preview">Previzualizare</button>
    </nav>
    <div class="top-r">
      <a class="link" href="index.html" target="_blank" rel="noopener">Vezi site-ul ↗</a>
      <button class="btn-sm" id="btnLogout">Ieși</button>
    </div>
  </header>

  <main>
    <!-- SETĂRI -->
    <section class="pane is-on" id="pane-settings">
      <div class="pane-head">
        <h2>Texte &amp; setări</h2>
        <div class="pane-actions">
          <button class="btn-sm ghost" id="btnResetSettings">Resetează textele</button>
          <button class="btn-sm" id="btnSaveSettings">Salvează setările</button>
        </div>
      </div>

      <div class="grid2">
        <label class="fld"><span>Email comenzi</span><input type="email" id="s_email"></label>
        <label class="fld"><span>Oraș</span><input type="text" id="s_city"></label>
        <label class="fld"><span>Județ</span><input type="text" id="s_county"></label>
        <label class="fld"><span>Țară</span><input type="text" id="s_country"></label>
        <label class="fld"><span>Program</span><input type="text" id="s_program"></label>
        <label class="fld"><span>Preț de la (afișat)</span><input type="text" id="s_priceFrom"></label>
        <label class="fld span2"><span>Bandă sus ({email} = adresa)</span><input type="text" id="s_band"></label>
        <label class="fld span2"><span>Lead hero</span><textarea id="s_heroLead" rows="2"></textarea></label>
        <label class="fld"><span>Preview caption</span><input type="text" id="s_previewCaption"></label>
        <label class="fld"><span>Text implicit banner (nume)</span><input type="text" id="s_customNameDefault"></label>
        <label class="fld"><span>Text implicit curbat (jos)</span><input type="text" id="s_customBottomDefault"></label>
        <label class="fld"><span>Prefix subiect email</span><input type="text" id="s_orderSubjectPrefix"></label>
      </div>

      <h3>Parolă admin</h3>
      <div class="grid2">
        <label class="fld"><span>Parolă nouă</span><input type="text" id="newPass" placeholder="lasă gol ca să nu schimbi"></label>
        <div class="fld"><span>&nbsp;</span><button class="btn-sm" id="btnChangePass">Schimbă parola</button></div>
      </div>

      <h3>Publicare online</h3>
      <div class="row">
        <button class="btn-sm" id="btnPublish">☁ Publică online</button>
        <button class="btn-sm ghost" id="btnToken">🔑 Token GitHub</button>
      </div>
      <p class="hint" id="pubStatus">Nicio publicare online încă.</p>
      <p class="hint">„Publică online” scrie <code>data.js</code> direct în repo-ul GitHub (și urcă pozele noi în <code>images/</code>). Site-ul se actualizează singur în ~1 minut. Token-ul rămâne doar în browserul tău — nu se pune în repo.</p>

      <h3>Backup manual (export / import)</h3>
      <div class="row">
        <button class="btn-sm ghost" id="btnExport">⬇ Descarcă data.js</button>
        <label class="btn-sm file-btn">⬆ Importă data.js<input type="file" id="importFile" accept=".js,application/json,.json" hidden></label>
        <button class="btn-sm danger" id="btnWipe">Șterge modificările locale</button>
      </div>
      <p class="hint">Modificările se salvează și în browser (localStorage), ca să le vezi imediat în previzualizare. Pentru vizitatori contează ce e publicat online.</p>
    </section>

    <!-- PRODUSE -->
    <section class="pane" id="pane-products">
      <div class="pane-head">
        <h2>Produse &amp; prețuri <span class="count" id="prodCount"></span></h2>
        <div class="pane-actions">
          <button class="btn-sm" id="btnAddProd">+ Produs nou</button>
          <button class="btn-sm" id="btnSaveProd">Salvează toate</button>
        </div>
      </div>
      <div class="prod-list" id="prodList"><!-- din JS --></div>
    </section>

    <!-- ATELIER: FORME -->
    <section class="pane" id="pane-shapes">
      <div class="pane-head">
        <h2>Atelier · forme, prețuri și dimensiuni</h2>
        <div class="pane-actions">
          <button class="btn-sm ghost" id="btnResetShapes">Resetează toate formele</button>
          <button class="btn-sm" id="btnSaveShapes">Salvează atelierul</button>
        </div>
      </div>

      <div class="grid2">
        <label class="fld"><span>Cost livrare curier (lei)</span><input type="number" min="0" step="1" id="s_courier"></label>
        <label class="fld"><span>Ambalaj cadou (lei)</span><input type="number" min="0" step="1" id="s_gift"></label>
      </div>
      <p class="hint">Prețul de bază este pentru dimensiunea cu multiplicatorul ×1. Celelalte dimensiuni înmulțesc prețul de bază cu multiplicatorul lor. Eticheta apare în site exact cum o scrii aici.</p>

      <div id="shapeList"><!-- din JS --></div>

      <div class="row">
        <button class="btn-sm" id="btnPublish2">☁ Publică online</button>
      </div>
      <p class="hint">După ce modifici prețurile sau dimensiunile, apasă „Publică online” ca să se vadă pentru vizitatori.</p>
    </section>

    <!-- PREVIZUALIZARE -->
    <section class="pane" id="pane-preview">
      <div class="pane-head"><h2>Previzualizare rapidă</h2></div>
      <p class="muted">Așa arată personalizatorul de pe site (banner + text curbat jos). Editează textele în tab-ul Setări.</p>
      <div class="pv-box">
        <div class="pv-stage" id="pvStage">
          <img id="pvImg" src="images/coronita-model.png" alt="preview">
          <span class="pv-banner" id="pvBanner">NUMELE TĂU</span>
          <svg class="pv-curve" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <defs><path id="pvCurvePath" d="M 320,700 Q 500,860 680,700" fill="none"></path></defs>
            <text class="pv-curve-text" id="pvCurveText">
              <textPath href="#pvCurvePath" startOffset="50%" text-anchor="middle">SĂRBĂTORI FERICITE</textPath>
            </text>
          </svg>
        </div>
      </div>
    </section>
  </main>

  <div class="toast" id="toast" hidden></div>
</div>

<script src="data.js"></script>
<script src="js/admin.js"></script>
</body>
</html>
