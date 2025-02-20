'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronUp, Plus, X, Square } from 'lucide-react'
import { ClickableToolTip } from './Tooltipv2'
import { IconButton } from '@/components/Tooltipv2';

interface TextBoxComponentProps {
  initValue: string;
  isLoading: boolean;
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleExpand: () => void;
  onAddItem: () => void;
  onRemove: () => void;
  onClick: () => void;
  iconButtons: IconButton[];
}

export function TextBox({ initValue, handleInputChange, onToggleExpand, onAddItem, onRemove, onClick, iconButtons, isLoading }: TextBoxComponentProps) {
  const [expanded, setExpanded] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const textBoxRef = useRef<HTMLDivElement>(null)

  const boxWidth = 500;

  const toggleExpand = () => {
    setExpanded(!expanded)
    onToggleExpand()
  }

  const handleFocus = () => {
    setIsFocused(true)
    onClick()
  }

  const handleBlur = (event: React.FocusEvent) => {
    if (!textBoxRef.current?.contains(event.relatedTarget as Node)) {
      setIsFocused(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (textBoxRef.current && !textBoxRef.current.contains(event.target as Node)) {
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div 
      ref={textBoxRef}
      className={`w-full max-w-[${boxWidth}px] mx-auto bg-gray-100 rounded-lg shadow-md transition-all duration-150 ${isFocused ? 'transform scale-[1.02] ring-1 ring-gray-300' : ''}`}
      onClick={handleFocus}
      tabIndex={0}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <div className="p-4 bg-gray-200 flex items-center justify-between">
        <ClickableToolTip 
          isLoading={isLoading}
          buttons={iconButtons}
        />
        <input
          type="text"
          onChange={handleInputChange}
          value={initValue}
          className="flex-grow bg-transparent text-gray-800 text-sm font-medium focus:outline-none ml-3"
        />
        <div className="flex items-center space-x-2">
          <button onClick={toggleExpand} className="text-gray-600 hover:text-gray-800">
            <ChevronUp className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
          <button onClick={onAddItem} className="text-gray-600 hover:text-gray-800">
            <Plus className="h-4 w-4" />
          </button>
          <button onClick={onRemove} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}