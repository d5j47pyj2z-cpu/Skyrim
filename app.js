let ING=[], FOOD=[];
const state=JSON.parse(localStorage.getItem("skyrimState")||'{"ing":{},"food":{}}');
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

async function init(){
  try{
    ING=await (await fetch("data/ingredients_fr.json")).json();
    FOOD=await (await fetch("data/recipes_cuisine_fr.json")).json();
    ING.forEach(x=>x.qty=Number(state.ing[x.nom]||0));
    FOOD.forEach(x=>x.fait=!!state.food[x.nom]);
    fillPickers();
    renderAll();
  }catch(e){
    console.error(e);
    document.querySelector("main").innerHTML='<div class="panel"><h2>Erreur de chargement</h2><p class="muted">Impossible de charger les données. Vérifie que le dossier <b>data</b> est bien présent dans GitHub.</p></div>';
  }
}
function save(){
  state.ing={};
  ING.forEach(x=>state.ing[x.nom]=x.qty);
  state.food={};
  FOOD.forEach(x=>state.food[x.nom]=x.fait);
  localStorage.setItem("skyrimState",JSON.stringify(state));
}
function nav(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));
  document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
  window.scrollTo({top:0,behavior:"smooth"});
}
document.addEventListener("click",e=>{
  const page=e.target.closest("[data-page]");
  if(page){nav(page.dataset.page);return;}
});
function fillPickers(){
  ["a1","a2","a3"].forEach(id=>{
    const s=$("#"+id);
    ING.forEach(x=>{
      const o=document.createElement("option");
      o.value=x.nom;o.textContent=x.nom;s.appendChild(o);
    });
  });
}
function mix(){
  const names=["a1","a2","a3"].map(id=>$("#"+id).value).filter(Boolean);
  const chosen=names.map(n=>ING.find(x=>x.nom===n)).filter(Boolean);
  const r=$("#mixResult");
  if(chosen.length<2){r.textContent="Sélectionne au moins 2 ingrédients.";return;}
  const common=chosen.map(x=>new Set(x.effets)).reduce((a,b)=>new Set([...a].filter(v=>b.has(v))));
  r.className="result";
  r.innerHTML="<b>"+chosen.map(x=>esc(x.nom)).join(" + ")+"</b><br><br>"+
    (common.size?"Effets communs :<div class='effects'>"+[...common].map(x=>"<span class='pill'>"+esc(x)+"</span>").join("")+"</div>":"Aucun effet commun pour cette combinaison.");
  $("#statMix").textContent=common.size?common.size+" effet(s)":"Aucun";
}
function renderFood(){
  const q=$("#foodSearch").value.toLowerCase(), st=$("#foodStation").value, so=$("#foodSource").value;
  const arr=FOOD.filter(x=>(!q||(x.nom+" "+x.ingredients.join(" ")+" "+x.effet).toLowerCase().includes(q))&&(!st||x.station===st)&&(!so||x.source===so));
  $("#foodList").innerHTML=arr.map((x,i)=>`<article class="item">
    <div class="item-top"><h3>${esc(x.nom)}</h3><span class="badge">${esc(x.station)}</span></div>
    <p>${esc(x.ingredients.join(" • "))}</p><p>${esc(x.effet)}</p>
    <button type="button" class="primary food-toggle" data-index="${FOOD.indexOf(x)}">${x.fait?"☑ Fabriquée — cliquer pour retirer":"☐ Marquer comme fabriquée"}</button>
  </article>`).join("")||"<div class='result empty'>Aucune recette trouvée.</div>";
  document.querySelectorAll(".food-toggle").forEach(btn=>btn.addEventListener("click",()=>{
    const x=FOOD[Number(btn.dataset.index)];
    x.fait=!x.fait; save(); renderAll();
  }));
}
function renderIng(){
  const q=$("#ingSearch").value.toLowerCase(),so=$("#ingSource").value;
  const arr=ING.filter(x=>(!q||(x.nom+" "+x.effets.join(" ")).toLowerCase().includes(q))&&(!so||x.source===so));
  $("#ingList").innerHTML=arr.map(x=>`<article class="item">
    <div class="item-top"><h3>${esc(x.nom)}</h3><span class="badge">${esc(x.source)}</span></div>
    <div class="effects">${x.effets.map(e=>`<span class="pill">${esc(e)}</span>`).join("")}</div>
    <div class="counter">
      <button type="button" class="qty-btn" data-action="dec" data-index="${ING.indexOf(x)}" aria-label="Retirer un ${esc(x.nom)}">−</button>
      <strong>${x.qty}</strong>
      <button type="button" class="qty-btn" data-action="inc" data-index="${ING.indexOf(x)}" aria-label="Ajouter un ${esc(x.nom)}">+</button>
      <small class="muted">dans ton inventaire</small>
    </div>
  </article>`).join("");
  document.querySelectorAll(".qty-btn").forEach(btn=>btn.addEventListener("click",()=>{
    const x=ING[Number(btn.dataset.index)];
    if(!x)return;
    if(btn.dataset.action==="inc") x.qty++;
    else x.qty=Math.max(0,x.qty-1);
    save();
    renderAll();
  }));
}
function renderEffects(){
  const q=$("#effectSearch").value.toLowerCase();
  const effects=[...new Set(ING.flatMap(x=>x.effets))].filter(x=>!q||x.toLowerCase().includes(q)).sort();
  $("#effectList").innerHTML=effects.map(e=>`<button type="button" data-effect="${esc(e)}">${esc(e)}</button>`).join("");
}
function renderCollection(){
  const a=ING.filter(x=>x.qty>0).length,b=FOOD.filter(x=>x.fait).length,total=ING.length+FOOD.length,done=a+b,p=total?Math.round(done/total*100):0;
  $("#pct").textContent=p+"%";
  $("#progressText").textContent=`${done} / ${total} éléments suivis`;
  $(".ring").style.background=`conic-gradient(var(--gold) ${p*3.6}deg,#263139 0deg)`;
  $("#collectionStats").innerHTML=`<article><b>${a}/${ING.length}</b><small>ingrédients avec stock</small></article><article><b>${b}/${FOOD.length}</b><small>recettes fabriquées</small></article>`;
}
function renderAll(){
  renderFood();renderIng();renderEffects();renderCollection();
  $("#statIng").textContent=ING.filter(x=>x.qty>0).length+" / "+ING.length;
  $("#statFood").textContent=FOOD.filter(x=>x.fait).length+" / "+FOOD.length;
}
document.addEventListener("click",e=>{
  const effect=e.target.closest("[data-effect]");
  if(effect){
    $("#effectSearch").value=effect.dataset.effect;
    nav("alchemy");renderEffects();
  }
});
["foodSearch","foodStation","foodSource"].forEach(id=>$("#"+id).addEventListener("input",renderFood));
["ingSearch","ingSource"].forEach(id=>$("#"+id).addEventListener("input",renderIng));
$("#effectSearch").addEventListener("input",renderEffects);
$("#mixBtn").addEventListener("click",mix);
$("#resetBtn").addEventListener("click",()=>{
  if(confirm("Réinitialiser toute la progression ?")){
    localStorage.removeItem("skyrimState");location.reload();
  }
});
$("#themeBtn").addEventListener("click",()=>document.body.classList.toggle("light"));
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
init();
