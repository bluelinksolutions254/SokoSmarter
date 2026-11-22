/* SOKO Smart – visual blog editor (what you see is what you get).
   blogEditor(textarea, {upload: async file => url})   needs blogmd.js loaded first.
   The text appears already bold / italic / as headings while you write. The textarea keeps the
   article as Markdown, so saving and the blog pages work exactly as before. A "Markdown" tab shows the raw text. */
(function(){
const css=`.be{border:1.5px solid #e7e2d6;border-radius:12px;background:#fff;overflow:hidden}
.be:focus-within{border-color:#0B4A2E}
.be-bar{display:flex;flex-wrap:wrap;gap:4px;align-items:center;padding:8px;background:#FBF8F1;border-bottom:1px solid #e7e2d6}
.be-bar button{min-width:36px;height:34px;padding:0 9px;border:1px solid transparent;border-radius:8px;background:none;font:700 14px inherit;color:#1d1a16;cursor:pointer}
.be-bar button:hover{background:#E8F3EC;border-color:#A7C28B}.be-bar button.on{background:#0B4A2E;color:#fff}
.be-bar button:disabled{opacity:.4;cursor:default}
.be-bar .sp{width:1px;height:22px;background:#e7e2d6;margin:0 4px}.be-bar .tabs{margin-left:auto;display:flex;gap:4px}
.be-ed{font-weight:400!important;font-family:inherit;padding:14px 18px;min-height:320px;max-height:70vh;overflow:auto;font-size:17px;line-height:1.7;color:#2a2622;overflow-wrap:anywhere;outline:0}
.be-ed:empty:before{content:attr(data-ph);color:#9a9189}
.be-ed h1,.be-ed h2,.be-ed h3,.be-ed h4,.be-ed h5{line-height:1.3;margin:1em 0 .4em;font-weight:700!important}.be-ed b,.be-ed strong{font-weight:800!important}.be-ed i,.be-ed em{font-style:italic}.be-ed blockquote{font-weight:400!important}.be-ed h1{font-size:32px}.be-ed h2{font-size:25px}.be-ed h3{font-size:21px}.be-ed h4{font-size:18px}.be-ed h5{font-size:16px}
.be-ed p{margin:0 0 1em}.be-ed ul,.be-ed ol{padding-left:1.5em;margin:0 0 1em}
.be-ed blockquote{margin:1em 0;padding:12px 18px;border-left:5px solid #0B4A2E;background:#E8F3EC;border-radius:10px;font-weight:600}
.be-ed img{max-width:100%;border-radius:12px}.be-ed a{color:#0B4A2E;text-decoration:underline}
.be-ed pre{background:#f4f1e8;padding:12px;border-radius:8px;overflow:auto}.be-ed code{background:#f4f1e8;padding:1px 5px;border-radius:5px}
.be-ed hr{border:0;border-top:1px solid #d9d3c5;margin:1.4em 0}
.be textarea{border:0!important;border-radius:0!important;box-shadow:none!important;display:block;width:100%;min-height:320px;padding:14px 16px;box-sizing:border-box;resize:vertical}`;

/* ---------- editor HTML  ->  Markdown ---------- */
function inline(n){
  if(n.nodeType===3)return n.nodeValue.replace(/\u00a0/g," ").replace(/\n/g," ");
  if(n.nodeType!==1)return "";
  const t=n.tagName;
  if(t==="BR")return "\n";
  if(t==="IMG")return "!["+(n.getAttribute("alt")||"")+"]("+(n.getAttribute("src")||"")+")";
  let s=[...n.childNodes].map(inline).join("");
  const wrap=(m)=>{const x=s.match(/^(\s*)([\s\S]*?)(\s*)$/);return x[2]?x[1]+m+x[2]+m+x[3]:s};
  if(t==="SPAN"&&n.style){const fw=n.style.fontWeight,fs=n.style.fontStyle,td=n.style.textDecorationLine||n.style.textDecoration||"";
    if(/^(bold|[6-9]00)$/.test(fw))s=wrap("**");
    if(fs==="italic"){const x=s.match(/^(\s*)([\s\S]*?)(\s*)$/);if(x[2])s=x[1]+"*"+x[2]+"*"+x[3]}
    if(/line-through/.test(td)){const x=s.match(/^(\s*)([\s\S]*?)(\s*)$/);if(x[2])s=x[1]+"~~"+x[2]+"~~"+x[3]}
    return s}
  if(t==="STRONG"||t==="B")return wrap("**");
  if(t==="EM"||t==="I")return wrap("*");
  if(t==="DEL"||t==="S"||t==="STRIKE")return wrap("~~");
  if(t==="CODE")return wrap("`");
  if(t==="A"){const h=n.getAttribute("href")||"";return h&&s.trim()?"["+s.trim()+"]("+h+")":s}
  if(/^(H[1-6]|P|DIV|LI|BLOCKQUOTE)$/.test(t))return s;
  return s;
}
function toMd(root){
  const out=[];
  const push=s=>{s=s.replace(/[ \t]+\n/g,"\n").replace(/^\n+|\n+$/g,"");if(s.trim())out.push(s)};
  const block=n=>{
    if(n.nodeType===3){push(inline(n));return}
    if(n.nodeType!==1)return;
    const t=n.tagName;
    if(/^H[1-6]$/.test(t)){const l=Math.min(5,+t[1]);push("#".repeat(l)+" "+inline(n).replace(/\n/g," ").trim());return}
    if(t==="UL"||t==="OL"){const items=[...n.children].filter(c=>c.tagName==="LI").map((li,i)=>(t==="UL"?"- ":(i+1)+". ")+inline(li).replace(/\n+/g," ").trim()).filter(x=>x.replace(/^(- |\d+\. )/,"").trim());push(items.join("\n"));return}
    if(t==="BLOCKQUOTE"){push(inline(n).trim().split("\n").map(x=>"> "+x).join("\n"));return}
    if(t==="PRE"){push("```\n"+n.textContent.replace(/\n$/,"")+"\n```");return}
    if(t==="HR"){push("---");return}
    if(t==="IMG"){push(inline(n));return}
    if(t==="P"||t==="DIV"){
      if([...n.children].some(c=>/^(H[1-6]|UL|OL|BLOCKQUOTE|PRE|HR|P|DIV)$/.test(c.tagName))){[...n.childNodes].forEach(block);return}
      push(inline(n));return}
    push(inline(n));
  };
  /* loose text and inline tags sitting directly in the editor belong to ONE paragraph */
  const INL=/^(B|STRONG|I|EM|S|DEL|STRIKE|CODE|A|SPAN|BR|FONT|U|SUB|SUP|MARK)$/;let run=[];
  const flush=()=>{if(run.length){push(run.map(inline).join(""));run=[]}};
  [...root.childNodes].forEach(n=>{if(n.nodeType===3||(n.nodeType===1&&INL.test(n.tagName)))run.push(n);else{flush();block(n)}});
  flush();
  return out.join("\n\n");
}

window.blogEditor=function(el,opt){opt=opt||{};
  const ta=typeof el==="string"?document.querySelector(el):el;if(!ta||ta.dataset.be)return ta;ta.dataset.be=1;
  if(!document.getElementById("be-css")){const s=document.createElement("style");s.id="be-css";s.textContent=css;document.head.appendChild(s)}
  const wasReq=ta.required;ta.required=false;
  const box=document.createElement("div");box.className="be";ta.parentNode.insertBefore(box,ta);
  const bar=document.createElement("div");bar.className="be-bar";
  const ed=document.createElement("div");ed.className="be-ed";ed.contentEditable="true";ed.setAttribute("role","textbox");ed.setAttribute("aria-multiline","true");ed.dataset.ph=ta.getAttribute("placeholder")||"Write your article here…";
  box.append(bar,ed,ta);ta.hidden=true;
  try{document.execCommand("defaultParagraphSeparator",false,"p")}catch(e){}
  let mode="visual";
  const render=()=>{ed.innerHTML=typeof blogMd==="function"?blogMd(ta.value):"<p>"+ta.value.replace(/</g,"&lt;")+"</p>"};
  const sync=()=>{if(!ed.textContent.trim()&&!ed.querySelector("img,hr"))ed.innerHTML="";ta.value=toMd(ed);ta.dispatchEvent(new Event("input",{bubbles:true}))};
  render();
  /* nothing highlighted? then apply to the word the cursor is in */
  const grabWord=()=>{const s=getSelection();if(!s||!s.rangeCount||!s.isCollapsed||!s.modify)return;
    const r=s.getRangeAt(0),n=r.startContainer,t=n.nodeType===3?n.nodeValue:"",o=r.startOffset;
    if(!/\S/.test((t[o-1]||"")+(t[o]||"")))return;
    s.modify("move","backward","word");s.modify("extend","forward","word");
    for(let i=0;i<3&&/\s$/.test(s.toString());i++)s.modify("extend","backward","character")};
  const cmd=(c,v)=>{ed.focus();if(["bold","italic","strikeThrough"].includes(c))grabWord();document.execCommand(c,false,v||null);sync();state()};
  const block=tag=>{ed.focus();const cur=(document.queryCommandValue("formatBlock")||"").toLowerCase().replace(/[<>]/g,"");document.execCommand("formatBlock",false,cur===tag?"p":tag);sync();state()};
  /* heading on the highlighted text only: the paragraph is split around the selection */
  const BLK=/^(P|DIV|H[1-6]|BLOCKQUOTE)$/;
  const blockOf=n=>{while(n&&n!==ed){if(n.nodeType===1&&BLK.test(n.tagName)&&n.parentNode===ed)return n;n=n.parentNode}return null};
  const heading=tag=>{ed.focus();const s=getSelection();if(!s.rangeCount)return;const r=s.getRangeAt(0);
    if(!r.collapsed){const b=blockOf(r.startContainer);
      if(b){const rr=r.cloneRange();if(blockOf(rr.endContainer)!==b&&rr.endOffset===0&&blockOf(rr.endContainer)===b.nextElementSibling)rr.setEnd(b,b.childNodes.length);
        if(blockOf(rr.endContainer)===b){
          const pre=document.createRange();pre.setStart(b,0);pre.setEnd(rr.startContainer,rr.startOffset);
          const post=document.createRange();post.setStart(rr.endContainer,rr.endOffset);post.setEnd(b,b.childNodes.length);
          const bt=b.tagName.toLowerCase(),base=/^(h[1-6]|blockquote)$/.test(bt)?bt:"p",selTag=bt===tag?"p":tag;let mine=null;const els=[];
          [pre.cloneContents(),rr.cloneContents(),post.cloneContents()].forEach((f,i)=>{if(!f.textContent.trim()&&!(f.querySelector&&f.querySelector("img")))return;
            const e=document.createElement(i===1?selTag:base);e.appendChild(f);if(i===1)mine=e;els.push(e)});
          if(mine){b.replaceWith(...els);const nr=document.createRange();nr.selectNodeContents(mine);s.removeAllRanges();s.addRange(nr);sync();state();return}}}}
    block(tag)};
  const upload=opt.upload;
  const addImg=u=>{ed.focus();document.execCommand("insertImage",false,u);sync()};
  const image=()=>{if(typeof upload==="function"){const fi=document.createElement("input");fi.type="file";fi.accept="image/*";
    fi.onchange=async()=>{const f=fi.files[0];if(!f)return;try{const u=await upload(f);if(u)addImg(u)}catch(e){alert(e.message||e)}};fi.click();return}
    const u=prompt("Paste the image URL:","https://");if(u)addImg(u)};
  const link=()=>{ed.focus();grabWord();const sel=getSelection();
    const u=prompt("Paste the link (URL):","https://");if(!u)return;
    if(!sel||sel.isCollapsed){document.execCommand("insertHTML",false,'<a href="'+u.replace(/"/g,"&quot;")+'">'+u.replace(/</g,"&lt;")+"</a>&nbsp;");sync()}
    else cmd("createLink",u)};
  const tools=[["H1","Heading 1",()=>heading("h1"),"h1"],["H2","Heading 2",()=>heading("h2"),"h2"],["H3","Heading 3",()=>heading("h3"),"h3"],["H4","Heading 4",()=>heading("h4"),"h4"],["H5","Heading 5",()=>heading("h5"),"h5"],0,
    ["<b>B</b>","Bold (Ctrl+B)",()=>cmd("bold"),"bold"],["<i>I</i>","Italic (Ctrl+I)",()=>cmd("italic"),"italic"],["<s>S</s>","Strikethrough",()=>cmd("strikeThrough"),"strikeThrough"],0,
    ["• List","Bullet list",()=>cmd("insertUnorderedList"),"insertUnorderedList"],["1. List","Numbered list",()=>cmd("insertOrderedList"),"insertOrderedList"],["❝","Quote",()=>block("blockquote"),"blockquote"],0,
    ["🔗","Link (Ctrl+K)",link],["🖼","Image",image],["―","Divider",()=>cmd("insertHorizontalRule")]];
  const btns=[];
  tools.forEach(t=>{if(!t){const d=document.createElement("span");d.className="sp";bar.appendChild(d);return}
    const b=document.createElement("button");b.type="button";b.innerHTML=t[0];b.title=t[1];b.onmousedown=e=>e.preventDefault();b.onclick=t[2];b._k=t[3];bar.appendChild(b);btns.push(b)});
  function state(){if(mode!=="visual")return;const cur=(document.queryCommandValue("formatBlock")||"").toLowerCase().replace(/[<>]/g,"");
    btns.forEach(b=>{let on=false;try{on=["h1","h2","h3","h4","h5","blockquote"].includes(b._k)?cur===b._k:b._k?document.queryCommandState(b._k):false}catch(e){}b.classList.toggle("on",!!on)})}
  document.addEventListener("selectionchange",()=>{if(ed.contains(getSelection().anchorNode))state()});
  const tabs=document.createElement("span");tabs.className="tabs";
  const v=document.createElement("button"),m=document.createElement("button");v.type=m.type="button";v.textContent="Visual";m.textContent="Markdown";v.className="on";
  const show=md=>{if(md===(mode==="markdown"))return;mode=md?"markdown":"visual";
    if(md){sync();ed.hidden=true;ta.hidden=false}else{render();ta.hidden=true;ed.hidden=false}
    v.classList.toggle("on",!md);m.classList.toggle("on",md);btns.forEach(b=>b.disabled=md)};
  v.onclick=()=>show(false);m.onclick=()=>show(true);tabs.append(v,m);bar.appendChild(tabs);
  ed.addEventListener("input",()=>{if([...ed.childNodes].some(n=>n.nodeType===3&&n.nodeValue.trim()))document.execCommand("formatBlock",false,"p");sync()});
  ed.addEventListener("paste",e=>{e.preventDefault();const t=(e.clipboardData||window.clipboardData).getData("text/plain");document.execCommand("insertText",false,t)});
  ed.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();link()}});
  if(ta.form)ta.form.addEventListener("submit",e=>{if(mode==="visual")sync();
    if(wasReq&&!ta.value.trim()){e.preventDefault();e.stopImmediatePropagation();alert("Please write the article first.");if(mode==="visual")ed.focus()}},true);
  return ta;
};
})();