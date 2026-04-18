/* ============================================================
   1. CONSTANTS & CONFIG
============================================================ */
export const CONSTANTS = {
  IMAGE_COUNT_DEFAULT:  80,
  IMAGE_COUNT_MIN:      24,
  IMAGE_COUNT_MAX:      300,
  GEMINI_KEY_STORAGE:   'inspo_gemini_key',
  CLAUDE_KEY_STORAGE:   'inspo_claude_key',
  OPENAI_KEY_STORAGE:   'inspo_openai_key',
  DATAMUSE_MAX:          8,
  MET_LIMIT:            20,
  MET_DETAIL_LIMIT:     40,
  DEBOUNCE_SLIDER:     200,
  RETRY_DELAY:        2000,
  MAX_RESULTS:        5000,
  MAX_CHAT_HISTORY:     20,
  HEALTH_MISS_LIMIT:    10,   // consecutive misses before disabling a source (was 5)
  HEALTH_RECOVERY_MS: 5 * 60 * 1000, // auto-recover paused sources after 5 min
  FETCH_TIMEOUT:      5000,   // default safeFetch timeout (ms)
  COUNTER_DEBOUNCE:    300,   // updateSourcesActiveCounter debounce (ms)
  // Per-source fetch limit overrides — high-inventory sources get larger quotas,
  // low-inventory sources get smaller ones. Falls back to calculated fetchBatch if absent.
  PER_SOURCE_LIMIT: {
    met:         40,
    chicago:     40,
    cleveland:   30,
    va:          30,
    nga:         30,
    gbif:        30,
    loc:         30,
    inaturalist: 30,
    rijksmuseum: 30,
    europeana:   30,
    flickr:      25,
    carnegie:    12,
    cudl:        12,
    folger:      12,
    hallwyl:     12,
    nivaagaard:  12,
  },
};

/* ============================================================
   BADGE_META — single consolidated lookup for badge CSS class + display label
   Each key maps to [cssClass, displayLabel].
============================================================ */
export const BADGE_META = {
  met:              ['met','met'],
  nasa:             ['nasa','nasa'],
  rijksmuseum:      ['rijks','rijks'],     europeana:        ['euro','euro'],
  // Europeana sub-collections — all use badge-euro CSS class
  euro_rijksmuseum: ['euro','rijks·euro'], euro_fashion:     ['euro','fashion·euro'],
  euro_ddb:         ['euro','DDB·euro'],   euro_bnf:         ['euro','BnF·euro'],
  euro_bne:         ['euro','BNE·euro'],   euro_kb:          ['euro','KB·euro'],
  euro_bn_pl:       ['euro','BN·euro'],    euro_nkr:         ['euro','NKR·euro'],
  euro_photography: ['euro','photo·euro'], euro_sounds:      ['euro','sounds·euro'],
  euro_newspapers:  ['euro','news·euro'],  euro_kulturpool:  ['euro','kultur·euro'],
  euro_hispana:     ['euro','hispana·euro'], euro_nuk:       ['euro','NUK·euro'],
  euro_estonian:    ['euro','estonian·euro'], euro_lithuanian: ['euro','lith·euro'],
  euro_latvian:     ['euro','latvian·euro'], euro_hungarian: ['euro','OSZK·euro'],
  euro_romanian:    ['euro','rom·euro'],   euro_bulgarian:   ['euro','bulg·euro'],
  harvard:          ['harvard','harvard'], smithsonian:      ['smithsonian','si'],
  pexels:           ['pexels','pexels'],   inaturalist:      ['inaturalist','nature'],
  loc:              ['loc','loc'],
  chicago:          ['chicago','chicago'], cleveland:        ['cleveland','cleveland'],
  va:               ['va','v&a'],          flickr:           ['flickr','flickr'],
  pixabay:          ['pixabay','pixabay'], wikiart:          ['wikiart','wikiart'],
  nordic:           ['nordic','nordic'],   getty:            ['getty','getty'],
  nga:              ['nga','nga'],         gbif:             ['gbif','gbif'],
  eol:              ['eol','eol'],         apod:             ['apod','apod'],
  gallica:          ['gallica','gallica'], chronicling:      ['chronicling','chronicle'],
  trove:            ['trove','trove'],
  digitalnz:        ['digitalnz','nz'],    bhl:              ['bhl','bhl'],
  carnegie:         ['carnegie','carnegie'], prado:          ['prado','prado'],
  parismusees:      ['parismusees','paris'], yale:           ['yale','yale'],
  picsum:           ['picsum','picsum'],   usgs:             ['usgs','usgs'],
  cooperhewitt:     ['cooperhewitt','design'], tate:         ['tate','tate'],
  finna:            ['finna','finna'],     soch:             ['soch','sweden'],
  joconde:          ['joconde','orsay'],   mnw:              ['mnw','warsaw'],
  tepapa:           ['tepapa','tepapa'],   dpla:             ['dpla','dpla'],
  ddb:              ['ddb','ddb'],
  artsy:            ['artsy','artsy'],     pas:              ['pas','finds'],
  smg:              ['smg','science'],     auckland:         ['auckland','auckland'],
  photogrammar:     ['photogrammar','fsa'], wellcome:        ['wellcome','wellcome'],
  maas:             ['maas','maas'],       smk:              ['smk','denmark'],
  thyssen:          ['thyssen','thyssen'], wdl:              ['wdl','wdl'],
  walters:          ['walters','walters'], princeton:        ['princeton','princeton'],
  wikidata:         ['wikidata','wikidata'], noaa:           ['noaa','noaa'],
  hubble:           ['hubble','hubble'],   cornell:          ['cornell','cornell'],
  folger:           ['folger','folger'],   onb:              ['onb','austria'],
  nypl:             ['nypl','nypl'],       mak:              ['mak','mak'],
  mna:              ['mna','mna'],         louvre:           ['louvre','louvre'],
  mia:              ['mia','mia'],         lacma:            ['lacma','lacma'],
  munch:            ['munch','munch'],     mauritshuis:      ['mauritshuis','mauritshuis'],
  nationalmuseumse: ['nationalmuseumse','stockholm'], naturalis: ['naturalis','naturalis'],
  nmaahc:           ['nmaahc','nmaahc'],   nasm:             ['nasm','nasm'],
  whitney:          ['whitney','whitney'], nationalzoo:      ['nationalzoo','zoo'],
  gbiflit:          ['gbiflit','gbif-lit'], freersackler:   ['freersackler','freersackler'],
  ago:              ['ago','ago'],         pem:              ['pem','pem'],
  npg:              ['npg','npg'],         louvread:         ['louvread','louvread'],
  unsplash:         ['unsplash','unsplash'], bodleian:       ['bodleian','bodleian'],
  bsb:              ['bsb','bsb'],         cudl:             ['cudl','cambridge'],
  idigbio:          ['idigbio','idigbio'], ala:              ['ala','ala'],
  nasa_images:      ['nasa_images','nasa'],
  musee_orsay:      ['musee_orsay','orsay'],     vangogh_museum:   ['vangogh_museum','van-gogh'],
  khm:              ['khm','khm'],               belvedere:        ['belvedere','belvedere'],
  staedel:          ['staedel','städel'],         rmfab:            ['rmfab','rmfab'],
  guimet:           ['guimet','guimet'],          npm_taipei:       ['npm_taipei','taipei'],
  galliera:         ['galliera','galliera'],       arts_decoratifs:  ['arts_decoratifs','arts-déco'],
  centraal_museum:  ['centraal_museum','centraal'], textile_museum_tilburg: ['textile_museum_tilburg','textile-tilburg'],
  wereldculturen:   ['wereldculturen','wereldcult'],dec_arts_prague:  ['dec_arts_prague','prague-deco'],
  designmuseum_dk:   ['designmuseum_dk','design-dk'], boijmans:         ['boijmans','boijmans'],
  museu_traje:      ['museu_traje','traje'],
  kmska:            ['kmska','kmska'],           amsterdam_museum: ['amsterdam_museum','adam'],
  ngi:              ['ngi','ngi'],               fries_museum:     ['fries_museum','fries'],
  groeninge:        ['groeninge','groeninge'],   groninger:        ['groninger','groninger'],
  moma_wd:          ['moma_wd','moma'],           rijksmuseum_twenthe: ['rijksmuseum_twenthe','twenthe'],
  herzog_anton_ulrich: ['herzog_anton_ulrich','herzog'], galleria_palatina: ['galleria_palatina','palatina'],
  lakenhal:         ['lakenhal','lakenhal'],      teylers:          ['teylers','teylers'],
  alte_pinakothek:  ['alte_pinakothek','alte-pin'], quai_branly:     ['quai_branly','branly'],
};

