/* SOKO Smart admin: Reports & Complaints and Promotions & Ads.
   Needs admin.html globals: sb, $, esc, toast, ic, fmt, num, askConfirm, badges. Also ads.js (SokoAds). */
(()=>{
const css=`<style>
.pill.rv{background:#e8f0fb;color:#1d4f91}.pill.pz{background:#eee;color:#555}.pill.live{background:#e3f4ea;color:var(--g)}
.xr .wrap table{min-width:760px}.xr td,.xr th{padding:10px 12px;text-align:left;border-bottom:1px solid var(--bd);vertical-align:middle}
.xr th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--mut);background:var(--bg2)}
.xr .bar{height:6px;border-radius:3px;background:var(--bd);overflow:hidden;margin-top:4px;min-width:90px}.xr .bar i{display:block;height:100%;background:var(--a)}
.xr .kv{display:grid;grid-template-columns:130px 1fr;gap:6px 12px;margin:10px 0;font-size:14px}.xr .kv span{color:var(--mut)}
.xr .msgbox{background:var(--bg2);border-radius:10px;padding:10px 12px;white-space:pre-wrap;overflow-wrap:anywhere;margin:6px 0 12px}
.xr .two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.xr .frm{display:grid;gap:12px;background:var(--bg);border-radius:14px;padding:18px;box-shadow:0 1px 3px rgba(20,40,30,.07);max-width:620px}
.xr .thx{width:56px;height:42px;border-radius:8px;object-fit:cover;display:block}
</style>`;
const sh=(el)=>{if(!el.dataset.css){el.insertAdjacentHTML("afterbegin",css);el.dataset.css=1}};
const when=d=>d?new Date(d).toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"numeric"}):"";
const dlg=h=>{$("#dc").innerHTML=h;if(!$("#dlg").open)$("#dlg").showModal()};
const ticket=c=>c.ticket||"SC-"+String(c.id).replace(/-/g,"").slice(0,6).toUpperCase();
const needSql=m=>/relation .*(complaints|ads)|schema cache|does not exist/i.test(m||"")?"This feature is not set up yet. Run supabase-complaints-ads.sql in the Supabase SQL editor, then reload. ("+m+")":m;

/* =========================================================== COMPLAINTS */
const CST={open:["New","" ],in_review:["In review","rv"],resolved:["Resolved","approved"],dismissed:["Closed","rejected"]};
let CR=[],CF="",CQ="";
window.complaintsAdmin=async function(){
 const el=$("#vr");sh(el);el.classList.add("xr");
 if(!el.dataset.w){el.insertAdjacentHTML("beforeend",`<div class="ph"><h1>Reports &amp; Complaints</h1><p>Complaints sent from the “File a complaint” form in the website footer.</p></div><div class="stats" id="cst"></div><div class="tb"><input id="cq" type="search" placeholder="Search by reference, name, email or subject…" aria-label="Search complaints"><select id="cf" aria-label="Status"><option value="">All statuses</option><option value="open">New</option><option value="in_review">In review</option><option value="resolved">Resolved</option><option value="dismissed">Closed</option></select></div><div class="wrap"><table><thead><tr><th>Ref</th><th>From</th><th>Problem</th><th>Date</th><th>Status</th><th></th></tr></thead><tbody id="crow"><tr><td colspan="6" class="empty">Loading…</td></tr></tbody></table></div>`);
  $("#cf").onchange=e=>{CF=e.target.value;draw()};let t;$("#cq").oninput=e=>{clearTimeout(t);t=setTimeout(()=>{CQ=e.target.value.trim().toLowerCase();draw()},250)};
  el.addEventListener("click",e=>{const b=e.target.closest("[data-cv]");if(b)open(b.dataset.cv)});el.dataset.w=1}
 const {data,error}=await sb.from("complaints").select("*").order("created_at",{ascending:false}).limit(300);
 if(error){$("#crow").innerHTML=`<tr><td colspan="6" class="empty">${esc(needSql(error.message))}</td></tr>`;return}
 CR=data||[];draw()};
