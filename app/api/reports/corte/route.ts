import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Order from '@/models/Order'
import type { PipelineStage } from 'mongoose'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    const url = new URL(req.url)
    const day = url.searchParams.get('day') // ISO YYYY-MM-DD opcional

    const now = new Date()
    const start = day ? new Date(`${day}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const end = day ? new Date(`${day}T23:59:59.999`) : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    const pipeline: PipelineStage[] = [
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $facet: {
          totales: [
            {
              $group: {
                _id: null,
                total: { $sum: '$total' },
                pedidos: { $sum: 1 },
                domicilio: { $sum: { $cond: { if: '$delivery', then: 1, else: 0 } } },
                pickup: { $sum: { $cond: { if: '$delivery', then: 0, else: 1 } } },
                tortillas: { $sum: '$tortillasPacks' },
              }
            },
            { $project: { _id: 0 } }
          ],
          porItem: [
            { $unwind: '$items' },
            {
              $group: {
                _id: '$items.kind',
                cantidad: { $sum: '$items.qty' },
                // Nota: ingreso aquí es del total de la orden; si quieres ingreso por ítem exacto,
                // habría que prorratear o guardar precio por ítem en el documento.
                ingreso: { $sum: '$total' }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]

    const agg = await Order.aggregate(pipeline)
    const res = (agg && agg[0]) || {}
    const totales = res?.totales?.[0] || { total: 0, pedidos: 0, domicilio: 0, pickup: 0, tortillas: 0 }

    return NextResponse.json({ rango: { start, end }, totales, porItem: res?.porItem || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 })
  }
}
