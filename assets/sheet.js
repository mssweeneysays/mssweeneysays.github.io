/* Ms Sweeney Decoded: shared behavior for every school sheet and the library.
   School-specific values come from <script id="sheet-data" type="application/json">,
   which build.py writes from schools/<slug>.json. */
(function(){
  var el = document.getElementById('sheet-data');
  var D = el ? JSON.parse(el.textContent) : {};
  function $(id){ return document.getElementById(id); }
  function store(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch(e) { return null; } }

  // Share: phone share sheet when available, otherwise copy the link
  document.querySelectorAll('[data-share]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var url = btn.getAttribute('data-url') || location.href.split('#')[0];
      var msg = $(btn.getAttribute('data-msg'));
      var payload = { title: btn.getAttribute('data-title') || document.title, text: btn.getAttribute('data-text') || '', url: url };
      function say(t){ if (msg) msg.textContent = t; }
      if (navigator.share) {
        navigator.share(payload).catch(function(){});
      } else {
        try {
          navigator.clipboard.writeText(url).then(function(){ say('Link copied. Paste it anywhere.'); }, function(){ say('Copy this link: ' + url); });
        } catch(e) { say('Copy this link: ' + url); }
      }
    });
  });

  if (!D.slug) return; // library page stops here

  // Countdown to the deadline (end of day, the student's own time zone)
  if ($('days')) {
    var p = D.deadline.split('-'), now = new Date();
    var dl = new Date(+p[0], +p[1] - 1, +p[2], 23, 59, 59);
    $('days').textContent = Math.max(0, Math.ceil((dl - now) / 86400000));
  }

  // Dot grids
  (D.grids || []).forEach(function(g, i){
    var svg = $('grid-' + i), ns = 'http://www.w3.org/2000/svg', n = 0;
    if (!svg) return;
    for (var r = 0; r < 10; r++) for (var c = 0; c < 10; c++) {
      var dot = document.createElementNS(ns, 'circle');
      dot.setAttribute('cx', 5 + c * 10); dot.setAttribute('cy', 5 + r * 10); dot.setAttribute('r', 3.6);
      dot.setAttribute('fill', n < g.filled ? g.color : '#E3DCCB');
      if (n < g.filled) { dot.setAttribute('stroke', '#06251C'); dot.setAttribute('stroke-width', '0.8'); }
      svg.appendChild(dot); n++;
    }
  });

  // GPA marker
  var G = D.gpa;
  if (G && $('gpa')) {
    var pct = function(v){ return Math.min(100, Math.max(0, (v - G.min) / (G.max - G.min) * 100)); };
    $('avg').style.left = $('avg-label').style.left = pct(G.avg) + '%';
    var you = $('you'), youL = $('you-label'), out = $('readout');
    $('gpa').addEventListener('input', function(){
      var v = parseFloat(this.value);
      if (isNaN(v) || v < 2 || v > 5.5) { you.style.display = youL.style.display = 'none'; out.textContent = G.default; return; }
      you.style.display = youL.style.display = 'block';
      you.style.left = youL.style.left = pct(v) + '%';
      var d = v - G.avg;
      out.textContent = Math.abs(d) <= 0.1 ? G.near : (d > 0 ? G.above : G.below);
    });
  }

  // Checklist, remembered on this phone only
  var boxes = document.querySelectorAll('#todo .todo input'), KEY = 'msd-' + D.slug + '-todo', saved = {};
  try { saved = JSON.parse(store(KEY) || '{}') || {}; } catch(e) { saved = {}; }
  function count(){
    var n = 0; boxes.forEach(function(b){ if (b.checked) n++; });
    if ($('progress')) $('progress').textContent = n === boxes.length ? D.todo_done : n + ' of ' + boxes.length + ' done';
  }
  boxes.forEach(function(b){
    if (saved[b.id]) b.checked = true;
    b.addEventListener('change', function(){ saved[b.id] = b.checked; store(KEY, JSON.stringify(saved)); count(); });
  });
  count();

  // Student | Parent mode. #parent or #student in the link wins, then the saved choice
  var btns = document.querySelectorAll('.seg button');
  function setMode(m, save){
    document.body.classList.toggle('parent', m === 'parent');
    btns.forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-mode') === m ? 'true' : 'false'); });
    if (save) store('msd-mode', m);
  }
  var start = store('msd-mode') || 'student';
  if (location.hash === '#parent') start = 'parent';
  if (location.hash === '#student') start = 'student';
  setMode(start, false);
  btns.forEach(function(b){ b.addEventListener('click', function(){ setMode(b.getAttribute('data-mode'), true); }); });

  // Reader's self-check
  var ebox = document.querySelectorAll('#check-list input');
  function escore(){
    var n = 0; ebox.forEach(function(b){ if (b.checked) n++; });
    var all = n === ebox.length;
    $('check-score').textContent = all ? D.check_done : n + ' of ' + ebox.length;
    $('check-after').style.display = all ? 'none' : '';
  }
  if (ebox.length) { ebox.forEach(function(b){ b.addEventListener('change', escore); }); escore(); }

  // Copy-a-note buttons
  document.querySelectorAll('[data-copy]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var k = btn.getAttribute('data-copy'), msg = $('copied-' + k);
      function done(ok){ msg.textContent = ok ? 'Copied. Paste it in a text to your parents.' : 'Couldn\'t copy here. Screenshot this section instead.'; }
      try { navigator.clipboard.writeText(D.notes[k]).then(function(){ done(true); }, function(){ done(false); }); }
      catch(e) { done(false); }
    });
  });
})();
