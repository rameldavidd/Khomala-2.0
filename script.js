/* ---------- Mobile menu ---------- */
const navToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

document.getElementById('year').textContent = new Date().getFullYear();


/* ---------- Easy gallery manager ----------
   CHANGE PHOTOS FROM HERE ONLY.

   How to add photos:
   1) Upload the photo to the correct GitHub folder.
   2) Name it exactly like women-look-59.jpg or community-shared-42.jpg.
   3) Increase the count number below.

   How to change order:
   Put photo numbers inside the order list. Example:
   women: [58, 1, 2, 3]
   This makes 58 show first, then 1, 2, 3, then the rest.

   How to hide/delete from website:
   Add the number to hidden. Example: women: [12, 19]
*/
const gallerySettings = {
  men: {
    count: 22,
    folder: 'assets/images/men',
    filePrefix: 'men-look',
    label: "Men's Khomala",
    altText: "Khomala men's traditional Assyrian attire",
    order: [],
    hidden: []
  },
  women: {
    count: 58,
    folder: 'assets/images/women',
    filePrefix: 'women-look',
    label: "Women's Khomala",
    altText: "Khomala women's traditional Assyrian attire",
    order: [1, 2, 58, 57],
    hidden: []
  },
  family: {
    count: 18,
    folder: 'assets/images/family',
    filePrefix: 'family-look',
    label: 'Family Khomala',
    altText: 'Khomala family traditional Assyrian attire',
    order: [],
    hidden: []
  },
  community: {
    count: 41,
    folder: 'assets/images/community',
    filePrefix: 'community-shared',
    label: 'Community Shared Photo',
    altText: 'Khomala community shared photo',
    order: [],
    hidden: []
  }
};

function photoNumber(number) {
  return String(number).padStart(2, '0');
}

function getGalleryNumbers(settings) {
  const allNumbers = Array.from({ length: settings.count }, (_, index) => index + 1);
  const customOrder = Array.isArray(settings.order) ? settings.order : [];
  const hidden = new Set(Array.isArray(settings.hidden) ? settings.hidden : []);

  const ordered = customOrder.length
    ? [...customOrder, ...allNumbers.filter(number => !customOrder.includes(number))]
    : allNumbers;

  return ordered.filter(number => number >= 1 && number <= settings.count && !hidden.has(number));
}

function createGalleryCard(category, number, settings) {
  const article = document.createElement('article');
  article.className = 'gallery-card';
  article.dataset.category = category;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'gallery-button';
  button.setAttribute('aria-label', `Open ${settings.altText} ${number}`);

  const img = document.createElement('img');
  img.src = `${settings.folder}/${settings.filePrefix}-${photoNumber(number)}.jpg`;
  img.alt = `${settings.altText} ${number}`;
  img.loading = 'lazy';

  // If a photo file is missing, remove the broken card instead of showing a broken image icon.
  img.addEventListener('error', () => {
    article.remove();
  });

  const span = document.createElement('span');
  span.textContent = settings.label;

  button.appendChild(img);
  button.appendChild(span);
  article.appendChild(button);
  return article;
}

function renderGallery(category) {
  const container = document.getElementById(`gallery-${category}`);
  const settings = gallerySettings[category];
  if (!container || !settings) return;

  container.innerHTML = '';
  const fragment = document.createDocumentFragment();
  getGalleryNumbers(settings).forEach(number => {
    fragment.appendChild(createGalleryCard(category, number, settings));
  });
  container.appendChild(fragment);
}

function renderAllGalleries() {
  Object.keys(gallerySettings).forEach(renderGallery);
}

renderAllGalleries();

/* ---------- View switching (Home / Men / Women / Family) ----------
   The site stays a single HTML file (fast initial load, no extra
   page requests) but behaves like separate pages: only one .view
   is visible at a time, and navigating updates the URL hash so the
   back button and direct links (#men, #women, #family) still work. */
const views = Array.from(document.querySelectorAll('.view'));
const navAnchors = Array.from(document.querySelectorAll('[data-view-link]'));

