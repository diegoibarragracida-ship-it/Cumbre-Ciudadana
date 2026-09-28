/* Vuelo de cámara 3D: una torre por distrito (altura = votos). Requiere three.js r128. */
(function () {
  var sec = document.querySelector('[data-story]');
  if (!sec || !window.THREE || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var stage = sec.querySelector('.s-stage'), data;
  try { data = JSON.parse(document.getElementById('story-data').textContent); } catch (e) { return; }
  var ren;
  try { ren = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch (e) { return; }
  ren.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
  var cv = ren.domElement; cv.className = 's-3d'; stage.insertBefore(cv, stage.firstChild);
  sec.dataset.mode = '3d';

  var clamp = function (x) { return Math.max(0, Math.min(1, x)); };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a)); };
  var ease = function (t) { return t * t * (3 - 2 * t); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var rnd = function (i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  var FOG = 0x9a5f5a, CY = '#3EE6D0';

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(FOG, 0.013);
  var cam = new THREE.PerspectiveCamera(58, 1, 0.1, 420);
  scene.add(new THREE.HemisphereLight(0xffc9a0, 0x1a2440, 0.95));
  var lamp = new THREE.DirectionalLight(0xffa860, 1.5); lamp.position.set(-30, 25, -140); scene.add(lamp);

  // Cielo con degradado (horizonte = color de la niebla) y sol
  var sg = new THREE.SphereGeometry(380, 24, 16), pos = sg.attributes.position, cols = [], c = new THREE.Color();
  var top = new THREE.Color(0x0b1226), mid = new THREE.Color(0x3a3a70), hor = new THREE.Color(FOG);
  for (var i = 0; i < pos.count; i++) {
    var y = pos.getY(i) / 380;
    if (y > 0) { var t = Math.pow(y, .5); c.copy(hor).lerp(mid, Math.min(1, t * 2)).lerp(top, Math.max(0, t * 2 - 1)); } else c.copy(hor);
    cols.push(c.r, c.g, c.b);
  }
  sg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  var sky = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.renderOrder = -1; scene.add(sky);
  var gc = document.createElement('canvas'); gc.width = gc.height = 256;
  var g2 = gc.getContext('2d'), rg = g2.createRadialGradient(128, 128, 0, 128, 128, 128);
  rg.addColorStop(0, 'rgba(255,236,200,1)'); rg.addColorStop(.25, 'rgba(255,170,90,.75)'); rg.addColorStop(1, 'rgba(255,120,60,0)');
  g2.fillStyle = rg; g2.fillRect(0, 0, 256, 256);
  var sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gc), blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true }));
  sun.scale.set(280, 280, 1); sun.position.set(0, 28, -300); scene.add(sun);

  // Suelo con cuadrícula
  var ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.MeshStandardMaterial({ color: 0x142036, roughness: .95, metalness: 0 }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  var grid = new THREE.GridHelper(700, 140, 0x3ee6d0, 0x3ee6d0); grid.material.transparent = true; grid.material.opacity = .24; grid.position.y = .03; scene.add(grid);

  // Torres
  var N = data.length || 1, maxV = 1, boxg = new THREE.BoxGeometry(1, 1, 1); boxg.translate(0, .5, 0);
  var edgeg = new THREE.EdgesGeometry(boxg), items = [];
  function height(it) { return 5 + (it.d.v / maxV) * 24 + rnd(it.i + 11) * 3; }
  function paint(it) {
    var col = it.d.c || CY;
    it.mat.emissive.set(col); it.mat.emissiveIntensity = it.d.c ? .5 : .16; it.edge.material.color.set(col);
  }
  function retarget() {
    maxV = Math.max.apply(null, items.map(function (x) { return x.d.v; }).concat(1));
    items.forEach(function (it) { it.th = height(it); });
  }
  data.forEach(function (d, i) {
    var mat = new THREE.MeshStandardMaterial({ color: 0x1b2740, roughness: .45, metalness: .5 });
    var m = new THREE.Mesh(boxg, mat), w = 1.7 + rnd(i + 5) * 1.3;
    var edge = new THREE.LineSegments(edgeg, new THREE.LineBasicMaterial({ transparent: true, opacity: .75 })); m.add(edge);
    m.position.set((i % 2 ? 1 : -1) * (9 + rnd(i + 2) * 14), 0, 8 - (i / N) * 112 + (rnd(i + 9) - .5) * 3);
    m.scale.set(w, .01, w); scene.add(m);
    var it = { d: { id: d.id, v: d.v, c: d.c }, i: i, m: m, mat: mat, edge: edge, hc: 0, th: 1 };
    items.push(it); paint(it);
  });
  retarget(); items.forEach(function (it) { it.hc = it.th; });

  // Partículas de polvo cálido
  var pg = new THREE.BufferGeometry(), pp = [];
  for (var k = 0; k < 320; k++) pp.push((rnd(k) - .5) * 90, rnd(k + 500) * 32, 30 - rnd(k + 900) * 160);
  pg.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3));
  scene.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xffd2a0, size: .35, transparent: true, opacity: .65, depthWrite: false })));

  // Trayectoria de cámara
  var path = new THREE.CatmullRomCurve3([[0, 30, 46], [-4, 15, 16], [4, 8, -14], [-2, 5.5, -42], [2, 3.4, -72], [0, 2.4, -104]]
    .map(function (a) { return new THREE.Vector3(a[0], a[1], a[2]); }), false, 'catmullrom', .5);
  var look = new THREE.Vector3(), prevU = 0, fov = 58, W = 0, H = 0;

  function size() {
    W = stage.clientWidth; H = stage.clientHeight; ren.setSize(W, H, false);
    cam.aspect = W / H; cam.updateProjectionMatrix();
  }
  function frame(now) {
    if (!frame.on) return;
    var p = window.CumbreStory ? window.CumbreStory.progress() : 0;
    var u = seg(p, 0, .94); u = u * .5 + ease(u) * .5;
    path.getPoint(u, cam.position);
    path.getPoint(Math.min(1, u + .06), look);
    look.y = lerp(3, look.y, ease(seg(u, 0, .7)));
    cam.lookAt(look); cam.rotateZ(Math.sin(u * 6.28) * .03);
    var sp = Math.abs(u - prevU) * 60; prevU = u;
    fov = lerp(fov, (W < H ? 66 : 54) + Math.min(sp * 120, 14), .12);
    if (Math.abs(cam.fov - fov) > .05) { cam.fov = fov; cam.updateProjectionMatrix(); }
    var grow = ease(seg(p, .0, .38));
    items.forEach(function (it) {
      it.hc += (it.th - it.hc) * .08;
      it.m.scale.y = Math.max(.01, it.hc * ease(clamp(grow * 1.5 - it.i / N * .5)));
    });
    sky.position.copy(cam.position);
    ren.render(scene, cam); requestAnimationFrame(frame);
  }
  size(); addEventListener('resize', size);
  new IntersectionObserver(function (es) {
    var on = es[0].isIntersecting; if (on && !frame.on) { frame.on = true; requestAnimationFrame(frame); } frame.on = on;
  }, { rootMargin: '10% 0px' }).observe(sec);

  window.CumbreStory3D = { update: function (cards) {
    var by = {}; cards.forEach(function (x) { by[x.id] = x; });
    items.forEach(function (it) { var x = by[it.d.id]; if (x) { it.d.v = x.votes; it.d.c = x.leader ? x.leader.color : null; paint(it); } });
    retarget();
  } };
})();
