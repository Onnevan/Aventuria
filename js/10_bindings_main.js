// AventurIA v54 Modular Base — 10_bindings_main.js
// Extraído de v53 funcional. Script clásico global; el orden de carga importa.

function bindUI() {
  bindColliderEditorUI();
  if ($("openColliderEditorBtn")) $("openColliderEditorBtn").onclick = () => {
    const obj = selectedObjectForColliderEditor();
    if (!obj) return alert("Selecciona primero un objeto o personaje.");
    state.selectedObjectId = obj.id;
    state.selectedPanel = "object";
    openColliderEditor(obj.id);
  };

  refreshNewNodeTypeOptions();
  $("newNodeCategory").onchange = refreshNewNodeTypeOptions;

  $("newMechanismBtn").onclick=createMechanism;
  $("deleteMechanismBtn").onclick=deleteSelectedMechanism;
  $("testMechanismBtn").onclick=()=>{const m=selectedMechanism();if(m)openMechanismRuntime(m.id);};
  $("addMechanismElementBtn").onclick=addMechanismElement;
  $("deleteMechanismElementBtn").onclick=deleteMechanismElement;
  $("addMechanismRuleBtn").onclick=addMechanismRule;
  $("mechanismName").addEventListener("input",e=>updateSelectedMechanismField("name",e.target.value));
  $("mechanismType").addEventListener("change",e=>updateSelectedMechanismField("type",e.target.value));
  $("mechanismSolvedMessage").addEventListener("input",e=>updateSelectedMechanismField("solvedMessage",e.target.value));
  $("mechanismUnlockObject").addEventListener("change",e=>updateSelectedMechanismField("unlockObjectId",e.target.value));
  $("mechanismCloseOnSolved").addEventListener("change",e=>updateSelectedMechanismField("closeOnSolved",e.target.checked));
  $("mechanismRulesJson").addEventListener("change",e=>{const m=selectedMechanism();if(!m)return;try{const data=JSON.parse(e.target.value||"{}");m.data.rules=data.rules||m.data.rules||[];m.data.sequence=data.sequence||m.data.sequence||[];m.data.solution=data.solution||m.data.solution||[];renderMechanisms();}catch{alert("JSON de mecanismo no válido.");}});
  $("mechanismElementName").addEventListener("input",e=>updateSelectedMechanismElement("name",e.target.value));
  $("mechanismElementType").addEventListener("change",e=>updateSelectedMechanismElement("type",e.target.value));
  $("mechanismElementValue").addEventListener("input",e=>updateSelectedMechanismElement("value",Number(e.target.value)||0));
  $("mechanismElementStates").addEventListener("input",e=>updateSelectedMechanismElement("states",Math.max(1,Number(e.target.value)||1)));
  $("mechanismElementX").addEventListener("input",e=>updateSelectedMechanismElement("x",Number(e.target.value)||0));
  $("mechanismElementY").addEventListener("input",e=>updateSelectedMechanismElement("y",Number(e.target.value)||0));
  $("mechanismElementTags").addEventListener("input",e=>updateSelectedMechanismElement("tags",e.target.value));
  if ($("mechanismElementImage")) $("mechanismElementImage").addEventListener("change",e=>updateSelectedMechanismElement("imageId",e.target.value));
  $("newProjectBtn").onclick = () => {
    if (!confirm("¿Crear un proyecto nuevo y perder cambios no guardados?")) return;
    lastSavedProjectHandle = null;
    createDefaultProject();
    updateProjectFileInfo("Proyecto nuevo sin archivo asociado.");
  };
  $("saveProjectBtn").onclick = () => saveProjectAve({ saveAs: false });
  if ($("saveAsAveBtn")) $("saveAsAveBtn").onclick = () => saveProjectAve({ saveAs: true });
  if ($("exportJsonBtn")) $("exportJsonBtn").onclick = exportProjectJson;
  if ($("publishProjectBtn")) $("publishProjectBtn").onclick = () => {
    alert("Publicar todavía no está implementado. Aquí irá la exportación jugable/publicable del proyecto.");
  };
  $("loadProjectBtn").onclick = () => $("loadProjectInput").click();
  if ($("saveLocalDbBtn")) $("saveLocalDbBtn").onclick = () => {
    if (!confirm("¿Guardar este proyecto localmente en este navegador? Se sobrescribirá la copia local anterior.")) return;
    saveToDb();
  };
  if ($("loadLocalDbBtn")) $("loadLocalDbBtn").onclick = () => {
    if (!confirm("¿Cargar el proyecto guardado localmente? Se reemplazará el proyecto actual no guardado.")) return;
    loadFromDb();
  };
  $("importImagesBtn").onclick = () => $("imageAssetInput").click();
  $("importAudioBtn").onclick = () => $("audioAssetInput").click();

  if ($("applySelectedImageToObjectBtn")) $("applySelectedImageToObjectBtn").onclick = () => applySelectedImageAssetToObject?.();
  if ($("deleteSelectedImageAssetBtn")) $("deleteSelectedImageAssetBtn").onclick = () => deleteSelectedImageAsset?.();
  if ($("replaceSelectedImageAssetBtn")) $("replaceSelectedImageAssetBtn").onclick = () => {
    if (!state.selectedImageId) return alert("Selecciona primero una imagen del panel Assets.");
    $("replaceImageAssetInput")?.click();
  };
  if ($("replaceImageAssetInput")) $("replaceImageAssetInput").onchange = e => {
    const file = e.target.files?.[0];
    if (file) replaceSelectedImageAssetWithFile?.(file);
    e.target.value = "";
  };

  $("loadInventoryIconBtn").onclick = () => $("inventoryIconInput").click();

  if ($("startSceneSelect")) $("startSceneSelect").addEventListener("change", e => {
    state.project.startSceneId = e.target.value || state.project.scenes[0]?.id || "";
  });
  if ($("splashEnabledInput")) $("splashEnabledInput").addEventListener("change", e => {
    state.project.splash.enabled = e.target.checked;
  });
  if ($("splashImageSelect")) $("splashImageSelect").addEventListener("change", e => {
    state.project.splash.imageId = e.target.value || "";
  });
  if ($("splashAudioSelect")) $("splashAudioSelect").addEventListener("change", e => {
    state.project.splash.audioId = e.target.value || "";
  });

  if ($("importSplashImageBtn")) $("importSplashImageBtn").onclick = () => $("splashImageInput").click();
  if ($("splashImageInput")) $("splashImageInput").onchange = e => {
    const file = e.target.files?.[0];
    if (!file) {
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const asset = typeof addImageAssetToProject === "function"
        ? addImageAssetToProject(file.name, file.type, reader.result)
        : { id: uid(), name: file.name, type: file.type, dataUrl: reader.result };
      if (typeof addImageAssetToProject !== "function") state.project.assets.images.push(asset);
      state.project.splash.imageId = asset.id;
      state.project.splash.enabled = true;
      renderAll();
      renderProjectStartSettings();
      $("statusText").textContent = `Imagen splash importada: ${file.name}`;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  if ($("importSplashAudioBtn")) $("importSplashAudioBtn").onclick = () => $("splashAudioInput").click();
  if ($("splashAudioInput")) $("splashAudioInput").onchange = e => {
    const file = e.target.files?.[0];
    if (!file) {
      e.target.value = "";
      return;
    }
    readAudioFilesAsAssets([file], added => {
      const asset = added?.[0];
      if (!asset) return;
      state.project.splash.audioId = asset.id;
      renderAll();
      renderProjectStartSettings();
      $("statusText").textContent = `Audio splash importado: ${file.name}`;
    });
    e.target.value = "";
  };
  if ($("splashDurationInput")) $("splashDurationInput").addEventListener("input", e => {
    state.project.splash.durationMs = Math.max(0, Number(e.target.value) || 0);
  });
  if ($("splashSkipInput")) $("splashSkipInput").addEventListener("change", e => {
    state.project.splash.allowSkip = e.target.checked;
  });

  if ($("sceneAudioMasterVolume")) $("sceneAudioMasterVolume").addEventListener("input", e => {
    const scene = currentScene();
    if (!scene) return;
    scene.audioMasterVolume = Math.max(0, Math.min(1, Number(e.target.value) || 0));
    applySceneAudioVolumes();
  });
  if ($("sceneAudioAutoplay")) $("sceneAudioAutoplay").addEventListener("change", e => {
    const scene = currentScene();
    if (!scene) return;
    scene.audioAutoplay = e.target.checked;
  });

  if ($("sceneAudioAddBtn")) $("sceneAudioAddBtn").onclick = () => {
    const scene = currentScene();
    const id = $("sceneAudioAddSelect")?.value || "";
    if (!scene || !id) return;
    scene.audioIds ??= [];
    if (!scene.audioIds.includes(id)) scene.audioIds.push(id);
    scene.audioVolumes ??= {};
    scene.audioVolumes[id] ??= 1;
    scene.audioAutoplay = true;
    renderSceneAudioSettings();
    renderNodeProps(selectedNode());
    $("statusText").textContent = "Audio asociado a la escena.";
  };

  if ($("sceneAudioImportBtn")) $("sceneAudioImportBtn").onclick = () => $("sceneAudioInput").click();

  if ($("sceneAudioInput")) $("sceneAudioInput").onchange = e => {
    const scene = currentScene();
    const files = e.target.files || [];
    if (!scene || !files.length) {
      e.target.value = "";
      return;
    }

    scene.audioIds ??= [];
    readAudioFilesAsAssets(files, added => {
      added.forEach(asset => {
        if (!scene.audioIds.includes(asset.id)) scene.audioIds.push(asset.id);
        scene.audioVolumes ??= {};
        scene.audioVolumes[asset.id] ??= 1;
        scene.audioAutoplay = true;
      });
      state.selectedPanel = "scene";
      renderAll();
      renderSceneProps();
      $("statusText").textContent = `${added.length} audio(s) importado(s) y asociado(s) a la escena.`;
    });

    e.target.value = "";
  };


  $("inventorySlotsInput").addEventListener("input", e => {
    state.project.inventorySettings.slots = Math.max(1, Number(e.target.value) || 1);
    if (state.inventory.length > state.project.inventorySettings.slots) {
      state.inventory = state.inventory.slice(0, state.project.inventorySettings.slots);
    }
    renderInventory();
  });
  if ($("inventorySlotSizeInput")) $("inventorySlotSizeInput").addEventListener("input", e => {
    const size = Math.max(24, Math.min(160, Number(e.target.value) || 72));
    state.project.inventorySettings.slotSize = size;
    state.project.inventorySettings.iconWidth = size;
    state.project.inventorySettings.iconHeight = size;
    if ($("inventoryIconWInput")) $("inventoryIconWInput").value = size;
    if ($("inventoryIconHInput")) $("inventoryIconHInput").value = size;
    renderInventory();
  });
  if ($("inventoryPositionInput")) $("inventoryPositionInput").addEventListener("change", e => {
    state.project.inventorySettings.position = e.target.value || "bottom-center";
    renderInventory();
  });
  $("inventoryFullMessageInput").addEventListener("input", e => {
    state.project.inventorySettings.fullMessage = e.target.value;
  });
  $("inventoryIconWInput").addEventListener("input", e => {
    state.project.inventorySettings.iconWidth = Math.max(16, Number(e.target.value) || 72);
    state.project.inventorySettings.slotSize = Math.max(state.project.inventorySettings.slotSize || 72, state.project.inventorySettings.iconWidth);
    if ($("inventorySlotSizeInput")) $("inventorySlotSizeInput").value = state.project.inventorySettings.slotSize;
    renderInventory();
  });
  $("inventoryIconHInput").addEventListener("input", e => {
    state.project.inventorySettings.iconHeight = Math.max(16, Number(e.target.value) || 72);
    state.project.inventorySettings.slotSize = Math.max(state.project.inventorySettings.slotSize || 72, state.project.inventorySettings.iconHeight);
    if ($("inventorySlotSizeInput")) $("inventorySlotSizeInput").value = state.project.inventorySettings.slotSize;
    renderInventory();
  });

  function updateMessageSetting(field, value) {
    state.project.messageSettings ??= {};
    state.project.messageSettings[field] = value;
    applyMessageSettings();
  }

  if ($("messagePositionInput")) $("messagePositionInput").addEventListener("change", e => updateMessageSetting("position", e.target.value));
  if ($("messageFontInput")) $("messageFontInput").addEventListener("input", e => updateMessageSetting("fontFamily", e.target.value || "Arial, sans-serif"));
  if ($("messageSizeInput")) $("messageSizeInput").addEventListener("input", e => updateMessageSetting("fontSize", Math.max(8, Number(e.target.value) || 18)));
  if ($("messageColorInput")) $("messageColorInput").addEventListener("input", e => updateMessageSetting("color", e.target.value));
  if ($("messageBgInput")) $("messageBgInput").addEventListener("input", e => updateMessageSetting("background", e.target.value));
  if ($("messageBgAlphaInput")) $("messageBgAlphaInput").addEventListener("input", e => updateMessageSetting("backgroundAlpha", Math.max(0, Math.min(1, Number(e.target.value) || 0))));
  if ($("messageRadiusInput")) $("messageRadiusInput").addEventListener("input", e => updateMessageSetting("borderRadius", Math.max(0, Number(e.target.value) || 0)));
  if ($("messageMaxWidthInput")) $("messageMaxWidthInput").addEventListener("input", e => updateMessageSetting("maxWidth", Math.max(20, Math.min(100, Number(e.target.value) || 80))));
  if ($("testMessageStyleBtn")) $("testMessageStyleBtn").onclick = () => showMessage("Este es un cartel de prueba.");

  $("loadImageForObjectBtn").onclick = () => {
    if (!selectedObject()) return alert("Selecciona primero un objeto en escena o en el outliner.");
    $("objectImageInput").click();
  };
  $("loadAudioForObjectBtn").onclick = () => {
    if (!selectedObject()) return alert("Selecciona primero un objeto en escena o en el outliner.");
    $("objectAudioInput").click();
  };

  $("loadProjectInput").onchange = e => {
    if (e.target.files[0]) loadProject(e.target.files[0]);
    e.target.value = "";
  };
  $("imageAssetInput").onchange = e => {
    readFilesAsAssets(e.target.files, "image");
    e.target.value = "";
  };
  $("audioAssetInput").onchange = e => {
    readAudioFilesAsAssets(e.target.files, () => {
      renderProjectStartSettings();
      renderSceneAudioSettings();
    });
    e.target.value = "";
  };
  $("objectImageInput").onchange = e => {
    loadAssetForSelectedObject(e.target.files[0], "image");
    e.target.value = "";
  };
  $("objectAudioInput").onchange = e => {
    loadAssetForSelectedObject(e.target.files[0], "audio");
    e.target.value = "";
  };
  $("inventoryIconInput").onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const asset = typeof addImageAssetToProject === "function"
        ? addImageAssetToProject(file.name, file.type, reader.result)
        : { id: uid(), name: file.name, type: file.type, dataUrl: reader.result };
      if (typeof addImageAssetToProject !== "function") state.project.assets.images.push(asset);
      state.project.inventorySettings.iconImageId = asset.id;
      renderAll();
      if (typeof renderProperties === "function") renderProperties();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  $("addSceneBtn").onclick = () => {
    addScene($("sceneNameInput").value.trim());
    $("sceneNameInput").value = "";
  };

  $("selectToolBtn").onclick = () => setTool("select");
  $("navToolBtn").onclick = () => setTool("nav");
  $("navEditToolBtn").onclick = () => setTool("navEdit");
  $("closeZoneBtn").onclick = closeDrawingZone;
  $("cancelZoneBtn").onclick = cancelDrawingZone;
  $("addPlayerBtn").onclick = () => addObject("player");
  $("addBackgroundBtn").onclick = () => addObject("background");
  $("addHotspotBtn").onclick = () => addObject("hotspot");
  $("addPropBtn").onclick = () => addObject("prop");
  $("createPrefabBtn").onclick = makePrefabFromSelectedObject;
  $("instantiatePrefabBtn").onclick = instantiateSelectedPrefab;
  $("deletePrefabBtn").onclick = deleteSelectedPrefab;
  $("duplicateBtn").onclick = duplicateSelected;
  $("deleteBtn").onclick = deleteSelected;

  $("editorModeBtn").onclick = () => setMode("editor");
  $("playModeBtn").onclick = () => setMode("play");
  $("stopModeBtn").onclick = stopPlaySession;
  $("nodesModeBtn").onclick = () => setMode("nodes");
  $("mechanismsModeBtn").onclick = () => setMode("mechanisms");
  $("animationsModeBtn").onclick = () => setMode("animations");
  if ($("physicsModeBtn")) $("physicsModeBtn").onclick = () => setMode("physics");
  $("addNodeBtn").onclick = addNode;
  $("testGraphBtn").onclick = () => runLogicGraphFromToolbar();
  $("deleteNodeBtn").onclick = deleteSelectedNode;
  $("deleteLinkBtn").onclick = deleteSelectedLink;


  const stageWrapEl = $("stageWrap");
  if (stageWrapEl) {
    stageWrapEl.addEventListener("wheel", e => {
      if (state.mode === "play") return;
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const current = Math.max(0.25, Math.min(4, Number(state.editorZoom || 1)));
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        setEditorZoom(current * factor, e);
      }
    }, { passive: false });
  }

  if ($("resetZoomBtn")) $("resetZoomBtn").onclick = () => resetEditorZoom();

  if (typeof bindTransformAnimationEditor === "function") bindTransformAnimationEditor();
  if (typeof bindPhysicsEditor === "function") bindPhysicsEditor();

  if (typeof bindStageDirectObjectDragFallback === "function") bindStageDirectObjectDragFallback();
  if (typeof bindPlayClickToMoveFallback === "function") bindPlayClickToMoveFallback();
  if (typeof bindDocumentPlayClickToMoveFallback === "function") bindDocumentPlayClickToMoveFallback();
  if (typeof bindDocumentPlayDirectClickRouter === "function") bindDocumentPlayDirectClickRouter();
  if (typeof bindRawPlayStageEventSniffer === "function") bindRawPlayStageEventSniffer();
  if (typeof bindPlayClickCatcherLayer === "function") bindPlayClickCatcherLayer();

  els.stage.onclick = handleStageClick;
  els.stage.addEventListener("mousemove", e => updateInventoryCursor(e.clientX, e.clientY));
  els.stage.ondblclick = handleStageDblClick;
  els.stage.oncontextmenu = e => {
    if (state.mode === "editor" && state.tool === "select" && selectedObject()) {
      e.preventDefault();
      placeSelectedObjectAt(stagePoint(e));
    }
  };

  els.stage.ondragover = e => e.preventDefault();
  els.stage.ondrop = e => {
    e.preventDefault();
    const p = stagePoint(e);

    const invObjectId = e.dataTransfer.getData("inventoryObjectId");
    if (invObjectId) {
      restoreInventoryObjectToScene(invObjectId, p);
      return;
    }

    const assetId = e.dataTransfer.getData("imageAssetId") || e.dataTransfer.getData("text/plain");
    if (!assetId) return;
    addObjectFromImage(assetId, p.x - 80, p.y - 80);
  };

  let wireMouseRaf = null;
  els.nodeCanvas.addEventListener("mousemove", e => {
    if (!state.connectingFrom) return;
    updateLogicMouse(e);
    document.querySelectorAll(".logicNode .port.input").forEach(p => p.classList.remove("connectTarget"));
    if (e.target?.classList?.contains("input")) e.target.classList.add("connectTarget");
    if (!wireMouseRaf) {
      wireMouseRaf = requestAnimationFrame(() => {
        wireMouseRaf = null;
        redrawLogicWiresOnly();
      });
    }
  });

  els.nodeCanvas.onclick = () => {
    state.connectingFrom = null;
    clearSelection();
    renderAll();
  };

  window.addEventListener("keydown", e => {
    if (e.key === "Enter" && state.mode === "editor" && state.tool === "nav" && state.navMode === "create" && state.drawingZone) {
      closeDrawingZone();
      return;
    }
    if (e.key === "Escape" && state.mode === "editor" && state.tool === "nav" && state.drawingZone) {
      cancelDrawingZone();
      return;
    }
    if (e.key === "Delete") {
      if (state.selectedZoneId && state.selectedZonePointIndex != null) deleteSelectedZonePoint();
      else deleteSelected();
    }
    if (e.key === "Escape" && state.mode === "play" && state.selectedInventoryItemId) {
      clearSelectedInventoryItem();
      showMessage("");
      return;
    }
    if (e.key === "Escape") {
      state.drawingZone = null;
      state.connectingFrom = null;
      renderAll();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
      e.preventDefault();
      duplicateSelected();
    }
  });
}

function duplicateObjectById(objectId) {
  const scene = currentScene();
  if (!scene || !objectId) return false;
  const obj = scene.objects.find(o => o.id === objectId);
  if (!obj) return false;

  pushUndoSnapshot?.(`Duplicar ${obj.name}`);

  const copy = JSON.parse(JSON.stringify(obj));
  copy.id = uid();
  copy.name += " copia";
  copy.x = Number(copy.x || 0) + 24;
  copy.y = Number(copy.y || 0) + 24;
  if (copy.physics) {
    copy.physics.startX = copy.x;
    copy.physics.startY = copy.y;
  }
  scene.objects.push(copy);
  clearSelection();
  state.selectedPanel = "object";
  state.selectedObjectId = copy.id;
  renderAll();
  return true;
}

function duplicateSelected() {
  return duplicateObjectById(state.selectedObjectId);
}


function deleteObjectById(objectId) {
  const scene = currentScene();
  if (!scene || !objectId) return false;
  const obj = scene.objects.find(o => o.id === objectId);
  if (!obj) return false;

  if (!confirm(`¿Eliminar "${obj.name}"?`)) return false;

  pushUndoSnapshot?.(`Eliminar ${obj.name}`);

  scene.objects = scene.objects.filter(o => o.id !== objectId);
  scene.logic.nodes = scene.logic.nodes.filter(n => n.objectId !== objectId && n.targetObjectId !== objectId);
  const validNodes = new Set(scene.logic.nodes.map(n => n.id));
  scene.logic.links = scene.logic.links.filter(l => validNodes.has(l.from) && validNodes.has(l.to));

  if (state.selectedObjectId === objectId) clearSelection();
  renderAll();
  return true;
}

function deleteSelected() {
  const scene = currentScene();
  if (!scene) return;

  if (state.selectedObjectId) {
    deleteObjectById(state.selectedObjectId);
    return;
  } else if (state.selectedNodeId) {
    pushUndoSnapshot?.("Eliminar nodo");
    deleteSelectedNode();
    return;
  } else if (state.selectedLinkId) {
    pushUndoSnapshot?.("Eliminar conexión");
    deleteSelectedLink();
    return;
  }
  renderAll();
}


bindUI();
if (typeof bindUndoRedo === "function") bindUndoRedo();
document.addEventListener("click", () => setTimeout(updateColliderToolbarButton, 0));
bindProps();
bindRuntimeInput();
createDefaultProject();



// Beta 0.7.48 diagnostic and emergency scene bindings
window.addEventListener("error", event => {
  console.error("AventurIA JS error:", event.error || event.message);
  const box = $("jsErrorBox");
  if (box) {
    box.classList.remove("hidden");
    box.textContent = `JS error: ${event.message}`;
  }
});

window.addEventListener("unhandledrejection", event => {
  console.error("AventurIA promise error:", event.reason);
  const box = $("jsErrorBox");
  if (box) {
    box.classList.remove("hidden");
    box.textContent = `Promise error: ${event.reason?.message || event.reason}`;
  }
});

function bindEmergencySceneButtons() {
  const hardBind = (id, fn) => {
    const el = $(id);
    if (!el || el.dataset.emergencyBound === "1") return;
    el.dataset.emergencyBound = "1";
    el.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      fn(e);
    });
  };

  hardBind("addSceneBtn", () => {
    const input = $("sceneNameInput");
    createSceneEmergency(input?.value?.trim?.() || "");
    if (input) input.value = "";
  });
["addPlayerBtn", "addBackgroundBtn", "addHotspotBtn", "addPropBtn"].forEach(id => {
    const type = id === "addPlayerBtn" ? "player" : id === "addBackgroundBtn" ? "background" : id === "addHotspotBtn" ? "hotspot" : "prop";
    hardBind(id, () => {
      if (!currentScene?.()) createSceneEmergency("Escena 1");
      addObject(type);
    });
  });
}

setTimeout(() => {
  bindEmergencySceneButtons();
  if (typeof ensureSceneOneEmergency === "function") {
    ensureSceneOneEmergency();
    try { renderAll?.(); } catch (err) { console.error("renderAll startup repair failed", err); }
  }
}, 50);

document.addEventListener("click", e => {
  if (e.target?.closest?.("#addSceneBtn,#addPlayerBtn,#addBackgroundBtn,#addHotspotBtn,#addPropBtn")) {
    setTimeout(bindEmergencySceneButtons, 0);
  }
}, true);
