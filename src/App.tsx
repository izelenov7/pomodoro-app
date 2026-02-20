/**
 * Корневой компонент приложения
 *
 * Структура приложения:
 * - AppProvider (контекст для глобального состояния)
 *   - Layout (навигация и область контента)
 *     - Активный раздел (Timer / Tasks / Notes)
 *
 * Все данные сохраняются в localStorage через AppContext
 * Таймер продолжает работать в фоне при переключении между разделами
 */

import React from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { Layout } from './components/Layout';
import { Timer } from './features/timer/Timer';
import { Tasks } from './features/tasks/Tasks';
import { Notes } from './features/notes/Notes';
import './App.css';

/**
 * Компонент переключения разделов
 *
 * Отображает активный раздел на основе состояния в контексте
 * Используется внутри AppProvider для доступа к контексту
 */
const AppContent: React.FC = () => {
  const { state } = useAppContext();

  // Рендерим активный раздел
  const renderActiveTab = () => {
    switch (state.activeTab) {
      case 'timer':
        return <Timer />;
      case 'tasks':
        return <Tasks />;
      case 'notes':
        return <Notes />;
      default:
        return <Timer />;
    }
  };

  return (
    <Layout>
      {renderActiveTab()}
    </Layout>
  );
};

/**
 * Корневой компонент приложения
 *
 * Оборачивает всё приложение в AppProvider для доступа к глобальному состоянию
 */
const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
