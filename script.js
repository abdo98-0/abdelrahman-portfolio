const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-navigation');
const themeButton = document.querySelector('.theme-toggle');
const themeLabel = themeButton.querySelector('.theme-toggle-label');
const themeIcon = themeButton.querySelector('.theme-toggle-icon');
const themeMeta = document.querySelector('meta[name="theme-color"]');

let savedTheme = 'dark';
try {
  const storedTheme = localStorage.getItem('portfolio-theme');
  if (storedTheme === 'light' || storedTheme === 'dark') savedTheme = storedTheme;
} catch (_) {
  // Keep the default night theme when browser storage is unavailable.
}

function setTheme(theme, persist = false) {
  const isNight = theme === 'dark';
  document.documentElement.dataset.theme = isNight ? 'dark' : 'light';
  themeButton.setAttribute('aria-pressed', String(isNight));
  themeButton.setAttribute('aria-label', isNight ? 'Switch to day mode' : 'Switch to night mode');
  themeLabel.textContent = isNight ? 'NIGHT MODE' : 'DAY MODE';
  themeIcon.textContent = isNight ? '☾' : '☀';
  themeMeta.setAttribute('content', isNight ? '#080b12' : '#f4f7fc');
  if (persist) {
    try { localStorage.setItem('portfolio-theme', isNight ? 'dark' : 'light'); } catch (_) {}
  }
}

setTheme(savedTheme);

async function transitionTheme(nextTheme) {
  const reduceThemeMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceThemeMotion || !document.body.animate) {
    setTheme(nextTheme, true);
    return;
  }

  themeButton.disabled = true;
  const curtain = document.createElement('div');
  curtain.className = 'theme-curtain';
  curtain.dataset.theme = nextTheme;
  curtain.setAttribute('aria-hidden', 'true');
  document.body.append(curtain);

  try {
    await curtain.animate(
      [{ transform: 'translateX(101%)' }, { transform: 'translateX(0)' }],
      { duration: 520, easing: 'cubic-bezier(.76, 0, .24, 1)', fill: 'forwards' }
    ).finished;
    setTheme(nextTheme, true);
    await curtain.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-101%)' }],
      { duration: 560, easing: 'cubic-bezier(.76, 0, .24, 1)', fill: 'forwards' }
    ).finished;
  } finally {
    curtain.remove();
    themeButton.disabled = false;
  }
}

themeButton.addEventListener('click', () => {
  transitionTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
  navigation.classList.remove('is-open');
});

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
  navigation.classList.toggle('is-open', !isOpen);
});

navigation.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    navigation.classList.remove('is-open');
  });
});

document.querySelector('#year').textContent = new Date().getFullYear();

const cashierProjectCard = document.querySelector('.cashier-project-card');
const cashierGallery = document.querySelector('#cashier-gallery');
const cashierGalleryToggle = document.querySelector('.cashier-gallery-toggle');
const cashierGalleryToggleLabel = cashierGalleryToggle.querySelector('span:first-child');
const cashierGalleryToggleIcon = cashierGalleryToggle.querySelector('b');
const reduceGalleryMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let cashierGalleryAnimating = false;

