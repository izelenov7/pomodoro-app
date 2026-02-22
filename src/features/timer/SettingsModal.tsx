import React, { useState, useCallback } from 'react';
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
 * Опции звуков для выбора (отсортированы по длительности)
 */
const SOUND_OPTIONS = [
  { value: 'click', label: 'Клик (0.3 сек)' },
  { value: 'pop', label: 'Поп (0.5 сек)' },
  { value: 'chime', label: 'Перезвон (0.7 сек)' },
  { value: 'soft', label: 'Мягкий (0.8 сек)' },
  { value: 'piano', label: 'Фортепиано (1.2 сек)' },
  { value: 'ambient', label: 'Атмосферный (1.8 сек)' },
  { value: 'bells', label: 'Колокола (2.6 сек)' },
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
    soundVolume: state.timerSettings.soundVolume,
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
        soundVolume: state.timerSettings.soundVolume,
      });
    }
  }, [isOpen, state.timerSettings]);

  // Обновление заполнения слайдера громкости после открытия модального окна
  React.useEffect(() => {
    if (isOpen) {
      const volumeSlider = document.querySelector('.settings-modal__volume-slider') as HTMLInputElement;
      if (volumeSlider) {
        const min = parseInt(volumeSlider.min, 10);
        const max = parseInt(volumeSlider.max, 10);
        const percentage = ((state.timerSettings.soundVolume - min) / (max - min)) * 100;
        volumeSlider.style.setProperty('--slider-fill', `${percentage}%`);
      }
    }
  }, [isOpen, state.timerSettings.soundVolume]);

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
    // Слайдер рабочих периодов
    const workPeriodSlider = document.querySelector('.settings-modal__slider:not(.settings-modal__volume-slider)') as HTMLInputElement;
    if (workPeriodSlider) {
      const min = parseInt(workPeriodSlider.min, 10);
      const max = parseInt(workPeriodSlider.max, 10);
      const percentage = ((formData.totalWorkPeriods - min) / (max - min)) * 100;
      workPeriodSlider.style.setProperty('--slider-fill', `${percentage}%`);
    }

    // Слайдер громкости
    const volumeSlider = document.querySelector('.settings-modal__volume-slider') as HTMLInputElement;
    if (volumeSlider) {
      const min = parseInt(volumeSlider.min, 10);
      const max = parseInt(volumeSlider.max, 10);
      const percentage = ((formData.soundVolume - min) / (max - min)) * 100;
      volumeSlider.style.setProperty('--slider-fill', `${percentage}%`);
    }
  }, [formData.totalWorkPeriods, formData.soundVolume]);

  // Обработчик изменения переключателя звука
  const handleSoundEnabledChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, soundEnabled: event.target.checked }));
  };

  // Обработчик выбора звука
  const handleSoundChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, selectedSound: event.target.value }));
  };

  // Обработчик изменения громкости
  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    setFormData((prev) => ({ ...prev, soundVolume: value }));

    // Обновляем заполнение слайдера
    const slider = event.target;
    const min = parseInt(slider.min, 10);
    const max = parseInt(slider.max, 10);
    const percentage = ((value - min) / (max - min)) * 100;
    slider.style.setProperty('--slider-fill', `${percentage}%`);
  };

  // Обработчик кнопки прослушивания
  const handlePlaySound = useCallback(() => {
    if (!formData.soundEnabled) return;

    // Создаём аудио-контекст и воспроизводим звук
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioContext = new AudioContextClass();

    const volumeMultiplier = formData.soundVolume / 100;

    const playTone = (frequency: number, startTime: number, duration: number, baseVolume: number, type: OscillatorType = 'sine') => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.frequency.value = frequency;
      osc.type = type;

      const finalVolume = baseVolume * volumeMultiplier;

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(finalVolume, startTime + 0.05);
      gain.gain.setValueAtTime(finalVolume, startTime + duration - 0.05);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const playToneWithDecay = (frequency: number, startTime: number, duration: number, baseVolume: number) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.frequency.value = frequency;
      osc.type = 'triangle';

      const finalVolume = baseVolume * volumeMultiplier;

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(finalVolume, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const playPreview = () => {
      switch (formData.selectedSound) {
        case 'click':
          playToneWithDecay(1000, audioContext.currentTime, 0.3, 0.5);
          break;
        case 'pop':
          playToneWithDecay(500, audioContext.currentTime, 0.4, 0.6);
          playToneWithDecay(800, audioContext.currentTime + 0.1, 0.3, 0.5);
          break;
        case 'chime':
          playToneWithDecay(523.25, audioContext.currentTime, 0.6, 0.5);
          playToneWithDecay(659.25, audioContext.currentTime + 0.08, 0.5, 0.4);
          playToneWithDecay(783.99, audioContext.currentTime + 0.15, 0.7, 0.4);
          break;
        case 'soft':
          playToneWithDecay(440, audioContext.currentTime, 0.6, 0.7);
          playToneWithDecay(880, audioContext.currentTime + 0.1, 0.5, 0.5);
          break;
        case 'piano':
          playToneWithDecay(523.25, audioContext.currentTime, 1.0, 0.6);
          playToneWithDecay(659.25, audioContext.currentTime + 0.05, 0.9, 0.5);
          playToneWithDecay(783.99, audioContext.currentTime + 0.1, 0.8, 0.5);
          playToneWithDecay(987.77, audioContext.currentTime + 0.15, 0.7, 0.4);
          break;
        case 'bells':
          playToneWithDecay(523.25, audioContext.currentTime, 1.5, 0.5);
          playTone(523.25 * 2, audioContext.currentTime, 0.8, 0.15, 'sine');
          playToneWithDecay(783.99, audioContext.currentTime + 0.5, 1.3, 0.4);
          playTone(783.99 * 1.5, audioContext.currentTime + 0.5, 0.7, 0.1, 'sine');
          playToneWithDecay(1046.50, audioContext.currentTime + 1.0, 1.6, 0.4);
          playTone(1046.50 * 1.5, audioContext.currentTime + 1.0, 0.9, 0.1, 'sine');
          break;
        case 'ambient':
          playTone(329.63, audioContext.currentTime, 1.5, 0.4, 'sine');
          playTone(493.88, audioContext.currentTime, 1.3, 0.25, 'sine');
          playTone(659.25, audioContext.currentTime + 0.3, 1.2, 0.5, 'triangle');
          playTone(987.77, audioContext.currentTime + 0.6, 1.0, 0.4, 'sine');
          break;
        default:
          playToneWithDecay(500, audioContext.currentTime, 0.4, 0.6);
          playToneWithDecay(800, audioContext.currentTime + 0.1, 0.3, 0.5);
      }
    };

    playPreview();

    // Закрываем контекст после воспроизведения
    setTimeout(() => {
      audioContext.close();
    }, 3000);
  }, [formData.soundEnabled, formData.selectedSound, formData.soundVolume]);

  // Сохранение настроек
  const handleSave = () => {
    const newSettings = {
      workDuration: formData.workDuration,
      shortBreakDuration: formData.shortBreakDuration,
      longBreakDuration: formData.longBreakDuration,
      totalWorkPeriods: formData.totalWorkPeriods,
      soundEnabled: formData.soundEnabled,
      selectedSound: formData.selectedSound,
      soundVolume: formData.soundVolume,
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

          <div className="settings-modal__volume-control">
            <div className="settings-modal__volume-header">
              <label className="settings-modal__slider-label">
                Громкость звука
              </label>
              <span className="settings-modal__slider-value">{formData.soundVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={formData.soundVolume}
              onChange={handleVolumeChange}
              className="settings-modal__slider settings-modal__volume-slider"
              disabled={!formData.soundEnabled}
            />
            <div className="settings-modal__volume-buttons">
              <button
                type="button"
                className="settings-modal__preview-btn"
                onClick={handlePlaySound}
                disabled={!formData.soundEnabled}
                title="Прослушать выбранный звук"
              >
                🔊 Прослушать
              </button>
            </div>
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
