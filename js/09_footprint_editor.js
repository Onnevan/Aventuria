
// AventurIA Beta 0.7.56 — Footprint Editor
// Editor visual separado para pathFootprint. No altera collider normal.

function footprintEditorObject() {
  return state.footprintEditor ? findObjectByIdAnyScene(state.footprintEditor.objectId) : null;
}

function cloneFootprintForEditor(obj) {
  normalizePathFootprint(obj);
  return deepClone(obj.pathFootprint || defaultPathFootprintForObject(obj));
}

function footprintDraftRectPixels(obj, fp) {
  const w = Math.max(1, Number(obj.width || 1));
  const h = Math.max(1, Number(obj.height || 1));
  return {
    x: Number(fp.x || 0) * w,
    y: Number(fp.y || 0) * h,
    width: Math.max(1, Number(fp.width || 0.1) * w),
    height: Math.max(1, Number(fp.height || 0.1) * h),
    shape: fp.shape || "ellipse"
  };
}

function setFootprintDraftFromPixels(obj, rect) {
  const ed = state.footprintEditor;
  if (!obj || !ed) return;
  const w = Math.max(1, Number(obj.width || 1));
  const h = Math.max(1, Number(obj.height || 1));
  ed.draft.enabled = true;
  ed.draft.mode = "groundProjection";
  ed.draft.x = Math.max(-1, Math.min(2, rect.x / w));
  ed.draft.y = Math.max(-1, Math.min(2, rect.y / h));
  ed.draft.width = Math.max(0.02, Math.min(2, rect.width / w));
  ed.draft.height = Math.max(0.02, Math.min(2, rect.height / h));
  ed.draft.auto = false;
}

function openFootprintEditor(objectId) {
  const obj = findObjectByIdAnyScene(objectId);
  if (!obj || obj.type === "background") return;
  normalizePathFootprint(obj);
  state.footprintEditor = {
    open: true,
    objectId,
    draft: cloneFootprintForEditor(obj),
    tool: "move",
    zoom: 1,
    drag: null
  };
  const modal = $("footprintEditorModal");
  if (!modal) {
    alert("No se encontró el modal del editor de huella.");
    return;
  }
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  renderFootprintEditor();
}

function closeFootprintEditor(apply = false) {
  const ed = state.footprintEditor;
  if (apply && ed) {
    const obj = footprintEditorObject();
    if (obj) {
      obj.pathFootprint = deepClone(ed.draft);
      normalizePathFootprint(obj);
      obj.pathBlocker = obj.type !== "player" && obj.type !== "background" ? true : obj.pathBlocker;
    }
  }
  state.footprintEditor = null;
  $("footprintEditorModal")?.classList.add("hidden");
  $("footprintEditorModal")?.setAttribute("aria-hidden", "true");
  renderAll();
}

function footprintSvgPoint(evt) {
  const svg = $("footprintEditorSvg");
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  const m = svg.getScreenCTM();
  if (!m) return { x: 0, y: 0 };
  return pt.matrixTransform(m.inverse());
}

function setFootprintTool(tool) {
  if (!state.footprintEditor) return;
  state.footprintEditor.tool = tool;
  renderFootprintEditor();
}

function setFootprintPreset(shape) {
  const ed = state.footprintEditor;
  if (!ed) return;
  ed.draft.shape = shape === "rect" ? "rect" : "ellipse";
  ed.draft.mode = "groundProjection";
  ed.draft.enabled = true;
  ed.draft.auto = false;
  renderFootprintEditor();
}

function resetFootprintAutomatic() {
  const obj = footprintEditorObject();
  const ed = state.footprintEditor;
  if (!obj || !ed) return;
  ed.draft = defaultPathFootprintForObject(obj);
  renderFootprintEditor();
}

function footprintFitFeet() {
  const obj = footprintEditorObject();
  const ed = state.footprintEditor;
  if (!obj || !ed) return;
  ed.draft = {
    enabled: true,
    mode: "groundProjection",
    shape: "ellipse",
    x: obj.type === "player" ? 0.28 : 0.22,
    y: obj.type === "player" ? 0.70 : 0.74,
    width: obj.type === "player" ? 0.44 : 0.56,
    height: obj.type === "player" ? 0.22 : 0.20,
    auto: false
  };
  renderFootprintEditor();
}

