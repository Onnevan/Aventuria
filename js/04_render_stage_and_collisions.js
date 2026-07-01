// AventurIA v54 Modular Base — 04_render_stage_and_collisions.js
// Extraído de v53 funcional. Script clásico global; el orden de carga importa.

function objectEffectiveX(obj) { return obj?._transformAnimValue?.x ?? obj.x; }
function objectEffectiveY(obj) { return obj?._transformAnimValue?.y ?? obj.y; }
function objectEffectiveScale(obj) { return obj?._transformAnimValue?.scale ?? obj.scale ?? 1; }
function objectEffectiveRotation(obj) { return obj?._transformAnimValue?.rotation ?? obj.rotation ?? 0; }

function objectScreenPosition(obj) {
  let px = objectEffectiveX(obj);
  let py = objectEffectiveY(obj);

  if (state.mode === "play") {
    const scene = currentScene();
    const cam = cameraOffsetFromPlayer();
    const strength = Number(scene?.parallaxStrength ?? 0);
    const layer = typeof normalizeParallaxLayer === "function" ? normalizeParallaxLayer(obj.parallaxLayer) : 0;
    const factor = parallaxLayerMultiplier(layer) * strength;

    if (factor) {
      px += cam.x * factor;
      py += cam.y * factor;
    }
  }

  return { x: px, y: py };
}


const OCCLUSION_Z_DEPTH_PRECISION = 1000;

function fixedObjectZIndex(obj) {
  return obj?.type === "background" ? 1 + Number(obj.z ?? 0) : 100 + Number(obj?.z ?? 0);
}

function computeObjectDepthY(obj) {
  if (!obj) return 0;
  const occ = typeof ensureOcclusionConfig === "function" ? ensureOcclusionConfig(obj) : (obj.occlusion || {});
  const offset = Number(occ.offsetY || 0);
  const scale = Number(obj.scale || 1);

  if (obj.type === "player") {
    return Number(obj.y || 0) + Number(obj.height || 0) * scale + offset;
  }

  if (!occ.enabled) return fixedObjectZIndex(obj);

  if (occ.mode === "footprint" && typeof objectHasUsableFootprint === "function" && objectHasUsableFootprint(obj)) {
    const bounds = typeof getPathFootprintWorldBounds === "function" ? getPathFootprintWorldBounds(obj) : null;
    if (bounds) {
      if (occ.depthMode === "behind") return bounds.top + offset;
      return bounds.bottom + offset;
    }
  }

  return Number(obj.y || 0) + Number(obj.height || 0) * scale + offset;
}

function computeVisualDepthZ(obj) {
  if (!obj) return 0;
  const depthY = computeObjectDepthY(obj);
  const occ = obj.occlusion || {};

  if (obj.type === "player") {
    return Math.round(depthY);
  }

  if (!occ.enabled) return fixedObjectZIndex(obj);

  if (occ.onlyPlayers) {
    // Composite: manual z drives primary layer, depth Y is sub-layer
    // This prevents prop-to-prop flickering while letting the player
    // sort correctly based on Y position
    const baseZ = Math.max(0, Number(obj.z ?? 0));
    return baseZ * OCCLUSION_Z_RANGE + Math.round(depthY % OCCLUSION_Z_RANGE);
  }

  // Full dynamic: depth Y dominates, manual z is tiebreaker
  return Math.round(depthY * OCCLUSION_Z_DEPTH_PRECISION) + Math.max(0, Number(obj.z ?? 0));
}

function objectTransform(obj) {
  const p = objectScreenPosition(obj);
  const flip = obj.facing === -1 ? -1 : 1;
  const sc = objectEffectiveScale(obj);
  return `translate3d(${p.x}px, ${p.y}px, 0) scale(${sc * flip}, ${sc}) rotate(${objectEffectiveRotation(obj)}deg)`;
}

function spriteBackgroundPosition(obj) {
  if (!obj.sprite?.enabled) return null;
  const fw = Number(obj.sprite.frameWidth || obj.width || 64);
  const fh = Number(obj.sprite.frameHeight || obj.height || 64);
  const cols = Math.max(1, Number(obj.sprite.columns || 1));
  const frame = Math.max(0, Number(obj.sprite.currentFrame || 0));
  const col = frame % cols;
  const row = Math.floor(frame / cols);
  return `${-col * fw}px ${-row * fh}px`;
}

let _depthCacheFrame = 0;
const _depthCache = new Map();

function invalidateDepthCache() {
  _depthCache.clear();
  _depthCacheFrame = 0;
}

function cachedComputeVisualDepthZ(obj, force = false) {
  if (!obj) return 0;
  if (force || !_depthCache.has(obj.id)) {
    _depthCache.set(obj.id, computeVisualDepthZ(obj));
  }
  return _depthCache.get(obj.id);
}

function invalidateDepthCacheFor(obj) {
  if (obj) _depthCache.delete(obj.id);
}

function tickDepthCache() {
  _depthCacheFrame++;
  if (_depthCacheFrame > 60) {
    _depthCache.clear();
    _depthCacheFrame = 0;
  }
}

function updateObjectElement(obj) {
  const el = els.stage.querySelector(`[data-id="${obj.id}"]`);
  if (!el) return;
  el.style.transform = objectTransform(obj);
  invalidateDepthCacheFor(obj);
  el.style.zIndex = String(cachedComputeVisualDepthZ(obj));
  const bgPos = spriteBackgroundPosition(obj);
  if (bgPos) el.style.backgroundPosition = bgPos;
}

function updateRuntimeElements() {
  const scene = currentScene();
  if (!scene) return;
  scene.objects.forEach(updateObjectElement);
}

function cameraOffsetFromPlayer() {
  const player = getPlayer();
  if (!player) return { x: 0, y: 0 };
  const centerX = player.x + player.width * (player.scale || 1) / 2;
  const centerY = player.y + player.height * (player.scale || 1) / 2;
  return {
    x: centerX - state.project.stage.width / 2,
    y: centerY - state.project.stage.height / 2
  };
}


