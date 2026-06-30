// AventurIA Beta 0.5.7 — módulo opcional de diagnóstico Audio/Grafo
// Para activarlo, añadir esta línea al final de index.html, DESPUÉS de 10_bindings_main.js:
// <script src="js/99_audio_graph_debug_optional.js"></script>

(function () {
  window.AVENTURIA_DEBUG_AUDIO = true;

  function $(id) {
    return document.getElementById(id);
  }

  function ensureAudioGraphDebugPanel() {
    let panel = $("audioGraphDebugPanel");
    if (panel) return panel;

    const style = document.createElement("style");
    style.textContent = `
      .audioGraphDebugPanel {
        position: fixed;
        left: 12px;
        bottom: 38px;
        width: min(560px, calc(100vw - 24px));
        max-height: 220px;
        background: rgba(6, 10, 18, 0.96);
        color: #d9f2ff;
        border: 1px solid rgba(120, 190, 255, 0.45);
        border-radius: 10px;
        z-index: 99999;
        font-size: 12px;
        box-shadow: 0 12px 38px rgba(0,0,0,.45);
        overflow: hidden;
        display: block;
        pointer-events: auto;
      }
      .audioGraphDebugPanel.hidden { display: none; }
      .audioGraphDebugHeader {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        padding: 7px 9px;
        background: rgba(255,255,255,.09);
        border-bottom: 1px solid rgba(255,255,255,.14);
      }
      .audioGraphDebugActions {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .audioGraphDebugHeader button {
        font-size: 11px;
        padding: 4px 8px;
      }
      #audioGraphDebugLog {
        margin: 0;
        padding: 8px;
        max-height: 165px;
        overflow: auto;
        white-space: pre-wrap;
        font-family: Consolas, Monaco, monospace;
        line-height: 1.35;
      }
    `;
    document.head.appendChild(style);

    panel = document.createElement("div");
    panel.id = "audioGraphDebugPanel";
    panel.className = "audioGraphDebugPanel";
    panel.innerHTML = `
      <div class="audioGraphDebugHeader">
        <strong>Audio / grafo</strong>
        <div class="audioGraphDebugActions">
          <button id="audioGraphDebugRunBtn" type="button">Diagnóstico audio escena</button>
          <button id="audioGraphDebugClearBtn" type="button">Limpiar</button>
          <button id="audioGraphDebugHideBtn" type="button">Ocultar</button>
        </div>
      </div>
      <pre id="audioGraphDebugLog"></pre>
    `;
    document.body.appendChild(panel);
    return panel;
  }

  window.audioGraphDebug = function audioGraphDebug(message) {
    const text = `[${new Date().toLocaleTimeString()}] ${message}`;
    console.log("[AventurIA AudioGraph]", message);

    const panel = ensureAudioGraphDebugPanel();
    const log = $("audioGraphDebugLog");
    if (panel && log) {
      panel.classList.remove("hidden");
      log.textContent += text + "\n";
      log.scrollTop = log.scrollHeight;
    }

    const status = $("statusText");
    if (status) status.textContent = message;
  };

  window.clearAudioGraphDebug = function clearAudioGraphDebug() {
    const log = $("audioGraphDebugLog");
    if (log) log.textContent = "";
  };

  document.addEventListener("click", e => {
    if (e.target?.id === "audioGraphDebugRunBtn" && typeof window.diagnoseSceneStartAudioGraph === "function") {
      window.diagnoseSceneStartAudioGraph();
    }
    if (e.target?.id === "audioGraphDebugClearBtn") {
      window.clearAudioGraphDebug();
    }
    if (e.target?.id === "audioGraphDebugHideBtn") {
      $("audioGraphDebugPanel")?.classList.add("hidden");
    }
  });

  console.info("[AventurIA] Diagnóstico Audio/Grafo activado.");
})();
