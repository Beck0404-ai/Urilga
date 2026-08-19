document.addEventListener('DOMContentLoaded', () => {
  // 1. GATE OPENING & AUDIO SETUP
  const gate = document.getElementById('gate');
  const gateEnter = document.getElementById('gate-enter');
  const bgMusic = document.getElementById('bg-music');
  const musicBtn = document.getElementById('music-btn');

  let musicPlaying = false;

  const playMusic = () => {
    if (!bgMusic) return;
    bgMusic.play().then(() => {
      musicPlaying = true;
      if (musicBtn) {
        musicBtn.setAttribute('aria-pressed', 'true');
      }
    }).catch(() => {
      // Autoplay might be blocked by browser policy
    });
  };

  const pauseMusic = () => {
    if (!bgMusic) return;
    bgMusic.pause();
    musicPlaying = false;
    if (musicBtn) {
      musicBtn.setAttribute('aria-pressed', 'false');
    }
  };

  if (musicBtn) {
    musicBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (musicPlaying) {
        pauseMusic();
      } else {
        playMusic();
      }
    });
  }

  if (gate) {
    document.body.classList.add('gate-locked');
    let gateOpened = false;

    const openGate = () => {
      if (gateOpened) return;
      gateOpened = true;
      
      playMusic();
      gate.classList.add('gate--opening');

      setTimeout(() => {
        gate.classList.add('gate--leaving');
        document.body.classList.remove('gate-locked');
      }, 380);

      setTimeout(() => {
        gate.hidden = true;
      }, 1300);
    };

    if (gateEnter) {
      gateEnter.addEventListener('click', (e) => {
        e.stopPropagation();
        openGate();
      });
    }

    gate.addEventListener('click', openGate);
  }

  // 2. SCROLL OBSERVER (FADE-UP ANIMATIONS)
  const fadeElements = document.querySelectorAll('.fade-up');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  fadeElements.forEach(el => observer.observe(el));

  // 3. COUNTDOWN TIMER
  const targetDateStr = document.body.dataset.targetDate || '2026-09-18T16:00:00+08:00';
  const targetTime = new Date(targetDateStr).getTime();

  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minsEl = document.getElementById('cd-mins');
  const secsEl = document.getElementById('cd-secs');

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetTime - now;

    if (distance <= 0) {
      if (daysEl) daysEl.textContent = '00';
      if (hoursEl) hoursEl.textContent = '00';
      if (minsEl) minsEl.textContent = '00';
      if (secsEl) secsEl.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minsEl) minsEl.textContent = String(minutes).padStart(2, '0');
    if (secsEl) secsEl.textContent = String(seconds).padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // 4. DAY TABS (3-DAY SCHEDULE)
  const dayTabs = document.querySelectorAll('.day-tab');
  const schedulePanes = document.querySelectorAll('.schedule-pane');

  dayTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetDay = tab.dataset.day;

      // Deactivate all
      dayTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      schedulePanes.forEach(pane => pane.classList.remove('active'));

      // Activate selected
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const activePane = document.getElementById(targetDay);
      if (activePane) {
        activePane.classList.add('active');
      }
    });
  });

  // 5. RSVP FORM SUBMISSION
  const rsvpForm = document.getElementById('rsvp-form');
  const formAlert = document.getElementById('form-alert');
  const submitBtn = document.getElementById('submit-btn');

  if (rsvpForm) {
    // Check if user already submitted
    const savedRSVP = localStorage.getItem('gobi_meeting_rsvp');
    if (savedRSVP) {
      try {
        const data = JSON.parse(savedRSVP);
        formAlert.className = 'form-alert success';
        formAlert.innerHTML = `✓ Танд баярлалаа! Таны бүртгэл амжилттай баталгаажсан байна.<br><small><strong>Нэр:</strong> ${data.name} (${data.province}, ${data.sum})</small>`;
        formAlert.hidden = false;
      } catch (e) {}
    }

    rsvpForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('rsvp-name').value.trim();
      const province = document.getElementById('rsvp-province').value;
      const sum = document.getElementById('rsvp-sum').value.trim();
      const role = document.getElementById('rsvp-role').value.trim();
      const phone = document.getElementById('rsvp-phone').value.trim();
      const attendance = rsvpForm.elements['attendance'].value;

      if (!name || !province || !sum || !role || !phone) {
        formAlert.className = 'form-alert error';
        formAlert.textContent = 'Бүх шаардлагатай талбарыг гүйцэд бөглөнө үү.';
        formAlert.hidden = false;
        return;
      }

      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-text').textContent = 'БАТАЛГААЖУУЛЖ БАЙНА...';

      setTimeout(() => {
        const rsvpData = { name, province, sum, role, phone, attendance, timestamp: new Date().toISOString() };
        localStorage.setItem('gobi_meeting_rsvp', JSON.stringify(rsvpData));

        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').textContent = 'БАТАЛГААЖСАН ✓';

        formAlert.className = 'form-alert success';
        formAlert.innerHTML = `🎉 <strong>Амжилттай бүртгэгдлээ!</strong><br>Эрхэм <strong>${name}</strong> таны “Говийн бүсийн удирдах ажилтан, сонгуультны уулзалт, сургалт”-д оролцох бүртгэл хүлээн авагдлаа. Сайншанд хотноо уулзацгаая!`;
        formAlert.hidden = false;
      }, 600);
    });
  }

  // ============================================================
  // 6. DYNAMIC MOVING BACKGROUND (NEON PARTICLES & LASER STREAMS)
  // ============================================================
  const canvas = document.getElementById('bg-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const colors = [
      'rgba(0, 229, 255, ',    // Cyan
      'rgba(255, 45, 117, ',   // Magenta
      'rgba(255, 190, 26, ',   // Gold
      'rgba(255, 94, 58, ',    // Coral
      'rgba(255, 255, 255, '   // Diamond white
    ];

    // Particle pool
    const particleCount = Math.min(Math.floor(width * 0.08), 85);
    const particles = [];

    class Particle {
      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * width;
        this.y = init ? Math.random() * height : height + Math.random() * 20;
        this.radius = Math.random() * 2.2 + 0.8;
        this.baseAlpha = Math.random() * 0.6 + 0.25;
        this.alpha = this.baseAlpha;
        this.speedY = Math.random() * 0.45 + 0.2;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = Math.random() * 0.03 + 0.015;
      }

      update() {
        this.y -= this.speedY;
        this.x += this.speedX + Math.sin(this.pulse) * 0.2;
        this.pulse += this.pulseSpeed;
        this.alpha = this.baseAlpha + Math.sin(this.pulse) * 0.25;

        if (this.y < -10 || this.x < -10 || this.x > width + 10) {
          this.reset(false);
        }
      }

      draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color + Math.max(0.1, this.alpha) + ')';
        ctx.shadowBlur = this.radius * 4;
        ctx.shadowColor = this.color + '0.8)';
        ctx.fill();
        ctx.restore();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Laser / Shooting beam system
    const lasers = [];
    class LaserBeam {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width * 1.2 - width * 0.1;
        this.y = -50;
        this.length = Math.random() * 120 + 80;
        this.speed = Math.random() * 6 + 4;
        this.angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.2; // approx 45 degrees
        this.color = colors[Math.floor(Math.random() * 3)]; // Cyan, Magenta or Gold
        this.alpha = Math.random() * 0.5 + 0.3;
        this.active = false;
        this.nextSpawn = Date.now() + Math.random() * 3500 + 1500;
      }

      update(now) {
        if (!this.active && now > this.nextSpawn) {
          this.active = true;
        }
        if (!this.active) return;

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        if (this.y > height + 100 || this.x > width + 100) {
          this.active = false;
          this.reset();
        }
      }

      draw() {
        if (!this.active) return;
        ctx.save();
        const tailX = this.x - Math.cos(this.angle) * this.length;
        const tailY = this.y - Math.sin(this.angle) * this.length;

        const grad = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
        grad.addColorStop(0, this.color + '0)');
        grad.addColorStop(0.7, this.color + (this.alpha * 0.5) + ')');
        grad.addColorStop(1, '#ffffff');

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color + '0.9)';
        ctx.stroke();

        // Glowing head spark
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ffffff';
        ctx.fill();

        ctx.restore();
      }
    }

    for (let i = 0; i < 3; i++) {
      lasers.push(new LaserBeam());
    }

    // Animation Loop
    let animationFrameId;
    function animate() {
      ctx.clearRect(0, 0, width, height);

      const now = Date.now();

      // Render floating particles
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      // Render shooting lasers
      lasers.forEach((l) => {
        l.update(now);
        l.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    // Resize Handler
    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    // Touch / Mouse interactive sparkles
    let lastSparkle = 0;
    const addSparkle = (x, y) => {
      const now = Date.now();
      if (now - lastSparkle < 60) return;
      lastSparkle = now;

      for (let i = 0; i < 3; i++) {
        const p = new Particle();
        p.x = x + (Math.random() - 0.5) * 20;
        p.y = y + (Math.random() - 0.5) * 20;
        p.speedY = (Math.random() - 0.5) * 1.5;
        p.speedX = (Math.random() - 0.5) * 1.5;
        p.radius = Math.random() * 2.8 + 1.2;
        p.baseAlpha = 0.9;
        particles.push(p);
        if (particles.length > 110) particles.shift();
      }
    };

    window.addEventListener('mousemove', (e) => addSparkle(e.clientX, e.clientY));
    window.addEventListener('touchmove', (e) => {
      if (e.touches[0]) addSparkle(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
  }
});
