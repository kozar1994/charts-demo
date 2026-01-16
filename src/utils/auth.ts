import axios from 'axios'
import { API_BASE_URL, MANUAL_SESSION_ID } from '../constants/api'

const isServer = typeof window === 'undefined'
// On server, we must use the full URL. On client, we use the proxy path.
const baseURL = isServer ? 'https://api.projectxxx.online' : API_BASE_URL

// Create a client instance
export const authClient = axios.create({
  baseURL,
  withCredentials: true, // For browser usage
})

// Add request interceptor to inject cookies manually in Node environment
authClient.interceptors.request.use((config) => {
  if (isServer && MANUAL_SESSION_ID) {
    config.headers.Cookie = `sessionId=${decodeURIComponent(MANUAL_SESSION_ID)}`
  }
  return config
})

let loginPromise: Promise<void> | null = null

export const ensureLoggedIn = async () => {
  console.log('START 2', loginPromise)

  if (loginPromise) return loginPromise

  if (MANUAL_SESSION_ID) {
    console.log('Skipping login, using manual session ID.')
    return
  }

  console.log('START 2.1')

  loginPromise = (async () => {
    try {
      console.log('Attempting to log in...')
      // This will set the session cookie on localhost via the Proxy
      await authClient.post('/auth', {
        username: 'test@test.com',
        password: 'supersecret',
      })
      console.log('Login successful')
    } catch (error) {
      console.error('Login failed:', error)
      loginPromise = null
      throw error
    }
  })()

  return loginPromise
}
