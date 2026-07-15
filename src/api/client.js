import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    if (status === 401) {
      const onAuthPage = ['/login', '/signup'].some((p) =>
        window.location.pathname.startsWith(p),
      )
      if (!onAuthPage) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      // no uiMessage — page will redirect before any toast shows
    } else if (!error.response) {
      error.uiMessage = 'Could not reach the server. Please try again.'
    } else if (status === 403) {
      error.uiMessage = "You don't have permission to do that."
    } else if (status === 404) {
      error.uiMessage = 'File not found.'
    } else {
      error.uiMessage = 'Something went wrong. Please try again.'
    }

    return Promise.reject(error)
  },
)

export default client