function getImageHitCanvas(asset) {
  if (!asset?.id || !asset?.dataUrl) return null;
  const cached = state.imageHitCache?.[asset.id];
  if (cached?.ready) return cached;
  if (cached?.loading) return null;

  state.imageHitCache ??= {};
  const img = new Image();
  const record = { loading: true, ready: false, img, canvas: null, ctx: null };
  state.imageHitCache[asset.id] = record;

  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      record.canvas = canvas;
      record.ctx = ctx;
      record.ready = true;
      record.loading = false;
    } catch (err) {
      record.loading = false;
      record.ready = false;
    }
  };
  img.onerror = () => {
    record.loading = false;
    record.ready = false;
  };
  img.src = asset.dataUrl;
  return null;
}

function pointHitsVisiblePixel(obj, point, alphaThreshold = 18) {
  if (!obj?.imageId) return true;
  const asset = imageAssetById(effectiveObjectImageId(obj));
  if (!asset?.dataUrl) return true;

  const hit = getImageHitCanvas(asset);
  if (!hit?.ready || !hit.ctx || !hit.canvas) return true;

  const local = typeof stageToObjectLocal === "function"
    ? stageToObjectLocal(point, obj)
    : { x: point.x - obj.x, y: point.y - obj.y };

  if (local.x < 0 || local.y < 0 || local.x > obj.width || local.y > obj.height) return false;

  const x = Math.max(0, Math.min(hit.canvas.width - 1, Math.floor((local.x / Math.max(1, obj.width)) * hit.canvas.width)));
  const y = Math.max(0, Math.min(hit.canvas.height - 1, Math.floor((local.y / Math.max(1, obj.height)) * hit.canvas.height)));
  const alpha = hit.ctx.getImageData(x, y, 1, 1).data[3];
  return alpha > alphaThreshold;
}

function shouldObjectReceivePlayClick(obj, point) {
  if (!pointInObjectCollider(point, obj)) return false;

  const effectiveAction = obj.type === "item" && (!obj.action || obj.action === "none") ? "pickup" : obj.action;
  const isPickupLike = obj.type === "item" || effectiveAction === "pickup";
  const isHardInteractive = ["hotspot", "door", "character"].includes(obj.type) || obj.useItemEnabled || effectiveAction === "goto" || effectiveAction === "runGraph";

  // Los objetos recogibles deben ser fáciles de recoger: basta con el collider.
  if (isPickupLike) return true;

  // Hotspots/puertas/personajes también se resuelven por collider para no hacerlos invisibles
  // por culpa de PNGs con zonas transparentes o sprites.
  if (isHardInteractive) return true;

  // Props/decoración grandes sí dejan pasar el clic si se pulsa en píxeles transparentes.
  return pointHitsVisiblePixel(obj, point);
}


function applyEditorZoom() {
  if (!els.stage) return;

  const zoom = state.mode === "play" ? 1 : Math.max(0.25, Math.min(4, Number(state.editorZoom || 1)));
  els.stage.style.transform = `scale(${zoom})`;

  const wrap = $("stageWrap");
  if (wrap) {
    els.stage.style.marginRight = `${Math.max(0, (zoom - 1) * state.project.stage.width)}px`;
    els.stage.style.marginBottom = `${Math.max(0, (zoom - 1) * state.project.stage.height)}px`;
  }

  const label = $("zoomStatus");
  if (label) label.textContent = `${Math.round(zoom * 100)}%`;
}

function setEditorZoom(nextZoom, anchorClientPoint = null) {
  if (state.mode === "play") return;

  const wrap = $("stageWrap");
  const oldZoom = Math.max(0.25, Math.min(4, Number(state.editorZoom || 1)));
  const zoom = Math.max(0.25, Math.min(4, nextZoom));
  if (Math.abs(zoom - oldZoom) < 0.001) return;

  let anchor = null;
  if (wrap && anchorClientPoint) {
    const rect = wrap.getBoundingClientRect();
    anchor = {
      x: anchorClientPoint.clientX - rect.left + wrap.scrollLeft,
      y: anchorClientPoint.clientY - rect.top + wrap.scrollTop
    };
  }

  state.editorZoom = zoom;
  applyEditorZoom();

  if (wrap && anchor) {
    const ratio = zoom / oldZoom;
    wrap.scrollLeft = anchor.x * ratio - (anchorClientPoint.clientX - wrap.getBoundingClientRect().left);
    wrap.scrollTop = anchor.y * ratio - (anchorClientPoint.clientY - wrap.getBoundingClientRect().top);
  }
}

function resetEditorZoom() {
  state.editorZoom = 1;
  applyEditorZoom();
}


function canShowTransformGizmos(obj) {
  if (!obj || obj.type === "background" || obj.locked) return false;
  return ((state.mode === "editor" && state.tool === "select") || state.mode === "animations") && obj.id === state.selectedObjectId;
}

function appendTransformGizmos(div, obj) {
  if (!canShowTransformGizmos(obj)) return;

  const layer = document.createElement("div");
  layer.className = "transformGizmoLayer";

  ["nw", "ne", "sw", "se"].forEach(pos => {
    const h = document.createElement("button");
    h.type = "button";
    h.className = `transformHandle scaleHandle ${pos}`;
    h.title = "Escalar";
    h.dataset.handle = pos;
    h.addEventListener("pointerdown", e => startScaleGizmo(e, div, obj, pos));
    layer.appendChild(h);
  });

  const rot = document.createElement("button");
  rot.type = "button";
  rot.className = "transformHandle rotateHandle";
  rot.title = "Rotar";
  rot.addEventListener("pointerdown", e => startRotateGizmo(e, div, obj));
  layer.appendChild(rot);

  div.appendChild(layer);
}

