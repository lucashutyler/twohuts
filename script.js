(function () {
  /* ---------- hero huts: hover / tap captions ---------- */
  var huts = document.querySelectorAll('.hut');
  var captions = document.querySelectorAll('.caption');

  function show(id) {
    captions.forEach(function (c) { c.classList.toggle('show', c.dataset.for === id); });
    huts.forEach(function (h) { h.classList.toggle('active', h.dataset.hut === id); });
  }
  function clear() {
    captions.forEach(function (c) { c.classList.remove('show'); });
    huts.forEach(function (h) { h.classList.remove('active'); });
  }

  var pinned = null;
  huts.forEach(function (hut) {
    var id = hut.dataset.hut;
    hut.addEventListener('mouseenter', function () { if (!pinned) show(id); });
    hut.addEventListener('mouseleave', function () { if (!pinned) clear(); });
    hut.addEventListener('focus', function () { show(id); });
    hut.addEventListener('blur', function () { if (!pinned) clear(); });
    hut.addEventListener('click', function () {
      if (pinned === id) { pinned = null; clear(); }
      else { pinned = id; show(id); }
    });
    hut.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hut.click(); }
    });
  });

  document.addEventListener('click', function (e) {
    if (pinned && !e.target.closest('.hut')) { pinned = null; clear(); }
  });

  /* ---------- hero scene: crop to the huts on narrow screens ---------- */
  var svg = document.querySelector('.scene svg');
  var WIDE = '0 0 1200 620', NARROW = '200 110 800 510';
  function fitScene() {
    if (!svg) return;
    var narrow = window.innerWidth < 960;
    svg.setAttribute('viewBox', narrow ? NARROW : WIDE);
    svg.setAttribute('preserveAspectRatio', narrow ? 'xMidYMax meet' : 'xMidYMax slice');
  }
  fitScene();
  window.addEventListener('resize', fitScene);

  /* ---------- second hut: who's inside ---------- */
  var cloud = document.getElementById('cloud');
  var visitors = document.querySelector('.visitors');
  var blurb = document.querySelector('.visitor-blurb');
  var dataList = document.getElementById('people-data');

  if (cloud && visitors && blurb && dataList) {
    // Gradient fills don't resolve across separate <svg> elements, so give the stage its own
    // copy of the hero's defs with suffixed ids. The hero SVG stays the single source of truth.
    var stageSvg = visitors.ownerSVGElement;
    var heroDefs = document.querySelector('.scene svg defs');
    if (stageSvg && heroDefs) {
      var defs = heroDefs.cloneNode(true);
      defs.innerHTML = defs.innerHTML
        .replace(/ id="([^"]+)"/g, ' id="$1-stage"')
        .replace(/url\(#([^)]+)\)/g, 'url(#$1-stage)')
        .replace(/href="#([^"]+)"/g, 'href="#$1-stage"');
      stageSvg.insertBefore(defs, stageSvg.firstChild);
      var hutUse = stageSvg.querySelector('use[href="#hut"]');
      if (hutUse) hutUse.setAttribute('href', '#hut-stage');
    }

    var people = [].map.call(dataList.querySelectorAll('li'), function (li) {
      return {
        tag: li.getAttribute('data-tag'),
        color: li.getAttribute('data-color') || '#7a4a24',
        pair: li.hasAttribute('data-pair'),
        title: li.querySelector('h3').textContent,
        html: li.querySelector('p').innerHTML
      };
    });

    var SVG_NS = 'http://www.w3.org/2000/svg';
    var nameEl = blurb.querySelector('.visitor-name');
    var textEl = blurb.querySelector('.visitor-text');
    var current = -1;
    var stopped = false;
    var timer = null;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Word cloud: sizes and tilts follow a fixed pattern so it looks scattered but stays stable.
    var sizes = [2, 3, 1, 2, 1, 3, 2, 1, 2];
    var tilts = [-3, 2, -1, 3, -2, 1, -3, 2, -1];
    var chips = people.map(function (p, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip s' + sizes[i % sizes.length];
      b.style.setProperty('--tilt', tilts[i % tilts.length] + 'deg');
      b.style.setProperty('--chip', p.color);
      b.textContent = p.title;
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        if (!stopped) { stopped = true; clearInterval(timer); }
        select(i);
      });
      cloud.appendChild(b);
      return b;
    });

    function shade(hex, amt) {
      var n = parseInt(hex.slice(1), 16);
      var r = Math.min(255, Math.max(0, (n >> 16) + amt));
      var g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amt));
      var b = Math.min(255, Math.max(0, (n & 255) + amt));
      return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    }

    function person(dx, color, skin) {
      return '<g transform="translate(' + dx + ' 0)">' +
        '<rect x="-8" y="-20" width="6" height="20" rx="2.5" fill="#4a3320"/>' +
        '<rect x="2" y="-20" width="6" height="20" rx="2.5" fill="#4a3320"/>' +
        '<rect x="-12" y="-48" width="24" height="31" rx="8" fill="' + color + '"/>' +
        '<rect x="-17" y="-46" width="6" height="20" rx="3" fill="' + color + '" transform="rotate(12 -14 -46)"/>' +
        '<rect x="11" y="-46" width="6" height="20" rx="3" fill="' + color + '" transform="rotate(-12 14 -46)"/>' +
        '<circle cx="0" cy="-58" r="10" fill="' + skin + '"/>' +
        '<path d="M-9 -61 q9 -12 18 0" fill="#4a3320"/>' +
        '</g>';
    }

    function makeVisitor(p) {
      var g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('class', 'visitor');
      var tagW = Math.max(44, p.tag.length * 7 + 18);
      var bodies = p.pair
        ? person(-15, p.color, '#f1c9a5') + person(15, shade(p.color, 35), '#d9a27a')
        : person(0, p.color, '#f1c9a5');
      g.innerHTML =
        '<g class="bob">' + bodies +
        '<g transform="translate(0 -82)">' +
        '<rect x="' + (-tagW / 2) + '" y="-10" width="' + tagW + '" height="20" rx="10" fill="#fffaf0" stroke="' + p.color + '" stroke-width="2"/>' +
        '<text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="700" font-family="Georgia, serif" fill="' + p.color + '"></text>' +
        '</g></g>';
      g.querySelector('text').textContent = p.tag;
      return g;
    }

    function select(i) {
      if (i === current) return;
      current = i;
      var p = people[i];

      chips.forEach(function (c, j) { c.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });

      // Send the current visitor out the other side, then remove them.
      [].forEach.call(visitors.querySelectorAll('.visitor'), function (v) {
        if (v.classList.contains('leave')) { v.remove(); return; }
        v.classList.add('leave');
        var done = function () { if (v.parentNode) v.remove(); };
        v.addEventListener('animationend', done, { once: true });
        setTimeout(done, 800);
      });

      var next = makeVisitor(p);
      visitors.appendChild(next);

      blurb.classList.add('swap');
      setTimeout(function () {
        nameEl.textContent = p.title;
        textEl.innerHTML = p.html;
        blurb.classList.remove('swap');
      }, reduced ? 0 : 300);
    }

    // Visit order is shuffled once per page load so it feels random.
    var order = people.map(function (_, i) { return i; });
    for (var k = order.length - 1; k > 0; k--) {
      var r = Math.floor(Math.random() * (k + 1));
      var t = order[k]; order[k] = order[r]; order[r] = t;
    }
    var pos = 0;
    function advance() { select(order[pos % order.length]); pos++; }

    setTimeout(function () {
      if (stopped) return;
      advance();
      timer = setInterval(function () { if (!stopped) advance(); }, 7000);
    }, 600);
  }

  /* ---------- 2017 sketch: draw itself when scrolled into view ---------- */
  var sketch = document.querySelector('.sketch');
  if (sketch) {
    var drawn = false;
    function drawSketch() {
      if (drawn) return;
      drawn = true;
      sketch.classList.add('drawn');
      window.removeEventListener('scroll', checkSketch);
    }
    function checkSketch() {
      var r = sketch.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh * 0.8 && r.bottom > 0) drawSketch();
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { drawSketch(); io.disconnect(); } });
      }, { threshold: 0.35 });
      io.observe(sketch);
    }
    window.addEventListener('scroll', checkSketch, { passive: true });
    checkSketch();
  }

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
