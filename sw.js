const CACHE = "latecomer-pwa-v1";
const ASSETS = ["./","./index.html","./app.js","./manifest.json","https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  if (e.request.url.includes("script.google.com")) return; // GAS network-only
  e.respondWith(
    caches.match(e.request).then(cached=>cached || fetch(e.request).then(resp=>{caches.open(CACHE).then(c=>c.put(e.request,resp.clone())); return resp;})).catch(()=>cached)
  );
});
