# Contributing to InspoSearch

Thank you for your interest in contributing. InspoSearch is an open-source visual research engine for cultural heritage, and contributions of all kinds are welcome.

## Ways to Contribute

### Add a New Source
1. Create a JSON manifest in `insposearch/sources/` using `_template.json` as a reference
2. Implement the fetcher function in `src/fetchers.js`
3. Register the source in `src/state.js` (`ALL_SOURCES`, `SOURCE_META`, `BADGE_META`)
4. Test with `node scripts/test-source.js <source-id>`
5. Run `npm run build` and verify results

### Fix a Bug
1. Check [Issues](https://github.com/GI-Synth/InspoSearch/issues) for existing reports
2. Fork the repo and create a branch
3. Make your fix in `src/` (not the bundled `insposearch/app.js`)
4. Run `npm test` to verify
5. Submit a pull request

### Improve the App
- UI/UX improvements in `insposearch/index.html` and `insposearch/style.css`
- Search quality improvements in `src/core.js` and `src/state.js`
- Internationalization in `src/i18n.js`

## Development Setup

```bash
npm install
npm run build    # bundles src/ → insposearch/app.js
npm test         # runs test suite
```

## Project Structure

- `src/` — modular source code (edit here)
- `insposearch/` — built output served by Cloudflare Pages
- `scripts/` — build and validation tooling
- `api/` — Cloudflare Worker (CORS proxy + AI features)

## Guidelines

- Keep changes focused — one feature or fix per PR
- Test your changes locally before submitting
- Source additions must include proper attribution fields
- Follow existing code style (Prettier config is included)

## Questions?

Open an issue or start a discussion. We're happy to help.
