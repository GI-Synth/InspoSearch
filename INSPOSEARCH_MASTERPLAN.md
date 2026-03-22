# InspoSearch — Longshot Masterplan

Solo build by Malakai · Open source · Free forever · No accounts · No signups

This document is the full implementation roadmap. Hand it to Claude in Copilot VS Code and work phase by phase.

---

## Vision

InspoSearch is not an image search engine. It is a multi-source visual research engine — a creative thinking tool that aggregates the open cultural web and makes it explorable, connectable, and inspiring. The magic works without AI. AI amplifies it when you want to go deeper.

**Core principles:**
- Free forever, open source, no accounts
- Magical without AI — AI is an opt-in amplifier, never a requirement
- Never hit rate limits on basic use
- Source diversity is a feature — show it, celebrate it
- The tool should feel like a place to think, not a search box

---

## Visual Identity & Design System

InspoSearch has a clear, established aesthetic that must be preserved across all new UI work:

- **Theme:** Dark background, near-black (`#0a0a0a` / `#111`)
- **Typography:** Monospace — terminal-like, precise, unhurried
- **Accent:** Minimal green (✓ active badges, highlights)
- **Tone:** Quiet, focused, slightly editorial — not flashy
- **Density:** Controlled — lots of breathing room, nothing screams for attention
- **Interactions:** Subtle, purposeful — nothing animates without reason

### Impeccable (Styling Reference)

Use the Impeccable GitHub repo as the design reference for all new UI components, especially the onboarding flow. All new components must feel like they were designed for InspoSearch from day one — same monospace energy, same dark restraint, same quiet confidence.

> **Rule: When in doubt, do less. Subtract before you add.**

---

## Current State (Baseline)

~80 active sources across:

- **Major world museums** (Met, V&A, Rijksmuseum, Getty, Tate, Louvre, Prado, LACMA, MoMA-adjacent, Smithsonian network x5+, Nordic, Finnish, Swedish, Danish, Polish, NZ, Australian)
- **Nature & science** (iNaturalist, GBIF, Encyclopedia of Life, NASA, NOAA, Hubble, USGS)
- **Archives** (Library of Congress, Internet Archive, Gallica, Chronicling America, NYPL, Openverse, DPLA, Biodiversity Heritage Library)
- **Photography** (Flickr Commons, Pexels, Pixabay, Wikimedia Commons)
- **Specialty** (Folger, Cornell Digital, Wellcome, Portable Antiquities, Whitney, Photogrammar FSA…)

**AI layer:** Gemini Vision (free key, 1500/day) — already functional for image context extraction and conceptual linking.

**Features already working:** boards, palette extraction, keyword pills, cross-reference (connect), AI interpret, 3D view, sketch view, grid/board view toggle, API key management (local storage, export/import).

---

## Phase 1 — UX Polish & Onboarding

**Goal:** Make the app worth sharing. Force the aha moment. Eliminate empty states.

### 1.1 Source Identity at a Glance

Every source entry in the UI (database list, image metadata panel, source link) must show a favicon or minimal icon next to the source name.

- Fetch favicon from source domain automatically (`https://[domain]/favicon.ico`)
- Fallback: auto-generated monogram icon (first 2 letters, styled consistently)
- Never place the icon on the image itself — only next to the source link/name
- Must scale gracefully to 1000+ databases — icons are the only way to parse a long list at a glance

### 1.2 Exact Search Mode

Add a toggle on the search bar — **explore mode** (current default) vs **exact mode**.

- **Explore mode (default):** Current behavior — broad, multi-source, serendipitous
- **Exact mode:** Stricter query matching, filters applied, results ranked by relevance not diversity
- Toggle is minimal — a small pill or switch adjacent to the search bar
- Must feel like part of the existing UI, not a new feature bolted on
- Keyboard shortcut to toggle (e.g. `Cmd/Ctrl + Shift + E`)

### 1.3 Onboarding — Force the Aha Moment

Current onboarding explains the concept but doesn't demonstrate value immediately. Fix this.

**Approach: Guided first search, not an auto-demo.**

- On first visit, show a minimal welcome overlay (coherent with Impeccable styling)
- Pre-fill the search bar with an evocative example term ("shadow", "texture", "light", "ruins")
- As the user dismisses onboarding, the pre-filled search fires automatically — they land directly in a live result grid, not an empty state
- Overlay must feel like part of the app, not a modal from another product
- Include subtle animated hint arrows pointing to: image slider, click-to-select, keyword pills
- After first search, a quiet tooltip sequence introduces: palette, connect, boards — one at a time, only when the relevant UI element is first used
- Reopen anytime from `?` button (already exists)

