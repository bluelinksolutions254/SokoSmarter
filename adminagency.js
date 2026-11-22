/* SOKO Smart admin: Agency (Agency Blogs, About Us, agents and withdrawals, customers, shops opened, portfolios, achievements).
   Needs admin.html globals: sb, $, esc, toast, askConfirm; blogmd.js (blogMd, blogSlug). Run supabase-agents.sql once. Page id: agencyblog (#vab). */
(()=>{
let SAP=0,TAB="dash",ROWS=[],AG=[],WD=[],ERR="",UID=null,D={cust:[],shops:[],prof:[],port:[],badges:[],awards:[],about:null},LOADED={};
const dt=d=>d?new Date(d).toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"numeric"}):"—";
const kes=n=>"KSh "+Number(n||0).toLocaleString("en-KE");
const slug=s=>(typeof blogSlug==="function"?blogSlug(s):String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,80))||"post";
const full=()=>typeof ALLOWED==="undefined"||!ALLOWED;
const help=m=>/relation|does not exist|schema cache|function/i.test(m||"")?"Not set up yet: run supabase-agents.sql in the Supabase SQL editor, then reload. ("+m+")":m;
const MSG={admin_only:"Only a full administrator can do this.",not_pending:"That request was already handled.",bad_amount:"Enter an amount above 0.",agent_missing:"Agent not found."};
const er=e=>{const m=String(e&&e.message||e);return MSG[Object.keys(MSG).find(k=>m.includes(k))]||help(m)};

if(!document.getElementById("agacss"))document.head.insertAdjacentHTML("beforeend",`<style id="agacss">
.agl{display:grid;grid-template-columns:230px minmax(0,1fr);gap:18px;align-items:start}@media(max-width:900px){.agl{grid-template-columns:1fr}}
.agn{position:sticky;top:12px;display:grid;gap:2px;background:var(--bg);border:1px solid var(--bd);border-radius:14px;padding:10px}.agn .agg{font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);padding:10px 10px 4px}
.agn button{border:0;background:none;text-align:left;padding:8px 10px;border-radius:8px;color:var(--tx);font-weight:600;cursor:pointer;font-size:14px}.agn button:hover{background:var(--gt)}.agn button.on{background:var(--g);color:#fff}
@media(max-width:900px){.agn{position:static;display:flex;overflow-x:auto;gap:4px}.agn .agg{display:none}.agn button{white-space:nowrap}}
.aga-t{display:flex;gap:6px;margin:0 0 14px;flex-wrap:wrap}.aga-t button{border:1px solid var(--bd);background:var(--bg);color:var(--tx);border-radius:20px;padding:6px 16px;font-weight:700;cursor:pointer}.aga-t .on{background:var(--g);border-color:var(--g);color:#fff}
.aga-th{width:64px;height:44px;border-radius:8px;object-fit:cover;background:var(--bg2);display:block}
#dlg.agawide{max-width:760px;width:calc(100% - 24px);max-height:94vh;overflow:auto}
#agf{display:grid;gap:12px}#agf label{display:grid;gap:5px;font-size:13px;font-weight:600}
#agf input:not([type=checkbox]),#agf select,#agf textarea{width:100%;box-sizing:border-box;border:1px solid var(--bd);border-radius:8px;padding:9px 10px;font:inherit;font-weight:400}
#agf textarea{min-height:240px;resize:vertical;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13.5px;line-height:1.55}
</style>`);

async function load(){ERR="";
 const b=await sb.from("agency_blogs").select("id,title,slug,excerpt,cover_url,status,published_at,created_at").order("created_at",{ascending:false}).limit(200);
 if(b.error){ERR=help(b.error.message);ROWS=[]}else ROWS=b.data||[];
 const a=await sb.rpc("admin_agent_list"),w=await sb.rpc("admin_agent_withdrawals");AG=a.error?[]:a.data||[];WD=w.error?[]:w.data||[];try{const sa=await sb.from("shops").select("id",{count:"exact",head:true}).eq("agency_status","pending");SAP=sa.error?0:(sa.count||0)}catch(e){SAP=0}}

function draw(){const el=$("#vab"),pend=WD.filter(x=>x.status==="pending").length;
 const NAVG=[["Overview",[["dash","Agency Dashboard"]]],["Agents",[["apps","Agent Applications"+(AG.filter(x=>x.status==="pending").length?` (${AG.filter(x=>x.status==="pending").length})`:"")],["shopapps","Shop Applications"+(SAP?` (${SAP})`:"")],["agents","Agent Management"],["cust","Referral Management"],["lead","Agent Leaderboard"]]],["Money",[["sales","Sales & Conversions"],["comm","Commission Management"],["wd","Withdrawal Management"+(pend?` (${pend})`:"")],["pkg","Commission Packages"]]],["Control",[["fraud","Fraud & Disputes"],["rep","Reports & Analytics"],["set","Agency Settings"]]],["Website",[["mat","Marketing Materials"],["blogs","Agency Blogs"],["about","About Us"],["shops","Shops Opened"],["port","Portfolios"],["ach","Achievements"]]]];
 const nav=`<nav class="agn" aria-label="Agency sections">${NAVG.map(([g,l])=>`<div class="agg">${esc(g)}</div>`+l.map(([k,t])=>`<button type="button" data-agt="${k}" class="${TAB===k?"on":""}">${esc(t)}</button>`).join("")).join("")}</nav>`;
 el.innerHTML=`<div class="ph"><h1>Agency</h1><p>Agent portal management, commissions, withdrawals and the Agents website.</p></div>${ERR?`<div class="msg" style="margin-bottom:14px">${esc(ERR)}</div>`:""}<div class="agl">${nav}<div id="agb" style="min-width:0"></div></div>`;
 paintTab()}
const AGXK=["dash","apps","agents","sales","comm","pkg","mat","lead","fraud","rep","set"];
async function paintTab(){if(TAB==="shopapps"){if(window.shopAgencyPanel)return window.shopAgencyPanel($("#agb"));$("#agb").innerHTML='<div class="msg">Upload <b>adminshopagency.js</b> next to admin.html and add its script tag.</div>';return}if(!window.AGX&&AGXK.includes(TAB)){$("#agb").innerHTML='<div class="msg">This section needs <b>adminagency2.js</b>. Upload it next to admin.html (and run <b>supabase-agency-v3.sql</b> in Supabase), then reload the page. The other sections (Referral Management, Withdrawal Management, Agency Blogs, About Us, Shops Opened, Portfolios, Achievements) work without it.</div>';return}if(window.AGX&&AGX.tabs[TAB]){$("#agb").innerHTML='<p class="m">Loading…</p>';return AGX.tabs[TAB]($("#agb"))}if(TAB==="blogs")return blogs();if(TAB==="wd")return agents();$("#agb").innerHTML='<p class="m">Loading…</p>';await loadTab(TAB);({about:aboutTab,cust:custTab,shops:shopsTab,port:portTab,ach:achTab})[TAB]()}

function blogs(){
 $("#agb").innerHTML=`<section class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px"><h2 style="margin:0">Posts</h2><button class="btn p" data-keep id="agNew" type="button">+ New post</button></div>
 <div class="wrap"><table style="min-width:620px"><thead><tr><th></th><th>Title</th><th>Status</th><th>Published</th><th>Actions</th></tr></thead><tbody>${ROWS.map(r=>`<tr><td>${r.cover_url?`<img class="aga-th" alt="" src="${esc(r.cover_url)}">`:'<div class="aga-th"></div>'}</td><td><b>${esc(r.title)}</b><div class="m">${esc((r.excerpt||"").slice(0,90))}</div></td><td><span class="pill ${r.status==="published"?"approved":"pending"}">${r.status==="published"?"Published":"Draft"}</span></td><td>${esc(dt(r.published_at))}</td>
 <td><div class="acts"><button class="btn s" type="button" data-agE="${esc(r.id)}">Edit</button><button class="btn s" type="button" data-keep data-agT="${esc(r.id)}">${r.status==="published"?"Unpublish":"Publish"}</button><button class="btn s d" type="button" data-agD="${esc(r.id)}">Delete</button></div></td></tr>`).join("")||'<tr><td colspan="5" class="empty">No posts yet. Press “+ New post”.</td></tr>'}</tbody></table></div></section>`}

