/* SOKO Smart admin: Categories tab with three levels.
   Main category (e.g. Shoes)  >  Category (e.g. Men Shoes, Ladies Shoes)  >  Sub category (e.g. Boots, Sneakers).
   Needs supabase-categories-tree.sql and supabase-subcategory-images.sql (sub category thumbnails). Uses admin.html globals: sb, sec, $, esc, toast, askConfirm, IBN, CATD.
   admin.html's cats() hands over to window.catTree() when this file is loaded. */
(()=>{
const MISS=/relation|does not exist|schema cache|could not find/i;
const SETUP="Not set up yet: run supabase-categories-tree.sql in the Supabase SQL editor, then reload.";
let ST={mains:[],cats:[],subs:[]},LASTMSG={t:"",bad:0};
const nextSort=a=>a.reduce((m,x)=>Math.max(m,+x.sort_order||0),0)+1;
const same=(a,b)=>String(a)===String(b);
async function upImg(file){if(!file)return null;
 if(!/^image\//.test(file.type)||file.size>2e6)throw new Error("The thumbnail must be an image under 2 MB");
 const uid=(await sb.auth.getSession()).data.session?.user.id;if(!uid)throw new Error("Please log in again");
 const ext=(file.name.split(".").pop()||"png").toLowerCase().replace(/[^a-z0-9]/g,"")||"png",path=`${uid}/subcat-${Date.now()}.${ext}`;
 const up=await sb.storage.from("listing-images").upload(path,file,{contentType:file.type});if(up.error)throw up.error;
 return sb.storage.from("listing-images").getPublicUrl(path).data.publicUrl}
const THUMB='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';

async function load(){
 const m=await sb.from("main_categories").select("*").eq("section",sec).order("sort_order").order("name");
 if(m.error)return{error:m.error.message};
 let c=await sb.from("categories").select("id,name,fields,main_id,sort_order").eq("section",sec).order("sort_order");
 if(c.error)return{error:c.error.message};
 const ids=(c.data||[]).map(x=>x.id);let s={data:[]};
 if(ids.length){s=await sb.from("subcategories").select("id,name,category_id,sort_order,image_url").in("category_id",ids).order("sort_order").order("name");if(s.error)return{error:s.error.message}}
 return{mains:m.data||[],cats:c.data||[],subs:s.data||[]}}

/* a small rename box (uses the shared dialog) */
const ask=(title,val)=>new Promise(res=>{const d=$("#dlg");let done=false;
 const fin=v=>{if(done)return;done=true;d.removeEventListener("close",oc);if(d.open)d.close();res(v)},oc=()=>fin(null);
 $("#dc").innerHTML=`<h3 style="margin:0 0 12px">${esc(title)}</h3><form id="ctr" style="display:grid;gap:12px"><input name="n" required maxlength="80" value="${esc(val)}"><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn" data-keep id="ctx">Cancel</button><button class="btn p" data-keep>Save</button></div></form>`;
 d.addEventListener("close",oc);$("#ctx").onclick=()=>fin(null);$("#ctr").onsubmit=e=>{e.preventDefault();fin($("#ctr").querySelector("[name=n]").value.trim()||null)};
 if(!d.open)d.showModal();$("#ctr").querySelector("[name=n]").select()});

const addForm=(attr,ph,label)=>`<form ${attr} style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px"><input name="n" required maxlength="80" placeholder="${esc(ph)}" aria-label="${esc(ph)}" style="flex:1;min-width:180px"><button class="btn s" data-keep>${esc(label)}</button></form>`;

function catBlock(c){
 const subs=ST.subs.filter(s=>same(s.category_id,c.id));
 const mv=`<select data-move="${c.id}" aria-label="Main category of ${esc(c.name)}" style="max-width:170px"><option value="">Unassigned</option>${ST.mains.map(m=>`<option value="${m.id}" ${same(m.id,c.main_id)?"selected":""}>${esc(m.name)}</option>`).join("")}</select>`;
 return `<div style="border-top:1px solid var(--bd);padding:10px 0;display:grid;gap:8px">
  <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b style="flex:1;min-width:120px">${esc(c.name)}</b>${mv}${sec==="products"?`<button class="btn s" data-cf="${c.id}">Form fields</button>`:""}<button class="ibn" data-cren="${c.id}" title="Rename" aria-label="Rename">${IBN.edit}</button><button class="ibn d" data-cd="${c.id}" title="Delete" aria-label="Delete">${IBN.del}</button></div>
  <div style="padding-left:14px;display:grid;gap:6px"><div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">${subs.map(s=>`<span class="pill" style="display:inline-flex;align-items:center;gap:6px"><label title="${s.image_url?"Change thumbnail":"Add thumbnail"}" style="cursor:pointer;display:inline-grid;place-items:center;width:34px;height:34px;border-radius:8px;border:1px dashed var(--bd);overflow:hidden;background:#fff;margin:0">${s.image_url?`<img src="${esc(s.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover">`:THUMB}<input type="file" accept="image/*" data-simg="${s.id}" hidden></label><span data-sren="${s.id}" title="Rename" style="cursor:pointer">${esc(s.name)}</span>${s.image_url?` <b data-simgdel="${s.id}" role="button" tabindex="0" title="Remove thumbnail" aria-label="Remove thumbnail of ${esc(s.name)}" style="cursor:pointer;font-weight:400;font-size:12px;color:var(--mut)">remove pic</b>`:""} <b data-sdel="${s.id}" role="button" tabindex="0" title="Delete" aria-label="Delete ${esc(s.name)}" style="cursor:pointer;margin-left:2px">×</b></span>`).join("")||'<span class="m">No sub categories yet</span>'}</div>
  <form data-subadd="${c.id}" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;align-items:center"><input name="n" required maxlength="80" placeholder="Add sub category, e.g. Boots" aria-label="Sub category name" style="flex:1;min-width:180px"><input name="img" type="file" accept="image/*" aria-label="Thumbnail (optional)" title="Thumbnail (optional)" style="max-width:210px"><button class="btn s" data-keep>Add sub category</button></form></div></div>`}

const mainCard=(m,list)=>`<section class="card" style="margin:0 0 14px"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><h2 style="margin:0;flex:1;font-size:18px">${esc(m.name)}</h2><span class="m">${list.length} categor${list.length===1?"y":"ies"}</span><button class="ibn" data-mren="${m.id}" title="Rename" aria-label="Rename">${IBN.edit}</button><button class="ibn d" data-mdel="${m.id}" title="Delete" aria-label="Delete">${IBN.del}</button></div>
 ${list.map(catBlock).join("")||'<p class="m" style="margin:8px 0 0">No categories yet. Add the first one below.</p>'}
 <div style="border-top:1px solid var(--bd);margin-top:6px;padding-top:6px">${addForm(`data-catadd="${m.id}"`,"Add category, e.g. Men Shoes","Add category")}</div></section>`;

function draw(box){
 const un=ST.cats.filter(c=>!ST.mains.some(m=>same(m.id,c.main_id)));
 CATD=Object.fromEntries(ST.cats.map(c=>[c.id,c]));
 box.innerHTML=`<div id="ctbar" style="position:sticky;top:0;z-index:5;background:var(--bg,#fff);border:1px solid var(--bd);border-radius:12px;padding:10px 12px;margin:0 0 12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="btn p" data-keep id="ctsave" type="button">Save all changes</button><span class="m" id="ctmsg" role="status" style="flex:1;min-width:200px">${esc(LASTMSG.t)}</span></div>
 <p class="m" style="margin:0 0 10px">Three levels: <b>Main category</b> (Shoes) → <b>Category</b> (Men Shoes, Ladies Shoes) → <b>Sub category</b> (Boots, Sneakers).</p>
 <form data-main style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px"><input name="n" required maxlength="80" placeholder="New main category, e.g. Shoes" aria-label="New main category" style="flex:1;min-width:200px"><button class="btn p" data-keep>Add main category</button></form>
 ${ST.mains.map(m=>mainCard(m,ST.cats.filter(c=>same(c.main_id,m.id)))).join("")}
 ${un.length||!ST.mains.length?`<section class="card" style="margin:0 0 14px"><h2 style="margin:0;font-size:18px">Unassigned categories</h2><p class="m" style="margin:2px 0 0">${un.length?"These are not under a main category yet. Use the dropdown on each one to move it.":"Add a main category above to get started."}</p>${un.map(catBlock).join("")}<div style="border-top:1px solid var(--bd);margin-top:6px;padding-top:6px">${addForm('data-catadd=""',"Add category without a main category","Add category")}</div></section>`:""}`}

function paintMsg(){const el=$("#ctmsg");if(el)el.style.color=LASTMSG.bad?"var(--r)":"inherit"}
async function saveAll(btn){
 btn.disabled=true;const msg=$("#ctmsg");msg.style.color="inherit";msg.textContent="Saving…";
 const box=$("#ctree"),jobs=[];
 /* anything typed in an "Add" box but not yet added is added now */
 box.querySelectorAll("form").forEach(f=>{const i=f.querySelector("[name=n]"),n=i&&i.value.trim();if(!n)return;
  jobs.push({kind:f.hasAttribute("data-main")?"main":f.hasAttribute("data-catadd")?"cat":f.hasAttribute("data-subadd")?"sub":"",id:f.getAttribute("data-catadd")||f.getAttribute("data-subadd")||"",n,file:(f.querySelector("[name=img]")||{files:[]}).files[0]})});
 let added=0,err="";
 try{for(const j of jobs){let r;
  if(j.kind==="main")r=await sb.from("main_categories").insert({section:sec,name:j.n,sort_order:nextSort(ST.mains)});
  else if(j.kind==="cat")r=await sb.from("categories").insert({section:sec,name:j.n,main_id:j.id?+j.id:null,sort_order:nextSort(ST.cats)});
  else if(j.kind==="sub"){const url=await upImg(j.file);r=await sb.from("subcategories").insert({category_id:+j.id,name:j.n,image_url:url,sort_order:nextSort(ST.subs.filter(x=>same(x.category_id,j.id)))})}
  else continue;
  if(r.error){err=r.error.message;break}added++;
  const d=await load();if(!d.error)ST=d}}
 catch(x){err=x.message||String(x)}
 if(err){LASTMSG={t:"Could not save everything: "+(MISS.test(err)?SETUP:err),bad:1};btn.disabled=false;await catTree();paintMsg();toast(LASTMSG.t,"error");return}
 /* read it all back from the database, as the website visitor would see it */
 const d=await load();if(d.error){LASTMSG={t:"Saved, but could not read it back: "+d.error,bad:1};await catTree();paintMsg();return}
 ST=d;let pub="";
 try{const mk=window.supabase&&window.supabase.createClient;
  if(mk&&sb.supabaseUrl){const a=mk(sb.supabaseUrl,sb.supabaseKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,storageKey:"soko-cat-check"}});
   const pm=await a.from("main_categories").select("id").eq("section",sec),pc=await a.from("categories").select("id").eq("section",sec),ids=ST.cats.map(c=>c.id);
   const ps=ids.length?await a.from("subcategories").select("id").in("category_id",ids):{data:[]};
   const bad=[];if(pm.error||(pm.data||[]).length<ST.mains.length)bad.push("main categories");if(pc.error||(pc.data||[]).length<ST.cats.length)bad.push("categories");if(ps.error||(ps.data||[]).length<ST.subs.length)bad.push("sub categories");
   if(bad.length)pub=" WARNING: visitors on the website cannot see your "+bad.join(", ")+" yet. Run supabase-subcategory-images.sql in the Supabase SQL editor, then press Save all changes again."}}catch(x){}
 const th=ST.subs.filter(x=>x.image_url).length;
 LASTMSG={t:"Saved"+(added?" ("+added+" new item"+(added===1?"":"s")+" added)":"")+". "+ST.mains.length+" main categories, "+ST.cats.length+" categories, "+ST.subs.length+" sub categories ("+th+" with thumbnails)."+pub,bad:pub?1:0};
 btn.disabled=false;await catTree();paintMsg();toast(pub?"Saved, but the website cannot see it yet.":"All changes saved.",pub?"error":undefined)}

async function catTree(){
 const vc=$("#vc");let box=$("#ctree");
 if(!box){box=document.createElement("div");box.id="ctree";vc.appendChild(box);wire(box)}
 const cf=$("#cf");if(cf)cf.style.display="none";const rw=$("#crows");if(rw&&rw.closest(".wrap"))rw.closest(".wrap").style.display="none";
 const hint=$("#chint");if(hint)hint.hidden=sec!=="products";
 if(!ST.mains.length&&!ST.cats.length)box.innerHTML='<p class="m">Loading…</p>';
 const d=await load();
 if(d.error){box.innerHTML=`<div class="msg">${esc(MISS.test(d.error)?SETUP:d.error)}</div>`;return}
 ST=d;draw(box);paintMsg()}
window.catTree=catTree;

async function run(p,ok){const r=await p;if(r.error){toast(MISS.test(r.error.message)?SETUP:r.error.message,"error");return false}if(ok)toast(ok);await catTree();return true}

function wire(box){
 box.addEventListener("submit",async e=>{const f=e.target;if(!f.matches("form"))return;e.preventDefault();const n=f.querySelector("[name=n]").value.trim();if(!n)return;
  if(f.hasAttribute("data-main"))run(sb.from("main_categories").insert({section:sec,name:n,sort_order:nextSort(ST.mains)}),"Main category added.");
  else if(f.hasAttribute("data-catadd")){const mid=f.getAttribute("data-catadd");run(sb.from("categories").insert({section:sec,name:n,main_id:mid?+mid:null,sort_order:nextSort(ST.cats)}),"Category added.")}
  else if(f.hasAttribute("data-subadd")){const cid=f.getAttribute("data-subadd");let url=null;
   try{url=await upImg(f.querySelector("[name=img]").files[0])}catch(x){toast(x.message||String(x),"error");return}
   run(sb.from("subcategories").insert({category_id:+cid,name:n,image_url:url,sort_order:nextSort(ST.subs.filter(s=>same(s.category_id,cid)))}),"Sub category added.")}});
 box.addEventListener("click",async e=>{let b;
  if(b=e.target.closest("#ctsave")){saveAll(b);return}
  if(b=e.target.closest("[data-mren]")){const m=ST.mains.find(x=>same(x.id,b.dataset.mren));if(!m)return;const n=await ask("Rename main category",m.name);if(n&&n!==m.name)run(sb.from("main_categories").update({name:n}).eq("id",m.id),"Renamed.")}
  else if(b=e.target.closest("[data-mdel]")){const m=ST.mains.find(x=>same(x.id,b.dataset.mdel));if(!m)return;
   if(await askConfirm({title:"Delete “"+m.name+"”?",msg:"Its categories and sub categories are kept and moved to Unassigned categories.",ok:"Yes, delete"}))run(sb.from("main_categories").delete().eq("id",m.id),"Main category deleted.")}
  else if(b=e.target.closest("[data-cren]")){const c=ST.cats.find(x=>same(x.id,b.dataset.cren));if(!c)return;const n=await ask("Rename category",c.name);if(n&&n!==c.name)run(sb.from("categories").update({name:n}).eq("id",c.id),"Renamed.")}
  else if(b=e.target.closest("[data-sren]")){const s=ST.subs.find(x=>same(x.id,b.dataset.sren));if(!s)return;const n=await ask("Rename sub category",s.name);if(n&&n!==s.name)run(sb.from("subcategories").update({name:n}).eq("id",s.id),"Renamed.")}
  else if(b=e.target.closest("[data-simgdel]"))run(sb.from("subcategories").update({image_url:null}).eq("id",b.dataset.simgdel),"Thumbnail removed.");
  else if(b=e.target.closest("[data-sdel]")){const s=ST.subs.find(x=>same(x.id,b.dataset.sdel));if(!s)return;
   if(await askConfirm({title:"Delete “"+s.name+"”?",msg:"Products in it stay listed, but lose this sub category.",ok:"Yes, delete"}))run(sb.from("subcategories").delete().eq("id",s.id),"Sub category deleted.")}});
 box.addEventListener("change",async e=>{const im=e.target.closest("[data-simg]");
  if(im){const f=im.files[0];if(!f)return;let url;try{toast("Uploading thumbnail…");url=await upImg(f)}catch(x){toast(x.message||String(x),"error");im.value="";return}
   run(sb.from("subcategories").update({image_url:url}).eq("id",im.dataset.simg),"Thumbnail saved.");return}
  const s=e.target.closest("[data-move]");if(s)run(sb.from("categories").update({main_id:s.value?+s.value:null}).eq("id",s.dataset.move),"Category moved.")})}
})();