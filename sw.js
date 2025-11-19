const CACHE_NAME = 'food-picker-v1.6.0-stable';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/db.js',
    '/js/scenarioManager.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/maskable-icon.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 安裝 Service Worker
self.addEventListener('install', event => {
    console.log('🔧 Service Worker 安裝中...', CACHE_NAME);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('✅ 快取已開啟，開始快取核心資源');
                return cache.addAll(urlsToCache).catch(error => {
                    console.log('⚠️ 部分資源快取失敗:', error);
                    // 即使部分資源失敗也繼續
                    return Promise.resolve();
                });
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

// 攔截請求 - 改進版快取策略
self.addEventListener('fetch', event => {
    // 跳過非 GET 請求和非 HTTP 請求
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
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
                        // 檢查回應是否有效
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // 只快取同源請求
                        if (event.request.url.startsWith(self.location.origin)) {
                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                    console.log('💾 新增到快取:', event.request.url);
                                })
                                .catch(error => {
                                    console.log('⚠️ 快取儲存失敗:', error);
                                });
                        }
                        return response;
                    })
                    .catch(error => {
                        console.log('🌐 網路請求失敗:', event.request.url, error);
                        
                        // 對於 HTML 請求，返回快取的 index.html
                        if (event.request.destination === 'document' || 
                            (event.request.headers.get('accept') && 
                             event.request.headers.get('accept').includes('text/html'))) {
                            return caches.match('/index.html');
                        }
                        
                        // 對於 CSS 和 JS 資源，嘗試返回快取版本
                        if (event.request.url.includes('.css') || event.request.url.includes('.js')) {
                            return caches.match(event.request).then(cachedResponse => {
                                if (cachedResponse) {
                                    return cachedResponse;
                                }
                                // 返回離線頁面或錯誤訊息
                                return new Response('網路離線', {
                                    status: 408,
                                    headers: { 'Content-Type': 'text/plain' }
                                });
                            });
                        }
                        
                        return new Response('網路連線不可用', {
                            status: 408,
                            headers: { 'Content-Type': 'text/plain' }
                        });
                    });
            })
    );
});

// 接收來自主線程的訊息
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// 後台同步處理（如果瀏覽器支援）
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        console.log('🔄 後台同步執行中...');
        // 可以在這裡執行後台同步任務
    }
});