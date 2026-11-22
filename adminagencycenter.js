/* SOKO Smart admin: Agency Centre (applications, agents, referrals, sales, commissions, withdrawals, packages,
   marketing materials, leaderboard, fraud & disputes, reports, settings).
   Needs admin.html globals: sb, $, esc, toast, askConfirm. Run supabase-agency-centre.sql once. Page id: agencycentre (#vagc). */
(()=>{
const TABS=[["dash","Agency Dashboard"],["apps","Agent Applications"],["agents","Agent Management"],["refs","Referral Management"],["sales","Sales & Conversions"],["comm","Commission Management"],["wd","Withdrawal Management"],["lv","Commission Packages"],["mat","Marketing Materials"],["lb","Agent Leaderboard"],["fraud","Fraud & Disputes"],["rep","Reports & Analytics"],["set","Agency Settings"]];
let TAB="dash",UID=null,AG=[],LV=[],CFG={},PR={},ERR="",FILT={refs:"",comm:""},WD=[];
const dt=d=>d?new Date(d).toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"numeric"}):"—";
const kes=n=>"KSh "+Number(n||0).toLocaleString("en-KE");
const full=()=>typeof ALLOWED==="undefined"||!ALLOWED;
const help=m=>/relation|does not exist|schema cache|function/i.test(m||"")?"Not set up yet: run supabase-agency-centre.sql in the Supabase SQL editor, then reload. ("+m+")":m;
const MSG={admin_only:"Only a full administrator can do this.",not_pending:"That item was already handled."};
const er=e=>{const m=String(e&&e.message||e);return MSG[Object.keys(MSG).find(k=>m.includes(k))]||help(m)};
const nm=id=>PR[id]||"—";
const pill=(t,k)=>`<span class="pill ${k||""}">${esc(t)}</span>`;
const SP={pending:["Pending","pending"],approved:["Paid to wallet","approved"],rejected:["Rejected","rejected"],reversed:["Reversed","rejected"],disputed:["Disputed","pending"]};
const tbl=(h,rows,empty)=>`<div class="wrap"><table style="min-width:640px"><thead><tr>${h.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${rows||`<tr><td colspan="${h.length}" class="empty">${empty}</td></tr>`}</tbody></table></div>`;
const stat=(l,v,s)=>`<div class="card" style="padding:16px"><div class="m">${l}</div><div style="font-size:26px;font-weight:800;line-height:1.2">${v}</div>${s?`<div class="m">${s}</div>`:""}</div>`;
const err=(id,m)=>{const e=$(id);if(e)e.textContent=m||""};

if(!document.getElementById("agccss"))document.head.insertAdjacentHTML("beforeend",`<style id="agccss">
.agc-t{display:flex;gap:6px;margin:0 0 14px;flex-wrap:wrap}.agc-t button{border:1px solid var(--bd);background:var(--bg);color:var(--tx);border-radius:20px;padding:6px 14px;font-weight:700;cursor:pointer}.agc-t .on{background:var(--g);border-color:var(--g);color:#fff}
.agc-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin-bottom:16px}
#dlg.agcw{max-width:560px;width:calc(100% - 24px);max-height:94vh;overflow:auto}
.agc-f{display:grid;gap:12px}.agc-f label{display:grid;gap:5px;font-size:13px;font-weight:600}
.agc-f input:not([type=checkbox]),.agc-f select,.agc-f textarea{width:100%;box-sizing:border-box;border:1px solid var(--bd);border-radius:8px;padding:9px 10px;font:inherit;font-weight:400}
.agc-lv input{width:84px}.agc-lv input[data-l$=":name"]{width:130px}
.agc-th{width:56px;height:56px;border-radius:8px;object-fit:cover;background:var(--bg2);display:block}
</style>`);

/* ---------- data ---------- */
async function all(table,cols,order,max=5000){let out=[],from=0;
 while(from<max){const r=await sb.from(table).select(cols).order(order,{ascending:false}).range(from,from+999);if(r.error)throw r.error;out=out.concat(r.data||[]);if((r.data||[]).length<1000)break;from+=1000}return out}
async function names(ids){ids=[...new Set(ids.filter(Boolean))].filter(i=>!(i in PR));if(!ids.length)return;
 const r=await sb.from("profiles").select("id,full_name").in("id",ids);(r.data||[]).forEach(p=>PR[p.id]=p.full_name||"Unnamed");ids.forEach(i=>{if(!(i in PR))PR[i]="—"})}
async function load(){ERR="";
 const [a,l,c]=await Promise.all([sb.from("agent_ext").select("*").order("created_at",{ascending:false}),sb.from("agent_levels").select("*").order("sort_order"),sb.rpc("agc_cfg")]);
 const e=a.error||l.error;if(e)ERR=help(e.message);AG=a.data||[];LV=l.data||[];CFG=c.data||{};await names(AG.map(x=>x.agent_id))}
const lvName=id=>(LV.find(l=>l.id===id)||{}).name||id||"—";

function draw(){const el=$("#vagc");
 el.innerHTML=`<div class="ph"><h1>Agency Centre</h1><p>Manage agents, referrals, commissions and payments. Agents use <b>agent-portal.html</b>; blogs, About Us, portfolios and badges are in the Agency page.</p></div>${ERR?`<div class="msg" style="margin-bottom:14px">${esc(ERR)}</div>`:""}
 <div class="agc-t">${TABS.map(([k,l])=>`<button type="button" data-agct="${k}" class="${TAB===k?"on":""}">${esc(l)}</button>`).join("")}</div><div id="agcb"><p class="m">Loading…</p></div>`;paint()}
