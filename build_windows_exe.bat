@echo off
chcp 65001 >nul
title Download Cleaner - 一键生成 Windows 独立可执行程序 (.exe)
echo ==============================================================================
echo   Download Cleaner - Windows PyInstaller 一键编译脚本
echo ==============================================================================
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未在系统 PATH 中找到 Python 3.10+，请先安装 Python！
    pause
    exit /b 1
)

echo [1/3] 检查并安装 PyInstaller 依赖...
pip install --upgrade pyinstaller

echo.
echo [2/3] 正在执行打包脚本 build_release.py ...
python build_release.py

echo.
echo [3/3] 打包完成！生成文件位于 releases\ 目录。
pause
