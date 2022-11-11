call env.bat
echo Updating Anistick...
if %ENV%==dev ( git pull || git stash && git pull ) else ( if exist .git ( git pull ) else ( echo Update Failed Because Git was not found. && pause && cls && goto install ) )
echo Update Complete
pause & exit
