import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import './Layout.css';

/**
 * Тип активной вкладки
 */
type TabId = 'timer' | 'tasks' | 'notes';

/**
 * Конфигурация вкладок навигации
 */
const TABS: Array<{
  id: TabId;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'timer',
    label: 'Таймер',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: 'tasks',
    label: 'Задачи',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    id: 'notes',
    label: 'Заметки',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
];

/**
 * Пропсы компонента Layout
 */
interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Основной компонент макета приложения
 *
 * Содержит:
 * - Верхнюю навигационную панель с табами
 * - Область контента для активного раздела
 *
 * Переключение между вкладками происходит без перезагрузки страницы
 * Таймер продолжает работать в фоне при переключении
 */
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { state, dispatch } = useAppContext();

  /**
   * Обработчик переключения вкладки
   */
  const handleTabChange = (tabId: TabId) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tabId });
  };

  return (
    <div className="layout">
      {/* Навигационная панель */}
      <nav className="layout__nav" role="tablist" aria-label="Навигация по разделам">
        {TABS.map((tab) => {
          const isActive = state.activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`layout__tab ${isActive ? 'layout__tab--active' : ''}`.trim()}
              onClick={() => handleTabChange(tab.id)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
            >
              <span className="layout__tab-icon">{tab.icon}</span>
              <span className="layout__tab-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Область контента */}
      <main className="layout__content" role="tabpanel">
        {children}
      </main>
    </div>
  );
};
