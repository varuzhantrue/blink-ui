import { useState, useEffect, useCallback } from 'react'
import { listFiles } from '../api/files'

export function useFiles() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await listFiles()
      setFiles(response.data)
    } catch {
      setError('Failed to load files.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  return { files, loading, error, refresh: fetchFiles }
}
