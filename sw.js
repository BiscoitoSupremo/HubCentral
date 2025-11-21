const CACHE_NAME = 'hubcentral-v1';

// Se quiser, adicione mais arquivos/páginas principais da sua aplicação
const URLS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './icons/icon-192.png',
  './icons/icon-512.png',

  // Páginas/pastas específicas
  './diario/diario.html',
  './diario/diario.css',
  './diario/diario.js',
  './icons/icon-192.png',
  './icons/icon-512.png',

//   teste com outras páginas a mais

  './SP/sites.html',
  './SP/sites.css',
  './SP/sites.js',
  './icons/icon-192.png',
  './icons/icon-512.png',

//   próximo

  './Sites/sites.html',
  './Sites/sites.css',
  './Sites/sites.js',
  './icons/icon-192.png',
  './icons/icon-512.png',

// próximo

'./OP/sites.html',
  './OP/sites.css',
  './OP/sites.js',
  './icons/icon-192.png',
  './icons/icon-512.png',

//   próximo

'./EOK/sites.html',
  './EOK/sites.css',
  './EOK/sites.js',
  './icons/icon-192.png',
  './icons/icon-512.png',

//   próximo

'./ATALHOS/sites.html',
  './ATALHOS/sites.css',
  './ATALHOS/sites.js',
  './icons/icon-192.png',
  './icons/icon-512.png',

//   próximo

'./arquivos/index.html',
  './arquivos/Arquivos.css',
  './arquivos/Arquivos.js',
  './icons/icon-192.png',
  './icons/icon-512.png',

// último

'./album/album.html',
  './album/album.css',
  './album/album.js',
  './icons/icon-192.png',
  './icons/icon-512.png',

];

self.addEventListener('install', event => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Fazendo cache inicial');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then(networkResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // Se quiser, dá pra retornar uma página offline aqui:
          // return caches.match('./offline.html');
          return new Response(
            'Sem conexão e sem cache dessa página ainda 😅',
            { status: 503, statusText: 'Offline' }
          );
        });
    })
  );
});
