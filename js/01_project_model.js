// AventurIA v54 Modular Base — 01_project_model.js
// Extraído de v53 funcional. Script clásico global; el orden de carga importa.


function slugStateName(name = "") {
  return String(name || "").trim() || "default";
}

function normalizeObjectStates(obj) {
  if (!obj) return [];
  obj.states ??= [];
  if (!Array.isArray(obj.states)) obj.states = [];

  obj.states = obj.states.map(st => ({
    id: st.id || uid(),
    name: slugStateName(st.name || st.id || "default"),
    imageId: st.imageId || "",
    visible: st.visible !== false,
    interactable: st.interactable !== false
  }));

  if (!obj.states.some(st => st.name === "default")) {
    obj.states.unshift({
      id: uid(),
      name: "default",
      imageId: "",
      visible: obj.visible !== false,
      interactable: true
    });
  }

  if (!obj.states.some(st => st.name === "hidden")) {
    obj.states.push({
      id: uid(),
      name: "hidden",
      imageId: "",
      visible: false,
      interactable: false
    });
  }

  obj.initialState = slugStateName(obj.initialState || obj.state || "default");
  obj.state = slugStateName(obj.state || obj.initialState || "default");
  obj.collectState ??= obj.states.some(st => st.name === "recogida") ? "recogida" : "hidden";
  obj.inventoryImageId ??= "";

  if (!obj.states.some(st => st.name === obj.initialState)) {
    obj.states.push({
      id: uid(),
      name: obj.initialState,
      imageId: "",
      visible: obj.initialState !== "hidden",
      interactable: obj.initialState !== "hidden" && obj.initialState !== "disabled"
    });
  }

  return obj.states;
}

function objectStateName(obj) {
  if (!obj) return "default";
  return slugStateName((state.runtimeStates && state.runtimeStates[obj.id]) ?? obj.state ?? obj.initialState ?? "default");
}

function objectStateDef(obj, stateName = null) {
  if (!obj) return null;
  const states = normalizeObjectStates(obj);
  const name = slugStateName(stateName || objectStateName(obj));
  return states.find(st => st.name === name) || states.find(st => st.name === "default") || null;
}

function objectHasState(obj, stateName = "") {
  if (!obj) return false;
  const name = slugStateName(stateName);
  return normalizeObjectStates(obj).some(st => st.name === name);
}

function effectiveObjectImageId(obj) {
  const st = objectStateDef(obj);
  return st?.imageId || obj?.imageId || "";
}

function objectInventoryImageId(obj) {
  if (!obj) return "";
  if (obj.inventoryImageId) return obj.inventoryImageId;
  if (obj.imageId) return obj.imageId;
  const visibleState = normalizeObjectStates(obj).find(st => st.visible !== false && st.imageId);
  return visibleState?.imageId || effectiveObjectImageId(obj);
}

function isObjectVisibleInCurrentState(obj) {
  if (!obj) return false;
  const name = objectStateName(obj);
  if (name === "hidden") return false;
  const st = objectStateDef(obj, name);
  if (st && st.visible === false) return false;
  return obj.visible !== false;
}

function isObjectInteractableInCurrentState(obj) {
  if (!isObjectVisibleInCurrentState(obj)) return false;
  const name = objectStateName(obj);
  if (name === "disabled") return false;
  const st = objectStateDef(obj, name);
  return st?.interactable !== false;
}

function preferredStateName(obj, candidates = [], fallback = "default") {
  if (!obj) return fallback;
  normalizeObjectStates(obj);
  for (const name of candidates) {
    if (objectHasState(obj, name)) return name;
  }
  return fallback;
}

function applyObjectState(obj, stateName = "default", { render = true, resetTriggers = true } = {}) {
  if (!obj) return false;
  normalizeObjectStates(obj);
  const name = slugStateName(stateName);
  obj.state = name;
  state.runtimeStates ??= {};
  state.runtimeStates[obj.id] = name;
  if (resetTriggers && typeof resetSpatialTriggersForObject === "function") {
    resetSpatialTriggersForObject(obj.id);
  }
  if (render) renderAll();
  return true;
}



function defaultScenePhysics() {
  return {
    enabled: false,
    gravityX: 0,
    gravityY: 900,
    timeScale: 1,
    worldBounds: true,
    domainObjectId: "",
    domainMode: "freezeOutside",
    resetOnEnter: true,
    debug: false
  };
}

function defaultObjectPhysics() {
  return {
    enabled: false,
    bodyType: "dynamic",
    shape: "box",
    mass: 1,
    density: 0.001,
    friction: 0.2,
    restitution: 0.1,
    lockRotation: false,
    startSleeping: false,
    startX: null,
    startY: null,
    startRotation: null,
    constraints: []
  };
}

function normalizeScenePhysics(scene) {
  if (!scene) return defaultScenePhysics();
  scene.physics ??= {};
  const d = defaultScenePhysics();
  Object.keys(d).forEach(k => {
    if (scene.physics[k] === undefined || scene.physics[k] === null) scene.physics[k] = d[k];
  });
  scene.physics.gravityX = Number(scene.physics.gravityX) || 0;
  scene.physics.gravityY = Number(scene.physics.gravityY) || 0;
  scene.physics.timeScale = Math.max(0, Number(scene.physics.timeScale) || 1);
  scene.physics.domainObjectId ??= "";
  scene.physics.domainMode ??= "freezeOutside";
  return scene.physics;
}

function normalizeObjectPhysics(obj) {
  if (!obj) return defaultObjectPhysics();
  obj.physics ??= {};
  const d = defaultObjectPhysics();
  Object.keys(d).forEach(k => {
    if (obj.physics[k] === undefined || obj.physics[k] === null) obj.physics[k] = d[k];
  });
  obj.physics.mass = Math.max(0.1, Number(obj.physics.mass) || 1);
  obj.physics.density = Math.max(0.0001, Number(obj.physics.density) || 0.001);
  obj.physics.friction = Math.max(0, Math.min(1, Number(obj.physics.friction) || 0));
  obj.physics.restitution = Math.max(0, Math.min(1, Number(obj.physics.restitution) || 0));
  return obj.physics;
}



function defaultPathfindingSettings() {
  return {
    enabled: true,
    gridSize: 32,
    obstaclePadding: 14,
    diagonal: true,
    debug: false
  };
}

