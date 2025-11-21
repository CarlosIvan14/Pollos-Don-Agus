import { NextResponse } from 'next/server'
import { clearSession } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  const res = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
  clearSession(res)
  return res
}
