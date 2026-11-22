/* SOKO Smart Shop Manager: "Agents Manager" (apply to the Agency, ON/OFF toggle, per-product commission).
   Needs soko.js globals (sb, $, esc, toast, user) and supabase-shop-agency.sql.
   1) <script src="shopagency.js"></script> on the Shop Manager page.
   2) Agents Manager tab:   ShopAgency.mount(document.querySelector("#YOUR_TAB_BOX"), shop)      // shop = the shop row (needs .id)
   3) Add/Edit product form: add ShopAgency.fields(product) inside the form (after await ShopAgency.load(shop.id)),
      then merge ShopAgency.read(form) into the object you insert/update. */
(()=>{
const KES=n=>"KSh "+Number(n||0).toLocaleString("en-KE");
const MSG={not_your_shop:"This is not your shop.",shop_not_approved:"Your shop must be approved first.",already_applied:"You already applied.",not_allowed:"Your shop is not in the Agency.",shop_not_in_agency:"Your shop is not approved for the Agency yet."};
const er=e=>{const m=String(e&&e.message||e),k=Object.keys(MSG).find(x=>m.includes(x));if(k)return MSG[k];const b=m.match(/bad_commission:(\d+\.?\d*):(\d+\.?\d*)/);if(b)return `Commission must be between ${+b[1]}% and ${+b[2]}%.`;
 return /agency_status|agency_enabled|schema cache|does not exist/i.test(m)?"The Agency is not set up yet (run supabase-shop-agency.sql).":m};
let S=null,LIM={min:1,max:50,approval:true},BOX=null,P=[];
const SHOP=()=>S;

async function load(shopId){
 const [a,b]=await Promise.all([sb.from("shops").select("id,name,status,agency_status,agency_visible,agency_message,agency_note").eq("id",shopId).maybeSingle(),sb.rpc("agency_product_limits")]);
 S=a.data||null;if(b.data)LIM=b.data;return S}

if(!document.getElementById("shagcss"))document.head.insertAdjacentHTML("beforeend",`<style id="shagcss">
.sag-c{background:var(--bg,#fff);border:1px solid var(--bd,#f0e4d4);border-radius:14px;padding:18px;margin-bottom:16px}
.sag-c h3{margin:0 0 4px;font-size:18px}.sag-c p{margin:0}
.sag-row{display:flex;gap:14px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.sag-hd{display:flex;gap:14px;align-items:center;min-width:0}
.sag-ic{width:46px;height:46px;border-radius:12px;background:var(--ot,#FFF3E3);color:var(--od,#D9740A);display:grid;place-items:center;flex:none}
.sag-st{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin:16px 0 4px}
.sag-st div{background:var(--bg2,#FFFAF4);border:1px solid var(--bd,#f0e4d4);border-radius:10px;padding:10px 12px;font-size:13.5px;color:var(--mut,#6b625a)}
.sag-st b{display:flex;gap:8px;align-items:center;color:var(--tx,#1d1a16);font-size:14px;margin-bottom:3px}
.sag-st i{width:22px;height:22px;border-radius:50%;background:var(--o,#F58E20);color:#fff;display:grid;place-items:center;font-style:normal;font-size:12px;flex:none}
.sag-c form{display:grid;gap:12px;margin-top:16px;max-width:620px}
.sag-c label,.sag-f label{display:grid;gap:6px;font-size:14px;font-weight:600;color:var(--tx,#1d1a16)}
.sag-c label.sag-sw{display:block}.sag-c .m,.sag-f .m{font-weight:400}
.sag-c input:not([type=checkbox]):not([type=radio]),.sag-c select,.sag-c textarea,.sag-f input:not([type=checkbox]),.sag-f select,.sag-f textarea{width:100%;box-sizing:border-box;border:1px solid var(--bd,#f0e4d4);border-radius:8px;padding:10px 12px;font:inherit;font-weight:400;background:var(--bg,#fff);color:var(--tx,#1d1a16)}
.sag-c input:focus,.sag-c select:focus,.sag-c textarea:focus,.sag-f input:focus{outline:0;border-color:var(--o,#F58E20);box-shadow:0 0 0 3px rgba(245,142,32,.18)}
.sag-tool{display:flex;gap:8px;align-items:center;background:var(--bg2,#FFFAF4);border:1px solid var(--bd,#f0e4d4);border-radius:10px;padding:8px 10px;margin:14px 0 12px;flex-wrap:wrap}
.sag-tool input{width:90px!important}
.sag-sw{position:relative;width:50px;height:28px;flex:none}.sag-sw input{position:absolute;inset:0;opacity:0;width:100%!important;height:100%;margin:0;cursor:pointer;z-index:1;padding:0!important}
.sag-sw i{position:absolute;inset:0;border-radius:14px;background:#c9c2b6;transition:.2s}.sag-sw i:after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:.2s;box-shadow:0 1px 2px rgba(0,0,0,.25)}
.sag-sw input:checked+i{background:var(--g,#0B4A2E)}.sag-sw input:checked+i:after{left:25px}.sag-sw input:focus-visible+i{outline:2px solid var(--o,#F58E20);outline-offset:2px}
.sag-on{display:flex;gap:14px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-top:16px;padding:14px;border-radius:12px;background:var(--gt,#E8F3EC);border:1px solid #cfe5d8}
.sag-w{overflow-x:auto;border:1px solid var(--bd,#f0e4d4);border-radius:12px;margin-top:4px}
.sag-t{width:100%;border-collapse:collapse;min-width:600px;margin:0}.sag-t th,.sag-t td{padding:10px 12px;border-top:1px solid var(--bd,#f0e4d4);text-align:left;vertical-align:middle}
.sag-t thead th{border-top:0;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--mut,#6b625a);background:var(--bg2,#FFFAF4)}
.sag-t input[type=number]{width:96px}.sag-t .th{width:40px;height:40px;border-radius:8px;object-fit:cover;background:var(--ot,#FFF3E3);flex:none}
.sag-pn{display:flex;gap:10px;align-items:center;min-width:0}
.sag-pill{display:inline-block;border-radius:12px;padding:4px 12px;font-size:13px;font-weight:700;background:#fff4e0;color:#8a5a00;white-space:nowrap}
.sag-pill.ok{background:#e3f4ea;color:var(--g,#0B4A2E)}.sag-pill.no{background:#fde8e6;color:var(--r,#b3261e)}
.sag-f{display:grid;gap:10px;border:1px dashed var(--o,#F58E20);background:var(--bg2,#FFFAF4);border-radius:10px;padding:12px 14px}
@media(prefers-reduced-motion:reduce){.sag-sw i,.sag-sw i:after{transition:none}}</style>`);

const pill=s=>({none:["Not in the Agency",""],pending:["Waiting for approval",""],approved:["In the Agency","ok"],rejected:["Not approved","no"],suspended:["Suspended","no"]}[s]||[s,""]);

/* ---------- Agents Manager tab ---------- */
async function mount(el,shop){BOX=el;el.innerHTML='<p class="m">Loading…</p>';
 const id=shop&&shop.id||(S&&S.id);await load(id);if(!S){el.innerHTML='<div class="msg">Shop not found.</div>';return}
 const st=S.agency_status,[lab,cls]=pill(st);
 const IC='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.8.7 2.8 2.4 3 5.2"/></svg>';
 let h=`<div class="sag-c"><div class="sag-row"><div class="sag-hd"><span class="sag-ic">${IC}</span><div><h3>Agents Manager</h3><p class="m">Agents promote your products and earn the commission you set. You pay it only when a sale is completed.</p></div></div><span class="sag-pill ${cls}">${esc(lab)}</span></div>`;
 if(st!=="approved"&&st!=="suspended")h+='<div class="sag-st"><div><b><i>1</i>Apply</b>Send your shop for approval.</div><div><b><i>2</i>Choose products</b>Tick products and set your commission %.</div><div><b><i>3</i>Agents sell</b>Agents share your links. You pay only on completed sales.</div></div>';
 if(st==="none"||st==="rejected"){
  h+=(st==="rejected"?`<div class="msg" style="margin-top:10px">Your last application was not approved.${S.agency_note?" Reason: "+esc(S.agency_note):""} You can apply again.</div>`:"")
   +(S.status!=="approved"?'<div class="msg" style="margin-top:10px">Your shop must be approved before it can join the Agency.</div>':`<form id="sagAp"><label>Why should agents promote your shop? (optional)<textarea name="m" rows="3" maxlength="500" placeholder="What you sell, delivery areas, how fast you ship…"></textarea></label>
   <label style="display:flex;flex-direction:row;gap:8px;align-items:flex-start;font-weight:400"><input type="checkbox" name="ok" required style="width:auto;margin-top:3px"> I agree to pay agents the commission I set on every completed sale of my Agency products.</label>
   <div><button class="btn p" type="submit">Apply to join the Agency</button></div></form>`)}
 else if(st==="pending")h+='<p style="margin:10px 0 0">Your application was received. We will notify you once it is reviewed.</p>';
 else if(st==="suspended")h+=`<div class="msg" style="margin-top:10px">Your shop is paused in the Agency.${S.agency_note?" Reason: "+esc(S.agency_note):""} Contact support.</div>`;
 else h+=`<div class="sag-on"><div><b>Show my products in the Agency</b><div class="m">ON: agents can see and promote your ticked products. OFF: they are hidden at once (your settings are kept).</div></div>
   <label class="sag-sw"><input type="checkbox" id="sagOn" ${S.agency_visible?"checked":""} role="switch" aria-label="Show my products in the Agency"><i></i></label></div>`;
 h+="</div>";
 if(st==="approved")h+='<div class="sag-c" id="sagP"><p class="m">Loading products…</p></div>';
 el.innerHTML=h;if(st==="approved")products()}

async function products(){const box=document.getElementById("sagP");if(!box)return;
 const r=await sb.from("products").select("id,title,price,cover_url,agency_enabled,agency_commission_pct,status").eq("shop_id",String(S.id)).order("created_at",{ascending:false}).limit(300);
 if(r.error){box.innerHTML=`<div class="msg">${esc(er(r.error))}</div>`;return}P=r.data||[];
 box.innerHTML=`<div class="sag-row"><div><h3>Products in the Agency</h3><p class="m" style="margin:0">Tick a product and set your commission (${LIM.min}% to ${LIM.max}%). Only approved products with stock are shown to agents.</p></div>
  </div><div class="sag-tool"><b style="font-size:14px">Set one commission for all ticked products</b><input type="number" id="sagBulk" min="${LIM.min}" max="${LIM.max}" step="0.5" placeholder="%" aria-label="Commission for all ticked products"><button class="btn s" type="button" id="sagApply">Apply to ticked</button></div>
  ${P.length?`<div class="sag-w"><table class="sag-t"><thead><tr><th>In Agency</th><th>Product</th><th>Price</th><th>Commission %</th><th>Agent earns</th></tr></thead><tbody>${P.map(p=>`<tr data-id="${esc(p.id)}"><td><input type="checkbox" data-a="on" style="width:auto" ${p.agency_enabled?"checked":""} aria-label="Show ${esc(p.title)} in the Agency"></td><td><div class="sag-pn">${p.cover_url?`<img class="th" alt="" src="${esc(p.cover_url)}">`:'<span class="th"></span>'}<span><b>${esc(p.title)}</b>${p.status!=="approved"?`<div class="m">${esc(p.status||"pending")} · not shown to agents yet</div>`:""}</span></div></td><td>${KES(p.price)}</td><td><input type="number" data-a="pct" min="${LIM.min}" max="${LIM.max}" step="0.5" value="${p.agency_commission_pct??""}" aria-label="Commission %"></td><td data-a="est">—</td></tr>`).join("")}</tbody></table></div>
  <div style="margin-top:12px"><button class="btn p" type="button" id="sagSave">Save changes</button> <span class="m" id="sagMsg"></span></div>`:'<p class="m">You have no products yet.</p>'}`;
 box.querySelectorAll("tr[data-id]").forEach(est)}
function est(tr){const p=P.find(x=>String(x.id)===tr.dataset.id),v=+tr.querySelector('[data-a="pct"]').value,e=tr.querySelector('[data-a="est"]');e.textContent=p&&v>0?KES(Math.round(p.price*v)/100)+" per sale":"—"}

document.addEventListener("submit",async e=>{if(e.target.id!=="sagAp")return;e.preventDefault();const f=e.target,b=f.querySelector("button");b.disabled=true;
 const r=await sb.rpc("shop_agency_apply",{p_shop:String(S.id),p_message:f.m.value});b.disabled=false;
 if(r.error){toast(er(r.error),"error");return}toast(r.data==="approved"?"Your shop is now in the Agency.":"Application sent. We will review it soon.");mount(BOX,S)});
document.addEventListener("change",async e=>{const t=e.target;
 if(t.id==="sagOn"){const r=await sb.rpc("shop_agency_set_visible",{p_shop:String(S.id),p_on:t.checked});if(r.error){toast(er(r.error),"error");t.checked=!t.checked;return}S.agency_visible=t.checked;toast(t.checked?"Your products are now shown in the Agency.":"Your products are hidden from the Agency.");return}
 if(t.matches&&t.matches('[data-a="pct"],[data-a="on"]')){const tr=t.closest("tr");if(tr)est(tr)}
 if(t.dataset&&t.dataset.agOn!==undefined){const bx=t.closest("form").querySelector("[data-ag-box]");if(bx)bx.hidden=!t.checked}});
document.addEventListener("click",async e=>{
 if(e.target.closest("#sagApply")){const v=+document.getElementById("sagBulk").value;if(!(v>=LIM.min&&v<=LIM.max)){toast(`Enter ${LIM.min}% to ${LIM.max}%.`,"error");return}
  document.querySelectorAll("#sagP tr[data-id]").forEach(tr=>{if(tr.querySelector('[data-a="on"]').checked){tr.querySelector('[data-a="pct"]').value=v;est(tr)}});return}
 const b=e.target.closest("#sagSave");if(!b)return;const msg=document.getElementById("sagMsg"),rows=[];let bad="";
 document.querySelectorAll("#sagP tr[data-id]").forEach(tr=>{const on=tr.querySelector('[data-a="on"]').checked,raw=tr.querySelector('[data-a="pct"]').value,pct=raw===""?null:Math.round(+raw*100)/100,p=P.find(x=>String(x.id)===tr.dataset.id);
  if(on&&!(pct>=LIM.min&&pct<=LIM.max))bad=`Set a commission of ${LIM.min}% to ${LIM.max}% for "${p.title}".`;
  if(on!==!!p.agency_enabled||pct!==(p.agency_commission_pct==null?null:+p.agency_commission_pct))rows.push({id:p.id,agency_enabled:on,agency_commission_pct:pct})});
 if(bad){msg.style.color="var(--r,#b3261e)";msg.textContent=bad;return}if(!rows.length){msg.style.color="inherit";msg.textContent="Nothing changed.";return}
 b.disabled=true;msg.style.color="inherit";msg.textContent="Saving…";let fail=null;
 for(const r of rows){const x=await sb.from("products").update({agency_enabled:r.agency_enabled,agency_commission_pct:r.agency_commission_pct}).eq("id",r.id);if(x.error){fail=x.error;break}}
 b.disabled=false;if(fail){msg.style.color="var(--r,#b3261e)";msg.textContent=er(fail);return}msg.textContent="";toast("Saved. "+rows.length+" product"+(rows.length===1?"":"s")+" updated.");products()});

/* ---------- fields for the Add / Edit product form ---------- */
function fields(p){p=p||{};const ok=S&&S.agency_status==="approved";
 if(!ok)return `<div class="sag-f"><b>Show in the Agency</b><span class="m">${S&&S.agency_status==="pending"?"Your Agency application is waiting for approval.":"Apply in Agents Manager to let agents promote this product."}</span></div>`;
 return `<div class="sag-f"><label style="display:flex;flex-direction:row;gap:8px;align-items:center;font-weight:700"><input type="checkbox" name="agency_enabled" data-ag-on style="width:auto" ${p.agency_enabled?"checked":""}> Show this product in the Agency</label>
  <label data-ag-box ${p.agency_enabled?"":"hidden"}>Commission for agents (%) *<input name="agency_commission_pct" type="number" min="${LIM.min}" max="${LIM.max}" step="0.5" value="${p.agency_commission_pct??""}" placeholder="${LIM.min} to ${LIM.max}"><span class="m">Paid to the agent from the sale price when the order is completed.</span></label></div>`}
function read(f){const on=!!(f.elements.agency_enabled&&f.elements.agency_enabled.checked);if(!f.elements.agency_enabled)return{};
 const v=f.elements.agency_commission_pct.value;if(on&&!(+v>=LIM.min&&+v<=LIM.max))throw new Error(`Commission must be between ${LIM.min}% and ${LIM.max}%.`);
 return{agency_enabled:on,agency_commission_pct:on?+v:null}}

window.ShopAgency={mount,load,fields,read,shop:SHOP,error:er};
})();