# DESIGN_SYSTEM.md — InpoSearch

## Design Philosophy

The interface is a blank studio wall. Images do all the visual work. The UI should be almost invisible — felt but not seen. Every pixel of chrome competes with the images. Lose that competition deliberately.

Influences: 032c magazine digital, Cactus studio, AnOther Magazine online. Not a tech product. A creative instrument.

---

## Typography

```css
--font-ui:      'DM Mono', monospace;       /* all UI labels, inputs, tags, buttons */
--font-display: 'Cormorant Garamond', serif; /* headings, logo, empty states */
```

### Usage Rules
- **DM Mono** — weight 300 for all body/label text, weight 400 for active/selected states
- **Cormorant Garamond** — weight 300 italic for the logo, weight 400 for section headings
- Font sizes: 10px (badges), 11px (labels/tags), 12px (body), 13px (input), 22px (logo), 18px (empty state)
- Letter spacing: `0.08em` on all DM Mono uppercase labels
- Line height: 1.6 for all body, 1.2 for headings
- Never use bold (font-weight > 400) except on selected/active states (400 = "bold" in this system)

---

## Color Tokens

```css
/* Light mode (default) */
--bg:           #F7F5F2;   /* page background — warm off-white */
--bg-panel:     #F2F0ED;   /* sidebar + right panel background */
--bg-card:      #EEECEA;   /* image card hover background */
--ink:          #1A1A18;   /* primary text */
--ink-2:        #6B6960;   /* secondary text, labels */
--ink-3:        #B0ADA6;   /* placeholder, disabled */
--accent:       #C8B89A;   /* warm sand — selection borders, active states, highlights */
--line:         rgba(26,26,24,0.08);  /* hairline borders */
--line-strong:  rgba(26,26,24,0.16); /* stronger dividers */

/* Dark mode */
--bg:           #0E0E0D;
--bg-panel:     #141413;
--bg-card:      #1C1C1A;
--ink:          #E8E6E1;
--ink-2:        #7A7870;
--ink-3:        #3A3935;
--accent:       #C8B89A;   /* accent stays same in both modes */
--line:         rgba(232,230,225,0.07);
--line-strong:  rgba(232,230,225,0.14);
```

Apply dark mode via:
```css
@media (prefers-color-scheme: dark) { :root { /* dark tokens */ } }
body.dark { /* same dark tokens — for manual toggle */ }
```

---

## Spacing Scale

Base unit: 4px. Use only these values:

```
4px   — xs  (tag padding, tiny gaps)
8px   — sm  (between related elements)
12px  — md  (standard padding)
16px  — lg  (section gaps)
24px  — xl  (major section padding)
32px  — 2xl (panel internal padding)
48px  — 3xl (large empty space)
```

---

## Layout

```css
#app {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--bg);
}

#sidebar {
  width: 240px;
  flex-shrink: 0;
  height: 100vh;
  overflow-y: auto;
  background: var(--bg-panel);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  gap: 24px;
}

#canvas {
  flex: 1;
  height: 100vh;
  overflow-y: auto;
  position: relative;
}

#panel {
  width: 280px;
  flex-shrink: 0;
  height: 100vh;
  overflow-y: auto;
  background: var(--bg-panel);
  border-left: 1px solid var(--line);
  padding: 24px 20px;
  transform: translateX(100%);
  transition: transform 0.4s ease;
}

#panel.open {
  transform: translateX(0);
}
```

---

## Component Library

### Logo
```css
.logo {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 300;
  font-style: italic;
  color: var(--ink);
  letter-spacing: 0.02em;
}
```
HTML: `<span class="logo">insposearch</span>`

### Search Input
```css
.search-input {
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 300;
  color: var(--ink);
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--line-strong);
  width: 100%;
  padding: 8px 0;
  outline: none;
  caret-color: var(--accent);
}
.search-input::placeholder { color: var(--ink-3); }
.search-input:focus { border-bottom-color: var(--accent); }
```