function agents(){const pend=WD.filter(x=>x.status==="pending");
 $("#agb").innerHTML=`<section class="card" style="margin-bottom:16px"><h2 style="margin:0 0 4px">Withdrawal requests</h2><p class="m" style="margin:0 0 10px">Send the money by M-Pesa to the number shown, then press Approve. Reject returns the money to the agent's wallet.</p>
 <div class="wrap"><table style="min-width:620px"><thead><tr><th>When</th><th>Agent</th><th>Amount</th><th>M-Pesa number</th><th>Status</th><th></th></tr></thead><tbody>${WD.map(x=>`<tr><td>${esc(dt(x.created_at))}</td><td>${esc(x.agent_name)}</td><td><b>${kes(x.amount)}</b></td><td>${esc(x.phone||"—")}</td><td><span class="pill ${x.status==="completed"?"approved":x.status==="pending"?"pending":"rejected"}">${x.status==="completed"?"Paid":x.status==="pending"?"Pending":"Rejected"}</span></td>
 <td>${x.status==="pending"?`<div class="acts"><button class="btn s" type="button" data-keep data-agW="${esc(x.id)}:1">Approve</button><button class="btn s d" type="button" data-keep data-agW="${esc(x.id)}:0">Reject</button></div>`:""}</td></tr>`).join("")||'<tr><td colspan="6" class="empty">No withdrawal requests yet.</td></tr>'}</tbody></table></div></section>
`}


const nm=id=>(AG.find(a=>a.user_id===id)||{}).full_name||"—";
const SS={awaiting_payment:["Waiting for payment","pending"],pending:["Awaiting approval","pending"],approved:["Shop opened","approved"],rejected:["Rejected","rejected"]};
async function loadTab(t,force){if(LOADED[t]&&!force)return;LOADED[t]=1;
 try{
  if(t==="about"){const r=await sb.from("site_content").select("value").eq("key","agents_about").maybeSingle();D.about=(r.data&&r.data.value)||null}
  else if(t==="cust"){const r=await sb.from("agent_customers").select("*").order("created_at",{ascending:false}).limit(500);D.cust=r.data||[];if(r.error)ERR=help(r.error.message)}
  else if(t==="shops"){const r=await sb.from("shop_applications").select("id,shop_name,full_name,email,phone,county,town,status,created_at,agent_id").not("agent_id","is",null).order("created_at",{ascending:false}).limit(300);D.shops=r.data||[];if(r.error)ERR=help(r.error.message)}
  else if(t==="port"){const a=await sb.from("agent_profile").select("*"),b=await sb.from("agent_portfolio").select("*").order("created_at",{ascending:false}).limit(300);D.prof=a.data||[];D.port=b.data||[];if(a.error)ERR=help(a.error.message)}
  else if(t==="ach"){const b=await sb.from("badges").select("*").eq("category","agent").order("sort_order");D.badges=b.data||[];const ids=D.badges.map(x=>x.id);
   const u=ids.length?await sb.from("user_badges").select("user_id,badge_id,awarded_at,note").in("badge_id",ids).order("awarded_at",{ascending:false}).limit(200):{data:[]};D.awards=u.data||[]}
 }catch(e){ERR=e.message||String(e)}}
const tbl=(h,rows,empty)=>`<div class="wrap"><table style="min-width:620px"><thead><tr>${h.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${rows||`<tr><td colspan="${h.length}" class="empty">${empty}</td></tr>`}</tbody></table></div>`;
function custTab(){$("#agb").innerHTML=`<section class="card"><h2 style="margin:0 0 10px">Customers brought by agents <span class="m">(${D.cust.length})</span></h2>${tbl(["Agent","Customer","Phone","Email","How they joined","Date"],D.cust.map(c=>`<tr><td><b>${esc(nm(c.agent_id))}</b></td><td>${esc(c.name)}</td><td>${esc(c.phone||"—")}</td><td>${esc(c.email||"—")}</td><td>${c.source==="referral"?"Referral link":"Added by agent"}${c.heard_from?`<div class="m">${esc(c.heard_from)}</div>`:""}</td><td>${esc(dt(c.created_at))}</td></tr>`).join(""),"No customers yet.")}</section>`}
function shopsTab(){const n=k=>D.shops.filter(s=>s.status===k).length;
 $("#agb").innerHTML=`<section class="card"><h2 style="margin:0 0 4px">Shops opened by agents</h2><p class="m" style="margin:0 0 10px">${n("approved")} opened · ${n("awaiting_payment")} waiting for payment · ${n("pending")} awaiting approval. Approve or reject applications in Shop Management.</p>${tbl(["Agent","Shop","Owner","Location","Status","Date"],D.shops.map(s=>{const x=SS[s.status]||[s.status,"pending"];return `<tr><td><b>${esc(nm(s.agent_id))}</b></td><td>${esc(s.shop_name)}</td><td>${esc(s.full_name||"")}<div class="m">${esc([s.email,s.phone].filter(Boolean).join(" · "))}</div></td><td>${esc([s.town,s.county].filter(Boolean).join(", "))}</td><td><span class="pill ${x[1]}">${esc(x[0])}</span></td><td>${esc(dt(s.created_at))}</td></tr>`}).join(""),"No shops opened by agents yet.")}</section>`}
function portTab(){const by=id=>D.port.filter(p=>p.agent_id===id);
 $("#agb").innerHTML=`<section class="card"><h2 style="margin:0 0 10px">Agent portfolios</h2>${AG.length?AG.map(a=>{const p=D.prof.find(x=>x.agent_id===a.user_id)||{},it=by(a.user_id);return `<div style="display:grid;grid-template-columns:64px minmax(0,1fr);gap:12px;padding:12px 0;border-top:1px solid var(--bd)"><div class="aga-th" style="width:64px;height:64px;border-radius:50%;overflow:hidden;display:grid;place-items:center;font-weight:800">${p.photo_url?`<img alt="" src="${esc(p.photo_url)}" style="width:100%;height:100%;object-fit:cover">`:esc((a.full_name||"A").charAt(0))}</div><div><b>${esc(a.full_name)}</b> <span class="m">${esc(p.county||"")}</span><div>${esc(p.headline||"No headline yet")}</div><div class="m">${esc(p.bio||"")}</div>${it.length?`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">${it.map(x=>`<div style="width:120px"><div class="aga-th" style="width:120px;height:80px">${x.image_url?`<img alt="" src="${esc(x.image_url)}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">`:""}</div><div class="m" title="${esc(x.description||"")}">${esc(x.title)}</div></div>`).join("")}</div>`:'<div class="m">No portfolio items.</div>'}</div></div>`}).join(""):'<p class="empty">No agents yet.</p>'}</section>`}
