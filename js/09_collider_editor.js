// AventurIA v54 Modular Base — 09_collider_editor.js
// Extraído de v53 funcional. Script clásico global; el orden de carga importa.

function findObjectByIdAnyScene(objectId) {
  for (const scene of state.project?.scenes || []) {
    const obj = (scene.objects || []).find(o => o.id === objectId);
    if (obj) return obj;
  }
  return null;
}

function openColliderEditor(objectId) {
  const obj = findObjectByIdAnyScene(objectId);
  if (!obj) return;
  normalizeCollider(obj);
  state.colliderEditor = {
    open: true,
    objectId,
    draft: deepClone(obj.collider),
    tool: "select",
    selectedPointIndex: null,
    drawing: obj.collider.type === "polygon" && obj.collider.closed === false,
    zoom: 1,
    mouse: null,
    drag: null
  };
  const modal = $("colliderEditorModal");
  if (!modal) {
    alert("No se encontró el modal del editor de collider. Revisa que estás usando la versión v53 completa.");
    return;
  }
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  renderColliderEditor();
}

function closeColliderEditor(apply = false) {
  const ed = state.colliderEditor;
  if (apply && ed) {
    const obj = findObjectByIdAnyScene(ed.objectId);
    if (obj) {
      obj.collider = deepClone(ed.draft);
      normalizeCollider(obj);
    }
  }
  state.colliderEditor = null;
  $("colliderEditorModal")?.classList.add("hidden");
  $("colliderEditorModal")?.setAttribute("aria-hidden", "true");
  renderAll();
}

function colliderEditorObject() {
  return state.colliderEditor ? findObjectByIdAnyScene(state.colliderEditor.objectId) : null;
}

function setColliderEditorPreset(preset) {
  const obj = colliderEditorObject();
  const ed = state.colliderEditor;
  if (!obj || !ed) return;
  ed.draft = makeColliderPreset(obj, preset);
  ed.selectedPointIndex = null;
  ed.drawing = preset === "polygon";
  ed.tool = preset === "polygon" ? "add" : "select";
  renderColliderEditor();
}

function setColliderEditorTool(tool) {
  if (!state.colliderEditor) return;
  state.colliderEditor.tool = tool;
  renderColliderEditor();
}

function colliderSvgPoint(evt) {
  const svg = $("colliderEditorSvg");
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  const m = svg.getScreenCTM();
  if (!m) return { x: 0, y: 0 };
  return pt.matrixTransform(m.inverse());
}