function footprintUseCollider() {
  const ed = state.footprintEditor;
  if (!ed) return;
  ed.draft.mode = "manualCollider";
  ed.draft.enabled = true;
  ed.draft.auto = false;
  renderFootprintEditor();
}

function footprintUseGroundProjection() {
  const ed = state.footprintEditor;
  if (!ed) return;
  ed.draft.mode = "groundProjection";
  ed.draft.enabled = true;
  ed.draft.auto = false;
  renderFootprintEditor();
}

function renderFootprintEditor() {
  const ed = state.footprintEditor;
  const obj = footprintEditorObject();
  const modal = $("footprintEditorModal");
  const svg = $("footprintEditorSvg");
  if (!ed || !obj || !modal || !svg) return;

  const w = Math.max(1, Number(obj.width || 1));
  const h = Math.max(1, Number(obj.height || 1));
  const zoom = Number(ed.zoom || 1);
  const fp = ed.draft;
  const rect = footprintDraftRectPixels(obj, fp);

  $("footprintEditorTitle").textContent = `Editar huella: ${obj.name}`;
  $("footprintZoom").value = zoom;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.style.width = `${w * zoom}px`;
  svg.style.height = `${h * zoom}px`;
  svg.innerHTML = "";

  const asset = imageAssetById(obj.imageId);
  if (asset?.dataUrl) {
    const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
    img.setAttribute("href", asset.dataUrl);
    img.setAttribute("x", 0);
    img.setAttribute("y", 0);
    img.setAttribute("width", w);
    img.setAttribute("height", h);
    img.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.appendChild(img);
  } else {
    const fallback = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    fallback.classList.add("colliderImageFallback");
    fallback.setAttribute("x", 0);
    fallback.setAttribute("y", 0);
    fallback.setAttribute("width", w);
    fallback.setAttribute("height", h);
    svg.appendChild(fallback);
  }

  const baseline = document.createElementNS("http://www.w3.org/2000/svg", "line");
  baseline.classList.add("footprintBaseline");
  baseline.setAttribute("x1", 0);
  baseline.setAttribute("y1", h * 0.86);
  baseline.setAttribute("x2", w);
  baseline.setAttribute("y2", h * 0.86);
  svg.appendChild(baseline);

  let shape;
  if (fp.mode === "manualCollider") {
    shape = document.createElementNS("http://www.w3.org/2000/svg", "text");
    shape.classList.add("footprintManualColliderText");
    shape.setAttribute("x", w * 0.5);
    shape.setAttribute("y", h * 0.5);
    shape.setAttribute("text-anchor", "middle");
    shape.textContent = "Usando collider como huella";
  } else if (fp.shape === "rect") {
    shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    shape.setAttribute("x", rect.x);
    shape.setAttribute("y", rect.y);
    shape.setAttribute("width", rect.width);
    shape.setAttribute("height", rect.height);
  } else {
    shape = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    shape.setAttribute("cx", rect.x + rect.width / 2);
    shape.setAttribute("cy", rect.y + rect.height / 2);
    shape.setAttribute("rx", rect.width / 2);
    shape.setAttribute("ry", rect.height / 2);
  }

  shape.classList.add("footprintShape");
  shape.onpointerdown = e => {
    if (fp.mode === "manualCollider") return;
    e.preventDefault();
    const p = footprintSvgPoint(e);
    ed.drag = { mode: ed.tool === "resize" ? "resize" : "move", start: p, prev: p, startRect: rect };
    try { svg.setPointerCapture(e.pointerId); } catch {}
  };
  svg.appendChild(shape);

  if (fp.mode !== "manualCollider") {
    const handle = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    handle.classList.add("footprintResizeHandle");
    handle.setAttribute("x", rect.x + rect.width - 6);
    handle.setAttribute("y", rect.y + rect.height - 6);
    handle.setAttribute("width", 12);
    handle.setAttribute("height", 12);
    handle.onpointerdown = e => {
      e.preventDefault();
      e.stopPropagation();
      const p = footprintSvgPoint(e);
      ed.drag = { mode: "resize", start: p, prev: p, startRect: rect };
      try { svg.setPointerCapture(e.pointerId); } catch {}
    };
    svg.appendChild(handle);
  }

  document.querySelectorAll(".footprintPresetBtn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.preset === fp.shape);
  });
  $("footprintToolMove")?.classList.toggle("active", ed.tool === "move");
  $("footprintToolResize")?.classList.toggle("active", ed.tool === "resize");

  const hint = $("footprintEditorHint");
  if (hint) {
    hint.textContent = fp.mode === "manualCollider"
      ? "Modo avanzado: el pathfinding usa el collider normal como huella."
      : `Huella ${fp.shape === "rect" ? "rectangular" : "elíptica"} · x=${fp.x.toFixed(2)} y=${fp.y.toFixed(2)} w=${fp.width.toFixed(2)} h=${fp.height.toFixed(2)}`;
  }
}

