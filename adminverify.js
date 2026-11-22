/* SOKO Smart admin: shop verification (blue tick) with a required reason.
   - Only SHOPS can be verified. Products, jobs and people's profiles are not verified for now.
   - Verify, Unverify and Re-verify each ask for a reason, saved in shop_verification_log (run supabase-shop-verification.sql once).
   - Shows the criteria a shop should meet. Uses admin.html globals: sb, sec, REC, $, esc, toast, refresh, ownerOf (optional). */
(()=>{
const CRIT={months:1,sold:20,rating:4.5,listings:10};   /* 1 month old, MORE than 20 sold, 4.5 and above, at least 10 listings */
window.SOKO_VERIFY_CRITERIA=CRIT;
const MISSING=/could not find|does not exist|schema cache|relation/i;
const SETUP="Not set up yet: run supabase-shop-verification.sql in the Supabase SQL editor, then try again.";
const TICK='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style="vertical-align:-3px"><path fill="#3897F0" d="M12 1.8l2.6 1.9 3.2-.1 1 3 2.6 1.9-1 3.1 1 3.1-2.6 1.9-1 3-3.2-.1L12 22.2l-2.6-1.9-3.2.1-1-3-2.6-1.9 1-3.1-1-3.1 2.6-1.9 1-3 3.2.1z"/><path d="M8 12.2l2.6 2.6L16 9.4" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

if(!document.getElementById("avCss")){const s=document.createElement("style");s.id="avCss";s.textContent=`
#dlg.avwide{max-width:520px;width:calc(100% - 24px)}
#avf{display:grid;gap:12px;text-align:left}#avf h3{margin:0;font-size:19px}
#avf .avc{border:1px solid var(--bd,#e6dccd);border-radius:12px;padding:6px 12px}
#avf .avr{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-top:1px solid var(--bd,#eee);font-size:14px}
#avf .avr:first-of-type{border-top:0}#avf .avr b.ok{color:#14633F}#avf .avr b.no{color:#d3261e}#avf .avr b.na{color:#8a8178}
#avf .avr span.m{display:block;font-size:12.5px}
#avf textarea{width:100%;box-sizing:border-box;border:1px solid #e6dccd;border-radius:8px;padding:9px 10px;font:inherit;min-height:84px;resize:vertical}
#avf textarea:focus{outline:0;border-color:#F58E20;box-shadow:0 0 0 3px rgba(245,142,32,.18)}
#avf .avw{background:#fff4e0;border:1px solid #F58E20;border-radius:10px;padding:8px 12px;font-size:13px}
#avf .ave{color:#d3261e;font-size:14px;min-height:20px}`;document.head.appendChild(s)}

const ok=(v,m)=>`<div class="avr"><b class="${v===null?"na":v?"ok":"no"}" style="min-width:18px">${v===null?"?":v?"✓":"✗"}</b><div>${m}</div></div>`;

/* the four checks (each can be null = could not be read) */
async function check(shop){
 const out={};
 const born=shop.created_at?new Date(shop.created_at):null,lim=new Date();lim.setMonth(lim.getMonth()-CRIT.months);
 out.age={v:born&&!isNaN(born)?born<=lim:null,t:born&&!isNaN(born)?"Opened "+born.toLocaleDateString("en-KE",{dateStyle:"medium"}):"Opening date unknown"};
 try{const r=await sb.from("products").select("id",{count:"exact",head:true}).eq("shop_id",shop.id).eq("status","approved");
  out.list=r.error?{v:null,t:"Could not count listings"}:{v:(r.count||0)>=CRIT.listings,t:(r.count||0)+" approved product listing"+(r.count===1?"":"s")}}catch(e){out.list={v:null,t:"Could not count listings"}}
 try{const r=await sb.from("orders").select("status,order_items(*)").eq("shop_id",shop.id).eq("status","delivered").limit(2000);
  if(r.error)out.sold={v:null,t:"Could not read sales"};
  else{const n=(r.data||[]).reduce((a,o)=>a+(o.order_items||[]).reduce((b,i)=>b+(+i.quantity||+i.qty||1),0),0);out.sold={v:n>CRIT.sold,t:n+" product"+(n===1?"":"s")+" sold (delivered orders)"}}}catch(e){out.sold={v:null,t:"Could not read sales"}}
 let a=null,n=0;
 try{const r=await sb.from("shop_reviews").select("rating").eq("shop_id",shop.id).limit(5000);
  if(!r.error){const x=(r.data||[]).map(z=>+z.rating).filter(z=>z>=1);n=x.length;if(n)a=x.reduce((t,z)=>t+z,0)/n}}catch(e){}
 if(a===null){const f=+(shop.rating_avg??shop.rating);if(f>0){a=f;n=+shop.rating_count||0}}
 out.rate=a===null?{v:null,t:"No rating found for this shop"}:{v:a>=CRIT.rating,t:a.toFixed(1)+" / 5"+(n?" ("+n+" review"+(n===1?"":"s")+")":"")};
 return out}

/* has this shop been unverified before? then the next verify is a re-verify */
async function wasUnverified(shop){
 if(shop.seller_verified)return false;
 try{const r=await sb.from("shop_verification_log").select("id",{count:"exact",head:true}).eq("shop_id",shop.id).eq("action","unverify");
  if(!r.error)return (r.count||0)>0}catch(e){}
 return !!shop.verification_reason}

async function openDlg(shop){
 const mode=shop.seller_verified?"unverify":(await wasUnverified(shop))?"reverify":"verify";
 const T={verify:["Verify this shop","Verify shop","Why is this shop being verified?"],unverify:["Remove verification","Remove verification","Why is the verification being removed?"],reverify:["Re-verify this shop","Re-verify shop","Why is this shop being verified again?"]}[mode];
 const d=$("#dlg");d.classList.add("avwide");if(!d._av){d._av=1;d.addEventListener("close",()=>d.classList.remove("avwide"))}
 $("#dc").innerHTML=`<form id="avf" data-id="${esc(shop.id)}" data-mode="${mode}" novalidate>
  <h3>${mode==="unverify"?"":TICK+" "}${T[0]}</h3>
  <p class="m" style="margin:0"><b>${esc(shop.name||"This shop")}</b>${mode==="unverify"?". The blue tick disappears from the shop straight away and the owner is told why.":". The blue tick shows next to the shop name and the owner is told why."}</p>
  ${mode==="unverify"?"":`<div class="avc" id="avc"><div class="m" style="padding:8px 0">Checking the criteria…</div></div><div id="avw"></div>`}
  <label style="display:grid;gap:5px;font-size:13px;font-weight:600">${T[2]} *<textarea name="rs" maxlength="500" placeholder="Write the reason (at least 10 characters)"></textarea></label>
  <div class="ave" id="ave" role="alert"></div>
  <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap"><button type="button" class="btn" data-keep id="avx">Cancel</button><button class="btn ${mode==="unverify"?"d":"p"}" data-keep id="avgo">${T[1]}</button></div></form>`;
 d.showModal();$("#avf").querySelector("[name=rs]").focus();
 if(mode!=="unverify")check(shop).then(c=>{const el=$("#avc");if(!el)return;
  el.innerHTML=`<div class="m" style="padding:8px 0 2px;font-weight:600">Criteria for verification</div>`
   +ok(c.age.v,`<b>In existence for at least ${CRIT.months} month</b><span class="m">${esc(c.age.t)}</span>`)
   +ok(c.sold.v,`<b>More than ${CRIT.sold} products sold</b><span class="m">${esc(c.sold.t)}</span>`)
   +ok(c.rate.v,`<b>Rating of ${CRIT.rating} and above</b><span class="m">${esc(c.rate.t)}</span>`)
   +ok(c.list.v,`<b>At least ${CRIT.listings} product listings</b><span class="m">${esc(c.list.t)}</span>`);
  const all=[c.age,c.sold,c.rate,c.list],bad=all.some(x=>x.v===false),unk=all.some(x=>x.v===null);
  $("#avw").innerHTML=bad?'<div class="avw">This shop does not meet every criterion. You can still continue, but give a clear reason.</div>':unk?'<div class="avw">Some criteria could not be checked automatically. Please check them yourself before continuing.</div>':'<div class="avw" style="background:#e3f4ea;border-color:#14633F">This shop meets all the criteria.</div>'})}

async function save(f){
 const id=f.dataset.id,mode=f.dataset.mode,reason=f.querySelector("[name=rs]").value.trim(),err=m=>{$("#ave").textContent=m||""},go=$("#avgo");err("");
 if(reason.length<10)return err("Please write the reason (at least 10 characters).");
 const shop=REC[id];if(!shop)return err("Shop not found. Reload the list and try again.");
 go.disabled=true;const label=go.textContent;go.textContent="Saving…";
 const fail=m=>{err(m);go.disabled=false;go.textContent=label};
 const on=mode!=="unverify";
 const u=await sb.from("shops").update({seller_verified:on,verification_reason:reason,verified_at:on?new Date().toISOString():null,verification_requested_at:null}).eq("id",id);
 if(u.error)return fail(MISSING.test(u.error.message)?SETUP:u.error.message);
 let note="";
 const lg=await sb.from("shop_verification_log").insert({shop_id:id,action:mode,reason});
 if(lg.error)note=MISSING.test(lg.error.message)?" (The reason was not logged: run supabase-shop-verification.sql.)":" (The reason could not be logged: "+lg.error.message+")";
 try{if(typeof ownerOf==="function"){const o=await ownerOf(shop);if(o){const nm=shop.name||"your shop";
  const body=mode==="unverify"?`The verified badge on your shop “${nm}” has been removed. Reason: ${reason}\nReply here if you have questions and the Soko Smart Team will help.`
   :`Congratulations! Your shop “${nm}” is ${mode==="reverify"?"verified again":"now verified"} and shows the blue tick. Reason: ${reason}`;
  const n=await sb.rpc("admin_notify_user",{p_user:o,p_body:body});if(n.error)note+=" (The owner could not be notified.)"}}}catch(e){}
 $("#dlg").close();toast((mode==="unverify"?"Verification removed.":mode==="reverify"?"Shop re-verified.":"Shop verified.")+note);refresh()}

/* capture phase: runs before admin.html's own Verify handler, which is replaced */
document.addEventListener("click",e=>{const b=e.target.closest("[data-a=ver]");if(!b)return;
 e.stopImmediatePropagation();e.preventDefault();
 if(sec!=="shops"){toast("Only shops can be verified.","error");return}
 const r=REC[b.dataset.id];if(r)openDlg(r)},true);
document.addEventListener("click",e=>{if(e.target.closest("#avx"))$("#dlg").close()});
document.addEventListener("submit",e=>{if(e.target.id==="avf"){e.preventDefault();save(e.target)}});
})();