(function () {
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

  // On narrow screens, crop the scene to the huts and anchor it to the bottom.
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

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
