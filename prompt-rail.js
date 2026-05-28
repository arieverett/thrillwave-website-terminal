(function twPromptRailFix(){
  'use strict';

  if (window.__twPromptRailFix) return;
  window.__twPromptRailFix = true;

  var MQ = '(max-width: 720px)';
  var pending = false;
  var railClass = 'tw-prompt-rail';

  function isMobile(){
    try { return window.matchMedia(MQ).matches; }
    catch (e) { return window.innerWidth <= 720; }
  }

  function lineHeightOf(el){
    var cs = window.getComputedStyle(el);
    var lh = parseFloat(cs.lineHeight);
    if (Number.isFinite(lh) && lh > 0) return lh;
    var fs = parseFloat(cs.fontSize);
    return Number.isFinite(fs) && fs > 0 ? fs * 1.55 : 18;
  }

  function getRail(el){
    var rail = el.querySelector(':scope > .' + railClass);
    if (!rail) {
      rail = document.createElement('span');
      rail.className = railClass;
      rail.setAttribute('aria-hidden', 'true');
      el.insertBefore(rail, el.firstChild);
    }
    return rail;
  }

  function removeRail(el){
    var rail = el.querySelector(':scope > .' + railClass);
    if (rail) rail.remove();
    el.style.removeProperty('--tw-rail-rows');
  }

  function visibleRowsForLine(line, lh){
    var rect = line.getBoundingClientRect();
    var h = rect && rect.height ? rect.height : line.scrollHeight;
    if (!h || h < 1) return 1;
    return Math.max(1, Math.round(h / lh));
  }

  function rowsForCopy(el, lh){
    if (el.id === 'intro-post') {
      var introRail = el.querySelector(':scope > .' + railClass);
      if (introRail) introRail.style.display = 'none';
      var introRows = Math.max(1, Math.round((el.scrollHeight || el.getBoundingClientRect().height || lh) / lh));
      if (introRail) introRail.style.display = '';
      return introRows;
    }

    var lines = Array.prototype.slice.call(el.querySelectorAll(':scope > .line'));
    if (!lines.length) {
      return Math.max(1, Math.round((el.scrollHeight || el.getBoundingClientRect().height || lh) / lh));
    }

    return lines.reduce(function(total, line){
      return total + visibleRowsForLine(line, lh);
    }, 0);
  }

  function updateOne(el){
    if (!el || el.classList.contains('tw-breakroom-copy')) return;

    if (!isMobile()) {
      removeRail(el);
      return;
    }

    var rail = getRail(el);
    var lh = lineHeightOf(el);
    rail.style.display = 'none';
    var rows = rowsForCopy(el, lh);
    rail.style.display = '';

    var text = Array(rows + 1).join('>\n').slice(0, -1);
    if (rail.textContent !== text) rail.textContent = text;
    if (el.style.getPropertyValue('--tw-rail-rows') !== String(rows)) {
      el.style.setProperty('--tw-rail-rows', String(rows));
    }
  }

  function updateAll(){
    pending = false;
    var targets = Array.prototype.slice.call(document.querySelectorAll(
      '.page-content.terminal-copy:not(.tw-breakroom-copy), #intro-post'
    ));
    targets.forEach(updateOne);
  }

  function queue(){
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(function(){
      window.requestAnimationFrame(updateAll);
    });
  }

  window.twPromptRailFix = queue;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', queue, { once: true });
  } else {
    queue();
  }

  window.addEventListener('load', queue);
  window.addEventListener('pageshow', queue);
  window.addEventListener('resize', queue);
  window.addEventListener('orientationchange', function(){ window.setTimeout(queue, 160); });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(queue).catch(function(){});
  }

  var mo = new MutationObserver(function(mutations){
    for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      if (m.target && m.target.classList && m.target.classList.contains(railClass)) continue;
      if (m.addedNodes && m.addedNodes.length === 1 && m.addedNodes[0].classList && m.addedNodes[0].classList.contains(railClass)) continue;
      queue();
      break;
    }
  });

  try {
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-expanded', 'aria-expanded', 'aria-hidden']
    });
  } catch (e) {}
})();
