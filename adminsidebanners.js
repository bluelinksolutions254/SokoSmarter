/* SOKO Smart admin: "Sidebar banners". Banners shown on the empty space left and right of a page, as a slideshow.
   Each banner chooses the page it appears on, so different pages can have different banners. Images and autoplay videos (muted, no controls).
   Stored in site_content, key "sidebar_banners". Uses admin.html globals: sb, $, esc, toast, askConfirm. Page id: sidebanners. */
(()=>{
const KEY="sidebar_banners";
const PAGES=[["home","Homepage"],["shop","Shop page"],["product","Product & shop pages"],["jobs","Jobs page"],["freelance","Freelance page"],["blog","Blog page"],["servicehub","Services page"],["all","All other pages (used when a page has none of its own)"]];
const PN=Object.fromEntries(PAGES);
const ANIMS=[["fade","Fade"],["slide","Slide sideways"],["slideup","Slide up"],["zoom","Zoom"],["flip","Flip"],["kenburns","Fade + slow zoom"],["none","No animation"]];
const AN=Object.fromEntries(ANIMS);
const SIDES=[["both","Both sides"],["left","Left side only"],["right","Right side only"]];
let C=null,ERR="",UID=null;
const isVid=u=>/\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(String(u||""));
const newId=()=>"sb"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const okLink=u=>!u||/^(https?:\/\/|[a-z0-9_\-./?=&%#]+$)/i.test(u);
const num=(v,a,b,d)=>Math.min(b,Math.max(a,+v||d));
const help=m=>/relation|does not exist|row-level|policy|permission/i.test(m||"")?"Could not use the site_content table: "+m:m;

async function load(){ERR="";let v=null;
 try{const r=await sb.from("site_content").select("value").eq("key",KEY).maybeSingle();if(r.error)ERR=help(r.error.message);else v=r.data&&r.data.value}catch(e){ERR=e.message||"Could not load."}
 const items=(v&&Array.isArray(v.items)?v.items:[]).filter(x=>x&&x.media).map(x=>({id:x.id||newId(),page:PN[x.page]?x.page:"home",side:["left","right","both"].includes(x.side)?x.side:"both",media:String(x.media),link:String(x.link||""),alt:String(x.alt||""),on:x.on!==false}));
 const pages={};if(v&&v.pages)Object.keys(v.pages).forEach(k=>{if(PN[k]){const p=v.pages[k]||{};pages[k]={speed:p.speed?num(p.speed,2,60,5):0,anim:AN[p.anim]?p.anim:""}}});
 C={enabled:!(v&&v.enabled===false),speed:num(v&&v.speed,2,60,5),anim:AN[v&&v.anim]?v.anim:"fade",items,pages}}
async function persist(){
 const {data,error}=await sb.from("site_content").upsert({key:KEY,value:C,updated_at:new Date().toISOString()},{onConflict:"key"}).select("key");
 if(error||!data||!data.length){toast(error?help(error.message):"Not saved. Check that admins may write to the site_content table.","error");return false}
 return true}
const thumb=(m,w,h)=>isVid(m)?`<video src="${esc(m)}" muted playsinline preload="metadata" style="width:${w}px;height:${h}px;object-fit:cover;border-radius:8px;border:1px solid var(--bd);background:#000"></video>`:`<img src="${esc(m)}" alt="" style="width:${w}px;height:${h}px;object-fit:cover;border-radius:8px;border:1px solid var(--bd)">`;

function draw(){
 const el=$("#vsb"),used=PAGES.filter(p=>C.items.some(i=>i.page===p[0]));
 const opt=(a,v)=>a.map(x=>`<option value="${x[0]}" ${x[0]===v?"selected":""}>${esc(x[1])}</option>`).join("");
 el.innerHTML=`<div class="ph"><h1>Sidebar banners</h1><p>Banners on the empty space on the left and right of a page. Choose the page for each banner, so different pages can have different banners. More than one banner on a side plays as a slideshow.</p></div>
 ${ERR?`<div class="msg" style="margin-bottom:14px">${esc(ERR)}</div>`:""}
 <section class="card" style="margin-bottom:16px"><h2 style="margin:0 0 8px">Size guide</h2><div class="wrap"><table style="min-width:520px"><tbody>
  <tr><td><b>Image size</b></td><td><b>1080 × 1920 px</b>, 9:16 portrait (the same shape as a TikTok video). It is shown at up to 300 × 533 px. JPG, PNG or WebP under 2 MB.</td></tr>
  <tr><td><b>Video</b></td><td>Also <b>1080 × 1920 px (9:16)</b>. MP4 (H.264) or WebM, under 8 MB, about 5–15 seconds. It plays by itself, muted, on a loop, with no controls.</td></tr>
  <tr><td>Frameless</td><td>The banner fills its space edge to edge with no border, frame or background, and nothing is cropped. Keep text about 60 px (of 1080) away from the edges.</td></tr>
  <tr><td>Size on screen (width × height)</td><td>1920 px screen: 300 × 533 · 1680: 232 × 412 · 1600: 192 × 341 · 1536: 160 × 284. Screens narrower than about 1,520 px do not show side banners.</td></tr>
  <tr><td>Where it sits</td><td><b>Homepage:</b> starts at the end of the header and is never taller than the space down to “New Arrivals”. <b>Other pages:</b> starts at the end of the header.</td></tr>
 </tbody></table></div></section>
 <section class="card" style="margin-bottom:16px"><h2 style="margin:0 0 10px">Slideshow settings</h2>
  <div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap"><label style="display:flex;flex-direction:row;gap:8px;align-items:center;font-weight:600"><input type="checkbox" id="sbEn" style="width:auto" ${C.enabled?"checked":""}> Show sidebar banners on the website</label>
   <label style="display:flex;flex-direction:row;gap:8px;align-items:center;font-weight:600">Time between slides <input type="number" id="sbSp" min="2" max="60" style="width:80px" value="${C.speed}"> seconds</label>
   <label style="display:flex;flex-direction:row;gap:8px;align-items:center;font-weight:600">Animation <select id="sbAn" style="width:auto">${opt(ANIMS,C.anim)}</select></label></div>
  ${used.length?`<h3 style="margin:16px 0 6px;font-size:15px">Different timing for a page (optional)</h3><p class="m" style="margin:0 0 8px">Leave “Default” to use the settings above.</p>
  <div style="display:grid;gap:8px">${used.map(p=>{const s=C.pages[p[0]]||{};return `<div style="display:grid;grid-template-columns:minmax(150px,1fr) 130px 190px;gap:10px;align-items:center"><b>${esc(p[1])}</b><label style="font-size:12.5px">Seconds<input type="number" min="2" max="60" placeholder="Default" data-sbpg="${p[0]}:speed" value="${s.speed||""}"></label><label style="font-size:12.5px">Animation<select data-sbpg="${p[0]}:anim"><option value="">Default</option>${opt(ANIMS,s.anim||"")}</select></label></div>`}).join("")}</div>`:""}
  <div style="margin-top:14px"><button class="btn p" data-keep id="sbSet" type="button">Save settings</button></div></section>
 <section class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px"><h2 style="margin:0">Banners</h2><button class="btn p" data-keep id="sbAdd" type="button">+ Add banner</button></div>
 ${C.items.length?PAGES.filter(p=>C.items.some(i=>i.page===p[0])).map(p=>{const L=C.items.filter(i=>i.page===p[0]);return `<h3 style="margin:14px 0 6px;font-size:15px">${esc(p[1])} <span class="m" style="font-weight:400">· ${L.length} banner${L.length===1?"":"s"}${L.length>1?" (slideshow)":""}</span></h3>
  <div class="wrap"><table style="min-width:640px"><thead><tr><th></th><th>Side</th><th>Link</th><th>Show</th><th>Actions</th></tr></thead><tbody>${L.map((i,k)=>`<tr><td><div style="width:44px">${thumb(i.media,44,78)}</div>${isVid(i.media)?'<div class="m">Video</div>':""}</td><td>${esc((SIDES.find(s=>s[0]===i.side)||[])[1]||"")}</td><td style="overflow-wrap:anywhere">${esc(i.link||"—")}</td>
   <td><input type="checkbox" style="width:auto" data-sbon="${esc(i.id)}" ${i.on?"checked":""} aria-label="Show this banner"></td>
   <td><div class="acts"><button class="btn s" type="button" data-sbed="${esc(i.id)}">Edit</button><button class="btn s" type="button" data-sbmv="${esc(i.id)}:-1" ${k?"":"disabled"}>↑</button><button class="btn s" type="button" data-sbmv="${esc(i.id)}:1" ${k<L.length-1?"":"disabled"}>↓</button><button class="btn s d" type="button" data-sbdel="${esc(i.id)}">Delete</button></div></td></tr>`).join("")}</tbody></table></div>`}).join(""):'<p class="m">No banners yet. Press “+ Add banner”.</p>'}</section>`}

function form(it){const ed=!!it;it=it||{id:"",page:"home",side:"both",media:"",link:"",alt:"",on:true};
 const opt=(a,v)=>a.map(x=>`<option value="${x[0]}" ${x[0]===v?"selected":""}>${esc(x[1])}</option>`).join("");
 $("#dc").innerHTML=`<h3 style="margin:0 0 10px">${ed?"Edit banner":"Add sidebar banner"}</h3><form id="sbf" data-id="${esc(it.id)}" novalidate style="display:grid;gap:12px">
  <label>Show on which page *<select name="page">${opt(PAGES,it.page)}</select></label>
  <label>Side *<select name="side">${opt(SIDES,it.side)}</select><span class="m">For a video on the left and an image on the right (or the other way round), add two banners: one “Left side only” and one “Right side only”.</span></label>
  <div id="sbpw" style="display:grid;gap:8px;justify-items:start;${it.media?"":"display:none"}"><div id="sbpv">${it.media?thumb(it.media,90,160):""}</div><button type="button" class="btn s" data-keep id="sbrm">Remove image</button></div>
  <label>Image or video file<input type="file" name="file" accept="image/*,video/mp4,video/webm"><span class="m">Image under 2 MB · video (MP4 or WebM) under 8 MB, plays by itself with no controls. Size: 1080 × 1920 px (9:16).</span></label>
  <label>…or paste an image or video link<input name="media" type="url" placeholder="https://…" value="${esc(it.media)}"></label>
  <label>Link when clicked (optional)<input name="link" placeholder="https://… or shop.html?category=3" value="${esc(it.link)}"></label>
  <label>Short description (optional)<input name="alt" maxlength="80" value="${esc(it.alt)}"></label>
  <label style="display:flex;flex-direction:row;gap:8px;align-items:center"><input type="checkbox" name="on" style="width:auto" ${it.on?"checked":""}> Show this banner</label>
  <div id="sbe" role="alert" style="color:var(--r);min-height:18px;font-size:14px"></div>
  <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap"><button type="button" class="btn" data-keep id="sbx">Cancel</button><button class="btn p" data-keep id="sbgo">Save banner</button></div></form>`;
 if(!$("#dlg").open)$("#dlg").showModal()}

async function save(f){
 const err=m=>{$("#sbe").textContent=m||""},go=$("#sbgo");err("");
 const file=f.file.files[0];let media=f.media.value.trim(),link=f.link.value.trim();
 if(!file&&!media)return err("Add an image or video, or paste a link to one.");
 if(media&&!/^https?:\/\//i.test(media))return err("The image or video link must start with https://");
 if(!okLink(link))return err("The click link must start with https:// or be a page like shop.html");
 go.disabled=true;go.textContent="Saving…";
 try{
  if(file){const v=/^video\//.test(file.type);
   if(!v&&!/^image\//.test(file.type))throw new Error("Choose an image, or an MP4 or WebM video.");
   if(v&&!/^video\/(mp4|webm)$/.test(file.type))throw new Error("Videos must be MP4 or WebM.");
   if(file.size>(v?8e6:2e6))throw new Error(v?"The video must be under 8 MB.":"The image must be under 2 MB.");
   const ext=(file.name.split(".").pop()||(v?"mp4":"png")).toLowerCase().replace(/[^a-z0-9]/g,"")||(v?"mp4":"png"),path=`${UID}/sidebar-${Date.now()}.${ext}`;
   const up=await sb.storage.from("listing-images").upload(path,file,{contentType:file.type});if(up.error)throw up.error;
   media=sb.storage.from("listing-images").getPublicUrl(path).data.publicUrl}
  const id=f.dataset.id,row={id:id||newId(),page:f.page.value,side:f.side.value,media,link,alt:f.alt.value.trim(),on:f.on.checked};
  const before=JSON.stringify(C.items);
  if(id){const i=C.items.findIndex(x=>x.id===id);if(i>=0)C.items[i]=row;else C.items.push(row)}else C.items.push(row);
  if(!(await persist())){C.items=JSON.parse(before);go.disabled=false;go.textContent="Save banner";return}
  $("#dlg").close();toast("Banner saved. It is live on the website.");draw()
 }catch(x){err(x.message||String(x));go.disabled=false;go.textContent="Save banner"}}

document.addEventListener("click",async e=>{
 if(!C||!document.getElementById("vsb")||document.getElementById("vsb").hidden){if(e.target.closest("#sbx"))$("#dlg").close();return}
 if(e.target.closest("#sbx")){$("#dlg").close();return}
 if(e.target.closest("#sbrm")){const f=$("#sbf");if(f){f.file.value="";f.media.value=""}$("#sbpv").innerHTML="";$("#sbpw").style.display="none";return}
 let b;
 if(e.target.closest("#sbAdd")){form();return}
 if(b=e.target.closest("[data-sbed]")){form(C.items.find(x=>x.id===b.dataset.sbed));return}
 if(b=e.target.closest("[data-sbdel]")){const it=C.items.find(x=>x.id===b.dataset.sbdel);if(!it)return;
  if(!await askConfirm({title:"Delete this banner?",msg:"It disappears from the website right away.",ok:"Yes, delete"}))return;
  const before=C.items.slice();C.items=C.items.filter(x=>x.id!==it.id);if(await persist()){toast("Banner deleted.");draw()}else C.items=before;return}
 if(b=e.target.closest("[data-sbmv]")){const [id,d]=b.dataset.sbmv.split(":"),i=C.items.findIndex(x=>x.id===id);if(i<0)return;
  const pg=C.items[i].page;let j=i+ +d;while(j>=0&&j<C.items.length&&C.items[j].page!==pg)j+=+d;if(j<0||j>=C.items.length)return;
  [C.items[i],C.items[j]]=[C.items[j],C.items[i]];if(await persist())draw();return}
 if(e.target.closest("#sbSet")){const btn=e.target.closest("#sbSet");btn.disabled=true;
  C.enabled=$("#sbEn").checked;C.speed=num($("#sbSp").value,2,60,5);C.anim=$("#sbAn").value;
  const pg={};document.querySelectorAll("#vsb [data-sbpg]").forEach(x=>{const [p,k]=x.dataset.sbpg.split(":");pg[p]=pg[p]||{speed:0,anim:""};if(k==="speed")pg[p].speed=x.value?num(x.value,2,60,5):0;else pg[p].anim=x.value});
  C.pages=pg;const ok=await persist();btn.disabled=false;if(ok){toast("Slideshow settings saved.");draw()}}});
document.addEventListener("change",async e=>{
 if(e.target.matches("#sbf [name=file]")){const f=e.target.files[0],pv=$("#sbpv"),pw=$("#sbpw");if(!f||!pv)return;const u=URL.createObjectURL(f);
  pv.innerHTML=/^video\//.test(f.type)?`<video src="${u}" muted playsinline autoplay loop style="width:90px;height:160px;object-fit:cover;border-radius:8px;background:#000"></video>`:`<img src="${u}" alt="" style="width:90px;height:160px;object-fit:cover;border-radius:8px">`;pw.style.display="grid";return}
 const t=e.target.closest&&e.target.closest("[data-sbon]");if(t&&C){const it=C.items.find(x=>x.id===t.dataset.sbon);if(!it)return;it.on=t.checked;if(await persist())toast(it.on?"Banner is showing.":"Banner hidden.");else{it.on=!t.checked;t.checked=it.on}}});
document.addEventListener("submit",e=>{if(e.target.id==="sbf"){e.preventDefault();save(e.target)}});

window.sideBannersAdmin=async()=>{
 const el=$("#vsb");el.innerHTML='<p class="m">Loading…</p>';
 try{UID=(await sb.auth.getSession()).data.session?.user.id}catch(e){}
 await load();draw()};
})();