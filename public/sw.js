// Service Worker 版本号（每次更新时修改）
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `sweetheart-test-${CACHE_VERSION}`;

// 需要缓存的静态资源
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/egg-icon.svg',
];

// 需要缓存的音频文件
const AUDIO_CACHE_URLS = [
  '/bgm.mp3',
  '/option-sound.wav',
  '/error-sound.wav',
  '/success-sound.wav',
  '/start-sound.wav',
  '/result-sound.wav',
  '/poster-sound.wav',
  '/stress-sound.wav',
];

// 需要缓存的图片文件
const IMAGE_CACHE_URLS = [
  '/guardians/SC01.png',
  '/guardians/SC02.png',
  '/guardians/SC03.png',
  '/guardians/SC04.png',
  '/guardians/SC05.png',
  '/guardians/SC06.png',
  '/guardians/SC07.png',
  '/guardians/SC08.png',
  '/guardians/SC09.png',
  '/guardians/SC10.png',
  '/guardians/SC11.png',
  '/guardians/SC12.png',
];

// 所有需要缓存的资源
const CACHE_URLS = [
  ...STATIC_CACHE_URLS,
  ...AUDIO_CACHE_URLS,
  ...IMAGE_CACHE_URLS,
];

// 安装事件 - 预缓存资源
self.addEventListener('install', (event) => {
  console.log('[SW] 安装中...', CACHE_VERSION);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] 开始缓存资源');
        // 分批缓存，避免一次性加载太多
        return Promise.all([
          cache.addAll(STATIC_CACHE_URLS),
          cache.addAll(AUDIO_CACHE_URLS).catch(err => {
            console.warn('[SW] 音频缓存失败（可忽略）:', err);
          }),
          cache.addAll(IMAGE_CACHE_URLS).catch(err => {
            console.warn('[SW] 图片缓存失败（可忽略）:', err);
          }),
        ]);
      })
      .then(() => {
        console.log('[SW] 资源缓存完成');
        // 立即激活新的 Service Worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] 缓存失败:', error);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] 激活中...', CACHE_VERSION);

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] 删除旧缓存:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] 激活完成');
        // 立即控制所有页面
        return self.clients.claim();
      })
  );
});

// 请求拦截 - 缓存优先策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }

  // 跳过外部请求（Google Analytics, Supabase 等）
  if (url.origin !== self.location.origin) {
    return;
  }

  // 跳过 API 请求
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[SW] 从缓存返回:', url.pathname);

          // 后台更新缓存（stale-while-revalidate）
          fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, response.clone());
                });
              }
            })
            .catch(() => {
              // 网络请求失败，忽略
            });

          return cachedResponse;
        }

        // 缓存中没有，从网络获取
        console.log('[SW] 从网络获取:', url.pathname);
        return fetch(request)
          .then((response) => {
            // 检查是否是有效响应
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // 克隆响应（响应只能使用一次）
            const responseToCache = response.clone();

            // 缓存新资源
            caches.open(CACHE_NAME)
              .then((cache) => {
                // 只缓存同源资源
                if (url.origin === self.location.origin) {
                  cache.put(request, responseToCache);
                }
              });

            return response;
          })
          .catch((error) => {
            console.error('[SW] 网络请求失败:', url.pathname, error);

            // 如果是 HTML 请求失败，返回离线页面
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }

            throw error;
          });
      })
  );
});

// 消息监听 - 支持手动更新
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] 收到跳过等待消息');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] 收到清除缓存消息');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('[SW] Service Worker 已加载', CACHE_VERSION);
