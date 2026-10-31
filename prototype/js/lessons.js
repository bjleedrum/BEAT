// 레슨·코스 데이터 (UNITS, LEVELS)
/* ---------- lessons ---------- */
const UNITS=[
 {id:'basics',name:'드럼 기초 상식',lv:0,title:'드럼 기초 상식',desc:'드럼 세트 이름, 앉는 자세, 스틱 쥐는 법: 치기 전에 알아두면 좋은 기본 상식을 카드로 배워보세요.',items:[
  {id:'kit',kind:'read',title:'드럼 세트 이름',sub:'각 부분의 이름과 역할',pages:[
   {fig:'kit:',t:'드럼 세트 한눈에 보기',b:'드럼 세트는 북(드럼)과 심벌로 이루어져 있어요. 오른손잡이 기준으로 의자에 앉았을 때 보이는 모습이에요. 하나씩 이름을 알아볼게요.'},
   {fig:'kit:kick',t:'킥 드럼',b:'가장 큰 북이에요. 베이스 드럼이라고도 불러요. 오른발로 페달을 밟아서 치고, \'쿵\' 하는 낮은 소리로 리듬의 바닥을 받쳐줘요.'},
   {fig:'kit:snare',t:'스네어 드럼',b:'다리 사이 앞에 놓인 북이에요. 아랫면에 붙은 철사 줄 때문에 \'착\' 하는 날카로운 소리가 나요. BEAT의 레슨은 대부분 스네어나 연습패드로 쳐요.'},
   {fig:'kit:hihat',t:'하이햇',b:'심벌 두 장을 위아래로 마주 붙인 거예요. 왼발 페달로 열고 닫아요. 닫고 치면 \'칙\', 열고 치면 \'치이\' 소리가 나고, 박을 잘게 쪼개는 역할을 해요.'},
   {fig:'kit:tom',t:'탐탐',b:'킥 드럼 위에 달린 작은 북들이에요. 리듬과 리듬 사이를 이어주는 짧은 구간(필인)에서 주로 쳐요. 크기가 작을수록 소리가 높아요.'},
   {fig:'kit:floor',t:'플로어 탐',b:'다리를 바닥에 대고 서 있는 큰 탐이에요. 탐 중에서 가장 낮고 묵직한 소리가 나요.'},
   {fig:'kit:crash',t:'크래시 심벌',b:'강조하고 싶을 때 \'촤악\' 하고 치는 심벌이에요. 곡이 시작할 때나 새로운 부분의 첫 박에 자주 써요.'},
   {fig:'kit:ride',t:'라이드 심벌',b:'세트에서 가장 큰 심벌이에요. 하이햇 대신 \'띵 띵\' 하고 일정한 리듬을 이어갈 때 써요.'}]},
  {id:'posture',kind:'read',title:'앉는 자세',sub:'의자 높이와 몸의 위치',pages:[
   {fig:'posture',t:'의자 높이',b:'드럼 의자(스로운)에 앉았을 때 허벅지가 바닥과 거의 평행하거나, 무릎이 엉덩이보다 살짝 낮으면 좋아요. 너무 낮으면 페달을 밟기 힘들어요.'},
   {fig:'posture',t:'스네어와의 거리',b:'스네어 가운데가 몸 정면에 오게 앉아요. 스틱을 내렸을 때 허벅지에 닿지 않을 만큼 떨어지고, 팔꿈치는 몸 옆에 편하게 내려오면 돼요.'},
   {fig:'kit:kick',t:'발 위치',b:'오른발은 킥 페달, 왼발은 하이햇 페달 위에 올려요. 두 다리는 자연스럽게 벌리고, 무릎 각도는 90도보다 조금 넓게 두세요.'},
   {fig:'posture',t:'상체와 어깨',b:'허리는 곧게 세우되 힘은 빼요. 어깨가 올라가면 금방 지쳐요. 팔을 어깨에서 툭 떨어뜨린 상태에서 시작하세요.'},
   {fig:null,t:'연습패드로 할 때',b:'의자에 앉아 무릎 위나 스탠드에 패드를 올려요. 패드 높이는 배꼽보다 조금 아래가 좋아요. 휴대폰은 패드에서 30~50cm 떨어진 곳에 두세요.'}]},
  {id:'grip',kind:'read',title:'스틱 쥐는 법',sub:'매치드 그립과 받침점',pages:[
   {fig:'stick',t:'매치드 그립',b:'양손을 똑같은 모양으로 쥐는 방법이에요. 대부분 이 방법으로 시작하고, BEAT도 매치드 그립을 기준으로 해요.'},
   {fig:'stick:f',t:'받침점 찾기',b:'스틱 끝(손잡이 쪽)에서 약 1/3 지점을 엄지 안쪽과 검지 첫째 마디 사이로 잡아요. 이곳이 시소의 중심처럼 스틱이 튕겨 오르는 축이 돼요.'},
   {fig:'stick:f',t:'나머지 손가락',b:'중지, 약지, 새끼손가락은 스틱을 가볍게 감싸기만 해요. 꽉 쥐면 스틱이 튀어 오르지 않고, 손목과 팔이 금방 아파요.'},
   {fig:null,t:'손등 방향',b:'손등이 거의 위를 보면 저먼 그립(힘이 잘 실림), 엄지가 위를 보면 프렌치 그립(손가락 컨트롤), 그 중간이 아메리칸 그립이에요. 처음엔 중간 각도로 시작하세요.'},
   {fig:'stroke:full',t:'반동 이용하기',b:'패드를 치면 스틱이 위로 튀어 올라요. 이 반동을 막지 말고 따라 올라가게 두는 게 핵심이에요. 내려칠 때만 힘을 쓰고, 올라올 땐 스틱에 맡기세요.'}]},
  {id:'strokes',kind:'read',title:'스트로크 4가지',sub:'높이로 세기를 조절하기',pages:[
   {fig:'stroke:',t:'높이가 곧 세기',b:'스틱을 높이 들수록 큰 소리가 나요. 악센트(>) 레슨은 이 높이 차이로 세게 치는 음과 약하게 치는 음을 만들어요.'},
   {fig:'stroke:full',t:'풀 스트로크',b:'높은 곳에서 시작해 치고, 다시 높은 곳으로 돌아와요. 큰 소리를 계속 이어갈 때 써요.'},
   {fig:'stroke:down',t:'다운 스트로크',b:'높은 곳에서 치고 낮은 곳에서 멈춰요. 악센트 다음에 작은 음이 올 때 써요.'},
   {fig:'stroke:tap',t:'탭 스트로크',b:'낮은 곳에서 시작해 치고, 낮은 곳으로 돌아와요. 작은 음을 칠 때 써요.'},
   {fig:'stroke:up',t:'업 스트로크',b:'낮은 곳에서 치고 높은 곳으로 올라가요. 다음 음이 악센트일 때 미리 스틱을 들어 준비하는 동작이에요.'}]},
  {id:'reading',kind:'read',title:'악보 기호 읽기',sub:'BEAT 화면의 기호와 박 세기',pages:[
   {fig:null,t:'BPM',b:'1분에 몇 박을 치는지 나타내요. 60 BPM이면 1초에 한 박이에요. 숫자가 클수록 빨라요.'},
   {fig:'note:quarter',t:'박과 마디',b:'BEAT의 레슨은 4/4박자예요. 한 마디에 4박이 있고, \'1 2 3 4\'로 세요. 위 그림은 한 박에 한 번씩 치는 4분음표예요.'},
   {fig:'note:single16',t:'박 쪼개기',b:'8분음표는 \'1 & 2 &\', 16분음표는 \'1 e & a\', 셋잇단음표는 \'1 & a\'로 세요. 각 음 아래에 세는 법이 적혀 있어요.'},
   {fig:'note:offbeat',t:'R, L과 쉼표',b:'R은 오른손, L은 왼손이에요. 동그라미 대신 작은 점이 있는 자리는 쉼표라서 치지 않고 박만 세요.'},
   {fig:'note:accent8',t:'악센트',b:'위에 > 표시가 있고 검게 칠해진 음은 세게 쳐요. 나머지 음은 약하게 쳐야 악센트가 살아나요.'}]},
 ]},
 {id:'beat',name:'1단계 · 기본 박',lv:0,title:'기본 박',desc:'4분·8분음표와 엇박: 메트로놈에 맞춰 양손을 번갈아 치는 기본기를 익혀보세요.',items:[
  {id:'quarter',title:'4분음표',sub:'한 박에 한 번, 양손 번갈아',bpm:70,spb:1,bar:'R L R L'},
  {id:'eighth',title:'8분음표',sub:'한 박을 둘로 나누기',bpm:70,spb:2,bar:'R L R L R L R L'},
  {id:'offbeat',title:'엇박 8분',sub:'박 사이의 &에만 치기',bpm:70,spb:2,bar:'. R . L . R . L'},
  {id:'accent8',title:'악센트 8분',sub:'정박은 세게, &는 약하게',bpm:70,spb:2,bar:'^R L ^R L ^R L ^R L'},
 ]},
 {id:'rudiment',name:'2단계 · 루디먼트',lv:0,title:'루디먼트',desc:'싱글·더블 스트로크, 패러디들: 모든 드럼 연주의 바탕이 되는 손 패턴을 배워보세요.',items:[
  {id:'single16',title:'싱글 스트로크',sub:'16분음표 RLRL',bpm:60,spb:4,bar:'R L R L R L R L R L R L R L R L'},
  {id:'double16',title:'더블 스트로크',sub:'16분음표 RRLL',bpm:60,spb:4,bar:'R R L L R R L L R R L L R R L L'},
  {id:'paradiddle',title:'싱글 패러디들',sub:'RLRR LRLL, 첫 음 악센트',bpm:60,spb:4,bar:'^R L R R ^L R L L ^R L R R ^L R L L'},
  {id:'triplet',title:'셋잇단음표',sub:'한 박을 셋으로, 악센트 교대',bpm:60,spb:3,bar:'^R L R ^L R L ^R L R ^L R L'},
  {id:'triple3',title:'트리플 스트로크',sub:'셋잇단 RRR LLL, 한 손으로 세 번',bpm:56,spb:3,bar:'^R R R ^L L L ^R R R ^L L L'},
  {id:'dblparadiddle',title:'더블 패러디들',sub:'RLRLRR LRLRLL, 두 박마다 악센트',bpm:56,spb:3,bar:'^R L R L R R ^L R L R L L'},
  {id:'paradiddlediddle',title:'패러디들-디들',sub:'RLRRLL, 손이 바뀌지 않아요',bpm:56,spb:3,bar:'^R L R R L L ^R L R R L L'},
 ]},
 {id:'accent',name:'3단계 · 악센트 컨트롤',lv:1,title:'악센트 컨트롤',desc:'e·a 악센트, 악센트 이동: 원하는 음만 세게 쳐서 리듬에 표정을 넣어보세요.',items:[
  {id:'acc-e',title:'e 악센트',sub:'16분음표에서 두 번째 음만 세게',bpm:56,spb:4,bar:'R ^L R L R ^L R L R ^L R L R ^L R L'},
  {id:'acc-a',title:'a 악센트',sub:'박 직전의 마지막 16분음을 세게',bpm:56,spb:4,bar:'R L R ^L R L R ^L R L R ^L R L R ^L'},
  {id:'acc-move',title:'악센트 이동',sub:'1 → e → & → a로 한 칸씩 밀기',bpm:52,spb:4,bar:'^R L R L R ^L R L R L ^R L R L R ^L'},
  {id:'acc-3over4',title:'3개 묶음 악센트',sub:'16분음표 위에 3개마다 악센트',bpm:52,spb:4,bar:'^R L R ^L R L ^R L R ^L R L ^R L R ^L'},
 ]},
 {id:'groove',name:'4단계 · 리듬 응용',lv:1,title:'리듬 응용',desc:'갤럽, 셔플, 3-3-2: 쉼표와 싱코페이션이 들어간 실전 리듬을 연습해보세요.',items:[
  {id:'gallop',title:'갤럽',sub:'8분 + 16분 두 개 (따- 따다)',bpm:66,spb:4,bar:'^R . R L ^R . R L ^R . R L ^R . R L'},
  {id:'revgallop',title:'리버스 갤럽',sub:'16분 두 개 + 8분 (따다 따-)',bpm:66,spb:4,bar:'^R L R . ^R L R . ^R L R . ^R L R .'},
  {id:'three-rest',title:'셋 치고 쉬기',sub:'16분음표 세 개 + 쉼표',bpm:60,spb:4,bar:'R L R . L R L . R L R . L R L .'},
  {id:'8to16',title:'8분 → 16분 전환',sub:'앞 두 박은 8분, 뒤 두 박은 16분',bpm:66,spb:4,bar:'^R . L . R . L . ^R L R L R L R L'},
  {id:'shuffle',title:'셔플',sub:'셋잇단의 첫째·셋째 음만 (둥-따)',bpm:80,spb:3,bar:'^R . L ^R . L ^R . L ^R . L'},
  {id:'tresillo',title:'3-3-2 리듬',sub:'8분음표를 3·3·2로 묶은 싱코페이션',bpm:80,spb:2,bar:'^R . . ^L . . ^R .'},
 ]}];
const LEVELS=[
 {code:'Lv.1',name:'입문',desc:'스틱을 처음 잡고 박자를 세며 기본 손 패턴을 익혀요.'},
 {code:'Lv.2',name:'초급',desc:'악센트와 리듬 변형으로 그루브의 기초를 다져요.'}];
const LESSONS=UNITS.flatMap(u=>u.items);
LESSONS.forEach(l=>{if(!l.bar)return;l.tokens=l.bar.split(' ').map(t=>t==='.'?null:{accent:t[0]==='^',hand:t.replace('^','')});l.hasAccent=l.tokens.some(t=>t&&t.accent);});
const BARS=2;