function normalizePathfindingSettings(scene) {
  if (!scene) return defaultPathfindingSettings();
  scene.pathfinding ??= {};
  const d = defaultPathfindingSettings();
  Object.keys(d).forEach(k => {
    if (scene.pathfinding[k] === undefined || scene.pathfinding[k] === null) scene.pathfinding[k] = d[k];
  });
  scene.pathfinding.gridSize = Math.max(8, Math.min(96, Number(scene.pathfinding.gridSize) || d.gridSize));
  scene.pathfinding.obstaclePadding = Math.max(0, Math.min(96, Number(scene.pathfinding.obstaclePadding) || 0));
  scene.pathfinding.diagonal = scene.pathfinding.diagonal !== false;
  return scene.pathfinding;
}


function defaultPathFootprintForObject(obj = {}) {
  if (obj.type === "player") {
    return { enabled: true, mode: "feet", shape: "ellipse", x: 0.28, y: 0.70, width: 0.44, height: 0.22, auto: true };
  }
  if (obj.type === "background") {
    return { enabled: false, mode: "none", shape: "rect", x: 0, y: 0, width: 1, height: 1, auto: true };
  }
  return { enabled: true, mode: "groundProjection", shape: "ellipse", x: 0.22, y: 0.74, width: 0.56, height: 0.20, auto: true };
}

function normalizePathFootprint(obj) {
  if (!obj) return null;
  obj.pathFootprint ??= defaultPathFootprintForObject(obj);
  const d = defaultPathFootprintForObject(obj);
  obj.pathFootprint.enabled = obj.type === "background" ? false : obj.pathFootprint.enabled !== false;
  obj.pathFootprint.mode = obj.pathFootprint.mode || d.mode;
  obj.pathFootprint.shape = ["ellipse", "rect"].includes(obj.pathFootprint.shape) ? obj.pathFootprint.shape : d.shape;
  ["x", "y", "width", "height"].forEach(k => {
    const value = Number(obj.pathFootprint[k]);
    obj.pathFootprint[k] = Number.isFinite(value) ? value : d[k];
  });
  obj.pathFootprint.x = Math.max(-1, Math.min(2, obj.pathFootprint.x));
  obj.pathFootprint.y = Math.max(-1, Math.min(2, obj.pathFootprint.y));
  obj.pathFootprint.width = Math.max(0.02, Math.min(2, obj.pathFootprint.width));
  obj.pathFootprint.height = Math.max(0.02, Math.min(2, obj.pathFootprint.height));
  obj.pathFootprint.auto = obj.pathFootprint.auto !== false;
  return obj.pathFootprint;
}

function objectPathFootprintRect(obj, padding = 0) {
  if (!obj) return null;
  const fp = normalizePathFootprint(obj);
  if (!fp?.enabled) return null;
  const scale = Number(obj.scale || 1);
  const w = Math.max(1, Number(obj.width || 1) * scale);
  const h = Math.max(1, Number(obj.height || 1) * scale);
  return {
    x: Number(obj.x || 0) + fp.x * w - padding,
    y: Number(obj.y || 0) + fp.y * h - padding,
    width: fp.width * w + padding * 2,
    height: fp.height * h + padding * 2,
    shape: fp.shape || "ellipse",
    source: "pathFootprint"
  };
}

function pointInObjectPathFootprint(point, obj, padding = 0) {
  const rect = objectPathFootprintRect(obj, padding);
  if (!rect) return false;
  if (rect.shape === "ellipse") {
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const rx = Math.max(1, rect.width / 2);
    const ry = Math.max(1, rect.height / 2);
    const dx = (point.x - cx) / rx;
    const dy = (point.y - cy) / ry;
    return dx * dx + dy * dy <= 1;
  }
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}


function objectBlocksPathfinding(obj) {
  if (!obj || obj.type === "background" || obj.type === "player") return false;
  return obj.pathBlocker === true;
}






function normalizePlayerPathfindingSettings(obj) {
  if (!obj || obj.type !== "player") return obj;
  obj.usePathfinding = obj.usePathfinding !== false;
  obj.navigationMode = "pathfinding";
  obj.pathBlocker = false;
  obj.physicsAsMatterBody = false;
  obj.speed = Math.max(120, Number(obj.speed || 260));
  obj.collider ??= defaultColliderForObject(obj);
  obj.collider.enabled = true;
  obj.collider.required = true;
  obj.collider.userEnabled = true;
  obj.collider.visible = obj.collider.visible !== false;
  return obj;
}

function scenePlayerUsesPathfinding(scene) {
  const player = scene?.objects?.find(o => o.type === "player");
  return !!player && player.usePathfinding !== false;
}

function syncScenePathfindingFromPlayer(scene) {
  if (!scenePlayerUsesPathfinding(scene)) return scene;
  scene.pathfinding ??= defaultPathfindingSettings();
  scene.pathfinding.enabled = true;
  scene.pathfinding.diagonal = scene.pathfinding.diagonal !== false;
  scene.pathfinding.gridSize = Math.max(8, Math.min(96, Number(scene.pathfinding.gridSize || 24)));
  scene.pathfinding.obstaclePadding = Math.max(0, Math.min(96, Number(scene.pathfinding.obstaclePadding ?? 8)));
  return scene;
}


function normalizeAdventurePlayerControl(obj) {
  if (!obj) return obj;
  obj.physicsAsMatterBody ??= false;

  if (obj.type === "player") {
    normalizePlayerPathfindingSettings(obj);
  }

  if (obj.type === "player" && !obj.physicsAsMatterBody) {
    obj.pathBlocker = false;
    obj.physics ??= defaultObjectPhysics();
    obj.physics.enabled = false;

    obj.collider ??= defaultColliderForObject(obj);
    obj.collider.required = true;
    obj.collider.enabled = true;
    obj.collider.userEnabled = true;
  }

  return obj;
}



function makeMinimalScene(name = "Escena 1") {
  return {
    id: uid(),
    name,
    navZones: [],
    parallaxStrength: 0.1,
    pathfinding: typeof defaultPathfindingSettings === "function"
      ? defaultPathfindingSettings()
      : { enabled: true, gridSize: 32, obstaclePadding: 12, diagonal: true, debug: false },
    logic: { nodes: [], links: [] },
    objects: []
  };
}


