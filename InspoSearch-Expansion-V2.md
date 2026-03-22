InspoSearch — Expansion Masterplan V2
Built by Malakai · Open source · Free forever · No accounts · No signups Hand this to source-adder or inspo-builder and work phase by phase. Last
updated: March 2026
SESSION SUMMARY — What source-adder just accomplished
Adapter enhancements
imageBaseUrl support added — manifest sources can set a base URL to prepend to relative image paths
resultsPath: "$" support added — APIs that return root-level arrays now work
Both changes are backward-compatible with all existing sources
Manifest fixes
bodleian → inactive (endpoint gone as of 2025)
bsb → inactive (endpoint returns 404)
New sources added (3, all confirmed working)
Source Institution Objects
museum_digital_smb Staatliche Museen zu Berlin 200k
museum_digital_nat museum-digital Deutschland 500k+
museum_digital_westfalen Westphalian museums 50k
Active manifest sources: 6 (was 3 working + 2 broken)
Next adapter feature needed: imageUrlTemplate
Many institutions return an ID field, not a direct image URL. Adding this field to the manifest schema would unlock dozens more:
"imageUrlTemplate": "https://example.com/iiif/2/{id}/full/400,/0/default.jpg"
The adapter would replace {id} with the value extracted from imageField . This unlocks: DigitalCommonwealth, NHM London, AIC (already hardcoded),
Wellcome Collection (already hardcoded), and many more.
NEXT ADAPTER TASK — Implement imageUrlTemplate
Before adding more sources, implement imageUrlTemplate in the manifest adapter.
Implementation spec
In fetchIIIFCollection in index.html , after extracting imgUrl :
// After: let imgUrl = getField(item, config.imageField || 'image');
if (!imgUrl && config.imageUrlTemplate && config.imageField) {
 const idVal = getField(item, config.imageField);
 if (idVal) imgUrl = config.imageUrlTemplate.replace('{id}', idVal);
}
// Also apply imageBaseUrl after template substitution
if (imgUrl && config.imageBaseUrl && !imgUrl.startsWith('http')) {
 imgUrl = config.imageBaseUrl + imgUrl;
}
Sources this unlocks immediately
digital_commonwealth — exemplary_image_ssi → IIIF URL
nhm_london — specimen image ID → CDN URL
smb_berlin_full — object ID → full-res image
artic — already hardcoded, but shows the pattern
heidelberg (if endpoint found) — IIIF image ID
PHASE 2B — FASHION CATEGORY (50 sources)
Goal: Make fashion the most comprehensive category in InspoSearch. Richer than any single fashion search tool.
Implementation note for inspo-builder
Add a fashion category tag to the manifest schema. Add a "Fashion" filter pill to the source filter UI alongside museums/photo/nature/history/art.
Tier 1 — Free, No Key Required (add to manifest immediately)
ID Institution Description Endpoint pattern
kyoto_costume Kyoto Costume
Institute
Japanese fashion history, 16k
objects
https://www.kci.or.jp/en/archives/digital_archives/ (scrape
or IIIF)
museum_fit Museum at FIT (NY) Fashion Institute of Technology
digital collection https://fashionmuseum.fitnyc.edu/
palais_galliera Palais Galliera Paris fashion museum, open
collection
https://www.parismusees.paris.fr/ (via Paris Musées — already
in app, add fashion filter)
bath_fashion
Fashion Museum
Bath British fashion history https://www.fashionmuseum.co.uk/
momu_antwerp MoMu Antwerp Belgian fashion museum https://www.momu.be/en/collection
gemeentemuseum
Gemeentemuseum
Den Haag
Fashion & textiles https://www.gemeentemuseum.nl/
mad_paris
Musée des Arts
Décoratifs Haute couture archive, Paris https://madparis.fr/
galleria_costume
Galleria del Costume
Florence
Italian fashion archive Via Joconde (already in app)
nordic_fashion
Nordic Museum
Fashion Scandinavian dress history Already in app as nordic — add fashion filter tag
va_fashion V&A Fashion Already in app — add fashion
category filter Filter existing va source
Tier 2 — Free API Key Required
ID Institution Key source Notes
europeana_fashion Europeana Fashion api.europeana.eu (free) Filter with qf=PROVIDER:"Europeana Fashion"
dpla_fashion DPLA Fashion api.dp.la (free) Filter subject=fashion OR clothing OR costume
flickr_fashion Flickr Commons Fashion flickr.com/api (free) Tag filter: fashion OR runway OR costume
pexels_fashion Pexels Fashion pexels.com (free) Category filter
pixabay_fashion Pixabay Fashion pixabay.com (free) Category filter
Tier 3 — Runway & Editorial (pitch for research access)
These require outreach. Prepare a short pitch email for each:
Institution Contact Why they'd say yes
firstVIEW firstview.com
Largest runway archive in the world — open source cultural tool pitch
SHOWstudio showstudio.com Nick Knight's archive — free browsing, ask for embed rights
Tagwalk tagwalk.com Fashion search engine — API partnership angle
WWD Archive wwd.com Women's Wear Daily — press/research key
Vogue Runway vogue.com Condé Nast — hardest, but biggest win
Tier 4 — Fashion Schools Digital Collections
These require individual outreach to each institution's library/archive team. Prepare a standard template email: "InspoSearch is a free open-source visual
research tool used by designers and educators. We'd like to link to your digital collection."
School City Archive URL
Parsons School of Design New York digitalcollections.newschool.edu
Central Saint Martins London arts.ac.uk/collections
Royal College of Art London rca.ac.uk/research/collections
Bunka Fashion College Tokyo bunka.ac.jp
Antwerp Royal Academy Antwerp antwerp-fashion.be
London College of Fashion London arts.ac.uk/colleges/lcf
Polimoda Florence polimoda.com
ESMOD Paris esmod.com
Institut Français de la Mode Paris ifm-paris.com
Istituto Marangoni Milan istitutomarangoni.com
Tier 5 — Street Style & Contemporary
ID Source Notes
advanced_style Advanced Style Older fashion photography blog — open embeds
unsplash_fashion Unsplash Fashion Filter existing Unsplash key by fashion,runway,couture
wikimedia_fashion Wikimedia Fashion Filter existing Wikimedia by category:Fashion
met_costume Met Costume Institute Filter existing Met source by department=Costume Institute
openverse_fashion Openverse Fashion Filter existing Openverse by tag=fashion
PHASE 2C — PAINTINGS & DRAWINGS (50 sources)
Goal: The most comprehensive painting and drawing search ever built into a free tool.
Already in app — add paintings category filter tag
Rijksmuseum, Met Museum, Art Institute Chicago, Cleveland Museum of Art, Getty Museum, NGA Washington, Walters Art Museum, Princeton Art
Museum, WikiArt, LACMA, Tate, Thyssen-Bornemisza, Louvre (via Joconde), Smithsonian (Freer|Sackler), Whitney Museum
New museums to add — hardcoded adapters needed
ID Institution Collection size API notes
uffizi Uffizi Gallery Florence 20k works https://www.uffizi.it/en/artworks — check API
orsay Musée d'Orsay 80k+ impressionist https://www.musee-orsay.fr/ — check open data
pompidou Centre Pompidou 120k modern art https://www.centrepompidou.fr/cpv/resource/
khi_vienna Kunsthistorisches Museum 100k+ https://www.khm.at/en/
alte_pinakothek Alte Pinakothek Munich Old masters Via museum-digital adapter
gemaldegalerie Gemäldegalerie Berlin Caravaggio, Raphael Via SMK/museum-digital pattern
hermitage Hermitage Museum Partial open collection https://www.hermitagemuseum.org/
national_gallery_london National Gallery London Turner, Constable https://www.nationalgallery.org.uk/ — check
API
courtauld Courtauld Gallery Manet, Cézanne, Van
Gogh https://courtauld.ac.uk/
scottish_national Scottish National Gallery Velázquez, El Greco https://www.nationalgalleries.org/
national_gallery_ireland National Gallery of Ireland Irish & European https://www.nationalgallery.ie/
albertina Albertina Museum Vienna Largest drawings
collection https://www.albertina.at/
morgan_library Morgan Library & Museum Master drawings https://www.themorgan.org/
british_museum_prints British Museum Prints & Drawings 50k+ Already BM data? Check
royal_collection Royal Collection Trust Windsor Castle drawings https://www.rct.uk/
fitzwilliam Fitzwilliam Museum Cambridge Drawings & paintings https://fitzmuseum.cam.ac.uk/api/
ashmolean Ashmolean Museum Oxford Drawings collection https://collections.ashmolean.org/
sfmoma SFMOMA Open access paintings https://www.sfmoma.org/
mfa_boston Museum of Fine Arts Boston Open access paintings https://www.mfa.org/
nmwa_tokyo
National Museum of Western Art
Tokyo Western paintings https://collection.nmwa.go.jp/ — check IIIF
national_palace_museum National Palace Museum Taiwan Chinese paintings https://www.npm.gov.tw/
chester_beatty Chester Beatty Library Dublin Illuminated manuscripts https://chesterbeatty.ie/
cabinet_estampes Cabinet des Estampes BnF French prints Via Gallica — already in app, filter
wallace_collection Wallace Collection London Fragonard, Rembrandt https://wallacelive.wallacecollection.org/
Manifest entries (simple_rest / iiif_search pattern)
These institutions have IIIF endpoints suitable for the manifest adapter:
ID IIIF endpoint imageUrlTemplate
fitzwilliam https://data.fitzmuseum.cam.ac.uk/api/v1/objects?
q={q}&limit={n}
https://ids.lib.harvard.edu/ids/iiif/{id}/full/400,/0/default.jpg
bnf_prints Via Gallica SRU Already covered by gallica
digital_commonwealth
https://www.digitalcommonwealth.org/search.json?
q={q}
https://iiif.digitalcommonwealth.org/iiif/2/{id}/full/400,/0/default.jpg
PHASE 2D — VISUAL ARTS GENERAL (50 sources)
Photography Archives
ID Source Notes
george_eastman George Eastman Museum History of photography — check API
foam_amsterdam FOAM Amsterdam Photography museum — check API
loc_look LOOK Magazine Archive Library of Congress — via loc filter
Already in app — extend query scope
photogrammar_extend Photogrammar FSA
Illustration & Graphic Design
ID Source Notes
aiga_archives AIGA Design Archives https://designarchives.aiga.org/
cooper_hewitt_design Cooper Hewitt Design Already in app — add design filter
herb_lubalin Herb Lubalin Study Center https://lubalincenter.cooper.edu/
Sculpture & 3D
ID Source Notes
sketchfab_heritage
Sketchfab Cultural
Heritage
https://api.sketchfab.com/v3/models?categories=cultural-heritage-history&q={q} — free
API
smithsonian_3d Smithsonian 3D Already Smithsonian — filter 3D content
cyark CyArk Endangered
Heritage https://www.cyark.org/ — check API
Architecture
ID Source Notes
bauhaus_archiv Bauhaus-Archiv Berlin https://www.bauhaus.de/
frank_lloyd_wright Frank Lloyd Wright Foundation https://franklloydwright.org/
aga_khan Aga Khan Documentation Center https://www.akdn.org/
riba_drawings RIBA Library Drawings https://www.architecture.com/
Textiles & Pattern
ID Source Notes
textile_museum_dc Textile Museum Washington DC https://museum.gwu.edu/
musee_tissus Musée des Tissus Lyon Silk & textile history
horniman_textiles Horniman Museum Textiles https://www.horniman.ac.uk/ — check API
pitt_rivers Pitt Rivers Museum Pattern https://www.prm.ox.ac.uk/
Experimental & Net Art
ID Source Notes
rhizome Rhizome ArtBase Net art archive — https://artbase.rhizome.org/
ars_electronica Ars Electronica https://ars.electronica.art/
eai Electronic Arts Intermix Video art archive
transmediale Transmediale https://transmediale.de/
Open Photography (CC-licensed, no AI-generated)
ID Source Notes
stocksnap StockSnap CC0 photos — https://stocksnap.io/api/
reshot Reshot Free stock photos — https://www.reshot.com/
artvee Artvee Public domain art — WP REST API (image URL via yoast og:image)
wikimedia_art Wikimedia Art Already in app — add art/paintings filter
ROAD TO 100 USERS
Week 1 — Post everywhere creative people live
Reddit (post in all of these):
r/Design
r/Illustration
r/MuseumPros
r/photography
r/Art
r/graphic_design
r/DigitalArt
r/ArtHistory
Template post:
"I built a free tool that searches 80+ museum archives, NASA, the Library of Congress, iNaturalist, and more — all at once, no signup needed. You can
find unexpected visual connections across hundreds of years of human art. Would love feedback from this community." insposearch.netlify.app
Are.na — highest priority This community is InspoSearch's exact user. Post in relevant channels: "Visual Research Tools", "Open Source", "Design Tools",
"Archival Images"
Dribbble & Behance: Make a short screen recording (60 seconds):
Type "shadow" → results stream in from 20 sources
Click image → palette extracts
Select 3 images → hit Connect → AI finds links
Drag to board
That video is the pitch. Nothing else needed.
Week 2 — Targeted outreach
DM 10 design educators: Find professors teaching visual research, mood boarding, or design history. Message: "Built a free tool for visual research —
might be useful for your students."
Discord servers to join and share:
Figma Community Discord
Designer Hangout
Motiondesign.school Discord
The Futur Community
Creative South Discord
Newsletters to submit to:
Sidebar.io (design newsletter — submit at sidebar.io/submit)
Dense Discovery (thoughtful design newsletter)
Creativerly
HYPE4 Newsletter
Undesign.cc tools directory
Week 3 — The two big swings
Show HN on Hacker News: Post on a Tuesday or Wednesday morning (9am ET). Title: Show HN: InspoSearch – search 80+ museum archives and
cultural databases at once Body: Brief description, what makes it different, link. HN audience loves open source + cultural data. This alone can get 200
users in a day.
Product Hunt: Launch on a Tuesday or Wednesday. Get 5 friends to upvote and comment in the first hour (this matters a lot for ranking). Tagline: "Search
the world's visual archives. All at once." First comment: tell the 3-nights-solo story. People love that.
The 100-user unlock
One good Show HN or Product Hunt day = 100 users instantly. Everything in weeks 1 and 2 is warming up the audience for that moment. Don't launch on
Product Hunt before the app has all Phase 1 UX polish complete.
DESCRIPTIONS
Short (tagline — hero text)
Search the world's visual archives. All at once.
Medium (website subheadline — 2 sentences)
InspoSearch searches 80+ museums, archives, and cultural databases simultaneously — no signup, no friction, just images. Built for designers, artists,
and researchers who think in pictures.
Long (About page)
InspoSearch is an open-source visual research engine that aggregates the world's public cultural archives into a single explorable interface. Search the
Met, NASA, Rijksmuseum, iNaturalist, the Library of Congress, and dozens more simultaneously — then connect, analyse, and collect what you find into
boards. The AI layer is opt-in and user-keyed, so the core experience is always free, always fast, and never rate-limited. Built in 3 nights by one person.
Free forever.
For README (GitHub)
A free, open-source visual research engine. One search — results from 80+ cultural archives simultaneously. Museums, libraries, NASA, natural history
databases, historical photo archives. No signup. No accounts. No ads. Add a new source with one JSON file.
ANTHROPIC PARTNERSHIP PITCH
Subject: Partnership inquiry — InspoSearch, open-source visual research engine
Hi Anthropic team,
I'm Malakai, a solo builder. I built InspoSearch (insposearch.netlify.app) — a free, open-source visual research engine that searches 80+ cultural
archives simultaneously, including the Met, NASA, Rijksmuseum, Library of Congress, iNaturalist, and more.
It was built solo in 3 nights and already has a fully functional multi-provider AI layer that supports Claude (Sonnet), Gemini, and GPT-4o. Users bring
their own keys. The AI finds conceptual connections between images, analyses visual themes, and in the next version, acts as a creative research
assistant via a chat panel with canvas snapshot context.
Claude's vision capabilities are genuinely the best option for the conceptual analysis feature — the kind of unexpected, poetic connections between a
17th century Dutch painting and a NASA photograph that makes designers stop and think.
I'm looking for:
API credits to keep the tool free for users who don't have their own Claude key
A conversation about what a formal partnership could look like
The tool: insposearch.netlify.app The code: [GitHub link — add before sending]
This is open cultural infrastructure. It should stay free forever. Claude can be the AI that powers it.
— Malakai
NEXT IMPLEMENTATION IDEAS (Prioritized)
Immediate (do before Product Hunt)
1. GitHub remote setup — git remote add origin + push. Public repo with README.
2. CONTRIBUTING.md — How to add a source in 5 minutes. This is how you get to 1000.
3. imageUrlTemplate in adapter — unlocks dozens of blocked sources
4. Fashion category filter pill in UI — surfaces fashion sources distinctly
5. Mobile layout pass — test on iPhone, fix any layout breaks
6. GitHub Actions source validator — auto-validate new manifest entries on PR
Short term (next 2 weeks)
7. Source health dashboard — shows which sources returned results on last search
8. Keyboard navigation — J/K to navigate images, S to select, B to board
9. Shareable board URLs — boards as URL-encoded state or short links
10. Pre-loaded demo search — "ruins" search pre-loaded on first visit behind onboarding
11. imageUrlTemplate batch — add DigitalCommonwealth, Fitzwilliam, NHM London
Medium term (month 2)
12. Community source submission flow — PR template + auto-validation
13. Educator mode — curated source sets for design schools (pitch to Parsons, CSM)
14. Browser extension — right-click any image → find related in InspoSearch
15. InspoSearch API — let other tools query it (opens partnership possibilities)
16. Fashion deep-dive — activate all 50 fashion sources, dedicated fashion landing
Long term (month 3+)
17. Institutional partnerships — museums as "featured sources" with logo placement
18. White-label — InspoSearch for design schools and studios
19. AI provider default — Claude as default with Anthropic partnership credits
20. Collections — public boards other users can discover and follow
IMPLEMENTATION ORDER FOR COPILOT
inspo-builder:
1. git remote add origin [new GitHub repo URL] && git push -u origin main
2. Implement imageUrlTemplate in fetchIIIFCollection adapter
3. Add fashion category filter pill to UI
4. Mobile layout pass
5. CONTRIBUTING.md + README.md
source-adder:
6. Add DigitalCommonwealth using imageUrlTemplate
7. Add fashion sources from Tier 1 (no-key-required list)
8. Add paintings sources (manifest entries for Fitzwilliam, Albertina)
9. Test and activate all new sources 3 terms each
inspo-reviewer:
10. Full audit after each batch
11. Update CURRENT_STATE.md
12. Flag any broken sources from previous batches
TECHNICAL NOTES FOR COPILOT
Stack: Vanilla JS, single HTML file (~11,300 lines), no framework
Storage: localStorage only — no backend ever
AI: client-side fetch to provider APIs, canvas snapshot = 1 request per session
Sources: JSON manifest in /sources/ + hardcoded adapters in index.html
CORS: handled per-source (direct, best-effort, or proxy)
Deploy: Netlify drop zone — drag /insposearch/ subfolder only (not project root)
Git: initialized locally, needs remote setup (GitHub)
File structure (deploy folder only)
insposearch/
├── index.html ← entire app (~11k lines)
├── sources.manifest.json
└── sources/
 ├── museum_digital_smb.json
 ├── museum_digital_nat.json
 ├── museum_digital_westfalen.json
 └── [new sources go here]
Files that stay local (never deploy)
INSPOSEARCH_MASTERPLAN.md
InspoSearch-Expansion-V2.md ← this file
CURRENT_STATE.md
FIXES_PLAN.md
_phase*_append.md
_batch*_append.md
Built by Malakai · GI-Synth · Open source · Free forever "Magical without AI. Better with it."