async function paint(){const f={dash,apps,agents,refs,sales,comm,wd,lv,mat,lb,fraud,rep,set}[TAB];try{await f()}catch(e){$("#agcb").innerHTML=`<div class="msg">${esc(er(e))}</div>`}}

/* ---------- 1. dashboard ---------- */
async function dash(){
 const cnt=async(k)=>(await sb.from("agent_referrals").select("id",{count:"exact",head:true}).eq("kind",k)).count||0;
 const [cm,ck,sg,od,ap,wd]=await Promise.all([all("agent_commissions","status,amount,base_amount","created_at"),cnt("click"),cnt("signup"),cnt("order"),sb.from("agent_applications").select("id",{count:"exact",head:true}).eq("status","pending"),sb.rpc("admin_agent_withdrawals")]);
 const sum=(s,k="amount")=>cm.filter(x=>s.includes(x.status)).reduce((a,x)=>a+Number(x[k]||0),0);
 const pw=(wd.data||[]).filter(x=>x.status==="pending");
 $("#agcb").innerHTML=`<div class="agc-g">${stat("Active agents",AG.filter(a=>a.status==="active").length,AG.filter(a=>a.status!=="active").length+" suspended")}${stat("Link clicks",ck.toLocaleString("en-KE"))}${stat("Customers referred",sg.toLocaleString("en-KE"),"Completed orders: "+od)}${stat("Sales value",kes(sum(["pending","approved"],"base_amount")),"From referred customers")}
 ${stat("Commission pending",kes(sum(["pending"])),cm.filter(x=>x.status==="pending").length+" waiting")}${stat("Commission paid to wallets",kes(sum(["approved"])))}${stat("Applications waiting",ap.count||0)}${stat("Withdrawals waiting",pw.length,kes(pw.reduce((a,x)=>a+Number(x.amount),0)))}</div>
 <section class="card" style="padding:16px"><h2 style="margin:0 0 8px">Quick actions</h2><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn p" data-keep data-agcgo="sales" type="button">Calculate sales &amp; commissions</button><button class="btn" data-keep data-agcgo="apps" type="button">Review applications</button><button class="btn" data-keep data-agcgo="wd" type="button">Pay withdrawals</button><button class="btn" data-keep data-agcgo="fraud" type="button">Check for fraud</button></div></section>`}

/* ---------- 2. applications ---------- */
async function apps(){const r=await sb.from("agent_applications").select("*").order("created_at",{ascending:false}).limit(200);if(r.error)throw r.error;
 $("#agcb").innerHTML=`<section class="card" style="padding:16px"><h2 style="margin:0 0 4px">Agent applications</h2><p class="m" style="margin:0 0 10px">Approving gives the person an agent account, a referral code and the starting level.</p>${tbl(["Applicant","Phone","County","About them","Date","Status","Actions"],(r.data||[]).map(a=>`<tr><td><b>${esc(a.full_name||"—")}</b></td><td>${esc(a.phone||"—")}</td><td>${esc(a.county||"—")}</td><td class="m" style="max-width:240px">${esc(a.experience||"")}</td><td>${esc(dt(a.created_at))}</td><td>${pill(a.status==="pending"?"Waiting":a.status==="approved"?"Approved":"Rejected",a.status==="pending"?"pending":a.status==="approved"?"approved":"rejected")}</td><td>${a.status==="pending"?`<div class="acts"><button class="btn s" type="button" data-agcap="${esc(a.id)}:1">Approve</button><button class="btn s d" type="button" data-agcap="${esc(a.id)}:0">Reject</button></div>`:""}</td></tr>`).join(""),"No applications yet.")}</section>`}

/* ---------- 3. agents ---------- */
async function agents(){
 $("#agcb").innerHTML=`<section class="card" style="padding:16px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px"><div><h2 style="margin:0">Agents <span class="m">(${AG.length})</span></h2><p class="m" style="margin:2px 0 0">Change a level here, or let levels rise automatically (see Agency Settings).</p></div><button class="btn" data-keep id="agcSync" type="button">Import agents from the Agents website</button></div>
 ${tbl(["Agent","Referral code","Level","Status","Joined","Actions"],AG.map(a=>`<tr><td><b>${esc(nm(a.agent_id))}</b></td><td><code>${esc(a.referral_code||"—")}</code></td><td><select data-agclv="${esc(a.agent_id)}" style="width:auto">${LV.map(l=>`<option value="${esc(l.id)}" ${l.id===a.level_id?"selected":""}>${esc(l.name)}</option>`).join("")}</select></td><td>${pill(a.status==="active"?"Active":"Suspended",a.status==="active"?"approved":"rejected")}${a.suspended_reason?`<div class="m">${esc(a.suspended_reason)}</div>`:""}</td><td>${esc(dt(a.created_at))}</td><td><button class="btn s ${a.status==="active"?"d":""}" data-keep data-agcst="${esc(a.agent_id)}" type="button">${a.status==="active"?"Suspend":"Reactivate"}</button></td></tr>`).join(""),"No agents yet. Approve an application or import existing agents.")}</section>`}

