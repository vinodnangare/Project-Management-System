import React from 'react';
import '../styles/components/SearchBar.css';
import type { SearchBarProps } from '../types/components/SearchBarProps';

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  onClear,
  disabled = false,
  autoFocus = false,
  className = '',
}) => {
  const handleClear = () => {
    onChange('');
    onClear?.();
  };

  return (
    <div className={`search-bar ${className}`}>
      <span className="search-icon">🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className="search-input"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="search-clear"
          disabled={disabled}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default SearchBar;