### 1.4 Eliminate Empty States

No screen should ever feel dead or waiting.

- **Default landing:** pre-loaded example search visible behind the onboarding overlay
- **Board panel empty state:** show a ghost/placeholder layout with a soft prompt ("drag images here to start a board")
- **AI chat panel empty state (Phase 3):** show suggested conversation starters based on current search term
- **Selected images panel:** when nothing is selected, show a soft hint ("click any image to begin")

---

## Phase 2 — Scale to 1000 Sources

**Goal:** Go from ~80 to 1000+ sources without hand-coding every integration.

### 2.1 Source Manifest Architecture (Community-Contributable)

Replace hardcoded source configs with a JSON manifest format. Each source is a single config file. The community can submit new sources via GitHub PRs.

**Source manifest schema:**
```json
{
  "id": "rijksmuseum",
  "name": "Rijksmuseum",
  "description": "800k Dutch masterworks — no key needed",
  "domain": "rijksmuseum.nl",
  "category": ["museums", "art", "history"],
  "region": "NL",
  "keyRequired": false,
  "keyLabel": null,
  "endpoint": "https://www.rijksmuseum.nl/api/en/collection",
  "queryParam": "q",
  "imageField": "webImage.url",
  "titleField": "title",
  "sourceUrlField": "links.web",
  "resultsPath": "artObjects",
  "corsMode": "direct",
  "active": true,
  "count": "800k",
  "tags": ["paintings", "Dutch masters", "Rembrandt", "Vermeer"]
}
```

- All sources live in `/sources/` as individual JSON files
- A build script merges them into a single `sources.manifest.json`
- The app loads the manifest on startup
- Adding a new source = adding one JSON file + a PR
- This is how you get to 1000 — make it contributable

### 2.2 IIIF Universal Connector (+200 sources)

IIIF (International Image Interoperability Framework) is a universal standard used by hundreds of museums, libraries, and universities. One connector = hundreds of institutions.

- Build a generic IIIF source adapter that works with any IIIF-compliant endpoint
- Pre-populate with known IIIF institutions: Oxford, Cambridge, Harvard, Yale, BnF (Gallica), Bodleian, Stanford, Princeton, University of Toronto, Getty, NGA, and 100+ more
- Each institution gets its own manifest entry pointing to the shared IIIF adapter
- Reference: iiif.io/api/ for spec

### 2.3 Aggregator Sub-Collection Expansion (+200 sources)

Europeana, DPLA, Trove, and DigitalNZ are each aggregators of thousands of institutions. Currently treated as single sources — expose their sub-collections.

- **Europeana:** 3,000+ contributing institutions — surface top 100+ as individual sources
- **DPLA:** 2,000+ US hubs — surface state-level and major institution hubs
- **Trove (NLA):** Australian state libraries, universities, museums
- **DigitalNZ:** NZ cultural institutions
- Each sub-collection gets its own manifest entry with the parent aggregator as adapter

### 2.4 Specialized Database Expansion (+150 sources)

Add targeted databases across underrepresented visual categories:

**Botanical & Natural History**
- Botanicus (Missouri Botanical Garden)
- Biodiversity Heritage Library illustrations
- Royal Botanic Gardens Kew
- Natural History Museum London

**Maps & Geography**
- David Rumsey Map Collection
- Old Maps Online
- NYPL Map Division
- Perry-Castañeda Library (UT Austin)

**Fashion & Textiles**
- Kyoto Costume Institute
- FIDM Museum
- Victoria & Albert (textiles sub-collection)
- Rijksmuseum fashion collection

**Architecture**
- ArchNet (Islamic architecture)
- Avery Index
- Canadian Centre for Architecture
- RIBA (Royal Institute of British Architects)

**Film & Moving Image**
- EYE Filmmuseum (Netherlands)
- BFI (British Film Institute stills)
- George Eastman Museum

**Vintage & Ephemera**
- Duke University Broadsides
- Boston Public Library Maps & Prints
- NYPL Digital Collections (posters, menus, sheet music)

**Open Photography**
- Unsplash (free tier)
- Rawpixel public domain
- Artvee (public domain art aggregator)
- Reshot
- StockSnap

### 2.5 Source Categories & Filtering

