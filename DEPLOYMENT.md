# Publicacion de AventurIA

Este proyecto es una web estatica: `index.html`, `style.css` y scripts en `js/`. No necesita build.

## GitHub Pages

1. Sube este repositorio a GitHub.
2. En GitHub, abre `Settings -> Pages`.
3. En `Build and deployment`, elige:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
4. Guarda.
5. GitHub publicara la app en una URL parecida a:
   `https://TU_USUARIO.github.io/NOMBRE_DEL_REPO/`

## Flujo recomendado para iterar

- `main`: version estable publicada.
- `dev`: cambios en pruebas.
- ramas `feature/...`: experimentos concretos.

Cuando ChatGPT proponga cambios, pide siempre un patch o el archivo completo indicando el nombre exacto del archivo. Aplica los cambios en una rama distinta de `main`, prueba localmente y solo fusiona a `main` cuando funcione.

## Dependencias externas

El HTML carga Matter.js desde jsDelivr:

```html
<script src="https://cdn.jsdelivr.net/npm/matter-js@0.20.0/build/matter.min.js"></script>
```

Esto funciona online en GitHub Pages. Si en el futuro quieres que el editor funcione sin internet, conviene guardar una copia local de Matter.js y cambiar esa ruta.
