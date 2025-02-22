import React, { useState, useEffect } from 'react'
import { Search } from "lucide-react"

interface SearchBarProps {
  suggestions: string[]
}

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'ghost' | 'default', size?: 'icon' | 'default' }>(
  ({ className, variant, size, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    const variantStyles = variant === 'ghost' ? "hover:bg-accent hover:text-accent-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
    const sizeStyles = size === 'icon' ? "h-10 w-10" : "h-10 px-4 py-2"
    
    return (
      <button
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export default function SearchBar() {
  const [search, setSearch] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 500) // Delay of 500ms before starting the fade-in
    return () => clearTimeout(timer)
  }, [])

  const suggestions = [
    "Who said live long and prosper?",
    "What is the Higgs Boson and why should I care?"
  ]

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 bg-white p-6 rounded-lg shadow-md">
      <div className={`flex items-center space-x-2 p-1 rounded-lg transition-all duration-1000 ease-in-out ${isLoaded ? 'bg-gray-100' : 'bg-transparent'}`}>
        <div className="relative flex-grow">
          <Input
            type="search"
            placeholder="Ask SciPhi AI anything ..."
            className="pl-4 pr-10 py-2 w-full bg-white text-gray-800 border-gray-200 rounded-md placeholder-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit" variant="ghost" size="icon" className="bg-white text-gray-600 hover:bg-gray-200 hover:text-gray-800">
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-sm hover:bg-gray-200 hover:text-gray-800 transition-colors"
            onClick={() => setSearch(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}