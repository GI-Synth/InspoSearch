# InspoSearch — Pitch Deck Brief

> Condensed, deck-ready source of truth for a design agent. Read `VISION.md` for full strategic context; this file is the summary + prompt.

---

## One-liner

**InspoSearch is the search engine for the world's cultural heritage — free to use, funded by selling AI-powered metadata enrichment to the museums and archives it connects.**

## Elevator pitch (30 seconds)

Half of the world's digitized cultural heritage is technically online but practically invisible — tagged as "Object #4472" or locked behind non-English metadata. InspoSearch is a free, client-side search engine that already unifies 2,847 museum, archive, and library APIs into one visual interface. The commercial wedge is InspoEnrich: a purpose-built, ultra-lightweight AI model that generates rich multilingual metadata for the institutions we connect. Free consumer product builds the training-data flywheel; paid enrichment service funds the mission.

## Traction snapshot (as of 2026-04-20)

- **2,847 connected sources** (museums, archives, libraries, biodiversity, photography, design).
- **~500M+ images** reachable through the current source graph.
- **101 languages** supported in the UI.
- **Zero-dependency client-side architecture** — hosting cost is effectively $0 at current scale (Cloudflare Pages + nightly GitHub Action for CORS-blocked sources).
- **Open source**, MIT license. Public GitHub repo.

## The problem (for the deck)

1. Cultural heritage is fragmented across 55,000+ institutions with wildly inconsistent APIs.
2. Even where APIs exist, **metadata is the bottleneck** — thin titles, missing artists, no era/movement tags, no multilingual aliases, no visual descriptors.
3. Google Arts & Culture gives reach but no depth. Generic vision APIs (Google Vision, AWS Rekognition) confidently mislabel anything pre-1900.
4. Museums are under growing mandates (EU Open Data Directive, NEH/IMLS, UK Arts Council) to publish discoverable metadata — but most lack in-house ML teams.

## The solution

### Product 1 — InspoSearch (free, open-source)
- Client-side visual search across every connected institution in one query.
- Intent classification, multilingual query expansion, visual similarity, AI captioning.
- Free forever. Its job is **adoption + training-signal generation**.

### Product 2 — InspoEnrich (commercial)
- Self-serve: museums upload CSV + images, get back enriched structured metadata ($0.02-0.05/image).
- Managed: full-collection enrichment contracts for large institutions ($15-50k/year).
- Outputs: `{artist_guess, confidence, era, movement, medium, subjects[], colors[], style_tags[], multilingual_aliases[]}`.
- **Ultra-lightweight model** — runs on a single GPU or CPU; on-prem deployment option (critical for EU data-sovereignty requirements).

### The flywheel
Free search → query/click data → better model → better enrichment → revenue → more sources onboarded → better search. This flywheel is the moat.

## Market

- **TAM:** 8,000-12,000 digitization-ready institutions globally.
- **SAM:** 2,000-3,000 willing and able to pay for enrichment.
- **Blended ACV target:** $8-30k/year.
- **Core-segment revenue ceiling:** ~$25-60M ARR before adjacent expansion.
- **Adjacent:** stock agencies, publishers, AI training-data licensing (>$1B adjacent market).

## Why now

- Open-data mandates rising globally (EU Directive, US NEH/IMLS, UK Arts Council).
- Specialized small-model inference costs dropped ~10x in 24 months — on-prem is realistic.
- Post-pandemic digital-first is a board-level KPI at most institutions.
- Incumbents (Google, AWS) have deprioritized cultural-heritage verticals — consolidation window is open.

## Competitive positioning

| Competitor | Reach | Depth | Enrichment | On-prem | Commercial fit |
|---|---|---|---|---|---|
| Google Arts & Culture | ✓✓ | ✗ | ✗ | ✗ | ad-funded |
| Europeana / DPLA | ✓ | ✓ | ✗ | ✗ | public-good |
| Google Vision / AWS Rekognition | — | ✗ | generic | ✗ | horizontal |
| Gallery Systems / Axiell | — | ✓ | human | ✓ | slow, expensive |
| **InspoSearch + InspoEnrich** | ✓✓ | ✓ | **specialized AI** | ✓ | **free + SaaS** |

## Defensibility

1. **Data flywheel** — nobody else has both the consumer product generating query signal *and* the enrichment service.
2. **Institutional trust** — museums that share collection history with us first won't re-share with a latecomer.
3. **Vertical depth** — distinguishing ukiyo-e from chinoiserie with high F1 takes years of domain-specific training data.

## Business model

- Self-serve tier: $0.02-0.05 per image, volume-discounted. Target gross margin 70-80%.
- Managed tier: $15-50k per institution per year. Target gross margin 85%+.
- Breakeven hypothesis: ~25 paying institutions at blended $15k ACV covers a 4-person team and infra.

## Roadmap

| Phase | Horizon | Milestones | Cash needed | Source |
|---|---|---|---|---|
| **0** | 2026 | 3,000 sources; v0 model on Met dataset; ship result-yield improvements | ~$0 | bootstrap |
| **1** | 2027 | InspoEnrich v1 launch; 3-5 paying pilots; 1 contractor hire | $150-300k | revenue + grants + small angel |
| **2** | 2028 | 50-100 museum visits; 5,000 sources; 2-3 FT ML engineers | $1.2-1.8M/yr | seed round ($1.5-3M) + grants |
| **3** | 2029-2030 | 10,000 sources; 20-50 enrichment clients; ARR in low millions | $3-8M or cashflow-positive | Series A or customer revenue |

**Total external capital to reach vision:** ~$5-10M over 4 years, offsetable by grant funding + customer revenue.

## The ask (for investor deck version)

