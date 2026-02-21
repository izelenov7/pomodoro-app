import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { AppState, AppContextType, AppAction, TimerSettings, TimerState, TimerPhase, Task } from '../types';
import { useNotification } from '../hooks/useNotification';

/**
 * Начальные настройки таймера
 * Значения по умолчанию соответствуют классической технике Pomodoro
 */
const DEFAULT_SETTINGS: TimerSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  totalWorkPeriods: 12,
  soundEnabled: true,
  selectedSound: 'chime',
};

/**
 * Фиксированное количество рабочих периодов до длинного перерыва
 */
const CYCLES_BEFORE_LONG_BREAK = 4;

/**
 * Начальное состояние таймера
 */
const DEFAULT_TIMER_STATE: TimerState = {
  phase: TimerPhase.Work,
  remainingTime: DEFAULT_SETTINGS.workDuration * 60,
  isRunning: false,
  completedPomodoros: 0,
  currentCycle: 0,
};

/**
 * Начальное состояние приложения
 */
const DEFAULT_STATE: AppState = {
  timerSettings: DEFAULT_SETTINGS,
  timerState: DEFAULT_TIMER_STATE,
  tasks: [],
  notes: '',
  activeTab: 'timer',
};

/**
 * Ключи для localStorage
 */
const STORAGE_KEYS = {
  SETTINGS: 'pomodoro_settings',
  TIMER_STATE: 'pomodoro_timer_state',
  TASKS: 'pomodoro_tasks',
  NOTES: 'pomodoro_notes',
};

/**
 * Загружает начальные значения из localStorage
 */
const getInitialState = (): AppState => {
  try {
    const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const storedTimerState = localStorage.getItem(STORAGE_KEYS.TIMER_STATE);
    const storedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    const storedNotes = localStorage.getItem(STORAGE_KEYS.NOTES);

    const parsedSettings = storedSettings ? JSON.parse(storedSettings) : DEFAULT_SETTINGS;
    
    // Миграция: если есть старое поле cyclesBeforeLongBreak, игнорируем его
    // Если нет totalWorkPeriods, устанавливаем 12
    const timerSettings: TimerSettings = {
      workDuration: parsedSettings.workDuration ?? DEFAULT_SETTINGS.workDuration,
      shortBreakDuration: parsedSettings.shortBreakDuration ?? DEFAULT_SETTINGS.shortBreakDuration,
      longBreakDuration: parsedSettings.longBreakDuration ?? DEFAULT_SETTINGS.longBreakDuration,
      totalWorkPeriods: parsedSettings.totalWorkPeriods ?? DEFAULT_SETTINGS.totalWorkPeriods,
      soundEnabled: parsedSettings.soundEnabled ?? DEFAULT_SETTINGS.soundEnabled,
      selectedSound: parsedSettings.selectedSound ?? DEFAULT_SETTINGS.selectedSound,
    };
    
    const timerState = storedTimerState ? JSON.parse(storedTimerState) : DEFAULT_TIMER_STATE;

    // Исправляем currentCycle на основе completedPomodoros
    const correctedCycle = timerState.completedPomodoros % CYCLES_BEFORE_LONG_BREAK;

    return {
      timerSettings,
      timerState: { ...timerState, currentCycle: correctedCycle },
      tasks: storedTasks ? JSON.parse(storedTasks).map((task: Task, index: number) => ({
        ...task,
        order: task.order !== undefined ? task.order : index,
      })) : [],
      notes: storedNotes || '',
      activeTab: 'timer',
    };
  } catch (error) {
    console.warn('Ошибка загрузки данных из localStorage:', error);
    return DEFAULT_STATE;
  }
};

