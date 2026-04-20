# InspoSearch — Long-Term Vision & Funding Strategy

> Working document. Not public-facing. Captures the north star so every code decision can be checked against it.

## North star

- **10,000+ connected sources** (currently 2,847 in DYNAMIC_REGISTRY).
- **10 billion+ images** discoverable through a single search (current reach: ~500M+ across connected APIs).
- Deep coverage of **niche museums, regional archives, and university collections** that aren't indexed by Google Arts & Culture, Europeana, or DPLA.
- A world where a student in Manila can find a 19th-century Peruvian textile as easily as a Van Gogh.

## Core observation — the real blocker is metadata

The search engine is only as good as the text attached to each image. The largest recurring failure mode in InspoSearch is not "the source has no image of X" — it's "the source has the image but tagged it as `Object #4472`, `Unknown artist`, or in a language the query doesn't match."

Concrete examples we see every day:
- Small museum APIs return records with `title: "Painting"`, no artist, no date, no medium, no movement tag.
- Non-English sources (Joconde, BnF, MNW, ONB) have rich French/German/Polish metadata but no English aliases, so English queries miss everything relevant.
- Biodiversity sources (BHL, GBIF, iNaturalist) have scientific binomials but no common-name tags, so "butterfly" misses `Vanessa atalanta`.
- Photograph archives (Chronicling America, Library of Congress) have OCR'd captions with noise, no subject/topic tagging.
- Most sources have no visual tags at all — no color, style, mood, composition, era, or subject descriptors.

**This is where the moat is.** Connecting 10,000 sources is a logistics problem. Making their 10B images actually searchable is an AI problem, and one nobody else is solving at this scale for cultural heritage.

## The two-product vision

### Product 1 — InspoSearch (open-source, free)
The consumer-facing discovery engine. Stays free and zero-cost-to-run (client-side, Cloudflare Pages). Purpose: drive adoption, prove the thesis, build the dataset of queries and click-throughs that trains the model.

### Product 2 — InspoEnrich (commercial, funds Product 1)
A metadata-enrichment service sold to the institutions themselves. Two shapes:

1. **Self-serve tool** — museums upload a CSV + image folder, get back enriched metadata (artist inference where possible, subject tags, color/style/era descriptors, multilingual aliases, LOD-compatible JSON-LD). Pricing: per-image, volume-discounted.
2. **Managed service** — for large institutions, we run the enrichment on their whole collection, deliver as a one-time project or ongoing API. Higher margin, fewer clients.

**Why they'd pay:** institutional collections are under pressure to be discoverable (funding, accreditation, public-benefit mandates) but don't have in-house ML teams. Current options are (a) hire a cataloger at $50-80k/year to do it by hand, (b) use Google Vision which is generic and not trained on cultural heritage, or (c) nothing. A purpose-built model that already understands Rococo vs. Baroque, or distinguishes a ukiyo-e print from a chinoiserie imitation, is a real product.

### The flywheel
Free InspoSearch → queries/clicks become training signal → better metadata model → better enrichment service → revenue → more sources onboarded → better InspoSearch.

## The ultra-lightweight metadata model

Design constraints for the model itself:

- **Specialized, not general.** Not competing with GPT-4V or Gemini. Trained specifically on cultural-heritage images + their existing (messy) metadata.
- **Ultra-light.** Target: runs on a single consumer GPU or even CPU. Enables on-prem deployment for museums with data-sovereignty concerns (big deal in EU / national institutions).
- **Outputs structured metadata:** `{artist_guess, confidence, era, movement, medium, subjects[], colors[], style_tags[], multilingual_aliases[]}`, not prose.
- **Calibrated uncertainty.** A "I don't know who painted this" output is more valuable to a museum than a confident wrong guess. Human-in-the-loop workflows need confidence scores.
- **Trainable on the ~50M already-well-tagged images in Met/Rijks/Harvard/Europeana/Wikimedia** — we don't need a new dataset, the enrichment for the other 9.5B comes from bootstrapping off the well-tagged 50M.

## Stepwise path (rough phasing)

### Phase 0 — Now → end of 2026: prove the thesis (solo/bootstrap)
- Keep growing InspoSearch's source count past 3,000.
- Ship the result-yield improvements (in progress via `IMPROVEMENTS_LOG.md`).
- Start logging anonymized query → click data (privacy-first; aggregate only) — this is the training signal.
- Prototype a v0 metadata model on the Met's open dataset (~500k well-tagged images) — pick one narrow task first, e.g. "given an untagged painting, predict movement + era." Measure accuracy honestly.
- **Cost:** effectively $0 beyond current hosting. Solo developer time.

### Phase 1 — 2027: first revenue, first hire
- Launch InspoEnrich v1 as a self-serve tool — start with one specific vertical (e.g. small US regional museums, or European university collections) where the buyer persona is clearest.
- Get 3-5 paying design partners at $2-10k each for a pilot.
- Hire 1 ML engineer part-time/contract to level up the model.
- **Cost:** ~$80-150k runway (1 contractor + compute + legal for contracts). Fundable via early revenue + small angel round ($200-300k) or grant (Knight Foundation, Mozilla, NEH digital humanities, EU Creative Europe).

