import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'
import { setSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    const { pin } = await req.json()
    if (!pin) return NextResponse.json({ error: 'PIN requerido' }, { status: 400 })

    // busca por rol admin o caja donde coincida el PIN
    // (asume que el seed creó usuarios con hash de PIN)
    const users = await User.find({ role: { $in: ['admin','caja'] } }).lean()
    const match = await (async () => {
      for (const u of users) {
        if (await bcrypt.compare(pin, u.pinHash)) return u
      }
      return null
    })()

    if (!match) return NextResponse.json({ error: 'PIN inválido' }, { status: 401 })

    const res = NextResponse.json({ ok: true, role: match.role })
    setSession(res, { role: match.role, uid: String(match._id) }) // cookie httpOnly
    return res
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 })
  }
}