/**
 * Редюсер для управления состоянием приложения
 */
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };

    case 'UPDATE_TIMER_SETTINGS':
      const newSettings = { ...state.timerSettings, ...action.payload };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      return { ...state, timerSettings: newSettings };

    case 'UPDATE_TIMER_STATE':
      const newTimerState = { ...state.timerState, ...action.payload };
      localStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify(newTimerState));
      return { ...state, timerState: newTimerState };

    case 'ADD_TASK':
      const newTask: Task = {
        id: Date.now().toString(),
        text: action.payload,
        completed: false,
        createdAt: Date.now(),
        order: state.tasks.length > 0 ? Math.max(...state.tasks.map(t => t.order)) + 1 : 0,
      };
      const newTasks = [...state.tasks, newTask];
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(newTasks));
      return { ...state, tasks: newTasks };

    case 'TOGGLE_TASK':
      const toggledTasks = state.tasks.map((task) => {
        if (task.id === action.payload) {
          const newCompleted = !task.completed;
          // Если задача становится выполненной, перемещаем её в начало группы выполненных
          if (newCompleted) {
            const completedTasks = state.tasks.filter(t => t.completed && t.id !== task.id);
            if (completedTasks.length > 0) {
              const minOrder = Math.min(...completedTasks.map(t => t.order));
              return { ...task, completed: true, order: minOrder - 1 };
            }
            return { ...task, completed: true };
          }
          // Если задача становится невыполненной, перемещаем её вверх (минимальный order)
          const uncompletedTasks = state.tasks.filter(t => !t.completed && t.id !== task.id);
          if (uncompletedTasks.length > 0) {
            const minOrder = Math.min(...uncompletedTasks.map(t => t.order));
            return { ...task, completed: false, order: minOrder - 1 };
          }
          return { ...task, completed: false };
        }
        return task;
      });
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(toggledTasks));
      return { ...state, tasks: toggledTasks };

    case 'DELETE_TASK':
      const filteredTasks = state.tasks.filter((task) => task.id !== action.payload);
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filteredTasks));
      return { ...state, tasks: filteredTasks };

    case 'EDIT_TASK':
      const editedTasks = state.tasks.map((task) =>
        task.id === action.payload.id ? { ...task, text: action.payload.text } : task
      );
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(editedTasks));
      return { ...state, tasks: editedTasks };

    case 'REORDER_TASKS':
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(action.payload));
      return { ...state, tasks: action.payload };

    case 'MOVE_TASK':
      const { fromIndex, toIndex } = action.payload;
      const movedTasks = [...state.tasks];
      const [movedTask] = movedTasks.splice(fromIndex, 1);
      movedTasks.splice(toIndex, 0, movedTask);
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(movedTasks));
      return { ...state, tasks: movedTasks };

    case 'SET_NOTES':
      localStorage.setItem(STORAGE_KEYS.NOTES, action.payload);
      return { ...state, notes: action.payload };

    case 'RESET_POMODORO_COUNT':
      const resetState = { ...state.timerState, completedPomodoros: 0, currentCycle: 0 };
      localStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify(resetState));
      return { ...state, timerState: resetState };

    case 'RESET_COMPLETED_POMODOROS':
      const resetPomodoroState = { ...state.timerState, completedPomodoros: 0 };
      localStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify(resetPomodoroState));
      return { ...state, timerState: resetPomodoroState };

    default:
      return state;
  }
};

/**
 * Создаём контекст приложения
 */
