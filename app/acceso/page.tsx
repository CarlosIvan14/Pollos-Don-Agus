export default function Acceso(){
  return (
    <main className="grid gap-4">
      <section className="card">
        <h2 className="text-xl font-semibold">Accesos internos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
          <a className="card hover:ring-2 ring-brand/60" href="/login">
            <h3 className="text-lg font-semibold">Caja</h3>
            <p className="text-sm text-zinc-400">Entrar con PIN</p>
          </a>
          <a className="card hover:ring-2 ring-brand/60" href="/login">
            <h3 className="text-lg font-semibold">Administrador</h3>
            <p className="text-sm text-zinc-400">Entrar con PIN</p>
          </a>
          <a className="card hover:ring-2 ring-brand/60" href="/admin">
            <h3 className="text-lg font-semibold">Panel (si ya hay sesión)</h3>
            <p className="text-sm text-zinc-400">Pedidos en tiempo real</p>
          </a>
        </div>
      </section>
    </main>
  )
}
import { useState, useMemo } from 'react';