function achTab(){
 $("#agb").innerHTML=`<section class="card" style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px"><h2 style="margin:0">Award a badge</h2></div><p class="m" style="margin:0 0 10px">Badges are earned automatically (customers brought, shops opened, portfolio, first payout). You can also give one by hand. Edit points and artwork in Achievements &amp; Badges.</p>
 <form id="aga" style="display:flex;gap:10px;flex-wrap:wrap;align-items:end"><label style="flex:1;min-width:180px">Agent<select name="a">${AG.map(a=>`<option value="${esc(a.user_id)}">${esc(a.full_name)}</option>`).join("")}</select></label><label style="flex:1;min-width:180px">Badge<select name="b">${D.badges.map(b=>`<option value="${esc(b.id)}">${esc(b.name)}</option>`).join("")}</select></label><label style="flex:2;min-width:200px">Note (optional)<input name="n" maxlength="120"></label><button class="btn p" data-keep type="submit" ${D.badges.length&&AG.length?"":"disabled"}>Award</button></form></section>
 <section class="card" style="margin-bottom:16px"><h2 style="margin:0 0 10px">Agent badges</h2>${tbl(["Badge","What it is for","XP","Earned by"],D.badges.map(b=>`<tr><td><b>${esc(b.name)}</b>${b.active?"":' <span class="pill rejected">Off</span>'}</td><td class="m">${esc(b.description||"")}</td><td>${b.points}</td><td>${D.awards.filter(x=>x.badge_id===b.id).length}</td></tr>`).join(""),"No agent badges yet. Run supabase-agents.sql, or add badges in Achievements &amp; Badges with the category “agent”.")}</section>
 <section class="card"><h2 style="margin:0 0 10px">Recent awards</h2>${tbl(["Agent","Badge","Date","Note"],D.awards.map(x=>`<tr><td><b>${esc(nm(x.user_id))}</b></td><td>${esc((D.badges.find(b=>b.id===x.badge_id)||{}).name||x.badge_id)}</td><td>${esc(dt(x.awarded_at))}</td><td class="m">${esc(x.note||"")}</td></tr>`).join(""),"Nothing awarded yet.")}</section>`}
const DEF={heading:"About Us",p1:"SOKO Smart is Kenya's marketplace for products, jobs, freelance work and services, with shops, secure payments and a wallet built in. Our agents are the people who help it grow, one customer and one shop at a time.",p2:"Agents introduce shoppers and sellers to SOKO Smart, keep their customers in one place, and are rewarded for the business they bring in.",bullets:["Your own agent dashboard and referral link","A list of every customer you bring","A wallet you can withdraw from by M-Pesa"],button:"Join as an agent",image:""};
function aboutTab(){const a=Object.assign({},DEF,D.about||{});
 $("#agb").innerHTML=`<section class="card"><h2 style="margin:0 0 4px">About Us (Agents website)</h2><p class="m" style="margin:0 0 12px">This is the About Us section people see on agents.html. Changes show straight away.</p>
 <form id="agab" style="display:grid;gap:12px;max-width:760px"><label>Heading<input name="h" maxlength="80" value="${esc(a.heading)}"></label><label>First paragraph<textarea name="p1" rows="4" maxlength="700">${esc(a.p1)}</textarea></label><label>Second paragraph<textarea name="p2" rows="3" maxlength="700">${esc(a.p2)}</textarea></label>
 <label>Highlights (one per line, up to 6)<textarea name="bl" rows="4">${esc((a.bullets||[]).join("\n"))}</textarea></label><label>Button text<input name="bt" maxlength="40" value="${esc(a.button)}"></label>
 <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">${a.image?`<img alt="" src="${esc(a.image)}" style="width:120px;height:80px;object-fit:cover;border-radius:8px;border:1px solid var(--bd)">`:""}<label style="flex:1;min-width:220px">Picture (upload)<input name="im" type="file" accept="image/*"></label></div>
 <label>…or picture link<input name="iu" type="url" placeholder="https://…" value="${esc(a.image||"")}"></label><div id="agabE" role="alert" style="color:var(--r);min-height:18px;font-size:14px"></div>
 <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn p" data-keep id="agabG" type="submit">Save About Us</button><button class="btn" data-keep id="agabR" type="button">Reset to the default text</button></div></form></section>`}

function wide(){const d=$("#dlg");d.classList.add("agawide");if(!d._aga){d._aga=1;d.addEventListener("close",()=>d.classList.remove("agawide"))}}
async function form(id){wide();let r={title:"",excerpt:"",body:"",cover_url:"",status:"draft"};
 if(id){const x=await sb.from("agency_blogs").select("*").eq("id",id).maybeSingle();if(x.data)r=x.data;else{toast(x.error?help(x.error.message):"Could not open this post. Reload the page and try again.","error");return}}
 $("#dc").innerHTML=`<h3 style="margin:0 0 10px">${id?"Edit post":"New agency blog post"}</h3><form id="agf" data-id="${esc(id||"")}" novalidate>
  <label>Title *<input name="title" maxlength="140" value="${esc(r.title)}"></label>
  <label>Short summary (shown on the card)<input name="excerpt" maxlength="240" value="${esc(r.excerpt||"")}"></label>
  <label>Cover image<input name="file" type="file" accept="image/*"><span class="m">Under 3 MB. Or paste a link below.</span></label>
  <label>…or image link<input name="cover" type="url" placeholder="https://…" value="${esc(r.cover_url||"")}"></label>
  <div style="display:grid;gap:5px"><span style="font-weight:600">Post *</span><textarea name="body" placeholder="Write the post. Markdown works: # Heading, **bold**, - list, [link](https://…)">${esc(r.body||"")}</textarea></div>
  <label>Status<select name="status"><option value="draft" ${r.status==="draft"?"selected":""}>Draft (not shown)</option><option value="published" ${r.status==="published"?"selected":""}>Published (shown on the Agents website)</option></select></label>
  <div id="agE" role="alert" style="color:var(--r);min-height:18px;font-size:14px"></div>
  <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn" data-keep id="agX">Cancel</button><button class="btn p" data-keep id="agGo">Save post</button></div></form>`;
 if(typeof blogEditor==="function")blogEditor("#agf textarea[name=body]");
 if(!$("#dlg").open)$("#dlg").showModal()}

