// 앱 상태, 설정, 저장(localStorage)
/* ---------- state ---------- */
const store={get(){try{return JSON.parse(localStorage.getItem('beat-v1'))||{}}catch(e){return{}}},set(v){try{localStorage.setItem('beat-v1',JSON.stringify(v))}catch(e){}}};
const saved=store.get();
const S={view:'home',tab:'home',lesson:null,phase:'intro',listened:false,bpm:60,clickOn:false,result:null,
  settings:Object.assign({mode:'mic',sens:5,lat:{mic:null,tap:null},theme:(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'},saved.settings||{}),
  progress:saved.progress||{},days:saved.days||[],course:saved.course??null,calStatus:'',calKind:''};
const persist=()=>store.set({settings:S.settings,progress:S.progress,days:S.days,course:S.course});
const DEF_LAT={mic:0.1,tap:0.03};
const lat=()=>S.settings.lat[S.settings.mode]??DEF_LAT[S.settings.mode];
const thr=()=>0.2*Math.pow(0.6,S.settings.sens-1);
