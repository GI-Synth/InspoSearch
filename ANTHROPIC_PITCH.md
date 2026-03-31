# InspoSearch × Anthropic — Partnership Pitch

**From:** Malakai  
**To:** Anthropic Partnerships  
**Contact:** anthropic.com/contact  
**Re:** Developer API credits + partnership acknowledgment

---

## What InspoSearch is

InspoSearch is a multi-source visual research engine — a creative thinking tool that aggregates the open cultural web and makes it explorable, connectable, and inspiring.

It is not an image search engine. It's closer to a telescope for the world's public domain visual heritage.

- **315+ sources** including major world museums (Met, V&A, Rijksmuseum, Getty, Tate, Smithsonian network, 113 Wikidata museums), nature archives (iNaturalist, GBIF, NASA, NOAA), cultural heritage institutions (Library of Congress, Gallica, Internet Archive), Europeana sub-collections, DPLA hubs, and open photography
- **Free forever** — no accounts, no signups, no paywalls
- **Open source** — MIT licensed, community-contributable source manifests
- **Zero infrastructure** — runs entirely in a single HTML file opened locally in a browser

The target users are **designers, researchers, artists, and educators** — creative professionals who need to find visual references that don't come from stock photo sites.

---

## Why I'm writing to Anthropic

InspoSearch already has Gemini Vision integration (free tier, 1,500 calls/day). It works well for basic conceptual analysis.

But Claude is demonstrably better for the kinds of tasks InspoSearch users want to do:

- **Visual interpretation** — "what is depicted here, and what does it mean?" — Claude's vision analysis is more nuanced and contextually rich than competing models
- **Research partnership** — the AI chat panel in InspoSearch is designed as a research collaborator, not a chatbot. Claude's writing style (concise, substantive, thoughtful) is exactly the right register for this
- **Cross-image conceptual linking** — finding hidden connections across 150 images from 30 sources is a reasoning task, not just a vision task. Claude excels here

Claude would be the **premium AI tier** for InspoSearch — available to users who bring their own API key, sitting alongside Gemini (free) and OpenAI-compatible (advanced) providers.

---

## Why this is a strong fit for an Anthropic partnership

**1. Genuine open cultural infrastructure, not a startup**

InspoSearch will never charge users, sell data, or monetize in any way. It is cultural infrastructure — a tool for researchers and creators to access humanity's visual heritage.

Anthropic has publicly stated an interest in supporting beneficial AI applications. An open-source research tool that helps artists, students, and historians access the world's museums is about as clearly beneficial as it gets.

**2. Exceptional leverage of AI-assisted development**

InspoSearch was built in a series of focused sessions using Claude in VS Code Copilot. The entire application — 14,500+ lines of HTML/CSS/JS, 315+ API integrations, a multi-provider AI layer, a canvas snapshot pipeline — is a single-page app deployed on Cloudflare Pages.

This is a concrete demonstration of what Claude-assisted solo development can accomplish. It's a good story for Anthropic to tell.

**3. Direct Claude adoption among target users**

When InspoSearch users discover that the AI features work better with Claude, they get a Claude API key. Many of them will adopt Claude for other creative and research workflows. This is a meaningful top-of-funnel for the exact user type Anthropic wants: thoughtful, creative, research-oriented professionals.

**4. In-app attribution**

If a partnership is approved, InspoSearch will display a permanent, tasteful acknowledgment in the app (in the AI keys panel, where it's contextually appropriate). Not a banner. A quiet "powered by Anthropic" next to the Claude provider option, with a direct link to get a free API key.

---

## What I'm asking for

**Primary ask:** Developer API credits to cover Claude usage during the research and development phase. This is not for a commercial product — it's to enable building and testing the vision features of an open-source tool.

**Secondary ask:** A brief partnership acknowledgment that I can include in the app's about section and the project readme. Anthropic's name next to an open-source cultural heritage tool is, I believe, mutually beneficial.

**Not asking for:** Exclusivity, promotion guarantees, or anything that creates obligations on Anthropic's side. A simple credit arrangement is sufficient.

---

## Current state

- App: fully functional, ships as a single HTML file
- AI providers supported: Gemini (default), Claude (claude-opus-4-5), OpenAI / compatible endpoints
- Canvas snapshot pipeline: implemented — sends a single compressed JPEG of the search grid to the AI regardless of image count (anti-rate-limit design)
- Multi-turn chat panel: implemented — maintains conversation context, parses AI-suggested searches into clickable pills
- Open source: MIT licensed, GitHub-ready

---

## Contact

GitHub: [to be added on public release]  
Project: InspoSearch  
Email: [contact details]

---

*InspoSearch is free forever. No accounts. No signups. The magic works without AI — Claude makes it extraordinary.*