// ── Phase H — 113 World Museum Collection Sources (data-driven config) ──
export const WD_PHASE_H = [
  // UK (18)
  { id:'nlw',               badge:'nlw',        name:'National Library of Wales',        cat:['museums','archives','art'],     region:'uk',      desc:'Artworks, photographs & manuscripts from Wales', count:18707 },
  { id:'royal_collection',  badge:'royal',      name:'Royal Collection',                 cat:['museums','art'],                region:'uk',      desc:'Paintings, drawings & decorative arts from the British Crown', count:4984 },
  { id:'npg_london',        badge:'npg-uk',     name:'National Portrait Gallery',        cat:['museums','art'],                region:'uk',      desc:'Portraits from the 16th century to present day', count:2508 },
  { id:'rmuseum_greenwich', badge:'greenwich',  name:'Royal Museums Greenwich',          cat:['museums','art','historical'],   region:'uk',      desc:'Maritime art, navigation instruments & astronomy', count:2264 },
  { id:'walker_gallery',    badge:'walker',     name:'Walker Art Gallery',               cat:['museums','art'],                region:'uk',      desc:'Fine art from medieval to contemporary in Liverpool', count:1511 },
  { id:'glasgow_museums',   badge:'glasgow',    name:'Glasgow Museums',                  cat:['museums','art'],                region:'uk',      desc:'Art & cultural heritage across Glasgow collections', count:1387 },
  { id:'birmingham_trust',  badge:'birm',       name:'Birmingham Museums Trust',         cat:['museums','art'],                region:'uk',      desc:'Pre-Raphaelites & European fine art in Birmingham', count:1293 },
  { id:'ashmolean',         badge:'ashmolean',  name:'Ashmolean Museum',                 cat:['museums','art'],                region:'uk',      desc:'Art & archaeology — oldest public museum in UK', count:1257 },
  { id:'sheffield_museums', badge:'sheffield',  name:'Sheffield Museums',                cat:['museums','art'],                region:'uk',      desc:'Art, metalwork & social history in Sheffield', count:1187 },
  { id:'manchester_gallery',badge:'manchester', name:'Manchester Art Gallery',           cat:['museums','art'],                region:'uk',      desc:'Fine & decorative art from the 17th century onward', count:1069 },
  { id:'british_library_wd',badge:'bl',         name:'British Library',                  cat:['museums','archives'],           region:'uk',      desc:'Illuminated manuscripts, maps & rare books', count:1064 },
  { id:'bowes_museum',      badge:'bowes',      name:'Bowes Museum',                     cat:['museums','art'],                region:'uk',      desc:'European fine & decorative art in County Durham', count:1013 },
  { id:'norfolk_museums',   badge:'norfolk',    name:'Norfolk Museums',                  cat:['museums','art'],                region:'uk',      desc:'Norwich School of painters & regional history', count:859 },
  { id:'british_museum_wd', badge:'bm',         name:'British Museum',                   cat:['museums','art','historical'],   region:'uk',      desc:'World cultures — antiquities, prints & drawings', count:784 },
  { id:'brighton_museum',   badge:'brighton',   name:'Brighton Museum',                  cat:['museums','art'],                region:'uk',      desc:'Fine art, fashion & world cultures in Brighton', count:735 },
  { id:'bristol_museum',    badge:'bristol',    name:'Bristol City Museum',              cat:['museums','art'],                region:'uk',      desc:'Art, geology & archaeology in Bristol', count:720 },
  { id:'york_gallery',      badge:'york',       name:'York Art Gallery',                 cat:['museums','art'],                region:'uk',      desc:'European paintings & studio pottery in York', count:699 },
  { id:'dulwich_gallery',   badge:'dulwich',    name:'Dulwich Picture Gallery',          cat:['museums','art'],                region:'uk',      desc:'Old Masters in England\'s first purpose-built gallery', count:653 },
  // Netherlands (14)
  { id:'kb_nl',              badge:'kb-nl',     name:'KB National Library',              cat:['museums','archives'],           region:'europe',  desc:'Dutch heritage — prints, maps & manuscripts', count:2062 },
  { id:'dordrechts_museum', badge:'dordrecht',  name:'Dordrechts Museum',               cat:['museums','art'],                region:'europe',  desc:'Dutch art from the Golden Age to modern — Ary Scheffer, Aelbert Cuyp', count:934 },
  { id:'bonnefanten',       badge:'bonnef',     name:'Bonnefanten Museum',               cat:['museums','art'],                region:'europe',  desc:'Old Masters & contemporary art in Maastricht', count:609 },
  { id:'museum_rotterdam',  badge:'rotterdam',  name:'Museum Rotterdam',                 cat:['museums','art','historical'],   region:'europe',  desc:'History, art & culture of Rotterdam', count:515 },
  { id:'kroeller_mueller',  badge:'kroller',    name:'Kröller-Müller Museum',            cat:['museums','art'],                region:'europe',  desc:'Van Gogh, Mondrian & a world-renowned sculpture garden', count:443 },
  { id:'cuypershuis',       badge:'cuypers',    name:'Cuypershuis',                      cat:['museums','art'],                region:'europe',  desc:'Works by Pierre Cuypers, architect of the Rijksmuseum', count:401 },
  { id:'kunstmuseum_denhaag',badge:'denhaag',   name:'Kunstmuseum Den Haag',             cat:['museums','art'],                region:'europe',  desc:'Mondrian collection & decorative arts in The Hague', count:364 },
  { id:'museum_gouda',      badge:'gouda',      name:'Museum Gouda',                     cat:['museums','art'],                region:'europe',  desc:'Gothic altarpieces, civic guard paintings & stained glass', count:354 },
  { id:'mesdag_collection', badge:'mesdag',     name:'Mesdag Collection',                cat:['museums','art'],                region:'europe',  desc:'Barbizon school paintings & Mesdag Panorama', count:286 },
  { id:'jewish_museum_adam',badge:'jm-adam',    name:'Jewish Museum Amsterdam',          cat:['museums','art','historical'],   region:'europe',  desc:'Jewish culture, art & history in Amsterdam', count:263 },
  { id:'stedelijk_alkmaar', badge:'alkmaar',    name:'Stedelijk Museum Alkmaar',         cat:['museums','art'],                region:'europe',  desc:'Golden Age paintings from the Alkmaar region', count:255 },
  { id:'museum_de_waag',    badge:'de-waag',    name:'Museum De Waag',                   cat:['museums','art'],                region:'europe',  desc:'Art & history in the medieval weigh house', count:253 },
  { id:'catharijneconvent',  badge:'catharij',  name:'Museum Catharijneconvent',         cat:['museums','art'],                region:'europe',  desc:'Christian art & culture in Utrecht', count:219 },
  { id:'maritime_rotterdam', badge:'maritime',  name:'Maritime Museum Rotterdam',        cat:['museums','historical'],         region:'europe',  desc:'Maritime history, ship models & navigation', count:216 },
  // Belgium (11)
  { id:'musea_brugge',      badge:'brugge',     name:'Musea Brugge',                     cat:['museums','art'],                region:'europe',  desc:'14 museums in Bruges — Flemish Primitives & city history', count:4145 },
  { id:'kbr_brussels',      badge:'kbr',        name:'Royal Library of Belgium',         cat:['museums','archives'],           region:'europe',  desc:'Prints, maps & illuminated manuscripts in Brussels', count:1788 },
  { id:'msk_ghent',         badge:'msk',        name:'MSK Ghent',                        cat:['museums','art'],                region:'europe',  desc:'Fine art from the Middle Ages to 20th century in Ghent', count:1569 },
  { id:'plantin_moretus',   badge:'plantin',    name:'Museum Plantin-Moretus',           cat:['museums','art','archives'],     region:'europe',  desc:'UNESCO-listed Renaissance printing house in Antwerp', count:1323 },
  { id:'muzee_ostende',     badge:'muzee',      name:'Mu.ZEE',                           cat:['museums','art'],                region:'europe',  desc:'Belgian art from James Ensor to Léon Spilliaert', count:681 },
  { id:'rmah_brussels',     badge:'rmah',       name:'Royal Museums of Art & History',   cat:['museums','art','historical'],   region:'europe',  desc:'Antiquity, non-European civilizations & decorative arts', count:295 },
  { id:'middelheim',        badge:'middel',     name:'Middelheim Museum',                cat:['museums','art'],                region:'europe',  desc:'Open-air sculpture park in Antwerp', count:231 },
  { id:'mayer_van_den_bergh',badge:'mayer',     name:'Museum Mayer van den Bergh',       cat:['museums','art'],                region:'europe',  desc:'Bruegel\'s Dulle Griet & medieval art in Antwerp', count:218 },
  { id:'rubenshuis',        badge:'rubens',     name:'Rubenshuis',                       cat:['museums','art'],                region:'europe',  desc:'Rubens\' home & studio with original works', count:142 },
  { id:'mas_antwerp',       badge:'mas',        name:'Museum aan de Stroom',             cat:['museums','art','historical'],   region:'europe',  desc:'Port history, global cultures & city life in Antwerp', count:137 },
  { id:'gallo_roman',       badge:'gallo-rom',  name:'Gallo-Roman Museum',               cat:['museums','historical'],         region:'europe',  desc:'Archaeological finds from Roman Belgium in Tongeren', count:137 },
  // Germany (18)
  { id:'bavarian_paintings',    badge:'bstgs',  name:'Bavarian State Painting Collections', cat:['museums','art'],             region:'europe',  desc:'9,600+ European paintings across 18 Bavarian galleries', count:9637 },
  { id:'gemaeldegalerie_berlin',badge:'gem-ber', name:'Gemäldegalerie Berlin',           cat:['museums','art'],                region:'europe',  desc:'European painting from 13th–18th century at Kulturforum', count:2058 },
  { id:'kunsthalle_karlsruhe', badge:'karlsruh', name:'Kunsthalle Karlsruhe',           cat:['museums','art'],                region:'europe',  desc:'Medieval to contemporary art in Baden-Württemberg', count:1342 },
  { id:'germanisches_nm',     badge:'gnm',      name:'Germanisches Nationalmuseum',      cat:['museums','art','historical'],   region:'europe',  desc:'German art & culture from prehistory to present in Nuremberg', count:1049 },
  { id:'skd_dresden',         badge:'skd',      name:'Kunstsammlungen Dresden',          cat:['museums','art'],                region:'europe',  desc:'Old Masters & New Masters galleries in Dresden', count:868 },
  { id:'wallraf_richartz',    badge:'wallraf',  name:'Wallraf-Richartz Museum',          cat:['museums','art'],                region:'europe',  desc:'Medieval to early 20th-century art in Cologne', count:800 },
  { id:'augustiner_freiburg', badge:'augustin', name:'Augustiner Museum',                cat:['museums','art'],                region:'europe',  desc:'Art from the Upper Rhine, medieval to Baroque in Freiburg', count:793 },
  { id:'alte_nationalgalerie', badge:'alte-nat', name:'Alte Nationalgalerie',             cat:['museums','art'],                region:'europe',  desc:'19th-century painting & sculpture on Museum Island Berlin', count:702 },
  { id:'hamburger_kunsthalle', badge:'hamburg', name:'Hamburger Kunsthalle',             cat:['museums','art'],                region:'europe',  desc:'Medieval to contemporary art across three connected buildings', count:478 },
  { id:'lenbachhaus',          badge:'lenbach', name:'Lenbachhaus',                      cat:['museums','art'],                region:'europe',  desc:'Blue Rider group — Kandinsky, Marc, Klee in Munich', count:454 },
  { id:'wagner_museum',        badge:'wagner',  name:'Martin von Wagner Museum',         cat:['museums','art'],                region:'europe',  desc:'Antiquities, paintings & prints in Würzburg', count:430 },
  { id:'hessen_kassel',        badge:'kassel',  name:'Hessen Kassel Heritage',           cat:['museums','art'],                region:'europe',  desc:'Old Masters — Rembrandt, Rubens & Tischbein in Kassel', count:422 },
  { id:'kunstbibliothek_berlin',badge:'kb-ber', name:'Kunstbibliothek Berlin',           cat:['museums','art','archives'],     region:'europe',  desc:'Design, photography & graphic arts at Kulturforum', count:338 },
  { id:'schnutgen',             badge:'schnutg', name:'Schnütgen Museum',                cat:['museums','art'],                region:'europe',  desc:'Medieval art — sculpture, textiles, stained glass in Cologne', count:332 },
  { id:'staatsgalerie_stuttgart',badge:'stuttg', name:'Staatsgalerie Stuttgart',         cat:['museums','art'],                region:'europe',  desc:'Old Masters to contemporary, Stirling-Wilford building', count:264 },
  { id:'berlinische_galerie',   badge:'berl-gal',name:'Berlinische Galerie',             cat:['museums','art'],                region:'europe',  desc:'Modern art, photography & architecture made in Berlin', count:245 },
  { id:'westphalian_museum',    badge:'westphal',name:'Westphalian State Museum',        cat:['museums','art'],                region:'europe',  desc:'Art & cultural history in Münster — medieval to modern', count:249 },
  { id:'mdbk_leipzig',          badge:'mdbk',   name:'Museum der bildenden Künste',      cat:['museums','art'],                region:'europe',  desc:'German & European art from late medieval to contemporary in Leipzig', count:211 },
  // France (12)
  { id:'musee_st_raymond',    badge:'st-raym',  name:'Musée Saint-Raymond',              cat:['museums','art','historical'],   region:'europe',  desc:'Roman antiquities & sculpture in Toulouse', count:1741 },
  { id:'musee_hist_france',   badge:'hist-fr',  name:'Museum of the History of France',  cat:['museums','historical'],         region:'europe',  desc:'Historical paintings at the Palace of Versailles', count:966 },
  { id:'versailles_wd',       badge:'versail',  name:'Palace of Versailles',             cat:['museums','art','historical'],   region:'europe',  desc:'Royal portraits, Grand Gallery & garden sculptures', count:856 },
  { id:'musee_conde',         badge:'condé',    name:'Condé Museum',                     cat:['museums','art'],                region:'europe',  desc:'Duc d\'Aumale collection in Château de Chantilly', count:827 },
  { id:'musee_augustins',     badge:'augustns', name:'Musée des Augustins',              cat:['museums','art'],                region:'europe',  desc:'Romanesque & Gothic sculpture plus paintings in Toulouse', count:797 },
  { id:'archives_nationales', badge:'arch-nat', name:'Archives nationales',              cat:['archives','historical'],        region:'europe',  desc:'French national archives — seals, maps & historical documents', count:750 },
  { id:'mba_reims',           badge:'reims',    name:'Musée des Beaux-Arts de Reims',    cat:['museums','art'],                region:'europe',  desc:'Cranach, Delacroix, Corot & the Reims cathedral treasury', count:549 },
  { id:'mnam_paris',          badge:'mnam',     name:'Musée National d\'Art Moderne',    cat:['museums','art'],                region:'europe',  desc:'Modern & contemporary art at Centre Pompidou', count:523 },
  { id:'bnf_wd',              badge:'bnf',      name:'BnF',                              cat:['archives','art'],               region:'europe',  desc:'French national library — prints, photographs & manuscripts', count:499 },
  { id:'mba_dijon',           badge:'dijon',    name:'Musée des Beaux-Arts de Dijon',    cat:['museums','art'],                region:'europe',  desc:'Burgundian tombs, Flemish painting & modern art in Dijon', count:476 },
  { id:'mba_strasbourg',      badge:'strasbrg', name:'Musée des Beaux-Arts de Strasbourg', cat:['museums','art'],             region:'europe',  desc:'Italian, Spanish, Flemish & Dutch Old Masters in Strasbourg', count:468 },
  { id:'musee_grenoble',      badge:'grenoble', name:'Museum of Grenoble',               cat:['museums','art'],                region:'europe',  desc:'European art from 13th century to contemporary in Grenoble', count:447 },
  // Italy (13)
  { id:'museo_egizio',        badge:'egizio',   name:'Museo Egizio',                     cat:['museums','art','historical'],   region:'europe',  desc:'World\'s largest collection of Egyptian antiquities outside Cairo', count:4870 },
  { id:'uffizi_wd',           badge:'uffizi',   name:'Uffizi Gallery',                   cat:['museums','art'],                region:'europe',  desc:'Botticelli, Leonardo, Raphael & Titian in Florence', count:809 },
  { id:'accademia_venice',    badge:'accad-ve', name:'Gallerie dell\'Accademia',         cat:['museums','art'],                region:'europe',  desc:'Venetian painting — Bellini, Giorgione, Titian, Veronese', count:384 },
  { id:'capodimonte',         badge:'capodim',  name:'Museo di Capodimonte',             cat:['museums','art'],                region:'europe',  desc:'Farnese collection & Neapolitan art in Naples', count:253 },
  { id:'naples_archaeology',  badge:'naples',   name:'Naples Archaeological Museum',     cat:['museums','historical'],         region:'europe',  desc:'Pompeii & Herculaneum finds, Farnese marbles & mosaics', count:242 },
  { id:'brera',               badge:'brera',    name:'Pinacoteca di Brera',              cat:['museums','art'],                region:'europe',  desc:'Raphael, Mantegna, Caravaggio in Milan', count:220 },
  { id:'capitoline_museums',  badge:'capitolin', name:'Capitoline Museums',              cat:['museums','art','historical'],   region:'europe',  desc:'Ancient Roman sculpture & Renaissance art on Capitoline Hill', count:188 },
  { id:'castelvecchio',       badge:'castelv',  name:'Castelvecchio Museum',             cat:['museums','art'],                region:'europe',  desc:'Medieval & Renaissance art in Verona — Scarpa-designed galleries', count:177 },
  { id:'ca_rezzonico',        badge:'rezzon',   name:'Ca\' Rezzonico',                   cat:['museums','art'],                region:'europe',  desc:'18th-century Venetian art in a Grand Canal palazzo', count:162 },
  { id:'gallerie_italia',     badge:'gal-ita',  name:'Gallerie d\'Italia',               cat:['museums','art'],                region:'europe',  desc:'19th-century Italian art & Old Masters in Milan', count:153 },
  { id:'galleria_borghese',   badge:'borghese', name:'Galleria Borghese',                cat:['museums','art'],                region:'europe',  desc:'Bernini sculptures, Caravaggio & Raphael in Rome', count:152 },
  { id:'galleria_nazionale',  badge:'gal-naz',  name:'Galleria Nazionale',               cat:['museums','art'],                region:'europe',  desc:'Medieval to Baroque art in Palazzo Barberini, Rome', count:137 },
  { id:'pinacoteca_bologna',  badge:'p-bologna', name:'Pinacoteca di Bologna',           cat:['museums','art'],                region:'europe',  desc:'Bolognese school — Carracci, Guido Reni, Raphael', count:123 },
  // Spain (7)
  { id:'mnac_barcelona',      badge:'mnac',     name:'MNAC Barcelona',                   cat:['museums','art'],                region:'europe',  desc:'Romanesque murals, Gothic art & Catalan modernism', count:941 },
  { id:'mba_cordoba',         badge:'cordoba',  name:'Fine Arts Museum of Córdoba',      cat:['museums','art'],                region:'europe',  desc:'Spanish painting & sculpture from medieval to modern', count:311 },
  { id:'victor_balaguer',     badge:'balaguer', name:'Víctor Balaguer Museum',           cat:['museums','art'],                region:'europe',  desc:'Art collection in Vilanova i la Geltrú, Catalonia', count:283 },
  { id:'marca_spain',         badge:'man-es',   name:'National Archaeological Museum',   cat:['museums','historical'],         region:'europe',  desc:'Iberian, Roman & medieval archaeology in Madrid', count:182 },
  { id:'mba_valencia',        badge:'valencia', name:'Fine Arts Museum of Valencia',     cat:['museums','art'],                region:'europe',  desc:'Valencian Gothic, Ribera, Sorolla & El Greco', count:157 },
  { id:'academia_san_fernando',badge:'san-fern', name:'Royal Academy of San Fernando',   cat:['museums','art'],                region:'europe',  desc:'Goya, Zurbarán & Arcimboldo in Madrid', count:154 },
  { id:'carmen_thyssen',       badge:'c-thyss',  name:'Carmen Thyssen Museum',           cat:['museums','art'],                region:'europe',  desc:'19th-century Spanish painting in Málaga', count:151 },
  // Sweden (5)
  { id:'performing_arts_se',   badge:'perf-se', name:'Swedish Performing Arts Museum',   cat:['museums','art','historical'],   region:'europe',  desc:'Theatre, dance, music & circus history in Stockholm', count:3888 },
  { id:'teknikmuseet',         badge:'teknik',  name:'National Museum of Science & Technology', cat:['museums','science'],      region:'europe',  desc:'Swedish innovation, industry & technology', count:3882 },
  { id:'portraits_se',         badge:'port-se', name:'National Portrait Gallery of Sweden', cat:['museums','art'],             region:'europe',  desc:'Swedish historical portraits from the 16th century to today', count:1600 },
  { id:'hallwyl',              badge:'hallwyl', name:'Hallwyl Museum',                   cat:['museums','art'],                region:'europe',  desc:'Art Nouveau private palace & collection in Stockholm', count:627 },
  { id:'gothenburg_art',       badge:'gbg-art', name:'Gothenburg Museum of Art',        cat:['museums','art'],                region:'europe',  desc:'Nordic art & French Impressionism in Gothenburg', count:456 },
  // Denmark (6)
  { id:'nhm_denmark',          badge:'nhm-dk',  name:'Natural History Museum of Denmark', cat:['museums','science','nature'], region:'europe',  desc:'Zoological, geological & palaeontological collections', count:539 },
  { id:'nivaagaard',           badge:'nivaa',   name:'Nivaagaard Museum',                cat:['museums','art'],                region:'europe',  desc:'Danish Golden Age & Italian Renaissance paintings', count:240 },
  { id:'skagens_museum',       badge:'skagen',  name:'Skagens Museum',                   cat:['museums','art'],                region:'europe',  desc:'Skagen painters — Krøyer, Ancher, Drachmann', count:217 },
  { id:'hirschsprung',         badge:'hirsch',  name:'Hirschsprung Collection',          cat:['museums','art'],                region:'europe',  desc:'Danish Golden Age & Skagen painters in Copenhagen', count:131 },
  { id:'ny_carlsberg',         badge:'glyptk',  name:'Ny Carlsberg Glyptotek',           cat:['museums','art'],                region:'europe',  desc:'Ancient & French Impressionist art in Copenhagen', count:125 },
  { id:'frederiksborg',        badge:'fredbg',  name:'Frederiksborg Castle Museum',      cat:['museums','art','historical'],   region:'europe',  desc:'Danish national history portraits at Frederiksborg Castle', count:114 },
  // Austria (3)
  { id:'albertina',             badge:'albert',  name:'Albertina',                        cat:['museums','art'],                region:'europe',  desc:'Dürer\'s Hare, Monet, Picasso — prints & drawings in Vienna', count:315 },
  { id:'liechtenstein_museum', badge:'liechtn', name:'Liechtenstein Museum',             cat:['museums','art'],                region:'europe',  desc:'Princely collections — Rubens, Van Dyck & decorative arts', count:183 },
  { id:'leopold_museum',       badge:'leopold', name:'Leopold Museum',                   cat:['museums','art'],                region:'europe',  desc:'Egon Schiele, Gustav Klimt & Vienna Secession at MuseumsQuartier', count:101 },
  // USA (3)
  { id:'mfa_boston_wd',         badge:'mfa-bos', name:'Museum of Fine Arts Boston',      cat:['museums','art'],                region:'americas', desc:'Asian, Egyptian, American & European art', count:2895 },
  { id:'mfa_houston',          badge:'mfa-hou', name:'Museum of Fine Arts Houston',     cat:['museums','art'],                region:'americas', desc:'European, American, Latin American & Asian art in Texas', count:714 },
  { id:'famsf',                 badge:'famsf',   name:'Fine Arts Museums of San Francisco', cat:['museums','art'],             region:'americas', desc:'De Young & Legion of Honor — American & European art', count:450 },
  // Other Europe (3)
  { id:'hungarian_gallery',    badge:'hung',    name:'Hungarian National Gallery',       cat:['museums','art'],                region:'europe',  desc:'Hungarian art from medieval to contemporary in Buda Castle', count:528 },
  { id:'finnish_gallery',      badge:'finn-gal', name:'Finnish National Gallery',       cat:['museums','art'],                region:'europe',  desc:'Finnish & international art across Ateneum, Kiasma & Sinebrychoff', count:2692 },
  { id:'bilbao_fine_arts',     badge:'bilbao',  name:'Bilbao Fine Arts Museum',          cat:['museums','art'],                region:'europe',  desc:'Spanish, Basque & European art from the 12th century', count:126 },
];

