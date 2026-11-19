// Handball DT: funciona sin internet una vez instalada.
// El juego (index.html) se busca primero en internet para que las actualizaciones aparezcan apenas abrís la app;
// si no hay conexión, se usa la última versión guardada.
const CACHE = "handball-dt-v2";
const FILES = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-maskable-192.png", "./icon-maskable-512.png", "./apple-touch-icon.png", "./favicon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const page = e.request.mode === "navigate" || /\/(index\.html)?$/.test(new URL(e.request.url).pathname);
  e.respondWith(caches.open(CACHE).then(async c => {
    if (page) {
      try {
        const r = await Promise.race([fetch(e.request, { cache: "no-store" }), new Promise((_, rej) => setTimeout(() => rej(), 4000))]);
        if (r && r.ok) { c.put("./index.html", r.clone()); return r; }
      } catch (err) { }
      return (await c.match("./index.html")) || (await c.match(e.request)) || fetch(e.request);
    }
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r && (r.ok || r.type === "opaque")) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
