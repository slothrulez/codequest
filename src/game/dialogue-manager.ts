import Phaser from 'phaser';
import type { NPCData } from './world-generator';
import type { RepoData } from '../analyzer/repo-analyzer';

declare global {
  interface Window {
    repoData: RepoData;
    workspaceRoot: string;
    vscode: any;
  }
}

export class DialogueManager {
  private scene: Phaser.Scene;
  private dialogueBox!: Phaser.GameObjects.Container;
  private isOpen = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(npc: NPCData, onClose: () => void) {
    if (this.isOpen) return;
    this.isOpen = true;

    const repoData = window.repoData as RepoData;
    let dialogue = this.getDialogue(npc, repoData);

    this.createDialogueBox(npc.name, dialogue, () => {
      this.isOpen = false;
      onClose();
    });
  }

  private getDialogue(npc: NPCData, repoData: RepoData): string {
    if (npc.type === 'elder') {
      if (repoData.git.hasMergeConflict) {
        return `Reality has collapsed.\nA merge conflict has occurred.\n\nYou must resolve the conflict before\nproceeding to the Git Shrine.`;
      } else if (!repoData.git.isClean) {
        return `Your working tree is tainted.\n\nYou must commit your changes\nbefore you may approach\nthe Git Shrine.`;
      } else if (repoData.git.isAheadOfRemote) {
        return `Your world is ahead of the\nremote dimension.\n\nYou are ready to synchronize\nwith the Git Shrine.`;
      } else {
        return `Welcome, developer.\n\nYour world is clean and\nsynchronized.\n\nWhat brings you here?`;
      }
    } else if (npc.type === 'shrine') {
      if (repoData.git.isClean) {
        return `You stand before the Git Shrine.\n\nWould you like to push your code?\n\n[E] to push\n[ESC] to cancel`;
      } else {
        return `The shrine is sealed.\n\nYou must first commit\nyour changes.`;
      }
    } else if (npc.type === 'folder') {
      const folderName = npc.name;
      return `📁 ${folderName}\n\nThis is a folder in your repository.\n\nIt contains the logic and structure\nfor this part of your project.`;
    } else {
      return `📄 ${npc.name}\n\nThis file contains your code.\n\nIt is part of your repository.`;
    }
  }

  private createDialogueBox(title: string, text: string, onClose: () => void) {
    const bg = this.scene.add.rectangle(480, 500, 800, 150, 0x1a1a1a, 0.95);
    const border = this.scene.add.rectangle(480, 500, 800, 150, 0x4dd0e1, 0);
    border.setStrokeStyle(2, 0x4dd0e1);

    const titleText = this.scene.add.text(60, 420, title, {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#4dd0e1',
      wordWrap: { width: 760 }
    });

    const dialogueText = this.scene.add.text(60, 460, text, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
      wordWrap: { width: 760 },
      lineSpacing: 4
    });

    const instructionText = this.scene.add.text(60, 570, '[SPACE or E to continue]', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#81c784',
    });

    this.dialogueBox = this.scene.add.container(0, 0, [bg, border, titleText, dialogueText, instructionText]);

    const handleInput = () => {
      this.dialogueBox.destroy();
      this.scene.input.keyboard?.off('keydown-SPACE');
      this.scene.input.keyboard?.off('keydown-E');
      onClose();
    };

    this.scene.input.keyboard?.on('keydown-SPACE', handleInput);
    this.scene.input.keyboard?.on('keydown-E', handleInput);
  }
}