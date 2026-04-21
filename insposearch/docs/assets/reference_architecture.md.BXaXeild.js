import{_ as a,o as n,c as e,ag as p}from"./chunks/framework.OsDJF_Ea.js";const u=JSON.parse('{"title":"Architecture","description":"","frontmatter":{},"headers":[],"relativePath":"reference/architecture.md","filePath":"reference/architecture.md"}'),i={name:"reference/architecture.md"};function t(l,s,r,o,c,d){return n(),e("div",null,[...s[0]||(s[0]=[p(`<h1 id="architecture" tabindex="-1">Architecture <a class="header-anchor" href="#architecture" aria-label="Permalink to &quot;Architecture&quot;">​</a></h1><p>InspoSearch is a single-page application built with vanilla JavaScript. The entire app runs in the browser — no backend server, no build step, no framework.</p><h2 id="module-map" tabindex="-1">Module Map <a class="header-anchor" href="#module-map" aria-label="Permalink to &quot;Module Map&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>app.js</span></span>
<span class="line"><span>  search/</span></span>
<span class="line"><span>    searchController.js    orchestrates parallel searches</span></span>
<span class="line"><span>    queryBuilder.js        builds API URLs from source manifests</span></span>
<span class="line"><span>    responseParser.js      normalises responses to common schema</span></span>
<span class="line"><span>  sources/</span></span>
<span class="line"><span>    sourceRegistry.js      source manifest store and lookup</span></span>
<span class="line"><span>    sourceCategories.js    category grouping logic</span></span>
<span class="line"><span>    adapters/</span></span>
<span class="line"><span>      restAdapter.js       generic REST API adapter</span></span>
<span class="line"><span>      iiifAdapter.js       IIIF manifest adapter</span></span>
<span class="line"><span>      scrapeAdapter.js     HTML scraping adapter</span></span>
<span class="line"><span>  ui/</span></span>
<span class="line"><span>    resultGrid.js          masonry image grid rendering</span></span>
<span class="line"><span>    detailView.js          full-size image and metadata panel</span></span>
<span class="line"><span>    boardView.js           freeform pinboard canvas</span></span>
<span class="line"><span>    searchBar.js           input handling and keyboard shortcuts</span></span>
<span class="line"><span>    sourceFilter.js        sidebar source toggles</span></span>
<span class="line"><span>    keysPanel.js           API key management UI</span></span>
<span class="line"><span>    deepZoom.js            OpenSeadragon IIIF viewer</span></span>
<span class="line"><span>    constellation.js       3D point cloud visualisation</span></span>
<span class="line"><span>    colourExtract.js       dominant colour extraction</span></span>
<span class="line"><span>    themeManager.js        dark/light theme state</span></span>
<span class="line"><span>  ai/</span></span>
<span class="line"><span>    aiController.js        optional AI research assistant</span></span>
<span class="line"><span>    providers/</span></span>
<span class="line"><span>      gemini.js            Google Gemini adapter</span></span>
<span class="line"><span>      claude.js            Anthropic Claude adapter</span></span>
<span class="line"><span>      openai.js            OpenAI adapter</span></span>
<span class="line"><span>      ollama.js            Ollama local adapter</span></span>
<span class="line"><span>  state/</span></span>
<span class="line"><span>    store.js               central state container</span></span>
<span class="line"><span>    actions.js             state mutation functions</span></span>
<span class="line"><span>    persistence.js         localStorage read/write</span></span>
<span class="line"><span>  utils/</span></span>
<span class="line"><span>    debounce.js            input debouncing</span></span>
<span class="line"><span>    imageProxy.js          CORS proxy for thumbnails</span></span>
<span class="line"><span>    rateLimit.js           per-source rate limiter</span></span>
<span class="line"><span>    offlineCache.js        service worker cache layer</span></span></code></pre></div><h2 id="data-flow" tabindex="-1">Data Flow <a class="header-anchor" href="#data-flow" aria-label="Permalink to &quot;Data Flow&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>User types query</span></span>
<span class="line"><span>       |</span></span>
<span class="line"><span>       v</span></span>
<span class="line"><span>  searchBar.js</span></span>
<span class="line"><span>       |</span></span>
<span class="line"><span>       v</span></span>
<span class="line"><span>  searchController.js --- for each enabled source ---&gt; queryBuilder.js</span></span>
<span class="line"><span>       |                                                     |</span></span>
<span class="line"><span>       |                                             builds API URL</span></span>
<span class="line"><span>       |                                                     |</span></span>
<span class="line"><span>       |                        &lt;-- parallel fetch() calls --+</span></span>
<span class="line"><span>       |</span></span>
<span class="line"><span>       v</span></span>
<span class="line"><span>  responseParser.js --- normalise to common schema</span></span>
<span class="line"><span>       |</span></span>
<span class="line"><span>       v</span></span>
<span class="line"><span>    store.js --- update state with new results</span></span>
<span class="line"><span>       |</span></span>
<span class="line"><span>       v</span></span>
<span class="line"><span>   resultGrid.js --- render image tiles</span></span>
<span class="line"><span>       |</span></span>
<span class="line"><span>       v</span></span>
<span class="line"><span>  User clicks image</span></span>
<span class="line"><span>       |</span></span>
<span class="line"><span>       v</span></span>
<span class="line"><span>   detailView.js --- show full metadata + source link</span></span>
<span class="line"><span>       |</span></span>
<span class="line"><span>       +---&gt; deepZoom.js (if IIIF)</span></span>
<span class="line"><span>       +---&gt; colourExtract.js (extract palette)</span></span>
<span class="line"><span>       +---&gt; aiController.js (optional analysis)</span></span>
<span class="line"><span>       +---&gt; Interpret: cross-reference across sources</span></span></code></pre></div><h2 id="state-management" tabindex="-1">State Management <a class="header-anchor" href="#state-management" aria-label="Permalink to &quot;State Management&quot;">​</a></h2><p>InspoSearch uses a minimal custom store pattern:</p><div class="language-js vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">const</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> state</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> =</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  query: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  mode: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;exact&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  results: [],</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  sources: [],</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  enabledSources: [],</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  apiKeys: {},</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  loading: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">false</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  selectedImage: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">null</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  board: [],</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  constellation: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">null</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  aiProvider: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">null</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><p>State flows one-way: actions mutate the store, UI modules subscribe to changes via a simple event emitter.</p><h3 id="key-state-transitions" tabindex="-1">Key State Transitions <a class="header-anchor" href="#key-state-transitions" aria-label="Permalink to &quot;Key State Transitions&quot;">​</a></h3><table tabindex="0"><thead><tr><th>Action</th><th>Trigger</th><th>State Change</th></tr></thead><tbody><tr><td>SEARCH_START</td><td>User presses Enter</td><td><code>loading: true</code>, <code>results: []</code></td></tr><tr><td>RESULTS_APPEND</td><td>A source responds</td><td>Append to <code>results</code>, re-render grid</td></tr><tr><td>SEARCH_COMPLETE</td><td>All sources resolved</td><td><code>loading: false</code></td></tr><tr><td>SELECT_IMAGE</td><td>User clicks thumbnail</td><td><code>selectedImage</code> set, open detail view</td></tr><tr><td>TOGGLE_SOURCE</td><td>Sidebar checkbox</td><td>Update <code>enabledSources</code></td></tr><tr><td>SET_API_KEY</td><td>Keys panel input</td><td>Update <code>apiKeys</code>, save to <code>localStorage</code></td></tr><tr><td>PIN_TO_BOARD</td><td>Board action</td><td>Add image to <code>board</code> array</td></tr><tr><td>SET_MODE</td><td>Mode switcher</td><td>Toggle <code>mode</code> between exact and explore</td></tr><tr><td>SET_AI_PROVIDER</td><td>AI config</td><td>Set <code>aiProvider</code> (gemini, claude, openai, ollama)</td></tr></tbody></table><h2 id="key-design-decisions" tabindex="-1">Key Design Decisions <a class="header-anchor" href="#key-design-decisions" aria-label="Permalink to &quot;Key Design Decisions&quot;">​</a></h2><ol><li>No framework — vanilla JS for zero build overhead and instant load</li><li>No backend — all API calls go directly from browser to source APIs</li><li>Parallel fetch — all enabled sources queried simultaneously via <code>Promise.allSettled()</code></li><li>Progressive rendering — results appear as each source responds, not after all complete</li><li>Local-only persistence — API keys, boards, and preferences stored in <code>localStorage</code></li><li>Optional AI — AI features are completely optional. The app works fully without any AI integration</li><li>IIIF-native — deep zoom for any IIIF-compatible source via OpenSeadragon</li></ol>`,14)])])}const k=a(i,[["render",t]]);export{u as __pageData,k as default};