function handleFootprintPointerDown(e) {
  const ed = state.footprintEditor;
  if (!ed || e.target?.id !== "footprintEditorSvg") return;
  const obj = footprintEditorObject();
  if (!obj || ed.draft.mode === "manualCollider") return;
  const p = footprintSvgPoint(e);
  const rect = footprintDraftRectPixels(obj, ed.draft);
  ed.drag = { mode: ed.tool === "resize" ? "resize" : "move", start: p, prev: p, startRect: rect };
  try { $("footprintEditorSvg")?.setPointerCapture(e.pointerId); } catch {}
}

function handleFootprintPointerMove(e) {
  const ed = state.footprintEditor;
  if (!ed) return;
  const svg = $("footprintEditorSvg");
  if (!svg || (!svg.contains(e.target) && !ed.drag)) return;
  if (!ed.drag) return;

  const obj = footprintEditorObject();
  if (!obj) return;
  const p = footprintSvgPoint(e);
  const r0 = ed.drag.startRect;
  let rect = { ...r0 };

  if (ed.drag.mode === "move") {
    const dx = p.x - ed.drag.start.x;
    const dy = p.y - ed.drag.start.y;
    rect.x = r0.x + dx;
    rect.y = r0.y + dy;
  } else if (ed.drag.mode === "resize") {
    rect.width = Math.max(4, r0.width + (p.x - ed.drag.start.x));
    rect.height = Math.max(4, r0.height + (p.y - ed.drag.start.y));
  }

  setFootprintDraftFromPixels(obj, rect);
  renderFootprintEditor();
}

function bindFootprintEditorUI() {
  if (state._footprintEditorBound) return;
  state._footprintEditorBound = true;

  document.addEventListener("click", e => {
    const target = e.target;
    if (!target) return;

    if (target.id === "openFootprintEditorBtn") {
      const obj = selectedObjectForColliderEditor?.();
      if (obj) return openFootprintEditor(obj.id);
      return;
    }
    if (target.id === "footprintApplyBtn") return closeFootprintEditor(true);
    if (target.id === "footprintCancelBtn" || target.id === "footprintCloseBtn") return closeFootprintEditor(false);
    if (target.classList?.contains("footprintPresetBtn")) return setFootprintPreset(target.dataset.preset);
    if (target.id === "footprintToolMove") return setFootprintTool("move");
    if (target.id === "footprintToolResize") return setFootprintTool("resize");
    if (target.id === "footprintAutoBtn") return resetFootprintAutomatic();
    if (target.id === "footprintFeetBtn") return footprintFitFeet();
    if (target.id === "footprintUseColliderBtn") return footprintUseCollider();
    if (target.id === "footprintGroundBtn") return footprintUseGroundProjection();
  });

  document.addEventListener("input", e => {
    if (e.target?.id === "footprintZoom") {
      if (!state.footprintEditor) return;
      state.footprintEditor.zoom = Number(e.target.value) || 1;
      renderFootprintEditor();
    }
  });

  document.addEventListener("pointerdown", handleFootprintPointerDown);
  document.addEventListener("pointermove", handleFootprintPointerMove);
  document.addEventListener("pointerup", e => {
    if (!state.footprintEditor) return;
    state.footprintEditor.drag = null;
    try { $("footprintEditorSvg")?.releasePointerCapture(e.pointerId); } catch {}
  });

  document.addEventListener("keydown", e => {
    if (!state.footprintEditor) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeFootprintEditor(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      closeFootprintEditor(true);
    }
  });
}

bindFootprintEditorUI();
