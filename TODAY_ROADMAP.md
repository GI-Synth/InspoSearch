# InspoSearch — Today's Roadmap (2026-04-20)

> Code-verified prioritization of the next most important work, plus a cleanup
> pass on stale planning docs. No code has been changed yet — this file is a
> plan, read before acting.

---

## 1. Ground truth snapshot (pulled from `git log` + grep, not memory)

**Recent landed fixes** (commits b9cd18c → bb6dc0a on `main`):
- Worker `/search` + `/random` hardened with `safeJson` guards — [api/worker.js:61](api/worker.js#L61)
- Health tracker now has `HEALTH_MISS_LIMIT=10` + `HEALTH_RECOVERY_MS=5min` auto-recovery — [src/state.js:18-20](src/state.js#L18-L20), [src/core.js:142-160](src/core.js#L142-L160)
- `selectDynamicSources` caller caps raised 40 → 120 — [src/app.js:100](src/app.js#L100), [src/app.js:401](src/app.js#L401)
- `fetchFromDataCache` now tracks `_unavailableSources` to skip 404s silently without health penalty — [src/core.js:573-578](src/core.js#L573-L578)
- Exact-mode word-boundary matching, artist-name detection landed (commit 0f82058)
- Load-more quality gate + dynamic source union (commits f0cda32, bb6dc0a) — [src/app.js:2145](src/app.js#L2145)
- 14 source manifest validation errors fixed (commit b9cd18c)

**Still broken (confirmed by on-disk evidence):**
- [insposearch/data/](insposearch/data/) has only **6 files** (prado, parismusees, soch, thyssen, cudl, homepage-images). `_index.json` is frozen at `2026-03-23T09:43:33Z` — never rewritten since.
- `fetchFromDataCache('<id>')` is called from [src/fetchers.js:3091](src/fetchers.js#L3091) through ~line 3440 for **~149 source IDs** — every one silently returns `[]` because no data file exists. `_unavailableSources` catches 404s per-session but that still means ~149 "active" sources never return a single result.
- Nightly GitHub Actions workflow [.github/workflows/nightly-fetch.yml](.github/workflows/nightly-fetch.yml) runs but has `continue-on-error: true` on the fetch step + no `_index.json` regeneration after partial runs. `parismusees/prado/soch` updated on 2026-04-18 (likely manual `workflow_dispatch`), `thyssen/cudl` still frozen at 2026-03-23.
- Public-facing source count is inconsistent: [insposearch/index.html:7](insposearch/index.html#L7) says **"2487+ sources"**, [CHANGELOG.md:15](CHANGELOG.md#L15) says **"196+ sources"**, [INSPOSEARCH_MASTERPLAN.md:26](INSPOSEARCH_MASTERPLAN.md#L26) says **521**, [CURRENT_STATE.md:56](CURRENT_STATE.md#L56) says **403+**. `sources.manifest.json` has only **15** `active:true` entries. The real active count (hardcoded + dynamic) needs to be re-derived and pinned in one place.

---

## 2. Today's priority order

### 🔴 P1 — Nightly fetch: make it actually ship data (est. 3-4h)

This is the single biggest user-visible lever. Unblocks ~149 adapters with one pipeline fix.

1. **Inspect the last 10 GitHub Actions runs of `nightly-fetch.yml`.** Expected outcomes: either (a) fetch step crashes mid-script, (b) push step fails due to branch protection, or (c) no recent runs at all. All three recoverable.
2. **Remove `continue-on-error: true`** temporarily on the fetch step to surface the real error — [.github/workflows/nightly-fetch.yml:26](.github/workflows/nightly-fetch.yml#L26).
3. **Regenerate `_index.json` at end of script** even on partial runs so status is never frozen — [scripts/fetch-cors-blocked.js](scripts/fetch-cors-blocked.js).
4. **Add per-query `sleep` + descriptive UA** (`InspoSearch/1.1 (+mailto:bianca.condruz@hec.ca)`) to Wikidata SPARQL calls — Wikidata throttles GH Actions runner IPs aggressively.
5. **Extend the script to loop over `WD_PHASE_H` + Phase E/F/G arrays** from `src/state.js` — each entry already has a Wikidata QID; one generic SPARQL template (`wdt:P195 wd:<QID> . ?item wdt:P18 ?image.`) covers ~113 sources.

Verification: re-run `workflow_dispatch` once, confirm `insposearch/data/` has ≥140 files and `_index.json` is today's date.

### 🔴 P2 — Fix the source-count lie (est. 30 min)

The "2487+" in the meta description is implausible and leaks as the social-card subtitle whenever anyone shares the URL. Four different docs have four different numbers.

1. Count the real active pool: `ALL_SOURCES.length` in `src/state.js` (currently has ~106 entries in one section; real total after DYNAMIC_REGISTRY merge is the number to pin) + dynamic entries that have keys present.
2. Pick one authoritative number, update everywhere:
   - [insposearch/index.html:7](insposearch/index.html#L7) meta description
   - [insposearch/institutions.html](insposearch/institutions.html) hero + source-type breakdown grid (stale per [PRE-CALL-FIXES.md](PRE-CALL-FIXES.md))
   - [CHANGELOG.md:15](CHANGELOG.md#L15)
   - [INSPOSEARCH_MASTERPLAN.md:26](INSPOSEARCH_MASTERPLAN.md#L26)
3. Fix [scripts/update-source-count.cjs](scripts/update-source-count.cjs) regex so future builds can't reintroduce stale numbers (also flagged in [PRE-CALL-FIXES.md](PRE-CALL-FIXES.md)).

### 🟡 P3 — Publish/commit the Apr-18 data files + verify live (est. 30 min)

`parismusees/prado/soch` were refreshed on 2026-04-18 but the last commit to `insposearch/data/` is `7d98fe8` which doesn't include those timestamps — they're currently **uncommitted on disk**. Either commit them or discover they were already pushed (check `git status`). Then hit `https://insposearch.pages.dev/data/parismusees.json` and confirm a recent `lastFetched`.

### 🟡 P4 — Clean up obsolete planning docs (est. 30 min)

See §3 below. Delete or archive the clearly-superseded ones, retitle the two still-relevant audit files.

### 🟢 P5 — Refresh `CURRENT_STATE.md` (est. 20 min)

Dated 2026-04-06. Regenerate from `git log`, real source counts, real data-file presence. This is the only doc worth keeping as a rolling status snapshot.

### 🟢 P6 — If time remains: one concrete code fix from `AUDIT_REPORT.md` §P5.8

Van Gogh exact mode misses Met/Rijks/Europeana because the word-boundary filter is too strict on non-English metadata. Strip diacritics + lowercase first. ~1-2h, covered by [tests/e2e/search-quality.spec.js](tests/e2e/search-quality.spec.js) (currently failing).

---

## 3. Stale `.md` files — recommended action

### Delete outright (content fully superseded or event already passed)

| File | Why delete |
|---|---|
| [EUROPEANA-CALL-GUIDE.md](EUROPEANA-CALL-GUIDE.md) | Call date was 2026-04-09; today is 2026-04-20. Call-prep artifact. |
| [EuropeanaReadyPlan.md](EuropeanaReadyPlan.md) | Same — Europeana partnership pre-call plan. |
| [PRE-CALL-FIXES.md](PRE-CALL-FIXES.md) | Same deadline; items either done or rolled into roadmap above. |
| [VERIFICATION-SUMMARY.md](VERIFICATION-SUMMARY.md) | Verification doc for "Fixes 1–9" — all of those are months-old committed work. Historical artifact. |
| [EXACT-MODE-IMPROVEMENTS.md](EXACT-MODE-IMPROVEMENTS.md) | Every item marked ✅ or done in commit 0f82058 (exact-mode word-boundary + artist detection). |
| [EXACT_MODE_FIX_PROPOSAL.md](EXACT_MODE_FIX_PROPOSAL.md) | Same — implemented. |
| [INSPOSEARCH_SENIOR_DEV_PROMPT.md](INSPOSEARCH_SENIOR_DEV_PROMPT.md) | One-shot chat seed. Known bugs BUG-001 to BUG-004 already fixed in commits 22ded03 / b7f756e / 966e452. |
| [insposearch-review.md](insposearch-review.md) | Generic static-analysis review superseded by [AUDIT_REPORT.md](AUDIT_REPORT.md). |
| [PLAN.md](PLAN.md) | "Raptor Mini" task sheet from 2026-04-11; most items done or rolled into P5/P6 items of AUDIT_REPORT. Keep only if you want the code-hygiene Group 8 tasks, which are trivially re-derivable with grep. |

### Keep but mark stale / re-generate

| File | Why keep, what to do |
|---|---|
| [CURRENT_STATE.md](CURRENT_STATE.md) | Useful format. Regenerate it today — P5 above. |
| [INSPOSEARCH_MASTERPLAN.md](INSPOSEARCH_MASTERPLAN.md) | Strategic doc; update the source counts (P2) and strip the "P3/P4 done" back-matter. |
| [AUDIT_REPORT.md](AUDIT_REPORT.md) | Single best doc. Add a "Status 2026-04-20" header noting which P5.x items are now done (§P5.1, P5.2, P5.5, P5.7 done; P5.3, P5.4, P5.6, P5.8–P5.10 still open). |
| [UXImprovementPlan.md](UXImprovementPlan.md) | Still valid UX backlog. Revisit after P1 lands. |
| [SEARCH-OVERHAUL-PLAN.md](SEARCH-OVERHAUL-PLAN.md) | Phases 1, 2, 4, 7 done. Trim those sections; phases 3 (MiniSearch), 5 (local CC0 index), 6 (IIIF harvest), 8 (Worker fan-out) are real future work. |

### Leave untouched (reference / operational, already short)

[README.md](README.md), [CLAUDE.md](CLAUDE.md), [CHANGELOG.md](CHANGELOG.md) (fix the number), [ROADMAP.md](ROADMAP.md) (stub, harmless), [DEPLOY.md](DEPLOY.md), [SECURITY.md](SECURITY.md), [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), [DATABASES.md](DATABASES.md), [MOBILE-TEST.md](MOBILE-TEST.md), [AUDIT_IMAGE_SEARCH.md](AUDIT_IMAGE_SEARCH.md), [AUDIT_REPORT_TEMPLATE.md](AUDIT_REPORT_TEMPLATE.md), [i18n-translation-prompt.md](i18n-translation-prompt.md), [.github/ISSUE_TEMPLATE/](.github/ISSUE_TEMPLATE/), [grants/](grants/).

---

## 4. Suggested working order for today

1. **P4** first (deletions) — clears mental clutter, 30 min.
2. **P2** — quick meta-description + single-number fix, builds into a quick deploy win.
3. **P1** — the real work. Look at the Actions tab for `nightly-fetch.yml` before touching anything.
4. **P3** — verify data files are live after P1 succeeds.
5. **P5** — rewrite `CURRENT_STATE.md` from the new reality.
6. **P6** — only if you still have energy; it has a failing e2e test attached to it so progress is measurable.

Stop after P3 if the day runs short. P4/P5 are cleanup; P6 is a bonus.
