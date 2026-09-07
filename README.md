# Khomala — Modern Assyrian Attire Website

A complete static redesign preserving Khomala’s photography, Assyrian star and logo, founders’ story, services, English/Arabic content, collections and WhatsApp ordering.

## Website files

The complete website is at the root of this ZIP. Extract it, then open `index.html` to view the site, or upload all extracted files and the `assets` folder to your static website host. There is no package installation or build step.

- `index.html`: Home, women’s, men’s and family views, and all gallery photos.
- `styles.css`: Responsive burgundy/gold design, native RTL layout and reduced-motion styles.
- `script.js`: Navigation, language preference, photo viewer, zoom and mobile gestures.
- `translations.js`: English and Arabic content.
- `gallery-data.js`: Original photo filenames, order and dimensions.
- `assets/`: Original photographs, logo and Assyrian-star artwork, unchanged.

The galleries preserve 58 women’s photos, 22 men’s photos, 17 available family photos, and 41 community photos. The original archive referenced a nonexistent eighteenth family photo; only actual supplied files are displayed.

## Behavior

Collection links remain shareable as `#women`, `#men`, and `#family`. Home sections also support direct links. The back and forward buttons restore the selected view. Language selection is remembered on the visitor’s device when storage is available.

The photo viewer supports keyboard arrows, Escape, mouse zoom, a zoom button, touch swipes, pinch zoom, and double-tap zoom. It uses a native modal dialog to contain focus and restores focus when closed.

The home community section initially shows eight photographs; visitors can reveal all 41 or explore the full set in the viewer. No photo has been removed.

Orders continue through WhatsApp at +964 750 491 9554. Each collection prefills a relevant message in the selected language. Instagram remains @khomala_22. No payment or checkout has been added.

## Fonts

The website requests Cormorant Garamond, DM Sans and Noto Sans Arabic from Google Fonts, with local serif and sans-serif fallbacks when unavailable.

## Validation

JavaScript syntax, local asset references, section and collection routes, bilingual text keys, gallery counts, and preservation of all original asset bytes were checked. No browser-based visual or end-to-end testing was performed.
