// AventurIA v54 Modular Base — 07_nodes_graph.js
// Extraído de v53 funcional. Script clásico global; el orden de carga importa.

const NODE_TYPE_OPTIONS = {
  event: [
    ["sceneStart", "Inicio de escena"],
    ["clickObject", "Clic en objeto"],
    ["inventorySelect", "Seleccionar item inventario"],
    ["useInventoryItem", "Usar item seleccionado"],
    ["physicsCollision", "Física: colisión/sensor"]
  ],
  input: [
    ["keyDown", "Tecla pulsada"],
    ["keyUp", "Tecla soltada"],
    ["keyHeld", "Tecla mantenida"],
    ["mouseDown", "Ratón pulsado"],
    ["mouseUp", "Ratón soltado"],
    ["mouseMove", "Movimiento ratón"],
    ["click", "Clic ratón"]
  ],
  entity: [
    ["player", "Player"],
    ["object", "Objeto"],
    ["inventory", "Inventario"]
  ],
  trigger: [
    ["onEnter", "On enter"],
    ["whileInside", "While inside"],
    ["onExit", "On exit"],
    ["onHoverEnter", "Hover enter"],
    ["onHoverExit", "Hover exit"],
    ["onUseItem", "Usar item en objeto"]
  ],
  action: [
    ["moveTo", "Desplazar / mover a objeto"],
    ["pickup", "Recoger"],
    ["addInventoryItem", "Añadir item al inventario"],
    ["removeInventoryItem", "Quitar item del inventario"],
    ["consumeSelectedItem", "Consumir item seleccionado"],
    ["showMessage", "Mostrar mensaje"],
    ["playSound", "Reproducir audio"],
    ["playSceneAudio", "Reproducir audio de escena"],
    ["stopSceneAudio", "Detener audio de escena"],
    ["setSceneAudioVolume", "Cambiar volumen audio escena"],
    ["setSceneAudioMasterVolume", "Cambiar volumen global escena"],
    ["gotoScene", "Ir a escena"],
    ["setState", "Cambiar estado"],
    ["playAnimation", "Reproducir spritesheet"],
    ["stopAnimation", "Detener spritesheet"],
    ["playTransformClip", "Reproducir clip transformación"],
    ["stopTransformClip", "Detener clip transformación"],
    ["showObject", "Mostrar objeto"],
    ["hideObject", "Ocultar objeto"],
    ["enableObject", "Activar objeto"],
    ["disableObject", "Desactivar objeto"],
    ["physicsImpulse", "Física: aplicar impulso"],
    ["physicsVelocity", "Física: fijar velocidad"],
    ["physicsResetObject", "Física: reset objeto"],
    ["physicsResetScene", "Física: reset escena"],
    ["physicsEnableObject", "Física: activar objeto"],
    ["physicsDisableObject", "Física: desactivar objeto"]
  ],
  animation: [
    ["play", "Reproducir clip"],
    ["stop", "Detener"],
    ["setFrame", "Ir a frame"],
    ["pause", "Pausar"],
    ["resume", "Reanudar"]
  ],
  condition: [
    ["hasItem", "Tiene item"],
    ["objectState", "Estado de objeto"],
    ["variableEquals", "Variable igual a"]
  ],
  data: [
    ["variable", "Variable"],
    ["text", "Texto"],
    ["scene", "Escena"]
  ],
  mechanism: [
    ["open", "Abrir mecanismo"],
    ["close", "Cerrar mecanismo"],
    ["isSolved", "Mecanismo resuelto"]
  ]
};

