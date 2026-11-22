/* SOKO Smart homepage: Main Categories sidebar with a hover flyout.
   Hover a Main category -> popup lists each Category (name) with its Sub categories (thumbnail + name) underneath.
   Needs: <div id="catSide"></div> on index.html, the Supabase client as global `sb` (or window.supabase client in `sbClient`),
   and supabase-subcategory-images.sql. Data comes from the admin Categories tab. */
(()=>{
const SECTION="products", box=document.getElementById("catSide");if(!box)return;
const db=window.sb||window.sbClient||window.db;if(!db){console.warn("catSide: Supabase client not found");return}
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const css=document.createElement("style");css.textContent=`
#catSide{position:relative;width:250px;background:#fff;border:1px solid #e8e8e8;border-radius:10px;z-index:30;font-family:inherit}
#catSide .cs-h{background:#16A34A;color:#fff;font-weight:700;padding:11px 14px;border-radius:10px 10px 0 0;display:flex;gap:8px;align-items:center}
#catSide .cs-l{list-style:none;margin:0;padding:4px 0}
#catSide .cs-i{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 14px;font-size:14px;color:#222;cursor:pointer;text-decoration:none}
#catSide .cs-i:after{content:"›";color:#999;font-size:18px;line-height:1}
#catSide li.on>.cs-i{background:#F0FDF4;color:#16A34A;font-weight:600}
#catSide .cs-p{display:none;position:absolute;left:100%;top:0;width:min(760px,calc(100vw - 290px));min-height:100%;max-height:520px;overflow:auto;background:#fff;border:1px solid #e8e8e8;border-radius:0 10px 10px 0;box-shadow:0 12px 30px rgba(0,0,0,.14);padding:16px 20px;box-sizing:border-box}
#catSide li.on>.cs-p{display:block}
#catSide .cs-c{margin-bottom:16px}
#catSide .cs-ct{font-weight:700;font-size:15px;color:#111;padding-bottom:6px;margin-bottom:10px;border-bottom:1px solid #eee;display:block;text-decoration:none}
#catSide .cs-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:12px}
#catSide .cs-s{display:grid;justify-items:center;gap:6px;text-align:center;font-size:12.5px;color:#333;text-decoration:none}
#catSide .cs-s:hover{color:#16A34A}
#catSide .cs-s img,#catSide .cs-s .cs-ph{width:68px;height:68px;border-radius:10px;object-fit:cover;background:#f3f4f6;display:grid;place-items:center;color:#aaa;font-weight:700}
#catSide .cs-e{color:#888;font-size:13px}
@media(max-width:900px){#catSide{width:100%}#catSide .cs-p{position:static;width:auto;max-height:none;border:0;box-shadow:none;padding:8px 14px}}`;
document.head.appendChild(css);

const link=(p)=>"browse.html?"+p;
function draw(M,C,S){
 const un=C.filter(c=>!M.some(m=>String(m.id)===String(c.main_id)));
 const list=M.map(m=>({id:m.id,name:m.name,cats:C.filter(c=>String(c.main_id)===String(m.id))}));
 if(un.length)list.push({id:"x",name:"Other",cats:un});
 box.innerHTML=`<div class="cs-h">☰ Category</div><ul class="cs-l">${list.map(m=>`<li data-m="${m.id}"><a class="cs-i" href="${link("main="+encodeURIComponent(m.id))}">${esc(m.name)}</a>
  <div class="cs-p">${m.cats.map(c=>{const ss=S.filter(s=>String(s.category_id)===String(c.id));
   return `<div class="cs-c"><a class="cs-ct" href="${link("category="+c.id)}">${esc(c.name)}</a>${ss.length?`<div class="cs-g">${ss.map(s=>`<a class="cs-s" href="${link("category="+c.id+"&sub="+s.id)}">${s.image_url?`<img loading="lazy" src="${esc(s.image_url)}" alt="${esc(s.name)}">`:`<span class="cs-ph">${esc(s.name.charAt(0).toUpperCase())}</span>`}<span>${esc(s.name)}</span></a>`).join("")}</div>`:'<span class="cs-e">No sub categories yet</span>'}</div>`}).join("")||'<span class="cs-e">No categories yet</span>'}</div></li>`).join("")}</ul>`;
 let t;const lis=[...box.querySelectorAll("li[data-m]")];
 const set=li=>lis.forEach(x=>x.classList.toggle("on",x===li));
 lis.forEach(li=>{li.addEventListener("mouseenter",()=>{clearTimeout(t);set(li)});li.addEventListener("mouseleave",()=>{t=setTimeout(()=>set(null),120)});
  li.querySelector(".cs-i").addEventListener("click",e=>{if(matchMedia("(hover:none)").matches&&!li.classList.contains("on")){e.preventDefault();set(li)}})})}
(async()=>{
 const m=await db.from("main_categories").select("id,name").eq("section",SECTION).order("sort_order").order("name");
 const c=await db.from("categories").select("id,name,main_id").eq("section",SECTION).order("sort_order");
 if(m.error||c.error){console.warn("catSide",(m.error||c.error).message);return}
 const ids=(c.data||[]).map(x=>x.id);let s={data:[]};
 if(ids.length)s=await db.from("subcategories").select("id,name,category_id,image_url").in("category_id",ids).order("sort_order").order("name");
 draw(m.data||[],c.data||[],s.data||[])})();
})();