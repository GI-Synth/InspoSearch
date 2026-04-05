# Mobile Testing Checklist

Open `http://localhost:8080` in Chrome DevTools mobile simulator (iPhone 14 / 390×844) or a real device.

---

## 1. Viewport & Layout
- [ ] No white bar at bottom on iOS Safari (dvh units working)
- [ ] App fills full screen — no overflow/scroll on the body
- [ ] Hamburger menu button visible top-left
- [ ] Hamburger button not clipped by notch (safe-area offset)

## 2. Sidebar
- [ ] Tap hamburger → sidebar slides in (85vw, max 320px)
- [ ] Backdrop darkens behind sidebar
- [ ] Tap backdrop → sidebar closes
- [ ] **Swipe left** on sidebar → closes it
- [ ] Typing a search + pressing Enter closes sidebar

## 3. Hover Elements (Touch)
- [ ] Image cards show **source badge** always (no hover needed)
- [ ] Image cards show **zoom button** always visible
- [ ] Zoom button is large enough to tap (16px font, 6px padding)

## 4. Image Grid
- [ ] Grid columns are ~140px wide (auto-fill)
- [ ] Scrolling is smooth, no rubber-band bounce at edges (overscroll contained)

## 5. Onboarding
- [ ] Open onboarding (tap `?` help button)
- [ ] **Swipe left** → goes to next slide
- [ ] **Swipe right** → goes to previous slide
- [ ] Onboarding modal doesn't overflow bottom of screen
- [ ] Arrow buttons are large enough to tap (44px)
- [ ] Dots are large enough to tap (28px)

## 6. Search Input
- [ ] Tapping search input does NOT trigger autocorrect
- [ ] Tapping search input does NOT auto-capitalize
- [ ] iOS keyboard shows "search" on return key (enterkeyhint)

## 7. Concept Panel
- [ ] Tap an image to select → panel slides in full-width
- [ ] Panel scrolls independently, doesn't bounce the page behind it
- [ ] Color dots: **tap and hold** shows tooltip with hex value
- [ ] Concept pills (if visible) scroll horizontally, not wrap

## 8. Board View
- [ ] Open board overlay → fills entire screen on mobile
- [ ] **Touch-drag** a card → repositions smoothly
- [ ] **Touch-drag** resize handle (bottom-right corner) → resizes card
- [ ] Resize handle is visible without hover (20×20px, slightly transparent)
- [ ] Card title overlay is visible without hover
- [ ] Delete button (×) is visible without hover, large enough to tap (28×28)
- [ ] Board overlay header: **touch-drag** moves the overlay (desktop only — fullscreen on mobile)

## 9. AI Chat Panel
- [ ] Chat panel opens full-width on mobile
- [ ] Chat textarea keyboard shows "send" as return key
- [ ] Chat starters are at least 44px tall
- [ ] Chat pills are at least 36px tall
- [ ] Font sizes are readable (≥11px for small labels)

## 10. Floating Bar & Toast
- [ ] Select images → floating bar appears, wraps nicely
- [ ] Floating bar not hidden behind home indicator (safe-area)
- [ ] Toast notifications appear above home indicator

## 11. OSD (Full Image Viewer)
- [ ] Tap zoom on a card → OSD opens fullscreen (100vw × 100dvh)
- [ ] Close button is offset from notch (safe-area-inset-top)
- [ ] Close button is large enough to tap (32px)

## 12. Keys & Settings Panels
- [ ] Open keys panel → 85vw wide, max 320px
- [ ] Open settings panel → 85vw wide, max 320px
- [ ] Both panels scroll independently (overscroll contained)

---

**Device targets:** iPhone SE (375×667), iPhone 14 (390×844), Pixel 7 (412×915), iPad Mini (768×1024 — should use desktop layout)
