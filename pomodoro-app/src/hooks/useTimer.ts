import { useCallback } from 'react';
import type { TimerSettings, TimerState } from '../types';
import { TimerPhase } from '../types';

/**
 * Интерфейс возвращаемых значений хука useTimer
 */
interface UseTimerReturn {
  remainingTime: number;
  phase: TimerPhase;
  isRunning: boolean;
  completedPomodoros: number;
  currentCycle: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skipBreak: () => void;
  resetCompletedPomodoros: () => void;
  getPhaseDuration: () => number;
}

/**
 * Кастомный хук для управления таймером через контекст
 * Логика интервала перенесена в AppProvider для работы в фоне
 */
export function useTimer(
  settings: TimerSettings,
  timerState: TimerState,
  dispatch: React.Dispatch<{ type: 'UPDATE_TIMER_STATE'; payload: Partial<TimerState> }>
): UseTimerReturn {

  const getPhaseDuration = useCallback((): number => {
    switch (timerState.phase) {
      case TimerPhase.Work:
        return settings.workDuration * 60;
      case TimerPhase.ShortBreak:
        return settings.shortBreakDuration * 60;
      case TimerPhase.LongBreak:
        return settings.longBreakDuration * 60;
    }
  }, [timerState.phase, settings.workDuration, settings.shortBreakDuration, settings.longBreakDuration]);

  const start = useCallback(() => {
    dispatch({ type: 'UPDATE_TIMER_STATE', payload: { isRunning: true } });
  }, [dispatch]);

  const pause = useCallback(() => {
    dispatch({ type: 'UPDATE_TIMER_STATE', payload: { isRunning: false } });
  }, [dispatch]);

  const reset = useCallback(() => {
    dispatch({ type: 'UPDATE_TIMER_STATE', payload: { remainingTime: getPhaseDuration(), isRunning: false } });
  }, [getPhaseDuration, dispatch]);

  const skipBreak = useCallback(() => {
    if (timerState.phase === TimerPhase.Work) return;
    dispatch({
      type: 'UPDATE_TIMER_STATE',
      payload: { phase: TimerPhase.Work, remainingTime: settings.workDuration * 60, isRunning: false },
    });
  }, [timerState.phase, settings.workDuration, dispatch]);

  const resetCompletedPomodoros = useCallback(() => {
    dispatch({ type: 'UPDATE_TIMER_STATE', payload: { completedPomodoros: 0 } });
  }, [dispatch]);

  return {
    remainingTime: timerState.remainingTime,
    phase: timerState.phase,
    isRunning: timerState.isRunning,
    completedPomodoros: timerState.completedPomodoros,
    currentCycle: timerState.currentCycle,
    start,
    pause,
    reset,
    skipBreak,
    resetCompletedPomodoros,
    getPhaseDuration,
  };
}
