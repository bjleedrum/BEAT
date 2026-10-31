// 공통 화면 요소, 하단 탭, 홈 화면
/* ---------- view helpers ---------- */
const $app=document.getElementById('app'),$tabs=document.getElementById('tabs');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const IC={close:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',back:'<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',gear:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>'};
function cntLabel(i,spb){const b=Math.floor(i/spb)+1,k=i%spb;if(!k)return b;return spb===2?'&':spb===3?['','&','a'][k]:['','e','&','a'][k];}
function notation(lesson,{id='',bar=0,graded=null}={}){
  const n=lesson.tokens.length,beats=[];
  for(let b=0;b<4;b++){let cells='';for(let k=0;k<lesson.spb;k++){const i=b*lesson.spb+k,tk=lesson.tokens[i];let cls='cell';
    if(graded&&tk){const r=graded.find(x=>x.bar===bar&&x.i===i);if(r){cls+=' g-'+r.grade;if(r.accent&&r.accOk===false)cls+=' g-acc-x';}}
    cells+=`<div class="${cls}"><span class="acc">${tk&&tk.accent?'&gt;':''}</span>${tk?`<span class="head ${tk.hand}${tk.accent?' A':''}">${tk.hand}</span>`:'<span class="rest"></span>'}<span class="cnt">${cntLabel(i,lesson.spb)}</span></div>`;}
    beats.push(`<div class="beat">${cells}</div>`);}
  return `<div class="bar"${id?` id="${id}"`:''}>${beats.join('')}</div>`;}
function starsFor(s){const n=s>=90?3:s>=75?2:s>=50?1:0;return '★'.repeat(n)+'<i>'+'★'.repeat(3-n)+'</i>';}
function streak(){const set=new Set(S.days);let d=new Date(),n=0;const key=x=>x.toLocaleDateString('sv-SE');if(!set.has(key(d)))d.setDate(d.getDate()-1);while(set.has(key(d))){n++;d.setDate(d.getDate()-1);}return n;}

const TAB_IC={
  home:'<svg viewBox="0 0 24 24"><path class="fill" d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/></svg>',
  course:'<svg viewBox="0 0 24 24"><path class="fill" d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/></svg>'};
function vTabbar(){
  const t=(id,label)=>`<button class="tab" data-act="tab" data-t="${id}"${S.view===id?' aria-current="page"':''}><span class="ico">${TAB_IC[id]}</span>${label}</button>`;
  return `<nav class="tabbar" aria-label="메인 메뉴"><div class="in">${t('home','홈')}${t('course','코스')}</div></nav>`;}
function curCourse(){
  const si=UNITS.findIndex(u=>u.id===S.course);if(si>=0)return si;
  const i=UNITS.findIndex(u=>u.items.some(x=>!S.progress[x.id]));return i<0?0:i;}
function nextLesson(){
  const ui=curCourse(),u=UNITS[ui],l=u.items.find(x=>!S.progress[x.id])||u.items[0];return {l,ui,u};}
function chipsRow(){
  const st=streak(),mode=S.settings.mode;
  return `<div class="chips"><span class="chip">연속 연습 <b>${st}</b>일</span><span class="chip">${mode==='mic'?'휴대폰 마이크':'화면 탭'}</span></div>`;}

function vHome(){
  const {l,ui,u}=nextLesson(),done=u.items.filter(x=>S.progress[x.id]).length,allDone=done===u.items.length,lv=LEVELS[u.lv];
  const rd=l.kind==='read';
  const prev=rd?'':l.tokens.slice(0,8).map(t=>t?`<span class="${t.accent?'A':''}">${t.hand}</span>`:'<span class="r"></span>').join('');
  return `<div class="top"><button class="coursepill" data-act="tab" data-t="course">${esc(u.title)}<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button><button class="iconbtn" data-act="settings" aria-label="설정">${IC.gear}</button></div>
  ${chipsRow()}
  <div class="unithead"><small>${lv.name} · ${done}/${u.items.length} 완료</small><h1>${esc(u.title)}</h1></div>
  <div class="uprog"><i style="width:${done/u.items.length*100}%"></i></div>
  <div class="next"><span class="lbl">${allDone?'다시 연습하기':S.progress[l.id]?'이어서':'다음 레슨'}</span>
   <div><div class="t">${esc(l.title)}</div><div class="s">${esc(l.sub)} · ${rd?`카드 ${l.pages.length}장`:`${S.progress[l.id]?.bpm||l.bpm} BPM`}</div></div>
   ${rd?'':`<div class="preview" aria-hidden="true">${prev}</div>`}
   <button class="go" data-act="open" data-id="${l.id}">시작하기</button></div>
  <section class="unit"><h2>이 코스의 레슨</h2><div class="lessons">${u.items.map((x,k)=>{const p=S.progress[x.id];
    return `<button class="lrow" data-act="open" data-id="${x.id}"><span class="num${p?' done':''}">${k+1}</span><span class="lt"><b>${x.title}</b><span>${x.sub}</span></span>
    <span class="lr">${x.kind==='read'?(p?'<span class="stars">읽음</span>':`카드 ${x.pages.length}장`):p?`<span class="stars">${starsFor(p.best)}</span><br>${p.best}점 · ${p.bpm}`:`${x.bpm} BPM`}</span></button>`}).join('')}</div></section>
  <button class="linkbtn" data-act="tab" data-t="course">다른 코스 선택하기</button>`;}
