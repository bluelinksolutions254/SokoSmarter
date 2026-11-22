/* SOKO Smart website: agent referral tracking. Add <script src="agencyref.js"></script> right after soko.js on every public page
   (index, shop, product, shopmanager, openshop, jobs, servicehub, freelance, blog ...).
   - A visit with ?ref=CODE is remembered for 30 days and counted as one click (once per hour per visitor and page).
   - When that person later signs up or logs in with a NEW account (made in the last 3 days), the account is credited to the agent. */
(()=>{
const KEY="soko_ref",VID="soko_vid",DAYS=30;
const get=k=>{try{return localStorage.getItem(k)}catch(e){return null}},put=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}},del=k=>{try{localStorage.removeItem(k)}catch(e){}};
const db=()=>typeof sb!=="undefined"?sb:null;
function visitor(){let v=get(VID);if(!v){v=(crypto.randomUUID?crypto.randomUUID():String(Math.random()).slice(2)+Date.now()).slice(0,40);put(VID,v)}return v}
function remembered(){try{const o=JSON.parse(get(KEY)||"null");if(o&&o.c&&Date.now()-o.t<DAYS*864e5)return o.c}catch(e){}del(KEY);return null}
const PAGES={"product.html":"product","shop.html":"shop","servicehub.html":"service","jobs.html":"job","freelance.html":"service","openshop.html":"shop"};
function track(code){const s=db();if(!s)return;const page=(location.pathname.split("/").pop()||"index.html").toLowerCase(),q=new URLSearchParams(location.search),
 ref=q.get("id")||q.get("q")||"",gate="soko_clk_"+page+"_"+ref;try{if(sessionStorage.getItem(gate))return;sessionStorage.setItem(gate,"1")}catch(e){}
 s.rpc("agc_track",{p_code:code,p_kind:"click",p_type:PAGES[page]||"general",p_ref:ref||null,p_visitor:visitor()}).then(()=>{},()=>{})}
async function credit(){const s=db(),c=remembered();if(!s||!c)return;let u=null;try{u=(await s.auth.getSession()).data.session}catch(e){}if(!u)return;
 try{const r=await s.rpc("agc_attribute_me",{p_code:c});if(!r.error)del(KEY)}catch(e){}}
try{const c=(new URLSearchParams(location.search).get("ref")||"").trim().toUpperCase();
 if(/^[A-Z0-9]{3,16}$/.test(c)){put(KEY,JSON.stringify({c,t:Date.now()}));track(c)}}catch(e){}
const s=db();if(s){credit();s.auth.onAuthStateChange(ev=>{if(ev==="SIGNED_IN")setTimeout(credit,800)})}
})();