function showView(name, opts = {}) {
  const target = document.getElementById(`view-${name}`);
  if (!target) return;

  views.forEach(v => {
    const isTarget = v === target;
    v.hidden = !isTarget;
  });

  navAnchors.forEach(a => {
    a.classList.toggle('active', a.dataset.viewLink === name);
  });

  navLinks && navLinks.classList.remove('open');
  navToggle && navToggle.setAttribute('aria-expanded', 'false');

  if (!opts.skipScroll) {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  if (!opts.skipHistory) {
    const hash = name === 'home' ? '#top' : `#${name}`;
    history.pushState({ view: name }, '', hash);
  }

  // When switching views, show content immediately rather than relying
  // on scroll-triggered fade-in — this avoids any chance of a category
  // page appearing blank on a fast tap-through or a direct first load
  // of a #men / #women / #family link.
  observeReveals(target);
  if (opts.instant) {
    target.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }
}

navAnchors.forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const name = a.dataset.viewLink;
    showView(name, { instant: true });
    const scrollTo = a.dataset.scrollTo;
    if (scrollTo) {
      // Wait one frame so the view is visible before measuring scroll position
      requestAnimationFrame(() => {
        const el = document.getElementById(scrollTo);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      });
    }
  });
});

window.addEventListener('popstate', () => {
  const name = (location.hash || '#top').replace('#', '');
  const valid = ['men', 'women', 'family'].includes(name) ? name : 'home';
  showView(valid, { skipHistory: true, instant: true });
});

// Initial view based on URL hash (so #men etc. work on direct load/share).
// Category views shown directly via URL also get "instant" so they never
// depend on scroll position to become visible.
(function initView() {
  const name = (location.hash || '#top').replace('#', '');
  const valid = ['men', 'women', 'family'].includes(name) ? name : 'home';
  showView(valid, { skipHistory: true, skipScroll: valid === 'home', instant: valid !== 'home' });
})();

/* ---------- Lightbox (scoped to the currently visible gallery) ---------- */
const lightbox = document.querySelector('.lightbox');
const lightboxImg = lightbox.querySelector('img');
const lightboxCaption = lightbox.querySelector('figcaption');
const closeBtn = lightbox.querySelector('.lightbox-close');
const prevBtn = lightbox.querySelector('.lightbox-prev');
const nextBtn = lightbox.querySelector('.lightbox-next');
let activeIndex = 0;
let activeCardList = [];

function cardsInCurrentView() {
  const visible = views.find(v => !v.hidden);
  if (!visible) return [];
  return Array.from(visible.querySelectorAll('.gallery-card'));
}

function openLightbox(index, list) {
  activeCardList = list;
  activeIndex = index;
  const card = activeCardList[activeIndex];
  if (!card) return;
  const img = card.querySelector('img');
  lightboxImg.src = img.src;
  lightboxImg.alt = img.alt;
  lightboxCaption.textContent = card.querySelector('span').textContent;
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
function shiftLightbox(direction) {
  if (!activeCardList.length) return;
  activeIndex = (activeIndex + direction + activeCardList.length) % activeCardList.length;
  openLightbox(activeIndex, activeCardList);
}

// Delegate click handling so it works for galleries in every view,
// including ones not yet shown at page load.
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.gallery-button');
  if (!btn) return;
  const card = btn.closest('.gallery-card');
  const list = cardsInCurrentView();
  const index = list.indexOf(card);
  if (index > -1) openLightbox(index, list);
});

closeBtn.addEventListener('click', closeLightbox);
prevBtn.addEventListener('click', () => shiftLightbox(-1));
nextBtn.addEventListener('click', () => shiftLightbox(1));
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') shiftLightbox(-1);
  if (e.key === 'ArrowRight') shiftLightbox(1);
});

/* ---------- Scroll reveal ---------- */
let revealObserver = null;
function observeReveals(scope) {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .08 });
  }
  const items = scope.querySelectorAll('section, .service-grid article, .category-tile, .gallery-card');
  items.forEach(item => {
    if (!item.classList.contains('reveal')) item.classList.add('reveal');
    if (!item.classList.contains('visible')) revealObserver.observe(item);
  });
}
observeReveals(document.getElementById('view-home'));
