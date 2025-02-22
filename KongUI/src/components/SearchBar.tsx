'use client'
import React, { useState, useEffect } from 'react'

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface Suggestion {
  title: string;
  id: string;
}

interface SearchBarProps {
  suggestions: Suggestion[];
  executeSearch: (query: string) => void;
  onSuggestionClick: (suggestion: Suggestion) => void;
  defaultSearch?: string; // Add this line
}

function SearchBar({ suggestions, executeSearch, onSuggestionClick, defaultSearch = '' }: SearchBarProps) {
  const [search, setSearch] = useState(defaultSearch) // Update this line
  const [isLoaded, setIsLoaded] = useState(false)

  console.log("Default search: ", defaultSearch)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 500) // Delay of 500ms before starting the fade-in

    return () => clearTimeout(timer)
  }, [])

  const handleSearch = () => {
    executeSearch(search);
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 bg-white p-6 rounded-lg shadow-md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Topic Explorer</h1>
        <p className="text-gray-600">Feed your curiosity</p>
      </div>
      <div className={`flex items-center space-x-2 p-1 rounded-lg transition-all duration-1000 ease-in-out ${isLoaded ? 'bg-gray-100' : 'bg-transparent'}`}>
        <div className="relative flex-grow">
          <Input
            type="search"
            placeholder="Explore the universe ..."
            className="pl-4 pr-10 py-2 w-full bg-white text-gray-800 border-gray-200 rounded-md placeholder-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
        </div>
        <Button 
          type="submit" 
          variant="ghost" 
          size="icon" 
          className="bg-white text-gray-600 hover:bg-gray-200 hover:text-gray-800"
          onClick={handleSearch}
        >
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-sm hover:bg-gray-200 hover:text-gray-800 transition-colors"
            onClick={() => onSuggestionClick(suggestion)}
          >
            {suggestion.title}
          </button>
        ))}
      </div>
    </div>
  )
}

export { SearchBar };
export type { Suggestion };