function objectCenterStage(obj) {
  // Con transform-origin: 50% 50%, el pivote geométrico es el centro sin escalar.
  // La escala modifica el tamaño alrededor de ese punto, no desplaza el pivote.
  return {
    x: Number(obj.x || 0) + Number(obj.width || 0) / 2,
    y: Number(obj.y || 0) + Number(obj.height || 0) / 2
  };
}


function syncAnimationGizmoKey(obj, changedProps = []) {
  if (state.mode !== "animations" || !obj || typeof selectedTransformClip !== "function") return;
  const clip = selectedTransformClip();
  if (!clip || typeof upsertTrackKey !== "function") return;

  const t = Math.max(0, Math.min(animationTimelineDuration(clip), Number(state.animationTimelineTime || 0)));
  const easing = $("transformKeyEasing")?.value || "linear";

  changedProps.forEach(prop => {
    const value = prop === "x" ? obj.x :
      prop === "y" ? obj.y :
      prop === "rotation" ? (obj.rotation || 0) :
      prop === "scale" ? (obj.scale || 1) : null;
    if (value == null) return;
    upsertTrackKey(obj, clip, prop, t, value, easing);
  });

  if (typeof renderAnimationTimeline === "function") renderAnimationTimeline();
}

function syncAnimationGizmoFieldsOnly(obj) {
  updateTransformNumericFields(obj);
  if (state.mode === "animations" && typeof updateAnimationPreview === "function") {
    updateAnimationPreview();
  }
}

function updateTransformNumericFields(obj) {
  if (!obj) return;
  if ($("propX")) $("propX").value = Math.round(obj.x || 0);
  if ($("propY")) $("propY").value = Math.round(obj.y || 0);
  if ($("propRotation")) $("propRotation").value = Number(obj.rotation || 0).toFixed(1).replace(/\.0$/, "");
  if ($("propScale")) $("propScale").value = Number(obj.scale || 1).toFixed(3).replace(/0+$/, "").replace(/\.$/, "");

  if ($("transformKeyX")) $("transformKeyX").value = Math.round(obj.x || 0);
  if ($("transformKeyY")) $("transformKeyY").value = Math.round(obj.y || 0);
  if ($("transformKeyRotation")) $("transformKeyRotation").value = Number(obj.rotation || 0).toFixed(1).replace(/\.0$/, "");
  if ($("transformKeyScale")) $("transformKeyScale").value = Number(obj.scale || 1).toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function pointerStagePointFromClient(clientX, clientY) {
  const rect = els.stage.getBoundingClientRect();
  const zoom = state.mode === "play" ? 1 : Math.max(0.25, Math.min(4, Number(state.editorZoom || 1)));
  return {
    x: (clientX - rect.left) / zoom,
    y: (clientY - rect.top) / zoom
  };
}

function startScaleGizmo(e, div, obj, handle) {
  if (!canShowTransformGizmos(obj)) return;
  e.preventDefault();
  e.stopPropagation();

  const start = pointerStagePointFromClient(e.clientX, e.clientY);
  const center = objectCenterStage(obj);
  const baseScale = Number(obj.scale || 1) || 1;
  const baseDist = Math.max(8, Math.hypot(start.x - center.x, start.y - center.y));

  const move = ev => {
    ev.preventDefault();
    const p = pointerStagePointFromClient(ev.clientX, ev.clientY);
    const dist = Math.max(2, Math.hypot(p.x - center.x, p.y - center.y));
    obj.scale = Math.max(0.05, Math.min(20, baseScale * (dist / baseDist)));
    div.style.transform = objectTransform(obj);
    syncAnimationGizmoFieldsOnly(obj);
  };

  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    syncAnimationGizmoKey(obj, ["scale"]);
    renderStage();
    renderProperties();
    if (typeof renderTransformAnimationEditor === "function") renderTransformAnimationEditor();
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}


function startRotateGizmo(e, div, obj) {
  if (!canShowTransformGizmos(obj)) return;
  e.preventDefault();
  e.stopPropagation();

  const center = objectCenterStage(obj);
  const start = pointerStagePointFromClient(e.clientX, e.clientY);
  const startAngle = Math.atan2(start.y - center.y, start.x - center.x) * 180 / Math.PI;
  const baseRotation = Number(obj.rotation || 0);

  const move = ev => {
    ev.preventDefault();
    const p = pointerStagePointFromClient(ev.clientX, ev.clientY);
    const a = Math.atan2(p.y - center.y, p.x - center.x) * 180 / Math.PI;
    obj.rotation = baseRotation + (a - startAngle);
    div.style.transform = objectTransform(obj);
    syncAnimationGizmoFieldsOnly(obj);
  };

  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    syncAnimationGizmoKey(obj, ["rotation"]);
    renderStage();
    renderProperties();
    if (typeof renderTransformAnimationEditor === "function") renderTransformAnimationEditor();
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}



function canShowPathEditorOverlay() {
  return state.mode === "animations" && state.selectedAnimationTab === "path" && typeof selectedPathData === "function";
}

function renderPathEditorOverlay() {
  if (!canShowPathEditorOverlay()) return;
  const obj = selectedAnimObject?.();
  const clip = selectedTransformClip?.();
  const path = selectedPathData?.();
  if (!obj || !clip || !path) return;

  const layer = document.createElement("div");
  layer.className = "pathEditorOverlay";

  if (path.points.length) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("pathEditorSvg");
    svg.setAttribute("width", state.project.stage.width);
    svg.setAttribute("height", state.project.stage.height);

    const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    const pts = [...path.points, ...(path.closed && path.points.length > 2 ? [path.points[0]] : [])]
      .map(p => `${p.x},${p.y}`).join(" ");
    poly.setAttribute("points", pts);
    poly.setAttribute("class", "pathEditorLine");
    svg.appendChild(poly);

    layer.appendChild(svg);
  }

  path.points.forEach((p, i) => {
    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = `pathPointHandle ${i === Number(state.selectedPathPointIndex || 0) ? "selected" : ""}`;
    handle.style.left = `${p.x}px`;
    handle.style.top = `${p.y}px`;
    handle.title = `Punto path ${i + 1}`;
    handle.onclick = e => {
      e.stopPropagation();
      state.selectedPathPointIndex = i;
      renderPathEditor?.();
      renderStage();
    };
    handle.onpointerdown = e => {
      e.preventDefault();
      e.stopPropagation();
      state.selectedPathPointIndex = i;
      const start = stagePoint(e);
      const base = { x: p.x, y: p.y };

      const move = ev => {
        ev.preventDefault();
        const now = stagePoint(ev);
        p.x = base.x + now.x - start.x;
        p.y = base.y + now.y - start.y;
        renderPathEditor?.();
        updateAnimationPreview?.();
        renderStage();
      };

      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        renderPathEditor?.();
        renderStage();
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    };
    layer.appendChild(handle);
  });

  els.stage.appendChild(layer);
}


