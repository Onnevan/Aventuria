// AventurIA v54 Modular Base — 00_core_state.js
// Extraído de v53 funcional. Script clásico global; el orden de carga importa.

const uid = () => Math.random().toString(36).slice(2, 10);
const $ = (id) => document.getElementById(id);

const DB_NAME = "AdventureEditorDB";
const DB_STORE = "projects";
const DB_KEY = "lastProject";

const state = {
  mode: "editor",
  tool: "select",
  navMode: "create",
  selectedSceneId: null,
  selectedObjectId: null,
  selectedZoneId: null,
  selectedZonePointIndex: null,
  selectedNodeId: null,
  selectedLinkId: null,
  selectedImageId: null,
  selectedPrefabId: null,
  selectedMechanismId: null,
  selectedPanel: null,
  selectedInventoryItemId: null,
  draggingInventoryItem: false,
  inventoryOpen: false,
  inventoryCursor: { x: 0, y: 0 },
  input: { keys: {}, mouse: { x: 0, y: 0, buttons: {} } },
  inventory: [],
  runtimeStates: {},
  spatialTriggerStates: {},
  spatialTriggerLoop: null,
  animationTimer: null,
  lastAnimationTime: 0,
  drawingZone: null,
  connectingFrom: null,
  mouseLogic: { x: 0, y: 0 },
  project: null,
  editorSnapshot: null,
  playSceneId: null,
  colliderEditor: null,
  showAllColliders: false,
  sceneTransitionUntil: 0,
  imageHitCache: {},
  editorZoom: 1,
  selectedTransformClipId: null,
  selectedTransformKeyIndex: null,
  selectedTransformProperty: "x",
  animationTimelineTime: 0,
  animationTimelinePlaying: false,
  undoStack: [],
  redoStack: [],
  undoLimit: 10,
  undoRestoring: false,
  undoFocusSnapshot: null,
  undoLastFingerprint: ""
};

const els = {
  stage: $("stage"),
  navLayer: $("navLayer"),
  sceneList: $("sceneList"),
  objectList: $("objectList"),
  imageAssetGrid: $("imageAssetGrid"),
  audioAssetList: $("audioAssetList"),
  props: $("props"),
  zoneProps: $("zoneProps"),
  nodeProps: $("nodeProps"),
  emptyProps: $("emptyProps"),
  messageBox: $("messageBox"),
  inventory: $("inventory"),
  gameInventory: $("gameInventory"),
  inventoryCursor: $("inventoryCursor"),
  logicEditor: $("logicEditor"),
  mechanismEditor: $("mechanismEditor"),
  animationEditor: $("animationEditor"),
  physicsEditor: $("physicsEditor"),
  physicsDebugLayer: $("physicsDebugLayer"),
  mechanismRuntime: $("mechanismRuntime"),
  nodeCanvas: $("nodeCanvas"),
  wireLayer: $("wireLayer")
};

function normalizeParallaxLayerValue(v){
  v = Number(v);
  if (v <= -1) return -1;
  if (v >= 1) return 1;
  return 0;
}

function parallaxLayerMultiplier(v){
  v = normalizeParallaxLayerValue(v);
  if (v === -1) return 0.55;
  if (v === 1) return 1.35;
  return 1;
}

function normalizeObjectParallaxSettings(o){
  if (!o) return o;
  o.parallaxLayer = normalizeParallaxLayerValue(o.parallaxLayer == null ? 0 : o.parallaxLayer);
  if (!o.parallax) o.parallax = { enabled: false, x: 0, y: 0 };
  o.parallax.enabled = false;
  o.parallax.x = 0;
  o.parallax.y = 0;
  return o;
}

function normalizeProjectParallaxLayers(p){
  p = p || state.project;
  if (!p || !p.scenes) return p;
  p.scenes.forEach(function(s){
    s.parallaxStrength = Math.max(0, Number(s.parallaxStrength == null ? 0.1 : s.parallaxStrength));
    (s.objects || []).forEach(normalizeObjectParallaxSettings);
  });
  return p;
}

function syncParallaxLayerFromPropertiesPanel(){
  var o = typeof selectedObject === "function" ? selectedObject() : null;
  var input = $("propParallaxLayer");
  if (!o || !input) return false;
  o.parallaxLayer = normalizeParallaxLayerValue(input.value);
  normalizeObjectParallaxSettings(o);
  input.value = String(o.parallaxLayer);
  return true;
}

function aventuriaParallaxObjectScreenPosition(o){
  var x = typeof objectEffectiveX === "function" ? objectEffectiveX(o) : Number(o && o.x || 0);
  var y = typeof objectEffectiveY === "function" ? objectEffectiveY(o) : Number(o && o.y || 0);
  if (state.mode === "play") {
    var scene = typeof currentScene === "function" ? currentScene() : null;
    var player = typeof getPlayer === "function" ? getPlayer() : null;
    var stage = state.project && state.project.stage ? state.project.stage : { width: 1280, height: 720 };
    var camX = 0;
    var camY = 0;
    if (player) {
      camX = Number(player.x || 0) + Number(player.width || 0) * Number(player.scale || 1) / 2 - Number(stage.width || 1280) / 2;
      camY = Number(player.y || 0) + Number(player.height || 0) * Number(player.scale || 1) / 2 - Number(stage.height || 720) / 2;
    }
    var strength = Number(scene && scene.parallaxStrength != null ? scene.parallaxStrength : 0);
    var f = strength * parallaxLayerMultiplier(o && o.parallaxLayer != null ? o.parallaxLayer : 0);
    x += -camX * f;
    y += -camY * f;
  }
  return { x: x, y: y };
}

function applyAventuriaParallaxLayerFix(){
  if (typeof objectTransform !== "function" || typeof renderStage !== "function") {
    setTimeout(applyAventuriaParallaxLayerFix, 20);
    return;
  }
  if (state._parallaxLayerFixApplied) {
    normalizeProjectParallaxLayers();
    return;
  }
  state._parallaxLayerFixApplied = true;
  objectScreenPosition = aventuriaParallaxObjectScreenPosition;
  if (typeof baseObject === "function") {
    var base = baseObject;
    baseObject = function(type, name){ return normalizeObjectParallaxSettings(base(type, name)); };
  }
  if (typeof renderStage === "function") {
    var rs = renderStage;
    renderStage = function(){ normalizeProjectParallaxLayers(); return rs.apply(this, arguments); };
  }
  if (typeof renderAll === "function") {
    var ra = renderAll;
    renderAll = function(){ normalizeProjectParallaxLayers(); return ra.apply(this, arguments); };
  }
  document.addEventListener("input", function(e){
    if (e.target && e.target.id === "propParallaxLayer") syncParallaxLayerFromPropertiesPanel();
  }, true);
  document.addEventListener("change", function(e){
    if (!e.target || e.target.id !== "propParallaxLayer") return;
    syncParallaxLayerFromPropertiesPanel();
    var o = typeof selectedObject === "function" ? selectedObject() : null;
    if ($("statusText")) $("statusText").textContent = "Capa parallax guardada: " + ((o && (o.name || o.id)) || "objeto") + " -> " + (o ? o.parallaxLayer : 0);
  }, true);
  normalizeProjectParallaxLayers();
  try { renderStage(); } catch(e) {}
}

setTimeout(applyAventuriaParallaxLayerFix, 0);
