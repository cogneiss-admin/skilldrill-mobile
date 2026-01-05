import { useState, useEffect } from 'react'
import { apiService } from '../services/api'

interface Country {
  id: string
  name: string
  code: string
  phoneCode: string
  region: string
  flag: string
}

export const getConvertedFlagUrl = (flagUrl: string | null | undefined): string | undefined => {
  if (!flagUrl) return undefined;
  return flagUrl.replace('.svg', '.png').replace('flagcdn.com/', 'flagcdn.com/w20/');
};

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchCountries = async () => {
      try {
        setLoading(true)
        const res = await apiService.get<Country[]>('/countries')
        if (!isMounted) return
        if (res?.success) {
          setCountries((res.data as unknown as Country[]) || [])
        } else {
          setError(res?.message || 'Failed to fetch countries')
        }
      } catch (err: unknown) {
        if (!isMounted) return
        const e = err as { message?: string }
        setError(e?.message || 'Unknown error occurred')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchCountries()
    return () => { isMounted = false }
  }, [])

  return { countries, loading, error, getConvertedFlagUrl }
}