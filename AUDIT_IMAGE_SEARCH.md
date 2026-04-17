# InspoSearch Image Search Audit

This repository includes an audit harness for evaluating how different query words behave across the app's image search sources.

## What it does

- reads a list of query words from a text file
- runs each query against the app's fetcher pipeline
- captures returned item metadata and scores
- writes a Markdown audit report with the top results
- auto-flags likely noisy or poorly matched items

## Usage

1. Create a word list file, one word or phrase per line:

```text
apple
tulip
bronze
conference
astronomy
```

2. Run the audit:

```bash
node scripts/audit-image-search.js --words wordlist.txt --out reports/audit-batch-01.md --mode explore --limit 15
```

Or with npm:

```bash
npm run audit:search -- --words wordlist.txt --out reports/audit-batch-01.md --mode explore --limit 15
```

3. Open the generated report file and inspect each query section.

## Options

- `--words <file>`: path to newline-delimited query words
- `--out <file>`: output report path
- `--mode <explore|exact>`: audit in explore or exact mode
- `--limit <n>`: top results to include per query
- `--concurrency <n>`: number of parallel fetcher calls

## Output

The generated Markdown report contains:

- query summary
- result counts
- top results table
- auto-quality tagging (`good`, `borderline`, `bad`)
- suggested fix ideas based on noisy patterns

## Example

```bash
node scripts/audit-image-search.js --words wordlist.txt --out reports/audit-batch-01.md --mode explore --limit 12
```

Run this as many times as you like with different word sets.
