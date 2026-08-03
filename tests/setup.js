// Browser-global stubs so src/state.js can be imported under node/vitest.
if (typeof globalThis.location === 'undefined') {
  globalThis.location = { search: '', hash: '', href: 'http://localhost/', pathname: '/' };
}
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = {
    _s: new Map(),
    getItem(k) { return this._s.has(k) ? this._s.get(k) : null; },
    setItem(k, v) { this._s.set(k, String(v)); },
    removeItem(k) { this._s.delete(k); },
    clear() { this._s.clear(); },
  };
}
if (typeof globalThis.sessionStorage === 'undefined') {
  globalThis.sessionStorage = {
    _s: new Map(),
    getItem(k) { return this._s.has(k) ? this._s.get(k) : null; },
    setItem(k, v) { this._s.set(k, String(v)); },
    removeItem(k) { this._s.delete(k); },
    clear() { this._s.clear(); },
  };
}
if (typeof globalThis.document === 'undefined') {
  const body = { classList: { add() {}, remove() {}, toggle() {} } };
  globalThis.document = { documentElement: { lang: 'en' }, body };
}
// src/core.js reads DOM nodes at module scope (source counters); a null-returning
// stub is enough for the pure logic under test.
if (typeof globalThis.document.getElementById !== 'function') {
  globalThis.document.getElementById = () => null;
}
