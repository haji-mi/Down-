#!/usr/bin/env bash
# Download Cleaner - macOS / Linux 独立二进制文件编译打包脚本
set -e

echo "=============================================================================="
echo "  Download Cleaner - Unix (macOS / Linux) 一键 Release 编译脚本"
echo "=============================================================================="

if ! command -v python3 &> /dev/null; then
    echo "[错误] 未找到 python3，请先安装 Python 3.10+"
    exit 1
fi

echo "[1/3] 安装或升级 PyInstaller..."
python3 -m pip install --upgrade pyinstaller

echo "[2/3] 运行自动化 Release 打包程序..."
python3 build_release.py

echo "[3/3] 编译打包完成！可在 releases/ 目录中获取分发归档。"
