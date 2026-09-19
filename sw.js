/* 묵주기도 PWA 서비스 워커
   - 앱 파일(index.html 등)은 "네트워크 우선": 온라인이면 항상 최신, 오프라인이면 캐시
   - 폰트·Firebase 스크립트는 "캐시 우선"
   - 새 버전 배포 시 아래 VERSION 숫자만 올리면 예전 캐시가 정리됩니다 */
const VERSION = 'v1';
const CACHE = 'rosary-' + VERSION;
const APP_FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  /* Firebase 실시간 DB·인증 API는 캐시하지 않음 */
  if (url.hostname.includes('firebasedatabase') || url.hostname.includes('googleapis.com') && !url.hostname.startsWith('fonts')) return;
  if (url.origin === location.origin) {
    /* 네트워크 우선 */
    e.respondWith(fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
  } else {
    /* 캐시 우선 (폰트, firebase 스크립트) */
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; })));
  }
});
