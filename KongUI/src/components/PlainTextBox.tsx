import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface PlainTextBoxProps {
  text: string;
  onChange: (newText: string) => void;
  onDelete: () => void;
}

export function PlainTextBox({ text: initialText, onChange, onDelete }: PlainTextBoxProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [text, setText] = useState(initialText)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    onChange(newText);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = isExpanded ? `${textareaRef.current.scrollHeight}px` : '6rem';
    }
  }, [isExpanded, text]);

  return (
    <div className="h-72 w-full bg-white rounded-lg shadow transition-shadow duration-300 overflow-hidden">
      <textarea
        ref={textareaRef}
        className="w-full p-2 text-gray-700 border-none resize-none focus:outline-none"
        value={text}
        onChange={handleTextChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{ height: isExpanded ? 'auto' : '6rem', minHeight: '6rem' }}
      />
    </div>
  )
}