function canEditorDirectDragObject(obj) {
  if (!obj || obj.locked || obj.type === "background") return false;
  if (state.mode === "editor") return true;
  if (state.mode === "physics") return true;
  if (state.mode === "animations") return true;
  return false;
}

function startSceneObjectDragFromPointer(e, obj) {
  if (!canEditorDirectDragObject(obj)) return false;
  if (e.target?.classList?.contains("transformHandle")) return false;

  // En Editor/Animaciones/Física, el arrastre manual tiene prioridad absoluta.
  // Matter.js no debe seguir vivo ni retener cuerpos/capturas después de Play o Preview.
  if (state.mode !== "play" && typeof forceStopPhysicsForEditor === "function") {
    forceStopPhysicsForEditor("manualEditorDrag");
  }

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation?.();

  const captureTarget = e.currentTarget || e.target;
  try {
    if (e.pointerId != null && captureTarget?.setPointerCapture) {
      captureTarget.setPointerCapture(e.pointerId);
    }
  } catch (err) {}

  clearSelection();
  state.selectedPanel = "object";
  state.selectedObjectId = obj.id;

  const startClientX = e.clientX;
  const startClientY = e.clientY;
  const baseX = Number(obj.x || 0);
  const baseY = Number(obj.y || 0);
  const zoom = Math.max(0.25, Math.min(4, Number(state.editorZoom || 1)));
  let undoPushed = false;
  let moved = false;

  const objectEl = els.stage?.querySelector(`[data-id="${obj.id}"]`);
  objectEl?.classList.add("selected", "dragging");
  state._editorDraggingObjectId = obj.id;

  function move(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation?.();

    const dx = (ev.clientX - startClientX) / zoom;
    const dy = (ev.clientY - startClientY) / zoom;

    if (Math.abs(dx) + Math.abs(dy) > 1) {
      moved = true;
      if (!undoPushed) {
        pushUndoSnapshot?.(`Mover ${obj.name}`);
        undoPushed = true;
      }
    }

    obj.x = baseX + dx;
    obj.y = baseY + dy;

    // Si el objeto tiene física, la posición inicial física se actualiza al moverlo en editor.
    // Así Matter.js no intenta devolverlo a una posición vieja al volver a Play.
    if (obj.physics) {
      obj.physics.startX = obj.x;
      obj.physics.startY = obj.y;
      obj.physics.startRotation = Number(obj.rotation || 0);
    }

    const el = els.stage?.querySelector(`[data-id="${obj.id}"]`);
    if (el) el.style.transform = objectTransform(obj);

    if ($("propX")) $("propX").value = Math.round(obj.x);
    if ($("propY")) $("propY").value = Math.round(obj.y);

    if (typeof syncPhysicsEditorOverlay === "function") syncPhysicsEditorOverlay();
    if (state.mode === "animations" && typeof updateAnimationPreview === "function") updateAnimationPreview();
  }

  function up(ev) {
    ev?.preventDefault?.();
    ev?.stopPropagation?.();
    ev?.stopImmediatePropagation?.();

    document.removeEventListener("pointermove", move, true);
    document.removeEventListener("pointerup", up, true);
    document.removeEventListener("pointercancel", up, true);

    try {
      if (e.pointerId != null && captureTarget?.releasePointerCapture) {
        captureTarget.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}

    state._editorDraggingObjectId = null;
    objectEl?.classList.remove("dragging");

    if (obj.physics) {
      obj.physics.startX = obj.x;
      obj.physics.startY = obj.y;
      obj.physics.startRotation = Number(obj.rotation || 0);
    }

    if (state.mode === "animations" && moved && typeof syncAnimationGizmoKey === "function") {
      syncAnimationGizmoKey(obj, ["x", "y"]);
    }

    if (typeof forceStopPhysicsForEditor === "function" && state.mode !== "play") {
      forceStopPhysicsForEditor("manualEditorDragEnd");
    }

    renderStage();
    renderOutliner();
    renderProperties();
  }

  document.addEventListener("pointermove", move, { capture: true, passive: false });
  document.addEventListener("pointerup", up, { capture: true, once: true });
  document.addEventListener("pointercancel", up, { capture: true, once: true });

  renderOutliner();
  renderProperties();
  return true;
}


function bindStageDirectObjectDragFallback() {
  if (!els.stage || els.stage._directObjectDragBound) return;
  els.stage._directObjectDragBound = true;

  els.stage.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    if (state.mode !== "editor" && state.mode !== "physics" && state.mode !== "animations") return;

    const objectEl = e.target?.closest?.(".sceneObject");
    if (!objectEl) return;

    const obj = currentScene()?.objects?.find(o => o.id === objectEl.dataset.id);
    if (!obj) return;

    if (startSceneObjectDragFromPointer(e, obj)) return;
  }, true);
}



