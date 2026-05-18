import axios from 'axios'
import { supabase } from './supabase'

const rawBase = (import.meta.env.VITE_API_URL || '').replace(/^['"`\s]+|['"`\s]+$/g, '')
const api = axios.create({
  baseURL: rawBase,
})

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  if (session?.provider_token) {
    config.headers['X-Provider-Token'] = session.provider_token
  }
  return config
})

export default api
