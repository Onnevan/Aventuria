
// AventurIA Beta 0.7.65 — Auto Detect Sprite Frame
// Botón único "Ajustar frame": autodetecta columnas/filas cuando es posible y aplica el frame al objeto.

function spriteAutosizeStatus(message, kind = "ok") {
  const el = $("spriteAutoFrameStatus");
  if (!el) {
    if ($("statusText")) $("statusText").textContent = message;
    return;
  }
  el.textContent = message;
  el.classList.remove("ok", "warning");
  el.classList.add(kind === "warning" ? "warning" : "ok");
}

function spriteAutosizeEnsureConfig(obj) {
  if (!obj) return null;
  obj.sprite ??= {
    enabled: false,
    frameWidth: obj.width || 64,
    frameHeight: obj.height || 64,
    columns: 1,
    rows: 1,
    fps: 8,
    currentFrame: 0,
    currentClip: "idle",
    playing: true,
    direction: 1,
    moveClip: "run",
    stopClip: "idle",
    clips: { idle: { from: 0, to: 0, fps: 8, mode: "loop" } }
  };
  obj.sprite.columns = Math.max(1, Number(obj.sprite.columns || 1));
  obj.sprite.rows = Math.max(1, Number(obj.sprite.rows || 1));
  return obj.sprite;
}

function spriteAutosizeCurrentObject() {
  return typeof selectedObject === "function" ? selectedObject() : null;
}

function spriteAutosizeSelectedImageId(obj) {
  const spriteSelect = $("propSpriteImage")?.value || "";
  const objectSelect = $("propImage")?.value || "";
  return spriteSelect || objectSelect || obj?.imageId || state.selectedImageId || "";
}

function spriteAutosizeSelectedAsset(obj) {
  const id = spriteAutosizeSelectedImageId(obj);
  if (!id) return null;
  const asset = typeof imageAssetById === "function" ? imageAssetById(id) : null;
  if (asset && obj) obj.imageId = asset.id;
  return asset;
}

function spriteAutosizeReadImagePixels(asset, callback) {
  if (!asset) {
    callback(null);
    return;
  }

  const src = asset.dataUrl || asset.src || "";
  const storedW = Number(asset.width || asset.naturalWidth || asset.w || 0);
  const storedH = Number(asset.height || asset.naturalHeight || asset.h || 0);

  if (!src && storedW > 0 && storedH > 0) {
    callback({ width: storedW, height: storedH, asset, img: null, canvas: null, ctx: null });
    return;
  }

  if (!src) {
    callback(null);
    return;
  }

  const img = new Image();
  img.onload = () => {
    const width = Number(img.naturalWidth || img.width || storedW || 0);
    const height = Number(img.naturalHeight || img.height || storedH || 0);
    if (!(width > 0 && height > 0)) {
      callback(null);
      return;
    }

    asset.width = width;
    asset.height = height;
    asset.src = asset.src || asset.dataUrl;

    let canvas = null;
    let ctx = null;
    try {
      canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
    } catch (err) {
      canvas = null;
      ctx = null;
    }

    callback({ width, height, asset, img, canvas, ctx });
  };
  img.onerror = () => callback(null);
  img.src = src;
}

function spriteAutosizeColumnOccupancy(ctx, width, height) {
  const data = ctx.getImageData(0, 0, width, height).data;
  const occ = new Array(width).fill(0);
  for (let y = 0; y < height; y++) {
    const row = y * width * 4;
    for (let x = 0; x < width; x++) {
      const a = data[row + x * 4 + 3];
      if (a > 8) occ[x]++;
    }
  }
  return occ;
}

function spriteAutosizeRowOccupancy(ctx, width, height) {
  const data = ctx.getImageData(0, 0, width, height).data;
  const occ = new Array(height).fill(0);
  for (let y = 0; y < height; y++) {
    const row = y * width * 4;
    let count = 0;
    for (let x = 0; x < width; x++) {
      const a = data[row + x * 4 + 3];
      if (a > 8) count++;
    }
    occ[y] = count;
  }
  return occ;
}

function spriteAutosizeEmptyRuns(occ, limit) {
  const threshold = Math.max(1, Math.floor(limit * 0.01));
  const runs = [];
  let start = -1;

  for (let i = 0; i < occ.length; i++) {
    const empty = occ[i] <= threshold;
    if (empty && start < 0) start = i;
    if ((!empty || i === occ.length - 1) && start >= 0) {
      const end = empty && i === occ.length - 1 ? i : i - 1;
      if (end - start + 1 >= 1) runs.push({ start, end, mid: (start + end) / 2, size: end - start + 1 });
      start = -1;
    }
  }

  return runs;
}

