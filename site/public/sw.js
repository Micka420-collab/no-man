/* Service worker de l'Atlas Terminal.
   - Coquille de l'app (HTML, JS/CSS hachés, assets) : cache-first avec mise à jour en fond —
     les fichiers de build sont hachés, donc immuables, le cache ne peut pas servir du périmé.
   - Données JSON : réseau d'abord (fraîcheur), repli sur le cache hors-ligne.
   - Navigation : réseau d'abord, repli sur l'index en cache.
   Même stratégie que le site d'origine : quasi instantané en visite répétée, utilisable
   hors-ligne, sans jamais bloquer sur une version périmée. */
const VERSION = "atlas-v1";
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./favicon.svg",
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isData(url) {
  return url.pathname.includes("/data/") && url.pathname.endsWith(".json");
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Navigation (pages) : réseau d'abord, repli sur l'index en cache hors-ligne.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).catch(() => caches.match("./index.html").then(r => r || caches.match("./")))
    );
    return;
  }

  // Données : réseau d'abord, on met en cache la copie fraîche, repli sur le cache.
  if (isData(url)) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Reste (JS/CSS hachés, images, polices) : cache d'abord, sinon réseau puis mise en cache.
  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res && (res.ok || res.type === "opaque")) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
