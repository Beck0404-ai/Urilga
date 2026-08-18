(() => {
  const fontStyles = document.getElementById('google-fonts');
  if (fontStyles) fontStyles.media = 'all';

  const BASE = document.body.dataset.base || '';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

  const MSG = {
    nameRequired: 'Нэрээ бичнэ үү',
    attendanceRequired: 'Хариугаа сонгоно уу',
    success: 'Баярлалаа! Хариу хүлээн авлаа',
    tooMany: 'Хэт олон удаа илгээгдлээ. Дараа дахин оролдоно уу.',
    serverErr: 'Алдаа гарлаа. Дахин оролдоно уу.',
    networkErr: 'Сервертэй холбогдсонгүй. Дахин оролдоно уу.',
  };

  const bgMusic = document.getElementById('bg-music');
  const musicBtn = document.getElementById('music-btn');
  const setMusicLabel = (playing) =>
    musicBtn && musicBtn.setAttribute('aria-label', playing ? 'Хөгжмийг зогсоох' : 'Хөгжим тоглуулах');
  const startMusic = () => {
    if (!bgMusic) return;
    bgMusic.play().then(() => {
      if (musicBtn) { musicBtn.setAttribute('aria-pressed', 'true'); setMusicLabel(true); }
    }).catch(() => { /* blocked until a real gesture — the button still works */ });
  };
  const pauseMusic = () => {
    if (!bgMusic) return;
    bgMusic.pause();
    if (musicBtn) { musicBtn.setAttribute('aria-pressed', 'false'); setMusicLabel(false); }
  };

  // ---------- Gateway: the тооно in near-darkness, then the light blooms ----------
  const gate = document.getElementById('gate');
  if (gate) {
    document.body.classList.add('gate-locked');
    const enterBtn = document.getElementById('gate-enter');
    let opened = false, entered = false;

    const open = () => {
      if (opened) return;
      opened = true;
      gate.classList.add('gate--open');
      startMusic();
    };

    const enter = () => {
      if (entered) return;
      entered = true;
      startMusic();
      document.body.classList.remove('gate-locked');
      document.body.classList.add('gate-open');
      gate.classList.add('gate--leaving');
      window.setTimeout(() => { if (gate.parentNode) gate.parentNode.removeChild(gate); }, 900);
    };

    if (enterBtn) enterBtn.addEventListener('click', (e) => { e.stopPropagation(); enter(); });
    gate.addEventListener('click', () => { if (opened) enter(); else open(); });
    gate.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      if (opened) enter(); else open();
    });

    if (reduceMotion) open();
  } else {
    document.body.classList.add('gate-open');
  }

  // ---------- Spoken invitation (ducks the music, then hands it back) ----------
  const narrAudio = document.getElementById('narr-audio');
  const narrBtn = document.getElementById('narr-btn');
  let musicWasPlaying = false;
  let narrPlayed = false;

  const syncNarr = () => {
    if (narrBtn && narrAudio) narrBtn.setAttribute('aria-pressed', narrAudio.paused ? 'false' : 'true');
  };
  const resumeMusic = () => {
    if (musicWasPlaying) startMusic();
    musicWasPlaying = false;
  };
  const playNarration = () => {
    if (!narrAudio) return;
    musicWasPlaying = !!(bgMusic && !bgMusic.paused);
    if (musicWasPlaying) pauseMusic();
    narrAudio.play().then(syncNarr).catch(() => {
      syncNarr();
      resumeMusic();
    });
  };
  const stopNarration = ({ giveMusicBack = true } = {}) => {
    if (!narrAudio || narrAudio.paused) return;
    narrAudio.pause();
    syncNarr();
    if (giveMusicBack) resumeMusic(); else musicWasPlaying = false;
  };

  if (narrBtn && narrAudio) {
    narrBtn.addEventListener('click', () => {
      if (narrAudio.paused) { narrPlayed = true; playNarration(); }
      else stopNarration();
    });
    narrAudio.addEventListener('play', syncNarr);
    narrAudio.addEventListener('pause', syncNarr);
    narrAudio.addEventListener('ended', () => { syncNarr(); narrAudio.currentTime = 0; resumeMusic(); });
  }

  // ---------- Music toggle ----------
  if (musicBtn && bgMusic) {
    musicBtn.addEventListener('click', () => {
      if (bgMusic.paused) {
        stopNarration({ giveMusicBack: false });
        startMusic();
      } else pauseMusic();
    });
    bgMusic.addEventListener('ended', () => { musicBtn.setAttribute('aria-pressed', 'false'); setMusicLabel(false); });
  }

  // ---------- Per-element reveal delays ----------
  document.querySelectorAll('[data-delay]').forEach((el) => {
    const d = parseInt(el.dataset.delay, 10) || 0;
    el.style.transitionDelay = `${d}ms`;
  });

  // ---------- Scene activation ----------
  const scenes = [...document.querySelectorAll('.scene, .divider')];
  if (reduceMotion || !('IntersectionObserver' in window)) {
    scenes.forEach((s) => s.classList.add('is-active'));
  } else {
    const obs = new IntersectionObserver(
      (entries) => { for (const e of entries) if (e.isIntersecting) e.target.classList.add('is-active'); },
      { threshold: 0, rootMargin: '0px 0px -28% 0px' },
    );
    scenes.forEach((s) => obs.observe(s));

    const sweep = () => {
      const cut = (window.innerHeight || 0) * 0.72;
      let all = true;
      for (const s of scenes) {
        if (s.classList.contains('is-active')) continue;
        if (s.getBoundingClientRect().top < cut) s.classList.add('is-active');
        else all = false;
      }
      return all;
    };
    window.addEventListener('scroll', sweep, { passive: true });
    sweep();
    const poll = window.setInterval(() => { if (sweep()) window.clearInterval(poll); }, 250);
  }

  // ---------- Auto-play the spoken invitation when its card is reached ----------
  const inviteScene = document.querySelector('.scene--invite');
  if (inviteScene && narrAudio) {
    const tryPlay = () => {
      if (narrPlayed || document.body.classList.contains('gate-locked')) return false;
      narrPlayed = true;
      playNarration();
      return true;
    };
    if ('IntersectionObserver' in window) {
      const nio = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        if (tryPlay()) nio.disconnect();
      }, { threshold: 0.3 });
      nio.observe(inviteScene);
    }

    const sweepNarr = () => {
      if (narrPlayed) { window.removeEventListener('scroll', sweepNarr); return; }
      const r = inviteScene.getBoundingClientRect();
      const vh = window.innerHeight || 0;
      if (r.top < vh * 0.7 && r.bottom > vh * 0.2) tryPlay();
    };
    window.addEventListener('scroll', sweepNarr, { passive: true });
  }

  // ---------- Dust motes in the light shaft ----------
  const motes = document.getElementById('hero-motes');
  if (motes && !reduceMotion) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 16; i++) {
      const m = document.createElement('i');
      m.style.left = (18 + Math.random() * 60).toFixed(1) + '%';
      m.style.setProperty('--mr', (9 + Math.random() * 7).toFixed(1) + 's');
      m.style.setProperty('--md', (-Math.random() * 12).toFixed(1) + 's');
      m.style.setProperty('--mx', (Math.random() * 44 - 14).toFixed(0) + 'px');
      frag.appendChild(m);
    }
    motes.appendChild(frag);
  }

  // ---------- The хадаг threading the five stages ----------
  const rite = document.getElementById('rite');
  const silkPath = document.getElementById('silk-path');
  if (rite && silkPath) {
    const steps = [...rite.querySelectorAll('.step')];
    const len = silkPath.getTotalLength();
    silkPath.style.strokeDasharray = String(len);

    if (reduceMotion) {
      silkPath.style.strokeDashoffset = '0';
      steps.forEach((s) => s.classList.add('is-lit'));
    } else {
      silkPath.style.strokeDashoffset = String(len);
      const draw = () => {
        const r = rite.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        const span = Math.max(r.height + vh * 0.3, 1);
        const p = clamp01((vh * 0.85 - r.top) / span);
        silkPath.style.strokeDashoffset = String(len * (1 - p));
        steps.forEach((s, i) => s.classList.toggle('is-lit', p >= (i + 0.55) / steps.length));
      };
      window.addEventListener('scroll', draw, { passive: true });
      window.addEventListener('resize', draw);
      draw();
    }
  }

  // ---------- Slowly turning хээ emblems ----------
  const spinners = [...document.querySelectorAll('[data-spin]')];
  if (spinners.length && !reduceMotion) {
    const turn = () => {
      const y = window.scrollY || 0;
      for (const el of spinners) {
        const f = parseFloat(el.dataset.spin) || 0.04;
        el.style.transform = `rotate(${(y * f).toFixed(2)}deg)`;
      }
    };
    window.addEventListener('scroll', turn, { passive: true });
    turn();
  }

  // ---------- Countdown ----------
  const cdEl = document.querySelector('.countdown[data-target]');
  if (cdEl) {
    const target = new Date(cdEl.dataset.target).getTime();
    const dEl = cdEl.querySelector('[data-d]');
    const hEl = cdEl.querySelector('[data-h]');
    const mEl = cdEl.querySelector('[data-m]');
    const sEl = cdEl.querySelector('[data-s]');
    let timer = null;
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      dEl.textContent = Math.floor(diff / 86400000);
      hEl.textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
      mEl.textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      sEl.textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      if (diff === 0 && timer) { window.clearInterval(timer); timer = null; }
    };
    if (!Number.isNaN(target)) { tick(); timer = window.setInterval(tick, 1000); }
  }

  // ---------- Сэтгэлийн үг: shared wishes wall + submit dialog + keepsake card ----------
  (() => {
    const carousel = document.getElementById('wishes-carousel');
    const stage = document.getElementById('wishes-stage');
    const dialog = document.getElementById('wish-dialog');
    const openBtn = document.getElementById('wish-open');
    if (!carousel || !stage || !dialog || !openBtn) return;

    const prevBtn = document.getElementById('wish-prev');
    const nextBtn = document.getElementById('wish-next');
    const dotsEl = document.getElementById('wishes-dots');
    const form = document.getElementById('wish-form');
    const closeBtn = document.getElementById('wish-close');
    const fileInput = document.getElementById('wish-file');
    const photoAdd = document.getElementById('wish-photo-add');
    const photoPrev = document.getElementById('wish-photo-prev');
    const photoImg = document.getElementById('wish-photo-img');
    const photoDel = document.getElementById('wish-photo-del');
    const sendBtn = document.getElementById('wish-send');
    const msg = document.getElementById('wish-msg');

    const T = {
      need: 'Нэр болон сэтгэлийн үгээ бичнэ үү',
      ok: 'Баярлалаа! Сэтгэлийн үг хүлээн авлаа',
      tooMany: 'Хэт олон удаа илгээгдлээ. Дараа дахин оролдоно уу.',
      err: 'Алдаа гарлаа. Дахин оролдоно уу.',
      net: 'Сервертэй холбогдсонгүй. Дахин оролдоно уу.',
      badPhoto: 'Зураг тохирохгүй байна. Өөр зураг сонгоно уу.',
      photoBig: 'Зураг хэт том байна. Багасгаж үзнэ үү.',
    };
    let photoData = null;

    const esc = (s) => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
    const cardHTML = (w) => {
      const src = w.photo || w._localPhoto || '';
      const fig = src ? `<img class="wish-card-img" src="${src}" alt="">` : '';
      return `<figure class="wish-card">${fig}<blockquote class="wish-card-msg">${esc(w.message)}</blockquote>`
           + `<figcaption class="wish-card-name">${esc(w.name)}</figcaption></figure>`;
    };

    let wishes = JSON.parse(localStorage.getItem('urilga_wishes_stored') || '[]');
    if (wishes.length === 0) {
      wishes = [
        { name: 'Б.Батбаяр & Ариунаа', message: 'Хоёр залуудаа насан туршийн аз жаргал, хамгийн сайн сайхан бүхнийг хүсэн ерөөе! Гэр бүл нь үргэлж баяр баясгалангаар дүүрэн байг!' },
        { name: 'Г.Болдбаатар', message: 'Уригдсан бидний өлмий бат оршиж, урьсан та бүхний ураг батжих болтугай! Баяр хүргэе!' }
      ];
    }
    let slides = [];
    let cur = 0;
    let timer = null;

    const setH = () => {
      if (!slides.length) return;
      let h = 0;
      slides.forEach((s) => {
        const c = s.firstElementChild;
        if (!c) return;
        const hidden = s.style.display === 'none';
        if (hidden) s.style.display = '';
        const m = getComputedStyle(c);
        h = Math.max(h, c.offsetHeight + parseFloat(m.marginTop) + parseFloat(m.marginBottom));
        if (hidden) s.style.display = 'none';
      });
      if (h) stage.style.height = h + 'px';
    };

    const show = (i) => {
      if (!slides.length) return;
      cur = ((i % slides.length) + slides.length) % slides.length;
      slides.forEach((s, idx) => s.classList.toggle('is-active', idx === cur));
      if (dotsEl) [...dotsEl.children].forEach((d, idx) => d.classList.toggle('is-active', idx === cur));
      setH();
    };

    const stop = () => { if (timer) { window.clearInterval(timer); timer = null; } };
    const start = () => { stop(); if (reduceMotion || slides.length < 2) return; timer = window.setInterval(() => show(cur + 1), 5000); };

    const render = () => {
      stop();
      if (!wishes.length) {
        stage.innerHTML = '<p class="wishes-empty">Анхны сэтгэлийн үгийг та үлдээгээрэй</p>';
        stage.style.height = ''; slides = [];
        prevBtn.hidden = true; nextBtn.hidden = true;
        if (dotsEl) dotsEl.replaceChildren();
        return;
      }
      stage.innerHTML = wishes.map((w) => `<div class="wish-slide">${cardHTML(w)}</div>`).join('');
      slides = [...stage.querySelectorAll('.wish-slide')];
      stage.querySelectorAll('img').forEach((img) => img.addEventListener('load', setH, { once: true }));
      prevBtn.hidden = wishes.length < 2;
      nextBtn.hidden = wishes.length < 2;
      if (dotsEl) {
        dotsEl.replaceChildren();
        if (wishes.length > 1) wishes.forEach((_, i) => {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'wishes-dot';
          b.setAttribute('aria-label', `Сэтгэлийн үг ${i + 1}`);
          b.addEventListener('click', () => { show(i); start(); });
          dotsEl.appendChild(b);
        });
      }
      cur = 0; show(0);
      requestAnimationFrame(setH);
      start();
    };

    render();

    prevBtn.addEventListener('click', () => { show(cur - 1); start(); });
    nextBtn.addEventListener('click', () => { show(cur + 1); start(); });
    carousel.addEventListener('pointerenter', stop);
    carousel.addEventListener('pointerleave', start);
    window.addEventListener('resize', setH);

    // ----- press a wish to read it full-size -----
    const viewer = document.getElementById('wish-viewer');
    const vStage = document.getElementById('wish-viewer-stage');
    if (viewer && vStage) {
      const vPrev = document.getElementById('wish-viewer-prev');
      const vNext = document.getElementById('wish-viewer-next');
      const vClose = document.getElementById('wish-viewer-close');
      const vCount = document.getElementById('wish-viewer-count');
      let vCur = 0;
      const renderViewer = () => {
        if (!wishes.length) return;
        vCur = ((vCur % wishes.length) + wishes.length) % wishes.length;
        vStage.innerHTML = cardHTML(wishes[vCur]);
        if (vCount) vCount.textContent = `${vCur + 1} / ${wishes.length}`;
        vPrev.hidden = wishes.length < 2;
        vNext.hidden = wishes.length < 2;
      };
      const openViewer = (i) => { if (!wishes.length) return; stop(); vCur = i; renderViewer(); if (viewer.showModal) viewer.showModal(); else viewer.setAttribute('open', ''); };
      const closeViewer = () => { if (viewer.close) viewer.close(); else viewer.removeAttribute('open'); start(); };
      vPrev.addEventListener('click', () => { vCur -= 1; renderViewer(); });
      vNext.addEventListener('click', () => { vCur += 1; renderViewer(); });
      vClose.addEventListener('click', closeViewer);
      viewer.addEventListener('click', (e) => { if (e.target === viewer) closeViewer(); });
      viewer.addEventListener('close', start);
      viewer.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { vCur -= 1; renderViewer(); }
        else if (e.key === 'ArrowRight') { vCur += 1; renderViewer(); }
      });
      stage.style.cursor = 'pointer';
      stage.setAttribute('role', 'button');
      stage.setAttribute('tabindex', '0');
      stage.setAttribute('aria-label', 'Сэтгэлийн үгийг нээж унших');
      stage.addEventListener('click', () => { if (wishes.length) openViewer(cur); });
      stage.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && wishes.length) { e.preventDefault(); openViewer(cur); }
      });
    }

    // ----- submit dialog -----
    const result = document.getElementById('wish-result');
    const openDialog = () => { msg.textContent = ''; msg.className = 'form-msg'; stop(); if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', ''); };
    const closeDialog = () => { if (dialog.close) dialog.close(); else dialog.removeAttribute('open'); start(); };
    openBtn.addEventListener('click', openDialog);
    closeBtn.addEventListener('click', closeDialog);
    dialog.addEventListener('click', (e) => { if (e.target === dialog) closeDialog(); });

    const clearPhoto = () => { photoData = null; fileInput.value = ''; photoImg.src = ''; photoPrev.hidden = true; photoAdd.hidden = false; };
    photoAdd.addEventListener('click', () => fileInput.click());
    photoDel.addEventListener('click', clearPhoto);
    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const bad = (t) => { msg.className = 'form-msg is-err'; msg.textContent = t; };
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const MAX = 1280;
          let w = img.naturalWidth, h = img.naturalHeight;
          if (!w || !h) { bad(T.badPhoto); return; }
          if (w > MAX || h > MAX) { const s = MAX / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
          const c = document.createElement('canvas'); c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          let q = 0.82, data = c.toDataURL('image/jpeg', q);
          while (data.length > 1000000 && q > 0.4) { q -= 0.12; data = c.toDataURL('image/jpeg', q); }
          if (data.length > 1150000) { bad(T.photoBig); return; }
          photoData = data;
          photoImg.src = data; photoPrev.hidden = false; photoAdd.hidden = true;
          msg.textContent = ''; msg.className = 'form-msg';
        };
        img.onerror = () => bad(T.badPhoto);
        img.src = reader.result;
      };
      reader.onerror = () => bad(T.badPhoto);
      reader.readAsDataURL(file);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.textContent = ''; msg.className = 'form-msg';
      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      const message = String(fd.get('message') || '').trim();
      const bad = (t) => { msg.className = 'form-msg is-err'; msg.textContent = t; };
      if (!name || !message) { bad(T.need); return; }

      const newWish = { name, message, photo: photoData };
      wishes.unshift(newWish);
      localStorage.setItem('urilga_wishes_stored', JSON.stringify(wishes));
      render();

      form.reset();
      const cardData = { name, message, photoDataUrl: photoData };
      clearPhoto();
      const shown = await showResult(cardData);
      if (!shown) { msg.className = 'form-msg is-ok'; msg.textContent = T.ok; window.setTimeout(closeDialog, 1300); }
    });

    // ----- keepsake card: felt ground, gold rule, улзий roundel -----
    const cardMount = document.getElementById('wish-card-mount');
    const dlBtn = document.getElementById('wish-download');
    const shareBtn = document.getElementById('wish-share');
    const resultClose = document.getElementById('wish-result-close');
    let lastCanvas = null;

    const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
    let emblem = null;
    const ensureAssets = async () => {
      if (emblem === null) {
        emblem = await loadImg(`./assets/ornaments/ulzii.png`).catch(() => false);
      }
      try {
        await Promise.all([
          document.fonts.load('700 70px Montserrat', 'БЭР ГУЙХ ЁСЛОЛ Ө Ү'),
          document.fonts.load('400 42px Montserrat', 'Сэтгэлийн үг Ө Ү'),
          document.fonts.load('600 26px Montserrat', 'ЁСЛОЛ 2026'),
        ]);
        await document.fonts.ready;
      } catch { /* system fonts are an acceptable fallback */ }
    };
    const wrapText = (ctx, text, maxW) => {
      const out = [];
      for (const para of String(text).split('\n')) {
        let line = '';
        for (const word of para.split(/\s+/)) {
          const t2 = line ? line + ' ' + word : word;
          if (ctx.measureText(t2).width > maxW && line) { out.push(line); line = word; } else line = t2;
        }
        out.push(line);
      }
      return out;
    };

    const buildCard = async ({ name, message, photoDataUrl }) => {
      await ensureAssets();
      const W = 1080, H = 1920, PAD = 96, CX = W / 2;
      const FELT = '#14100B', CREAM = '#F0E3C9', GOLD = '#C9A24B', LACQ = '#C8552C', DIM = '#A9977B';
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const ctx = c.getContext('2d');
      ctx.fillStyle = FELT; ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(CX, H * 0.2, 100, CX, H * 0.3, H * 0.8);
      g.addColorStop(0, 'rgba(200,85,44,.16)'); g.addColorStop(1, 'rgba(20,16,11,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(201,162,75,.42)'; ctx.lineWidth = 2; ctx.strokeRect(44, 44, W - 88, H - 88);
      ctx.textAlign = 'center';

      let y = 130;
      if (emblem) { const d = 150; ctx.drawImage(emblem, CX - d / 2, y, d, d); y += d + 34; }
      ctx.fillStyle = CREAM; ctx.font = '700 70px Montserrat, sans-serif';
      ctx.fillText('Бэр гуйх ёслол', CX, y + 56); y += 108;
      ctx.fillStyle = LACQ; ctx.font = '600 25px Montserrat, sans-serif';
      if ('letterSpacing' in ctx) ctx.letterSpacing = '6px';
      ctx.fillText('Б.БИЛГҮҮН · Б.МӨНХСАРНАЙ', CX, y);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      y += 40;
      ctx.strokeStyle = GOLD; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(CX - 140, y); ctx.lineTo(CX - 14, y); ctx.moveTo(CX + 14, y); ctx.lineTo(CX + 140, y); ctx.stroke();
      ctx.save(); ctx.translate(CX, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = GOLD; ctx.fillRect(-5, -5, 10, 10); ctx.restore();
      y += 34;

      const headTop = y, footTop = H - 190;
      ctx.font = '400 42px Montserrat, sans-serif';
      const lines = wrapText(ctx, '«' + message + '»', W - 2 * PAD - 30).slice(0, 8);
      const lineH = 62, msgH = lines.length * lineH, nameH = 52, dateH = 46, gap = 42;
      let photo = null;
      if (photoDataUrl) photo = await loadImg(photoDataUrl).catch(() => null);
      let photoH = 0; const photoW = W - 2 * PAD;
      if (photo) {
        const maxH = footTop - headTop - msgH - nameH - dateH - gap * 2 - 16;
        photoH = Math.max(200, Math.min(maxH, 900, photoW * 1.1));
      }
      const totalH = (photo ? photoH + gap : 0) + msgH + gap * 0.55 + nameH + dateH;
      let my = headTop + Math.max(0, (footTop - headTop - totalH) * 0.44);

      if (!photo && emblem) {
        const d = 560;
        ctx.save();
        ctx.globalAlpha = 0.055;
        ctx.drawImage(emblem, CX - d / 2, (headTop + footTop) / 2 - d / 2, d, d);
        ctx.restore();
      }

      if (photo) {
        const px = CX - photoW / 2;
        ctx.save();
        ctx.beginPath(); ctx.rect(px, my, photoW, photoH); ctx.clip();
        const s = Math.max(photoW / photo.width, photoH / photo.height);
        ctx.drawImage(photo, CX - photo.width * s / 2, my + photoH / 2 - photo.height * s / 2, photo.width * s, photo.height * s);
        ctx.restore();
        ctx.strokeStyle = 'rgba(201,162,75,.5)'; ctx.lineWidth = 2; ctx.strokeRect(px, my, photoW, photoH);
        my += photoH + gap;
      }
      ctx.fillStyle = CREAM; ctx.font = '400 42px Montserrat, sans-serif';
      for (const ln of lines) { ctx.fillText(ln, CX, my + 44); my += lineH; }
      my += gap * 0.55;
      ctx.fillStyle = GOLD; ctx.font = '600 26px Montserrat, sans-serif';
      if ('letterSpacing' in ctx) ctx.letterSpacing = '4px';
      ctx.fillText('— ' + name.toUpperCase() + ' —', CX, my + 22);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      my += nameH;
      ctx.fillStyle = DIM; ctx.font = '400 28px Montserrat, sans-serif';
      ctx.fillText('2026 оны 9-р сарын 28 · Сайншанд сум', CX, my + 22);

      ctx.fillStyle = DIM; ctx.font = '400 28px Montserrat, sans-serif';
      ctx.fillText('Дорноговь аймаг, Сайншанд сум', CX, footTop + 58);
      ctx.fillStyle = GOLD; ctx.font = '600 24px Montserrat, sans-serif';
      ctx.fillText('urilga.online', CX, footTop + 104);
      return c;
    };

    const canSharePng = !!(navigator.canShare && (() => {
      try { return navigator.canShare({ files: [new File([new Blob([''])], 'a.png', { type: 'image/png' })] }); }
      catch { return false; }
    })());

    const showResult = async (data) => {
      let canvas;
      try { canvas = await buildCard(data); } catch { return false; }
      lastCanvas = canvas;
      cardMount.replaceChildren(canvas);
      shareBtn.hidden = !canSharePng;
      form.hidden = true; result.hidden = false;
      return true;
    };
    const resetView = () => {
      result.hidden = true; form.hidden = false;
      cardMount.replaceChildren(); lastCanvas = null;
      msg.textContent = ''; msg.className = 'form-msg';
    };

    const toBlob = (canvas) => new Promise((res) => canvas.toBlob(res, 'image/png'));
    dlBtn.addEventListener('click', async () => {
      if (!lastCanvas) return;
      const blob = await toBlob(lastCanvas); if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'ber-guih-setgeliin-ug.png';
      document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    });
    shareBtn.addEventListener('click', async () => {
      if (!lastCanvas) return;
      const blob = await toBlob(lastCanvas); if (!blob) return;
      const file = new File([blob], 'ber-guih-setgeliin-ug.png', { type: 'image/png' });
      try {
        await navigator.share({
          files: [file],
          title: 'Бэр гуйх ёслол — Б.Билгүүн · Б.Мөнхсарнай',
          text: 'Бэр гуйх ёслолд өргөх сэтгэлийн үг',
        });
      } catch { /* cancelled */ }
    });
    resultClose.addEventListener('click', closeDialog);
    dialog.addEventListener('close', () => { resetView(); start(); });
  })();

  // ---------- RSVP ----------
  const form = document.getElementById('rsvp-form');
  if (form) {
    const submitBtn = form.querySelector('.submit-btn');
    const msg = document.getElementById('form-msg');
    const fail = (text) => { msg.className = 'form-msg is-err'; msg.textContent = text; };
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      msg.className = 'form-msg'; msg.textContent = '';
      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      const attendance = String(fd.get('attendance') || '');
      if (!name) { fail(MSG.nameRequired); return; }
      if (!attendance) { fail(MSG.attendanceRequired); return; }
      
      const rsvpList = JSON.parse(localStorage.getItem('urilga_rsvps') || '[]');
      rsvpList.push({ name, attendance, date: new Date().toLocaleString() });
      localStorage.setItem('urilga_rsvps', JSON.stringify(rsvpList));

      msg.className = 'form-msg is-ok';
      msg.textContent = MSG.success;
      form.reset();
    });
  }
})();
