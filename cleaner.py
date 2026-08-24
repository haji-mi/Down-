"""
Download Cleaner - 本地下载文件夹自动整理工具
Python 3.10+ 标准库实现，零第三方依赖。
"""

from __future__ import annotations

import argparse
from datetime import datetime, timedelta
import json
import logging
import os
from pathlib import Path
import shutil
import sys
import threading
import time
import tkinter as tk
from tkinter import filedialog, messagebox, ttk
from typing import Any, Callable, Dict, List, Optional, Tuple


# ==============================================================================
# 常量与默认配置
# ==============================================================================

DEFAULT_RULES_FILENAME = "rules.json"
DEFAULT_LOG_FILENAME = "cleaner.log"
DEFAULT_SCAN_INTERVAL = 30  # 秒
DEFAULT_RETENTION_DAYS = 30  # 天，0 表示不启用过期移至回收站
TRASH_DIR_NAME = "Trash"

# 默认分类规则
DEFAULT_CONFIG: Dict[str, Any] = {
    "retention_days": 30,
    "scan_interval_seconds": 30,
    "delete_empty_folders": True,
    "ignored_extensions": [
        ".crdownload",
        ".tmp",
        ".part",
        ".download",
        ".aria2",
        ".ds_store",
    ],
    "ignored_names": [
        "desktop.ini",
        ".DS_Store",
        "Thumbs.db",
        DEFAULT_LOG_FILENAME,
        DEFAULT_RULES_FILENAME,
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


# ==============================================================================
# 日志配置模块
# ==============================================================================

def setup_logger(log_file_path: Path) -> logging.Logger:
    """
    配置并返回日志记录器。

    :param log_file_path: 日志文件存储路径
    :return: 配置好的 Logger 对象
    """
    logger = logging.getLogger("DownloadCleaner")
    logger.setLevel(logging.INFO)

    # 避免重复添加 Handler
    if not logger.handlers:
        file_handler = logging.FileHandler(log_file_path, encoding="utf-8")
        file_formatter = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)

        console_handler = logging.StreamHandler(sys.stdout)
        console_formatter = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] %(message)s",
            datefmt="%H:%M:%S"
        )
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)

    return logger


# ==============================================================================
# 核心整理器引擎
# ==============================================================================

class CleanerRecord:
    """整理操作记录数据类。"""

    def __init__(
        self,
        timestamp: str,
        action: str,
        filename: str,
        source: str,
        destination: str,
        status: str = "SUCCESS",
    ) -> None:
        self.timestamp = timestamp
        self.action = action
        self.filename = filename
        self.source = source
        self.destination = destination
        self.status = status


