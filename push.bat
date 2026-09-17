@echo off
set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%LOCALAPPDATA%\Programs\Git\mingw64\bin;%PATH%"
echo ======================================================
echo 🍱 Pushing TiffinFlow to https://github.com/Vaibhav1059/Auriga
echo ======================================================
git push -u origin main --force
echo ======================================================
echo Done!
pause
