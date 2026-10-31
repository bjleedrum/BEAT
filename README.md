# BEAT

스픽(Speak)처럼 **듣고 → 따라 치고 → 피드백 받는** 드럼 연습 앱입니다.
React Native + Expo로 만들고, 안드로이드를 먼저 출시한 뒤 iOS로 확장합니다.

## 폴더 구조

```
src/
  app/            화면 (expo-router 파일 기반 라우팅)
    (tabs)/       하단 탭: 홈(index), 코스(course), 리그(league)
    lesson/[id]   레슨 화면
    settings      설정 (입력 방식, 감도, 지연 보정, 테마)
  components/     화면 조각: 악보, 연주 화면, 결과, 마이크 미터, 티어 배지 등
  constants/      테마 색상
  hooks/          테마 관련 훅
  lib/
    lessons.ts    레슨·코스 데이터 ← 레슨 추가는 여기
    scoring.ts    채점 로직
    synth.ts      드럼·메트로놈 소리 생성
    mic.tsx       마이크 입력
    onset.ts      타격 감지
    store.tsx     진행 기록 저장
    league*.ts    리그(점수 경쟁)
    supabase.ts   서버 연결 (config.ts에 주소와 공개용 키)
assets/           아이콘, 이미지, 스트로크 영상
supabase/         서버 데이터베이스 구조 (schema.sql)
prototype/        초기 웹 프로토타입 (HTML/JS, 기능 참고용)
```

## 실행 (윈도우 PowerShell)

```powershell
npm install
npx expo start
```

또는 `start-beat.bat`을 더블클릭해도 됩니다.

터미널의 QR 코드를 휴대폰 **Expo Go** 앱으로 스캔하면 바로 실행됩니다.
PC와 휴대폰이 같은 와이파이에 있어야 합니다.
