let ING=[], FOOD=[];
const state=JSON.parse(localStorage.getItem("skyrimState")||'{"ing":{},"food":{}}');
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

async function init(){
  ING=await (await fetch("data/ingredients_fr.json")).json();
  FOOD=await (await fetch("data/recipes_cuisine_fr.json")).json();
  ING.forEach(x=>x.qty=Number(state.ing[x.nom]||0));
  FOOD.forEach(x=>x.fait=!!state.food[x.nom]);
  fillPickers(); renderAll();
}
function save(){state.ing={};ING.forEach(x=>state.ing[x.nom]=x.qty);state.food={};FOOD.forEach(x=>state.food[x.nom]=x.fait);localStorage.setItem("skyrimState",JSON.stringify(state));}
function nav(id){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===id));window.scrollTo(0,0)}
document.addEventListener("click",e=>{let b=e.target.closest("[data-page]");if(b)nav(b.dataset.page)});
function fillPickers(){["a1","a2","a3"].forEach(id=>{let s=$("#"+id);ING.forEach(x=>{let o=document.createElement("option");o.value=x.nom;o.textContent=x.nom;s.appendChild(o)})})}
function mix(){
 const names=["a1","a2","a3"].map(id=>$("#"+id).value).filter(Boolean);
 const chosen=names.map(n=>ING.find(x=>x.nom===n)); if(chosen.length<2){$("#mixResult").textContent="Sélectionne au moins 2 ingrédients.";return}
 let common=chosen.map(x=>new Set(x.effets)).reduce((a,b)=>new Set([...a].filter(v=>b.has(v))));
 let r=$("#mixResult");r.className="result";
 r.innerHTML="<b>"+chosen.map(x=>esc(x.nom)).join(" + ")+"</b><br><br>"+(common.size?"Effets communs :<div class='effects'>"+[...common].map(x=>"<span class='pill'>"+esc(x)+"</span>").join("")+"</div>":"Aucun effet commun pour cette combinaison.");
 $("#statMix").textContent=common.size?common.size+" effet(s)":"Aucun";
}
function renderFood(){
 let q=$("#foodSearch").value.toLowerCase(), st=$("#foodStation").value, so=$("#foodSource").value;
 let arr=FOOD.filter(x=>(!q||(x.nom+" "+x.ingredients.join(" ")+" "+x.effet).toLowerCase().includes(q))&&(!st||x.station===st)&&(!so||x.source===so));
 $("#foodList").innerHTML=arr.map(x=>`<article class="item"><div class="item-top"><h3>${esc(x.nom)}</h3><span class="badge">${esc(x.station)}</span></div><p>${esc(x.ingredients.join(" • "))}</p><p>${esc(x.effet)}</p><button class="primary" data-food="${esc(x.nom)}">${x.fait?"☑ Fabriquée":"☐ Marquer comme fabriquée"}</button></article>`).join("")||"<div class='result empty'>Aucune recette trouvée.</div>";
}
function renderIng(){
 let q=$("#ingSearch").value.toLowerCase(),so=$("#ingSource").value;
 let arr=ING.filter(x=>(!q||(x.nom+" "+x.effets.join(" ")).toLowerCase().includes(q))&&(!so||x.source===so));
 $("#ingList").innerHTML=arr.map(x=>`<article class="item"><div class="item-top"><h3>${esc(x.nom)}</h3><span class="badge">${esc(x.source)}</span></div><div class="effects">${x.effets.map(e=>`<span class="pill">${esc(e)}</span>`).join("")}</div><div class="counter"><button data-dec="${esc(x.nom)}">−</button><strong>${x.qty}</strong><button data-inc="${esc(x.nom)}">+</button><small class="muted">dans ton inventaire</small></div></article>`).join("");
}
function renderEffects(){
 let q=$("#effectSearch").value.toLowerCase();
 let effects=[...new Set(ING.flatMap(x=>x.effets))].filter(x=>!q||x.toLowerCase().includes(q)).sort();
 $("#effectList").innerHTML=effects.map(e=>`<button data-effect="${esc(e)}">${esc(e)}</button>`).join("");
}
function renderCollection(){
 let a=ING.filter(x=>x.qty>0).length,b=FOOD.filter(x=>x.fait).length,total=ING.length+FOOD.length,done=a+b,p=total?Math.round(done/total*100):0;
 $("#pct").textContent=p+"%";$("#progressText").textContent=`${done} / ${total} éléments suivis`;
 $(".ring").style.background=`conic-gradient(var(--gold) ${p*3.6}deg,#263139 0deg)`;
 $("#collectionStats").innerHTML=`<article><b>${a}/${ING.length}</b><small>ingrédients avec stock</small></article><article><b>${b}/${FOOD.length}</b><small>recettes fabriquées</small></article>`;
}
function renderAll(){renderFood();renderIng();renderEffects();renderCollection();$("#statIng").textContent=ING.filter(x=>x.qty>0).length+" / "+ING.length;$("#statFood").textContent=FOOD.filter(x=>x.fait).length+" / "+FOOD.length}
document.addEventListener("click",e=>{
 let b=e.target.closest("[data-inc]");if(b){let x=ING.find(x=>x.nom===b.dataset.inc);x.qty++;save();renderAll()}
 b=e.target.closest("[data-dec]");if(b){let x=ING.find(x=>x.nom===b.dataset.dec);x.qty=Math.max(0,x.qty-1);save();renderAll()}
 b=e.target.closest("[data-food]");if(b){let x=FOOD.find(x=>x.nom===b.dataset.food);x.fait=!x.fait;save();renderAll()}
 b=e.target.closest("[data-effect]");if(b){$("#effectSearch").value=b.dataset.effect;document.querySelector('[data-page="alchemy"]').click();renderEffects()}
});
["foodSearch","foodStation","foodSource"].forEach(id=>$( "#"+id).addEventListener("input",renderFood));
["ingSearch","ingSource"].forEach(id=>$( "#"+id).addEventListener("input",renderIng));
$("#effectSearch").addEventListener("input",renderEffects);$("#mixBtn").addEventListener("click",mix);
$("#resetBtn").addEventListener("click",()=>{if(confirm("Réinitialiser toute la progression ?")){localStorage.removeItem("skyrimState");location.reload()}});
$("#themeBtn").addEventListener("click",()=>document.body.classList.toggle("light"));
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
init();