function draw(){
 const n=s=>CR.filter(c=>c.status===s).length;
 $("#cst").innerHTML=[["New",n("open")],["In review",n("in_review")],["Resolved",n("resolved")],["Closed",n("dismissed")]].map(x=>`<div class="st"><b>${num(x[1])}</b><span>${x[0]}</span></div>`).join("");
 const rows=CR.filter(c=>(!CF||c.status===CF)&&(!CQ||[ticket(c),c.full_name,c.email,c.subject,c.reference].join(" ").toLowerCase().includes(CQ)));
 $("#crow").innerHTML=rows.map(c=>{const s=CST[c.status]||CST.open;return `<tr><td><b>${esc(ticket(c))}</b></td><td>${esc(c.full_name)}<div class="m">${esc(c.email)}${c.user_id?" · member":" · guest"}</div></td><td><b>${esc(c.subject)}</b><div class="m">${esc(c.category)}</div></td><td class="m">${when(c.created_at)}</td><td><span class="pill ${s[1]}">${s[0]}</span></td><td><button class="btn s" data-cv="${esc(c.id)}">Open</button></td></tr>`}).join("")||'<tr><td colspan="6" class="empty">No complaints found.</td></tr>'}
function open(id){
 const c=CR.find(x=>String(x.id)===id);if(!c)return;
 dlg(`<div class="xr"><h3>${esc(ticket(c))} · ${esc(c.subject)}</h3>
 <div class="kv"><span>Type</span><b>${esc(c.category)}</b><span>From</span><b>${esc(c.full_name)}${c.user_id?" (member)":" (guest)"}</b><span>Email</span><a href="mailto:${esc(c.email)}">${esc(c.email)}</a>${c.phone?`<span>Phone</span><a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>`:""}${c.reference?`<span>About</span><b style="overflow-wrap:anywhere">${/^https?:\/\//i.test(c.reference)?`<a target="_blank" rel="noopener" href="${esc(c.reference)}">${esc(c.reference)}</a>`:esc(c.reference)}</b>`:""}<span>Sent</span><b>${when(c.created_at)}</b></div>
 <b>What happened</b><div class="msgbox">${esc(c.message)}</div>${c.evidence_url?`<p><a target="_blank" rel="noopener" href="${esc(c.evidence_url)}"><img alt="Evidence" src="${esc(c.evidence_url)}" style="max-width:100%;max-height:200px;border-radius:10px"></a></p>`:""}
 <form id="cfr" data-id="${esc(c.id)}" style="display:grid;gap:10px"><label>Status<select name="st">${Object.entries(CST).map(([k,v])=>`<option value="${k}" ${k===c.status?"selected":""}>${v[0]}</option>`).join("")}</select></label>
 <label>Reply to the customer<textarea name="rp" rows="5" maxlength="1500" placeholder="Write what we found or what happens next. Members receive it in Messages and as a notification.">${esc(c.admin_reply||"")}</textarea></label>
 <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap"><button type="button" class="btn" id="ec">Close</button><button class="btn p">Save &amp; notify</button></div></form></div>`)}
document.addEventListener("submit",async e=>{const f=e.target;if(f.id!=="cfr")return;e.preventDefault();
 const c=CR.find(x=>String(x.id)===f.dataset.id),st=f.st.value,rp=f.rp.value.trim(),btn=f.querySelector(".btn.p");btn.disabled=true;
 const p={status:st,admin_reply:rp||null,resolved_at:["resolved","dismissed"].includes(st)?new Date().toISOString():null};
 const {error}=await sb.from("complaints").update(p).eq("id",c.id);
 if(error){btn.disabled=false;toast(error.message,"error");return}
 let note="";
 if(rp&&rp!==(c.admin_reply||"")){
  if(c.user_id){const body=`Reply to your complaint ${ticket(c)} (“${c.subject}”):\n\n${rp}\n\nStatus: ${CST[st][0]}`;const r=await sb.rpc("admin_notify_user",{p_user:c.user_id,p_body:body});note=r.error?" (saved, but the message could not be sent: "+r.error.message+")":" The customer was notified in Messages."}
  else note=" This customer was a guest, so please also email "+c.email+"."}
 else if(c.user_id)note=" The customer was notified.";
 $("#dlg").close();toast("Complaint updated."+note);window.complaintsAdmin();if(typeof badges==="function")badges()});

/* =========================================================== ADS */
const AST={draft:["Draft",""],pending:["Needs review","rv"],active:["Live","live"],paused:["Paused","pz"],rejected:["Rejected","rejected"],completed:["Completed","pz"]};
let AR=[],AT="queue",AUID=null,ACFG=null;
window.adsAdmin=async function(){
 const el=$("#vpr");sh(el);el.classList.add("xr");
 if(!el.dataset.w){
  el.insertAdjacentHTML("beforeend",`<div class="ph"><h1>Promotions &amp; Ads</h1><p>Review seller ads, run your own house promotions and control how pop-ups behave.</p></div><div class="tabs" id="atabs"><button data-at="queue" class="on">Review queue</button><button data-at="all">All ads</button><button data-at="side">Side banners</button><button data-at="set">Settings</button></div><div id="abody"></div>`);
  el.addEventListener("click",onClick);el.addEventListener("submit",onSubmit);el.dataset.w=1}
 const {data:{session}}=await sb.auth.getSession();AUID=session&&session.user.id;
 await load()};
async function load(){
 $("#abody").innerHTML='<div class="empty">Loading…</div>';
 const {data,error}=await sb.from("ads").select("*").order("created_at",{ascending:false}).limit(300);
 if(error){$("#abody").innerHTML=`<div class="empty">${esc(needSql(error.message))}</div>`;return}
 AR=data||[];ACFG=await SokoAds.loadCfg();view()}
function view(){
 document.querySelectorAll("#atabs button").forEach(b=>b.classList.toggle("on",b.dataset.at===AT));
 if(AT==="side")return sidePanel();
 if(AT==="set")return settings();
 const rows=AT==="queue"?AR.filter(a=>a.status==="pending"):AR;
 const tot=AR.filter(a=>!a.is_house).reduce((s,a)=>s+ +a.spend,0),live=AR.filter(a=>a.status==="active").length,pend=AR.filter(a=>a.status==="pending").length;
 const imp=AR.reduce((s,a)=>s+ +a.impressions,0),clk=AR.reduce((s,a)=>s+ +a.clicks,0);
 $("#abody").innerHTML=`<div class="stats"><div class="st"><b>${num(pend)}</b><span>Waiting for review</span></div><div class="st"><b>${num(live)}</b><span>Live now</span></div><div class="st"><b>${num(imp)}</b><span>Views</span></div><div class="st"><b>${num(clk)}</b><span>Taps</span></div><div class="st"><b>${fmt(Math.round(tot))}</b><span>Seller ad spend</span></div></div>
 <div class="tb"><button class="btn p" data-ahouse>+ New house ad (free promo)</button></div>
 <div class="wrap"><table><thead><tr><th></th><th>Ad</th><th>Owner</th><th>Status</th><th>Budget</th><th>Results</th><th>Actions</th></tr></thead><tbody>${rows.map(row).join("")||`<tr><td colspan="7" class="empty">${AT==="queue"?"Nothing waiting for review.":"No ads yet."}</td></tr>`}</tbody></table></div>`}
function row(a){
 const s=AST[a.status]||AST.draft,pc=a.budget_total?Math.min(100,Math.round(+a.spend/+a.budget_total*100)):0,th=(SokoAds.THEMES[a.theme]||SokoAds.THEMES.green)[1];
 const acts=[`<button class="btn s" data-apv="${esc(a.id)}">Preview</button>`];
 if(a.status==="pending"||a.status==="rejected")acts.push(`<button class="btn s p" data-aok="${esc(a.id)}">Approve</button>`);
 if(a.status==="pending")acts.push(`<button class="btn s d" data-ano="${esc(a.id)}">Reject</button>`);
 if(a.status==="active")acts.push(`<button class="btn s" data-aset="${esc(a.id)}" data-to="paused">Pause</button>`);
 if(a.status==="paused"||(a.status==="draft"&&a.is_house))acts.push(`<button class="btn s" data-aset="${esc(a.id)}" data-to="active">${a.status==="paused"?"Resume":"Publish"}</button>`);
 if(a.is_house)acts.push(`<button class="btn s" data-aed="${esc(a.id)}">Edit</button>`);
 acts.push(`<button class="btn s d" data-adel="${esc(a.id)}">Delete</button>`);
 return `<tr><td>${a.image_url&&!SokoAds.isVideo(a.image_url)?`<img class="thx" alt="" src="${esc(a.image_url)}">`:`<div class="thx" style="background:${th};display:grid;place-items:center;color:#fff">${a.image_url?"▶":""}</div>`}</td><td><b>${esc(a.headline)}</b><div class="m">${esc(a.name)} · ${esc((SokoAds.FORMATS[a.format]||{}).n||"")}</div></td>
 <td>${a.is_house?'<span class="pill approved">House ad</span>':esc(a.shop_name||"Seller")}</td><td><span class="pill ${s[1]}">${s[0]}</span>${a.reject_reason?`<div class="m">${esc(a.reject_reason)}</div>`:""}<div class="m">${esc(a.start_date||"")}${a.end_date?" → "+esc(a.end_date):""}</div></td>
 <td>${a.is_house?(a.budget_total?fmt(+a.budget_total)+" cap":"No cap"):`${fmt(Math.round(+a.spend))} / ${fmt(+a.budget_total||0)}<div class="bar"><i style="width:${pc}%"></i></div>`}</td>
 <td>${num(a.impressions)} views<div class="m">${num(a.clicks)} taps${+a.impressions?" · "+(a.clicks/a.impressions*100).toFixed(1)+"%":""}</div></td><td><div class="acts">${acts.join("")}</div></td></tr>`}

function settings(){
 const c=ACFG;
 $("#abody").innerHTML=`<form class="frm" id="aset"><h3>Ad settings</h3>
 <label class="hc-ck" style="display:flex;gap:8px;align-items:center;flex-direction:row"><input type="checkbox" name="enabled" style="width:auto" ${c.enabled!==false?"checked":""}> Show pop-up ads on the website</label>
 <div class="two"><label>Price per 1,000 views (KSh)<input name="cpm" type="number" min="0" step="1" value="${+c.cpm}"></label><label>Price per tap (KSh)<input name="cpc" type="number" min="0" step="1" value="${+c.cpc}"></label></div>
 <label>Minimum seller budget (KSh)<input name="min_budget" type="number" min="0" step="50" value="${+c.min_budget}"></label>
 <h3 style="margin-top:6px">How pop-ups behave</h3>
 <div class="two"><label>Max ads per visit<input name="max_per_session" type="number" min="1" max="6" value="${+c.max_per_session}"></label><label>First ad after (seconds)<input name="first_delay" type="number" min="0" max="120" value="${+c.first_delay}"></label></div>
 <div class="two"><label>Gap between ads (seconds)<input name="min_gap" type="number" min="10" max="600" value="${+c.min_gap}"></label><label>First ad after scrolling (% of page)<input name="scroll_pct" type="number" min="0" max="90" value="${+c.scroll_pct}"></label></div>
 <p class="m" style="margin:0">Visitors who close an ad do not see that same ad again for 24 hours. Ads never show while someone is typing or chatting, or on the profile, Shop Manager, sign-up and complaint pages.</p>
 <div><button class="btn p">Save settings</button></div></form>`}

async function onSubmit(e){const f=e.target;
 if(f.id==="aset"){e.preventDefault();const n=k=>Number(f[k].value)||0;
  const v={enabled:f.enabled.checked,cpm:n("cpm"),cpc:n("cpc"),min_budget:n("min_budget"),max_per_session:n("max_per_session")||2,first_delay:n("first_delay"),min_gap:n("min_gap")||60,scroll_pct:n("scroll_pct")};
  const {data,error}=await sb.from("site_content").upsert({key:"ads",value:v,updated_at:new Date().toISOString()},{onConflict:"key"}).select("key");
  if(error||!data||!data.length){toast(error?error.message:"The settings were not saved. Run supabase-complaints-ads.sql in Supabase.","error");return}
  ACFG=Object.assign({},ACFG,v);toast("Ad settings saved.")}
 if(f.id==="arj"){e.preventDefault();const id=f.dataset.id,r=f.rs.value.trim();
  const {error}=await sb.from("ads").update({status:"rejected",reject_reason:r||"Please review the ad and resubmit."}).eq("id",id);
  if(error){toast(error.message,"error");return}$("#dlg").close();toast("Ad rejected. The seller was notified.");load();if(typeof badges==="function")badges()}}

async function onClick(e){const g=s=>e.target.closest(s);let b;
 if(b=g("[data-at]")){AT=b.dataset.at;view();return}
 if(g("[data-ahouse]")){SokoAds.wizard({admin:true,userId:AUID,cfg:ACFG,onDone:()=>{load();if(typeof badges==="function")badges()}});return}
 if(b=g("[data-aed]")){SokoAds.wizard({admin:true,ad:AR.find(a=>String(a.id)===b.dataset.aed),userId:AUID,cfg:ACFG,onDone:()=>load()});return}
 if(b=g("[data-apv]")){const a=AR.find(x=>String(x.id)===b.dataset.apv);SokoAds.css();
  dlg(`<h3>Preview</h3><div class="adstage" id="apvs">${SokoAds.card(a)}</div><div class="kv"><span>Button leads to</span><b style="overflow-wrap:anywhere">${esc(a.cta_url)}</b><span>Shown on</span><b>${esc((a.placements||[]).map(k=>SokoAds.PAGES[k]).join(", "))}</b><span>Audience</span><b>${esc(a.audience)}</b></div><div style="text-align:right"><button class="btn" id="ec">Close</button></div>`);
  $("#apvs").onclick=ev=>{ev.preventDefault()};return}
 if(b=g("[data-aok]")){const {error}=await sb.from("ads").update({status:"active",reject_reason:null}).eq("id",b.dataset.aok);error?toast(error.message,"error"):(toast("Ad approved and live. The seller was notified."),load(),typeof badges==="function"&&badges());return}
 if(b=g("[data-ano]")){dlg(`<h3>Reject this ad</h3><form id="arj" data-id="${esc(b.dataset.ano)}" style="display:grid;gap:10px"><label>Tell the seller what to change<textarea name="rs" rows="4" maxlength="300" placeholder="e.g. The image is blurry, please upload a clearer photo."></textarea></label><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn" id="ec">Cancel</button><button class="btn d">Reject ad</button></div></form>`);return}
 if(b=g("[data-aset]")){const {error}=await sb.from("ads").update({status:b.dataset.to}).eq("id",b.dataset.aset);error?toast(error.message,"error"):(toast("Ad updated"),load());return}
 if(b=g("[data-adel]")){if(!await askConfirm({title:"Delete this ad?",msg:"The ad and its results are removed for good.",ok:"Yes, delete"}))return;const {error}=await sb.from("ads").delete().eq("id",b.dataset.adel);error?toast(error.message,"error"):(toast("Ad deleted"),load(),typeof badges==="function"&&badges())}}

/* =========================================================== SIDE BANNERS (both sides of the homepage, shown as slideshows) */
let SBN=null,SBERR="";
async function sideLoad(){SBERR="";let v=null;
 try{const r=await sb.from("site_content").select("value").eq("key","side_banners").maybeSingle();if(r.error)SBERR=r.error.message;else v=r.data&&r.data.value}catch(e){SBERR=e.message||"Could not load."}
 const n=a=>(Array.isArray(a)?a:[]).filter(x=>x&&typeof x==="object").map(x=>({img:String(x.img||""),link:String(x.link||""),alt:String(x.alt||""),on:x.on!==false}));
 SBN={enabled:!(v&&v.enabled===false),speed:Math.min(20,Math.max(2,+(v&&v.speed)||5)),left:n(v&&v.left),right:n(v&&v.right)}}
function sideCol(side,title){const L=SBN[side];
 return `<section class="card" style="margin:0"><h3 style="margin:0 0 4px">${title}</h3><p class="m" style="margin:0 0 12px">${L.filter(x=>x.on&&x.img).length} banner(s) showing. They rotate as a slideshow.</p>
 ${L.map((s,i)=>`<div style="display:grid;grid-template-columns:72px minmax(0,1fr);gap:10px;border:1px solid var(--bd);border-radius:12px;padding:10px;margin-bottom:10px">
  ${s.img?`<img src="${esc(s.img)}" alt="" style="width:72px;height:124px;object-fit:cover;border-radius:8px;border:1px solid var(--bd)">`:`<div style="width:72px;height:124px;border-radius:8px;background:var(--bg2);display:grid;place-items:center;font-size:11px;color:var(--mut);text-align:center">No image yet</div>`}
  <div style="display:grid;gap:6px;min-width:0">
   <label style="font-size:12.5px;font-weight:600">${s.img?"Change image":"Upload image"}<input type="file" accept="image/*" data-sbfile="${side}:${i}"></label>
   <input data-sbf="${side}:${i}:link" placeholder="Link when clicked (https://… or shop.html?…)" value="${esc(s.link)}" aria-label="Link">
   <input data-sbf="${side}:${i}:alt" placeholder="Short description (for accessibility)" maxlength="80" value="${esc(s.alt)}" aria-label="Description">
   <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><label style="display:flex;flex-direction:row;gap:6px;align-items:center;font-size:13px;font-weight:600;margin-right:auto"><input type="checkbox" style="width:auto" data-sbf="${side}:${i}:on" ${s.on?"checked":""}> Show</label>
    <button class="btn s" type="button" data-sbmv="${side}:${i}:-1" ${i?"":"disabled"}>↑</button><button class="btn s" type="button" data-sbmv="${side}:${i}:1" ${i<L.length-1?"":"disabled"}>↓</button><button class="btn s d" type="button" data-sbdel="${side}:${i}">Delete</button></div></div></div>`).join("")||'<p class="m">No banners yet.</p>'}
 <button class="btn" type="button" data-keep data-sbadd="${side}">+ Add banner</button></section>`}
async function sidePanel(){
 const box=$("#abody");box.innerHTML='<div class="empty">Loading…</div>';await sideLoad();sideDraw()}
function sideDraw(){
 $("#abody").innerHTML=`<div class="card" style="margin-bottom:16px"><h3 style="margin:0 0 6px">Side banners (homepage)</h3>
 <p class="m" style="margin:0 0 10px">These appear on the empty space on the left and right of the homepage, from the bottom of the header down to the “New Arrivals” section. Each side is its own slideshow. Visitors on screens narrower than about 1,520 px do not see them.</p>
 <div class="wrap"><table style="min-width:520px"><thead><tr><th>Item</th><th>Size</th></tr></thead><tbody>
 <tr><td><b>Banner graphic (make it this size)</b></td><td><b>300 × 520 px</b> (portrait). Export at 2× for sharp screens: <b>600 × 1040 px</b>. JPG, PNG or WebP, under 2 MB.</td></tr>
 <tr><td>Safe area for text and logos</td><td>Keep everything inside the <b>middle 150 px</b> (of the 300 px width) and 30 px away from the top and bottom. The outer parts may be trimmed on smaller screens.</td></tr>
 <tr><td>Width shown on screen</td><td>1920 px screen: 300 px · 1680: 232 px · 1600: 192 px · 1536: 160 px (hidden below about 1520 px)</td></tr>
 <tr><td>Height shown on screen</td><td>About 500–540 px: from the end of the header to the “New Arrivals” title. It follows the page, so extend the background rather than relying on exact height.</td></tr>
 </tbody></table></div>
 ${SBERR?`<div class="msg" style="margin-top:10px">${esc(SBERR)}</div>`:""}</div>
 <div class="card" style="margin-bottom:16px;display:flex;gap:18px;align-items:center;flex-wrap:wrap"><label style="display:flex;flex-direction:row;gap:8px;align-items:center;font-weight:600"><input type="checkbox" style="width:auto" data-sbg="enabled" ${SBN.enabled?"checked":""}> Show side banners on the website</label>
 <label style="display:flex;flex-direction:row;gap:8px;align-items:center;font-weight:600">Change slide every <input type="number" min="2" max="20" style="width:80px" data-sbg="speed" value="${SBN.speed}"> seconds</label></div>
 <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;margin-bottom:16px">${sideCol("left","Left side")}${sideCol("right","Right side")}</div>
 <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="btn p" type="button" data-keep id="sbsave">Save side banners</button><span class="m" id="sbmsg" role="status"></span></div>`}
async function sideUpload(side,i,file){
 if(!/^image\//.test(file.type)||file.size>2e6){toast("Choose an image under 2 MB","error");return}
 const ext=(file.name.split(".").pop()||"png").toLowerCase().replace(/[^a-z0-9]/g,"")||"png",path=`${AUID}/side-${Date.now()}.${ext}`;
 toast("Uploading…");const up=await sb.storage.from("listing-images").upload(path,file,{contentType:file.type});
 if(up.error){toast(up.error.message,"error");return}
 SBN[side][i].img=sb.storage.from("listing-images").getPublicUrl(path).data.publicUrl;sideDraw();toast("Image added. Press Save side banners to publish.")}
(()=>{const el=document;if(el._sb)return;el._sb=1;
 el.addEventListener("input",e=>{const t=e.target;if(!SBN)return;
  if(t.dataset.sbf){const [sd,i,k]=t.dataset.sbf.split(":");const r=SBN[sd]&&SBN[sd][+i];if(r)r[k]=k==="on"?t.checked:t.value;return}
  if(t.dataset.sbg){SBN[t.dataset.sbg]=t.dataset.sbg==="enabled"?t.checked:Math.min(20,Math.max(2,+t.value||5))}});
 el.addEventListener("change",e=>{const t=e.target;if(t.dataset&&t.dataset.sbfile&&t.files[0]){const [sd,i]=t.dataset.sbfile.split(":");sideUpload(sd,+i,t.files[0])}});
 el.addEventListener("click",async e=>{if(!SBN||AT!=="side")return;let b;
  if(b=e.target.closest("[data-sbadd]")){SBN[b.dataset.sbadd].push({img:"",link:"",alt:"",on:true});sideDraw();return}
  if(b=e.target.closest("[data-sbdel]")){const [sd,i]=b.dataset.sbdel.split(":");SBN[sd].splice(+i,1);sideDraw();return}
  if(b=e.target.closest("[data-sbmv]")){const [sd,i,d]=b.dataset.sbmv.split(":"),a=SBN[sd],j=+i+ +d;if(j<0||j>=a.length)return;[a[+i],a[j]]=[a[j],a[+i]];sideDraw();return}
  if(b=e.target.closest("#sbsave")){const msg=$("#sbmsg");b.disabled=true;msg.textContent="Saving…";
   const clean=a=>a.filter(x=>x.img).map(x=>({img:x.img,link:x.link.trim(),alt:x.alt.trim(),on:x.on!==false}));
   const v={enabled:SBN.enabled,speed:SBN.speed,left:clean(SBN.left),right:clean(SBN.right)};
   const {data,error}=await sb.from("site_content").upsert({key:"side_banners",value:v,updated_at:new Date().toISOString()},{onConflict:"key"}).select("key");
   b.disabled=false;if(error||!data||!data.length){msg.style.color="var(--r)";msg.textContent=error?error.message:"Not saved. Check the site_content permissions for admins.";return}
   SBN.left=v.left.slice();SBN.right=v.right.slice();msg.style.color="inherit";toast("Side banners saved.");sideDraw();const m2=$("#sbmsg");if(m2)m2.textContent="Saved. Banners without an image were left out."}})})();
})();