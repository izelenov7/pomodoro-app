/**
 * Точка входа приложения
 * 
 * Инициализирует React-приложение и регистрирует Service Worker
 * для поддержки офлайн-работы и фоновых уведомлений
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Функция регистрации Service Worker
 * 
 * Service Worker регистрируется только в production-режиме
 * и при поддержке браузером
 */
function registerServiceWorker(): void {
  // Проверяем поддержку Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
        })
        .then((registration) => {
          console.log('Service Worker зарегистрирован:', registration.scope);

          // Обработчик обновлений Service Worker
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // Новый Service Worker установлен, контент обновится после перезагрузки
                    console.log('Доступна новая версия приложения. Обновите страницу.');
                  } else {
                    // Service Worker установлен впервые
                    console.log('Контент кэширован для офлайн-работы');
                  }
                }
              };
            }
          };
        })
        .catch((error) => {
          console.error('Ошибка регистрации Service Worker:', error);
        });
    });
  }
}

/**
 * Обработчик сообщений от Service Worker
 * 
 * Получает запросы на воспроизведение звука от Service Worker
 * когда вкладка неактивна
 */
function setupServiceWorkerMessaging(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, sound } = event.data || {};

      if (type === 'PLAY_SOUND') {
        // Service Worker просит воспроизвести звук
        // Это происходит когда вкладка была неактивна
        console.log('Получен запрос на воспроизведение звука от SW:', sound);
        // Звук будет воспроизведён через useNotification хук
      }
    });
  }
}

// Создаём корневой элемент и рендерим приложение
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Элемент #root не найден в DOM');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Регистрируем Service Worker в production
if (import.meta.env.PROD) {
  registerServiceWorker();
  setupServiceWorkerMessaging();
}
