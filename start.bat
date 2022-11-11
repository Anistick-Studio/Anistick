:: Important stuff
@echo off && cls
set VER=2.3
set BVER=1
set NAME=Anistick
title %NAME% v%VER% Build %BVER%
:: update
call env.bat
echo Updating Anistick...
if %ENV%==dev ( git pull || git stash && git pull ) else ( if exist .git ( git pull ) else ( echo Update Failed Because Git was not found. && pause && cls && goto install ) )
echo Update Complete
pause 
cls
goto install

::::::::::::::::::::
:: Initialization ::
::::::::::::::::::::

:: Terminate existing node.js apps
taskkill /f /im node.exe
cls

:::::::::::::::::::::::::::::::
::      Start Anistick	     ::
:::::::::::::::::::::::::::::::

:: Check for installation
:install
if not exist node_modules ( npm install && npm start ) else ( npm start )
pause
