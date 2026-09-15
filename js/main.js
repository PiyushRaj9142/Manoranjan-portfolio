/**
 * MANORANJAN VERMA — CINEMATIC INTERACTIVE PORTFOLIO
 * Core JavaScript: Lenis Smooth Scroll, GSAP Timelines, Web Audio SFX & Video Modal
 */

(function () {
  'use strict';

  // State
  const state = {
    soundEnabled: false,
    audioCtx: null,
    isLoaded: false,
    modalActive: false,
    modalPlaying: false,
    modalProgress: 0,
    modalAnimId: null
  };

  /* ==================================================
     1. INITIALIZATION & LENIS SMOOTH SCROLL
     ================================================== */
  let lenis;
  function initLenis() {
    if (typeof Lenis !== 'undefined') {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 2.0
      });

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);

      // Connect Lenis to GSAP ScrollTrigger
      if (typeof ScrollTrigger !== 'undefined') {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
          lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
      }
    }
  }

  /* ==================================================
     2. AMBIENT BACKGROUND CANVAS (Light Streaks & Dust)
     ================================================== */
  function initAmbientCanvas() {
    const canvas = document.getElementById('ambient-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height;
    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Particle System
    const particleCount = window.innerWidth < 768 ? 25 : 55;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.8 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3 - 0.15,
        alpha: Math.random() * 0.5 + 0.1,
        color: Math.random() > 0.6 ? '#FFE500' : '#FF2A2A'
      });
    }

    // Light Streaks
    const streaks = [
      { y: height * 0.25, angle: -0.15, speed: 0.2, opacity: 0.15, color: 'rgba(229, 9, 20, ' },
      { y: height * 0.65, angle: -0.12, speed: 0.15, opacity: 0.12, color: 'rgba(255, 229, 0, ' }
    ];

    let mouseX = width / 2;
    let mouseY = height / 2;
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle light streak
      streaks.forEach((s) => {
        const grad = ctx.createLinearGradient(0, s.y - 100, width, s.y + 100);
        grad.addColorStop(0, s.color + '0)');
        grad.addColorStop(0.5, s.color + (s.opacity * 0.5) + ')');
        grad.addColorStop(1, s.color + '0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, s.y - 50, width, 100);
      });

      // Draw dust particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      requestAnimationFrame(draw);
    }
    draw();
  }

  /* ==================================================
     3. TIMECODE CLOCK (24 FPS LIVE SIMULATOR)
     ================================================== */
  function initTimecode() {
    const clockEl = document.getElementById('timecode-clock');
    if (!clockEl) return;

    let frames = 0;
    let seconds = 0;
    let minutes = 0;
    let hours = 0;

    setInterval(() => {
      frames++;
      if (frames >= 24) {
        frames = 0;
        seconds++;
        if (seconds >= 60) {
          seconds = 0;
          minutes++;
          if (minutes >= 60) {
            minutes = 0;
            hours++;
          }
        }
      }

      const pad = (n) => String(n).padStart(2, '0');
      clockEl.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
    }, 1000 / 24);
  }

  /* ==================================================
     4. 0–3s CINEMATIC LOADER SEQUENCE
     ================================================== */
  function initLoader() {
    const loader = document.getElementById('loader');
    const progressBar = document.getElementById('loader-progress');
    const percentageEl = document.getElementById('loader-percentage');
    const skipBtn = document.getElementById('skip-loader');

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 12) + 5;
      if (progress > 100) progress = 100;

      if (progressBar) progressBar.style.width = progress + '%';
      if (percentageEl) percentageEl.textContent = progress + '%';

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(dismissLoader, 400);
      }
    }, 100);

    function dismissLoader() {
      if (state.isLoaded) return;
      state.isLoaded = true;
      clearInterval(interval);

      if (loader) {
        loader.classList.add('loaded');
      }
      document.body.classList.remove('is-loading');

      // Trigger Hero Reveal Animation
      triggerHeroReveal();
      playSfx('whoosh');
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', dismissLoader);
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !state.isLoaded) dismissLoader();
    });
  }

  /* ==================================================
     5. GSAP SCROLLTRIGGER ANIMATION TIMELINE
     ================================================== */
  function triggerHeroReveal() {
    if (typeof gsap === 'undefined') return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo('#hero-giant-text',
      { scale: 1.4, opacity: 0, y: 60 },
      { scale: 1, opacity: 1, y: 0, duration: 1.4 }
    )
      .fromTo('#hero-portrait-stage',
        { scale: 0.85, opacity: 0, y: 80 },
        { scale: 1, opacity: 1, y: 0, duration: 1.2 },
        '-=1.0'
      )
      .fromTo('.hero-content .hero-eyebrow, .hero-content .hero-greeting, .hero-content .hero-roles-bar, .hero-content .hero-actions',
        { opacity: 0, y: 35 },
        { opacity: 1, y: 0, stagger: 0.15, duration: 1.0 },
        '-=0.8'
      );
  }

  function initScrollAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // 1. Stats Counters & Progress Bars
    ScrollTrigger.create({
      trigger: '#about-stats',
      start: 'top 75%',
      onEnter: () => {
        animateCounters();
        document.querySelectorAll('.stat-box').forEach(box => box.classList.add('in-view'));
      }
    });

    // 2. Brand & Product Video Cards Stagger
    gsap.utils.toArray('.showcase-grid .video-card').forEach((card) => {
      const dir = card.getAttribute('data-direction');
      let xVal = 0, yVal = 40;
      if (dir === 'left') xVal = -60;
      if (dir === 'right') xVal = 60;
      if (dir === 'bottom') yVal = 80;

      gsap.fromTo(card,
        { opacity: 0, x: xVal, y: yVal, scale: 0.95 },
        {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%'
          }
        }
      );
    });

    // 3. Event Floating Cards
    gsap.utils.toArray('.event-floating-layout .event-card').forEach((card, idx) => {
      gsap.fromTo(card,
        { opacity: 0, y: 60 + (idx * 20) },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%'
          }
        }
      );
    });

    // 4. Album Song Cards
    gsap.utils.toArray('.album-cards-deck .album-card').forEach((card) => {
      const animType = card.getAttribute('data-anim');
      let fromProps = { opacity: 0 };
      if (animType === 'scale-fade') fromProps = { opacity: 0, scale: 0.85 };
      if (animType === 'slide-right') fromProps = { opacity: 0, x: 70 };
      if (animType === 'slide-bottom') fromProps = { opacity: 0, y: 70 };

      gsap.fromTo(card,
        fromProps,
        {
          opacity: 1,
          scale: 1,
          x: 0,
          y: 0,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%'
          }
        }
      );
    });

    // 5. Interior Videos Parallax
    gsap.utils.toArray('.interior-column').forEach((col) => {
      const speed = parseFloat(col.getAttribute('data-speed') || '1');
      gsap.to(col, {
        y: -(100 * speed),
        ease: 'none',
        scrollTrigger: {
          trigger: '#interior-videos',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });

    // 6. Social Media Reels 3D Tilt Cards
    gsap.utils.toArray('.reel-card-wrap').forEach((reel, i) => {
      const rot = parseFloat(reel.getAttribute('data-rotate') || '0');
      gsap.fromTo(reel,
        { opacity: 0, y: 60, rotateZ: 0 },
        {
          opacity: 1,
          y: 0,
          rotateZ: rot,
          duration: 1.2,
          ease: 'power3.out',
          delay: i * 0.1,
          scrollTrigger: {
            trigger: reel,
            start: 'top 85%'
          }
        }
      );
    });

    // 7. Final CTA Kinetic Typography Word Reveal
    gsap.utils.toArray('#kinetic-cta-phrase .k-word').forEach((word, index) => {
      gsap.fromTo(word,
        { opacity: 0, y: 40, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          delay: index * 0.08,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: '#final-cta',
            start: 'top 75%'
          }
        }
      );
    });

    // 8. Header background shift on scroll
    ScrollTrigger.create({
      start: 'top -80',
      end: 99999,
      toggleClass: {
        className: 'scrolled',
        targets: '#site-header'
      }
    });
  }

  /* ==================================================
     6. STATS NUMBER COUNTER FUNCTION
     ================================================== */
  function animateCounters() {
    const stat1 = document.getElementById('stat-1');
    const stat2 = document.getElementById('stat-2');
    const stat3 = document.getElementById('stat-3');
    const stat4 = document.getElementById('stat-4');

    function countTo(el, target, duration = 1600) {
      if (!el) return;
      let start = 0;
      const stepTime = 20;
      const steps = duration / stepTime;
      const increment = target / steps;

      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          el.textContent = Math.round(target);
          clearInterval(timer);
        } else {
          el.textContent = Math.round(start);
        }
      }, stepTime);
    }

    countTo(stat1, 2, 1200);
    countTo(stat2, 1, 1500);
    countTo(stat3, 50, 1800);
    countTo(stat4, 5, 1400);
  }

  /* ==================================================
     7. VIDEO & REEL MODAL PLAYER SYSTEM
     ================================================== */
  function initVideoModal() {
    const modal = document.getElementById('video-modal');
    const modalVideo = document.getElementById('modal-video');
    const closeBtn = document.getElementById('modal-close');
    const backdrop = document.getElementById('modal-backdrop');
    const playBtn = document.getElementById('modal-play-btn');
    const playIcon = document.getElementById('modal-play-icon');
    const centerPlay = document.getElementById('modal-center-play');
    const muteBtn = document.getElementById('modal-mute-btn');
    const fsBtn = document.getElementById('modal-fs-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalClient = document.getElementById('modal-client');
    const modalCatTag = document.getElementById('modal-cat-tag');
    const modalTags = document.getElementById('modal-tags');
    const timeCount = document.getElementById('modal-time-count');
    const timelineBar = document.getElementById('modal-timeline-bar');
    const timelineFill = document.getElementById('modal-timeline-fill');
    const spinner = document.getElementById('modal-video-spinner');
    const mediaFrame = document.getElementById('modal-media-frame');

    if (!modal || !modalVideo) return;

    let isSeeking = false;

    // Attach click triggers to all cards and buttons with data-video-src or data-video-title
    const triggers = document.querySelectorAll('[data-video-src], [data-video-title]');
    triggers.forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        // If clicking an external link, let it navigate
        if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('http') && !e.target.hasAttribute('data-video-src')) {
          return;
        }

        const src = trigger.getAttribute('data-video-src') || 'assets/videos/master-showreel.mp4';
        const title = trigger.getAttribute('data-video-title') || 'Featured Work';
        const client = trigger.getAttribute('data-video-client') || 'Featured Work';
        const category = trigger.getAttribute('data-video-category') || 'Production Cut';
        const duration = trigger.getAttribute('data-video-duration') || '01:00';
        const tags = (trigger.getAttribute('data-video-tags') || '').split(',');
        const poster = trigger.getAttribute('data-video-image') || '';

        openModal({ src, title, client, category, duration, tags, poster });
        playSfx('click');
      });
    });

    function formatTime(seconds) {
      if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function updatePlayState(isPlaying) {
      state.modalPlaying = isPlaying;
      if (playIcon) {
        playIcon.textContent = isPlaying ? '❚❚' : '▶';
      }
      if (centerPlay) {
        centerPlay.classList.toggle('is-hidden', isPlaying);
      }
    }

    function updateMuteState(muted) {
      modalVideo.muted = muted;
      if (muteBtn) {
        muteBtn.classList.toggle('is-muted', muted);
      }
    }

    function togglePlay() {
      if (modalVideo.paused || modalVideo.ended) {
        if (spinner) spinner.classList.add('is-active');
        const playPromise = modalVideo.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            if (spinner) spinner.classList.remove('is-active');
            updatePlayState(true);
          }).catch((err) => {
            if (spinner) spinner.classList.remove('is-active');
            modalVideo.muted = true;
            updateMuteState(true);
            modalVideo.play().then(() => {
              updatePlayState(true);
            }).catch(() => {
              updatePlayState(false);
            });
          });
        }
      } else {
        modalVideo.pause();
        updatePlayState(false);
      }
      playSfx('click');
    }

    function toggleMute() {
      updateMuteState(!modalVideo.muted);
      playSfx('click');
    }

    function toggleFullscreen() {
      const frame = mediaFrame || modalVideo;
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (frame.requestFullscreen) {
          frame.requestFullscreen().catch(() => {});
        } else if (frame.webkitRequestFullscreen) {
          frame.webkitRequestFullscreen();
        } else if (modalVideo.webkitEnterFullscreen) {
          modalVideo.webkitEnterFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
      playSfx('click');
    }

    function openModal(data) {
      state.modalActive = true;
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      // Pause all background card preview videos immediately
      document.querySelectorAll('.card-video-bg').forEach((bgVid) => {
        try { bgVid.pause(); } catch (e) {}
      });

      if (modalTitle) modalTitle.textContent = data.title;
      if (modalClient) modalClient.textContent = data.client.toUpperCase();
      if (modalCatTag) modalCatTag.textContent = data.category.toUpperCase();

      if (modalTags) {
        modalTags.innerHTML = '';
        data.tags.forEach((t) => {
          if (t.trim()) {
            const span = document.createElement('span');
            span.textContent = t.trim();
            modalTags.appendChild(span);
          }
        });
      }

      if (data.poster) {
        modalVideo.poster = data.poster;
      }

      modalVideo.setAttribute('playsinline', '');
      modalVideo.setAttribute('webkit-playsinline', '');

      if (timeCount) timeCount.textContent = `00:00 / ${data.duration}`;
      if (timelineFill) timelineFill.style.width = '0%';

      // Reset & load video source
      const isSameSrc = modalVideo.currentSrc && (modalVideo.currentSrc.endsWith(data.src) || modalVideo.src.endsWith(data.src));
      if (!isSameSrc) {
        if (spinner) spinner.classList.add('is-active');
        modalVideo.src = data.src;
        modalVideo.load();
      }

      // Try playing unmuted since user explicitly tapped the card
      modalVideo.muted = false;
      updateMuteState(false);

      const playPromise = modalVideo.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          if (spinner) spinner.classList.remove('is-active');
          updatePlayState(true);
        }).catch((err) => {
          console.log('Unmuted autoplay deferred; attempting muted play:', err);
          modalVideo.muted = true;
          updateMuteState(true);
          modalVideo.play().then(() => {
            if (spinner) spinner.classList.remove('is-active');
            updatePlayState(true);
          }).catch(() => {
            if (spinner) spinner.classList.remove('is-active');
            updatePlayState(false);
          });
        });
      }
    }

    function closeModal() {
      state.modalActive = false;
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      modalVideo.pause();
      modalVideo.currentTime = 0;
      updatePlayState(false);
      if (spinner) spinner.classList.remove('is-active');
      playSfx('click');
    }

    // Video Element Events & State Tracking
    modalVideo.addEventListener('timeupdate', () => {
      if (!isSeeking && modalVideo.duration) {
        const pct = (modalVideo.currentTime / modalVideo.duration) * 100;
        if (timelineFill) timelineFill.style.width = pct + '%';
        if (timeCount) {
          timeCount.textContent = `${formatTime(modalVideo.currentTime)} / ${formatTime(modalVideo.duration)}`;
        }
      }
    });

    modalVideo.addEventListener('waiting', () => {
      if (spinner) spinner.classList.add('is-active');
    });

    modalVideo.addEventListener('playing', () => {
      if (spinner) spinner.classList.remove('is-active');
      updatePlayState(true);
    });

    modalVideo.addEventListener('canplay', () => {
      if (spinner) spinner.classList.remove('is-active');
    });

    modalVideo.addEventListener('loadeddata', () => {
      if (spinner) spinner.classList.remove('is-active');
    });

    modalVideo.addEventListener('error', (e) => {
      if (spinner) spinner.classList.remove('is-active');
      console.error('Modal video error:', modalVideo.error);
    });

    modalVideo.addEventListener('ended', () => {
      updatePlayState(false);
      if (timelineFill) timelineFill.style.width = '100%';
    });

    modalVideo.addEventListener('play', () => updatePlayState(true));
    modalVideo.addEventListener('pause', () => updatePlayState(false));

    // Timeline Scrubbing
    if (timelineBar) {
      function seek(e) {
        const rect = timelineBar.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        if (modalVideo.duration) {
          modalVideo.currentTime = pos * modalVideo.duration;
          if (timelineFill) timelineFill.style.width = (pos * 100) + '%';
        }
      }

      timelineBar.addEventListener('click', seek);
      timelineBar.addEventListener('touchstart', (e) => {
        isSeeking = true;
        seek(e);
      }, { passive: true });
      timelineBar.addEventListener('touchmove', (e) => {
        if (isSeeking) seek(e);
      }, { passive: true });
      timelineBar.addEventListener('touchend', () => {
        isSeeking = false;
      });

      timelineBar.addEventListener('mousedown', (e) => {
        isSeeking = true;
        seek(e);
        const onMouseMove = (moveEvent) => seek(moveEvent);
        const onMouseUp = () => {
          isSeeking = false;
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    }

    // Direct Media Frame Click / Center Play Button Click
    if (mediaFrame) {
      mediaFrame.addEventListener('click', (e) => {
        if (!e.target.closest('.modal-player-controls') && !e.target.closest('.modal-header-actions')) {
          togglePlay();
        }
      });
    }

    if (centerPlay) {
      centerPlay.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlay();
      });
    }

    // Controls Buttons
    if (playBtn) playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlay();
    });
    if (muteBtn) muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMute();
    });
    if (fsBtn) fsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFullscreen();
    });
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (!state.modalActive) return;

      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    });
  }

  /* ==================================================
     7B. CARD VIDEO HOVER & INTERSECTION PREVIEWS
     ================================================== */
  function initCardVideoPreviews() {
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 1024);
    if (isTouchDevice) {
      return;
    }

    const cardVideos = document.querySelectorAll('.card-video-bg');
    if (!cardVideos.length) return;

    // Desktop hover preview only
    cardVideos.forEach((video) => {
      const parent = video.closest('.video-card, .event-card, .album-card, .interior-card, .reel-card-wrap');
      if (!parent) return;

      parent.addEventListener('mouseenter', () => {
        if (state.modalActive) return;
        video.currentTime = 0;
        const p = video.play();
        if (p !== undefined) p.catch(() => {});
      });

      parent.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0;
      });
    });
  }

  /* ==================================================
     8. CUSTOM MAGNETIC CURSOR
     ================================================== */
  function initCustomCursor() {
    const cursor = document.getElementById('custom-cursor');
    const label = document.getElementById('cursor-label');
    if (!cursor) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function updateCursor() {
      // Smooth lerp
      cursorX += (mouseX - cursorX) * 0.18;
      cursorY += (mouseY - cursorY) * 0.18;

      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
      requestAnimationFrame(updateCursor);
    }
    requestAnimationFrame(updateCursor);

    // Interactive Hover Elements
    const interactiveElements = document.querySelectorAll('[data-cursor], a, button, .video-card, .event-card, .album-card, .reel-card-wrap, .interior-card, .brand-item');

    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('hovering');
        const customText = el.getAttribute('data-cursor') || 'VIEW';
        if (label) label.textContent = customText;
        playSfx('hover');
      });

      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('hovering');
      });
    });
  }

  /* ==================================================
     9. WEB AUDIO API SYNTHESIZED SOUND EFFECTS
     ================================================== */
  function initAudio() {
    const soundToggle = document.getElementById('sound-toggle');
    if (!soundToggle) return;

    soundToggle.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      soundToggle.classList.toggle('sound-active', state.soundEnabled);

      if (state.soundEnabled) {
        if (!state.audioCtx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          state.audioCtx = new AudioContext();
        }
        if (state.audioCtx.state === 'suspended') {
          state.audioCtx.resume();
        }
        playSfx('whoosh');
      }
    });
  }

  function playSfx(type) {
    if (!state.soundEnabled || !state.audioCtx) return;

    try {
      const ctx = state.audioCtx;
      const now = ctx.currentTime;

      if (type === 'hover') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(720, now + 0.05);

        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'whoosh') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      // Audio fallback
    }
  }

  /* ==================================================
     10. MOBILE NAVIGATION DRAWER
     ================================================== */
  function initMobileMenu() {
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileClose = document.getElementById('mobile-close');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    if (!mobileDrawer) return;

    function toggleMenu(open) {
      mobileDrawer.classList.toggle('open', open);
      if (open) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
      playSfx('click');
    }

    if (mobileToggle) mobileToggle.addEventListener('click', () => toggleMenu(true));
    if (mobileClose) mobileClose.addEventListener('click', () => toggleMenu(false));

    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => toggleMenu(false));
    });
  }

  /* ==================================================
     11. BOOTSTRAP ALL MODULES ON DOM READY
     ================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    initLenis();
    initAmbientCanvas();
    initTimecode();
    initLoader();
    initScrollAnimations();
    initVideoModal();
    initCardVideoPreviews();
    initCustomCursor();
    initAudio();
    initMobileMenu();
  });

})();
