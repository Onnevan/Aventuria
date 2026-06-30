// AventurIA Beta 0.7.0 — Matter.js Physics Editor
// Editor visual mínimo + runtime Matter.js.
// Matter.js es el motor. Este módulo es el editor/capa de integración dentro de AventurIA.

function physicsMatterAvailable() {
  return !!window.Matter?.Engine && !!window.Matter?.Bodies && !!window.Matter?.World;
}

function currentScenePhysics() {
  return normalizeScenePhysics(currentScene());
}

function currentObjectPhysics(obj = selectedObject()) {
  return normalizeObjectPhysics(obj);
}

function physicsStageSize() {
  return {
    width: Number(state.project?.stage?.width || 1280),
    height: Number(state.project?.stage?.height || 720)
  };
}

function physicsObjectSize(obj) {
  const scale = Number(obj?.scale || 1) || 1;
  return {
    w: Math.max(4, Number(obj?.width || 32) * scale),
    h: Math.max(4, Number(obj?.height || 32) * scale)
  };
}

function physicsBodyBoundsFromCollider(obj) {
  const size = physicsObjectSize(obj);
  if (!obj?.collider?.points?.length) return size;
  const pts = obj.collider.points;
  const xs = pts.map(p => Number(p.x) || 0);
  const ys = pts.map(p => Number(p.y) || 0);
  const w = Math.max(4, (Math.max(...xs) - Math.min(...xs)) * (Number(obj.scale || 1) || 1));
  const h = Math.max(4, (Math.max(...ys) - Math.min(...ys)) * (Number(obj.scale || 1) || 1));
  return { w, h };
}

function physicsBodyDescriptor(obj) {
  const ph = normalizeObjectPhysics(obj);
  const box = ph.shape === "collider" ? physicsBodyBoundsFromCollider(obj) : physicsObjectSize(obj);
  const w = box.w;
  const h = box.h;
  const cx = Number(obj.x || 0) + w / 2;
  const cy = Number(obj.y || 0) + h / 2;
  const circle = ph.shape === "circle";
  return {
    shape: circle ? "circle" : "box",
    x: cx,
    y: cy,
    w,
    h,
    r: Math.max(4, Math.min(w, h) / 2)
  };
}


function physicsDomainObjectForScene(scene = currentScene()) {
  const ph = normalizeScenePhysics(scene);
  if (!ph.domainObjectId) return null;
  return scene?.objects?.find(o => o.id === ph.domainObjectId) || null;
}

function physicsPointInsideDomain(x, y, scene = currentScene()) {
  const domain = physicsDomainObjectForScene(scene);
  if (!domain) return true;

  // Usamos el collider del hotspot/objeto si existe; si no, su rectángulo.
  if (typeof pointInObjectCollider === "function") {
    return pointInObjectCollider({ x, y }, domain);
  }

  const w = Number(domain.width || 0) * Number(domain.scale || 1);
  const h = Number(domain.height || 0) * Number(domain.scale || 1);
  return x >= domain.x && x <= domain.x + w && y >= domain.y && y <= domain.y + h;
}

function physicsObjectInsideDomain(obj, scene = currentScene()) {
  if (!obj) return false;
  const d = physicsBodyDescriptor(obj);
  return physicsPointInsideDomain(d.x, d.y, scene);
}


function physicsObjectActive(obj) {
  if (!obj || obj.type === "background") return false;

  // El player de aventura se mueve por pathfinding, no por Matter.js.
  // Esto evita que el motor físico bloquee el point-and-click.
  if (obj.type === "player" && !obj.physicsAsMatterBody) return false;

  const scene = currentScene();
  const scenePh = normalizeScenePhysics(scene);
  const ph = normalizeObjectPhysics(obj);

  if (!scenePh.enabled && !state.physicsPreviewRunning) return false;
  if (!ph.enabled) return false;

  if (typeof isObjectVisibleInCurrentState === "function" && !isObjectVisibleInCurrentState(obj)) return false;

  if (scenePh.domainObjectId && !physicsObjectInsideDomain(obj, scene)) return false;

  return true;
}