function svgDataUrl(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(String(svg || "").trim())}`;
}

function ensureBuiltinPathfindingLabAssets(project) {
  if (!project) return {};
  project.assets ??= { images: [], audio: [] };
  project.assets.images ??= [];

  const ensureImage = (id, name, svg, width = 1280, height = 720) => {
    let asset = project.assets.images.find(a => a && a.id === id);
    if (!asset) {
      asset = normalizeImageAsset({
        id,
        name,
        type: "image/svg+xml",
        mimeType: "image/svg+xml",
        width,
        height,
        dataUrl: svgDataUrl(svg)
      }, name);
      project.assets.images.push(asset);
    } else {
      asset.name = asset.name || name;
      asset.type = asset.type || "image/svg+xml";
      asset.mimeType = asset.mimeType || "image/svg+xml";
      asset.width = asset.width || width;
      asset.height = asset.height || height;
      asset.dataUrl = asset.dataUrl || svgDataUrl(svg);
      asset.src = asset.src || asset.dataUrl;
    }
    return asset.id;
  };

  const bgSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <rect width="1280" height="720" fill="#171a22"/>
    <rect x="0" y="0" width="1280" height="720" fill="url(#grid)" opacity="0.35"/>
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#262c39" stroke-width="1"/>
      </pattern>
      <filter id="shadow"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000" flood-opacity="0.35"/></filter>
    </defs>
    <rect x="160" y="60" width="960" height="220" rx="28" fill="#3b7f6b" opacity="0.95" filter="url(#shadow)"/>
    <rect x="520" y="240" width="240" height="420" rx="28" fill="#3b7f6b" opacity="0.95" filter="url(#shadow)"/>
    <path d="M220 170 L 1060 170" stroke="#d8f3e6" stroke-width="6" stroke-dasharray="14 14" opacity="0.45"/>
    <path d="M640 190 L 640 620" stroke="#d8f3e6" stroke-width="6" stroke-dasharray="14 14" opacity="0.45"/>
    <circle cx="640" cy="250" r="18" fill="#f7e7a2" stroke="#fff4ce" stroke-width="3"/>
    <text x="640" y="42" text-anchor="middle" fill="#f5f7fb" font-family="Arial, sans-serif" font-size="30" font-weight="700">TEST Pathfinding Lab</text>
    <text x="640" y="690" text-anchor="middle" fill="#cfd8e8" font-family="Arial, sans-serif" font-size="18">Zona navegable en forma de T · haz clic a derecha o abajo para comprobar la ruta A*</text>
    <text x="256" y="118" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="700">Salida izquierda</text>
    <text x="910" y="118" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="700">Ramal derecho</text>
    <text x="680" y="606" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="700">Ramal inferior</text>
  </svg>`;

  const playerSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="90" height="150" viewBox="0 0 90 150">
    <ellipse cx="45" cy="136" rx="24" ry="8" fill="#000" opacity="0.25"/>
    <circle cx="45" cy="28" r="18" fill="#ffe3b5" stroke="#1f2530" stroke-width="3"/>
    <rect x="27" y="48" width="36" height="52" rx="12" fill="#6cc0ff" stroke="#1f2530" stroke-width="3"/>
    <rect x="17" y="58" width="14" height="42" rx="7" fill="#6cc0ff" stroke="#1f2530" stroke-width="3"/>
    <rect x="59" y="58" width="14" height="42" rx="7" fill="#6cc0ff" stroke="#1f2530" stroke-width="3"/>
    <rect x="29" y="98" width="12" height="34" rx="6" fill="#3d5169" stroke="#1f2530" stroke-width="3"/>
    <rect x="49" y="98" width="12" height="34" rx="6" fill="#3d5169" stroke="#1f2530" stroke-width="3"/>
    <text x="45" y="146" text-anchor="middle" fill="#eaf5ff" font-family="Arial, sans-serif" font-size="14" font-weight="700">PLAYER</text>
  </svg>`;

  const blockerSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="160" height="140" viewBox="0 0 160 140">
    <ellipse cx="80" cy="124" rx="48" ry="10" fill="#000" opacity="0.22"/>
    <rect x="24" y="28" width="112" height="82" rx="12" fill="#d67f2e" stroke="#5b3410" stroke-width="4"/>
    <rect x="36" y="40" width="88" height="58" rx="8" fill="#f1b04c" opacity="0.55"/>
    <path d="M80 28 L80 110" stroke="#5b3410" stroke-width="4" opacity="0.7"/>
    <path d="M24 68 L136 68" stroke="#5b3410" stroke-width="4" opacity="0.7"/>
    <text x="80" y="132" text-anchor="middle" fill="#fff1d6" font-family="Arial, sans-serif" font-size="14" font-weight="700">BLOCKER</text>
  </svg>`;

  const complexBgSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <rect width="1280" height="720" fill="#131720"/>
    <defs>
      <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#222838" stroke-width="1"/>
      </pattern>
      <filter id="shadow2"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#000" flood-opacity="0.32"/></filter>
      <linearGradient id="floorGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#244f46"/>
        <stop offset="100%" stop-color="#18362f"/>
      </linearGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#grid2)" opacity="0.4"/>
    <rect x="90" y="80" width="1100" height="560" rx="30" fill="url(#floorGrad)" opacity="0.95" filter="url(#shadow2)"/>
    <path d="M90 80 H1190 V640 H90 Z" fill="none" stroke="#8de3be" stroke-width="4" opacity="0.5"/>
    <text x="640" y="42" text-anchor="middle" fill="#f5f7fb" font-family="Arial, sans-serif" font-size="30" font-weight="700">TEST Pathfinding Maze</text>
    <text x="640" y="690" text-anchor="middle" fill="#cfd8e8" font-family="Arial, sans-serif" font-size="18">Escena compleja: el player debe rodear varios bloqueantes para llegar al destino</text>
    <circle cx="180" cy="590" r="20" fill="#74d99f" stroke="#dfffee" stroke-width="4"/>
    <text x="214" y="596" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="700">Inicio</text>
    <circle cx="1060" cy="170" r="20" fill="#ffd66b" stroke="#fff3bf" stroke-width="4"/>
    <text x="1094" y="176" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="700">Objetivo A</text>
    <circle cx="1030" cy="580" r="20" fill="#ff9b73" stroke="#ffd2c2" stroke-width="4"/>
    <text x="1064" y="586" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="700">Objetivo B</text>
    <text x="180" y="124" fill="#dfe9ff" font-family="Arial, sans-serif" font-size="16">Haz clic en la zona superior derecha o inferior derecha.</text>
    <text x="180" y="148" fill="#dfe9ff" font-family="Arial, sans-serif" font-size="16">La ruta debería girar varias veces y evitar los bloqueantes visibles.</text>
  </svg>`;

  const wallSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="120" viewBox="0 0 200 120">
    <defs>
      <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#6d7484"/>
        <stop offset="100%" stop-color="#3e4453"/>
      </linearGradient>
    </defs>
    <rect x="10" y="10" width="180" height="100" rx="18" fill="url(#metal)" stroke="#161a22" stroke-width="6"/>
    <rect x="26" y="26" width="148" height="68" rx="12" fill="#aab1c0" opacity="0.22"/>
    <circle cx="36" cy="30" r="4" fill="#dbe5f5" opacity="0.65"/>
    <circle cx="164" cy="30" r="4" fill="#dbe5f5" opacity="0.65"/>
    <circle cx="36" cy="90" r="4" fill="#dbe5f5" opacity="0.65"/>
    <circle cx="164" cy="90" r="4" fill="#dbe5f5" opacity="0.65"/>
    <text x="100" y="69" text-anchor="middle" fill="#ecf2ff" font-family="Arial, sans-serif" font-size="18" font-weight="700">WALL</text>
  </svg>`;

  return {
    backgroundId: ensureImage("builtin_pf_lab_bg", "builtin_pf_lab_bg", bgSvg, 1280, 720),
    complexBackgroundId: ensureImage("builtin_pf_maze_bg", "builtin_pf_maze_bg", complexBgSvg, 1280, 720),
    playerId: ensureImage("builtin_pf_lab_player", "builtin_pf_lab_player", playerSvg, 90, 150),
    blockerId: ensureImage("builtin_pf_lab_blocker", "builtin_pf_lab_blocker", blockerSvg, 160, 140),
    wallId: ensureImage("builtin_pf_maze_wall", "builtin_pf_maze_wall", wallSvg, 200, 120)
  };
}


