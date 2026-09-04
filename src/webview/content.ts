import * as vscode from 'vscode';
import * as path from 'path';
import type { RepoData } from '../analyzer/repo-analyzer';

export function getWebviewContent(
  webview: vscode.Webview,
  extensionPath: string,
  repoData: RepoData,
  workspaceRoot: string
): string {
  const gameUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(extensionPath, 'out/game.js'))
  );

  const repoDataJson = JSON.stringify(repoData);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CodeQuest</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          width: 100%;
          height: 100vh;
          background: #1a1a1a;
          font-family: 'Arial', sans-serif;
          overflow: hidden;
        }

        #game-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        canvas {
          image-rendering: pixelated;
          image-rendering: crisp-edges;
        }

        #ui {
          position: absolute;
          top: 10px;
          left: 10px;
          color: #fff;
          font-size: 14px;
          font-family: 'Courier New', monospace;
          background: rgba(0, 0, 0, 0.7);
          padding: 10px;
          border-radius: 4px;
          max-width: 300px;
          z-index: 10;
        }

        .repo-name {
          font-weight: bold;
          margin-bottom: 5px;
          color: #4dd0e1;
        }

        .git-status {
          font-size: 12px;
          margin-top: 5px;
          color: #81c784;
        }

        .git-dirty {
          color: #ff7043;
        }

        .git-clean {
          color: #81c784;
        }
      </style>
    </head>
    <body>
      <div id="game-container"></div>
      <div id="ui">
        <div class="repo-name">${escapeHtml(repoData.name)}</div>
        <div class="git-status">
          Branch: <strong>${escapeHtml(repoData.git.branch)}</strong>
        </div>
        <div class="git-status ${repoData.git.isClean ? 'git-clean' : 'git-dirty'}">
          ${repoData.git.isClean ? '✓ Clean' : '✗ Dirty'}
        </div>
        <div style="margin-top: 10px; font-size: 11px; opacity: 0.7;">
          WASD/Arrows to move<br>
          E to interact
        </div>
      </div>

      <script>
        window.repoData = ${repoDataJson};
        window.workspaceRoot = '${escapeHtml(workspaceRoot)}';
        const vscode = acquireVsCodeApi();
        window.vscode = vscode;
      </script>
      <script src="${gameUri}"></script>
    </body>
    </html>
  `;
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}