const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Провайдер контекста приложения с логикой таймера
 */
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, undefined, getInitialState);
  
  // Рефы для таймера (глобальные, не зависят от монтирования компонентов)
  const intervalRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const { notifyPeriodEnd } = useNotification(state.timerSettings.soundEnabled, state.timerSettings.selectedSound);

  /**
   * Определяет следующий этап таймера
   * Большой перерыв наступает только после 4 рабочих периодов
   */
  const getNextPhase = useCallback((): { phase: TimerPhase; completedInCycle: number } => {
    if (state.timerState.phase === TimerPhase.Work) {
      // Считаем количество завершённых помидоров в текущем цикле
      const completedInCycle = state.timerState.completedPomodoros % CYCLES_BEFORE_LONG_BREAK;
      const newCompletedInCycle = completedInCycle + 1;
      
      // Если завершено 4 помидора в цикле — большой перерыв
      if (newCompletedInCycle >= CYCLES_BEFORE_LONG_BREAK) {
        return { phase: TimerPhase.LongBreak, completedInCycle: 0 };
      }
      // Иначе короткий перерыв, сохраняем счётчик в цикле
      return { phase: TimerPhase.ShortBreak, completedInCycle: newCompletedInCycle };
    }
    // При переходе от перерыва к работе сохраняем текущее количество завершённых в цикле
    return { phase: TimerPhase.Work, completedInCycle: state.timerState.completedPomodoros % CYCLES_BEFORE_LONG_BREAK };
  }, [state.timerState.phase, state.timerState.completedPomodoros]);

  /**
   * Обработчик завершения периода
   */
  const handlePeriodEnd = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const next = getNextPhase();
    let notificationMessage = '';

    if (state.timerState.phase === TimerPhase.Work) {
      const newCompletedCount = state.timerState.completedPomodoros + 1;
      notificationMessage = next.phase === TimerPhase.LongBreak
        ? 'Отличная работа! Длинный перерыв.'
        : 'Работа завершена! Короткий перерыв.';

      // Проверка на достижение общего количества рабочих периодов
      const isCycleComplete = newCompletedCount >= state.timerSettings.totalWorkPeriods;

      dispatch({
        type: 'UPDATE_TIMER_STATE',
        payload: {
          completedPomodoros: newCompletedCount,
          // currentCycle теперь вычисляется динамически через completedPomodoros % CYCLES_BEFORE_LONG_BREAK
          currentCycle: next.completedInCycle,
        },
      });

      // Если цикл завершён, следующий этап — работа с начала
      if (isCycleComplete) {
        notificationMessage = 'Все помидоры завершены! Начинаем новый цикл.';
        notifyPeriodEnd(notificationMessage);

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'NOTIFY_PERIOD_END',
            message: notificationMessage,
          });
        }

        dispatch({
          type: 'UPDATE_TIMER_STATE',
          payload: {
            phase: TimerPhase.Work,
            remainingTime: state.timerSettings.workDuration * 60,
            currentCycle: 0,
            isRunning: false,
          },
        });
        return;
      }
    } else {
      notificationMessage = 'Перерыв окончен, пора работать!';
    }

    notifyPeriodEnd(notificationMessage);

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'NOTIFY_PERIOD_END',
        message: notificationMessage,
      });
    }

    const phaseDuration = next.phase === TimerPhase.Work
      ? state.timerSettings.workDuration * 60
      : next.phase === TimerPhase.ShortBreak
        ? state.timerSettings.shortBreakDuration * 60
        : state.timerSettings.longBreakDuration * 60;

    dispatch({
      type: 'UPDATE_TIMER_STATE',
      payload: {
        phase: next.phase,
        remainingTime: phaseDuration,
        currentCycle: next.completedInCycle,
        isRunning: false,
      },
    });
  }, [getNextPhase, state.timerState.phase, state.timerState.completedPomodoros, state.timerSettings, notifyPeriodEnd]);

  /**
   * Функция тика таймера (сохраняем в ref для стабильности)
   */
  const tickFn = useRef<() => void>(() => {});
  const handlePeriodEndRef = useRef(handlePeriodEnd);

  useEffect(() => {
    handlePeriodEndRef.current = handlePeriodEnd;
  }, [handlePeriodEnd]);

  useEffect(() => {
    tickFn.current = () => {
      const now = Date.now();
      const currentRemainingTime = state.timerState.remainingTime;

      if (lastTickRef.current !== null) {
        const elapsed = Math.floor((now - lastTickRef.current) / 1000);
        if (elapsed > 1) {
          const newRemainingTime = Math.max(0, currentRemainingTime - elapsed);
          dispatch({ type: 'UPDATE_TIMER_STATE', payload: { remainingTime: newRemainingTime } });

          if (newRemainingTime === 0) {
            handlePeriodEndRef.current();
          }
          lastTickRef.current = now;
          return;
        }
      }

      lastTickRef.current = now;

      if (currentRemainingTime > 0) {
        const newRemainingTime = currentRemainingTime - 1;
        dispatch({ type: 'UPDATE_TIMER_STATE', payload: { remainingTime: newRemainingTime } });

        if (newRemainingTime === 0) {
          handlePeriodEndRef.current();
        }
      }
    };
  }, [state.timerState.remainingTime, dispatch]);

  /**
   * Эффект для управления интервалом таймера
   */
  useEffect(() => {
    if (state.timerState.isRunning && !intervalRef.current) {
      // Таймер должен быть запущен, но интервал не активен
      lastTickRef.current = Date.now();
      intervalRef.current = window.setInterval(() => tickFn.current(), 1000);
    } else if (!state.timerState.isRunning && intervalRef.current) {
      // Таймер остановлен, но интервал активен
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      lastTickRef.current = null;
    }

    // Очистка при размонтировании
    return () => {
      // Не очищаем интервал при размонтировании, таймер должен продолжать работать
    };
  }, [state.timerState.isRunning]);

  // Очистка интервала только при полной выгрузке страницы
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Хук для доступа к контексту приложения
 */
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext должен использоваться внутри AppProvider');
  }
  return context;
};
