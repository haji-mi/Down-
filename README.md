# Download Cleaner - 本地下载文件夹自动整理工具

基于 **Python 3.10+** 开发的本地文件夹自动整理与生命周期管理工具。仅依赖 Python 标准库（零第三方依赖），即开即用。

---

## ✨ 核心特性

- 🕒 **实时/定时监控**：默认监控 `~/Downloads`，每 30 秒自动扫描一次新增文件。
- 📂 **智能后缀分类**：按文件扩展名自动将文件移至对应子目录（如 `Images/`, `Docs/`, `Archives/`, `Programs/`, `Code/` 等）。
- ⚙️ **外置规则配置**：所有分类与规则均保存在 `rules.json` 中，用户可随时自由增删改规则。
- 📦 **文件防冲突**：目标目录存在同名文件时，自动重命名追加 `_1`, `_2`，不覆盖已有文件。
- 🔒 **占用与并发安全**：自动跳过未下载完成的临时文件（如 `.crdownload`, `.tmp`）及其他程序正占用的文件，不崩溃。
- ⏳ **生命周期策略**：支持配置“文件保留天数”（默认 30 天），过期文件自动归档至 `./Trash/`，防止误删。
- 🧹 **空目录自清理**：自动清理下载目录下无用的空文件夹，保持目录清爽。
- 📝 **完整操作日志**：所有移动与归档操作详细记录在 `cleaner.log`，包含时间、动作、源路径、目标路径。
- 🖥️ **双重交互模式**：支持原生 CLI 命令行常驻/单次执行，以及内置 Tkinter GUI 可视化监控面板。

---

## 🚀 快速开始

### 环境要求
- **Python 3.10 或更高版本**
- **无需安装任何第三方库**（纯标准库 `os`, `shutil`, `json`, `time`, `logging`, `tkinter`, `threading`, `argparse`）

### 运行方式

#### 1. GUI 模式（推荐日常使用）
```bash
python cleaner.py --gui
```
启动可视化窗口，实时查看监控状态、最近移动记录表格，支持一键“立即整理”、“暂停监控”、“更改目录”与“打开规则/日志”。

#### 2. CLI 单次整理模式（整理一次后退出）
```bash
# 整理默认 ~/Downloads 目录
python cleaner.py --once

# 整理指定目录并设置文件超过 15 天移至回收站
python cleaner.py --folder "D:/Downloads" --once --retention-days 15
```

#### 3. CLI 常驻监控模式（后台持续守护）
```bash
# 每 30 秒自动整理一次默认下载目录
python cleaner.py

# 指定目录并自定义每 10 秒扫描一次
python cleaner.py --folder "D:/Downloads" --interval 10
```

---

## ⚙️ 配置文件说明 (`rules.json`)

首次运行工具时，若目标目录下不存在 `rules.json`，程序会自动生成默认配置。你可随时编辑该文件进行自定义：

```json
{
    "retention_days": 30,
    "scan_interval_seconds": 30,
    "delete_empty_folders": true,
    "ignored_extensions": [
        ".crdownload",
        ".tmp",
        ".part",
        ".download",
        ".aria2",
        ".ds_store"
    ],
    "ignored_names": [
        "desktop.ini",
        ".DS_Store",
        "Thumbs.db",
        "cleaner.log",
        "rules.json"
    ],
    "categories": {
        "Images": [
            ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg", ".ico", ".tiff", ".raw", ".psd", ".ai"
        ],
        "Docs": [
            ".doc", ".docx", ".pdf", ".txt", ".rtf", ".odt", ".xls", ".xlsx", ".csv", ".ppt", ".pptx", ".md", ".epub", ".mobi"
        ],
        "Archives": [
            ".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz", ".iso", ".dmg", ".pkg", ".tgz"
        ],
        "Programs": [
            ".exe", ".msi", ".bat", ".cmd", ".sh", ".appimage", ".deb", ".rpm", ".apk"
        ],
        "Audio": [
            ".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a", ".wma"
        ],
        "Video": [
            ".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".webm", ".m4v"
        ],
        "Code": [
            ".py", ".java", ".c", ".cpp", ".h", ".hpp", ".cs", ".js", ".ts", ".jsx", ".tsx",
            ".html", ".css", ".json", ".xml", ".yaml", ".yml", ".sql", ".go", ".rs", ".php", ".rb"
        ],
        "Fonts": [
            ".ttf", ".otf", ".woff", ".woff2", ".eot"
        ]
    }
}
```

