/* SOKO Smart – bottom tab bar for phones (shown by mobile.css on screens up to 760px wide). */
(()=>{if(window.__mtab)return;window.__mtab=1;
const here=(location.pathname.split("/").pop()||"index.html").toLowerCase();
const alias={"product.html":"shop.html","orders.html":"profile.html","shopmanager.html":"profile.html","openshop.html":"profile.html","achievements.html":"profile.html","complaint.html":"profile.html"};
const cur=alias[here]||here;
const S=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const T=[["index.html","Home",'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>'],
 ["shop.html","Shop",'<path d="M6 7h12l1 13H5z"/><path d="M9 7a3 3 0 0 1 6 0"/>'],
 ["jobs.html","Jobs",'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>'],
 ["wallet.html","Wallet",'<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/>'],
 ["profile.html","Account",'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>']];
function mount(){if(document.querySelector(".mtab"))return;
 const n=document.createElement("nav");n.className="mtab";n.setAttribute("aria-label","Main");
 n.innerHTML=T.map(t=>`<a href="${t[0]}" ${t[0]===cur||(t[0]==="index.html"&&(cur===""||cur==="/"))?'class="on" aria-current="page"':""}>${S(t[2])}<span>${t[1]}</span></a>`).join("");
 document.body.appendChild(n)}
document.readyState==="loading"?document.addEventListener("DOMContentLoaded",mount):mount();
/* hide the bar while the keyboard is open so it does not float over the form */
const typing=e=>/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)&&!/^(checkbox|radio|button|submit)$/.test(e.target.type||"");
document.addEventListener("focusin",e=>{if(typing(e))document.documentElement.classList.add("mtab-hide")});
document.addEventListener("focusout",()=>setTimeout(()=>{const a=document.activeElement;if(!a||!typing({target:a}))document.documentElement.classList.remove("mtab-hide")},120));
})();