function isPathfindingLabScene(scene) {
  return !!scene && (
    scene.builtinPathfindingLab === true ||
    scene.builtinPathfindingComplexLab === true ||
    scene.name === "TEST Pathfinding Lab" ||
    scene.name === "TEST Pathfinding Maze"
  );
}

function normalizePathfindingLabRuntimeScene(scene) {
  if (!scene) return scene;
  scene.objects ??= [];
  const player = scene.objects.find(o => o.type === "player");
  if (player) {
    player.name ||= "Player Test";
    player.visible = true;
    player.state = "default";
    player.initialState = "default";
    player.pathBlocker = false;
    player.usePathfinding = true;
    player.navigationMode = "pathfinding";
    player.physicsAsMatterBody = false;
    player.speed = Math.max(180, Number(player.speed || 250));
    player.collider ??= {
      enabled: true,
      required: true,
      visible: true,
      type: "box",
      x: 26,
      y: 104,
      width: 38,
      height: 28,
      userEnabled: true
    };
    player.collider.enabled = true;
    player.collider.required = true;
    player.collider.userEnabled = true;
    player.collider.visible = true;
    player.collider.type ||= "box";
    player.collider.x = Number(player.collider.x ?? 26);
    player.collider.y = Number(player.collider.y ?? 104);
    player.collider.width = Math.max(10, Number(player.collider.width || 38));
    player.collider.height = Math.max(10, Number(player.collider.height || 28));
    if (typeof normalizeObjectStates === "function") normalizeObjectStates(player);
    if (typeof normalizeAdventurePlayerControl === "function") normalizeAdventurePlayerControl(player);
  }
  scene.pathfinding ??= typeof defaultPathfindingSettings === "function" ? defaultPathfindingSettings() : { enabled: true, gridSize: 24, obstaclePadding: 8, diagonal: true, debug: true };
  scene.pathfinding.enabled = true;
  scene.pathfinding.debug = true;
  return scene;
}


function makePathfindingLabScene(project) {
  const stage = project?.stage || state.project?.stage || { width: 1280, height: 720 };
  const stageW = Number(stage.width || 1280);
  const stageH = Number(stage.height || 720);
  const assets = ensureBuiltinPathfindingLabAssets(project || state.project || { assets: { images: [] }, stage });

  const makeObj = data => ({
    id: data.id || uid(),
    name: data.name || "Objeto",
    type: data.type || "prop",
    x: Number(data.x || 0),
    y: Number(data.y || 0),
    width: Number(data.width || 80),
    height: Number(data.height || 80),
    scale: 1,
    rotation: 0,
    z: Number(data.z || 1),
    speed: Number(data.speed || 0),
    imageId: data.imageId || "",
    audioId: "",
    visible: true,
    states: [
      { id: uid(), name: "default", imageId: "", visible: true, interactable: true },
      { id: uid(), name: "hidden", imageId: "", visible: false, interactable: false }
    ],
    collectState: "hidden",
    inventoryImageId: "",
    physics: typeof defaultObjectPhysics === "function" ? defaultObjectPhysics() : { enabled: false },
    physicsAsMatterBody: false,
    pathBlocker: data.pathBlocker === true,
    pathFootprint: data.pathFootprint || (typeof defaultPathFootprintForObject === "function" ? defaultPathFootprintForObject({ type: data.type, width: data.width, height: data.height }) : null),
    usePathfinding: data.type === "player" ? data.usePathfinding !== false : false,
    navigationMode: data.type === "player" ? "pathfinding" : "",
    locked: false,
    action: data.action || "none",
    message: data.message || "",
    targetSceneId: "",
    targetObjectId: "",
    requiresItemId: "",
    lockedMessage: "Necesitas otro objeto para hacer eso.",
    requireProximity: data.type !== "background",
    interactionDistance: 190,
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
    parallax: { enabled: data.type === "background" ? false : false, x: 0, y: 0 },
    bgResize: data.type === "background" ? "cover" : "cover",
    autoFlipX: data.type === "player",
    facing: 1,
    sprite: {
      enabled: false,
      frameWidth: Number(data.width || 80),
      frameHeight: Number(data.height || 80),
      columns: 1,
      rows: 1,
      fps: 8,
      currentFrame: 0,
      currentClip: "idle",
      playing: false,
      direction: 1,
      moveClip: "run",
      stopClip: "idle",
      clips: { idle: { from: 0, to: 0, fps: 8, mode: "loop" } }
    },
    collider: data.collider || {
      enabled: data.type === "player" || data.pathBlocker === true,
      required: data.type === "player",
      visible: true,
      type: "box",
      x: 0,
      y: 0,
      width: Number(data.width || 80),
      height: Number(data.height || 80),
      userEnabled: data.type === "player" || data.pathBlocker === true
    },
    transformClips: []
  });

  const scene = makeMinimalScene("TEST Pathfinding Lab");
  scene.builtinPathfindingLab = true;
  scene.pathfinding = {
    enabled: true,
    gridSize: 24,
    obstaclePadding: 8,
    diagonal: true,
    debug: true
  };
  scene.navZones = [{
    id: uid(),
    name: "Zona T",
    enabled: true,
    points: [
      { x: 160, y: 60 },
      { x: stageW - 160, y: 60 },
      { x: stageW - 160, y: 280 },
      { x: Math.round(stageW * 0.594), y: 280 },
      { x: Math.round(stageW * 0.594), y: stageH - 60 },
      { x: Math.round(stageW * 0.406), y: stageH - 60 },
      { x: Math.round(stageW * 0.406), y: 280 },
      { x: 160, y: 280 }
    ]
  }];

  const bg = makeObj({
    id: "builtin_pf_lab_bg_obj",
    name: "BG Pathfinding Lab",
    type: "background",
    x: 0,
    y: 0,
    width: stageW,
    height: stageH,
    z: 0,
    imageId: assets.backgroundId
  });

  const blocker = makeObj({
    id: "builtin_pf_lab_blocker_obj",
    name: "Bloqueador Test",
    type: "prop",
    x: Math.round(stageW * 0.438),
    y: 92,
    width: 160,
    height: 140,
    z: 160,
    imageId: assets.blockerId,
    pathBlocker: true,
    collider: {
      enabled: true,
      required: false,
      visible: true,
      type: "box",
      x: 0,
      y: 0,
      width: 160,
      height: 140,
      userEnabled: true
    }
  });

  const player = makeObj({
    id: "builtin_pf_lab_player_obj",
    name: "Player Test",
    type: "player",
    x: 220,
    y: 120,
    width: 90,
    height: 150,
    z: 220,
    speed: 250,
    imageId: assets.playerId,
    collider: {
      enabled: true,
      required: true,
      visible: true,
      type: "box",
      x: 26,
      y: 104,
      width: 38,
      height: 28,
      userEnabled: true
    }
  });

  scene.objects = [bg, blocker, player];
  return scene;
}