async function savePost(f){const E=m=>{$("#agE").textContent=m||""},go=$("#agGo");E("");
 const title=f.title.value.trim(),body=f.body.value.trim();if(!title)return E("Add a title.");if(!body)return E("Write the post.");
 let cover=f.cover.value.trim()||null;const file=f.file.files[0];
 go.disabled=true;go.textContent="Saving…";
 try{
  if(file){if(!/^image\//.test(file.type)||file.size>3e6)throw new Error("The cover must be an image under 3 MB.");
   const ext=(file.name.split(".").pop()||"png").toLowerCase().replace(/[^a-z0-9]/g,"")||"png",path=`${UID}/agency-${Date.now()}.${ext}`;
   const up=await sb.storage.from("listing-images").upload(path,file,{contentType:file.type});if(up.error)throw up.error;
   cover=sb.storage.from("listing-images").getPublicUrl(path).data.publicUrl}
  const id=f.dataset.id,old=id?ROWS.find(x=>x.id===id):null,pub=f.status.value==="published";
  const row={title,excerpt:f.excerpt.value.trim()||null,body,cover_url:cover,status:f.status.value,published_at:pub?((old&&old.published_at)||new Date().toISOString()):null};
  let x;if(id)x=await sb.from("agency_blogs").update(row).eq("id",id);
  else{x=await sb.from("agency_blogs").insert({...row,slug:slug(title)});if(x.error&&/duplicate|unique|23505/i.test(x.error.message||""))x=await sb.from("agency_blogs").insert({...row,slug:slug(title)+"-"+Math.random().toString(36).slice(2,6)})}
  if(x.error)throw x.error;
  $("#dlg").close();toast(pub?"Post saved and live on the Agents website.":"Post saved as a draft.");await load();draw()
 }catch(x){E(help(x.message||String(x)));go.disabled=false;go.textContent="Save post"}}

function creditDlg(id){const a=AG.find(x=>x.user_id===id);if(!a)return;
 $("#dc").innerHTML=`<h3 style="margin:0 0 10px">Credit ${esc(a.full_name)}</h3><form id="agc" data-id="${esc(id)}" novalidate style="display:grid;gap:12px"><label>Amount (KSh)<input name="am" type="number" min="1" step="1" required></label><label>Note (optional)<input name="nt" maxlength="120" placeholder="e.g. Referral earnings, October"></label><div id="agcE" role="alert" style="color:var(--r);min-height:18px;font-size:14px"></div><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn" data-keep id="agX">Cancel</button><button class="btn p" data-keep id="agcG">Credit wallet</button></div></form>`;
 if(!$("#dlg").open)$("#dlg").showModal();$("#agc").am.focus()}

document.addEventListener("click",async e=>{if(!document.getElementById("vab")||document.getElementById("vab").hidden){return}
 let b;
 if(e.target.closest("#agX")){$("#dlg").close();return}
 if(b=e.target.closest("[data-agt]")){TAB=b.dataset.agt;ERR="";draw();return}
 if(e.target.closest("#agabR")){if(!await askConfirm({title:"Reset About Us?",msg:"The default text comes back on the Agents website.",ok:"Yes, reset"}))return;const {error}=await sb.from("site_content").delete().eq("key","agents_about");if(error){toast(help(error.message),"error");return}D.about=null;toast("About Us reset.");aboutTab();return}
 if(e.target.closest("#agNew")){form();return}
 if(b=e.target.closest("[data-agE]")){form(b.getAttribute("data-agE"));return}
 if(b=e.target.closest("[data-agT]")){const r=ROWS.find(x=>x.id===b.getAttribute("data-agT"));if(!r)return;const pub=r.status!=="published";
  const {error}=await sb.from("agency_blogs").update({status:pub?"published":"draft",published_at:pub?(r.published_at||new Date().toISOString()):null}).eq("id",r.id);
  if(error){toast(help(error.message),"error");return}toast(pub?"Published.":"Moved back to drafts.");await load();draw();return}
 if(b=e.target.closest("[data-agD]")){const r=ROWS.find(x=>x.id===b.getAttribute("data-agD"));if(!r)return;
  if(!await askConfirm({title:"Delete this post?",msg:"“"+r.title+"” disappears from the Agents website. This cannot be undone.",ok:"Yes, delete"}))return;
  const {error}=await sb.from("agency_blogs").delete().eq("id",r.id);if(error){toast(help(error.message),"error");return}toast("Post deleted.");await load();draw();return}
 if(b=e.target.closest("[data-agW]")){const [id,ok]=b.getAttribute("data-agW").split(":"),x=WD.find(w=>w.id===id);if(!x)return;
  if(!full()){toast("Only a full administrator can do this.","error");return}
  const yes=await askConfirm(ok==="1"?{title:"Approve this withdrawal?",msg:"Confirm only after you have sent "+kes(x.amount)+" by M-Pesa to "+(x.phone||"the agent")+".",ok:"Yes, it was sent"}:{title:"Reject this withdrawal?",msg:kes(x.amount)+" goes back to "+x.agent_name+"'s wallet.",ok:"Yes, reject"});
  if(!yes)return;const r=await sb.rpc("agent_withdraw_decide",{p_tx:id,p_ok:ok==="1"});
  if(r.error){toast(er(r.error),"error");return}toast(ok==="1"?"Marked as paid.":"Rejected and refunded.");await load();draw();return}
 if(b=e.target.closest("[data-agC]")){if(!full()){toast("Only a full administrator can do this.","error");return}creditDlg(b.getAttribute("data-agC"));return}});
document.addEventListener("submit",async e=>{const f=e.target;
 if(f.id==="agf"){e.preventDefault();savePost(f);return}
 if(f.id==="agab"){e.preventDefault();const E=m=>$("#agabE").textContent=m||"",go=$("#agabG");E("");go.disabled=true;
  try{let img=f.iu.value.trim()||"";const file=f.im.files[0];
   if(file){if(!/^image\//.test(file.type)||file.size>3e6)throw new Error("The picture must be an image under 3 MB.");const ext=(file.name.split(".").pop()||"png").toLowerCase().replace(/[^a-z0-9]/g,"")||"png",path=`${UID}/agents-about-${Date.now()}.${ext}`;const up=await sb.storage.from("listing-images").upload(path,file,{contentType:file.type});if(up.error)throw up.error;img=sb.storage.from("listing-images").getPublicUrl(path).data.publicUrl}
   if(img&&!/^https?:\/\//i.test(img))throw new Error("The picture link must start with https://");
   const v={heading:f.h.value.trim()||"About Us",p1:f.p1.value.trim(),p2:f.p2.value.trim(),bullets:f.bl.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,6),button:f.bt.value.trim()||"Join as an agent",image:img};
   const {data,error}=await sb.from("site_content").upsert({key:"agents_about",value:v,updated_at:new Date().toISOString()},{onConflict:"key"}).select("key");
   if(error||!data||!data.length)throw new Error(error?help(error.message):"Not saved. Check that admins may write to the site_content table.");
   D.about=v;toast("About Us saved. It is live on the Agents website.");aboutTab()}catch(x){E(x.message||String(x))}go.disabled=false;return}
 if(f.id==="aga"){e.preventDefault();const {error}=await sb.from("user_badges").insert({user_id:f.a.value,badge_id:f.b.value,note:f.n.value.trim()||null});
  if(error){toast(/duplicate|unique|23505/i.test(error.message)?"That agent already has this badge.":help(error.message),"error");return}toast("Badge awarded.");await loadTab("ach",true);achTab();return}
 if(f.id==="agc"){e.preventDefault();const am=+f.am.value,go=$("#agcG"),E=m=>{$("#agcE").textContent=m||""};if(!(am>0))return E("Enter an amount above 0.");
  go.disabled=true;const r=await sb.rpc("agent_credit",{p_agent:f.dataset.id,p_amount:am,p_note:f.nt.value.trim()||null});go.disabled=false;
  if(r.error)return E(er(r.error));$("#dlg").close();toast("Wallet credited.");await load();draw()}});

window.AGA={nm,tbl,dt,kes,er,help,full,wide,get AG(){return AG},get WD(){return WD},reload:async()=>{await load();draw()},repaint:()=>paintTab(),getUID:()=>UID};
window.agencyAdmin=async()=>{LOADED={};$("#vab").innerHTML='<p class="m">Loading…</p>';try{UID=(await sb.auth.getSession()).data.session?.user.id}catch(e){}await load();draw()};
})();
/* SOKO Smart admin: Agency Centre sections (dashboard, applications, agent management, sales, commissions, packages,
   marketing materials, leaderboard, fraud & disputes, reports, settings). Loaded after adminagency.js. Run supabase-agency-v3.sql once. */
(()=>{
const A=()=>window.AGA,KES=n=>"KSh "+Number(n||0).toLocaleString("en-KE"),NUM=n=>Number(n||0).toLocaleString("en-KE");
const tbl=(h,rows,empty)=>A().tbl(h,rows,empty),dt=d=>A().dt(d),ag=()=>A().AG,nm=id=>A().nm(id);
const TYPES=[["product","Product sales"],["shop","Shop referrals"],["freelance","Freelance services"],["job","Job referrals"],["promo","Special campaigns"]],TN=Object.fromEntries(TYPES);
const help=m=>/relation|does not exist|schema cache|function/i.test(m||"")?"Not set up yet: run supabase-agency-v3.sql in the Supabase SQL editor, then reload. ("+m+")":m;
const MSGS={admin_only:"Only a full administrator can do this.",not_allowed:"That is not possible for this commission now.",not_found:"Not found."};
const er=e=>{const m=String(e&&e.message||e);return MSGS[Object.keys(MSGS).find(k=>m.includes(k))]||help(m)};
const warn=m=>m?`<div class="msg" style="margin-bottom:12px">${esc(m)}</div>`:"";
const pill=(t,c)=>`<span class="pill ${c}">${esc(t)}</span>`;
const SP={pending:["Pending","pending"],active:["Active","approved"],suspended:["Suspended","rejected"],rejected:["Rejected","rejected"]};
const CP={pending:["Waiting","pending"],approved:["Approved","approved"],rejected:["Rejected","rejected"],reversed:["Reversed","rejected"]};
const card=(b,l,x="")=>`<div class="st" style="${x}"><b>${b}</b><span>${l}</span></div>`;
const stats=h=>`<div class="stats" style="margin-bottom:14px">${h}</div>`;
const sec=(t,b,x="")=>`<section class="card" style="margin-bottom:16px;${x}"><h2 style="margin:0 0 10px">${t}</h2>${b}</section>`;
let PK=[],CM=[],cmFilter="all",repDays=30,leadDays=30,errMsg="";

async function commissions(){const r=await sb.from("agent_commissions").select("*").order("created_at",{ascending:false}).limit(500);CM=r.data||[];return r.error?help(r.error.message):""}
async function release(){try{const r=await sb.rpc("agency_release_due");return r.data||0}catch(e){return 0}}
const prompt2=(title,label,ok,ph="")=>new Promise(res=>{const d=$("#dlg");$("#dc").innerHTML=`<h3 style="margin:0 0 10px">${esc(title)}</h3><form id="agq" style="display:grid;gap:12px"><label>${esc(label)}<textarea name="n" rows="3" maxlength="300" placeholder="${esc(ph)}"></textarea></label><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn" data-keep id="agqx">Cancel</button><button class="btn p" data-keep>${esc(ok)}</button></div></form>`;
 let done=false;const fin=v=>{if(done)return;done=true;d.close();res(v)};d.addEventListener("close",()=>fin(null),{once:true});
 $("#agq").onsubmit=e=>{e.preventDefault();fin($("#agq").n.value.trim())};$("#agqx").onclick=()=>fin(null);if(!d.open)d.showModal();$("#agq").n.focus()});

const T={};
/* ---------------- dashboard ---------------- */
T.dash=async el=>{await release();const [s,c]=await Promise.all([sb.rpc("agency_stats",{p_days:30}),commissions()]);
 if(s.error){el.innerHTML=warn(help(s.error.message));return}const d=s.data,pend=ag().filter(x=>x.status==="pending");
 el.innerHTML=warn(c)+`<h2 style="margin:0 0 10px">Last 30 days</h2>`+stats(card(NUM(d.agents_active),"Active agents")+card(NUM(d.agents_pending),"Applications waiting")+card(NUM(d.clicks),"Referral link clicks")+card(NUM(d.leads),"New referred customers")+card(NUM(d.sales),"Successful sales")+card(KES(d.volume),"Sales value")+card(KES(d.comm_period),"Commission earned"))
 +stats(card(KES(d.comm_pending),"Commission waiting to be released")+card(KES(d.comm_approved),"Commission paid into wallets")+card(KES(d.wd_pending),NUM(d.wd_pending_count)+" withdrawal request(s) waiting")+card(NUM(d.tickets_open),"Open support and dispute tickets"))
 +(pend.length?sec("Applications waiting",tbl(["Name","Email","Phone","Applied"],pend.slice(0,5).map(a=>`<tr><td><b>${esc(a.full_name)}</b></td><td>${esc(a.email||"")}</td><td>${esc(a.phone||"")}</td><td>${esc(dt(a.created_at))}</td></tr>`).join(""),"")+`<p style="margin:10px 0 0"><button class="btn p" data-keep data-agt="apps" type="button">Review applications</button></p>`):"")
 +sec("Latest commissions",tbl(["Agent","Type","Sale","Commission","Status","Date"],CM.slice(0,8).map(x=>`<tr><td>${esc(nm(x.agent_id))}</td><td>${esc(TN[x.source_type]||x.source_type)}</td><td>${KES(x.base_amount)}</td><td><b>${KES(x.amount)}</b> <span class="m">${x.rate}%</span></td><td>${pill(...CP[x.status]||[x.status,""])}</td><td>${esc(dt(x.created_at))}</td></tr>`).join(""),"No commissions yet. They appear when a customer an agent brought completes an order."))};

/* ---------------- applications ---------------- */
T.apps=async el=>{const L=ag().filter(a=>a.status==="pending"),R=ag().filter(a=>a.status==="rejected");
 el.innerHTML=sec("Agent applications",`<p class="m" style="margin:0 0 10px">New agents wait here until you approve them. They cannot earn, add customers or withdraw before then.</p>`+tbl(["Name","Email","Phone","Applied","Decision"],L.map(a=>`<tr><td><b>${esc(a.full_name)}</b></td><td>${esc(a.email||"")}</td><td>${esc(a.phone||"")}</td><td>${esc(dt(a.created_at))}</td><td><div class="acts"><button class="btn s" data-keep data-ast="${esc(a.user_id)}:active" type="button">Approve</button><button class="btn s d" data-keep data-ast="${esc(a.user_id)}:rejected" type="button">Reject</button></div></td></tr>`).join(""),"No applications waiting."))+(R.length?sec("Rejected",tbl(["Name","Email","Reason",""],R.map(a=>`<tr><td>${esc(a.full_name)}</td><td>${esc(a.email||"")}</td><td class="m">${esc(a.status_note||"")}</td><td><button class="btn s" data-keep data-ast="${esc(a.user_id)}:active" type="button">Approve instead</button></td></tr>`).join(""),"")):"")};

/* ---------------- agent management ---------------- */
T.agents=async el=>{if(!PK.length){const r=await sb.from("commission_packages").select("*").order("sort_order");PK=r.data||[]}
 el.innerHTML=sec("Agents",tbl(["Agent","Status","Level","Customers","Sales","Earned","Wallet",""],ag().filter(a=>a.status!=="pending"&&a.status!=="rejected").map(a=>`<tr><td><b>${esc(a.full_name)}</b><div class="m">${esc(a.email||"")}${a.phone?" · "+esc(a.phone):""}</div><div class="m">Code ${esc(a.referral_code)}</div></td><td>${pill(...SP[a.status]||[a.status,""])}${a.status_note?`<div class="m">${esc(a.status_note)}</div>`:""}</td>
  <td><select data-apk="${esc(a.user_id)}" style="min-width:120px"><option value="">Automatic (${esc(a.level_name||"")})</option>${PK.map(p=>`<option value="${esc(p.id)}" ${a.package_id===p.id?"selected":""}>${esc(p.name)}</option>`).join("")}</select></td>
  <td>${NUM(a.customers)}</td><td>${NUM(a.sales)}</td><td>${KES(a.earned)}</td><td><b>${KES(a.balance)}</b></td>
  <td><div class="acts">${a.status==="active"?`<button class="btn s d" data-keep data-ast="${esc(a.user_id)}:suspended" type="button">Suspend</button>`:`<button class="btn s" data-keep data-ast="${esc(a.user_id)}:active" type="button">Reactivate</button>`}<button class="btn s" data-keep data-agC="${esc(a.user_id)}" type="button">Credit</button></div></td></tr>`).join(""),"No agents yet."))};

/* ---------------- sales & conversions ---------------- */
T.sales=async el=>{const e=await commissions(),by=t=>CM.filter(x=>x.source_type===t&&["pending","approved"].includes(x.status));
 el.innerHTML=warn(e)+stats(TYPES.map(([k,l])=>card(NUM(by(k).length),l+" ("+KES(by(k).reduce((a,x)=>a+ +x.base_amount,0))+")")).join(""))
 +sec("Sales and conversions",tbl(["Date","Agent","Customer","Type","Sale value","Rate","Commission","Status"],CM.map(x=>`<tr><td>${esc(dt(x.created_at))}</td><td>${esc(nm(x.agent_id))}</td><td class="m">${esc(String(x.customer_id||"").slice(0,8))}</td><td>${esc(TN[x.source_type]||x.source_type)}<div class="m">${esc(x.ref_type)} ${esc(String(x.ref_id).slice(0,8))}</div></td><td>${KES(x.base_amount)}</td><td>${x.rate}%</td><td><b>${KES(x.amount)}</b></td><td>${pill(...CP[x.status]||[x.status,""])}</td></tr>`).join(""),"No sales yet."))};

/* ---------------- commission management ---------------- */
T.comm=async el=>{const rel=await release(),e=await commissions(),L=CM.filter(x=>cmFilter==="all"||x.status===cmFilter),pend=CM.filter(x=>x.status==="pending");
 el.innerHTML=warn(e)+stats(card(NUM(pend.length),"Waiting to be released")+card(KES(pend.reduce((a,x)=>a+ +x.amount,0)),"Waiting amount")+card(KES(CM.filter(x=>x.status==="approved").reduce((a,x)=>a+ +x.amount,0)),"Paid into wallets"))
 +sec("Commissions",`<p class="m" style="margin:0 0 10px">A commission waits for the period set in Agency Settings (so refunds and disputes can happen), then is added to the agent's wallet automatically${rel?` (${rel} released just now)`:""}. You can approve one early, reject one that is not valid, or reverse one already paid.</p><div class="aga-t">${["all","pending","approved","rejected","reversed"].map(f=>`<button type="button" data-cmf="${f}" class="${cmFilter===f?"on":""}">${f==="all"?"All":(CP[f]||[f])[0]}</button>`).join("")}</div>`
 +tbl(["Date","Agent","Type","Sale","Commission","Releases","Status",""],L.map(x=>`<tr><td>${esc(dt(x.created_at))}</td><td>${esc(nm(x.agent_id))}</td><td>${esc(TN[x.source_type]||x.source_type)}</td><td>${KES(x.base_amount)}</td><td><b>${KES(x.amount)}</b> <span class="m">${x.rate}%</span></td><td class="m">${x.status==="pending"?esc(dt(x.eligible_at)):""}</td><td>${pill(...CP[x.status]||[x.status,""])}${x.note?`<div class="m">${esc(x.note)}</div>`:""}</td>
  <td><div class="acts">${x.status==="pending"?`<button class="btn s" data-keep data-acm="${esc(x.id)}:approve" type="button">Approve now</button><button class="btn s d" data-keep data-acm="${esc(x.id)}:reject" type="button">Reject</button>`:x.status==="approved"?`<button class="btn s d" data-keep data-acm="${esc(x.id)}:reverse" type="button">Reverse</button>`:""}</div></td></tr>`).join(""),"No commissions here."))};

/* ---------------- commission packages ---------------- */
const RK=["product","shop","freelance","job","promo"];
T.pkg=async el=>{const r=await sb.from("commission_packages").select("*").order("sort_order");PK=r.data||[];
 el.innerHTML=warn(r.error?help(r.error.message):"")+sec("Commission packages (agent levels)",`<p class="m" style="margin:0 0 10px">Set the percentage each level earns on each type of sale. An agent reaches a level automatically once their successful sales reach “Sales needed”, or you can set their level yourself in Agent Management. Commission is calculated on the sale value (for freelance, on SOKO Smart's fee by default, see Agency Settings).</p>
 <div class="wrap"><table style="min-width:860px"><thead><tr><th>Level</th><th>Sales needed</th>${TYPES.map(t=>`<th>${t[1]} %</th>`).join("")}<th>On</th><th></th></tr></thead><tbody id="pkb">${PK.map(p=>`<tr data-pk="${esc(p.id)}"><td><input data-k="name" maxlength="30" value="${esc(p.name)}" style="min-width:110px"></td><td><input data-k="min_sales" type="number" min="0" step="1" value="${p.min_sales}" style="width:80px"></td>${RK.map(k=>`<td><input data-r="${k}" type="number" min="0" max="100" step="0.1" value="${(p.rates||{})[k]??0}" style="width:76px"></td>`).join("")}<td><input type="checkbox" data-k="active" ${p.active?"checked":""} style="width:auto"></td><td><button class="btn s d" data-keep data-pkd="${esc(p.id)}" type="button">Delete</button></td></tr>`).join("")}</tbody></table></div>
 <div style="display:flex;gap:10px;align-items:center;margin-top:12px;flex-wrap:wrap"><button class="btn" data-keep id="pkAdd" type="button">+ Add level</button><button class="btn p" data-keep id="pkSave" type="button">Save levels</button><span class="m" id="pkMsg"></span></div>`)};

/* ---------------- marketing materials ---------------- */
T.mat=async el=>{const r=await sb.from("agency_materials").select("*").order("created_at",{ascending:false});const L=r.data||[];
 el.innerHTML=warn(r.error?help(r.error.message):"")+sec("Marketing materials",`<p class="m" style="margin:0 0 10px">Banners, posters, videos and ready-made captions agents can download and share from their portal.</p><div style="margin-bottom:10px"><button class="btn p" data-keep id="mtNew" type="button">+ Add material</button></div>`
 +tbl(["","Title","Type","Caption","Shown",""],L.map(m=>`<tr><td>${m.file_url&&/\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(m.file_url)?`<img alt="" src="${esc(m.file_url)}" style="width:64px;height:44px;object-fit:cover;border-radius:8px">`:""}</td><td><b>${esc(m.title)}</b>${m.file_url?`<div class="m"><a href="${esc(m.file_url)}" target="_blank" rel="noopener">Open file</a></div>`:""}</td><td>${esc(m.kind)}</td><td class="m">${esc((m.caption||"").slice(0,80))}</td><td><input type="checkbox" data-mta="${esc(m.id)}" ${m.active?"checked":""} style="width:auto" aria-label="Shown to agents"></td><td><button class="btn s d" data-keep data-mtd="${esc(m.id)}" type="button">Delete</button></td></tr>`).join(""),"No materials yet."))};
function matForm(){A().wide();$("#dc").innerHTML=`<h3 style="margin:0 0 10px">Add marketing material</h3><form id="mtf" style="display:grid;gap:12px"><label>Title<input name="t" required maxlength="100"></label><label>Type<select name="k"><option value="banner">Banner</option><option value="poster">Poster</option><option value="video">Video</option><option value="caption">Caption (text only)</option><option value="link">Link</option></select></label>
 <label>File (image, video or PDF, under 8 MB)<input name="f" type="file" accept="image/*,video/*,application/pdf"></label><label>…or a link<input name="u" type="url" placeholder="https://…"></label><label>Caption or message agents can copy<textarea name="c" rows="3" maxlength="600"></textarea></label><div id="mtE" role="alert" style="color:var(--r);min-height:18px;font-size:14px"></div>
 <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn" data-keep id="mtX">Cancel</button><button class="btn p" data-keep id="mtG">Save</button></div></form>`;if(!$("#dlg").open)$("#dlg").showModal()}

/* ---------------- leaderboard ---------------- */
T.lead=async el=>{const r=await sb.rpc("agency_leaderboard",{p_days:leadDays});const L=r.data||[];
 el.innerHTML=warn(r.error?help(r.error.message):"")+sec("Agent leaderboard",`<div class="aga-t">${[7,30,90,365].map(d=>`<button type="button" data-ldd="${d}" class="${leadDays===d?"on":""}">${d===365?"This year":"Last "+d+" days"}</button>`).join("")}</div>`+tbl(["Rank","Agent","Sales","Sale value","Commission earned"],L.map(x=>`<tr><td><b>#${x.rank}</b></td><td>${esc(x.name)}</td><td>${NUM(x.sales)}</td><td>${KES(x.volume)}</td><td><b>${KES(x.earned)}</b></td></tr>`).join(""),"No sales in this period yet."))};

/* ---------------- fraud & disputes ---------------- */
T.fraud=async el=>{const r=await sb.from("agent_tickets").select("*").order("created_at",{ascending:false}).limit(200),L=r.data||[],KT={support:"Support",commission_dispute:"Commission dispute",fake_referral:"Fake referral report"};
 await commissions();const rev=id=>CM.filter(x=>x.agent_id===id&&x.status==="reversed").length;
 const watch=ag().filter(a=>a.status==="active"&&((a.clicks>=50&&a.customers===0)||rev(a.user_id)>=3));
 el.innerHTML=warn(r.error?help(r.error.message):"")+sec("Watchlist",`<p class="m" style="margin:0 0 10px">Agents worth a look: many link clicks but no customers, or several reversed commissions.</p>`+tbl(["Agent","Clicks","Customers","Reversed","Wallet",""],watch.map(a=>`<tr><td><b>${esc(a.full_name)}</b></td><td>${NUM(a.clicks)}</td><td>${NUM(a.customers)}</td><td>${rev(a.user_id)}</td><td>${KES(a.balance)}</td><td><button class="btn s d" data-keep data-ast="${esc(a.user_id)}:suspended" type="button">Suspend</button></td></tr>`).join(""),"Nothing suspicious right now."),"")
 +sec("Tickets from agents",tbl(["Date","Agent","Type","Message","Status",""],L.map(t=>`<tr><td>${esc(dt(t.created_at))}</td><td>${esc(nm(t.agent_id))}</td><td>${esc(KT[t.kind]||t.kind)}</td><td><b>${esc(t.subject)}</b><div class="m">${esc(t.message)}</div>${t.admin_reply?`<div class="m"><b>Reply:</b> ${esc(t.admin_reply)}</div>`:""}</td><td>${pill(t.status==="open"?"Open":t.status==="resolved"?"Resolved":"Rejected",t.status==="open"?"pending":t.status==="resolved"?"approved":"rejected")}</td><td><button class="btn s" data-keep data-atk="${esc(t.id)}" type="button">${t.status==="open"?"Reply":"Edit"}</button></td></tr>`).join(""),"No tickets yet."));window._TK=L};
function tkForm(id){const t=(window._TK||[]).find(x=>x.id===id);if(!t)return;A().wide();$("#dc").innerHTML=`<h3 style="margin:0 0 6px">${esc(t.subject)}</h3><p class="m" style="margin:0 0 10px">${esc(nm(t.agent_id))}: ${esc(t.message)}</p><form id="tkf" data-id="${esc(id)}" style="display:grid;gap:12px"><label>Your reply to the agent<textarea name="r" rows="4" maxlength="600">${esc(t.admin_reply||"")}</textarea></label><label>Outcome<select name="s"><option value="resolved">Resolved</option><option value="rejected">Rejected</option><option value="open">Keep open</option></select></label><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn" data-keep id="tkX">Cancel</button><button class="btn p" data-keep>Send reply</button></div></form>`;if(!$("#dlg").open)$("#dlg").showModal()}

/* ---------------- reports ---------------- */
T.rep=async el=>{const r=await sb.rpc("agency_stats",{p_days:repDays});if(r.error){el.innerHTML=warn(help(r.error.message));return}const d=r.data;await commissions();const conv=d.clicks?Math.round(d.sales/d.clicks*1000)/10:0;
 el.innerHTML=sec("Reports & analytics",`<div class="aga-t">${[7,30,90,365].map(x=>`<button type="button" data-rpd="${x}" class="${repDays===x?"on":""}">${x===365?"This year":"Last "+x+" days"}</button>`).join("")}</div>`
 +stats(card(NUM(d.clicks),"Clicks")+card(NUM(d.leads),"Referred customers")+card(NUM(d.sales),"Successful sales")+card(conv+"%","Sales per click")+card(KES(d.volume),"Sales value")+card(KES(d.comm_period),"Commission")+card(KES(d.wd_paid),"Withdrawals paid"))
 +tbl(["Commission type","Sales","Commission"],TYPES.map(([k,l])=>`<tr><td>${l}</td><td>${NUM((d.by_type[k]||{}).n||0)}</td><td>${KES((d.by_type[k]||{}).amount||0)}</td></tr>`).join(""),"")
 +`<p style="margin:14px 0 0"><button class="btn" data-keep id="rpCsv" type="button">Download commissions (CSV)</button></p>`)};
function csv(){const q=v=>'"'+String(v??"").replace(/"/g,'""')+'"',rows=[["Date","Agent","Type","Reference","Sale value","Rate %","Commission","Status"],...CM.map(x=>[x.created_at,nm(x.agent_id),x.source_type,x.ref_type+" "+x.ref_id,x.base_amount,x.rate,x.amount,x.status])];
 const b=new Blob([rows.map(r=>r.map(q).join(",")).join("\n")],{type:"text/csv"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="agency-commissions.csv";a.click()}

/* ---------------- settings ---------------- */
T.set=async el=>{let v={};try{const r=await sb.from("site_content").select("value").eq("key","agency_settings").maybeSingle();v=(r.data&&r.data.value)||{}}catch(e){}
 const g=(k,d)=>v[k]??d;
 el.innerHTML=sec("Agency settings",`<form id="stf2" style="display:grid;gap:14px;max-width:640px">
 <label style="display:flex;gap:10px;align-items:flex-start;flex-direction:row"><input type="checkbox" name="ra" style="width:auto;margin-top:4px" ${g("require_approval",true)?"checked":""}><span><b>New agents need my approval</b><br><span class="m">Applications wait in Agent Applications. Turn off to let people become agents straight away.</span></span></label>
 <label style="display:flex;gap:10px;align-items:flex-start;flex-direction:row"><input type="checkbox" name="ce" style="width:auto;margin-top:4px" ${g("commission_enabled",true)?"checked":""}><span><b>Commissions are switched on</b><br><span class="m">Turn off to stop creating new commissions (existing ones are not affected).</span></span></label>
 <label style="display:flex;gap:10px;align-items:flex-start;flex-direction:row"><input type="checkbox" name="al" style="width:auto;margin-top:4px" ${g("auto_levels",true)?"checked":""}><span><b>Agents move up levels automatically</b><br><span class="m">Based on “Sales needed” in Commission Packages.</span></span></label>
 <label>Waiting period before a commission is paid (days)<input name="hd" type="number" min="0" max="90" step="1" value="${g("hold_days",7)}"><span class="m">Commission is only released after the order is completed and this many days pass without a refund or dispute.</span></label>
 <label>Smallest sale that earns commission (KSh)<input name="mo" type="number" min="0" step="1" value="${g("min_order",0)}"></label>
 <label>Smallest withdrawal (KSh)<input name="mw" type="number" min="1" step="1" value="${g("min_withdraw",100)}"></label>
 <label>Freelance commission is worked out on<select name="fb"><option value="platform_fee" ${g("freelance_base","platform_fee")==="platform_fee"?"selected":""}>SOKO Smart's fee on the order (recommended)</option><option value="total" ${g("freelance_base")==="total"?"selected":""}>The full order amount</option></select></label>
 <div id="stE" role="alert" style="color:var(--r);min-height:18px;font-size:14px"></div><div><button class="btn p" data-keep type="submit">Save settings</button></div></form>`)};

/* ---------------- actions ---------------- */
document.addEventListener("click",async e=>{const root=document.getElementById("vab");if(!root||root.hidden)return;let b;
 if(b=e.target.closest("[data-ast]")){if(!A().full()){toast("Only a full administrator can do this.","error");return}const [id,st]=b.dataset.ast.split(":");let note=null;
  if(st==="rejected"||st==="suspended"){note=await prompt2(st==="rejected"?"Reject this application":"Suspend this agent","Reason (shown to the agent)","Confirm","e.g. Incomplete details");if(note===null)return}
  const r=await sb.rpc("agent_set_status",{p_agent:id,p_status:st,p_note:note||null});if(r.error){toast(er(r.error),"error");return}toast(st==="active"?"Agent is active.":st==="suspended"?"Agent suspended.":"Application rejected.");await A().reload();return}
 if(b=e.target.closest("[data-acm]")){if(!A().full()){toast("Only a full administrator can do this.","error");return}const [id,act]=b.dataset.acm.split(":");let note=null;
  if(act!=="approve"){note=await prompt2(act==="reject"?"Reject this commission":"Reverse this commission","Reason","Confirm");if(note===null)return}
  const r=await sb.rpc("agency_commission_decide",{p_id:id,p_action:act,p_note:note||null});if(r.error){toast(er(r.error),"error");return}toast(act==="approve"?"Commission paid into the agent's wallet.":act==="reject"?"Commission rejected.":"Commission reversed.");await A().reload();return}
 if(b=e.target.closest("[data-cmf]")){cmFilter=b.dataset.cmf;T.comm($("#agb"));return}
 if(b=e.target.closest("[data-ldd]")){leadDays=+b.dataset.ldd;T.lead($("#agb"));return}
 if(b=e.target.closest("[data-rpd]")){repDays=+b.dataset.rpd;T.rep($("#agb"));return}
 if(e.target.closest("#rpCsv")){csv();return}
 if(e.target.closest("#pkAdd")){const tb=$("#pkb"),id="lvl"+Date.now().toString(36);tb.insertAdjacentHTML("beforeend",`<tr data-pk="${id}" data-new="1"><td><input data-k="name" maxlength="30" value="New level" style="min-width:110px"></td><td><input data-k="min_sales" type="number" min="0" value="0" style="width:80px"></td>${RK.map(k=>`<td><input data-r="${k}" type="number" min="0" max="100" step="0.1" value="0" style="width:76px"></td>`).join("")}<td><input type="checkbox" data-k="active" checked style="width:auto"></td><td><button class="btn s d" data-keep data-pkd="${id}" type="button">Delete</button></td></tr>`);return}
 if(b=e.target.closest("[data-pkd]")){const tr=b.closest("tr");if(tr.dataset.new){tr.remove();return}if(!await askConfirm({title:"Delete this level?",msg:"Agents on this level move to the automatic level.",ok:"Yes, delete"}))return;
  const r=await sb.from("commission_packages").delete().eq("id",b.dataset.pkd);if(r.error){toast(help(r.error.message),"error");return}toast("Level deleted.");T.pkg($("#agb"));return}
 if(e.target.closest("#pkSave")){if(!A().full()){toast("Only a full administrator can do this.","error");return}const rows=[...document.querySelectorAll("#pkb tr")].map((tr,i)=>({id:tr.dataset.pk,name:tr.querySelector('[data-k=name]').value.trim()||"Level",sort_order:i+1,min_sales:Math.max(0,Math.round(+tr.querySelector('[data-k=min_sales]').value||0)),active:tr.querySelector('[data-k=active]').checked,rates:Object.fromEntries(RK.map(k=>[k,Math.min(100,Math.max(0,+tr.querySelector(`[data-r=${k}]`).value||0))]))}));
  const m=$("#pkMsg");m.textContent="Saving…";const r=await sb.from("commission_packages").upsert(rows,{onConflict:"id"});if(r.error){m.style.color="var(--r)";m.textContent=help(r.error.message);return}m.style.color="inherit";m.textContent="Saved.";toast("Commission levels saved.");PK=rows;return}
 if(e.target.closest("#mtNew")){matForm();return}
 if(e.target.closest("#mtX")||e.target.closest("#tkX")){$("#dlg").close();return}
 if(b=e.target.closest("[data-mtd]")){if(!await askConfirm({title:"Delete this material?",msg:"Agents will no longer see it.",ok:"Yes, delete"}))return;const r=await sb.from("agency_materials").delete().eq("id",b.dataset.mtd);if(r.error){toast(help(r.error.message),"error");return}toast("Deleted.");T.mat($("#agb"));return}
 if(b=e.target.closest("[data-atk]")){tkForm(b.dataset.atk);return}});
document.addEventListener("change",async e=>{const root=document.getElementById("vab");if(!root||root.hidden)return;const t=e.target;
 if(t.dataset&&t.dataset.apk!==undefined){if(!A().full()){toast("Only a full administrator can do this.","error");return}const r=await sb.rpc("agent_set_package",{p_agent:t.dataset.apk,p_package:t.value});if(r.error){toast(er(r.error),"error");return}toast("Level updated.");await A().reload();return}
 if(t.dataset&&t.dataset.mta){const r=await sb.from("agency_materials").update({active:t.checked}).eq("id",t.dataset.mta);if(r.error){toast(help(r.error.message),"error");t.checked=!t.checked;return}toast(t.checked?"Shown to agents.":"Hidden from agents.")}});
document.addEventListener("submit",async e=>{const f=e.target;
 if(f.id==="mtf"){e.preventDefault();const E=m=>$("#mtE").textContent=m||"",go=$("#mtG");E("");if(!f.t.value.trim())return E("Add a title.");go.disabled=true;
  try{let url=f.u.value.trim()||null;const file=f.f.files[0];
   if(file){if(file.size>8e6)throw new Error("The file must be under 8 MB.");const ext=(file.name.split(".").pop()||"bin").toLowerCase().replace(/[^a-z0-9]/g,"")||"bin",path=`${A().getUID()}/agency-material-${Date.now()}.${ext}`;const up=await sb.storage.from("listing-images").upload(path,file,{contentType:file.type});if(up.error)throw up.error;url=sb.storage.from("listing-images").getPublicUrl(path).data.publicUrl}
   if(!url&&!f.c.value.trim())throw new Error("Add a file, a link or a caption.");
   const r=await sb.from("agency_materials").insert({title:f.t.value.trim(),kind:f.k.value,file_url:url,caption:f.c.value.trim()||null});if(r.error)throw r.error;
   $("#dlg").close();toast("Material added.");T.mat($("#agb"))}catch(x){E(help(x.message||String(x)))}go.disabled=false}
 else if(f.id==="tkf"){e.preventDefault();const r=await sb.rpc("agent_ticket_reply",{p_id:f.dataset.id,p_status:f.s.value,p_reply:f.r.value});if(r.error){toast(er(r.error),"error");return}$("#dlg").close();toast("Reply saved.");T.fraud($("#agb"))}
 else if(f.id==="stf2"){e.preventDefault();if(!A().full()){toast("Only a full administrator can do this.","error");return}const E=m=>$("#stE").textContent=m||"";E("");
  const v={require_approval:f.ra.checked,commission_enabled:f.ce.checked,auto_levels:f.al.checked,hold_days:Math.min(90,Math.max(0,Math.round(+f.hd.value||0))),min_order:Math.max(0,+f.mo.value||0),min_withdraw:Math.max(1,+f.mw.value||100),freelance_base:f.fb.value};
  const {data,error}=await sb.from("site_content").upsert({key:"agency_settings",value:v,updated_at:new Date().toISOString()},{onConflict:"key"}).select("key");
  if(error||!data||!data.length)return E(error?help(error.message):"Not saved. Check that admins may write to the site_content table.");toast("Agency settings saved.")}});

window.AGX={tabs:T};
})();