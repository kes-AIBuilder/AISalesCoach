import { createServerClient as _createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

function makeCookieHandlers(cookieStore: ReturnType<typeof cookies>) {
  return {
    getAll() {
      return cookieStore.getAll()
    },
    setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      } catch {}
    },
  }
}

export function createServerClient() {
  const cookieStore = cookies()
  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder',
    { cookies: makeCookieHandlers(cookieStore) }
  )
}

// Service Role 클라이언트 (API Route 전용 - RLS 우회)
export function createServiceClient() {
  const cookieStore = cookies()
  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder',
    { cookies: makeCookieHandlers(cookieStore) }
  )
}
