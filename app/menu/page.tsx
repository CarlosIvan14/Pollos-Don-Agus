// app/menu/page.tsx
import Image from 'next/image';

type MenuItem = {
  id: string;
  name: string;
  description: string;
  priceLabel: string;
  imageSrc: string;
  badges?: string[];
  note?: string;
  disableOrder?: boolean; // <-- Para quitar botón de pedir
};

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'pollo-completo',
    name: 'Pollo completo',
    description:
      'Pollo entero asado o rostizado, ideal para compartir en familia. Acompáñalo con el sabor que prefieras.',
    priceLabel: '$200',
    imageSrc: '/menu/pollo-completo.png',
    badges: ['Más pedido', 'Asado / Rostizado'],
  },
  {
    id: 'medio-pollo',
    name: '1/2 Pollo',
    description:
      'Perfecto para un antojo individual o para compartir ligero. Sabor clásico de la casa.',
    priceLabel: '$100',
    imageSrc: '/menu/medio-pollo.jpg',
    badges: ['Asado / Rostizado'],
  },
  {
    id: 'costillar-medio',
    name: '1/2 Costillar',
    description:
      'Media orden de costillas a la leña, jugosas con el toque ahumado característico.',
    priceLabel: '$100',
    imageSrc: '/menu/medio-costillar.png',
    badges: ['Costillas a la leña'],
  },
  {
    id: 'costillar-normal',
    name: 'Costillar',
    description:
      'Costillas completas, cocinadas a la leña con tu sabor preferido. Ideal para compartir.',
    priceLabel: '$200',
    imageSrc: '/menu/costillar.png',
    badges: ['Recomendado', 'Costillas a la leña'],
  },
  {
    id: 'costillar-grande',
    name: 'Costillar grande',
    description:
      'Porción abundante de costillas a la leña para varios comensales. Perfecto para reuniones.',
    priceLabel: '$250–$300',
    imageSrc: '/menu/costillar-grande.png',
    badges: ['Para varios', 'Costillas a la leña'],
  },
  {
    id: 'tortillas-extra',
    name: 'Tortillas extra',
    description:
      'Paquete de tortillas para acompañar tus pollos y costillares. Nunca vienen de sobra.',
    priceLabel: '$10 por paquete',
    imageSrc: '/menu/tortillas.png',
  },
  {
    id: 'pescuezos',
    name: 'Pescuezos',
    description:
      'Orden de 5 pescuezos con sazón de la casa. Ideales como botana o complemento.',
    priceLabel: '$10 (5 pescuezos)',
    imageSrc: '/menu/pescuezos.png',
    badges: ['Solo sucursal'],
    note: 'Disponible solo en sucursal y únicamente algunos días. Sujeto a disponibilidad.',
    disableOrder: true,
  },
  {
    id: 'salchichas',
    name: 'Salchichas',
    description:
      'Orden de 5 salchichas doraditas, perfectas para acompañar tu comida.',
    priceLabel: '$10 (5 salchichas)',
    imageSrc: '/menu/salchichas.png',
    badges: ['Solo sucursal'],
    note: 'Disponible solo en sucursal y únicamente algunos días. Sujeto a disponibilidad.',
    disableOrder: true,
  },
  {
    id: 'lechon',
    name: 'Lechón',
    description:
      'Preparación especial de lechón para eventos y pedidos grandes. Cocción tradicional.',
    priceLabel: 'Precio variable',
    imageSrc: '/menu/lechon.png',
    badges: ['Pedido especial'],
    note:
      'Disponible solo bajo pedido anticipado. Contáctanos al 4381356612 para cotización y fechas.',
    disableOrder: true,
  },
];

const FLAVORS = [
  'Sinaloa (Natural)',
  'BBQ',
  'BBQ Picante',
  'Juan Gabriel',
  'Jalapeño',
  'Chipotle',
  'Niurka',
];

export default function MenuPublicPage() {
  return (
    <main className="space-y-8 md:space-y-10">
      
      {/* Hero */}
      <section className="card bg-gradient-to-r from-amber-800/70 via-zinc-900 to-black border border-amber-500/40 shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-6">
          
          <div className="shrink-0 rounded-2xl bg-black/40 p-2 border border-amber-500/40">
            <Image
              src="/logo.png"
              alt="Pollos Don Agus"
              width={80}
              height={80}
              className="rounded-xl"
            />
          </div>

          <div className="flex-1 space-y-3 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-semibold">
              Menú digital · Pollos Don Agus
            </h1>

            <p className="text-sm md:text-base text-zinc-300">
              Pollos asados, costillares a la leña, botanas especiales y más.
              Consulta precios y elige tu próximo antojo.
            </p>

            <div className="flex flex-wrap gap-2 justify-center md:justify-start text-[11px] text-zinc-400">
              <span>🍗 Pollos</span>
              <span>• 🦴 Costillas</span>
              <span>• 🔥 Sabores especiales</span>
              <span>• 🥖 Botanas</span>
            </div>

            <div className="flex justify-center md:justify-start">
              <a
                href="/orden"
                className="btn px-4 py-2 text-xs md:text-sm bg-amber-600 border-amber-400 hover:bg-amber-500"
              >
                Hacer pedido en línea
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Sabores */}
      <section className="card space-y-2 text-xs md:text-sm text-zinc-300">
        <h2 className="text-sm md:text-base font-semibold">
          Sabores disponibles
        </h2>
        <p>Pollos asados y costillares pueden prepararse con sabor:</p>
        <p className="text-[11px] md:text-xs text-zinc-200">
          {FLAVORS.join(' • ')}
        </p>
        <p className="text-[11px] text-zinc-500">
          * El pollo rostizado se sirve sin sabor extra.
        </p>
      </section>

      {/* Menú Cards */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Nuestros productos</h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MENU_ITEMS.map((item) => (
            <article
              key={item.id}
              className="card flex flex-col overflow-hidden border border-zinc-800 hover:border-amber-500/70 hover:-translate-y-0.5 transition"
            >
              {/* Imagen */}
              <div className="relative h-40 w-full overflow-hidden rounded-xl mb-3">
                <Image
                  src={item.imageSrc}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Contenido */}
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  
                  <div>
                    <h3 className="font-semibold text-base">{item.name}</h3>
                    {item.badges && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.badges.map((badge) => (
                          <span
                            key={badge}
                            className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-[2px] text-[10px] uppercase tracking-wide text-amber-200"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="text-sm font-bold text-amber-300 whitespace-nowrap">
                    {item.priceLabel}
                  </span>
                </div>

                <p className="text-sm text-zinc-400">{item.description}</p>

                {item.note && (
                  <p className="text-[11px] text-amber-200/90 border border-amber-500/40 bg-amber-950/40 rounded-md px-2 py-1">
                    {item.note}
                  </p>
                )}
              </div>

              {/* Botón — oculto para items especiales */}
              {!item.disableOrder && (
                <div className="pt-3 flex justify-end">
                  <a
                    href="/orden"
                    className="btn text-[11px] md:text-xs px-4 bg-zinc-900 hover:bg-zinc-800 border-zinc-700"
                  >
                    Pedir en línea
                  </a>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
