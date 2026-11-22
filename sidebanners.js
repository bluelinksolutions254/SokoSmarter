/* SOKO Smart website: sidebar banners (slideshows, images and autoplay videos) on the empty space left and right of the content.
   Managed in Admin > Sidebar banners (site_content key "sidebar_banners"). Each banner chooses its page.
   TikTok shape (9:16), frameless. Homepage: starts at the end of the header, never taller than the space down to "New Arrivals".
   Needs the global `sb` (Supabase client). Add <script src="sidebanners.js"></script> to every page that should show them. */
(()=>{
if(window.__sideBanners)return;window.__sideBanners=1;
const CONTENT=1160,MINW=130,MAXW=300,GAP=16,OTHERH=520,MINSCREEN=1200;
const FILES={"":"home","index.html":"home","shop.html":"shop","product.html":"product","jobs.html":"jobs","freelance.html":"freelance","blog.html":"blog","servicehub.html":"servicehub"};
const page=FILES[(location.pathname.split("/").pop()||"").toLowerCase()];if(!page)return;
const E=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safe=u=>{u=String(u||"").trim();return /^(https?:\/\/|[a-z0-9_\-./?=&%#]+$)/i.test(u)?u:""};
const isVid=u=>/\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(String(u||""));
const css=document.createElement("style");css.textContent=`
.sbr{position:absolute;top:16px;z-index:5;border-radius:0;overflow:hidden;background:transparent;box-shadow:none;border:0;display:none}
.sbr.on{display:block}
.sbr .sbs{position:absolute;inset:0;visibility:hidden;opacity:0}
.sbr .sbs a,.sbr .sbs>div{display:block;width:100%;height:100%}
.sbr img,.sbr video{width:100%;height:100%;object-fit:cover;object-position:center;display:block;pointer-events:none;background:transparent}
.sbr .sbd{position:absolute;left:0;right:0;bottom:8px;display:flex;gap:6px;justify-content:center;z-index:3}
.sbr .sbd button{width:8px;height:8px;border-radius:50%;border:0;padding:0;background:rgba(255,255,255,.65);box-shadow:0 0 0 1px rgba(0,0,0,.25);cursor:pointer}
.sbr .sbd button.on{background:#F58E20;box-shadow:0 0 0 1px #fff}
.sbr .sbt{position:absolute;top:6px;left:6px;z-index:3;background:rgba(0,0,0,.35);color:#fff;font:700 10px/1 system-ui,sans-serif;border-radius:4px;padding:3px 5px;letter-spacing:.04em;pointer-events:none}
/* animations */
.sbr[data-anim=none] .sbs.on,.sbr:not([data-anim]) .sbs.on{opacity:1;visibility:visible}
.sbr[data-anim=fade] .sbs,.sbr[data-anim=kenburns] .sbs{transition:opacity .8s ease,visibility .8s}
.sbr[data-anim=fade] .sbs.on,.sbr[data-anim=kenburns] .sbs.on{opacity:1;visibility:visible}
.sbr[data-anim=kenburns] .sbs.on img,.sbr[data-anim=kenburns] .sbs.on video{animation:sbk 9s ease-out both}
@keyframes sbk{from{transform:scale(1)}to{transform:scale(1.12)}}
.sbr[data-anim=slide] .sbs{opacity:1;transform:translateX(100%);transition:none}
.sbr[data-anim=slide] .sbs.on{visibility:visible;transform:none;transition:transform .7s cubic-bezier(.2,.7,.2,1)}
.sbr[data-anim=slide] .sbs.out{visibility:visible;transform:translateX(-100%);transition:transform .7s cubic-bezier(.2,.7,.2,1)}
.sbr[data-anim=slideup] .sbs{opacity:1;transform:translateY(100%);transition:none}
.sbr[data-anim=slideup] .sbs.on{visibility:visible;transform:none;transition:transform .7s cubic-bezier(.2,.7,.2,1)}
.sbr[data-anim=slideup] .sbs.out{visibility:visible;transform:translateY(-100%);transition:transform .7s cubic-bezier(.2,.7,.2,1)}
.sbr[data-anim=zoom] .sbs{transform:scale(1.25);transition:opacity .8s ease,transform .8s ease,visibility .8s}
.sbr[data-anim=zoom] .sbs.on{opacity:1;visibility:visible;transform:none}
.sbr[data-anim=flip]{perspective:900px}
.sbr[data-anim=flip] .sbs{transform:rotateY(90deg);backface-visibility:hidden;transition:opacity .7s ease,transform .7s ease,visibility .7s}
.sbr[data-anim=flip] .sbs.on{opacity:1;visibility:visible;transform:none}
@media(prefers-reduced-motion:reduce){.sbr .sbs{transition:none!important}.sbr .sbs img,.sbr .sbs video{animation:none!important}}`;
document.head.appendChild(css);

let rails={},fixedH=page!=="home";
const fit=cw=>{let st=document.getElementById("sbfit");if(!cw){if(st)st.remove();return}if(!st){st=document.createElement("style");st.id="sbfit";document.head.appendChild(st)}st.textContent=".w{max-width:"+cw+"px!important}"};
const vid=(u,first)=>`<video src="${E(u)}" ${first?"autoplay ":""}muted loop playsinline preload="${first?"auto":"metadata"}" disablepictureinpicture disableremoteplayback tabindex="-1" aria-hidden="true"></video>`;
function build(side,list,speed,anim){
 const el=document.createElement("aside");el.className="sbr";el.dataset.side=side;el.dataset.anim=anim;el.setAttribute("aria-label","Advertisement");
 el.innerHTML=`<span class="sbt">AD</span>`+list.map((x,i)=>{const u=safe(x.link),m=isVid(x.media)?vid(x.media,i===0):`<img loading="${i?"lazy":"eager"}" alt="${E(x.alt||"")}" src="${E(x.media)}">`;
  return `<div class="sbs ${i?"":"on"}">${u?`<a href="${E(u)}" ${/^https?:\/\//i.test(u)&&u.indexOf(location.origin)!==0?'target="_blank" rel="noopener noreferrer"':""} ${x.alt?`aria-label="${E(x.alt)}"`:""}>${m}</a>`:`<div>${m}</div>`}</div>`}).join("")
  +(list.length>1?`<div class="sbd">${list.map((_,i)=>`<button type="button" class="${i?"":"on"}" aria-label="Show banner ${i+1}"></button>`).join("")}</div>`:"");
 const sl=[...el.querySelectorAll(".sbs")],dt=[...el.querySelectorAll(".sbd button")];let i=0,t;
 const play=s=>{const v=s&&s.querySelector("video");if(v){v.muted=true;try{v.currentTime=0}catch(e){}const p=v.play();if(p&&p.catch)p.catch(()=>{})}};
 const stop=s=>{const v=s&&s.querySelector("video");if(v)v.pause()};
 const go=n=>{const old=sl[i];i=(n+sl.length)%sl.length;if(sl[i]===old)return;old.classList.remove("on");old.classList.add("out");setTimeout(()=>{old.classList.remove("out");stop(old)},900);sl[i].classList.add("on");play(sl[i]);dt.forEach((d,k)=>d.classList.toggle("on",k===i))};
 const auto=()=>{clearInterval(t);if(sl.length>1&&!matchMedia("(prefers-reduced-motion:reduce)").matches)t=setInterval(()=>go(i+1),speed*1000)};
 dt.forEach((d,k)=>d.onclick=()=>{go(k);auto()});
 if(sl.length>1){el.addEventListener("mouseenter",()=>clearInterval(t));el.addEventListener("mouseleave",auto)}
 auto();
 /* some browsers pause autoplay videos until the first touch or click */
 document.addEventListener("click",()=>{const s=sl[i],v=s&&s.querySelector("video");if(v&&v.paused)play(s)},{once:true,passive:true});
 return el}

function hideAll(){Object.values(rails).forEach(r=>r.classList.remove("on"));fit(0)}
function place(){
 const main=document.querySelector("main");if(!main||!Object.keys(rails).length)return;
 if(innerWidth<MINSCREEN){hideAll();return}
 let free=(innerWidth-CONTENT)/2,w=Math.min(MAXW,Math.floor(free-GAP));
 /* laptops: not enough free space beside the 1160px content, so the content gets a little narrower to make room */
 if(w<MINW){w=MINW;free=MINW+GAP;fit(innerWidth-2*free)}else fit(0)
 const mt=main.getBoundingClientRect().top+scrollY;
 /* TikTok shape: always 9:16. On the homepage it is never taller than the space down to New Arrivals. */
 if(page==="home"){const home=document.getElementById("home");if(!home){hideAll();return}
  const secs=[...home.querySelectorAll(".hs")],na=secs.find(s=>/new\s*arrivals/i.test((s.querySelector("h2")||{}).textContent||""))||secs[0];
  if(!na){hideAll();return}const room=Math.round(na.getBoundingClientRect().top+scrollY+18-mt-16);
  if(room<w*16/9)w=Math.floor(room*9/16)}
 else{const room=Math.round(main.offsetHeight-32);if(room<w*16/9)w=Math.floor(room*9/16)}
 if(w<MINW){hideAll();return}
 const h=Math.round(w*16/9),edge=Math.max(8,Math.floor((free-w)/2));
 for(const [s,r] of Object.entries(rails)){r.style.width=w+"px";r.style.height=h+"px";r.style[s==="left"?"left":"right"]=edge+"px";r.classList.add("on")}}

async function init(){
 if(typeof sb==="undefined"||!sb)return;let cfg=null;
 try{const r=await sb.from("site_content").select("value").eq("key","sidebar_banners").maybeSingle();cfg=r.data&&r.data.value}catch(e){}
 if(!cfg||cfg.enabled===false)return;
 const all=(Array.isArray(cfg.items)?cfg.items:[]).filter(x=>x&&x.media&&x.on!==false);
 let key=page,mine=all.filter(x=>x.page===page);if(!mine.length){key="all";mine=all.filter(x=>x.page==="all")}
 if(!mine.length)return;
 const P=(cfg.pages&&cfg.pages[key])||{},ok=["fade","slide","slideup","zoom","flip","kenburns","none"],
  speed=Math.min(60,Math.max(2,+P.speed||+cfg.speed||5)),anim=ok.includes(P.anim)?P.anim:ok.includes(cfg.anim)?cfg.anim:"fade";
 const main=document.querySelector("main");if(!main)return;
 if(getComputedStyle(main).position==="static")main.style.position="relative";
 for(const side of ["left","right"]){const list=mine.filter(x=>x.side===side||x.side==="both"||!x.side);if(!list.length)continue;
  rails[side]=build(side,list,speed,anim);main.appendChild(rails[side])}
 if(!Object.keys(rails).length)return;
 place();addEventListener("resize",place);addEventListener("load",place);
 const home=document.getElementById("home")||main;if(window.ResizeObserver)new ResizeObserver(place).observe(home);
 let n=0;const iv=setInterval(()=>{place();if(++n>12)clearInterval(iv)},500)}

document.readyState==="loading"?document.addEventListener("DOMContentLoaded",init):init();
})();