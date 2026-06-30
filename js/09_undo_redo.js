// AventurIA Beta 0.7.1 — Undo / Redo
// Historial de proyecto con 10 estados. Guarda snapshots del proyecto antes de cambios destructivos o de edición.

function undoClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function undoFingerprint(project = state.project) {
  try {
    return JSON.stringify(project);
  } catch (err) {
    return "";
  }
}

function updateUndoRedoButtons() {
  $("undoBtn")?.toggleAttribute("disabled", !(state.undoStack?.length));
  $("redoBtn")?.toggleAttribute("disabled", !(state.redoStack?.length));
}

function pushUndoSnapshot(label = "Cambio", snapshotProject = null) {
  if (state.undoRestoring || !state.project) return false;

  const project = snapshotProject ? undoClone(snapshotProject) : undoClone(state.project);
  const fp = undoFingerprint(project);
  const topFp = state.undoStack?.length ? state.undoStack[state.undoStack.length - 1].fingerprint : "";

  if (fp && fp === topFp) return false;

  state.undoStack ??= [];
  state.redoStack ??= [];

  state.undoStack.push({
    label,
    project,
    selectedSceneId: state.selectedSceneId,
    selectedObjectId: state.selectedObjectId,
    selectedZoneId: state.selectedZoneId,
    selectedNodeId: state.selectedNodeId,
    selectedLinkId: state.selectedLinkId,
    selectedPanel: state.selectedPanel,
    fingerprint: fp
  });

  while (state.undoStack.length > (state.undoLimit || 10)) state.undoStack.shift();
  state.redoStack = [];
  updateUndoRedoButtons();
  return true;
}

function restoreHistoryEntry(entry, label = "") {
  if (!entry?.project) return false;

  state.undoRestoring = true;
  try {
    state.project = undoClone(entry.project);
    normalizeProject(state.project);

    state.selectedSceneId = entry.selectedSceneId || state.project.startSceneId || state.project.scenes?.[0]?.id || null;
    state.selectedObjectId = entry.selectedObjectId || null;
    state.selectedZoneId = entry.selectedZoneId || null;
    state.selectedNodeId = entry.selectedNodeId || null;
    state.selectedLinkId = entry.selectedLinkId || null;
    state.selectedPanel = entry.selectedPanel || null;

    state.runtimeStates = {};
    state.spatialTriggerStates = {};
    state.imageHitCache = {};
    state.editorSnapshot = null;
    if (typeof stopPhysicsWorld === "function") stopPhysicsWorld();
    if (typeof stopAnimationLoop === "function") stopAnimationLoop();

    renderAll();
    showMessage(label || "");
  } finally {
    state.undoRestoring = false;
    updateUndoRedoButtons();
  }
  return true;
}

function undoProjectChange() {
  if (!state.undoStack?.length || !state.project) return false;

  const current = {
    label: "Actual",
    project: undoClone(state.project),
    selectedSceneId: state.selectedSceneId,
    selectedObjectId: state.selectedObjectId,
    selectedZoneId: state.selectedZoneId,
    selectedNodeId: state.selectedNodeId,
    selectedLinkId: state.selectedLinkId,
    selectedPanel: state.selectedPanel,
    fingerprint: undoFingerprint(state.project)
  };

  const previous = state.undoStack.pop();
  state.redoStack ??= [];
  state.redoStack.push(current);
  restoreHistoryEntry(previous, `Deshacer: ${previous.label || "cambio"}`);
  return true;
}

function redoProjectChange() {
  if (!state.redoStack?.length || !state.project) return false;

  const current = {
    label: "Actual",
    project: undoClone(state.project),
    selectedSceneId: state.selectedSceneId,
    selectedObjectId: state.selectedObjectId,
    selectedZoneId: state.selectedZoneId,
    selectedNodeId: state.selectedNodeId,
    selectedLinkId: state.selectedLinkId,
    selectedPanel: state.selectedPanel,
    fingerprint: undoFingerprint(state.project)
  };

  const next = state.redoStack.pop();
  state.undoStack ??= [];
  state.undoStack.push(current);
  restoreHistoryEntry(next, `Rehacer: ${next.label || "cambio"}`);
  return true;
}

function bindUndoRedo() {
  $("undoBtn")?.addEventListener("click", e => {
    e.preventDefault();
    undoProjectChange();
  });
  $("redoBtn")?.addEventListener("click", e => {
    e.preventDefault();
    redoProjectChange();
  });

  document.addEventListener("keydown", e => {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;

    const key = e.key.toLowerCase();
    if (key === "z" && !e.shiftKey) {
      e.preventDefault();
      undoProjectChange();
      return;
    }

    if ((key === "z" && e.shiftKey) || key === "y") {
      e.preventDefault();
      redoProjectChange();
    }
  }, true);

  // Guarda un snapshot antes de editar campos de propiedades.
  document.addEventListener("focusin", e => {
    const el = e.target;
    if (!el || !state.project) return;
    if (!["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName)) return;
    if (!el.id || el.classList.contains("hiddenFileInput")) return;
    state.undoFocusSnapshot = {
      id: el.id,
      project: undoClone(state.project),
      fingerprint: undoFingerprint(state.project)
    };
  }, true);

  document.addEventListener("input", e => maybePushFocusedUndo(e), true);
  document.addEventListener("change", e => maybePushFocusedUndo(e), true);

  updateUndoRedoButtons();
}

function maybePushFocusedUndo(e) {
  const snap = state.undoFocusSnapshot;
  if (!snap || !e.target || e.target.id !== snap.id) return;
  const now = undoFingerprint(state.project);
  if (snap.fingerprint && now && snap.fingerprint !== now) {
    pushUndoSnapshot(`Editar ${snap.id}`, snap.project);
    state.undoFocusSnapshot = null;
  }
}

function withUndo(label, fn) {
  return function(...args) {
    pushUndoSnapshot(label);
    return fn.apply(this, args);
  };
}
