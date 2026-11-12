/* PIQ fill-in-the-blank sheet: blanks, live rough draft, word count, example flip, pick your 4.
   Everything typed is kept in this browser only (localStorage). Nothing is sent anywhere. */
(function(){
  var KEY = 'msd-piq-v1', MAX_PICKS = 4, LIMIT = 350;
  var state = { blanks: {}, picks: [] };
  try { var s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.blanks) state = s; } catch(e) {}
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e) {} }
  function words(t){ var m = t.replace(/_{3}/g, ' ').match(/[A-Za-z0-9À-ɏ'’$%#]+/g); return m ? m.length : 0; }

  var cards = document.querySelectorAll('.piq');

  cards.forEach(function(card){
    var n = card.getAttribute('data-card');
    var blanks = card.querySelectorAll('.mine .blank');
    var frame = card.querySelector('.mine .frame');
    var draftEl = card.querySelector('[data-draft="' + n + '"]');
    var wcEl = card.querySelector('[data-wc="' + n + '"]');
    var countEl = document.querySelector('[data-fill-count="' + n + '"]');
    var saved = state.blanks[n] || [];

    function grow(b){
      // Never shrink below the hint's height, so the box doesn't jump when the first letter is typed
      b.style.height = 'auto';
      if (!b.value) b._ph = b.scrollHeight;
      b.style.height = Math.max(b.scrollHeight, b._ph || 0) + 'px';
    }
    blanks.forEach(function(b){
      var i = +b.getAttribute('data-i');
      if (saved[i]) b.value = saved[i];
      // Enter jumps to the next blank (one line per blank)
      b.addEventListener('keydown', function(e){
        if (e.key === 'Enter') { e.preventDefault(); var next = blanks[i + 1]; if (next) next.focus(); else b.blur(); }
      });
      b.addEventListener('input', function(){
        if (/\n/.test(b.value)) b.value = b.value.replace(/\s*\n\s*/g, ' ');
        grow(b); update();
      });
    });
    // Grow to fit once fonts and layout are ready, and when the card is shown again
    requestAnimationFrame(function(){ blanks.forEach(grow); });
    window.addEventListener('load', function(){ blanks.forEach(grow); });
    window.addEventListener('resize', function(){ blanks.forEach(grow); });
    card._grow = function(){ blanks.forEach(grow); };

    function update(){
      var vals = [], filled = 0, text = '', html = '';
      blanks.forEach(function(b){ var v = b.value.replace(/\s+/g, ' ').trim(); vals[+b.getAttribute('data-i')] = v; if (v) filled++; b.classList.toggle('filled', !!v); });
      // Walk the frame: text nodes are UC-guide frame words, .blank spans are the student's words
      frame.childNodes.forEach(function(node){
        if (node.classList && node.classList.contains('ft')) { text += node.textContent; html += esc(node.textContent); }
        else if (node.classList && node.classList.contains('blank')) {
          var v = vals[+node.getAttribute('data-i')];
          text += v || '___'; html += v ? esc(v) : '<span class="gap">___</span>';
        }
      });
      text = text.replace(/\s+/g, ' ').trim();
      draftEl.innerHTML = html.replace(/\s+/g, ' ').trim();
      draftEl.setAttribute('data-plain', text);
      var w = words(text);
      wcEl.textContent = w + ' of ' + LIMIT + ' words' + (w > LIMIT ? ' · cut ' + (w - LIMIT) : '');
      wcEl.classList.toggle('over', w > LIMIT);
      if (countEl) countEl.textContent = filled + '/' + blanks.length;
      state.blanks[n] = vals; save();
    }
    update();

    // My blanks | See my example
    var views = card.querySelectorAll('.flip button');
    function show(v){
      views.forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-view') === v ? 'true' : 'false'); });
      card.querySelector('.panel.mine').hidden = v !== 'mine';
      card.querySelector('.panel.example').hidden = v !== 'example';
      if (v === 'mine') card._grow();
    }
    views.forEach(function(b){ b.addEventListener('click', function(){ show(b.getAttribute('data-view')); }); });
    card.querySelectorAll('[data-view-btn]').forEach(function(b){
      b.addEventListener('click', function(){ show('mine'); card.querySelector('.flip').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
    });

    // Copy my draft
    var copyBtn = card.querySelector('[data-copy-draft]'), copied = card.querySelector('[data-copied="' + n + '"]');
    copyBtn.addEventListener('click', function(){
      var t = draftEl.getAttribute('data-plain') || '';
      function say(ok){ copied.textContent = ok ? 'Copied. Paste it into a doc and keep adding details.' : 'Couldn\'t copy here. Press and hold the draft to select it.'; }
      try { navigator.clipboard.writeText(t).then(function(){ say(true); }, function(){ say(false); }); } catch(e) { say(false); }
    });
  });

  // Pick your 4
  var countOut = document.getElementById('pick-count');
  function paintPicks(){
    document.querySelectorAll('[data-star]').forEach(function(b){ b.setAttribute('aria-pressed', state.picks.indexOf(b.getAttribute('data-star')) > -1 ? 'true' : 'false'); });
    document.querySelectorAll('[data-pick-row]').forEach(function(r){
      var on = state.picks.indexOf(r.getAttribute('data-pick-row')) > -1;
      r.classList.toggle('picked', on);
      r.querySelector('.star').textContent = on ? '★' : '☆';
    });
    var k = state.picks.length;
    if (countOut) countOut.textContent = k === MAX_PICKS ? '4 of 4 picked. Those are your 4.' : k + ' of 4 picked';
  }
  document.querySelectorAll('[data-star]').forEach(function(b){
    b.addEventListener('click', function(){
      var n = b.getAttribute('data-star'), at = state.picks.indexOf(n), top = b.closest('.piq-top');
      var old = top.querySelector('.star-msg'); if (old) old.remove();
      if (at > -1) state.picks.splice(at, 1);
      else if (state.picks.length >= MAX_PICKS) {
        var m = document.createElement('p'); m.className = 'star-msg'; m.setAttribute('aria-live', 'polite');
        m.textContent = 'You already have 4. Tap ★ on one of the others to swap it out.';
        top.appendChild(m); return;
      } else state.picks.push(n);
      save(); paintPicks();
    });
  });
  paintPicks();

  // Offer strips switch to the closed note after the last day to send PIQs (end of that day, local time)
  document.querySelectorAll('.stuck[data-until]').forEach(function(el){
    var p = el.getAttribute('data-until').split('-');
    var closed = new Date() > new Date(+p[0], +p[1] - 1, +p[2], 23, 59, 59);
    el.querySelector('.open-offer').hidden = closed;
    el.querySelector('.closed-offer').hidden = !closed;
  });

  function esc(s){ return s.replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
})();
