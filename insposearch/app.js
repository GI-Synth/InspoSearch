"use strict";
(() => {
  // src/state.js
  var CONSTANTS = {
    IMAGE_COUNT_DEFAULT: 24,
    IMAGE_COUNT_MIN: 6,
    IMAGE_COUNT_MAX: 150,
    GEMINI_KEY_STORAGE: "inspo_gemini_key",
    CLAUDE_KEY_STORAGE: "inspo_claude_key",
    OPENAI_KEY_STORAGE: "inspo_openai_key",
    DATAMUSE_MAX: 8,
    WIKIMEDIA_LIMIT: 25,
    MET_LIMIT: 20,
    MET_DETAIL_LIMIT: 15,
    ARCHIVE_LIMIT: 15,
    DEBOUNCE_SLIDER: 200,
    RETRY_DELAY: 2e3,
    MAX_RESULTS: 2e3,
    MAX_CHAT_HISTORY: 20,
    HEALTH_MISS_LIMIT: 5,
    // consecutive misses before disabling a source
    FETCH_TIMEOUT: 5e3,
    // default safeFetch timeout (ms)
    COUNTER_DEBOUNCE: 300,
    // updateSourcesActiveCounter debounce (ms)
    // Per-source fetch limit overrides — high-inventory sources get larger quotas,
    // low-inventory sources get smaller ones. Falls back to calculated fetchBatch if absent.
    PER_SOURCE_LIMIT: {
      wikimedia: 30,
      met: 25,
      archive: 20,
      chicago: 25,
      cleveland: 20,
      va: 20,
      nga: 20,
      gbif: 20,
      loc: 20,
      inaturalist: 20,
      carnegie: 8,
      cudl: 8,
      folger: 8,
      hallwyl: 8,
      nivaagaard: 8
    }
  };
  var BADGE_META = {
    wikimedia: ["wiki", "wiki"],
    met: ["met", "met"],
    archive: ["archive", "archive"],
    nasa: ["nasa", "nasa"],
    rijksmuseum: ["rijks", "rijks"],
    europeana: ["euro", "euro"],
    harvard: ["harvard", "harvard"],
    smithsonian: ["smithsonian", "si"],
    pexels: ["pexels", "pexels"],
    inaturalist: ["inaturalist", "nature"],
    loc: ["loc", "loc"],
    openlibrary: ["openlibrary", "books"],
    chicago: ["chicago", "chicago"],
    cleveland: ["cleveland", "cleveland"],
    va: ["va", "v&a"],
    flickr: ["flickr", "flickr"],
    pixabay: ["pixabay", "pixabay"],
    wikiart: ["wikiart", "wikiart"],
    nordic: ["nordic", "nordic"],
    getty: ["getty", "getty"],
    nga: ["nga", "nga"],
    gbif: ["gbif", "gbif"],
    eol: ["eol", "eol"],
    apod: ["apod", "apod"],
    gallica: ["gallica", "gallica"],
    chronicling: ["chronicling", "chronicle"],
    openverse: ["openverse", "openverse"],
    trove: ["trove", "trove"],
    digitalnz: ["digitalnz", "nz"],
    bhl: ["bhl", "bhl"],
    carnegie: ["carnegie", "carnegie"],
    prado: ["prado", "prado"],
    parismusees: ["parismusees", "paris"],
    yale: ["yale", "yale"],
    picsum: ["picsum", "picsum"],
    usgs: ["usgs", "usgs"],
    cooperhewitt: ["cooperhewitt", "design"],
    tate: ["tate", "tate"],
    finna: ["finna", "finna"],
    soch: ["soch", "sweden"],
    joconde: ["joconde", "orsay"],
    mnw: ["mnw", "warsaw"],
    tepapa: ["tepapa", "tepapa"],
    dpla: ["dpla", "dpla"],
    ddb: ["ddb", "ddb"],
    artsy: ["artsy", "artsy"],
    pas: ["pas", "finds"],
    smg: ["smg", "science"],
    auckland: ["auckland", "auckland"],
    photogrammar: ["photogrammar", "fsa"],
    wellcome: ["wellcome", "wellcome"],
    maas: ["maas", "maas"],
    smk: ["smk", "denmark"],
    thyssen: ["thyssen", "thyssen"],
    wdl: ["wdl", "wdl"],
    walters: ["walters", "walters"],
    princeton: ["princeton", "princeton"],
    wikidata: ["wikidata", "wikidata"],
    noaa: ["noaa", "noaa"],
    hubble: ["hubble", "hubble"],
    cornell: ["cornell", "cornell"],
    folger: ["folger", "folger"],
    onb: ["onb", "austria"],
    nypl: ["nypl", "nypl"],
    mak: ["mak", "mak"],
    mna: ["mna", "mna"],
    louvre: ["louvre", "louvre"],
    mia: ["mia", "mia"],
    lacma: ["lacma", "lacma"],
    munch: ["munch", "munch"],
    mauritshuis: ["mauritshuis", "mauritshuis"],
    nationalmuseumse: ["nationalmuseumse", "stockholm"],
    naturalis: ["naturalis", "naturalis"],
    nmaahc: ["nmaahc", "nmaahc"],
    nasm: ["nasm", "nasm"],
    whitney: ["whitney", "whitney"],
    nationalzoo: ["nationalzoo", "zoo"],
    gbiflit: ["gbiflit", "gbif-lit"],
    freersackler: ["freersackler", "freersackler"],
    ago: ["ago", "ago"],
    pem: ["pem", "pem"],
    npg: ["npg", "npg"],
    louvread: ["louvread", "louvread"],
    unsplash: ["unsplash", "unsplash"],
    bodleian: ["bodleian", "bodleian"],
    bsb: ["bsb", "bsb"],
    cudl: ["cudl", "cambridge"],
    idigbio: ["idigbio", "idigbio"],
    ala: ["ala", "ala"],
    nasa_images: ["nasa_images", "nasa"],
    musee_orsay: ["musee_orsay", "orsay"],
    vangogh_museum: ["vangogh_museum", "van-gogh"],
    khm: ["khm", "khm"],
    belvedere: ["belvedere", "belvedere"],
    staedel: ["staedel", "st\xE4del"],
    rmfab: ["rmfab", "rmfab"],
    guimet: ["guimet", "guimet"],
    npm_taipei: ["npm_taipei", "taipei"],
    galliera: ["galliera", "galliera"],
    arts_decoratifs: ["arts_decoratifs", "arts-d\xE9co"],
    centraal_museum: ["centraal_museum", "centraal"],
    textile_museum_tilburg: ["textile_museum_tilburg", "textile-tilburg"],
    wereldculturen: ["wereldculturen", "wereldcult"],
    dec_arts_prague: ["dec_arts_prague", "prague-deco"],
    designmuseum_dk: ["designmuseum_dk", "design-dk"],
    boijmans: ["boijmans", "boijmans"],
    museu_traje: ["museu_traje", "traje"],
    kmska: ["kmska", "kmska"],
    amsterdam_museum: ["amsterdam_museum", "adam"],
    ngi: ["ngi", "ngi"],
    fries_museum: ["fries_museum", "fries"],
    groeninge: ["groeninge", "groeninge"],
    groninger: ["groninger", "groninger"],
    moma_wd: ["moma_wd", "moma"],
    rijksmuseum_twenthe: ["rijksmuseum_twenthe", "twenthe"],
    herzog_anton_ulrich: ["herzog_anton_ulrich", "herzog"],
    galleria_palatina: ["galleria_palatina", "palatina"],
    lakenhal: ["lakenhal", "lakenhal"],
    teylers: ["teylers", "teylers"],
    alte_pinakothek: ["alte_pinakothek", "alte-pin"],
    quai_branly: ["quai_branly", "branly"]
  };
  var WD_PHASE_H = [
    // UK (18)
    { id: "nlw", badge: "nlw", name: "National Library of Wales", cat: ["museums", "archives", "art"], region: "uk", desc: "Artworks, photographs & manuscripts from Wales", count: 18707 },
    { id: "royal_collection", badge: "royal", name: "Royal Collection", cat: ["museums", "art"], region: "uk", desc: "Paintings, drawings & decorative arts from the British Crown", count: 4984 },
    { id: "npg_london", badge: "npg-uk", name: "National Portrait Gallery", cat: ["museums", "art"], region: "uk", desc: "Portraits from the 16th century to present day", count: 2508 },
    { id: "rmuseum_greenwich", badge: "greenwich", name: "Royal Museums Greenwich", cat: ["museums", "art", "historical"], region: "uk", desc: "Maritime art, navigation instruments & astronomy", count: 2264 },
    { id: "walker_gallery", badge: "walker", name: "Walker Art Gallery", cat: ["museums", "art"], region: "uk", desc: "Fine art from medieval to contemporary in Liverpool", count: 1511 },
    { id: "glasgow_museums", badge: "glasgow", name: "Glasgow Museums", cat: ["museums", "art"], region: "uk", desc: "Art & cultural heritage across Glasgow collections", count: 1387 },
    { id: "birmingham_trust", badge: "birm", name: "Birmingham Museums Trust", cat: ["museums", "art"], region: "uk", desc: "Pre-Raphaelites & European fine art in Birmingham", count: 1293 },
    { id: "ashmolean", badge: "ashmolean", name: "Ashmolean Museum", cat: ["museums", "art"], region: "uk", desc: "Art & archaeology \u2014 oldest public museum in UK", count: 1257 },
    { id: "sheffield_museums", badge: "sheffield", name: "Sheffield Museums", cat: ["museums", "art"], region: "uk", desc: "Art, metalwork & social history in Sheffield", count: 1187 },
    { id: "manchester_gallery", badge: "manchester", name: "Manchester Art Gallery", cat: ["museums", "art"], region: "uk", desc: "Fine & decorative art from the 17th century onward", count: 1069 },
    { id: "british_library_wd", badge: "bl", name: "British Library", cat: ["museums", "archives"], region: "uk", desc: "Illuminated manuscripts, maps & rare books", count: 1064 },
    { id: "bowes_museum", badge: "bowes", name: "Bowes Museum", cat: ["museums", "art"], region: "uk", desc: "European fine & decorative art in County Durham", count: 1013 },
    { id: "norfolk_museums", badge: "norfolk", name: "Norfolk Museums", cat: ["museums", "art"], region: "uk", desc: "Norwich School of painters & regional history", count: 859 },
    { id: "british_museum_wd", badge: "bm", name: "British Museum", cat: ["museums", "art", "historical"], region: "uk", desc: "World cultures \u2014 antiquities, prints & drawings", count: 784 },
    { id: "brighton_museum", badge: "brighton", name: "Brighton Museum", cat: ["museums", "art"], region: "uk", desc: "Fine art, fashion & world cultures in Brighton", count: 735 },
    { id: "bristol_museum", badge: "bristol", name: "Bristol City Museum", cat: ["museums", "art"], region: "uk", desc: "Art, geology & archaeology in Bristol", count: 720 },
    { id: "york_gallery", badge: "york", name: "York Art Gallery", cat: ["museums", "art"], region: "uk", desc: "European paintings & studio pottery in York", count: 699 },
    { id: "dulwich_gallery", badge: "dulwich", name: "Dulwich Picture Gallery", cat: ["museums", "art"], region: "uk", desc: "Old Masters in England's first purpose-built gallery", count: 653 },
    // Netherlands (14)
    { id: "kb_nl", badge: "kb-nl", name: "KB National Library", cat: ["museums", "archives"], region: "europe", desc: "Dutch heritage \u2014 prints, maps & manuscripts", count: 2062 },
    { id: "dordrechts_museum", badge: "dordrecht", name: "Dordrechts Museum", cat: ["museums", "art"], region: "europe", desc: "Dutch art from the Golden Age to modern \u2014 Ary Scheffer, Aelbert Cuyp", count: 934 },
    { id: "bonnefanten", badge: "bonnef", name: "Bonnefanten Museum", cat: ["museums", "art"], region: "europe", desc: "Old Masters & contemporary art in Maastricht", count: 609 },
    { id: "museum_rotterdam", badge: "rotterdam", name: "Museum Rotterdam", cat: ["museums", "art", "historical"], region: "europe", desc: "History, art & culture of Rotterdam", count: 515 },
    { id: "kroeller_mueller", badge: "kroller", name: "Kr\xF6ller-M\xFCller Museum", cat: ["museums", "art"], region: "europe", desc: "Van Gogh, Mondrian & a world-renowned sculpture garden", count: 443 },
    { id: "cuypershuis", badge: "cuypers", name: "Cuypershuis", cat: ["museums", "art"], region: "europe", desc: "Works by Pierre Cuypers, architect of the Rijksmuseum", count: 401 },
    { id: "kunstmuseum_denhaag", badge: "denhaag", name: "Kunstmuseum Den Haag", cat: ["museums", "art"], region: "europe", desc: "Mondrian collection & decorative arts in The Hague", count: 364 },
    { id: "museum_gouda", badge: "gouda", name: "Museum Gouda", cat: ["museums", "art"], region: "europe", desc: "Gothic altarpieces, civic guard paintings & stained glass", count: 354 },
    { id: "mesdag_collection", badge: "mesdag", name: "Mesdag Collection", cat: ["museums", "art"], region: "europe", desc: "Barbizon school paintings & Mesdag Panorama", count: 286 },
    { id: "jewish_museum_adam", badge: "jm-adam", name: "Jewish Museum Amsterdam", cat: ["museums", "art", "historical"], region: "europe", desc: "Jewish culture, art & history in Amsterdam", count: 263 },
    { id: "stedelijk_alkmaar", badge: "alkmaar", name: "Stedelijk Museum Alkmaar", cat: ["museums", "art"], region: "europe", desc: "Golden Age paintings from the Alkmaar region", count: 255 },
    { id: "museum_de_waag", badge: "de-waag", name: "Museum De Waag", cat: ["museums", "art"], region: "europe", desc: "Art & history in the medieval weigh house", count: 253 },
    { id: "catharijneconvent", badge: "catharij", name: "Museum Catharijneconvent", cat: ["museums", "art"], region: "europe", desc: "Christian art & culture in Utrecht", count: 219 },
    { id: "maritime_rotterdam", badge: "maritime", name: "Maritime Museum Rotterdam", cat: ["museums", "historical"], region: "europe", desc: "Maritime history, ship models & navigation", count: 216 },
    // Belgium (11)
    { id: "musea_brugge", badge: "brugge", name: "Musea Brugge", cat: ["museums", "art"], region: "europe", desc: "14 museums in Bruges \u2014 Flemish Primitives & city history", count: 4145 },
    { id: "kbr_brussels", badge: "kbr", name: "Royal Library of Belgium", cat: ["museums", "archives"], region: "europe", desc: "Prints, maps & illuminated manuscripts in Brussels", count: 1788 },
    { id: "msk_ghent", badge: "msk", name: "MSK Ghent", cat: ["museums", "art"], region: "europe", desc: "Fine art from the Middle Ages to 20th century in Ghent", count: 1569 },
    { id: "plantin_moretus", badge: "plantin", name: "Museum Plantin-Moretus", cat: ["museums", "art", "archives"], region: "europe", desc: "UNESCO-listed Renaissance printing house in Antwerp", count: 1323 },
    { id: "muzee_ostende", badge: "muzee", name: "Mu.ZEE", cat: ["museums", "art"], region: "europe", desc: "Belgian art from James Ensor to L\xE9on Spilliaert", count: 681 },
    { id: "rmah_brussels", badge: "rmah", name: "Royal Museums of Art & History", cat: ["museums", "art", "historical"], region: "europe", desc: "Antiquity, non-European civilizations & decorative arts", count: 295 },
    { id: "middelheim", badge: "middel", name: "Middelheim Museum", cat: ["museums", "art"], region: "europe", desc: "Open-air sculpture park in Antwerp", count: 231 },
    { id: "mayer_van_den_bergh", badge: "mayer", name: "Museum Mayer van den Bergh", cat: ["museums", "art"], region: "europe", desc: "Bruegel's Dulle Griet & medieval art in Antwerp", count: 218 },
    { id: "rubenshuis", badge: "rubens", name: "Rubenshuis", cat: ["museums", "art"], region: "europe", desc: "Rubens' home & studio with original works", count: 142 },
    { id: "mas_antwerp", badge: "mas", name: "Museum aan de Stroom", cat: ["museums", "art", "historical"], region: "europe", desc: "Port history, global cultures & city life in Antwerp", count: 137 },
    { id: "gallo_roman", badge: "gallo-rom", name: "Gallo-Roman Museum", cat: ["museums", "historical"], region: "europe", desc: "Archaeological finds from Roman Belgium in Tongeren", count: 137 },
    // Germany (18)
    { id: "bavarian_paintings", badge: "bstgs", name: "Bavarian State Painting Collections", cat: ["museums", "art"], region: "europe", desc: "9,600+ European paintings across 18 Bavarian galleries", count: 9637 },
    { id: "gemaeldegalerie_berlin", badge: "gem-ber", name: "Gem\xE4ldegalerie Berlin", cat: ["museums", "art"], region: "europe", desc: "European painting from 13th\u201318th century at Kulturforum", count: 2058 },
    { id: "kunsthalle_karlsruhe", badge: "karlsruh", name: "Kunsthalle Karlsruhe", cat: ["museums", "art"], region: "europe", desc: "Medieval to contemporary art in Baden-W\xFCrttemberg", count: 1342 },
    { id: "germanisches_nm", badge: "gnm", name: "Germanisches Nationalmuseum", cat: ["museums", "art", "historical"], region: "europe", desc: "German art & culture from prehistory to present in Nuremberg", count: 1049 },
    { id: "skd_dresden", badge: "skd", name: "Kunstsammlungen Dresden", cat: ["museums", "art"], region: "europe", desc: "Old Masters & New Masters galleries in Dresden", count: 868 },
    { id: "wallraf_richartz", badge: "wallraf", name: "Wallraf-Richartz Museum", cat: ["museums", "art"], region: "europe", desc: "Medieval to early 20th-century art in Cologne", count: 800 },
    { id: "augustiner_freiburg", badge: "augustin", name: "Augustiner Museum", cat: ["museums", "art"], region: "europe", desc: "Art from the Upper Rhine, medieval to Baroque in Freiburg", count: 793 },
    { id: "alte_nationalgalerie", badge: "alte-nat", name: "Alte Nationalgalerie", cat: ["museums", "art"], region: "europe", desc: "19th-century painting & sculpture on Museum Island Berlin", count: 702 },
    { id: "hamburger_kunsthalle", badge: "hamburg", name: "Hamburger Kunsthalle", cat: ["museums", "art"], region: "europe", desc: "Medieval to contemporary art across three connected buildings", count: 478 },
    { id: "lenbachhaus", badge: "lenbach", name: "Lenbachhaus", cat: ["museums", "art"], region: "europe", desc: "Blue Rider group \u2014 Kandinsky, Marc, Klee in Munich", count: 454 },
    { id: "wagner_museum", badge: "wagner", name: "Martin von Wagner Museum", cat: ["museums", "art"], region: "europe", desc: "Antiquities, paintings & prints in W\xFCrzburg", count: 430 },
    { id: "hessen_kassel", badge: "kassel", name: "Hessen Kassel Heritage", cat: ["museums", "art"], region: "europe", desc: "Old Masters \u2014 Rembrandt, Rubens & Tischbein in Kassel", count: 422 },
    { id: "kunstbibliothek_berlin", badge: "kb-ber", name: "Kunstbibliothek Berlin", cat: ["museums", "art", "archives"], region: "europe", desc: "Design, photography & graphic arts at Kulturforum", count: 338 },
    { id: "schnutgen", badge: "schnutg", name: "Schn\xFCtgen Museum", cat: ["museums", "art"], region: "europe", desc: "Medieval art \u2014 sculpture, textiles, stained glass in Cologne", count: 332 },
    { id: "staatsgalerie_stuttgart", badge: "stuttg", name: "Staatsgalerie Stuttgart", cat: ["museums", "art"], region: "europe", desc: "Old Masters to contemporary, Stirling-Wilford building", count: 264 },
    { id: "berlinische_galerie", badge: "berl-gal", name: "Berlinische Galerie", cat: ["museums", "art"], region: "europe", desc: "Modern art, photography & architecture made in Berlin", count: 245 },
    { id: "westphalian_museum", badge: "westphal", name: "Westphalian State Museum", cat: ["museums", "art"], region: "europe", desc: "Art & cultural history in M\xFCnster \u2014 medieval to modern", count: 249 },
    { id: "mdbk_leipzig", badge: "mdbk", name: "Museum der bildenden K\xFCnste", cat: ["museums", "art"], region: "europe", desc: "German & European art from late medieval to contemporary in Leipzig", count: 211 },
    // France (12)
    { id: "musee_st_raymond", badge: "st-raym", name: "Mus\xE9e Saint-Raymond", cat: ["museums", "art", "historical"], region: "europe", desc: "Roman antiquities & sculpture in Toulouse", count: 1741 },
    { id: "musee_hist_france", badge: "hist-fr", name: "Museum of the History of France", cat: ["museums", "historical"], region: "europe", desc: "Historical paintings at the Palace of Versailles", count: 966 },
    { id: "versailles_wd", badge: "versail", name: "Palace of Versailles", cat: ["museums", "art", "historical"], region: "europe", desc: "Royal portraits, Grand Gallery & garden sculptures", count: 856 },
    { id: "musee_conde", badge: "cond\xE9", name: "Cond\xE9 Museum", cat: ["museums", "art"], region: "europe", desc: "Duc d'Aumale collection in Ch\xE2teau de Chantilly", count: 827 },
    { id: "musee_augustins", badge: "augustns", name: "Mus\xE9e des Augustins", cat: ["museums", "art"], region: "europe", desc: "Romanesque & Gothic sculpture plus paintings in Toulouse", count: 797 },
    { id: "archives_nationales", badge: "arch-nat", name: "Archives nationales", cat: ["archives", "historical"], region: "europe", desc: "French national archives \u2014 seals, maps & historical documents", count: 750 },
    { id: "mba_reims", badge: "reims", name: "Mus\xE9e des Beaux-Arts de Reims", cat: ["museums", "art"], region: "europe", desc: "Cranach, Delacroix, Corot & the Reims cathedral treasury", count: 549 },
    { id: "mnam_paris", badge: "mnam", name: "Mus\xE9e National d'Art Moderne", cat: ["museums", "art"], region: "europe", desc: "Modern & contemporary art at Centre Pompidou", count: 523 },
    { id: "bnf_wd", badge: "bnf", name: "BnF", cat: ["archives", "art"], region: "europe", desc: "French national library \u2014 prints, photographs & manuscripts", count: 499 },
    { id: "mba_dijon", badge: "dijon", name: "Mus\xE9e des Beaux-Arts de Dijon", cat: ["museums", "art"], region: "europe", desc: "Burgundian tombs, Flemish painting & modern art in Dijon", count: 476 },
    { id: "mba_strasbourg", badge: "strasbrg", name: "Mus\xE9e des Beaux-Arts de Strasbourg", cat: ["museums", "art"], region: "europe", desc: "Italian, Spanish, Flemish & Dutch Old Masters in Strasbourg", count: 468 },
    { id: "musee_grenoble", badge: "grenoble", name: "Museum of Grenoble", cat: ["museums", "art"], region: "europe", desc: "European art from 13th century to contemporary in Grenoble", count: 447 },
    // Italy (13)
    { id: "museo_egizio", badge: "egizio", name: "Museo Egizio", cat: ["museums", "art", "historical"], region: "europe", desc: "World's largest collection of Egyptian antiquities outside Cairo", count: 4870 },
    { id: "uffizi_wd", badge: "uffizi", name: "Uffizi Gallery", cat: ["museums", "art"], region: "europe", desc: "Botticelli, Leonardo, Raphael & Titian in Florence", count: 809 },
    { id: "accademia_venice", badge: "accad-ve", name: "Gallerie dell'Accademia", cat: ["museums", "art"], region: "europe", desc: "Venetian painting \u2014 Bellini, Giorgione, Titian, Veronese", count: 384 },
    { id: "capodimonte", badge: "capodim", name: "Museo di Capodimonte", cat: ["museums", "art"], region: "europe", desc: "Farnese collection & Neapolitan art in Naples", count: 253 },
    { id: "naples_archaeology", badge: "naples", name: "Naples Archaeological Museum", cat: ["museums", "historical"], region: "europe", desc: "Pompeii & Herculaneum finds, Farnese marbles & mosaics", count: 242 },
    { id: "brera", badge: "brera", name: "Pinacoteca di Brera", cat: ["museums", "art"], region: "europe", desc: "Raphael, Mantegna, Caravaggio in Milan", count: 220 },
    { id: "capitoline_museums", badge: "capitolin", name: "Capitoline Museums", cat: ["museums", "art", "historical"], region: "europe", desc: "Ancient Roman sculpture & Renaissance art on Capitoline Hill", count: 188 },
    { id: "castelvecchio", badge: "castelv", name: "Castelvecchio Museum", cat: ["museums", "art"], region: "europe", desc: "Medieval & Renaissance art in Verona \u2014 Scarpa-designed galleries", count: 177 },
    { id: "ca_rezzonico", badge: "rezzon", name: "Ca' Rezzonico", cat: ["museums", "art"], region: "europe", desc: "18th-century Venetian art in a Grand Canal palazzo", count: 162 },
    { id: "gallerie_italia", badge: "gal-ita", name: "Gallerie d'Italia", cat: ["museums", "art"], region: "europe", desc: "19th-century Italian art & Old Masters in Milan", count: 153 },
    { id: "galleria_borghese", badge: "borghese", name: "Galleria Borghese", cat: ["museums", "art"], region: "europe", desc: "Bernini sculptures, Caravaggio & Raphael in Rome", count: 152 },
    { id: "galleria_nazionale", badge: "gal-naz", name: "Galleria Nazionale", cat: ["museums", "art"], region: "europe", desc: "Medieval to Baroque art in Palazzo Barberini, Rome", count: 137 },
    { id: "pinacoteca_bologna", badge: "p-bologna", name: "Pinacoteca di Bologna", cat: ["museums", "art"], region: "europe", desc: "Bolognese school \u2014 Carracci, Guido Reni, Raphael", count: 123 },
    // Spain (7)
    { id: "mnac_barcelona", badge: "mnac", name: "MNAC Barcelona", cat: ["museums", "art"], region: "europe", desc: "Romanesque murals, Gothic art & Catalan modernism", count: 941 },
    { id: "mba_cordoba", badge: "cordoba", name: "Fine Arts Museum of C\xF3rdoba", cat: ["museums", "art"], region: "europe", desc: "Spanish painting & sculpture from medieval to modern", count: 311 },
    { id: "victor_balaguer", badge: "balaguer", name: "V\xEDctor Balaguer Museum", cat: ["museums", "art"], region: "europe", desc: "Art collection in Vilanova i la Geltr\xFA, Catalonia", count: 283 },
    { id: "marca_spain", badge: "man-es", name: "National Archaeological Museum", cat: ["museums", "historical"], region: "europe", desc: "Iberian, Roman & medieval archaeology in Madrid", count: 182 },
    { id: "mba_valencia", badge: "valencia", name: "Fine Arts Museum of Valencia", cat: ["museums", "art"], region: "europe", desc: "Valencian Gothic, Ribera, Sorolla & El Greco", count: 157 },
    { id: "academia_san_fernando", badge: "san-fern", name: "Royal Academy of San Fernando", cat: ["museums", "art"], region: "europe", desc: "Goya, Zurbar\xE1n & Arcimboldo in Madrid", count: 154 },
    { id: "carmen_thyssen", badge: "c-thyss", name: "Carmen Thyssen Museum", cat: ["museums", "art"], region: "europe", desc: "19th-century Spanish painting in M\xE1laga", count: 151 },
    // Sweden (5)
    { id: "performing_arts_se", badge: "perf-se", name: "Swedish Performing Arts Museum", cat: ["museums", "art", "historical"], region: "europe", desc: "Theatre, dance, music & circus history in Stockholm", count: 3888 },
    { id: "teknikmuseet", badge: "teknik", name: "National Museum of Science & Technology", cat: ["museums", "science"], region: "europe", desc: "Swedish innovation, industry & technology", count: 3882 },
    { id: "portraits_se", badge: "port-se", name: "National Portrait Gallery of Sweden", cat: ["museums", "art"], region: "europe", desc: "Swedish historical portraits from the 16th century to today", count: 1600 },
    { id: "hallwyl", badge: "hallwyl", name: "Hallwyl Museum", cat: ["museums", "art"], region: "europe", desc: "Art Nouveau private palace & collection in Stockholm", count: 627 },
    { id: "gothenburg_art", badge: "gbg-art", name: "Gothenburg Museum of Art", cat: ["museums", "art"], region: "europe", desc: "Nordic art & French Impressionism in Gothenburg", count: 456 },
    // Denmark (6)
    { id: "nhm_denmark", badge: "nhm-dk", name: "Natural History Museum of Denmark", cat: ["museums", "science", "nature"], region: "europe", desc: "Zoological, geological & palaeontological collections", count: 539 },
    { id: "nivaagaard", badge: "nivaa", name: "Nivaagaard Museum", cat: ["museums", "art"], region: "europe", desc: "Danish Golden Age & Italian Renaissance paintings", count: 240 },
    { id: "skagens_museum", badge: "skagen", name: "Skagens Museum", cat: ["museums", "art"], region: "europe", desc: "Skagen painters \u2014 Kr\xF8yer, Ancher, Drachmann", count: 217 },
    { id: "hirschsprung", badge: "hirsch", name: "Hirschsprung Collection", cat: ["museums", "art"], region: "europe", desc: "Danish Golden Age & Skagen painters in Copenhagen", count: 131 },
    { id: "ny_carlsberg", badge: "glyptk", name: "Ny Carlsberg Glyptotek", cat: ["museums", "art"], region: "europe", desc: "Ancient & French Impressionist art in Copenhagen", count: 125 },
    { id: "frederiksborg", badge: "fredbg", name: "Frederiksborg Castle Museum", cat: ["museums", "art", "historical"], region: "europe", desc: "Danish national history portraits at Frederiksborg Castle", count: 114 },
    // Austria (3)
    { id: "albertina", badge: "albert", name: "Albertina", cat: ["museums", "art"], region: "europe", desc: "D\xFCrer's Hare, Monet, Picasso \u2014 prints & drawings in Vienna", count: 315 },
    { id: "liechtenstein_museum", badge: "liechtn", name: "Liechtenstein Museum", cat: ["museums", "art"], region: "europe", desc: "Princely collections \u2014 Rubens, Van Dyck & decorative arts", count: 183 },
    { id: "leopold_museum", badge: "leopold", name: "Leopold Museum", cat: ["museums", "art"], region: "europe", desc: "Egon Schiele, Gustav Klimt & Vienna Secession at MuseumsQuartier", count: 101 },
    // USA (3)
    { id: "mfa_boston_wd", badge: "mfa-bos", name: "Museum of Fine Arts Boston", cat: ["museums", "art"], region: "americas", desc: "Asian, Egyptian, American & European art", count: 2895 },
    { id: "mfa_houston", badge: "mfa-hou", name: "Museum of Fine Arts Houston", cat: ["museums", "art"], region: "americas", desc: "European, American, Latin American & Asian art in Texas", count: 714 },
    { id: "famsf", badge: "famsf", name: "Fine Arts Museums of San Francisco", cat: ["museums", "art"], region: "americas", desc: "De Young & Legion of Honor \u2014 American & European art", count: 450 },
    // Other Europe (3)
    { id: "hungarian_gallery", badge: "hung", name: "Hungarian National Gallery", cat: ["museums", "art"], region: "europe", desc: "Hungarian art from medieval to contemporary in Buda Castle", count: 528 },
    { id: "finnish_gallery", badge: "finn-gal", name: "Finnish National Gallery", cat: ["museums", "art"], region: "europe", desc: "Finnish & international art across Ateneum, Kiasma & Sinebrychoff", count: 2692 },
    { id: "bilbao_fine_arts", badge: "bilbao", name: "Bilbao Fine Arts Museum", cat: ["museums", "art"], region: "europe", desc: "Spanish, Basque & European art from the 12th century", count: 126 }
  ];
  WD_PHASE_H.forEach((s) => {
    BADGE_META[s.id] = [s.id, s.badge];
  });
  var _isBoardPopup = new URLSearchParams(location.search).get("boardpopup") === "1";
  (function() {
    const t = localStorage.getItem("inspo_theme");
    if (t === "dark") document.body.classList.add("dark");
    if (t === "light") document.body.classList.remove("dark");
  })();
  var STATE = {
    query: "",
    // current search string
    keywords: [],
    // expanded keyword array
    results: [],
    // all fetched ImageItem[]
    selected: [],
    // selected ImageItem[]
    view: "grid",
    // 'grid' | 'board' | '3d'
    sketchMode: false,
    // boolean
    imageCount: 24,
    // slider value
    geminiKey: null,
    // string | null (localStorage)
    claudeKey: null,
    // string | null (localStorage)
    openaiKey: null,
    // string | null (localStorage)
    openaiEndpoint: "",
    // custom OpenAI-compatible base URL
    ollamaEndpoint: "http://localhost:11434",
    // Ollama base URL
    ollamaModel: "llava",
    // default Ollama vision model
    aiProvider: "gemini",
    // 'gemini' | 'claude' | 'openai' | 'ollama'
    chatHistory: [],
    // [{role, content}] conversation log
    chatSnapshot: null,
    // { base64, metadata } grid snapshot
    europeanaKey: null,
    // string | null (localStorage)
    harvardKey: null,
    // string | null (localStorage)
    smithsonianKey: null,
    // string | null (localStorage)
    pexelsKey: null,
    // string | null (localStorage)
    pixabayKey: null,
    // string | null (localStorage)
    flickrKey: null,
    // string | null (localStorage)
    troveKey: null,
    // string | null (localStorage)
    digitalnzKey: null,
    // string | null (localStorage)
    dplaKey: null,
    // string | null (localStorage)
    ddbKey: null,
    // string | null (localStorage)
    artsyId: null,
    // string | null (localStorage)
    artsySecret: null,
    // string | null (localStorage)
    artsyToken: null,
    // runtime only — not persisted
    sourceHealth: {},
    // { sourceName: { hits, misses, lastSeen } }
    loading: false,
    // boolean
    abortController: null,
    // AbortController | null
    prefetchedQuery: "",
    // last query prefetched
    prefetchedKeywords: [],
    // keywords for prefetchedQuery
    currentPage: 1,
    // current load-more page
    hubbleCache: [],
    // cached Hubble images (refreshed every 6h)
    hubbleCacheTimestamp: null,
    // Date.now() of last Hubble fetch
    crossRefMode: null,
    // null | 'connect' | 'interpret'
    lastGeminiCall: null,
    // timestamp of last Gemini API call (rate limiting)
    geminiDailyCount: 0,
    // calls made today
    geminiDailyDate: null,
    // YYYY-MM-DD string for reset check
    disabledSources: /* @__PURE__ */ new Set(),
    // source IDs to skip in searches
    activePreset: null,
    // 'all'|'none'|group name|null (custom mix)
    crossRefTerms: [],
    // the 8 terms used in cross-ref search
    referenceImages: [],
    // pinned reference images
    floatingBarVisible: false,
    // boolean
    floatingBarHidden: false,
    // user dismissed via × (hide, not clear)
    fuseIndex: null,
    // Fuse.js search index on loaded results
    whitneyCache: [],
    // cached Whitney artworks (refreshed every 24h)
    whitneyCacheTimestamp: null,
    // Date.now() of last Whitney fetch
    searchMode: "explore",
    // 'explore' | 'exact'
    keywordExpansion: true,
    // enable Datamuse keyword expansion (toggled from settings)
    pendingOnboardingSearch: false,
    // first-visit guided search
    _searchGen: 0
    // monotonic counter to detect stale results
  };
  var _secondaryControllers = /* @__PURE__ */ new Set();
  var _realRenderGrid = null;
  function set_realRenderGrid(fn) {
    _realRenderGrid = fn;
  }
  var ONBOARDING_TERMS = ["shadow", "texture", "light", "ruins"];
  var NATURE_QUERY_TERMS = [
    "beetle",
    "moth",
    "butterfly",
    "lichen",
    "fungus",
    "coral",
    "species",
    "genus",
    "flora",
    "fauna",
    "specimen",
    "fern",
    "moss",
    "algae",
    "mushroom",
    "insect",
    "arachnid",
    "amphibian",
    "reptile",
    "crustacean",
    "orchid",
    "seabird",
    "mammal",
    "polypore",
    "bryophyte",
    "cephalopod",
    "dragonfly",
    "grasshopper",
    "termite",
    "cicada",
    "barnacle",
    "echinoderm",
    "nudibranch",
    "mycelium",
    "lichen",
    "wildflower",
    "blossom",
    "seedpod",
    "herbarium",
    "bird",
    "fish",
    "whale",
    "shark",
    "snake",
    "lizard",
    "frog",
    "toad",
    "newt",
    "salamander",
    "worm",
    "plankton",
    "diatom",
    "protozoa",
    "caterpillar",
    "wasp",
    "bee",
    "hornet",
    "ant",
    "snail",
    "slug",
    "jellyfish",
    "starfish",
    "urchin",
    "sponge",
    "clam",
    "mussel"
  ];
  var SPACE_QUERY_TERMS = [
    "nebula",
    "galaxy",
    "supernova",
    "quasar",
    "exoplanet",
    "asteroid",
    "comet",
    "meteor",
    "orbit",
    "telescope",
    "aurora",
    "cosmos",
    "pulsar",
    "black hole",
    "solar flare",
    "spacecraft",
    "satellite",
    "mars",
    "jupiter",
    "saturn",
    "venus",
    "milky way",
    "constellation",
    "hubble",
    "voyager",
    "iss",
    "astronaut",
    "lunar",
    "mercury",
    "neptune",
    "uranus",
    "pluto",
    "kepler",
    "cassini",
    "gemini mission",
    "apollo mission",
    "space station",
    "rocket",
    "crater",
    "magnetosphere"
  ];
  var NATURE_ONLY_SOURCES = /* @__PURE__ */ new Set([
    "inaturalist",
    "gbif",
    "eol",
    "naturalis",
    "nationalzoo",
    "gbiflit",
    "idigbio",
    "ala"
  ]);
  var SPACE_ONLY_SOURCES = /* @__PURE__ */ new Set([
    "nasa",
    "apod",
    "hubble",
    "noaa"
  ]);
  function classifyQuery(q) {
    const lower = (q || "").toLowerCase();
    const isNature = NATURE_QUERY_TERMS.some((t) => lower.includes(t));
    const isSpace = SPACE_QUERY_TERMS.some((t) => lower.includes(t));
    return { isNature, isSpace };
  }
  function skipInExactMode(sourceId, queryClass) {
    if (STATE.searchMode !== "exact") return false;
    if (!queryClass.isNature && NATURE_ONLY_SOURCES.has(sourceId)) return true;
    if (!queryClass.isSpace && SPACE_ONLY_SOURCES.has(sourceId)) return true;
    return false;
  }
  var SOURCE_DOMAINS = {
    wikimedia: "commons.wikimedia.org",
    met: "metmuseum.org",
    archive: "archive.org",
    nasa: "images.nasa.gov",
    inaturalist: "inaturalist.org",
    loc: "loc.gov",
    openlibrary: "openlibrary.org",
    chicago: "artic.edu",
    cleveland: "clevelandart.org",
    va: "vam.ac.uk",
    wikiart: "wikiart.org",
    flickr: "flickr.com",
    rijksmuseum: "rijksmuseum.nl",
    rijks: "rijksmuseum.nl",
    europeana: "europeana.eu",
    harvard: "harvardartmuseums.org",
    smithsonian: "si.edu",
    pexels: "pexels.com",
    pixabay: "pixabay.com",
    getty: "getty.edu",
    nga: "nga.gov",
    gbif: "gbif.org",
    eol: "eol.org",
    apod: "apod.nasa.gov",
    gallica: "gallica.bnf.fr",
    chronicling: "chroniclingamerica.loc.gov",
    openverse: "openverse.org",
    trove: "trove.nla.gov.au",
    digitalnz: "digitalnz.org",
    bhl: "biodiversitylibrary.org",
    prado: "museodelprado.es",
    yale: "britishart.yale.edu",
    usgs: "usgs.gov",
    tate: "tate.org.uk",
    dpla: "dp.la",
    ddb: "deutsche-digitale-bibliothek.de",
    artsy: "artsy.net",
    nypl: "digitalcollections.nypl.org",
    louvre: "louvre.fr",
    lacma: "lacma.org",
    whitney: "whitney.org",
    gemini: "aistudio.google.com",
    // Phase 2
    unsplash: "unsplash.com",
    bodleian: "digital.bodleian.ox.ac.uk",
    bsb: "digitale-sammlungen.de",
    cudl: "cudl.lib.cam.ac.uk"
  };
  var SEED_MAP = {
    brutalism: ["concrete", "monolithic", "raw", "void", "weight"],
    fashion: ["silhouette", "drape", "texture", "body", "volume"],
    nature: ["organic", "erosion", "growth", "decay", "light"],
    minimal: ["reduction", "negative space", "restraint", "grid", "white"],
    dark: ["shadow", "depth", "contrast", "absence", "night"],
    color: ["pigment", "saturation", "hue", "spectrum", "dye"],
    architecture: ["structure", "facade", "material", "threshold", "proportion"],
    portrait: ["gaze", "skin", "expression", "identity", "presence"],
    abstract: ["form", "gesture", "mark", "field", "tension"],
    vintage: ["patina", "grain", "fade", "archive", "memory"]
  };
  var MOVEMENT_SYNONYMS = {
    impressionism: ["monet", "renoir", "sisley", "pissarro", "degas", "c\xE9zanne", "manet", "berthe morisot", "plein air", "en plein air"],
    "post-impressionism": ["van gogh", "gauguin", "c\xE9zanne", "seurat", "pointillism", "toulouse-lautrec", "signac"],
    expressionism: ["munch", "kirchner", "nolde", "kandinsky", "marc", "die br\xFCcke", "der blaue reiter"],
    surrealism: ["dal\xED", "magritte", "ernst", "mir\xF3", "tanguy", "breton", "automatism", "dream imagery"],
    cubism: ["picasso", "braque", "l\xE9ger", "gris", "cubist", "fragmentation", "multiple perspectives"],
    fauvism: ["matisse", "derain", "vlaminck", "dufy", "bold color", "wild beasts"],
    futurism: ["boccioni", "balla", "severini", "marinetti", "speed", "dynamism", "modern life"],
    dadaism: ["duchamp", "tzara", "arp", "schwitters", "readymade", "anti-art", "collage"],
    minimalism: ["judd", "flavin", "andre", "lewitt", "stella", "serial forms", "primary structures"],
    "pop art": ["warhol", "lichtenstein", "oldenburg", "rosenquist", "hamilton", "mass media", "consumer culture"],
    "art nouveau": ["mucha", "klimt", "gaud\xED", "tiffany", "guimard", "organic line", "jugendstil", "stile liberty"],
    "art deco": ["cassandre", "ert\xE9", "tamara de lempicka", "chrysler building", "geometric luxury", "1920s"],
    baroque: ["caravaggio", "bernini", "rubens", "rembrandt", "vel\xE1zquez", "chiaroscuro", "dramatic light"],
    romanticism: ["delacroix", "turner", "friedrich", "constable", "goya", "sublime", "emotion", "heroic landscape"],
    realism: ["courbet", "millet", "homer", "eakins", "daumier", "working class", "social observation"],
    symbolism: ["moreau", "redon", "puvis de chavannes", "khnopff", "esoteric", "dream", "mystical"],
    "pre-raphaelite": ["rossetti", "millais", "hunt", "burne-jones", "waterhouse", "medieval revivalism", "detailed nature"],
    neoclassicism: ["david", "ingres", "canova", "thorvaldsen", "greek ideal", "roman virtue", "grand manner"],
    mannerism: ["pontormo", "parmigianino", "bronzino", "elongated figures", "artifice", "virtuosity"],
    constructivism: ["tatlin", "rodchenko", "lissitzky", "popova", "geometric", "revolutionary art", "productivism"],
    "abstract expressionism": ["pollock", "de kooning", "rothko", "kline", "newman", "action painting", "color field"]
  };
  var SPECIES_SYNONYMS = {
    owl: ["strigiformes", "bubo", "tyto", "athene noctua", "strix"],
    eagle: ["aquila", "haliaeetus", "accipitridae", "raptor"],
    hawk: ["accipiter", "buteo", "raptor", "falconiformes"],
    falcon: ["falco", "peregrine", "kestrel", "falconidae"],
    heron: ["ardea", "ardeidae", "egret", "great blue heron"],
    crane: ["grus", "gruidae", "sandhill crane", "whooping crane"],
    parrot: ["psittacidae", "ara", "macaw", "cockatoo", "budgerigar"],
    hummingbird: ["trochilidae", "archilochus", "calypte", "iridescent"],
    whale: ["cetacea", "balaenoptera", "megaptera", "humpback", "blue whale"],
    dolphin: ["delphinidae", "tursiops", "bottlenose", "porpoise"],
    wolf: ["canis lupus", "canidae", "grey wolf", "timber wolf"],
    bear: ["ursidae", "ursus", "grizzly", "brown bear", "polar bear"],
    deer: ["cervidae", "cervus", "odocoileus", "white-tailed", "elk", "stag"],
    fox: ["vulpes", "red fox", "arctic fox", "fennec"],
    lion: ["panthera leo", "felidae", "big cat", "african lion"],
    tiger: ["panthera tigris", "bengal tiger", "siberian tiger", "felidae"],
    elephant: ["elephantidae", "loxodonta", "elephas maximus", "proboscidea"],
    orchid: ["orchidaceae", "phalaenopsis", "cattleya", "dendrobium", "oncidium"],
    rose: ["rosa", "rosaceae", "hybrid tea", "floribunda", "damask rose"],
    lily: ["lilium", "liliaceae", "day lily", "tiger lily", "madonna lily"],
    fern: ["polypodiopsida", "pteridium", "asplenium", "dryopteris"],
    mushroom: ["agaricales", "amanita", "boletus", "fungi", "mycology"],
    butterfly: ["lepidoptera", "papilionidae", "nymphalidae", "monarch", "swallowtail"],
    beetle: ["coleoptera", "scarabaeidae", "cerambycidae", "weevil", "ladybug"],
    dragonfly: ["odonata", "anisoptera", "libellulidae", "damselfly"],
    coral: ["anthozoa", "scleractinia", "reef coral", "brain coral", "staghorn"],
    shark: ["selachimorpha", "carcharodon", "great white", "hammerhead", "requiem"],
    turtle: ["testudines", "cheloniidae", "sea turtle", "tortoise", "terrapin"],
    frog: ["anura", "ranidae", "tree frog", "dendrobatidae", "amphibian"],
    snake: ["serpentes", "colubridae", "python", "viper", "cobra"]
  };
  var PERIOD_ALIASES = {
    "belle \xE9poque": ["1871-1914", "gilded age", "art nouveau era", "pre-war paris", "la belle \xE9poque"],
    "gilded age": ["1870-1900", "belle \xE9poque", "industrial wealth", "american opulence"],
    "jazz age": ["1920s", "roaring twenties", "art deco", "harlem renaissance", "flapper"],
    "middle ages": ["medieval", "5th-15th century", "feudalism", "gothic", "romanesque", "illuminated manuscript"],
    "antiquity": ["ancient", "classical", "greco-roman", "hellenistic", "roman empire"],
    "ancient egypt": ["pharaoh", "hieroglyphics", "nile", "pyramid", "tomb painting", "papyrus"],
    "ancient greece": ["hellenistic", "attic", "red-figure", "black-figure", "parthenon", "amphora"],
    "ancient rome": ["roman empire", "pompeii", "fresco", "mosaic", "colosseum", "forum"],
    "edo period": ["tokugawa", "17th-19th century", "ukiyo-e", "woodblock", "kabuki", "japanese art"],
    "meiji era": ["meiji restoration", "1868-1912", "japanese modernisation", "shin-hanga"],
    "ming dynasty": ["1368-1644", "chinese porcelain", "blue and white", "forbidden city", "scroll painting"],
    "qing dynasty": ["1644-1912", "manchu", "famille rose", "imperial china", "canton enamel"],
    "mughal": ["mughal empire", "1526-1857", "miniature painting", "mughal architecture", "taj mahal"],
    "byzantine": ["eastern roman", "icon", "mosaic", "hagia sophia", "gold ground", "orthodox art"],
    "viking age": ["norse", "8th-11th century", "rune", "longship", "scandinavian", "berserker"],
    "industrial revolution": ["18th century", "19th century", "factory", "steam", "victorian", "mechanisation"],
    "space age": ["1960s", "nasa", "atomic age", "midcentury modern", "futuristic", "space race"],
    "cold war": ["1947-1991", "iron curtain", "nuclear age", "propaganda", "space race"],
    "harlem renaissance": ["1920s", "1930s", "african american art", "jazz", "langston hughes", "aaron douglas"]
  };
  var MULTILINGUAL_ART_MAP = {
    landscape: ["paysage", "landschaft", "landschap", "paisaje"],
    portrait: ["portrait", "portr\xE4t", "portret", "retrato"],
    "still life": ["nature morte", "stillleben", "stilleven", "bodeg\xF3n"],
    flower: ["fleur", "blume", "bloem", "flor"],
    flowers: ["fleurs", "blumen", "bloemen", "flores"],
    dog: ["chien", "hund", "hond", "perro"],
    cat: ["chat", "katze", "kat", "gato"],
    horse: ["cheval", "pferd", "paard", "caballo"],
    bird: ["oiseau", "vogel", "vogel", "p\xE1jaro"],
    fish: ["poisson", "fisch", "vis", "pez"],
    forest: ["for\xEAt", "wald", "woud", "bosque"],
    sea: ["mer", "meer", "zee", "mar"],
    ocean: ["oc\xE9an", "ozean", "oceaan", "oc\xE9ano"],
    mountain: ["montagne", "berg", "berg", "monta\xF1a"],
    river: ["rivi\xE8re", "fluss", "rivier", "r\xEDo"],
    city: ["ville", "stadt", "stad", "ciudad"],
    market: ["march\xE9", "markt", "markt", "mercado"],
    church: ["\xE9glise", "kirche", "kerk", "iglesia"],
    castle: ["ch\xE2teau", "schloss", "kasteel", "castillo"],
    woman: ["femme", "frau", "vrouw", "mujer"],
    man: ["homme", "mann", "man", "hombre"],
    child: ["enfant", "kind", "kind", "ni\xF1o"],
    soldier: ["soldat", "soldat", "soldaat", "soldado"],
    angel: ["ange", "engel", "engel", "\xE1ngel"],
    light: ["lumi\xE8re", "licht", "licht", "luz"],
    shadow: ["ombre", "schatten", "schaduw", "sombra"],
    gold: ["or", "gold", "goud", "oro"],
    red: ["rouge", "rot", "rood", "rojo"],
    blue: ["bleu", "blau", "blauw", "azul"],
    green: ["vert", "gr\xFCn", "groen", "verde"],
    black: ["noir", "schwarz", "zwart", "negro"],
    white: ["blanc", "wei\xDF", "wit", "blanco"],
    textile: ["textile", "textil", "textiel", "textil"],
    fabric: ["tissu", "stoff", "stof", "tela"],
    lace: ["dentelle", "spitze", "kant", "encaje"],
    dress: ["robe", "kleid", "jurk", "vestido"],
    hat: ["chapeau", "hut", "hoed", "sombrero"],
    tree: ["arbre", "baum", "boom", "\xE1rbol"],
    sun: ["soleil", "sonne", "zon", "sol"],
    moon: ["lune", "mond", "maan", "luna"],
    sky: ["ciel", "himmel", "hemel", "cielo"],
    cloud: ["nuage", "wolke", "wolk", "nube"],
    fire: ["feu", "feuer", "vuur", "fuego"],
    water: ["eau", "wasser", "water", "agua"],
    stone: ["pierre", "stein", "steen", "piedra"],
    ceramic: ["c\xE9ramique", "keramik", "keramiek", "cer\xE1mica"],
    manuscript: ["manuscrit", "manuskript", "manuscript", "manuscrito"],
    map: ["carte", "karte", "kaart", "mapa"],
    book: ["livre", "buch", "boek", "libro"],
    print: ["estampe", "druck", "prent", "grabado"],
    engraving: ["gravure", "gravur", "gravure", "grabado"],
    drawing: ["dessin", "zeichnung", "tekening", "dibujo"],
    painting: ["peinture", "gem\xE4lde", "schilderij", "pintura"],
    sculpture: ["sculpture", "skulptur", "sculptuur", "escultura"],
    photograph: ["photographie", "fotografie", "fotografie", "fotograf\xEDa"],
    architecture: ["architecture", "architektur", "architectuur", "arquitectura"],
    ornament: ["ornement", "ornament", "ornament", "ornamento"],
    fruit: ["fruit", "frucht", "fruit", "fruta"],
    rose: ["rose", "rose", "roos", "rosa"],
    lily: ["lys", "lilie", "lelie", "lirio"],
    tulip: ["tulipe", "tulpe", "tulp", "tulip\xE1n"],
    butterfly: ["papillon", "schmetterling", "vlinder", "mariposa"],
    shell: ["coquille", "muschel", "schelp", "concha"],
    vase: ["vase", "vase", "vaas", "jarr\xF3n"],
    garden: ["jardin", "garten", "tuin", "jard\xEDn"],
    village: ["village", "dorf", "dorp", "pueblo"],
    street: ["rue", "stra\xDFe", "straat", "calle"],
    bridge: ["pont", "br\xFCcke", "brug", "puente"],
    ship: ["navire", "schiff", "schip", "barco"],
    battle: ["bataille", "schlacht", "slag", "batalla"],
    death: ["mort", "tod", "dood", "muerte"],
    love: ["amour", "liebe", "liefde", "amor"],
    music: ["musique", "musik", "muziek", "m\xFAsica"],
    dance: ["danse", "tanz", "dans", "danza"],
    hunt: ["chasse", "jagd", "jacht", "caza"],
    mythology: ["mythologie", "mythologie", "mythologie", "mitolog\xEDa"],
    allegory: ["all\xE9gorie", "allegorie", "allegorie", "alegor\xEDa"]
  };
  var _ERA_REGEX = /\b(\d{4}s|\d{3}0s|\d{1,2}(st|nd|rd|th)\s+century|medieval|ancient|classical|byzantine|romanesque|gothic|renaissance|baroque|enlightenment|victorian|edwardian)\b/i;
  var _MEDIUM_TERMS = {
    Oil: ["oil painting", "oil on canvas", "oil on panel", "oil on board"],
    Watercolor: ["watercolor", "watercolour", "gouache", "tempera", "opaque watercolor"],
    Print: ["etching", "engraving", "lithograph", "woodcut", "mezzotint", "aquatint", "linocut", "screenprint", "woodblock", "silkscreen"],
    Photograph: ["photograph", "daguerreotype", "albumen print", "silver gelatin", "autochromes", "calotype", "cyanotype", "tintype"],
    Sculpture: ["sculpture", "bronze", "marble", "terracotta", "relief", "alabaster", "ivory carving"],
    Textile: ["tapestry", "embroidery", "weaving", "lace", "quilt", "needlework", "woven", "brocade"],
    Ceramic: ["pottery", "porcelain", "ceramic", "faience", "majolica", "earthenware", "stoneware", "delftware"],
    Drawing: ["drawing", "sketch", "chalk", "charcoal", "pen and ink", "pencil drawing", "pastel"],
    Manuscript: ["illuminated manuscript", "manuscript", "parchment", "vellum", "codex", "book of hours"]
  };
  var _MOVEMENT_SEEDS = {
    impressionism: ["plein air", "19th century", "paris salon", "post-impressionism"],
    baroque: ["17th century", "chiaroscuro", "tenebrism", "counter-reformation"],
    renaissance: ["humanism", "15th century", "16th century", "disegno", "perspectiva"],
    romanticism: ["sublime", "19th century", "nationalism", "emotion", "landscape painting"],
    modernism: ["avant-garde", "20th century", "abstraction", "formalism"],
    "art nouveau": ["jugendstil", "stile liberty", "decorative arts", "1900", "organic forms"],
    "art deco": ["1920s", "1930s", "geometric", "streamlined", "jazz age"],
    ukiyo: ["ukiyo-e", "edo period", "woodblock print", "japanese art", "meiji"],
    surrealism: ["automatism", "dream", "unconscious", "1920s", "dada"],
    cubism: ["1910s", "multiple perspectives", "fragmentation", "geometric abstraction"]
  };
  var _MOVEMENT_TERMS = Object.keys(_MOVEMENT_SEEDS).concat([
    "expressionism",
    "fauvism",
    "realism",
    "symbolism",
    "pointillism",
    "futurism",
    "constructivism",
    "dadaism",
    "minimalism",
    "conceptual art",
    "pop art",
    "mannerism",
    "neoclassicism",
    "pre-raphaelite",
    "abstract expressionism",
    "fluxus",
    "mail art",
    "outsider art",
    "folk art",
    "naive art"
  ]);
  var _SPECIES_PATTERN = /^[A-Z][a-z]{2,}\s[a-z]{3,}$/;
  function classifyQueryV2(q) {
    if (!q) return {};
    const lq = q.toLowerCase().trim();
    const original = q.trim();
    const eraMatch = _ERA_REGEX.exec(lq);
    const era = eraMatch ? eraMatch[0].toLowerCase() : null;
    let medium = null;
    outer: for (const [type, variants] of Object.entries(_MEDIUM_TERMS)) {
      for (const v of variants) {
        if (lq.includes(v)) {
          medium = type;
          break outer;
        }
      }
      if (lq.includes(type.toLowerCase())) {
        medium = type;
        break;
      }
    }
    let movement = null;
    for (const mv of _MOVEMENT_TERMS) {
      if (lq.includes(mv)) {
        movement = mv;
        break;
      }
    }
    const movementSeeds = movement ? _MOVEMENT_SEEDS[movement] || [] : [];
    const words = original.split(/\s+/);
    const isTitleCase = (w) => /^[A-Z][a-z]{1,}$/.test(w);
    const isArtist = words.length >= 2 && words.length <= 4 && words.every(isTitleCase) && !NATURE_QUERY_TERMS.some((t) => lq === t || lq.startsWith(t + " ")) && !["The ", "A ", "An "].some((p) => original.startsWith(p));
    const isSpecies = _SPECIES_PATTERN.test(original) || [
      "bird",
      "mammal",
      "reptile",
      "amphibian",
      "insect",
      "beetle",
      "butterfly",
      "moth",
      "orchid",
      "fern",
      "lichen",
      "fungus",
      "spider"
    ].some((k) => lq === k);
    return { era, medium, movement, movementSeeds, isArtist, isSpecies };
  }
  function parseNegativeTerms(query) {
    if (!query || !query.includes(" NOT ")) return { positive: query, negatives: [] };
    const parts = query.split(/\sNOT\s/i);
    const positive = (parts[0] || "").trim();
    const negatives = parts.slice(1).map((p) => p.trim().toLowerCase()).filter(Boolean);
    return { positive, negatives };
  }
  function filterNegativeTerms(items, negatives) {
    if (!negatives.length) return items;
    return items.filter((item) => {
      const hay = `${item.title || ""} ${item.description || ""} ${(item.tags || []).join(" ")}`.toLowerCase();
      return !negatives.some((neg) => hay.includes(neg));
    });
  }
  STATE.geminiKey = localStorage.getItem(CONSTANTS.GEMINI_KEY_STORAGE) || null;
  STATE.claudeKey = localStorage.getItem(CONSTANTS.CLAUDE_KEY_STORAGE) || null;
  STATE.openaiKey = localStorage.getItem(CONSTANTS.OPENAI_KEY_STORAGE) || null;
  STATE.openaiEndpoint = localStorage.getItem("inspo_openai_endpoint") || "";
  STATE.ollamaEndpoint = localStorage.getItem("inspo_ollama_endpoint") || "http://localhost:11434";
  STATE.ollamaModel = localStorage.getItem("inspo_ollama_model") || "llava";
  STATE.aiProvider = localStorage.getItem("inspo_ai_provider") || "gemini";
  STATE.europeanaKey = localStorage.getItem("inspo_europeana_key") || null;
  STATE.harvardKey = localStorage.getItem("inspo_harvard_key") || null;
  STATE.smithsonianKey = localStorage.getItem("inspo_smithsonian_key") || null;
  STATE.pexelsKey = localStorage.getItem("inspo_pexels_key") || null;
  STATE.pixabayKey = localStorage.getItem("inspo_pixabay_key") || null;
  STATE.flickrKey = localStorage.getItem("inspo_flickr_key") || null;
  STATE.troveKey = localStorage.getItem("inspo_trove_key") || null;
  STATE.digitalnzKey = localStorage.getItem("inspo_digitalnz_key") || null;
  STATE.dplaKey = localStorage.getItem("inspo_dpla_key") || null;
  STATE.ddbKey = localStorage.getItem("inspo_ddb_key") || null;
  STATE.artsyId = localStorage.getItem("inspo_artsy_id") || null;
  STATE.artsySecret = localStorage.getItem("inspo_artsy_secret") || null;
  STATE.unsplashKey = localStorage.getItem("inspo_unsplash_key") || null;
  var ALL_SOURCES = [
    "wikimedia",
    "met",
    "archive",
    "nasa",
    "inaturalist",
    "loc",
    "openlibrary",
    "chicago",
    "cleveland",
    "va",
    "wikiart",
    "nordic",
    "flickr",
    "europeana",
    "rijksmuseum",
    "harvard",
    "smithsonian",
    "pexels",
    "pixabay",
    "getty",
    "nga",
    "gbif",
    "eol",
    "apod",
    "gallica",
    "chronicling",
    "openverse",
    "trove",
    "digitalnz",
    "bhl",
    "carnegie",
    "prado",
    "parismusees",
    "yale",
    "picsum",
    "usgs",
    "cooperhewitt",
    "tate",
    "finna",
    "soch",
    "joconde",
    "mnw",
    "tepapa",
    "dpla",
    "artsy",
    "pas",
    "smg",
    "auckland",
    "photogrammar",
    "wellcome",
    "maas",
    "smk",
    "thyssen",
    "wdl",
    "walters",
    "princeton",
    "wikidata",
    "noaa",
    "hubble",
    "cornell",
    "folger",
    "onb",
    "nypl",
    "mak",
    "mna",
    "louvre",
    // Batch 7
    "mia",
    "lacma",
    "munch",
    "mauritshuis",
    "nationalmuseumse",
    "naturalis",
    "nmaahc",
    "nasm",
    "whitney",
    "nationalzoo",
    "gbiflit",
    "freersackler",
    "ago",
    "pem",
    "npg",
    "louvread",
    // Phase 2
    "unsplash",
    "bodleian",
    "bsb",
    "cudl",
    // Phase A — Aggregator Sub-Collections (60)
    // A1: Europeana sub-collections (20)
    "euro_rijksmuseum",
    "euro_fashion",
    "euro_ddb",
    "euro_bnf",
    "euro_bne",
    "euro_kb",
    "euro_bn_pl",
    "euro_nkr",
    "euro_photography",
    "euro_sounds",
    "euro_newspapers",
    "euro_kulturpool",
    "euro_hispana",
    "euro_nuk",
    "euro_estonian",
    "euro_lithuanian",
    "euro_latvian",
    "euro_hungarian",
    "euro_romanian",
    "euro_bulgarian",
    // A2: DPLA hub sub-collections (15)
    "dpla_california",
    "dpla_commonwealth",
    "dpla_empire",
    "dpla_mountain_west",
    "dpla_minnesota",
    "dpla_michigan",
    "dpla_illinois",
    "dpla_kentucky",
    "dpla_south_carolina",
    "dpla_georgia",
    "dpla_texas",
    "dpla_pacific_nw",
    "dpla_ohio",
    "dpla_pennsylvania",
    "dpla_new_england",
    // A3: Smithsonian sub-museums (15)
    "si_nmah",
    "si_nmnh",
    "si_npg_dc",
    "si_saam",
    "si_hmsg",
    "si_nzp",
    "si_chndm",
    "si_fsg",
    "si_nmafa",
    "si_nmai",
    "si_nmaahc2",
    "si_nasm2",
    "si_npm",
    "si_acm",
    "si_renwick",
    // A4: Wikimedia category filters (10)
    "wmc_fashion",
    "wmc_architecture",
    "wmc_paintings",
    "wmc_sculptures",
    "wmc_maps",
    "wmc_natural_history",
    "wmc_portraits",
    "wmc_botanical",
    "wmc_scientific",
    "wmc_street",
    // Phase B — zero-auth free APIs (2)
    "idigbio",
    "ala",
    // Phase D — niche & specialized (1)
    "nasa_images",
    // Phase E — CORS-blocked, cache-first (13)
    "nhm_london",
    "wallace_collection",
    "fitzwilliam",
    "national_gallery_london",
    "scottish_national",
    "musee_orsay",
    "vangogh_museum",
    "khm",
    "belvedere",
    "staedel",
    "rmfab",
    "guimet",
    "npm_taipei",
    // Phase F — Fashion & Textile CORS-blocked (9)
    "galliera",
    "arts_decoratifs",
    "centraal_museum",
    "textile_museum_tilburg",
    "wereldculturen",
    "dec_arts_prague",
    "designmuseum_dk",
    "boijmans",
    "museu_traje",
    // Phase G — Art, Sculpture & History CORS-blocked (14)
    "kmska",
    "amsterdam_museum",
    "ngi",
    "fries_museum",
    "groeninge",
    "groninger",
    "moma_wd",
    "rijksmuseum_twenthe",
    "herzog_anton_ulrich",
    "galleria_palatina",
    "lakenhal",
    "teylers",
    "alte_pinakothek",
    "quai_branly",
    // Phase H — 113 World Museum Collection Sources
    ...WD_PHASE_H.map((s) => s.id),
    // DDB — Deutsche Digitale Bibliothek (key-gated)
    "ddb"
  ];
  var SOURCE_GROUPS = {
    museums: [
      "met",
      "rijksmuseum",
      "chicago",
      "cleveland",
      "va",
      "getty",
      "nga",
      "walters",
      "princeton",
      "tate",
      "smk",
      "thyssen",
      "prado",
      "louvre",
      "joconde",
      "mnw",
      "parismusees",
      "cooperhewitt",
      "carnegie",
      "harvard",
      "yale",
      "folger",
      "maas",
      "auckland",
      "tepapa",
      "wellcome",
      "smg",
      "pas",
      "photogrammar",
      "cornell",
      "mna",
      "onb",
      "nypl",
      "mak",
      "mia",
      "lacma",
      "munch",
      "mauritshuis",
      "nationalmuseumse",
      "ago",
      "pem",
      "nmaahc",
      "nasm",
      "whitney",
      "freersackler",
      "npg",
      "louvread"
    ],
    photography: [
      "flickr",
      "pexels",
      "pixabay",
      "noaa",
      "nasa",
      "apod",
      "hubble",
      "loc",
      "nypl",
      "archive",
      "chronicling",
      "openverse",
      "trove",
      "digitalnz",
      "wikidata",
      "inaturalist",
      "usgs",
      "finna",
      "mia",
      "lacma",
      "whitney",
      "unsplash"
    ],
    nature: [
      "inaturalist",
      "gbif",
      "eol",
      "bhl",
      "noaa",
      "hubble",
      "apod",
      "nasa",
      "usgs",
      "naturalis",
      "nationalzoo",
      "gbiflit"
    ],
    historical: [
      "archive",
      "chronicling",
      "gallica",
      "loc",
      "trove",
      "digitalnz",
      "wdl",
      "bhl",
      "folger",
      "onb",
      "nypl",
      "soch",
      "nordic",
      "lacma",
      "mauritshuis",
      "nationalmuseumse",
      "bodleian",
      "cudl",
      "bsb",
      "ddb"
    ],
    artdesign: [
      "wikiart",
      "wikidata",
      "openverse",
      "cooperhewitt",
      "tate",
      "va",
      "artsy",
      "dpla",
      "europeana",
      "getty",
      "nga",
      "carnegie",
      "maas",
      "smk",
      "thyssen",
      "wellcome",
      "rijksmuseum",
      "parismusees",
      "chicago",
      "cleveland",
      "mia",
      "lacma",
      "mauritshuis",
      "whitney",
      "munch",
      "freersackler"
    ],
    maps: ["loc", "usgs", "nypl", "wdl", "bsb", "bodleian", "cudl"],
    fashion: ["va", "nordic", "cooperhewitt", "mak", "maas", "smk", "parismusees"],
    science: [
      "nasa",
      "apod",
      "hubble",
      "noaa",
      "usgs",
      "gbif",
      "eol",
      "inaturalist",
      "smg",
      "naturalis",
      "nasm",
      "nationalzoo",
      "gbiflit"
    ],
    botanical: ["bhl", "gbiflit", "cornell", "naturalis", "eol", "gbif"],
    archives: [
      "archive",
      "loc",
      "gallica",
      "chronicling",
      "openverse",
      "bhl",
      "trove",
      "digitalnz",
      "nypl",
      "folger",
      "onb",
      "soch",
      "finna",
      "wdl",
      "photogrammar",
      "wikidata",
      "bodleian",
      "cudl",
      "bsb",
      "ddb"
    ]
  };
  var SOURCE_META = {
    wikimedia: { category: ["photos", "archives", "art"], region: "global", access: "no_key" },
    met: { category: ["museums", "art"], region: "americas", access: "no_key" },
    archive: { category: ["archives", "photos", "historical"], region: "global", access: "no_key" },
    nasa: { category: ["science", "photos"], region: "global", access: "no_key" },
    inaturalist: { category: ["nature", "science"], region: "global", access: "no_key" },
    loc: { category: ["archives", "historical", "maps"], region: "americas", access: "no_key" },
    openlibrary: { category: ["archives"], region: "global", access: "no_key" },
    chicago: { category: ["museums", "art"], region: "americas", access: "no_key" },
    cleveland: { category: ["museums", "art"], region: "americas", access: "no_key" },
    va: { category: ["museums", "art", "fashion"], region: "uk", access: "no_key" },
    wikiart: { category: ["art"], region: "global", access: "no_key" },
    nordic: { category: ["museums", "art", "fashion"], region: "europe", access: "no_key" },
    flickr: { category: ["photos"], region: "global", access: "no_key" },
    europeana: { category: ["museums", "art", "archives"], region: "europe", access: "free_key" },
    rijksmuseum: { category: ["museums", "art"], region: "europe", access: "no_key" },
    harvard: { category: ["museums", "art"], region: "americas", access: "free_key" },
    smithsonian: { category: ["museums", "science", "art"], region: "americas", access: "no_key" },
    pexels: { category: ["photos"], region: "global", access: "free_key" },
    pixabay: { category: ["photos", "art"], region: "global", access: "free_key" },
    getty: { category: ["museums", "art"], region: "americas", access: "no_key" },
    nga: { category: ["museums", "art"], region: "americas", access: "no_key" },
    gbif: { category: ["nature", "science"], region: "global", access: "no_key" },
    eol: { category: ["nature", "science"], region: "global", access: "no_key" },
    apod: { category: ["science", "photos"], region: "global", access: "no_key" },
    gallica: { category: ["archives", "art", "historical"], region: "europe", access: "no_key" },
    chronicling: { category: ["archives", "historical"], region: "americas", access: "no_key" },
    openverse: { category: ["photos", "art"], region: "global", access: "no_key" },
    trove: { category: ["archives", "historical", "photos"], region: "oceania", access: "free_key" },
    digitalnz: { category: ["archives", "historical"], region: "oceania", access: "free_key" },
    bhl: { category: ["botanical", "nature", "archives"], region: "global", access: "no_key" },
    carnegie: { category: ["museums", "art"], region: "americas", access: "no_key" },
    prado: { category: ["museums", "art"], region: "europe", access: "no_key", corsBlocked: true },
    parismusees: { category: ["museums", "art", "fashion"], region: "europe", access: "no_key", corsBlocked: true },
    yale: { category: ["museums", "art"], region: "americas", access: "no_key" },
    picsum: { category: ["photos"], region: "global", access: "no_key" },
    usgs: { category: ["science", "photos", "maps"], region: "americas", access: "no_key" },
    cooperhewitt: { category: ["museums", "art", "fashion", "design", "architecture"], region: "americas", access: "no_key" },
    tate: { category: ["museums", "art"], region: "uk", access: "no_key" },
    finna: { category: ["archives", "museums", "historical"], region: "europe", access: "no_key" },
    soch: { category: ["archives", "historical"], region: "europe", access: "no_key", corsBlocked: true },
    joconde: { category: ["museums", "art"], region: "europe", access: "no_key" },
    mnw: { category: ["museums", "art"], region: "europe", access: "no_key" },
    tepapa: { category: ["museums", "art"], region: "oceania", access: "no_key" },
    dpla: { category: ["archives", "art", "historical"], region: "americas", access: "free_key" },
    ddb: { category: ["archives", "art", "historical", "museums"], region: "europe", access: "free_key" },
    artsy: { category: ["art"], region: "global", access: "paid_key" },
    pas: { category: ["archives", "historical"], region: "uk", access: "no_key" },
    smg: { category: ["museums", "science"], region: "uk", access: "no_key" },
    auckland: { category: ["museums", "art"], region: "oceania", access: "no_key" },
    photogrammar: { category: ["archives", "photos", "historical"], region: "americas", access: "no_key" },
    wellcome: { category: ["archives", "science", "art"], region: "uk", access: "no_key" },
    maas: { category: ["museums", "science", "art", "fashion"], region: "oceania", access: "no_key" },
    smk: { category: ["museums", "art", "fashion"], region: "europe", access: "no_key" },
    thyssen: { category: ["museums", "art"], region: "europe", access: "no_key", corsBlocked: true },
    wdl: { category: ["archives", "maps", "historical"], region: "global", access: "no_key" },
    walters: { category: ["museums", "art"], region: "americas", access: "no_key" },
    princeton: { category: ["museums", "art"], region: "americas", access: "no_key" },
    wikidata: { category: ["archives", "art", "photos"], region: "global", access: "no_key" },
    noaa: { category: ["science", "photos", "nature"], region: "americas", access: "no_key" },
    hubble: { category: ["science", "photos"], region: "global", access: "no_key" },
    cornell: { category: ["archives", "botanical", "nature"], region: "americas", access: "no_key" },
    folger: { category: ["archives", "historical"], region: "americas", access: "no_key" },
    onb: { category: ["archives", "historical"], region: "europe", access: "no_key" },
    nypl: { category: ["archives", "photos", "maps"], region: "americas", access: "no_key" },
    mak: { category: ["museums", "art", "fashion"], region: "europe", access: "no_key" },
    mna: { category: ["museums", "art"], region: "americas", access: "no_key" },
    louvre: { category: ["museums", "art"], region: "europe", access: "no_key" },
    mia: { category: ["museums", "art"], region: "americas", access: "no_key" },
    lacma: { category: ["museums", "art"], region: "americas", access: "no_key" },
    munch: { category: ["museums", "art"], region: "europe", access: "no_key" },
    mauritshuis: { category: ["museums", "art"], region: "europe", access: "no_key" },
    nationalmuseumse: { category: ["museums", "art"], region: "europe", access: "no_key" },
    naturalis: { category: ["nature", "science"], region: "europe", access: "no_key" },
    nmaahc: { category: ["museums", "art", "historical"], region: "americas", access: "no_key" },
    nasm: { category: ["museums", "science"], region: "americas", access: "no_key" },
    whitney: { category: ["museums", "art"], region: "americas", access: "no_key" },
    nationalzoo: { category: ["nature", "science"], region: "americas", access: "no_key" },
    gbiflit: { category: ["botanical", "nature", "archives"], region: "global", access: "no_key" },
    freersackler: { category: ["museums", "art"], region: "americas", access: "no_key" },
    ago: { category: ["museums", "art"], region: "americas", access: "no_key" },
    pem: { category: ["museums", "art"], region: "americas", access: "no_key" },
    npg: { category: ["museums", "art"], region: "uk", access: "no_key" },
    louvread: { category: ["museums", "art"], region: "europe", access: "no_key" },
    // Phase 2 sources
    unsplash: { category: ["photos"], region: "global", access: "free_key" },
    bodleian: { category: ["archives", "art", "maps"], region: "uk", access: "no_key", corsBlocked: true },
    bsb: { category: ["archives", "maps", "historical"], region: "europe", access: "no_key", corsBlocked: true },
    cudl: { category: ["archives", "historical", "maps"], region: "uk", access: "no_key", corsBlocked: true },
    // Phase A — Europeana sub-collections (20)
    euro_rijksmuseum: { category: ["museums", "art"], region: "europe", access: "free_key" },
    euro_fashion: { category: ["museums", "art", "fashion"], region: "europe", access: "free_key" },
    euro_ddb: { category: ["archives", "historical"], region: "europe", access: "free_key" },
    euro_bnf: { category: ["archives", "historical"], region: "europe", access: "free_key" },
    euro_bne: { category: ["archives", "historical"], region: "europe", access: "free_key" },
    euro_kb: { category: ["archives", "historical"], region: "europe", access: "free_key" },
    euro_bn_pl: { category: ["archives", "historical"], region: "europe", access: "free_key" },
    euro_nkr: { category: ["archives", "historical"], region: "europe", access: "free_key" },
    euro_photography: { category: ["photos", "archives"], region: "europe", access: "free_key" },
    euro_sounds: { category: ["archives"], region: "europe", access: "free_key" },
    euro_newspapers: { category: ["archives", "historical"], region: "europe", access: "free_key" },
    euro_kulturpool: { category: ["museums", "archives"], region: "europe", access: "free_key" },
    euro_hispana: { category: ["archives", "historical"], region: "europe", access: "free_key" },
    euro_nuk: { category: ["archives", "historical"], region: "europe", access: "free_key" },
    euro_estonian: { category: ["museums", "historical"], region: "europe", access: "free_key" },
    euro_lithuanian: { category: ["archives", "historical"], region: "europe", access: "free_key" },
    euro_latvian: { category: ["archives", "historical"], region: "europe", access: "free_key" },
    euro_hungarian: { category: ["archives", "historical"], region: "europe", access: "free_key" },
    euro_romanian: { category: ["archives", "historical"], region: "europe", access: "free_key" },
    euro_bulgarian: { category: ["archives", "historical"], region: "europe", access: "free_key" },
    // Phase A — DPLA hub sub-collections (15)
    dpla_california: { category: ["archives", "photos", "historical"], region: "americas", access: "free_key" },
    dpla_commonwealth: { category: ["archives", "historical"], region: "americas", access: "free_key" },
    dpla_empire: { category: ["archives", "historical"], region: "americas", access: "free_key" },
    dpla_mountain_west: { category: ["archives", "historical"], region: "americas", access: "free_key" },
    dpla_minnesota: { category: ["archives", "historical"], region: "americas", access: "free_key" },
    dpla_michigan: { category: ["archives", "historical"], region: "americas", access: "free_key" },
    dpla_illinois: { category: ["archives", "historical"], region: "americas", access: "free_key" },
    dpla_kentucky: { category: ["archives", "historical"], region: "americas", access: "free_key" },
    dpla_south_carolina: { category: ["archives", "historical"], region: "americas", access: "free_key" },
    dpla_georgia: { category: ["archives", "historical"], region: "americas", access: "free_key" },
    dpla_texas: { category: ["archives", "historical"], region: "americas", access: "free_key" },
    dpla_pacific_nw: { category: ["archives", "historical"], region: "americas", access: "free_key" },
    dpla_ohio: { category: ["archives", "historical"], region: "americas", access: "free_key" },
    dpla_pennsylvania: { category: ["archives", "historical"], region: "americas", access: "free_key" },
    dpla_new_england: { category: ["archives", "historical"], region: "americas", access: "free_key" },
    // Phase A — Smithsonian sub-museums (15)
    si_nmah: { category: ["museums", "historical"], region: "americas", access: "no_key" },
    si_nmnh: { category: ["museums", "science", "nature"], region: "americas", access: "no_key" },
    si_npg_dc: { category: ["museums", "art", "historical"], region: "americas", access: "no_key" },
    si_saam: { category: ["museums", "art"], region: "americas", access: "no_key" },
    si_hmsg: { category: ["museums", "art"], region: "americas", access: "no_key" },
    si_nzp: { category: ["nature", "science"], region: "americas", access: "no_key" },
    si_chndm: { category: ["museums", "design", "art", "fashion"], region: "americas", access: "no_key" },
    si_fsg: { category: ["museums", "art"], region: "americas", access: "no_key" },
    si_nmafa: { category: ["museums", "art"], region: "americas", access: "no_key" },
    si_nmai: { category: ["museums", "art", "historical"], region: "americas", access: "no_key" },
    si_nmaahc2: { category: ["museums", "art", "historical"], region: "americas", access: "no_key" },
    si_nasm2: { category: ["museums", "science"], region: "americas", access: "no_key" },
    si_npm: { category: ["museums", "historical"], region: "americas", access: "no_key" },
    si_acm: { category: ["museums", "historical"], region: "americas", access: "no_key" },
    si_renwick: { category: ["museums", "art", "design"], region: "americas", access: "no_key" },
    // Phase A — Wikimedia category filters (10)
    wmc_fashion: { category: ["art", "fashion"], region: "global", access: "no_key" },
    wmc_architecture: { category: ["art"], region: "global", access: "no_key" },
    wmc_paintings: { category: ["art", "museums"], region: "global", access: "no_key" },
    wmc_sculptures: { category: ["art", "museums"], region: "global", access: "no_key" },
    wmc_maps: { category: ["maps", "historical"], region: "global", access: "no_key" },
    wmc_natural_history: { category: ["nature", "science"], region: "global", access: "no_key" },
    wmc_portraits: { category: ["art", "photos"], region: "global", access: "no_key" },
    wmc_botanical: { category: ["botanical", "nature"], region: "global", access: "no_key" },
    wmc_scientific: { category: ["science"], region: "global", access: "no_key" },
    wmc_street: { category: ["photos"], region: "global", access: "no_key" },
    // Phase B — zero-auth free APIs
    idigbio: { category: ["nature", "science"], region: "global", access: "no_key" },
    ala: { category: ["nature", "science"], region: "oceania", access: "no_key" },
    // Phase D — niche & specialized
    nasa_images: { category: ["science", "space", "photos"], region: "global", access: "no_key" },
    loc: { category: ["historical", "archives", "photos"], region: "usa", access: "no_key" },
    // Phase E — CORS-blocked, cache-first
    nhm_london: { category: ["nature", "science"], region: "uk", access: "no_key" },
    wallace_collection: { category: ["museums", "art"], region: "uk", access: "no_key", corsBlocked: true },
    fitzwilliam: { category: ["museums", "art"], region: "uk", access: "no_key", corsBlocked: true },
    national_gallery_london: { category: ["museums", "art"], region: "uk", access: "no_key", corsBlocked: true },
    scottish_national: { category: ["museums", "art"], region: "uk", access: "no_key", corsBlocked: true },
    musee_orsay: { category: ["museums", "art"], region: "europe", access: "no_key", corsBlocked: true },
    vangogh_museum: { category: ["museums", "art"], region: "europe", access: "no_key", corsBlocked: true },
    khm: { category: ["museums", "art"], region: "europe", access: "no_key", corsBlocked: true },
    belvedere: { category: ["museums", "art"], region: "europe", access: "no_key", corsBlocked: true },
    staedel: { category: ["museums", "art"], region: "europe", access: "no_key", corsBlocked: true },
    rmfab: { category: ["museums", "art"], region: "europe", access: "no_key", corsBlocked: true },
    guimet: { category: ["museums", "art"], region: "europe", access: "no_key", corsBlocked: true },
    npm_taipei: { category: ["museums", "art"], region: "asia", access: "no_key", corsBlocked: true },
    galliera: { category: ["museums", "fashion"], region: "europe", access: "no_key", corsBlocked: true },
    arts_decoratifs: { category: ["museums", "fashion", "art"], region: "europe", access: "no_key", corsBlocked: true },
    centraal_museum: { category: ["museums", "fashion", "art"], region: "europe", access: "no_key", corsBlocked: true },
    textile_museum_tilburg: { category: ["museums", "fashion"], region: "europe", access: "no_key", corsBlocked: true },
    wereldculturen: { category: ["museums", "fashion"], region: "europe", access: "no_key", corsBlocked: true },
    dec_arts_prague: { category: ["museums", "fashion", "art"], region: "europe", access: "no_key", corsBlocked: true },
    designmuseum_dk: { category: ["museums", "fashion"], region: "europe", access: "no_key", corsBlocked: true },
    boijmans: { category: ["museums", "fashion", "art"], region: "europe", access: "no_key", corsBlocked: true },
    museu_traje: { category: ["museums", "fashion"], region: "europe", access: "no_key", corsBlocked: true },
    // Phase G — Art, Sculpture & History
    kmska: { category: ["museums", "art"], region: "europe", access: "no_key", corsBlocked: true },
    amsterdam_museum: { category: ["museums", "art", "history"], region: "europe", access: "no_key", corsBlocked: true },
    ngi: { category: ["museums", "art"], region: "europe", access: "no_key", corsBlocked: true },
    fries_museum: { category: ["museums", "art", "history"], region: "europe", access: "no_key", corsBlocked: true },
    groeninge: { category: ["museums", "art"], region: "europe", access: "no_key", corsBlocked: true },
    groninger: { category: ["museums", "art"], region: "europe", access: "no_key", corsBlocked: true },
    moma_wd: { category: ["museums", "art"], region: "north_america", access: "no_key", corsBlocked: true },
    rijksmuseum_twenthe: { category: ["museums", "art"], region: "europe", access: "no_key", corsBlocked: true },
    herzog_anton_ulrich: { category: ["museums", "art"], region: "europe", access: "no_key", corsBlocked: true },
    galleria_palatina: { category: ["museums", "art"], region: "europe", access: "no_key", corsBlocked: true },
    lakenhal: { category: ["museums", "art"], region: "europe", access: "no_key", corsBlocked: true },
    teylers: { category: ["museums", "art", "science"], region: "europe", access: "no_key", corsBlocked: true },
    alte_pinakothek: { category: ["museums", "art"], region: "europe", access: "no_key", corsBlocked: true },
    quai_branly: { category: ["museums", "art", "history"], region: "europe", access: "no_key", corsBlocked: true }
  };
  WD_PHASE_H.forEach((s) => {
    SOURCE_META[s.id] = { category: s.cat, region: s.region, access: "no_key", corsBlocked: true };
  });
  var EUROPEANA_PROVIDERS = {
    euro_rijksmuseum: { filterParam: "DATA_PROVIDER", filterValue: "Rijksmuseum", name: "Rijksmuseum (Europeana)" },
    euro_fashion: { filterParam: "PROVIDER", filterValue: "Europeana Fashion", name: "Europeana Fashion" },
    euro_ddb: { filterParam: "DATA_PROVIDER", filterValue: "Deutsche Digitale Bibliothek", name: "Deutsche Digitale Bibliothek" },
    euro_bnf: { filterParam: "DATA_PROVIDER", filterValue: "Biblioth\xE8que nationale de France", name: "BnF via Europeana" },
    euro_bne: { filterParam: "DATA_PROVIDER", filterValue: "Biblioteca Nacional de Espa\xF1a", name: "National Library of Spain" },
    euro_kb: { filterParam: "DATA_PROVIDER", filterValue: "Koninklijke Bibliotheek", name: "National Library of Netherlands" },
    euro_bn_pl: { filterParam: "DATA_PROVIDER", filterValue: "Biblioteka Narodowa", name: "National Library of Poland" },
    euro_nkr: { filterParam: "DATA_PROVIDER", filterValue: "N\xE1rodn\xED knihovna \u010CR", name: "National Library of Czech Republic" },
    euro_photography: { filterParam: "PROVIDER", filterValue: "Europeana Photography", name: "Europeana Photography" },
    euro_sounds: { filterParam: "PROVIDER", filterValue: "Europeana Sounds", extra: "TYPE:IMAGE", name: "Europeana Sounds (Images)" },
    euro_newspapers: { filterParam: "PROVIDER", filterValue: "Europeana Newspapers", name: "Europeana Newspapers" },
    euro_kulturpool: { filterParam: "DATA_PROVIDER", filterValue: "Kulturpool", name: "Kulturpool Austria" },
    euro_hispana: { filterParam: "DATA_PROVIDER", filterValue: "Hispana", name: "Hispana Spain" },
    euro_nuk: { filterParam: "DATA_PROVIDER", filterValue: "Digital Library of Slovenia", name: "Digital Library of Slovenia" },
    euro_estonian: { filterParam: "DATA_PROVIDER", filterValue: "Estonian National Museum", name: "Estonian National Museum" },
    euro_lithuanian: { filterParam: "DATA_PROVIDER", filterValue: "Lithuanian Central State Archives", name: "Lithuanian Archives" },
    euro_latvian: { filterParam: "DATA_PROVIDER", filterValue: "National Library of Latvia", name: "Latvian National Library" },
    euro_hungarian: { filterParam: "DATA_PROVIDER", filterValue: "Orsz\xE1gos Sz\xE9ch\xE9nyi K\xF6nyvt\xE1r", name: "Hungarian National Library" },
    euro_romanian: { filterParam: "DATA_PROVIDER", filterValue: "Romanian National Library", name: "Romanian National Library" },
    euro_bulgarian: { filterParam: "DATA_PROVIDER", filterValue: "Bulgarian National Library", name: "Bulgarian National Library" }
  };
  var DPLA_HUBS = {
    dpla_california: { provider: "California Digital Library", name: "California Digital Library" },
    dpla_commonwealth: { provider: "Digital Commonwealth", name: "Digital Commonwealth (DPLA)" },
    dpla_empire: { provider: "Empire State Digital Network", name: "Empire State Network (NY)" },
    dpla_mountain_west: { provider: "Mountain West Digital Library", name: "Mountain West Digital Library" },
    dpla_minnesota: { provider: "Minnesota Digital Library", name: "Minnesota Digital Library" },
    dpla_michigan: { provider: "Michigan Digital Library", name: "Michigan Digital Library" },
    dpla_illinois: { provider: "Illinois Digital Heritage Hub", name: "Illinois Digital Heritage" },
    dpla_kentucky: { provider: "Kentucky Digital Library", name: "Kentucky Digital Library" },
    dpla_south_carolina: { provider: "South Carolina Digital Library", name: "South Carolina Digital Library" },
    dpla_georgia: { provider: "Georgia HomePLACE", name: "Georgia HomePLACE" },
    dpla_texas: { provider: "Texas Digital Library", name: "Texas Digital Library" },
    dpla_pacific_nw: { provider: "Pacific Northwest Digital Collections", name: "Pacific Northwest Collections" },
    dpla_ohio: { provider: "Ohio Network of American History Research Centers", name: "Ohio Digital Network" },
    dpla_pennsylvania: { provider: "PA Digital", name: "Pennsylvania Digital Collections" },
    dpla_new_england: { provider: "New England Digital Collections", name: "New England Digital Collections" }
  };
  var SI_UNITS = {
    si_nmah: { code: "NMAH", name: "Nat\u2019l Museum of American History" },
    si_nmnh: { code: "NMNH", name: "Nat\u2019l Museum of Natural History" },
    si_npg_dc: { code: "NPG", name: "National Portrait Gallery (SI)" },
    si_saam: { code: "SAAM", name: "American Art Museum (SI)" },
    si_hmsg: { code: "HMSG", name: "Hirshhorn Museum" },
    si_nzp: { code: "NZP", name: "Smithsonian National Zoo" },
    si_chndm: { code: "CHNDM", name: "Cooper Hewitt Design (SI)" },
    si_fsg: { code: "FSG", name: "Freer|Sackler Asian Art" },
    si_nmafa: { code: "NMAFA", name: "African Art Museum (SI)" },
    si_nmai: { code: "NMAI", name: "American Indian Museum (SI)" },
    si_nmaahc2: { code: "NMAAHC", name: "African American History (SI)" },
    si_nasm2: { code: "NASM", name: "Air and Space Museum (SI)" },
    si_npm: { code: "NPM", name: "Postal Museum (SI)" },
    si_acm: { code: "ACM", name: "Anacostia Community Museum (SI)" },
    si_renwick: { code: "SAAM", name: "Renwick Gallery (SI)" }
  };
  var WIKIMEDIA_CATS = {
    wmc_fashion: { cat: "Fashion", name: "Wikimedia Fashion" },
    wmc_architecture: { cat: "Architecture", name: "Wikimedia Architecture" },
    wmc_paintings: { cat: "Paintings", name: "Wikimedia Paintings" },
    wmc_sculptures: { cat: "Sculptures", name: "Wikimedia Sculptures" },
    wmc_maps: { cat: "Historical_maps", name: "Wikimedia Historical Maps" },
    wmc_natural_history: { cat: "Natural_history", name: "Wikimedia Natural History" },
    wmc_portraits: { cat: "Portraits", name: "Wikimedia Portraits" },
    wmc_botanical: { cat: "Botanical_illustrations", name: "Wikimedia Botanical Illustrations" },
    wmc_scientific: { cat: "Scientific_diagrams", name: "Wikimedia Scientific Diagrams" },
    wmc_street: { cat: "Street_photography", name: "Wikimedia Street Photography" }
  };
  var DYNAMIC_REGISTRY = [];
  var ADAPTERS = {};
  var ART_QUERY_TERMS = [
    "painting",
    "sculpture",
    "portrait",
    "landscape",
    "still life",
    "mural",
    "fresco",
    "drawing",
    "sketch",
    "etching",
    "engraving",
    "lithograph",
    "woodcut",
    "watercolor",
    "oil paint",
    "acrylic",
    "canvas",
    "gallery",
    "museum",
    "exhibition",
    "masterpiece",
    "renaissance",
    "baroque",
    "impressionism",
    "cubism",
    "surrealism",
    "abstract",
    "art nouveau",
    "art deco",
    "pop art",
    "minimalism",
    "expressionism",
    "fauvism",
    "romanticism",
    "neoclassicism",
    "gothic",
    "mannerism",
    "futurism",
    "constructivism",
    "dada",
    "pointillism",
    "symbolism",
    "realism",
    "modernism",
    "contemporary art"
  ];
  var HISTORY_QUERY_TERMS = [
    "ancient",
    "medieval",
    "victorian",
    "colonial",
    "empire",
    "dynasty",
    "civilization",
    "ruins",
    "artifact",
    "relic",
    "manuscript",
    "archive",
    "document",
    "chronicle",
    "antiquity",
    "heritage",
    "historic",
    "war",
    "battle",
    "revolution",
    "propaganda",
    "vintage",
    "retro",
    "century",
    "era",
    "period",
    "archaeological",
    "excavation"
  ];
  var ARCH_QUERY_TERMS = [
    "architecture",
    "building",
    "facade",
    "structure",
    "tower",
    "dome",
    "arch",
    "column",
    "cathedral",
    "church",
    "mosque",
    "temple",
    "castle",
    "palace",
    "bridge",
    "skyscraper",
    "ruins",
    "monument",
    "fountain",
    "lighthouse",
    "windmill",
    "stadium",
    "interior",
    "brutalist",
    "modernist",
    "gothic",
    "romanesque",
    "byzantine",
    "art deco"
  ];
  var DESIGN_QUERY_TERMS = [
    "design",
    "typography",
    "graphic",
    "pattern",
    "textile",
    "fabric",
    "weaving",
    "lace",
    "embroidery",
    "ceramic",
    "pottery",
    "porcelain",
    "glass",
    "stained glass",
    "mosaic",
    "tapestry",
    "furniture",
    "jewelry",
    "metalwork",
    "woodwork",
    "lacquer",
    "enamel",
    "industrial design",
    "packaging",
    "poster",
    "wallpaper",
    "ornament",
    "decoration"
  ];
  var PHOTO_QUERY_TERMS = [
    "photograph",
    "photo",
    "camera",
    "film",
    "exposure",
    "darkroom",
    "street photography",
    "documentary",
    "portrait",
    "landscape",
    "macro",
    "aerial",
    "panorama",
    "bokeh",
    "black and white",
    "monochrome",
    "color photography",
    "daguerreotype",
    "snapshot"
  ];
  var SCIENCE_QUERY_TERMS = [
    "science",
    "microscope",
    "telescope",
    "astronomy",
    "biology",
    "chemistry",
    "physics",
    "anatomy",
    "botany",
    "zoology",
    "geology",
    "mineral",
    "crystal",
    "fossil",
    "specimen",
    "laboratory",
    "experiment",
    "diagram",
    "illustration",
    "medical",
    "pharmaceutical",
    "x-ray",
    "cell",
    "dna",
    "molecule",
    "atom",
    "satellite",
    "observatory"
  ];
  function classifyQueryExtended(q) {
    const lower = (q || "").toLowerCase();
    const check = (terms) => terms.some((t) => lower.includes(t));
    return {
      isNature: check(NATURE_QUERY_TERMS),
      isSpace: check(SPACE_QUERY_TERMS),
      isArt: check(ART_QUERY_TERMS),
      isHistory: check(HISTORY_QUERY_TERMS),
      isArch: check(ARCH_QUERY_TERMS),
      isDesign: check(DESIGN_QUERY_TERMS),
      isPhoto: check(PHOTO_QUERY_TERMS),
      isScience: check(SCIENCE_QUERY_TERMS)
    };
  }
  var WIKIMEDIA_CATS_EXTENDED = [
    // Art movements
    { cat: "Art_Nouveau", name: "Art Nouveau", tags: ["art", "design"] },
    { cat: "Art_Deco", name: "Art Deco", tags: ["art", "design"] },
    { cat: "Baroque_art", name: "Baroque Art", tags: ["art"] },
    { cat: "Renaissance_art", name: "Renaissance Art", tags: ["art"] },
    { cat: "Impressionist_paintings", name: "Impressionist Paintings", tags: ["art"] },
    { cat: "Cubism", name: "Cubism", tags: ["art"] },
    { cat: "Surrealism", name: "Surrealism", tags: ["art"] },
    { cat: "Abstract_art", name: "Abstract Art", tags: ["art"] },
    { cat: "Pop_art", name: "Pop Art", tags: ["art"] },
    { cat: "Minimalist_art", name: "Minimalist Art", tags: ["art", "design"] },
    { cat: "Gothic_art", name: "Gothic Art", tags: ["art", "history"] },
    { cat: "Romanticism", name: "Romanticism", tags: ["art"] },
    { cat: "Expressionism", name: "Expressionism", tags: ["art"] },
    { cat: "Neoclassicism", name: "Neoclassicism", tags: ["art", "arch"] },
    { cat: "Futurism", name: "Futurism", tags: ["art"] },
    { cat: "Constructivism", name: "Constructivism", tags: ["art", "design"] },
    { cat: "Dadaism", name: "Dadaism", tags: ["art"] },
    { cat: "Pointillism", name: "Pointillism", tags: ["art"] },
    { cat: "Symbolism_(arts)", name: "Symbolism", tags: ["art"] },
    { cat: "Fauvism", name: "Fauvism", tags: ["art"] },
    { cat: "Mannerism", name: "Mannerism", tags: ["art"] },
    { cat: "Realism_(art_movement)", name: "Realism", tags: ["art"] },
    { cat: "Pre-Raphaelite_paintings", name: "Pre-Raphaelite", tags: ["art"] },
    { cat: "Ukiyo-e", name: "Ukiyo-e", tags: ["art", "history"] },
    // Media & techniques
    { cat: "Photographs", name: "Photographs", tags: ["photo"] },
    { cat: "Drawings", name: "Drawings", tags: ["art"] },
    { cat: "Engravings", name: "Engravings", tags: ["art", "history"] },
    { cat: "Etchings", name: "Etchings", tags: ["art"] },
    { cat: "Lithographs", name: "Lithographs", tags: ["art"] },
    { cat: "Watercolor_paintings", name: "Watercolors", tags: ["art"] },
    { cat: "Woodcuts", name: "Woodcuts", tags: ["art", "history"] },
    { cat: "Prints", name: "Prints", tags: ["art"] },
    { cat: "Posters", name: "Posters", tags: ["design", "history"] },
    { cat: "Illuminated_manuscripts", name: "Illuminated Manuscripts", tags: ["art", "history"] },
    { cat: "Book_illustrations", name: "Book Illustrations", tags: ["art", "design"] },
    { cat: "Collage", name: "Collage", tags: ["art"] },
    { cat: "Silkscreen_prints", name: "Silkscreen Prints", tags: ["art", "design"] },
    { cat: "Pastel_paintings", name: "Pastels", tags: ["art"] },
    { cat: "Frescoes", name: "Frescoes", tags: ["art", "arch"] },
    { cat: "Icons_(art)", name: "Icons", tags: ["art", "history"] },
    // Subjects
    { cat: "Landscapes_in_art", name: "Landscapes in Art", tags: ["art", "nature"] },
    { cat: "Seascapes", name: "Seascapes", tags: ["art", "nature"] },
    { cat: "Still_life_paintings", name: "Still Life", tags: ["art"] },
    { cat: "Religious_art", name: "Religious Art", tags: ["art", "history"] },
    { cat: "Mythology_in_art", name: "Mythology in Art", tags: ["art", "history"] },
    { cat: "Allegory_in_art", name: "Allegory in Art", tags: ["art"] },
    { cat: "Genre_paintings", name: "Genre Paintings", tags: ["art"] },
    { cat: "War_art", name: "War Art", tags: ["art", "history"] },
    { cat: "Animals_in_art", name: "Animals in Art", tags: ["art", "nature"] },
    { cat: "Flowers_in_art", name: "Flowers in Art", tags: ["art", "nature", "design"] },
    { cat: "Self-portraits", name: "Self-Portraits", tags: ["art"] },
    { cat: "Nudes_in_art", name: "Nudes in Art", tags: ["art"] },
    { cat: "Interior_scenes_in_art", name: "Interior Scenes", tags: ["art", "design"] },
    { cat: "Dance_in_art", name: "Dance in Art", tags: ["art"] },
    { cat: "Music_in_art", name: "Music in Art", tags: ["art"] },
    { cat: "Food_and_drink_in_art", name: "Food in Art", tags: ["art"] },
    // Architecture
    { cat: "Castles", name: "Castles", tags: ["arch", "history"] },
    { cat: "Churches", name: "Churches", tags: ["arch", "history"] },
    { cat: "Mosques", name: "Mosques", tags: ["arch", "history"] },
    { cat: "Temples", name: "Temples", tags: ["arch", "history"] },
    { cat: "Bridges", name: "Bridges", tags: ["arch"] },
    { cat: "Skyscrapers", name: "Skyscrapers", tags: ["arch"] },
    { cat: "Ruins", name: "Ruins", tags: ["arch", "history"] },
    { cat: "Gardens", name: "Gardens", tags: ["arch", "nature", "design"] },
    { cat: "Fountains", name: "Fountains", tags: ["arch", "design"] },
    { cat: "Lighthouses", name: "Lighthouses", tags: ["arch", "photo"] },
    { cat: "Windmills", name: "Windmills", tags: ["arch", "history"] },
    { cat: "Palaces", name: "Palaces", tags: ["arch", "history"] },
    { cat: "Domes", name: "Domes", tags: ["arch"] },
    { cat: "Towers", name: "Towers", tags: ["arch"] },
    { cat: "Staircases", name: "Staircases", tags: ["arch", "design"] },
    { cat: "Brutalist_architecture", name: "Brutalist Architecture", tags: ["arch", "design"] },
    { cat: "Art_Nouveau_architecture", name: "Art Nouveau Architecture", tags: ["arch", "design"] },
    { cat: "Gothic_architecture", name: "Gothic Architecture", tags: ["arch", "history"] },
    { cat: "Romanesque_architecture", name: "Romanesque Architecture", tags: ["arch", "history"] },
    { cat: "Byzantine_architecture", name: "Byzantine Architecture", tags: ["arch", "history"] },
    { cat: "Modernist_architecture", name: "Modernist Architecture", tags: ["arch", "design"] },
    // Nature & science
    { cat: "Birds", name: "Birds", tags: ["nature", "science"] },
    { cat: "Insects", name: "Insects", tags: ["nature", "science"] },
    { cat: "Mammals", name: "Mammals", tags: ["nature", "science"] },
    { cat: "Reptiles", name: "Reptiles", tags: ["nature", "science"] },
    { cat: "Fish", name: "Fish", tags: ["nature", "science"] },
    { cat: "Trees", name: "Trees", tags: ["nature"] },
    { cat: "Fungi", name: "Fungi", tags: ["nature", "science"] },
    { cat: "Fossils", name: "Fossils", tags: ["nature", "science", "history"] },
    { cat: "Minerals", name: "Minerals", tags: ["nature", "science"] },
    { cat: "Crystals", name: "Crystals", tags: ["nature", "science"] },
    { cat: "Shells", name: "Shells", tags: ["nature", "science"] },
    { cat: "Corals", name: "Corals", tags: ["nature", "science"] },
    { cat: "Butterflies", name: "Butterflies", tags: ["nature", "science"] },
    { cat: "Spiders", name: "Spiders", tags: ["nature", "science"] },
    { cat: "Amphibians", name: "Amphibians", tags: ["nature", "science"] },
    { cat: "Wildflowers", name: "Wildflowers", tags: ["nature"] },
    { cat: "Ferns", name: "Ferns", tags: ["nature"] },
    { cat: "Mosses", name: "Mosses", tags: ["nature"] },
    { cat: "Lichens", name: "Lichens", tags: ["nature", "science"] },
    { cat: "Seaweeds", name: "Seaweeds", tags: ["nature", "science"] },
    { cat: "Microscopy_images", name: "Microscopy", tags: ["science"] },
    { cat: "Astronomy", name: "Astronomy", tags: ["science", "space"] },
    { cat: "Anatomy", name: "Anatomy", tags: ["science"] },
    { cat: "Cartography", name: "Cartography", tags: ["science", "history"] },
    { cat: "Chemistry", name: "Chemistry", tags: ["science"] },
    // History & culture
    { cat: "Ancient_Egypt", name: "Ancient Egypt", tags: ["history", "art"] },
    { cat: "Ancient_Greece", name: "Ancient Greece", tags: ["history", "art"] },
    { cat: "Ancient_Rome", name: "Ancient Rome", tags: ["history", "art"] },
    { cat: "Medieval_art", name: "Medieval Art", tags: ["history", "art"] },
    { cat: "Victorian_era", name: "Victorian Era", tags: ["history"] },
    { cat: "Propaganda_posters", name: "Propaganda Posters", tags: ["history", "design"] },
    { cat: "Vintage_advertisements", name: "Vintage Advertisements", tags: ["history", "design"] },
    { cat: "World_War_I_in_art", name: "World War I Art", tags: ["history", "art"] },
    { cat: "World_War_II_in_art", name: "World War II Art", tags: ["history", "art"] },
    { cat: "Film_stills", name: "Film Stills", tags: ["history", "photo"] },
    { cat: "Daguerreotypes", name: "Daguerreotypes", tags: ["history", "photo"] },
    { cat: "Stereoscopic_photographs", name: "Stereoscopic Photos", tags: ["history", "photo"] },
    { cat: "Postcards", name: "Postcards", tags: ["history", "photo"] },
    { cat: "Trade_cards", name: "Trade Cards", tags: ["history", "design"] },
    // Design & decorative arts
    { cat: "Textiles", name: "Textiles", tags: ["design"] },
    { cat: "Ceramics", name: "Ceramics", tags: ["design", "art"] },
    { cat: "Jewelry", name: "Jewelry", tags: ["design"] },
    { cat: "Masks", name: "Masks", tags: ["art", "history"] },
    { cat: "Musical_instruments", name: "Musical Instruments", tags: ["design", "history"] },
    { cat: "Costumes", name: "Costumes", tags: ["design", "history"] },
    { cat: "Armour", name: "Armour", tags: ["history", "design"] },
    { cat: "Coins", name: "Coins", tags: ["history"] },
    { cat: "Stamps", name: "Stamps", tags: ["history", "design"] },
    { cat: "Typography", name: "Typography", tags: ["design"] },
    { cat: "Graphic_design", name: "Graphic Design", tags: ["design"] },
    { cat: "Furniture", name: "Furniture", tags: ["design"] },
    { cat: "Glassware", name: "Glassware", tags: ["design", "art"] },
    { cat: "Metalwork", name: "Metalwork", tags: ["design"] },
    { cat: "Woodwork", name: "Woodwork", tags: ["design"] },
    { cat: "Lacquerware", name: "Lacquerware", tags: ["design", "art"] },
    { cat: "Enamelware", name: "Enamelware", tags: ["design", "art"] },
    { cat: "Stained_glass", name: "Stained Glass", tags: ["art", "arch", "design"] },
    { cat: "Mosaics", name: "Mosaics", tags: ["art", "arch", "design"] },
    { cat: "Tapestries", name: "Tapestries", tags: ["art", "design"] },
    { cat: "Calligraphy", name: "Calligraphy", tags: ["art", "design"] },
    { cat: "Bookplates", name: "Bookplates", tags: ["design", "art"] },
    { cat: "Street_art", name: "Street Art", tags: ["art", "photo"] },
    { cat: "Graffiti", name: "Graffiti", tags: ["art", "photo"] },
    { cat: "Murals", name: "Murals", tags: ["art", "arch"] },
    { cat: "Embroidery", name: "Embroidery", tags: ["design"] },
    { cat: "Quilts", name: "Quilts", tags: ["design"] },
    { cat: "Wallpaper", name: "Wallpaper", tags: ["design"] },
    { cat: "Clocks_and_watches", name: "Clocks & Watches", tags: ["design", "history"] },
    { cat: "Toys", name: "Toys", tags: ["design", "history"] },
    { cat: "Maps", name: "Maps", tags: ["history", "science"] },
    // Geography & regions
    { cat: "Africa_in_art", name: "Africa in Art", tags: ["art", "history"] },
    { cat: "Asia_in_art", name: "Asia in Art", tags: ["art", "history"] },
    { cat: "Japan_in_art", name: "Japan in Art", tags: ["art", "history"] },
    { cat: "China_in_art", name: "China in Art", tags: ["art", "history"] },
    { cat: "India_in_art", name: "India in Art", tags: ["art", "history"] },
    { cat: "Americas_in_art", name: "Americas in Art", tags: ["art", "history"] },
    { cat: "Oceania_in_art", name: "Oceania in Art", tags: ["art", "history"] }
  ];
  var ARCHIVE_COLLECTIONS = [
    { collection: "smithsonian_libraries", name: "Smithsonian Libraries", tags: ["science", "nature", "history"] },
    { collection: "biodiversitylibrary", name: "Biodiversity Heritage Library", tags: ["nature", "science"] },
    { collection: "americana", name: "Americana", tags: ["history"] },
    { collection: "prelinger", name: "Prelinger Archives", tags: ["history", "photo"] },
    { collection: "nasa", name: "NASA (Archive.org)", tags: ["science", "space"] },
    { collection: "maps_usgs", name: "USGS Maps (Archive.org)", tags: ["science", "history"] },
    { collection: "folklife", name: "Folklife", tags: ["history", "photo"] },
    { collection: "metropolitanmuseumofart-gallery", name: "Met Gallery (Archive.org)", tags: ["art"] },
    { collection: "nypl", name: "NYPL (Archive.org)", tags: ["history", "art"] },
    { collection: "library_of_congress", name: "LOC (Archive.org)", tags: ["history"] },
    { collection: "internetarchivebooks", name: "Internet Archive Books", tags: ["history"] },
    { collection: "toronto", name: "University of Toronto", tags: ["history"] },
    { collection: "getty_research", name: "Getty Research (Archive.org)", tags: ["art"] },
    { collection: "wellcomelibrary", name: "Wellcome Library (Archive.org)", tags: ["science", "history"] },
    { collection: "blc", name: "British Library (Archive.org)", tags: ["history"] },
    { collection: "europeanlibraries", name: "European Libraries", tags: ["history"] },
    { collection: "cdl", name: "California Digital Library", tags: ["history"] },
    { collection: "bostonpubliclibrary", name: "Boston Public Library", tags: ["history", "art"] },
    { collection: "iacl", name: "Archive.org Art & Culture", tags: ["art", "history"] },
    { collection: "animationandcartoons", name: "Animation & Cartoons", tags: ["art", "design"] },
    { collection: "coverartarchive", name: "Cover Art Archive", tags: ["art", "design"] },
    { collection: "flickrcommons", name: "Flickr Commons (Archive.org)", tags: ["photo", "history"] },
    { collection: "creativecommons", name: "Creative Commons Media", tags: ["photo", "art"] },
    { collection: "artsandmusicvideos", name: "Arts & Music Videos", tags: ["art"] },
    { collection: "national_library_of_scotland", name: "National Library of Scotland", tags: ["history"] },
    { collection: "national_library_of_australia", name: "National Library of Australia", tags: ["history"] },
    { collection: "solarsystemcollection", name: "Solar System Collection", tags: ["science", "space"] },
    { collection: "hubblesite", name: "HubbleSite (Archive.org)", tags: ["science", "space"] },
    { collection: "vintage_postcards", name: "Vintage Postcards", tags: ["history", "photo"] },
    { collection: "maps", name: "Maps Collection", tags: ["history", "science"] },
    { collection: "war_posters", name: "War Posters", tags: ["history", "design"] },
    { collection: "vintage_cartoons", name: "Vintage Cartoons", tags: ["art", "history"] },
    { collection: "medicineintheamericas", name: "Medicine in the Americas", tags: ["science", "history"] },
    { collection: "textile_patterns", name: "Textile Patterns", tags: ["design"] },
    { collection: "art_of_bookbinding", name: "Art of Bookbinding", tags: ["art", "design"] },
    { collection: "atsf_railroad", name: "Railroad Photography", tags: ["history", "photo"] },
    { collection: "rurallife", name: "Rural Life", tags: ["history", "photo", "nature"] },
    { collection: "comics_and_cartoons", name: "Comics & Cartoons", tags: ["art", "design"] },
    { collection: "nih_photographs", name: "NIH Photographs", tags: ["science", "photo"] },
    { collection: "architectureinhelsinki", name: "Architecture in Helsinki", tags: ["arch", "photo"] }
  ];
  (function populateStaticRegistry() {
    for (const entry of WIKIMEDIA_CATS_EXTENDED) {
      const id = "wmc_" + entry.cat.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 30);
      DYNAMIC_REGISTRY.push({
        id,
        adapter: "wikimedia_category",
        config: { cat: entry.cat },
        name: entry.name,
        tags: entry.tags || [],
        keyRequired: null
      });
    }
    for (const entry of ARCHIVE_COLLECTIONS) {
      const id = "ia_" + entry.collection.replace(/[^a-z0-9]+/g, "_").slice(0, 30);
      DYNAMIC_REGISTRY.push({
        id,
        adapter: "archive_collection",
        config: { collection: entry.collection },
        name: entry.name,
        tags: entry.tags || [],
        keyRequired: null
      });
    }
    console.log(`[insposearch] Static registry: ${DYNAMIC_REGISTRY.length} dynamic sources loaded.`);
  })();
  var KEY_SOURCES = [
    {
      id: "nasa",
      name: "NASA Images",
      desc: "space, earth & history \u2014 300k photos",
      imageCount: 3e5,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "met",
      name: "The Met Museum",
      desc: "400k art objects, global collection",
      imageCount: 4e5,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "wikimedia",
      name: "Wikimedia Commons",
      desc: "millions of real photos & documents",
      imageCount: 9e7,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "archive",
      name: "Internet Archive",
      desc: "historical photos & ephemera",
      imageCount: 2e7,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "inaturalist",
      name: "iNaturalist",
      desc: "50M nature observations, CC-licensed",
      imageCount: 5e7,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "loc",
      name: "Library of Congress",
      desc: "US historical images & documents",
      imageCount: 3e6,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "openlibrary",
      name: "Open Library",
      desc: "book covers \u2014 millions of editions",
      imageCount: 1e7,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "chicago",
      name: "Art Institute of Chicago",
      desc: "50k CC0 artworks, no key needed",
      imageCount: 5e4,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "cleveland",
      name: "Cleveland Museum of Art",
      desc: "64k artworks, CC0, no key needed",
      imageCount: 64e3,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "va",
      name: "Victoria & Albert Museum",
      desc: "1M+ objects, fashion, design, decorative art",
      imageCount: 12e5,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "wikiart",
      name: "WikiArt",
      desc: "250k paintings, drawings, prints \u2014 all styles",
      imageCount: 25e4,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "nordic",
      name: "Nordic Museum",
      desc: "Scandinavian design, folk art, fashion",
      imageCount: 1e5,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "flickr",
      name: "Flickr Commons",
      desc: "public domain photography, Creative Commons",
      imageCount: 5e5,
      alwaysOn: false,
      stateKey: "flickrKey",
      storageKey: "inspo_flickr_key",
      getKeyUrl: "https://www.flickr.com/services/api/keys/"
    },
    {
      id: "rijks",
      toggleId: "rijksmuseum",
      name: "Rijksmuseum",
      desc: "800k Dutch masterworks \u2014 no key needed",
      imageCount: 8e5,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "europeana",
      name: "Europeana",
      desc: "50M cultural objects across Europe",
      imageCount: 5e7,
      alwaysOn: false,
      stateKey: "europeanaKey",
      storageKey: "inspo_europeana_key",
      getKeyUrl: "https://pro.europeana.eu/pages/get-api"
    },
    {
      id: "harvard",
      name: "Harvard Art Museums",
      desc: "250k global art objects, rich metadata",
      imageCount: 25e4,
      alwaysOn: false,
      stateKey: "harvardKey",
      storageKey: "inspo_harvard_key",
      getKeyUrl: "https://forms.gle/apBabyNeWuHMoM5x6"
    },
    {
      id: "smithsonian",
      name: "Smithsonian",
      desc: "4.5M objects across 19 museums \u2014 works now, key unlocks higher limits",
      imageCount: 45e5,
      alwaysOn: true,
      optionalKey: true,
      stateKey: "smithsonianKey",
      storageKey: "inspo_smithsonian_key",
      getKeyUrl: "https://api.data.gov/signup",
      placeholder: "optional \u2014 paste for higher limits"
    },
    {
      id: "pexels",
      name: "Pexels",
      desc: "contemporary photography, 170 countries",
      imageCount: 32e5,
      alwaysOn: false,
      stateKey: "pexelsKey",
      storageKey: "inspo_pexels_key",
      getKeyUrl: "https://www.pexels.com/api"
    },
    {
      id: "pixabay",
      name: "Pixabay",
      desc: "2.7M CC0 photos & illustrations",
      imageCount: 27e5,
      alwaysOn: false,
      stateKey: "pixabayKey",
      storageKey: "inspo_pixabay_key",
      getKeyUrl: "https://pixabay.com/api/docs/"
    },
    {
      id: "getty",
      name: "Getty Museum",
      desc: "open-access artworks from J. Paul Getty collection",
      imageCount: 15e4,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "nga",
      name: "National Gallery of Art",
      desc: "US national collection \u2014 open access, Washington DC",
      imageCount: 5e4,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "gbif",
      name: "GBIF Biodiversity",
      desc: "2B+ nature observations with CC-licensed images",
      imageCount: 2e9,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "eol",
      name: "Encyclopedia of Life",
      desc: "species imagery \u2014 2M+ taxa, CC-licensed",
      imageCount: 2e6,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "apod",
      name: "NASA APOD Archive",
      desc: "astronomy picture of the day \u2014 10,000+ images",
      imageCount: 1e4,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "gallica",
      name: "Gallica (BnF)",
      desc: "French national library \u2014 5M+ digitized documents",
      imageCount: 5e6,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "chronicling",
      name: "Chronicling America",
      desc: "historic US newspapers 1770\u20131963, Library of Congress",
      imageCount: 16e6,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "openverse",
      name: "Openverse",
      desc: "800M+ openly-licensed images & audio",
      imageCount: 8e8,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "bhl",
      name: "Biodiversity Heritage Library",
      desc: "60M+ pages of natural history literature, public key",
      imageCount: 6e7,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "carnegie",
      name: "Carnegie Museum of Art",
      desc: "Pittsburgh collection, open-access artworks",
      imageCount: 3e4,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "prado",
      name: "Museo del Prado",
      desc: "Spanish masterworks \u2014 best-effort (CORS)",
      imageCount: 17e3,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "parismusees",
      name: "Paris Mus\xE9es",
      desc: "14 Paris museums \u2014 best-effort (CORS)",
      imageCount: 33e4,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "yale",
      name: "Yale Center for British Art",
      desc: "British paintings & drawings, IIIF, no key",
      imageCount: 6e4,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "picsum",
      name: "Lorem Picsum",
      desc: "high-quality texture & abstract photography (texture searches)",
      imageCount: 1e3,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "usgs",
      name: "USGS ScienceBase",
      desc: "geological & aerial imagery, US government open data",
      imageCount: 1e5,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "cooperhewitt",
      name: "Cooper Hewitt",
      desc: "Smithsonian design museum \u2014 demo token built in",
      imageCount: 2e5,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "trove",
      name: "Trove (NLA)",
      desc: "National Library of Australia \u2014 pictures & photos",
      imageCount: 2e6,
      alwaysOn: false,
      stateKey: "troveKey",
      storageKey: "inspo_trove_key",
      getKeyUrl: "https://trove.nla.gov.au/about/create-something/using-api"
    },
    {
      id: "digitalnz",
      name: "DigitalNZ",
      desc: "New Zealand cultural heritage images",
      imageCount: 3e7,
      alwaysOn: false,
      stateKey: "digitalnzKey",
      storageKey: "inspo_digitalnz_key",
      getKeyUrl: "https://digitalnz.org/developers"
    },
    {
      id: "tate",
      name: "Tate Collection",
      desc: "Tate London \u2014 British & international art, no key",
      imageCount: 77e3,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "finna",
      name: "Finnish Heritage (Finna)",
      desc: "10M+ Finnish cultural heritage items, no key",
      imageCount: 1e7,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "soch",
      name: "Swedish Heritage (SOCH)",
      desc: "Swedish cultural heritage \u2014 best-effort (CORS)",
      imageCount: 1e6,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "joconde",
      name: "Joconde (France)",
      desc: "French national museum database \u2014 data.culture.gouv.fr",
      imageCount: 5e5,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "mnw",
      name: "Muzeum Narodowe Warszawa",
      desc: "Polish National Museum Warsaw, open API",
      imageCount: 1e5,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "tepapa",
      name: "Te Papa (New Zealand)",
      desc: "Museum of NZ \u2014 Pacific & M\u0101ori taonga, no key",
      imageCount: 1e5,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "pas",
      name: "Portable Antiquities Scheme",
      desc: "UK archaeological finds \u2014 British Museum database",
      imageCount: 1e5,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "smg",
      name: "Science Museum Group",
      desc: "Science, technology & medicine history \u2014 London",
      imageCount: 1e5,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "auckland",
      name: "Auckland Museum",
      desc: "Auckland War Memorial Museum \u2014 NZ & Pacific",
      imageCount: 1e5,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "photogrammar",
      name: "Photogrammar (FSA)",
      desc: "170k FSA/OWI Depression-era photographs \u2014 Yale + LOC",
      imageCount: 17e4,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "wellcome",
      name: "Wellcome Collection",
      desc: "History of medicine, science & the body \u2014 London",
      imageCount: 25e4,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "maas",
      name: "Powerhouse (MAAS)",
      desc: "Powerhouse Museum Sydney \u2014 design, technology, decorative art",
      imageCount: 1e5,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "smk",
      name: "SMK (Denmark)",
      desc: "Statens Museum for Kunst \u2014 Danish national gallery",
      imageCount: 4e4,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "thyssen",
      name: "Thyssen-Bornemisza",
      desc: "Museo Thyssen Madrid \u2014 best-effort (CORS)",
      imageCount: 2e4,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "dpla",
      name: "DPLA",
      desc: "Digital Public Library of America \u2014 50M+ items",
      imageCount: 5e7,
      alwaysOn: false,
      stateKey: "dplaKey",
      storageKey: "inspo_dpla_key",
      getKeyUrl: "https://dp.la/info/developers"
    },
    {
      id: "ddb",
      name: "German Digital Library (DDB)",
      desc: "44M cultural objects from German institutions",
      imageCount: 44e6,
      alwaysOn: false,
      stateKey: "ddbKey",
      storageKey: "inspo_ddb_key",
      getKeyUrl: "https://www.deutsche-digitale-bibliothek.de/user/apikey"
    },
    {
      id: "artsy",
      name: "Artsy",
      desc: "Contemporary art marketplace \u2014 needs client_id + client_secret",
      imageCount: 1e6,
      alwaysOn: false,
      stateKey: "artsyId",
      storageKey: "inspo_artsy_id",
      getKeyUrl: "https://developers.artsy.net",
      artsyDual: true
    },
    {
      id: "gemini",
      name: "Gemini Vision",
      desc: "AI visual analysis \u2014 tags any image \xB7 free, 1,500/day",
      imageCount: 0,
      alwaysOn: false,
      stateKey: "geminiKey",
      storageKey: "inspo_gemini_key",
      getKeyUrl: "https://aistudio.google.com",
      aiProvider: true
    },
    {
      id: "claude",
      name: "Claude (Anthropic)",
      desc: "claude-sonnet-4-6 vision \xB7 bring your own key",
      imageCount: 0,
      alwaysOn: false,
      stateKey: "claudeKey",
      storageKey: "inspo_claude_key",
      getKeyUrl: "https://console.anthropic.com",
      aiProvider: true
    },
    {
      id: "openai",
      name: "GPT-4o (OpenAI)",
      desc: "gpt-4o vision \xB7 bring your own key \xB7 or any OpenAI-compatible endpoint",
      imageCount: 0,
      alwaysOn: false,
      stateKey: "openaiKey",
      storageKey: "inspo_openai_key",
      getKeyUrl: "https://platform.openai.com/api-keys",
      aiProvider: true,
      hasEndpoint: true
    },
    {
      id: "ollama",
      name: "Ollama (local)",
      desc: "run models locally \u2014 no api key needed \xB7 use vision models (llava, llama3.2-vision) for best results",
      imageCount: 0,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: "https://ollama.com/download",
      aiProvider: true,
      isOllama: true
    },
    // ── Batch 4 sources ────────────────────────────────────
    {
      id: "walters",
      name: "Walters Art Museum",
      desc: "27k medieval & Renaissance objects",
      imageCount: 27e3,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "princeton",
      name: "Princeton Art Museum",
      desc: "ancient & Asian art, IIIF",
      imageCount: 1e5,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "wikidata",
      name: "Wikidata",
      desc: "structured image data, 90M items",
      imageCount: 9e7,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "noaa",
      name: "NOAA",
      desc: "ocean, weather & coastal photography",
      imageCount: 5e4,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "hubble",
      name: "Hubble Telescope",
      desc: "space photography, cached 6h",
      imageCount: 1e4,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "cornell",
      name: "Cornell Digital",
      desc: "botanical prints, ornithology",
      imageCount: 1e5,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "folger",
      name: "Folger Library",
      desc: "Renaissance manuscripts",
      imageCount: 1e5,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "onb",
      name: "Austrian Nat. Library",
      desc: "12M+ historical items",
      imageCount: 12e6,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "nypl",
      name: "NYPL Digital",
      desc: "New York historical collections",
      imageCount: 9e5,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "mak",
      name: "MAK Vienna",
      desc: "design & decorative arts",
      imageCount: 1e5,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "louvre",
      name: "Louvre (via Joconde)",
      desc: "480k French museum objects",
      imageCount: 48e4,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "mna",
      name: "MNA Mexico",
      desc: "Pre-Columbian & indigenous art",
      imageCount: 5e4,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    // ── Batch 7 ────────────────────────────────────────────────
    {
      id: "mia",
      name: "Minneapolis Inst. of Art",
      desc: "50k CC0 works",
      imageCount: 5e4,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "lacma",
      name: "LACMA",
      desc: "20k LA museum public domain",
      imageCount: 2e4,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "munch",
      name: "Munch Museum",
      desc: "Edvard Munch complete works",
      imageCount: 28e3,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "mauritshuis",
      name: "Mauritshuis",
      desc: "Vermeer, Rembrandt \u2014 Dutch masters",
      imageCount: 800,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "nationalmuseumse",
      name: "Nationalmuseum Stockholm",
      desc: "Swedish art via Wikimedia",
      imageCount: 6e3,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "naturalis",
      name: "Naturalis Biodiversity",
      desc: "42M Dutch natural history",
      imageCount: 42e6,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "nmaahc",
      name: "NMAAHC (Smithsonian)",
      desc: "African American history & culture",
      imageCount: 37e3,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "nasm",
      name: "Air & Space (Smithsonian)",
      desc: "aviation, space exploration",
      imageCount: 65e3,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "whitney",
      name: "Whitney Museum",
      desc: "25k American art \u2014 CC0 CSV",
      imageCount: 25e3,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "nationalzoo",
      name: "National Zoo (Smithsonian)",
      desc: "animal photography",
      imageCount: 1e4,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "gbiflit",
      name: "GBIF Literature",
      desc: "scientific book illustration specimens",
      imageCount: 5e5,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "freersackler",
      name: "Freer|Sackler (Smithsonian)",
      desc: "Asian and African art",
      imageCount: 4e4,
      alwaysOn: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "ago",
      name: "Art Gallery of Ontario",
      desc: "Canadian and international art",
      imageCount: 1e5,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "pem",
      name: "Peabody Essex Museum",
      desc: "Asian export art, maritime",
      imageCount: 4e4,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "npg",
      name: "National Portrait Gallery",
      desc: "British portraits 215k+",
      imageCount: 215e3,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "louvread",
      name: "Louvre Abu Dhabi",
      desc: "cross-cultural universal art",
      imageCount: 1e4,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    // ── Phase 2 sources ────────────────────────────────────
    {
      id: "unsplash",
      name: "Unsplash",
      desc: "5M+ high-res photos, free key, CC0-style",
      imageCount: 5e6,
      alwaysOn: false,
      stateKey: "unsplashKey",
      storageKey: "inspo_unsplash_key",
      getKeyUrl: "https://unsplash.com/developers"
    },
    {
      id: "bodleian",
      name: "Bodleian Libraries",
      desc: "Oxford University digital collections \u2014 manuscripts, maps, rare books",
      imageCount: 4e5,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "bsb",
      name: "BSB Munich",
      desc: "Bayerische Staatsbibliothek \u2014 15M digitized pages, maps, illuminated manuscripts",
      imageCount: 1e6,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "cudl",
      name: "Cambridge Digital Library",
      desc: "Cambridge University manuscripts, scientific records, rare books",
      imageCount: 2e5,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "musee_orsay",
      name: "Mus\xE9e d'Orsay",
      desc: "Impressionist & Post-Impressionist masterworks \u2014 Paris",
      imageCount: 2e4,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "vangogh_museum",
      name: "Van Gogh Museum",
      desc: "World\u2019s largest collection of Van Gogh works \u2014 Amsterdam",
      imageCount: 5e3,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "khm",
      name: "Kunsthistorisches Museum",
      desc: "Habsburg Imperial collections \u2014 fine art, antiquities \u2014 Vienna",
      imageCount: 1e5,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "belvedere",
      name: "Belvedere Vienna",
      desc: "Austrian art from Baroque to the 20th century \u2014 Vienna",
      imageCount: 1e4,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "staedel",
      name: "St\xE4del Museum",
      desc: "700 years of European art \u2014 Frankfurt\u2019s premier art museum",
      imageCount: 15e3,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "rmfab",
      name: "Royal Museums of Fine Arts Belgium",
      desc: "Flemish Masters, Ensor, Magritte \u2014 Brussels",
      imageCount: 15e3,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "guimet",
      name: "Mus\xE9e Guimet",
      desc: "Asian arts from Afghanistan to Japan \u2014 Paris",
      imageCount: 1e4,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "npm_taipei",
      name: "National Palace Museum",
      desc: "Chinese imperial collections \u2014 jade, porcelain, calligraphy \u2014 Taipei",
      imageCount: 5e4,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    // ── Phase F — Fashion & Textile sources ──
    {
      id: "galliera",
      name: "Mus\xE9e Galliera",
      desc: "Paris couture & fashion museum \u2014 haute couture, accessories",
      imageCount: 558,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "arts_decoratifs",
      name: "Mus\xE9e des Arts D\xE9coratifs",
      desc: "Paris \u2014 fashion, jewellery, design, decorative arts",
      imageCount: 184,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "centraal_museum",
      name: "Centraal Museum",
      desc: "Utrecht \u2014 Dutch fashion, costumes, applied arts",
      imageCount: 2180,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "textile_museum_tilburg",
      name: "Textile Museum Tilburg",
      desc: "Dutch textile art, weaving, fashion fabrics",
      imageCount: 1337,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "wereldculturen",
      name: "Museum van Wereldculturen",
      desc: "Dutch national world cultures \u2014 textiles, costumes, ethnographic dress",
      imageCount: 1143,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "dec_arts_prague",
      name: "Museum of Decorative Arts Prague",
      desc: "Czech decorative arts \u2014 textiles, fashion, glass, furniture",
      imageCount: 45966,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "designmuseum_dk",
      name: "Designmuseum Danmark",
      desc: "Copenhagen \u2014 Danish & international design, fashion, textiles",
      imageCount: 649,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "boijmans",
      name: "Museum Boijmans Van Beuningen",
      desc: "Rotterdam \u2014 applied art, fashion, design, painting",
      imageCount: 375,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    {
      id: "museu_traje",
      name: "Museu Nacional do Traje",
      desc: "Lisbon costume museum \u2014 Portuguese fashion & dress history",
      imageCount: 161,
      alwaysOn: true,
      cors: true,
      stateKey: null,
      storageKey: null,
      getKeyUrl: null
    },
    // Phase G — Art, Sculpture & History CORS-blocked (14)
    { id: "kmska", name: "KMSKA (Royal Museum of Fine Arts Antwerp)", desc: "Flemish & European art \u2014 Rubens, Van Eyck, Ensor", imageCount: 2860, alwaysOn: true, cors: true, stateKey: null, storageKey: null, getKeyUrl: null },
    { id: "amsterdam_museum", name: "Amsterdam Museum", desc: "History & art of Amsterdam from the Middle Ages", imageCount: 2315, alwaysOn: true, cors: true, stateKey: null, storageKey: null, getKeyUrl: null },
    { id: "ngi", name: "National Gallery of Ireland", desc: "European & Irish art \u2014 paintings, sculpture, works on paper", imageCount: 1845, alwaysOn: true, cors: true, stateKey: null, storageKey: null, getKeyUrl: null },
    { id: "fries_museum", name: "Fries Museum", desc: "Art & history of Friesland, Mata Hari collection", imageCount: 1155, alwaysOn: true, cors: true, stateKey: null, storageKey: null, getKeyUrl: null },
    { id: "groeninge", name: "Groeningemuseum", desc: "Flemish Primitives to modern Belgian art in Bruges", imageCount: 947, alwaysOn: true, cors: true, stateKey: null, storageKey: null, getKeyUrl: null },
    { id: "groninger", name: "Groninger Museum", desc: "Art, design & regional history in Groningen", imageCount: 858, alwaysOn: true, cors: true, stateKey: null, storageKey: null, getKeyUrl: null },
    { id: "moma_wd", name: "Museum of Modern Art (MoMA)", desc: "Modern & contemporary art \u2014 Wikidata bridge", imageCount: 659, alwaysOn: true, cors: true, stateKey: null, storageKey: null, getKeyUrl: null },
    { id: "rijksmuseum_twenthe", name: "Rijksmuseum Twenthe", desc: "European art from medieval to contemporary in Enschede", imageCount: 568, alwaysOn: true, cors: true, stateKey: null, storageKey: null, getKeyUrl: null },
    { id: "herzog_anton_ulrich", name: "Herzog Anton Ulrich Museum", desc: "Old Masters, medieval art & sculpture in Braunschweig", imageCount: 261, alwaysOn: true, cors: true, stateKey: null, storageKey: null, getKeyUrl: null },
    { id: "galleria_palatina", name: "Galleria Palatina", desc: "Renaissance masterpieces in Palazzo Pitti, Florence", imageCount: 220, alwaysOn: true, cors: true, stateKey: null, storageKey: null, getKeyUrl: null },
    { id: "lakenhal", name: "Museum De Lakenhal", desc: "Art & history of Leiden \u2014 Rembrandt's birthplace", imageCount: 178, alwaysOn: true, cors: true, stateKey: null, storageKey: null, getKeyUrl: null },
    { id: "teylers", name: "Teylers Museum", desc: "Oldest museum in the Netherlands \u2014 art, science, fossils", imageCount: 161, alwaysOn: true, cors: true, stateKey: null, storageKey: null, getKeyUrl: null },
    { id: "alte_pinakothek", name: "Alte Pinakothek", desc: "European painting from 14th\u201318th century in Munich", imageCount: 160, alwaysOn: true, cors: true, stateKey: null, storageKey: null, getKeyUrl: null },
    { id: "quai_branly", name: "Mus\xE9e du quai Branly", desc: "Indigenous & non-Western art from Africa, Asia, Oceania, Americas", imageCount: 154, alwaysOn: true, cors: true, stateKey: null, storageKey: null, getKeyUrl: null },
    // Phase H — 113 World Museum Collection Sources
    ...WD_PHASE_H.map((s) => ({ id: s.id, name: s.name, desc: s.desc, imageCount: s.count, alwaysOn: true, cors: true, stateKey: null, storageKey: null, getKeyUrl: null }))
  ];

  // src/core.js
  var hooks = {
    showToast: null,
    // (msg, duration) => void — set by app.js
    buildKeyRows: null
    // () => void — set by app.js
  };
  function selectDynamicSources(keyword, maxCount = 150) {
    const qc = classifyQueryExtended(keyword);
    const qcv2 = classifyQueryV2(keyword);
    const hasAnyIntent = qc.isNature || qc.isSpace || qc.isArt || qc.isHistory || qc.isArch || qc.isDesign || qc.isPhoto || qc.isScience;
    const intentTags = [];
    if (qc.isNature) intentTags.push("nature");
    if (qc.isSpace) intentTags.push("space");
    if (qc.isArt) intentTags.push("art");
    if (qc.isHistory) intentTags.push("history");
    if (qc.isArch) intentTags.push("arch");
    if (qc.isDesign) intentTags.push("design");
    if (qc.isPhoto) intentTags.push("photo");
    if (qc.isScience) intentTags.push("science");
    if (qcv2.movement) intentTags.push("art");
    if (qcv2.medium === "Photograph") intentTags.push("photo");
    if (qcv2.medium === "Textile") intentTags.push("design");
    if (qcv2.medium === "Ceramic") intentTags.push("design");
    if (qcv2.isSpecies) intentTags.push("nature");
    const scored = DYNAMIC_REGISTRY.filter((s) => {
      if (s.keyRequired && !STATE[s.keyRequired]) return false;
      if (STATE.disabledSources.has(s.id)) return false;
      return true;
    }).map((s) => {
      let score = 1;
      if (hasAnyIntent && s.tags && s.tags.length) {
        const overlap = s.tags.filter((t) => intentTags.includes(t)).length;
        score += overlap * 5;
        if (overlap === 0 && intentTags.length >= 2) score -= 1;
      }
      if (qcv2.isArtist && s.tags && s.tags.includes("art")) score += 3;
      if (qcv2.era && s.tags && s.tags.includes("history")) score += 2;
      if (s.imageCount && s.imageCount > 1e4) score += 1;
      score += Math.abs(queryToSeed(keyword)) % 1e3 / 2e3;
      return { ...s, _score: score };
    }).sort((a, b) => b._score - a._score);
    return scored.slice(0, maxCount);
  }
  (function() {
    SOURCE_GROUPS.fashion.push("euro_fashion", "wmc_fashion", "si_chndm");
    SOURCE_GROUPS.museums.push("si_nmah", "si_nmnh", "si_npg_dc", "si_saam", "si_hmsg", "si_nzp", "si_chndm", "si_fsg", "si_nmafa", "si_nmai", "si_nmaahc2", "si_nasm2", "si_npm", "si_acm", "si_renwick", "euro_rijksmuseum", "euro_kulturpool", "euro_estonian");
    SOURCE_GROUPS.archives.push(...Object.keys(EUROPEANA_PROVIDERS), ...Object.keys(DPLA_HUBS));
    SOURCE_GROUPS.artdesign.push("euro_rijksmuseum", "euro_fashion", "wmc_paintings", "wmc_sculptures", "wmc_portraits", "wmc_architecture", "wmc_fashion", "si_saam", "si_hmsg", "si_renwick", "si_nmafa", "si_fsg");
    SOURCE_GROUPS.nature.push("si_nzp", "si_nmnh", "wmc_natural_history", "wmc_botanical", "idigbio", "ala");
    SOURCE_GROUPS.maps.push("wmc_maps");
    SOURCE_GROUPS.historical.push(...Object.keys(DPLA_HUBS), "euro_newspapers", "euro_ddb", "euro_bnf", "euro_bne", "euro_kb", "euro_bn_pl", "euro_nkr", "euro_kulturpool", "euro_hispana", "euro_nuk", "euro_estonian", "euro_lithuanian", "euro_latvian", "euro_hungarian", "euro_romanian", "euro_bulgarian", "si_nmah", "si_npm", "si_acm", "si_nmai");
    SOURCE_GROUPS.botanical.push("wmc_botanical");
    SOURCE_GROUPS.science.push("si_nmnh", "si_nzp", "si_nasm2", "wmc_natural_history", "wmc_scientific", "idigbio", "ala", "nasa_images");
    SOURCE_GROUPS.historical.push("loc");
    SOURCE_GROUPS.archives.push("loc");
    SOURCE_GROUPS.museums.push("nhm_london", "wallace_collection", "fitzwilliam", "national_gallery_london", "scottish_national");
    SOURCE_GROUPS.museums.push("musee_orsay", "vangogh_museum", "khm", "belvedere", "staedel", "rmfab", "guimet", "npm_taipei");
    SOURCE_GROUPS.museums.push("galliera", "arts_decoratifs", "centraal_museum", "textile_museum_tilburg", "wereldculturen", "dec_arts_prague", "designmuseum_dk", "boijmans", "museu_traje");
    SOURCE_GROUPS.fashion.push("galliera", "arts_decoratifs", "centraal_museum", "textile_museum_tilburg", "wereldculturen", "dec_arts_prague", "designmuseum_dk", "boijmans", "museu_traje");
    SOURCE_GROUPS.artdesign.push("galliera", "arts_decoratifs", "centraal_museum", "boijmans", "dec_arts_prague", "designmuseum_dk");
    SOURCE_GROUPS.museums.push("kmska", "amsterdam_museum", "ngi", "fries_museum", "groeninge", "groninger", "moma_wd", "rijksmuseum_twenthe", "herzog_anton_ulrich", "galleria_palatina", "lakenhal", "teylers", "alte_pinakothek", "quai_branly");
    SOURCE_GROUPS.artdesign.push("kmska", "groeninge", "groninger", "moma_wd", "rijksmuseum_twenthe", "herzog_anton_ulrich", "galleria_palatina", "lakenhal", "teylers", "alte_pinakothek", "ngi", "amsterdam_museum", "fries_museum", "quai_branly");
    SOURCE_GROUPS.nature.push("nhm_london");
    SOURCE_GROUPS.science.push("nhm_london");
    WD_PHASE_H.forEach((s) => {
      s.cat.forEach((c) => {
        if (SOURCE_GROUPS[c]) SOURCE_GROUPS[c].push(s.id);
      });
    });
  })();
  function loadSourceHealth() {
    try {
      const saved = sessionStorage.getItem("inspo_health");
      if (saved) STATE.sourceHealth = JSON.parse(saved);
    } catch (e) {
    }
  }
  var _healthWriteTimer = null;
  function _flushSourceHealth() {
    try {
      sessionStorage.setItem("inspo_health", JSON.stringify(STATE.sourceHealth));
    } catch (e) {
    }
    _healthWriteTimer = null;
  }
  function recordSourceResult(sourceName, resultCount) {
    const h = STATE.sourceHealth;
    if (!h[sourceName]) h[sourceName] = { hits: 0, misses: 0, lastSeen: 0 };
    if (resultCount > 0) {
      const wasPaused = h[sourceName].misses >= CONSTANTS.HEALTH_MISS_LIMIT;
      h[sourceName].hits++;
      h[sourceName].misses = 0;
      h[sourceName].lastSeen = Date.now();
      h[sourceName]._notified = false;
      if (wasPaused && hooks.showToast) {
        hooks.showToast(`source "${sourceName}" recovered`, 2e3);
      }
    } else {
      h[sourceName].misses++;
    }
    if (!_healthWriteTimer) _healthWriteTimer = setTimeout(_flushSourceHealth, 2e3);
  }
  function isSourceHealthy(sourceName) {
    const h = STATE.sourceHealth[sourceName];
    if (!h) return true;
    if (h.misses >= CONSTANTS.HEALTH_MISS_LIMIT) {
      if (!h._notified) {
        h._notified = true;
        if (hooks.showToast) hooks.showToast(`source "${sourceName}" paused \u2014 no results after ${CONSTANTS.HEALTH_MISS_LIMIT} tries`, 3e3);
      }
      return false;
    }
    return true;
  }
  function callIfHealthy(sourceName, fetchPromise) {
    if (STATE.disabledSources.has(sourceName)) return Promise.resolve([]);
    if (!isSourceHealthy(sourceName)) return Promise.resolve([]);
    return fetchPromise;
  }
  var _updateSourcesActiveCounterImmediate = function _updateSourcesActiveCounterImmediate2() {
    const hardcoded = ALL_SOURCES.filter((id) => !STATE.disabledSources.has(id) && isSourceHealthy(id)).length;
    const dynamic = DYNAMIC_REGISTRY.filter((s) => !s.keyRequired || STATE[s.keyRequired]).length;
    const active = hardcoded + dynamic;
    const el = document.getElementById("sources-active-counter");
    if (el) el.textContent = active + " sources active";
  };
  var updateSourcesActiveCounter = debounce(() => _updateSourcesActiveCounterImmediate(), CONSTANTS.COUNTER_DEBOUNCE);
  loadSourceHealth();
  loadDisabledSources();
  updateSourcesActiveCounter();
  function loadGeminiCounter() {
    try {
      const stored = localStorage.getItem("inspo_gemini_count");
      if (!stored) return;
      const data = JSON.parse(stored);
      const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      if (data.date === today) {
        STATE.geminiDailyCount = data.count || 0;
        STATE.geminiDailyDate = data.date;
      } else {
        STATE.geminiDailyCount = 0;
        STATE.geminiDailyDate = today;
        localStorage.setItem("inspo_gemini_count", JSON.stringify({ count: 0, date: today }));
      }
    } catch (e) {
    }
  }
  var _geminiMinuteLog = [];
  var GEMINI_PER_MINUTE_LIMIT = 55;
  var _aiMinuteLogs = { gemini: _geminiMinuteLog, claude: [], openai: [] };
  var _AI_PER_MINUTE_LIMITS = { gemini: 55, claude: 50, openai: 50 };
  function incrementGeminiCounter() {
    try {
      STATE.geminiDailyCount++;
      const now = Date.now();
      _geminiMinuteLog.push(now);
      const cutoff = now - 6e4;
      while (_geminiMinuteLog.length > 0 && _geminiMinuteLog[0] < cutoff) _geminiMinuteLog.shift();
      const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      localStorage.setItem(
        "inspo_gemini_count",
        JSON.stringify({ count: STATE.geminiDailyCount, date: today })
      );
      updateGeminiCounterUI();
    } catch (e) {
    }
  }
  function isGeminiRateLimited() {
    const oneMinuteAgo = Date.now() - 6e4;
    while (_geminiMinuteLog.length && _geminiMinuteLog[0] < oneMinuteAgo) _geminiMinuteLog.shift();
    return _geminiMinuteLog.length >= GEMINI_PER_MINUTE_LIMIT;
  }
  function isAIProviderRateLimited(provider) {
    const log = _aiMinuteLogs[provider];
    if (!log) return false;
    const limit = _AI_PER_MINUTE_LIMITS[provider] || 50;
    const oneMinuteAgo = Date.now() - 6e4;
    while (log.length && log[0] < oneMinuteAgo) log.shift();
    return log.length >= limit;
  }
  function trackAIProviderCall(provider) {
    const log = _aiMinuteLogs[provider];
    if (!log) return;
    log.push(Date.now());
    const cutoff = Date.now() - 6e4;
    while (log.length > 0 && log[0] < cutoff) log.shift();
  }
  function updateGeminiCounterUI() {
    const el = document.getElementById("gemini-usage-counter");
    if (!el) return;
    const count = STATE.geminiDailyCount;
    if (count >= 1500) {
      el.textContent = "daily limit reached \u2014 resets midnight";
      el.style.color = "#E24B4A";
      disableGeminiButtons();
    } else if (count >= 1400) {
      el.textContent = `\u2726 ${count} used \u2014 approaching limit`;
      el.style.color = "var(--accent)";
    } else {
      el.textContent = `\u2726 ${count} / 1500 used today`;
      el.style.color = "var(--ink-3)";
    }
  }
  function disableGeminiButtons() {
    ["analyse-btn", "interpret-btn"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.classList.add("disabled");
        btn.setAttribute("disabled", true);
      }
    });
  }
  function getAITagsCache(itemId) {
    try {
      const raw = localStorage.getItem("inspo_aitags_" + itemId);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() - data.timestamp > 864e5) {
        localStorage.removeItem("inspo_aitags_" + itemId);
        return null;
      }
      return data.tags;
    } catch (e) {
      return null;
    }
  }
  function setAITagsCache(itemId, tags) {
    try {
      const AI_CACHE_MAX = 200;
      const prefix = "inspo_aitags_";
      const countKey = "inspo_aitags_count";
      let count = parseInt(localStorage.getItem(countKey), 10) || 0;
      if (count >= AI_CACHE_MAX) {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(prefix)) keys.push(key);
        }
        count = keys.length;
        if (count >= AI_CACHE_MAX) {
          const entries = keys.map((k) => {
            try {
              return { k, ts: JSON.parse(localStorage.getItem(k))?.timestamp || 0 };
            } catch {
              return { k, ts: 0 };
            }
          }).sort((a, b) => a.ts - b.ts);
          const toRemove = entries.slice(0, count - AI_CACHE_MAX + 10);
          toRemove.forEach((e) => localStorage.removeItem(e.k));
          count -= toRemove.length;
        }
      }
      localStorage.setItem(
        prefix + itemId,
        JSON.stringify({ tags, timestamp: Date.now() })
      );
      localStorage.setItem(countKey, String(count + 1));
    } catch (e) {
    }
  }
  loadGeminiCounter();
  function loadDisabledSources() {
    try {
      const saved = localStorage.getItem("inspo_disabled_sources");
      if (saved) STATE.disabledSources = new Set(JSON.parse(saved));
    } catch (e) {
    }
  }
  function saveDisabledSources() {
    try {
      localStorage.setItem(
        "inspo_disabled_sources",
        JSON.stringify([...STATE.disabledSources])
      );
    } catch (e) {
    }
  }
  function toggleSource(sourceId) {
    if (STATE.disabledSources.has(sourceId)) {
      STATE.disabledSources.delete(sourceId);
    } else {
      STATE.disabledSources.add(sourceId);
    }
    STATE.activePreset = null;
    saveDisabledSources();
    updateSourcesActiveCounter();
    updatePresetButtons();
  }
  function applyPreset(preset) {
    if (preset === "all") {
      STATE.disabledSources = /* @__PURE__ */ new Set();
    } else if (preset === "none") {
      STATE.disabledSources = new Set(ALL_SOURCES);
    } else {
      const group = SOURCE_GROUPS[preset];
      if (!group) return;
      STATE.disabledSources = new Set(ALL_SOURCES.filter((s) => !group.includes(s)));
    }
    STATE.activePreset = preset;
    saveDisabledSources();
    updateSourcesActiveCounter();
    hooks.buildKeyRows?.();
    updatePresetButtons();
  }
  function updatePresetButtons() {
    const panel = document.getElementById("source-presets");
    if (!panel) return;
    panel.querySelectorAll(".preset-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.preset === STATE.activePreset);
    });
  }
  var SOURCE_VIEW_FILTER = { region: "", access: "", category: "" };
  function applySourceFilter() {
    const { region, access, category } = SOURCE_VIEW_FILTER;
    let visible = 0;
    document.querySelectorAll("#keys-rows-container .key-source-row").forEach((row) => {
      const id = row.dataset.sourceId;
      const src = KEY_SOURCES.find((s) => s.id === id || s.toggleId === id);
      const meta = SOURCE_META[src?.toggleId || id] || SOURCE_META[id] || {};
      const regMatch = !region || meta.region === region;
      const accMatch = !access || meta.access === access;
      const catMatch = !category || (meta.category || []).includes(category);
      const show = regMatch && accMatch && catMatch;
      row.style.display = show ? "" : "none";
      if (show) visible++;
    });
    const countEl = document.getElementById("filter-source-count");
    if (countEl) countEl.textContent = visible ? `${visible} sources` : "";
  }
  function setSourceViewFilter(dimension, value) {
    SOURCE_VIEW_FILTER[dimension] = value;
    const bar = document.getElementById("source-view-filters");
    if (bar) {
      bar.querySelectorAll(`.filter-pill[data-filter="${dimension}"]`).forEach((pill) => {
        pill.classList.toggle("active", pill.dataset.value === value);
      });
    }
    applySourceFilter();
  }
  var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  function stripHtml(str) {
    if (!str) return "";
    return str.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  function debounce(fn, ms) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }
  function withTimeout(signal, ms = 3e3) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    if (signal.aborted) {
      clearTimeout(timer);
      controller.abort();
    } else {
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        controller.abort();
      }, { once: true });
    }
    return controller.signal;
  }
  var _fetchSemaphore = { running: 0, queue: [], limit: 25, _totalFailed: 0 };
  function _acquireFetchSlot() {
    return new Promise((resolve) => {
      if (_fetchSemaphore.running < _fetchSemaphore.limit) {
        _fetchSemaphore.running++;
        resolve();
      } else {
        _fetchSemaphore.queue.push(resolve);
      }
    });
  }
  function _releaseFetchSlot() {
    _fetchSemaphore.running--;
    if (_fetchSemaphore.queue.length) {
      _fetchSemaphore.running++;
      _fetchSemaphore.queue.shift()();
    }
  }
  async function safeFetch(url, opts = {}, timeoutMs = CONSTANTS.FETCH_TIMEOUT) {
    await _acquireFetchSlot();
    try {
      const origSignal = opts.signal;
      const s = origSignal ? withTimeout(origSignal, timeoutMs) : AbortSignal.timeout(timeoutMs);
      const fetchOpts = { ...opts, signal: s };
      let res = await fetch(url, fetchOpts);
      for (let attempt = 0; res.status === 429 && attempt < 2; attempt++) {
        const delay = CONSTANTS.RETRY_DELAY * Math.pow(2, attempt);
        await sleep(delay);
        if (origSignal?.aborted) throw new DOMException("Aborted", "AbortError");
        res = await fetch(url, fetchOpts);
      }
      return res;
    } catch (err) {
      _fetchSemaphore._totalFailed++;
      throw err;
    } finally {
      _releaseFetchSlot();
    }
  }
  var _sourceTimings = {};
  function sourceFetch(url, opts = {}, sourceName) {
    const timing = _sourceTimings[sourceName];
    const timeout = timing ? Math.min(5e3, Math.max(2e3, Math.round(timing.avg * 2))) : CONSTANTS.FETCH_TIMEOUT;
    const start = performance.now();
    return safeFetch(url, opts, timeout).then((res) => {
      const elapsed = performance.now() - start;
      if (!_sourceTimings[sourceName]) _sourceTimings[sourceName] = { avg: elapsed, count: 1 };
      else {
        const t = _sourceTimings[sourceName];
        t.avg = (t.avg * t.count + elapsed) / (t.count + 1);
        t.count = Math.min(t.count + 1, 20);
      }
      return res;
    });
  }
  async function fetchFromDataCache(sourceId, keyword) {
    try {
      const res = await fetch(`/data/${sourceId}.json`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.items || !data.items.length) return null;
      const kw = keyword.toLowerCase();
      const filtered = data.items.filter(
        (item) => item.title && item.title.toLowerCase().includes(kw) || item.tags && item.tags.some((t) => t.toLowerCase().includes(kw))
      );
      const results = filtered.length > 0 ? filtered : data.items.sort(() => Math.random() - 0.5).slice(0, 20);
      return results.slice(0, STATE.perSource || 20);
    } catch {
      return null;
    }
  }
  function pickOnboardingTerm() {
    return ONBOARDING_TERMS[Math.floor(Math.random() * ONBOARDING_TERMS.length)];
  }
  function getSourceConfig(sourceId) {
    return KEY_SOURCES.find((s) => s.id === sourceId || s.toggleId === sourceId) || null;
  }
  function getSourceName(sourceId) {
    return getSourceConfig(sourceId)?.name || sourceId;
  }
  function getSourceDomain(sourceId) {
    const fromConfig = getSourceConfig(sourceId)?.getKeyUrl;
    if (fromConfig) {
      try {
        return new URL(fromConfig).hostname;
      } catch {
      }
    }
    return SOURCE_DOMAINS[sourceId] || sourceId + ".org";
  }
  function getSourceMonogram(label) {
    return (label || "").replace(/[^a-z0-9\s]/gi, " ").trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "??";
  }
  function createSourceIdentity(sourceId, labelText) {
    const sourceLabel = labelText || getSourceName(sourceId);
    const domain = getSourceDomain(sourceId);
    const wrapper = document.createElement("span");
    wrapper.className = "source-identity";
    const iconWrap = document.createElement("span");
    iconWrap.className = "source-icon-wrap";
    const icon = document.createElement("img");
    icon.className = "source-icon";
    icon.alt = sourceLabel + " icon";
    icon.src = "https://" + domain + "/favicon.ico";
    const mono = document.createElement("span");
    mono.className = "source-mono";
    mono.textContent = getSourceMonogram(sourceLabel);
    icon.onerror = () => {
      icon.style.display = "none";
      mono.style.display = "inline-flex";
    };
    iconWrap.appendChild(icon);
    iconWrap.appendChild(mono);
    const label = document.createElement("span");
    label.className = "source-label";
    label.textContent = sourceLabel;
    wrapper.appendChild(iconWrap);
    wrapper.appendChild(label);
    return wrapper;
  }
  function trigramSimilarity(a, b) {
    if (!a || !b) return 0;
    a = a.toLowerCase();
    b = b.toLowerCase();
    if (a === b) return 1;
    const trigrams = (s) => {
      const t = /* @__PURE__ */ new Set();
      const padded = "  " + s + " ";
      for (let i = 0; i < padded.length - 2; i++) t.add(padded.slice(i, i + 3));
      return t;
    };
    const tA = trigrams(a), tB = trigrams(b);
    let matches = 0;
    for (const t of tA) if (tB.has(t)) matches++;
    return matches / Math.max(tA.size, tB.size);
  }
  var scoreItemRelevance = function scoreItemRelevance2(item, query) {
    const q = (query || "").toLowerCase().trim();
    if (!q) return 0;
    const terms = q.split(/\s+/).filter(Boolean);
    const title = (item.title || "").toLowerCase();
    const desc = (item.description || "").toLowerCase();
    const tags = (item.tags || []).join(" ").toLowerCase();
    const text = `${title} ${desc} ${tags}`;
    let score = 0;
    if (title.includes(q)) score += 9;
    if (desc.includes(q)) score += 4;
    if (text.includes(q)) score += 5;
    let termMatches = 0;
    terms.forEach((t) => {
      if (title.includes(t)) {
        score += 3;
        termMatches++;
      } else if (desc.includes(t)) {
        score += 2;
        termMatches++;
      } else if (tags.includes(t)) {
        score += 2;
        termMatches++;
      }
    });
    if (terms.length > 1 && termMatches === terms.length) score += 4;
    if (score === 0 && query) {
      const hay = `${title} ${desc} ${tags}`;
      const words = hay.split(/\s+/);
      for (const term of terms) {
        for (const word of words) {
          if (trigramSimilarity(term, word) > 0.55) {
            score += 1;
            break;
          }
        }
      }
    }
    return score;
  };
  function mulberry32(seed) {
    return function() {
      seed |= 0;
      seed = seed + 1831565813 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function seededShuffle(arr, rng) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function queryToSeed(query) {
    let h = 0;
    for (let i = 0; i < query.length; i++) {
      h = (h << 5) - h + query.charCodeAt(i) | 0;
    }
    return h;
  }
  var _lastDisplayOrder = [];
  var getDisplayResults = function getDisplayResults2(items, query) {
    const base = Array.isArray(items) ? [...items] : [];
    if (!base.length) {
      _lastDisplayOrder = [];
      return [];
    }
    if (STATE.searchMode === "exact") {
      const terms = (query || "").toLowerCase().trim().split(/\s+/).filter(Boolean);
      const ranked = base.filter((item) => {
        if (!terms.length) return true;
        const hay = `${item.title || ""} ${item.description || ""} ${(item.tags || []).join(" ")}`.toLowerCase();
        return terms.some((t) => hay.includes(t));
      }).map((item) => ({ item, score: scoreItemRelevance(item, query) })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).map((x) => x.item);
      _lastDisplayOrder = ranked;
      return ranked.slice(0, STATE.imageCount);
    }
    const buckets = {};
    for (const item of base) {
      const s = item.source || "unknown";
      (buckets[s] || (buckets[s] = [])).push(item);
    }
    const rng = mulberry32(queryToSeed(query || ""));
    const arrays = Object.values(buckets).map((arr) => seededShuffle(arr, rng));
    _lastDisplayOrder = interleave(arrays);
    return _lastDisplayOrder.slice(0, STATE.imageCount);
  };
  function showQuietTip(targetId, text, tipKey) {
    if (!text) return;
    if (tipKey && localStorage.getItem(tipKey)) return;
    const target = document.getElementById(targetId);
    if (!target) return;
    if (tipKey) localStorage.setItem(tipKey, "1");
    const rect = target.getBoundingClientRect();
    const tip = document.createElement("div");
    tip.className = "quiet-tip";
    tip.textContent = text;
    document.body.appendChild(tip);
    const left = Math.max(10, Math.min(window.innerWidth - 230, rect.left + rect.width / 2 - 90));
    const top = Math.max(10, rect.top - 38);
    tip.style.left = left + "px";
    tip.style.top = top + "px";
    requestAnimationFrame(() => tip.classList.add("visible"));
    setTimeout(() => {
      tip.classList.remove("visible");
      setTimeout(() => tip.remove(), 260);
    }, 2600);
  }
  var STOPWORDS = /* @__PURE__ */ new Set([
    "the",
    "a",
    "an",
    "of",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "by",
    "from",
    "and",
    "or",
    "but",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "this",
    "that",
    "these",
    "those",
    "it",
    "its",
    "he",
    "she",
    "they",
    "image",
    "photo",
    "photograph",
    "picture",
    "file",
    "view",
    "unknown",
    "untitled",
    "circa",
    "century",
    "collection",
    "museum",
    "gallery",
    "work",
    "object",
    "item",
    "piece",
    "detail",
    "figure",
    "plate",
    "sheet"
  ]);
  function extractTags(item) {
    const text = `${item.title} ${item.description}`;
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !STOPWORDS.has(w));
    const combined = [.../* @__PURE__ */ new Set([...item.tags, ...words])];
    return combined.slice(0, 12);
  }
  function isLikelyReal(item) {
    const banned = [
      "midjourney",
      "stable diffusion",
      "dall-e",
      "dall e",
      "ai generated",
      "ai-generated",
      "artificial intelligence generated",
      "deepfake",
      "neural network generated",
      "stylegan",
      "generative ai",
      "text-to-image"
    ];
    const text = `${item.title} ${item.description} ${item.url}`.toLowerCase();
    return !banned.some((b) => text.includes(b));
  }
  var CACHE_PREFIX = "inspo_cache_";
  var CACHE_TTL = 24 * 60 * 60 * 1e3;
  var CACHE_MAX_BYTES = 4 * 1024 * 1024;
  function cacheKey(keyword) {
    const mode = STATE.searchMode === "exact" ? "exact_" : "";
    return CACHE_PREFIX + mode + keyword.toLowerCase().trim();
  }
  function cacheGet(keyword) {
    try {
      const raw = localStorage.getItem(cacheKey(keyword));
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (Date.now() - entry.timestamp > CACHE_TTL) {
        localStorage.removeItem(cacheKey(keyword));
        return null;
      }
      return entry;
    } catch {
      return null;
    }
  }
  function cacheSet(keyword, results, keywords) {
    try {
      pruneCache();
      const entry = { results, keywords, timestamp: Date.now() };
      localStorage.setItem(cacheKey(keyword), JSON.stringify(entry));
    } catch {
      pruneCache(true);
    }
  }
  function pruneCache(aggressive = false) {
    const entries = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(CACHE_PREFIX)) continue;
      try {
        const raw = localStorage.getItem(k);
        const entry = JSON.parse(raw);
        entries.push({ k, timestamp: entry.timestamp, size: raw.length });
      } catch {
        localStorage.removeItem(k);
      }
    }
    const now = Date.now();
    entries.forEach((e) => {
      if (now - e.timestamp > CACHE_TTL) localStorage.removeItem(e.k);
    });
    if (aggressive) {
      const remaining = entries.filter((e) => now - e.timestamp <= CACHE_TTL);
      remaining.sort((a, b) => a.timestamp - b.timestamp);
      let totalSize = remaining.reduce((s, e) => s + e.size, 0);
      while (totalSize > CACHE_MAX_BYTES && remaining.length) {
        const oldest = remaining.shift();
        localStorage.removeItem(oldest.k);
        totalSize -= oldest.size;
      }
    }
  }
  function getCacheAge(keyword) {
    try {
      const raw = localStorage.getItem(cacheKey(keyword));
      if (!raw) return null;
      const entry = JSON.parse(raw);
      return Date.now() - entry.timestamp;
    } catch {
      return null;
    }
  }
  function formatCacheAge(ms) {
    const mins = Math.floor(ms / 6e4);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
  }
  function interleave(arrays) {
    const result = [];
    const max = Math.max(...arrays.map((a) => a.length));
    for (let i = 0; i < max; i++) {
      for (const arr of arrays) {
        if (arr[i]) result.push(arr[i]);
      }
    }
    return result;
  }
  function shuffle2(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function setScoreItemRelevance(fn) {
    scoreItemRelevance = fn;
  }
  function setGetDisplayResults(fn) {
    getDisplayResults = fn;
  }
  function set_updateSourcesActiveCounterImmediate(fn) {
    _updateSourcesActiveCounterImmediate = fn;
  }

  // src/fetchers.js
  async function expandKeywords(keyword) {
    if (!STATE.keywordExpansion) return [keyword];
    try {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 3e3);
      const [trg, ml] = await Promise.allSettled([
        fetch(`https://api.datamuse.com/words?rel_trg=${encodeURIComponent(keyword)}&max=${CONSTANTS.DATAMUSE_MAX}`, { signal: ac.signal }).then((r) => r.json()),
        fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(keyword)}&max=${CONSTANTS.DATAMUSE_MAX}`, { signal: ac.signal }).then((r) => r.json())
      ]);
      clearTimeout(timer);
      const words = [
        ...trg.status === "fulfilled" ? trg.value : [],
        ...ml.status === "fulfilled" ? ml.value : []
      ].map((w) => w.word);
      const seeds = SEED_MAP[keyword.toLowerCase()] || [];
      const translations = (MULTILINGUAL_ART_MAP[keyword.toLowerCase()] || []).slice(0, 3);
      const v2 = classifyQueryV2(keyword);
      const v2seeds = [...v2.movementSeeds || []].slice(0, 4);
      const movSyns = (MOVEMENT_SYNONYMS[keyword.toLowerCase()] || []).slice(0, 4);
      const specSyns = (SPECIES_SYNONYMS[keyword.toLowerCase()] || []).slice(0, 3);
      const periodSyns = (PERIOD_ALIASES[keyword.toLowerCase()] || []).slice(0, 3);
      return [.../* @__PURE__ */ new Set([keyword, ...seeds, ...v2seeds, ...translations, ...movSyns, ...specSyns, ...periodSyns, ...words])].slice(0, 20);
    } catch (err) {
      console.warn("expandKeywords failed:", err.message);
      return [keyword];
    }
  }
  function normalizeWikimedia(page) {
    const info = page.imageinfo?.[0];
    if (!info?.url) return null;
    const u = info.url.toLowerCase();
    if (u.endsWith(".svg") || u.endsWith(".gif")) return null;
    const meta = info.extmetadata || {};
    return {
      id: `wiki_${page.pageid}`,
      url: info.url,
      thumb: info.thumburl || info.url,
      title: (page.title || "").replace("File:", "").replace(/\.[^.]+$/, ""),
      description: stripHtml(meta.ImageDescription?.value || ""),
      source: "wikimedia",
      sourceUrl: info.descriptionurl || "",
      year: (meta.DateTimeOriginal?.value || "").slice(0, 4) || null,
      tags: [],
      colors: [],
      aiTags: []
    };
  }
  function normalizeMet(obj) {
    const img = obj.primaryImageSmall || obj.primaryImage;
    if (!img) return null;
    return {
      id: `met_${obj.objectID}`,
      url: img,
      thumb: img,
      title: obj.title || "Untitled",
      description: [obj.artistDisplayName, obj.medium, obj.culture].filter(Boolean).join(" \u2014 "),
      source: "met",
      sourceUrl: obj.objectURL || "",
      year: (obj.objectDate || "").match(/\d{4}/)?.[0] || null,
      tags: (obj.tags || []).map((t) => t.term.toLowerCase()),
      colors: [],
      aiTags: []
    };
  }
  function normalizeArchive(doc) {
    const thumb = `https://archive.org/services/img/${doc.identifier}`;
    const desc = Array.isArray(doc.description) ? doc.description.join(" ") : doc.description || "";
    const subjects = Array.isArray(doc.subject) ? doc.subject : doc.subject ? [doc.subject] : [];
    return {
      id: `archive_${doc.identifier}`,
      url: thumb,
      thumb,
      title: Array.isArray(doc.title) ? doc.title[0] : doc.title || "Untitled",
      description: desc,
      source: "archive",
      sourceUrl: `https://archive.org/details/${doc.identifier}`,
      year: (doc.date || "").slice(0, 4) || null,
      tags: subjects.map((s) => String(s).toLowerCase()),
      colors: [],
      aiTags: []
    };
  }
  async function fetchWikimedia(keyword, limit, signal) {
    try {
      const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(keyword)}&srnamespace=6&srlimit=${limit}&format=json&origin=*`;
      const res = await sourceFetch(searchUrl, { signal }, "wikimedia");
      if (res.status === 429) {
        await sleep(CONSTANTS.RETRY_DELAY);
        if (signal && signal.aborted) return [];
        return fetchWikimediaRetry(keyword, limit, signal);
      }
      const data = await res.json();
      const hits = (data.query?.search || []).filter((h) => {
        const t = h.title.toLowerCase();
        return !t.includes(".svg") && !t.includes("diagram") && !t.includes("map") && !t.includes("logo") && !t.includes("icon") && !t.includes("chart");
      });
      if (!hits.length) return [];
      const results = [];
      for (let i = 0; i < hits.length; i += 10) {
        if (signal?.aborted) break;
        const batch = hits.slice(i, i + 10);
        const titles = batch.map((h) => encodeURIComponent(h.title)).join("|");
        try {
          const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${titles}&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=600&format=json&origin=*`;
          const infoRes = await safeFetch(infoUrl, { signal });
          const infoData = await infoRes.json();
          for (const page of Object.values(infoData.query?.pages || {})) {
            const item = normalizeWikimedia(page);
            if (!item) continue;
            if (!item.url.match(/\.(jpe?g|png)(\?|$)/i)) continue;
            item.tags = extractTags(item);
            if (isLikelyReal(item)) results.push(item);
          }
        } catch (batchErr) {
          console.warn("Wikimedia batch failed:", batchErr.message);
        }
      }
      return results;
    } catch (err) {
      if (err.name === "AbortError") return [];
      console.warn("Wikimedia failed:", err.message);
      return [];
    }
  }
  async function fetchWikimediaRetry(keyword, limit, signal) {
    try {
      const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(keyword)}&srnamespace=6&srlimit=${limit}&format=json&origin=*`;
      const res = await safeFetch(searchUrl, { signal });
      const data = await res.json();
      const hits = data.query?.search || [];
      if (!hits.length) return [];
      const titles = hits.slice(0, 10).map((h) => encodeURIComponent(h.title)).join("|");
      const infoRes = await safeFetch(`https://commons.wikimedia.org/w/api.php?action=query&titles=${titles}&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=600&format=json&origin=*`, { signal });
      const infoData = await infoRes.json();
      return Object.values(infoData.query?.pages || {}).map(normalizeWikimedia).filter(Boolean).filter((item) => isLikelyReal(item)).map((item) => {
        item.tags = extractTags(item);
        return item;
      });
    } catch {
      return [];
    }
  }
  async function fetchWikimediaCategory(category, keyword, limit, signal) {
    try {
      const catPart = `incategory:${category}`;
      const srsearch = keyword ? `${encodeURIComponent(keyword)}+${catPart}` : catPart;
      const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${srsearch}&srnamespace=6&srlimit=${limit}&format=json&origin=*`;
      const res = await safeFetch(searchUrl, { signal });
      if (res.status === 429) return [];
      const data = await res.json();
      const hits = (data.query?.search || []).filter((h) => {
        const t = h.title.toLowerCase();
        return !t.includes(".svg") && !t.includes("logo") && !t.includes("icon") && !t.includes("chart");
      });
      if (!hits.length) return [];
      const results = [];
      for (let i = 0; i < hits.length; i += 10) {
        if (signal?.aborted) break;
        const batch = hits.slice(i, i + 10);
        const titles = batch.map((h) => encodeURIComponent(h.title)).join("|");
        try {
          const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${titles}&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=600&format=json&origin=*`;
          const infoRes = await safeFetch(infoUrl, { signal });
          const infoData = await infoRes.json();
          for (const page of Object.values(infoData.query?.pages || {})) {
            const item = normalizeWikimedia(page);
            if (!item) continue;
            if (!item.url.match(/\.(jpe?g|png)(\?|$)/i)) continue;
            item.tags = extractTags(item);
            if (isLikelyReal(item)) results.push(item);
          }
        } catch (batchErr) {
          console.warn("WMC category batch failed:", batchErr.message);
        }
      }
      return results;
    } catch (err) {
      if (err.name === "AbortError") return [];
      console.warn("Wikimedia category failed:", err.message);
      return [];
    }
  }
  async function fetchMet(keyword, limit, signal, offset = 0) {
    try {
      const searchUrl = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(keyword)}&hasImages=true&offset=${offset}`;
      const res = await sourceFetch(searchUrl, { signal }, "met");
      if (res.status === 429) {
        await sleep(CONSTANTS.RETRY_DELAY);
        if (signal && signal.aborted) return [];
      }
      const data = await res.json();
      const ids = (data.objectIDs || []).slice(0, limit);
      if (!ids.length) return [];
      const fetches = ids.slice(0, CONSTANTS.MET_DETAIL_LIMIT).map(
        (id) => fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`, { signal }).then((r) => r.json()).catch(() => null)
      );
      const objects = await Promise.all(fetches);
      return objects.filter(Boolean).map(normalizeMet).filter(Boolean).filter(isLikelyReal).map((item) => {
        item.tags = extractTags(item);
        return item;
      });
    } catch (err) {
      if (err.name === "AbortError") return [];
      console.warn("Met failed:", err.message);
      return [];
    }
  }
  async function fetchArchive(keyword, limit, signal) {
    try {
      const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(keyword)}+AND+mediatype:image&fl[]=identifier,title,description,date,subject&rows=${limit}&output=json`;
      const res = await sourceFetch(url, { signal }, "archive");
      const data = await res.json();
      const docs = data.response?.docs || [];
      return docs.map(normalizeArchive).filter(Boolean).filter(isLikelyReal).map((item) => {
        item.tags = extractTags(item);
        return item;
      });
    } catch (err) {
      if (err.name === "AbortError") return [];
      console.warn("Archive.org unavailable (CORS) \u2014 skipping source");
      return [];
    }
  }
  async function fetchNASA(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://images-api.nasa.gov/search?q=${encodeURIComponent(keyword)}&media_type=image&page_size=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("NASA fetch failed");
      const data = await res.json();
      const items = data.collection?.items || [];
      return items.filter((item) => item.links?.[0]?.href && item.data?.[0]).map((item) => {
        const meta = item.data[0];
        return {
          id: `nasa_${meta.nasa_id}`,
          url: item.links[0].href,
          thumb: item.links[0].href,
          title: meta.title || "NASA Image",
          description: meta.description || "",
          source: "nasa",
          sourceUrl: `https://images.nasa.gov/details/${meta.nasa_id}`,
          year: (meta.date_created || "").slice(0, 4) || null,
          tags: (meta.keywords || []).map((k) => k.toLowerCase()),
          colors: [],
          aiTags: []
        };
      }).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("NASA failed:", e.message);
      return [];
    }
  }
  async function fetchRijksmuseum(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://data.rijksmuseum.nl/search/collection?description=${encodeURIComponent(keyword)}&imageAvailable=true`,
        { signal }
      );
      if (!res.ok) throw new Error("Rijks failed");
      const data = await res.json();
      const items = data.orderedItems || [];
      const resolved = await Promise.allSettled(
        items.slice(0, limit).map(
          (item) => fetch(item.id, {
            signal,
            headers: { Accept: "application/json" }
          }).then((r) => r.json())
        )
      );
      return resolved.filter((r) => r.status === "fulfilled").map((r) => r.value).filter((obj) => obj.representation?.[0]?.id).map((obj) => ({
        id: `rijks_${obj.id?.split("/").pop()}`,
        url: obj.representation[0].id,
        thumb: obj.representation[0].id,
        title: obj._label || "Rijksmuseum Object",
        description: "",
        source: "rijksmuseum",
        sourceUrl: obj.id || "",
        year: null,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Rijksmuseum failed:", e.message);
      return [];
    }
  }
  async function fetchEuropeana(keyword, limit, signal, start = 1) {
    if (!STATE.europeanaKey) return [];
    try {
      const res = await safeFetch(
        `https://api.europeana.eu/record/v2/search.json?wskey=${STATE.europeanaKey}&query=${encodeURIComponent(keyword)}&media=true&rows=${limit}&profile=rich&start=${start}`,
        { signal }
      );
      if (!res.ok) throw new Error("Europeana fetch failed");
      const data = await res.json();
      return (data.items || []).filter((item) => item.edmIsShownBy?.[0] || item.edmPreview?.[0]).map((item) => ({
        id: `euro_${item.id.replace(/\//g, "_")}`,
        url: item.edmIsShownBy?.[0] || item.edmPreview?.[0],
        thumb: item.edmPreview?.[0] || item.edmIsShownBy?.[0],
        title: Array.isArray(item.title) ? item.title[0] : item.title || "Untitled",
        description: Array.isArray(item.dcDescription) ? item.dcDescription[0] : item.dcDescription || "",
        source: "europeana",
        sourceUrl: item.guid || "",
        year: (item.year?.[0] || "").toString().slice(0, 4) || null,
        tags: (item.dcSubject || []).map((s) => s.toLowerCase()),
        colors: [],
        aiTags: []
      })).map((item) => {
        item.tags = extractTags(item);
        return item;
      }).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Europeana failed:", e.message);
      return [];
    }
  }
  async function fetchEuropeanaFiltered(filterParam, filterValue, keyword, limit, signal, extraQf = "") {
    if (!STATE.europeanaKey) return [];
    try {
      let url = `https://api.europeana.eu/record/v2/search.json?wskey=${STATE.europeanaKey}&query=${encodeURIComponent(keyword)}&media=true&rows=${limit}&profile=rich&qf=${filterParam}:${encodeURIComponent(filterValue)}`;
      if (extraQf) url += `&qf=${encodeURIComponent(extraQf)}`;
      const res = await safeFetch(url, { signal });
      if (!res.ok) throw new Error("Europeana filtered fetch failed");
      const data = await res.json();
      return (data.items || []).filter((item) => item.edmIsShownBy?.[0] || item.edmPreview?.[0]).map((item) => ({
        id: `eurofilt_${filterParam}_${item.id.replace(/\//g, "_")}`,
        url: item.edmIsShownBy?.[0] || item.edmPreview?.[0],
        thumb: item.edmPreview?.[0] || item.edmIsShownBy?.[0],
        title: Array.isArray(item.title) ? item.title[0] : item.title || "Untitled",
        description: Array.isArray(item.dcDescription) ? item.dcDescription[0] : item.dcDescription || "",
        source: "europeana",
        sourceUrl: item.guid || "",
        year: (item.year?.[0] || "").toString().slice(0, 4) || null,
        tags: (item.dcSubject || []).map((s) => s.toLowerCase()),
        colors: [],
        aiTags: []
      })).map((item) => {
        item.tags = extractTags(item);
        return item;
      }).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Europeana filtered failed:", e.message);
      return [];
    }
  }
  async function fetchHarvard(keyword, limit, signal) {
    if (!STATE.harvardKey) return [];
    try {
      const res = await safeFetch(
        `https://api.harvardartmuseums.org/object?apikey=${STATE.harvardKey}&keyword=${encodeURIComponent(keyword)}&hasimage=1&size=${limit}&fields=objectid,title,description,dated,primaryimageurl,url,people,medium`,
        { signal }
      );
      if (!res.ok) throw new Error("Harvard fetch failed");
      const data = await res.json();
      return (data.records || []).filter((obj) => obj.primaryimageurl).map((obj) => ({
        id: `harvard_${obj.objectid}`,
        url: obj.primaryimageurl,
        thumb: obj.primaryimageurl,
        title: obj.title || "Untitled",
        description: [obj.people?.[0]?.name, obj.medium, obj.dated].filter(Boolean).join(" \u2014 "),
        source: "harvard",
        sourceUrl: obj.url || "",
        year: (obj.dated || "").match(/\d{4}/)?.[0] || null,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Harvard failed:", e.message);
      return [];
    }
  }
  async function fetchSmithsonian(keyword, limit, signal) {
    try {
      const key = STATE.smithsonianKey || "DEMO_KEY";
      const res = await safeFetch(
        `https://api.si.edu/openaccess/api/v1.0/search?q=${encodeURIComponent(keyword)}&api_key=${key}&rows=${limit}&online_media_type=Images`,
        { signal }
      );
      if (!res.ok) throw new Error("Smithsonian fetch failed");
      const data = await res.json();
      const rows = data.response?.rows || [];
      return rows.filter((row) => row.indexedStructured?.online_media?.[0]).map((row) => {
        const media = row.indexedStructured.online_media[0];
        return {
          id: `si_${row.id}`,
          url: media.thumbnail || media.content,
          thumb: media.thumbnail || media.content,
          title: row.title || "Untitled",
          description: row.content?.indexedStructured?.object_type?.[0] || "",
          source: "smithsonian",
          sourceUrl: `https://www.si.edu/object/${row.id}`,
          year: (row.content?.indexedStructured?.date?.[0] || "").slice(0, 4) || null,
          tags: (row.content?.indexedStructured?.topic || []).map((t) => t.toLowerCase()),
          colors: [],
          aiTags: []
        };
      }).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Smithsonian failed:", e.message);
      return [];
    }
  }
  async function fetchSmithsonianUnit(unitCode, keyword, limit, signal) {
    try {
      const key = STATE.smithsonianKey || "DEMO_KEY";
      const res = await safeFetch(
        `https://api.si.edu/openaccess/api/v1.0/search?q=${encodeURIComponent(keyword)}&api_key=${key}&rows=${limit}&online_media_type=Images&unit_code=${unitCode}`,
        { signal }
      );
      if (!res.ok) throw new Error("Smithsonian unit fetch failed");
      const data = await res.json();
      const rows = data.response?.rows || [];
      return rows.filter((row) => row.indexedStructured?.online_media?.[0]).map((row) => {
        const media = row.indexedStructured.online_media[0];
        return {
          id: `si_${unitCode.toLowerCase()}_${row.id}`,
          url: media.thumbnail || media.content,
          thumb: media.thumbnail || media.content,
          title: row.title || "Untitled",
          description: row.content?.indexedStructured?.object_type?.[0] || "",
          source: "smithsonian",
          sourceUrl: `https://www.si.edu/object/${row.id}`,
          year: (row.content?.indexedStructured?.date?.[0] || "").slice(0, 4) || null,
          tags: (row.content?.indexedStructured?.topic || []).map((t) => t.toLowerCase()),
          colors: [],
          aiTags: []
        };
      }).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Smithsonian unit fetch failed:", e.message);
      return [];
    }
  }
  async function fetchPexels(keyword, limit, signal) {
    if (!STATE.pexelsKey) return [];
    try {
      const res = await safeFetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=${limit}`,
        {
          signal,
          headers: { Authorization: STATE.pexelsKey }
        }
      );
      if (!res.ok) throw new Error("Pexels fetch failed");
      const data = await res.json();
      return (data.photos || []).map((photo) => ({
        id: `pexels_${photo.id}`,
        url: photo.src.large,
        thumb: photo.src.medium,
        title: photo.alt || "Pexels Photo",
        description: `Photo by ${photo.photographer}`,
        source: "pexels",
        sourceUrl: photo.url,
        year: null,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Pexels failed:", e.message);
      return [];
    }
  }
  async function fetchINaturalist(keyword, limit, signal) {
    try {
      const res = await sourceFetch(
        `https://api.inaturalist.org/v1/observations?q=${encodeURIComponent(keyword)}&photos=true&per_page=${limit}&order=votes&license=cc-by,cc-by-nc,cc0`,
        { signal },
        "inaturalist"
      );
      if (!res.ok) throw new Error("iNaturalist fetch failed");
      const data = await res.json();
      return (data.results || []).filter((obs) => obs.photos && obs.photos.length).map((obs) => {
        const rawUrl = obs.photos[0].url || "";
        const thumb = rawUrl.replace("/square.", "/medium.");
        const fullUrl = rawUrl.replace("/square.", "/large.");
        const title = obs.taxon && (obs.taxon.preferred_common_name || obs.taxon.name) || obs.species_guess || "Observation";
        return {
          id: `inaturalist_${obs.id}`,
          url: fullUrl,
          thumb,
          title,
          description: obs.description || obs.place_guess || "",
          source: "inaturalist",
          sourceUrl: `https://www.inaturalist.org/observations/${obs.id}`,
          year: obs.observed_on ? obs.observed_on.slice(0, 4) : null,
          tags: [title, obs.place_guess].filter(Boolean),
          colors: [],
          aiTags: []
        };
      }).filter((item) => item.url).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("iNaturalist failed:", e.message);
      return [];
    }
  }
  async function fetchLOC(keyword, limit, signal, sp = 1) {
    try {
      const res = await sourceFetch(
        `https://www.loc.gov/search/?q=${encodeURIComponent(keyword)}&fo=json&fa=online-format:image&c=${limit}&sp=${sp}`,
        { signal },
        "loc"
      );
      if (!res.ok) throw new Error("LOC fetch failed");
      const data = await res.json();
      return (data.results || []).filter((item) => item.image_url).map((item) => {
        const img = Array.isArray(item.image_url) ? Array.isArray(item.image_url[0]) ? item.image_url[0][0] : item.image_url[0] : item.image_url;
        const title = Array.isArray(item.title) ? item.title[0] : item.title || "LOC Image";
        const desc = Array.isArray(item.description) ? item.description[0] : item.description || "";
        return {
          id: `loc_${encodeURIComponent(item.id || title)}`,
          url: img,
          thumb: img,
          title,
          description: desc,
          source: "loc",
          sourceUrl: item.id || "",
          year: item.date ? String(item.date).slice(0, 4) : null,
          tags: (item.subject || []).map((t) => t.toLowerCase()),
          colors: [],
          aiTags: []
        };
      }).filter((item) => item.url).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("LOC failed:", e.message);
      return [];
    }
  }
  async function fetchOpenLibrary(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(keyword)}&fields=cover_i,title,author_name,subject,first_publish_year&limit=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("OpenLibrary fetch failed");
      const data = await res.json();
      return (data.docs || []).filter((doc) => doc.cover_i).map((doc) => ({
        id: `openlibrary_${doc.cover_i}`,
        url: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
        thumb: `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`,
        title: doc.title || "Book Cover",
        description: (doc.author_name || [])[0] || "",
        source: "openlibrary",
        sourceUrl: `https://openlibrary.org/search?q=${encodeURIComponent(doc.title || "")}`,
        year: doc.first_publish_year ? String(doc.first_publish_year) : null,
        tags: (doc.subject || []).slice(0, 5).map((t) => t.toLowerCase()),
        colors: [],
        aiTags: []
      })).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("OpenLibrary failed:", e.message);
      return [];
    }
  }
  async function fetchChicagoArt(keyword, limit, signal, page = 1) {
    try {
      const res = await sourceFetch(
        `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(keyword)}&limit=${limit}&fields=id,title,image_id,artist_display,date_display,medium_display,subject_titles&page=${page}`,
        { signal },
        "chicago"
      );
      if (!res.ok) throw new Error("AIC failed");
      const data = await res.json();
      const iiif = data.config?.iiif_url || "https://www.artic.edu/iiif/2";
      return (data.data || []).filter((obj) => obj.image_id).map((obj) => ({
        id: `aic_${obj.id}`,
        url: `${iiif}/${obj.image_id}/full/843,/0/default.jpg`,
        thumb: `${iiif}/${obj.image_id}/full/400,/0/default.jpg`,
        title: obj.title || "Untitled",
        description: [obj.artist_display, obj.medium_display, obj.date_display].filter(Boolean).join(" \u2014 "),
        source: "chicago",
        sourceUrl: `https://www.artic.edu/artworks/${obj.id}`,
        year: (obj.date_display || "").match(/\d{4}/)?.[0] || null,
        tags: (obj.subject_titles || []).map((t) => t.toLowerCase()),
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("AIC failed:", e.message);
      return [];
    }
  }
  async function fetchCleveland(keyword, limit, signal) {
    try {
      const res = await sourceFetch(
        `https://openaccess-api.clevelandart.org/api/artworks/?q=${encodeURIComponent(keyword)}&has_image=1&limit=${limit}&skip=0`,
        { signal },
        "cleveland"
      );
      if (!res.ok) throw new Error("Cleveland failed");
      const data = await res.json();
      return (data.data || []).filter((obj) => obj.images?.web?.url).map((obj) => ({
        id: `cle_${obj.id}`,
        url: obj.images.web.url,
        thumb: obj.images.web.url,
        title: obj.title || "Untitled",
        description: [obj.creators?.[0]?.description, obj.technique, obj.creation_date].filter(Boolean).join(" \u2014 "),
        source: "cleveland",
        sourceUrl: obj.url || `https://www.clevelandart.org/art/${obj.id}`,
        year: (obj.creation_date || "").match(/\d{4}/)?.[0] || null,
        tags: (obj.tags || []).map((t) => t.toLowerCase()),
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Cleveland failed:", e.message);
      return [];
    }
  }
  async function fetchVA(keyword, limit, signal) {
    try {
      const res = await sourceFetch(
        `https://api.vam.ac.uk/v2/objects/search?q=${encodeURIComponent(keyword)}&images_exist=1&page_size=${limit}`,
        { signal },
        "va"
      );
      if (!res.ok) throw new Error("V&A failed");
      const data = await res.json();
      return (data.records || []).filter((obj) => obj._primaryImageId).map((obj) => ({
        id: `va_${obj.systemNumber}`,
        url: `https://framemark.vam.ac.uk/collections/${obj._primaryImageId}/full/735,/0/default.jpg`,
        thumb: `https://framemark.vam.ac.uk/collections/${obj._primaryImageId}/full/400,/0/default.jpg`,
        title: obj._primaryTitle || "Untitled",
        description: [obj._primaryMaker?.name, obj._primaryDate].filter(Boolean).join(" \u2014 "),
        source: "va",
        sourceUrl: `https://collections.vam.ac.uk/item/${obj.systemNumber}`,
        year: (obj._primaryDate || "").match(/\d{4}/)?.[0] || null,
        tags: obj._currentLocation?.displayName ? [obj._currentLocation.displayName.toLowerCase()] : [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("V&A failed:", e.message);
      return [];
    }
  }
  async function fetchFlickrCommons(keyword, limit, signal) {
    if (!STATE.flickrKey) return [];
    try {
      const res = await safeFetch(
        `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${STATE.flickrKey}&text=${encodeURIComponent(keyword)}&license=7,8,9,10&content_type=1&media=photos&format=json&nojsoncallback=1&per_page=${limit}&sort=relevance`,
        { signal }
      );
      if (!res.ok) throw new Error("Flickr failed");
      const data = await res.json();
      return (data.photos?.photo || []).map((p) => ({
        id: `flickr_${p.id}`,
        url: `https://live.staticflickr.com/${p.server}/${p.id}_${p.secret}_b.jpg`,
        thumb: `https://live.staticflickr.com/${p.server}/${p.id}_${p.secret}_m.jpg`,
        title: p.title || "Flickr Photo",
        description: "",
        source: "flickr",
        sourceUrl: `https://www.flickr.com/photos/${p.owner}/${p.id}`,
        year: null,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Flickr failed:", e.message);
      return [];
    }
  }
  async function fetchPixabay(keyword, limit, signal) {
    if (!STATE.pixabayKey) return [];
    const pbKey = "pixabay_" + keyword;
    const pbCached = cacheGet(pbKey);
    if (pbCached) return pbCached.results.slice(0, limit);
    try {
      const res = await safeFetch(
        `https://pixabay.com/api/?key=${STATE.pixabayKey}&q=${encodeURIComponent(keyword)}&image_type=photo&per_page=${limit}&safesearch=true`,
        { signal }
      );
      if (!res.ok) throw new Error("Pixabay failed");
      const data = await res.json();
      const results = (data.hits || []).map((img) => ({
        id: `pixabay_${img.id}`,
        url: img.largeImageURL,
        thumb: img.webformatURL,
        title: img.tags || "Pixabay Image",
        description: `by ${img.user}`,
        source: "pixabay",
        sourceUrl: img.pageURL,
        year: null,
        tags: (img.tags || "").split(",").map((t) => t.trim().toLowerCase()),
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
      cacheSet(pbKey, results, [keyword]);
      return results;
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Pixabay failed:", e.message);
      return [];
    }
  }
  async function fetchWikiArt(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://www.wikiart.org/en/search/${encodeURIComponent(keyword)}/1?json=2&layout=new`,
        { signal }
      );
      if (!res.ok) throw new Error("WikiArt failed");
      const data = await res.json();
      const paintings = data.Paintings || [];
      return paintings.filter((p) => p.image).map((p) => ({
        id: `wikiart_${p.id}`,
        url: p.image,
        thumb: p.image,
        title: p.title || "Untitled",
        description: [p.artistName, p.completitionYear].filter(Boolean).join(" \u2014 "),
        source: "wikiart",
        sourceUrl: p.artistUrl ? `https://www.wikiart.org${p.artistUrl}` : "https://www.wikiart.org",
        year: p.completitionYear?.toString() || null,
        tags: [p.style, p.genre, p.period].filter(Boolean).map((t) => t.toLowerCase()),
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("WikiArt failed:", e.message);
      return [];
    }
  }
  async function fetchNordicMuseum(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://api.nordiskamuseet.se/v1/objects?search=${encodeURIComponent(keyword)}&mediaLicense=*&page_size=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("Nordic failed");
      const data = await res.json();
      return (data.objects || data.items || []).filter((obj) => obj.imageUrl || obj.image_url || obj.media?.[0]?.uri).map((obj) => {
        const img = obj.imageUrl || obj.image_url || obj.media?.[0]?.uri;
        return {
          id: `nordic_${obj.id}`,
          url: img,
          thumb: img,
          title: obj.title || obj.name || "Nordic Object",
          description: obj.description || obj.material || "",
          source: "nordic",
          sourceUrl: obj.url || `https://www.nordiskamuseet.se/en/objects/${obj.id}`,
          year: (obj.date || obj.year || "").toString().slice(0, 4) || null,
          tags: (obj.tags || obj.keywords || []).map((t) => t.toLowerCase()),
          colors: [],
          aiTags: []
        };
      }).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Nordic Museum failed:", e.message);
      return [];
    }
  }
  async function fetchGetty(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://data.getty.edu/museum/collection/object?q=${encodeURIComponent(keyword)}&limit=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("Getty failed");
      const data = await res.json();
      return (data.items || []).map((item) => {
        const imgUrl = item.subject_of?.[0]?.digitally_shown_by?.[0]?.access_point?.[0]?.id;
        if (!imgUrl) return null;
        return {
          id: `getty_${(item.id || "").split("/").pop()}`,
          url: imgUrl,
          thumb: imgUrl,
          title: item.label?.en?.[0] || "Getty Object",
          description: item.produced_by?.carried_out_by?.[0]?.label?.en?.[0] || "",
          source: "getty",
          sourceUrl: item.id || "",
          year: item.timespan?.begin_of_the_begin?.slice(0, 4) || null,
          tags: [],
          colors: [],
          aiTags: []
        };
      }).filter(Boolean).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Getty failed:", e.message);
      return [];
    }
  }
  async function fetchNGA(keyword, limit, signal) {
    try {
      const res = await sourceFetch(
        `https://api.nga.gov/art/tms/objects?q=${encodeURIComponent(keyword)}&hasimages=1&limit=${limit}&offset=0`,
        { signal },
        "nga"
      );
      if (!res.ok) throw new Error("NGA failed");
      const data = await res.json();
      return (data.items || []).filter((item) => item.iiifThumbUrl).map((item) => ({
        id: `nga_${item.objectId}`,
        url: (item.iiifThumbUrl || "").replace("/thumb/", "/full/"),
        thumb: item.iiifThumbUrl,
        title: item.title || "NGA Object",
        description: item.people?.[0]?.displayName || "",
        source: "nga",
        sourceUrl: item.url || "",
        year: (item.displayDate || "").match(/\d{4}/)?.[0] || null,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("NGA failed:", e.message);
      return [];
    }
  }
  async function fetchGBIF(keyword, limit, signal, offset = 0) {
    try {
      const res = await sourceFetch(
        `https://api.gbif.org/v1/occurrence/search?q=${encodeURIComponent(keyword)}&mediaType=StillImage&limit=${limit}&offset=${offset}`,
        { signal },
        "gbif"
      );
      if (!res.ok) throw new Error("GBIF failed");
      const data = await res.json();
      return (data.results || []).filter((item) => item.media?.[0]?.identifier).map((item) => ({
        id: `gbif_${item.key}`,
        url: item.media[0].identifier,
        thumb: item.media[0].identifier,
        title: item.species || item.verbatimScientificName || "Species",
        description: item.country || "",
        source: "gbif",
        sourceUrl: `https://www.gbif.org/occurrence/${item.gbifID || item.key}`,
        year: (item.eventDate || "").slice(0, 4) || null,
        tags: [item.species, item.country].filter(Boolean).map((t) => t.toLowerCase()),
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("GBIF failed:", e.message);
      return [];
    }
  }
  async function fetchEOL(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://eol.org/api/search/1.0.json?q=${encodeURIComponent(keyword)}&page=1`,
        { signal }
      );
      if (!res.ok) throw new Error("EOL search failed");
      const data = await res.json();
      const results = (data.results || []).slice(0, Math.min(5, limit));
      if (!results.length) return [];
      const pages = await Promise.allSettled(
        results.map(
          (r) => fetch(`https://eol.org/api/pages/1.0/${r.id}.json?images_per_page=1&details=true`, { signal }).then((r2) => r2.json())
        )
      );
      return pages.filter((p) => p.status === "fulfilled").map((p, i) => {
        const media = p.value?.taxonConcept?.dataObjects?.[0];
        if (!media?.eolMediaURL) return null;
        return {
          id: `eol_${results[i].id}`,
          url: media.eolMediaURL,
          thumb: media.eolMediaURL,
          title: results[i].title || "EOL Species",
          description: "",
          source: "eol",
          sourceUrl: `https://eol.org/pages/${results[i].id}`,
          year: null,
          tags: [],
          colors: [],
          aiTags: []
        };
      }).filter(Boolean).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("EOL failed:", e.message);
      return [];
    }
  }
  async function fetchAPOD(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&count=${limit}&thumbs=true`,
        { signal }
      );
      if (!res.ok) throw new Error("APOD failed");
      const data = await res.json();
      return (Array.isArray(data) ? data : []).filter((item) => item.media_type === "image").map((item) => ({
        id: `apod_${(item.date || "").replace(/-/g, "")}`,
        url: item.hdurl || item.url,
        thumb: item.url,
        title: item.title || "NASA APOD",
        description: item.explanation?.slice(0, 120) || "",
        source: "apod",
        sourceUrl: `https://apod.nasa.gov/apod/ap${(item.date || "").replace(/-/g, "").slice(2)}.html`,
        year: (item.date || "").slice(0, 4) || null,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("APOD failed:", e.message);
      return [];
    }
  }
  async function fetchGallica(keyword, limit, signal) {
    try {
      const query = `dc.type+all+"image"+and+${encodeURIComponent(keyword)}`;
      const res = await safeFetch(
        `https://gallica.bnf.fr/SRU?operation=searchRetrieve&version=1.2&query=${query}&maximumRecords=${limit}&startRecord=1&format=json`,
        { signal }
      );
      if (!res.ok) throw new Error("Gallica failed");
      const data = await res.json();
      const records = data.records?.record || [];
      return records.map((rec) => {
        const d = rec.recordData;
        const identifier = d?.["dc:identifier"]?.[0] || "";
        if (!identifier) return null;
        return {
          id: `gallica_${identifier.split("/").pop()}`,
          url: identifier + ".thumbnail",
          thumb: identifier + ".thumbnail",
          title: d?.["dc:title"]?.[0] || "Gallica Item",
          description: d?.["dc:description"]?.[0] || "",
          source: "gallica",
          sourceUrl: identifier,
          year: d?.["dc:date"]?.[0]?.slice(0, 4) || null,
          tags: (d?.["dc:subject"] || []).map((t) => t.toLowerCase()),
          colors: [],
          aiTags: []
        };
      }).filter(Boolean).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Gallica failed:", e.message);
      return [];
    }
  }
  async function fetchChroniclingAmerica(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://chroniclingamerica.loc.gov/search/pages/results/?andtext=${encodeURIComponent(keyword)}&format=json&rows=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("ChronAm failed");
      const data = await res.json();
      return (data.items || []).filter((item) => item.id).map((item) => ({
        id: `chron_${item.id.replace(/\//g, "_")}`,
        url: `https://chroniclingamerica.loc.gov${item.id}image_1/service:image/full/pct:50/0/default.jpg`,
        thumb: `https://chroniclingamerica.loc.gov${item.id}image_1/service:image/full/pct:25/0/default.jpg`,
        title: `${item.title || "Newspaper"} \u2014 ${(item.date || "").slice(0, 4)}`,
        description: item.ocr_eng?.slice(0, 100) || "",
        source: "chronicling",
        sourceUrl: `https://chroniclingamerica.loc.gov${item.id}`,
        year: (item.date || "").slice(0, 4) || null,
        tags: (item.subject || []).map((s) => s.toLowerCase()),
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("ChronAm failed:", e.message);
      return [];
    }
  }
  async function fetchOpenverse(keyword, limit, signal, page = 1) {
    try {
      const res = await safeFetch(
        `https://api.openverse.org/v1/images/?q=${encodeURIComponent(keyword)}&license_type=commercial&page_size=${limit}&page=${page}`,
        { signal }
      );
      if (!res.ok) throw new Error("Openverse failed");
      const data = await res.json();
      const GROUP_TITLE_RE = /^group\s+of\s+(images?|files?|photos?|pictures?)/i;
      return (data.results || []).filter((item) => item.url && !GROUP_TITLE_RE.test((item.title || "").trim())).map((item) => ({
        id: `openverse_${item.id}`,
        url: item.url,
        thumb: item.thumbnail || item.url,
        title: item.title || "Openverse Image",
        description: item.creator ? `by ${item.creator}` : "",
        source: "openverse",
        sourceUrl: item.foreign_landing_url || item.url,
        year: null,
        tags: (item.tags || []).map((t) => t.name?.toLowerCase()).filter(Boolean),
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Openverse failed:", e.message);
      return [];
    }
  }
  async function fetchTrove(keyword, limit, signal) {
    if (!STATE.troveKey) return [];
    try {
      const res = await safeFetch(
        `https://api.trove.nla.gov.au/v3/result?q=${encodeURIComponent(keyword)}&category=picture&encoding=json&n=${limit}&key=${STATE.troveKey}`,
        { signal }
      );
      if (!res.ok) throw new Error("Trove failed");
      const data = await res.json();
      const works = data.response?.zone?.[0]?.records?.work || [];
      return works.map((item) => {
        const thumb = item.identifier?.find((i) => i.linktype === "thumbnail")?.value || "";
        if (!thumb) return null;
        return {
          id: `trove_${item.id}`,
          url: thumb,
          thumb,
          title: item.title || "Trove Item",
          description: item.contributor?.[0] || "",
          source: "trove",
          sourceUrl: item.troveUrl || "",
          year: (item.issued || "").slice(0, 4) || null,
          tags: [],
          colors: [],
          aiTags: []
        };
      }).filter(Boolean).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Trove failed:", e.message);
      return [];
    }
  }
  async function fetchDigitalNZ(keyword, limit, signal) {
    if (!STATE.digitalnzKey) return [];
    try {
      const res = await safeFetch(
        `https://api.digitalnz.org/records.json?text=${encodeURIComponent(keyword)}&and[category][]=Images&per_page=${limit}&api_key=${STATE.digitalnzKey}`,
        { signal }
      );
      if (!res.ok) throw new Error("DigitalNZ failed");
      const data = await res.json();
      return (data.search?.results || []).filter((item) => item.thumbnail_url).map((item) => ({
        id: `dnz_${item.id}`,
        url: item.thumbnail_url,
        thumb: item.thumbnail_url,
        title: item.title || "DigitalNZ Item",
        description: item.description || "",
        source: "digitalnz",
        sourceUrl: item.landing_url || "",
        year: item.date?.[0]?.slice(0, 4) || null,
        tags: (item.subject || []).map((s) => s.toLowerCase()),
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("DigitalNZ failed:", e.message);
      return [];
    }
  }
  async function fetchBHL(keyword, limit, signal) {
    try {
      const BHL_KEY = "00000000-0000-0000-0000-000000000000";
      const res = await safeFetch(
        `https://www.biodiversitylibrary.org/api3?op=GetTitleSearchSimple&title=${encodeURIComponent(keyword)}&apikey=${BHL_KEY}&format=json`,
        { signal }
      );
      if (!res.ok) throw new Error("BHL failed");
      const data = await res.json();
      const titles = (data.Result || []).slice(0, 3);
      if (!titles.length) return [];
      const itemID = titles[0].Items?.[0]?.ItemID;
      if (!itemID) return [];
      const res2 = await safeFetch(
        `https://www.biodiversitylibrary.org/api3?op=GetItemMetadata&id=${itemID}&pages=true&ocr=false&parts=false&apikey=${BHL_KEY}&format=json`,
        { signal }
      );
      if (!res2.ok) throw new Error("BHL pages failed");
      const data2 = await res2.json();
      const titleFull = data2.Result?.[0]?.FullTitle || "BHL Title";
      const pages = (data2.Result?.[0]?.Pages || []).filter((p) => p.PageID).slice(0, limit);
      return pages.map((page) => ({
        id: `bhl_${page.PageID}`,
        url: `https://www.biodiversitylibrary.org/pagethumb/${page.PageID}/500/500`,
        thumb: `https://www.biodiversitylibrary.org/pagethumb/${page.PageID}/200/200`,
        title: `${titleFull} p.${page.PageNumber || "?"}`,
        description: "",
        source: "bhl",
        sourceUrl: `https://www.biodiversitylibrary.org/page/${page.PageID}`,
        year: null,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("BHL failed:", e.message);
      return [];
    }
  }
  async function fetchCarnegie(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://api.collection.carnegieart.org/artworks?search[search]=${encodeURIComponent(keyword)}&per_page=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("Carnegie failed");
      const data = await res.json();
      return (data.data || []).filter((item) => item.image_url).map((item) => ({
        id: `cmoa_${String(item.id || "").replace(/[^a-z0-9]/gi, "_")}`,
        url: item.image_url,
        thumb: item.image_url,
        title: item.title || "CMOA Object",
        description: item.artist || "",
        source: "carnegie",
        sourceUrl: `https://collection.carnegieart.org/objects/${encodeURIComponent(item.id || "")}`,
        year: (item.date || "").match(/\d{4}/)?.[0] || null,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Carnegie failed:", e.message);
      return [];
    }
  }
  async function fetchPrado(keyword, limit, signal) {
    const cached = await fetchFromDataCache("prado", keyword);
    if (cached) return cached;
    try {
      const res = await safeFetch(
        `https://www.museodelprado.es/api/v1/artwork?language=en&keyword=${encodeURIComponent(keyword)}&limit=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("Prado failed");
      const data = await res.json();
      return (data.items || data.artworks || []).filter((item) => item.image?.large || item.image?.medium || item.image?.small).map((item) => ({
        id: `prado_${item.id}`,
        url: item.image?.large || item.image?.medium || item.image?.small,
        thumb: item.image?.small || item.image?.medium || item.image?.large,
        title: item.title || "Prado Work",
        description: item.artist?.name || "",
        source: "prado",
        sourceUrl: `https://www.museodelprado.es/en/the-collection/art-work/${item.slug || item.id}`,
        year: (item.date || "").match(/\d{4}/)?.[0] || null,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      return [];
    }
  }
  async function fetchParisMusees(keyword, limit, signal) {
    const cached = await fetchFromDataCache("parismusees", keyword);
    if (cached) return cached;
    try {
      const safeKw = keyword.replace(/["\\\n\r]/g, "");
      const body = JSON.stringify({
        query: `{ nodeQuery(filter: {conditions: [{field: "title", value: "${safeKw}", operator: LIKE}]}, limit: ${parseInt(limit, 10)}) { entities { ... on NodeOeuvre { title field_auteur field_datation field_visuels { entity { thumbnail { url } } } } } } }`
      });
      const res = await safeFetch("https://apicollections.parismusees.paris.fr/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal
      });
      if (!res.ok) throw new Error("ParisMusees failed");
      const data = await res.json();
      const entities = data.data?.nodeQuery?.entities || [];
      return entities.map((entity, i) => {
        const imgUrl = entity.field_visuels?.[0]?.entity?.thumbnail?.url;
        if (!imgUrl) return null;
        return {
          id: `paris_${i}_${Date.now()}`,
          url: imgUrl,
          thumb: imgUrl,
          title: entity.title || "Paris Mus\xE9es Item",
          description: entity.field_auteur || "",
          source: "parismusees",
          sourceUrl: "https://www.parismusees.paris.fr",
          year: (entity.field_datation || "").match(/\d{4}/)?.[0] || null,
          tags: [],
          colors: [],
          aiTags: []
        };
      }).filter(Boolean).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      return [];
    }
  }
  async function fetchYale(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://collections.britishart.yale.edu/api/search?q=${encodeURIComponent(keyword)}&limit=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("Yale failed");
      const data = await res.json();
      return (data.docs || data.items || []).filter((item) => item.id).map((item) => {
        const iiifId = String(item.id).replace("obj:", "");
        return {
          id: `yale_${iiifId}`,
          url: `https://images.britishart.yale.edu/iiif/2/${iiifId}/full/!800,800/0/default.jpg`,
          thumb: `https://images.britishart.yale.edu/iiif/2/${iiifId}/full/!400,400/0/default.jpg`,
          title: item.title || "Yale YCBA Work",
          description: item.artist || "",
          source: "yale",
          sourceUrl: `https://collections.britishart.yale.edu/catalog/${item.id}`,
          year: (item.date || "").match(/\d{4}/)?.[0] || null,
          tags: [],
          colors: [],
          aiTags: []
        };
      }).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Yale failed:", e.message);
      return [];
    }
  }
  async function fetchPicsum(keyword, limit, signal) {
    const textureTerms = ["texture", "abstract", "minimal", "surface", "light", "pattern", "grain", "void", "blur"];
    if (!textureTerms.some((t) => keyword.toLowerCase().includes(t))) return [];
    try {
      const randomPage = Math.floor(Math.random() * 30) + 1;
      const res = await safeFetch(
        `https://picsum.photos/v2/list?page=${randomPage}&limit=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("Picsum failed");
      const data = await res.json();
      return (Array.isArray(data) ? data : []).map((item) => ({
        id: `picsum_${item.id}`,
        url: `https://picsum.photos/id/${item.id}/800/600`,
        thumb: `https://picsum.photos/id/${item.id}/400/300`,
        title: `Photo by ${item.author}`,
        description: "",
        source: "picsum",
        sourceUrl: item.url || "",
        year: null,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Picsum failed:", e.message);
      return [];
    }
  }
  async function fetchUSGS(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://www.sciencebase.gov/catalog/items?q=${encodeURIComponent(keyword)}&filter=tags%3Dimage&format=json&max=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("USGS failed");
      const data = await res.json();
      return (data.items || []).map((item) => {
        const imgUrl = item.webLinks?.find((l) => l.type === "thumbnail")?.uri || "";
        if (!imgUrl) return null;
        return {
          id: `usgs_${item.id}`,
          url: imgUrl,
          thumb: imgUrl,
          title: item.title || "USGS Item",
          description: item.summary?.slice(0, 100) || "",
          source: "usgs",
          sourceUrl: item.link?.url || "",
          year: item.dates?.[0]?.dateString?.slice(0, 4) || null,
          tags: [],
          colors: [],
          aiTags: []
        };
      }).filter(Boolean).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("USGS failed:", e.message);
      return [];
    }
  }
  async function fetchCooperHewitt(keyword, limit, signal) {
    try {
      const CH_TOKEN = "4d47366a4e7f1abe2bd9d882dc86e0b5";
      const res = await safeFetch(
        `https://collection.cooperhewitt.org/api/rest/?method=cooperhewitt.search.objects&query=${encodeURIComponent(keyword)}&has_images=1&per_page=${limit}&access_token=${CH_TOKEN}`,
        { signal }
      );
      if (!res.ok) throw new Error("CooperHewitt failed");
      const data = await res.json();
      return (data.objects || []).filter((item) => item.images?.[0]?.b?.url).map((item) => ({
        id: `ch_${item.id}`,
        url: item.images[0].b.url,
        thumb: item.images[0].z?.url || item.images[0].b.url,
        title: item.title || "Cooper Hewitt Object",
        description: item.medium || "",
        source: "cooperhewitt",
        sourceUrl: item.url || "",
        year: (item.date || "").match(/\d{4}/)?.[0] || null,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("CooperHewitt failed:", e.message);
      return [];
    }
  }
  async function fetchTate(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://www.tate.org.uk/api/v1/artworks?q=${encodeURIComponent(keyword)}&page=1&pageSize=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("Tate failed");
      const data = await res.json();
      return (data.items || []).filter((item) => item.thumbnail?.url).map((item) => ({
        id: "tate_" + item.id,
        url: item.thumbnail.url,
        thumb: item.thumbnail.url,
        title: item.title || "Tate Artwork",
        description: item.artist?.[0]?.name || "",
        source: "tate",
        sourceUrl: `https://www.tate.org.uk/art/artworks/${item.id}`,
        year: (item.dateText || "").match(/\d{4}/)?.[0] || null,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Tate failed:", e.message);
      return [];
    }
  }
  async function fetchFinna(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://api.finna.fi/api/v1/search?lookfor=${encodeURIComponent(keyword)}&type=AllFields&filter[]=format:0%2FImage%2F&limit=${limit}&field[]=id&field[]=title&field[]=summary&field[]=images&field[]=year`,
        { signal }
      );
      if (!res.ok) throw new Error("Finna failed");
      const data = await res.json();
      return (data.records || []).filter((item) => item.images?.[0]).map((item) => ({
        id: "finna_" + String(item.id).replace(/[^a-z0-9]/gi, "_"),
        url: "https://finna.fi" + item.images[0],
        thumb: "https://finna.fi" + item.images[0],
        title: Array.isArray(item.title) ? item.title[0] : item.title || "Finnish Heritage",
        description: item.summary?.[0] || "",
        source: "finna",
        sourceUrl: `https://www.finna.fi/Record/${encodeURIComponent(item.id)}`,
        year: item.year || null,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Finna failed:", e.message);
      return [];
    }
  }
  async function fetchSOCH(keyword, limit, signal) {
    const cached = await fetchFromDataCache("soch", keyword);
    if (cached) return cached;
    try {
      const res = await safeFetch(
        `https://www.kulturarvsdata.se/ksamsok/api?method=search&hitsPerPage=${limit}&startRecord=1&query=itemName%3D${encodeURIComponent(keyword)}&recordSchema=json`,
        { signal }
      );
      if (!res.ok) throw new Error("SOCH failed");
      const data = await res.json();
      const records = data.result?.records || [];
      return records.map((entry, i) => {
        const rec = entry.record || {};
        const thumb = rec.thumbnailSource?.[0];
        if (!thumb) return null;
        return {
          id: "soch_" + i,
          url: thumb,
          thumb,
          title: rec.itemName?.[0] || "Swedish Heritage Item",
          description: "",
          source: "soch",
          sourceUrl: rec.url?.[0] || "",
          year: null,
          tags: [],
          colors: [],
          aiTags: []
        };
      }).filter(Boolean).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      return [];
    }
  }
  async function fetchJoconde(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://data.culture.gouv.fr/api/explore/v2.1/catalog/datasets/base-joconde-extrait/records?where=search(title%2C%22${encodeURIComponent(keyword)}%22)&limit=${limit}&select=ref,title,auteur,datation,domaine,lien`,
        { signal },
        8e3
      );
      if (!res.ok) throw new Error("Joconde failed");
      const data = await res.json();
      return (data.results || []).filter((item) => item.ref).map((item) => ({
        id: "joconde_" + item.ref,
        url: `https://www.pop.culture.gouv.fr/medias/cible/${item.ref}.jpg`,
        thumb: `https://www.pop.culture.gouv.fr/medias/cible/${item.ref}.jpg`,
        title: item.title || "French Museum Object",
        description: item.auteur || "",
        source: "joconde",
        sourceUrl: item.lien || "",
        year: (item.datation || "").match(/\d{4}/)?.[0] || null,
        tags: [item.domaine].filter(Boolean).map((t) => t.toLowerCase()),
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Joconde failed:", e.message);
      return [];
    }
  }
  async function fetchMNW(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://api.mnw.art.pl/api/v1/objects?search=${encodeURIComponent(keyword)}&per_page=${limit}&has_image=true`,
        { signal }
      );
      if (!res.ok) throw new Error("MNW failed");
      const data = await res.json();
      return (data.data || []).filter((item) => item.image_url).map((item) => ({
        id: "mnw_" + item.id,
        url: item.image_url,
        thumb: item.image_url,
        title: item.title || "MNW Object",
        description: item.author || "",
        source: "mnw",
        sourceUrl: `https://cyfrowe.mnw.art.pl/pl/katalog/${item.id}`,
        year: (item.dating || "").match(/\d{4}/)?.[0] || null,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("MNW failed:", e.message);
      return [];
    }
  }
  async function fetchTePapa(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://collections.tepapa.govt.nz/search/${encodeURIComponent(keyword)}?filters=hasMedia:true&size=${limit}&from=0`,
        { signal }
      );
      if (!res.ok) throw new Error("Te Papa failed");
      const data = await res.json();
      return (data.results || []).filter((item) => item.media?.[0]?.previewUrl).map((item) => ({
        id: "tepapa_" + item.id,
        url: item.media[0].previewUrl,
        thumb: item.media[0].previewUrl,
        title: item.title || "Te Papa Object",
        description: item.primaryMaker?.title || "",
        source: "tepapa",
        sourceUrl: `https://collections.tepapa.govt.nz/object/${item.id}`,
        year: (item.productionDates?.[0]?.verbatim || "").match(/\d{4}/)?.[0] || null,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Te Papa failed:", e.message);
      return [];
    }
  }
  async function fetchDPLA(keyword, limit, signal) {
    if (!STATE.dplaKey) return [];
    try {
      const res = await safeFetch(
        `https://api.dp.la/v2/items?q=${encodeURIComponent(keyword)}&api_key=${encodeURIComponent(STATE.dplaKey)}&page_size=${limit}&fields=id,object,sourceResource`,
        { signal }
      );
      if (!res.ok) throw new Error("DPLA failed");
      const data = await res.json();
      return (data.docs || []).filter((item) => item.object).map((item) => ({
        id: "dpla_" + item.id,
        url: item.object,
        thumb: item.object,
        title: item.sourceResource?.title?.[0] || "DPLA Item",
        description: item.sourceResource?.contributor?.[0] || "",
        source: "dpla",
        sourceUrl: `https://dp.la/item/${item.id}`,
        year: (item.sourceResource?.date?.displayDate || "").slice(0, 4) || null,
        tags: (item.sourceResource?.subject || []).map((s) => s.name?.toLowerCase()).filter(Boolean),
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("DPLA failed:", e.message);
      return [];
    }
  }
  async function fetchDPLAProvider(provider, keyword, limit, signal) {
    if (!STATE.dplaKey) return [];
    try {
      const res = await safeFetch(
        `https://api.dp.la/v2/items?q=${encodeURIComponent(keyword)}&api_key=${encodeURIComponent(STATE.dplaKey)}&page_size=${limit}&fields=id,object,sourceResource&provider=${encodeURIComponent(provider)}`,
        { signal }
      );
      if (!res.ok) throw new Error("DPLA provider fetch failed");
      const data = await res.json();
      return (data.docs || []).filter((item) => item.object).map((item) => ({
        id: "dplap_" + item.id,
        url: item.object,
        thumb: item.object,
        title: item.sourceResource?.title?.[0] || "DPLA Item",
        description: item.sourceResource?.contributor?.[0] || "",
        source: "dpla",
        sourceUrl: `https://dp.la/item/${item.id}`,
        year: (item.sourceResource?.date?.displayDate || "").slice(0, 4) || null,
        tags: (item.sourceResource?.subject || []).map((s) => s.name?.toLowerCase()).filter(Boolean),
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("DPLA provider fetch failed:", e.message);
      return [];
    }
  }
  async function fetchDDB(keyword, limit, signal) {
    if (!STATE.ddbKey) return [];
    try {
      const url = `https://api.deutsche-digitale-bibliothek.de/search?query=${encodeURIComponent(keyword)}&rows=${limit}&type_fct=mediatype_002&oauth_consumer_key=${encodeURIComponent(STATE.ddbKey)}`;
      const res = await safeFetch(url, { signal });
      if (!res.ok) throw new Error("DDB failed");
      const data = await res.json();
      const docs = data.results?.[0]?.docs || data.results || [];
      return (Array.isArray(docs) ? docs : []).filter((item) => item.preview || item.thumbnail).map((item) => ({
        id: "ddb_" + item.id,
        url: item.preview?.image || item.preview?.thumbnail || item.thumbnail || item.preview || "",
        thumb: item.preview?.thumbnail || item.preview?.image || item.thumbnail || item.preview || "",
        title: item.title || item.label || "DDB Item",
        description: item.subtitle || "",
        source: "ddb",
        sourceUrl: `https://www.deutsche-digitale-bibliothek.de/item/${item.id}`,
        year: null,
        tags: [],
        colors: [],
        aiTags: []
      })).filter((i) => i.url).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("DDB failed:", e.message);
      return [];
    }
  }
  async function fetchArtsy(keyword, limit, signal) {
    if (!STATE.artsyId || !STATE.artsySecret) return [];
    try {
      if (!STATE.artsyToken) {
        const tokenRes = await safeFetch("https://api.artsy.net/api/tokens/xapp_token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: STATE.artsyId, client_secret: STATE.artsySecret }),
          signal
        });
        if (!tokenRes.ok) throw new Error("Artsy token failed");
        const tokenData = await tokenRes.json();
        STATE.artsyToken = tokenData.token;
      }
      const res = await safeFetch(
        `https://api.artsy.net/api/artworks?q=${encodeURIComponent(keyword)}&size=${limit}`,
        { headers: { "X-Xapp-Token": STATE.artsyToken }, signal }
      );
      if (!res.ok) throw new Error("Artsy search failed");
      const data = await res.json();
      return (data._embedded?.artworks || []).filter((item) => item._links?.thumbnail?.href).map((item) => ({
        id: "artsy_" + item.id,
        url: item._links.thumbnail.href,
        thumb: item._links.thumbnail.href,
        title: item.title || "Artsy Artwork",
        description: item.date || "",
        source: "artsy",
        sourceUrl: (item._links?.self?.href || "").replace("api.artsy.net/api", "www.artsy.net"),
        year: (item.date || "").match(/\d{4}/)?.[0] || null,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Artsy failed:", e.message);
      STATE.artsyToken = null;
      return [];
    }
  }
  async function fetchPAS(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://finds.org.uk/api/search.json?q=${encodeURIComponent(keyword)}&has_images=1&limit=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("PAS failed");
      const data = await res.json();
      return (data.hits || []).filter((item) => item.thumbnail).map((item) => ({
        id: "pas_" + item.id,
        url: item.thumbnail,
        thumb: item.thumbnail,
        title: item.title || "UK Find",
        description: (item.broadperiod ? item.broadperiod + " \u2014 " : "") + (item.description || "").slice(0, 80),
        source: "pas",
        sourceUrl: `https://finds.org.uk/database/artefacts/record/id/${item.id}`,
        year: (item.created || "").slice(0, 4) || null,
        tags: [item.broadperiod?.toLowerCase()].filter(Boolean),
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("PAS failed:", e.message);
      return [];
    }
  }
  async function fetchSMG(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://collection.sciencemuseumgroup.org.uk/search/objects?q=${encodeURIComponent(keyword)}&has_image=1&page[number]=1&page[size]=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("SMG failed");
      const data = await res.json();
      return (data.data || []).filter((item) => item.attributes?.images?.[0]?.processed?.medium?.location).map((item) => ({
        id: "smg_" + item.id,
        url: item.attributes.images[0].processed.medium.location,
        thumb: item.attributes.images[0].processed.medium.location,
        title: item.attributes?.summary_title || "Science Museum Object",
        description: item.attributes?.description?.[0]?.value?.slice(0, 100) || "",
        source: "smg",
        sourceUrl: item.links?.self || "",
        year: null,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("SMG failed:", e.message);
      return [];
    }
  }
  async function fetchAuckland(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://api.aucklandmuseum.com/id/media/v2/mediaartifact/?q=${encodeURIComponent(keyword)}&size=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("Auckland failed");
      const data = await res.json();
      return (data.hits?.hits || []).filter((item) => item._source?.media_id?.[0]).map((item) => {
        const src = item._source;
        const mediaId = src.media_id[0];
        const thumb = `https://api.aucklandmuseum.com/id/media/v2/mediaartifact/${mediaId}`;
        return {
          id: "auck_" + item._id.replace(/\//g, "_"),
          url: thumb,
          thumb,
          title: src.dc_title?.[0] || "Auckland Museum Object",
          description: src.dc_description?.[0]?.slice(0, 100) || "",
          source: "auckland",
          sourceUrl: `https://www.aucklandmuseum.com/collection/${item._id}`,
          year: (src.dc_date?.[0] || "").slice(0, 4) || null,
          tags: [],
          colors: [],
          aiTags: []
        };
      }).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Auckland failed:", e.message);
      return [];
    }
  }
  async function fetchPhotogrammar(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://photogrammar.org/api/search?query=${encodeURIComponent(keyword)}&limit=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("Photogrammar failed");
      const data = await res.json();
      return (data.photos || []).filter((item) => item.lc_id).map((item) => ({
        id: "fsa_" + item.lc_id,
        url: `https://tile.loc.gov/image-services/iiif/service:fsa:${item.lc_id}/full/pct:50/0/default.jpg`,
        thumb: `https://tile.loc.gov/image-services/iiif/service:fsa:${item.lc_id}/full/pct:25/0/default.jpg`,
        title: item.title || "FSA Photograph",
        description: [item.photographer, item.county, item.state].filter(Boolean).join(", "),
        source: "photogrammar",
        sourceUrl: `https://photogrammar.org/photos/${item.lc_id}`,
        year: item.year || null,
        tags: [item.photographer, item.state].filter(Boolean).map((t) => t.toLowerCase()),
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Photogrammar failed:", e.message);
      return [];
    }
  }
  async function fetchWellcome(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://api.wellcomecollection.org/catalogue/v2/works?query=${encodeURIComponent(keyword)}&workType=k&items.locations.locationType=iiif-image&pageSize=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("Wellcome failed");
      const data = await res.json();
      return (data.results || []).filter((item) => item.thumbnail?.url).map((item) => ({
        id: "wellcome_" + item.id,
        url: item.thumbnail.url + "/full/400,/0/default.jpg",
        thumb: item.thumbnail.url + "/full/400,/0/default.jpg",
        title: item.title || "Wellcome Item",
        description: item.contributors?.[0]?.agent?.label || "",
        source: "wellcome",
        sourceUrl: `https://wellcomecollection.org/works/${item.id}`,
        year: item.production?.[0]?.dates?.[0]?.label?.match(/\d{4}/)?.[0] || null,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Wellcome failed:", e.message);
      return [];
    }
  }
  async function fetchMAAS(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://collection.maas.museum/api/search?q=${encodeURIComponent(keyword)}&has_image=yes&limit=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("MAAS failed");
      const data = await res.json();
      return (data.records || []).filter((item) => item.images?.[0]?.url).map((item) => ({
        id: "maas_" + String(item.id).replace(/\//g, "_"),
        url: item.images[0].url,
        thumb: item.images[0].url,
        title: item.title || "Powerhouse Object",
        description: item.maker?.[0] || "",
        source: "maas",
        sourceUrl: `https://collection.maas.museum/object/${encodeURIComponent(item.id)}`,
        year: (item.date || "").match(/\d{4}/)?.[0] || null,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("MAAS failed:", e.message);
      return [];
    }
  }
  async function fetchSMK(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://api.smk.dk/api/v1/art/search/?keys=${encodeURIComponent(keyword)}&has_image=true&offset=0&rows=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("SMK failed");
      const data = await res.json();
      return (data.items || []).filter((item) => item.image_thumbnail).map((item) => ({
        id: "smk_" + item.object_number,
        url: (item.image_thumbnail || "").replace("/thumb/", "/full/"),
        thumb: item.image_thumbnail,
        title: item.titles?.[0]?.title || "SMK Artwork",
        description: item.artist?.[0] || "",
        source: "smk",
        sourceUrl: `https://open.smk.dk/artwork/image/${item.object_number}`,
        year: item.production_date?.[0]?.period?.match(/\d{4}/)?.[0] || null,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("SMK failed:", e.message);
      return [];
    }
  }
  async function fetchThyssen(keyword, limit, signal) {
    const cached = await fetchFromDataCache("thyssen", keyword);
    if (cached) return cached;
    try {
      const res = await safeFetch(
        `https://www.museothyssen.org/api/v1/coleccion/obras?search=${encodeURIComponent(keyword)}&page=1&per_page=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("Thyssen failed");
      const data = await res.json();
      return (data.data || []).filter((item) => item.imagen_url).map((item) => ({
        id: "thyssen_" + item.id,
        url: item.imagen_url,
        thumb: item.imagen_url,
        title: item.titulo || "Thyssen Artwork",
        description: item.autor || "",
        source: "thyssen",
        sourceUrl: `https://www.museothyssen.org/coleccion/obras/${item.id}`,
        year: (item.fecha || "").match(/\d{4}/)?.[0] || null,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      return [];
    }
  }
  async function fetchWalters(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://api.thewalters.org/v1/objects.json?keyword=${encodeURIComponent(keyword)}&orderBy=relevance&page=1&pageSize=${limit}&apikey=`,
        { signal }
      );
      if (!res.ok) throw new Error("Walters failed");
      const data = await res.json();
      return (data.Items || []).filter((item) => item.PrimaryImage?.Lg).map((item) => ({
        id: "walters_" + item.ObjectID,
        url: item.PrimaryImage.Lg,
        thumb: item.PrimaryImage.Sm || item.PrimaryImage.Lg,
        title: item.Title || "Walters Object",
        description: [item.Artist, item.Dated].filter(Boolean).join(" \u2014 "),
        year: (item.Dated || "").match(/\d{4}/)?.[0] || null,
        source: "walters",
        sourceUrl: item.ResourceURL || "",
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      console.warn("Walters failed:", e.message);
      return [];
    }
  }
  async function fetchPrinceton(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://data.artmuseum.princeton.edu/search?query=${encodeURIComponent(keyword)}&size=${limit}&from=0`,
        { signal }
      );
      if (!res.ok) throw new Error("Princeton failed");
      const data = await res.json();
      return (data.hits?.hits || []).filter((item) => item._source?.images?.[0]?.iiifbaseuri).map((item) => {
        const base = item._source.images[0].iiifbaseuri;
        return {
          id: "princeton_" + item._id,
          url: base + "/full/!800,800/0/default.jpg",
          thumb: base + "/full/!400,400/0/default.jpg",
          title: item._source.title || "Princeton Object",
          description: item._source.displaymaker || "",
          year: (item._source.displaydate || "").match(/\d{4}/)?.[0] || null,
          source: "princeton",
          sourceUrl: `https://artmuseum.princeton.edu/collections/objects/${item._source.id}`,
          tags: [],
          colors: [],
          aiTags: []
        };
      }).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      console.warn("Princeton failed:", e.message);
      return [];
    }
  }
  async function fetchWikidata(keyword, limit, signal) {
    try {
      const sparql = `SELECT ?item ?itemLabel ?image ?date WHERE {
  ?item wdt:P18 ?image.
  ?item rdfs:label ?itemLabel.
  FILTER(LANG(?itemLabel) = "en")
  FILTER(CONTAINS(LCASE(?itemLabel), LCASE("${keyword.replace(/"/g, "")}")))
  OPTIONAL { ?item wdt:P571 ?date. }
} LIMIT ${limit}`.trim();
      const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
      const res = await safeFetch(url, {
        signal,
        headers: {
          "Accept": "application/sparql-results+json",
          "User-Agent": "InpoSearch/1.0"
        }
      });
      if (!res.ok) throw new Error("Wikidata failed");
      const data = await res.json();
      return (data.results?.bindings || []).filter((b) => b.image?.value).map((b) => ({
        id: "wd_" + b.item.value.split("/").pop(),
        url: b.image.value.replace("http://", "https://"),
        thumb: b.image.value.replace("http://", "https://") + "?width=400",
        title: b.itemLabel?.value || "Wikidata Item",
        description: "",
        year: b.date?.value?.slice(0, 4) || null,
        source: "wikidata",
        sourceUrl: b.item.value.replace("http://", "https://"),
        tags: [b.itemLabel?.value?.toLowerCase()].filter(Boolean),
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      console.warn("Wikidata failed:", e.message);
      return [];
    }
  }
  async function fetchNOAA(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://www.photolib.noaa.gov/api/search?q=${encodeURIComponent(keyword)}&format=json&rows=${limit}&start=0`,
        { signal }
      );
      if (!res.ok) throw new Error("NOAA failed");
      const data = await res.json();
      return (data.response?.docs || []).filter((item) => item.url_full).map((item) => ({
        id: "noaa_" + item.id,
        url: item.url_full,
        thumb: item.url_thumbnail || item.url_full,
        title: item.title || "NOAA Photo",
        description: item.photographer || "",
        year: (item.date || "").slice(0, 4) || null,
        source: "noaa",
        sourceUrl: `https://www.photolib.noaa.gov/search?q=${encodeURIComponent(keyword)}`,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      console.warn("NOAA failed:", e.message);
      return [];
    }
  }
  async function fetchHubble(keyword, limit, signal) {
    try {
      const cacheAge = STATE.hubbleCacheTimestamp ? Date.now() - STATE.hubbleCacheTimestamp : Infinity;
      if (!STATE.hubbleCache.length || cacheAge > 6 * 60 * 60 * 1e3) {
        const res = await safeFetch(
          "https://hubblesite.org/api/v3/external_feed?service=NEWS_IMAGES&page=all",
          { signal }
        );
        if (!res.ok) throw new Error("Hubble failed");
        const data = await res.json();
        STATE.hubbleCache = (data || []).filter((item) => item.thumbnail_url).map((item) => ({
          id: "hubble_" + item.id,
          url: (item.thumbnail_url || "").replace("_thumb", ""),
          thumb: item.thumbnail_url,
          title: item.name || "Hubble Image",
          description: (item.description || "").slice(0, 100),
          year: item.news_id?.slice(0, 4) || null,
          source: "hubble",
          sourceUrl: `https://hubblesite.org/contents/news-releases/${item.news_id || ""}`,
          tags: ["space", "astronomy", "nebula", "hubble"],
          colors: [],
          aiTags: []
        })).filter((i) => i.thumb);
        STATE.hubbleCacheTimestamp = Date.now();
      }
      const kw = keyword.toLowerCase();
      const matched = STATE.hubbleCache.filter(
        (item) => (item.title + " " + item.description + " " + item.tags.join(" ")).toLowerCase().includes(kw)
      );
      const pool = matched.length > 0 ? matched : STATE.hubbleCache;
      return shuffle([...pool]).slice(0, limit);
    } catch (e) {
      console.warn("Hubble failed:", e.message);
      return [];
    }
  }
  async function fetchCornell(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://digital.library.cornell.edu/catalog.json?q=${encodeURIComponent(keyword)}&f[format][]=Image&per_page=${limit}&page=1`,
        { signal }
      );
      if (!res.ok) throw new Error("Cornell failed");
      const data = await res.json();
      return (data.data || []).filter((item) => item.attributes?.thumbnail_path_ss).map((item) => {
        const thumb = "https://digital.library.cornell.edu" + item.attributes.thumbnail_path_ss;
        const url = thumb.replace("thumbnail", "large");
        return {
          id: "cornell_" + item.id.replace(/[^a-z0-9]/gi, "_"),
          url,
          thumb,
          title: item.attributes.title_tesim?.[0] || "Cornell Item",
          description: item.attributes.creator_tesim?.[0] || "",
          year: item.attributes.date_created_tesim?.[0]?.match(/\d{4}/)?.[0] || null,
          source: "cornell",
          sourceUrl: `https://digital.library.cornell.edu/catalog/${item.id}`,
          tags: [],
          colors: [],
          aiTags: []
        };
      }).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      console.warn("Cornell failed:", e.message);
      return [];
    }
  }
  async function fetchFolger(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://collections.folger.edu/search?q=${encodeURIComponent(keyword)}&per_page=${limit}&format=json`,
        { signal },
        6e3
      );
      if (!res.ok) throw new Error("Folger failed");
      const data = await res.json();
      return (data.response?.docs || []).filter((item) => item.thumbnail_path).map((item) => ({
        id: "folger_" + item.id.replace(/[^a-z0-9]/gi, "_"),
        url: item.thumbnail_path,
        thumb: item.thumbnail_path,
        title: item.title_display || "Folger Item",
        description: item.author_display?.[0] || "",
        year: (item.pub_date || "").match(/\d{4}/)?.[0] || null,
        source: "folger",
        sourceUrl: `https://collections.folger.edu/detail/${item.id}`,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      return [];
    }
  }
  async function fetchONB(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://api.onb.ac.at/api/v1/search?q=${encodeURIComponent(keyword)}&imageOnly=true&rows=${limit}&start=0`,
        { signal },
        6e3
      );
      if (!res.ok) throw new Error("ONB failed");
      const data = await res.json();
      return (data.docs || []).filter((item) => item.thumbnail).map((item) => ({
        id: "onb_" + item.id.replace(/[^a-z0-9]/gi, "_"),
        url: item.thumbnail,
        thumb: item.thumbnail,
        title: item.title || "\xD6NB Item",
        description: item.creator?.[0] || "",
        year: (item.date || "").slice(0, 4) || null,
        source: "onb",
        sourceUrl: `https://digital.onb.ac.at/search?q=${encodeURIComponent(keyword)}`,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      return [];
    }
  }
  async function fetchNYPL(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://api.repo.nypl.org/api/v2/items/search?q=${encodeURIComponent(keyword)}&per_page=${limit}&page=1`,
        { signal }
      );
      if (!res.ok) throw new Error("NYPL failed");
      const data = await res.json();
      const results = data.nyplAPI?.response?.result || [];
      return results.filter((item) => item.imageLinks?.imageLink?.[0]).map((item) => {
        const url = item.imageLinks.imageLink[0];
        return {
          id: "nypl_" + item.uuid,
          url,
          thumb: url.replace("t=w", "t=t"),
          title: item.title || "NYPL Item",
          description: "",
          year: item.dateStructured?.[0]?.decade || null,
          source: "nypl",
          sourceUrl: `https://digitalcollections.nypl.org/items/${item.uuid}`,
          tags: [],
          colors: [],
          aiTags: []
        };
      }).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      console.warn("NYPL failed:", e.message);
      return [];
    }
  }
  async function fetchMAK(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://sammlung.mak.at/api/v1/search?q=${encodeURIComponent(keyword)}&has_image=true&per_page=${limit}`,
        { signal },
        6e3
      );
      if (!res.ok) throw new Error("MAK failed");
      const data = await res.json();
      return (data.objects || []).filter((item) => item.image_url).map((item) => ({
        id: "mak_" + String(item.id).replace(/[^a-z0-9]/gi, "_"),
        url: item.image_url,
        thumb: item.image_url,
        title: item.title || "MAK Object",
        description: item.artist || "",
        year: (item.date || "").match(/\d{4}/)?.[0] || null,
        source: "mak",
        sourceUrl: `https://sammlung.mak.at/en/objectdb/detail/${item.id}`,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      return [];
    }
  }
  async function fetchMNA(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://mna.inah.gob.mx/api/search?q=${encodeURIComponent(keyword)}&limit=${limit}`,
        { signal },
        6e3
      );
      if (!res.ok) throw new Error("MNA failed");
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.results || [];
      return items.filter((item) => item.image || item.image_url).map((item) => ({
        id: "mna_" + String(item.id || item.objectId || Math.random()).replace(/[^a-z0-9]/gi, "_"),
        url: item.image || item.image_url,
        thumb: item.image || item.image_url,
        title: item.title || item.nombre || "MNA Object",
        description: item.culture || item.cultura || "",
        year: (item.date || item.fecha || "").match(/\d{4}/)?.[0] || null,
        source: "mna",
        sourceUrl: `https://mna.inah.gob.mx`,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      return [];
    }
  }
  async function fetchMia(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://search.artsmia.org/?q=${encodeURIComponent(keyword)}&size=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("Mia failed");
      const data = await res.json();
      return (data.hits?.hits || []).filter((hit) => hit._source?.image === "valid" && hit._source?.restricted === 0).map((hit) => ({
        id: `mia_${hit._id}`,
        url: `https://api.artsmia.org/images/${hit._id}/large.jpg`,
        thumb: `https://api.artsmia.org/images/${hit._id}/medium.jpg`,
        title: hit._source.title || "Mia Object",
        description: hit._source.artist || "",
        year: (hit._source.dated || "").match(/\d{4}/)?.[0] || null,
        source: "mia",
        sourceUrl: `https://collections.artsmia.org/art/${hit._id}`,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      console.warn("Mia failed:", e.message);
      return [];
    }
  }
  async function fetchLACMA(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://collections.lacma.org/api/search?q=${encodeURIComponent(keyword)}&f[]=has_image:true&f[]=public_domain:true&rows=${limit}&start=0`,
        { signal }
      );
      if (!res.ok) throw new Error("LACMA failed");
      const data = await res.json();
      return (data.response?.docs || []).filter((item) => item.thumbnail_url_s).map((item) => ({
        id: `lacma_${String(item.id || "").replace(/[^a-z0-9]/gi, "_")}`,
        url: item.thumbnail_url_s,
        thumb: item.thumbnail_url_s,
        title: item.title_s || "LACMA Object",
        description: item.artist_s || "",
        year: (item.date_s || "").match(/\d{4}/)?.[0] || null,
        source: "lacma",
        sourceUrl: `https://collections.lacma.org/node/${(item.id || "").split(":")[1] || ""}`,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      return [];
    }
  }
  async function fetchMunch(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://www.munchmuseet.no/api/v1/works?q=${encodeURIComponent(keyword)}&limit=${limit}&hasImage=true`,
        { signal }
      );
      if (!res.ok) throw new Error("Munch failed");
      const data = await res.json();
      return (data.items || []).filter((item) => item.image?.url).map((item) => ({
        id: `munch_${String(item.id || "").replace(/[^a-z0-9]/gi, "_")}`,
        url: item.image.url,
        thumb: item.image.url,
        title: item.title || "Munch Work",
        description: item.technique || "",
        year: (item.dated || "").match(/\d{4}/)?.[0] || null,
        source: "munch",
        sourceUrl: `https://www.munchmuseet.no/en/the-collection/${item.id || ""}`,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      return [];
    }
  }
  async function fetchMauritshuis(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://www.mauritshuis.nl/api/collection/search?query=${encodeURIComponent(keyword)}&limit=${limit}&imageAvailable=true`,
        { signal }
      );
      if (!res.ok) throw new Error("Mauritshuis failed");
      const data = await res.json();
      return (data.results || []).filter((item) => item.image).map((item) => ({
        id: `mauritshuis_${item.id || ""}`,
        url: item.image,
        thumb: item.image,
        title: item.title || "Mauritshuis Object",
        description: item.maker || "",
        year: (item.dating || "").match(/\d{4}/)?.[0] || null,
        source: "mauritshuis",
        sourceUrl: `https://www.mauritshuis.nl/en/our-collection/artworks/${item.id || ""}`,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      return [];
    }
  }
  async function fetchNationalmuseumSE(keyword, limit, signal) {
    try {
      const searchRes = await safeFetch(
        `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(keyword)}+incategory:Nationalmuseum&srnamespace=6&srlimit=${limit}&format=json&origin=*`,
        { signal }
      );
      if (!searchRes.ok) throw new Error("NationalmuseumSE search failed");
      const searchData = await searchRes.json();
      const titles = (searchData.query?.search || []).map((r) => r.title);
      if (!titles.length) return [];
      const infoRes = await safeFetch(
        `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles.join("|"))}&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`,
        { signal }
      );
      if (!infoRes.ok) throw new Error("NationalmuseumSE imageinfo failed");
      const infoData = await infoRes.json();
      return Object.values(infoData.query?.pages || {}).filter((p) => p.imageinfo?.[0]?.url).map((p) => {
        const info = p.imageinfo[0];
        const meta = info.extmetadata || {};
        const title = (meta.ObjectName?.value || p.title || "").replace(/^File:/i, "");
        return {
          id: `nmse_${p.pageid}`,
          url: info.url,
          thumb: info.url,
          title: title || "Nationalmuseum Work",
          description: meta.Artist?.value?.replace(/<[^>]+>/g, "") || "",
          year: (meta.DateTimeOriginal?.value || meta.Date?.value || "").match(/\d{4}/)?.[0] || null,
          source: "nationalmuseumse",
          sourceUrl: info.descriptionurl || "",
          tags: [],
          colors: [],
          aiTags: []
        };
      }).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      return [];
    }
  }
  async function fetchNaturalis(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://api.biodiversitydata.nl/v2/specimen/search/?_search=${encodeURIComponent(keyword)}&_hasImage=true&_size=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("Naturalis failed");
      const data = await res.json();
      return (data.resultSet || []).map((r) => r.item).filter((item) => item?.associatedMultiMediaUris?.[0]?.accessURI).map((item) => ({
        id: `naturalis_${String(item.unitID || "").replace(/[^a-z0-9]/gi, "_")}`,
        url: item.associatedMultiMediaUris[0].accessURI,
        thumb: item.associatedMultiMediaUris[0].accessURI,
        title: item.identifications?.[0]?.scientificName?.fullScientificName || "Naturalis Specimen",
        description: item.gatheringEvent?.country || "",
        year: item.gatheringEvent?.dateTimeBegin?.slice(0, 4) || null,
        source: "naturalis",
        sourceUrl: `https://bioportal.naturalis.nl/specimen/${encodeURIComponent(item.unitID || "")}`,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      console.warn("Naturalis failed:", e.message);
      return [];
    }
  }
  async function fetchNMAAHC(keyword, limit, signal) {
    try {
      const key = STATE.smithsonianKey || "DEMO_KEY";
      const res = await safeFetch(
        `https://api.si.edu/openaccess/api/v1.0/search?q=${encodeURIComponent(keyword)}&api_key=${key}&rows=${limit}&online_media_type=Images&unit_code=NMAAHC`,
        { signal }
      );
      if (!res.ok) throw new Error("NMAAHC failed");
      const data = await res.json();
      return (data.response?.rows || []).filter((row) => row.indexedStructured?.online_media?.[0]).map((row) => {
        const media = row.indexedStructured.online_media[0];
        return {
          id: `nmaahc_${row.id}`,
          url: media.content || media.thumbnail,
          thumb: media.thumbnail || media.content,
          title: row.title || "NMAAHC Object",
          description: "",
          source: "nmaahc",
          sourceUrl: `https://nmaahc.si.edu/object/${row.id}`,
          year: null,
          tags: [],
          colors: [],
          aiTags: []
        };
      }).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      console.warn("NMAAHC failed:", e.message);
      return [];
    }
  }
  async function fetchNASM(keyword, limit, signal) {
    try {
      const key = STATE.smithsonianKey || "DEMO_KEY";
      const res = await safeFetch(
        `https://api.si.edu/openaccess/api/v1.0/search?q=${encodeURIComponent(keyword)}&api_key=${key}&rows=${limit}&online_media_type=Images&unit_code=NASM`,
        { signal }
      );
      if (!res.ok) throw new Error("NASM failed");
      const data = await res.json();
      return (data.response?.rows || []).filter((row) => row.indexedStructured?.online_media?.[0]).map((row) => {
        const media = row.indexedStructured.online_media[0];
        return {
          id: `nasm_${row.id}`,
          url: media.content || media.thumbnail,
          thumb: media.thumbnail || media.content,
          title: row.title || "NASM Object",
          description: "",
          source: "nasm",
          sourceUrl: `https://airandspace.si.edu/collection/id/${row.id}`,
          year: null,
          tags: [],
          colors: [],
          aiTags: []
        };
      }).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      console.warn("NASM failed:", e.message);
      return [];
    }
  }
  async function fetchNationalZoo(keyword, limit, signal) {
    try {
      const key = STATE.smithsonianKey || "DEMO_KEY";
      const res = await safeFetch(
        `https://api.si.edu/openaccess/api/v1.0/search?q=${encodeURIComponent(keyword)}&api_key=${key}&rows=${limit}&online_media_type=Images&unit_code=NZP`,
        { signal }
      );
      if (!res.ok) throw new Error("NationalZoo failed");
      const data = await res.json();
      return (data.response?.rows || []).filter((row) => row.indexedStructured?.online_media?.[0]).map((row) => {
        const media = row.indexedStructured.online_media[0];
        return {
          id: `zoo_${row.id}`,
          url: media.content || media.thumbnail,
          thumb: media.thumbnail || media.content,
          title: row.title || "National Zoo",
          description: "",
          source: "nationalzoo",
          sourceUrl: `https://nationalzoo.si.edu/animals`,
          year: null,
          tags: [],
          colors: [],
          aiTags: []
        };
      }).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      console.warn("NationalZoo failed:", e.message);
      return [];
    }
  }
  async function fetchFreerSackler(keyword, limit, signal) {
    try {
      const key = STATE.smithsonianKey || "DEMO_KEY";
      const res = await safeFetch(
        `https://api.si.edu/openaccess/api/v1.0/search?q=${encodeURIComponent(keyword)}&api_key=${key}&rows=${limit}&online_media_type=Images&unit_code=FSG`,
        { signal }
      );
      if (!res.ok) throw new Error("FreerSackler failed");
      const data = await res.json();
      return (data.response?.rows || []).filter((row) => row.indexedStructured?.online_media?.[0]).map((row) => {
        const media = row.indexedStructured.online_media[0];
        return {
          id: `fsg_${row.id}`,
          url: media.content || media.thumbnail,
          thumb: media.thumbnail || media.content,
          title: row.title || "Freer|Sackler Object",
          description: "",
          source: "freersackler",
          sourceUrl: `https://asia.si.edu/object/${row.id}`,
          year: null,
          tags: [],
          colors: [],
          aiTags: []
        };
      }).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      console.warn("FreerSackler failed:", e.message);
      return [];
    }
  }
  async function fetchWhitney(keyword, limit, signal) {
    try {
      const cacheAge = STATE.whitneyCacheTimestamp ? Date.now() - STATE.whitneyCacheTimestamp : Infinity;
      if (!STATE.whitneyCache.length || cacheAge > 24 * 60 * 60 * 1e3) {
        const res = await safeFetch(
          "https://raw.githubusercontent.com/whitneymuseum/open-access/master/collection/artworks.csv",
          { signal }
        );
        if (!res.ok) throw new Error("Whitney failed");
        const text = await res.text();
        const lines = text.split("\n");
        const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
        STATE.whitneyCache = lines.slice(1).map((line) => {
          const vals = [];
          let cur = "", inQ = false;
          for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') {
              inQ = !inQ;
              continue;
            }
            if (c === "," && !inQ) {
              vals.push(cur.trim());
              cur = "";
              continue;
            }
            cur += c;
          }
          vals.push(cur.trim());
          return Object.fromEntries(
            headers.map((h, i) => [h, (vals[i] || "").trim()])
          );
        }).filter((a) => a.imageURL && a.imageURL.startsWith("http")).map((a, i) => ({
          id: `whitney_${a.ObjectID || i}`,
          url: a.imageURL,
          thumb: a.imageURL,
          title: a.Title || "Whitney Artwork",
          description: a.Artist || "",
          year: (a.Date || "").match(/\d{4}/)?.[0] || null,
          source: "whitney",
          sourceUrl: `https://whitney.org/collection/works/${a.ObjectID}`,
          tags: [a.Classification, a.Medium].filter(Boolean).map((t) => t.toLowerCase()),
          colors: [],
          aiTags: []
        }));
        STATE.whitneyCacheTimestamp = Date.now();
      }
      const kw = keyword.toLowerCase();
      const matched = STATE.whitneyCache.filter(
        (item) => (item.title + " " + item.description + " " + item.tags.join(" ")).toLowerCase().includes(kw)
      );
      const pool = matched.length > 0 ? matched : STATE.whitneyCache;
      return shuffle([...pool]).slice(0, limit);
    } catch (e) {
      console.warn("Whitney failed:", e.message);
      return [];
    }
  }
  async function fetchGBIFLiterature(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://api.gbif.org/v1/occurrence/search?q=${encodeURIComponent(keyword)}&mediaType=StillImage&basisOfRecord=LITERATURE&limit=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("GBIF Literature failed");
      const data = await res.json();
      return (data.results || []).filter((obs) => obs.media?.[0]?.identifier).map((obs) => ({
        id: `gbiflit_${obs.key}`,
        url: obs.media[0].identifier,
        thumb: obs.media[0].identifier,
        title: obs.scientificName || obs.species || "GBIF Literature",
        description: obs.references || "",
        year: (obs.year || "").toString() || null,
        source: "gbiflit",
        sourceUrl: `https://www.gbif.org/occurrence/${obs.key}`,
        tags: [obs.species, obs.kingdom].filter(Boolean).map((t) => t.toLowerCase()),
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      console.warn("GBIF Literature failed:", e.message);
      return [];
    }
  }
  async function fetchIDigBio(keyword, limit, signal) {
    try {
      const rq = encodeURIComponent(JSON.stringify({ hasImage: true }));
      const res = await safeFetch(
        `https://search.idigbio.org/v2/search/media?rq=${rq}&q=${encodeURIComponent(keyword)}&limit=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("iDigBio fetch failed");
      const data = await res.json();
      return (data.items || []).filter((item) => item.indexTerms && item.indexTerms.accessuri).map((item) => ({
        id: `idigbio_${item.uuid}`,
        url: item.indexTerms.accessuri,
        thumb: item.indexTerms.accessuri,
        title: item.data && (item.data["dcterms:title"] || item.data["ac:tag"]) || "iDigBio Image",
        description: item.data && (item.data["dcterms:description"] || "") || "",
        source: "idigbio",
        sourceUrl: `https://www.idigbio.org/portal/mediarecords/${item.uuid}`,
        year: (item.data && item.data["dcterms:available"] || "").slice(0, 4) || null,
        tags: [item.indexTerms.tag].filter(Boolean),
        colors: [],
        aiTags: []
      })).filter((item) => item.url).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("iDigBio failed:", e.message);
      return [];
    }
  }
  async function fetchALA(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://biocache.ala.org.au/ws/occurrences/search?q=${encodeURIComponent(keyword)}&fq=multimedia:Image&pageSize=${limit}&fl=uuid,scientificName,vernacularName,stateProvince,images`,
        { signal }
      );
      if (!res.ok) throw new Error("ALA fetch failed");
      const data = await res.json();
      return (data.occurrences || []).filter((occ) => occ.images && occ.images.length).map((occ) => {
        const imgId = occ.images[0];
        const url = `https://images.ala.org.au/image/${imgId}/original`;
        const thumb = `https://images.ala.org.au/image/${imgId}/thumbnail`;
        const title = occ.vernacularName || occ.scientificName || "ALA Image";
        return {
          id: `ala_${occ.uuid || imgId}`,
          url,
          thumb,
          title,
          description: occ.stateProvince || occ.scientificName || "",
          source: "ala",
          sourceUrl: `https://biocache.ala.org.au/occurrences/${occ.uuid}`,
          year: null,
          tags: [occ.scientificName, occ.vernacularName].filter(Boolean).map((t) => t.toLowerCase()),
          colors: [],
          aiTags: []
        };
      }).filter((item) => item.url).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("ALA failed:", e.message);
      return [];
    }
  }
  async function fetchNASAImages(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://images-api.nasa.gov/search?q=${encodeURIComponent(keyword)}&media_type=image&page_size=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("NASA Images fetch failed");
      const data = await res.json();
      return (data.collection?.items || []).filter((item) => item.links?.[0]?.href).map((item) => {
        const d = item.data?.[0] || {};
        const url = item.links[0].href;
        const thumb = url.replace("~medium.jpg", "~thumb.jpg").replace("~small.jpg", "~thumb.jpg");
        return {
          id: `nasaimg_${d.nasa_id || Math.random().toString(36).slice(2)}`,
          url,
          thumb,
          title: d.title || "NASA Image",
          description: d.description ? d.description.slice(0, 200) : "",
          source: "nasa_images",
          sourceUrl: `https://images.nasa.gov/details/${d.nasa_id}`,
          year: d.date_created ? d.date_created.slice(0, 4) : null,
          tags: (d.keywords || []).map((t) => t.toLowerCase()),
          colors: [],
          aiTags: []
        };
      }).filter((item) => item.url).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("NASA Images failed:", e.message);
      return [];
    }
  }
  async function fetchNHMLondon(keyword, limit, signal) {
    const cached = await fetchFromDataCache("nhm_london", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "nhm_london" }));
    try {
      const url = `https://data.nhm.ac.uk/api/3/action/datastore_search?resource_id=05ff2255-c38a-40c9-b657-4ccb55ab2feb&q=${encodeURIComponent(keyword)}&limit=${limit * 3}`;
      const res = await safeFetch(url, { signal });
      if (!res.ok) throw new Error(`NHM fetch failed: ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error("NHM API returned success:false");
      const records = data.result?.records || [];
      return records.filter((r) => r.associatedMedia && String(r.associatedMedia).trim()).map((r) => {
        const mediaUrl = String(r.associatedMedia).split("|")[0].trim();
        const title = r.scientificName || r.genus || "NHM Specimen";
        const descParts = [r.family, r.collectionCode, r.locality].filter(Boolean);
        return {
          id: `nhm_${r._id}`,
          url: mediaUrl,
          thumb: mediaUrl,
          title,
          description: descParts.join(" \u2014 "),
          source: "nhm_london",
          sourceUrl: r.occurrenceID || `https://data.nhm.ac.uk/object/${r._id}`,
          year: String(r.year || r.dateIdentified || "").match(/\d{4}/)?.[0] || null,
          tags: [r.scientificName, r.genus, r.family, r.collectionCode, r.locality].filter(Boolean).map((t) => t.toLowerCase()),
          colors: [],
          aiTags: []
        };
      }).filter(isLikelyReal).slice(0, limit);
    } catch (err) {
      if (err.name === "AbortError") return [];
      console.warn("NHM London failed:", err.message);
      return [];
    }
  }
  async function fetchWallaceCollection(keyword, limit, signal) {
    const cached = await fetchFromDataCache("wallace_collection", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "wallace_collection" }));
    return [];
  }
  async function fetchFitzwilliam(keyword, limit, signal) {
    const cached = await fetchFromDataCache("fitzwilliam", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "fitzwilliam" }));
    return [];
  }
  async function fetchNationalGalleryLondon(keyword, limit, signal) {
    const cached = await fetchFromDataCache("national_gallery_london", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "national_gallery_london" }));
    return [];
  }
  async function fetchScottishNational(keyword, limit, signal) {
    const cached = await fetchFromDataCache("scottish_national", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "scottish_national" }));
    return [];
  }
  async function fetchMuseeOrsay(keyword, limit, signal) {
    const cached = await fetchFromDataCache("musee_orsay", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "musee_orsay" }));
    return [];
  }
  async function fetchVanGoghMuseum(keyword, limit, signal) {
    const cached = await fetchFromDataCache("vangogh_museum", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "vangogh_museum" }));
    return [];
  }
  async function fetchKHM(keyword, limit, signal) {
    const cached = await fetchFromDataCache("khm", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "khm" }));
    return [];
  }
  async function fetchBelvedere(keyword, limit, signal) {
    const cached = await fetchFromDataCache("belvedere", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "belvedere" }));
    return [];
  }
  async function fetchStaedel(keyword, limit, signal) {
    const cached = await fetchFromDataCache("staedel", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "staedel" }));
    return [];
  }
  async function fetchRMFAB(keyword, limit, signal) {
    const cached = await fetchFromDataCache("rmfab", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "rmfab" }));
    return [];
  }
  async function fetchGuimet(keyword, limit, signal) {
    const cached = await fetchFromDataCache("guimet", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "guimet" }));
    return [];
  }
  async function fetchNPMTaipei(keyword, limit, signal) {
    const cached = await fetchFromDataCache("npm_taipei", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "npm_taipei" }));
    return [];
  }
  async function fetchGalliera(keyword, limit, signal) {
    const cached = await fetchFromDataCache("galliera", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "galliera" }));
    return [];
  }
  async function fetchArtsDecoratifs(keyword, limit, signal) {
    const cached = await fetchFromDataCache("arts_decoratifs", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "arts_decoratifs" }));
    return [];
  }
  async function fetchCentraalMuseum(keyword, limit, signal) {
    const cached = await fetchFromDataCache("centraal_museum", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "centraal_museum" }));
    return [];
  }
  async function fetchTextileMuseum(keyword, limit, signal) {
    const cached = await fetchFromDataCache("textile_museum_tilburg", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "textile_museum_tilburg" }));
    return [];
  }
  async function fetchWereldculturen(keyword, limit, signal) {
    const cached = await fetchFromDataCache("wereldculturen", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "wereldculturen" }));
    return [];
  }
  async function fetchDecArtsPrague(keyword, limit, signal) {
    const cached = await fetchFromDataCache("dec_arts_prague", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "dec_arts_prague" }));
    return [];
  }
  async function fetchDesignmuseumDK(keyword, limit, signal) {
    const cached = await fetchFromDataCache("designmuseum_dk", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "designmuseum_dk" }));
    return [];
  }
  async function fetchBoijmans(keyword, limit, signal) {
    const cached = await fetchFromDataCache("boijmans", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "boijmans" }));
    return [];
  }
  async function fetchMuseuTraje(keyword, limit, signal) {
    const cached = await fetchFromDataCache("museu_traje", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "museu_traje" }));
    return [];
  }
  async function fetchKMSKA(keyword, limit, signal) {
    const cached = await fetchFromDataCache("kmska", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "kmska" }));
    return [];
  }
  async function fetchAmsterdamMuseum(keyword, limit, signal) {
    const cached = await fetchFromDataCache("amsterdam_museum", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "amsterdam_museum" }));
    return [];
  }
  async function fetchNGI(keyword, limit, signal) {
    const cached = await fetchFromDataCache("ngi", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "ngi" }));
    return [];
  }
  async function fetchFriesMuseum(keyword, limit, signal) {
    const cached = await fetchFromDataCache("fries_museum", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "fries_museum" }));
    return [];
  }
  async function fetchGroeninge(keyword, limit, signal) {
    const cached = await fetchFromDataCache("groeninge", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "groeninge" }));
    return [];
  }
  async function fetchGroninger(keyword, limit, signal) {
    const cached = await fetchFromDataCache("groninger", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "groninger" }));
    return [];
  }
  async function fetchMoMAWD(keyword, limit, signal) {
    const cached = await fetchFromDataCache("moma_wd", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "moma_wd" }));
    return [];
  }
  async function fetchRijksmuseumTwenthe(keyword, limit, signal) {
    const cached = await fetchFromDataCache("rijksmuseum_twenthe", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "rijksmuseum_twenthe" }));
    return [];
  }
  async function fetchHerzogAntonUlrich(keyword, limit, signal) {
    const cached = await fetchFromDataCache("herzog_anton_ulrich", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "herzog_anton_ulrich" }));
    return [];
  }
  async function fetchGalleriaPalatina(keyword, limit, signal) {
    const cached = await fetchFromDataCache("galleria_palatina", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "galleria_palatina" }));
    return [];
  }
  async function fetchLakenhal(keyword, limit, signal) {
    const cached = await fetchFromDataCache("lakenhal", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "lakenhal" }));
    return [];
  }
  async function fetchTeylers(keyword, limit, signal) {
    const cached = await fetchFromDataCache("teylers", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "teylers" }));
    return [];
  }
  async function fetchAltePinakothek(keyword, limit, signal) {
    const cached = await fetchFromDataCache("alte_pinakothek", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "alte_pinakothek" }));
    return [];
  }
  async function fetchQuaiBranly(keyword, limit, signal) {
    const cached = await fetchFromDataCache("quai_branly", keyword);
    if (cached) return cached.map((item) => ({ ...item, source: "quai_branly" }));
    return [];
  }
  var WD_PHASE_H_FETCHERS = {};
  WD_PHASE_H.forEach((s) => {
    WD_PHASE_H_FETCHERS[s.id] = async function(keyword, limit, signal) {
      const cached = await fetchFromDataCache(s.id, keyword);
      if (cached) return cached.map((item) => ({ ...item, source: s.id }));
      return [];
    };
  });
  async function fetchArchiveMaps(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://archive.org/advancedsearch.php?q=${encodeURIComponent(keyword)}+AND+mediatype:image+AND+subject:map&fl[]=identifier,title,description,date,subject&rows=${limit}&output=json`,
        { signal }
      );
      if (!res.ok) throw new Error("Archive Maps failed");
      const data = await res.json();
      return (data.response?.docs || []).map((doc) => ({
        id: `archivemap_${doc.identifier}`,
        url: `https://archive.org/services/img/${doc.identifier}`,
        thumb: `https://archive.org/services/img/${doc.identifier}`,
        title: Array.isArray(doc.title) ? doc.title[0] : doc.title || "Archive Map",
        description: Array.isArray(doc.description) ? doc.description[0] : doc.description || "",
        source: "archive",
        sourceUrl: `https://archive.org/details/${doc.identifier}`,
        year: (doc.date || "").slice(0, 4) || null,
        tags: (Array.isArray(doc.subject) ? doc.subject : [doc.subject]).filter(Boolean).map((s) => s.toLowerCase()),
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      console.warn("Archive Maps failed:", e.message);
      return [];
    }
  }
  async function fetchOpenLibrarySubjects(keyword, limit, signal) {
    if (keyword.length < 4) return [];
    try {
      const slug = keyword.toLowerCase().replace(/\s+/g, "_");
      const res = await safeFetch(
        `https://openlibrary.org/subjects/${encodeURIComponent(slug)}.json?limit=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("OL subjects failed");
      const data = await res.json();
      return (data.works || []).filter((w) => w.cover_id).map((w) => ({
        id: `olsubj_${w.cover_id}`,
        url: `https://covers.openlibrary.org/b/id/${w.cover_id}-L.jpg`,
        thumb: `https://covers.openlibrary.org/b/id/${w.cover_id}-M.jpg`,
        title: w.title || "Book",
        description: w.authors?.[0]?.name || "",
        year: w.first_publish_year?.toString() || null,
        source: "openlibrary",
        sourceUrl: `https://openlibrary.org${w.key}`,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      console.warn("OL Subjects failed:", e.message);
      return [];
    }
  }
  async function fetchAGO(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://www.ago.ca/api/collection/search?q=${encodeURIComponent(keyword)}&limit=${limit}&type=artwork`,
        { signal }
      );
      if (!res.ok) throw new Error("AGO failed");
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.results || data.items || [];
      return items.filter((item) => item.image || item.image_url || item.imageUrl).map((item) => ({
        id: `ago_${String(item.id || "").replace(/[^a-z0-9]/gi, "_")}`,
        url: item.image || item.image_url || item.imageUrl,
        thumb: item.image || item.image_url || item.imageUrl,
        title: item.title || "AGO Object",
        description: item.artist || item.maker || "",
        year: (item.date || item.dated || "").match(/\d{4}/)?.[0] || null,
        source: "ago",
        sourceUrl: `https://www.ago.ca/collection`,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      return [];
    }
  }
  async function fetchPEM(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://www.pem.org/api/collection/search?q=${encodeURIComponent(keyword)}&hasImage=true&limit=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("PEM failed");
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.results || data.items || [];
      return items.filter((item) => item.image || item.image_url || item.imageUrl).map((item) => ({
        id: `pem_${String(item.id || "").replace(/[^a-z0-9]/gi, "_")}`,
        url: item.image || item.image_url || item.imageUrl,
        thumb: item.image || item.image_url || item.imageUrl,
        title: item.title || "PEM Object",
        description: item.artist || item.maker || "",
        year: (item.date || item.dated || "").match(/\d{4}/)?.[0] || null,
        source: "pem",
        sourceUrl: `https://www.pem.org/collections`,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      return [];
    }
  }
  async function fetchNPG(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://www.npg.org.uk/api/search?query=${encodeURIComponent(keyword)}&hasImage=true&limit=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("NPG failed");
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.results || data.items || [];
      return items.filter((item) => item.image || item.primaryImage || item.imageUrl).map((item) => ({
        id: `npg_${String(item.id || "").replace(/[^a-z0-9]/gi, "_")}`,
        url: item.image || item.primaryImage || item.imageUrl,
        thumb: item.image || item.primaryImage || item.imageUrl,
        title: item.title || "NPG Portrait",
        description: item.sitter || item.artist || "",
        year: (item.date || item.dated || "").match(/\d{4}/)?.[0] || null,
        source: "npg",
        sourceUrl: `https://www.npg.org.uk/collections`,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      return [];
    }
  }
  async function fetchLouvreAD(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://www.louvreabudhabi.ae/api/collection/search?q=${encodeURIComponent(keyword)}&hasImage=true&limit=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("LouvreAD failed");
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.results || data.items || [];
      return items.filter((item) => item.image || item.image_url || item.imageUrl).map((item) => ({
        id: `louvread_${String(item.id || "").replace(/[^a-z0-9]/gi, "_")}`,
        url: item.image || item.image_url || item.imageUrl,
        thumb: item.image || item.image_url || item.imageUrl,
        title: item.title || "Louvre AD Object",
        description: item.artist || item.maker || "",
        year: (item.date || item.dated || "").match(/\d{4}/)?.[0] || null,
        source: "louvread",
        sourceUrl: `https://www.louvreabudhabi.ae/en/collections`,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      return [];
    }
  }
  async function fetchUnsplash(keyword, limit, signal) {
    if (!STATE.unsplashKey) return [];
    try {
      const res = await safeFetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=${Math.min(limit, 30)}&client_id=${STATE.unsplashKey}`,
        { signal }
      );
      if (!res.ok) throw new Error("Unsplash failed");
      const data = await res.json();
      return (data.results || []).filter((p) => p.urls?.regular).map((p) => ({
        id: `unsplash_${p.id}`,
        url: p.urls.regular,
        thumb: p.urls.small || p.urls.regular,
        title: p.description || p.alt_description || "Unsplash Photo",
        description: p.user?.name ? `Photo by ${p.user.name}` : "",
        source: "unsplash",
        sourceUrl: p.links?.html || "",
        year: p.created_at ? p.created_at.slice(0, 4) : null,
        tags: (p.tags || []).map((t) => t.title || t.type || "").filter(Boolean),
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Unsplash failed:", e.message);
      return [];
    }
  }
  async function fetchBodleian(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://digital.bodleian.ox.ac.uk/api/v1/search/?q=${encodeURIComponent(keyword)}&rows=${limit}&start=0&t=image`,
        { signal }
      );
      if (!res.ok) throw new Error("Bodleian failed");
      const data = await res.json();
      return (data.objects || []).filter((obj) => obj.thumbnail || obj.thumbnail_url).map((obj) => ({
        id: `bodleian_${String(obj.pk || obj.id || Math.random()).replace(/[^a-z0-9]/gi, "_")}`,
        url: obj.thumbnail || obj.thumbnail_url,
        thumb: obj.thumbnail || obj.thumbnail_url,
        title: obj.name || obj.label || obj.title || "Bodleian Object",
        description: (obj.description || obj.subjects?.join(", ") || "").slice(0, 200),
        source: "bodleian",
        sourceUrl: obj.links?.self || `https://digital.bodleian.ox.ac.uk/objects/${obj.pk || obj.id}/`,
        year: String(obj.date || obj.year || "").match(/\d{4}/)?.[0] || null,
        tags: (obj.subjects || obj.topics || []).map((s) => String(s).toLowerCase()),
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("Bodleian failed:", e.message);
      return [];
    }
  }
  async function fetchBSB(keyword, limit, signal) {
    try {
      const res = await safeFetch(
        `https://api.digitale-sammlungen.de/search/v1/json?q=${encodeURIComponent(keyword)}&size=${limit}&page=0`,
        { signal }
      );
      if (!res.ok) throw new Error("BSB failed");
      const data = await res.json();
      const items = data.hits?.items || data.results || [];
      return items.filter((item) => item.thumbnail_url || item.image_url).map((item) => ({
        id: `bsb_${String(item.id || Math.random()).replace(/[^a-z0-9]/gi, "_")}`,
        url: item.thumbnail_url || item.image_url,
        thumb: item.thumbnail_url || item.image_url,
        title: item.title || item.name || "BSB Object",
        description: item.subtitle || item.origin || "",
        source: "bsb",
        sourceUrl: item.link || `https://www.digitale-sammlungen.de/en/view/bsb${item.id}`,
        year: String(item.year || item.date || "").match(/\d{4}/)?.[0] || null,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("BSB failed:", e.message);
      return [];
    }
  }
  async function fetchCUDL(keyword, limit, signal) {
    const cached = await fetchFromDataCache("cudl", keyword);
    if (cached) return cached;
    try {
      const res = await safeFetch(
        `https://services.cudl.lib.cam.ac.uk/v1/search?query=${encodeURIComponent(keyword)}&start=1&end=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error("CUDL failed");
      const data = await res.json();
      const items = data.results?.items || data.items || [];
      return items.filter((item) => item.thumbnailUrl || item.thumbnail).map((item) => {
        const thumb = item.thumbnailUrl || item.thumbnail || "";
        return {
          id: `cudl_${String(item.fileID || item.id || Math.random()).replace(/[^a-z0-9]/gi, "_")}`,
          url: thumb,
          thumb,
          title: item.title || (item.descriptiveMetadata?.[0]?.title?.["#text"] ?? "CUDL Object"),
          description: "",
          source: "cudl",
          sourceUrl: `https://cudl.lib.cam.ac.uk/view/${item.fileID || item.id}`,
          year: null,
          tags: [],
          colors: [],
          aiTags: []
        };
      }).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn("CUDL failed:", e.message);
      return [];
    }
  }
  async function fetchArchiveCollection(collection, keyword, limit, signal) {
    try {
      const url = `https://archive.org/advancedsearch.php?q=collection:(${encodeURIComponent(collection)})+AND+(${encodeURIComponent(keyword)})&fl=identifier,title,description&output=json&rows=${limit}&sort=downloads+desc`;
      const res = await safeFetch(url, { signal });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.response?.docs || []).map((doc) => ({
        id: `ia_${collection}_${doc.identifier}`,
        url: `https://archive.org/services/img/${encodeURIComponent(doc.identifier)}`,
        thumb: `https://archive.org/services/img/${encodeURIComponent(doc.identifier)}`,
        title: doc.title || "Archive.org item",
        description: doc.description ? String(Array.isArray(doc.description) ? doc.description[0] : doc.description).slice(0, 200) : "",
        source: "ia_" + collection,
        sourceUrl: `https://archive.org/details/${encodeURIComponent(doc.identifier)}`,
        year: null,
        tags: [],
        colors: [],
        aiTags: []
      })).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      return [];
    }
  }
  async function fetchIIIFCollection(config, keyword, limit, signal) {
    try {
      const qp = config.queryParam || "q";
      let extraParams = config.extraParams || "";
      const hasPerPage = /(^|&)per_page=/.test(extraParams);
      if (hasPerPage) {
        extraParams = extraParams.replace(/(^|&)per_page=[^&]*/g, `$1per_page=${String(limit)}`);
      }
      if (extraParams.includes("{limit}")) {
        extraParams = extraParams.replace(/\{limit\}/g, String(limit));
      }
      const extra = extraParams ? `&${extraParams}` : "";
      const limitParam = hasPerPage ? "" : `&limit=${limit}`;
      const url = `${config.endpoint}?${qp}=${encodeURIComponent(keyword)}${limitParam}${extra}`;
      const res = await safeFetch(url, { signal });
      if (!res.ok) throw new Error(`IIIF ${config.id} failed`);
      const data = await res.json();
      let items = data;
      const rp = config.resultsPath;
      if (rp !== "$") {
        for (const key of (rp || "resources").split(".")) {
          items = items?.[key];
          if (!items) break;
        }
      }
      if (!Array.isArray(items)) return [];
      const getField = (obj, path) => {
        let v = obj;
        for (const k of path.split(".")) {
          v = v?.[k];
          if (v == null) break;
        }
        return v;
      };
      return items.filter((item) => getField(item, config.imageField || "thumbnail")).map((item, i) => {
        const rawImg = getField(item, config.imageField || "thumbnail") || "";
        let imgUrl = config.imageBaseUrl && rawImg && !rawImg.startsWith("http") ? config.imageBaseUrl + rawImg : rawImg;
        if (config.imageUrlTemplate && rawImg && !imgUrl.startsWith("http")) {
          imgUrl = config.imageUrlTemplate.replace("{id}", rawImg);
          if (config.imageBaseUrl && imgUrl && !imgUrl.startsWith("http")) {
            imgUrl = config.imageBaseUrl + imgUrl;
          }
        }
        const rawThumb = getField(item, config.thumbField || config.imageField || "thumbnail") || rawImg;
        let thumbUrl = config.imageBaseUrl && rawThumb && !rawThumb.startsWith("http") ? config.imageBaseUrl + rawThumb : rawThumb;
        if (config.imageUrlTemplate && rawThumb && !thumbUrl.startsWith("http")) {
          thumbUrl = config.imageUrlTemplate.replace("{id}", rawThumb);
          if (config.imageBaseUrl && thumbUrl && !thumbUrl.startsWith("http")) {
            thumbUrl = config.imageBaseUrl + thumbUrl;
          }
        }
        thumbUrl = thumbUrl || imgUrl;
        return {
          id: `${config.id}_${i}_${String(getField(item, "@id") || i).replace(/[^a-z0-9]/gi, "_").slice(-20)}`,
          url: String(imgUrl),
          thumb: String(thumbUrl),
          title: String(getField(item, config.titleField || "label") || "Untitled"),
          description: String(getField(item, config.descField || "") || ""),
          source: config.id,
          sourceUrl: String(getField(item, config.sourceUrlField || "@id") || ""),
          year: null,
          tags: [],
          colors: [],
          aiTags: []
        };
      }).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn(`IIIF ${config.id} failed:`, e.message);
      return [];
    }
  }
  async function fetchIIIFSearch(config, keyword, limit, signal) {
    try {
      const qp = config.queryParam || "q";
      const url = `${config.endpoint}?${qp}=${encodeURIComponent(keyword)}&limit=${limit}`;
      const res = await safeFetch(url, { signal });
      if (!res.ok) throw new Error(`IIIF Search ${config.id} failed: ${res.status}`);
      const data = await res.json();
      let items = data.resources || data.items || [];
      if (!Array.isArray(items)) return [];
      const getField = (obj, path) => {
        if (!path || !obj) return void 0;
        let v = obj;
        for (const k of path.split(".")) {
          v = v?.[k];
          if (v == null) break;
        }
        return v;
      };
      return items.filter((item) => {
        const imgUrl = item.resource?.["@id"] || item.body?.["@id"] || item["@id"];
        return imgUrl && (imgUrl.includes("image") || imgUrl.includes("iiif") || imgUrl.endsWith(".jpg") || imgUrl.endsWith(".png"));
      }).map((item, i) => {
        const imgUrl = item.resource?.["@id"] || item.body?.["@id"] || item["@id"] || "";
        const title = item.resource?.label || item.body?.label || item.label || item.chars && item.chars.substring(0, 100) || "IIIF Search Result";
        const sourceUrl = item.on || item.target?.["@id"] || "";
        const description = item.description || item.body?.value || "";
        return {
          id: `${config.id}_${i}_${String(sourceUrl).replace(/[^a-z0-9]/gi, "_").slice(-20)}`,
          url: String(imgUrl),
          thumb: String(imgUrl),
          // IIIF typically provides good thumbnails
          title: String(title),
          description: String(description),
          source: config.id,
          sourceUrl: String(sourceUrl),
          year: null,
          tags: [],
          colors: [],
          aiTags: []
        };
      }).filter(isLikelyReal).slice(0, limit);
    } catch (e) {
      if (e.name === "AbortError") return [];
      console.warn(`IIIF Search ${config.id} failed:`, e.message);
      return [];
    }
  }
  ADAPTERS.europeana_provider = (cfg, kw, lim, sig) => fetchEuropeanaFiltered(cfg.filterParam, cfg.filterValue, kw, lim, sig, cfg.extra || "");
  ADAPTERS.dpla_hub = (cfg, kw, lim, sig) => fetchDPLAProvider(cfg.provider, kw, lim, sig);
  ADAPTERS.smithsonian_unit = (cfg, kw, lim, sig) => fetchSmithsonianUnit(cfg.code, kw, lim, sig);
  ADAPTERS.wikimedia_category = (cfg, kw, lim, sig) => fetchWikimediaCategory(cfg.cat, kw, lim, sig);
  ADAPTERS.archive_collection = (cfg, kw, lim, sig) => fetchArchiveCollection(cfg.collection, kw, lim, sig);
  ADAPTERS.iiif_collection = (cfg, kw, lim, sig) => fetchIIIFCollection(cfg, kw, lim, sig);
  ADAPTERS.iiif_content_search = (cfg, kw, lim, sig) => fetchIIIFSearch(cfg, kw, lim, sig);

  // src/app.js
  async function fetchAll(keywords, totalCount, isSilent = false) {
    let signal;
    if (isSilent) {
      const localAC = new AbortController();
      signal = localAC.signal;
    } else {
      if (STATE.abortController) STATE.abortController.abort();
      if (_healthWriteTimer) {
        clearTimeout(_healthWriteTimer);
        _flushSourceHealth();
      }
      STATE.abortController = new AbortController();
      signal = STATE.abortController.signal;
    }
    const keyword = keywords[0];
    const altKeyword = keywords[1] || keyword;
    const alt2 = keywords[2] || altKeyword;
    const dynamicActive = selectDynamicSources(keyword, 150).length;
    const PRODUCTIVE_SOURCE_ESTIMATE = Math.max(60, 60 + Math.floor(dynamicActive * 0.4));
    const perSource = Math.max(2, Math.ceil(totalCount / PRODUCTIVE_SOURCE_ESTIMATE));
    const fetchBatch = perSource + 4;
    const limitFor = (id) => Math.max(fetchBatch, CONSTANTS.PER_SOURCE_LIMIT[id] ?? 0);
    const seenIds = /* @__PURE__ */ new Set();
    const seenUrls = /* @__PURE__ */ new Set();
    const all = [];
    const exactQueryClass = classifyQuery(keyword);
    _fetchSemaphore._totalFailed = 0;
    for (const key of Object.keys(STATE.sourceHealth)) {
      const h = STATE.sourceHealth[key];
      h.misses = Math.floor(h.misses / 2);
      if (h.misses < CONSTANTS.HEALTH_MISS_LIMIT && h._notified) {
        h._notified = false;
      }
    }
    updateSourcesActiveCounter();
    const sourceHitThisSearch = /* @__PURE__ */ new Set();
    const onSourceResult = (sourceName) => (items) => {
      if (signal.aborted) return;
      const rawCount = (items || []).length;
      if (rawCount > 0) {
        sourceHitThisSearch.add(sourceName);
        recordSourceResult(sourceName, rawCount);
      } else if (!sourceHitThisSearch.has(sourceName)) {
        recordSourceResult(sourceName, 0);
      }
      updateSourcesActiveCounter();
      if (STATE.searchMode === "exact" && items && items.length) {
        const terms = keyword.toLowerCase().trim().split(/\s+/).filter(Boolean);
        items = items.filter((item) => {
          const hay = `${item.title || ""} ${item.description || ""} ${(item.tags || []).join(" ")}`.toLowerCase();
          return terms.some((t) => hay.includes(t));
        });
      }
      if (!items || !items.length) return;
      const fresh = items.filter((item) => !seenIds.has(item.id) && !seenUrls.has(item.url));
      fresh.forEach((item) => {
        seenIds.add(item.id);
        if (item.url) seenUrls.add(item.url);
      });
      all.push(...fresh);
      const preview = STATE.searchMode === "exact" ? getDisplayResults(fresh, STATE.query) : shuffle2(fresh.slice(0, perSource));
      renderGrid(preview);
    };
    await Promise.allSettled([
      // ── Batch 1 ────────────────────────────────────────────
      callIfHealthy("wikimedia", fetchWikimedia(keyword, limitFor("wikimedia"), signal)).then(onSourceResult("wikimedia")).catch(() => {
      }),
      callIfHealthy("wikimedia", fetchWikimedia("Featured_picture " + keyword, limitFor("wikimedia"), signal)).then(onSourceResult("wikimedia")).catch(() => {
      }),
      callIfHealthy("met", fetchMet(keywords.join(" "), limitFor("met"), signal)).then(onSourceResult("met")).catch(() => {
      }),
      callIfHealthy("archive", fetchArchive(altKeyword, limitFor("archive"), signal)).then(onSourceResult("archive")).catch(() => {
      }),
      skipInExactMode("nasa", exactQueryClass) ? Promise.resolve() : callIfHealthy("nasa", fetchNASA(keyword, fetchBatch, signal)).then(onSourceResult("nasa")).catch(() => {
      }),
      skipInExactMode("inaturalist", exactQueryClass) ? Promise.resolve() : callIfHealthy("inaturalist", fetchINaturalist(keyword, limitFor("inaturalist"), signal)).then(onSourceResult("inaturalist")).catch(() => {
      }),
      callIfHealthy("loc", fetchLOC(keyword, limitFor("loc"), signal)).then(onSourceResult("loc")).catch(() => {
      }),
      callIfHealthy("openlibrary", fetchOpenLibrary(keyword, fetchBatch, signal)).then(onSourceResult("openlibrary")).catch(() => {
      }),
      callIfHealthy("chicago", fetchChicagoArt(keyword, limitFor("chicago"), signal)).then(onSourceResult("chicago")).catch(() => {
      }),
      callIfHealthy("cleveland", fetchCleveland(keyword, limitFor("cleveland"), signal)).then(onSourceResult("cleveland")).catch(() => {
      }),
      callIfHealthy("va", fetchVA(keyword, limitFor("va"), signal)).then(onSourceResult("va")).catch(() => {
      }),
      callIfHealthy("wikiart", fetchWikiArt(keyword, fetchBatch, signal)).then(onSourceResult("wikiart")).catch(() => {
      }),
      callIfHealthy("nordic", fetchNordicMuseum(keyword, fetchBatch, signal)).then(onSourceResult("nordic")).catch(() => {
      }),
      callIfHealthy("flickr", fetchFlickrCommons(keyword, fetchBatch, signal)).then(onSourceResult("flickr")).catch(() => {
      }),
      callIfHealthy("europeana", fetchEuropeana(keyword, fetchBatch, signal)).then(onSourceResult("europeana")).catch(() => {
      }),
      callIfHealthy("europeana", fetchEuropeana(alt2, fetchBatch, signal)).then(onSourceResult("europeana")).catch(() => {
      }),
      callIfHealthy("europeana", fetchEuropeana(keyword + " fashion", fetchBatch, signal)).then(onSourceResult("europeana")).catch(() => {
      }),
      callIfHealthy("europeana", fetchEuropeana(keyword + " textile costume", fetchBatch, signal)).then(onSourceResult("europeana")).catch(() => {
      }),
      callIfHealthy("rijksmuseum", fetchRijksmuseum(keyword, fetchBatch, signal)).then(onSourceResult("rijksmuseum")).catch(() => {
      }),
      callIfHealthy("harvard", fetchHarvard(keyword, fetchBatch, signal)).then(onSourceResult("harvard")).catch(() => {
      }),
      callIfHealthy("smithsonian", fetchSmithsonian(keyword, fetchBatch, signal)).then(onSourceResult("smithsonian")).catch(() => {
      }),
      callIfHealthy("pexels", fetchPexels(keyword, fetchBatch, signal)).then(onSourceResult("pexels")).catch(() => {
      }),
      callIfHealthy("pixabay", fetchPixabay(keyword, fetchBatch, signal)).then(onSourceResult("pixabay")).catch(() => {
      }),
      // ── Batch 2 ────────────────────────────────────────────
      callIfHealthy("getty", fetchGetty(keyword, fetchBatch, signal)).then(onSourceResult("getty")).catch(() => {
      }),
      callIfHealthy("nga", fetchNGA(keyword, limitFor("nga"), signal)).then(onSourceResult("nga")).catch(() => {
      }),
      skipInExactMode("gbif", exactQueryClass) ? Promise.resolve() : callIfHealthy("gbif", fetchGBIF(keyword, limitFor("gbif"), signal)).then(onSourceResult("gbif")).catch(() => {
      }),
      skipInExactMode("eol", exactQueryClass) ? Promise.resolve() : callIfHealthy("eol", fetchEOL(keyword, fetchBatch, signal)).then(onSourceResult("eol")).catch(() => {
      }),
      skipInExactMode("apod", exactQueryClass) ? Promise.resolve() : callIfHealthy("apod", fetchAPOD(keyword, fetchBatch, signal)).then(onSourceResult("apod")).catch(() => {
      }),
      callIfHealthy("gallica", fetchGallica(keyword, fetchBatch, signal)).then(onSourceResult("gallica")).catch(() => {
      }),
      callIfHealthy("chronicling", fetchChroniclingAmerica(keyword, fetchBatch, signal)).then(onSourceResult("chronicling")).catch(() => {
      }),
      callIfHealthy("openverse", fetchOpenverse(keyword, fetchBatch, signal)).then(onSourceResult("openverse")).catch(() => {
      }),
      callIfHealthy("trove", fetchTrove(keyword, fetchBatch, signal)).then(onSourceResult("trove")).catch(() => {
      }),
      callIfHealthy("digitalnz", fetchDigitalNZ(keyword, fetchBatch, signal)).then(onSourceResult("digitalnz")).catch(() => {
      }),
      callIfHealthy("bhl", fetchBHL(keyword, fetchBatch, signal)).then(onSourceResult("bhl")).catch(() => {
      }),
      callIfHealthy("carnegie", fetchCarnegie(keyword, fetchBatch, signal)).then(onSourceResult("carnegie")).catch(() => {
      }),
      callIfHealthy("prado", fetchPrado(keyword, fetchBatch, signal)).then(onSourceResult("prado")).catch(() => {
      }),
      callIfHealthy("parismusees", fetchParisMusees(keyword, fetchBatch, signal)).then(onSourceResult("parismusees")).catch(() => {
      }),
      callIfHealthy("yale", fetchYale(keyword, fetchBatch, signal)).then(onSourceResult("yale")).catch(() => {
      }),
      callIfHealthy("picsum", fetchPicsum(keyword, fetchBatch, signal)).then(onSourceResult("picsum")).catch(() => {
      }),
      callIfHealthy("usgs", fetchUSGS(keyword, fetchBatch, signal)).then(onSourceResult("usgs")).catch(() => {
      }),
      callIfHealthy("cooperhewitt", fetchCooperHewitt(keyword, fetchBatch, signal)).then(onSourceResult("cooperhewitt")).catch(() => {
      }),
      // ── Batch 3 ────────────────────────────────────────────
      callIfHealthy("tate", fetchTate(keyword, fetchBatch, signal)).then(onSourceResult("tate")).catch(() => {
      }),
      callIfHealthy("finna", fetchFinna(keyword, fetchBatch, signal)).then(onSourceResult("finna")).catch(() => {
      }),
      callIfHealthy("soch", fetchSOCH(keyword, fetchBatch, signal)).then(onSourceResult("soch")).catch(() => {
      }),
      callIfHealthy("joconde", fetchJoconde(keyword, fetchBatch, signal)).then(onSourceResult("joconde")).catch(() => {
      }),
      callIfHealthy("mnw", fetchMNW(keyword, fetchBatch, signal)).then(onSourceResult("mnw")).catch(() => {
      }),
      callIfHealthy("tepapa", fetchTePapa(keyword, fetchBatch, signal)).then(onSourceResult("tepapa")).catch(() => {
      }),
      callIfHealthy("dpla", fetchDPLA(keyword, fetchBatch, signal)).then(onSourceResult("dpla")).catch(() => {
      }),
      callIfHealthy("ddb", fetchDDB(keyword, fetchBatch, signal)).then(onSourceResult("ddb")).catch(() => {
      }),
      callIfHealthy("artsy", fetchArtsy(keyword, fetchBatch, signal)).then(onSourceResult("artsy")).catch(() => {
      }),
      callIfHealthy("pas", fetchPAS(keyword, fetchBatch, signal)).then(onSourceResult("pas")).catch(() => {
      }),
      callIfHealthy("smg", fetchSMG(keyword, fetchBatch, signal)).then(onSourceResult("smg")).catch(() => {
      }),
      callIfHealthy("auckland", fetchAuckland(keyword, fetchBatch, signal)).then(onSourceResult("auckland")).catch(() => {
      }),
      callIfHealthy("photogrammar", fetchPhotogrammar(keyword, fetchBatch, signal)).then(onSourceResult("photogrammar")).catch(() => {
      }),
      callIfHealthy("wellcome", fetchWellcome(keyword, fetchBatch, signal)).then(onSourceResult("wellcome")).catch(() => {
      }),
      callIfHealthy("maas", fetchMAAS(keyword, fetchBatch, signal)).then(onSourceResult("maas")).catch(() => {
      }),
      callIfHealthy("smk", fetchSMK(keyword, fetchBatch, signal)).then(onSourceResult("smk")).catch(() => {
      }),
      callIfHealthy("thyssen", fetchThyssen(keyword, fetchBatch, signal)).then(onSourceResult("thyssen")).catch(() => {
      }),
      // ── C17: WDL (extra LOC call) ──────────────────────────
      callIfHealthy("wdl", fetchLOC("wdl " + keyword, fetchBatch, signal).then((r) => r.map((i) => ({ ...i, source: "wdl", id: i.id.replace("loc_", "wdl_") })))).then(onSourceResult("wdl")).catch(() => {
      }),
      // ── C18: Wikimedia Artwork extra calls ─────────────────
      callIfHealthy("wikimedia", fetchWikimedia("Artwork " + keyword, limitFor("wikimedia"), signal)).then(onSourceResult("wikimedia")).catch(() => {
      }),
      callIfHealthy("wikimedia", fetchWikimedia(keyword + " painting", limitFor("wikimedia"), signal)).then(onSourceResult("wikimedia")).catch(() => {
      }),
      // ── Batch 4 — new sources ──────────────────────────────
      callIfHealthy("walters", fetchWalters(keyword, perSource + 4, signal)).then(onSourceResult("walters")).catch(() => {
      }),
      callIfHealthy("princeton", fetchPrinceton(keyword, perSource + 4, signal)).then(onSourceResult("princeton")).catch(() => {
      }),
      callIfHealthy("wikidata", fetchWikidata(keyword, perSource + 4, signal)).then(onSourceResult("wikidata")).catch(() => {
      }),
      skipInExactMode("noaa", exactQueryClass) ? Promise.resolve() : callIfHealthy("noaa", fetchNOAA(keyword, perSource + 4, signal)).then(onSourceResult("noaa")).catch(() => {
      }),
      skipInExactMode("hubble", exactQueryClass) ? Promise.resolve() : callIfHealthy("hubble", fetchHubble(keyword, perSource + 4, signal)).then(onSourceResult("hubble")).catch(() => {
      }),
      callIfHealthy("cornell", fetchCornell(keyword, perSource + 4, signal)).then(onSourceResult("cornell")).catch(() => {
      }),
      callIfHealthy("folger", fetchFolger(keyword, perSource + 4, signal)).then(onSourceResult("folger")).catch(() => {
      }),
      callIfHealthy("onb", fetchONB(keyword, perSource + 4, signal)).then(onSourceResult("onb")).catch(() => {
      }),
      callIfHealthy("nypl", fetchNYPL(keyword, perSource + 4, signal)).then(onSourceResult("nypl")).catch(() => {
      }),
      callIfHealthy("mak", fetchMAK(keyword, perSource + 4, signal)).then(onSourceResult("mak")).catch(() => {
      }),
      callIfHealthy("mna", fetchMNA(keyword, perSource + 4, signal)).then(onSourceResult("mna")).catch(() => {
      }),
      // ── Batch 4 — extra calls (reusing existing functions) ─
      callIfHealthy("louvre", fetchJoconde(keyword + " Louvre", perSource + 4, signal).then((r) => r.map((i) => ({ ...i, id: i.id.replace("joconde_", "louvre_"), source: "louvre" })))).then(onSourceResult("louvre")).catch(() => {
      }),
      callIfHealthy("rijksmuseum", fetchRijksmuseum(keyword + " drawing", perSource + 4, signal)).then(onSourceResult("rijksmuseum")).catch(() => {
      }),
      callIfHealthy("rijksmuseum", fetchRijksmuseum(keyword + " print", perSource + 4, signal)).then(onSourceResult("rijksmuseum")).catch(() => {
      }),
      callIfHealthy("bhl", fetchBHL("illustrated " + keyword, perSource + 4, signal)).then(onSourceResult("bhl")).catch(() => {
      }),
      callIfHealthy("smithsonian", fetchSmithsonian(keyword + " photograph", perSource + 4, signal)).then(onSourceResult("smithsonian")).catch(() => {
      }),
      callIfHealthy("archive", fetchArchive(keyword + " visual art", limitFor("archive"), signal)).then(onSourceResult("archive")).catch(() => {
      }),
      callIfHealthy("wikimedia", fetchWikimedia(keyword + " filetype:bitmap", limitFor("wikimedia"), signal)).then(onSourceResult("wikimedia")).catch(() => {
      }),
      // ── Batch 7 ────────────────────────────────────────────
      callIfHealthy("mia", fetchMia(keyword, perSource + 2, signal)).then(onSourceResult("mia")).catch(() => {
      }),
      callIfHealthy("lacma", fetchLACMA(keyword, perSource + 2, signal)).then(onSourceResult("lacma")).catch(() => {
      }),
      callIfHealthy("munch", fetchMunch(keyword, perSource + 2, signal)).then(onSourceResult("munch")).catch(() => {
      }),
      callIfHealthy("mauritshuis", fetchMauritshuis(keyword, perSource + 2, signal)).then(onSourceResult("mauritshuis")).catch(() => {
      }),
      callIfHealthy("nationalmuseumse", fetchNationalmuseumSE(keyword, perSource + 2, signal)).then(onSourceResult("nationalmuseumse")).catch(() => {
      }),
      skipInExactMode("naturalis", exactQueryClass) ? Promise.resolve() : callIfHealthy("naturalis", fetchNaturalis(keyword, perSource + 2, signal)).then(onSourceResult("naturalis")).catch(() => {
      }),
      callIfHealthy("nmaahc", fetchNMAAHC(keyword, perSource + 2, signal)).then(onSourceResult("nmaahc")).catch(() => {
      }),
      callIfHealthy("nasm", fetchNASM(keyword, perSource + 2, signal)).then(onSourceResult("nasm")).catch(() => {
      }),
      callIfHealthy("whitney", fetchWhitney(keyword, perSource + 2, signal)).then(onSourceResult("whitney")).catch(() => {
      }),
      skipInExactMode("nationalzoo", exactQueryClass) ? Promise.resolve() : callIfHealthy("nationalzoo", fetchNationalZoo(keyword, perSource + 2, signal)).then(onSourceResult("nationalzoo")).catch(() => {
      }),
      skipInExactMode("gbiflit", exactQueryClass) ? Promise.resolve() : callIfHealthy("gbiflit", fetchGBIFLiterature(keyword, perSource + 2, signal)).then(onSourceResult("gbiflit")).catch(() => {
      }),
      callIfHealthy("freersackler", fetchFreerSackler(keyword, perSource + 2, signal)).then(onSourceResult("freersackler")).catch(() => {
      }),
      callIfHealthy("archive", fetchArchiveMaps(keyword, perSource + 2, signal)).then(onSourceResult("archive")).catch(() => {
      }),
      callIfHealthy("openlibrary", fetchOpenLibrarySubjects(keyword, perSource + 2, signal)).then(onSourceResult("openlibrary")).catch(() => {
      }),
      callIfHealthy("ago", fetchAGO(keyword, perSource + 2, signal)).then(onSourceResult("ago")).catch(() => {
      }),
      callIfHealthy("pem", fetchPEM(keyword, perSource + 2, signal)).then(onSourceResult("pem")).catch(() => {
      }),
      callIfHealthy("npg", fetchNPG(keyword, perSource + 2, signal)).then(onSourceResult("npg")).catch(() => {
      }),
      callIfHealthy("louvread", fetchLouvreAD(keyword, perSource + 2, signal)).then(onSourceResult("louvread")).catch(() => {
      }),
      // ── Batch 7 — extra calls (reusing existing functions) ─
      callIfHealthy("met", fetchMet("heilbrunn " + keyword, perSource + 2, signal)).then(onSourceResult("met")).catch(() => {
      }),
      callIfHealthy("nmaahc", fetchNMAAHC(keyword + " photograph", perSource + 2, signal)).then(onSourceResult("nmaahc")).catch(() => {
      }),
      callIfHealthy("cooperhewitt", fetchCooperHewitt(keyword + " textile pattern", perSource + 2, signal)).then(onSourceResult("cooperhewitt")).catch(() => {
      }),
      callIfHealthy("wikimedia", fetchWikimedia("incategory:Drawings " + keyword, perSource + 2, signal)).then(onSourceResult("wikimedia")).catch(() => {
      }),
      callIfHealthy("wellcome", fetchWellcome(keyword + " illustration", perSource + 2, signal)).then(onSourceResult("wellcome")).catch(() => {
      }),
      // ── Phase 2 — new sources ─────────────────────────────
      callIfHealthy("unsplash", fetchUnsplash(keyword, perSource + 2, signal)).then(onSourceResult("unsplash")).catch(() => {
      }),
      callIfHealthy("bodleian", fetchBodleian(keyword, perSource + 2, signal)).then(onSourceResult("bodleian")).catch(() => {
      }),
      callIfHealthy("bsb", fetchBSB(keyword, perSource + 2, signal)).then(onSourceResult("bsb")).catch(() => {
      }),
      callIfHealthy("cudl", fetchCUDL(keyword, perSource + 2, signal)).then(onSourceResult("cudl")).catch(() => {
      }),
      // ── Phase 2 — manifest-loaded IIIF sources (injected dynamically) ─
      ...(STATE.manifestSources || []).map((cfg) => {
        const adapterFunc = cfg.adapter === "iiif_content_search" ? fetchIIIFSearch : fetchIIIFCollection;
        return callIfHealthy(cfg.id, adapterFunc(cfg, keyword, perSource + 2, signal).then((r) => r.map((i) => ({ ...i, source: i.source || cfg.id })))).then(onSourceResult(cfg.id)).catch(() => {
        });
      }),
      // ── Phase A — Europeana sub-collections (20) ─────────────────────────
      ...Object.entries(EUROPEANA_PROVIDERS).map(
        ([id, cfg]) => callIfHealthy(id, fetchEuropeanaFiltered(cfg.filterParam, cfg.filterValue, keyword, Math.max(2, Math.ceil(perSource / 3)), signal, cfg.extra || "").then((r) => r.map((i) => ({ ...i, source: id })))).then(onSourceResult(id)).catch(() => {
        })
      ),
      // ── Phase A — DPLA hub sub-collections (15) ─────────────────────────
      ...Object.entries(DPLA_HUBS).map(
        ([id, cfg]) => callIfHealthy(id, fetchDPLAProvider(cfg.provider, keyword, Math.max(2, Math.ceil(perSource / 3)), signal).then((r) => r.map((i) => ({ ...i, source: id })))).then(onSourceResult(id)).catch(() => {
        })
      ),
      // ── Phase A — Smithsonian sub-museums (15) ──────────────────────────
      ...Object.entries(SI_UNITS).map(
        ([id, cfg]) => callIfHealthy(id, fetchSmithsonianUnit(cfg.code, keyword, Math.max(2, Math.ceil(perSource / 3)), signal).then((r) => r.map((i) => ({ ...i, source: id })))).then(onSourceResult(id)).catch(() => {
        })
      ),
      // ── Phase A — Wikimedia category filters (10) ─────────────────────────
      ...Object.entries(WIKIMEDIA_CATS).map(
        ([id, cfg]) => callIfHealthy(id, fetchWikimediaCategory(cfg.cat, keyword, Math.max(2, Math.ceil(perSource / 2)), signal).then((r) => r.map((i) => ({ ...i, source: id })))).then(onSourceResult(id)).catch(() => {
        })
      ),
      // ── Phase B — zero-auth free APIs ────────────────────────────────────
      skipInExactMode("idigbio", exactQueryClass) ? Promise.resolve() : callIfHealthy("idigbio", fetchIDigBio(keyword, Math.max(3, perSource), signal)).then(onSourceResult("idigbio")).catch(() => {
      }),
      skipInExactMode("ala", exactQueryClass) ? Promise.resolve() : callIfHealthy("ala", fetchALA(keyword, Math.max(3, perSource), signal)).then(onSourceResult("ala")).catch(() => {
      }),
      // ── Phase D — niche & specialized ──────────────────────────────────
      callIfHealthy("nasa_images", fetchNASAImages(keyword, Math.max(3, perSource), signal)).then(onSourceResult("nasa_images")).catch(() => {
      }),
      // ── Phase E — CORS-blocked, cache-first ─────────────────────────────
      callIfHealthy("nhm_london", fetchNHMLondon(keyword, Math.max(3, perSource), signal)).then(onSourceResult("nhm_london")).catch(() => {
      }),
      callIfHealthy("wallace_collection", fetchWallaceCollection(keyword, Math.max(3, perSource), signal)).then(onSourceResult("wallace_collection")).catch(() => {
      }),
      callIfHealthy("fitzwilliam", fetchFitzwilliam(keyword, Math.max(3, perSource), signal)).then(onSourceResult("fitzwilliam")).catch(() => {
      }),
      callIfHealthy("national_gallery_london", fetchNationalGalleryLondon(keyword, Math.max(3, perSource), signal)).then(onSourceResult("national_gallery_london")).catch(() => {
      }),
      callIfHealthy("scottish_national", fetchScottishNational(keyword, Math.max(3, perSource), signal)).then(onSourceResult("scottish_national")).catch(() => {
      }),
      callIfHealthy("musee_orsay", fetchMuseeOrsay(keyword, Math.max(3, perSource), signal)).then(onSourceResult("musee_orsay")).catch(() => {
      }),
      callIfHealthy("vangogh_museum", fetchVanGoghMuseum(keyword, Math.max(3, perSource), signal)).then(onSourceResult("vangogh_museum")).catch(() => {
      }),
      callIfHealthy("khm", fetchKHM(keyword, Math.max(3, perSource), signal)).then(onSourceResult("khm")).catch(() => {
      }),
      callIfHealthy("belvedere", fetchBelvedere(keyword, Math.max(3, perSource), signal)).then(onSourceResult("belvedere")).catch(() => {
      }),
      callIfHealthy("staedel", fetchStaedel(keyword, Math.max(3, perSource), signal)).then(onSourceResult("staedel")).catch(() => {
      }),
      callIfHealthy("rmfab", fetchRMFAB(keyword, Math.max(3, perSource), signal)).then(onSourceResult("rmfab")).catch(() => {
      }),
      callIfHealthy("guimet", fetchGuimet(keyword, Math.max(3, perSource), signal)).then(onSourceResult("guimet")).catch(() => {
      }),
      callIfHealthy("npm_taipei", fetchNPMTaipei(keyword, Math.max(3, perSource), signal)).then(onSourceResult("npm_taipei")).catch(() => {
      }),
      // Phase F — Fashion & Textile CORS-blocked sources
      callIfHealthy("galliera", fetchGalliera(keyword, Math.max(3, perSource), signal)).then(onSourceResult("galliera")).catch(() => {
      }),
      callIfHealthy("arts_decoratifs", fetchArtsDecoratifs(keyword, Math.max(3, perSource), signal)).then(onSourceResult("arts_decoratifs")).catch(() => {
      }),
      callIfHealthy("centraal_museum", fetchCentraalMuseum(keyword, Math.max(3, perSource), signal)).then(onSourceResult("centraal_museum")).catch(() => {
      }),
      callIfHealthy("textile_museum_tilburg", fetchTextileMuseum(keyword, Math.max(3, perSource), signal)).then(onSourceResult("textile_museum_tilburg")).catch(() => {
      }),
      callIfHealthy("wereldculturen", fetchWereldculturen(keyword, Math.max(3, perSource), signal)).then(onSourceResult("wereldculturen")).catch(() => {
      }),
      callIfHealthy("dec_arts_prague", fetchDecArtsPrague(keyword, Math.max(3, perSource), signal)).then(onSourceResult("dec_arts_prague")).catch(() => {
      }),
      callIfHealthy("designmuseum_dk", fetchDesignmuseumDK(keyword, Math.max(3, perSource), signal)).then(onSourceResult("designmuseum_dk")).catch(() => {
      }),
      callIfHealthy("boijmans", fetchBoijmans(keyword, Math.max(3, perSource), signal)).then(onSourceResult("boijmans")).catch(() => {
      }),
      callIfHealthy("museu_traje", fetchMuseuTraje(keyword, Math.max(3, perSource), signal)).then(onSourceResult("museu_traje")).catch(() => {
      }),
      // Phase G — Art, Sculpture & History CORS-blocked (14)
      callIfHealthy("kmska", fetchKMSKA(keyword, Math.max(3, perSource), signal)).then(onSourceResult("kmska")).catch(() => {
      }),
      callIfHealthy("amsterdam_museum", fetchAmsterdamMuseum(keyword, Math.max(3, perSource), signal)).then(onSourceResult("amsterdam_museum")).catch(() => {
      }),
      callIfHealthy("ngi", fetchNGI(keyword, Math.max(3, perSource), signal)).then(onSourceResult("ngi")).catch(() => {
      }),
      callIfHealthy("fries_museum", fetchFriesMuseum(keyword, Math.max(3, perSource), signal)).then(onSourceResult("fries_museum")).catch(() => {
      }),
      callIfHealthy("groeninge", fetchGroeninge(keyword, Math.max(3, perSource), signal)).then(onSourceResult("groeninge")).catch(() => {
      }),
      callIfHealthy("groninger", fetchGroninger(keyword, Math.max(3, perSource), signal)).then(onSourceResult("groninger")).catch(() => {
      }),
      callIfHealthy("moma_wd", fetchMoMAWD(keyword, Math.max(3, perSource), signal)).then(onSourceResult("moma_wd")).catch(() => {
      }),
      callIfHealthy("rijksmuseum_twenthe", fetchRijksmuseumTwenthe(keyword, Math.max(3, perSource), signal)).then(onSourceResult("rijksmuseum_twenthe")).catch(() => {
      }),
      callIfHealthy("herzog_anton_ulrich", fetchHerzogAntonUlrich(keyword, Math.max(3, perSource), signal)).then(onSourceResult("herzog_anton_ulrich")).catch(() => {
      }),
      callIfHealthy("galleria_palatina", fetchGalleriaPalatina(keyword, Math.max(3, perSource), signal)).then(onSourceResult("galleria_palatina")).catch(() => {
      }),
      callIfHealthy("lakenhal", fetchLakenhal(keyword, Math.max(3, perSource), signal)).then(onSourceResult("lakenhal")).catch(() => {
      }),
      callIfHealthy("teylers", fetchTeylers(keyword, Math.max(3, perSource), signal)).then(onSourceResult("teylers")).catch(() => {
      }),
      callIfHealthy("alte_pinakothek", fetchAltePinakothek(keyword, Math.max(3, perSource), signal)).then(onSourceResult("alte_pinakothek")).catch(() => {
      }),
      callIfHealthy("quai_branly", fetchQuaiBranly(keyword, Math.max(3, perSource), signal)).then(onSourceResult("quai_branly")).catch(() => {
      }),
      // Phase H — 113 World Museum sources
      ...WD_PHASE_H.map((s) => callIfHealthy(s.id, WD_PHASE_H_FETCHERS[s.id](keyword, Math.max(3, perSource), signal)).then(onSourceResult(s.id)).catch(() => {
      })),
      // ── DYNAMIC REGISTRY — 200+ Wikimedia cats, 40+ Archive.org collections,
      //    4000+ Europeana providers, 4000+ DPLA hubs (when keys set) ──────────
      ...selectDynamicSources(keyword, 150).map((entry) => {
        const adapter = ADAPTERS[entry.adapter];
        if (!adapter) return Promise.resolve();
        return adapter(entry.config, keyword, Math.max(2, Math.ceil(perSource / 3)), signal).then((r) => (r || []).map((i) => ({ ...i, source: i.source || entry.id }))).then(onSourceResult(entry.id)).catch(() => {
        });
      })
    ]);
    if (!isSilent && !all.length) {
      const failedCount = _fetchSemaphore._totalFailed || 0;
      if (failedCount > 10 && !navigator.onLine) {
        showOfflineState();
      } else {
        showEmptyState();
      }
    }
    return all;
  }
  function showLoading(msg = "searching...") {
    document.getElementById("loading-indicator").textContent = msg;
  }
  function hideLoading() {
    document.getElementById("loading-indicator").textContent = "";
  }
  var _toastTimer = null;
  function showToast(msg, duration = 4e3) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("visible");
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove("visible"), duration);
  }
  hooks.showToast = showToast;
  function checkFailedImages() {
    const n = STATE._failedImages || 0;
    if (n > 0) showToast(`${n} image${n > 1 ? "s" : ""} failed to load`);
  }
  var renderedIds = /* @__PURE__ */ new Set();
  function clearGrid() {
    document.getElementById("image-grid").innerHTML = "";
    renderedIds.clear();
    _gridItemMap.clear();
  }
  var _lazyObserver = _createLazyObserver();
  function _createLazyObserver() {
    return new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          delete img.dataset.src;
        }
        _lazyObserver.unobserve(img);
      });
    }, { rootMargin: "200px" });
  }
  function _resetLazyObserver() {
    _lazyObserver.disconnect();
    _lazyObserver = _createLazyObserver();
  }
  function showEmptyState() {
    const grid = document.getElementById("image-grid");
    if (!grid.querySelector(".empty-state")) {
      grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;min-height:calc(100vh - 4px);">
        <p>nothing found \u2014 try different words</p>
        <span>try: texture / light / form / shadow</span>
      </div>`;
    }
  }
  function showOfflineState() {
    const grid = document.getElementById("image-grid");
    grid.innerHTML = `
    <div class="empty-state" style="grid-column:1/-1;min-height:calc(100vh - 4px);">
      <p>you appear to be offline</p>
      <span>check your connection and try again</span>
    </div>`;
  }
  window.addEventListener("unhandledrejection", (e) => {
    if (e.reason?.name === "AbortError") {
      e.preventDefault();
      return;
    }
    console.warn("[InspoSearch] Unhandled rejection:", e.reason?.message || e.reason);
    e.preventDefault();
  });
  var _gridItemMap = /* @__PURE__ */ new Map();
  function renderGrid(items) {
    const grid = document.getElementById("image-grid");
    if (items.length) {
      const emptyState = grid.querySelector(".empty-state");
      if (emptyState) emptyState.remove();
    }
    if (!items.length) return;
    const CHUNK = 12;
    let cursor = 0;
    function flush() {
      const frag = document.createDocumentFragment();
      const end = Math.min(cursor + CHUNK, items.length);
      for (; cursor < end; cursor++) {
        const item = items[cursor];
        if (renderedIds.has(item.id)) continue;
        renderedIds.add(item.id);
        const card = document.createElement("div");
        card.className = "image-card";
        card.id = "card-" + item.id;
        card.dataset.id = item.id;
        card.setAttribute("data-source", item.source);
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", (item.title || "image") + " \u2014 " + (item.source || "source"));
        const img = document.createElement("img");
        img.dataset.src = item.thumb;
        img.alt = item.title || "";
        img.loading = "lazy";
        img.crossOrigin = "anonymous";
        img.onload = () => {
          if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
            card.remove();
            return;
          }
          img.classList.add("loaded");
          if (STATE.sketchMode) applySketchToCard(card, img);
          const ratio = img.naturalWidth / img.naturalHeight;
          item._aspect = ratio > 1.15 ? "landscape" : ratio < 0.85 ? "portrait" : "square";
          if (!item._colorData) {
            item._colorData = sampleImageColors(img);
            if (item._colorData) {
              item._dominantColor = item._colorData.dominant;
              item._avgRGB = item._colorData.avgRGB;
              item._colorNames = item._colorData.colorNames;
              item._topColors = item._colorData.topColors;
            }
          }
          if (STATE._colorFilter && STATE._colorFilter !== "all") {
            var names = item._colorNames || (item._dominantColor ? [item._dominantColor] : []);
            if (names.length && !names.includes(STATE._colorFilter)) card.style.display = "none";
          }
          if (typeof window._hexPaletteMatch === "function" && STATE._hexPalette && STATE._hexPalette.length && !window._hexPaletteMatch(item)) {
            card.style.display = "none";
          }
        };
        img.onerror = () => {
          if (!img._corsRetry && img.crossOrigin) {
            img._corsRetry = true;
            img.crossOrigin = null;
            img.src = img.dataset.src || img.src;
            return;
          }
          STATE._failedImages = (STATE._failedImages || 0) + 1;
          card.remove();
        };
        _lazyObserver.observe(img);
        const badge = document.createElement("span");
        const _sm = BADGE_META[item.source];
        badge.className = "source-badge badge-" + (_sm ? _sm[0] : "wiki");
        const sourceLabel = _sm ? _sm[1] : item.source;
        badge.innerHTML = `<span class="badge-label">${sourceLabel}</span><span class="badge-refresh" title="Refresh ${sourceLabel}">\u21BA</span>`;
        card.appendChild(img);
        card.appendChild(badge);
        const zoomBtn = document.createElement("button");
        zoomBtn.className = "zoom-btn";
        zoomBtn.innerHTML = "\u2922";
        zoomBtn.title = "Deep zoom";
        card.appendChild(zoomBtn);
        const simBtn = document.createElement("button");
        simBtn.className = "sim-btn";
        simBtn.innerHTML = "\u2248";
        simBtn.title = "More like this";
        card.appendChild(simBtn);
        card.draggable = true;
        _gridItemMap.set(item.id, item);
        frag.appendChild(card);
      }
      grid.appendChild(frag);
      if (cursor < items.length) requestAnimationFrame(flush);
    }
    flush();
  }
  set_realRenderGrid(renderGrid);
  (function setupGridDelegation() {
    const grid = document.getElementById("image-grid");
    function getItemFromCard(card) {
      return card ? _gridItemMap.get(card.dataset.id) : null;
    }
    grid.addEventListener("click", (e) => {
      const refresh = e.target.closest(".badge-refresh");
      if (refresh) {
        e.stopPropagation();
        const card2 = refresh.closest(".image-card");
        const item2 = getItemFromCard(card2);
        if (item2) refreshSource(item2.source);
        return;
      }
      const zoom = e.target.closest(".zoom-btn");
      if (zoom) {
        e.stopPropagation();
        const card2 = zoom.closest(".image-card");
        const item2 = getItemFromCard(card2);
        if (item2) openDeepZoom(item2);
        return;
      }
      const sim = e.target.closest(".sim-btn");
      if (sim) return;
      const card = e.target.closest(".image-card");
      const item = getItemFromCard(card);
      if (!item) return;
      if (e.ctrlKey || e.metaKey) {
        e.stopPropagation();
        toggleSelection(item);
        if (STATE.crossRefMode) {
          if (!STATE.referenceImages.find((r) => r.id === item.id)) {
            STATE.referenceImages.push(item);
            showReferenceStrip(STATE.referenceImages);
            if (STATE.crossRefMode === "interpret" && STATE.geminiKey) {
              runInterpret();
            } else {
              runConnect();
            }
          }
        }
        updatePanel();
        return;
      }
      updatePanel(item);
    });
    grid.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const card = e.target.closest(".image-card");
      const item = getItemFromCard(card);
      if (!item) return;
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        toggleSelection(item);
      }
      updatePanel(item);
    });
    grid.addEventListener("dragstart", (e) => {
      const card = e.target.closest(".image-card");
      const item = getItemFromCard(card);
      if (!item) return;
      e.dataTransfer.setData("text/plain", item.id);
      e.dataTransfer.setData("application/json", JSON.stringify({
        id: item.id,
        thumb: item.thumb,
        title: item.title,
        source: item.source,
        tags: item.tags || [],
        sourceUrl: item.sourceUrl || "",
        year: item.year || "",
        colors: item.colors || []
      }));
      e.dataTransfer.effectAllowed = "copy";
    });
    grid.addEventListener("dblclick", (e) => {
      const card = e.target.closest(".image-card");
      const item = getItemFromCard(card);
      if (!item) return;
      e.stopPropagation();
      const boardCanvas = document.getElementById("board-canvas");
      if (document.getElementById("board-overlay")?.classList.contains("open")) {
        if (!STATE.selected.find((s) => s.id === item.id)) {
          toggleSelection(item);
        }
        let alreadyOnBoard = false;
        boardCanvas.querySelectorAll(".board-card").forEach((bc) => {
          if (boardCardMap.get(bc)?.id === item.id) alreadyOnBoard = true;
        });
        if (!alreadyOnBoard) {
          const offset = (STATE.selected.length - 1) * 16;
          createBoardCard(
            item,
            24 + offset % 320,
            24 + Math.floor(offset / 320) * 180,
            boardCanvas
          );
        }
        if (typeof persistBoardState === "function") persistBoardState();
        if (typeof broadcastBoardSync === "function") broadcastBoardSync();
      }
    });
  })();
  function getDominantColors(imgEl, count = 10) {
    try {
      if (window.ColorThief) {
        const ct = new ColorThief();
        if (imgEl.complete && imgEl.naturalWidth > 0) {
          const palette = ct.getPalette(imgEl, Math.min(count, 12));
          return palette.map((rgb) => `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`);
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = 50;
      canvas.height = 50;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(imgEl, 0, 0, 50, 50);
      const data = ctx.getImageData(0, 0, 50, 50).data;
      const buckets = {};
      for (let i = 0; i < data.length; i += 16) {
        const r = Math.round(data[i] / 32) * 32;
        const g = Math.round(data[i + 1] / 32) * 32;
        const b = Math.round(data[i + 2] / 32) * 32;
        const key = `${r},${g},${b}`;
        buckets[key] = (buckets[key] || 0) + 1;
      }
      return Object.entries(buckets).sort((a, b) => b[1] - a[1]).slice(0, count).map(([key]) => `rgb(${key})`);
    } catch {
      return [];
    }
  }
  function getDominantColorsAsync(imgEl, count = 10) {
    return new Promise((resolve) => {
      const run = () => resolve(getDominantColors(imgEl, count));
      if (!window.ColorThief && typeof loadColorThief === "function") {
        loadColorThief(() => {
          loadTinyColor(() => {
            if (typeof requestIdleCallback === "function") {
              requestIdleCallback(run, { timeout: 500 });
            } else {
              setTimeout(run, 0);
            }
          });
        });
      } else {
        if (typeof requestIdleCallback === "function") {
          requestIdleCallback(run, { timeout: 500 });
        } else {
          setTimeout(run, 0);
        }
      }
    });
  }
  async function getRelated(tag) {
    try {
      const [trg, lc] = await Promise.allSettled([
        fetch(`https://api.datamuse.com/words?rel_trg=${encodeURIComponent(tag)}&max=5`).then((r) => r.json()),
        fetch(`https://api.datamuse.com/words?lc=${encodeURIComponent(tag)}&max=3`).then((r) => r.json())
      ]);
      return [
        ...trg.status === "fulfilled" ? trg.value : [],
        ...lc.status === "fulfilled" ? lc.value : []
      ].map((w) => w.word);
    } catch {
      return [];
    }
  }
  function getColorName(rgbStr) {
    if (window.tinycolor) {
      const tc = tinycolor(rgbStr);
      const named = tc.toName();
      if (named) return named;
      const hex = tc.toHexString();
      const hsl = tc.toHsl();
      if (hsl.s < 0.1) {
        if (hsl.l < 0.15) return "Black";
        if (hsl.l < 0.35) return "Dark Gray";
        if (hsl.l < 0.65) return "Gray";
        if (hsl.l < 0.85) return "Light Gray";
        return "White";
      }
      const hue = hsl.h;
      let name = "";
      if (hue < 15) name = "Red";
      else if (hue < 40) name = "Orange";
      else if (hue < 65) name = "Yellow";
      else if (hue < 160) name = "Green";
      else if (hue < 200) name = "Cyan";
      else if (hue < 260) name = "Blue";
      else if (hue < 300) name = "Purple";
      else if (hue < 340) name = "Pink";
      else name = "Red";
      if (hsl.l < 0.3) name = "Dark " + name;
      else if (hsl.l > 0.7) name = "Light " + name;
      return name;
    }
    return rgbStr;
  }
  function renderColorDots(colors) {
    const container = document.getElementById("swatches");
    container.innerHTML = "";
    colors.forEach((color) => {
      const hex = window.tinycolor ? tinycolor(color).toHexString() : color;
      const name = getColorName(color);
      const row = document.createElement("div");
      row.className = "color-row";
      const dot = document.createElement("div");
      dot.className = "color-dot";
      dot.style.background = color;
      const label = document.createElement("div");
      label.className = "color-label";
      label.innerHTML = '<span class="color-name">' + name + '</span><span class="color-hex">' + hex + "</span>";
      const badge = document.createElement("span");
      badge.className = "dot-copied-badge";
      badge.textContent = "copied";
      row.appendChild(dot);
      row.appendChild(label);
      row.appendChild(badge);
      row.addEventListener("click", () => {
        navigator.clipboard.writeText(hex).then(() => {
          row.classList.add("copied");
          setTimeout(() => row.classList.remove("copied"), 600);
        });
      });
      container.appendChild(row);
    });
  }
  function renderSwatches(colors) {
    renderColorDots(colors);
  }
  function renderPanelTags(tags) {
    const container = document.getElementById("tags-container");
    container.innerHTML = "";
    tags.forEach((tag) => {
      const pill = document.createElement("button");
      pill.className = "tag";
      pill.textContent = tag;
      pill.addEventListener("click", () => {
        document.getElementById("search-input").value = tag;
        runSearch(tag);
      });
      container.appendChild(pill);
    });
  }
  async function renderRelated(tags) {
    const container = document.getElementById("related-container");
    container.innerHTML = '<span class="loading-indicator" style="animation:none;opacity:0.5;">loading...</span>';
    const topTags = tags.slice(0, 3);
    const results = await Promise.allSettled(topTags.map((t) => getRelated(t)));
    const allWords = results.flatMap((r) => r.status === "fulfilled" ? r.value : []).filter((w) => !tags.includes(w));
    const unique = [...new Set(allWords)].slice(0, 8);
    container.innerHTML = "";
    if (!unique.length) {
      container.innerHTML = '<span style="font-family:var(--font-ui);font-size:10px;color:var(--ink-3);">\u2014</span>';
      return;
    }
    unique.forEach((word) => {
      const link = document.createElement("div");
      link.className = "related-link";
      link.textContent = `explore ${word}`;
      link.addEventListener("click", () => {
        document.getElementById("search-input").value = word;
        runSearch(word);
      });
      container.appendChild(link);
    });
  }
  function renderSourceInfo(items) {
    const el = document.getElementById("source-info");
    if (!items.length) {
      el.innerHTML = "";
      return;
    }
    const item = items[items.length - 1];
    const sourceLabel = getSourceName(item.source);
    el.innerHTML = "";
    const title = document.createElement("div");
    title.style.cssText = "margin-bottom:6px;color:var(--ink);font-weight:400;";
    title.textContent = item.title || "\u2014";
    const sourceLine = document.createElement("div");
    sourceLine.appendChild(createSourceIdentity(item.source, sourceLabel));
    if (item.year) {
      const year = document.createElement("span");
      year.textContent = " \xB7 " + item.year;
      sourceLine.appendChild(year);
    }
    el.appendChild(title);
    el.appendChild(sourceLine);
    if (item.sourceUrl) {
      const linkWrap = document.createElement("div");
      linkWrap.style.marginTop = "4px";
      const link = document.createElement("a");
      link.href = item.sourceUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.style.cssText = "color:var(--accent);border-bottom:1px solid var(--line-strong);";
      link.textContent = "view original \u2197";
      linkWrap.appendChild(link);
      el.appendChild(linkWrap);
    }
  }
  async function updatePanel(previewItem) {
    const panel = document.getElementById("panel");
    const emptyHint = document.getElementById("panel-empty-hint");
    const colorsSection = document.getElementById("panel-colors");
    const tagsSection = document.getElementById("panel-tags");
    const relatedSection = document.getElementById("panel-related");
    const sourceSection = document.getElementById("panel-source");
    const aiSection = document.getElementById("panel-ai-tags");
    const analyseSection = document.getElementById("analyse-section");
    const displayItems = previewItem ? [previewItem] : STATE.selected;
    if (_fabricCanvas) setTimeout(positionFabricOverlay, 420);
    if (!displayItems.length) {
      panel.classList.add("open");
      if (emptyHint) emptyHint.style.display = "block";
      colorsSection.style.display = "none";
      tagsSection.style.display = "none";
      relatedSection.style.display = "none";
      sourceSection.style.display = "none";
      aiSection.style.display = "none";
      analyseSection.style.display = "none";
      document.getElementById("no-key-note").textContent = "";
      return;
    }
    panel.classList.add("open");
    if (emptyHint) emptyHint.style.display = "none";
    sourceSection.style.display = "";
    const allColors = [];
    displayItems.forEach((item) => {
      (item.colors || []).forEach((c) => {
        if (!allColors.includes(c)) allColors.push(c);
      });
    });
    if (allColors.length) {
      colorsSection.style.display = "";
      renderSwatches(allColors.slice(0, 10));
    } else {
      colorsSection.style.display = "none";
    }
    const allTags = [...new Set(displayItems.flatMap((i) => i.tags || []))];
    if (allTags.length) {
      tagsSection.style.display = "";
      relatedSection.style.display = "";
      renderPanelTags(allTags.slice(0, 16));
      renderRelated(allTags);
    } else {
      tagsSection.style.display = "none";
      relatedSection.style.display = "none";
    }
    renderSourceInfo(displayItems);
    const noKeyNote = document.getElementById("no-key-note");
    const hasAiKey = STATE.geminiKey || STATE.claudeKey || STATE.openaiKey;
    noKeyNote.textContent = hasAiKey ? "" : "no key \u2014 add an ai key for vision";
    updateAnalyseButton(displayItems[displayItems.length - 1]);
    showQuietTip("panel-colors", "palette appears here as you select references", "inspo_tip_palette");
  }
  function toggleSelection(item) {
    const idx = STATE.selected.findIndex((s) => s.id === item.id);
    const card = document.getElementById("card-" + item.id);
    if (idx === -1) {
      STATE.selected.push(item);
      card?.classList.add("selected");
      const img = card?.querySelector("img");
      if (img && img.complete && img.naturalWidth > 1) {
        getDominantColorsAsync(img).then((colors) => {
          item.colors = colors;
          if (STATE.selected.includes(item)) {
            const allColors = [...new Set(STATE.selected.flatMap((i) => i.colors || []))];
            if (allColors.length) {
              document.getElementById("panel-colors").style.display = "";
              renderSwatches(allColors.slice(0, 10));
            }
          }
        });
      }
    } else {
      STATE.selected.splice(idx, 1);
      card?.classList.remove("selected");
    }
    updateFloatingBar();
  }
  document.getElementById("panel-close")?.addEventListener("click", () => {
    STATE.selected = [];
    document.querySelectorAll(".image-card.selected").forEach((c) => c.classList.remove("selected"));
    updateFloatingBar();
    hideFloatingBar();
    document.getElementById("panel").classList.remove("open");
    if (_fabricCanvas) setTimeout(positionFabricOverlay, 420);
  });
  document.getElementById("analyse-btn")?.addEventListener("click", () => {
    runGeminiOnSelected();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      STATE.selected = [];
      document.querySelectorAll(".image-card.selected").forEach((c) => c.classList.remove("selected"));
      updateFloatingBar();
      hideFloatingBar();
    }
  });
  document.getElementById("image-grid")?.addEventListener("keydown", (e) => {
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return;
    const cards = [...document.querySelectorAll(".image-card")];
    if (!cards.length) return;
    const idx = cards.indexOf(document.activeElement);
    if (idx === -1) return;
    e.preventDefault();
    const gridEl = document.getElementById("image-grid");
    const cols = Math.round(gridEl.clientWidth / cards[0].offsetWidth) || 1;
    let next = idx;
    if (e.key === "ArrowRight") next = Math.min(idx + 1, cards.length - 1);
    if (e.key === "ArrowLeft") next = Math.max(idx - 1, 0);
    if (e.key === "ArrowDown") next = Math.min(idx + cols, cards.length - 1);
    if (e.key === "ArrowUp") next = Math.max(idx - cols, 0);
    cards[next].focus();
  });
  function scoreTerms(selectedItems) {
    const scores = {};
    selectedItems.forEach((item) => {
      (item.tags || []).forEach((tag) => {
        if (tag.length < 3 || STOPWORDS.has(tag)) return;
        scores[tag] = (scores[tag] || 0) + 2;
      });
      const words = (item.title + " " + (item.description || "")).toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !STOPWORDS.has(w));
      const wordSet = new Set(words);
      wordSet.forEach((word) => {
        if (!(item.tags || []).includes(word)) {
          scores[word] = (scores[word] || 0) + 1;
        }
      });
    });
    return Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([term]) => term);
  }
  async function runConnect() {
    if (STATE.selected.length < 2) return;
    const connectBtn = document.getElementById("connect-btn");
    connectBtn.textContent = "connecting...";
    const terms = scoreTerms(STATE.selected);
    STATE.crossRefMode = "connect";
    STATE.crossRefTerms = terms;
    STATE.referenceImages = [...STATE.selected];
    await crossRefSearch(terms, "connect");
    connectBtn.textContent = STATE.crossRefMode === "connect" ? "reconnect" : "connect";
  }
  async function runInterpret() {
    if (STATE.selected.length < 2) return;
    const hasKey = STATE.geminiKey || STATE.claudeKey || STATE.openaiKey;
    if (!hasKey) return;
    if ((STATE.aiProvider || "gemini") === "gemini" && STATE.geminiDailyCount >= 1500) {
      console.warn("[ai] daily limit reached");
      return;
    }
    const elapsed = Date.now() - (STATE.lastGeminiCall || 0);
    if (elapsed < 2e3) await sleep(2e3 - elapsed);
    STATE.lastGeminiCall = Date.now();
    const interpretBtn = document.getElementById("interpret-btn");
    const originalHTML = interpretBtn.innerHTML;
    interpretBtn.innerHTML = "<span>interpreting...</span>";
    try {
      const descriptions = STATE.selected.map(
        (item, i) => `Image ${i + 1}: "${item.title}"${item.description ? " \u2014 " + item.description : ""}${item.tags?.length ? ". Tags: " + item.tags.slice(0, 8).join(", ") : ""}${item.year ? ". Year: " + item.year : ""}`
      ).join("\n");
      const prompt = `You are a visual research assistant for artists and graphic designers. Given these ${STATE.selected.length} image descriptions, identify the 8 most interesting conceptual themes, moods, or visual territories they collectively point toward. Think beyond the obvious \u2014 consider anachronism, cultural tension, material contrasts, historical echoes, cinematic references, art movements, emotional textures. Return ONLY a valid JSON array of 8 short search terms (2-4 words max each). No explanation, no markdown, no other text.

Images:
${descriptions}`;
      const text = await callAI(prompt);
      let terms;
      try {
        const clean = text.replace(/```json|```/g, "").trim();
        terms = JSON.parse(clean);
        if (!Array.isArray(terms)) throw new Error("not array");
        terms = terms.filter((t) => typeof t === "string").slice(0, 8);
      } catch (e) {
        console.warn("Interpret parse failed, falling back to connect");
        terms = scoreTerms(STATE.selected);
      }
      STATE.crossRefMode = "interpret";
      STATE.crossRefTerms = terms;
      STATE.referenceImages = [...STATE.selected];
      if ((STATE.aiProvider || "gemini") === "gemini") incrementGeminiCounter();
      await crossRefSearch(terms, "interpret");
    } catch (e) {
      console.warn("Interpret failed:", e.message);
      STATE.crossRefMode = "connect";
      STATE.crossRefTerms = scoreTerms(STATE.selected);
      await crossRefSearch(STATE.crossRefTerms, "connect");
    } finally {
      interpretBtn.innerHTML = originalHTML;
    }
  }
  async function crossRefSearch(terms, mode) {
    if (!terms || terms.length === 0) return;
    if (STATE.abortController) STATE.abortController.abort();
    STATE.abortController = new AbortController();
    showReferenceStrip(STATE.referenceImages);
    showConceptPills(terms, mode);
    clearGrid();
    showLoading("cross-referencing...");
    const perTerm = Math.ceil(STATE.imageCount / terms.length);
    STATE.results = [];
    const searchPromises = terms.map(
      (term) => fetchAll([term], perTerm, true).catch(() => [])
    );
    const settled = await Promise.allSettled(searchPromises);
    settled.forEach((r) => {
      if (r.status === "fulfilled" && Array.isArray(r.value) && r.value.length) {
        const existingIds = new Set(STATE.results.map((x) => x.id));
        const novel = r.value.filter((item) => !existingIds.has(item.id));
        STATE.results.push(...novel);
      }
    });
    hideLoading();
    if (STATE.results.length === 0) {
      showEmptyState();
    }
  }
  function showReferenceStrip(images) {
    const strip = document.getElementById("reference-strip");
    const thumbsContainer = document.getElementById("reference-thumbs");
    thumbsContainer.innerHTML = "";
    images.forEach((item) => {
      const wrapper = document.createElement("div");
      wrapper.style.cssText = "position:relative;width:60px;height:60px;flex-shrink:0;";
      const img = document.createElement("img");
      img.src = item.thumb;
      img.style.cssText = "width:60px;height:60px;object-fit:cover;display:block;";
      img.title = item.title;
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "\xD7";
      removeBtn.style.cssText = `
      position:absolute;top:2px;right:2px;
      width:16px;height:16px;
      background:var(--bg-panel);border:1px solid var(--line);
      color:var(--ink);font-size:10px;
      cursor:pointer;display:none;
      align-items:center;justify-content:center;
      padding:0;line-height:1;
    `;
      wrapper.addEventListener("mouseenter", () => {
        removeBtn.style.display = "flex";
      });
      wrapper.addEventListener("mouseleave", () => {
        removeBtn.style.display = "none";
      });
      removeBtn.addEventListener("click", () => {
        STATE.referenceImages = STATE.referenceImages.filter((r) => r.id !== item.id);
        STATE.selected = STATE.selected.filter((s) => s.id !== item.id);
        document.getElementById("card-" + item.id)?.classList.remove("selected");
        if (STATE.referenceImages.length < 2) {
          hideReferenceStrip();
          hideConceptPills();
          STATE.crossRefMode = null;
          updateFloatingBar();
          return;
        }
        if (STATE.crossRefMode === "interpret" && STATE.geminiKey) {
          runInterpret();
        } else {
          runConnect();
        }
      });
      wrapper.appendChild(img);
      wrapper.appendChild(removeBtn);
      thumbsContainer.appendChild(wrapper);
    });
    strip.style.display = "flex";
  }
  function hideReferenceStrip() {
    document.getElementById("reference-strip").style.display = "none";
  }
  function showConceptPills(terms, mode) {
    const container = document.getElementById("concept-pills");
    const modeLabel = document.getElementById("pills-mode-label");
    container.querySelectorAll(".concept-pill").forEach((p) => p.remove());
    container.querySelectorAll(".pill-control").forEach((p) => p.remove());
    modeLabel.textContent = mode === "interpret" ? "interpreted" : "connected";
    terms.forEach((term) => {
      const pill = document.createElement("span");
      pill.className = "concept-pill tag pill-item";
      pill.style.cssText = "display:inline-flex;align-items:center;gap:4px;cursor:pointer;";
      const prefix = document.createElement("span");
      prefix.style.color = "var(--accent)";
      prefix.textContent = mode === "interpret" ? "\u2726" : "\u25CB";
      const label = document.createElement("span");
      label.textContent = term;
      const removeSpan = document.createElement("span");
      removeSpan.textContent = "\xD7";
      removeSpan.style.cssText = "opacity:0.4;font-size:10px;margin-left:2px;";
      removeSpan.addEventListener("click", (e) => {
        e.stopPropagation();
        STATE.crossRefTerms = STATE.crossRefTerms.filter((t) => t !== term);
        pill.remove();
        if (STATE.crossRefTerms.length > 0) {
          crossRefSearch(STATE.crossRefTerms, mode);
        }
      });
      pill.appendChild(prefix);
      pill.appendChild(label);
      pill.appendChild(removeSpan);
      pill.addEventListener("click", () => runSearch(term));
      container.appendChild(pill);
    });
    const addBtn = document.createElement("button");
    addBtn.className = "btn pill-control";
    addBtn.style.cssText = "width:auto;padding:3px 8px;font-size:9px;display:inline-flex;align-items:center;";
    addBtn.textContent = "+";
    addBtn.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "add term";
      input.className = "search-input";
      input.style.cssText = "width:100px;font-size:10px;display:inline-block;margin:0;";
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && input.value.trim()) {
          const newTerm = input.value.trim().toLowerCase();
          STATE.crossRefTerms.push(newTerm);
          input.replaceWith(addBtn);
          showConceptPills(STATE.crossRefTerms, mode);
          crossRefSearch(STATE.crossRefTerms, mode);
        }
        if (e.key === "Escape") input.replaceWith(addBtn);
      });
      addBtn.replaceWith(input);
      input.focus();
    });
    container.appendChild(addBtn);
    const refreshBtn = document.createElement("span");
    refreshBtn.className = "pill-control";
    refreshBtn.style.cssText = `
    font-family:var(--font-ui);font-size:9px;color:var(--accent);
    cursor:pointer;padding:0 8px;letter-spacing:0.06em;
    transition:opacity 0.3s ease;
  `;
    refreshBtn.textContent = "\u21BB refresh";
    refreshBtn.addEventListener("click", () => {
      if (mode === "interpret" && STATE.geminiKey) runInterpret();
      else runConnect();
    });
    container.appendChild(refreshBtn);
    if (mode === "connect" && STATE.geminiKey) {
      const escalateBtn = document.createElement("span");
      escalateBtn.className = "pill-control";
      escalateBtn.style.cssText = `
      font-family:var(--font-ui);font-size:9px;color:var(--ink-3);
      cursor:pointer;padding:0 8px;letter-spacing:0.06em;
      transition:opacity 0.3s ease;
      border-left:1px solid var(--line);
    `;
      escalateBtn.innerHTML = "\u2726 interpret";
      escalateBtn.addEventListener("click", runInterpret);
      container.appendChild(escalateBtn);
    }
    container.style.display = "flex";
  }
  function hideConceptPills() {
    document.getElementById("concept-pills").style.display = "none";
  }
  function updateFloatingBar() {
    const bar = document.getElementById("floating-bar");
    const thumbsContainer = document.getElementById("bar-thumbs");
    const countEl = document.getElementById("bar-count");
    const interpretBtn = document.getElementById("interpret-btn");
    const canvas = document.getElementById("canvas");
    if (STATE.selected.length < 2) {
      bar.classList.remove("visible");
      bar.classList.remove("bar-hidden");
      canvas.classList.remove("bar-active");
      STATE.floatingBarVisible = false;
      STATE.floatingBarHidden = false;
      document.getElementById("bar-toggle-section").style.display = "none";
      return;
    }
    thumbsContainer.innerHTML = "";
    STATE.selected.slice(0, 5).forEach((item) => {
      const img = document.createElement("img");
      img.src = item.thumb;
      img.className = "bar-thumb";
      img.title = item.title;
      img.addEventListener("click", () => toggleSelection(item));
      thumbsContainer.appendChild(img);
    });
    if (STATE.selected.length > 5) {
      const more = document.createElement("span");
      more.style.cssText = `
      font-size: 9px;
      color: var(--ink-3);
      font-family: var(--font-ui);
      padding: 0 4px;
    `;
      more.textContent = `+${STATE.selected.length - 5}`;
      thumbsContainer.appendChild(more);
    }
    countEl.textContent = `${STATE.selected.length} selected`;
    const hasAiKey = STATE.geminiKey || STATE.claudeKey || STATE.openaiKey;
    if (!hasAiKey) {
      interpretBtn.classList.add("disabled");
    } else {
      interpretBtn.classList.remove("disabled");
    }
    if (STATE.floatingBarHidden) {
      document.getElementById("bar-toggle-section").style.display = "";
      return;
    }
    bar.classList.remove("bar-hidden");
    bar.classList.add("visible");
    canvas.classList.add("bar-active");
    STATE.floatingBarVisible = true;
    showQuietTip("connect-btn", "connect maps shared concepts across selected images", "inspo_tip_connect");
  }
  function hideFloatingBar() {
    document.getElementById("floating-bar")?.classList.remove("visible");
    document.getElementById("canvas")?.classList.remove("bar-active");
    STATE.floatingBarVisible = false;
  }
  document.getElementById("connect-btn")?.addEventListener("click", () => {
    if (STATE.selected.length < 2) return;
    runConnect();
  });
  document.getElementById("interpret-btn")?.addEventListener("click", () => {
    if (STATE.selected.length < 2) return;
    if (!(STATE.geminiKey || STATE.claudeKey || STATE.openaiKey)) return;
    runInterpret();
  });
  document.getElementById("bar-clear-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    document.querySelectorAll(".image-card.selected").forEach((c) => c.classList.remove("selected"));
    STATE.selected = [];
    STATE.crossRefMode = null;
    STATE.crossRefTerms = [];
    STATE.referenceImages = [];
    hideReferenceStrip();
    hideConceptPills();
    document.getElementById("bar-thumbs").innerHTML = "";
    document.getElementById("bar-count").textContent = "";
    document.getElementById("panel").classList.remove("open");
    const bar = document.getElementById("floating-bar");
    bar.classList.add("bar-hidden");
    bar.classList.remove("visible");
    bar.classList.remove("bar-positioned");
    bar.style.removeProperty("left");
    bar.style.removeProperty("top");
    bar.style.removeProperty("bottom");
    document.getElementById("canvas").classList.remove("bar-active");
    STATE.floatingBarVisible = false;
    STATE.floatingBarHidden = false;
    document.getElementById("bar-toggle-section").style.display = "none";
    if (typeof persistBoardState === "function") persistBoardState();
  });
  document.getElementById("bar-close-btn")?.addEventListener("click", () => {
    const bar = document.getElementById("floating-bar");
    bar.classList.add("bar-hidden");
    bar.classList.remove("visible");
    document.getElementById("canvas").classList.remove("bar-active");
    STATE.floatingBarVisible = false;
    STATE.floatingBarHidden = true;
    document.getElementById("bar-toggle-section").style.display = "";
  });
  document.getElementById("btn-bar-toggle")?.addEventListener("click", () => {
    STATE.floatingBarHidden = false;
    const bar = document.getElementById("floating-bar");
    bar.classList.remove("bar-hidden");
    document.getElementById("bar-toggle-section").style.display = "none";
    updateFloatingBar();
  });
  (function initBarDrag() {
    const bar = document.getElementById("floating-bar");
    let dragging = false, startX, startY, barX, barY;
    bar.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button, input, a, .bar-thumb")) return;
      dragging = true;
      bar.classList.add("dragging");
      bar.setPointerCapture(e.pointerId);
      const rect = bar.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      barX = rect.left;
      barY = rect.top;
      e.preventDefault();
    });
    bar.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newX = Math.max(0, Math.min(window.innerWidth - bar.offsetWidth, barX + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - bar.offsetHeight, barY + dy));
      bar.style.left = newX + "px";
      bar.style.top = newY + "px";
      bar.style.bottom = "auto";
      bar.classList.add("bar-positioned");
    });
    bar.addEventListener("pointerup", (e) => {
      if (!dragging) return;
      dragging = false;
      bar.classList.remove("dragging");
      bar.releasePointerCapture(e.pointerId);
    });
  })();
  document.getElementById("strip-clear-btn")?.addEventListener("click", () => {
    const bar = document.getElementById("floating-bar");
    bar.classList.add("bar-hidden");
    bar.classList.remove("visible");
    document.getElementById("canvas").classList.remove("bar-active");
    STATE.floatingBarVisible = false;
    STATE.floatingBarHidden = false;
    STATE.selected = [];
    STATE.crossRefMode = null;
    STATE.crossRefTerms = [];
    STATE.referenceImages = [];
    document.querySelectorAll(".image-card.selected").forEach((c) => c.classList.remove("selected"));
    document.getElementById("bar-toggle-section").style.display = "none";
    hideReferenceStrip();
    hideConceptPills();
    clearGrid();
    showEmptyState();
  });
  function buildFuseIndex() {
    if (!window.Fuse || !STATE.results.length) {
      STATE.fuseIndex = null;
      return;
    }
    const items = STATE.results.length > 2e3 ? STATE.results.slice(0, 2e3) : STATE.results;
    STATE.fuseIndex = new Fuse(items, {
      keys: ["title", "tags", "source", "description"],
      threshold: 0.35,
      ignoreLocation: true
    });
    document.getElementById("local-filter-section").style.display = "";
    document.getElementById("local-filter").value = "";
  }
  var _fuseFilterTimer = null;
  document.getElementById("local-filter")?.addEventListener("input", (e) => {
    clearTimeout(_fuseFilterTimer);
    _fuseFilterTimer = setTimeout(() => {
      const val = e.target.value.trim();
      clearGrid();
      if (!val) {
        const visible = getDisplayResults(STATE.results, STATE.query);
        if (visible.length) renderGrid(visible);
        else showEmptyState();
        return;
      }
      if (!STATE.fuseIndex) {
        if (window.Fuse) buildFuseIndex();
        if (!STATE.fuseIndex) return;
      }
      const matches = STATE.fuseIndex.search(val).map((r) => r.item);
      if (matches.length) renderGrid(matches.slice(0, STATE.imageCount));
      else showEmptyState();
    }, 200);
  });
  function renderKeywordPills(keywords) {
    const container = document.getElementById("keyword-pills");
    container.innerHTML = "";
    keywords.forEach((kw) => {
      const pill = document.createElement("button");
      pill.className = "tag";
      pill.textContent = kw + " ";
      const xSpan = document.createElement("span");
      xSpan.style.cssText = "color:var(--ink-3);font-size:9px;";
      xSpan.textContent = "\xD7";
      pill.appendChild(xSpan);
      pill.addEventListener("click", () => {
        STATE.keywords = STATE.keywords.filter((k) => k !== kw);
        renderKeywordPills(STATE.keywords);
        if (STATE.keywords.length > 0 && STATE.results.length > 0) {
          const final = shuffle2(interleave(
            // slice cached results; no re-fetch on pill removal
            [
              STATE.results.filter((r) => r.source === "wikimedia"),
              STATE.results.filter((r) => r.source === "met"),
              STATE.results.filter((r) => r.source === "archive")
            ]
          )).slice(0, STATE.imageCount);
          renderGrid(final);
        }
      });
      container.appendChild(pill);
    });
  }
  function showCacheIndicator(query) {
    const age = getCacheAge(query);
    if (age === null) return;
    document.getElementById("cache-age-text").textContent = "cached \xB7 " + formatCacheAge(age);
    document.getElementById("cache-indicator").style.display = "flex";
  }
  function updateCacheIndicator(query) {
    const el = document.getElementById("cache-indicator");
    if (el.style.display === "none") return;
    const age = getCacheAge(query);
    if (age !== null) {
      document.getElementById("cache-age-text").textContent = "cached \xB7 " + formatCacheAge(age);
    }
  }
  function hideCacheIndicator() {
    document.getElementById("cache-indicator").style.display = "none";
  }
  function setSearchMode(mode, persist = true) {
    const next = mode === "exact" ? "exact" : "explore";
    STATE.searchMode = next;
    const btn = document.getElementById("btn-search-mode");
    if (btn) {
      btn.textContent = next;
      btn.classList.toggle("exact", next === "exact");
    }
    if (persist) localStorage.setItem("inspo_search_mode", next);
    if (STATE.results.length) {
      clearGrid();
      const visible = getDisplayResults(STATE.results, STATE.query);
      renderGrid(visible);
      if (!visible.length) showEmptyState();
    }
  }
  async function refreshSource(sourceName) {
    if (!STATE.query) return;
    const ac = new AbortController();
    _secondaryControllers.add(ac);
    const { signal } = ac;
    const kw = STATE.keywords[0] || STATE.query;
    const lim = STATE.imageCount;
    const fetchMap = {
      wikimedia: () => fetchWikimedia(kw, lim, signal),
      met: () => fetchMet(kw, lim, signal),
      archive: () => fetchArchive(kw, lim, signal),
      nasa: () => fetchNASA(kw, lim, signal),
      apod: () => fetchAPOD(kw, lim, signal),
      rijksmuseum: () => fetchRijksmuseum(kw, lim, signal),
      europeana: () => fetchEuropeana(kw, lim, signal),
      harvard: () => fetchHarvard(kw, lim, signal),
      smithsonian: () => fetchSmithsonian(kw, lim, signal),
      pexels: () => fetchPexels(kw, lim, signal),
      inaturalist: () => fetchINaturalist(kw, lim, signal),
      loc: () => fetchLOC(kw, lim, signal),
      openlibrary: () => fetchOpenLibrary(kw, lim, signal),
      chicago: () => fetchChicagoArt(kw, lim, signal),
      cleveland: () => fetchCleveland(kw, lim, signal),
      va: () => fetchVA(kw, lim, signal),
      flickr: () => fetchFlickrCommons(kw, lim, signal),
      pixabay: () => fetchPixabay(kw, lim, signal),
      wikiart: () => fetchWikiArt(kw, lim, signal),
      nordic: () => fetchNordicMuseum(kw, lim, signal),
      getty: () => fetchGetty(kw, lim, signal),
      nga: () => fetchNGA(kw, lim, signal),
      gbif: () => fetchGBIF(kw, lim, signal),
      eol: () => fetchEOL(kw, lim, signal),
      gallica: () => fetchGallica(kw, lim, signal),
      chronicling: () => fetchChroniclingAmerica(kw, lim, signal),
      openverse: () => fetchOpenverse(kw, lim, signal),
      trove: () => fetchTrove(kw, lim, signal),
      digitalnz: () => fetchDigitalNZ(kw, lim, signal),
      bhl: () => fetchBHL(kw, lim, signal),
      carnegie: () => fetchCarnegie(kw, lim, signal),
      prado: () => fetchPrado(kw, lim, signal),
      parismusees: () => fetchParisMusees(kw, lim, signal),
      yale: () => fetchYale(kw, lim, signal),
      picsum: () => fetchPicsum(kw, lim, signal),
      usgs: () => fetchUSGS(kw, lim, signal),
      cooperhewitt: () => fetchCooperHewitt(kw, lim, signal),
      tate: () => fetchTate(kw, lim, signal),
      finna: () => fetchFinna(kw, lim, signal),
      soch: () => fetchSOCH(kw, lim, signal),
      joconde: () => fetchJoconde(kw, lim, signal),
      mnw: () => fetchMNW(kw, lim, signal),
      tepapa: () => fetchTePapa(kw, lim, signal),
      dpla: () => fetchDPLA(kw, lim, signal),
      artsy: () => fetchArtsy(kw, lim, signal),
      pas: () => fetchPAS(kw, lim, signal),
      smg: () => fetchSMG(kw, lim, signal),
      auckland: () => fetchAuckland(kw, lim, signal),
      photogrammar: () => fetchPhotogrammar(kw, lim, signal),
      wellcome: () => fetchWellcome(kw, lim, signal),
      maas: () => fetchMAAS(kw, lim, signal),
      smk: () => fetchSMK(kw, lim, signal),
      thyssen: () => fetchThyssen(kw, lim, signal),
      // Phase A sub-collections
      ...Object.fromEntries([
        ...Object.entries(EUROPEANA_PROVIDERS).map(([id, cfg]) => [id, () => fetchEuropeanaFiltered(cfg.filterParam, cfg.filterValue, kw, lim, signal, cfg.extra || "")]),
        ...Object.entries(DPLA_HUBS).map(([id, cfg]) => [id, () => fetchDPLAProvider(cfg.provider, kw, lim, signal)]),
        ...Object.entries(SI_UNITS).map(([id, cfg]) => [id, () => fetchSmithsonianUnit(cfg.code, kw, lim, signal)]),
        ...Object.entries(WIKIMEDIA_CATS).map(([id, cfg]) => [id, () => fetchWikimediaCategory(cfg.cat, kw, lim, signal)])
      ]),
      // Phase B
      idigbio: () => fetchIDigBio(kw, lim, signal),
      ala: () => fetchALA(kw, lim, signal),
      // Phase D
      nasa_images: () => fetchNASAImages(kw, lim, signal),
      loc: () => fetchLOC(kw, lim, signal)
    };
    const fetcher = fetchMap[sourceName];
    if (!fetcher) {
      _secondaryControllers.delete(ac);
      return;
    }
    try {
      const fresh = await fetcher().catch(() => []);
      if (!fresh.length) return;
      const existingIds = new Set(STATE.results.map((r) => r.id));
      const novel = fresh.filter((r) => !existingIds.has(r.id));
      if (novel.length > 0 && STATE.results.length < CONSTANTS.MAX_RESULTS) {
        const room = CONSTANTS.MAX_RESULTS - STATE.results.length;
        const batch = novel.slice(0, room);
        STATE.results.push(...batch);
        renderGrid(getDisplayResults(batch, STATE.query));
      }
    } finally {
      _secondaryControllers.delete(ac);
    }
  }
  async function fetchMoreResults() {
    if (STATE.loading || !STATE.query) return;
    const startQuery = STATE.query;
    STATE.loading = true;
    const btn = document.getElementById("btn-load-more");
    if (btn) btn.textContent = "loading\u2026";
    STATE.currentPage++;
    const page = STATE.currentPage;
    const PRODUCTIVE_SOURCE_ESTIMATE = 60;
    const perSource = Math.max(2, Math.ceil(STATE.imageCount / PRODUCTIVE_SOURCE_ESTIMATE));
    const offset = (page - 1) * STATE.imageCount;
    const kw = STATE.keywords[0] || STATE.query;
    const ac = new AbortController();
    _secondaryControllers.add(ac);
    const signal = ac.signal;
    const fetches = [
      callIfHealthy("met", fetchMet(kw, perSource, signal, offset)),
      callIfHealthy("chicago", fetchChicagoArt(kw, perSource, signal, page)),
      callIfHealthy("europeana", fetchEuropeana(kw, perSource, signal, offset + 1)),
      callIfHealthy("gbif", fetchGBIF(kw, perSource, signal, offset)),
      callIfHealthy("openverse", fetchOpenverse(kw, perSource, signal, page)),
      callIfHealthy("loc", fetchLOC(kw, perSource, signal, page)),
      callIfHealthy("wikimedia", fetchWikimedia(kw, perSource, signal)),
      callIfHealthy("archive", fetchArchive(kw, perSource, signal)),
      callIfHealthy("rijksmuseum", fetchRijksmuseum(kw, perSource, signal)),
      callIfHealthy("smithsonian", fetchSmithsonian(kw, perSource, signal)),
      callIfHealthy("flickr", fetchFlickrCommons(kw, perSource, signal)),
      callIfHealthy("harvard", fetchHarvard(kw, perSource, signal)),
      callIfHealthy("dpla", fetchDPLA(kw, perSource, signal)),
      callIfHealthy("ddb", fetchDDB(kw, perSource, signal)),
      callIfHealthy("gallica", fetchGallica(kw, perSource, signal)),
      callIfHealthy("wellcome", fetchWellcome(kw, perSource, signal)),
      callIfHealthy("trove", fetchTrove(kw, perSource, signal)),
      callIfHealthy("digitalnz", fetchDigitalNZ(kw, perSource, signal)),
      callIfHealthy("nypl", fetchNYPL(kw, perSource, signal)),
      callIfHealthy("walters", fetchWalters(kw, perSource, signal)),
      callIfHealthy("tate", fetchTate(kw, perSource, signal)),
      callIfHealthy("bhl", fetchBHL(kw, perSource, signal))
    ];
    const settled = await Promise.allSettled(fetches);
    if (STATE.query !== startQuery) {
      STATE.loading = false;
      _secondaryControllers.delete(ac);
      updateLoadMoreLabel();
      return;
    }
    const items = settled.flatMap((r) => r.status === "fulfilled" ? r.value : []);
    const existingIds = new Set(STATE.results.map((r) => r.id));
    const novel = items.filter((r) => !existingIds.has(r.id));
    if (novel.length > 0 && STATE.results.length < CONSTANTS.MAX_RESULTS) {
      const room = CONSTANTS.MAX_RESULTS - STATE.results.length;
      const batch = novel.slice(0, room);
      STATE.results.push(...batch);
      renderGrid(batch);
    }
    STATE.loading = false;
    _secondaryControllers.delete(ac);
    updateLoadMoreLabel();
  }
  function updateLoadMoreLabel() {
    const btn = document.getElementById("btn-load-more");
    if (!btn) return;
    btn.textContent = `load ${STATE.imageCount} more`;
  }
  async function runSearch(query, forceRefresh = false) {
    if (!query.trim()) return;
    saveSearchHistory(query.trim());
    hideSearchHistory();
    for (const ac of _secondaryControllers) {
      try {
        ac.abort();
      } catch (_) {
      }
    }
    _secondaryControllers.clear();
    if (STATE.disabledSources.size >= ALL_SOURCES.length) {
      clearGrid();
      document.getElementById("image-grid").innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;min-height:calc(100vh - 4px);">
        <p>all sources disabled \u2014 enable some in api keys</p>
        <span>click the key icon to manage sources</span>
      </div>`;
      return;
    }
    STATE.imageCount = parseInt(document.getElementById("count-slider").value) || 24;
    STATE.query = query.trim();
    const { positive: _posQuery, negatives: _negTerms } = parseNegativeTerms(STATE.query);
    const effectiveQuery = _posQuery || STATE.query;
    if (STATE.crossRefMode) {
      STATE.crossRefMode = null;
      STATE.crossRefTerms = [];
      STATE.referenceImages = [];
      hideReferenceStrip();
      hideConceptPills();
      const cb = document.getElementById("connect-btn");
      if (cb) cb.textContent = "connect";
      const ib = document.getElementById("interpret-btn");
      if (ib) ib.innerHTML = '<span>interpret</span><span style="color:var(--accent)">\u2726</span>';
    }
    STATE.loading = true;
    STATE.currentPage = 1;
    STATE._searchGen++;
    const gen = STATE._searchGen;
    STATE.results = [];
    STATE._failedImages = 0;
    STATE.fuseIndex = null;
    clearTimeout(_fuseFilterTimer);
    document.getElementById("more-container").style.display = "none";
    clearGrid();
    _resetLazyObserver();
    showLoading();
    STATE.keywords = STATE.searchMode !== "exact" && STATE.prefetchedQuery === effectiveQuery && STATE.prefetchedKeywords.length ? STATE.prefetchedKeywords : [effectiveQuery];
    renderKeywordPills(STATE.keywords);
    if (STATE.searchMode !== "exact" && STATE.keywords.length <= 1) {
      expandKeywords(effectiveQuery).then((kws) => {
        STATE.keywords = kws;
        renderKeywordPills(kws);
      }).catch(() => {
      });
    }
    const _rrg = renderGrid;
    let _buf = [];
    let _restored = false;
    const _flush = () => {
      if (_buf.length) {
        _rrg(_buf.splice(0));
      }
    };
    const _fastTimer = setTimeout(_flush, 80);
    const _batchTimer = setTimeout(() => {
      clearTimeout(_fastTimer);
      _restored = true;
      renderGrid = _rrg;
      _flush();
    }, 300);
    const _restore = () => {
      clearTimeout(_fastTimer);
      clearTimeout(_batchTimer);
      _restored = true;
      renderGrid = _rrg;
      _flush();
    };
    renderGrid = (items) => {
      _buf.push(...items);
      if (!_restored && _buf.length >= 12) {
        clearTimeout(_fastTimer);
        _flush();
      }
    };
    hideCacheIndicator();
    if (!forceRefresh) {
      const cached = cacheGet(STATE.query);
      if (cached) {
        _restore();
        STATE.results = cached.results;
        if (cached.keywords?.length) STATE.keywords = cached.keywords;
        renderGrid(getDisplayResults(STATE.results, STATE.query));
        STATE.loading = false;
        hideLoading();
        showCacheIndicator(STATE.query);
        document.getElementById("more-container").style.display = "flex";
        loadFuse(() => buildFuseIndex());
        const bgQuery = STATE.query;
        fetchAll(STATE.keywords, STATE.imageCount, true).then((fresh) => {
          if (STATE.query !== bgQuery) return;
          const existingIds = new Set(STATE.results.map((r) => r.id));
          const novel = fresh.filter((r) => !existingIds.has(r.id));
          if (novel.length > STATE.results.length * 0.2) {
            const merged = [...STATE.results, ...novel].slice(0, CONSTANTS.MAX_RESULTS);
            STATE.results = merged;
            cacheSet(STATE.query, STATE.results, STATE.keywords);
            updateCacheIndicator(STATE.query);
          }
        }).catch(() => {
        });
        return;
      }
    }
    const _wctTimer = setTimeout(() => {
      if (STATE.abortController && !STATE.abortController.signal.aborted) {
        STATE.abortController.abort();
      }
      _restore();
    }, 12e3);
    const all = await fetchAll(STATE.keywords, STATE.imageCount);
    clearTimeout(_wctTimer);
    _restore();
    if (gen !== STATE._searchGen) return;
    STATE.results = all.slice(0, CONSTANTS.MAX_RESULTS);
    cacheSet(STATE.query, STATE.results, STATE.keywords);
    if (STATE.searchMode === "exact") {
      const lq = STATE.query.toLowerCase();
      const ROGUE_SOURCES = /* @__PURE__ */ new Set(["wikimedia", "flickr"]);
      STATE.results = STATE.results.filter((r) => {
        if (!ROGUE_SOURCES.has(r.source)) return true;
        return `${r.title || ""} ${r.description || ""}`.toLowerCase().includes(lq);
      });
      STATE.results = [
        ...STATE.results.filter((r) => `${r.title || ""} ${r.description || ""}`.toLowerCase().includes(lq)),
        ...STATE.results.filter((r) => !`${r.title || ""} ${r.description || ""}`.toLowerCase().includes(lq))
      ];
    }
    if (_negTerms.length) {
      STATE.results = filterNegativeTerms(STATE.results, _negTerms);
    }
    clearGrid();
    const visible = getDisplayResults(STATE.results, effectiveQuery);
    if (visible.length) renderGrid(visible);
    else {
      showEmptyState();
      trySpellingSuggestion(effectiveQuery);
    }
    STATE.loading = false;
    hideLoading();
    showCacheIndicator(STATE.query);
    document.getElementById("more-container").style.display = "flex";
    updateLoadMoreLabel();
    loadFuse(() => buildFuseIndex());
    setTimeout(checkFailedImages, 3e3);
    var _dfs = document.getElementById("date-filter-section");
    var _afs = document.getElementById("aspect-filter-section");
    if (_dfs) _dfs.style.display = "";
    if (_afs) _afs.style.display = "";
    document.getElementById("color-filter-section").style.display = "";
  }
  var _HISTORY_KEY = "inspo_search_history";
  var _HISTORY_MAX = 10;
  function saveSearchHistory(q) {
    if (!q || q.length < 2) return;
    let hist = loadSearchHistory();
    hist = [q, ...hist.filter((h) => h !== q)].slice(0, _HISTORY_MAX);
    try {
      localStorage.setItem(_HISTORY_KEY, JSON.stringify(hist));
    } catch (_) {
    }
  }
  function loadSearchHistory() {
    try {
      const raw = localStorage.getItem(_HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }
  function renderSearchHistory(filter) {
    const el = document.getElementById("search-history-dropdown");
    if (!el) return;
    const hist = loadSearchHistory().filter(
      (h) => !filter || h.toLowerCase().includes(filter.toLowerCase())
    );
    if (!hist.length) {
      el.hidden = true;
      return;
    }
    el.innerHTML = "";
    hist.forEach((h, i) => {
      const btn = document.createElement("button");
      btn.className = "search-history-item";
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", "false");
      btn.dataset.i = i;
      btn.textContent = h;
      el.appendChild(btn);
    });
    el.hidden = false;
  }
  function hideSearchHistory() {
    const el = document.getElementById("search-history-dropdown");
    if (el) el.hidden = true;
  }
  async function trySpellingSuggestion(query) {
    if (!query || query.trim().length < 3) return;
    try {
      const ac = new AbortController();
      setTimeout(() => ac.abort(), 3e3);
      const res = await fetch(
        `https://api.datamuse.com/words?sp=${encodeURIComponent(query.trim())}&max=1`,
        { signal: ac.signal }
      );
      const data = await res.json();
      if (!Array.isArray(data) || !data.length) return;
      const suggestion = data[0]?.word;
      if (!suggestion || suggestion === query.trim().toLowerCase()) return;
      const emptyState = document.querySelector(".empty-state");
      if (!emptyState) return;
      const hint = document.createElement("div");
      hint.className = "empty-state-suggestion";
      const btn = document.createElement("button");
      btn.className = "empty-suggestion-btn";
      btn.textContent = suggestion;
      btn.addEventListener("click", () => {
        document.getElementById("search-input").value = suggestion;
        runSearch(suggestion);
      });
      hint.append("did you mean: ", btn, "?");
      emptyState.appendChild(hint);
    } catch (_) {
    }
  }
  var _searchInputEl = document.getElementById("search-input");
  _searchInputEl.addEventListener("focus", () => {
    renderSearchHistory(_searchInputEl.value.trim());
  });
  _searchInputEl.addEventListener("input", () => {
    renderSearchHistory(_searchInputEl.value.trim());
    if (STATE.autoSearch && typeof debouncedAutoSearch === "function") debouncedAutoSearch(_searchInputEl.value);
  });
  _searchInputEl.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideSearchHistory();
  });
  document.getElementById("search-history-dropdown")?.addEventListener("mousedown", (e) => {
    const btn = e.target.closest(".search-history-item");
    if (!btn) return;
    e.preventDefault();
    const q = btn.textContent.trim();
    _searchInputEl.value = q;
    hideSearchHistory();
    runSearch(q);
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".sidebar-section")) hideSearchHistory();
  });
  document.querySelector(".logo").addEventListener("click", () => {
    if (STATE.abortController) {
      try {
        STATE.abortController.abort();
      } catch (_) {
      }
      STATE.abortController = null;
    }
    for (const ac of _secondaryControllers) {
      try {
        ac.abort();
      } catch (_) {
      }
    }
    _secondaryControllers.clear();
    STATE.query = "";
    STATE.keywords = [];
    STATE.results = [];
    STATE.selected = [];
    STATE.loading = false;
    STATE.currentPage = 1;
    STATE.fuseIndex = null;
    STATE.crossRefMode = null;
    STATE.crossRefTerms = [];
    STATE.referenceImages = [];
    document.getElementById("search-input").value = "";
    clearGrid();
    hideLoading();
    renderKeywordPills([]);
    document.getElementById("local-filter-section").style.display = "none";
    document.getElementById("local-filter").value = "";
    document.getElementById("more-container").style.display = "none";
    hideReferenceStrip();
    hideConceptPills();
    hideFloatingBar();
    document.getElementById("search-input").focus();
  });
  document.getElementById("search-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = e.target.value.trim();
      if (STATE.selected.length >= 2 && !q) {
        e.preventDefault();
        runConnect();
        return;
      }
      if (q) runSearch(q);
    }
  });
  document.getElementById("btn-search-mode")?.addEventListener("click", () => {
    setSearchMode(STATE.searchMode === "explore" ? "exact" : "explore");
  });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && String(e.key).toLowerCase() === "e") {
      e.preventDefault();
      setSearchMode(STATE.searchMode === "explore" ? "exact" : "explore");
    }
  });
  document.getElementById("btn-refresh-cache")?.addEventListener("click", () => {
    if (STATE.query) runSearch(STATE.query, true);
  });
  document.getElementById("btn-load-more")?.addEventListener("click", fetchMoreResults);
  var debouncedPrefetch = debounce(async (q) => {
    if (!q.trim() || q.trim() === STATE.query || STATE.searchMode === "exact") return;
    STATE.prefetchedQuery = q.trim();
    STATE.prefetchedKeywords = await expandKeywords(q.trim());
  }, 400);
  document.getElementById("search-input")?.addEventListener("keyup", (e) => {
    if (e.key !== "Enter") debouncedPrefetch(e.target.value);
  });
  var countSlider = document.getElementById("count-slider");
  var countLabel = document.getElementById("count-label");
  countSlider.addEventListener("input", () => {
    STATE.imageCount = parseInt(countSlider.value, 10);
    countLabel.textContent = STATE.imageCount + " images";
    updateLoadMoreLabel();
  });
  var debouncedRerender = debounce(() => {
    if (STATE.results.length <= 0 || !_lastDisplayOrder.length) return;
    const target = _lastDisplayOrder.slice(0, STATE.imageCount);
    const grid = document.getElementById("image-grid");
    const currentCards = grid.querySelectorAll(".image-card");
    const currentCount = currentCards.length;
    const targetCount = target.length;
    if (targetCount > currentCount) {
      const toAdd = target.slice(currentCount);
      (_realRenderGrid || renderGrid)(toAdd);
    } else if (targetCount < currentCount) {
      for (let i = currentCount - 1; i >= targetCount; i--) {
        const card = currentCards[i];
        const itemId = card?.dataset?.id;
        if (itemId) {
          renderedIds.delete(itemId);
          _gridItemMap.delete(itemId);
        }
        card?.remove();
      }
    }
    updateLoadMoreLabel();
  }, CONSTANTS.DEBOUNCE_SLIDER);
  countSlider.addEventListener("input", debouncedRerender);
  var themeToggle = document.getElementById("theme-toggle");
  themeToggle.addEventListener("click", () => {
    const wasDark = document.body.classList.contains("dark") || !document.body.classList.contains("light") && window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.body.classList.remove("dark", "light");
    if (wasDark) {
      document.body.classList.add("light");
    } else {
      document.body.classList.add("dark");
    }
    const isDark = !wasDark;
    themeToggle.textContent = isDark ? "light" : "dark";
    localStorage.setItem("inspo_theme", isDark ? "dark" : "light");
    if (typeof boardChannel !== "undefined" && boardChannel) {
      boardChannel.postMessage({ type: "theme", dark: isDark });
    }
  });
  (function initTheme() {
    const saved = localStorage.getItem("inspo_theme");
    if (saved === "dark") {
      document.body.classList.add("dark");
      themeToggle.textContent = "light";
    } else if (saved === "light") {
      document.body.classList.add("light");
      themeToggle.textContent = "dark";
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      themeToggle.textContent = "light";
    }
  })();
  function sketchToCanvas(imgEl) {
    const MAX_W = 400;
    let sw = imgEl.naturalWidth || imgEl.offsetWidth || 400;
    let sh = imgEl.naturalHeight || imgEl.offsetHeight || 300;
    if (sw > MAX_W) {
      sh = Math.round(sh * (MAX_W / sw));
      sw = MAX_W;
    }
    const off = document.createElement("canvas");
    off.width = sw;
    off.height = sh;
    const ctx = off.getContext("2d");
    ctx.drawImage(imgEl, 0, 0, sw, sh);
    const src = ctx.getImageData(0, 0, sw, sh);
    const gray = new Uint8ClampedArray(sw * sh);
    for (let i = 0; i < sw * sh; i++) {
      const p = i * 4;
      gray[i] = 0.299 * src.data[p] + 0.587 * src.data[p + 1] + 0.114 * src.data[p + 2];
    }
    const out = ctx.createImageData(sw, sh);
    for (let y = 1; y < sh - 1; y++) {
      for (let x = 1; x < sw - 1; x++) {
        const g = (r, c) => gray[(y + r) * sw + (x + c)];
        const gx = -g(-1, -1) + g(-1, 1) - 2 * g(0, -1) + 2 * g(0, 1) - g(1, -1) + g(1, 1);
        const gy = -g(-1, -1) - 2 * g(-1, 0) - g(-1, 1) + g(1, -1) + 2 * g(1, 0) + g(1, 1);
        const val = 255 - Math.min(255, Math.sqrt(gx * gx + gy * gy));
        const p = (y * sw + x) * 4;
        out.data[p] = out.data[p + 1] = out.data[p + 2] = val;
        out.data[p + 3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);
    return off;
  }
  function applySketchToCard(card, img) {
    if (card.querySelector(".sketch-overlay")) return;
    img.style.filter = "grayscale(1) contrast(1.4) brightness(1.1)";
    img.style.transition = "filter 0.5s ease";
    const doSobel = () => {
      if (!STATE.sketchMode) return;
      if (card.querySelector(".sketch-overlay")) return;
      try {
        const cvs = sketchToCanvas(img);
        cvs.className = "sketch-overlay";
        img.style.opacity = "0";
        img.style.filter = "";
        card.appendChild(cvs);
        requestAnimationFrame(() => {
          cvs.style.opacity = "1";
        });
      } catch {
      }
    };
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(doSobel, { timeout: 2e3 });
    } else {
      setTimeout(doSobel, 100);
    }
  }
  function applySketchMode() {
    const cards = Array.from(document.querySelectorAll(".image-card"));
    const BATCH = 3;
    let idx = 0;
    function processBatch(deadline) {
      if (!STATE.sketchMode) return;
      let count = 0;
      while (idx < cards.length && count < BATCH) {
        if (typeof deadline !== "undefined" && deadline.timeRemaining && deadline.timeRemaining() < 5 && count > 0) break;
        const card = cards[idx++];
        const img = card.querySelector("img");
        if (img && img.complete && img.naturalWidth > 1) applySketchToCard(card, img);
        count++;
      }
      if (idx < cards.length) {
        if (typeof requestIdleCallback === "function") {
          requestIdleCallback(processBatch, { timeout: 2e3 });
        } else {
          setTimeout(() => processBatch(), 50);
        }
      }
    }
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(processBatch, { timeout: 1e3 });
    } else {
      setTimeout(() => processBatch(), 50);
    }
  }
  function removeSketchMode() {
    document.querySelectorAll(".sketch-overlay").forEach((c) => c.remove());
    document.querySelectorAll(".image-card img").forEach((img) => {
      img.style.opacity = "";
      img.style.filter = "";
      img.style.transition = "";
    });
  }
  var btnBW = document.getElementById("btn-bw");
  btnBW.addEventListener("click", () => {
    STATE.sketchMode = !STATE.sketchMode;
    if (STATE.sketchMode) {
      applySketchMode();
      btnBW.textContent = "colour";
      btnBW.classList.add("active");
    } else {
      removeSketchMode();
      btnBW.textContent = "b&w";
      btnBW.classList.remove("active");
    }
  });
  var btnSketch = document.getElementById("btn-sketch");
  btnSketch.addEventListener("click", () => {
    if (_fabricCanvas) {
      destroyFabricOverlay();
      btnSketch.classList.remove("active");
    } else {
      initFabricOverlay();
      btnSketch.classList.add("active");
    }
  });
  var _fabricCanvas = null;
  function getGridBounds() {
    const sidebar = document.getElementById("sidebar");
    const panel = document.getElementById("panel");
    const sidebarW = sidebar ? sidebar.offsetWidth : 0;
    const panelW = panel && panel.classList.contains("open") ? panel.offsetWidth : 0;
    return {
      left: sidebarW,
      top: 0,
      width: window.innerWidth - sidebarW - panelW,
      height: window.innerHeight
    };
  }
  function positionFabricOverlay() {
    const overlay = document.getElementById("fabric-overlay");
    const bounds = getGridBounds();
    overlay.style.left = bounds.left + "px";
    overlay.style.top = bounds.top + "px";
    overlay.style.width = bounds.width + "px";
    overlay.style.height = bounds.height + "px";
    if (_fabricCanvas) {
      _fabricCanvas.setWidth(bounds.width);
      _fabricCanvas.setHeight(bounds.height);
    }
  }
  function setupFabricTools(fc, toolSelector, clearId, exportId) {
    document.querySelectorAll(toolSelector).forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(toolSelector).forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const tool = btn.dataset.tool;
        const inkColor = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#1a1a18";
        const bgColor = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#F7F5F2";
        if (tool === "pencil") {
          fc.isDrawingMode = true;
          fc.freeDrawingBrush = new fabric.PencilBrush(fc);
          fc.freeDrawingBrush.color = inkColor;
          fc.freeDrawingBrush.width = 2;
        } else if (tool === "eraser") {
          fc.isDrawingMode = true;
          fc.freeDrawingBrush = new fabric.PencilBrush(fc);
          fc.freeDrawingBrush.color = bgColor;
          fc.freeDrawingBrush.width = 16;
        } else {
          fc.isDrawingMode = false;
          const cx = fc.getWidth() / 2, cy = fc.getHeight() / 2;
          if (tool === "text") {
            const t = new fabric.IText("type here", { left: cx - 60, top: cy, fontFamily: "DM Mono", fontSize: 16, fill: inkColor });
            fc.add(t);
            fc.setActiveObject(t);
          } else if (tool === "rect") {
            const r = new fabric.Rect({ left: cx - 50, top: cy - 25, width: 100, height: 50, fill: "transparent", stroke: inkColor, strokeWidth: 1 });
            fc.add(r);
            fc.setActiveObject(r);
          } else if (tool === "line") {
            const l = new fabric.Line([cx - 100, cy, cx + 100, cy], { stroke: inkColor, strokeWidth: 1 });
            fc.add(l);
            fc.setActiveObject(l);
          }
        }
      });
    });
    document.getElementById(clearId)?.addEventListener("click", () => fc.clear());
    document.getElementById(exportId)?.addEventListener("click", () => {
      const dataUrl = fc.toDataURL({ format: "png", quality: 1 });
      const link = document.createElement("a");
      link.download = `insposearch-sketch-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    });
  }
  function initFabricOverlay() {
    loadFabric(() => {
      const overlay = document.getElementById("fabric-overlay");
      overlay.style.display = "";
      positionFabricOverlay();
      const canvasEl = document.getElementById("fabric-canvas");
      const bounds = getGridBounds();
      canvasEl.width = bounds.width;
      canvasEl.height = bounds.height;
      _fabricCanvas = new fabric.Canvas("fabric-canvas", {
        isDrawingMode: true,
        width: bounds.width,
        height: bounds.height
      });
      const inkColor = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#1a1a18";
      _fabricCanvas.freeDrawingBrush.color = inkColor;
      _fabricCanvas.freeDrawingBrush.width = 2;
      setupFabricTools(_fabricCanvas, ".sketch-tool", "sketch-clear", "sketch-export");
      const closeBtn = document.getElementById("sketch-close");
      const _onClose = () => {
        destroyFabricOverlay();
        btnSketch.classList.remove("active");
      };
      closeBtn.replaceWith(closeBtn.cloneNode(true));
      document.getElementById("sketch-close")?.addEventListener("click", _onClose);
      window.addEventListener("resize", positionFabricOverlay);
    });
  }
  function destroyFabricOverlay() {
    if (_fabricCanvas) {
      _fabricCanvas.dispose();
      _fabricCanvas = null;
    }
    document.getElementById("fabric-overlay").style.display = "none";
    window.removeEventListener("resize", positionFabricOverlay);
  }
  function setActiveViewBtn(view) {
    document.getElementById("btn-grid").classList.toggle("active", view === "grid");
    document.getElementById("btn-3d").classList.toggle("active", view === "3d");
  }
  function switchView(newView) {
    if (newView === "board") {
      toggleBoardOverlay();
      return;
    }
    if (STATE.view === newView) return;
    const canvasEl = document.getElementById("canvas");
    canvasEl.style.opacity = "0";
    setTimeout(() => {
      if (STATE.view === "3d" && typeof disposeThreeView === "function") disposeThreeView();
      STATE.view = newView;
      setActiveViewBtn(newView);
      const grid = document.getElementById("image-grid");
      const three = document.getElementById("three-canvas");
      canvasEl.classList.remove("view-3d");
      if (newView === "grid") {
        grid.style.display = "";
        three.classList.remove("active");
        if (STATE.results.length > 0) renderGrid(STATE.results.slice(0, STATE.imageCount));
      } else if (newView === "3d") {
        grid.style.display = "none";
        three.classList.add("active");
        canvasEl.classList.add("view-3d");
        loadThreeJS(initThreeView);
      }
      canvasEl.style.opacity = "1";
    }, 200);
  }
  document.getElementById("btn-grid")?.addEventListener("click", () => switchView("grid"));
  document.getElementById("btn-board")?.addEventListener("click", () => toggleBoardOverlay());
  document.getElementById("btn-3d")?.addEventListener("click", () => switchView("3d"));
  setActiveViewBtn("grid");
  console.log("[insposearch] Phase 4 \u2014 Sketch Mode & Controls ready.");
  var boardCardMap = /* @__PURE__ */ new WeakMap();
  var boardPositions = {};
  var boardInteract = { drag: null, resize: null };
  (function installBoardListeners() {
    function onMove(cx, cy) {
      if (boardInteract.drag) {
        const { card, startX, startY, origLeft, origTop } = boardInteract.drag;
        const boardEl = document.getElementById("board-canvas");
        const bw = boardEl.offsetWidth, bh = boardEl.offsetHeight;
        const cw = card.offsetWidth, ch = card.offsetHeight;
        card.style.left = Math.min(bw - cw, Math.max(0, origLeft + (cx - startX))) + "px";
        card.style.top = Math.min(bh - ch, Math.max(0, origTop + (cy - startY))) + "px";
      }
      if (boardInteract.resize) {
        const { card, startX, startW } = boardInteract.resize;
        card.style.width = Math.max(80, Math.min(600, startW + (cx - startX))) + "px";
      }
    }
    function onEnd() {
      if (boardInteract.drag) {
        const dc = boardInteract.drag.card;
        const di = boardCardMap.get(dc);
        if (_boardSnapEnabled) {
          dc.style.left = snapToGrid(parseInt(dc.style.left, 10) || 0) + "px";
          dc.style.top = snapToGrid(parseInt(dc.style.top, 10) || 0) + "px";
        }
        if (di) {
          boardPositions[di.id] = {
            x: parseInt(dc.style.left, 10) || 0,
            y: parseInt(dc.style.top, 10) || 0,
            w: dc.offsetWidth
          };
          if (typeof persistBoardState === "function") persistBoardState();
        }
        dc.style.zIndex = "";
        boardInteract.drag = null;
      }
      boardInteract.resize = null;
    }
    document.addEventListener("mousemove", (e) => onMove(e.clientX, e.clientY));
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchmove", (e) => {
      if (boardInteract.drag || boardInteract.resize) {
        e.preventDefault();
        const t = e.touches[0];
        onMove(t.clientX, t.clientY);
      }
    }, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);
  })();
  function initBoardView() {
    const boardEl = document.getElementById("board-canvas");
    boardEl.querySelectorAll(".board-card").forEach((c) => c.remove());
    if (!STATE.selected.length) {
      if (!boardEl.querySelector(".board-hint")) {
        const hint = document.createElement("div");
        hint.className = "board-hint";
        hint.style.cssText = "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:var(--font-display);font-size:18px;font-weight:300;font-style:italic;color:var(--ink-3);pointer-events:none;text-align:center;";
        hint.innerHTML = '<p>drag images here to start a board</p><span style="font-family:var(--font-ui);font-size:10px;letter-spacing:0.1em;">select references first, then arrange freely</span>';
        boardEl.appendChild(hint);
      }
      return;
    }
    boardEl.querySelectorAll(".board-hint").forEach((h) => h.remove());
    const cols = Math.ceil(Math.sqrt(STATE.selected.length));
    const cardW = 200;
    const gap = 24;
    STATE.selected.forEach((item, i) => {
      const saved = boardPositions[item.id];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = saved ? saved.x : 24 + col * (cardW + gap);
      const y = saved ? saved.y : 24 + row * (cardW * 0.75 + gap);
      const w = saved ? saved.w : cardW;
      createBoardCard(item, x, y, boardEl, w);
    });
  }
  function createBoardCard(item, x, y, container, w = 200) {
    const card = document.createElement("div");
    card.className = "board-card";
    card.style.left = x + "px";
    card.style.top = y + "px";
    card.style.width = w + "px";
    boardCardMap.set(card, item);
    const img = document.createElement("img");
    img.src = item.thumb;
    img.alt = item.title;
    img.draggable = false;
    img.style.cssText = "display:block;width:100%;height:auto;";
    const title = document.createElement("div");
    title.className = "board-title";
    title.textContent = item.title;
    const handle = document.createElement("div");
    handle.className = "resize-handle";
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "board-delete-btn";
    deleteBtn.textContent = "\xD7";
    deleteBtn.title = "remove from board";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const removedItem = boardCardMap.get(card);
      card.remove();
      if (removedItem) {
        if (_isBoardPopup) {
          delete boardPositions[removedItem.id];
          if (typeof persistBoardState === "function") persistBoardState();
          if (boardChannel) boardChannel.postMessage({ type: "board-delete", itemId: removedItem.id });
        } else {
          STATE.selected = STATE.selected.filter((s) => s.id !== removedItem.id);
          delete boardPositions[removedItem.id];
          document.getElementById("card-" + removedItem.id)?.classList.remove("selected");
          updateFloatingBar();
          updatePanel();
          if (typeof persistBoardState === "function") persistBoardState();
          if (typeof broadcastBoardSync === "function") broadcastBoardSync();
        }
        const boardEl = document.getElementById("board-canvas");
        if (!boardEl.querySelectorAll(".board-card").length) initBoardView();
      }
    });
    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(handle);
    card.appendChild(deleteBtn);
    container.appendChild(card);
    card.addEventListener("mousedown", (e) => {
      if (e.target === handle) return;
      boardInteract.drag = {
        card,
        startX: e.clientX,
        startY: e.clientY,
        origLeft: parseInt(card.style.left, 10),
        origTop: parseInt(card.style.top, 10)
      };
      card.style.zIndex = "100";
      e.preventDefault();
    });
    card.addEventListener("touchstart", (e) => {
      if (e.target === handle) return;
      const t = e.touches[0];
      boardInteract.drag = {
        card,
        startX: t.clientX,
        startY: t.clientY,
        origLeft: parseInt(card.style.left, 10),
        origTop: parseInt(card.style.top, 10)
      };
      card.style.zIndex = "100";
    }, { passive: true });
    handle.addEventListener("mousedown", (e) => {
      boardInteract.resize = { card, startX: e.clientX, startW: card.offsetWidth };
      e.preventDefault();
      e.stopPropagation();
    });
    handle.addEventListener("touchstart", (e) => {
      const t = e.touches[0];
      boardInteract.resize = { card, startX: t.clientX, startW: card.offsetWidth };
      e.stopPropagation();
    }, { passive: true });
    card.addEventListener("dblclick", (e) => {
      if (e.target === handle) return;
      const clickedItem = boardCardMap.get(card);
      if (!clickedItem) return;
      if (!STATE.selected.find((s) => s.id === clickedItem.id)) {
        STATE.selected.push(clickedItem);
      }
      updatePanel();
    });
  }
  document.getElementById("btn-export")?.addEventListener("click", async () => {
    const btn = document.getElementById("btn-export");
    btn.textContent = "exporting...";
    btn.disabled = true;
    try {
      await new Promise((resolve) => loadHtml2Canvas(resolve));
      const boardEl = document.getElementById("board-canvas");
      const exportBg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#F7F5F2";
      const cvs = await html2canvas(boardEl, {
        backgroundColor: exportBg,
        useCORS: true,
        scale: 2,
        ignoreElements: (el) => el.id === "btn-export"
      });
      const link = document.createElement("a");
      link.download = `insposearch-board-${Date.now()}.png`;
      link.href = cvs.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.warn("Export failed:", err.message);
    } finally {
      btn.textContent = "export";
      btn.disabled = false;
    }
  });
  console.log("[insposearch] Phase 5 \u2014 Board View ready.");
  var _boardSnapEnabled = false;
  var SNAP_GRID = 24;
  function snapToGrid(val) {
    return Math.round(val / SNAP_GRID) * SNAP_GRID;
  }
  document.getElementById("btn-snap-grid")?.addEventListener("click", () => {
    _boardSnapEnabled = !_boardSnapEnabled;
    const btn = document.getElementById("btn-snap-grid");
    btn.style.opacity = _boardSnapEnabled ? "1" : "0.6";
    btn.textContent = _boardSnapEnabled ? "snap \u2713" : "snap";
  });
  async function captureGridSnapshot() {
    const canvasEl = document.getElementById("canvas");
    const metadata = {
      searchTerm: STATE.query || "",
      mode: STATE.searchMode,
      sourceCount: [...new Set(STATE.results.map((r) => r.source))].length,
      imageCount: STATE.results.length,
      activeSources: [...new Set(STATE.results.map((r) => r.source))].slice(0, 8),
      selectedImages: STATE.selected.slice(0, 5).map((s) => ({
        title: s.title,
        source: s.source,
        tags: (s.tags || []).slice(0, 4)
      }))
    };
    try {
      await new Promise((resolve) => loadHtml2Canvas(resolve));
      const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#0a0a0a";
      const cvs = await html2canvas(canvasEl, {
        backgroundColor: bg,
        useCORS: true,
        scale: 0.4,
        logging: false,
        ignoreElements: (el) => el.id === "reference-strip" || el.classList?.contains("empty-state")
      });
      let quality = 0.7;
      let dataUrl = cvs.toDataURL("image/jpeg", quality);
      while (dataUrl.length * 0.75 > 2e5 && quality > 0.2) {
        quality -= 0.15;
        dataUrl = cvs.toDataURL("image/jpeg", quality);
      }
      return { base64: dataUrl.split(",")[1], metadata };
    } catch (e) {
      console.warn("[snapshot]", e.message);
      return { base64: null, metadata };
    }
  }
  async function _callOllama(prompt, base64, mimeType) {
    const base = (STATE.ollamaEndpoint || "http://localhost:11434").replace(/\/$/, "");
    const model = STATE.ollamaModel || "llava";
    const userContent = [];
    if (base64) userContent.push({ type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } });
    userContent.push({ type: "text", text: prompt });
    const res = await fetch(base + "/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 600, messages: [{ role: "user", content: userContent }] })
    });
    if (!res.ok) throw new Error("Ollama " + res.status);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }
  async function _callOllamaChat(history, systemPrompt, base64, mimeType) {
    const base = (STATE.ollamaEndpoint || "http://localhost:11434").replace(/\/$/, "");
    const model = STATE.ollamaModel || "llava";
    const messages = [{ role: "system", content: systemPrompt }];
    history.forEach((m, idx) => {
      if (idx === 0 && base64) {
        messages.push({ role: "user", content: [
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          { type: "text", text: m.content }
        ] });
      } else {
        messages.push({ role: m.role === "assistant" ? "assistant" : "user", content: m.content });
      }
    });
    const res = await fetch(base + "/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 600, messages })
    });
    if (!res.ok) throw new Error("Ollama " + res.status);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }
  async function callAI(prompt, base64 = null, mimeType = "image/jpeg") {
    const provider = STATE.aiProvider || "gemini";
    if (isAIProviderRateLimited(provider)) throw new Error(`${provider} rate limited \u2014 try again in a minute`);
    trackAIProviderCall(provider);
    if (provider === "claude" && STATE.claudeKey) return _callClaude(prompt, base64, mimeType);
    if (provider === "openai" && STATE.openaiKey) return _callOpenAI(prompt, base64, mimeType);
    if (provider === "ollama") return _callOllama(prompt, base64, mimeType);
    if (!STATE.geminiKey) throw new Error("no ai key \u2014 add a key in api keys panel");
    return _callGeminiSingle(prompt, base64, mimeType);
  }
  async function callAIChat(history, systemPrompt, base64 = null, mimeType = "image/jpeg") {
    const provider = STATE.aiProvider || "gemini";
    if (isAIProviderRateLimited(provider)) throw new Error(`${provider} rate limited \u2014 try again in a minute`);
    trackAIProviderCall(provider);
    if (provider === "claude" && STATE.claudeKey) return _callClaudeChat(history, systemPrompt, base64, mimeType);
    if (provider === "openai" && STATE.openaiKey) return _callOpenAIChat(history, systemPrompt, base64, mimeType);
    if (provider === "ollama") return _callOllamaChat(history, systemPrompt, base64, mimeType);
    if (!STATE.geminiKey) throw new Error("no ai key \u2014 add a key in api keys panel");
    return _callGeminiChat(history, systemPrompt, base64, mimeType);
  }
  async function _callGeminiSingle(prompt, base64, mimeType) {
    const parts = [];
    if (base64) parts.push({ inline_data: { mime_type: mimeType, data: base64 } });
    parts.push({ text: prompt });
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${STATE.geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0.7, maxOutputTokens: 600 } })
      }
    );
    if (!res.ok) throw new Error("Gemini " + res.status);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
  async function _callGeminiChat(history, systemPrompt, base64, mimeType) {
    const contents = [];
    history.forEach((m, idx) => {
      const parts = [];
      if (idx === 0 && base64) parts.push({ inline_data: { mime_type: mimeType, data: base64 } });
      parts.push({ text: idx === 0 ? systemPrompt + "\n\n" + m.content : m.content });
      contents.push({ role: m.role === "assistant" ? "model" : "user", parts });
    });
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${STATE.geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents, generationConfig: { temperature: 0.7, maxOutputTokens: 600 } })
      }
    );
    if (!res.ok) throw new Error("Gemini " + res.status);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
  async function _callClaude(prompt, base64, mimeType) {
    const content = [];
    if (base64) content.push({ type: "image", source: { type: "base64", media_type: mimeType, data: base64 } });
    content.push({ type: "text", text: prompt });
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": STATE.claudeKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 600, messages: [{ role: "user", content }] })
    });
    if (!res.ok) throw new Error("Claude " + res.status);
    const data = await res.json();
    return data.content?.[0]?.text || "";
  }
  async function _callClaudeChat(history, systemPrompt, base64, mimeType) {
    const messages = history.map((m, idx) => {
      if (idx === 0 && base64) {
        return { role: "user", content: [
          { type: "image", source: { type: "base64", media_type: mimeType, data: base64 } },
          { type: "text", text: m.content }
        ] };
      }
      return { role: m.role === "assistant" ? "assistant" : "user", content: m.content };
    });
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": STATE.claudeKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 600, system: systemPrompt, messages })
    });
    if (!res.ok) throw new Error("Claude " + res.status);
    const data = await res.json();
    return data.content?.[0]?.text || "";
  }
  async function _callOpenAI(prompt, base64, mimeType) {
    const base = (STATE.openaiEndpoint || "https://api.openai.com").replace(/\/$/, "");
    const userContent = [];
    if (base64) userContent.push({ type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } });
    userContent.push({ type: "text", text: prompt });
    const res = await fetch(base + "/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + STATE.openaiKey },
      body: JSON.stringify({ model: "gpt-4o", max_tokens: 600, messages: [{ role: "user", content: userContent }] })
    });
    if (!res.ok) throw new Error("OpenAI " + res.status);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }
  async function _callOpenAIChat(history, systemPrompt, base64, mimeType) {
    const base = (STATE.openaiEndpoint || "https://api.openai.com").replace(/\/$/, "");
    const messages = [{ role: "system", content: systemPrompt }];
    history.forEach((m, idx) => {
      if (idx === 0 && base64) {
        messages.push({ role: "user", content: [
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          { type: "text", text: m.content }
        ] });
      } else {
        messages.push({ role: m.role === "assistant" ? "assistant" : "user", content: m.content });
      }
    });
    const res = await fetch(base + "/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + STATE.openaiKey },
      body: JSON.stringify({ model: "gpt-4o", max_tokens: 600, messages })
    });
    if (!res.ok) throw new Error("OpenAI " + res.status);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }
  console.log("[insposearch] Phase 3 \u2014 Multi-provider AI + Canvas Snapshot ready.");
  var boardChannel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("inspo-board") : null;
  function persistBoardState() {
    try {
      const items = STATE.selected.map((s) => ({
        id: s.id,
        thumb: s.thumb,
        title: s.title,
        source: s.source,
        tags: s.tags || [],
        sourceUrl: s.sourceUrl || "",
        year: s.year || "",
        colors: s.colors || []
      }));
      localStorage.setItem("inspo_board_state", JSON.stringify({
        items,
        positions: boardPositions,
        overlayOpen: STATE.boardOverlayOpen || false
      }));
    } catch (e) {
    }
  }
  function loadBoardState() {
    try {
      const saved = localStorage.getItem("inspo_board_state");
      if (!saved) return;
      const data = JSON.parse(saved);
      if (Array.isArray(data.items) && data.items.length) {
        STATE.selected = data.items;
        STATE.selected.forEach((item) => {
          document.getElementById("card-" + item.id)?.classList.add("selected");
        });
        if (typeof updateFloatingBar === "function") updateFloatingBar();
      }
      if (data.positions) Object.assign(boardPositions, data.positions);
      if (data.overlayOpen) requestAnimationFrame(() => openBoardOverlay());
    } catch (e) {
    }
  }
  function broadcastBoardSync() {
    if (!boardChannel) return;
    boardChannel.postMessage({
      type: "board-sync",
      items: STATE.selected.map((s) => ({
        id: s.id,
        thumb: s.thumb,
        title: s.title,
        source: s.source,
        tags: s.tags || [],
        sourceUrl: s.sourceUrl || "",
        year: s.year || "",
        colors: s.colors || []
      })),
      positions: { ...boardPositions }
    });
  }
  if (boardChannel && !_isBoardPopup) {
    boardChannel.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === "board-delete") {
        STATE.selected = STATE.selected.filter((s) => s.id !== msg.itemId);
        delete boardPositions[msg.itemId];
        document.getElementById("card-" + msg.itemId)?.classList.remove("selected");
        updateFloatingBar();
        updatePanel();
        persistBoardState();
        syncBoardOverlay();
      }
      if (msg.type === "theme") {
        document.body.classList.remove("dark", "light");
        document.body.classList.add(msg.dark ? "dark" : "light");
        const tt = document.getElementById("theme-toggle");
        if (tt) tt.textContent = msg.dark ? "light" : "dark";
      }
    };
  }
  function openBoardOverlay() {
    document.getElementById("board-overlay").classList.add("open");
    document.getElementById("btn-board").classList.add("active");
    STATE.boardOverlayOpen = true;
    syncBoardOverlay();
    showQuietTip("board-overlay-header", "boards let you drag, compare, and export references", "inspo_tip_boards");
  }
  function closeBoardOverlay() {
    destroyBoardSketch();
    document.getElementById("board-overlay").classList.remove("open");
    document.getElementById("btn-board").classList.remove("active");
    STATE.boardOverlayOpen = false;
  }
  var _boardFabricCanvas = null;
  function initBoardSketch() {
    loadFabric(() => {
      const content = document.getElementById("board-overlay-content");
      const canvasEl = document.getElementById("board-fabric-canvas");
      const w = content.offsetWidth;
      const h = content.offsetHeight;
      canvasEl.width = w;
      canvasEl.height = h;
      canvasEl.style.display = "";
      canvasEl.style.pointerEvents = "auto";
      _boardFabricCanvas = new fabric.Canvas("board-fabric-canvas", {
        isDrawingMode: true,
        width: w,
        height: h
      });
      const inkColor = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#1a1a18";
      _boardFabricCanvas.freeDrawingBrush.color = inkColor;
      _boardFabricCanvas.freeDrawingBrush.width = 2;
      setupFabricTools(_boardFabricCanvas, ".board-sketch-tool", "board-sketch-clear", "board-sketch-export");
      const toolbar = document.getElementById("board-sketch-toolbar");
      toolbar.style.display = "flex";
    });
  }
  function destroyBoardSketch() {
    if (_boardFabricCanvas) {
      _boardFabricCanvas.dispose();
      _boardFabricCanvas = null;
    }
    const canvasEl = document.getElementById("board-fabric-canvas");
    if (canvasEl) {
      canvasEl.style.display = "none";
      canvasEl.style.pointerEvents = "none";
    }
    const toolbar = document.getElementById("board-sketch-toolbar");
    if (toolbar) toolbar.style.display = "none";
    document.getElementById("btn-board-sketch")?.classList.remove("active");
  }
  document.getElementById("btn-board-sketch")?.addEventListener("click", () => {
    if (_boardFabricCanvas) {
      destroyBoardSketch();
    } else {
      initBoardSketch();
      document.getElementById("btn-board-sketch")?.classList.add("active");
    }
  });
  function toggleBoardOverlay() {
    document.getElementById("board-overlay").classList.contains("open") ? closeBoardOverlay() : openBoardOverlay();
  }
  function syncBoardOverlay() {
    if (!document.getElementById("board-overlay").classList.contains("open")) return;
    initBoardView();
  }
  (function installOverlayDrag() {
    const overlay = document.getElementById("board-overlay");
    const header = document.getElementById("board-overlay-header");
    let drag = null;
    function startDrag(cx, cy) {
      const rect = overlay.getBoundingClientRect();
      drag = { startX: cx, startY: cy, origLeft: rect.left, origTop: rect.top };
    }
    function moveDrag(cx, cy) {
      if (!drag) return;
      overlay.style.right = "auto";
      overlay.style.bottom = "auto";
      overlay.style.left = Math.max(0, drag.origLeft + (cx - drag.startX)) + "px";
      overlay.style.top = Math.max(0, drag.origTop + (cy - drag.startY)) + "px";
    }
    function endDrag() {
      drag = null;
    }
    header.addEventListener("mousedown", (e) => {
      if (e.target.tagName === "BUTTON") return;
      startDrag(e.clientX, e.clientY);
      e.preventDefault();
    });
    header.addEventListener("touchstart", (e) => {
      if (e.target.tagName === "BUTTON") return;
      const t = e.touches[0];
      startDrag(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener("mousemove", (e) => moveDrag(e.clientX, e.clientY));
    document.addEventListener("touchmove", (e) => {
      if (drag) {
        const t = e.touches[0];
        moveDrag(t.clientX, t.clientY);
      }
    }, { passive: true });
    document.addEventListener("mouseup", endDrag);
    document.addEventListener("touchend", endDrag);
    document.addEventListener("touchcancel", endDrag);
  })();
  document.getElementById("board-overlay-close")?.addEventListener("click", closeBoardOverlay);
  document.getElementById("btn-board-popout")?.addEventListener("click", () => {
    persistBoardState();
    broadcastBoardSync();
    const url = location.href.split("?")[0] + "?boardpopup=1";
    window.open(url, "inspo-board", "width=900,height=700,resizable=yes");
  });
  (function installBoardDrop() {
    const boardCanvas = document.getElementById("board-canvas");
    boardCanvas.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    });
    boardCanvas.addEventListener("drop", (e) => {
      e.preventDefault();
      const itemId = e.dataTransfer.getData("text/plain");
      let item = STATE.results.find((r) => r.id === itemId) || STATE.selected.find((r) => r.id === itemId);
      if (!item) {
        try {
          const raw = e.dataTransfer.getData("application/json");
          if (raw) item = JSON.parse(raw);
        } catch {
        }
      }
      if (!item) return;
      if (!STATE.selected.find((s) => s.id === item.id)) {
        STATE.selected.push(item);
        const gc = document.getElementById("card-" + item.id);
        if (gc) {
          gc.classList.add("selected");
          const gi = gc.querySelector("img");
          if (gi && gi.complete && gi.naturalWidth > 1) {
            try {
              item.colors = getDominantColors(gi);
            } catch {
            }
          }
        }
        updateFloatingBar();
      }
      const rect = boardCanvas.getBoundingClientRect();
      const x = Math.max(0, e.clientX - rect.left - 100);
      const y = Math.max(0, e.clientY - rect.top - 75);
      let alreadyOnBoard = false;
      boardCanvas.querySelectorAll(".board-card").forEach((bc) => {
        if (boardCardMap.get(bc)?.id === item.id) alreadyOnBoard = true;
      });
      if (!alreadyOnBoard) createBoardCard(item, x, y, boardCanvas);
      persistBoardState();
      broadcastBoardSync();
    });
  })();
  function initBoardPopupMode() {
    const t = localStorage.getItem("inspo_theme");
    if (t === "dark") document.body.classList.add("dark");
    if (t === "light") document.body.classList.remove("dark");
    ["#sidebar", "#canvas", "#panel", "#keys-panel", "#ai-chat-panel"].forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) el.style.display = "none";
    });
    const overlay = document.getElementById("board-overlay");
    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "width:100%",
      "height:100dvh",
      "display:flex",
      "flex-direction:column",
      "background:var(--bg-panel)",
      "border:none",
      "box-shadow:none",
      "resize:none",
      "z-index:1"
    ].join(";");
    overlay.classList.add("open");
    document.getElementById("board-overlay-header").style.cursor = "default";
    document.getElementById("btn-board-popout").style.display = "none";
    syncBoardOverlay();
    if (boardChannel) {
      boardChannel.onmessage = (e) => {
        const msg = e.data;
        if (msg.type === "board-sync") {
          STATE.selected = msg.items || [];
          Object.assign(boardPositions, msg.positions || {});
          persistBoardState();
          initBoardView();
        }
        if (msg.type === "theme") {
          document.body.classList.toggle("dark", msg.dark);
        }
      };
    }
  }
  loadBoardState();
  if (_isBoardPopup) initBoardPopupMode();
  function loadScript(url, cb) {
    if (document.querySelector('script[src="' + url + '"]')) {
      cb();
      return;
    }
    const s = document.createElement("script");
    s.src = url;
    s.onload = cb;
    document.head.appendChild(s);
  }
  function loadThreeJS(cb) {
    if (window.THREE) {
      cb();
      return;
    }
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js", function() {
      loadScript("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js", cb);
    });
  }
  function loadHtml2Canvas(cb) {
    if (window.html2canvas) {
      cb();
      return;
    }
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js", cb);
  }
  function loadColorThief(cb) {
    if (window.ColorThief) {
      cb();
      return;
    }
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/color-thief/2.3.2/color-thief.umd.js", cb);
  }
  function loadTinyColor(cb) {
    if (window.tinycolor) {
      cb();
      return;
    }
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/tinycolor/1.6.0/tinycolor.min.js", cb);
  }
  function loadFuse(cb) {
    if (window.Fuse) {
      cb();
      return;
    }
    loadScript("https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js", cb);
  }
  function loadFabric(cb) {
    if (window.fabric) {
      cb();
      return;
    }
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js", cb);
  }
  function loadOpenSeadragon(cb) {
    if (window.OpenSeadragon) {
      cb();
      return;
    }
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/openseadragon.min.js", cb);
  }
  var _osdViewer = null;
  var IIIF_SOURCES = /* @__PURE__ */ new Set(["met_iiif", "wellcome_iiif", "bodleian", "cudl", "bsb"]);
  var _osdFabricCanvas = null;
  var _osdBwActive = false;
  function openDeepZoom(item) {
    loadOpenSeadragon(() => {
      const modal = document.getElementById("osd-modal");
      modal.classList.add("open");
      let tileSources;
      if (IIIF_SOURCES.has(item.source) && item.iiifManifest) {
        tileSources = item.iiifManifest;
      } else {
        tileSources = { type: "image", url: item.url || item.thumb };
      }
      _osdViewer = OpenSeadragon({
        id: "osd-container",
        tileSources,
        prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/",
        showNavigator: true,
        navigatorPosition: "BOTTOM_RIGHT",
        animationTime: 0.3,
        immediateRender: true,
        maxZoomPixelRatio: 6,
        visibilityRatio: 0.8
      });
      _osdBwActive = false;
      document.getElementById("osd-bw-toggle").textContent = "b&w";
      document.getElementById("osd-bw-toggle").style.opacity = "0.7";
      document.getElementById("osd-sketch-toggle").textContent = "sketch";
      document.getElementById("osd-sketch-toggle").style.opacity = "0.7";
      destroyOsdSketch();
    });
  }
  function closeDeepZoom() {
    destroyOsdSketch();
    if (_osdViewer) {
      _osdViewer.destroy();
      _osdViewer = null;
    }
    _osdBwActive = false;
    document.getElementById("osd-container").innerHTML = "";
    document.getElementById("osd-container").style.filter = "";
    document.getElementById("osd-modal").classList.remove("open");
  }
  document.getElementById("osd-bw-toggle")?.addEventListener("click", () => {
    _osdBwActive = !_osdBwActive;
    const container = document.getElementById("osd-container");
    const btn = document.getElementById("osd-bw-toggle");
    if (_osdBwActive) {
      container.style.filter = "grayscale(1) contrast(1.3) brightness(1.05)";
      btn.textContent = "colour";
      btn.style.opacity = "1";
    } else {
      container.style.filter = "";
      btn.textContent = "b&w";
      btn.style.opacity = "0.7";
    }
  });
  document.getElementById("osd-sketch-toggle")?.addEventListener("click", () => {
    if (_osdFabricCanvas) {
      destroyOsdSketch();
      document.getElementById("osd-sketch-toggle").textContent = "sketch";
      document.getElementById("osd-sketch-toggle").style.opacity = "0.7";
    } else {
      initOsdSketch();
      document.getElementById("osd-sketch-toggle").textContent = "sketch \u2713";
      document.getElementById("osd-sketch-toggle").style.opacity = "1";
    }
  });
  function initOsdSketch() {
    loadFabric(() => {
      const cvs = document.getElementById("osd-fabric-canvas");
      const container = document.getElementById("osd-container");
      cvs.style.display = "";
      cvs.style.pointerEvents = "auto";
      cvs.width = container.offsetWidth;
      cvs.height = container.offsetHeight;
      cvs.style.width = container.offsetWidth + "px";
      cvs.style.height = container.offsetHeight + "px";
      _osdFabricCanvas = new fabric.Canvas("osd-fabric-canvas", {
        isDrawingMode: true,
        width: container.offsetWidth,
        height: container.offsetHeight
      });
      _osdFabricCanvas.freeDrawingBrush.color = "#ffffff";
      _osdFabricCanvas.freeDrawingBrush.width = 2;
      const toolbar = document.getElementById("osd-sketch-toolbar");
      toolbar.style.display = "flex";
      setupFabricTools(_osdFabricCanvas, ".osd-sketch-tool", "osd-sketch-clear", "osd-sketch-export");
      document.getElementById("osd-sketch-close")?.addEventListener("click", () => {
        destroyOsdSketch();
        const _st = document.getElementById("osd-sketch-toggle");
        if (_st) {
          _st.textContent = "sketch";
          _st.style.opacity = "0.7";
        }
      });
    });
  }
  function destroyOsdSketch() {
    if (_osdFabricCanvas) {
      _osdFabricCanvas.dispose();
      _osdFabricCanvas = null;
    }
    const cvs = document.getElementById("osd-fabric-canvas");
    if (cvs) {
      cvs.style.display = "none";
      cvs.style.pointerEvents = "none";
    }
    const toolbar = document.getElementById("osd-sketch-toolbar");
    if (toolbar) toolbar.style.display = "none";
  }
  document.getElementById("osd-close")?.addEventListener("click", closeDeepZoom);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.getElementById("osd-modal").classList.contains("open")) {
      closeDeepZoom();
    }
  });
  var threeScene = null;
  var threeCamera = null;
  var threeRenderer = null;
  var threeControls = null;
  var threeAnimId = null;
  var threeMeshes = [];
  var threeRaycaster = null;
  var threeMouse = null;
  var threeHovered = null;
  function getThreeBg() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#F7F5F2";
    return parseInt(raw.replace("#", "0x"));
  }
  function getThreePosition(image, allImages) {
    const sharedCount = allImages.filter(
      (other) => other.id !== image.id && other.tags.some((t) => image.tags.includes(t))
    ).length;
    const angle = Math.random() * Math.PI * 2;
    const radius = sharedCount > 1 ? 2 + Math.random() * 2 : 6 + Math.random() * 3;
    return new THREE.Vector3(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 4,
      Math.sin(angle) * radius
    );
  }
  function initThreeView() {
    if (!threeMouse) threeMouse = new THREE.Vector2(-9999, -9999);
    const container = document.getElementById("three-canvas");
    container.innerHTML = "";
    threeMeshes = [];
    threeHovered = null;
    const items = STATE.selected.length ? STATE.selected : STATE.results.slice(0, STATE.imageCount);
    if (!items.length) {
      container.style.display = "flex";
      container.style.alignItems = "center";
      container.style.justifyContent = "center";
      container.innerHTML = '<p style="font-family:var(--font-display);font-size:18px;font-weight:300;font-style:italic;color:var(--ink-3);">select images first</p>';
      return;
    }
    const w = container.offsetWidth || window.innerWidth - 240;
    const h = container.offsetHeight || window.innerHeight;
    threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color(getThreeBg());
    threeCamera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    threeCamera.position.set(0, 0, 12);
    threeRenderer = new THREE.WebGLRenderer({ antialias: true });
    threeRenderer.setPixelRatio(window.devicePixelRatio);
    threeRenderer.setSize(w, h);
    container.appendChild(threeRenderer.domElement);
    threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
    threeControls.enableDamping = true;
    threeControls.dampingFactor = 0.05;
    threeControls.enablePan = true;
    threeControls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    threeRaycaster = new THREE.Raycaster();
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    items.forEach((item) => {
      const pos = getThreePosition(item, items);
      const tex = loader.load(item.thumb, (tex2) => {
        const aspect = tex2.image.width / tex2.image.height || 1;
        mesh.scale.set(aspect, 1, 1);
      });
      tex.crossOrigin = "anonymous";
      const geo = new THREE.PlaneGeometry(1.6, 1.6);
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        side: THREE.DoubleSide,
        emissive: new THREE.Color(16777215),
        emissiveMap: tex,
        emissiveIntensity: 0
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.lookAt(threeCamera.position);
      threeScene.add(mesh);
      threeMeshes.push({ mesh, item });
    });
    const ambient = new THREE.AmbientLight(16777215, 0.8);
    threeScene.add(ambient);
    const dirLight = new THREE.DirectionalLight(16777215, 0.4);
    dirLight.position.set(5, 5, 5);
    threeScene.add(dirLight);
    threeRenderer.domElement.addEventListener("mousemove", onThreeMouseMove);
    threeRenderer.domElement.addEventListener("click", onThreeClick);
    const resizeObs = new ResizeObserver(() => {
      const nw = container.offsetWidth;
      const nh = container.offsetHeight;
      threeCamera.aspect = nw / nh;
      threeCamera.updateProjectionMatrix();
      threeRenderer.setSize(nw, nh);
    });
    resizeObs.observe(container);
    threeRenderer._resizeObs = resizeObs;
    function animate() {
      threeAnimId = requestAnimationFrame(animate);
      threeControls.update();
      threeMeshes.forEach(({ mesh, item }) => {
        const target = threeHovered && threeHovered.item.id === item.id ? 0.3 : 0;
        mesh.material.emissiveIntensity += (target - mesh.material.emissiveIntensity) * 0.12;
      });
      threeRenderer.render(threeScene, threeCamera);
    }
    animate();
  }
  function onThreeMouseMove(e) {
    const rect = threeRenderer.domElement.getBoundingClientRect();
    threeMouse.x = (e.clientX - rect.left) / rect.width * 2 - 1;
    threeMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    threeRaycaster.setFromCamera(threeMouse, threeCamera);
    const hits = threeRaycaster.intersectObjects(threeMeshes.map((m) => m.mesh));
    if (hits.length) {
      const hitMesh = hits[0].object;
      threeHovered = threeMeshes.find((m) => m.mesh === hitMesh) || null;
      threeRenderer.domElement.style.cursor = "pointer";
    } else {
      threeHovered = null;
      threeRenderer.domElement.style.cursor = "default";
    }
  }
  function onThreeClick() {
    if (!threeHovered) return;
    const { item } = threeHovered;
    if (!STATE.selected.find((s) => s.id === item.id)) {
      STATE.selected.push(item);
    }
    updatePanel();
  }
  function disposeThreeView() {
    if (threeAnimId) {
      cancelAnimationFrame(threeAnimId);
      threeAnimId = null;
    }
    if (threeRenderer) {
      if (threeRenderer._resizeObs) threeRenderer._resizeObs.disconnect();
      threeRenderer.domElement.removeEventListener("mousemove", onThreeMouseMove);
      threeRenderer.domElement.removeEventListener("click", onThreeClick);
      threeRenderer.dispose();
      const container = document.getElementById("three-canvas");
      if (threeRenderer.domElement.parentNode === container) {
        container.removeChild(threeRenderer.domElement);
      }
      threeRenderer = null;
    }
    if (threeControls) {
      threeControls.dispose();
      threeControls = null;
    }
    threeMeshes.forEach(({ mesh }) => {
      mesh.geometry.dispose();
      if (mesh.material.map) mesh.material.map.dispose();
      if (mesh.material.emissiveMap) mesh.material.emissiveMap.dispose();
      mesh.material.dispose();
    });
    threeMeshes = [];
    threeHovered = null;
    threeScene = null;
    threeCamera = null;
  }
  console.log("[insposearch] Phase 6 \u2014 3D View ready.");
  function formatCount(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B+";
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(0) + "k";
    return String(n);
  }
  function getSourceStats() {
    const deduped = /* @__PURE__ */ new Map();
    KEY_SOURCES.filter((s) => !s.aiProvider).forEach((s) => deduped.set(s.id, s));
    const db = Array.from(deduped.values());
    const noKey = db.filter((s) => s.alwaysOn);
    const withKey = db.filter((s) => !s.alwaysOn);
    const dynNoKey = DYNAMIC_REGISTRY.filter((s) => !s.keyRequired);
    const dynAll = DYNAMIC_REGISTRY;
    const dynNoKeyImages = dynNoKey.reduce((a, s) => a + (s.imageCount || 5e4), 0);
    const dynAllImages = dynAll.reduce((a, s) => a + (s.imageCount || 5e4), 0);
    const manifestActive = (STATE.manifestSources || []).length;
    const totalFetchSources = ALL_SOURCES.length + manifestActive + DYNAMIC_REGISTRY.length;
    return {
      totalSources: db.length + DYNAMIC_REGISTRY.length,
      totalFetchSources,
      noKeySources: noKey.length,
      keySources: withKey.length,
      totalImagesNoKey: noKey.reduce((a, s) => a + (s.imageCount || 0), 0) + dynNoKeyImages,
      totalImagesWithKey: db.reduce((a, s) => a + (s.imageCount || 0), 0) + dynAllImages,
      allSources: db
    };
  }
  (function initOnboarding() {
    const el = document.getElementById("onboarding");
    const track = document.getElementById("ob-track");
    const dotsBox = document.getElementById("ob-dots");
    const prevBtn = document.getElementById("ob-prev");
    const nextBtn = document.getElementById("ob-next");
    const skipBtn = document.getElementById("ob-skip");
    const startBtn = document.getElementById("ob-start");
    const helpBtn = document.getElementById("btn-help");
    const TOTAL = track.children.length;
    let step = 0;
    for (let i = 0; i < TOTAL; i++) {
      const d = document.createElement("button");
      d.className = "ob-dot" + (i === 0 ? " active" : "");
      d.addEventListener("click", () => goTo(i));
      dotsBox.appendChild(d);
    }
    function goTo(n) {
      step = Math.max(0, Math.min(n, TOTAL - 1));
      track.style.transform = `translateX(-${step * 100}%)`;
      dotsBox.querySelectorAll(".ob-dot").forEach((d, i) => d.classList.toggle("active", i === step));
      prevBtn.style.visibility = step === 0 ? "hidden" : "visible";
      nextBtn.style.display = step === TOTAL - 1 ? "none" : "";
      if (step === 3) {
        document.querySelectorAll("#ob-stats-row [data-target]").forEach((el2) => {
          animateCount(el2, Number(el2.dataset.target));
        });
      }
    }
    function populateStats() {
      const s = getSourceStats();
      const heroSrcEl = document.getElementById("ob-hero-src-count");
      const heroImgEl = document.getElementById("ob-hero-img-count");
      if (heroSrcEl) heroSrcEl.textContent = s.totalFetchSources.toLocaleString();
      if (heroImgEl) heroImgEl.textContent = formatCount(s.totalImagesNoKey);
      const sibEl = document.getElementById("sib-text");
      if (sibEl) sibEl.textContent = `${s.totalFetchSources.toLocaleString()} sources \xB7 ${formatCount(s.totalImagesNoKey)} images available \u2014 add api keys to unlock ${formatCount(s.totalImagesWithKey)}`;
      const statsRow = document.getElementById("ob-stats-row");
      const fetchCountEl = document.getElementById("ob-fetch-count");
      if (fetchCountEl) fetchCountEl.textContent = s.totalFetchSources;
      statsRow.innerHTML = `
      <div class="ob-stat">
        <div class="ob-stat-num" id="ob-fetch-count" data-target="${s.totalFetchSources}">0</div>
        <div class="ob-stat-label">sources</div>
      </div>
      <div class="ob-stat">
        <div class="ob-stat-num" data-target="${s.totalSources}">0</div>
        <div class="ob-stat-label">databases</div>
      </div>
      <div class="ob-stat">
        <div class="ob-stat-num" data-target="${s.totalImagesNoKey}">0</div>
        <div class="ob-stat-label">without keys</div>
      </div>
      <div class="ob-stat">
        <div class="ob-stat-num" data-target="${s.totalImagesWithKey}">0</div>
        <div class="ob-stat-label">with all keys</div>
      </div>
    `;
      const catGrid = document.getElementById("ob-cat-grid");
      const cats = [
        { icon: "\u{1F3DB}", label: "museums", ids: SOURCE_GROUPS.museums },
        { icon: "\u{1F4F7}", label: "photography", ids: SOURCE_GROUPS.photography },
        { icon: "\u{1F33F}", label: "nature", ids: SOURCE_GROUPS.nature },
        { icon: "\u{1F4DC}", label: "historical", ids: SOURCE_GROUPS.historical },
        { icon: "\u{1F3A8}", label: "art & design", ids: SOURCE_GROUPS.artdesign }
      ];
      catGrid.innerHTML = cats.map(
        (c) => `<div class="ob-cat">
        <span>${c.icon}</span> ${c.label}
        <span class="ob-cat-count">${c.ids.length} sources</span>
      </div>`
      ).join("");
      const listEl = document.getElementById("ob-source-list");
      listEl.innerHTML = s.allSources.map(
        (src) => `<div class="ob-src-item">
        <span>${src.name}${!src.alwaysOn ? '<span class="ob-src-key">key</span>' : ""}</span>
        <span class="ob-src-count">${src.imageCount ? formatCount(src.imageCount) : "\u2014"}</span>
      </div>`
      ).join("");
    }
    function animateCount(el2, target) {
      const dur = 1200;
      const start = performance.now();
      const fmt = (n) => {
        if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B+";
        if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M+";
        return n.toLocaleString();
      };
      (function tick(now) {
        const t = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        el2.textContent = fmt(Math.floor(target * ease));
        if (t < 1) requestAnimationFrame(tick);
      })(start);
    }
    function show(prefillTerm = null, runGuidedSearch = false) {
      el.style.display = "flex";
      el.classList.remove("hidden");
      step = 0;
      goTo(0);
      populateStats();
      if (prefillTerm) {
        const input = document.getElementById("search-input");
        if (input) input.value = prefillTerm;
      }
      STATE.pendingOnboardingSearch = !!runGuidedSearch;
      requestAnimationFrame(() => el.classList.add("visible"));
    }
    function close() {
      el.classList.remove("visible");
      setTimeout(() => {
        el.style.display = "none";
        el.classList.add("hidden");
      }, 400);
      localStorage.setItem("inspo_onboarding_seen", "1");
      const input = document.getElementById("search-input");
      const q = (input?.value || "").trim();
      if (STATE.pendingOnboardingSearch && q && (q.toLowerCase() !== (STATE.query || "").toLowerCase() || !STATE.results.length)) {
        runSearch(q);
      }
      STATE.pendingOnboardingSearch = false;
      if (input) input.focus();
    }
    nextBtn.addEventListener("click", () => goTo(step + 1));
    prevBtn.addEventListener("click", () => goTo(step - 1));
    skipBtn.addEventListener("click", close);
    startBtn.addEventListener("click", close);
    helpBtn.addEventListener("click", () => show());
    el.addEventListener("click", (e) => {
      if (e.target === el) close();
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        goTo(step + 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(step - 1);
      }
      if (e.key === "Escape") close();
    });
    (function installOnboardingSwipe() {
      let sx = 0, sy = 0;
      const inner = document.querySelector(".ob-inner") || el;
      inner.addEventListener("touchstart", (e) => {
        sx = e.touches[0].clientX;
        sy = e.touches[0].clientY;
      }, { passive: true });
      inner.addEventListener("touchend", (e) => {
        const dx = e.changedTouches[0].clientX - sx;
        const dy = e.changedTouches[0].clientY - sy;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          dx < 0 ? goTo(step + 1) : goTo(step - 1);
        }
      }, { passive: true });
    })();
    window._showOnboarding = show;
    window._refreshOnboardingStats = populateStats;
  })();
  function updateInfoBar() {
    const sibEl = document.getElementById("sib-text");
    if (!sibEl) return;
    const s = getSourceStats();
    sibEl.textContent = `${s.totalFetchSources.toLocaleString()} sources \xB7 ${formatCount(s.totalImagesNoKey)} images available`;
  }
  updateInfoBar();
  function updateApiStatus() {
    const badge = document.getElementById("sib-api-badge");
    const countEl = document.getElementById("sib-api-count");
    const listEl = document.getElementById("sib-dd-list");
    if (!badge || !listEl) return;
    const keyed = KEY_SOURCES.filter((s) => !s.alwaysOn && !s.aiProvider && s.getKeyUrl);
    const missing = keyed.filter((s) => !STATE[s.stateKey]);
    const connected = keyed.filter((s) => !!STATE[s.stateKey]);
    const allDone = missing.length === 0;
    badge.classList.toggle("all-connected", allDone);
    countEl.textContent = allDone ? "\u2713" : `${missing.length}`;
    listEl.innerHTML = "";
    missing.forEach((src) => {
      const row = document.createElement("div");
      row.className = "sib-dd-row";
      row.innerHTML = `<span class="sib-dd-name">${src.name}</span><span class="sib-dd-status missing">not set</span><a class="sib-dd-link" href="${src.getKeyUrl}" target="_blank" rel="noopener noreferrer">get key \u2197</a>`;
      listEl.appendChild(row);
    });
    connected.forEach((src) => {
      const row = document.createElement("div");
      row.className = "sib-dd-row connected";
      row.innerHTML = `<span class="sib-dd-name">${src.name}</span><span class="sib-dd-status active">\u2713 active</span><a class="sib-dd-link" href="${src.getKeyUrl}" target="_blank" rel="noopener noreferrer">manage \u2197</a>`;
      listEl.appendChild(row);
    });
    if (allDone && listEl.children.length) {
      const note = document.createElement("div");
      note.style.cssText = "padding:8px 12px;font-size:9px;color:#4a9;letter-spacing:0.04em;";
      note.textContent = "all database keys connected \u2014 full access unlocked";
      listEl.prepend(note);
    }
  }
  (function initApiDropdown() {
    const badge = document.getElementById("sib-api-badge");
    const dd = document.getElementById("sib-api-dropdown");
    if (!badge || !dd) return;
    badge.addEventListener("click", (e) => {
      e.stopPropagation();
      dd.classList.toggle("hidden");
    });
    document.addEventListener("click", (e) => {
      if (!dd.contains(e.target) && e.target !== badge) dd.classList.add("hidden");
    });
  })();
  updateApiStatus();
  var keyRowRefs = {};
  function updateKeysDot() {
    const anySet = KEY_SOURCES.filter((s) => !s.alwaysOn).some((s) => STATE[s.stateKey]);
    document.getElementById("keys-dot").style.display = anySet ? "inline-block" : "none";
    if (typeof updateApiStatus === "function") updateApiStatus();
  }
  function setAIProvider(p) {
    STATE.aiProvider = p;
    localStorage.setItem("inspo_ai_provider", p);
    document.querySelectorAll(".ai-provider-pill").forEach((pill) => {
      pill.classList.toggle("active", pill.dataset.provider === p);
    });
    const badge = document.getElementById("chat-provider-badge");
    if (badge) badge.textContent = p;
  }
  function buildKeyRows() {
    const container = document.getElementById("keys-rows-container");
    container.innerHTML = "";
    const aiSources = KEY_SOURCES.filter((s) => s.aiProvider);
    const dbSources = KEY_SOURCES.filter((s) => !s.aiProvider);
    const aiLabel = document.createElement("div");
    aiLabel.className = "section-label";
    aiLabel.style.marginBottom = "4px";
    aiLabel.textContent = "ai vision provider";
    container.appendChild(aiLabel);
    const aiHint = document.createElement("div");
    aiHint.className = "keys-panel-subheader";
    aiHint.style.cssText = "margin:-2px 0 8px;font-size:9px;";
    aiHint.textContent = "for optimal results use vision-enabled models (gemini, gpt-4o, llava, claude sonnet)";
    container.appendChild(aiHint);
    const pills = document.createElement("div");
    pills.style.cssText = "display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;";
    ["gemini", "claude", "openai", "ollama"].forEach((p) => {
      const pill = document.createElement("button");
      pill.className = "btn ai-provider-pill" + (STATE.aiProvider === p ? " active" : "");
      pill.dataset.provider = p;
      pill.textContent = p;
      pill.addEventListener("click", () => setAIProvider(p));
      pills.appendChild(pill);
    });
    container.appendChild(pills);
    aiSources.forEach((src) => buildSourceRow(container, src));
    const dbDivider = document.createElement("div");
    dbDivider.className = "divider";
    dbDivider.style.margin = "14px 0 8px";
    container.appendChild(dbDivider);
    const dbLabel = document.createElement("div");
    dbLabel.className = "section-label";
    dbLabel.style.marginBottom = "6px";
    dbLabel.textContent = "databases";
    container.appendChild(dbLabel);
    dbSources.forEach((src) => buildSourceRow(container, src));
    applySourceFilter();
  }
  hooks.buildKeyRows = buildKeyRows;
  function buildSourceRow(container, src) {
    const row = document.createElement("div");
    row.className = "key-source-row";
    row.dataset.sourceId = src.id;
    const top = document.createElement("div");
    top.className = "key-source-top";
    const name = document.createElement("span");
    name.className = "key-source-name";
    name.textContent = "";
    name.appendChild(createSourceIdentity(src.toggleId || src.id, src.name));
    const isActive = src.alwaysOn || Boolean(src.stateKey && STATE[src.stateKey]);
    const badge = document.createElement("span");
    const badgeActive = src.isOllama ? STATE.aiProvider === "ollama" : isActive;
    badge.className = "key-status-badge " + (badgeActive ? "badge-active" : "badge-inactive") + (src.cors ? " badge-cors" : "");
    if (src.isOllama) {
      badge.textContent = STATE.aiProvider === "ollama" ? "\u2713 " + (STATE.ollamaModel || "llava") : "click to configure";
    } else {
      badge.textContent = isActive ? src.cors ? "\u2713 active (cors)" : "\u2713 active" : "not set";
    }
    if (src.cors) badge.title = "May be blocked on some networks";
    const toggleId = src.toggleId || src.id;
    if (ALL_SOURCES.includes(toggleId)) {
      const isDisabled = STATE.disabledSources.has(toggleId);
      if (isDisabled) row.classList.add("source-disabled");
      const toggleBtn = document.createElement("button");
      toggleBtn.className = "source-toggle" + (isDisabled ? "" : " enabled");
      toggleBtn.textContent = isDisabled ? "\u25CB" : "\u25CF";
      toggleBtn.title = isDisabled ? "click to enable" : "click to disable";
      toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleSource(toggleId);
        buildKeyRows();
      });
      top.appendChild(toggleBtn);
    }
    top.appendChild(name);
    top.appendChild(badge);
    if (src.getKeyUrl) {
      const link = document.createElement("a");
      link.className = "key-get-link";
      link.textContent = src.isOllama ? "\u2197 download" : "\u2197 get key";
      link.href = src.getKeyUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.addEventListener("click", (e) => e.stopPropagation());
      top.appendChild(link);
    }
    const desc = document.createElement("div");
    desc.className = "key-source-desc";
    desc.textContent = src.desc;
    row.appendChild(top);
    row.appendChild(desc);
    let inputRow = null;
    let inputEl = null;
    if (!src.alwaysOn || src.optionalKey || src.isOllama) {
      inputRow = document.createElement("div");
      inputRow.className = "key-source-input-row";
      if (src.isOllama) {
        const epInput = document.createElement("input");
        epInput.type = "text";
        epInput.className = "key-source-input";
        epInput.placeholder = "endpoint \u2014 default: http://localhost:11434";
        epInput.autocomplete = "off";
        epInput.value = STATE.ollamaEndpoint !== "http://localhost:11434" ? STATE.ollamaEndpoint : "";
        epInput.style.marginBottom = "4px";
        const modelInput = document.createElement("input");
        modelInput.type = "text";
        modelInput.className = "key-source-input";
        modelInput.placeholder = "model name \u2014 default: llava (vision-enabled)";
        modelInput.autocomplete = "off";
        modelInput.value = STATE.ollamaModel !== "llava" ? STATE.ollamaModel : "";
        const saveOllama = () => {
          const ep = epInput.value.trim() || "http://localhost:11434";
          const model = modelInput.value.trim() || "llava";
          STATE.ollamaEndpoint = ep;
          STATE.ollamaModel = model;
          localStorage.setItem("inspo_ollama_endpoint", ep);
          localStorage.setItem("inspo_ollama_model", model);
          setAIProvider("ollama");
          badge.className = "key-status-badge badge-active";
          badge.textContent = "\u2713 " + model;
        };
        epInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.stopPropagation();
            saveOllama();
          }
        });
        modelInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.stopPropagation();
            saveOllama();
          }
        });
        inputRow.appendChild(epInput);
        inputRow.appendChild(modelInput);
        inputEl = epInput;
        row.addEventListener("click", () => {
          inputRow.classList.toggle("visible");
          if (inputRow.classList.contains("visible")) epInput.focus();
        });
      } else if (src.artsyDual) {
        const idInput = document.createElement("input");
        idInput.type = "password";
        idInput.className = "key-source-input";
        idInput.placeholder = "client_id \u2014 press enter";
        idInput.autocomplete = "off";
        idInput.style.marginBottom = "4px";
        const secretInput = document.createElement("input");
        secretInput.type = "password";
        secretInput.className = "key-source-input";
        secretInput.placeholder = "client_secret \u2014 press enter";
        secretInput.autocomplete = "off";
        const saveArtsy = () => {
          const id = idInput.value.trim();
          const sec = secretInput.value.trim();
          if (!id || !sec) return;
          STATE.artsyId = id;
          STATE.artsySecret = sec;
          STATE.artsyToken = null;
          localStorage.setItem("inspo_artsy_id", id);
          localStorage.setItem("inspo_artsy_secret", sec);
          idInput.value = "";
          secretInput.value = "";
          inputRow.classList.remove("visible");
          badge.className = "key-status-badge badge-active";
          badge.textContent = "\u2713 active";
          updateKeysDot();
        };
        idInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.stopPropagation();
            saveArtsy();
          }
        });
        secretInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.stopPropagation();
            saveArtsy();
          }
        });
        badge.addEventListener("click", (e) => {
          e.stopPropagation();
          if (!STATE.artsyId) return;
          if (!confirm("clear Artsy credentials?")) return;
          STATE.artsyId = null;
          STATE.artsySecret = null;
          STATE.artsyToken = null;
          localStorage.removeItem("inspo_artsy_id");
          localStorage.removeItem("inspo_artsy_secret");
          badge.className = "key-status-badge badge-inactive";
          badge.textContent = "not set";
          inputRow.classList.remove("visible");
          updateKeysDot();
        });
        row.addEventListener("click", () => {
          inputRow.classList.toggle("visible");
          if (inputRow.classList.contains("visible")) idInput.focus();
        });
        inputRow.appendChild(idInput);
        inputRow.appendChild(secretInput);
        inputEl = idInput;
      } else {
        inputEl = document.createElement("input");
        inputEl.type = "password";
        inputEl.className = "key-source-input";
        inputEl.placeholder = src.placeholder || "paste key and press enter";
        inputEl.autocomplete = "off";
        inputRow.appendChild(inputEl);
        if (src.hasEndpoint) {
          const epInput = document.createElement("input");
          epInput.type = "text";
          epInput.className = "key-source-input";
          epInput.placeholder = "endpoint url (optional \u2014 for self-hosted / Ollama)";
          epInput.autocomplete = "off";
          epInput.style.marginTop = "4px";
          if (STATE.openaiEndpoint) epInput.value = STATE.openaiEndpoint;
          epInput.addEventListener("keydown", (e) => {
            if (e.key !== "Enter") return;
            const val = epInput.value.trim();
            STATE.openaiEndpoint = val;
            localStorage.setItem("inspo_openai_endpoint", val);
            e.stopPropagation();
          });
          inputRow.appendChild(epInput);
        }
        inputEl.addEventListener("keydown", (e) => {
          if (e.key !== "Enter") return;
          const val = inputEl.value.trim();
          if (!val) return;
          STATE[src.stateKey] = val;
          localStorage.setItem(src.storageKey, val);
          inputEl.value = "";
          inputRow.classList.remove("visible");
          badge.className = "key-status-badge badge-active";
          badge.textContent = "\u2713 active";
          updateKeysDot();
          if (src.stateKey === "geminiKey") {
            document.getElementById("no-key-note").textContent = "";
            updateGeminiCounterUI();
          }
          if (src.aiProvider) setAIProvider(src.id);
          e.stopPropagation();
        });
        badge.addEventListener("click", (e) => {
          e.stopPropagation();
          if (!STATE[src.stateKey]) return;
          if (!confirm(`clear ${src.name} key?`)) return;
          STATE[src.stateKey] = null;
          localStorage.removeItem(src.storageKey);
          badge.className = "key-status-badge badge-inactive";
          badge.textContent = "not set";
          inputRow.classList.remove("visible");
          updateKeysDot();
          if (src.stateKey === "geminiKey") {
            document.getElementById("panel-ai-tags").style.display = "none";
            document.getElementById("no-key-note").textContent = "no key \u2014 add gemini key for vision";
          }
          if (src.aiProvider && STATE.aiProvider === src.id) {
            setAIProvider("gemini");
          }
        });
        row.addEventListener("click", () => {
          if (src.alwaysOn && !src.optionalKey) return;
          inputRow.classList.toggle("visible");
          if (inputRow.classList.contains("visible")) inputEl.focus();
        });
      }
      row.appendChild(inputRow);
    }
    keyRowRefs[src.id] = { badge, inputRow, inputEl };
    container.appendChild(row);
  }
  buildKeyRows();
  updateKeysDot();
  updatePresetButtons();
  if (!localStorage.getItem("inspo_onboarding_seen")) {
    const firstTerm = pickOnboardingTerm();
    const input = document.getElementById("search-input");
    if (input) input.value = firstTerm;
    runSearch(firstTerm).catch(() => {
    });
    window._showOnboarding(firstTerm, true);
  }
  document.getElementById("source-presets")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".preset-btn");
    if (btn) applyPreset(btn.dataset.preset);
  });
  var viewFiltersEl = document.getElementById("source-view-filters");
  if (viewFiltersEl) {
    viewFiltersEl.addEventListener("click", (e) => {
      const pill = e.target.closest(".filter-pill");
      if (!pill) return;
      setSourceViewFilter(pill.dataset.filter, pill.dataset.value);
    });
  }
  (function() {
    const geminiRow = document.querySelector('[data-source-id="gemini"]');
    if (geminiRow) {
      const counter = document.createElement("div");
      counter.id = "gemini-usage-counter";
      counter.style.cssText = "font-family:var(--font-ui);font-size:9px;letter-spacing:0.06em;color:var(--ink-3);margin-top:4px;padding:0 0 4px 0;";
      geminiRow.appendChild(counter);
      updateGeminiCounterUI();
    }
  })();
  document.getElementById("btn-export-keys")?.addEventListener("click", () => {
    const KEY_LIST = [
      "inspo_gemini_key",
      "inspo_claude_key",
      "inspo_openai_key",
      "inspo_openai_endpoint",
      "inspo_ollama_endpoint",
      "inspo_ollama_model",
      "inspo_ai_provider",
      "inspo_rijks_key",
      "inspo_europeana_key",
      "inspo_harvard_key",
      "inspo_smithsonian_key",
      "inspo_pexels_key",
      "inspo_pixabay_key",
      "inspo_trove_key",
      "inspo_digitalnz_key",
      "inspo_dpla_key",
      "inspo_ddb_key",
      "inspo_artsy_id",
      "inspo_artsy_secret",
      "inspo_unsplash_key"
    ];
    const keys = {};
    KEY_LIST.forEach((k) => {
      const v = localStorage.getItem(k);
      if (v) keys[k] = v;
    });
    const blob = new Blob([JSON.stringify(keys, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "insposearch-keys.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById("btn-import-keys")?.addEventListener("click", () => {
    document.getElementById("keys-import-input")?.click();
  });
  document.getElementById("keys-import-input")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (typeof data !== "object" || Array.isArray(data)) return;
        Object.entries(data).forEach(([k, v]) => {
          if (typeof k === "string" && k.startsWith("inspo_") && typeof v === "string") {
            localStorage.setItem(k, v);
          }
        });
        STATE.geminiKey = localStorage.getItem("inspo_gemini_key") || null;
        STATE.claudeKey = localStorage.getItem("inspo_claude_key") || null;
        STATE.openaiKey = localStorage.getItem("inspo_openai_key") || null;
        STATE.openaiEndpoint = localStorage.getItem("inspo_openai_endpoint") || "";
        STATE.ollamaEndpoint = localStorage.getItem("inspo_ollama_endpoint") || "http://localhost:11434";
        STATE.ollamaModel = localStorage.getItem("inspo_ollama_model") || "llava";
        STATE.aiProvider = localStorage.getItem("inspo_ai_provider") || "gemini";
        STATE.europeanaKey = localStorage.getItem("inspo_europeana_key") || null;
        STATE.harvardKey = localStorage.getItem("inspo_harvard_key") || null;
        STATE.smithsonianKey = localStorage.getItem("inspo_smithsonian_key") || null;
        STATE.pexelsKey = localStorage.getItem("inspo_pexels_key") || null;
        STATE.pixabayKey = localStorage.getItem("inspo_pixabay_key") || null;
        STATE.flickrKey = localStorage.getItem("inspo_flickr_key") || null;
        STATE.troveKey = localStorage.getItem("inspo_trove_key") || null;
        STATE.digitalnzKey = localStorage.getItem("inspo_digitalnz_key") || null;
        STATE.ddbKey = localStorage.getItem("inspo_ddb_key") || null;
        buildKeyRows();
        updateKeysDot();
      } catch (err) {
        console.warn("insposearch: failed to import keys:", err.message);
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  });
  document.getElementById("btn-keys")?.addEventListener("click", () => {
    document.getElementById("keys-panel")?.classList.toggle("open");
    document.getElementById("settings-panel")?.classList.remove("open");
  });
  document.getElementById("keys-panel-close")?.addEventListener("click", () => {
    document.getElementById("keys-panel")?.classList.remove("open");
  });
  document.getElementById("no-key-note").textContent = STATE.geminiKey || STATE.claudeKey || STATE.openaiKey ? "" : "no key \u2014 add an ai key for vision";
  console.log("[insposearch] Phase 7 \u2014 Keys Panel ready.");
  async function urlToBase64(url) {
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = Math.min(img.naturalWidth, 200);
            canvas.height = Math.round(
              img.naturalHeight * (canvas.width / img.naturalWidth)
            );
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
            resolve(dataUrl.split(",")[1]);
          } catch (canvasErr) {
            reject(canvasErr);
          }
        };
        img.onerror = reject;
        img.src = url;
      });
    }
  }
  async function analyzeWithGemini(item) {
    const hasKey = STATE.geminiKey || STATE.claudeKey || STATE.openaiKey;
    if (!hasKey) {
      console.warn("[ai] no key");
      return [];
    }
    if (item.aiTags && item.aiTags.length > 0) return item.aiTags;
    const cached = getAITagsCache(item.id);
    if (cached) {
      item.aiTags = cached;
      return cached;
    }
    if ((STATE.aiProvider || "gemini") === "gemini" && STATE.geminiDailyCount >= 1500) {
      renderAiSection(null, "daily limit reached \u2014 resets at midnight");
      return [];
    }
    if ((STATE.aiProvider || "gemini") === "gemini" && isGeminiRateLimited()) {
      renderAiSection(null, "rate limited \u2014 too many requests, wait a moment");
      return [];
    }
    const elapsed = Date.now() - (STATE.lastGeminiCall || 0);
    if (elapsed < 2e3) await sleep(2e3 - elapsed);
    STATE.lastGeminiCall = Date.now();
    try {
      const b64 = await urlToBase64(item.thumb);
      const mimeType = item.thumb.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
      const prompt = "List 8 visual and conceptual tags for this image. Focus on: mood, texture, color palette name, era, style, emotion, material, and composition. Return only a JSON array of strings. No other text.";
      const text = await callAI(prompt, b64, mimeType);
      try {
        const clean = text.replace(/```json|```/g, "").trim();
        const fixed = clean.endsWith("]") ? clean : clean.replace(/,?\s*"[^"]*$/, "") + "]";
        const tags = JSON.parse(fixed);
        const result = Array.isArray(tags) ? tags.filter((t) => typeof t === "string") : [];
        if (result.length) {
          setAITagsCache(item.id, result);
          item.aiTags = result;
          if ((STATE.aiProvider || "gemini") === "gemini") incrementGeminiCounter();
        }
        return result;
      } catch (parseErr) {
        console.warn("[ai] parse failed:", parseErr.message, text);
        renderAiSection(null, "AI analysis failed \u2014 showing metadata tags");
        return [];
      }
    } catch (err) {
      console.error("[ai] caught error:", err.name, err.message, err);
      if (err.message?.includes("tainted") || err.message?.includes("cross-origin") || err.message?.includes("CORS")) {
        renderAiSection(null, "AI unavailable \u2014 image blocked by CORS. Try a Met image.");
      } else if (err.message?.includes("no ai key")) {
        renderAiSection(null, "no key \u2014 add an AI key in api keys panel");
      } else {
        renderAiSection(null, `AI error: ${err.message || "unavailable"}`);
      }
      return [];
    }
  }
  function renderAiSection(tags, errorMsg) {
    const section = document.getElementById("panel-ai-tags");
    const container = document.getElementById("ai-tags-container");
    container.innerHTML = "";
    if (errorMsg) {
      section.style.display = "block";
      const errSpan = document.createElement("span");
      errSpan.style.cssText = "font-family:var(--font-ui);font-size:10px;color:var(--ink-3);";
      errSpan.textContent = errorMsg;
      container.appendChild(errSpan);
      return;
    }
    if (!tags || !tags.length) {
      section.style.display = "none";
      return;
    }
    section.style.display = "block";
    tags.forEach((tag) => {
      const pill = document.createElement("button");
      pill.className = "tag ai";
      pill.textContent = tag;
      pill.addEventListener("click", () => {
        document.getElementById("search-input").value = tag;
        runSearch(tag);
      });
      container.appendChild(pill);
    });
  }
  async function runGeminiOnSelected() {
    const hasKey = STATE.geminiKey || STATE.claudeKey || STATE.openaiKey;
    if (!hasKey || !STATE.selected.length) return;
    const item = STATE.selected[STATE.selected.length - 1];
    if (item.aiTags && item.aiTags.length) {
      document.getElementById("analyse-section").style.display = "none";
      renderAiSection(item.aiTags);
      return;
    }
    const analyseSection = document.getElementById("analyse-section");
    const analyseBtn = document.getElementById("analyse-btn");
    const analyseLabel = document.getElementById("analyse-btn-label");
    if (analyseBtn) {
      analyseBtn.disabled = true;
    }
    if (analyseLabel) {
      analyseLabel.textContent = "analysing\u2026";
    }
    const tags = await analyzeWithGemini(item);
    item.aiTags = tags;
    if (analyseSection) analyseSection.style.display = "none";
    if (tags.length) {
      renderAiSection(tags);
    } else {
      if (analyseBtn) analyseBtn.disabled = false;
      if (analyseLabel) analyseLabel.textContent = "retry analysis";
      if (analyseSection) analyseSection.style.display = "";
    }
  }
  function updateAnalyseButton(item) {
    const section = document.getElementById("analyse-section");
    const btn = document.getElementById("analyse-btn");
    const label = document.getElementById("analyse-btn-label");
    if (!section || !btn || !item) return;
    btn.disabled = false;
    if (label) label.textContent = "analyse with ai";
    const cached = getAITagsCache(item.id);
    if (cached && cached.length) {
      section.style.display = "none";
      renderAiSection(cached);
      return;
    }
    if (item.aiTags && item.aiTags.length) {
      section.style.display = "none";
      renderAiSection(item.aiTags);
      return;
    }
    document.getElementById("panel-ai-tags").style.display = "none";
    section.style.display = "";
    const hasAiKey = STATE.geminiKey || STATE.claudeKey || STATE.openaiKey;
    if (!hasAiKey) {
      btn.disabled = true;
      btn.title = "add an ai key to unlock";
    } else {
      btn.title = "";
    }
  }
  document.getElementById("panel-colors").style.display = "none";
  document.getElementById("panel-tags").style.display = "none";
  document.getElementById("panel-related").style.display = "none";
  document.getElementById("panel-ai-tags").style.display = "none";
  document.querySelectorAll(".btn").forEach((b) => {
    b.addEventListener("focus", () => b.style.outline = "none");
  });
  document.getElementById("canvas")?.addEventListener("transitionend", (e) => {
    if (e.propertyName === "opacity" && e.target.style.opacity === "0") {
    }
  });
  window.addEventListener("resize", () => {
    if (STATE.view === "3d" && threeRenderer && threeCamera) {
      const c = document.getElementById("three-canvas");
      const nw = c.offsetWidth;
      const nh = c.offsetHeight;
      threeCamera.aspect = nw / nh;
      threeCamera.updateProjectionMatrix();
      threeRenderer.setSize(nw, nh);
    }
  });
  function syncThreeBg() {
    if (threeScene) threeScene.background = new THREE.Color(getThreeBg());
  }
  document.getElementById("theme-toggle")?.addEventListener("click", syncThreeBg);
  document.getElementById("search-input").focus();
  console.log("[insposearch] Phase 8 \u2014 Gemini Integration ready.");
  (function initChatPanel() {
    const CHAT_STARTERS = (q) => [
      `what visual connections exist in these results?`,
      `suggest 5 unexpected directions for "${q || "this search"}"`,
      `what art movements or historical periods are represented?`,
      `find something surprising \u2014 what am I missing?`,
      `I'm building a moodboard \u2014 what should I add to deepen it?`
    ];
    function getChatSystemPrompt(meta) {
      const sources = (meta.activeSources || []).join(", ") || "multiple sources";
      const sel = (meta.selectedImages || []).map((s) => `"${s.title}" (${s.source})`).join(", ");
      return `You are a visual research assistant inside InspoSearch, a multi-source creative research tool. The user is searching for "${meta.searchTerm || "unknown"}". The grid shows ${meta.imageCount || 0} images from ${meta.sourceCount || 0} sources (${sources}). ` + (sel ? `Selected: ${sel}. ` : "") + `Be a concise creative research partner \u2014 not a chatbot. When suggesting searches, wrap each term in double square brackets: [[term here]]. Keep responses to 2-4 sentences, then list search suggestions as [[pills]].`;
    }
    function renderChatEmpty() {
      const el = document.getElementById("chat-messages");
      el.innerHTML = "";
      const q = STATE.query || "";
      const wrap = document.createElement("div");
      wrap.className = "chat-empty";
      const label = document.createElement("div");
      label.className = "chat-empty-label";
      label.textContent = "ask anything about your search";
      wrap.appendChild(label);
      CHAT_STARTERS(q).forEach((s) => {
        const btn = document.createElement("button");
        btn.className = "chat-starter";
        btn.textContent = s;
        btn.addEventListener("click", () => sendChatMessage(s));
        wrap.appendChild(btn);
      });
      el.appendChild(wrap);
    }
    function appendChatMessage(role, content) {
      const messagesEl = document.getElementById("chat-messages");
      messagesEl.querySelector(".chat-empty")?.remove();
      const msg = document.createElement("div");
      msg.className = `chat-msg ${role}`;
      const label = document.createElement("div");
      label.className = "chat-msg-label";
      label.textContent = role === "user" ? "you" : STATE.aiProvider || "gemini";
      msg.appendChild(label);
      if (role === "assistant") {
        const pills = [];
        const re = /\[\[([^\]]+)\]\]/g;
        let m;
        while ((m = re.exec(content)) !== null) pills.push(m[1]);
        const cleanText = content.replace(/\[\[([^\]]+)\]\]/g, "").trim();
        const body = document.createElement("div");
        body.textContent = cleanText;
        msg.appendChild(body);
        if (pills.length) {
          const pillRow = document.createElement("div");
          pillRow.className = "chat-pills";
          pills.forEach((p) => {
            const btn = document.createElement("button");
            btn.className = "chat-pill";
            btn.textContent = p;
            btn.addEventListener("click", () => {
              document.getElementById("search-input").value = p;
              runSearch(p);
            });
            pillRow.appendChild(btn);
          });
          msg.appendChild(pillRow);
        }
      } else {
        const body = document.createElement("div");
        body.textContent = content;
        msg.appendChild(body);
      }
      messagesEl.appendChild(msg);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
    async function sendChatMessage(text) {
      if (!text?.trim()) return;
      document.getElementById("chat-input").value = "";
      appendChatMessage("user", text);
      STATE.chatHistory.push({ role: "user", content: text });
      if (STATE.chatHistory.length > CONSTANTS.MAX_CHAT_HISTORY) {
        STATE.chatHistory = [STATE.chatHistory[0], ...STATE.chatHistory.slice(-(CONSTANTS.MAX_CHAT_HISTORY - 1))];
      }
      const thinkingEl = document.createElement("div");
      thinkingEl.className = "chat-thinking";
      thinkingEl.textContent = "\u2026";
      const messagesEl = document.getElementById("chat-messages");
      messagesEl.appendChild(thinkingEl);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      try {
        const snap = STATE.chatSnapshot;
        const meta = snap?.metadata || { searchTerm: STATE.query, imageCount: STATE.results.length, sourceCount: 0, activeSources: [], selectedImages: [] };
        const sysPrompt = getChatSystemPrompt(meta);
        const isFirst = STATE.chatHistory.length === 1;
        const base64 = isFirst && snap?.base64 ? snap.base64 : null;
        const reply = await callAIChat(STATE.chatHistory, sysPrompt, base64, "image/jpeg");
        thinkingEl.remove();
        STATE.chatHistory.push({ role: "assistant", content: reply });
        appendChatMessage("assistant", reply);
        if ((STATE.aiProvider || "gemini") === "gemini") incrementGeminiCounter();
      } catch (e) {
        thinkingEl.remove();
        appendChatMessage("assistant", `Could not reach AI: ${e.message}`);
      }
    }
    async function refreshChatSnapshot() {
      const btn = document.getElementById("btn-chat-snapshot");
      if (btn) {
        btn.textContent = "\u21BA \u2026";
        btn.disabled = true;
      }
      STATE.chatSnapshot = await captureGridSnapshot();
      if (btn) {
        btn.textContent = "\u21BA context";
        btn.disabled = false;
      }
    }
    async function openChat() {
      document.getElementById("ai-chat-panel").classList.add("open");
      document.getElementById("btn-ai-chat").classList.add("active");
      if (_fabricCanvas) setTimeout(positionFabricOverlay, 380);
      document.getElementById("chat-provider-badge").textContent = STATE.aiProvider || "gemini";
      if (!STATE.chatHistory._query || STATE.chatHistory._query !== STATE.query) {
        STATE.chatHistory = [];
        STATE.chatHistory._query = STATE.query;
        STATE.chatSnapshot = null;
      }
      if (!STATE.chatSnapshot && STATE.results.length) {
        await refreshChatSnapshot();
      }
      if (!STATE.chatHistory.length) renderChatEmpty();
    }
    function closeChat() {
      document.getElementById("ai-chat-panel").classList.remove("open");
      document.getElementById("btn-ai-chat").classList.remove("active");
      if (_fabricCanvas) setTimeout(positionFabricOverlay, 380);
    }
    document.getElementById("btn-ai-chat")?.addEventListener("click", () => {
      document.getElementById("ai-chat-panel").classList.contains("open") ? closeChat() : openChat();
    });
    document.getElementById("ai-chat-close")?.addEventListener("click", closeChat);
    document.getElementById("btn-chat-snapshot")?.addEventListener("click", refreshChatSnapshot);
    document.getElementById("btn-chat-send")?.addEventListener("click", () => {
      sendChatMessage(document.getElementById("chat-input").value.trim());
    });
    document.getElementById("chat-input")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage(e.target.value.trim());
      }
    });
  })();
  console.log("[insposearch] Phase 3B \u2014 AI Chat Panel ready.");
  console.log("[insposearch] Phase 9 \u2014 Polish complete. insposearch is ready.");
  STATE.showBadges = true;
  STATE.keywordExpansion = true;
  STATE.autoSearch = false;
  STATE.rememberLast = false;
  STATE.autoAnalyse = false;
  STATE.searchMode = "explore";
  function applyBadgeVisibility() {
    document.getElementById("canvas").classList.toggle("no-badges", !STATE.showBadges);
  }
  function updateSettingsCacheStatus() {
    const el = document.getElementById("settings-cache-status");
    if (!el) return;
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) count++;
    }
    el.textContent = count === 0 ? "cache is empty" : `${count} search${count !== 1 ? "es" : ""} cached`;
  }
  function updateSettingsPanelUI() {
    const storedTheme = localStorage.getItem("inspo_theme");
    document.getElementById("settings-theme-dark").classList.toggle("active", storedTheme === "dark");
    document.getElementById("settings-theme-light").classList.toggle("active", storedTheme === "light");
    document.getElementById("settings-theme-system").classList.toggle("active", storedTheme === "system" || !storedTheme);
    document.getElementById("settings-sketch-on").classList.toggle("active", STATE.sketchMode);
    document.getElementById("settings-sketch-off").classList.toggle("active", !STATE.sketchMode);
    document.getElementById("settings-badges-on").classList.toggle("active", STATE.showBadges);
    document.getElementById("settings-badges-off").classList.toggle("active", !STATE.showBadges);
    document.getElementById("settings-kwexp-on").classList.toggle("active", STATE.keywordExpansion);
    document.getElementById("settings-kwexp-off").classList.toggle("active", !STATE.keywordExpansion);
    document.getElementById("settings-autosearch-on").classList.toggle("active", STATE.autoSearch);
    document.getElementById("settings-autosearch-off").classList.toggle("active", !STATE.autoSearch);
    document.getElementById("settings-remember-on").classList.toggle("active", STATE.rememberLast);
    document.getElementById("settings-remember-off").classList.toggle("active", !STATE.rememberLast);
    document.getElementById("settings-autoanalyse-on").classList.toggle("active", STATE.autoAnalyse);
    document.getElementById("settings-autoanalyse-off").classList.toggle("active", !STATE.autoAnalyse);
    const count = STATE.geminiDailyCount;
    const usageEl = document.getElementById("settings-gemini-usage");
    if (usageEl) {
      if (count >= 1500) {
        usageEl.textContent = "daily limit reached \u2014 resets midnight";
        usageEl.style.color = "#E24B4A";
      } else if (count >= 1400) {
        usageEl.textContent = `\u2726 ${count} used \u2014 approaching limit`;
        usageEl.style.color = "var(--accent)";
      } else {
        usageEl.textContent = `\u2726 ${count} used today / 1500 free`;
        usageEl.style.color = "var(--ink-3)";
      }
    }
    updateSettingsCacheStatus();
  }
  function loadSettings() {
    const showBadges = localStorage.getItem("inspo_show_badges");
    STATE.showBadges = showBadges === null ? true : showBadges !== "false";
    const kwExp = localStorage.getItem("inspo_keyword_expansion");
    STATE.keywordExpansion = kwExp === null ? true : kwExp !== "false";
    STATE.autoSearch = localStorage.getItem("inspo_auto_search") === "true";
    STATE.rememberLast = localStorage.getItem("inspo_remember_last") === "true";
    STATE.autoAnalyse = localStorage.getItem("inspo_auto_analyse") === "true";
    STATE.searchMode = localStorage.getItem("inspo_search_mode") === "exact" ? "exact" : "explore";
    applyBadgeVisibility();
    setSearchMode(STATE.searchMode, false);
    if (STATE.rememberLast) {
      const lastQuery = localStorage.getItem("inspo_last_query");
      if (lastQuery) document.getElementById("search-input").value = lastQuery;
    }
  }
  document.getElementById("btn-settings")?.addEventListener("click", () => {
    const panel = document.getElementById("settings-panel");
    const isOpen = panel.classList.toggle("open");
    if (isOpen) {
      document.getElementById("keys-panel")?.classList.remove("open");
      updateSettingsPanelUI();
    }
  });
  document.getElementById("settings-panel-close")?.addEventListener("click", () => {
    document.getElementById("settings-panel")?.classList.remove("open");
  });
  function applyThemePref(pref) {
    document.body.classList.remove("dark", "light");
    if (pref === "dark") {
      document.body.classList.add("dark");
      localStorage.setItem("inspo_theme", "dark");
    } else if (pref === "light") {
      document.body.classList.add("light");
      localStorage.setItem("inspo_theme", "light");
    } else {
      localStorage.setItem("inspo_theme", "system");
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.body.classList.add("dark");
      }
    }
    const isDark = document.body.classList.contains("dark");
    const tt = document.getElementById("theme-toggle");
    if (tt) tt.textContent = isDark ? "light" : "dark";
    if (typeof syncThreeBg === "function") syncThreeBg();
    updateSettingsPanelUI();
  }
  document.getElementById("settings-theme-dark")?.addEventListener("click", () => applyThemePref("dark"));
  document.getElementById("settings-theme-light")?.addEventListener("click", () => applyThemePref("light"));
  document.getElementById("settings-theme-system")?.addEventListener("click", () => applyThemePref("system"));
  document.getElementById("settings-sketch-on")?.addEventListener("click", () => {
    if (!STATE.sketchMode) {
      STATE.sketchMode = true;
      applySketchMode();
      const sb = document.getElementById("btn-bw");
      sb.textContent = "colour";
      sb.classList.add("active");
    }
    updateSettingsPanelUI();
  });
  document.getElementById("settings-sketch-off")?.addEventListener("click", () => {
    if (STATE.sketchMode) {
      STATE.sketchMode = false;
      removeSketchMode();
      const sb = document.getElementById("btn-bw");
      sb.textContent = "b&w";
      sb.classList.remove("active");
    }
    updateSettingsPanelUI();
  });
  document.getElementById("settings-badges-on")?.addEventListener("click", () => {
    STATE.showBadges = true;
    localStorage.setItem("inspo_show_badges", "true");
    applyBadgeVisibility();
    updateSettingsPanelUI();
  });
  document.getElementById("settings-badges-off")?.addEventListener("click", () => {
    STATE.showBadges = false;
    localStorage.setItem("inspo_show_badges", "false");
    applyBadgeVisibility();
    updateSettingsPanelUI();
  });
  document.getElementById("settings-kwexp-on")?.addEventListener("click", () => {
    STATE.keywordExpansion = true;
    localStorage.setItem("inspo_keyword_expansion", "true");
    updateSettingsPanelUI();
  });
  document.getElementById("settings-kwexp-off")?.addEventListener("click", () => {
    STATE.keywordExpansion = false;
    localStorage.setItem("inspo_keyword_expansion", "false");
    updateSettingsPanelUI();
  });
  document.getElementById("settings-autosearch-on")?.addEventListener("click", () => {
    STATE.autoSearch = true;
    localStorage.setItem("inspo_auto_search", "true");
    updateSettingsPanelUI();
  });
  document.getElementById("settings-autosearch-off")?.addEventListener("click", () => {
    STATE.autoSearch = false;
    localStorage.setItem("inspo_auto_search", "false");
    updateSettingsPanelUI();
  });
  document.getElementById("settings-remember-on")?.addEventListener("click", () => {
    STATE.rememberLast = true;
    localStorage.setItem("inspo_remember_last", "true");
    updateSettingsPanelUI();
  });
  document.getElementById("settings-remember-off")?.addEventListener("click", () => {
    STATE.rememberLast = false;
    localStorage.setItem("inspo_remember_last", "false");
    updateSettingsPanelUI();
  });
  document.getElementById("settings-autoanalyse-on")?.addEventListener("click", () => {
    STATE.autoAnalyse = true;
    localStorage.setItem("inspo_auto_analyse", "true");
    updateSettingsPanelUI();
  });
  document.getElementById("settings-autoanalyse-off")?.addEventListener("click", () => {
    STATE.autoAnalyse = false;
    localStorage.setItem("inspo_auto_analyse", "false");
    updateSettingsPanelUI();
  });
  document.getElementById("btn-clear-ai-cache")?.addEventListener("click", () => {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("inspo_aitags_")) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
    const btn = document.getElementById("btn-clear-ai-cache");
    const prev = btn.textContent;
    btn.textContent = `cleared (${toRemove.length})`;
    setTimeout(() => {
      btn.textContent = prev;
    }, 2e3);
  });
  document.getElementById("btn-clear-search-cache")?.addEventListener("click", () => {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
    updateSettingsCacheStatus();
  });
  document.getElementById("btn-clear-all-data")?.addEventListener("click", () => {
    if (!confirm("clear all settings, api keys, and cached data?\nthis cannot be undone.")) return;
    localStorage.clear();
    location.reload();
  });
  document.getElementById("btn-settings-export")?.addEventListener("click", () => {
    const data = { _version: "1.0", _exported: (/* @__PURE__ */ new Date()).toISOString() };
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("inspo_")) data[k] = localStorage.getItem(k);
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "insposearch-settings.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById("btn-settings-import")?.addEventListener("click", () => {
    document.getElementById("settings-import-input")?.click();
  });
  document.getElementById("settings-import-input")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (typeof data !== "object" || Array.isArray(data)) return;
        Object.entries(data).forEach(([k, v]) => {
          if (k.startsWith("inspo_") && typeof v === "string") localStorage.setItem(k, v);
        });
        loadSettings();
        STATE.geminiKey = localStorage.getItem("inspo_gemini_key") || null;
        STATE.claudeKey = localStorage.getItem("inspo_claude_key") || null;
        STATE.openaiKey = localStorage.getItem("inspo_openai_key") || null;
        STATE.openaiEndpoint = localStorage.getItem("inspo_openai_endpoint") || "";
        STATE.ollamaEndpoint = localStorage.getItem("inspo_ollama_endpoint") || "http://localhost:11434";
        STATE.ollamaModel = localStorage.getItem("inspo_ollama_model") || "llava";
        STATE.aiProvider = localStorage.getItem("inspo_ai_provider") || "gemini";
        STATE.europeanaKey = localStorage.getItem("inspo_europeana_key") || null;
        STATE.harvardKey = localStorage.getItem("inspo_harvard_key") || null;
        STATE.smithsonianKey = localStorage.getItem("inspo_smithsonian_key") || null;
        STATE.pexelsKey = localStorage.getItem("inspo_pexels_key") || null;
        STATE.pixabayKey = localStorage.getItem("inspo_pixabay_key") || null;
        STATE.flickrKey = localStorage.getItem("inspo_flickr_key") || null;
        STATE.troveKey = localStorage.getItem("inspo_trove_key") || null;
        STATE.digitalnzKey = localStorage.getItem("inspo_digitalnz_key") || null;
        STATE.ddbKey = localStorage.getItem("inspo_ddb_key") || null;
        buildKeyRows();
        updateKeysDot();
        const theme = localStorage.getItem("inspo_theme");
        document.body.classList.remove("dark", "light");
        if (theme === "dark") {
          document.body.classList.add("dark");
          document.getElementById("theme-toggle").textContent = "light";
        }
        if (theme === "light") {
          document.body.classList.add("light");
          document.getElementById("theme-toggle").textContent = "dark";
        }
        updateSettingsPanelUI();
      } catch (err) {
        console.warn("insposearch: failed to import settings:", err.message);
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  });
  document.getElementById("btn-settings-guide")?.addEventListener("click", () => {
    document.getElementById("settings-panel").classList.remove("open");
    if (typeof window._showOnboarding === "function") window._showOnboarding();
  });
  var debouncedAutoSearch = debounce((q) => {
    if (!STATE.autoSearch || !q.trim() || q.trim() === STATE.query) return;
    runSearch(q.trim());
  }, 800);
  document.getElementById("search-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && STATE.rememberLast) {
      const q = e.target.value.trim();
      if (q) localStorage.setItem("inspo_last_query", q);
    }
  });
  document.getElementById("btn-bw")?.addEventListener("click", () => {
    if (document.getElementById("settings-panel")?.classList.contains("open")) updateSettingsPanelUI();
  });
  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    if (document.getElementById("settings-panel")?.classList.contains("open")) updateSettingsPanelUI();
  });
  (function patchUpdatePanelForAutoAnalyse() {
    const _orig = updatePanel;
    updatePanel = async function(previewItem) {
      await _orig(previewItem);
      const hasKey = STATE.geminiKey || STATE.claudeKey || STATE.openaiKey;
      const displayItems = previewItem ? [previewItem] : STATE.selected;
      if (!STATE.autoAnalyse || !hasKey || !displayItems.length) return;
      const item = displayItems[displayItems.length - 1];
      if (item.aiTags && item.aiTags.length) return;
      const cached = getAITagsCache(item.id);
      if (cached) {
        item.aiTags = cached;
        renderAiSection(cached);
        document.getElementById("analyse-section").style.display = "none";
      } else {
        runGeminiOnSelected();
      }
    };
  })();
  loadSettings();
  STATE.manifestSources = [];
  async function loadSourceManifest() {
    try {
      const res = await fetch("./sources.manifest.json");
      if (!res.ok) return;
      const manifest = await res.json();
      const sources = manifest.sources || [];
      let added = 0;
      for (const cfg of sources) {
        if (!cfg.active) continue;
        if (KEY_SOURCES.find((s) => s.id === cfg.id)) continue;
        KEY_SOURCES.push({
          id: cfg.id,
          name: cfg.name,
          desc: cfg.description || "",
          imageCount: cfg.imageCount || 0,
          alwaysOn: !cfg.keyRequired,
          stateKey: cfg.keyRequired ? cfg.id + "Key" : null,
          storageKey: cfg.keyRequired ? "inspo_" + cfg.id + "_key" : null,
          getKeyUrl: cfg.getKeyUrl || null,
          cors: cfg.corsMode !== "direct" ? void 0 : void 0
        });
        if (!ALL_SOURCES.includes(cfg.id)) {
          ALL_SOURCES.push(cfg.id);
        }
        SOURCE_META[cfg.id] = {
          category: cfg.category || SOURCE_META[cfg.id]?.category || [],
          region: cfg.region || SOURCE_META[cfg.id]?.region || "global",
          access: cfg.keyRequired ? "free_key" : SOURCE_META[cfg.id]?.access || "no_key",
          corsBlocked: cfg.corsMode === "prefetched" || SOURCE_META[cfg.id]?.corsBlocked || false
        };
        if (["iiif_search", "simple_rest", "iiif_content_search", "iiif_collection"].includes(cfg.adapter) && cfg.endpoint) {
          STATE.manifestSources.push(cfg);
        }
        added++;
      }
      if (added > 0) {
        buildKeyRows();
        window._refreshOnboardingStats?.();
        console.log(`[insposearch] Manifest loaded \u2014 ${added} additional sources registered.`);
      }
    } catch (e) {
      console.debug("[insposearch] sources.manifest.json not loaded:", e.message);
    }
  }
  loadSourceManifest();
  async function discoverEuropeanaProviders() {
    if (!STATE.europeanaKey) return 0;
    try {
      const url = `https://api.europeana.eu/record/v2/search.json?wskey=${encodeURIComponent(STATE.europeanaKey)}&query=*&facet=DATA_PROVIDER&f.DATA_PROVIDER.facet.limit=10000&rows=0&profile=facets`;
      const res = await fetch(url);
      if (!res.ok) return 0;
      const data = await res.json();
      const facet = (data.facets || []).find((f) => f.name === "DATA_PROVIDER");
      if (!facet || !facet.fields) return 0;
      const existingIds = new Set(Object.keys(EUROPEANA_PROVIDERS));
      const existingDynamic = new Set(DYNAMIC_REGISTRY.map((s) => s.id));
      let added = 0;
      for (const field of facet.fields) {
        if (field.count < 50) continue;
        const id = "euro_" + field.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40);
        if (existingIds.has(id) || existingDynamic.has(id)) continue;
        DYNAMIC_REGISTRY.push({
          id,
          adapter: "europeana_provider",
          config: { filterParam: "DATA_PROVIDER", filterValue: field.label },
          name: field.label,
          tags: ["art", "archives"],
          keyRequired: "europeanaKey",
          imageCount: field.count
        });
        added++;
      }
      return added;
    } catch (e) {
      console.debug("[insposearch] Europeana discovery failed:", e.message);
      return 0;
    }
  }
  async function discoverDPLAProviders() {
    if (!STATE.dplaKey) return 0;
    try {
      const url = `https://api.dp.la/v2/items?api_key=${encodeURIComponent(STATE.dplaKey)}&facets=provider.name&page_size=0`;
      const res = await fetch(url);
      if (!res.ok) return 0;
      const data = await res.json();
      const terms = data.facets?.["provider.name"]?.terms || [];
      const existingIds = new Set(Object.keys(DPLA_HUBS));
      const existingDynamic = new Set(DYNAMIC_REGISTRY.map((s) => s.id));
      let added = 0;
      for (const term of terms) {
        if (term.count < 50) continue;
        const id = "dpla_" + term.term.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40);
        if (existingIds.has(id) || existingDynamic.has(id)) continue;
        DYNAMIC_REGISTRY.push({
          id,
          adapter: "dpla_hub",
          config: { provider: term.term },
          name: term.term,
          tags: ["archives", "history"],
          keyRequired: "dplaKey",
          imageCount: term.count
        });
        added++;
      }
      return added;
    } catch (e) {
      console.debug("[insposearch] DPLA discovery failed:", e.message);
      return 0;
    }
  }
  async function discoverDynamicSources() {
    const [euroCount, dplaCount] = await Promise.all([
      discoverEuropeanaProviders(),
      discoverDPLAProviders()
    ]);
    const total = DYNAMIC_REGISTRY.length;
    if (euroCount || dplaCount) {
      console.log(`[insposearch] Discovery complete \u2014 ${euroCount} Europeana + ${dplaCount} DPLA providers. Total dynamic: ${total}`);
    }
    updateSourcesActiveCounter();
    window._refreshOnboardingStats?.();
    updateInfoBar();
  }
  discoverDynamicSources();
  console.log("[insposearch] Phase 10 \u2014 Settings Module ready.");
  (function() {
    const mobileBtn = document.getElementById("mobile-menu-btn");
    const backdrop = document.getElementById("sidebar-backdrop");
    const sidebar = document.getElementById("sidebar");
    if (!mobileBtn || !backdrop || !sidebar) return;
    function openSidebar() {
      sidebar.classList.add("mobile-open");
      backdrop.classList.add("visible");
    }
    function closeSidebar() {
      sidebar.classList.remove("mobile-open");
      backdrop.classList.remove("visible");
    }
    mobileBtn.addEventListener("click", openSidebar);
    backdrop.addEventListener("click", closeSidebar);
    let swipeStartX = 0;
    sidebar.addEventListener("touchstart", (e) => {
      swipeStartX = e.touches[0].clientX;
    }, { passive: true });
    sidebar.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - swipeStartX;
      if (dx < -60 && sidebar.classList.contains("mobile-open")) closeSidebar();
    }, { passive: true });
    document.getElementById("search-input")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") closeSidebar();
    });
  })();
  function _extractYearFn(item) {
    if (item.year) {
      var n = parseInt(item.year, 10);
      if (n > 0 && n <= 2100) return n;
    }
    var text = (item.title || "") + " " + (item.description || "") + " " + (item.date || "");
    var m = text.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
    return m ? parseInt(m[1], 10) : null;
  }
  window._extractYear = _extractYearFn;
  (function initDateFilter() {
    var applyBtn = document.getElementById("date-filter-apply");
    var clearBtn = document.getElementById("date-filter-clear");
    var fromInput = document.getElementById("date-from");
    var toInput = document.getElementById("date-to");
    if (!applyBtn) return;
    function applyDateFilter() {
      var from = parseInt(fromInput.value, 10) || 0;
      var to = parseInt(toInput.value, 10) || 9999;
      if (from === 0 && to === 9999) return;
      STATE._dateFilter = { from, to };
      refilterResults();
    }
    applyBtn.addEventListener("click", applyDateFilter);
    fromInput.addEventListener("keydown", function(e) {
      if (e.key === "Enter") applyDateFilter();
    });
    toInput.addEventListener("keydown", function(e) {
      if (e.key === "Enter") applyDateFilter();
    });
    clearBtn.addEventListener("click", function() {
      fromInput.value = "";
      toInput.value = "";
      STATE._dateFilter = null;
      refilterResults();
    });
  })();
  function refilterResults() {
    if (!STATE.results.length) return;
    let items = [...STATE.results];
    if (STATE._dateFilter) {
      const { from, to } = STATE._dateFilter;
      items = items.filter((item) => {
        const y = window._extractYear(item);
        if (y === null) return true;
        return y >= from && y <= to;
      });
    }
    if (STATE._aspectFilter && STATE._aspectFilter !== "all") {
      const af = STATE._aspectFilter;
      items = items.filter((item) => {
        if (!item._aspect) return true;
        return item._aspect === af;
      });
    }
    clearGrid();
    const visible = getDisplayResults(items, STATE.query);
    if (visible.length) renderGrid(visible);
    else showEmptyState();
  }
  (function initAspectFilter() {
    const section = document.getElementById("aspect-filter-section");
    if (!section) return;
    const buttons = section.querySelectorAll(".aspect-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        STATE._aspectFilter = btn.dataset.aspect;
        refilterResults();
      });
    });
  })();
  var SOURCE_AUTHORITY = {
    met: 10,
    rijksmuseum: 10,
    va: 9,
    chicago: 9,
    nga: 9,
    louvre: 9,
    cleveland: 8,
    harvard: 8,
    yale: 8,
    tate: 8,
    prado: 8,
    mia: 8,
    lacma: 8,
    smithsonian: 8,
    europeana: 7,
    loc: 7,
    gallica: 7,
    wikimedia: 6,
    nasa: 7,
    inaturalist: 7,
    gbif: 6,
    flickr: 5,
    openverse: 5,
    unsplash: 5,
    pixabay: 4,
    pexels: 4
  };
  (function upgradeScoreItemRelevance() {
    const _origScore = scoreItemRelevance;
    setScoreItemRelevance(function(item, query) {
      let score = _origScore(item, query);
      const auth = SOURCE_AUTHORITY[item.source] || 0;
      score += auth * 0.3;
      if (item.title && item.description) score += 2;
      if (item.tags && item.tags.length >= 2) score += 1;
      if (item.url && item.url !== item.thumb) score += 1;
      return score;
    });
  })();
  function deduplicateResults(items) {
    if (!items || items.length < 2) return items;
    const seen = /* @__PURE__ */ new Map();
    const out = [];
    for (const item of items) {
      const norm = (item.title || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
      if (!norm || norm.length < 5) {
        out.push(item);
        continue;
      }
      if (seen.has(norm)) {
        const existing = seen.get(norm);
        const authNew = SOURCE_AUTHORITY[item.source] || 0;
        const authOld = SOURCE_AUTHORITY[existing.source] || 0;
        if (authNew > authOld) {
          const idx = out.indexOf(existing);
          if (idx >= 0) out[idx] = item;
          seen.set(norm, item);
        }
      } else {
        seen.set(norm, item);
        out.push(item);
      }
    }
    return out;
  }
  (function patchDedup() {
    const _origGetDisplay = getDisplayResults;
    setGetDisplayResults(function(items, query) {
      return _origGetDisplay(deduplicateResults(items), query);
    });
  })();
  var _SAVED_KEY = "inspo_saved_searches";
  var _SAVED_MAX = 50;
  function loadSavedSearches() {
    try {
      return JSON.parse(localStorage.getItem(_SAVED_KEY)) || [];
    } catch {
      return [];
    }
  }
  function saveSavedSearch(q) {
    if (!q || q.length < 2) return;
    let saved = loadSavedSearches();
    if (saved.includes(q)) return;
    saved = [q, ...saved].slice(0, _SAVED_MAX);
    try {
      localStorage.setItem(_SAVED_KEY, JSON.stringify(saved));
    } catch {
    }
  }
  function removeSavedSearch(q) {
    let saved = loadSavedSearches();
    saved = saved.filter((s) => s !== q);
    try {
      localStorage.setItem(_SAVED_KEY, JSON.stringify(saved));
    } catch {
    }
  }
  (function initSavedSearches() {
    const row = document.querySelector(".search-row");
    if (!row) return;
    const saveBtn = document.createElement("button");
    saveBtn.id = "btn-save-search";
    saveBtn.className = "search-mode-toggle";
    saveBtn.title = "save this search";
    saveBtn.textContent = "\u2605";
    saveBtn.style.display = "none";
    saveBtn.style.fontSize = "14px";
    saveBtn.style.padding = "4px 8px";
    row.appendChild(saveBtn);
    saveBtn.addEventListener("click", () => {
      if (STATE.query) {
        const saved = loadSavedSearches();
        if (saved.includes(STATE.query)) {
          removeSavedSearch(STATE.query);
          saveBtn.style.color = "";
          saveBtn.title = "save this search";
        } else {
          saveSavedSearch(STATE.query);
          saveBtn.style.color = "var(--accent)";
          saveBtn.title = "unsave this search";
        }
      }
    });
    const _origRunSearch = runSearch;
    const _ors2 = async function(query, forceRefresh) {
      await _origRunSearch(query, forceRefresh);
      saveBtn.style.display = "";
      const saved = loadSavedSearches();
      if (saved.includes(STATE.query)) {
        saveBtn.style.color = "var(--accent)";
        saveBtn.title = "unsave this search";
      } else {
        saveBtn.style.color = "";
        saveBtn.title = "save this search";
      }
    };
    window.runSearch = _ors2;
    runSearch = _ors2;
    const _origRenderHistory = renderSearchHistory;
    renderSearchHistory = function(filter) {
      _origRenderHistory(filter);
      const el = document.getElementById("search-history-dropdown");
      if (!el) return;
      const saved = loadSavedSearches().filter(
        (s) => !filter || s.toLowerCase().includes(filter.toLowerCase())
      );
      if (!saved.length) return;
      if (el.hidden && !saved.length) return;
      const divider = document.createElement("div");
      divider.style.cssText = "border-top:1px solid var(--line-strong);font-family:var(--font-ui);font-size:8px;color:var(--ink-3);padding:4px 8px;letter-spacing:0.1em;text-transform:uppercase;";
      divider.textContent = "saved";
      el.appendChild(divider);
      saved.forEach((s) => {
        const btn = document.createElement("button");
        btn.className = "search-history-item";
        btn.textContent = "\u2605 " + s;
        btn.style.color = "var(--accent)";
        btn.setAttribute("role", "option");
        el.appendChild(btn);
      });
      el.hidden = false;
    };
  })();
  function openLightbox(items, startIndex) {
    if (!items || !items.length) return;
    let idx = startIndex || 0;
    let autoTimer = null;
    const overlay = document.createElement("div");
    overlay.className = "lightbox-overlay";
    overlay.innerHTML = `
    <button class="lightbox-close" aria-label="close">&times;</button>
    <button class="lightbox-nav prev" aria-label="previous">&#8249;</button>
    <img class="lightbox-img" alt="">
    <div class="lightbox-caption"></div>
    <button class="lightbox-nav next" aria-label="next">&#8250;</button>
    <div class="lightbox-counter"></div>
  `;
    document.body.appendChild(overlay);
    const img = overlay.querySelector(".lightbox-img");
    const caption = overlay.querySelector(".lightbox-caption");
    const counter = overlay.querySelector(".lightbox-counter");
    function show(i) {
      idx = (i % items.length + items.length) % items.length;
      const item = items[idx];
      img.src = item.url || item.thumb;
      img.alt = item.title || "";
      caption.textContent = `${item.title || "untitled"} \u2014 ${item.source || ""}`;
      counter.textContent = `${idx + 1} / ${items.length}`;
    }
    function next() {
      show(idx + 1);
    }
    function prev() {
      show(idx - 1);
    }
    function close() {
      clearInterval(autoTimer);
      overlay.remove();
      document.removeEventListener("keydown", onKey);
    }
    function onKey(e) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft") prev();
    }
    document.addEventListener("keydown", onKey);
    overlay.querySelector(".lightbox-close").addEventListener("click", close);
    overlay.querySelector(".lightbox-nav.prev").addEventListener("click", prev);
    overlay.querySelector(".lightbox-nav.next").addEventListener("click", next);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    show(idx);
    autoTimer = setInterval(next, 5e3);
  }
  document.getElementById("bar-slideshow-btn")?.addEventListener("click", () => {
    if (STATE.selected.length) openLightbox(STATE.selected, 0);
  });
  function generateCitation(item, style) {
    const title = item.title || "Untitled";
    const source = item.source || "Unknown source";
    const url = item.sourceUrl || item.url || "";
    const year = item.year || "n.d.";
    const accessed = (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    if (style === "apa") {
      return `${title}. (${year}). ${source}. Retrieved ${accessed}, from ${url}`;
    }
    return `"${title}." ${source}, ${year}. Web. ${accessed}. <${url}>.`;
  }
  function copyCitations(items, style) {
    const text = items.map((item) => generateCitation(item, style)).join("\n\n");
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById("bar-cite-btn");
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = "copied!";
        setTimeout(() => {
          btn.textContent = orig;
        }, 1500);
      }
    }).catch(() => {
    });
  }
  document.getElementById("bar-cite-btn")?.addEventListener("click", () => {
    if (!STATE.selected.length) return;
    let dd = document.getElementById("cite-format-dropdown");
    if (dd) {
      dd.remove();
      return;
    }
    dd = document.createElement("div");
    dd.id = "cite-format-dropdown";
    dd.style.cssText = "position:absolute;bottom:50px;right:10px;background:var(--bg-panel);border:1px solid var(--line-strong);z-index:100;display:flex;gap:4px;padding:6px;";
    dd.innerHTML = '<button class="btn" data-fmt="mla" style="font-size:9px;padding:4px 10px;">MLA</button><button class="btn" data-fmt="apa" style="font-size:9px;padding:4px 10px;">APA</button>';
    document.getElementById("floating-bar").appendChild(dd);
    dd.addEventListener("click", (e) => {
      const fmt = e.target.dataset.fmt;
      if (fmt) {
        copyCitations(STATE.selected, fmt);
        dd.remove();
      }
    });
    setTimeout(() => {
      document.addEventListener("click", function rm() {
        dd?.remove();
        document.removeEventListener("click", rm);
      });
    }, 100);
  });
  (function initPrefetchOnHover() {
    const grid = document.getElementById("image-grid");
    if (!grid) return;
    let prefetchTimeout = null;
    grid.addEventListener("mouseover", (e) => {
      const card = e.target.closest(".image-card");
      if (!card) return;
      clearTimeout(prefetchTimeout);
      prefetchTimeout = setTimeout(() => {
        const id = card.dataset.id;
        const item = _gridItemMap.get(id);
        if (item && item.url && item.url !== item.thumb) {
          const link = document.createElement("link");
          link.rel = "prefetch";
          link.href = item.url;
          link.as = "image";
          if (!document.querySelector(`link[href="${CSS.escape(item.url)}"]`)) {
            document.head.appendChild(link);
          }
        }
      }, 200);
    });
    grid.addEventListener("mouseout", () => {
      clearTimeout(prefetchTimeout);
    });
  })();
  var _BOARDS_KEY = "inspo_named_boards";
  function loadNamedBoards() {
    try {
      return JSON.parse(localStorage.getItem(_BOARDS_KEY)) || {};
    } catch {
      return {};
    }
  }
  function saveNamedBoard(name) {
    if (!name) return;
    const boards = loadNamedBoards();
    boards[name] = {
      items: STATE.selected.map((s) => ({
        id: s.id,
        thumb: s.thumb,
        title: s.title,
        source: s.source,
        tags: s.tags || [],
        sourceUrl: s.sourceUrl || "",
        year: s.year || "",
        colors: s.colors || []
      })),
      positions: { ...boardPositions },
      savedAt: Date.now()
    };
    try {
      localStorage.setItem(_BOARDS_KEY, JSON.stringify(boards));
    } catch {
    }
  }
  function loadNamedBoard(name) {
    const boards = loadNamedBoards();
    const board = boards[name];
    if (!board) return;
    STATE.selected = board.items || [];
    if (board.positions) Object.assign(boardPositions, board.positions);
    STATE.selected.forEach((item) => {
      document.getElementById("card-" + item.id)?.classList.add("selected");
    });
    if (typeof updateFloatingBar === "function") updateFloatingBar();
    if (typeof syncBoardOverlay === "function") syncBoardOverlay();
    if (typeof persistBoardState === "function") persistBoardState();
  }
  function deleteNamedBoard(name) {
    const boards = loadNamedBoards();
    delete boards[name];
    try {
      localStorage.setItem(_BOARDS_KEY, JSON.stringify(boards));
    } catch {
    }
  }
  (function initNamedBoards() {
    const header = document.getElementById("board-overlay-header");
    if (!header) return;
    const boardMenuBtn = document.createElement("button");
    boardMenuBtn.className = "btn";
    boardMenuBtn.style.cssText = "padding:2px 8px;font-size:9px;letter-spacing:0.06em;";
    boardMenuBtn.textContent = "boards";
    boardMenuBtn.title = "Save/load named boards";
    header.insertBefore(boardMenuBtn, header.querySelector("#btn-board-popout"));
    boardMenuBtn.addEventListener("click", () => {
      let dd = document.getElementById("named-boards-dropdown");
      if (dd) {
        dd.remove();
        return;
      }
      dd = document.createElement("div");
      dd.id = "named-boards-dropdown";
      dd.style.cssText = "position:absolute;top:36px;left:8px;background:var(--bg-panel);border:1px solid var(--line-strong);z-index:100;min-width:200px;max-height:300px;overflow-y:auto;";
      const saveRow = document.createElement("div");
      saveRow.style.cssText = "display:flex;gap:4px;padding:6px 8px;border-bottom:1px solid var(--line);";
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.placeholder = "board name...";
      nameInput.style.cssText = "flex:1;font-family:var(--font-ui);font-size:10px;background:transparent;border:1px solid var(--line-strong);color:var(--ink);padding:3px 6px;outline:none;";
      const saveBtn = document.createElement("button");
      saveBtn.className = "btn";
      saveBtn.style.cssText = "padding:3px 8px;font-size:9px;";
      saveBtn.textContent = "save";
      saveBtn.addEventListener("click", () => {
        const n = nameInput.value.trim();
        if (n) {
          saveNamedBoard(n);
          dd.remove();
        }
      });
      nameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          saveBtn.click();
        }
      });
      saveRow.append(nameInput, saveBtn);
      dd.appendChild(saveRow);
      const boards = loadNamedBoards();
      const names = Object.keys(boards).sort((a, b) => (boards[b].savedAt || 0) - (boards[a].savedAt || 0));
      if (names.length === 0) {
        const empty = document.createElement("div");
        empty.style.cssText = "padding:8px;font-family:var(--font-ui);font-size:10px;color:var(--ink-3);";
        empty.textContent = "no saved boards yet";
        dd.appendChild(empty);
      }
      names.forEach((name) => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:6px 8px;border-bottom:1px solid var(--line);";
        const label = document.createElement("button");
        label.style.cssText = "background:none;border:none;color:var(--ink);font-family:var(--font-ui);font-size:10px;cursor:pointer;text-align:left;flex:1;padding:0;";
        label.textContent = `${name} (${boards[name].items?.length || 0})`;
        label.addEventListener("click", () => {
          loadNamedBoard(name);
          dd.remove();
        });
        const del = document.createElement("button");
        del.style.cssText = "background:none;border:none;color:var(--ink-3);font-size:12px;cursor:pointer;padding:0 4px;";
        del.textContent = "\xD7";
        del.title = "delete board";
        del.addEventListener("click", () => {
          deleteNamedBoard(name);
          dd.remove();
        });
        row.append(label, del);
        dd.appendChild(row);
      });
      header.style.position = "relative";
      header.appendChild(dd);
      setTimeout(() => {
        document.addEventListener("click", function rm(ev) {
          if (!dd.contains(ev.target) && ev.target !== boardMenuBtn) {
            dd.remove();
            document.removeEventListener("click", rm);
          }
        });
      }, 100);
    });
  })();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {
    });
  }
  var COLOR_HUES = {
    red: { h: [0, 15], h2: [345, 360] },
    orange: { h: [15, 45] },
    yellow: { h: [45, 70] },
    green: { h: [70, 170] },
    blue: { h: [170, 260] },
    purple: { h: [260, 310] },
    pink: { h: [310, 345] }
  };
  function classifyDominantColor(r, g, b) {
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    if (d < 25) {
      if (l < 50) return "black";
      if (l > 200) return "white";
      return null;
    }
    const s = d / (255 - Math.abs(2 * l - 255));
    if (s < 0.2) {
      if (r > g && r > b && l > 80 && l < 180) return "brown";
      return null;
    }
    if (r > 180 && g > 140 && g < 200 && b < 100 && s > 0.3) return "gold";
    if (r > 100 && r > g * 1.1 && g > b * 1.3 && l < 140 && s < 0.5) return "brown";
    let h;
    if (max === r) h = (g - b) / d % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
    for (const [name, ranges] of Object.entries(COLOR_HUES)) {
      if (h >= ranges.h[0] && h < ranges.h[1]) return name;
      if (ranges.h2 && h >= ranges.h2[0] && h < ranges.h2[1]) return name;
    }
    return null;
  }
  function rgbToLab(r, g, b) {
    var rl = r / 255, gl = g / 255, bl = b / 255;
    rl = rl > 0.04045 ? Math.pow((rl + 0.055) / 1.055, 2.4) : rl / 12.92;
    gl = gl > 0.04045 ? Math.pow((gl + 0.055) / 1.055, 2.4) : gl / 12.92;
    bl = bl > 0.04045 ? Math.pow((bl + 0.055) / 1.055, 2.4) : bl / 12.92;
    var x = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / 0.95047;
    var y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.072175;
    var z = (rl * 0.0193339 + gl * 0.119192 + bl * 0.9503041) / 1.08883;
    var fx = x > 8856e-6 ? Math.cbrt(x) : 7.787 * x + 16 / 116;
    var fy = y > 8856e-6 ? Math.cbrt(y) : 7.787 * y + 16 / 116;
    var fz = z > 8856e-6 ? Math.cbrt(z) : 7.787 * z + 16 / 116;
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  }
  function deltaE00(lab1, lab2) {
    var L1 = lab1[0], a1 = lab1[1], b1 = lab1[2];
    var L2 = lab2[0], a2 = lab2[1], b2 = lab2[2];
    var C1 = Math.sqrt(a1 * a1 + b1 * b1);
    var C2 = Math.sqrt(a2 * a2 + b2 * b2);
    var Cab = (C1 + C2) / 2;
    var Cab7 = Math.pow(Cab, 7);
    var G = 0.5 * (1 - Math.sqrt(Cab7 / (Cab7 + 6103515625)));
    var a1p = a1 * (1 + G), a2p = a2 * (1 + G);
    var C1p = Math.sqrt(a1p * a1p + b1 * b1);
    var C2p = Math.sqrt(a2p * a2p + b2 * b2);
    var h1p = Math.atan2(b1, a1p) * 180 / Math.PI;
    if (h1p < 0) h1p += 360;
    var h2p = Math.atan2(b2, a2p) * 180 / Math.PI;
    if (h2p < 0) h2p += 360;
    var dLp = L2 - L1, dCp = C2p - C1p;
    var dhp;
    if (C1p * C2p === 0) dhp = 0;
    else if (Math.abs(h2p - h1p) <= 180) dhp = h2p - h1p;
    else if (h2p - h1p > 180) dhp = h2p - h1p - 360;
    else dhp = h2p - h1p + 360;
    var dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp * Math.PI / 360);
    var Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
    var hbp;
    if (C1p * C2p === 0) hbp = h1p + h2p;
    else if (Math.abs(h1p - h2p) <= 180) hbp = (h1p + h2p) / 2;
    else if (h1p + h2p < 360) hbp = (h1p + h2p + 360) / 2;
    else hbp = (h1p + h2p - 360) / 2;
    var T = 1 - 0.17 * Math.cos((hbp - 30) * Math.PI / 180) + 0.24 * Math.cos(2 * hbp * Math.PI / 180) + 0.32 * Math.cos((3 * hbp + 6) * Math.PI / 180) - 0.2 * Math.cos((4 * hbp - 63) * Math.PI / 180);
    var Lbp50sq = (Lbp - 50) * (Lbp - 50);
    var SL = 1 + 0.015 * Lbp50sq / Math.sqrt(20 + Lbp50sq);
    var SC = 1 + 0.045 * Cbp;
    var SH = 1 + 0.015 * Cbp * T;
    var Cbp7 = Math.pow(Cbp, 7);
    var RC = 2 * Math.sqrt(Cbp7 / (Cbp7 + 6103515625));
    var dtheta = 30 * Math.exp(-Math.pow((hbp - 275) / 25, 2));
    var RT = -Math.sin(2 * dtheta * Math.PI / 180) * RC;
    return Math.sqrt(
      Math.pow(dLp / SL, 2) + Math.pow(dCp / SC, 2) + Math.pow(dHp / SH, 2) + RT * (dCp / SC) * (dHp / SH)
    );
  }
  var _colorCache = /* @__PURE__ */ new Map();
  function sampleImageColors(img) {
    var cacheKey2 = img.src || img.dataset.src;
    if (cacheKey2 && _colorCache.has(cacheKey2)) return _colorCache.get(cacheKey2);
    try {
      var canvas = document.createElement("canvas");
      var sz = 32;
      canvas.width = sz;
      canvas.height = sz;
      var ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, sz, sz);
      var data = ctx.getImageData(0, 0, sz, sz).data;
      var qSz = sz >> 2;
      var buckets = {};
      var rT = 0, gT = 0, bT = 0, wT = 0;
      for (var y = 0; y < sz; y++) {
        for (var x = 0; x < sz; x++) {
          var i = (y * sz + x) * 4;
          var r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 128) continue;
          var inCenter = x >= qSz && x < sz - qSz && y >= qSz && y < sz - qSz;
          var w = inCenter ? 4 : 1;
          rT += r * w;
          gT += g * w;
          bT += b * w;
          wT += w;
          var rq = Math.round(r / 32) * 32;
          var gq = Math.round(g / 32) * 32;
          var bq = Math.round(b / 32) * 32;
          var key = rq << 16 | gq << 8 | bq;
          if (!buckets[key]) buckets[key] = { r: 0, g: 0, b: 0, w: 0 };
          buckets[key].r += r * w;
          buckets[key].g += g * w;
          buckets[key].b += b * w;
          buckets[key].w += w;
        }
      }
      if (wT === 0) return null;
      var avgRGB = [Math.round(rT / wT), Math.round(gT / wT), Math.round(bT / wT)];
      var sorted = Object.values(buckets).sort(function(a2, b2) {
        return b2.w - a2.w;
      });
      var topColors = sorted.slice(0, 3).map(function(bk) {
        return { r: Math.round(bk.r / bk.w), g: Math.round(bk.g / bk.w), b: Math.round(bk.b / bk.w), weight: bk.w / wT };
      });
      var dominant = classifyDominantColor(avgRGB[0], avgRGB[1], avgRGB[2]);
      var colorNames = /* @__PURE__ */ new Set();
      if (dominant) colorNames.add(dominant);
      topColors.forEach(function(c) {
        var name = classifyDominantColor(c.r, c.g, c.b);
        if (name) colorNames.add(name);
      });
      var result = { dominant, colorNames: Array.from(colorNames), topColors, avgRGB };
      if (cacheKey2) {
        if (_colorCache.size > 2e3) _colorCache.clear();
        _colorCache.set(cacheKey2, result);
      }
      return result;
    } catch {
      return null;
    }
  }
  function sampleImageColor(img) {
    var d = sampleImageColors(img);
    return d ? d.dominant : null;
  }
  function sampleImageRGB(img) {
    var d = sampleImageColors(img);
    return d ? d.avgRGB : null;
  }
  (function initColorFilter() {
    const section = document.getElementById("color-filter-section");
    if (!section) return;
    const buttons = section.querySelectorAll(".color-swatch-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        STATE._colorFilter = btn.dataset.color;
        refilterResults();
      });
    });
    const _origRefilter = refilterResults;
    refilterResults = function() {
      if (!STATE.results.length) return;
      let items = [...STATE.results];
      if (STATE._dateFilter) {
        const { from, to } = STATE._dateFilter;
        items = items.filter((item) => {
          const y = window._extractYear(item);
          if (y === null) return true;
          return y >= from && y <= to;
        });
      }
      if (STATE._aspectFilter && STATE._aspectFilter !== "all") {
        items = items.filter((item) => !item._aspect || item._aspect === STATE._aspectFilter);
      }
      if (STATE._colorFilter && STATE._colorFilter !== "all") {
        items = items.filter((item) => {
          const names = item._colorNames || (item._dominantColor ? [item._dominantColor] : null);
          return !names || names.includes(STATE._colorFilter);
        });
      }
      if (typeof window._hexPaletteMatch === "function" && STATE._hexPalette && STATE._hexPalette.length) {
        items = items.filter((item) => !item._avgRGB && !item._topColors || window._hexPaletteMatch(item));
      }
      clearGrid();
      const visible = getDisplayResults(items, STATE.query);
      if (visible.length) renderGrid(visible);
      else showEmptyState();
    };
  })();
  function openCompareView(items) {
    if (!items || items.length < 2) return;
    const compareItems = items.slice(0, 4);
    const overlay = document.createElement("div");
    overlay.className = "compare-overlay";
    overlay.innerHTML = `
    <div class="compare-header">
      <span class="section-label">comparing ${compareItems.length} images</span>
      <button class="compare-close" aria-label="close">&times;</button>
    </div>
    <div class="compare-grid" data-count="${compareItems.length}"></div>
  `;
    const grid = overlay.querySelector(".compare-grid");
    compareItems.forEach((item) => {
      const card = document.createElement("div");
      card.className = "compare-card";
      card.innerHTML = `
      <img src="${item.url || item.thumb}" alt="${item.title || ""}">
      <div class="compare-meta">
        <div class="title">${item.title || "untitled"}</div>
        <div>${item.source || ""} ${item.year ? "\xB7 " + item.year : ""}</div>
        ${item.description ? '<div style="margin-top:4px;font-size:9px;max-height:60px;overflow:hidden;">' + (item.description.length > 200 ? item.description.slice(0, 200) + "\u2026" : item.description) + "</div>" : ""}
        ${item.tags?.length ? '<div style="margin-top:4px;font-size:8px;color:var(--ink-3);">' + item.tags.slice(0, 6).join(" \xB7 ") + "</div>" : ""}
      </div>
    `;
      grid.appendChild(card);
    });
    document.body.appendChild(overlay);
    function close() {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
    }
    function onKey(e) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    overlay.querySelector(".compare-close").addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
  }
  document.getElementById("bar-compare-btn")?.addEventListener("click", () => {
    if (STATE.selected.length >= 2) openCompareView(STATE.selected);
  });
  function buildAttributionString(item) {
    const title = item.title || "Untitled";
    const source = item.source || "Unknown source";
    const url = item.sourceUrl || item.url || "";
    const year = item.year || "";
    const parts = [`"${title}"`];
    if (year) parts.push(`(${year})`);
    parts.push("\u2014");
    parts.push(source);
    if (url) parts.push(`[${url}]`);
    parts.push("\u2014 via InspoSearch");
    return parts.join(" ");
  }
  function openDownloadPanel(items) {
    if (!items?.length) return;
    const overlay = document.createElement("div");
    overlay.className = "dl-overlay";
    const panel = document.createElement("div");
    panel.className = "dl-panel";
    panel.innerHTML = '<button class="dl-panel-close" aria-label="close">&times;</button><div class="section-label" style="margin-bottom:12px;">download with attribution</div>';
    items.forEach((item) => {
      const attr = buildAttributionString(item);
      const row = document.createElement("div");
      row.className = "dl-item";
      row.innerHTML = `
      <img src="${item.thumb}" alt="${item.title || ""}">
      <div class="dl-item-info">
        <div class="title">${item.title || "untitled"}</div>
        <div>${item.source || ""} ${item.year ? "\xB7 " + item.year : ""}</div>
        <div class="attribution">${attr}</div>
        <div class="dl-item-actions">
          <button data-action="copy">copy attribution</button>
          <button data-action="download">download image</button>
        </div>
      </div>
    `;
      row.querySelector('[data-action="copy"]').addEventListener("click", (e) => {
        navigator.clipboard.writeText(attr).then(() => {
          e.target.textContent = "copied!";
          setTimeout(() => {
            e.target.textContent = "copy attribution";
          }, 1500);
        }).catch(() => {
        });
      });
      row.querySelector('[data-action="download"]').addEventListener("click", () => {
        const url = item.url || item.thumb;
        fetch(url, { mode: "cors" }).then((r) => r.blob()).then((blob) => {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          const ext = url.match(/\.(jpe?g|png|webp|gif|tiff?)(?:\?|$)/i)?.[1] || "jpg";
          a.download = `${(item.title || "image").replace(/[^a-z0-9]/gi, "_").slice(0, 60)}.${ext}`;
          a.click();
          URL.revokeObjectURL(a.href);
        }).catch(() => {
          window.open(url, "_blank");
        });
      });
      panel.appendChild(row);
    });
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    function close() {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
    }
    function onKey(e) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    panel.querySelector(".dl-panel-close").addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
  }
  document.getElementById("bar-download-btn")?.addEventListener("click", () => {
    if (STATE.selected.length) openDownloadPanel(STATE.selected);
  });
  function encodeBoardToURL() {
    if (!STATE.selected.length) return null;
    const compact = STATE.selected.map((s) => ({
      i: s.id,
      t: s.thumb,
      n: s.title,
      s: s.source,
      u: s.sourceUrl || "",
      y: s.year || ""
    }));
    const json = JSON.stringify(compact);
    const b64 = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const url = new URL(window.location.href);
    url.searchParams.set("board", b64);
    url.hash = "";
    return url.toString();
  }
  function decodeBoardFromURL() {
    const params = new URLSearchParams(window.location.search);
    const b64 = params.get("board");
    if (!b64) return null;
    try {
      const padded = b64.replace(/-/g, "+").replace(/_/g, "/");
      const json = decodeURIComponent(escape(atob(padded)));
      const compact = JSON.parse(json);
      if (!Array.isArray(compact)) return null;
      return compact.map((c) => ({
        id: c.i,
        thumb: c.t,
        title: c.n,
        source: c.s,
        sourceUrl: c.u || "",
        year: c.y || "",
        tags: [],
        colors: []
      }));
    } catch {
      return null;
    }
  }
  document.getElementById("bar-share-btn")?.addEventListener("click", () => {
    const url = encodeBoardToURL();
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.getElementById("bar-share-btn");
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = "link copied!";
        setTimeout(() => {
          btn.textContent = orig;
        }, 2e3);
      }
    }).catch(() => {
    });
  });
  (function restoreSharedBoard() {
    const items = decodeBoardFromURL();
    if (!items || !items.length) return;
    if (STATE.selected.length) return;
    STATE.selected = items;
    if (typeof updateFloatingBar === "function") updateFloatingBar();
    if (typeof syncBoardOverlay === "function") syncBoardOverlay();
    if (typeof persistBoardState === "function") persistBoardState();
    const url = new URL(window.location.href);
    url.searchParams.delete("board");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  })();
  var BOARD_TEMPLATES = [
    {
      name: "grid 2\xD72",
      cols: 2,
      rows: 2,
      layout: (items, w, h) => items.slice(0, 4).map((_, i) => ({
        x: i % 2 * (w / 2) + w * 0.05,
        y: Math.floor(i / 2) * (h / 2) + h * 0.05,
        w: w * 0.4,
        h: h * 0.4
      }))
    },
    {
      name: "row",
      layout: (items, w, h) => {
        const n = Math.min(items.length, 6);
        const iw = (w - 40) / n;
        return items.slice(0, n).map((_, i) => ({
          x: 20 + i * iw,
          y: h * 0.2,
          w: iw * 0.9,
          h: h * 0.6
        }));
      }
    },
    {
      name: "focus + 3",
      layout: (items, w, h) => {
        const positions = [
          { x: w * 0.05, y: h * 0.05, w: w * 0.55, h: h * 0.9 }
        ];
        for (let i = 1; i < Math.min(items.length, 4); i++) {
          positions.push({
            x: w * 0.65,
            y: h * 0.05 + (i - 1) * (h * 0.32),
            w: w * 0.3,
            h: h * 0.28
          });
        }
        return positions;
      }
    },
    {
      name: "mosaic",
      layout: (items, w, h) => {
        const n = Math.min(items.length, 6);
        const cols = n <= 3 ? n : 3;
        const rows = Math.ceil(n / cols);
        return items.slice(0, n).map((_, i) => ({
          x: i % cols * (w / cols) + 10,
          y: Math.floor(i / cols) * (h / rows) + 10,
          w: w / cols - 20,
          h: h / rows - 20
        }));
      }
    },
    {
      name: "compare 2",
      layout: (items, w, h) => [
        { x: w * 0.02, y: h * 0.05, w: w * 0.46, h: h * 0.9 },
        { x: w * 0.52, y: h * 0.05, w: w * 0.46, h: h * 0.9 }
      ]
    },
    {
      name: "scatter",
      layout: (items, w, h) => {
        const n = Math.min(items.length, 8);
        return items.slice(0, n).map((_, i) => ({
          x: i * 137 % 100 / 100 * (w * 0.7) + w * 0.05,
          y: (i * 97 + 31) % 100 / 100 * (h * 0.6) + h * 0.1,
          w: w * 0.25,
          h: h * 0.35
        }));
      }
    }
  ];
  function applyBoardTemplate(template) {
    const boardEl = document.getElementById("board-canvas") || document.getElementById("board-overlay-content");
    if (!boardEl || !STATE.selected.length) return;
    const w = boardEl.clientWidth || 800;
    const h = boardEl.clientHeight || 600;
    const positions = template.layout(STATE.selected, w, h);
    STATE.selected.forEach((item, i) => {
      if (positions[i]) {
        boardPositions[item.id] = {
          x: positions[i].x,
          y: positions[i].y,
          width: positions[i].w,
          height: positions[i].h
        };
      }
    });
    if (typeof syncBoardOverlay === "function") syncBoardOverlay();
    if (typeof persistBoardState === "function") persistBoardState();
  }
  (function initBoardTemplates() {
    const header = document.getElementById("board-overlay-header");
    if (!header) return;
    const tmplBtn = document.createElement("button");
    tmplBtn.className = "btn";
    tmplBtn.style.cssText = "padding:2px 8px;font-size:9px;letter-spacing:0.06em;";
    tmplBtn.textContent = "layout";
    tmplBtn.title = "Apply a board layout template";
    const popout = header.querySelector("#btn-board-popout");
    if (popout) header.insertBefore(tmplBtn, popout);
    else header.appendChild(tmplBtn);
    tmplBtn.addEventListener("click", () => {
      let dd = document.getElementById("tmpl-dropdown");
      if (dd) {
        dd.remove();
        return;
      }
      dd = document.createElement("div");
      dd.id = "tmpl-dropdown";
      dd.style.cssText = "position:absolute;top:36px;left:80px;background:var(--bg-panel);border:1px solid var(--line-strong);z-index:100;";
      dd.className = "tmpl-grid";
      BOARD_TEMPLATES.forEach((tmpl) => {
        const card = document.createElement("div");
        card.className = "tmpl-card";
        card.textContent = tmpl.name;
        card.addEventListener("click", () => {
          applyBoardTemplate(tmpl);
          dd.remove();
        });
        dd.appendChild(card);
      });
      header.style.position = "relative";
      header.appendChild(dd);
      setTimeout(() => {
        document.addEventListener("click", function rm(ev) {
          if (!dd.contains(ev.target) && ev.target !== tmplBtn) {
            dd.remove();
            document.removeEventListener("click", rm);
          }
        });
      }, 100);
    });
  })();
  (function patchColorSampling() {
    const _origRenderGrid = renderGrid;
    renderGrid = function(items) {
      _origRenderGrid(items);
      requestAnimationFrame(() => {
        const grid = document.getElementById("image-grid");
        if (!grid) return;
        grid.querySelectorAll(".image-card img.loaded").forEach((img) => {
          const card = img.closest(".image-card");
          if (!card) return;
          const item = _gridItemMap.get(card.dataset.id);
          if (item && !item._dominantColor) {
            item._dominantColor = sampleImageColor(img);
          }
          if (item && !item._avgRGB) {
            item._avgRGB = sampleImageRGB(img);
          }
        });
      });
      setTimeout(() => {
        const grid = document.getElementById("image-grid");
        if (!grid) return;
        grid.querySelectorAll(".image-card img:not(.loaded)").forEach((img) => {
          const origOnload = img.onload;
          img.onload = function() {
            if (origOnload) origOnload.call(this);
            const card = img.closest(".image-card");
            if (card) {
              const item = _gridItemMap.get(card.dataset.id);
              if (item && !item._dominantColor) {
                item._dominantColor = sampleImageColor(img);
              }
              if (item && !item._avgRGB) {
                item._avgRGB = sampleImageRGB(img);
              }
            }
          };
        });
      }, 100);
    };
  })();
  (function initPWAInstall() {
    let _deferredPrompt = null;
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      _deferredPrompt = e;
      setTimeout(showInstallBanner, 3e3);
    });
    function showInstallBanner() {
      if (!_deferredPrompt) return;
      if (document.getElementById("pwa-install-banner")) return;
      const banner = document.createElement("div");
      banner.id = "pwa-install-banner";
      banner.style.cssText = "position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:9999;background:var(--bg-panel);border:1px solid var(--line-strong);padding:10px 18px;display:flex;align-items:center;gap:12px;font-family:var(--font-ui);font-size:11px;letter-spacing:0.04em;color:var(--ink);box-shadow:0 4px 20px rgba(0,0,0,0.2);";
      banner.innerHTML = `
      <span>install insposearch as an app</span>
      <button id="pwa-install-btn" style="background:var(--accent);color:#0E0E0D;border:none;padding:6px 14px;font-family:var(--font-ui);font-size:10px;cursor:pointer;letter-spacing:0.06em;">install</button>
      <button id="pwa-dismiss-btn" style="background:none;border:none;color:var(--ink-3);cursor:pointer;font-size:14px;line-height:1;">&times;</button>
    `;
      document.body.appendChild(banner);
      document.getElementById("pwa-install-btn").addEventListener("click", async () => {
        banner.remove();
        if (_deferredPrompt) {
          _deferredPrompt.prompt();
          await _deferredPrompt.userChoice;
          _deferredPrompt = null;
        }
      });
      document.getElementById("pwa-dismiss-btn").addEventListener("click", () => {
        banner.remove();
        _deferredPrompt = null;
      });
    }
  })();
  (function initDiscoverLanding() {
    const POPULAR = [
      "still life",
      "portrait",
      "landscape",
      "botanical",
      "architecture",
      "mythology",
      "water",
      "light",
      "textile",
      "manuscript",
      "sculpture",
      "ceramic",
      "gold",
      "vanitas",
      "japanese"
    ];
    const CATEGORIES = [
      { name: "paintings", query: "painting oil canvas" },
      { name: "photography", query: "photograph vintage" },
      { name: "sculpture", query: "sculpture marble bronze" },
      { name: "architecture", query: "architecture building cathedral" },
      { name: "manuscripts", query: "manuscript illuminated medieval" },
      { name: "maps & charts", query: "map cartography atlas" },
      { name: "textiles", query: "textile tapestry embroidery" },
      { name: "prints", query: "print etching engraving woodcut" },
      { name: "ceramics", query: "ceramic pottery porcelain" },
      { name: "natural history", query: "botanical flora fauna specimen" }
    ];
    const HEROES = [
      { label: "today's muse", title: "the dutch golden age", sub: "rembrandt, vermeer, and the art of everyday life", query: "dutch golden age painting", imgKey: "the dutch golden age" },
      { label: "explore", title: "japanese woodblock prints", sub: "ukiyo-e masters \u2014 hokusai, hiroshige, utamaro", query: "ukiyo-e woodblock print", imgKey: "japanese woodblock prints" },
      { label: "discover", title: "art nouveau & organic form", sub: "when nature met design \u2014 mucha, klimt, gall\xE9", query: "art nouveau ornamental", imgKey: "art nouveau & organic form" },
      { label: "look closer", title: "illuminated manuscripts", sub: "gold leaf, ultramarine, and sacred geometry", query: "illuminated manuscript medieval", imgKey: "illuminated manuscripts" },
      { label: "inspiration", title: "botanical illustration", sub: "the beauty of scientific precision", query: "botanical illustration flower", imgKey: "botanical illustration" },
      { label: "venture into", title: "ancient maps & cartography", sub: "when the edges of the world were imagined", query: "antique map cartography", imgKey: "ancient maps & cartography" },
      { label: "a closer look", title: "impressionist light", sub: "monet, renoir, and the capture of fleeting moments", query: "impressionist painting light", imgKey: "impressionist light" }
    ];
    var _imgPools = null;
    function getDay() {
      return Math.floor(Date.now() / 864e5);
    }
    function pickFromPool(pools, key, offset) {
      if (!pools) return "";
      var pool = pools[key];
      if (!pool || !pool.length) return "";
      return pool[(getDay() * 7 + (offset || 0)) % pool.length] || "";
    }
    function getHeroOfDay() {
      return HEROES[getDay() % HEROES.length];
    }
    function escAttr(s) {
      return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    }
    function escHtml(s) {
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    }
    function buildHTML(pools) {
      const hero = getHeroOfDay();
      const heroImg = pickFromPool(pools ? pools.heroes : null, hero.imgKey, 0);
      const heroStyle = heroImg ? ` style="background-image:url('` + escAttr(heroImg) + `')"` : "";
      const pillsHTML = POPULAR.map(
        (t) => '<button class="discover-pill" data-query="' + escAttr(t) + '">' + escHtml(t) + "</button>"
      ).join("");
      const catsHTML = CATEGORIES.map(function(c, idx) {
        var bgImg = pickFromPool(pools ? pools.categories : null, c.name, idx + 1);
        var style = bgImg ? ` style="background-image:url('` + escAttr(bgImg) + `')"` : "";
        return '<button class="discover-cat" data-query="' + escAttr(c.query) + '"' + style + '><span class="discover-cat-name">' + escHtml(c.name) + "</span></button>";
      }).join("");
      return '<div id="discover-landing" class="discover-landing" style="grid-column:1/-1;"><div class="discover-hero"' + heroStyle + ' data-query="' + escAttr(hero.query) + '"><div class="discover-hero-content"><div class="discover-hero-label">' + escHtml(hero.label) + '</div><div class="discover-hero-title">' + escHtml(hero.title) + '</div><div class="discover-hero-sub">' + escHtml(hero.sub) + '</div></div></div><div class="discover-section"><div class="discover-section-label">popular searches</div><div class="discover-pills">' + pillsHTML + '</div></div><div class="discover-section"><div class="discover-section-label">browse by category</div><div class="discover-categories">' + catsHTML + "</div></div></div>";
    }
    function show() {
      const grid = document.getElementById("image-grid");
      if (!grid || grid.querySelector("#discover-landing")) return;
      const es = grid.querySelector(".empty-state");
      if (es) es.style.display = "none";
      grid.insertAdjacentHTML("afterbegin", buildHTML(_imgPools));
      if (!_imgPools) {
        fetch("data/homepage-images.json").then(function(r) {
          return r.ok ? r.json() : null;
        }).then(function(pools) {
          if (!pools) return;
          _imgPools = pools;
          var heroEl = document.querySelector(".discover-hero");
          if (heroEl && !heroEl.style.backgroundImage) {
            var hero = getHeroOfDay();
            var img = pickFromPool(pools.heroes, hero.imgKey, 0);
            if (img) heroEl.style.backgroundImage = "url('" + img.replace(/'/g, "\\'") + "')";
          }
          document.querySelectorAll(".discover-cat").forEach(function(btn, idx) {
            if (!btn.style.backgroundImage) {
              var cat = CATEGORIES[idx];
              if (!cat) return;
              var img2 = pickFromPool(pools.categories, cat.name, idx + 1);
              if (img2) btn.style.backgroundImage = "url('" + img2.replace(/'/g, "\\'") + "')";
            }
          });
        }).catch(function() {
        });
      }
    }
    document.getElementById("image-grid").addEventListener("click", function(e) {
      var target = e.target.closest(".discover-pill") || e.target.closest(".discover-cat") || e.target.closest(".discover-hero");
      if (!target || !target.dataset.query) return;
      var q = target.dataset.query;
      document.getElementById("search-input").value = q;
      runSearch(q);
    });
    document.querySelector(".logo").addEventListener("click", function() {
      requestAnimationFrame(show);
    });
    window._showDiscoverLanding = show;
    show();
  })();
  (function initOnboardingTour() {
    var TOUR_STEPS = [
      { el: "#search-input", title: "search", body: "type any word, feeling, or concept. explore mode automatically expands your query with synonyms." },
      { el: "#btn-search-mode", title: "search mode", body: "toggle between explore (synonym expansion) and exact (literal terms only)." },
      { el: "#count-slider", title: "image count", body: "drag to control how many images load per source. higher = more results but slower." },
      { el: "#btn-settings", title: "api keys", body: "manage api keys to unlock premium sources like unsplash, met museum iiif, and more." },
      { el: "#sources-active-counter", title: "active sources", body: "shows how many sources are currently enabled and responding." },
      { el: "#btn-board", title: "board mode", body: "click images to select them, then switch to board to arrange and export your picks." }
    ];
    var _backdrop = null;
    var _tooltip = null;
    var _step = 0;
    function startTour() {
      _step = 0;
      _backdrop = document.createElement("div");
      _backdrop.className = "tour-backdrop";
      _backdrop.addEventListener("click", endTour);
      document.body.appendChild(_backdrop);
      showStep();
    }
    function showStep() {
      if (_step >= TOUR_STEPS.length) {
        endTour();
        return;
      }
      var s = TOUR_STEPS[_step];
      var target = document.querySelector(s.el);
      if (!target) {
        _step++;
        showStep();
        return;
      }
      var prev = document.querySelector(".tour-highlight");
      if (prev) prev.classList.remove("tour-highlight");
      target.classList.add("tour-highlight");
      if (_tooltip) _tooltip.remove();
      _tooltip = document.createElement("div");
      _tooltip.className = "tour-tooltip";
      _tooltip.innerHTML = '<div class="tour-tooltip-title">' + s.title + '</div><div class="tour-tooltip-body">' + s.body + '</div><div class="tour-tooltip-footer"><button class="tour-tooltip-skip" id="tour-skip">skip tour</button><span class="tour-tooltip-step">' + (_step + 1) + " / " + TOUR_STEPS.length + '</span><button class="tour-tooltip-btn" id="tour-next">' + (_step < TOUR_STEPS.length - 1 ? "next" : "done") + "</button></div>";
      document.body.appendChild(_tooltip);
      var rect = target.getBoundingClientRect();
      var ttW = _tooltip.offsetWidth;
      var ttH = _tooltip.offsetHeight;
      var left = rect.left + rect.width / 2 - ttW / 2;
      var top = rect.bottom + 12;
      if (left + ttW > window.innerWidth - 12) left = window.innerWidth - ttW - 12;
      if (left < 12) left = 12;
      if (top + ttH > window.innerHeight - 12) top = rect.top - ttH - 12;
      _tooltip.style.left = left + "px";
      _tooltip.style.top = top + "px";
      document.getElementById("tour-next").addEventListener("click", function() {
        _step++;
        showStep();
      });
      document.getElementById("tour-skip").addEventListener("click", endTour);
    }
    function endTour() {
      var hl = document.querySelector(".tour-highlight");
      if (hl) hl.classList.remove("tour-highlight");
      if (_tooltip) {
        _tooltip.remove();
        _tooltip = null;
      }
      if (_backdrop) {
        _backdrop.remove();
        _backdrop = null;
      }
      try {
        localStorage.setItem("inspo_tour_done", "1");
      } catch (_) {
      }
    }
    try {
      if (!localStorage.getItem("inspo_tour_done")) {
        setTimeout(startTour, 800);
      }
    } catch (_) {
    }
    var CHEAT_HTML = '<div class="cheat-overlay" id="cheat-overlay"><div class="cheat-panel" style="position:relative;"><button class="cheat-close" id="cheat-close">&times;</button><h2>help & shortcuts</h2><h3>search syntax</h3><dl><dt><code>marble</code></dt><dd>search with synonym expansion (explore mode)</dd><dt><code>"exact phrase"</code></dt><dd>match these words exactly</dd><dt><code>marble NOT statue</code></dt><dd>exclude results containing "statue"</dd><dt><code>landscape --no:photo</code></dt><dd>negative filter by source type</dd></dl><h3>keyboard shortcuts</h3><dl><dt><code>Enter</code></dt><dd>run search</dd><dt><code>Ctrl/Cmd + Shift + E</code></dt><dd>toggle explore / exact mode</dd><dt><code>Escape</code></dt><dd>close modals and panels</dd></dl><h3>tips</h3><dl><dt>select images</dt><dd>click any image to select it, then use board or compare</dd><dt>boards</dt><dd>switch to board view to arrange, annotate, and export selected images</dd><dt>color swatches</dt><dd>click a swatch to filter results by dominant color</dd></dl><div style="margin-top:20px; text-align:center;"><button class="tour-tooltip-btn" id="cheat-tour-btn">restart tour</button></div></div></div>';
    function showCheatSheet() {
      if (document.getElementById("cheat-overlay")) return;
      document.body.insertAdjacentHTML("beforeend", CHEAT_HTML);
      document.getElementById("cheat-close").addEventListener("click", hideCheatSheet);
      document.getElementById("cheat-overlay").addEventListener("click", function(e) {
        if (e.target === this) hideCheatSheet();
      });
      document.getElementById("cheat-tour-btn").addEventListener("click", function() {
        hideCheatSheet();
        try {
          localStorage.removeItem("inspo_tour_done");
        } catch (_) {
        }
        startTour();
      });
    }
    function hideCheatSheet() {
      var el = document.getElementById("cheat-overlay");
      if (el) el.remove();
    }
    var helpBtn = document.getElementById("btn-help");
    if (helpBtn) helpBtn.addEventListener("click", showCheatSheet);
    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape") hideCheatSheet();
    });
  })();
  (function initHexPalette() {
    var MAX_COLORS = 5;
    var palette = [];
    var pickerEl = document.getElementById("hex-picker");
    var inputEl = document.getElementById("hex-input");
    var addBtn = document.getElementById("hex-add-btn");
    var chipsEl = document.getElementById("hex-chips");
    if (!pickerEl || !inputEl || !addBtn || !chipsEl) return;
    pickerEl.addEventListener("input", function() {
      inputEl.value = pickerEl.value;
    });
    function hexToRGB(hex) {
      hex = hex.replace(/^#/, "");
      if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      if (hex.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(hex)) return null;
      return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
    }
    function addColor(hex) {
      if (palette.length >= MAX_COLORS) return;
      hex = hex.trim().toLowerCase();
      if (!hex.startsWith("#")) hex = "#" + hex;
      var rgb = hexToRGB(hex);
      if (!rgb) return;
      if (palette.some(function(c) {
        return c.hex === hex;
      })) return;
      palette.push({ hex, rgb });
      renderChips();
      applyPaletteFilter();
      updateURL();
    }
    function removeColor(idx) {
      palette.splice(idx, 1);
      renderChips();
      applyPaletteFilter();
      updateURL();
    }
    function renderChips() {
      chipsEl.innerHTML = "";
      palette.forEach(function(c, i) {
        var chip = document.createElement("span");
        chip.className = "hex-chip";
        chip.innerHTML = '<span class="hex-chip-swatch" style="background:' + c.hex + ';"></span><span>' + c.hex + '</span><button class="hex-chip-remove" data-idx="' + i + '">&times;</button>';
        chipsEl.appendChild(chip);
      });
    }
    chipsEl.addEventListener("click", function(e) {
      var btn = e.target.closest(".hex-chip-remove");
      if (btn) removeColor(parseInt(btn.dataset.idx, 10));
    });
    addBtn.addEventListener("click", function() {
      addColor(inputEl.value || pickerEl.value);
    });
    inputEl.addEventListener("keydown", function(e) {
      if (e.key === "Enter") addColor(inputEl.value || pickerEl.value);
    });
    function clearNamedSwatches() {
      var btns = document.querySelectorAll(".color-swatch-btn");
      btns.forEach(function(b) {
        b.classList.remove("active");
      });
      var allBtn = document.querySelector('.color-swatch-btn[data-color="all"]');
      if (allBtn) allBtn.classList.add("active");
      STATE._colorFilter = "all";
    }
    var THRESHOLD = 18;
    function applyPaletteFilter() {
      STATE._hexPalette = palette.length ? palette.slice() : null;
      if (palette.length) clearNamedSwatches();
      if (typeof refilterResults === "function") refilterResults();
    }
    function updateURL() {
      if (!window.history || !window.history.replaceState) return;
      var url = new URL(window.location);
      if (palette.length) {
        url.searchParams.set("palette", palette.map(function(c) {
          return c.hex.slice(1);
        }).join("-"));
      } else {
        url.searchParams.delete("palette");
      }
      window.history.replaceState(null, "", url);
    }
    function loadFromURL() {
      try {
        var p = new URLSearchParams(window.location.search).get("palette");
        if (!p) return;
        p.split("-").forEach(function(h) {
          addColor("#" + h);
        });
      } catch (_) {
      }
    }
    window._hexPaletteMatch = function(item) {
      if (!STATE._hexPalette || !STATE._hexPalette.length) return true;
      var colors = item._topColors;
      if (!colors || !colors.length) {
        if (!item._avgRGB) return false;
        colors = [{ r: item._avgRGB[0], g: item._avgRGB[1], b: item._avgRGB[2] }];
      }
      for (var i = 0; i < STATE._hexPalette.length; i++) {
        var pLab = rgbToLab(STATE._hexPalette[i].rgb[0], STATE._hexPalette[i].rgb[1], STATE._hexPalette[i].rgb[2]);
        for (var j = 0; j < colors.length; j++) {
          var cLab = rgbToLab(colors[j].r, colors[j].g, colors[j].b);
          if (deltaE00(pLab, cLab) <= THRESHOLD) return true;
        }
      }
      return false;
    };
    loadFromURL();
  })();
  (function initTaxonomyBrowse() {
    var TAXONOMY = [
      { name: "movements", tags: [
        { label: "renaissance", query: "renaissance painting" },
        { label: "baroque", query: "baroque art painting" },
        { label: "rococo", query: "rococo ornamental painting" },
        { label: "romanticism", query: "romanticism painting" },
        { label: "impressionism", query: "impressionist painting" },
        { label: "post-impressionism", query: "post-impressionist art" },
        { label: "art nouveau", query: "art nouveau design" },
        { label: "art deco", query: "art deco design" },
        { label: "expressionism", query: "expressionist art painting" },
        { label: "cubism", query: "cubist art painting" },
        { label: "surrealism", query: "surrealist art" },
        { label: "abstract", query: "abstract art painting" },
        { label: "minimalism", query: "minimalist art" },
        { label: "pop art", query: "pop art" }
      ] },
      { name: "genres", tags: [
        { label: "portrait", query: "portrait painting" },
        { label: "landscape", query: "landscape painting" },
        { label: "still life", query: "still life painting" },
        { label: "history painting", query: "history painting" },
        { label: "genre scene", query: "genre painting daily life" },
        { label: "religious", query: "religious art sacred painting" },
        { label: "mythology", query: "mythological painting" },
        { label: "nude", query: "nude figure painting" },
        { label: "marine", query: "marine painting seascape" },
        { label: "vanitas", query: "vanitas still life memento mori" }
      ] },
      { name: "media", tags: [
        { label: "oil painting", query: "oil painting canvas" },
        { label: "watercolor", query: "watercolor painting" },
        { label: "fresco", query: "fresco mural painting" },
        { label: "etching", query: "etching print" },
        { label: "lithograph", query: "lithograph print" },
        { label: "woodcut", query: "woodcut print" },
        { label: "engraving", query: "engraving print" },
        { label: "drawing", query: "drawing charcoal pencil" },
        { label: "pastel", query: "pastel drawing painting" },
        { label: "mosaic", query: "mosaic tile art" },
        { label: "tapestry", query: "tapestry weaving textile" },
        { label: "photograph", query: "photograph vintage" }
      ] },
      { name: "periods", tags: [
        { label: "ancient", query: "ancient art antiquity" },
        { label: "medieval", query: "medieval art" },
        { label: "15th century", query: "15th century art 1400s" },
        { label: "16th century", query: "16th century art 1500s" },
        { label: "17th century", query: "17th century art 1600s" },
        { label: "18th century", query: "18th century art 1700s" },
        { label: "19th century", query: "19th century art 1800s" },
        { label: "early 20th c.", query: "20th century early modern art" },
        { label: "contemporary", query: "contemporary art modern" }
      ] },
      { name: "regions", tags: [
        { label: "italian", query: "italian art painting" },
        { label: "dutch & flemish", query: "dutch flemish painting" },
        { label: "french", query: "french art painting" },
        { label: "spanish", query: "spanish art painting" },
        { label: "german", query: "german art painting" },
        { label: "british", query: "british art painting" },
        { label: "japanese", query: "japanese art ukiyo-e" },
        { label: "chinese", query: "chinese art painting" },
        { label: "islamic", query: "islamic art calligraphy" },
        { label: "african", query: "african art sculpture" },
        { label: "pre-columbian", query: "pre-columbian mesoamerican art" }
      ] }
    ];
    var tree = document.getElementById("taxonomy-tree");
    if (!tree) return;
    TAXONOMY.forEach(function(group) {
      var div = document.createElement("div");
      div.className = "taxonomy-group";
      var tagsHTML = group.tags.map(function(t) {
        return '<button class="taxonomy-tag" data-query="' + t.query.replace(/"/g, "&quot;") + '">' + t.label + "</button>";
      }).join("");
      div.innerHTML = '<button class="taxonomy-group-header"><span>' + group.name + '</span><span class="taxonomy-group-arrow">\u25B6</span></button><div class="taxonomy-group-body">' + tagsHTML + "</div>";
      tree.appendChild(div);
    });
    tree.addEventListener("click", function(e) {
      var header = e.target.closest(".taxonomy-group-header");
      if (header) {
        header.parentElement.classList.toggle("open");
        return;
      }
      var tag = e.target.closest(".taxonomy-tag");
      if (tag && tag.dataset.query) {
        document.getElementById("search-input").value = tag.dataset.query;
        runSearch(tag.dataset.query);
      }
    });
  })();
  (function initArtistEntity() {
    var _wikiCache = {};
    function extractArtist(item) {
      if (!item || !item.description) return null;
      var parts = item.description.split(/\s[\u2014\u2013\-]\s/);
      var name = (parts[0] || "").trim();
      if (!name || name.length < 3 || /^\d{4}/.test(name) || /^(oil|watercolor|photograph|drawing|etching|lithograph|engraving|pastel|ink|tempera|fresco)/i.test(name)) return null;
      if (/unknown|anonymous|unidentified|after\s|attributed|circle|school|workshop|manner|follower|studio/i.test(name)) return null;
      return name;
    }
    function getArtistWorks(artistName) {
      return STATE.results.filter(function(item) {
        return extractArtist(item) === artistName;
      });
    }
    function fetchWikidata2(name) {
      return new Promise(function(resolve) {
        var cached = _wikiCache[name];
        if (cached) {
          resolve(cached);
          return;
        }
        try {
          var s = sessionStorage.getItem("inspo_wiki_" + name);
          if (s) {
            _wikiCache[name] = JSON.parse(s);
            resolve(_wikiCache[name]);
            return;
          }
        } catch (_) {
        }
        var url = "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=" + encodeURIComponent(name) + "&language=en&limit=1&format=json&origin=*";
        fetch(url).then(function(r) {
          return r.json();
        }).then(function(data) {
          var entity = data.search && data.search[0];
          if (!entity) {
            resolve(null);
            return;
          }
          var qid = entity.id;
          var detailUrl = "https://www.wikidata.org/w/api.php?action=wbgetentities&ids=" + qid + "&props=claims|descriptions&languages=en&format=json&origin=*";
          return fetch(detailUrl).then(function(r2) {
            return r2.json();
          }).then(function(d2) {
            var ent = d2.entities && d2.entities[qid];
            if (!ent) {
              resolve(null);
              return;
            }
            var claims = ent.claims || {};
            var info = {
              description: ent.descriptions && ent.descriptions.en ? ent.descriptions.en.value : "",
              birth: claims.P569 && claims.P569[0] ? (claims.P569[0].mainsnak.datavalue && claims.P569[0].mainsnak.datavalue.value.time || "").slice(1, 5) : "",
              death: claims.P570 && claims.P570[0] ? (claims.P570[0].mainsnak.datavalue && claims.P570[0].mainsnak.datavalue.value.time || "").slice(1, 5) : ""
            };
            _wikiCache[name] = info;
            try {
              sessionStorage.setItem("inspo_wiki_" + name, JSON.stringify(info));
            } catch (_) {
            }
            resolve(info);
          });
        }).catch(function() {
          resolve(null);
        });
      });
    }
    function esc(s) {
      return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    }
    function openArtistPanel(artistName) {
      if (document.querySelector(".artist-overlay")) return;
      var works = getArtistWorks(artistName);
      var thumbsHTML = works.slice(0, 12).map(function(it) {
        return '<img class="artist-panel-thumb" src="' + esc(it.thumb || it.url) + '" alt="' + esc(it.title) + '" crossorigin="anonymous">';
      }).join("");
      var overlay = document.createElement("div");
      overlay.className = "artist-overlay";
      overlay.innerHTML = '<div class="artist-panel"><button class="artist-panel-close">&times;</button><div class="artist-panel-name">' + esc(artistName) + '</div><div class="artist-panel-meta" id="artist-meta">loading...</div><div class="artist-panel-works">' + thumbsHTML + '</div><button class="artist-panel-search">search all works by ' + esc(artistName) + "</button></div>";
      document.body.appendChild(overlay);
      overlay.querySelector(".artist-panel-close").addEventListener("click", function() {
        overlay.remove();
      });
      overlay.addEventListener("click", function(e) {
        if (e.target === overlay) overlay.remove();
      });
      overlay.querySelector(".artist-panel-search").addEventListener("click", function() {
        overlay.remove();
        document.getElementById("search-input").value = artistName;
        runSearch(artistName);
      });
      fetchWikidata2(artistName).then(function(info) {
        var meta = document.getElementById("artist-meta");
        if (!meta) return;
        if (!info) {
          meta.textContent = works.length + " works in results";
          return;
        }
        var parts = [];
        if (info.description) parts.push(info.description);
        if (info.birth) parts.push((info.birth || "?") + " \u2013 " + (info.death || "present"));
        parts.push(works.length + " works in results");
        meta.textContent = parts.join(" \xB7 ");
      });
    }
    var grid = document.getElementById("image-grid");
    if (!grid) return;
    grid.addEventListener("dblclick", function(e) {
      var card = e.target.closest(".image-card");
      if (!card) return;
      var item = _gridItemMap.get(card.dataset.id);
      if (!item) return;
      var artist = extractArtist(item);
      if (artist) openArtistPanel(artist);
    });
    window._extractArtist = extractArtist;
    window._openArtistPanel = openArtistPanel;
  })();
  (function initVisualSimilarity() {
    function rgbToLab2(r, g, b) {
      var rl = r / 255, gl = g / 255, bl = b / 255;
      rl = rl > 0.04045 ? Math.pow((rl + 0.055) / 1.055, 2.4) : rl / 12.92;
      gl = gl > 0.04045 ? Math.pow((gl + 0.055) / 1.055, 2.4) : gl / 12.92;
      bl = bl > 0.04045 ? Math.pow((bl + 0.055) / 1.055, 2.4) : bl / 12.92;
      var x = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / 0.95047;
      var y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.072175;
      var z = (rl * 0.0193339 + gl * 0.119192 + bl * 0.9503041) / 1.08883;
      var fx = x > 8856e-6 ? Math.cbrt(x) : 7.787 * x + 16 / 116;
      var fy = y > 8856e-6 ? Math.cbrt(y) : 7.787 * y + 16 / 116;
      var fz = z > 8856e-6 ? Math.cbrt(z) : 7.787 * z + 16 / 116;
      return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
    }
    function deltaE(rgb1, rgb2) {
      var lab1 = rgbToLab2(rgb1[0], rgb1[1], rgb1[2]);
      var lab2 = rgbToLab2(rgb2[0], rgb2[1], rgb2[2]);
      return Math.sqrt(
        Math.pow(lab1[0] - lab2[0], 2) + Math.pow(lab1[1] - lab2[1], 2) + Math.pow(lab1[2] - lab2[2], 2)
      );
    }
    function tagOverlap(tagsA, tagsB) {
      if (!tagsA || !tagsB || !tagsA.length || !tagsB.length) return 0;
      var setA = new Set(tagsA);
      var inter = 0;
      for (var i = 0; i < tagsB.length; i++) {
        if (setA.has(tagsB[i])) inter++;
      }
      var union = new Set(tagsA.concat(tagsB)).size;
      return union ? inter / union : 0;
    }
    function similarity(refItem, item) {
      var colorScore = 0;
      if (refItem._avgRGB && item._avgRGB) {
        var de = deltaE(refItem._avgRGB, item._avgRGB);
        colorScore = Math.max(0, 1 - de / 100);
      }
      var tagScore = tagOverlap(refItem.tags, item.tags);
      var aspectScore = refItem._aspect && item._aspect && refItem._aspect === item._aspect ? 1 : 0;
      return colorScore * 0.5 + tagScore * 0.35 + aspectScore * 0.15;
    }
    function moreLikeThis(refItem) {
      if (!refItem || !STATE.results.length) return;
      var scored = STATE.results.filter(function(it) {
        return it.id !== refItem.id;
      }).map(function(it) {
        return { item: it, score: similarity(refItem, it) };
      }).sort(function(a, b) {
        return b.score - a.score;
      });
      clearGrid();
      var grid = document.getElementById("image-grid");
      var banner = document.createElement("div");
      banner.className = "sim-banner";
      banner.innerHTML = "<span>showing results similar to: <strong>" + (refItem.title || "untitled").replace(/</g, "&lt;") + '</strong></span><button class="sim-banner-close" title="clear">&times;</button>';
      grid.appendChild(banner);
      banner.querySelector(".sim-banner-close").addEventListener("click", function() {
        clearGrid();
        renderGrid(getDisplayResults(STATE.results, STATE.query));
      });
      var items = scored.map(function(s) {
        return s.item;
      });
      renderGrid(items);
    }
    document.getElementById("image-grid").addEventListener("click", function(e) {
      var btn = e.target.closest(".sim-btn");
      if (!btn) return;
      e.stopPropagation();
      var card = btn.closest(".image-card");
      if (!card) return;
      var item = _gridItemMap.get(card.dataset.id);
      if (item) moreLikeThis(item);
    });
  })();
  (function initStories() {
    var STORIES = [
      {
        id: "dutch-light",
        title: "The Science of Dutch Light",
        intro: "How 17th-century Dutch painters captured light that still feels alive today.",
        searches: [
          { label: "vermeer interiors", query: "vermeer interior light" },
          { label: "rembrandt chiaroscuro", query: "rembrandt chiaroscuro shadow" },
          { label: "dutch still life", query: "dutch golden age still life" }
        ]
      },
      {
        id: "pattern-nature",
        title: "Patterns in Nature",
        intro: "From spiral shells to fractal ferns \u2014 how artists recorded the geometry of the natural world.",
        searches: [
          { label: "botanical illustration", query: "botanical illustration scientific" },
          { label: "shells & specimens", query: "shell specimen natural history" },
          { label: "ernst haeckel", query: "haeckel kunstformen natur" }
        ]
      },
      {
        id: "gold-sacred",
        title: "Gold & the Sacred",
        intro: "The use of gold leaf from Byzantine icons to Klimt \u2014 when material becomes meaning.",
        searches: [
          { label: "byzantine icons", query: "byzantine icon gold" },
          { label: "illuminated manuscripts", query: "illuminated manuscript gold leaf" },
          { label: "klimt gold", query: "klimt gold painting" }
        ]
      },
      {
        id: "map-edge",
        title: "At the Edge of the Map",
        intro: "Sea monsters, terra incognita, and the art of mapping the unknown.",
        searches: [
          { label: "antique maps", query: "antique map world cartography" },
          { label: "sea monsters", query: "sea monster map illustration" },
          { label: "celestial charts", query: "celestial chart constellation map" }
        ]
      },
      {
        id: "color-blue",
        title: "The Invention of Blue",
        intro: "From ultramarine to Prussian blue \u2014 the expensive, rare, and sometimes accidental history of a color.",
        searches: [
          { label: "ultramarine paintings", query: "ultramarine blue painting" },
          { label: "delftware", query: "delft blue porcelain" },
          { label: "cyanotype", query: "cyanotype blueprint photograph" }
        ]
      },
      {
        id: "body-motion",
        title: "The Body in Motion",
        intro: "From Greek athletes to Degas dancers \u2014 capturing movement in stillness.",
        searches: [
          { label: "greek sculpture", query: "greek sculpture athlete" },
          { label: "degas dancers", query: "degas dancer ballet" },
          { label: "muybridge motion", query: "muybridge motion photograph" }
        ]
      },
      {
        id: "print-revolution",
        title: "The Print Revolution",
        intro: "How woodcuts, etchings, and lithographs democratized images before photography.",
        searches: [
          { label: "d\xFCrer woodcuts", query: "durer woodcut print" },
          { label: "hokusai prints", query: "hokusai ukiyo-e woodblock" },
          { label: "goya etchings", query: "goya etching caprichos" }
        ]
      },
      {
        id: "garden-paradise",
        title: "The Garden as Paradise",
        intro: "Walled gardens, pleasure grounds, and painted edens across cultures.",
        searches: [
          { label: "persian gardens", query: "persian garden miniature painting" },
          { label: "monet giverny", query: "monet garden water lilies giverny" },
          { label: "botanical gardens", query: "botanical garden illustration" }
        ]
      },
      {
        id: "textile-world",
        title: "Woven Worlds",
        intro: "Tapestries, silks, and embroideries that tell stories thread by thread.",
        searches: [
          { label: "medieval tapestry", query: "medieval tapestry unicorn" },
          { label: "japanese textiles", query: "japanese kimono textile pattern" },
          { label: "william morris", query: "william morris textile design pattern" }
        ]
      },
      {
        id: "night-sky",
        title: "Under the Night Sky",
        intro: "How artists painted darkness, stars, and the mystery between dusk and dawn.",
        searches: [
          { label: "nocturne paintings", query: "nocturne night painting" },
          { label: "starry skies", query: "star night sky painting" },
          { label: "moon illustrations", query: "moon illustration astronomy" }
        ]
      }
    ];
    function esc(s) {
      return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    }
    function openStory(story) {
      if (document.getElementById("story-overlay")) return;
      var searchBtns = story.searches.map(function(s) {
        return '<button class="story-search-btn" data-query="' + esc(s.query) + '">' + esc(s.label) + " \u2192</button>";
      }).join("");
      var overlay = document.createElement("div");
      overlay.id = "story-overlay";
      overlay.className = "story-overlay";
      overlay.innerHTML = '<div class="story-reader"><button class="story-close">&times;</button><div class="story-reader-title">' + esc(story.title) + '</div><div class="story-reader-intro">' + esc(story.intro) + '</div><div class="story-reader-label">search this story</div><div class="story-reader-searches">' + searchBtns + "</div></div>";
      document.body.appendChild(overlay);
      overlay.querySelector(".story-close").addEventListener("click", function() {
        overlay.remove();
      });
      overlay.addEventListener("click", function(e) {
        if (e.target === overlay) overlay.remove();
      });
      overlay.querySelectorAll(".story-search-btn").forEach(function(btn) {
        btn.addEventListener("click", function() {
          overlay.remove();
          document.getElementById("search-input").value = btn.dataset.query;
          runSearch(btn.dataset.query);
        });
      });
    }
    var chatSection = document.getElementById("btn-ai-chat");
    if (chatSection) {
      var storiesBtn = document.createElement("button");
      storiesBtn.className = "btn";
      storiesBtn.id = "btn-stories";
      storiesBtn.textContent = "\u270E stories";
      storiesBtn.style.marginTop = "4px";
      chatSection.parentElement.appendChild(storiesBtn);
      storiesBtn.addEventListener("click", function() {
        openStoriesList();
      });
    }
    function openStoriesList() {
      if (document.getElementById("stories-list-overlay")) return;
      var cardsHTML = STORIES.map(function(s) {
        return '<button class="stories-list-card" data-sid="' + s.id + '"><div class="stories-list-title">' + esc(s.title) + '</div><div class="stories-list-intro">' + esc(s.intro) + "</div></button>";
      }).join("");
      var overlay = document.createElement("div");
      overlay.id = "stories-list-overlay";
      overlay.className = "story-overlay";
      overlay.innerHTML = '<div class="stories-list-panel"><button class="story-close">&times;</button><div class="stories-list-heading">stories</div><div class="stories-list-grid">' + cardsHTML + "</div></div>";
      document.body.appendChild(overlay);
      overlay.querySelector(".story-close").addEventListener("click", function() {
        overlay.remove();
      });
      overlay.addEventListener("click", function(e) {
        if (e.target === overlay) overlay.remove();
      });
      overlay.querySelectorAll(".stories-list-card").forEach(function(card) {
        card.addEventListener("click", function() {
          overlay.remove();
          var story = STORIES.find(function(s) {
            return s.id === card.dataset.sid;
          });
          if (story) openStory(story);
        });
      });
    }
    window._inspoStories = STORIES;
    window._openStory = openStory;
  })();
  (function initDynamicSEO() {
    var DEFAULT_TITLE = "insposearch";
    var DEFAULT_DESC = "Search 521+ museum, archive, and photo sources for creative inspiration.";
    function updateMeta(name, content) {
      var el = document.querySelector('meta[property="' + name + '"]') || document.querySelector('meta[name="' + name + '"]');
      if (el) el.setAttribute("content", content);
    }
    function setSearchMeta(query) {
      var title = query + " \u2014 insposearch";
      var desc = 'Search results for "' + query + '" across 521+ cultural heritage sources.';
      document.title = title;
      updateMeta("description", desc);
      updateMeta("og:title", title);
      updateMeta("og:description", desc);
      updateMeta("twitter:title", title);
      updateMeta("twitter:description", desc);
    }
    function resetMeta() {
      document.title = DEFAULT_TITLE;
      updateMeta("description", DEFAULT_DESC);
      updateMeta("og:title", DEFAULT_TITLE);
      updateMeta("og:description", DEFAULT_DESC);
      updateMeta("twitter:title", DEFAULT_TITLE);
      updateMeta("twitter:description", DEFAULT_DESC);
    }
    var _origRunSearch = runSearch;
    runSearch = async function(query, forceRefresh) {
      setSearchMeta(query.trim());
      return _origRunSearch.call(this, query, forceRefresh);
    };
    window.runSearch = runSearch;
    document.querySelector(".logo").addEventListener("click", resetMeta);
  })();
  (function initVirtualScroll() {
    const OFFSCREEN_MARGIN = "2000px";
    const _cardCache = /* @__PURE__ */ new Map();
    const virtualObs = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const card = entry.target;
        if (!card.classList.contains("image-card")) continue;
        const id = card.dataset.id;
        if (!id) continue;
        if (!entry.isIntersecting && !card.classList.contains("v-placeholder")) {
          const h = card.offsetHeight;
          const frag = document.createDocumentFragment();
          while (card.firstChild) frag.appendChild(card.firstChild);
          _cardCache.set(id, frag);
          card.classList.add("v-placeholder");
          card.style.minHeight = h + "px";
        } else if (entry.isIntersecting && card.classList.contains("v-placeholder")) {
          const frag = _cardCache.get(id);
          if (frag) {
            card.appendChild(frag);
            _cardCache.delete(id);
            card.classList.remove("v-placeholder");
            card.style.minHeight = "";
          }
        }
      }
    }, { rootMargin: OFFSCREEN_MARGIN });
    const grid = document.getElementById("image-grid");
    const gridMO = new MutationObserver((mutations) => {
      for (const mut of mutations) {
        for (const node of mut.addedNodes) {
          if (node.nodeType === 1 && node.classList.contains("image-card")) {
            virtualObs.observe(node);
          }
          if (node.nodeType === 1) {
            node.querySelectorAll && node.querySelectorAll(".image-card").forEach((c) => virtualObs.observe(c));
          }
        }
      }
    });
    gridMO.observe(grid, { childList: true });
  })();
  (function initSearchAsYouType() {
    const input = document.getElementById("search-input");
    let _saytTimer = null;
    input.addEventListener("input", () => {
      clearTimeout(_saytTimer);
      const q = input.value.trim();
      if (q.length < 3) return;
      _saytTimer = setTimeout(() => {
        renderSearchHistory(q);
      }, 300);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        clearTimeout(_saytTimer);
      }
    });
  })();
  (function initAdvancedSearch() {
    var overlay = document.getElementById("adv-search-overlay");
    var openBtn = document.getElementById("btn-advanced-search");
    if (!overlay || !openBtn) return;
    var panel = overlay.querySelector(".adv-panel");
    var closeBtn = document.getElementById("adv-close");
    var resetBtn = document.getElementById("adv-reset");
    var runBtn = document.getElementById("adv-run");
    var qInput = document.getElementById("adv-query");
    var dateFromEl = document.getElementById("adv-date-from");
    var dateToEl = document.getElementById("adv-date-to");
    var mediumEl = document.getElementById("adv-medium");
    var orientEl = document.getElementById("adv-orient");
    var regionEl = document.getElementById("adv-region");
    var categoryEl = document.getElementById("adv-category");
    var excludeEl = document.getElementById("adv-exclude");
    var colorEnEl = document.getElementById("adv-color-enable");
    var colorEl = document.getElementById("adv-color");
    function open() {
      var q = document.getElementById("search-input").value.trim();
      if (qInput) qInput.value = q;
      overlay.style.display = "block";
      setTimeout(function() {
        if (qInput) qInput.focus();
      }, 250);
    }
    function close() {
      overlay.style.display = "none";
    }
    openBtn.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", function(e) {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape" && overlay.style.display === "block") close();
    });
    resetBtn.addEventListener("click", function() {
      if (qInput) qInput.value = "";
      if (dateFromEl) dateFromEl.value = "";
      if (dateToEl) dateToEl.value = "";
      if (mediumEl) mediumEl.value = "";
      if (orientEl) orientEl.value = "";
      if (regionEl) regionEl.value = "";
      if (categoryEl) categoryEl.value = "";
      if (excludeEl) excludeEl.value = "";
      if (colorEnEl) colorEnEl.checked = false;
      STATE._dateFilter = null;
      STATE._aspectFilter = null;
    });
    overlay.addEventListener("keydown", function(e) {
      if (e.key === "Enter" && e.target.matches(".adv-input")) {
        e.preventDefault();
        runBtn.click();
      }
    });
    runBtn.addEventListener("click", function() {
      var query = (qInput ? qInput.value : "").trim();
      var medium = mediumEl ? mediumEl.value : "";
      var exclude = (excludeEl ? excludeEl.value : "").trim();
      var dateFrom = dateFromEl ? dateFromEl.value : "";
      var dateTo = dateToEl ? dateToEl.value : "";
      var region = regionEl ? regionEl.value : "";
      var category = categoryEl ? categoryEl.value : "";
      var orient = orientEl ? orientEl.value : "";
      var colorEn = colorEnEl ? colorEnEl.checked : false;
      var color = colorEl ? colorEl.value : "";
      var parts = [];
      if (query) parts.push(query);
      if (medium) parts.push(medium);
      var compositeQuery = parts.join(" ");
      if (exclude) {
        exclude.split(/[\s,]+/).filter(Boolean).forEach(function(t) {
          compositeQuery += " NOT " + t;
        });
      }
      if (!compositeQuery) {
        if (qInput) {
          qInput.style.borderColor = "#c0392b";
          setTimeout(function() {
            qInput.style.borderColor = "";
          }, 1200);
        }
        return;
      }
      if (category && SOURCE_GROUPS[category]) {
        var groupSet = new Set(SOURCE_GROUPS[category]);
        ALL_SOURCES.forEach(function(sid) {
          if (groupSet.has(sid)) {
            STATE.disabledSources.delete(sid);
          } else {
            STATE.disabledSources.add(sid);
          }
        });
        if (typeof updateSourcesActiveCounter === "function") updateSourcesActiveCounter();
      }
      if (region) {
        ALL_SOURCES.forEach(function(sid) {
          var meta = SOURCE_META[sid];
          if (meta && meta.region === region) {
            STATE.disabledSources.delete(sid);
          } else if (meta && meta.region !== region) {
            STATE.disabledSources.add(sid);
          }
        });
        if (typeof updateSourcesActiveCounter === "function") updateSourcesActiveCounter();
      }
      if (dateFrom || dateTo) {
        STATE._dateFilter = {
          from: parseInt(dateFrom, 10) || 0,
          to: parseInt(dateTo, 10) || 9999
        };
      } else {
        STATE._dateFilter = null;
      }
      STATE._aspectFilter = orient || null;
      if (colorEn && color) {
        var hInput = document.getElementById("hex-input");
        var hAdd = document.getElementById("hex-add-btn");
        if (hInput && hAdd) {
          hInput.value = color;
          hAdd.click();
        }
      }
      document.getElementById("search-input").value = compositeQuery;
      close();
      runSearch(compositeQuery);
    });
  })();
  (function initPanelArtistButton() {
    var section = document.getElementById("panel-artist-section");
    var btn = document.getElementById("btn-panel-artist");
    if (!section || !btn) return;
    var _currentArtist = null;
    btn.addEventListener("click", function() {
      if (_currentArtist && window._openArtistPanel) {
        window._openArtistPanel(_currentArtist);
      }
    });
    var _origUpdatePanel = window.updatePanel || updatePanel;
    var _patchedUpdatePanel = async function(previewItem) {
      await _origUpdatePanel.apply(this, arguments);
      _currentArtist = null;
      var displayItems = previewItem ? [previewItem] : STATE.selected;
      if (displayItems.length && window._extractArtist) {
        var last = displayItems[displayItems.length - 1];
        _currentArtist = window._extractArtist(last);
      }
      if (_currentArtist) {
        section.style.display = "";
        btn.textContent = "view artist \u2014 " + _currentArtist;
      } else {
        section.style.display = "none";
      }
    };
    if (typeof updatePanel === "function") {
      window.updatePanel = _patchedUpdatePanel;
      updatePanel = _patchedUpdatePanel;
    }
  })();
  (function initSourceHealthIndicator() {
    var el = document.getElementById("sources-health-indicator");
    if (!el) return;
    function update() {
      var unhealthy = 0;
      var names = [];
      ALL_SOURCES.forEach(function(id) {
        if (!isSourceHealthy(id) && !STATE.disabledSources.has(id)) {
          unhealthy++;
          var meta = SOURCE_META[id];
          if (meta && meta.name && names.length < 5) names.push(meta.name);
        }
      });
      if (unhealthy > 0) {
        el.style.display = "";
        el.textContent = unhealthy + " source" + (unhealthy > 1 ? "s" : "") + " temporarily paused";
        el.title = names.length ? names.join(", ") + (unhealthy > names.length ? " + more" : "") : "";
      } else {
        el.style.display = "none";
      }
    }
    el.addEventListener("click", function() {
      try {
        sessionStorage.removeItem("inspo_source_health");
      } catch (_) {
      }
      ALL_SOURCES.forEach(function(id) {
        STATE.sourceHealth[id] = { misses: 0, hits: 0, _notified: false };
      });
      update();
      updateSourcesActiveCounter();
    });
    var _origCounter = _updateSourcesActiveCounterImmediate;
    set_updateSourcesActiveCounterImmediate(function() {
      _origCounter();
      update();
    });
    update();
  })();

  // src/main.js
  console.log("[InspoSearch] modular build loaded");
})();
//# sourceMappingURL=app.js.map
