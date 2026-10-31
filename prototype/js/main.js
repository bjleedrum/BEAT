// 버튼 동작, 입력 이벤트, 앱 시작
/* ---------- actions ---------- */
function markDay(){const k=new Date().toLocaleDateString('sv-SE');if(!S.days.includes(k)){S.days.push(k);S.days=S.days.slice(-120);}}
async function startPlay(){
  ensureCtx();
  if(S.settings.mode==='mic'&&!(await initMic())){S.settings.mode='tap';S.clickOn=true;persist();toast('마이크를 쓸 수 없어 화면 탭 모드로 바꿨어요. 휴대폰 브라우저에서 열면 마이크로 연습할 수 있어요.');}
  S.phase='play';render();holdWake();
  collect=[];run=schedule(S.lesson,S.bpm,{countIn:true,notes:false,clicks:S.clickOn});
  loop((r,hits)=>{const R=evaluate(r,hits||[],S.lesson,S.settings.mode);S.result=R;
    const p=S.progress[S.lesson.id];if(!p||R.score>p.best||(R.score===p.best&&S.bpm>p.bpm))S.progress[S.lesson.id]={best:R.score,bpm:S.bpm};
    markDay();persist();S.phase='result';render();});}
function startListen(){S.phase='listen';render();run=schedule(S.lesson,S.bpm,{countIn:false,notes:true,clicks:true});loop(()=>{S.listened=true;S.phase='intro';render();});}
async function calibrate(kind){
  ensureCtx();const m=S.settings.mode;
  if(m==='mic'&&!(await initMic())){S.calStatus='마이크를 켜지 못했어요. 브라우저 권한을 확인해 주세요.';render();return;}
  S.calKind=kind;S.calStatus=kind==='auto'?'측정 중… 휴대폰을 그대로 두세요':'클릭에 맞춰 치세요…';render();
  const iv=kind==='auto'?0.5:0.6667,N=kind==='auto'?8:10,out=ctx.createGain();out.connect(ctx.destination);
  const st=ctx.currentTime+0.4,cl=[];for(let k=0;k<N;k++){cl.push(st+k*iv);click(st+k*iv,k===0,out,kind==='auto'?1:0.6);}
  collect=[];const endT=st+N*iv+0.5;
  await new Promise(res=>{(function w(){if(ctx.currentTime>endT)res();else requestAnimationFrame(w)})()});
  const hits=collect;collect=null;out.disconnect();const offs=[];
  cl.forEach((c,k)=>{if(kind==='auto'){const h=hits.find(h=>h.t>=c&&h.t<=c+0.45);if(h)offs.push(h.t-c);}
    else if(k>=2){let best=null;hits.forEach(h=>{const d=h.t-c;if(Math.abs(d)<=iv/2&&(best===null||Math.abs(d)<Math.abs(best)))best=d;});if(best!==null)offs.push(best);}});
  S.calKind='';
  if(offs.length<5){S.calStatus=kind==='auto'?'측정 실패: 클릭이 잘 안 들렸어요. 음량을 높이고 조용한 곳에서 다시 해보세요.':'측정 실패: 클릭에 맞춘 타격이 부족해요. 다시 해보세요.';}
  else{offs.sort((a,b)=>a-b);const med=offs[Math.floor(offs.length/2)];S.settings.lat[m]=Math.max(0,Math.min(0.5,med));persist();S.calStatus=`보정 완료: ${Math.round(S.settings.lat[m]*1000)}ms (${offs.length}회 측정)`;}
  render();}

document.addEventListener('click',e=>{
  const a=e.target.closest('[data-act]');if(!a)return;const act=a.dataset.act;
  if(act==='open'&&LESSONS.find(l=>l.id===a.dataset.id).kind==='read'){S.lesson=LESSONS.find(l=>l.id===a.dataset.id);S.page=0;S.view='read';render();}
  else if(act==='flip'){const r=a.getBoundingClientRect();flip(e.clientX-r.left<r.width*0.3?-1:1);}
  else if(act==='flipto'){flip(+a.dataset.d);}
  else if(act==='readdone'){S.progress[S.lesson.id]={read:true};markDay();persist();S.view=S.tab;render();}
  else if(act==='open'){S.lesson=LESSONS.find(l=>l.id===a.dataset.id);S.bpm=S.progress[S.lesson.id]?.bpm||S.lesson.bpm;S.phase='intro';S.listened=false;S.clickOn=S.settings.mode==='tap';S.view='lesson';ensureCtx();render();}
  else if(act==='home'){stopRun();S.view=S.tab;render();}
  else if(act==='pick'){S.course=UNITS[+a.dataset.u].id;persist();S.tab='home';S.view='home';render();}
  else if(act==='tab'){S.tab=a.dataset.t;S.view=S.tab;render();}
  else if(act==='settings'){stopRun();if(S.view==='lesson'&&S.phase!=='result')S.phase='intro';prevView=S.view;S.view='settings';S.calStatus='';render();}
  else if(act==='back'){S.view=prevView;render();}
  else if(act==='listen'){stopRun();startListen();}
  else if(act==='play'){stopRun();startPlay();}
  else if(act==='stop'){stopRun();S.phase='intro';render();}
  else if(act==='bpm'){S.bpm=Math.max(40,Math.min(160,S.bpm+ +a.dataset.d));render();}
  else if(act==='harder'){S.bpm+=5;S.phase='intro';render();}
  else if(act==='easier'){S.bpm-=5;S.phase='intro';render();}
  else if(act==='click'){S.clickOn=!S.clickOn;render();}
  else if(act==='tapsnd'){S.settings.tapSound=S.settings.tapSound===false;persist();render();}
  else if(act==='theme'){S.settings.theme=a.dataset.v;persist();applyTheme();render();}
  else if(act==='mode'){S.settings.mode=a.dataset.m;S.calStatus='';persist();render();}
  else if(act==='micon'){initMic().then(ok=>{if(!ok)S.calStatus='마이크를 켜지 못했어요. 이 화면에서는 마이크가 막혀 있을 수 있어요.';render();});}
  else if(act==='cal'){calibrate(a.dataset.k);}
});
document.addEventListener('pointerdown',e=>{
  if(!e.target.closest('[data-pad]')||!ctx)return;e.preventDefault();
  tapSound();onHit({t:ctx.currentTime-Math.max(0,(performance.now()-e.timeStamp)/1000),peak:null});});
function tapSound(){if(S.settings.tapSound===false)return;try{ensureCtx();drum(ctx.currentTime,false,ctx.destination);}catch(e){}}
function flip(d){const n=S.lesson.pages.length,i=Math.max(0,Math.min(n-1,S.page+d));if(i!==S.page){S.page=i;render();}}
document.addEventListener('keydown',e=>{if(S.view==='read'&&(e.key==='ArrowRight'||e.key==='ArrowLeft')){flip(e.key==='ArrowRight'?1:-1);return;}if(e.code==='Space'&&document.querySelector('[data-pad]')&&ctx){e.preventDefault();tapSound();onHit({t:ctx.currentTime,peak:null});}});
function applyTheme(){document.documentElement.dataset.theme=S.settings.theme;}
applyTheme();
render();
