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
 * @param soundVolume - Громкость звука в процентах (0-100)
 * @returns Объект с функциями управления уведомлениями и звуком
 */
export function useNotification(soundEnabled: boolean, selectedSound: string, soundVolume: number) {
  // Реф для хранения аудио-контекста (создаётся лениво, при первом использовании)
  const audioContextRef = useRef<AudioContext | null>(null);

  // Рефы для хранения актуальных значений настроек
  // Это нужно чтобы callback'ы не пересоздавались при изменении пропсов
  const soundEnabledRef = useRef(soundEnabled);
  const selectedSoundRef = useRef(selectedSound);
  const soundVolumeRef = useRef(soundVolume);

  // Обновляем рефы при изменении пропсов
  soundEnabledRef.current = soundEnabled;
  selectedSoundRef.current = selectedSound;
  soundVolumeRef.current = soundVolume;

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
      // Преобразуем громкость из процентов (0-100) в коэффициент (0-1)
      const volumeMultiplier = soundVolumeRef.current / 100;

      // Вспомогательная функция для воспроизведения тона с синусоидой
      const playTone = (frequency: number, startTime: number, duration: number, baseVolume: number, type: OscillatorType = 'sine') => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.value = frequency;
        osc.type = type;

        // Применяем множитель громкости к базовой громкости звука
        const finalVolume = baseVolume * volumeMultiplier;

        // Плавное начало и затухание для избежания щелчков
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(finalVolume, startTime + 0.05);
        gain.gain.setValueAtTime(finalVolume, startTime + duration - 0.05);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Вспомогательная функция для звука с эффектом затухания
      const playToneWithDecay = (frequency: number, startTime: number, duration: number, baseVolume: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.value = frequency;
        osc.type = 'triangle';

        const finalVolume = baseVolume * volumeMultiplier;

        // Быстрая атака и плавное затухание
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(finalVolume, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Настройка звука в зависимости от типа
      switch (soundType) {
        case 'click':
          // Клик с более длинным затуханием
          playToneWithDecay(1000, ctx.currentTime, 0.3, 0.5);
          break;

        case 'pop':
          // Поп-звук с более плавным звучанием
          playToneWithDecay(500, ctx.currentTime, 0.4, 0.6);
          playToneWithDecay(800, ctx.currentTime + 0.1, 0.3, 0.5);
          break;

        case 'chime':
          // Перезвон - мягкий аккорд с тремя тонами
          playToneWithDecay(523.25, ctx.currentTime, 0.6, 0.5); // C5
          playToneWithDecay(659.25, ctx.currentTime + 0.08, 0.5, 0.4); // E5
          playToneWithDecay(783.99, ctx.currentTime + 0.15, 0.7, 0.4); // G5
          break;

        case 'soft':
          // Мягкий приятный звук
          playToneWithDecay(440, ctx.currentTime, 0.6, 0.7); // A4
          playToneWithDecay(880, ctx.currentTime + 0.1, 0.5, 0.5); // A5
          break;

        case 'piano':
          // Фортепианный аккорд (C мажор септ)
          playToneWithDecay(523.25, ctx.currentTime, 1.0, 0.6); // C5
          playToneWithDecay(659.25, ctx.currentTime + 0.05, 0.9, 0.5); // E5
          playToneWithDecay(783.99, ctx.currentTime + 0.1, 0.8, 0.5); // G5
          playToneWithDecay(987.77, ctx.currentTime + 0.15, 0.7, 0.4); // B5
          break;

        case 'bells':
          // Колокола - три тона с длинным затуханием и гармониками
          playToneWithDecay(523.25, ctx.currentTime, 1.5, 0.5); // C5
          playTone(523.25 * 2, ctx.currentTime, 0.8, 0.15, 'sine'); // гармоника
          playToneWithDecay(783.99, ctx.currentTime + 0.5, 1.3, 0.4); // G5
          playTone(783.99 * 1.5, ctx.currentTime + 0.5, 0.7, 0.1, 'sine'); // гармоника
          playToneWithDecay(1046.50, ctx.currentTime + 1.0, 1.6, 0.4); // C6
          playTone(1046.50 * 1.5, ctx.currentTime + 1.0, 0.9, 0.1, 'sine'); // гармоника
          break;

        case 'ambient':
          // Атмосферный звук с гармониками
          playTone(329.63, ctx.currentTime, 1.5, 0.4, 'sine'); // E4
          playTone(493.88, ctx.currentTime, 1.3, 0.25, 'sine'); // B4
          playTone(659.25, ctx.currentTime + 0.3, 1.2, 0.5, 'triangle'); // E5
          playTone(987.77, ctx.currentTime + 0.6, 1.0, 0.4, 'sine'); // B5
          break;

        default:
          // Звук по умолчанию (pop)
          playToneWithDecay(500, ctx.currentTime, 0.4, 0.6);
          playToneWithDecay(800, ctx.currentTime + 0.1, 0.3, 0.5);
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
