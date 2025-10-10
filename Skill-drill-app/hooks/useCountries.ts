import { useState, useEffect } from 'react'

interface Country {
  id: string
  name: string
  code: string
  phoneCode: string
  region: string
  flag: string
}

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true)
        const response = await fetch('http://localhost:3000/api/countries')
        
        if (!response.ok) {
          throw new Error('Failed to fetch countries')
        }
        
        const data = await response.json()
        
        if (data.success) {
          setCountries(data.data)
        } else {
          throw new Error(data.message || 'Failed to fetch countries')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchCountries()
  }, [])

  return { countries, loading, error }
}