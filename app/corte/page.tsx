'use client'
import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute';
type Totales = { total:number; pedidos:number; domicilio:number; pickup:number; tortillas:number }
type ItemRow = { _id:string; cantidad:number; ingreso:number }

export default function CortePage(){
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ totales: Totales; porItem: ItemRow[] } | null>(null)
  const [day, setDay] = useState<string>('') // YYYY-MM-DD

  async function load(d?: string){
    setLoading(true)
    const qs = d ? `?day=${d}` : ''
    const r = await fetch(`/api/reports/corte${qs}`, { cache: 'no-store' })
    const j = await r.json()
    setData({ totales: j.totales, porItem: j.porItem })
    setLoading(false)
  }

  useEffect(()=>{ load(); }, [])

  return (
    <ProtectedRoute allowedRoles={['caja', 'admin']}>
    <main className="grid gap-4">
      <div className="card flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">Corte de caja</div>
          <div className="text-sm text-zinc-400">Resumen del día o fecha seleccionada</div>
        </div>
        <div className="flex items-center gap-2">
          <input className="input" type="date" value={day} onChange={e=>setDay(e.target.value)} />
          <button className="btn" onClick={()=>load(day || undefined)}>Aplicar</button>
        </div>
      </div>

      {loading || !data ? (
        <div className="card text-sm text-zinc-400">Cargando…</div>
      ) : (
        <>
          <div className="grid md:grid-cols-4 gap-3">
            <div className="card">
              <div className="text-sm text-zinc-400">Pedidos</div>
              <div className="text-2xl font-bold">{data.totales.pedidos}</div>
            </div>
            <div className="card">
              <div className="text-sm text-zinc-400">Total del día</div>
              <div className="text-2xl font-bold">${data.totales.total}</div>
            </div>
            <div className="card">
              <div className="text-sm text-zinc-400">Domicilio</div>
              <div className="text-2xl font-bold">{data.totales.domicilio}</div>
            </div>
            <div className="card">
              <div className="text-sm text-zinc-400">Pick Up</div>
              <div className="text-2xl font-bold">{data.totales.pickup}</div>
            </div>
          </div>

          <div className="card">
            <div className="text-sm text-zinc-400 mb-2">Tortillas vendidas</div>
            <div className="text-xl font-bold">{data.totales.tortillas}</div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Por artículo</h3>
            <div className="grid gap-2">
              {data.porItem.length === 0 ? (
                <div className="text-sm text-zinc-400">Sin ventas.</div>
              ) : data.porItem.map(row=>(
                <div key={row._id} className="flex items-center justify-between bg-black/20 rounded-xl p-3">
                  <div className="font-semibold">{row._id}</div>
                  <div className="text-sm">Cantidad: {row.cantidad}</div>
                  {/* ingreso es por orden total; para exactitud por ítem se necesitaría prorratear */}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
    </ProtectedRoute>
  )
}