function makeComplexPathfindingLabScene(project) {
  const stage = project?.stage || state.project?.stage || { width: 1280, height: 720 };
  const stageW = Number(stage.width || 1280);
  const stageH = Number(stage.height || 720);
  const assets = ensureBuiltinPathfindingLabAssets(project || state.project || { assets: { images: [] }, stage });

  const makeObj = data => ({
    id: data.id || uid(),
    name: data.name || "Objeto",
    type: data.type || "prop",
    x: Number(data.x || 0),
    y: Number(data.y || 0),
    width: Number(data.width || 80),
    height: Number(data.height || 80),
    scale: 1,
    rotation: 0,
    z: Number(data.z || 1),
    speed: Number(data.speed || 0),
    imageId: data.imageId || "",
    audioId: "",
    visible: true,
    states: [
      { id: uid(), name: "default", imageId: "", visible: true, interactable: true },
      { id: uid(), name: "hidden", imageId: "", visible: false, interactable: false }
    ],
    collectState: "hidden",
    inventoryImageId: "",
    physics: typeof defaultObjectPhysics === "function" ? defaultObjectPhysics() : { enabled: false },
    physicsAsMatterBody: false,
    pathBlocker: data.pathBlocker === true,
    pathFootprint: data.pathFootprint || (typeof defaultPathFootprintForObject === "function" ? defaultPathFootprintForObject({ type: data.type, width: data.width, height: data.height }) : null),
    usePathfinding: data.type === "player" ? data.usePathfinding !== false : false,
    navigationMode: data.type === "player" ? "pathfinding" : "",
    locked: false,
    action: data.action || "none",
    message: data.message || "",
    targetSceneId: "",
    targetObjectId: "",
    requiresItemId: "",
    lockedMessage: "Necesitas otro objeto para hacer eso.",
    requireProximity: data.type !== "background",
    interactionDistance: 190,
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
    parallax: { enabled: false, x: 0, y: 0 },
    bgResize: data.type === "background" ? "cover" : "cover",
    autoFlipX: data.type === "player",
    facing: 1,
    sprite: {
      enabled: false,
      frameWidth: Number(data.width || 80),
      frameHeight: Number(data.height || 80),
      columns: 1,
      rows: 1,
      fps: 8,
      currentFrame: 0,
      currentClip: "idle",
      playing: false,
      direction: 1,
      moveClip: "run",
      stopClip: "idle",
      clips: { idle: { from: 0, to: 0, fps: 8, mode: "loop" } }
    },
    collider: data.collider || {
      enabled: data.type === "player" || data.pathBlocker === true,
      required: data.type === "player",
      visible: true,
      type: "box",
      x: 0,
      y: 0,
      width: Number(data.width || 80),
      height: Number(data.height || 80),
      userEnabled: data.type === "player" || data.pathBlocker === true
    },
    transformClips: []
  });

  const scene = makeMinimalScene("TEST Pathfinding Maze");
  scene.builtinPathfindingComplexLab = true;
  scene.pathfinding = {
    enabled: true,
    gridSize: 24,
    obstaclePadding: 8,
    diagonal: true,
    debug: true
  };
  scene.navZones = [{
    id: uid(),
    name: "Zona Maze",
    enabled: true,
    points: [
      { x: 90, y: 80 },
      { x: stageW - 90, y: 80 },
      { x: stageW - 90, y: stageH - 80 },
      { x: 90, y: stageH - 80 }
    ]
  }];

  const bg = makeObj({
    id: "builtin_pf_maze_bg_obj",
    name: "BG Pathfinding Maze",
    type: "background",
    x: 0,
    y: 0,
    width: stageW,
    height: stageH,
    z: 0,
    imageId: assets.complexBackgroundId
  });

  const walls = [
    makeObj({
      id: "builtin_pf_maze_wall_a",
      name: "Muro A",
      type: "prop",
      x: 340,
      y: 160,
      width: 80,
      height: 360,
      z: 140,
      imageId: assets.wallId,
      pathBlocker: true,
      collider: { enabled: true, required: false, visible: true, type: "box", x: 0, y: 0, width: 80, height: 360, userEnabled: true }
    }),
    makeObj({
      id: "builtin_pf_maze_wall_b",
      name: "Muro B",
      type: "prop",
      x: 420,
      y: 160,
      width: 300,
      height: 80,
      z: 140,
      imageId: assets.wallId,
      pathBlocker: true,
      collider: { enabled: true, required: false, visible: true, type: "box", x: 0, y: 0, width: 300, height: 80, userEnabled: true }
    }),
    makeObj({
      id: "builtin_pf_maze_wall_c",
      name: "Muro C",
      type: "prop",
      x: 760,
      y: 240,
      width: 80,
      height: 300,
      z: 140,
      imageId: assets.wallId,
      pathBlocker: true,
      collider: { enabled: true, required: false, visible: true, type: "box", x: 0, y: 0, width: 80, height: 300, userEnabled: true }
    }),
    makeObj({
      id: "builtin_pf_maze_wall_d",
      name: "Muro D",
      type: "prop",
      x: 520,
      y: 470,
      width: 360,
      height: 80,
      z: 140,
      imageId: assets.wallId,
      pathBlocker: true,
      collider: { enabled: true, required: false, visible: true, type: "box", x: 0, y: 0, width: 360, height: 80, userEnabled: true }
    })
  ];

  const player = makeObj({
    id: "builtin_pf_maze_player_obj",
    name: "Player Maze",
    type: "player",
    x: 150,
    y: 480,
    width: 90,
    height: 150,
    z: 220,
    speed: 250,
    imageId: assets.playerId,
    collider: {
      enabled: true,
      required: true,
      visible: true,
      type: "box",
      x: 26,
      y: 104,
      width: 38,
      height: 28,
      userEnabled: true
    }
  });

  scene.objects = [bg, ...walls, player];
  return scene;
}

