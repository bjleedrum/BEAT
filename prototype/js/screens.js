// 코스·레슨·결과·설정 화면, render
function vCourse(){
  const cur=curCourse();
  return `<div class="top"><span class="brand">코스</span><button class="iconbtn" data-act="settings" aria-label="설정">${IC.gear}</button></div>
  ${LEVELS.map((lv,li)=>`<section class="level"><span class="lvbadge">${lv.code}</span><h1>${lv.name}</h1><p><b>${lv.code}:</b> ${lv.desc}</p></section>
   ${UNITS.map((u,ui)=>u.lv!==li?'':(()=>{const done=u.items.filter(x=>S.progress[x.id]).length,full=done===u.items.length;
    return `<button class="ccard${ui===cur?' sel':''}" data-act="pick" data-u="${ui}">
     <span class="ch"><span class="ct${full?' full':''}">${esc(u.title)}${full?'<span class="ok" aria-label="완료">✓</span>':''}</span><span class="lvchip">${lv.code}</span></span>
     <span class="cd">${esc(u.desc)}</span>
     <span class="cf"><span class="pick">${ui===cur?'학습 중':'선택'}</span><span class="cnum">${done}/${u.items.length} 레슨</span></span></button>`})()).join('')}`).join('')}`;}

function vLesson(){
  const l=S.lesson,ph=S.phase,busy=ph==='listen'||ph==='play';
  const stepOn=ph==='result'?3:(ph==='play'||S.listened)?2:1;
  const coach={intro:'먼저 패턴을 들어보세요. R은 오른손, L은 왼손이에요.',listen:'잘 들어보세요. 굵은 음은 악센트예요.',
    ready:`이제 따라 쳐보세요. 카운트 4번 뒤에 ${BARS}마디를 칩니다.`,play:S.settings.mode==='mic'?'패드를 쳐서 따라 해요!':'아래 패드를 박자에 맞춰 탭하세요!'}[ph==='intro'&&S.listened?'ready':ph];
  return `<div class="top"><button class="iconbtn" data-act="home" aria-label="레슨 목록">${IC.back}</button>
   <div class="steps" style="flex:1;max-width:200px"><span class="on"></span><span class="${stepOn>=2?'on':''}"></span><span class="${stepOn>=3?'on':''}"></span></div>
   <button class="iconbtn" data-act="settings" aria-label="설정">${IC.gear}</button></div>
  <h1>${l.title}</h1>
  <div class="coach"><span class="av">B</span><div class="bubble">${coach}</div></div>
  <div class="stage"><div class="stagehead"><span>마디 <b id="barno">1 / ${BARS}</b></span><span><b>${S.bpm}</b> BPM · 4/4</span></div>
   ${notation(l,{id:'live'})}<div class="countdown" id="cd" hidden>4</div></div>
  ${busy?'':`<div class="bpm"><button data-act="bpm" data-d="-5" aria-label="BPM 낮추기">−</button><div class="v">${S.bpm}<small>BPM</small></div><button data-act="bpm" data-d="5" aria-label="BPM 올리기">+</button></div>
   <div class="toggle"><span>연주할 때 메트로놈 소리<br><span class="hint">${S.settings.mode==='mic'?'마이크 모드에선 이어폰을 꼈을 때만 켜세요':'켜두면 박자 잡기가 쉬워요'}</span></span><button class="sw" role="switch" aria-checked="${S.clickOn}" data-act="click" aria-label="메트로놈 소리"></button></div>`}
  ${ph==='play'?(S.settings.mode==='mic'?`<div class="micring"><span class="dot"></span><span>듣고 있어요</span><div class="meter"><i id="lvl"></i></div></div>`:`<div class="pad" data-pad>여기를 탭</div>`):''}
  <div class="actions">${busy?`<button class="btn" data-act="stop">멈춤</button>`:
   S.listened?`<button class="btn primary" data-act="play">따라 치기</button><button class="btn" data-act="listen">다시 듣기</button>`:
   `<button class="btn primary" data-act="listen">듣기</button><button class="btn ghost" data-act="play">바로 따라 치기</button>`}</div>`;}

