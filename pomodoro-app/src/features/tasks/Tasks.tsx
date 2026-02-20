import { useState, KeyboardEvent } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import type { Task } from '../../types';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import './Tasks.css';

/**
 * Компонент списка задач на день
 * 
 * Функциональность:
 * - Добавление новых задач
 * - Отметка выполнения (чекбокс)
 * - Удаление задач
 * - Сохранение в localStorage через контекст
 * 
 * Новая задача добавляется по нажатию Enter или кнопки "+"
 */
export const Tasks: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [newTaskText, setNewTaskText] = useState('');

  /**
   * Обработчик добавления новой задачи
   * Добавляет задачу только если текст не пустой
   */
  const handleAddTask = () => {
    const text = newTaskText.trim();
    if (text) {
      dispatch({ type: 'ADD_TASK', payload: text });
      setNewTaskText('');
    }
  };

  /**
   * Обработчик нажатия клавиш в поле ввода
   * Добавляет задачу по нажатию Enter, предотвращает перенос строки
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Предотвращаем перенос строки
      handleAddTask();
    }
  };

  /**
   * Обработчик переключения статуса задачи
   */
  const handleToggleTask = (taskId: string) => {
    dispatch({ type: 'TOGGLE_TASK', payload: taskId });
  };

  /**
   * Обработчик удаления задачи
   */
  const handleDeleteTask = (taskId: string) => {
    dispatch({ type: 'DELETE_TASK', payload: taskId });
  };

  // Сортировка задач: сначала невыполненные, потом выполненные
  const sortedTasks = [...state.tasks].sort((a, b) => {
    if (a.completed === b.completed) {
      return b.createdAt - a.createdAt; // Новые сверху
    }
    return a.completed ? 1 : -1; // Выполненные внизу
  });

  // Подсчёт статистики
  const completedCount = state.tasks.filter((t) => t.completed).length;
  const totalCount = state.tasks.length;

  return (
    <div className="tasks">
      <div className="tasks__header">
        <h1 className="tasks__title">Задачи на день</h1>
        {totalCount > 0 && (
          <span className="tasks__stats">
            {completedCount} из {totalCount} выполнено
          </span>
        )}
      </div>

      {/* Форма добавления задачи */}
      <div className="tasks__add">
        <Input
          type="text"
          placeholder="Что нужно сделать?"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Новая задача"
        />
        <Button
          variant="primary"
          onClick={handleAddTask}
          disabled={!newTaskText.trim()}
          aria-label="Добавить задачу"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }
        />
      </div>

      {/* Список задач */}
      {sortedTasks.length === 0 ? (
        <div className="tasks__empty">
          <p>Список задач пуст</p>
          <p className="tasks__empty-hint">Добавьте первую задачу, чтобы начать продуктивный день!</p>
        </div>
      ) : (
        <ul className="tasks__list">
          {sortedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => handleToggleTask(task.id)}
              onDelete={() => handleDeleteTask(task.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

/**
 * Пропсы компонента TaskItem
 */
interface TaskItemProps {
  /** Задача для отображения */
  task: Task;
  /** Обработчик переключения статуса */
  onToggle: () => void;
  /** Обработчик удаления */
  onDelete: () => void;
}

/**
 * Компонент отдельной задачи в списке
 * 
 * @param props - Пропсы задачи
 */
const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete }) => {
  return (
    <li className={`task-item ${task.completed ? 'task-item--completed' : ''}`}>
      <label className="task-item__checkbox">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={onToggle}
          aria-label={`Отметить задачу "${task.text}" как выполненную`}
        />
        <span className="task-item__checkmark">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      </label>

      <span className="task-item__text">{task.text}</span>

      <Button
        variant="ghost"
        size="small"
        onClick={onDelete}
        className="task-item__delete"
        aria-label={`Удалить задачу "${task.text}"`}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        }
      />
    </li>
  );
};
