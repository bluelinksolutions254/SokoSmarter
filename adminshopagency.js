/* SOKO Smart admin: Agency > "Shop Applications". Review shops that applied to the Agency (from Shop Manager > Agents Manager), approve / reject / suspend them, and set the commission limits.
   Opened by adminagency.js through window.shopAgencyPanel(el). Needs admin.html globals: sb, $, esc, toast, askConfirm. Run supabase-shop-agency.sql once. */
(()=>{
const dt=d=>d?new Date(d).toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"numeric"}):"—";
const ST={pending:["Waiting","pending"],approved:["In the Agency","approved"],rejected:["Rejected","rejected"],suspended:["Suspended","rejected"]};
const help=m=>/agency_status|schema cache|does not exist|function/i.test(m||"")?"Not set up yet: run supabase-shop-agency.sql in the Supabase SQL editor, then reload. ("+m+")":m;
let L=[],N={},OW={},V={},CFG={},TAB="pending",ERR="",ROOT=null;

async function load(){ERR="";
 const r=await sb.from("shops").select("id,name,owner_id,agency_status,agency_visible,agency_message,agency_note,agency_applied_at,agency_decided_at").neq("agency_status","none").order("agency_applied_at",{ascending:false}).limit(500);
 if(r.error){ERR=help(r.error.message);L=[]}else L=r.data||[];
 const ids=[...new Set(L.map(x=>x.owner_id).filter(Boolean))];OW={};
 if(ids.length){const p=await sb.from("profiles").select("id,full_name").in("id",ids);(p.data||[]).forEach(x=>OW[x.id]=x.full_name)}
 N={};V={};const p2=await sb.from("products").select("id,agency_enabled,owner_id").eq("agency_enabled",true).limit(5000);
 (p2.data||[]).forEach(x=>N[x.owner_id]=(N[x.owner_id]||0)+1);
 try{const c=await sb.from("site_content").select("value").eq("key","agency_settings").maybeSingle();CFG=(c.data&&c.data.value)||{}}catch(e){CFG={}}}

function draw(){const el=ROOT;if(!el)return;const n=k=>L.filter(x=>x.agency_status===k).length,rows=L.filter(x=>TAB==="all"||x.agency_status===TAB);
 const g=(k,d)=>CFG[k]??d;
 el.innerHTML=`<h2 style="margin:0 0 4px">Shop Applications</h2><p class="m" style="margin:0 0 14px">Shops apply from Shop Manager &gt; Agents Manager to have their products promoted by agents. Approve a shop here; it then ticks products and sets a commission for each.</p>
 ${ERR?`<div class="msg" style="margin-bottom:14px">${esc(ERR)}</div>`:""}
 <section class="card" style="margin-bottom:16px"><h2 style="margin:0 0 10px">Rules</h2><form id="sagR" style="display:flex;gap:16px;align-items:flex-end;flex-wrap:wrap">
  <label>Lowest commission a shop may set (%)<input name="mn" type="number" min="0" max="100" step="0.5" value="${g("product_commission_min",1)}" style="width:120px"></label>
  <label>Highest commission (%)<input name="mx" type="number" min="0" max="100" step="0.5" value="${g("product_commission_max",50)}" style="width:120px"></label>
  <label style="display:flex;flex-direction:row;gap:8px;align-items:center;font-weight:600"><input type="checkbox" name="ap" style="width:auto" ${g("shop_approval",true)?"checked":""}> New applications need my approval</label>
  <button class="btn p" data-keep type="submit">Save rules</button></form></section>
 <section class="card"><div class="agc-t" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">${[["pending","Waiting ("+n("pending")+")"],["approved","In the Agency ("+n("approved")+")"],["suspended","Suspended ("+n("suspended")+")"],["rejected","Rejected ("+n("rejected")+")"],["all","All"]].map(t=>`<button type="button" class="btn s ${TAB===t[0]?"p":""}" data-keep data-sat="${t[0]}">${t[1]}</button>`).join("")}</div>
 <div class="wrap"><table style="min-width:720px"><thead><tr><th>Shop</th><th>Owner</th><th>Applied</th><th>Status</th><th>Products</th><th>Actions</th></tr></thead><tbody>${rows.length?rows.map(s=>{const t=ST[s.agency_status]||[s.agency_status,""],a=s.agency_status;return `<tr><td><b>${esc(s.name)}</b>${s.agency_message?`<div class="m">${esc(s.agency_message)}</div>`:""}${s.agency_note?`<div class="m"><b>Note:</b> ${esc(s.agency_note)}</div>`:""}</td><td>${esc(OW[s.owner_id]||"—")}</td><td>${esc(dt(s.agency_applied_at))}</td>
  <td><span class="pill ${t[1]}">${esc(t[0])}</span>${a==="approved"&&!s.agency_visible?'<div class="m">Switched OFF by the shop</div>':""}</td><td>${N[s.owner_id]||0} in Agency</td>
  <td><div class="acts">${a==="pending"?`<button class="btn s" data-keep data-sad="${esc(s.id)}:approve" type="button">Approve</button><button class="btn s d" data-keep data-sad="${esc(s.id)}:reject" type="button">Reject</button>`:""}${a==="approved"?`<button class="btn s d" data-keep data-sad="${esc(s.id)}:suspend" type="button">Suspend</button>`:""}${a==="suspended"?`<button class="btn s" data-keep data-sad="${esc(s.id)}:reinstate" type="button">Reinstate</button>`:""}${a==="rejected"?`<button class="btn s" data-keep data-sad="${esc(s.id)}:approve" type="button">Approve anyway</button>`:""}</div></td></tr>`}).join(""):'<tr><td colspan="6" class="empty">Nothing here.</td></tr>'}</tbody></table></div></section>`}