// Auto-inject Phase H into BADGE_META
WD_PHASE_H.forEach(s => { BADGE_META[s.id] = [s.id, s.badge]; });

/* ============================================================
   POPUP DETECTION + IMMEDIATE THEME APPLY
   (run before any render to prevent flash)
============================================================ */
export const _isBoardPopup = new URLSearchParams(location.search).get('boardpopup') === '1';
(function () {
  const t = localStorage.getItem('inspo_theme');
  if (t === 'dark')  document.body.classList.add('dark');
  if (t === 'light') document.body.classList.remove('dark');
})();

/* ============================================================
   2. STATE
   Single global object — never use separate global vars.
============================================================ */
export const STATE = {
  query:               '',      // current search string
  keywords:            [],      // expanded keyword array
  results:             [],      // all fetched ImageItem[]
  selected:            [],      // selected ImageItem[]
  view:                'grid',  // 'grid' | 'board' | '3d'
  sketchMode:          false,   // boolean
  imageCount:          80,      // images per wave (was slider, now auto-scroll)
  geminiKey:           null,    // string | null (localStorage)
  claudeKey:           null,    // string | null (localStorage)
  openaiKey:           null,    // string | null (localStorage)
  openaiEndpoint:      '',      // custom OpenAI-compatible base URL
  ollamaEndpoint:      'http://localhost:11434', // Ollama base URL
  ollamaModel:         'llava',  // default Ollama vision model
  aiProvider:          'gemini', // 'gemini' | 'claude' | 'openai' | 'ollama'
  chatHistory:         [],      // [{role, content}] conversation log
  chatSnapshot:        null,    // { base64, metadata } grid snapshot
  europeanaKey:        null,    // string | null (localStorage)
  harvardKey:          null,    // string | null (localStorage)
  smithsonianKey:      null,    // string | null (localStorage)
  pexelsKey:           null,    // string | null (localStorage)
  pixabayKey:          null,    // string | null (localStorage)
  flickrKey:           null,    // string | null (localStorage)
  troveKey:            null,    // string | null (localStorage)
  digitalnzKey:        null,    // string | null (localStorage)
  dplaKey:             null,    // string | null (localStorage)
  ddbKey:              null,    // string | null (localStorage)
  artsyId:             null,    // string | null (localStorage)
  artsySecret:         null,    // string | null (localStorage)
  artsyToken:          null,    // runtime only — not persisted
  sourceHealth:        {},       // { sourceName: { hits, misses, lastSeen } }
  loading:             false,   // boolean
  abortController:     null,    // AbortController | null
  prefetchedQuery:     '',      // last query prefetched
  prefetchedKeywords:  [],      // keywords for prefetchedQuery
  currentPage:         1,        // current load-more page
  hubbleCache:         [],      // cached Hubble images (refreshed every 6h)
  hubbleCacheTimestamp: null,   // Date.now() of last Hubble fetch
  crossRefMode:        null,    // null | 'connect' | 'interpret'
  lastGeminiCall:      null,    // timestamp of last Gemini API call (rate limiting)
  geminiDailyCount:    0,       // calls made today
  geminiDailyDate:     null,    // YYYY-MM-DD string for reset check
  disabledSources:     new Set(),  // source IDs to skip in searches
  activePreset:        null,    // 'all'|'none'|group name|null (custom mix)
  crossRefTerms:       [],      // the 8 terms used in cross-ref search
  referenceImages:     [],      // pinned reference images
  floatingBarVisible:  false,   // boolean
  floatingBarHidden:   false,   // user dismissed via × (hide, not clear)
  fuseIndex:           null,    // Fuse.js search index on loaded results
  whitneyCache:        [],      // cached Whitney artworks (refreshed every 24h)
  whitneyCacheTimestamp: null,  // Date.now() of last Whitney fetch
  searchMode:          'explore', // 'explore' | 'exact'
  keywordExpansion:    true,     // enable Datamuse keyword expansion (toggled from settings)
  pendingOnboardingSearch: false, // first-visit guided search
  _searchGen:          0,        // monotonic counter to detect stale results
  _licenseFilter:      null,     // null | 'cc0' | 'cc-by' | 'open'
  _mediumFilter:       null,     // null | 'painting' | 'photograph' | ... (from advanced search)
  _didYouMeanBanner:   null,     // suggested spelling correction shown to user
  _nsfwFilter:         false,    // NSFW filter enabled (sampled Workers AI check)
  _isLikelyArtistQuery: false,  // auto-detected: true when query matches many artist fields
};

// Secondary AbortControllers (refreshSource, fetchMoreResults) tracked for cleanup
export const _secondaryControllers = new Set();
export let _realRenderGrid = null;
export function set_realRenderGrid(fn) { _realRenderGrid = fn; }

export const ONBOARDING_TERMS = ['shadow', 'texture', 'light', 'ruins'];

/* ── Exact-mode source filtering (Phase 2) ── */
// Queries that signal biological/nature intent → skip space sources
export const NATURE_QUERY_TERMS = [
  'beetle','moth','butterfly','lichen','fungus','coral','species','genus',
  'flora','fauna','specimen','fern','moss','algae','mushroom','insect',
  'arachnid','amphibian','reptile','crustacean','orchid','seabird','mammal',
  'polypore','bryophyte','cephalopod','dragonfly','grasshopper','termite',
  'cicada','barnacle','echinoderm','nudibranch','mycelium','lichen',
  'wildflower','blossom','seedpod','herbarium','bird','fish','whale',
  'shark','snake','lizard','frog','toad','newt','salamander','worm',
  'plankton','diatom','protozoa','caterpillar','wasp','bee','hornet','ant',
  'snail','slug','jellyfish','starfish','urchin','sponge','clam','mussel',
];
// Queries that signal space/astronomical intent → skip nature sources
export const SPACE_QUERY_TERMS = [
  'nebula','galaxy','supernova','quasar','exoplanet','asteroid','comet',
  'meteor','orbit','telescope','aurora','cosmos','pulsar','black hole',
  'solar flare','spacecraft','satellite','mars','jupiter','saturn','venus',
  'milky way','constellation','hubble','voyager','iss','astronaut','lunar',
  'mercury','neptune','uranus','pluto','kepler','cassini','gemini mission',
  'apollo mission','space station','rocket','crater','magnetosphere',
  'moon','star','stars','planet','sun','eclipse','solar system','earth',
];
// Source IDs that are domain-locked to nature biology
export const NATURE_ONLY_SOURCES = new Set([
  'inaturalist','gbif','eol','naturalis','nationalzoo','gbiflit',
  'idigbio','ala',
]);
// Source IDs that are domain-locked to space/astronomy
export const SPACE_ONLY_SOURCES = new Set([
  'nasa','nasa_images','apod','hubble','noaa',
]);

export function classifyQuery(q) {
  const lower = (q || '').toLowerCase();
  const isNature = NATURE_QUERY_TERMS.some(t => lower.includes(t));
  const isSpace  = SPACE_QUERY_TERMS.some(t => lower.includes(t));
  return { isNature, isSpace };
}

const SCIENCE_ONLY_SOURCES = new Set(['usgs', 'photogrammar', 'nasa', 'nasa_images']);
// Sources that return too much noise (boats, random buildings) for art queries
const NOISY_FOR_ART = new Set(['finna', 'wikidata']);
// Sources that pollute art/design/history queries in explore mode
const SKIP_FOR_ART = new Set([
  'nasa','nasa_images','apod','hubble','noaa',
  'inaturalist','gbif','eol','naturalis','nationalzoo','gbiflit','idigbio','ala',
  'usgs','photogrammar',
]);
// Sources that pollute nature queries in explore mode
const SKIP_FOR_NATURE = new Set([
  'wikiart','prado','munch','tate','artsy','nga','lacma','whitney',
  'ago','npg','staedel','belvedere','rmfab',
]);

/* Returns true when sourceId should be skipped for this query.
   Works in BOTH modes — saves bandwidth by not querying irrelevant sources. */
export function skipIrrelevantSource(sourceId, queryClass) {
  const hasAnyIntent = queryClass.isNature || queryClass.isSpace || queryClass.isArt ||
                       queryClass.isHistory || queryClass.isArch || queryClass.isDesign ||
                       queryClass.isPhoto || queryClass.isScience;
  // ── Always skip nature-only sources for non-nature queries ──
  if (!queryClass.isNature && NATURE_ONLY_SOURCES.has(sourceId)) return true;
  // ── Space sources: allow for space queries AND generic (no-intent) queries, skip for everything else ──
  if (SPACE_ONLY_SOURCES.has(sourceId) && !queryClass.isSpace && hasAnyIntent) return true;
  if (!queryClass.isScience && !queryClass.isSpace && SCIENCE_ONLY_SOURCES.has(sourceId)) return true;
  // ── Exact mode: also skip noisy sources for art ──
  if (STATE.searchMode === 'exact') {
    if (queryClass.isArt && NOISY_FOR_ART.has(sourceId)) return true;
  }
  // ── Explore mode: skip cross-domain noise ──
  if (STATE.searchMode !== 'exact') {
    const isArtish = queryClass.isArt || queryClass.isDesign || queryClass.isHistory || queryClass.isArch;
    if (isArtish && SKIP_FOR_ART.has(sourceId)) return true;
    if (queryClass.isNature && SKIP_FOR_NATURE.has(sourceId)) return true;
    if (queryClass.isArt && NOISY_FOR_ART.has(sourceId)) return true;
  }
  return false;
}
// Keep old name as alias for backward compatibility


export const SOURCE_DOMAINS = {
  met: 'metmuseum.org',
  nasa: 'images.nasa.gov',
  inaturalist: 'inaturalist.org',
  loc: 'loc.gov',

  chicago: 'artic.edu',
  cleveland: 'clevelandart.org',
  va: 'vam.ac.uk',
  wikiart: 'wikiart.org',
  flickr: 'flickr.com',
  rijksmuseum: 'rijksmuseum.nl',
  rijks: 'rijksmuseum.nl',
  europeana: 'europeana.eu',
  harvard: 'harvardartmuseums.org',
  smithsonian: 'si.edu',
  pexels: 'pexels.com',
  pixabay: 'pixabay.com',
  getty: 'getty.edu',
  nga: 'nga.gov',
  gbif: 'gbif.org',
  eol: 'eol.org',
  apod: 'apod.nasa.gov',
  gallica: 'gallica.bnf.fr',
  chronicling: 'chroniclingamerica.loc.gov',
  trove: 'trove.nla.gov.au',
  digitalnz: 'digitalnz.org',
  bhl: 'biodiversitylibrary.org',
  prado: 'museodelprado.es',
  yale: 'britishart.yale.edu',
  usgs: 'usgs.gov',
  tate: 'tate.org.uk',
  dpla: 'dp.la',
  ddb: 'deutsche-digitale-bibliothek.de',
  artsy: 'artsy.net',
  nypl: 'digitalcollections.nypl.org',
  louvre: 'louvre.fr',
  lacma: 'lacma.org',
  whitney: 'whitney.org',
  gemini: 'aistudio.google.com',
  // Phase 2
  unsplash: 'unsplash.com',
  bodleian: 'digital.bodleian.ox.ac.uk',
  bsb: 'digitale-sammlungen.de',
  cudl: 'cudl.lib.cam.ac.uk',
};

/* ============================================================
   3. SEED_MAP
   Hardcoded associations for art/design terms.
============================================================ */
export const SEED_MAP = {
  brutalism:    ['concrete', 'monolithic', 'raw', 'void', 'weight'],
  fashion:      ['silhouette', 'drape', 'texture', 'body', 'volume'],
  nature:       ['organic', 'erosion', 'growth', 'decay', 'light'],
  minimal:      ['reduction', 'negative space', 'restraint', 'grid', 'white'],
  dark:         ['shadow', 'depth', 'contrast', 'absence', 'night'],
  color:        ['pigment', 'saturation', 'hue', 'spectrum', 'dye'],
  architecture: ['structure', 'facade', 'material', 'threshold', 'proportion'],
  portrait:     ['gaze', 'skin', 'expression', 'identity', 'presence'],
  abstract:     ['form', 'gesture', 'mark', 'field', 'tension'],
  vintage:      ['patina', 'grain', 'fade', 'archive', 'memory'],
};

