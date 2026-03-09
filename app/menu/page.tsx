// app/menu/page.tsx
"use client";

import Image from "next/image";
import { useLanguage } from "@/lib/useLanguage";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  priceLabel: string;
  imageSrc: string;
  badges?: string[];
  note?: string;
  disableOrder?: boolean;
};

export default function MenuPublicPage() {
  const { t } = useLanguage();

  const MENU_ITEMS: MenuItem[] = [
    {
      id: "pollo-completo",
      name: t.menu.items.polloCompleto.name,
      description: t.menu.items.polloCompleto.description,
      priceLabel: "$200",
      imageSrc: "/menu/pollo-completo.png",
      badges: t.menu.items.polloCompleto.badges,
    },
    {
      id: "medio-pollo",
      name: t.menu.items.medioPollo.name,
      description: t.menu.items.medioPollo.description,
      priceLabel: "$100",
      imageSrc: "/menu/medio-pollo.png",
      badges: t.menu.items.medioPollo.badges,
    },
    {
      id: "costillar-medio",
      name: t.menu.items.costillarMedio.name,
      description: t.menu.items.costillarMedio.description,
      priceLabel: "$100",
      imageSrc: "/menu/medio-costillar.png",
      badges: t.menu.items.costillarMedio.badges,
    },
    {
      id: "costillar-normal",
      name: t.menu.items.costillarNormal.name,
      description: t.menu.items.costillarNormal.description,
      priceLabel: "$200",
      imageSrc: "/menu/costillar.png",
      badges: t.menu.items.costillarNormal.badges,
    },
    {
      id: "costillar-grande",
      name: t.menu.items.costillarGrande.name,
      description: t.menu.items.costillarGrande.description,
      priceLabel: "$250–$300",
      imageSrc: "/menu/costillar-grande.png",
      badges: t.menu.items.costillarGrande.badges,
    },
    {
      id: "tortillas-extra",
      name: t.menu.items.tortillasExtra.name,
      description: t.menu.items.tortillasExtra.description,
      priceLabel: `$10 ${t.menu.labels.perPack}`,
      imageSrc: "/menu/tortillas.png",
    },
    {
      id: "pescuezos",
      name: t.menu.items.pescuezos.name,
      description: t.menu.items.pescuezos.description,
      priceLabel: `$10 ${t.menu.labels.perFive}`,
      imageSrc: "/menu/pescuezos.png",
      badges: t.menu.items.pescuezos.badges,
      note: t.menu.items.pescuezos.note,
      disableOrder: true,
    },
    {
      id: "salchichas",
      name: t.menu.items.salchichas.name,
      description: t.menu.items.salchichas.description,
      priceLabel: `$10 ${t.menu.labels.perFive}`,
      imageSrc: "/menu/salchichas.png",
      badges: t.menu.items.salchichas.badges,
      note: t.menu.items.salchichas.note,
      disableOrder: true,
    },
    {
      id: "lechon",
      name: t.menu.items.lechon.name,
      description: t.menu.items.lechon.description,
      priceLabel: t.menu.labels.variablePrice,
      imageSrc: "/menu/lechon.png",
      badges: t.menu.items.lechon.badges,
      note: t.menu.items.lechon.note,
      disableOrder: true,
    },
  ];

  return (
    <main className="space-y-8 md:space-y-10">
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
            <h1 className="text-3xl md:text-4xl font-semibold">{t.menu.title}</h1>

            <p className="text-sm md:text-base text-zinc-300">{t.menu.description}</p>

            <div className="flex flex-wrap gap-2 justify-center md:justify-start text-[11px] text-zinc-400">
              <span>{t.menu.chips.chicken}</span>
              <span>• {t.menu.chips.ribs}</span>
              <span>• {t.menu.chips.flavors}</span>
              <span>• {t.menu.chips.snacks}</span>
            </div>

            <div className="flex justify-center md:justify-start">
              <a
                href="/orden"
                className="btn px-4 py-2 text-xs md:text-sm bg-amber-600 border-amber-400 hover:bg-amber-500"
              >
                {t.menu.ctaOrder}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="card space-y-2 text-xs md:text-sm text-zinc-300">
        <h2 className="text-sm md:text-base font-semibold">{t.menu.flavorsTitle}</h2>
        <p>{t.menu.flavorsSubtitle}</p>
        <p className="text-[11px] md:text-xs text-zinc-200">{t.menu.flavorList.join(" • ")}</p>
        <p className="text-[11px] text-zinc-500">{t.menu.flavorsNote}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t.menu.productsTitle}</h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MENU_ITEMS.map((item) => (
            <article
              key={item.id}
              className="card flex flex-col overflow-hidden border border-zinc-800 hover:border-amber-500/70 hover:-translate-y-0.5 transition"
            >
              <div className="relative h-40 w-full overflow-hidden rounded-xl mb-3">
                <Image src={item.imageSrc} alt={item.name} fill className="object-cover" />
              </div>

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

              {!item.disableOrder && (
                <div className="pt-3 flex justify-end">
                  <a
                    href="/orden"
                    className="btn text-[11px] md:text-xs px-4 bg-zinc-900 hover:bg-zinc-800 border-zinc-700"
                  >
                    {t.menu.orderOnline}
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
