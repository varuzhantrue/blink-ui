import client from './client'

export function login(username, password) {
  return client.post('/api/auth/login', { username, password })
}

export function signup(username, password) {
  return client.post('/api/auth/signup', { username, password })
}
