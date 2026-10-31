// 채점과 피드백 문구
/* ---------- scoring ---------- */
function evaluate(r,hitsRaw,lesson,mode){
  const win=Math.min(0.18,r.step*0.5);
  /* base latency: calibrated value, or default + the device's audio output delay (what you hear lags the schedule) */
  const outLat=(ctx&&(ctx.outputLatency||ctx.baseLatency))||0;
  const L0=S.settings.lat[mode]!=null?S.settings.lat[mode]:DEF_LAT[mode]+(mode==='tap'?outLat:0);
  /* auto-align: find the constant shift (±350ms) that lines up the most hits, preferring the smallest shift */
  const countAt=s=>{let c=0;r.notes.forEach(nt=>{if(hitsRaw.some(h=>Math.abs(h.t-L0-s-nt.t)<=win*0.6))c++;});return c;};
  let shift=0,best=countAt(0);
  for(let k=1;k<=70;k++)for(const s of [k*0.005,-k*0.005]){const c=countAt(s);if(c>best){best=c;shift=s;}}
  if(best){const ds=[];r.notes.forEach(nt=>{let m=null;hitsRaw.forEach(h=>{const d=h.t-L0-shift-nt.t;if(Math.abs(d)<=win&&(m===null||Math.abs(d)<Math.abs(m)))m=d;});if(m!==null)ds.push(m);});
    if(ds.length){ds.sort((a,b)=>a-b);shift+=ds[Math.floor(ds.length/2)];}}
  const L=L0+shift;
  const hits=hitsRaw.map(h=>({t:h.t-L,peak:h.peak,used:false})).filter(h=>h.t>r.t0-win&&h.t<r.end+win);
  const pairs=[];r.notes.forEach((nt,ni)=>hits.forEach((h,hi)=>{const d=h.t-nt.t;if(Math.abs(d)<=win)pairs.push({ni,hi,d});}));
  pairs.sort((a,b)=>Math.abs(a.d)-Math.abs(b.d));
  const res=r.notes.map(nt=>({...nt,off:null,grade:'miss',peak:null}));
  pairs.forEach(p=>{if(res[p.ni].off!==null||hits[p.hi].used)return;hits[p.hi].used=true;res[p.ni].off=p.d*1000;res[p.ni].peak=hits[p.hi].peak;});
  res.forEach(x=>{if(x.off===null)return;const a=Math.abs(x.off);x.grade=a<=40?'perfect':a<=80?'good':x.off<0?'early':'late';});
  const extras=hits.filter(h=>!h.used).length;
  const pts={perfect:100,good:85,early:60,late:60,miss:0};
  let score=res.reduce((s,x)=>s+pts[x.grade],0)/res.length-extras*2;
  const matched=res.filter(x=>x.off!==null),offs=matched.map(x=>x.off);
  const mean=offs.length?offs.reduce((a,b)=>a+b,0)/offs.length:0;
  const sd=offs.length>1?Math.sqrt(offs.reduce((a,b)=>a+(b-mean)**2,0)/(offs.length-1)):0;
  let acc=null;
  if(lesson.hasAccent&&mode==='mic'){
    const soft=matched.filter(x=>!x.accent).map(x=>x.peak).sort((a,b)=>a-b);
    const med=soft.length?soft[Math.floor(soft.length/2)]:null;
    const accN=res.filter(x=>x.accent);
    if(med){let ok=0;accN.forEach(x=>{x.accOk=x.peak!=null&&x.peak>=med*1.15;if(x.accOk)ok++;});acc={ok,total:accN.length};score=score*0.85+15*(ok/accN.length);}
  }
  score=Math.max(0,Math.min(100,Math.round(score)));
  const cnt=g=>res.filter(x=>x.grade===g).length;
  return {score,res,extras,mean,sd,acc,counts:{perfect:cnt('perfect'),good:cnt('good'),off:cnt('early')+cnt('late'),miss:cnt('miss')},calibrated:S.settings.lat[mode]!=null,mode,shift};}
function tips(R,lesson){
  const t=[],m=Math.round(Math.abs(R.mean));
  if(R.counts.miss>R.res.length*0.6){t.push(['소리가 거의 안 잡혔어요. 설정에서 감도를 올리거나 휴대폰을 패드 가까이 두세요.','var(--miss)']);return t;}
  if(R.mean<-25)t.push([`전체적으로 ${m}ms 정도 서두르고 있어요. 클릭 소리를 끝까지 듣고 치는 느낌으로 가보세요.`,'var(--off)']);
  else if(R.mean>25)t.push([`전체적으로 ${m}ms 정도 늦게 들어가요. 스틱을 미리 들어 올려 준비해 두세요.`,'var(--off)']);
  if(R.sd>45)t.push([`음마다 타이밍 편차가 커요(±${Math.round(R.sd)}ms). BPM을 5 낮춰서 고르게 치는 데 집중해 보세요.`,'var(--off)']);
  if(R.counts.miss)t.push([`${R.counts.miss}개를 놓쳤어요. ${lesson.id==='offbeat'?'엇박은 정박을 머릿속으로 세면서 &에서만 쳐야 해요.':'점선으로 표시된 음을 확인해 보세요.'}`,'var(--miss)']);
  if(R.extras)t.push([`박자 밖에서 ${R.extras}번 소리가 잡혔어요. 주변 소음 때문이면 설정에서 감도를 낮춰 보세요.`,'var(--muted)']);
  if(Math.abs(R.shift)>0.04)t.push([`기기 지연 때문에 전체가 ${Math.round(Math.abs(R.shift)*1000)}ms 밀려 있어서 자동으로 맞춰 채점했어요. 설정에서 지연 보정을 해두면 더 정확해요.`,'var(--muted)']);
  if(R.acc&&R.acc.ok<R.acc.total)t.push([`악센트 ${R.acc.total}개 중 ${R.acc.ok}개가 살아 있어요. 악센트는 높이서, 나머지는 패드 가까이에서 치세요.`,'var(--off)']);
  if(lesson.hasAccent&&R.mode==='tap')t.push(['화면 탭 모드에서는 세기(악센트)를 평가하지 않아요.','var(--muted)']);
  if(!R.calibrated)t.push(['아직 지연 보정을 안 해서 전체가 조금 밀려 보일 수 있어요. 설정에서 한 번 보정해 두세요.','var(--muted)']);
  if(R.score>=90)t.unshift(['아주 안정적이에요. BPM을 올려서 도전해 보세요.','var(--perfect)']);
  if(!t.length)t.push(['좋아요. 한 번 더 쳐서 감을 굳혀 보세요.','var(--accent)']);
  return t;}
