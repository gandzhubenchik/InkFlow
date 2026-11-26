@echo off
chcp 65001 > nul

:: 1. Мгновенный запуск уже скомпилированного бэкенда (без повторной сборки)
start "InkFlow Backend" /min cmd /c "cd /d %~dp0InkFlow.Backend && dotnet run -c Release --no-build"

:: 2. Параллельный запуск фронтенда с флагом --open (браузер откроется сам в момент готовности)
start "InkFlow Frontend" /min cmd /c "cd /d %~dp0inkflow-frontend && npm run dev -- --open"
