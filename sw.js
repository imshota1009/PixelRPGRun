const CACHE_NAME = 'dino-rpg-runner-v1';
// キャッシュするファイルのリスト
const urlsToCache = [
  '/',
  'index.html',
  'game.js',
  'background_music.mp3',
  'boss_music.mp3',
  'dino_player.png',
  // 注意: アイコン画像もキャッシュリストに追加
  'merchant_1.png',
  'merchant_2.png'
];

// インストール処理
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// ファイルのリクエスト時にキャッシュから返す
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュ内にファイルがあればそれを返す
        if (response) {
          return response;
        }
        // なければネットワークから取得する
        return fetch(event.request);
      }
    )
  );
});
