// 오디오: 드럼/클릭 소리, 마이크 타격 감지
/* ---------- audio ---------- */
let ctx=null,noiseBuf=null;const mic={ok:false,node:null,level:0};
let collect=null;
function ensureCtx(){
  if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)({latencyHint:'interactive'});
    noiseBuf=ctx.createBuffer(1,ctx.sampleRate*0.3,ctx.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
  if(ctx.state!=='running')ctx.resume();return ctx;}
function drum(t,accent,out){
  const g=ctx.createGain(),v=accent?0.9:0.38;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.16);
  const n=ctx.createBufferSource();n.buffer=noiseBuf;const hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=1200;
  n.connect(hp).connect(g);n.start(t);n.stop(t+0.2);
  const o=ctx.createOscillator(),og=ctx.createGain();o.type='triangle';o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(140,t+0.08);
  og.gain.setValueAtTime(v*0.8,t);og.gain.exponentialRampToValueAtTime(0.001,t+0.09);o.connect(og).connect(out);o.start(t);o.stop(t+0.1);
  g.connect(out);}
function click(t,strong,out,vol=0.5){
  const o=ctx.createOscillator(),g=ctx.createGain();o.type='square';o.frequency.value=strong?1760:1175;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.035);o.connect(g).connect(out);o.start(t);o.stop(t+0.05);}
const WORKLET=`class P extends AudioWorkletProcessor{constructor(){super();this.f=0;this.s=0;this.last=-1;this.thr=0.03;this.left=0;this.pk=0;this.t=0;this.lv=0;this.ln=0;
const sr=sampleRate;this.aF=1-Math.exp(-1/(sr*0.001));this.rF=1-Math.exp(-1/(sr*0.012));this.aS=1-Math.exp(-1/(sr*0.12));
this.port.onmessage=e=>{if(e.data.thr!=null)this.thr=e.data.thr}}
process(inp){const c=inp[0]&&inp[0][0];if(!c)return true;const sr=sampleRate;
for(let i=0;i<c.length;i++){const x=Math.abs(c[i]);this.f+=(x>this.f?this.aF:this.rF)*(x-this.f);this.s+=this.aS*(x-this.s);const t=currentTime+i/sr;
if(this.left>0){if(x>this.pk)this.pk=x;if(--this.left===0)this.port.postMessage({type:'on',t:this.t,peak:this.pk})}
else if(this.f>this.thr&&this.f>this.s*2.2&&t-this.last>0.06){this.last=t;this.t=t;this.pk=x;this.left=Math.round(sr*0.02)}
if(x>this.lv)this.lv=x}
this.ln+=c.length;if(this.ln>sr*0.04){this.port.postMessage({type:'lv',v:this.lv});this.lv=0;this.ln=0}return true}}
registerProcessor('onset',P);`;
async function initMic(){
  if(mic.ok)return true;ensureCtx();
  try{
    if(!navigator.mediaDevices||!ctx.audioWorklet)throw new Error('unsupported');
    const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
    const url=URL.createObjectURL(new Blob([WORKLET],{type:'application/javascript'}));
    await ctx.audioWorklet.addModule(url);
    const src=ctx.createMediaStreamSource(stream),node=new AudioWorkletNode(ctx,'onset'),z=ctx.createGain();z.gain.value=0;
    src.connect(node).connect(z).connect(ctx.destination);
    node.port.onmessage=e=>{const d=e.data;if(d.type==='lv')mic.level=d.v;else if(d.type==='on')onHit({t:d.t,peak:d.peak});};
    mic.node=node;mic.ok=true;node.port.postMessage({thr:thr()});return true;
  }catch(e){return false}}
function onHit(h){if(collect)collect.push(h);flash();}
function flash(){document.querySelectorAll('.pad,.dot').forEach(el=>{el.classList.add('hit');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('hit'),90)});}
