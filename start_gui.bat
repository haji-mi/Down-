@echo off
chcp 65001 >nul
cd /d %~dp0
title Download Cleaner GUI
python cleaner.py --gui
if %errorlevel% neq 0 (
    echo.
    echo 运行出现异常，请确认已安装 Python 3.10+
    pause
)
