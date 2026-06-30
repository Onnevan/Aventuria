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
