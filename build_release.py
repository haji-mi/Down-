#!/usr/bin/env python3
"""
Download Cleaner - 自动化 Release 打包与分发脚本
支持一键将 cleaner.py 打包为独立的 Windows (.exe) / macOS / Linux 二进制单文件程序，
并自动附带 rules.json、启动脚本与 README 文档打包为发布压缩包。
"""

import os
import sys
import shutil
import zipfile
import hashlib
import platform
import subprocess
from pathlib import Path

VERSION = "2.4.0"
APP_NAME = "DownloadCleaner"
ROOT_DIR = Path(__file__).resolve().parent
DIST_DIR = ROOT_DIR / "dist"
RELEASE_DIR = ROOT_DIR / "releases"
BUILD_DIR = ROOT_DIR / "build"


def print_banner():
    print("=" * 60)
    print(f"  {APP_NAME} Release Builder - v{VERSION}")
    print(f"  Platform: {platform.system()} {platform.machine()} | Python {platform.python_version()}")
    print("=" * 60)


def check_and_install_pyinstaller():
    """检查是否安装了 PyInstaller，若未安装则自动提示或安装"""
    try:
        import PyInstaller
        print("[+] PyInstaller 已就绪")
        return True
    except ImportError:
        print("[!] 未检测到 PyInstaller，正在尝试通过 pip 自动安装...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pyinstaller"])
            print("[+] PyInstaller 安装成功！")
            return True
        except subprocess.CalledProcessError as e:
            print(f"[-] 自动安装 PyInstaller 失败: {e}")
            print("    请手动运行: pip install pyinstaller")
            return False


def build_binary(noconsole=False):
    """调用 PyInstaller 构建单文件可执行程序"""
    print(f"\n[*] 开始使用 PyInstaller 编译 {APP_NAME}...")

    # 清理旧构建目录
    if BUILD_DIR.exists():
        shutil.rmtree(BUILD_DIR, ignore_errors=True)
    if (DIST_DIR / APP_NAME).exists() or (DIST_DIR / f"{APP_NAME}.exe").exists():
        shutil.rmtree(DIST_DIR, ignore_errors=True)

    pyinstaller_args = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--onedir",             # 目录模式启动更快，且便于携带外置 rules.json
        "--clean",
        "--name", APP_NAME,
        str(ROOT_DIR / "cleaner.py"),
    ]

    # 添加 rules.json 静态资源 (格式: src;dest (Windows) 或 src:dest (Unix))
    sep = ";" if platform.system() == "Windows" else ":"
    if (ROOT_DIR / "rules.json").exists():
        pyinstaller_args.extend(["--add-data", f"{ROOT_DIR / 'rules.json'}{sep}."])

    # 如果指定了 --noconsole，则 Windows 下不显示黑窗口
    if noconsole and platform.system() == "Windows":
        pyinstaller_args.append("--noconsole")

    print(f"[*] 执行命令: {' '.join(pyinstaller_args)}")
    res = subprocess.run(pyinstaller_args)
    if res.returncode != 0:
        print("[-] PyInstaller 构建失败！")
        return False

    print("[+] 二进制可执行文件编译完成！")
    return True


def create_release_archive():
    """将输出的二进制文件及配置文件封装为可分发的 Release Zip 包"""
    RELEASE_DIR.mkdir(parents=True, exist_ok=True)
    sys_name = platform.system().lower()
    arch_name = platform.machine().lower()
    
    release_name = f"{APP_NAME}-v{VERSION}-{sys_name}-{arch_name}"
    zip_path = RELEASE_DIR / f"{release_name}.zip"

    print(f"\n[*] 正在打包 Release 压缩包: {zip_path.name} ...")

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        # 打包编译产物
        compiled_dir = DIST_DIR / APP_NAME
        if compiled_dir.exists():
            for file in compiled_dir.rglob("*"):
                arcname = Path(release_name) / file.relative_to(DIST_DIR)
                zf.write(file, arcname)
        
        # 写入外置可配置 rules.json
        if (ROOT_DIR / "rules.json").exists():
            zf.write(ROOT_DIR / "rules.json", Path(release_name) / "rules.json")

        # 写入 README.md
        if (ROOT_DIR / "README.md").exists():
            zf.write(ROOT_DIR / "README.md", Path(release_name) / "README.md")

        # 写入便捷启动脚本
        if platform.system() == "Windows":
            bat_content = f"@echo off\ncd /d %~dp0\n{APP_NAME}\\{APP_NAME}.exe --gui\npause"
            zf.writestr(f"{release_name}/启动图形界面.bat", bat_content)

            bat_daemon = f"@echo off\ncd /d %~dp0\n{APP_NAME}\\{APP_NAME}.exe\npause"
            zf.writestr(f"{release_name}/启动常驻监控.bat", bat_daemon)
        else:
            sh_content = f"#!/usr/bin/env bash\nDIR=\"$(cd \"$(dirname \"$0\")\" && pwd)\"\n\"$DIR/{APP_NAME}/{APP_NAME}\" --gui\n"
            zf.writestr(f"{release_name}/start_gui.sh", sh_content)

    # 计算 SHA256 校验和
    sha256 = hashlib.sha256(zip_path.read_bytes()).hexdigest()
    checksum_file = RELEASE_DIR / "SHA256SUMS.txt"
    with open(checksum_file, "a", encoding="utf-8") as f:
        f.write(f"{sha256}  {zip_path.name}\n")

    print(f"[+] Release 打包完成: {zip_path}")
    print(f"[+] 压缩包大小: {zip_path.stat().st_size / (1024 * 1024):.2f} MB")
    print(f"[+] SHA256 校验值: {sha256}")
    return zip_path


def main():
    print_banner()
    if not check_and_install_pyinstaller():
        sys.exit(1)

    # 默认编译支持 GUI 的程序
    if not build_binary(noconsole=False):
        sys.exit(1)

    archive = create_release_archive()
    print("\n" + "=" * 60)
    print("  Release 构建全部顺利完成！")
    print(f"  分发目录: {RELEASE_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
