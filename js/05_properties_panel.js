// AventurIA v54 Modular Base — 05_properties_panel.js
// Extraído de v53 funcional. Script clásico global; el orden de carga importa.



function ensurePathBlockerMemory() {
  state.pathBlockerMemory ??= {};
  return state.pathBlockerMemory;
}

function rememberPathBlocker(obj, value) {
  if (!obj?.id) return;
  const mem = ensurePathBlockerMemory();
  mem[obj.id] = value === true;
  obj.pathBlocker = value === true;
}

function applyPathBlockerMemory(project = state.project) {
  const mem = ensurePathBlockerMemory();
  project?.scenes?.forEach(scene => {
    scene.objects?.forEach(obj => {
      if (!obj?.id) return;
      if (obj.type === "background" || obj.type === "player") {
        obj.pathBlocker = false;
        mem[obj.id] = false;
        return;
      }
      if (Object.prototype.hasOwnProperty.call(mem, obj.id)) {
        obj.pathBlocker = mem[obj.id] === true;
      } else {
        mem[obj.id] = obj.pathBlocker === true;
      }
    });
  });
}

function syncPathBlockerFromPropertiesPanel() {
  const obj = selectedObject?.();
  const input = $("propPathBlocker");
  if (!obj || !input) return false;
  if (obj.type === "background" || obj.type === "player") {
    rememberPathBlocker(obj, false);
    input.checked = false;
    return true;
  }
  rememberPathBlocker(obj, input.checked === true);
  return true;
}


function updateWalkAnimationHint(obj) {
  const status = $("clipEditorStatus");
  if (!status || !obj?.sprite) return;

  const clips = obj.sprite.clips || {};
  const moveClip = obj.sprite.moveClip || "";
  const stopClip = obj.sprite.stopClip || "";

  if (moveClip && !clips[moveClip]) {
    status.textContent = `Aviso: la animación al moverse "${moveClip}" no existe como clip.`;
    status.classList.remove("ok");
    status.classList.add("warning");
    return;
  }

  if (stopClip && !clips[stopClip]) {
    status.textContent = `Aviso: la animación al parar "${stopClip}" no existe como clip.`;
    status.classList.remove("ok");
    status.classList.add("warning");
  }
}

function selectedAnythingForDelete() {
  return !!(selectedObject() || selectedZone() || selectedNode() || (typeof selectedLink === "function" && selectedLink()));
}

function updatePropertiesDeleteButton() {
  const wrap = $("propertiesDeleteActions");
  if (!wrap) return;
  wrap.classList.toggle("hidden", !selectedAnythingForDelete());
}





function syncSpriteFrameFromPropertiesPanel() {
  const obj = selectedObject();
  if (!obj) return false;
  ensureSpriteConfig(obj);

  const spriteEnabledEl = $("propSpriteEnabled");
  const imageEl = $("propSpriteImage");
  const fwEl = $("propFrameW");
  const fhEl = $("propFrameH");
  const colsEl = $("propSpriteCols");
  const rowsEl = $("propSpriteRows");
  const fpsEl = $("propSpriteFps");
  const frameEl = $("propSpriteFrame");

  if (spriteEnabledEl) obj.sprite.enabled = spriteEnabledEl.checked === true;
  if (imageEl && imageEl.value !== undefined) obj.imageId = imageEl.value || obj.imageId || "";

  const fw = Math.max(1, Number(fwEl?.value || obj.sprite.frameWidth || obj.width || 64));
  const fh = Math.max(1, Number(fhEl?.value || obj.sprite.frameHeight || obj.height || 64));

  obj.sprite.frameWidth = fw;
  obj.sprite.frameHeight = fh;
  obj.sprite.columns = Math.max(1, Number(colsEl?.value || obj.sprite.columns || 1));
  obj.sprite.rows = Math.max(1, Number(rowsEl?.value || obj.sprite.rows || 1));
  obj.sprite.fps = Math.max(1, Number(fpsEl?.value || obj.sprite.fps || 8));
  obj.sprite.currentFrame = Math.max(0, Number(frameEl?.value || obj.sprite.currentFrame || 0));

  obj.width = fw;
  obj.height = fh;

  if ($("propW")) $("propW").value = fw;
  if ($("propH")) $("propH").value = fh;
  if (typeof normalizePathFootprint === "function") normalizePathFootprint(obj);
  if (typeof normalizeCollider === "function") normalizeCollider(obj);
  return true;
}

function persistSpriteFrameEdit(obj) {
  if (!obj) return;
  syncObjectSizeFromSpriteFrame(obj);
  if (typeof renderStage === "function") renderStage();
  if (typeof updateClipEditorValidation === "function") updateClipEditorValidation(obj);
}


function syncObjectSizeFromSpriteFrame(obj) {
  if (!obj?.sprite) return;
  const fw = Math.max(1, Number(obj.sprite.frameWidth || obj.width || 64));
  const fh = Math.max(1, Number(obj.sprite.frameHeight || obj.height || 64));
  obj.sprite.frameWidth = fw;
  obj.sprite.frameHeight = fh;
  obj.width = fw;
  obj.height = fh;
  if ($("propW")) $("propW").value = fw;
  if ($("propH")) $("propH").value = fh;
  if ($("propFrameW")) $("propFrameW").value = fw;
  if ($("propFrameH")) $("propFrameH").value = fh;
  if (typeof normalizePathFootprint === "function") normalizePathFootprint(obj);
  if (typeof normalizeCollider === "function") normalizeCollider(obj);
}


function selectedObjectImageAsset(obj) {
  if (!obj?.imageId) return null;
  return imageAssetById(obj.imageId);
}


function ensureSpriteImageDimensionsThen(obj, callback) {
  const asset = selectedObjectImageAsset(obj);
  if (!asset) {
    callback?.(null);
    return;
  }
  if (Number(asset.width || 0) > 0 && Number(asset.height || 0) > 0) {
    callback?.(asset);
    return;
  }
  if (typeof ensureImageAssetDimensions === "function") {
    ensureImageAssetDimensions(asset, () => {
      callback?.(asset);
    });
    return;
  }
  callback?.(asset);
}

function applySpriteImageToSelectedObject(imageId) {
  const obj = selectedObject();
  if (!obj) return;
  obj.imageId = imageId || "";
  ensureSpriteConfig(obj);
  if (imageId) obj.sprite.enabled = true;
  if ($("propImage")) $("propImage").value = obj.imageId || "";
  if ($("propSpriteImage")) $("propSpriteImage").value = obj.imageId || "";

  const asset = selectedObjectImageAsset(obj);
  if (asset && typeof ensureImageAssetDimensions === "function") {
    ensureImageAssetDimensions(asset, () => {
      updateSpriteAutoFrameStatus(obj);
      renderProperties();
    });
  }

  updateSpriteAutoFrameStatus(obj);
  renderStage();
  renderProperties();
}


function spriteSheetImageSize(obj) {
  const asset = selectedObjectImageAsset(obj);
  if (!asset) return null;
  const width = Number(asset.width || asset.naturalWidth || asset.w || 0);
  const height = Number(asset.height || asset.naturalHeight || asset.h || 0);
  if (width > 0 && height > 0) return { width, height, asset };
  return null;
}

function ensureSpriteConfig(obj) {
  if (!obj) return null;
  obj.sprite ??= {enabled:false,frameWidth:obj.width||64,frameHeight:obj.height||64,columns:1,rows:1,fps:8,currentFrame:0,currentClip:"idle",playing:true,direction:1,moveClip:"run",stopClip:"idle",clips:{idle:{from:0,to:0,fps:8,mode:"loop"}}};
  obj.sprite.columns = Math.max(1, Number(obj.sprite.columns || 1));
  obj.sprite.rows = Math.max(1, Number(obj.sprite.rows || 1));
  return obj.sprite;
}


function readImageSizeDirectly(asset, callback) {
  if (!asset || !(asset.dataUrl || asset.src)) {
    callback?.(null);
    return;
  }

  const img = new Image();
  img.onload = () => {
    const width = img.naturalWidth || img.width || 0;
    const height = img.naturalHeight || img.height || 0;
    if (width > 0 && height > 0) {
      asset.width = width;
      asset.height = height;
      asset.src = asset.src || asset.dataUrl;
      callback?.({ width, height, asset });
    } else {
      callback?.(null);
    }
  };
  img.onerror = () => callback?.(null);
  img.src = asset.dataUrl || asset.src;
}

