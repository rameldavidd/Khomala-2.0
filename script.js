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

/* ---------- Gallery settings ---------- */
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
  const allNumbers = Array.from({ length: settings.count }, (_, i) => i + 1);
  const customOrder = Array.isArray(settings.order) ? settings.order : [];
  const hidden = new Set(Array.isArray(settings.hidden) ? settings.hidden : []);
  const ordered = customOrder.length
    ? [...customOrder, ...allNumbers.filter(n => !customOrder.includes(n))]
    : allNumbers;
  return ordered.filter(n => n >= 1 && n <= settings.count && !hidden.has(n));
}

function createGalleryCard(category, number, settings) {
  const article = document.createElement('article');
  article.className = 'gallery-card';
  article.dataset.category = category;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'gallery-button';
  button.setAttribute('aria-label', 'Open ' + settings.altText + ' ' + number);

  const img = document.createElement('img');
  img.src = settings.folder + '/' + settings.filePrefix + '-' + photoNumber(number) + '.jpg';
  img.alt = settings.altText + ' ' + number;
  img.loading = 'lazy';
  img.addEventListener('error', () => { article.remove(); });

  const span = document.createElement('span');
  span.textContent = settings.label;

  button.appendChild(img);
  button.appendChild(span);
  article.appendChild(button);
  return article;
}

function renderGallery(category) {
  const container = document.getElementById('gallery-' + category);
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

/* ---------- View switching ---------- */
const views = Array.from(document.querySelectorAll('.view'));
const navAnchors = Array.from(document.querySelectorAll('[data-view-link]'));

function showView(name, opts) {
  opts = opts || {};
  const target = document.getElementById('view-' + name);
  if (!target) return;

  views.forEach(function(v) { v.hidden = v !== target; });

  navAnchors.forEach(function(a) {
    a.classList.toggle('active', a.dataset.viewLink === name);
  });

  if (navLinks) navLinks.classList.remove('open');
  if (navToggle) navToggle.setAttribute('aria-expanded', 'false');

  if (!opts.skipScroll) window.scrollTo({ top: 0, behavior: 'auto' });

  if (!opts.skipHistory) {
    const hash = name === 'home' ? '#top' : '#' + name;
    history.pushState({ view: name }, '', hash);
  }

  // Make all cards in this view visible immediately
  target.querySelectorAll('.gallery-card').forEach(function(el) {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });

  observeReveals(target);
  if (opts.instant) {
    target.querySelectorAll('.reveal').forEach(function(el) {
      el.classList.add('visible');
    });
  }
}

navAnchors.forEach(function(a) {
  a.addEventListener('click', function(e) {
    e.preventDefault();
    const name = a.dataset.viewLink;
    showView(name, { instant: true });
    const scrollTo = a.dataset.scrollTo;
    if (scrollTo) {
      requestAnimationFrame(function() {
        const el = document.getElementById(scrollTo);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      });
    }
  });
});

window.addEventListener('popstate', function() {
  const name = (location.hash || '#top').replace('#', '');
  const valid = ['men', 'women', 'family'].includes(name) ? name : 'home';
  showView(valid, { skipHistory: true, instant: true });
});

(function initView() {
  const name = (location.hash || '#top').replace('#', '');
  const valid = ['men', 'women', 'family'].includes(name) ? name : 'home';
  showView(valid, { skipHistory: true, skipScroll: valid === 'home', instant: true });
})();

/* ---------- Lightbox ---------- */
const lightbox = document.querySelector('.lightbox');
const lightboxImg = lightbox.querySelector('img');
const lightboxCaption = lightbox.querySelector('figcaption');
const closeBtn = lightbox.querySelector('.lightbox-close');
const prevBtn = lightbox.querySelector('.lightbox-prev');
const nextBtn = lightbox.querySelector('.lightbox-next');
let activeIndex = 0;
let activeCardList = [];
let zoomScale = 1;

function resetZoom() {
  zoomScale = 1;
  lightboxImg.style.transform = '';
  lightboxImg.style.transformOrigin = 'center center';
  lightboxImg.style.cursor = 'zoom-in';
}

function cardsInCurrentView() {
  const visible = views.find(function(v) { return !v.hidden; });
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
  resetZoom();
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  resetZoom();
}

function shiftLightbox(direction) {
  if (!activeCardList.length) return;
  activeIndex = (activeIndex + direction + activeCardList.length) % activeCardList.length;
  openLightbox(activeIndex, activeCardList);
}

// Open lightbox when any gallery photo is clicked
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.gallery-button');
  if (!btn) return;
  const card = btn.closest('.gallery-card');
  const list = cardsInCurrentView();
  const index = list.indexOf(card);
  if (index > -1) openLightbox(index, list);
});

