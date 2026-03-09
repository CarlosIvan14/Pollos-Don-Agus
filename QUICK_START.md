# 🔧 GUÍA RÁPIDA DE CONFIGURACIÓN

## Cambiar información del negocio (FÁCIL ✅)

**Archivo:** `public/config/business-config.json`

Solo edita estos campos:

```
Nombre del negocio
↓
"name": "Pollos Don Agus"

Dirección completa
↓
"address": "Altamirano 216, Puruándiro"

Descripción para página principal
↓
"description": "Pollo y costillas a la leña..."

Eslogan
↓
"tagline": "El sabor de casa, a la leña"

Historia del negocio
↓
"story": "Nació como negocio familiar..."

Horarios (formato 24h)
↓
"open": "10:00"   (hora apertura)
"close": "22:00"  (hora cierre)

Costo de envío a domicilio
↓
"fee": 20    (pesos mexicanos)

Colores (códigos hexadecimales)
↓
"primary": "#f59e0b"     (color principal)
"accent": "#ef4444"      (color acento)

Google Maps (copiar URL de embed)
↓
"embed": "https://www.google.com/maps/embed?pb=..."
```

## Cambiar idioma (SUPER FÁCIL ✅)

Click en los botones en la esquina superior derecha:
- 🇲🇽 ES = Español
- 🇺🇸 EN = English

Se guarda automáticamente en tu navegador.

## Archivo de configuración

📁 **Ubicación:** `/public/config/business-config.json`

Este archivo controla:
- ✅ Nombre y descripción del negocio
- ✅ Dirección y horarios
- ✅ Costo de envío
- ✅ Ubicación en mapa (Google Maps)
- ✅ Colores de la app
- ✅ Qué secciones mostrar/ocultar

**Nota:** Los cambios se ven al recargar la página. No necesita reiniciar el servidor.

## Archivos de traducción (MÁS AVANZADO)

Si necesitas agregar nuevas frases traducidas:

📁 `/lib/i18n/es.ts` → Textos en español
📁 `/lib/i18n/en.ts` → Textos en inglés

Cambios aquí requieren reiniciar el servidor.

## Cómo agregar textos nuevos

1. Abre `/lib/i18n/es.ts`
2. Agrega tu texto:
   ```typescript
   "nueva_opcion": "Mi texto en español",
   ```

3. Abre `/lib/i18n/en.ts`
4. Agrega traducción:
   ```typescript
   "nueva_opcion": "My text in English",
   ```

5. Reinicia el servidor (`npm run dev`)

6. Úsalo en el componente:
   ```typescript
   const { t } = useLanguage();
   <h1>{t.mi_seccion.nueva_opcion}</h1>
   ```

## Cambiar colores rápido

En `business-config.json`, busca:
```json
"colors": {
  "primary": "#f59e0b",        ← Color naranja
  "primaryLight": "#fbbf24",   ← Naranja claro
  "primaryDark": "#d97706",    ← Naranja oscuro
  "accent": "#ef4444",         ← Rojo acento
  "success": "#10b981",        ← Verde éxito
  "warning": "#f59e0b",        ← Naranja advertencia
  "error": "#ef4444"           ← Rojo error
}
```

Reemplaza con tus colores favoritos:
- Google "color picker" → elige → copia el código hex
- Pega en el archivo

**Ejemplo:**
```json
"primary": "#e74c3c"    // Rojo más bonito
"accent": "#3498db"      // Azul como acento
```

## Checklist actual

✅ Archivo de configuración creado
✅ Sistema de traducciones (ES + EN)
✅ Selector de idioma en header
✅ Página principal usa config
✅ Todo funciona sin código

## Próximos pasos opcionales

- [ ] Integrar colores del JSON a Tailwind (avanzado)
- [ ] Agregar más idiomas
- [ ] Editor visual para configuración
- [ ] Cargar config desde base de datos

---

¿Dudas? Revisa el archivo completo: `CONFIG_GUIDE.md`
