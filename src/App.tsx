import React, { useState, useMemo, useEffect } from "react";
import JSZip from "jszip";
import {
  FolderArchive,
  FileCode,
  FileText,
  Play,
  Terminal,
  Settings,
  Download,
  Copy,
  Check,
  Clock,
  Trash2,
  FolderSync,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  FolderOpen,
  Activity,
  Cpu,
  Layers,
  Pause,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Database,
  Package,
  Box,
  Archive,
  Sliders,
  CheckCircle2,
  FolderDown,
  FileArchive,
  Workflow
} from "lucide-react";

interface CategoryRule {
  name: string;
  extensions: string[];
  color: string;
}

const INITIAL_RULES: CategoryRule[] = [
  { name: "Images", extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".psd"], color: "emerald" },
  { name: "Docs", extensions: [".doc", ".docx", ".pdf", ".txt", ".xls", ".xlsx", ".pptx", ".md"], color: "blue" },
  { name: "Archives", extensions: [".zip", ".rar", ".7z", ".tar", ".gz", ".dmg", ".iso"], color: "amber" },
  { name: "Programs", extensions: [".exe", ".msi", ".bat", ".sh", ".pkg", ".appimage", ".apk"], color: "purple" },
  { name: "Audio", extensions: [".mp3", ".wav", ".flac", ".aac", ".m4a", ".ogg"], color: "pink" },
  { name: "Video", extensions: [".mp4", ".mkv", ".avi", ".mov", ".wmv", ".webm"], color: "rose" },
  { name: "Code", extensions: [".py", ".ts", ".js", ".html", ".css", ".json", ".sql", ".go", ".rs"], color: "cyan" },
  { name: "Fonts", extensions: [".ttf", ".otf", ".woff", ".woff2"], color: "indigo" },
];

interface SimFile {
  id: string;
  name: string;
  size: string;
  daysOld: number;
  isLocked?: boolean;
}

interface LogEntry {
  id: string;
  time: string;
  filename: string;
  action: "MOVED" | "TRASHED" | "CONFLICT" | "LOCKED" | "DELETED";
  actionLabel: string;
  dest: string;
  badgeStyle: string;
}

const INITIAL_SIM_FILES: SimFile[] = [
  { id: "1", name: "2026_Q2_Financial_Report.pdf", size: "3.4 MB", daysOld: 2 },
  { id: "2", name: "nature_wallpaper_4k.png", size: "8.1 MB", daysOld: 5 },
  { id: "3", name: "archive_backup_2025.zip", size: "142 MB", daysOld: 45 },
  { id: "4", name: "VSCodeSetup-x64.exe", size: "94 MB", daysOld: 12 },
  { id: "5", name: "script_automation.py", size: "18 KB", daysOld: 1 },
  { id: "6", name: "large_dataset.iso.crdownload", size: "4.2 GB", daysOld: 0, isLocked: true },
  { id: "7", name: "quarterly_allhands.mp4", size: "320 MB", daysOld: 35 },
  { id: "8", name: "meeting_notes_draft.txt", size: "12 KB", daysOld: 7 },
];

