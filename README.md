# Adventure Editor v73 Prefab Logic Graphs

Versión corregida y ampliada del editor/motor de aventuras gráficas.

## Cambios principales

- Tipo de objeto `background` / `fondo`.
- Fondos con parallax opcional.
- El player ya puede recibir imagen desde el inspector de propiedades.
- Carga de assets separada:
  - imágenes
  - audio
- Acción rápida `playSound`.
- Nodos con audio.
- Botones reorganizados:
  - Arriba: Editor / Play / Nodos
  - Panel izquierdo: herramientas y creación de objetos
- Editor de nodos corregido:
  - nodos arrastrables
  - conexión salida → entrada
  - cables visibles
  - selección y borrado de conexiones
- Persistencia:
  - exportación/importación JSON
  - base de datos local IndexedDB

## Cómo usar el fondo

1. Importa una imagen.
2. Pulsa `+ Fondo`.
3. Selecciona el fondo en el outliner.
4. Asigna una imagen en el panel derecho.
5. Activa/desactiva parallax.
6. Ajusta `Factor X` y `Factor Y`.

Valores recomendados:
- fondo lejano: `0.02`
- fondo medio: `0.05`
- foreground cercano: `0.10` o más

## Cómo usar audio

1. Pulsa `Importar audio`.
2. Selecciona un objeto.
3. Asigna el audio en `Audio asociado`.
4. En acción rápida elige `Reproducir audio`.

También puedes usarlo desde nodos mediante `Acción: reproducir audio`.

## Cómo usar nodos

1. Pulsa `Nodos` arriba.
2. Añade nodos.
3. Arrastra desde el puerto amarillo de salida hasta el puerto azul de entrada.
4. Selecciona un nodo para editar sus propiedades.
5. En un objeto, pon acción `Ejecutar grafo visual`.
6. Crea un nodo `Evento: clic objeto` apuntando a ese objeto.
7. Conecta ese nodo a acciones posteriores.

## Nota de arquitectura

La app empieza a funcionar como un motor real:

- `assets.images`
- `assets.audio`
- `scenes`
- `objects`
- `navZones`
- `logic.nodes`
- `logic.links`
- `database.variables`
- `database.texts`
- `database.actions`

IndexedDB actúa como base de datos local de desarrollo. Para una versión grande convendría pasar a una estructura modular y quizá usar SQLite/WASM o un backend ligero si el editor se convierte en app multiusuario.


## Correcciones v4

- Los botones de importar imagen/audio y cargar JSON abren el diálogo del sistema con `.click()` explícito.
- El input de archivos queda oculto fuera de pantalla para evitar interferencias de CSS.
- Los objetos nuevos aparecen seleccionados y pueden arrastrarse inmediatamente en la escena.
- El arrastre de objetos ya no se pierde al hacer clic sobre la etiqueta.
- Los nodos ya se pueden mover correctamente: durante el arrastre solo se recalculan los cables, no se reconstruye todo el DOM.
- Las conexiones de nodos siguen la posición mientras se mueven.


## Correcciones v5

- Flujo alternativo sin drag desde asset:
  1. Importar imágenes.
  2. Seleccionar una miniatura.
  3. Pulsar `Crear objeto desde imagen` o `Asignar al seleccionado`.
- Doble clic sobre una miniatura crea un objeto directamente.
- El drag de objetos usa eventos globales de documento, por lo que no se corta aunque el cursor salga del objeto.
- El drag de nodos usa el mismo sistema robusto.
- Las miniaturas ya no dependen únicamente de `dataTransfer`, que puede fallar al abrir el archivo local en algunos navegadores/configuraciones.


## Cambios v6

- UX de imagen por objeto:
  - Selecciona objeto/player/fondo en escena u outliner.
  - En el panel derecho pulsa `Cargar imagen para este objeto`.
  - La imagen queda añadida a la biblioteca y asignada al objeto seleccionado.
- También puedes cargar audio directamente desde el panel derecho para el objeto seleccionado.
- Las zonas navegables ya no se dibujan en modo Play.
- Arrastre de objetos rehecho con eventos `mousedown/mousemove/mouseup` globales para máxima compatibilidad.
- Atajos de colocación:
  - Arrastrar objeto seleccionado en modo Editor.
  - Alt + clic en escena: coloca el objeto seleccionado ahí.
  - Clic derecho en escena: coloca el objeto seleccionado ahí.


## Cambios v7

- Corregida la causa principal del bloqueo de arrastre: la capa SVG de zonas navegables ya no captura el ratón salvo cuando la herramienta `Zona navegable` está activa.
- El fondo ahora funciona como capa real de fondo:
  - se dibuja primero
  - queda por detrás de objetos, player y hotspots
  - ocupa por defecto todo el escenario
- Nuevo ajuste de fondo en el inspector:
  - `Cover / cubrir`
  - `Fit / encajar`
  - `Stretch / estirar`
  - `Original`
  - `Tile / mosaico`
- Los fondos pueden tener parallax, pero siguen siendo una capa inferior.
- Si creas un fondo sin imagen, aparece como placeholder visible en editor.


## Cambios v8

- El fondo ya no captura el ratón en la escena.
- El fondo ya no es seleccionable ni arrastrable directamente desde la escena.
- El fondo se edita desde el outliner y el panel derecho.
- En modo Play, los clics atraviesan el fondo y vuelven a mover el player.
- Los objetos decorativos sin acción tampoco bloquean necesariamente el movimiento del player.


## Cambios v9: lógica visual más seria

### Categorías de nodos

- Eventos:
  - `eventClickObject`
  - `eventSceneStart`
- Entidades / datos:
  - `entityPlayer`
  - `entityObject`
  - `entityInventory`
- Acciones:
  - `actionPickup`
  - `actionShowMessage`
  - `actionPlaySound`
  - `actionGotoScene`
  - `actionSetState`
  - `actionShowObject`
  - `actionHideObject`
- Condiciones:
  - `conditionHasItem`
  - `conditionObjectState`
- Triggers / puzzles:
  - `triggerUseItemOnObject`
  - `triggerEnterZone`

### Caso probado

Puedes crear este flujo:

`Player` → `Recoger` → `Objeto`

Si el nodo `Objeto` apunta a un objeto de tipo item/prop de la escena, al probar el grafo ese objeto se oculta y se añade al inventario.

### Uso básico

1. Crea un objeto recogible en escena.
2. Entra en `Nodos`.
3. Añade nodo `Player`.
4. Añade nodo `Recoger`.
5. Añade nodo `Objeto` y asígnale el objeto desde el inspector.
6. Conecta `Player` → `Recoger` → `Objeto`.
7. Pulsa `Probar grafo`.

El proyecto guarda los nodos y conexiones dentro de:

```json
scene.logic.nodes
scene.logic.links
```

Esto ya permite serializar la lógica como datos y no como código escrito a mano.


## Cambios v10: conexiones funcionales

### Eliminación

- Botón `Borrar nodo`.
- Botón `Borrar conexión`.
- Tecla `Delete` borra el nodo o conexión seleccionados.

### Puertos reales

Los nodos ya no tienen una única entrada/salida genérica. Cada tipo define sus puertos:

- `flow`: controla el orden de ejecución.
- `data`: pasa referencias a objetos/items.

Ejemplos:

- `Recoger` tiene:
  - entrada `in`
  - entrada de dato `item`
  - salida `then`

- `Objeto` tiene:
  - salida de dato `object`
  - salida de flujo `then`

- `Tiene item` tiene:
  - entrada `in`
  - entrada de dato `item`
  - salidas `true` y `false`

### Flujo funcional

Ahora este grafo tiene efecto real:

`Player.then → Recoger.in`  
`Objeto.object → Recoger.item`

Al ejecutar el grafo, `Recoger` consulta su puerto de dato `item`, encuentra el objeto conectado y lo añade al inventario.

También funciona como flujo encadenado:

`Player.then → Recoger.in`  
`Recoger.then → Mostrar mensaje.in`  
`Objeto.object → Recoger.item`

### Nota importante

`Recoger` ya no necesita que le asignes un objeto directamente en su propia lista. Lo correcto es:

- conectar un nodo `Objeto` al puerto `I` de `Recoger`, o
- elegir el objeto en el nuevo campo `Item / objeto objetivo` del inspector.

Así se evita la confusión de que una acción deba “ser” un objeto.


## Corrección v11

- Corregido un error de sintaxis en `app.js` que impedía que el JavaScript cargara.
- El error hacía que ningún botón funcionara porque el navegador detenía la ejecución completa del script.
- Sintaxis comprobada con `node --check`.


## Cambios v12: eventos e inventario de juego

### Selector de eventos en nodos

Los nodos de evento/trigger ahora tienen un campo `Evento / trigger` con eventos habituales en aventuras gráficas y motores 2D:

- Mouse / interacción:
  - `on click`
  - `on double click`
  - `on hover enter`
  - `on hover exit`
  - `on use selected item`
  - `on examine / mirar`
- Zona / colisión:
  - `on enter`
  - `while inside`
  - `on exit`
- Escena:
  - `on scene start`
  - `on scene end`
- Inventario:
  - `on inventory select`
  - `on inventory use`
  - `on inventory combine`

En point & click suelen repetirse acciones como mirar/examinar, coger, hablar, usar item sobre objeto, cambiar escena, activar mecanismos y respuestas por defecto cuando el item usado no encaja. Herramientas comerciales como Adventure Creator separan interacciones normales e interacciones de inventario; algunos motores 2D usan áreas/collision objects para detectar clics o entrada/salida de zonas. citeturn757107search5turn757107search4

### Inventario visible en Play

- Los objetos recogidos aparecen en una barra inferior dentro de la escena.
- Puedes seleccionar un item del inventario.
- Al hacer clic sobre un objeto de la escena con un item seleccionado, el runtime busca un grafo con evento `on use selected item`.

### Recoger

Para que `Recoger` funcione:

Opción A:
- Nodo `Objeto` con el objeto que quieres recoger.
- Conecta `Objeto.object` → `Recoger.item`.
- Ejecuta el flujo hacia `Recoger.in`.

Opción B:
- Selecciona el nodo `Recoger`.
- En `Item / objeto objetivo`, elige el objeto a recoger.

Al ejecutarse, el objeto se oculta y se añade al inventario visible.


## Cambios v13: rediseño del sistema lógico de nodos

### Problema detectado

La lógica anterior mezclaba en un mismo campo tres conceptos distintos:

- categoría del nodo
- tipo concreto del nodo
- evento que lo activa

Eso hacía que nodos como `Inicio de escena` mostrasen parámetros que no necesitaban, y que `Recoger` pareciese necesitar un objeto principal cuando en realidad necesita un objeto/item objetivo.

### Nuevo modelo

Cada nodo tiene ahora:

```json
{
  "category": "event | entity | trigger | action | condition | data",
  "type": "sceneStart | player | onEnter | pickup | ...",
  "objectId": "objeto principal si aplica",
  "targetObjectId": "objeto/item objetivo si aplica",
  "event": "click | enter | inside | exit | useItem | ...",
  "value": "texto, estado o escena si aplica"
}
```

### Parámetros contextuales

El inspector oculta los campos que no corresponden:

- `Inicio de escena`: no muestra parámetros.
- `Player`: no necesita parámetros.
- `Trigger: on enter`: pide objeto/item objetivo.
- `Acción: recoger`: pide objeto/item objetivo.
- `Mostrar mensaje`: pide valor/texto.
- `Reproducir audio`: pide audio.

### Flujo recomendado para recoger al pasar por encima

Crea este grafo:

1. `Evento / Inicio de escena`
2. `Entidad / Player`
3. `Trigger / On enter` → en `Objeto / item objetivo`, elige el objeto que se recoge.
4. `Acción / Recoger` → en `Objeto / item objetivo`, elige el mismo objeto.

Conexiones:

```text
Inicio de escena.then → Player.in
Player.then → Trigger on enter.in
Player.object → Trigger on enter.actor
Trigger on enter.then → Recoger.in
```

La acción `Recoger` usa su propio `Objeto / item objetivo`, así que no es obligatorio conectarle un puerto de datos si ya lo eliges en el inspector.

### Lo que ya permite este modelo

- Eventos de escena.
- Eventos de clic.
- Triggers on enter / while inside / on exit.
- Acciones con parámetros limpios.
- Condiciones con salidas true/false.
- Inventario visible y uso de item seleccionado.
- Serialización clara de nodos y enlaces.


## Cambios v14: spritesheets y animaciones

- Cualquier imagen de objeto puede activarse como spritesheet.
- Se configuran ancho/alto de frame, columnas, filas, FPS y frame actual.
- Los clips se definen en JSON, por ejemplo:

```json
{
  "idle": { "from": 0, "to": 5, "fps": 8, "loop": true },
  "run": { "from": 6, "to": 12, "fps": 12, "loop": true }
}
```

- El motor anima desplazando `background-position` dentro del marco del objeto.
- Nuevos nodos:
  - `Acción / Reproducir animación`
  - `Acción / Detener animación`

Ejemplo:

```text
Inicio de escena → Player → Reproducir animación idle
Trigger on enter → Reproducir animación run
Clic en objeto → Reproducir animación pickup → Recoger
```


## Cambios v15: categoría propia de animación

Se añade una categoría independiente:

- `Animación / Reproducir clip`
- `Animación / Detener`
- `Animación / Ir a frame`
- `Animación / Pausar`
- `Animación / Reanudar`

Esto permite flujos más limpios:

```text
Evento: clic objeto
→ Acción: desplazar / mover a objeto
→ Animación: reproducir clip run
→ Acción: recoger
```

La categoría `Acción` queda para acciones de mundo/juego, y `Animación` queda para controlar spritesheets.

### Parámetros de animación

Los nodos de animación usan:

- `Objeto / item objetivo`: objeto cuya spritesheet se controla.
- `Animación / clip`: nombre del clip configurado en el objeto.
- `Valor`: solo para `Ir a frame`.

Los nodos antiguos `Acción / Reproducir animación` y `Acción / Detener animación` se mantienen como compatibilidad, pero la forma recomendada es usar la nueva categoría `Animación`.


## Cambios v16: categoría Input

Nueva categoría de nodos:

- `Input / Tecla pulsada`
- `Input / Tecla soltada`
- `Input / Tecla mantenida`
- `Input / Ratón pulsado`
- `Input / Ratón soltado`
- `Input / Movimiento ratón`
- `Input / Clic ratón`

### Uso típico

Para controlar animaciones con teclado:

```text
Input: tecla pulsada [ArrowRight]
→ Entidad: Player
→ Animación: reproducir clip [run]
```

Para volver a idle:

```text
Input: tecla soltada [ArrowRight]
→ Entidad: Player
→ Animación: reproducir clip [idle]
```

Para acciones mantenidas:

```text
Input: tecla mantenida [ArrowRight]
→ Acción: desplazar / mover a objeto
→ Animación: reproducir clip [run]
```

### Valores de input recomendados

- `ArrowLeft`
- `ArrowRight`
- `ArrowUp`
- `ArrowDown`
- `Space`
- `Enter`
- `KeyE`
- `KeyI`
- `mouse:left`
- `mouse:right`

Se aceptan tanto `KeyboardEvent.code` como algunas teclas por `KeyboardEvent.key`.


## Cambios v17

- `Auto flip X según dirección` por objeto/player.
- El player gira horizontalmente si se hace clic a su izquierda/derecha.
- Inventario desplegable con icono configurable.
- Slots máximos globales.
- Mensaje configurable cuando el inventario está lleno.
- La lógica de recoger objetos respeta la capacidad máxima del inventario.


## Cambios v18: optimización de movimiento

- El movimiento del player ya no reconstruye toda la escena en cada frame.
- Durante el movimiento solo se actualiza el `transform` del player.
- Los fondos con parallax se actualizan individualmente.
- Las spritesheets actualizan solo `background-position`.
- Se usa `translate3d()` y `will-change` para mejorar fluidez.
- El render completo queda reservado para cambios estructurales: añadir/quitar objetos, cambiar escena, cambiar propiedades, etc.


## Cambios v19: edición de zonas navegables

Ahora las zonas navegables no quedan fijas después de crearlas.

### Edición

1. Activa `Zona navegable`.
2. Selecciona una zona en la escena o en el outliner.
3. Arrastra los puntos amarillos para modificar el trazado.
4. Arrastra el polígono para mover toda la zona.
5. Doble clic sobre una arista para insertar un punto.
6. Selecciona un punto y pulsa `Eliminar punto` o `Supr`.

### Reglas

- Una zona necesita al menos 3 puntos.
- Las zonas siguen sin mostrarse en modo Play.
- La geometría se guarda dentro de `scene.navZones[].points`.


## Cambios v20: modos separados para zonas navegables

La herramienta de navegación se divide en:

- `Crear zona navegable`
- `Editar zona navegable`

### Crear zona

- Clics sucesivos añaden puntos.
- Doble clic cierra el polígono.

### Editar zona

- Un clic vacío ya no añade puntos nuevos.
- Puedes arrastrar puntos.
- Puedes arrastrar toda la zona.
- Doble clic en una arista añade un punto.
- `Supr` elimina el punto seleccionado.


## Cambios v21: triggers espaciales activos

Se corrige el problema por el que `Trigger / On enter` no hacía nada al pasar sobre un objeto.

Antes, `Trigger / On enter` solo se evaluaba si el flujo llegaba hasta él. Pero un trigger espacial debe comprobarse mientras el player se mueve.

Durante el movimiento del player, el motor evalúa automáticamente:

- `Trigger / On enter`
- `Trigger / While inside`
- `Trigger / On exit`

Tu grafo debe funcionar así:

```text
Player → Trigger: on enter → Recoger
```

Configuración:

- En `Trigger: on enter`, `Objeto / item objetivo` = objeto que se pisa.
- En `Recoger`, `Objeto / item objetivo` = objeto que se recoge.


## Cambios v22: separación real Editor / Play

- Al entrar en Play se crea una copia runtime del proyecto.
- Todo lo que pasa en Play ocurre sobre esa copia temporal.
- Al pulsar `Stop` o volver a `Editor`, se restaura el estado exacto de edición.
- Se añade botón `Stop`.
- No se permite guardar mientras estás en Play para evitar guardar el estado temporal.

Esto replica mejor el comportamiento de un motor de videojuegos: Editor conserva la escena programada; Play solo evalúa.


## Cambios v23

### Inventario → escena

Los objetos recogidos:

- desaparecen de la escena al recogerse;
- aparecen en el inventario;
- pueden arrastrarse desde el inventario a la escena;
- al soltarlos en la escena desaparecen del inventario y vuelven a ser visibles.

Esto funciona en modo Play sobre la copia runtime, por lo que al pulsar Stop se restaura el estado original del editor.

### Icono del inventario

El icono del inventario ahora tiene:

- imagen configurable;
- ancho configurable;
- alto configurable.

### Transformaciones persistentes en edición

Los objetos conservan:

- posición X/Y;
- ancho/alto;
- escala;
- rotación;
- Z order.

Estas propiedades se editan desde el inspector y se guardan en el JSON del proyecto.


## Cambios v24

Se corrige un fallo al sacar un objeto del inventario y volverlo a recoger varias veces.

### Causa

Los triggers espaciales guardaban internamente que el player ya estaba “dentro” del objeto. Al sacar el objeto del inventario y colocarlo de nuevo en la escena, ese estado podía quedar bloqueado y `on enter` no volvía a dispararse.

### Corrección

- Al devolver un objeto del inventario a la escena:
  - se marca como visible;
  - vuelve a estado `default`;
  - se elimina del inventario;
  - se reinician los triggers espaciales asociados a ese objeto.
- Al recogerlo:
  - se oculta;
  - se reinician también sus triggers.
