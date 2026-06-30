# Proyectos incluidos

Coloca aqui un proyecto exportado desde AventurIA para que la version online pueda cargarlo sin depender de la IndexedDB local del navegador.

Nombres reconocidos automaticamente:

- `default.ave`
- `default.json`

Flujo recomendado:

1. Abre la version local donde tienes el proyecto guardado en BD local.
2. Pulsa `Cargar localmente`.
3. Pulsa `Guardar como .ave`.
4. Guarda o copia ese archivo como `projects/default.ave` dentro de este repo.
5. Haz commit y push.

En la web online, el boton `Cargar proyecto incluido` cargara ese archivo. Si `Cargar localmente` no encuentra IndexedDB en el dominio online, tambien intentara cargar ese proyecto incluido como fallback.