function applyCalculatedSpriteFrameSize(obj, imageWidth, imageHeight, { updateFields = true, fitObject = true } = {}) {
  if (!obj) return null;
  const sprite = ensureSpriteConfig(obj);
  const status = $("spriteAutoFrameStatus");

  const cols = Math.max(1, Number($("propSpriteCols")?.value || sprite.columns || 1));
  const rows = Math.max(1, Number($("propSpriteRows")?.value || sprite.rows || 1));

  const exactW = Number(imageWidth) / cols;
  const exactH = Number(imageHeight) / rows;
  const frameW = Math.max(1, Math.round(exactW));
  const frameH = Math.max(1, Math.round(exactH));

  sprite.enabled = true;
  sprite.columns = cols;
  sprite.rows = rows;
  sprite.frameWidth = frameW;
  sprite.frameHeight = frameH;

  if (fitObject !== false) {
    obj.sprite.frameWidth = frameW;
    obj.sprite.frameHeight = frameH;
    syncObjectSizeFromSpriteFrame(obj);
  }

  if (updateFields) {
    if ($("propSpriteEnabled")) $("propSpriteEnabled").checked = true;
    if ($("propFrameW")) $("propFrameW").value = frameW;
    if ($("propFrameH")) $("propFrameH").value = frameH;
    if ($("propSpriteCols")) $("propSpriteCols").value = cols;
    if ($("propSpriteRows")) $("propSpriteRows").value = rows;
    if ($("propW")) $("propW").value = obj.width;
    if ($("propH")) $("propH").value = obj.height;
  }

  if (status) {
    const rounded = (Number.isInteger(exactW) && Number.isInteger(exactH))
      ? ""
      : ` · redondeado desde ${exactW.toFixed(2)} × ${exactH.toFixed(2)}`;
    status.textContent = `Frame aplicado: ${frameW} × ${frameH}px. Objeto: ${obj.width} × ${obj.height}px. Imagen ${imageWidth} × ${imageHeight}px / ${cols}×${rows}${rounded}.`;
    status.classList.remove("warning");
    status.classList.add("ok");
  }

  updateClipEditorValidation(obj);
  renderStage();
  return { frameWidth: frameW, frameHeight: frameH, imageWidth, imageHeight, columns: cols, rows };
}


function calculateSpriteFrameSizeFromImage(obj, { updateFields = true, fitObject = true } = {}) {
  const status = $("spriteAutoFrameStatus");
  if (!obj) return null;

  const sprite = ensureSpriteConfig(obj);
  const asset = selectedObjectImageAsset(obj);

  if (!asset) {
    if (status) {
      status.textContent = "No se puede calcular: selecciona una imagen spritesheet en el desplegable.";
      status.classList.remove("ok");
      status.classList.add("warning");
    }
    return null;
  }

  const savedW = Number(asset.width || asset.naturalWidth || asset.w || 0);
  const savedH = Number(asset.height || asset.naturalHeight || asset.h || 0);
  if (savedW > 0 && savedH > 0) {
    return applyCalculatedSpriteFrameSize(obj, savedW, savedH, { updateFields, fitObject });
  }

  if (asset.dataUrl || asset.src) {
    if (status) {
      status.textContent = "Leyendo resolución real de la imagen…";
      status.classList.remove("ok");
      status.classList.add("warning");
    }

    readImageSizeDirectly(asset, info => {
      if (!info) {
        if (status) {
          status.textContent = "No se pudo leer la resolución de la imagen.";
          status.classList.remove("ok");
          status.classList.add("warning");
        }
        return;
      }

      applyCalculatedSpriteFrameSize(obj, info.width, info.height, { updateFields, fitObject });
      renderProperties();
    });

    return null;
  }

  if (status) {
    status.textContent = "No se puede calcular: el asset no contiene datos de imagen.";
    status.classList.remove("ok");
    status.classList.add("warning");
  }
  return null;
}



function updateSpriteAutoFrameStatus(obj) {
  const status = $("spriteAutoFrameStatus");
  if (!status) return;
  if (!obj) {
    status.textContent = "";
    return;
  }
  const info = spriteSheetImageSize(obj);
  const sprite = ensureSpriteConfig(obj);
  if (!info) {
    status.textContent = "Selecciona una imagen con resolución para calcular frames automáticamente.";
    status.classList.remove("ok");
    status.classList.add("warning");
    return;
  }
  const cols = Math.max(1, Number(sprite.columns || 1));
  const rows = Math.max(1, Number(sprite.rows || 1));
  status.textContent = `Imagen: ${info.width} × ${info.height}px. Con ${cols} col. × ${rows} filas → frame ${Math.round(info.width / cols)} × ${Math.round(info.height / rows)}px.`;
  status.classList.remove("warning");
  status.classList.add("ok");
}


function spriteTotalFrames(obj) {
  const s = obj?.sprite;
  if (!s) return 1;
  return Math.max(1, Number(s.columns || 1) * Number(s.rows || 1));
}

function currentClipDraftFromEditor(obj) {
  const from = Math.max(0, Number($("clipEditFrom")?.value) || 0);
  const to = Math.max(from, Number($("clipEditTo")?.value) || from);
  const fps = Math.max(1, Number($("clipEditFps")?.value) || 8);
  const mode = $("clipEditMode")?.value || "loop";
  const name = ($("clipEditName")?.value || "").trim();
  return { name, from, to, fps, mode };
}

function updateClipEditorValidation(obj) {
  const status = $("clipEditorStatus");
  if (!status || !obj?.sprite) return;

  const { name, from, to } = currentClipDraftFromEditor(obj);
  const total = spriteTotalFrames(obj);

  status.classList.remove("warning", "ok");

  if (!name) {
    status.textContent = "El clip necesita un nombre.";
    status.classList.add("warning");
    return;
  }

  if (to >= total) {
    status.textContent = `Aviso: el clip "${name}" usa frames ${from}-${to}, pero la spritesheet solo tiene ${total} frame(s). Aumenta Columnas/Filas o pulsa “Ajustar columnas al clip”.`;
    status.classList.add("warning");
    return;
  }

  status.textContent = `Clip "${name}" válido. Frames ${from}-${to} dentro de ${total} frame(s).`;
  status.classList.add("ok");
}

function fitSpriteGridToCurrentClip() {
  const obj = selectedObject();
  if (!obj?.sprite) return;

  const { to } = currentClipDraftFromEditor(obj);
  const needed = Math.max(1, to + 1);

  // Asumimos distribución horizontal, que es el caso más habitual.
  obj.sprite.columns = needed;
  obj.sprite.rows = 1;

  $("propSpriteCols").value = obj.sprite.columns;
  $("propSpriteRows").value = obj.sprite.rows;

  updateClipEditorValidation(obj);
  renderStage();
}

function renderClipVisualEditor(obj) {
  if (!obj?.sprite || !$("clipEditSelect")) return;
  obj.sprite.clips ??= { idle: { from: 0, to: 0, fps: 8, mode: "loop" } };

  const names = Object.keys(obj.sprite.clips);
  fillSelect($("clipEditSelect"), names.map(name => ({ id: name, name })), "Sin clip");
  const active = obj.sprite.currentClip && obj.sprite.clips[obj.sprite.currentClip] ? obj.sprite.currentClip : names[0] || "";
  $("clipEditSelect").value = active;

  const clip = obj.sprite.clips[active] || { from: 0, to: 0, fps: 8, mode: "loop" };
  $("clipEditName").value = active || "";
  $("clipEditFrom").value = clip.from ?? 0;
  $("clipEditTo").value = clip.to ?? clip.from ?? 0;
  $("clipEditFps").value = clip.fps ?? obj.sprite.fps ?? 8;
  $("clipEditMode").value = clip.mode || (clip.loop ? "loop" : "once");
  updateClipEditorValidation(obj);
}

function applyClipVisualEditor() {
  const obj = selectedObject();
  if (!obj?.sprite) return;
  obj.sprite.clips ??= {};

  const oldName = $("clipEditSelect")?.value || "";
  const name = ($("clipEditName")?.value || "").trim();
  if (!name) {
    alert("El clip necesita un nombre, por ejemplo: run");
    return;
  }

  const from = Math.max(0, Number($("clipEditFrom")?.value) || 0);
  const to = Math.max(from, Number($("clipEditTo")?.value) || from);
  const fps = Math.max(1, Number($("clipEditFps")?.value) || 8);
  const mode = $("clipEditMode")?.value || "loop";

  if (oldName && oldName !== name && obj.sprite.clips[oldName]) delete obj.sprite.clips[oldName];

  const total = spriteTotalFrames(obj);
  if (to >= total) {
    alert(`El clip "${name}" usa frames ${from}-${to}, pero la spritesheet solo tiene ${total} frame(s). La animación no se verá completa hasta aumentar Columnas/Filas.`);
  }

  obj.sprite.clips[name] = { from, to, fps, mode };
  obj.sprite.currentClip = name;
  $("propSpriteClips").value = JSON.stringify(obj.sprite.clips, null, 2);
  renderAll();
}

