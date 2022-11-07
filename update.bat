if not exist .git\ (
git init
git remote add origin https://github.com/Anistick-Studio/Anistick.git
git stash && git pull
) else (
git stash && git pull
)