- Raising a **$300k pre-seed / angel round** in 2027 to fund first hire and InspoEnrich v1 launch.
- Use of funds: 60% engineering (ML contractor + part-time design), 20% GPU compute, 10% legal (IP/licensing audit), 10% go-to-market pilots.
- 18-month runway to reach 3-5 paying design partners and a defensible v1 model.

## Risks (disclosed)

- Institutional sales cycles are 6-18 months — need runway to survive them.
- Training-data IP vetting required before commercial launch (~$10-20k legal budget in Phase 1).
- Model bias on non-Western collections is both an ethical and commercial risk — mitigated by partner-first data strategy.
- Well-funded competitor entry (Google, museum consortium) is possible — our speed and mission-alignment are the counter.

## Grants / non-dilutive capital targets

- **Phase 1:** Knight Foundation (digital news + culture), Mozilla Foundation (open internet), NEH digital humanities, EU Creative Europe.
- **Phase 2:** Schmidt Futures, Betaworks (culture-tech), Mozilla Ventures, Creative Europe scale-up grants.

## Tone / positioning for the deck

- Confident, mission-driven, but not naïve. We are building a real business that happens to be good for the world.
- Don't oversell the AI — position the model as **specialized and calibrated**, not as an AGI competitor.
- Emphasize the two-sided moat: open-source adoption + commercial enrichment — neither half works without the other.
- Avoid "disrupting museums" language. We partner with institutions; we don't replace them.

---

## Screenshots to capture and ship alongside this brief

The agent generating the deck will need real product visuals. Capture these (run `npm run build && npm start`, then screenshot the browser at 1920×1080):

1. **Hero search grid** — run a broad query like `botanical illustration` and screenshot the full results grid. Shows the product "just works" on a visually strong query.
2. **Niche cross-institution query** — something like `art nouveau poster` or `japanese woodblock` — shows variety across sources.
3. **Single-image detail panel** — click into an image, screenshot the detail view with metadata sidebar.
4. **Sources page / source count** — any UI state that exposes the 2,847 source count credibly.
5. **Board / collection view** (if applicable) — shows product depth beyond "list of images."
6. **Map or 3D view** (if in build) — differentiator vs. generic image search.
7. **Mobile view** — a phone-width screenshot proves responsiveness.
8. **Settings / AI-caption panel** — shows the enrichment angle already prototyped in-product.

Save captured screenshots to `pitch-deck-assets/` in the repo root. Name them by slide intent: `01-hero-grid.png`, `02-niche-query.png`, etc.

---

## Prompt for Claude (or any design agent) to generate the deck

> You are designing a **12-14 slide investor pitch deck** for InspoSearch, a free open-source cultural-heritage search engine that monetizes through a commercial AI metadata-enrichment product called InspoEnrich.
>
> **Primary sources of truth (read all three before designing):**
> 1. `PITCH_DECK_BRIEF.md` — condensed summary, positioning, and numbers (this file).
> 2. `VISION.md` — full strategic context, risks, and phasing.
> 3. `INSPOENRICH_ROADMAP.md` — technical build path for the commercial product + deck-integration instructions for a dedicated "How we build it" slide and cross-slide amendments. Follow its integration guidance.
>
> **Use the real product screenshots** in `pitch-deck-assets/` wherever a "demo" or "product" slide is called for. Do not generate mock screenshots — use the real captures.
>
> **Deck structure (adjust only if you have a strong reason):**
> 1. Title + one-liner.
> 2. The problem — cultural heritage is online but invisible; metadata is the blocker.
> 3. Market opportunity — 55k institutions, TAM/SAM numbers from the brief.
> 4. The solution — dual product (free InspoSearch + commercial InspoEnrich).
> 5. Product demo — hero screenshots from `pitch-deck-assets/`.
> 6. Traction — 2,847 sources, ~500M images, 101 languages, $0 hosting.
> 7. Business model — pricing tiers and unit economics.
> 8. The flywheel — visual diagram: free product → training signal → model → enrichment → revenue → more sources. Amend per `INSPOENRICH_ROADMAP.md` to show query/click data AND opt-in AI metadata as dual inputs.
> 9. **How we build it (three-stage technical path)** — Cloudflare Workers AI now → community metadata layer → custom specialized model. See `INSPOENRICH_ROADMAP.md`.
> 10. Competition — use the comparison table from the brief.
> 11. Why now — mandates, inference cost collapse, incumbent deprioritization, edge-AI economics.
> 12. Roadmap — the 4-phase table with cash needs.
> 13. The ask — $300k pre-seed, use of funds, 18-month plan.
> 14. Team + contact. (Founder bio to be supplied separately.)
> 15. Appendix (optional) — detailed risks, grant targets.
>
> (Total 14-15 slides once the "How we build it" slide is inserted. That's within the 12-14 target — if tight, fold Appendix into the deck narrative or drop.)
>
> **Visual direction:**
> - Editorial, museum-catalog-inspired typography — serif headlines (Canela, GT Sectra, or similar), clean sans body.
> - Deep neutral palette (off-black, bone, warm grey) with one accent drawn from cultural-heritage imagery (ochre, Indian yellow, or Prussian blue).
> - Large screenshots; generous whitespace; no stock photography.
> - Charts should be minimal — line/bar only, no 3D, no gradients.
>
> **Tone:** Confident, mission-driven, grown-up. Don't oversell the AI. Don't use startup-cringe language ("disrupting," "democratizing" unless tightly scoped, "reimagining"). Do talk about specialization, partnership, and calibrated confidence.
>
> **Constraints:**
> - Every concrete number in the deck must be sourced from `PITCH_DECK_BRIEF.md` or `VISION.md`. Do not invent traction numbers.
> - Flag any slide where you had to interpolate or make an assumption.
> - Output: one deck file (PDF or Figma link) + a short change-log explaining any deviations from this brief.
