'use client'
import { useState } from 'react'

export default function LoginPage(){
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)

  async function onSubmit(e: React.FormEvent){
    e.preventDefault()
    setLoading(true); setError(null)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ pin })
    })
    if (res.ok) {
      const j = await res.json()
      // redirigir por rol
      if (j?.role === 'admin') window.location.href = '/admin'
      else if (j?.role === 'caja') window.location.href = '/caja'
      else window.location.href = '/'
    } else {
      const j = await res.json().catch(()=>null)
      setError(j?.error || 'PIN inválido')
    }
    setLoading(false)
  }

  return (
    <main className="max-w-md mx-auto">
      <div className="card">
        <h1 className="text-xl font-semibold mb-3">Iniciar sesión</h1>
        <form onSubmit={onSubmit} className="grid gap-3">
          <input
            className="input"
            type="password"
            placeholder="PIN"
            value={pin}
            onChange={e=>setPin(e.target.value)}
          />
          {error && <div className="text-rose-400 text-sm">{error}</div>}
          <button className="btn h-12 text-lg disabled:opacity-50" disabled={loading || !pin}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}
