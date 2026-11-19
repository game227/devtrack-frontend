import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import axios, { AxiosError } from 'axios'
import { afterEach } from 'vitest'

// Unit tests never talk to a real server: a request a test forgot to mock fails at once, like a network
// error, instead of reaching whatever backend runs on this machine (VITE_API_BASE_URL from .env).
axios.defaults.adapter = (config) => Promise.reject(new AxiosError(`Network blocked in tests: ${config.url}`, 'ERR_NETWORK', config))

afterEach(() => {
  cleanup()
  try {
    localStorage.clear()
  } catch {
    // storage may be unavailable; tests do not depend on it
  }
})