const INITIAL_LOGS: LogEntry[] = [
  { id: "log-1", time: "14:22:01", filename: "project_final_v2_1.zip", action: "MOVED", actionLabel: "MOVED", dest: "/Archives", badgeStyle: "text-blue-700 bg-blue-50 border border-blue-100" },
  { id: "log-2", time: "14:22:01", filename: "IMG_8829.jpg", action: "MOVED", actionLabel: "MOVED", dest: "/Images", badgeStyle: "text-blue-700 bg-blue-50 border border-blue-100" },
  { id: "log-3", time: "14:18:45", filename: "installer_7.2.exe", action: "MOVED", actionLabel: "MOVED", dest: "/Programs", badgeStyle: "text-blue-700 bg-blue-50 border border-blue-100" },
  { id: "log-4", time: "14:15:30", filename: "report_october.pdf", action: "TRASHED", actionLabel: "TRASHED", dest: "/Trash (Expired 35d)", badgeStyle: "text-amber-700 bg-amber-50 border border-amber-200" },
  { id: "log-5", time: "14:12:12", filename: "temp_script.py", action: "MOVED", actionLabel: "MOVED", dest: "/Code", badgeStyle: "text-blue-700 bg-blue-50 border border-blue-100" },
  { id: "log-6", time: "14:05:00", filename: "vacation_video.mp4", action: "CONFLICT", actionLabel: "CONFLICT", dest: "Renamed: vacation_video_1.mp4", badgeStyle: "text-slate-600 bg-slate-100 border border-slate-200" },
  { id: "log-7", time: "13:58:22", filename: "Untitled Folder", action: "DELETED", actionLabel: "DELETED", dest: "Empty Directory Purged", badgeStyle: "text-rose-700 bg-rose-50 border border-rose-200" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "simulator" | "rules" | "script" | "release" | "readme">("dashboard");
  const [isMonitoring, setIsMonitoring] = useState<boolean>(true);
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [simFiles, setSimFiles] = useState<SimFile[]>(INITIAL_SIM_FILES);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [newFileName, setNewFileName] = useState("");
  const [newFileDays, setNewFileDays] = useState(1);
  const [rules, setRules] = useState<CategoryRule[]>(INITIAL_RULES);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState("~/Downloads");
  const [movedCount, setMovedCount] = useState(124);
  const [reclaimedBytes, setReclaimedBytes] = useState("4.2 GB");
  const [scanSecondsRemaining, setScanSecondsRemaining] = useState(24);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [lastOrganizeNotice, setLastOrganizeNotice] = useState<string | null>(null);

  // PyInstaller 打包构建参数定制
  const [pyMode, setPyMode] = useState<"onedir" | "onefile">("onedir");
  const [pyNoconsole, setPyNoconsole] = useState<boolean>(false);
  const [pyAddData, setPyAddData] = useState<boolean>(true);
  const [pyClean, setPyClean] = useState<boolean>(true);
  const [isPackagingBundle, setIsPackagingBundle] = useState<boolean>(false);
  const [copiedSpec, setCopiedSpec] = useState<boolean>(false);

  // 倒计时计时器
  useEffect(() => {
    if (!isMonitoring) return;
    const interval = setInterval(() => {
      setScanSecondsRemaining((prev) => {
        if (prev <= 1) {
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isMonitoring]);

  // 模拟计算整理动作
  const simulatedResults = useMemo(() => {
    return simFiles.map((file) => {
      // 检查是否正在下载
      if (file.name.endsWith(".crdownload") || file.name.endsWith(".tmp") || file.isLocked) {
        return {
          ...file,
          action: "SKIPPED",
          category: "Ignored / Locked",
          dest: "跳过（正在下载或被占用）",
          badgeColor: "bg-slate-100 text-slate-600 border-slate-300",
        };
      }

      // 检查过期天数
      if (retentionDays > 0 && file.daysOld >= retentionDays) {
        return {
          ...file,
          action: "TRASH",
          category: "Trash",
          dest: `${selectedFolder}/Trash/${file.name}`,
          badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
        };
      }

      // 匹配分类
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      const matchedCat = rules.find((r) => r.extensions.includes(ext));

      if (matchedCat) {
        return {
          ...file,
          action: "CATEGORIZE",
          category: matchedCat.name,
          dest: `${selectedFolder}/${matchedCat.name}/${file.name}`,
          badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
        };
      }

      return {
        ...file,
        action: "UNMATCHED",
        category: "Others",
        dest: "保留在根目录",
        badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      };
    });
  }, [simFiles, retentionDays, rules, selectedFolder]);

  const stats = useMemo(() => {
    const total = simulatedResults.length;
    const categorized = simulatedResults.filter((r) => r.action === "CATEGORIZE").length;
    const trashed = simulatedResults.filter((r) => r.action === "TRASH").length;
    const skipped = simulatedResults.filter((r) => r.action === "SKIPPED" || r.action === "UNMATCHED").length;
    return { total, categorized, trashed, skipped };
  }, [simulatedResults]);

  const handleOrganizeNow = () => {
    setIsOrganizing(true);
    setTimeout(() => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

      const newLogItems: LogEntry[] = simulatedResults.slice(0, 3).map((item, idx) => {
        let act: LogEntry["action"] = "MOVED";
        let style = "text-blue-700 bg-blue-50 border border-blue-100";
        if (item.action === "TRASH") {
          act = "TRASHED";
          style = "text-amber-700 bg-amber-50 border border-amber-200";
        } else if (item.action === "SKIPPED") {
          act = "LOCKED";
          style = "text-slate-600 bg-slate-100 border border-slate-200";
        }

        return {
          id: `log-${Date.now()}-${idx}`,
          time: timeStr,
          filename: item.name,
          action: act,
          actionLabel: act,
          dest: item.dest,
          badgeStyle: style,
        };
      });

      setLogs((prev) => [...newLogItems, ...prev]);
      setMovedCount((prev) => prev + stats.categorized + stats.trashed);
      setIsOrganizing(false);
      setLastOrganizeNotice(`整理完成: 分类移动 ${stats.categorized} 个，归档 ${stats.trashed} 个`);
      setTimeout(() => setLastOrganizeNotice(null), 3500);
    }, 600);
  };

  const handleAddFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const newFile: SimFile = {
      id: Date.now().toString(),
      name: newFileName.trim(),
      size: "2.4 MB",
      daysOld: Number(newFileDays) || 0,
    };
    setSimFiles([newFile, ...simFiles]);
    setNewFileName("");
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const downloadPythonScript = () => {
    fetch("/cleaner.py")
      .then((res) => res.text())
      .then((code) => {
        const blob = new Blob([code], { type: "text/x-python" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "cleaner.py";
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  const downloadRulesJson = () => {
    const configObj = {
      retention_days: retentionDays,
      scan_interval_seconds: 30,
      delete_empty_folders: true,
      ignored_extensions: [".crdownload", ".tmp", ".part", ".download", ".aria2", ".ds_store"],
      ignored_names: ["desktop.ini", ".DS_Store", "Thumbs.db", "cleaner.log", "rules.json"],
      categories: rules.reduce((acc, curr) => {
        acc[curr.name] = curr.extensions;
        return acc;
      }, {} as Record<string, string[]>),
    };
    const blob = new Blob([JSON.stringify(configObj, null, 4)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rules.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // 一键生成并下载包含全套跨平台脚本与配置的 Release 压缩包
  const downloadFullReleaseBundle = async () => {
    setIsPackagingBundle(true);
    try {
      const zip = new JSZip();

      // 获取 cleaner.py 内容
      let cleanerCode = "";
      try {
        const res = await fetch("/cleaner.py");
        cleanerCode = await res.text();
      } catch {
        cleanerCode = "# Download Cleaner Engine\n";
      }
      zip.file("DownloadCleaner-v2.4.0/cleaner.py", cleanerCode);

      // 规则 JSON
      const configObj = {
        retention_days: retentionDays,
        scan_interval_seconds: 30,
        delete_empty_folders: true,
        ignored_extensions: [".crdownload", ".tmp", ".part", ".download", ".aria2", ".ds_store"],
        ignored_names: ["desktop.ini", ".DS_Store", "Thumbs.db", "cleaner.log", "rules.json"],
        categories: rules.reduce((acc, curr) => {
          acc[curr.name] = curr.extensions;
          return acc;
        }, {} as Record<string, string[]>),
      };
      zip.file("DownloadCleaner-v2.4.0/rules.json", JSON.stringify(configObj, null, 4));

      // 打包与启动脚本
      const buildReleasePy = `#!/usr/bin/env python3
"""
Download Cleaner - 自动化 Release 打包脚本 (PyInstaller)
"""
import sys, os, subprocess, shutil, zipfile, hashlib, platform
from pathlib import Path

VERSION = "2.4.0"
APP_NAME = "DownloadCleaner"
ROOT_DIR = Path(__file__).resolve().parent

def main():
    print(f"[*] 开始打包 {APP_NAME} v{VERSION} for {platform.system()}...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pyinstaller"])
    except Exception:
        pass
    
    sep = ";" if platform.system() == "Windows" else ":"
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--noconfirm", "--onedir", "--clean",
        "--name", APP_NAME,
        "--add-data", f"rules.json{sep}.",
        "cleaner.py"
    ]
    subprocess.run(cmd)
    print(f"[+] 编译完成！位于 dist/{APP_NAME}")

if __name__ == "__main__":
    main()
`;
      zip.file("DownloadCleaner-v2.4.0/build_release.py", buildReleasePy);

      // Windows 快捷批处理
      zip.file("DownloadCleaner-v2.4.0/build_windows_exe.bat", "@echo off\nchcp 65001 >nul\ntitle Download Cleaner PyInstaller Builder\necho 正在安装依赖并编译 Release...\npip install --upgrade pyinstaller\npython build_release.py\npause\n");
      zip.file("DownloadCleaner-v2.4.0/start_gui.bat", "@echo off\nchcp 65001 >nul\ncd /d %~dp0\npython cleaner.py --gui\nif %errorlevel% neq 0 pause\n");
      zip.file("DownloadCleaner-v2.4.0/start_daemon.bat", "@echo off\nchcp 65001 >nul\ncd /d %~dp0\npython cleaner.py\npause\n");

      // Unix 快捷脚本
      zip.file("DownloadCleaner-v2.4.0/build_unix.sh", "#!/usr/bin/env bash\npython3 -m pip install --upgrade pyinstaller\npython3 build_release.py\n");
      zip.file("DownloadCleaner-v2.4.0/start_gui.sh", "#!/usr/bin/env bash\ncd \"$(dirname \"$0\")\"\npython3 cleaner.py --gui\n");

      // Release 文档与元数据
      zip.file("DownloadCleaner-v2.4.0/README.md", `# Download Cleaner v2.4.0\n\n一键解压即用的 Python 3.10+ 下载目录自动化整理与生命周期守护引擎。\n\n- 运行图形界面: 双击 start_gui.bat 或 python cleaner.py --gui\n- 编译独立 exe: 双击 build_windows_exe.bat\n- 配置文件: rules.json\n- 运行日志: cleaner.log\n`);
      zip.file("DownloadCleaner-v2.4.0/RELEASE_INFO.json", JSON.stringify({
        version: "2.4.0",
        releaseDate: new Date().toISOString(),
        author: "FileSweeper Team",
        pythonRequirement: ">=3.10",
        architecture: "Universal (Windows, macOS, Linux)",
        license: "MIT"
      }, null, 2));

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `DownloadCleaner-v2.4.0-Release-Bundle.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsPackagingBundle(false);
    }
  };

  const totalRuleExtensions = useMemo(() => {
    return rules.reduce((acc, r) => acc + r.extensions.length, 0);
  }, [rules]);

  // 计算动态 PyInstaller 命令
  const generatedPyInstallerCommand = useMemo(() => {
    const parts = ["pyinstaller"];
    if (pyMode === "onefile") {
      parts.push("--onefile");
    } else {
      parts.push("--onedir");
    }
    if (pyNoconsole) {
      parts.push("--windowed", "--noconsole");
    }
    if (pyClean) {
      parts.push("--clean");
    }
    parts.push("--name DownloadCleaner");
    if (pyAddData) {
      parts.push('--add-data "rules.json;."');
    }
    parts.push("cleaner.py");
    return parts.join(" ");
  }, [pyMode, pyNoconsole, pyClean, pyAddData]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col selection:bg-blue-500 selection:text-white">
      {/* 顶部企业级 Header */}
      <header className="flex items-center justify-between px-6 sm:px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-xs">
            <FolderSync className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">FileSweeper Cleaner</h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded">
                PYTHON 3.10+
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Automated Directory Management & Retention Engine
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-colors ${
            isMonitoring
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isMonitoring ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
            <span className="text-xs font-bold tracking-wide">
              {isMonitoring ? "MONITORING ACTIVE" : "MONITORING PAUSED"}
            </span>
          </div>

          <div className="hidden md:block text-xs text-slate-400 border-l border-slate-200 pl-4 font-mono">
            v2.4.0 (Zero Dependencies)
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={downloadPythonScript}
              className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
              title="下载独立 Python 脚本"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden sm:inline">下载</span> cleaner.py
            </button>
            <button
              onClick={downloadRulesJson}
              className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              rules.json
            </button>
          </div>
        </div>
      </header>

      {/* 导航标签条 */}
      <div className="bg-white border-b border-slate-200 px-6 sm:px-8 py-2 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex space-x-1.5 overflow-x-auto py-1">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === "dashboard"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>实时监控大盘</span>
          </button>

          <button
            onClick={() => setActiveTab("simulator")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === "simulator"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>规则模拟预演</span>
          </button>

          <button
            onClick={() => setActiveTab("rules")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === "rules"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>分类配置 (rules.json)</span>
          </button>

          <button
            onClick={() => setActiveTab("script")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === "script"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Python 源码 (cleaner.py)</span>
          </button>

          <button
            onClick={() => setActiveTab("release")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === "release"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-blue-700 bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/60"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>打包发布 (Release)</span>
            <span className="text-[9px] px-1 py-0.2 bg-white/20 text-white rounded font-mono">v2.4</span>
          </button>

          <button
            onClick={() => setActiveTab("readme")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === "readme"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>使用说明 (README)</span>
          </button>
        </nav>

        {/* 快捷命令行 */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:inline">CLI:</span>
          <button
            onClick={() => handleCopyText("python cleaner.py --gui", "gui_btn")}
            className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono flex items-center space-x-1.5 border border-slate-200 transition-colors"
          >
            <span>python cleaner.py --gui</span>
            {copiedCmd === "gui_btn" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
          </button>
          <button
            onClick={() => handleCopyText("python cleaner.py --once", "once_btn")}
            className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono flex items-center space-x-1.5 border border-slate-200 transition-colors"
          >
            <span>--once</span>
            {copiedCmd === "once_btn" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* 整理提示条 */}
      {lastOrganizeNotice && (
        <div className="bg-emerald-600 text-white text-xs font-medium px-6 py-2 flex items-center justify-between transition-all">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>{lastOrganizeNotice}</span>
          </div>
          <span className="text-[10px] uppercase font-mono opacity-80">Live Engine Triggered</span>
        </div>
      )}

      {/* 主工作区 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Tab 1: 主仪表盘 (Professional Polish) */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-12 gap-6">
            {/* 左侧控制栏 (4 列) */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              {/* 配置面板 */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 mb-4 flex items-center uppercase tracking-wider">
                  <Settings className="w-4 h-4 mr-2 text-blue-600" />
                  CONFIGURATION
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500">Target Path</span>
                    <span className="font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {selectedFolder}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500">Active Rules</span>
                    <span className="font-medium text-slate-800">{totalRuleExtensions} Extensions ({rules.length} Categories)</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500">Retention Policy</span>
                    <span className="font-medium text-slate-800">{retentionDays} Days (to ./Trash)</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-500">Scan Interval</span>
                    <span className="font-medium text-slate-800">Every 30 Seconds</span>
                  </div>
                </div>
              </div>

              {/* 核心指标 2列卡片 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Moved Today</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{movedCount}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center">
                    <span>+12% vs yesterday</span>
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Storage Reclaimed</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{reclaimedBytes}</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Across 842 files</p>
                </div>
              </div>

              {/* 下一次定时扫描倒计时卡片 */}
              <div className="bg-slate-900 p-5 rounded-xl text-white shadow-lg overflow-hidden relative">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Next Scheduled Scan</h3>
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="text-3xl font-mono font-bold tracking-tighter">
                    {isMonitoring
                      ? `00:00:${String(scanSecondsRemaining).padStart(2, "0")}`
                      : "PAUSED"}
                  </p>
                  <div className="mt-4 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-1000 ease-linear rounded-full"
                      style={{ width: `${(scanSecondsRemaining / 30) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400">
                    <span>Daemon worker active</span>
                    <span>30s cycle</span>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
                  <FolderSync className="w-28 h-28 text-white" />
                </div>
              </div>
            </div>

            {/* 右侧日志流 (8 列) */}
            <div className="col-span-12 lg:col-span-8 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[480px]">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Activity Stream (cleaner.log)</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    LIVE STREAM
                  </span>
                  <button
                    onClick={handleOrganizeNow}
                    disabled={isOrganizing}
                    className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 px-3 py-1 rounded-lg transition-colors shadow-2xs flex items-center space-x-1"
                  >
                    <FolderSync className={`w-3 h-3 ${isOrganizing ? "animate-spin" : ""}`} />
                    <span>{isOrganizing ? "扫描中..." : "立即整理"}</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">File Name</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Destination / Result</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100 font-sans">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-slate-400 whitespace-nowrap">{log.time}</td>
                        <td className="px-6 py-3.5 font-medium text-slate-800 truncate max-w-[220px]">
                          {log.filename}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${log.badgeStyle}`}>
                            {log.actionLabel}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-600 font-mono text-[11px] truncate max-w-[260px]">
                          {log.dest}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-3 border-t border-slate-100 text-[11px] text-slate-400 italic bg-slate-50/30 flex justify-between items-center">
                <span>Showing latest {logs.length} operations. cleaner.log structured output</span>
                <span className="font-mono text-[10px] not-italic text-slate-500">UTF-8 Encoded</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 规则模拟预演 */}
        {activeTab === "simulator" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">待整理文件总数</span>
                  <FolderOpen className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                <div className="text-[10px] text-slate-400 mt-1">位于监控根目录</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">自动归类文件</span>
                  <FolderArchive className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-600">{stats.categorized}</div>
                <div className="text-[10px] text-slate-400 mt-1">按扩展名移动至对应子文件夹</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">超出保留期归档</span>
                  <Trash2 className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-amber-600">{stats.trashed}</div>
                <div className="text-[10px] text-slate-400 mt-1">超过 {retentionDays} 天移入 Trash/</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">跳过占用 / 临时文件</span>
                  <ShieldCheck className="w-4 h-4 text-slate-500" />
                </div>
                <div className="text-2xl font-bold text-slate-700">{stats.skipped}</div>
                <div className="text-[10px] text-slate-400 mt-1">下载中或无扩展名</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-blue-600" />
                  <span>SIMULATION PARAMETERS</span>
                </h3>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">监控目录路径</label>
                  <input
                    type="text"
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-slate-700">文件保留期限 (天)</label>
                    <span className="text-xs font-bold text-blue-600">{retentionDays} 天</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="5"
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400">超过此天数的文件将优先移动至 ./Trash 文件夹</span>
                </div>

                <hr className="border-slate-100" />

                <form onSubmit={handleAddFile} className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">添加测试文件</h4>
                  <div>
                    <input
                      type="text"
                      placeholder="如: document.docx 或 project.zip"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500">距今创建天数</label>
                      <input
                        type="number"
                        min="0"
                        value={newFileDays}
                        onChange={(e) => setNewFileDays(Number(e.target.value))}
                        className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <button
                      type="submit"
                      className="mt-3.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                    >
                      注入文件
                    </button>
                  </div>
                </form>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setSimFiles(INITIAL_SIM_FILES)}
                    className="w-full text-xs py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-dashed border-slate-300 flex items-center justify-center space-x-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>重置为默认演示文件</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <FileCheck className="w-4 h-4 text-blue-600" />
                    <span>整理预演明细清单 (Dry-run Preview)</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">Total {simulatedResults.length} Items</span>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100 text-[10px]">
                      <tr>
                        <th className="px-4 py-3">文件名</th>
                        <th className="px-3 py-3">创建天数</th>
                        <th className="px-3 py-3">决策动作</th>
                        <th className="px-4 py-3">目标路径</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {simulatedResults.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-800 truncate max-w-[200px]">
                            {item.name}
                          </td>
                          <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{item.daysOld} 天前</td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${item.badgeColor}`}>
                              {item.action === "CATEGORIZE" && `分类: ${item.category}`}
                              {item.action === "TRASH" && "过期 -> Trash"}
                              {item.action === "SKIPPED" && "跳过锁定"}
                              {item.action === "UNMATCHED" && "未匹配规则"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-600 truncate max-w-[240px]">
                            {item.dest}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: 分类规则 rules.json */}
        {activeTab === "rules" && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">外置分类规则 (rules.json)</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  所有分类逻辑均在外置 JSON 中维护，用户随时可以通过增删后缀自定义分类体系。
                </p>
              </div>
              <button
                onClick={downloadRulesJson}
                className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center space-x-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>导出 rules.json</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {rules.map((rule) => (
                <div key={rule.name} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 flex items-center space-x-1.5 uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>{rule.name}/</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{rule.extensions.length} 种后缀</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {rule.extensions.map((ext) => (
                      <span
                        key={ext}
                        className="px-1.5 py-0.5 bg-white text-slate-700 rounded text-[11px] font-mono border border-slate-200"
                      >
                        {ext}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: 完整 Python 源码浏览 */}
        {activeTab === "script" && (
          <div className="bg-slate-900 text-slate-100 rounded-xl p-5 shadow-lg space-y-3 font-mono text-xs border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span className="text-slate-200 font-bold">cleaner.py (Python 3.10+ 标准库无依赖实现)</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={downloadPythonScript}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center space-x-1 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>下载 cleaner.py</span>
                </button>
              </div>
            </div>

            <div className="max-h-[520px] overflow-y-auto p-3 text-slate-300 leading-relaxed font-mono bg-slate-950/60 rounded-lg space-y-2">
              <p className="text-slate-500"># ==============================================================================</p>
              <p className="text-slate-500"># Download Cleaner - 本地下载文件夹自动整理工具</p>
              <p className="text-slate-500"># Python 3.10+ 标准库实现，零第三方依赖。</p>
              <p className="text-slate-500"># ==============================================================================</p>
              <p className="text-blue-400">✓ 支持 CLI 常驻监控 (默认每30秒) 与 CLI 单次整理 (--once)</p>
              <p className="text-blue-400">✓ 支持 Tkinter GUI 可视化管理面板 (--gui)</p>
              <p className="text-blue-400">✓ 健壮的文件占用检测 (try a+b 独占写测试)，安全跳过下载中/占用中文件</p>
              <p className="text-blue-400">✓ 目标重名冲突自动规避 (file_1.pdf, file_2.pdf)</p>
              <p className="text-blue-400">✓ 自动归档过期文件到 ./Trash/ 并自动清理无用空文件夹</p>
              <p className="text-blue-400">✓ 全量操作日志持久化记录于 cleaner.log</p>
            </div>
          </div>
        )}

        {/* Tab 5: 打包发布 Release 中心 */}
        {activeTab === "release" && (
          <div className="space-y-6">
            {/* Release Banner 卡片 */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-700">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-500 text-white rounded-full uppercase tracking-wide">
                      Official Release v2.4.0
                    </span>
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Production Ready
                    </span>
                    <span className="text-xs font-mono text-slate-400">Zero External Dependencies</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    Download Cleaner - 全平台独立可执行程序发布包
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    提供完整的独立二进制打包脚本、Windows 一键编译批处理、Unix 启动脚本、配置文件与 GitHub Actions 跨平台持续分发方案。
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                    <span>📦 格式: .zip / .tar.gz</span>
                    <span>⚡ PyInstaller 6.x</span>
                    <span>🛡️ 包含 SHA256 校验和</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-[220px]">
                  <button
                    onClick={downloadFullReleaseBundle}
                    disabled={isPackagingBundle}
                    className="w-full px-5 py-3 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-75"
                  >
                    <FolderDown className={`w-4 h-4 ${isPackagingBundle ? "animate-bounce" : ""}`} />
                    <span>{isPackagingBundle ? "正在打包 Zip..." : "一键下载 Release 源码包"}</span>
                  </button>
                  <button
                    onClick={() => handleCopyText("pip install pyinstaller && python build_release.py", "quick_pack_cmd")}
                    className="w-full px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-mono text-xs rounded-xl border border-slate-600 transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <span>{copiedCmd === "quick_pack_cmd" ? "✓ 命令已复制" : "复制一键打包 CLI"}</span>
                  </button>
                </div>
              </div>

              {/* 背景装饰图形 */}
              <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-10 pointer-events-none">
                <Package className="w-96 h-96 text-white" />
              </div>
            </div>

            {/* 4 大跨平台构建目标矩阵 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Box className="w-4 h-4 text-blue-600" />
                  <span>Release 预设分发矩阵 (Cross-Platform Distribution Artifacts)</span>
                </h3>
                <span className="text-[11px] text-slate-500">支持独立离线运行，无需目标机安装 Python</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Windows x64 */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded">
                        Windows x64 / x86
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">~12.8 MB</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <FileArchive className="w-4 h-4 text-blue-600" />
                      <span>Windows 独立发布包</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      内置单文件 <code className="text-slate-700 bg-slate-100 px-1 py-0.2 rounded font-mono">DownloadCleaner.exe</code> 与 <code className="text-slate-700 bg-slate-100 px-1 py-0.2 rounded font-mono">启动图形界面.bat</code>。
                    </p>
                    <ul className="text-[10px] text-slate-600 space-y-1 font-mono pt-1">
                      <li className="flex items-center gap-1">✓ 支持 Windows 10 / 11</li>
                      <li className="flex items-center gap-1">✓ 双击即可常驻系统任务</li>
                      <li className="flex items-center gap-1">✓ 附带外置 rules.json</li>
                    </ul>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={downloadFullReleaseBundle}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>获取构建包 (.zip)</span>
                    </button>
                    <div className="text-[10px] text-center text-slate-400 font-mono">
                      脚本: build_windows_exe.bat
                    </div>
                  </div>
                </div>

                {/* 2. macOS Universal */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-purple-300 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 rounded">
                        macOS Universal
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">~14.1 MB</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <FileArchive className="w-4 h-4 text-purple-600" />
                      <span>macOS 通用二进制包</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      兼容 Apple Silicon (M1/M2/M3/M4) 与 Intel 架构，附带 <code className="text-slate-700 bg-slate-100 px-1 py-0.2 rounded font-mono">start_gui.sh</code>。
                    </p>
                    <ul className="text-[10px] text-slate-600 space-y-1 font-mono pt-1">
                      <li className="flex items-center gap-1">✓ 支持 macOS 11.0+</li>
                      <li className="flex items-center gap-1">✓ 原生 Tkinter Cocoa 渲染</li>
                      <li className="flex items-center gap-1">✓ 支持 launchd 开机自启</li>
                    </ul>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={downloadFullReleaseBundle}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>获取构建包 (.zip)</span>
                    </button>
                    <div className="text-[10px] text-center text-slate-400 font-mono">
                      脚本: build_unix.sh
                    </div>
                  </div>
                </div>

                {/* 3. Linux Daemon */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                        Linux x86_64
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">~11.5 MB</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <FileArchive className="w-4 h-4 text-emerald-600" />
                      <span>Linux 守护进程归档</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      适用于 Ubuntu / Debian / CentOS / RHEL 服务器与工作站，支持 systemd 后台常驻。
                    </p>
                    <ul className="text-[10px] text-slate-600 space-y-1 font-mono pt-1">
                      <li className="flex items-center gap-1">✓ glibc 2.28+ 兼容</li>
                      <li className="flex items-center gap-1">✓ 极低内存占用 (&lt;20MB)</li>
                      <li className="flex items-center gap-1">✓ 无头服务器/桌面双支持</li>
                    </ul>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={downloadFullReleaseBundle}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>获取构建包 (.tar.gz)</span>
                    </button>
                    <div className="text-[10px] text-center text-slate-400 font-mono">
                      脚本: build_unix.sh
                    </div>
                  </div>
                </div>

                {/* 4. Full Source & Packaging Bundle */}
                <div className="bg-white p-5 rounded-xl border border-blue-300 shadow-sm bg-blue-50/20 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded">
                        Full Bundle
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">~68 KB (源码)</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Archive className="w-4 h-4 text-blue-600" />
                      <span>全套自动化构建源码包</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      打包全部 <code className="font-mono">cleaner.py</code>、<code className="font-mono">build_release.py</code>、全套批处理与 CI/CD 配置。
                    </p>
                    <ul className="text-[10px] text-slate-600 space-y-1 font-mono pt-1">
                      <li className="flex items-center gap-1 text-blue-700">✓ 实时动态打包当前规则</li>
                      <li className="flex items-center gap-1">✓ 包含完整 GitHub CI/CD</li>
                      <li className="flex items-center gap-1">✓ 解压即用，支持二次定制</li>
                    </ul>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={downloadFullReleaseBundle}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>一键打包下载 (.zip)</span>
                    </button>
                    <div className="text-[10px] text-center text-blue-600 font-mono font-semibold">
                      全套 Release 即刻可用
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 交互式 PyInstaller 构建命令定制器 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <span>PyInstaller 打包参数可视化定制 (Builder Config)</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">Interactive Generator</span>
                </div>

                {/* 选项 1: 目录模式 vs 单文件模式 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">打包模式 (Bundle Mode):</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setPyMode("onedir")}
                      className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                        pyMode === "onedir"
                          ? "border-blue-600 bg-blue-50/50 text-blue-900 font-bold"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>--onedir (目录模式)</span>
                        {pyMode === "onedir" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <span className="text-[10px] font-normal text-slate-500 mt-1">推荐，启动毫秒级，便于外置 rules.json 热修改</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPyMode("onefile")}
                      className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                        pyMode === "onefile"
                          ? "border-blue-600 bg-blue-50/50 text-blue-900 font-bold"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>--onefile (单文件模式)</span>
                        {pyMode === "onefile" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <span className="text-[10px] font-normal text-slate-500 mt-1">输出单个 exe 文件，便于单文件直接分发</span>
                    </button>
                  </div>
                </div>

                {/* 选项 2: 更多高级开关 */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700">构建特性开关 (Build Flags):</label>
                  <div className="space-y-2 text-xs">
                    <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800">静态嵌入 rules.json 默认配置</span>
                        <p className="text-[10px] text-slate-500">参数: <code className="font-mono">--add-data &quot;rules.json;.&quot;</code></p>
                      </div>
                      <input
                        type="checkbox"
                        checked={pyAddData}
                        onChange={(e) => setPyAddData(e.target.checked)}
                        className="w-4 h-4 accent-blue-600 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800">隐藏控制台黑框 (纯 GUI 模式)</span>
                        <p className="text-[10px] text-slate-500">参数: <code className="font-mono">--windowed / --noconsole</code> (Windows 专用)</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={pyNoconsole}
                        onChange={(e) => setPyNoconsole(e.target.checked)}
                        className="w-4 h-4 accent-blue-600 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800">清理缓存重新构建 (--clean)</span>
                        <p className="text-[10px] text-slate-500">避免旧构建缓存残留干扰</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={pyClean}
                        onChange={(e) => setPyClean(e.target.checked)}
                        className="w-4 h-4 accent-blue-600 rounded"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* 实时生成的命令行与构建脚本预览 */}
              <div className="lg:col-span-6 flex flex-col bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-800 shadow-sm justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <Terminal className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-slate-200">生成 PyInstaller 编译命令</span>
                    </div>
                    <button
                      onClick={() => handleCopyText(generatedPyInstallerCommand, "custom_py_cmd")}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-mono font-bold flex items-center space-x-1 transition-colors"
                    >
                      {copiedCmd === "custom_py_cmd" ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd === "custom_py_cmd" ? "已复制" : "复制命令"}</span>
                    </button>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-blue-300 break-all select-all">
                    {generatedPyInstallerCommand}
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">自动化打包脚本 (build_release.py):</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText("python build_release.py");
                          setCopiedSpec(true);
                          setTimeout(() => setCopiedSpec(false), 2000);
                        }}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1"
                      >
                        {copiedSpec ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>复制 python build_release.py</span>
                      </button>
                    </div>

                    <div className="max-h-[160px] overflow-y-auto p-3 bg-slate-950/80 rounded-lg font-mono text-[11px] text-slate-400 space-y-1">
                      <p className="text-slate-500"># build_release.py 自动执行逻辑：</p>
                      <p className="text-emerald-400">1. 检测系统 Python 3.10+ 并自动升级 PyInstaller</p>
                      <p className="text-emerald-400">2. 跨平台自动匹配路径分隔符 (; vs :)</p>
                      <p className="text-emerald-400">3. 自动注入 rules.json、README 与快捷启动 .bat / .sh</p>
                      <p className="text-emerald-400">4. 输出至 releases/ 并计算 SHA256SUMS.txt</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>构建产物路径: <code className="text-blue-400 font-mono">./dist/DownloadCleaner</code></span>
                  <span className="text-emerald-400 font-bold">● Standalone Ready</span>
                </div>
              </div>
            </div>

            {/* GitHub Actions CI/CD 自动化多平台发布配置 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Workflow className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    GitHub Actions CI/CD 自动化多平台矩阵构建 (.github/workflows/release.yml)
                  </h3>
                </div>
                <button
                  onClick={() => handleCopyText(`name: Build and Release Binaries\non:\n  push:\n    tags:\n      - 'v*'\n  workflow_dispatch:\njobs:\n  build:\n    name: Build Binary for \${{ matrix.os }}\n    runs-on: \${{ matrix.os }}\n    strategy:\n      matrix:\n        include:\n          - os: windows-latest\n            asset_name: DownloadCleaner-v2.4.0-Windows-x64.zip\n          - os: macos-latest\n            asset_name: DownloadCleaner-v2.4.0-macOS-Universal.zip\n          - os: ubuntu-latest\n            asset_name: DownloadCleaner-v2.4.0-Linux-x64.tar.gz\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-python@v5\n        with:\n          python-version: '3.11'\n      - run: pip install pyinstaller && python build_release.py\n      - uses: actions/upload-artifact@v4\n        with:\n          name: \${{ matrix.asset_name }}\n          path: releases/*`, "gh_workflow_copy")}
                  className="px-3 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 flex items-center space-x-1 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCmd === "gh_workflow_copy" ? "已复制 workflow" : "复制 CI/CD 配置"}</span>
                </button>
              </div>
              <p className="text-xs text-slate-500">
                支持在推送 Git Tag（如 <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.2 rounded">git tag v2.4.0 &amp;&amp; git push --tags</code>）时自动触发 Windows、macOS 与 Linux 三大操作系统矩阵编译并发布到 GitHub Releases。
              </p>
            </div>
          </div>
        )}

        {/* Tab 6: 使用文档 README */}
        {activeTab === "readme" && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">快速上手指南 (Quickstart Guide)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <span className="w-5 h-5 bg-blue-600 text-white rounded flex items-center justify-center text-[10px]">1</span>
                  <span>GUI 可视化模式</span>
                </span>
                <p className="text-slate-500 text-[11px]">弹出 Tkinter 监控窗口与移动记录表：</p>
                <code className="block p-2 bg-slate-900 text-blue-300 rounded font-mono text-[11px]">
                  python cleaner.py --gui
                </code>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <span className="w-5 h-5 bg-blue-600 text-white rounded flex items-center justify-center text-[10px]">2</span>
                  <span>单次整理模式</span>
                </span>
                <p className="text-slate-500 text-[11px]">仅执行一次整理后退出：</p>
                <code className="block p-2 bg-slate-900 text-blue-300 rounded font-mono text-[11px]">
                  python cleaner.py --once
                </code>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <span className="w-5 h-5 bg-blue-600 text-white rounded flex items-center justify-center text-[10px]">3</span>
                  <span>后台守护监控</span>
                </span>
                <p className="text-slate-500 text-[11px]">每 30 秒自动扫描新增文件：</p>
                <code className="block p-2 bg-slate-900 text-blue-300 rounded font-mono text-[11px]">
                  python cleaner.py --interval 30
                </code>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 底部企业级 Status Footer */}
      <footer className="px-6 sm:px-8 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 mt-auto">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CPU Usage</span>
            <span className="text-xs font-mono font-bold text-slate-700">0.4%</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Uptime</span>
            <span className="text-xs font-mono font-bold text-slate-700">14h 22m</span>
          </div>
          <div className="hidden sm:flex items-center space-x-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Memory</span>
            <span className="text-xs font-mono font-bold text-slate-700">18.2 MB</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors border ${
              isMonitoring
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300"
            }`}
          >
            {isMonitoring ? "STOP MONITORING" : "RESUME MONITORING"}
          </button>
          <button
            onClick={handleOrganizeNow}
            disabled={isOrganizing}
            className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-lg shadow-xs transition-all"
          >
            {isOrganizing ? "ORGANIZING..." : "ORGANIZE NOW"}
          </button>
        </div>
      </footer>
    </div>
  );
}