/* ---------- 4. referrals ---------- */
async function refs(){let q=sb.from("agent_referrals").select("*").order("created_at",{ascending:false}).limit(300);if(FILT.refs)q=q.eq("kind",FILT.refs);const r=await q;if(r.error)throw r.error;
 await names((r.data||[]).flatMap(x=>[x.agent_id,x.customer_id]));
 const K={click:"Link click",signup:"Sign-up",lead:"Lead",order:"Completed order",shop:"Shop opened"};
 $("#agcb").innerHTML=`<section class="card" style="padding:16px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px"><h2 style="margin:0">Who referred whom</h2><label style="display:flex;gap:8px;align-items:center;font-weight:600">Show <select id="agcRk" style="width:auto"><option value="">Everything</option>${Object.entries(K).map(([k,l])=>`<option value="${k}" ${FILT.refs===k?"selected":""}>${l}</option>`).join("")}</select></label></div>
 ${tbl(["When","Agent","Event","Page","Customer","Amount"],(r.data||[]).map(x=>`<tr><td>${esc(dt(x.created_at))}</td><td><b>${esc(nm(x.agent_id))}</b></td><td>${esc(K[x.kind]||x.kind)}</td><td>${esc(x.ref_type||"")}${x.ref_id?`<div class="m">${esc(x.ref_id)}</div>`:""}</td><td>${x.customer_id?esc(nm(x.customer_id)):"—"}</td><td>${x.amount?kes(x.amount):"—"}</td></tr>`).join(""),"Nothing tracked yet. Clicks appear once agencyref.js is on your website pages.")}<p class="m">Showing the latest 300 events.</p></section>`}

/* ---------- 5. sales & conversions ---------- */
function funnel(refs,cm){const m={};AG.forEach(a=>m[a.agent_id]={c:0,s:0,o:0,v:0,e:0});
 refs.forEach(x=>{const r=m[x.agent_id];if(!r)return;if(x.kind==="click")r.c++;else if(x.kind==="signup")r.s++;else if(x.kind==="order")r.o++});
 cm.forEach(x=>{const r=m[x.agent_id];if(!r)return;if(["pending","approved"].includes(x.status)){r.v+=Number(x.base_amount||0);r.e+=Number(x.amount||0)}});return m}
async function sales(){const [rf,cm]=await Promise.all([all("agent_referrals","agent_id,kind","created_at",10000),all("agent_commissions","agent_id,status,amount,base_amount,source_type,source_id,created_at","created_at")]);
 const m=funnel(rf,cm),rows=AG.map(a=>[a,m[a.agent_id]]).sort((x,y)=>y[1].v-x[1].v);
 $("#agcb").innerHTML=`<section class="card" style="padding:16px;margin-bottom:16px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div><h2 style="margin:0">Sales &amp; conversions</h2><p class="m" style="margin:2px 0 0">Press Calculate to turn completed orders and opened shops from referred customers into commissions. Clicks and unverified sign-ups never earn money.</p></div><button class="btn p" data-keep id="agcCalc" type="button">Calculate sales &amp; commissions</button></div></section>
 <section class="card" style="padding:16px">${tbl(["Agent","Clicks","Sign-ups","Sales","Sales value","Conversion","Commission"],rows.map(([a,r])=>`<tr><td><b>${esc(nm(a.agent_id))}</b></td><td>${r.c}</td><td>${r.s}</td><td>${r.o}</td><td>${kes(r.v)}</td><td>${r.c?(r.o/r.c*100).toFixed(1)+"%":"—"}</td><td><b>${kes(r.e)}</b></td></tr>`).join(""),"No agents yet.")}</section>`}

/* ---------- 6. commissions ---------- */
async function comm(){let q=sb.from("agent_commissions").select("*").order("created_at",{ascending:false}).limit(300);if(FILT.comm)q=q.eq("status",FILT.comm);const r=await q;if(r.error)throw r.error;await names((r.data||[]).map(x=>x.agent_id));
 const hold=CFG.hold_days;
 $("#agcb").innerHTML=`<section class="card" style="padding:16px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px"><div><h2 style="margin:0">Commissions</h2><p class="m" style="margin:2px 0 0">A commission becomes withdrawable after the order is completed, payment is confirmed, ${hold} day${hold==1?"":"s"} have passed and nothing is in dispute. Approving pays it into the agent's wallet.</p></div>
 <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><select id="agcCf" style="width:auto"><option value="">All</option>${Object.entries(SP).map(([k,v])=>`<option value="${k}" ${FILT.comm===k?"selected":""}>${v[0]}</option>`).join("")}</select><button class="btn p" data-keep id="agcRel" type="button">Pay all eligible now</button></div></div>
 ${tbl(["Agent","For","Sale","Rate","Commission","Status","Can be paid","Actions"],(r.data||[]).map(c=>{const s=SP[c.status]||[c.status,""],due=c.status==="pending"?(new Date(c.eligible_at)<=new Date()?"Now":dt(c.eligible_at)):"—";
  return `<tr><td><b>${esc(nm(c.agent_id))}</b></td><td>${esc(c.referral_type)}<div class="m">${esc(String(c.source_id||"").slice(0,8))}</div></td><td>${kes(c.base_amount)}</td><td>${c.rate}%</td><td><b>${kes(c.amount)}</b></td><td>${pill(s[0],s[1])}${c.note?`<div class="m">${esc(c.note)}</div>`:""}</td><td>${esc(due)}</td><td>${["pending","disputed"].includes(c.status)?`<div class="acts"><button class="btn s" type="button" data-agccd="${esc(c.id)}:1">Approve</button><button class="btn s d" type="button" data-agccd="${esc(c.id)}:0">Reject</button></div>`:""}</td></tr>`}).join(""),"No commissions yet. Calculate them in Sales & Conversions.")}<p class="m">Showing the latest 300.</p></section>`}