function deleteCurrentClipFromVisualEditor() {
  const obj = selectedObject();
  if (!obj?.sprite?.clips) return;
  const name = $("clipEditSelect")?.value;
  if (!name) return;
  if (Object.keys(obj.sprite.clips).length <= 1) {
    alert("Debe quedar al menos un clip.");
    return;
  }
  delete obj.sprite.clips[name];
  obj.sprite.currentClip = Object.keys(obj.sprite.clips)[0] || "";
  $("propSpriteClips").value = JSON.stringify(obj.sprite.clips, null, 2);
  renderAll();
}

function createClipFromVisualEditor() {
  const obj = selectedObject();
  if (!obj?.sprite) return;

  obj.sprite.clips ??= {};

  const suggested = `clip_${Object.keys(obj.sprite.clips).length + 1}`;
  const rawName = prompt("Nombre del nuevo clip:", suggested);
  const name = (rawName || "").trim();

  if (!name) return;

  if (obj.sprite.clips[name] && !confirm(`Ya existe un clip llamado "${name}". ¿Sobrescribirlo?`)) {
    return;
  }

  const start = Math.max(0, Number(obj.sprite.currentFrame || 0));
  const to = Math.max(start, start + 5);
  obj.sprite.clips[name] = {
    from: start,
    to,
    fps: Math.max(8, Number(obj.sprite.fps || 8)),
    mode: "loop"
  };

  if (to >= spriteTotalFrames(obj)) {
    obj.sprite.columns = to + 1;
    obj.sprite.rows = 1;
  }

  obj.sprite.currentClip = name;
  $("propSpriteClips").value = JSON.stringify(obj.sprite.clips, null, 2);
  renderAll();
}


function globalInventoryItemObjects() {
  const items = [];
  const seenKeys = new Set();

  (state.project?.scenes || []).forEach(scene => {
    (scene.objects || []).forEach(obj => {
      const isInventoryCandidate = obj.type === "item" || obj.action === "pickup";
      if (!isInventoryCandidate) return;

      const key = obj.inventoryKey || obj.inventorySourceId || obj.id;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);

      items.push({
        ...obj,
        name: `${obj.name} (${scene.name})`
      });
    });
  });

  return items;
}


function setupPropertiesAccordions() {
  const containers = ["sceneProps", "props", "zoneProps", "nodeProps"];
  containers.forEach(containerId => {
    const root = $(containerId);
    if (!root || root.dataset.accordionReady === "1") return;
    root.dataset.accordionReady = "1";

    // Secciones explícitas: bloques internos con h3.
    [...root.querySelectorAll(":scope > .props, :scope > div[id$='Props'], :scope > #spriteProps, :scope > #backgroundProps")].forEach((section, index) => {
      const titleEl = section.querySelector(":scope > h2, :scope > h3, :scope > h4");
      if (!titleEl || section.classList.contains("accordionSection")) return;
      section.classList.add("accordionSection", "collapsed");
      const title = titleEl.textContent.trim() || `Sección ${index + 1}`;
      const body = document.createElement("div");
      body.className = "accordionBody";
      while (titleEl.nextSibling) body.appendChild(titleEl.nextSibling);
      const header = document.createElement("button");
      header.type = "button";
      header.className = "accordionHeader";
      header.textContent = title;
      titleEl.replaceWith(header);
      section.appendChild(body);
      header.addEventListener("click", e => {
        e.preventDefault();
        section.classList.toggle("collapsed");
      });
    });

    // Si es el panel de objeto, agrupa los controles básicos iniciales.
    if (containerId === "props" && !root.querySelector(".basicAccordionSection")) {
      const firstBlock = document.createElement("div");
      firstBlock.className = "accordionSection basicAccordionSection collapsed";
      const header = document.createElement("button");
      header.type = "button";
      header.className = "accordionHeader";
      header.textContent = "Transformación / imagen";
      const body = document.createElement("div");
      body.className = "accordionBody";

      const stopBefore = root.querySelector("#spriteProps");
      const nodes = [];
      let node = root.firstChild;
      while (node && node !== stopBefore) {
        const next = node.nextSibling;
        nodes.push(node);
        node = next;
      }
      nodes.forEach(n => body.appendChild(n));
      firstBlock.appendChild(header);
      firstBlock.appendChild(body);
      root.insertBefore(firstBlock, stopBefore || root.firstChild);
      header.addEventListener("click", e => {
        e.preventDefault();
        firstBlock.classList.toggle("collapsed");
      });
    }
  });
}


function renderProperties() {
  setTimeout(() => setupPropertiesAccordions(), 0);
  const objectId = firstExistingId(["props", "objectProps", "objectPanel"]);
  const zoneId = firstExistingId(["zoneProps", "zonePanel"]);
  const nodeId = firstExistingId(["nodeProps", "nodePanel"]);
  const linkId = firstExistingId(["linkProps", "linkPanel"]);
  const sceneId = firstExistingId(["sceneProps"]);
  const emptyId = firstExistingId(["emptyProps"]);

  [objectId, zoneId, nodeId, linkId, sceneId, emptyId].filter(Boolean).forEach(hideIfExists);

  const obj = selectedObject();
  if (obj && objectId) {
    showIfExists(objectId);
    renderObjectProps(obj);
    updatePropertiesDeleteButton();
    return;
  }

  const zone = selectedZone();
  if (zone && zoneId) {
    showIfExists(zoneId);
    renderZoneProps(zone);
    updatePropertiesDeleteButton();
    return;
  }

  const node = selectedNode();
  if (node && nodeId) {
    showIfExists(nodeId);
    renderNodeProps(node);
    updatePropertiesDeleteButton();
    return;
  }

  const link = typeof selectedLink === "function" ? selectedLink() : null;
  if (link && linkId && typeof renderLinkProps === "function") {
    showIfExists(linkId);
    renderLinkProps(link);
    updatePropertiesDeleteButton();
    return;
  }

  if (state.selectedPanel === "scene" && currentScene() && sceneId) {
    showIfExists(sceneId);
    renderSceneProps();
    updatePropertiesDeleteButton();
    return;
  }

  if (emptyId) showIfExists(emptyId);
  updatePropertiesDeleteButton();
}

function renderSceneProps() {
  const scene = currentScene();
  if (!scene || !$("sceneProps")) return;
  $("scenePropName").value = scene.name || "";
  $("sceneParallaxStrength").value = scene.parallaxStrength ?? 1;
  scene.camera ??= { enabled: false, followPlayer: false };
  if ($("sceneCameraEnabled")) $("sceneCameraEnabled").checked = !!scene.camera.enabled;

  
  if ($("scenePathfindingEnabled")) {
    const pf = normalizePathfindingSettings(scene);
    $("scenePathfindingEnabled").checked = !!pf.enabled;
    $("scenePathfindingGridSize").value = pf.gridSize ?? 32;
    $("scenePathfindingPadding").value = pf.obstaclePadding ?? 14;
    $("scenePathfindingDiagonal").checked = pf.diagonal !== false;
    $("scenePathfindingDebug").checked = !!pf.debug;
  }

  if ($("scenePhysicsEnabled")) {
    const ph = normalizeScenePhysics(scene);
    $("scenePhysicsEnabled").checked = !!ph.enabled;
    $("scenePhysicsGravityX").value = ph.gravityX ?? 0;
    $("scenePhysicsGravityY").value = ph.gravityY ?? 900;
    $("scenePhysicsTimeScale").value = ph.timeScale ?? 1;
    $("scenePhysicsBounds").checked = ph.worldBounds !== false;
    $("scenePhysicsResetOnEnter").checked = ph.resetOnEnter !== false;
    $("scenePhysicsDebug").checked = !!ph.debug;

    if ($("scenePhysicsDomainObjectId")) {
      const domainCandidates = (scene.objects || [])
        .filter(o => o.type !== "background")
        .map(o => ({ id: o.id, name: `${o.name} · ${o.type}` }));
      fillSelect($("scenePhysicsDomainObjectId"), domainCandidates, "Toda la escena");
      $("scenePhysicsDomainObjectId").value = ph.domainObjectId || "";
    }
  }
}




function imageAssetsForCurrentSceneDropdown() {
  const byId = new Map();

  function add(asset) {
    if (!asset?.id || byId.has(asset.id)) return;
    byId.set(asset.id, {
      id: asset.id,
      name: asset.name || asset.id,
      dataUrl: asset.dataUrl || asset.src || ""
    });
  }

  const projectImages = typeof imageAssetOptionsForSelect === "function"
    ? imageAssetOptionsForSelect()
    : (state.project?.assets?.images || []);

  projectImages.forEach(asset => add(asset));

  // Referencias usadas por objetos/estados/inventario, por compatibilidad con proyectos antiguos.
  const scene = currentScene();
  scene?.objects?.forEach(obj => {
    [obj.imageId, obj.inventoryImageId].forEach(id => {
      if (!id) return;
      const asset = imageAssetById(id);
      add(asset || { id, name: `${obj.name || "Objeto"} · imagen asignada` });
    });
    (obj.states || []).forEach(st => {
      if (!st?.imageId) return;
      const asset = imageAssetById(st.imageId);
      add(asset || { id: st.imageId, name: `${obj.name || "Objeto"} · ${st.name || "estado"}` });
    });
  });

  return [...byId.values()].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
}


