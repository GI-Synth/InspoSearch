/**
 * generate-i18n.cjs — Batch-translate i18n strings to 50 locales via local Ollama
 *
 * Usage:  node scripts/generate-i18n.cjs [model]
 * Default model: qwen3-coder:30b
 * Output: src/i18n-generated.json
 *
 * Supports resume — re-run to pick up where it left off.
 */

const fs = require('fs');
const path = require('path');

const MODEL = process.argv[2] || 'qwen3-coder:30b';
const OLLAMA_URL = 'http://localhost:11434/api/chat';

const EN = {
  searchPlaceholder:  'search',
  filterPlaceholder:  'filter loaded...',
  explore:            'explore',
  exact:              'exact',
  advanced:           'advanced',
  images:             'images',
  view:               'view',
  grid:               'grid',
  board:              'board',
  threeD:             '3d',
  searchByColor:      'search by color',
  bw:                 'b&w',
  sketch:             'sketch',
  chat:               '\u2726 chat',
  browse:             'browse',
  institutions:       'institutions',
  apiKeys:            'api keys',
  settings:           'settings',
  selected:           'selected',
  panelHint:          'click any image to begin',
  palette:            'palette',
  aiAnalysis:         'ai analysis',
  concepts:           'concepts',
  analyseWithAi:      'analyse with ai',
  exploreRelated:     'explore related',
  viewArtist:         'view artist',
  source:             'source',
  loadMore:           'load more',
  loading:            'loading\u2026',
  didYouMean:         'did you mean',
  worksInResults:     'works in results',
  advancedSearch:     'advanced search',
  query:              'query',
  filters:            'filters',
  dateRange:          'date range',
  yearFrom:           'from year',
  yearTo:             'to year',
  medium:             'medium / type',
  orientation:        'orientation',
  region:             'region',
  category:           'source category',
  exclude:            'exclude terms',
  license:            'license',
  anyLicense:         'any',
  cc0License:         'CC0 / Public Domain only',
  ccByLicense:        'Creative Commons (CC-BY and above)',
  openLicense:        'all open licenses',
  anyOrientation:     'any',
  portrait:           'portrait',
  landscape:          'landscape',
  square:             'square',
  reset:              'reset',
  apply:              'search',
  noResults:          'no results',
  language:           'language',
  searchAllBy:        'search all works by',
  excludePlaceholder: 'words to exclude (comma separated)',
  queryPlaceholder:   'type anything\u2026',
  dominantColor:      'filter by dominant color',
  hexPalette:         'hex color palette',
  hexColorPlaceholder:'#ff5733',
  noKeyNote:          'add a gemini key in the keys panel to enable ai features',
  begin:              'begin with an image, a word, a feeling',
  tryTerms:           'try: texture / light / form / shadow',
  viaEuropeana:       'via',
  viewOnEuropeana:    'view on Europeana',
};

const NEW_LOCALES = [
  'af','ar','bg','bn','ca','cs','cy','da','el','et',
  'fa','fi','ga','he','hi','hr','hu','id','is','ja',
  'ka','kk','ko','lt','lv','mk','ms','mt','nb','pl',
  'pt','ro','ru','sk','sl','sq','sr','sv','sw','ta',
  'th','tr','uk','vi','zh',
];

const LANG_NAMES = {
  af:'Afrikaans',ar:'Arabic',bg:'Bulgarian',bn:'Bengali',ca:'Catalan',
  cs:'Czech',cy:'Welsh',da:'Danish',el:'Greek',et:'Estonian',
  fa:'Persian',fi:'Finnish',ga:'Irish',he:'Hebrew',hi:'Hindi',
  hr:'Croatian',hu:'Hungarian',id:'Indonesian',is:'Icelandic',ja:'Japanese',
  ka:'Georgian',kk:'Kazakh',ko:'Korean',lt:'Lithuanian',lv:'Latvian',
  mk:'Macedonian',ms:'Malay',mt:'Maltese',nb:'Norwegian Bokm\u00e5l',pl:'Polish',
  pt:'Portuguese',ro:'Romanian',ru:'Russian',sk:'Slovak',sl:'Slovenian',
  sq:'Albanian',sr:'Serbian',sv:'Swedish',sw:'Swahili',ta:'Tamil',
  th:'Thai',tr:'Turkish',uk:'Ukrainian',vi:'Vietnamese',zh:'Chinese Simplified',
};

async function ollamaChat(prompt) {
  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: { temperature: 0.1, num_predict: 8192 },
      format: 'json',
    }),
  });
  if (!res.ok) throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.message?.content || '';
}

async function translateLocale(locale) {
  const langName = LANG_NAMES[locale];
  const prompt = `Translate these English UI strings for a cultural heritage image search app into ${langName} (locale code: ${locale}).

RULES:
- Keep translations SHORT \u2014 these are UI labels
- Do NOT translate: "CC0", "CC-BY", "Creative Commons", "Europeana", "Gemini", "#ff5733", "3d", "\u2726 chat"
- For "b&w", use the local short form for "black & white"
- For "via" in viaEuropeana, use the local equivalent preposition
- Return ONLY a JSON object with the same keys, translated values

English strings:
${JSON.stringify(EN, null, 2)}

Return a single JSON object with the translated strings for ${langName}. No explanation, no markdown, just the JSON object.`;

  const raw = await ollamaChat(prompt);

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON found in response');
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  }

  return parsed;
}

async function main() {
  console.log(`Model: ${MODEL}`);
  console.log(`Translating ${Object.keys(EN).length} keys into ${NEW_LOCALES.length} languages via Ollama...\n`);

  const outPath = path.join(__dirname, '..', 'src', 'i18n-generated.json');

  // Resume support
  let allTranslations = {};
  if (fs.existsSync(outPath)) {
    try {
      allTranslations = JSON.parse(fs.readFileSync(outPath, 'utf8'));
      const existing = Object.keys(allTranslations).filter(k => NEW_LOCALES.includes(k));
      if (existing.length) console.log(`Resuming: ${existing.length} locales already done, skipping\n`);
    } catch {}
  }

  const keys = Object.keys(EN);
  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (const locale of NEW_LOCALES) {
    if (allTranslations[locale] && Object.keys(allTranslations[locale]).length >= keys.length * 0.8) {
      skipped++;
      continue;
    }

    process.stdout.write(`  [${skipped + done + failed + 1}/${NEW_LOCALES.length}] ${locale} (${LANG_NAMES[locale]})... `);

    try {
      const translated = await translateLocale(locale);

      let missingCount = 0;
      for (const key of keys) {
        if (!translated[key]) {
          translated[key] = EN[key];
          missingCount++;
        }
      }

      allTranslations[locale] = translated;
      done++;
      console.log(`\u2713${missingCount ? ` (${missingCount} fallbacks)` : ''}`);

      // Save after each locale (crash-safe)
      fs.writeFileSync(outPath, JSON.stringify(allTranslations, null, 2));
    } catch (err) {
      console.log(`\u2717 ${err.message.slice(0, 100)}`);
      failed++;
    }
  }

  console.log(`\n\u2713 Done: ${done} translated, ${skipped} skipped (resume), ${failed} failed`);
  console.log(`  Output: src/i18n-generated.json`);
  console.log(`  Total: ${done + skipped} new + 6 hand-verified = ${done + skipped + 6} locales`);
}

main().catch(err => { console.error(err); process.exit(1); });