/* ---------- 7. withdrawals ---------- */
async function wd(){const w=await sb.rpc("admin_agent_withdrawals");if(w.error)throw w.error;WD=w.data||[];
 $("#agcb").innerHTML=`<section class="card" style="padding:16px"><h2 style="margin:0 0 4px">Withdrawal requests</h2><p class="m" style="margin:0 0 10px">Send the money by M-Pesa to the number shown, then press Approve. Reject returns the money to the agent's wallet.</p>${tbl(["When","Agent","Amount","M-Pesa number","Status","Actions"],WD.map(x=>`<tr><td>${esc(dt(x.created_at))}</td><td>${esc(x.agent_name)}</td><td><b>${kes(x.amount)}</b></td><td>${esc(x.phone||"—")}</td><td>${pill(x.status==="completed"?"Paid":x.status==="pending"?"Pending":"Rejected",x.status==="completed"?"approved":x.status==="pending"?"pending":"rejected")}</td><td>${x.status==="pending"?`<div class="acts"><button class="btn s" type="button" data-keep data-agcw="${esc(x.id)}:1">Approve</button><button class="btn s d" type="button" data-keep data-agcw="${esc(x.id)}:0">Reject</button></div>`:""}</td></tr>`).join(""),"No withdrawal requests yet.")}</section>`}

/* ---------- 8. packages (levels) ---------- */
const RATES=[["rate_product","Products"],["rate_shop","Shops"],["rate_service","Services"],["rate_job","Jobs"],["rate_promo","Promotions"]];
function lv(){
 $("#agcb").innerHTML=`<section class="card" style="padding:16px"><h2 style="margin:0 0 4px">Commission packages</h2><p class="m" style="margin:0 0 10px">Agent levels and the percentage each level earns. “Sales to reach” is the number of paid commissions an agent needs before moving up automatically.</p>
 <div class="wrap agc-lv"><table style="min-width:820px"><thead><tr><th>Level</th><th>Sales to reach</th>${RATES.map(r=>`<th>${r[1]} %</th>`).join("")}<th>On</th><th></th></tr></thead><tbody>${LV.map(l=>`<tr><td><input data-l="${esc(l.id)}:name" maxlength="30" value="${esc(l.name)}"></td><td><input type="number" min="0" data-l="${esc(l.id)}:min_sales" value="${l.min_sales}"></td>${RATES.map(r=>`<td><input type="number" min="0" max="100" step="0.5" data-l="${esc(l.id)}:${r[0]}" value="${l[r[0]]}"></td>`).join("")}<td><input type="checkbox" style="width:auto" data-l="${esc(l.id)}:active" ${l.active?"checked":""}></td><td><button class="btn s d" type="button" data-agcld="${esc(l.id)}">Delete</button></td></tr>`).join("")}</tbody></table></div>
 <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px"><button class="btn" data-keep id="agcLa" type="button">+ Add level</button><button class="btn p" data-keep id="agcLs" type="button">Save packages</button><span class="m" id="agcLm"></span></div></section>`}
function snapLv(){document.querySelectorAll("#vagc [data-l]").forEach(i=>{const [id,k]=i.dataset.l.split(":"),l=LV.find(x=>x.id===id);if(!l)return;l[k]=i.type==="checkbox"?i.checked:i.type==="number"?Math.max(0,+i.value||0):i.value.trim()})}

/* ---------- 9. marketing materials ---------- */
async function mat(){const r=await sb.from("agent_materials").select("*").order("created_at",{ascending:false});if(r.error)throw r.error;
 $("#agcb").innerHTML=`<section class="card" style="padding:16px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px"><h2 style="margin:0">Marketing materials</h2><button class="btn p" data-keep id="agcMn" type="button">+ Add material</button></div><p class="m" style="margin:0 0 10px">Agents see these in their portal. In a caption, write {link} where the agent's own referral link should go.</p>
 ${tbl(["","Title","Type","Caption","Show","Actions"],(r.data||[]).map(m=>`<tr><td>${m.url&&m.kind!=="video"?`<img class="agc-th" alt="" src="${esc(m.url)}">`:'<div class="agc-th"></div>'}</td><td><b>${esc(m.title)}</b></td><td>${esc(m.kind)}</td><td class="m" style="max-width:260px">${esc((m.caption||"").slice(0,120))}</td><td><input type="checkbox" style="width:auto" data-agcma="${esc(m.id)}" ${m.active?"checked":""} aria-label="Show to agents"></td><td><button class="btn s d" type="button" data-agcmd="${esc(m.id)}">Delete</button></td></tr>`).join(""),"No materials yet.")}</section>`}
function matForm(){const d=$("#dlg");d.classList.add("agcw");if(!d._agc){d._agc=1;d.addEventListener("close",()=>d.classList.remove("agcw"))}
 $("#dc").innerHTML=`<h3 style="margin:0 0 10px">Add marketing material</h3><form id="agcmf" class="agc-f" novalidate><label>Title *<input name="t" maxlength="100"></label><label>Type<select name="k"><option value="poster">Poster</option><option value="banner">Banner</option><option value="video">Video</option><option value="caption">Caption only</option></select></label>
 <label>Image or video file<input name="f" type="file" accept="image/*,video/mp4,video/webm"><span class="m">Image under 3 MB, video under 8 MB.</span></label><label>…or link<input name="u" type="url" placeholder="https://…"></label><label>Caption<textarea name="c" rows="3" maxlength="600" placeholder="Shop smart on SOKO Smart! {link}"></textarea></label>
 <div id="agcmE" role="alert" style="color:var(--r);min-height:18px;font-size:14px"></div><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn" data-keep id="agcX">Cancel</button><button class="btn p" data-keep id="agcmG">Save material</button></div></form>`;$("#dlg").showModal()}

