import React, { useState, useRef, useEffect, useMemo } from 'react';
import './SuggestionBox.css';

/**
 * Universal SuggestionBox Component
 * @param {Array<string | {label: string, value: any}>} suggestions - List of suggestion items
 * @param {string} value - Current input display text
 * @param {function} onChange - Callback triggered on text typing or selection: onChange(value, selectedItem)
 * @param {string} placeholder - Input placeholder text
 */
export default function SuggestionBox({
  suggestions = [],
  value = '',
  onChange,
  placeholder = 'Type to search...', 
  style={{}}, 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // 1. Normalize suggestions to uniform object format { label, value, raw }
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

  // 2. Filter suggestions matching input text
  const filteredSuggestions = useMemo(() => {
    const search = (value || '').toLowerCase();
    return normalizedSuggestions.filter((item) =>
      item.label.toLowerCase().includes(search)
    );
  }, [normalizedSuggestions, value]);

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

  // Handle typing inside input
  const handleInputChange = (e) => {
    const text = e.target.value;
    if (onChange) onChange(text, null);
    setIsOpen(true);
  };

  // Handle item click selection
  const handleSelect = (item) => {
    if (onChange) onChange(item.label, item.raw);
    setIsOpen(false);
  };

  return (
    <div className="suggestion-box-container" ref={containerRef}>
      <input
        type="text"
        style={style}
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
      />

      {isOpen && filteredSuggestions.length > 0 && (
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
