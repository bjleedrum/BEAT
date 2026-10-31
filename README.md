# BEAT

스픽(Speak)처럼 **듣고 → 따라 치고 → 피드백 받는** 드럼 연습 웹앱입니다.
휴대폰 마이크로 타격을 감지하거나 화면을 탭해서 연습하고, 박자 정확도로 채점합니다.

## 폴더 구조

```
index.html        화면 뼈대, CSS·JS 불러오기
css/style.css     전체 디자인 (라이트/다크 테마 포함)
js/
  lessons.js      레슨·코스 데이터 (UNITS, LEVELS) ← 레슨 추가는 여기
  state.js        앱 상태, 설정, 저장(localStorage)
  audio.js        드럼/클릭 소리, 마이크 타격 감지
  player.js       패턴 재생, 진행 표시
  scoring.js      채점과 피드백 문구
  ui.js           공통 화면 요소, 하단 탭, 홈 화면
  reading.js      읽기 레슨(드럼 기초 상식)과 SVG 그림
  screens.js      코스·레슨·결과·설정 화면, render
  main.js         버튼 동작, 입력 이벤트, 앱 시작
```

JS 파일은 모두 일반 `<script>`로 순서대로 불러오며 서로의 변수와 함수를 공유합니다.
`index.html`의 불러오는 순서를 바꾸지 마세요 (`main.js`가 마지막이어야 합니다).

## 실행

빌드 과정이 없습니다. `index.html`을 브라우저로 열면 됩니다.
마이크 모드는 HTTPS 주소(예: GitHub Pages)에서만 동작합니다.
