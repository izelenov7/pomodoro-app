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
          gainNode.gain.setValueAtTime(0.585, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
          break;

        case 'chime':
          // Приятный двойной сигнал (как колокольчик)
          oscillator.frequency.value = 523.25; // Нота C5
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.351, ctx.currentTime);
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
          gainNode2.gain.setValueAtTime(0.351, ctx.currentTime + 0.15);
          gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.65);
          oscillator2.start(ctx.currentTime + 0.15);
          oscillator2.stop(ctx.currentTime + 0.65);
          break;

        case 'melody':
          // Длинная мелодия из 4 нот (2 секунды)
          oscillator.frequency.value = 523.25; // C5
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.351, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 2);

          // Вторая нота (E5) через 0.5с
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.value = 659.25;
          osc2.type = 'sine';
          gain2.gain.setValueAtTime(0.351, ctx.currentTime + 0.5);
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
          osc2.start(ctx.currentTime + 0.5);
          osc2.stop(ctx.currentTime + 2);

          // Третья нота (G5) через 1с
          const osc3 = ctx.createOscillator();
          const gain3 = ctx.createGain();
          osc3.connect(gain3);
          gain3.connect(ctx.destination);
          osc3.frequency.value = 783.99;
          osc3.type = 'sine';
          gain3.gain.setValueAtTime(0.351, ctx.currentTime + 1);
          gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
          osc3.start(ctx.currentTime + 1);
          osc3.stop(ctx.currentTime + 2);

          // Четвёртая нота (C6) через 1.5с
          const osc4 = ctx.createOscillator();
          const gain4 = ctx.createGain();
          osc4.connect(gain4);
          gain4.connect(ctx.destination);
          osc4.frequency.value = 1046.50;
          osc4.type = 'sine';
          gain4.gain.setValueAtTime(0.351, ctx.currentTime + 1.5);
          gain4.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
          osc4.start(ctx.currentTime + 1.5);
          osc4.stop(ctx.currentTime + 2);
          break;

        case 'bells':
          // Длинные колокола (3 секунды)
          oscillator.frequency.value = 523.25; // C5
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.351, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 3);

          // Вторая нота (G5) через 0.8с
          const bell2 = ctx.createOscillator();
          const bellGain2 = ctx.createGain();
          bell2.connect(bellGain2);
          bellGain2.connect(ctx.destination);
          bell2.frequency.value = 783.99;
          bell2.type = 'sine';
          bellGain2.gain.setValueAtTime(0.351, ctx.currentTime + 0.8);
          bellGain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 3);
          bell2.start(ctx.currentTime + 0.8);
          bell2.stop(ctx.currentTime + 3);

          // Третья нота (C6) через 1.6с
          const bell3 = ctx.createOscillator();
          const bellGain3 = ctx.createGain();
          bell3.connect(bellGain3);
          bellGain3.connect(ctx.destination);
          bell3.frequency.value = 1046.50;
          bell3.type = 'sine';
          bellGain3.gain.setValueAtTime(0.351, ctx.currentTime + 1.6);
          bellGain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 3);
          bell3.start(ctx.currentTime + 1.6);
          bell3.stop(ctx.currentTime + 3);
          break;

        default:
          // Звук по умолчанию (beep)
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.585, ctx.currentTime);
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
