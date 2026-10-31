// 패턴 재생, 진행 표시, 화면 꺼짐 방지
/* ---------- run a pattern ---------- */
let run=null,raf=0;
function schedule(lesson,bpm,{countIn,notes,clicks}){
  ensureCtx();const beat=60/bpm,step=beat/lesson.spb,n=lesson.tokens.length,barDur=n*step;
  const out=ctx.createGain();out.connect(ctx.destination);
  const start=ctx.currentTime+0.2;const t0=countIn?start+4*beat:start;
  if(countIn)for(let k=0;k<4;k++)click(start+k*beat,k===0,out);
  const list=[];
  for(let b=0;b<BARS;b++)lesson.tokens.forEach((tk,i)=>{if(!tk)return;const t=t0+(b*n+i)*step;list.push({t,bar:b,i,accent:tk.accent});if(notes)drum(t,tk.accent,out);});
  if(clicks)for(let k=0;k<BARS*4;k++)click(t0+k*beat,k%4===0,out,0.35);
  return {out,start,t0,end:t0+BARS*barDur,beat,step,n,notes:list};}
function stopRun(){if(run){try{run.out.disconnect()}catch(e){}run=null}cancelAnimationFrame(raf);collect=null;releaseWake();}
function loop(onEnd){
  const r=run;if(!r)return;
  const now=ctx.currentTime-(ctx.outputLatency||0);
  const cd=document.getElementById('cd');
  if(now<r.t0){if(cd){cd.hidden=r.t0===r.start;cd.textContent=Math.max(1,4-Math.floor((now-r.start)/r.beat));}}
  else if(cd)cd.hidden=true;
  const idx=now>=r.t0&&now<r.end?Math.floor((now-r.t0)/r.step):-1;
  const local=idx>=0?idx%r.n:-1,bar=idx>=0?Math.floor(idx/r.n):0;
  document.querySelectorAll('#live .cell').forEach((c,i)=>c.classList.toggle('now',i===local));
  const bi=document.getElementById('barno');if(bi)bi.textContent=`${Math.min(bar+1,BARS)} / ${BARS}`;
  if(ctx.currentTime>r.end+0.25){const c=collect;stopRun();onEnd(r,c);return;}
  raf=requestAnimationFrame(()=>loop(onEnd));}
let wake=null;async function holdWake(){try{wake=await navigator.wakeLock?.request('screen')}catch(e){}}
function releaseWake(){try{wake&&wake.release()}catch(e){}wake=null}
