import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import './Input.css';

/**
 * Пропсы компонента Input
 * Расширяют стандартные пропсы HTML-input
 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Лейбл над полем ввода */
  label?: string;
  /** Текст ошибки */
  error?: string;
}

/**
 * Универсальный компонент поля ввода
 * 
 * Поддерживает:
 * - Лейбл над полем
 * - Отображение ошибки валидации
 * - Все стандартные атрибуты input
 * 
 * @param props - Пропсы поля ввода
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...rest }, ref) => {
    const inputId = rest.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`input-wrapper ${className}`.trim()}>
        {label && (
          <label htmlFor={inputId} className="input__label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`input ${error ? 'input--error' : ''}`.trim()}
          {...rest}
        />
        {error && <span className="input__error">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
