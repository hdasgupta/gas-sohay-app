import React, { useState, useRef, useEffect, useMemo } from 'react';
import './SuggestionBox.css';

/**
 * Universal SuggestionBox Component
 * 
 * @param {Array<string | {label: string, value: any}>} suggestions - List of items to filter
 * @param {string} value - Current input text
 * @param {function} onChange - Callback triggered on typing or selection: onChange(text, selectedItem)
 * @param {number} minCharsToSuggest - Minimum characters required before dropdown appears (default: 1)
 * @param {object} inputStyle - Custom inline styles for the input box
 * @param {string} inputClassName - Custom CSS class for the input box
 * @param {string} placeholder - Input placeholder string
 */
export default function SuggestionBox({
  suggestions = [],
  value = '',
  onChange,
  minCharsToSuggest = 0,
  style = {},
  className = '',
  placeholder = 'Type to search...'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // 1. Normalize input array (handles both string[] and object[])
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

  // 2. Filter suggestions based on value and minimum character threshold
  const filteredSuggestions = useMemo(() => {
    const trimmedVal = (value || '').trim();
    if (trimmedVal.length < minCharsToSuggest) {
      return [];
    }
    const search = trimmedVal.toLowerCase();
    return normalizedSuggestions.filter((item) =>
      item.label.toLowerCase().includes(search)
    );
  }, [normalizedSuggestions, value, minCharsToSuggest]);

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
    const text = e.target.value;
    if (onChange) onChange(text, null);
    setIsOpen(true);
  };

  const handleSelect = (item) => {
    if (onChange) onChange(item.label, item.raw);
    setIsOpen(false);
  };

  const shouldShowDropdown = isOpen && filteredSuggestions.length > 0;

  return (
    <div className="suggestion-box-container" ref={containerRef}>
      <input
        type="text"
        className={`suggestion-input ${className}`}
        style={style}
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
      />

      {shouldShowDropdown && (
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