const NODE_DEFS = {
  "event:sceneStart": {
    category: "event", type: "sceneStart", label: "Inicio de escena",
    help: "Evento sin parámetros. Se ejecuta automáticamente al entrar en la escena.",
    params: [],
    inputs: [],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "event:clickObject": {
    category: "event", type: "clickObject", label: "Clic en objeto",
    help: "Evento al hacer clic sobre el objeto seleccionado.",
    params: ["object"],
    inputs: [],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "event:inventorySelect": {
    category: "event", type: "inventorySelect", label: "Seleccionar item inventario",
    help: "Evento al seleccionar un item del inventario.",
    params: [],
    inputs: [],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "event:useInventoryItem": {
    category: "event", type: "useInventoryItem", label: "Usar item seleccionado",
    help: "Evento al hacer clic en un objeto con un item seleccionado en el inventario.",
    params: ["object"],
    inputs: [],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },

  "event:physicsCollision": {
    category: "event", type: "physicsCollision", label: "Física: colisión/sensor",
    help: "Evento disparado por Matter.js cuando dos cuerpos físicos colisionan o un sensor detecta un cuerpo.",
    params: ["object"],
    inputs: [],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },

  "input:keyDown": {
    category: "input", type: "keyDown", label: "Input: tecla pulsada",
    help: "Se dispara cuando se pulsa la tecla indicada. Ejemplos: ArrowLeft, ArrowRight, Space, KeyE.",
    params: ["input"],
    inputs: [],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "input:keyUp": {
    category: "input", type: "keyUp", label: "Input: tecla soltada",
    help: "Se dispara cuando se suelta la tecla indicada.",
    params: ["input"],
    inputs: [],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "input:keyHeld": {
    category: "input", type: "keyHeld", label: "Input: tecla mantenida",
    help: "Se evalúa mientras la tecla indicada permanece pulsada. Útil para animaciones de movimiento.",
    params: ["input"],
    inputs: [],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "input:mouseDown": {
    category: "input", type: "mouseDown", label: "Input: ratón pulsado",
    help: "Se dispara al pulsar un botón del ratón. Usa mouse:left, mouse:middle o mouse:right.",
    params: ["input"],
    inputs: [],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "input:mouseUp": {
    category: "input", type: "mouseUp", label: "Input: ratón soltado",
    help: "Se dispara al soltar un botón del ratón.",
    params: ["input"],
    inputs: [],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "input:mouseMove": {
    category: "input", type: "mouseMove", label: "Input: movimiento ratón",
    help: "Se dispara al mover el ratón sobre la escena.",
    params: [],
    inputs: [],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "input:click": {
    category: "input", type: "click", label: "Input: clic ratón",
    help: "Se dispara con un clic de ratón sobre la escena.",
    params: ["input"],
    inputs: [],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },

  "entity:player": {
    category: "entity", type: "player", label: "Player",
    help: "Referencia al player. Permite encadenar lógica dependiente del jugador.",
    params: [],
    inputs: [{ name: "in", kind: "flow", label: "◀" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }, { name: "object", kind: "data", label: "P" }]
  },
  "entity:object": {
    category: "entity", type: "object", label: "Objeto",
    help: "Referencia a un objeto de la escena.",
    params: ["object"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }, { name: "object", kind: "data", label: "O" }]
  },
  "entity:inventory": {
    category: "entity", type: "inventory", label: "Inventario",
    help: "Referencia conceptual al inventario.",
    params: [],
    inputs: [{ name: "in", kind: "flow", label: "◀" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },

  "trigger:onEnter": {
    category: "trigger", type: "onEnter", label: "Trigger: on enter",
    help: "Continúa cuando el player entra en contacto con el objeto objetivo. Si aparece ya dentro al cambiar de escena, queda bloqueado hasta salir.",
    params: ["targetObject"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }, { name: "actor", kind: "data", label: "A" }, { name: "target", kind: "data", label: "T" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "trigger:whileInside": {
    category: "trigger", type: "whileInside", label: "Trigger: while inside",
    help: "Continúa si el player está dentro/encima del objetivo en el momento de evaluar.",
    params: ["targetObject"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }, { name: "actor", kind: "data", label: "A" }, { name: "target", kind: "data", label: "T" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "trigger:onExit": {
    category: "trigger", type: "onExit", label: "Trigger: on exit",
    help: "Base para detectar salida de zona/objeto.",
    params: ["targetObject"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }, { name: "actor", kind: "data", label: "A" }, { name: "target", kind: "data", label: "T" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "trigger:onHoverEnter": {
    category: "trigger", type: "onHoverEnter", label: "Hover enter",
    help: "Base para interacción al pasar el cursor por encima.",
    params: ["targetObject"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "trigger:onHoverExit": {
    category: "trigger", type: "onHoverExit", label: "Hover exit",
    help: "Base para interacción al salir el cursor.",
    params: ["targetObject"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "trigger:onUseItem": {
    category: "trigger", type: "onUseItem", label: "Usar item en objeto",
    help: "Continúa cuando se usa el item seleccionado sobre el objeto objetivo.",
    params: ["targetObject"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }, { name: "item", kind: "data", label: "I" }, { name: "target", kind: "data", label: "T" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },

  "action:moveTo": {
    category: "action", type: "moveTo", label: "Desplazar / mover a objeto",
    help: "Mueve el player hasta el objeto objetivo. Útil antes de disparar una animación como run.",
    params: ["targetObject"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }, { name: "target", kind: "data", label: "T" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },

  "action:pickup": {
    category: "action", type: "pickup", label: "Recoger",
    help: "Recoge el objeto indicado en 'Objeto / item objetivo' o conectado al puerto I.",
    params: ["targetObject"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }, { name: "item", kind: "data", label: "I" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "action:addInventoryItem": {
    category: "action", type: "addInventoryItem", label: "Añadir item al inventario",
    help: "Añade al inventario el objeto indicado en Objeto / item objetivo sin necesidad de hacer clic sobre él.",
    params: ["targetObject", "value"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }, { name: "item", kind: "data", label: "I" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "action:removeInventoryItem": {
    category: "action", type: "removeInventoryItem", label: "Quitar item del inventario",
    help: "Quita del inventario el objeto indicado en Objeto / item objetivo.",
    params: ["targetObject"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }, { name: "item", kind: "data", label: "I" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "action:consumeSelectedItem": {
    category: "action", type: "consumeSelectedItem", label: "Consumir item seleccionado",
    help: "Quita del inventario el item que se está usando en esta interacción.",
    params: [],
    inputs: [{ name: "in", kind: "flow", label: "◀" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "action:showMessage": {
    category: "action", type: "showMessage", label: "Mostrar mensaje",
    help: "Muestra el texto de Valor.",
    params: ["value"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "action:playSound": {
    category: "action", type: "playSound", label: "Reproducir audio",
    help: "Reproduce el audio del nodo.",
    params: ["audio"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "action:playSceneAudio": {
    category: "action", type: "playSceneAudio", label: "Reproducir audio de escena",
    help: "Reproduce un audio asociado a la escena. Si no eliges audio, reproduce el primero de la lista de la escena.",
    params: ["audio", "value"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "action:stopSceneAudio": {
    category: "action", type: "stopSceneAudio", label: "Detener audio de escena",
    help: "Detiene un audio de escena. Si no eliges audio, detiene todos los audios de escena.",
    params: ["audio"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "action:setSceneAudioVolume": {
    category: "action", type: "setSceneAudioVolume", label: "Cambiar volumen audio escena",
    help: "Cambia el volumen de un audio de escena. Usa Volumen o Valor entre 0 y 1.",
    params: ["audio", "volume"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "action:setSceneAudioMasterVolume": {
    category: "action", type: "setSceneAudioMasterVolume", label: "Cambiar volumen global escena",
    help: "Cambia el volumen global de la escena. Usa Volumen o Valor entre 0 y 1.",
    params: ["volume"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "action:gotoScene": {
    category: "action", type: "gotoScene", label: "Ir a escena",
    help: "Cambia a la escena indicada en Valor. Acepta nombre visible o ID de escena.",
    params: ["value"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }],
    outputs: []
  },
  "action:setState": {
    category: "action", type: "setState", label: "Cambiar estado",
    help: "Cambia el estado del objeto objetivo al texto de Valor. Si ese estado tiene imagen propia, visibilidad o interacción configuradas, se aplican automáticamente.",
    params: ["targetObject", "value"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }, { name: "target", kind: "data", label: "T" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "action:playAnimation": {
    category: "action", type: "playAnimation", label: "Reproducir animación",
    help: "Reproduce un clip de spritesheet en el objeto objetivo.",
    params: ["targetObject", "animation"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }, { name: "target", kind: "data", label: "T" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "action:stopAnimation": {
    category: "action", type: "stopAnimation", label: "Detener animación",
    help: "Detiene la spritesheet del objeto objetivo.",
    params: ["targetObject"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }, { name: "target", kind: "data", label: "T" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },


  "action:playTransformClip": {
    category: "action", type: "playTransformClip", label: "Reproducir clip transformación",
    help: "Reproduce un clip de transformación del objeto objetivo: posición, rotación y escala.",
    params: ["targetObject", "animation"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }, { name: "target", kind: "data", label: "T" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "action:stopTransformClip": {
    category: "action", type: "stopTransformClip", label: "Detener clip transformación",
    help: "Detiene el clip de transformación del objeto objetivo y conserva el último valor visual hasta nuevo render.",
    params: ["targetObject"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }, { name: "target", kind: "data", label: "T" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },

  "action:showObject": {
    category: "action", type: "showObject", label: "Mostrar objeto",
    help: "Hace visible el objeto objetivo.",
    params: ["targetObject"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }, { name: "target", kind: "data", label: "T" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "action:hideObject": {
    category: "action", type: "hideObject", label: "Ocultar objeto",
    help: "Oculta el objeto objetivo.",
    params: ["targetObject"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }, { name: "target", kind: "data", label: "T" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "action:enableObject": {
    category: "action", type: "enableObject", label: "Activar objeto",
    help: "Pone el estado del objeto objetivo en default.",
    params: ["targetObject"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "action:disableObject": {
    category: "action", type: "disableObject", label: "Desactivar objeto",
    help: "Pone el estado del objeto objetivo en disabled.",
    params: ["targetObject"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },

  "action:physicsImpulse": {
    category: "action", type: "physicsImpulse", label: "Física: aplicar impulso",
    help: "Aplica un impulso al objeto objetivo. Usa Valor como x,y. Ejemplo: 0,-900 o 500,0.",
    params: ["object", "value"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "action:physicsVelocity": {
    category: "action", type: "physicsVelocity", label: "Física: fijar velocidad",
    help: "Fija la velocidad del objeto físico. Usa Valor como x,y. Ejemplo: 8,-12.",
    params: ["object", "value"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "action:physicsResetObject": {
    category: "action", type: "physicsResetObject", label: "Física: reset objeto",
    help: "Devuelve el objeto físico a su posición inicial física.",
    params: ["object"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "action:physicsResetScene": {
    category: "action", type: "physicsResetScene", label: "Física: reset escena",
    help: "Reinicia todos los cuerpos físicos de la escena.",
    params: [],
    inputs: [{ name: "in", kind: "flow", label: "◀" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "action:physicsEnableObject": {
    category: "action", type: "physicsEnableObject", label: "Física: activar objeto",
    help: "Activa la física de Matter.js en el objeto objetivo.",
    params: ["object"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "action:physicsDisableObject": {
    category: "action", type: "physicsDisableObject", label: "Física: desactivar objeto",
    help: "Desactiva la física de Matter.js en el objeto objetivo.",
    params: ["object"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },

  "animation:play": {
    category: "animation", type: "play", label: "Animación: reproducir clip",
    help: "Reproduce un clip de spritesheet en el objeto objetivo. Ejemplo: run, idle, pickup.",
    params: ["targetObject", "animation"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }, { name: "target", kind: "data", label: "T" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "animation:stop": {
    category: "animation", type: "stop", label: "Animación: detener",
    help: "Detiene la animación del objeto objetivo.",
    params: ["targetObject"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }, { name: "target", kind: "data", label: "T" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "animation:setFrame": {
    category: "animation", type: "setFrame", label: "Animación: ir a frame",
    help: "Fuerza un frame concreto. Escribe el número de frame en Valor.",
    params: ["targetObject", "value"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }, { name: "target", kind: "data", label: "T" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "animation:pause": {
    category: "animation", type: "pause", label: "Animación: pausar",
    help: "Pausa la animación del objeto objetivo en el frame actual.",
    params: ["targetObject"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }, { name: "target", kind: "data", label: "T" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },
  "animation:resume": {
    category: "animation", type: "resume", label: "Animación: reanudar",
    help: "Reanuda la animación del objeto objetivo.",
    params: ["targetObject"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }, { name: "target", kind: "data", label: "T" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  },

  "condition:hasItem": {
    category: "condition", type: "hasItem", label: "Tiene item",
    help: "Comprueba si el inventario contiene el objeto objetivo.",
    params: ["targetObject"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }, { name: "item", kind: "data", label: "I" }],
    outputs: [{ name: "true", kind: "flow", label: "T" }, { name: "false", kind: "flow", label: "F" }]
  },
  "condition:objectState": {
    category: "condition", type: "objectState", label: "Estado de objeto",
    help: "Comprueba si el objeto objetivo tiene el estado escrito en Valor.",
    params: ["targetObject", "value"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }, { name: "target", kind: "data", label: "T" }],
    outputs: [{ name: "true", kind: "flow", label: "T" }, { name: "false", kind: "flow", label: "F" }]
  },
  "condition:variableEquals": {
    category: "condition", type: "variableEquals", label: "Variable igual a",
    help: "Base para variables globales.",
    params: ["value"],
    inputs: [{ name: "in", kind: "flow", label: "◀" }],
    outputs: [{ name: "true", kind: "flow", label: "T" }, { name: "false", kind: "flow", label: "F" }]
  },

  "mechanism:open": {category:"mechanism", type:"open", label:"Mecanismo: abrir", help:"Abre un mecanismo como panel interactivo.", params:["mechanism"], inputs:[{name:"in",kind:"flow",label:"◀"}], outputs:[{name:"then",kind:"flow",label:"▶"}]},
  "mechanism:close": {category:"mechanism", type:"close", label:"Mecanismo: cerrar", help:"Cierra el mecanismo activo.", params:[], inputs:[{name:"in",kind:"flow",label:"◀"}], outputs:[{name:"then",kind:"flow",label:"▶"}]},
  "mechanism:isSolved": {category:"mechanism", type:"isSolved", label:"Mecanismo: resuelto", help:"Comprueba si el mecanismo está resuelto.", params:["mechanism"], inputs:[{name:"in",kind:"flow",label:"◀"}], outputs:[{name:"true",kind:"flow",label:"T"},{name:"false",kind:"flow",label:"F"}]},

  "data:variable": {
    category: "data", type: "variable", label: "Variable",
    help: "Dato serializado para variables.",
    params: ["value"],
    inputs: [],
    outputs: [{ name: "data", kind: "data", label: "D" }]
  },
  "data:text": {
    category: "data", type: "text", label: "Texto",
    help: "Dato de texto.",
    params: ["value"],
    inputs: [],
    outputs: [{ name: "data", kind: "data", label: "T" }]
  },
  "data:scene": {
    category: "data", type: "scene", label: "Escena",
    help: "Dato de escena.",
    params: ["value"],
    inputs: [],
    outputs: [{ name: "data", kind: "data", label: "S" }]
  }
};

function legacyNodeToCategoryType(nodeOrType) {
  const t = typeof nodeOrType === "string" ? nodeOrType : nodeOrType?.type;
  const map = {
    eventClickObject: ["event", "clickObject"],
    eventSceneStart: ["event", "sceneStart"],
    entityPlayer: ["entity", "player"],
    entityObject: ["entity", "object"],
    entityInventory: ["entity", "inventory"],
    actionPickup: ["action", "pickup"],
    actionShowMessage: ["action", "showMessage"],
    actionPlaySound: ["action", "playSound"],
    actionGotoScene: ["action", "gotoScene"],
    actionSetState: ["action", "setState"],
    actionShowObject: ["action", "showObject"],
    actionHideObject: ["action", "hideObject"],
    conditionHasItem: ["condition", "hasItem"],
    conditionObjectState: ["condition", "objectState"],
    triggerUseItemOnObject: ["trigger", "onUseItem"],
    triggerEnterZone: ["trigger", "onEnter"],
    onClick: ["event", "clickObject"],
    showMessage: ["action", "showMessage"],
    giveItem: ["action", "pickup"],
    setState: ["action", "setState"],
    gotoScene: ["action", "gotoScene"],
    playSound: ["action", "playSound"]
  };
  return map[t] || null;
}

function nodeKey(category, type) {
  return `${category}:${type}`;
}

function normalizeNodeType(node) {
  if (!node) return;
  const legacy = legacyNodeToCategoryType(node);
  if (!node.category || legacy) {
    const pair = legacy || ["action", node.type || "showMessage"];
    node.category = pair[0];
    node.type = pair[1];
  }
  node.targetObjectId ??= "";
  node.event ??= defaultEventForNodeType(node.category, node.type);
}

function nodeDef(nodeOrType, maybeType = null) {
  let category, type;
  if (typeof nodeOrType === "object") {
    normalizeNodeType(nodeOrType);
    category = nodeOrType.category;
    type = nodeOrType.type;
  } else if (maybeType) {
    category = nodeOrType;
    type = maybeType;
  } else {
    const pair = legacyNodeToCategoryType(nodeOrType) || ["action", nodeOrType || "showMessage"];
    category = pair[0];
    type = pair[1];
  }

  const fallback = {
    category,
    type,
    label: type,
    help: "",
    params: [],
    inputs: [{ name: "in", kind: "flow", label: "◀" }],
    outputs: [{ name: "then", kind: "flow", label: "▶" }]
  };
  const def = NODE_DEFS[nodeKey(category, type)] || fallback;
  def.inputs ??= [];
  def.outputs ??= [];
  def.params ??= [];
  return def;
}

function defaultEventForNodeType(category, type = null) {
  if (type == null) {
    const pair = legacyNodeToCategoryType(category);
    if (pair) { category = pair[0]; type = pair[1]; }
  }
  if (category === "event" && type === "sceneStart") return "sceneStart";
  if (category === "event" && type === "inventorySelect") return "inventorySelect";
  if (category === "event" && type === "useInventoryItem") return "useItem";
  if (category === "input") return type;
  if (category === "trigger" && type === "onEnter") return "enter";
  if (category === "trigger" && type === "whileInside") return "inside";
  if (category === "trigger" && type === "onExit") return "exit";
  if (category === "trigger" && type === "onHoverEnter") return "hoverEnter";
  if (category === "trigger" && type === "onHoverExit") return "hoverExit";
  if (category === "trigger" && type === "onUseItem") return "useItem";
  return "click";
}

function isEventNode(node) {
  normalizeNodeType(node);
  return node?.category === "event" || node?.category === "trigger" || node?.category === "input";
}


function nodeInputPorts(node) {
  return nodeDef(node).inputs || [];
}

function nodeOutputPorts(node) {
  return nodeDef(node).outputs || [];
}

function portIndex(ports, portName) {
  return Math.max(0, ports.findIndex(p => p.name === portName));
}

function deleteSelectedNode() {
  const scene = currentScene();
  if (!scene || !state.selectedNodeId) return;
  scene.logic.nodes = scene.logic.nodes.filter(n => n.id !== state.selectedNodeId);
  scene.logic.links = scene.logic.links.filter(l => l.from !== state.selectedNodeId && l.to !== state.selectedNodeId);
  state.selectedNodeId = null;
  state.selectedLinkId = null;
  state.selectedZonePointIndex = null;
  renderAll();
}

function deleteSelectedLink() {
  const scene = currentScene();
  if (!scene || !state.selectedLinkId) return;
  scene.logic.links = scene.logic.links.filter(l => l.id !== state.selectedLinkId);
  state.selectedLinkId = null;
  renderLogic();
}

function nextNodes(nodeId, fromPort = null, kind = "flow") {
  const scene = currentScene();
  return scene.logic.links
    .filter(l => l.from === nodeId && (!fromPort || (l.fromPort || "then") === fromPort) && (!kind || (l.kind || "flow") === kind))
    .map(l => scene.logic.nodes.find(n => n.id === l.to))
    .filter(Boolean);
}

function firstNextNode(nodeId, predicate = null, fromPort = null, kind = "flow") {
  const nodes = nextNodes(nodeId, fromPort, kind);
  return predicate ? nodes.find(predicate) : nodes[0];
}

function dataNodeConnectedTo(nodeId, toPort) {
  const scene = currentScene();
  const link = scene.logic.links.find(l => l.to === nodeId && l.toPort === toPort && (l.kind || "flow") === "data");
  if (!link) return null;
  return scene.logic.nodes.find(n => n.id === link.from) || null;
}

function resolveDataObjectForPort(node, portName) {
  const dataNode = dataNodeConnectedTo(node.id, portName);
  const fromConnected = resolveNodeObject(dataNode);
  if (fromConnected) return fromConnected;

  if (portName === "item" || portName === "target") {
    const scene = currentScene();
    return scene.objects.find(o => o.id === node.targetObjectId) || null;
  }

  return resolveNodeObject(node);
}

function resolveTargetObject(node, portName = "target") {
  const scene = currentScene();
  return resolveDataObjectForPort(node, portName) ||
    scene.objects.find(o => o.id === node.targetObjectId) ||
    scene.objects.find(o => o.id === node.objectId) ||
    null;
}


function findFirstGraphStart(scene) {
  return scene.logic.nodes.find(n => {
    normalizeNodeType(n);
    return n.category === "event" || (n.category === "entity" && n.type === "player");
  }) || scene.logic.nodes[0];
}

function findPlayerObject() {
  return currentScene()?.objects.find(o => o.type === "player") || null;
}

function resolveNodeObject(node) {
  const scene = currentScene();
  if (!node) return null;
  normalizeNodeType(node);
  if (node.category === "entity" && node.type === "player") return findPlayerObject();
  if (node.category === "entity" && node.type === "object") return scene.objects.find(o => o.id === node.objectId) || null;
  return scene.objects.find(o => o.id === node.objectId) || null;
}

/* NODOS */

function addNode() {
  const scene = currentScene();
  if (!scene) return;

  scene.logic ??= { nodes: [], links: [] };
  scene.logic.nodes ??= [];
  scene.logic.links ??= [];

  const category = $("newNodeCategory")?.value || "event";
  const type = $("newNodeType")?.value || (NODE_TYPE_OPTIONS[category]?.[0]?.[0]) || "sceneStart";
  const def = nodeDef(category, type);
  const player = scene.objects.find(o => o.type === "player");

  const node = {
    id: uid(),
    name: def.label,
    category,
    type,
    objectId: category === "entity" && type === "player" && player ? player.id : "",
    audioId: "",
    targetObjectId: "",
    event: defaultEventForNodeType(category, type),
    animation: "",
    animationMode: "",
    input: "",
    mechanismId: "",
    value: category === "action" && type === "showMessage" ? "Mensaje" : "",
    x: 120 + scene.logic.nodes.length * 40,
    y: 100 + scene.logic.nodes.length * 40
  };

  scene.logic.nodes.push(node);
  clearSelection();
  state.selectedPanel = "node";
  state.selectedNodeId = node.id;
  renderAll();
}

function nodePortPos(node, kind, portName = null) {
  const inputs = nodeInputPorts(node);
  const outputs = nodeOutputPorts(node);
  const ports = kind === "output" ? outputs : inputs;
  const idx = portIndex(ports, portName || (kind === "output" ? "then" : "in"));
  return {
    x: node.x + (kind === "output" ? 230 : 0),
    y: node.y + 46 + idx * 30
  };
}

function nodeMissingRequiredParam(node) {
  const def = nodeDef(node);
  const params = new Set(def.params || []);
  if (params.has("object") && !node.objectId) return true;
  if (params.has("targetObject") && !node.targetObjectId) return true;
  if (params.has("audio") && !node.audioId) return true;
  if (params.has("value") && !node.value && !(node.category === "action" && node.type === "gotoScene" && node.targetSceneId)) return true;
  return false;
}


function drawLogicWire(svg, p1, p2, options = {}) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const dx = Math.max(60, Math.abs(p2.x - p1.x) * 0.45);
  path.setAttribute("d", `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", options.stroke || "#d7b36a");
  path.setAttribute("stroke-width", options.width || "3");
  if (options.className) path.classList.add(options.className);
  svg.appendChild(path);
  const c1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  c1.setAttribute("cx", p1.x); c1.setAttribute("cy", p1.y); c1.setAttribute("r", options.endRadius || "5");
  c1.classList.add("wireEnd", "outputEnd"); svg.appendChild(c1);
  const c2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  c2.setAttribute("cx", p2.x); c2.setAttribute("cy", p2.y); c2.setAttribute("r", options.endRadius || "5");
  c2.classList.add("wireEnd", options.temp ? "tempEnd" : "inputEnd"); svg.appendChild(c2);
  return path;
}

function renderLogic() {
  const scene = currentScene();
  if (!scene || state.mode !== "nodes") return;

  els.nodeCanvas.innerHTML = "";
  els.wireLayer.innerHTML = "";

  scene.logic.links.forEach(link => {
    const a = scene.logic.nodes.find(n => n.id === link.from);
    const b = scene.logic.nodes.find(n => n.id === link.to);
    if (!a || !b) return;

    const p1 = nodePortPos(a, "output", link.fromPort || "then");
    const p2 = nodePortPos(b, "input", link.toPort || "in");
    const selected = link.id === state.selectedLinkId;

    const path = drawLogicWire(els.wireLayer, p1, p2, {
      stroke: selected ? "#fff" : (link.kind === "data" ? "#7fc7a2" : "#d7b36a"),
      width: selected ? "5" : "3"
    });

    path.dataset.linkId = link.id;
    path.onclick = e => {
      e.stopPropagation();
      clearSelection();
      state.selectedPanel = "link";
      state.selectedLinkId = link.id;
      renderLogic();
      renderProperties();
    };
  });

  if (state.connectingFrom) {
    const a = scene.logic.nodes.find(n => n.id === state.connectingFrom?.nodeId || n.id === state.connectingFrom);
    if (a) {
      const p1 = nodePortPos(a, "output", state.connectingFrom?.portName || "then");
      const p2 = state.mouseLogic || { x: p1.x + 140, y: p1.y };
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${p1.x} ${p1.y} C ${p1.x + 90} ${p1.y}, ${p2.x - 90} ${p2.y}, ${p2.x} ${p2.y}`);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#aaa");
      path.setAttribute("stroke-width", "2");
      path.setAttribute("class", "tempWire");
      els.wireLayer.appendChild(path);
    }
  }

  scene.logic.nodes.forEach(node => {
    normalizeNodeType(node);

    const div = document.createElement("div");
    const def = nodeDef(node);
    const missingRequired = nodeMissingRequiredParam(node);
    const canReceiveConnection = !!state.connectingFrom && (state.connectingFrom.nodeId || state.connectingFrom) !== node.id;

    div.className = `logicNode ${def.category} ${missingRequired ? "nodeInvalid" : ""} ${canReceiveConnection ? "connectingCandidate" : ""} ${node.id === state.selectedNodeId ? "selected" : ""}`;
    div.style.left = `${node.x}px`;
    div.style.top = `${node.y}px`;

    const obj = resolveNodeObject(node);
    const inputPorts = nodeInputPorts(node);
    const outputPorts = nodeOutputPorts(node);

    div.innerHTML = `
      <div class="nodeHeader">${node.name}<small>${def.category}</small></div>
      <div class="content">
        <strong>${def.label}</strong><br>
        <span class="eventLine">${isEventNode(node) ? (node.event || defaultEventForNodeType(node.category, node.type)) : ""}</span><br>
        <span class="paramsLine">objeto: ${obj ? obj.name : "—"}</span><br>
        <span class="paramsLine">objetivo: ${node.targetObjectId ? (scene.objects.find(o => o.id === node.targetObjectId)?.name || "—") : "—"}</span><br>
        ${(node.value || "").slice(0, 36)}
      </div>
      ${inputPorts.map((p, i) => `<span class="port input ${p.kind}In" data-port="${p.name}" data-kind="${p.kind}" title="Entrada: ${p.name}" style="top:${46 + i * 30}px">${p.label || ""}</span>`).join("")}
      ${outputPorts.map((p, i) => `<span class="port output ${p.kind}Out" data-port="${p.name}" data-kind="${p.kind}" title="Salida: ${p.name}" style="top:${46 + i * 30}px">${p.label || ""}</span>`).join("")}
    `;

    div.onclick = e => {
      e.stopPropagation();
      clearSelection();
      state.selectedPanel = "node";
      state.selectedNodeId = node.id;
      renderAll();
    };

    div.querySelectorAll(".output").forEach(port => {
      port.onclick = e => {
        e.stopPropagation();
        state.connectingFrom = {
          nodeId: node.id,
          portName: port.dataset.port,
          kind: port.dataset.kind
        };
        updateLogicMouse(e);
        renderLogic();
      };
    });

    div.querySelectorAll(".input").forEach(port => {
      port.onclick = e => {
        e.stopPropagation();
        if (!state.connectingFrom || state.connectingFrom.nodeId === node.id) return;

        const fromNode = scene.logic.nodes.find(n => n.id === state.connectingFrom.nodeId);
        const outDef = nodeOutputPorts(fromNode).find(p => p.name === state.connectingFrom.portName);
        const inDef = nodeInputPorts(node).find(p => p.name === port.dataset.port);

        if (outDef?.kind !== inDef?.kind) {
          alert("No puedes conectar un puerto de flujo con uno de datos.");
          state.connectingFrom = null;
          renderLogic();
          return;
        }

        const existing = scene.logic.links.find(l =>
          l.from === state.connectingFrom.nodeId &&
          l.to === node.id &&
          l.fromPort === state.connectingFrom.portName &&
          l.toPort === port.dataset.port
        );

        if (!existing) {
          scene.logic.links.push({
            id: uid(),
            from: state.connectingFrom.nodeId,
            fromPort: state.connectingFrom.portName,
            to: node.id,
            toPort: port.dataset.port,
            kind: inDef.kind
          });
        }

        state.connectingFrom = null;
        document.querySelectorAll(".logicNode .port.input").forEach(p => p.classList.remove("connectTarget"));
        renderLogic();
      };
    });

    enableNodeDragging(div, node);
    els.nodeCanvas.appendChild(div);
  });
}

function redrawLogicWiresOnly() {
  const scene = currentScene();
  if (!scene || state.mode !== "nodes") return;

  els.wireLayer.innerHTML = "";

  scene.logic.links.forEach(link => {
    const a = scene.logic.nodes.find(n => n.id === link.from);
    const b = scene.logic.nodes.find(n => n.id === link.to);
    if (!a || !b) return;

    const p1 = nodePortPos(a, "output", link.fromPort || "then");
    const p2 = nodePortPos(b, "input", link.toPort || "in");
    const selected = link.id === state.selectedLinkId;

    const path = drawLogicWire(els.wireLayer, p1, p2, {
      stroke: selected ? "#fff" : (link.kind === "data" ? "#7fc7a2" : "#d7b36a"),
      width: selected ? "5" : "3"
    });

    path.dataset.linkId = link.id;
    path.onclick = e => {
      e.stopPropagation();
      clearSelection();
      state.selectedPanel = "link";
      state.selectedLinkId = link.id;
      renderLogic();
      renderProperties();
    };
  });

  if (state.connectingFrom) {
    const a = scene.logic.nodes.find(n => n.id === state.connectingFrom?.nodeId || n.id === state.connectingFrom);
    if (a) {
      const p1 = nodePortPos(a, "output", state.connectingFrom?.portName || "then");
      const p2 = state.mouseLogic || { x: p1.x + 140, y: p1.y };
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${p1.x} ${p1.y} C ${p1.x + 90} ${p1.y}, ${p2.x - 90} ${p2.y}, ${p2.x} ${p2.y}`);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#aaa");
      path.setAttribute("stroke-width", "2");
      path.setAttribute("class", "tempWire");
      els.wireLayer.appendChild(path);
    }
  }
}

function updateLogicMouse(e) {
  const rect = els.nodeCanvas.getBoundingClientRect();
  state.mouseLogic = { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function enableNodeDragging(el, node) {
  el.addEventListener("pointerdown", e => {
    if (e.target.classList.contains("port")) return;
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const baseX = node.x;
    const baseY = node.y;
    let raf = null;

    const scheduleWireUpdate = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        redrawLogicWiresOnly();
      });
    };

    clearSelection();
    state.selectedPanel = "node";
    state.selectedNodeId = node.id;
    el.classList.add("selected", "dragging");
    renderProperties();

    function onMove(ev) {
      node.x = baseX + ev.clientX - startX;
      node.y = baseY + ev.clientY - startY;
      el.style.left = `${node.x}px`;
      el.style.top = `${node.y}px`;
      scheduleWireUpdate();
    }

    function onUp() {
      el.classList.remove("dragging");
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      renderLogic();
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  });
}

function makeLogicContext(scene, objectId = null, extra = {}) {
  return {
    actor: findPlayerObject(),
    subject: scene.objects.find(o => o.id === objectId) || null,
    lastObject: null,
    clickedObjectId: objectId || "",
    selectedItemId: extra.itemId || state.selectedInventoryItemId || "",
    targetObjectId: extra.targetId || objectId || "",
    inventory: state.inventory,
    input: extra.input || "",
    button: extra.button || "",
    point: extra.point || null,
    stopped: false
  };
}

function runLogicGraph(eventType = null, objectId = null, extra = {}) {
  const scene = currentScene();
  if (!scene) return false;

  const wantedEvent = eventType || "click";
  audioGraphDebug(`runLogicGraph: evento=${wantedEvent} escena=${scene.name}`);

  const candidates = scene.logic.nodes.filter(n => {
    normalizeNodeType(n);

    if (wantedEvent === "sceneStart") {
      return n.category === "event" && n.type === "sceneStart";
    }

    if (wantedEvent && wantedEvent.startsWith("input:")) {
      const inputType = wantedEvent.split(":")[1];
      const wantedInput = extra.input || "";
      const nodeInput = n.input || "";

      if (n.category !== "input" || n.type !== inputType) return false;

      // El click de ratón es tolerante: el nodo puede guardar vacío,
      // "click" o "mouse:left".
      if (inputType === "click") {
        return !nodeInput || nodeInput === "click" || nodeInput === "mouse:left" || nodeInput === wantedInput;
      }

      return !nodeInput || nodeInput === wantedInput;
    }

    if (wantedEvent === "click") {
      return n.category === "event" && n.type === "clickObject" && (!n.objectId || n.objectId === objectId);
    }

    if (wantedEvent === "useItem") {
      return (
        ((n.category === "event" && n.type === "useInventoryItem") || (n.category === "trigger" && n.type === "onUseItem")) &&
        (!n.objectId || n.objectId === objectId)
      );
    }

    if (wantedEvent === "physicsCollision") {
      return n.category === "event" && n.type === "physicsCollision" && (!n.objectId || n.objectId === extra.objectAId || n.objectId === extra.objectBId);
    }

    if (wantedEvent === "inventorySelect") {
      return n.category === "event" && n.type === "inventorySelect";
    }

    if (wantedEvent === "entityPlayer") {
      return n.category === "entity" && n.type === "player";
    }

    return false;
  });

  let starts = candidates;

  if (!starts.length && wantedEvent === "entityPlayer") {
    const playerNode = scene.logic.nodes.find(n => {
      normalizeNodeType(n);
      return n.category === "entity" && n.type === "player";
    });
    if (playerNode) starts = [playerNode];
  }

  if (!starts.length && !eventType) {
    const first = findFirstGraphStart(scene);
    if (first) starts = [first];
  }

  if (!starts.length) {
    audioGraphDebug(`runLogicGraph: sin nodos iniciales para ${wantedEvent}`);
    return false;
  }

  audioGraphDebug(`runLogicGraph: starts=${starts.length} para ${wantedEvent}`);

  let anyExecuted = false;

  // Importante: un mismo evento puede tener varios grafos.
  // Ejemplo: dos nodos "Input: clic ratón", uno para animación y otro para movimiento.
  // Antes solo se ejecutaba el primero; ahora se ejecutan todos los candidatos.
  for (const start of starts) {
    const context = makeLogicContext(scene, objectId, extra);
    executeFlowFrom(start, context, new Set());
    anyExecuted = true;
  }

  return anyExecuted;
}








function runLogicGraphFromToolbar() {
  if (typeof unlockAudioByUserGesture === "function") unlockAudioByUserGesture();
  const category = $("newNodeCategory")?.value || "";
  const type = $("newNodeType")?.value || "";
  const selected = typeof selectedNode === "function" ? selectedNode() : null;

  let ran = false;

  if (category === "event") {
    if (type === "sceneStart") ran = runLogicGraph("sceneStart");
    else if (type === "clickObject") ran = runLogicGraph("click", selected?.objectId || state.selectedObjectId || "");
    else if (type === "inventorySelect") ran = runLogicGraph("inventorySelect");
    else if (type === "useInventoryItem") ran = runLogicGraph("useItem", selected?.objectId || state.selectedObjectId || "");
  } else if (category === "input") {
    const inputValue = selected?.input || $("nodeInput")?.value || "";
    ran = runLogicGraph(`input:${type}`, "", {
      input: inputValue || (type === "click" ? "click" : ""),
      button: type === "click" || type === "mouseDown" || type === "mouseUp" ? "left" : ""
    });
  } else if (category === "entity" && type === "player") {
    ran = runLogicGraph("entityPlayer", "");
  } else if (selected && typeof isEventNode === "function" && isEventNode(selected)) {
    const context = makeLogicContext(currentScene(), selected.objectId || "", {});
    executeFlowFrom(selected, context, new Set());
    ran = true;
  } else if (selected && selected.category === "action") {
    const context = makeLogicContext(currentScene(), selected.objectId || "", {});
    executeFlowFrom(selected, context, new Set());
    ran = true;
  } else {
    ran = runLogicGraph("entityPlayer", "");
  }

  if (!ran) {
    showMessage("No se encontró ningún grafo para el evento seleccionado.");
    if ($("statusText")) $("statusText").textContent = "No se encontró ningún grafo para probar.";
  } else if ($("statusText")) {
    $("statusText").textContent = `Grafo probado: ${category || "selección"} / ${type || "nodo seleccionado"}`;
  }

  return ran;
}


function nodeTargetObjectForAction(node, obj = null, context = {}) {
  const scene = currentScene();
  if (!scene) return null;
  return resolveDataObjectForPort(node, "target") ||
    scene.objects.find(o => o.id === node.targetObjectId) ||
    scene.objects.find(o => o.id === node.objectId) ||
    obj ||
    context.subject ||
    context.actor ||
    findPlayerObject();
}

function normalizeAnimationClipName(raw = "") {
  let name = String(raw || "").trim();
  if (name.startsWith("Sprite:")) name = name.replace(/^Sprite:\s*/i, "").trim();
  if (name.startsWith("Transform:")) name = name.replace(/^Transform:\s*/i, "").trim();
  return name;
}

function playGraphSpriteAnimationFromNode(node, obj = null, context = {}) {
  const target = nodeTargetObjectForAction(node, obj, context);
  if (!target) {
    showMessage("Reproducir spritesheet necesita un objeto objetivo.");
    return false;
  }

  target.sprite ??= {};
  const clips = target.sprite.clips || {};
  const requested = normalizeAnimationClipName(node.animation || node.value || target.sprite.currentClip || "");
  const clipName = clips[requested] ? requested : (clips.run ? "run" : clips.idle ? "idle" : Object.keys(clips)[0]);

  if (!clipName || !clips[clipName]) {
    showMessage(`El objeto "${target.name || target.id}" no tiene el clip spritesheet "${requested || "sin nombre"}".`);
    if ($("statusText")) $("statusText").textContent = `Clip spritesheet no encontrado: ${requested || "sin nombre"}`;
    return false;
  }

  // Importante: si el objeto aún no estaba renderizado como spritesheet,
  // updateObjectElement() no basta. Hay que reconstruir el elemento DOM.
  target.sprite.enabled = true;
  target.visible = target.visible !== false;
  if (typeof renderStage === "function") renderStage();

  const ok = playObjectAnimation(target, clipName, true, node.animationMode || null);

  if (ok) {
    if (typeof startAnimationLoop === "function") startAnimationLoop();
    if (typeof updateObjectElement === "function") updateObjectElement(target);
    if (typeof updateRuntimeElements === "function") updateRuntimeElements();
    if ($("statusText")) $("statusText").textContent = `Reproduciendo spritesheet: ${target.name || target.id} / ${clipName}`;
    if ($("statusText")) $("statusText").textContent = `Animación ejecutada: ${clipName}`;
  } else {
    showMessage(`No se pudo iniciar la animación "${clipName}".`);
    if ($("statusText")) $("statusText").textContent = `No se pudo iniciar spritesheet: ${target.name || target.id} / ${clipName}`;
  }

  return !!ok;
}


function diagnoseSceneStartAudioGraph() {
  const scene = currentScene();
  if (!scene) {
    audioGraphDebug("DIAG: no hay escena actual.");
    return false;
  }

  const allNodes = scene.logic?.nodes || [];
  const links = scene.logic?.links || [];

  audioGraphDebug(`DIAG: escena actual = ${scene.name} (${scene.id})`);
  audioGraphDebug(`DIAG: nodos=${allNodes.length}, conexiones=${links.length}`);

  const starts = allNodes.filter(n => {
    normalizeNodeType(n);
    return n.category === "event" && n.type === "sceneStart";
  });

  audioGraphDebug(`DIAG: sceneStart encontrados=${starts.length}`);

  if (!starts.length) return false;

  let foundAudio = false;

  function walk(node, depth = 0, visited = new Set()) {
    if (!node || visited.has(node.id)) return;
    visited.add(node.id);
    normalizeNodeType(node);

    const prefix = "  ".repeat(depth);
    audioGraphDebug(`${prefix}DIAG nodo: ${node.category}:${node.type} · ${node.name || node.id}`);

    if (node.category === "action" && node.type === "playSound") {
      foundAudio = true;
      const id = node.audioId || scene.audioIds?.[0] || "";
      const asset = audioAssetById(id);
      audioGraphDebug(`${prefix}DIAG AUDIO: audioId=${id || "(vacío)"} asset=${asset?.name || "NO ENCONTRADO"} dataUrl=${asset?.dataUrl ? asset.dataUrl.length : 0}`);
    }

    const outs = links.filter(l => l.from === node.id && (l.kind || "flow") === "flow" && (l.fromPort || "then") === "then");
    audioGraphDebug(`${prefix}DIAG salidas then=${outs.length}`);

    outs.forEach(l => {
      const next = allNodes.find(n => n.id === l.to);
      audioGraphDebug(`${prefix}DIAG link: ${node.name || node.id} -> ${next?.name || l.to}`);
      walk(next, depth + 1, visited);
    });
  }

  starts.forEach(start => walk(start, 0, new Set()));

  audioGraphDebug(foundAudio ? "DIAG RESULTADO: hay nodo Reproducir audio alcanzable." : "DIAG RESULTADO: NO se alcanza ningún nodo Reproducir audio desde Inicio de escena.");
  return foundAudio;
}


function playGraphAudioFromNode(node, obj = null) {
  const scene = currentScene();
  const id = node?.audioId || obj?.audioId || scene?.audioIds?.[0] || "";
  if (!id) {
    showMessage("Este nodo no tiene audio asignado y la escena no tiene audio asociado.");
    audioGraphDebug("Nodo Reproducir audio sin audioId ni fallback de escena.");
    return false;
  }

  const asset = typeof audioAssetById === "function" ? audioAssetById(id) : null;
  if (!asset?.dataUrl) {
    showMessage(`Audio no encontrado: ${id}`);
    audioGraphDebug(`Nodo audioId no encontrado en assets: ${id}`);
    return false;
  }

  const vol = typeof sceneAudioVolume === "function" ? sceneAudioVolume(id, node?.volume) : 1;

  audioGraphDebug(`Nodo Reproducir audio ejecutado: ${asset.name || id} · id=${id}`);

  if (typeof playGraphAudioAsset === "function") {
    return playGraphAudioAsset(id, { loop: false, scope: "scene", volume: vol });
  }

  if (typeof playAudioAsset === "function") {
    const audio = playAudioAsset(id, { loop: false, scope: "scene", volume: vol });
    return !!audio;
  }

  showMessage("El sistema de audio no está disponible.");
  audioGraphDebug("Sistema de audio no disponible.");
  return false;
}









function executeFlowFrom(node, context, visited) {
  if (!node) {
    audioGraphDebug("executeFlowFrom: nodo vacío.");
    return;
  }
  if (visited.has(node.id)) {
    audioGraphDebug(`executeFlowFrom: nodo ya visitado, se evita bucle: ${node.name || node.id}`);
    return;
  }
  if (context.stopped) {
    audioGraphDebug("executeFlowFrom: contexto detenido.");
    return;
  }

  normalizeNodeType(node);
  audioGraphDebug(`FLOW entra: ${node.category}:${node.type} · ${node.name || node.id}`);

  visited.add(node.id);

  const ok = executeNode(node, context);
  audioGraphDebug(`FLOW resultado: ${node.category}:${node.type} · ok=${ok}`);

  if (!ok || context.stopped) return;

  const outPort = typeof ok === "string" ? ok : "then";
  const outs = nextNodes(node.id, outPort, "flow");
  audioGraphDebug(`FLOW salidas ${outPort}: ${outs.length}`);

  for (const next of outs) executeFlowFrom(next, context, new Set(visited));
}


function objectRect(obj) {
  if (!obj) return null;
  return {
    x: obj.x,
    y: obj.y,
    w: obj.width * (obj.scale || 1),
    h: obj.height * (obj.scale || 1)
  };
}

function rectsOverlap(a, b) {
  if (!a || !b) return false;
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}


function spatialTriggerKey(node, actor, target) {
  return `${node.id}:${actor?.id || "actor"}:${target?.id || "target"}`;
}














function inflateColliderRect(rect, margin = 32) {
  if (!rect) return null;
  return {
    x: rect.x - margin,
    y: rect.y - margin,
    w: rect.w + margin * 2,
    h: rect.h + margin * 2
  };
}

function pointInsideRect(point, rect) {
  return !!point && !!rect &&
    point.x >= rect.x &&
    point.x <= rect.x + rect.w &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.h;
}

function colliderCenter(rect) {
  if (!rect) return null;
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

function portalSpawnLockRecord(scene, node, player, target, reason = "spawnInside") {
  const targetCollider = getWorldCollider(target);
  return {
    sceneId: scene?.id || "",
    nodeId: node?.id || "",
    playerId: player?.id || "",
    targetId: target?.id || "",
    reason,
    createdAt: performance.now(),
    outsideSince: 0,
    safetyRect: inflateColliderRect(targetCollider, 36)
  };
}

function isPortalLikeTrigger(node) {
  return !!node && node.category === "trigger" && ["onEnter", "whileInside", "onExit"].includes(node.type);
}

function playerStillInPortalSafetyZone(player, target, lock) {
  const playerCollider = getWorldCollider(player);
  const targetCollider = getWorldCollider(target);
  if (collidersOverlap(playerCollider, targetCollider)) return true;

  const center = colliderCenter(playerCollider);
  if (pointInsideRect(center, lock?.safetyRect)) return true;

  // También consideramos el punto de interacción/pies del player, porque visualmente suele ser
  // lo que determina que el personaje siga encima de un portal.
  const foot = typeof playerInteractionPoint === "function" ? playerInteractionPoint(player) : null;
  if (pointInsideRect(foot, lock?.safetyRect)) return true;

  return false;
}

function spatialTriggerExitDelayMs() {
  return 420;
}


function primeSpatialTriggerStatesForCurrentScene() {
  if (state.mode !== "play") return;

  const scene = currentScene();
  const player = findPlayerObject();
  if (!scene || !player) return;

  state.spatialTriggerStates ??= {};
  state.spatialTriggerBlocked ??= {};

  scene.logic.nodes.forEach(node => {
    normalizeNodeType(node);
    if (!isPortalLikeTrigger(node)) return;

    const target = resolveTargetObject(node, "target") || scene.objects.find(o => o.id === node.targetObjectId);
    if (!target || !target.visible || target === player || target.type === "background") return;

    const insideOrUnsafe = playerStillInPortalSafetyZone(player, target, { safetyRect: inflateColliderRect(getWorldCollider(target), 36) });
    const key = spatialTriggerKey(node, player, target);

    state.spatialTriggerStates[key] = insideOrUnsafe;

    if (insideOrUnsafe) {
      state.spatialTriggerBlocked[key] = portalSpawnLockRecord(scene, node, player, target, "enteredSceneInsideOrNearPortal");
      if ($("statusText")) $("statusText").textContent = `Portal bloqueado hasta salir: ${target.name || target.id}`;
    } else {
      delete state.spatialTriggerBlocked[key];
    }
  });
}



function evaluateSpatialTriggers() {
  if (state.mode !== "play") return;
  if (typeof sceneTransitionActive === "function" && sceneTransitionActive()) return;

  const scene = currentScene();
  const player = findPlayerObject();
  if (!scene || !player) return;

  state.spatialTriggerStates ??= {};
  state.spatialTriggerBlocked ??= {};

  const now = performance.now();
  const exitDelay = spatialTriggerExitDelayMs();

  scene.logic.nodes.forEach(node => {
    normalizeNodeType(node);
    if (!isPortalLikeTrigger(node)) return;

    const target = resolveTargetObject(node, "target") || scene.objects.find(o => o.id === node.targetObjectId);
    if (!target || !target.visible || target === player || target.type === "background") return;

    const inside = !!player && !!target && collidersOverlap(getWorldCollider(player), getWorldCollider(target));
    const key = spatialTriggerKey(node, player, target);
    const hasKnownState = Object.prototype.hasOwnProperty.call(state.spatialTriggerStates, key);
    const wasInside = !!state.spatialTriggerStates[key];

    // Si la primera evaluación detecta al player dentro o aún en la zona ampliada del portal,
    // bloqueamos el portal. Esto cubre los casos en que el cebado inicial no llega a tiempo.
    if (!hasKnownState) {
      const unsafe = playerStillInPortalSafetyZone(player, target, { safetyRect: inflateColliderRect(getWorldCollider(target), 36) });
      state.spatialTriggerStates[key] = unsafe;
      if (unsafe) {
        state.spatialTriggerBlocked[key] = portalSpawnLockRecord(scene, node, player, target, "firstSeenInsideOrNearPortal");
        if ($("statusText")) $("statusText").textContent = `Portal bloqueado hasta salir: ${target.name || target.id}`;
      }
      return;
    }

    const lock = state.spatialTriggerBlocked[key];
    if (lock) {
      const stillUnsafe = playerStillInPortalSafetyZone(player, target, lock);
      state.spatialTriggerStates[key] = stillUnsafe;

      if (stillUnsafe) {
        lock.outsideSince = 0;
        return;
      }

      if (!lock.outsideSince) {
        lock.outsideSince = now;
        return;
      }

      if (now - lock.outsideSince < exitDelay) return;

      delete state.spatialTriggerBlocked[key];
      state.spatialTriggerStates[key] = false;
      if ($("statusText")) $("statusText").textContent = `Portal rearmado: ${target.name || target.id}`;
      return;
    }

    const justEnteredScene = performance.now() - Number(state.sceneEnteredAt || 0) < 1600;

    let shouldRun = false;
    if (node.type === "onEnter") shouldRun = inside && !wasInside && !justEnteredScene;
    if (node.type === "whileInside") shouldRun = inside && !justEnteredScene;
    if (node.type === "onExit") shouldRun = !inside && wasInside && !justEnteredScene;

    state.spatialTriggerStates[key] = inside;

    if (shouldRun) {
      const context = {
        actor: player,
        subject: target,
        lastObject: target,
        clickedObjectId: "",
        selectedItemId: state.selectedInventoryItemId || "",
        targetObjectId: target.id,
        inventory: state.inventory,
        stopped: false
      };
      executeFlowFrom(node, context, new Set());
    }
  });
}



function executeNode(node, context = {}) {
  normalizeNodeType(node);
  const scene = currentScene();
  const obj = resolveNodeObject(node);

  if (node.category === "event" && node.type === "sceneStart") {
    audioGraphDebug(`Ejecutando nodo: Inicio de escena · ${scene?.name || ""}`);
  }
  if (node.category === "action") {
    audioGraphDebug(`Ejecutando nodo acción: ${node.name || node.type}`);
  }

  if (node.category === "event") {
    if (node.type === "physicsCollision") {
      if (node.objectId && node.objectId !== context.objectAId && node.objectId !== context.objectBId) return false;
      context.clickedObjectId = context.objectBId || context.objectAId || "";
      context.subject = scene.objects.find(o => o.id === context.objectAId) || context.subject;
      context.lastObject = scene.objects.find(o => o.id === context.objectBId) || context.lastObject || context.subject;
      return true;
    }
    if (node.type === "clickObject" || node.type === "useInventoryItem") {
      context.clickedObjectId = context.clickedObjectId || node.objectId || "";
      context.subject = scene.objects.find(o => o.id === context.clickedObjectId) || obj || context.subject;
      context.lastObject = context.subject || context.lastObject;
    }
    return true;
  }

  if (node.category === "input") {
    const expected = node.input || context.input || "";
    if (node.type === "keyHeld") return !expected || !!state.input.keys[expected];
    return true;
  }

  if (node.category === "entity") {
    if (node.type === "player") {
      context.actor = findPlayerObject();
      context.lastObject = context.actor || context.lastObject;
    } else if (node.type === "object") {
      context.subject = obj || context.subject;
      context.lastObject = context.subject || context.lastObject;
    }
    return true;
  }

  if (node.category === "trigger") {
    if (["onEnter", "whileInside", "onExit"].includes(node.type)) {
      const actor = resolveDataObjectForPort(node, "actor") || context.actor || findPlayerObject();
      const target = resolveDataObjectForPort(node, "target") || scene.objects.find(o => o.id === node.targetObjectId) || context.subject;
      const inside = !!actor && !!target && collidersOverlap(getWorldCollider(actor), getWorldCollider(target));
      if (node.type === "onEnter" || node.type === "whileInside") return inside;
      if (node.type === "onExit") return !inside;
    }

    if (node.type === "onUseItem") {
      const target = resolveDataObjectForPort(node, "target") || scene.objects.find(o => o.id === node.targetObjectId) || context.subject;
      if (node.targetObjectId && target?.id !== context.targetObjectId) return false;
      return !!context.selectedItemId;
    }

    return true;
  }

  if (node.category === "action") {
    switch (node.type) {
      case "moveTo": {
        const target = resolveTargetObject(node, "target");
        const player = findPlayerObject();

        if (!player) {
          showMessage("No hay player en esta escena.");
          return false;
        }

        const clickedPoint = context.point || (Number.isFinite(state.input.mouse.x) && Number.isFinite(state.input.mouse.y)
          ? { x: state.input.mouse.x, y: state.input.mouse.y }
          : null);

        // Caso point-and-click:
        // - sin objetivo explícito
        // - o el objetivo elegido es el propio Player por error
        // En ambos casos usamos el punto clicado si existe.
        if ((!target || target.id === player.id) && clickedPoint) {
          movePlayerTo(clickedPoint);
          return true;
        }

        if (target) {
          const point = {
            x: target.x + (target.width * (target.scale || 1)) / 2,
            y: target.y + target.height * (target.scale || 1)
          };
          movePlayerTo(point);
          return true;
        }

        showMessage("Mover necesita un objeto destino o un punto clicado.");
        return false;
      }

      case "pickup": {
        const target = resolveDataObjectForPort(node, "item") ||
          scene.objects.find(o => o.id === node.targetObjectId) ||
          context.subject ||
          context.lastObject;

        if (!target || target.type === "player" || target.type === "background") {
          showMessage("Recoger necesita un objeto/item objetivo válido.");
          return false;
        }

        return addItemToInventoryById(target.id, {
          hideObject: true,
          showMessageText: node.value || `Has recogido ${target.name}.`
        });
      }

      case "addInventoryItem": {
        const target = resolveDataObjectForPort(node, "item") ||
          scene.objects.find(o => o.id === node.targetObjectId) ||
          context.subject ||
          context.lastObject;

        if (!target || target.type === "player" || target.type === "background") {
          showMessage("Añadir item necesita un objeto/item válido.");
          return false;
        }

        return addItemToInventoryById(target.id, {
          hideObject: false,
          showMessageText: node.value || ""
        });
      }

      case "removeInventoryItem": {
        const target = resolveDataObjectForPort(node, "item") ||
          scene.objects.find(o => o.id === node.targetObjectId) ||
          context.subject ||
          context.lastObject;
        if (!target) return false;
        removeItemFromInventoryById(target.id);
        return true;
      }

      case "consumeSelectedItem": {
        if (context.selectedItemId) removeItemFromInventoryById(context.selectedItemId);
        return true;
      }

      case "showMessage":
        showMessage(node.value || obj?.message || "");
        return true;

      case "playSound":
        return playGraphAudioFromNode(node, obj);

      case "playSceneAudio":
        playSceneAudio(node.audioId || "", (node.value || "loop").toLowerCase() !== "once", node.volume);
        return true;

      case "stopSceneAudio":
        stopSceneAudio(node.audioId || "");
        return true;

      case "setSceneAudioVolume":
        setSceneAudioVolume(node.audioId || "", node.volume ?? node.value ?? 1);
        return true;

      case "setSceneAudioMasterVolume":
        setSceneAudioMasterVolume(node.volume ?? node.value ?? 1);
        return true;

      case "gotoScene":
        return gotoScene(node.targetSceneId || node.value || obj?.targetSceneId);

      case "setState": {
        const target = resolveDataObjectForPort(node, "target") || scene.objects.find(o => o.id === node.targetObjectId) || obj;
        if (target) {
          applyObjectState(target, node.value || "used");
        }
        return true;
      }

      case "playAnimation":
        return playGraphSpriteAnimationFromNode(node, obj, context);

      case "stopAnimation": {
        const target = nodeTargetObjectForAction(node, obj, context);
        if (target) stopObjectAnimation(target);
        updateRuntimeElements();
        return true;
      }

      case "playTransformClip": {
        const target = nodeTargetObjectForAction(node, obj, context);
        if (target && typeof playTransformClip === "function") playTransformClip(target, normalizeAnimationClipName(node.animation || node.value || ""), node.animationMode || null, true);
        updateRuntimeElements();
        return true;
      }

      case "stopTransformClip": {
        const target = resolveDataObjectForPort(node, "target") || scene.objects.find(o => o.id === node.targetObjectId) || obj;
        if (target && typeof stopTransformClip === "function") stopTransformClip(target, true);
        updateRuntimeElements();
        return true;
      }

      case "showObject": {
        const target = resolveDataObjectForPort(node, "target") || scene.objects.find(o => o.id === node.targetObjectId) || obj;
        if (target) {
          target.visible = true;
          applyObjectState(target, preferredStateName(target, ["visible", "default"], "default"));
        }
        return true;
      }

      case "hideObject": {
        const target = resolveDataObjectForPort(node, "target") || scene.objects.find(o => o.id === node.targetObjectId) || obj;
        if (target) {
          applyObjectState(target, preferredStateName(target, ["hidden", "oculta", "oculto"], "hidden"));
        }
        return true;
      }

      case "enableObject": {
        const target = scene.objects.find(o => o.id === node.targetObjectId) || obj;
        if (target) {
          applyObjectState(target, "default", { render: false });
        }
        return true;
      }

      case "disableObject": {
        const target = scene.objects.find(o => o.id === node.targetObjectId) || obj;
        if (target) {
          applyObjectState(target, "disabled", { render: false });
        }
        return true;
      }
    }
  }

  if (node.category === "animation") {
    const target = resolveTargetObject(node, "target");
    switch (node.type) {
      case "play":
        return playGraphSpriteAnimationFromNode(node, target, context);

      case "stop":
        if (target) stopObjectAnimation(target);
        updateRuntimeElements();
        return true;

      case "setFrame":
        if (target) {
          setSpriteFrame(target, Number(node.value || 0));
          if (target.sprite) target.sprite.playing = false;
        }
        updateRuntimeElements();
        return true;

      case "pause":
        if (target?.sprite) target.sprite.playing = false;
        updateRuntimeElements();
        return true;

      case "resume":
        if (target?.sprite) target.sprite.playing = true;
        updateRuntimeElements();
        return true;
    }
    return true;
  }

  if (node.category === "mechanism") {
    const mechanism=(state.project.mechanisms||[]).find(m=>m.id===node.mechanismId);
    if(node.type==="open"){if(mechanism)openMechanismRuntime(mechanism.id);return true;}
    if(node.type==="close"){closeMechanismRuntime();return true;}
    if(node.type==="isSolved")return mechanism?.solved ? "true" : "false";
    return true;
  }

  if (node.category === "condition") {
    if (node.type === "hasItem") {
      const item = resolveDataObjectForPort(node, "item") ||
        scene.objects.find(o => o.id === node.targetObjectId) ||
        scene.objects.find(o => o.id === context.selectedItemId);
      return item && inventoryContainsObjectId(item.id) ? "true" : "false";
    }

    if (node.type === "objectState") {
      const target = resolveDataObjectForPort(node, "target") || scene.objects.find(o => o.id === node.targetObjectId) || obj;
      const pass = target ? (objectStateName(target) === (node.value || "default")) : false;
      return pass ? "true" : "false";
    }

    return "false";
  }

  return true;
}

/* Persistencia */

const AVENTURIA_FILE_VERSION = 1;
let lastSavedProjectHandle = null;
const BUNDLED_PROJECT_PATHS = [
  "projects/default.ave",
  "projects/default.json"
];

function safeFileBaseName(name = "aventuria_proyecto") {
  return String(name || "aventuria_proyecto")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase() || "aventuria_proyecto";
}

function compactProjectForStorage(project) {
  const copy = deepClone(project);
  const images = copy.assets?.images || [];
  images.forEach(asset => {
    if (asset?.src && asset.src === asset.dataUrl) delete asset.src;
  });
  return copy;
}

function makeAvePackage() {
  return {
    app: "AventurIA",
    fileType: "aventuria-project",
    extension: "ave",
    version: AVENTURIA_FILE_VERSION,
    savedAt: new Date().toISOString(),
    project: compactProjectForStorage(state.project)
  };
}

function unwrapProjectFile(data) {
  if (data?.fileType === "aventuria-project" && data.project) return data.project;
  if (data?.app === "AventurIA" && data.project) return data.project;
  return data;
}


function applyLoadedProject(rawProject, sourceLabel = "proyecto") {
  state.editorSnapshot = null;
  stopAnimationLoop();
  state.project = normalizeProject(unwrapProjectFile(rawProject));
  state.selectedSceneId = state.project.startSceneId || state.project.scenes[0]?.id || null;
  clearSelection();
  state.inventory = [];
  state.runtimeStates = {};
  state.spatialTriggerStates = {};
  state.spatialTriggerBlocked = {};
  state.selectedInventoryItemId = null;
  state.inventoryOpen = false;
  lastSavedProjectHandle = null;
  setMode("editor");
  updateProjectFileInfo(sourceLabel);
  $("statusText").textContent = sourceLabel;
}

async function fetchBundledProjectData() {
  for (const path of BUNDLED_PROJECT_PATHS) {
    try {
      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) continue;
      return { path, data: await res.json() };
    } catch (err) {
      // Puede que ese archivo no exista; probamos el siguiente candidato.
    }
  }
  return null;
}

async function loadBundledProject({ silent = false } = {}) {
  const bundled = await fetchBundledProjectData();
  if (!bundled) {
    if (!silent) showMessage("No hay proyecto incluido. Añade projects/default.ave o projects/default.json al repo.");
    return false;
  }

  applyLoadedProject(bundled.data, `Proyecto incluido cargado: ${bundled.path}`);
  showMessage("Proyecto incluido cargado.");
  return true;
}
async function prepareProjectForDisk() {
  if (state.mode === "play") {
    alert("Para guardar, pulsa Stop o vuelve a Editor. El modo Play es solo una evaluación temporal.");
    return false;
  }
  await updateAllSceneThumbnails();
  renderScenes();
  return true;
}

function downloadTextFile(filename, text, type = "application/json") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function updateProjectFileInfo(text = "") {
  const el = $("currentProjectFileInfo");
  if (!el) return;
  el.textContent = text || "Proyecto sin archivo asociado.";
}

async function writeWithFileSystemAccess(suggestedName, text, description = "AventurIA Project", accept = { "application/json": [".ave"] }) {
  if (!window.showSaveFilePicker) return false;

  const handle = await window.showSaveFilePicker({
    suggestedName,
    types: [{ description, accept }]
  });
  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
  lastSavedProjectHandle = handle;
  updateProjectFileInfo(`Archivo asociado: ${handle.name}`);
  return true;
}

async function saveProjectAve({ saveAs = false } = {}) {
  if (!(await prepareProjectForDisk())) return;

  const text = JSON.stringify(makeAvePackage(), null, 2);
  const filename = `${safeFileBaseName(state.project.name)}.ave`;

  try {
    if (!saveAs && lastSavedProjectHandle?.createWritable) {
      const writable = await lastSavedProjectHandle.createWritable();
      await writable.write(text);
      await writable.close();
      updateProjectFileInfo(`Guardado: ${lastSavedProjectHandle.name}`);
      $("statusText").textContent = "Proyecto guardado.";
      return;
    }

    const wroteToUserFile = await writeWithFileSystemAccess(filename, text, "AventurIA Project", {
      "application/json": [".ave"]
    });

    if (!wroteToUserFile) {
      downloadTextFile(filename, text, "application/json");
      updateProjectFileInfo(`Descargado: ${filename}`);
    }

    $("statusText").textContent = "Proyecto guardado como .ave.";
  } catch (err) {
    if (err?.name === "AbortError") return;
    console.error(err);
    alert("No se pudo guardar el proyecto.");
  }
}

async function exportProjectJson() {
  if (!(await prepareProjectForDisk())) return;
  const text = JSON.stringify(compactProjectForStorage(state.project), null, 2);
  const filename = `${safeFileBaseName(state.project.name)}.json`;
  downloadTextFile(filename, text, "application/json");
  $("statusText").textContent = "Proyecto exportado como JSON.";
}

async function saveProjectJson() {
  // Compatibilidad con botones antiguos/scripts previos.
  return saveProjectAve({ saveAs: true });
}

function loadProject(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const raw = JSON.parse(reader.result);
      applyLoadedProject(raw, `Proyecto cargado: ${file.name}`);
    } catch (err) {
      console.error(err);
      alert("No se pudo cargar el proyecto. Comprueba que sea un .ave o .json válido.");
    }
  };
  reader.readAsText(file);
}
function readFilesAsAssets(files, kind) {
  const fileList = [...(files || [])];
  if (!fileList.length) return;

  let pending = fileList.length;

  fileList.forEach(file => {
    const reader = new FileReader();
    reader.onload = () => {
      const asset = kind === "image" && typeof addImageAssetToProject === "function"
        ? addImageAssetToProject(file.name, file.type, reader.result)
        : { id: uid(), name: file.name, type: file.type, dataUrl: reader.result };
      if (kind === "image") {
        if (typeof addImageAssetToProject !== "function") {
          state.project.assets.images ??= [];
          state.project.assets.images.push(asset);
        }
      }
      if (kind === "audio") {
        state.project.assets.audio ??= [];
        state.project.assets.audio.push(asset);
      }

      pending -= 1;
      if (pending <= 0) {
        renderAll();
        if (typeof renderProperties === "function") renderProperties();
      }
    };
    reader.readAsDataURL(file);
  });
}

function readAudioFilesAsAssets(files, onDone = null) {
  const fileList = [...(files || [])];
  if (!fileList.length) {
    if (onDone) onDone([]);
    return;
  }

  const added = [];
  let pending = fileList.length;

  fileList.forEach(file => {
    const reader = new FileReader();
    reader.onload = () => {
      const asset = { id: uid(), name: file.name, type: file.type, dataUrl: reader.result };
      state.project.assets.audio.push(asset);
      added.push(asset);
      pending -= 1;
      if (pending === 0) {
        renderAll();
        if (onDone) onDone(added);
      }
    };
    reader.readAsDataURL(file);
  });
}

function loadAssetForSelectedObject(file, kind) {
  const obj = selectedObject();
  if (!obj) {
    alert("Selecciona primero un objeto, player, fondo o hotspot.");
    return;
  }
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const asset = kind === "image" && typeof addImageAssetToProject === "function"
      ? addImageAssetToProject(file.name, file.type, reader.result)
      : { id: uid(), name: file.name, type: file.type, dataUrl: reader.result };
    if (kind === "image") {
      if (typeof addImageAssetToProject !== "function") {
        state.project.assets.images ??= [];
        state.project.assets.images.push(asset);
      }
      obj.imageId = asset.id;
      if (obj.type === "background") {
        obj.width = state.project.stage.width;
        obj.height = state.project.stage.height;
        obj.x = 0;
        obj.y = 0;
        obj.z = 0;
        obj.bgResize = obj.bgResize || "cover";
      }
    }
    if (kind === "audio") {
      state.project.assets.audio.push(asset);
      obj.audioId = asset.id;
    }
    renderAll();
    if (typeof renderProperties === "function") renderProperties();
    $("statusText").textContent = `${kind === "image" ? "Imagen" : "Audio"} cargado para ${obj.name}.`;
  };
  reader.readAsDataURL(file);
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveToDb() {
  await updateAllSceneThumbnails();
  renderScenes();
  if (state.mode === "play") {
    alert("Para guardar, pulsa Stop o vuelve a Editor. El modo Play es solo una evaluación temporal.");
    return;
  }
  const db = await openDb();
  const tx = db.transaction(DB_STORE, "readwrite");
  tx.objectStore(DB_STORE).put(compactProjectForStorage(state.project), DB_KEY);
  tx.oncomplete = () => showMessage("Proyecto guardado en BD local.");
  tx.onerror = () => showMessage("Error al guardar en BD local.");
}

async function loadFromDb() {
  const db = await openDb();
  const tx = db.transaction(DB_STORE, "readonly");
  const req = tx.objectStore(DB_STORE).get(DB_KEY);
  req.onsuccess = async () => {
    if (!req.result) {
      const loadedBundled = await loadBundledProject({ silent: true });
      if (!loadedBundled) showMessage("No hay proyecto guardado en BD local ni proyecto incluido.");
      return;
    }

    applyLoadedProject(req.result, "Proyecto cargado desde BD local del navegador.");
    showMessage("Proyecto cargado desde BD local.");
  };
  req.onerror = () => showMessage("Error al cargar BD local.");
}

function mouseButtonName(button) {
  if (button === 0) return "mouse:left";
  if (button === 1) return "mouse:middle";
  if (button === 2) return "mouse:right";
  return `mouse:${button}`;
}

function bindRuntimeInput() {
  window.addEventListener("keydown", e => {
    if (state.colliderEditor?.open) return;
    state.input.keys[e.code] = true;
    state.input.keys[e.key] = true;
    if (state.mode === "play") runLogicGraph(`input:keyDown`, null, { input: e.code });
  });

  window.addEventListener("keyup", e => {
    state.input.keys[e.code] = false;
    state.input.keys[e.key] = false;
    if (state.mode === "play") runLogicGraph(`input:keyUp`, null, { input: e.code });
  });

  els.stage.addEventListener("mousedown", e => {
    if (typeof retryPendingAudioUnlock === "function") retryPendingAudioUnlock();
    const btn = mouseButtonName(e.button);
    const p = stagePoint(e);
    state.input.mouse.buttons[btn] = true;
    state.input.mouse.x = p.x;
    state.input.mouse.y = p.y;
    if (state.mode === "play") runLogicGraph("input:mouseDown", null, { input: btn, point: p });
  });

  els.stage.addEventListener("mouseup", e => {
    const btn = mouseButtonName(e.button);
    state.input.mouse.buttons[btn] = false;
    if (state.mode === "play") runLogicGraph("input:mouseUp", null, { input: btn });
  });

  els.stage.addEventListener("mousemove", e => {
    const p = stagePoint(e);
    state.input.mouse.x = p.x;
    state.input.mouse.y = p.y;
    if (state.mode === "play") runLogicGraph("input:mouseMove", null, { input: "mouse:move" });
  });

  els.stage.addEventListener("click", e => {
    if (typeof retryPendingAudioUnlock === "function") retryPendingAudioUnlock();
    if (state.mode === "play") {
      const p = stagePoint(e);
      state.input.mouse.x = p.x;
      state.input.mouse.y = p.y;
      runLogicGraph("input:click", null, { input: "click", button: "mouse:left", point: p });
    }
  });
}

function evaluateHeldInputs() {
  if (state.mode !== "play") return;
  const scene = currentScene();
  if (!scene) return;
  scene.logic.nodes.forEach(n => {
    normalizeNodeType(n);
    if (n.category === "input" && n.type === "keyHeld" && (!n.input || state.input.keys[n.input])) {
      runLogicGraph("input:keyHeld", null, { input: n.input || "" });
    }
  });
}


function resetSpatialTriggersForObject(objectId) {
  Object.keys(state.spatialTriggerStates || {}).forEach(key => {
    if (key.includes(`:${objectId}`)) delete state.spatialTriggerStates[key];
  });
  Object.keys(state.spatialTriggerBlocked || {}).forEach(key => {
    if (key.includes(`:${objectId}`)) delete state.spatialTriggerBlocked[key];
  });
}




function findObjectInAnyScene(objectId) {
  for (const scene of state.project.scenes || []) {
    const obj = (scene.objects || []).find(o => o.id === objectId);
    if (obj) return { scene, obj };
  }
  return { scene: null, obj: null };
}

function cloneInventoryObjectForScene(sourceObj, point) {
  const scene = currentScene();
  if (!scene || !sourceObj) return null;
  const copy = deepClone(sourceObj);
  copy.id = uid();
  copy.name = uniqueObjectName(scene, sourceObj.name || "Item");
  copy.visible = true;
  copy.state = "default";
  copy.initialState = copy.initialState || "default";
  copy.inventorySourceId = sourceObj.inventorySourceId || sourceObj.inventoryKey || sourceObj.id;
  copy.inventoryKey = copy.inventorySourceId;
  copy.x = Math.round(point.x - copy.width * (copy.scale || 1) / 2);
  copy.y = Math.round(point.y - copy.height * (copy.scale || 1) / 2);
  scene.objects.push(copy);
  state.runtimeStates[copy.id] = "default";
  return copy;
}

function restoreInventoryObjectToScene(objectId, point) {
  const scene = currentScene();
  if (!scene) return false;

  const idx = state.inventory.indexOf(objectId);
  if (idx === -1) return false;

  let obj = scene.objects.find(o => o.id === objectId);

  if (obj) {
    obj.visible = true;
    obj.state = "default";
    obj.initialState = obj.initialState || "default";
    obj.x = Math.round(point.x - obj.width * (obj.scale || 1) / 2);
    obj.y = Math.round(point.y - obj.height * (obj.scale || 1) / 2);
    state.runtimeStates[obj.id] = "default";
  } else {
    const found = findObjectInAnyScene(objectId);
    if (!found.obj) return false;
    obj = cloneInventoryObjectForScene(found.obj, point);
    if (!obj) return false;
  }

  state.inventory.splice(idx, 1);
  state.selectedInventoryItemId = null;
  resetSpatialTriggersForObject(obj.id);

  clearSelection();
  state.selectedPanel = "object";
  state.selectedObjectId = obj.id;

  renderAll();
  evaluateSpatialTriggers();
  return true;
}