/* ---------- 10. leaderboard ---------- */
async function lb(){const r=await sb.rpc("agc_leaderboard");if(r.error)throw r.error;
 $("#agcb").innerHTML=`<section class="card" style="padding:16px"><h2 style="margin:0 0 4px">Agent leaderboard</h2><p class="m" style="margin:0 0 10px">Ranked by commission earned. Agents see the same list (first name and initial only) in their portal.</p>${tbl(["#","Agent","Level","Customers","Sales","Earned"],(r.data||[]).map((x,i)=>`<tr><td><b>${i+1}</b></td><td><b>${esc(x.name)}</b></td><td>${esc(x.level||"—")}</td><td>${x.customers}</td><td>${x.sales}</td><td><b>${kes(x.earned)}</b></td></tr>`).join(""),"No active agents yet.")}</section>`}

/* ---------- 11. fraud & disputes ---------- */
async function fraud(){const [d,rf]=await Promise.all([sb.from("agent_disputes").select("*").order("created_at",{ascending:false}).limit(200),all("agent_referrals","agent_id,kind,created_at","created_at",5000)]);if(d.error)throw d.error;
 await names((d.data||[]).map(x=>x.agent_id));
 const week=Date.now()-7*864e5,m={};rf.filter(x=>new Date(x.created_at)>week).forEach(x=>{const r=m[x.agent_id]=m[x.agent_id]||{c:0,s:0};x.kind==="click"?r.c++:r.s++});
 const sus=AG.filter(a=>a.status==="active"&&m[a.agent_id]&&m[a.agent_id].c>=30&&m[a.agent_id].s===0);
 const K={dispute:"Commission dispute",fake_referral:"Fake referral",fraud:"Fraud"},S={open:["Open","pending"],investigating:["Investigating","pending"],resolved:["Resolved","approved"],dismissed:["Dismissed","rejected"]};
 $("#agcb").innerHTML=`<section class="card" style="padding:16px;margin-bottom:16px"><h2 style="margin:0 0 4px">Needs a look</h2><p class="m" style="margin:0 0 10px">Agents with 30 or more link clicks in the last 7 days and no sign-ups. This can mean bots or fake traffic.</p>${tbl(["Agent","Clicks (7 days)","Sign-ups","Actions"],sus.map(a=>`<tr><td><b>${esc(nm(a.agent_id))}</b></td><td>${m[a.agent_id].c}</td><td>0</td><td><button class="btn s d" data-keep data-agcst="${esc(a.agent_id)}" type="button">Suspend</button></td></tr>`).join(""),"Nothing suspicious right now.")}</section>
 <section class="card" style="padding:16px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px"><h2 style="margin:0">Disputes &amp; flags</h2><button class="btn p" data-keep id="agcFn" type="button">+ Flag an agent</button></div>
 ${tbl(["Agent","Type","Details","Date","Status","Actions"],(d.data||[]).map(x=>{const s=S[x.status]||[x.status,""];return `<tr><td><b>${esc(nm(x.agent_id))}</b></td><td>${esc(K[x.kind]||x.kind)}</td><td class="m" style="max-width:280px">${esc(x.details||"")}${x.resolution?`<div><b>Outcome:</b> ${esc(x.resolution)}</div>`:""}</td><td>${esc(dt(x.created_at))}</td><td>${pill(s[0],s[1])}</td><td>${["open","investigating"].includes(x.status)?`<div class="acts"><button class="btn s" data-keep type="button" data-agcdi="${esc(x.id)}:investigating">Investigate</button><button class="btn s" data-keep type="button" data-agcdi="${esc(x.id)}:resolved">Resolve</button><button class="btn s d" data-keep type="button" data-agcdi="${esc(x.id)}:dismissed">Dismiss</button></div>`:""}</td></tr>`}).join(""),"No disputes or flags.")}</section>`}
function flagForm(){const d=$("#dlg");d.classList.add("agcw");if(!d._agc){d._agc=1;d.addEventListener("close",()=>d.classList.remove("agcw"))}
 $("#dc").innerHTML=`<h3 style="margin:0 0 10px">Flag an agent</h3><form id="agcff" class="agc-f" novalidate><label>Agent<select name="a">${AG.map(a=>`<option value="${esc(a.agent_id)}">${esc(nm(a.agent_id))}</option>`).join("")}</select></label><label>Type<select name="k"><option value="fake_referral">Fake referral</option><option value="fraud">Fraud</option></select></label><label>What happened *<textarea name="d" rows="4" maxlength="800"></textarea></label><div id="agcfE" role="alert" style="color:var(--r);min-height:18px;font-size:14px"></div><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn" data-keep id="agcX">Cancel</button><button class="btn p" data-keep id="agcfG">Save flag</button></div></form>`;$("#dlg").showModal()}
function resForm(id,st){const d=$("#dlg");d.classList.add("agcw");if(!d._agc){d._agc=1;d.addEventListener("close",()=>d.classList.remove("agcw"))}
 $("#dc").innerHTML=`<h3 style="margin:0 0 10px">${st==="investigating"?"Start investigating":st==="resolved"?"Resolve":"Dismiss"}</h3><form id="agcrf" class="agc-f" data-id="${esc(id)}" data-st="${st}" novalidate><label>Note ${st==="investigating"?"(optional)":"*"}<textarea name="n" rows="3" maxlength="500"></textarea></label><div id="agcrE" role="alert" style="color:var(--r);min-height:18px;font-size:14px"></div><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn" data-keep id="agcX">Cancel</button><button class="btn p" data-keep id="agcrG">Save</button></div></form>`;$("#dlg").showModal()}