With 1000 sources, filtering becomes critical.

- Expand current category tags: `museums` `photo` `nature` `history` `art` `maps` `fashion` `architecture` `science` `film` `archives` `botanical`
- Add region filter: `Europe` `Americas` `Asia` `Oceania` `Global`
- Add access filter: `no key needed` `free key` `paid key`
- All filters combinable
- Source count badge updates live as filters change

---

## Phase 3 — AI Layer (Opt-In, Never Required)

**Goal:** Make the AI a creative research partner, not a feature tax.

### 3.1 Multi-Provider AI Support

**Current:** Gemini Vision (free, 1500/day default)
**Target:** Any vision-capable AI the user wants to use.

**Supported providers (user brings their own key):**
- Google Gemini (default — free tier, no key required to start)
- Anthropic Claude (claude-sonnet — vision capable)
- OpenAI GPT-4o (vision capable)
- Any OpenAI-compatible endpoint (for self-hosted / Ollama users)

**Key management:**
- Stored locally (already the pattern for other keys)
- Provider selector in API Keys panel
- Each provider has a short description + link to get free key
- If no key set → Gemini free tier is used automatically (current behavior)
- Never send keys anywhere except their respective APIs

### 3.2 Grid Context Optimization (Anti-Rate-Limit Architecture)

**Problem:** Sending 150 image URLs to the AI = 150 requests or one massive payload. Rate limits hit in minutes.

**Solution: Canvas snapshot approach**

1. When AI needs to see the current search grid, render the visible grid to a `<canvas>` element
2. Export canvas as a single compressed JPEG (target: <200KB)
3. Send the snapshot + a metadata summary object to the AI:

```json
{
  "searchTerm": "shadow",
  "mode": "explore",
  "sourceCount": 23,
  "imageCount": 147,
  "activeSources": ["Rijksmuseum", "NASA", "iNaturalist", "..."],
  "selectedImages": [{ "title": "...", "source": "...", "tags": ["..."] }]
}
```

4. AI sees the full visual context in 1 request regardless of image count
5. This applies to: AI interpret, AI chat panel, conceptual linking

**Implementation notes:**
- Canvas snapshot uses html2canvas or native Canvas API
- Snapshot is generated lazily (only when AI feature is invoked)
- Snapshot is never stored or sent anywhere except the active AI provider

### 3.3 AI Chat Panel — The Creative Research Assistant

A collapsible chat panel that gives the user a direct line to the AI that already has eyes on their workspace.

**Behavior:**
- Lives on the right side of the screen (or bottom on mobile) — opens/closes with a single button
- On open: AI receives a canvas snapshot of current grid + current board state + current search term
- User can describe what they're working on: "designing album artwork with a dark oceanic feel" or "I'm drawing a character and need reference for Victorian clothing"
- AI responds with conceptual suggestions AND triggers new searches directly into the results grid
- When AI suggests images, they are pulled directly into search results (injected at top of current results, visually tagged as AI-suggested)
- Chat maintains session context (full conversation history sent with each message)
- Empty state shows suggested conversation starters based on current search term

**Canvas snapshot refresh:**
- Snapshot is taken once when chat opens
- User can manually refresh with a small "update context" button
- Snapshot does NOT auto-refresh on every message (would hit rate limits)

**UI requirements:**
- Panel must feel native to InspoSearch — monospace, dark, minimal
- AI responses are concise — this is not a chatbot, it's a research collaborator
- Suggested searches from AI appear as clickable pills the user can fire or dismiss
- Clear visual indicator of which AI provider is active

### 3.4 Existing AI Features (Preserve & Optimize)

- **Interpret (✦):** AI reads selected images and finds conceptual links — keep, optimize to use canvas snapshot method
- **Analyse with AI (✦):** Single image deep analysis — keep as-is
- **Concepts panel:** Keep, feed into chat context

---

## Phase 4 — Community & Growth

**Goal:** Turn users into contributors. Build the network effect.

### 4.1 Open Source Infrastructure

- GitHub repo fully public under MIT or CC0
- `/sources/` directory for community source manifests
- `CONTRIBUTING.md` with simple guide: "Add a source in 5 minutes"
- Source submission template (pre-filled JSON schema)
- GitHub Actions: auto-validate new source manifests on PR

### 4.2 Anthropic Partnership Pitch

InspoSearch is a strong candidate for Anthropic developer partnership / API credit program because:

- It is genuinely open source and free forever (cultural infrastructure, not a business)
- Claude vision would be the premium AI option for users who want the best conceptual analysis
- It is already built and functional — not a proposal, a working product
- Solo-built in 3 nights — demonstrates exceptional leverage of AI-assisted development
- Target users (designers, researchers, artists, educators) are exactly the kind of creative professionals Anthropic wants building with Claude

**Ask:** Developer API credits + partnership acknowledgment in the app
**Contact:** anthropic.com/contact (partnerships)
**Draft pitch:** To be written separately — lead with the open cultural infrastructure angle

---

## Implementation Order for Copilot

Work strictly phase by phase. Do not start Phase 2 until Phase 1 is complete and coherent.

> Phase 1 → Phase 2 → Phase 3 → Phase 4

Within each phase, work feature by feature. Complete and test before moving on.

**For every new UI component:**
1. Reference Impeccable repo for styling patterns
2. Match InspoSearch visual DNA (dark, monospace, minimal green accents)
3. Test in both light and dark mode
4. Mobile-responsive by default

**For every new source added:**
1. Use the JSON manifest schema defined in 2.1
2. Test with at least 3 different search terms
3. Verify CORS handling
4. Add favicon/domain reference

---

## Phase-by-Phase Execution Plan (Planning Only)

This section is the operational plan only. Do not implement features out of order.

### Global Rules (Apply to Every Phase)

1. Freeze scope to the active phase only
2. Keep PRs small and reviewable
3. Preserve visual identity (dark, monospace, restrained green)
4. Validate desktop + mobile before phase signoff
5. Do not ship breaking changes to existing workflows
6. Track all decisions in docs as you go

### Phase 1 Plan - UX Polish & Onboarding

**Objective:** Remove dead-end experiences and force first-session value.

**Work packages:**
1. Source icon system
2. Exact/Explore toggle + keyboard shortcut
3. Guided onboarding first-search flow
4. Empty state redesign across key panels

**Suggested implementation sequence:**
1. Build reusable source icon renderer (favicon with monogram fallback)
2. Apply icon renderer to all source-name surfaces
3. Add search mode state and UI toggle near search input
4. Add keyboard shortcut and visual mode indicator
5. Build first-visit onboarding overlay with prefilled term logic
6. Trigger auto-search on onboarding dismiss
7. Add targeted hint arrows and contextual tooltip progression
8. Implement empty-state placeholders for board and selected panels
9. Verify default landing always shows meaningful content

**Artifacts to produce before phase signoff:**
1. Updated UX flow notes (first visit -> first result -> first AI action)
2. UI screenshots: desktop + mobile for onboarding and empty states
3. Short QA checklist with pass/fail status

**Exit gate (must all be true):**
1. New user can reach AI interpret in <=2 minutes unaided
2. Icons visible across all source references in current catalog
3. Exact/Explore mode toggles correctly from UI + shortcut
4. No major panel appears visually dead on first load

### Phase 2 Plan - Scale to 1000 Sources

**Objective:** Transition from hardcoded integrations to community-scale source expansion.

**Work packages:**
1. Source manifest architecture
2. IIIF universal adapter
3. Aggregator sub-collection expansion
4. Specialized database additions
5. Source filtering upgrades

**Suggested implementation sequence:**
1. Define and lock manifest schema contract
2. Migrate current 80+ sources into per-source JSON files
3. Build merge/validation script that outputs one runtime manifest
4. Update app boot flow to load manifest dynamically
5. Create IIIF adapter and verify with at least 10 institutions
6. Implement parent-aggregator adapter model for sub-collections
7. Add first wave of aggregator sub-sources (Europeana, DPLA, Trove, DigitalNZ)
8. Add specialized vertical source packs (botanical/maps/fashion/etc.)
9. Implement category/region/access filters with live source-count badge
10. Publish contributor docs and manifest PR template

**Artifacts to produce before phase signoff:**
1. Manifest schema docs + examples
2. Contributor guide for adding one source in ~5 minutes
3. Validation report (active source count, schema pass rate)
4. Test log for CORS behavior categories (direct/proxy/best-effort)

**Exit gate (must all be true):**
1. 500+ active sources available via manifest
2. New source can be added via JSON-only PR (no code edits)
3. IIIF connector works reliably with 10+ institutions
4. Filters are combinable and update source/result affordances correctly

### Phase 3 Plan - AI Layer (Opt-In)

**Objective:** Add AI collaboration depth without making AI mandatory or rate-limit fragile.