function ensurePhysicsDebugLayerInStage() {
  let layer = $("physicsDebugLayer");
  if (!layer) {
    layer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    layer.id = "physicsDebugLayer";
    layer.classList.add("physicsDebugLayer");
  }
  layer.style.pointerEvents = "none";
  if (els.stage && layer.parentNode !== els.stage) els.stage.appendChild(layer);
  return layer;
}



function ensurePathfindingDebugLayerInStage() {
  let layer = $("pathfindingDebugLayer");
  if (!layer) {
    layer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    layer.id = "pathfindingDebugLayer";
    layer.classList.add("pathfindingDebugLayer");
  }
  layer.style.pointerEvents = "none";
  if (els.stage && layer.parentNode !== els.stage) els.stage.appendChild(layer);
  return layer;
}



function ensurePlayMoveTestButton() {
  let btn = $("playMoveTestBtn");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "playMoveTestBtn";
    btn.type = "button";
    btn.textContent = "Test directo sin Pathfinding";
    btn.className = "playMoveTestBtn hidden";
    btn.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      const player = typeof getPlayer === "function" ? getPlayer() : null;
      if (!player) {
        showMessage("No hay Player en esta escena.");
        return;
      }
      const target = {
        x: Math.min(state.project.stage.width - 80, computePlayerFootPoint(player).x + 220),
        y: computePlayerFootPoint(player).y
      };
      if ($("statusText")) $("statusText").textContent = "Test mover Player ejecutado.";
      movePlayerTo(target);
    };
  }
  btn.classList.toggle("hidden", state.mode !== "play");
  if (els.stage && btn.parentNode !== els.stage) els.stage.appendChild(btn);

  let domBtn = $("playDomTeleportBtn");
  if (!domBtn) {
    domBtn = document.createElement("button");
    domBtn.id = "playDomTeleportBtn";
    domBtn.type = "button";
    domBtn.textContent = "Teleport Player DOM";
    domBtn.className = "playDomTeleportBtn hidden";
    domBtn.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof teleportPlayerDomOnly === "function") teleportPlayerDomOnly("Botón DOM");
    };
  }
  domBtn.classList.toggle("hidden", state.mode !== "play");
  if (els.stage && domBtn.parentNode !== els.stage) els.stage.appendChild(domBtn);
  return btn;
}



function ensurePlayClickCatcherLayer() {
  const layer = $("playClickCatcherLayer");
  if (layer) layer.remove();
  return null;
}



function ensurePlayClickDebugMarker() {
  const marker = $("playClickDebugMarker");
  if (marker) marker.remove();
  return null;
}



function ensurePlayFloorButtonLayer() {
  let layer = $("playFloorButtonLayer");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "playFloorButtonLayer";
    layer.className = "playFloorButtonLayer hidden";
    layer.title = "Capa de clic de suelo";
  }

  layer.classList.toggle("hidden", state.mode !== "play");

  layer.onpointerdown = e => {
    if (state.mode !== "play") return;
    if (e.button !== undefined && e.button !== 0) return;
    if (state.selectedInventoryItemId && typeof updateInventoryCursor === "function") updateInventoryCursor(e.clientX, e.clientY);
    layer._down = { x: e.clientX, y: e.clientY };
    if ($("statusText") && !state.selectedInventoryItemId) $("statusText").textContent = `Floor layer pointerdown ${Math.round(e.clientX)},${Math.round(e.clientY)}`;
  };

  layer.onpointermove = e => {
    if (state.mode === "play" && state.selectedInventoryItemId && typeof updateInventoryCursor === "function") {
      updateInventoryCursor(e.clientX, e.clientY);
    }
  };

  layer.onpointerup = e => {
    if (state.mode !== "play") return;
    if (e.button !== undefined && e.button !== 0) return;
    const d = layer._down;
    layer._down = null;
    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12) return;

    const p = typeof stagePoint === "function"
      ? stagePoint(e)
      : { x: e.offsetX, y: e.offsetY };

    if (typeof showPlayClickMarker === "function") showPlayClickMarker(p);

    if (typeof handlePlayFloorObjectInteraction === "function" && handlePlayFloorObjectInteraction(e, p)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      return;
    }

    if ($("statusText")) {
      $("statusText").textContent = `Click suelo oficial: ${Math.round(p.x)},${Math.round(p.y)} → navegación`;
    }

    if (typeof moveAdventurePlayerWithPathfindingIndependent === "function") {
      moveAdventurePlayerWithPathfindingIndependent(p, "floor layer");
    } else if (typeof moveAdventurePlayerIndependent === "function") {
      moveAdventurePlayerIndependent(p, "floor layer");
    } else if (typeof movePlayerTo === "function") {
      movePlayerTo(p);
    }

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation?.();
  };

  if (els.stage && layer.parentNode !== els.stage) els.stage.appendChild(layer);
  return layer;
}

function ensurePlayFloorDebugToggle() {
  let btn = $("playFloorLayerDebugBtn");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "playFloorLayerDebugBtn";
    btn.type = "button";
    btn.textContent = "Ver capa suelo";
    btn.className = "playFloorLayerDebugBtn hidden";
    btn.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      const layer = $("playFloorButtonLayer");
      if (!layer) return;
      layer.classList.toggle("debugVisible");
      btn.textContent = layer.classList.contains("debugVisible") ? "Ocultar capa suelo" : "Ver capa suelo";
    };
  }
  btn.classList.toggle("hidden", state.mode !== "play");
  if (els.stage && btn.parentNode !== els.stage) els.stage.appendChild(btn);
  return btn;
}


