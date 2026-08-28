import React, { useState } from 'react';
import {
  X,
  Github,
  Globe,
  Copy,
  CheckCircle2,
  Terminal,
  Share2,
  ExternalLink,
  Code2,
  Layers,
} from 'lucide-react';

interface GitHubPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubPagesModal: React.FC<GitHubPagesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const copyText = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const ghActionsYaml = `name: Deploy to GitHub Pages

on:
  push:
    branches: ['main']

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

  const bashCommands = `# 1. 安裝 gh-pages 套件 (若手動發布)
npm install --save-dev gh-pages

# 2. 建置靜態檔案
npm run build

# 3. 發布至 GitHub Pages 的 gh-pages 分支
npx gh-pages -d dist
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                發布至 GitHub Pages 與好友分享
              </h3>
              <p className="text-xs text-slate-400">
                純前端純靜態網頁架構，支援隨處託管
              </p>
            </div>
          </div>
          <button
            id="btn-close-github-modal"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300">
          {/* Quick Share Link */}
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>立即將本頁面分享給朋友</span>
              </span>
              <button
                id="btn-copy-app-link"
                onClick={() => copyText(currentUrl, 'url')}
                className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
              >
                {copiedSection === 'url' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>已複製網址！</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>複製網址</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-lg text-slate-300 font-mono text-[11px] truncate border border-slate-800 select-all">
              {currentUrl}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              好友只要用手機或電腦瀏覽器打開此網址，即可在同一個地圖上看到彼此！
            </p>
          </div>

          {/* Step by Step Deployment Guide */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>發布到自己的 GitHub Pages 步驟</span>
            </h4>

            {/* Method A: GitHub Actions (Recommended) */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-slate-200 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>方法一：使用 GitHub Actions 自動發布（最推薦）</span>
                </span>
                <button
                  id="btn-copy-yaml"
                  onClick={() => copyText(ghActionsYaml, 'yaml')}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  {copiedSection === 'yaml' ? '已複製！' : '複製 YAML 設定檔'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                在專案根目錄建立 <code className="text-emerald-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">.github/workflows/deploy.yml</code>，將以下設定貼上。至 GitHub Repo 的 Settings &gt; Pages 中，將 Source 選擇為 <b>GitHub Actions</b> 即可自動建置發布！
              </p>
              <pre className="p-2.5 bg-slate-900 rounded-lg font-mono text-[10px] text-indigo-300 max-h-36 overflow-y-auto border border-slate-800">
                {ghActionsYaml}
              </pre>
            </div>

            {/* Method B: Quick gh-pages CLI */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-slate-200 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  <span>方法二：使用 gh-pages 指令一鍵上傳</span>
                </span>
                <button
                  id="btn-copy-cli"
                  onClick={() => copyText(bashCommands, 'cli')}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium transition-colors"
                >
                  {copiedSection === 'cli' ? '已複製！' : '複製指令'}
                </button>
              </div>
              <pre className="p-2.5 bg-slate-900 rounded-lg font-mono text-[11px] text-amber-300 overflow-x-auto border border-slate-800">
                {bashCommands}
              </pre>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-950/30 rounded-xl border border-emerald-800/40 text-[11px] text-emerald-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>已預先設定好 vite.config.ts 的 base: './'</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              打包後的靜態資源會自動使用相對路徑，部署至 <code className="text-emerald-300 font-mono">https://yourname.github.io/your-repo/</code> 絕不會發生 404 資源缺失問題。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/50 flex justify-end">
          <button
            id="btn-close-github-modal-footer"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800/80 hover:bg-slate-750 text-slate-100 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/80 transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
