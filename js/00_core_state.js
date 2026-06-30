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

// core ready
