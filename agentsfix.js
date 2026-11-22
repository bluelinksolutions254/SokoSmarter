/* SOKO Smart agents: adds a label to every table cell so tables can show as cards on phones (no sideways scroll). */
(()=>{
const fix=t=>{const h=[...t.querySelectorAll("thead th")].map(x=>(x.textContent||"").trim());if(!h.length)return;
 t.querySelectorAll("tbody tr").forEach(r=>[...r.children].forEach((c,i)=>{if(c.tagName==="TD"&&!c.hasAttribute("data-label"))c.setAttribute("data-label",h[i]||"")}))};
const all=()=>document.querySelectorAll(".tw table").forEach(fix);
let q=0;new MutationObserver(()=>{if(!q)q=requestAnimationFrame(()=>{q=0;all()})}).observe(document.documentElement,{childList:true,subtree:true});
all();
})();