- Los triggers ignoran objetos invisibles.
- Se evita que el drag desde inventario dispare también selección/click accidental.


## Cambios v25: sistema de Prefabs

Se añade un sistema similar a los Prefabs de Unity.

### Qué guarda un prefab

Al crear un prefab desde un objeto seleccionado, se guarda:

- propiedades del objeto;
- tipo de objeto;
- imagen;
- audio asociado;
- spritesheet y clips;
- escala, rotación, posición base, tamaño, Z;
- configuración de flip, parallax, estados;
- nodos de lógica asociados al objeto;
- enlaces entre esos nodos.

### Cómo crear un prefab

1. Selecciona un objeto en escena u outliner.
2. Pulsa `Crear prefab del seleccionado`.
3. El prefab aparece en el panel `Prefabs`.

### Cómo instanciarlo

1. Cambia a otra escena.
2. Selecciona el prefab.
3. Pulsa `Instanciar prefab`.

El editor crea un nuevo objeto con nuevo ID y remapea automáticamente los nodos asociados para que apunten al nuevo objeto.

### Ejemplo

Si tienes un Player con:

- imagen;
- spritesheet;
- animaciones `idle`, `run`, `pickup`;
- nodos de input y animación asociados;

puedes convertirlo en prefab y reutilizarlo en otra escena sin reconstruirlo desde cero.

### Nota de diseño

Los prefabs se guardan dentro de:

```json
project.prefabs
```

No son copias externas. Quedan incluidos en el JSON del proyecto y en IndexedDB.


## Cambios v26: zonas navegables estrictamente por escena

Se blinda el modelo para que las zonas navegables no sean globales.

### Modelo correcto

Cada escena guarda sus propias zonas:

```json
scene.navZones = [
  {
    "id": "...",
    "name": "Zona navegable",
    "enabled": true,
    "points": [{ "x": 100, "y": 400 }]
  }
]
```

No existe `project.navZones` global.

### Correcciones

- Al cambiar de escena se limpian:
  - selección de zona;
  - punto seleccionado;
  - zona en dibujo.
- Cada escena tiene su propio array independiente de `navZones`.
- Si un proyecto antiguo tuviera `project.navZones`, se migra solo a la primera escena.
- Los prefabs no guardan ni arrastran zonas navegables.
- El inspector de zona indica a qué escena pertenece la zona.

### Resultado

Puedes tener una zona navegable distinta por escena, sin que aparezca en las demás.


## Corrección v29

La v28 integraba el editor de mecanismos sustituyendo demasiado HTML y podía romper la inicialización completa de la UI.

Esta versión parte de la v26 estable e integra `Mecanismos` de forma conservadora:

- nuevo tab superior `Mecanismos`, junto a `Nodos`;
- `project.mechanisms`;
- editor visual de elementos;
- reglas JSON;
- runtime modal para probar;
- categoría de nodos `Mecanismo`;
- acciones: abrir, cerrar y comprobar resuelto.

El sistema sustituye conceptualmente al editor de puzles cerrados.


## Validación v29

- Corregido error de sintaxis en `selectedMechanismElement()`.
- `app.js` validado con `node --check`.


## Cambios v30: cierre fácil de zonas navegables

Crear zonas ya no depende solo del doble clic.

- Clic cerca del primer punto: snap automático y cierre.
- Clic sobre el primer punto.
- Tecla `Enter`.
- Botón `Cerrar zona`.
- Doble clic como antes.
- Tecla `Escape` o botón `Cancelar zona` para cancelar.

Si cambias a Play con una zona a medio crear, se cierra automáticamente si tiene 3 puntos o más; si no, se cancela.


## Cambios v31: modos de reproducción para spritesheets

Los clips de spritesheet ahora soportan:

- `once`: una sola vez.
- `loop`: bucle.
- `pingpong`: ida y vuelta.

Ejemplo de clips:

```json
{
  "idle": { "from": 0, "to": 5, "fps": 8, "mode": "loop" },
  "run": { "from": 6, "to": 12, "fps": 12, "mode": "loop" },
  "pickup": { "from": 13, "to": 18, "fps": 10, "mode": "once" },
  "blink": { "from": 19, "to": 24, "fps": 8, "mode": "pingpong" }
}
```

### Movimiento del player

En las propiedades de spritesheet del objeto/player se añaden:

- `Animación al moverse`
- `Animación al parar`

Así, al hacer clic y moverse, el player puede reproducir `run`, y al llegar al destino volver a `idle`.

### Nodos

Los nodos de animación exponen también `Modo animación`:

- usar modo del clip;
- una vez;
- loop;
- ping-pong.

Esto permite forzar el modo desde la lógica.


## Cambios v32: conexiones de nodos más claras

- Las conexiones se actualizan en tiempo real mientras arrastras un nodo.
- Al arrastrar una conexión desde un puerto, la línea temporal sigue el ratón.
- Los extremos de los cables ahora tienen círculos visibles.
- Los puertos son más grandes y tienen hover.
- Los puertos de entrada se resaltan durante una conexión.
- Los cables de datos y flujo se diferencian visualmente.

## Cambios v33: menú de escenas con miniaturas e iconos

- Al guardar el proyecto se genera una miniatura de cada escena.
- La miniatura se dibuja con canvas usando fondo y objetos con imagen.
- Si no puede generar snapshot, usa la imagen del fondo.
- El listado de escenas muestra miniatura, nombre y número de objetos.
- Se añaden iconos simples de texto/emoji a botones principales de la UI.


## Cambios v34: planos de parallax por objeto

Se sustituye el parallax limitado a fondos por un sistema de planos por objeto.

### Nuevas propiedades de objeto

```json
{
  "parallaxLayer": -1,
  "parallaxFactor": -0.25
}
```

### Planos recomendados

- `-1`: fondo lejano, cielos, nubes, montañas.
- `0`: plano de juego, player y objetos interactivos.
- `+1`: primer plano, efectos, ramas, niebla, siluetas cercanas.

### Intensidad global

El proyecto tiene:

```json
project.parallaxSettings.strength
```

Así puedes aumentar o reducir todo el efecto de parallax de una escena/juego.

### Compatibilidad

El sistema antiguo de parallax de fondo se mantiene, pero el método recomendado ahora es usar `parallaxLayer` y `parallaxFactor`.

## Cambios v35: parallax por escena + capas virtuales

La intensidad del parallax pertenece a cada escena:

```json
scene.parallaxStrength = 1
```

Valores recomendados: `0` sin parallax, `1` sutil, `2–4` evidente, `10` muy acusado.

Cada objeto solo elige una capa virtual:

```json
object.parallaxLayer = -1 | 0 | 1
```

- `-1`: fondo lejano, cielo, nubes, montañas; se desplaza menos.
- `0`: plano de juego, player, habitación y objetos principales.
- `+1`: primer plano, elementos cercanos a cámara; se desplaza más.

Las cifras `-1`, `0` y `+1` no son valores de fuerza; son capas.


## Cambios v36: reparación de UI

La v35 podía romper la inicialización completa de botones por una referencia de JavaScript a un control de parallax que no existía en el HTML.

Correcciones:

- Se garantiza la existencia del control `sceneParallaxStrength`.
- Se eliminan referencias residuales a `globalParallaxStrength`.
- Se eliminan referencias residuales a `propParallaxFactor`.
- Se añaden guardas de seguridad para controles opcionales.
- Se mantiene el modelo correcto: parallax por escena + capa virtual por objeto.


## Cambios v37: parallax colocado en propiedades correctas

### Propiedades de escena

Al seleccionar una escena en el menú izquierdo y no tener seleccionado ningún objeto, el panel derecho muestra:

- nombre de escena;
- `Parallax global de esta escena`.

Este valor se guarda en:

```json
scene.parallaxStrength
```

### Propiedades de objeto

Cada objeto tiene un dropdown:

```json
object.parallaxLayer = -1 | 0 | 1
```

- `-1`: fondo lejano.
- `0`: plano de juego.
- `+1`: primer plano.

El desplazamiento se calcula combinando `scene.parallaxStrength` con la capa virtual del objeto.


## Cambios v38: propiedades de escena y miniaturas en proyectos antiguos

### Propiedades de escena

Ahora seleccionar una escena en el menú izquierdo activa explícitamente el panel de propiedades de escena en la derecha.

Se muestran:

- nombre de escena;
- `Parallax global de esta escena`.

### Miniaturas

Al cargar un JSON antiguo o un proyecto local antiguo:

- se normalizan los datos;
- se generan miniaturas automáticamente después de cargar;
- si no hay miniatura previa, se crea desde fondo y objetos visibles.

Un JSON antiguo no sobrescribe funciones del editor; solo sustituye los datos del proyecto. El problema era de selección/normalización de la interfaz.


## Cambios v39: reparación del panel derecho

La v38 intentaba mostrar propiedades usando IDs fijos (`objectProps`, `linkProps`) que no coincidían con todos los paneles reales del HTML. Eso dejaba el panel derecho oculto.

Corrección:

- `renderProperties()` vuelve a ser flexible y usa el primer panel real disponible.
- Las propiedades de objeto, zona y nodo vuelven a mostrarse.
- Las propiedades de escena se muestran solo al seleccionar una escena en el menú izquierdo.
- El parallax de escena queda en `scene.parallaxStrength`.
- La capa de parallax del objeto queda en `object.parallaxLayer`.


## Validación v39

Corregido un error de guardas duplicadas en bindings de parallax.


## Cambios v40: reparación definitiva del panel de objeto

El panel real de propiedades de objeto en el HTML se llama:

```html
<div id="props">
```

La v39 buscaba `objectProps`, que no existía, por eso al seleccionar `Player` quedaba visible el mensaje vacío.

Corrección:

- `renderProperties()` usa ahora `props` como panel principal de objeto.
- Seleccionar objetos desde outliner o escena fuerza `selectedPanel = "object"`.
- Las propiedades de escena quedan separadas y solo aparecen al seleccionar una escena.


## Cambios v41: selección explícita de escena

Ahora hacer clic en una escena del menú izquierdo selecciona la escena como entidad editable.

En el panel derecho aparecen:

- Nombre escena.
- Parallax global de esta escena.

Esto se guarda en:

```json
scene.parallaxStrength
```

La selección de escena ya no compite con la selección de objeto, zona o nodo.


## Cambios v43: reestructuración limpia desde base estable

Esta versión parte de la v41 estable y aplica de forma conjunta:

1. Propiedades de escena funcionales.
2. Parallax por escena (`scene.parallaxStrength`) y capa por objeto (`object.parallaxLayer`).
3. Inventario global entre escenas.
4. Elementos de mecanismos con imagen (`element.imageId`).
5. Panel derecho reparado usando el panel real `#props` para objetos.

### Inventario global

Un item recogido en una escena puede arrastrarse a otra. Si el objeto original no pertenece a la escena actual, se instancia una copia del objeto en la escena actual.

### Mecanismos visuales

Cada elemento de mecanismo puede tener una imagen asignada desde los assets, útil para palancas, botones, piezas, tubos, slots o indicadores.


## Cambios v44: revisión y mejoras

Revisión realizada sobre la v43.

### Correcciones

- Eliminada una función duplicada de parallax.
- Reparado `mechanismElement()` para conservar `imageId`.
- El panel de propiedades de elementos de mecanismo ahora actualiza y limpia correctamente el selector de imagen.
- Mejorado el inventario entre escenas con `inventoryKey`, para que una llave recogida/instanciada en otra escena siga contando como la misma llave lógica.
- `requiresItemId` y condiciones `hasItem` ahora aceptan objetos equivalentes por clave de inventario, no solo por ID exacto.
- Al crear una instancia de un item en otra escena se conserva `inventorySourceId`.

### Mejoras

- Las escenas muestran miniatura en el listado si ya existe.
- Los slots de mecanismos en runtime aceptan arrastrar objetos desde el inventario.
- Los slots comprueban tags/clave/nombre y consumen el item al encajarlo.
- Los elementos de mecanismos pueden usar imagen de asset y mantenerla en JSON.

### Uso recomendado

Para usar un objeto como pieza de mecanismo:

1. Crea el objeto inventariable.
2. Asígnale acción `pickup`.
3. En el mecanismo, crea un elemento tipo `slot`.
4. En `Tags / acepta`, escribe la clave/tag de la pieza.
5. En modo Play, arrastra el item desde el inventario al slot.


## Cambios v45 reconstruida

- Reparado el editor de nodos.
- Restaurada `renderLogic()`.
- Separada `redrawLogicWiresOnly()` para que solo actualice cables.
- `addNode()` crea `scene.logic`, `nodes` y `links` si faltan en proyectos antiguos.


## v47 Colliders Fix

Corrección del editor modal de colliders:

- El modal estaba insertado después de `<script src="app.js">`.
- Por eso `bindUI()` se ejecutaba antes de existir los botones del modal.
- Los botones del editor de colliders no recibían listeners.
- Ahora el script se carga después del modal.
- Además, los controles del editor de colliders usan delegación de eventos, para que funcionen aunque el modal se regenere.


## v48 Colliders UI

Mejora de acceso al editor de colliders:

- Añadido botón visible `Editar collider` en la barra principal.
- El botón se activa cuando hay un objeto seleccionado en modo Editor.
- El texto muestra el nombre del objeto seleccionado.
- La sección Collider del panel derecho queda resaltada visualmente.


## v49 Collider Button

- Añadido botón flotante fijo `Editar collider` en la esquina inferior derecha.
- El botón aparece siempre visible, pero solo se activa cuando hay un objeto seleccionado en modo Editor.
- La cabecera debe mostrar `Adventure Editor v49 Collider Button`; si ves `v45`, estás abriendo una carpeta antigua.


## v50 Collider UI Fix

- Eliminado el botón flotante llamativo.
- Añadido acceso discreto `Editar collider` en la barra superior.
- El botón se habilita usando directamente `state.selectedObjectId`.
- El botón abre el editor buscando el objeto por ID en cualquier escena, sin depender de `selectedObject()`.


## v51 Collider Button Fix

- El botón `Editar collider` ya no queda desactivado.
- El botón siempre es accionable.
- Al pulsarlo busca el objeto seleccionado por:
  - `state.selectedObjectId`;
  - `selectedObject()`;
  - el elemento DOM `.sceneObject.selected`.
- Si no encuentra objeto, muestra un aviso.


## v52 Collider Clean

Paquete revisado:

- `index.html`, `style.css`, `app.js` y `README.md` completos.
- `app.js` conserva el tamaño completo del proyecto.
- El botón `Editar collider` es discreto y no está desactivado.
- Importante: descomprimir el ZIP antes de abrir `index.html`. Si se abre desde dentro del ZIP, el navegador puede no cargar `style.css` ni `app.js`.


## v53 Collider Modal Fix

Corrección crítica:

- En la v52 el código JavaScript del editor de colliders existía, pero el HTML del modal `colliderEditorModal` no estaba en `index.html`.
- Por eso al pulsar `Editar collider` no se veía nada.
- Se ha reinsertado el modal completo antes de cargar `app.js`.
- `openColliderEditor()` ahora comprueba si el modal existe y muestra aviso si no existe.


## v54 Modular Base

Primera modularización práctica.

No añade funcionalidades nuevas: separa el antiguo `app.js` en varios scripts clásicos dentro de `/js/`, manteniendo el orden de ejecución y las variables globales.

### Estructura

```text
index.html
style.css
app.js                      # stub informativo
js/
  00_core_state.js
  01_project_model.js
  02_scene_objects_assets.js
  03_render_all_and_ui_lists.js
  04_render_stage_and_collisions.js
  05_properties_panel.js
  06_navigation_runtime.js
  07_nodes_graph.js
  08_mechanisms.js
  09_collider_editor.js
  10_bindings_main.js
```

### Archivos clave

- `09_collider_editor.js`: editor modal de colliders.
- `04_render_stage_and_collisions.js`: render de escena y funciones de collider/colisiones.
- `07_nodes_graph.js`: editor y ejecución de nodos.
- `08_mechanisms.js`: mecanismos.
- `05_properties_panel.js`: propiedades del objeto/escena/zona/nodo.
- `10_bindings_main.js`: bindings de botones y arranque.

### Importante

Se usan scripts clásicos, no `type="module"`, para poder abrir `index.html` directamente en PC sin servidor local.

También se entrega una versión `AUTO.html` con todo incrustado.


## v56 Modular Script Fix

Corrección crítica de la modularización:

- En v54/v55 el `app.js` monolítico se sustituyó por un stub informativo.
- Pero `index.html` seguía cargando `<script src="app.js"></script>`.
- Resultado: no se ejecutaba el código real y los botones no hacían nada.
- Ahora `index.html` carga explícitamente todos los archivos `/js/*.js` en orden.

Esta versión conserva el cambio de parallax de v55.


## v57 Play Helpers Hidden

Cambios:

- El parallax por defecto de nuevas escenas pasa a `0.1`.
- El fallback de parallax para escenas antiguas sin valor también pasa a `0.1`.
- Los colliders y helpers visuales no se dibujan en modo `Play`.
- Aunque un objeto tenga activado `Mostrar collider en escena`, ese helper solo se verá en modo `Editor`.
- Las zonas navegables/helper tampoco se renderizan en modo `Play`.

Regla general desde esta versión:

```text
Editor → se pueden mostrar helpers visuales.
Play   → no se muestra ningún helper visual.
```


## v59 Trigger Goto Fix

Correcciones:

- `gotoScene()` acepta el ID interno o el nombre visible de la escena.
- Por tanto, el nodo `Ir a escena` puede usar `Escena 2` en el campo Valor.
- Si no encuentra la escena, muestra un mensaje.
- Los triggers espaciales se evalúan continuamente en modo Play cada 120 ms.
- `onEnter`, `whileInside` y `onExit` no dependen solo de que el player esté moviéndose.
- Se protegen las colisiones si actor o target son nulos.

Configuración recomendada:

```text
Trigger: on enter
  objetivo: Hotspot
  salida then → Ir a escena

Ir a escena
  Valor: Escena 2
```

No hace falta conectar `Player` al trigger: el player se usa por defecto como actor.


## v60 UI Workflow

Mejoras de interfaz:

### Nodos: Ir a escena

- El campo `Valor / texto / estado` mantiene el textarea.
- Para nodos `Acción → Ir a escena` aparece además un desplegable `Elegir escena`.
- Al elegir una escena, se guarda el destino y se rellena el valor con el nombre visible.

### Eliminar seleccionado

- El botón `Eliminar` se mueve del panel Herramientas al panel Propiedades.
- Aparece debajo de las propiedades cuando hay un objeto, zona, nodo o conexión seleccionada.

### Clips de spritesheet

- Añadido editor visual de clips.
- Permite crear/editar clips sin escribir JSON manualmente.
- Botón `Crear run` crea un clip `run` desde el frame actual.
- El JSON queda como modo avanzado y se puede formatear.


## v61 Clip Create Generic

Cambio en el editor visual de clips:

- El botón `Crear run` se sustituye por `Crear clip`.
- Al pulsarlo se pide el nombre del clip.
- El clip se crea desde el frame actual.
- Ya no se asume que el spritesheet tenga necesariamente una animación llamada `run`.


## v62 Sprite Clip Validation

Comprobación del sistema de spritesheet:

- La animación por offset de spritesheet sigue funcionando.
- El problema detectado era de configuración: un clip `0-5` necesita al menos 6 frames, pero con `Columnas: 1` y `Filas: 1` solo existe 1 frame.
- El editor visual de clips ahora avisa si el clip usa más frames de los disponibles.
- Añadido botón `Ajustar columnas al clip`, que configura una distribución horizontal suficiente para el clip actual.
- Al crear un clip nuevo, si el clip supera la cuadrícula actual, se ajustan columnas automáticamente.
- Al moverse el player se actualizan todos los objetos de escena, porque desde v55 la capa 0 también puede tener parallax.

