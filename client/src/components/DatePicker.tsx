import React from 'react';
import '../styles/components/DatePicker.css';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder,
  min,
  max,
  disabled = false,
  required = false,
  error,
  className = '',
}) => {
  return (
    <div className={`date-picker ${className} ${error ? 'has-error' : ''}`}>
      {label && (
        <label className="date-picker-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      
      <div className="date-picker-wrapper">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          disabled={disabled}
          required={required}
          className="date-picker-input"
        />
        <span className="date-picker-icon">📅</span>
      </div>

      {error && <span className="date-picker-error">{error}</span>}
    </div>
  );
};

export default DatePicker;