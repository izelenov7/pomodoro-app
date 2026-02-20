/**
 * Утилиты для форматирования времени
 * Используются для отображения времени в формате мм:сс
 */

import { TimerPhase } from '../types';

/**
 * Форматирует количество секунд в строку формата мм:сс
 * @param seconds - количество секунд для форматирования
 * @returns Строка в формате "мм:сс" (например, "25:00", "05:30")
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  // Добавляем ведущий ноль для однозначных чисел
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Получает название этапа таймера на русском языке
 * @param phase - текущий этап таймера
 * @returns Человекочитаемое название этапа
 */
export const getPhaseName = (phase: TimerPhase): string => {
  switch (phase) {
    case TimerPhase.Work:
      return 'Работа';
    case TimerPhase.ShortBreak:
      return 'Короткий перерыв';
    case TimerPhase.LongBreak:
      return 'Длинный перерыв';
    default:
      return '';
  }
};

/**
 * Получает цвет для текущего этапа таймера
 * Используется для визуального выделения активного периода
 * @param phase - текущий этап таймера
 * @returns HEX-код цвета
 */
export const getPhaseColor = (phase: TimerPhase): string => {
  switch (phase) {
    case TimerPhase.Work:
      return '#e74c3c'; // Красный для работы
    case TimerPhase.ShortBreak:
      return '#27ae60'; // Зелёный для короткого перерыва
    case TimerPhase.LongBreak:
      return '#3498db'; // Синий для длинного перерыва
    default:
      return '#95a5a6';
  }
};