const note=(title,ok)=>new Promise(res=>{const d=$("#dlg");$("#dc").innerHTML=`<h3 style="margin:0 0 10px">${esc(title)}</h3><form id="sagN" style="display:grid;gap:12px"><label>Reason (the shop will see it)<textarea name="n" rows="3" maxlength="300"></textarea></label><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn" data-keep id="sagNx">Cancel</button><button class="btn p" data-keep>${esc(ok)}</button></div></form>`;
 let done=false;const fin=v=>{if(done)return;done=true;d.close();res(v)};d.addEventListener("close",()=>fin(null),{once:true});
 $("#sagN").onsubmit=e=>{e.preventDefault();fin($("#sagN").n.value.trim())};$("#sagNx").onclick=()=>fin(null);if(!d.open)d.showModal();$("#sagN").n.focus()});

document.addEventListener("click",async e=>{if(!ROOT||!ROOT.isConnected)return;let b;
 if(b=e.target.closest("[data-sat]")){TAB=b.dataset.sat;draw();return}
 if(b=e.target.closest("[data-sad]")){const [id,act]=b.dataset.sad.split(":"),s=L.find(x=>String(x.id)===id);if(!s)return;let nt=null;
  if(act==="reject"||act==="suspend"){nt=await note((act==="reject"?"Reject ":"Suspend ")+s.name+"?",act==="reject"?"Reject":"Suspend");if(nt===null)return}
  else if(!await askConfirm({title:(act==="reinstate"?"Reinstate ":"Approve ")+s.name+"?",msg:"Its ticked products will be visible to agents.",ok:"Yes",danger:false}))return;
  b.disabled=true;const r=await sb.rpc("admin_shop_agency_decide",{p_shop:id,p_action:act,p_note:nt});
  if(r.error){b.disabled=false;toast(help(r.error.message),"error");return}
  toast(act==="reject"?"Rejected.":act==="suspend"?"Shop suspended. Its products are hidden from agents.":"Shop is in the Agency.");await load();draw();if(typeof window.agencyAdmin==="function"&&document.querySelector('[data-agt="shopapps"]')){const b2=document.querySelector('[data-agt="shopapps"]'),n2=L.filter(x=>x.agency_status==="pending").length;b2.textContent="Shop Applications"+(n2?" ("+n2+")":"")}}});
document.addEventListener("submit",async e=>{if(!ROOT||!ROOT.isConnected||e.target.id!=="sagR")return;e.preventDefault();const f=e.target,mn=+f.mn.value,mx=+f.mx.value;
 if(!(mn>=0&&mx<=100&&mn<=mx)){toast("Lowest must not be above highest (0 to 100).","error");return}
 const v={...CFG,product_commission_min:mn,product_commission_max:mx,shop_approval:f.ap.checked};
 const {data,error}=await sb.from("site_content").upsert({key:"agency_settings",value:v,updated_at:new Date().toISOString()},{onConflict:"key"}).select("key");
 if(error||!data||!data.length){toast(error?help(error.message):"Not saved. Check admins may write to site_content.","error");return}CFG=v;toast("Rules saved.")});

window.shopAgencyPanel=async el=>{ROOT=el;el.innerHTML='<p class="m">Loading…</p>';await load();draw()};
})();