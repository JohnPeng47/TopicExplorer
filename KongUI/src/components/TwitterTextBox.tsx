'use client'

import { useState } from 'react'
import { MessageCircle, Heart, Upload, BarChart2, ChevronDown, ChevronUp } from 'lucide-react'
import { DOCUMENT_HEIGHT } from '@/components/node/constants'

interface TwitterTextBoxProps {
  text: string;
  onChange: (newText: string) => void;
  onDelete: () => void;
}

export function TwitterTextBox({ text: initialText, onChange, onDelete }: TwitterTextBoxProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [text, setText] = useState(initialText)


  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    onChange(newText);
  };

  return (
    <div className={`${DOCUMENT_HEIGHT.twClassName} w-full bg-white rounded-lg ${isFocused ? 'shadow-lg' : 'shadow'} transition-shadow duration-300`}>
      <div className="p-4">
        <div className={`relative ${isExpanded ? 'h-auto' : 'h-24'} overflow-hidden`}>
          <textarea
            className="w-full p-2 text-gray-700 border-none resize-none focus:outline-none absolute top-0 left-0"
            value={text}
            onChange={handleTextChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{ height: '100%' }}
          />
        </div>
        {!isExpanded && (
          <button
            className="mt-2 text-blue-500 hover:text-blue-600 flex items-center"
            onClick={() => setIsExpanded(true)}
          >
            Show more <ChevronDown size={16} className="ml-1" />
          </button>
        )}
        {isExpanded && (
          <button
            className="mt-2 text-blue-500 hover:text-blue-600 flex items-center"
            onClick={() => setIsExpanded(false)}
          >
            Show less <ChevronUp size={16} className="ml-1" />
          </button>
        )}
        <div className="flex items-center justify-between mt-4 border-t pt-2">
          <div className="flex space-x-4">
            <button className="text-gray-500 hover:text-blue-500">
              <MessageCircle size={20} />
            </button>
            <button className="text-gray-500 hover:text-blue-500">
              <Heart size={20} />
            </button>
            <button className="text-gray-500 hover:text-blue-500">
              <Upload size={20} />
            </button>
            <button className="text-gray-500 hover:text-blue-500">
              <BarChart2 size={20} />
            </button>
            <button className="text-red-500 hover:text-red-600" onClick={onDelete}>
              Delete
            </button>
          </div>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-300">
            Tweet
          </button>
        </div>
      </div>
    </div>
  )
}