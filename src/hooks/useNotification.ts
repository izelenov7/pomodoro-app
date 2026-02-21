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
      // Вспомогательная функция для воспроизведения тона
      const playTone = (frequency: number, startTime: number, duration: number, volume: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = frequency;
        osc.type = 'sine';
        
        // Плавное начало и затухание для избежания щелчков
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
        gain.gain.setValueAtTime(volume, startTime + duration - 0.05);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Настройка звука в зависимости от типа
      switch (soundType) {
        case 'beep':
          // Громкий одиночный сигнал
          playTone(880, ctx.currentTime, 0.5, 0.5);
          break;

        case 'chime':
          // Громкий двойной сигнал - два отчётливых тона
          playTone(523.25, ctx.currentTime, 0.4, 0.5); // C5 - первый сигнал
          playTone(1046.50, ctx.currentTime + 0.35, 0.4, 0.5); // C6 - второй сигнал (октава выше)
          break;

        case 'melody':
          // Мелодия из 4 нот (мажорное трезвучие)
          playTone(523.25, ctx.currentTime, 0.3, 0.8); // C5
          playTone(659.25, ctx.currentTime + 0.3, 0.3, 0.8); // E5
          playTone(783.99, ctx.currentTime + 0.6, 0.3, 0.8); // G5
          playTone(1046.50, ctx.currentTime + 0.9, 0.5, 0.8); // C6
          break;

        case 'bells':
          // Колокола - три длинных тона
          playTone(523.25, ctx.currentTime, 0.8, 0.9); // C5
          playTone(783.99, ctx.currentTime + 0.7, 0.8, 0.9); // G5
          playTone(1046.50, ctx.currentTime + 1.4, 1.0, 0.9); // C6
          break;

        default:
          // Звук по умолчанию (как chime)
          playTone(523.25, ctx.currentTime, 0.4, 1.0);
          playTone(1046.50, ctx.currentTime + 0.35, 0.4, 1.0);
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