### Tag Pill
```css
.tag {
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 300;
  letter-spacing: 0.08em;
  text-transform: lowercase;
  color: var(--ink-2);
  background: transparent;
  border: 1px solid var(--line-strong);
  padding: 3px 8px;
  cursor: pointer;
  transition: opacity 0.3s ease;
  white-space: nowrap;
}
.tag:hover { opacity: 0.5; }
.tag.active {
  color: var(--ink);
  border-color: var(--accent);
  font-weight: 400;
}
.tag.ai {
  border-style: dashed;
  color: var(--accent);
}
```
No border-radius on tags. Square corners only.

### UI Button (view toggles, controls)
```css
.btn {
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 300;
  letter-spacing: 0.1em;
  text-transform: lowercase;
  color: var(--ink-2);
  background: transparent;
  border: 1px solid var(--line);
  padding: 6px 12px;
  cursor: pointer;
  transition: opacity 0.3s ease;
  width: 100%;
  text-align: left;
}
.btn:hover { opacity: 0.5; }
.btn.active {
  color: var(--ink);
  border-color: var(--line-strong);
  font-weight: 400;
}
```

### Section Label
```css
.section-label {
  font-family: var(--font-ui);
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 8px;
}
```

### Slider
```css
.slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 1px;
  background: var(--line-strong);
  outline: none;
  cursor: pointer;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 10px;
  height: 10px;
  background: var(--ink);
  cursor: pointer;
  border-radius: 0; /* square thumb */
}
```

### Divider
```css
.divider {
  width: 100%;
  height: 1px;
  background: var(--line);
}
```

### Color Swatch
```css
.swatch {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  /* no border-radius */
}
```
Swatches displayed in a flex row, gap 4px.

---

## Image Card

```css
.image-card {
  position: relative;
  overflow: hidden;
  background: var(--bg-card);
  cursor: pointer;
  aspect-ratio: 1; /* default, overridden in board view */
}

.image-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.image-card img.loaded { opacity: 1; }

.image-card.selected {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.image-card .source-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  font-family: var(--font-ui);
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: lowercase;
  color: var(--bg);
  background: rgba(26,26,24,0.6);
  padding: 2px 6px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-card:hover .source-badge { opacity: 1; }
```

Images in sketch mode:
```css
#canvas.sketch .image-card img {
  filter: grayscale(1) contrast(1.4) brightness(1.1);
  transition: filter 0.5s ease, opacity 0.4s ease;
}
```

---

## Image Grid

```css
#image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 2px;
  padding: 2px;
}
```

---

## Empty State

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: var(--ink-3);
}

.empty-state p {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 300;
  font-style: italic;
}

.empty-state span {
  font-family: var(--font-ui);
  font-size: 10px;
  letter-spacing: 0.1em;
}
```

---

## Loading State

No spinners. Use a subtle text indicator in the sidebar:

```css
.loading-indicator {
  font-family: var(--font-ui);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--ink-3);
  animation: pulse 1.5s ease infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
```
Text content: `"searching..."` while loading, `""` when done.

---

## Panel — Related Search Link

```css
.related-link {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 300;
  color: var(--ink-2);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  border-bottom: 1px solid var(--line);
  transition: opacity 0.3s ease;
}
.related-link:hover { opacity: 0.5; }
.related-link::before { content: '→'; color: var(--accent); }
```

---

## Dark Mode Toggle

Small button, top of sidebar, right-aligned:
```css
.theme-toggle {
  font-family: var(--font-ui);
  font-size: 9px;
  letter-spacing: 0.1em;
  color: var(--ink-3);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: opacity 0.3s ease;
}
.theme-toggle:hover { opacity: 0.5; }
```
Text: `"light"` in dark mode, `"dark"` in light mode.

---

## Transitions — Master Reference

```
opacity changes:     0.3s ease
panel slide:         0.4s ease
image fade-in:       0.4s ease
sketch mode filter:  0.5s ease
view switches:       fade out 200ms → switch → fade in 200ms
Three.js camera:     lerp 0.05 per frame (smooth)
```

No transform transitions except `#panel`. Nothing bounces. Nothing springs. All motion is slow and deliberate.

---

## Scrollbars

```css
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: var(--line-strong);
  border-radius: 0;
}
```

---

## Selection Reset

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
}

a { color: inherit; text-decoration: none; }
button { cursor: pointer; }
input, button { font-family: var(--font-ui); }
img { display: block; max-width: 100%; }
```
