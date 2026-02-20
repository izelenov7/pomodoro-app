import { useCallback, useRef } from 'react';

/**
 * Кастомный хук для управления системными уведомлениями и звуковыми сигналами
 *
 * Этот хук обеспечивает:
 * - Запрос разрешения на показ уведомлений (Notification API)
 * - Показ системных уведомлений при завершении периодов
 * - Воспроизведение звуковых сигналов через Web Audio API
 *
 * Web Audio API используется вместо <audio> элемента, потому что:
 * - Даёт больше контроля над воспроизведением
 * - Может работать в фоне после жеста пользователя
 * - Позволяет генерировать звуки программно (не нужны файлы)
 *
 * @param soundEnabled - Флаг включения звука
 * @param selectedSound - Название выбранного звука
 * @returns Объект с функциями управления уведомлениями и звуком
 */
export function useNotification(soundEnabled: boolean, selectedSound: string) {
  // Реф для хранения аудио-контекста (создаётся лениво, при первом использовании)
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Рефы для хранения актуальных значений настроек
  // Это нужно чтобы callback'и не пересоздавались при изменении пропсов
  const soundEnabledRef = useRef(soundEnabled);
  const selectedSoundRef = useRef(selectedSound);
  
  // Обновляем рефы при изменении пропсов
  soundEnabledRef.current = soundEnabled;
  selectedSoundRef.current = selectedSound;

  /**
   * Инициализирует аудио-контекст
   * Должен вызываться после жеста пользователя (клик, нажатие)
   * иначе браузер может заблокировать воспроизведение звука
   */
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      } catch (error) {
        console.warn('Не удалось создать AudioContext:', error);
      }
    }
  }, []);

  /**
   * Запрашивает разрешение на показ системных уведомлений
   * Должен вызываться после жеста пользователя
   */
  const requestPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  /**
   * Показывает системное уведомление
   * @param title - Заголовок уведомления
   * @param options - Дополнительные опции (тело, иконка и т.д.)
   */
  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/vite.svg', // Иконка приложения
          ...options,
        });
      } catch (error) {
        console.warn('Ошибка при показе уведомления:', error);
      }
    }
  }, []);

  /**
   * Воспроизводит звуковой сигнал
   * Использует Web Audio API для генерации звука программно
   * Это надёжнее, чем загрузка файлов, и работает в фоне
   *
   * @param soundType - Тип звука ('beep', 'chime', 'alarm')
   */
  const playSound = useCallback((soundType: string) => {
    // Если звук отключён в настройках, ничего не делаем
    if (!soundEnabledRef.current) return;

    // Инициализируем аудио-контекст если ещё не создан
    if (!audioContextRef.current) {
      initAudioContext();
    }

    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Разблокируем контекст если он в suspended состоянии
    // (браузеры могут приостанавливать контекст до первого жеста)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    try {
      // Создаём осциллятор для генерации звука
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Настройка звука в зависимости от типа
      switch (soundType) {
        case 'beep':
          // Короткий одиночный сигнал
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
          break;

        case 'chime':
          // Приятный двойной сигнал (как колокольчик)
          oscillator.frequency.value = 523.25; // Нота C5
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.5);

          // Вторая нота через небольшую паузу
          const oscillator2 = ctx.createOscillator();
          const gainNode2 = ctx.createGain();
          oscillator2.connect(gainNode2);
          gainNode2.connect(ctx.destination);
          oscillator2.frequency.value = 659.25; // Нота E5
          oscillator2.type = 'sine';
          gainNode2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
          gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.65);
          oscillator2.start(ctx.currentTime + 0.15);
          oscillator2.stop(ctx.currentTime + 0.65);
          break;

        case 'alarm':
          // Тревожный прерывистый сигнал
          oscillator.frequency.value = 1000;
          oscillator.type = 'square';

          // Создаём модуляцию для прерывистого звука
          const lfo = ctx.createOscillator();
          lfo.frequency.value = 4; // 4 Гц модуляция
          const lfoGain = ctx.createGain();
          lfoGain.gain.value = 500;
          lfo.connect(lfoGain);
          lfoGain.connect(oscillator.frequency);
          lfo.start(ctx.currentTime);
          lfo.stop(ctx.currentTime + 1);

          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 1);
          break;

        default:
          // Звук по умолчанию (beep)
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
      }
    } catch (error) {
      console.warn('Ошибка при воспроизведении звука:', error);
    }
  }, [initAudioContext]);

  /**
   * Комбинированная функция для уведомления о завершении периода
   * Показывает системное уведомление и воспроизводит звук
   *
   * @param message - Сообщение для уведомления
   */
  const notifyPeriodEnd = useCallback((message: string) => {
    showNotification('Pomodoro Timer', {
      body: message,
      tag: 'pomodoro-timer', // Тег для группировки уведомлений
      requireInteraction: true, // Требует взаимодействия пользователя
    });
    playSound(selectedSoundRef.current || 'chime');
  }, [showNotification, playSound]);

  return {
    requestPermission,
    showNotification,
    playSound,
    notifyPeriodEnd,
    initAudioContext,
  };
}