/* ---------- 12. reports ---------- */
async function rep(){const [rf,cm]=await Promise.all([all("agent_referrals","agent_id,kind","created_at",10000),all("agent_commissions","agent_id,status,amount,base_amount","created_at")]);
 const m=funnel(rf,cm),paid={},pend={};cm.forEach(x=>{if(x.status==="approved")paid[x.agent_id]=(paid[x.agent_id]||0)+Number(x.amount);if(x.status==="pending")pend[x.agent_id]=(pend[x.agent_id]||0)+Number(x.amount)});
 const rows=AG.map(a=>({n:nm(a.agent_id),l:lvName(a.level_id),c:m[a.agent_id].c,s:m[a.agent_id].s,o:m[a.agent_id].o,v:m[a.agent_id].v,p:paid[a.agent_id]||0,q:pend[a.agent_id]||0})).sort((x,y)=>y.p+y.q-(x.p+x.q));window.__agcRep=rows;
 const tot=k=>rows.reduce((a,x)=>a+x[k],0);
 $("#agcb").innerHTML=`<div class="agc-g">${stat("Total clicks",tot("c").toLocaleString("en-KE"))}${stat("Sign-ups",tot("s").toLocaleString("en-KE"),tot("c")?(tot("s")/tot("c")*100).toFixed(1)+"% of clicks":"")}${stat("Sales value",kes(tot("v")))}${stat("Commission paid",kes(tot("p")),kes(tot("q"))+" pending")}</div>
 <section class="card" style="padding:16px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px"><h2 style="margin:0">Agent performance</h2><button class="btn" data-keep id="agcCsv" type="button">Download CSV</button></div>${tbl(["Agent","Level","Clicks","Sign-ups","Sales","Sales value","Paid","Pending"],rows.map(x=>`<tr><td><b>${esc(x.n)}</b></td><td>${esc(x.l)}</td><td>${x.c}</td><td>${x.s}</td><td>${x.o}</td><td>${kes(x.v)}</td><td>${kes(x.p)}</td><td>${kes(x.q)}</td></tr>`).join(""),"No agents yet.")}</section>`}

/* ---------- 13. settings ---------- */
function set(){const c=Object.assign({enabled:true,applications_open:true,hold_days:7,min_withdrawal:500,shop_base:1500,auto_level:true},CFG),ck=(n,l,on)=>`<label style="display:flex;flex-direction:row;gap:8px;align-items:center"><input type="checkbox" name="${n}" style="width:auto" ${on?"checked":""}> ${l}</label>`;
 $("#agcb").innerHTML=`<section class="card" style="padding:16px"><h2 style="margin:0 0 10px">Agency settings</h2><form id="agcsf" class="agc-f" style="max-width:560px" novalidate>
 ${ck("enabled","Agency programme is on (referral links are tracked)",c.enabled)}${ck("applications_open","People can apply to become agents",c.applications_open)}${ck("auto_level","Move agents up a level automatically when they reach the sales target",c.auto_level)}
 <label>Days to wait before a commission can be paid<input name="hold_days" type="number" min="0" max="90" value="${c.hold_days}"><span class="m">Gives time for refunds and disputes. Commission is only paid for completed, paid orders.</span></label>
 <label>Minimum withdrawal (KSh)<input name="min_withdrawal" type="number" min="0" value="${c.min_withdrawal}"><span class="m">Shown to agents. The wallet's own withdrawal rules still apply.</span></label>
 <label>Value used to work out commission for a shop an agent opens (KSh)<input name="shop_base" type="number" min="0" value="${c.shop_base}"></label>
 <div id="agcsE" role="alert" style="min-height:18px;font-size:14px"></div><div><button class="btn p" data-keep id="agcsG" type="submit">Save settings</button></div></form></section>`}

