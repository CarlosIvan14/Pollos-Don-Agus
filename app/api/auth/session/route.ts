import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const s = await getSession()
  return NextResponse.json({ session: s || null })
}