Regla práctica:

```text
frames disponibles = columnas × filas
```

Ejemplo:

```text
Clip run: 0 a 5 → necesita 6 frames
Configuración válida: columnas 6, filas 1
```


## v63 Walk Animation Loop

Aclaración y corrección del flujo de animación al caminar:

- La animación de caminar no debe depender de nodos.
- Si el player tiene `Animación al moverse = run`, el motor reproduce `run` en loop mientras `movePlayerTo()` desplaza al player.
- Al terminar el desplazamiento, cambia a `Animación al parar`, por ejemplo `idle`.
- Si ya está reproduciendo `run`, el clip no se reinicia continuamente.
- El nodo `Reproducir animación` queda para animaciones puntuales o cinemáticas.

Configuración recomendada:

```text
Clip run: from 0 to 5
Columnas: 6
Filas: 1
Modo: loop
Animación al moverse: run
Animación al parar: idle
```


## v64 Sprite Loop Fix

Cambios:

- Eliminado el texto explicativo de animación de caminar en la UI.
- Reescrito el avance de frames de spritesheet para que `loop` sea cíclico y robusto.
- El frame se calcula por tiempo transcurrido dentro del clip, no solo por incremento acumulado.
- `loop` repite de `from` a `to`.
- `once` se detiene al llegar a `to`.
- `pingpong` alterna ida/vuelta.
- Al iniciar la animación de caminar, si ya se está reproduciendo el mismo clip, no se reinicia constantemente.

Para que un clip se vea completo sigue siendo necesario que:

```text
columnas × filas > frame final del clip
```


## v65 Play Movement Anim Fix

Correcciones:

- Al entrar en modo Play, el player ya no se queda reproduciendo el clip activo del editor.
- El player se inicializa con `Animación al parar` (`stopClip`, normalmente `idle`) si existe.
- La animación `run` solo empieza cuando `movePlayerTo()` inicia un desplazamiento.
- Al terminar el desplazamiento, vuelve a `idle`.
- Se refuerza el click del escenario en Play para que vuelva a llamar a `movePlayerTo()` cuando se hace click en suelo/zona navegable.

Configuración recomendada:

```text
Player:
  Clip activo: puede ser cualquiera en edición
  Animación al moverse: run
  Animación al parar: idle
  run: loop
  idle: loop o once
```


## v66 Click Play and Confirm

Correcciones:

- En modo Play, los objetos no interactivos y el propio player ya no bloquean el click del escenario.
- Esto permite que el click de suelo vuelva a llegar a `handleStageClick()` y ejecute `movePlayerTo()`.
- Los objetos interactivos sí conservan su click propio.
- Añadida confirmación a `Guardar local`.
- Añadida confirmación a `Cargar local`.

Motivo del fallo:

En Play, algunos objetos visibles podían quedar por encima del escenario y capturar el click aunque no tuvieran acción. El click no llegaba al stage, por eso el player no se desplazaba.


## v66b Confirmación BD local

Corrección adicional:

- Los botones reales eran `saveDbBtn` y `loadDbBtn`.
- Ahora `Guardar local` pide confirmación antes de sobrescribir.
- Ahora `Cargar local` pide confirmación antes de sustituir el proyecto actual.


## v67 Node Based Movement

Cambio conceptual:

- El click en Play ya no mueve automáticamente al player desde código fijo.
- El desplazamiento debe configurarse en el grafo de nodos.
- El evento `Input → Clic ratón` pasa el punto clicado como `context.point`.
- La acción `Desplazar / mover a objeto` ahora funciona de dos maneras:
  - si tiene objeto objetivo, mueve el player hasta ese objeto;
  - si no tiene objeto objetivo, mueve el player al punto clicado.

Configuración para point-and-click básico:

```text
Input: clic ratón
  salida then → Desplazar / mover a objeto

Desplazar / mover a objeto
  objeto objetivo: Sin objeto
```

Así el player se desplaza al punto clicado, siempre que el punto esté dentro de una zona navegable.


## v68 Click Point Move Fix

Mejora de usabilidad del movimiento por nodos:

- En `Desplazar / mover a objeto`, el selector se muestra como `Destino / objeto objetivo`.
- La opción vacía aparece como `Sin objeto / punto clicado`.
- Si el nodo viene de `Input: clic ratón` y no tiene destino, mueve el player al punto clicado.
- Si por error se selecciona `Player` como destino, también usa el punto clicado cuando existe.
- Si se selecciona otro objeto como destino, mueve el player hasta ese objeto.

Configuración recomendada:

```text
Input: clic ratón
  salida then → Desplazar / mover a objeto

Desplazar / mover a objeto
  Destino / objeto objetivo: Sin objeto / punto clicado
```

No selecciones `Player` como destino salvo que quieras usar el fallback al punto clicado.


## v69 Click Context Fix

Corrección del movimiento por nodos:

- `runLogicGraph()` ahora conserva `extra.point` dentro de `context.point`.
- El nodo `Desplazar / mover a objeto` puede recibir correctamente el punto clicado.
- `Input: clic ratón` ahora envía:
  - `input: "click"`
  - `button: "mouse:left"`
  - `point: {x, y}`
- El filtro de eventos `input:click` acepta nodos configurados como:
  - vacío
  - `click`
  - `mouse:left`

Configuración recomendada:

```text
Input: clic ratón
  input: click o vacío
  then → Desplazar / mover a objeto

Desplazar / mover a objeto
  Destino / objeto objetivo: Sin objeto
```

El player se moverá al punto clicado si ese punto está dentro de una zona navegable.


## v70 Multi Event Graphs

Corrección del sistema de eventos de nodos:

- Antes, `runLogicGraph()` solo ejecutaba el primer nodo inicial que coincidía con un evento.
- Si había dos nodos `Input: clic ratón`, solo se ejecutaba el primero.
- En tu caso, el primer input ejecutaba `Reproducir animación` y el segundo input, que contenía `Desplazar / mover a objeto`, no llegaba a ejecutarse.
- Ahora un mismo evento ejecuta todos los grafos iniciales coincidentes.

Esto permite tener, por ejemplo:

```text
Input: clic ratón → Reproducir animación
Input: clic ratón → Desplazar / mover a objeto
```

Ambos se ejecutarán al hacer click.

Configuración para movimiento point-and-click:

```text
Input: clic ratón
  then → Desplazar / mover a objeto

Desplazar / mover a objeto
  Destino / objeto objetivo: Sin objeto
```


## v71 Movement Runtime Fix

Correcciones integradas:

- Añadidas `startPlayerMoveAnimation(player)` y `stopPlayerMoveAnimation(player)` en `03_render_all_and_ui_lists.js`.
- `movePlayerTo()` ya no lanza `ReferenceError` al ejecutar el nodo `Desplazar / mover a objeto`.
- `movePlayerTo()` endurece el cálculo de destino usando `(player.scale || 1)`.
- Cámara/parallax endurecido igualmente para evitar cálculos con `scale` indefinido.
- Añadido fallback defensivo para evitar que una ausencia futura de helpers rompa el movimiento.
- Se mantiene el comportamiento de v70: un mismo evento puede disparar varios grafos de nodos.

Nota:

El soporte parcial de selección de links sigue protegido. El panel real de propiedades de conexiones queda como mejora separada para una versión posterior.


## v72 Delete Prefabs

Nueva funcionalidad:

- Añadido botón `Eliminar prefab` en el panel Prefabs.
- El botón se activa solo cuando hay un prefab seleccionado.
- Pide confirmación antes de borrar.
- Elimina únicamente el prefab de la biblioteca.
- Las instancias ya creadas en escenas no se eliminan.
- Al borrar, limpia `state.selectedPrefabId` y refresca la UI.


## v73 Prefab Logic Graphs

Corrección de prefabs con lógica de nodos:

- Al crear un prefab ya no se guardan solo los nodos que referencian directamente al objeto.
- Ahora se guarda el subgrafo conectado completo alrededor de esos nodos.
- Esto conserva nodos de entrada como `Input: clic ratón` conectados a acciones del prefab.
- Al instanciar el prefab se remapean referencias del objeto original al nuevo objeto.
- Se remapean `objectId`, `targetObjectId` e `itemId`.
- Se mantienen las conexiones internas del grafo.

Ejemplo corregido:

```text
Input: clic ratón → Desplazar / mover a objeto
```

Si ese grafo está conectado a nodos/acciones del Player prefab, se guardará junto al prefab y se instanciará conectado.

Nota:

Si quieres que una lógica viaje con un prefab, debe estar conectada al subgrafo del objeto o referenciarlo de algún modo. Para el Player se incluyen también acciones implícitas como `moveTo` y `playAnimation` sin destino explícito.


## v74 Message Style Settings

Nueva funcionalidad:

- Añadidos ajustes globales para los carteles/mensajes del juego.
- Los carteles salen por defecto arriba (`position: top`) para no taparse con el inventario.
- Controles disponibles:
  - posición: arriba, centro, abajo;
  - tipo de letra;
  - tamaño;
  - color de texto;
  - color de fondo;
  - opacidad del fondo;
  - radio de esquinas;
  - ancho máximo;
  - botón de prueba.

Estos ajustes se guardan en `project.messageSettings` y afectan globalmente a todo el juego.


## v75 Start Splash Scene Audio

Nuevas funcionalidades:

- Escena inicial global (`project.startSceneId`), independiente de la escena seleccionada en el editor.
- Al pulsar Play, la aventura empieza en esa escena.
- Splash inicial opcional:
  - imagen;
  - audio;
  - duración;
  - opción de saltar con click.
- Audios por escena:
  - cada escena tiene `audioIds`;
  - se añaden desde propiedades de escena;
  - no duplican archivos, solo referencian assets de audio ya importados.
- Nodos nuevos:
  - `Reproducir audio de escena`;
  - `Detener audio de escena`.
- El audio de escena puede elegirse en el nodo; si queda vacío, reproduce el primer audio asociado a la escena.


## v75 Start Splash Scene Audio

Nuevas funcionalidades:

- Escena inicial global (`project.startSceneId`), independiente de la escena seleccionada en el editor.
- Al pulsar Play, la aventura empieza en esa escena.
- Splash inicial opcional con imagen, audio, duración y opción de saltar.
- Audios por escena (`scene.audioIds`), editables desde propiedades de escena.
- Nodos nuevos:
  - `Reproducir audio de escena`;
  - `Detener audio de escena`.
- Si el nodo de audio de escena no tiene audio elegido, usa el primer audio asociado a la escena.


## v76 Scene Audio Import Fix

Correcciones en audio de escena:

- Añadido botón `Importar audio` dentro de Propiedades de escena.
- Ese botón abre el selector de archivos del sistema.
- Los archivos importados desde ahí se añaden al proyecto y quedan asociados automáticamente a la escena actual.
- El desplegable `Añadir audio` muestra los audios ya importados al proyecto que todavía no estén asociados a la escena.
- Si no hay audios importados, el desplegable lo indica y el botón `Añadir seleccionado` queda desactivado.
- Al importar audio globalmente desde el panel Assets, también se refrescan los desplegables de splash y audio de escena.


## v77 Scene Audio Dropdown Fix

Correcciones:

- El desplegable `Añadir audio` ya no depende de refrescos indirectos.
- Se reconstruye manualmente con los audios reales de `state.project.assets.audio`.
- Se muestra contador:
  - audios importados en el proyecto;
  - audios asociados a la escena.
- Al importar audio desde Assets o desde Propiedades de escena, se actualizan inmediatamente los desplegables.
- Al importar desde Propiedades de escena, los MP3 quedan añadidos al proyecto y asociados a la escena actual.
- Los nodos `Reproducir audio de escena` y `Detener audio de escena` muestran preferentemente los audios asociados a la escena.


## v78 Scene Audio Volume

Cambios:

- Cada escena tiene `audioAutoplay`: permite reproducir sus audios al entrar en la escena.
- Cada escena tiene `audioMasterVolume`: volumen global de escena.
- Cada audio asociado a escena puede tener volumen individual.
- Al entrar en una escena en Play, si `Reproducir al entrar` está activo, se reproducen los audios asociados.
- Nodos de audio ampliados:
  - `Reproducir audio de escena` acepta volumen en el campo `Volumen`.
  - `Cambiar volumen audio escena` permite modificar un audio concreto dinámicamente.
  - `Cambiar volumen global escena` permite modificar el volumen maestro dinámicamente.
- El volumen final es: volumen global de escena × volumen individual del audio × volumen del nodo.


## v79 Audio Play/Delete Fix

Correcciones:

- El arranque de Play ya no lanza `sceneStart` directamente con `setTimeout`; ahora llama a `runSplashThenStart()` y después a `startCurrentSceneRuntime()`, que sí reproduce audio de escena si corresponde.
- La reproducción de audio se hace de forma síncrona dentro del flujo de Play cuando no hay splash, reduciendo bloqueos por política de autoplay.
- `playAudioAsset()` muestra ahora el motivo del error si el navegador bloquea o falla la reproducción.
- Al asociar/importar audio a una escena, `Reproducir al entrar` se activa automáticamente.
- El audio de escena queda por defecto con autoplay activado en proyectos normalizados.

Gestión de audio:

- En Assets → Audio:
  - botón `Probar`;
  - botón `Eliminar`.
- En Propiedades de escena → Audio de escena:
  - botón `Probar`;
  - botón `Quitar` solo de la escena;
  - botón `Eliminar` del proyecto.
- Al eliminar un audio del proyecto se limpian referencias en:
  - escenas;
  - volúmenes de escena;
  - nodos;
  - objetos;
  - splash.


## v80 Scene Audio Stop + Scroll UI

Correcciones:

- Al cambiar de escena en Play se detiene el audio de la escena anterior.
- El audio queda tratado como recurso de escena, no como audio global persistente.
- Botones de audio compactados con iconos:
  - `▶` probar;
  - `−` quitar solo de la escena;
  - `×` eliminar del proyecto.
- Los botones ya no deberían provocar overflow en el panel lateral.
- Scrollbars personalizadas:
  - fondo oscuro;
  - sin aspecto de borde clásico del navegador;
  - barra resaltada en azul integrada con la interfaz.


## v81 Start Scene + Scroll Refine

Cambios:

- La escena inicial puede marcarse desde la propia ficha de Propiedades de escena.
- Añadido botón: `Marcar esta escena como inicial`.
- La ficha de escena indica cuál es la escena inicial actual.
- La lista de escenas muestra `★ Inicial` junto a la escena marcada.
- Refinadas las scrollbars:
  - sin caja;
  - sin fondo visible;
  - sin bordes;
  - solo la barra desplazable resaltada.


## v82 Adventure Interactions

Nuevas herramientas para mecánicas típicas de aventura gráfica:

### Propiedades de objeto

En la ficha de objeto se añade el bloque `Usar item sobre este objeto`:

- activar interacción rápida de inventario;
- elegir el item que debe usarse;
- mensaje de éxito;
- mensaje de fallo si se usa otro item;
- cambiar estado del objeto;
- consumir o no consumir el item usado;
- mostrar otro objeto;
- ocultar otro objeto;
- cambiar de escena después.

Esto permite montar flujos tipo:

```text
usar martillo en caja → caja rota → aparece llave
usar llave en puerta → puerta abierta → ir a otra escena
```

sin crear un grafo complejo de nodos.

### Nodos nuevos

- `Añadir item al inventario`;
- `Quitar item del inventario`;
- `Consumir item seleccionado`.

### Runtime

- Al usar un item del inventario sobre un objeto, primero se comprueba si el objeto tiene una interacción rápida configurada.
- Si no la tiene, se mantiene el comportamiento anterior por nodos `Usar item en objeto`.
- Los items se comparan por `inventoryKey`, no solo por ID, para que sigan funcionando clones/prefabs.


## v83 Play Clean View

Corrección visual:

- En modo Play ya no se renderizan zonas de navegación.
- En modo Play no se dibujan overlays de colliders.
- En modo Play no se añaden clases de selección/bloqueo de editor a los objetos.
- Añadido blindaje CSS para ocultar:
  - labels;
  - gizmos;
  - paths;
  - puntos y líneas de navegación;
  - overlays y handles;
  - selección visual del editor.


## v84 Global Inventory Items

Corrección:

- Los desplegables `Requiere item` e `Item que debe usarse` ya no se limitan a los objetos de la escena actual.
- Ahora muestran los items recogibles de todas las escenas del proyecto.
- En el desplegable se añade el nombre de la escena entre paréntesis para distinguirlos.
- Esto permite configurar interacciones como:
  - recoger martillo en una escena;
  - usar martillo sobre una maceta/caja en otra escena.
- Los controles `Mostrar objeto` y `Ocultar objeto` siguen limitados a la escena actual, porque actúan sobre objetos visibles de esa escena.


## v85 Inventory Cursor Use

Cambios:

- Al seleccionar un item del inventario en Play, queda asociado al cursor.
- Se muestra una miniatura flotante junto al puntero.
- El escenario entra en modo `usar item`.
- Al hacer clic sobre un objeto de escena, se ejecuta `usar item sobre objeto`.
- Al hacer clic vacío se cancela el item seleccionado.
- `Escape` también cancela el item seleccionado.
- Esto hace más natural el flujo:
  - seleccionar martillo en inventario;
  - clic sobre maceta;
  - disparar interacción configurada.


## v86 Inventory Cursor Click Fix

Correcciones:

- `renderStage()` vaciaba el escenario y eliminaba el cursor flotante de inventario. Ahora lo vuelve a insertar siempre.
- El cursor flotante se recrea automáticamente si no existe.
- Los objetos tipo `prop` con `Usar item sobre este objeto` activo ahora reciben clics en Play aunque su acción general sea `none`.
- Si hay un item seleccionado en inventario, los objetos no-background pueden recibir el clic para intentar una interacción de inventario.
- El cursor de inventario queda por encima del escenario.


## v87 Adventure Runtime Fixes

Correcciones:

- Añadida opción en `Usar item sobre este objeto`:
  - `Ocultar este objeto al usar el item`.
  - Sirve para romper/desaparecer la maceta al usar el martillo.
- Al mostrar un objeto oculto mediante una interacción rápida, se fuerza:
  - `visible = true`;
  - `state = default`;
  - `runtimeStates[id] = default`;
  - reseteo de triggers espaciales.
- Si un objeto es de tipo `item`, pero su acción general está en `none`, en Play se trata igualmente como recogible.
- Al entrar en una escena en Play, el player se resetea a idle y se limpian flags internas de movimiento.
- Al cambiar de escena:
  - se detiene audio de escena anterior;
  - se cancela item seleccionado del inventario;
  - se actualiza `playSceneId`;
  - se limpian triggers espaciales;
  - se prepara el estado runtime de la escena nueva.
- Esto debería permitir usar hotspots de ida/vuelta repetidamente.


## v88 Pickup + Scene Reentry Fix

Correcciones:

- La visibilidad en Play ya no depende de `obj.state` cuando existe `state.runtimeStates`.
  - Esto corrige casos donde un objeto revelado visualmente seguía sin comportarse bien por arrastrar un estado viejo.
- Al revelar la llave, su `runtimeState = default` prevalece correctamente.
- Al recoger un item:
  - se limpia el item seleccionado del cursor;
  - se actualiza el cursor flotante;
  - se oculta el objeto recogido por runtime.
- Al entrar de nuevo en una escena, los estados runtime se inicializan desde `initialState`, no desde un `obj.state` mutado durante Play.
- Al cambiar de escena, el arranque de runtime de la nueva escena se difiere un tick para evitar que el mismo clic/estado anterior interfiera.
- Si se está usando un item de inventario sobre un objeto sin interacción compatible, ya no cae por accidente en la acción normal del objeto.


