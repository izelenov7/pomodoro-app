import { useState, useEffect } from 'react';

/**
 * Кастомный хук для синхронизации состояния с localStorage
 * 
 * Этот хук обеспечивает:
 * - Загрузку начального значения из localStorage при монтировании
 * - Автоматическое сохранение значения в localStorage при изменении
 * - Синхронизацию между вкладками браузера через событие 'storage'
 * 
 * @param key - Уникальный ключ для хранения данных в localStorage
 * @param initialValue - Значение по умолчанию, если в localStorage нет данных
 * @returns Кортеж [storedValue, setValue] для работы с состоянием
 * 
 * @example
 * const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', []);
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Функция для безопасного получения значения из localStorage
  const getStoredValue = (): T => {
    // Проверка на наличие window (для SSR-совместимости)
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        return JSON.parse(item) as T;
      }
    } catch (error) {
      console.warn(`Ошибка чтения localStorage для ключа "${key}":`, error);
    }

    return initialValue;
  };

  // Инициализация состояния с загрузкой из localStorage
  const [storedValue, setStoredValue] = useState<T>(getStoredValue);

  // Эффект для загрузки данных при монтировании
  // Это нужно для случая, когда localStorage изменился в другой вкладке
  useEffect(() => {
    const stored = getStoredValue();
    if (JSON.stringify(stored) !== JSON.stringify(initialValue)) {
      setStoredValue(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Функция для установки значения
  const setValue = (value: T | ((prev: T) => T)): void => {
    try {
      // Вычисляем новое значение (поддержка функции-апдейтера)
      const newValue = value instanceof Function ? value(storedValue) : value;
      
      // Обновляем состояние React
      setStoredValue(newValue);
      
      // Сохраняем в localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(newValue));
        
        // Генерируем событие storage для синхронизации между вкладками
        // (хотя браузер сам генерирует это событие, явное уведомление не помешает)
        window.dispatchEvent(new Event('storage'));
      }
    } catch (error) {
      console.warn(`Ошибка записи в localStorage для ключа "${key}":`, error);
    }
  };

  // Эффект для синхронизации между вкладками браузера
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent): void => {
      // Реагируем только на изменения нашего ключа
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue) as T);
        } catch (error) {
          console.warn(`Ошибка парсинга значения из localStorage:`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}
