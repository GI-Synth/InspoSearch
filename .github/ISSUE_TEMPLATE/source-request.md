---
name: "Add source"
about: "Request a new image source be added to InspoSearch"
title: "Add source: [SOURCE NAME]"
labels: ["source-request"]
assignees: []
---

## Source details

**Name:** <!-- e.g. Smithsonian Open Access -->
**URL:** <!-- e.g. https://www.si.edu/openaccess -->
**API docs:** <!-- URL to the API documentation, if any -->

## Why this source belongs in InspoSearch

<!-- What makes it special? What kinds of images does it have? Why would researchers / designers / artists care about it? -->

## Access

- [ ] Free to access — no API key required
- [ ] Free API key (instant signup)
- [ ] Free API key (requires approval)
- [ ] Requires paid access ← _stop here, we don't add paid sources_

## Image license

<!-- Are the images public domain, CC-licensed, or open access? Describe what you know. -->

## CORS

- [ ] API allows direct browser requests (CORS enabled) — check by opening the API URL in DevTools
- [ ] Requires a proxy

## Example API call

```
GET https://api.example.org/search?q=bird&limit=10
```

<!-- Paste a working API URL that returns JSON with images -->

## Are you willing to write the fetch function?

- [ ] Yes, I'll submit a PR with the source manifest + fetch code
- [ ] No, I'm just requesting it
