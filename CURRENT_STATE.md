# Current State — InspoSearch

**Last Updated:** March 22, 2026 (updated)

## Completed Work

### ✅ Added CURRENT_STATE.md Read/Update Discipline to Frontend Engineer Agent
**File:** [.github/agents/insposearch-frontend.agent.md](.github/agents/insposearch-frontend.agent.md)

The Working Style section now mandates:
- Read `CURRENT_STATE.md` **before** starting any task.
- Update `CURRENT_STATE.md` **after** finishing any task.

---

### ✅ Created InspoSearch Source Integrator Agent
**File:** [.github/agents/insposearch-source-integrator.agent.md](.github/agents/insposearch-source-integrator.agent.md)

A new workspace-level custom agent for narrowly focused source-manifest integration work.

**Scope:**
- Adding and validating new image sources using the JSON manifest schema
- API verification, CORS assessment, field mapping
- Requires 3 search-term tests before confirming a source
- Restricted tools: `read`, `search`, `edit`, `execute`, `web`

**Schema Reference:**
- Manifest schema: [INSPOSEARCH_MASTERPLAN.md#L113](INSPOSEARCH_MASTERPLAN.md#L113)
- Source README: [insposearch/sources/README.md](insposearch/sources/README.md)
- Template: [insposearch/sources/_template.json](insposearch/sources/_template.json)

**Open Policy Questions:**
1. Can the agent create/modify adapter code if a source doesn't fit existing adapters?
2. Should key-required APIs be allowed (schema supports them)?
3. Should "3 search terms" include local app UI testing, or API-level only?

---

## Pending Work

**Phase 2 — Still Pending:**
- **2.2 More IIIF sources** — Stanford, Harvard IIIF, BnF/Gallica IIIF, NGA IIIF, LC IIIF not yet in manifest
- **2.3 Aggregator sub-collections** — Europeana sub-collections not surfaced; DPLA hubs need a key first
- **2.4 Specialized DBs** — Fashion, Film, Architecture, Vintage DBs not yet in manifest
- **heidelberg** — Needs correct API path (tried `/api/v1/items` and `/api/v1/search`, both 404)
- **kb_nl** — Needs correct image/collections endpoint (not the Linked Data API)
- **botanicus** — Domain unreachable; consider replacing with BHL illustrations API
- **DPLA sources** — Waiting on user to add DPLA key to localStorage (`inspo_dpla_key`)

---

## Agent Reference

Two workspace-level agents now available:

| Agent | File | Purpose |
|-------|------|---------|
| **InspoSearch Frontend Engineer** | `insposearch-frontend.agent.md` | Phase-by-phase feature implementation, preserving dark monospace aesthetic, vanilla frontend code |
| **InspoSearch Source Integrator** | `insposearch-source-integrator.agent.md` | Add/validate sources using manifest schema, verify APIs, test CORS, ensure field mappings |

*(and InspoSearch Design & Code Reviewer agent, for code/UI review)*

---

## Next Steps (for future sessions)

1. **Research heidelberg correct API** — try `/api/v1/collections`, `/search`, or Solr endpoint
2. **Research kb_nl correct API** — try KB collections portal or memory-of-the-netherlands API
3. **Replace botanicus** with working BHL illustrations endpoint, or investigate if domain is temporarily down
4. **Add DPLA key** to localStorage to unlock `dpla_nypl` and `dpla_digital_commonwealth`
5. **Add more IIIF institutions** to manifest — Stanford, Harvard, NGA, BnF using `iiif_search` adapter
6. **Phase 4 kickoff** — push to GitHub public repo, polish `CONTRIBUTING.md`, add GitHub Actions manifest validator
7. Clarify the 3 open policy questions for Source Integrator agent