function nearestColliderPointIndex(points, p, maxDist = 10) {
  let best = -1;
  let bestD = maxDist;
  points.forEach((pt, i) => {
    const d = Math.hypot(pt.x - p.x, pt.y - p.y);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

function closeColliderPolygonIfPossible() {
  const ed = state.colliderEditor;
  const c = ed?.draft;
  if (!c || c.type !== "polygon") return;
  if ((c.points || []).length >= 3) {
    c.closed = true;
    ed.drawing = false;
    ed.tool = "select";
    renderColliderEditor();
  }
}

function deleteSelectedColliderPoint() {
  const ed = state.colliderEditor;
  const c = ed?.draft;
  if (!c || c.type !== "polygon") return;
  if (ed.selectedPointIndex == null || ed.selectedPointIndex < 0) return;
  c.points.splice(ed.selectedPointIndex, 1);
  ed.selectedPointIndex = null;
  if (c.points.length < 3) c.closed = false;
  renderColliderEditor();
}

function removeLastColliderPoint() {
  const ed = state.colliderEditor;
  const c = ed?.draft;
  if (!c || c.type !== "polygon") return;
  c.points.pop();
  ed.selectedPointIndex = null;
  if (c.points.length < 3) c.closed = false;
  renderColliderEditor();
}

function centerColliderDraft() {
  const obj = colliderEditorObject();
  const ed = state.colliderEditor;
  const c = ed?.draft;
  if (!obj || !c) return;
  const bounds = boundsFromPoints(colliderLocalPoints(c));
  if (!bounds) return;
  const dx = obj.width / 2 - (bounds.x + bounds.w / 2);
  const dy = obj.height / 2 - (bounds.y + bounds.h / 2);
  moveColliderDraft(dx, dy);
  renderColliderEditor();
}

function moveColliderDraft(dx, dy) {
  const c = state.colliderEditor?.draft;
  if (!c) return;
  if (c.type === "box") {
    c.x += dx; c.y += dy;
  } else if (c.type === "ellipse") {
    c.x += dx; c.y += dy;
  } else if (c.type === "polygon") {
    (c.points || []).forEach(p => { p.x += dx; p.y += dy; });
  }
}

function fitColliderToFeet() {
  const obj = colliderEditorObject();
  const ed = state.colliderEditor;
  if (!obj || !ed) return;
  ed.draft = { enabled: true, visible: true, type: "box", x: obj.width * .28, y: obj.height * .72, width: obj.width * .44, height: obj.height * .20 };
  renderColliderEditor();
}

function renderColliderEditor() {
  const ed = state.colliderEditor;
  const obj = colliderEditorObject();
  const modal = $("colliderEditorModal");
  const svg = $("colliderEditorSvg");
  if (!ed || !obj || !modal || !svg) return;

  const c = ed.draft;
  const w = Math.max(1, Number(obj.width || 1));
  const h = Math.max(1, Number(obj.height || 1));
  const zoom = Number(ed.zoom || 1);

  $("colliderEditorTitle").textContent = `Editar collider: ${obj.name}`;
  $("colliderZoom").value = zoom;
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

  let shape = null;
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
  } else if (c.type === "polygon") {
    shape = document.createElementNS("http://www.w3.org/2000/svg", c.closed === false ? "polyline" : "polygon");
    shape.setAttribute("points", (c.points || []).map(p => `${p.x},${p.y}`).join(" "));
  }

  if (shape) {
    shape.classList.add("colliderShape");
    shape.onpointerdown = e => {
      if (ed.tool !== "move") return;
      e.preventDefault();
      const p = colliderSvgPoint(e);
      ed.drag = { mode: "moveShape", start: p, prev: p };
      try { svg.setPointerCapture(e.pointerId); } catch {}
    };
    svg.appendChild(shape);
  }

  if (c.type === "polygon") {
    const pts = c.points || [];
    if (ed.drawing && pts.length && ed.mouse) {
      const last = pts[pts.length - 1];
      const temp = document.createElementNS("http://www.w3.org/2000/svg", "line");
      temp.classList.add("colliderTempLine");
      temp.setAttribute("x1", last.x);
      temp.setAttribute("y1", last.y);
      temp.setAttribute("x2", ed.mouse.x);
      temp.setAttribute("y2", ed.mouse.y);
      svg.appendChild(temp);
    }

    pts.forEach((p, i) => {
      const handle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      handle.classList.add("colliderPoint");
      if (i === 0) handle.classList.add("first");
      if (i === ed.selectedPointIndex) handle.classList.add("selected");
      handle.setAttribute("cx", p.x);
      handle.setAttribute("cy", p.y);
      handle.setAttribute("r", 5);
      handle.onpointerdown = e => {
        e.preventDefault();
        e.stopPropagation();
        ed.selectedPointIndex = i;
        ed.drag = { mode: "point", index: i };
        try { svg.setPointerCapture(e.pointerId); } catch {}
        renderColliderEditor();
      };
      svg.appendChild(handle);
    });
  }

  document.querySelectorAll(".colliderPresetBtn").forEach(btn => {
    const preset = btn.dataset.preset;
    const active = (preset === c.type) ||
      (preset === "triangle" && c.type === "polygon" && (c.points || []).length === 3) ||
      (preset === "quad" && c.type === "polygon" && (c.points || []).length === 4);
    btn.classList.toggle("active", active);
  });
  ["select","add","move"].forEach(tool => {
    const id = tool === "select" ? "colliderToolSelect" : tool === "add" ? "colliderToolAdd" : "colliderToolMove";
    $(id)?.classList.toggle("active", ed.tool === tool);
  });
}

function bindColliderEditorUI() {
  if (state._colliderEditorBound) return;
  state._colliderEditorBound = true;

  document.addEventListener("click", e => {
    const target = e.target;
    if (!target) return;

    if (target.id === "colliderApplyBtn") return closeColliderEditor(true);
    if (target.id === "colliderCancelBtn" || target.id === "colliderCloseBtn") return closeColliderEditor(false);

    if (target.classList?.contains("colliderPresetBtn")) {
      return setColliderEditorPreset(target.dataset.preset);
    }

    if (target.id === "colliderToolSelect") return setColliderEditorTool("select");
    if (target.id === "colliderToolAdd") return setColliderEditorTool("add");
    if (target.id === "colliderToolMove") return setColliderEditorTool("move");
    if (target.id === "colliderDeletePointBtn") return deleteSelectedColliderPoint();
    if (target.id === "colliderUndoPointBtn") return removeLastColliderPoint();
    if (target.id === "colliderClosePolyBtn") return closeColliderPolygonIfPossible();

    if (target.id === "colliderFitSpriteBtn") {
      const obj = colliderEditorObject();
      if (!obj || !state.colliderEditor) return;
      state.colliderEditor.draft = makeColliderPreset(obj, "box");
      return renderColliderEditor();
    }

    if (target.id === "colliderFitFeetBtn") return fitColliderToFeet();
    if (target.id === "colliderCenterBtn") return centerColliderDraft();
  });

  document.addEventListener("input", e => {
    if (e.target?.id === "colliderZoom") {
      if (!state.colliderEditor) return;
      state.colliderEditor.zoom = Number(e.target.value) || 1;
      renderColliderEditor();
    }
  });

  document.addEventListener("pointerdown", e => {
    if (e.target?.id !== "colliderEditorSvg") return;
    handleColliderSvgPointerDown(e);
  });

  document.addEventListener("pointermove", e => {
    if (!state.colliderEditor) return;
    const svg = $("colliderEditorSvg");
    if (!svg || !svg.contains(e.target) && !state.colliderEditor.drag) return;
    handleColliderSvgPointerMove(e);
  });

  document.addEventListener("pointerup", e => {
    if (!state.colliderEditor) return;
    const svg = $("colliderEditorSvg");
    state.colliderEditor.drag = null;
    try { svg?.releasePointerCapture(e.pointerId); } catch {}
  });

  document.addEventListener("keydown", e => {
    if (!state.colliderEditor) return;
    if (e.key === "Enter") {
      e.preventDefault();
      closeColliderPolygonIfPossible();
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (state.colliderEditor.draft?.type === "polygon" && state.colliderEditor.drawing) {
        state.colliderEditor.drawing = false;
        state.colliderEditor.tool = "select";
        renderColliderEditor();
      } else closeColliderEditor(false);
    } else if (e.key === "Backspace") {
      e.preventDefault();
      removeLastColliderPoint();
    } else if (e.key === "Delete") {
      e.preventDefault();
      deleteSelectedColliderPoint();
    }
  });
}

function handleColliderSvgPointerDown(e) {
  const ed = state.colliderEditor;
  const c = ed?.draft;
  const svg = $("colliderEditorSvg");
  if (!ed || !c || !svg) return;
  const p = colliderSvgPoint(e);

  if (c.type === "polygon" && ed.tool === "add") {
    e.preventDefault();
    c.points ??= [];
    if (c.points.length >= 3 && Math.hypot(p.x - c.points[0].x, p.y - c.points[0].y) < 10) {
      c.closed = true;
      ed.drawing = false;
      ed.tool = "select";
    } else {
      c.points.push({ x: Math.round(p.x), y: Math.round(p.y) });
      c.closed = false;
      ed.drawing = true;
      ed.selectedPointIndex = c.points.length - 1;
    }
    renderColliderEditor();
    return;
  }

  if (ed.tool === "move") {
    e.preventDefault();
    ed.drag = { mode: "moveShape", start: p, prev: p };
    try { try { svg.setPointerCapture(e.pointerId); } catch {} } catch {}
    return;
  }

  if (c.type === "polygon") {
    const idx = nearestColliderPointIndex(c.points || [], p, 10);
    ed.selectedPointIndex = idx >= 0 ? idx : null;
    renderColliderEditor();
  }
}

function handleColliderSvgPointerMove(e) {
  const ed = state.colliderEditor;
  const c = ed?.draft;
  if (!ed || !c) return;
  const p = colliderSvgPoint(e);
  ed.mouse = p;

  if (ed.drag?.mode === "point" && c.type === "polygon") {
    const idx = ed.drag.index;
    if (c.points[idx]) {
      c.points[idx].x = Math.round(p.x);
      c.points[idx].y = Math.round(p.y);
      renderColliderEditor();
    }
    return;
  }

  if (ed.drag?.mode === "moveShape") {
    const dx = p.x - ed.drag.prev.x;
    const dy = p.y - ed.drag.prev.y;
    moveColliderDraft(dx, dy);
    ed.drag.prev = p;
    renderColliderEditor();
    return;
  }

  if (c.type === "polygon" && ed.tool === "add") renderColliderEditor();
}
