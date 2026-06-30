// AventurIA v54 Modular Base — 03_render_all_and_ui_lists.js
// Extraído de v53 funcional. Script clásico global; el orden de carga importa.

function renderAll() {
  renderInventorySettings();
  renderProjectStartSettings();
  renderSceneAudioSettings();
  renderScenes();
  renderAssets();
  renderPrefabs();
  renderMechanisms();
  renderStage();
  renderOutliner();
  renderProperties();
  renderInventory();
  renderLogic();
  if (typeof renderTransformAnimationEditor === "function") renderTransformAnimationEditor();
  if (typeof syncPhysicsEditorOverlay === "function") syncPhysicsEditorOverlay();

  updateColliderToolbarButton();}


function hexToRgb(hex) {
  const value = String(hex || "#111111").replace("#", "");
  const full = value.length === 3 ? value.split("").map(c => c + c).join("") : value.padEnd(6, "0").slice(0, 6);
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function applyMessageSettings() {
  const box = els.messageBox;
  if (!box || !state.project?.messageSettings) return;

  const s = state.project.messageSettings;
  const bg = hexToRgb(s.background || "#111111");
  const alpha = Math.max(0, Math.min(1, Number(s.backgroundAlpha ?? 0.85)));
  const position = s.position || "top";

  box.classList.remove("msg-top", "msg-center", "msg-bottom");
  box.classList.add(`msg-${position}`);

  box.style.fontFamily = s.fontFamily || "Arial, sans-serif";
  box.style.fontSize = `${Math.max(8, Number(s.fontSize || 18))}px`;
  box.style.color = s.color || "#ffffff";
  box.style.backgroundColor = `rgba(${bg.r}, ${bg.g}, ${bg.b}, ${alpha})`;
  box.style.borderRadius = `${Math.max(0, Number(s.borderRadius ?? 10))}px`;
  box.style.maxWidth = `${Math.max(20, Math.min(100, Number(s.maxWidth || 80)))}%`;
}



function renderProjectStartSettings() {
  if (!$("startSceneSelect") || !state.project) return;

  fillSelect($("startSceneSelect"), state.project.scenes || [], "Primera escena disponible");
  $("startSceneSelect").value = state.project.startSceneId || state.project.scenes?.[0]?.id || "";

  fillSelect($("splashImageSelect"), state.project.assets.images || [], "Sin imagen");
  $("splashImageSelect").value = state.project.splash?.imageId || "";

  fillSelect($("splashAudioSelect"), state.project.assets.audio || [], "Sin audio");
  $("splashAudioSelect").value = state.project.splash?.audioId || "";

  $("splashEnabledInput").checked = !!state.project.splash?.enabled;
  $("splashDurationInput").value = state.project.splash?.durationMs ?? 2500;
  $("splashSkipInput").checked = state.project.splash?.allowSkip !== false;
}

function audioAssetsList() {
  return (state.project?.assets?.audio || []).filter(a => a && a.id);
}

function rebuildSceneAudioSelect(scene) {
  const select = $("sceneAudioAddSelect");
  if (!select) return;

  scene.audioIds ??= [];
  const allAudio = audioAssetsList();
  const available = allAudio.filter(a => !scene.audioIds.includes(a.id));

  select.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = allAudio.length ? "Elegir audio importado" : "No hay audios importados";
  select.appendChild(placeholder);

  available.forEach(asset => {
    const opt = document.createElement("option");
    opt.value = asset.id;
    opt.textContent = asset.name || asset.id;
    select.appendChild(opt);
  });

  select.disabled = available.length === 0;

  const addBtn = $("sceneAudioAddBtn");
  if (addBtn) addBtn.disabled = available.length === 0;

  const count = $("sceneAudioAssetCount");
  if (count) {
    count.textContent = `${allAudio.length} audio(s) importado(s) en el proyecto · ${scene.audioIds.length} asociado(s) a esta escena`;
  }
}

function renderSceneAudioSettings() {
  const scene = currentScene();
  if (!$("sceneAudioAddSelect") || !scene) return;

  scene.audioIds ??= [];
  scene.audioVolumes ??= {};
  scene.audioMasterVolume ??= 1;
  scene.audioAutoplay ??= false;

  if ($("sceneAudioMasterVolume")) $("sceneAudioMasterVolume").value = scene.audioMasterVolume ?? 1;
  if ($("sceneAudioAutoplay")) $("sceneAudioAutoplay").checked = !!scene.audioAutoplay;

  rebuildSceneAudioSelect(scene);

  const list = $("sceneAudioList");
  if (!list) return;
  list.innerHTML = "";

  if (!scene.audioIds.length) {
    const li = document.createElement("li");
    li.className = "muted";
    li.textContent = "Esta escena todavía no tiene audios asociados.";
    list.appendChild(li);
    return;
  }

  scene.audioIds.forEach(audioId => {
    const asset = audioAssetById(audioId);
    const vol = scene.audioVolumes[audioId] ?? 1;
    const li = document.createElement("li");
    li.className = "sceneAudioRow";
    li.innerHTML = `
      <span>${asset?.name || audioId}</span>
      <label class="miniControl">Vol.
        <input type="number" min="0" max="1" step="0.05" value="${vol}" data-volume-audio-id="${audioId}">
      </label>
      <button type="button" class="iconBtn" title="Probar audio" data-test-audio-id="${audioId}">▶</button>
      <button type="button" class="iconBtn" title="Quitar solo de esta escena" data-audio-id="${audioId}">−</button>
      <button type="button" class="danger iconBtn" title="Eliminar del proyecto" data-delete-audio-id="${audioId}">×</button>`;
    li.querySelector("[data-volume-audio-id]").oninput = e => {
      scene.audioVolumes[audioId] = Math.max(0, Math.min(1, Number(e.target.value) || 0));
      applySceneAudioVolumes();
    };
    li.querySelector("[data-test-audio-id]").onclick = () => {
      playSceneAudio(audioId, false, 1);
    };
    li.querySelector("[data-audio-id]").onclick = () => {
      scene.audioIds = scene.audioIds.filter(id => id !== audioId);
      delete scene.audioVolumes[audioId];
      stopSceneAudio(audioId);
      renderSceneAudioSettings();
      renderNodeProps(selectedNode());
    };
    li.querySelector("[data-delete-audio-id]").onclick = () => {
      deleteAudioAsset(audioId);
    };
    list.appendChild(li);
  });
}

function renderInventorySettings() {
  if (!$("inventorySlotsInput") || !state.project?.inventorySettings) return;
  $("inventorySlotsInput").value = state.project.inventorySettings.slots || 8;
  if ($("inventorySlotSizeInput")) $("inventorySlotSizeInput").value = state.project.inventorySettings.slotSize || 72;
  if ($("inventoryPositionInput")) $("inventoryPositionInput").value = state.project.inventorySettings.position || "bottom-center";
  $("inventoryFullMessageInput").value = state.project.inventorySettings.fullMessage || "El inventario está lleno.";
  $("inventoryIconWInput").value = state.project.inventorySettings.iconWidth || 72;
  $("inventoryIconHInput").value = state.project.inventorySettings.iconHeight || 72;

  const m = state.project.messageSettings || {};
  if ($("messagePositionInput")) $("messagePositionInput").value = m.position || "top";
  if ($("messageFontInput")) $("messageFontInput").value = m.fontFamily || "Arial, sans-serif";
  if ($("messageSizeInput")) $("messageSizeInput").value = m.fontSize || 18;
  if ($("messageColorInput")) $("messageColorInput").value = m.color || "#ffffff";
  if ($("messageBgInput")) $("messageBgInput").value = m.background || "#111111";
  if ($("messageBgAlphaInput")) $("messageBgAlphaInput").value = m.backgroundAlpha ?? 0.85;
  if ($("messageRadiusInput")) $("messageRadiusInput").value = m.borderRadius ?? 10;
  if ($("messageMaxWidthInput")) $("messageMaxWidthInput").value = m.maxWidth || 80;

  applyMessageSettings();
}


function renderPrefabs() {
  const list = $("prefabList");
  if (!list) return;
  list.innerHTML = "";

  const prefabs = state.project.prefabs || [];
  const selectedExists = prefabs.some(p => p.id === state.selectedPrefabId);
  if (!selectedExists) state.selectedPrefabId = null;

  prefabs.forEach(prefab => {
    const li = document.createElement("li");
    li.className = prefab.id === state.selectedPrefabId ? "selected" : "";
    li.innerHTML = `<span>${prefab.name}</span><small>${prefab.object?.type || "prefab"}</small>`;
    li.onclick = async () => {
      const prevScene = currentScene();
      if (prevScene) await generateSceneThumbnail(prevScene);
      state.selectedPrefabId = prefab.id;
      renderPrefabs();
      renderMechanisms();
    };
    list.appendChild(li);
  });

  const deleteBtn = $("deletePrefabBtn");
  if (deleteBtn) deleteBtn.disabled = !state.selectedPrefabId;

  const instantiateBtn = $("instantiatePrefabBtn");
  if (instantiateBtn) instantiateBtn.disabled = !state.selectedPrefabId;
}


function collectPrefabLogicForObject(scene, obj) {
  const nodes = scene.logic?.nodes || [];
  const links = scene.logic?.links || [];

  const seedIds = new Set();

  nodes.forEach(n => {
    normalizeNodeType(n);

    const referencesObject =
      n.objectId === obj.id ||
      n.targetObjectId === obj.id ||
      n.itemId === obj.id ||
      n.audioId === obj.audioId ||
      n.imageId === obj.imageId;

    if (referencesObject) seedIds.add(n.id);

    // Para prefabs de Player, ciertas acciones son conceptualmente del player
    // aunque no tengan targetObjectId explícito.
    if (obj.type === "player") {
      const playerImplicitAction =
        n.category === "action" &&
        ["moveTo", "playAnimation"].includes(n.type) &&
        (!n.targetObjectId || n.targetObjectId === obj.id);

      const playerEntity =
        n.category === "entity" &&
        n.type === "player" &&
        (!n.objectId || n.objectId === obj.id);

      if (playerImplicitAction || playerEntity) seedIds.add(n.id);
    }
  });

  if (!seedIds.size) return { nodes: [], links: [] };

  // Expandir por conexiones en ambos sentidos para capturar:
  // Input click -> MoveTo
  // Entity Player -> Trigger -> Action
  // Action -> Action
  // y evitar que los grafos queden huérfanos.
  const selectedIds = new Set(seedIds);
  let changed = true;

  while (changed) {
    changed = false;

    links.forEach(l => {
      const touchesSelected = selectedIds.has(l.from) || selectedIds.has(l.to);
      if (!touchesSelected) return;

      if (!selectedIds.has(l.from)) {
        selectedIds.add(l.from);
        changed = true;
      }
      if (!selectedIds.has(l.to)) {
        selectedIds.add(l.to);
        changed = true;
      }
    });
  }

  const prefabNodes = nodes.filter(n => selectedIds.has(n.id));
  const prefabLinks = links.filter(l => selectedIds.has(l.from) && selectedIds.has(l.to));

  return {
    nodes: deepClone(prefabNodes),
    links: deepClone(prefabLinks)
  };
}


function makePrefabFromSelectedObject() {
  const scene = currentScene();
  const obj = selectedObject();
  if (!scene || !obj) {
    alert("Selecciona primero un objeto en escena u outliner.");
    return;
  }

  const prefabLogic = collectPrefabLogicForObject(scene, obj);

  const prefab = {
    id: uid(),
    name: `${obj.name} Prefab`,
    sourceObjectId: obj.id,
    object: (() => {
      const copy = deepClone(obj);
      delete copy.navZones;
      return copy;
    })(),
    logic: prefabLogic,
    assetRefs: {
      imageId: obj.imageId || "",
      audioId: obj.audioId || ""
    },
    createdAt: new Date().toISOString()
  };

  state.project.prefabs.push(prefab);
  state.selectedPrefabId = prefab.id;
  renderAll();
  $("statusText").textContent = `Prefab creado: ${prefab.name} · ${prefab.logic.nodes.length} nodo(s), ${prefab.logic.links.length} conexión(es)`;
}

function instantiateSelectedPrefab() {
  const scene = currentScene();
  const prefab = (state.project.prefabs || []).find(p => p.id === state.selectedPrefabId);
  if (!scene || !prefab) {
    alert("Selecciona primero un prefab.");
    return;
  }

  const oldObjectId = prefab.sourceObjectId || prefab.object.id;
  const newObjectId = uid();
  const idMap = { [oldObjectId]: newObjectId };

  const obj = deepClone(prefab.object);
  delete obj.navZones;
  obj.id = newObjectId;
  obj.name = uniqueObjectName(scene, obj.name || prefab.name);
  obj.x = Math.round(state.project.stage.width / 2 - obj.width / 2);
  obj.y = Math.round(state.project.stage.height / 2 - obj.height / 2);
  obj.visible = true;
  obj.state = obj.initialState || "default";

  scene.objects.push(obj);

  // Clonar nodos asociados y remapear referencias al nuevo objeto.
  const oldNodeToNew = {};
  (prefab.logic?.nodes || []).forEach(oldNode => {
    const newNode = deepClone(oldNode);
    const oldNodeId = newNode.id;
    newNode.id = uid();
    oldNodeToNew[oldNodeId] = newNode.id;

    if (newNode.objectId === oldObjectId) newNode.objectId = newObjectId;
    if (newNode.targetObjectId === oldObjectId) newNode.targetObjectId = newObjectId;
    if (newNode.itemId === oldObjectId) newNode.itemId = newObjectId;

    newNode.x = (newNode.x || 100) + 40;
    newNode.y = (newNode.y || 100) + 40;
    scene.logic.nodes.push(newNode);
  });

  (prefab.logic?.links || []).forEach(oldLink => {
    if (!oldNodeToNew[oldLink.from] || !oldNodeToNew[oldLink.to]) return;
    const newLink = deepClone(oldLink);
    newLink.id = uid();
    newLink.from = oldNodeToNew[oldLink.from];
    newLink.to = oldNodeToNew[oldLink.to];
    scene.logic.links.push(newLink);
  });

  clearSelection();
  state.selectedPanel = "object";
  state.selectedObjectId = obj.id;
  renderAll();
  $("statusText").textContent = `Prefab instanciado: ${obj.name}`;
}

function deleteSelectedPrefab() {
  const prefabs = state.project.prefabs || [];
  const prefab = prefabs.find(p => p.id === state.selectedPrefabId);

  if (!prefab) {
    alert("Selecciona primero un prefab.");
    return;
  }

  if (!confirm(`¿Eliminar el prefab "${prefab.name}"? Las instancias ya creadas en escenas no se eliminarán.`)) return;

  state.project.prefabs = prefabs.filter(p => p.id !== prefab.id);
  state.selectedPrefabId = null;
  renderAll();
  $("statusText").textContent = `Prefab eliminado: ${prefab.name}`;
}

function uniqueObjectName(scene, base) {
  let name = base;
  let i = 2;
  const names = new Set(scene.objects.map(o => o.name));
  while (names.has(name)) {
    name = `${base} ${i++}`;
  }
  return name;
}


function sceneBackgroundAsset(scene){
  const bg=(scene.objects||[]).find(o=>o.type==="background"&&o.imageId);
  return bg?imageAssetById(bg.imageId):null;
}
function sceneThumbnailUrl(scene){
  if(scene.thumbnailDataUrl)return scene.thumbnailDataUrl;
  const bg=sceneBackgroundAsset(scene);
  return bg?.dataUrl||"";
}
function imageFromDataUrl(dataUrl){
  return new Promise(resolve=>{
    if(!dataUrl)return resolve(null);
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>resolve(null);
    img.src=dataUrl;
  });
}
async function generateSceneThumbnail(scene){
  try{
    const w=240,h=140,canvas=document.createElement("canvas");
    canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext("2d");
    ctx.fillStyle="#111";ctx.fillRect(0,0,w,h);
    const scale=Math.min(w/state.project.stage.width,h/state.project.stage.height);
    const objects=[...(scene.objects||[])].filter(o=>o.visible!==false&&o.imageId).sort((a,b)=>(a.z||0)-(b.z||0));
    for(const obj of objects){
      const asset=imageAssetById(obj.imageId);
      if(!asset?.dataUrl)continue;
      const img=await imageFromDataUrl(asset.dataUrl);
      if(!img)continue;
      if(obj.type==="background"){
        ctx.drawImage(img,0,0,w,h);
      }else{
        const ow=Math.max(1,obj.width*(obj.scale||1)*scale);
        const oh=Math.max(1,obj.height*(obj.scale||1)*scale);
        const ox=obj.x*scale,oy=obj.y*scale;
        ctx.save();
        ctx.translate(ox+ow/2,oy+oh/2);
        ctx.rotate((obj.rotation||0)*Math.PI/180);
        ctx.drawImage(img,-ow/2,-oh/2,ow,oh);
        ctx.restore();
      }
    }
    scene.thumbnailDataUrl=canvas.toDataURL("image/jpeg",0.72);
    return scene.thumbnailDataUrl;
  }catch(err){
    const bg=sceneBackgroundAsset(scene);
    scene.thumbnailDataUrl=bg?.dataUrl||"";
    return scene.thumbnailDataUrl;
  }
}
async function refreshThumbnailsAfterLoad() {
  await updateAllSceneThumbnails();
  renderScenes();
}

async function updateAllSceneThumbnails(){
  for(const scene of state.project.scenes||[]) await generateSceneThumbnail(scene);
}

function renderScenes() {
  if (typeof ensurePathfindingLabScene === "function" && state.project) ensurePathfindingLabScene(state.project);
  if (typeof ensureComplexPathfindingLabScene === "function" && state.project) ensureComplexPathfindingLabScene(state.project);
  els.sceneList.innerHTML = "";
  state.project.scenes.forEach(scene => {
    const li = document.createElement("li");
    const isSelected = scene.id === state.selectedSceneId;
    const isStart = scene.id === state.project.startSceneId;
    li.className = `${isSelected ? "selected" : ""} ${isStart ? "startScene" : ""}`.trim();

    if (scene.thumbnailDataUrl) {
      const thumb = document.createElement("img");
      thumb.className = "sceneThumb";
      thumb.src = scene.thumbnailDataUrl;
      thumb.alt = "";
      li.appendChild(thumb);
    }

    const name = document.createElement("span");
    name.textContent = scene.name;
    li.appendChild(name);

    if (isStart) {
      const badge = document.createElement("small");
      badge.className = "startBadge";
      badge.textContent = "★ Inicial";
      li.appendChild(badge);
    }

    li.onclick = async () => {
      const prevScene = currentScene();
      if (prevScene && typeof generateSceneThumbnail === "function") await generateSceneThumbnail(prevScene);
      selectSceneForEditing(scene.id);
    };

    els.sceneList.appendChild(li);
  });
}


function cleanupAudioReferences(audioId) {
  stopRuntimeAudio?.("scene", audioId);

  if (state.project.splash?.audioId === audioId) state.project.splash.audioId = "";

  (state.project.scenes || []).forEach(scene => {
    scene.audioIds = (scene.audioIds || []).filter(id => id !== audioId);
    if (scene.audioVolumes) delete scene.audioVolumes[audioId];

    (scene.objects || []).forEach(obj => {
      if (obj.audioId === audioId) obj.audioId = "";
    });

    scene.logic?.nodes?.forEach(node => {
      if (node.audioId === audioId) node.audioId = "";
    });
  });
}

function deleteAudioAsset(audioId) {
  const asset = audioAssetById(audioId);
  if (!asset) return;
  if (!confirm(`¿Eliminar el audio "${asset.name}" del proyecto? Se quitará también de escenas, nodos, objetos y splash.`)) return;

  cleanupAudioReferences(audioId);
  state.project.assets.audio = (state.project.assets.audio || []).filter(a => a.id !== audioId);
  renderAll();
  $("statusText").textContent = `Audio eliminado: ${asset.name}`;
}



function imageAssetUsageList(assetId) {
  const uses = [];
  if (!assetId || !state.project) return uses;

  state.project.scenes?.forEach(scene => {
    scene.objects?.forEach(obj => {
      if (obj.imageId === assetId) uses.push({ type: "object", scene, obj, label: `${scene.name} / ${obj.name}` });
      obj.states?.forEach(st => {
        if (st.imageId === assetId) uses.push({ type: "state", scene, obj, state: st, label: `${scene.name} / ${obj.name} / estado ${st.name}` });
      });
      if (obj.inventoryImageId === assetId) uses.push({ type: "inventoryObject", scene, obj, label: `${scene.name} / ${obj.name} / inventario` });
    });
  });

  state.project.inventoryModel?.items?.forEach(item => {
    if (item.imageId === assetId) uses.push({ type: "inventoryItem", item, label: `Inventario / ${item.name || item.id}` });
  });

  if (state.project.inventorySettings?.iconImageId === assetId) uses.push({ type: "inventoryIcon", label: "Icono de inventario" });
  if (state.project.splash?.imageId === assetId) uses.push({ type: "splash", label: "Splash inicial" });
  return uses;
}

function imageAssetUsageCount(assetId) {
  return imageAssetUsageList(assetId).length;
}

function applySelectedImageAssetToObject() {
  const assetId = state.selectedImageId;
  const obj = selectedObject();
  if (!assetId) {
    if ($("statusText")) $("statusText").textContent = "Selecciona primero una imagen del panel Assets.";
    return false;
  }
  if (!obj) {
    if ($("statusText")) $("statusText").textContent = "Selecciona primero un objeto para aplicarle la imagen.";
    return false;
  }

  obj.imageId = assetId;
  if (obj.type === "background") {
    obj.width = state.project.stage.width;
    obj.height = state.project.stage.height;
    obj.x = 0;
    obj.y = 0;
    obj.z = 0;
    obj.bgResize = obj.bgResize || "cover";
  }

  renderAll();
  if (typeof renderProperties === "function") renderProperties();
  if ($("statusText")) $("statusText").textContent = `Imagen aplicada a ${obj.name}.`;
  return true;
}

function deleteSelectedImageAsset() {
  const assetId = state.selectedImageId;
  if (!assetId) return;
  const asset = imageAssetById(assetId);
  if (!asset) return;

  const uses = imageAssetUsageList(assetId);
  if (uses.length) {
    alert(`No se puede eliminar "${asset.name || asset.id}" porque está en uso en ${uses.length} lugar(es):\n\n${uses.slice(0, 8).map(u => "• " + u.label).join("\n")}${uses.length > 8 ? "\n…" : ""}`);
    return;
  }

  if (!confirm(`¿Eliminar la imagen "${asset.name || asset.id}" del proyecto?`)) return;
  state.project.assets.images = (state.project.assets.images || []).filter(a => a.id !== assetId);
  state.selectedImageId = null;
  renderAll();
  if (typeof renderProperties === "function") renderProperties();
}

function replaceSelectedImageAssetWithFile(file) {
  const assetId = state.selectedImageId;
  if (!assetId || !file) return;
  const asset = imageAssetById(assetId);
  if (!asset) return;

  const reader = new FileReader();
  reader.onload = () => {
    replaceImageAssetData(assetId, file.name, file.type, reader.result, () => {
      renderAll();
      if (typeof renderProperties === "function") renderProperties();
      if ($("statusText")) $("statusText").textContent = `Imagen reemplazada: ${file.name}`;
    });
  };
  reader.readAsDataURL(file);
}

function updateSelectedImageAssetInfo() {
  const box = $("selectedImageAssetInfo");
  if (!box) return;
  const asset = imageAssetById(state.selectedImageId);
  if (!asset) {
    box.textContent = "Ninguna imagen seleccionada.";
    return;
  }
  const usage = imageAssetUsageCount(asset.id);
  const size = Number(asset.width || 0) && Number(asset.height || 0) ? ` · ${asset.width}×${asset.height}px` : "";
  box.textContent = `Seleccionada: ${asset.name || asset.id}${size} · usos: ${usage}`;
}


function renderAssets() {
  els.imageAssetGrid.innerHTML = "";
  const images = typeof imageAssetOptionsForSelect === "function"
    ? imageAssetOptionsForSelect()
    : (state.project.assets.images || []);

  images.forEach(asset => {
    const fullAsset = typeof imageAssetById === "function" ? imageAssetById(asset.id) : asset;
    const div = document.createElement("div");
    div.className = "asset imageAssetCard";
    if (state.selectedImageId === asset.id) div.classList.add("selected");
    div.dataset.assetId = asset.id;
    div.title = asset.name || asset.id;

    const img = document.createElement("img");
    img.src = fullAsset?.dataUrl || fullAsset?.src || asset.dataUrl || "";
    img.draggable = false;
    div.appendChild(img);

    const meta = document.createElement("div");
    meta.className = "assetMeta";
    const size = fullAsset?.width && fullAsset?.height ? ` · ${fullAsset.width}×${fullAsset.height}` : "";
    meta.textContent = `${asset.name || asset.id}${size}`;
    div.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "assetCardActions";

    const useBtn = document.createElement("button");
    useBtn.type = "button";
    useBtn.textContent = "Usar";
    useBtn.title = "Aplicar al objeto seleccionado";
    useBtn.onclick = e => {
      e.stopPropagation();
      state.selectedImageId = asset.id;
      applySelectedImageAssetToObject();
    };

    const replaceBtn = document.createElement("button");
    replaceBtn.type = "button";
    replaceBtn.textContent = "Reemplazar";
    replaceBtn.onclick = e => {
      e.stopPropagation();
      state.selectedImageId = asset.id;
      renderAssets();
      $("replaceImageAssetInput")?.click();
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "danger";
    deleteBtn.textContent = "Eliminar";
    deleteBtn.onclick = e => {
      e.stopPropagation();
      state.selectedImageId = asset.id;
      deleteSelectedImageAsset();
    };

    actions.appendChild(useBtn);
    actions.appendChild(replaceBtn);
    actions.appendChild(deleteBtn);
    div.appendChild(actions);

    div.onclick = () => {
      state.selectedImageId = asset.id;
      renderAssets();
      if ($("statusText")) $("statusText").textContent = `Imagen seleccionada: ${asset.name || asset.id}`;
    };

    div.ondblclick = () => {
      state.selectedImageId = asset.id;
      applySelectedImageAssetToObject();
    };

    els.imageAssetGrid.appendChild(div);
  });

  updateSelectedImageAssetInfo();

  els.audioAssetList.innerHTML = "";
  state.project.assets.audio.forEach(asset => {
    const div = document.createElement("div");
    div.className = "audioAsset assetRow";
    div.title = asset.name;

    const name = document.createElement("span");
    name.textContent = "🔊 " + asset.name;
    name.onclick = () => {
      const obj = selectedObject();
      if (obj) {
        obj.audioId = asset.id;
        renderAll();
        $("statusText").textContent = `Audio asignado a ${obj.name}.`;
      }
    };

    const testBtn = document.createElement("button");
    testBtn.type = "button";
    testBtn.className = "iconBtn";
    testBtn.title = "Probar audio";
    testBtn.textContent = "▶";
    testBtn.onclick = e => {
      e.stopPropagation();
      playAudioAsset(asset.id, { loop: false, scope: "preview", volume: 1 });
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "danger iconBtn";
    deleteBtn.title = "Eliminar audio del proyecto";
    deleteBtn.textContent = "×";
    deleteBtn.onclick = e => {
      e.stopPropagation();
      deleteAudioAsset(asset.id);
    };

    div.appendChild(name);
    div.appendChild(testBtn);
    div.appendChild(deleteBtn);
    els.audioAssetList.appendChild(div);
  });
}




function spriteClipNames(obj){return Object.keys(obj?.sprite?.clips||{idle:{from:0,to:0,fps:8,loop:true}})}
function activeSpriteClip(obj){return obj?.sprite?(obj.sprite.clips?.[obj.sprite.currentClip]||obj.sprite.clips?.idle||null):null}
function setSpriteFrame(obj,frame){if(!obj?.sprite)return;const total=Math.max(1,Number(obj.sprite.columns||1)*Number(obj.sprite.rows||1));obj.sprite.currentFrame=Math.max(0,Math.min(total-1,Number(frame)||0))}
function playObjectAnimation(obj, clipName = null, restart = true, modeOverride = null) {
  if (!obj?.sprite?.enabled) return false;

  const clips = obj.sprite.clips || {};
  const name = clipName || obj.sprite.currentClip || Object.keys(clips)[0];
  if (!clips[name]) return false;

  const sameClip = obj.sprite.currentClip === name;
  obj.sprite.currentClip = name;
  obj.sprite.playing = true;
  obj.sprite.modeOverride = modeOverride || "";

  if (restart || !sameClip) {
    obj.sprite.direction = 1;
    obj.sprite._accum = 0;
    obj.sprite._clipElapsed = 0;
    setSpriteFrame(obj, clips[name].from || 0);
  }

  return true;
}

function stopObjectAnimation(obj) {
  if (obj?.sprite) {
    obj.sprite.playing = false;
    obj.sprite._clipElapsed = 0;
  }
}

function normalizedClipMode(sprite, clip) {
  const raw = sprite.modeOverride || clip.mode || (clip.loop === false ? "once" : "loop");
  return String(raw || "loop").toLowerCase();
}

function frameForClipAtTime(clip, elapsedMs, fallbackFps = 8, direction = 1) {
  const from = Math.max(0, Number(clip.from || 0));
  const to = Math.max(from, Number(clip.to ?? from));
  const fps = Math.max(1, Number(clip.fps || fallbackFps || 8));
  const count = Math.max(1, to - from + 1);
  const stepIndex = Math.floor(elapsedMs / (1000 / fps));

  const mode = String(clip._mode || clip.mode || "loop").toLowerCase();

  if (mode === "pingpong") {
    if (count <= 1) return from;
    const cycle = count * 2 - 2;
    const pos = stepIndex % cycle;
    return from + (pos < count ? pos : cycle - pos);
  }

  if (mode === "once") {
    return Math.min(to, from + stepIndex);
  }

  // loop
  return from + (stepIndex % count);
}

function updateSpriteAnimations(dt) {
  const scene = currentScene();
  if (!scene) return;

  scene.objects.forEach(obj => {
    const s = obj.sprite;
    if (!s?.enabled || !s.playing) return;

    const c = activeSpriteClip(obj);
    if (!c) return;

    const from = Math.max(0, Number(c.from || 0));
    const to = Math.max(from, Number(c.to ?? from));
    const fps = Math.max(1, Number(c.fps || s.fps || 8));
    const mode = normalizedClipMode(s, c);

    s._clipElapsed = (s._clipElapsed || 0) + dt;

    const count = Math.max(1, to - from + 1);
    const totalFrames = Math.max(1, Number(s.columns || 1) * Number(s.rows || 1));

    // Si el clip pide frames fuera de la cuadrícula, se limita,
    // pero no se rompe el loop.
    let next;

    if (mode === "pingpong") {
      if (count <= 1) next = from;
      else {
        const stepIndex = Math.floor(s._clipElapsed / (1000 / fps));
        const cycle = count * 2 - 2;
        const pos = stepIndex % cycle;
        next = from + (pos < count ? pos : cycle - pos);
      }
    } else if (mode === "once") {
      const stepIndex = Math.floor(s._clipElapsed / (1000 / fps));
      next = Math.min(to, from + stepIndex);
      if (next >= to) s.playing = false;
    } else {
      const stepIndex = Math.floor(s._clipElapsed / (1000 / fps));
      next = from + (stepIndex % count);
    }

    setSpriteFrame(obj, Math.min(next, totalFrames - 1));
  });
}


function startPlayerMoveAnimation(player) {
  if (!player?.sprite?.enabled) return;

  const clip = player.sprite.moveClip || "run";
  const clips = player.sprite.clips || {};
  if (!clips[clip]) return;

  const alreadyWalking = player.sprite.currentClip === clip && player.sprite.playing && player._walkAnimActive;
  playObjectAnimation(player, clip, !alreadyWalking, "loop");
  player._walkAnimActive = true;
}

function stopPlayerMoveAnimation(player) {
  if (!player?.sprite?.enabled) return;

  player._walkAnimActive = false;
  const clip = player.sprite.stopClip || "idle";
  const clips = player.sprite.clips || {};

  if (clips[clip]) playObjectAnimation(player, clip, true, null);
  else player.sprite.playing = false;
}

function animationLoop(now){if(!state.animationTimer)return;const last=state.lastAnimationTime||now;state.lastAnimationTime=now;const dt=now-last;updateSpriteAnimations(dt);if(typeof updateTransformAnimations==='function')updateTransformAnimations(dt);evaluateHeldInputs();updateRuntimeElements();state.animationTimer=requestAnimationFrame(animationLoop)}
function startAnimationLoop(){if(state.animationTimer)return;state.lastAnimationTime=performance.now();state.animationTimer=requestAnimationFrame(animationLoop)}
function stopAnimationLoop(){if(state.animationTimer)cancelAnimationFrame(state.animationTimer);state.animationTimer=null}
function applySpriteBackground(div, obj, asset) {
  if (!obj.sprite?.enabled || !asset?.dataUrl) return false;

  const fw = Math.max(1, Number(obj.sprite.frameWidth || obj.width || 64));
  const fh = Math.max(1, Number(obj.sprite.frameHeight || obj.height || 64));
  const cols = Math.max(1, Number(obj.sprite.columns || 1));
  const rows = Math.max(1, Number(obj.sprite.rows || 1));

  obj.width = fw;
  obj.height = fh;

  div.classList.add("spriteSheet");
  div.style.width = `${fw}px`;
  div.style.height = `${fh}px`;
  div.style.backgroundImage = `url(${asset.dataUrl})`;
  div.style.backgroundRepeat = "no-repeat";
  div.style.backgroundPosition = spriteBackgroundPosition(obj);

  const sheetW = Math.max(fw * cols, Number(asset.width || asset.naturalWidth || asset.w || 0), fw);
  const sheetH = Math.max(fh * rows, Number(asset.height || asset.naturalHeight || asset.h || 0), fh);
  div.style.backgroundSize = `${sheetW}px ${sheetH}px`;

  return true;
}
function parseSpriteClips(text,fallback){try{const data=JSON.parse(text||"{}");if(!data||typeof data!=="object")throw new Error("invalid");return data}catch{alert("El JSON de clips no es válido.");return fallback}}



function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function defaultColliderForObject(obj) {
  const w = Number(obj?.width || 80);
  const h = Number(obj?.height || 80);

  if (obj?.type === "player") {
    return {
      enabled: true,
      required: true,
      visible: false,
      type: "box",
      x: w * 0.28,
      y: h * 0.70,
      width: w * 0.44,
      height: h * 0.22,
      userEnabled: true
    };
  }

  return { enabled: false, required: false, visible: false, type: "box", x: 0, y: 0, width: w, height: h, userEnabled: false };
}



function makeColliderPreset(obj, preset, options = {}) {
  const w = Number(obj?.width || 80);
  const h = Number(obj?.height || 80);
  const cx = w / 2;
  const cy = h / 2;
  const isPlayer = obj?.type === "player";
  const keepEnabled = options.keepEnabled !== false;
  const enabled = isPlayer ? true : (keepEnabled ? !!obj?.collider?.enabled : true);
  const visible = options.visible ?? true;
  const required = !!isPlayer;

  if (preset === "ellipse") return { enabled, required, visible, type: "ellipse", x: cx, y: cy, rx: w * .46, ry: h * .46, userEnabled: enabled };
  if (preset === "triangle") return { enabled, required, visible, type: "polygon", points: [{ x: cx, y: 0 }, { x: w, y: h }, { x: 0, y: h }], closed: true, userEnabled: enabled };
  if (preset === "quad") return { enabled, required, visible, type: "polygon", points: [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }], closed: true, userEnabled: enabled };
  if (preset === "polygon") return { enabled, required, visible, type: "polygon", points: [], closed: false, userEnabled: enabled };

  if (isPlayer) {
    return { enabled: true, required: true, visible, type: "box", x: w * .28, y: h * .70, width: w * .44, height: h * .22, userEnabled: true };
  }
  return { enabled, required, visible, type: "box", x: 0, y: 0, width: w, height: h, userEnabled: enabled };
}



function normalizeCollider(obj) {
  obj.collider ??= defaultColliderForObject(obj);

  if (obj.type === "player") {
    obj.collider.required = true;
    obj.collider.enabled = true;
    obj.collider.userEnabled = true;
  } else {
    obj.collider.required ??= false;
    if (obj.collider.enabled === undefined || obj.collider.enabled === null) {
      obj.collider.enabled = false;
    }
    obj.collider.userEnabled ??= !!obj.collider.enabled;
  }

  obj.collider.visible ??= false;

  if (!obj.collider.type) obj.collider.type = "box";

  if (obj.collider.type === "rect") obj.collider.type = "box";
  if (obj.collider.type === "circle") obj.collider.type = "ellipse";

  if (obj.collider.type === "box") {
    obj.collider.x ??= obj.type === "player" ? (obj.width || 80) * 0.28 : 0;
    obj.collider.y ??= obj.type === "player" ? (obj.height || 80) * 0.70 : 0;
    obj.collider.width ??= obj.type === "player" ? (obj.width || 80) * 0.44 : (obj.width || 80);
    obj.collider.height ??= obj.type === "player" ? (obj.height || 80) * 0.22 : (obj.height || 80);
  } else if (obj.collider.type === "ellipse") {
    obj.collider.x ??= (obj.width || 80) / 2;
    obj.collider.y ??= (obj.height || 80) / 2;
    obj.collider.rx ??= (obj.width || 80) / 2;
    obj.collider.ry ??= (obj.height || 80) / 2;
  } else if (obj.collider.type === "polygon") {
    obj.collider.points ??= [];
    obj.collider.closed ??= obj.collider.points.length >= 3;
  }

  return obj.collider;
}



function objectLocalToStage(obj, p) {
  const pos = objectScreenPosition(obj);
  const s = typeof objectEffectiveScale === "function" ? Number(objectEffectiveScale(obj) || 1) : Number(obj.scale || 1);
  const flip = obj.facing === -1 ? -1 : 1;
  let lx = Number(p.x || 0);
  const ly = Number(p.y || 0);
  if (flip === -1) lx = (obj.width || 0) - lx;
  return { x: pos.x + lx * s, y: pos.y + ly * s };
}

function stageToObjectLocal(obj, p) {
  const pos = objectScreenPosition(obj);
  const s = typeof objectEffectiveScale === "function" ? Number(objectEffectiveScale(obj) || 1) : (Number(obj.scale || 1) || 1);
  const flip = obj.facing === -1 ? -1 : 1;
  let lx = (p.x - pos.x) / s;
  const ly = (p.y - pos.y) / s;
  if (flip === -1) lx = (obj.width || 0) - lx;
  return { x: lx, y: ly };
}

function pointInColliderLocal(p, collider) {
  if (!collider || collider.enabled === false) return false;
  if (collider.type === "box") {
    return p.x >= collider.x && p.x <= collider.x + collider.width &&
           p.y >= collider.y && p.y <= collider.y + collider.height;
  }
  if (collider.type === "ellipse") {
    const rx = Math.max(0.0001, collider.rx || 1);
    const ry = Math.max(0.0001, collider.ry || 1);
    const dx = (p.x - collider.x) / rx;
    const dy = (p.y - collider.y) / ry;
    return dx * dx + dy * dy <= 1;
  }
  if (collider.type === "polygon") {
    const pts = collider.points || [];
    if (pts.length < 3 || collider.closed === false) return false;
    return isPointInPolygon(p, { points: pts });
  }
  return false;
}

function pointInObjectCollider(stagePointValue, obj) {
  if (!obj) return false;
  const c = normalizeCollider(obj);
  const local = stageToObjectLocal(obj, stagePointValue);
  return pointInColliderLocal(local, c);
}

function colliderLocalPoints(collider, segments = 18) {
  if (!collider) return [];
  if (collider.type === "box") {
    return [
      { x: collider.x, y: collider.y },
      { x: collider.x + collider.width, y: collider.y },
      { x: collider.x + collider.width, y: collider.y + collider.height },
      { x: collider.x, y: collider.y + collider.height }
    ];
  }
  if (collider.type === "ellipse") {
    const pts = [];
    for (let i = 0; i < segments; i++) {
      const a = Math.PI * 2 * i / segments;
      pts.push({ x: collider.x + Math.cos(a) * collider.rx, y: collider.y + Math.sin(a) * collider.ry });
    }
    return pts;
  }
  if (collider.type === "polygon") return collider.points || [];
  return [];
}

function getWorldCollider(obj) {
  if (!obj) return null;
  const local = normalizeCollider(obj);
  const points = colliderLocalPoints(local).map(p => objectLocalToStage(obj, p));
  const bounds = boundsFromPoints(points);
  return { objectId: obj.id, type: local.type, local, points, bounds };
}

function boundsFromPoints(points) {
  if (!points || !points.length) return null;
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function boxesOverlap(a, b) {
  if (!a || !b) return false;
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function segmentsIntersect(a, b, c, d) {
  const cross = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const onSeg = (p, q, r) => Math.min(p.x, q.x) <= r.x && r.x <= Math.max(p.x, q.x) &&
                              Math.min(p.y, q.y) <= r.y && r.y <= Math.max(p.y, q.y);
  const d1 = cross(a, b, c);
  const d2 = cross(a, b, d);
  const d3 = cross(c, d, a);
  const d4 = cross(c, d, b);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  if (Math.abs(d1) < 0.0001 && onSeg(a, b, c)) return true;
  if (Math.abs(d2) < 0.0001 && onSeg(a, b, d)) return true;
  if (Math.abs(d3) < 0.0001 && onSeg(c, d, a)) return true;
  if (Math.abs(d4) < 0.0001 && onSeg(c, d, b)) return true;
  return false;
}

function pointInWorldCollider(point, worldCollider) {
  if (!worldCollider?.points?.length) return false;
  if (!worldCollider.bounds || !boxesOverlap({ x: point.x, y: point.y, w: 0.01, h: 0.01 }, worldCollider.bounds)) return false;
  return isPointInPolygon(point, { points: worldCollider.points });
}

function collidersOverlap(a, b) {
  if (!a || !b || !boxesOverlap(a.bounds, b.bounds)) return false;
  const ap = a.points || [];
  const bp = b.points || [];
  if (ap.some(p => pointInWorldCollider(p, b))) return true;
  if (bp.some(p => pointInWorldCollider(p, a))) return true;
  for (let i = 0; i < ap.length; i++) {
    const a1 = ap[i], a2 = ap[(i + 1) % ap.length];
    for (let j = 0; j < bp.length; j++) {
      const b1 = bp[j], b2 = bp[(j + 1) % bp.length];
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}

function shouldShowObjectCollider(obj) {
  // Los helpers visuales no deben aparecer en modo Play.
  if (state.mode === "play") return false;

  return !!obj?.collider?.visible || !!state.showAllColliders || state.colliderEditor?.objectId === obj.id;
}

function drawColliderOverlay(parent, obj) {
  const c = normalizeCollider(obj);
  if (!c.enabled || !shouldShowObjectCollider(obj)) return;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("objectColliderOverlay");
  svg.setAttribute("viewBox", `0 0 ${obj.width || 1} ${obj.height || 1}`);
  svg.setAttribute("preserveAspectRatio", "none");

  let shape;
  if (c.type === "box") {
    shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    shape.setAttribute("x", c.x);
    shape.setAttribute("y", c.y);
    shape.setAttribute("width", c.width);
    shape.setAttribute("height", c.height);
  } else if (c.type === "ellipse") {
    shape = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    shape.setAttribute("cx", c.x);
    shape.setAttribute("cy", c.y);
    shape.setAttribute("rx", c.rx);
    shape.setAttribute("ry", c.ry);
  } else if (c.type === "polygon" && (c.points || []).length) {
    shape = document.createElementNS("http://www.w3.org/2000/svg", c.closed === false ? "polyline" : "polygon");
    shape.setAttribute("points", c.points.map(p => `${p.x},${p.y}`).join(" "));
  }
  if (shape) {
    shape.classList.add("colliderFill");
    svg.appendChild(shape);
  }

  if (c.type === "polygon") {
    (c.points || []).forEach(p => {
      const h = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      h.classList.add("colliderHandle");
      h.setAttribute("cx", p.x);
      h.setAttribute("cy", p.y);
      h.setAttribute("r", 4);
      svg.appendChild(h);
    });
  }

  parent.appendChild(svg);
}

function parallaxLayerMultiplier(layer) {
  /*
    v55: la capa 0 es la capa base.
    scene.parallaxStrength define el parallax mínimo/base de la escena.

    Multiplicadores:
      -1 -> 0.35  menos parallax
       0 -> 1.00  parallax base
      +1 -> 1.75  más parallax

    Si scene.parallaxStrength es 0, ninguna capa se desplaza.
    Si scene.parallaxStrength es negativo, el sentido del parallax se invierte.
  */
  const n = Number(layer || 0);
  if (n <= -1) return 0.35;
  if (n >= 1) return 1.75;
  return 1;
}
