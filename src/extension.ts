import * as vscode from 'vscode';
import * as path from 'path';
import { RepoAnalyzer } from './analyzer/repo-analyzer';
import { getWebviewContent } from './webview/content';

let currentPanel: vscode.WebviewPanel | undefined;
let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel('CodeQuest');
    outputChannel.appendLine('CodeQuest extension activated');
    
    // Immediate visual confirmation
    vscode.window.showInformationMessage('CodeQuest extension activated!');

    // Test command registration
    const disposable = vscode.commands.registerCommand('codequest.enter', async () => {
        outputChannel.appendLine('CodeQuest: Enter Repository command triggered');
        
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            outputChannel.appendLine(`Workspace folders: ${workspaceFolders}`);

            if (!workspaceFolders) {
                vscode.window.showErrorMessage('CodeQuest requires an open workspace');
                return;
            }

            const workspaceRoot = workspaceFolders[0].uri.fsPath;
            outputChannel.appendLine(`Workspace root: ${workspaceRoot}`);

            const analyzer = new RepoAnalyzer(workspaceRoot);
            const repoData = await analyzer.analyze();
            outputChannel.appendLine(`Repo analyzed: ${repoData.name}`);

            // Destroy existing panel if any
            if (currentPanel) {
                currentPanel.dispose();
            }

            currentPanel = vscode.window.createWebviewPanel(
                'codequest',
                'CodeQuest',
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true,
                    localResourceRoots: [
                        vscode.Uri.file(path.join(context.extensionPath, 'out')),
                        vscode.Uri.file(path.join(context.extensionPath, 'node_modules'))
                    ]
                }
            );

            currentPanel.onDidDispose(() => {
                outputChannel.appendLine('CodeQuest panel disposed');
                currentPanel = undefined;
            });

            const html = getWebviewContent(
                currentPanel.webview,
                context.extensionPath,
                repoData,
                workspaceRoot
            );
            
            outputChannel.appendLine('Setting webview HTML...');
            currentPanel.webview.html = html;
            outputChannel.appendLine('Webview HTML set successfully');

        } catch (error) {
            outputChannel.appendLine(`CodeQuest error: ${error}`);
            vscode.window.showErrorMessage(`CodeQuest error: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    outputChannel.appendLine('Registering command subscription');
    context.subscriptions.push(disposable);
    
    // Also register a test command that's easier to trigger
    const testDisposable = vscode.commands.registerCommand('codequest.test', () => {
        outputChannel.appendLine('CodeQuest test command triggered');
        vscode.window.showInformationMessage('CodeQuest test works!');
    });
    context.subscriptions.push(testDisposable);
}

export function deactivate() {
    outputChannel.appendLine('CodeQuest extension deactivated');
    if (currentPanel) {
        currentPanel.dispose();
    }
}