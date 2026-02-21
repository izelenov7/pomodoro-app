/**
 * Основные типы приложения Pomodoro + Задачи + Заметки
 * Все типы вынесены в отдельный модуль для удобства переиспользования
 */

/**
 * Этапы работы таймера Pomodoro
 * work - рабочий период (25 мин по умолчанию)
 * shortBreak - короткий перерыв (5 мин)
 * longBreak - длинный перерыв (15 мин) после N рабочих циклов
 */
export enum TimerPhase {
  Work = 'work',
  ShortBreak = 'shortBreak',
  LongBreak = 'longBreak',
}

/**
 * Настройки таймера
 * Хранятся в localStorage и восстанавливаются при загрузке
 */
export interface TimerSettings {
  /** Длительность рабочего периода в минутах (по умолчанию 25) */
  workDuration: number;
  /** Длительность короткого перерыва в минутах (по умолчанию 5) */
  shortBreakDuration: number;
  /** Длительность длинного перерыва в минутах (по умолчанию 15) */
  longBreakDuration: number;
  /** Общее количество рабочих периодов (по умолчанию 12, от 4 до 24) */
  totalWorkPeriods: number;
  /** Включён ли звуковой сигнал */
  soundEnabled: boolean;
  /** Название выбранного звукового файла */
  selectedSound: string;
}

/**
 * Текущее состояние таймера
 * Сохраняется в localStorage для восстановления после перезагрузки
 */
export interface TimerState {
  /** Текущий этап (работа/короткий перерыв/длинный перерыв) */
  phase: TimerPhase;
  /** Оставшееся время в секундах */
  remainingTime: number;
  /** Запущен ли таймер в данный момент */
  isRunning: boolean;
  /** Количество завершённых рабочих периодов (помидоров) в текущей сессии */
  completedPomodoros: number;
  /** Номер текущего цикла (для отслеживания длинного перерыва) */
  currentCycle: number;
}

/**
 * Задача на день
 * Простая структура с возможностью расширения (теги, дедлайны и т.п.)
 */
export interface Task {
  /** Уникальный идентификатор задачи */
  id: string;
  /** Текст задачи */
  text: string;
  /** Выполнена ли задача */
  completed: boolean;
  /** Дата создания задачи (для сортировки) */
  createdAt: number;
  /** Порядок задачи для ручного перемещения */
  order: number;
}

/**
 * Глобальное состояние приложения
 * Хранится в AppContext и синхронизируется с localStorage
 */
export interface AppState {
  /** Настройки таймера */
  timerSettings: TimerSettings;
  /** Текущее состояние таймера */
  timerState: TimerState;
  /** Список задач на день */
  tasks: Task[];
  /** Текст заметок */
  notes: string;
  /** Активная вкладка (timer/tasks/notes) */
  activeTab: 'timer' | 'tasks' | 'notes';
}

/**
 * Типы действий для редюсера AppContext
 * Используется для типизации dispatch функции
 */
export type AppAction =
  | { type: 'SET_ACTIVE_TAB'; payload: 'timer' | 'tasks' | 'notes' }
  | { type: 'UPDATE_TIMER_SETTINGS'; payload: Partial<TimerSettings> }
  | { type: 'UPDATE_TIMER_STATE'; payload: Partial<TimerState> }
  | { type: 'ADD_TASK'; payload: string }
  | { type: 'TOGGLE_TASK'; payload: string }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'EDIT_TASK'; payload: { id: string; text: string } }
  | { type: 'REORDER_TASKS'; payload: Task[] }
  | { type: 'MOVE_TASK'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'SET_NOTES'; payload: string }
  | { type: 'RESET_POMODORO_COUNT' }
  | { type: 'RESET_COMPLETED_POMODOROS' };

/**
 * Тип контекста приложения
 * Включает состояние и функции для его обновления
 */
export interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}
