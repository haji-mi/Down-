# Download Cleaner - Release v2.4.0

## 📦 发行版包含文件清单 (Release Contents)

| 文件名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `cleaner.py` | 核心程序 | 零依赖 Python 3.10+ 下载目录自动化整理引擎 |
| `rules.json` | 配置文件 | 预设 8 大常用分类体系与后缀规则映射 |
| `build_release.py` | 打包脚本 | 跨平台 PyInstaller 二进制单文件构建程序 |
| `build_windows_exe.bat`| 批处理 | Windows 下双击一键编译独立 `.exe` |
| `build_unix.sh` | Shell 脚本 | macOS / Linux 下一键编译独立可执行程序 |
| `start_gui.bat` | 启动脚本 | Windows 下双击启动 Tkinter 可视化面板 |
| `start_gui.sh` | 启动脚本 | macOS / Linux 下双击启动可视化面板 |
| `README.md` | 使用指南 | 包含 CLI / GUI / 打包 / 定时任务全量文档 |

---

## 🚀 快速启动与构建

### 1. 免打包直接运行
- **Windows**: 双击 `start_gui.bat`
- **macOS / Linux**: 终端运行 `bash start_gui.sh` 或 `python3 cleaner.py --gui`

### 2. 打包为无 Python 依赖的独立可执行文件
- **Windows**: 双击 `build_windows_exe.bat`，生成独立程序至 `releases/DownloadCleaner-v2.4.0-windows-amd64.zip`
- **macOS / Linux**: 终端运行 `bash build_unix.sh`

### 3. 手动 PyInstaller 命令
```bash
pip install pyinstaller
pyinstaller --onedir --clean --name DownloadCleaner cleaner.py --add-data "rules.json;."
```
