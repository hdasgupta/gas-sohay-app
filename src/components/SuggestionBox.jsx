import React, { useState, useRef, useEffect, useMemo } from 'react';
import './SuggestionBox.css';

/**
 * Universal SuggestionBox Component
 * 
 * @param {Array<string | {label: string, value: any}>} suggestions - List of options
 * @param {function} [onSelect] - Optional callback triggered on item click: onSelect(selectedRawItem)
 * @param {function} [onChange] - Optional callback triggered on input text change: onChange(text)
 * @param {number} [minCharsToSuggest=1] - Minimum characters required to start suggesting
 * @param {boolean} [clearOnSelect=false] - If true, clears the input field after selection
 * @param {object} [style={}] - Custom inline CSS styles for the input box
 * @param {string} [className=''] - Custom CSS class name for the input box
 * @param {string} [placeholder='Type to search...'] - Input placeholder string
 */
export default function SuggestionBox({
  suggestions = [],
  onSelect,
  onChange,
  minCharsToSuggest = 1,
  clearOnSelect = false,
  style = {},
  className = '',
  placeholder = 'Type to search...'
}) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // 1. Normalize items into a standard { label, value, raw } structure
  const normalizedSuggestions = useMemo(() => {
    if (!Array.isArray(suggestions)) return [];

    return suggestions.map((item) => {
      if (typeof item === 'object' && item !== null) {
        const labelText = String(item.label ?? item.name ?? item.title ?? item.value ?? '');
        return {
          label: labelText,
          value: item.value ?? item.id ?? labelText,
          raw: item
        };
      }
      return {
        label: String(item),
        value: item,
        raw: item
      };
    });
  }, [suggestions]);

  // 2. Filter items based on minCharsToSuggest threshold
  const filteredSuggestions = useMemo(() => {
    const trimmed = inputValue.trim();
    if (trimmed.length < minCharsToSuggest) {
      return [];
    }
    const search = trimmed.toLowerCase();
    return normalizedSuggestions.filter((item) =>
      item.label.toLowerCase().includes(search)
    );
  }, [normalizedSuggestions, inputValue, minCharsToSuggest]);

  // 3. Auto-close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputValue(text);
    setIsOpen(true);
    if (onChange) {
      onChange(text);
    }
  };

  const handleSelect = (item) => {
    const newText = clearOnSelect ? '' : item.label;
    setInputValue(newText);
    setIsOpen(false);

    if (onChange) {
      onChange(newText);
    }
    if (onSelect) {
      onSelect(item.raw);
    }
  };

  const showDropdown = isOpen && filteredSuggestions.length > 0;

  return (
    <div className="suggestion-box-container" ref={containerRef}>
      <input
        type="text"
        className={`suggestion-input ${className}`}
        style={style}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
      />

      {showDropdown && (
        <ul className="suggestion-dropdown">
          {filteredSuggestions.map((item, index) => (
            <li
              key={index}
              className="suggestion-item"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevents input blur before selection triggers
                handleSelect(item);
              }}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
