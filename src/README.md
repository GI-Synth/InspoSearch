# src/ — Modular Architecture (Migration in Progress)

The monolithic `insposearch/app.js` is being incrementally split into ES modules.
`build.js` (esbuild) bundles `src/main.js` → `insposearch/app.js`.

## Planned Module Structure

```
src/
  main.js            ← entry point (imports all modules)
  state.js           ← STATE object, constants, config
  sources/
    manifest.js      ← source list, adapters registry
    adapters/        ← per-source fetch + normalize functions 
  ui/
    grid.js          ← renderGrid, clearGrid, lazy observer
    sidebar.js       ← sidebar toggle, search input, filters
    lightbox.js      ← zoom modal, OpenSeadragon
    board.js         ← board view, canvas, templates
    compare.js       ← side-by-side comparison
    floating-bar.js  ← selection bar
  search/
    engine.js        ← runSearch, fetchAll, getDisplayResults
    keywords.js      ← expandKeywords, Datamuse
    history.js       ← search history
    filters.js       ← date, aspect, color, negative filters
  features/
    discover.js      ← discover landing page
    taxonomy.js      ← browse by movement/genre/period
    stories.js       ← editorial stories
    artist.js        ← artist entity pages
    similarity.js    ← "more like this"
    color-palette.js ← hex color palette search
    tour.js          ← onboarding tour
    pwa.js           ← PWA install prompt
    seo.js           ← dynamic title/meta updates
  utils/
    color.js         ← color extraction, delta-E, classify
    dom.js           ← DOM helpers
    fetch.js         ← fetch with timeout, retry logic
```

## Migration Strategy

1. Extract one module at a time (start with utils, then features, then core)
2. Each extracted module exports its public API
3. `main.js` imports and wires everything together
4. Run `npm run build` — output must match current behavior exactly
5. Test in browser after each extraction