/* ── Synonym Expansion V2 — art movements, species, historical periods ── */
export const MOVEMENT_SYNONYMS = {
  impressionism:  ['monet','renoir','sisley','pissarro','degas','cézanne','manet','berthe morisot','plein air','en plein air'],
  'post-impressionism': ['van gogh','gauguin','cézanne','seurat','pointillism','toulouse-lautrec','signac'],
  expressionism:  ['munch','kirchner','nolde','kandinsky','marc','die brücke','der blaue reiter'],
  surrealism:     ['dalí','magritte','ernst','miró','tanguy','breton','automatism','dream imagery'],
  cubism:         ['picasso','braque','léger','gris','cubist','fragmentation','multiple perspectives'],
  fauvism:        ['matisse','derain','vlaminck','dufy','bold color','wild beasts'],
  futurism:       ['boccioni','balla','severini','marinetti','speed','dynamism','modern life'],
  dadaism:        ['duchamp','tzara','arp','schwitters','readymade','anti-art','collage'],
  minimalism:     ['judd','flavin','andre','lewitt','stella','serial forms','primary structures'],
  'pop art':      ['warhol','lichtenstein','oldenburg','rosenquist','hamilton','mass media','consumer culture'],
  'art nouveau':  ['mucha','klimt','gaudí','tiffany','guimard','organic line','jugendstil','stile liberty'],
  'art deco':     ['cassandre','erté','tamara de lempicka','chrysler building','geometric luxury','1920s'],
  baroque:        ['caravaggio','bernini','rubens','rembrandt','velázquez','chiaroscuro','dramatic light'],
  romanticism:    ['delacroix','turner','friedrich','constable','goya','sublime','emotion','heroic landscape'],
  realism:        ['courbet','millet','homer','eakins','daumier','working class','social observation'],
  symbolism:      ['moreau','redon','puvis de chavannes','khnopff','esoteric','dream','mystical'],
  'pre-raphaelite': ['rossetti','millais','hunt','burne-jones','waterhouse','medieval revivalism','detailed nature'],
  neoclassicism:  ['david','ingres','canova','thorvaldsen','greek ideal','roman virtue','grand manner'],
  mannerism:      ['pontormo','parmigianino','bronzino','elongated figures','artifice','virtuosity'],
  constructivism: ['tatlin','rodchenko','lissitzky','popova','geometric','revolutionary art','productivism'],
  'abstract expressionism': ['pollock','de kooning','rothko','kline','newman','action painting','color field'],
};

export const SPECIES_SYNONYMS = {
  owl:        ['strigiformes','bubo','tyto','athene noctua','strix'],
  eagle:      ['aquila','haliaeetus','accipitridae','raptor'],
  hawk:       ['accipiter','buteo','raptor','falconiformes'],
  falcon:     ['falco','peregrine','kestrel','falconidae'],
  heron:      ['ardea','ardeidae','egret','great blue heron'],
  crane:      ['grus','gruidae','sandhill crane','whooping crane'],
  parrot:     ['psittacidae','ara','macaw','cockatoo','budgerigar'],
  hummingbird:['trochilidae','archilochus','calypte','iridescent'],
  whale:      ['cetacea','balaenoptera','megaptera','humpback','blue whale'],
  dolphin:    ['delphinidae','tursiops','bottlenose','porpoise'],
  wolf:       ['canis lupus','canidae','grey wolf','timber wolf'],
  bear:       ['ursidae','ursus','grizzly','brown bear','polar bear'],
  deer:       ['cervidae','cervus','odocoileus','white-tailed','elk','stag'],
  fox:        ['vulpes','red fox','arctic fox','fennec'],
  lion:       ['panthera leo','felidae','big cat','african lion'],
  tiger:      ['panthera tigris','bengal tiger','siberian tiger','felidae'],
  elephant:   ['elephantidae','loxodonta','elephas maximus','proboscidea'],
  orchid:     ['orchidaceae','phalaenopsis','cattleya','dendrobium','oncidium'],
  rose:       ['rosa','rosaceae','hybrid tea','floribunda','damask rose'],
  lily:       ['lilium','liliaceae','day lily','tiger lily','madonna lily'],
  fern:       ['polypodiopsida','pteridium','asplenium','dryopteris'],
  mushroom:   ['agaricales','amanita','boletus','fungi','mycology'],
  butterfly:  ['lepidoptera','papilionidae','nymphalidae','monarch','swallowtail'],
  beetle:     ['coleoptera','scarabaeidae','cerambycidae','weevil','ladybug'],
  dragonfly:  ['odonata','anisoptera','libellulidae','damselfly'],
  coral:      ['anthozoa','scleractinia','reef coral','brain coral','staghorn'],
  shark:      ['selachimorpha','carcharodon','great white','hammerhead','requiem'],
  turtle:     ['testudines','cheloniidae','sea turtle','tortoise','terrapin'],
  frog:       ['anura','ranidae','tree frog','dendrobatidae','amphibian'],
  snake:      ['serpentes','colubridae','python','viper','cobra'],
};

export const PERIOD_ALIASES = {
  'belle époque':     ['1871-1914','gilded age','art nouveau era','pre-war paris','la belle époque'],
  'gilded age':       ['1870-1900','belle époque','industrial wealth','american opulence'],
  'jazz age':         ['1920s','roaring twenties','art deco','harlem renaissance','flapper'],
  'middle ages':      ['medieval','5th-15th century','feudalism','gothic','romanesque','illuminated manuscript'],
  'antiquity':        ['ancient','classical','greco-roman','hellenistic','roman empire'],
  'ancient egypt':    ['pharaoh','hieroglyphics','nile','pyramid','tomb painting','papyrus'],
  'ancient greece':   ['hellenistic','attic','red-figure','black-figure','parthenon','amphora'],
  'ancient rome':     ['roman empire','pompeii','fresco','mosaic','colosseum','forum'],
  'edo period':       ['tokugawa','17th-19th century','ukiyo-e','woodblock','kabuki','japanese art'],
  'meiji era':        ['meiji restoration','1868-1912','japanese modernisation','shin-hanga'],
  'ming dynasty':     ['1368-1644','chinese porcelain','blue and white','forbidden city','scroll painting'],
  'qing dynasty':     ['1644-1912','manchu','famille rose','imperial china','canton enamel'],
  'mughal':           ['mughal empire','1526-1857','miniature painting','mughal architecture','taj mahal'],
  'byzantine':        ['eastern roman','icon','mosaic','hagia sophia','gold ground','orthodox art'],
  'viking age':       ['norse','8th-11th century','rune','longship','scandinavian','berserker'],
  'industrial revolution': ['18th century','19th century','factory','steam','victorian','mechanisation'],
  'space age':        ['1960s','nasa','atomic age','midcentury modern','futuristic','space race'],
  'cold war':         ['1947-1991','iron curtain','nuclear age','propaganda','space race'],
  'harlem renaissance': ['1920s','1930s','african american art','jazz','langston hughes','aaron douglas'],
};

/* ============================================================
   3b. MULTILINGUAL ART VOCABULARY MAP
   English art terms → French / German / Dutch / Spanish
   Used to expand queries for multilingual sources (Gallica,
   Rijksmuseum, Prado, museum-digital, DDB, etc.)
============================================================ */
export const MULTILINGUAL_ART_MAP = {
  landscape:    ['paysage','landschaft','landschap','paisaje'],
  portrait:     ['portrait','porträt','portret','retrato'],
  'still life': ['nature morte','stillleben','stilleven','bodegón'],
  flower:       ['fleur','blume','bloem','flor'],
  flowers:      ['fleurs','blumen','bloemen','flores'],
  dog:          ['chien','hund','hond','perro'],
  cat:          ['chat','katze','kat','gato'],
  horse:        ['cheval','pferd','paard','caballo'],
  bird:         ['oiseau','vogel','vogel','pájaro'],
  fish:         ['poisson','fisch','vis','pez'],
  forest:       ['forêt','wald','woud','bosque'],
  sea:          ['mer','meer','zee','mar'],
  ocean:        ['océan','ozean','oceaan','océano'],
  mountain:     ['montagne','berg','berg','montaña'],
  river:        ['rivière','fluss','rivier','río'],
  city:         ['ville','stadt','stad','ciudad'],
  market:       ['marché','markt','markt','mercado'],
  church:       ['église','kirche','kerk','iglesia'],
  castle:       ['château','schloss','kasteel','castillo'],
  woman:        ['femme','frau','vrouw','mujer'],
  man:          ['homme','mann','man','hombre'],
  child:        ['enfant','kind','kind','niño'],
  soldier:      ['soldat','soldat','soldaat','soldado'],
  angel:        ['ange','engel','engel','ángel'],
  light:        ['lumière','licht','licht','luz'],
  shadow:       ['ombre','schatten','schaduw','sombra'],
  gold:         ['or','gold','goud','oro'],
  red:          ['rouge','rot','rood','rojo'],
  blue:         ['bleu','blau','blauw','azul'],
  green:        ['vert','grün','groen','verde'],
  black:        ['noir','schwarz','zwart','negro'],
  white:        ['blanc','weiß','wit','blanco'],
  textile:      ['textile','textil','textiel','textil'],
  fabric:       ['tissu','stoff','stof','tela'],
  lace:         ['dentelle','spitze','kant','encaje'],
  dress:        ['robe','kleid','jurk','vestido'],
  hat:          ['chapeau','hut','hoed','sombrero'],
  tree:         ['arbre','baum','boom','árbol'],
  sun:          ['soleil','sonne','zon','sol'],
  moon:         ['lune','mond','maan','luna'],
  sky:          ['ciel','himmel','hemel','cielo'],
  cloud:        ['nuage','wolke','wolk','nube'],
  fire:         ['feu','feuer','vuur','fuego'],
  water:        ['eau','wasser','water','agua'],
  stone:        ['pierre','stein','steen','piedra'],
  ceramic:      ['céramique','keramik','keramiek','cerámica'],
  manuscript:   ['manuscrit','manuskript','manuscript','manuscrito'],
  map:          ['carte','karte','kaart','mapa'],
  book:         ['livre','buch','boek','libro'],
  print:        ['estampe','druck','prent','grabado'],
  engraving:    ['gravure','gravur','gravure','grabado'],
  drawing:      ['dessin','zeichnung','tekening','dibujo'],
  painting:     ['peinture','gemälde','schilderij','pintura'],
  sculpture:    ['sculpture','skulptur','sculptuur','escultura'],
  photograph:   ['photographie','fotografie','fotografie','fotografía'],
  architecture: ['architecture','architektur','architectuur','arquitectura'],
  ornament:     ['ornement','ornament','ornament','ornamento'],
  fruit:        ['fruit','frucht','fruit','fruta'],
  rose:         ['rose','rose','roos','rosa'],
  lily:         ['lys','lilie','lelie','lirio'],
  tulip:        ['tulipe','tulpe','tulp','tulipán'],
  butterfly:    ['papillon','schmetterling','vlinder','mariposa'],
  shell:        ['coquille','muschel','schelp','concha'],
  vase:         ['vase','vase','vaas','jarrón'],
  garden:       ['jardin','garten','tuin','jardín'],
  village:      ['village','dorf','dorp','pueblo'],
  street:       ['rue','straße','straat','calle'],
  bridge:       ['pont','brücke','brug','puente'],
  ship:         ['navire','schiff','schip','barco'],
  battle:       ['bataille','schlacht','slag','batalla'],
  death:        ['mort','tod','dood','muerte'],
  love:         ['amour','liebe','liefde','amor'],
  music:        ['musique','musik','muziek','música'],
  dance:        ['danse','tanz','dans','danza'],
  hunt:         ['chasse','jagd','jacht','caza'],
  mythology:    ['mythologie','mythologie','mythologie','mitología'],
  allegory:     ['allégorie','allegorie','allegorie','alegoría'],
};

/* ============================================================
   3c. QUERY CLASSIFICATION V2
   Detects era, medium, art movement, artist-name pattern,
   and species names. Used to enrich keyword expansion and
   boost relevant source scoring.
============================================================ */
export const _ERA_REGEX = /\b(\d{4}s|\d{3}0s|\d{1,2}(st|nd|rd|th)\s+century|medieval|ancient|classical|byzantine|romanesque|gothic|renaissance|baroque|enlightenment|victorian|edwardian)\b/i;

export const _MEDIUM_TERMS = {
  Oil:        ['oil painting','oil on canvas','oil on panel','oil on board'],
  Watercolor: ['watercolor','watercolour','gouache','tempera','opaque watercolor'],
  Print:      ['etching','engraving','lithograph','woodcut','mezzotint','aquatint','linocut','screenprint','woodblock','silkscreen'],
  Photograph: ['photograph','daguerreotype','albumen print','silver gelatin','autochromes','calotype','cyanotype','tintype'],
  Sculpture:  ['sculpture','bronze','marble','terracotta','relief','alabaster','ivory carving'],
  Textile:    ['tapestry','embroidery','weaving','lace','quilt','needlework','woven','brocade'],
  Ceramic:    ['pottery','porcelain','ceramic','faience','majolica','earthenware','stoneware','delftware'],
  Drawing:    ['drawing','sketch','chalk','charcoal','pen and ink','pencil drawing','pastel'],
  Manuscript: ['illuminated manuscript','manuscript','parchment','vellum','codex','book of hours'],
};

export const _MOVEMENT_SEEDS = {
  impressionism: ['plein air','19th century','paris salon','post-impressionism'],
  baroque:       ['17th century','chiaroscuro','tenebrism','counter-reformation'],
  renaissance:   ['humanism','15th century','16th century','disegno','perspectiva'],
  romanticism:   ['sublime','19th century','nationalism','emotion','landscape painting'],
  modernism:     ['avant-garde','20th century','abstraction','formalism'],
  'art nouveau': ['jugendstil','stile liberty','decorative arts','1900','organic forms'],
  'art deco':    ['1920s','1930s','geometric','streamlined','jazz age'],
  ukiyo:         ['ukiyo-e','edo period','woodblock print','japanese art','meiji'],
  surrealism:    ['automatism','dream','unconscious','1920s','dada'],
  cubism:        ['1910s','multiple perspectives','fragmentation','geometric abstraction'],
};

// Known art movements for movement detection
export const _MOVEMENT_TERMS = Object.keys(_MOVEMENT_SEEDS).concat([
  'expressionism','fauvism','realism','symbolism','pointillism','futurism',
  'constructivism','dadaism','minimalism','conceptual art','pop art',
  'mannerism','neoclassicism','pre-raphaelite','abstract expressionism',
  'fluxus','mail art','outsider art','folk art','naive art',
]);

// Scientific species name pattern: "Genus species" — 2 latinate words
export const _SPECIES_PATTERN = /^[A-Z][a-z]{2,}\s[a-z]{3,}$/;

