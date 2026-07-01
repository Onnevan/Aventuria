// AventurIA v54 Modular Base — 02_scene_objects_assets.js
// Extraído de v53 funcional. Script clásico global; el orden de carga importa.

function baseObject(type, name) {
  const isBg = type === "background";
  return {
    id: uid(),
    name,
    type,
    x: 0,
    y: 0,
    width: isBg ? state.project.stage.width : type === "player" ? 90 : 160,
    height: isBg ? state.project.stage.height : type === "player" ? 150 : 160,
    scale: 1,
    rotation: 0,
    z: isBg ? 0 : type === "player" ? 200 : 100,
    speed: type === "player" ? 260 : 0,
    imageId: "",
    audioId: "",
    visible: true,
    states: [
      { id: uid(), name: "default", imageId: "", visible: true, interactable: true },
      { id: uid(), name: "hidden", imageId: "", visible: false, interactable: false }
    ],
    collectState: "hidden",
    inventoryImageId: "",
    physics: defaultObjectPhysics(),
    physicsAsMatterBody: false,
    pathBlocker: false,
    pathFootprint: typeof defaultPathFootprintForObject === "function" ? defaultPathFootprintForObject({ type, width: isBg ? state.project.stage.width : type === "player" ? 90 : 160, height: isBg ? state.project.stage.height : type === "player" ? 150 : 160 }) : null,
    usePathfinding: type === "player",
    navigationMode: type === "player" ? "pathfinding" : "",
    locked: false,
    action: type === "background" ? "none" : "none",
    message: "",
    targetSceneId: "",
    targetObjectId: "",
    requiresItemId: "",
    lockedMessage: "Necesitas otro objeto para hacer eso.",
    requireProximity: type !== "background",
    interactionDistance: 190,
    tooFarMessage: "Estás demasiado lejos.",
    useItemEnabled: false,
    useItemId: "",
    useItemMessage: "",
    useItemSetState: "",
    useItemRevealObjectId: "",
    useItemHideObjectId: "",
    useItemHideSelf: false,
    useItemGotoSceneId: "",
    useItemConsume: false,
    useItemFailMessage: "Eso no funciona.",
    initialState: "default",
    state: "default",
    parallaxLayer: 0,
    parallax: { enabled: false, x: 0, y: 0 },
    occlusion: typeof defaultObjectOcclusion === "function" ? defaultObjectOcclusion({ type }) : { enabled: type !== "background", mode: "footprint", depthMode: "inFront", offsetY: 0, onlyPlayers: true },
    bgResize: isBg ? "cover" : "cover",
    autoFlipX: type === "player",
    facing: 1,
    sprite:{enabled:false,frameWidth:isBg?state.project.stage.width:(type==="player"?90:160),frameHeight:isBg?state.project.stage.height:(type==="player"?150:160),columns:1,rows:1,fps:8,currentFrame:0,currentClip:"idle",playing:true,direction:1,moveClip:"run",stopClip:"idle",clips:{idle:{from:0,to:0,fps:8,mode:"loop"}}},
    collider: defaultColliderForObject({ type, width: isBg ? state.project.stage.width : type === "player" ? 90 : 160, height: isBg ? state.project.stage.height : type === "player" ? 150 : 160 }) 
  };
}

function addScene(name) {
  return createSceneEmergency(name || "");
}


function addObject(type = "prop") {
  let scene = currentScene();
  if (!scene) scene = createSceneEmergency("Escena 1");
  if (!scene) return;

  if (type === "player" && scene.objects.some(o => o.type === "player")) {
    alert("Esta escena ya tiene un player.");
    return;
  }

  const names = {
    player: "Player",
    background: "Fondo",
    hotspot: "Hotspot",
    prop: "Objeto"
  };

  pushUndoSnapshot?.(`Crear ${names[type] || "Objeto"}`);

  const obj = baseObject(type, names[type] || "Objeto");

  if (type === "background") {
    Object.assign(obj, {
      x: 0,
      y: 0,
      width: state.project.stage.width,
      height: state.project.stage.height,
      z: 0,
      bgResize: "cover",
      locked: false
    });
  } else if (type === "hotspot") {
    Object.assign(obj, { x: 520, y: 300, width: 180, height: 120, action: "message", message: "Aquí ocurre algo." });
  } else if (type === "player") {
    Object.assign(obj, { x: 595, y: 420 });
  } else {
    Object.assign(obj, { x: 560, y: 280 });
  }

  scene.objects.push(obj);
  clearSelection();
  state.selectedPanel = "object";
  state.selectedObjectId = obj.id;
  setTool("select");
  renderAll();
  $("statusText").textContent = `${obj.name} creado. Arrástralo en la escena para colocarlo.`;
}

function addObjectFromImage(assetId, x = 100, y = 100) {
  let scene = currentScene();
  if (!scene) scene = addScene("Escena 1");
  if (!scene) return;
  pushUndoSnapshot?.("Crear objeto desde imagen");
  const asset = imageAssetById(assetId);
  const obj = baseObject("prop", asset ? asset.name.replace(/\.[^/.]+$/, "") : "Objeto");
  Object.assign(obj, { x, y, imageId: assetId });
  scene.objects.push(obj);
  clearSelection();
  state.selectedPanel = "object";
  state.selectedObjectId = obj.id;
  updateColliderToolbarButton();
  renderAll();
}

