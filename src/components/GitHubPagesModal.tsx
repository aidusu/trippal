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
          node-version: 22
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-[#183315] border border-[#305c2a] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-[#305c2a] flex items-center justify-between bg-[#122810]/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                發布至 GitHub Pages 與好友分享
              </h3>
              <p className="text-xs text-emerald-200/80">
                純前端純靜態網頁架構，支援隨處託管
              </p>
            </div>
          </div>
          <button
            id="btn-close-github-modal"
            onClick={onClose}
            className="p-2 text-emerald-200/80 hover:text-white rounded-lg hover:bg-[#234b1e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-emerald-100/90 leading-relaxed">
          {/* Quick Share Link */}
          <div className="p-3.5 bg-[#122810]/90 rounded-xl border border-[#2f5c29] space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>立即將本頁面分享給朋友</span>
              </span>
              <button
                id="btn-copy-app-link"
                onClick={() => copyText(currentUrl, 'url')}
                className="flex items-center gap-1 text-[11px] text-emerald-300 hover:text-white font-semibold transition-colors"
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
            <div className="p-2.5 bg-[#0e1f0c] rounded-lg text-emerald-200 font-mono text-[11px] truncate border border-[#2f5c29] select-all">
              {currentUrl}
            </div>
            <p className="text-[11px] text-emerald-200/70 leading-relaxed">
              好友只要用手機或電腦瀏覽器打開此網址，即可在同一個地圖上看到彼此！
            </p>
          </div>

          {/* Step by Step Deployment Guide */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>GitHub Actions 自動化部署</span>
            </h4>

            <div className="p-3.5 bg-[#0e1f0c] rounded-xl border border-[#2f5c29] space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-white font-semibold">
                <span>.github/workflows/deploy.yml (已預先配置 Node 22)</span>
                <button
                  type="button"
                  onClick={() => copyText(ghActionsYaml, 'yaml')}
                  className="flex items-center gap-1 text-[11px] text-emerald-300 hover:text-white font-semibold"
                >
                  {copiedSection === 'yaml' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>已複製！</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>複製設定檔</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 bg-[#081307] rounded-lg text-[11px] text-emerald-300 font-mono overflow-x-auto border border-[#23481f]">
                {ghActionsYaml}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
