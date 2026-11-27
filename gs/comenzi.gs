var ADMIN_KEY = 'BRM2026'; // aceeași cheie o pui în admin → Setări → „Cheie comenzi”
function _sheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Comenzi');
  if (!sh) {
    sh = ss.insertSheet('Comenzi');
    sh.appendRow(['Data', 'Cod', 'Nume', 'Telefon', 'Email', 'Adresa', 'Termen', 'Piese', 'Total', 'Livrare', 'Status', 'Detalii']);
  }
  return sh;
}
function doPost(e) {
  var out = { ok: false };
  try {
    var d = JSON.parse(e.postData.contents);
    var sh = _sheet();
    if (d.action === 'status') {
      var rows = sh.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][1]) === String(d.cod)) { sh.getRange(i + 1, 11).setValue(d.status); out = { ok: true }; break; }
      }
    } else {
      sh.appendRow([new Date(), d.cod || '', d.nume || '', d.telefon || '', d.email || '', d.adresa || '', d.termen || '', d.piese || '', d.total || '', d.livrare || '', 'noua', d.detalii || '']);
      out = { ok: true };
    }
  } catch (err) { out = { ok: false, err: String(err) }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
function doGet(e) {
  if ((e.parameter.key || '') !== ADMIN_KEY) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, err: 'key' })).setMimeType(ContentService.MimeType.JSON);
  }
  var sh = _sheet();
  var rows = sh.getDataRange().getValues();
  var head = rows.shift() || [];
  var list = rows.map(function (r) { var o = {}; head.forEach(function (h, i) { o[h] = r[i]; }); return o; });
  return ContentService.createTextOutput(JSON.stringify({ ok: true, comenzi: list })).setMimeType(ContentService.MimeType.JSON);
}
