import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import './Notes.css';

/**
 * Интерфейс отдельной заметки
 */
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Компонент редактора заметок
 *
 * Функциональность:
 * - Создание отдельных заметок с заголовками
 * - Автоматическое сохранение в localStorage
 * - Удаление заметок
 * - Просмотр списка заметок
 *
 * Заметки хранятся бессрочно и не привязаны к конкретному дню
 */
export const Notes: React.FC = () => {
  const { state, dispatch } = useAppContext();
  
  // Парсим заметки из текста (обратная совместимость)
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const parsed = JSON.parse(state.notes || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // Если это старый формат (просто текст), создаём одну заметку
      if (state.notes && state.notes.trim()) {
        return [{
          id: Date.now().toString(),
          title: 'Заметка',
          content: state.notes,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }];
      }
      return [];
    }
  });
  
  // Активная заметка (для редактирования)
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  
  // Локальное состояние для редактирования
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  
  // Реф для debounce сохранения
  const saveTimeoutRef = useRef<number | null>(null);

  // Сохранение заметок в контекст
  const saveNotes = useCallback((notesToSave: Note[]) => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = window.setTimeout(() => {
      dispatch({ type: 'SET_NOTES', payload: JSON.stringify(notesToSave) });
    }, 500);
  }, [dispatch]);

  // Создание новой заметки
  const handleCreateNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Новая заметка',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
    setActiveNoteId(newNote.id);
    setEditTitle(newNote.title);
    setEditContent(newNote.content);
  };

  // Выбор заметки для редактирования
  const handleSelectNote = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      setActiveNoteId(noteId);
      setEditTitle(note.title);
      setEditContent(note.content);
    }
  };

  // Обновление заголовка заметки
  const handleTitleChange = (title: string) => {
    setEditTitle(title);
    const updatedNotes = notes.map((note) =>
      note.id === activeNoteId
        ? { ...note, title, updatedAt: Date.now() }
        : note
    );
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
  };

  // Обновление содержимого заметки
  const handleContentChange = (content: string) => {
    setEditContent(content);
    const updatedNotes = notes.map((note) =>
      note.id === activeNoteId
        ? { ...note, content, updatedAt: Date.now() }
        : note
    );
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
  };

  // Удаление заметки
  const handleDeleteNote = (noteId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const updatedNotes = notes.filter((note) => note.id !== noteId);
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
    
    if (activeNoteId === noteId) {
      setActiveNoteId(null);
      setEditTitle('');
      setEditContent('');
    }
  };

  // Синхронизация при переключении вкладок
  useEffect(() => {
    if (!activeNoteId && notes.length > 0) {
      // Выбираем первую заметку если ни одна не выбрана
      handleSelectNote(notes[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Форматирование даты обновления
  const formatUpdatedAt = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Только что';
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} мин. назад`;
    }
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} ч. назад`;
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  return (
    <div className="notes">
      <div className="notes__header">
        <h1 className="notes__title">Заметки</h1>
        <Button
          variant="primary"
          size="small"
          onClick={handleCreateNote}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }
        >
          Новая
        </Button>
      </div>

      <div className="notes__container">
        {/* Список заметок */}
        <aside className="notes__sidebar">
          <div className="notes__list">
            {notes.length === 0 ? (
              <div className="notes__empty-list">
                <p>Нет заметок</p>
                <p className="notes__empty-hint">Создайте первую заметку</p>
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className={`notes__list-item ${activeNoteId === note.id ? 'notes__list-item--active' : ''}`}
                  onClick={() => handleSelectNote(note.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelectNote(note.id)}
                >
                  <div className="notes__list-item-header">
                    <span className="notes__list-item-title">{note.title || 'Без названия'}</span>
                    <button
                      className="notes__list-item-delete"
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      aria-label="Удалить заметку"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <p className="notes__list-item-preview">
                    {note.content.slice(0, 50) || 'Пустая заметка'}
                    {note.content.length > 50 ? '...' : ''}
                  </p>
                  <span className="notes__list-item-date">{formatUpdatedAt(note.updatedAt)}</span>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Редактор заметки */}
        <main className="notes__editor">
          {activeNoteId ? (
            <>
              <input
                type="text"
                className="notes__title-input"
                value={editTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Заголовок"
                aria-label="Заголовок заметки"
              />
              <textarea
                className="notes__content-textarea"
                value={editContent}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Текст заметки..."
                aria-label="Текст заметки"
                spellCheck={false}
              />
            </>
          ) : (
            <div className="notes__no-selection">
              <p>Выберите заметку или создайте новую</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
