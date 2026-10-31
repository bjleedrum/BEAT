@echo off
chcp 65001 > nul
title BEAT 개발 서버
cd /d "%~dp0"
echo BEAT 개발 서버를 켜는 중이에요. 이 창을 닫으면 서버가 꺼져요.
npx expo start
pause
