import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const COOKIE = 'session'
const SECRET = process.env.JWT_SECRET || 'dev-secret'

type Session = { role: 'admin'|'caja'; uid: string }

export function setSession(res: NextResponse, payload: Session) {
  const token = jwt.sign(payload, SECRET, { expiresIn: '12h' })
  res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60*60*12 })
}

export function clearSession(res: NextResponse) {
  res.cookies.set(COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 })
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE)?.value
  if (!token) return null
  try {
    return jwt.verify(token, SECRET) as Session
  } catch { return null }
}