export function classifyQueryV2(q) {
  if (!q) return {};
  const lq = q.toLowerCase().trim();
  const original = q.trim();

  // Era
  const eraMatch = _ERA_REGEX.exec(lq);
  const era = eraMatch ? eraMatch[0].toLowerCase() : null;

  // Medium
  let medium = null;
  outer: for (const [type, variants] of Object.entries(_MEDIUM_TERMS)) {
    for (const v of variants) {
      if (lq.includes(v)) { medium = type; break outer; }
    }
    if (lq.includes(type.toLowerCase())) { medium = type; break; }
  }

  // Movement
  let movement = null;
  for (const mv of _MOVEMENT_TERMS) {
    if (lq.includes(mv)) { movement = mv; break; }
  }

  // Movement seeds (extra keywords to add to expansion)
  const movementSeeds = movement ? (_MOVEMENT_SEEDS[movement] || []) : [];

  // Artist-name pattern: 2–3 title-case words, no nature/common terms
  const words = original.split(/\s+/);
  const isTitleCase = w => /^[A-Z][a-z]{1,}$/.test(w);
  const isArtist = words.length >= 2 && words.length <= 4 &&
    words.every(isTitleCase) &&
    !NATURE_QUERY_TERMS.some(t => lq === t || lq.startsWith(t + ' ')) &&
    !['The ','A ','An '].some(p => original.startsWith(p));

  // Species: scientific binomial or common species keywords
  const isSpecies = _SPECIES_PATTERN.test(original) ||
    ['bird','mammal','reptile','amphibian','insect','beetle','butterfly',
     'moth','orchid','fern','lichen','fungus','spider'].some(k => lq === k);

  return { era, medium, movement, movementSeeds, isArtist, isSpecies };
}

/* ============================================================
   3d. NEGATIVE SEARCH SYNTAX
   Splits "marble -statue NOT greek "exact phrase"" into:
     { positive: "marble", negatives: ["statue","greek"], phrases: ["exact phrase"] }
   Supports:
     -word     → exclude word
     NOT word  → exclude word (legacy syntax)
     "phrase"  → require exact phrase
============================================================ */
export function parseNegativeTerms(query) {
  if (!query) return { positive: '', negatives: [], phrases: [] };

  // 1. Extract "quoted phrases" — must be present in results
  const phrases = [];
  let q = query.replace(/"([^"]+)"/g, (_, p) => { phrases.push(p.trim().toLowerCase()); return ' '; }).trim();

  // 2. Extract -word negations (prefix minus, not inside a word)
  const negatives = [];
  q = q.replace(/(?:^|\s)-(\S+)/g, (_, w) => { negatives.push(w.toLowerCase()); return ' '; }).trim();

  // 3. Extract NOT word syntax (legacy, kept for backwards compat)
  const parts = q.split(/\s+NOT\s+/i);
  q = (parts[0] || '').trim();
  parts.slice(1).forEach(p => {
    const w = p.trim().toLowerCase();
    if (w) negatives.push(w);
  });

  const positive = q.trim() || '';
  return { positive, negatives: [...new Set(negatives)], phrases };
}

