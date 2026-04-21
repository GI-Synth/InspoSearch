# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in InspoSearch, please report it responsibly.

**Email:** Open a private security advisory via [GitHub Security Advisories](https://github.com/GI-Synth/InspoSearch/security/advisories/new)

**Do not** open a public issue for security vulnerabilities.

## Scope

InspoSearch is a client-side application. The main security considerations are:

- **API key exposure** — User-provided API keys are stored in `localStorage` and never transmitted to our servers
- **Content Security Policy** — CSP headers restrict script and resource origins
- **CORS proxy** — The Cloudflare Worker proxies requests without storing data
- **No user accounts** — No authentication, no passwords, no personal data collected

## Supported Versions

Only the latest version deployed to `insposearch.org` is supported.