### Phase 2 — 2028: scale onboarding
- Travel program: visit 50-100 niche museums/archives over 12 months to onboard their collections + pitch enrichment. Start in Europe (dense museum geography, Creative Europe funding line), then Latin America, then SE Asia.
- Expand source count to 5,000.
- ML team to 2-3 people. Full-time.
- **Cost:** ~$800k-1.2M/year. Fundable via a seed round ($1.5-3M) from culture-tech or mission-aligned investors (e.g. Betaworks, Schmidt Futures, Mozilla Ventures). Keep equity drag low by mixing in non-dilutive grants.

### Phase 3 — 2029-2030: the moat
- 10,000 sources. Model trained on hundreds of millions of images.
- Enrichment service has 20-50 institutional clients, ARR in the low millions.
- InspoSearch remains free, funded entirely by enrichment revenue.
- Consider a foundation structure (like Mozilla) to guarantee the open-source half can never be enshittified.

## Funding required — rough totals

| Phase | Horizon | Cash needed | Source |
|---|---|---|---|
| 0 | 2026 | ~$0 (sweat equity) | self |
| 1 | 2027 | $150-300k | revenue + grants + small angel |
| 2 | 2028 | $1.5-3M | seed round + grants |
| 3 | 2029-2030 | $3-8M or cashflow-positive | Series A or customer revenue |

Total external capital to reach the vision: **~$5-10M over 4 years**, offsetable by grants and customer revenue if the enrichment pitch lands.

## Market sizing (rough, bottom-up)

- ~55,000 museums worldwide (ICOM estimate). Narrow to those with digitized collections + API/CSV-ready metadata: ~8,000-12,000 institutions in our addressable first pass.
- Serviceable segment (willing to pay for enrichment, mid-size, data-maturity adequate): ~2,000-3,000 institutions globally.
- Blended ACV target: $8k-30k/year (mix of self-serve + managed). Conservative serviceable revenue: **~$25-60M ARR ceiling in core segment** before adjacent expansion (university archives, corporate art collections, stock agencies, publishers, AI training-data licensing).
- Adjacent expansion doubles the TAM ceiling. Stock and publishing alone is a >$1B adjacent market that benefits from the same enrichment model.

## Competitive landscape

- **Google Arts & Culture** — reach, not depth; no enrichment-as-a-service; aggregator, not partner; no on-prem option.
- **Europeana / DPLA** — federated, public-good, not commercial enrichment.
- **Generic vision APIs (Google Vision, AWS Rekognition, Clarifai)** — not trained on cultural heritage, confidently wrong on movement/era/medium; no multilingual alias output.
- **In-house cataloguing consultancies (Gallery Systems, Axiell)** — expensive, human-led, slow.
- **Our wedge:** specialized model + institutional-partner positioning + on-prem-friendly deployment + the free consumer product as a distribution/training moat nobody else has.

## Why now

- Open-access mandates rising (EU Directive on Open Data, US NEH/IMLS digital-first grants, UK Arts Council Digital Culture Compass) — institutions are being *required* to publish metadata.
- Small-model inference costs have fallen ~10x in 24 months; running a specialized 1-3B-param model on-prem is now realistic.
- Post-pandemic, digital-first is a board-level KPI at most mid-to-large institutions.
- Incumbents (Google, AWS) have deprioritized cultural-heritage verticals; consolidation window is open.

## Unit economics (hypothesis, to validate in Phase 1)

- Self-serve tier: $0.02-0.05 per image enriched. A 50k-image small museum = $1-2.5k one-time + $500/yr maintenance. COGS mostly GPU inference + storage; target gross margin 70-80%.
- Managed tier: $15-50k per institution per year depending on collection size + custom-ontology work. Higher gross margin (85%+) but higher CAC.
- Breakeven hypothesis: ~25 paying institutions at blended $15k ACV covers a 4-person team and infra.

## Defensibility

- **Data flywheel.** Query → click data from the free product is a training signal nobody else can replicate without the consumer side. Giving InspoSearch away is not a charity — it's how we build the moat.
- **Institutional trust.** Museums that share their collection history with us in Phase 2 won't re-share with a latecomer.
- **Vertical depth.** A model that distinguishes ukiyo-e from chinoiserie with high F1 takes years of domain-specific training data to replicate from scratch.

## Risks to be honest about

- **Museums move slowly.** Institutional sales cycles are 6-18 months. Need cash reserves to survive them.
- **Open-data politics.** Some institutions see their metadata as an asset and don't want external enrichment — need to position as "we help you enrich yours, you own the output."
- **Model bias.** A cultural-heritage ML model trained mostly on Western collections will underperform on African, Indigenous, South Asian material. This is both an ethical and a commercial problem (those are also potential clients). Mitigation: prioritize diverse training data and partner with source institutions from the start.
- **Google or a big museum consortium building this first.** Possible. Our advantage: we're mission-aligned, not ad-funded, and we ship fast.
- **Training-data IP.** Even "open access" museum datasets often have attribution + non-commercial clauses. Need counsel to vet the training-corpus license stack before commercial launch. Budget $10-20k legal in Phase 1.
- **Phase 2 burn underestimated.** 3 ML engineers fully-loaded ≈ $600k/yr, plus GPU compute ($100-200k), travel ($80-120k), ops. Realistic Phase 2 burn is **$1.2-1.8M/yr**, not $800k-1.2M. Plan for the upper end.

## What to keep in mind from this, while shipping day-to-day

- Every source adapter we add is a future enrichment customer.
- Every piece of metadata we *generate* in-search (captioning, color extraction, tag inference) is a prototype of the commercial product — build reusably.
- Every time a query returns too few results because the metadata is thin, that's not a bug in InspoSearch, that's market research for InspoEnrich.
