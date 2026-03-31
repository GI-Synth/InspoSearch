# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 1.x (current) | ✅ Yes |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub Issues.**

If you discover a security issue in InspoSearch, please report it by emailing the maintainer directly (see the GitHub profile for contact). You can also open a [GitHub Security Advisory](https://github.com/GI-Synth/InspoSearch/security/advisories/new) — this keeps the report confidential until it is resolved.

Please include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fix (optional)

We will acknowledge your report within 72 hours and aim to resolve confirmed vulnerabilities within 14 days.

## Security Notes for Users

- **API keys are stored in your browser's `localStorage` only.** They are never sent to InspoSearch servers (there are none). They go directly from your browser to the respective API (Gemini, Claude, OpenAI, etc.).
- **Use free-tier or test keys.** Never paste production keys into a browser-based tool.
- **InspoSearch is a static site.** There is no backend, no database, no user accounts. The attack surface is limited to client-side JavaScript.

## Scope

In scope for security reports:
- XSS vulnerabilities in result rendering
- Leaked API keys via the build pipeline or logs
- CSP bypass that allows injected scripts

Out of scope:
- Vulnerabilities in third-party APIs that InspoSearch queries
- Denial-of-service against external museum APIs
