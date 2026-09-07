/* Khomala — static, dependency-free browsing and bilingual presentation. */
(() => {
  'use strict';
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
  const translations = window.KHOMALA_I18N;
  const galleries = window.KHOMALA_GALLERIES;
  const views = $$('.view');
  const menuButton = $('.menu-toggle');
  const menu = $('#main-nav');
  const languageButton = $('#langToggle');
  const communityButton = $('#community-toggle');
  const lightbox = $('#lightbox');
  const lightboxImage = $('#lightbox-image');
  const viewport = $('.lightbox-viewport');
  const closeButton = $('.lightbox-close');
  const zoomButton = $('.lightbox-zoom');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let language = 'en';
  let currentView = 'home';
  let activeGallery = null;
  let activeIndex = 0;
  let returnFocus = null;
  let zoom = 1;
  let communityExpanded = false;
  let lastRoute = null;
  let lastTouchAt = 0;
  let touchStart = null;
  let pinchStart = null;
  let lastTap = null;
  let gestureUsed = false;
  let wasPinching = false;
  const tr = () => translations[language];

  // Preference storage is optional: private browsing still gets a working site.
  try { language = localStorage.getItem('khomalaLanguage') === 'ar' ? 'ar' : 'en'; } catch {}
  $('#year').textContent = new Date().getFullYear();

  function closeMenu(restoreFocus = false) {
    const wasOpen = menu.classList.contains('open');
    menu.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    if (restoreFocus && wasOpen) menuButton.focus();
  }
  menuButton.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.nav-wrap')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !lightbox.open) closeMenu(true);
  });
  document.addEventListener('focusin', event => {
    if (menu.classList.contains('open') && !event.target.closest('.nav-wrap')) closeMenu();
  });
  window.matchMedia('(min-width: 801px)').addEventListener('change', event => {
    if (event.matches) closeMenu();
  });

  function updatePageTitle() {
    document.title = currentView === 'home' ? tr().title : tr()[currentView + 'Eyebrow'] + ' | Khomala';
  }

  function applyLanguage(nextLanguage) {
    language = nextLanguage === 'ar' ? 'ar' : 'en';
    const copy = tr();
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    $$('[data-i18n]').forEach(element => {
      const value = copy[element.dataset.i18n];
      if (typeof value === 'string') element.textContent = value;
    });
    $$('[data-i18n-html]').forEach(element => {
      const value = copy[element.dataset.i18nHtml];
      if (typeof value === 'string') element.innerHTML = value;
    });
    $$('[data-i18n-aria]').forEach(element => element.setAttribute('aria-label', copy[element.dataset.i18nAria]));
    $$('[data-strip]').forEach(element => element.textContent = copy.strip[Number(element.dataset.strip)]);
    $$('[data-service]').forEach(element => {
      const values = copy.services[Number(element.dataset.service)];
      $('h3', element).textContent = values[0];
      $('p', element).textContent = values[1];
    });
    $$('[data-step]').forEach(element => {
      const values = copy.steps[Number(element.dataset.step)];
      $('h3', element).textContent = values[0];
      $('p', element).textContent = values[1];
    });
    $$('[data-gallery-count]').forEach(element => {
      element.textContent = galleries[element.dataset.galleryCount].length + ' ' + copy.galleryCounter;
    });
    $$('.gallery-button').forEach(button => {
      const category = button.dataset.gallery;
      const item = galleries[category][Number(button.dataset.index)];
      const caption = copy[category + 'Card'] + ' — ' + copy.photo + ' ' + item.number;
      button.setAttribute('aria-label', caption);
      $('img', button).alt = caption;
    });
    languageButton.textContent = language === 'ar' ? 'EN' : 'عربي';
    languageButton.lang = language === 'ar' ? 'en' : 'ar';
    languageButton.setAttribute('aria-label', language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');
    $('.nav-wrap').setAttribute('aria-label', language === 'ar' ? 'القائمة الرئيسية' : 'Main navigation');
    $('.brand').setAttribute('aria-label', language === 'ar' ? 'خومالا — الرئيسية' : 'Khomala home');
    $('.hero-photo-link').setAttribute('aria-label', copy.womenEyebrow);
    $('meta[name="description"]').setAttribute('content', copy.description);
    const messages = language === 'ar' ? {
      general: 'مرحباً خومالا، أود طلب أزياء آشورية تقليدية حسب الطلب. هل يمكنكم مشاركة التفاصيل؟',
      men: 'مرحباً خومالا، أنا مهتم بطلب زي آشوري رجالي حسب الطلب. هل يمكنكم مشاركة التفاصيل؟',
      women: 'مرحباً خومالا، أود طلب زي آشوري نسائي حسب الطلب. هل يمكنكم مشاركة التفاصيل؟',
      family: 'مرحباً خومالا، أود طلب أطقم آشورية للعائلة حسب الطلب. هل يمكنكم مشاركة التفاصيل؟'
    } : {
      general: 'Hello Khomala, I am interested in ordering custom Assyrian traditional attire. Can you please share details?',
      men: "Hello Khomala, I am interested in men's custom Assyrian traditional attire. Can you please share details?",
      women: "Hello Khomala, I am interested in women's custom Assyrian traditional attire. Can you please share details?",
      family: 'Hello Khomala, I am interested in a custom Assyrian traditional attire set for my family. Can you please share details?'
    };
    $$('[data-whatsapp]').forEach(link => {
      link.href = 'https://wa.me/9647504919554?text=' + encodeURIComponent(messages[link.dataset.whatsapp]);
    });
    updateCommunityLabel();
    updatePageTitle();
    if (activeGallery) updateLightboxCaption();
    updateZoomLabel();
    try { localStorage.setItem('khomalaLanguage', language); } catch {}
  }
  languageButton.addEventListener('click', () => applyLanguage(language === 'en' ? 'ar' : 'en'));

  function updateCommunityLabel() {
    const label = $('[data-i18n]', communityButton);
    label.dataset.i18n = communityExpanded ? 'lessCommunity' : 'allCommunity';
    label.textContent = tr()[label.dataset.i18n];
    communityButton.setAttribute('aria-expanded', String(communityExpanded));
    $('.community-total').textContent = galleries.community.length;
  }
  communityButton.addEventListener('click', () => {
    communityExpanded = !communityExpanded;
    $$('.gallery-card', $('#gallery-community')).forEach((card, index) => card.hidden = !communityExpanded && index >= 8);
    updateCommunityLabel();
    if (!communityExpanded) {
      requestAnimationFrame(() => communityButton.scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'center'}));
    }
  });

  const homeSections = new Set(['top', 'main', 'categories', 'story', 'services', 'order', 'community-gallery', 'contact']);
  const collectionRoutes = new Set(['men', 'women', 'family']);
  function normalizeRoute(hash) {
    const route = (hash || '#top').replace(/^#/, '') || 'top';
    return collectionRoutes.has(route) || homeSections.has(route) ? route : 'top';
  }
  function navigate(hash, options = {}) {
    const route = normalizeRoute(hash);
    const nextView = collectionRoutes.has(route) ? route : 'home';
    if (lightbox.open) lightbox.close();
    closeMenu();
    if (options.push && location.hash !== '#' + route) {
      history.replaceState({...(history.state || {}), scrollY: window.scrollY}, '', location.href);
      history.pushState({route}, '', '#' + route);
    }
    currentView = nextView;
    views.forEach(view => view.hidden = view.id !== 'view-' + currentView);
    $$('.nav-links [data-route]').forEach(link => {
      if (link.dataset.route === route) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    updatePageTitle();
    const target = currentView === 'home' ? document.getElementById(route) : $('h1', $('#view-' + currentView));
    requestAnimationFrame(() => {
      if (options.focus && target) {
        target.setAttribute('tabindex', '-1');
        target.focus({preventScroll: true});
      }
      if (Number.isFinite(options.restoreY)) window.scrollTo({top: options.restoreY, behavior: 'instant'});
      else if (currentView !== 'home' || route === 'top' || route === 'main') {
        if (!options.initial || route !== 'top') window.scrollTo({top: 0, behavior: 'instant'});
      } else if (target) {
        target.scrollIntoView({behavior: options.initial || reducedMotion.matches ? 'instant' : 'smooth', block: 'start'});
      }
    });
    lastRoute = location.hash;
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(link.getAttribute('href'), {push: true, focus: true});
  });
  try { history.scrollRestoration = 'manual'; } catch {}
  window.addEventListener('popstate', event => navigate(location.hash, {restoreY: event.state?.scrollY}));
  window.addEventListener('hashchange', () => {
    if (location.hash !== lastRoute) navigate(location.hash);
  });

  function updateZoomLabel() {
    const label = zoom > 1 ? tr().zoomOut : tr().zoom;
    zoomButton.setAttribute('aria-label', label);
    zoomButton.title = label;
    zoomButton.setAttribute('aria-pressed', String(zoom > 1));
    $('span', zoomButton).textContent = zoom > 1 ? '−' : '+';
  }
  function setZoom(scale, center = true) {
    zoom = Math.max(1, Math.min(4, scale));
    const enlarged = zoom > 1.01;
    viewport.classList.toggle('zoomed', enlarged);
    if (enlarged && activeGallery) {
      const item = galleries[activeGallery][activeIndex];
      const fitWidth = Math.min(viewport.clientWidth, viewport.clientHeight * item.width / item.height, item.width);
      lightboxImage.style.width = fitWidth * zoom + 'px';
      lightboxImage.style.height = fitWidth * zoom * item.height / item.width + 'px';
      if (center) {
        viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2;
        viewport.scrollTop = (viewport.scrollHeight - viewport.clientHeight) / 2;
      }
    } else {
      lightboxImage.style.removeProperty('width');
      lightboxImage.style.removeProperty('height');
      viewport.scrollLeft = 0;
      viewport.scrollTop = 0;
    }
    updateZoomLabel();
  }
  function updateLightboxCaption() {
    if (!activeGallery) return;
    const item = galleries[activeGallery][activeIndex];
    const caption = tr()[activeGallery + 'Card'] + ' — ' + tr().photo + ' ' + item.number;
    $('#lightbox-caption').textContent = caption;
    $('#lightbox-counter').textContent = (activeIndex + 1) + ' / ' + galleries[activeGallery].length;
    lightboxImage.alt = caption;
  }
  function renderLightbox() {
    const item = galleries[activeGallery][activeIndex];
    setZoom(1);
    lastTap = null;
    lightboxImage.hidden = false;
    $('#lightbox-error').hidden = true;
    lightboxImage.src = item.src;
    updateLightboxCaption();
  }
  function openLightbox(category, index, button) {
    if (!galleries[category]?.[index]) return;
    activeGallery = category;
    activeIndex = index;
    returnFocus = button;
    renderLightbox();
    if (!lightbox.open) lightbox.showModal();
    document.body.classList.add('modal-open');
    closeButton.focus({preventScroll: true});
  }
  function shiftImage(direction) {
    if (!activeGallery) return;
    const total = galleries[activeGallery].length;
    activeIndex = (activeIndex + direction + total) % total;
    renderLightbox();
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('.gallery-button');
    if (button) openLightbox(button.dataset.gallery, Number(button.dataset.index), button);
  });
  closeButton.addEventListener('click', () => lightbox.close());
  $('.lightbox-prev').addEventListener('click', () => shiftImage(-1));
  $('.lightbox-next').addEventListener('click', () => shiftImage(1));
  zoomButton.addEventListener('click', () => setZoom(zoom > 1 ? 1 : 2.5));
  lightbox.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    setZoom(1);
    activeGallery = null;
    if (returnFocus?.isConnected && !returnFocus.closest('[hidden]')) returnFocus.focus({preventScroll: true});
  });
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox || event.target === $('.lightbox-stage') || (event.target === viewport && zoom === 1)) lightbox.close();
  });
  lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      shiftImage(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  lightboxImage.addEventListener('click', () => {
    if (Date.now() - lastTouchAt > 500) setZoom(zoom > 1 ? 1 : 2.5);
  });
  lightboxImage.addEventListener('error', () => {
    lightboxImage.hidden = true;
    $('#lightbox-error').hidden = false;
  });

  // Touch: swipe between photos, double-tap or pinch to zoom, drag to pan.
  viewport.addEventListener('touchstart', event => {
    lastTouchAt = Date.now();
    if (event.touches.length === 1) {
      touchStart = {x:event.touches[0].clientX, y:event.touches[0].clientY};
      gestureUsed = false;
      wasPinching = false;
    } else if (event.touches.length === 2) {
      const [a,b] = event.touches;
      pinchStart = {distance: Math.hypot(b.clientX-a.clientX,b.clientY-a.clientY), scale: zoom};
      gestureUsed = true;
      wasPinching = true;
      event.preventDefault();
    }
  }, {passive:false});
  viewport.addEventListener('touchmove', event => {
    if (event.touches.length === 2 && pinchStart?.distance) {
      const [a,b] = event.touches;
      setZoom(pinchStart.scale * Math.hypot(b.clientX-a.clientX,b.clientY-a.clientY) / pinchStart.distance);
      event.preventDefault();
      gestureUsed = true;
    } else if (event.touches.length === 1 && touchStart) {
      if (Math.hypot(event.touches[0].clientX-touchStart.x,event.touches[0].clientY-touchStart.y) > 12) gestureUsed = true;
    }
  }, {passive:false});
  viewport.addEventListener('touchend', event => {
    lastTouchAt = Date.now();
    if (event.touches.length) return;
    const end = event.changedTouches[0];
    if (!wasPinching && zoom === 1 && touchStart) {
      const dx = end.clientX - touchStart.x;
      const dy = end.clientY - touchStart.y;
      if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        shiftImage(dx < 0 ? 1 : -1);
        gestureUsed = true;
      }
    }
    if (!gestureUsed && event.target === lightboxImage) {
      const now = Date.now();
      if (lastTap && now-lastTap.at < 320 && Math.hypot(end.clientX-lastTap.x,end.clientY-lastTap.y) < 35) {
        setZoom(zoom > 1 ? 1 : 2.5);
        lastTap = null;
        event.preventDefault();
      } else lastTap = {at:now,x:end.clientX,y:end.clientY};
    }
    touchStart = null;
    pinchStart = null;
  }, {passive:false});
  viewport.addEventListener('touchcancel', () => { touchStart = null; pinchStart = null; lastTap = null; });
  window.addEventListener('resize', () => { if (lightbox.open && zoom > 1) setZoom(zoom); });

  // Content remains visible when motion or IntersectionObserver is unavailable.
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    document.body.classList.add('motion-ready');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {threshold:0.06, rootMargin:'0px 0px -24px 0px'});
    $$('.reveal').forEach(element => observer.observe(element));
    reducedMotion.addEventListener('change', event => {
      if (event.matches) {
        observer.disconnect();
        document.body.classList.remove('motion-ready');
      }
    });
  }
  let scrollFrame = false;
  window.addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = true;
    requestAnimationFrame(() => {
      $('.site-header').classList.toggle('scrolled', window.scrollY > 20);
      scrollFrame = false;
    });
  }, {passive:true});
  applyLanguage(language);
  navigate(location.hash, {initial:true});
})();