## v89 Scene Reentry + Proximity

Correcciones y mejoras:

- Al cambiar de escena mediante hotspot ya no se vuelve a ejecutar `runSplashThenStart()`.
  - Ahora el splash solo se usa al iniciar Play.
  - Los cambios de sala ejecutan directamente el runtime de la escena destino.
  - Esto corrige el rebote donde la escena destino cargaba una milésima y volvía a la anterior.
- Se añade control de proximidad por objeto:
  - `Requiere que el player esté cerca`;
  - `Distancia máxima de interacción`;
  - `Mensaje si está demasiado lejos`.
- La comprobación de proximidad se aplica a:
  - recoger items;
  - usar items del inventario sobre objetos;
  - hotspots/puertas/acciones normales.
- Valor por defecto: 190 px.
- Si no quieres limitar un objeto concreto, desactiva `Requiere que el player esté cerca`.


## v90 Reentry Cooldown + Clickthrough

Correcciones:

- Añadido cooldown de transición de escena:
  - al hacer `gotoScene`, se bloquean clics/triggers durante unos 500 ms;
  - los triggers espaciales no se evalúan durante ese margen;
  - el runtime de la escena destino arranca tras ese margen.
- Esto evita que, al entrar en una sala encima de un hotspot/trigger de vuelta, se dispare inmediatamente y parezca que la escena “rebota” o se resetea.
- Mejorado el click sobre objetos con PNG/transparencia:
  - en Play, un objeto con imagen ya no intercepta el clic si el punto pulsado cae sobre un píxel transparente;
  - en esas zonas transparentes el clic puede llegar al stage y servir como destino de movimiento.
- Se mantiene el collider como zona interactiva, pero ahora también se comprueba la opacidad del píxel en la imagen.


## v91 Spawn Trigger + Pickup Fix

Correcciones:

- Al entrar en una escena, los triggers espaciales se inicializan con el estado actual del player.
  - Si el player aparece ya encima de un hotspot/trigger de vuelta, ese trigger queda marcado como ocupado y no dispara hasta que el player salga y vuelva a entrar.
  - Además hay una pequeña gracia inicial para `onEnter`, `whileInside` y `onExit`.
- El runtime de entrada de escena ya no evalúa triggers inmediatamente; primero los ceba.
- Ajustado el clickthrough:
  - los objetos tipo `item` y acción `pickup` vuelven a aceptar clic por collider, para que se puedan recoger aunque la prueba de alfa del PNG no sea fiable;
  - hotspots, puertas, personajes y objetos con `Usar item sobre este objeto` también usan collider;
  - los props/decoración grandes siguen dejando pasar clics en zonas transparentes.


## v92 Project File Menu

Cambios:

- El panel `Proyecto` pasa a ser un menú `Archivo` más tradicional.
- Nuevas acciones:
  - `Nuevo proyecto`;
  - `Guardar`;
  - `Guardar como .ave`;
  - `Cargar proyecto`;
  - `Exportar JSON`;
  - `Publicar`.
- Se crea un formato propio `.ave`.
  - Internamente es JSON.
  - Incluye envoltorio con `app`, `fileType`, `version`, `savedAt` y `project`.
- Compatibilidad:
  - puede cargar `.ave`;
  - puede cargar `.json` antiguo;
  - puede exportar JSON limpio.
- `Guardar` intenta usar File System Access API si el navegador lo permite.
  - En navegadores sin esa API, descarga el archivo `.ave` como fallback.
- `Publicar` queda como placeholder para una futura exportación jugable/publicable.
- Se retiran de la UI principal los antiguos botones confusos `Guardar local`, `Cargar local`, `Guardar JSON`, `Cargar JSON`.


## v93 Top Tools UI

Pulido de interfaz:

- Se mueve la botonera de herramientas desde el panel izquierdo al toolbar superior.
- Los controles pasan a iconos compactos.
- Cada botón mantiene su mismo `id`, así que no cambia la lógica interna.
- Se añaden `title` y `aria-label` para que el nombre de la herramienta aparezca en hover.
- Se elimina la sección `Herramientas` del panel izquierdo para liberar espacio.


## v94 White Mode Icons

Pulido de interfaz:

- Los botones `Editor`, `Play`, `Stop`, `Nodos` y `Mecanismos` pasan a iconos.
- Se mantienen los mismos IDs:
  - `editorModeBtn`;
  - `playModeBtn`;
  - `stopModeBtn`;
  - `nodesModeBtn`;
  - `mechanismsModeBtn`.
- No se cambia la lógica interna.
- Se añaden `title` y `aria-label` para tooltip en hover.
- Los iconos se fuerzan en blanco para integrarse mejor con la barra superior.


## v95 Collider Icon Tooltip Fix

Corrección visual:

- El botón `Editar collider` ya no muestra texto fijo encima del icono.
- El botón mantiene solo el icono `▣`.
- El texto queda en `title` y `aria-label`, por lo que aparece como tooltip de hover.
- Añadido CSS defensivo para evitar que textos largos se desborden en botones de icono.


## v96 Collider Button Runtime Fix

Corrección:

- El problema no estaba solo en el HTML: un script volvía a escribir texto visible en `openColliderEditorBtn`.
- Se fuerza en runtime que el botón muestre únicamente el icono `▣`.
- El texto `Editar collider` queda solo como `title` y `aria-label`.
- Se añade CSS defensivo para que el botón no pueda ensancharse ni mostrar etiqueta larga.


## v97 Splash Import Buttons

Mejora de UI:

- Añadidos botones directos en la configuración del splash:
  - `Importar imagen splash`;
  - `Importar audio splash`.
- Al importar una imagen splash:
  - se añade a Assets;
  - se asigna automáticamente como imagen del splash;
  - se activa `Mostrar splash al iniciar Play`.
- Al importar audio splash:
  - se añade a Assets de audio;
  - se asigna automáticamente como audio del splash.
- Los desplegables siguen mostrando los assets ya importados.


## v98 Splash Play Fix

Corrección:

- `renderStage()` vaciaba el escenario y podía eliminar el elemento `splashScreen`.
- Ahora el splash se conserva/reinserta al renderizar el stage.
- `runSplashThenStart()` recrea el splash si no existe.
- Se fuerza visualmente que el splash aparezca por encima del escenario.
- Si `Mostrar splash al iniciar Play` está activo y hay imagen seleccionada, el splash debe aparecer al pulsar Play.


## v99 Editor Visual Zoom

Mejora:

- Añadido zoom visual para la ventana de edición de escena mediante la rueda del ratón.
- El zoom no modifica `x`, `y`, `width`, `height`, `scale` ni ningún dato real de los objetos.
- Es solo una transformación visual del stage.
- `stagePoint()` compensa el zoom, así que arrastrar, colocar, crear zonas y editar colliders siguen usando coordenadas reales.
- En modo Play el zoom se fuerza visualmente a 100%.
- Se añade indicador de zoom en la barra superior.


## v100 Zoom Reset Button

Mejora:

- Añadido botón compacto junto al indicador de zoom.
- Icono: `⟲`.
- Acción: restablecer zoom visual de edición a 100%.
- Mantiene el sistema de zoom como transformación visual, sin modificar coordenadas ni tamaños reales.


## Beta 0.1.1 / v101 Animation Clips Base

Primera fase del motor de animación:

- Nuevo modo superior `Animaciones` con icono `◇`.
- Editor de clips de transformación por objeto.
- Keyframes de:
  - posición `x`;
  - posición `y`;
  - `rotation`;
  - `scale`.
- Duración por clip.
- Modo:
  - `once`;
  - `loop`;
  - `pingpong`.
- Easing básico:
  - `linear`;
  - `easeIn`;
  - `easeOut`;
  - `easeInOut`.
- Preview en editor.
- Runtime de clips de transformación integrado en el animation loop.
- Nuevos nodos:
  - `Reproducir clip transformación`;
  - `Detener clip transformación`.
- Los clips de transformación son independientes de los clips de spritesheet.


## Beta 0.1.2 / v102 Visual Animation Timeline

Mejora del editor de animaciones:

- Añadida ventana de preview del objeto animado.
- Añadido timeline visual.
- Tracks visibles para:
  - `X`;
  - `Y`;
  - `Rotación`;
  - `Escala`.
- Los keyframes se muestran como diamantes.
- Se pueden seleccionar keyframes desde el timeline.
- Se pueden arrastrar keyframes para moverlos en el tiempo.
- Doble clic en una pista: añade un keyframe en ese tiempo.
- Scrubber/playhead para recorrer la animación.
- Botones de preview play/stop.
- Se mantienen los campos numéricos para ajuste fino.


## Beta 0.1.3 / v103 Animation Preview Scrub Fix

Correcciones:

- El botón Play del preview ya no depende de la reproducción runtime del objeto; ahora usa un `requestAnimationFrame` propio para la preview.
- La interpolación entre keyframes se refuerza con una función de sampleo más robusta.
- El scrubber/playhead se puede mover directamente:
  - clic en el timeline;
  - arrastrar por el timeline;
  - arrastrar la línea de playhead.
- Al hacer scrub se ve inmediatamente el resultado en la ventana de preview y también sobre el objeto en la escena mientras está abierto el modo Animaciones.
- Los iconos de keyframe son más pequeños.


## Beta 0.1.4 / v104 Animation Interpolation Fix

Correcciones importantes:

- El editor de animaciones ahora tiene interpolación real entre keyframes.
- Añadidos modos `linear`, `smooth` y `bezier suave` en el selector de easing.
- `smooth` y `bezier` usan una curva smoothstep estable para esta fase; más adelante podrá sustituirse por tangentes Bezier editables.
- El botón Play del preview queda enlazado correctamente al sistema de preview del timeline.
- El preview ya no depende del runtime de spritesheet ni de `playTransformClip`.
- Añadido carril propio de scrub encima de los tracks para mover el playhead sin interferir con los keyframes.
- El playhead ya no captura eventos encima de los keyframes.
- Los keyframes del timeline se han reducido aproximadamente a la mitad.


## Beta 0.1.5 / v105 Keyframe Playhead Fix

Correcciones:

- El botón `Añadir key` crea ahora el keyframe en el tiempo actual del playhead.
- El campo numérico `Tiempo` queda para editar el keyframe seleccionado, no para decidir dónde se crea un keyframe nuevo.
- Los rombos de keyframe del timeline se han reducido un 50% respecto a Beta 0.1.4.


## Beta 0.1.6 / v106 Responsive Panels + Keyframes

Correcciones:

- Los rombos de keyframe del timeline se reducen de forma más agresiva.
- Añadidos selectores CSS más específicos para evitar que los botones hereden tamaños mínimos globales.
- El layout principal pasa a usar columnas adaptativas con `clamp()` y `minmax()`.
- Los paneles izquierdo y derecho dejan de depender de un ancho rígido en resoluciones menores.
- En ventanas medianas se comprimen los paneles y se reducen grids internos.
- En ventanas muy estrechas, los paneles se apilan para evitar cortes.


## Beta 0.1.7 / v107 Animation Transform Consistency

Correcciones:

- El editor de animación queda recortado dentro del `workspace` y ya no debe invadir el panel derecho.
- La preview calcula escala/rotación con la misma interpretación absoluta que la reproducción sobre el objeto.
- La preview usa escala relativa al tamaño base mostrado para evitar aparentes multiplicaciones visuales.
- Los keyframes creados en el mismo milisegundo ahora se fusionan en un único keyframe completo.
- Esto permite combinar posición, rotación y escala en el mismo punto temporal sin que se sobrescriban como keyframes separados.
- El layout adaptable se aplica sobre `#app`, que es el contenedor real de la aplicación.


## Beta 0.1.8 / v108 Animation Key Merge + Order Fix

Correcciones:

- Los keyframes se normalizan siempre en orden ascendente por tiempo.
- Se fusionan automáticamente los keyframes duplicados en el mismo milisegundo.
- `sampleTransformClip()` evalúa siempre de izquierda a derecha en la línea de tiempo.
- `Añadir key` y la edición numérica trabajan ahora sobre un keyframe completo: `x`, `y`, `rotation` y `scale`.
- Editar escala en un keyframe ya no debe eliminar o sustituir la rotación del mismo keyframe, y viceversa.
- Si se cambia el tiempo de un keyframe para hacerlo coincidir con otro, se fusionan.


## Beta 0.2.0 / v200 Animation Tracks Refactor

Refactorización estructural del sistema de animación:

- Nuevo modelo interno por tracks/canales:
  - `tracks.x.keys`;
  - `tracks.y.keys`;
  - `tracks.rotation.keys`;
  - `tracks.scale.keys`.
- Cada canal tiene sus propios keyframes independientes.
- Se elimina la dependencia funcional del antiguo modelo de `keyframes[]` completos.
- Migración automática desde clips antiguos con `keyframes[]` hacia `tracks`.
- `sampleTrack()` interpola cada propiedad de forma independiente.
- `sampleTransformClip()` compone el transform final desde los cuatro canales.
- Preview y runtime usan el mismo sampler.
- Añadido botón `Insertar transform completo`, que crea keys en los cuatro canales en el tiempo actual del playhead.
- `Añadir key canal` crea solo el key del canal seleccionado.
- Doble clic en una fila del timeline crea key solo en ese canal.
- Esto permite tener en el mismo milisegundo:
  - rotación = 90;
  - escala = 1.5;
  - x/y independientes;
  sin que las propiedades se pisen.


## Beta 0.2.1 / v201 Animation Clip Create Fix

Correcciones:

- Corregida una recursión interna del nuevo sistema por tracks:
  `normalizeTransformClip()` reconstruía `keyframes[]` usando `sampleTransformClip()`, y el sampler volvía a llamar a `normalizeTransformClip()`.
- Ahora `keyframes[]` legacy se genera sin llamar al sampler principal.
- `Añadir clip` vuelve a crear correctamente un clip sobre el objeto seleccionado.
- El objeto seleccionado debe aparecer de nuevo en la ventana de preview.


## Beta 0.2.2 / v202 Transform Gizmos

Mejora de UI manipulativa:

- Añadidos gizmos sobre el objeto seleccionado.
- Arrastrar el objeto modifica `x` e `y`.
- Tiradores de esquina modifican `scale`.
- Tirador circular superior modifica `rotation`.
- La edición numérica sigue funcionando igual.
- Los gizmos están activos en:
  - editor de escena;
  - editor de animación.
- Los cambios hechos con ratón actualizan los campos numéricos de propiedades y del editor de animación.


## Beta 0.2.3 / v203 Animation Gizmos + Checkbox Fix

Correcciones:

- Los gizmos del objeto seleccionado también actualizan keyframes en el editor de animaciones.
- Arrastrar el objeto en modo Animaciones crea/actualiza keys de `x` e `y` en el tiempo actual del playhead.
- Tirar de una esquina en modo Animaciones crea/actualiza key de `scale` en el tiempo actual del playhead.
- Rotar con el tirador circular en modo Animaciones crea/actualiza key de `rotation` en el tiempo actual del playhead.
- El preview de animación se actualiza mientras se manipula el objeto.
- Corregida la maquetación de checkboxes: ahora ocupan el espacio mínimo y el texto queda junto al checkbox.


## Beta 0.2.4 / v204 Preview Gizmos + Key Navigation

Correcciones y mejoras:

- Añadidos gizmos propios dentro de la ventana de preview de animación.
- La ventana de preview no usaba los mismos elementos DOM que el stage, por eso los gizmos del editor de escena no podían aparecer ahí.
- Los gizmos del preview permiten:
  - escalar con esquinas;
  - rotar con tirador circular.
- Estos gizmos crean/actualizan keys en el tiempo actual del playhead.
- Añadidos botones:
  - keyframe anterior;
  - keyframe siguiente.
- Los botones saltan al tiempo exacto del keyframe más cercano sin tener que acertar manualmente el milisegundo.


## Beta 0.2.5 / v205 Animation Editor Repair

Investigación y corrección:

- La Beta 0.2.4 llamaba a `appendPreviewGizmos()` desde `updateAnimationPreview()`.
- El bloque de funciones de preview no se había insertado realmente en `09_transform_animations.js`.
- Eso provocaba un `ReferenceError` en cuanto se refrescaba el preview.
- Al fallar `updateAnimationPreview()`, quedaban rotos en cascada:
  - Play;
  - scrub del playhead;
  - añadir keyframes;
  - visualización de gizmos del preview.
- Añadidas de nuevo, de forma explícita, las funciones:
  - `appendPreviewGizmos()`;
  - `startPreviewMoveGizmo()`;
  - `startPreviewScaleGizmo()`;
  - `startPreviewRotateGizmo()`;
  - `nearestAnimationKeyTime()`;
  - `jumpAnimationKey()`.
- Añadido gizmo central de traslación dentro del preview.
- Reforzado el CSS para que los gizmos del preview no queden ocultos por overflow o stacking.


## Beta 0.2.6 / v206 Animation Pivot Consistency

Corrección:

- Detectado que la Beta 0.2.2 añadió al final del CSS:
  `transform-origin: 0 0` para `.sceneObject`.
- Eso hacía que en escena/runtime el objeto rotase y escalase desde la esquina superior izquierda.
- El preview de animación, en cambio, usaba pivote central.
- Se unifica el pivote de ambos sistemas:
  - `.sceneObject`: centro;
  - `.animationPreviewObject`: centro.
- Ajustado también `objectCenterStage()` para que los gizmos calculen el centro real sin multiplicarlo por la escala.


## Beta 0.3.0 / v300 Path Animation

Nueva fase del editor de animaciones:

- Añadidas pestañas `Transform` y `Path`.
- El sistema de Path usa:
  - puntos de trayectoria;
  - keys de progreso entre 0% y 100%;
  - opción de path cerrado;
  - opción de orientar el objeto según la tangente del path;
  - offset de rotación.
- El path se combina con los tracks existentes:
  - si `Path` está desactivado, `x/y` vienen de los tracks normales;
  - si `Path` está activado, `x/y` vienen del path;
  - `scale` sigue viniendo del track de escala;
  - `rotation` puede venir del track de rotación o de la orientación automática al path.
- El editor muestra una línea de path y puntos manipulables sobre el stage en modo Animaciones > Path.
- Se añade una fila `Path %` al timeline.
- Los botones de key anterior/siguiente tienen en cuenta keys de Transform y keys de Path.


## Beta 0.3.1 / v301 Visual Path Canvas

Mejora de uso del path animation:

- Añadido un lienzo visual dentro de la pestaña `Path`.
- El lienzo muestra la escena actual como referencia.
- Se renderizan los fondos y objetos de la escena como plantilla visual.
- El objeto seleccionado queda resaltado.
- Doble clic sobre la referencia añade un punto del path en coordenadas reales de escena.
- Los puntos se pueden arrastrar directamente sobre la referencia visual.
- El path mantiene coordenadas reales, por lo que no hay que escribir números a ciegas.
- Se muestra un marcador de la posición actual del objeto sobre el path.


## Beta 0.3.2 / v302 Path Editing + Pencil Mode

Mejoras:

- Corregido el arrastre de puntos del path en el canvas visual.
- Antes se re-renderizaba todo el editor durante el drag, lo que hacía que los puntos se quedaran atascados.
- Ahora durante el drag solo se actualizan:
  - el punto;
  - la línea del path;
  - el marcador de posición.
- El editor completo se re-renderiza al soltar el ratón.
- Añadido modo `Puntos`.
- Añadido modo `Lápiz`.
- En modo Lápiz puedes dibujar el trazado directamente sobre la referencia de escena.
- El trazo dibujado se simplifica automáticamente con Ramer-Douglas-Peucker.
- Añadidos controles:
  - tolerancia de simplificación;
  - máximo de puntos.
- Así se evita que un trazo libre genere cientos o miles de puntos innecesarios.


