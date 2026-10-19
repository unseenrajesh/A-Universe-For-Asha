(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = $('#starfield');
  const ctx = canvas.getContext('2d');
  const cursorGlow = $('.cursor-glow');
  const audio = $('#backgroundMusic');
  const musicToggle = $('#musicToggle');
  const musicLabel = $('#musicLabel');
  const photoModal = $('#photoModal');
  const letterModal = $('#letterModal');
  let stars = [], shootingTimer, toastTimer, activePhoto = 0;
  let currentScene = 'intro';

  const photoData = Array.from({ length: 10 }, (_, i) => ({
    src: `photos/photo${i + 1}.jpg`,
    title: ['A little moment of magic','One for the memory book','A moment worth keeping','Our little universe','A smile I want to remember','A tiny piece of forever','The kind of moment that stays','A memory wrapped in stardust','A favourite little chapter','And many more to come'][i]
  }));

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.min(190, Math.floor(window.innerWidth / 6)) }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + .25,
      alpha: Math.random() * .7 + .15,
      speed: Math.random() * .006 + .001,
      phase: Math.random() * Math.PI * 2,
      drift: (Math.random() - .5) * .12
    }));
  }
  function drawStars(time = 0) {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const star of stars) {
      const pulse = prefersReducedMotion ? 1 : .55 + .45 * Math.sin(time * star.speed + star.phase);
      ctx.beginPath(); ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(235,220,255,${star.alpha * pulse})`; ctx.fill();
      if (star.r > 1.25) {
        ctx.strokeStyle = `rgba(255,235,255,${star.alpha * pulse * .3})`;
        ctx.beginPath(); ctx.moveTo(star.x - 3, star.y); ctx.lineTo(star.x + 3, star.y);
        ctx.moveTo(star.x, star.y - 3); ctx.lineTo(star.x, star.y + 3); ctx.stroke();
      }
      if (!prefersReducedMotion) { star.y -= .035; star.x += star.drift; if (star.y < -3) { star.y = window.innerHeight + 3; star.x = Math.random() * window.innerWidth; } }
    }
    if (!prefersReducedMotion) requestAnimationFrame(drawStars);
  }
  resizeCanvas(); requestAnimationFrame(drawStars);
  window.addEventListener('resize', resizeCanvas);

  window.addEventListener('pointermove', (event) => {
    if (cursorGlow && event.pointerType === 'mouse') {
      cursorGlow.style.left = `${event.clientX}px`; cursorGlow.style.top = `${event.clientY}px`;
    }
  }, { passive: true });

  function particleBurst(x, y, count = 34) {
    if (prefersReducedMotion) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span'); p.className = 'spark-particle';
      p.style.left = `${x}px`; p.style.top = `${y}px`;
      const angle = Math.PI * 2 * i / count + Math.random() * .2;
      const distance = 45 + Math.random() * 150;
      p.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
      p.style.animationDelay = `${Math.random() * .16}s`;
      document.body.appendChild(p); p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }
  function shootStar() {
    if (document.hidden || prefersReducedMotion) return;
    const star = document.createElement('span'); star.className = 'shooting-star';
    star.style.left = `${25 + Math.random() * 85}vw`;
    star.style.top = `${Math.random() * 65}vh`;
    document.body.appendChild(star); star.addEventListener('animationend', () => star.remove(), { once: true });
  }
  function scheduleShootingStars() {
    clearTimeout(shootingTimer);
    shootingTimer = setTimeout(() => { shootStar(); scheduleShootingStars(); }, 1800 + Math.random() * 4200);
  }
  scheduleShootingStars();

  function showScene(id) {
    $$('.scene').forEach(scene => scene.classList.toggle('active', scene.id === id));
    currentScene = id;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    if (id === 'memories') animateMemoryCards();
  }
  function animateMemoryCards() {
    $$('.memory-card').forEach((card, i) => {
      card.style.animation = 'none'; void card.offsetWidth;
      card.style.animation = `cardArrive .8s cubic-bezier(.2,.7,.2,1) ${i * .07}s forwards`;
    });
  }

  $('#enterUniverse').addEventListener('click', (event) => {
    particleBurst(event.clientX, event.clientY, 45);
    showScene('portalScene');
  });
  $('#openPortal').addEventListener('click', (event) => {
    const portal = event.currentTarget;
    if (portal.classList.contains('burst')) return;
    portal.classList.add('burst'); particleBurst(event.clientX, event.clientY, 72);
    $('#portalStatus').textContent = 'The universe has opened a path to your memories…';
    setTimeout(() => showScene('memories'), prefersReducedMotion ? 100 : 1050);
  });

  const grid = $('#memoryGrid');
  photoData.forEach((photo, index) => {
    const button = document.createElement('button'); button.className = 'memory-card';
    button.type = 'button'; button.style.setProperty('--delay', `${index * .055}s`);
    button.setAttribute('aria-label', `Open photo ${index + 1}: ${photo.title}`);
    const fallback = document.createElement('span'); fallback.className = 'photo-fallback'; fallback.textContent = '✦';
    const img = document.createElement('img'); img.src = photo.src; img.alt = photo.title; img.loading = index < 5 ? 'eager' : 'lazy';
    img.addEventListener('error', () => { img.style.display = 'none'; fallback.textContent = '✧'; });
    const number = document.createElement('span'); number.className = 'memory-number'; number.textContent = `Memory ${String(index + 1).padStart(2, '0')}`;
    button.append(fallback, img, number); button.addEventListener('click', () => openPhoto(index)); grid.appendChild(button);
  });
  function openPhoto(index) {
    activePhoto = (index + photoData.length) % photoData.length;
    const photo = photoData[activePhoto]; $('#modalPhoto').src = photo.src; $('#modalPhoto').alt = photo.title;
    $('#modalCaption').textContent = photo.title; photoModal.hidden = false;
    particleBurst(window.innerWidth / 2, window.innerHeight / 2, 20);
  }
  $('#prevPhoto').addEventListener('click', () => openPhoto(activePhoto - 1));
  $('#nextPhoto').addEventListener('click', () => openPhoto(activePhoto + 1));

  $('#toLetter').addEventListener('click', (event) => {
    particleBurst(event.clientX, event.clientY, 42);
    showScene('letterScene');
  });
  $('#toFinale').addEventListener('click', (event) => {
    particleBurst(event.clientX, event.clientY, 55);
    showScene('finale');
  });

  $('#openLetter').addEventListener('click', (event) => {
    event.currentTarget.classList.add('open');
    particleBurst(event.clientX, event.clientY, 38);
    setTimeout(() => { letterModal.hidden = false; }, prefersReducedMotion ? 0 : 350);
  });
  $$('[data-close]').forEach(button => button.addEventListener('click', () => {
    const modal = document.getElementById(button.dataset.close); if (modal) modal.hidden = true;
  }));
  [photoModal, letterModal].forEach(modal => modal.addEventListener('click', (event) => { if (event.target === modal) modal.hidden = true; }));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { photoModal.hidden = true; letterModal.hidden = true; }
    if (!photoModal.hidden && event.key === 'ArrowLeft') openPhoto(activePhoto - 1);
    if (!photoModal.hidden && event.key === 'ArrowRight') openPhoto(activePhoto + 1);
  });

  musicToggle.addEventListener('click', async () => {
    if (audio.paused) {
      try { await audio.play(); musicLabel.textContent = 'Pause our song'; musicToggle.setAttribute('aria-label', 'Pause background music'); }
      catch { showToast('Add your song as music/your-song.mp3 first.'); }
    } else { audio.pause(); musicLabel.textContent = 'Play our song'; musicToggle.setAttribute('aria-label', 'Play background music'); }
  });
  audio.addEventListener('error', () => { musicLabel.textContent = 'Add your song'; });

  const wishes = [
    'May your days find little reasons to sparkle. ✨',
    'May kind moments find you wherever you go. 🌙',
    'May you always remember the light you carry. 💫',
    'May beautiful surprises find their way to you. ♡',
    'May your dreams feel a little closer tonight. ✦'
  ];
  $('#wishButton').addEventListener('click', (event) => {
    particleBurst(event.clientX, event.clientY, 65);
    $('#wishResult').textContent = wishes[Math.floor(Math.random() * wishes.length)];
    $('#wishButton span').textContent = 'Make another wish';
  });
  $('#replayButton').addEventListener('click', () => {
    photoModal.hidden = true; letterModal.hidden = true;
    $('#openPortal').classList.remove('burst'); $('#portalStatus').textContent = 'A little magic is waiting for you.';
    $('#openLetter').classList.remove('open'); $('#wishResult').textContent = '';
    showScene('intro'); particleBurst(window.innerWidth / 2, window.innerHeight / 2, 55);
  });
  function showToast(message) {
    const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }
})();