function physicsSaveStartPosition(obj) {
  if (!obj) return;
  const ph = normalizeObjectPhysics(obj);
  ph.startX = Number(obj.x || 0);
  ph.startY = Number(obj.y || 0);
  ph.startRotation = Number(obj.rotation || 0);
}

function resetPhysicsObject(objectId) {
  const scene = currentScene();
  const obj = scene?.objects?.find(o => o.id === objectId);
  if (!obj) return false;
  const ph = normalizeObjectPhysics(obj);
  if (ph.startX !== null && ph.startX !== undefined) obj.x = Number(ph.startX) || 0;
  if (ph.startY !== null && ph.startY !== undefined) obj.y = Number(ph.startY) || 0;
  if (ph.startRotation !== null && ph.startRotation !== undefined) obj.rotation = Number(ph.startRotation) || 0;
  if (state.physicsRuntime?.bodyByObjectId?.[obj.id] && window.Matter?.Body) {
    const body = state.physicsRuntime.bodyByObjectId[obj.id];
    const d = physicsBodyDescriptor(obj);
    Matter.Body.setPosition(body, { x: d.x, y: d.y });
    Matter.Body.setVelocity(body, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(body, 0);
    Matter.Body.setAngle(body, (Number(obj.rotation || 0) * Math.PI) / 180);
  }
  renderAll();
  return true;
}

function resetPhysicsWorld() {
  stopPhysicsWorld();
  currentScene()?.objects?.forEach(obj => {
    if (normalizeObjectPhysics(obj).enabled) resetPhysicsObject(obj.id);
  });
  if (state.mode === "play" || state.physicsPreviewRunning) startPhysicsWorldForCurrentScene({ force: true });
  syncPhysicsEditorOverlay();
}

function physicsCreateMatterBody(obj) {
  if (!physicsMatterAvailable()) return null;
  const ph = normalizeObjectPhysics(obj);
  const d = physicsBodyDescriptor(obj);
  const type = ph.bodyType || "dynamic";

  const opts = {
    label: obj.id,
    isStatic: type === "static",
    isSensor: type === "sensor",
    friction: Number(ph.friction ?? 0.2),
    restitution: Number(ph.restitution ?? 0.1),
    density: Number(ph.density ?? 0.001)
  };

  let body;
  if (d.shape === "circle") {
    body = Matter.Bodies.circle(d.x, d.y, d.r, opts);
  } else {
    body = Matter.Bodies.rectangle(d.x, d.y, d.w, d.h, opts);
  }

  body.aventurIAObjectId = obj.id;
  body.aventurIAWidth = d.w;
  body.aventurIAHeight = d.h;

  if (type === "dynamic") {
    try { Matter.Body.setMass(body, Math.max(0.1, Number(ph.mass) || 1)); } catch (err) {}
  }

  try {
    Matter.Body.setAngle(body, (Number(obj.rotation || 0) * Math.PI) / 180);
  } catch (err) {}

  if (ph.lockRotation) {
    try { Matter.Body.setInertia(body, Infinity); } catch (err) {}
  }

  if (ph.startSleeping && window.Matter.Sleeping) {
    try { Matter.Sleeping.set(body, true); } catch (err) {}
  }

  return body;
}

function physicsAddWorldBounds(engine) {
  if (!physicsMatterAvailable()) return [];
  const { width, height } = physicsStageSize();
  const t = 96;
  const opts = { isStatic: true, label: "__world_bound" };
  return [
    Matter.Bodies.rectangle(width / 2, -t / 2, width + t * 2, t, opts),
    Matter.Bodies.rectangle(width / 2, height + t / 2, width + t * 2, t, opts),
    Matter.Bodies.rectangle(-t / 2, height / 2, t, height + t * 2, opts),
    Matter.Bodies.rectangle(width + t / 2, height / 2, t, height + t * 2, opts)
  ];
}

function startPhysicsWorldForCurrentScene({ force = false, preview = false } = {}) {
  const scene = currentScene();
  if (!scene) return false;

  const scenePh = normalizeScenePhysics(scene);
  const allowPhysics = !!scenePh.enabled || !!preview;
  if (!allowPhysics) {
    stopPhysicsWorld();
    syncPhysicsEditorOverlay();
    return false;
  }

  if (!physicsMatterAvailable()) {
    showMessage("Matter.js no está cargado. Revisa la conexión o usa la versión con acceso a CDN.");
    return false;
  }

  if (!force && state.physicsRuntime?.running && state.physicsRuntime.sceneId === scene.id) return true;

  stopPhysicsWorld();

  const engine = Matter.Engine.create();
  engine.gravity.x = Number(scenePh.gravityX || 0) / 1000;
  engine.gravity.y = Number(scenePh.gravityY || 0) / 1000;
  engine.gravity.scale = 0.001;

  const bodyByObjectId = {};
  const objectIdByBodyId = {};

  const bodies = [];
  scene.objects.forEach(obj => {
    if (!physicsObjectActive(obj)) return;
    const ph = normalizeObjectPhysics(obj);
    if (ph.startX === null || ph.startX === undefined) physicsSaveStartPosition(obj);
    const body = physicsCreateMatterBody(obj);
    if (!body) return;
    bodies.push(body);
    bodyByObjectId[obj.id] = body;
    objectIdByBodyId[body.id] = obj.id;
  });

  if (scenePh.worldBounds !== false) bodies.push(...physicsAddWorldBounds(engine));

  Matter.World.add(engine.world, bodies);

  state.physicsRuntime = {
    running: true,
    preview,
    sceneId: scene.id,
    engine,
    bodyByObjectId,
    objectIdByBodyId,
    lastT: performance.now(),
    raf: null,
    collisionMemory: new Set()
  };

  try {
    Matter.Events.on(engine, "collisionStart", event => {
      event.pairs.forEach(pair => handleMatterCollision(pair, "physicsCollision"));
    });
  } catch (err) {}

  const tick = t => {
    const rt = state.physicsRuntime;
    if (!rt?.running || rt.sceneId !== currentScene()?.id) return;

    const ph = normalizeScenePhysics(currentScene());
    const dt = Math.min(33.34, Math.max(8, t - (rt.lastT || t))) * Math.max(0, Number(ph.timeScale || 1));
    rt.lastT = t;

    Matter.Engine.update(rt.engine, dt);
    syncObjectsFromPhysics();
    if (ph.debug || state.mode === "physics") syncPhysicsEditorOverlay();

    rt.raf = requestAnimationFrame(tick);
  };

  state.physicsRuntime.raf = requestAnimationFrame(tick);
  syncPhysicsEditorOverlay();
  return true;
}


function forceStopPhysicsForEditor(reason = "editor") {
  try {
    const rt = state.physicsRuntime;
    if (rt?.raf) cancelAnimationFrame(rt.raf);
    if (rt?.runner && window.Matter?.Runner) {
      try { Matter.Runner.stop(rt.runner); } catch (err) {}
    }
    if (rt?.engine && window.Matter?.World) {
      try { Matter.World.clear(rt.engine.world, false); } catch (err) {}
      try { Matter.Engine.clear(rt.engine); } catch (err) {}
    }
  } catch (err) {}

  state.physicsRuntime = null;
  state.physicsPreviewRunning = false;
  state.physicsEditorDragging = false;
  state._physicsEditorIsolatedReason = reason;
}


function stopPhysicsWorld() {
  forceStopPhysicsForEditor("stopPhysicsWorld");
}


function restartPhysicsWorld() {
  if (state.mode === "play" || state.physicsPreviewRunning) {
    startPhysicsWorldForCurrentScene({ force: true, preview: !!state.physicsPreviewRunning });
  } else {
    forceStopPhysicsForEditor("restartOutsidePlay");
  }
  syncPhysicsEditorOverlay();
}


function syncObjectsFromPhysics() {
  const scene = currentScene();
  const rt = state.physicsRuntime;
  if (!scene || !rt?.bodyByObjectId) return;

  const scenePh = normalizeScenePhysics(scene);

  scene.objects.forEach(obj => {
    const body = rt.bodyByObjectId[obj.id];
    if (!body) return;

    const d = physicsBodyDescriptor(obj);

    if (scenePh.domainObjectId && !physicsPointInsideDomain(body.position.x, body.position.y, scene)) {
      if (window.Matter?.Body) {
        Matter.Body.setVelocity(body, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(body, 0);
      }
      return;
    }

    obj.x = body.position.x - d.w / 2;
    obj.y = body.position.y - d.h / 2;
    obj.rotation = (body.angle * 180) / Math.PI;
  });

  if (typeof updateRuntimeElements === "function") updateRuntimeElements();
}


function handleMatterCollision(pair, eventName = "physicsCollision") {
  const rt = state.physicsRuntime;
  if (!rt) return;
  const a = rt.objectIdByBodyId[pair.bodyA.id];
  const b = rt.objectIdByBodyId[pair.bodyB.id];
  if (!a || !b) return;
  const key = [a, b].sort().join(":");
  if (rt.collisionMemory.has(key)) return;
  rt.collisionMemory.add(key);
  setTimeout(() => rt?.collisionMemory?.delete(key), 120);

  try {
    runLogicGraph(eventName, null, {
      objectAId: a,
      objectBId: b,
      targetObjectId: b,
      subject: currentScene().objects.find(o => o.id === a),
      lastObject: currentScene().objects.find(o => o.id === b)
    });
  } catch (err) {}
}

function applyPhysicsImpulse(objectId, x = 0, y = 0) {
  const body = state.physicsRuntime?.bodyByObjectId?.[objectId];
  if (!body || !window.Matter?.Body) return false;
  Matter.Body.applyForce(body, body.position, { x: Number(x || 0) / 10000, y: Number(y || 0) / 10000 });
  if (window.Matter.Sleeping) Matter.Sleeping.set(body, false);
  return true;
}

function setPhysicsVelocity(objectId, x = 0, y = 0) {
  const body = state.physicsRuntime?.bodyByObjectId?.[objectId];
  if (!body || !window.Matter?.Body) return false;
  Matter.Body.setVelocity(body, { x: Number(x || 0), y: Number(y || 0) });
  if (window.Matter.Sleeping) Matter.Sleeping.set(body, false);
  return true;
}

function setPhysicsEnabledForObject(objectId, enabled = true) {
  const obj = currentScene()?.objects?.find(o => o.id === objectId);
  if (!obj) return false;
  normalizeObjectPhysics(obj).enabled = !!enabled;
  restartPhysicsWorld();
  renderProperties();
  return true;
}

function syncPhysicsEditorOverlay() {
  const svg = $("physicsDebugLayer");
  if (!svg) return;
  const scene = currentScene();
  if (!scene) {
    svg.innerHTML = "";
    renderPhysicsEditorPanel();
    return;
  }

  const scenePh = normalizeScenePhysics(scene);
  const show = state.mode === "physics" || (state.mode === "play" && scenePh.debug);
  svg.classList.toggle("hidden", !show);
  if (!show) {
    svg.innerHTML = "";
    renderPhysicsEditorPanel();
    return;
  }

  const { width, height } = physicsStageSize();
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.innerHTML = "";

  const domain = typeof physicsDomainObjectForScene === "function" ? physicsDomainObjectForScene(scene) : null;
  if (domain) {
    const d = physicsBodyDescriptor(domain);
    const domainRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    domainRect.setAttribute("x", d.x - d.w / 2);
    domainRect.setAttribute("y", d.y - d.h / 2);
    domainRect.setAttribute("width", d.w);
    domainRect.setAttribute("height", d.h);
    domainRect.setAttribute("class", "physicsDebugDomain");
    domainRect.addEventListener("pointerdown", e => {
      e.stopPropagation();
      e.preventDefault();
      selectPhysicsEditorObject(domain.id);
    });
    svg.appendChild(domainRect);
  }

  scene.objects.forEach(obj => {
    if (obj.type === "background") return;
    const ph = normalizeObjectPhysics(obj);

    // En modo Física mostramos también los no activados con trazo suave para poder activarlos.
    if (!ph.enabled && state.mode !== "physics") return;

    const d = physicsBodyDescriptor(obj);
    const cls = ph.bodyType === "sensor" ? "sensor" : ph.bodyType === "static" ? "static" : "";
    let el;
    if (d.shape === "circle") {
      el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      el.setAttribute("cx", d.x);
      el.setAttribute("cy", d.y);
      el.setAttribute("r", d.r);
    } else {
      el = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      el.setAttribute("x", d.x - d.w / 2);
      el.setAttribute("y", d.y - d.h / 2);
      el.setAttribute("width", d.w);
      el.setAttribute("height", d.h);
      el.setAttribute("transform", `rotate(${Number(obj.rotation || 0)} ${d.x} ${d.y})`);
    }

    el.setAttribute("class", `physicsDebugBody ${cls} ${obj.id === state.selectedObjectId ? "selectedPhysicsBody" : ""}`);
    el.setAttribute("data-id", obj.id);
    el.addEventListener("pointerdown", e => {
      e.stopPropagation();
      e.preventDefault();
      selectPhysicsEditorObject(obj.id);
      if (state.physicsTool && state.physicsTool !== "select") {
        applyPhysicsEditorToolToObject(obj, state.physicsTool);
      }
    });
    el.addEventListener("dblclick", e => {
      e.stopPropagation();
      e.preventDefault();
      selectPhysicsEditorObject(obj.id);
      if (typeof openColliderEditor === "function") openColliderEditor(obj.id);
    });
    svg.appendChild(el);

    const pivot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    pivot.setAttribute("cx", d.x);
    pivot.setAttribute("cy", d.y);
    pivot.setAttribute("r", obj.id === state.selectedObjectId ? 5 : 3);
    pivot.setAttribute("class", "physicsDebugPivot");
    pivot.setAttribute("data-id", obj.id);
    pivot.addEventListener("pointerdown", e => {
      e.stopPropagation();
      e.preventDefault();
      selectPhysicsEditorObject(obj.id);
    });
    svg.appendChild(pivot);
  });

  renderPhysicsEditorPanel();
}



function renderPhysicsEditorPanel() {
  const obj = selectedObject();
  const info = $("physicsSelectedInfo");
  if (!info) return;

  if (!obj) {
    info.innerHTML = "Selecciona un objeto de la escena o haz clic en un cuerpo del overlay.";
    ["physicsMakeDynamicBtn", "physicsMakeStaticBtn", "physicsMakeSensorBtn", "physicsDisableObjectBtn", "physicsEditColliderBtn"].forEach(id => {
      if ($(id)) $(id).disabled = true;
    });
    return;
  }

  const ph = normalizeObjectPhysics(obj);
  ["physicsMakeDynamicBtn", "physicsMakeStaticBtn", "physicsMakeSensorBtn", "physicsDisableObjectBtn", "physicsEditColliderBtn"].forEach(id => {
    if ($(id)) $(id).disabled = false;
  });

  info.innerHTML = `
    <strong>${obj.name}</strong><br>
    Tipo objeto: ${obj.type}<br>
    Física: ${ph.enabled ? "activada" : "desactivada"}<br>
    Cuerpo: ${ph.bodyType || "dynamic"} · Forma: ${ph.shape || "box"}<br>
    Masa: ${ph.mass ?? 1} · Fricción: ${ph.friction ?? 0.2} · Rebote: ${ph.restitution ?? 0.1}
  `;
}



function selectPhysicsEditorObject(objectId) {
  const scene = currentScene();
  const obj = scene?.objects?.find(o => o.id === objectId);
  if (!obj) return false;

  clearSelection();
  state.selectedPanel = "object";
  state.selectedObjectId = obj.id;
  renderProperties();
  renderOutliner();
  renderPhysicsEditorPanel();
  syncPhysicsEditorOverlay();
  return true;
}

function applyPhysicsEditorToolToObject(obj, tool = "select") {
  if (!obj || tool === "select") return false;
  if (obj.type === "player" && !obj.physicsAsMatterBody) {
    showMessage("El Player se controla por pathfinding. No se convierte en cuerpo físico Matter.js.");
    return false;
  }
  const ph = normalizeObjectPhysics(obj);
  ph.enabled = true;

  if (tool === "box") {
    ph.shape = "box";
    if (ph.bodyType === "sensor") ph.bodyType = "dynamic";
  } else if (tool === "circle") {
    ph.shape = "circle";
    if (ph.bodyType === "sensor") ph.bodyType = "dynamic";
  } else if (tool === "sensor") {
    ph.shape = "box";
    ph.bodyType = "sensor";
  }

  ph.startX = obj.x;
  ph.startY = obj.y;
  ph.startRotation = Number(obj.rotation || 0);

  renderProperties();
  renderPhysicsEditorPanel();
  syncPhysicsEditorOverlay();
  return true;
}

function setPhysicsBodyTypeForSelected(bodyType) {
  const obj = selectedObject();
  if (!obj) return false;
  if (obj.type === "player" && !obj.physicsAsMatterBody) {
    const phPlayer = normalizeObjectPhysics(obj);
    phPlayer.enabled = false;
    showMessage("El Player se controla por pathfinding. Matter.js queda desactivado para él.");
    renderProperties();
    renderPhysicsEditorPanel();
    syncPhysicsEditorOverlay();
    return false;
  }
  const ph = normalizeObjectPhysics(obj);
  ph.enabled = bodyType !== "disabled";
  if (bodyType !== "disabled") ph.bodyType = bodyType;
  ph.startX = obj.x;
  ph.startY = obj.y;
  ph.startRotation = Number(obj.rotation || 0);
  renderProperties();
  renderPhysicsEditorPanel();
  syncPhysicsEditorOverlay();
  return true;
}


function setPhysicsEditorTool(tool = "select") {
  state.tool = "select";
  state.physicsTool = tool;

  ["physicsSelectToolBtn", "physicsBoxToolBtn", "physicsCircleToolBtn", "physicsSensorToolBtn"].forEach(id => $(id)?.classList.remove("active"));
  if (tool === "select") $("physicsSelectToolBtn")?.classList.add("active");
  if (tool === "box") $("physicsBoxToolBtn")?.classList.add("active");
  if (tool === "circle") $("physicsCircleToolBtn")?.classList.add("active");
  if (tool === "sensor") $("physicsSensorToolBtn")?.classList.add("active");

  const obj = selectedObject();
  if (obj && ["box", "circle", "sensor"].includes(tool)) {
    applyPhysicsEditorToolToObject(obj, tool);
  } else {
    renderPhysicsEditorPanel();
    syncPhysicsEditorOverlay();
  }
}


function bindPhysicsEditor() {
  $("physicsSelectToolBtn")?.addEventListener("click", () => setPhysicsEditorTool("select"));
  $("physicsBoxToolBtn")?.addEventListener("click", () => setPhysicsEditorTool("box"));
  $("physicsCircleToolBtn")?.addEventListener("click", () => setPhysicsEditorTool("circle"));
  $("physicsSensorToolBtn")?.addEventListener("click", () => setPhysicsEditorTool("sensor"));

  $("physicsMakeDynamicBtn")?.addEventListener("click", () => setPhysicsBodyTypeForSelected("dynamic"));
  $("physicsMakeStaticBtn")?.addEventListener("click", () => setPhysicsBodyTypeForSelected("static"));
  $("physicsMakeSensorBtn")?.addEventListener("click", () => setPhysicsBodyTypeForSelected("sensor"));
  $("physicsDisableObjectBtn")?.addEventListener("click", () => setPhysicsBodyTypeForSelected("disabled"));

  $("physicsEditColliderBtn")?.addEventListener("click", () => {
    const obj = selectedObject();
    if (!obj) {
      alert("Selecciona primero un objeto físico.");
      return;
    }
    if (typeof openColliderEditor === "function") openColliderEditor(obj.id);
  });

  $("physicsToggleDebugBtn")?.addEventListener("click", () => {
    const scene = currentScene();
    if (!scene) return;
    const ph = normalizeScenePhysics(scene);
    ph.debug = !ph.debug;
    if ($("scenePhysicsDebug")) $("scenePhysicsDebug").checked = !!ph.debug;
    syncPhysicsEditorOverlay();
  });

  $("physicsPreviewBtn")?.addEventListener("click", () => {
    state.physicsPreviewRunning = true;
    // Preview temporal: NO cambia scene.physics.enabled.
    startPhysicsWorldForCurrentScene({ force: true, preview: true });
    renderPhysicsEditorPanel();
  });

  $("physicsStopPreviewBtn")?.addEventListener("click", () => {
    stopPhysicsWorld();
    renderAll();
    renderPhysicsEditorPanel();
  });

  $("physicsResetBtn")?.addEventListener("click", () => resetPhysicsWorld());

  renderPhysicsEditorPanel();
}

