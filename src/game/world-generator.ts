import Phaser from 'phaser';
import type { RepoData, FileNode } from '../analyzer/repo-analyzer';

export interface NPCData {
  x: number;
  y: number;
  name: string;
  type: 'folder' | 'file' | 'elder' | 'shrine';
  data?: any;
}

export interface WorldData {
  width: number;
  height: number;
  playerStart: { x: number; y: number };
  npcs: NPCData[];
}

export class WorldGenerator {
  private repoData: RepoData;
  private nextX = 10;
  private nextY = 10;

  constructor(_scene: Phaser.Scene, repoData: RepoData) {
    this.repoData = repoData;
  }

  generate(): WorldData {
    const npcs: NPCData[] = [];

    this.traverseStructure(this.repoData.structure, npcs);
    this.addSpecialLocation('Elder', 'elder', npcs);
    this.addSpecialLocation('Git Shrine', 'shrine', npcs);

    const width = Math.max(this.nextX + 5, 50);
    const height = Math.max(this.nextY + 5, 40);

    return {
      width,
      height,
      playerStart: { x: 15 * 32, y: 15 * 32 },
      npcs
    };
  }

  private traverseStructure(node: FileNode, npcs: NPCData[], depth: number = 0) {
    if (node.type === 'folder') {
      const npc: NPCData = {
        x: this.nextX * 32,
        y: this.nextY * 32,
        name: node.name,
        type: 'folder',
        data: { path: node.path }
      };
      npcs.push(npc);
      this.nextY += 2;

      if (node.children) {
        for (const child of node.children) {
          if (child.type === 'folder') {
            this.traverseStructure(child, npcs, depth + 1);
          } else {
            const fileNpc: NPCData = {
              x: (this.nextX + 1) * 32,
              y: this.nextY * 32,
              name: child.name,
              type: 'file',
              data: { path: child.path, size: child.size }
            };
            npcs.push(fileNpc);
            this.nextY += 1;
          }
        }
      }

      this.nextY += 1;
    }
  }

  private addSpecialLocation(name: string, type: 'elder' | 'shrine', npcs: NPCData[]): { x: number; y: number } {
    const x = this.nextX * 32;
    const y = this.nextY * 32;

    npcs.push({
      x,
      y,
      name,
      type,
      data: {}
    });

    this.nextY += 2;

    return { x, y };
  }
}