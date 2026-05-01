@echo off
title Gomoku Manager

:MENU
cls
echo.
echo 1. Start Server
echo 2. Stop Server
echo 3. Restart Server
echo 4. Status
echo 5. Open Browser
echo 6. Exit
echo.
set /p choice=Choose:

if "%choice%"=="1" goto START
if "%choice%"=="2" goto STOP
if "%choice%"=="3" goto RESTART
if "%choice%"=="4" goto STATUS
if "%choice%"=="5" goto BROWSER
if "%choice%"=="6" goto EXIT
goto MENU

:START
cls
echo Starting server...
start "gomoku-server" cmd /c "node "%~dp0server/index.js""
echo.
echo Open http://localhost:8080
pause
goto MENU

:STOP
cls
echo Stopping server on port 8080...
call :STOP_SILENT
echo.
echo Closing terminal window...
taskkill /f /fi "WINDOWTITLE eq gomoku-server" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Administrator:*gomoku-server*" >nul 2>&1
echo Done.
pause
goto MENU

:RESTART
cls
echo Restarting server...
call :STOP_SILENT
echo.
call :START_SILENT
echo.
echo Server restarted.
pause
goto MENU

:STATUS
cls
netstat -ano | findstr ":8080 " >nul 2>&1
if %errorlevel%==0 (
    echo Server is RUNNING
    echo Port:   http://localhost:8080
) else (
    echo Server is NOT running
)
pause
goto MENU

:BROWSER
start http://localhost:8080
goto MENU

:EXIT
exit

:STOP_SILENT
set killed=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080 "') do (
    taskkill /f /pid %%a >nul 2>&1 && set killed=1
)
if %killed%==0 echo   No process found on port 8080
exit /b

:START_SILENT
start "gomoku-server" cmd /c "node "%~dp0server/index.js""
exit /b
