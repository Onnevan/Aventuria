// AventurIA v54 Modular Base — 06_navigation_runtime.js
// Extraído de v53 funcional. Script clásico global; el orden de carga importa.






function audioGraphDebug(message) {
  // Diagnóstico desactivado por defecto.
  // Para activarlo, añadir al final del HTML:
  // <script src="js/99_audio_graph_debug_optional.js"></script>
}




function clearAudioGraphDebug() {
  // Diagnóstico desactivado por defecto.
}


function stagePoint(e) {
  const rect = els.stage.getBoundingClientRect();
  const logicalW = Number(state.project?.stage?.width || 1280);
  const logicalH = Number(state.project?.stage?.height || 720);

  const sx = rect.width ? logicalW / rect.width : 1;
  const sy = rect.height ? logicalH / rect.height : 1;

  const x = (e.clientX - rect.left) * sx;
  const y = (e.clientY - rect.top) * sy;

  return {
    x: Math.max(0, Math.min(logicalW, x)),
    y: Math.max(0, Math.min(logicalH, y)),
    rawX: e.clientX,
    rawY: e.clientY,
    rectLeft: rect.left,
    rectTop: rect.top,
    rectWidth: rect.width,
    rectHeight: rect.height,
    scaleX: sx,
    scaleY: sy
  };
}

function stagePointDebugText(p) {
  if (!p) return "";
  return `raw ${Math.round(p.rawX)},${Math.round(p.rawY)} → stage ${Math.round(p.x)},${Math.round(p.y)} · rect ${Math.round(p.rectWidth)}x${Math.round(p.rectHeight)} · scale ${p.scaleX.toFixed(3)},${p.scaleY.toFixed(3)}`;
}

function showPlayClickMarker(point) {
  // Marcador visual de debug desactivado.
  // Se conserva la función para no tocar las llamadas existentes.
}


function isPointInPolygon(point, polygon) {
  let inside = false;
  const pts = polygon.points;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / ((yj - yi) || 0.00001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function isNavigable(point) {
  const zones = currentScene()?.navZones.filter(z => z.enabled) || [];
  if (!zones.length) return true;
  return zones.some(z => isPointInPolygon(point, z));
}


function pathfindingSettings() {
  return normalizePathfindingSettings(currentScene());
}


function playerFootprintClearanceRadius() {
  const player = typeof getPlayer === "function" ? getPlayer() : null;
  if (!player) return 0;

  const fp = typeof normalizePathFootprint === "function" ? normalizePathFootprint(player) : null;
  const scale = Number(player.scale || 1);

  if (fp?.enabled) {
    const w = Math.max(1, Number(player.width || 1) * scale * Number(fp.width || 0.44));
    const h = Math.max(1, Number(player.height || 1) * scale * Number(fp.height || 0.22));
    return Math.max(6, Math.min(48, Math.max(w, h) * 0.45));
  }

  const c = player.collider;
  if (c?.enabled) {
    const w = Math.max(1, Number(c.width || player.width || 1) * scale);
    const h = Math.max(1, Number(c.height || player.height || 1) * scale);
    return Math.max(6, Math.min(48, Math.max(w, h) * 0.45));
  }

  return Math.max(8, Math.min(36, Number(player.width || 80) * scale * 0.20));
}

function effectivePathfindingObstaclePadding(extra = 0) {
  const pf = typeof pathfindingSettings === "function" ? pathfindingSettings() : {};
  const scenePadding = Number(pf.obstaclePadding || 0);
  const playerRadius = playerFootprintClearanceRadius();
  return Math.max(0, scenePadding + playerRadius + Number(extra || 0));
}

function pointInExpandedPathFootprint(point, obj, padding = 0) {
  if (!obj || obj.pathBlocker !== true) return false;
  const fp = typeof normalizePathFootprint === "function" ? normalizePathFootprint(obj) : null;

  if (fp?.enabled && fp.mode !== "manualCollider" && typeof pointInObjectPathFootprint === "function") {
    return pointInObjectPathFootprint(point, obj, padding);
  }

  return false;
}


function pointInObjectBoundsWithPadding(point, obj, padding = 0) {
  if (!obj || obj.type === "background" || obj.type === "player") return false;
  if (obj.pathBlocker !== true) return false;

  const effectivePadding = effectivePathfindingObstaclePadding(padding);

  const fp = typeof normalizePathFootprint === "function" ? normalizePathFootprint(obj) : null;
  if (fp?.enabled && fp.mode !== "manualCollider") {
    return pointInExpandedPathFootprint(point, obj, effectivePadding);
  }

  if (pathBlockerUsesManualCollider(obj) && typeof pointInObjectCollider === "function") {
    if (effectivePadding <= 0) return pointInObjectCollider(point, obj);

    const samples = [
      point,
      { x: point.x - effectivePadding, y: point.y },
      { x: point.x + effectivePadding, y: point.y },
      { x: point.x, y: point.y - effectivePadding },
      { x: point.x, y: point.y + effectivePadding },
      { x: point.x - effectivePadding * .7, y: point.y - effectivePadding * .7 },
      { x: point.x + effectivePadding * .7, y: point.y - effectivePadding * .7 },
      { x: point.x - effectivePadding * .7, y: point.y + effectivePadding * .7 },
      { x: point.x + effectivePadding * .7, y: point.y + effectivePadding * .7 }
    ];
    return samples.some(p => pointInObjectCollider(p, obj));
  }

  const r = pathBlockerAutoFootprint(obj, effectivePadding);
  return point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h;
}



function pathfindingObstacleObjects() {
  if (typeof applyPathBlockerMemory === "function") applyPathBlockerMemory();
  const scene = currentScene();
  if (!scene) return [];
  return scene.objects.filter(obj => {
    if (!obj || obj.type === "background" || obj.type === "player") return false;
    return obj.pathBlocker === true;
  });
}



function isPathfindingWalkablePoint(point, { ignoreObjects = false } = {}) {
  const scene = currentScene();
  if (!scene) return false;
  const w = Number(state.project.stage.width || 1280);
  const h = Number(state.project.stage.height || 720);
  if (point.x < 0 || point.y < 0 || point.x > w || point.y > h) return false;
  if (!isNavigable(point)) return false;
  if (ignoreObjects) return true;

  return !pathfindingObstacleObjects().some(obj => pointInObjectBoundsWithPadding(point, obj, 0));
}


function lineWalkable(a, b, samples = 12) {
  const pf = typeof pathfindingSettings === "function" ? pathfindingSettings() : {};
  const grid = Math.max(8, Number(pf.gridSize || 24));
  const dist = Math.hypot((b.x || 0) - (a.x || 0), (b.y || 0) - (a.y || 0));
  const steps = Math.max(2, samples, Math.ceil(dist / Math.max(4, grid / 3)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    if (!isPathfindingWalkablePoint(p)) return false;
  }
  return true;
}


function nearestWalkablePoint(point, maxRadius = 160) {
  if (isPathfindingWalkablePoint(point)) return point;
  const grid = pathfindingSettings().gridSize || 32;
  const step = Math.max(8, grid / 2);
  for (let r = step; r <= maxRadius; r += step) {
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      const p = { x: point.x + Math.cos(a) * r, y: point.y + Math.sin(a) * r };
      if (isPathfindingWalkablePoint(p)) return p;
    }
  }
  return null;
}

function computePlayerFootPoint(player) {
  const scale = Number(player.scale || 1);
  return {
    x: Number(player.x || 0) + Number(player.width || 0) * scale / 2,
    y: Number(player.y || 0) + Number(player.height || 0) * scale
  };
}

function playerTopLeftFromFootPoint(player, foot) {
  const scale = Number(player.scale || 1);
  return {
    x: foot.x - Number(player.width || 0) * scale / 2,
    y: foot.y - Number(player.height || 0) * scale
  };
}

function computePathAStar(startPoint, endPoint) {
  const scene = currentScene();
  const pf = pathfindingSettings();
  if (!scene || !pf.enabled) return [startPoint, endPoint];

  const goal = nearestWalkablePoint(endPoint);
  const start = nearestWalkablePoint(startPoint);
  if (!start || !goal) return null;

  if (lineWalkable(start, goal)) return [start, goal];

  const grid = Math.max(8, Number(pf.gridSize || 32));
  const cols = Math.ceil(Number(state.project.stage.width || 1280) / grid);
  const rows = Math.ceil(Number(state.project.stage.height || 720) / grid);

  const toCell = p => ({
    c: Math.max(0, Math.min(cols - 1, Math.floor(p.x / grid))),
    r: Math.max(0, Math.min(rows - 1, Math.floor(p.y / grid)))
  });
  const toPoint = cell => ({ x: cell.c * grid + grid / 2, y: cell.r * grid + grid / 2 });
  const key = (c, r) => `${c},${r}`;
  const h = (a, b) => Math.hypot(a.c - b.c, a.r - b.r);

  const startCell = toCell(start);
  const goalCell = toCell(goal);

  const dirs = pf.diagonal
    ? [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]
    : [[1,0],[-1,0],[0,1],[0,-1]];

  const walkCache = new Map();
  function cellWalkable(c, r) {
    const k = key(c, r);
    if (walkCache.has(k)) return walkCache.get(k);
    const p = toPoint({ c, r });
    const ok = isPathfindingWalkablePoint(p) || (c === startCell.c && r === startCell.r) || (c === goalCell.c && r === goalCell.r);
    walkCache.set(k, ok);
    return ok;
  }

  const open = [startCell];
  const came = new Map();
  const gScore = new Map([[key(startCell.c, startCell.r), 0]]);
  const fScore = new Map([[key(startCell.c, startCell.r), h(startCell, goalCell)]]);
  const closed = new Set();

  let guard = cols * rows * 2;

  while (open.length && guard-- > 0) {
    open.sort((a, b) => (fScore.get(key(a.c,a.r)) ?? Infinity) - (fScore.get(key(b.c,b.r)) ?? Infinity));
    const current = open.shift();
    const ck = key(current.c, current.r);

    if (current.c === goalCell.c && current.r === goalCell.r) {
      const cells = [current];
      let k = ck;
      while (came.has(k)) {
        const prev = came.get(k);
        cells.push(prev);
        k = key(prev.c, prev.r);
      }
      cells.reverse();
      let pts = cells.map(toPoint);
      pts[0] = start;
      pts[pts.length - 1] = goal;
      pts = simplifyPathPoints(pts);
      return pts;
    }

    closed.add(ck);

    dirs.forEach(([dc, dr]) => {
      const nc = current.c + dc;
      const nr = current.r + dr;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) return;
      const nk = key(nc, nr);
      if (closed.has(nk)) return;
      if (!cellWalkable(nc, nr)) return;

      // Evitar cortar esquinas en diagonal si los dos laterales están bloqueados.
      if (dc !== 0 && dr !== 0 && (!cellWalkable(current.c + dc, current.r) || !cellWalkable(current.c, current.r + dr))) return;

      const stepCost = dc !== 0 && dr !== 0 ? 1.414 : 1;
      const tentative = (gScore.get(ck) ?? Infinity) + stepCost;
      if (tentative >= (gScore.get(nk) ?? Infinity)) return;

      const next = { c: nc, r: nr };
      came.set(nk, current);
      gScore.set(nk, tentative);
      fScore.set(nk, tentative + h(next, goalCell));
      if (!open.some(o => o.c === nc && o.r === nr)) open.push(next);
    });
  }

  return null;
}

function simplifyPathPoints(points) {
  if (!points || points.length <= 2) return points || [];
  const out = [points[0]];
  let anchor = points[0];

  for (let i = 2; i < points.length; i++) {
    if (!lineWalkable(anchor, points[i])) {
      const prev = points[i - 1];
      out.push(prev);
      anchor = prev;
    }
  }

  out.push(points[points.length - 1]);
  return out;
}



function pathBlockerAutoFootprint(obj, padding = 0) {
  const scale = Number(obj.scale || 1);
  const w = Math.max(1, Number(obj.width || 1) * scale);
  const h = Math.max(1, Number(obj.height || 1) * scale);

  // Huella automática pensada para aventuras gráficas:
  // no bloquea todo el sprite, solo la base que toca el suelo.
  const footprintW = w * Number(obj.pathBlockerFootprintWidth ?? 0.65);
  const footprintH = h * Number(obj.pathBlockerFootprintHeight ?? 0.28);

  return {
    x: Number(obj.x || 0) + (w - footprintW) / 2 - padding,
    y: Number(obj.y || 0) + h - footprintH - padding,
    w: footprintW + padding * 2,
    h: footprintH + padding * 2
  };
}

function pathBlockerUsesManualCollider(obj) {
  return obj?.collider?.enabled === true;
}


function pathfindingObstacleDebugShape(obj, padding = 0) {
  if (!obj || obj.pathBlocker !== true) return null;
  const scale = Number(obj.scale || 1);
  const fp = typeof normalizePathFootprint === "function" ? normalizePathFootprint(obj) : null;
  const effectivePadding = effectivePathfindingObstaclePadding(padding);

  if (fp?.enabled && fp.mode !== "manualCollider" && typeof objectPathFootprintRect === "function") {
    const r = objectPathFootprintRect(obj, effectivePadding);
    if (!r) return null;
    if (r.shape === "ellipse") {
      return {
        kind: "ellipse",
        cx: r.x + r.width / 2,
        cy: r.y + r.height / 2,
        rx: Math.max(1, r.width / 2),
        ry: Math.max(1, r.height / 2),
        source: "ground-projection"
      };
    }
    return {
      kind: "rect",
      x: r.x,
      y: r.y,
      w: r.width,
      h: r.height,
      source: "ground-projection"
    };
  }

  if (pathBlockerUsesManualCollider(obj)) {
    const c = obj.collider;
    if (c.type === "box") {
      return {
        kind: "rect",
        x: Number(obj.x || 0) + Number(c.x || 0) * scale - effectivePadding,
        y: Number(obj.y || 0) + Number(c.y || 0) * scale - effectivePadding,
        w: Math.max(1, Number(c.width || obj.width || 1) * scale) + effectivePadding * 2,
        h: Math.max(1, Number(c.height || obj.height || 1) * scale) + effectivePadding * 2,
        source: "collider"
      };
    }
    if (c.type === "ellipse") {
      return {
        kind: "ellipse",
        cx: Number(obj.x || 0) + Number(c.x || (obj.width || 0) / 2) * scale,
        cy: Number(obj.y || 0) + Number(c.y || (obj.height || 0) / 2) * scale,
        rx: Math.max(1, Number(c.rx || (obj.width || 1) / 2) * scale + effectivePadding),
        ry: Math.max(1, Number(c.ry || (obj.height || 1) / 2) * scale + effectivePadding),
        source: "collider"
      };
    }
    if (c.type === "polygon" && Array.isArray(c.points) && c.points.length >= 2) {
      return {
        kind: "polygon",
        points: c.points.map(p => ({
          x: Number(obj.x || 0) + Number(p.x || 0) * scale,
          y: Number(obj.y || 0) + Number(p.y || 0) * scale
        })),
        source: "collider"
      };
    }
  }

  const r = pathBlockerAutoFootprint(obj, effectivePadding);
  return {
    kind: "rect",
    x: r.x,
    y: r.y,
    w: r.w,
    h: r.h,
    source: "auto-footprint"
  };
}



function drawPathfindingObstacleDebug(layer) {
  const pf = pathfindingSettings();
  if (!pf.debug) return;

  const padding = Number(pf.obstaclePadding || 0);
  const obstacles = pathfindingObstacleObjects();

  obstacles.forEach(obj => {
    const shape = pathfindingObstacleDebugShape(obj, padding);
    if (!shape) return;

    let el = null;
    if (shape.kind === "rect") {
      el = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      el.setAttribute("x", shape.x);
      el.setAttribute("y", shape.y);
      el.setAttribute("width", shape.w);
      el.setAttribute("height", shape.h);
    } else if (shape.kind === "ellipse") {
      el = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      el.setAttribute("cx", shape.cx);
      el.setAttribute("cy", shape.cy);
      el.setAttribute("rx", shape.rx);
      el.setAttribute("ry", shape.ry);
    } else if (shape.kind === "polygon") {
      el = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      el.setAttribute("points", shape.points.map(p => `${p.x},${p.y}`).join(" "));
    }

    if (!el) return;
    el.setAttribute("class", `pathfindingDebugObstacle ${shape.source === "auto-footprint" || shape.source === "ground-projection" ? "autoFootprint" : "manualCollider"}`);
    el.dataset.objectId = obj.id;
    layer.appendChild(el);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const lx = shape.x ?? shape.cx ?? shape.points?.[0]?.x ?? Number(obj.x || 0);
    const ly = shape.y ?? shape.cy ?? shape.points?.[0]?.y ?? Number(obj.y || 0);
    label.setAttribute("x", lx + 6);
    label.setAttribute("y", ly + 16);
    label.setAttribute("class", "pathfindingDebugObstacleLabel");
    label.textContent = `${obj.name || "bloqueante"}${shape.source === "auto-footprint" ? " · huella" : " · collider"}`;
    layer.appendChild(label);
  });
}

function pathfindingObstacleNames() {
  const names = pathfindingObstacleObjects().map(o => {
    const source = pathBlockerUsesManualCollider(o) ? "collider" : "huella";
    return `${o.name || o.id} (${source})`;
  });
  if (!names.length) return "ninguno";
  return names.slice(0, 4).join(", ") + (names.length > 4 ? ` +${names.length - 4}` : "");
}



function renderPathfindingDebugPath(points = []) {
  const layer = $("pathfindingDebugLayer");
  if (!layer) return;

  const w = Number(state.project.stage.width || 1280);
  const h = Number(state.project.stage.height || 720);
  layer.setAttribute("viewBox", `0 0 ${w} ${h}`);
  layer.innerHTML = "";

  const pf = pathfindingSettings();
  drawPathfindingObstacleDebug(layer);
  if (!pf.debug || !points?.length) return;

  const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  poly.setAttribute("points", points.map(p => `${p.x},${p.y}`).join(" "));
  poly.setAttribute("class", "pathfindingDebugPath");
  poly.setAttribute("fill", "none");
  poly.setAttribute("stroke", "#8fd3ff");
  poly.setAttribute("stroke-width", "5");
  poly.setAttribute("stroke-linecap", "round");
  poly.setAttribute("stroke-linejoin", "round");
  layer.appendChild(poly);

  points.forEach((p, i) => {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", p.x);
    c.setAttribute("cy", p.y);
    c.setAttribute("r", i === 0 || i === points.length - 1 ? 7 : 4);
    c.setAttribute("class", "pathfindingDebugPoint");
    layer.appendChild(c);
  });
}



function getPlayer() {
  return currentScene()?.objects.find(o => o.type === "player");
}

function ensureMovementAnimationHelpers() {
  if (typeof startPlayerMoveAnimation !== "function") {
    window.startPlayerMoveAnimation = () => {};
  }
  if (typeof stopPlayerMoveAnimation !== "function") {
    window.stopPlayerMoveAnimation = () => {};
  }
}


function forcePlayerVisualUpdate(player, label = "move") {
  if (!player) return;
  try {
    updateObjectElement(player);
    currentScene()?.objects
      .filter(o => o.id !== player.id)
      .forEach(updateObjectElement);
  } catch (err) {}

  try {
    if (!els.stage?.querySelector?.(`[data-id="${player.id}"]`) && typeof renderStage === "function") {
      renderStage();
    }
  } catch (err) {}

  if ($("statusText")) {
    $("statusText").textContent = `${label}: Player x=${Math.round(player.x)}, y=${Math.round(player.y)}`;
  }
}


function movePlayerDirectFallback(player, point, reason = "fallback") {
  const playerScale = player.scale || 1;
  const start = { x: Number(player.x || 0), y: Number(player.y || 0) };
  const target = {
    x: point.x - player.width * playerScale / 2,
    y: point.y - player.height * playerScale
  };

  const dx = target.x - start.x;
  const dy = target.y - start.y;
  const dist = Math.hypot(dx, dy);

  player._moving = true;
  startPlayerMoveAnimation(player);

  if ($("statusText")) {
    $("statusText").textContent =
      `Direct ${reason}: inicio ${Math.round(start.x)},${Math.round(start.y)} → destino ${Math.round(target.x)},${Math.round(target.y)}`;
  }

  // Movimiento mínimo inmediato para comprobar que el render del Player responde.
  if (dist > 1) {
    const nudge = Math.min(24, dist);
    player.x = start.x + dx / dist * nudge;
    player.y = start.y + dy / dist * nudge;
    forcePlayerVisualUpdate(player, `Nudge ${reason}`);
  }

  const startAfterNudge = { x: Number(player.x || 0), y: Number(player.y || 0) };
  const dx2 = target.x - startAfterNudge.x;
  const dy2 = target.y - startAfterNudge.y;
  const dist2 = Math.hypot(dx2, dy2);
  const duration = Math.max(120, dist2 / (player.speed || 260) * 1000);
  const t0 = performance.now();
  let frames = 0;

  function finishInstant(label = "finish") {
    player.x = target.x;
    player.y = target.y;
    player._moving = false;
    stopPlayerMoveAnimation(player);
    forcePlayerVisualUpdate(player, `${label} ${reason}`);
  }

  function step(now) {
    frames += 1;

    // Si el modo no es Play por cualquier inconsistencia de UI, no abortamos:
    // acabamos el movimiento instantáneamente para no dejar al Player bloqueado.
    if (state.mode !== "play") {
      finishInstant("Modo no Play, salto");
      return;
    }

    if (!player._moving) {
      finishInstant("Movimiento cancelado, salto");
      return;
    }

    const t = Math.min(1, (now - t0) / duration);
    const ease = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    player.x = startAfterNudge.x + dx2 * ease;
    player.y = startAfterNudge.y + dy2 * ease;

    forcePlayerVisualUpdate(player, `Moviendo ${reason} f${frames}`);
    try { evaluateSpatialTriggers(); } catch (err) {}

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      finishInstant("Llegada");
    }
  }

  requestAnimationFrame(step);

  // Failsafe: si algo impide los frames, al menos recoloca el Player.
  setTimeout(() => {
    if (player._moving && Math.hypot(player.x - target.x, player.y - target.y) > 4) {
      finishInstant("Failsafe");
    }
  }, Math.min(1200, duration + 250));
}



