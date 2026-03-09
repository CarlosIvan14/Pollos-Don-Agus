# 📋 GUÍA DE CONFIGURACIÓN - Pollos Don Agus POS

## 🎯 Información del Negocio (Business Config)

La información del negocio se centraliza en el archivo:
```
/public/config/business-config.json
```

### ¿Cómo editar la información?

1. Abre el archivo `business-config.json`
2. Modifica los campos según necesites:

```json
{
  "business": {
    "name": "Pollos Don Agus",           // Nombre del negocio
    "address": "Dirección...",           // Dirección completa
    "description": "Descripción...",     // Descripción corta
    "shortDescription": "Breve...",      // Descripción más corta
    "story": "Historia del negocio...",  // Historia/Sobre nosotros
    "tagline": "Eslogan..."              // Eslogan/Lema
  },
  "hours": {
    "open": "10:00",                     // Hora abierto (formato 24h)
    "close": "22:00",                    // Hora cierre (formato 24h)
    "openingTime": "10:00 AM",           // Formato legible apertura
    "closingTime": "10:00 PM"            // Formato legible cierre
  },
  "contact": {
    "phone": "+52 (número)",             // Teléfono
    "email": "email@example.com"         // Email
  },
  "delivery": {
    "fee": 20,                           // Costo del envío ($)
    "minimumOrder": "Descripción mín"    // Requisito mínimo entrega
  },
  "colors": {
    "primary": "#f59e0b",                // Color primario (ámbar)
    "primaryLight": "#fbbf24",           // Color primario claro
    "primaryDark": "#d97706",            // Color primario oscuro
    "accent": "#ef4444",                 // Color acento (rojo)
    "success": "#10b981",                // Verde éxito
    "warning": "#f59e0b",                // Naranja advertencia
    "error": "#ef4444"                   // Rojo error
  },
  "google_maps": {
    "embed": "URL del embed de Google Maps"  // Para mostrar ubicación
  },
  "features": {
    "showOnlineOrders": true,            // Mostrar pedidos en línea
    "showPickup": true,                  // Mostrar opción recoger
    "showDelivery": true,                // Mostrar opción envío
    "showGallery": true,                 // Mostrar galería
    "showStory": true                    // Mostrar historia
  },
  "social": {
    "facebook": "url",                   // Facebook
    "instagram": "url",                  // Instagram
    "whatsapp": "url"                    // WhatsApp
  }
}
```

### Cambios que se aplican automáticamente:

- ✅ Nombre del negocio en la página principal
- ✅ Dirección en Google Maps
- ✅ Historia y tagline
- ✅ Horarios
- ✅ Costo de envío
- ✅ Todo se actualiza sin reiniciar la app

---

## 🌍 TRADUCCIONES (i18n)

### Sistema de Idiomas

El sistema soporta **Español (ES)** e **Inglés (EN)**.

### Archivos de traducción:
```
/lib/i18n/
├── index.ts          # Exporta traducciones
├── es.ts             # Traducciones al español
└── en.ts             # Traducciones al inglés
```

### Selector de idioma

En la **barra de navegación** (Header) encontrarás botones `🇲🇽 ES` y `🇺🇸 EN` para cambiar de idioma.

El idioma se guarda en `localStorage`, así que persiste entre sesiones.

### ¿Cómo agregar nuevas traducciones?

1. Abre `/lib/i18n/es.ts`
2. Agrega la nueva clave en la estructura:
```typescript
export const es = {
  nueva_seccion: {
    nueva_clave: "Texto en español",
  }
}
```

3. Repite lo mismo en `/lib/i18n/en.ts`:
```typescript
export const en = {
  nueva_seccion: {
    nueva_clave: "Text in English",
  }
}
```

4. Usa en componentes con:
```typescript
const { t } = useLanguage();
// Accede como: t.nueva_seccion.nueva_clave
```

### Estructura actual de traducciones:

```
nav          → Navegación (Ordenar, Menú, etc)
home         → Página principal
├── hero     → Sección hero
├── quickAccess → Accesos rápidos
├── featured → Productos destacados
├── story    → Historia del negocio
└── gallery  → Galería

order        → Página de pedidos
├── Campos de formulario
├── Validaciones
└── Mensajes de confirmación
```

---

## 🚀 Cómo usar traducciones en componentes

### Componente Cliente:
```typescript
'use client';

import { useLanguage } from '@/lib/useLanguage';

export default function MiComponente() {
  const { t, language, setLanguage } = useLanguage();

  return (
    <>
      <h1>{t.home.hero.title}</h1>
      <p>Idioma actual: {language}</p>
      <button onClick={() => setLanguage('en')}>
        Cambiar a inglés
      </button>
    </>
  );
}
```

---

## 🎨 Cómo cambiar colores del tema

1. Abre el archivo `/public/config/business-config.json`
2. Localiza la sección `"colors"`
3. Modifica los valores hexadecimales:

```json
"colors": {
  "primary": "#f59e0b",      // Cambia los valores según prefieras
  "primaryLight": "#fbbf24",
  "primaryDark": "#d97706",
  "accent": "#ef4444",
  "success": "#10b981",
  "warning": "#f59e0b",
  "error": "#ef4444"
}
```

**Nota:** Actualmente Tailwind utiliza valores hardcodeados (amber-500, etc). 
Para cambios de color más avanzados, se pueden crear variables CSS personalizadas.

---

## 📱 Estructura del Código

### Hooks creados:

1. **`useBusinessConfig()`** → Carga la configuración del negocio
   ```typescript
   const { config, error, loading } = useBusinessConfig();
   ```

2. **`useLanguage()`** → Accede a traducciones e idioma
   ```typescript
   const { t, language, setLanguage } = useLanguage();
   ```

### Contextos:

- **`LanguageProvider`** → Provee idioma a toda la app (envoltura en layout.tsx)

### Componentes:

- **`LanguageSwitcher`** → Selector de idioma en header

---

## ✅ Checklist de cambios

Todos los cambios que se pueden hacer sin editar código:

- [ ] Nombre del negocio → `business.name`
- [ ] Dirección → `business.address`
- [ ] Descripción → `business.description`
- [ ] Historia → `business.story`
- [ ] Horarios → `hours.open` y `hours.close`
- [ ] Costo envío → `delivery.fee`
- [ ] Colores → `colors.*`
- [ ] Google Maps → `google_maps.embed`
- [ ] Idioma → Click en selector (persiste en navegador)

---

## 🔧 Ejemplos prácticos

### Cambiar nombre y dirección:
```json
{
  "business": {
    "name": "Mi Nuevo Restaurante",
    "address": "Calle Principal 123, Ciudad"
  }
}
```

### Cambiar colores a más vibrante:
```json
{
  "colors": {
    "primary": "#e74c3c",      // Rojo brillante
    "primaryLight": "#ec7063",
    "primaryDark": "#c0392b",
    "accent": "#f39c12"        // Naranja
  }
}
```

### Cambiar horarios:
```json
{
  "hours": {
    "open": "09:00",        // Abre a las 9 AM
    "close": "23:00",       // Cierra a las 11 PM
    "openingTime": "9:00 AM",
    "closingTime": "11:00 PM"
  }
}
```

---

## 📝 Notas importantes

- Todos los cambios en `business-config.json` se cargan automáticamente (sin rebuild)
- El idioma se guarda localmente en el navegador del usuario
- Las nuevas traducciones requieren editar archivos TypeScript y redeploy
- La configuración se carga de forma asíncrona (verifica `loading` y `error`)

---

## 🆘 Solución de problemas

**❌ "Error al cargar la configuración"**
- Verifica que `/public/config/business-config.json` exista
- Valida que el JSON esté correctamente formado

**❌ "Las traducciones no cambian"**
- Asegúrate de estar usando el hook `useLanguage()`
- Verifica que el componente sea marcado como `'use client'`

**❌ "El idioma se reinicia al recargar"**
- Es normal si el setting está deshabilitado en el navegador
- Los datos se guardan en localStorage

---

¡Listo para usar! 🎉