/* ---------- events ---------- */
async function run(btn,fn){if(btn)btn.disabled=true;try{await fn()}catch(e){toast(er(e),"error")}if(btn)btn.disabled=false}
document.addEventListener("click",async e=>{const root=document.getElementById("vagc");if(!root||root.hidden){return}
 let b;
 if(e.target.closest("#agcX")){$("#dlg").close();return}
 if(b=e.target.closest("[data-agct]")){TAB=b.dataset.agct;draw();return}
 if(b=e.target.closest("[data-agcgo]")){TAB=b.dataset.agcgo;draw();return}
 if(b=e.target.closest("[data-agcap]")){const [id,ok]=b.dataset.agcap.split(":");if(!full())return toast(MSG.admin_only,"error");
  if(!await askConfirm({title:ok==="1"?"Approve this agent?":"Reject this application?",msg:ok==="1"?"They get an agent account and a referral code.":"They can apply again later.",ok:ok==="1"?"Yes, approve":"Yes, reject"}))return;
  await run(b,async()=>{const r=await sb.rpc("agc_approve_application",{p_id:id,p_ok:ok==="1",p_note:null});if(r.error)throw r.error;toast(ok==="1"?"Agent approved.":"Application rejected.");await load();draw()});return}
 if(e.target.closest("#agcSync")){await run(e.target.closest("#agcSync"),async()=>{const r=await sb.rpc("agc_sync_agents");if(r.error)throw r.error;toast(r.data+" agent"+(r.data==1?"":"s")+" imported.");await load();draw()});return}
 if(b=e.target.closest("[data-agcst]")){const a=AG.find(x=>x.agent_id===b.dataset.agcst);if(!a)return;if(!full())return toast(MSG.admin_only,"error");const on=a.status==="active";
  if(!await askConfirm({title:(on?"Suspend ":"Reactivate ")+nm(a.agent_id)+"?",msg:on?"Their referral link stops earning and they cannot start new referrals. Existing commissions stay as they are.":"Their referral link works again.",ok:on?"Yes, suspend":"Yes, reactivate"}))return;
  await run(b,async()=>{const r=await sb.from("agent_ext").update({status:on?"suspended":"active",suspended_reason:on?"Suspended by admin":null}).eq("agent_id",a.agent_id).select("agent_id");if(r.error)throw r.error;if(!(r.data||[]).length)throw new Error("Not saved. Run supabase-agency-centre.sql.");toast(on?"Agent suspended.":"Agent reactivated.");await load();draw()});return}
 if(e.target.closest("#agcCalc")){await run(e.target.closest("#agcCalc"),async()=>{const r=await sb.rpc("agc_calculate");if(r.error)throw r.error;toast(r.data?r.data+" new commission"+(r.data==1?"":"s")+" created.":"Nothing new to calculate.");paint()});return}
 if(e.target.closest("#agcRel")){if(!await askConfirm({title:"Pay all eligible commissions?",msg:"Every pending commission past its waiting period, with no open dispute, is paid into the agent's wallet.",ok:"Yes, pay them"}))return;
  await run(e.target.closest("#agcRel"),async()=>{const r=await sb.rpc("agc_release");if(r.error)throw r.error;toast(r.data+" commission"+(r.data==1?"":"s")+" paid.");await load();paint()});return}
 if(b=e.target.closest("[data-agccd]")){const [id,ok]=b.dataset.agccd.split(":");if(!full())return toast(MSG.admin_only,"error");
  if(!await askConfirm(ok==="1"?{title:"Approve this commission?",msg:"It is paid into the agent's wallet now, even if the waiting period is not over.",ok:"Yes, pay it"}:{title:"Reject this commission?",msg:"The agent will not be paid for this sale.",ok:"Yes, reject"}))return;
  await run(b,async()=>{const r=await sb.rpc("agc_commission_decide",{p_id:id,p_ok:ok==="1",p_note:null});if(r.error)throw r.error;toast(ok==="1"?"Commission paid to the wallet.":"Commission rejected.");paint()});return}
 if(b=e.target.closest("[data-agcw]")){const [id,ok]=b.dataset.agcw.split(":"),x=WD.find(w=>w.id===id);if(!x)return;if(!full())return toast(MSG.admin_only,"error");
  if(!await askConfirm(ok==="1"?{title:"Approve this withdrawal?",msg:"Confirm only after you have sent "+kes(x.amount)+" by M-Pesa to "+(x.phone||"the agent")+".",ok:"Yes, it was sent"}:{title:"Reject this withdrawal?",msg:kes(x.amount)+" goes back to "+x.agent_name+"'s wallet.",ok:"Yes, reject"}))return;
  await run(b,async()=>{const r=await sb.rpc("agent_withdraw_decide",{p_tx:id,p_ok:ok==="1"});if(r.error)throw r.error;toast(ok==="1"?"Marked as paid.":"Rejected and refunded.");wd()});return}
 if(e.target.closest("#agcLa")){snapLv();LV.push({id:"lvl-"+Date.now().toString(36),name:"New level",sort_order:LV.length+1,min_sales:0,rate_product:5,rate_shop:5,rate_service:5,rate_job:5,rate_promo:5,active:true,_new:1});lv();return}
 if(b=e.target.closest("[data-agcld]")){snapLv();const id=b.dataset.agcld,l=LV.find(x=>x.id===id);if(!l)return;
  if(AG.some(a=>a.level_id===id))return toast("Agents are on this level. Move them to another level first, or untick “On” to hide it.","error");
  if(!await askConfirm({title:"Delete the "+l.name+" level?",msg:"This cannot be undone.",ok:"Yes, delete"}))return;
  if(!l._new){const r=await sb.from("agent_levels").delete().eq("id",id);if(r.error)return toast(er(r.error),"error")}
  LV=LV.filter(x=>x.id!==id);toast("Level deleted.");lv();return}
 if(e.target.closest("#agcLs")){snapLv();const m=$("#agcLm");if(LV.some(l=>!l.name)){m.style.color="var(--r)";m.textContent="Every level needs a name.";return}
  await run(e.target.closest("#agcLs"),async()=>{const rows=LV.map((l,i)=>({id:l.id,name:l.name,sort_order:i+1,min_sales:l.min_sales,rate_product:l.rate_product,rate_shop:l.rate_shop,rate_service:l.rate_service,rate_job:l.rate_job,rate_promo:l.rate_promo,active:!!l.active}));
   const r=await sb.from("agent_levels").upsert(rows,{onConflict:"id"});if(r.error)throw r.error;LV.forEach(l=>delete l._new);m.style.color="inherit";m.textContent="Saved. New sales use these rates.";toast("Commission packages saved.")});return}
 if(e.target.closest("#agcMn")){matForm();return}
 if(b=e.target.closest("[data-agcmd]")){if(!await askConfirm({title:"Delete this material?",msg:"Agents no longer see it.",ok:"Yes, delete"}))return;await run(b,async()=>{const r=await sb.from("agent_materials").delete().eq("id",b.dataset.agcmd);if(r.error)throw r.error;toast("Material deleted.");mat()});return}
 if(e.target.closest("#agcFn")){if(!AG.length)return toast("There are no agents to flag yet.","error");flagForm();return}
 if(b=e.target.closest("[data-agcdi]")){const [id,st]=b.dataset.agcdi.split(":");resForm(id,st);return}
 if(e.target.closest("#agcCsv")){const rows=window.__agcRep||[],q=v=>'"'+String(v).replace(/"/g,'""')+'"',h=["Agent","Level","Clicks","Signups","Sales","Sales value","Paid","Pending"];
  const csv=[h.map(q).join(",")].concat(rows.map(x=>[x.n,x.l,x.c,x.s,x.o,x.v,x.p,x.q].map(q).join(","))).join("\n"),a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="agent-report-"+new Date().toISOString().slice(0,10)+".csv";a.click();return}});

document.addEventListener("change",async e=>{const root=document.getElementById("vagc");if(!root||root.hidden)return;const t=e.target;
 if(t.id==="agcRk"){FILT.refs=t.value;refs();return}if(t.id==="agcCf"){FILT.comm=t.value;comm();return}
 if(t.dataset&&t.dataset.agclv){if(!full()){toast(MSG.admin_only,"error");agents();return}const r=await sb.from("agent_ext").update({level_id:t.value}).eq("agent_id",t.dataset.agclv).select("agent_id");
  if(r.error||!(r.data||[]).length){toast(r.error?er(r.error):"Not saved. Run supabase-agency-centre.sql.","error");return}const a=AG.find(x=>x.agent_id===t.dataset.agclv);if(a)a.level_id=t.value;toast("Level changed.");return}
 if(t.dataset&&t.dataset.agcma){const r=await sb.from("agent_materials").update({active:t.checked}).eq("id",t.dataset.agcma);if(r.error){toast(er(r.error),"error");t.checked=!t.checked;return}toast(t.checked?"Agents can see it.":"Hidden from agents.")}});

document.addEventListener("submit",async e=>{const f=e.target,root=document.getElementById("vagc");if(!root||root.hidden)return;
 if(f.id==="agcmf"){e.preventDefault();const E=m=>err("#agcmE",m),go=$("#agcmG");E("");const t=f.t.value.trim(),file=f.f.files[0];let url=f.u.value.trim()||null;
  if(!t)return E("Add a title.");if(!file&&!url&&!f.c.value.trim())return E("Add a file, a link or a caption.");if(url&&!/^https?:\/\//i.test(url))return E("The link must start with https://");
  go.disabled=true;try{if(file){const v=/^video\//.test(file.type);if(!v&&!/^image\//.test(file.type))throw new Error("Choose an image or an MP4 or WebM video.");if(file.size>(v?8e6:3e6))throw new Error(v?"The video must be under 8 MB.":"The image must be under 3 MB.");
    const ext=(file.name.split(".").pop()||"png").toLowerCase().replace(/[^a-z0-9]/g,"")||"png",path=`${UID}/agent-material-${Date.now()}.${ext}`,up=await sb.storage.from("listing-images").upload(path,file,{contentType:file.type});if(up.error)throw up.error;url=sb.storage.from("listing-images").getPublicUrl(path).data.publicUrl}
   const r=await sb.from("agent_materials").insert({title:t,kind:f.k.value,url,caption:f.c.value.trim()||null});if(r.error)throw r.error;$("#dlg").close();toast("Material added.");mat()}catch(x){E(er(x))}go.disabled=false;return}
 if(f.id==="agcff"){e.preventDefault();const d=f.d.value.trim();if(!d)return err("#agcfE","Describe what happened.");
  const r=await sb.from("agent_disputes").insert({agent_id:f.a.value,kind:f.k.value,details:d,status:"open"});if(r.error)return err("#agcfE",er(r.error));$("#dlg").close();toast("Flag saved.");fraud();return}
 if(f.id==="agcrf"){e.preventDefault();const st=f.dataset.st,n=f.n.value.trim();if(st!=="investigating"&&!n)return err("#agcrE","Add a short note.");
  const row={status:st,resolution:n||null,resolved_at:st==="investigating"?null:new Date().toISOString()},r=await sb.from("agent_disputes").update(row).eq("id",f.dataset.id).select("id");
  if(r.error||!(r.data||[]).length)return err("#agcrE",r.error?er(r.error):"Not saved.");$("#dlg").close();toast("Saved.");fraud();return}
 if(f.id==="agcsf"){e.preventDefault();const E=$("#agcsE"),v={enabled:f.enabled.checked,applications_open:f.applications_open.checked,auto_level:f.auto_level.checked,hold_days:Math.min(90,Math.max(0,Math.round(+f.hold_days.value||0))),min_withdrawal:Math.max(0,+f.min_withdrawal.value||0),shop_base:Math.max(0,+f.shop_base.value||0)};
  const go=$("#agcsG");go.disabled=true;const r=await sb.from("site_content").upsert({key:"agency_settings",value:v,updated_at:new Date().toISOString()},{onConflict:"key"}).select("key");go.disabled=false;
  if(r.error||!(r.data||[]).length){E.style.color="var(--r)";E.textContent=r.error?er(r.error):"Not saved. Check that admins may write to site_content.";return}CFG=v;E.style.color="inherit";E.textContent="Saved.";toast("Agency settings saved.")}});

window.agencyCentreAdmin=async()=>{$("#vagc").innerHTML='<p class="m">Loading…</p>';try{UID=(await sb.auth.getSession()).data.session?.user.id}catch(e){}await load();draw()};
})();