### 字段含义
| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `retention_days` | 整数 | 文件保留天数。超过指定天数的文件移至 `Trash/`（设为 0 则不启用过期清理） |
| `scan_interval_seconds` | 整数 | 自动扫描周期（秒） |
| `delete_empty_folders` | 布尔 | 是否自动删除整理后产生的空文件夹 |
| `ignored_extensions` | 列表 | 忽略的文件后缀列表（如浏览器正在下载的文件） |
| `ignored_names` | 列表 | 忽略的特定文件名（如系统配置文件、日志文件） |
| `categories` | 字典 | 分类映射规则：`"分类文件夹名": [".后缀1", ".后缀2", ...]` |

---

## 📋 命令行参数汇总

```text
用法: cleaner.py [-h] [--folder FOLDER] [--once] [--gui] [--rules RULES]
                  [--retention-days RETENTION_DAYS] [--interval INTERVAL]

选项:
  -h, --help            显示帮助信息并退出
  --folder FOLDER, -f FOLDER
                        指定要监控与整理的文件夹路径 (默认: ~/Downloads)
  --once                单次执行模式：仅执行一次整理后退出，不开启常驻监控
  --gui                 GUI 模式：启动 Tkinter 可视化管理窗口
  --rules RULES, -r RULES
                        指定自定义 rules.json 规则文件路径 (默认: 目标文件夹下的 rules.json)
  --retention-days RETENTION_DAYS, -d RETENTION_DAYS
                        文件保留天数，超过该天数的文件移至 Trash/
  --interval INTERVAL, -i INTERVAL
                        持续监控模式下的扫描间隔秒数 (默认: 30 秒)
```

---

## 📦 打包发布与独立可执行文件编译 (Release & Packaging)

项目已提供完整的跨平台打包方案（基于 `PyInstaller`），可直接将 Python 脚本打包为无 Python 运行环境依赖的独立单文件应用（Windows `.exe` / macOS `.app` / Linux 二进制）。

### 1. 一键全自动打包 (推荐)

#### Windows
双击运行根目录下的 `build_windows_exe.bat`，即可全自动安装 PyInstaller、编译二进制文件并生成 `releases/DownloadCleaner-v2.4.0-windows-amd64.zip`。

#### macOS / Linux
在终端运行：
```bash
bash build_unix.sh
```

### 2. 使用 Python 脚本编译发布
```bash
# 自动检测 PyInstaller 并打包生成分发 ZIP 与 SHA256 校验和文件
python build_release.py
```

### 3. 手动 PyInstaller 命令
```bash
pip install pyinstaller

# 编译为便于扩展 rules.json 的目录模式
pyinstaller --onedir --clean --name DownloadCleaner cleaner.py --add-data "rules.json;."

# 编译为单文件可执行程序 (Windows 单文件 .exe)
pyinstaller --onefile --windowed --name DownloadCleaner cleaner.py --add-data "rules.json;."
```

### 4. Release 发行包内容
导出的 Release 压缩包包含：
- `DownloadCleaner` (编译好的独立二进制执行程序)
- `rules.json` (外置默认规则配置)
- `启动图形界面.bat` / `start_gui.sh` (双击启动快捷方式)
- `README.md` (完整文档)
- `SHA256SUMS.txt` (数字签名防篡改校验码)

---

## 📜 日志记录 (`cleaner.log`)

所有操作均以结构化格式写入日志：

```log
[2026-08-24 16:00:00] [INFO] [自动分类] [Docs] 需求文档.docx -> /Users/user/Downloads/Docs/需求文档.docx
[2026-08-24 16:00:01] [INFO] [过期归档] 超出30天: 历史截图.png -> /Users/user/Downloads/Trash/历史截图.png
[2026-08-24 16:00:02] [WARNING] [跳过占用] 文件正在被其他进程使用: large_dataset.zip.crdownload
[2026-08-24 16:00:03] [INFO] [删除空目录] temp_extract
```