closeBtn.addEventListener('click', closeLightbox);
prevBtn.addEventListener('click', function() { resetZoom(); shiftLightbox(-1); });
nextBtn.addEventListener('click', function() { resetZoom(); shiftLightbox(1); });
lightbox.addEventListener('click', function(e) { if (e.target === lightbox) closeLightbox(); });

document.addEventListener('keydown', function(e) {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') { resetZoom(); shiftLightbox(-1); }
  if (e.key === 'ArrowRight') { resetZoom(); shiftLightbox(1); }
});

/* ---------- Zoom: click on desktop, pinch + double-tap on mobile ---------- */
lightboxImg.addEventListener('click', function(e) {
  e.stopPropagation();
  const rect = lightboxImg.getBoundingClientRect();
  const ox = ((e.clientX - rect.left) / rect.width) * 100;
  const oy = ((e.clientY - rect.top) / rect.height) * 100;
  if (zoomScale > 1) {
    resetZoom();
  } else {
    zoomScale = 2.5;
    lightboxImg.style.transformOrigin = ox + '% ' + oy + '%';
    lightboxImg.style.transform = 'scale(2.5)';
    lightboxImg.style.cursor = 'zoom-out';
  }
});

// Pinch to zoom
var pinchStartDist = 0;
var pinchStartScale = 1;
lightboxImg.addEventListener('touchstart', function(e) {
  if (e.touches.length === 2) {
    pinchStartDist = Math.hypot(
      e.touches[1].clientX - e.touches[0].clientX,
      e.touches[1].clientY - e.touches[0].clientY
    );
    pinchStartScale = zoomScale;
    e.preventDefault();
  }
}, { passive: false });

lightboxImg.addEventListener('touchmove', function(e) {
  if (e.touches.length === 2) {
    const dist = Math.hypot(
      e.touches[1].clientX - e.touches[0].clientX,
      e.touches[1].clientY - e.touches[0].clientY
    );
    const newScale = Math.min(Math.max(pinchStartScale * (dist / pinchStartDist), 1), 4);
    const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    const rect = lightboxImg.getBoundingClientRect();
    const ox = ((midX - rect.left) / rect.width) * 100;
    const oy = ((midY - rect.top) / rect.height) * 100;
    zoomScale = newScale;
    lightboxImg.style.transformOrigin = ox + '% ' + oy + '%';
    lightboxImg.style.transform = 'scale(' + newScale + ')';
    lightboxImg.style.cursor = newScale > 1 ? 'zoom-out' : 'zoom-in';
    e.preventDefault();
  }
}, { passive: false });

// Double-tap to zoom on mobile
var lastTap = 0;
lightboxImg.addEventListener('touchend', function(e) {
  const now = Date.now();
  if (now - lastTap < 300) {
    const touch = e.changedTouches[0];
    const rect = lightboxImg.getBoundingClientRect();
    const ox = ((touch.clientX - rect.left) / rect.width) * 100;
    const oy = ((touch.clientY - rect.top) / rect.height) * 100;
    if (zoomScale > 1) {
      resetZoom();
    } else {
      zoomScale = 2.5;
      lightboxImg.style.transformOrigin = ox + '% ' + oy + '%';
      lightboxImg.style.transform = 'scale(2.5)';
      lightboxImg.style.cursor = 'zoom-out';
    }
    e.preventDefault();
  }
  lastTap = now;
});

/* ---------- Scroll reveal (sections only, not photos) ---------- */
var revealObserver = null;
function observeReveals(scope) {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
  }
  const items = scope.querySelectorAll('section, .service-grid article, .category-tile');
  items.forEach(function(item) {
    if (!item.classList.contains('reveal')) item.classList.add('reveal');
    if (!item.classList.contains('visible')) revealObserver.observe(item);
  });
}
observeReveals(document.getElementById('view-home'));