**Work packages:**
1. Multi-provider AI abstraction
2. Canvas snapshot context pipeline
3. Collapsible AI chat panel
4. Optimization of existing AI entry points

**Suggested implementation sequence:**
1. Define provider interface contract (Gemini, Claude, OpenAI, compatible endpoints)
2. Build provider selector + local key management extensions
3. Implement snapshot generator (lazy, compressed, single-request payload)
4. Add metadata packer for search context + selected items
5. Wire snapshot pipeline into Interpret and conceptual linking paths
6. Build chat panel shell (open/close, mobile behavior, empty state prompts)
7. Add conversation memory + contextual request assembly
8. Add AI-suggested search pills with inject-to-grid behavior
9. Add manual update-context control (no auto-refresh loop)
10. Run performance and rate-limit verification pass

**Artifacts to produce before phase signoff:**
1. Provider matrix (features, key requirements, fallback behavior)
2. Payload profile log (snapshot size, request latency)
3. UX recording of chat-driven suggestion -> search injection flow
4. Privacy note confirming local-only key storage and no extra data retention

**Exit gate (must all be true):**
1. Chat opens and returns usable suggestions in <5 seconds typical
2. Free Gemini tier avoids normal-session rate-limit failure
3. Provider switch can be completed in <30 seconds
4. Existing AI features remain functional with no regression

### Phase 4 Plan - Community & Growth

**Objective:** Convert the project into durable open cultural infrastructure.

**Work packages:**
1. Open-source contribution infrastructure
2. Source contribution automation
3. Anthropic partnership materials

**Suggested implementation sequence:**
1. Finalize license and repository visibility posture
2. Add CONTRIBUTING flow optimized for source-manifest contributors
3. Add source JSON template and validation GitHub Action
4. Add issue templates for source requests and bug reports
5. Draft Anthropic partnership pitch focused on cultural infrastructure value
6. Add in-app acknowledgment surface for ecosystem partners (if approved)

**Artifacts to produce before phase signoff:**
1. CONTRIBUTING.md + source template + CI validation workflow
2. Public roadmap status board linked from repository
3. Partnership outreach draft packet

**Exit gate (must all be true):**
1. External contributor can submit valid source PR without maintainer intervention
2. CI blocks malformed source manifests automatically
3. Partnership pitch is finalized and ready for submission

### Cross-Phase Validation Matrix

Run this at the end of each phase before moving forward:

1. Functional validation: all existing key workflows still operate
2. UX validation: visual style still matches InspoSearch design DNA
3. Performance validation: no major regressions in interaction responsiveness
4. Compatibility validation: desktop and mobile both pass smoke tests
5. Documentation validation: changed behavior reflected in markdown docs

### Suggested Milestone Rhythm

Use this rhythm to keep momentum without over-scoping:

1. Milestone A (Phase 1 complete)
2. Milestone B (Phase 2 manifest + IIIF baseline complete)
3. Milestone C (Phase 2 source scale target complete)
4. Milestone D (Phase 3 provider + snapshot baseline complete)
5. Milestone E (Phase 3 chat UX complete)
6. Milestone F (Phase 4 contributor infrastructure + pitch complete)

---

## Tech Notes for Copilot

- **Frontend:** Vanilla JS (no framework assumption — preserve existing stack)
- **Storage:** localStorage only — no backend, no database
- **AI requests:** Client-side fetch to AI provider APIs directly
- **Canvas snapshots:** html2canvas library or native Canvas API
- **Source manifests:** JSON files, merged at build time
- **CORS:** Handle per-source — direct, proxy, or best-effort as currently done
- **No signup, no backend, no user data collected — ever**

---

## Success Metrics (When to Move to Next Phase)

**Phase 1 complete when:**
- New user lands on InspoSearch and reaches the AI interpret feature within 2 minutes without reading any documentation
- Source icons visible on all 80+ sources
- Exact/explore toggle works and feels native

**Phase 2 complete when:**
- 500+ sources active in manifest
- Community can add a source via PR with zero code
- IIIF connector working with 10+ institutions

**Phase 3 complete when:**
- AI chat panel opens, sends canvas snapshot, returns suggestions, fires searches — in under 5 seconds
- Rate limit never hit during a normal 30-minute session on free Gemini tier
- User can swap AI provider in under 30 seconds

---

*Built by Malakai · GI-Synth · Open source · Free forever*
*"Magical without AI. Better with it."*
