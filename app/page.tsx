"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/lib/useLanguage";
import { useBusinessConfig } from "@/lib/useBusinessConfig";

const gallery = [
  { id: 1, title: "", image: "/img/foto1.png" },
  { id: 2, title: "", image: "/img/foto2.png" },
  { id: 3, title: "", image: "/img/foto3.png" },
  { id: 4, title: "", image: "/img/foto4.png" },
];

const productImages = [
  "/img/foto4.png",
  "/img/foto3.png",
  "/img/combo.png",
];

export default function Home() {
  const { t } = useLanguage();
  const { config } = useBusinessConfig();

  if (!config) {
    return (
      <main className="space-y-8">
        <div className="text-center py-12 text-zinc-400">
          <p>Cargando configuración...</p>
        </div>
      </main>
    );
  }

  const featuredProducts = [
    {
      id: 1,
      name: t.home.featured.products.product1.name,
      description: t.home.featured.products.product1.description,
      price: "$220 MXN",
      tag: t.home.featured.products.product1.tag,
      image: productImages[0],
    },
    {
      id: 2,
      name: t.home.featured.products.product2.name,
      description: t.home.featured.products.product2.description,
      price: "$180 MXN",
      tag: t.home.featured.products.product2.tag,
      image: productImages[1],
    },
    {
      id: 3,
      name: t.home.featured.products.product3.name,
      description: t.home.featured.products.product3.description,
      price: "$420 MXN",
      tag: t.home.featured.products.product3.tag,
      image: productImages[2],
    },
  ];

  return (
    <main className="space-y-8">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl card bg-gradient-to-br from-amber-900/80 via-zinc-900 to-black">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_#fbbf24,_transparent_55%),radial-gradient(circle_at_bottom,_#ef4444,_transparent_55%)]" />

        <div className="relative grid gap-6 md:grid-cols-[1.4fr,1fr] items-center">
          {/* Texto principal */}
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-3xl md:text-4xl font-bold tracking-tight"
            >
              {t.home.hero.title.split(config.business.name)[0]}
              <span className="text-amber-400">{config.business.name}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-sm md:text-base text-zinc-300 max-w-xl"
            >
              {config.business.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="flex flex-wrap gap-3"
            >
              <a
                href="/orden"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold bg-amber-500 hover:bg-amber-400 transition shadow-lg shadow-amber-500/30"
              >
                {t.home.hero.buttonOrder}
                <span aria-hidden>🍗</span>
              </a>
              <a
                href="/menu"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border border-zinc-600 hover:border-amber-400 hover:text-amber-200 transition"
              >
                {t.home.hero.buttonMenu}
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="flex flex-wrap gap-4 text-xs text-zinc-400"
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {t.home.hero.onlineActive}
              </div>
              <div>• {t.home.hero.pickup} • {t.home.hero.delivery}</div>
            </motion.div>
          </div>

          {/* Video / preview del restaurante */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="aspect-video rounded-2xl overflow-hidden border border-zinc-700/60 bg-black/40 backdrop-blur shadow-2xl">
              <video
                className="h-full w-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              >
                <source src="/video/pollos.mp4" type="video/mp4" />
                Tu navegador no soporta video.
              </video>
            </div>
            <div className="absolute -bottom-3 -right-3 bg-zinc-900/90 border border-zinc-700 rounded-xl px-3 py-2 text-[11px] flex items-center gap-2">
              <span className="text-amber-400 text-base">🔥</span>
              {t.home.hero.woodFired}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ACCESOS RÁPIDOS PARA CLIENTES */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card ORDENAR */}
        <a
          className="card hover:ring-2 ring-amber-500/60 transition group flex flex-col gap-3"
          href="/orden"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-2xl" aria-hidden>
                🧾
              </span>
              <span>{t.home.quickAccess.order}</span>
            </h3>
          </div>

          <p className="text-sm text-zinc-400">
            {t.home.quickAccess.orderDesc}
          </p>

          <div className="mt-3 flex justify-between items-center text-xs text-zinc-500 group-hover:text-amber-200">
            <span className="flex items-center gap-2">
              {t.home.quickAccess.orderCta}
              <span aria-hidden>→</span>
            </span>
          </div>
        </a>

        {/* Card VER MENÚ */}
        <a
          className="card hover:ring-2 ring-amber-500/60 transition group flex flex-col gap-3"
          href="/menu"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-2xl" aria-hidden>
                📋
              </span>
              <span>{t.home.quickAccess.menu}</span>
            </h3>
          </div>

          <p className="text-sm text-zinc-400">
            {t.home.quickAccess.menuDesc}
          </p>

          <div className="mt-3 flex justify-between items-center text-xs text-zinc-500 group-hover:text-amber-200">
            <span className="flex items-center gap-2">
              {t.home.quickAccess.menuCta}
              <span aria-hidden>→</span>
            </span>
          </div>
        </a>
      </section>

      {/* PRODUCTOS DESTACADOS / MENÚ INTERACTIVO */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">{t.home.featured.title}</h2>
            <p className="text-xs text-zinc-400">
              {t.home.featured.subtitle}
            </p>
          </div>
          <a
            href="/menu"
            className="text-xs text-amber-400 hover:text-amber-300"
          >
            {t.home.featured.viewAll}
          </a>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {featuredProducts.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 250, damping: 17 }}
              onClick={() => {
                window.location.href = `/orden?producto=${item.id}`;
              }}
              className="text-left card flex flex-col overflow-hidden group"
            >
              <div className="relative overflow-hidden rounded-2xl mb-3 aspect-video">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 text-[11px] bg-black/60 px-2 py-1 rounded-full">
                  {item.tag}
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-sm font-semibold">{item.name}</h3>
                <p className="text-xs text-zinc-400 line-clamp-2">
                  {item.description}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-300">
                  {item.price}
                </span>
                <span className="text-[11px] text-zinc-400 group-hover:text-amber-200 flex items-center gap-1">
                  {t.home.featured.addOrder}
                  <span aria-hidden>＋</span>
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* HISTORIA DEL LUGAR / MAPA */}
      <section className="grid gap-4 md:grid-cols-[1.2fr,1fr] items-center">
        {/* Texto historia – rediseñado */}
        <div className="card h-full flex flex-col justify-center items-center md:items-start text-center md:text-left py-8 px-6 space-y-4">
          <h2 className="text-2xl md:text-3xl font-semibold">
            {config.business.tagline}
          </h2>
          <p className="mt-1 text-sm md:text-base text-zinc-300 max-w-2xl leading-relaxed">
            {config.business.story}
          </p>

          <ul className="mt-4 grid gap-2 text-sm text-zinc-200 md:grid-cols-1">
            <li>• {t.home.story.features.wood}</li>
            <li>• {t.home.story.features.ingredients}</li>
            <li>• {t.home.story.features.delivery}</li>
          </ul>
        </div>

        {/* Mapa */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-2">
            {t.home.story.location}
          </h3>

          <div className="aspect-video rounded-2xl overflow-hidden border border-zinc-700/70 bg-zinc-900">
            <iframe
              className="w-full h-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={config.google_maps.embed}
              allowFullScreen
            ></iframe>
          </div>

          <p className="mt-2 text-[11px] text-zinc-500">
            {config.business.address}
          </p>
        </div>
      </section>

      {/* GALERÍA DEL RESTAURANTE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">{t.home.gallery.title}</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {gallery.map((photo) => (
            <motion.div
              key={photo.id}
              whileHover={{ scale: 1.02 }}
              className="relative overflow-hidden rounded-2xl border border-zinc-700/70 bg-zinc-900/60"
            >
              <img
                src={photo.image}
                alt={photo.title}
                className="w-full h-40 object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-[11px] text-zinc-100">{photo.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
