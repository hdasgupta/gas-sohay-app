import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import './SuggestionBox.css';

/**
 * Universal SuggestionBox Component
 * 
 * @param {Array<string | {label: string, value: any}>} suggestions - List of suggestions
 * @param {function} [onSelect] - Callback when an item is chosen: onSelect(selectedRawItem)
 * @param {function} [onChange] - Optional callback triggered on text edit: onChange(text)
 * @param {string} [value] - Optional controlled value (allows clearing from parent button)
 * @param {number} [minCharsToSuggest=1] - Minimum character threshold before showing suggestions
 * @param {boolean} [clearOnSelect=false] - If true, resets text field immediately after selection
 * @param {object} [style={}] - Custom inline CSS styles for input element
 * @param {string} [className=''] - Custom CSS class for input element
 * @param {string} [placeholder='Type to search...'] - Placeholder text
 */
export default function SuggestionBox({
  suggestions = [],
  onSuggSelect,
  onSuggChange,
  value: controlledValue,
  minCharsToSuggest = 0,
  clearOnSelect = false,
  style = {},
  className = '',
  placeholder = 'Type to search...'
}) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Active value switches between controlled prop and internal state
  const inputValue = isControlled ? controlledValue : internalValue;

  // Normalize suggestions into standard { label, value, raw } structure
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

  // Filter items based on minCharsToSuggest threshold
  const filteredSuggestions = useMemo(() => {
    const trimmed = (inputValue || '').trim();
    if (trimmed.length < minCharsToSuggest) {
      return [];
    }
    const search = trimmed.toLowerCase();
    return normalizedSuggestions.filter((item) =>
      item.label.toLowerCase().includes(search)
    );
  }, [normalizedSuggestions, inputValue, minCharsToSuggest]);

  // Close dropdown when clicking outside
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
    if (!isControlled) {
      setInternalValue(text);
    }
    setIsOpen(true);

    if (onChange) {
      onSuggChange(text);
    }
  };

  const handleSelect = (item) => {
    
    const nextText = clearOnSelect ? '' : item.label;

    alert(isControlled)
    if (!isControlled) {
      setInternalValue(nextText);
    }
    
    setIsOpen(false);
    alert(nextText)
    if (onSuggChange) {
      onSuggChange(nextText);
    }
    alert(onSuggSelect.toString())
    if (onSuggSelect) {
      onSuggSelect(item.raw);
    }
    alert(JSON.stringify(item));
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
                e.preventDefault(); // Prevents input blur before click event fires
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
