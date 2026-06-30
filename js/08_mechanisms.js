// AventurIA v54 Modular Base — 08_mechanisms.js
// Extraído de v53 funcional. Script clásico global; el orden de carga importa.

function defaultMechanismData(type) {
  return {
    selectedElementId: "",
    elements: [],
    rules: [{ id: uid(), name: "Resolver", conditions: [], actions: [{ type: "solve" }] }],
    sequence: [],
    solution: []
  };
}
function mechanismElement(name,type,x,y,extra={}){return{id:uid(),name,type,x,y,value:extra.value??0,states:extra.states??2,rotation:extra.rotation??0,tags:extra.tags??[],accepts:extra.accepts??[],filledBy:extra.filledBy??"",imageId:extra.imageId??""};}
function makeMechanism(type="generic"){
  const m={id:uid(),name:`Mecanismo ${state.project.mechanisms.length+1}`,type,solvedMessage:"Mecanismo resuelto.",unlockObjectId:"",closeOnSolved:true,solved:false,data:defaultMechanismData(type)};
  if(type==="stateMachine"){m.data.elements=[mechanismElement("Palanca A","state",120,120,{value:0,states:4}),mechanismElement("Palanca B","state",300,120,{value:0,states:4})];m.data.rules[0].conditions=[{type:"elementValue",elementName:"Palanca A",value:2},{type:"elementValue",elementName:"Palanca B",value:1}];}
  if(type==="connection"){m.data.elements=[mechanismElement("Entrada","connection",100,160,{value:0,states:4}),mechanismElement("Tubo","connection",260,160,{value:1,states:4}),mechanismElement("Salida","connection",420,160,{value:0,states:4})];m.data.rules[0].conditions=[{type:"allConnectionsAligned"}];}
  if(type==="sequence"){m.data.elements=[mechanismElement("A","sequence",120,160),mechanismElement("B","sequence",240,160),mechanismElement("C","sequence",360,160)];m.data.solution=["A","B","C","A"];m.data.rules[0].conditions=[{type:"sequenceEquals",value:["A","B","C","A"]}];}
  if(type==="slots"){m.data.elements=[mechanismElement("Slot A","slot",140,180,{accepts:["piezaA"]}),mechanismElement("Pieza A","position",340,180,{tags:["piezaA"]})];m.data.rules[0].conditions=[{type:"slotFilled",elementName:"Slot A",value:"piezaA"}];}
  return m;
}
function selectedMechanism(){return(state.project.mechanisms||[]).find(m=>m.id===state.selectedMechanismId)||null;}
function selectedMechanismElement(){const m=selectedMechanism();return m?((m.data.elements||[]).find(e=>e.id===m.data.selectedElementId)||null):null;}
function createMechanism(){const m=makeMechanism($("mechanismType")?.value||"generic");state.project.mechanisms.push(m);state.selectedMechanismId=m.id;renderMechanisms();}
function deleteSelectedMechanism(){if(!state.selectedMechanismId)return;state.project.mechanisms=state.project.mechanisms.filter(m=>m.id!==state.selectedMechanismId);state.selectedMechanismId=state.project.mechanisms[0]?.id||null;renderMechanisms();}
function addMechanismElement(){const m=selectedMechanism();if(!m)return;m.data.elements??=[];const el=mechanismElement(`Elemento ${m.data.elements.length+1}`,"state",160+m.data.elements.length*24,140+m.data.elements.length*24);m.data.elements.push(el);m.data.selectedElementId=el.id;renderMechanisms();}
function deleteMechanismElement(){const m=selectedMechanism(),el=selectedMechanismElement();if(!m||!el)return;m.data.elements=m.data.elements.filter(e=>e.id!==el.id);m.data.selectedElementId="";renderMechanisms();}
function addMechanismRule(){const m=selectedMechanism();if(!m)return;m.data.rules??=[];m.data.rules.push({id:uid(),name:`Regla ${m.data.rules.length+1}`,conditions:[],actions:[{type:"solve"}]});renderMechanisms();}
function renderMechanisms(){
  const list=$("mechanismList");if(!list)return;list.innerHTML="";
  (state.project.mechanisms||[]).forEach(m=>{const li=document.createElement("li");li.className=m.id===state.selectedMechanismId?"selected":"";li.innerHTML=`<span>${m.name}</span><small>${m.type}${m.solved?" ✓":""}</small>`;li.onclick=()=>{state.selectedMechanismId=m.id;renderMechanisms();};list.appendChild(li);});
  const m=selectedMechanism();if(!m){$("mechanismCanvas").innerHTML="<p class='hint'>Crea o selecciona un mecanismo.</p>";return;}
  m.data??=defaultMechanismData(m.type);m.data.elements??=[];m.data.rules??=[];
  $("mechanismName").value=m.name;$("mechanismType").value=m.type;$("mechanismSolvedMessage").value=m.solvedMessage||"";$("mechanismCloseOnSolved").checked=!!m.closeOnSolved;
  fillSelect($("mechanismUnlockObject"),currentScene()?.objects||[],"Sin objeto");$("mechanismUnlockObject").value=m.unlockObjectId||"";
  $("mechanismRulesJson").value=JSON.stringify({rules:m.data.rules,sequence:m.data.sequence,solution:m.data.solution},null,2);
  renderMechanismElementProps();renderMechanismCanvas(m,$("mechanismCanvas"),false);
}
function renderMechanismElementProps() {
  const el = selectedMechanismElement();
  ["mechanismElementName","mechanismElementType","mechanismElementValue","mechanismElementStates","mechanismElementX","mechanismElementY","mechanismElementTags","mechanismElementImage"].forEach(id => {
    if ($(id)) $(id).disabled = !el;
  });

  if ($("mechanismElementImage")) {
    fillSelect($("mechanismElementImage"), state.project.assets.images || [], "Sin imagen");
  }

  if (!el) {
    if ($("mechanismElementName")) $("mechanismElementName").value = "";
    if ($("mechanismElementTags")) $("mechanismElementTags").value = "";
    if ($("mechanismElementImage")) $("mechanismElementImage").value = "";
    return;
  }

  $("mechanismElementName").value = el.name || "";
  $("mechanismElementType").value = el.type || "state";
  $("mechanismElementValue").value = el.value ?? 0;
  $("mechanismElementStates").value = el.states ?? 2;
  $("mechanismElementX").value = el.x ?? 0;
  $("mechanismElementY").value = el.y ?? 0;
  $("mechanismElementTags").value = [...(el.tags || []), ...(el.accepts || [])].join(",");
  if ($("mechanismElementImage")) $("mechanismElementImage").value = el.imageId || "";
}
function updateSelectedMechanismField(field,value){const m=selectedMechanism();if(!m)return;m[field]=value;if(field==="type"){const fresh=makeMechanism(value);m.data=fresh.data;}renderMechanisms();}
function updateSelectedMechanismElement(field, value) {
  const el = selectedMechanismElement();
  if (!el) return;

  if (field === "tags") {
    const parts = String(value || "").split(",").map(s => s.trim()).filter(Boolean);
    if (el.type === "slot") el.accepts = parts;
    else el.tags = parts;
  } else if (["value","states","x","y","rotation"].includes(field)) {
    el[field] = Number(value) || 0;
  } else {
    el[field] = value;
  }

  renderMechanisms();
}
function renderMechanismCanvas(m, container, runtime = false) {
  container.innerHTML = "";

  (m.data.elements || []).forEach(el => {
    const div = document.createElement("div");
    div.className = `mechanismElement ${el.id === m.data.selectedElementId ? "selected" : ""}`;
    div.style.left = `${el.x || 0}px`;
    div.style.top = `${el.y || 0}px`;

    div.innerHTML = `<strong>${el.name}</strong><small>${el.type}</small><br><small>valor: ${displayMechanismValue(el)}</small>`;

    const elAsset = imageAssetById(el.imageId);
    if (elAsset?.dataUrl) {
      const img = document.createElement("img");
      img.className = "mechanismElementImg";
      img.src = elAsset.dataUrl;
      div.insertBefore(img, div.children[2] || null);
    }

    if (runtime && el.type === "slot") {
      div.classList.add("dropSlot");
      div.ondragover = e => e.preventDefault();
      div.ondrop = e => {
        e.preventDefault();
        e.stopPropagation();
        const objectId = e.dataTransfer.getData("inventoryObjectId") || e.dataTransfer.getData("text/plain");
        const obj = findObjectInAnyScene(objectId).obj;
        const key = objectInventoryKey(obj);
        const accepts = el.accepts || [];
        if (!obj || (accepts.length && !accepts.includes(key) && !accepts.includes(obj.name))) {
          showMessage("Esa pieza no encaja aquí.");
          return;
        }

        el.filledBy = accepts.includes(key) ? key : obj.name;
        const idx = state.inventory.indexOf(objectId);
        if (idx >= 0) state.inventory.splice(idx, 1);
        state.selectedInventoryItemId = null;
        renderInventory();
        evaluateMechanism(m);
        renderMechanismCanvas(m, container, runtime);
      };
    }

    if (el.type === "state" || el.type === "connection") {
      const step = document.createElement("div");
      step.className = "stateStepper";
      const dec = document.createElement("button");
      const inc = document.createElement("button");
      dec.textContent = "−";
      inc.textContent = "+";
      dec.onclick = e => { e.stopPropagation(); changeMechanismElementValue(m, el, -1); };
      inc.onclick = e => { e.stopPropagation(); changeMechanismElementValue(m, el, 1); };
      step.append(dec, inc);
      div.appendChild(step);
    }

    div.onclick = () => {
      m.data.selectedElementId = el.id;
      if (runtime && el.type === "sequence") {
        m.data.sequence ??= [];
        m.data.sequence.push(el.name);
        evaluateMechanism(m);
      }
      renderMechanisms();
      if (runtime) renderMechanismCanvas(m, container, runtime);
    };

    if (!runtime) enableMechanismElementDragging(div, m, el);
    container.appendChild(div);
  });
}
function displayMechanismValue(el){if(el.type==="slot")return el.filledBy||"vacío";if(el.type==="position")return`x:${Math.round(el.x)} y:${Math.round(el.y)} r:${el.rotation||0}`;return el.value??0;}
function changeMechanismElementValue(m,el,delta){const max=Math.max(1,Number(el.states||2));el.value=((Number(el.value||0)+delta)%max+max)%max;evaluateMechanism(m);renderMechanisms();}
function enableMechanismElementDragging(div,m,el){div.addEventListener("mousedown",ev=>{ev.preventDefault();ev.stopPropagation();m.data.selectedElementId=el.id;const sx=ev.clientX,sy=ev.clientY,ox=el.x||0,oy=el.y||0;function move(e){el.x=ox+e.clientX-sx;el.y=oy+e.clientY-sy;div.style.left=`${el.x}px`;div.style.top=`${el.y}px`;}function up(){document.removeEventListener("mousemove",move);document.removeEventListener("mouseup",up);renderMechanisms();}document.addEventListener("mousemove",move);document.addEventListener("mouseup",up);});}
function evaluateMechanism(m){for(const rule of(m.data.rules||[])){const ok=(rule.conditions||[]).every(c=>evaluateMechanismCondition(m,c));if(ok)(rule.actions||[]).forEach(a=>runMechanismAction(m,a));}}
function evaluateMechanismCondition(m,c){const els=m.data.elements||[];if(c.type==="elementValue"){const el=els.find(e=>e.name===c.elementName||e.id===c.elementId);return el&&Number(el.value)===Number(c.value);}if(c.type==="sequenceEquals"){const seq=m.data.sequence||[],target=c.value||m.data.solution||[];return target.length&&target.every((v,i)=>seq[i]===v);}if(c.type==="slotFilled"){const el=els.find(e=>e.name===c.elementName||e.id===c.elementId);return el&&el.filledBy===c.value;}if(c.type==="allConnectionsAligned")return els.filter(e=>e.type==="connection").every(e=>Number(e.value||0)===0);return false;}
function runMechanismAction(m,a){if(a.type==="solve")solveMechanism(m);if(a.type==="setElementValue"){const el=(m.data.elements||[]).find(e=>e.name===a.elementName||e.id===a.elementId);if(el)el.value=a.value;}}
function solveMechanism(m){if(m.solved)return;m.solved=true;showMessage(m.solvedMessage||"Mecanismo resuelto.");const obj=currentScene()?.objects.find(o=>o.id===m.unlockObjectId);if(obj){obj.visible=true;obj.state="default";state.runtimeStates[obj.id]="default";}if(m.closeOnSolved)setTimeout(()=>closeMechanismRuntime(),700);}
function openMechanismRuntime(id){const m=(state.project.mechanisms||[]).find(m=>m.id===id);if(!m)return false;els.mechanismRuntime.classList.remove("hidden");els.mechanismRuntime.innerHTML=`<div class="mechanismRuntimeHeader"><strong>${m.name}</strong><button id="closeMechanismRuntimeBtn">Cerrar</button></div><div id="mechanismRuntimeCanvas" class="mechanismCanvas"></div>`;$("closeMechanismRuntimeBtn").onclick=closeMechanismRuntime;renderMechanismCanvas(m,$("mechanismRuntimeCanvas"),true);return true;}
function closeMechanismRuntime(){els.mechanismRuntime.classList.add("hidden");els.mechanismRuntime.innerHTML="";}
