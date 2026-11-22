/* SOKO Smart website: badge artwork, level coins, levels and the profile showcase. Needs the global `sb` for showcase().
   Two looks:  automatic badges  = red & gold seal with laurel wreath, stars (1-4 = tier) and a banner;
               badges the admin hands out (manual) = pleated metal rosette with laurel ring, star ring and two ribbon tails.
   Badge pictures use line icons (no emojis). The badge's `icon` field may hold an icon name (see SokoBadges.ICONS)
   or an old emoji, which is converted to the matching icon automatically.
   SokoBadges.medal(badge,{size,locked,name,tip})  -> one badge. tip = text or {title,text,extra}: shown on hover / keyboard focus / tap
   SokoBadges.icon(name,size,color)                -> a plain line icon
   SokoBadges.coin(levelIndex,size)                -> Bronze..Diamond level coin
   SokoBadges.level(points)                        -> {index,name,color,next,toNext,pct}
   SokoBadges.showcase(userId,element)             -> a member's featured badges */
(()=>{
const LEVELS=[["Bronze","#CD7F32",0],["Silver","#B8C0CC",150],["Gold","#F5B335",400],["Platinum","#D9E2EC",1000],["Diamond","#3B9BFF",2500]];
const E=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const f=n=>n.toFixed(1);

/* ---------- line icons (24 x 24 grid) ---------- */
const IC={
 star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
 trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a2 2 0 0 0 0 4h3M16 6h3a2 2 0 0 1 0 4h-3"/><path d="M12 13v4M8 20h8M9.5 17h5"/>',
 medal:'<circle cx="12" cy="15" r="5"/><path d="M8.7 11L6 3h4.2L12 7.5 13.8 3H18l-2.7 8"/><path d="M12 12.8v4.4M10 15h4"/>',
 heart:'<path d="M12 20s-8-4.600-8.700-10A4.700 4.700 0 0 1 12 7.300 4.700 4.700 0 0 1 20.700 10C20 15.400 12 20 12 20z"/>',
 shield:'<path d="M12 3l7 3v5c0 5-3 8.500-7 10-4-1.500-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
 check:'<circle cx="12" cy="12" r="9"/><path d="M8 12.500l3 3 5-6"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.400 3.600-7 8-7s8 2.600 8 7"/>',
 users:'<circle cx="9" cy="8" r="3.500"/><path d="M2.500 20c0-3.800 2.900-6 6.500-6s6.500 2.200 6.500 6"/><circle cx="17" cy="9" r="2.800"/><path d="M17 14c3 0 4.500 1.800 4.500 5"/>',
 store:'<path d="M4 9l1.500-5h13L20 9"/><path d="M4 9a2.700 2.700 0 0 0 5.300 0 2.700 2.700 0 0 0 5.400 0A2.700 2.700 0 0 0 20 9"/><path d="M5 12v8h14v-8"/><path d="M10 20v-5h4v5"/>',
 box:'<path d="M3.500 7.500L12 3l8.500 4.500v9L12 21l-8.500-4.500z"/><path d="M3.500 7.500L12 12l8.500-4.500M12 12v9"/>',
 cart:'<circle cx="9" cy="20" r="1.500"/><circle cx="17" cy="20" r="1.500"/><path d="M2 3h3l2.500 12h11l2-8H6"/>',
 briefcase:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4.500h6V7M3 13h18"/>',
 chat:'<path d="M21 12a8 8 0 0 1-11.600 7.100L4 20l1-4.600A8 8 0 1 1 21 12z"/>',
 flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
 gift:'<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M12 9v12M3 13h18M7.500 9C5 9 5 4.500 8 4.500 10.500 4.500 12 9 12 9s1.500-4.500 4-4.500c3 0 3 4.500.5 4.500"/>',
 bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
 rocket:'<path d="M12 15l-3-3a15 15 0 0 1 4-8 12 12 0 0 1 7-1 12 12 0 0 1-1 7 15 15 0 0 1-8 4z"/><circle cx="15" cy="9" r="1.500"/><path d="M9 12H5l-2 2 4 1M12 15v4l-2 2-1-4"/>',
 crown:'<path d="M3 8l4.500 4L12 5l4.500 7L21 8l-2 11H5z"/>',
 camera:'<path d="M4 8h3l1.500-2.500h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.500"/>',
 pin:'<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.500"/>',
 target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.200"/>',
 gem:'<path d="M6 4h12l3 5-9 11L3 9z"/><path d="M3 9h18M9 4l-2 5 5 11 5-11-2-5"/>',
 pen:'<path d="M12 20h9"/><path d="M16.500 3.500a2.100 2.100 0 0 1 3 3L7 19l-4 1 1-4z"/>',
 megaphone:'<path d="M3 11v3h3l7 4V7L6 11z"/><path d="M16.500 9a4 4 0 0 1 0 6M19 6.500a8 8 0 0 1 0 11"/>',
 dollar:'<circle cx="12" cy="12" r="9"/><path d="M14.500 9.500a2.500 2 0 0 0-2.500-1.500c-1.500 0-2.500.8-2.500 2s1 1.700 2.500 2 2.500.8 2.500 2-1 2-2.500 2a2.600 2 0 0 1-2.500-1.500M12 6v2M12 16v2"/>',
 leaf:'<path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15z"/><path d="M5 19l9-9"/>',
 book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M9 7h6"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.900 4.900L7 7M17 17l2.100 2.100M19.100 4.900L17 7M7 17l-2.100 2.100"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 truck:'<path d="M2 6h11v10H2zM13 9h4l4 4v3h-8"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
 tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.500" cy="8.500" r="1.200"/>',
 lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
 thumb:'<path d="M7 11v9H3v-9zM7 11l4-8c2 0 3 1.500 2.500 3.500L13 9h6a2 2 0 0 1 2 2.300l-1.300 7A2 2 0 0 1 17.700 20H7"/>',
 sparkle:'<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/><path d="M19 3v4M17 5h4"/>',
 flame:'<path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-7-1 2-2 3-3 3 0-3-1-6-4-9-1 4-4 6-4 12 0 4 3 8 7 8z"/>',
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
 home:'<path d="M3 11l9-8 9 8M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
 bell:'<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>'
};
const ICONS=Object.keys(IC);
/* old emojis -> icon names */
const EM={"🏅":"medal","🥇":"medal","🥈":"medal","🥉":"medal","🎖":"medal","🏆":"trophy","⭐":"star","🌟":"star","💫":"sparkle","✨":"sparkle","🎉":"sparkle","🎊":"sparkle",
 "❤":"heart","💚":"heart","💛":"heart","💙":"heart","🤝":"users","👥":"users","🧑":"user","👤":"user","🙋":"user","🛒":"cart","🛍":"cart","🏪":"store","🏬":"store","📦":"box",
 "💼":"briefcase","💬":"chat","🗣":"chat","🚀":"rocket","⚡":"bolt","🔥":"flame","👑":"crown","🎁":"gift","✅":"check","✔":"check","🛡":"shield","📸":"camera","📷":"camera",
 "📍":"pin","🎯":"target","💎":"gem","✍":"pen","📝":"pen","📢":"megaphone","📣":"megaphone","💰":"dollar","💵":"dollar","🪙":"dollar","🌱":"leaf","🌿":"leaf","📚":"book","🎓":"book",
 "🔧":"gear","🛠":"gear","⚙":"gear","📅":"calendar","⏰":"clock","⏱":"clock","🚚":"truck","🏷":"tag","🔒":"lock","👍":"thumb","🌍":"globe","🌐":"globe","🏠":"home","📧":"mail","✉":"mail","🔔":"bell"};
const KW=[[/seller|shop|store|merchant/i,"store"],[/buyer|purchas|order|shopper/i,"cart"],[/freelanc|gig|hire|client|employer|job/i,"briefcase"],[/review|rating|rated/i,"star"],
 [/verif|trust|safe|secure/i,"shield"],[/photo|picture|image/i,"camera"],[/help|support|chat|message|communit/i,"chat"],[/gift|free|donat|charit|give/i,"gift"],[/deliver|ship/i,"truck"],
 [/top|best|elite|champion|winner|star/i,"trophy"],[/year|anniversar|veteran/i,"calendar"],[/fast|speed|quick/i,"bolt"],[/love|thank|kind/i,"heart"],[/profile|member|welcome|join|first/i,"user"]];
const pick=b=>{const raw=String(b.icon||"").trim();if(IC[raw])return raw;
 const cp=[...raw.replace(/\uFE0F/g,"")][0];if(cp&&EM[cp])return EM[cp];
 const t=(b.name||"")+" "+(b.id||"");for(const [re,n] of KW)if(re.test(t))return n;return "medal"};
const glyph=(n,x,y,size,stroke,sw)=>`<g transform="translate(${f(x)} ${f(y)}) scale(${(size/24).toFixed(3)})" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${IC[n]||IC.medal}</g>`;
const icon=(n,size,color)=>`<svg viewBox="0 0 24 24" width="${size||20}" height="${size||20}" fill="none" stroke="${color||"currentColor"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]||IC.medal}</svg>`;

/* ---------- shapes, built once ---------- */
const saw=(cx,cy,ro,ri,n)=>{let d="";for(let k=0;k<n*2;k++){const a=k*Math.PI/n-Math.PI/2,r=k%2?ri:ro;d+=(k?"L":"M")+f(cx+r*Math.cos(a))+" "+f(cy+r*Math.sin(a))}return d+"Z"};
const laurel=(cx,cy,r)=>{let o="";for(let i=0;i<7;i++){const deg=105+i*19,a=deg*Math.PI/180,x=cx+r*Math.cos(a),y=cy+r*Math.sin(a),rot=deg+90-22,x2=2*cx-x;
 o+=`<ellipse cx="${f(x)}" cy="${f(y)}" rx="5.4" ry="2.3" transform="rotate(${rot.toFixed(0)} ${f(x)} ${f(y)})"/><ellipse cx="${f(x2)}" cy="${f(y)}" rx="5.4" ry="2.3" transform="rotate(${(180-rot).toFixed(0)} ${f(x2)} ${f(y)})"/>`}return o};
const dots=(cx,cy,r,n)=>{let o="";for(let i=0;i<n;i++){const a=i/n*Math.PI*2;o+=`<circle cx="${f(cx+r*Math.cos(a))}" cy="${f(cy+r*Math.sin(a))}" r=".95"/>`}return o};
const SAW=saw(60,46,46,41.5,32),LAUREL=laurel(60,47,29),DOTS=dots(60,46,17.2,24);
const WORDS=["NEW","STAR","PRO","ELITE"];
const stars=t=>{let o="";for(let i=0;i<t;i++)o+=`<text x="${f(60+(i-(t-1)/2)*8)}" y="19.5" font-size="7" text-anchor="middle" fill="url(#bgG)">★</text>`;return o};

/* rosette (admin badges): centre 60,52 */
const RX=60,RY=52,P=(r,a)=>f(RX+r*Math.cos(a))+" "+f(RY+r*Math.sin(a));
const pleats=(n,r1,r2,odd)=>{let d="";for(let k=odd?1:0;k<n;k+=2){const da=Math.PI*2/n,a0=k*da-Math.PI/2,a1=a0+da,am=a0+da/2;
 d+=`M${P(r1,a0)}L${P(r2-1.2,a0+da*.12)}Q${P(r2+2.8,am)} ${P(r2-1.2,a1-da*.12)}L${P(r1,a1)}Z`}return d};
const RUF_E=pleats(24,30,47,0),RUF_O=pleats(24,30,47,1);
const leaves=(n,r)=>{let o="";for(let i=0;i<n;i++){const a=i/n*Math.PI*2,x=RX+r*Math.cos(a),y=RY+r*Math.sin(a),deg=a*180/Math.PI+90-38;o+=`<ellipse cx="${f(x)}" cy="${f(y)}" rx="3.3" ry="1.3" transform="rotate(${deg.toFixed(0)} ${f(x)} ${f(y)})"/>`}return o};
const LEAVES=leaves(30,29.6);
const star5=(cx,cy,r)=>{let d="";for(let k=0;k<10;k++){const a=k*Math.PI/5-Math.PI/2,rr=k%2?r*.45:r;d+=(k?"L":"M")+f(cx+rr*Math.cos(a))+" "+f(cy+rr*Math.sin(a))}return d+"Z"};
let SR="";for(let i=0;i<10;i++){const a=i/10*Math.PI*2-Math.PI/2;SR+=star5(RX+22.6*Math.cos(a),RY+22.6*Math.sin(a),2.3)}
/* two ribbon tails, swallow-tailed; the right one mirrors the left */
const TL_=[[38,74],[64,74],[56,136],[44,125],[28,136]],mir=a=>a.map(p=>[120-p[0],p[1]]);
const poly=a=>"M"+a.map(p=>f(p[0])+" "+f(p[1])).join("L")+"Z";
const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
const stripes=(a)=>[.22,.78].map(t=>{const p=lerp(a[0],a[1],t),q=lerp(a[4],a[2],t);return`M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}`}).join("");
const TAIL_L=poly(TL_),TAIL_R=poly(mir(TL_)),STR_L=stripes(TL_),STR_R=stripes(mir(TL_));
/* metal colours: [light, mid, dark, deep] per tier (1 bronze, 2 silver, 3 gold, 4 blue) */
const PAL={1:["#FFD9AE","#E39A55","#B0612A","#6B3410"],2:["#FFFFFF","#CBD3DE","#8E99A8","#566070"],3:["#FFF3BE","#F6C245","#CC8E12","#7A4F05"],4:["#EAF5FF","#8EC4FF","#3F86F0","#1B4AA8"]};

if(!document.getElementById("bgCss")){
 let defs='<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>'
  +'<linearGradient id="bgG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF0B3"/><stop offset=".35" stop-color="#F7C245"/><stop offset=".7" stop-color="#D88F10"/><stop offset="1" stop-color="#8F5A05"/></linearGradient>'
  +'<linearGradient id="bgR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B3182A"/><stop offset=".55" stop-color="#7a0f1a"/><stop offset="1" stop-color="#3d050c"/></linearGradient>'
  +'<linearGradient id="bgRd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a0610"/><stop offset=".5" stop-color="#8b1020"/><stop offset="1" stop-color="#4a0610"/></linearGradient>'
  +'<linearGradient id="bgS" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>';
 Object.keys(PAL).forEach(t=>{const p=PAL[t];
  defs+=`<linearGradient id="bmA${t}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient>`
   +`<linearGradient id="bmB${t}" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[2]}"/></linearGradient>`
   +`<radialGradient id="bmD${t}" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="${p[0]}"/><stop offset=".55" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[2]}"/></radialGradient>`
   +`<linearGradient id="bmR${t}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${p[2]}"/><stop offset=".35" stop-color="${p[0]}"/><stop offset=".7" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[2]}"/></linearGradient>`});
 defs+=[["1","#F0A468","#CD7F32","#7a4412"],["2","#F4F7FB","#B8C0CC","#6b7380"],["3","#FFF0B3","#F5B335","#9a6208"],["4","#FFFFFF","#D9E2EC","#7d8a99"],["5","#BFE3FF","#3B9BFF","#1649a8"]].map(l=>`<radialGradient id="bgL${l[0]}" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="${l[1]}"/><stop offset=".55" stop-color="${l[2]}"/><stop offset="1" stop-color="${l[3]}"/></radialGradient>`).join("")+'</defs></svg>';
 (document.body?document.body.insertAdjacentHTML('beforeend',defs):document.addEventListener('DOMContentLoaded',()=>document.body.insertAdjacentHTML('beforeend',defs)));
 const s=document.createElement("style");s.id="bgCss";s.textContent=`
.bgw{display:inline-grid;justify-items:center;flex:none;position:relative;outline:0;-webkit-tap-highlight-color:transparent}
.bgw.bgt{cursor:help}.bgw.bgt:focus-visible .bgb{outline:3px solid #F58E20;outline-offset:4px;border-radius:12px}
.bgb{display:inline-grid;justify-items:center;flex:none;width:var(--s);position:relative;font-style:normal;filter:drop-shadow(0 3px 5px rgba(0,0,0,.3))}
.bgb svg{display:block;width:var(--s);height:auto;overflow:visible}
.bgb.bglk{filter:grayscale(1) brightness(.8) opacity(.55)}
.bgr{margin-top:calc(var(--s)*.02);width:max-content;min-width:calc(var(--s)*.8);max-width:calc(var(--s)*1.6);padding:calc(var(--s)*.035) calc(var(--s)*.14);text-align:center;font:800 calc(var(--s)*.14)/1.15 system-ui,sans-serif;
 color:#FCE9B0;background:linear-gradient(#9b1423,#5a0912);border:1px solid #D9A441;border-radius:calc(var(--s)*.05)}
.bgr.n{color:#FFF3D0;background:linear-gradient(#9a5a1f,#5d3210);border-color:#F2C777}
.bgtip{position:absolute;left:50%;bottom:calc(100% + 8px);transform:translate(calc(-50% + var(--dx,0px)),4px);width:max-content;max-width:230px;background:#1d1a16;color:#fff;border-radius:10px;padding:9px 12px;
 font:500 12.5px/1.4 system-ui,sans-serif;text-align:left;box-shadow:0 8px 22px rgba(0,0,0,.3);opacity:0;visibility:hidden;transition:opacity .15s,transform .15s;z-index:60;pointer-events:none;white-space:normal}
.bgtip b{display:block;color:#F9B35C;font-weight:700;margin-bottom:2px}.bgtip i{display:block;font-style:normal;opacity:.78;margin-top:4px;font-size:12px}
.bgtip:after{content:"";position:absolute;top:100%;left:calc(50% - var(--dx,0px));margin-left:-6px;border:6px solid transparent;border-top-color:#1d1a16}
.bgtip.dn{bottom:auto;top:calc(100% + 8px)}.bgtip.dn:after{top:auto;bottom:100%;border-top-color:transparent;border-bottom-color:#1d1a16}
.bgw:hover .bgtip,.bgw:focus .bgtip{opacity:1;visibility:visible;transform:translate(calc(-50% + var(--dx,0px)),0)}
.bgc2{display:inline-block;flex:none;filter:drop-shadow(0 3px 5px rgba(0,0,0,.35))}.bgc2 svg{display:block}
.bgshow{display:flex;gap:14px;flex-wrap:wrap;align-items:center;padding:6px 4px}
@media(prefers-reduced-motion:reduce){.bgtip{transition:none}}`;document.head.appendChild(s);
 /* keep the tooltip on screen */
 const fit=e=>{const w=e.target.closest&&e.target.closest(".bgw.bgt");if(!w)return;const t=w.querySelector(".bgtip");if(!t)return;
  t.classList.remove("dn");t.style.setProperty("--dx","0px");let r=t.getBoundingClientRect();
  if(r.top<8){t.classList.add("dn");r=t.getBoundingClientRect()}
  const W=document.documentElement.clientWidth,dx=r.left<8?8-r.left:r.right>W-8?W-8-r.right:0;t.style.setProperty("--dx",dx+"px")};
 document.addEventListener("mouseover",fit);document.addEventListener("focusin",fit)}

const tipHtml=t=>!t?"":typeof t==="string"?`<i style="margin:0;opacity:1;font-size:inherit">${E(t)}</i>`:`${t.title?`<b>${E(t.title)}</b>`:""}${t.text?E(t.text):""}${t.extra?`<i>${E(t.extra)}</i>`:""}`;
const plain=t=>!t?"":typeof t==="string"?t:[t.title,t.text,t.extra].filter(Boolean).join(". ");

function medal(b,o={}){const s=o.size||64,t=Math.min(4,Math.max(1,+b.tier||1)),ic=pick(b),man=!!b.manual;let g,vb;
 if(!man){ /* red & gold seal */
  vb="0 0 120 102";
  g=`<path d="${SAW}" fill="url(#bgG)" stroke="#8a5a06" stroke-width=".7" stroke-linejoin="round"/>
  <circle cx="60" cy="46" r="38" fill="url(#bgR)" stroke="#8a5a06" stroke-width=".8"/>
  <g fill="#F6D98A" stroke="#8a5a06" stroke-width=".25">${LAUREL}</g>${stars(t)}
  <circle cx="60" cy="46" r="21.5" fill="url(#bgG)" stroke="#6b4204" stroke-width="1"/><g fill="#8b1020">${DOTS}</g>
  <g opacity=".7">${glyph(ic,48.2,34.6,24,"#FFF3C4",2.1)}</g>${glyph(ic,47.6,34,24,"#7a0f1a",2)}
  <path d="M8 98 L24 84 L24 98 Z" fill="#4a0610"/><path d="M112 98 L96 84 L96 98 Z" fill="#4a0610"/>
  <path d="M14 70 Q60 60 106 70 L106 88 Q60 78 14 88 Z" fill="url(#bgRd)" stroke="#D9A441" stroke-width="1"/>
  <text x="60" y="80.5" text-anchor="middle" font-size="9.5" font-weight="800" letter-spacing="1.2" fill="url(#bgG)" font-family="system-ui,sans-serif">${WORDS[t-1]}</text>
  <path d="${SAW}" fill="url(#bgS)"/>`}
 else { /* pleated rosette with ribbon tails */
  const p=PAL[t];vb="0 0 120 140";
  g=`<path d="${TAIL_L}" fill="url(#bmR${t})" stroke="${p[3]}" stroke-width=".8" stroke-linejoin="round"/><path d="${STR_L}" stroke="${p[3]}" stroke-opacity=".55" stroke-width="1" fill="none"/>
  <path d="${TAIL_R}" fill="url(#bmR${t})" stroke="${p[3]}" stroke-width=".8" stroke-linejoin="round"/><path d="${STR_R}" stroke="${p[3]}" stroke-opacity=".55" stroke-width="1" fill="none"/>
  <circle cx="${RX}" cy="${RY}" r="40" fill="${p[2]}"/>
  <path d="${RUF_E}" fill="url(#bmA${t})" stroke="${p[3]}" stroke-opacity=".75" stroke-width=".6" stroke-linejoin="round"/>
  <path d="${RUF_O}" fill="url(#bmB${t})" stroke="${p[3]}" stroke-opacity=".75" stroke-width=".6" stroke-linejoin="round"/>
  <circle cx="${RX}" cy="${RY}" r="36" fill="url(#bmB${t})" stroke="${p[3]}" stroke-opacity=".8" stroke-width=".9"/>
  <circle cx="${RX}" cy="${RY}" r="34" fill="url(#bmD${t})" stroke="${p[0]}" stroke-width=".9"/>
  <g fill="${p[0]}" stroke="${p[3]}" stroke-width=".35">${LEAVES}</g>
  <path d="${SR}" fill="${p[0]}" stroke="${p[3]}" stroke-width=".4" stroke-linejoin="round"/>
  <circle cx="${RX}" cy="${RY}" r="18.4" fill="url(#bmD${t})" stroke="${p[3]}" stroke-opacity=".7" stroke-width="1"/>
  <g opacity=".85">${glyph(ic,RX-11+.7,RY-11+.9,22,p[0],2.2)}</g>${glyph(ic,RX-11,RY-11,22,p[3],2.1)}`}
 const tip=o.tip,label=E(b.name)+(tip?": "+E(plain(tip)):"");
 return `<span class="bgw${tip?" bgt":""}"${tip?` tabindex="0" role="img" aria-label="${label}"`:""}><span class="bgb${o.locked?" bglk":""}" style="--s:${s}px"${tip?"":` title="${E(b.name)}"`}><svg viewBox="${vb}" role="img" aria-label="${E(b.name)}">${g}</svg>${o.name?`<b class="bgr${man?" n":""}">${E(b.name)}</b>`:""}</span>${tip?`<span class="bgtip" role="tooltip">${tipHtml(tip)}</span>`:""}</span>`}

function coin(i,size){size=size||64;i=Math.min(5,Math.max(1,+i||1));const stroke=["#6b3a0c","#5b6573","#8a5a06","#6a7786","#12408f"][i-1];
 const sym=i===5?'<path d="M50 28 L68 44 L50 74 L32 44 Z M32 44 H68 M42 44 L50 28 L58 44 L50 74 Z" fill="#fff" fill-opacity=".85" stroke="#12408f" stroke-width="1.2" stroke-linejoin="round"/>'
  :i===4?'<path d="M50 24 L72 37 V63 L50 76 L28 63 V37 Z" fill="#fff" fill-opacity=".7" stroke="#6a7786" stroke-width="1.5"/><path d="M50 34 L55 46 L67 46 L58 53 L61 65 L50 58 L39 65 L42 53 L33 46 L45 46 Z" fill="#7d8a99"/>'
  :'<path d="M50 28 L56 43 L72 44 L60 54 L64 70 L50 61 L36 70 L40 54 L28 44 L44 43 Z" fill="#fff" fill-opacity=".8" stroke="'+stroke+'" stroke-width="1.5" stroke-linejoin="round"/>';
 return `<span class="bgc2" title="${LEVELS[i-1][0]} Member"><svg viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${LEVELS[i-1][0]} Member"><circle cx="50" cy="50" r="46" fill="url(#bgL${i})" stroke="${stroke}" stroke-width="3"/><circle cx="50" cy="50" r="38" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>${sym}</svg></span>`}

const level=p=>{p=+p||0;let i=0;LEVELS.forEach((l,k)=>{if(p>=l[2])i=k});const c=LEVELS[i],n=LEVELS[i+1];
 return{index:i+1,name:c[0]+" Member",color:c[1],next:n?n[0]+" Member":null,toNext:n?n[2]-p:0,pct:n?Math.round((p-c[2])/(n[2]-c[2])*100):100}};
async function showcase(uid,el){if(!el||!uid||typeof sb==="undefined"||!sb)return;
 let r=await sb.from("user_badges").select("featured,awarded_at,note,badges(id,name,description,icon,color,tier,points,manual)").eq("user_id",uid).order("awarded_at",{ascending:false}).limit(30);
 if(r.error)r=await sb.from("user_badges").select("featured,awarded_at,badges(id,name,description,icon,color,tier,points,manual)").eq("user_id",uid).order("awarded_at",{ascending:false}).limit(30);
 if(r.error||!(r.data||[]).length){el.innerHTML="";return}
 const L=r.data.filter(x=>x.badges),pick3=L.filter(x=>x.featured).concat(L.filter(x=>!x.featured)).slice(0,3);
 el.innerHTML=`<div class="bgshow" aria-label="Badges">${pick3.map(x=>medal(x.badges,{size:56,tip:{title:x.badges.name,text:x.note||x.badges.description||"",extra:x.awarded_at?"Awarded "+new Date(x.awarded_at).toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"numeric"}):""}})).join("")}</div>`}
/* badges awarded to a shop (table shop_badges): put <div id="shopBadges"></div> on the shop page and call SokoBadges.shopShowcase(shopId,el) */
async function shopShowcase(shopId,el){if(!el||!shopId||typeof sb==="undefined"||!sb)return;
 const r=await sb.from("shop_badges").select("badge_id,awarded_at,note").eq("shop_id",String(shopId)).order("awarded_at",{ascending:false}).limit(12);
 if(r.error||!(r.data||[]).length){el.innerHTML="";return}
 const b=await sb.from("badges").select("id,name,description,icon,color,tier,points,manual").in("id",r.data.map(x=>x.badge_id)),bm={};(b.data||[]).forEach(x=>bm[x.id]=x);
 const L=r.data.filter(x=>bm[x.badge_id]);
 el.innerHTML=L.length?`<div class="bgshow" aria-label="Shop badges">${L.map(x=>medal(bm[x.badge_id],{size:56,tip:{title:bm[x.badge_id].name,text:x.note||bm[x.badge_id].description||"",extra:"Awarded "+new Date(x.awarded_at).toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"numeric"})}})).join("")}</div>`:""}
window.SokoBadges={medal,coin,level,showcase,shopShowcase,icon,pick,ICONS,LEVELS};
})();