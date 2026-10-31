// 읽기 레슨(드럼 기초 상식)과 SVG 그림
/* ---------- reading lessons ---------- */
const KIT_LABEL={crash:['크래시',78,26],ride:['라이드',262,44],hihat:['하이햇',30,84],tom:['탐탐',160,66],snare:['스네어',89,176],kick:['킥',160,163],floor:['플로어 탐',256,198]};
function figKit(hl){
  const c=k=>`kp${k===hl?' on':''}`,cy=k=>`kc${k===hl?' on':''}`;
  const drum=(k,x,y,w,h)=>`<g class="${c(k)}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/><ellipse cx="${x+w/2}" cy="${y}" rx="${w/2}" ry="${Math.max(5,w*0.12)}"/></g>`;
  let g=`<g class="ks"><line x1="78" y1="44" x2="78" y2="214"/><line x1="262" y1="62" x2="262" y2="214"/><line x1="30" y1="96" x2="30" y2="214"/><line x1="89" y1="150" x2="74" y2="214"/><line x1="89" y1="150" x2="104" y2="214"/><line x1="236" y1="180" x2="232" y2="214"/><line x1="276" y1="180" x2="280" y2="214"/><line x1="10" y1="214" x2="310" y2="214"/></g>`;
  g+=`<g class="${cy('crash')}"><ellipse cx="78" cy="42" rx="40" ry="6"/></g><g class="${cy('ride')}"><ellipse cx="262" cy="60" rx="46" ry="7"/></g>`;
  g+=`<g class="${c('kick')}"><circle cx="160" cy="160" r="52"/><circle cx="160" cy="160" r="40" class="in"/></g>`;
  g+=drum('tom',112,86,40,28).replace(`class="${c('tom')}"`,`class="${c('tom')}"`)+drum('tom',168,86,40,28);
  g+=drum('snare',58,130,62,20)+drum('floor',228,132,56,48);
  g+=`<g class="${cy('hihat')}"><ellipse cx="30" cy="98" rx="27" ry="4"/><ellipse cx="30" cy="104" rx="27" ry="4"/></g>`;
  if(!hl)g+=Object.values(KIT_LABEL).map(([t,x,y])=>`<text x="${x}" y="${y}" text-anchor="middle" class="kl">${t}</text>`).join('');
  return `<svg viewBox="0 0 320 222" class="fig kit" role="img" aria-label="${hl?KIT_LABEL[hl][0]+' 위치':'드럼 세트 전체'}">${g}</svg>`;}
function figStick(f){
  let g=`<path d="M22 66 L292 60 Q304 62 292 70 L22 76 Q16 71 22 66Z" class="stk"/>`;
  g+=`<text x="22" y="98" class="kl" text-anchor="start">손잡이 끝</text><text x="298" y="98" class="kl" text-anchor="end">팁 (치는 쪽)</text>`;
  if(f)g+=`<line x1="22" y1="40" x2="112" y2="40" class="dim"/><line x1="22" y1="34" x2="22" y2="46" class="dim"/><line x1="112" y1="34" x2="112" y2="46" class="dim"/><text x="67" y="30" class="kl" text-anchor="middle">약 1/3</text><circle cx="112" cy="68" r="11" class="fp"/><text x="112" y="122" class="kl acc" text-anchor="middle">받침점 (엄지 + 검지)</text>`;
  return `<svg viewBox="0 0 320 132" class="fig" role="img" aria-label="스틱과 받침점 위치">${g}</svg>`;}
function figStroke(hl){
  const T={full:['풀','H','H'],down:['다운','H','L'],tap:['탭','L','L'],up:['업','L','H']},Y={H:28,L:104},pad=132;
  let g=`<line x1="10" y1="${pad}" x2="310" y2="${pad}" class="padl"/><text x="12" y="${Y.H+4}" class="kl" text-anchor="start">높게</text><text x="12" y="${Y.L+4}" class="kl" text-anchor="start">낮게</text>`;
  Object.entries(T).forEach(([k,[n,a,b]],i)=>{const x=88+i*62,on=!hl||k===hl;
    g+=`<g class="sp${k===hl?' on':''}" opacity="${on?1:.35}"><circle cx="${x-14}" cy="${Y[a]}" r="5"/><path d="M${x-14} ${Y[a]} L${x} ${pad-4} L${x+14} ${Y[b]}" fill="none"/><path d="M${x+14} ${Y[b]} l-7 3 M${x+14} ${Y[b]} l-1 8" fill="none"/><text x="${x}" y="${pad+20}" text-anchor="middle" class="kl">${n}</text></g>`;});
  return `<svg viewBox="0 0 320 160" class="fig" role="img" aria-label="스트로크 높이 비교">${g}</svg>`;}
function figPosture(){
  const g=`<line x1="10" y1="200" x2="310" y2="200" class="padl"/>
  <rect x="70" y="128" width="64" height="12" rx="6" class="kpf"/><line x1="102" y1="140" x2="102" y2="200" class="ln2"/><line x1="82" y1="200" x2="122" y2="200" class="ln2"/>
  <circle cx="104" cy="44" r="15" class="kpf"/>
  <path d="M104 60 L104 124 L172 126 L176 194 L198 196" class="body"/>
  <path d="M104 74 L132 104 L178 98" class="body"/>
  <line x1="178" y1="98" x2="230" y2="108" class="stkl"/>
  <rect x="214" y="110" width="58" height="16" rx="3" class="kpf"/><ellipse cx="243" cy="110" rx="29" ry="5" class="kpf"/><line x1="243" y1="126" x2="243" y2="200" class="ln2"/>
  <text x="166" y="156" class="kl acc" text-anchor="end">허벅지 수평 →</text>
  <text x="104" y="22" class="kl" text-anchor="middle">허리는 곧게</text>`;
  return `<svg viewBox="0 0 320 210" class="fig" role="img" aria-label="옆에서 본 앉는 자세">${g}</svg>`;}
function figure(f){
  if(!f)return '';const [k,v]=f.split(':');
  if(k==='kit')return figKit(v||'');
  if(k==='stick')return figStick(v==='f');
  if(k==='stroke')return figStroke(v||'');
  if(k==='posture')return figPosture();
  if(k==='note'){const l=LESSONS.find(x=>x.id===v);return `<div class="stage">${notation(l)}</div>`;}
  return '';}
function vRead(){
  const l=S.lesson,n=l.pages.length,i=S.page,pg=l.pages[i],last=i===n-1;
  return `<div class="top"><button class="iconbtn" data-act="home" aria-label="닫기">${IC.close}</button>
   <div class="segs">${l.pages.map((_,k)=>`<span class="${k<=i?'on':''}"></span>`).join('')}</div><span class="pgn">${i+1}/${n}</span></div>
  <div class="rpage" data-act="flip">
   <div class="rfig">${figure(pg.fig)}</div>
   <span class="rk">${esc(l.title)}</span>
   <h1>${esc(pg.t)}</h1>
   <p>${esc(pg.b)}</p>
   <span class="rhint">${i===0?'화면을 탭하면 다음 장으로 넘어가요 · 왼쪽을 탭하면 이전 장':''}</span>
  </div>
  <div class="actions">${last?`<button class="btn primary" data-act="readdone">다 읽었어요</button>`:`<div class="rnav"><button class="btn" data-act="flipto" data-d="-1"${i?'':' disabled'}>이전</button><button class="btn primary" data-act="flipto" data-d="1">다음</button></div>`}</div>`;}