class DownloadCleaner:
    """
    下载文件夹自动整理引擎。
    负责监控、规则匹配、重命名排重、过期清理与日志记录。
    """

    def __init__(
        self,
        folder: Path | str,
        rules_path: Optional[Path | str] = None,
        retention_days: Optional[int] = None,
        logger: Optional[logging.Logger] = None,
    ) -> None:
        """
        初始化整理器。

        :param folder: 目标监控文件夹路径
        :param rules_path: 规则 JSON 文件路径
        :param retention_days: 文件保留天数（覆盖 rules.json 中的配置）
        :param logger: 日志记录器
        """
        self.folder = Path(folder).expanduser().resolve()
        self.rules_path = (
            Path(rules_path).resolve()
            if rules_path
            else self.folder / DEFAULT_RULES_FILENAME
        )
        self.log_path = self.folder / DEFAULT_LOG_FILENAME
        self.logger = logger or setup_logger(self.log_path)
        
        self.config: Dict[str, Any] = self._load_or_create_rules()
        if retention_days is not None:
            self.config["retention_days"] = retention_days

        self.records: List[CleanerRecord] = []
        self._stop_event = threading.Event()
        self._is_scanning = False
        self.on_record_added: Optional[Callable[[CleanerRecord], None]] = None

    def _load_or_create_rules(self) -> Dict[str, Any]:
        """
        读取外置 rules.json。若不存在则自动生成默认配置并保存。

        :return: 配置字典
        """
        if not self.rules_path.exists():
            try:
                self.rules_path.parent.mkdir(parents=True, exist_ok=True)
                with open(self.rules_path, "w", encoding="utf-8") as f:
                    json.dump(DEFAULT_CONFIG, f, ensure_ascii=False, indent=4)
                self.logger.info(f"已创建默认分类规则文件: {self.rules_path}")
                return DEFAULT_CONFIG.copy()
            except Exception as e:
                self.logger.error(f"创建规则文件失败: {e}，将使用内存默认规则")
                return DEFAULT_CONFIG.copy()

        try:
            with open(self.rules_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                # 合并默认缺失字段
                merged = DEFAULT_CONFIG.copy()
                merged.update(data)
                return merged
        except Exception as e:
            self.logger.error(f"读取规则文件失败 ({e})，使用默认配置")
            return DEFAULT_CONFIG.copy()

    def reload_rules(self) -> None:
        """重新加载 rules.json 配置。"""
        self.config = self._load_or_create_rules()
        self.logger.info("已重新加载规则配置文件")

    def _get_target_category(self, file_path: Path) -> Optional[str]:
        """
        根据文件后缀匹配分类目录。

        :param file_path: 文件路径
        :return: 匹配到的分类文件夹名，未匹配返回 None
        """
        ext = file_path.suffix.lower()
        categories: Dict[str, List[str]] = self.config.get("categories", {})
        for category_name, extensions in categories.items():
            ext_list = [e.lower() for e in extensions]
            if ext in ext_list:
                return category_name
        return None

    def _is_file_locked(self, file_path: Path) -> bool:
        """
        检查文件是否被其他进程独占或正在写入中。

        :param file_path: 文件路径
        :return: True 表示被占用，False 表示可安全操作
        """
        if not file_path.exists():
            return False
        try:
            # 尝试以追加模式独占打开，若被写锁定则会抛出 PermissionError 或 OSError
            with open(file_path, "a+b"):
                pass
            return False
        except (PermissionError, OSError):
            return True

    def _resolve_conflict_name(self, dest_dir: Path, filename: str) -> Path:
        """
        解决目标目录同名文件冲突：自动追加 _1, _2 等编号。

        :param dest_dir: 目标目录
        :param filename: 原文件名
        :return: 无冲突的目标完整路径
        """
        target_path = dest_dir / filename
        if not target_path.exists():
            return target_path

        stem = Path(filename).stem
        suffix = Path(filename).suffix
        counter = 1

        while True:
            new_name = f"{stem}_{counter}{suffix}"
            candidate_path = dest_dir / new_name
            if not candidate_path.exists():
                return candidate_path
            counter += 1

    def _record_action(
        self,
        action: str,
        filename: str,
        source: str,
        destination: str,
        status: str = "SUCCESS",
    ) -> None:
        """
        记录操作历史并触发 UI 回调。
        """
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        record = CleanerRecord(
            timestamp=now_str,
            action=action,
            filename=filename,
            source=source,
            destination=destination,
            status=status,
        )
        self.records.append(record)
        if self.on_record_added:
            self.on_record_added(record)

    def clean_once(self) -> Tuple[int, int, int]:
        """
        执行单次扫描与整理。

        :return: 元组 (已分类移动数, 已移入回收站数, 跳过/错误数)
        """
        if self._is_scanning:
            self.logger.warning("已有扫描任务在执行中，本次跳过")
            return 0, 0, 0

        self._is_scanning = True
        moved_count = 0
        trashed_count = 0
        skipped_count = 0

        try:
            if not self.folder.exists():
                self.logger.error(f"监控文件夹不存在: {self.folder}")
                return 0, 0, 0

            retention_days = int(self.config.get("retention_days", 0))
            ignored_exts = [e.lower() for e in self.config.get("ignored_extensions", [])]
            ignored_names = [n.lower() for n in self.config.get("ignored_names", [])]
            categories = self.config.get("categories", {})
            reserved_dir_names = set(categories.keys())
            reserved_dir_names.add(TRASH_DIR_NAME)

            trash_dir = self.folder / TRASH_DIR_NAME

            # 遍历监控根目录下一级的所有条目
            with os.scandir(self.folder) as entries:
                items = list(entries)

            now = datetime.now()

            for entry in items:
                # 忽略自身配置、日志及系统特定文件
                if entry.name.lower() in ignored_names:
                    continue

                # 忽略分类保留目录本身
                if entry.is_dir() and entry.name in reserved_dir_names:
                    continue

                entry_path = Path(entry.path)

                # 处理普通文件
                if entry.is_file():
                    ext = entry_path.suffix.lower()

                    # 忽略未下载完成的临时文件
                    if ext in ignored_exts:
                        continue

                    # 检查文件占用
                    if self._is_file_locked(entry_path):
                        self.logger.warning(
                            f"[跳过占用] 文件正在被其他进程使用: {entry_path.name}"
                        )
                        self._record_action(
                            action="LOCKED_SKIP",
                            filename=entry_path.name,
                            source=str(entry_path),
                            destination="-",
                            status="LOCKED",
                        )
                        skipped_count += 1
                        continue

                    # 策略 1: 检查是否超过保留天数移入 Trash
                    is_expired = False
                    if retention_days > 0:
                        try:
                            mtime = datetime.fromtimestamp(entry.stat().st_mtime)
                            if now - mtime > timedelta(days=retention_days):
                                is_expired = True
                        except OSError as e:
                            self.logger.warning(f"读取文件元数据失败 {entry_path.name}: {e}")

                    if is_expired:
                        trash_dir.mkdir(parents=True, exist_ok=True)
                        dest_file = self._resolve_conflict_name(trash_dir, entry_path.name)
                        try:
                            shutil.move(str(entry_path), str(dest_file))
                            self.logger.info(
                                f"[过期归档] 超出{retention_days}天: {entry_path.name} -> {dest_file}"
                            )
                            self._record_action(
                                action="TRASH_EXPIRED",
                                filename=entry_path.name,
                                source=str(entry_path),
                                destination=str(dest_file),
                                status="SUCCESS",
                            )
                            trashed_count += 1
                            continue
                        except Exception as e:
                            self.logger.error(f"[移动失败] 移至回收站失败 {entry_path.name}: {e}")
                            self._record_action(
                                action="TRASH_FAIL",
                                filename=entry_path.name,
                                source=str(entry_path),
                                destination=str(dest_file),
                                status="ERROR",
                            )
                            skipped_count += 1
                            continue

                    # 策略 2: 按扩展名归类
                    category = self._get_target_category(entry_path)
                    if category:
                        target_dir = self.folder / category
                        target_dir.mkdir(parents=True, exist_ok=True)
                        dest_file = self._resolve_conflict_name(target_dir, entry_path.name)

                        # 如果文件已在目标路径且无变动，跳过
                        if entry_path == dest_file:
                            continue

                        try:
                            shutil.move(str(entry_path), str(dest_file))
                            self.logger.info(
                                f"[自动分类] [{category}] {entry_path.name} -> {dest_file}"
                            )
                            self._record_action(
                                action=f"MOVE:{category}",
                                filename=entry_path.name,
                                source=str(entry_path),
                                destination=str(dest_file),
                                status="SUCCESS",
                            )
                            moved_count += 1
                        except Exception as e:
                            self.logger.error(f"[分类失败] 移动文件失败 {entry_path.name}: {e}")
                            self._record_action(
                                action=f"FAIL:{category}",
                                filename=entry_path.name,
                                source=str(entry_path),
                                destination=str(dest_file),
                                status="ERROR",
                            )
                            skipped_count += 1

            # 策略 3: 清理空文件夹
            if self.config.get("delete_empty_folders", True):
                self._remove_empty_folders(reserved_dir_names)

        except Exception as e:
            self.logger.error(f"整理过程发生未捕获异常: {e}", exc_info=True)
        finally:
            self._is_scanning = False

        return moved_count, trashed_count, skipped_count

    def _remove_empty_folders(self, reserved_names: set[str]) -> None:
        """
        遍历并删除非保留的空文件夹。

        :param reserved_names: 不可删除的受保护文件夹名集合
        """
        try:
            for item in list(self.folder.iterdir()):
                if item.is_dir() and item.name not in reserved_names:
                    # 检查目录是否为空
                    try:
                        if not any(item.iterdir()):
                            item.rmdir()
                            self.logger.info(f"[删除空目录] {item.name}")
                            self._record_action(
                                action="REMOVE_EMPTY_DIR",
                                filename=item.name,
                                source=str(item),
                                destination="DELETED",
                                status="SUCCESS",
                            )
                    except OSError as e:
                        self.logger.warning(f"删除空目录失败 {item.name}: {e}")
        except Exception as e:
            self.logger.warning(f"扫描空目录时异常: {e}")

    def run_monitor(self, interval: Optional[int] = None) -> None:
        """
        持续阻塞监控循环（用于 CLI 常驻模式）。

        :param interval: 扫描间隔秒数，未指定时使用 rules.json 中配置
        """
        scan_sec = interval or int(self.config.get("scan_interval_seconds", DEFAULT_SCAN_INTERVAL))
        self.logger.info(f"启动自动整理监控，目标文件夹: {self.folder}，扫描间隔: {scan_sec} 秒")
        self._stop_event.clear()

        try:
            while not self._stop_event.is_set():
                self.clean_once()
                self._stop_event.wait(scan_sec)
        except KeyboardInterrupt:
            self.logger.info("收到退出信号，监控已停止")
        finally:
            self.logger.info("监控线程已退出")

    def stop_monitor(self) -> None:
        """停止监控。"""
        self._stop_event.set()


# ==============================================================================
# Tkinter GUI 界面模块
# ==============================================================================

class CleanerGUI:
    """
    Tkinter 图形化监控管理界面。
    """

    def __init__(self, cleaner: DownloadCleaner) -> None:
        """
        初始化 GUI 窗口。

        :param cleaner: 关联的 DownloadCleaner 实例
        """
        self.cleaner = cleaner
        self.is_monitoring = False
        self.monitor_thread: Optional[threading.Thread] = None

        self.root = tk.Tk()
        self.root.title("Download Cleaner - 本地下载文件夹自动整理工具")
        self.root.geometry("860x560")
        self.root.minsize(720, 460)

        # 注册回调，用于将底层移动记录推送到表格
        self.cleaner.on_record_added = self._on_record_received

        self._build_ui()
        self._start_background_monitor()

    def _build_ui(self) -> None:
        """构建 Tkinter 控件布局。"""
        # 顶部配置与状态栏
        top_frame = ttk.LabelFrame(self.root, text=" 监控信息与控制 ", padding=(12, 10))
        top_frame.pack(fill=tk.X, padx=12, pady=(10, 6))

        # 文件夹路径展示
        path_row = ttk.Frame(top_frame)
        path_row.pack(fill=tk.X, pady=2)
        ttk.Label(path_row, text="监控目录:", font=("Segoe UI", 9, "bold")).pack(side=tk.LEFT)
        self.lbl_path = ttk.Label(path_row, text=str(self.cleaner.folder), foreground="#1e40af")
        self.lbl_path.pack(side=tk.LEFT, padx=8)

        btn_change_dir = ttk.Button(path_row, text="更改目录", command=self._change_folder)
        btn_change_dir.pack(side=tk.RIGHT)

        # 状态行
        status_row = ttk.Frame(top_frame)
        status_row.pack(fill=tk.X, pady=(6, 2))

        ttk.Label(status_row, text="运行状态:").pack(side=tk.LEFT)
        self.lbl_status = ttk.Label(
            status_row,
            text="● 监控运行中 (每 30 秒自动扫描)",
            foreground="#16a34a",
            font=("Segoe UI", 9, "bold")
        )
        self.lbl_status.pack(side=tk.LEFT, padx=8)

        # 按钮控制栏
        btn_bar = ttk.Frame(top_frame)
        btn_bar.pack(fill=tk.X, pady=(8, 0))

        self.btn_clean_now = ttk.Button(btn_bar, text="⚡ 立即整理", command=self._trigger_clean_now)
        self.btn_clean_now.pack(side=tk.LEFT, padx=(0, 6))

        self.btn_toggle_mon = ttk.Button(btn_bar, text="⏸ 暂停监控", command=self._toggle_monitoring)
        self.btn_toggle_mon.pack(side=tk.LEFT, padx=6)

        self.btn_open_rules = ttk.Button(btn_bar, text="⚙ 查看/编辑规则", command=self._open_rules_file)
        self.btn_open_rules.pack(side=tk.LEFT, padx=6)

        self.btn_open_log = ttk.Button(btn_bar, text="📄 打开日志", command=self._open_log_file)
        self.btn_open_log.pack(side=tk.LEFT, padx=6)

        self.btn_exit = ttk.Button(btn_bar, text="❌ 退出", command=self._exit_app)
        self.btn_exit.pack(side=tk.RIGHT)

        # 中间：移动记录表格
        table_frame = ttk.LabelFrame(self.root, text=" 最近移动记录 (实时更新) ", padding=(8, 8))
        table_frame.pack(fill=tk.BOTH, expand=True, padx=12, pady=6)

        columns = ("time", "action", "filename", "destination", "status")
        self.tree = ttk.Treeview(
            table_frame,
            columns=columns,
            show="headings",
            selectmode="browse"
        )

        self.tree.heading("time", text="时间")
        self.tree.heading("action", text="动作")
        self.tree.heading("filename", text="文件名")
        self.tree.heading("destination", text="目标路径/分类")
        self.tree.heading("status", text="状态")

        self.tree.column("time", width=140, anchor=tk.CENTER)
        self.tree.column("action", width=120, anchor=tk.W)
        self.tree.column("filename", width=220, anchor=tk.W)
        self.tree.column("destination", width=260, anchor=tk.W)
        self.tree.column("status", width=80, anchor=tk.CENTER)

        scrollbar = ttk.Scrollbar(table_frame, orient=tk.VERTICAL, command=self.tree.yview)
        self.tree.configure(yscroll=scrollbar.set)

        self.tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        # 底部统计栏
        bottom_frame = ttk.Frame(self.root, padding=(12, 6))
        bottom_frame.pack(fill=tk.X)
        self.lbl_stats = ttk.Label(
            bottom_frame,
            text="就绪 | 记录数: 0",
            foreground="#64748b"
        )
        self.lbl_stats.pack(side=tk.LEFT)

    def _on_record_received(self, record: CleanerRecord) -> None:
        """线程安全地将记录插入 UI 表格。"""
        def _insert() -> None:
            self.tree.insert(
                "",
                0,
                values=(
                    record.timestamp,
                    record.action,
                    record.filename,
                    record.destination,
                    record.status,
                ),
            )
            count = len(self.tree.get_children())
            self.lbl_stats.config(text=f"就绪 | 总整理记录: {count} 条")

        self.root.after(0, _insert)

    def _start_background_monitor(self) -> None:
        """启动后台定时扫描线程。"""
        self.is_monitoring = True
        self.cleaner._stop_event.clear()

        def _worker() -> None:
            scan_sec = int(self.cleaner.config.get("scan_interval_seconds", DEFAULT_SCAN_INTERVAL))
            while self.is_monitoring and not self.cleaner._stop_event.is_set():
                self.cleaner.clean_once()
                # 细颗粒度睡眠，以便快速响应停止
                for _ in range(scan_sec * 2):
                    if not self.is_monitoring or self.cleaner._stop_event.is_set():
                        break
                    time.sleep(0.5)

        self.monitor_thread = threading.Thread(target=_worker, daemon=True)
        self.monitor_thread.start()

    def _toggle_monitoring(self) -> None:
        """切换监控状态（暂停/继续）。"""
        if self.is_monitoring:
            self.is_monitoring = False
            self.cleaner.stop_monitor()
            self.lbl_status.config(text="⏸ 监控已暂停", foreground="#ea580c")
            self.btn_toggle_mon.config(text="▶ 继续监控")
        else:
            self.lbl_status.config(text="● 监控运行中 (每 30 秒自动扫描)", foreground="#16a34a")
            self.btn_toggle_mon.config(text="⏸ 暂停监控")
            self._start_background_monitor()

    def _trigger_clean_now(self) -> None:
        """手动触发一次立即整理。"""
        def _task() -> None:
            self.root.after(0, lambda: self.btn_clean_now.config(state=tk.DISABLED, text="整理中..."))
            moved, trashed, skipped = self.cleaner.clean_once()
            self.root.after(
                0,
                lambda: [
                    self.btn_clean_now.config(state=tk.NORMAL, text="⚡ 立即整理"),
                    messagebox.showinfo(
                        "整理完成",
                        f"单次整理已完成！\n\n• 归类移动: {moved} 个\n• 移入回收站: {trashed} 个\n• 占用跳过/错误: {skipped} 个",
                    ),
                ],
            )

        threading.Thread(target=_task, daemon=True).start()

    def _change_folder(self) -> None:
        """弹出文件夹选择对话框，更改监控目录。"""
        selected = filedialog.askdirectory(
            title="选择要监控的下载文件夹",
            initialdir=str(self.cleaner.folder)
        )
        if selected:
            new_path = Path(selected).resolve()
            self.cleaner.folder = new_path
            self.cleaner.rules_path = new_path / DEFAULT_RULES_FILENAME
            self.cleaner.log_path = new_path / DEFAULT_LOG_FILENAME
            self.cleaner.reload_rules()
            self.lbl_path.config(text=str(new_path))
            messagebox.showinfo("目录已更新", f"已将监控目录切换为:\n{new_path}")

    def _open_rules_file(self) -> None:
        """用系统默认程序打开 rules.json。"""
        if not self.cleaner.rules_path.exists():
            self.cleaner._load_or_create_rules()
        try:
            if sys.platform == "win32":
                os.startfile(str(self.cleaner.rules_path))
            elif sys.platform == "darwin":
                os.system(f'open "{self.cleaner.rules_path}"')
            else:
                os.system(f'xdg-open "{self.cleaner.rules_path}"')
        except Exception as e:
            messagebox.showerror("打开失败", f"无法打开配置文件:\n{e}")

    def _open_log_file(self) -> None:
        """用系统默认程序打开 cleaner.log。"""
        if not self.cleaner.log_path.exists():
            self.cleaner.log_path.touch()
        try:
            if sys.platform == "win32":
                os.startfile(str(self.cleaner.log_path))
            elif sys.platform == "darwin":
                os.system(f'open "{self.cleaner.log_path}"')
            else:
                os.system(f'xdg-open "{self.cleaner.log_path}"')
        except Exception as e:
            messagebox.showerror("打开失败", f"无法打开日志文件:\n{e}")

    def _exit_app(self) -> None:
        """退出程序。"""
        self.is_monitoring = False
        self.cleaner.stop_monitor()
        self.root.destroy()

    def run(self) -> None:
        """运行 Tkinter 主循环。"""
        self.root.protocol("WM_DELETE_WINDOW", self._exit_app)
        self.root.mainloop()


# ==============================================================================
# CLI 入口与参数解析
# ==============================================================================

def build_arg_parser() -> argparse.ArgumentParser:
    """
    构建命令行参数解析器。

    :return: ArgumentParser 对象
    """
    default_downloads = str(Path.home() / "Downloads")
    parser = argparse.ArgumentParser(
        description="Download Cleaner - 本地下载文件夹自动整理工具 (Python 3.10+)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  python cleaner.py --gui                     # 启动图形化管理界面
  python cleaner.py --once                    # 对默认 Downloads 目录执行单次整理并退出
  python cleaner.py --folder "D:/Downloads"   # 指定目录并开启持续监控 (每30秒)
  python cleaner.py --folder "D:/Downloads" --once --retention-days 15
        """,
    )

    parser.add_argument(
        "--folder",
        "-f",
        type=str,
        default=default_downloads,
        help=f"指定要监控与整理的文件夹路径 (默认: {default_downloads})",
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="单次执行模式：仅执行一次整理后退出，不开启常驻监控",
    )
    parser.add_argument(
        "--gui",
        action="store_true",
        help="GUI 模式：启动 Tkinter 可视化窗口",
    )
    parser.add_argument(
        "--rules",
        "-r",
        type=str,
        default=None,
        help="指定自定义 rules.json 规则文件路径 (默认: 目标文件夹下的 rules.json)",
    )
    parser.add_argument(
        "--retention-days",
        "-d",
        type=int,
        default=None,
        help="文件保留天数，超过该天数的文件移至 Trash/ (默认读取 rules.json 或 30 天)",
    )
    parser.add_argument(
        "--interval",
        "-i",
        type=int,
        default=DEFAULT_SCAN_INTERVAL,
        help=f"持续监控模式下的扫描间隔秒数 (默认: {DEFAULT_SCAN_INTERVAL} 秒)",
    )

    return parser


def main() -> None:
    """主程序入口。"""
    parser = build_arg_parser()
    args = parser.parse_args()

    target_folder = Path(args.folder).expanduser().resolve()
    if not target_folder.exists():
        print(f"提示: 目标文件夹不存在，正在自动创建: {target_folder}")
        target_folder.mkdir(parents=True, exist_ok=True)

    cleaner = DownloadCleaner(
        folder=target_folder,
        rules_path=args.rules,
        retention_days=args.retention_days,
    )

    # 1. GUI 模式
    if args.gui:
        try:
            gui = CleanerGUI(cleaner)
            gui.run()
        except Exception as e:
            cleaner.logger.error(f"启动 GUI 模式失败: {e}", exc_info=True)
            print(f"启动 GUI 失败 ({e})，正在回退到 CLI 模式...")
            cleaner.run_monitor(interval=args.interval)
        return

    # 2. 单次整理模式
    if args.once:
        print(f"正在对目录执行单次整理: {cleaner.folder}")
        moved, trashed, skipped = cleaner.clean_once()
        print(
            f"整理完毕! 已分类移动: {moved} 个, 移入回收站: {trashed} 个, 跳过/错误: {skipped} 个。"
        )
        return

    # 3. CLI 持续监控模式
    print(f"已启动常驻监控模式，按 Ctrl+C 退出...")
    cleaner.run_monitor(interval=args.interval)


if __name__ == "__main__":
    main()
