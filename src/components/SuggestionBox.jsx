import React, { useState, useRef, useEffect, useMemo } from 'react';
import './SuggestionBox.css';

/**
 * Universal SuggestionBox Component
 * 
 * @param {Array<string | {label: string, value: any}>} suggestions - Suggestion array
 * @param {function} onSelect - Callback triggered when an option is clicked: onSelect(selectedItem)
 * @param {number} minCharsToSuggest - Minimum characters required before showing suggestions (default: 1)
 * @param {object} inputStyle - Custom inline CSS styles for the input box
 * @param {string} inputClassName - Additional CSS class name for the input box
 * @param {string} placeholder - Input placeholder text
 */
export default function SuggestionBox({
  suggestions = [],
  onSelect,
  minCharsToSuggest = 0,
  style = {},
  className = '',
  placeholder = 'Type to search...'
}) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // 1. Normalize items into a uniform structure: { label, value, raw }
  const normalizedSuggestions = useMemo(() => {
    return suggestions.map((item) => {
      if (typeof item === 'object' && item !== null) {
        return {
          label: String(item.label ?? item.value ?? ''),
          value: item.value ?? item.label,
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

  // 2. Filter suggestions using minCharsToSuggest threshold
  const filteredSuggestions = useMemo(() => {
    const trimmed = inputValue.trim();
    if (trimmed.length < minCharsToSuggest) {
      return [];
    }
    const search = trimmed.toLowerCase();
    return normalizedSuggestions.filter((item) =>
      item.label.toLowerCase().startsWith(search)
    );
  }, [normalizedSuggestions, inputValue, minCharsToSuggest]);

  // 3. Auto-close dropdown when clicking outside
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
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  const handleSelect = (item) => {
    setInputValue(item.label);
    setIsOpen(false);
    if (onSelect) {
      onSelect(item.raw); // Passes selected object or string to parent
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
              onClick={() => handleSelect(item)}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
