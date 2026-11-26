/* BRM TECNICAL — corectare text curbat pe coroniță (nu se mai taie literele).
   Se încarcă DUPĂ js/main.js. Măsoară lățimea reală a textului și micșorează
   fontul până încape pe arc; alungește arcul pentru spațiu. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var ARC = 'M 250,690 Q 500,905 750,690';
  var last = {};

  function pathOf(id) {
    var p = document.getElementById(id);
    if (p && p.getAttribute('d') !== ARC) p.setAttribute('d', ARC);
    return p;
  }

  function fit(textId, pathId) {
    var t = document.getElementById(textId);
    var p = pathOf(pathId);
    if (!t || !p || !t.ownerSVGElement) return;
    var tp = t.querySelector('textPath');
    var str = tp ? tp.textContent : t.textContent;
    var vis = !!(t.ownerSVGElement.getBoundingClientRect && t.ownerSVGElement.getBoundingClientRect().width);
    var sig = str + '|' + (vis ? 1 : 0);
    if (last[textId] === sig) return;

    var max = 0;
    try { max = p.getTotalLength(); } catch (e) { return; }
    if (!max) return;

    var cs = getComputedStyle(t);
    var meas = document.createElementNS(NS, 'text');
    meas.setAttribute('font-family', cs.fontFamily || 'Saira Stencil One, Jost, sans-serif');
    meas.setAttribute('letter-spacing', cs.letterSpacing || '0');
    meas.setAttribute('visibility', 'hidden');
    meas.textContent = str || '';
    t.ownerSVGElement.appendChild(meas);

    var size = 46, guard = 0, len = 0;
    function measure() {
      meas.setAttribute('font-size', String(size));
      try { len = meas.getComputedTextLength(); } catch (e) { len = 0; }
    }
    measure();
    while (len > max - 10 && size > 12 && guard < 90) { size -= 1; measure(); guard++; }
    t.style.fontSize = size + 'px';
    meas.remove();
    last[textId] = sig;
  }

  function fitAll() {
    fit('atCurve', 'atArc');        /* previzualizarea din atelier */
    fit('bmCurveText', 'bmCurvePath'); /* previzualizarea din fereastra de comandă */
  }

  var mo = new MutationObserver(function () { requestAnimationFrame(fitAll); });
  ['atCurve', 'bmCurveText'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) mo.observe(el, { childList: true, characterData: true, subtree: true });
  });

  var dlg = document.querySelector('.bm-dialog');
  if (dlg) {
    new MutationObserver(function () {
      setTimeout(fitAll, 60); setTimeout(fitAll, 400);
    }).observe(dlg, { attributes: true, attributeFilter: ['class', 'hidden'] });
  }

  window.addEventListener('resize', function () { last = {}; requestAnimationFrame(fitAll); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { last = {}; fitAll(); });
  setInterval(fitAll, 600);
  fitAll();
})();