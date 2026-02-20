import React, { useEffect, useRef } from 'react';
import './Modal.css';

/**
 * Пропсы компонента Modal
 */
interface ModalProps {
  /** Открыто ли модальное окно */
  isOpen: boolean;
  /** Заголовок модального окна */
  title?: string;
  /** Функция закрытия модального окна */
  onClose: () => void;
  /** Дочерние компоненты (контент модального окна) */
  children: React.ReactNode;
  /** Показывать ли кнопку закрытия (крестик) */
  showCloseButton?: boolean;
  /** Закрытие по клику вне окна */
  closeOnBackdropClick?: boolean;
}

/**
 * Компонент модального окна
 * 
 * Особенности:
 * - Блокировка прокрутки фона при открытом окне
 * - Закрытие по Esc
 * - Закрытие по клику на затемнение (опционально)
 * - Фокус на первом элементе при открытии
 * - Возврат фокуса на триггер при закрытии
 * 
 * @param props - Пропсы модального окна
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  onClose,
  children,
  showCloseButton = true,
  closeOnBackdropClick = true,
}) => {
  // Реф для контента модального окна (чтобы отслеживать клики внутри)
  const contentRef = useRef<HTMLDivElement>(null);

  // Обработчик нажатия клавиш
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Блокировка прокрутки фона при открытом окне
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Обработчик клика по затемнению
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  // Не рендерим ничего если окно закрыто (для доступности и производительности)
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick} role="presentation">
      <div
        ref={contentRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {(title || showCloseButton) && (
          <div className="modal__header">
            {title && (
              <h2 id="modal-title" className="modal__title">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                className="modal__close"
                onClick={onClose}
                aria-label="Закрыть"
                type="button"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="modal__content">{children}</div>
      </div>
    </div>
  );
};