function spriteAutosizeCountCellsFromEmptyRuns(size, runs) {
  // Solo separadores internos, no márgenes exteriores.
  const internal = runs.filter(r => r.mid > size * 0.04 && r.mid < size * 0.96);
  if (!internal.length) return 1;

  // Evita ruido: pide separadores más o menos repartidos.
  const mids = internal.map(r => r.mid).sort((a, b) => a - b);
  const gaps = [];
  let prev = 0;
  mids.forEach(m => { gaps.push(m - prev); prev = m; });
  gaps.push(size - prev);

  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const coherent = gaps.filter(g => g > avg * 0.45 && g < avg * 1.75).length / gaps.length;

  return coherent >= 0.75 ? internal.length + 1 : 1;
}

function spriteAutosizeBestDivisor(total, visibleSize, maxCells = 32) {
  // Si el objeto ya tiene un tamaño visible razonable, intenta inferir columnas/filas como imagen/frame.
  const size = Math.max(1, Number(total || 0));
  const frame = Math.max(1, Number(visibleSize || 0));
  if (frame <= 1 || frame >= size) return 1;

  const approx = size / frame;
  const rounded = Math.round(approx);
  if (rounded >= 1 && rounded <= maxCells && Math.abs(approx - rounded) < 0.04) return rounded;
  return 1;
}

function spriteAutosizeDetectGrid(info, obj) {
  const sprite = spriteAutosizeEnsureConfig(obj);
  const width = info.width;
  const height = info.height;

  const manualCols = Math.max(1, Number($("propSpriteCols")?.value || sprite.columns || 1));
  const manualRows = Math.max(1, Number($("propSpriteRows")?.value || sprite.rows || 1));
  const manualLooksIntentional = manualCols > 1 || manualRows > 1;

  if (manualLooksIntentional) {
    return {
      columns: manualCols,
      rows: manualRows,
      method: "manual",
      confidence: 1
    };
  }

  let cols = 1;
  let rows = 1;
  let method = "fallback";
  let confidence = 0;

  // Método 1: separadores transparentes.
  if (info.ctx) {
    try {
      const colOcc = spriteAutosizeColumnOccupancy(info.ctx, width, height);
      const rowOcc = spriteAutosizeRowOccupancy(info.ctx, width, height);
      const colRuns = spriteAutosizeEmptyRuns(colOcc, height);
      const rowRuns = spriteAutosizeEmptyRuns(rowOcc, width);
      const detectedCols = spriteAutosizeCountCellsFromEmptyRuns(width, colRuns);
      const detectedRows = spriteAutosizeCountCellsFromEmptyRuns(height, rowRuns);

      if (detectedCols > 1 || detectedRows > 1) {
        cols = Math.max(1, detectedCols);
        rows = Math.max(1, detectedRows);
        method = "transparencia";
        confidence = 0.85;
      }
    } catch (err) {}
  }

  // Método 2: tamaño visible actual del objeto, si la hoja completa está asignada y el objeto conserva frame previo.
  if (cols === 1 && rows === 1) {
    const byW = spriteAutosizeBestDivisor(width, obj.width || sprite.frameWidth || 0);
    const byH = spriteAutosizeBestDivisor(height, obj.height || sprite.frameHeight || 0);
    if (byW > 1 || byH > 1) {
      cols = byW;
      rows = byH;
      method = "tamaño actual";
      confidence = 0.65;
    }
  }

  // Método 3: si no hay evidencia, conserva 1×1 y obliga a que el usuario pueda corregir.
  return { columns: cols, rows, method, confidence };
}