function renderStage() {
  const scene = currentScene();
  const previousSplash = $("splashScreen");
  const previousInventoryCursor = $("inventoryCursor");
  els.stage.className = `${state.mode} ${state.mode === "editor" && state.tool === "nav" ? "nav-editing" : ""}`;
  els.stage.innerHTML = "";
  els.stage.appendChild(els.navLayer);
  ensurePathfindingDebugLayerInStage();
  ensurePhysicsDebugLayerInStage();
  ensurePlayMoveTestButton();
  els.stage.appendChild(els.messageBox);
  els.stage.appendChild(els.gameInventory);
  const splash = previousSplash || document.createElement("div");
  splash.id = "splashScreen";
  splash.className = splash.className || "splashScreen hidden";
  els.stage.appendChild(splash);

  if (previousInventoryCursor || els.inventoryCursor || $("inventoryCursor")) {
    els.inventoryCursor = previousInventoryCursor || els.inventoryCursor || $("inventoryCursor");
    els.stage.appendChild(els.inventoryCursor);
  }
  applyMessageSettings();
  applyEditorZoom();
  els.navLayer.innerHTML = "";

  if (!scene) return;

  if (state.mode !== "play") renderNavZones(scene);

  invalidateDepthCache();
  const cam = cameraOffsetFromPlayer();
  // Depth sorting via z-index, DOM order is irrelevant
  const objects = scene.objects.filter(obj => {
    normalizeObjectStates(obj);
    return isObjectVisibleInCurrentState(obj);
  });
  objects.forEach(obj => {
    // Prewarm cache for all visible objects
    cachedComputeVisualDepthZ(obj);
  });

  objects.forEach(obj => {
    const div = document.createElement("div");
    const bgClass = obj.type === "background" ? `bg-${obj.bgResize || "cover"}` : "";
    const editorSelectionClass = (state.mode === "editor" || state.mode === "animations" || state.mode === "physics") ? `${obj.id === state.selectedObjectId ? "selected" : ""} ${obj.locked ? "locked" : ""}` : "";
    div.className = `sceneObject ${obj.type} ${bgClass} ${editorSelectionClass}`;
    div.dataset.id = obj.id;
    div.style.width = `${obj.width}px`;
    div.style.height = `${obj.height}px`;
    div.style.zIndex = String(cachedComputeVisualDepthZ(obj));

    div.style.transform = objectTransform(obj);

    const asset = imageAssetById(effectiveObjectImageId(obj));
    const spriteApplied = applySpriteBackground(div, obj, asset);
    if (!spriteApplied && asset?.dataUrl) div.style.backgroundImage = `url(${asset.dataUrl})`;

    if (state.mode === "editor" || state.mode === "animations" || state.mode === "nodes" || state.mode === "mechanisms" || state.mode === "physics" || (state.mode === "play" && obj.collider?.visible)) {
      drawColliderOverlay(div, obj);
    }

    if (state.mode === "editor" || state.mode === "animations" || state.mode === "physics") {
      if (obj.type !== "background") {
        const label = document.createElement("div");
        label.className = "label";
        label.textContent = `${obj.name} · ${obj.type}`;
        div.appendChild(label);

        div.onclick = (e) => {
          if ((state.mode === "editor" || state.mode === "physics") && state.tool !== "select" && state.tool !== "physics") return;
          if (!pointInObjectCollider(stagePoint(e), obj)) return;
          e.stopPropagation();
          clearSelection();
          state.selectedPanel = "object";
  state.selectedObjectId = obj.id;
          updateColliderToolbarButton();
          renderAll();
        };
        enableDragging(div, obj);
        appendTransformGizmos(div, obj);
      }
    } else {
      if (obj.type !== "background") {
        const stateInteractable = isObjectInteractableInCurrentState(obj);
        const isInteractive = stateInteractable && obj.action && obj.action !== "none";
        const hasInteractionType = stateInteractable && ["item", "hotspot", "door", "character"].includes(obj.type);
        const acceptsInventoryUse = stateInteractable && (!!obj.useItemEnabled || (!!state.selectedInventoryItemId && obj.type !== "background"));

        if (isInteractive || hasInteractionType || acceptsInventoryUse) {
          div.onclick = (e) => {
            const p = stagePoint(e);
            if (!shouldObjectReceivePlayClick(obj, p)) return;
            e.stopPropagation();
            runObjectAction(obj);
          };
        } else {
          // En Play, objetos decorativos o el propio player no deben bloquear
          // el click de suelo. Si bloquean el evento, movePlayerTo() no recibe el punto.
          div.style.pointerEvents = "none";
        }
      }
    }

    els.stage.appendChild(div);
  });

  renderPathEditorOverlay();
  ensurePlayClickCatcherLayer();
  ensurePlayClickDebugMarker();
  ensurePlayFloorButtonLayer();
  ensurePlayFloorDebugToggle();
  if (typeof ensurePlayMoveTestButton === "function") ensurePlayMoveTestButton();
}


function distance2D(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function shouldSnapClose(point) {
  const pts = state.drawingZone?.points || [];
  return pts.length >= 3 && distance2D(point, pts[0]) <= 18;
}

function closeDrawingZone() {
  const scene = currentScene();
  const pts = state.drawingZone?.points || [];
  if (!scene || pts.length < 3) {
    alert("Una zona navegable necesita al menos 3 puntos.");
    return;
  }
  const zone = {
    id: uid(),
    name: `Zona ${scene.navZones.length + 1}`,
    enabled: true,
    points: pts.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }))
  };
  scene.navZones.push(zone);
  state.drawingZone = null;
  state.selectedPanel = "zone";
      state.selectedZoneId = zone.id;
  state.selectedZonePointIndex = null;
  setTool("navEdit");
  renderAll();
}

function cancelDrawingZone() {
  state.drawingZone = null;
  renderAll();
}

