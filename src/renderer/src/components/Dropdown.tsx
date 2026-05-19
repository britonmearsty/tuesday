import { useState, useEffect, useRef, useCallback } from 'react'

interface DropdownOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface DropdownProps {
  options: DropdownOption[]
  value: string | number
  onChange: (value: string | number) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
}

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  style = {}
}: DropdownProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const selectedOption = options.find((option) => option.value === value)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
    return undefined
  }, [isOpen])

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }, [isOpen, disabled])

  const handleSelect = useCallback(
    (optionValue: string | number) => {
      onChange(optionValue)
      setIsOpen(false)
    },
    [onChange]
  )

  return (
    <div className={`dropdown-container ${className}`} style={{ position: 'relative', ...style }}>
      <button
        ref={buttonRef}
        type="button"
        className="dropdown-button"
        onClick={handleToggle}
        disabled={disabled}
        style={{
          width: '100%',
          height: '100%',
          padding: '12px 16px',
          borderRadius: '6px',
          background: disabled ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
          color: disabled ? '#666' : '#e6e6f0',
          border: 'none',
          fontSize: '14px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
          }
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          style={{
            transition: 'transform 0.15s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
            marginLeft: '8px'
          }}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="dropdown-menu hide-scrollbar"
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            right: '0',
            marginTop: '4px',
            background: 'rgba(20, 20, 21, 0.95)',
            backdropFilter: 'blur(15px)',
            WebkitBackdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            maxHeight: '300px',
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 1000
          }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              className={`dropdown-option ${option.disabled ? 'disabled' : ''} ${option.value === value ? 'selected' : ''}`}
              onClick={() => !option.disabled && handleSelect(option.value)}
              style={{
                padding: '8px 16px',
                cursor: option.disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                fontSize: '14px',
                color: option.disabled ? '#666' : option.value === value ? '#ef4444' : '#b0b0c0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                background: option.value === value ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                borderRadius: '0',
                borderLeft: 'none'
              }}
              onMouseEnter={(e) => {
                if (!option.disabled && option.value !== value) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  e.currentTarget.style.color = '#e6e6f0'
                }
              }}
              onMouseLeave={(e) => {
                if (!option.disabled && option.value !== value) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#b0b0c0'
                }
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