## Beta 0.3.3 / v303 Path Point Drag Fix

Correcciones:

- Rehecho el arrastre de puntos del path visual.
- Ahora usa `setPointerCapture()` cuando está disponible.
- El movimiento se procesa con `requestAnimationFrame`.
- Durante el drag no se re-renderiza el editor ni se reconstruye el DOM.
- Se actualiza solo:
  - el handle del punto;
  - la línea SVG;
  - el marcador de posición.
- Añadido `touch-action: none` y `user-select: none` en el canvas para evitar interferencias del navegador.
- La lista de puntos queda plegada por defecto en un bloque `details`.
- La lista de puntos queda como consulta discreta, no como elemento visual dominante.


## Beta 0.3.4 / v304 Path Drag Deep Fix

Investigación:

- El lápiz funcionaba porque trabajaba directamente sobre el canvas.
- El drag de puntos dependía de `button.pathCanvasPoint` y de handlers individuales en cada botón.
- Esa combinación podía quedar bloqueada por comportamiento nativo del botón/foco/click y por reconstrucciones del DOM.
- Se ha eliminado el uso de `<button>` para los puntos del path.

Corrección:

- Los puntos del path ahora son `div` con `role="button"`, no botones nativos.
- El drag se gestiona por delegación desde `pathSceneCanvas`.
- `pointerdown` detecta si el target es `.pathCanvasPoint` y arranca el drag.
- El movimiento se escucha en `document` con captura.
- Durante el movimiento no se re-renderiza el canvas ni el editor.
- Solo se actualizan:
  - coordenadas del punto;
  - posición del handle;
  - polyline SVG;
  - marcador del objeto.
- Al soltar se re-renderiza una sola vez.


## Beta 0.3.5 / v305 Path Editor + Timing Fix

Correcciones y mejoras:

- El modo Puntos ya no depende solo de `pointermove`.
- El drag escucha tanto `pointermove` como `mousemove` en `document`, en fase de captura.
- Esto actúa como fallback cuando el navegador o algún contenedor bloquea la continuidad de `pointer events`.
- En modo Puntos, un clic sobre el canvas añade un punto directamente.
- Ya no es necesario usar el botón `Añadir punto` para crear puntos.
- Un clic sobre un punto no crea otro punto; arrastrar un punto lo mueve.
- Añadido campo `Duración ciclo ms` en la pestaña Path.
- Al cambiar la duración del ciclo del path, las keys de progreso se reescalan:
  - 0% queda al inicio;
  - 100% queda al final de la duración indicada.
- Así, si aumentas la duración, el path se reproduce más lento en vez de terminar pronto y quedarse quieto.
- Cambiar la duración general del clip desde la pestaña Path también ajusta el progreso del path a esa duración.


## Beta 0.3.6 / v306 Local DB Load Buttons

Corrección de flujo de guardado/carga:

- El guardado local existía internamente mediante IndexedDB (`saveToDb()` / `loadFromDb()`).
- En el menú Archivo no estaba expuesto claramente el botón para recuperar esos estados.
- Añadidos botones visibles:
  - `Guardar localmente`;
  - `Cargar localmente`.
- `Cargar localmente` recupera el proyecto guardado en IndexedDB del mismo navegador/origen.
- Al cargar desde IndexedDB se actualiza el mensaje de archivo activo para indicar que viene de la BD local.


## Beta 0.3.7 / v307 Graph Audio Runtime Fix

Correcciones:

- `Probar grafo` ya no ejecuta siempre `entityPlayer`.
- Ahora ejecuta el evento seleccionado en los desplegables del editor de nodos.
- Si seleccionas `Evento / Inicio de escena`, probará realmente los nodos `Inicio de escena`.
- El nodo `Reproducir audio` usa una función específica `playGraphAudioFromNode()`.
- Esa función llama a `playAudioAsset()`, la misma ruta fiable que usa el panel de audio.
- Los campos de nodo tipo select, incluido `Audio`, ahora actualizan también en evento `change`, no solo `input`.
- Al reproducir audio se actualiza el texto de estado con el nombre del audio.


## Beta 0.3.8 / v308 Graph Action Runtime Fix

Correcciones:

- Reforzada la ejecución de acciones desde nodos.
- `Reproducir spritesheet` ahora usa `playGraphSpriteAnimationFromNode()`.
- La función resuelve el objetivo de forma más robusta:
  - conexión de datos `target`;
  - objeto objetivo del panel;
  - objeto del nodo;
  - sujeto/contexto;
  - Player como fallback.
- Si el clip viene como texto visual tipo `Sprite: run`, se normaliza a `run`.
- Si el sprite del objeto estaba desactivado, el nodo lo activa antes de reproducir.
- Si el clip no existe, se muestra un mensaje claro.
- El nodo `Reproducir audio` ahora muestra mensaje de confirmación cuando entra en ejecución.
- El texto de estado indica qué audio o spritesheet se está intentando reproducir.


## Beta 0.3.9 / v309 Graph Live Runtime Fix

Investigación y corrección:

- Si aparece `Animación: run`, el nodo sí se ejecuta.
- El fallo probable estaba después: el objeto podía no estar renderizado como spritesheet cuando el nodo activaba la animación.
- `updateObjectElement()` solo actualiza transform/background-position; no reconstruye el DOM del objeto.
- Ahora, al ejecutar `Reproducir spritesheet` desde nodo:
  - se activa `sprite.enabled`;
  - se fuerza `renderStage()` para reconstruir el elemento visual;
  - se ejecuta `playObjectAnimation()`;
  - se arranca `startAnimationLoop()`;
  - se actualiza el elemento visible.
- Para audio:
  - si el navegador bloquea audio por política de autoplay, se guarda como pendiente;
  - se reintenta al siguiente clic/pointerdown del usuario;
  - se muestra un mensaje claro de bloqueo o ejecución.


## Beta 0.4.0 / v400 Audio + Hotspot Rearm

Audio de nodos:

- El nodo `Reproducir audio` usa ahora exactamente la misma ruta que el botón de prueba del panel de assets:
  `playAudioAsset(id, { scope: "preview", loop: false, volume })`.
- Así no depende de que el audio esté asociado a la escena ni del volumen master de escena.
- Se mantiene el mensaje de diagnóstico en estado y en pantalla.

Hotspots / triggers:

- Añadido sistema de `rearme por salida`.
- Al entrar en una escena, si el player aparece ya dentro de un hotspot/trigger, ese trigger queda bloqueado.
- Mientras el player permanezca dentro, no se ejecuta ni `onEnter` ni `whileInside`.
- Cuando el player sale del hotspot, el trigger se rearma.
- Si vuelve a entrar después de salir, entonces se ejecuta normalmente.
- Esto evita el rebote de cambio de escena cuando el player aparece encima del hotspot de retorno.


## Beta 0.4.1 / v401 Audio Diagnostics + Portal Rearm Fix

Investigación de audio:

- El panel de assets sí reproducía audio porque usa una llamada directa desde un clic del usuario.
- Los nodos pueden dispararse desde lógica, `sceneStart` o tras un cambio de escena, donde `HTMLAudio.play()` puede fallar por políticas del navegador.
- Además, los sonidos `scope: preview` no se estaban conservando en `runtimeAudio`, así que se añade una lista `runtimeAudio.preview`.

Corrección de audio:

- Añadido sistema WebAudio para audio de nodos:
  - `ensureAudioContext()`;
  - `unlockAudioSystem()`;
  - `decodedAudioBufferForAsset()`;
  - `playAudioBufferAsset()`.
- El audio de nodos intenta primero WebAudio.
- Se desbloquea el sistema de audio en `pointerdown` y `keydown`.
- Si WebAudio no está disponible, se usa fallback con `playAudioAsset(..., scope: "preview")`.
- Los audios preview se conservan en memoria hasta terminar.

Hotspots / portales:

- Refuerzo del sistema de rearme por salida.
- Aunque falle el cebado inicial, si la primera evaluación detecta al player ya dentro del hotspot, el trigger queda bloqueado.
- No se dispara hasta que el player salga físicamente del hotspot.
- Al salir, el trigger se rearma.
- Al volver a entrar después de salir, se dispara normalmente.


## Beta 0.4.2 / v402 Audio Codex + Portal Lock

Audio:

- Se integra la corrección que funcionó en Codex:
  - `node.audioId`;
  - fallback a `obj.audioId`;
  - fallback al primer audio asociado a la escena;
  - reproducción con `playAudioAsset(..., { scope: "scene" })`.
- Se abandona la ruta experimental principal con `scope: "preview"` para nodos de audio.
- Se mantiene diagnóstico en `statusText`.

Hotspots / portales:

- Rehecho el bloqueo de triggers espaciales con un registro real por trigger:
  - escena;
  - nodo;
  - player;
  - target/hotspot;
  - motivo del bloqueo;
  - tiempo fuera del hotspot.
- Si el player aparece dentro del hotspot, el portal queda bloqueado hasta salir.
- Si el cebado inicial falla, la primera evaluación que detecte al player dentro también bloquea el portal.
- Para rearmarse no basta con salir durante un frame: debe permanecer fuera unos 420 ms.
- Cuando se rearma, no dispara en ese mismo frame; solo se disparará si vuelve a entrar después.


## Beta 0.4.3 / v403 Audio Runtime + Portal Spawn Lock

Audio:

- Se sustituye el bloque de audio de `06_navigation_runtime.js` por el patrón del runtime funcional subido.
- Se elimina la ruta experimental WebAudio/preview para los nodos.
- `playGraphAudioFromNode()` conserva la corrección de Codex:
  - `node.audioId`;
  - fallback a `obj.audioId`;
  - fallback al primer audio asociado a la escena;
  - `playAudioAsset(..., { scope: "scene" })`.

Portales/hotspots:

- Rehecho el bloqueo de portales con una zona de seguridad alrededor del hotspot.
- Si el player aparece dentro o prácticamente encima de un portal, el portal queda bloqueado.
- El bloqueo no se libera solo por dejar de tocar el collider durante un frame.
- Para rearmarse, el player debe salir de la zona de seguridad ampliada durante unos 420 ms.
- Al rearmarse no dispara en ese mismo frame; solo se activará si vuelve a entrar después.


## Beta 0.4.4 / v404 Audio Legacy Route + Portal Guard

Audio:

- Se mantiene el bloque de audio funcional basado en la versión antigua subida.
- Añadida cola de audio para nodos:
  - si `sceneStart` o un nodo dispara audio antes de que el navegador permita reproducirlo, el audio no se pierde;
  - queda en `pendingNodeAudioQueue`;
  - se reintenta en el primer `pointerdown` o `keydown`.
- Al pulsar Play se intenta desbloquear el audio mediante un audio silencioso.
- `Probar grafo` también intenta desbloquear audio antes de ejecutar el grafo.

Portales:

- Se mantiene la zona de seguridad alrededor del portal.
- Se amplía el cooldown de cambio de escena para evitar rebotes inmediatos.
- Se registra `lastSceneTransition` para poder seguir endureciendo la lógica si hace falta.


## Beta 0.4.5 / v405 Audio Debug + Scene Node UI

Cambios de audio:

- Se mantiene la ruta antigua/funcional: `playAudioAsset(..., scope: "scene")`.
- Añadido diagnóstico claro en `statusText`:
  - audio solicitado por nodo;
  - id del audio;
  - intento de reproducción;
  - reproducción correcta;
  - bloqueo por navegador.
- La confirmación de audio ya no ensucia el cuadro de diálogo del juego salvo errores/bloqueos.

Cambios del nodo Inicio de escena:

- El panel del nodo muestra ahora `Escena de este inicio`.
- El selector está desactivado porque el grafo pertenece a la escena actual, pero deja claro a qué escena hace referencia el nodo.
- Esto evita confusión: un `Inicio de escena` situado en la Escena 1 no se ejecuta al entrar en la Escena 2.

Cambios de mensajes:

- Eliminado el mensaje de juego `Animación: run`; queda solo como estado interno.


## Beta 0.4.6 / v406 Play Gesture Audio + Scene Selector

Audio:

- Si `Probar grafo` suena pero `Play` no, el problema está en el gesto de usuario / momento de ejecución.
- Añadido `primeSceneStartAudioOnUserGesture()`.
- Al pulsar Play, antes de renderizar y antes de cualquier splash/setTimeout, se buscan los nodos `Inicio de escena` de la escena inicial.
- Si de esos nodos se alcanza un `Reproducir audio`, se lanza en el propio gesto del botón Play.
- La ejecución normal de `Inicio de escena` se mantiene después, pero si reproduce el mismo audio con `scope: scene`, simplemente lo reinicia/actualiza.

Nodo Inicio de escena:

- `Escena de este inicio` deja de estar gris.
- Ahora funciona como selector de navegación entre escenas: al cambiarlo saltas al grafo de esa escena.
- Sigue sin reasignar el nodo a otra escena, porque cada grafo pertenece a su propia escena.


## Beta 0.4.7 / v407 Scene Reentry Audio Replay

Audio:

- Al entrar por segunda vez en una escena, los nodos de `Inicio de escena` deben volver a dispararse.
- Añadida función general `playSceneStartAudioNodes()`.
- `primeSceneStartAudioOnUserGesture()` ahora es solo una llamada especial para el primer Play.
- `startCurrentSceneRuntime()` llama también a `playSceneStartAudioNodes({ reason: "ENTRA ESCENA", force: true })` cada vez que se carga una escena.
- Esto hace que, al salir de una sala y volver a entrar, el audio de `Inicio de escena` vuelva a pedirse.
- La ejecución normal del grafo `runLogicGraph("sceneStart")` sigue activa.


## Beta 0.4.8 / v408 Node Driven Scene Entry Audio

Corrección conceptual:

- Sí: el parche anterior metía una ejecución especial al pulsar Play para evitar el bloqueo del navegador.
- Eso no debe ser la lógica principal del motor.
- Ahora el audio vuelve a depender solo de los nodos:
  `entrar en escena -> runLogicGraph("sceneStart") -> Reproducir audio`.

Reentrada de escena:

- `startCurrentSceneRuntime()` ya no usa solo `scene.id` para decidir si una escena ya fue iniciada.
- Ahora usa un `sceneEntryToken` que cambia cada vez que se entra realmente en una escena.
- Así, si sales de una sala y vuelves a entrar en la misma, el token es distinto y `Inicio de escena` se ejecuta de nuevo.
- Se elimina la llamada especial `primeSceneStartAudioOnUserGesture()` desde Play.
- La cola de audio permanece solo como protección si el navegador bloquea `audio.play()`, no como lógica paralela al grafo.

Diagnóstico:

- Al entrar en una escena, `statusText` muestra:
  `ENTRA ESCENA: nombre · ejecutando Inicio de escena`.


## Beta 0.4.9 / v409 Node Audio Unlock Fallback

Corrección:

- Play ya no reproduce nodos ni audios concretos por su cuenta.
- Play solo desbloquea el motor de audio del navegador mediante `AudioContext`.
- La lógica sigue dependiendo exclusivamente de nodos:
  `Inicio de escena -> Reproducir audio`.

Fallback:

- `playAudioAsset()` mantiene primero la ruta antigua `HTMLAudio`.
- Si `HTMLAudio.play()` falla por bloqueo del navegador, el mismo audio se reproduce por `WebAudio`, siempre que el `AudioContext` ya haya sido desbloqueado por Play/clic/tecla.
- Si tampoco puede, queda en cola para la siguiente interacción.
- Al cambiar de escena se detienen tanto audios HTML como fuentes WebAudio de escena.

Objetivo:

- Que `Inicio de escena` vuelva a sonar al entrar y reentrar en una sala.
- Sin usar un disparo paralelo que busque audios fuera del grafo.


## Beta 0.5.0 / v500 Node WebAudio Engine

Audio de nodos:

- Play no reproduce nodos ni audios concretos.
- Play solo desbloquea un motor de audio persistente basado en `AudioContext`.
- La lógica sigue dependiendo del grafo:
  `Inicio de escena -> Reproducir audio`.
- El nodo `Reproducir audio` ya no depende primero de `HTMLAudio.play()`.
- Ahora usa `playGraphAudioAsset()`, que:
  - toma el `dataUrl` del asset;
  - lo convierte a `ArrayBuffer` sin `fetch(dataUrl)`;
  - decodifica con `AudioContext.decodeAudioData`;
  - reproduce mediante `AudioBufferSourceNode`.
- Si el `AudioContext` aún no está en estado `running`, el audio queda en cola.
- Al primer `Play`, clic o tecla se desbloquea el motor y se vacía la cola.
- Al cambiar de escena se detienen tanto audios HTML como fuentes de grafo WebAudio.

Objetivo:

- Que el audio de `Inicio de escena` dependa de nodos, pero no quede bloqueado por la política de autoplay de `HTMLAudio`.


## Beta 0.5.1 / v501 Audio Graph Diagnostic

Diagnóstico:

- Añadido panel flotante `Audio / grafo` en modo Play.
- También se escribe en consola con prefijo `[AventurIA AudioGraph]`.
- El panel muestra:
  - entrada de escena;
  - cuántos nodos `Inicio de escena` se encontraron;
  - si se ejecuta el nodo `Inicio de escena`;
  - si se ejecuta el nodo `Reproducir audio`;
  - audioId y nombre del asset;
  - estado del AudioContext;
  - conversión dataUrl -> ArrayBuffer;
  - resultado de `decodeAudioData`;
  - resultado de `source.start`.

Objetivo:

- Dejar de adivinar si el fallo está en el grafo o en el motor de audio.
- Si no aparece `Nodo Reproducir audio ejecutado`, el grafo no llega al nodo.
- Si aparece pero no hay `source.start OK`, el problema está en decodificación/reproducción.
- Si aparece `source.start OK` pero no suena, el problema es salida/volumen/silencio del archivo o parada inmediata.


## Beta 0.5.2 / v502 Visible Audio Diagnostics

Cambios:

- El panel `Audio / grafo` ahora es fijo y visible en pantalla.
- Añadido botón `Diagnóstico audio escena`.
- El diagnóstico lista:
  - escena actual;
  - número de nodos;
  - número de conexiones;
  - nodos `Inicio de escena`;
  - recorrido desde `Inicio de escena`;
  - salidas `then`;
  - si hay o no nodo `Reproducir audio` alcanzable;
  - `audioId`, asset y longitud de `dataUrl`.
- `runLogicGraph()` registra evento, escena y número de starts.
- `executeFlowFrom()` registra cada nodo que entra, resultado y salidas.


## Beta 0.5.3 / v503 SceneStart Watchdog

Corrección:

- No reproduce audio directamente.
- No busca nodos de audio fuera del grafo.
- Solo garantiza que, al entrar en Play o cambiar de escena, se llame a `startCurrentSceneRuntime()`.
- Si `startCurrentSceneRuntime()` ya se ejecutó para ese `sceneEntryToken`, no lo duplica.

Logs añadidos:

- `setMode(play)`
- `PLAY prepara escena inicial`
- `runSplashThenStart`
- `SceneStart watchdog solicitado`
- `SceneStart watchdog ejecuta startCurrentSceneRuntime`
- `SceneStart watchdog no duplica`

Objetivo:

- Confirmar y corregir que el arranque real de escena se dispare siempre.
- El audio sigue dependiendo del grafo:
  `Inicio de escena -> Reproducir audio`.


## Beta 0.5.4 / v504 SceneStart Layout Fix

Correcciones:

- El panel de diagnóstico ya no se inserta dentro del HTML del layout.
- Ahora se crea por JavaScript como overlay externo en `document.body`.
- Esto evita romper el panel derecho o la estructura de la interfaz.
- `setMode(play)` programa el watchdog de `sceneStart` al principio, antes de `renderAll()` y antes de cambios visuales.
- `setMode(play)` usa `try/catch` en las partes visuales para que un fallo de UI no impida ejecutar `startCurrentSceneRuntime()`.

