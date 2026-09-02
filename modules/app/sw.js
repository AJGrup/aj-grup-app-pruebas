/* App AJ Finances · lo justo para que abra sin cobertura.
   Guarda el armazón y sus scripts; los datos ya viven en el almacén local, así
   que con esto la app arranca dentro de un piso sin red — que es la mitad de
   lo que se diseñó. */
var CACHE = 'aj-app-v36';
var BASE = ['./aj-app.html','./app-datos.js','./app-inicio.js','./app-agenda.js','./app-cliente.js','./app-capturar.js','./app-escaner.js','./app-buscar.js','./app-mas.js','./app-cuadre.js','./app-login.js','./app-shell.js',
            './icono-192.png','./icono-512.png','./apple-touch-icon.png','./manifest.webmanifest',
            '../../shared/aj-core.js','../../shared/aj-finanzas.js','../../shared/supabase-config.js',
            '../../shared/aj-remote.js','../../shared/aj-sync.js'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(BASE); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (k) {
    return Promise.all(k.filter(function (x) { return x !== CACHE; }).map(function (x) { return caches.delete(x); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  /* Nunca se cachea Supabase: un dato viejo servido como bueno es peor que un
     error honesto. */
  if (/supabase\.co/.test(e.request.url)) return;
  e.respondWith(
    fetch(e.request).then(function (r) {
      var copia = r.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copia); });
      return r;
    }).catch(function () { return caches.match(e.request); })
  );
});
