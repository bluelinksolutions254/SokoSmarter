/* SOKO Smart admin: Badges & Achievements. Needs supabase-badges.sql. Renders into #vset like Payment Plans.
   Hook-up: add a nav/settings entry that calls window.badgesAdmin().
   The website can reuse window.sokoBadge(b,{size,locked}) and window.sokoLevel(points) from this file (also load it on the site). */
(()=>{
const LEVELS=[["Bronze","#B0703A",0],["Silver","#8A94A3",150],["Gold","#C9971C",400],["Platinum","#2BA7A0",1000],["Diamond","#3B82F6",2500]];
const CATS=[["community","Community"],["seller","Sellers & shop owners"],["freelancer","Freelancers"],["client","Clients & employers"],["buyer","Buyers"],["special","Special recognition"],["agent","Agents"]];
const RING={1:"#B0703A",2:"#8A94A3",3:"#C9971C",4:"#7C3AED"};
const E=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const when=d=>d?new Date(d).toLocaleDateString("en-KE",{dateStyle:"medium"}):"—";
const help=m=>/shop_badge|admin_award_shop|admin_revoke_shop/i.test(m||"")?"Shop badges are not set up yet: run supabase-shop-badges.sql in the Supabase SQL editor, then reload. ("+m+")":/relation|does not exist|schema cache|row-level|permission|policy|function/i.test(m||"")?"Not set up yet: run supabase-badges.sql in the Supabase SQL editor, then reload. ("+m+")":m;

/* ---- shared with the website ---- */
window.sokoLevel=p=>{p=+p||0;let i=0;LEVELS.forEach((l,k)=>{if(p>=l[2])i=k});const n=LEVELS[i+1],cur=LEVELS[i];
 return{index:i+1,name:cur[0]+" Member",color:cur[1],next:n?n[0]+" Member":null,toNext:n?n[2]-p:0,pct:n?Math.round((p-cur[2])/(n[2]-cur[2])*100):100}};
window.sokoBadge=(b,o={})=>window.SokoBadges?SokoBadges.medal(b,o):"";   /* artwork lives in badges.js: load it before this file */
if(!document.getElementById("abCss")){const s=document.createElement("style");s.id="abCss";s.textContent=`
.bgm{display:inline-grid;place-items:center;flex:none;width:var(--s);height:var(--s);border-radius:50%;font-style:normal;
 background:radial-gradient(circle at 32% 28%,#fff 0,color-mix(in srgb,var(--c) 30%,#fff) 38%,var(--c) 100%);
 box-shadow:0 0 0 3px #fff,0 0 0 calc(3px + var(--s)*.07) var(--r),0 4px 10px rgba(0,0,0,.18)}
.bgm i{font-style:normal;font-size:calc(var(--s)*.46);line-height:1;filter:drop-shadow(0 1px 1px rgba(0,0,0,.25))}
.bgm.lk{filter:grayscale(1) opacity(.45);box-shadow:0 0 0 3px #fff,0 0 0 calc(3px + var(--s)*.07) #cfc6b8}
.bgl{display:flex;gap:10px;flex-wrap:wrap;margin:10px 0 4px}
.bgl div{flex:1;min-width:110px;border-radius:12px;padding:10px 12px;color:#fff;font-weight:700;background:var(--c)}
.bgl small{display:block;font-weight:400;opacity:.9}
.bgg{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;margin-top:10px}
.bgc{display:flex;gap:12px;align-items:center;border:1px solid var(--bd,#e6dccd);border-radius:12px;padding:12px;background:#fff}
.bgc.off{opacity:.55}.bgc b{display:block}.bgc .m{font-size:12.5px}
.bgc input[type=number]{width:70px;padding:5px 7px}
.bgs{position:relative}.bgs ul{list-style:none;margin:2px 0 0;padding:0;border:1px solid var(--bd,#e6dccd);border-radius:8px;background:#fff;max-height:180px;overflow:auto}
.bgs li{padding:8px 10px;cursor:pointer;font-weight:400}.bgs li:hover{background:#FFF3E3}`;document.head.appendChild(s)}

const ICONS=()=>window.SokoBadges?SokoBadges.ICONS:[],curIcon=b=>window.SokoBadges?SokoBadges.pick(b):"medal",LOOKM=["Bronze","Silver","Gold","Blue"],LOOKA=["New","Star","Pro","Elite"];
let B=[],ERR="",PICK={};
async function load(){ERR="";const r=await sb.from("badges").select("*").order("sort_order");if(r.error){ERR=help(r.error.message);B=[]}else B=r.data||[]}

function draw(){
 const grp=CATS.map(([k,l])=>{const L=B.filter(b=>b.category===k);return L.length?`<h3 style="margin:18px 0 0;font-size:15px">${E(l)} <span class="m" style="font-weight:400">(${L.length})</span></h3><div class="bgg">${L.map(b=>`<div class="bgc ${b.active?"":"off"}" data-b="${E(b.id)}" style="align-items:flex-start">${sokoBadge(b,{size:64,tip:{title:b.name,text:b.description||""}})}<div style="flex:1;min-width:0"><b>${E(b.name)}</b><span class="m">${E(b.description)}</span><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px"><label class="m" style="display:flex;gap:4px;align-items:center">Icon<select data-k="icon" style="padding:5px 7px">${ICONS().map(n=>`<option value="${n}" ${n===curIcon(b)?"selected":""}>${n[0].toUpperCase()+n.slice(1)}</option>`).join("")}</select></label><label class="m" style="display:flex;gap:4px;align-items:center">Look<select data-k="tier" style="padding:5px 7px">${(b.manual?LOOKM:LOOKA).map((n,i)=>`<option value="${i+1}" ${(+b.tier||1)===i+1?"selected":""}>${n}</option>`).join("")}</select></label></div><div style="display:flex;gap:8px;align-items:center;margin-top:6px;flex-wrap:wrap"><label class="m" style="display:flex;gap:4px;align-items:center">XP<input type="number" min="0" data-k="points" value="${b.points}"></label><label class="m" style="display:flex;gap:4px;align-items:center"><input type="checkbox" data-k="active" style="width:auto" ${b.active?"checked":""}>On</label>${b.manual?'<span class="m">Awarded by admin</span>':""}</div></div></div>`).join("")}</div>`:""}).join("");
 $("#vset").innerHTML=`<div class="ph"><div class="m" style="margin-bottom:2px">Achievements</div><h1>Achievements &amp; Badges</h1><p>Every contribution counts. Every achievement deserves recognition.</p></div>
 ${ERR?`<div style="background:#fff4e0;border:1px solid var(--a);border-radius:12px;padding:12px 14px;margin-bottom:14px">${E(ERR)}</div>`:""}
 <section class="card" style="margin-bottom:16px"><h2 style="margin:0">Membership levels</h2><p class="m" style="margin:4px 0 0">Members move up as they earn achievement points (XP) from badges.</p>
  <div class="bgl">${LEVELS.map((l,i)=>`<div style="--c:${l[1]}">${l[0]}<small>Level ${i+1} · ${l[2].toLocaleString()} XP</small></div>`).join("")}</div></section>
 <section class="card" style="margin-bottom:16px"><h2 style="margin:0 0 4px">Award a badge</h2><p class="m" style="margin:0 0 8px">Give a badge to a member or to a shop. The member, or the shop owner, is notified.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
   <label>Award to<select id="bgT"><option value="user">A member</option><option value="shop">A shop</option></select></label>
   <label class="bgs"><span id="bgQL">Member (name or email)</span><input id="bgQ" autocomplete="off" placeholder="Start typing…"><ul id="bgR" hidden></ul><span class="m" id="bgWho"></span></label>
   <label>Badge<select id="bgB">${B.filter(b=>b.active).map(b=>`<option value="${E(b.id)}">${E(b.name)} (+${b.points} XP)</option>`).join("")}</select></label>
   <label>Note to the member (optional)<input id="bgN" maxlength="200" placeholder="Thank you for helping others"></label></div>
  <div style="margin-top:12px;display:flex;gap:10px;align-items:center"><button class="btn p" data-keep id="bgAward" type="button">Award badge</button><span class="m" id="bgMsg"></span></div></section>
 <section class="card" style="margin-bottom:16px"><h2 style="margin:0 0 8px">Member of the Month</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
   <label>Month<input type="month" id="mmM" value="${new Date().toISOString().slice(0,7)}"></label>
   <label class="bgs">Member<input id="mmQ" autocomplete="off" placeholder="Name or email"><ul id="mmR" hidden></ul><span class="m" id="mmWho"></span></label>
   <label>Why they were chosen<input id="mmW" maxlength="300"></label></div>
  <div style="margin-top:12px"><button class="btn p" data-keep id="mmGo" type="button">Save Member of the Month</button> <span class="m" id="mmMsg"></span></div><div id="mmList" style="margin-top:12px"></div></section>
 <section class="card" style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0">Recent awards</h2><button class="btn" id="bgRef" type="button">Refresh</button></div><div id="bgRec">Loading…</div></section>
 <section class="card"><h2 style="margin:0">Badge catalog</h2><p class="m" style="margin:4px 0 0">Change the points or switch a badge off, then save. Switched-off badges are hidden from members.</p>${grp||'<p class="m">No badges yet.</p>'}
  <div style="margin-top:14px"><button class="btn p" data-keep id="bgSave" type="button">Save catalog</button> <span class="m" id="bgSaveMsg"></span></div></section>`;
 recent();motm()}

async function recent(){const el=$("#bgRec");if(!el)return;
 const r=await sb.from("user_badges").select("id,user_id,badge_id,awarded_at,note").order("awarded_at",{ascending:false}).limit(25);
 if(r.error){el.innerHTML=`<p class="m">${E(help(r.error.message))}</p>`;return}
 let sr={data:[]};try{sr=await sb.from("shop_badges").select("id,shop_id,badge_id,awarded_at,note").order("awarded_at",{ascending:false}).limit(25);if(sr.error)sr={data:[]}}catch(e){}
 const ids=[...new Set((r.data||[]).map(x=>x.user_id))],pf=ids.length?(await sb.from("profiles").select("id,full_name,email").in("id",ids)).data||[]:[],nm={};pf.forEach(p=>nm[p.id]=p.full_name||p.email);
 const sids=[...new Set((sr.data||[]).map(x=>x.shop_id))],sh=sids.length?(await sb.from("shops").select("id,name").in("id",sids)).data||[]:[],sn={};sh.forEach(x=>sn[x.id]=x.name);
 const bm=Object.fromEntries(B.map(b=>[b.id,b]));
 const rows=[...(r.data||[]).map(x=>({k:String(x.id),at:x.awarded_at,who:nm[x.user_id]||String(x.user_id).slice(0,8),kind:"Member",b:x.badge_id,note:x.note})),
  ...(sr.data||[]).map(x=>({k:"s"+x.id,at:x.awarded_at,who:sn[x.shop_id]||String(x.shop_id).slice(0,8),kind:"Shop",b:x.badge_id,note:x.note}))].sort((p,q)=>new Date(q.at)-new Date(p.at)).slice(0,30);
 el.innerHTML=rows.length?`<div class="wrap"><table style="min-width:620px"><thead><tr><th>When</th><th>Given to</th><th>Badge</th><th>Why awarded</th><th></th></tr></thead><tbody>${rows.map(x=>{const b=bm[x.b]||{id:x.b,name:x.b};return `<tr><td>${when(x.at)}</td><td>${E(x.who)} <span class="pill">${x.kind}</span></td><td><span style="display:inline-flex;gap:8px;align-items:center">${sokoBadge(b,{size:30})}${E(b.name)}</span></td><td>${E(x.note||b.description||"—")}</td><td><button class="btn s d" data-rv="${E(x.k)}" type="button">Remove</button></td></tr>`}).join("")}</tbody></table></div>`:'<p class="m">No badges awarded yet.</p>'}

async function motm(){const el=$("#mmList");if(!el)return;
 const r=await sb.from("member_of_month").select("*").order("month",{ascending:false}).limit(6);if(r.error||!(r.data||[]).length){el.innerHTML="";return}
 const ids=r.data.map(x=>x.user_id),pf=(await sb.from("profiles").select("id,full_name,email").in("id",ids)).data||[],nm={};pf.forEach(p=>nm[p.id]=p.full_name||p.email);
 el.innerHTML=r.data.map(x=>`<div style="padding:6px 0;border-top:1px solid var(--bd)"><b>${new Date(x.month).toLocaleDateString("en-KE",{month:"long",year:"numeric"})}</b>: ${E(nm[x.user_id]||"Member")}<div class="m">${E(x.reason||"")}</div></div>`).join("")}

let tm;
async function search(inp,ul,who,key){const q=inp.value.trim().replace(/[,()%*]/g,"");PICK[key]=null;if(key==="bg")PICK.bgo=null;who.textContent="";
 if(q.length<2){ul.hidden=true;return}
 if(key==="bg"&&$("#bgT")&&$("#bgT").value==="shop"){
  const r=await sb.from("shops").select("id,name,town,county,owner_id").ilike("name",`%${q}%`).limit(8);
  ul.innerHTML=(r.data||[]).map(p=>`<li data-id="${E(p.id)}" data-o="${E(p.owner_id||"")}" data-n="${E(p.name||"Shop")}">${E(p.name||"No name")} <span class="m">${E([p.town,p.county].filter(Boolean).join(", "))}</span></li>`).join("")||'<li class="m">No shop found</li>';ul.hidden=false;return}
 const r=await sb.from("profiles").select("id,full_name,email").or(`full_name.ilike.%${q}%,email.ilike.%${q}%`).limit(8);
 ul.innerHTML=(r.data||[]).map(p=>`<li data-id="${E(p.id)}" data-n="${E(p.full_name||p.email)}">${E(p.full_name||"No name")} <span class="m">${E(p.email||"")}</span></li>`).join("")||'<li class="m">No one found</li>';ul.hidden=false}
document.addEventListener("change",e=>{if(e.target.id!=="bgT")return;const shop=e.target.value==="shop";PICK.bg=null;PICK.bgo=null;
 $("#bgQ").value="";$("#bgWho").textContent="";$("#bgR").hidden=true;$("#bgQL").textContent=shop?"Shop name":"Member (name or email)";$("#bgQ").placeholder=shop?"Start typing the shop name…":"Start typing…"});
document.addEventListener("input",e=>{const t=e.target;if(t.id!=="bgQ"&&t.id!=="mmQ")return;const a=t.id==="bgQ";clearTimeout(tm);
 tm=setTimeout(()=>search(t,$(a?"#bgR":"#mmR"),$(a?"#bgWho":"#mmWho"),a?"bg":"mm"),250)});

document.addEventListener("click",async e=>{
 const li=e.target.closest(".bgs li[data-id]");if(li){const a=!!li.closest("#bgR"),key=a?"bg":"mm";PICK[key]=li.dataset.id;if(a)PICK.bgo=li.dataset.o||null;
  $(a?"#bgQ":"#mmQ").value=li.dataset.n;$(a?"#bgWho":"#mmWho").textContent="Selected";li.parentNode.hidden=true;return}
 if(e.target.closest("#bgRef")){recent();return}
 let b;
 if(b=e.target.closest("[data-rv]")){if(typeof askConfirm==="function"&&!await askConfirm({title:"Remove this badge?",msg:"The member or shop loses the badge (and a member loses its points).",ok:"Yes, remove"}))return;
  const rk=String(b.dataset.rv),isShop=rk[0]==="s",r=await sb.rpc(isShop?"admin_revoke_shop_badge":"admin_revoke_badge",{p_id:+(isShop?rk.slice(1):rk)});toast(r.error?help(r.error.message):"Badge removed.",r.error?"error":undefined);recent();return}
 if(b=e.target.closest("#bgAward")){const m=$("#bgMsg");if(!PICK.bg){m.style.color="var(--r)";m.textContent=$("#bgT")&&$("#bgT").value==="shop"?"Pick a shop from the list first.":"Pick a member from the list first.";return}
  b.disabled=true;const id=$("#bgB").value,bd=B.find(x=>x.id===id),note=$("#bgN").value.trim();
  const shop=!!$("#bgT")&&$("#bgT").value==="shop",r=await(shop?sb.rpc("admin_award_shop_badge",{p_shop:String(PICK.bg),p_badge:id,p_note:note||null}):sb.rpc("admin_award_badge",{p_user:PICK.bg,p_badge:id,p_note:note||null}));b.disabled=false;
  if(r.error){m.style.color="var(--r)";m.textContent=help(r.error.message);return}
  if(r.data==="already"){m.style.color="inherit";m.textContent=shop?"This shop already has that badge.":"This member already has that badge.";return}
  m.style.color="inherit";m.textContent="Awarded.";
  {const to=shop?PICK.bgo:PICK.bg,who=$("#bgQ").value;
   if(to)await sb.rpc("admin_notify_user",{p_user:to,p_body:shop?`Congratulations! Your shop “${who}” has earned the ${bd.name} badge.${note?" "+note:""}`:`Congratulations! You've earned the ${bd.name} badge (+${bd.points} XP).${note?" "+note:""}`})}
  toast(shop?"Badge awarded to the shop.":"Badge awarded and the member was notified.");recent();return}
 if(b=e.target.closest("#mmGo")){const m=$("#mmMsg"),mo=$("#mmM").value;if(!PICK.mm||!mo){m.style.color="var(--r)";m.textContent="Choose a month and a member.";return}
  b.disabled=true;const reason=$("#mmW").value.trim();
  const r=await sb.from("member_of_month").upsert({month:mo+"-01",user_id:PICK.mm,reason:reason||null},{onConflict:"month"});b.disabled=false;
  if(r.error){m.style.color="var(--r)";m.textContent=help(r.error.message);return}
  m.style.color="inherit";m.textContent="Saved.";await sb.rpc("admin_notify_user",{p_user:PICK.mm,p_body:`You are Soko Smart's Member of the Month! ${reason}`});motm();toast("Member of the Month saved.");return}
 if(b=e.target.closest("#bgSave")){const rows=[];document.querySelectorAll("#vset [data-b]").forEach(c=>{const o=B.find(x=>x.id===c.dataset.b);
   rows.push({...o,points:Math.max(0,Math.round(+c.querySelector('[data-k="points"]').value||0)),active:c.querySelector('[data-k="active"]').checked,icon:c.querySelector('[data-k="icon"]').value,tier:+c.querySelector('[data-k="tier"]').value||1})});
  b.disabled=true;const r=await sb.from("badges").upsert(rows,{onConflict:"id"});b.disabled=false;const m=$("#bgSaveMsg");
  if(r.error){m.style.color="var(--r)";m.textContent=help(r.error.message);return}
  B=rows;m.style.color="inherit";m.textContent="Saved.";toast("Badge catalog saved.")}});

/* live preview when the icon or look is changed */
document.addEventListener("change",e=>{const t=e.target;if(!t.matches||!t.matches('#vset [data-k="icon"],#vset [data-k="tier"]'))return;const c=t.closest("[data-b]"),o=c&&B.find(x=>x.id===c.dataset.b),w=c&&c.querySelector(".bgw");if(!o||!w)return;
 w.outerHTML=sokoBadge({...o,icon:c.querySelector('[data-k="icon"]').value,tier:+c.querySelector('[data-k="tier"]').value||1},{size:64,tip:{title:o.name,text:o.description||""}})});

window.badgesAdmin=async()=>{$("#vset").innerHTML='<p class="m">Loading…</p>';PICK={};await load();draw()};
})();