function ensureComplexPathfindingLabScene(project) {
  if (!project) return null;
  project.scenes ??= [];
  ensureBuiltinPathfindingLabAssets(project);

  let scene = project.scenes.find(s => s && (s.builtinPathfindingComplexLab === true || s.name === "TEST Pathfinding Maze"));
  if (!scene) {
    scene = makeComplexPathfindingLabScene(project);
    project.scenes.push(scene);
  } else {
    scene.builtinPathfindingComplexLab = true;
    scene.pathfinding = Object.assign(defaultPathfindingSettings(), scene.pathfinding || {}, { enabled: true, debug: true });
    scene.navZones ??= [];
    const fresh = makeComplexPathfindingLabScene(project);
    if (!scene.navZones.length) scene.navZones = fresh.navZones;
    scene.objects ??= [];
    if (!scene.objects.some(o => o.type === "background" && (o.name === "BG Pathfinding Maze" || o.imageId === "builtin_pf_maze_bg"))) {
      if (!scene.objects.some(o => o.type === "background")) scene.objects.unshift(fresh.objects.find(o => o.id === "builtin_pf_maze_bg_obj"));
    }
    if (!scene.objects.some(o => o.type === "player")) {
      scene.objects.push(fresh.objects.find(o => o.id === "builtin_pf_maze_player_obj"));
    }
    ["builtin_pf_maze_wall_a", "builtin_pf_maze_wall_b", "builtin_pf_maze_wall_c", "builtin_pf_maze_wall_d"].forEach(id => {
      if (!scene.objects.some(o => o.id === id)) {
        const obj = fresh.objects.find(o => o.id === id);
        if (obj) scene.objects.push(obj);
      }
    });
  }
  return scene;
}

function ensurePathfindingLabScene(project) {
  if (!project) return null;
  project.scenes ??= [];
  ensureBuiltinPathfindingLabAssets(project);

  let scene = project.scenes.find(s => s && (s.builtinPathfindingLab === true || s.name === "TEST Pathfinding Lab"));
  if (!scene) {
    scene = makePathfindingLabScene(project);
    project.scenes.push(scene);
  } else {
    scene.builtinPathfindingLab = true;
    scene.pathfinding = Object.assign(defaultPathfindingSettings(), scene.pathfinding || {}, { enabled: true });
    scene.navZones ??= [];
    if (!scene.navZones.length) {
      const fresh = makePathfindingLabScene(project);
      scene.navZones = fresh.navZones;
      const oldObjects = Array.isArray(scene.objects) ? scene.objects : [];
      scene.objects = oldObjects.length ? oldObjects : fresh.objects;
    }
    scene.objects ??= [];
    if (!scene.objects.some(o => o.type === "background" && (o.name === "BG Pathfinding Lab" || o.imageId === "builtin_pf_lab_bg"))) {
      const fresh = makePathfindingLabScene(project);
      if (!scene.objects.some(o => o.type === "background")) scene.objects.unshift(fresh.objects.find(o => o.type === "background"));
    }
    if (!scene.objects.some(o => o.type === "player")) {
      const fresh = makePathfindingLabScene(project);
      scene.objects.push(fresh.objects.find(o => o.type === "player"));
    }
    if (!scene.objects.some(o => o.name === "Bloqueador Test")) {
      const fresh = makePathfindingLabScene(project);
      scene.objects.splice(1, 0, fresh.objects.find(o => o.name === "Bloqueador Test"));
    }
  }
  return scene;
}

function ensureProjectHasScene(project) {
  if (!project) return project;
  project.scenes ??= [];
  if (!project.scenes.length) {
    project.scenes.push(makeMinimalScene("Escena 1"));
  }
  if (!project.startSceneId || !project.scenes.some(s => s.id === project.startSceneId)) {
    project.startSceneId = project.scenes[0]?.id || "";
  }
  return project;
}



function makeProject() {
  return {
    schemaVersion: 3,
    name: "Nueva aventura",
    startSceneId: "",
    stage: { width: 1280, height: 720 },
    assets: { images: [], audio: [] },
    inventoryModel: { items: [] },
    inventorySettings: { slots: 8, iconImageId: "", iconWidth: 72, iconHeight: 72, slotSize: 72, position: "bottom-center", fullMessage: "El inventario está lleno." },
    splash: { enabled: false, imageId: "", audioId: "", durationMs: 2500, allowSkip: true },
    messageSettings: {
      position: "top",
      fontFamily: "Arial, sans-serif",
      fontSize: 18,
      color: "#ffffff",
      background: "#111111",
      backgroundAlpha: 0.85,
      borderRadius: 10,
      maxWidth: 80
    },
    prefabs: [],
    mechanisms: [],
    database: {
      variables: {},
      texts: {},
      scenes: {},
      objects: {},
      actions: {}
    },
    scenes: [{
      id: uid(),
      name: "Escena 1",
      navZones: [],
      parallaxStrength: 0.1,
      pathfinding: defaultPathfindingSettings(),
      logic: { nodes: [], links: [] },
      objects: []
    }]
  };
}