function setPlayerDomTransformDirect(player, label = "player") {
  if (!player) return;
  const el = els.stage?.querySelector?.(`[data-id="${player.id}"]`);
  if (el) {
    const flip = player.facing === -1 ? -1 : 1;
    const sc = Number(player.scale || 1);
    el.style.transform = `translate3d(${Number(player.x || 0)}px, ${Number(player.y || 0)}px, 0) scale(${sc * flip}, ${sc}) rotate(${Number(player.rotation || 0)}deg)`;
    if (typeof computeVisualDepthZ === "function") el.style.zIndex = String(computeVisualDepthZ(player));
    el.dataset.runtimeMoved = "1";
  }
  if ($("statusText")) $("statusText").textContent = `${label}: player ${Math.round(player.x)},${Math.round(player.y)}`;
}

function moveAdventurePlayerIndependent(point, reason = "click", options = {}) {
  ensureMovementAnimationHelpers();

  const player = getPlayer();
  if (!player) {
    showMessage("No hay Player en esta escena.");
    return false;
  }

  const scale = Number(player.scale || 1);
  const start = { x: Number(player.x || 0), y: Number(player.y || 0) };
  const target = options.pointIsTopLeft
    ? { x: Number(point.x || 0), y: Number(point.y || 0) }
    : {
        x: Number(point.x || 0) - Number(player.width || 0) * scale / 2,
        y: Number(point.y || 0) - Number(player.height || 0) * scale
      };

  const dx = target.x - start.x;
  const dy = target.y - start.y;
  const dist = Math.hypot(dx, dy);

  if (dist < 1) {
    if (typeof options.onDone === "function") options.onDone();
    return true;
  }

  if (player.autoFlipX && target.x !== start.x) {
    player.facing = target.x < start.x ? -1 : 1;
  }

  player._moving = true;
  player._moveToken = uid();
  const token = player._moveToken;

  startPlayerMoveAnimation(player);

  const duration = Math.max(120, dist / Math.max(1, Number(player.speed || 260)) * 1000);
  const t0 = performance.now();

  function applyPosition(x, y, label) {
    player.x = x;
    player.y = y;

    const el = els.stage?.querySelector?.(`[data-id="${player.id}"]`);
    if (el) {
      const flip = player.facing === -1 ? -1 : 1;
      const sc = Number(player.scale || 1);
      el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${sc * flip}, ${sc}) rotate(${Number(player.rotation || 0)}deg)`;
      if (typeof computeVisualDepthZ === "function") el.style.zIndex = String(computeVisualDepthZ(player));
      el.dataset.floorMoved = "1";
    } else if (typeof updateObjectElement === "function") {
      updateObjectElement(player);
    }

    if ($("statusText")) {
      $("statusText").textContent = `${label}: ${Math.round(x)},${Math.round(y)}`;
    }
  }

  function finish(label = "Llegada") {
    if (player._moveToken !== token) return;
    applyPosition(target.x, target.y, `${label} ${reason}`);
    player._moving = false;
    stopPlayerMoveAnimation(player);
    try { evaluateSpatialTriggers(); } catch (err) {}
    if (typeof options.onDone === "function") options.onDone();
  }

  function frame(now) {
    if (player._moveToken !== token) return;

    const t = Math.min(1, (now - t0) / duration);
    const ease = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const x = start.x + dx * ease;
    const y = start.y + dy * ease;

    applyPosition(x, y, `Moviendo ${reason}`);

    try { evaluateSpatialTriggers(); } catch (err) {}

    if (t < 1) requestAnimationFrame(frame);
    else finish("Llegada");
  }

  if ($("statusText")) {
    $("statusText").textContent = `Movimiento suelo: ${Math.round(start.x)},${Math.round(start.y)} → ${Math.round(target.x)},${Math.round(target.y)}`;
  }

  requestAnimationFrame(frame);

  return true;
}





function isPathfindingWalkablePointSoft(point, overrides = {}) {
  const scene = currentScene();
  if (!scene) return false;
  const w = Number(state.project.stage.width || 1280);
  const h = Number(state.project.stage.height || 720);
  if (point.x < 0 || point.y < 0 || point.x > w || point.y > h) return false;
  if (!isNavigable(point)) return false;
  if (overrides.ignoreObjects) return true;

  const padding = Number(overrides.obstaclePadding ?? pathfindingSettings().obstaclePadding ?? 0);
  return !pathfindingObstacleObjects().some(obj => pointInObjectBoundsWithPadding(point, obj, padding));
}

function lineWalkableSoft(a, b, overrides = {}, samples = 24) {
  const steps = Math.max(2, samples);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    if (!isPathfindingWalkablePointSoft(p, overrides)) return false;
  }
  return true;
}

function nearestWalkablePointSoft(point, overrides = {}, maxRadius = 220) {
  if (isPathfindingWalkablePointSoft(point, overrides)) return point;
  const grid = Number(overrides.gridSize || pathfindingSettings().gridSize || 32);
  const step = Math.max(6, grid / 3);
  for (let r = step; r <= maxRadius; r += step) {
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
      const p = { x: point.x + Math.cos(a) * r, y: point.y + Math.sin(a) * r };
      if (isPathfindingWalkablePointSoft(p, overrides)) return p;
    }
  }
  return null;
}

function computePathAStarSoft(startPoint, endPoint, overrides = {}) {
  const scene = currentScene();
  const pf = pathfindingSettings();
  if (!scene || !pf.enabled) return [startPoint, endPoint];

  const grid = Math.max(6, Number(overrides.gridSize || pf.gridSize || 32));
  const padding = Number(overrides.obstaclePadding ?? pf.obstaclePadding ?? 0);

  const start = nearestWalkablePointSoft(startPoint, { obstaclePadding: padding, gridSize: grid }, 240);
  const end = nearestWalkablePointSoft(endPoint, { obstaclePadding: padding, gridSize: grid }, 240);

  if (!start || !end) {
    return {
      error: !start ? "start_not_walkable" : "end_not_walkable",
      start,
      end,
      requestedStart: startPoint,
      requestedEnd: endPoint,
      grid,
      padding
    };
  }

  if (lineWalkableSoft(start, end, { obstaclePadding: padding, gridSize: grid }, 32)) {
    return [start, end];
  }

  // Reutiliza A* existente, pero suavizando temporalmente los parámetros de escena.
  const oldGrid = pf.gridSize;
  const oldPadding = pf.obstaclePadding;

  try {
    pf.gridSize = grid;
    pf.obstaclePadding = padding;
    const path = computePathAStar(start, end);
    if (path && path.length >= 2) return path;
  } finally {
    pf.gridSize = oldGrid;
    pf.obstaclePadding = oldPadding;
  }

  return {
    error: "no_route",
    start,
    end,
    requestedStart: startPoint,
    requestedEnd: endPoint,
    grid,
    padding
  };
}

function pathfindingErrorText(result) {
  if (!result?.error) return "";
  if (result.error === "start_not_walkable") return "inicio fuera de zona/celda navegable";
  if (result.error === "end_not_walkable") return "destino fuera de zona/celda navegable";
  if (result.error === "no_route") return `sin ruta con grid ${result.grid}, margen ${result.padding}`;
  return result.error;
}



function obstacleRectForPath(obj, padding = 0) {
  const s = Number(obj.scale || 1);
  return {
    x: Number(obj.x || 0) - padding,
    y: Number(obj.y || 0) - padding,
    w: Math.max(1, Number(obj.width || 0) * s) + padding * 2,
    h: Math.max(1, Number(obj.height || 0) * s) + padding * 2
  };
}

function segmentIntersectsRect(a, b, r) {
  // Muestreo suficiente para fallback visual de aventura.
  const steps = Math.max(8, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 18));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return true;
  }
  return false;
}

function blockingObstaclesForSegment(a, b, padding = 0) {
  return pathfindingObstacleObjects()
    .map(obj => ({ obj, rect: obstacleRectForPath(obj, padding) }))
    .filter(item => segmentIntersectsRect(a, b, item.rect));
}

function simpleWaypointPathAroundObstacles(start, end, padding = 18) {
  const blockers = blockingObstaclesForSegment(start, end, padding);
  if (!blockers.length) return [start, end];

  const candidates = [];

  blockers.forEach(({ rect }) => {
    const gap = Math.max(24, padding + 18);
    const points = [
      { x: rect.x - gap, y: rect.y - gap },
      { x: rect.x + rect.w + gap, y: rect.y - gap },
      { x: rect.x - gap, y: rect.y + rect.h + gap },
      { x: rect.x + rect.w + gap, y: rect.y + rect.h + gap },
      { x: rect.x - gap, y: rect.y + rect.h / 2 },
      { x: rect.x + rect.w + gap, y: rect.y + rect.h / 2 },
      { x: rect.x + rect.w / 2, y: rect.y - gap },
      { x: rect.x + rect.w / 2, y: rect.y + rect.h + gap }
    ];

    points.forEach(p => {
      if (isPathfindingWalkablePointSoft(p, { obstaclePadding: 0 })) candidates.push(p);
    });
  });

  let best = null;
  let bestScore = Infinity;

  for (const mid of candidates) {
    if (!lineWalkableSoft(start, mid, { obstaclePadding: 0 }, 28)) continue;
    if (!lineWalkableSoft(mid, end, { obstaclePadding: 0 }, 28)) continue;
    const score = Math.hypot(mid.x - start.x, mid.y - start.y) + Math.hypot(end.x - mid.x, end.y - mid.y);
    if (score < bestScore) {
      bestScore = score;
      best = [start, mid, end];
    }
  }

  if (best) return best;

  // Dos waypoints si uno no basta.
  for (const a of candidates) {
    if (!lineWalkableSoft(start, a, { obstaclePadding: 0 }, 24)) continue;
    for (const b of candidates) {
      if (a === b) continue;
      if (!lineWalkableSoft(a, b, { obstaclePadding: 0 }, 24)) continue;
      if (!lineWalkableSoft(b, end, { obstaclePadding: 0 }, 24)) continue;
      const score =
        Math.hypot(a.x - start.x, a.y - start.y) +
        Math.hypot(b.x - a.x, b.y - a.y) +
        Math.hypot(end.x - b.x, end.y - b.y);
      if (score < bestScore) {
        bestScore = score;
        best = [start, a, b, end];
      }
    }
  }

  return best || null;
}

function followFootPathWithIndependentMovement(path, label = "ruta") {
  const player = getPlayer();
  if (!player || !Array.isArray(path) || path.length < 2) return false;

  renderPathfindingDebugPath(path);
  const queue = path.slice(1);

  function nextSegment() {
    const foot = queue.shift();
    if (!foot) return;
    const topLeft = playerTopLeftFromFootPoint(player, foot);
    moveAdventurePlayerIndependent(topLeft, label, {
      pointIsTopLeft: true,
      onDone: nextSegment
    });
  }

  nextSegment();
  return true;
}



function expandedObstacleRectForVisibility(obj, padding = 24) {
  const shape = pathfindingObstacleDebugShape(obj, padding);

  if (shape?.kind === "rect") {
    return { x: shape.x, y: shape.y, w: shape.w, h: shape.h, obj, source: shape.source };
  }

  if (shape?.kind === "ellipse") {
    return {
      x: shape.cx - shape.rx,
      y: shape.cy - shape.ry,
      w: shape.rx * 2,
      h: shape.ry * 2,
      obj,
      source: shape.source
    };
  }

  if (shape?.kind === "polygon" && shape.points?.length) {
    const xs = shape.points.map(p => p.x);
    const ys = shape.points.map(p => p.y);
    const minX = Math.min(...xs) - padding;
    const maxX = Math.max(...xs) + padding;
    const minY = Math.min(...ys) - padding;
    const maxY = Math.max(...ys) + padding;
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY, obj, source: shape.source };
  }

  const r = pathBlockerAutoFootprint(obj, padding);
  return { ...r, obj, source: "auto-footprint" };
}


function visibilityObstacleRects(padding = 24) {
  return pathfindingObstacleObjects().map(o => expandedObstacleRectForVisibility(o, padding));
}

function pointInsideRect(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

function segmentClearForVisibility(a, b, rects, navStrict = true) {
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const steps = Math.max(8, Math.ceil(dist / 12));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };

    if (navStrict && typeof isNavigable === "function" && !isNavigable(p)) return false;

    for (const r of rects) {
      if (pointInsideRect(p, r)) return false;
    }
  }
  return true;
}

function visibilityCandidatePoints(start, end, padding = 30) {
  const w = Number(state.project.stage.width || 1280);
  const h = Number(state.project.stage.height || 720);
  const rects = visibilityObstacleRects(padding);
  const pts = [
    { ...start, label: "start" },
    { ...end, label: "end" }
  ];

  const addPoint = (x, y, label) => {
    const p = {
      x: Math.max(0, Math.min(w, x)),
      y: Math.max(0, Math.min(h, y)),
      label
    };
    if (typeof isNavigable === "function" && !isNavigable(p)) return;
    if (rects.some(r => pointInsideRect(p, r))) return;
    if (pts.some(q => Math.hypot(q.x - p.x, q.y - p.y) < 10)) return;
    pts.push(p);
  };

  rects.forEach((r, index) => {
    const gap = Math.max(24, padding);
    const x0 = r.x - gap;
    const x1 = r.x + r.w + gap;
    const y0 = r.y - gap;
    const y1 = r.y + r.h + gap;
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;

    // Esquinas y centros de borde alrededor del obstáculo.
    addPoint(x0, y0, `obs${index}-tl`);
    addPoint(x1, y0, `obs${index}-tr`);
    addPoint(x0, y1, `obs${index}-bl`);
    addPoint(x1, y1, `obs${index}-br`);
    addPoint(cx, y0, `obs${index}-top`);
    addPoint(cx, y1, `obs${index}-bottom`);
    addPoint(x0, cy, `obs${index}-left`);
    addPoint(x1, cy, `obs${index}-right`);

    // Puntos algo más abiertos para escenarios con máquinas grandes.
    addPoint(x0 - gap, y0, `obs${index}-tl2`);
    addPoint(x1 + gap, y0, `obs${index}-tr2`);
    addPoint(x0 - gap, y1, `obs${index}-bl2`);
    addPoint(x1 + gap, y1, `obs${index}-br2`);
  });

  return { points: pts, rects };
}

function shortestVisibilityPath(points, rects) {
  const n = points.length;
  if (n < 2) return null;

  const edges = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (!segmentClearForVisibility(points[i], points[j], rects, true)) continue;
      const d = Math.hypot(points[j].x - points[i].x, points[j].y - points[i].y);
      edges[i].push({ to: j, d });
      edges[j].push({ to: i, d });
    }
  }

  const dist = Array(n).fill(Infinity);
  const prev = Array(n).fill(-1);
  const used = Array(n).fill(false);
  dist[0] = 0;

  for (let k = 0; k < n; k++) {
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < n; i++) {
      if (!used[i] && dist[i] < bestDist) {
        best = i;
        bestDist = dist[i];
      }
    }
    if (best === -1) break;
    if (best === 1) break;
    used[best] = true;
    for (const e of edges[best]) {
      const nd = dist[best] + e.d;
      if (nd < dist[e.to]) {
        dist[e.to] = nd;
        prev[e.to] = best;
      }
    }
  }

  if (!Number.isFinite(dist[1])) return null;

  const path = [];
  let cur = 1;
  while (cur !== -1) {
    path.push({ x: points[cur].x, y: points[cur].y });
    cur = prev[cur];
  }
  path.reverse();
  return path;
}

function simplifyVisibilityPath(path, rects) {
  if (!Array.isArray(path) || path.length <= 2) return path;
  const out = [path[0]];
  let i = 0;
  while (i < path.length - 1) {
    let best = i + 1;
    for (let j = path.length - 1; j > i + 1; j--) {
      if (segmentClearForVisibility(path[i], path[j], rects, true)) {
        best = j;
        break;
      }
    }
    out.push(path[best]);
    i = best;
  }
  return out;
}

function computeVisibilityGraphPath(start, end, padding = 30) {
  const softStart = nearestWalkablePointSoft(start, { obstaclePadding: 0 }, 260) || start;
  const softEnd = nearestWalkablePointSoft(end, { obstaclePadding: 0 }, 260) || end;

  const { points, rects } = visibilityCandidatePoints(softStart, softEnd, padding);

  if (segmentClearForVisibility(softStart, softEnd, rects, true)) {
    return [softStart, softEnd];
  }

  const path = shortestVisibilityPath(points, rects);
  if (!path) return null;
  return simplifyVisibilityPath(path, rects);
}

function drawVisibilityGraphDebug(path = []) {
  const layer = $("pathfindingDebugLayer");
  if (!layer || !Array.isArray(path) || !path.length) return;
  const pf = pathfindingSettings();
  if (!pf.debug) return;

  path.forEach((p, idx) => {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", p.x);
    c.setAttribute("cy", p.y);
    c.setAttribute("r", idx === 0 || idx === path.length - 1 ? 8 : 6);
    c.setAttribute("class", "visibilityDebugPoint");
    layer.appendChild(c);
  });
}



function playFloorUnderlyingObjectAt(clientX, clientY) {
  const floor = $("playFloorButtonLayer");
  const oldFloorPointer = floor ? floor.style.pointerEvents : "";
  if (floor) floor.style.pointerEvents = "none";

  const list = document.elementsFromPoint ? document.elementsFromPoint(clientX, clientY) : [];

  if (floor) floor.style.pointerEvents = oldFloorPointer;

  const scene = currentScene();
  for (const el of list) {
    const objectEl = el?.closest?.(".sceneObject");
    if (!objectEl) continue;

    const obj = scene?.objects?.find(o => o.id === objectEl.dataset.id);
    if (!obj) continue;
    if (obj.type === "background" || obj.type === "player") continue;

    return { obj, el: objectEl };
  }

  return null;
}

function playObjectHasAnyInteraction(obj) {
  if (!obj || obj.type === "background" || obj.type === "player") return false;

  const action = String(obj.action || "none");
  if (action && action !== "none") return true;

  if (obj.pickable || obj.collectible) return true;
  if (obj.gotoSceneId) return true;
  if (obj.message && String(obj.message).trim()) return true;
  if (obj.useItemEnabled) return true;
  if (obj.relatedObjectId) return true;

  return false;
}


function inventoryTargetUnderFloorLayer(e) {
  const hit = playFloorUnderlyingObjectAt(e.clientX, e.clientY);
  if (!hit?.obj) return null;
  if (hit.obj.type === "background" || hit.obj.type === "player") return null;
  return hit.obj;
}

function handleSelectedInventoryUseFromFloor(e, p) {
  if (!state.selectedInventoryItemId) return false;

  updateInventoryCursor(e.clientX, e.clientY);

  const target = inventoryTargetUnderFloorLayer(e);
  if (!target) {
    showMessage("Haz clic sobre un objeto de la escena para usarlo.");
    if ($("statusText")) $("statusText").textContent = "Inventario: no hay objeto destino bajo el cursor.";
    return true;
  }

  if (typeof shouldObjectReceivePlayClick === "function" && !shouldObjectReceivePlayClick(target, p)) {
    showMessage("Haz clic sobre el objeto de destino para usarlo.");
    if ($("statusText")) $("statusText").textContent = `Inventario: fuera del área interactiva de ${target.name || target.id}.`;
    return true;
  }

  if ($("statusText")) {
    const item = selectedInventoryObject?.();
    $("statusText").textContent = `Usar ${item?.name || "item"} en ${target.name || target.id}`;
  }

  runObjectAction(target);
  return true;
}


function handlePlayFloorObjectInteraction(e, p) {
  if (state.selectedInventoryItemId) {
    return handleSelectedInventoryUseFromFloor(e, p);
  }

  const hit = playFloorUnderlyingObjectAt(e.clientX, e.clientY);
  if (!hit?.obj) return false;

  const obj = hit.obj;

  if (!playObjectHasAnyInteraction(obj)) {
    if ($("statusText")) $("statusText").textContent = `Objeto sin interacción: ${obj.name || obj.id}; se trata como suelo.`;
    return false;
  }

  if (typeof shouldObjectReceivePlayClick === "function" && !shouldObjectReceivePlayClick(obj, p)) {
    if ($("statusText")) $("statusText").textContent = `Clic fuera del área interactiva de ${obj.name || obj.id}; se trata como suelo.`;
    return false;
  }

  if ($("statusText")) $("statusText").textContent = `Interacción Play: ${obj.name || obj.id}`;
  runObjectAction(obj);
  return true;
}



function moveAdventurePlayerWithPathfindingIndependent(point, reason = "click") {
  const player = getPlayer();
  if (!player) {
    showMessage("No hay Player en esta escena.");
    return false;
  }

  const scene = typeof currentScene === "function" ? currentScene() : null;
  if (player.type === "player" && player.usePathfinding !== false && typeof syncScenePathfindingFromPlayer === "function") {
    syncScenePathfindingFromPlayer(scene);
  }

  const pf = typeof pathfindingSettings === "function" ? pathfindingSettings() : { enabled: false };

  if (typeof isNavigable === "function" && !isNavigable(point)) {
    showMessage("No se puede caminar ahí: fuera de zona navegable.");
    if ($("statusText")) $("statusText").textContent = `Suelo oficial: fuera de zona navegable ${Math.round(point.x)},${Math.round(point.y)}`;
    return true;
  }

  if (!pf.enabled) {
    if ($("statusText")) $("statusText").textContent = `Suelo oficial directo: ${Math.round(point.x)},${Math.round(point.y)}`;
    return moveAdventurePlayerIndependent(point, `directo ${reason}`);
  }

  const startFoot = computePlayerFootPoint(player);
  const targetFoot = { x: Number(point.x || 0), y: Number(point.y || 0) };

  const attempts = [
    { gridSize: pf.gridSize, obstaclePadding: pf.obstaclePadding, label: "normal" },
    { gridSize: Math.max(12, Number(pf.gridSize || 32) / 2), obstaclePadding: pf.obstaclePadding, label: "grid fino" },
    { gridSize: Math.max(12, Number(pf.gridSize || 32) / 2), obstaclePadding: Math.max(0, Number(pf.obstaclePadding || 0) / 2), label: "grid fino + margen medio" },
    { gridSize: Math.max(10, Number(pf.gridSize || 32) / 3), obstaclePadding: 0, label: "sin margen" }
  ];

  let result = null;
  let used = null;

  for (const attempt of attempts) {
    result = computePathAStarSoft(startFoot, targetFoot, attempt);
    if (Array.isArray(result) && result.length >= 2) {
      used = attempt;
      break;
    }
  }

  if (Array.isArray(result) && result.length >= 2) {
    if ($("statusText")) {
      $("statusText").textContent = `Suelo oficial A*: ${result.length} puntos (${used?.label || "normal"}) · obstáculos ${pathfindingObstacleObjects().length}: ${pathfindingObstacleNames()}.`;
    }
    return followFootPathWithIndependentMovement(result, "A* oficial");
  }

  // Fallback principal para aventuras gráficas: visibility graph alrededor de bloqueantes.
  const visibilityPath = computeVisibilityGraphPath(startFoot, targetFoot, Math.max(28, Number(pf.obstaclePadding || 0) + 20));
  if (visibilityPath && visibilityPath.length >= 2) {
    renderPathfindingDebugPath(visibilityPath);
    drawVisibilityGraphDebug(visibilityPath);
    if ($("statusText")) {
      $("statusText").textContent = `Visibility path: ${visibilityPath.length} puntos · obstáculos ${pathfindingObstacleObjects().length}: ${pathfindingObstacleNames()}.`;
    }
    showMessage("A* no conectó la rejilla; usando ruta de visibilidad.");
    return followFootPathWithIndependentMovement(visibilityPath, "visibility path");
  }

  // Fallback 1: línea directa caminable.
  const softStart = nearestWalkablePointSoft(startFoot, { obstaclePadding: 0 }, 260) || startFoot;
  const softEnd = nearestWalkablePointSoft(targetFoot, { obstaclePadding: 0 }, 260) || targetFoot;

  if (lineWalkableSoft(softStart, softEnd, { obstaclePadding: 0 }, 40)) {
    const direct = [softStart, softEnd];
    if ($("statusText")) $("statusText").textContent = `A* falló, fallback línea directa · obstáculos ${pathfindingObstacleObjects().length}: ${pathfindingObstacleNames()}.`;
    showMessage("A* no encontró ruta, usando línea directa.");
    return followFootPathWithIndependentMovement(direct, "fallback directo");
  }

  // Fallback 2: ruta sencilla alrededor de obstáculos.
  const waypointPath = simpleWaypointPathAroundObstacles(softStart, softEnd, 18);
  if (waypointPath && waypointPath.length >= 2) {
    if ($("statusText")) $("statusText").textContent = `A* falló, fallback waypoints ${waypointPath.length} puntos · obstáculos ${pathfindingObstacleObjects().length}: ${pathfindingObstacleNames()}.`;
    showMessage("A* no encontró ruta, usando waypoints de recuperación.");
    return followFootPathWithIndependentMovement(waypointPath, "fallback waypoints");
  }

  const msg = pathfindingErrorText(result);
  const blockerCount = pathfindingObstacleObjects().length;
  renderPathfindingDebugPath([startFoot, targetFoot]);

  if (blockerCount > 0) {
    showMessage(`No encuentro una ruta alrededor del obstáculo (${msg}).`);
    if ($("statusText")) {
      $("statusText").textContent =
        `A* bloqueado: ${msg} · obstáculos ${blockerCount}: ${pathfindingObstacleNames()}. No se usa movimiento directo.`;
    }
    return true;
  }

  showMessage(`A* no encontró ruta (${msg}). Movimiento directo de emergencia.`);
  if ($("statusText")) {
    $("statusText").textContent =
      `A* FAILSAFE: ${msg} · sin obstáculos · moviendo directo a ${Math.round(targetFoot.x)},${Math.round(targetFoot.y)}`;
  }
  return moveAdventurePlayerIndependent(targetFoot, "failsafe sin ruta");
}








function movePlayerTo(point) {
  ensureMovementAnimationHelpers();
  const player = getPlayer();
  if (!player) {
    showMessage("Esta escena no tiene player.");
    if ($("statusText")) $("statusText").textContent = "Pathfinding: no hay Player.";
    return;
  }

  const playerScale = player.scale || 1;
  const playerCenterX = player.x + player.width * playerScale / 2;
  if (player.autoFlipX && point.x !== playerCenterX) {
    player.facing = point.x < playerCenterX ? -1 : 1;
  }

  if (!isNavigable(point)) {
    showMessage("No se puede caminar ahí: el punto está fuera del área navegable.");
    if ($("statusText")) $("statusText").textContent = "Pathfinding: clic fuera del área navegable.";
    stopPlayerMoveAnimation(player);
    return;
  }

  const pf = pathfindingSettings();

  // Si pathfinding está desactivado, se conserva el comportamiento clásico directo.
  if (!pf.enabled) {
    movePlayerDirectFallback(player, point, "pathfinding off");
    return;
  }

  const startFoot = computePlayerFootPoint(player);
  const targetFoot = { x: point.x, y: point.y };
  const path = computePathAStar(startFoot, targetFoot);

  if (!path || path.length < 2) {
    showMessage("No encuentro un camino hasta ahí. Uso movimiento directo de prueba.");
    if ($("statusText")) $("statusText").textContent = "Pathfinding: sin ruta, fallback directo.";
    renderPathfindingDebugPath([startFoot, targetFoot]);
    movePlayerDirectFallback(player, point, "sin ruta A*");
    return;
  }

  if ($("statusText")) $("statusText").textContent = `Pathfinding: ruta con ${path.length} puntos.`;
  renderPathfindingDebugPath(path);

  player._moving = true;
  player._path = path;
  player._pathIndex = 1;
  startPlayerMoveAnimation(player);

  function moveNextSegment() {
    if (!player._moving) {
      player._moving = false;
      stopPlayerMoveAnimation(player);
      return;
    }
    if (state.mode !== "play") {
      const last = player._path?.[player._path.length - 1];
      if (last) movePlayerDirectFallback(player, last, "modo no Play");
      return;
    }

    const targetFoot = player._path[player._pathIndex];
    if (!targetFoot) {
      player._moving = false;
      player._path = null;
      player._pathIndex = 0;
      stopPlayerMoveAnimation(player);
      return;
    }

    const startTopLeft = { x: player.x, y: player.y };
    const endTopLeft = playerTopLeftFromFootPoint(player, targetFoot);

    const currentFoot = computePlayerFootPoint(player);
    if (player.autoFlipX && targetFoot.x !== currentFoot.x) {
      player.facing = targetFoot.x < currentFoot.x ? -1 : 1;
    }

    const dx = endTopLeft.x - startTopLeft.x;
    const dy = endTopLeft.y - startTopLeft.y;
    const dist = Math.hypot(dx, dy);
    const duration = Math.max(80, dist / (player.speed || 260) * 1000);
    const t0 = performance.now();

    function step(now) {
      if (!player._moving) {
        player._moving = false;
        stopPlayerMoveAnimation(player);
        return;
      }
      if (state.mode !== "play") {
        player.x = endTopLeft.x;
        player.y = endTopLeft.y;
        forcePlayerVisualUpdate(player, "Path fallback salto");
        player._moving = false;
        stopPlayerMoveAnimation(player);
        return;
      }

      const t = Math.min(1, (now - t0) / duration);
      const ease = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      player.x = startTopLeft.x + dx * ease;
      player.y = startTopLeft.y + dy * ease;

      forcePlayerVisualUpdate(player, `Path segment ${player._pathIndex}`);
      evaluateSpatialTriggers();

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        player._pathIndex += 1;
        moveNextSegment();
      }
    }

    requestAnimationFrame(step);
  }

  moveNextSegment();
}





function isPlayUiClickTarget(target) {
  if (!target) return false;
  return !!target.closest?.("#gameInventory, #inventoryCursor, #messageBox, #splashScreen, .physicsEditor, .logicEditor, .mechanismEditor, .animationEditor");
}

function isInteractiveSceneObjectElement(el) {
  if (!el) return false;
  const obj = currentScene()?.objects?.find(o => o.id === el.dataset.id);
  if (!obj) return false;

  const stateInteractable = typeof isObjectInteractableInCurrentState === "function"
    ? isObjectInteractableInCurrentState(obj)
    : obj.visible !== false;

  const hasAction = stateInteractable && obj.action && obj.action !== "none";
  const typedInteractive = stateInteractable && ["item", "hotspot", "door", "character"].includes(obj.type);
  const acceptsInventory = stateInteractable && (!!obj.useItemEnabled || (!!state.selectedInventoryItemId && obj.type !== "background"));
  return !!(hasAction || typedInteractive || acceptsInventory);
}

function handlePlayStagePointerMoveRequest(e) {
  if (state.mode !== "play") return false;
  if (sceneTransitionActive()) return false;
  if (e.button !== undefined && e.button !== 0) return false;
  if (isPlayUiClickTarget(e.target)) return false;

  const sceneObjectEl = e.target?.closest?.(".sceneObject");
  if (sceneObjectEl && isInteractiveSceneObjectElement(sceneObjectEl)) {
    // El objeto interactivo debe gestionar su propia acción.
    return false;
  }

  if (state.selectedInventoryItemId) {
    showMessage("Haz clic sobre un objeto de la escena para usarlo.");
    return true;
  }

  const player = getPlayer();
  if (!player) {
    showMessage("No hay ningún objeto Player en esta escena.");
    return true;
  }

  if (!Number(player.speed || 0)) {
    showMessage("El Player tiene velocidad 0. Sube la velocidad en sus propiedades.");
    return true;
  }

  const p = stagePoint(e);
  showPlayClickMarker(p);
  if ($("statusText")) $("statusText").textContent = `Play click-to-move: ${stagePointDebugText(p)}`;
  moveAdventurePlayerWithPathfindingIndependent(p, "play click");
  return true;
}



function elementsBelowPlayClickCatcher(clientX, clientY) {
  const catcher = $("playClickCatcherLayer");
  const previous = catcher ? catcher.style.pointerEvents : "";
  if (catcher) catcher.style.pointerEvents = "none";
  const list = document.elementsFromPoint ? document.elementsFromPoint(clientX, clientY) : [];
  if (catcher) catcher.style.pointerEvents = previous;
  return list || [];
}

function playClickUnderlyingInteractiveObject(clientX, clientY) {
  const list = elementsBelowPlayClickCatcher(clientX, clientY);
  for (const el of list) {
    const objectEl = el?.closest?.(".sceneObject");
    if (!objectEl) continue;
    if (isInteractiveSceneObjectElement(objectEl)) return objectEl;
  }
  return null;
}

function handlePlayClickCatcherPointerUp(e) {
  if (state.mode !== "play") return false;
  if (e.button !== undefined && e.button !== 0) return false;
  if (sceneTransitionActive()) return true;

  if (state.selectedInventoryItemId) {
    showMessage("Haz clic sobre un objeto de la escena para usarlo.");
    return true;
  }

  const p = stagePoint(e);
  showPlayClickMarker(p);

  const actionHit = playObjectUnderPointForAction(e.clientX, e.clientY, p);
  if (actionHit?.obj) {
    runObjectAction(actionHit.obj);
    if ($("statusText")) $("statusText").textContent = `Click catcher objeto: ${actionHit.obj.name || actionHit.obj.id}`;
    return true;
  }

  if ($("statusText")) $("statusText").textContent = `Click catcher suelo: ${stagePointDebugText(p)}`;
  if (typeof moveAdventurePlayerIndependent === "function") return moveAdventurePlayerIndependent(p, "click catcher suelo");
  movePlayerTo(p);
  return true;
}


function bindPlayClickCatcherLayer() {
  if (document._aventuriaPlayClickCatcherBound) return;
  document._aventuriaPlayClickCatcherBound = true;

  document.addEventListener("pointerup", e => {
    const catcher = $("playClickCatcherLayer");
    if (!catcher || catcher.classList.contains("hidden")) return;
    if (e.target !== catcher) return;
    const handled = handlePlayClickCatcherPointerUp(e);
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
    }
  }, true);
}


function bindDocumentPlayClickToMoveFallback() {
  if (document._aventuriaPlayClickMoveBound) return;
  document._aventuriaPlayClickMoveBound = true;

  document.addEventListener("pointerup", e => {
    if (state.mode !== "play") return;
    if (e.button !== undefined && e.button !== 0) return;
    if (!els.stage) return;
    if (isPlayUiClickTarget(e.target)) return;

    const rect = els.stage.getBoundingClientRect();
    const inside =
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top && e.clientY <= rect.bottom;

    if (!inside) return;

    const sceneObjectEl = e.target?.closest?.(".sceneObject");
    if (sceneObjectEl && isInteractiveSceneObjectElement(sceneObjectEl)) return;

    const handled = handlePlayStagePointerMoveRequest(e);
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
    }
  }, true);
}


function bindPlayClickToMoveFallback() {
  if (!els.stage || els.stage._playClickMoveBound) return;
  els.stage._playClickMoveBound = true;

  let down = null;

  els.stage.addEventListener("pointerdown", e => {
    if (state.mode !== "play") return;
    if (e.button !== 0) return;
    if (isPlayUiClickTarget(e.target)) return;
    down = { x: e.clientX, y: e.clientY, target: e.target };
  }, true);

  els.stage.addEventListener("pointerup", e => {
    if (state.mode !== "play") return;
    if (!down) return;

    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    down = null;
    if (moved > 8) return;

    const handled = handlePlayStagePointerMoveRequest(e);
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
    }
  }, true);
}


function inventoryEntryMatchesObjectId(entryId, objectId) {
  if (!entryId || !objectId) return false;
  if (entryId === objectId) return true;
  const entryObj = findObjectInAnyScene(entryId).obj;
  const wantedObj = findObjectInAnyScene(objectId).obj;
  if (!entryObj || !wantedObj) return false;
  return objectInventoryKey(entryObj) === objectInventoryKey(wantedObj);
}

function addItemToInventoryById(objectId, { hideObject = true, showMessageText = "" } = {}) {
  const found = findObjectInAnyScene(objectId);
  const obj = found.obj;
  if (!obj) return false;

  normalizeObjectStates(obj);

  const already = state.inventory.some(id => inventoryEntryMatchesObjectId(id, obj.id));
  if (!already) {
    if (!inventoryHasSpace()) {
      showMessage(state.project.inventorySettings?.fullMessage || "El inventario está lleno.");
      return false;
    }
    state.inventory.push(obj.id);
  }

  if (hideObject) {
    const collectState = obj.collectState || preferredStateName(obj, ["recogida", "collected", "hidden"], "hidden");
    applyObjectState(obj, collectState, { render: false });
  }

  state.selectedInventoryItemId = null;
  updateInventoryCursor();
  if (showMessageText) showMessage(showMessageText);
  renderAll();
  return true;
}


function removeItemFromInventoryById(objectId) {
  const before = state.inventory.length;
  state.inventory = state.inventory.filter(id => !inventoryEntryMatchesObjectId(id, objectId));
  renderInventory();
  return state.inventory.length !== before;
}

function runQuickUseItemInteraction(target, selectedItemId) {
  if (!target?.useItemEnabled || !selectedItemId) return false;

  const requiredId = target.useItemId || target.requiresItemId || "";
  if (requiredId && !inventoryEntryMatchesObjectId(selectedItemId, requiredId)) {
    showMessage(target.useItemFailMessage || target.lockedMessage || "Eso no funciona.");
    return true;
  }

  if (target.useItemSetState) {
    applyObjectState(target, target.useItemSetState, { render: false });
  }

  if (target.useItemRevealObjectId) {
    revealObjectForAdventureUse(target.useItemRevealObjectId);
  }

  if (target.useItemHideObjectId) {
    hideObjectForAdventureUse(target.useItemHideObjectId);
  }

  if (target.useItemHideSelf) {
    hideObjectForAdventureUse(target.id);
  }

  if (target.useItemConsume) removeItemFromInventoryById(selectedItemId);

  showMessage(target.useItemMessage || target.message || "Hecho.");

  if (target.useItemGotoSceneId) {
    renderAll();
    gotoScene(target.useItemGotoSceneId);
  } else {
    renderAll();
  }

  return true;
}



function prepareSceneRuntimeOnEnter() {
  const scene = currentScene();
  if (!scene) return;

  scene.objects.forEach(o => {
    if (state.runtimeStates[o.id] === undefined) {
      state.runtimeStates[o.id] = o.initialState || "default";
    }

    if (o.type === "player") {
      o._moving = false;
      o._walkAnimActive = false;
      if (o.sprite) {
        o.sprite._accum = 0;
        o.sprite._clipElapsed = 0;
        const idleClip = o.sprite.stopClip || "idle";
        if (o.sprite.enabled && o.sprite.clips?.[idleClip]) {
          playObjectAnimation(o, idleClip, true, null);
        } else {
          o.sprite.playing = false;
        }
      }
    }
  });
}

function revealObjectForAdventureUse(objectId) {
  const obj = currentScene().objects.find(o => o.id === objectId);
  if (!obj) return false;
  obj.visible = true;
  const revealState = preferredStateName(obj, ["visible", "default"], "default");
  applyObjectState(obj, revealState, { render: false });
  resetSpatialTriggersForObject(obj.id);
  return true;
}


function hideObjectForAdventureUse(objectId) {
  const obj = currentScene().objects.find(o => o.id === objectId);
  if (!obj) return false;
  const hideState = preferredStateName(obj, ["hidden", "oculta", "oculto"], "hidden");
  applyObjectState(obj, hideState, { render: false });
  resetSpatialTriggersForObject(obj.id);
  return true;
}



function objectInteractionPoint(obj) {
  if (!obj) return null;
  return {
    x: obj.x + (obj.width * (obj.scale || 1)) / 2,
    y: obj.y + obj.height * (obj.scale || 1)
  };
}

function playerInteractionPoint(player = null) {
  const p = player || findPlayerObject();
  if (!p) return null;
  return {
    x: p.x + (p.width * (p.scale || 1)) / 2,
    y: p.y + p.height * (p.scale || 1)
  };
}

function isPlayerCloseEnoughToObject(obj) {
  if (!obj || obj.type === "background" || obj.requireProximity === false) return true;
  const player = findPlayerObject();
  if (!player || obj.type === "player") return true;

  const playerPoint = playerInteractionPoint(player);
  const objectPoint = objectInteractionPoint(obj);
  if (!playerPoint || !objectPoint) return true;

  const maxDistance = Math.max(0, Number(obj.interactionDistance ?? 190));
  if (maxDistance <= 0) return true;

  return Math.hypot(playerPoint.x - objectPoint.x, playerPoint.y - objectPoint.y) <= maxDistance;
}

function requirePlayerProximityForObject(obj) {
  if (isPlayerCloseEnoughToObject(obj)) return true;
  showMessage(obj.tooFarMessage || "Estás demasiado lejos.");
  return false;
}

function movePlayerToInteractionRange(obj) {
  const player = findPlayerObject();
  const target = objectInteractionPoint(obj);
  if (!player || !target) return false;

  const distance = Math.max(0, Number(obj.interactionDistance ?? 190));
  const playerPoint = playerInteractionPoint(player);
  if (!playerPoint || Math.hypot(playerPoint.x - target.x, playerPoint.y - target.y) <= distance) return false;

  moveAdventurePlayerWithPathfindingIndependent(target, "botón test");
  return true;
}

function runObjectAction(obj) {
  if (sceneTransitionActive()) return;

  if (state.mode === "play" && !requirePlayerProximityForObject(obj)) {
    return;
  }

  if (state.mode === "play" && state.selectedInventoryItemId && obj.type !== "background") {
    const itemId = state.selectedInventoryItemId;

    if (runQuickUseItemInteraction(obj, itemId)) {
      clearSelectedInventoryItem();
      return;
    }

    const used = runLogicGraph("useItem", obj.id, { itemId, targetId: obj.id });
    if (used) {
      clearSelectedInventoryItem();
      return;
    }

    showMessage("No puedes usar eso aquí.");
    clearSelectedInventoryItem();
    return;
  }

  if (obj.requiresItemId && !inventoryContainsObjectId(obj.requiresItemId)) {
    showMessage(obj.lockedMessage || "Necesitas otro objeto.");
    return;
  }

  if (obj.action === "runGraph") return runLogicGraph("click", obj.id);

  const effectiveAction = obj.type === "item" && (!obj.action || obj.action === "none") ? "pickup" : obj.action;

  switch (effectiveAction) {
    case "message": showMessage(obj.message || obj.name); break;
    case "pickup": giveItem(obj); break;
    case "goto": gotoScene(obj.targetSceneId); break;
    case "toggle": toggleTarget(obj.targetObjectId, obj.message); break;
    case "playSound": playAudio(obj.audioId); break;
    default: if (obj.message) showMessage(obj.message);
  }
}

function giveItem(obj) {
  addItemToInventoryById(obj.id, {
    hideObject: true,
    showMessageText: obj.message || `Has recogido ${obj.name}.`
  });
}

function toggleTarget(id, msg = "") {
  const target = currentScene().objects.find(o => o.id === id);
  if (target) {
    target.visible = !target.visible;
    showMessage(msg || "");
    renderAll();
  }
}

function resolveSceneId(sceneRef) {
  if (!sceneRef) return "";
  const ref = String(sceneRef).trim();

  const byId = state.project.scenes.find(s => s.id === ref);
  if (byId) return byId.id;

  const byName = state.project.scenes.find(s => (s.name || "").trim() === ref);
  if (byName) return byName.id;

  const byNameLower = state.project.scenes.find(s => (s.name || "").trim().toLowerCase() === ref.toLowerCase());
  if (byNameLower) return byNameLower.id;

  return "";
}


function markSceneTransitionCooldown(ms = 450) {
  state.sceneTransitionUntil = performance.now() + ms;
}

function sceneTransitionActive() {
  return state.mode === "play" && performance.now() < Number(state.sceneTransitionUntil || 0);
}


function markSceneEntry(sceneId = "") {
  state.sceneEntrySerial = Number(state.sceneEntrySerial || 0) + 1;
  state.sceneEntryToken = `${sceneId || state.selectedSceneId || ""}:${state.sceneEntrySerial}`;
  state.sceneEnteredAt = performance.now();
  return state.sceneEntryToken;
}

function currentSceneEntryToken() {
  return state.sceneEntryToken || `${state.selectedSceneId || ""}:0`;
}


function playSceneEntryAudioForCurrentToken(reason = "sceneEntry") {
  if (state.mode !== "play") return false;

  const scene = currentScene();
  if (!scene) return false;

  const token = currentSceneEntryToken();
  const key = `${scene.id}:${token}`;

  state._sceneAudioAutoplayToken ??= "";
  state._sceneAudioActiveSceneId ??= "";

  // Bloqueamos solo duplicados reales dentro de la misma escena activa.
  // Si hemos estado en otra escena y volvemos, permitimos rearmar aunque el token no cambiara.
  if (state._sceneAudioAutoplayToken === key && state._sceneAudioActiveSceneId === scene.id) {
    audioGraphDebug?.(`Audio escena ya rearmado para token ${token} (${reason})`);
    return false;
  }

  state._sceneAudioActiveSceneId = scene.id;

  if (!scene.audioAutoplay || !scene.audioIds?.length) {
    audioGraphDebug?.(`Audio escena sin autoplay (${reason}): ${scene.name}`);
    state._sceneAudioAutoplayToken = key;
    return false;
  }

  state._sceneAudioAutoplayToken = key;

  audioGraphDebug?.(`Audio escena autoplay (${reason}): ${scene.name} · ${scene.audioIds.length} audio(s)`);

  scene.audioIds.forEach(id => {
    // Reinicio explícito en cada entrada real.
    stopRuntimeAudio("scene", id);
    playSceneAudio(id, true);
  });

  return true;
}



function gotoScene(sceneRef) {
  const fromSceneId = state.selectedSceneId || "";
  const sceneId = resolveSceneId(sceneRef);
  if (!sceneId) {
    showMessage(`No se encontró la escena: ${sceneRef || "sin destino"}`);
    return false;
  }

  if (state.mode === "play") {
    stopRuntimeAudio("scene");
    state._sceneAudioActiveSceneId = "";
    state._sceneAudioAutoplayToken = "";
    state.selectedInventoryItemId = null;
    updateInventoryCursor();
    markSceneTransitionCooldown(900);
    state.lastSceneTransition = {
      fromSceneId,
      toSceneId: sceneId,
      at: performance.now()
    };
  }

  state.selectedSceneId = sceneId;
  state.playSceneId = state.mode === "play" ? sceneId : state.playSceneId;
  state.spatialTriggerStates = {};
  state.spatialTriggerBlocked = {};
  state.drawingZone = null;
  state.selectedZoneId = null;
  state.selectedZonePointIndex = null;
  clearSelection();
  showMessage("");

  if (state.mode === "play") {
    state._lastRuntimeStartedSceneId = "";
    state._lastRuntimeStartedEntryToken = "";
    markSceneEntry(sceneId);
    audioGraphDebug?.(`gotoScene: ${fromSceneId} -> ${sceneId} · token=${currentSceneEntryToken()}`);
    prepareSceneRuntimeOnEnter();
    if (typeof startPhysicsWorldForCurrentScene === "function") startPhysicsWorldForCurrentScene();

    // Reentrada inmediata desde el propio cambio de escena.
    playSceneEntryAudioForCurrentToken("gotoScene immediate");
  }

  renderAll();
  if (state.mode === "play") {
    requestSceneStartRuntime("gotoScene");

    // Reintentos seguros: no duplican porque el helper controla escena activa + token.
    [120, 450, 900].forEach(delay => {
      setTimeout(() => {
        if (state.mode === "play" && state.selectedSceneId === sceneId) {
          playSceneEntryAudioForCurrentToken(`gotoScene delay=${delay}`);
        }
      }, delay);
    });
  }
  return true;
}






function playAudio(audioId) {
  playAudioAsset(audioId, { loop: false, scope: "scene" });
}


const runtimeAudio = { splash: null, scene: {} };


let audioUnlocked = false;
const pendingNodeAudioQueue = [];

function markAudioUnlocked() {
  audioUnlocked = true;
  flushPendingNodeAudioQueue();
}

function unlockAudioByUserGesture() {
  if (audioUnlocked) {
    flushPendingNodeAudioQueue();
    return true;
  }

  try {
    const audio = new Audio();
    audio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQQAAAAAAA==";
    audio.volume = 0;
    const p = audio.play();
    if (p?.then) {
      p.then(() => markAudioUnlocked()).catch(() => {});
    } else {
      markAudioUnlocked();
    }
  } catch (err) {}

  flushPendingNodeAudioQueue();
  return audioUnlocked;
}

function queueNodeAudio(audioId, options = {}) {
  if (!audioId) return false;
  const exists = pendingNodeAudioQueue.some(item => item.audioId === audioId && item.scope === (options.scope || "scene"));
  if (!exists) pendingNodeAudioQueue.push({ audioId, ...options });
  if ($("statusText")) $("statusText").textContent = `Audio en cola hasta interacción: ${audioAssetById(audioId)?.name || audioId}`;
  return true;
}

function flushPendingNodeAudioQueue() {
  if (!pendingNodeAudioQueue.length) return false;
  const items = pendingNodeAudioQueue.splice(0);
  let ok = false;
  items.forEach(item => {
    const audio = playAudioAsset(item.audioId, {
      loop: !!item.loop,
      scope: item.scope || "scene",
      volume: item.volume ?? 1,
      force: true
    });
    ok = !!audio || ok;
  });
  return ok;
}


let aventuriaAudioContext = null;
const webAudioBufferCache = {};
const webAudioSceneSources = {};

function ensureAventuriaAudioContext() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!aventuriaAudioContext) aventuriaAudioContext = new Ctx();
  return aventuriaAudioContext;
}

function unlockNodeAudioEngine() {
  const ctx = ensureAventuriaAudioContext();
  if (!ctx) {
    if ($("statusText")) $("statusText").textContent = "AudioContext no disponible; usando HTMLAudio.";
    return false;
  }

  if (ctx.state === "suspended") {
    ctx.resume().then(() => {
      state.nodeAudioUnlocked = true;
      if ($("statusText")) $("statusText").textContent = "Motor de audio desbloqueado.";
      flushPendingNodeAudioQueue();
    }).catch(err => {
      if ($("statusText")) $("statusText").textContent = `No se pudo desbloquear AudioContext: ${err?.name || err?.message || "error"}`;
    });
  } else {
    state.nodeAudioUnlocked = true;
    flushPendingNodeAudioQueue();
  }

  return true;
}

async function audioBufferForAsset(asset) {
  if (!asset?.id || !asset?.dataUrl) throw new Error("Audio asset sin datos");
  if (webAudioBufferCache[asset.id]) return webAudioBufferCache[asset.id];

  const ctx = ensureAventuriaAudioContext();
  if (!ctx) throw new Error("AudioContext no disponible");

  const res = await fetch(asset.dataUrl);
  const arr = await res.arrayBuffer();
  const buffer = await ctx.decodeAudioData(arr.slice(0));
  webAudioBufferCache[asset.id] = buffer;
  return buffer;
}

function stopWebAudioSceneSource(audioId = null) {
  Object.entries(webAudioSceneSources).forEach(([id, source]) => {
    if (!audioId || id === audioId) {
      try { source.stop(); } catch (err) {}
      delete webAudioSceneSources[id];
    }
  });
}

function playAudioAssetViaWebAudio(audioId, { loop = false, scope = "scene", volume = 1 } = {}) {
  const asset = audioAssetById(audioId);
  if (!asset?.dataUrl) return false;

  const ctx = ensureAventuriaAudioContext();
  if (!ctx) return false;

  if (ctx.state === "suspended") {
    queueNodeAudio(audioId, { loop, scope, volume });
    unlockNodeAudioEngine();
    return true;
  }

  audioBufferForAsset(asset).then(buffer => {
    if (scope === "scene") stopWebAudioSceneSource(audioId);
    if (scope === "splash") stopWebAudioSceneSource("__splash__");

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    source.loop = !!loop;
    gain.gain.value = clampVolume(volume);
    source.connect(gain).connect(ctx.destination);
    source.start(0);

    if (scope === "scene") webAudioSceneSources[audioId] = source;
    if (scope === "splash") webAudioSceneSources["__splash__"] = source;

    source.onended = () => {
      if (scope === "scene" && webAudioSceneSources[audioId] === source) delete webAudioSceneSources[audioId];
      if (scope === "splash" && webAudioSceneSources["__splash__"] === source) delete webAudioSceneSources["__splash__"];
    };

    state.nodeAudioUnlocked = true;
    if ($("statusText")) $("statusText").textContent = `Audio WebAudio reproduciendo: ${asset.name || audioId}`;
  }).catch(err => {
    const reason = err?.name || err?.message || "error";
    if ($("statusText")) $("statusText").textContent = `Error WebAudio: ${asset.name || audioId} · ${reason}`;
  });

  return true;
}


let nodeAudioContext = null;
const nodeAudioBuffers = {};
const nodeAudioSceneSources = {};
const pendingGraphAudio = [];

function getNodeAudioContext() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!nodeAudioContext) nodeAudioContext = new Ctx();
  return nodeAudioContext;
}

function dataUrlToArrayBuffer(dataUrl) {
  const comma = String(dataUrl || "").indexOf(",");
  if (comma === -1) throw new Error("dataUrl inválido");
  const header = dataUrl.slice(0, comma);
  const data = dataUrl.slice(comma + 1);

  if (/;base64/i.test(header)) {
    const bin = atob(data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }

  const decoded = decodeURIComponent(data);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
  return bytes.buffer;
}

async function getNodeAudioBuffer(audioId) {
  if (nodeAudioBuffers[audioId]) {
    audioGraphDebug(`Buffer audio cache OK: ${audioAssetById(audioId)?.name || audioId}`);
    return nodeAudioBuffers[audioId];
  }

  const asset = audioAssetById(audioId);
  if (!asset?.dataUrl) throw new Error(`Audio sin datos: ${audioId || "sin id"}`);

  const ctx = getNodeAudioContext();
  if (!ctx) throw new Error("AudioContext no disponible");

  audioGraphDebug(`Decodificando audio: ${asset.name || audioId} · dataUrl ${asset.dataUrl.length} chars`);

  const arr = dataUrlToArrayBuffer(asset.dataUrl);
  audioGraphDebug(`ArrayBuffer audio: ${arr.byteLength} bytes`);

  const buffer = await ctx.decodeAudioData(arr.slice(0));
  nodeAudioBuffers[audioId] = buffer;

  audioGraphDebug(`decodeAudioData OK: ${asset.name || audioId} · ${buffer.duration.toFixed(2)}s`);
  return buffer;
}


function unlockNodeAudioEngine() {
  const ctx = getNodeAudioContext();
  if (!ctx) {
    audioGraphDebug("AudioContext no disponible.");
    return false;
  }

  const mark = () => {
    state.nodeAudioUnlocked = true;
    audioGraphDebug("Motor de audio de nodos desbloqueado.");
    flushPendingGraphAudio();
  };

  try {
    const silent = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = silent;
    source.connect(ctx.destination);
    source.start(0);
  } catch (err) {}

  if (ctx.state === "suspended") {
    ctx.resume().then(mark).catch(err => {
      if ($("statusText")) $("statusText").textContent = `AudioContext suspendido: ${err?.name || err?.message || "error"}`;
    });
  } else {
    mark();
  }

  return true;
}

function stopGraphAudio(audioId = null) {
  Object.entries(nodeAudioSceneSources).forEach(([id, source]) => {
    if (!audioId || id === audioId) {
      try { source.stop(); } catch (err) {}
      delete nodeAudioSceneSources[id];
    }
  });
}

function queueGraphAudio(audioId, options = {}) {
  if (!audioId) return false;
  const exists = pendingGraphAudio.some(item => item.audioId === audioId && item.scope === (options.scope || "scene"));
  if (!exists) pendingGraphAudio.push({ audioId, ...options });
  if ($("statusText")) $("statusText").textContent = `Audio de nodo en cola: ${audioAssetById(audioId)?.name || audioId}`;
  return true;
}

function flushPendingGraphAudio() {
  if (!pendingGraphAudio.length) return false;
  const items = pendingGraphAudio.splice(0);
  let any = false;
  items.forEach(item => {
    any = playGraphAudioAsset(item.audioId, item) || any;
  });
  return any;
}

function playGraphAudioAsset(audioId, { loop = false, scope = "scene", volume = 1 } = {}) {
  const asset = audioAssetById(audioId);
  if (!asset?.dataUrl) {
    showMessage(`Audio no encontrado: ${audioId || "sin id"}`);
    audioGraphDebug(`Audio de nodo sin datos: ${audioId || "sin id"}`);
    return false;
  }

  const ctx = getNodeAudioContext();
  if (!ctx) {
    audioGraphDebug("AudioContext no disponible; fallback HTMLAudio.");
    const htmlAudio = playAudioAsset(audioId, { loop, scope, volume, force: true });
    return !!htmlAudio;
  }

  audioGraphDebug(`playGraphAudioAsset: ${asset.name || audioId} · ctx=${ctx.state} · scope=${scope} · vol=${volume}`);

  if (ctx.state !== "running") {
    queueGraphAudio(audioId, { loop, scope, volume });
    unlockNodeAudioEngine();
    return true;
  }

  getNodeAudioBuffer(audioId).then(buffer => {
    if (scope === "scene") {
      stopGraphAudio(audioId);
      stopRuntimeAudio?.("scene", audioId);
    }

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    source.loop = !!loop;
    gain.gain.value = clampVolume(volume);
    source.connect(gain).connect(ctx.destination);
    source.start(0);

    if (scope === "scene") nodeAudioSceneSources[audioId] = source;

    source.onended = () => {
      if (scope === "scene" && nodeAudioSceneSources[audioId] === source) {
        delete nodeAudioSceneSources[audioId];
      }
      audioGraphDebug(`Audio de nodo terminado: ${asset.name || audioId}`);
    };

    audioGraphDebug(`source.start OK: ${asset.name || audioId}`);
  }).catch(err => {
    const reason = err?.name || err?.message || "error";
    audioGraphDebug(`ERROR AudioContext nodo: ${asset.name || audioId} · ${reason}`);

    const htmlAudio = playAudioAsset(audioId, { loop, scope, volume, force: true });
    if (!htmlAudio) showMessage(`No se pudo reproducir audio: ${reason}`);
  });

  return true;
}


function clampVolume(value, fallback = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function sceneAudioVolume(audioId = "", override = null) {
  const scene = currentScene();
  const master = clampVolume(scene?.audioMasterVolume ?? 1);
  const perAudio = audioId ? clampVolume(scene?.audioVolumes?.[audioId] ?? 1) : 1;
  const nodeVol = override === null || override === undefined || override === "" ? 1 : clampVolume(override);
  return clampVolume(master * perAudio * nodeVol);
}

function applySceneAudioVolumes() {
  Object.entries(runtimeAudio.scene || {}).forEach(([id, audio]) => {
    audio.volume = sceneAudioVolume(id);
  });
}

function stopRuntimeAudio(scope = "all", audioId = null) {
  if (scope === "splash" || scope === "all") {
    if (runtimeAudio.splash) {
      runtimeAudio.splash.pause();
      runtimeAudio.splash = null;
    }
  }
  if (scope === "scene" || scope === "all") {
    Object.entries(runtimeAudio.scene).forEach(([id, audio]) => {
      if (!audioId || id === audioId) {
        audio.pause();
        delete runtimeAudio.scene[id];
      }
    });
    if (typeof stopWebAudioSceneSource === "function") stopWebAudioSceneSource(audioId || null);
    if (typeof stopGraphAudio === "function") stopGraphAudio(audioId || null);
  }
}

function playAudioAsset(audioId, { loop = false, scope = "scene", volume = 1, force = false } = {}) {
  const asset = audioAssetById(audioId);
  if (!asset?.dataUrl) {
    showMessage("Audio no encontrado o sin datos.");
    if ($("statusText")) $("statusText").textContent = `Audio no encontrado o sin dataUrl: ${audioId || "sin id"}`;
    return null;
  }

  if (scope === "scene") stopRuntimeAudio("scene", audioId);
  if (scope === "splash") stopRuntimeAudio("splash");

  const audio = new Audio();
  audio.preload = "auto";
  audio.src = asset.dataUrl;
  audio.loop = !!loop;
  audio.volume = clampVolume(volume);

  if (scope === "splash") runtimeAudio.splash = audio;
  else if (scope === "scene") runtimeAudio.scene[audioId] = audio;

  audio.load();

  if ($("statusText")) $("statusText").textContent = `Intentando audio HTML (${scope}): ${asset.name || audioId}`;

  const playPromise = audio.play();

  if (playPromise?.then) {
    playPromise.then(() => {
      audioUnlocked = true;
      state.nodeAudioUnlocked = true;
      if ($("statusText")) $("statusText").textContent = `Audio HTML reproduciendo (${scope}): ${asset.name || audioId}`;
    }).catch(err => {
      const reason = err?.name || err?.message || "bloqueado";

      if ($("statusText")) $("statusText").textContent = `HTMLAudio bloqueado (${scope}): ${asset.name || audioId} · ${reason}`;

      if (typeof playAudioAssetViaWebAudio === "function" && (scope === "scene" || scope === "splash")) {
        const ok = playAudioAssetViaWebAudio(audioId, { loop, scope, volume });
        if (ok) return;
      }

      if (!force && (scope === "scene" || scope === "splash")) {
        queueNodeAudio(audioId, { loop, scope, volume });
        showMessage(`Audio preparado; se reproducirá tras el primer clic/tecla (${reason}).`);
      } else {
        showMessage(`No se pudo reproducir el audio (${reason}). Prueba a pulsar Play de nuevo o usa Probar audio.`);
      }
    });
  } else {
    audioUnlocked = true;
    state.nodeAudioUnlocked = true;
    if ($("statusText")) $("statusText").textContent = `Audio iniciado sin promesa (${scope}): ${asset.name || audioId}`;
  }

  return audio;
}




function playSceneAudio(audioId = "", loop = true, volume = null) {
  const scene = currentScene();
  const id = audioId || scene?.audioIds?.[0] || "";
  if (!id) {
    showMessage("Esta escena no tiene audio asignado.");
    return false;
  }

  const vol = sceneAudioVolume(id, volume);

  // Para audio de escena usamos primero el motor WebAudio persistente.
  // Evita bloqueos de HTMLAudio al volver a entrar en una escena.
  if (typeof playGraphAudioAsset === "function") {
    const ok = playGraphAudioAsset(id, { loop, scope: "scene", volume: vol });
    if (ok) return true;
  }

  playAudioAsset(id, { loop, scope: "scene", volume: vol, force: true });
  return true;
}


function stopSceneAudio(audioId = "") {
  stopRuntimeAudio("scene", audioId || null);
  return true;
}

function setSceneAudioMasterVolume(volume) {
  const scene = currentScene();
  if (!scene) return false;
  scene.audioMasterVolume = clampVolume(volume);
  applySceneAudioVolumes();
  renderSceneAudioSettings();
  return true;
}

function setSceneAudioVolume(audioId = "", volume = 1) {
  const scene = currentScene();
  if (!scene) return false;
  const id = audioId || scene.audioIds?.[0] || "";
  if (!id) return false;
  scene.audioVolumes ??= {};
  scene.audioVolumes[id] = clampVolume(volume);
  applySceneAudioVolumes();
  renderSceneAudioSettings();
  return true;
}

function startCurrentSceneRuntime() {
  const scene = currentScene();
  if (!scene) return;

  const entryToken = currentSceneEntryToken();

  state._lastRuntimeStartedEntryToken ??= "";
  if (state._lastRuntimeStartedEntryToken === entryToken) {
    if (!sceneTransitionActive() && typeof primeSpatialTriggerStatesForCurrentScene === "function") {
      primeSpatialTriggerStatesForCurrentScene();
    } else if (!sceneTransitionActive()) {
      evaluateSpatialTriggers();
    }
    return;
  }

  const startCount = (scene.logic?.nodes || []).filter(n => {
    normalizeNodeType(n);
    return n.category === "event" && n.type === "sceneStart";
  }).length;

  audioGraphDebug(`ENTRA ESCENA: ${scene.name} · token=${entryToken} · sceneStart encontrados: ${startCount}`);

  let graphAttempted = false;

  try {
    // Audio asociado a propiedades de escena.
    // Se controla por sceneEntryToken para que vuelva a sonar al reentrar.
    playSceneEntryAudioForCurrentToken("startCurrentSceneRuntime");
    if (typeof startPhysicsWorldForCurrentScene === "function") startPhysicsWorldForCurrentScene();

    graphAttempted = true;
    runLogicGraph("sceneStart");

    state._lastRuntimeStartedEntryToken = entryToken;
    state._lastRuntimeStartedSceneId = scene.id;
  } catch (err) {
    audioGraphDebug(`ERROR startCurrentSceneRuntime antes de marcar token: ${err?.name || err?.message || err}`);
    if (graphAttempted) {
      state._lastRuntimeStartedEntryToken = "";
    }
    return;
  }

  if (typeof primeSpatialTriggerStatesForCurrentScene === "function") {
    primeSpatialTriggerStatesForCurrentScene();
  } else if (!sceneTransitionActive()) {
    evaluateSpatialTriggers();
  }
}






function runSplashThenStart() {
  const splash = state.project.splash || {};
  const asset = imageAssetById(splash.imageId);

  audioGraphDebug?.(`runSplashThenStart: enabled=${!!splash.enabled} image=${!!splash.imageId} asset=${!!asset?.dataUrl}`);

  if (!splash.enabled || !splash.imageId || !asset?.dataUrl) {
    audioGraphDebug?.("runSplashThenStart: sin splash, startCurrentSceneRuntime directo");
    startCurrentSceneRuntime();
    requestSceneStartRuntime("runSplashThenStart no splash");
    return;
  }

  let screen = $("splashScreen");
  if (!screen) {
    screen = document.createElement("div");
    screen.id = "splashScreen";
    screen.className = "splashScreen hidden";
    els.stage.appendChild(screen);
  }

  screen.innerHTML = `<img src="${asset.dataUrl}" alt="">`;
  screen.classList.remove("hidden");
  screen.style.display = "grid";
  screen.style.pointerEvents = "auto";

  if (splash.audioId) playAudioAsset(splash.audioId, { loop: false, scope: "splash", volume: 1 });

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    screen.classList.add("hidden");
    screen.style.display = "";
    screen.style.pointerEvents = "";
    screen.innerHTML = "";
    stopRuntimeAudio("splash");
    audioGraphDebug?.("runSplashThenStart: finish splash, startCurrentSceneRuntime");
    startCurrentSceneRuntime();
    requestSceneStartRuntime("runSplashThenStart finish");
  };

  const duration = Math.max(0, Number(splash.durationMs ?? 2500));
  const timer = setTimeout(finish, duration);
  screen.onclick = () => {
    if (splash.allowSkip === false) return;
    clearTimeout(timer);
    finish();
  };
}


function showMessage(text) {
  if (!text) {
    els.messageBox.style.display = "none";
    els.messageBox.textContent = "";
    return;
  }
  els.messageBox.textContent = text;
  applyMessageSettings();
  els.messageBox.style.display = "block";
  clearTimeout(showMessage.timer);
  showMessage.timer = setTimeout(() => els.messageBox.style.display = "none", 3500);
}


function objectInventoryKey(obj) {
  if (!obj) return "";
  obj.inventoryKey ??= obj.inventorySourceId || obj.id;
  return obj.inventoryKey;
}

function inventoryContainsObjectId(requiredId) {
  if (!requiredId) return true;
  return state.inventory.some(id => {
    if (id === requiredId) return true;
    const obj = findObjectInAnyScene(id).obj;
    return obj && objectInventoryKey(obj) === requiredId;
  });
}

function inventoryHasSpace() {
  return state.inventory.length < Number(state.project.inventorySettings?.slots || 8);
}


function selectedInventoryObject() {
  return state.selectedInventoryItemId ? findObjectInAnyScene(state.selectedInventoryItemId).obj : null;
}

function updateInventoryCursor(clientX = null, clientY = null) {
  let cursor = $("inventoryCursor");
  if (!cursor && els.stage) {
    cursor = document.createElement("div");
    cursor.id = "inventoryCursor";
    cursor.className = "inventoryCursor hidden";
    els.stage.appendChild(cursor);
    els.inventoryCursor = cursor;
  }
  if (!cursor) return;

  const obj = selectedInventoryObject();
  if (state.mode !== "play" || !obj) {
    cursor.classList.add("hidden");
    cursor.innerHTML = "";
    els.stage?.classList?.remove("usingInventoryItem");
    return;
  }

  if (clientX != null && clientY != null) {
    const rect = els.stage.getBoundingClientRect();
    state.inventoryCursor.x = clientX - rect.left;
    state.inventoryCursor.y = clientY - rect.top;
  }

  cursor.classList.remove("hidden");
  els.stage?.classList?.add("usingInventoryItem");
  cursor.style.transform = `translate(${state.inventoryCursor.x + 14}px, ${state.inventoryCursor.y + 14}px)`;

  const asset = imageAssetById(objectInventoryImageId(obj));
  if (asset?.dataUrl) {
    cursor.innerHTML = `<img src="${asset.dataUrl}" alt="">`;
  } else {
    cursor.textContent = obj.name.slice(0, 10);
  }
}

function clearSelectedInventoryItem() {
  state.selectedInventoryItemId = null;
  updateInventoryCursor();
  renderInventory();
}

function applyGameInventoryLayout(el) {
  if (!el) return;
  const settings = state.project?.inventorySettings || {};
  const position = settings.position || "bottom-center";
  const slotSize = Math.max(24, Math.min(160, Number(settings.slotSize || settings.iconWidth || 72)));
  const iconW = Math.max(16, Number(settings.iconWidth || slotSize) || slotSize);
  const iconH = Math.max(16, Number(settings.iconHeight || slotSize) || slotSize);

  el.style.setProperty("--inv-slot-size", `${slotSize}px`);
  el.style.setProperty("--inv-icon-w", `${iconW}px`);
  el.style.setProperty("--inv-icon-h", `${iconH}px`);

  el.classList.remove("inv-top-left", "inv-top-center", "inv-top-right", "inv-bottom-left", "inv-bottom-center", "inv-bottom-right");
  el.classList.add(`inv-${position}`);
}

function renderInventory() {
  els.inventory.innerHTML = "";
  if (els.gameInventory) {
    els.gameInventory.innerHTML = "";
    els.gameInventory.className = `gameInventory ${state.inventoryOpen ? "open" : ""}`;
    applyGameInventoryLayout(els.gameInventory);
  }

  state.inventory.forEach(id => {
    const obj = findObjectInAnyScene(id).obj;
    if (!obj) return;
    const item = document.createElement("div");
    item.className = "inventoryItem";
    const asset = imageAssetById(objectInventoryImageId(obj));
    if (asset?.dataUrl) {
      const img = document.createElement("img");
      img.src = asset.dataUrl;
      item.appendChild(img);
    } else item.textContent = obj.name;
    els.inventory.appendChild(item);
  });

  if (!els.gameInventory) return;

  const toggle = document.createElement("div");
  toggle.className = "inventoryToggle";
  const icon = imageAssetById(state.project.inventorySettings?.iconImageId);
  if (icon?.dataUrl) {
    const img = document.createElement("img");
    img.src = icon.dataUrl;
    toggle.appendChild(img);
  } else {
    toggle.classList.add("placeholder");
    toggle.textContent = "🎒";
  }
  toggle.onclick = e => {
    e.stopPropagation();
    state.inventoryOpen = !state.inventoryOpen;
    renderInventory();
  };
  els.gameInventory.appendChild(toggle);

  const slotsWrap = document.createElement("div");
  slotsWrap.className = "inventorySlots";
  const maxSlots = Number(state.project.inventorySettings?.slots || 8);

  for (let i = 0; i < maxSlots; i++) {
    const slot = document.createElement("div");
    slot.className = "gameInvSlot";
    const id = state.inventory[i];
    if (id) {
      const obj = findObjectInAnyScene(id).obj;
      if (obj) {
        const gameItem = document.createElement("div");
        gameItem.className = `gameInvItem ${state.selectedInventoryItemId === id ? "selected" : ""}`;
        gameItem.title = obj.name;
        gameItem.draggable = true;
        gameItem.ondragstart = ev => {
          state.draggingInventoryItem = true;
          ev.dataTransfer.effectAllowed = "move";
          ev.dataTransfer.setData("inventoryObjectId", id);
          ev.dataTransfer.setData("text/plain", id);
        };
        gameItem.ondragend = () => {
          setTimeout(() => state.draggingInventoryItem = false, 0);
        };
        const asset = imageAssetById(objectInventoryImageId(obj));
        if (asset?.dataUrl) {
          const img2 = document.createElement("img");
          img2.src = asset.dataUrl;
          gameItem.appendChild(img2);
        } else gameItem.textContent = obj.name.slice(0, 6);
        gameItem.onclick = e => {
          e.stopPropagation();
          if (state.draggingInventoryItem) return;
          state.selectedInventoryItemId = state.selectedInventoryItemId === id ? null : id;
          if (state.selectedInventoryItemId) {
            runLogicGraph("inventorySelect", id);
            updateInventoryCursor(e.clientX, e.clientY);
            showMessage(`${obj.name} seleccionado. Haz clic sobre un objeto de la escena para usarlo.`);
          } else {
            updateInventoryCursor();
          }
          renderInventory();
        };
        slot.appendChild(gameItem);
      }
    }
    slotsWrap.appendChild(slot);
  }
  els.gameInventory.appendChild(slotsWrap);
  updateInventoryCursor();
}



function deepClone(data) {
  return JSON.parse(JSON.stringify(data));
}

function beginPlaySession() {
  if (typeof syncSpriteFrameFromPropertiesPanel === "function") syncSpriteFrameFromPropertiesPanel();
  if (typeof syncPathBlockerFromPropertiesPanel === "function") syncPathBlockerFromPropertiesPanel();
  if (typeof syncObjectPhysicsFromPropertiesPanel === "function") syncObjectPhysicsFromPropertiesPanel();
  if (typeof applyPathBlockerMemory === "function") applyPathBlockerMemory();

  const selected = state.project?.scenes?.find(s => s.id === state.selectedSceneId);
  if (typeof normalizeSceneParallaxLayers === "function") normalizeSceneParallaxLayers(selected);
  if (typeof syncScenePathfindingFromPlayer === "function") syncScenePathfindingFromPlayer(selected);
  const selectedHasPlayer = !!selected?.objects?.some(o => o.type === "player");
  if (typeof isPathfindingLabScene === "function" && isPathfindingLabScene(selected)) {
    normalizePathfindingLabRuntimeScene(selected);
    state.project.startSceneId = selected.id;
  } else if (selectedHasPlayer && (!state.project.startSceneId || !state.project.scenes?.find(s => s.id === state.project.startSceneId)?.objects?.some(o => o.type === "player"))) {
    // Para pruebas, si la inicial no tiene player pero la seleccionada sí, arrancamos desde la seleccionada.
    state.project.startSceneId = selected.id;
  }

  // El snapshot de Play debe ser SIEMPRE el estado editor actual.
  // Si se reutiliza un snapshot viejo, al parar Play se pierden cambios recientes
  // como frameWidth/frameHeight editados en el panel.
  state.editorSnapshot = {
    project: deepClone(state.project),
    selectedSceneId: state.selectedSceneId
  };

  if (typeof applyPathBlockerMemory === "function") applyPathBlockerMemory(state.editorSnapshot?.project);

  state.playSceneId = state.project.startSceneId || state.selectedSceneId;

  const playScene = state.project?.scenes?.find(s => s.id === state.playSceneId);
  if (typeof normalizeSceneParallaxLayers === "function") normalizeSceneParallaxLayers(playScene);
  if (typeof syncScenePathfindingFromPlayer === "function") syncScenePathfindingFromPlayer(playScene);
  if (typeof isPathfindingLabScene === "function" && isPathfindingLabScene(playScene)) {
    normalizePathfindingLabRuntimeScene(playScene);
  }

  if ($("statusText")) {
    $("statusText").textContent = `Play: ${playScene?.name || "sin escena"}${playScene?.objects?.some(o => o.type === "player") ? " · Player OK" : " · sin Player"}`;
  }

  state.inventory = [];
  state.runtimeStates = {};
  state.spatialTriggerStates = {};
  state.spatialTriggerBlocked = {};
  state.selectedInventoryItemId = null;
  updateInventoryCursor();
  state.inventoryOpen = false;
  state._lastRuntimeStartedSceneId = "";
  state._lastRuntimeStartedEntryToken = "";
  state._sceneAudioAutoplayToken = "";
  state._sceneAudioActiveSceneId = "";
  state._sceneAudioWatcherKey = "";
  state.sceneEntrySerial = 0;
  state.sceneEntryToken = "";
  state.sceneEnteredAt = 0;
}





function restoreEditorSnapshot() {
  stopRuntimeAudio("all");
  stopSpatialTriggerLoop();
  if (!state.editorSnapshot) return;
  state.project = normalizeProject(deepClone(state.editorSnapshot.project));
  state.selectedSceneId = state.editorSnapshot.selectedSceneId;
  state.editorSnapshot = null;
  state.playSceneId = null;
  state.inventory = [];
  state.runtimeStates = {};
  state.spatialTriggerStates = {};
  state.spatialTriggerBlocked = {};
  state.selectedInventoryItemId = null;
  updateInventoryCursor();
  state.inventoryOpen = false;
  stopAnimationLoop();
  clearSelection();
}

function stopPlaySession() {
  stopSpatialTriggerLoop();
  restoreEditorSnapshot();
  state.mode = "editor";
  els.logicEditor.classList.add("hidden");
  $("editorModeBtn").classList.add("active");
  $("playModeBtn").classList.remove("active");
  $("nodesModeBtn").classList.remove("active");
  $("stopModeBtn").classList.remove("active");
  $("statusText").textContent = "Modo editor";
  renderAll();
}


let sceneAudioReentryWatcher = null;

function startSceneAudioReentryWatcher() {
  if (sceneAudioReentryWatcher) return;

  state._sceneAudioWatcherKey = "";

  sceneAudioReentryWatcher = setInterval(() => {
    if (state.mode !== "play") return;

    const scene = currentScene();
    if (!scene) return;

    const key = `${scene.id}:${currentSceneEntryToken()}`;

    if (state._sceneAudioWatcherKey !== key) {
      state._sceneAudioWatcherKey = key;
      playSceneEntryAudioForCurrentToken("watcher");
    }
  }, 180);
}

function stopSceneAudioReentryWatcher() {
  if (sceneAudioReentryWatcher) {
    clearInterval(sceneAudioReentryWatcher);
    sceneAudioReentryWatcher = null;
  }
  state._sceneAudioWatcherKey = "";
}

function requestSceneStartRuntime(reason = "runtime") {
  if (state.mode !== "play") {
    audioGraphDebug?.(`SceneStart watchdog ignorado (${reason}): modo=${state.mode}`);
    return;
  }

  const scene = currentScene();
  if (!scene) {
    audioGraphDebug?.(`SceneStart watchdog sin escena (${reason}).`);
    return;
  }

  const token = currentSceneEntryToken();
  audioGraphDebug?.(`SceneStart watchdog solicitado (${reason}) · escena=${scene.name} · token=${token} · last=${state._lastRuntimeStartedEntryToken || ""}`);

  const delays = [0, 200, 600, 1050];

  delays.forEach(delay => {
    setTimeout(() => {
      if (state.mode !== "play") return;
      if (currentScene()?.id !== scene.id) return;

      const currentToken = currentSceneEntryToken();
      if (state._lastRuntimeStartedEntryToken === currentToken) {
        audioGraphDebug?.(`SceneStart watchdog no duplica (${reason}) · delay=${delay} · token=${currentToken}`);
        return;
      }

      audioGraphDebug?.(`SceneStart watchdog ejecuta startCurrentSceneRuntime (${reason}) · delay=${delay}`);
      startCurrentSceneRuntime();
    }, delay);
  });
}


function setMode(mode) {
  audioGraphDebug?.(`setMode(${mode}) solicitado`);

  if (state.drawingZone && mode !== "editor") {
    if (state.drawingZone.points?.length >= 3) closeDrawingZone();
    else cancelDrawingZone();
  }

  if (mode === "play") {
    if (typeof syncPathBlockerFromPropertiesPanel === "function") syncPathBlockerFromPropertiesPanel();
    if (typeof syncObjectPhysicsFromPropertiesPanel === "function") syncObjectPhysicsFromPropertiesPanel();
    if (typeof applyPathBlockerMemory === "function") applyPathBlockerMemory();
    if (typeof unlockAudioByUserGesture === "function") unlockAudioByUserGesture();
    if (typeof unlockNodeAudioEngine === "function") unlockNodeAudioEngine();
    beginPlaySession();
    if (state.project.startSceneId) state.selectedSceneId = state.project.startSceneId;
    markSceneEntry(state.selectedSceneId);
    audioGraphDebug?.(`PLAY prepara escena inicial: ${currentScene()?.name || state.selectedSceneId} · token=${currentSceneEntryToken()}`);
    prepareSceneRuntimeOnEnter();
  } else if (state.mode === "play" && mode !== "play") {
    restoreEditorSnapshot();
  }

  state.mode = mode;

  if (mode === "editor") {
    state.tool = "select";
    if (typeof forceStopPhysicsForEditor === "function") forceStopPhysicsForEditor("enterEditor");
  } else if (mode === "physics") {
    state.tool = "select";
    state.physicsTool = "select";
    if (typeof forceStopPhysicsForEditor === "function") forceStopPhysicsForEditor("enterPhysicsEditor");
  } else if (mode !== "play") {
    state.tool = "select";
  }

  // Watchdog temprano: se programa antes de cualquier render/toggle de interfaz.
  if (mode === "play") {
    requestSceneStartRuntime("setMode early");
    playSceneEntryAudioForCurrentToken("setMode direct");
    startSceneAudioReentryWatcher();
    setTimeout(() => playSceneEntryAudioForCurrentToken("setMode early"), 0);
  }

  try {
    if (mode === "play") {
      currentScene()?.objects.forEach(o => {
        state.runtimeStates[o.id] = o.initialState || "default";
        o.state = o.initialState || "default";
        if (o.sprite) {
          o.sprite._accum = 0;
          o.sprite._clipElapsed = 0;
          o._moving = false;
          o._walkAnimActive = false;

          if (o.type === "player") {
            const idleClip = o.sprite.stopClip || "idle";
            if (o.sprite.enabled && o.sprite.clips?.[idleClip]) {
              playObjectAnimation(o, idleClip, true, null);
            } else {
              o.sprite.playing = false;
              const clip = activeSpriteClip(o);
              if (clip) setSpriteFrame(o, clip.from || 0);
            }
          } else {
            o.sprite.playing = !!o.sprite.enabled;
            const clip = activeSpriteClip(o);
            if (clip) setSpriteFrame(o, clip.from || 0);
          }
        }
      });
    }
  } catch (err) {
    audioGraphDebug?.(`ERROR preparando objetos Play: ${err?.name || err?.message || err}`);
  }

  try {
    els.logicEditor?.classList.toggle("hidden", mode !== "nodes");
    els.mechanismEditor?.classList.toggle("hidden", mode !== "mechanisms");
    els.animationEditor?.classList.toggle("hidden", mode !== "animations");
    els.physicsEditor?.classList.toggle("hidden", mode !== "physics");
    $("editorModeBtn")?.classList.toggle("active", mode === "editor");
    $("playModeBtn")?.classList.toggle("active", mode === "play");
    $("nodesModeBtn")?.classList.toggle("active", mode === "nodes");
    $("mechanismsModeBtn")?.classList.toggle("active", mode === "mechanisms");
    $("animationsModeBtn")?.classList.toggle("active", mode === "animations");
    $("physicsModeBtn")?.classList.toggle("active", mode === "physics");
    $("stopModeBtn")?.classList.toggle("active", mode === "editor" && !!state.editorSnapshot);
    if ($("statusText")) $("statusText").textContent = mode === "editor" ? "Modo editor" : mode === "play" ? "Modo play" : mode === "mechanisms" ? "Editor de mecanismos" : mode === "animations" ? "Editor de animaciones" : mode === "physics" ? "Editor de física Matter.js" : "Editor de nodos";
  } catch (err) {
    audioGraphDebug?.(`ERROR actualizando UI de modo: ${err?.name || err?.message || err}`);
  }

  try {
    renderAll();
  } catch (err) {
    audioGraphDebug?.(`ERROR renderAll en setMode: ${err?.name || err?.message || err}`);
  }

  if (mode === "play") {
    try { startAnimationLoop(); } catch (err) { audioGraphDebug?.(`ERROR startAnimationLoop: ${err?.name || err?.message || err}`); }
    try { startSpatialTriggerLoop(); } catch (err) { audioGraphDebug?.(`ERROR startSpatialTriggerLoop: ${err?.name || err?.message || err}`); }
    audioGraphDebug?.("PLAY llama runSplashThenStart()");
    try { runSplashThenStart(); } catch (err) { audioGraphDebug?.(`ERROR runSplashThenStart: ${err?.name || err?.message || err}`); }
    requestSceneStartRuntime("setMode(play) final");
  } else {
    if (typeof stopPhysicsWorld === "function") stopPhysicsWorld();
    stopSceneAudioReentryWatcher();
    try { stopSpatialTriggerLoop(); } catch (err) {}
    try { stopAnimationLoop(); } catch (err) {}
  }
}



function placeSelectedObjectAt(point) {
  const obj = selectedObject();
  if (!obj) return;
  obj.x = Math.round(point.x - obj.width * obj.scale / 2);
  obj.y = Math.round(point.y - obj.height * obj.scale / 2);
  renderAll();
  $("statusText").textContent = `${obj.name} colocado en la escena.`;
}

function setTool(tool) {
  state.tool = tool === "navEdit" ? "nav" : tool;
  state.navMode = tool === "navEdit" ? "edit" : (tool === "nav" ? "create" : state.navMode);
  state.drawingZone = null;

  $("selectToolBtn").classList.toggle("active", tool === "select");
  $("navToolBtn").classList.toggle("active", tool === "nav" && state.navMode === "create");
  $("navEditToolBtn").classList.toggle("active", tool === "navEdit" || (state.tool === "nav" && state.navMode === "edit"));

  renderAll();
}

function handleStageClick(e) {
  const p = stagePoint(e);

  if ((state.mode === "editor" || state.mode === "physics") && state.tool === "select" && e.altKey && selectedObject()) {
    placeSelectedObjectAt(p);
    return;
  }

  if (state.mode === "play") {
    if (handlePlayStagePointerMoveRequest(e)) return;
    return;
  }

  if (state.mode === "editor" && state.tool === "nav") {
    if (state.navMode === "create") {
      if (!state.drawingZone) state.drawingZone = { points: [] };
      if (shouldSnapClose(p)) {
        closeDrawingZone();
        return;
      }
      state.drawingZone.points.push(p);
      renderStage();
    } else {
      state.drawingZone = null;
      state.selectedZonePointIndex = null;
      renderAll();
    }
    return;
  }

  if ((state.mode === "editor" || state.mode === "physics") && state.tool === "select") {
    clearSelection();
    renderAll();
  }
}



function handleStageDblClick(e) {
  if (state.mode !== "editor" || state.tool !== "nav" || state.navMode !== "create" || !state.drawingZone) return;
  e.preventDefault();
  closeDrawingZone();
}


function startSpatialTriggerLoop() {
  stopSpatialTriggerLoop();
  state.spatialTriggerLoop = setInterval(() => {
    if (state.mode !== "play") return;
    evaluateSpatialTriggers();
  }, 120);
}

function stopSpatialTriggerLoop() {
  if (state.spatialTriggerLoop) {
    clearInterval(state.spatialTriggerLoop);
    state.spatialTriggerLoop = null;
  }
}




document.addEventListener("pointerdown", unlockAudioByUserGesture, { passive: true });
document.addEventListener("keydown", unlockAudioByUserGesture, { passive: true });


document.addEventListener("pointerdown", unlockNodeAudioEngine, { passive: true });
document.addEventListener("keydown", unlockNodeAudioEngine, { passive: true });


document.addEventListener("click", e => {
  if (e.target?.id === "audioGraphDebugClearBtn") clearAudioGraphDebug();
});


function testMovePlayerNow() {
  const player = getPlayer();
  if (!player) {
    showMessage("No hay Player en esta escena.");
    return false;
  }
  const foot = computePlayerFootPoint(player);
  movePlayerTo({ x: Math.min(state.project.stage.width - 80, foot.x + 220), y: foot.y });
  return true;
}


function teleportPlayerDomOnly(label = "DOM teleport") {
  const player = getPlayer?.();
  if (!player) {
    showMessage("No hay Player para teleport DOM.");
    return false;
  }

  const el = els.stage?.querySelector?.(`[data-id="${player.id}"]`);
  if (!el) {
    showMessage("No encuentro el elemento DOM del Player.");
    if ($("statusText")) $("statusText").textContent = `DOM teleport: no existe [data-id="${player.id}"]`;
    return false;
  }

  const oldX = Number(player.x || 0);
  const oldY = Number(player.y || 0);
  const x = Math.max(20, Math.min((state.project.stage.width || 1280) - 120, oldX + 240));
  const y = oldY;

  player.x = x;
  player.y = y;

  const flip = player.facing === -1 ? -1 : 1;
  const sc = Number(player.scale || 1);
  el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${sc * flip}, ${sc}) rotate(${Number(player.rotation || 0)}deg)`;
  if (typeof computeVisualDepthZ === "function") el.style.zIndex = String(computeVisualDepthZ(player));
  el.style.outline = "4px solid #ffda50";
  el.style.filter = "drop-shadow(0 0 12px rgba(255,218,80,.95))";
  el.dataset.domTeleported = "1";

  if ($("statusText")) {
    $("statusText").textContent = `${label}: DOM directo ${Math.round(oldX)},${Math.round(oldY)} → ${Math.round(x)},${Math.round(y)} · id=${player.id}`;
  }
  return true;
}



function objectHasRealPlayAction(obj) {
  if (!obj) return false;
  if (obj.type === "background" || obj.type === "player") return false;

  const action = String(obj.action || "none");
  if (action && action !== "none") return true;

  if (obj.useItemEnabled) return true;
  if (obj.pickable || obj.collectible) return true;
  if (obj.gotoSceneId) return true;
  if (obj.message && obj.message.trim() && action === "message") return true;

  return false;
}

function playObjectUnderPointForAction(clientX, clientY, stagePointValue) {
  const list = document.elementsFromPoint ? document.elementsFromPoint(clientX, clientY) : [];
  const scene = currentScene();

  for (const el of list) {
    const objectEl = el?.closest?.(".sceneObject");
    if (!objectEl) continue;

    const obj = scene?.objects?.find(o => o.id === objectEl.dataset.id);
    if (!obj) continue;

    if (obj.type === "background" || obj.type === "player") {
      if ($("statusText")) $("statusText").textContent = `Click objeto ignorado para movimiento: ${obj.type}`;
      continue;
    }

    if (!objectHasRealPlayAction(obj)) {
      if ($("statusText")) $("statusText").textContent = `Click objeto sin acción ignorado: ${obj.name || obj.id}`;
      continue;
    }

    if (typeof shouldObjectReceivePlayClick === "function" && !shouldObjectReceivePlayClick(obj, stagePointValue)) {
      if ($("statusText")) $("statusText").textContent = `Click fuera del collider/alpha de ${obj.name || obj.id}; se usa como suelo.`;
      continue;
    }

    return { obj, el: objectEl };
  }

  return null;
}


function isPlayHardClickUiTarget(target) {
  if (!target) return false;
  if (target.closest?.("#playMoveTestBtn")) return true;
  if (target.closest?.("#playDomTeleportBtn")) return true;
  if (target.closest?.("#gameInventory")) return true;
  if (target.closest?.("#messageBox")) return true;
  if (target.closest?.("#splashScreen")) return true;
  if (target.closest?.(".topbar")) return true;
  if (target.closest?.(".sidebar")) return true;
  if (target.closest?.(".properties")) return true;
  if (target.closest?.(".modal")) return true;
  if (target.closest?.("button,input,select,textarea,label")) return true;
  return false;
}

function pointInsideStageClient(e) {
  if (!els.stage) return false;
  const rect = els.stage.getBoundingClientRect();
  return (
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom
  );
}

function handleDocumentPlayDirectClick(e, source = "document") {
  if (state.mode !== "play") return false;
  if (e.button !== undefined && e.button !== 0) return false;
  if (!pointInsideStageClient(e)) return false;
  if (isPlayHardClickUiTarget(e.target)) return false;

  const p = stagePoint(e);
  showPlayClickMarker?.(p);

  const actionHit = playObjectUnderPointForAction(e.clientX, e.clientY, p);
  if (actionHit?.obj) {
    runObjectAction(actionHit.obj);
    if ($("statusText")) $("statusText").textContent = `Click objeto interactivo: ${actionHit.obj.name || actionHit.obj.id}`;
    return true;
  }

  if ($("statusText")) {
    $("statusText").textContent = `Click suelo gana ${source}: ${Math.round(p.x)},${Math.round(p.y)} → movimiento directo`;
  }

  if (typeof moveAdventurePlayerIndependent === "function") {
    return moveAdventurePlayerIndependent(p, `click suelo ${source}`);
  }

  if (typeof movePlayerTo === "function") {
    movePlayerTo(p);
    return true;
  }

  return false;
}


function bindDocumentPlayDirectClickRouter() {
  if (document._aventuriaDocumentPlayDirectClickRouterBound) return;
  document._aventuriaDocumentPlayDirectClickRouterBound = true;

  let down = null;

  document.addEventListener("pointerdown", e => {
    if (state.mode !== "play") return;
    if (e.button !== undefined && e.button !== 0) return;
    if (!pointInsideStageClient(e)) return;
    if (isPlayHardClickUiTarget(e.target)) return;
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
  }, true);

  document.addEventListener("pointerup", e => {
    if (state.mode !== "play") return;
    if (e.button !== undefined && e.button !== 0) return;
    if (!pointInsideStageClient(e)) return;
    if (isPlayHardClickUiTarget(e.target)) return;

    const moved = down ? Math.hypot(e.clientX - down.x, e.clientY - down.y) : 0;
    down = null;
    if (moved > 12) return;

    const handled = handleDocumentPlayDirectClick(e, "pointerup");
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
    }
  }, true);

  document.addEventListener("click", e => {
    if (state.mode !== "play") return;
    if (!pointInsideStageClient(e)) return;
    if (isPlayHardClickUiTarget(e.target)) return;

    const handled = handleDocumentPlayDirectClick(e, "click");
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
    }
  }, true);
}


function bindRawPlayStageEventSniffer() {
  if (document._aventuriaRawPlayStageEventSnifferBound) return;
  document._aventuriaRawPlayStageEventSnifferBound = true;

  ["pointerdown", "pointerup", "click"].forEach(type => {
    document.addEventListener(type, e => {
      if (state.mode !== "play") return;
      if (!els.stage) return;
      const rect = els.stage.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (!inside) return;

      const t = e.target;
      const desc = `${t?.tagName || "?"}${t?.id ? "#" + t.id : ""}${t?.className ? "." + String(t.className).replace(/\s+/g, ".").slice(0,80) : ""}`;
      console.log(`[AventurIA raw ${type}]`, desc, e.clientX, e.clientY);

      if (type === "pointerdown" && $("statusText")) {
        $("statusText").textContent = `RAW ${type}: target=${desc}`;
      }
    }, true);
  });
}