function fillImageAssetSelect(select, emptyText = "Sin imagen", currentValue = "") {
  if (!select) return [];

  const items = imageAssetsForCurrentSceneDropdown();
  select.innerHTML = "";

  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = emptyText;
  select.appendChild(empty);

  items.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = item.name || item.id;
    select.appendChild(opt);
  });

  if (currentValue && !items.some(item => item.id === currentValue)) {
    const missing = document.createElement("option");
    missing.value = currentValue;
    missing.textContent = `Imagen asignada no encontrada (${String(currentValue).slice(0, 8)})`;
    select.appendChild(missing);
  }

  select.value = currentValue || "";

  const infoId = select.id === "propImage" ? "propImageListInfo" : "";
  if (infoId && $(infoId)) {
    const realAssets = state.project?.assets?.images?.length || 0;
    $(infoId).textContent = items.length
      ? `${items.length} imagen${items.length === 1 ? "" : "es"} disponible${items.length === 1 ? "" : "s"} · assets embebidos: ${realAssets}.`
      : "No hay imágenes embebidas en el proyecto. Usa Assets > Importar imágenes o Cargar imagen para este objeto.";
  }

  return items;
}





function stateItemsForObject(obj) {
  normalizeObjectStates(obj);
  return obj.states.map(st => ({ id: st.name, name: st.name }));
}

function selectedStateForObjectEditor(obj) {
  normalizeObjectStates(obj);
  const wanted = obj._stateEditorSelected || obj.state || obj.initialState || "default";
  return obj.states.find(st => st.name === wanted) || obj.states[0];
}

function renderObjectStateEditor(obj) {
  if (!obj || !$("propStateSelect")) return;
  normalizeObjectStates(obj);

  fillSelect($("propInitialState"), stateItemsForObject(obj), "Estado inicial");
  $("propInitialState").value = obj.initialState || "default";

  fillSelect($("propCollectState"), stateItemsForObject(obj), "Estado al recoger");
  $("propCollectState").value = obj.collectState || "hidden";

  fillImageAssetSelect($("propInventoryImage"), "Usar imagen principal", obj.inventoryImageId || "");

  fillSelect($("propStateSelect"), stateItemsForObject(obj), "Estado");
  const st = selectedStateForObjectEditor(obj);
  $("propStateSelect").value = st?.name || "";

  if ($("propStateName")) $("propStateName").value = st?.name || "";
  if ($("propStateImage")) {
    fillImageAssetSelect($("propStateImage"), "Usar imagen principal del objeto", st?.imageId || "");
  }
  if ($("propStateVisible")) $("propStateVisible").checked = st?.visible !== false;
  if ($("propStateInteractable")) $("propStateInteractable").checked = st?.interactable !== false;
}

function currentEditedObjectState() {
  const obj = selectedObject();
  if (!obj) return null;
  normalizeObjectStates(obj);
  const name = $("propStateSelect")?.value || obj._stateEditorSelected || obj.initialState || "default";
  return obj.states.find(st => st.name === name) || obj.states[0] || null;
}



function renderObjectPhysicsProps(obj) {
  if (!obj || !$("propPhysicsEnabled")) return;
  const ph = normalizeObjectPhysics(obj);

  const isAdventurePlayer = obj.type === "player" && !obj.physicsAsMatterBody;
  if (isAdventurePlayer) {
    ph.enabled = false;
    obj.pathBlocker = false;
  }

  if ($("propPhysicsObjectInfo")) {
    $("propPhysicsObjectInfo").textContent = isAdventurePlayer
      ? `Player controlado por pathfinding: Matter.js desactivado y no bloquea navegación.`
      : `Ajustes físicos propios de: ${obj.name} (${obj.id}). No son globales.`;
  }

  $("propPhysicsEnabled").checked = !!ph.enabled;
  $("propPhysicsEnabled").disabled = !!isAdventurePlayer;
  $("propPhysicsBodyType").value = ph.bodyType || "dynamic";
  $("propPhysicsShape").value = ph.shape || "box";
  $("propPhysicsMass").value = ph.mass ?? 1;
  $("propPhysicsDensity").value = ph.density ?? 0.001;
  $("propPhysicsFriction").value = ph.friction ?? 0.2;
  $("propPhysicsRestitution").value = ph.restitution ?? 0.1;
  $("propPhysicsLockRotation").checked = !!ph.lockRotation;
  $("propPhysicsStartSleeping").checked = !!ph.startSleeping;
}