function vChart(R){
  const W=340,H=150,pad=28,top=14,bot=H-22,mid=(top+bot)/2,sc=(bot-top)/2/100,n=R.res.length;
  const x=i=>pad+(n===1?0:(W-pad-8)*(i/(n-1)));const y=o=>mid-Math.max(-100,Math.min(100,o))*sc;
  const col={perfect:'var(--perfect)',good:'var(--good)',early:'var(--off)',late:'var(--off)'};
  let g=`<rect x="${pad}" y="${y(40)}" width="${W-pad-8}" height="${y(-40)-y(40)}" fill="var(--perfect)" opacity=".1"/>`;
  [100,50,0,-50,-100].forEach(v=>{g+=`<line x1="${pad}" x2="${W-8}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="${v?1:1.5}"/><text x="${pad-5}" y="${y(v)+3.5}" text-anchor="end" font-size="9" fill="var(--muted)" font-family="JetBrains Mono,monospace">${v>0?'+':''}${v}</text>`;});
  const barN=R.res.filter(r=>r.bar===0).length;if(barN<n)g+=`<line x1="${(x(barN-1)+x(barN))/2}" x2="${(x(barN-1)+x(barN))/2}" y1="${top}" y2="${bot}" stroke="var(--line)" stroke-dasharray="3 3"/>`;
  R.res.forEach((r,i)=>{if(r.off===null){const cx=x(i),cy=mid;g+=`<path d="M${cx-4} ${cy-4}L${cx+4} ${cy+4}M${cx+4} ${cy-4}L${cx-4} ${cy+4}" stroke="var(--miss)" stroke-width="2" fill="none"/>`;}
    else g+=`<line x1="${x(i)}" x2="${x(i)}" y1="${mid}" y2="${y(r.off)}" stroke="${col[r.grade]}" stroke-width="2" opacity=".5"/><circle cx="${x(i)}" cy="${y(r.off)}" r="${n>20?3.5:4.5}" fill="${col[r.grade]}"/>`;});
  g+=`<text x="${pad}" y="${H-6}" font-size="10" fill="var(--muted)" font-family="IBM Plex Sans KR,sans-serif">위쪽 = 늦게 침 · 아래쪽 = 빨리 침 (ms)</text>`;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="음별 타이밍 편차 그래프">${g}</svg></div>`;}

function vResult(){
  const R=S.result,l=S.lesson;const word=R.score>=90?['완벽해요','박자가 아주 안정적이에요']:R.score>=75?['좋아요','조금만 다듬으면 돼요']:R.score>=50?['조금만 더','한 번 더 해볼까요']:['다시 해봐요','BPM을 낮춰보세요'];
  const ms=v=>`${v>0?'+':''}${Math.round(v)}`;
  return `<div class="top"><button class="iconbtn" data-act="home" aria-label="레슨 목록">${IC.back}</button>
   <div class="steps" style="flex:1;max-width:200px"><span class="on"></span><span class="on"></span><span class="on"></span></div><span style="width:40px"></span></div>
  <h2>${l.title} · ${S.bpm} BPM</h2>
  <div class="score"><span class="n">${R.score}</span><span class="of">/100</span><span class="word">${word[0]}<small>${word[1]}</small></span></div>
  <div class="stats"><div class="stat p"><b>${R.counts.perfect}</b><span>정확</span></div><div class="stat g"><b>${R.counts.good}</b><span>좋음</span></div>
   <div class="stat o"><b>${R.counts.off}</b><span>빠름·늦음</span></div><div class="stat m"><b>${R.counts.miss}</b><span>놓침</span></div></div>
  <div class="metrics"><span>평균 <b>${ms(R.mean)}ms</b></span><span>편차 <b>±${Math.round(R.sd)}ms</b></span>${R.acc?`<span>악센트 <b>${R.acc.ok}/${R.acc.total}</b></span>`:`<span>잡음 <b>${R.extras}</b></span>`}</div>
  <div class="stage">${Array.from({length:BARS},(_,b)=>notation(l,{bar:b,graded:R.res})).join('')}</div>
  ${vChart(R)}
  <ul class="tips">${tips(R,l).map(([t,c])=>`<li style="--tip:${c}">${esc(t)}</li>`).join('')}</ul>
  <div class="actions"><button class="btn primary" data-act="play">다시 하기</button>
   ${R.score>=80&&S.bpm<160?`<button class="btn" data-act="harder">BPM ${S.bpm+5}로 도전</button>`:''}
   ${R.score<50&&S.bpm>40?`<button class="btn" data-act="easier">BPM ${S.bpm-5}로 연습</button>`:''}
   <button class="btn ghost" data-act="home">레슨 목록</button></div>`;}

function vSettings(){
  const m=S.settings.mode,L=S.settings.lat[m];
  const th=S.settings.theme;
  return `<div class="top"><button class="iconbtn" data-act="back" aria-label="뒤로">${IC.back}</button><span style="font-weight:600">설정</span><span style="width:40px"></span></div>
  <div class="card"><h2>테마</h2><div class="seg"><button data-act="theme" data-v="light" aria-pressed="${th==='light'}">라이트</button><button data-act="theme" data-v="dark" aria-pressed="${th==='dark'}">다크</button></div></div>
  <div class="card"><h2>입력 방식</h2><div class="seg"><button data-act="mode" data-m="mic" aria-pressed="${m==='mic'}">휴대폰 마이크</button><button data-act="mode" data-m="tap" aria-pressed="${m==='tap'}">화면 탭</button></div>
   <span class="hint">${m==='mic'?'연습패드나 스네어를 치면 마이크로 타격을 감지해요. 휴대폰은 패드에서 30–50cm 떨어진 곳에 두세요.':'마이크 없이 화면을 손가락으로 탭해서 연습해요. 세기(악센트)는 평가하지 않아요.'}</span>${m==='tap'?`<div class="toggle"><span>탭할 때 드럼 소리<br><span class="hint">휴대폰에 따라 소리가 늦게 들릴 수 있어요. 헷갈리면 끄세요.</span></span><button class="sw" role="switch" aria-checked="${S.settings.tapSound!==false}" data-act="tapsnd" aria-label="탭 소리"></button></div>`:''}</div>
  ${m==='mic'?`<div class="card"><h2>감도</h2>
   ${mic.ok?`<div class="micring" style="padding:0;border:0"><span class="dot"></span><div class="meter"><i id="lvl"></i><u id="thrmark"></u></div></div>
   <input type="range" id="sens" min="1" max="10" step="1" value="${S.settings.sens}" aria-label="감도">
   <span class="hint">패드를 쳤을 때만 점이 켜지면 적당해요. 말소리에도 켜지면 감도를 낮추고, 약하게 칠 때 안 켜지면 올리세요.</span>`:
   `<button class="btn" data-act="micon">마이크 켜기</button><span class="hint">브라우저가 마이크 권한을 물어보면 허용해 주세요.</span>`}</div>`:''}
  <div class="card"><h2>지연 보정</h2>
   <div class="latv">${L==null?'—':Math.round(L*1000)}<small> ms${L==null?' · 아직 보정 안 함':''}</small></div>
   <span class="hint">${m==='mic'?'휴대폰마다 소리가 나가고 들어오는 데 걸리는 시간이 달라요. 이 값을 빼고 채점해요.':'화면 터치가 인식되기까지 걸리는 시간을 측정해요.'}</span>
   ${m==='mic'?`<div class="row2"><button class="btn primary" data-act="cal" data-k="auto">자동 보정</button><button class="btn" data-act="cal" data-k="manual">직접 쳐서 보정</button></div>
   <span class="hint">자동: 조용한 곳에서 이어폰을 빼고 스피커 음량을 높인 뒤 누르세요. 클릭 8번을 마이크로 다시 들어 측정해요.<br>직접: 이어폰을 끼고 클릭 10번에 맞춰 패드를 치세요.</span>`
   :`<button class="btn primary" data-act="cal" data-k="manual">클릭에 맞춰 탭해서 보정</button>${S.calKind?'<div class="pad" data-pad>클릭에 맞춰 탭</div>':''}`}
   <div class="status${/실패|못/.test(S.calStatus)?' err':/완료/.test(S.calStatus)?' ok':''}" id="calst">${esc(S.calStatus)}</div></div>`;}

let prevView='home';
function render(){
  const tabbed=S.view==='home'||S.view==='course';
  $app.innerHTML=S.view==='home'?vHome():S.view==='course'?vCourse():S.view==='settings'?vSettings():S.view==='read'?vRead():S.phase==='result'?vResult():vLesson();
  $app.classList.toggle('tabbed',tabbed);document.body.classList.toggle('tabbed',tabbed);
  $tabs.innerHTML=tabbed?vTabbar():'';
  const sens=document.getElementById('sens');
  if(sens)sens.oninput=e=>{S.settings.sens=+e.target.value;persist();mic.node&&mic.node.port.postMessage({thr:thr()});};
  window.scrollTo(0,0);}
/* meter loop */
(function meter(){const i=document.getElementById('lvl');if(i){const db=v=>Math.max(0,Math.min(1,(20*Math.log10(Math.max(v,1e-5))+60)/60));i.style.width=(db(mic.level)*100)+'%';const t=document.getElementById('thrmark');if(t)t.style.left=(db(thr())*100)+'%';}requestAnimationFrame(meter);})();
let toastT=0;function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,4200);}
