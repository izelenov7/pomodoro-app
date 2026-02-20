/**
 * Service Worker для Pomodoro Timer
 * Простая версия для фоновых уведомлений
 */

const CACHE_NAME = 'pomodoro-v1';

// Установка Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Активация
self.addEventListener('activate', (event) => {
  self.clients.claim();
});

// Обработка сообщений от основного потока
self.addEventListener('message', (event) => {
  const { type, message } = event.data || {};

  if (type === 'NOTIFY_PERIOD_END') {
    // Показываем уведомление о завершении периода
    self.registration.showNotification('Pomodoro Timer', {
      body: message || 'Период завершён!',
      icon: '/vite.svg',
      badge: '/vite.svg',
      tag: 'pomodoro-period-end',
      requireInteraction: true,
    });
  }
});

// Клик по уведомлению
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url === self.location.origin && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
