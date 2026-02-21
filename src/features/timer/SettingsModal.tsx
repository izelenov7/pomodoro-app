import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { TimerPhase } from '../../types';
import './SettingsModal.css';

/**
 * Пропсы компонента SettingsModal
 */
interface SettingsModalProps {
  /** Открыто ли модальное окно */
  isOpen: boolean;
  /** Функция закрытия модального окна */
  onClose: () => void;
}

/**
 * Опции звуков для выбора
 * Громкость: beep и chime на 20% тише остальных
 */
const SOUND_OPTIONS = [
  { value: 'beep', label: 'Одиночный сигнал (0.3 сек, тихий)' },
  { value: 'chime', label: 'Двойной сигнал (0.65 сек, тихий)' },
  { value: 'melody', label: 'Мелодия (2 сек, громкий)' },
  { value: 'bells', label: 'Колокола (3 сек, громкий)' },
];

/**
 * Модальное окно настроек таймера
 * 
 * Позволяет настроить:
 * - Длительность рабочего периода
 * - Длительность короткого перерыва
 * - Длительность длинного перерыва
 * - Количество циклов до длинного перерыва
 * - Включение/выключение звука
 * - Выбор звука
 * 
 * Изменения применяются только после нажатия кнопки "Сохранить"
 */
export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { state, dispatch } = useAppContext();
  
  // Локальное состояние для формы (чтобы изменения применялись после сохранения)
  const [formData, setFormData] = useState({
    workDuration: state.timerSettings.workDuration,
    shortBreakDuration: state.timerSettings.shortBreakDuration,
    longBreakDuration: state.timerSettings.longBreakDuration,
    totalWorkPeriods: state.timerSettings.totalWorkPeriods,
    soundEnabled: state.timerSettings.soundEnabled,
    selectedSound: state.timerSettings.selectedSound,
  });

  // Сбрасываем форму к текущим настройкам при открытии
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        workDuration: state.timerSettings.workDuration,
        shortBreakDuration: state.timerSettings.shortBreakDuration,
        longBreakDuration: state.timerSettings.longBreakDuration,
        totalWorkPeriods: state.timerSettings.totalWorkPeriods,
        soundEnabled: state.timerSettings.soundEnabled,
        selectedSound: state.timerSettings.selectedSound,
      });
    }
  }, [isOpen, state.timerSettings]);

  // Обработчик изменения числовых полей
  const handleNumberChange = (field: keyof typeof formData, min: number, max: number) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value >= min && value <= max) {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Обработчик изменения слайдера
  const handleSliderChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(event.target.value, 10);
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Обновляем заполнение слайдера
    const slider = event.target;
    const min = parseInt(slider.min, 10);
    const max = parseInt(slider.max, 10);
    const percentage = ((value - min) / (max - min)) * 100;
    slider.style.setProperty('--slider-fill', `${percentage}%`);
  };

  // Обновление заполнения слайдера при монтировании и изменении значения
  React.useEffect(() => {
    const slider = document.querySelector('.settings-modal__slider') as HTMLInputElement;
    if (slider) {
      const min = parseInt(slider.min, 10);
      const max = parseInt(slider.max, 10);
      const percentage = ((formData.totalWorkPeriods - min) / (max - min)) * 100;
      slider.style.setProperty('--slider-fill', `${percentage}%`);
    }
  }, [formData.totalWorkPeriods]);

  // Обработчик изменения переключателя звука
  const handleSoundEnabledChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, soundEnabled: event.target.checked }));
  };

  // Обработчик выбора звука
  const handleSoundChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, selectedSound: event.target.value }));
  };

  // Сохранение настроек
  const handleSave = () => {
    const newSettings = {
      workDuration: formData.workDuration,
      shortBreakDuration: formData.shortBreakDuration,
      longBreakDuration: formData.longBreakDuration,
      totalWorkPeriods: formData.totalWorkPeriods,
      soundEnabled: formData.soundEnabled,
      selectedSound: formData.selectedSound,
    };

    dispatch({
      type: 'UPDATE_TIMER_SETTINGS',
      payload: newSettings,
    });

    // Обновляем remainingTime если таймер не запущен
    if (!state.timerState.isRunning) {
      const newDuration = state.timerState.phase === TimerPhase.Work
        ? formData.workDuration * 60
        : state.timerState.phase === TimerPhase.ShortBreak
          ? formData.shortBreakDuration * 60
          : formData.longBreakDuration * 60;

      dispatch({
        type: 'UPDATE_TIMER_STATE',
        payload: { remainingTime: newDuration },
      });
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Настройки таймера" showCloseButton>
      <div className="settings-modal">
        {/* Длительность периодов */}
        <div className="settings-modal__section">
          <h3 className="settings-modal__section-title">Длительность периодов (мин)</h3>
          
          <Input
            type="number"
            min="1"
            max="120"
            label="Рабочий период"
            value={formData.workDuration}
            onChange={handleNumberChange('workDuration', 1, 120)}
          />

          <Input
            type="number"
            min="1"
            max="60"
            label="Короткий перерыв"
            value={formData.shortBreakDuration}
            onChange={handleNumberChange('shortBreakDuration', 1, 60)}
          />

          <Input
            type="number"
            min="1"
            max="60"
            label="Длинный перерыв"
            value={formData.longBreakDuration}
            onChange={handleNumberChange('longBreakDuration', 1, 60)}
          />
        </div>

        {/* Количество рабочих периодов */}
        <div className="settings-modal__section">
          <div className="settings-modal__slider-wrapper">
            <div className="settings-modal__slider-header">
              <label className="settings-modal__slider-label">
                Общее количество рабочих периодов
              </label>
              <span className="settings-modal__slider-value">{formData.totalWorkPeriods}</span>
            </div>
            <input
              type="range"
              min="4"
              max="24"
              step="1"
              value={formData.totalWorkPeriods}
              onChange={handleSliderChange('totalWorkPeriods')}
              className="settings-modal__slider"
            />
            <div className="settings-modal__slider-labels">
              <span>4</span>
              <span>24</span>
            </div>
          </div>
          <p className="settings-modal__hint">
            После каждых 4 периодов — длинный перерыв. По завершении всех периодов цикл начинается заново.
          </p>
        </div>

        {/* Настройки звука */}
        <div className="settings-modal__section">
          <h3 className="settings-modal__section-title">Звук</h3>
          
          <label className="settings-modal__checkbox">
            <input
              type="checkbox"
              checked={formData.soundEnabled}
              onChange={handleSoundEnabledChange}
            />
            <span>Включить звуковые уведомления</span>
          </label>

          <div className="settings-modal__sound-select">
            <label htmlFor="sound-select">Тип звука:</label>
            <select
              id="sound-select"
              value={formData.selectedSound}
              onChange={handleSoundChange}
              disabled={!formData.soundEnabled}
            >
              {SOUND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="settings-modal__actions">
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Сохранить
          </Button>
        </div>
      </div>
    </Modal>
  );
};