function renderNavZones(scene) {
  if (state.mode === "play") return;

  scene.navZones.forEach(zone => {
    const selectedZone = zone.id === state.selectedZoneId;

    const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    poly.setAttribute("points", zone.points.map(p => `${p.x},${p.y}`).join(" "));
    poly.setAttribute("fill", zone.enabled ? "rgba(106,157,121,.18)" : "rgba(156,69,69,.18)");
    poly.setAttribute("stroke", selectedZone ? "#d7b36a" : (zone.enabled ? "#6a9d79" : "#9c4545"));
    poly.setAttribute("stroke-width", selectedZone ? "3" : "2");
    poly.classList.add("navPolygon");

    poly.addEventListener("mousedown", e => {
      if (state.mode !== "editor" || state.tool !== "nav") return;
      e.preventDefault();
      e.stopPropagation();
      clearSelection();
      state.selectedPanel = "zone";
      state.selectedZoneId = zone.id;
      if (state.navMode === "edit") dragWholeZone(e, zone);
      else renderAll();
    });

    els.navLayer.appendChild(poly);

    // Aristas: doble clic para insertar punto.
    if (selectedZone && zone.points.length >= 2) {
      for (let i = 0; i < zone.points.length; i++) {
        const a = zone.points[i];
        const b = zone.points[(i + 1) % zone.points.length];

        const edge = document.createElementNS("http://www.w3.org/2000/svg", "line");
        edge.setAttribute("x1", a.x);
        edge.setAttribute("y1", a.y);
        edge.setAttribute("x2", b.x);
        edge.setAttribute("y2", b.y);
        edge.setAttribute("stroke", "rgba(255,255,255,.01)");
        edge.setAttribute("stroke-width", "14");
        edge.classList.add("navEdge");
        edge.addEventListener("dblclick", e => {
          e.preventDefault();
          e.stopPropagation();
          if (state.navMode !== "edit") return;
          const p = stagePoint(e);
          zone.points.splice(i + 1, 0, p);
          state.selectedZonePointIndex = i + 1;
          renderAll();
        });
        els.navLayer.appendChild(edge);
      }
    }

    if (selectedZone) {
      zone.points.forEach((p, idx) => {
        const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("cx", p.x);
        c.setAttribute("cy", p.y);
        c.setAttribute("r", idx === state.selectedZonePointIndex ? "7" : "5");
        c.setAttribute("fill", "#d7b36a");
        c.setAttribute("stroke", idx === state.selectedZonePointIndex ? "#fff" : "#111");
        c.setAttribute("stroke-width", idx === state.selectedZonePointIndex ? "3" : "1");
        c.classList.add("navPoint");
        c.addEventListener("mousedown", e => {
          e.preventDefault();
          e.stopPropagation();
          state.selectedPanel = "zone";
      state.selectedZoneId = zone.id;
          state.selectedZonePointIndex = idx;
          if (state.navMode === "edit") dragZonePoint(e, zone, idx);
          else renderAll();
        });
        els.navLayer.appendChild(c);
      });
    }
  });

  if (state.drawingZone?.points?.length) {
    const pts = state.drawingZone.points;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    line.setAttribute("points", pts.map(p => `${p.x},${p.y}`).join(" "));
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", "#d7b36a");
    line.setAttribute("stroke-width", "2");
    els.navLayer.appendChild(line);

    pts.forEach((p, idx) => {
      if (idx === 0) {
        const snap = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        snap.setAttribute("cx", p.x);
        snap.setAttribute("cy", p.y);
        snap.setAttribute("r", "18");
        snap.setAttribute("fill", "rgba(215,179,106,.08)");
        snap.setAttribute("stroke", "rgba(215,179,106,.35)");
        snap.setAttribute("stroke-dasharray", "4 4");
        snap.classList.add("navClosePreview");
        els.navLayer.appendChild(snap);
      }

      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", p.x);
      c.setAttribute("cy", p.y);
      c.setAttribute("r", idx === 0 ? "7" : "4");
      c.setAttribute("fill", "#d7b36a");
      if (idx === 0) {
        c.classList.add("navFirstPoint");
        c.addEventListener("click", e => {
          e.stopPropagation();
          if (state.drawingZone?.points?.length >= 3) closeDrawingZone();
        });
      }
      els.navLayer.appendChild(c);
    });
  }
}

function dragZonePoint(e, zone, idx) {
  const start = stagePoint(e);
  const original = { ...zone.points[idx] };

  function onMove(ev) {
    ev.preventDefault();
    const p = stagePoint(ev);
    zone.points[idx].x = original.x + p.x - start.x;
    zone.points[idx].y = original.y + p.y - start.y;
    renderStage();
    renderProperties();
  }

  function onUp() {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  }

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
}

function dragWholeZone(e, zone) {
  const start = stagePoint(e);
  const original = zone.points.map(p => ({ ...p }));

  function onMove(ev) {
    ev.preventDefault();
    const p = stagePoint(ev);
    const dx = p.x - start.x;
    const dy = p.y - start.y;
    zone.points.forEach((pt, i) => {
      pt.x = original[i].x + dx;
      pt.y = original[i].y + dy;
    });
    renderStage();
  }

  function onUp() {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  }

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
}

