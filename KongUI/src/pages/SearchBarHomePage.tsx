import { useState, useEffect } from 'react'
import { useContext } from "use-context-selector"
import { BackendContext } from "@/network/BackendProvider"
import { SearchBar, Suggestion } from '../components/SearchBar'
import { useNavigate, useSearchParams } from 'react-router-dom' // Add useSearchParams

export default function SearchBarHomePage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const { backend } = useContext(BackendContext)
  const navigate = useNavigate()

  const [searchParams] = useSearchParams() // Add this line
  const defaultSearch = searchParams.get('query') || '' // Add this line


  useEffect(() => {
    fetchSuggestions()
  }, [])

  const fetchSuggestions = async () => {
    try {
      const response = await backend.getMetadaList();
      const suggested = response.data.map(item => ({ title: item.metadata.title, id: item.id }));
           
      setSuggestions(suggested.slice(0, 5))
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    }
  }

  const executeSearch = async (query: string) => {
    console.log(`Searching for: ${query}`);
    try {
      const response = await backend.createGraph(query, query);
      const newGraphId = response.data.graph_id;

      navigate(`/tree/${newGraphId}`);
    } catch (error) {
      console.error('Error creating graph:', error);
    }
  }

  const handleSuggestionClick = (suggestion: Suggestion) => {
    navigate(`/tree/${suggestion.id}`)
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <SearchBar 
        suggestions={suggestions} 
        executeSearch={executeSearch} 
        onSuggestionClick={handleSuggestionClick}
        defaultSearch={defaultSearch} // Add this line
      />
    </div>
  )
}