Objetivo:

- Recuperar el panel derecho.
- Garantizar que `ENTRA ESCENA`, `runLogicGraph(sceneStart)` y `FLOW...` aparezcan aunque falle alguna actualización de interfaz.


## Beta 0.5.5 / v505 Right Panel + Reentry Fix

Panel derecho:

- Se corrige el CSS responsive usando los selectores reales:
  - `#app`, no `.app`;
  - `.sidebar.right`, no `.rightbar`.
- Se elimina el segundo `<link rel="stylesheet">` duplicado.
- El panel derecho se fuerza en la tercera columna del grid.

Reentrada de escena:

- `startCurrentSceneRuntime()` ya no marca el `sceneEntryToken` como ejecutado hasta después de intentar `runLogicGraph("sceneStart")`.
- Si falla antes de llegar al grafo, el watchdog tardío puede reintentarlo.
- `requestSceneStartRuntime()` programa varios intentos: 0, 200, 600 y 1050 ms.
- Sigue sin reproducir audio directamente: solo llama a `startCurrentSceneRuntime()`.
- El audio sigue dependiendo de nodos:
  `Inicio de escena -> Reproducir audio`.


## Beta 0.5.6 / v506 Fixed Right Panel

Panel derecho:

- El panel derecho ya no depende de la tercera columna del grid.
- Ahora se fija con CSS a la derecha de la ventana (`position: fixed`).
- El área principal `#app` se reduce para dejar espacio reservado al panel.
- Se añade `id="rightSidebar"` al panel derecho.
- Se mantiene el diagnóstico de layout en consola:
  `[AventurIA layout] right sidebar ...`

Audio / reentrada:

- Se mantienen los cambios de `sceneEntryToken` y watchdog de 0.5.5.
- Esta versión prioriza recuperar el panel derecho sin tocar la lógica de nodos.


## Beta 0.5.7 / v507 Debug Module Cleanup

Limpieza de diagnóstico:

- El panel flotante `Audio / grafo` ya no aparece por defecto.
- La función `audioGraphDebug()` queda como stub silencioso para no romper llamadas internas.
- El diagnóstico se separa en el módulo opcional:
  `js/99_audio_graph_debug_optional.js`

Para volver a activar el diagnóstico:

1. Abrir `index.html`.
2. Añadir esta línea justo antes de `</body>`, después de `10_bindings_main.js`:

   `<script src="js/99_audio_graph_debug_optional.js"></script>`

3. Recargar la app.

Panel derecho:

- Se mantiene la corrección de 0.5.6 con `#rightSidebar` fijo a la derecha.

Audio:

- Se mantiene el flujo por nodos y los cambios de reentrada de escena.
- El audio de escena desde propiedades de escena queda como vía recomendada si quieres sonido ambiental o al entrar.


## Beta 0.5.8 / v508 Scene Audio Reentry Fix

Audio de propiedades de escena:

- El audio marcado en `Propiedades de escena > Reproducir al entrar` ahora tiene rearmado propio.
- Se añade `playSceneEntryAudioForCurrentToken()`.
- El audio de escena se controla mediante `sceneEntryToken`, no mediante el token del grafo.
- Al entrar en una escena, el audio de escena se detiene y se reinicia.
- Al salir y volver a entrar en la misma escena, se genera un nuevo token y el audio vuelve a sonar.
- El token evita que los reintentos del watchdog dupliquen el mismo audio.

Nodos:

- Los nodos `Inicio de escena -> Reproducir audio` siguen existiendo, pero el audio ambiental/de entrada se recomienda desde propiedades de escena.


## Beta 0.5.9 / v509 Scene Audio Reentry Watch

Corrección adicional del audio de escena:

- `playSceneAudio()` usa primero el motor WebAudio persistente (`playGraphAudioAsset`) antes de recurrir a HTMLAudio.
- Esto evita bloqueos de reproducción al volver a una escena.
- Añadido `startSceneAudioReentryWatcher()`, un vigilante interno silencioso que detecta cambios de escena durante Play.
- El audio se rearma si cambia la escena activa, incluso si el token no cambia como se esperaba.
- `gotoScene()` reinicia el estado interno de audio de escena y llama al audio de entrada inmediatamente.
- Se mantienen reintentos cortos, pero no deberían duplicar el audio porque el helper bloquea duplicados reales.

Debug:

- El módulo `js/99_audio_graph_debug_optional.js` sigue incluido pero desactivado.


## Beta 0.5.10 / v510 UI Title + Toolbar Groups

Interfaz:

- El título visible queda limpio: `AventurIA`.
- El `<title>` del navegador también queda como `AventurIA`.
- Añadido icono blanco provisional delante del título con `.appLogoIcon`.
- Añadidos separadores visuales en el menú superior:
  - grupo 1: `Editar`, `Play`, `Stop`;
  - grupo 2: `Nodos`, `Mecanismos`, `Animaciones`.

Audio:

- Se mantiene la corrección de 0.5.9:
  - audio de escena con WebAudio;
  - reentrada de escena;
  - watcher silencioso;
  - debug opcional desactivado.


## Beta 0.5.11 / v511 Toolbar Boxes + Local Confirm

Interfaz:

- Los grupos del menú superior ahora están dentro de cajas independientes:
  - `Editar / Play / Stop`;
  - `Nodos / Mecanismos / Animaciones`.
- Se elimina el separador fino entre esos dos grupos.
- Las cajas tienen más separación visual y funcionan de forma similar a los grupos de herramientas como objeto/zona navegable.

Seguridad de guardado local:

- `Guardar localmente` pide confirmación antes de sobrescribir la copia local.
- `Cargar localmente` pide confirmación antes de reemplazar el proyecto actual.

Se mantiene:

- Audio de escena funcionando al reentrar.
- Panel derecho fijo.
- Título limpio `AventurIA`.
- Módulo opcional `js/99_audio_graph_debug_optional.js` desactivado por defecto.


## Beta 0.5.12 / v512 Toolbar Group Visual Fix

- Se elimina la caja contenedora extra de los modos superiores (`modeToolGroup`) para que no aparezcan bloques o franjas grises debajo de los iconos.
- Los dos grupos superiores siguen en cajas independientes.
- Se añade un reset visual adicional a los botones-icono (`appearance: none`) para evitar artefactos del navegador.


## Beta 0.6.0 / v600 Object States + Collectibles

Sistema de estados de objeto:

- Cada objeto tiene una lista de estados.
- Cada estado puede tener:
  - nombre;
  - imagen propia;
  - visible / no visible;
  - interactuable / no interactuable.
- En propiedades del objeto se añade el bloque `Estados del objeto`.
- El `Estado inicial` se rellena con los estados definidos en el objeto.
- `Cambiar estado` en nodos aplica ahora el estado completo, no solo una etiqueta.

Recogibles:

- Los objetos tipo `Objeto recogible` siguen pudiéndose recoger con clic.
- Al recoger, el objeto pasa al `Estado al recoger`.
- Si no se define otro estado, usa `hidden`.
- Se puede asignar un `Icono en inventario` independiente.

Ejemplo de puzzle:

- Maceta:
  - estado `default` o `intacta`: imagen de maceta intacta;
  - estado `rota`: imagen de maceta rota.
- Llave:
  - estado `hidden` u `oculta`: no visible;
  - estado `visible`: visible e interactuable;
  - estado `recogida`: no visible;
  - tipo: `Objeto recogible`.
- Al usar martillo en maceta:
  - cambiar estado de maceta a `rota`;
  - mostrar/cambiar estado de llave a `visible`.
- Al hacer clic en llave:
  - se añade al inventario;
  - pasa a `recogida` o `hidden`.


## Beta 0.6.1 / v601 Object States Image Dropdown Fix

Corrección:

- Eliminada una llamada recursiva accidental dentro de `renderObjectStateEditor()`.
- Esa recursión podía romper el panel de propiedades y dejar vacíos los desplegables de imagen.
- `readFilesAsAssets()` ahora espera a terminar la importación de todos los archivos antes de llamar a `renderAll()`.
- Tras importar imágenes se fuerza también `renderProperties()` para refrescar:
  - imagen principal del objeto;
  - imagen del estado;
  - icono de inventario.

Se mantiene:

- sistema de estados por objeto;
- recogibles con estado al recoger;
- audio de escena con reentrada;
- panel derecho fijo;
- debug opcional desactivado.


## Beta 0.6.2 / v602 Object States UI Fix

Corrección:

- `renderObjectStateEditor(obj)` vuelve a llamarse desde `renderObjectProps()`.
- Los estados recién creados aparecen inmediatamente en:
  - estado inicial;
  - estado editado;
  - estado al recoger.
- Crear estado ahora funciona como un paso único:
  1. pulsas `+ Estado`;
  2. escribes el nombre;
  3. el estado aparece ya con ese nombre.
- Al borrar o renombrar estados, se refresca el panel de propiedades.
- Al asignar imagen a un estado, se refresca el panel y la vista.

Nota:

- Primero se crea el estado con su nombre.
- Después se elige su imagen, visibilidad e interacción.


## Beta 0.7.0 / v700 Matter.js Physics Editor

Primera capa de física con Matter.js:

- Se carga Matter.js 0.20.0 desde CDN.
- Nuevo modo superior `Física`.
- Nuevo panel `Editor de física`.
- Propiedades de física por escena:
  - activar físicas;
  - gravedad X/Y;
  - velocidad de simulación;
  - límites del escenario;
  - reset al entrar;
  - mostrar cuerpos.
- Propiedades de física por objeto:
  - usar física;
  - dinámico / estático / sensor;
  - caja / círculo / collider actual;
  - masa, densidad, fricción, rebote;
  - bloquear rotación;
  - iniciar quieto;
  - guardar posición inicial.
- Runtime:
  - crea cuerpos Matter.js en Play;
  - sincroniza posición/rotación del objeto con Matter.js;
  - resetea física de escena;
  - sensores y colisiones disparan evento de nodo `Física: colisión/sensor`.
- Nodos físicos añadidos:
  - `Física: aplicar impulso`;
  - `Física: fijar velocidad`;
  - `Física: reset objeto`;
  - `Física: reset escena`;
  - `Física: activar objeto`;
  - `Física: desactivar objeto`.

Editor:

- La 0.7.0 incluye editor visual mínimo para cuerpos básicos.
- Cadenas, pivotes, constraints y resortes quedan para 0.7.1/0.7.2.


## Beta 0.7.1 / v701 Undo + Outliner + Drag Fix

Correcciones y mejoras:

- Añadido sistema `Undo / Redo` con historial de 10 estados.
- Botones superiores:
  - `↶` Deshacer;
  - `↷` Rehacer.
- Atajos:
  - `Ctrl/Cmd + Z`;
  - `Ctrl/Cmd + Shift + Z`;
  - `Ctrl/Cmd + Y`.
- El Outliner ahora muestra acciones por objeto:
  - `⧉` duplicar;
  - `×` eliminar.
- Las acciones del Outliner funcionan también con fondos.
- Corregido el arrastre de objetos de escena:
  - se usa `pointerdown/pointermove/pointerup`;
  - se desactiva el drag nativo del navegador;
  - funciona también en modo Física;
  - actualiza overlay físico al mover objetos.


## Beta 0.7.2 / v702 Drag + Scene Image Dropdown Fix

Correcciones:

- El arrastre de objetos en modo Editor se vuelve más tolerante:
  - usa captura de `pointerdown`;
  - desactiva drag nativo;
  - desactiva selección de texto/imagen al arrastrar;
  - permite arrastrar aunque la herramienta quedara en estado `physics` al volver desde el editor de Física.
- Al entrar en modo Física se resetea la herramienta a `select`.
- Al volver a Editor desde Física/NavEdit se resetea a `select` para evitar bloqueos de arrastre.
- Los dropdowns de imagen del objeto ahora usan `imageAssetsForCurrentSceneDropdown()`:
  - imagen principal del objeto;
  - imagen de estado;
  - icono de inventario.
- Ese listado incluye primero imágenes usadas en la escena actual y después el resto de imágenes importadas al proyecto.
- `fillSelect()` ahora tolera listas vacías o indefinidas sin romper el panel.


## Beta 0.7.3 / v703 Editor Drag + Asset Dropdown Fix

Corrección más profunda:

- El arrastre de objetos del Editor ya no depende solo del handler interno del objeto.
- Se añade `bindStageDirectObjectDragFallback()`:
  - escucha `pointerdown` directamente en el escenario;
  - detecta `.sceneObject`;
  - inicia arrastre aunque capas internas del objeto intercepten el click.
- Al entrar en modo Editor se fuerza `state.tool = "select"`.
- Ningún flag de física debe bloquear el arrastre en Editor.
- El arrastre en Editor ignora Matter.js; solo actualiza `obj.x` y `obj.y`.

Dropdowns de imagen:

- `imageAssetsForCurrentSceneDropdown()` se simplifica:
  - primero usa `state.project.assets.images`;
  - después añade referencias ya usadas por objetos, estados e inventario.
- Se aplica a:
  - imagen principal del objeto;
  - imagen de estado;
  - icono de inventario.
- Tras importar imágenes se fuerza también `renderProperties()`.


## Beta 0.7.4 / v704 Asset Dropdown + Inventory Layout Fix

Correcciones:

- El desplegable de imagen del objeto deja de depender de heurísticas de escena.
- Nuevo `fillImageAssetSelect()` para los selectores de imagen.
- El selector toma imágenes de:
  - `state.project.assets.images`;
  - miniaturas ya pintadas en `#imageAssetGrid` como fallback;
  - referencias usadas por objetos, estados e inventario.
- Se añade una línea informativa bajo el selector de imagen con el número de imágenes detectadas.
- Al cargar imagen directa para un objeto se fuerza `renderProperties()`.

Inventario:

- Nueva propiedad `position` en `inventorySettings`.
- Nueva propiedad `slotSize` en `inventorySettings`.
- Nuevos controles de inventario:
  - posición en pantalla;
  - tamaño de slots.
- Posiciones disponibles:
  - esquina superior izquierda;
  - centrado arriba;
  - esquina superior derecha;
  - esquina inferior izquierda;
  - centrado abajo;
  - esquina inferior derecha.
- El tamaño de slots ajusta el tamaño visible de la cuadrícula y de los iconos.


## Beta 0.7.5 / v705 Asset Store + Inventory Layout Fix

Correcciones:

- Se crea un almacén interno robusto para imágenes:
  - cada imagen importada se guarda como copia embebida `dataUrl`;
  - se normaliza como `{ id, name, type, dataUrl, src }`;
  - el panel de Assets y los dropdowns usan la misma fuente.
- `imageAssetById()` ahora normaliza y, si hace falta, reconstruye assets desde el grid ya renderizado.
- Los dropdowns de imagen usan `imageAssetOptionsForSelect()`:
  - imagen principal del objeto;
  - imagen de estado;
  - icono de inventario.
- El mensaje bajo el selector informa de cuántas imágenes embebidas detecta.

Inventario:

- Se rehace explícitamente el panel de Inventario para que se vean:
  - `Tamaño cuadrícula / slot`;
  - `Posición en pantalla`.
- Posiciones disponibles:
  - superior izquierda;
  - superior centro;
  - superior derecha;
  - inferior izquierda;
  - inferior centro;
  - inferior derecha.
- El tamaño de slot controla también el tamaño visible de los iconos.

Nota técnica:

- En una app web local no se puede escribir automáticamente en un directorio real `/images` sin exportación/ZIP o permiso explícito de sistema de archivos.
- Esta versión guarda las imágenes dentro del proyecto como `dataUrl`.
- Una fase posterior puede añadir exportación publicable con carpeta `/images`.


## Beta 0.7.6 / v706 Physics Per Object + Domain Fix

Corrección conceptual de Matter.js:

- Las físicas quedan separadas en dos niveles:

### Físicas de escena

- Activar/desactivar Matter.js en la escena.
- Gravedad X/Y.
- Velocidad de simulación.
- Límites del escenario.
- Debug visual.
- Dominio físico.

### Dominio físico

- Nuevo selector `Dominio físico` en propiedades de escena.
- Puede ser cualquier objeto/hotspot de la escena.
- Si está vacío, Matter.js se calcula en toda la escena.
- Si se elige un objeto como dominio, solo se crean/simulan cuerpos cuyo centro empieza dentro.
- Si un cuerpo sale del dominio, se congela su velocidad.

### Física del objeto

- El bloque del panel derecho se renombra como `Física Matter.js del objeto`.
- Cada objeto guarda sus propios parámetros en `obj.physics`:
  - enabled;
  - bodyType;
  - shape;
  - mass;
  - density;
  - friction;
  - restitution;
  - lockRotation;
  - startSleeping.
- El panel muestra una línea informativa con el nombre/id del objeto para evitar confundirlo con settings globales.

Nota:

- La física de escena no debe copiarse en objetos.
- La física de objeto no debe aplicarse globalmente.


## Beta 0.7.7 / v707 Editor Drag Physics Isolation Fix

Corrección:

- Los objetos con físicas ya no pueden quedar bloqueados tras un primer arrastre en el Editor.
- Al entrar en modo Editor se llama a `forceStopPhysicsForEditor("enterEditor")`.
- Al iniciar un arrastre manual se detiene cualquier runtime/preview de Matter.js.
- Al terminar el arrastre se vuelve a limpiar Matter.js si no estamos en Play.
- Se libera la captura de puntero al finalizar el arrastre.
- En Editor, el arrastre manual solo modifica `obj.x` / `obj.y`; no usa el cuerpo Matter.js.
- Si el objeto tiene física, al moverlo en Editor se actualiza también:
  - `obj.physics.startX`;
  - `obj.physics.startY`;
  - `obj.physics.startRotation`.
- El overlay físico queda con `pointer-events: none` para que no bloquee clicks ni arrastres.


## Beta 0.7.8 / v708 Real Physics Editor

Corrección:

- El modo `Física` ahora muestra una ventana real de editor.
- La ventana aparece como panel flotante sobre la escena.
- Herramientas visibles:
  - Seleccionar;
  - Caja;
  - Círculo;
  - Sensor;
  - Editar collider;
  - Mostrar cuerpos;
  - Probar física;
  - Stop;
  - Reset.
- El overlay físico de la escena es interactivo en modo Física.
- Puedes hacer clic sobre un cuerpo físico del overlay para seleccionar el objeto.
- Doble clic en un cuerpo físico abre el editor visual de collider.
- Botones rápidos:
  - Dinámico;
  - Estático;
  - Sensor;
  - Desactivar física.
- El botón `Editar collider` ahora llama correctamente a `openColliderEditor(obj.id)`.
- El editor de física ya no es solo el modo de edición normal.


## Beta 0.7.9 / v709 Pathfinding + Accordion Props

Estudio/decisión técnica implementada:

- El pathfinding NO se mezcla con Matter.js.
- Matter.js resuelve cuerpos físicos dinámicos.
- El pathfinding resuelve rutas del player sobre una malla de navegación.
- Se usa A* sobre grid.
- Las zonas navegables existentes siguen funcionando como área válida.
- Los objetos marcados como obstáculo bloquean la ruta.
- Los objetos con física activa y cuerpo no-sensor bloquean por defecto.
- La ruta se simplifica con pruebas de línea caminable para reducir zigzag.

Propiedades de escena:

- Activar/desactivar pathfinding.
- Tamaño de grid.
- Margen de obstáculos.
- Permitir diagonales.
- Ver ruta debug en Play.

Propiedades de objeto:

- Nuevo checkbox: `Este objeto bloquea el paso del player`.

Movimiento:

