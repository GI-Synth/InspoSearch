
## BATCH 3 — PHASE 12: Source Health + 20 New Sources

---

### F-110 — Source health tracker
- `STATE.sourceHealth` initialized as `{}`
- `loadSourceHealth()` called on page init (reads sessionStorage)
- `recordSourceResult(sourceName, count)` called inside `onSourceResult(sourceName)`
- `isSourceHealthy(sourceName)` returns `true` for unseen sources, `false` after 3 consecutive misses
- `callIfHealthy(sourceName, fetchPromise)` wraps every source call in fetchAll
- Sources with 3+ consecutive misses are skipped for that session
- Misses reset each browser session (sessionStorage cleared on tab close)
- `updateSourcesActiveCounter()` called after each source resolves
- "X sources active" shown in sidebar below loading-indicator — DM Mono 9px, ink-3

---

### F-111 — All Batch 3 fetch functions present
- `fetchTate()` — no key, Tate Collection London
- `fetchFinna()` — no key, Finnish Heritage Agency
- `fetchSOCH()` — no key, Swedish Cultural Heritage (CORS best-effort)
- `fetchJoconde()` — no key, French national museum db (data.culture.gouv.fr)
- `fetchMNW()` — no key, Polish National Museum Warsaw
- `fetchTePapa()` — no key, Museum of NZ Te Papa
- `fetchDPLA()` — `STATE.dplaKey`, returns `[]` if no key
- `fetchArtsy()` — `STATE.artsyId` + `STATE.artsySecret`, xapp token cached in `STATE.artsyToken`; returns `[]` if either credential missing
- `fetchPAS()` — no key, Portable Antiquities Scheme (UK finds)
- `fetchSMG()` — no key, Science Museum Group UK
- `fetchAuckland()` — no key, Auckland War Memorial Museum
- `fetchPhotogrammar()` — no key, FSA/OWI Depression photographs (Yale)
- `fetchWellcome()` — no key, Wellcome Collection (medical history)
- `fetchMAAS()` — no key, Powerhouse Museum Sydney
- `fetchSMK()` — no key, Statens Museum for Kunst (Denmark)
- `fetchThyssen()` — no key, Thyssen-Bornemisza Madrid (CORS best-effort)
- C17 WDL: extra `fetchLOC()` call with id/source remapping — no new function
- C18 Wikimedia Artwork: two extra `fetchWikimedia()` calls — no new function

---

### F-112 — New STATE keys
- `STATE.dplaKey` — `null`, loaded from `localStorage.getItem('inspo_dpla_key')`
- `STATE.artsyId` — `null`, loaded from `localStorage.getItem('inspo_artsy_id')`
- `STATE.artsySecret` — `null`, loaded from `localStorage.getItem('inspo_artsy_secret')`
- `STATE.artsyToken` — `null`, runtime-only (not persisted)

---

### F-113 — fetchAll updated
- All new sources added to `Promise.allSettled`
- All calls wrapped with `callIfHealthy(sourceName, fetchPromise)`
- C17 WDL mapped inline: `.then(r => r.map(i => ({...i, source:'wdl', id:i.id.replace('loc_','wdl_')})))`
- Total parallel call slots: ~55 (some share source names e.g. europeana × 3, wikimedia × 4)
- `perSource = Math.ceil(totalCount / 55)`
- All use `onSourceResult(sourceName)` curried form

---

### F-114 — Keys panel updated
- All no-key Batch 3 sources shown as `alwaysOn: true` (green "✓ active" badge)
- DPLA row: key input + get-key link → `dp.la/info/developers`
- Artsy row: two separate text inputs (client_id + client_secret) + get-key link → `developers.artsy.net`
- Thyssen + SOCH shown as `alwaysOn: true` with CORS best-effort note in `desc`

---

### F-115 — No regressions
- All existing sources (Batch 1 + 2) still wired in fetchAll
- Health tracker never blocks a source on first search (unseen = healthy)
- `onSourceResult` curried signature is backward-compatible (all callers updated)
- Slider max stays 150, default count stays 24
- CORS-risky sources (Thyssen, SOCH, Prado, Paris Musées) return `[]` silently — no console errors