export function filterNegativeTerms(items, negatives) {
  if (!negatives.length) return items;
  return items.filter(item => {
    const hay = `${item.title || ''} ${item.description || ''} ${item.artist || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
    return !negatives.some(neg => hay.includes(neg));
  });
}

export function filterPhrases(items, phrases) {
  if (!phrases.length) return items;
  return items.filter(item => {
    const hay = `${item.title || ''} ${item.description || ''} ${item.artist || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
    return phrases.every(phrase => hay.includes(phrase));
  });
}

/* Load API keys from localStorage if present */
STATE.geminiKey      = localStorage.getItem(CONSTANTS.GEMINI_KEY_STORAGE) || null;
STATE.claudeKey      = localStorage.getItem(CONSTANTS.CLAUDE_KEY_STORAGE)  || null;
STATE.openaiKey      = localStorage.getItem(CONSTANTS.OPENAI_KEY_STORAGE)  || null;
STATE.openaiEndpoint = localStorage.getItem('inspo_openai_endpoint')        || '';
STATE.ollamaEndpoint = localStorage.getItem('inspo_ollama_endpoint')        || 'http://localhost:11434';
STATE.ollamaModel    = localStorage.getItem('inspo_ollama_model')           || 'llava';
STATE.aiProvider     = localStorage.getItem('inspo_ai_provider')            || 'gemini';
STATE.europeanaKey   = localStorage.getItem('inspo_europeana_key')    || null;
STATE.harvardKey     = localStorage.getItem('inspo_harvard_key')      || null;
STATE.smithsonianKey = localStorage.getItem('inspo_smithsonian_key')  || null;
STATE.pexelsKey      = localStorage.getItem('inspo_pexels_key')       || null;
STATE.pixabayKey     = localStorage.getItem('inspo_pixabay_key')      || null;
STATE.flickrKey      = localStorage.getItem('inspo_flickr_key')       || null;
STATE.troveKey       = localStorage.getItem('inspo_trove_key')        || null;
STATE.digitalnzKey   = localStorage.getItem('inspo_digitalnz_key')    || null;
STATE.dplaKey        = localStorage.getItem('inspo_dpla_key')         || null;
STATE.ddbKey         = localStorage.getItem('inspo_ddb_key')          || null;
STATE.artsyId        = localStorage.getItem('inspo_artsy_id')         || null;
STATE.artsySecret    = localStorage.getItem('inspo_artsy_secret')     || null;
STATE.unsplashKey    = localStorage.getItem('inspo_unsplash_key')     || null;

/* ============================================================
   SOURCE REGISTRY
   66 unique source IDs used by callIfHealthy (all fetchAll calls)
============================================================ */
export const ALL_SOURCES = [
  'met','nasa','inaturalist','loc',
  'chicago','cleveland','va','wikiart','nordic','flickr','europeana',
  'rijksmuseum','harvard','smithsonian','pexels','pixabay','getty','nga',
  'gbif','eol','apod','gallica','chronicling','trove','digitalnz',
  'bhl','carnegie','prado','parismusees','yale','picsum','usgs','cooperhewitt',
  'tate','finna','soch','joconde','mnw','tepapa','dpla','artsy','pas','smg',
  'auckland','photogrammar','wellcome','maas','smk','thyssen','wdl','walters',
  'princeton','wikidata','noaa','hubble','cornell','folger','onb','nypl',
  'mak','mna','louvre',
  // Batch 7
  'mia','lacma','munch','mauritshuis','nationalmuseumse','naturalis',
  'nmaahc','nasm','whitney','nationalzoo','gbiflit','freersackler',
  'ago','pem','npg','louvread',
  // Phase 2
  'unsplash','bodleian','bsb','cudl',
  // Phase A — Aggregator Sub-Collections (60)
  // A1: Europeana sub-collections (20)
  'euro_rijksmuseum','euro_fashion','euro_ddb','euro_bnf','euro_bne',
  'euro_kb','euro_bn_pl','euro_nkr','euro_photography','euro_sounds',
  'euro_newspapers','euro_kulturpool','euro_hispana','euro_nuk',
  'euro_estonian','euro_lithuanian','euro_latvian','euro_hungarian',
  'euro_romanian','euro_bulgarian',
  // A2: DPLA hub sub-collections (15)
  'dpla_california','dpla_commonwealth','dpla_empire','dpla_mountain_west',
  'dpla_minnesota','dpla_michigan','dpla_illinois','dpla_kentucky',
  'dpla_south_carolina','dpla_georgia','dpla_texas','dpla_pacific_nw',
  'dpla_ohio','dpla_pennsylvania','dpla_new_england',
  // A3: Smithsonian sub-museums (15)
  'si_nmah','si_nmnh','si_npg_dc','si_saam','si_hmsg','si_nzp',
  'si_chndm','si_fsg','si_nmafa','si_nmai','si_nmaahc2','si_nasm2',
  'si_npm','si_acm','si_renwick',
  // Phase B — zero-auth free APIs (2)
  'idigbio','ala',
  // Phase D — niche & specialized (1)
  'nasa_images',
  // Phase E — CORS-blocked, cache-first (13)
  'nhm_london','wallace_collection','fitzwilliam','national_gallery_london','scottish_national',
  'musee_orsay','vangogh_museum','khm','belvedere','staedel','rmfab','guimet','npm_taipei',
  // Phase F — Fashion & Textile CORS-blocked (9)
  'galliera','arts_decoratifs','centraal_museum','textile_museum_tilburg','wereldculturen',
  'dec_arts_prague','designmuseum_dk','boijmans','museu_traje',
  // Phase G — Art, Sculpture & History CORS-blocked (14)
  'kmska','amsterdam_museum','ngi','fries_museum','groeninge','groninger','moma_wd',
  'rijksmuseum_twenthe','herzog_anton_ulrich','galleria_palatina','lakenhal','teylers','alte_pinakothek','quai_branly',
  // Phase H — 113 World Museum Collection Sources
  ...WD_PHASE_H.map(s => s.id),
  // DDB — Deutsche Digitale Bibliothek (key-gated)
  'ddb',
];

export const SOURCE_GROUPS = {
  museums:     ['met','rijksmuseum','chicago','cleveland','va','getty','nga',
               'walters','princeton','tate','smk','thyssen','prado','louvre',
               'joconde','mnw','parismusees','cooperhewitt','carnegie','harvard',
               'yale','folger','maas','auckland','tepapa','wellcome','smg',
               'pas','photogrammar','cornell','mna','onb','nypl','mak',
               'mia','lacma','munch','mauritshuis','nationalmuseumse',
               'ago','pem','nmaahc','nasm','whitney','freersackler',
               'npg','louvread'],
  photography: ['flickr','pexels','pixabay','noaa','nasa','apod','hubble',
               'loc','nypl','chronicling','trove',
               'digitalnz','wikidata','inaturalist','usgs','finna',
               'mia','lacma','whitney','unsplash'],
  nature:      ['inaturalist','gbif','eol','bhl','noaa','hubble','apod',
               'nasa','usgs','naturalis','nationalzoo','gbiflit'],
  historical:  ['chronicling','gallica','loc','trove','digitalnz',
               'wdl','bhl','folger','onb','nypl','soch','nordic',
               'lacma','mauritshuis','nationalmuseumse','bodleian','cudl','bsb','ddb'],
  artdesign:   ['wikiart','wikidata','cooperhewitt','tate','va',
               'artsy','dpla','europeana','getty','nga','carnegie','maas',
               'smk','thyssen','wellcome','rijksmuseum','parismusees',
               'chicago','cleveland',
               'mia','lacma','mauritshuis','whitney','munch','freersackler'],
  maps:        ['loc','usgs','nypl','wdl','bsb','bodleian','cudl'],
  fashion:     ['va','nordic','cooperhewitt','mak','maas','smk','parismusees'],
  science:     ['nasa','apod','hubble','noaa','usgs','gbif','eol',
               'inaturalist','smg','naturalis','nasm','nationalzoo','gbiflit'],
  botanical:   ['bhl','gbiflit','cornell','naturalis','eol','gbif'],
  archives:    ['loc','gallica','chronicling','bhl',
               'trove','digitalnz','nypl','folger','onb','soch','finna',
               'wdl','photogrammar','wikidata','bodleian','cudl','bsb','ddb'],
};

/* ── Source metadata for filtering (Phase 2) ── */
export const SOURCE_META = {
  met:              { category: ['museums','art'],                  region: 'americas', access: 'no_key' },
  nasa:             { category: ['science','photos'],               region: 'global',   access: 'no_key' },
  inaturalist:      { category: ['nature','science'],               region: 'global',   access: 'no_key' },
  loc:              { category: ['archives','historical','maps'],   region: 'americas', access: 'no_key' },

  chicago:          { category: ['museums','art'],                  region: 'americas', access: 'no_key' },
  cleveland:        { category: ['museums','art'],                  region: 'americas', access: 'no_key' },
  va:               { category: ['museums','art','fashion'],        region: 'uk',       access: 'no_key' },
  wikiart:          { category: ['art'],                            region: 'global',   access: 'no_key' },
  nordic:           { category: ['museums','art','fashion'],        region: 'europe',   access: 'no_key' },
  flickr:           { category: ['photos'],                         region: 'global',   access: 'no_key' },
  europeana:        { category: ['museums','art','archives'],       region: 'europe',   access: 'free_key' },
  rijksmuseum:      { category: ['museums','art'],                  region: 'europe',   access: 'no_key' },
  harvard:          { category: ['museums','art'],                  region: 'americas', access: 'free_key' },
  smithsonian:      { category: ['museums','science','art'],        region: 'americas', access: 'no_key' },
  pexels:           { category: ['photos'],                         region: 'global',   access: 'free_key' },
  pixabay:          { category: ['photos','art'],                   region: 'global',   access: 'free_key' },
  getty:            { category: ['museums','art'],                  region: 'americas', access: 'no_key' },
  nga:              { category: ['museums','art'],                  region: 'americas', access: 'no_key' },
  gbif:             { category: ['nature','science'],               region: 'global',   access: 'no_key' },
  eol:              { category: ['nature','science'],               region: 'global',   access: 'no_key' },
  apod:             { category: ['science','photos'],               region: 'global',   access: 'no_key' },
  gallica:          { category: ['archives','art','historical'],    region: 'europe',   access: 'no_key' },
  chronicling:      { category: ['archives','historical'],          region: 'americas', access: 'no_key' },
  trove:            { category: ['archives','historical','photos'], region: 'oceania',  access: 'free_key' },
  digitalnz:        { category: ['archives','historical'],          region: 'oceania',  access: 'free_key' },
  bhl:              { category: ['botanical','nature','archives'],  region: 'global',   access: 'no_key' },
  carnegie:         { category: ['museums','art'],                  region: 'americas', access: 'no_key' },
  prado:            { category: ['museums','art'],                  region: 'europe',   access: 'no_key', corsBlocked: true },
  parismusees:      { category: ['museums','art','fashion'],        region: 'europe',   access: 'no_key', corsBlocked: true },
  yale:             { category: ['museums','art'],                  region: 'americas', access: 'no_key' },
  picsum:           { category: ['photos'],                         region: 'global',   access: 'no_key' },
  usgs:             { category: ['science','photos','maps'],        region: 'americas', access: 'no_key' },
  cooperhewitt:     { category: ['museums','art','fashion','design','architecture'], region: 'americas', access: 'no_key' },
  tate:             { category: ['museums','art'],                  region: 'uk',       access: 'no_key' },
  finna:            { category: ['archives','museums','historical'],region: 'europe',   access: 'no_key' },
  soch:             { category: ['archives','historical'],          region: 'europe',   access: 'no_key', corsBlocked: true },
  joconde:          { category: ['museums','art'],                  region: 'europe',   access: 'no_key' },
  mnw:              { category: ['museums','art'],                  region: 'europe',   access: 'no_key' },
  tepapa:           { category: ['museums','art'],                  region: 'oceania',  access: 'no_key' },
  dpla:             { category: ['archives','art','historical'],    region: 'americas', access: 'free_key' },
  ddb:              { category: ['archives','art','historical','museums'], region: 'europe', access: 'free_key' },
  artsy:            { category: ['art'],                            region: 'global',   access: 'paid_key' },
  pas:              { category: ['archives','historical'],          region: 'uk',       access: 'no_key' },
  smg:              { category: ['museums','science'],              region: 'uk',       access: 'no_key' },
  auckland:         { category: ['museums','art'],                  region: 'oceania',  access: 'no_key' },
  photogrammar:     { category: ['archives','photos','historical'], region: 'americas', access: 'no_key' },
  wellcome:         { category: ['archives','science','art'],       region: 'uk',       access: 'no_key' },
  maas:             { category: ['museums','science','art','fashion'], region: 'oceania',  access: 'no_key' },
  smk:              { category: ['museums','art','fashion'],        region: 'europe',   access: 'no_key' },
  thyssen:          { category: ['museums','art'],                  region: 'europe',   access: 'no_key', corsBlocked: true },
  wdl:              { category: ['archives','maps','historical'],   region: 'global',   access: 'no_key' },
  walters:          { category: ['museums','art'],                  region: 'americas', access: 'no_key' },
  princeton:        { category: ['museums','art'],                  region: 'americas', access: 'no_key' },
  wikidata:         { category: ['archives','art','photos'],        region: 'global',   access: 'no_key' },
  noaa:             { category: ['science','photos','nature'],      region: 'americas', access: 'no_key' },
  hubble:           { category: ['science','photos'],               region: 'global',   access: 'no_key' },
  cornell:          { category: ['archives','botanical','nature'],  region: 'americas', access: 'no_key' },
  folger:           { category: ['archives','historical'],          region: 'americas', access: 'no_key' },
  onb:              { category: ['archives','historical'],          region: 'europe',   access: 'no_key' },
  nypl:             { category: ['archives','photos','maps'],       region: 'americas', access: 'no_key' },
  mak:              { category: ['museums','art','fashion'],        region: 'europe',   access: 'no_key' },
  mna:              { category: ['museums','art'],                  region: 'americas', access: 'no_key' },
  louvre:           { category: ['museums','art'],                  region: 'europe',   access: 'no_key' },
  mia:              { category: ['museums','art'],                  region: 'americas', access: 'no_key' },
  lacma:            { category: ['museums','art'],                  region: 'americas', access: 'no_key' },
  munch:            { category: ['museums','art'],                  region: 'europe',   access: 'no_key' },
  mauritshuis:      { category: ['museums','art'],                  region: 'europe',   access: 'no_key' },
  nationalmuseumse: { category: ['museums','art'],                  region: 'europe',   access: 'no_key' },
  naturalis:        { category: ['nature','science'],               region: 'europe',   access: 'no_key' },
  nmaahc:           { category: ['museums','art','historical'],     region: 'americas', access: 'no_key' },
  nasm:             { category: ['museums','science'],              region: 'americas', access: 'no_key' },
  whitney:          { category: ['museums','art'],                  region: 'americas', access: 'no_key' },
  nationalzoo:      { category: ['nature','science'],               region: 'americas', access: 'no_key' },
  gbiflit:          { category: ['botanical','nature','archives'],  region: 'global',   access: 'no_key' },
  freersackler:     { category: ['museums','art'],                  region: 'americas', access: 'no_key' },
  ago:              { category: ['museums','art'],                  region: 'americas', access: 'no_key' },
  pem:              { category: ['museums','art'],                  region: 'americas', access: 'no_key' },
  npg:              { category: ['museums','art'],                  region: 'uk',       access: 'no_key' },
  louvread:         { category: ['museums','art'],                  region: 'europe',   access: 'no_key' },
  // Phase 2 sources
  unsplash:         { category: ['photos'],                         region: 'global',   access: 'free_key' },
  bodleian:         { category: ['archives','art','maps'],          region: 'uk',       access: 'no_key', corsBlocked: true },
  bsb:              { category: ['archives','maps','historical'],   region: 'europe',   access: 'no_key', corsBlocked: true },
  cudl:             { category: ['archives','historical','maps'],   region: 'uk',       access: 'no_key', corsBlocked: true },
  // Phase A — Europeana sub-collections (20)
  euro_rijksmuseum:  { category: ['museums','art'],               region: 'europe',   access: 'free_key' },
  euro_fashion:      { category: ['museums','art','fashion'],     region: 'europe',   access: 'free_key' },
  euro_ddb:          { category: ['archives','historical'],       region: 'europe',   access: 'free_key' },
  euro_bnf:          { category: ['archives','historical'],       region: 'europe',   access: 'free_key' },
  euro_bne:          { category: ['archives','historical'],       region: 'europe',   access: 'free_key' },
  euro_kb:           { category: ['archives','historical'],       region: 'europe',   access: 'free_key' },
  euro_bn_pl:        { category: ['archives','historical'],       region: 'europe',   access: 'free_key' },
  euro_nkr:          { category: ['archives','historical'],       region: 'europe',   access: 'free_key' },
  euro_photography:  { category: ['photos','archives'],           region: 'europe',   access: 'free_key' },
  euro_sounds:       { category: ['archives'],                    region: 'europe',   access: 'free_key' },
  euro_newspapers:   { category: ['archives','historical'],       region: 'europe',   access: 'free_key' },
  euro_kulturpool:   { category: ['museums','archives'],          region: 'europe',   access: 'free_key' },
  euro_hispana:      { category: ['archives','historical'],       region: 'europe',   access: 'free_key' },
  euro_nuk:          { category: ['archives','historical'],       region: 'europe',   access: 'free_key' },
  euro_estonian:     { category: ['museums','historical'],        region: 'europe',   access: 'free_key' },
  euro_lithuanian:   { category: ['archives','historical'],       region: 'europe',   access: 'free_key' },
  euro_latvian:      { category: ['archives','historical'],       region: 'europe',   access: 'free_key' },
  euro_hungarian:    { category: ['archives','historical'],       region: 'europe',   access: 'free_key' },
  euro_romanian:     { category: ['archives','historical'],       region: 'europe',   access: 'free_key' },
  euro_bulgarian:    { category: ['archives','historical'],       region: 'europe',   access: 'free_key' },
  // Phase A — DPLA hub sub-collections (15)
  dpla_california:     { category: ['archives','photos','historical'], region: 'americas', access: 'free_key' },
  dpla_commonwealth:   { category: ['archives','historical'],          region: 'americas', access: 'free_key' },
  dpla_empire:         { category: ['archives','historical'],          region: 'americas', access: 'free_key' },
  dpla_mountain_west:  { category: ['archives','historical'],          region: 'americas', access: 'free_key' },
  dpla_minnesota:      { category: ['archives','historical'],          region: 'americas', access: 'free_key' },
  dpla_michigan:       { category: ['archives','historical'],          region: 'americas', access: 'free_key' },
  dpla_illinois:       { category: ['archives','historical'],          region: 'americas', access: 'free_key' },
  dpla_kentucky:       { category: ['archives','historical'],          region: 'americas', access: 'free_key' },
  dpla_south_carolina: { category: ['archives','historical'],          region: 'americas', access: 'free_key' },
  dpla_georgia:        { category: ['archives','historical'],          region: 'americas', access: 'free_key' },
  dpla_texas:          { category: ['archives','historical'],          region: 'americas', access: 'free_key' },
  dpla_pacific_nw:     { category: ['archives','historical'],          region: 'americas', access: 'free_key' },
  dpla_ohio:           { category: ['archives','historical'],          region: 'americas', access: 'free_key' },
  dpla_pennsylvania:   { category: ['archives','historical'],          region: 'americas', access: 'free_key' },
  dpla_new_england:    { category: ['archives','historical'],          region: 'americas', access: 'free_key' },
  // Phase A — Smithsonian sub-museums (15)
  si_nmah:    { category: ['museums','historical'],             region: 'americas', access: 'no_key' },
  si_nmnh:    { category: ['museums','science','nature'],       region: 'americas', access: 'no_key' },
  si_npg_dc:  { category: ['museums','art','historical'],       region: 'americas', access: 'no_key' },
  si_saam:    { category: ['museums','art'],                    region: 'americas', access: 'no_key' },
  si_hmsg:    { category: ['museums','art'],                    region: 'americas', access: 'no_key' },
  si_nzp:     { category: ['nature','science'],                 region: 'americas', access: 'no_key' },
  si_chndm:   { category: ['museums','design','art','fashion'], region: 'americas', access: 'no_key' },
  si_fsg:     { category: ['museums','art'],                    region: 'americas', access: 'no_key' },
  si_nmafa:   { category: ['museums','art'],                    region: 'americas', access: 'no_key' },
  si_nmai:    { category: ['museums','art','historical'],       region: 'americas', access: 'no_key' },
  si_nmaahc2: { category: ['museums','art','historical'],       region: 'americas', access: 'no_key' },
  si_nasm2:   { category: ['museums','science'],                region: 'americas', access: 'no_key' },
  si_npm:     { category: ['museums','historical'],             region: 'americas', access: 'no_key' },
  si_acm:     { category: ['museums','historical'],             region: 'americas', access: 'no_key' },
  si_renwick: { category: ['museums','art','design'],           region: 'americas', access: 'no_key' },
  // Phase B — zero-auth free APIs
  idigbio:            { category: ['nature','science'],               region: 'global',   access: 'no_key' },
  ala:                { category: ['nature','science'],               region: 'oceania',  access: 'no_key' },
  // Phase D — niche & specialized
  nasa_images:        { category: ['science','space','photos'],       region: 'global',   access: 'no_key' },
  // Phase E — CORS-blocked, cache-first
  nhm_london:              { category: ['nature','science'],          region: 'uk',       access: 'no_key' },
  wallace_collection:      { category: ['museums','art'],             region: 'uk',       access: 'no_key', corsBlocked: true },
  fitzwilliam:             { category: ['museums','art'],             region: 'uk',       access: 'no_key', corsBlocked: true },
  national_gallery_london: { category: ['museums','art'],             region: 'uk',       access: 'no_key', corsBlocked: true },
  scottish_national:       { category: ['museums','art'],             region: 'uk',       access: 'no_key', corsBlocked: true },
  musee_orsay:             { category: ['museums','art'],             region: 'europe',   access: 'no_key', corsBlocked: true },
  vangogh_museum:          { category: ['museums','art'],             region: 'europe',   access: 'no_key', corsBlocked: true },
  khm:                     { category: ['museums','art'],             region: 'europe',   access: 'no_key', corsBlocked: true },
  belvedere:               { category: ['museums','art'],             region: 'europe',   access: 'no_key', corsBlocked: true },
  staedel:                 { category: ['museums','art'],             region: 'europe',   access: 'no_key', corsBlocked: true },
  rmfab:                   { category: ['museums','art'],             region: 'europe',   access: 'no_key', corsBlocked: true },
  guimet:                  { category: ['museums','art'],             region: 'europe',   access: 'no_key', corsBlocked: true },
  npm_taipei:              { category: ['museums','art'],             region: 'asia',     access: 'no_key', corsBlocked: true },
  galliera:                { category: ['museums','fashion'],          region: 'europe',   access: 'no_key', corsBlocked: true },
  arts_decoratifs:          { category: ['museums','fashion','art'],    region: 'europe',   access: 'no_key', corsBlocked: true },
  centraal_museum:          { category: ['museums','fashion','art'],    region: 'europe',   access: 'no_key', corsBlocked: true },
  textile_museum_tilburg:   { category: ['museums','fashion'],          region: 'europe',   access: 'no_key', corsBlocked: true },
  wereldculturen:           { category: ['museums','fashion'],          region: 'europe',   access: 'no_key', corsBlocked: true },
  dec_arts_prague:          { category: ['museums','fashion','art'],    region: 'europe',   access: 'no_key', corsBlocked: true },
  designmuseum_dk:          { category: ['museums','fashion'],          region: 'europe',   access: 'no_key', corsBlocked: true },
  boijmans:                 { category: ['museums','fashion','art'],    region: 'europe',   access: 'no_key', corsBlocked: true },
  museu_traje:              { category: ['museums','fashion'],          region: 'europe',   access: 'no_key', corsBlocked: true },
  // Phase G — Art, Sculpture & History
  kmska:                    { category: ['museums','art'],              region: 'europe',   access: 'no_key', corsBlocked: true },
  amsterdam_museum:         { category: ['museums','art','history'],    region: 'europe',   access: 'no_key', corsBlocked: true },
  ngi:                      { category: ['museums','art'],              region: 'europe',   access: 'no_key', corsBlocked: true },
  fries_museum:             { category: ['museums','art','history'],    region: 'europe',   access: 'no_key', corsBlocked: true },
  groeninge:                { category: ['museums','art'],              region: 'europe',   access: 'no_key', corsBlocked: true },
  groninger:                { category: ['museums','art'],              region: 'europe',   access: 'no_key', corsBlocked: true },
  moma_wd:                  { category: ['museums','art'],              region: 'north_america', access: 'no_key', corsBlocked: true },
  rijksmuseum_twenthe:      { category: ['museums','art'],              region: 'europe',   access: 'no_key', corsBlocked: true },
  herzog_anton_ulrich:      { category: ['museums','art'],              region: 'europe',   access: 'no_key', corsBlocked: true },
  galleria_palatina:        { category: ['museums','art'],              region: 'europe',   access: 'no_key', corsBlocked: true },
  lakenhal:                 { category: ['museums','art'],              region: 'europe',   access: 'no_key', corsBlocked: true },
  teylers:                  { category: ['museums','art','science'],    region: 'europe',   access: 'no_key', corsBlocked: true },
  alte_pinakothek:          { category: ['museums','art'],              region: 'europe',   access: 'no_key', corsBlocked: true },
  quai_branly:              { category: ['museums','art','history'],    region: 'europe',   access: 'no_key', corsBlocked: true },
};
// Phase H — auto-inject SOURCE_META
WD_PHASE_H.forEach(s => { SOURCE_META[s.id] = { category: s.cat, region: s.region, access: 'no_key', corsBlocked: true }; });

/* ============================================================
   PHASE A — SUB-COLLECTION LOOKUP TABLES
============================================================ */
export const EUROPEANA_PROVIDERS = {
  euro_rijksmuseum:  { filterParam: 'DATA_PROVIDER', filterValue: 'Rijksmuseum',                                         name: 'Rijksmuseum (Europeana)' },
  euro_fashion:      { filterParam: 'PROVIDER',      filterValue: 'Europeana Fashion',                                   name: 'Europeana Fashion' },
  euro_ddb:          { filterParam: 'DATA_PROVIDER', filterValue: 'Deutsche Digitale Bibliothek',                        name: 'Deutsche Digitale Bibliothek' },
  euro_bnf:          { filterParam: 'DATA_PROVIDER', filterValue: 'Biblioth\u00e8que nationale de France',               name: 'BnF via Europeana' },
  euro_bne:          { filterParam: 'DATA_PROVIDER', filterValue: 'Biblioteca Nacional de Espa\u00f1a',                  name: 'National Library of Spain' },
  euro_kb:           { filterParam: 'DATA_PROVIDER', filterValue: 'Koninklijke Bibliotheek',                             name: 'National Library of Netherlands' },
  euro_bn_pl:        { filterParam: 'DATA_PROVIDER', filterValue: 'Biblioteka Narodowa',                                 name: 'National Library of Poland' },
  euro_nkr:          { filterParam: 'DATA_PROVIDER', filterValue: 'N\u00e1rodn\u00ed knihovna \u010cR',               name: 'National Library of Czech Republic' },
  euro_photography:  { filterParam: 'PROVIDER',      filterValue: 'Europeana Photography',                              name: 'Europeana Photography' },
  euro_sounds:       { filterParam: 'PROVIDER',      filterValue: 'Europeana Sounds',        extra: 'TYPE:IMAGE',       name: 'Europeana Sounds (Images)' },
  euro_newspapers:   { filterParam: 'PROVIDER',      filterValue: 'Europeana Newspapers',                               name: 'Europeana Newspapers' },
  euro_kulturpool:   { filterParam: 'DATA_PROVIDER', filterValue: 'Kulturpool',                                         name: 'Kulturpool Austria' },
  euro_hispana:      { filterParam: 'DATA_PROVIDER', filterValue: 'Hispana',                                            name: 'Hispana Spain' },
  euro_nuk:          { filterParam: 'DATA_PROVIDER', filterValue: 'Digital Library of Slovenia',                        name: 'Digital Library of Slovenia' },
  euro_estonian:     { filterParam: 'DATA_PROVIDER', filterValue: 'Estonian National Museum',                           name: 'Estonian National Museum' },
  euro_lithuanian:   { filterParam: 'DATA_PROVIDER', filterValue: 'Lithuanian Central State Archives',                  name: 'Lithuanian Archives' },
  euro_latvian:      { filterParam: 'DATA_PROVIDER', filterValue: 'National Library of Latvia',                         name: 'Latvian National Library' },
  euro_hungarian:    { filterParam: 'DATA_PROVIDER', filterValue: 'Orsz\u00e1gos Sz\u00e9ch\u00e9nyi K\u00f6nyvt\u00e1r', name: 'Hungarian National Library' },
  euro_romanian:     { filterParam: 'DATA_PROVIDER', filterValue: 'Romanian National Library',                          name: 'Romanian National Library' },
  euro_bulgarian:    { filterParam: 'DATA_PROVIDER', filterValue: 'Bulgarian National Library',                         name: 'Bulgarian National Library' },
};

export const DPLA_HUBS = {
  dpla_california:     { provider: 'California Digital Library',                         name: 'California Digital Library' },
  dpla_commonwealth:   { provider: 'Digital Commonwealth',                              name: 'Digital Commonwealth (DPLA)' },
  dpla_empire:         { provider: 'Empire State Digital Network',                      name: 'Empire State Network (NY)' },
  dpla_mountain_west:  { provider: 'Mountain West Digital Library',                     name: 'Mountain West Digital Library' },
  dpla_minnesota:      { provider: 'Minnesota Digital Library',                         name: 'Minnesota Digital Library' },
  dpla_michigan:       { provider: 'Michigan Digital Library',                          name: 'Michigan Digital Library' },
  dpla_illinois:       { provider: 'Illinois Digital Heritage Hub',                     name: 'Illinois Digital Heritage' },
  dpla_kentucky:       { provider: 'Kentucky Digital Library',                          name: 'Kentucky Digital Library' },
  dpla_south_carolina: { provider: 'South Carolina Digital Library',                    name: 'South Carolina Digital Library' },
  dpla_georgia:        { provider: 'Georgia HomePLACE',                                 name: 'Georgia HomePLACE' },
  dpla_texas:          { provider: 'Texas Digital Library',                             name: 'Texas Digital Library' },
  dpla_pacific_nw:     { provider: 'Pacific Northwest Digital Collections',             name: 'Pacific Northwest Collections' },
  dpla_ohio:           { provider: 'Ohio Network of American History Research Centers', name: 'Ohio Digital Network' },
  dpla_pennsylvania:   { provider: 'PA Digital',                                        name: 'Pennsylvania Digital Collections' },
  dpla_new_england:    { provider: 'New England Digital Collections',                   name: 'New England Digital Collections' },
};

export const SI_UNITS = {
  si_nmah:    { code: 'NMAH',   name: 'Nat\u2019l Museum of American History' },
  si_nmnh:    { code: 'NMNH',   name: 'Nat\u2019l Museum of Natural History' },
  si_npg_dc:  { code: 'NPG',    name: 'National Portrait Gallery (SI)' },
  si_saam:    { code: 'SAAM',   name: 'American Art Museum (SI)' },
  si_hmsg:    { code: 'HMSG',   name: 'Hirshhorn Museum' },
  si_nzp:     { code: 'NZP',    name: 'Smithsonian National Zoo' },
  si_chndm:   { code: 'CHNDM',  name: 'Cooper Hewitt Design (SI)' },
  si_fsg:     { code: 'FSG',    name: 'Freer|Sackler Asian Art' },
  si_nmafa:   { code: 'NMAFA',  name: 'African Art Museum (SI)' },
  si_nmai:    { code: 'NMAI',   name: 'American Indian Museum (SI)' },
  si_nmaahc2: { code: 'NMAAHC',name: 'African American History (SI)' },
  si_nasm2:   { code: 'NASM',   name: 'Air and Space Museum (SI)' },
  si_npm:     { code: 'NPM',    name: 'Postal Museum (SI)' },
  si_acm:     { code: 'ACM',    name: 'Anacostia Community Museum (SI)' },
  si_renwick: { code: 'SAAM',   name: 'Renwick Gallery (SI)' },
};

/* ============================================================
   DYNAMIC SOURCE REGISTRY — scales to 10K+ sources, zero storage
   Each entry is a lightweight config object; images are fetched
   live from the aggregator API at search time.
============================================================ */
export const DYNAMIC_REGISTRY = [];   // [{id, adapter, config, name, tags, keyRequired}]

/* Adapter map — one function per protocol.
   Each adapter takes (config, keyword, limit, signal) → Promise<items[]>
   Populated at runtime by fetchers.js to avoid circular imports. */
export const ADAPTERS = {};

/* ── Extended query classification for smart source selection ── */
export const ART_QUERY_TERMS = [
  'painting','sculpture','portrait','landscape','still life','mural','fresco',
  'drawing','sketch','etching','engraving','lithograph','woodcut','watercolor',
  'oil paint','acrylic','canvas','gallery','museum','exhibition','masterpiece',
  'renaissance','baroque','impressionism','cubism','surrealism','abstract',
  'art nouveau','art deco','pop art','minimalism','expressionism','fauvism',
  'romanticism','neoclassicism','gothic','mannerism','futurism','constructivism',
  'dada','pointillism','symbolism','realism','modernism','contemporary art',
  'ceramic','pottery','vase','tile','mosaic','terracotta','stoneware','earthenware',
  'porcelain','figurine','bust','relief','icon','altar','crucifix','triptych',
  'illuminat','miniature','tapestry','textile','embroidery','lacquer','enamel',
  'metalwork','goldsmith','silversmith','bronze','marble','jade','ivory',
  'calligraphy','woodblock','ukiyo','print','mask','carving','totem',
];
export const HISTORY_QUERY_TERMS = [
  'ancient','medieval','victorian','colonial','empire','dynasty','civilization',
  'ruins','artifact','relic','manuscript','archive','document','chronicle',
  'antiquity','heritage','historic','war','battle','revolution','propaganda',
  'vintage','retro','century','era','period','archaeological','excavation',
];
export const ARCH_QUERY_TERMS = [
  'architecture','building','facade','structure','tower','dome','arch','column',
  'cathedral','church','mosque','temple','castle','palace','bridge','skyscraper',
  'ruins','monument','fountain','lighthouse','windmill','stadium','interior',
  'brutalist','modernist','gothic','romanesque','byzantine','art deco',
];
export const DESIGN_QUERY_TERMS = [
  'design','typography','graphic','pattern','textile','fabric','weaving','lace',
  'embroidery','ceramic','pottery','porcelain','glass','stained glass','mosaic',
  'tapestry','furniture','jewelry','metalwork','woodwork','lacquer','enamel',
  'industrial design','packaging','poster','wallpaper','ornament','decoration',
];
export const PHOTO_QUERY_TERMS = [
  'photograph','photo','camera','film','exposure','darkroom','street photography',
  'documentary','portrait','landscape','macro','aerial','panorama','bokeh',
  'black and white','monochrome','color photography','daguerreotype','snapshot',
];
export const SCIENCE_QUERY_TERMS = [
  'science','microscope','telescope','astronomy','biology','chemistry','physics',
  'anatomy','botany','zoology','geology','mineral','crystal','fossil','specimen',
  'laboratory','experiment','diagram','illustration','medical','pharmaceutical',
  'x-ray','cell','dna','molecule','atom','satellite','observatory',
];

export function classifyQueryExtended(q) {
  const lower = (q || '').toLowerCase();
  const check = terms => terms.some(t => lower.includes(t));
  return {
    isNature:  check(NATURE_QUERY_TERMS),
    isSpace:   check(SPACE_QUERY_TERMS),
    isArt:     check(ART_QUERY_TERMS),
    isHistory: check(HISTORY_QUERY_TERMS),
    isArch:    check(ARCH_QUERY_TERMS),
    isDesign:  check(DESIGN_QUERY_TERMS),
    isPhoto:   check(PHOTO_QUERY_TERMS),
    isScience: check(SCIENCE_QUERY_TERMS),
  };
}

/* ── Smart source selector — picks relevant subset per query ── */


/* ── KEY_SOURCES (relocated from line 9835 of monolith) ── */
export const KEY_SOURCES = [
  {
    id:        'nasa',
    name:      'NASA Images',
    desc:      'space, earth & history — 300k photos',
    imageCount: 300000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'met',
    name:      'The Met Museum',
    desc:      '400k art objects, global collection',
    imageCount: 400000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'inaturalist',
    name:      'iNaturalist',
    desc:      '50M nature observations, CC-licensed',
    imageCount: 50000000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'loc',
    name:      'Library of Congress',
    desc:      'US historical images & documents',
    imageCount: 3000000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'chicago',
    name:      'Art Institute of Chicago',
    desc:      '50k CC0 artworks, no key needed',
    imageCount: 50000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'cleveland',
    name:      'Cleveland Museum of Art',
    desc:      '64k artworks, CC0, no key needed',
    imageCount: 64000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'va',
    name:      'Victoria & Albert Museum',
    desc:      '1M+ objects, fashion, design, decorative art',
    imageCount: 1200000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'wikiart',
    name:      'WikiArt',
    desc:      '250k paintings, drawings, prints — all styles',
    imageCount: 250000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'nordic',
    name:      'Nordic Museum',
    desc:      'Scandinavian design, folk art, fashion',
    imageCount: 100000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'flickr',
    name:      'Flickr Commons',
    desc:      'public domain photography, Creative Commons',
    imageCount: 500000,
    alwaysOn:  false,
    stateKey:  'flickrKey',
    storageKey: 'inspo_flickr_key',
    getKeyUrl: 'https://www.flickr.com/services/api/keys/',
  },
  {
    id:        'rijks',
    toggleId:  'rijksmuseum',
    name:      'Rijksmuseum',
    desc:      '800k Dutch masterworks — no key needed',
    imageCount: 800000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'europeana',
    name:      'Europeana',
    desc:      '50M cultural objects across Europe',
    imageCount: 50000000,
    alwaysOn:  false,
    stateKey:  'europeanaKey',
    storageKey: 'inspo_europeana_key',
    getKeyUrl: 'https://pro.europeana.eu/pages/get-api',
  },
  {
    id:        'harvard',
    name:      'Harvard Art Museums',
    desc:      '250k global art objects, rich metadata',
    imageCount: 250000,
    alwaysOn:  false,
    stateKey:  'harvardKey',
    storageKey: 'inspo_harvard_key',
    getKeyUrl: 'https://forms.gle/apBabyNeWuHMoM5x6',
  },
  {
    id:         'smithsonian',
    name:       'Smithsonian',
    desc:       '4.5M objects across 19 museums — works now, key unlocks higher limits',
    imageCount: 4500000,
    alwaysOn:   true,
    optionalKey: true,
    stateKey:   'smithsonianKey',
    storageKey: 'inspo_smithsonian_key',
    getKeyUrl:  'https://api.data.gov/signup',
    placeholder: 'optional — paste for higher limits',
  },
  {
    id:        'pexels',
    name:      'Pexels',
    desc:      'contemporary photography, 170 countries',
    imageCount: 3200000,
    alwaysOn:  false,
    stateKey:  'pexelsKey',
    storageKey: 'inspo_pexels_key',
    getKeyUrl: 'https://www.pexels.com/api',
  },
  {
    id:        'pixabay',
    name:      'Pixabay',
    desc:      '2.7M CC0 photos & illustrations',
    imageCount: 2700000,
    alwaysOn:  false,
    stateKey:  'pixabayKey',
    storageKey: 'inspo_pixabay_key',
    getKeyUrl: 'https://pixabay.com/api/docs/',
  },
  {
    id:        'getty',
    name:      'Getty Museum',
    desc:      'open-access artworks from J. Paul Getty collection',
    imageCount: 150000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'nga',
    name:      'National Gallery of Art',
    desc:      'US national collection — open access, Washington DC',
    imageCount: 50000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'gbif',
    name:      'GBIF Biodiversity',
    desc:      '2B+ nature observations with CC-licensed images',
    imageCount: 2000000000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'eol',
    name:      'Encyclopedia of Life',
    desc:      'species imagery — 2M+ taxa, CC-licensed',
    imageCount: 2000000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'apod',
    name:      'NASA APOD Archive',
    desc:      'astronomy picture of the day — 10,000+ images',
    imageCount: 10000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'gallica',
    name:      'Gallica (BnF)',
    desc:      'French national library — 5M+ digitized documents',
    imageCount: 5000000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'chronicling',
    name:      'Chronicling America',
    desc:      'historic US newspapers 1770–1963, Library of Congress',
    imageCount: 16000000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'bhl',
    name:      'Biodiversity Heritage Library',
    desc:      '60M+ pages of natural history literature, public key',
    imageCount: 60000000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'carnegie',
    name:      'Carnegie Museum of Art',
    desc:      'Pittsburgh collection, open-access artworks',
    imageCount: 30000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'prado',
    name:      'Museo del Prado',
    desc:      'Spanish masterworks — best-effort (CORS)',
    imageCount: 17000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'parismusees',
    name:      'Paris Musées',
    desc:      '14 Paris museums — best-effort (CORS)',
    imageCount: 330000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'yale',
    name:      'Yale Center for British Art',
    desc:      'British paintings & drawings, IIIF, no key',
    imageCount: 60000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'picsum',
    name:      'Lorem Picsum',
    desc:      'high-quality texture & abstract photography (texture searches)',
    imageCount: 1000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'usgs',
    name:      'USGS ScienceBase',
    desc:      'geological & aerial imagery, US government open data',
    imageCount: 100000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'cooperhewitt',
    name:      'Cooper Hewitt',
    desc:      'Smithsonian design museum — demo token built in',
    imageCount: 200000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'trove',
    name:      'Trove (NLA)',
    desc:      'National Library of Australia — pictures & photos',
    imageCount: 2000000,
    alwaysOn:  false,
    stateKey:  'troveKey',
    storageKey: 'inspo_trove_key',
    getKeyUrl: 'https://trove.nla.gov.au/about/create-something/using-api',
  },
  {
    id:        'digitalnz',
    name:      'DigitalNZ',
    desc:      'New Zealand cultural heritage images',
    imageCount: 30000000,
    alwaysOn:  false,
    stateKey:  'digitalnzKey',
    storageKey: 'inspo_digitalnz_key',
    getKeyUrl: 'https://digitalnz.org/developers',
  },
  {
    id:        'tate',
    name:      'Tate Collection',
    desc:      'Tate London — British & international art, no key',
    imageCount: 77000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'finna',
    name:      'Finnish Heritage (Finna)',
    desc:      '10M+ Finnish cultural heritage items, no key',
    imageCount: 10000000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'soch',
    name:      'Swedish Heritage (SOCH)',
    desc:      'Swedish cultural heritage — best-effort (CORS)',
    imageCount: 1000000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'joconde',
    name:      'Joconde (France)',
    desc:      'French national museum database — data.culture.gouv.fr',
    imageCount: 500000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'mnw',
    name:      'Muzeum Narodowe Warszawa',
    desc:      'Polish National Museum Warsaw, open API',
    imageCount: 100000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'tepapa',
    name:      'Te Papa (New Zealand)',
    desc:      'Museum of NZ — Pacific & Māori taonga, no key',
    imageCount: 100000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'pas',
    name:      'Portable Antiquities Scheme',
    desc:      'UK archaeological finds — British Museum database',
    imageCount: 100000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'smg',
    name:      'Science Museum Group',
    desc:      'Science, technology & medicine history — London',
    imageCount: 100000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'auckland',
    name:      'Auckland Museum',
    desc:      'Auckland War Memorial Museum — NZ & Pacific',
    imageCount: 100000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'photogrammar',
    name:      'Photogrammar (FSA)',
    desc:      '170k FSA/OWI Depression-era photographs — Yale + LOC',
    imageCount: 170000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'wellcome',
    name:      'Wellcome Collection',
    desc:      'History of medicine, science & the body — London',
    imageCount: 250000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'maas',
    name:      'Powerhouse (MAAS)',
    desc:      'Powerhouse Museum Sydney — design, technology, decorative art',
    imageCount: 100000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'smk',
    name:      'SMK (Denmark)',
    desc:      'Statens Museum for Kunst — Danish national gallery',
    imageCount: 40000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'thyssen',
    name:      'Thyssen-Bornemisza',
    desc:      'Museo Thyssen Madrid — best-effort (CORS)',
    imageCount: 20000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'dpla',
    name:      'DPLA',
    desc:      'Digital Public Library of America — 50M+ items',
    imageCount: 50000000,
    alwaysOn:  false,
    stateKey:  'dplaKey',
    storageKey: 'inspo_dpla_key',
    getKeyUrl: 'https://dp.la/info/developers',
  },
  {
    id:        'ddb',
    name:      'German Digital Library (DDB)',
    desc:      '44M cultural objects from German institutions',
    imageCount: 44000000,
    alwaysOn:  false,
    stateKey:  'ddbKey',
    storageKey: 'inspo_ddb_key',
    getKeyUrl: 'https://www.deutsche-digitale-bibliothek.de/user/apikey',
  },
  {
    id:        'artsy',
    name:      'Artsy',
    desc:      'Contemporary art marketplace — needs client_id + client_secret',
    imageCount: 1000000,
    alwaysOn:  false,
    stateKey:  'artsyId',
    storageKey: 'inspo_artsy_id',
    getKeyUrl: 'https://developers.artsy.net',
    artsyDual: true,
  },
  {
    id:        'gemini',
    name:      'Gemini Vision',
    desc:      'AI visual analysis — tags any image · free, 1,500/day',
    imageCount: 0,
    alwaysOn:  false,
    stateKey:  'geminiKey',
    storageKey: 'inspo_gemini_key',
    getKeyUrl: 'https://aistudio.google.com',
    aiProvider: true,
  },
  {
    id:        'claude',
    name:      'Claude (Anthropic)',
    desc:      'claude-sonnet-4-6 vision · bring your own key',
    imageCount: 0,
    alwaysOn:  false,
    stateKey:  'claudeKey',
    storageKey: 'inspo_claude_key',
    getKeyUrl: 'https://console.anthropic.com',
    aiProvider: true,
  },
  {
    id:        'openai',
    name:      'GPT-4o (OpenAI)',
    desc:      'gpt-4o vision · bring your own key · or any OpenAI-compatible endpoint',
    imageCount: 0,
    alwaysOn:  false,
    stateKey:  'openaiKey',
    storageKey: 'inspo_openai_key',
    getKeyUrl: 'https://platform.openai.com/api-keys',
    aiProvider: true,
    hasEndpoint: true,
  },
  {
    id:        'ollama',
    name:      'Ollama (local)',
    desc:      'run models locally — no api key needed · use vision models (llava, llama3.2-vision) for best results',
    imageCount: 0,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: 'https://ollama.com/download',
    aiProvider: true,
    isOllama:  true,
  },
  // ── Batch 4 sources ────────────────────────────────────
  {
    id:        'walters',
    name:      'Walters Art Museum',
    desc:      '27k medieval & Renaissance objects',
    imageCount: 27000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'princeton',
    name:      'Princeton Art Museum',
    desc:      'ancient & Asian art, IIIF',
    imageCount: 100000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'wikidata',
    name:      'Wikidata',
    desc:      'structured image data, 90M items',
    imageCount: 90000000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'noaa',
    name:      'NOAA',
    desc:      'ocean, weather & coastal photography',
    imageCount: 50000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'hubble',
    name:      'Hubble Telescope',
    desc:      'space photography, cached 6h',
    imageCount: 10000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'cornell',
    name:      'Cornell Digital',
    desc:      'botanical prints, ornithology',
    imageCount: 100000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'folger',
    name:      'Folger Library',
    desc:      'Renaissance manuscripts',
    imageCount: 100000,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'onb',
    name:      'Austrian Nat. Library',
    desc:      '12M+ historical items',
    imageCount: 12000000,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'nypl',
    name:      'NYPL Digital',
    desc:      'New York historical collections',
    imageCount: 900000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'mak',
    name:      'MAK Vienna',
    desc:      'design & decorative arts',
    imageCount: 100000,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'louvre',
    name:      'Louvre (via Joconde)',
    desc:      '480k French museum objects',
    imageCount: 480000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'mna',
    name:      'MNA Mexico',
    desc:      'Pre-Columbian & indigenous art',
    imageCount: 50000,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  // ── Batch 7 ────────────────────────────────────────────────
  {
    id:        'mia',
    name:      'Minneapolis Inst. of Art',
    desc:      '50k CC0 works',
    imageCount: 50000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'lacma',
    name:      'LACMA',
    desc:      '20k LA museum public domain',
    imageCount: 20000,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'munch',
    name:      'Munch Museum',
    desc:      'Edvard Munch complete works',
    imageCount: 28000,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'mauritshuis',
    name:      'Mauritshuis',
    desc:      'Vermeer, Rembrandt — Dutch masters',
    imageCount: 800,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'nationalmuseumse',
    name:      'Nationalmuseum Stockholm',
    desc:      'Swedish national art collection',
    imageCount: 6000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'naturalis',
    name:      'Naturalis Biodiversity',
    desc:      '42M Dutch natural history',
    imageCount: 42000000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'nmaahc',
    name:      'NMAAHC (Smithsonian)',
    desc:      'African American history & culture',
    imageCount: 37000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'nasm',
    name:      'Air & Space (Smithsonian)',
    desc:      'aviation, space exploration',
    imageCount: 65000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'whitney',
    name:      'Whitney Museum',
    desc:      '25k American art — CC0 CSV',
    imageCount: 25000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'nationalzoo',
    name:      'National Zoo (Smithsonian)',
    desc:      'animal photography',
    imageCount: 10000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'gbiflit',
    name:      'GBIF Literature',
    desc:      'scientific book illustration specimens',
    imageCount: 500000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'freersackler',
    name:      'Freer|Sackler (Smithsonian)',
    desc:      'Asian and African art',
    imageCount: 40000,
    alwaysOn:  true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'ago',
    name:      'Art Gallery of Ontario',
    desc:      'Canadian and international art',
    imageCount: 100000,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'pem',
    name:      'Peabody Essex Museum',
    desc:      'Asian export art, maritime',
    imageCount: 40000,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'npg',
    name:      'National Portrait Gallery',
    desc:      'British portraits 215k+',
    imageCount: 215000,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'louvread',
    name:      'Louvre Abu Dhabi',
    desc:      'cross-cultural universal art',
    imageCount: 10000,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  // ── Phase 2 sources ────────────────────────────────────
  {
    id:        'unsplash',
    name:      'Unsplash',
    desc:      '5M+ high-res photos, free key, CC0-style',
    imageCount: 5000000,
    alwaysOn:  false,
    stateKey:  'unsplashKey',
    storageKey: 'inspo_unsplash_key',
    getKeyUrl: 'https://unsplash.com/developers',
  },
  {
    id:        'bodleian',
    name:      'Bodleian Libraries',
    desc:      'Oxford University digital collections — manuscripts, maps, rare books',
    imageCount: 400000,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'bsb',
    name:      'BSB Munich',
    desc:      'Bayerische Staatsbibliothek — 15M digitized pages, maps, illuminated manuscripts',
    imageCount: 1000000,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'cudl',
    name:      'Cambridge Digital Library',
    desc:      'Cambridge University manuscripts, scientific records, rare books',
    imageCount: 200000,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'musee_orsay',
    name:      'Musée d\'Orsay',
    desc:      'Impressionist & Post-Impressionist masterworks — Paris',
    imageCount: 20000,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'vangogh_museum',
    name:      'Van Gogh Museum',
    desc:      'World’s largest collection of Van Gogh works — Amsterdam',
    imageCount: 5000,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'khm',
    name:      'Kunsthistorisches Museum',
    desc:      'Habsburg Imperial collections — fine art, antiquities — Vienna',
    imageCount: 100000,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'belvedere',
    name:      'Belvedere Vienna',
    desc:      'Austrian art from Baroque to the 20th century — Vienna',
    imageCount: 10000,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'staedel',
    name:      'Städel Museum',
    desc:      '700 years of European art — Frankfurt’s premier art museum',
    imageCount: 15000,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'rmfab',
    name:      'Royal Museums of Fine Arts Belgium',
    desc:      'Flemish Masters, Ensor, Magritte — Brussels',
    imageCount: 15000,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'guimet',
    name:      'Musée Guimet',
    desc:      'Asian arts from Afghanistan to Japan — Paris',
    imageCount: 10000,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'npm_taipei',
    name:      'National Palace Museum',
    desc:      'Chinese imperial collections — jade, porcelain, calligraphy — Taipei',
    imageCount: 50000,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  // ── Phase F — Fashion & Textile sources ──
  {
    id:        'galliera',
    name:      'Musée Galliera',
    desc:      'Paris couture & fashion museum — haute couture, accessories',
    imageCount: 558,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'arts_decoratifs',
    name:      'Musée des Arts Décoratifs',
    desc:      'Paris — fashion, jewellery, design, decorative arts',
    imageCount: 184,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'centraal_museum',
    name:      'Centraal Museum',
    desc:      'Utrecht — Dutch fashion, costumes, applied arts',
    imageCount: 2180,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'textile_museum_tilburg',
    name:      'Textile Museum Tilburg',
    desc:      'Dutch textile art, weaving, fashion fabrics',
    imageCount: 1337,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'wereldculturen',
    name:      'Museum van Wereldculturen',
    desc:      'Dutch national world cultures — textiles, costumes, ethnographic dress',
    imageCount: 1143,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'dec_arts_prague',
    name:      'Museum of Decorative Arts Prague',
    desc:      'Czech decorative arts — textiles, fashion, glass, furniture',
    imageCount: 45966,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'designmuseum_dk',
    name:      'Designmuseum Danmark',
    desc:      'Copenhagen — Danish & international design, fashion, textiles',
    imageCount: 649,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'boijmans',
    name:      'Museum Boijmans Van Beuningen',
    desc:      'Rotterdam — applied art, fashion, design, painting',
    imageCount: 375,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  {
    id:        'museu_traje',
    name:      'Museu Nacional do Traje',
    desc:      'Lisbon costume museum — Portuguese fashion & dress history',
    imageCount: 161,
    alwaysOn:  true,
    cors:      true,
    stateKey:  null,
    storageKey: null,
    getKeyUrl: null,
  },
  // Phase G — Art, Sculpture & History CORS-blocked (14)
  { id:'kmska',               name:'KMSKA (Royal Museum of Fine Arts Antwerp)', desc:'Flemish & European art — Rubens, Van Eyck, Ensor', imageCount:2860, alwaysOn:true, cors:true, stateKey:null, storageKey:null, getKeyUrl:null },
  { id:'amsterdam_museum',    name:'Amsterdam Museum',                          desc:'History & art of Amsterdam from the Middle Ages', imageCount:2315, alwaysOn:true, cors:true, stateKey:null, storageKey:null, getKeyUrl:null },
  { id:'ngi',                 name:'National Gallery of Ireland',               desc:'European & Irish art — paintings, sculpture, works on paper', imageCount:1845, alwaysOn:true, cors:true, stateKey:null, storageKey:null, getKeyUrl:null },
  { id:'fries_museum',        name:'Fries Museum',                              desc:'Art & history of Friesland, Mata Hari collection', imageCount:1155, alwaysOn:true, cors:true, stateKey:null, storageKey:null, getKeyUrl:null },
  { id:'groeninge',           name:'Groeningemuseum',                           desc:'Flemish Primitives to modern Belgian art in Bruges', imageCount:947,  alwaysOn:true, cors:true, stateKey:null, storageKey:null, getKeyUrl:null },
  { id:'groninger',           name:'Groninger Museum',                          desc:'Art, design & regional history in Groningen', imageCount:858,  alwaysOn:true, cors:true, stateKey:null, storageKey:null, getKeyUrl:null },
  { id:'moma_wd',             name:'Museum of Modern Art (MoMA)',               desc:'Modern & contemporary art — Wikidata bridge', imageCount:659,  alwaysOn:true, cors:true, stateKey:null, storageKey:null, getKeyUrl:null },
  { id:'rijksmuseum_twenthe', name:'Rijksmuseum Twenthe',                       desc:'European art from medieval to contemporary in Enschede', imageCount:568,  alwaysOn:true, cors:true, stateKey:null, storageKey:null, getKeyUrl:null },
  { id:'herzog_anton_ulrich', name:'Herzog Anton Ulrich Museum',                desc:'Old Masters, medieval art & sculpture in Braunschweig', imageCount:261,  alwaysOn:true, cors:true, stateKey:null, storageKey:null, getKeyUrl:null },
  { id:'galleria_palatina',   name:'Galleria Palatina',                         desc:'Renaissance masterpieces in Palazzo Pitti, Florence', imageCount:220,  alwaysOn:true, cors:true, stateKey:null, storageKey:null, getKeyUrl:null },
  { id:'lakenhal',            name:'Museum De Lakenhal',                        desc:'Art & history of Leiden — Rembrandt\'s birthplace', imageCount:178,  alwaysOn:true, cors:true, stateKey:null, storageKey:null, getKeyUrl:null },
  { id:'teylers',             name:'Teylers Museum',                            desc:'Oldest museum in the Netherlands — art, science, fossils', imageCount:161,  alwaysOn:true, cors:true, stateKey:null, storageKey:null, getKeyUrl:null },
  { id:'alte_pinakothek',     name:'Alte Pinakothek',                           desc:'European painting from 14th–18th century in Munich', imageCount:160,  alwaysOn:true, cors:true, stateKey:null, storageKey:null, getKeyUrl:null },
  { id:'quai_branly',         name:'Musée du quai Branly',                      desc:'Indigenous & non-Western art from Africa, Asia, Oceania, Americas', imageCount:154, alwaysOn:true, cors:true, stateKey:null, storageKey:null, getKeyUrl:null },
  // Phase H — 113 World Museum Collection Sources
  ...WD_PHASE_H.map(s => ({ id: s.id, name: s.name, desc: s.desc, imageCount: s.count, alwaysOn: true, cors: true, stateKey: null, storageKey: null, getKeyUrl: null })),
];