function addPointToSelectedZone() {
  setTool("navEdit");
  const zone = selectedZone();
  if (!zone) return;
  if (zone.points.length < 2) {
    zone.points.push({ x: 100, y: 100 });
  } else {
    const i = state.selectedZonePointIndex ?? zone.points.length - 1;
    const a = zone.points[i];
    const b = zone.points[(i + 1) % zone.points.length];
    zone.points.splice(i + 1, 0, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    state.selectedZonePointIndex = i + 1;
  }
  renderAll();
}

function deleteSelectedZonePoint() {
  const zone = selectedZone();
  if (!zone || state.selectedZonePointIndex == null) return;
  if (zone.points.length <= 3) {
    alert("Una zona navegable necesita al menos 3 puntos.");
    return;
  }
  zone.points.splice(state.selectedZonePointIndex, 1);
  state.selectedZonePointIndex = Math.min(state.selectedZonePointIndex, zone.points.length - 1);
  renderAll();
}


function renameObjectFromOutliner(obj) {
  if (!obj) return;
  const nextName = prompt("Nuevo nombre del objeto:", obj.name || "");
  if (nextName === null) return;
  const cleanName = nextName.trim();
  if (!cleanName) {
    showMessage?.("El nombre del objeto no puede estar vacio.");
    return;
  }
  obj.name = cleanName;
  renderStage();
  renderOutliner();
  renderProperties();
  showMessage?.(`Objeto renombrado: ${cleanName}`);
}

function renderOutliner() {
  const scene = currentScene();
  els.objectList.innerHTML = "";
  if (!scene) return;

  if (!scene.objects.some(o => o.type === "background")) {
    const li = document.createElement("li");
    li.innerHTML = "<span>⚠ Sin fondo</span><small>recomendado</small>";
    els.objectList.appendChild(li);
  }
  if (!scene.objects.some(o => o.type === "player")) {
    const li = document.createElement("li");
    li.innerHTML = "<span>⚠ Sin player</span><small>necesario</small>";
    els.objectList.appendChild(li);
  }

  scene.objects.forEach(obj => {
    const li = document.createElement("li");
    li.className = `outlinerRow ${obj.id === state.selectedObjectId ? "selected" : ""}`;

    const main = document.createElement("button");
    main.type = "button";
    main.className = "outlinerMainBtn";
    main.innerHTML = `<span>${obj.name}</span><small>${obj.type}</small>`;
    main.onclick = () => {
      clearSelection();
      state.selectedPanel = "object";
      state.selectedObjectId = obj.id;
      renderAll();
    };
    li.appendChild(main);

    const actions = document.createElement("span");
    actions.className = "outlinerActions";

    const renameBtn = document.createElement("button");
    renameBtn.type = "button";
    renameBtn.className = "outlinerIconBtn";
    renameBtn.title = "Renombrar";
    renameBtn.setAttribute("aria-label", `Renombrar ${obj.name}`);
    renameBtn.textContent = "Ren";
    renameBtn.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      clearSelection();
      state.selectedPanel = "object";
      state.selectedObjectId = obj.id;
      renameObjectFromOutliner(obj);
    };

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "outlinerIconBtn";
    copyBtn.title = "Duplicar";
    copyBtn.setAttribute("aria-label", `Duplicar ${obj.name}`);
    copyBtn.textContent = "⧉";
    copyBtn.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      duplicateObjectById(obj.id);
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "outlinerIconBtn danger";
    deleteBtn.title = "Eliminar";
    deleteBtn.setAttribute("aria-label", `Eliminar ${obj.name}`);
    deleteBtn.textContent = "×";
    deleteBtn.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      deleteObjectById(obj.id);
    };

    actions.appendChild(renameBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(deleteBtn);
    li.appendChild(actions);
    els.objectList.appendChild(li);
  });

  scene.navZones.forEach(zone => {
    const li = document.createElement("li");
    li.className = zone.id === state.selectedZoneId ? "selected" : "";
    li.innerHTML = `<span>${zone.name}</span><small>navzone</small>`;
    li.onclick = () => {
      setTool("navEdit");
      clearSelection();
      state.selectedPanel = "zone";
      state.selectedZoneId = zone.id;
      renderAll();
    };
    els.objectList.appendChild(li);
  });
}


function fillSelect(select, items, emptyText = "—") {
  if (!select) return;
  select.innerHTML = "";
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = emptyText;
  select.appendChild(empty);
  (items || []).forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = item.name;
    select.appendChild(opt);
  });
}

function fillNodeTypeSelect(select, category, value = null) {
  if (!select) return;
  select.innerHTML = "";
  (NODE_TYPE_OPTIONS[category] || []).forEach(([type, label]) => {
    const opt = document.createElement("option");
    opt.value = type;
    opt.textContent = label;
    select.appendChild(opt);
  });
  if (value && [...select.options].some(o => o.value === value)) select.value = value;
}

function refreshNewNodeTypeOptions() {
  const cat = $("newNodeCategory")?.value || "event";
  fillNodeTypeSelect($("newNodeType"), cat);
}

function setParamVisibility(node) {
  const def = nodeDef(node);
  const params = new Set(def.params || []);
  const visibleEvent = isEventNode(node) && node.category !== "event" ? true : (node.category === "event" && node.type !== "sceneStart");

  $("nodeEventWrap")?.classList.toggle("hiddenParam", !visibleEvent);
  $("nodeObjectWrap")?.classList.toggle("hiddenParam", !params.has("object"));
  $("nodeTargetObjectWrap")?.classList.toggle("hiddenParam", !params.has("targetObject"));
  $("nodeAudioWrap")?.classList.toggle("hiddenParam", !params.has("audio"));
  $("nodeInputWrap")?.classList.toggle("hiddenParam", !params.has("input"));
  $("nodeValueWrap")?.classList.toggle("hiddenParam", !params.has("value"));
  $("nodeAnimationWrap")?.classList.toggle("hiddenParam", !params.has("animation"));
  $("nodeAnimationModeWrap")?.classList.toggle("hiddenParam", !params.has("animation"));
  $("nodePuzzleWrap")?.classList.toggle("hiddenParam", !params.has("mechanism"));
  $("nodeVolumeWrap")?.classList.toggle("hiddenParam", !params.has("volume"));

  const isSceneStart = node.category === "event" && node.type === "sceneStart";
  $("nodeSceneStartSceneWrap")?.classList.toggle("hiddenParam", !isSceneStart);
  $("nodeSceneStartSceneHint")?.classList.toggle("hiddenParam", !isSceneStart);
}


function hideIfExists(id) {
  const el = $(id);
  if (el) el.classList.add("hidden");
}
function showIfExists(id) {
  const el = $(id);
  if (el) el.classList.remove("hidden");
  return !!el;
}
function firstExistingId(ids) {
  return ids.find(id => !!$(id)) || null;
}