- `movePlayerTo(point)` ahora calcula ruta A*.
- El player avanza por waypoints.
- Si no hay ruta, muestra mensaje.

UI:

- Panel derecho convertido progresivamente a accordions.
- Las secciones quedan plegadas por defecto.
- Se despliegan haciendo clic en su cabecera.


## Beta 0.7.10 / v710 Click-to-Move Pathfinding Fix

Corrección:

- El pathfinding ya funciona también con clic directo en la escena durante Play.
- Antes solo estaba conectado a la acción de nodo `Desplazar / mover a objeto`.
- Ahora:
  - clic en suelo/fondo durante Play → `movePlayerTo(p)` con A*;
  - clic en objeto interactivo → acción del objeto;
  - clic con item de inventario seleccionado → cancela selección del item, como antes.
- No hace falta configurar nada especial en el player:
  - debe existir un objeto de tipo `Player`;
  - debe tener velocidad mayor que 0;
  - la escena debe tener activado `Pathfinding / navegación`.
- El debug de ruta en Play se hace visible si está activado `Ver ruta debug en Play`.


## Beta 0.7.11 / v711 Play Click Pathfinding Hard Fix

Corrección fuerte del clic para mover:

- Añadido `bindPlayClickToMoveFallback()`.
- Usa `pointerdown` + `pointerup` en captura directa sobre el stage.
- Ya no depende solo de `onclick`.
- Ignora:
  - inventario;
  - cursor de inventario;
  - splash;
  - mensajes;
  - editores flotantes;
  - objetos interactivos.
- Si el clic es suelo/fondo/objeto no interactivo:
  - llama a `movePlayerTo(p)`;
  - por tanto usa A* y obstáculos.
- Mensajes de diagnóstico:
  - si no hay Player;
  - si el Player tiene velocidad 0.


## Beta 0.7.12 / v712 Physics Play + Pathfinding Isolation

Corrección importante:

- El botón `Probar` del editor de física ya no cambia `scene.physics.enabled`.
- Play ya no debe activar automáticamente el check `Activar físicas en esta escena`.
- Matter.js solo arranca en Play si la escena tiene físicas activadas manualmente.
- El `Player` de aventura queda fuera de Matter.js por defecto:
  - el Player se mueve por pathfinding;
  - Matter.js no debe bloquearlo;
  - esto evita que el point-and-click quede congelado.
- Si más adelante se quiere un player físico real, se hará como opción separada.

Diagnóstico añadido:

- Al hacer clic en Play, el status muestra coordenadas del click.
- Si no hay ruta, el status sugiere bajar margen de obstáculos o tamaño de grid.
- Si el click cae fuera del área navegable, se muestra un mensaje específico.


## Beta 0.7.13 / v713 Pathfinding Play Runtime Fix

Corrección fuerte:

- Se añade una capa propia `#pathfindingDebugLayer`.
- La ruta debug ya no se dibuja en `navLayer`, porque `navLayer` puede estar oculto en Play.
- Se añade listener global de `pointerup` en `document`:
  - detecta si el clic cae dentro del stage;
  - ignora UI, inventario, splash y objetos interactivos;
  - llama al movimiento del player.
- `movePlayerTo()` ahora tiene fallback directo:
  - si A* no encuentra ruta, mueve al player directamente para confirmar que el runtime de movimiento funciona.
- El status informa:
  - clic recibido;
  - ruta con N puntos;
  - fallback directo si no hubo ruta.


## Beta 0.7.14 / v714 Player Physics + Collider Robust Fix

Corrección conceptual:

- Collider, pathfinding y Matter.js quedan separados.
- Un collider visual/interacción NO activa Matter.js.
- Un collider visual/interacción NO convierte un objeto en obstáculo de pathfinding.
- Para bloquear al player hay que marcar explícitamente:
  - `Pathfinding > Este objeto bloquea el paso del player`.

Player:

- El Player se controla por pathfinding.
- El Player no es cuerpo Matter.js por defecto.
- El Player no puede bloquear su propia ruta.
- El checkbox de física del Player queda desactivado.
- El checkbox de obstáculo del Player queda desactivado.
- El collider del Player, si se activa, sirve solo para interacción/proximidad, no para bloqueo de navegación ni física.

Robustez:

- Cambiar el tipo/preset del collider ya no reactiva automáticamente `collider.enabled`.
- Resetear collider ya no reactiva automáticamente `collider.enabled`.
- Desactivar collider/física se conserva al cambiar de modo y al entrar en Play.
- Se corrige un bug en listeners de física de escena que podía referenciar `obj` fuera de contexto.


## Beta 0.7.15 / v715 Player Collider Required + Move Test

Cambio de criterio:

- El collider del Player es obligatorio.
- No se puede desactivar porque se usa para interacción/proximidad con otros objetos.
- Si se intenta desactivar, aparece aviso:
  - `No se puede desactivar porque es necesario para interactuar con otros objetos.`
- Ese collider obligatorio NO significa:
  - obstáculo de pathfinding;
  - cuerpo Matter.js;
  - bloqueo de movimiento.
- El Player sigue sin bloquear su propia ruta.

Diagnóstico nuevo:

- En Play aparece un botón `Test mover Player`.
- Ese botón llama directamente a `movePlayerTo()` sin depender del clic de suelo.
- Si el botón mueve el Player, el problema está en la captura de clic.
- Si el botón tampoco mueve el Player, el problema está en el runtime/render/movimiento del Player.


## Beta 0.7.16 / v716 Play Click Catcher Fix

Diagnóstico confirmado:

- El botón `Test mover Player` funciona.
- Por tanto:
  - pathfinding funciona;
  - movimiento del Player funciona;
  - render del Player funciona.
- Lo que fallaba era la captura del clic de suelo durante Play.

Corrección:

- Añadida capa transparente `#playClickCatcherLayer`.
- Solo está activa en Play.
- Captura clics de suelo/fondo de forma explícita.
- Antes de mover, mira qué objeto hay debajo del cursor:
  - si es interactivo, ejecuta su acción;
  - si no es interactivo, mueve el Player con `movePlayerTo()`.
- El status debe mostrar:
  - `Click catcher Play: x, y`
  - luego `Pathfinding: ruta con N puntos.`


## Beta 0.7.17 / v717 Player Runtime Motion Hard Fix

Diagnóstico de la 0.7.16:

- Ya aparece status de movimiento.
- Eso confirma que el clic llega y se llama a `movePlayerTo()`.
- Si visualmente no se mueve, el fallo está en el runtime visual del Player o en el bucle de animación.

Corrección:

- `movePlayerDirectFallback()` ahora hace un `nudge` inmediato antes de animar.
- Si la animación falla, fuerza salto instantáneo al destino.
- Se fuerza `updateObjectElement(player)` y actualización visual de escena.
- Se añade failsafe por timeout.
- Si `state.mode` no es exactamente `play`, ya no aborta sin mover: salta al destino.
- El status muestra coordenadas reales del Player durante el movimiento.


## Beta 0.7.18 / v718 Stage Coordinates + Click Debug Fix

Objetivo:

- Codex descartó física, click catcher, nodos y `movePlayerTo()`.
- El foco pasa a coordenadas reales del clic y capa DOM.

Cambios:

- `stagePoint(e)` ahora convierte de coordenadas de navegador a coordenadas lógicas del stage usando:
  - `getBoundingClientRect()`;
  - tamaño lógico del proyecto;
  - tamaño visual real en pantalla.
- Ya no asume que píxeles de pantalla = píxeles internos del juego.
- El status muestra:
  - coordenadas raw;
  - coordenadas stage;
  - tamaño real del rect del stage;
  - escala X/Y aplicada.
- Añadido marcador visual `playClickDebugMarker` en el punto exacto que el motor cree que has clicado.
- Si el marcador aparece donde no toca, el problema está confirmado en coordenadas/transformación.
- Si el marcador aparece bien pero el Player no se mueve, el problema está en el update visual del objeto Player.


## Beta 0.7.19 / v719 Independent Player Click Runtime

Corrección conceptual:

- El movimiento point-and-click del Player ya no depende del grafo de nodos.
- Se añade un runtime independiente:
  - `moveAdventurePlayerIndependent()`;
  - `moveAdventurePlayerWithPathfindingIndependent()`.
- El clic de suelo llama directamente a este runtime.
- El botón `Test mover Player` también usa este runtime.
- El movimiento escribe directamente:
  - `player.x`;
  - `player.y`;
  - `style.transform` del elemento DOM del Player.

Cámara/parallax:

- El Player ya no recibe parallax/cámara sobre sí mismo en Play.
- Añadido checkbox de escena:
  - `Cámara sigue al Player en Play`.
- Por defecto, la cámara queda desactivada para que el movimiento del Player sea visible y depurable.

Objetivo:

- Separar definitivamente:
  - nodos/lógica;
  - pathfinding;
  - render DOM del Player;
  - cámara/parallax.


## Beta 0.7.20 / v720 NO PATHFINDING Direct Player Test

Build de diagnóstico.

Objetivo:

- Probar el movimiento del Player sin cargar/usar pathfinding.
- Aislar si el culpable es A*, zonas navegables, obstáculos o el módulo de navegación.

Cambios:

- `moveAdventurePlayerWithPathfindingIndependent()` queda puenteado.
- No se llama a `computePathAStar()`.
- No se consultan zonas navegables.
- No se consultan obstáculos.
- No se dibuja ruta debug.
- Clic en Play llama a movimiento directo.
- Botón de test renombrado a `Test directo sin Pathfinding`.
- El movimiento directo hace salto inmediato del Player al destino.

Resultado esperado:

- Si ahora se mueve: el problema está en pathfinding/zona/obstáculos.
- Si sigue sin moverse: el problema NO es pathfinding; está en DOM/render/estado del Player o en restauración de escena.


## Beta 0.7.22 / v722 Restore Nodes + DOM Teleport Test

Corrección del diagnóstico anterior:

- Se restaura `js/07_nodes_graph.js`.
- No se elimina ningún módulo.
- La versión parte de la 0.7.20 `NO PATHFINDING`.
- Pathfinding sigue puenteado para diagnóstico.
- Se añade solamente el botón `Teleport Player DOM`.

Objetivo:

- Probar movimiento DOM directo del Player sin romper botones ni dependencias del editor.

Interpretación:

- Si `Teleport Player DOM` mueve el Player:
  - el elemento visual existe y CSS/DOM permiten moverlo.
  - el problema está en runtime/modelo/update.
- Si no lo mueve:
  - el problema está en render del Player, CSS, el elemento visual o que se está seleccionando otro objeto.


## Beta 0.7.23 / v723 Document Click Direct Move Fix

Diagnóstico confirmado por el usuario:

- `Teleport Player DOM` funciona.
- `Test directo sin Pathfinding` funciona.
- Por tanto:
  - DOM del Player funciona.
  - Movimiento directo funciona.
  - Botones funcionan.
  - El fallo está en la ruta de clic de suelo.

Corrección:

- Se añade `bindDocumentPlayDirectClickRouter()`.
- Captura `pointerdown`, `pointerup` y `click` desde `document`, en fase capture.
- Comprueba si el clic cae dentro del stage.
- Ignora UI, botones, inventario, mensaje, splash, sidebars y modales.
- Si hay objeto interactivo debajo, ejecuta su acción.
- Si es suelo/fondo, llama a `moveAdventurePlayerIndependent()`, la misma ruta que el botón que ya funciona.
- `playClickCatcherLayer` queda sin `pointer-events` para que no interfiera.

Estado:

- Pathfinding sigue puenteado.
- Nodos siguen cargados.
- Física sigue aislada.


## Beta 0.7.24 / v724 Floor Click Wins Fix

Hipótesis nueva:

- El clic de suelo podía estar cayendo sobre un objeto grande, normalmente el fondo.
- El motor lo desviaba como interacción de objeto.
- Por eso el movimiento directo funcionaba desde botón, pero no desde el clic de escena.

Corrección:

- El clic de suelo gana por defecto.
- El background nunca bloquea movimiento.
- El Player nunca bloquea movimiento.
- Objetos sin acción real no bloquean movimiento.
- Solo se ejecuta `runObjectAction()` si el objeto bajo el cursor tiene una acción útil.
- Si el objeto no tiene acción, se ignora y se mueve el Player.

Status nuevo:

- `Click suelo gana...`
- `Click objeto interactivo...`
- `Click objeto ignorado...`
- `Click objeto sin acción ignorado...`

Estado:

- Pathfinding sigue puenteado.
- Movimiento directo sigue siendo el que ya funcionó con botón.
- Nodos restaurados.


## Beta 0.7.25 / v725 Visible Floor Layer + Event Debug

Hipótesis:

- La cruceta y el fallo del clic sugieren una capa invisible o un cursor/modo capturando la escena.
- Los botones mueven, así que el movimiento funciona.
- El objetivo ahora es aislar capas/eventos, no movimiento.

Cambios:

- Se elimina visualmente la cruceta:
  - `.play, .play * { cursor: default !important; }`
- Se desactiva completamente `playClickCatcherLayer`.
- Se añade nueva capa:
  - `playFloorButtonLayer`
- Esta capa captura directamente el clic de suelo y llama a `moveAdventurePlayerIndependent()`.
- Se añade botón:
  - `Ver capa suelo`
- Al activarlo, la capa se ve con contorno amarillo.
- Se añade sniffer crudo de eventos:
  - muestra en status `RAW pointerdown: target=...`
  - también escribe en consola.

Prueba:

1. Entrar en Play.
2. Confirmar que ya no aparece cruceta.
3. Pulsar `Ver capa suelo` y comprobar que aparece contorno amarillo sobre la escena.
4. Clic en el suelo.
5. Mirar si status dice:
   - `FLOOR LAYER click...`
   - o al menos `RAW pointerdown...`

Interpretación:

- Si `FLOOR LAYER click` aparece y no mueve: problema de llamada.
- Si solo aparece `RAW`, la capa nueva no está encima.
- Si no aparece nada, el clic no entra al documento/stage.


## Beta 0.7.26 / v726 Official Floor Layer Direct Move

Diagnóstico cerrado:

- La capa suelo visible ocupaba toda la escena.
- Al hacer clic en ella, el Player se movía.
- Teleport DOM funcionaba.
- El botón de mover funcionaba.

Conclusión:

- El fallo no era física.
- El fallo no era pathfinding.
- El fallo no era DOM.
- El fallo no era el Player.
- La ruta antigua de clic de suelo no era fiable.

Corrección:

- `playFloorButtonLayer` pasa a ser el sistema oficial de clic de suelo en Play.
- El movimiento ya no teletransporta:
  - ahora anima al Player hacia el punto clicado.
- El pathfinding sigue puenteado temporalmente para no mezclar variables.
- Se ocultan botones de diagnóstico visual:
  - `Ver capa suelo`;
  - `Teleport Player DOM`.
- Se mantiene el botón de test directo por seguridad.

Siguiente paso:

- Cuando esta versión confirme que el clic de suelo mueve de forma animada,
  se puede reactivar pathfinding encima de `playFloorButtonLayer`.


## Beta 0.7.27 / v727 Official Floor Layer + Pathfinding

Base confirmada:

- La capa oficial de suelo mueve al Player.
- El fallo anterior estaba en la ruta antigua de clic, no en el movimiento.

Cambios:

- Se reactiva pathfinding sobre `playFloorButtonLayer`.
- La capa suelo sigue ocupando todo el stage para capturar clics, pero ahora:
  - si el punto está fuera de zona navegable, no mueve;
  - si pathfinding está desactivado, mueve directo;
  - si pathfinding está activado, calcula ruta A*;
  - si no hay ruta, avisa;
  - si hay ruta, anima tramo a tramo.
- Se vuelve a permitir debug visual de ruta.

Notas:

- El “suelo” técnico sigue siendo toda la pantalla para capturar clics.
- La restricción real la ponen las zonas navegables y obstáculos.
- Esto mantiene el sistema de clic fiable que ya funcionó.


## Beta 0.7.28 / v728 Pathfinding Soft Recovery

Situación:

- El clic por capa oficial ya funciona.
- El Player se mueve.
- El problema queda en A*: no encuentra ruta.

Corrección:

- Nuevo A* tolerante:
  - `nearestWalkablePointSoft()`;
  - `lineWalkableSoft()`;
  - `computePathAStarSoft()`.
- Si inicio o destino no son caminables exactos, busca el punto caminable más cercano.
- Si hay línea directa caminable, usa ruta directa de 2 puntos.
- Si A* normal falla, reintenta:
  1. configuración normal;
  2. grid más fino;
  3. grid fino + margen de obstáculos reducido;
  4. sin margen de obstáculos.
- Si falla, el status explica:
  - inicio no caminable;
  - destino no caminable;
  - sin ruta con grid/margen concreto.

Status esperado:

- `Suelo oficial A*: N puntos (normal/grid fino/...)`
- o diagnóstico exacto si falla.


## Beta 0.7.29 / v729 Pathfinding Failsafe Waypoints

Situación:

- A* informa `sin ruta con grid 10.66..., margen 0`.
- Eso indica que el bloqueo ya no viene del margen de obstáculos.
- El fallo probable está en la discretización/conectividad del grid.

Cambios:

- Si A* encuentra ruta, se usa A*.
- Si A* falla:
  1. intenta línea directa caminable;
  2. intenta una ruta simple con waypoints alrededor de obstáculos;
  3. si todo falla, no bloquea el juego y mueve directo como emergencia.
- Se dibuja la ruta usada en debug.
- El status distingue:
  - `A* oficial`;
  - `fallback línea directa`;
  - `fallback waypoints`;
  - `A* FAILSAFE`.

Objetivo:

- Que el juego no quede parado por un fallo de grid.
- Mantener el A* como primera opción, pero tolerante.


## Beta 0.7.30 / v730 Explicit Obstacles + Collider Pathfinding Fix

Causa probable:

- A* fallaba incluso con margen 0.
- Eso suele ocurrir cuando un objeto decorativo grande bloquea el grid por su rectángulo completo.
- Visualmente parece haber suelo, pero el sprite rectangular invisible/transparentado ocupa más espacio.

Cambios:

- Los objetos ya no bloquean pathfinding por tener collider o física.
- Solo bloquea el paso un objeto con `pathBlocker === true`.
- El Player nunca bloquea.
- El fondo nunca bloquea.
- Si un objeto bloqueador tiene collider activo:
  - A* usa el collider real;
  - no usa el rectángulo completo del sprite.
- Si no tiene collider útil:
  - usa rectángulo como fallback.
- El status muestra cuántos obstáculos reales se están usando.

Resultado esperado:

- Si la máquina central no está marcada como bloqueadora, ya no bloqueará el A*.
- Si está marcada, conviene darle un collider ajustado a su base/volumen real.


## Beta 0.7.31 / v731 Explicit Blockers + Obstacle Debug

Diseño correcto para aventura gráfica:

- Zona navegable = suelo caminable.
- Objetos bloqueantes = obstáculos explícitos dentro de ese suelo.
- No todo collider debe bloquear.
- No toda física debe bloquear.
- Solo bloquea quien tenga marcada la opción:
  - `Este objeto bloquea el paso del player`.

Mejoras:

- Si activas debug de pathfinding, también se dibujan los bloqueantes.
- Los bloqueantes aparecen en rojo.
- Se etiqueta cada bloqueante con su nombre.
- El status muestra:
  - número de obstáculos;
  - nombres principales.
- Si marcas un objeto como bloqueante:
  - si tiene collider activo, A* usará su collider;
  - si no lo tiene, se avisa de que usará el rectángulo completo.

Uso recomendado:

- Para una mesa/máquina grande:
  1. marcar `bloquea el paso`;
  2. activar/editar collider;
  3. ajustar el collider a la base real del objeto, no a toda la imagen.


