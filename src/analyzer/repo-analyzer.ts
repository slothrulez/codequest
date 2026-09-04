import * as fs from 'fs';
import * as path from 'path';
import { simpleGit, SimpleGit } from 'simple-git';

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  size?: number;
  lines?: number;
}

export interface GitInfo {
  branch: string;
  isClean: boolean;
  uncommittedChanges: string[];
  untrackedFiles: string[];
  commits: CommitInfo[];
  isAheadOfRemote: boolean;
  isBehindRemote: boolean;
  hasMergeConflict: boolean;
}

export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export interface RepoData {
  name: string;
  root: string;
  structure: FileNode;
  git: GitInfo;
}

export class RepoAnalyzer {
  private git: SimpleGit;
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.git = simpleGit(workspaceRoot);
  }

  async analyze(): Promise<RepoData> {
    const [structure, git] = await Promise.all([
      this.analyzeStructure(),
      this.analyzeGit()
    ]);

    return {
      name: path.basename(this.workspaceRoot),
      root: this.workspaceRoot,
      structure,
      git
    };
  }

  private async analyzeStructure(
    dir: string = this.workspaceRoot,
    depth: number = 0,
    maxDepth: number = 4
  ): Promise<FileNode> {
    const name = path.basename(dir) || dir;
    
    if (depth > maxDepth) {
      return { name, type: 'folder', path: dir, children: [] };
    }

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const children: FileNode[] = [];

      for (const entry of entries) {
        if (['.git', 'node_modules', '.vscode', 'dist', 'build', '.next', 'out'].includes(entry.name)) {
          continue;
        }

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          const subdir = await this.analyzeStructure(fullPath, depth + 1, maxDepth);
          children.push(subdir);
        } else {
          const size = fs.statSync(fullPath).size;
          children.push({
            name: entry.name,
            type: 'file',
            path: fullPath,
            size
          });
        }
      }

      return {
        name,
        type: 'folder',
        path: dir,
        children
      };
    } catch (error) {
      return { name, type: 'folder', path: dir, children: [] };
    }
  }

  private async analyzeGit(): Promise<GitInfo> {
    try {
      const branch = await this.git.revparse(['--abbrev-ref', 'HEAD']);
      const status = await this.git.status();
      const log = await this.git.log({ maxCount: 20 });

      const commits: CommitInfo[] = log.all.map(commit => ({
        hash: commit.hash.substring(0, 7),
        message: commit.message,
        author: commit.author_name,
        date: commit.date
      }));

      let isAheadOfRemote = false;
      let isBehindRemote = false;
      
      try {
        const behind = await this.git.raw(['rev-list', '--count', 'HEAD..@{u}']);
        const ahead = await this.git.raw(['rev-list', '--count', '@{u}..HEAD']);
        isBehindRemote = parseInt(behind.trim()) > 0;
        isAheadOfRemote = parseInt(ahead.trim()) > 0;
      } catch {
        // No upstream
      }

      return {
        branch: branch.trim(),
        isClean: status.isClean(),
        uncommittedChanges: status.modified.concat(status.created),
        untrackedFiles: status.not_added,
        commits,
        isAheadOfRemote,
        isBehindRemote,
        hasMergeConflict: status.conflicted.length > 0
      };
    } catch (error) {
      console.error('Git analysis error:', error);
      return {
        branch: 'unknown',
        isClean: false,
        uncommittedChanges: [],
        untrackedFiles: [],
        commits: [],
        isAheadOfRemote: false,
        isBehindRemote: false,
        hasMergeConflict: false
      };
    }
  }
}