/* =========================================================
   GOTHAM PORTFOLIO — behaviour
   Vanilla JS, no dependencies.
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const body = document.body;

  /* ---------- Preloader ---------- */
  const pre = $('#preloader');
  const pct = $('#pre-pct');
  const fill = $('#pre-fill');
  let seen = false;
  try { seen = sessionStorage.getItem('gotham-seen') === '1'; } catch (e) { /* storage blocked */ }

  function endPreloader() {
    if (!pre || pre.classList.contains('done')) return;
    pre.classList.add('done');
    body.classList.remove('lock');
    try { sessionStorage.setItem('gotham-seen', '1'); } catch (e) { /* ignore */ }
    setTimeout(() => pre.remove(), 1000);
    setTimeout(() => lightning(), 1400);
  }

  if (pre) {
    if (seen || reduce) {
      endPreloader();
    } else {
      body.classList.add('lock');
      const start = performance.now();
      const dur = 1700;
      const tick = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        pct.textContent = Math.round(eased * 100);
        fill.style.width = eased * 100 + '%';
        if (p < 1) requestAnimationFrame(tick); else endPreloader();
      };
      requestAnimationFrame(tick);
      setTimeout(endPreloader, 3500); // fail-safe
    }
  }

  /* ---------- Footer year ---------- */
  const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Nav: scrolled state, progress, scroll-spy, mobile menu ---------- */
  const nav = $('#nav');
  const progress = $('#progress');
  const navLinks = $('#nav-links');
  const navWrap = $('nav', nav);
  const toggle = $('#nav-toggle');

  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    navWrap.classList.remove('open');
    body.classList.remove('lock');
  }
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    navWrap.classList.toggle('open', !open);
    body.classList.toggle('lock', !open);
  });
  $$('a', navLinks).forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  const spyTargets = $$('[data-spy]').map(a => ({ a, el: document.getElementById(a.dataset.spy) })).filter(x => x.el);
  const spyIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) spyTargets.forEach(t => t.a.classList.toggle('active', t.el === en.target));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  spyTargets.forEach(t => spyIO.observe(t.el));

  /* ---------- Timeline spine fill ---------- */
  const timeline = $('#timeline');
  const spineFill = $('#spine-fill');

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('scrolled', y > 30);

    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
      spineFill.style.transform = `scaleY(${p})`;
    }
    if (!reduce) skylineParallax(y);
  }
  let ticking = false;
  addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(() => { onScroll(); ticking = false; }); ticking = true; }
  }, { passive: true });

  /* ---------- Reveal on scroll ---------- */
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => {
    // stagger siblings inside grids
    const sibs = el.parentElement ? [...el.parentElement.children].filter(c => c.classList.contains('reveal')) : [];
    el.style.setProperty('--d', Math.min(sibs.indexOf(el), 4) * 0.09 + 's');
    revealIO.observe(el);
  });

  /* ---------- Animated counters ---------- */
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      countIO.unobserve(en.target);
      const el = en.target, end = +el.dataset.count, suffix = el.dataset.suffix || '';
      if (reduce) { el.textContent = end + suffix; return; }
      const t0 = performance.now(), dur = 1500;
      const step = now => {
        const p = Math.min(1, (now - t0) / dur);
        el.textContent = Math.round((1 - Math.pow(1 - p, 4)) * end) + (p === 1 ? suffix : '');
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- Typed role line ---------- */
  const typed = $('#typed');
  const roles = [
    'Electrical & Electronic Engineer',
    'Machine Learning Engineer',
    'Embedded Systems Designer',
    'Software Developer',
    'Cybersecurity Enthusiast',
    'Project Manager'
  ];
  if (typed && !reduce) {
    let ri = 0, ci = roles[0].length, deleting = true;
    const loop = () => {
      const word = roles[ri];
      if (!deleting) {
        ci++;
        typed.textContent = word.slice(0, ci);
        if (ci === word.length) { deleting = true; return setTimeout(loop, 1900); }
        return setTimeout(loop, 55);
      }
      ci--;
      typed.textContent = word.slice(0, ci);
      if (ci === 0) { deleting = false; ri = (ri + 1) % roles.length; return setTimeout(loop, 300); }
      setTimeout(loop, 28);
    };
    setTimeout(loop, 5200);
  }

  /* ---------- Cursor spotlight ---------- */
  if (finePointer) {
    let tx = innerWidth / 2, ty = innerHeight / 3, cx = tx, cy = ty;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const glide = () => {
      cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
      document.documentElement.style.setProperty('--mx', cx.toFixed(1) + 'px');
      document.documentElement.style.setProperty('--my', cy.toFixed(1) + 'px');
      requestAnimationFrame(glide);
    };
    glide();
  }

  /* ---------- 3D tilt + inner glow on cards ---------- */
  if (finePointer && !reduce) {
    $$('.tilt').forEach(card => {
      const max = card.classList.contains('portrait') ? 7 : 4;
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--px', x * 100 + '%');
        card.style.setProperty('--py', y * 100 + '%');
        card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * max}deg) rotateY(${(x - 0.5) * max * 1.4}deg)`;
        card.style.transition = 'transform .08s linear, opacity .9s, border-color .4s, box-shadow .4s';
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
        card.style.transition = '';
      });
    });
  }

  /* ---------- Gotham skyline (generated, seeded so it is stable) ---------- */
  const sky = $('#skyline');
  const layers = [];
  function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

  function buildSkyline() {
    if (!sky) return;
    const W = 1600, ns = 'http://www.w3.org/2000/svg';
    const make = (seed, hMin, hMax, wMin, wMax, fill, windows) => {
      const r = rng(seed);
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', `0 0 ${W} 230`);
      svg.setAttribute('preserveAspectRatio', 'xMidYMax slice');
      let x = -20, out = '';
      while (x < W + 20) {
        const w = wMin + r() * (wMax - wMin), h = hMin + r() * (hMax - hMin), top = 230 - h;
        out += `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${fill}"/>`;
        // spires / antennae on some towers
        if (r() > 0.72) out += `<rect x="${(x + w / 2 - 1.5).toFixed(1)}" y="${(top - 22).toFixed(1)}" width="3" height="22" fill="${fill}"/>`;
        if (r() > 0.82) out += `<polygon points="${x.toFixed(1)},${top.toFixed(1)} ${(x + w / 2).toFixed(1)},${(top - 26).toFixed(1)} ${(x + w).toFixed(1)},${top.toFixed(1)}" fill="${fill}"/>`;
        if (windows) {
          for (let wy = top + 10; wy < 218; wy += 11) {
            for (let wx = x + 6; wx < x + w - 8; wx += 10) {
              const q = r();
              if (q > 0.9) out += `<rect class="win${q > 0.965 ? ' tw' : ''}" x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="3.5" height="5" style="animation-delay:${(r() * 6).toFixed(2)}s"/>`;
            }
          }
        }
        x += w + 2 + r() * 4;
      }
      svg.innerHTML = out;
      sky.appendChild(svg);
      layers.push(svg);
    };
    make(7, 50, 150, 26, 62, '#0b0f1b', false);   // far
    make(21, 70, 205, 34, 84, '#04050a', true);   // near
  }
  function skylineParallax(y) {
    if (y > innerHeight * 1.2 || !layers.length) return;
    layers[0].style.transform = `translateY(${y * 0.05}px)`;
    layers[1].style.transform = `translateY(${y * 0.12}px)`;
  }
  buildSkyline();

  /* ---------- Rain ---------- */
  const canvas = $('#rain');
  const ctx = canvas.getContext('2d');
  let drops = [], rw = 0, rh = 0, dpr = 1, rainRunning = !reduce;

  function sizeRain() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    rw = canvas.width = innerWidth * dpr; rh = canvas.height = innerHeight * dpr;
    const count = Math.round(Math.min(220, innerWidth / 7));
    drops = Array.from({ length: count }, () => ({
      x: Math.random() * rw, y: Math.random() * rh,
      l: (10 + Math.random() * 22) * dpr, v: (11 + Math.random() * 11) * dpr, a: 0.12 + Math.random() * 0.3
    }));
  }
  function rain() {
    if (!rainRunning) return;
    ctx.clearRect(0, 0, rw, rh);
    ctx.lineWidth = dpr;
    for (const d of drops) {
      ctx.strokeStyle = `rgba(160,185,225,${d.a})`;
      ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.l * 0.18, d.y + d.l); ctx.stroke();
      d.y += d.v; d.x -= d.v * 0.18;
      if (d.y > rh) { d.y = -d.l; d.x = Math.random() * (rw + 200); }
      if (d.x < -20) d.x = rw + 20;
    }
    requestAnimationFrame(rain);
  }
  if (!reduce) {
    sizeRain(); rain();
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(sizeRain, 200); });
    document.addEventListener('visibilitychange', () => {
      rainRunning = !document.hidden && !reduce;
      if (rainRunning) rain();
    });
  }

  /* ---------- Lightning ---------- */
  const flash = $('#flash');
  function lightning() {
    if (!flash || reduce) return;
    flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
  }
  if (!reduce) {
    const storm = () => { setTimeout(() => { if (!document.hidden) lightning(); storm(); }, 11000 + Math.random() * 14000); };
    storm();
  }

  /* ---------- Flying bats ---------- */
  function spawnBat(opts = {}) {
    if (reduce) return;
    const bat = document.createElement('div');
    bat.className = 'flybat';
    bat.innerHTML = '<span class="bat-mask"></span>';
    const s = opts.scale || 0.5 + Math.random() * 0.9;
    bat.style.width = 54 * s + 'px'; bat.style.height = 29 * s + 'px';
    document.body.appendChild(bat);

    const fromLeft = Math.random() > 0.5;
    const y0 = opts.y ?? (innerHeight * (0.08 + Math.random() * 0.5));
    const x0 = fromLeft ? -120 : innerWidth + 120, x1 = fromLeft ? innerWidth + 120 : -120;
    const amp = 40 + Math.random() * 90, waves = 2 + Math.random() * 2;
    const frames = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      frames.push({ transform: `translate(${x0 + (x1 - x0) * t}px, ${y0 + Math.sin(t * Math.PI * waves) * amp - t * 60}px) scaleX(${fromLeft ? 1 : -1})` });
    }
    const anim = bat.animate(frames, { duration: opts.dur || 5200 + Math.random() * 3200, delay: opts.delay || 0, easing: 'linear', fill: 'both' });
    anim.onfinish = () => bat.remove();
  }
  if (!reduce) {
    const patrol = () => { setTimeout(() => { if (!document.hidden) spawnBat(); patrol(); }, 6500 + Math.random() * 7000); };
    setTimeout(patrol, 5000);
  }

  /* ---------- Bat-Signal (button / B key / click the logo) ---------- */
  const toast = $('#signal-toast');
  const lines = [
    'BAT-SIGNAL LIT — GOTHAM NEEDS ENGINEERS.',
    'SIGNAL RECEIVED. ON MY WAY.',
    'I AM THE NIGHT SHIFT.',
    'NOT JUST A SIGNAL — A SIGN TO HIRE.'
  ];
  let toastT, lineIdx = 0, signalT;
  function batSignal() {
    lightning();
    setTimeout(lightning, 420);
    for (let i = 0; i < 12; i++) spawnBat({ delay: i * 140, y: innerHeight * (0.05 + Math.random() * 0.7), dur: 3600 + Math.random() * 2200 });
    body.classList.add('signal-on');
    clearTimeout(signalT); signalT = setTimeout(() => body.classList.remove('signal-on'), 6000);
    toast.textContent = lines[lineIdx++ % lines.length];
    toast.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 3600);
  }
  $('#signal-btn').addEventListener('click', batSignal);
  $('#brand').addEventListener('click', () => { if (scrollY < 80) batSignal(); });
  addEventListener('keydown', e => {
    if ((e.key === 'b' || e.key === 'B') && !e.metaKey && !e.ctrlKey && !e.altKey && !/^(input|textarea)$/i.test(e.target.tagName)) batSignal();
  });

  /* ---------- Contact form -> opens the visitor's mail app ---------- */
  const form = $('#contact-form');
  const note = $('#form-note');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(form);
    const name = (f.get('name') || '').toString().trim();
    const email = (f.get('email') || '').toString().trim();
    const msg = (f.get('message') || '').toString().trim();
    let ok = true;
    $$('input, textarea', form).forEach(el => {
      const bad = !el.value.trim() || (el.type === 'email' && !/^\S+@\S+\.\S+$/.test(el.value.trim()));
      el.classList.toggle('bad', bad); if (bad) ok = false;
    });
    note.classList.remove('ok');
    if (!ok) { note.textContent = 'Fill in every field with a valid email, then try again.'; return; }
    const subject = encodeURIComponent(`Portfolio signal from ${name}`);
    const text = encodeURIComponent(`${msg}\n\n— ${name} (${email})`);
    location.href = `mailto:marteyderek08@gmail.com?subject=${subject}&body=${text}`;
    note.textContent = 'Signal ready — finish sending it in your email app.';
    note.classList.add('ok');
    batSignal();
  });
  $$('input, textarea', form).forEach(el => el.addEventListener('input', () => el.classList.remove('bad')));

  onScroll();
})();