function spriteAutosizeApplyFrame(obj, imageWidth, imageHeight, grid, { fitObject = true } = {}) {
  if (!obj) return null;
  const sprite = spriteAutosizeEnsureConfig(obj);

  const cols = Math.max(1, Number(grid?.columns || 1));
  const rows = Math.max(1, Number(grid?.rows || 1));

  const exactW = Number(imageWidth) / cols;
  const exactH = Number(imageHeight) / rows;
  const frameW = Math.max(1, Math.round(exactW));
  const frameH = Math.max(1, Math.round(exactH));

  sprite.enabled = true;
  sprite.columns = cols;
  sprite.rows = rows;
  sprite.frameWidth = frameW;
  sprite.frameHeight = frameH;

  if (fitObject !== false) {
    obj.width = frameW;
    obj.height = frameH;
  }

  if ($("propSpriteEnabled")) $("propSpriteEnabled").checked = true;
  if ($("propFrameW")) $("propFrameW").value = frameW;
  if ($("propFrameH")) $("propFrameH").value = frameH;
  if ($("propSpriteCols")) $("propSpriteCols").value = cols;
  if ($("propSpriteRows")) $("propSpriteRows").value = rows;
  if ($("propW")) $("propW").value = obj.width;
  if ($("propH")) $("propH").value = obj.height;
  if ($("propImage")) $("propImage").value = obj.imageId || "";
  if ($("propSpriteImage")) $("propSpriteImage").value = obj.imageId || "";

  if (typeof normalizePathFootprint === "function") normalizePathFootprint(obj);
  if (typeof normalizeCollider === "function") normalizeCollider(obj);
  if (typeof renderStage === "function") renderStage();

  const rounded = (Number.isInteger(exactW) && Number.isInteger(exactH))
    ? ""
    : ` · redondeado desde ${exactW.toFixed(2)} × ${exactH.toFixed(2)}`;

  const method = grid?.method || "manual";
  const certainty = grid?.confidence >= 0.8 ? "alta" : grid?.confidence >= 0.55 ? "media" : "baja";
  const prefix = method === "fallback"
    ? "Frame ajustado sin autodetección fiable"
    : `Frame ajustado (${method}, confianza ${certainty})`;

  spriteAutosizeStatus(`${prefix}: ${frameW} × ${frameH}px · ${cols} col. × ${rows} filas. Imagen ${imageWidth} × ${imageHeight}px${rounded}.`, method === "fallback" ? "warning" : "ok");

  return { frameWidth: frameW, frameHeight: frameH, imageWidth, imageHeight, columns: cols, rows, method };
}

function spriteAutosizeRunAuto({ fitObject = true } = {}) {
  const obj = spriteAutosizeCurrentObject();
  if (!obj) {
    spriteAutosizeStatus("Selecciona primero un objeto.", "warning");
    return false;
  }

  const asset = spriteAutosizeSelectedAsset(obj);
  if (!asset) {
    spriteAutosizeStatus("Selecciona una imagen en Imagen spritesheet, Imagen del objeto o en Assets > Imágenes.", "warning");
    return false;
  }

  spriteAutosizeEnsureConfig(obj);
  obj.sprite.enabled = true;
  obj.imageId = asset.id;

  if ($("propImage")) $("propImage").value = asset.id;
  if ($("propSpriteImage")) $("propSpriteImage").value = asset.id;
  if ($("propSpriteEnabled")) $("propSpriteEnabled").checked = true;

  spriteAutosizeStatus(`Analizando spritesheet: ${asset.name || asset.id}…`, "warning");

  spriteAutosizeReadImagePixels(asset, info => {
    if (!info) {
      spriteAutosizeStatus(`No se pudo leer la resolución de la imagen "${asset.name || asset.id}".`, "warning");
      return;
    }

    const grid = spriteAutosizeDetectGrid(info, obj);
    spriteAutosizeApplyFrame(obj, info.width, info.height, grid, { fitObject });
  });

  return true;
}

function spriteAutosizeFitObjectToCurrentFrame() {
  const obj = spriteAutosizeCurrentObject();
  if (!obj) {
    spriteAutosizeStatus("Selecciona primero un objeto.", "warning");
    return false;
  }
  const sprite = spriteAutosizeEnsureConfig(obj);
  const fw = Math.max(1, Number(sprite.frameWidth || $("propFrameW")?.value || obj.width || 64));
  const fh = Math.max(1, Number(sprite.frameHeight || $("propFrameH")?.value || obj.height || 64));
  sprite.enabled = true;
  sprite.frameWidth = fw;
  sprite.frameHeight = fh;
  obj.width = fw;
  obj.height = fh;

  if ($("propSpriteEnabled")) $("propSpriteEnabled").checked = true;
  if ($("propFrameW")) $("propFrameW").value = fw;
  if ($("propFrameH")) $("propFrameH").value = fh;
  if ($("propW")) $("propW").value = fw;
  if ($("propH")) $("propH").value = fh;

  if (typeof normalizePathFootprint === "function") normalizePathFootprint(obj);
  if (typeof normalizeCollider === "function") normalizeCollider(obj);
  if (typeof renderStage === "function") renderStage();

  spriteAutosizeStatus(`Objeto ajustado al frame actual: ${fw} × ${fh}px.`, "ok");
  return true;
}

function bindSpriteAutosizeHardWire() {
  if (state._spriteAutosizeHardWireBound) return;
  state._spriteAutosizeHardWireBound = true;

  document.addEventListener("click", e => {
    const target = e.target?.closest?.("#spriteAutoFrameBtn, #spriteAutoFrameAndFitBtn, #spriteFitObjectToFrameBtn");
    if (!target) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation?.();

    if (target.id === "spriteFitObjectToFrameBtn") {
      spriteAutosizeFitObjectToCurrentFrame();
      return;
    }

    spriteAutosizeRunAuto({ fitObject: true });
  }, true);
}

bindSpriteAutosizeHardWire();