## Beta 0.7.32 / v732 PathBlocker Persistence Fix

Corrección:

- `pathBlocker` queda como propiedad persistente del objeto.
- Entrar en Play ya no debe desmarcar el checkbox.
- `renderObjectProps()` muestra el valor real:
  - `obj.pathBlocker === true`.
- Ya no usa una función derivada para decidir si el checkbox aparece marcado.
- Background y Player fuerzan `pathBlocker = false`.
- Props y runtime usan la misma regla:
  - solo bloquea si `obj.pathBlocker === true`.

Status:

- Al marcar un objeto:
  - `Bloqueante activado: Nombre`.
- Al desmarcar:
  - `Bloqueante desactivado: Nombre`.

Objetivo:

- Poder marcar máquinas, mesas, puertas, cajas o NPCs como bloqueantes sin que el check desaparezca al entrar en Play.


## Beta 0.7.33 / v733 PathBlocker Play Sync Fix

Corrección fuerte:

- No hace falta botón “Aplicar”.
- El checkbox `Este objeto bloquea el paso del player` debe guardar al instante.
- Se añade memoria interna `state.pathBlockerMemory`.
- Al marcar/desmarcar:
  - se actualiza `obj.pathBlocker`;
  - se actualiza `state.pathBlockerMemory[obj.id]`.
- Antes de entrar en Play:
  - se sincroniza el panel de propiedades;
  - se aplica la memoria a todos los objetos;
  - el snapshot de Play copia el valor correcto.
- `pathfindingObstacleObjects()` aplica la memoria antes de calcular obstáculos.

Objetivo:

- Evitar que al entrar en Play se use una versión antigua del objeto que tenga `pathBlocker: false`.
- Evitar que el render del panel desmarque el checkbox por un valor derivado o desactualizado.


## Beta 0.7.34 / v734 Visibility Graph Pathfinding

Problema:

- El bloqueante ya persiste.
- A* de grid falla al rodear un obstáculo central.
- Esto suele pasar en aventuras gráficas con obstáculos grandes y zonas caminables irregulares.

Solución:

- A* sigue como primera opción.
- Si A* no conecta la rejilla, se genera una ruta de visibilidad:
  - crea puntos alrededor de cada bloqueante;
  - conecta los puntos que tienen línea de visión libre;
  - descarta segmentos fuera de zona navegable;
  - descarta segmentos que atraviesan obstáculos;
  - calcula la ruta más corta.
- Si hay ruta de visibilidad, el Player la sigue tramo a tramo.
- El debug muestra puntos verdes de la ruta de visibilidad.

Status esperado:

- `Visibility path: N puntos · obstáculos X: ...`

Objetivo:

- Rodear objetos bloqueantes como la máquina central sin depender únicamente del grid A*.


## Beta 0.7.35 / v735 Blocker Auto Footprint Fix

Problema detectado:

- Si marcas un objeto bloqueante pero no activas/ajustas su collider,
  usar el rectángulo completo del sprite puede bloquear demasiado espacio.
- En una aventura gráfica normalmente interesa bloquear la base del objeto,
  no toda la imagen.

Cambio:

- Si un objeto bloqueante tiene collider activo:
  - pathfinding usa el collider manual.
- Si un objeto bloqueante NO tiene collider activo:
  - pathfinding usa una huella automática de suelo.
- La huella automática ocupa aproximadamente:
  - 65% del ancho del sprite;
  - 28% inferior de la altura.
- El debug distingue:
  - rojo = collider manual;
  - naranja = huella automática.

Resultado esperado:

- Puedes marcar la máquina central como bloqueante sin crear todavía un collider perfecto.
- El Player debería rodear su base en vez de considerar bloqueante todo el sprite.


## Beta 0.7.36 / v736 Restore Interactions + Blocker No Direct Failsafe

Corrección urgente:

- La capa oficial de suelo estaba capturando el clic antes que objetos/hotspots.
- Eso impedía coger objetos, usar hotspots o cambiar de escena.

Cambios:

- Antes de mover el Player, la capa de suelo comprueba qué objeto hay debajo del cursor.
- Si el objeto tiene interacción real:
  - recoger;
  - mensaje;
  - cambio de escena;
  - acción;
  - uso de item;
  ejecuta `runObjectAction(obj)`.
- Si el objeto no tiene interacción, el clic se trata como suelo.

Pathfinding:

- Si hay bloqueantes y no encuentra ruta, ya no usa movimiento directo de emergencia.
- Así evita atravesar la máquina u otros obstáculos.
- Solo usa movimiento directo de emergencia si no hay obstáculos reales.

Estado:

- Interacciones restauradas.
- Clic de suelo oficial mantenido.
- Bloqueantes explícitos mantenidos.


## Beta 0.7.37 / v737 Restore Inventory Use On Objects

Corrección:

- La capa oficial de suelo vuelve a respetar el flujo de inventario.
- Si hay un item de inventario seleccionado:
  - no mueve al Player;
  - busca objeto/hotspot bajo el cursor;
  - ejecuta `runObjectAction(target)`;
  - `runObjectAction()` conserva la lógica existente de `selectedInventoryItemId`, `runQuickUseItemInteraction()` y `runLogicGraph("useItem")`.
- El cursor visual del inventario vuelve a seguir el ratón sobre el stage.
- Si haces clic en suelo sin objeto destino, no cancela automáticamente el item: muestra indicación.

Pruebas:

1. Recoger martillo.
2. Seleccionarlo en inventario.
3. Ver que aparece junto al cursor.
4. Clic sobre objeto/hotspot destino.
5. Comprobar que se ejecuta uso de item.


## Beta 0.7.47 / v747 Scene System Restore

Reconstruida desde 0.7.37.

Objetivo:

- Restaurar el sistema de escenas como estaba cuando funcionaba.
- Eliminar handlers duplicados y parches agresivos.
- No tocar pathfinding en esta versión.

Cambios:

- `+ Escena` vuelve al flujo original simple.
- `normalizeProject()` repara proyectos con `scenes: []`.
- `createDefaultProject()` asegura que exista `Escena 1`.
- `addObject()` crea `Escena 1` si no hay escena activa y luego añade el objeto.
- `addObjectFromImage()` hace lo mismo.

Prueba:

1. Abrir proyecto nuevo.
2. Debe existir `Escena 1`.
3. Pulsar `+ Escena`.
4. Debe aparecer `Escena 2`.
5. Pulsar Fondo/Player/Hotspot/Objeto.

## Beta 0.7.48 / v748 Scene Emergency Diagnostic

Corrección/diagnóstico:

- Añadido botón `Crear escena emergencia`.
- `+ Escena` llama ahora a `createSceneEmergency()`.
- Si no hay escena, se crea `Escena 1` al arrancar.
- Los botones Fondo/Player/Hotspot/Objeto crean escena base si falta.
- Se muestra una caja roja si hay error JavaScript de arranque.
- Se capturan `window.onerror` y `unhandledrejection`.

Objetivo:

- Diagnosticar si el problema es un error JS global.
- Recuperar creación de escenas aunque falle parte del binding normal.


## Beta 0.7.49 / v749 Clean Scene Fix

Base:

- Parte de 0.7.48, donde volvió a funcionar `+ Escena`.

Limpieza:

- Se oculta/elimina el botón provisional `Crear escena emergencia`.
- Se mantiene la función interna robusta de creación de escenas.
- Se mantiene la reparación de proyectos sin escena.
- Se mantiene que Fondo/Player/Hotspot/Objeto creen una escena base si falta.
- La caja de error JS queda oculta y solo aparece si hay un error real.

No se modifica pathfinding en esta versión.


## Beta 0.7.50 / v750 Restore Built-in Pathfinding Lab

- Vuelve la escena integrada `TEST Pathfinding Lab`.
- Ahora se inserta automáticamente en el proyecto y en la lista de escenas.
- Incluye recursos visuales embebidos dentro del propio proyecto:
  - fondo del laboratorio
  - player de test
  - bloqueador de test
- La escena usa una zona navegable en forma de T para comprobar giros reales de ruta.
- Se deja `debug` activado en la escena de test para visualizar la ruta en Play.
- También se añade un bloqueador de prueba visible (`Bloqueador Test`).


## Beta 0.7.51 / v751 Pathfinding Lab Stage Null Fix

Corrección:

- La escena `TEST Pathfinding Lab` ya no usa `baseObject()` durante `normalizeProject()`.
- Sus objetos se crean con datos independientes usando `project.stage`, no `state.project.stage`.
- Esto corrige el error:
  - `Cannot read properties of null (reading 'stage')`
- También se corrige una reparación defensiva para que no pueda entrar en recursión.
- `createSceneEmergency()` ya no llama a `normalizeProject(makeProject())` cuando `state.project` es null.


## Beta 0.7.52 / v752 Pathfinding Lab Play Start Fix

Corrección:

- Si seleccionas `TEST Pathfinding Lab`, se marca automáticamente como escena inicial.
- Al entrar en Play, si la escena seleccionada tiene Player y la inicial no, Play arranca desde la seleccionada.
- El laboratorio normaliza su Player antes de Play:
  - visible;
  - estado `default`;
  - collider activo;
  - `pathBlocker = false`;
  - pathfinding debug activo.
- El status indica desde qué escena arranca Play y si encontró Player.


## Beta 0.7.53 / v753 Complex Pathfinding Lab

- Añadida una nueva escena integrada: **TEST Pathfinding Maze**.
- La escena incluye un área navegable amplia y varios objetos visibles marcados como bloqueantes.
- Sirve para comprobar rutas A* con varios giros, evitando que el test se limite a una línea recta.
- Se mantiene la escena anterior **TEST Pathfinding Lab** como prueba básica.


## Beta 0.7.54 / v754 Player Global Pathfinding

Cambio conceptual:

- El pathfinding pasa a ser una propiedad global del Player.
- Todo Player nuevo tiene:
  - `usePathfinding: true`
  - `navigationMode: "pathfinding"`
- Los Players antiguos se normalizan automáticamente.
- Si una escena tiene Player con `usePathfinding`, la escena activa pathfinding automáticamente al normalizar y al entrar en Play.
- Si no hay Player, no se fuerza navegación: sirve para minijuegos, puzzles o pantallas sin personaje.
- Al crear un Prefab de Player, esta propiedad queda guardada en el propio objeto/prefab.

Resultado esperado:

- La navegación normal del Player siempre va por pathfinding.
- No hace falta activar pathfinding escena por escena.


## Beta 0.7.55 / v755 Path Footprint Projection

Nueva técnica recuperada:

- Los objetos bloqueantes ya no bloquean por defecto todo el rectángulo/píxeles del sprite 2D.
- Cada objeto tiene una `pathFootprint`, es decir, una huella/proyección de suelo.
- El pathfinding usa esa huella como volumen de paso, simulando mejor la ocupación real del objeto en una escena 3D.
- Por defecto:
  - Player: usa una huella de pies.
  - Background: no bloquea.
  - Prop/Hotspot/Objeto: usa una elipse baja situada en la base del sprite.
- El collider manual queda reservado para uso explícito con `pathFootprint.mode = "manualCollider"`.
- El debug de obstáculos muestra la huella de paso real usada por pathfinding.

Campos nuevos por objeto:

```js
pathFootprint: {
  enabled: true,
  mode: "groundProjection",
  shape: "ellipse",
  x: 0.22,
  y: 0.74,
  width: 0.56,
  height: 0.20,
  auto: true
}
```

Valores `x`, `y`, `width`, `height` son proporcionales al tamaño del sprite.


## Beta 0.7.56 / v756 Footprint Editor

Nueva interfaz:

- Añadido botón **Editar huella** en la barra superior junto a **Editar collider**.
- La huella es independiente del collider normal.
- La huella solo afecta al pathfinding del Player.
- El collider sigue sirviendo para clics, interacción, física, proximidad y triggers.

Editor de huella:

- Soporta forma elíptica y rectangular.
- Permite mover la huella.
- Permite redimensionarla.
- Incluye:
  - Reset automático.
  - Ajustar a base/pies.
  - Usar collider como huella.
  - Volver a proyección de suelo.
- Enter aplica.
- Escape cancela.

Concepto:

- `collider`: interacción/física/clics.
- `pathFootprint`: ocupación de suelo para navegación.


## Beta 0.7.57 / v757 Footprint Pathfinding Hard Fix

Corrección:

- El pathfinding trata `pathFootprint` como obstáculo duro.
- La huella se infla automáticamente con el radio de los pies del Player.
- El algoritmo ya no comprueba solo un punto central del Player.
- La comprobación de segmentos es más fina para evitar que una línea larga salte sobre huellas pequeñas.
- El debug de obstáculos muestra la zona real expandida que está usando el pathfinding.

Resultado esperado:

- Si una huella está en el camino, el Player debe rodearla.
- Ya no debería atravesar la huella visual.


## Beta 0.7.58 / v758 Sprite Frame Auto Size

Nueva mejora aislada para spritesheets:

- Añadido botón **Calcular frame desde imagen**.
- Añadido botón **Ajustar objeto al frame**.
- Añadido botón **Calcular + ajustar objeto**.
- El sistema usa la resolución guardada de la imagen y el número de columnas/filas:
  - `frameWidth = image.width / columns`
  - `frameHeight = image.height / rows`
- El objeto puede ajustar su rectángulo visual al tamaño del frame resultante.
- No toca pathfinding, huellas, colliders ni runtime de navegación.

Uso:

1. Selecciona un objeto con imagen spritesheet.
2. Activa **Usar como spritesheet**.
3. Indica columnas y filas.
4. Pulsa **Calcular frame desde imagen**.
5. Opcionalmente pulsa **Ajustar objeto al frame** o usa directamente **Calcular + ajustar objeto**.


## Beta 0.7.59 / v759 Image Assets Selection + Sprite Picker

Mejora de flujo de imágenes:

- El panel izquierdo **Assets > Imágenes** deja de ser solo visual.
- Cada miniatura puede seleccionarse.
- Doble clic o botón **Usar** aplica la imagen al objeto seleccionado.
- Se añade botón global **Aplicar imagen al objeto seleccionado**.
- Se añade **Reemplazar imagen seleccionada**.
- Se añade **Eliminar imagen seleccionada** si no está en uso.
- Se muestra nombre, tamaño y número de usos del asset seleccionado.

Mejora de spritesheet:

- En **Spritesheet / Animación** se añade un selector explícito **Imagen spritesheet**.
- Ese selector asigna la imagen al objeto y permite calcular frames.
- El cálculo automático intenta leer la resolución real de la imagen si todavía no estaba guardada.
- Los botones de frame size ya no dependen de una imagen “implícita” invisible.

Resultado esperado:

1. Importa imágenes en el panel izquierdo.
2. Selecciona una miniatura.
3. Aplícala al objeto o selecciónala desde **Imagen spritesheet**.
4. Indica columnas/filas.
5. Pulsa **Calcular frame desde imagen** o **Calcular + ajustar objeto**.


## Beta 0.7.60 / v760 Sprite Auto Size Fix + Responsive Toolbar

Correcciones:

- El botón **Calcular frame desde imagen** ahora también ajusta el rectángulo del objeto al frame calculado.
- Si la imagen todavía no tiene resolución guardada, la lee y repite el cálculo automáticamente.
- Al elegir **Imagen spritesheet**, se intenta leer su resolución de inmediato.
- El tamaño visible del objeto queda sincronizado con:
  - `sprite.frameWidth`
  - `sprite.frameHeight`
  - `obj.width`
  - `obj.height`

Mejora UI:

- Barra superior más responsive.
- Los grupos de iconos hacen wrap controlado.
- Se reduce el riesgo de que los botones sobrepasen el borde de la página.
- El texto de estado se recorta con elipsis en vez de empujar la interfaz.


## Beta 0.7.61 / v761 Sprite Frame Calc + Toolbar Fix

Correcciones:

- El cálculo de frame lee la imagen directamente con `Image()` si el asset no tiene resolución guardada.
- El cálculo aplica el resultado en el callback real de carga.
- El frame calculado actualiza explícitamente:
  - `sprite.frameWidth`
  - `sprite.frameHeight`
  - `obj.width`
  - `obj.height`
  - campos visibles del panel.
- El mensaje de estado muestra el tamaño aplicado del objeto.

UI:

- La barra superior deja de hacer wrap vertical.
- Si no cabe, usa scroll horizontal interno.
- `#stageWrap` queda debajo de la toolbar y no debería ser invadido por los iconos.


## Beta 0.7.62 / v762 Sprite Render Size Binding Fix

Corrección de spritesheet:

- El render del objeto fuerza `obj.width` y `obj.height` desde `sprite.frameWidth` y `sprite.frameHeight`.
- `applySpriteBackground()` ahora actualiza:
  - tamaño DOM del objeto;
  - background-position;
  - background-size de la spritesheet;
  - no-repeat.
- Editar manualmente **Ancho frame** o **Alto frame** sincroniza inmediatamente el rectángulo del objeto.
- Los botones de calcular/ajustar usan el mismo helper de sincronización.


## Beta 0.7.63 / v763 Sprite Frame Persistence Fix

Corrección de persistencia:

- Antes de entrar en Play se sincronizan los campos visibles del panel de spritesheet con el objeto real.
- El snapshot de Play se genera siempre desde el estado editor actual, no desde un snapshot anterior.
- Editar manualmente ancho/alto de frame actualiza y guarda inmediatamente:
  - `sprite.frameWidth`
  - `sprite.frameHeight`
  - `obj.width`
  - `obj.height`
- El panel muestra confirmación: `Frame manual guardado...`.

Motivo:

- El problema no era solo visual; al entrar/salir de Play se podía restaurar un snapshot anterior y perder cambios recientes.


## Beta 0.7.64 / v764 Sprite Autosize Hard Wire Fix

Corrección dura del cálculo automático de spritesheet:

- Añadido módulo independiente `09_sprite_autosize_hard_wire_fix.js`.
- Los botones:
  - **Calcular frame desde imagen**
  - **Calcular + ajustar objeto**
  - **Ajustar objeto al frame**
  ahora tienen un listener global independiente en fase de captura.
- El cálculo ya no depende de que `bindProps()` llegue correctamente a esa parte.
- El cálculo busca imagen en este orden:
  1. selector **Imagen spritesheet**;
  2. selector **Imagen** del objeto;
  3. `obj.imageId`;
  4. imagen seleccionada en **Assets > Imágenes**.
- Lee la resolución real con `Image()` si el asset no tiene `width/height`.
- Escribe directamente:
  - `obj.imageId`
  - `sprite.enabled`
  - `sprite.frameWidth`
  - `sprite.frameHeight`
  - `obj.width`
  - `obj.height`
  - campos visibles del panel.
- El estado del panel debe mostrar `AUTO frame aplicado...` si la ruta ha funcionado.

Objetivo:

- Si el botón no hace nada, ahora debe al menos mostrar un mensaje claro de qué falta: objeto, imagen o resolución.


## Beta 0.7.65 / v765 Auto Detect Sprite Frame

Mejora de spritesheet:

- Se unifican los botones en un botón principal: **Ajustar frame**.
- El botón intenta autodetectar columnas y filas.
- Si columnas/filas ya están definidas manualmente con valores mayores que 1, las respeta.
- Si no, intenta:
  1. detectar separadores transparentes entre frames;
  2. inferir columnas/filas desde el tamaño actual del objeto;
  3. usar fallback 1×1 si no hay señal fiable.
- Sigue existiendo botón secundario **Aplicar tamaño manual al objeto**.
- Los campos de columnas, filas, ancho frame y alto frame se mantienen como controles avanzados/corrección manual.

Mensajes:

- Si detecta por transparencia, muestra confianza alta.
- Si infiere por tamaño actual, muestra confianza media.
- Si no puede detectar, avisa con fallback.
