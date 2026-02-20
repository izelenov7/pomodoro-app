import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useTimer } from '../../hooks/useTimer';
import { TimerPhase } from '../../types';
import { formatTime, getPhaseName, getPhaseColor } from '../../utils/timeFormat';
import { Button } from '../../components/Button';
import { SettingsModal } from './SettingsModal';
import './Timer.css';

/**
 * Компонент таймера Pomodoro
 */
export const Timer: React.FC = () => {
  const { state, dispatch } = useAppContext();

  const {
    remainingTime,
    phase,
    isRunning,
    completedPomodoros,
    start,
    pause,
    reset,
    skipBreak,
    resetCompletedPomodoros,
    getPhaseDuration,
  } = useTimer(state.timerSettings, state.timerState, dispatch);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const duration = getPhaseDuration();
  const progress = duration > 0 ? ((duration - remainingTime) / duration) * 100 : 0;
  const phaseColor = getPhaseColor(phase);
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const isBreak = phase === TimerPhase.ShortBreak || phase === TimerPhase.LongBreak;

  return (
    <div className="timer">
      {/* Заголовок с названием этапа */}
      <div className="timer__header">
        <h1 className="timer__phase" style={{ color: phaseColor }}>
          {getPhaseName(phase)}
        </h1>
        <Button
          variant="ghost"
          size="small"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          }
          onClick={() => setIsSettingsOpen(true)}
          aria-label="Настройки"
        />
      </div>

      {/* Круговой прогресс-бар с временем */}
      <div className="timer__display">
        <svg className="timer__progress" viewBox="0 0 300 300">
          <circle
            className="timer__progress-bg"
            cx="150"
            cy="150"
            r={radius}
            fill="none"
            stroke="#ecf0f1"
            strokeWidth="8"
          />
          <circle
            className="timer__progress-bar"
            cx="150"
            cy="150"
            r={radius}
            fill="none"
            stroke={phaseColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
            transform="rotate(-90 150 150)"
          />
        </svg>

        <div className="timer__time" style={{ color: phaseColor }}>
          {formatTime(remainingTime)}
        </div>
      </div>

      {/* Счётчик помидоров */}
      <div className="timer__counter">
        <span className="timer__counter-icon">🍅</span>
        <span className="timer__counter-value">{completedPomodoros}</span>
        <span className="timer__counter-label">помидоров</span>
        <Button
          variant="ghost"
          size="small"
          onClick={resetCompletedPomodoros}
          aria-label="Сбросить счётчик помидоров"
          className="timer__reset-counter"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </Button>
      </div>

      {/* Индикаторы циклов */}
      <div className="timer__cycles">
        {Array.from({ length: 14 }).map((_, index) => {
          // Разделитель после каждых 4 шариков (индексы 4 и 9)
          // 0,1,2,3 = первая группа, 4 = разделитель, 5,6,7,8 = вторая группа, 9 = разделитель, 10,11,12,13 = третья группа
          const isLongBreakGap = index === 4 || index === 9;

          // Реальный индекс шарика (без учёта разделителей)
          // index 0-3 → dotIndex 0-3, index 4 = разделитель
          // index 5-8 → dotIndex 4-7, index 9 = разделитель
          // index 10-13 → dotIndex 8-11
          const dotIndex = index > 9 ? index - 2 : index > 4 ? index - 1 : index;

          if (isLongBreakGap) {
            return (
              <div
                key={index}
                className="timer__cycle-dot timer__cycle-dot--gap"
                aria-hidden="true"
              />
            );
          }

          // После 12 помидоров индикаторы сбрасываются (показываем только активный или все серые)
          const completedInCycle = state.timerState.completedPomodoros % 12;
          const isCompleted = dotIndex < completedInCycle;
          const isActive = dotIndex === completedInCycle && phase === TimerPhase.Work;

          // Определяем класс и цвет
          let className = 'timer__cycle-dot';
          let dotColor = '';

          if (isCompleted) {
            // Завершённый рабочий цикл
            className += ' timer__cycle-dot--completed';
            dotColor = getPhaseColor(TimerPhase.Work);
          } else if (isActive) {
            // Текущий рабочий цикл
            className += ' timer__cycle-dot--active';
            dotColor = getPhaseColor(TimerPhase.Work);
          }

          return (
            <div
              key={index}
              className={className}
              style={dotColor ? { backgroundColor: dotColor, borderColor: dotColor } : undefined}
              aria-label={`Цикл ${dotIndex + 1}`}
            />
          );
        })}
      </div>

      {/* Кнопки управления */}
      <div className="timer__controls">
        <Button
          variant="primary"
          size="large"
          onClick={isRunning ? pause : start}
          style={{ backgroundColor: phaseColor }}
        >
          {isRunning ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
              <span>Пауза</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Старт</span>
            </>
          )}
        </Button>

        <Button variant="secondary" size="large" onClick={reset} aria-label="Сброс">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </Button>

        {isBreak && (
          <Button variant="ghost" size="large" onClick={skipBreak}>
            Пропустить
          </Button>
        )}
      </div>

      {/* Модальное окно настроек */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
