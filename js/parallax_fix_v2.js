function aviLayer(v){
  v = Number(v);
  if (v <= -1) return -1;
  if (v >= 1) return 1;
  return 0;
}
function aviLayerK(v){
  v = aviLayer(v);
  if (v === -1) return 0.55;
  if (v === 1) return 1.35;
  return 1;
}
function aviObjLayer(o){
  if (!o) return o;
  o.parallaxLayer = aviLayer(o.parallaxLayer == null ? 0 : o.parallaxLayer);
  if (!o.parallax) o.parallax = { enabled: false, x: 0, y: 0 };
  o.parallax.enabled = false;
  o.parallax.x = 0;
  o.parallax.y = 0;
  return o;
}
function aviSceneLayers(p){
  p = p || state.project;
  if (!p || !p.scenes) return p;
  p.scenes.forEach(function(s){
    s.parallaxStrength = Math.max(0, Number(s.parallaxStrength == null ? 0.1 : s.parallaxStrength));
    (s.objects || []).forEach(aviObjLayer);
  });
  return p;
}
function syncParallaxLayerFromPropertiesPanel(){
  var o = typeof selectedObject === 'function' ? selectedObject() : null;
  var input = $('propParallaxLayer');
  if (!o || !input) return false;
  o.parallaxLayer = aviLayer(input.value);
  aviObjLayer(o);
  input.value = String(o.parallaxLayer);
  return true;
}
function aventuriaParallaxObjectScreenPosition(o){
  var x = typeof objectEffectiveX === 'function' ? objectEffectiveX(o) : Number(o && o.x || 0);
  var y = typeof objectEffectiveY === 'function' ? objectEffectiveY(o) : Number(o && o.y || 0);
  if (state.mode === 'play') {
    var scene = typeof currentScene === 'function' ? currentScene() : null;
    var player = typeof getPlayer === 'function' ? getPlayer() : null;
    var stage = state.project && state.project.stage ? state.project.stage : { width: 1280, height: 720 };
    var camX = 0;
    var camY = 0;
    if (player) {
      camX = Number(player.x || 0) + Number(player.width || 0) * Number(player.scale || 1) / 2 - Number(stage.width || 1280) / 2;
      camY = Number(player.y || 0) + Number(player.height || 0) * Number(player.scale || 1) / 2 - Number(stage.height || 720) / 2;
    }
    var strength = Number(scene && scene.parallaxStrength != null ? scene.parallaxStrength : 0);
    var f = strength * aviLayerK(o && o.parallaxLayer != null ? o.parallaxLayer : 0);
    x += -camX * f;
    y += -camY * f;
  }
  return { x: x, y: y };
}
function applyAventuriaParallaxLayerFix(){
  if (typeof window === 'undefined') return;
  if (typeof window.renderStage !== 'function' || typeof window.objectTransform !== 'function') {
    setTimeout(applyAventuriaParallaxLayerFix, 0);
    return;
  }
  if (state._parallaxLayerFixApplied) {
    aviSceneLayers();
    return;
  }
  state._parallaxLayerFixApplied = true;
  window.normalizeParallaxLayerValue = aviLayer;
  window.parallaxLayerMultiplier = aviLayerK;
  window.normalizeObjectParallaxSettings = aviObjLayer;
  window.normalizeProjectParallaxLayers = aviSceneLayers;
  window.objectScreenPosition = aventuriaParallaxObjectScreenPosition;
  if (typeof window.baseObject === 'function') {
    var base = window.baseObject;
    window.baseObject = function(type, name){ return aviObjLayer(base(type, name)); };
  }
  if (typeof window.renderStage === 'function') {
    var renderStage0 = window.renderStage;
    window.renderStage = function(){ aviSceneLayers(); return renderStage0.apply(this, arguments); };
  }
  if (typeof window.renderAll === 'function') {
    var renderAll0 = window.renderAll;
    window.renderAll = function(){ aviSceneLayers(); return renderAll0.apply(this, arguments); };
  }
  document.addEventListener('input', function(e){
    if (e.target && e.target.id === 'propParallaxLayer') syncParallaxLayerFromPropertiesPanel();
  }, true);
  document.addEventListener('change', function(e){
    if (!e.target || e.target.id !== 'propParallaxLayer') return;
    syncParallaxLayerFromPropertiesPanel();
    var o = typeof selectedObject === 'function' ? selectedObject() : null;
    if ($('statusText')) $('statusText').textContent = 'Capa parallax guardada: ' + ((o && (o.name || o.id)) || 'objeto') + ' -> ' + (o ? o.parallaxLayer : 0);
  }, true);
  aviSceneLayers();
  try { window.renderStage(); } catch(e) {}
}
setTimeout(applyAventuriaParallaxLayerFix, 0);
window.addEventListener('load', applyAventuriaParallaxLayerFix);
