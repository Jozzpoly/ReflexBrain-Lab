@echo off
setlocal
cd /d "%~dp0"
echo ReflexBrain R8 - lokalny test materialnego swiata.
echo To nadal prototyp. Nie jest to potwierdzony zywy organizm.
echo Zamknij to okno, aby zakonczyc sesje.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0r8-freeplay-local.ps1"
if errorlevel 1 (
  echo.
  echo Nie mozna uruchomic podgladu. Sprawdz czy paczka jest w calosci wypakowana.
  pause
)
