// Service Worker —— 待办事项 PWA
// 作用：让 App 在离线/弱网下也能打开（缓存核心文件）
// 注意：本文件在局域网 http 下浏览器会拒绝注册，属正常现象，不影响 App 主功能。
const CACHE_NAME = "todo-app-v1";
const CORE_FILES = [
  "./todo-app.html",
  "./manifest.json",
  "./icon.svg",
];

// 安装时预缓存核心文件
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

// 激活时清理旧缓存
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 请求拦截：缓存优先，网络兜底
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((resp) => {
        // 同源 GET 响应才缓存
        if (resp.ok && new URL(event.request.url).origin === location.origin) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
