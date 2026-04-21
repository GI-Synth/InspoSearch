/**
 * DEPRECATED — use scripts/update-source-counts.js instead.
 *
 * This script used an unverifiable LAST_KNOWN_DYNAMIC = 2300 constant that
 * inflated totals well beyond what the app could actually reach. It has
 * been superseded by scripts/update-source-counts.js, which reads
 * insposearch/data/_source_counts.json (derived from _source_audit.json)
 * and propagates the same numbers the runtime shows.
 */
console.error('[deprecated] scripts/update-source-count.cjs has been replaced.');
console.error('             Run: node scripts/update-source-counts.js');
process.exit(2);