function normalizeProject(project) {
  project.name ??= "Proyecto AventurIA";
  project.schemaVersion = 3;
  project.stage ??= { width: 1280, height: 720 };
  project.startSceneId ??= "";

  if (Array.isArray(project.assets)) {
    project.assets = {
      images: project.assets.filter(a => a.type?.startsWith("image") || a.dataUrl?.startsWith("data:image")),
      audio: []
    };
  }
  project.assets ??= { images: [], audio: [] };
  project.assets.images ??= [];
  project.assets.images = project.assets.images
    .map((asset, index) => normalizeImageAsset(asset, asset?.name || `imagen_${index + 1}`))
    .filter(Boolean);
  project.assets.audio ??= [];
  project.splash ??= {};
  project.splash.enabled ??= false;
  project.splash.imageId ??= "";
  project.splash.audioId ??= "";
  project.splash.durationMs ??= 2500;
  project.splash.allowSkip ??= true;
  project.inventorySettings ??= { slots: 8, iconImageId: "", iconWidth: 72, iconHeight: 72, slotSize: 72, position: "bottom-center", fullMessage: "El inventario está lleno." };
  project.inventorySettings.slots ??= 8;
  project.inventorySettings.iconImageId ??= "";
  project.inventorySettings.iconWidth ??= 72;
  project.inventorySettings.iconHeight ??= 72;
  project.inventorySettings.slotSize ??= Math.max(project.inventorySettings.iconWidth || 72, project.inventorySettings.iconHeight || 72, 72);
  project.inventorySettings.position ??= "bottom-center";
  project.inventorySettings.fullMessage ??= "El inventario está lleno.";
  project.messageSettings ??= {};
  project.messageSettings.position ??= "top";
  project.messageSettings.fontFamily ??= "Arial, sans-serif";
  project.messageSettings.fontSize ??= 18;
  project.messageSettings.color ??= "#ffffff";
  project.messageSettings.background ??= "#111111";
  project.messageSettings.backgroundAlpha ??= 0.85;
  project.messageSettings.borderRadius ??= 10;
  project.messageSettings.maxWidth ??= 80;
  project.prefabs ??= [];
  project.inventoryModel ??= { items: [] };
  project.inventoryModel.items ??= [];
  project.mechanisms ??= [];

  project.database ??= { variables: {}, texts: {}, scenes: {}, objects: {}, actions: {} };

  project.scenes ??= [];

  // Migración defensiva: si algún proyecto antiguo guardó zonas a nivel global,
  // se mueven solo a la primera escena y se elimina la propiedad global.
  if (Array.isArray(project.navZones) && project.navZones.length && project.scenes[0]) {
    project.scenes[0].navZones ??= [];
    project.scenes[0].navZones.push(...project.navZones.map(z => ({
      id: z.id || uid(),
      name: z.name || "Zona navegable",
      enabled: z.enabled !== false,
      points: (z.points || []).map(p => ({ x: Number(p.x) || 0, y: Number(p.y) || 0 }))
    })));
    delete project.navZones;
  }
  project.scenes.forEach(scene => {
    scene.navZones ??= [];
    scene.navZones = scene.navZones.map(z => ({
      id: z.id || uid(),
      name: z.name || "Zona navegable",
      enabled: z.enabled !== false,
      points: (z.points || []).map(p => ({ x: Number(p.x) || 0, y: Number(p.y) || 0 }))
    }));
    scene.logic ??= { nodes: [], links: [] };
    scene.audioIds ??= [];
    scene.audioMasterVolume ??= 1;
    scene.audioAutoplay ??= true;
    scene.audioVolumes ??= {};
    scene.thumbnailDataUrl ??= "";
    scene.parallaxStrength ??= 0.1;
    scene.camera ??= { enabled: false, followPlayer: false };
    scene.logic.nodes ??= [];
    scene.logic.links ??= [];
    scene.logic.links.forEach(l => {
      l.fromPort ??= "then";
      l.toPort ??= "in";
      l.kind ??= "flow";
    });
    scene.logic.nodes.forEach(n => {
      n.targetObjectId ??= "";
      normalizeNodeType(n);
    });
    scene.objects ??= [];
    scene.objects.forEach(o => {
      o.type ??= "prop";
      o.pathBlocker = o.type === "background" || o.type === "player" ? false : o.pathBlocker === true;
      o.z ??= o.type === "background" ? -100 : 0;
      o.speed ??= 260;
      o.state ??= "default";
      o.initialState ??= "default";
      o.requiresItemId ??= "";
      o.lockedMessage ??= "Necesitas otro objeto para hacer eso.";
      o.requireProximity ??= o.type !== "background";
      o.interactionDistance ??= 190;
      o.tooFarMessage ??= "Estás demasiado lejos.";
      o.useItemEnabled ??= false;
      o.useItemId ??= "";
      o.useItemMessage ??= "";
      o.useItemSetState ??= "";
      o.useItemRevealObjectId ??= "";
      o.useItemHideObjectId ??= "";
      o.useItemHideSelf ??= false;
      o.useItemGotoSceneId ??= "";
      o.useItemConsume ??= false;
      o.useItemFailMessage ??= "Eso no funciona.";
      o.action ??= "none";
      o.audioId ??= "";
      o.parallax ??= { enabled: false, x: 0.05, y: 0 };
      o.bgResize ??= "cover";
      o.autoFlipX ??= o.type === "player";
      o.facing ??= 1;
      o.sprite ??= {enabled:false,frameWidth:o.width||64,frameHeight:o.height||64,columns:1,rows:1,fps:8,currentFrame:0,currentClip:"idle",playing:true,direction:1,moveClip:"run",stopClip:"idle",clips:{idle:{from:0,to:0,fps:8,mode:"loop"}}};
      o.sprite.direction ??= 1;
      o.sprite.moveClip ??= "run";
      o.sprite.stopClip ??= "idle";
      Object.values(o.sprite.clips || {}).forEach(c => {
        if (!c.mode) c.mode = c.loop === false ? "once" : "loop";
      });
      o.imageId ??= "";
      o.inventoryKey ??= o.inventorySourceId || o.id;
      normalizeObjectStates(o);
      normalizeObjectPhysics(o);
      o.collider ??= defaultColliderForObject(o);
      normalizePathFootprint(o);
      normalizeAdventurePlayerControl(o);
      o.transformClips ??= [];
      o.transformClips.forEach(c => normalizeTransformClip(o, c));
    });
    syncScenePathfindingFromPlayer(scene);
  });
  if (!project.startSceneId || !project.scenes.some(s => s.id === project.startSceneId)) {
    project.startSceneId = project.scenes[0]?.id || "";
  }
  ensurePathfindingLabScene(project);
  ensureComplexPathfindingLabScene(project);
  return project;
}

