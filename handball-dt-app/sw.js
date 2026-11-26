// Handball DT: funciona sin internet una vez instalada.
// El juego abre siempre al instante con la versión guardada. En segundo plano busca si hay una nueva;
// si la encuentra, la guarda y avisa con un cartel "Actualizar".
const CACHE = "handball-dt-v3";
const FILES = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-maskable-192.png", "./icon-maskable-512.png", "./apple-touch-icon.png", "./favicon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).catch(() => {})); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
async function refreshPage(c) {
  try {
    const r = await Promise.race([fetch("./index.html", { cache: "no-store" }), new Promise((_, rej) => setTimeout(rej, 15000))]);
    if (!r || !r.ok) return;
    const old = await c.match("./index.html"), nt = await r.clone().text(), ot = old ? await old.text() : "";
    if (nt && nt !== ot) {
      await c.put("./index.html", r.clone());
      if (ot) (await self.clients.matchAll()).forEach(cl => cl.postMessage({ type: "update" }));
    }
  } catch (err) { }
}
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  const page = e.request.mode === "navigate" || /\/(index\.html)?$/.test(url.pathname);
  e.respondWith(caches.open(CACHE).then(async c => {
    if (page) {
      const hit = await c.match("./index.html");
      if (hit) { e.waitUntil(refreshPage(c)); return hit; }
      try { const r = await fetch(e.request); if (r.ok) c.put("./index.html", r.clone()); return r; } catch (err) { return new Response("Sin conexión: abrí el juego una vez con internet para instalarlo.", { headers: { "Content-Type": "text/plain; charset=utf-8" } }); }
    }
    const hit = await c.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    try { const r = await fetch(e.request); if (r && r.ok) c.put(e.request, r.clone()); return r; } catch (err) { return new Response("", { status: 504 }); }
  }));
});
