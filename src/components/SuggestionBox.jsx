import React, { useState, useRef, useEffect, useMemo } from 'react';
import './SuggestionBox.css';

/**
 * Universal SuggestionBox Component
 * 
 * @param {Array<string | {label: string, value: any}>} suggestions - Suggestion list
 * @param {function} onSelect - Callback when an item is chosen: onSelect(selectedItem)
 * @param {number} minCharsToSuggest - Minimum character count before dropdown opens (default: 1)
 * @param {boolean} clearOnSelect - If true, clears the input box text after selecting an item (default: false)
 * @param {object} style - Inline CSS styles for custom input formatting
 * @param {string} className - Additional CSS class name for the input box
 * @param {string} placeholder - Input placeholder text
 */
export default function SuggestionBox({
  suggestions = [],
  onSelect,
  minCharsToSuggest = 1,
  clearOnSelect = false,
  style = {},
  className = '',
  placeholder = 'Type to search...'
}) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // 1. Normalize suggestions array (handles both string[] and object[])
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

  // 3. Close dropdown when clicking outside
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
    // Optional clearing behavior on selection
    if (clearOnSelect) {
      setInputValue('');
    } else {
      setInputValue(item.label);
    }
    
    setIsOpen(false);

    if (onSelect) {
      onSelect(item.raw); // Pass original object or string back to parent
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
                e.preventDefault(); // Prevents blur event before click registers
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