function renderObjectProps(obj) {
  const scene = currentScene();

  $("propName").value = obj.name;
  if (obj.type === "player") {
    obj.usePathfinding = obj.usePathfinding !== false;
    obj.navigationMode = "pathfinding";
    if ($("statusText")) $("statusText").textContent = "Player: navegación por pathfinding global.";
  }
  $("propType").value = obj.type;
  $("propX").value = Math.round(obj.x);
  $("propY").value = Math.round(obj.y);
  $("propScale").value = obj.scale;
  $("propRotation").value = obj.rotation;
  $("propW").value = obj.width;
  $("propH").value = obj.height;
  $("propZ").value = obj.z ?? 0;
  $("propSpeed").value = obj.speed ?? 0;
  $("propVisible").checked = obj.visible;
  $("propLocked").checked = obj.locked;
  if ($("propPathBlocker")) {
    applyPathBlockerMemory();
    obj.pathBlocker = obj.type === "background" || obj.type === "player" ? false : obj.pathBlocker === true;
    $("propPathBlocker").checked = obj.pathBlocker === true;
    $("propPathBlocker").disabled = obj.type === "player" || obj.type === "background";
  }
  $("propAction").value = obj.action;
  $("propMessage").value = obj.message || "";
  $("propLockedMessage").value = obj.lockedMessage || "";
  renderObjectStateEditor(obj);
  renderObjectPhysicsProps(obj);
  obj.parallaxLayer = typeof normalizeParallaxLayer === "function" ? normalizeParallaxLayer(obj.parallaxLayer) : 0;
  $("propParallaxLayer").value = String(obj.parallaxLayer);
  const occ = typeof ensureOcclusionConfig === "function" ? ensureOcclusionConfig(obj) : (obj.occlusion ??= { enabled: obj.type !== "background", mode: "footprint", depthMode: "footprintBottom", offsetY: 0, onlyPlayers: true });
  if ($("propOcclusionEnabled")) {
    $("propOcclusionEnabled").checked = !!occ.enabled;
    $("propOcclusionEnabled").disabled = obj.type === "background";
  }
  if ($("propOcclusionMode")) $("propOcclusionMode").value = occ.mode || "footprint";
  if ($("propOcclusionOffsetY")) $("propOcclusionOffsetY").value = Number(occ.offsetY || 0);
  normalizeCollider(obj);
  if ($("propColliderEnabled")) {
    $("propColliderEnabled").checked = !!obj.collider.enabled;
    $("propColliderEnabled").disabled = obj.type === "player";
    $("propColliderEnabled").title = obj.type === "player"
      ? "No se puede desactivar porque es necesario para interactuar con otros objetos."
      : "";
  }
  if ($("propShowCollider")) $("propShowCollider").checked = !!obj.collider.visible;
  if ($("propColliderType")) {
    const ctype = obj.collider.type === "polygon" ? ((obj.collider.points || []).length === 3 ? "triangle" : (obj.collider.points || []).length === 4 ? "quad" : "polygon") : obj.collider.type;
    $("propColliderType").value = ctype;
  }

  $("backgroundProps").classList.toggle("hidden", obj.type !== "background");
  if ($("propBgResize")) $("propBgResize").value = obj.bgResize || "cover";

  obj.sprite ??= {enabled:false,frameWidth:obj.width||64,frameHeight:obj.height||64,columns:1,rows:1,fps:8,currentFrame:0,currentClip:"idle",playing:true,direction:1,moveClip:"run",stopClip:"idle",clips:{idle:{from:0,to:0,fps:8,mode:"loop"}}};
  $("propAutoFlipX").checked = !!obj.autoFlipX;
  $("propSpriteEnabled").checked = !!obj.sprite.enabled;
  $("propFrameW").value = obj.sprite.frameWidth || obj.width || 64;
  $("propFrameH").value = obj.sprite.frameHeight || obj.height || 64;
  $("propSpriteCols").value = obj.sprite.columns || 1;
  $("propSpriteRows").value = obj.sprite.rows || 1;
  $("propSpriteFps").value = obj.sprite.fps || 8;
  $("propSpriteFrame").value = obj.sprite.currentFrame || 0;
  $("propSpriteClips").value = JSON.stringify(obj.sprite.clips || {}, null, 2);
  updateSpriteAutoFrameStatus(obj);
  const clipItems = spriteClipNames(obj).map(name => ({ id: name, name }));
  fillSelect($("propSpriteClip"), clipItems, "Sin clip");
  $("propSpriteClip").value = obj.sprite.currentClip || "";
  fillSelect($("propMoveClip"), clipItems, "Sin clip");
  $("propMoveClip").value = obj.sprite.moveClip || "";
  fillSelect($("propStopClip"), clipItems, "Sin clip");
  $("propStopClip").value = obj.sprite.stopClip || "";
  renderClipVisualEditor(obj);
  updateWalkAnimationHint(obj);

  $("propParallaxEnabled").checked = !!obj.parallax?.enabled;
  $("propParallaxX").value = obj.parallax?.x ?? 0;
  $("propParallaxY").value = obj.parallax?.y ?? 0;

  fillImageAssetSelect($("propImage"), "Sin imagen", obj.imageId || "");
  if ($("propSpriteImage")) {
    fillImageAssetSelect($("propSpriteImage"), "Seleccionar imagen spritesheet", obj.imageId || "");
    $("propSpriteImage").value = obj.imageId || "";
  }
  if ($("propSpriteImageInfo")) {
    const asset = selectedObjectImageAsset(obj);
    $("propSpriteImageInfo").textContent = asset
      ? `Spritesheet: ${asset.name || asset.id}${asset.width && asset.height ? ` · ${asset.width}×${asset.height}px` : ""}`
      : "Selecciona una imagen para calcular el tamaño de frame.";
  }

  fillSelect($("propAudio"), state.project.assets.audio, "Sin audio");
  $("propAudio").value = obj.audioId || "";

  fillSelect($("propTargetScene"), state.project.scenes, "Sin destino");
  $("propTargetScene").value = obj.targetSceneId || "";

  fillSelect($("propTargetObject"), scene.objects.filter(o => o.id !== obj.id), "Sin objeto");
  $("propTargetObject").value = obj.targetObjectId || "";

  const inventoryObjects = globalInventoryItemObjects();
  const relatedObjects = scene.objects.filter(o => o.id !== obj.id);

  fillSelect($("propRequiresItem"), inventoryObjects, "Sin requisito");
  $("propRequiresItem").value = obj.requiresItemId || "";

  if ($("propRequireProximity")) $("propRequireProximity").checked = obj.requireProximity !== false;
  if ($("propInteractionDistance")) $("propInteractionDistance").value = obj.interactionDistance ?? 190;
  if ($("propTooFarMessage")) $("propTooFarMessage").value = obj.tooFarMessage || "Estás demasiado lejos.";

  if ($("propUseItemEnabled")) $("propUseItemEnabled").checked = !!obj.useItemEnabled;
  if ($("propUseItemId")) {
    fillSelect($("propUseItemId"), inventoryObjects, "Elegir item de cualquier escena");
    $("propUseItemId").value = obj.useItemId || obj.requiresItemId || "";
  }
  if ($("propUseItemMessage")) $("propUseItemMessage").value = obj.useItemMessage || "";
  if ($("propUseItemSetState")) $("propUseItemSetState").value = obj.useItemSetState || "";
  if ($("propUseItemConsume")) $("propUseItemConsume").checked = !!obj.useItemConsume;
  if ($("propUseItemRevealObject")) {
    fillSelect($("propUseItemRevealObject"), relatedObjects, "No mostrar nada");
    $("propUseItemRevealObject").value = obj.useItemRevealObjectId || "";
  }
  if ($("propUseItemHideObject")) {
    fillSelect($("propUseItemHideObject"), relatedObjects, "No ocultar nada");
    $("propUseItemHideObject").value = obj.useItemHideObjectId || "";
  }
  if ($("propUseItemHideSelf")) $("propUseItemHideSelf").checked = !!obj.useItemHideSelf;
  if ($("propUseItemGotoScene")) {
    fillSelect($("propUseItemGotoScene"), state.project.scenes || [], "No cambiar de escena");
    $("propUseItemGotoScene").value = obj.useItemGotoSceneId || "";
  }
  if ($("propUseItemFailMessage")) $("propUseItemFailMessage").value = obj.useItemFailMessage || "Eso no funciona.";
}

function renderZoneProps(zone) {
  $("zoneName").value = zone.name;
  const scene = currentScene();
  if ($("zoneSceneInfo")) $("zoneSceneInfo").textContent = `Zona local de escena: ${scene?.name || ""}`;
  $("zoneEnabled").checked = zone.enabled;
}

function renderNodeProps(node) {
  const scene = currentScene();
  normalizeNodeType(node);

  $("nodeName").value = node.name;
  $("nodeCategory").value = node.category;
  fillNodeTypeSelect($("nodeType"), node.category, node.type);
  node.event ??= defaultEventForNodeType(node.category, node.type);
  $("nodeEvent").value = node.event;
  node.input ??= "";
  $("nodeInput").value = node.input || "";
  $("nodeValue").value = node.value || "";
  $("nodeVolume").value = node.volume ?? "";
  const isGotoSceneNode = node.category === "action" && node.type === "gotoScene";
  if ($("nodeValueSceneWrap")) $("nodeValueSceneWrap").classList.toggle("hiddenParam", !isGotoSceneNode);
  if ($("nodeValueSceneSelect")) {
    fillSelect($("nodeValueSceneSelect"), state.project.scenes || [], "Elegir escena");
    const sceneByName = (state.project.scenes || []).find(s => s.name === node.value);
    $("nodeValueSceneSelect").value = node.targetSceneId || sceneByName?.id || "";
  }
  if ($("nodeSceneStartScene")) {
    fillSelect($("nodeSceneStartScene"), state.project.scenes || [], "Escena actual");
    $("nodeSceneStartScene").value = scene.id || "";
    $("nodeSceneStartScene").disabled = false;
  }
  node.targetObjectId ??= "";

  const help = $("nodeHelp");
  if (help) help.textContent = nodeDef(node).help || "";

  fillSelect($("nodeObject"), scene.objects, "Sin objeto");
  $("nodeObject").value = node.objectId || "";
  fillSelect($("nodeTargetObject"), scene.objects, "Sin objeto/item");
  $("nodeTargetObject").value = node.targetObjectId || "";
  const sceneAudioAssets = (scene.audioIds || [])
    .map(id => audioAssetById(id))
    .filter(Boolean);
  const nodeAudioItems = node.category === "action" && ["playSceneAudio", "stopSceneAudio"].includes(node.type)
    ? sceneAudioAssets
    : state.project.assets.audio;
  fillSelect($("nodeAudio"), nodeAudioItems, "Sin audio");
  $("nodeAudio").value = node.audioId || "";
  const targetForAnim = scene.objects.find(o => o.id === node.targetObjectId) || scene.objects.find(o => o.id === node.objectId);
  const spriteItems = spriteClipNames(targetForAnim).map(name => ({ id: name, name: `Sprite: ${name}` }));
  const transformItems = (targetForAnim?.transformClips || []).map(c => ({ id: c.name || c.id, name: `Transform: ${c.name || "clip"}` }));
  const animItems = node.type === "playTransformClip" ? transformItems : (node.type === "playAnimation" ? spriteItems : [...spriteItems, ...transformItems]);
  fillSelect($("nodeAnimation"), animItems, "Sin animación");
  $("nodeAnimation").value = node.animation || "";
  $("nodeAnimationMode").value = node.animationMode || "";
  fillSelect($("nodePuzzle"), state.project.mechanisms || [], "Sin mecanismo");
  $("nodePuzzle").value = node.mechanismId || "";

  setParamVisibility(node);
}

function updateSelectedObject(field, value) {
  const obj = selectedObject();
  if (!obj) return;
  obj[field] = value;
  if (field === "initialState") obj.state = value;
  renderStage();
  renderOutliner();
}

function updateParallax(field, value) {
  const obj = selectedObject();
  if (!obj) return;
  obj.parallax ??= { enabled: false, x: 0, y: 0 };
  obj.parallax[field] = value;
  renderStage();
}