function createDefaultProject() {
  state.editorSnapshot = null;
  stopAnimationLoop();
  state.project = normalizeProject(makeProject());
  ensureProjectHasScene(state.project);
  state.selectedSceneId = state.project.scenes[0]?.id || "";
  clearSelection();
  state.inventory = [];
  state.runtimeStates = {};
    state.spatialTriggerStates = {};
    state.selectedInventoryItemId = null;
    state.inventoryOpen = false;
  (state.project.mechanisms || []).forEach(m=>{m.solved=false;if(m.data?.sequence)m.data.sequence=[];});
  setMode("editor");
}

function selectSceneForEditing(sceneId) {
  state.selectedSceneId = sceneId;
  state.selectedPanel = "scene";
  state.selectedObjectId = null;
  state.selectedZoneId = null;
  state.selectedZonePointIndex = null;
  state.selectedNodeId = null;
  state.selectedLinkId = null;
  state.drawingZone = null;
  renderAll();
}


function normalizeImageAsset(asset, fallbackName = "imagen") {
  if (!asset) return null;
  if (!asset.id) asset.id = uid();
  asset.name ??= asset.filename || fallbackName || asset.id;
  asset.type ??= asset.mimeType || "image/*";
  // dataUrl es la copia real embebida dentro del proyecto. src queda como compatibilidad.
  if (!asset.dataUrl && asset.src) asset.dataUrl = asset.src;
  if (!asset.src && asset.dataUrl) asset.src = asset.dataUrl;
  return asset;
}

function normalizeImageAssetStore() {
  if (!state.project) return [];
  state.project.assets ??= { images: [], audio: [] };
  state.project.assets.images ??= [];

  const seen = new Set();
  const normalized = [];

  state.project.assets.images.forEach((asset, index) => {
    const a = normalizeImageAsset(asset, `imagen_${index + 1}`);
    if (!a?.id || seen.has(a.id)) return;
    seen.add(a.id);
    normalized.push(a);
  });

  state.project.assets.images = normalized;
  return state.project.assets.images;
}


function loadImageAssetDimensions(asset, onDone = null) {
  if (!asset?.dataUrl && !asset?.src) {
    if (onDone) onDone(asset);
    return asset;
  }

  const img = new Image();
  img.onload = () => {
    asset.width = img.naturalWidth || img.width || asset.width || 0;
    asset.height = img.naturalHeight || img.height || asset.height || 0;
    if (onDone) onDone(asset);
  };
  img.onerror = () => {
    if (onDone) onDone(asset);
  };
  img.src = asset.dataUrl || asset.src;
  return asset;
}

function setImageAssetData(asset, fileName, type, dataUrl, onDone = null) {
  if (!asset) return null;
  asset.name = fileName || asset.name || "imagen";
  asset.type = type || asset.type || "image/*";
  asset.mimeType = asset.type;
  asset.dataUrl = dataUrl || asset.dataUrl || asset.src || "";
  asset.src = asset.dataUrl;
  asset.width = 0;
  asset.height = 0;
  loadImageAssetDimensions(asset, onDone);
  return asset;
}

function replaceImageAssetData(assetId, fileName, type, dataUrl, onDone = null) {
  const asset = imageAssetById(assetId);
  if (!asset) return null;
  return setImageAssetData(asset, fileName, type, dataUrl, onDone);
}

function ensureImageAssetDimensions(asset, onDone = null) {
  if (!asset) {
    if (onDone) onDone(null);
    return null;
  }
  if (Number(asset.width || 0) > 0 && Number(asset.height || 0) > 0) {
    if (onDone) onDone(asset);
    return asset;
  }
  return loadImageAssetDimensions(asset, onDone);
}


function addImageAssetToProject(fileName, type, dataUrl) {
  state.project.assets ??= { images: [], audio: [] };
  state.project.assets.images ??= [];

  const asset = normalizeImageAsset({
    id: uid(),
    name: fileName || "imagen",
    type: type || "image/*",
    dataUrl,
    src: dataUrl
  }, fileName || "imagen");

  state.project.assets.images.push(asset);
  setImageAssetData(asset, fileName || asset.name, type || asset.type, dataUrl, () => {
    if (typeof renderAll === "function") renderAll();
    if (typeof renderProperties === "function") renderProperties();
  });
  return asset;
}

function rebuildImageAssetsFromRenderedGrid() {
  if (!state.project || !document?.querySelectorAll) return [];
  normalizeImageAssetStore();

  document.querySelectorAll("#imageAssetGrid [data-asset-id]").forEach((el, index) => {
    const id = el.dataset.assetId || "";
    if (!id || state.project.assets.images.some(a => a.id === id)) return;

    const img = el.querySelector("img");
    const src = img?.src || "";
    if (!src) return;

    state.project.assets.images.push(normalizeImageAsset({
      id,
      name: el.title || `imagen_${index + 1}`,
      type: src.startsWith("data:image") ? src.slice(5, src.indexOf(";")) || "image/*" : "image/*",
      dataUrl: src,
      src
    }, el.title || `imagen_${index + 1}`));
  });

  return normalizeImageAssetStore();
}

function imageAssetOptionsForSelect() {
  const images = normalizeImageAssetStore();

  // Fallback defensivo: si el grid muestra imágenes pero el store quedó vacío por una versión anterior,
  // reconstruimos los assets embebidos desde las miniaturas ya renderizadas.
  if (!images.length) rebuildImageAssetsFromRenderedGrid();

  return normalizeImageAssetStore()
    .map(asset => ({ id: asset.id, name: asset.name || asset.id, dataUrl: asset.dataUrl || asset.src || "" }))
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
}


function currentScene() {
  return state.project.scenes.find(s => s.id === state.selectedSceneId);
}

function selectedObject() {
  return currentScene()?.objects.find(o => o.id === state.selectedObjectId) || null;
}

function selectedZone() {
  return currentScene()?.navZones.find(z => z.id === state.selectedZoneId) || null;
}

function selectedNode() {
  return currentScene()?.logic.nodes.find(n => n.id === state.selectedNodeId) || null;
}

function imageAssetById(id) {
  if (!id) return null;
  normalizeImageAssetStore();
  let found = state.project.assets.images.find(a => a.id === id) || null;
  if (found) return found;

  rebuildImageAssetsFromRenderedGrid();
  found = state.project.assets.images.find(a => a.id === id) || null;
  return found;
}


function audioAssetById(id) {
  return state.project.assets.audio.find(a => a.id === id);
}

function clearSelection() {
  state.selectedPanel = null;
  state.selectedObjectId = null;
  state.selectedZoneId = null;
  state.selectedNodeId = null;
  state.selectedLinkId = null;
  state.selectedZonePointIndex = null;
}
