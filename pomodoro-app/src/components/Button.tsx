import React from 'react';
import type { ButtonHTMLAttributes } from 'react';
import './Button.css';

/**
 * Пропсы компонента Button
 * Расширяют стандартные пропсы HTML-кнопки
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Вариант оформления кнопки */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  /** Размер кнопки */
  size?: 'small' | 'medium' | 'large';
  /** Иконка слева от текста */
  icon?: React.ReactNode;
}

/**
 * Универсальный компонент кнопки
 * 
 * Поддерживает различные варианты оформления через prop variant:
 * - primary: основная кнопка (акцентный цвет)
 * - secondary: вторичная кнопка (нейтральный цвет)
 * - danger: кнопка опасного действия (красный)
 * - ghost: невидимая кнопка (только при наведении)
 * 
 * @param props - Пропсы кнопки
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  icon,
  className = '',
  ...rest
}) => {
  const classes = `btn btn--${variant} btn--${size} ${className}`.trim();

  return (
    <button className={classes} {...rest}>
      {icon && <span className="btn__icon">{icon}</span>}
      {children && <span className="btn__text">{children}</span>}
    </button>
  );
};