function bindProps() {


  [
    ["scenePathfindingEnabled", "enabled", "checked"],
    ["scenePathfindingGridSize", "gridSize", "number"],
    ["scenePathfindingPadding", "obstaclePadding", "number"],
    ["scenePathfindingDiagonal", "diagonal", "checked"],
    ["scenePathfindingDebug", "debug", "checked"]
  ].forEach(([id, field, mode]) => {
    if ($(id)) $(id).addEventListener(mode === "checked" ? "change" : "input", e => {
      const scene = currentScene();
      if (!scene) return;
      const pf = normalizePathfindingSettings(scene);
      pf[field] = mode === "checked" ? e.target.checked : Number(e.target.value);
      renderProperties();
    });
  });

  if ($("propPathBlocker")) {
    const updatePathBlocker = e => {
      const obj = selectedObject();
      if (!obj) return;
      if (obj.type === "player" || obj.type === "background") {
        rememberPathBlocker(obj, false);
        e.target.checked = false;
        showMessage(obj.type === "player" ? "El Player no puede bloquear su propia ruta." : "El fondo no puede bloquear pathfinding.");
      } else {
        rememberPathBlocker(obj, e.target.checked === true);
        if (obj.pathBlocker) {
          normalizeCollider(obj);
          if ($("statusText")) $("statusText").textContent = `Bloqueante activado y guardado: ${obj.name || obj.id}`;
          if (!obj.collider.enabled) {
            showMessage("Objeto marcado como bloqueante. Ajusta/activa su collider si no quieres que use el rectángulo completo.");
          } else {
            showMessage("Objeto marcado como bloqueante. Pathfinding usará su collider.");
          }
        } else {
          if ($("statusText")) $("statusText").textContent = `Bloqueante desactivado y guardado: ${obj.name || obj.id}`;
        }
      }
      applyPathBlockerMemory();
      renderStage();
      if ($("propPathBlocker")) $("propPathBlocker").checked = obj.pathBlocker === true;
    };
    $("propPathBlocker").addEventListener("change", updatePathBlocker);
    $("propPathBlocker").addEventListener("input", updatePathBlocker);
    $("propPathBlocker").addEventListener("click", () => setTimeout(() => syncPathBlockerFromPropertiesPanel(), 0));
  }



  [
    ["scenePhysicsEnabled", "enabled", "checked"],
    ["scenePhysicsGravityX", "gravityX", "number"],
    ["scenePhysicsGravityY", "gravityY", "number"],
    ["scenePhysicsTimeScale", "timeScale", "number"],
    ["scenePhysicsBounds", "worldBounds", "checked"],
    ["scenePhysicsDomainObjectId", "domainObjectId", "value"],
    ["scenePhysicsResetOnEnter", "resetOnEnter", "checked"],
    ["scenePhysicsDebug", "debug", "checked"]
  ].forEach(([id, field, mode]) => {
    if ($(id)) $(id).addEventListener(mode === "checked" ? "change" : "input", e => {
      const scene = currentScene();
      if (!scene) return;
      const ph = normalizeScenePhysics(scene);
      ph[field] = mode === "checked" ? e.target.checked : (mode === "number" ? Number(e.target.value) : e.target.value);
      if (typeof syncPhysicsEditorOverlay === "function") syncPhysicsEditorOverlay();
      if (typeof restartPhysicsWorld === "function" && state.mode === "play") restartPhysicsWorld();
    });
  });

  if ($("scenePhysicsResetBtn")) $("scenePhysicsResetBtn").addEventListener("click", () => {
    if (typeof resetPhysicsWorld === "function") resetPhysicsWorld();
  });

  [
    ["propPhysicsEnabled", "enabled", "checked"],
    ["propPhysicsBodyType", "bodyType", "value"],
    ["propPhysicsShape", "shape", "value"],
    ["propPhysicsMass", "mass", "number"],
    ["propPhysicsDensity", "density", "number"],
    ["propPhysicsFriction", "friction", "number"],
    ["propPhysicsRestitution", "restitution", "number"],
    ["propPhysicsLockRotation", "lockRotation", "checked"],
    ["propPhysicsStartSleeping", "startSleeping", "checked"]
  ].forEach(([id, field, mode]) => {
    if ($(id)) $(id).addEventListener(mode === "checked" ? "change" : "input", e => {
      const obj = selectedObject();
      if (!obj) return;
      const ph = normalizeObjectPhysics(obj);
      if (obj.type === "player" && !obj.physicsAsMatterBody && field === "enabled") {
        ph.enabled = false;
        e.target.checked = false;
        showMessage("El Player se controla por pathfinding. Matter.js está desactivado para él.");
      } else {
        ph[field] = mode === "checked" ? e.target.checked : (mode === "number" ? Number(e.target.value) : e.target.value);
      }
      if (typeof renderObjectPhysicsProps === "function") renderObjectPhysicsProps(obj);
      if (typeof syncPhysicsEditorOverlay === "function") syncPhysicsEditorOverlay();
      if (typeof restartPhysicsWorld === "function" && state.mode === "play") restartPhysicsWorld();
    });
  });

  if ($("propPhysicsResetObjectBtn")) $("propPhysicsResetObjectBtn").addEventListener("click", () => {
    const obj = selectedObject();
    if (!obj) return;
    if (typeof resetPhysicsObject === "function") resetPhysicsObject(obj.id);
  });

  if ($("propPhysicsSetStartBtn")) $("propPhysicsSetStartBtn").addEventListener("click", () => {
    const obj = selectedObject();
    if (!obj) return;
    const ph = normalizeObjectPhysics(obj);
    ph.startX = obj.x;
    ph.startY = obj.y;
    ph.startRotation = obj.rotation || 0;
    showMessage("Posición física inicial guardada.");
    renderProperties();
  });



  if ($("propStateSelect")) $("propStateSelect").addEventListener("change", e => {
    const obj = selectedObject();
    if (!obj) return;
    obj._stateEditorSelected = e.target.value;
    renderProperties();
  });

  if ($("propStateAddBtn")) $("propStateAddBtn").addEventListener("click", () => {
    const obj = selectedObject();
    if (!obj) return;
    normalizeObjectStates(obj);
    const raw = prompt("Nombre del nuevo estado:", "nuevo_estado");
    const name = slugStateName(raw);
    if (!name) return;
    if (obj.states.some(st => st.name === name)) {
      alert("Ese estado ya existe.");
      return;
    }
    obj.states.push({ id: uid(), name, imageId: "", visible: true, interactable: true });
    obj._stateEditorSelected = name;
    if (!obj.initialState) obj.initialState = name;
    renderAll();
    renderProperties();
  });

  if ($("propStateDeleteBtn")) $("propStateDeleteBtn").addEventListener("click", () => {
    const obj = selectedObject();
    if (!obj) return;
    normalizeObjectStates(obj);
    const st = currentEditedObjectState();
    if (!st) return;
    if (st.name === "default") {
      alert("No se puede eliminar el estado default.");
      return;
    }
    if (!confirm(`¿Eliminar el estado "${st.name}"?`)) return;
    obj.states = obj.states.filter(s => s.name !== st.name);
    if (obj.initialState === st.name) obj.initialState = "default";
    if (obj.state === st.name) obj.state = "default";
    if (obj.collectState === st.name) obj.collectState = "hidden";
    obj._stateEditorSelected = "default";
    renderAll();
    renderProperties();
  });

  if ($("propStateName")) $("propStateName").addEventListener("change", e => {
    const obj = selectedObject();
    if (!obj) return;
    const st = currentEditedObjectState();
    if (!st) return;
    const oldName = st.name;
    const newName = slugStateName(e.target.value);
    if (!newName) return;
    if (oldName === "default" && newName !== "default") {
      alert("El estado default no se puede renombrar.");
      e.target.value = oldName;
      return;
    }
    if (obj.states.some(s => s !== st && s.name === newName)) {
      alert("Ya existe un estado con ese nombre.");
      e.target.value = oldName;
      return;
    }
    st.name = newName;
    if (obj.initialState === oldName) obj.initialState = newName;
    if (obj.state === oldName) obj.state = newName;
    if (obj.collectState === oldName) obj.collectState = newName;
    if (state.runtimeStates[obj.id] === oldName) state.runtimeStates[obj.id] = newName;
    obj._stateEditorSelected = newName;
    renderAll();
    renderProperties();
  });

  [
    ["propStateImage", "imageId", "value"],
    ["propStateVisible", "visible", "checked"],
    ["propStateInteractable", "interactable", "checked"]
  ].forEach(([id, field, mode]) => {
    if ($(id)) $(id).addEventListener(mode === "checked" ? "change" : "input", e => {
      const st = currentEditedObjectState();
      if (!st) return;
      st[field] = mode === "checked" ? e.target.checked : e.target.value;
      renderStage();
      if (field === "imageId") renderProperties();
    });
  });

  if ($("propCollectState")) $("propCollectState").addEventListener("change", e => {
    const obj = selectedObject();
    if (!obj) return;
    obj.collectState = e.target.value || "hidden";
    renderProperties();
  });

  if ($("propInventoryImage")) $("propInventoryImage").addEventListener("change", e => {
    const obj = selectedObject();
    if (!obj) return;
    obj.inventoryImageId = e.target.value || "";
    renderProperties();
    renderInventory();
  });


  if ($("nodeSceneStartScene")) $("nodeSceneStartScene").addEventListener("change", e => {
    const nextSceneId = e.target.value;
    if (!nextSceneId || nextSceneId === state.selectedSceneId) return;
    if (typeof selectSceneForEditing === "function") selectSceneForEditing(nextSceneId);
    else {
      state.selectedSceneId = nextSceneId;
      clearSelection();
      renderAll();
    }
    $("statusText").textContent = `Editando grafo de escena: ${currentScene()?.name || nextSceneId}`;
  });

  if ($("scenePropName")) if ($("scenePropName")) $("scenePropName").addEventListener("input", e => {
    const scene = currentScene();
    if (!scene) return;
    scene.name = e.target.value;
    renderScenes();
  });
  if ($("sceneParallaxStrength")) if ($("sceneParallaxStrength")) $("sceneParallaxStrength").addEventListener("input", e => {
    const scene = currentScene();
    if (!scene) return;
    scene.parallaxStrength = Number(e.target.value) || 0;
    renderStage();
  });

  if ($("sceneCameraEnabled")) $("sceneCameraEnabled").addEventListener("change", e => {
    const scene = currentScene();
    if (!scene) return;
    scene.camera ??= { enabled: false, followPlayer: false };
    scene.camera.enabled = e.target.checked;
    scene.camera.followPlayer = e.target.checked;
    renderStage();
  });

  if ($("markStartSceneBtn")) $("markStartSceneBtn").addEventListener("click", () => {
    const scene = currentScene();
    if (!scene) return;
    state.project.startSceneId = scene.id;
    renderAll();
    renderProperties();
    $("statusText").textContent = `Escena inicial: ${scene.name}`;
  });


  const updateSelectedOcclusion = (field, value) => {
    const obj = selectedObject();
    if (!obj) return;
    const occ = typeof ensureOcclusionConfig === "function" ? ensureOcclusionConfig(obj) : (obj.occlusion ??= {});
    occ[field] = value;
    if (field === "enabled" && obj.type === "background") occ.enabled = false;
    if (typeof normalizeObjectOcclusion === "function") normalizeObjectOcclusion(obj);
    renderStage();
    renderProperties();
  };
  if ($("propOcclusionEnabled")) $("propOcclusionEnabled").addEventListener("change", e => updateSelectedOcclusion("enabled", e.target.checked));
  if ($("propOcclusionMode")) $("propOcclusionMode").addEventListener("change", e => updateSelectedOcclusion("mode", e.target.value));
  if ($("propOcclusionOffsetY")) $("propOcclusionOffsetY").addEventListener("input", e => updateSelectedOcclusion("offsetY", Number(e.target.value || 0)));

  if ($("propColliderEnabled")) $("propColliderEnabled").addEventListener("change", e => {
    const obj = selectedObject();
    if (!obj) return;
    const col = normalizeCollider(obj);
    if (obj.type === "player") {
      col.enabled = true;
      col.required = true;
      col.userEnabled = true;
      e.target.checked = true;
      alert("No se puede desactivar porque es necesario para interactuar con otros objetos.");
      showMessage("El collider del Player es obligatorio para interacción/proximidad. No bloquea pathfinding ni activa Matter.js.");
    } else {
      col.enabled = e.target.checked;
      col.userEnabled = e.target.checked;
    }
    renderStage();
    renderProperties();
  });
  if ($("propShowCollider")) $("propShowCollider").addEventListener("change", e => {
    const obj = selectedObject();
    if (!obj) return;
    normalizeCollider(obj).visible = e.target.checked;
    renderStage();
  });
  if ($("propColliderType")) $("propColliderType").addEventListener("change", e => {
    const obj = selectedObject();
    if (!obj) return;
    obj.collider = makeColliderPreset(obj, e.target.value, { keepEnabled: true });
    renderAll();
  });
  if ($("editColliderBtn")) $("editColliderBtn").addEventListener("click", e => {
    e.preventDefault();
    const obj = (typeof selectedObjectForColliderEditor === "function" ? selectedObjectForColliderEditor() : null) || selectedObject();
    if (!obj) {
      showMessage?.("Selecciona un objeto para editar su collider.");
      return;
    }
    openColliderEditor(obj.id);
  });
  if ($("resetColliderBtn")) $("resetColliderBtn").addEventListener("click", e => {
    e.preventDefault();
    const obj = (typeof selectedObjectForColliderEditor === "function" ? selectedObjectForColliderEditor() : null) || selectedObject();
    if (!obj) {
      showMessage?.("Selecciona un objeto para resetear su collider.");
      return;
    }
    obj.collider = makeColliderPreset(obj, "box", { keepEnabled: true, visible: !!obj.collider?.visible });
    state.selectedPanel = "object";
    state.selectedObjectId = obj.id;
    renderAll();
    showMessage?.(`Collider reseteado: ${obj.name || obj.id}`);
  });

  const bindings = [
    ["propName", "name", String], ["propType", "type", String],
    ["propX", "x", Number], ["propY", "y", Number],
    ["propScale", "scale", Number], ["propRotation", "rotation", Number],
    ["propW", "width", Number], ["propH", "height", Number],
    ["propZ", "z", Number], ["propSpeed", "speed", Number],
    ["propImage", "imageId", String], ["propAudio", "audioId", String],
    ["propAction", "action", String], ["propMessage", "message", String],
    ["propTargetScene", "targetSceneId", String], ["propTargetObject", "targetObjectId", String],
    ["propRequiresItem", "requiresItemId", String], ["propLockedMessage", "lockedMessage", String],
    ["propInitialState", "initialState", String]
  ];

  bindings.forEach(([id, field, cast]) => {
    $(id).addEventListener("input", e => {
      updateSelectedObject(field, cast(e.target.value));
      renderProperties();
    });
  });

  $("propImage").addEventListener("change", e => {
    updateSelectedObject("imageId", e.target.value);
    renderProperties();
  });
  if ($("propSpriteImage")) $("propSpriteImage").addEventListener("change", e => {
    applySpriteImageToSelectedObject(e.target.value);
  });
  $("propAudio").addEventListener("change", e => {
    updateSelectedObject("audioId", e.target.value);
    renderProperties();
  });
  $("propVisible").addEventListener("change", e => updateSelectedObject("visible", e.target.checked));
  $("propLocked").addEventListener("change", e => updateSelectedObject("locked", e.target.checked));
  $("propBgResize").addEventListener("change", e => {
    const obj = selectedObject();
    if (!obj) return;
    obj.bgResize = e.target.value;
    renderStage();
  });
  $("propAutoFlipX").addEventListener("change", e=>{const obj=selectedObject();if(!obj)return;obj.autoFlipX=e.target.checked;renderStage()});
  $("propSpriteEnabled").addEventListener("change", e=>{const obj=selectedObject();if(!obj)return;obj.sprite.enabled=e.target.checked;if(obj.sprite.enabled){obj.width=Number(obj.sprite.frameWidth||obj.width||64);obj.height=Number(obj.sprite.frameHeight||obj.height||64)}renderAll()});
  [["propFrameW","frameWidth"],["propFrameH","frameHeight"],["propSpriteCols","columns"],["propSpriteRows","rows"],["propSpriteFps","fps"],["propSpriteFrame","currentFrame"]].forEach(([id,field])=>{
    const el = $(id);
    if (!el) return;
    const applySpriteField = e => {
      const obj = selectedObject();
      if (!obj) return;
      ensureSpriteConfig(obj);

      const value = Number(e.target.value);
      if (field === "frameWidth" || field === "frameHeight") {
        obj.sprite[field] = Math.max(1, value || 1);
        syncObjectSizeFromSpriteFrame(obj);
      } else if (field === "columns" || field === "rows") {
        obj.sprite[field] = Math.max(1, value || 1);
        updateSpriteAutoFrameStatus(obj);
      } else if (field === "fps") {
        obj.sprite[field] = Math.max(1, value || 1);
      } else if (field === "currentFrame") {
        setSpriteFrame(obj, value || 0);
      }

      if ($("spriteAutoFrameStatus") && (field === "frameWidth" || field === "frameHeight")) {
        $("spriteAutoFrameStatus").textContent = `Frame manual guardado: ${obj.sprite.frameWidth} × ${obj.sprite.frameHeight}px. Objeto: ${obj.width} × ${obj.height}px.`;
        $("spriteAutoFrameStatus").classList.remove("warning");
        $("spriteAutoFrameStatus").classList.add("ok");
      }

      renderStage();
      updateClipEditorValidation(obj);
    };

    el.addEventListener("input", applySpriteField);
    el.addEventListener("change", applySpriteField);
  });
  $("propSpriteClip").addEventListener("change",e=>{const obj=selectedObject();if(!obj)return;playObjectAnimation(obj,e.target.value,true);renderProperties();renderStage()});
  $("propMoveClip").addEventListener("change",e=>{const obj=selectedObject();if(!obj)return;obj.sprite.moveClip=e.target.value;renderProperties();});
  $("propStopClip").addEventListener("change",e=>{const obj=selectedObject();if(!obj)return;obj.sprite.stopClip=e.target.value;renderProperties();});
  $("propSpriteClips").addEventListener("change",e=>{const obj=selectedObject();if(!obj)return;obj.sprite.clips=parseSpriteClips(e.target.value,obj.sprite.clips);if(!obj.sprite.clips[obj.sprite.currentClip])obj.sprite.currentClip=Object.keys(obj.sprite.clips)[0]||"idle";renderAll()});
  if ($("propParallaxLayer")) $("propParallaxLayer").addEventListener("change", e => {
    const obj = selectedObject();
    if (!obj) return;
    obj.parallaxLayer = typeof normalizeParallaxLayer === "function" ? normalizeParallaxLayer(e.target.value) : Number(e.target.value);
    renderProperties();
    renderStage();
  });

  $("propParallaxEnabled").addEventListener("change", e => updateParallax("enabled", e.target.checked));
  $("propParallaxX").addEventListener("input", e => updateParallax("x", Number(e.target.value)));
  $("propParallaxY").addEventListener("input", e => updateParallax("y", Number(e.target.value)));

  $("zoneName").addEventListener("input", e => {
    const z = selectedZone();
    if (!z) return;
    z.name = e.target.value;
    renderOutliner();
  });

  $("zoneEnabled").addEventListener("change", e => {
    const z = selectedZone();
    if (!z) return;
    z.enabled = e.target.checked;
    renderStage();
  });

  $("addZonePointBtn").onclick = addPointToSelectedZone;
  $("deleteZonePointBtn").onclick = deleteSelectedZonePoint;



  [
    ["propRequireProximity", "requireProximity", "checked"],
    ["propInteractionDistance", "interactionDistance", "number"],
    ["propTooFarMessage", "tooFarMessage", "value"],
    ["propUseItemEnabled", "useItemEnabled", "checked"],
    ["propUseItemId", "useItemId", "value"],
    ["propUseItemMessage", "useItemMessage", "value"],
    ["propUseItemSetState", "useItemSetState", "value"],
    ["propUseItemConsume", "useItemConsume", "checked"],
    ["propUseItemRevealObject", "useItemRevealObjectId", "value"],
    ["propUseItemHideObject", "useItemHideObjectId", "value"],
    ["propUseItemHideSelf", "useItemHideSelf", "checked"],
    ["propUseItemGotoScene", "useItemGotoSceneId", "value"],
    ["propUseItemFailMessage", "useItemFailMessage", "value"]
  ].forEach(([id, field, mode]) => {
    if ($(id)) $(id).addEventListener(mode === "checked" ? "change" : "input", e => {
      const obj = selectedObject();
      if (!obj) return;
      obj[field] = mode === "checked" ? e.target.checked : (mode === "number" ? Math.max(0, Number(e.target.value) || 0) : e.target.value);
      if (field === "useItemId" && !obj.requiresItemId) obj.requiresItemId = e.target.value;
      renderStage();
    });
  });

  if ($("nodeValueSceneSelect")) $("nodeValueSceneSelect").addEventListener("change", e => {
    const n = selectedNode();
    if (!n) return;
    const scene = state.project.scenes.find(s => s.id === e.target.value);
    n.targetSceneId = e.target.value;
    n.value = scene?.name || "";
    renderLogic();
    renderProperties();
  });

  if ($("clipEditSelect")) $("clipEditSelect").addEventListener("change", e => {
    const obj = selectedObject();
    if (!obj?.sprite) return;
    obj.sprite.currentClip = e.target.value;
    renderProperties();
    renderStage();
  });
  if ($("clipApplyBtn")) $("clipApplyBtn").addEventListener("click", applyClipVisualEditor);
  if ($("clipDeleteBtn")) $("clipDeleteBtn").addEventListener("click", deleteCurrentClipFromVisualEditor);
  if ($("clipNewClipBtn")) $("clipNewClipBtn").addEventListener("click", createClipFromVisualEditor);
  
  ["clipEditName", "clipEditFrom", "clipEditTo", "clipEditFps", "clipEditMode"].forEach(id => {
    if ($(id)) $(id).addEventListener("input", () => {
      const obj = selectedObject();
      if (obj) updateClipEditorValidation(obj);
    });
  });
  if ($("clipFitGridBtn")) $("clipFitGridBtn").addEventListener("click", fitSpriteGridToCurrentClip);


  if ($("spriteAutoFrameBtn")) $("spriteAutoFrameBtn").addEventListener("click", () => {
    const obj = selectedObject();
    if (!obj) return;
    calculateSpriteFrameSizeFromImage(obj, { updateFields: true, fitObject: true });
    renderProperties();
  });

  if ($("spriteFitObjectToFrameBtn")) $("spriteFitObjectToFrameBtn").addEventListener("click", () => {
    const obj = selectedObject();
    if (!obj?.sprite) return;
    syncObjectSizeFromSpriteFrame(obj);
    renderStage();
    renderProperties();
  });

  if ($("spriteAutoFrameAndFitBtn")) $("spriteAutoFrameAndFitBtn").addEventListener("click", () => {
    const obj = selectedObject();
    if (!obj) return;
    calculateSpriteFrameSizeFromImage(obj, { updateFields: true, fitObject: true });
    renderProperties();
  });

  ["propSpriteCols", "propSpriteRows"].forEach(id => {
    if ($(id)) $(id).addEventListener("change", () => {
      const obj = selectedObject();
      if (obj?.sprite?.enabled) updateSpriteAutoFrameStatus(obj);
    });
  });


  if ($("clipFormatJsonBtn")) $("clipFormatJsonBtn").addEventListener("click", () => {
    const obj = selectedObject();
    if (!obj?.sprite) return;
    obj.sprite.clips = parseSpriteClips($("propSpriteClips").value, obj.sprite.clips);
    $("propSpriteClips").value = JSON.stringify(obj.sprite.clips || {}, null, 2);
    renderProperties();
  });

  $("deleteZoneBtn").onclick = () => {
    const scene = currentScene();
    if (!scene || !state.selectedZoneId) return;
    scene.navZones = scene.navZones.filter(z => z.id !== state.selectedZoneId);
    clearSelection();
    renderAll();
  };

  [["nodeName","name"],["nodeEvent","event"],["nodeInput","input"],["nodeObject","objectId"],["nodeTargetObject","targetObjectId"],["nodeAudio","audioId"],["nodeAnimation","animation"],["nodeAnimationMode","animationMode"],["nodePuzzle","mechanismId"],["nodeValue","value"],["nodeVolume","volume"]].forEach(([id, field]) => {
    const el = $(id);
    const updateNodeField = e => {
      const n = selectedNode();
      if (!n) return;
      n[field] = e.target.value;
      if (field === "value" && n.category === "action" && n.type === "gotoScene") n.targetSceneId = "";
      renderLogic();
      renderProperties();
    };
    el.addEventListener("input", updateNodeField);
    el.addEventListener("change", updateNodeField);
  });

  $("nodeCategory").addEventListener("change", e => {
    const n = selectedNode();
    if (!n) return;
    n.category = e.target.value;
    n.type = (NODE_TYPE_OPTIONS[n.category] || [["action", "Acción"]])[0][0];
    n.event = defaultEventForNodeType(n.category, n.type);
    n.name = nodeDef(n).label;
    renderAll();
  });

  $("nodeType").addEventListener("change", e => {
    const n = selectedNode();
    if (!n) return;
    n.type = e.target.value;
    n.event = defaultEventForNodeType(n.category, n.type);
    n.name = nodeDef(n).label;
    renderAll();
  });
}

function enableDragging(el, obj) {
  el.draggable = false;
  el.style.touchAction = "none";
  el.addEventListener("dragstart", e => e.preventDefault());

  el.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    if (e.target?.classList?.contains("transformHandle")) return;
    if (state.mode !== "editor" && state.mode !== "physics" && state.mode !== "animations") return;
    if (state.mode === "editor") state.tool = "select";
    startSceneObjectDragFromPointer(e, obj);
  }, true);
}