function createObjectFromSelectedImage() {
  if (!state.selectedImageId) {
    alert("Primero selecciona una imagen en Assets.");
    return;
  }
  addObjectFromImage(state.selectedImageId, 560, 280);
  $("statusText").textContent = "Objeto creado desde imagen. Arrástralo en la escena.";
}

function assignImageToSelected() {
  const obj = selectedObject();
  if (!obj) {
    alert("Selecciona primero un objeto, player o fondo en la escena/outliner.");
    return;
  }
  if (!state.selectedImageId) {
    alert("Selecciona primero una imagen en Assets.");
    return;
  }
  pushUndoSnapshot?.(`Asignar imagen a ${obj.name}`);
  obj.imageId = state.selectedImageId;
  renderAll();
  $("statusText").textContent = `Imagen asignada a ${obj.name}.`;
}



function selectedObjectForColliderEditor() {
  let obj = findObjectByIdAnyScene(state.selectedObjectId);
  if (obj) return obj;

  obj = selectedObject?.();
  if (obj) return obj;

  const selectedEl = els.stage?.querySelector?.(".sceneObject.selected");
  const domId = selectedEl?.dataset?.id;
  if (domId) {
    obj = findObjectByIdAnyScene(domId);
    if (obj) {
      state.selectedObjectId = obj.id;
      state.selectedPanel = "object";
      return obj;
    }
  }

  return null;
}


function ensureColliderIconButton() {
  const btn = $("openColliderEditorBtn");
  if (!btn) return;
  btn.textContent = "▣";
  btn.title = "Editar collider";
  btn.setAttribute("aria-label", "Editar collider");
  btn.classList.add("iconToolBtn");
}

function updateColliderToolbarButton() {
  const btn = $("openColliderEditorBtn");
  const fpBtn = $("openFootprintEditorBtn");
  if (!btn) return;
  const obj = selectedObjectForColliderEditor();
  btn.disabled = false;
  btn.textContent = obj ? `Editar collider: ${obj.name}` : "Editar collider";
  if (fpBtn) {
    fpBtn.disabled = !obj || obj.type === "background";
    fpBtn.textContent = obj && obj.type !== "background" ? `Editar huella: ${obj.name}` : "Editar huella";
    fpBtn.title = obj && obj.type !== "background" ? `Editar huella de pathfinding: ${obj.name}` : "Editar huella de pathfinding";
  }

  ensureColliderIconButton();
}



function createSceneEmergency(name = "") {
  try {
    if (!state.project) {
      state.project = {
        schemaVersion: 3,
        name: "Nueva aventura",
        startSceneId: "",
        stage: { width: 1280, height: 720 },
        assets: { images: [], audio: [] },
        inventoryModel: { items: [] },
        inventorySettings: { slots: 8, iconImageId: "", iconWidth: 72, iconHeight: 72, slotSize: 72, position: "bottom-center", fullMessage: "El inventario está lleno." },
        splash: { enabled: false, imageId: "", audioId: "", durationMs: 2500, allowSkip: true },
        messageSettings: { position: "top", fontFamily: "Arial, sans-serif", fontSize: 18, color: "#ffffff", background: "#111111", backgroundAlpha: 0.85, borderRadius: 10, maxWidth: 80 },
        prefabs: [],
        mechanisms: [],
        database: { variables: {}, texts: {}, scenes: {}, objects: {}, actions: {} },
        scenes: []
      };
    }

    state.project.stage ??= { width: 1280, height: 720 };
    state.project.assets ??= { images: [], audio: [] };
    state.project.assets.images ??= [];
    state.project.assets.audio ??= [];
    state.project.scenes ??= [];

    const scene = {
      id: uid(),
      name: name || `Escena ${state.project.scenes.length + 1}`,
      navZones: [],
      parallaxStrength: 0.1,
      pathfinding: typeof defaultPathfindingSettings === "function"
        ? defaultPathfindingSettings()
        : { enabled: true, gridSize: 32, obstaclePadding: 12, diagonal: true, debug: false },
      logic: { nodes: [], links: [] },
      objects: []
    };

    state.project.scenes.push(scene);
    state.selectedSceneId = scene.id;
    state.selectedPanel = "scene";
    state.selectedObjectId = null;
    state.selectedZoneId = null;
    state.selectedZonePointIndex = null;
    state.selectedNodeId = null;
    state.selectedLinkId = null;
    state.drawingZone = null;
    state.project.startSceneId ||= scene.id;

    try { clearSelection?.(); } catch (_) {}
    try { renderAll?.(); } catch (err) {
      console.error("renderAll falló tras crear escena", err);
    }

    const status = $("statusText");
    if (status) status.textContent = `${scene.name} creada.`;
    return scene;
  } catch (err) {
    console.error("createSceneEmergency error", err);
    const box = $("jsErrorBox");
    if (box) {
      box.classList.remove("hidden");
      box.textContent = `Error al crear escena: ${err.message}`;
    }
    alert(`Error al crear escena: ${err.message}`);
    return null;
  }
}


function ensureSceneOneEmergency() {
  if (!state.project) return null;
  state.project.scenes ??= [];
  if (!state.project.scenes.length) return createSceneEmergency("Escena 1");
  if (!state.selectedSceneId || !state.project.scenes.some(s => s.id === state.selectedSceneId)) {
    state.selectedSceneId = state.project.scenes[0].id;
  }
  return currentScene?.() || state.project.scenes[0];
}