async function setCashierGalleryOpen(open) {
  if (cashierGalleryAnimating || cashierGallery.hidden === !open) return;
  cashierGalleryAnimating = true;
  cashierGalleryToggle.disabled = true;
  cashierGalleryToggle.setAttribute('aria-expanded', String(open));
  cashierGalleryToggleLabel.textContent = open ? 'HIDE PROJECT SCREENS' : 'EXPLORE PROJECT SCREENS';
  cashierGalleryToggleIcon.textContent = open ? '−' : '+';
  cashierProjectCard.classList.toggle('is-gallery-open', open);

  if (open) cashierGallery.hidden = false;
  if (!reduceGalleryMotion && cashierGallery.animate) {
    const keyframes = open
      ? [
          { opacity: 0, clipPath: 'inset(0 0 92% 0 round 8px)', transform: 'translateY(-14px)' },
          { opacity: 1, clipPath: 'inset(0 0 0 0 round 8px)', transform: 'translateY(0)' }
        ]
      : [
          { opacity: 1, clipPath: 'inset(0 0 0 0 round 8px)', transform: 'translateY(0)' },
          { opacity: 0, clipPath: 'inset(0 0 92% 0 round 8px)', transform: 'translateY(-10px)' }
        ];
    const panelAnimation = cashierGallery.animate(keyframes, {
      duration: open ? 520 : 360,
      easing: open ? 'cubic-bezier(.2,.8,.2,1)' : 'cubic-bezier(.4,0,1,1)',
      fill: 'forwards'
    });
    if (open) {
      cashierGallery.querySelectorAll('.cashier-gallery-card').forEach((card, index) => {
        card.animate(
          [{ opacity: 0, transform: 'translateY(16px) scale(.985)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }],
          { duration: 360, delay: 90 + index * 34, easing: 'cubic-bezier(.2,.8,.2,1)' }
        );
      });
    }
    try { await panelAnimation.finished; } catch (_) {}
  }

  if (!open) cashierGallery.hidden = true;
  cashierGalleryToggle.disabled = false;
  cashierGalleryAnimating = false;
}

cashierGalleryToggle.addEventListener('click', () => setCashierGalleryOpen(cashierGallery.hidden));
cashierProjectCard.addEventListener('click', (event) => {
  if (event.target.closest('button, a, .cashier-gallery')) return;
  setCashierGalleryOpen(cashierGallery.hidden);
});

const galleryShots = Array.from(document.querySelectorAll('.cashier-shot'));
const galleryDialog = document.querySelector('#cashier-lightbox');
const galleryImage = galleryDialog.querySelector('.lightbox-image');
const galleryTitle = galleryDialog.querySelector('#lightbox-title');
const galleryDescription = galleryDialog.querySelector('.lightbox-description');
const galleryCount = galleryDialog.querySelector('.lightbox-count');
let currentGalleryShot = 0;
let galleryDialogClosing = false;

function showGalleryShot(index) {
  currentGalleryShot = (index + galleryShots.length) % galleryShots.length;
  const shot = galleryShots[currentGalleryShot];
  const image = shot.querySelector('img');
  galleryImage.src = image.src;
  galleryImage.alt = image.alt;
  galleryTitle.textContent = shot.dataset.title;
  galleryDescription.textContent = shot.dataset.description;
  galleryCount.textContent = `${String(currentGalleryShot + 1).padStart(2, '0')} / ${String(galleryShots.length).padStart(2, '0')}`;
  if (!reduceGalleryMotion && galleryImage.animate) {
    galleryImage.animate(
      [{ opacity: .25, transform: 'scale(.975)', filter: 'blur(7px)' }, { opacity: 1, transform: 'scale(1)', filter: 'blur(0)' }],
      { duration: 390, easing: 'cubic-bezier(.2,.75,.25,1)' }
    );
  }
}

async function closeGalleryDialog() {
  if (galleryDialogClosing || !galleryDialog.open) return;
  galleryDialogClosing = true;
  if (!reduceGalleryMotion && galleryDialog.animate) {
    try {
      await galleryDialog.animate(
        [{ opacity: 1, transform: 'translateY(0) scale(1)' }, { opacity: 0, transform: 'translateY(10px) scale(.97)' }],
        { duration: 190, easing: 'cubic-bezier(.4,0,1,1)' }
      ).finished;
    } catch (_) {}
  }
  galleryDialog.close();
  galleryDialogClosing = false;
}

galleryShots.forEach((shot, index) => {
  shot.addEventListener('click', () => {
    showGalleryShot(index);
    galleryDialog.showModal();
  });
});

galleryDialog.querySelector('.lightbox-close').addEventListener('click', closeGalleryDialog);
galleryDialog.querySelector('.lightbox-previous').addEventListener('click', () => showGalleryShot(currentGalleryShot - 1));
galleryDialog.querySelector('.lightbox-next').addEventListener('click', () => showGalleryShot(currentGalleryShot + 1));
galleryDialog.addEventListener('click', (event) => {
  if (event.target === galleryDialog) closeGalleryDialog();
});
galleryDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeGalleryDialog();
});
galleryDialog.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') showGalleryShot(currentGalleryShot - 1);
  if (event.key === 'ArrowRight') showGalleryShot(currentGalleryShot + 1);
});

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion && 'IntersectionObserver' in window) {
  const revealTargets = document.querySelectorAll(
    '.content-section .section-heading, .about-lead, .interest-card, .project-card, .project-note, .cashier-gallery-card, .contact-inner > div:first-child'
  );

  document.querySelectorAll('.interest-grid .interest-card, .project-list .project-card, .cashier-gallery-card')
    .forEach((card, index) => card.style.setProperty('--reveal-delay', `${(index % 4) * 90}ms`));

  document.documentElement.classList.add('scroll-reveal-enabled');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

  revealTargets.forEach((target) => {
    target.classList.add('reveal-on-scroll');
    revealObserver.observe(target);
  });
}
