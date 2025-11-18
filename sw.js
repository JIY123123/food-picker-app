const CACHE_NAME = 'food-picker-v1.5.1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/db.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// 安裝 Service Worker
self.addEventListener('install', event => {
    console.log('🔧 Service Worker 安裝中...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('✅ 快取已開啟，開始快取核心資源');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('✅ 核心資源快取完成，跳過等待');
                return self.skipWaiting();
            })
            .catch(error => {
                console.log('❌ Service Worker 安裝失敗:', error);
            })
    );
});

// 激活 Service Worker
self.addEventListener('activate', event => {
    console.log('🔄 Service Worker 激活中...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ 刪除舊快取:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✅ Service Worker 激活完成，聲明客戶端');
            return self.clients.claim();
        })
    );
});

// 攔截請求
self.addEventListener('fetch', event => {
    // 跳過非 GET 請求
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 如果有快取則返回快取
                if (response) {
                    console.log('📦 從快取返回:', event.request.url);
                    return response;
                }

                // 否則發送網路請求
                return fetch(event.request)
                    .then(response => {
                        // 只快取成功的同源請求
                        if (response && response.status === 200 && 
                            response.type === 'basic' &&
                            event.request.url.startsWith(self.location.origin)) {
                            
                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                    console.log('💾 新增到快取:', event.request.url);
                                });
                        }
                        return response;
                    })
                    .catch(error => {
                        console.log('❌ 網路請求失敗:', error);
                        
                        // 對於 HTML 請求，返回快取的 index.html
                        if (event.request.destination === 'document' || 
                            (event.request.headers.get('accept') && 
                             event.request.headers.get('accept').includes('text/html'))) {
                            return caches.match('/index.html');
                        }
                        
                        return new Response('網路離線', {
                            status: 408,
                            headers: { 'Content-Type': 'text/plain' }
                        });
                    });
            })
    );
});