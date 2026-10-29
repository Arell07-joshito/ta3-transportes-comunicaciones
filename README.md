# TA3 · Gastos de los hogares en transportes y comunicaciones (módulo 604, 2025)

Presentación web interactiva del reporte. Es una página estática (HTML + CSS + JavaScript, sin librerías externas).

## Archivos
- `index.html` — estructura de la página
- `styles.css` — diseño (tema claro/oscuro, responsive)
- `script.js` — gráficos interactivos y filtros
- `datos.js` — resultados calculados en Google Colab (ENAHO 2025, módulo 604)

## Cómo publicarla en GitHub Pages
1. Crea una cuenta en https://github.com (si aún no tienes) y pulsa **New repository**.
2. Nombre sugerido: `ta3-transportes-comunicaciones` · visibilidad **Public** · **Create repository**.
3. Pulsa **uploading an existing file** y arrastra `index.html`, `script.js`, `styles.css`, `datos.js` y `README.md` → **Commit changes**.
4. Ve a **Settings → Pages**. En *Build and deployment* elige **Deploy from a branch**, rama `main`, carpeta `/ (root)` → **Save**.
5. En 1–2 minutos la página estará en:

   `https://TU-USUARIO.github.io/ta3-transportes-comunicaciones/`

## Enlaces (reemplaza TU-USUARIO por tu usuario de GitHub)
- Repositorio: https://github.com/TU-USUARIO/ta3-transportes-comunicaciones
- Página publicada: https://TU-USUARIO.github.io/ta3-transportes-comunicaciones/

Después, abre `datos.js` y edita las dos primeras constantes (`REPO_URL` y `GITHUB_URL`) para que los botones de la página apunten a tus enlaces reales.
