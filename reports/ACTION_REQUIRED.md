# What Needs You — InspoSearch

**Updated:** 2026-08-03
**Everything else from Weeks 1–2 is done, deployed, and verified live.**

Nothing in this file is required for the site to work. The site is up and searching
normally right now with none of it. These are all upgrades.

---

## 1. Get 8 free API keys ← biggest single quality win

**Why this matters more than anything else on the list:** roughly 16 sources currently
produce almost all results. Four of them (Cleveland, Wellcome, the Met, the V&A) produce
about two-thirds. These 8 sources are large collections that are switched off purely
because no key is configured — that is a large part of why narrow subjects like
"sculpture" or "textile" return thin results.

The plumbing is already built and deployed. Each key you add switches a source on for
**every visitor**, with no code change and no redeploy of the site.

### Register (all free, all take a few minutes)

| # | Source | Where to register | Notes |
|---|---|---|---|
| 1 | **Pixabay** | https://pixabay.com/api/docs/ | instant — start here to test the pipeline |
| 2 | **Pexels** | https://www.pexels.com/api/ | instant |
| 3 | **Unsplash** | https://unsplash.com/developers | instant, register an "app" |
| 4 | **Europeana** | https://pro.europeana.eu/page/get-api | email approval, usually same day |
| 5 | **Harvard Art Museums** | https://harvardartmuseums.org/collections/api | email approval |
| 6 | **Smithsonian** | https://api.data.gov/signup | instant, api.data.gov key |
| 7 | **DPLA** | https://pro.dp.la/developers/policies | request by email |
| 8 | **Trove (Australia)** | https://trove.nla.gov.au/about/create-something/using-api | account required |

### Then add each one

Run from the repo root, once per key. It will prompt you to paste the value:

```bash
npx wrangler secret put PIXABAY_KEY     --config api/wrangler.toml
npx wrangler secret put PEXELS_KEY      --config api/wrangler.toml
npx wrangler secret put UNSPLASH_KEY    --config api/wrangler.toml
npx wrangler secret put EUROPEANA_KEY   --config api/wrangler.toml
npx wrangler secret put HARVARD_KEY     --config api/wrangler.toml
npx wrangler secret put SMITHSONIAN_KEY --config api/wrangler.toml
npx wrangler secret put DPLA_KEY        --config api/wrangler.toml
npx wrangler secret put TROVE_KEY       --config api/wrangler.toml
```

### Check it worked

```bash
curl https://insposearch-api.official-ndsclsd.workers.dev/keys
```

Every key you added should be listed. Right now it returns `{"keys":[]}`.

### ⚠️ Then tell me

Adding a secret is not the last step. The **client side still needs wiring** so the app
actually calls those 8 sources. I deliberately did not write that blind — without a real
key I cannot test whether a single one of those adapters actually works, and shipping
eight unverified adapters would be guessing.

**Send me even one key (Pixabay is instant) and I will wire and verify the whole set.**

---

## 2. Decide on the 3 sources that need a different kind of key

These are separate from the 8 above — they are museum APIs that changed their access
rules. Each needs a decision from you, not just a key.

| Source | Situation | Decision needed |
|---|---|---|
| **Cooper Hewitt** | API replies "Required access token missing" | register at collection.cooperhewitt.org for a free token, or drop the source |
| **NYPL** | returns 401; needs an `Authorization: Token` header | register at api.repo.nypl.org, or drop |
| **Te Papa (NZ)** | old endpoint now redirects to their website; the real API moved to `data.tepapa.govt.nz` and needs a key | register, or drop |

---

## 3. Review and merge — optional

Everything is already merged to `main` and deployed. If you want a reviewable record
instead, the branch is still on GitHub:

```
fix/week1-rate-limits-and-proxy-hardening
```

---

## 4. Two small things I did not touch

**`npm run lint` is broken.** ESLint 10 requires a flat `eslint.config.js`; the repo has
the older `.eslintrc.json`. Pre-existing and unrelated to recent work, but it means lint
has not been running. Roughly a 10-minute fix — say the word.

**5 end-to-end tests fail.** I checked each against `main`: **all five fail identically
on `main`**, so none are new. Four are UI-visibility issues (sidebar, theme toggle, detail
panel, count slider). The fifth expects a Rijksmuseum badge for "van gogh" — Rijksmuseum
is key-gated and dark, so the test asserts something that cannot pass without a key. They
should be fixed or updated, but nothing here is a regression.

---

## What is already done — no action needed

| Item | Status |
|---|---|
| Self-inflicted rate limiting | Fixed, deployed, verified — 100/100 requests pass where 60 was the ceiling |
| Proxy access control | Fixed, deployed, verified — destination-based, arbitrary hosts refused |
| SSRF protection | Verified correct, retained |
| Throttled source treated as broken | Fixed — a "busy" response no longer benches a healthy source |
| 3 dead-DNS sources | Retired — they wasted a request slot on every search |
| Dead-source triage | Complete — every failing API tested live, results in `HEALTH_AUDIT_2026-08-02.md` §4b |
| Server-side key support | Built, deployed, tested — inert until you add secrets |
| Unit tests | 51 → 77 |
| Git vs production | Now matched; `main` is deployed |

---

## Priority

1. **Pixabay key** (2 minutes) → send it to me → I wire the client and verify end-to-end
2. The other 7 keys, as approvals come back
3. Decide on Cooper Hewitt / NYPL / Te Papa
4. Lint config and the 5 stale e2e tests

Item 1 is the one that visibly changes search quality.
