# Pollos Don Agus — POS & Pedidos

Aplicación web responsive (Next.js + Tailwind + MongoDB) para:
- **Cliente**: pedir sin cuenta, ver total a pagar en efectivo, compartir ubicación.
- **Caja**: registrar venta rápida con botones grandes; elegir local/domicilio; tortillas; total.
- **Administrador**: ver pedidos en tiempo real, próximos ajustes de inventario/precios.
- **Notificaciones**: suena una alarma (beep) y vibración cuando entra un pedido (SSE).

## Requerimientos
- Node 18+
- MongoDB 6+

## Setup
```bash
pnpm i # o npm/yarn
cp .env.example .env
pnpm run seed
pnpm run dev
```
Abre http://localhost:3000

- **Login**: /login con rol `caja` (PIN por defecto 1111) o `admin` (1234).
- **Cliente**: /orden (no requiere cuenta).

## Reglas de negocio
- Precios pickup:
  - Pollo completo $200
  - 1/2 Pollo $100
  - 1/2 Costillar $100
  - Costillar $200
  - Costillar Grande $250–$300 (ajustable desde código por ahora)
- Envío a domicilio: **+$20 por unidad**.
- Entrega a domicilio **sólo si**: 1 pollo completo **o** 1 costillar (normal/grande) **o** combo **1/2 pollo + 1/2 costillar**.
- Tortillas: $10 por paquete (por pedido).

## Estructura
- `app/` páginas (App Router)
- `app/api/` endpoints (pedidos, SSE, corte de caja, login)
- `lib/` conexión DB, auth (JWT cookie), precios, SSE
- `models/` Mongoose models (User, Order, CashClose)
- `components/` UI reusables
- `scripts/seed.ts` crea usuarios por defecto (PINs).

## Pendientes / Roadmap
- Inventario (entradas/salidas), habilitar/deshabilitar productos y sabores.
- Panel admin para editar precios y reglas (p. ej. si el +$20 es por pedido).
- Estados del pedido con cambio desde admin/caja (pendiente → confirmado → en ruta → entregado).
- Impresión/compartir ticket.
- Historial y exportación de corte de caja.
- Soporte PWA y sonido de notificación con permiso de autoplay.
- Validación con Zod en los endpoints.

## Nota
Este starter es funcional pero minimalista. Ajusta colores/branding, agrega tu logo y refina flujos según tu operación real.
